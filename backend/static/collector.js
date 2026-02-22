/**
 * Behavioral Data Collector — Lightweight browser instrumentation
 * 
 * Embed this script in internal pages to collect user behavioral patterns
 * for spear-phishing risk assessment. Tracks navigation, clicks, typing
 * cadence, and session patterns — NO sensitive content is captured.
 * 
 * Usage:
 *   <script src="http://localhost:8000/api/collector/script.js"
 *           data-endpoint="http://localhost:8000/api/collect"
 *           data-user-id="employee_123"
 *           data-api-key="your-api-key"></script>
 * 
 * Security:
 *   - Only behavioral metadata is captured (timing, element types, patterns)
 *   - No keystroke content, form values, or clipboard content is recorded
 *   - All data is sent over the configured endpoint with API key auth
 */
(function() {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────
  const script = document.currentScript;
  const CONFIG = {
    endpoint: script?.getAttribute('data-endpoint') || '/api/collect',
    userId: script?.getAttribute('data-user-id') || 'anonymous_' + Math.random().toString(36).substr(2, 8),
    apiKey: script?.getAttribute('data-api-key') || '',
    batchInterval: 10000,   // Send events every 10 seconds
    heartbeatInterval: 30000, // Focus heartbeat every 30 seconds
    maxBatchSize: 50,
  };

  const SESSION_ID = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  let eventQueue = [];
  let isPageVisible = true;
  let focusStartTime = Date.now();
  let lastActivityTime = Date.now();

  // ── Utility ────────────────────────────────────────────────────
  function now() {
    return new Date().toISOString();
  }

  function safeElementInfo(el) {
    if (!el || !el.tagName) return { tag: 'unknown' };
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: (typeof el.className === 'string' ? el.className : '').substring(0, 50) || undefined,
      type: el.type || undefined,
    };
  }

  function enqueue(type, data) {
    eventQueue.push({
      type: type,
      data: data || {},
      url: window.location.pathname,
      timestamp: now(),
    });

    // Flush if batch is full
    if (eventQueue.length >= CONFIG.maxBatchSize) {
      flush();
    }
  }

  // ── Flush events to server ─────────────────────────────────────
  function flush() {
    if (eventQueue.length === 0) return;

    const batch = eventQueue.splice(0, CONFIG.maxBatchSize);
    const payload = {
      user_id: CONFIG.userId,
      session_id: SESSION_ID,
      events: batch,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (CONFIG.apiKey) {
      headers['X-API-Key'] = CONFIG.apiKey;
    }

    // Use sendBeacon for reliability on page unload, fetch otherwise
    if (navigator.sendBeacon && document.visibilityState === 'hidden') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(CONFIG.endpoint, blob);
    } else {
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function(err) {
        // Silently fail — don't disrupt the user's experience
        console.debug('[Collector] Send failed:', err.message);
      });
    }
  }

  // ── Event Listeners ────────────────────────────────────────────

  // 1. Session start
  enqueue('session_start', {
    referrer: document.referrer || '',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    userAgent: navigator.userAgent.substring(0, 100),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // 2. Page view
  enqueue('page_view', {
    title: document.title.substring(0, 80),
    referrer: document.referrer || '',
  });

  // 3. Click tracking
  document.addEventListener('click', function(e) {
    lastActivityTime = Date.now();
    enqueue('click', {
      target: safeElementInfo(e.target),
      x: e.clientX,
      y: e.clientY,
    });
  }, { passive: true, capture: true });

  // 4. Typing cadence (timing only — NO keystroke content)
  let keystrokeTimes = [];
  document.addEventListener('keydown', function(e) {
    lastActivityTime = Date.now();
    keystrokeTimes.push(Date.now());

    // Emit cadence event every 20 keystrokes
    if (keystrokeTimes.length >= 20) {
      const intervals = [];
      for (let i = 1; i < keystrokeTimes.length; i++) {
        intervals.push(keystrokeTimes[i] - keystrokeTimes[i - 1]);
      }
      const avg = intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length;
      const min = Math.min.apply(null, intervals);
      const max = Math.max.apply(null, intervals);

      enqueue('typing_cadence', {
        sampleSize: keystrokeTimes.length,
        avgIntervalMs: Math.round(avg),
        minIntervalMs: min,
        maxIntervalMs: max,
        targetTag: document.activeElement ? document.activeElement.tagName.toLowerCase() : 'unknown',
      });
      keystrokeTimes = [];
    }
  }, { passive: true, capture: true });

  // 5. Copy/paste detection (occurrence only, NOT content)
  document.addEventListener('copy', function() {
    lastActivityTime = Date.now();
    enqueue('copy_event', {});
  }, { passive: true });

  document.addEventListener('paste', function() {
    lastActivityTime = Date.now();
    enqueue('paste_event', {});
  }, { passive: true });

  // 6. Focus/visibility tracking
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      var focusDuration = Date.now() - focusStartTime;
      enqueue('focus_lost', { durationMs: focusDuration });
      isPageVisible = false;
      flush(); // Send data when leaving
    } else {
      focusStartTime = Date.now();
      isPageVisible = true;
      enqueue('focus_gained', {});
    }
  });

  // 7. Focus time heartbeat
  setInterval(function() {
    if (isPageVisible) {
      enqueue('focus_heartbeat', {
        focusDurationMs: Date.now() - focusStartTime,
        idleMs: Date.now() - lastActivityTime,
      });
    }
  }, CONFIG.heartbeatInterval);

  // 8. Navigation tracking (SPA-friendly)
  var lastPathname = window.location.pathname;
  var observer = new MutationObserver(function() {
    if (window.location.pathname !== lastPathname) {
      enqueue('navigation', {
        from: lastPathname,
        to: window.location.pathname,
      });
      lastPathname = window.location.pathname;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also catch popstate for back/forward
  window.addEventListener('popstate', function() {
    if (window.location.pathname !== lastPathname) {
      enqueue('navigation', {
        from: lastPathname,
        to: window.location.pathname,
      });
      lastPathname = window.location.pathname;
    }
  });

  // 9. Session end on unload
  window.addEventListener('beforeunload', function() {
    enqueue('session_end', {
      totalDurationMs: Date.now() - focusStartTime,
    });
    flush();
  });

  // ── Periodic flush ─────────────────────────────────────────────
  setInterval(flush, CONFIG.batchInterval);

  console.debug('[Collector] Initialized — user:', CONFIG.userId, 'session:', SESSION_ID);
})();
