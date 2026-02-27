/**
 * Service Worker — Background Event Batcher & Sender
 *
 * Receives events from content scripts, batches them, and POSTs
 * to the backend /api/collect endpoint on a timer.
 *
 * Uses chrome.alarms for reliable periodic flushing (Manifest V3
 * service workers can be suspended between alarms).
 *
 * Also tracks tab navigation events (URL changes across all tabs)
 * which content scripts cannot observe cross-tab.
 */

// ── Default Config (overridden from chrome.storage.sync) ─────────
let CONFIG = {
    COLLECTOR_ENDPOINT: 'http://localhost:8000/api/collect',
    USER_ID: '',
    API_KEY: '',
    MAX_BATCH_SIZE: 50,
};

// Backoff state for retry logic
let consecutiveFailures = 0;
const MAX_BACKOFF_MINUTES = 5;

// Session ID — unique per service worker lifecycle
const SESSION_ID = 'ext_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);

// Event queue persisted in chrome.storage.local for crash resilience
let eventQueue = [];

// ── Load Config ──────────────────────────────────────────────────

async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            ['collectorEndpoint', 'userId', 'apiKey'],
            (items) => {
                if (items.collectorEndpoint) CONFIG.COLLECTOR_ENDPOINT = items.collectorEndpoint;
                if (items.userId) CONFIG.USER_ID = items.userId;
                if (items.apiKey) CONFIG.API_KEY = items.apiKey;
                resolve();
            }
        );
    });
}

/** Get effective user ID — from config, or generate a stable anonymous one */
async function getEffectiveUserId() {
    if (CONFIG.USER_ID) return CONFIG.USER_ID;

    // Check for a previously generated anonymous ID
    return new Promise((resolve) => {
        chrome.storage.local.get(['generatedUserId'], (items) => {
            if (items.generatedUserId) {
                CONFIG.USER_ID = items.generatedUserId;
                resolve(items.generatedUserId);
            } else {
                const id = 'ext_user_' + Math.random().toString(36).substr(2, 10);
                chrome.storage.local.set({ generatedUserId: id });
                CONFIG.USER_ID = id;
                resolve(id);
            }
        });
    });
}

// ── Event Queue Management ───────────────────────────────────────

/** Restore queue from storage (crash resilience) */
async function restoreQueue() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['eventQueue'], (items) => {
            if (items.eventQueue && Array.isArray(items.eventQueue)) {
                eventQueue = items.eventQueue;
            }
            resolve();
        });
    });
}

/** Persist queue to storage */
function persistQueue() {
    chrome.storage.local.set({ eventQueue: eventQueue.slice(0, 200) });
}

/** Add event to queue */
function enqueueEvent(event) {
    eventQueue.push(event);

    // Auto-flush if batch is full
    if (eventQueue.length >= CONFIG.MAX_BATCH_SIZE) {
        flushEvents();
    } else {
        persistQueue();
    }
}

// ── Flush to Backend ─────────────────────────────────────────────

async function flushEvents() {
    if (eventQueue.length === 0) return;

    await loadConfig();
    const userId = await getEffectiveUserId();

    const batch = eventQueue.splice(0, CONFIG.MAX_BATCH_SIZE);
    persistQueue();

    const payload = {
        user_id: userId,
        session_id: SESSION_ID,
        events: batch,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (CONFIG.API_KEY) {
        headers['X-API-Key'] = CONFIG.API_KEY;
    }

    try {
        const response = await fetch(CONFIG.COLLECTOR_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Put events back on failure
            eventQueue = batch.concat(eventQueue);
            persistQueue();
            consecutiveFailures++;
            console.debug('[AdaptiveSec] Flush failed:', response.status, '(attempt', consecutiveFailures + ')');
        } else {
            const result = await response.json();
            consecutiveFailures = 0;
            console.debug('[AdaptiveSec] Flushed', result.events_received, 'events');
        }
    } catch (err) {
        // Network error — put events back for retry with backoff
        eventQueue = batch.concat(eventQueue);
        persistQueue();
        consecutiveFailures++;
        console.debug('[AdaptiveSec] Network error (attempt', consecutiveFailures + '), will retry:', err.message);
    }
}

// ── Message Handler (from content scripts) ───────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'COLLECT_EVENT' && message.event) {
        // Enrich event with tab context
        const event = message.event;
        if (sender.tab) {
            event.tabId = sender.tab.id;
        }
        enqueueEvent(event);
        sendResponse({ ok: true });
    }
    return false; // Synchronous response
});

// ── Tab Navigation Tracking ──────────────────────────────────────

let tabUrls = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            const url = new URL(tab.url);
            // Only track http/https (skip chrome://, extension://, etc.)
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                const previousUrl = tabUrls[tabId];
                const currentPath = url.pathname + url.search;

                if (previousUrl && previousUrl !== currentPath) {
                    enqueueEvent({
                        type: 'navigation',
                        data: {
                            from: previousUrl,
                            to: currentPath,
                            domain: url.hostname,
                        },
                        url: currentPath,
                        domain: url.hostname,
                        timestamp: new Date().toISOString(),
                    });
                }
                tabUrls[tabId] = currentPath;
            }
        } catch (e) {
            // Invalid URL — skip
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabUrls[tabId];
});

// ── Alarm-Based Periodic Flush ───────────────────────────────────
// Chrome enforces minimum alarm period of 30 seconds

function scheduleFlushAlarm() {
    // Exponential backoff: 0.5 min base, doubles on failure, capped at MAX_BACKOFF_MINUTES
    const backoffMinutes = consecutiveFailures > 0
        ? Math.min(0.5 * Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF_MINUTES)
        : 0.5; // 30 seconds base
    chrome.alarms.create('flush-events', { periodInMinutes: backoffMinutes });
}

scheduleFlushAlarm();

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'flush-events') {
        flushEvents().then(() => {
            // Re-schedule with updated backoff if needed
            if (consecutiveFailures > 0) {
                scheduleFlushAlarm();
            }
        });
    }
});

// ── First-Run Setup ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await loadConfig();
        await getEffectiveUserId();
        console.debug('[AdaptiveSec] Extension installed — user:', CONFIG.USER_ID);
    } else if (details.reason === 'update') {
        console.debug('[AdaptiveSec] Extension updated to', chrome.runtime.getManifest().version);
    }
});

// ── Initialization ───────────────────────────────────────────────

(async function init() {
    await loadConfig();
    await getEffectiveUserId();
    await restoreQueue();

    // Flush any queued events from before suspension
    if (eventQueue.length > 0) {
        flushEvents();
    }

    console.debug('[AdaptiveSec] Service worker initialized — user:', CONFIG.USER_ID, 'session:', SESSION_ID);
})();
