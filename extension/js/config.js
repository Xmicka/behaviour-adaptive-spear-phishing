/**
 * Extension Configuration
 *
 * Centralized settings for the behavioral data collector.
 * Admin can override these via chrome.storage.sync by setting:
 *   { collectorEndpoint, userId, apiKey }
 *
 * Defaults work for local development out of the box.
 */
const EXT_CONFIG = {
    /** Backend collector endpoint — POST /api/collect */
    COLLECTOR_ENDPOINT: 'http://localhost:8000/api/collect',

    /** User identifier — should be set per-employee (hashed email or UID) */
    USER_ID: '',

    /** Optional API key for authenticated collection */
    API_KEY: '',

    /** Seconds between batch flushes */
    BATCH_INTERVAL_SEC: 10,

    /** Max events per HTTP request */
    MAX_BATCH_SIZE: 50,

    /** Heartbeat interval in seconds */
    HEARTBEAT_INTERVAL_SEC: 30,

    /** Extension version for debugging */
    VERSION: '1.0.0',
};

// Merge any admin overrides from chrome.storage.sync
(function loadOverrides() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(
            ['collectorEndpoint', 'userId', 'apiKey'],
            function (items) {
                if (items.collectorEndpoint) EXT_CONFIG.COLLECTOR_ENDPOINT = items.collectorEndpoint;
                if (items.userId) EXT_CONFIG.USER_ID = items.userId;
                if (items.apiKey) EXT_CONFIG.API_KEY = items.apiKey;
            }
        );
    }
})();
