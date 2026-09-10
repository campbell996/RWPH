// ==UserScript==
// @name         RWPH - Ranked War Payout Helper
// @namespace    https://www.torn.com/
// @version      3.5.0
// @description  Complete RWPH release with Basic/Advanced ranked-war payouts, secure cloud licensing, guided manual payments, caching, exports/recovery, responsive UI, and final v3.5 stability/security hardening.
// @author       BackFromTheDead Gaming
// @match        https://www.torn.com/factions.php*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @connect      api.torn.com
// @connect      localhost
// @connect      127.0.0.1
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    const APP = {
        name: 'RWPH',
        fullName: 'Ranked War Payout Helper',
        version: '3.5.0',
        apiBase: 'https://api.torn.com/v2',
        apiComment: 'RWPH-v3.5.0',
    };

    const KEYS = {
        apiKey: 'rwph_api_key',
        manualStart: 'rwph_manual_start',
        manualEnd: 'rwph_manual_end',
        selectedWarId: 'rwph_selected_war_id',
        basicPayPerHit: 'rwph_basic_pay_per_hit',
        basicPayoutPool: 'rwph_basic_payout_pool',
        payoutMode: 'rwph_payout_mode',
        advancedPayoutPool: 'rwph_advanced_payout_pool',
        advancedWarHitWeight: 'rwph_advanced_war_hit_weight',
        advancedOutsideHitWeight: 'rwph_advanced_outside_hit_weight',
        advancedRetalWeight: 'rwph_advanced_retal_weight',
        advancedAssistWeight: 'rwph_advanced_assist_weight',
        advancedOwnHospitalWeight: 'rwph_advanced_own_hospital_weight',
        advancedEnemyHospitalWeight: 'rwph_advanced_enemy_hospital_weight',
        advancedFairFightEnabled: 'rwph_advanced_fair_fight_enabled',
        advancedFairFightStart: 'rwph_advanced_fair_fight_start',
        advancedFairFightStep: 'rwph_advanced_fair_fight_step',
        advancedFairFightBonus: 'rwph_advanced_fair_fight_bonus',
        advancedFairFightCap: 'rwph_advanced_fair_fight_cap',
        memberManagement: 'rwph_member_management_v1_5',
        basicReportCache: 'rwph_basic_report_cache_v1_7',
        advancedReportCache: 'rwph_advanced_report_cache_v1_7',
        pendingPayment: 'rwph_pending_payment_v2_2',
        paymentReturnSnapshot: 'rwph_payment_return_snapshot_v2_2',
        backendUrl: 'rwph_backend_url_v2_4',
        licenceSession: 'rwph_licence_session_v2_4',
        licencePurchase: 'rwph_licence_purchase_v2_5',
        adminKey: 'rwph_admin_key_v2_6',
        themeAccent: 'rwph_theme_accent_v3_0',
        themePanel: 'rwph_theme_panel_v3_0',
        themeButton: 'rwph_theme_button_v3_0',
        themeHighlight: 'rwph_theme_highlight_v3_0',
        payoutPresets: 'rwph_payout_presets_v3_1',
        presetPoolMembers: 'rwph_preset_pool_members_v3_1',
        presetPoolFaction: 'rwph_preset_pool_faction_v3_1',
        reportFilters: 'rwph_report_filters_v3_2',
        exportColumns: 'rwph_export_columns_v3_3',
        exportFormat: 'rwph_export_format_v3_3',
        exportScope: 'rwph_export_scope_v3_3',
        sessionRecovery: 'rwph_session_recovery_v3_3',
        installedVersion: 'rwph_installed_version_v3_4',
        settingsSchema: 'rwph_settings_schema_v3_4',
        migrationLog: 'rwph_migration_log_v3_4',
    };

    const state = {
        open: false,
        tab: 'war',
        busy: false,
        faction: null,
        wars: [],
        selectedWar: null,
        selectedWarReport: null,
        attacks: [],
        incomingAttacks: [],
        reportRows: [],
        includedMembers: new Set(),
        advancedIncludedMembers: new Set(),
        payoutMode: 'basic',
        memberAdjustments: {},
        memberAdjustmentsExpiresAt: 0,
        reportSort: { key: 'warHits', direction: 'desc' },
        activeCachedReport: null,
        liveStateBeforeCache: null,
        reportLoading: null,
        reportLoadingTimer: null,
        apiReliability: null,
        lastStatus: 'Ready.',
        paymentSessions: new Map(),
        identity: null,
        licence: { status: 'unchecked', checking: false, message: 'Licence has not been checked yet.', tornId: 0, name: '', factionId: 0, expiresAt: 0, token: '', requestKey: '', sessionId: '', checkedAt: 0 },
        licencePurchase: null,
        protectedCalculation: null,
        backendHealth: { status: 'unchecked', message: 'Backend has not been tested yet.', version: '', apiVersion: '', dbSchema: '', dbLatencyMs: 0, checkedAt: 0 },
        admin: { verified: false, message: 'Admin key has not been verified yet.', results: [], summary: { total: 0, active: 0, expired: 0, revoked: 0 }, query: '', status: 'all' },
        reportFilters: { included: true, excluded: true, unselected: true, minHits: 0, minRespect: 0, minPayout: 0, name: '', tornId: '', contribution: 'all' },
        recoveryPromptHidden: false,
        buildInProgress: false,
        warLoadInProgress: false,
        updateInfo: { previousVersion: '', currentVersion: APP.version, upgraded: false, migrations: [] },
        performance: { lastClassifyMs: 0, lastReportMs: 0, outgoingAttacks: 0, incomingAttacks: 0, rawAttacksReleased: 0 },
    };

    const MEMBER_MANAGEMENT_TTL_MS = 20 * 60 * 1000;
    const REPORT_CACHE_TTL_MS = 10 * 60 * 1000;
    const PENDING_PAYMENT_TTL_MS = 5 * 60 * 1000;
    const PAYMENT_RETURN_TTL_MS = 10 * 60 * 1000;
    const SESSION_RECOVERY_TTL_MS = 24 * 60 * 60 * 1000;
    const LICENCE_SESSION_TTL_MS = 30 * 60 * 1000;
    const LICENCE_PURCHASE_TTL_MS = 15 * 60 * 1000;
    const XANAX_LICENCE_DAYS = 15;
    const DEFAULT_BACKEND_URL = 'https://YOUR-RWPH-WORKER.YOUR-SUBDOMAIN.workers.dev';
    const BACKEND_TIMEOUT_MS = 15000;
    const BACKEND_API_VERSION = '2.8';
    const MIN_BACKEND_VERSION = '2.8.0';
    const MIN_DATABASE_SCHEMA = '2.8.0';
    const SETTINGS_SCHEMA_VERSION = 3;
    const REPORT_CACHE_SCHEMA_VERSION = 2;
    const RECOVERY_SCHEMA_VERSION = 2;
    const PAYMENT_RETURN_SCHEMA_VERSION = 2;
    const CLASSIFY_YIELD_EVERY = 1200;
    const BACKEND_DEFAULT_RETRIES = 2;
    const BACKEND_MAX_RETRY_DELAY_MS = 10000;
    const DEFAULT_THEME = Object.freeze({
        accent: '#d08a2d',
        panel: '#17191d',
        button: '#2b2f36',
        highlight: '#3a2b1c',
    });

    function normalizeThemeColor(value, fallback) {
        const text = String(value || '').trim();
        return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
    }

    function shadeThemeColor(hex, percent = 0) {
        const color = normalizeThemeColor(hex, '#17191d').slice(1);
        const amount = Math.max(-100, Math.min(100, Number(percent) || 0)) / 100;
        const channels = [0, 2, 4].map(index => parseInt(color.slice(index, index + 2), 16));
        const adjusted = channels.map(channel => Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount)));
        return `#${adjusted.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
    }

    function themeRgb(hex) {
        const color = normalizeThemeColor(hex, DEFAULT_THEME.accent).slice(1);
        return `${parseInt(color.slice(0,2),16)}, ${parseInt(color.slice(2,4),16)}, ${parseInt(color.slice(4,6),16)}`;
    }

    function getThemeSettings() {
        return {
            accent: normalizeThemeColor(gm.get(KEYS.themeAccent, DEFAULT_THEME.accent), DEFAULT_THEME.accent),
            panel: normalizeThemeColor(gm.get(KEYS.themePanel, DEFAULT_THEME.panel), DEFAULT_THEME.panel),
            button: normalizeThemeColor(gm.get(KEYS.themeButton, DEFAULT_THEME.button), DEFAULT_THEME.button),
            highlight: normalizeThemeColor(gm.get(KEYS.themeHighlight, DEFAULT_THEME.highlight), DEFAULT_THEME.highlight),
        };
    }

    function applyTheme(theme = getThemeSettings()) {
        const root = document.documentElement;
        if (!root) return theme;
        const panel = normalizeThemeColor(theme.panel, DEFAULT_THEME.panel);
        const button = normalizeThemeColor(theme.button, DEFAULT_THEME.button);
        const accent = normalizeThemeColor(theme.accent, DEFAULT_THEME.accent);
        const highlight = normalizeThemeColor(theme.highlight, DEFAULT_THEME.highlight);
        const vars = {
            '--rwph-bg': panel,
            '--rwph-bg2': shadeThemeColor(panel, 7),
            '--rwph-bg3': shadeThemeColor(panel, 13),
            '--rwph-line': shadeThemeColor(panel, 24),
            '--rwph-panel': panel,
            '--rwph-panel-deep': shadeThemeColor(panel, -14),
            '--rwph-surface': shadeThemeColor(panel, 7),
            '--rwph-surface-2': shadeThemeColor(panel, 12),
            '--rwph-button': button,
            '--rwph-button-hover': shadeThemeColor(button, 10),
            '--rwph-highlight': highlight,
            '--rwph-accent': accent,
            '--rwph-accent-bright': shadeThemeColor(accent, 18),
            '--rwph-accent-deep': shadeThemeColor(accent, -28),
            '--rwph-accent-rgb': themeRgb(accent),
        };
        Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
        return { accent, panel, button, highlight };
    }

    function saveThemeSettings() {
        const current = getThemeSettings();
        const next = {
            accent: normalizeThemeColor(document.querySelector('#rwph-theme-accent')?.value, current.accent),
            panel: normalizeThemeColor(document.querySelector('#rwph-theme-panel')?.value, current.panel),
            button: normalizeThemeColor(document.querySelector('#rwph-theme-button')?.value, current.button),
            highlight: normalizeThemeColor(document.querySelector('#rwph-theme-highlight')?.value, current.highlight),
        };
        gm.set(KEYS.themeAccent, next.accent);
        gm.set(KEYS.themePanel, next.panel);
        gm.set(KEYS.themeButton, next.button);
        gm.set(KEYS.themeHighlight, next.highlight);
        applyTheme(next);
        setStatus('RWPH theme saved locally.', 'good');
        showNotification('Settings Saved', 'Theme settings saved locally.', 'good');
        if (state.open && state.tab === 'settings') renderSettingsTab();
    }

    function resetThemeSettings() {
        gm.del(KEYS.themeAccent);
        gm.del(KEYS.themePanel);
        gm.del(KEYS.themeButton);
        gm.del(KEYS.themeHighlight);
        applyTheme(DEFAULT_THEME);
        setStatus('RWPH theme reset to the RWPH default.', 'good');
        showNotification('Settings Saved', 'Theme reset to RWPH defaults.', 'good');
        if (state.open && state.tab === 'settings') renderSettingsTab();
    }

    function previewThemeSettings() {
        const current = getThemeSettings();
        applyTheme({
            accent: normalizeThemeColor(document.querySelector('#rwph-theme-accent')?.value, current.accent),
            panel: normalizeThemeColor(document.querySelector('#rwph-theme-panel')?.value, current.panel),
            button: normalizeThemeColor(document.querySelector('#rwph-theme-button')?.value, current.button),
            highlight: normalizeThemeColor(document.querySelector('#rwph-theme-highlight')?.value, current.highlight),
        });
    }

    const REPORT_LOADING_STEPS = [
        'Verify RWPH licence',
        'Fetch war information',
        'Fetch outgoing attack logs',
        'Fetch incoming attack logs',
        'Process members',
        'Classify attacks',
        'Calculate Fair Fight',
        'Apply member adjustments',
        'Apply payout weights',
        'Build and cache results',
    ];

    // v1.9.0 API reliability controls retained through v3.0.0. 850ms keeps RWPH below Torn's documented
    // 100 requests/minute ceiling and leaves headroom for other Torn tools using
    // the same player's API allowance.
    const TORN_REQUEST_MIN_GAP_MS = 850;
    const TORN_RATE_LIMIT_MAX_ATTEMPTS = 5;
    const TORN_TRANSIENT_MAX_ATTEMPTS = 3;
    const ATTACK_PAGE_SAFETY_LIMIT = 500;
    const ATTACK_NO_PROGRESS_LIMIT = 3;
    let tornRequestQueue = Promise.resolve();
    let lastTornRequestAt = 0;
    const tornInFlightRequests = new Map();
    const backendInFlightGets = new Map();

    const gm = {
        get(key, fallback = '') {
            try { return GM_getValue(key, fallback); } catch (_) { return fallback; }
        },
        set(key, value) {
            try { GM_setValue(key, value); } catch (_) { /* no-op */ }
        },
        del(key) {
            try { GM_deleteValue(key); } catch (_) { /* no-op */ }
        },
    };


    const REPORT_ROW_PACK_FIELDS = Object.freeze([
        'id','name','warHits','outsideHits','assists','retals','warRetals','outsideRetals','totalRetals','totalAttacks','respect','reportAttacks','reportScore','enemyHospitals','hospitalizedByEnemy','ffSum','ffCount','avgFF'
    ]);
    const UPDATE_NOTES = Object.freeze([
        'v3.5.0 is the complete roadmap release and keeps the established payout/payment behavior stable.',
        'Final settings migration normalizes saved theme colours, report filters, export choices, pool split and custom preset storage.',
        'Runtime cleanup removes older v3.4 and current v3.5 observers/listeners before reinjection to prevent duplicate SPA handlers.',
        'Faction-header lookup reuses a still-valid cached Torn heading before scanning the DOM again.',
        'Backend/API/database compatibility remains API 2.8 / schema 2.8.0 while the bundled Worker is finalized as v3.5.0.',
        'The final Worker retries only failed database connection establishment, never completed write operations.',
        'Expired replay-nonce cleanup is sampled instead of issuing a cleanup DELETE on every protected calculation.',
        'Final security/compatibility checks cover secrets, admin permissions, licence validation, signatures, replay blocking and mobile/PDA safeguards.'
    ]);

    function semverParts(value) {
        return String(value || '').split(/[+-]/)[0].split('.').slice(0, 3).map(part => Math.max(0, Number.parseInt(part, 10) || 0));
    }

    function compareVersions(a, b) {
        const aa = semverParts(a), bb = semverParts(b);
        for (let i = 0; i < 3; i += 1) {
            const diff = Number(aa[i] || 0) - Number(bb[i] || 0);
            if (diff) return diff > 0 ? 1 : -1;
        }
        return 0;
    }

    function packReportRows(rows) {
        return (Array.isArray(rows) ? rows : []).map(row => REPORT_ROW_PACK_FIELDS.map(field => field === 'name' ? String(row?.[field] || '') : Number(row?.[field] || 0)));
    }

    function unpackReportRows(packed) {
        return (Array.isArray(packed) ? packed : []).map(values => {
            const row = {};
            REPORT_ROW_PACK_FIELDS.forEach((field, index) => { row[field] = field === 'name' ? String(values?.[index] || '') : Number(values?.[index] || 0); });
            return row;
        }).filter(row => Number(row.id || 0) > 0);
    }

    function storedTextBytes(key) {
        try { return new Blob([String(gm.get(key, '') || '')]).size; } catch (_) { return String(gm.get(key, '') || '').length * 2; }
    }

    function compactCacheStorageStats() {
        const keys = [KEYS.basicReportCache, KEYS.advancedReportCache, KEYS.paymentReturnSnapshot, KEYS.sessionRecovery];
        const bytes = keys.reduce((sum, key) => sum + storedTextBytes(key), 0);
        return { bytes, kb: bytes / 1024 };
    }

    function migratePackedSnapshot(raw, type) {
        if (!raw || typeof raw !== 'object') return null;
        const next = cloneJson(raw, null);
        if (!next) return null;
        const rows = Array.isArray(next.reportRows) ? next.reportRows : unpackReportRows(next.rowsPacked);
        next.rowsPacked = packReportRows(rows);
        delete next.reportRows;
        // rankedwarreport can duplicate the full faction member list and is not needed once reportRows are classified.
        next.selectedWarReport = null;
        if (type === 'cache') next.schemaVersion = REPORT_CACHE_SCHEMA_VERSION;
        else if (type === 'recovery') next.schemaVersion = RECOVERY_SCHEMA_VERSION;
        else if (type === 'payment-return') next.schemaVersion = PAYMENT_RETURN_SCHEMA_VERSION;
        return next;
    }

    function migrateStorageRecord(key, type) {
        try {
            const raw = gm.get(key, '');
            if (!raw) return false;
            const parsed = JSON.parse(String(raw));
            const expected = type === 'cache' ? REPORT_CACHE_SCHEMA_VERSION : type === 'recovery' ? RECOVERY_SCHEMA_VERSION : PAYMENT_RETURN_SCHEMA_VERSION;
            if (Number(parsed?.schemaVersion || 0) >= expected && Array.isArray(parsed?.rowsPacked)) return false;
            if (!Array.isArray(parsed?.reportRows) && !Array.isArray(parsed?.rowsPacked)) return false;
            const migrated = migratePackedSnapshot(parsed, type);
            if (!migrated) return false;
            gm.set(key, JSON.stringify(migrated));
            return true;
        } catch (_) { return false; }
    }

    function detectPreviousStoredVersion() {
        const explicit = String(gm.get(KEYS.installedVersion, '') || '');
        if (explicit) return explicit;
        const candidates = [];
        for (const key of [KEYS.sessionRecovery, KEYS.basicReportCache, KEYS.advancedReportCache, KEYS.paymentReturnSnapshot]) {
            try {
                const raw = gm.get(key, '');
                if (!raw) continue;
                const value = String(JSON.parse(String(raw))?.appVersion || '');
                if (value) candidates.push(value);
            } catch (_) {}
        }
        return candidates.sort(compareVersions).pop() || '';
    }

    function migrateStoredSettings() {
        const previousVersion = detectPreviousStoredVersion();
        const previousSchema = Number(gm.get(KEYS.settingsSchema, 0) || 0);
        const migrations = [];
        if (previousSchema < 1) {
            const ff = gm.get(KEYS.advancedFairFightEnabled, true);
            gm.set(KEYS.advancedFairFightEnabled, ff === false || String(ff).toLowerCase() === 'false' ? false : true);
            const split = normalizePoolSplit(gm.get(KEYS.presetPoolMembers, 100), gm.get(KEYS.presetPoolFaction, 0));
            savePoolSplit(split);
            migrations.push('Normalized legacy Fair Fight and member/faction split settings.');
        }
        if (previousSchema < 2) {
            let migratedCount = 0;
            if (migrateStorageRecord(KEYS.basicReportCache, 'cache')) migratedCount += 1;
            if (migrateStorageRecord(KEYS.advancedReportCache, 'cache')) migratedCount += 1;
            if (migrateStorageRecord(KEYS.sessionRecovery, 'recovery')) migratedCount += 1;
            if (migrateStorageRecord(KEYS.paymentReturnSnapshot, 'payment-return')) migratedCount += 1;
            migrations.push(`Migrated ${migratedCount} saved report/cache record${migratedCount === 1 ? '' : 's'} to compact v3.4 storage.`);
        }
        if (previousSchema < 3) {
            const theme = getThemeSettings();
            gm.set(KEYS.themeAccent, theme.accent);
            gm.set(KEYS.themePanel, theme.panel);
            gm.set(KEYS.themeButton, theme.button);
            gm.set(KEYS.themeHighlight, theme.highlight);
            savePoolSplit(normalizePoolSplit(gm.get(KEYS.presetPoolMembers, 100), gm.get(KEYS.presetPoolFaction, 0)));
            saveReportFilters(readSavedReportFilters());
            const allowedFormats = new Set(['csv','json','text','discord','torn']);
            const allowedScopes = new Set(['filtered','all','payable']);
            const exportFormat = String(gm.get(KEYS.exportFormat, 'csv') || 'csv').toLowerCase();
            const exportScope = String(gm.get(KEYS.exportScope, 'filtered') || 'filtered').toLowerCase();
            gm.set(KEYS.exportFormat, allowedFormats.has(exportFormat) ? exportFormat : 'csv');
            gm.set(KEYS.exportScope, allowedScopes.has(exportScope) ? exportScope : 'filtered');
            writeCustomPayoutPresets(readCustomPayoutPresets());
            migrations.push('Normalized final v3.5 theme, pool split, report-filter, export and custom-preset settings.');
        }
        gm.set(KEYS.settingsSchema, SETTINGS_SCHEMA_VERSION);
        gm.set(KEYS.installedVersion, APP.version);
        gm.set(KEYS.migrationLog, JSON.stringify({ from: previousVersion, to: APP.version, at: Date.now(), migrations }));
        state.updateInfo = { previousVersion, currentVersion: APP.version, upgraded: !!previousVersion && previousVersion !== APP.version, migrations };
        return state.updateInfo;
    }

    function releaseReadinessChecks() {
        const backendUrl = getBackendUrl();
        let secureBackend = false;
        try {
            const parsed = new URL(backendUrl);
            secureBackend = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost','127.0.0.1','::1'].includes(parsed.hostname));
        } catch (_) {}
        return [
            { label:'Userscript', ok: APP.version === '3.5.0', detail:`v${APP.version}` },
            { label:'Backend URL', ok: secureBackend, detail: secureBackend ? 'HTTPS / local dev' : 'Remote HTTPS required' },
            { label:'Backend API', ok: !state.backendHealth?.apiVersion || state.backendHealth.apiVersion === BACKEND_API_VERSION, detail: state.backendHealth?.apiVersion || BACKEND_API_VERSION },
            { label:'DB Schema', ok: !state.backendHealth?.dbSchema || compareVersions(state.backendHealth.dbSchema, MIN_DATABASE_SCHEMA) >= 0, detail: state.backendHealth?.dbSchema || `>= ${MIN_DATABASE_SCHEMA}` },
            { label:'Torn SPA Runtime', ok: true, detail:'Managed single runtime' },
            { label:'Payment Safety', ok: true, detail:'Manual Torn confirmation' },
        ];
    }

    function updateSafetyHtml() {
        const info = state.updateInfo || {};
        const storage = compactCacheStorageStats();
        const previous = info.previousVersion || 'First RWPH run';
        const checks = releaseReadinessChecks();
        const passed = checks.filter(check => check.ok).length;
        return `<section class="rwph-card">
            <div class="rwph-preset-head"><div><b>v3.5.0 Complete Release</b><span>Final roadmap release: migration safety, backend compatibility, runtime cleanup and release-readiness checks.</span></div><span class="rwph-pill">STABLE ${escapeHtml(APP.version)}</span></div>
            <div class="rwph-kpis"><div class="rwph-kpi"><b>${escapeHtml(previous)}</b><span>Previous Version</span></div><div class="rwph-kpi"><b>${SETTINGS_SCHEMA_VERSION}</b><span>Settings Schema</span></div><div class="rwph-kpi"><b>${formatNumber(storage.kb, 1)} KB</b><span>Report/Recovery Storage</span></div><div class="rwph-kpi"><b>${passed}/${checks.length}</b><span>Release Checks</span></div></div>
            <div class="rwph-release-checks">${checks.map(check => `<div class="rwph-release-check ${check.ok ? 'good' : 'bad'}"><b>${check.ok ? '✓' : '!'} ${escapeHtml(check.label)}</b><span>${escapeHtml(check.detail)}</span></div>`).join('')}</div>
            ${info.migrations?.length ? `<div class="rwph-note"><b>Migration result:</b> ${info.migrations.map(escapeHtml).join(' ')}</div>` : ''}
            <details class="rwph-update-notes"><summary>v3.5.0 Complete Release Notes</summary><ul>${UPDATE_NOTES.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></details>
        </section>`;
    }

    let rwphNotificationSeq = 0;
    let rwphLastNotification = { key: '', at: 0 };
    function showNotification(title, message = '', type = 'info', lifetime = 5000) {
        const text = String(message || title || '').trim();
        const heading = String(title || 'RWPH').trim() || 'RWPH';
        if (!text) return;
        const now = Date.now();
        const dedupeKey = `${heading}|${text}|${type}`;
        if (rwphLastNotification.key === dedupeKey && now - rwphLastNotification.at < 800) return;
        rwphLastNotification = { key: dedupeKey, at: now };
        let host = document.getElementById('rwph-notifications');
        if (!host) {
            host = document.createElement('div');
            host.id = 'rwph-notifications';
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        const toast = document.createElement('div');
        const id = ++rwphNotificationSeq;
        toast.className = `rwph-toast ${type}`;
        toast.dataset.toastId = String(id);
        toast.innerHTML = `<div class="rwph-toast-icon">${type === 'good' ? '✓' : type === 'bad' ? '!' : type === 'warn' ? '!' : 'i'}</div><div class="rwph-toast-copy"><b>${escapeHtml(heading)}</b><span>${escapeHtml(text)}</span></div><button class="rwph-toast-close" type="button" aria-label="Dismiss notification">×</button><i class="rwph-toast-life"></i>`;
        const remove = () => {
            if (!toast.isConnected) return;
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 180);
        };
        toast.querySelector('.rwph-toast-close')?.addEventListener('click', remove);
        host.prepend(toast);
        while (host.children.length > 5) host.lastElementChild?.remove();
        const life = Math.max(1200, Number(lifetime || 5000));
        toast.style.setProperty('--rwph-toast-life', `${life}ms`);
        setTimeout(remove, life);
    }

    const BUILTIN_PAYOUT_PRESETS = Object.freeze([
        { id:'standard-war', name:'Standard War', builtIn:true, mode:'advanced', basic:{ payPerHit:'1m', payoutPool:'100m' }, advanced:{ payoutPool:'100m', warHitWeight:1, outsideHitWeight:1, retalWeight:1, assistWeight:0, ownHospitalWeight:0, enemyHospitalWeight:-1, fairFightEnabled:true, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0.01, fairFightCap:3 }, poolSplit:{ members:100, faction:0 } },
        { id:'competitive-war', name:'Competitive War', builtIn:true, mode:'advanced', basic:{ payPerHit:'1m', payoutPool:'100m' }, advanced:{ payoutPool:'100m', warHitWeight:1, outsideHitWeight:0.75, retalWeight:1.25, assistWeight:0.10, ownHospitalWeight:0.10, enemyHospitalWeight:-1, fairFightEnabled:true, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0.01, fairFightCap:3 }, poolSplit:{ members:90, faction:10 } },
        { id:'training-war', name:'Training War', builtIn:true, mode:'basic', basic:{ payPerHit:'500k', payoutPool:'50m' }, advanced:{ payoutPool:'50m', warHitWeight:1, outsideHitWeight:0, retalWeight:0, assistWeight:0, ownHospitalWeight:0, enemyHospitalWeight:0, fairFightEnabled:false, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0.01, fairFightCap:3 }, poolSplit:{ members:100, faction:0 } },
        { id:'high-retal-bonus', name:'High Retal Bonus', builtIn:true, mode:'advanced', basic:{ payPerHit:'1m', payoutPool:'100m' }, advanced:{ payoutPool:'100m', warHitWeight:1, outsideHitWeight:1, retalWeight:2, assistWeight:0, ownHospitalWeight:0, enemyHospitalWeight:-1, fairFightEnabled:true, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0.01, fairFightCap:3 }, poolSplit:{ members:100, faction:0 } },
        { id:'respect-focus', name:'Respect Focus', builtIn:true, mode:'advanced', basic:{ payPerHit:'1m', payoutPool:'100m' }, advanced:{ payoutPool:'100m', warHitWeight:1.15, outsideHitWeight:0.75, retalWeight:1.25, assistWeight:0.05, ownHospitalWeight:0.15, enemyHospitalWeight:-1, fairFightEnabled:true, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0.02, fairFightCap:3 }, poolSplit:{ members:90, faction:10 } },
        { id:'hits-only', name:'Hits Only', builtIn:true, mode:'basic', basic:{ payPerHit:'1m', payoutPool:'' }, advanced:{ payoutPool:'100m', warHitWeight:1, outsideHitWeight:0, retalWeight:0, assistWeight:0, ownHospitalWeight:0, enemyHospitalWeight:0, fairFightEnabled:false, fairFightStart:1, fairFightStep:0.02, fairFightBonus:0, fairFightCap:3 }, poolSplit:{ members:100, faction:0 } },
    ]);

    function normalizePoolSplit(members, faction = null) {
        let memberPct = Number(members);
        if (!Number.isFinite(memberPct)) memberPct = 100;
        memberPct = Math.max(0, Math.min(100, Math.round(memberPct * 100) / 100));
        let factionPct = faction === null ? 100 - memberPct : Number(faction);
        if (!Number.isFinite(factionPct) || Math.abs((memberPct + factionPct) - 100) > 0.01) factionPct = 100 - memberPct;
        factionPct = Math.max(0, Math.min(100, Math.round(factionPct * 100) / 100));
        return { members: memberPct, faction: factionPct };
    }

    function currentPoolSplit() {
        const dom = document.querySelector('#rwph-preset-member-pool');
        const members = dom ? dom.value : gm.get(KEYS.presetPoolMembers, '100');
        return normalizePoolSplit(members, 100 - Number(members || 100));
    }

    function savePoolSplit(split = currentPoolSplit()) {
        const safe = normalizePoolSplit(split.members, split.faction);
        gm.set(KEYS.presetPoolMembers, String(safe.members));
        gm.set(KEYS.presetPoolFaction, String(safe.faction));
        return safe;
    }


    function activePoolSplit(mode = currentPayoutMode()) {
        if (state.activeCachedReport && state.activeCachedReport.mode === mode) {
            return normalizePoolSplit(state.activeCachedReport.poolSplit?.members ?? 100, state.activeCachedReport.poolSplit?.faction ?? 0);
        }
        return currentPoolSplit();
    }

    function payoutPoolBreakdown(totalPool, mode = currentPayoutMode()) {
        const split = activePoolSplit(mode);
        const valid = Number.isFinite(Number(totalPool)) && Number(totalPool) >= 0;
        const total = valid ? Number(totalPool) : 0;
        const memberPool = valid ? total * (split.members / 100) : 0;
        const factionShare = valid ? total * (split.faction / 100) : 0;
        return { valid, totalPool: total, memberPool, factionShare, split };
    }

    function defaultReportFilters() {
        return { included: true, excluded: true, unselected: true, minHits: 0, minRespect: 0, minPayout: 0, name: '', tornId: '', contribution: 'all' };
    }

    function normalizeReportFilters(input = {}) {
        const d = defaultReportFilters();
        const contribution = ['all','low','medium','high','top'].includes(String(input.contribution || 'all')) ? String(input.contribution || 'all') : 'all';
        return {
            included: input.included !== false,
            excluded: input.excluded !== false,
            unselected: input.unselected !== false,
            minHits: Math.max(0, Number(input.minHits) || 0),
            minRespect: Math.max(0, Number(input.minRespect) || 0),
            minPayout: Math.max(0, Number(input.minPayout) || 0),
            name: String(input.name || '').trim().slice(0, 60),
            tornId: String(input.tornId || '').replace(/[^0-9]/g, '').slice(0, 20),
            contribution,
        };
    }

    function readSavedReportFilters() {
        try {
            const raw = gm.get(KEYS.reportFilters, '');
            if (!raw) return defaultReportFilters();
            return normalizeReportFilters(JSON.parse(String(raw)));
        } catch (_) { return defaultReportFilters(); }
    }

    function saveReportFilters(filters = state.reportFilters) {
        const safe = normalizeReportFilters(filters);
        state.reportFilters = safe;
        gm.set(KEYS.reportFilters, JSON.stringify(safe));
        return safe;
    }

    function syncReportFiltersFromDom() {
        const body = document.querySelector('#rwph-body');
        if (!body) return state.reportFilters;
        const minPayoutRaw = body.querySelector('#rwph-filter-min-payout')?.value || '';
        const minPayoutParsed = String(minPayoutRaw).trim() ? parseMoney(minPayoutRaw) : 0;
        return saveReportFilters({
            included: !!body.querySelector('#rwph-filter-included')?.checked,
            excluded: !!body.querySelector('#rwph-filter-excluded')?.checked,
            unselected: !!body.querySelector('#rwph-filter-unselected')?.checked,
            minHits: body.querySelector('#rwph-filter-min-hits')?.value || 0,
            minRespect: body.querySelector('#rwph-filter-min-respect')?.value || 0,
            minPayout: Number.isFinite(minPayoutParsed) ? minPayoutParsed : 0,
            name: body.querySelector('#rwph-filter-name')?.value || '',
            tornId: body.querySelector('#rwph-filter-id')?.value || '',
            contribution: body.querySelector('#rwph-filter-contribution')?.value || 'all',
        });
    }

    function readCustomPayoutPresets() {
        try {
            const parsed = JSON.parse(String(gm.get(KEYS.payoutPresets, '[]') || '[]'));
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(p => p && typeof p === 'object' && p.id && p.name).slice(0, 30);
        } catch (_) { return []; }
    }

    function writeCustomPayoutPresets(presets) {
        gm.set(KEYS.payoutPresets, JSON.stringify((Array.isArray(presets) ? presets : []).slice(0, 30)));
    }

    function allPayoutPresets() {
        return [...BUILTIN_PAYOUT_PRESETS, ...readCustomPayoutPresets().map(p => ({ ...p, builtIn:false }))];
    }

    function payoutPresetOptionsHtml() {
        const built = BUILTIN_PAYOUT_PRESETS.map(p => `<option value="builtin:${escapeHtml(p.id)}">${escapeHtml(p.name)} — Built-in</option>`).join('');
        const custom = readCustomPayoutPresets();
        const customHtml = custom.length ? custom.map(p => `<option value="custom:${escapeHtml(p.id)}">${escapeHtml(p.name)} — Custom</option>`).join('') : '<option value="" disabled>No custom presets saved</option>';
        return `<optgroup label="RWPH Presets">${built}</optgroup><optgroup label="My Presets">${customHtml}</optgroup>`;
    }

    function payoutPresetsHtml(cachedActive = false) {
        const split = activePoolSplit();
        return `<div class="rwph-preset-card">
            <div class="rwph-preset-head"><div><b>Payout Presets</b><span>Apply a complete payout configuration or save your current setup.</span></div><span class="rwph-pill">v3.1</span></div>
            <div class="rwph-preset-grid">
                <div class="rwph-field"><label>Preset</label><select id="rwph-preset-select">${payoutPresetOptionsHtml()}</select></div>
                <div class="rwph-field"><label>Custom Preset Name</label><input id="rwph-preset-name" type="text" maxlength="40" placeholder="Example: NAC Ranked War"></div>
                <div class="rwph-field"><label>Member Pool %</label><input id="rwph-preset-member-pool" type="number" min="0" max="100" step="1" value="${escapeHtml(split.members)}" ${cachedActive ? 'disabled' : ''}></div>
                <div class="rwph-field"><label>Faction / Vault %</label><input id="rwph-preset-faction-pool" type="number" value="${escapeHtml(split.faction)}" readonly></div>
            </div>
            <div class="rwph-btn-row">
                <button class="rwph-btn primary" data-action="apply-payout-preset" type="button">Apply Preset</button>
                <button class="rwph-btn" data-action="save-payout-preset" type="button" ${cachedActive ? 'disabled' : ''}>Save Current as Custom</button>
                <button class="rwph-btn danger" data-action="delete-payout-preset" type="button">Delete Selected Custom</button>
            </div>
            <div class="rwph-note">Presets store Mode, Basic pay-per-hit/pool, Advanced weights, Fair Fight settings, hospital bonuses and the member/faction pool split. The v3.2 split calculator will use the saved split percentages directly.</div>
        </div>`;
    }

    function currentPayoutPresetSnapshot(name = 'Custom Preset') {
        const adv = advancedConfigFromDom();
        const basic = basicConfigFromDom();
        return {
            schemaVersion:1,
            id:`p${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`,
            name:String(name || 'Custom Preset').trim().slice(0,40),
            builtIn:false,
            mode:currentPayoutMode(),
            basic:{ payPerHit:String(basic.payRaw || ''), payoutPool:String(basic.poolRaw || '') },
            advanced:{ payoutPool:String(adv.poolRaw || ''), warHitWeight:Number(adv.warHitWeight), outsideHitWeight:Number(adv.outsideHitWeight), retalWeight:Number(adv.retalWeight), assistWeight:Number(adv.assistWeight), ownHospitalWeight:Number(adv.ownHospitalWeight), enemyHospitalWeight:Number(adv.enemyHospitalWeight), fairFightEnabled:!!adv.fairFightEnabled, fairFightStart:Number(adv.fairFightStart), fairFightStep:Number(adv.fairFightStep), fairFightBonus:Number(adv.fairFightBonus), fairFightCap:Number(adv.fairFightCap) },
            poolSplit:savePoolSplit(currentPoolSplit()),
            savedAt:Date.now(),
        };
    }

    function selectedPayoutPreset() {
        const value = String(document.querySelector('#rwph-preset-select')?.value || '');
        if (!value) return null;
        const [kind, id] = value.split(':');
        if (kind === 'builtin') return BUILTIN_PAYOUT_PRESETS.find(p => p.id === id) || null;
        return readCustomPayoutPresets().find(p => p.id === id) || null;
    }

    function applyPayoutPreset(preset) {
        if (!preset) { showNotification('Preset Error','Select a payout preset first.','bad'); return; }
        if (state.activeCachedReport) exitCachedReport(true, false);
        const mode = preset.mode === 'advanced' ? 'advanced' : 'basic';
        const b = preset.basic || {};
        const a = preset.advanced || {};
        gm.set(KEYS.payoutMode, mode);
        gm.set(KEYS.basicPayPerHit, String(b.payPerHit ?? ''));
        gm.set(KEYS.basicPayoutPool, String(b.payoutPool ?? ''));
        gm.set(KEYS.advancedPayoutPool, String(a.payoutPool ?? '100m'));
        gm.set(KEYS.advancedWarHitWeight, String(a.warHitWeight ?? 1));
        gm.set(KEYS.advancedOutsideHitWeight, String(a.outsideHitWeight ?? 1));
        gm.set(KEYS.advancedRetalWeight, String(a.retalWeight ?? 1));
        gm.set(KEYS.advancedAssistWeight, String(a.assistWeight ?? 0));
        gm.set(KEYS.advancedOwnHospitalWeight, String(a.ownHospitalWeight ?? 0));
        gm.set(KEYS.advancedEnemyHospitalWeight, String(a.enemyHospitalWeight ?? -1));
        gm.set(KEYS.advancedFairFightEnabled, String(a.fairFightEnabled !== false));
        gm.set(KEYS.advancedFairFightStart, String(a.fairFightStart ?? 1));
        gm.set(KEYS.advancedFairFightStep, String(a.fairFightStep ?? 0.02));
        gm.set(KEYS.advancedFairFightBonus, String(a.fairFightBonus ?? 0.01));
        gm.set(KEYS.advancedFairFightCap, String(a.fairFightCap ?? 3));
        savePoolSplit(preset.poolSplit || { members:100, faction:0 });
        state.payoutMode = mode;
        renderWarTab();
        setStatus(`Applied payout preset: ${preset.name}.`, 'good');
        showNotification('Preset Applied', `${preset.name} · ${mode === 'advanced' ? 'Advanced Points' : 'Basic Per Hit'}`, 'good');
    }

    function saveCurrentPayoutPreset() {
        if (state.activeCachedReport) { showNotification('Preset Locked','Return to the live report before saving a preset.','warn'); return; }
        const name = String(document.querySelector('#rwph-preset-name')?.value || '').trim();
        if (name.length < 2) { showNotification('Preset Name Required','Enter a custom preset name with at least 2 characters.','warn'); return; }
        if (BUILTIN_PAYOUT_PRESETS.some(p => p.name.toLowerCase() === name.toLowerCase())) { showNotification('Reserved Preset Name','Choose a different name; built-in preset names are protected.','warn'); return; }
        const current = readCustomPayoutPresets();
        const existing = current.find(p => String(p.name).toLowerCase() === name.toLowerCase());
        const snap = currentPayoutPresetSnapshot(name);
        if (existing) snap.id = existing.id;
        const next = existing ? current.map(p => p.id === existing.id ? snap : p) : [...current, snap];
        writeCustomPayoutPresets(next);
        setStatus(`${existing ? 'Updated' : 'Saved'} custom payout preset “${name}”.`, 'good');
        showNotification('Preset Saved', `${name}${existing ? ' updated' : ' saved'} locally.`, 'good');
        renderWarTab();
    }

    function deleteSelectedPayoutPreset() {
        const value = String(document.querySelector('#rwph-preset-select')?.value || '');
        if (!value.startsWith('custom:')) { showNotification('Built-in Preset','RWPH built-in presets cannot be deleted.','warn'); return; }
        const id = value.slice(7);
        const current = readCustomPayoutPresets();
        const removed = current.find(p => p.id === id);
        writeCustomPayoutPresets(current.filter(p => p.id !== id));
        setStatus(`Deleted custom payout preset${removed ? ` “${removed.name}”` : ''}.`, 'good');
        showNotification('Preset Deleted', removed?.name || 'Custom preset deleted.', 'good');
        renderWarTab();
    }


    function getBackendUrl() {
        const raw = String(gm.get(KEYS.backendUrl, DEFAULT_BACKEND_URL) || DEFAULT_BACKEND_URL).trim();
        return raw.replace(/\/+$/, '') || DEFAULT_BACKEND_URL;
    }

    function saveLicenceSession() {
        const licence = state.licence || {};
        if (licence.status !== 'active' || !licence.token || !licence.requestKey || !licence.sessionId) {
            gm.del(KEYS.licenceSession);
            return;
        }
        gm.set(KEYS.licenceSession, JSON.stringify({
            schemaVersion: 3,
            backendUrl: getBackendUrl(),
            tornId: Number(licence.tornId || 0),
            factionId: Number(licence.factionId || 0),
            licenceExpiresAt: Number(licence.expiresAt || 0),
            sessionExpiresAt: Math.min(Number(licence.expiresAt || 0), Date.now() + LICENCE_SESSION_TTL_MS),
            token: String(licence.token || ''),
            requestKey: String(licence.requestKey || ''),
            sessionId: String(licence.sessionId || ''),
        }));
    }

    function readLicenceSession() {
        try {
            const raw = gm.get(KEYS.licenceSession, '');
            if (!raw) return null;
            const parsed = JSON.parse(String(raw));
            const sessionExpiresAt = Number(parsed?.sessionExpiresAt || 0);
            if (!parsed || Number(parsed.schemaVersion || 0) !== 3 || parsed.backendUrl !== getBackendUrl() || sessionExpiresAt <= Date.now() || !parsed.token || !parsed.requestKey || !parsed.sessionId) {
                gm.del(KEYS.licenceSession);
                return null;
            }
            return parsed;
        } catch (_) {
            gm.del(KEYS.licenceSession);
            return null;
        }
    }

    function clearLicenceSession() {
        gm.del(KEYS.licenceSession);
        state.protectedCalculation = null;
        state.licence = { status: 'unchecked', checking: false, message: 'Licence has not been checked yet.', tornId: 0, name: '', factionId: 0, expiresAt: 0, token: '', requestKey: '', sessionId: '', checkedAt: 0 };
    }

    function licenceIsActive() {
        return state.licence?.status === 'active' && Number(state.licence.expiresAt || 0) > Date.now() && !!state.licence.token && !!state.licence.requestKey && !!state.licence.sessionId;
    }

    function rwphSleep(ms) {
        return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
    }

    function rwphBase64UrlToBytes(value) {
        const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        const binary = atob(padded);
        return Uint8Array.from(binary, ch => ch.charCodeAt(0));
    }

    function rwphBytesToBase64Url(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    async function rwphSha256Base64Url(text) {
        const bytes = new TextEncoder().encode(String(text || ''));
        return rwphBytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
    }

    async function rwphSignedRequestHeaders(method, path, bodyText) {
        const requestKey = String(state.licence?.requestKey || '');
        if (!requestKey) throw new Error('RWPH protected session signing key is missing. Refresh the licence session.');
        const requestId = crypto.randomUUID();
        const timestamp = String(Date.now());
        const digest = await rwphSha256Base64Url(bodyText);
        const canonical = `${String(method || 'POST').toUpperCase()}\n${path.startsWith('/') ? path : `/${path}`}\n${timestamp}\n${requestId}\n${digest}`;
        const key = await crypto.subtle.importKey('raw', rwphBase64UrlToBytes(requestKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical)));
        return {
            'X-RWPH-Request-ID': requestId,
            'X-RWPH-Request-Timestamp': timestamp,
            'X-RWPH-Signature': rwphBytesToBase64Url(signature),
        };
    }

    function rwphResponseHeaders(raw = '') {
        const out = {};
        String(raw || '').split(/\r?\n/).forEach(line => {
            const i = line.indexOf(':');
            if (i <= 0) return;
            out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
        });
        return out;
    }

    function rwphBackendError(response, data, prefix = 'RWPH cloud backend') {
        const headers = rwphResponseHeaders(response?.responseHeaders || '');
        const code = String(data?.code || '');
        const requestId = String(data?.requestId || headers['x-rwph-request-id'] || '');
        const base = String(data?.error || data?.message || `${prefix} HTTP ${response?.status || 0}.`);
        const httpStatus = Number(response?.status || 0);
        let category = '';
        if (['DATABASE_UNAVAILABLE','DATABASE_TIMEOUT','DATABASE_SCHEMA_OUTDATED','HYPERDRIVE_NOT_CONFIGURED'].includes(code)) category = 'Database Offline';
        else if (code === 'API_VERSION_MISMATCH') category = 'Backend Version Mismatch';
        else if (['LICENCE_INACTIVE','SESSION_REFRESH_REQUIRED','SIGNATURE_REQUIRED','SIGNATURE_EXPIRED','SIGNATURE_INVALID','REPLAY_DETECTED'].includes(code)) category = 'Licence Server Error';
        else if ([400, 404, 409, 413, 422].includes(httpStatus)) category = 'Invalid Request';
        else if (httpStatus >= 500) category = 'Backend Offline';
        const suffix = [code && `code ${code}`, requestId && `request ${requestId}`].filter(Boolean).join(', ');
        const message = category ? `${category}: ${base}` : base;
        const err = new Error(suffix ? `${message} (${suffix})` : message);
        err.httpStatus = httpStatus;
        err.code = code;
        err.requestId = requestId;
        err.licenceStatus = data?.status || '';
        err.retryable = !!data?.retryable || [408, 425, 429, 500, 502, 503, 504].includes(err.httpStatus);
        err.retryAfterMs = Math.max(0, Number(headers['retry-after'] || 0) * 1000);
        err.serverUnavailable = err.httpStatus >= 500 || ['DATABASE_UNAVAILABLE','DATABASE_TIMEOUT','HYPERDRIVE_NOT_CONFIGURED'].includes(code);
        return err;
    }

    function rwphRetryDelay(err, attempt) {
        if (Number(err?.retryAfterMs || 0) > 0) return Math.min(BACKEND_MAX_RETRY_DELAY_MS, Number(err.retryAfterMs));
        return Math.min(BACKEND_MAX_RETRY_DELAY_MS, 650 * (2 ** Math.max(0, attempt)) + Math.floor(Math.random() * 250));
    }

    function rwphGmBackendOnce({ method, url, headers, data, timeout, prefix }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method, url, headers, data, timeout,
                onload(response) {
                    let parsed = {};
                    try { parsed = JSON.parse(response.responseText || '{}'); }
                    catch (_) {
                        const err = new Error(`${prefix} returned invalid JSON (HTTP ${response.status}).`);
                        err.httpStatus = Number(response.status || 0);
                        err.retryable = err.httpStatus >= 500;
                        err.serverUnavailable = err.httpStatus >= 500;
                        reject(err);
                        return;
                    }
                    if (response.status < 200 || response.status >= 300 || parsed?.ok === false) {
                        reject(rwphBackendError(response, parsed, prefix));
                        return;
                    }
                    resolve(parsed);
                },
                ontimeout() {
                    const err = new Error(`Request Timed Out: ${prefix} did not respond in time.`);
                    err.retryable = true;
                    err.serverUnavailable = true;
                    reject(err);
                },
                onerror() {
                    const err = new Error(`Backend Offline: could not reach ${prefix.toLowerCase()} at ${getBackendUrl()}.`);
                    err.retryable = true;
                    err.serverUnavailable = true;
                    reject(err);
                },
            });
        });
    }

    async function backendRequest(path, { method = 'POST', body = null, token = '', timeout = BACKEND_TIMEOUT_MS, retries = null, signed = false } = {}) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${getBackendUrl()}${normalizedPath}`;
        const bodyText = body === null ? '' : JSON.stringify(body);
        const methodUpper = String(method).toUpperCase();
        const getKey = methodUpper === 'GET' && !token && !signed ? `${url}|${BACKEND_API_VERSION}` : '';
        if (getKey && backendInFlightGets.has(getKey)) return backendInFlightGets.get(getKey);
        const task = (async () => {
            const maxRetries = retries === null ? (methodUpper === 'GET' ? BACKEND_DEFAULT_RETRIES : 0) : Math.max(0, Number(retries || 0));
            let lastError;
            for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
                const headers = { Accept: 'application/json', 'X-RWPH-API-Version': BACKEND_API_VERSION };
                if (body !== null) headers['Content-Type'] = 'application/json';
                if (token) headers.Authorization = `Bearer ${token}`;
                if (signed) Object.assign(headers, await rwphSignedRequestHeaders(methodUpper, normalizedPath, bodyText));
                try {
                    return await rwphGmBackendOnce({ method: methodUpper, url, headers, data: body === null ? undefined : bodyText, timeout, prefix: 'RWPH cloud backend' });
                } catch (err) {
                    lastError = err;
                    if (!err?.retryable || attempt >= maxRetries) throw err;
                    await rwphSleep(rwphRetryDelay(err, attempt));
                }
            }
            throw lastError || new Error('RWPH backend request failed.');
        })();
        if (getKey) backendInFlightGets.set(getKey, task);
        try { return await task; }
        finally { if (getKey && backendInFlightGets.get(getKey) === task) backendInFlightGets.delete(getKey); }
    }

    function assertBackendCompatibility(data) {
        const apiVersion = String(data?.apiVersion || '');
        const serverVersion = String(data?.version || '');
        const dbSchema = String(data?.checks?.database?.schemaVersion || '');
        if (apiVersion !== BACKEND_API_VERSION) {
            const err = new Error(`Backend API ${apiVersion || 'unknown'} is incompatible with RWPH API ${BACKEND_API_VERSION}. Update the userscript/backend together.`);
            err.code = 'API_VERSION_MISMATCH'; throw err;
        }
        if (serverVersion && compareVersions(serverVersion, MIN_BACKEND_VERSION) < 0) {
            const err = new Error(`Backend ${serverVersion} is older than required ${MIN_BACKEND_VERSION}.`); err.code = 'API_VERSION_MISMATCH'; throw err;
        }
        if (dbSchema && compareVersions(dbSchema, MIN_DATABASE_SCHEMA) < 0) {
            const err = new Error(`Database schema ${dbSchema} is older than required ${MIN_DATABASE_SCHEMA}.`); err.code = 'DATABASE_SCHEMA_OUTDATED'; throw err;
        }
        return true;
    }


    function getAdminKey() {
        return String(gm.get(KEYS.adminKey, '') || '').trim();
    }

    function resetAdminState(message = 'Admin key has not been verified yet.') {
        state.admin = { verified: false, message, results: [], summary: { total: 0, active: 0, expired: 0, revoked: 0 }, query: '', status: 'all' };
    }

    async function adminRequest(path, { method = 'POST', body = null, timeout = BACKEND_TIMEOUT_MS, retries = 0 } = {}) {
        const adminKey = getAdminKey();
        if (!adminKey) throw new Error('Enter and save the RWPH admin key first.');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${getBackendUrl()}${normalizedPath}`;
        const bodyText = body === null ? '' : JSON.stringify(body);
        let lastError;
        for (let attempt = 0; attempt <= Math.max(0, Number(retries || 0)); attempt += 1) {
            const headers = { Accept: 'application/json', 'X-RWPH-Admin-Key': adminKey, 'X-RWPH-API-Version': BACKEND_API_VERSION };
            if (body !== null) headers['Content-Type'] = 'application/json';
            try {
                return await rwphGmBackendOnce({ method, url, headers, data: body === null ? undefined : bodyText, timeout, prefix: 'RWPH cloud admin backend' });
            } catch (err) {
                lastError = err;
                if (!err?.retryable || attempt >= Number(retries || 0)) throw err;
                await rwphSleep(rwphRetryDelay(err, attempt));
            }
        }
        throw lastError || new Error('RWPH admin request failed.');
    }

    function adminStatusClass() {
        if (state.admin?.verified) return 'good';
        if (/invalid|denied|failed|disabled|error/i.test(String(state.admin?.message || ''))) return 'bad';
        return '';
    }

    function adminExpiryText(value) {
        const ms = Number(value || 0);
        if (!ms) return '—';
        const d = new Date(ms);
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
    }

    function adminRemainingText(row) {
        if (String(row?.status || '') === 'revoked') return 'Revoked';
        const ms = Number(row?.expiresAt || 0) - Date.now();
        return ms > 0 ? formatLicenceDuration(ms) : 'Expired';
    }

    function adminSetMessage(message, verified = state.admin?.verified) {
        state.admin.message = String(message || '');
        state.admin.verified = !!verified;
        const el = document.querySelector('#rwph-admin-status');
        if (el) {
            el.textContent = state.admin.message;
            el.classList.toggle('good', state.admin.verified);
            el.classList.toggle('bad', !state.admin.verified && /invalid|denied|failed|disabled|error/i.test(state.admin.message));
        }
    }

    async function verifyAdminKey() {
        const input = document.querySelector('#rwph-admin-key');
        const key = String(input?.value || getAdminKey()).trim();
        if (!key) { adminSetMessage('Enter an admin key first.', false); return false; }
        gm.set(KEYS.adminKey, key);
        adminSetMessage('Verifying admin key…', false);
        try {
            const data = await adminRequest('/admin/licenses', { body: { action: 'status' }, retries: 1 });
            state.admin.summary = data.summary || state.admin.summary;
            adminSetMessage(`Admin access verified on backend ${data.version || APP.version}. Permissions: ${(data.permissions || []).join(', ') || 'server default'}.`, true);
            if (state.open && state.tab === 'admin') renderAdminTab();
            return true;
        } catch (err) {
            state.admin.verified = false;
            adminSetMessage(`Admin verification failed: ${err.message || String(err)}`, false);
            return false;
        }
    }

    function clearAdminKey() {
        gm.del(KEYS.adminKey);
        resetAdminState('Saved admin key cleared from RWPH.');
        if (state.open && state.tab === 'admin') renderAdminTab();
    }

    function adminFormValues() {
        const body = document.querySelector('#rwph-body');
        return {
            tornId: Number(body?.querySelector('#rwph-admin-torn-id')?.value || 0),
            name: String(body?.querySelector('#rwph-admin-name')?.value || '').trim(),
            days: Number(body?.querySelector('#rwph-admin-days')?.value || 0),
        };
    }

    async function adminSearchLicences(forceAll = false) {
        const body = document.querySelector('#rwph-body');
        const query = forceAll ? '' : String(body?.querySelector('#rwph-admin-search')?.value || state.admin.query || '').trim();
        const status = String(body?.querySelector('#rwph-admin-filter')?.value || state.admin.status || 'all');
        state.admin.query = query;
        state.admin.status = status;
        adminSetMessage('Loading licence records…', state.admin.verified);
        try {
            const data = await adminRequest('/admin/licenses', { body: { action: 'search', query, status }, retries: 1 });
            state.admin.results = Array.isArray(data.rows) ? data.rows : [];
            state.admin.summary = data.summary || state.admin.summary;
            state.admin.verified = true;
            state.admin.message = `${state.admin.results.length} licence record${state.admin.results.length === 1 ? '' : 's'} loaded.`;
            if (state.open && state.tab === 'admin') renderAdminTab();
        } catch (err) {
            state.admin.verified = false;
            adminSetMessage(`Admin search failed: ${err.message || String(err)}`, false);
        }
    }

    async function adminMutateLicence(action) {
        const values = adminFormValues();
        if (!Number.isInteger(values.tornId) || values.tornId <= 0) { adminSetMessage('Enter a valid Torn ID.', state.admin.verified); return; }
        if (action !== 'revoke' && (!Number.isInteger(values.days) || values.days < 1 || values.days > 3650)) { adminSetMessage('Days must be a whole number from 1 to 3650.', state.admin.verified); return; }
        const path = '/admin/licenses';
        const verb = action === 'grant' ? 'Granting' : action === 'extend' ? 'Extending' : 'Revoking';
        adminSetMessage(`${verb} licence for Torn ID ${values.tornId}…`, state.admin.verified);
        try {
            const payload = action === 'revoke' ? { tornId: values.tornId } : { tornId: values.tornId, name: values.name, days: values.days };
            const data = await adminRequest(path, { body: { action, ...payload } });
            state.admin.verified = true;
            state.admin.message = data.message || `Admin licence ${action} completed.`;
            await adminSearchLicences(false);
        } catch (err) {
            adminSetMessage(`Admin ${action} failed: ${err.message || String(err)}`, false);
        }
    }

    async function checkLicence(force = false) {
        if (state.licence?.checking) return licenceIsActive();
        if (!force && licenceIsActive()) return true;
        state.licence.checking = true;
        state.licence.status = 'checking';
        state.licence.message = 'Checking RWPH licence…';
        if (state.open && (state.tab === 'war' || state.tab === 'members')) renderTab(state.tab);
        try {
            if (!getApiKey()) {
                state.licence = { status: 'missing', checking: false, message: 'Save a Torn API key in Settings so RWPH can identify your Torn account before checking the licence.', tornId: 0, name: '', factionId: 0, expiresAt: 0, token: '', requestKey: '', sessionId: '', checkedAt: Date.now() };
                gm.del(KEYS.licenceSession);
                return false;
            }
            const identity = state.identity || await loadIdentity();
            const user = identity?.user || {};
            const faction = identity?.faction || state.faction || {};
            const tornId = Number(user?.id ?? user?.player_id ?? user?.ID ?? 0) || 0;
            const name = String(user?.name ?? user?.player_name ?? '').trim();
            if (!tornId) throw new Error('Could not determine your Torn ID for the RWPH licence check.');
            const data = await backendRequest('/license/check', {
                body: { tornId, name, factionId: Number(faction?.id || 0), appVersion: APP.version }, retries: 2,
            });
            const status = String(data.status || '').toLowerCase();
            if (status === 'active' && data.token && data.requestKey && data.sessionId) {
                state.licence = {
                    status: 'active', checking: false, message: data.message || 'RWPH licence is active.',
                    tornId, name, factionId: Number(faction?.id || 0),
                    expiresAt: Number(data.expiresAt || 0), token: String(data.token || ''), requestKey: String(data.requestKey || ''), sessionId: String(data.sessionId || ''), checkedAt: Date.now(),
                };
                saveLicenceSession();
                showNotification('Licence Active', data.message || 'RWPH licence verified and active.', 'good');
                return true;
            }
            gm.del(KEYS.licenceSession);
            state.licence = {
                status: status === 'expired' ? 'expired' : 'missing', checking: false,
                message: data.message || (status === 'expired' ? 'RWPH licence has expired.' : 'No RWPH licence was found for this Torn account.'),
                tornId, name, factionId: Number(faction?.id || 0), expiresAt: Number(data.expiresAt || 0), token: '', requestKey: '', sessionId: '', checkedAt: Date.now(),
            };
            return false;
        } catch (err) {
            gm.del(KEYS.licenceSession);
            state.licence = {
                status: err?.serverUnavailable ? 'unavailable' : (err?.licenceStatus || 'unavailable'), checking: false,
                message: err.message || String(err), tornId: Number(state.identity?.user?.id || 0), name: String(state.identity?.user?.name || ''),
                factionId: Number(state.faction?.id || 0), expiresAt: 0, token: '', requestKey: '', sessionId: '', checkedAt: Date.now(),
            };
            showNotification('Backend Error', err.message || String(err), 'bad');
            return false;
        } finally {
            state.licence.checking = false;
            if (state.open && (state.tab === 'war' || state.tab === 'members')) renderTab(state.tab);
        }
    }

    async function requireActiveLicence() {
        const ok = await checkLicence(true);
        if (!ok) {
            const status = state.licence?.status || 'missing';
            if (status === 'unavailable') throw new Error(`RWPH licence server unavailable: ${state.licence?.message || 'connection failed'}`);
            if (status === 'expired') throw new Error('RWPH licence expired. Renew the licence before calculating a payout.');
            throw new Error('RWPH licence missing. A valid server-side licence is required to calculate payouts.');
        }
        return true;
    }

    function restoreCachedLicenceSession() {
        const saved = readLicenceSession();
        if (!saved) return false;
        state.licence = {
            status: 'active', checking: false, message: 'Using a recently verified RWPH licence session.',
            tornId: Number(saved.tornId || 0), name: '', factionId: Number(saved.factionId || 0),
            expiresAt: Number(saved.licenceExpiresAt || 0), token: String(saved.token || ''), requestKey: String(saved.requestKey || ''), sessionId: String(saved.sessionId || ''), checkedAt: Date.now(),
        };
        return true;
    }

    function normalizeLicencePurchase(order) {
        if (!order || typeof order !== 'object') return null;
        const requestId = String(order.requestId || '').trim();
        const paymentCode = String(order.paymentCode || '').trim();
        if (!requestId || !paymentCode) return null;
        return {
            schemaVersion: 1,
            requestId,
            paymentCode,
            tornId: Number(order.tornId || 0),
            name: String(order.name || ''),
            factionId: Number(order.factionId || 0),
            mode: String(order.mode || 'buy') === 'extend' ? 'extend' : 'buy',
            xanaxQty: Math.max(1, Math.floor(Number(order.xanaxQty || 1))),
            daysAdded: Math.max(0, Number(order.daysAdded || 0)),
            recipientName: String(order.recipientName || ''),
            recipientId: Number(order.recipientId || 0),
            createdAt: Number(order.createdAt || Date.now()),
            expiresAt: Number(order.expiresAt || 0),
            status: String(order.status || 'pending').toLowerCase(),
            paidAt: Number(order.paidAt || 0),
            appliedExpiresAt: Number(order.appliedExpiresAt || 0),
        };
    }

    function saveLicencePurchase(order = state.licencePurchase) {
        const normalized = normalizeLicencePurchase(order);
        state.licencePurchase = normalized;
        if (!normalized) {
            gm.del(KEYS.licencePurchase);
            return null;
        }
        gm.set(KEYS.licencePurchase, JSON.stringify(normalized));
        return normalized;
    }

    function readLicencePurchase() {
        try {
            const raw = gm.get(KEYS.licencePurchase, '');
            if (!raw) return null;
            const parsed = normalizeLicencePurchase(JSON.parse(String(raw)));
            if (!parsed) {
                gm.del(KEYS.licencePurchase);
                return null;
            }
            if (parsed.status === 'pending' && parsed.expiresAt > 0 && parsed.expiresAt <= Date.now()) {
                parsed.status = 'expired';
                gm.set(KEYS.licencePurchase, JSON.stringify(parsed));
            }
            return parsed;
        } catch (_) {
            gm.del(KEYS.licencePurchase);
            return null;
        }
    }

    function clearLicencePurchase() {
        state.licencePurchase = null;
        gm.del(KEYS.licencePurchase);
    }

    function formatLicenceDuration(ms) {
        let total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
        const days = Math.floor(total / 86400); total %= 86400;
        const hours = Math.floor(total / 3600); total %= 3600;
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }

    function updateLicenceCountdownElements() {
        const remaining = Math.max(0, Number(state.licence?.expiresAt || 0) - Date.now());
        document.querySelectorAll('[data-rwph-licence-countdown]').forEach(el => {
            el.textContent = remaining > 0 ? formatLicenceDuration(remaining) : 'Expired';
        });
        if (state.licence?.status === 'active' && Number(state.licence?.expiresAt || 0) > 0 && remaining <= 0) {
            state.licence = { ...state.licence, status: 'expired', token: '', message: 'RWPH licence has expired.', checkedAt: Date.now() };
            gm.del(KEYS.licenceSession);
            state.protectedCalculation = null;
            if (state.open && (state.tab === 'war' || state.tab === 'members')) setTimeout(() => renderLicenceGate(), 0);
        }
        const order = state.licencePurchase || readLicencePurchase();
        const orderRemaining = order?.status === 'pending' ? Math.max(0, Number(order.expiresAt || 0) - Date.now()) : 0;
        document.querySelectorAll('[data-rwph-purchase-countdown]').forEach(el => {
            el.textContent = order?.status === 'pending' && orderRemaining > 0 ? formatLicenceDuration(orderRemaining) : (order?.status === 'paid' ? 'Paid' : 'Expired');
        });
        if (order?.status === 'pending' && orderRemaining <= 0) {
            order.status = 'expired';
            saveLicencePurchase(order);
        }
    }

    let licenceCountdownTimer = null;
    function startLicenceCountdownTimer() {
        if (licenceCountdownTimer) clearInterval(licenceCountdownTimer);
        updateLicenceCountdownElements();
        licenceCountdownTimer = setInterval(updateLicenceCountdownElements, 1000);
    }

    function stopLicenceCountdownTimer() {
        if (licenceCountdownTimer) clearInterval(licenceCountdownTimer);
        licenceCountdownTimer = null;
    }

    function licencePurchaseRecipient(order) {
        if (!order) return '—';
        return order.recipientId ? `${order.recipientName || 'Recipient'} [${order.recipientId}]` : (order.recipientName || '—');
    }

    function renderLicencePurchaseCard() {
        const order = state.licencePurchase || readLicencePurchase();
        state.licencePurchase = order;
        const status = String(state.licence?.status || 'unchecked');
        const hasKey = !!getApiKey();
        if (order) {
            const orderStatus = String(order.status || 'pending');
            const statusClass = orderStatus === 'paid' ? 'good' : orderStatus === 'pending' ? 'warn' : 'bad';
            return `<section class="rwph-card">
                <h3>Xanax Licence ${order.mode === 'extend' ? 'Extension' : 'Purchase'}</h3>
                <div class="rwph-kpis">
                    <div class="rwph-kpi"><b>${escapeHtml(orderStatus === 'paid' ? 'Paid / Applied' : orderStatus === 'pending' ? 'Waiting for Payment' : 'Expired')}</b><span>Order Status</span></div>
                    <div class="rwph-kpi"><b>${escapeHtml(order.xanaxQty)}</b><span>Xanax</span></div>
                    <div class="rwph-kpi"><b>${escapeHtml(order.daysAdded)}</b><span>Licence Days</span></div>
                    <div class="rwph-kpi"><b data-rwph-purchase-countdown>${orderStatus === 'pending' ? formatLicenceDuration(Number(order.expiresAt || 0) - Date.now()) : escapeHtml(orderStatus)}</b><span>Order Time Left</span></div>
                </div>
                <div class="rwph-note"><b>Recipient:</b> ${escapeHtml(licencePurchaseRecipient(order))}<br><b>Payment code:</b> <code>${escapeHtml(order.paymentCode)}</code><br><b>Request ID:</b> <code>${escapeHtml(order.requestId)}</code><br><br>Send exactly <b>${escapeHtml(order.xanaxQty)} Xanax</b> to the recipient and include the payment code with the transfer. The transfer itself is manual.</div>
                <div class="rwph-btn-row" style="margin-top:10px;">
                    <button class="rwph-btn" data-action="copy-purchase-recipient">Copy Recipient</button>
                    <button class="rwph-btn" data-action="copy-purchase-code">Copy Code</button>
                    <button class="rwph-btn primary" data-action="check-purchase">Check Payment</button>
                    <button class="rwph-btn danger" data-action="new-purchase">New Order</button>
                </div>
                ${orderStatus === 'paid' && order.appliedExpiresAt ? `<div class="rwph-status good">Licence applied until ${escapeHtml(new Date(order.appliedExpiresAt).toLocaleString())}.</div>` : ''}
            </section>`;
        }
        const canBuy = hasKey && ['missing','expired'].includes(status);
        const canExtend = hasKey && status === 'active';
        return `<section class="rwph-card">
            <h3>Xanax Licence Purchase</h3>
            <p><b>Licence rate:</b> 1 Xanax = ${XANAX_LICENCE_DAYS} days.</p>
            <div class="rwph-field"><label>Xanax Quantity</label><input id="rwph-xanax-qty" type="number" min="1" max="100" step="1" value="1"></div>
            <div class="rwph-btn-row">
                <button class="rwph-btn primary" data-action="create-purchase" data-purchase-mode="buy" ${canBuy ? '' : 'disabled'}>Buy Licence</button>
                <button class="rwph-btn primary" data-action="create-purchase" data-purchase-mode="extend" ${canExtend ? '' : 'disabled'}>Extend Licence</button>
            </div>
            <div class="rwph-note">Buy Licence is available for missing/expired licences. Extend Licence is available while your licence is active. The backend generates a unique request ID and payment code. RWPH never sends Xanax automatically.</div>
        </section>`;
    }

    async function createLicencePurchase(mode) {
        mode = mode === 'extend' ? 'extend' : 'buy';
        if (!getApiKey()) {
            setStatus('Save a Torn API key first so RWPH can identify the licence owner.', 'bad');
            return;
        }
        const qtyEl = document.querySelector('#rwph-xanax-qty');
        const xanaxQty = Math.floor(Number(qtyEl?.value || 1));
        if (!Number.isInteger(xanaxQty) || xanaxQty < 1 || xanaxQty > 100) {
            setStatus('Xanax quantity must be a whole number from 1 to 100.', 'bad');
            return;
        }
        setBusy(true);
        setStatus(`Creating RWPH ${mode === 'extend' ? 'extension' : 'purchase'} order…`);
        try {
            const identity = state.identity || await loadIdentity();
            const user = identity?.user || {};
            const faction = identity?.faction || state.faction || {};
            const tornId = Number(user?.id ?? user?.player_id ?? user?.ID ?? 0) || 0;
            const name = String(user?.name ?? user?.player_name ?? '').trim();
            const data = await backendRequest(mode === 'extend' ? '/license/extend' : '/license/buy', {
                body: { tornId, name, factionId: Number(faction?.id || 0), xanaxQty, appVersion: APP.version },
            });
            const order = normalizeLicencePurchase(data.order || data);
            if (!order) throw new Error('RWPH cloud backend returned an invalid purchase order.');
            saveLicencePurchase(order);
            setStatus(`Payment order created: ${order.xanaxQty} Xanax = ${order.daysAdded} licence days.`, 'good');
            if (state.open) renderTab(state.tab);
        } catch (err) {
            setStatus(`Could not create licence order: ${err.message || String(err)}`, 'bad');
            if (state.open) renderTab(state.tab);
        } finally {
            setBusy(false);
        }
    }

    async function checkLicencePurchase() {
        const order = state.licencePurchase || readLicencePurchase();
        if (!order) {
            setStatus('No saved licence purchase order exists.', 'bad');
            return;
        }
        setBusy(true);
        setStatus('Checking Xanax licence payment order…');
        try {
            const data = await backendRequest('/license/purchase/status', {
                retries: 2,
                body: { requestId: order.requestId, paymentCode: order.paymentCode, tornId: order.tornId },
            });
            const updated = normalizeLicencePurchase(data.order || data);
            if (!updated) throw new Error('RWPH cloud backend returned an invalid order status.');
            saveLicencePurchase(updated);
            if (updated.status === 'paid') {
                await checkLicence(true);
                setStatus(`Xanax payment applied. RWPH licence is active until ${licenceExpiryText()}.`, 'good');
            } else if (updated.status === 'expired') {
                setStatus('This Xanax payment order expired. Create a new order before sending payment.', 'bad');
            } else {
                setStatus('Payment is still pending. Confirm the Xanax transfer manually, then check again.', 'warn');
            }
            if (state.open) renderTab(state.tab);
        } catch (err) {
            setStatus(`Could not check licence order: ${err.message || String(err)}`, 'bad');
            if (state.open) renderTab(state.tab);
        } finally {
            setBusy(false);
        }
    }

    function newApiReliabilityStats() {
        return {
            requests: 0,
            retries: 0,
            rateLimitWaits: 0,
            transientRetries: 0,
            attackPages: 0,
            outgoingPages: 0,
            incomingPages: 0,
            duplicatesSkipped: 0,
            fallbackIdsUsed: 0,
            lastWaitMs: 0,
        };
    }

    function apiReliabilityStats() {
        if (!state.apiReliability) state.apiReliability = newApiReliabilityStats();
        return state.apiReliability;
    }

    function resetApiReliabilityStats() {
        state.apiReliability = newApiReliabilityStats();
        return state.apiReliability;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
    }

    function parseRetryAfterMs(headers) {
        const text = String(headers || '');
        const match = text.match(/^retry-after\s*:\s*([^\r\n]+)/im);
        if (!match) return 0;
        const raw = String(match[1] || '').trim();
        const seconds = Number(raw);
        if (Number.isFinite(seconds) && seconds >= 0) return Math.min(120000, seconds * 1000);
        const dateMs = Date.parse(raw);
        return Number.isFinite(dateMs) ? Math.max(0, Math.min(120000, dateMs - Date.now())) : 0;
    }

    function makeTornApiError(response, data, fallbackMessage) {
        const apiError = data?.error;
        const code = Number(apiError?.code ?? 0) || 0;
        const apiMessage = typeof apiError === 'string'
            ? apiError
            : (apiError?.error || apiError?.message || fallbackMessage || `HTTP ${response?.status || 0}`);
        const err = new Error(`Torn API: ${apiMessage}`);
        err.apiCode = code;
        err.httpStatus = Number(response?.status || 0);
        err.retryAfterMs = parseRetryAfterMs(response?.responseHeaders || '');
        err.isRateLimit = err.httpStatus === 429 || code === 5 || /too many requests|rate.?limit/i.test(String(apiMessage || ''));
        err.isTransient = err.httpStatus >= 500 || err.httpStatus === 408;
        return err;
    }

    function queueTornRequest(task) {
        const queued = tornRequestQueue.then(async () => {
            const sinceLast = Date.now() - lastTornRequestAt;
            if (lastTornRequestAt && sinceLast < TORN_REQUEST_MIN_GAP_MS) {
                await sleep(TORN_REQUEST_MIN_GAP_MS - sinceLast);
            }
            lastTornRequestAt = Date.now();
            return task();
        });
        tornRequestQueue = queued.catch(() => undefined);
        return queued;
    }

    function requestJsonOnce(urlObj, purpose = 'Torn API request') {
        return new Promise((resolve, reject) => {
            const key = getApiKey();
            if (!key) {
                reject(new Error('No Torn API key is saved. Open Settings and save a key first.'));
                return;
            }
            apiReliabilityStats().requests += 1;
            if (state.reportLoading?.active) updateReportLoadingDom();

            GM_xmlhttpRequest({
                method: 'GET',
                url: urlObj.toString(),
                headers: { Authorization: `ApiKey ${key}`, Accept: 'application/json' },
                timeout: 30000,
                onload(response) {
                    let data;
                    try { data = JSON.parse(response.responseText || '{}'); }
                    catch (_) {
                        const err = new Error(`${purpose} returned invalid JSON (HTTP ${response.status}).`);
                        err.httpStatus = Number(response.status || 0);
                        err.isTransient = err.httpStatus >= 500;
                        reject(err);
                        return;
                    }
                    if (response.status < 200 || response.status >= 300 || data?.error) {
                        reject(makeTornApiError(response, data, `HTTP ${response.status}`));
                        return;
                    }
                    resolve(data);
                },
                ontimeout() {
                    const err = new Error(`${purpose} timed out.`);
                    err.isTransient = true;
                    reject(err);
                },
                onerror() {
                    const err = new Error(`Could not reach the Torn API during ${purpose}.`);
                    err.isTransient = true;
                    reject(err);
                },
            });
        });
    }

    async function requestJsonReliably(urlObj, purpose = 'Torn API request') {
        const requestKey = canonicalPaginationUrl(urlObj);
        if (tornInFlightRequests.has(requestKey)) {
            apiReliabilityStats().duplicatesSkipped += 1;
            return tornInFlightRequests.get(requestKey);
        }
        const task = (async () => {
            let rateAttempt = 0;
            let transientAttempt = 0;
            while (true) {
                try {
                    return await queueTornRequest(() => requestJsonOnce(urlObj, purpose));
                } catch (err) {
                    const stats = apiReliabilityStats();
                    if (err?.isRateLimit && rateAttempt < TORN_RATE_LIMIT_MAX_ATTEMPTS - 1) {
                        rateAttempt += 1;
                        stats.retries += 1;
                        stats.rateLimitWaits += 1;
                        const fallbackWait = Math.min(60000, 15000 * (2 ** (rateAttempt - 1)));
                        const waitMs = Math.max(Number(err.retryAfterMs || 0), fallbackWait);
                        stats.lastWaitMs = waitMs;
                        setReportLoadingDetail(`Torn rate limit detected. Pausing ${Math.ceil(waitMs / 1000)}s before retry ${rateAttempt + 1}/${TORN_RATE_LIMIT_MAX_ATTEMPTS}…`);
                        await sleep(waitMs);
                        continue;
                    }
                    if (err?.isTransient && transientAttempt < TORN_TRANSIENT_MAX_ATTEMPTS - 1) {
                        transientAttempt += 1;
                        stats.retries += 1;
                        stats.transientRetries += 1;
                        const waitMs = 1500 * (2 ** (transientAttempt - 1));
                        stats.lastWaitMs = waitMs;
                        setReportLoadingDetail(`Temporary Torn/API connection problem. Retrying in ${Math.ceil(waitMs / 1000)}s (${transientAttempt + 1}/${TORN_TRANSIENT_MAX_ATTEMPTS})…`);
                        await sleep(waitMs);
                        continue;
                    }
                    throw err;
                }
            }
        })();
        tornInFlightRequests.set(requestKey, task);
        try { return await task; }
        finally { if (tornInFlightRequests.get(requestKey) === task) tornInFlightRequests.delete(requestKey); }
    }

    function cloneJson(value, fallback = null) {
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
    }

    function reportCacheKey(mode) {
        return mode === 'advanced' ? KEYS.advancedReportCache : KEYS.basicReportCache;
    }

    function reportCacheLabel(mode) {
        return mode === 'advanced' ? 'Advanced' : 'Basic';
    }

    function readReportCache(mode) {
        const key = reportCacheKey(mode);
        try {
            const raw = gm.get(key, '');
            if (!raw) return null;
            let parsed = JSON.parse(String(raw));
            if (!parsed || parsed.mode !== mode) throw new Error('Invalid cache');
            if (Number(parsed.schemaVersion || 0) < REPORT_CACHE_SCHEMA_VERSION || !Array.isArray(parsed.rowsPacked)) {
                parsed = migratePackedSnapshot(parsed, 'cache');
                if (!parsed) throw new Error('Could not migrate cache');
                gm.set(key, JSON.stringify(parsed));
            }
            if (Number(parsed.expiresAt || 0) <= Date.now()) { gm.del(key); return null; }
            const reportRows = unpackReportRows(parsed.rowsPacked);
            if (!reportRows.length && parsed.rowsPacked.length) throw new Error('Invalid packed rows');
            return { ...parsed, reportRows };
        } catch (_) {
            gm.del(key);
            return null;
        }
    }

    function cacheRemainingText(cache) {
        if (!cache) return 'No cached report saved.';
        const ms = Math.max(0, Number(cache.expiresAt || 0) - Date.now());
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const warId = Number(cache?.selectedWar?.id || 0);
        return `War #${warId || '—'} · ${minutes}m ${String(seconds).padStart(2, '0')}s remaining`;
    }

    function isCachedViewActive(mode = currentPayoutMode()) {
        return !!state.activeCachedReport && state.activeCachedReport.mode === mode;
    }

    function captureLiveStateBeforeCache() {
        if (state.liveStateBeforeCache) return;
        state.liveStateBeforeCache = {
            payoutMode: state.payoutMode,
            faction: state.faction,
            selectedWar: state.selectedWar,
            selectedWarReport: state.selectedWarReport,
            attacks: state.attacks,
            incomingAttacks: state.incomingAttacks,
            reportRows: state.reportRows,
            includedMembers: state.includedMembers,
            advancedIncludedMembers: state.advancedIncludedMembers,
            memberAdjustments: state.memberAdjustments,
            memberAdjustmentsExpiresAt: state.memberAdjustmentsExpiresAt,
            reportSort: state.reportSort,
            protectedCalculation: state.protectedCalculation,
        };
    }

    function restoreLiveStateFromCache() {
        const live = state.liveStateBeforeCache;
        if (!live) return;
        state.payoutMode = live.payoutMode;
        state.faction = live.faction;
        state.selectedWar = live.selectedWar;
        state.selectedWarReport = live.selectedWarReport;
        state.attacks = live.attacks;
        state.incomingAttacks = live.incomingAttacks;
        state.reportRows = live.reportRows;
        state.includedMembers = live.includedMembers;
        state.advancedIncludedMembers = live.advancedIncludedMembers;
        state.memberAdjustments = live.memberAdjustments;
        state.memberAdjustmentsExpiresAt = live.memberAdjustmentsExpiresAt;
        state.reportSort = live.reportSort;
        state.protectedCalculation = live.protectedCalculation || null;
        state.liveStateBeforeCache = null;
    }

    function exitCachedReport(restore = true, rerender = true) {
        if (restore) restoreLiveStateFromCache();
        else state.liveStateBeforeCache = null;
        state.activeCachedReport = null;
        if (rerender && state.open && state.tab === 'war') renderWarTab();
    }

    function saveCurrentReportCache(mode = currentPayoutMode(), configOverride = null, rangeOverride = null) {
        if (!state.reportRows.length || state.activeCachedReport) return null;
        const createdAt = Date.now();
        const snapshot = {
            schemaVersion: REPORT_CACHE_SCHEMA_VERSION,
            appVersion: APP.version,
            mode,
            createdAt,
            expiresAt: createdAt + REPORT_CACHE_TTL_MS,
            faction: cloneJson(state.faction, null),
            selectedWar: cloneJson(state.selectedWar, null),
            selectedWarReport: null,
            rowsPacked: packReportRows(state.reportRows),
            includedMembers: [...state.includedMembers],
            advancedIncludedMembers: [...state.advancedIncludedMembers],
            memberAdjustments: cloneJson(state.memberAdjustments, {}),
            reportSort: cloneJson(state.reportSort, { key: 'warHits', direction: 'desc' }),
            protectedCalculation: cloneJson(state.protectedCalculation, null),
            range: rangeOverride ? cloneJson(rangeOverride, {}) : {
                startInput: String(document.querySelector('#rwph-start')?.value || gm.get(KEYS.manualStart, '')),
                endInput: String(document.querySelector('#rwph-end')?.value || gm.get(KEYS.manualEnd, '')),
            },
            config: configOverride ? cloneJson(configOverride, {}) : (mode === 'advanced' ? cloneJson(advancedConfigFromDom(), {}) : cloneJson(basicConfigFromDom(), {})),
            poolSplit: cloneJson(currentPoolSplit(), { members: 100, faction: 0 }),
        };
        gm.set(reportCacheKey(mode), JSON.stringify(snapshot));
        showNotification('Report Cached', `${reportCacheLabel(mode)} report cached for 10 minutes.`, 'good');
        return snapshot;
    }

    function activateReportCache(mode) {
        const cache = readReportCache(mode);
        if (!cache) {
            setStatus(`${reportCacheLabel(mode)} cached report is missing or has expired.`, 'bad');
            renderWarTab();
            return;
        }
        if (state.activeCachedReport) restoreLiveStateFromCache();
        captureLiveStateBeforeCache();
        state.activeCachedReport = cache;
        state.payoutMode = mode;
        state.faction = cloneJson(cache.faction, null);
        state.selectedWar = cloneJson(cache.selectedWar, null);
        state.selectedWarReport = cloneJson(cache.selectedWarReport, null);
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = cloneJson(cache.reportRows, []);
        state.includedMembers = new Set((cache.includedMembers || []).map(Number));
        state.advancedIncludedMembers = new Set((cache.advancedIncludedMembers || []).map(Number));
        state.memberAdjustments = cloneJson(cache.memberAdjustments, {});
        state.memberAdjustmentsExpiresAt = Number(cache.expiresAt || 0);
        state.reportSort = cloneJson(cache.reportSort, { key: 'warHits', direction: 'desc' });
        state.protectedCalculation = cloneJson(cache.protectedCalculation, null);
        setStatus(`Using frozen ${reportCacheLabel(mode)} cached report. ${cacheRemainingText(cache)}. Live payout settings will not alter this cached result.`, 'good');
        renderWarTab();
    }

    function deleteReportCache(mode) {
        const wasActive = isCachedViewActive(mode);
        gm.del(reportCacheKey(mode));
        if (wasActive) {
            restoreLiveStateFromCache();
            state.activeCachedReport = null;
        }
        setStatus(`${reportCacheLabel(mode)} cached report deleted.`, 'good');
        showNotification('Cache Deleted', `${reportCacheLabel(mode)} cached report deleted.`, 'good');
        renderWarTab();
    }

    function cacheControlsHtml(mode) {
        const cache = readReportCache(mode);
        const active = isCachedViewActive(mode);
        return `<div class="rwph-card" style="margin-top:10px;padding:10px;">
            <h3 style="margin-top:0;">${reportCacheLabel(mode)} Report Cache</h3>
            <div class="rwph-note">${cache ? escapeHtml(cacheRemainingText(cache)) : 'No unexpired cached report is currently saved for this mode.'}</div>
            <div class="rwph-btn-row">
                <button class="rwph-btn" type="button" data-action="use-report-cache" data-cache-mode="${mode}" ${cache && !active ? '' : 'disabled'}>Use Cached Report</button>
                <button class="rwph-btn danger" type="button" data-action="delete-report-cache" data-cache-mode="${mode}" ${cache ? '' : 'disabled'}>Delete Cache</button>
                ${active ? '<button class="rwph-btn primary" type="button" data-action="return-live-report">Return to Live Report</button>' : ''}
            </div>
            ${active ? '<div class="rwph-status good">Cached report is frozen. Payout fields, member selections and Member Management are locked until you return to the live report.</div>' : ''}
        </div>`;
    }

    function memberManagementWarId() {
        return String(Number(state.selectedWar?.id || 0) || 0);
    }

    function readMemberManagementStore() {
        try {
            const raw = gm.get(KEYS.memberManagement, '');
            const parsed = raw ? JSON.parse(String(raw)) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writeMemberManagementStore(store) {
        const wars = store?.wars && typeof store.wars === 'object' ? store.wars : {};
        const now = Date.now();
        for (const [warId, entry] of Object.entries(wars)) {
            if (!entry || Number(entry.expiresAt || 0) <= now) delete wars[warId];
        }
        if (!Object.keys(wars).length) {
            gm.del(KEYS.memberManagement);
            return;
        }
        gm.set(KEYS.memberManagement, JSON.stringify({ version: 1, wars }));
    }

    function loadMemberManagementState() {
        const warId = memberManagementWarId();
        const store = readMemberManagementStore();
        const wars = store?.wars && typeof store.wars === 'object' ? store.wars : {};
        const now = Date.now();
        for (const [id, entry] of Object.entries(wars)) {
            if (!entry || Number(entry.expiresAt || 0) <= now) delete wars[id];
        }

        const entry = warId !== '0' ? wars[warId] : null;
        state.memberAdjustments = entry?.adjustments && typeof entry.adjustments === 'object'
            ? JSON.parse(JSON.stringify(entry.adjustments))
            : {};
        state.memberAdjustmentsExpiresAt = Number(entry?.expiresAt || 0);
        writeMemberManagementStore({ version: 1, wars });
    }

    function saveMemberManagementState() {
        const warId = memberManagementWarId();
        if (warId === '0') return;
        const store = readMemberManagementStore();
        const wars = store?.wars && typeof store.wars === 'object' ? store.wars : {};
        const expiresAt = Date.now() + MEMBER_MANAGEMENT_TTL_MS;
        wars[warId] = {
            expiresAt,
            adjustments: JSON.parse(JSON.stringify(state.memberAdjustments || {})),
        };
        state.memberAdjustmentsExpiresAt = expiresAt;
        writeMemberManagementStore({ version: 1, wars });
    }

    function clearMemberManagementState() {
        const warId = memberManagementWarId();
        const store = readMemberManagementStore();
        const wars = store?.wars && typeof store.wars === 'object' ? store.wars : {};
        if (warId !== '0') delete wars[warId];
        state.memberAdjustments = {};
        state.memberAdjustmentsExpiresAt = 0;
        writeMemberManagementStore({ version: 1, wars });
    }

    function ensureMemberManagementFresh() {
        if (state.memberAdjustmentsExpiresAt && Date.now() > state.memberAdjustmentsExpiresAt) {
            clearMemberManagementState();
        }
    }

    function normaliseMemberAdjustment(value = {}) {
        const removeHitsRaw = Number(value.removeHits || 0);
        const removeRespectRaw = Number(value.removeRespect || 0);
        return {
            excluded: !!value.excluded,
            removeHits: Number.isFinite(removeHitsRaw) ? Math.max(0, Math.floor(removeHitsRaw)) : 0,
            removeRespect: Number.isFinite(removeRespectRaw) ? Math.max(0, removeRespectRaw) : 0,
        };
    }

    function getMemberAdjustment(id) {
        if (!state.activeCachedReport) ensureMemberManagementFresh();
        return normaliseMemberAdjustment(state.memberAdjustments?.[String(Number(id))] || {});
    }

    function setMemberAdjustment(id, patch = {}) {
        const key = String(Number(id));
        const current = getMemberAdjustment(id);
        const next = normaliseMemberAdjustment({ ...current, ...patch });
        if (!next.excluded && next.removeHits <= 0 && next.removeRespect <= 0) delete state.memberAdjustments[key];
        else state.memberAdjustments[key] = next;
        saveMemberManagementState();
        return next;
    }

    function isMemberExcluded(rowOrId) {
        const id = typeof rowOrId === 'object' ? rowOrId?.id : rowOrId;
        return getMemberAdjustment(id).excluded;
    }

    function adjustedWarHits(row) {
        const original = Math.max(0, Number(row?.warHits || 0));
        const remove = Math.min(original, getMemberAdjustment(row?.id).removeHits);
        return Math.max(0, original - remove);
    }

    function adjustedRespect(row) {
        const original = Math.max(0, Number(row?.respect || 0));
        const remove = Math.min(original, getMemberAdjustment(row?.id).removeRespect);
        return Math.max(0, original - remove);
    }

    function adjustmentValueHtml(original, adjusted, digits = 0) {
        const before = Number(original || 0);
        const after = Number(adjusted || 0);
        if (Math.abs(before - after) < 1e-9) return formatNumber(after, digits);
        return `<span class="rwph-adjusted">${formatNumber(after, digits)}</span><div class="rwph-muted">Original ${formatNumber(before, digits)}</div>`;
    }

    function memberAdjustmentRemainingText() {
        ensureMemberManagementFresh();
        if (!state.memberAdjustmentsExpiresAt) return 'No saved member adjustments for this war.';
        const ms = Math.max(0, state.memberAdjustmentsExpiresAt - Date.now());
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `Saved for ${minutes}m ${String(seconds).padStart(2, '0')}s more. Editing a member refreshes the 20-minute timer.`;
    }

    GM_addStyle(`
        :root {
            --rwph-bg: #17191d;
            --rwph-bg2: #202329;
            --rwph-bg3: #2a2e35;
            --rwph-line: #3b414b;
            --rwph-text: #edf0f4;
            --rwph-muted: #aab1bc;
            --rwph-accent: #d08a2d;
            --rwph-good: #55b985;
            --rwph-bad: #dc6d6d;
            --rwph-shadow: 0 18px 55px rgba(0,0,0,.45);
        }
        #rwph-launcher {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            gap: 6px;
            width: auto;
            min-width: 30px;
            max-width: 92px;
            height: 30px;
            min-height: 30px;
            margin: 0 0 0 8px;
            padding: 2px 8px 2px 3px;
            box-sizing: border-box;
            overflow: hidden;
            white-space: nowrap;
            border: 1px solid #555b64;
            border-radius: 6px;
            background: linear-gradient(180deg,#30343a,#202328);
            color: #fff;
            font: 700 12px/1 Arial,sans-serif;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,.35);
            vertical-align: middle;
            position: relative;
            inset: auto;
            transform: none;
            z-index: 9998;
        }
        #rwph-launcher:hover { filter: brightness(1.12); }
        #rwph-launcher:focus-visible { outline:2px solid #d08a2d;outline-offset:2px; }
        #rwph-launcher .rwph-mark,
        .rwph-brand .rwph-mark {
            display:inline-grid;
            place-items:center;
            width:24px;height:24px;
            min-width:24px;
            flex:0 0 24px;
            border-radius:50%;
            background: radial-gradient(circle at 35% 30%, #f5b45f, #a85e12 70%);
            color:#111;
            font:900 9px/1 Arial,sans-serif;
            letter-spacing:-.4px;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
        }
        #rwph-launcher .rwph-label { overflow:hidden;text-overflow:clip; }
        #rwph-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000000;
            background: rgba(7,8,10,.72);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
            box-sizing: border-box;
        }
        #rwph-panel {
            width: min(1080px, 96vw);
            max-height: min(820px, 92vh);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--rwph-bg);
            color: var(--rwph-text);
            border: 1px solid var(--rwph-line);
            border-radius: 12px;
            box-shadow: var(--rwph-shadow);
            font-family: Arial, Helvetica, sans-serif;
        }
        .rwph-header {
            display:flex;
            align-items:center;
            gap:12px;
            padding:12px 14px;
            background:linear-gradient(180deg,#2a2e34,#202328);
            border-bottom:1px solid var(--rwph-line);
        }
        .rwph-brand { display:flex;align-items:center;gap:10px;min-width:0; }
        .rwph-brand .rwph-mark { width:40px;height:40px;font-size:13px;flex:0 0 auto; }
        .rwph-title { font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .rwph-subtitle { margin-top:2px;color:var(--rwph-muted);font-size:11px; }
        .rwph-spacer { flex:1; }
        .rwph-close {
            width:34px;height:34px;border-radius:7px;border:1px solid #50555e;
            background:#1a1c20;color:#fff;font-size:22px;line-height:30px;cursor:pointer;
        }
        .rwph-tabs { display:flex;gap:6px;padding:9px 12px;background:#14161a;border-bottom:1px solid var(--rwph-line); }
        .rwph-tab {
            border:1px solid #434851;background:#23262c;color:#d9dde3;border-radius:6px;
            padding:7px 11px;cursor:pointer;font-weight:700;font-size:12px;
        }
        .rwph-tab.active { border-color:var(--rwph-accent);color:#fff;background:#34291d; }
        .rwph-body { overflow:auto;padding:14px; }
        .rwph-grid { display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px; }
        .rwph-card { grid-column:span 12;background:var(--rwph-bg2);border:1px solid var(--rwph-line);border-radius:9px;padding:12px; }
        .rwph-card.half { grid-column:span 6; }
        .rwph-card.third { grid-column:span 4; }
        .rwph-card h3 { margin:0 0 9px;font-size:14px; }
        .rwph-card p { margin:7px 0;color:var(--rwph-muted);font-size:12px;line-height:1.45; }
        .rwph-form-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px; }
        .rwph-field label { display:block;margin-bottom:4px;color:#cdd2d9;font-size:11px;font-weight:700; }
        .rwph-field input,.rwph-field select {
            width:100%;box-sizing:border-box;background:#121417;color:#fff;border:1px solid #484e58;
            border-radius:6px;padding:8px;font-size:12px;outline:none;
        }
        .rwph-field input:focus,.rwph-field select:focus { border-color:var(--rwph-accent); }
        .rwph-btn-row { display:flex;flex-wrap:wrap;gap:7px;margin-top:10px; }
        .rwph-btn {
            border:1px solid #525863;background:#2b2f36;color:#fff;border-radius:6px;padding:8px 11px;
            font-weight:800;font-size:12px;cursor:pointer;
        }
        .rwph-btn:hover { filter:brightness(1.1); }
        .rwph-btn.primary { background:#8f5719;border-color:#c77c25; }
        .rwph-btn.danger { background:#5e2828;border-color:#9e4646; }
        .rwph-btn:disabled { opacity:.45;cursor:not-allowed;filter:none; }
        .rwph-status {
            margin-top:10px;border-left:3px solid var(--rwph-accent);background:#171a1f;padding:8px 10px;
            color:#dce0e5;font-size:12px;white-space:pre-wrap;
        }
        .rwph-status.good { border-color:var(--rwph-good); }
        .rwph-status.bad { border-color:var(--rwph-bad); }
        .rwph-kpis { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px; }
        .rwph-kpi { background:#15171b;border:1px solid #363b44;border-radius:7px;padding:9px; }
        .rwph-kpi b { display:block;font-size:17px;color:#fff; }
        .rwph-kpi span { color:var(--rwph-muted);font-size:10px;text-transform:uppercase;letter-spacing:.4px; }
        .rwph-table-wrap { overflow:auto;border:1px solid #3b414b;border-radius:8px;margin-top:10px; }
        table.rwph-table { width:100%;border-collapse:collapse;min-width:1080px;font-size:11px; }
        .rwph-table th { position:sticky;top:0;background:#2b2f35;color:#f2f3f5;text-align:left;padding:8px;border-bottom:1px solid #4a505a; }
        .rwph-sort-btn { appearance:none;border:0;background:transparent;color:inherit;padding:0;margin:0;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap; }
        .rwph-sort-btn:hover { color:#ffd79d; }
        .rwph-sort-btn.active { color:#f5bd6c; }
        .rwph-sort-arrow { display:inline-block;min-width:10px;margin-left:3px;color:#f5bd6c; }
        .rwph-report-heading { margin:12px 0 6px;font-size:12px;color:#f0f2f5;text-transform:uppercase;letter-spacing:.55px; }
        .rwph-notables { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px; }
        .rwph-notable { background:#171a1f;border:1px solid #3a4049;border-radius:7px;padding:9px;min-width:0; }
        .rwph-notable span { display:block;color:var(--rwph-muted);font-size:9px;text-transform:uppercase;letter-spacing:.45px;margin-bottom:4px; }
        .rwph-notable b { display:block;color:#fff;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .rwph-table td { padding:7px 8px;border-bottom:1px solid #30343b;color:#dfe3e7; }
        .rwph-table tr:nth-child(even) td { background:#1b1e23; }
        .rwph-pill { display:inline-block;padding:3px 6px;border-radius:999px;background:#343a43;color:#dbe1e8;font-size:10px; }
        .rwph-member-check,.rwph-mm-exclude { width:16px;height:16px;accent-color:var(--rwph-accent);cursor:pointer; }
        .rwph-money { white-space:nowrap;font-weight:800; }
        .rwph-negative { color:var(--rwph-bad)!important; }
        .rwph-positive { color:var(--rwph-good)!important; }
        .rwph-muted { color:var(--rwph-muted); }
        .rwph-note { padding:9px;border:1px dashed #4b525d;border-radius:7px;background:#191c21;color:#bac1ca;font-size:11px;line-height:1.45; }
        .rwph-mode-row { display:flex;gap:7px;flex-wrap:wrap;margin:0 0 10px; }
        .rwph-mode-btn { flex:1 1 180px;border:1px solid #4b515b;background:#20242a;color:#dce1e6;border-radius:7px;padding:9px 12px;font-weight:800;cursor:pointer; }
        .rwph-mode-btn.active { border-color:var(--rwph-accent);background:#3a2b1c;color:#fff;box-shadow:inset 0 0 0 1px rgba(208,138,45,.22); }
        .rwph-weight-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px; }
        .rwph-score { white-space:nowrap;font-weight:800; }
        .rwph-adjusted { color:#f0b45c!important;font-weight:800; }
        .rwph-excluded-row td { opacity:.58; }
        .rwph-mm-input { width:92px;box-sizing:border-box;background:#121417;color:#fff;border:1px solid #484e58;border-radius:6px;padding:6px;font-size:11px; }
        .rwph-mm-input:focus { border-color:var(--rwph-accent);outline:none; }
        .rwph-mm-actions { display:flex;gap:6px;flex-wrap:wrap;align-items:center; }
        .rwph-badge { display:inline-block;padding:2px 6px;border-radius:999px;font-size:9px;font-weight:800;background:#343a43;color:#dbe1e8;white-space:nowrap; }
        .rwph-badge.warn { background:#5a3a17;color:#ffd69b; }
        .rwph-badge.bad { background:#562727;color:#ffc5c5; }
        #rwph-payments-panel { position:fixed;z-index:1000002;right:18px;top:78px;width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 96px);display:flex;flex-direction:column;background:var(--rwph-bg);border:1px solid #4b515b;border-radius:10px;box-shadow:var(--rwph-shadow);color:var(--rwph-text);overflow:hidden;font-family:Arial,sans-serif; }
        .rwph-payments-head { display:flex;align-items:center;gap:10px;padding:11px 12px;background:linear-gradient(180deg,#2d3138,#22252a);border-bottom:1px solid var(--rwph-line); }
        .rwph-payments-head > div:first-child { min-width:0;flex:1; }
        .rwph-payments-title { font-size:15px;font-weight:900;color:#fff; }
        .rwph-payments-subtitle { margin-top:3px;color:var(--rwph-muted);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .rwph-payments-body { padding:11px;overflow:auto; }
        .rwph-payment-list { display:grid;gap:8px;margin-top:10px; }
        .rwph-payment-row { border:1px solid #3b414b;border-radius:8px;background:#1b1e23;padding:9px; }
        .rwph-payment-member { display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:12px; }
        .rwph-payment-amount { color:#fff;font-size:13px;font-weight:900;white-space:nowrap; }
        .rwph-payment-actions { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px; }
        .rwph-payment-actions .rwph-btn { padding:6px 8px;font-size:10px; }
        .rwph-payment-status { margin-top:7px;padding:6px 7px;border-left:3px solid #515863;background:#15181d;color:#b7bec7;font-size:10px;line-height:1.4; }
        .rwph-payment-status.good { border-color:var(--rwph-good);color:#d8efe3; }
        .rwph-payment-status.warn { border-color:#d08a2d;color:#f2d1a5; }
        .rwph-payment-status.bad { border-color:var(--rwph-bad);color:#ffd0d0; }
        .rwph-payment-warning { border:1px solid #76501f;border-radius:9px;background:linear-gradient(180deg,#332719,#241d15);padding:12px;color:#f1d6ad; }
        .rwph-payment-warning h3 { margin:0 0 8px;color:#ffd99c;font-size:14px; }
        .rwph-payment-warning ul { margin:8px 0 10px;padding-left:20px;line-height:1.5;font-size:11px; }
        .rwph-payment-warning .rwph-btn-row { margin-top:10px; }
        .rwph-payment-tools[hidden] { display:none!important; }
        .rwph-payment-progress { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0; }
        .rwph-payment-progress > div { padding:8px;border:1px solid #373d46;border-radius:7px;background:#15181d;text-align:center; }
        .rwph-payment-progress b { display:block;color:#fff;font-size:14px; }
        .rwph-payment-progress span { display:block;margin-top:2px;color:var(--rwph-muted);font-size:9px;text-transform:uppercase;letter-spacing:.35px; }
        .rwph-payment-row.rwph-payment-complete { display:none; }
        .rwph-payment-actions .rwph-payment-complete-btn { border-color:#3d7557;background:#1d3528;color:#dff7e8; }
        .rwph-payment-restore-row { display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px; }
        .rwph-payment-actions .rwph-payment-vault-btn { border-color:#a86523;background:#4a3018;color:#ffe1b7; }
        .rwph-payment-row.rwph-payment-pending { border-color:#a86523;box-shadow:0 0 0 1px rgba(208,138,45,.18) inset; }
        .rwph-payment-row.rwph-payment-skipped { opacity:.68;border-style:dashed; }
        .rwph-payment-row.rwph-payment-current { border-left:4px solid var(--rwph-accent); }
        .rwph-payment-workflow-badge { display:inline-flex;align-items:center;margin-left:6px;padding:2px 6px;border:1px solid #505761;border-radius:999px;background:#252a31;color:#cbd1d8;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.3px; }
        .rwph-payment-workflow-badge.pending { border-color:#a86523;color:#ffd69c;background:#342617; }
        .rwph-payment-workflow-badge.paid { border-color:#3d7557;color:#dff7e8;background:#1d3528; }
        .rwph-payment-workflow-badge.skipped { border-color:#6a7078;color:#d0d4da;background:#282c31; }
        .rwph-payall-box { margin:10px 0;padding:10px;border:1px solid #3b414b;border-radius:8px;background:#16191e; }
        .rwph-payall-current { margin:7px 0;padding:8px;border-left:3px solid var(--rwph-accent);background:#1c2026;color:#d5dbe2;font-size:10px;line-height:1.45; }
        .rwph-payall-actions { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px; }
        .rwph-payall-actions .rwph-btn { padding:6px 8px;font-size:10px; }
        .rwph-payment-return-payall { margin:8px 0;padding:8px;border:1px solid #35506a;border-radius:7px;background:#17212b; }
        .rwph-payment-return-payall b { color:#fff; }
        #rwph-payment-return-panel { position:fixed;z-index:1000001;right:18px;bottom:18px;width:min(390px,calc(100vw - 24px));background:linear-gradient(180deg,#252a31,#191c21);border:1px solid #4b515b;border-left:4px solid var(--rwph-accent);border-radius:9px;box-shadow:var(--rwph-shadow);color:var(--rwph-text);font-family:Arial,sans-serif;overflow:hidden; }
        .rwph-payment-return-head { display:flex;align-items:center;gap:8px;padding:9px 10px;background:#21252b;border-bottom:1px solid #3b4149; }
        .rwph-payment-return-head b { flex:1;color:#fff;font-size:12px; }
        .rwph-payment-return-body { padding:10px;font-size:10px;line-height:1.45;color:#cbd1d8; }
        .rwph-payment-return-pending { margin-bottom:8px;padding:8px;border:1px solid #4b3a27;border-radius:7px;background:#211b15; }
        .rwph-payment-return-pending b { color:#fff; }
        .rwph-payment-return-actions { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px; }
        .rwph-payment-return-actions .rwph-btn { padding:6px 8px;font-size:10px; }
        @media (max-width:720px) { #rwph-payments-panel { right:8px;top:62px;width:calc(100vw - 16px);max-height:calc(100vh - 72px); } .rwph-payment-member { align-items:flex-start;flex-direction:column;gap:3px; } .rwph-payment-progress { grid-template-columns:repeat(2,minmax(0,1fr)); } #rwph-payment-return-panel { right:8px;bottom:8px;width:calc(100vw - 16px); } }
        .rwph-loading-shell { max-width:760px;margin:0 auto;padding:6px 0; }
        .rwph-loading-card { background:linear-gradient(180deg,#24282f,#191c21);border:1px solid #414853;border-radius:12px;padding:18px;box-shadow:0 15px 45px rgba(0,0,0,.3); }
        .rwph-loading-brand { display:flex;align-items:center;justify-content:center;gap:12px;text-align:left;margin-bottom:12px; }
        .rwph-loading-logo { display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f5b45f,#a85e12 70%);color:#111;font:900 18px/1 Arial,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 8px 24px rgba(0,0,0,.28); }
        .rwph-loading-title { font-size:20px;font-weight:900;color:#fff; }
        .rwph-loading-subtitle { margin-top:4px;color:var(--rwph-muted);font-size:12px; }
        .rwph-loading-clock { display:flex;align-items:center;justify-content:center;gap:8px;margin:14px 0 10px;font-size:14px;color:#e9edf2; }
        .rwph-loading-clock b { font-size:18px;color:#fff;min-width:62px;text-align:left; }
        .rwph-loading-dots { display:inline-flex;gap:4px;align-items:center;min-width:34px; }
        .rwph-loading-dots i { width:6px;height:6px;border-radius:50%;background:var(--rwph-accent);opacity:.25;animation:rwphDot 1.15s infinite ease-in-out; }
        .rwph-loading-dots i:nth-child(2){animation-delay:.16s}.rwph-loading-dots i:nth-child(3){animation-delay:.32s}
        @keyframes rwphDot { 0%,80%,100%{opacity:.22;transform:translateY(0)} 40%{opacity:1;transform:translateY(-3px)} }
        .rwph-loading-progress { height:9px;border-radius:999px;background:#111318;border:1px solid #343a43;overflow:hidden;margin:10px 0 14px; }
        .rwph-loading-progress > span { display:block;height:100%;width:0;background:linear-gradient(90deg,#8f5719,#d08a2d);transition:width .25s ease; }
        .rwph-loading-detail { min-height:18px;text-align:center;color:#c6ccd4;font-size:12px;margin-bottom:12px; }
        .rwph-loading-metrics { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:0 0 12px; }
        .rwph-loading-metric { background:#12151a;border:1px solid #343a43;border-radius:7px;padding:7px;text-align:center; }
        .rwph-loading-metric b { display:block;color:#fff;font-size:14px; }
        .rwph-loading-metric span { display:block;margin-top:2px;color:var(--rwph-muted);font-size:9px;text-transform:uppercase;letter-spacing:.35px; }
        .rwph-loading-steps { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;list-style:none;padding:0;margin:0; }
        .rwph-loading-step { display:flex;align-items:center;gap:8px;padding:8px 9px;border:1px solid #343a43;border-radius:7px;background:#15181d;color:#8f97a3;font-size:11px; }
        .rwph-loading-step .rwph-step-dot { width:16px;height:16px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;border:1px solid #4a515c;color:#8f97a3;font-size:9px;font-weight:900; }
        .rwph-loading-step.active { color:#fff;border-color:#9d6726;background:#2c241b; }
        .rwph-loading-step.active .rwph-step-dot { border-color:#d08a2d;color:#ffd69b;box-shadow:0 0 0 3px rgba(208,138,45,.12); }
        .rwph-loading-step.done { color:#dce9e2;border-color:#37694f;background:#18231e; }
        .rwph-loading-step.done .rwph-step-dot { border-color:#55b985;background:#244b37;color:#dff8eb; }
        .rwph-loading-step.failed { color:#ffd2d2;border-color:#854747;background:#2c1c1c; }
        .rwph-loading-step.failed .rwph-step-dot { border-color:#dc6d6d;background:#5a2929;color:#fff; }
        .rwph-loading-actions { display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:15px; }
        .rwph-loading-ready { text-align:center;margin-top:10px;color:var(--rwph-good);font-size:12px;font-weight:800; }


        /* v3.2.0 War Cache Breakdown & Filtering */
        .rwph-split-card,.rwph-filter-card { margin:12px 0;padding:12px;border:1px solid var(--rwph-line);border-radius:11px;background:linear-gradient(180deg,var(--rwph-surface-2),var(--rwph-panel)); }
        .rwph-split-kpis { display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px; }
        .rwph-filter-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:end; }
        .rwph-filter-status-row { display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 9px;padding:8px 10px;border:1px solid var(--rwph-line);border-radius:9px;background:var(--rwph-panel-deep); }
        .rwph-filter-status-row label { display:inline-flex;align-items:center;gap:5px;color:#d8dde4;font-size:10px;font-weight:800;cursor:pointer; }
        .rwph-filter-status-row input { accent-color:var(--rwph-accent); }
        #rwph-filter-count { margin-left:auto;color:var(--rwph-accent-bright);font-size:10px;font-weight:900; }
        .rwph-table tr[hidden] { display:none !important; }
        @media (max-width:900px) { .rwph-split-kpis { grid-template-columns:repeat(3,minmax(0,1fr)); }.rwph-filter-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:600px) { .rwph-split-kpis,.rwph-filter-grid { grid-template-columns:1fr 1fr; } #rwph-filter-count { width:100%;margin-left:0; } }
        @media (max-width:420px) { .rwph-split-kpis,.rwph-filter-grid { grid-template-columns:1fr; } }

        /* v3.1.0 Notifications & Payout Presets */
        #rwph-notifications { position:fixed;right:18px;bottom:18px;z-index:1000015;display:flex;flex-direction:column;gap:8px;width:min(360px,calc(100vw - 24px));pointer-events:none;font-family:Arial,Helvetica,sans-serif; }
        .rwph-toast { --rwph-toast-life:5000ms;position:relative;display:grid;grid-template-columns:28px minmax(0,1fr) 24px;gap:9px;align-items:start;overflow:hidden;padding:10px 9px 11px 10px;border:1px solid var(--rwph-line);border-left:4px solid var(--rwph-accent);border-radius:10px;background:linear-gradient(180deg,var(--rwph-surface-2),var(--rwph-panel));box-shadow:0 12px 35px rgba(0,0,0,.42);color:var(--rwph-text);pointer-events:auto;animation:rwphToastIn .18s ease-out both; }
        .rwph-toast.good { border-left-color:var(--rwph-good); }.rwph-toast.bad { border-left-color:var(--rwph-bad); }.rwph-toast.warn { border-left-color:#d6a24e; }
        .rwph-toast-icon { display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(var(--rwph-accent-rgb),.13);font-size:13px;font-weight:900;color:var(--rwph-accent-bright); }
        .rwph-toast.good .rwph-toast-icon { color:var(--rwph-good); }.rwph-toast.bad .rwph-toast-icon { color:var(--rwph-bad); }.rwph-toast.warn .rwph-toast-icon { color:#e2b562; }
        .rwph-toast-copy { min-width:0; }.rwph-toast-copy b { display:block;color:#fff;font-size:12px;line-height:1.2; }.rwph-toast-copy span { display:block;margin-top:3px;color:var(--rwph-muted);font-size:10px;line-height:1.35;overflow-wrap:anywhere; }
        .rwph-toast-close { width:22px;height:22px;padding:0;border:0;background:transparent;color:var(--rwph-muted);font-size:18px;line-height:20px;cursor:pointer; }.rwph-toast-close:hover { color:#fff; }
        .rwph-toast-life { position:absolute;left:0;bottom:0;height:2px;width:100%;background:currentColor;color:var(--rwph-accent);transform-origin:left center;animation:rwphToastLife var(--rwph-toast-life) linear both;opacity:.8; }
        .rwph-toast.good .rwph-toast-life { color:var(--rwph-good); }.rwph-toast.bad .rwph-toast-life { color:var(--rwph-bad); }.rwph-toast.warn .rwph-toast-life { color:#d6a24e; }
        .rwph-toast.leaving { animation:rwphToastOut .18s ease-in both; }
        @keyframes rwphToastIn { from { opacity:0;transform:translateX(18px) scale(.98); } to { opacity:1;transform:none; } }
        @keyframes rwphToastOut { to { opacity:0;transform:translateX(22px) scale(.98); } }
        @keyframes rwphToastLife { from { transform:scaleX(1); } to { transform:scaleX(0); } }
        .rwph-preset-card { margin:0 0 10px;padding:11px;border:1px solid var(--rwph-line);border-radius:10px;background:linear-gradient(180deg,var(--rwph-surface-2),var(--rwph-panel)); }
        .rwph-preset-head { display:flex;align-items:flex-start;gap:10px;justify-content:space-between;margin-bottom:9px; }.rwph-preset-head b { display:block;color:#fff;font-size:13px; }.rwph-preset-head span:not(.rwph-pill) { display:block;margin-top:3px;color:var(--rwph-muted);font-size:10px;line-height:1.35; }
        .rwph-preset-grid { display:grid;grid-template-columns:2fr 2fr 1fr 1fr;gap:8px;align-items:end; }
        @media (max-width:720px) { #rwph-notifications { right:8px;bottom:8px;width:calc(100vw - 16px); }.rwph-preset-grid { grid-template-columns:1fr 1fr; } }
        @media (max-width:480px) { .rwph-preset-grid { grid-template-columns:1fr; } }

        /* v3.0.0 Full UI Rebuild */
        #rwph-launcher:focus-visible { outline-color:var(--rwph-accent); }
        #rwph-launcher .rwph-mark { background:linear-gradient(145deg,var(--rwph-accent-bright),var(--rwph-accent-deep)); }
        #rwph-overlay {
            background: radial-gradient(circle at 50% 8%, rgba(var(--rwph-accent-rgb),.11), transparent 36%), rgba(4,5,7,.82);
            backdrop-filter: blur(5px);
            padding:20px;
        }
        #rwph-panel {
            width:min(1180px,96vw);
            max-height:min(900px,94vh);
            border-radius:18px;
            border-color:var(--rwph-line);
            background:linear-gradient(180deg,var(--rwph-surface),var(--rwph-panel) 110px);
            box-shadow:0 28px 90px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.025) inset;
        }
        .rwph-header {
            min-height:74px;
            padding:14px 18px;
            gap:15px;
            background:linear-gradient(135deg,var(--rwph-surface-2),var(--rwph-panel-deep));
            border-bottom:1px solid var(--rwph-line);
            position:relative;
            overflow:hidden;
        }
        .rwph-header::after { content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,var(--rwph-accent),transparent);opacity:.75; }
        .rwph-brand { gap:13px;position:relative;z-index:1; }
        .rwph-brand .rwph-mark,.rwph-panel-logo {
            display:grid;place-items:center;width:56px;height:56px;min-width:56px;flex:0 0 56px;border-radius:16px;
            background:linear-gradient(145deg,var(--rwph-accent-bright),var(--rwph-accent-deep));
            color:#0b0c0e;font:950 15px/1 Arial,sans-serif;letter-spacing:-.7px;
            border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.24);
        }
        .rwph-title { font-size:20px;letter-spacing:.15px; }
        .rwph-subtitle { font-size:11px;letter-spacing:.45px;text-transform:uppercase; }
        .rwph-close { width:38px;height:38px;border-radius:10px;background:var(--rwph-button);border-color:var(--rwph-line);transition:.15s ease; }
        .rwph-close:hover { background:var(--rwph-button-hover);transform:translateY(-1px); }
        .rwph-tabs { gap:7px;padding:10px 14px;background:var(--rwph-panel-deep);overflow-x:auto;scrollbar-width:thin; }
        .rwph-tab { border-color:var(--rwph-line);background:var(--rwph-button);padding:9px 14px;border-radius:9px;font-size:11px;letter-spacing:.2px;transition:.15s ease;white-space:nowrap; }
        .rwph-tab:hover:not(:disabled) { transform:translateY(-1px);background:var(--rwph-button-hover); }
        .rwph-tab.active { border-color:var(--rwph-accent);background:var(--rwph-highlight);box-shadow:0 0 0 1px rgba(var(--rwph-accent-rgb),.18) inset,0 5px 16px rgba(0,0,0,.18); }
        .rwph-body { padding:18px;scrollbar-color:var(--rwph-line) transparent; }
        .rwph-grid { gap:13px; }
        .rwph-card { background:linear-gradient(180deg,var(--rwph-surface),var(--rwph-panel));border-color:var(--rwph-line);border-radius:13px;padding:15px;box-shadow:0 8px 22px rgba(0,0,0,.16); }
        .rwph-card h3 { margin:0 0 11px;font-size:14px;letter-spacing:.15px;color:#f7f8fa; }
        .rwph-card p { line-height:1.55; }
        .rwph-card code { padding:2px 5px;border-radius:5px;background:rgba(0,0,0,.25);color:#f2d3a5; }
        .rwph-field label { margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:.48px;color:#cbd1d9; }
        .rwph-field input,.rwph-field select,.rwph-mm-input {
            min-height:38px;background:var(--rwph-panel-deep);border-color:var(--rwph-line);border-radius:9px;padding:9px 10px;box-shadow:inset 0 1px 3px rgba(0,0,0,.22);transition:.15s ease;
        }
        .rwph-field input:focus,.rwph-field select:focus,.rwph-mm-input:focus { border-color:var(--rwph-accent);box-shadow:0 0 0 3px rgba(var(--rwph-accent-rgb),.13); }
        .rwph-btn { min-height:36px;border-color:var(--rwph-line);background:var(--rwph-button);border-radius:9px;padding:8px 12px;transition:transform .13s ease,filter .13s ease,background .13s ease; }
        .rwph-btn:hover:not(:disabled) { transform:translateY(-1px);background:var(--rwph-button-hover);filter:none; }
        .rwph-btn.primary { background:linear-gradient(180deg,var(--rwph-accent),var(--rwph-accent-deep));border-color:var(--rwph-accent-bright);color:#fff; }
        .rwph-btn.primary:hover:not(:disabled) { filter:brightness(1.08); }
        .rwph-btn.danger { background:linear-gradient(180deg,#733838,#512525);border-color:#995050; }
        .rwph-status { border:1px solid var(--rwph-line);border-left:4px solid var(--rwph-accent);border-radius:9px;background:var(--rwph-panel-deep);padding:10px 12px;line-height:1.45; }
        .rwph-note { border-style:solid;border-color:var(--rwph-line);border-left:3px solid rgba(var(--rwph-accent-rgb),.7);border-radius:9px;background:var(--rwph-panel-deep);padding:10px 12px; }
        .rwph-kpis { gap:10px; }
        .rwph-kpi { background:var(--rwph-panel-deep);border-color:var(--rwph-line);border-radius:10px;padding:11px;box-shadow:inset 0 1px 0 rgba(255,255,255,.02); }
        .rwph-kpi b { font-size:18px; }
        .rwph-kpi span { font-size:9px;letter-spacing:.55px; }
        .rwph-mode-btn { background:var(--rwph-button);border-color:var(--rwph-line);border-radius:10px;min-height:42px;transition:.15s ease; }
        .rwph-mode-btn:hover { background:var(--rwph-button-hover); }
        .rwph-mode-btn.active { background:var(--rwph-highlight);border-color:var(--rwph-accent);box-shadow:0 0 0 1px rgba(var(--rwph-accent-rgb),.18) inset; }
        .rwph-table-wrap { border-color:var(--rwph-line);border-radius:11px;background:var(--rwph-panel-deep); }
        .rwph-table th { background:var(--rwph-bg3);border-color:var(--rwph-line);padding:9px 8px; }
        .rwph-table td { border-color:rgba(255,255,255,.055);padding:8px; }
        .rwph-table tr:nth-child(even) td { background:rgba(255,255,255,.018); }
        .rwph-table tr:hover td { background:rgba(var(--rwph-accent-rgb),.045); }
        .rwph-sort-btn:hover,.rwph-sort-btn.active,.rwph-sort-arrow { color:var(--rwph-accent-bright); }
        .rwph-pill { background:var(--rwph-button);border:1px solid var(--rwph-line); }
        .rwph-notable { background:var(--rwph-panel-deep);border-color:var(--rwph-line);border-radius:10px;padding:10px; }
        .rwph-report-heading { margin:16px 0 7px;color:var(--rwph-accent-bright); }
        .rwph-theme-card { grid-column:span 12;overflow:hidden;position:relative; }
        .rwph-theme-card::after { content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-70px;top:-90px;background:rgba(var(--rwph-accent-rgb),.11);pointer-events:none; }
        .rwph-theme-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;position:relative;z-index:1; }
        .rwph-theme-control { padding:10px;border:1px solid var(--rwph-line);border-radius:10px;background:var(--rwph-panel-deep); }
        .rwph-theme-control label { display:block;font-size:10px;text-transform:uppercase;letter-spacing:.45px;color:var(--rwph-muted);margin-bottom:7px; }
        .rwph-theme-control input[type="color"] { width:100%;height:42px;border:1px solid var(--rwph-line);border-radius:8px;background:transparent;padding:3px;cursor:pointer; }
        .rwph-theme-preview { display:flex;align-items:center;gap:9px;margin-top:11px;padding:10px 12px;border:1px solid var(--rwph-line);border-radius:10px;background:var(--rwph-highlight); }
        .rwph-theme-preview-dot { width:13px;height:13px;border-radius:50%;background:var(--rwph-accent);box-shadow:0 0 0 4px rgba(var(--rwph-accent-rgb),.13); }
        .rwph-theme-preview b { color:#fff; }
        .rwph-theme-preview span { color:var(--rwph-muted);font-size:10px; }
        #rwph-payments-panel { border-radius:16px;background:linear-gradient(180deg,var(--rwph-surface),var(--rwph-panel));border-color:var(--rwph-line);box-shadow:0 26px 80px rgba(0,0,0,.54); }
        .rwph-payments-head { padding:13px 14px;background:linear-gradient(135deg,var(--rwph-surface-2),var(--rwph-panel-deep));border-color:var(--rwph-line); }
        .rwph-payments-brand { display:flex;align-items:center;gap:11px;min-width:0; }
        .rwph-payments-brand .rwph-panel-logo { width:46px;height:46px;min-width:46px;flex-basis:46px;border-radius:13px;font-size:12px; }
        .rwph-payments-title { font-size:16px; }
        .rwph-payments-body { padding:12px; }
        .rwph-payment-warning,.rwph-payall-box,.rwph-payment-row,.rwph-payment-progress>div { background:var(--rwph-panel-deep);border-color:var(--rwph-line);border-radius:10px; }
        .rwph-payment-row { box-shadow:0 5px 14px rgba(0,0,0,.12); }
        .rwph-payment-current { border-color:var(--rwph-accent);box-shadow:0 0 0 1px rgba(var(--rwph-accent-rgb),.18),0 7px 18px rgba(0,0,0,.16); }
        #rwph-payment-return-panel { border-radius:14px;background:linear-gradient(180deg,var(--rwph-surface),var(--rwph-panel));border-color:var(--rwph-line);border-left-color:var(--rwph-accent); }
        .rwph-payment-return-head { background:var(--rwph-panel-deep);border-color:var(--rwph-line); }
        .rwph-loading-card { background:linear-gradient(180deg,var(--rwph-surface),var(--rwph-panel));border-color:var(--rwph-line);border-radius:16px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35); }
        .rwph-loading-logo { width:76px;height:76px;border-radius:20px;background:linear-gradient(145deg,var(--rwph-accent-bright),var(--rwph-accent-deep));font-size:19px;border:1px solid rgba(255,255,255,.18);box-shadow:0 14px 34px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22); }
        .rwph-loading-progress { height:10px;border-color:var(--rwph-line);background:var(--rwph-panel-deep); }
        .rwph-loading-progress>span { background:linear-gradient(90deg,var(--rwph-accent-deep),var(--rwph-accent-bright)); }
        .rwph-loading-metric,.rwph-loading-step { background:var(--rwph-panel-deep);border-color:var(--rwph-line);border-radius:9px; }
        .rwph-loading-step.active { border-color:var(--rwph-accent);background:var(--rwph-highlight); }
        .rwph-loading-step.active .rwph-step-dot { border-color:var(--rwph-accent);color:var(--rwph-accent-bright);box-shadow:0 0 0 3px rgba(var(--rwph-accent-rgb),.13); }
        @media (max-width:900px) {
            #rwph-overlay { padding:10px; }
            .rwph-body { padding:12px; }
            .rwph-theme-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:720px) {
            #rwph-overlay { align-items:stretch;padding:0; }
            #rwph-panel { width:100%;max-width:none;max-height:100vh;height:100vh;border-radius:0;border-left:0;border-right:0; }
            .rwph-header { min-height:60px;padding:9px 11px; }
            .rwph-brand .rwph-mark,.rwph-panel-logo { width:43px;height:43px;min-width:43px;flex-basis:43px;border-radius:12px;font-size:11px; }
            .rwph-title { font-size:14px; }
            .rwph-subtitle { font-size:9px; }
            .rwph-tabs { padding:7px 8px;gap:5px; }
            .rwph-tab { padding:8px 10px;font-size:10px; }
            .rwph-body { padding:9px; }
            .rwph-card { padding:11px;border-radius:11px; }
            .rwph-theme-grid { grid-template-columns:1fr; }
            .rwph-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); }
            .rwph-btn { min-height:38px; }
        }

        @media (max-width: 720px) {
            .rwph-loading-steps { grid-template-columns:1fr; }
            #rwph-panel { width:100%;max-height:96vh; }
            .rwph-card.half,.rwph-card.third { grid-column:span 12; }
            .rwph-form-grid,.rwph-weight-grid { grid-template-columns:1fr; }
            .rwph-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); }
            .rwph-notables { grid-template-columns:1fr; }
            .rwph-title { font-size:14px; }
            #rwph-launcher .rwph-label { display:none; }
            #rwph-launcher {
                width:28px;min-width:28px;max-width:28px;height:28px;min-height:28px;
                padding:1px;margin-left:4px;gap:0;
            }
            #rwph-launcher .rwph-mark { width:24px;height:24px;min-width:24px;flex-basis:24px; }
        }

        .rwph-recovery-card { border-color:rgba(var(--rwph-accent-rgb),.58);background:linear-gradient(180deg,rgba(var(--rwph-accent-rgb),.12),var(--rwph-bg2)); }
        .rwph-recovery-head,.rwph-export-head { display:flex;align-items:flex-start;justify-content:space-between;gap:10px; }
        .rwph-recovery-head b,.rwph-export-head b { color:#fff;font-size:13px; }
        .rwph-recovery-head span,.rwph-export-head span { display:block;color:var(--rwph-muted);font-size:10px;margin-top:3px;line-height:1.4; }
        .rwph-export-card { margin-top:10px;border:1px solid var(--rwph-line);border-radius:9px;background:var(--rwph-panel-deep);padding:10px; }
        .rwph-export-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px; }
        .rwph-export-columns { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:9px;padding:8px;border:1px solid #3b414b;border-radius:7px;background:#15181d; }
        .rwph-export-columns label { display:flex;align-items:center;gap:6px;color:#d7dce2;font-size:10px;min-width:0; }
        .rwph-export-columns input { width:14px;height:14px;accent-color:var(--rwph-accent);flex:0 0 auto; }
        .rwph-export-preview { max-height:160px;overflow:auto;margin-top:8px;padding:8px;border:1px solid #363c45;border-radius:7px;background:#101216;color:#cbd1d8;font:10px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word; }
        @media (max-width:720px) {
            .rwph-export-grid { grid-template-columns:1fr; }
            .rwph-export-columns { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
    `);

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatNumber(value, digits = 0) {
        const n = Number(value || 0);
        return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
    }

    function parseMoney(value) {
        const raw = String(value ?? '').trim().toLowerCase().replace(/[$,\s]/g, '');
        if (!raw) return 0;
        const match = raw.match(/^(-?\d+(?:\.\d+)?)([kmbt])?$/i);
        if (!match) return NaN;
        const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
        return Number(match[1]) * (match[2] ? multipliers[match[2].toLowerCase()] : 1);
    }

    function formatMoney(value) {
        const n = Number(value || 0);
        const sign = n < 0 ? '-' : '';
        return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
    }

    function formatTime(unix) {
        if (!unix) return '—';
        try { return new Date(Number(unix) * 1000).toLocaleString(); } catch (_) { return '—'; }
    }

    function unixToLocalInput(unix) {
        if (!unix) return '';
        const d = new Date(Number(unix) * 1000);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    }

    function localInputToUnix(value) {
        if (!value) return 0;
        const ms = new Date(value).getTime();
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
    }

    // v3.4.0 mobile/PDA + long-table hardening.
    GM_addStyle(`
        .rwph-table-wrap { max-width:100%; overflow:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; scrollbar-gutter:stable; }
        .rwph-table thead th { position:sticky; top:0; z-index:4; background:var(--rwph-surface-2); box-shadow:0 1px 0 var(--rwph-line); }
        .rwph-update-notes { margin-top:10px; border:1px solid var(--rwph-line); border-radius:10px; padding:10px 12px; background:var(--rwph-panel-deep); }
        .rwph-update-notes summary { cursor:pointer; font-weight:800; color:var(--rwph-text); }
        .rwph-release-checks { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:9px 0; }
        .rwph-release-check { padding:8px;border:1px solid var(--rwph-line);border-radius:8px;background:var(--rwph-surface);min-width:0; }
        .rwph-release-check b,.rwph-release-check span { display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .rwph-release-check b { color:#d7dce5;font-size:10px; } .rwph-release-check.good b { color:#8fd6aa; } .rwph-release-check.bad b { color:#ff8f8f; }
        .rwph-release-check span { margin-top:3px;color:var(--rwph-muted);font-size:9px; }
        @media (max-width:720px) { .rwph-release-checks { grid-template-columns:1fr 1fr; } }
        @media (max-width:420px) { .rwph-release-checks { grid-template-columns:1fr; } }
        .rwph-update-notes ul { margin:9px 0 0 18px; padding:0; color:var(--rwph-muted); }
        .rwph-update-notes li { margin:5px 0; }
        @media (max-width:720px) {
            html, body { max-width:100%; overflow-x:hidden !important; }
            #rwph-overlay { align-items:stretch; padding:0; }
            #rwph-panel { width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
            .rwph-body { overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding-bottom:calc(18px + env(safe-area-inset-bottom, 0px)); }
            .rwph-btn, .rwph-close, .rwph-tab, #rwph-payments-panel button, #rwph-payment-return button { min-height:44px; touch-action:manipulation; }
            .rwph-field input, .rwph-field select, .rwph-field textarea { min-height:44px; font-size:16px; }
            .rwph-member-check, .rwph-mm-exclude, #rwph-export-columns input, .rwph-filter-status-row input { min-width:22px; min-height:22px; }
            .rwph-table-wrap { width:100%; overflow-x:auto; overflow-y:auto; touch-action:pan-x pan-y; }
            .rwph-table { min-width:760px; }
            .rwph-table th, .rwph-table td { white-space:nowrap; }
            #rwph-payments-panel { top:max(8px, env(safe-area-inset-top, 0px)); right:8px; left:8px; width:auto; max-width:none; max-height:calc(100dvh - 16px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
            #rwph-payment-return-panel { right:8px; left:8px; bottom:max(8px, env(safe-area-inset-bottom, 0px)); width:auto; max-width:none; }
            #rwph-notifications { right:8px; left:8px; bottom:max(8px, env(safe-area-inset-bottom, 0px)); width:auto; }
        }
        @media (pointer:coarse) {
            .rwph-btn, .rwph-close, .rwph-tab { min-height:44px; }
            .rwph-sort-btn { min-height:40px; padding:7px 8px; }
        }
    `);

    function isFactionPage() {
        return location.hostname === 'www.torn.com' && location.pathname.toLowerCase().includes('factions.php');
    }

    function getApiKey() {
        return String(gm.get(KEYS.apiKey, '') || '').trim();
    }

    function apiRequest(path, query = {}) {
        const key = getApiKey();
        if (!key) return Promise.reject(new Error('No Torn API key is saved. Open Settings and save a key first.'));

        const url = new URL(APP.apiBase + path);
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
        });
        url.searchParams.set('comment', APP.apiComment);
        return requestJsonReliably(url, `request for ${path}`);
    }

    function setStatus(message, type = '') {
        state.lastStatus = message;
        const el = document.querySelector('#rwph-status');
        if (el) {
            el.textContent = message;
            el.className = `rwph-status ${type}`.trim();
        }
    }

    function setBusy(busy) {
        state.busy = !!busy;
        document.querySelectorAll('#rwph-panel button[data-action]').forEach(btn => {
            if (btn.dataset.action !== 'close') btn.disabled = state.busy;
        });
    }

    function warStatus(war) {
        const now = Math.floor(Date.now() / 1000);
        if (!war) return 'Unknown';
        if (war.end && Number(war.end) <= now) return 'Finished';
        if (war.start && Number(war.start) <= now && (!war.end || Number(war.end) > now)) return 'Active';
        if (war.start && Number(war.start) > now) return 'Upcoming';
        return 'Unknown';
    }

    function factionOpponent(war) {
        if (!war?.factions?.length || !state.faction?.id) return null;
        return war.factions.find(f => Number(f.id) !== Number(state.faction.id)) || null;
    }

    function selectedRange() {
        const startEl = document.querySelector('#rwph-start');
        const endEl = document.querySelector('#rwph-end');
        const start = localInputToUnix(startEl?.value || gm.get(KEYS.manualStart, ''));
        let end = localInputToUnix(endEl?.value || gm.get(KEYS.manualEnd, ''));
        if (!end && state.selectedWar && !state.selectedWar.end) end = Math.floor(Date.now() / 1000);
        return { start, end };
    }

    function actorFactionId(actor) {
        return Number(actor?.faction_id ?? actor?.faction?.id ?? 0) || 0;
    }

    function isHospitalResult(result) {
        return String(result || '').toLowerCase().includes('hospital');
    }

    async function loadIdentity() {
        const [userData, factionData] = await Promise.all([
            apiRequest('/user/basic'),
            apiRequest('/faction/basic'),
        ]);
        state.faction = factionData?.basic || null;
        state.identity = { user: userData?.basic || userData?.profile || userData, faction: state.faction };
        return state.identity;
    }

    async function loadWars() {
        if (state.warLoadInProgress) { showNotification('Already Loading', 'RWPH is already loading ranked wars.', 'warn'); return; }
        state.warLoadInProgress = true;
        setBusy(true);
        setStatus('Checking API key and loading faction ranked wars…');
        try {
            const { faction } = await loadIdentity();
            if (!faction?.id) throw new Error('Could not determine your faction from the Torn API.');

            const data = await apiRequest('/faction/rankedwars', { limit: 20 });
            state.wars = Array.isArray(data?.rankedwars) ? data.rankedwars : [];

            const savedId = Number(gm.get(KEYS.selectedWarId, 0));
            state.selectedWar = state.wars.find(w => Number(w.id) === savedId) || state.wars[0] || null;
            if (state.selectedWar) gm.set(KEYS.selectedWarId, Number(state.selectedWar.id));
            loadMemberManagementState();

            renderWarTab();
            setStatus(`Loaded ${state.wars.length} ranked war${state.wars.length === 1 ? '' : 's'} for ${faction.name} [${faction.id}].`, 'good');
            showNotification('War Loaded', `${state.wars.length} ranked war${state.wars.length === 1 ? '' : 's'} loaded for ${faction.name}.`, 'good');
        } catch (err) {
            setStatus(err.message || String(err), 'bad');
            showNotification('API Error', err.message || String(err), 'bad');
        } finally {
            state.warLoadInProgress = false;
            setBusy(false);
        }
    }

    async function loadWarReportIfAvailable(war) {
        if (!war?.id) return null;
        try {
            const data = await apiRequest(`/faction/${encodeURIComponent(war.id)}/rankedwarreport`);
            return data?.rankedwarreport || null;
        } catch (_) {
            return null;
        }
    }

    function canonicalPaginationUrl(urlObj) {
        const u = new URL(urlObj.toString());
        u.searchParams.delete('key');
        const pairs = Array.from(u.searchParams.entries()).sort((a, b) => {
            const ak = `${a[0]}=${a[1]}`;
            const bk = `${b[0]}=${b[1]}`;
            return ak.localeCompare(bk);
        });
        u.search = '';
        for (const [k, v] of pairs) u.searchParams.append(k, v);
        return u.toString();
    }

    function normaliseNextUrl(next, direction, start, end) {
        if (!next) return null;
        try {
            const u = new URL(next, APP.apiBase);
            if (u.origin !== 'https://api.torn.com') return null;
            if (!/\/v2\/faction\/attacks\/?$/i.test(u.pathname)) return null;

            // API v2 pagination links have changed format before. Keep the cursor
            // Torn gives us, but restore the invariant query settings from the
            // calculation that started this pagination run.
            u.searchParams.delete('key');
            u.searchParams.set('filters', direction);
            u.searchParams.set('limit', '100');
            u.searchParams.set('sort', 'ASC');
            u.searchParams.set('to', String(end));
            u.searchParams.set('comment', APP.apiComment);

            const cursorFrom = Number(u.searchParams.get('from') || 0);
            if (cursorFrom && cursorFrom < start) u.searchParams.set('from', String(start));
            return u;
        } catch (_) { return null; }
    }

    function requestAbsoluteUrl(urlObj) {
        return requestJsonReliably(urlObj, 'attack-log page');
    }

    function attackUniqueKey(attack) {
        const id = attack?.id;
        if (id !== undefined && id !== null && String(id) !== '') return `id:${String(id)}`;
        apiReliabilityStats().fallbackIdsUsed += 1;
        // Defensive fallback only: current v2 attacks normally include IDs. Keeping
        // a deterministic fingerprint means a malformed row is not silently lost.
        const started = attack?.started ?? attack?.timestamp ?? attack?.ended ?? '';
        const attacker = attack?.attacker?.id ?? attack?.attacker_id ?? '';
        const defender = attack?.defender?.id ?? attack?.defender_id ?? '';
        const result = attack?.result ?? '';
        const respect = attack?.respect_gain ?? attack?.respect ?? '';
        return `fallback:${started}|${attacker}|${defender}|${result}|${respect}|${JSON.stringify(attack?.modifiers || {})}`;
    }

    async function loadAttacks(start, end, direction = 'outgoing') {
        const all = [];
        const seenAttackKeys = new Set();
        const seenUrls = new Set();
        let noProgressPages = 0;

        let page = 0;
        let nextUrl = new URL(APP.apiBase + '/faction/attacks');
        nextUrl.searchParams.set('filters', direction);
        nextUrl.searchParams.set('limit', '100');
        nextUrl.searchParams.set('sort', 'ASC');
        nextUrl.searchParams.set('from', String(start));
        nextUrl.searchParams.set('to', String(end));
        nextUrl.searchParams.set('comment', APP.apiComment);

        while (nextUrl && page < ATTACK_PAGE_SAFETY_LIMIT) {
            const canonical = canonicalPaginationUrl(nextUrl);
            if (seenUrls.has(canonical)) {
                throw new Error(`Torn returned a repeated ${direction} attack pagination link after ${page} page(s). RWPH stopped to prevent an infinite request loop.`);
            }
            seenUrls.add(canonical);
            page += 1;

            const stats = apiReliabilityStats();
            setReportLoadingDetail(`Loading ${direction} attacks — page ${page} · ${all.length.toLocaleString()} unique · ${stats.requests.toLocaleString()} API requests · ${stats.retries.toLocaleString()} retries…`);
            const data = await requestAbsoluteUrl(nextUrl);
            const attacks = Array.isArray(data?.attacks) ? data.attacks : [];
            stats.attackPages += 1;
            if (direction === 'incoming') stats.incomingPages += 1;
            else stats.outgoingPages += 1;

            let addedThisPage = 0;
            for (const attack of attacks) {
                const uniqueKey = attackUniqueKey(attack);
                if (seenAttackKeys.has(uniqueKey)) {
                    stats.duplicatesSkipped += 1;
                    continue;
                }
                seenAttackKeys.add(uniqueKey);
                all.push(attack);
                addedThisPage += 1;
            }

            if (addedThisPage === 0) noProgressPages += 1;
            else noProgressPages = 0;
            if (noProgressPages >= ATTACK_NO_PROGRESS_LIMIT) {
                throw new Error(`Torn returned ${ATTACK_NO_PROGRESS_LIMIT} consecutive ${direction} pages with no new attack IDs. RWPH stopped to prevent repeated-data pagination.`);
            }

            if (state.reportLoading?.active) updateReportLoadingDom();

            const rawNext = data?._metadata?.links?.next || null;
            if (!rawNext) { nextUrl = null; break; }
            const candidate = normaliseNextUrl(rawNext, direction, start, end);
            if (!candidate) {
                throw new Error(`Torn returned an invalid ${direction} attack pagination link on page ${page}. RWPH stopped rather than risk a partial report.`);
            }

            const candidateFrom = Number(candidate.searchParams.get('from') || 0);
            if (candidateFrom && candidateFrom > end) { nextUrl = null; break; }
            nextUrl = candidate;
        }

        if (page >= ATTACK_PAGE_SAFETY_LIMIT && nextUrl) {
            throw new Error(`Attack-log pagination exceeded the RWPH safety limit of ${ATTACK_PAGE_SAFETY_LIMIT} pages for ${direction} attacks.`);
        }
        return all;
    }

    async function classifyAttacks(outgoingAttacks, incomingAttacks, factionId, report, opponentId) {
        const classifyStartedAt = performance.now?.() || Date.now();
        let processedSinceYield = 0;
        const maybeYield = async () => {
            processedSinceYield += 1;
            if (processedSinceYield < CLASSIFY_YIELD_EVERY) return;
            processedSinceYield = 0;
            await new Promise(resolve => setTimeout(resolve, 0));
        };
        const rows = new Map();
        const ownReportFaction = report?.factions?.find(f => Number(f.id) === Number(factionId));

        const newRow = (id, name = '') => ({
            id: Number(id),
            name: name || `Player ${id}`,
            warHits: 0,
            outsideHits: 0,
            assists: 0,
            // v1.3.0: only retals against the ranked-war opponent qualify for
            // the Advanced Retaliation Bonus. Keep `retals` as the bonus-eligible
            // count for backwards compatibility with the v1.2.0 scoring engine.
            retals: 0,
            warRetals: 0,
            outsideRetals: 0,
            totalRetals: 0,
            totalAttacks: 0,
            respect: 0,
            reportAttacks: 0,
            reportScore: 0,
            enemyHospitals: 0,
            hospitalizedByEnemy: 0,
            ffSum: 0,
            ffCount: 0,
            avgFF: 0,
        });

        if (Array.isArray(ownReportFaction?.members)) {
            for (const m of ownReportFaction.members) {
                const row = newRow(m.id, m.name);
                row.reportAttacks = Number(m.attacks || 0);
                row.reportScore = Number(m.score || 0);
                rows.set(Number(m.id), row);
            }
        }

        for (const a of outgoingAttacks || []) {
            const attacker = a?.attacker;
            if (!attacker?.id) continue;
            if (actorFactionId(attacker) !== Number(factionId)) continue;

            const id = Number(attacker.id);
            const row = rows.get(id) || newRow(id, attacker.name);
            if (attacker.name) row.name = attacker.name;

            row.totalAttacks += 1;
            row.respect += Number(a?.respect_gain || 0);

            const result = String(a?.result || '').toLowerCase();
            const isAssist = result.includes('assist') || a?.is_interrupted === true;
            const defenderFactionId = actorFactionId(a?.defender);
            const isWarOpponent = Number(opponentId) > 0 && defenderFactionId === Number(opponentId);
            const hasWarSignal = a?.is_ranked_war !== undefined || a?.modifiers?.war !== undefined;
            const tornWarSignal = a?.is_ranked_war === true || Number(a?.modifiers?.war || 1) > 1;
            const isRetal = Number(a?.modifiers?.retaliation || 1) > 1 || result.includes('retaliat');
            const successful = Number(a?.respect_gain || 0) > 0 && !isAssist;

            // Exactly one primary hit bucket per successful non-assist attack.
            // Retals against the selected war opponent are always treated as war hits,
            // even if one Torn war signal is missing/inconsistent. Non-war retals are
            // outside hits and do not earn the separate retaliation bonus.
            const isWarPrimaryHit = successful && (
                (isRetal && isWarOpponent)
                || (!isRetal && (tornWarSignal || (!hasWarSignal && isWarOpponent)))
            );

            if (isAssist) row.assists += 1;
            if (successful) {
                if (isWarPrimaryHit) row.warHits += 1;
                else row.outsideHits += 1;

                if (isRetal) {
                    row.totalRetals += 1;
                    if (isWarOpponent) {
                        row.warRetals += 1;
                        row.retals += 1;
                    } else {
                        row.outsideRetals += 1;
                    }
                }
            }

            if (successful && isHospitalResult(a?.result) && Number(opponentId) > 0 && defenderFactionId === Number(opponentId)) {
                row.enemyHospitals += 1;
            }

            if (successful) {
                const ff = Number(a?.modifiers?.fair_fight);
                if (Number.isFinite(ff) && ff > 0) {
                    row.ffSum += ff;
                    row.ffCount += 1;
                }
            }

            rows.set(id, row);
            await maybeYield();
        }

        for (const a of incomingAttacks || []) {
            const defender = a?.defender;
            if (!defender?.id || actorFactionId(defender) !== Number(factionId)) continue;
            const attackerFactionId = actorFactionId(a?.attacker);
            if (Number(opponentId) > 0 && attackerFactionId !== Number(opponentId)) continue;
            if (!isHospitalResult(a?.result)) continue;

            const id = Number(defender.id);
            const row = rows.get(id) || newRow(id, defender.name);
            if (defender.name) row.name = defender.name;
            row.hospitalizedByEnemy += 1;
            rows.set(id, row);
            await maybeYield();
        }

        for (const row of rows.values()) {
            row.avgFF = row.ffCount > 0 ? row.ffSum / row.ffCount : 0;
        }

        const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
        const resultRows = [...rows.values()].sort((a, b) => b.warHits - a.warHits || b.respect - a.respect || collator.compare(a.name, b.name));
        state.performance.lastClassifyMs = Math.max(0, Math.round((performance.now?.() || Date.now()) - classifyStartedAt));
        return resultRows;
    }

    function initialiseIncludedMembers() {
        state.includedMembers = new Set(
            state.reportRows
                .filter(r => !isMemberExcluded(r) && adjustedWarHits(r) > 0)
                .map(r => Number(r.id))
        );
        state.advancedIncludedMembers = new Set(
            state.reportRows
                .filter(r => !isMemberExcluded(r) && (adjustedWarHits(r) + Number(r.outsideHits || 0) + Number(r.assists || 0) + Number(r.retals || 0) + Number(r.enemyHospitals || 0) + Number(r.hospitalizedByEnemy || 0)) > 0)
                .map(r => Number(r.id))
        );
    }

    function basicConfigFromDom() {
        if (isCachedViewActive('basic')) return cloneJson(state.activeCachedReport.config, { payRaw: '', poolRaw: '', payPerHit: 0, payoutPool: null });
        const payRaw = document.querySelector('#rwph-pay-per-hit')?.value ?? gm.get(KEYS.basicPayPerHit, '');
        const poolRaw = document.querySelector('#rwph-payout-pool')?.value ?? gm.get(KEYS.basicPayoutPool, '');
        return {
            payRaw: String(payRaw || ''),
            poolRaw: String(poolRaw || ''),
            payPerHit: parseMoney(payRaw),
            payoutPool: String(poolRaw || '').trim() ? parseMoney(poolRaw) : null,
        };
    }

    function basicSummary(config = basicConfigFromDom()) {
        const validRate = Number.isFinite(config.payPerHit) && config.payPerHit >= 0;
        const payPerHit = validRate ? config.payPerHit : 0;
        let payableHits = 0;
        let includedMembers = 0;

        for (const row of state.reportRows) {
            if (isMemberExcluded(row) || !state.includedMembers.has(Number(row.id))) continue;
            includedMembers += 1;
            payableHits += adjustedWarHits(row);
        }

        const totalPayout = payableHits * payPerHit;
        const hasPool = config.payoutPool !== null && Number.isFinite(config.payoutPool) && config.payoutPool >= 0;
        const splitBreakdown = payoutPoolBreakdown(hasPool ? config.payoutPool : 0, 'basic');
        const memberPayoutPool = hasPool ? splitBreakdown.memberPool : null;
        const factionShare = hasPool ? splitBreakdown.factionShare : null;
        const remaining = hasPool ? memberPayoutPool - totalPayout : null;
        return {
            validRate, payPerHit, payableHits, includedMembers, totalPayout, hasPool,
            payoutPool: hasPool ? config.payoutPool : null, memberPayoutPool, factionShare,
            poolSplit: splitBreakdown.split, remaining,
        };
    }

    function saveBasicInputs() {
        if (state.activeCachedReport) return;
        const pay = document.querySelector('#rwph-pay-per-hit')?.value ?? '';
        const pool = document.querySelector('#rwph-payout-pool')?.value ?? '';
        gm.set(KEYS.basicPayPerHit, String(pay));
        gm.set(KEYS.basicPayoutPool, String(pool));
    }

    function refreshBasicPayoutPreview() {
        if (document.querySelector('#rwph-payments-panel')) closePaymentsPanel();
        saveBasicInputs();
        const config = basicConfigFromDom();
        const summary = basicSummary(config);

        document.querySelectorAll('[data-rwph-row-id]').forEach(tr => {
            const id = Number(tr.dataset.rwphRowId);
            const row = state.reportRows.find(r => Number(r.id) === id);
            if (!row) return;
            const included = !isMemberExcluded(row) && state.includedMembers.has(id);
            const payableHits = included ? adjustedWarHits(row) : 0;
            const payout = payableHits * summary.payPerHit;
            const pct = summary.totalPayout > 0 ? (payout / summary.totalPayout) * 100 : 0;
            const cachePct = summary.hasPool && summary.payoutPool > 0 ? (payout / summary.payoutPool) * 100 : 0;
            const hitsEl = tr.querySelector('[data-col="payable-hits"]');
            const payoutEl = tr.querySelector('[data-col="payout"]');
            const pctEl = tr.querySelector('[data-col="percentage"]');
            const cachePctEl = tr.querySelector('[data-col="cache-percentage"]');
            const pointsEl = tr.querySelector('[data-col="contribution-points"]');
            if (hitsEl) hitsEl.textContent = formatNumber(payableHits);
            if (pointsEl) pointsEl.textContent = formatNumber(payableHits, 2);
            if (payoutEl) payoutEl.textContent = formatMoney(payout);
            if (pctEl) pctEl.textContent = `${formatNumber(pct, 2)}%`;
            if (cachePctEl) cachePctEl.textContent = `${formatNumber(cachePct, 2)}%`;
        });

        const values = {
            'rwph-kpi-payable': formatNumber(summary.payableHits),
            'rwph-kpi-included': formatNumber(summary.includedMembers),
            'rwph-kpi-rate': formatMoney(summary.payPerHit),
            'rwph-kpi-payout': formatMoney(summary.totalPayout),
            'rwph-kpi-pool': summary.hasPool ? formatMoney(summary.payoutPool) : '—',
            'rwph-kpi-member-pool': summary.hasPool ? formatMoney(summary.memberPayoutPool) : '—',
            'rwph-kpi-faction-share': summary.hasPool ? formatMoney(summary.factionShare) : '—',
            'rwph-kpi-remaining': summary.remaining === null ? '—' : formatMoney(summary.remaining),
        };
        Object.entries(values).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        });
        const rem = document.getElementById('rwph-kpi-remaining');
        if (rem) {
            rem.classList.toggle('rwph-negative', summary.remaining !== null && summary.remaining < 0);
            rem.classList.toggle('rwph-positive', summary.remaining !== null && summary.remaining >= 0);
        }

        refreshWarReportSummary();
        refreshCacheSplitBreakdown();
        applyReportFiltersToDom();

        const warning = document.getElementById('rwph-basic-warning');
        if (warning) {
            if (!summary.validRate) {
                warning.textContent = 'Enter a valid Pay Per Hit amount, for example 1000000 or 1m.';
                warning.className = 'rwph-status bad';
            } else if (summary.remaining !== null && summary.remaining < 0) {
                warning.textContent = `Payout exceeds the ${formatNumber(summary.poolSplit?.members ?? 100, 2)}% member pool by ${formatMoney(Math.abs(summary.remaining))}. Faction/Vault reserve remains ${formatMoney(summary.factionShare || 0)}.`;
                warning.className = 'rwph-status bad';
            } else {
                warning.textContent = `${summary.payableHits.toLocaleString()} payable war hits × ${formatMoney(summary.payPerHit)} = ${formatMoney(summary.totalPayout)}.`;
                warning.className = 'rwph-status good';
            }
        }
    }

    function currentPayoutMode() {
        return state.payoutMode === 'advanced' ? 'advanced' : 'basic';
    }

    function numberInputValue(id, key, fallback) {
        const raw = document.querySelector(`#${id}`)?.value ?? gm.get(key, fallback);
        const n = Number(raw);
        return Number.isFinite(n) ? n : Number(fallback);
    }

    function checkboxInputValue(id, key, fallback = true) {
        const el = document.querySelector(`#${id}`);
        if (el) return !!el.checked;
        const raw = gm.get(key, fallback ? 'true' : 'false');
        return raw === true || String(raw).toLowerCase() === 'true' || String(raw) === '1';
    }

    function advancedConfigFromDom() {
        if (isCachedViewActive('advanced')) return cloneJson(state.activeCachedReport.config, {});
        const poolRaw = document.querySelector('#rwph-advanced-pool')?.value ?? gm.get(KEYS.advancedPayoutPool, '100m');
        return {
            poolRaw: String(poolRaw || ''),
            payoutPool: parseMoney(poolRaw),
            warHitWeight: numberInputValue('rwph-adv-war', KEYS.advancedWarHitWeight, 1),
            outsideHitWeight: numberInputValue('rwph-adv-outside', KEYS.advancedOutsideHitWeight, 1),
            retalWeight: numberInputValue('rwph-adv-retal', KEYS.advancedRetalWeight, 1),
            assistWeight: numberInputValue('rwph-adv-assist', KEYS.advancedAssistWeight, 0),
            ownHospitalWeight: numberInputValue('rwph-adv-own-hosp', KEYS.advancedOwnHospitalWeight, 0),
            enemyHospitalWeight: numberInputValue('rwph-adv-enemy-hosp', KEYS.advancedEnemyHospitalWeight, -1),
            fairFightEnabled: checkboxInputValue('rwph-adv-ff-enabled', KEYS.advancedFairFightEnabled, true),
            fairFightStart: numberInputValue('rwph-adv-ff-start', KEYS.advancedFairFightStart, 1),
            fairFightStep: numberInputValue('rwph-adv-ff-step', KEYS.advancedFairFightStep, 0.02),
            fairFightBonus: numberInputValue('rwph-adv-ff', KEYS.advancedFairFightBonus, 0.01),
            fairFightCap: numberInputValue('rwph-adv-ff-cap', KEYS.advancedFairFightCap, 3),
        };
    }

    function saveAdvancedInputs() {
        if (state.activeCachedReport) return;
        const mappings = [
            ['rwph-advanced-pool', KEYS.advancedPayoutPool],
            ['rwph-adv-war', KEYS.advancedWarHitWeight],
            ['rwph-adv-outside', KEYS.advancedOutsideHitWeight],
            ['rwph-adv-retal', KEYS.advancedRetalWeight],
            ['rwph-adv-assist', KEYS.advancedAssistWeight],
            ['rwph-adv-own-hosp', KEYS.advancedOwnHospitalWeight],
            ['rwph-adv-enemy-hosp', KEYS.advancedEnemyHospitalWeight],
            ['rwph-adv-ff-enabled', KEYS.advancedFairFightEnabled],
            ['rwph-adv-ff-start', KEYS.advancedFairFightStart],
            ['rwph-adv-ff-step', KEYS.advancedFairFightStep],
            ['rwph-adv-ff', KEYS.advancedFairFightBonus],
            ['rwph-adv-ff-cap', KEYS.advancedFairFightCap],
        ];
        for (const [id, key] of mappings) {
            const el = document.getElementById(id);
            if (!el) continue;
            gm.set(key, el.type === 'checkbox' ? String(!!el.checked) : String(el.value ?? ''));
        }
    }

    function advancedRowScore(row, config, included = true) {
        const avgFF = Number(row.avgFF || 0);
        const ffStart = Number(config.fairFightStart);
        const ffStep = Number(config.fairFightStep);
        const ffCap = Number(config.fairFightCap);
        const effectiveStart = Number.isFinite(ffStart) ? Math.min(3, Math.max(0.01, ffStart)) : 1;
        const effectiveStep = Number.isFinite(ffStep) && ffStep > 0 ? ffStep : 0.02;
        const effectiveCap = Number.isFinite(ffCap) ? Math.min(3, Math.max(effectiveStart, ffCap)) : 3;
        const cappedFF = avgFF > 0 ? Math.min(effectiveCap, Math.max(effectiveStart, avgFF)) : effectiveStart;
        const ffSteps = config.fairFightEnabled && avgFF > effectiveStart
            ? Math.floor(((cappedFF - effectiveStart) + 1e-9) / effectiveStep)
            : 0;

        // Fair Fight applies per payable primary hit. If a hit category has a zero
        // base weight, that category is not considered payable for FF bonus purposes.
        const effectiveWarHits = adjustedWarHits(row);
        const payableWarHits = config.warHitWeight > 0 ? effectiveWarHits : 0;
        const payableOutsideHits = config.outsideHitWeight > 0 ? Number(row.outsideHits || 0) : 0;
        const payableHits = payableWarHits + payableOutsideHits;
        const ffPoints = config.fairFightEnabled
            ? payableHits * ffSteps * Number(config.fairFightBonus || 0)
            : 0;

        const components = {
            war: effectiveWarHits * config.warHitWeight,
            outside: Number(row.outsideHits || 0) * config.outsideHitWeight,
            assists: Number(row.assists || 0) * config.assistWeight,
            retals: Number(row.retals || 0) * config.retalWeight,
            ownHosp: Number(row.enemyHospitals || 0) * config.ownHospitalWeight,
            enemyHosp: Number(row.hospitalizedByEnemy || 0) * config.enemyHospitalWeight,
            fairFight: ffPoints,
        };
        const rawPoints = Object.values(components).reduce((sum, value) => sum + Number(value || 0), 0);
        const finalPoints = included ? Math.max(0, rawPoints) : 0;
        return {
            avgFF,
            cappedFF,
            ffSteps,
            payableHits,
            payableWarHits,
            payableOutsideHits,
            ffPoints,
            components,
            rawPoints,
            finalPoints,
        };
    }

    function advancedSummaryLocal(config = advancedConfigFromDom()) {
        const rows = state.reportRows.map(row => {
            const included = !isMemberExcluded(row) && state.advancedIncludedMembers.has(Number(row.id));
            return { row, included, score: advancedRowScore(row, config, included) };
        });
        const totalPoints = rows.reduce((sum, item) => sum + item.score.finalPoints, 0);
        const validPool = Number.isFinite(config.payoutPool) && config.payoutPool > 0;
        const payoutPool = validPool ? config.payoutPool : 0;
        const splitBreakdown = payoutPoolBreakdown(payoutPool, 'advanced');
        const pointValue = totalPoints > 0 ? splitBreakdown.memberPool / totalPoints : 0;
        const includedMembers = rows.filter(item => item.included).length;
        const totalFairFightPoints = rows.reduce((sum, item) => sum + (item.included ? item.score.ffPoints : 0), 0);
        return { rows, totalPoints, validPool, payoutPool, pointValue, includedMembers, totalFairFightPoints, memberPayoutPool: splitBreakdown.memberPool, factionShare: splitBreakdown.factionShare, poolSplit: splitBreakdown.split };
    }

    function protectedAdvancedFingerprint(config) {
        const rows = state.reportRows.map(row => ({
            id: Number(row.id || 0),
            included: !isMemberExcluded(row) && state.advancedIncludedMembers.has(Number(row.id)),
            warHits: adjustedWarHits(row),
            outsideHits: Number(row.outsideHits || 0),
            assists: Number(row.assists || 0),
            retals: Number(row.retals || 0),
            ownHosp: Number(row.enemyHospitals || 0),
            enemyHosp: Number(row.hospitalizedByEnemy || 0),
            avgFF: Number(row.avgFF || 0),
        }));
        const cfg = {
            payoutPool: Number(config.payoutPool || 0), warHitWeight: Number(config.warHitWeight || 0),
            outsideHitWeight: Number(config.outsideHitWeight || 0), retalWeight: Number(config.retalWeight || 0),
            assistWeight: Number(config.assistWeight || 0), ownHospitalWeight: Number(config.ownHospitalWeight || 0),
            enemyHospitalWeight: Number(config.enemyHospitalWeight || 0), fairFightEnabled: !!config.fairFightEnabled,
            fairFightStart: Number(config.fairFightStart || 0), fairFightStep: Number(config.fairFightStep || 0),
            fairFightBonus: Number(config.fairFightBonus || 0), fairFightCap: Number(config.fairFightCap || 0),
        };
        return JSON.stringify({ rows, cfg });
    }

    function advancedSummary(config = advancedConfigFromDom()) {
        const protectedCalc = state.protectedCalculation;
        const fingerprint = protectedAdvancedFingerprint(config);
        if (protectedCalc?.mode === 'advanced' && protectedCalc.fingerprint === fingerprint && Array.isArray(protectedCalc.rows)) {
            const serverRows = new Map(protectedCalc.rows.map(item => [Number(item.id), item]));
            const rows = state.reportRows.map(row => {
                const included = !isMemberExcluded(row) && state.advancedIncludedMembers.has(Number(row.id));
                const server = serverRows.get(Number(row.id));
                return { row, included, score: server?.score || advancedRowScore(row, config, included) };
            });
            const validPool = Number.isFinite(config.payoutPool) && config.payoutPool > 0;
            const payoutPool = validPool ? Number(config.payoutPool) : 0;
            const splitBreakdown = payoutPoolBreakdown(payoutPool, 'advanced');
            const totalPoints = Number(protectedCalc.summary?.totalPoints || 0);
            return {
                rows,
                totalPoints,
                validPool,
                payoutPool,
                pointValue: totalPoints > 0 ? splitBreakdown.memberPool / totalPoints : 0,
                includedMembers: Number(protectedCalc.summary?.includedMembers || 0),
                totalFairFightPoints: Number(protectedCalc.summary?.totalFairFightPoints || 0),
                memberPayoutPool: splitBreakdown.memberPool,
                factionShare: splitBreakdown.factionShare,
                poolSplit: splitBreakdown.split,
                serverValidated: true,
            };
        }
        return advancedSummaryLocal(config);
    }

    async function calculateAdvancedOnServer(config) {
        if (!licenceIsActive()) throw new Error('RWPH licence is not active for protected Advanced calculation.');
        const rows = state.reportRows.map(row => ({
            id: Number(row.id || 0),
            name: String(row.name || ''),
            included: !isMemberExcluded(row) && state.advancedIncludedMembers.has(Number(row.id)),
            warHits: adjustedWarHits(row),
            outsideHits: Number(row.outsideHits || 0),
            assists: Number(row.assists || 0),
            retals: Number(row.retals || 0),
            ownHosp: Number(row.enemyHospitals || 0),
            enemyHosp: Number(row.hospitalizedByEnemy || 0),
            avgFF: Number(row.avgFF || 0),
        }));
        const fingerprint = protectedAdvancedFingerprint(config);
        const result = await backendRequest('/calculate', {
            token: state.licence.token,
            body: { mode: 'advanced', appVersion: APP.version, rows, config },
            timeout: 20000, signed: true, retries: 2,
        });
        if (!result?.calculation || !Array.isArray(result.calculation.rows)) throw new Error('RWPH cloud backend returned an invalid Advanced calculation response.');
        state.protectedCalculation = {
            mode: 'advanced',
            verifiedAt: Date.now(),
            fingerprint,
            rows: cloneJson(result.calculation.rows, []),
            summary: cloneJson(result.calculation.summary, {}),
            calculationId: String(result.calculationId || ''),
        };
        return state.protectedCalculation;
    }

    function refreshAdvancedPayoutPreview() {
        if (document.querySelector('#rwph-payments-panel')) closePaymentsPanel();
        saveAdvancedInputs();
        const config = advancedConfigFromDom();
        const summary = advancedSummary(config);

        document.querySelectorAll('[data-rwph-adv-row-id]').forEach(tr => {
            const id = Number(tr.dataset.rwphAdvRowId);
            const row = state.reportRows.find(r => Number(r.id) === id);
            if (!row) return;
            const included = !isMemberExcluded(row) && state.advancedIncludedMembers.has(id);
            const summaryItem = summary.rows.find(item => Number(item.row?.id || 0) === id);
            const score = summaryItem?.score || advancedRowScore(row, config, included);
            const payout = score.finalPoints * summary.pointValue;
            const pct = summary.memberPayoutPool > 0 ? (payout / summary.memberPayoutPool) * 100 : 0;
            const { bonusPoints, penalties } = advancedBonusPenalty(score);
            const values = {
                'ff-hits': formatNumber(score.payableHits),
                'ff-steps': formatNumber(score.ffSteps),
                'ff-points': formatNumber(score.ffPoints, 2),
                'bonus-points': formatNumber(bonusPoints, 2),
                'penalties': formatNumber(penalties, 2),
                'raw-points': formatNumber(score.rawPoints, 2),
                'final-points': formatNumber(score.finalPoints, 2),
                'payable-hits': formatNumber(included ? score.payableHits : 0),
                'payout': formatMoney(payout),
                'percentage': `${formatNumber(pct, 2)}%`,
                'cache-percentage': `${formatNumber(summary.payoutPool > 0 ? (payout / summary.payoutPool) * 100 : 0, 2)}%`,
            };
            for (const [col, text] of Object.entries(values)) {
                const el = tr.querySelector(`[data-col="${col}"]`);
                if (el) el.textContent = text;
            }
        });

        const kpis = {
            'rwph-adv-kpi-points': formatNumber(summary.totalPoints, 2),
            'rwph-adv-kpi-point-value': formatMoney(summary.pointValue),
            'rwph-adv-kpi-pool': summary.validPool ? formatMoney(summary.payoutPool) : 'Invalid',
            'rwph-adv-kpi-member-pool': summary.validPool ? formatMoney(summary.memberPayoutPool) : '—',
            'rwph-adv-kpi-faction-share': summary.validPool ? formatMoney(summary.factionShare) : '—',
            'rwph-adv-kpi-members': formatNumber(summary.includedMembers),
            'rwph-adv-kpi-ff-points': formatNumber(summary.totalFairFightPoints, 2),
        };
        for (const [id, text] of Object.entries(kpis)) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }

        refreshWarReportSummary();
        refreshCacheSplitBreakdown();
        applyReportFiltersToDom();

        const warning = document.getElementById('rwph-advanced-warning');
        if (warning) {
            const normalWeightsValid = [config.warHitWeight, config.outsideHitWeight, config.retalWeight, config.assistWeight, config.fairFightBonus]
                .every(v => Number.isFinite(v) && v >= 0);
            const ffConfigValid = Number.isFinite(config.fairFightStart)
                && config.fairFightStart > 0
                && config.fairFightStart <= 3
                && Number.isFinite(config.fairFightStep)
                && config.fairFightStep > 0
                && Number.isFinite(config.fairFightCap)
                && config.fairFightCap >= config.fairFightStart
                && config.fairFightCap <= 3;
            if (!summary.validPool) {
                warning.textContent = 'Enter a valid Advanced Payout Pool, for example 100m or 100000000.';
                warning.className = 'rwph-status bad';
            } else if (!normalWeightsValid) {
                warning.textContent = 'War, outside, retal, assist and Fair Fight point values must be zero or higher.';
                warning.className = 'rwph-status bad';
            } else if (config.fairFightEnabled && !ffConfigValid) {
                warning.textContent = 'Fair Fight settings are invalid. Start must be above 0, Step above 0, and Cap must be between Start and 3.00.';
                warning.className = 'rwph-status bad';
            } else if (summary.totalPoints <= 0) {
                warning.textContent = 'No positive Advanced contribution points are currently payable. Check member selections and weights.';
                warning.className = 'rwph-status bad';
            } else {
                const ffText = config.fairFightEnabled
                    ? ` FF: start ${formatNumber(config.fairFightStart, 2)}, +${formatNumber(config.fairFightStep, 2)} per step, +${formatNumber(config.fairFightBonus, 2)} pts per payable hit/step, cap ${formatNumber(config.fairFightCap, 2)}.`
                    : ' Fair Fight bonus is disabled.';
                const serverText = summary.serverValidated ? ' Server-validated calculation.' : ' Local preview only — press Calculate to validate this configuration on the RWPH server.';
                warning.textContent = `${formatNumber(summary.totalPoints, 2)} total contribution points split the ${formatMoney(summary.memberPayoutPool)} member pool (${formatNumber(summary.poolSplit?.members ?? 100, 2)}% of ${formatMoney(summary.payoutPool)}) at ${formatMoney(summary.pointValue)} per point. Faction/Vault reserve: ${formatMoney(summary.factionShare)}.${ffText}${serverText}`;
                warning.className = summary.serverValidated ? 'rwph-status good' : 'rwph-status warn';
            }
        }
    }

    function formatLoadingElapsed(ms) {
        const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;
        if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
        return `${seconds}s`;
    }

    function stopReportLoadingTimer() {
        if (state.reportLoadingTimer) clearInterval(state.reportLoadingTimer);
        state.reportLoadingTimer = null;
    }

    function updateReportLoadingDom() {
        const loading = state.reportLoading;
        if (!loading) return;
        const body = document.querySelector('#rwph-body');
        const elapsed = body?.querySelector('#rwph-loading-elapsed');
        if (elapsed) elapsed.textContent = formatLoadingElapsed(Date.now() - Number(loading.startedAt || Date.now()));
        const detail = body?.querySelector('#rwph-loading-detail');
        if (detail) detail.textContent = loading.detail || (loading.complete ? 'Results are ready.' : 'Preparing report…');
        const reliability = apiReliabilityStats();
        const metricValues = {
            'rwph-loading-requests': reliability.requests,
            'rwph-loading-pages': reliability.attackPages,
            'rwph-loading-retries': reliability.retries,
            'rwph-loading-duplicates': reliability.duplicatesSkipped,
        };
        for (const [id, value] of Object.entries(metricValues)) {
            const el = body?.querySelector(`#${id}`);
            if (el) el.textContent = Number(value || 0).toLocaleString();
        }
        const progress = body?.querySelector('#rwph-loading-progress-fill');
        if (progress) {
            const doneCount = loading.complete ? REPORT_LOADING_STEPS.length : Math.max(0, Number(loading.step || 0));
            progress.style.width = `${Math.max(2, Math.min(100, (doneCount / REPORT_LOADING_STEPS.length) * 100))}%`;
        }
        body?.querySelectorAll('[data-rwph-loading-step]').forEach((el) => {
            const index = Number(el.dataset.rwphLoadingStep || 0);
            el.classList.remove('active', 'done', 'failed');
            const dot = el.querySelector('.rwph-step-dot');
            if (loading.failed && index === Number(loading.step || 0)) {
                el.classList.add('failed');
                if (dot) dot.textContent = '!';
            } else if (loading.complete || index < Number(loading.step || 0)) {
                el.classList.add('done');
                if (dot) dot.textContent = '✓';
            } else if (index === Number(loading.step || 0)) {
                el.classList.add('active');
                if (dot) dot.textContent = '●';
            } else if (dot) {
                dot.textContent = String(index + 1);
            }
        });
        const open = body?.querySelector('[data-action="open-loading-results"]');
        if (open) open.disabled = !loading.complete;
        const ready = body?.querySelector('#rwph-loading-ready');
        if (ready) {
            ready.textContent = loading.failed
                ? `Report failed: ${loading.error || 'Unknown error'}`
                : (loading.complete ? 'Calculation complete — Open Results is now unlocked.' : 'RWPH is still processing the selected war.');
            ready.style.color = loading.failed ? 'var(--rwph-bad)' : (loading.complete ? 'var(--rwph-good)' : 'var(--rwph-muted)');
        }
    }

    function setReportLoadingStep(step, detail = '') {
        if (!state.reportLoading) return;
        state.reportLoading.step = Math.max(0, Math.min(REPORT_LOADING_STEPS.length - 1, Number(step || 0)));
        state.reportLoading.detail = String(detail || REPORT_LOADING_STEPS[state.reportLoading.step] || 'Working…');
        updateReportLoadingDom();
    }

    function setReportLoadingDetail(detail) {
        if (!state.reportLoading || state.reportLoading.complete || state.reportLoading.failed) return;
        state.reportLoading.detail = String(detail || 'Working…');
        updateReportLoadingDom();
    }

    function renderReportLoadingPanel() {
        if (!state.open || state.tab !== 'war' || !state.reportLoading?.active) return;
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        const loading = state.reportLoading;
        body.innerHTML = `
            <div class="rwph-loading-shell">
                <section class="rwph-loading-card">
                    <div class="rwph-loading-brand">
                        <div class="rwph-loading-logo">RW</div>
                        <div>
                            <div class="rwph-loading-title">RWPH Results Loading</div>
                            <div class="rwph-loading-subtitle">${escapeHtml(reportCacheLabel(loading.mode))} mode · War #${escapeHtml(loading.warId || '—')}</div>
                        </div>
                    </div>
                    <div class="rwph-loading-clock">
                        <span class="rwph-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span>Loading for</span><b id="rwph-loading-elapsed">0s</b>
                    </div>
                    <div class="rwph-loading-progress"><span id="rwph-loading-progress-fill"></span></div>
                    <div class="rwph-loading-detail" id="rwph-loading-detail"></div>
                    <div class="rwph-loading-metrics">
                        <div class="rwph-loading-metric"><b id="rwph-loading-requests">0</b><span>API Requests</span></div>
                        <div class="rwph-loading-metric"><b id="rwph-loading-pages">0</b><span>Attack Pages</span></div>
                        <div class="rwph-loading-metric"><b id="rwph-loading-retries">0</b><span>Retries</span></div>
                        <div class="rwph-loading-metric"><b id="rwph-loading-duplicates">0</b><span>Duplicates Skipped</span></div>
                    </div>
                    <ol class="rwph-loading-steps">
                        ${REPORT_LOADING_STEPS.map((label, index) => `<li class="rwph-loading-step" data-rwph-loading-step="${index}"><span class="rwph-step-dot">${index + 1}</span><span>${escapeHtml(label)}</span></li>`).join('')}
                    </ol>
                    <div class="rwph-loading-ready" id="rwph-loading-ready"></div>
                    <div class="rwph-loading-actions">
                        <button class="rwph-btn primary" data-action="open-loading-results" ${loading.complete ? '' : 'disabled'}>Open Results</button>
                        ${loading.failed ? '<button class="rwph-btn" data-action="return-from-loading-error">Return to Ranked War</button>' : ''}
                    </div>
                </section>
            </div>`;
        document.querySelectorAll('#rwph-panel .rwph-tab').forEach(btn => { btn.disabled = !loading.complete && !loading.failed; });
        wireBodyActions();
        updateReportLoadingDom();
        if (!state.reportLoadingTimer) {
            state.reportLoadingTimer = setInterval(updateReportLoadingDom, 500);
        }
    }

    function beginReportLoading(mode, war, config, range) {
        stopReportLoadingTimer();
        resetApiReliabilityStats();
        state.reportLoading = {
            active: true,
            complete: false,
            failed: false,
            error: '',
            startedAt: Date.now(),
            step: 0,
            detail: 'Verifying Torn API access…',
            mode,
            warId: Number(war?.id || 0),
            config: cloneJson(config, {}),
            range: cloneJson(range, {}),
        };
        renderReportLoadingPanel();
    }

    function completeReportLoading(message = 'Results are ready.') {
        if (!state.reportLoading) return;
        state.reportLoading.complete = true;
        state.reportLoading.failed = false;
        state.reportLoading.step = REPORT_LOADING_STEPS.length;
        state.reportLoading.detail = message;
        stopReportLoadingTimer();
        updateReportLoadingDom();
        document.querySelectorAll('#rwph-panel .rwph-tab').forEach(btn => { btn.disabled = false; });
    }

    function failReportLoading(error) {
        if (!state.reportLoading) return;
        state.reportLoading.complete = false;
        state.reportLoading.failed = true;
        state.reportLoading.error = String(error?.message || error || 'Unknown error');
        state.reportLoading.detail = state.reportLoading.error;
        stopReportLoadingTimer();
        renderReportLoadingPanel();
        document.querySelectorAll('#rwph-panel .rwph-tab').forEach(btn => { btn.disabled = false; });
    }

    function openFinishedLoadingResults() {
        if (!state.reportLoading?.complete) return;
        const elapsed = formatLoadingElapsed(Date.now() - Number(state.reportLoading.startedAt || Date.now()));
        state.reportLoading = null;
        stopReportLoadingTimer();
        const apiStats = apiReliabilityStats();
        state.lastStatus = `Report completed in ${elapsed}. Results opened. ${apiStats.requests.toLocaleString()} API requests, ${apiStats.attackPages.toLocaleString()} attack pages, ${apiStats.retries.toLocaleString()} retries, ${apiStats.duplicatesSkipped.toLocaleString()} duplicates skipped.`;
        renderWarTab();
        setStatus(state.lastStatus, 'good');
    }

    function returnFromLoadingError() {
        state.reportLoading = null;
        stopReportLoadingTimer();
        state.lastStatus = 'Returned from the failed loading screen. Check the error and try Calculate again.';
        renderWarTab();
        setStatus(state.lastStatus, 'bad');
    }

    async function buildReport() {
        if (state.buildInProgress || state.reportLoading?.active) {
            showNotification('Calculation Already Running', 'RWPH is already calculating this report. Duplicate Calculate requests were blocked.', 'warn');
            return;
        }
        state.buildInProgress = true;
        const reportStartedAt = performance.now?.() || Date.now();
        if (state.activeCachedReport) exitCachedReport(true, false);
        clearPaymentHandoffStorage(true);
        const war = state.selectedWar;
        if (!war) {
            setStatus('Load and select a ranked war first.', 'bad');
            state.buildInProgress = false;
            return;
        }
        const { start, end } = selectedRange();
        if (!start || !end || end <= start) {
            setStatus('Enter a valid start and end time. End must be after start.', 'bad');
            state.buildInProgress = false;
            return;
        }

        const startInput = document.querySelector('#rwph-start')?.value || '';
        const endInput = document.querySelector('#rwph-end')?.value || '';
        gm.set(KEYS.manualStart, startInput);
        gm.set(KEYS.manualEnd, endInput);

        const mode = currentPayoutMode();
        if (mode === 'advanced') saveAdvancedInputs();
        else saveBasicInputs();
        const frozenConfig = mode === 'advanced' ? cloneJson(advancedConfigFromDom(), {}) : cloneJson(basicConfigFromDom(), {});
        const frozenRange = { startInput, endInput };

        setBusy(true);
        beginReportLoading(mode, war, frozenConfig, frozenRange);
        try {
            setReportLoadingStep(0, 'Verifying server-side RWPH licence and Torn identity…');
            await requireActiveLicence();
            if (!state.faction?.id) await loadIdentity();

            setReportLoadingStep(1, 'Fetching ranked-war information…');
            state.selectedWarReport = await loadWarReportIfAvailable(war);

            setReportLoadingStep(2, 'Fetching outgoing attack logs…');
            state.attacks = await loadAttacks(start, end, 'outgoing');

            setReportLoadingStep(3, 'Fetching incoming attack logs…');
            state.incomingAttacks = await loadAttacks(start, end, 'incoming');

            setReportLoadingStep(4, `Processing ${state.attacks.length.toLocaleString()} outgoing and ${state.incomingAttacks.length.toLocaleString()} incoming attacks…`);
            await new Promise(resolve => setTimeout(resolve, 0));

            setReportLoadingStep(5, 'Classifying war hits, outside hits, assists and retaliations…');
            await new Promise(resolve => setTimeout(resolve, 0));
            const opponentId = Number(factionOpponent(war)?.id || 0);
            state.reportRows = await classifyAttacks(state.attacks, state.incomingAttacks, state.faction.id, state.selectedWarReport, opponentId);

            setReportLoadingStep(6, 'Calculating member Fair Fight averages and bonuses…');
            await new Promise(resolve => setTimeout(resolve, 0));
            if (mode === 'advanced') state.reportRows.forEach(row => advancedRowScore(row, frozenConfig, true));

            setReportLoadingStep(7, 'Applying saved Member Management adjustments…');
            loadMemberManagementState();
            initialiseIncludedMembers();
            await new Promise(resolve => setTimeout(resolve, 0));

            setReportLoadingStep(8, mode === 'advanced' ? 'Sending Advanced contribution scoring to the licensed RWPH server…' : 'Validating Basic payout access against the RWPH licence server…');
            state.protectedCalculation = null;
            if (mode === 'advanced') {
                await calculateAdvancedOnServer(frozenConfig);
                state.reportLoading.calculationSummary = advancedSummary(frozenConfig);
            } else {
                const basicValidation = await backendRequest('/calculate', {
                    token: state.licence.token,
                    body: { mode: 'basic', appVersion: APP.version, warId: Number(war.id || 0), payableHits: basicSummary(frozenConfig).payableHits, totalPayout: basicSummary(frozenConfig).totalPayout }, signed: true, retries: 2,
                });
                state.protectedCalculation = { mode: 'basic', verifiedAt: Date.now(), validationId: String(basicValidation.validationId || '') };
                state.reportLoading.calculationSummary = basicSummary(frozenConfig);
            }
            await new Promise(resolve => setTimeout(resolve, 0));

            setReportLoadingStep(9, 'Building the final report and frozen 10-minute cache…');
            saveCurrentReportCache(mode, frozenConfig, frozenRange);
            state.paymentSessions = new Map();
            const totalWarHits = state.reportRows.reduce((sum, row) => sum + Number(row.warHits || 0), 0);
            const outgoingCount = state.attacks.length;
            const incomingCount = state.incomingAttacks.length;
            const apiStats = apiReliabilityStats();
            state.performance.outgoingAttacks = outgoingCount;
            state.performance.incomingAttacks = incomingCount;
            state.performance.rawAttacksReleased = outgoingCount + incomingCount;
            state.performance.lastReportMs = Math.max(0, Math.round((performance.now?.() || Date.now()) - reportStartedAt));
            state.lastStatus = `Report built from ${outgoingCount.toLocaleString()} outgoing and ${incomingCount.toLocaleString()} incoming attacks. Found ${totalWarHits.toLocaleString()} ranked-war hits. API requests ${apiStats.requests.toLocaleString()}, attack pages ${apiStats.attackPages.toLocaleString()}, retries ${apiStats.retries.toLocaleString()}, duplicates skipped ${apiStats.duplicatesSkipped.toLocaleString()}. Classification ${state.performance.lastClassifyMs.toLocaleString()}ms. ${reportCacheLabel(mode)} report cached for 10 minutes.`;
            state.attacks = [];
            state.incomingAttacks = [];
            saveRecoverySnapshot('report-complete');
            completeReportLoading(`${state.lastStatus} Open Results when ready.`);
        } catch (err) {
            state.lastStatus = err.message || String(err);
            const backendFailure = !!err?.serverUnavailable || !!err?.code || /backend|licen[cs]e server|worker|database/i.test(state.lastStatus);
            showNotification(backendFailure ? 'Backend Error' : 'API Error', state.lastStatus, 'bad');
            failReportLoading(err);
        } finally {
            state.buildInProgress = false;
            setBusy(false);
            if (state.reportLoading?.active) updateReportLoadingDom();
        }
    }

    function chooseWar(id) {
        if (state.activeCachedReport) exitCachedReport(true, false);
        clearPaymentHandoffStorage(true);
        const war = state.wars.find(w => Number(w.id) === Number(id));
        state.selectedWar = war || null;
        state.selectedWarReport = null;
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = [];
        state.includedMembers = new Set();
        state.advancedIncludedMembers = new Set();
        state.paymentSessions = new Map();
        state.protectedCalculation = null;
        if (war) gm.set(KEYS.selectedWarId, Number(war.id));
        loadMemberManagementState();
        renderWarTab();
    }

    function useSelectedWarTimes() {
        const war = state.selectedWar;
        if (!war) return;
        const start = unixToLocalInput(war.start);
        const end = unixToLocalInput(war.end || Math.floor(Date.now() / 1000));
        const startEl = document.querySelector('#rwph-start');
        const endEl = document.querySelector('#rwph-end');
        if (startEl) startEl.value = start;
        if (endEl) endEl.value = end;
        gm.set(KEYS.manualStart, start);
        gm.set(KEYS.manualEnd, end);
        setStatus('Selected war times copied into the report range.', 'good');
    }

    function resetCurrent() {
        if (state.activeCachedReport) exitCachedReport(true, false);
        clearPaymentHandoffStorage(true);
        state.selectedWarReport = null;
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = [];
        state.includedMembers = new Set();
        state.advancedIncludedMembers = new Set();
        state.paymentSessions = new Map();
        state.protectedCalculation = null;
        gm.del(KEYS.manualStart);
        gm.del(KEYS.manualEnd);
        gm.del(KEYS.sessionRecovery);
        state.recoveryPromptHidden = true;
        renderWarTab();
        setStatus('Current v3.5.0 report and payout selections reset. Saved Member Management adjustments remain available for their 20-minute window.', 'good');
    }

    function warOptionsHtml() {
        let wars = state.wars || [];
        if (state.selectedWar && !wars.some(w => Number(w.id) === Number(state.selectedWar.id))) wars = [state.selectedWar, ...wars];
        if (!wars.length) return '<option value="">No wars loaded</option>';
        return wars.map(w => {
            const f1 = w.factions?.[0]?.name || 'Faction A';
            const f2 = w.factions?.[1]?.name || 'Faction B';
            const status = warStatus(w);
            const selected = Number(state.selectedWar?.id) === Number(w.id) ? ' selected' : '';
            return `<option value="${escapeHtml(w.id)}"${selected}>#${escapeHtml(w.id)} — ${escapeHtml(f1)} vs ${escapeHtml(f2)} — ${escapeHtml(status)}</option>`;
        }).join('');
    }

    function advancedBonusPenalty(score) {
        const components = score?.components || {};
        const bonusPoints = ['retals', 'ownHosp', 'fairFight']
            .reduce((sum, key) => sum + Math.max(0, Number(components[key] || 0)), 0);
        const penalties = Object.values(components)
            .reduce((sum, value) => sum + (Number(value || 0) < 0 ? Math.abs(Number(value || 0)) : 0), 0);
        return { bonusPoints, penalties };
    }

    function reportViewRows(mode = currentPayoutMode()) {
        const isAdvanced = mode === 'advanced';
        const basic = isAdvanced ? null : basicSummary();
        const advancedConfig = isAdvanced ? advancedConfigFromDom() : null;
        const advanced = isAdvanced ? advancedSummary(advancedConfig) : null;
        const advancedById = isAdvanced ? new Map((advanced.rows || []).map(item => [Number(item.row?.id || 0), item])) : null;

        return state.reportRows.map(row => {
            const excluded = isMemberExcluded(row);
            const effectiveWarHits = adjustedWarHits(row);
            const effectiveRespect = adjustedRespect(row);
            const totalRetals = Number(row.totalRetals ?? ((row.warRetals ?? row.retals ?? 0) + (row.outsideRetals || 0)));

            if (isAdvanced) {
                const included = !excluded && state.advancedIncludedMembers.has(Number(row.id));
                const serverOrLocal = advancedById.get(Number(row.id));
                const score = serverOrLocal?.score || advancedRowScore(row, advancedConfig, included);
                const { bonusPoints, penalties } = advancedBonusPenalty(score);
                const payout = score.finalPoints * advanced.pointValue;
                const percentage = advanced.memberPayoutPool > 0 ? (payout / advanced.memberPayoutPool) * 100 : 0;
                const cachePercentage = advanced.payoutPool > 0 ? (payout / advanced.payoutPool) * 100 : 0;
                return { row, included, excluded, effectiveWarHits, effectiveRespect, totalRetals, score, bonusPoints, penalties, contributionPoints: score.finalPoints, payableHits: included ? score.payableHits : 0, payout, percentage, cachePercentage };
            }

            const included = !excluded && state.includedMembers.has(Number(row.id));
            const payableHits = included ? effectiveWarHits : 0;
            const payout = payableHits * basic.payPerHit;
            const percentage = basic.totalPayout > 0 ? (payout / basic.totalPayout) * 100 : 0;
            const cachePercentage = basic.hasPool && basic.payoutPool > 0 ? (payout / basic.payoutPool) * 100 : 0;
            return { row, included, excluded, effectiveWarHits, effectiveRespect, totalRetals, score: null, bonusPoints: 0, penalties: 0, contributionPoints: payableHits, payableHits, payout, percentage, cachePercentage };
        });
    }


    function contributionLevelForView(view, maxContribution) {
        const value = Math.max(0, Number(view?.contributionPoints || 0));
        const max = Math.max(0, Number(maxContribution || 0));
        if (value <= 0 || max <= 0) return 'low';
        const ratio = value / max;
        if (ratio >= 0.90) return 'top';
        if (ratio >= 0.60) return 'high';
        if (ratio >= 0.25) return 'medium';
        return 'low';
    }

    function reportViewMatchesFilters(view, filters, maxContribution) {
        const statusAllowed = view.excluded ? filters.excluded : (view.included ? filters.included : filters.unselected);
        if (!statusAllowed) return false;
        if (Number(view.effectiveWarHits || 0) < Number(filters.minHits || 0)) return false;
        if (Number(view.effectiveRespect || 0) < Number(filters.minRespect || 0)) return false;
        if (Number(view.payout || 0) < Number(filters.minPayout || 0)) return false;
        if (filters.name && !String(view.row?.name || '').toLowerCase().includes(String(filters.name).toLowerCase())) return false;
        if (filters.tornId && !String(view.row?.id || '').includes(String(filters.tornId))) return false;
        if (filters.contribution !== 'all' && contributionLevelForView(view, maxContribution) !== filters.contribution) return false;
        return true;
    }

    function filteredReportRows(mode = currentPayoutMode()) {
        const all = reportViewRows(mode);
        const maxContribution = all.reduce((max, view) => Math.max(max, Number(view.contributionPoints || 0)), 0);
        const filters = normalizeReportFilters(state.reportFilters || defaultReportFilters());
        return all.filter(view => reportViewMatchesFilters(view, filters, maxContribution));
    }

    function applyReportFiltersToDom() {
        const mode = currentPayoutMode();
        const all = reportViewRows(mode);
        const maxContribution = all.reduce((max, view) => Math.max(max, Number(view.contributionPoints || 0)), 0);
        const filters = normalizeReportFilters(state.reportFilters || defaultReportFilters());
        let shown = 0;
        for (const view of all) {
            const id = Number(view.row?.id || 0);
            const tr = document.querySelector(mode === 'advanced' ? `[data-rwph-adv-row-id="${id}"]` : `[data-rwph-row-id="${id}"]`);
            if (!tr) continue;
            const visible = reportViewMatchesFilters(view, filters, maxContribution);
            tr.hidden = !visible;
            if (visible) shown += 1;
        }
        const count = document.querySelector('#rwph-filter-count');
        if (count) count.textContent = `Showing ${formatNumber(shown)} of ${formatNumber(all.length)} members`;
        return shown;
    }

    function reportFiltersHtml() {
        const f = normalizeReportFilters(state.reportFilters || defaultReportFilters());
        return `<div class="rwph-filter-card">
            <div class="rwph-preset-head"><div><b>Advanced Report Filters</b><span>Filters only change what is visible. They never change payout selections or payment amounts.</span></div><span class="rwph-pill">v3.2</span></div>
            <div class="rwph-filter-status-row">
                <label><input id="rwph-filter-included" type="checkbox" ${f.included ? 'checked' : ''}> Included</label>
                <label><input id="rwph-filter-excluded" type="checkbox" ${f.excluded ? 'checked' : ''}> Excluded</label>
                <label><input id="rwph-filter-unselected" type="checkbox" ${f.unselected ? 'checked' : ''}> Unselected</label>
                <span id="rwph-filter-count">Showing ${formatNumber(state.reportRows.length)} of ${formatNumber(state.reportRows.length)} members</span>
            </div>
            <div class="rwph-filter-grid">
                <div class="rwph-field"><label>Minimum War Hits</label><input id="rwph-filter-min-hits" type="number" min="0" step="1" value="${escapeHtml(f.minHits)}"></div>
                <div class="rwph-field"><label>Minimum Respect</label><input id="rwph-filter-min-respect" type="number" min="0" step="0.01" value="${escapeHtml(f.minRespect)}"></div>
                <div class="rwph-field"><label>Minimum Payout</label><input id="rwph-filter-min-payout" type="text" inputmode="decimal" placeholder="Example: 1m" value="${f.minPayout > 0 ? escapeHtml(String(f.minPayout)) : ''}"></div>
                <div class="rwph-field"><label>Member Name</label><input id="rwph-filter-name" type="text" maxlength="60" placeholder="Search name" value="${escapeHtml(f.name)}"></div>
                <div class="rwph-field"><label>Torn ID</label><input id="rwph-filter-id" type="text" inputmode="numeric" maxlength="20" placeholder="Search ID" value="${escapeHtml(f.tornId)}"></div>
                <div class="rwph-field"><label>Contribution Level</label><select id="rwph-filter-contribution"><option value="all" ${f.contribution==='all'?'selected':''}>All levels</option><option value="top" ${f.contribution==='top'?'selected':''}>Top · 90–100% of leader</option><option value="high" ${f.contribution==='high'?'selected':''}>High · 60–89%</option><option value="medium" ${f.contribution==='medium'?'selected':''}>Medium · 25–59%</option><option value="low" ${f.contribution==='low'?'selected':''}>Low · under 25%</option></select></div>
            </div>
            <div class="rwph-btn-row"><button class="rwph-btn" type="button" data-action="reset-report-filters">Reset Filters</button></div>
        </div>`;
    }


    // v3.3.0 report export + automatic session recovery.
    const EXPORT_COLUMNS = Object.freeze([
        { id: 'status', label: 'Status', modes: ['basic','advanced'], value: v => v.excluded ? 'Excluded' : (v.included ? 'Included' : 'Unselected') },
        { id: 'name', label: 'Member', modes: ['basic','advanced'], value: v => String(v.row?.name || '') },
        { id: 'tornId', label: 'Torn ID', modes: ['basic','advanced'], value: v => Number(v.row?.id || 0) },
        { id: 'warHits', label: 'War Hits', modes: ['basic','advanced'], value: v => Number(v.effectiveWarHits || 0) },
        { id: 'outsideHits', label: 'Outside Hits', modes: ['basic','advanced'], value: v => Number(v.row?.outsideHits || 0) },
        { id: 'assists', label: 'Assists', modes: ['basic','advanced'], value: v => Number(v.row?.assists || 0) },
        { id: 'retaliations', label: 'Retaliations', modes: ['basic','advanced'], value: v => Number(v.totalRetals || 0) },
        { id: 'warRetals', label: 'War Retals', modes: ['basic','advanced'], value: v => Number(v.row?.warRetals ?? v.row?.retals ?? 0) },
        { id: 'outsideRetals', label: 'Outside Retals', modes: ['basic','advanced'], value: v => Number(v.row?.outsideRetals || 0) },
        { id: 'enemyHospitals', label: 'Enemy Hospitalized', modes: ['advanced'], value: v => Number(v.row?.enemyHospitals || 0) },
        { id: 'hospitalizedByEnemy', label: 'Hospitalized by Enemy', modes: ['advanced'], value: v => Number(v.row?.hospitalizedByEnemy || 0) },
        { id: 'avgFF', label: 'Avg FF', modes: ['basic','advanced'], value: v => Number(v.row?.avgFF || 0) },
        { id: 'ffHits', label: 'FF Hits', modes: ['advanced'], value: v => Number(v.score?.payableHits || 0) },
        { id: 'ffSteps', label: 'FF Steps', modes: ['advanced'], value: v => Number(v.score?.ffSteps || 0) },
        { id: 'ffPoints', label: 'FF Points', modes: ['advanced'], value: v => Number(v.score?.ffPoints || 0) },
        { id: 'bonusPoints', label: 'Bonus Points', modes: ['advanced'], value: v => Number(v.bonusPoints || 0) },
        { id: 'penalties', label: 'Penalties', modes: ['advanced'], value: v => Number(v.penalties || 0) },
        { id: 'rawPoints', label: 'Raw Points', modes: ['advanced'], value: v => Number(v.score?.rawPoints || 0) },
        { id: 'contributionPoints', label: 'Contribution Points', modes: ['basic','advanced'], value: v => Number(v.contributionPoints || 0) },
        { id: 'payableHits', label: 'Payable Hits', modes: ['basic','advanced'], value: v => Number(v.payableHits || 0) },
        { id: 'payout', label: 'Payout', modes: ['basic','advanced'], value: v => Number(v.payout || 0) },
        { id: 'memberPercent', label: 'Member Payout %', modes: ['basic','advanced'], value: v => Number(v.percentage || 0) },
        { id: 'cachePercent', label: '% War Cache', modes: ['basic','advanced'], value: v => Number(v.cachePercentage || 0) },
        { id: 'respect', label: 'Respect', modes: ['basic','advanced'], value: v => Number(v.effectiveRespect || 0) },
        { id: 'totalAttacks', label: 'Total Attacks', modes: ['basic','advanced'], value: v => Number(v.row?.totalAttacks || 0) },
    ]);
    const DEFAULT_EXPORT_COLUMNS = Object.freeze(['status','name','tornId','warHits','outsideHits','assists','retaliations','avgFF','respect','contributionPoints','payableHits','payout','memberPercent','cachePercent']);

    function exportColumnsForMode(mode = currentPayoutMode()) {
        return EXPORT_COLUMNS.filter(column => column.modes.includes(mode));
    }

    function readExportColumnIds(mode = currentPayoutMode()) {
        const allowed = new Set(exportColumnsForMode(mode).map(column => column.id));
        let stored = [];
        try { stored = JSON.parse(String(gm.get(KEYS.exportColumns, '[]'))); } catch (_) { stored = []; }
        if (!Array.isArray(stored) || !stored.length) stored = DEFAULT_EXPORT_COLUMNS;
        const filtered = stored.map(String).filter(id => allowed.has(id));
        return filtered.length ? filtered : DEFAULT_EXPORT_COLUMNS.filter(id => allowed.has(id));
    }

    function saveExportColumnIds(ids) {
        const clean = [...new Set((ids || []).map(String))].filter(id => EXPORT_COLUMNS.some(column => column.id === id));
        gm.set(KEYS.exportColumns, JSON.stringify(clean));
        return clean;
    }

    function selectedExportColumnIdsFromDom(mode = currentPayoutMode()) {
        const boxes = [...document.querySelectorAll('#rwph-export-columns input[data-export-column]')];
        if (!boxes.length) return readExportColumnIds(mode);
        return boxes.filter(box => box.checked).map(box => String(box.dataset.exportColumn || '')).filter(Boolean);
    }

    function exportScopeFromDom() {
        const value = String(document.querySelector('#rwph-export-scope')?.value || gm.get(KEYS.exportScope, 'filtered'));
        return ['all','filtered','payable'].includes(value) ? value : 'filtered';
    }

    function exportFormatFromDom() {
        const value = String(document.querySelector('#rwph-export-format')?.value || gm.get(KEYS.exportFormat, 'csv'));
        return ['csv','json','text','discord','torn'].includes(value) ? value : 'csv';
    }

    function exportRowsForScope(scope = exportScopeFromDom(), mode = currentPayoutMode()) {
        const all = sortedReportViewRows(mode);
        if (scope === 'payable') return all.filter(view => view.included && !view.excluded && Number(view.payout || 0) > 0);
        if (scope === 'filtered') {
            const maxContribution = all.reduce((max, view) => Math.max(max, Number(view.contributionPoints || 0)), 0);
            const filters = normalizeReportFilters(state.reportFilters || defaultReportFilters());
            return all.filter(view => reportViewMatchesFilters(view, filters, maxContribution));
        }
        return all;
    }

    function exportDisplayValue(column, raw) {
        const number = Number(raw);
        if (column.id === 'payout') return formatMoney(number);
        if (['memberPercent','cachePercent'].includes(column.id)) return `${formatNumber(number, 2)}%`;
        if (['avgFF','ffPoints','bonusPoints','penalties','rawPoints','contributionPoints','respect'].includes(column.id)) return formatNumber(number, 2);
        if (typeof raw === 'number') return formatNumber(number);
        return String(raw ?? '');
    }

    function buildExportModel() {
        const mode = currentPayoutMode();
        const ids = selectedExportColumnIdsFromDom(mode);
        const columns = exportColumnsForMode(mode).filter(column => ids.includes(column.id));
        if (!columns.length) throw new Error('Select at least one report column to export.');
        saveExportColumnIds(columns.map(column => column.id));
        const scope = exportScopeFromDom();
        const rows = exportRowsForScope(scope, mode);
        const opponent = factionOpponent(state.selectedWar);
        const split = activePoolSplit(mode);
        return {
            mode, scope, columns, rows,
            metadata: {
                app: APP.name,
                version: APP.version,
                generatedAt: new Date().toISOString(),
                warId: Number(state.selectedWar?.id || 0),
                faction: state.faction ? { id: Number(state.faction.id || 0), name: String(state.faction.name || '') } : null,
                opponent: opponent ? { id: Number(opponent.id || 0), name: String(opponent.name || '') } : null,
                poolSplit: { members: Number(split.members || 0), faction: Number(split.faction || 0) },
                cachedSnapshot: !!state.activeCachedReport,
            },
        };
    }

    function csvCell(value) {
        const text = String(value ?? '');
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function exportHeading(model) {
        const m = model.metadata;
        const faction = m.faction?.name || 'Faction';
        const opponent = m.opponent?.name || 'Opponent';
        return `${APP.name} Ranked War Report — War #${m.warId || '—'} — ${faction} vs ${opponent} — ${model.mode === 'advanced' ? 'Advanced' : 'Basic'}`;
    }

    function createExportContent(format = exportFormatFromDom()) {
        const model = buildExportModel();
        const rowObjects = model.rows.map(view => Object.fromEntries(model.columns.map(column => [column.id, column.value(view)])));
        const displayRows = model.rows.map(view => model.columns.map(column => exportDisplayValue(column, column.value(view))));
        const labels = model.columns.map(column => column.label);
        let content = '';
        let extension = 'txt';
        let mime = 'text/plain;charset=utf-8';
        if (format === 'csv') {
            content = [labels.map(csvCell).join(','), ...displayRows.map(row => row.map(csvCell).join(','))].join('\r\n');
            extension = 'csv'; mime = 'text/csv;charset=utf-8';
        } else if (format === 'json') {
            content = JSON.stringify({ ...model.metadata, mode: model.mode, scope: model.scope, columns: model.columns.map(c => ({ id: c.id, label: c.label })), rows: rowObjects }, null, 2);
            extension = 'json'; mime = 'application/json;charset=utf-8';
        } else if (format === 'discord') {
            const table = [labels.join(' | '), labels.map(() => '---').join(' | '), ...displayRows.map(row => row.join(' | '))].join('\n');
            content = `**${exportHeading(model)}**\nMember/Faction split: ${model.metadata.poolSplit.members}% / ${model.metadata.poolSplit.faction}%\n\n\`\`\`text\n${table}\n\`\`\``;
            extension = 'txt';
        } else if (format === 'torn') {
            const table = [labels.join(' | '), ...displayRows.map(row => row.join(' | '))].join('\n');
            content = `[b]${exportHeading(model)}[/b]\n[b]Member/Faction split:[/b] ${model.metadata.poolSplit.members}% / ${model.metadata.poolSplit.faction}%\n[code]${table}[/code]`;
            extension = 'txt';
        } else {
            const table = [labels.join(' | '), labels.map(() => '---').join(' | '), ...displayRows.map(row => row.join(' | '))].join('\n');
            content = `${exportHeading(model)}\nMember/Faction split: ${model.metadata.poolSplit.members}% / ${model.metadata.poolSplit.faction}%\nGenerated: ${model.metadata.generatedAt}\n\n${table}`;
            extension = 'txt';
        }
        return { model, content, extension, mime, format };
    }

    function exportFileName(extension) {
        const warId = Number(state.selectedWar?.id || 0) || 'war';
        const mode = currentPayoutMode();
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `RWPH_War_${warId}_${mode}_${stamp}.${extension}`;
    }

    function downloadExport() {
        try {
            const built = createExportContent();
            const blob = new Blob([built.content], { type: built.mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportFileName(built.extension);
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            setStatus(`Exported ${built.model.rows.length} report row${built.model.rows.length === 1 ? '' : 's'} as ${built.format.toUpperCase()}.`, 'good');
            showNotification('Report Exported', `${built.model.rows.length} rows exported as ${built.format.toUpperCase()}.`, 'good');
        } catch (err) {
            setStatus(`Export failed: ${err.message || String(err)}`, 'bad');
            showNotification('Export Error', err.message || String(err), 'bad');
        }
    }

    async function copyExportToClipboard() {
        try {
            const built = createExportContent();
            const ok = await copyPaymentText(built.content);
            if (!ok) throw new Error('Clipboard access was unavailable. Use Download Export instead.');
            setStatus(`Copied ${built.format.toUpperCase()} export text for ${built.model.rows.length} report row${built.model.rows.length === 1 ? '' : 's'}.`, 'good');
            showNotification('Export Copied', `${built.format.toUpperCase()} report copied to clipboard.`, 'good');
        } catch (err) {
            setStatus(`Copy export failed: ${err.message || String(err)}`, 'bad');
            showNotification('Export Error', err.message || String(err), 'bad');
        }
    }

    function exportRecoveryHtml() {
        if (!state.reportRows.length) return '';
        const mode = currentPayoutMode();
        const selected = new Set(readExportColumnIds(mode));
        const format = String(gm.get(KEYS.exportFormat, 'csv'));
        const scope = String(gm.get(KEYS.exportScope, 'filtered'));
        return `<div class="rwph-export-card">
            <div class="rwph-export-head"><div><b>Export Report</b><span>Choose a format, row scope, and exactly which report columns to include.</span></div><span class="rwph-pill">v3.3</span></div>
            <div class="rwph-export-grid">
                <div class="rwph-field"><label>Format</label><select id="rwph-export-format"><option value="csv" ${format==='csv'?'selected':''}>CSV</option><option value="json" ${format==='json'?'selected':''}>JSON</option><option value="text" ${format==='text'?'selected':''}>Plain Text</option><option value="discord" ${format==='discord'?'selected':''}>Discord-ready Text</option><option value="torn" ${format==='torn'?'selected':''}>Torn Forum / Newsletter</option></select></div>
                <div class="rwph-field"><label>Rows</label><select id="rwph-export-scope"><option value="filtered" ${scope==='filtered'?'selected':''}>Current Filtered View</option><option value="all" ${scope==='all'?'selected':''}>All Report Members</option><option value="payable" ${scope==='payable'?'selected':''}>Payable Members Only</option></select></div>
                <div class="rwph-field"><label>Selected Columns</label><div class="rwph-note" id="rwph-export-column-count">${selected.size} selected</div></div>
            </div>
            <div class="rwph-export-columns" id="rwph-export-columns">${exportColumnsForMode(mode).map(column => `<label><input type="checkbox" data-export-column="${escapeHtml(column.id)}" ${selected.has(column.id)?'checked':''}> ${escapeHtml(column.label)}</label>`).join('')}</div>
            <div class="rwph-btn-row"><button class="rwph-btn" type="button" data-action="export-default-columns">Default Columns</button><button class="rwph-btn" type="button" data-action="export-all-columns">Select All Columns</button><button class="rwph-btn primary" type="button" data-action="export-report">Download Export</button><button class="rwph-btn" type="button" data-action="copy-export">Copy Export</button></div>
            <div class="rwph-note" style="margin-top:8px;">Current Filtered View exports only rows visible under the v3.2 report filters. Exporting never changes payout selections or payment progress.</div>
        </div>`;
    }

    function rawPaymentSessionForRecovery(session) {
        const source = session && typeof session === 'object' ? session : {};
        return {
            reportKey: String(source.reportKey || ''),
            completedKeys: [...(source.completedKeys instanceof Set ? source.completedKeys : new Set(source.completedKeys || []))].map(String),
            completionOrder: Array.isArray(source.completionOrder) ? source.completionOrder.map(String) : [],
            skippedKeys: [...(source.skippedKeys instanceof Set ? source.skippedKeys : new Set(source.skippedKeys || []))].map(String),
            skipOrder: Array.isArray(source.skipOrder) ? source.skipOrder.map(String) : [],
            payAllActive: !!source.payAllActive,
            payAllCursor: Number(source.payAllCursor ?? -1),
            payAllOrder: Array.isArray(source.payAllOrder) ? source.payAllOrder.map(String) : [],
            pendingKey: String(source.pendingKey || ''),
            payAllHistory: Array.isArray(source.payAllHistory) ? source.payAllHistory.map(String) : [],
        };
    }

    function restorePaymentSessionsFromRecovery(entries) {
        const map = new Map();
        for (const entry of Array.isArray(entries) ? entries : []) {
            const key = String(entry?.[0] || entry?.key || '');
            const raw = entry?.[1] || entry?.session || {};
            if (!key) continue;
            map.set(key, {
                reportKey: String(raw.reportKey || key),
                completedKeys: new Set((raw.completedKeys || []).map(String)),
                completionOrder: (raw.completionOrder || []).map(String),
                skippedKeys: new Set((raw.skippedKeys || []).map(String)),
                skipOrder: (raw.skipOrder || []).map(String),
                payAllActive: !!raw.payAllActive,
                payAllCursor: Number(raw.payAllCursor ?? -1),
                payAllOrder: (raw.payAllOrder || []).map(String),
                pendingKey: String(raw.pendingKey || ''),
                payAllHistory: (raw.payAllHistory || []).map(String),
            });
        }
        return map;
    }

    function recoverySettingsSnapshot() {
        return {
            basicPayPerHit: String(gm.get(KEYS.basicPayPerHit, '')),
            basicPayoutPool: String(gm.get(KEYS.basicPayoutPool, '')),
            advancedPayoutPool: String(gm.get(KEYS.advancedPayoutPool, '100m')),
            advancedWarHitWeight: String(gm.get(KEYS.advancedWarHitWeight, '1')),
            advancedOutsideHitWeight: String(gm.get(KEYS.advancedOutsideHitWeight, '1')),
            advancedRetalWeight: String(gm.get(KEYS.advancedRetalWeight, '1')),
            advancedAssistWeight: String(gm.get(KEYS.advancedAssistWeight, '1')),
            advancedOwnHospitalWeight: String(gm.get(KEYS.advancedOwnHospitalWeight, '0')),
            advancedEnemyHospitalWeight: String(gm.get(KEYS.advancedEnemyHospitalWeight, '-1')),
            advancedFairFightEnabled: checkboxInputValue('rwph-adv-ff-enabled', KEYS.advancedFairFightEnabled, true),
            advancedFairFightStart: String(gm.get(KEYS.advancedFairFightStart, '1.00')),
            advancedFairFightStep: String(gm.get(KEYS.advancedFairFightStep, '0.02')),
            advancedFairFightBonus: String(gm.get(KEYS.advancedFairFightBonus, '0.01')),
            advancedFairFightCap: String(gm.get(KEYS.advancedFairFightCap, '3.00')),
            poolSplit: cloneJson(currentPoolSplit(), { members: 100, faction: 0 }),
            reportFilters: cloneJson(state.reportFilters || defaultReportFilters(), defaultReportFilters()),
            manualStart: String(document.querySelector('#rwph-start')?.value || gm.get(KEYS.manualStart, '')),
            manualEnd: String(document.querySelector('#rwph-end')?.value || gm.get(KEYS.manualEnd, '')),
        };
    }

    function applyRecoverySettings(settings) {
        const cfg = settings && typeof settings === 'object' ? settings : {};
        const assignments = [
            [KEYS.basicPayPerHit, cfg.basicPayPerHit], [KEYS.basicPayoutPool, cfg.basicPayoutPool],
            [KEYS.advancedPayoutPool, cfg.advancedPayoutPool], [KEYS.advancedWarHitWeight, cfg.advancedWarHitWeight],
            [KEYS.advancedOutsideHitWeight, cfg.advancedOutsideHitWeight], [KEYS.advancedRetalWeight, cfg.advancedRetalWeight],
            [KEYS.advancedAssistWeight, cfg.advancedAssistWeight], [KEYS.advancedOwnHospitalWeight, cfg.advancedOwnHospitalWeight],
            [KEYS.advancedEnemyHospitalWeight, cfg.advancedEnemyHospitalWeight], [KEYS.advancedFairFightEnabled, cfg.advancedFairFightEnabled],
            [KEYS.advancedFairFightStart, cfg.advancedFairFightStart], [KEYS.advancedFairFightStep, cfg.advancedFairFightStep],
            [KEYS.advancedFairFightBonus, cfg.advancedFairFightBonus], [KEYS.advancedFairFightCap, cfg.advancedFairFightCap],
            [KEYS.manualStart, cfg.manualStart], [KEYS.manualEnd, cfg.manualEnd],
        ];
        assignments.forEach(([key, value]) => { if (value !== undefined && value !== null) gm.set(key, value); });
        if (cfg.poolSplit) savePoolSplit(cfg.poolSplit);
        if (cfg.reportFilters) {
            state.reportFilters = normalizeReportFilters(cfg.reportFilters);
            saveReportFilters(state.reportFilters);
        }
    }

    function readRecoverySnapshot() {
        try {
            const raw = gm.get(KEYS.sessionRecovery, '');
            if (!raw) return null;
            let snapshot = JSON.parse(String(raw));
            if (!snapshot || snapshot.snapshotType !== 'session-recovery') throw new Error('Invalid recovery snapshot');
            if (Number(snapshot.expiresAt || 0) <= Date.now()) { gm.del(KEYS.sessionRecovery); return null; }
            if (Number(snapshot.schemaVersion || 0) < RECOVERY_SCHEMA_VERSION || !Array.isArray(snapshot.rowsPacked)) {
                snapshot = migratePackedSnapshot(snapshot, 'recovery');
                if (!snapshot) throw new Error('Could not migrate recovery snapshot');
                gm.set(KEYS.sessionRecovery, JSON.stringify(snapshot));
            }
            const reportRows = unpackReportRows(snapshot.rowsPacked);
            if (!snapshot.selectedWar && !reportRows.length) throw new Error('Recovery snapshot is incomplete');
            return { ...snapshot, reportRows };
        } catch (_) {
            gm.del(KEYS.sessionRecovery);
            return null;
        }
    }

    function recoveryAgeText(snapshot) {
        const ageMs = Math.max(0, Date.now() - Number(snapshot?.updatedAt || snapshot?.createdAt || 0));
        const minutes = Math.floor(ageMs / 60000);
        if (minutes < 1) return 'less than a minute ago';
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    function recoveryPromptHtml() {
        if (state.recoveryPromptHidden) return '';
        const snapshot = readRecoverySnapshot();
        if (!snapshot) return '';
        const rows = Array.isArray(snapshot.reportRows) ? snapshot.reportRows.length : 0;
        const progress = Array.isArray(snapshot.paymentSessions) ? snapshot.paymentSessions.reduce((sum, entry) => sum + Number((entry?.[1]?.completedKeys || []).length || 0), 0) : 0;
        return `<section class="rwph-card rwph-recovery-card">
            <div class="rwph-recovery-head"><div><b>Recover Previous RWPH Session</b><span>Saved ${escapeHtml(recoveryAgeText(snapshot))}. Restores the war, calculation settings, report, member adjustments and payment progress without reloading attack logs.</span></div><span class="rwph-pill">24h recovery</span></div>
            <div class="rwph-kpis"><div class="rwph-kpi"><b>#${escapeHtml(snapshot.selectedWar?.id || '—')}</b><span>War</span></div><div class="rwph-kpi"><b>${escapeHtml(snapshot.payoutMode === 'advanced' ? 'Advanced' : 'Basic')}</b><span>Mode</span></div><div class="rwph-kpi"><b>${formatNumber(rows)}</b><span>Report Rows</span></div><div class="rwph-kpi"><b>${formatNumber(progress)}</b><span>Payments Marked Paid</span></div></div>
            <div class="rwph-btn-row"><button class="rwph-btn primary" type="button" data-action="recover-session">Recover Previous RWPH Session</button><button class="rwph-btn danger" type="button" data-action="discard-recovery">Discard Recovery</button></div>
        </section>`;
    }

    function saveRecoverySnapshot(reason = 'auto') {
        if (!state.selectedWar && !state.reportRows.length) return null;
        try {
            const previous = readRecoverySnapshot();
            const now = Date.now();
            const snapshot = {
                schemaVersion: RECOVERY_SCHEMA_VERSION,
                snapshotType: 'session-recovery',
                appVersion: APP.version,
                createdAt: Number(previous?.createdAt || now),
                updatedAt: now,
                expiresAt: now + SESSION_RECOVERY_TTL_MS,
                reason: String(reason || 'auto').slice(0, 80),
                payoutMode: currentPayoutMode(),
                faction: cloneJson(state.faction, null),
                selectedWar: cloneJson(state.selectedWar, null),
                selectedWarReport: null,
                rowsPacked: packReportRows(state.reportRows),
                includedMembers: [...state.includedMembers],
                advancedIncludedMembers: [...state.advancedIncludedMembers],
                memberAdjustments: cloneJson(state.memberAdjustments, {}),
                memberAdjustmentsExpiresAt: Number(state.memberAdjustmentsExpiresAt || 0),
                reportSort: cloneJson(state.reportSort, { key: 'warHits', direction: 'desc' }),
                protectedCalculation: cloneJson(state.protectedCalculation, null),
                settings: recoverySettingsSnapshot(),
                paymentSessions: state.paymentSessions instanceof Map ? [...state.paymentSessions.entries()].map(([key, session]) => [String(key), rawPaymentSessionForRecovery(session)]) : [],
            };
            gm.set(KEYS.sessionRecovery, JSON.stringify(snapshot));
            // The saved snapshot belongs to the current live page. Hide the prompt
            // until a future userscript/page load resets this in-memory flag.
            state.recoveryPromptHidden = true;
            return snapshot;
        } catch (_) { return null; }
    }

    let recoverySaveTimer = null;
    function scheduleRecoverySnapshot(reason = 'auto') {
        if (recoverySaveTimer) clearTimeout(recoverySaveTimer);
        recoverySaveTimer = setTimeout(() => { recoverySaveTimer = null; saveRecoverySnapshot(reason); }, 500);
    }

    function discardRecoverySnapshot() {
        gm.del(KEYS.sessionRecovery);
        state.recoveryPromptHidden = true;
        setStatus('Previous RWPH recovery snapshot discarded.', 'good');
        showNotification('Recovery Cleared', 'Previous RWPH session recovery discarded.', 'good');
        if (state.open && state.tab === 'war') renderWarTab();
    }

    function restoreRecoverySnapshot() {
        const snapshot = readRecoverySnapshot();
        if (!snapshot) {
            setStatus('The previous RWPH recovery snapshot is missing or expired.', 'bad');
            showNotification('Recovery Unavailable', 'The previous recovery snapshot is missing or expired.', 'bad');
            if (state.open && state.tab === 'war') renderWarTab();
            return false;
        }
        state.liveStateBeforeCache = null;
        state.activeCachedReport = null;
        clearPaymentHandoffStorage(true);
        state.payoutMode = snapshot.payoutMode === 'advanced' ? 'advanced' : 'basic';
        gm.set(KEYS.payoutMode, state.payoutMode);
        state.faction = cloneJson(snapshot.faction, state.faction);
        state.selectedWar = cloneJson(snapshot.selectedWar, null);
        state.selectedWarReport = cloneJson(snapshot.selectedWarReport, null);
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = cloneJson(snapshot.reportRows, []);
        state.includedMembers = new Set((snapshot.includedMembers || []).map(Number));
        state.advancedIncludedMembers = new Set((snapshot.advancedIncludedMembers || []).map(Number));
        const adjustmentsStillValid = Number(snapshot.memberAdjustmentsExpiresAt || 0) > Date.now();
        state.memberAdjustments = adjustmentsStillValid ? cloneJson(snapshot.memberAdjustments, {}) : {};
        state.memberAdjustmentsExpiresAt = adjustmentsStillValid ? Number(snapshot.memberAdjustmentsExpiresAt || 0) : 0;
        state.reportSort = cloneJson(snapshot.reportSort, { key: 'warHits', direction: 'desc' });
        state.protectedCalculation = cloneJson(snapshot.protectedCalculation, null);
        state.paymentSessions = restorePaymentSessionsFromRecovery(snapshot.paymentSessions);
        applyRecoverySettings(snapshot.settings || {});
        if (state.selectedWar?.id) gm.set(KEYS.selectedWarId, Number(state.selectedWar.id));
        state.recoveryPromptHidden = true;
        state.lastStatus = `Recovered previous RWPH session for War #${state.selectedWar?.id || '—'} with ${state.reportRows.length} report rows. Attack logs were not re-requested.`;
        saveRecoverySnapshot('recovered');
        renderWarTab();
        setStatus(state.lastStatus, 'good');
        showNotification('Session Recovered', `Recovered War #${state.selectedWar?.id || '—'} and payment progress.`, 'good');
        return true;
    }

    function cacheSplitBreakdownHtml() {
        if (!state.reportRows.length) return '';
        const mode = currentPayoutMode();
        const split = activePoolSplit(mode);
        const summary = mode === 'advanced' ? advancedSummary() : basicSummary();
        const totalPool = mode === 'advanced' ? (summary.validPool ? summary.payoutPool : null) : (summary.hasPool ? summary.payoutPool : null);
        const memberPool = totalPool === null ? null : Number(summary.memberPayoutPool || 0);
        const factionShare = totalPool === null ? null : Number(summary.factionShare || 0);
        const memberPaid = reportViewRows(mode).filter(v => v.included).reduce((sum, v) => sum + Number(v.payout || 0), 0);
        const memberRemaining = memberPool === null ? null : memberPool - memberPaid;
        const frozen = isCachedViewActive(mode);
        return `<div class="rwph-split-card">
            <div class="rwph-preset-head"><div><b>War Cache Split Calculator</b><span>${frozen ? 'Frozen with this cached report.' : 'Uses the Member Pool / Faction-Vault percentages saved above.'}</span></div><span class="rwph-pill">${escapeHtml(split.members)} / ${escapeHtml(split.faction)}</span></div>
            <div class="rwph-split-kpis">
                <div class="rwph-kpi"><b id="rwph-split-total">${totalPool === null ? '—' : formatMoney(totalPool)}</b><span>Total War Cache</span></div>
                <div class="rwph-kpi"><b id="rwph-split-member">${memberPool === null ? '—' : formatMoney(memberPool)}</b><span>Member Pool · ${escapeHtml(split.members)}%</span></div>
                <div class="rwph-kpi"><b id="rwph-split-faction">${factionShare === null ? '—' : formatMoney(factionShare)}</b><span>Faction / Vault · ${escapeHtml(split.faction)}%</span></div>
                <div class="rwph-kpi"><b id="rwph-split-paid">${formatMoney(memberPaid)}</b><span>Member Payouts</span></div>
                <div class="rwph-kpi"><b id="rwph-split-remaining" class="${memberRemaining !== null ? (memberRemaining < 0 ? 'rwph-negative' : 'rwph-positive') : ''}">${memberRemaining === null ? '—' : formatMoney(memberRemaining)}</b><span>Member Pool Remaining</span></div>
            </div>
            <div class="rwph-note">Advanced mode distributes only the Member Pool by contribution points. Basic mode keeps Pay Per Hit fixed and uses the Member Pool as its budget ceiling. The Faction/Vault share is reserved and never appears in member payment rows.</div>
        </div>`;
    }

    function refreshCacheSplitBreakdown() {
        const host = document.querySelector('#rwph-cache-split-host');
        if (host) host.innerHTML = cacheSplitBreakdownHtml();
    }

    function reportSortValue(view, key) {
        const row = view.row;
        if (key === 'name') return String(row.name || '').toLowerCase();
        if (key === 'warHits') return Number(view.effectiveWarHits || 0);
        if (key === 'respect') return Number(view.effectiveRespect || 0);
        if (key === 'points') return Number(view.contributionPoints || 0);
        if (key === 'payout') return Number(view.payout || 0);
        if (key === 'fairFight') return Number(row.avgFF || 0);
        if (key === 'retals') return Number(view.totalRetals || 0);
        if (key === 'assists') return Number(row.assists || 0);
        return 0;
    }

    const rwphMemberCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    function sortedReportViewRows(mode = currentPayoutMode()) {
        const list = reportViewRows(mode).map((item, index) => ({ ...item, _index: index }));
        const key = state.reportSort?.key || 'warHits';
        const direction = state.reportSort?.direction === 'asc' ? 'asc' : 'desc';
        const factor = direction === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            const av = reportSortValue(a, key);
            const bv = reportSortValue(b, key);
            let cmp = 0;
            if (typeof av === 'string' || typeof bv === 'string') cmp = rwphMemberCollator.compare(String(av), String(bv));
            else cmp = Number(av) - Number(bv);
            if (Math.abs(cmp) < 1e-12) {
                const byName = rwphMemberCollator.compare(String(a.row.name || ''), String(b.row.name || ''));
                return byName || (a._index - b._index);
            }
            return cmp * factor;
        });
        return list;
    }

    function sortHeader(label, key) {
        const active = state.reportSort?.key === key;
        const dir = state.reportSort?.direction === 'asc' ? 'asc' : 'desc';
        const arrow = active ? (dir === 'asc' ? '▲' : '▼') : '';
        return `<button class="rwph-sort-btn ${active ? 'active' : ''}" type="button" data-rwph-sort="${escapeHtml(key)}">${escapeHtml(label)}<span class="rwph-sort-arrow">${arrow}</span></button>`;
    }

    function reportSummaryStats(mode = currentPayoutMode()) {
        const views = reportViewRows(mode);
        const included = views.filter(v => v.included);
        const paid = included.filter(v => Number(v.payout || 0) > 0);
        const totalAttacks = state.reportRows.reduce((sum, row) => sum + Number(row.totalAttacks || 0), 0);
        const totalPayableAttacks = included.reduce((sum, view) => sum + Number(view.payableHits || 0), 0);
        const totalContributionPoints = included.reduce((sum, view) => sum + Number(view.contributionPoints || 0), 0);
        const totalRespect = state.reportRows.reduce((sum, row) => sum + adjustedRespect(row), 0);
        const totalPayout = included.reduce((sum, view) => sum + Number(view.payout || 0), 0);
        const averagePayout = paid.length ? totalPayout / paid.length : 0;
        const highestContributor = included.length
            ? included.reduce((best, view) => Number(view.contributionPoints || 0) > Number(best.contributionPoints || 0) ? view : best, included[0])
            : null;
        const highestPayout = paid.length
            ? paid.reduce((best, view) => Number(view.payout || 0) > Number(best.payout || 0) ? view : best, paid[0])
            : null;
        const lowestPayout = paid.length
            ? paid.reduce((best, view) => Number(view.payout || 0) < Number(best.payout || 0) ? view : best, paid[0])
            : null;
        return {
            totalAttacks, totalPayableAttacks, totalContributionPoints, totalRespect,
            totalPayout, averagePayout, highestContributor, highestPayout, lowestPayout,
            includedMembers: included.length, paidMembers: paid.length,
        };
    }

    function memberMetricText(view, metric, suffix = '') {
        if (!view) return '—';
        const name = view.row?.name || `Player ${view.row?.id || ''}`;
        const value = metric === 'points' ? formatNumber(view.contributionPoints, 2) : formatMoney(view.payout);
        return `${escapeHtml(name)} — ${escapeHtml(value)}${suffix}`;
    }

    function warReportSummaryHtml() {
        if (!state.reportRows.length) return '';
        const stats = reportSummaryStats();
        return `<div class="rwph-report-heading">War Report Totals</div>
            <div class="rwph-kpis">
                <div class="rwph-kpi"><b>${formatNumber(stats.totalAttacks)}</b><span>Total Attacks</span></div>
                <div class="rwph-kpi"><b>${formatNumber(stats.totalPayableAttacks)}</b><span>Total Payable Attacks</span></div>
                <div class="rwph-kpi"><b>${formatNumber(stats.totalContributionPoints, 2)}</b><span>Total Contribution Points</span></div>
                <div class="rwph-kpi"><b>${formatNumber(stats.totalRespect, 2)}</b><span>Total Respect</span></div>
                <div class="rwph-kpi"><b>${formatMoney(stats.totalPayout)}</b><span>Total Payout</span></div>
                <div class="rwph-kpi"><b>${formatMoney(stats.averagePayout)}</b><span>Average Payout</span></div>
                <div class="rwph-kpi"><b>${formatNumber(stats.includedMembers)}</b><span>Included Members</span></div>
                <div class="rwph-kpi"><b>${formatNumber(stats.paidMembers)}</b><span>Members With Payout</span></div>
            </div>
            <div class="rwph-notables">
                <div class="rwph-notable"><span>Highest Contributor</span><b>${memberMetricText(stats.highestContributor, 'points', ' pts')}</b></div>
                <div class="rwph-notable"><span>Highest Payout</span><b>${memberMetricText(stats.highestPayout, 'payout')}</b></div>
                <div class="rwph-notable"><span>Lowest Payout</span><b>${memberMetricText(stats.lowestPayout, 'payout')}</b></div>
            </div>`;
    }

    function refreshWarReportSummary() {
        const el = document.getElementById('rwph-war-report-summary');
        if (el) el.innerHTML = warReportSummaryHtml();
    }


    // v2.3.0 same-tab Faction Vault + guided Pay-All handoff/recovery.
    // The handoff stores only the current report snapshot + selected payout row locally.
    // It never clicks Torn's final Give Money / Send / Confirm controls.
    function readJsonStorage(key, ttlField = 'expiresAt') {
        try {
            const raw = gm.get(key, '');
            if (!raw) return null;
            const parsed = JSON.parse(String(raw));
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid stored object');
            if (ttlField && Number(parsed[ttlField] || 0) <= Date.now()) {
                gm.del(key);
                return null;
            }
            return parsed;
        } catch (_) {
            gm.del(key);
            return null;
        }
    }

    function readPendingPayment() {
        const pending = readJsonStorage(KEYS.pendingPayment);
        if (!pending || pending.schemaVersion !== 1 || !pending.row || Number(pending.row.id || 0) <= 0) {
            if (pending) gm.del(KEYS.pendingPayment);
            return null;
        }
        return pending;
    }

    function readPaymentReturnSnapshot() {
        let snapshot = readJsonStorage(KEYS.paymentReturnSnapshot);
        if (!snapshot || !['basic','advanced'].includes(snapshot.mode)) {
            if (snapshot) gm.del(KEYS.paymentReturnSnapshot);
            return null;
        }
        if (Number(snapshot.schemaVersion || 0) < PAYMENT_RETURN_SCHEMA_VERSION || !Array.isArray(snapshot.rowsPacked)) {
            snapshot = migratePackedSnapshot(snapshot, 'payment-return');
            if (!snapshot) { gm.del(KEYS.paymentReturnSnapshot); return null; }
            gm.set(KEYS.paymentReturnSnapshot, JSON.stringify(snapshot));
        }
        const reportRows = unpackReportRows(snapshot.rowsPacked);
        return { ...snapshot, reportRows };
    }

    function paymentHandoffRemaining(ms) {
        const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }

    function clearPaymentHandoffStorage(removePanel = true) {
        gm.del(KEYS.pendingPayment);
        gm.del(KEYS.paymentReturnSnapshot);
        if (removePanel) closePaymentReturnPanel();
    }

    function normalizePaymentSession(session, rows = []) {
        const target = session && typeof session === 'object' ? session : {};
        if (!(target.completedKeys instanceof Set)) target.completedKeys = new Set((target.completedKeys || []).map(String));
        if (!Array.isArray(target.completionOrder)) target.completionOrder = [];
        if (!(target.skippedKeys instanceof Set)) target.skippedKeys = new Set((target.skippedKeys || []).map(String));
        if (!Array.isArray(target.skipOrder)) target.skipOrder = [];
        if (!Array.isArray(target.payAllOrder)) target.payAllOrder = [];
        if (!Array.isArray(target.payAllHistory)) target.payAllHistory = [];
        target.payAllActive = !!target.payAllActive;
        target.pendingKey = String(target.pendingKey || '');
        target.payAllCursor = Number.isInteger(Number(target.payAllCursor)) ? Number(target.payAllCursor) : -1;

        const currentKeys = rows.map(paymentRowKey);
        const currentSet = new Set(currentKeys);
        target.completedKeys = new Set([...target.completedKeys].filter(key => currentSet.has(key)));
        target.skippedKeys = new Set([...target.skippedKeys].filter(key => currentSet.has(key)));
        target.completionOrder = target.completionOrder.map(String).filter(key => currentSet.has(key));
        target.skipOrder = target.skipOrder.map(String).filter(key => currentSet.has(key));
        target.payAllHistory = target.payAllHistory.map(String).filter(key => currentSet.has(key));
        target.payAllOrder = currentKeys;
        if (target.pendingKey && !currentSet.has(target.pendingKey)) target.pendingKey = '';
        if (target.payAllCursor < 0 || target.payAllCursor >= rows.length) target.payAllCursor = -1;
        return target;
    }

    function paymentSessionToStored(session, rows = []) {
        const normalized = normalizePaymentSession(session, rows);
        return {
            completedKeys: [...normalized.completedKeys],
            completionOrder: [...normalized.completionOrder],
            skippedKeys: [...normalized.skippedKeys],
            skipOrder: [...normalized.skipOrder],
            payAllActive: !!normalized.payAllActive,
            payAllCursor: Number(normalized.payAllCursor ?? -1),
            payAllOrder: [...normalized.payAllOrder],
            pendingKey: String(normalized.pendingKey || ''),
            payAllHistory: [...normalized.payAllHistory],
        };
    }

    function paymentSessionFromStored(raw, reportKey = '', rows = []) {
        const source = raw && typeof raw === 'object' ? raw : {};
        return normalizePaymentSession({
            reportKey,
            completedKeys: new Set((source.completedKeys || []).map(String)),
            completionOrder: (source.completionOrder || []).map(String),
            skippedKeys: new Set((source.skippedKeys || []).map(String)),
            skipOrder: (source.skipOrder || []).map(String),
            payAllActive: !!source.payAllActive,
            payAllCursor: Number(source.payAllCursor ?? -1),
            payAllOrder: (source.payAllOrder || []).map(String),
            pendingKey: String(source.pendingKey || ''),
            payAllHistory: (source.payAllHistory || []).map(String),
        }, rows);
    }

    function paymentWorkflowStatus(row, session) {
        const key = paymentRowKey(row);
        if (session.completedKeys.has(key)) return 'paid';
        if (session.skippedKeys.has(key)) return 'skipped';
        if (session.pendingKey === key) return 'pending';
        return 'remaining';
    }

    function paymentQueueStats(rows, session) {
        normalizePaymentSession(session, rows);
        let paid = 0, skipped = 0, pending = 0, remaining = 0;
        let paidAmount = 0, skippedAmount = 0, pendingAmount = 0, remainingAmount = 0;
        rows.forEach(row => {
            const amount = Math.max(0, Number(row.payout || 0));
            const status = paymentWorkflowStatus(row, session);
            if (status === 'paid') { paid += 1; paidAmount += amount; }
            else if (status === 'skipped') { skipped += 1; skippedAmount += amount; remainingAmount += amount; }
            else if (status === 'pending') { pending += 1; pendingAmount += amount; remainingAmount += amount; }
            else { remaining += 1; remainingAmount += amount; }
        });
        return { paid, skipped, pending, remaining, paidAmount, skippedAmount, pendingAmount, remainingAmount };
    }

    function firstRemainingPaymentIndex(rows, session, startIndex = 0, direction = 1) {
        normalizePaymentSession(session, rows);
        if (!rows.length) return -1;
        const step = direction < 0 ? -1 : 1;
        let i = Math.max(0, Math.min(rows.length - 1, Number(startIndex || 0)));
        for (; i >= 0 && i < rows.length; i += step) {
            const status = paymentWorkflowStatus(rows[i], session);
            if (status === 'remaining' || status === 'pending') return i;
        }
        return -1;
    }

    function payAllCurrentIndex(rows, session) {
        normalizePaymentSession(session, rows);
        if (session.pendingKey) {
            const pendingIndex = rows.findIndex(row => paymentRowKey(row) === session.pendingKey);
            if (pendingIndex >= 0) {
                session.payAllCursor = pendingIndex;
                return pendingIndex;
            }
        }
        if (session.payAllCursor >= 0 && session.payAllCursor < rows.length) {
            const status = paymentWorkflowStatus(rows[session.payAllCursor], session);
            if (status === 'remaining') return session.payAllCursor;
        }
        const next = firstRemainingPaymentIndex(rows, session, 0, 1);
        session.payAllCursor = next;
        return next;
    }

    function rememberPayAllVisit(session, row) {
        const key = paymentRowKey(row);
        if (!key) return;
        if (session.payAllHistory[session.payAllHistory.length - 1] !== key) session.payAllHistory.push(key);
        if (session.payAllHistory.length > 200) session.payAllHistory.splice(0, session.payAllHistory.length - 200);
    }

    function buildPaymentReturnSnapshot(rows, session) {
        const mode = currentPayoutMode();
        const createdAt = Date.now();
        const config = mode === 'advanced' ? cloneJson(advancedConfigFromDom(), {}) : cloneJson(basicConfigFromDom(), {});
        const range = state.activeCachedReport?.range ? cloneJson(state.activeCachedReport.range, {}) : {
            startInput: String(document.querySelector('#rwph-start')?.value || gm.get(KEYS.manualStart, '')),
            endInput: String(document.querySelector('#rwph-end')?.value || gm.get(KEYS.manualEnd, '')),
        };
        return {
            schemaVersion: PAYMENT_RETURN_SCHEMA_VERSION,
            snapshotType: 'payment-return',
            appVersion: APP.version,
            mode,
            createdAt,
            expiresAt: createdAt + PAYMENT_RETURN_TTL_MS,
            faction: cloneJson(state.faction, null),
            selectedWar: cloneJson(state.selectedWar, null),
            selectedWarReport: null,
            rowsPacked: packReportRows(state.reportRows),
            includedMembers: [...state.includedMembers],
            advancedIncludedMembers: [...state.advancedIncludedMembers],
            memberAdjustments: cloneJson(state.memberAdjustments, {}),
            reportSort: cloneJson(state.reportSort, { key: 'warHits', direction: 'desc' }),
            protectedCalculation: cloneJson(state.protectedCalculation, null),
            range,
            config,
            poolSplit: cloneJson(activePoolSplit(mode), { members: 100, faction: 0 }),
            paymentSession: paymentSessionToStored(session, rows || []),
            paymentRows: cloneJson(rows || [], []),
        };
    }

    function persistPaymentReturnSnapshot(rows, session, refreshLifetime = false) {
        let snapshot = readPaymentReturnSnapshot();
        if (!snapshot && !refreshLifetime) return null;
        if (!snapshot || refreshLifetime) snapshot = buildPaymentReturnSnapshot(rows, session);
        else {
            snapshot.paymentSession = paymentSessionToStored(session, rows || []);
            snapshot.paymentRows = cloneJson(rows || [], []);
        }
        const stored = migratePackedSnapshot(snapshot, 'payment-return') || snapshot;
        gm.set(KEYS.paymentReturnSnapshot, JSON.stringify(stored));
        scheduleRecoverySnapshot('payment-progress');
        return { ...stored, reportRows: unpackReportRows(stored.rowsPacked || []) };
    }

    function savePaymentReturnSnapshotState(snapshot, rows, session, refreshLifetime = true) {
        if (!snapshot) return null;
        const now = Date.now();
        snapshot.appVersion = APP.version;
        snapshot.paymentSession = paymentSessionToStored(session, rows || []);
        snapshot.paymentRows = cloneJson(rows || [], []);
        if (refreshLifetime) snapshot.expiresAt = now + PAYMENT_RETURN_TTL_MS;
        const stored = migratePackedSnapshot(snapshot, 'payment-return') || snapshot;
        gm.set(KEYS.paymentReturnSnapshot, JSON.stringify(stored));
        scheduleRecoverySnapshot('payment-progress');
        return { ...stored, reportRows: unpackReportRows(stored.rowsPacked || []) };
    }

    function storePendingPaymentForMode(row, snapshot, flow = 'single', mode = null) {
        const createdAt = Date.now();
        const chosenMode = mode || snapshot?.mode || currentPayoutMode();
        const pending = {
            schemaVersion: 1,
            createdAt,
            expiresAt: createdAt + PENDING_PAYMENT_TTL_MS,
            returnExpiresAt: Number(snapshot?.expiresAt || (createdAt + PAYMENT_RETURN_TTL_MS)),
            mode: chosenMode === 'advanced' ? 'advanced' : 'basic',
            reportCreatedAt: Number(snapshot?.createdAt || createdAt),
            flow: flow === 'pay-all' ? 'pay-all' : 'single',
            warId: Number(snapshot?.selectedWar?.id || state.selectedWar?.id || 0),
            row: {
                id: Math.max(0, Math.trunc(Number(row?.id || 0))),
                name: String(row?.name || `Player ${row?.id || ''}`),
                payout: Math.max(0, Math.round(Number(row?.payout || 0))),
                mode: String(row?.mode || chosenMode),
            },
        };
        gm.set(KEYS.pendingPayment, JSON.stringify(pending));
        return pending;
    }

    function factionVaultPaymentUrl(row, flow = 'single') {
        const id = Math.max(0, Math.trunc(Number(row?.id || 0)));
        const amount = Math.max(0, Math.round(Number(row?.payout || 0)));
        const payAllFlag = flow === 'pay-all' ? '&rwphPayAll=1' : '';
        return `https://www.torn.com/factions.php?step=your&type=3#/tab=controls&giveMoneyTo=${encodeURIComponent(String(id))}&money=${encodeURIComponent(String(amount))}&rwphPayment=1${payAllFlag}`;
    }

    function storePendingPayment(row, snapshot, flow = 'single') {
        return storePendingPaymentForMode(row, snapshot, flow, currentPayoutMode());
    }

    function restorePaymentReturnSnapshot() {
        const snapshot = readPaymentReturnSnapshot();
        if (!snapshot) return false;
        state.liveStateBeforeCache = null;
        state.activeCachedReport = cloneJson(snapshot, null);
        state.payoutMode = snapshot.mode === 'advanced' ? 'advanced' : 'basic';
        gm.set(KEYS.payoutMode, state.payoutMode);
        state.faction = cloneJson(snapshot.faction, null);
        state.selectedWar = cloneJson(snapshot.selectedWar, null);
        state.selectedWarReport = cloneJson(snapshot.selectedWarReport, null);
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = cloneJson(snapshot.reportRows, []);
        state.includedMembers = new Set((snapshot.includedMembers || []).map(Number));
        state.advancedIncludedMembers = new Set((snapshot.advancedIncludedMembers || []).map(Number));
        state.memberAdjustments = cloneJson(snapshot.memberAdjustments, {});
        state.memberAdjustmentsExpiresAt = Number(snapshot.expiresAt || 0);
        state.reportSort = cloneJson(snapshot.reportSort, { key: 'warHits', direction: 'desc' });
        state.protectedCalculation = cloneJson(snapshot.protectedCalculation, null);
        state.reportLoading = null;
        stopReportLoadingTimer();
        const rows = paymentRows(state.payoutMode);
        const reportKey = currentPaymentReportKey(rows);
        const paymentSession = paymentSessionFromStored(snapshot.paymentSession || {}, reportKey, rows);
        state.paymentSessions = new Map([[reportKey, paymentSession]]);
        return true;
    }

    function closePaymentReturnPanel() {
        const panel = document.querySelector('#rwph-payment-return-panel');
        if (!panel) return;
        if (panel._rwphTimer) clearInterval(panel._rwphTimer);
        panel.remove();
    }

    function nextPayAllIndex(rows, session, currentIndex) {
        let next = firstRemainingPaymentIndex(rows, session, Math.max(0, currentIndex + 1), 1);
        if (next < 0 && currentIndex > 0) next = firstRemainingPaymentIndex(rows, session, 0, 1);
        return next;
    }

    function launchPayAllRowFromSnapshot(snapshot, rows, session, index) {
        const row = rows[index];
        if (!row) return false;
        session.payAllActive = true;
        session.payAllCursor = index;
        session.pendingKey = paymentRowKey(row);
        rememberPayAllVisit(session, row);
        savePaymentReturnSnapshotState(snapshot, rows, session, true);
        storePendingPaymentForMode(row, snapshot, 'pay-all', snapshot.mode);
        window.location.assign(factionVaultPaymentUrl(row, 'pay-all'));
        return true;
    }

    function advancePayAllFromReturn(action) {
        const snapshot = readPaymentReturnSnapshot();
        if (!snapshot || !Array.isArray(snapshot.paymentRows)) return false;
        const rows = snapshot.paymentRows.map(row => ({ ...row, mode: row.mode || snapshot.mode }));
        const session = paymentSessionFromStored(snapshot.paymentSession || {}, 'return', rows);
        if (!session.payAllActive) return false;
        const pending = readPendingPayment();
        let currentIndex = -1;
        const pendingKey = pending?.flow === 'pay-all' ? paymentRowKey({ ...pending.row, mode: pending.mode || snapshot.mode }) : session.pendingKey;
        if (pendingKey) currentIndex = rows.findIndex(row => paymentRowKey(row) === pendingKey);
        if (currentIndex < 0) currentIndex = payAllCurrentIndex(rows, session);
        if (currentIndex < 0) return false;
        const currentRow = rows[currentIndex];
        const currentKey = paymentRowKey(currentRow);

        if (action === 'previous') {
            if (session.payAllHistory[session.payAllHistory.length - 1] === currentKey) session.payAllHistory.pop();
            let previousKey = session.payAllHistory[session.payAllHistory.length - 1] || '';
            let previousIndex = previousKey ? rows.findIndex(row => paymentRowKey(row) === previousKey) : -1;
            if (previousIndex < 0 && currentIndex > 0) previousIndex = currentIndex - 1;
            if (previousIndex < 0) return false;
            return launchPayAllRowFromSnapshot(snapshot, rows, session, previousIndex);
        }

        if (action === 'paid') {
            if (!session.completedKeys.has(currentKey)) session.completionOrder.push(currentKey);
            session.completedKeys.add(currentKey);
            session.skippedKeys.delete(currentKey);
            session.skipOrder = session.skipOrder.filter(key => key !== currentKey);
        } else if (action === 'skip') {
            if (!session.skippedKeys.has(currentKey)) session.skipOrder.push(currentKey);
            session.skippedKeys.add(currentKey);
            session.completedKeys.delete(currentKey);
            session.completionOrder = session.completionOrder.filter(key => key !== currentKey);
        } else {
            return false;
        }

        session.pendingKey = '';
        gm.del(KEYS.pendingPayment);
        const nextIndex = nextPayAllIndex(rows, session, currentIndex);
        if (nextIndex >= 0) return launchPayAllRowFromSnapshot(snapshot, rows, session, nextIndex);

        session.payAllActive = false;
        session.payAllCursor = -1;
        savePaymentReturnSnapshotState(snapshot, rows, session, true);
        ensurePaymentReturnPanel();
        return true;
    }

    function stopPayAllFromReturn() {
        const snapshot = readPaymentReturnSnapshot();
        if (!snapshot || !Array.isArray(snapshot.paymentRows)) return false;
        const rows = snapshot.paymentRows.map(row => ({ ...row, mode: row.mode || snapshot.mode }));
        const session = paymentSessionFromStored(snapshot.paymentSession || {}, 'return', rows);
        session.payAllActive = false;
        session.pendingKey = '';
        session.payAllCursor = -1;
        gm.del(KEYS.pendingPayment);
        savePaymentReturnSnapshotState(snapshot, rows, session, true);
        ensurePaymentReturnPanel();
        return true;
    }

    function paymentReturnPanelHtml(snapshot, pending) {
        const reportMs = snapshot ? Math.max(0, Number(snapshot.expiresAt || 0) - Date.now()) : 0;
        const pendingMs = pending ? Math.max(0, Number(pending.expiresAt || 0) - Date.now()) : 0;
        const pendingHtml = pending ? `<div class="rwph-payment-return-pending"><b>${escapeHtml(pending.row.name)} [${escapeHtml(pending.row.id)}]</b><br>${formatMoney(pending.row.payout)} · ${pending.flow === 'pay-all' ? 'Pay-All pending' : 'pending details'} <span data-payment-pending-time>${paymentHandoffRemaining(pendingMs)}</span></div>` : '<div class="rwph-payment-return-pending">Pending member/amount details have expired or were cleared. The report return snapshot may still be available.</div>';

        let payAllHtml = '';
        if (snapshot && Array.isArray(snapshot.paymentRows)) {
            const rows = snapshot.paymentRows.map(row => ({ ...row, mode: row.mode || snapshot.mode }));
            const session = paymentSessionFromStored(snapshot.paymentSession || {}, 'return', rows);
            const stats = paymentQueueStats(rows, session);
            if (session.payAllActive) {
                const currentIndex = payAllCurrentIndex(rows, session);
                const current = currentIndex >= 0 ? rows[currentIndex] : null;
                payAllHtml = `<div class="rwph-payment-return-payall">
                    <b>Pay-All Active</b><br>
                    Paid ${stats.paid} · Pending ${stats.pending} · Skipped ${stats.skipped} · Remaining ${stats.remaining}<br>
                    Remaining amount: <b>${formatMoney(stats.remainingAmount)}</b>${current ? `<br>Current: <b>${escapeHtml(current.name)} [${escapeHtml(current.id)}]</b> · ${formatMoney(current.payout)}` : ''}
                    <div class="rwph-payment-return-actions">
                        <button class="rwph-btn primary" type="button" data-payall-return-paid ${current ? '' : 'disabled'}>Mark Complete & Next</button>
                        <button class="rwph-btn" type="button" data-payall-return-skip ${current ? '' : 'disabled'}>Skip & Next</button>
                        <button class="rwph-btn" type="button" data-payall-return-previous ${session.payAllHistory.length > 1 || currentIndex > 0 ? '' : 'disabled'}>Previous Member</button>
                        <button class="rwph-btn danger" type="button" data-payall-return-stop>Stop Pay-All</button>
                    </div>
                    <div style="margin-top:6px;color:#aeb7c0;">Use Mark Complete only after you have manually confirmed the Torn payment. RWPH never sends it for you.</div>
                </div>`;
            } else if (stats.paid || stats.skipped) {
                payAllHtml = `<div class="rwph-payment-return-payall"><b>Pay-All Summary</b><br>Paid ${stats.paid} · Skipped ${stats.skipped} · Remaining ${stats.remaining + stats.pending}<br>Remaining amount: <b>${formatMoney(stats.remainingAmount)}</b></div>`;
            }
        }

        return `<div class="rwph-payment-return-head"><b>RWPH Faction Vault Helper</b><button class="rwph-close" type="button" data-payment-return-close title="Close">×</button></div>
            <div class="rwph-payment-return-body">
                ${pendingHtml}
                ${payAllHtml}
                <div>Recent report available for <b data-payment-return-time>${paymentHandoffRemaining(reportMs)}</b>. Torn's final payment remains manual.</div>
                <div class="rwph-payment-return-actions">
                    <button class="rwph-btn primary" type="button" data-payment-return-report ${snapshot ? '' : 'disabled'}>Reopen RWPH Report</button>
                    <button class="rwph-btn" type="button" data-payment-return-payments ${snapshot ? '' : 'disabled'}>Reopen Payment Panel</button>
                    <button class="rwph-btn danger" type="button" data-payment-return-clear>Clear Pending</button>
                </div>
            </div>`;
    }

    function ensurePaymentReturnPanel() {
        const snapshot = readPaymentReturnSnapshot();
        const pending = readPendingPayment();
        if (!snapshot && !pending) {
            closePaymentReturnPanel();
            return;
        }
        let panel = document.querySelector('#rwph-payment-return-panel');
        if (!panel) {
            panel = document.createElement('aside');
            panel.id = 'rwph-payment-return-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', 'RWPH Faction Vault return helper');
            document.body.appendChild(panel);
            panel.addEventListener('click', event => {
                if (event.target.closest?.('[data-payall-return-paid]')) {
                    advancePayAllFromReturn('paid');
                    return;
                }
                if (event.target.closest?.('[data-payall-return-skip]')) {
                    advancePayAllFromReturn('skip');
                    return;
                }
                if (event.target.closest?.('[data-payall-return-previous]')) {
                    advancePayAllFromReturn('previous');
                    return;
                }
                if (event.target.closest?.('[data-payall-return-stop]')) {
                    stopPayAllFromReturn();
                    return;
                }
                if (event.target.closest?.('[data-payment-return-close]')) {
                    closePaymentReturnPanel();
                    return;
                }
                if (event.target.closest?.('[data-payment-return-clear]')) {
                    const currentSnapshot = readPaymentReturnSnapshot();
                    if (currentSnapshot?.paymentSession?.payAllActive) stopPayAllFromReturn();
                    else {
                        gm.del(KEYS.pendingPayment);
                        ensurePaymentReturnPanel();
                    }
                    return;
                }
                if (event.target.closest?.('[data-payment-return-report]')) {
                    if (!restorePaymentReturnSnapshot()) {
                        ensurePaymentReturnPanel();
                        return;
                    }
                    closePaymentsPanel();
                    state.tab = 'war';
                    if (!document.querySelector('#rwph-overlay')) openPanel();
                    else renderTab('war');
                    return;
                }
                if (event.target.closest?.('[data-payment-return-payments]')) {
                    if (!restorePaymentReturnSnapshot()) {
                        ensurePaymentReturnPanel();
                        return;
                    }
                    openPaymentsPanel();
                }
            });
        }
        panel.innerHTML = paymentReturnPanelHtml(snapshot, pending);
        if (panel._rwphTimer) clearInterval(panel._rwphTimer);
        panel._rwphTimer = setInterval(() => {
            const currentSnapshot = readPaymentReturnSnapshot();
            const currentPending = readPendingPayment();
            if (!currentSnapshot && !currentPending) {
                closePaymentReturnPanel();
                return;
            }
            const returnEl = panel.querySelector('[data-payment-return-time]');
            if (returnEl) returnEl.textContent = currentSnapshot ? paymentHandoffRemaining(Number(currentSnapshot.expiresAt || 0) - Date.now()) : 'expired';
            const pendingEl = panel.querySelector('[data-payment-pending-time]');
            if (pendingEl) pendingEl.textContent = currentPending ? paymentHandoffRemaining(Number(currentPending.expiresAt || 0) - Date.now()) : 'expired';
            const reportBtn = panel.querySelector('[data-payment-return-report]');
            const paymentsBtn = panel.querySelector('[data-payment-return-payments]');
            if (reportBtn) reportBtn.disabled = !currentSnapshot;
            if (paymentsBtn) paymentsBtn.disabled = !currentSnapshot;
        }, 1000);
    }

    function tryPendingPaymentPrefill() {
        if (!/rwphPayment=1/i.test(String(location.href || ''))) return;
        const pending = readPendingPayment();
        if (!pending) return;
        let attempts = 0;
        const currentValue = el => {
            if (!el) return '';
            if (el.getAttribute?.('contenteditable') === 'true' || el.getAttribute?.('role') === 'textbox') return String(el.textContent || '').trim();
            return String(el.value || '').trim();
        };
        const tryFill = () => {
            attempts += 1;
            const memberField = findPaymentMemberField();
            const amountField = findPaymentAmountField();
            const memberValue = `${pending.row.name} [${pending.row.id}]`;
            if (memberField && !currentValue(memberField)) setPaymentFieldValue(memberField, memberValue);
            if (amountField && !currentValue(amountField)) setPaymentFieldValue(amountField, String(pending.row.payout));
            if (attempts < 4 && (!memberField || !amountField)) setTimeout(tryFill, 900);
        };
        setTimeout(tryFill, 900);
    }

    function openFactionVaultForPayment(row, rows, session, index, flow = 'single') {
        if (!row || Number(row.id || 0) <= 0 || Number(row.payout || 0) <= 0) {
            setPaymentRowStatus(index, 'Cannot open Faction Vault: this payment row is invalid.', 'bad');
            return false;
        }
        normalizePaymentSession(session, rows);
        if (flow === 'pay-all') {
            session.payAllActive = true;
            session.payAllCursor = index;
            session.pendingKey = paymentRowKey(row);
            rememberPayAllVisit(session, row);
        } else if (session.payAllActive) {
            session.payAllActive = false;
            session.payAllCursor = -1;
            session.pendingKey = '';
        }
        const snapshot = persistPaymentReturnSnapshot(rows, session, true);
        storePendingPayment(row, snapshot, flow);
        const url = factionVaultPaymentUrl(row, flow);
        setPaymentRowStatus(index, flow === 'pay-all' ? 'Pay-All: opening this member in Torn faction controls. Manually confirm the payment, then use Mark Complete & Next.' : 'Opening Torn faction controls in this tab with the member and amount prefilled. Final payment remains manual.', 'good');
        window.location.assign(url);
        return true;
    }

    // v2.3.0 Payments Copy Panel + Pay-All workflow safety layer.
    // Payment tools remain manual and are locked until the warning is accepted each time the panel opens.
    function paymentRows(mode = currentPayoutMode()) {
        return reportViewRows(mode)
            .filter(view => view.included && !view.excluded && Number(view.payout || 0) > 0)
            .map(view => ({
                id: Number(view.row?.id || 0),
                name: String(view.row?.name || `Player ${view.row?.id || ''}`),
                payout: Math.max(0, Math.round(Number(view.payout || 0))),
                mode,
            }));
    }

    function paymentRowKey(row) {
        return `${String(row?.mode || currentPayoutMode())}:${String(row?.id || 0)}`;
    }

    function currentPaymentReportKey(rows = []) {
        const mode = currentPayoutMode();
        const rowSignature = (rows || []).map(row => `${paymentRowKey(row)}:${Math.round(Number(row?.payout || 0))}`).join('|');
        if (state.activeCachedReport) {
            return `cache:${mode}:${String(state.activeCachedReport.createdAt || 0)}:${String(state.activeCachedReport.warId || state.selectedWar?.id || '')}:${rowSignature}`;
        }
        return `live:${mode}:${String(state.selectedWar?.id || '')}:${rowSignature}`;
    }

    function paymentSessionForCurrentReport(rows = []) {
        const reportKey = currentPaymentReportKey(rows);
        if (!(state.paymentSessions instanceof Map)) state.paymentSessions = new Map();
        let session = state.paymentSessions.get(reportKey);
        if (!session) {
            session = paymentSessionFromStored({}, reportKey, rows);
            state.paymentSessions.set(reportKey, session);
        }
        session.reportKey = reportKey;
        return normalizePaymentSession(session, rows);
    }

    function paymentPanelRowsHtml(rows, session) {
        if (!rows.length) return '<div class="rwph-note">No payable members are currently selected in this report.</div>';
        const currentIndex = session.payAllActive ? payAllCurrentIndex(rows, session) : -1;
        return rows.map((row, index) => {
            const key = paymentRowKey(row);
            const status = paymentWorkflowStatus(row, session);
            const complete = status === 'paid';
            const skipped = status === 'skipped';
            const pending = status === 'pending';
            const current = session.payAllActive && index === currentIndex;
            const badge = status === 'remaining' ? 'Remaining' : (status === 'paid' ? 'Paid' : (status === 'skipped' ? 'Skipped' : 'Pending'));
            return `
            <div class="rwph-payment-row${complete ? ' rwph-payment-complete' : ''}${skipped ? ' rwph-payment-skipped' : ''}${pending ? ' rwph-payment-pending' : ''}${current ? ' rwph-payment-current' : ''}" data-rwph-payment-row="${index}" data-payment-key="${escapeHtml(key)}">
                <div class="rwph-payment-member">
                    <div><b>${escapeHtml(row.name)}</b> <span class="rwph-muted">[${escapeHtml(row.id)}]</span><span class="rwph-payment-workflow-badge ${escapeHtml(status)}" data-payment-row-badge="${index}">${badge}</span></div>
                    <div class="rwph-payment-amount">${formatMoney(row.payout)}</div>
                </div>
                <div class="rwph-payment-actions">
                    <button class="rwph-btn" type="button" data-payment-copy="name" data-payment-index="${index}">Copy Name</button>
                    <button class="rwph-btn" type="button" data-payment-copy="id" data-payment-index="${index}">Copy ID</button>
                    <button class="rwph-btn primary" type="button" data-payment-copy="member" data-payment-index="${index}">Name + ID</button>
                    <button class="rwph-btn primary" type="button" data-payment-copy="amount" data-payment-index="${index}">Amount</button>
                    <button class="rwph-btn rwph-payment-vault-btn" type="button" data-payment-open-vault="${index}">Open Faction Vault</button>
                    <button class="rwph-btn rwph-payment-complete-btn" type="button" data-payment-complete="${index}">Mark Complete</button>
                    <button class="rwph-btn" type="button" data-payment-skip="${index}">${skipped ? 'Restore Skipped' : 'Skip'}</button>
                </div>
                <div class="rwph-payment-status ${pending ? 'warn' : ''}" data-payment-status="${index}">${pending ? 'Pending — this is the active Pay-All member. Complete the Torn payment manually, then mark it complete.' : (skipped ? 'Skipped — this member is out of the active Pay-All queue until restored.' : 'Ready — manually verify this member and amount before sending.')}</div>
            </div>`;
        }).join('');
    }

    function closePaymentsPanel() {
        document.querySelector('#rwph-payments-panel')?.remove();
    }

    function paymentElementVisible(el) {
        if (!el || !el.isConnected) return false;
        const style = window.getComputedStyle?.(el);
        if (style && (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0)) return false;
        const rect = el.getBoundingClientRect?.();
        return !rect || (rect.width > 0 && rect.height > 0);
    }

    function paymentFieldMeta(el) {
        if (!el) return '';
        const attrs = ['id','class','name','placeholder','aria-label','title','data-name','data-id','type','role','inputmode'];
        const attrText = attrs.map(name => String(el.getAttribute?.(name) || '')).join(' ');
        const wrap = String(el.closest?.('label,div,li,tr,td,section,form')?.textContent || '');
        return `${attrText} ${wrap}`.replace(/\s+/g, ' ').toLowerCase();
    }

    function paymentEditableFields() {
        return [...document.querySelectorAll("input, textarea, [contenteditable='true'], [role='textbox'], [role='spinbutton']")]
            .filter(paymentElementVisible)
            .filter(el => !el.disabled && !el.readOnly && el.getAttribute?.('aria-disabled') !== 'true')
            .filter(el => !el.closest?.('#rwph-overlay, #rwph-payments-panel'))
            .filter(el => {
                const type = String(el.type || '').toLowerCase();
                return !['hidden','button','submit','reset','checkbox','radio','file','image','password'].includes(type);
            });
    }

    function findPaymentMemberField() {
        const fields = paymentEditableFields();
        const scored = fields.map(el => {
            const meta = paymentFieldMeta(el);
            let score = 0;
            if (/\b(user|player|member|recipient|name|torn)\b/.test(meta)) score += 10;
            if (/\b(to|add|target|search)\b/.test(meta)) score += 2;
            if (['text','search',''].includes(String(el.type || '').toLowerCase())) score += 2;
            if (/\b(amount|money|cash|balance|dollar|qty|quantity|message|comment|reason|note)\b/.test(meta)) score -= 15;
            return { el, score };
        }).filter(item => item.score > 0).sort((a,b) => b.score - a.score);
        return scored[0]?.el || null;
    }

    function findPaymentAmountField() {
        const fields = paymentEditableFields();
        const scored = fields.map(el => {
            const meta = paymentFieldMeta(el);
            const type = String(el.type || '').toLowerCase();
            const inputMode = String(el.getAttribute?.('inputmode') || '').toLowerCase();
            let score = 0;
            if (/\b(amount|money|cash|dollar|payout|value|funds)\b/.test(meta)) score += 16;
            if (/\b(add\s*money|add\s*to\s*balance|give|transfer|deposit)\b/.test(meta)) score += 8;
            if (['number','tel'].includes(type)) score += 8;
            if (/\b(numeric|decimal)\b/.test(inputMode)) score += 7;
            if (el.getAttribute?.('role') === 'spinbutton') score += 5;
            if (/\b(user|player|member|recipient|username|profile|name|message|comment|reason|note|search|filter)\b/.test(meta)) score -= 25;
            return { el, score };
        }).filter(item => item.score > 0).sort((a,b) => b.score - a.score);
        return scored[0]?.el || null;
    }

    function setPaymentFieldValue(el, value) {
        if (!el) return false;
        const text = String(value ?? '');
        try {
            const isNativeInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
            if (!isNativeInput && (el.getAttribute?.('contenteditable') === 'true' || el.getAttribute?.('role') === 'textbox')) {
                el.textContent = text;
            } else {
                const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, 'value');
                if (desc?.set) desc.set.call(el, text);
                else el.value = text;
            }
            try { el.setAttribute?.('value', text); } catch (_) {}
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
            return true;
        } catch (_) {
            return false;
        }
    }

    async function copyPaymentText(value) {
        const text = String(value ?? '');
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (_) { /* use fallback */ }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            const ok = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
            ta.remove();
            return !!ok;
        } catch (_) {
            return false;
        }
    }

    function setPaymentRowStatus(index, message, type = '') {
        const el = document.querySelector(`[data-payment-status="${index}"]`);
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('good', type === 'good');
        el.classList.toggle('warn', type === 'warn');
        el.classList.toggle('bad', type === 'bad');
    }

    async function handlePaymentCopyAction(kind, row, index) {
        if (!row) return { copied: false, filled: false };
        let value = '';
        let filled = false;
        if (kind === 'name') value = row.name;
        else if (kind === 'id') value = String(row.id);
        else if (kind === 'member') {
            value = `${row.name} [${row.id}]`;
            filled = setPaymentFieldValue(findPaymentMemberField(), value);
        } else if (kind === 'amount') {
            value = String(Math.round(Number(row.payout || 0)));
            filled = setPaymentFieldValue(findPaymentAmountField(), value);
        } else return { copied: false, filled: false };

        const copied = await copyPaymentText(value);
        if (kind === 'member' || kind === 'amount') {
            if (copied && filled) setPaymentRowStatus(index, `${kind === 'member' ? 'Name + ID' : 'Amount'} copied and prefilled into the visible Torn field. Review it before sending.`, 'good');
            else if (copied) setPaymentRowStatus(index, `${kind === 'member' ? 'Name + ID' : 'Amount'} copied. No suitable visible Torn payment field was found, so paste it manually.`, 'warn');
            else if (filled) setPaymentRowStatus(index, `${kind === 'member' ? 'Member' : 'Amount'} prefilled, but clipboard copy was unavailable. Review the Torn field before sending.`, 'warn');
            else setPaymentRowStatus(index, `Could not copy or prefill the ${kind === 'member' ? 'member' : 'amount'}.`, 'bad');
            if (copied) showNotification('Payment Copied', `${kind === 'member' ? 'Name + ID' : 'Amount'} copied${filled ? ' and prefilled' : ''}.`, 'good');
            else showNotification('Clipboard Error', 'RWPH could not copy this payment value.', 'bad');
            return { copied, filled, value };
        }
        setPaymentRowStatus(index, copied ? `${kind === 'name' ? 'Member name' : 'Torn ID'} copied to clipboard.` : `Clipboard copy was unavailable.`, copied ? 'good' : 'bad');
        if (copied) showNotification('Payment Copied', `${kind === 'name' ? 'Member name' : 'Torn ID'} copied to clipboard.`, 'good');
        else showNotification('Clipboard Error', 'Clipboard copy was unavailable.', 'bad');
        return { copied, filled, value };
    }

    function updatePaymentProgress(panel, rows, session) {
        if (!panel || !session) return;
        normalizePaymentSession(session, rows);
        const stats = paymentQueueStats(rows, session);
        const set = (sel, value) => { const el = panel.querySelector(sel); if (el) el.textContent = value; };
        set('[data-payment-progress="paid"]', formatNumber(stats.paid));
        set('[data-payment-progress="pending"]', formatNumber(stats.pending));
        set('[data-payment-progress="skipped"]', formatNumber(stats.skipped));
        set('[data-payment-progress="amount"]', formatMoney(stats.remainingAmount));
        set('[data-payment-completed-amount]', formatMoney(stats.paidAmount));
        set('[data-payment-remaining-count]', formatNumber(stats.remaining));
        const lastBtn = panel.querySelector('[data-payment-restore-last]');
        const allBtn = panel.querySelector('[data-payment-restore-all]');
        const skippedBtn = panel.querySelector('[data-payment-restore-skipped]');
        if (lastBtn) lastBtn.disabled = !session.completionOrder.length;
        if (allBtn) allBtn.disabled = stats.paid === 0;
        if (skippedBtn) skippedBtn.disabled = stats.skipped === 0;

        const currentIndex = session.payAllActive ? payAllCurrentIndex(rows, session) : -1;
        const current = currentIndex >= 0 ? rows[currentIndex] : null;
        const currentEl = panel.querySelector('[data-payment-payall-current]');
        if (currentEl) currentEl.innerHTML = current
            ? `<b>${escapeHtml(current.name)} [${escapeHtml(current.id)}]</b> · ${formatMoney(current.payout)} · ${escapeHtml(paymentWorkflowStatus(current, session))}`
            : (session.payAllActive ? '<b>Queue complete.</b> No unprocessed members remain.' : 'Pay-All is not running.');
        const startBtn = panel.querySelector('[data-payment-payall-start]');
        if (startBtn) {
            startBtn.disabled = !rows.length || currentIndex < 0;
            startBtn.textContent = session.payAllActive ? 'Continue Pay-All' : 'Start Pay-All';
        }
        const previousBtn = panel.querySelector('[data-payment-payall-previous]');
        if (previousBtn) previousBtn.disabled = !session.payAllActive || !(session.payAllHistory.length > 1 || currentIndex > 0);
        const stopBtn = panel.querySelector('[data-payment-payall-stop]');
        if (stopBtn) stopBtn.disabled = !session.payAllActive;
    }

    function refreshPaymentRows(panel, rows, session) {
        if (!panel) return;
        normalizePaymentSession(session, rows);
        const list = panel.querySelector('.rwph-payment-list');
        if (list) list.innerHTML = paymentPanelRowsHtml(rows, session);
        updatePaymentProgress(panel, rows, session);
    }

    function setPaymentCompleted(panel, rows, session, index) {
        const row = rows[index];
        if (!row) return false;
        const key = paymentRowKey(row);
        if (!session.completedKeys.has(key)) session.completionOrder.push(key);
        session.completedKeys.add(key);
        session.skippedKeys.delete(key);
        session.skipOrder = session.skipOrder.filter(item => item !== key);
        if (session.pendingKey === key) session.pendingKey = '';
        const pending = readPendingPayment();
        if (pending && String(pending.row?.id || '') === String(row.id || '')) gm.del(KEYS.pendingPayment);
        if (session.payAllActive && session.payAllCursor === index) {
            const next = nextPayAllIndex(rows, session, index);
            session.payAllCursor = next;
            if (next < 0) session.payAllActive = false;
        }
        persistPaymentReturnSnapshot(rows, session, false);
        refreshPaymentRows(panel, rows, session);
        ensurePaymentReturnPanel();
        return true;
    }

    function togglePaymentSkipped(panel, rows, session, index) {
        const row = rows[index];
        if (!row) return false;
        const key = paymentRowKey(row);
        if (session.skippedKeys.has(key)) {
            session.skippedKeys.delete(key);
            session.skipOrder = session.skipOrder.filter(item => item !== key);
        } else {
            session.skippedKeys.add(key);
            session.skipOrder.push(key);
            session.completedKeys.delete(key);
            session.completionOrder = session.completionOrder.filter(item => item !== key);
            if (session.pendingKey === key) session.pendingKey = '';
            if (session.payAllActive && session.payAllCursor === index) {
                const next = nextPayAllIndex(rows, session, index);
                session.payAllCursor = next;
                if (next < 0) session.payAllActive = false;
            }
        }
        persistPaymentReturnSnapshot(rows, session, false);
        refreshPaymentRows(panel, rows, session);
        ensurePaymentReturnPanel();
        return true;
    }

    function restoreLastPaymentCompleted(panel, rows, session) {
        while (session.completionOrder.length) {
            const key = session.completionOrder.pop();
            if (!session.completedKeys.has(key)) continue;
            session.completedKeys.delete(key);
            persistPaymentReturnSnapshot(rows, session, false);
            refreshPaymentRows(panel, rows, session);
            ensurePaymentReturnPanel();
            return true;
        }
        refreshPaymentRows(panel, rows, session);
        return false;
    }

    function restoreAllPaymentCompleted(panel, rows, session) {
        session.completedKeys.clear();
        session.completionOrder = [];
        persistPaymentReturnSnapshot(rows, session, false);
        refreshPaymentRows(panel, rows, session);
        ensurePaymentReturnPanel();
    }

    function restoreAllPaymentSkipped(panel, rows, session) {
        session.skippedKeys.clear();
        session.skipOrder = [];
        persistPaymentReturnSnapshot(rows, session, false);
        refreshPaymentRows(panel, rows, session);
        ensurePaymentReturnPanel();
    }

    function startOrContinuePayAll(panel, rows, session) {
        if (!rows.length) return false;
        session.payAllActive = true;
        let index = payAllCurrentIndex(rows, session);
        if (index < 0) {
            session.payAllActive = false;
            refreshPaymentRows(panel, rows, session);
            return false;
        }
        refreshPaymentRows(panel, rows, session);
        return openFactionVaultForPayment(rows[index], rows, session, index, 'pay-all');
    }

    function previousPayAllMember(panel, rows, session) {
        if (!session.payAllActive || !rows.length) return false;
        let currentIndex = payAllCurrentIndex(rows, session);
        let previousKey = '';
        const currentKey = currentIndex >= 0 ? paymentRowKey(rows[currentIndex]) : '';
        if (session.payAllHistory[session.payAllHistory.length - 1] === currentKey) session.payAllHistory.pop();
        previousKey = session.payAllHistory[session.payAllHistory.length - 1] || '';
        let index = previousKey ? rows.findIndex(row => paymentRowKey(row) === previousKey) : -1;
        if (index < 0 && currentIndex > 0) index = currentIndex - 1;
        if (index < 0) return false;
        return openFactionVaultForPayment(rows[index], rows, session, index, 'pay-all');
    }

    function stopPayAll(panel, rows, session) {
        session.payAllActive = false;
        session.pendingKey = '';
        session.payAllCursor = -1;
        const pending = readPendingPayment();
        if (pending?.flow === 'pay-all') gm.del(KEYS.pendingPayment);
        persistPaymentReturnSnapshot(rows, session, false);
        refreshPaymentRows(panel, rows, session);
        ensurePaymentReturnPanel();
    }

    function openPaymentsPanel() {
        if (!licenceIsActive()) restoreCachedLicenceSession();
        if (!licenceIsActive()) {
            closePaymentsPanel();
            state.tab = 'war';
            if (!document.querySelector('#rwph-overlay')) openPanel();
            else renderTab('war');
            return;
        }
        closePaymentsPanel();
        const rows = paymentRows();
        const total = rows.reduce((sum, row) => sum + Number(row.payout || 0), 0);
        const session = paymentSessionForCurrentReport(rows);
        const prepared = new Map();
        let warningAccepted = false;
        const panel = document.createElement('aside');
        panel.id = 'rwph-payments-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'RWPH Payments Copy Panel');
        panel.innerHTML = `
            <div class="rwph-payments-head">
                <div class="rwph-payments-brand">
                    <span class="rwph-panel-logo" aria-hidden="true">RW</span>
                    <div>
                        <div class="rwph-payments-title">Payments Copy Panel</div>
                        <div class="rwph-payments-subtitle">${escapeHtml(reportCacheLabel(currentPayoutMode()))} report · ${formatNumber(rows.length)} payable members · ${formatMoney(total)}</div>
                    </div>
                </div>
                <button class="rwph-close" type="button" data-payment-close="1" title="Close Payments Copy Panel">×</button>
            </div>
            <div class="rwph-payments-body">
                <section class="rwph-payment-warning" data-payment-warning>
                    <h3>Payment Safety Warning</h3>
                    <div>Accept this warning before any copy or prefill tools are unlocked.</div>
                    <ul>
                        <li>RWPH does not control or transfer faction money.</li>
                        <li>You must verify the recipient before every payment.</li>
                        <li>You must verify the payment amount before every payment.</li>
                        <li>Torn's final payment confirmation remains completely manual.</li>
                        <li><b>Mark Complete</b> is only your checklist marker; it does not prove Torn sent the payment.</li>
                    </ul>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" type="button" data-payment-accept-warning>Accept Warning</button>
                    </div>
                </section>
                <section class="rwph-payment-tools" data-payment-tools hidden>
                    <div class="rwph-note"><b>Manual payment helper unlocked.</b> Use individual controls or the guided <b>Pay-All</b> queue. Pay-All prepares one member at a time, returns you to this workflow after each same-tab vault handoff, and never clicks Give Money, Send, or Confirm.</div>
                    <div class="rwph-payment-progress">
                        <div><b data-payment-progress="paid">0</b><span>Paid</span></div>
                        <div><b data-payment-progress="pending">0</b><span>Pending</span></div>
                        <div><b data-payment-progress="skipped">0</b><span>Skipped</span></div>
                        <div><b data-payment-progress="amount">$0</b><span>Remaining Amount</span></div>
                    </div>
                    <div class="rwph-note">Paid amount: <b data-payment-completed-amount>$0</b> · untouched remaining members: <b data-payment-remaining-count>0</b>. Skipped members remain unpaid and are included in Remaining Amount until restored/paid.</div>
                    <div class="rwph-payall-box">
                        <b>Guided Pay-All Queue</b>
                        <div class="rwph-payall-current" data-payment-payall-current>Pay-All is not running.</div>
                        <div class="rwph-payall-actions">
                            <button class="rwph-btn primary" type="button" data-payment-payall-start>Start Pay-All</button>
                            <button class="rwph-btn" type="button" data-payment-payall-previous disabled>Previous Member</button>
                            <button class="rwph-btn danger" type="button" data-payment-payall-stop disabled>Stop Pay-All</button>
                        </div>
                    </div>
                    <div class="rwph-payment-restore-row">
                        <button class="rwph-btn" type="button" data-payment-restore-last disabled>Restore Last Paid</button>
                        <button class="rwph-btn" type="button" data-payment-restore-all disabled>Restore All Paid</button>
                        <button class="rwph-btn" type="button" data-payment-restore-skipped disabled>Restore All Skipped</button>
                    </div>
                    <div class="rwph-payment-list">${paymentPanelRowsHtml(rows, session)}</div>
                </section>
            </div>`;
        document.body.appendChild(panel);
        updatePaymentProgress(panel, rows, session);

        panel.addEventListener('click', async event => {
            const closeBtn = event.target.closest?.('[data-payment-close]');
            if (closeBtn) {
                closePaymentsPanel();
                return;
            }

            const acceptBtn = event.target.closest?.('[data-payment-accept-warning]');
            if (acceptBtn) {
                warningAccepted = true;
                panel.querySelector('[data-payment-warning]')?.setAttribute('hidden', '');
                const tools = panel.querySelector('[data-payment-tools]');
                if (tools) tools.hidden = false;
                updatePaymentProgress(panel, rows, session);
                return;
            }

            if (!warningAccepted) return;

            const restoreLast = event.target.closest?.('[data-payment-restore-last]');
            if (restoreLast) {
                restoreLastPaymentCompleted(panel, rows, session);
                return;
            }
            const restoreAll = event.target.closest?.('[data-payment-restore-all]');
            if (restoreAll) {
                restoreAllPaymentCompleted(panel, rows, session);
                return;
            }
            const restoreSkipped = event.target.closest?.('[data-payment-restore-skipped]');
            if (restoreSkipped) {
                restoreAllPaymentSkipped(panel, rows, session);
                return;
            }
            if (event.target.closest?.('[data-payment-payall-start]')) {
                startOrContinuePayAll(panel, rows, session);
                return;
            }
            if (event.target.closest?.('[data-payment-payall-previous]')) {
                previousPayAllMember(panel, rows, session);
                return;
            }
            if (event.target.closest?.('[data-payment-payall-stop]')) {
                stopPayAll(panel, rows, session);
                return;
            }

            const vaultBtn = event.target.closest?.('[data-payment-open-vault]');
            if (vaultBtn) {
                const index = Number(vaultBtn.dataset.paymentOpenVault);
                openFactionVaultForPayment(rows[index], rows, session, index);
                return;
            }

            const skipBtn = event.target.closest?.('[data-payment-skip]');
            if (skipBtn) {
                const index = Number(skipBtn.dataset.paymentSkip);
                togglePaymentSkipped(panel, rows, session, index);
                return;
            }

            const completeBtn = event.target.closest?.('[data-payment-complete]');
            if (completeBtn) {
                const index = Number(completeBtn.dataset.paymentComplete);
                setPaymentCompleted(panel, rows, session, index);
                return;
            }

            const copyBtn = event.target.closest?.('[data-payment-copy]');
            if (copyBtn) {
                const index = Number(copyBtn.dataset.paymentIndex);
                const kind = String(copyBtn.dataset.paymentCopy || '');
                const result = await handlePaymentCopyAction(kind, rows[index], index);
                if (['member','amount'].includes(kind) && (result?.copied || result?.filled)) {
                    const key = paymentRowKey(rows[index]);
                    const flags = prepared.get(key) || { member: false, amount: false };
                    flags[kind] = true;
                    prepared.set(key, flags);
                    if (flags.member && flags.amount) {
                        setPaymentRowStatus(index, 'Prepared — Name + ID and Amount have been copied/prefilled. Verify the Torn fields, complete the payment manually, then press Mark Complete.', 'good');
                    }
                }
            }
        });
    }

    function basicReportTableHtml() {
        if (!state.reportRows.length) {
            return '<div class="rwph-note">No calculated member rows yet. Select a war, check the time range, then click <b>Calculate</b>.</div>';
        }
        const rows = sortedReportViewRows('basic');
        return `<div class="rwph-table-wrap"><table class="rwph-table">
            <thead><tr>
                <th>Pay</th><th>${sortHeader('Member', 'name')}</th><th>Torn ID</th><th>${sortHeader('War Hits', 'warHits')}</th><th>Outside</th><th>${sortHeader('Assists', 'assists')}</th><th>${sortHeader('Retaliations', 'retals')}</th><th>War Retals</th><th>Outside Retals</th><th>${sortHeader('Avg FF', 'fairFight')}</th><th>${sortHeader('Respect', 'respect')}</th><th>Bonus Pts</th><th>Penalties</th><th>${sortHeader('Contribution Pts', 'points')}</th><th>Payable Hits</th><th>${sortHeader('Payout', 'payout')}</th><th>% Member Payout</th><th>% War Cache</th><th>Total Attacks</th>
            </tr></thead>
            <tbody>${rows.map(v => {
                const r = v.row;
                const adjustment = getMemberAdjustment(r.id);
                const disabled = v.effectiveWarHits <= 0 || v.excluded || isCachedViewActive('basic') ? ' disabled' : '';
                return `<tr data-rwph-row-id="${escapeHtml(r.id)}" class="${v.excluded ? 'rwph-excluded-row' : ''}">
                    <td><input class="rwph-member-check" type="checkbox" data-member-id="${escapeHtml(r.id)}" ${v.included ? 'checked' : ''}${disabled} aria-label="Include ${escapeHtml(r.name)} in Basic payout"></td>
                    <td>${escapeHtml(r.name)}${v.excluded ? '<div><span class="rwph-badge bad">EXCLUDED</span></div>' : (adjustment.removeHits > 0 || adjustment.removeRespect > 0 ? '<div><span class="rwph-badge warn">ADJUSTED</span></div>' : '')}</td>
                    <td>${escapeHtml(r.id)}</td>
                    <td>${adjustmentValueHtml(r.warHits, v.effectiveWarHits)}</td>
                    <td>${formatNumber(r.outsideHits)}</td>
                    <td>${formatNumber(r.assists)}</td>
                    <td>${formatNumber(v.totalRetals)}</td>
                    <td>${formatNumber(r.warRetals ?? r.retals)}</td>
                    <td>${formatNumber(r.outsideRetals || 0)}</td>
                    <td>${r.avgFF > 0 ? formatNumber(r.avgFF, 2) : '—'}</td>
                    <td>${adjustmentValueHtml(r.respect, v.effectiveRespect, 2)}</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td class="rwph-score" data-col="contribution-points">${formatNumber(v.contributionPoints, 2)}</td>
                    <td data-col="payable-hits">${formatNumber(v.payableHits)}</td>
                    <td class="rwph-money" data-col="payout">${formatMoney(v.payout)}</td>
                    <td data-col="percentage">${formatNumber(v.percentage, 2)}%</td>
                    <td data-col="cache-percentage">${formatNumber(v.cachePercentage, 2)}%</td>
                    <td>${formatNumber(r.totalAttacks)}</td>
                </tr>`;
            }).join('')}</tbody>
        </table></div>`;
    }

    function advancedReportTableHtml() {
        if (!state.reportRows.length) {
            return '<div class="rwph-note">No calculated member rows yet. Select a war, check the time range, then click <b>Calculate</b>.</div>';
        }
        const rows = sortedReportViewRows('advanced');
        return `<div class="rwph-table-wrap"><table class="rwph-table">
            <thead><tr>
                <th>Pay</th><th>${sortHeader('Member', 'name')}</th><th>Torn ID</th><th>${sortHeader('War', 'warHits')}</th><th>Outside</th><th>${sortHeader('Assists', 'assists')}</th><th>${sortHeader('Retaliations', 'retals')}</th><th>War Retals</th><th>Outside Retals</th><th>Enemy Hosp</th><th>Hosp by Enemy</th><th>${sortHeader('Avg FF', 'fairFight')}</th><th>FF Hits</th><th>FF Steps</th><th>FF Pts</th><th>Bonus Pts</th><th>Penalties</th><th>Raw Pts</th><th>${sortHeader('Total Contribution Pts', 'points')}</th><th>Payable Hits</th><th>${sortHeader('Payout', 'payout')}</th><th>% Member Pool</th><th>% War Cache</th><th>${sortHeader('Respect', 'respect')}</th><th>Total Attacks</th>
            </tr></thead>
            <tbody>${rows.map(v => {
                const r = v.row;
                const adjustment = getMemberAdjustment(r.id);
                const score = v.score;
                return `<tr data-rwph-adv-row-id="${escapeHtml(r.id)}" class="${v.excluded ? 'rwph-excluded-row' : ''}">
                    <td><input class="rwph-member-check rwph-advanced-member-check" type="checkbox" data-member-id="${escapeHtml(r.id)}" ${v.included ? 'checked' : ''} ${v.excluded || isCachedViewActive('advanced') ? 'disabled' : ''} aria-label="Include ${escapeHtml(r.name)} in Advanced payout"></td>
                    <td>${escapeHtml(r.name)}${v.excluded ? '<div><span class="rwph-badge bad">EXCLUDED</span></div>' : (adjustment.removeHits > 0 || adjustment.removeRespect > 0 ? '<div><span class="rwph-badge warn">ADJUSTED</span></div>' : '')}</td>
                    <td>${escapeHtml(r.id)}</td>
                    <td>${adjustmentValueHtml(r.warHits, v.effectiveWarHits)}</td>
                    <td>${formatNumber(r.outsideHits)}</td>
                    <td>${formatNumber(r.assists)}</td>
                    <td>${formatNumber(v.totalRetals)}</td>
                    <td>${formatNumber(r.warRetals ?? r.retals)}</td>
                    <td>${formatNumber(r.outsideRetals || 0)}</td>
                    <td>${formatNumber(r.enemyHospitals)}</td>
                    <td>${formatNumber(r.hospitalizedByEnemy)}</td>
                    <td>${r.avgFF > 0 ? formatNumber(r.avgFF, 2) : '—'}</td>
                    <td class="rwph-score" data-col="ff-hits">${formatNumber(score.payableHits)}</td>
                    <td class="rwph-score" data-col="ff-steps">${formatNumber(score.ffSteps)}</td>
                    <td class="rwph-score" data-col="ff-points">${formatNumber(score.ffPoints, 2)}</td>
                    <td class="rwph-score" data-col="bonus-points">${formatNumber(v.bonusPoints, 2)}</td>
                    <td class="rwph-score" data-col="penalties">${formatNumber(v.penalties, 2)}</td>
                    <td class="rwph-score" data-col="raw-points">${formatNumber(score.rawPoints, 2)}</td>
                    <td class="rwph-score" data-col="final-points">${formatNumber(v.contributionPoints, 2)}</td>
                    <td class="rwph-score" data-col="payable-hits">${formatNumber(v.payableHits)}</td>
                    <td class="rwph-money" data-col="payout">${formatMoney(v.payout)}</td>
                    <td data-col="percentage">${formatNumber(v.percentage, 2)}%</td>
                    <td data-col="cache-percentage">${formatNumber(v.cachePercentage, 2)}%</td>
                    <td>${adjustmentValueHtml(r.respect, v.effectiveRespect, 2)}</td>
                    <td>${formatNumber(r.totalAttacks)}</td>
                </tr>`;
            }).join('')}</tbody>
        </table></div>`;
    }

    function reportTableHtml() {
        return currentPayoutMode() === 'advanced' ? advancedReportTableHtml() : basicReportTableHtml();
    }

    function reportKpisHtml() {
        const totals = state.reportRows.reduce((t, r) => {
            t.war += adjustedWarHits(r);
            t.out += r.outsideHits;
            t.assists += r.assists;
            t.retals += Number(r.warRetals ?? r.retals ?? 0);
            t.outsideRetals += Number(r.outsideRetals || 0);
            t.respect += adjustedRespect(r);
            t.enemyHospitals += Number(r.enemyHospitals || 0);
            t.hospitalizedByEnemy += Number(r.hospitalizedByEnemy || 0);
            return t;
        }, { war: 0, out: 0, assists: 0, retals: 0, outsideRetals: 0, respect: 0, enemyHospitals: 0, hospitalizedByEnemy: 0 });

        if (currentPayoutMode() === 'advanced') {
            const summary = advancedSummary();
            return `<div class="rwph-report-heading">Mode Breakdown</div><div class="rwph-kpis">
                <div class="rwph-kpi"><b>${formatNumber(totals.war)}</b><span>War Hits</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.out)}</b><span>Outside Hits</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.retals)}</b><span>War Retals</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.outsideRetals)}</b><span>Outside Retals</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.assists)}</b><span>Assists</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-points">${formatNumber(summary.totalPoints, 2)}</b><span>Total Points</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-point-value">${formatMoney(summary.pointValue)}</b><span>Point Value</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-pool">${summary.validPool ? formatMoney(summary.payoutPool) : 'Invalid'}</b><span>Total War Cache</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-member-pool">${summary.validPool ? formatMoney(summary.memberPayoutPool) : '—'}</b><span>Member Pool</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-faction-share">${summary.validPool ? formatMoney(summary.factionShare) : '—'}</b><span>Faction / Vault Share</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-members">${formatNumber(summary.includedMembers)}</b><span>Included Members</span></div>
                <div class="rwph-kpi"><b id="rwph-adv-kpi-ff-points">${formatNumber(summary.totalFairFightPoints, 2)}</b><span>Fair Fight Points</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.enemyHospitals)}</b><span>Enemy Hospitalized</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.hospitalizedByEnemy)}</b><span>Hospitalized by Enemy</span></div>
                <div class="rwph-kpi"><b>${formatNumber(totals.respect, 2)}</b><span>Respect</span></div>
            </div>`;
        }

        const summary = basicSummary();
        return `<div class="rwph-report-heading">Mode Breakdown</div><div class="rwph-kpis">
            <div class="rwph-kpi"><b>${formatNumber(totals.war)}</b><span>War Hits Found</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-payable">${formatNumber(summary.payableHits)}</b><span>Payable Hits</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-included">${formatNumber(summary.includedMembers)}</b><span>Included Members</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-rate">${formatMoney(summary.payPerHit)}</b><span>Pay Per Hit</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-payout">${formatMoney(summary.totalPayout)}</b><span>Total Payout</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-pool">${summary.hasPool ? formatMoney(summary.payoutPool) : '—'}</b><span>Total War Cache</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-member-pool">${summary.hasPool ? formatMoney(summary.memberPayoutPool) : '—'}</b><span>Member Pool</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-faction-share">${summary.hasPool ? formatMoney(summary.factionShare) : '—'}</b><span>Faction / Vault Share</span></div>
            <div class="rwph-kpi"><b id="rwph-kpi-remaining" class="${summary.remaining !== null ? (summary.remaining < 0 ? 'rwph-negative' : 'rwph-positive') : ''}">${summary.remaining === null ? '—' : formatMoney(summary.remaining)}</b><span>Member Pool Remaining</span></div>
            <div class="rwph-kpi"><b>${formatNumber(totals.respect, 2)}</b><span>Respect</span></div>
        </div>`;
    }

    function renderWarTab() {
        if (!state.open || state.tab !== 'war') return;
        closePaymentsPanel();
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        if (state.reportLoading?.active) {
            renderReportLoadingPanel();
            return;
        }

        if (state.activeCachedReport && Number(state.activeCachedReport.expiresAt || 0) <= Date.now()) {
            restoreLiveStateFromCache();
            state.activeCachedReport = null;
            state.lastStatus = 'The cached report expired after 10 minutes. Returned to the live report.';
        }
        const cachedActive = isCachedViewActive();
        const war = state.selectedWar;
        const opponent = factionOpponent(war);
        const defaultStart = cachedActive ? String(state.activeCachedReport?.range?.startInput || unixToLocalInput(war?.start)) : (gm.get(KEYS.manualStart, '') || unixToLocalInput(war?.start));
        const defaultEnd = cachedActive ? String(state.activeCachedReport?.range?.endInput || unixToLocalInput(war?.end || 0)) : (gm.get(KEYS.manualEnd, '') || unixToLocalInput(war?.end || (war ? Math.floor(Date.now() / 1000) : 0)));

        body.innerHTML = `
            <div class="rwph-grid">
                ${recoveryPromptHtml()}
                <section class="rwph-card half">
                    <h3>Ranked War</h3>
                    <div class="rwph-field">
                        <label>Selected War</label>
                        <select id="rwph-war-select" ${cachedActive ? 'disabled' : ''}>${warOptionsHtml()}</select>
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="load-wars" ${cachedActive ? 'disabled' : ''}>Load War</button>
                        <button class="rwph-btn" data-action="use-war-times" ${war && !cachedActive ? '' : 'disabled'}>Use Selected War Times</button>
                    </div>
                    <div class="rwph-status" id="rwph-status">${escapeHtml(state.lastStatus)}</div>
                </section>

                <section class="rwph-card half">
                    <h3>War Information</h3>
                    <p><b>Your faction:</b> ${state.faction ? `${escapeHtml(state.faction.name)} [${escapeHtml(state.faction.id)}]` : 'Not loaded'}</p>
                    <p><b>Opponent:</b> ${opponent ? `${escapeHtml(opponent.name)} [${escapeHtml(opponent.id)}]` : '—'}</p>
                    <p><b>War ID:</b> ${war ? escapeHtml(war.id) : '—'} &nbsp; <span class="rwph-pill">${escapeHtml(warStatus(war))}</span></p>
                    <p><b>Detected start:</b> ${war ? escapeHtml(formatTime(war.start)) : '—'}</p>
                    <p><b>Detected end:</b> ${war?.end ? escapeHtml(formatTime(war.end)) : (war ? 'Current time / active war' : '—')}</p>
                </section>

                <section class="rwph-card">
                    <h3>Report Time Range</h3>
                    <div class="rwph-form-grid">
                        <div class="rwph-field"><label>Start</label><input id="rwph-start" type="datetime-local" value="${escapeHtml(defaultStart)}" ${cachedActive ? 'disabled' : ''}></div>
                        <div class="rwph-field"><label>End</label><input id="rwph-end" type="datetime-local" value="${escapeHtml(defaultEnd)}" ${cachedActive ? 'disabled' : ''}></div>
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="calculate" ${war && !cachedActive ? '' : 'disabled'}>Calculate</button>
                        <button class="rwph-btn" data-action="open-members" ${state.reportRows.length && !cachedActive ? '' : 'disabled'}>Member Management</button>
                        <button class="rwph-btn danger" data-action="reset" ${cachedActive ? 'disabled' : ''}>Reset</button>
                    </div>
                    <p>Calculate loads outgoing and incoming war-window attack data. Basic uses ranked-war hits only; Advanced applies the configured contribution weights.</p>
                </section>

                <section class="rwph-card">
                    <h3>Payout Mode</h3>
                    <div class="rwph-mode-row">
                        <button class="rwph-mode-btn ${currentPayoutMode() === 'basic' ? 'active' : ''}" data-action="mode-basic">Basic — Per Hit</button>
                        <button class="rwph-mode-btn ${currentPayoutMode() === 'advanced' ? 'active' : ''}" data-action="mode-advanced">Advanced — Points</button>
                    </div>
                    ${payoutPresetsHtml(cachedActive)}
                    ${cacheControlsHtml(currentPayoutMode())}
                    ${currentPayoutMode() === 'basic' ? `
                        <div class="rwph-form-grid">
                            <div class="rwph-field">
                                <label>Pay Per Hit</label>
                                <input id="rwph-pay-per-hit" type="text" inputmode="decimal" placeholder="Example: 1m or 1000000" value="${escapeHtml(isCachedViewActive('basic') ? String(state.activeCachedReport?.config?.payRaw || '') : gm.get(KEYS.basicPayPerHit, ''))}" ${cachedActive ? 'disabled' : ''}>
                            </div>
                            <div class="rwph-field">
                                <label>Available Payout Pool (optional)</label>
                                <input id="rwph-payout-pool" type="text" inputmode="decimal" placeholder="Example: 500m" value="${escapeHtml(isCachedViewActive('basic') ? String(state.activeCachedReport?.config?.poolRaw || '') : gm.get(KEYS.basicPayoutPool, ''))}" ${cachedActive ? 'disabled' : ''}>
                            </div>
                        </div>
                        <div class="rwph-btn-row">
                            <button class="rwph-btn" data-action="select-all-members" ${state.reportRows.length && !cachedActive ? '' : 'disabled'}>Select All Hitters</button>
                            <button class="rwph-btn" data-action="clear-members" ${state.reportRows.length && !cachedActive ? '' : 'disabled'}>Clear Selection</button>
                        </div>
                        <div class="rwph-status" id="rwph-basic-warning">Basic mode: one selected ranked-war hit = one payable hit. Assists, outside hits and retaliation bonuses do not add extra payable hits.</div>
                    ` : `
                        <div class="rwph-field" style="margin-bottom:9px;">
                            <label>Advanced Payout Pool</label>
                            <input id="rwph-advanced-pool" type="text" inputmode="decimal" placeholder="Example: 500m" value="${escapeHtml(isCachedViewActive('advanced') ? String(state.activeCachedReport?.config?.poolRaw || '') : gm.get(KEYS.advancedPayoutPool, '100m'))}" ${cachedActive ? 'disabled' : ''}>
                        </div>
                        <div class="rwph-weight-grid">
                            <div class="rwph-field"><label>War Hit Weight</label><input id="rwph-adv-war" type="number" step="0.01" min="0" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.warHitWeight : gm.get(KEYS.advancedWarHitWeight, '1'))}" ${cachedActive ? 'disabled' : ''}></div>
                            <div class="rwph-field"><label>Outside Hit Weight</label><input id="rwph-adv-outside" type="number" step="0.01" min="0" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.outsideHitWeight : gm.get(KEYS.advancedOutsideHitWeight, '1'))}" ${cachedActive ? 'disabled' : ''}></div>
                            <div class="rwph-field"><label>War Retaliation Bonus</label><input id="rwph-adv-retal" type="number" step="0.01" min="0" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.retalWeight : gm.get(KEYS.advancedRetalWeight, '1'))}" ${cachedActive ? 'disabled' : ''}></div>
                            <div class="rwph-field"><label>Assist Weight</label><input id="rwph-adv-assist" type="number" step="0.01" min="0" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.assistWeight : gm.get(KEYS.advancedAssistWeight, '0'))}" ${cachedActive ? 'disabled' : ''}></div>
                            <div class="rwph-field"><label>Own Faction Hospital Bonus</label><input id="rwph-adv-own-hosp" type="number" step="0.01" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.ownHospitalWeight : gm.get(KEYS.advancedOwnHospitalWeight, '0'))}" ${cachedActive ? 'disabled' : ''}></div>
                            <div class="rwph-field"><label>Enemy Faction Hospital Bonus/Penalty</label><input id="rwph-adv-enemy-hosp" type="number" step="0.01" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.enemyHospitalWeight : gm.get(KEYS.advancedEnemyHospitalWeight, '-1'))}" ${cachedActive ? 'disabled' : ''}></div>
                        </div>
                        <div class="rwph-card" style="margin-top:10px;padding:10px;">
                            <h3 style="margin-top:0;">Fair Fight Bonus</h3>
                            <label class="rwph-note" style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">
                                <input id="rwph-adv-ff-enabled" type="checkbox" ${(isCachedViewActive('advanced') ? !!state.activeCachedReport?.config?.fairFightEnabled : checkboxInputValue('rwph-adv-ff-enabled', KEYS.advancedFairFightEnabled, true)) ? 'checked' : ''} ${cachedActive ? 'disabled' : ''}>
                                Enable Fair Fight bonus
                            </label>
                            <div class="rwph-weight-grid">
                                <div class="rwph-field"><label>FF Starting Point</label><input id="rwph-adv-ff-start" type="number" step="0.01" min="0.01" max="3" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.fairFightStart : gm.get(KEYS.advancedFairFightStart, '1.00'))}" ${cachedActive ? 'disabled' : ''}></div>
                                <div class="rwph-field"><label>FF Step</label><input id="rwph-adv-ff-step" type="number" step="0.01" min="0.001" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.fairFightStep : gm.get(KEYS.advancedFairFightStep, '0.02'))}" ${cachedActive ? 'disabled' : ''}></div>
                                <div class="rwph-field"><label>Points Per Step / Payable Hit</label><input id="rwph-adv-ff" type="number" step="0.01" min="0" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.fairFightBonus : gm.get(KEYS.advancedFairFightBonus, '0.01'))}" ${cachedActive ? 'disabled' : ''}></div>
                                <div class="rwph-field"><label>FF Cap</label><input id="rwph-adv-ff-cap" type="number" step="0.01" min="0.01" max="3" value="${escapeHtml(isCachedViewActive('advanced') ? state.activeCachedReport?.config?.fairFightCap : gm.get(KEYS.advancedFairFightCap, '3.00'))}" ${cachedActive ? 'disabled' : ''}></div>
                            </div>
                            <div class="rwph-btn-row">
                                <button class="rwph-btn" data-action="reset-ff-defaults" type="button" ${cachedActive ? 'disabled' : ''}>Reset FF Defaults</button>
                            </div>
                            <div class="rwph-note">Default formula: every full +0.02 Average FF above 1.00 adds +0.01 point per payable primary hit, capped at 3.00 FF. A War or Outside hit only counts as an FF payable hit when that hit type has a positive base weight.</div>
                        </div>
                        <div class="rwph-btn-row">
                            <button class="rwph-btn" data-action="adv-select-all" ${state.reportRows.length && !cachedActive ? '' : 'disabled'}>Select All Contributors</button>
                            <button class="rwph-btn" data-action="adv-clear" ${state.reportRows.length && !cachedActive ? '' : 'disabled'}>Clear Selection</button>
                        </div>
                        <div class="rwph-note" style="margin-top:9px;">Retals are bonuses on top of the hit's War/Outside points. Own Faction Hospital Bonus rewards hospitalizing the ranked-war opponent. Enemy Faction Hospital Bonus/Penalty applies when the opponent hospitalizes your member. Fair Fight is calculated from each member's average attack FF and the configurable settings above.</div>
                        <div class="rwph-status" id="rwph-advanced-warning">Advanced mode distributes the payout pool by final contribution points. Only retals against the ranked-war opponent receive the War Retaliation Bonus; outside retals use Outside Hit Weight only.</div>
                    `}
                </section>

                <section class="rwph-card">
                    <h3>${currentPayoutMode() === 'advanced' ? 'Advanced Points War Report' : 'Basic Payout War Report'}${cachedActive ? ' — CACHED SNAPSHOT' : ''}</h3>
                    <div id="rwph-war-report-summary">${warReportSummaryHtml()}</div>
                    ${reportKpisHtml()}
                    <div id="rwph-cache-split-host">${cacheSplitBreakdownHtml()}</div>
                    ${reportFiltersHtml()}
                    ${exportRecoveryHtml()}
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="open-payments" ${paymentRows().length ? '' : 'disabled'}>Payments (${formatNumber(paymentRows().length)})</button>
                    </div>
                    <div class="rwph-note" style="margin-top:10px;">Click a highlighted report heading to sort. Click the same heading again to reverse the order.</div>
                    <div id="rwph-report-table-host">${reportTableHtml()}</div>
                </section>
            </div>`;

        wireBodyActions();
    }


    function renderMemberManagementTab() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        if (state.activeCachedReport) {
            body.innerHTML = `<div class="rwph-grid"><section class="rwph-card"><h3>Member Management Locked for Cached Report</h3><div class="rwph-note">This is a frozen ${reportCacheLabel(state.activeCachedReport.mode)} cache snapshot. Member adjustments cannot modify it.</div><div class="rwph-btn-row"><button class="rwph-btn primary" data-action="return-live-report-members">Return to Live Report</button></div></section></div>`;
            body.querySelector('[data-action="return-live-report-members"]')?.addEventListener('click', () => {
                exitCachedReport(true, false);
                renderTab('war');
                setStatus('Returned to the live report.', 'good');
            });
            return;
        }
        ensureMemberManagementFresh();

        if (!state.reportRows.length) {
            body.innerHTML = `
                <div class="rwph-grid">
                    <section class="rwph-card">
                        <h3>Member Management</h3>
                        <div class="rwph-note">Build a ranked-war report first. Member Management uses the loaded report rows, then keeps your adjustments for 20 minutes.</div>
                        <div class="rwph-btn-row">
                            <button class="rwph-btn" data-action="members-back-war">Back to Ranked War</button>
                        </div>
                    </section>
                </div>`;
            wireBodyActions();
            return;
        }

        const adjustedCount = state.reportRows.filter(r => {
            const a = getMemberAdjustment(r.id);
            return a.excluded || a.removeHits > 0 || a.removeRespect > 0;
        }).length;
        const excludedCount = state.reportRows.filter(r => isMemberExcluded(r)).length;
        const removedHits = state.reportRows.reduce((sum, r) => {
            const a = getMemberAdjustment(r.id);
            return sum + Math.min(Math.max(0, Number(r.warHits || 0)), a.removeHits);
        }, 0);
        const removedRespect = state.reportRows.reduce((sum, r) => {
            const a = getMemberAdjustment(r.id);
            return sum + Math.min(Math.max(0, Number(r.respect || 0)), a.removeRespect);
        }, 0);

        body.innerHTML = `
            <div class="rwph-grid">
                <section class="rwph-card">
                    <h3>Member Management — v1.5.0</h3>
                    <div class="rwph-note">
                        Adjustments apply to <b>both Basic and Advanced modes</b>. Exclude blocks the member from payout. Remove Payable Hits subtracts from ranked-war hits, so it changes Basic payable hits plus Advanced War Hit and Fair Fight points. Remove Respect changes the displayed/report respect only.
                    </div>
                    <div class="rwph-kpis">
                        <div class="rwph-kpi"><b>${formatNumber(adjustedCount)}</b><span>Adjusted Members</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(excludedCount)}</b><span>Excluded</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(removedHits)}</b><span>Hits Removed</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(removedRespect, 2)}</b><span>Respect Removed</span></div>
                    </div>
                    <div class="rwph-status good" id="rwph-mm-status">${escapeHtml(memberAdjustmentRemainingText())}</div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="save-member-management">Save / Refresh 20-Min Timer</button>
                        <button class="rwph-btn danger" data-action="clear-member-management">Clear All Adjustments</button>
                        <button class="rwph-btn" data-action="members-back-war">Back to Ranked War</button>
                    </div>
                </section>

                <section class="rwph-card">
                    <h3>Per-Member Adjustments</h3>
                    <div class="rwph-table-wrap"><table class="rwph-table">
                        <thead><tr>
                            <th>Exclude</th><th>Member</th><th>Torn ID</th><th>Original War Hits</th><th>Remove Payable Hits</th><th>Adjusted War Hits</th><th>Original Respect</th><th>Remove Respect</th><th>Adjusted Respect</th><th>Restore</th>
                        </tr></thead>
                        <tbody>${state.reportRows.map(r => {
                            const a = getMemberAdjustment(r.id);
                            const effectiveHits = adjustedWarHits(r);
                            const effectiveRespect = adjustedRespect(r);
                            return `<tr data-rwph-mm-row-id="${escapeHtml(r.id)}" class="${a.excluded ? 'rwph-excluded-row' : ''}">
                                <td><input class="rwph-mm-exclude" type="checkbox" data-member-id="${escapeHtml(r.id)}" ${a.excluded ? 'checked' : ''} aria-label="Exclude ${escapeHtml(r.name)} from payout"></td>
                                <td>${escapeHtml(r.name)} ${a.excluded ? '<span class="rwph-badge bad">EXCLUDED</span>' : (a.removeHits > 0 || a.removeRespect > 0 ? '<span class="rwph-badge warn">ADJUSTED</span>' : '')}</td>
                                <td>${escapeHtml(r.id)}</td>
                                <td>${formatNumber(r.warHits)}</td>
                                <td><input class="rwph-mm-input rwph-mm-remove-hits" type="number" min="0" step="1" max="${Math.max(0, Number(r.warHits || 0))}" data-member-id="${escapeHtml(r.id)}" value="${escapeHtml(a.removeHits)}"></td>
                                <td data-col="mm-adjusted-hits">${adjustmentValueHtml(r.warHits, effectiveHits)}</td>
                                <td>${formatNumber(r.respect, 2)}</td>
                                <td><input class="rwph-mm-input rwph-mm-remove-respect" type="number" min="0" step="0.01" max="${Math.max(0, Number(r.respect || 0))}" data-member-id="${escapeHtml(r.id)}" value="${escapeHtml(a.removeRespect)}"></td>
                                <td data-col="mm-adjusted-respect">${adjustmentValueHtml(r.respect, effectiveRespect, 2)}</td>
                                <td><button class="rwph-btn" data-action="restore-member-adjustment" data-member-id="${escapeHtml(r.id)}" type="button">Restore</button></td>
                            </tr>`;
                        }).join('')}</tbody>
                    </table></div>
                </section>
            </div>`;
        wireBodyActions();
        wireMemberManagementInputs();
    }

    function refreshMemberManagementPreview() {
        ensureMemberManagementFresh();
        document.querySelectorAll('[data-rwph-mm-row-id]').forEach(tr => {
            const id = Number(tr.dataset.rwphMmRowId);
            const row = state.reportRows.find(r => Number(r.id) === id);
            if (!row) return;
            const a = getMemberAdjustment(id);
            tr.classList.toggle('rwph-excluded-row', a.excluded);
            const hits = tr.querySelector('[data-col="mm-adjusted-hits"]');
            const respect = tr.querySelector('[data-col="mm-adjusted-respect"]');
            if (hits) hits.innerHTML = adjustmentValueHtml(row.warHits, adjustedWarHits(row));
            if (respect) respect.innerHTML = adjustmentValueHtml(row.respect, adjustedRespect(row), 2);
        });
        const status = document.getElementById('rwph-mm-status');
        if (status) status.textContent = memberAdjustmentRemainingText();
    }

    function syncMemberManagementFromDom() {
        document.querySelectorAll('[data-rwph-mm-row-id]').forEach(tr => {
            const id = Number(tr.dataset.rwphMmRowId);
            const excluded = !!tr.querySelector('.rwph-mm-exclude')?.checked;
            const removeHits = Number(tr.querySelector('.rwph-mm-remove-hits')?.value || 0);
            const removeRespect = Number(tr.querySelector('.rwph-mm-remove-respect')?.value || 0);
            const next = normaliseMemberAdjustment({ excluded, removeHits, removeRespect });
            if (!next.excluded && next.removeHits <= 0 && next.removeRespect <= 0) delete state.memberAdjustments[String(id)];
            else state.memberAdjustments[String(id)] = next;
            if (next.excluded) {
                state.includedMembers.delete(id);
                state.advancedIncludedMembers.delete(id);
            }
        });
        saveMemberManagementState();
        refreshMemberManagementPreview();
    }

    function wireMemberManagementInputs() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        body.querySelectorAll('.rwph-mm-exclude,.rwph-mm-remove-hits,.rwph-mm-remove-respect').forEach(el => {
            const eventName = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(eventName, () => {
                const row = state.reportRows.find(r => Number(r.id) === Number(el.dataset.memberId));
                if (row && el.classList.contains('rwph-mm-remove-hits')) {
                    const n = Math.max(0, Math.min(Math.floor(Number(el.value || 0)), Math.max(0, Number(row.warHits || 0))));
                    if (String(n) !== String(el.value)) el.value = String(n);
                }
                if (row && el.classList.contains('rwph-mm-remove-respect')) {
                    const n = Math.max(0, Math.min(Number(el.value || 0), Math.max(0, Number(row.respect || 0))));
                    if (Number.isFinite(n) && String(n) !== String(el.value)) el.value = String(n);
                }
                syncMemberManagementFromDom();
            });
        });
    }

    function backendHealthLabel() {
        const status = String(state.backendHealth?.status || 'unchecked');
        if (status === 'healthy') return 'Healthy';
        if (status === 'checking') return 'Checking…';
        if (status === 'database') return 'Database Offline';
        if (status === 'version') return 'Version Mismatch';
        if (status === 'offline') return 'Backend Offline';
        return 'Not Tested';
    }

    function backendHealthClass() {
        const status = String(state.backendHealth?.status || 'unchecked');
        return status === 'healthy' ? 'good' : status === 'checking' || status === 'unchecked' ? '' : 'bad';
    }

    function renderSettingsTab() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        const hasKey = !!getApiKey();
        const licenceClass = state.licence?.status === 'active' ? 'good' : state.licence?.status === 'unavailable' ? 'warn' : 'bad';
        body.innerHTML = `
            <div class="rwph-grid">
                <section class="rwph-card half">
                    <h3>Torn API Key</h3>
                    <div class="rwph-field">
                        <label>API Key</label>
                        <input id="rwph-api-key" type="password" autocomplete="off" placeholder="Paste your Torn API key" value="${escapeHtml(getApiKey())}">
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="save-key">Test & Save</button>
                        <button class="rwph-btn danger" data-action="delete-key" ${hasKey ? '' : 'disabled'}>Delete Key</button>
                    </div>
                    <div class="rwph-status" id="rwph-status">${escapeHtml(state.lastStatus)}</div>
                </section>
                <section class="rwph-card half">
                    <h3>Server-Side Licence</h3>
                    <div class="rwph-field">
                        <label>RWPH Backend URL</label>
                        <input id="rwph-backend-url" type="text" autocomplete="off" placeholder="https://YOUR-RWPH-WORKER.YOUR-SUBDOMAIN.workers.dev" value="${escapeHtml(getBackendUrl())}">
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="save-backend">Save Backend</button>
                        <button class="rwph-btn" data-action="test-backend">Test Backend</button>
                        <button class="rwph-btn" data-action="check-licence" ${hasKey ? '' : 'disabled'}>Check Licence</button>
                    </div>
                    <div class="rwph-status ${backendHealthClass()}"><b>Backend: ${escapeHtml(backendHealthLabel())}</b> — ${escapeHtml(state.backendHealth?.message || 'Not tested.')}${state.backendHealth?.status === 'healthy' ? `<br>Server ${escapeHtml(state.backendHealth.version || '?')} · API ${escapeHtml(state.backendHealth.apiVersion || '?')} · DB schema ${escapeHtml(state.backendHealth.dbSchema || '?')} · DB ${escapeHtml(state.backendHealth.dbLatencyMs || 0)}ms` : ''}</div>
                    <div class="rwph-status ${licenceClass}"><b>Licence: ${escapeHtml(licenceStatusLabel())}</b> — ${escapeHtml(state.licence?.message || 'Not checked.')}${state.licence?.expiresAt ? `<br>Expires: ${escapeHtml(licenceExpiryText())}<br>Remaining: <b data-rwph-licence-countdown>${escapeHtml(formatLicenceDuration(Number(state.licence.expiresAt || 0) - Date.now()))}</b>` : ''}</div>
                </section>
                <section class="rwph-card rwph-theme-card">
                    <h3>v3.0.0 Theme &amp; Appearance</h3>
                    <p>Customise RWPH without changing Torn itself. Theme colours are stored locally in Tampermonkey and apply to the main panel, loading/results, Member Management, Payments, Licence, Admin, Help and Settings UI.</p>
                    <div class="rwph-theme-grid">
                        <div class="rwph-theme-control"><label>Accent Colour</label><input id="rwph-theme-accent" type="color" value="${escapeHtml(getThemeSettings().accent)}"></div>
                        <div class="rwph-theme-control"><label>Panel Colour</label><input id="rwph-theme-panel" type="color" value="${escapeHtml(getThemeSettings().panel)}"></div>
                        <div class="rwph-theme-control"><label>Button Colour</label><input id="rwph-theme-button" type="color" value="${escapeHtml(getThemeSettings().button)}"></div>
                        <div class="rwph-theme-control"><label>Highlight Colour</label><input id="rwph-theme-highlight" type="color" value="${escapeHtml(getThemeSettings().highlight)}"></div>
                    </div>
                    <div class="rwph-theme-preview"><span class="rwph-theme-preview-dot"></span><div><b>Live Theme Preview</b><br><span>Colour changes preview immediately. Save Theme makes them persistent.</span></div></div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="save-theme">Save Theme</button>
                        <button class="rwph-btn" data-action="reset-theme">Reset Default Theme</button>
                    </div>
                </section>
                ${updateSafetyHtml()}
                <section class="rwph-card half">
                    <h3>Key Requirements</h3>
                    <p>War history and ranked-war reports can be read using public API access.</p>
                    <p>RWPH also needs detailed faction attacks for the member breakdown. That endpoint requires a <b>Limited Access</b> key and faction API access permission.</p>
                    <div class="rwph-note">The Torn API key remains in Tampermonkey/userscript storage and is sent only to Torn's API. The v3.5.0 Cloudflare Worker (API protocol 2.8) receives identity/licence data, purchase-order/admin requests and protected payout inputs, not your Torn API key or database credentials.</div>
                </section>
                <section class="rwph-card half">
                    <h3>Cloud Backend</h3>
                    <p>The Cloudflare Worker stores persistent state in MySQL through Hyperdrive and now exposes API/database health details, version metadata and structured error codes.</p>
                    <p>Protected payout requests use a short-lived signed licence session plus HMAC request signatures, timestamps and one-use request IDs. Rate-limit bindings protect public, calculation and admin routes.</p>
                    <div class="rwph-note">A valid server licence is required for Ranked War and Member Management. Advanced payout scoring remains server-side; Basic access is server-validated. The final v3.5 Worker continues to use database schema 2.8.0; existing v2.8 schema installs need no new SQL migration.</div>
                </section>
                ${renderLicencePurchaseCard()}
            </div>`;
        wireBodyActions();
        ['rwph-theme-accent','rwph-theme-panel','rwph-theme-button','rwph-theme-highlight'].forEach(id => body.querySelector(`#${id}`)?.addEventListener('input', previewThemeSettings));
        startLicenceCountdownTimer();
    }


    function renderAdminTab() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        const rows = Array.isArray(state.admin?.results) ? state.admin.results : [];
        const summary = state.admin?.summary || { total: 0, active: 0, expired: 0, revoked: 0 };
        const savedKey = getAdminKey();
        const rowHtml = rows.map(row => {
            const status = String(row.status || 'expired');
            const statusClass = status === 'active' ? 'good' : status === 'revoked' ? 'bad' : 'warn';
            return `<tr>
                <td>${escapeHtml(row.name || 'Unknown')}</td>
                <td>${escapeHtml(row.tornId || '—')}</td>
                <td><span class="rwph-status ${statusClass}" style="display:inline-block;margin:0;padding:3px 7px;">${escapeHtml(status)}</span></td>
                <td>${escapeHtml(adminExpiryText(row.expiresAt))}</td>
                <td>${escapeHtml(adminRemainingText(row))}</td>
                <td><button class="rwph-btn" type="button" data-action="admin-fill" data-admin-id="${escapeHtml(row.tornId)}" data-admin-name="${escapeHtml(row.name || '')}">Select</button></td>
            </tr>`;
        }).join('');
        body.innerHTML = `
            <div class="rwph-grid">
                <section class="rwph-card half">
                    <h3>Admin Authentication</h3>
                    <div class="rwph-field"><label>Backend Admin Key</label><input id="rwph-admin-key" type="password" autocomplete="off" placeholder="Paste RWPH_ADMIN_KEY" value="${escapeHtml(savedKey)}"></div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="admin-verify">Save &amp; Verify</button>
                        <button class="rwph-btn danger" data-action="admin-clear-key" ${savedKey ? '' : 'disabled'}>Clear Admin Key</button>
                    </div>
                    <div class="rwph-status ${adminStatusClass()}" id="rwph-admin-status">${escapeHtml(state.admin?.message || 'Admin key has not been verified yet.')}</div>
                    <div class="rwph-note">Admin access is verified by the backend using <code>RWPH_ADMIN_KEY</code>. A normal RWPH user licence is not required to administer licences.</div>
                </section>
                <section class="rwph-card half">
                    <h3>Licence Status</h3>
                    <div class="rwph-kpis">
                        <div class="rwph-kpi"><b>${formatNumber(summary.total || 0)}</b><span>Total</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(summary.active || 0)}</b><span>Active</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(summary.expired || 0)}</b><span>Expired</span></div>
                        <div class="rwph-kpi"><b>${formatNumber(summary.revoked || 0)}</b><span>Revoked</span></div>
                    </div>
                    <div class="rwph-btn-row"><button class="rwph-btn" data-action="admin-refresh-status" ${savedKey ? '' : 'disabled'}>Refresh Admin Status</button></div>
                </section>
                <section class="rwph-card">
                    <h3>Search Licences</h3>
                    <div class="rwph-row">
                        <div class="rwph-field"><label>Name or Torn ID</label><input id="rwph-admin-search" type="text" value="${escapeHtml(state.admin?.query || '')}" placeholder="Search name or ID"></div>
                        <div class="rwph-field"><label>Status</label><select id="rwph-admin-filter"><option value="all" ${state.admin?.status === 'all' ? 'selected' : ''}>All</option><option value="active" ${state.admin?.status === 'active' ? 'selected' : ''}>Active</option><option value="expired" ${state.admin?.status === 'expired' ? 'selected' : ''}>Expired</option><option value="revoked" ${state.admin?.status === 'revoked' ? 'selected' : ''}>Revoked</option></select></div>
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="admin-search" ${savedKey ? '' : 'disabled'}>Search</button>
                        <button class="rwph-btn" data-action="admin-list-all" ${savedKey ? '' : 'disabled'}>List All</button>
                    </div>
                    <div class="rwph-table-wrap"><table class="rwph-table"><thead><tr><th>Name</th><th>Torn ID</th><th>Status</th><th>Expiry</th><th>Remaining</th><th>Action</th></tr></thead><tbody>${rowHtml || '<tr><td colspan="6">No licence records loaded.</td></tr>'}</tbody></table></div>
                </section>
                <section class="rwph-card">
                    <h3>Manage Licence</h3>
                    <div class="rwph-row">
                        <div class="rwph-field"><label>Torn ID</label><input id="rwph-admin-torn-id" type="number" min="1" step="1" placeholder="123456"></div>
                        <div class="rwph-field"><label>Player Name</label><input id="rwph-admin-name" type="text" placeholder="Optional for Extend/Revoke"></div>
                        <div class="rwph-field"><label>Days</label><input id="rwph-admin-days" type="number" min="1" max="3650" step="1" value="15"></div>
                    </div>
                    <div class="rwph-btn-row">
                        <button class="rwph-btn primary" data-action="admin-grant" ${savedKey ? '' : 'disabled'}>Grant Licence</button>
                        <button class="rwph-btn" data-action="admin-extend" ${savedKey ? '' : 'disabled'}>Extend Licence</button>
                        <button class="rwph-btn danger" data-action="admin-revoke" ${savedKey ? '' : 'disabled'}>Revoke Licence</button>
                    </div>
                    <div class="rwph-note"><b>Grant</b> creates or replaces a licence starting from now and clears revocation. <b>Extend</b> adds days to the active expiry, or starts from now when expired. <b>Revoke</b> blocks licence use immediately on the next server-validated action.</div>
                </section>
            </div>`;
        wireBodyActions();
    }

    function renderHelpTab() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        body.innerHTML = `
            <div class="rwph-grid">
                <section class="rwph-card">
                    <h3>RWPH v${APP.version} — Complete Release</h3>
                    <p><b>1.</b> Open Settings and save a Torn API key.</p>
                    <p><b>2.</b> Return to Ranked War and click <b>Load War</b>.</p>
                    <p><b>3.</b> Choose a ranked war and confirm its start/end range.</p>
                    <p><b>4.</b> Choose <b>Basic</b> for Pay Per Hit or <b>Advanced</b> for weighted contribution points.</p>
                    <p><b>5.</b> Click <b>Calculate</b>, then open <b>Member Management</b> to exclude members or remove payable hits/respect before final payout review.</p>
                    <p><b>6.</b> v1.6.0 adds the detailed War Report summary and sortable member columns.</p>
                    <p><b>7.</b> v1.7.0 automatically caches the completed report for the mode you calculated. Basic and Advanced use separate 10-minute caches.</p>
                    <p><b>8.</b> v1.8.0 opens an integrated Results Loading panel while calculation is running. It shows an elapsed timer, animated activity dots, ten processing stages and live attack-page progress.</p>
                    <p><b>9.</b> The timer continues past 59 seconds using minutes/seconds. <b>Open Results</b> stays locked until every required stage is complete, then unlocks without opening a separate browser tab.</p>
                    <p><b>10.</b> v1.9.0 hardens attack loading with a serialized request queue, request spacing, rate-limit retries, repeated-link protection, attack-ID deduplication, a 500-page safety ceiling, and live request/page/retry/duplicate counters.</p>
                    <p><b>11.</b> Use <b>Use Cached Report</b> to reopen the frozen snapshot or <b>Delete Cache</b> to remove it. Cached settings, member selections, adjustments, points and payouts do not change when live payout settings are edited later.</p>
                    <p><b>12.</b> v2.0.0 adds the manual Payments Copy Panel; v2.1.0 requires <b>Accept Warning</b> and adds explicit completion/restore checklist controls.</p>
                    <p><b>13.</b> v2.2.0 adds <b>Open Faction Vault</b>. It stores the selected member/amount for 5 minutes, keeps a frozen report return snapshot for 10 minutes, and opens Torn faction controls in the same tab with member/amount URL prefill.</p>
                    <p><b>14.</b> After the vault handoff, use <b>Reopen RWPH Report</b> or <b>Reopen Payment Panel</b> to continue without recalculating the war.</p>
                    <p><b>15.</b> v2.3.0 adds <b>Guided Pay-All</b>. After accepting the payment warning, press <b>Start Pay-All</b> to prepare the first unpaid member in Torn faction controls.</p>
                    <p><b>16.</b> After manually confirming the payment in Torn, use <b>Mark Complete &amp; Next</b> to move to the next queued member, <b>Skip &amp; Next</b> to leave a member unpaid, or <b>Previous Member</b> to return to the previous queued member.</p>
                    <p><b>17.</b> The Pay-All panel tracks <b>Paid</b>, <b>Pending</b>, <b>Skipped</b>, untouched remaining members, paid amount and remaining unpaid amount. Skipped members stay included in the remaining amount until they are restored or paid.</p>
                    <p><b>18.</b> v2.4.0 checks the RWPH backend every time the main panel opens. Active licences unlock the War and Member Management tabs automatically.</p>
                    <p><b>19.</b> Missing and expired licences show a locked renewal screen. Server connection failures show <b>Server unavailable</b> instead of silently unlocking.</p>
                    <p><b>20.</b> Advanced contribution scoring is calculated by the licensed backend when you press Calculate. Basic calculations are licence-validated server-side before the final report/cache is released.</p>
                    <p><b>21.</b> v2.5.0 adds <b>Buy Licence</b> and <b>Extend Licence</b> at a fixed rate of <b>1 Xanax = 15 days</b>. The backend creates a unique request ID, payment code, recipient instructions and expiring pending order.</p>
                    <p><b>22.</b> The licence remaining timer is calculated from the server expiry and continues correctly after refresh, panel close and panel reopen. Xanax transfers remain manual; use <b>Check Payment</b> after the backend has verified/applied the order.</p>
                    <div class="rwph-note">Basic pays only selected successful ranked-war hits at weight 1. Advanced can score war hits, outside hits, assists, bonus-eligible war retals, hospital actions and configurable Fair Fight points, then splits the Advanced payout pool by final points. Outside retals are scored as outside hits only.</div>
                    <p><b>23.</b> v2.6.0 adds the server-verified <b>Admin</b> tab for searching, granting, extending and revoking licences. Admin authority comes from the backend-only <code>RWPH_ADMIN_KEY</code>, not a normal user licence.</p>
                    <p><b>24.</b> v2.7.0 moves persistent backend state into MySQL behind a Cloudflare Worker/Hyperdrive connection. The userscript only stores the Worker URL and never contains MySQL credentials or Worker secrets.</p>
                    <p><b>25.</b> v2.8.0 hardens the cloud backend with API version negotiation, signed protected requests, replay blocking, Cloudflare rate limits, database timeouts, structured retryable errors and admin permission enforcement.</p>
                    <p><b>26.</b> v2.9.0 rebuilds the launcher so it is anchored beside the visible Torn <b>Faction</b> heading, never uses a floating fallback, survives dynamic rerenders, and becomes logo-only on PDA/phone widths.</p>
                    <p><b>27.</b> v3.0.0 rebuilds every RWPH panel with a modern Torn-compatible card layout, larger RWPH branding, improved inputs/buttons, responsive mobile behavior and a locally saved Theme System for Accent, Panel, Button and Highlight colours.</p>
                    <p><b>28.</b> v3.1.0 adds bottom-right notifications with an approximately 5-second lifetime for licence, war, cache, payment, settings, API and backend events. It also adds six built-in payout presets plus locally saved custom presets.</p>
                    <p><b>29.</b> v3.2.0 adds the War Cache Split Calculator. Member Pool % and Faction/Vault % must total 100%; Advanced payouts distribute only the Member Pool, while Basic Pay Per Hit uses the Member Pool as its budget ceiling. Cached reports freeze their split.</p>
                    <p><b>30.</b> v3.2.0 report filters are display-only. Included, Excluded, Unselected, minimum hits/respect/payout, member name, Torn ID and relative contribution level filters never change payout selections or payment rows.</p>
                    <p><b>31.</b> v3.3.0 adds CSV, JSON, Plain Text, Discord-ready and Torn forum/newsletter exports. Choose the row scope and exactly which report columns are included before downloading or copying.</p>
                    <p><b>32.</b> v3.3.0 automatically keeps a 24-hour local recovery snapshot of the selected war, payout mode/settings, member adjustments, report rows and payment progress. After a reload/crash, use <b>Recover Previous RWPH Session</b> to restore it without fetching the attack logs again.</p>
                    <p><b>33.</b> v3.4.0 improves large-war responsiveness with chunked attack classification, indexed Advanced member lookups, duplicate-request protection, single-run calculation/loading guards and automatic release of raw attack arrays after successful calculation.</p>
                    <p><b>34.</b> v3.4.0 adds installed-version detection, stored-settings/cache migration, compact packed report storage, explicit backend/API/database compatibility checks and update notes. Existing v3.3 report/recovery/payment snapshots migrate automatically.</p>
                    <p><b>35.</b> v3.5.0 is the Complete Release: final settings normalization, release-readiness checks, improved Torn SPA runtime cleanup/header reuse, and a finalized v3.5 Worker with safer connection retries and lower replay-cleanup query overhead.</p>
                    <p><b>35.</b> Mobile/PDA now uses larger touch targets, sticky table headings, momentum scrolling, safer full-height panels, responsive payment controls and the existing clipboard fallbacks. Results continue opening inside RWPH rather than blocked browser windows.</p>
                </section>
                <section class="rwph-card">
                    <h3>Retaliation Classification Used in v1.3.0</h3>
                    <p><b>War hit:</b> a successful outgoing ranked-war hit. A retal against the selected war opponent is forced into this bucket even if Torn's war signal is missing or inconsistent.</p>
                    <p><b>Outside hit:</b> a successful outgoing hit that is not a ranked-war hit. A retal against a non-war target is treated as an outside hit.</p>
                    <p><b>Assist:</b> Torn result containing “assist” or Torn's interrupted/assist flag. Assists never also become a war/outside hit.</p>
                    <p><b>War retal:</b> counts once as a War Hit and once as a bonus marker for Advanced War Retaliation Bonus.</p>
                    <p><b>Outside retal:</b> counts once as an Outside Hit and does <b>not</b> receive the Advanced War Retaliation Bonus.</p>
                    <p><b>Average Fair Fight:</b> RWPH averages the Fair Fight modifier from the member's successful outgoing attacks that include a Fair Fight value.</p>
                    <p><b>Fair Fight bonus:</b> when enabled, each full FF step above the configured starting point adds the configured points per payable War/Outside hit. The FF value is limited by the configured cap, with a maximum configurable cap of 3.00.</p>
                    <div class="rwph-note">v1.5.0 added Member Management. Adjustments are scoped to the selected war and saved locally for 20 minutes. Exclusions affect both payout modes; removed payable hits reduce ranked-war hits in Basic and Advanced; removed respect updates the report value.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.1.0 Payment Warning & Safety:</b> Payments require Accept Warning every time the panel opens. Completed rows can be marked, hidden and restored. Copy/prefill remains manual.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.2.0 Faction Vault Integration:</b> Open Faction Vault performs a user-triggered same-tab navigation to Torn faction controls, preserves a 5-minute pending member/amount and a 10-minute report return snapshot, and never clicks a Torn payment confirmation button.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.3.0 Pay-All Workflow:</b> Payable members can be processed one at a time with Paid, Pending, Skipped and Remaining tracking. Mark Complete &amp; Next, Skip &amp; Next and Previous Member only control RWPH's checklist/queue; Torn's actual payment remains manual.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.4.0 Server-Side Licence:</b> RWPH requires an Active licence from the configured backend. Your Torn API key stays local to the userscript/Torn API; the backend receives identity/licence fields and protected payout inputs only.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.5.0 Xanax Purchases:</b> Buy/Extend creates a server-side order at 15 days per Xanax. RWPH shows the unique payment code, request ID, recipient, order countdown and live remaining licence time.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.6.0 Licence Administration:</b> the Admin tab uses a separate backend-only admin key to search, grant, extend and revoke licences without requiring a normal user licence.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.7.0 Cloud Backend:</b> permanent hosting now uses Userscript → Cloudflare Worker → MySQL through Hyperdrive. Database/admin credentials remain Worker-side and are never embedded in RWPH.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.8.0 Backend Reliability &amp; Security:</b> protected calculations now use session-bound HMAC request signatures, timestamps and one-use request IDs. The Worker adds replay protection, API-version headers, Cloudflare rate limits, database timeouts, structured error codes and admin permission checks.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v2.9.0 Launcher Rebuild:</b> the launcher is only mounted beside a visible Torn Faction heading. There is no floating fallback, which prevents the button jumping around while messages/sections render. PDA/phone widths use the compact RW logo only.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v3.0.0 Full UI Rebuild:</b> all main RWPH surfaces now share the same modern dark visual system. Settings → Theme &amp; Appearance lets you change Accent, Panel, Button and Highlight colours or reset the defaults.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v3.1.0 Notifications &amp; Payout Presets:</b> notifications stack at the bottom-right and disappear automatically after about five seconds. Payout Presets can apply or save Mode, Basic pay-per-hit/pool, Advanced weights, Fair Fight, hospital bonuses and the member/faction pool split. Built-in presets are protected from deletion.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v3.5.0 Complete Release:</b> this is the final roadmap baseline. Existing payout classifications, manual Torn confirmation, cache/recovery behavior and API protocol remain compatible while the userscript/backend receive final migration, runtime, security and reliability cleanup.</div>
                    <div class="rwph-note" style="margin-top:8px;"><b>v3.3.0 Export &amp; Recovery:</b> report exports are generated entirely in the userscript and never change payout state. Recovery snapshots are stored locally for 24 hours and exclude the Torn API key, admin key, Worker secret and database credentials.</div>
                </section>
            </div>`;
    }

    function licenceStatusLabel() {
        const status = String(state.licence?.status || 'unchecked');
        if (status === 'active') return 'Active';
        if (status === 'expired') return 'Expired';
        if (status === 'missing') return 'Missing';
        if (status === 'unavailable') return 'Server unavailable';
        if (status === 'checking') return 'Checking…';
        return 'Not checked';
    }

    function licenceExpiryText() {
        const ms = Number(state.licence?.expiresAt || 0);
        if (!ms) return '—';
        const d = new Date(ms);
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
    }

    function renderLicenceGate() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;
        const status = String(state.licence?.status || 'unchecked');
        const cls = status === 'active' ? 'good' : status === 'checking' ? '' : status === 'unavailable' ? 'warn' : 'bad';
        const title = status === 'expired' ? 'RWPH Licence Expired' : status === 'missing' ? 'RWPH Licence Required' : status === 'unavailable' ? 'RWPH Licence Server Unavailable' : 'Checking RWPH Licence';
        const renewal = status === 'expired' || status === 'missing'
            ? `<div class="rwph-note" style="margin-top:10px;"><b>Buy Licence:</b> create a Xanax payment order below. The rate is 1 Xanax = ${XANAX_LICENCE_DAYS} days.</div>`
            : '';
        body.innerHTML = `<div class="rwph-grid">
            <section class="rwph-card">
                <h3>${escapeHtml(title)}</h3>
                <div class="rwph-kpis">
                    <div class="rwph-kpi"><b>${escapeHtml(licenceStatusLabel())}</b><span>Licence Status</span></div>
                    <div class="rwph-kpi"><b>${escapeHtml(state.licence?.tornId || '—')}</b><span>Torn ID</span></div>
                    <div class="rwph-kpi"><b>${escapeHtml(state.licence?.factionId || '—')}</b><span>Faction ID</span></div>
                    <div class="rwph-kpi"><b>${escapeHtml(licenceExpiryText())}</b><span>Licence Expiry</span></div>
                    <div class="rwph-kpi"><b data-rwph-licence-countdown>${state.licence?.expiresAt ? escapeHtml(formatLicenceDuration(Number(state.licence.expiresAt || 0) - Date.now())) : '—'}</b><span>Licence Remaining</span></div>
                </div>
                <div class="rwph-status ${cls}">${escapeHtml(state.licence?.message || 'RWPH licence has not been checked yet.')}</div>
                ${renewal}
                <div class="rwph-note" style="margin-top:10px;">Licence server: <b>${escapeHtml(getBackendUrl())}</b>. RWPH sends your Torn ID, display name, faction ID and app version for licence verification. Your Torn API key is not sent to the RWPH backend.</div>
                <div class="rwph-btn-row" style="margin-top:10px;">
                    <button class="rwph-btn primary" type="button" data-action="check-licence" ${status === 'checking' ? 'disabled' : ''}>Retry Licence Check</button>
                    <button class="rwph-btn" type="button" data-action="open-licence-settings">Open Settings</button>
                </div>
            </section>
            ${renderLicencePurchaseCard()}
        </div>`;
        wireBodyActions();
        startLicenceCountdownTimer();
    }

    async function saveBackendSettings() {
        const input = document.querySelector('#rwph-backend-url');
        const raw = String(input?.value || '').trim().replace(/\/+$/, '');
        let parsed;
        try { parsed = new URL(raw); } catch (_) {
            setStatus('Enter a valid RWPH backend URL, for example https://rwph-backend.example.workers.dev.', 'bad');
            return;
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            setStatus('RWPH backend URL must use https://, or http:// only for local development.', 'bad');
            return;
        }
        const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
        if (parsed.protocol !== 'https:' && !localHttp) {
            setStatus('Remote RWPH backends must use HTTPS. Plain HTTP is allowed only for localhost/127.0.0.1 development.', 'bad');
            return;
        }
        gm.set(KEYS.backendUrl, raw);
        clearLicenceSession();
        clearLicencePurchase();
        gm.del(KEYS.adminKey);
        resetAdminState('Backend changed. Re-enter the admin key for the new server.');
        state.backendHealth = { status: 'unchecked', message: 'Backend URL changed. Test the new backend.', version: '', apiVersion: '', dbSchema: '', dbLatencyMs: 0, checkedAt: Date.now() };
        setStatus(`RWPH backend saved: ${raw}.`, 'good');
        showNotification('Settings Saved', 'RWPH backend URL saved.', 'good');
        renderSettingsTab();
    }

    async function testBackendConnection() {
        setBusy(true);
        state.backendHealth = { status: 'checking', message: `Testing ${getBackendUrl()}…`, version: '', apiVersion: '', dbSchema: '', dbLatencyMs: 0, checkedAt: Date.now() };
        if (state.open && state.tab === 'settings') renderSettingsTab();
        setStatus(`Testing RWPH backend at ${getBackendUrl()}…`);
        try {
            const data = await backendRequest('/health', { method: 'GET', timeout: 8000, retries: 2 });
            assertBackendCompatibility(data);
            const db = data?.checks?.database || {};
            const security = data?.security || {};
            state.backendHealth = { status: 'healthy', message: `Worker and MySQL are responding. Signed requests ${security.signedProtectedRequests ? 'ON' : 'OFF'}; replay protection ${security.replayProtection ? 'ON' : 'OFF'}.`, version: String(data?.version || ''), apiVersion: String(data?.apiVersion || ''), dbSchema: String(db.schemaVersion || ''), dbLatencyMs: Number(db.latencyMs || 0), checkedAt: Date.now() };
            setStatus(`RWPH backend healthy — server ${data?.version || '?'}, API ${data?.apiVersion || '?'}, DB schema ${db.schemaVersion || '?'}, DB ${Number.isFinite(Number(db.latencyMs)) ? `${db.latencyMs}ms` : 'online'}.`, 'good');
        } catch (err) {
            const code = String(err?.code || '');
            const status = code === 'API_VERSION_MISMATCH' ? 'version' : code.startsWith('DATABASE_') || code === 'HYPERDRIVE_NOT_CONFIGURED' ? 'database' : 'offline';
            state.backendHealth = { status, message: err.message || String(err), version: '', apiVersion: '', dbSchema: '', dbLatencyMs: 0, checkedAt: Date.now() };
            setStatus(`Backend test failed: ${err.message || String(err)}`, 'bad');
            showNotification('Backend Error', err.message || String(err), 'bad');
        } finally {
            setBusy(false);
            if (state.open && state.tab === 'settings') renderSettingsTab();
        }
    }

    function renderTab(tab) {
        if (state.reportLoading?.active && !state.reportLoading.complete && !state.reportLoading.failed) tab = 'war';
        state.tab = tab;
        document.querySelectorAll('.rwph-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        if ((tab === 'war' || tab === 'members') && !licenceIsActive()) {
            renderLicenceGate();
            return;
        }
        if (tab === 'war') renderWarTab();
        else if (tab === 'members') renderMemberManagementTab();
        else if (tab === 'settings') renderSettingsTab();
        else if (tab === 'admin') renderAdminTab();
        else renderHelpTab();
    }

    async function saveKey() {
        const input = document.querySelector('#rwph-api-key');
        const key = String(input?.value || '').trim();
        if (!key) {
            setStatus('Enter a Torn API key first.', 'bad');
            return;
        }
        gm.set(KEYS.apiKey, key);
        setBusy(true);
        setStatus('Testing Torn API key…');
        try {
            await loadIdentity();
            const licenceOk = await checkLicence(true);
            setStatus(`API key saved. Faction detected: ${state.faction?.name || 'Unknown'} [${state.faction?.id || '—'}]. Licence: ${licenceOk ? 'Active' : licenceStatusLabel()}.`, licenceOk ? 'good' : 'bad');
            showNotification('Settings Saved', `Torn API key saved for ${state.faction?.name || 'your faction'}.`, licenceOk ? 'good' : 'warn');
            renderSettingsTab();
        } catch (err) {
            gm.del(KEYS.apiKey);
            setStatus(`Key was not saved: ${err.message || String(err)}`, 'bad');
            showNotification('API Error', err.message || String(err), 'bad');
        } finally {
            setBusy(false);
        }
    }

    function deleteKey() {
        if (state.activeCachedReport) exitCachedReport(true, false);
        gm.del(KEYS.apiKey);
        state.faction = null;
        state.wars = [];
        state.selectedWar = null;
        state.attacks = [];
        state.incomingAttacks = [];
        state.reportRows = [];
        state.includedMembers = new Set();
        state.advancedIncludedMembers = new Set();
        state.paymentSessions = new Map();
        state.identity = null;
        clearLicenceSession();
        clearLicencePurchase();
        renderSettingsTab();
        setStatus('Saved Torn API key deleted from RWPH. Licence session cleared.', 'good');
        showNotification('Settings Saved', 'Saved Torn API key deleted and licence session cleared.', 'good');
    }

    let basicPreviewFrame = 0;
    let advancedPreviewFrame = 0;
    function scheduleBasicPayoutPreview() {
        if (basicPreviewFrame) return;
        const run = () => { basicPreviewFrame = 0; refreshBasicPayoutPreview(); };
        basicPreviewFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 0);
    }
    function scheduleAdvancedPayoutPreview() {
        if (advancedPreviewFrame) return;
        const run = () => { advancedPreviewFrame = 0; refreshAdvancedPayoutPreview(); };
        advancedPreviewFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 0);
    }

    function wireBodyActions() {
        const body = document.querySelector('#rwph-body');
        if (!body) return;

        body.querySelector('#rwph-war-select')?.addEventListener('change', e => chooseWar(e.target.value));
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'load-wars') loadWars();
                else if (action === 'use-war-times') useSelectedWarTimes();
                else if (action === 'calculate') buildReport();
                else if (action === 'reset') resetCurrent();
                else if (action === 'save-key') saveKey();
                else if (action === 'delete-key') deleteKey();
                else if (action === 'save-backend') saveBackendSettings();
                else if (action === 'test-backend') testBackendConnection();
                else if (action === 'save-theme') saveThemeSettings();
                else if (action === 'reset-theme') resetThemeSettings();
                else if (action === 'admin-verify') verifyAdminKey();
                else if (action === 'admin-clear-key') clearAdminKey();
                else if (action === 'admin-refresh-status') verifyAdminKey();
                else if (action === 'admin-search') adminSearchLicences(false);
                else if (action === 'admin-list-all') { const q = body.querySelector('#rwph-admin-search'); if (q) q.value = ''; state.admin.query = ''; adminSearchLicences(true); }
                else if (action === 'admin-grant') adminMutateLicence('grant');
                else if (action === 'admin-extend') adminMutateLicence('extend');
                else if (action === 'admin-revoke') adminMutateLicence('revoke');
                else if (action === 'admin-fill') { const id = body.querySelector('#rwph-admin-torn-id'); const name = body.querySelector('#rwph-admin-name'); if (id) id.value = String(btn.dataset.adminId || ''); if (name) name.value = String(btn.dataset.adminName || ''); adminSetMessage(`Selected Torn ID ${btn.dataset.adminId || ''} for licence management.`, state.admin.verified); }
                else if (action === 'check-licence') checkLicence(true).then(ok => { if (ok) { state.lastStatus = 'RWPH licence verified and active.'; if (state.open && state.tab === 'settings') renderSettingsTab(); else if (state.open) renderTab(state.tab); } });
                else if (action === 'create-purchase') createLicencePurchase(String(btn.dataset.purchaseMode || 'buy'));
                else if (action === 'check-purchase') checkLicencePurchase();
                else if (action === 'copy-purchase-recipient') { const o = state.licencePurchase || readLicencePurchase(); if (o) copyPaymentText(licencePurchaseRecipient(o)).then(ok => setStatus(ok ? 'Licence recipient copied.' : 'Could not copy recipient.', ok ? 'good' : 'bad')); }
                else if (action === 'copy-purchase-code') { const o = state.licencePurchase || readLicencePurchase(); if (o) copyPaymentText(o.paymentCode).then(ok => setStatus(ok ? 'Licence payment code copied.' : 'Could not copy payment code.', ok ? 'good' : 'bad')); }
                else if (action === 'new-purchase') { clearLicencePurchase(); setStatus('Previous licence order cleared. You can create a new order.', 'good'); renderTab(state.tab); }
                else if (action === 'open-licence-settings') renderTab('settings');
                else if (action === 'open-loading-results') openFinishedLoadingResults();
                else if (action === 'return-from-loading-error') returnFromLoadingError();
                else if (action === 'open-payments') openPaymentsPanel();
                else if (action === 'use-report-cache') activateReportCache(String(btn.dataset.cacheMode || currentPayoutMode()) === 'advanced' ? 'advanced' : 'basic');
                else if (action === 'delete-report-cache') deleteReportCache(String(btn.dataset.cacheMode || currentPayoutMode()) === 'advanced' ? 'advanced' : 'basic');
                else if (action === 'return-live-report') {
                    exitCachedReport(true, false);
                    setStatus('Returned to the live report. Cached snapshots remain available until they expire or are deleted.', 'good');
                    renderWarTab();
                }
                else if (action === 'open-members' || action === 'members-back-war') {
                    renderTab(action === 'open-members' ? 'members' : 'war');
                }
                else if (action === 'save-member-management') {
                    syncMemberManagementFromDom();
                    setStatus('Member Management saved. Adjustments will remain active for 20 minutes from this save.', 'good');
                    const status = document.getElementById('rwph-mm-status');
                    if (status) status.textContent = memberAdjustmentRemainingText();
                }
                else if (action === 'clear-member-management') {
                    clearMemberManagementState();
                    initialiseIncludedMembers();
                    setStatus('All Member Management adjustments for this war were cleared.', 'good');
                    renderMemberManagementTab();
                }
                else if (action === 'restore-member-adjustment') {
                    const id = Number(btn.dataset.memberId);
                    delete state.memberAdjustments[String(id)];
                    saveMemberManagementState();
                    const row = state.reportRows.find(r => Number(r.id) === id);
                    if (row) {
                        if (adjustedWarHits(row) > 0) state.includedMembers.add(id);
                        if ((adjustedWarHits(row) + Number(row.outsideHits || 0) + Number(row.assists || 0) + Number(row.retals || 0) + Number(row.enemyHospitals || 0) + Number(row.hospitalizedByEnemy || 0)) > 0) {
                            state.advancedIncludedMembers.add(id);
                        }
                    }
                    renderMemberManagementTab();
                }
                else if (action === 'reset-report-filters') {
                    state.reportFilters = defaultReportFilters();
                    saveReportFilters(state.reportFilters);
                    renderWarTab();
                    showNotification('Filters Reset', 'All report filters cleared.', 'good');
                }
                else if (action === 'recover-session') restoreRecoverySnapshot();
                else if (action === 'discard-recovery') discardRecoverySnapshot();
                else if (action === 'export-report') downloadExport();
                else if (action === 'copy-export') copyExportToClipboard();
                else if (action === 'export-default-columns') {
                    const allowed = new Set(exportColumnsForMode().map(column => column.id));
                    const ids = DEFAULT_EXPORT_COLUMNS.filter(id => allowed.has(id));
                    saveExportColumnIds(ids);
                    body.querySelectorAll('#rwph-export-columns input[data-export-column]').forEach(box => { box.checked = ids.includes(String(box.dataset.exportColumn || '')); });
                    const count = body.querySelector('#rwph-export-column-count'); if (count) count.textContent = `${ids.length} selected`;
                }
                else if (action === 'export-all-columns') {
                    const ids = exportColumnsForMode().map(column => column.id);
                    saveExportColumnIds(ids);
                    body.querySelectorAll('#rwph-export-columns input[data-export-column]').forEach(box => { box.checked = true; });
                    const count = body.querySelector('#rwph-export-column-count'); if (count) count.textContent = `${ids.length} selected`;
                }
                else if (action === 'apply-payout-preset') applyPayoutPreset(selectedPayoutPreset());
                else if (action === 'save-payout-preset') saveCurrentPayoutPreset();
                else if (action === 'delete-payout-preset') deleteSelectedPayoutPreset();
                else if (action === 'mode-basic') {
                    if (state.activeCachedReport) exitCachedReport(true, false);
                    state.payoutMode = 'basic';
                    gm.set(KEYS.payoutMode, 'basic');
                    renderWarTab();
                }
                else if (action === 'mode-advanced') {
                    if (state.activeCachedReport) exitCachedReport(true, false);
                    state.payoutMode = 'advanced';
                    gm.set(KEYS.payoutMode, 'advanced');
                    renderWarTab();
                }
                else if (action === 'select-all-members') {
                    state.includedMembers = new Set(state.reportRows.filter(r => !isMemberExcluded(r) && adjustedWarHits(r) > 0).map(r => Number(r.id)));
                    body.querySelectorAll('.rwph-member-check:not(:disabled)').forEach(cb => { cb.checked = true; });
                    refreshBasicPayoutPreview();
                }
                else if (action === 'clear-members') {
                    state.includedMembers = new Set();
                    body.querySelectorAll('.rwph-member-check:not(.rwph-advanced-member-check)').forEach(cb => { cb.checked = false; });
                    refreshBasicPayoutPreview();
                }
                else if (action === 'adv-select-all') {
                    state.advancedIncludedMembers = new Set(state.reportRows.filter(r => !isMemberExcluded(r) && (adjustedWarHits(r) + Number(r.outsideHits || 0) + Number(r.assists || 0) + Number(r.retals || 0) + Number(r.enemyHospitals || 0) + Number(r.hospitalizedByEnemy || 0)) > 0).map(r => Number(r.id)));
                    body.querySelectorAll('.rwph-advanced-member-check:not(:disabled)').forEach(cb => { cb.checked = true; });
                    refreshAdvancedPayoutPreview();
                }
                else if (action === 'adv-clear') {
                    state.advancedIncludedMembers = new Set();
                    body.querySelectorAll('.rwph-advanced-member-check').forEach(cb => { cb.checked = false; });
                    refreshAdvancedPayoutPreview();
                }
                else if (action === 'reset-ff-defaults') {
                    const defaults = {
                        'rwph-adv-ff-start': '1.00',
                        'rwph-adv-ff-step': '0.02',
                        'rwph-adv-ff': '0.01',
                        'rwph-adv-ff-cap': '3.00',
                    };
                    const enabled = body.querySelector('#rwph-adv-ff-enabled');
                    if (enabled) enabled.checked = true;
                    for (const [id, value] of Object.entries(defaults)) {
                        const el = body.querySelector(`#${id}`);
                        if (el) el.value = value;
                    }
                    refreshAdvancedPayoutPreview();
                }
            });
        });

        body.querySelectorAll('[data-rwph-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = String(btn.dataset.rwphSort || 'warHits');
                const current = state.reportSort || { key: 'warHits', direction: 'desc' };
                const defaultDirection = key === 'name' ? 'asc' : 'desc';
                state.reportSort = current.key === key
                    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
                    : { key, direction: defaultDirection };
                const startEl = body.querySelector('#rwph-start');
                const endEl = body.querySelector('#rwph-end');
                if (startEl) gm.set(KEYS.manualStart, startEl.value || '');
                if (endEl) gm.set(KEYS.manualEnd, endEl.value || '');
                if (currentPayoutMode() === 'advanced') saveAdvancedInputs();
                else saveBasicInputs();
                renderWarTab();
            });
        });

        body.querySelector('#rwph-preset-member-pool')?.addEventListener('input', e => {
            const split = normalizePoolSplit(e.target.value);
            const faction = body.querySelector('#rwph-preset-faction-pool');
            if (faction) faction.value = String(split.faction);
            savePoolSplit(split);
            if (state.reportRows.length && !state.activeCachedReport) {
                if (currentPayoutMode() === 'advanced') refreshAdvancedPayoutPreview();
                else refreshBasicPayoutPreview();
            }
        });

        ['rwph-filter-included','rwph-filter-excluded','rwph-filter-unselected'].forEach(id => body.querySelector(`#${id}`)?.addEventListener('change', () => { syncReportFiltersFromDom(); applyReportFiltersToDom(); }));
        ['rwph-filter-min-hits','rwph-filter-min-respect','rwph-filter-min-payout','rwph-filter-name','rwph-filter-id'].forEach(id => body.querySelector(`#${id}`)?.addEventListener('input', () => { syncReportFiltersFromDom(); applyReportFiltersToDom(); }));
        body.querySelector('#rwph-filter-contribution')?.addEventListener('change', () => { syncReportFiltersFromDom(); applyReportFiltersToDom(); });
        body.querySelector('#rwph-export-format')?.addEventListener('change', e => { gm.set(KEYS.exportFormat, String(e.target.value || 'csv')); });
        body.querySelector('#rwph-export-scope')?.addEventListener('change', e => { gm.set(KEYS.exportScope, String(e.target.value || 'filtered')); });
        body.querySelectorAll('#rwph-export-columns input[data-export-column]').forEach(box => box.addEventListener('change', () => {
            const ids = selectedExportColumnIdsFromDom();
            saveExportColumnIds(ids);
            const count = body.querySelector('#rwph-export-column-count'); if (count) count.textContent = `${ids.length} selected`;
        }));
        body.addEventListener('input', () => scheduleRecoverySnapshot('input'), { passive: true });
        body.addEventListener('change', () => scheduleRecoverySnapshot('change'), { passive: true });
        body.addEventListener('click', event => { if (event.target.closest?.('[data-action]')) scheduleRecoverySnapshot('action'); }, { passive: true });

        body.querySelectorAll('.rwph-member-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const id = Number(cb.dataset.memberId);
                if (cb.classList.contains('rwph-advanced-member-check')) {
                    if (cb.checked) state.advancedIncludedMembers.add(id);
                    else state.advancedIncludedMembers.delete(id);
                    refreshAdvancedPayoutPreview();
                } else {
                    if (cb.checked) state.includedMembers.add(id);
                    else state.includedMembers.delete(id);
                    refreshBasicPayoutPreview();
                }
            });
        });
        body.querySelector('#rwph-pay-per-hit')?.addEventListener('input', scheduleBasicPayoutPreview);
        body.querySelector('#rwph-payout-pool')?.addEventListener('input', scheduleBasicPayoutPreview);
        ['rwph-advanced-pool','rwph-adv-war','rwph-adv-outside','rwph-adv-retal','rwph-adv-assist','rwph-adv-own-hosp','rwph-adv-enemy-hosp','rwph-adv-ff-start','rwph-adv-ff-step','rwph-adv-ff','rwph-adv-ff-cap']
            .forEach(id => body.querySelector(`#${id}`)?.addEventListener('input', scheduleAdvancedPayoutPreview));
        body.querySelector('#rwph-adv-ff-enabled')?.addEventListener('change', scheduleAdvancedPayoutPreview);
        if (body.querySelector('#rwph-pay-per-hit')) refreshBasicPayoutPreview();
        if (body.querySelector('#rwph-advanced-pool')) refreshAdvancedPayoutPreview();
        applyReportFiltersToDom();
        if (state.busy) setBusy(true);
    }

    function openPanel() {
        if (document.querySelector('#rwph-overlay')) return;
        applyTheme();
        state.open = true;
        state.payoutMode = gm.get(KEYS.payoutMode, 'basic') === 'advanced' ? 'advanced' : 'basic';
        state.reportFilters = readSavedReportFilters();
        const overlay = document.createElement('div');
        overlay.id = 'rwph-overlay';
        overlay.innerHTML = `
            <div id="rwph-panel" role="dialog" aria-modal="true" aria-label="RWPH Ranked War Payout Helper">
                <div class="rwph-header">
                    <div class="rwph-brand">
                        <span class="rwph-panel-logo">RW</span>
                        <div><div class="rwph-title">${APP.name} — ${APP.fullName}</div><div class="rwph-subtitle">Version ${APP.version} · Modern UI</div></div>
                    </div>
                    <div class="rwph-spacer"></div>
                    <button class="rwph-close" data-action="close" title="Close">×</button>
                </div>
                <div class="rwph-tabs">
                    <button class="rwph-tab active" data-tab="war">Ranked War</button>
                    <button class="rwph-tab" data-tab="members">Member Management</button>
                    <button class="rwph-tab" data-tab="settings">Settings</button>
                    <button class="rwph-tab" data-tab="admin">Admin</button>
                    <button class="rwph-tab" data-tab="help">Help</button>
                </div>
                <div class="rwph-body" id="rwph-body"></div>
            </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('[data-action="close"]').addEventListener('click', closePanel);
        overlay.addEventListener('click', e => { if (e.target === overlay) closePanel(); });
        overlay.querySelectorAll('.rwph-tab').forEach(btn => btn.addEventListener('click', () => renderTab(btn.dataset.tab)));
        document.addEventListener('keydown', escClose, true);

        state.licencePurchase = readLicencePurchase();
        startLicenceCountdownTimer();
        backendRequest('/health', { method: 'GET', timeout: 8000, retries: 1 }).then(data => {
            assertBackendCompatibility(data);
            const db = data?.checks?.database || {};
            state.backendHealth = { status: 'healthy', message: 'Backend compatibility verified on open.', version: String(data?.version || ''), apiVersion: String(data?.apiVersion || ''), dbSchema: String(db.schemaVersion || ''), dbLatencyMs: Number(db.latencyMs || 0), checkedAt: Date.now() };
        }).catch(err => {
            const code = String(err?.code || '');
            const status = code === 'API_VERSION_MISMATCH' ? 'version' : code.startsWith('DATABASE_') ? 'database' : 'offline';
            state.backendHealth = { status, message: err.message || String(err), version: '', apiVersion: '', dbSchema: '', dbLatencyMs: 0, checkedAt: Date.now() };
        });
        if (state.updateInfo?.upgraded) { showNotification('RWPH Updated', `Updated from v${state.updateInfo.previousVersion} to v${APP.version}. Saved settings/caches were migrated automatically.`, 'good', 6500); state.updateInfo.upgraded = false; }
        state.licence = { ...state.licence, status: 'checking', checking: true, message: 'Checking RWPH licence on open…' };
        renderTab(state.tab);
        state.licence.checking = false;
        checkLicence(true).then(ok => {
            if (ok && getApiKey() && !state.wars.length && !state.busy && !readRecoverySnapshot()) loadWars();
            else if (ok && readRecoverySnapshot() && state.open && state.tab === 'war') renderWarTab();
        });
    }

    function escClose(e) {
        if (e.key === 'Escape') closePanel();
    }

    function closePanel() {
        saveRecoverySnapshot('panel-close');
        closePaymentsPanel();
        applyTheme();
        document.querySelector('#rwph-overlay')?.remove();
        document.removeEventListener('keydown', escClose, true);
        stopReportLoadingTimer();
        stopLicenceCountdownTimer();
        state.open = false;
    }

    function normalizedLauncherText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function launcherElementVisible(el) {
        if (!el || !el.isConnected || el.closest('#rwph-overlay, #rwph-payments-panel, #rwph-payment-return')) return false;
        const style = window.getComputedStyle?.(el);
        if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
        return !el.closest('[aria-hidden="true"]');
    }

    let cachedFactionHeader = null;
    function findFactionHeaderTarget() {
        if (!isFactionPage()) { cachedFactionHeader = null; return null; }
        if (cachedFactionHeader && normalizedLauncherText(cachedFactionHeader.textContent) === 'Faction' && launcherElementVisible(cachedFactionHeader)) return cachedFactionHeader;
        const selectors = [
            '[class*="titleContainer"] h4',
            '[class*="titleContainer"] h3',
            '[class*="titleContainer"] h2',
            '[class*="faction"] h4[class*="title"]',
            '[class*="faction"] h3[class*="title"]',
            'h4[class*="title"]',
            'h3[class*="title"]',
            'h4',
            'h3',
            'h2',
        ];
        const seen = new Set();
        for (const selector of selectors) {
            for (const el of document.querySelectorAll(selector)) {
                if (seen.has(el)) continue;
                seen.add(el);
                if (normalizedLauncherText(el.textContent) === 'Faction' && launcherElementVisible(el)) { cachedFactionHeader = el; return el; }
            }
        }
        cachedFactionHeader = null;
        return null;
    }

    function createLauncher() {
        const launcher = document.createElement('button');
        launcher.id = 'rwph-launcher';
        launcher.type = 'button';
        launcher.title = `${APP.fullName} v${APP.version}`;
        launcher.setAttribute('aria-label', `${APP.fullName} v${APP.version}`);
        launcher.innerHTML = '<span class="rwph-mark" aria-hidden="true">RW</span><span class="rwph-label">RWPH</span>';
        launcher.addEventListener('click', openPanel);
        return launcher;
    }

    function removeLauncher() {
        document.querySelector('#rwph-launcher')?.remove();
    }

    function ensureLauncher() {
        if (!isFactionPage()) {
            removeLauncher();
            return false;
        }

        const target = findFactionHeaderTarget();
        if (!target?.parentElement) {
            // v2.9.0 deliberately has no floating fallback. Torn often removes/recreates
            // the heading while rendering messages/sections; waiting prevents the launcher
            // from jumping to an unrelated viewport position.
            removeLauncher();
            return false;
        }

        let launcher = document.querySelector('#rwph-launcher');
        if (!launcher) launcher = createLauncher();

        if (target.nextElementSibling !== launcher || launcher.parentElement !== target.parentElement) {
            target.insertAdjacentElement('afterend', launcher);
        }
        return true;
    }

    let launcherFramePending = false;
    function scheduleLauncherRefresh() {
        if (launcherFramePending) return;
        launcherFramePending = true;
        const run = () => {
            launcherFramePending = false;
            ensureLauncher();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 0);
    }

    let lastHref = location.href;
    function routeCheck() {
        if (location.href !== lastHref) {
            lastHref = location.href;
            scheduleLauncherRefresh();
            ensurePaymentReturnPanel();
            if (/rwphPayment=1/i.test(String(location.href || ''))) tryPendingPaymentPrefill();
            if (!isFactionPage()) closePanel();
        }
    }

    const RUNTIME_KEY = '__RWPH_V350_RUNTIME__';
    for (const legacyRuntimeKey of ['__RWPH_V340_RUNTIME__', RUNTIME_KEY]) { try { window[legacyRuntimeKey]?.cleanup?.(); } catch (_) {} }
    const observer = new MutationObserver(() => {
        scheduleLauncherRefresh();
        routeCheck();
    });
    const onPageHide = () => saveRecoverySnapshot('pagehide');
    const onBeforeUnload = () => saveRecoverySnapshot('beforeunload');
    const routeTimer = setInterval(routeCheck, 1500);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', routeCheck);
    window.addEventListener('popstate', routeCheck);
    window.addEventListener('resize', scheduleLauncherRefresh, { passive: true });
    window.addEventListener('pagehide', onPageHide, { passive: true });
    window.addEventListener('beforeunload', onBeforeUnload, { passive: true });
    window[RUNTIME_KEY] = {
        version: APP.version,
        cleanup() {
            try { observer.disconnect(); } catch (_) {}
            clearInterval(routeTimer);
            window.removeEventListener('hashchange', routeCheck);
            window.removeEventListener('popstate', routeCheck);
            window.removeEventListener('resize', scheduleLauncherRefresh);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('beforeunload', onBeforeUnload);
            if (recoverySaveTimer) clearTimeout(recoverySaveTimer);
            stopReportLoadingTimer();
            stopLicenceCountdownTimer();
            cachedFactionHeader = null;
            removeLauncher();
        },
    };
    migrateStoredSettings();
    applyTheme();
    scheduleLauncherRefresh();
    ensurePaymentReturnPanel();
    tryPendingPaymentPrefill();
})();
