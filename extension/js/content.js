/**
 * Content Script — Behavioral Event Collector
 *
 * Injected into every HTTP/HTTPS page. Captures metadata-level behavioral
 * patterns and sends them to the service worker for batching and delivery.
 *
 * PRIVACY GUARANTEES:
 *   ✓ No keystroke content captured (only timing intervals)
 *   ✓ No form values or passwords captured
 *   ✓ No clipboard content captured (only copy/paste occurrence)
 *   ✓ No screenshots or DOM content captured
 *   ✓ Only element metadata (tag, id, class) for click context
 */
(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────
    let focusStartTime = Date.now();
    let lastActivityTime = Date.now();
    let keystrokeTimes = [];
    let isPageVisible = !document.hidden;

    // Burst detection logic
    const BURST_KEY = 'shield360_page_views';
    const BURST_WINDOW_MS = (typeof EXT_CONFIG !== 'undefined' ? EXT_CONFIG.TAB_BURST_WINDOW_SEC : 60) * 1000;
    const BURST_THRESHOLD = typeof EXT_CONFIG !== 'undefined' ? EXT_CONFIG.TAB_BURST_THRESHOLD : 15;

    // ── Utilities ──────────────────────────────────────────────────

    function now() {
        return new Date().toISOString();
    }

    /** Safely parse hostname from referrer */
    function safeReferrerHost() {
        try {
            return document.referrer ? new URL(document.referrer).hostname : '';
        } catch (e) {
            return '';
        }
    }

    /** Extract safe, non-sensitive element metadata */
    function safeElementInfo(el) {
        if (!el || !el.tagName) return { tag: 'unknown' };
        return {
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            className: (typeof el.className === 'string' ? el.className : '').substring(0, 50) || undefined,
            type: el.type || undefined,
        };
    }

    /** Send a single event to the service worker for batching */
    function emit(type, data) {
        try {
            chrome.runtime.sendMessage({
                action: 'COLLECT_EVENT',
                event: {
                    type: type,
                    data: data || {},
                    url: window.location.pathname + window.location.search,
                    domain: window.location.hostname,
                    timestamp: now(),
                },
            });
        } catch (e) {
            // Extension context invalidated (e.g. extension reloaded) — silently ignore
        }
    }

    // ── Event Listeners ────────────────────────────────────────────

    // 1. Session start
    emit('session_start', {
        referrer: safeReferrerHost(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // 2. Page view (with burst detection)
    function trackPageView() {
        emit('page_view', {
            title: document.title.substring(0, 80),
            referrer: safeReferrerHost(),
        });

        // Simple local storage based burst detection for new tabs/navs
        try {
            const nowMs = Date.now();
            let views = JSON.parse(localStorage.getItem(BURST_KEY) || '[]');

            // Filter old
            views = views.filter(t => nowMs - t < BURST_WINDOW_MS);
            views.push(nowMs);

            localStorage.setItem(BURST_KEY, JSON.stringify(views));

            if (views.length > BURST_THRESHOLD) {
                emit('unusual_browser_activity', {
                    reason: 'rapid_tab_creation',
                    count: views.length,
                    windowSeconds: BURST_WINDOW_MS / 1000
                });
                // Reset to avoid spam
                localStorage.removeItem(BURST_KEY);
            }
        } catch (e) {
            // Ignore Storage quota/access issues
        }
    }
    trackPageView();

    // 3. Click tracking — element metadata only
    document.addEventListener(
        'click',
        function (e) {
            lastActivityTime = Date.now();
            emit('click', {
                target: safeElementInfo(e.target),
                x: e.clientX,
                y: e.clientY,
            });
        },
        { passive: true, capture: true }
    );

    // 4. Typing cadence — timing intervals ONLY, NO keystroke content
    document.addEventListener(
        'keydown',
        function () {
            lastActivityTime = Date.now();
            keystrokeTimes.push(Date.now());

            if (keystrokeTimes.length >= 20) {
                var intervals = [];
                for (var i = 1; i < keystrokeTimes.length; i++) {
                    intervals.push(keystrokeTimes[i] - keystrokeTimes[i - 1]);
                }
                var avg = intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length;

                emit('typing_cadence', {
                    sampleSize: keystrokeTimes.length,
                    avgIntervalMs: Math.round(avg),
                    minIntervalMs: Math.min.apply(null, intervals),
                    maxIntervalMs: Math.max.apply(null, intervals),
                    targetTag: document.activeElement ? document.activeElement.tagName.toLowerCase() : 'unknown',
                });
                keystrokeTimes = [];
            }
        },
        { passive: true, capture: true }
    );

    // 5. Copy/paste occurrence — NO content captured
    document.addEventListener('copy', function () {
        lastActivityTime = Date.now();
        emit('copy_event', {});
    }, { passive: true });

    document.addEventListener('paste', function () {
        lastActivityTime = Date.now();
        emit('paste_event', {});
    }, { passive: true });

    // 6. Focus / visibility tracking
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            var focusDuration = Date.now() - focusStartTime;
            emit('focus_lost', { durationMs: focusDuration });
            isPageVisible = false;
        } else {
            focusStartTime = Date.now();
            isPageVisible = true;
            emit('focus_gained', {});
        }
    });

    // 7. Login form detection — captures ONLY domain and action URL, NEVER credentials
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM') return;

        // Only emit if the form contains a password input
        var hasPassword = form.querySelector('input[type="password"]');
        if (!hasPassword) return;

        lastActivityTime = Date.now();
        var actionUrl = '';
        try {
            actionUrl = form.action ? new URL(form.action, window.location.href).hostname : window.location.hostname;
        } catch (err) {
            actionUrl = window.location.hostname;
        }

        emit('login_attempt', {
            formAction: actionUrl,
            formMethod: (form.method || 'GET').toUpperCase(),
            domain: window.location.hostname,
            inputCount: form.querySelectorAll('input').length,
        });
    }, { capture: true });

    // 8. SPA hash-change navigation tracking
    var lastHash = window.location.hash;
    window.addEventListener('hashchange', function () {
        var newHash = window.location.hash;
        if (newHash !== lastHash) {
            emit('navigation', {
                from: window.location.pathname + lastHash,
                to: window.location.pathname + newHash,
                domain: window.location.hostname,
            });
            lastHash = newHash;
        }
    });

    // 9. Focus heartbeat — tracks active engagement
    setInterval(function () {
        if (isPageVisible) {
            emit('focus_heartbeat', {
                focusDurationMs: Date.now() - focusStartTime,
                idleMs: Date.now() - lastActivityTime,
            });
        }
    }, 30000);

    // 10. Session end on page unload
    window.addEventListener('beforeunload', function () {
        emit('session_end', {
            totalDurationMs: Date.now() - focusStartTime,
        });
    });
})();
