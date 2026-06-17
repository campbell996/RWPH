// ==UserScript==
// @name         Ranked War Payout Helper
// @namespace    RankedWarPayoutHelper
// @author       Evil_Panda_420
// @version      1.1.421
// @description  Server-side locked Torn ranked-war payout helper. Backend verifies license and calculates payouts.
// @license      Copyright BackFromTheDead_Gaming Campbell. All Rights Reserved. Personal use only. Redistribution, resale, or modified reposting is not permitted without permission.
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @grant        GM_download
// @grant        GM_setClipboard
// @connect      api.torn.com
// @connect      gooey-eagle-rentable.ngrok-free.dev
// ==/UserScript==
  // v1.1.310: replaced launcher and panel logos with the ranked-war payout logo asset.

(function () {
  "use strict";

  // v1.1.328: hardened Admin server response parsing, added ngrok browser-warning bypass headers, and made Admin errors show useful response previews.
  // v1.1.328: fixed Admin button binding with panel-scoped delegated handlers, and stopped Payments Accept Warning feedback from replacing the Payments Copy Panel contents.
  // v1.1.328: manual time windows now use a matched rankedwarreport for War Hits, members, Respect, and Total Respect when Torn exposes one in that window.
  // v1.1.313: Payments Copy Panel now requires Accept Warning before Name + ID/Amount prefill buttons unlock.
  // v1.1.410: Buy/Extend Licence now navigates the current Torn tab to the Xanax item-send page instead of opening a new tab.
  // v1.1.421: fixes exports with direct server form downloads, forces Payments to the parent Torn page, adds editable Advanced respect step/score settings, and restyles Member Management.
  // v1.1.417: replaced manual exclude text boxes with Member Management panels, saved per-member settings for 20 minutes, and added per-member hit removal support.
  // v1.1.416: PDA-safe CSV/HTML exports use server-backed direct download links plus copy-box fallbacks.
  // v1.1.415: hardened Results Export Html with native anchor download, server attachment fallback, and manual .html download link.
  // v1.1.414: PDA/phone launcher now uses compact logo-only header placement with icon/link fallback detection.
  // v1.1.413: Payments now navigate the current tab to faction vault, close other panels, and offer a 10-minute report reopen button.
  // v1.1.412: hardened decimal shorthand parsing for million/billion/trillion payout inputs.
  // v1.1.411: payout inputs accept shorthand like 346m/346.21m/346b/346t and format as $ with commas.
  // v1.1.409: phone/Torn PDA launcher now shows logo-only while desktop keeps the full text launcher.
  // v1.1.408: added a phone/Torn PDA launcher fallback on supported faction/report pages when the Faction Warfare header button is unavailable.
  // v1.1.407: fixed theme picker scrolling/move/resize and added distinct theme styles.
  // v1.1.406: added more panel theme/colour presets to the theme picker.
  // v1.1.405: fixed Results Export HTML downloads with parent-window/download fallbacks and themed RWPH popups.
  // v1.1.405: made the RWPH logo much larger in the header/top area of all script panels.
  // v1.1.403: first-time users automatically see the tutorial panel on supported Torn faction pages.
  // v1.1.402: added a built-in step-by-step tutorial to the Help tab.
  // v1.1.401: cleaned Licence Info panel wording so it no longer mentions the removed bonus system.
  // v1.1.400: launcher now mounts to the left of the top Faction Warfare button with logo and full text.
  // v1.1.399: launcher now anchors beside the actual Areas text and war-report URL detection is broader.
  // v1.1.398: fixed Areas launcher mounting with stronger Torn sidebar selectors and a faction-page fallback position.
  // v1.1.397: launcher is now a static Torn left-nav button beside Areas, shown only on faction and faction war report pages.
  // v1.1.396: removed the purchase bonus system entirely; Xanax payments add base licence days only.
  // v1.1.389: locked screen payment heading now correctly says each Xanax gives 15 licence days.
  // v1.1.386: loading tab keeps a smoother live progress display, closing the loading tab cancels the backend calculation, and war time fields moved into Basic/Advanced dropdowns.
  // v1.1.311: recoloured all panels/UI accents to match the ranked-war payout logo without changing layout.
  // v1.1.308: active licences unlock straight into the main panel after saved-key checks, and Basic/Advanced calculation dropdowns are compacted.
  // v1.1.307: compacted the visible API Key Notice under the locked and main API key fields.
  // v1.1.306: removed the Full API ToS / Key Usage Details dropdown from the locked Unlock panel while keeping the compact visible API notice.
  // v1.1.305: safely removed clearly unused script/server code and excluded the old .bak userscript copy from the package.
  // v1.1.303: removed the Full API ToS / Key Usage Details dropdown from the unlocked main Payout panel while keeping the compact visible API notice.
  // v1.1.302: API key terms are now shown as a permanent visible notice directly under API key fields.

  // Change this after hosting your backend online.
  // If you change this domain, update the @connect backend domain in the userscript header too.
  const PAYWALL_API_BASE = "https://gooey-eagle-rentable.ngrok-free.dev";

  const STORAGE_KEY = "rw_payout_helper_api_key";
  const PAYWALL_TOKEN_STORAGE_KEY = "rw_payout_helper_license_token";
  const LAUNCHER_CORNER_STORAGE_KEY = "rw_payout_helper_launcher_corner";
  const ADMIN_KEY_STORAGE_KEY = "rw_payout_helper_admin_key";
  const PENDING_PAYMENT_STORAGE_KEY = "rw_payout_helper_pending_payment";
  const XANAX_PAYMENT_HELPER_STORAGE_KEY = "rw_payout_helper_xanax_payment_helper";
  const PANEL_OPEN_STORAGE_KEY = "rw_payout_helper_panel_open";
  const PANEL_LAYOUT_STORAGE_KEY = "rw_payout_helper_panel_layout";
  const ACTIVE_TAB_STORAGE_KEY = "rw_payout_helper_active_tab";
  const PAYOUT_FORM_STATE_STORAGE_KEY = "rw_payout_helper_payout_form_state";
  const PAYOUT_FORM_SCHEMA_STORAGE_KEY = "rw_payout_helper_payout_form_schema_version";
  const PAY_ALL_ROWS_STORAGE_KEY = "rw_payout_helper_pay_all_rows";
  const PAY_ALL_ROWS_FALLBACK_STORAGE_KEY = "rw_payout_helper_pay_all_rows_fallback";
  const PAY_ALL_REPORT_REOPEN_STORAGE_KEY = "rw_payout_helper_recent_pay_all_report";
  const MEMBER_MANAGEMENT_STORAGE_KEY = "rw_payout_helper_member_management_v1";
  const MEMBER_MANAGEMENT_EXPIRY_MS = 20 * 60 * 1000;
  const PAY_ALL_REPORT_REOPEN_TTL_MS = 10 * 60 * 1000;
  const CROSS_TAB_POPUP_STORAGE_KEY = "rw_payout_helper_cross_tab_popup";
  const LICENSE_CHECK_RATE_STORAGE_KEY = "rw_payout_helper_license_check_rate_window";
  const LAST_RESULTS_STORAGE_KEY = "rw_payout_helper_last_results";
  const LAST_RESULTS_HTML_OPEN_STORAGE_KEY = "rw_payout_helper_last_results_html_open";
  const RESULTS_LOADING_PANEL_STATE_STORAGE_KEY = "rw_payout_helper_results_loading_panel_state";
  const PANEL_THEME_STORAGE_KEY = "rw_payout_helper_panel_theme_choice";
  const FIRST_TUTORIAL_SHOWN_STORAGE_KEY = "rw_payout_helper_first_tutorial_shown";
  const PENDING_PAYMENT_TTL_MS = 5 * 60 * 1000;
  const LAUNCHER_CORNERS = ["bottom-right", "bottom-left", "top-left", "top-right"];

  function rwphRememberOpenResultsPageHtml(html) {
    try {
      const value = String(html || "");
      if (!value || value.length < 1000) return;
      localStorage.setItem(LAST_RESULTS_HTML_OPEN_STORAGE_KEY, JSON.stringify({
        active: true,
        url: String(location.href || ""),
        createdAt: Date.now(),
        html: value
      }));
    } catch (e) {
      console.warn("RWPH could not remember open results page:", e);
    }
  }

  function rwphClearRememberedOpenResultsPage() {
    try { localStorage.removeItem(LAST_RESULTS_HTML_OPEN_STORAGE_KEY); } catch (_) {}
  }

  function rwphCurrentTopPageUrl() {
    try {
      if (window.top && window.top.location && window.top.location.href && String(window.top.location.href) !== "about:blank") {
        return String(window.top.location.href);
      }
    } catch (_) {}
    try {
      if (window.parent && window.parent.location && window.parent.location.href && String(window.parent.location.href) !== "about:blank") {
        return String(window.parent.location.href);
      }
    } catch (_) {}
    return String(location.href || "");
  }

  function rwphRememberResultsLoadingPanelState(state = {}) {
    try {
      const progressId = String(state.progressId || "").trim();
      const html = String(state.html || "");
      if (!progressId && !html) return;
      const current = rwphReadResultsLoadingPanelState(false) || {};
      localStorage.setItem(RESULTS_LOADING_PANEL_STATE_STORAGE_KEY, JSON.stringify({
        ...current,
        ...state,
        active: true,
        url: rwphCurrentTopPageUrl(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        progressId,
        startedAtMs: Number(state.startedAtMs || current.startedAtMs || Date.now()),
        type: String(state.type || current.type || (html ? "ready" : "loading")),
      }));
    } catch (e) {
      console.warn("RWPH could not remember results loading panel state:", e);
    }
  }

  function rwphReadResultsLoadingPanelState(validateAge = true) {
    try {
      const raw = localStorage.getItem(RESULTS_LOADING_PANEL_STATE_STORAGE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw);
      if (!stored || !stored.active) return null;
      const age = Date.now() - Number(stored.createdAt || stored.updatedAt || 0);
      if (validateAge && (!isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000)) {
        localStorage.removeItem(RESULTS_LOADING_PANEL_STATE_STORAGE_KEY);
        return null;
      }
      return stored;
    } catch (_) {
      return null;
    }
  }

  function rwphClearResultsLoadingPanelState() {
    try { localStorage.removeItem(RESULTS_LOADING_PANEL_STATE_STORAGE_KEY); } catch (_) {}
  }

  function rwphRestoreOpenResultsPageAfterRefresh() {
    try {
      try {
        const loadingRaw = localStorage.getItem(RESULTS_LOADING_PANEL_STATE_STORAGE_KEY);
        const loadingState = loadingRaw ? JSON.parse(loadingRaw) : null;
        if (loadingState && loadingState.active) return false;
      } catch (_) {}
      const raw = localStorage.getItem(LAST_RESULTS_HTML_OPEN_STORAGE_KEY);
      if (!raw) return false;
      const stored = JSON.parse(raw);
      if (!stored || !stored.active || !stored.html) return false;
      const age = Date.now() - Number(stored.createdAt || 0);
      if (!isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) {
        rwphClearRememberedOpenResultsPage();
        return false;
      }
      // v1.1.386: do not require exact URL match; iframe/panel exports may have saved about:blank as their URL.
      const html = String(stored.html || "");
      if (!/<html[\s>]/i.test(html) && !/<!doctype html/i.test(html)) return false;
      setTimeout(function() {
        try {
          document.open();
          document.write(html);
          document.close();
        } catch (e) {
          console.warn("RWPH could not restore results page after refresh:", e);
        }
      }, 0);
      return true;
    } catch (e) {
      console.warn("RWPH restore results page check failed:", e);
      return false;
    }
  }

  if (rwphRestoreOpenResultsPageAfterRefresh()) return;

    const PAYMENT_ITEM_ID = "206";
  const PAYMENT_ITEM_NAME = "Xanax";
  const PAYMENT_RECEIVER_NAME = "Evil_Panda_420";
  const PAYMENT_RECEIVER_ID = "3236276";
  const PAYMENT_RECEIVER_TEXT = `${PAYMENT_RECEIVER_NAME} [${PAYMENT_RECEIVER_ID}]`;
  const RWPH_LAUNCHER_LOGO_DATA_URI = "data:image/png;base64,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";

  let lastRows = [];
  let rwphPayAllInlineUndoStack = [];
  let lastSummary = {};
  let rwphLastResultsButtonTimer = null;

  function money(n) {
    return "$" + Math.round(Number(n || 0)).toLocaleString();
  }

  function rwphParseMoneyInput(raw) {
    const original = String(raw ?? "").trim();
    if (!original) return 0;
    const compact = original
      .toLowerCase()
      .replace(/[,\$\s_]/g, "");

    const match = compact.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(k|m|b|t)?$/);
    if (!match) {
      const fallback = Number(compact.replace(/[^0-9+\-.]/g, ""));
      return Number.isFinite(fallback) ? Math.round(fallback) : 0;
    }

    const sign = match[1] === "-" ? -1n : 1n;
    const wholeDigits = String(match[2] || "0").replace(/^0+(?=\d)/, "") || "0";
    const fractionDigits = String(match[3] ?? match[4] ?? "").replace(/\D/g, "");
    const suffix = match[5] || "";
    const multipliers = {
      k: 1000n,
      m: 1000000n,
      b: 1000000000n,
      t: 1000000000000n
    };
    const multiplier = multipliers[suffix] || 1n;
    const scale = BigInt("1" + "0".repeat(fractionDigits.length));
    const whole = BigInt(wholeDigits || "0");
    const fraction = BigInt(fractionDigits || "0");
    const rawScaled = (whole * scale) + fraction;
    const rounded = ((rawScaled * multiplier) + (scale / 2n)) / scale;
    const signed = rounded * sign;
    const asNumber = Number(signed);
    return Number.isFinite(asNumber) ? asNumber : 0;
  }

  function rwphFormatMoneyInputValue(raw) {
    return money(rwphParseMoneyInput(raw));
  }

  function rwphFormatMoneyInputElement(el) {
    if (!el) return 0;
    const value = rwphParseMoneyInput(el.value);
    el.value = money(value);
    return value;
  }

  function rwphGetMoneyInputNumber(el) {
    if (!el) return 0;
    return rwphParseMoneyInput(el.value);
  }

  function rwphPayoutMoneyInputIds() {
    return ["rw-total", "rw-total-overall", "rw-points-total", "rw-points-total-overall"];
  }

  function rwphAttachMoneyInputFormatting() {
    for (const id of rwphPayoutMoneyInputIds()) {
      const el = document.getElementById(id);
      if (!el || el.dataset.rwphMoneyReady === "1") continue;
      el.dataset.rwphMoneyReady = "1";
      el.setAttribute("inputmode", "decimal");
      el.setAttribute("autocomplete", "off");
      el.setAttribute("spellcheck", "false");
      el.setAttribute("placeholder", "$100,000,000 or 100m");
      const formatAndSave = () => {
        rwphFormatMoneyInputElement(el);
        rwphSavePayoutFormState();
        rwphScheduleAutoCacheCheck?.(700);
      };
      el.addEventListener("blur", formatAndSave);
      el.addEventListener("change", formatAndSave);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          formatAndSave();
          try { el.blur(); } catch (_) {}
        }
      });
    }
  }

  function rwphFormatPayoutMoneyInputs() {
    for (const id of rwphPayoutMoneyInputIds()) {
      const el = document.getElementById(id);
      if (el) rwphFormatMoneyInputElement(el);
    }
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));
  }


  function rwphPopupClamp(value, min, max) {
    const safeMin = Number.isFinite(Number(min)) ? Number(min) : 0;
    const safeMax = Number.isFinite(Number(max)) ? Number(max) : safeMin;
    if (safeMax < safeMin) return safeMin;
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : safeMin;
    return Math.min(Math.max(safeValue, safeMin), safeMax);
  }

  function rwphFindCurrentPopupAnchor(anchorEl) {
    const panelSelectors = [
      "#rw-payout-helper",
      "#rw-results-panel",
      "#rw-pay-all-panel",
      "#rwph-xanax-send-status",
      "#rw-wrong-payment-panel",
      "#rw-pay-all-copy-panel",
      ".rwph-floating-panel"
    ];
    const joined = panelSelectors.join(",");

    if (anchorEl && anchorEl.closest) {
      const panel = anchorEl.closest(joined);
      if (panel) return panel;
    }

    const active = document.activeElement;
    if (active && active.closest) {
      const panel = active.closest(joined);
      if (panel) return panel;
    }

    const visiblePanels = [];
    for (const selector of panelSelectors) {
      for (const panel of Array.from(document.querySelectorAll(selector))) {
        const rect = panel.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) visiblePanels.push(panel);
      }
    }

    visiblePanels.sort((a, b) => {
      const za = Number(getComputedStyle(a).zIndex) || 0;
      const zb = Number(getComputedStyle(b).zIndex) || 0;
      return zb - za;
    });
    return visiblePanels[0] || null;
  }

  function rwphEnsureInfoPopupStyle() {
    if (document.getElementById("rwph-info-popup-style")) return;
    const style = document.createElement("style");
    style.id = "rwph-info-popup-style";
    style.textContent = `
      .rwph-info-popup-stack {
        position: fixed !important;
        z-index: 2147483647 !important;
        display: grid !important;
        gap: 8px !important;
        pointer-events: none !important;
        font-family: Inter, Arial, sans-serif !important;
        max-height: min(42vh, 330px) !important;
        overflow: hidden !important;
      }
      .rwph-info-popup-panel {
        pointer-events: auto !important;
        position: relative !important;
        overflow: hidden !important;
        border-radius: 16px !important;
        border: 1px solid var(--rwph-popup-border, rgba(245, 158, 11, .42)) !important;
        background: var(--rwph-popup-bg, linear-gradient(135deg, rgba(3, 7, 18, .98), rgba(15, 23, 42, .97), rgba(8, 47, 73, .94))) !important;
        box-shadow: var(--rwph-popup-shadow, 0 18px 50px rgba(0, 0, 0, .52), 0 0 28px rgba(245, 158, 11, .2)) !important;
        color: #fff7ed !important;
        padding: 11px 34px 13px 14px !important;
        transform: translateY(-4px) scale(.985) !important;
        opacity: 0 !important;
        animation: rwph-info-popup-in .18s ease-out forwards !important;
      }
      .rwph-info-popup-panel::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 auto 0 0 !important;
        width: 4px !important;
        background: linear-gradient(180deg, #f59e0b, #f97316) !important;
        box-shadow: 0 0 14px rgba(245, 158, 11, .48) !important;
      }
      .rwph-info-popup-panel.rwph-info-popup-error { border-color: rgba(248, 113, 113, .52) !important; }
      .rwph-info-popup-panel.rwph-info-popup-error::before { background: linear-gradient(180deg, #fb7185, #f97316) !important; }
      .rwph-info-popup-panel.rwph-info-popup-warn { border-color: rgba(250, 204, 21, .52) !important; }
      .rwph-info-popup-panel.rwph-info-popup-warn::before { background: linear-gradient(180deg, #facc15, #f97316) !important; }
      .rwph-info-popup-title {
        margin: 0 0 5px 0 !important;
        color: #ffffff !important;
        font-size: 12px !important;
        line-height: 1.15 !important;
        font-weight: 950 !important;
        letter-spacing: .45px !important;
        text-transform: uppercase !important;
      }
      .rwph-info-popup-message {
        margin: 0 !important;
        color: #bdefff !important;
        font-size: 12px !important;
        line-height: 1.35 !important;
        font-weight: 800 !important;
        overflow-wrap: anywhere !important;
        white-space: pre-wrap !important;
      }
      .rwph-info-popup-close {
        position: absolute !important;
        top: 7px !important;
        right: 7px !important;
        width: 22px !important;
        height: 22px !important;
        display: grid !important;
        place-items: center !important;
        border: 1px solid rgba(148, 163, 184, .32) !important;
        border-radius: 999px !important;
        background: rgba(15, 23, 42, .86) !important;
        color: #fff7ed !important;
        cursor: pointer !important;
        font-size: 14px !important;
        line-height: 1 !important;
        font-weight: 950 !important;
      }
      .rwph-info-popup-close:hover {
        background: rgba(245, 158, 11, .18) !important;
        border-color: rgba(245, 158, 11, .52) !important;
      }
      .rwph-info-popup-timer {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        height: 2px !important;
        background: rgba(245, 158, 11, .76) !important;
        transform-origin: left center !important;
        animation: rwph-info-popup-timer var(--rwph-info-popup-ttl, 30s) linear forwards !important;
      }
      @keyframes rwph-info-popup-in { to { transform: translateY(0) scale(1); opacity: 1; } }
      @keyframes rwph-info-popup-timer { to { transform: scaleX(0); } }
      @media (max-width: 520px) {
        .rwph-info-popup-stack { width: calc(100vw - 20px) !important; left: 10px !important; }
        .rwph-info-popup-panel { border-radius: 14px !important; padding: 10px 32px 12px 12px !important; }
      }
    `;
    document.head.appendChild(style);
  }


  function rwphPopupThemeForMode(mode = "info") {
    try {
      const t = rwphGetPanelThemePreset(rwphGetPanelThemeKey());
      const safeMode = ["info", "warn", "error"].includes(mode) ? mode : "info";
      const accent = safeMode === "error" ? "#fb7185" : (safeMode === "warn" ? "#facc15" : t.accent);
      const accent2 = safeMode === "error" ? "#f97316" : (safeMode === "warn" ? t.accent2 : t.accent2);
      return {
        ...t,
        accent,
        accent2,
        background: `linear-gradient(135deg, ${t.bg}, ${t.panel}, ${t.panel2})`,
        buttonBg: `linear-gradient(180deg, ${t.panel3}, ${t.panel})`,
        border: safeMode === "error" ? "rgba(248,113,113,.72)" : (safeMode === "warn" ? "rgba(250,204,21,.72)" : t.line2),
        title: t.text || "#ffffff",
        message: t.soft || t.text || "#ffffff",
        text: t.text || "#ffffff",
        shadow: `0 18px 55px rgba(0,0,0,.62), 0 0 32px ${accent}33`,
      };
    } catch (_) {
      return {
        bg: "#130b07", panel: "#211714", panel2: "#2b1d18", panel3: "#3a241c",
        line: "rgba(184,136,89,.46)", line2: "rgba(251,191,36,.40)",
        text: "#fff2dd", soft: "#cfaa8e", accent: "#fbbf24", accent2: "#f97316",
        background: "linear-gradient(135deg,#130b07,#211714,#2b1d18)",
        buttonBg: "linear-gradient(180deg,#3a241c,#211714)",
        border: "rgba(251,191,36,.40)", title: "#fff2dd", message: "#cfaa8e",
        shadow: "0 18px 55px rgba(0,0,0,.62), 0 0 32px rgba(251,191,36,.22)",
      };
    }
  }

  function rwphShowToast(message, mode = "info", ttlMs = 30000, title = "RWPH Info", anchorEl = null) {
    try {
      rwphEnsureInfoPopupStyle();
      const safeMode = ["info", "warn", "error"].includes(mode) ? mode : "info";
      const ttl = Math.max(30000, Number(ttlMs) || 30000);
      const popupTheme = rwphPopupThemeForMode(safeMode);
      const accent = popupTheme.accent;
      const popupId = "rwph-info-popup-panel-live";
      const oldPopup = document.getElementById(popupId);
      if (oldPopup) {
        if (oldPopup.__rwphRemoveTimer) clearTimeout(oldPopup.__rwphRemoveTimer);
        if (oldPopup.__rwphPositionPopup) {
          window.removeEventListener("resize", oldPopup.__rwphPositionPopup);
          window.removeEventListener("scroll", oldPopup.__rwphPositionPopup, true);
        }
        oldPopup.remove();
      }

      const popup = document.createElement("div");
      popup.id = popupId;
      popup.className = `rwph-info-popup-panel rwph-info-popup-${safeMode}`;
      popup.setAttribute("role", "status");
      popup.setAttribute("aria-live", safeMode === "error" ? "assertive" : "polite");
      popup.style.setProperty("position", "fixed", "important");
      popup.style.setProperty("z-index", "2147483647", "important");
      popup.style.setProperty("box-sizing", "border-box", "important");
      popup.style.setProperty("pointer-events", "auto", "important");
      popup.style.setProperty("display", "block", "important");
      popup.style.setProperty("visibility", "hidden", "important");
      popup.style.setProperty("opacity", "1", "important");
      popup.style.setProperty("transform", "none", "important");
      popup.style.setProperty("overflow", "hidden", "important");
      popup.style.setProperty("border-radius", "16px", "important");
      popup.style.setProperty("padding", "12px 38px 15px 16px", "important");
      popup.style.setProperty("background", popupTheme.background, "important");
      popup.style.setProperty("--rwph-popup-bg", popupTheme.background);
      popup.style.setProperty("border", `1px solid ${popupTheme.border}`, "important");
      popup.style.setProperty("--rwph-popup-border", popupTheme.border);
      popup.style.setProperty("box-shadow", popupTheme.shadow, "important");
      popup.style.setProperty("--rwph-popup-shadow", popupTheme.shadow);
      popup.style.setProperty("color", popupTheme.text, "important");
      popup.style.setProperty("--rwph-popup-text", popupTheme.text);
      popup.style.setProperty("font-family", "Inter, Arial, sans-serif", "important");

      const leftBar = document.createElement("div");
      leftBar.style.setProperty("position", "absolute", "important");
      leftBar.style.setProperty("inset", "0 auto 0 0", "important");
      leftBar.style.setProperty("width", "4px", "important");
      leftBar.style.setProperty("background", `linear-gradient(180deg, ${accent}, ${popupTheme.accent2})`, "important");
      leftBar.style.setProperty("box-shadow", `0 0 14px ${accent}66`, "important");

      const close = document.createElement("button");
      close.type = "button";
      close.setAttribute("aria-label", "Close RWPH info popup");
      close.textContent = "×";
      close.style.setProperty("position", "absolute", "important");
      close.style.setProperty("top", "10px", "important");
      close.style.setProperty("right", "12px", "important");
      close.style.setProperty("width", "36px", "important");
      close.style.setProperty("height", "36px", "important");
      close.style.setProperty("min-width", "36px", "important");
      close.style.setProperty("min-height", "36px", "important");
      close.style.setProperty("display", "grid", "important");
      close.style.setProperty("place-items", "center", "important");
      close.style.setProperty("border", `1px solid ${popupTheme.line2 || popupTheme.border}`, "important");
      close.style.setProperty("border-left", `4px solid ${accent}`, "important");
      close.style.setProperty("border-radius", "14px", "important");
      close.style.setProperty("background", popupTheme.buttonBg, "important");
      close.style.setProperty("color", popupTheme.text, "important");
      close.style.setProperty("cursor", "pointer", "important");
      close.style.setProperty("font", "950 20px/1 Arial,Helvetica,sans-serif", "important");
      close.style.setProperty("z-index", "2", "important");

      const titleEl = document.createElement("div");
      titleEl.textContent = String(title || "RWPH Info");
      titleEl.style.setProperty("margin", "0 0 6px 0", "important");
      titleEl.style.setProperty("color", popupTheme.title, "important");
      titleEl.style.setProperty("font-size", "12px", "important");
      titleEl.style.setProperty("line-height", "1.15", "important");
      titleEl.style.setProperty("font-weight", "950", "important");
      titleEl.style.setProperty("letter-spacing", ".45px", "important");
      titleEl.style.setProperty("text-transform", "uppercase", "important");

      const msgEl = document.createElement("div");
      msgEl.textContent = String(message || "Done.");
      msgEl.style.setProperty("margin", "0", "important");
      msgEl.style.setProperty("color", popupTheme.message, "important");
      msgEl.style.setProperty("font-size", "12px", "important");
      msgEl.style.setProperty("line-height", "1.38", "important");
      msgEl.style.setProperty("font-weight", "800", "important");
      msgEl.style.setProperty("overflow-wrap", "anywhere", "important");
      msgEl.style.setProperty("white-space", "pre-wrap", "important");
      msgEl.style.setProperty("max-height", "min(26vh, 180px)", "important");
      msgEl.style.setProperty("overflow", "auto", "important");
      msgEl.style.setProperty("padding-right", "2px", "important");

      const timerBar = document.createElement("div");
      timerBar.style.setProperty("position", "absolute", "important");
      timerBar.style.setProperty("left", "0", "important");
      timerBar.style.setProperty("right", "0", "important");
      timerBar.style.setProperty("bottom", "0", "important");
      timerBar.style.setProperty("height", "3px", "important");
      timerBar.style.setProperty("background", accent, "important");
      timerBar.style.setProperty("transform-origin", "left center", "important");
      timerBar.style.setProperty("animation", `rwph-info-popup-timer ${ttl}ms linear forwards`, "important");

      popup.appendChild(leftBar);
      popup.appendChild(close);
      popup.appendChild(titleEl);
      popup.appendChild(msgEl);
      popup.appendChild(timerBar);
      (document.body || document.documentElement).appendChild(popup);

      const removePopup = () => {
        if (!popup.isConnected) return;
        window.removeEventListener("resize", positionPopup);
        window.removeEventListener("scroll", positionPopup, true);
        if (popup.__rwphRemoveTimer) clearTimeout(popup.__rwphRemoveTimer);
        popup.remove();
      };

      const positionPopup = () => {
        if (!popup.isConnected) return;
        const margin = 10;
        const livePanel = rwphFindCurrentPopupAnchor(anchorEl);
        const rect = livePanel && livePanel.getBoundingClientRect ? livePanel.getBoundingClientRect() : null;
        const viewportW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0, 320);
        const viewportH = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0, 240);
        let width = Math.min(430, viewportW - margin * 2);
        if (rect && rect.width > 20 && rect.height > 20) {
          width = Math.min(Math.max(280, Math.min(rect.width, 430)), viewportW - margin * 2);
        }
        popup.style.setProperty("width", `${Math.round(width)}px`, "important");
        const popupHeight = Math.max(86, popup.offsetHeight || 110);

        let left = viewportW - width - 18;
        let top = viewportH - popupHeight - 18;
        if (rect && rect.width > 20 && rect.height > 20) {
          left = rwphPopupClamp(rect.left, margin, viewportW - width - margin);
          top = rect.bottom + margin;
          if (top + popupHeight + margin > viewportH) {
            top = rwphPopupClamp(viewportH - popupHeight - margin, margin, viewportH - popupHeight - margin);
          }
        }

        popup.style.setProperty("left", `${Math.round(left)}px`, "important");
        popup.style.setProperty("top", `${Math.round(top)}px`, "important");
        popup.style.setProperty("right", "auto", "important");
        popup.style.setProperty("bottom", "auto", "important");
        popup.style.setProperty("visibility", "visible", "important");
      };

      popup.__rwphPositionPopup = positionPopup;
      close.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        removePopup();
      }, { once: true });
      window.addEventListener("resize", positionPopup, { passive: true });
      window.addEventListener("scroll", positionPopup, { passive: true, capture: true });
      positionPopup();
      setTimeout(positionPopup, 60);
      popup.__rwphRemoveTimer = setTimeout(removePopup, ttl);
      return popup;
    } catch (err) {
      console.warn("RWPH popup panel failed:", err);
      try {
        const fallback = document.createElement("div");
        fallback.textContent = `${title || "RWPH"}: ${message || "Done."}`;
        fallback.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483647;max-width:min(420px,calc(100vw - 28px));padding:12px 16px;border-radius:14px;background:#020617;color:#fff7ed;border:1px solid #f59e0b;font:800 12px/1.35 Arial,sans-serif;box-shadow:0 18px 55px rgba(0,0,0,.6);white-space:pre-wrap;overflow-wrap:anywhere;";
        (document.body || document.documentElement).appendChild(fallback);
        setTimeout(() => fallback.remove(), 30000);
        return fallback;
      } catch (_) {
        return null;
      }
    }
  }

  function rwphCanWriteStatusText(statusEl) {
    if (!statusEl || !statusEl.isConnected) return false;
    try {
      if (statusEl === document.body || statusEl === document.documentElement) return false;
      if (statusEl.matches?.("button, input, textarea, select, option, summary")) return false;
      if (statusEl.matches?.("#rw-payout-helper, #rw-pay-all-panel, .rw-pay-all-panel, .rw-results-panel, .rw-pay-all-row, .rw-pay-all-list, .rw-admin-box, .rw-how-box")) return false;
      const id = String(statusEl.id || "").toLowerCase();
      const cls = String(statusEl.className || "").toLowerCase();
      if (/status|message|feedback|cache|code|summary/.test(id)) return true;
      if (/rw-muted|status|message|feedback|cache/.test(cls)) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function rwphSetStatusReadyText(statusEl, readyText = "Ready.") {
    if (rwphCanWriteStatusText(statusEl)) statusEl.textContent = readyText;
  }

  function rwphToastPanelInfo(statusEl, message, mode = "info", title = "RWPH Info", readyText = "Ready.") {
    rwphShowToast(message, mode, 30000, title, statusEl);
    rwphSetStatusReadyText(statusEl, readyText);
  }

  function rwphToastPanelError(statusEl, message, title = "RWPH Error", readyText = "Ready.") {
    rwphShowToast(message, "error", 30000, title, statusEl);
    rwphSetStatusReadyText(statusEl, readyText);
  }

  function rwphQueueCrossTabPopup(context, message, mode = "info", title = "RWPH Info") {
    try {
      const payload = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        context: String(context || "general"),
        message: String(message || "Done."),
        mode: ["info", "warn", "error"].includes(mode) ? mode : "info",
        title: String(title || "RWPH Info"),
        createdAt: Date.now(),
      };
      GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, JSON.stringify(payload));
      return payload.id;
    } catch (e) {
      console.warn("Could not queue RWPH popup for new tab:", e);
      return "";
    }
  }

  function rwphClearCrossTabPopup(expectedContext = "") {
    try {
      if (!expectedContext) {
        GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
        return;
      }
      const raw = GM_getValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
      const payload = raw ? JSON.parse(raw) : null;
      if (!payload || payload.context === expectedContext) GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
    } catch (_) {
      GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
    }
  }

  function rwphConsumeCrossTabPopup(context, anchorElOrSelector = null, delayMs = 350) {
    try {
      const raw = GM_getValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
      if (!raw) return false;
      const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!payload || !payload.message) return false;
      if (Date.now() - Number(payload.createdAt || 0) > 2 * 60 * 1000) {
        GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
        return false;
      }
      const wanted = Array.isArray(context) ? context.map(String) : [String(context || "general")];
      if (!wanted.includes(String(payload.context || "general")) && !wanted.includes("*")) return false;
      GM_setValue(CROSS_TAB_POPUP_STORAGE_KEY, "");
      setTimeout(() => {
        let anchor = null;
        if (typeof anchorElOrSelector === "string") anchor = document.querySelector(anchorElOrSelector);
        else anchor = anchorElOrSelector;
        rwphShowToast(payload.message, payload.mode || "info", 30000, payload.title || "RWPH Info", anchor);
      }, Math.max(0, Number(delayMs) || 0));
      return true;
    } catch (e) {
      console.warn("Could not consume RWPH popup for new tab:", e);
      return false;
    }
  }

  async function copyText(value) {
    const text = String(value ?? "");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn("Clipboard API failed, trying fallback copy:", e);
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } finally {
      textarea.remove();
    }

    if (!ok) {
      throw new Error("Copy failed. Your browser blocked clipboard access.");
    }

    return true;
  }

  function toDateTimeLocalValue(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function dateTimeLocalToUnix(value) {
    if (!value) return 0;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
  }

  function readableTime(unixSeconds) {
    return new Date(unixSeconds * 1000).toLocaleString();
  }

  function savePendingPayment(result) {
    if (!result || !result.code) return;

    const createdAtMs = Number(result.createdAtMs || (Number(result.createdAt || 0) ? Number(result.createdAt) * 1000 : 0)) || Date.now();
    const expiresAtMs = Number(result.expiresAtMs || (Number(result.expiresAt || 0) ? Number(result.expiresAt) * 1000 : 0)) || (Date.now() + PENDING_PAYMENT_TTL_MS);

    const pending = {
      code: String(result.code),
      instructions: String(result.instructions || ""),
      tornId: result.tornId ? String(result.tornId) : "",
      name: result.name ? String(result.name) : "",
      createdAtMs,
      expiresAtMs,
      source: String(result.source || "database-pending-payment"),
      databaseBacked: true,
    };

    GM_setValue(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(pending));
  }

  function clearPendingPayment() {
    GM_setValue(PENDING_PAYMENT_STORAGE_KEY, "");
  }

  function getPendingPayment() {
    let raw = "";
    try {
      raw = GM_getValue(PENDING_PAYMENT_STORAGE_KEY, "");
      if (!raw) return null;
      const pending = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!pending || !pending.code || !pending.expiresAtMs) return null;

      // v1.1.224: old browser-only pending payment records are not accepted as truth.
      // A current payment code must have come from /api/paywall/start or /api/paywall/pending.
      if (!pending.databaseBacked && pending.source !== "database-pending-payment") {
        clearPendingPayment();
        GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
        return null;
      }

      if (Date.now() > Number(pending.expiresAtMs)) {
        clearPendingPayment();
        GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
        return null;
      }

      return pending;
    } catch (e) {
      console.warn("Could not read saved payment code:", e);
      clearPendingPayment();
      return null;
    }
  }

  function pendingPaymentMinutesLeft(pending) {
    if (!pending) return 0;
    return Math.max(0, Math.ceil((Number(pending.expiresAtMs) - Date.now()) / 60000));
  }

  function rwphFormatCountdownMs(msLeft) {
    const totalSeconds = Math.max(0, Math.ceil(Number(msLeft || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function rwphFormatExpiryClock(expiresAtMs) {
    const exp = Number(expiresAtMs || 0);
    if (!exp) return "unknown time";
    try {
      return new Date(exp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (_) {
      return new Date(exp).toLocaleTimeString();
    }
  }

  function rwphUpdateExpiryTimers() {
    const nodes = Array.from(document.querySelectorAll("[data-rwph-expire-at]"));
    for (const node of nodes) {
      const expiresAtMs = Number(node.dataset.rwphExpireAt || 0);
      const msLeft = expiresAtMs - Date.now();
      const count = node.querySelector("[data-rwph-expire-count]");
      const clock = node.querySelector("[data-rwph-expire-clock]");
      if (count) count.textContent = msLeft <= 0 ? "expired" : rwphFormatCountdownMs(msLeft);
      if (clock) clock.textContent = expiresAtMs ? `at ${rwphFormatExpiryClock(expiresAtMs)}` : "";
      node.classList.toggle("rwph-expired", msLeft <= 0);
    }
  }

  function rwphStartExpiryTimer() {
    rwphUpdateExpiryTimers();
    if (window.__rwphExpiryTimer) return;
    window.__rwphExpiryTimer = setInterval(rwphUpdateExpiryTimers, 1000);
  }

  function rwphPaymentExpiryHtml(expiresAtMs, className = "rw-payment-expiry") {
    const exp = Number(expiresAtMs || 0);
    const left = rwphFormatCountdownMs(exp - Date.now());
    const clock = rwphFormatExpiryClock(exp);
    return `<div class="${className}" data-rwph-expire-at="${exp}"><b>Expires in:</b> <span data-rwph-expire-count>${esc(left)}</span> <span class="rwph-expire-clock" data-rwph-expire-clock>at ${esc(clock)}</span></div>`;
  }

  function rwphPaymentExpiryForCode(code) {
    const normalizedCode = String(code || "");
    const pending = getPendingPayment();
    if (pending?.code && String(pending.code) === normalizedCode && Number(pending.expiresAtMs || 0) > Date.now()) {
      return Number(pending.expiresAtMs);
    }

    // v1.1.224: do not use browser-only helper storage as payment truth.
    return 0;
  }

  function saveXanaxPaymentHelper(code) {
    if (!code) return false;
    const normalizedCode = String(code);
    const pending = getPendingPayment();
    const expiryFromMainPaymentCard = pending?.code && String(pending.code) === normalizedCode
      ? Number(pending.expiresAtMs || 0)
      : 0;
    const expiresAtMs = expiryFromMainPaymentCard > Date.now()
      ? expiryFromMainPaymentCard
      : rwphPaymentExpiryForCode(normalizedCode);

    if (!pending || String(pending.code) !== normalizedCode || !expiresAtMs) {
      GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
      return false;
    }

    const payload = {
      code: normalizedCode,
      receiverId: PAYMENT_RECEIVER_ID,
      receiverName: PAYMENT_RECEIVER_NAME,
      receiverText: PAYMENT_RECEIVER_TEXT,
      itemId: PAYMENT_ITEM_ID,
      itemName: PAYMENT_ITEM_NAME,
      createdAtMs: pending.createdAtMs || Date.now(),
      expiresAtMs,
      source: pending.source || "database-pending-payment",
      databaseBacked: true,
    };
    GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, JSON.stringify(payload));
    return true;
  }

  function getXanaxPaymentHelper() {
    try {
      const raw = GM_getValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
      if (!raw) return null;
      const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!payload || !payload.code || !payload.expiresAtMs) return null;
      if (!payload.databaseBacked && payload.source !== "database-pending-payment") {
        GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
        return null;
      }
      if (Date.now() > Number(payload.expiresAtMs)) {
        GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
        return null;
      }
      return payload;
    } catch (e) {
      console.warn("Could not read Xanax payment helper storage:", e);
      GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
      return null;
    }
  }

  function buildXanaxPaymentUrl(code) {
    const params = new URLSearchParams({
      rwphSendXanax: "1",
      rwphCode: String(code || ""),
      rwphTo: PAYMENT_RECEIVER_ID,
      rwphName: PAYMENT_RECEIVER_NAME,
      rwphItemId: PAYMENT_ITEM_ID,
      step: "inventory",
    });

    return `https://www.torn.com/item.php?${params.toString()}#inventory`;
  }

  function preOpenXanaxPaymentTab() {
    try {
      const tab = window.open("about:blank", "_blank");
      if (!tab) return null;
      try {
        tab.document.open();
        tab.document.write(`<!doctype html><html><head><title>RWPH Payment Helper</title><style>body{margin:0;background:#111;color:#ddd;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center}div{padding:22px;border:1px solid #444;border-radius:12px;background:#1b1b1b;box-shadow:0 12px 35px rgba(0,0,0,.45)}b{color:#fff}</style></head><body><div><b>RWPH</b><br>Checking payment code...</div></body></html>`);
        tab.document.close();
      } catch (_) {}
      return tab;
    } catch (_) {
      return null;
    }
  }

  function closePreOpenedPaymentTab(tab) {
    try {
      if (tab && !tab.closed) tab.close();
    } catch (_) {}
  }

  function openXanaxPaymentPage(code, preOpenedTab = null) {
    sessionStorage.removeItem("rwph_xanax_helper_closed");
    saveXanaxPaymentHelper(code);
    GM_setValue("rwph_xanax_helper_open_request", JSON.stringify({ code: String(code || ""), createdAtMs: Date.now(), source: "open-xanax-payment-page" }));
    copyText(`Send ${PAYMENT_ITEM_NAME} to ${PAYMENT_RECEIVER_TEXT} with message: ${code}`).catch(() => false);
    const url = buildXanaxPaymentUrl(code);

    // v1.1.410: Buy/Extend should not open a popup or new tab. Navigate the current Torn tab.
    try {
      if (window.location && typeof window.location.assign === "function") {
        window.location.assign(url);
      } else {
        window.location.href = url;
      }
      return true;
    } catch (e) {
      console.warn("Could not navigate current tab to Xanax payment page:", e);
      try {
        window.location.href = url;
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  function rwphOpenPaymentHelperFromPendingResult(result, paymentTab, status, codeBox, mode = "unlock") {
    if (!result || !result.code) return false;

    savePendingPayment(result);
    saveXanaxPaymentHelper(result.code);

    const pending = getPendingPayment();
    const existingText = result.existingPending
      ? "Existing pending payment code found. Opening the Xanax Payment Helper in this tab instead of creating a new code."
      : "Payment code ready. Opening the Xanax send page in this tab. RWPH will check automatically after you send the Xanax.";
    const helperMessage = result.instructions || existingText;

    rwphQueueCrossTabPopup("xanax-payment", helperMessage, "info", "RWPH Payment");
    if (codeBox) {
      codeBox.innerHTML = renderPaymentCodeCard(
        result.code,
        result.existingPending
          ? "Existing database payment code restored. Auto-check is running."
          : "Saved for 5 minutes. Auto-check is running. Xanax page should now be open.",
        pending?.expiresAtMs
      );
    }

    const openedPaymentHelper = openXanaxPaymentPage(result.code, paymentTab);
    if (!openedPaymentHelper) {
      rwphClearCrossTabPopup("xanax-payment");
      rwphToastPanelInfo(status, "Payment code is ready, but RWPH could not navigate to the Xanax send page. Click the helper button in the payment card.", "warn", "RWPH Payment");
    } else if (status) {
      status.textContent = result.existingPending ? "Existing Xanax Payment Helper is opening in this tab." : "Xanax Payment Helper is opening in this tab.";
    }

    updatePendingPaymentUi();
    startAutoPaymentCheck(getPaymentUserKey(), mode);
    return openedPaymentHelper;
  }

  function renderPaymentCodeCard(code, minutesLeftText = "Saved for 5 minutes.", expiresAtMs = 0) {
    const safeCode = esc(code || "");
    const exp = Number(expiresAtMs || (Date.now() + PENDING_PAYMENT_TTL_MS));
    setTimeout(rwphStartExpiryTimer, 0);
    return `
      <div class="rw-payment-card">
        <div class="rw-payment-title">Payment Code Ready</div>
        <div class="rw-payment-instruction">Send <b>1x or more ${esc(PAYMENT_ITEM_NAME)}</b> to:</div>
        <div class="rw-payment-recipient">${esc(PAYMENT_RECEIVER_TEXT)}</div>
        <div class="rw-payment-instruction">Use this exact message:</div>
        <div class="rw-payment-code">${safeCode}</div>
        ${rwphPaymentExpiryHtml(exp)}
        <div class="rw-payment-note">${esc(minutesLeftText)} RWPH only adds licence days when <b>${esc(PAYMENT_ITEM_NAME)}</b> is sent with the exact payment code as the message. Other items do not count. If you send ${esc(PAYMENT_ITEM_NAME)} without the code, it will need manual review. You still review and press Send yourself in Torn.</div>
        <button type="button" data-open-xanax-payment="${safeCode}">Open ${esc(PAYMENT_ITEM_NAME)} Send Page</button>
      </div>`;
  }

  function updatePendingPaymentUi() {
    const pending = getPendingPayment();
    const codeBox = document.getElementById("rw-paywall-code");
    const mainCodeBox = document.getElementById("rw-main-payment-code");
    const status = document.getElementById("rw-paywall-status");
    const mainStatus = document.getElementById("rw-status");

    for (const box of [codeBox, mainCodeBox].filter(Boolean)) {
      if (pending) {
        box.innerHTML = renderPaymentCodeCard(
          pending.code,
          `Saved payment code. Auto-check is running while this timer is active.`,
          pending.expiresAtMs
        );
      } else if (box.dataset?.rwphAutoPaymentBox === "1") {
        box.innerHTML = "";
      }
    }

    for (const box of [codeBox, mainCodeBox].filter(Boolean)) {
      if (box) box.dataset.rwphAutoPaymentBox = "1";
    }

    const waitMsg = pending
      ? (pending.instructions || `Waiting for Xanax payment with code ${pending.code}. RWPH checks automatically every few seconds.`)
      : "";

    if (status && pending && !String(status.textContent || "").includes("Checking automatically") && !String(status.textContent || "").includes("Unlocked")) {
      status.textContent = waitMsg;
    }
    if (mainStatus && pending && !String(mainStatus.textContent || "").includes("Checking automatically") && !String(mainStatus.textContent || "").includes("Licence extended")) {
      mainStatus.textContent = waitMsg;
    }
  }

  function stopAutoPaymentCheck() {
    if (window.__rwphPaymentAutoCheckTimer) {
      clearInterval(window.__rwphPaymentAutoCheckTimer);
      window.__rwphPaymentAutoCheckTimer = null;
    }
    window.__rwphPaymentAutoCheckState = null;
  }

  function getPaymentUserKey() {
    return (
      document.getElementById("rw-key")?.value.trim() ||
      document.getElementById("rw-paywall-key")?.value.trim() ||
      GM_getValue(STORAGE_KEY, "")
    );
  }

  function setPaymentStatus(message, mode = "unlock") {
    const status =
      mode === "extend"
        ? (document.getElementById("rw-status") || document.getElementById("rw-paywall-status"))
        : (document.getElementById("rw-paywall-status") || document.getElementById("rw-status"));
    if (status) status.textContent = message;
  }

  async function restorePendingPaymentFromDatabase(userKey, mode = "unlock") {
    const key = userKey || getPaymentUserKey();
    if (!key) {
      clearPendingPayment();
      updatePendingPaymentUi();
      return null;
    }

    try {
      const result = await apiPost("/api/paywall/pending", { userKey: key });
      if (result && result.pending && result.code) {
        savePendingPayment(result);
        saveXanaxPaymentHelper(result.code);
        updatePendingPaymentUi();
        startAutoPaymentCheck(key, mode);
        return result;
      }

      clearPendingPayment();
      GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
      updatePendingPaymentUi();
      return null;
    } catch (e) {
      // Do not trust a browser-only payment cache when the database lookup fails.
      clearPendingPayment();
      updatePendingPaymentUi();
      console.warn("Could not restore pending payment from backend/database:", e);
      return null;
    }
  }


  function closeWrongPaymentPanel() {
    document.getElementById("rw-wrong-payment-panel")?.remove();
  }

  function showWrongPaymentPanel(message) {
    closeWrongPaymentPanel();
    const panel = document.createElement("div");
    panel.id = "rw-wrong-payment-panel";
    panel.style.cssText = `
      position: fixed;
      z-index: 1000002;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(420px, calc(100vw - 24px));
      padding: 18px;
      padding-top: 56px;
      border-radius: 22px;
      border: 1px solid rgba(245,158,11,.35);
      background: radial-gradient(circle at top, rgba(37,99,235,.28), transparent 42%), linear-gradient(145deg, rgba(15,23,42,.98), rgba(30,41,59,.98));
      box-shadow: 0 24px 70px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.06) inset;
      color: #fff7ed;
      text-align: center;
      font-family: Inter, Segoe UI, Arial, sans-serif;
    `;
    panel.innerHTML = `
      <div class="rwph-floating-panel-head" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;font-weight:950;font-size:16px;color:#fff;cursor:move;touch-action:none;-webkit-user-select:none;user-select:none;">
        <img src="${RWPH_LAUNCHER_LOGO_DATA_URI}" alt="RWPH" style="width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(249,115,22,.70));pointer-events:none;" />
        <span>Payment Needs Manual Review</span>
      </div>
      <div class="rwph-floating-panel-body" style="font-size:12px;line-height:1.55;color:#c7e8ff;margin:8px 0 14px;overflow-y:auto;overflow-x:hidden;min-height:0;">
        ${esc(message || `You sent the payment wrong. Licence days are only automatically added when ${PAYMENT_ITEM_NAME} is sent with the exact payment code in the item message. Your licence will be manually added ASAP.`)}
      </div>
      <button id="rw-wrong-payment-close" type="button" title="Close" aria-label="Close">×</button>
    `;
    document.body.appendChild(panel);
    panel.querySelector("#rw-wrong-payment-close")?.addEventListener("click", closeWrongPaymentPanel);
    rwphEnablePanelMoveResize(panel, ".rwph-floating-panel-head");
  }

  async function autoCheckPaymentOnce(userKey, mode = "unlock") {
    const pending = getPendingPayment();
    if (!pending) {
      stopAutoPaymentCheck();
      updatePendingPaymentUi();
      return false;
    }

    if (!userKey) {
      setPaymentStatus("Paste and save your Torn API key so RWPH can auto-check your payment.", mode);
      return false;
    }

    try {
      setPaymentStatus(`Checking automatically for payment code ${pending.code}...`, mode);
      const result = await apiPost("/api/paywall/check", { userKey });

      if (!result.paid) {
        if (result.wrongPayment) {
          clearPendingPayment();
          stopAutoPaymentCheck();
          const msg = result.error || `Wrong payment detected. Licence days are only automatically added when ${PAYMENT_ITEM_NAME} is sent with the exact payment code. Your licence will be manually added ASAP.`;
          setPaymentStatus(msg, mode);
          updatePendingPaymentUi();
          showWrongPaymentPanel(msg);
          return false;
        }
        if (result.pending && result.code) savePendingPayment(result);
        else { clearPendingPayment(); GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, ""); }
        const mins = pendingPaymentMinutesLeft(getPendingPayment());
        setPaymentStatus(result.error || `Waiting for Xanax payment. Auto-checking every 15 seconds. Code expires in ${mins} minute(s).`, mode);
        updatePendingPaymentUi();
        return false;
      }

      clearPendingPayment();
      stopAutoPaymentCheck();
      GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);

      const paidQtyText = result.qty && result.addedDays
        ? ` ${result.qty}x Xanax detected = ${result.addedDays} licence day(s) added.`
        : "";

      const paywallCode = document.getElementById("rw-paywall-code");
      const mainCode = document.getElementById("rw-main-payment-code");
      if (paywallCode) paywallCode.innerHTML = "";
      if (mainCode) mainCode.innerHTML = "";

      if (mode === "extend" || document.getElementById("rw-key")) {
        const status = document.getElementById("rw-status") || document.getElementById("rw-paywall-status");
        rwphToastPanelInfo(status, `Licence extended.${paidQtyText}`, "info", "RWPH Payment");
        if (status) await showLicenseDays(status, { openPanel: true });
      } else {
        rwphShowToast(`Unlocked.${paidQtyText} Loading tool...`, "info", 10000, "RWPH Payment");
        setPaymentStatus("Ready.", mode);
        closePanel();
        createPanel();
      }

      return true;
    } catch (e) {
      setPaymentStatus("Auto payment check error: " + (e.message || e), mode);
      updatePendingPaymentUi();
      return false;
    }
  }

  function startAutoPaymentCheck(userKey, mode = "unlock") {
    const pending = getPendingPayment();
    if (!pending) {
      updatePendingPaymentUi();
      return;
    }

    const key = userKey || getPaymentUserKey();
    const stateKey = `${pending.code}|${mode}|${key || ""}`;
    if (window.__rwphPaymentAutoCheckState === stateKey && window.__rwphPaymentAutoCheckTimer) return;

    stopAutoPaymentCheck();
    window.__rwphPaymentAutoCheckState = stateKey;

    autoCheckPaymentOnce(key, mode);
    window.__rwphPaymentAutoCheckTimer = setInterval(() => {
      const activePending = getPendingPayment();
      if (!activePending) {
        stopAutoPaymentCheck();
        updatePendingPaymentUi();
        return;
      }
      autoCheckPaymentOnce(key, mode);
    }, 15000);
  }


  function rwphIsTornFactionPage() {
    try {
      const href = String(window.location?.href || "").toLowerCase();
      const path = String(window.location?.pathname || "").toLowerCase();
      const searchHash = `${String(window.location?.search || "")} ${String(window.location?.hash || "")}`.toLowerCase();
      if (path === "/factions.php" || path.endsWith("/factions.php")) return true;
      // Torn/PDA wrappers can preserve the Torn page inside query/hash routing instead of a clean pathname.
      if (/(?:^|[/?#&])factions\.php(?:$|[?#&=\/])/.test(href)) return true;
      if (/(?:sid|page|screen|route|name)=factions?\b/.test(searchHash)) return true;
      if (/(?:faction|factions)(?:main|home|profile|members|chains|armory|news|controls)?/.test(searchHash) && /torn|faction/.test(href)) return true;
      const titleText = String(document.title || "").toLowerCase();
      if (/\bfaction\b/.test(titleText) && /torn/.test(href)) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function rwphIsFactionWarReportPage() {
    try {
      const href = String(window.location?.href || "").toLowerCase();
      const path = String(window.location?.pathname || "").toLowerCase();
      const searchHash = `${String(window.location?.search || "")} ${String(window.location?.hash || "")}`.toLowerCase();

      // Torn has used a few different ranked-war/report URL shapes in desktop,
      // PDA, and hash-routed pages. Keep this broad enough for faction war
      // reports, but do not treat every normal Torn page as valid.
      if (/(ranked\s*war\s*report|faction\s*war\s*report)/.test(String(document.title || "").toLowerCase())) return true;
      if (/(rankedwarreport|ranked-war-report|ranked_war_report|rankreport|rankedreport|warreport|war-report|war_report|rwreport)/.test(href)) return true;
      if (/(rankedwarid|ranked_war_id|ranked-war-id|ranked_war|ranked-war|rankedwar|rankedwars|ranked_wars|ranked-wars)/.test(href) && /(report|war|faction|rank)/.test(href)) return true;
      if ((path === "/war.php" || path.endsWith("/war.php")) && /(rank|ranked|report|warreport|faction)/.test(searchHash)) return true;
      if ((path === "/factions.php" || path.endsWith("/factions.php")) && /(rank|ranked|war|report|rankreport|warreport)/.test(searchHash)) return true;

      const pageText = String(document.querySelector("h1,h2,[class*='title' i],[class*='header' i]")?.textContent || "").toLowerCase();
      return /(ranked\s*war\s*report|faction\s*war\s*report|war\s*report)/.test(pageText);
    } catch (_) {
      return false;
    }
  }

  function rwphShouldShowLauncherOnThisPage() {
    // v1.1.397+: keep the launcher off general Torn pages. Show it only on
    // faction pages and faction/ranked-war report pages.
    return rwphIsTornFactionPage() || rwphIsFactionWarReportPage();
  }

  function rwphIsMobileOrPdaView() {
    try {
      const ua = String(navigator.userAgent || "").toLowerCase();
      if (/(torn\s*pda|tornpda|android|iphone|ipad|ipod|mobile|phone|wv\))/i.test(ua)) return true;
      const width = Math.max(
        Number(window.innerWidth || 0),
        Number(document.documentElement?.clientWidth || 0),
        Number(document.body?.clientWidth || 0),
        0
      );
      return width > 0 && width <= 820;
    } catch (_) {
      return false;
    }
  }


  function rwphOpenTutorialInPanel(panel = null) {
    try {
      const root = panel || document.getElementById("rw-payout-helper");
      if (!root) return false;

      const lockedHowBtn = root.querySelector("#rw-paywall-tab-how");
      const mainHowBtn = root.querySelector("#rw-tab-how");
      const howBtn = lockedHowBtn || mainHowBtn;
      if (howBtn && typeof howBtn.click === "function") howBtn.click();

      setTimeout(() => {
        try {
          const tutorialCard = root.querySelector("#rw-paywall-how-section .rw-tutorial-card, #rw-how-tab-section .rw-tutorial-card, .rw-tutorial-card");
          if (tutorialCard) {
            if (String(tutorialCard.tagName || "").toLowerCase() === "details") tutorialCard.open = true;
            tutorialCard.classList.add("rw-tutorial-first-open-highlight");
            tutorialCard.scrollIntoView?.({ block: "start", behavior: "smooth" });
          }
        } catch (_) {}
      }, 80);
      return true;
    } catch (_) {
      return false;
    }
  }

  function rwphHasFirstRunTutorialBeenShown() {
    try { return String(GM_getValue(FIRST_TUTORIAL_SHOWN_STORAGE_KEY, "")) === "1"; }
    catch (_) { return false; }
  }

  function rwphMarkFirstRunTutorialShown() {
    try { GM_setValue(FIRST_TUTORIAL_SHOWN_STORAGE_KEY, "1"); } catch (_) {}
  }

  function rwphScheduleFirstRunTutorialAutoOpen(delayMs = 700) {
    try {
      if (window.__rwphFirstRunTutorialOpening) return;
      if (rwphHasFirstRunTutorialBeenShown()) return;
      if (!rwphShouldShowLauncherOnThisPage()) return;
      window.__rwphFirstRunTutorialOpening = true;
      setTimeout(() => {
        try {
          window.__rwphFirstRunTutorialOpening = false;
          if (rwphHasFirstRunTutorialBeenShown()) return;
          if (!rwphShouldShowLauncherOnThisPage()) return;

          const existingPanel = document.getElementById("rw-payout-helper");
          rwphMarkFirstRunTutorialShown();
          if (existingPanel) {
            rwphOpenTutorialInPanel(existingPanel);
          } else {
            createPanel({ openTutorial: true });
          }
        } catch (_) {
          window.__rwphFirstRunTutorialOpening = false;
        }
      }, Math.max(100, Number(delayMs) || 700));
    } catch (_) {}
  }

  function rwphIsElementVisible(el) {
    try {
      if (!el || el.nodeType !== 1) return false;
      if (el.closest && (el.closest("#rw-payout-helper") || el.closest("#rw-pay-all-panel") || el.closest("#rw-payout-launcher"))) return false;
      const rect = el.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return false;
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function rwphNormalizeNavText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function rwphTextLooksExactlyLikeFactionWarfare(text) {
    return /^faction\s+warfare$/i.test(rwphNormalizeNavText(text));
  }

  function rwphCompactLauncherHaystack(el) {
    try {
      if (!el || el.nodeType !== 1) return "";
      const parts = [
        el.textContent || "",
        el.getAttribute?.("href") || "",
        el.href || "",
        el.getAttribute?.("aria-label") || "",
        el.getAttribute?.("title") || "",
        el.getAttribute?.("data-title") || "",
        el.getAttribute?.("data-tab") || "",
        el.getAttribute?.("data-page") || "",
        el.getAttribute?.("data-action") || "",
        el.id || "",
        typeof el.className === "string" ? el.className : "",
      ];
      try {
        const ds = el.dataset || {};
        Object.keys(ds).forEach((key) => parts.push(`${key}:${ds[key]}`));
      } catch (_) {}
      return parts.join(" ").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function rwphElementLooksLikeFactionWarfareIcon(el) {
    try {
      if (!el || !rwphIsElementVisible(el)) return false;
      const rect = el.getBoundingClientRect?.();
      if (!rwphRectLooksLikeTopFactionButton(rect)) return false;
      const hay = rwphCompactLauncherHaystack(el);
      if (!hay) return false;
      if (/(^|[\s_\-])faction[\s_\-]*warfare($|[\s_\-])|factionwarfare/.test(hay)) return true;
      if (/(ranked[\s_\-]*war|rankedwar|rankedwars|ranked[\s_\-]*wars)/.test(hay) && /(faction|war|report|rank)/.test(hay)) return true;
      if (/(factions\.php|\/factions|sid=factions?|page=factions?)/.test(hay) && /(warfare|ranked|rankedwar|rank|war)/.test(hay)) return true;
      if (/(war\.php|\/war)/.test(hay) && /(faction|ranked|report|war|rank)/.test(hay)) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function rwphFindPdaFactionHeaderIconTarget() {
    try {
      if (!rwphIsMobileOrPdaView() || !rwphShouldShowLauncherOnThisPage()) return null;
      const els = Array.from(document.querySelectorAll("a[href], button, [role='button'], [onclick], [data-title], [aria-label], [title]"));
      const candidates = [];
      els.forEach((el) => {
        try {
          if (!rwphIsElementVisible(el)) return;
          const rect = el.getBoundingClientRect?.();
          if (!rect || rect.width < 18 || rect.height < 18) return;
          if (rect.top < -10 || rect.top > 320) return;
          if (rect.left < -10 || rect.left > Math.max(window.innerWidth || 360, 360) - 5) return;
          const hay = rwphCompactLauncherHaystack(el);
          let score = 100;
          if (rwphElementLooksLikeFactionWarfareIcon(el)) score = 0;
          else if (/(factions\.php|\/factions|sid=factions?|page=factions?)/.test(hay) && /(war|rank|ranked)/.test(hay)) score = 2;
          else if (/(factions\.php|\/factions|sid=factions?|page=factions?)/.test(hay)) score = 7;
          else if (/\bfaction\b/.test(hay) && /(button|tab|menu|nav|icon|link)/.test(hay)) score = 9;
          else return;

          // Prefer compact header icons/buttons, but still allow a visible faction toolbar link.
          if (rect.width > 190 || rect.height > 78) score += 10;
          candidates.push({ el, rect, score, source: "pda-icon" });
        } catch (_) {}
      });
      candidates.sort((a, b) => {
        return (a.score - b.score)
          || (a.rect.top - b.rect.top)
          || (a.rect.left - b.rect.left)
          || ((a.rect.width * a.rect.height) - (b.rect.width * b.rect.height));
      });
      return candidates[0] || null;
    } catch (_) {
      return null;
    }
  }

  function rwphTextNodeRect(node) {
    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach?.();
      return rect;
    } catch (_) {
      return null;
    }
  }

  function rwphRectLooksLikeTopFactionButton(rect) {
    try {
      if (!rect || rect.width <= 0 || rect.height <= 0) return false;
      const compact = rwphIsMobileOrPdaView();
      const viewportWidth = Math.max(window.innerWidth || 1000, 320);
      // The real Faction Warfare button is near the top faction header, not down in page content.
      // PDA can render this as a compact icon only, so allow smaller widths there.
      if (rect.left < -20 || rect.left > viewportWidth - 20) return false;
      if (rect.top < -10 || rect.top > (compact ? 320 : 260)) return false;
      if (rect.width < (compact ? 18 : 40) || rect.width > 360) return false;
      if (rect.height < 18 || rect.height > (compact ? 82 : 72)) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function rwphClosestFactionWarfareButton(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      return el.closest("a,button,[role='button'],[class*='button' i],[class*='btn' i]") || el;
    } catch (_) {
      return el || null;
    }
  }

  function rwphFindFactionWarfareTarget() {
    try {
      const matches = [];
      const addMatch = (el, rect, score, source) => {
        const targetEl = rwphClosestFactionWarfareButton(el);
        if (!targetEl || !rwphIsElementVisible(targetEl)) return;
        const targetRect = targetEl.getBoundingClientRect?.() || rect;
        const usableRect = rwphRectLooksLikeTopFactionButton(targetRect) ? targetRect : rect;
        if (!rwphRectLooksLikeTopFactionButton(usableRect)) return;
        matches.push({ el: targetEl, rect: usableRect, score, source });
      };

      // Best case: find the actual text node reading exactly "Faction Warfare".
      try {
        const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!rwphTextLooksExactlyLikeFactionWarfare(node.nodeValue)) continue;
          const parent = node.parentElement;
          if (!parent) continue;
          const rect = rwphTextNodeRect(node) || parent.getBoundingClientRect();
          addMatch(parent, rect, 0, "text-node");
        }
      } catch (_) {}

      // Fallback: exact visible element text or exact accessibility label.
      const selectors = [
        "a",
        "button",
        "[role='button']",
        "[aria-label]",
        "[title]",
        "[data-title]",
        "span",
        "div",
        "li"
      ];
      const seen = new Set();
      selectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            if (!rwphIsElementVisible(el)) return;
            const text = rwphNormalizeNavText(el.textContent || "");
            const label = rwphNormalizeNavText(`${el.getAttribute?.("aria-label") || ""} ${el.getAttribute?.("title") || ""} ${el.getAttribute?.("data-title") || ""}`);
            if (!rwphTextLooksExactlyLikeFactionWarfare(text) && !rwphTextLooksExactlyLikeFactionWarfare(label)) return;
            addMatch(el, el.getBoundingClientRect(), rwphTextLooksExactlyLikeFactionWarfare(text) ? 1 : 2, "element");
          });
        } catch (_) {}
      });

      // Torn PDA / mobile can render the Faction Warfare action as an icon-only
      // link with no visible text. Use href/title/class/data attributes as an
      // extra target source so the launcher can still sit in the same header row.
      if (rwphIsMobileOrPdaView()) {
        try {
          document.querySelectorAll("a[href], button, [role='button'], [onclick], [data-title], [aria-label], [title]").forEach((el) => {
            if (!rwphElementLooksLikeFactionWarfareIcon(el)) return;
            addMatch(el, el.getBoundingClientRect(), 3, "pda-icon-link");
          });
        } catch (_) {}
      }

      matches.sort((a, b) => {
        return (a.score - b.score)
          || (a.rect.top - b.rect.top)
          || (a.rect.left - b.rect.left)
          || ((a.rect.width * a.rect.height) - (b.rect.width * b.rect.height));
      });
      return matches[0] || null;
    } catch (_) {
      return null;
    }
  }

  function rwphMountLauncherMobileFallback(btn) {
    try {
      if (!btn || !rwphShouldShowLauncherOnThisPage() || !rwphIsMobileOrPdaView()) return false;

      // First try the PDA/mobile faction header icon row. PDA often hides the
      // Faction Warfare text and shows only icons, so this keeps RWPH beside
      // those top faction icons instead of dropping it somewhere else.
      const headerTarget = rwphFindPdaFactionHeaderIconTarget();
      if (headerTarget && headerTarget.el && headerTarget.el.parentNode) {
        const parent = headerTarget.el.parentNode;
        if (btn.parentNode !== parent || btn.nextSibling !== headerTarget.el) {
          parent.insertBefore(btn, headerTarget.el);
        }
        btn.classList.remove("rwph-faction-header-launcher", "rwph-nav-launcher-fallback");
        btn.classList.add("rwph-mobile-header-launcher");
        btn.style.display = "inline-flex";
        applyStyle(btn, getLauncherPositionStyle("pda-header", headerTarget));
        btn.title = "Open Ranked War Payout Helper";
        btn.setAttribute("aria-label", "Open Ranked War Payout Helper");
        btn.innerHTML = rwphLauncherLogoHtml(true);
        updateLauncherCornerButtonLabels();
        return true;
      }

      // Last-resort PDA fallback only. This is kept logo-only and only appears
      // on faction/report pages if Torn has not rendered a usable header row.
      if (btn.parentNode !== document.body) document.body.appendChild(btn);
      btn.classList.remove("rwph-faction-header-launcher", "rwph-nav-launcher-fallback", "rwph-mobile-header-launcher");
      btn.classList.add("rwph-mobile-launcher-fallback");
      btn.style.display = "inline-flex";
      applyStyle(btn, {
        position: "fixed",
        zIndex: "2147483647",
        right: "10px",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        left: "auto",
        top: "auto",
        width: "46px",
        minWidth: "46px",
        maxWidth: "46px",
        height: "46px",
        minHeight: "46px",
        maxHeight: "46px",
        margin: "0",
        padding: "0",
        borderRadius: "var(--rwph-theme-button-radius, 999px)",
        border: "var(--rwph-theme-border-width, 1px) var(--rwph-theme-border-style, solid) var(--rwph-theme-line2, rgba(251,191,36,.42))",
        background: "linear-gradient(135deg, var(--rwph-theme-panel2, #211714), var(--rwph-theme-panel3, #3a241c))",
        color: "var(--rwph-theme-text, #fff2dd)",
        boxShadow: "0 14px 34px rgba(0,0,0,.55), 0 0 22px var(--rwph-theme-line, rgba(251,191,36,.24))",
        font: "800 12px Arial, Helvetica, sans-serif",
        fontWeight: "800",
        lineHeight: "1",
        letterSpacing: ".01em",
        textShadow: "0 1px 0 rgba(0,0,0,.55)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        verticalAlign: "middle",
        textAlign: "center",
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
        appearance: "none",
        WebkitAppearance: "none",
      });
      btn.title = "Open Ranked War Payout Helper";
      btn.setAttribute("aria-label", "Open Ranked War Payout Helper");
      btn.innerHTML = rwphLauncherLogoHtml(true);
      updateLauncherCornerButtonLabels();
      return true;
    } catch (_) {
      return false;
    }
  }

  function rwphMountLauncherFallback(btn) {
    // Desktop keeps the strict Faction Warfare placement. Phone/Torn PDA pages
    // often hide or rename that header button, so they get a small safe fallback
    // launcher that still only appears on faction/report pages.
    if (rwphMountLauncherMobileFallback(btn)) return true;
    try {
      if (btn) btn.remove();
    } catch (_) {}
    return false;
  }

  function rwphMountLauncherBesideFactionWarfare(btn) {
    if (!btn || !rwphShouldShowLauncherOnThisPage()) return rwphMountLauncherFallback(btn);
    const target = rwphFindFactionWarfareTarget();
    if (!target || !target.el || !target.rect) return rwphMountLauncherFallback(btn);

    btn.classList.remove("rwph-nav-launcher-fallback", "rwph-mobile-launcher-fallback", "rwph-mobile-header-launcher");
    btn.classList.add(rwphIsMobileOrPdaView() ? "rwph-mobile-header-launcher" : "rwph-faction-header-launcher");
    btn.style.display = "inline-flex";

    try {
      const parent = target.el.parentNode;
      if (parent && btn.parentNode !== parent) {
        parent.insertBefore(btn, target.el);
      } else if (parent && btn.nextSibling !== target.el) {
        parent.insertBefore(btn, target.el);
      } else if (!parent) {
        document.body.appendChild(btn);
      }
      updateLauncherButtonPosition(false, target);
    } catch (_) {
      try {
        if (btn.parentNode !== document.body) document.body.appendChild(btn);
        updateLauncherButtonPosition(false, target);
      } catch (_) {
        return rwphMountLauncherFallback(btn);
      }
    }
    return true;
  }

  function removeLauncherButton() {
    const btn = document.getElementById("rw-payout-launcher");
    if (btn) btn.remove();
  }

  function syncLauncherButtonVisibility() {
    if (rwphShouldShowLauncherOnThisPage()) {
      createLauncherButton();
    } else {
      removeLauncherButton();
    }
  }

  function rwphScheduleLauncherSync() {
    if (window.__rwphLauncherSyncTimer) return;
    window.__rwphLauncherSyncTimer = setTimeout(() => {
      window.__rwphLauncherSyncTimer = null;
      syncLauncherButtonVisibility();
    }, 120);
  }

  function rwphInstallLauncherNavObserver() {
    if (window.__rwphLauncherNavObserverInstalled) return;
    window.__rwphLauncherNavObserverInstalled = true;
    try {
      const obs = new MutationObserver(() => {
        rwphScheduleLauncherSync();
      });
      obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
      window.addEventListener("resize", rwphScheduleLauncherSync, { passive: true });
      [250, 750, 1500, 3000, 6000, 10000].forEach((delay) => setTimeout(rwphScheduleLauncherSync, delay));
    } catch (_) {}
  }

  function launcherCornerLabel(corner) {
    return String(corner || "bottom-right")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function updateLauncherCornerButtonLabels() {
    ["rw-move-launcher", "rw-move-launcher-admin"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.textContent = "Launcher fixed beside Faction Warfare / PDA fallback";
      btn.title = "The launcher is fixed beside Faction Warfare on desktop and uses a safe phone/PDA fallback when the header button is hidden.";
      btn.setAttribute("aria-label", "Launcher fixed beside Faction Warfare / PDA fallback");
      btn.disabled = true;
    });
  }

  function getLauncherCorner() {
    const saved = GM_getValue(LAUNCHER_CORNER_STORAGE_KEY, "bottom-right");
    return LAUNCHER_CORNERS.includes(saved) ? saved : "bottom-right";
  }

  function setLauncherCorner(corner) {
    GM_setValue(LAUNCHER_CORNER_STORAGE_KEY, corner);
    updateLauncherButtonPosition();
    updateLauncherCornerButtonLabels();
  }

  function getLauncherPositionStyle(corner, anchorTarget = null) {
    const targetEl = anchorTarget && anchorTarget.el ? anchorTarget.el : null;
    const anchorRect = anchorTarget && anchorTarget.rect ? anchorTarget.rect : null;
    let computed = null;
    try { computed = targetEl && window.getComputedStyle ? window.getComputedStyle(targetEl) : null; } catch (_) { computed = null; }

    const isCompactLauncher = rwphIsMobileOrPdaView();
    const height = anchorRect ? Math.max(isCompactLauncher ? 30 : 28, Math.min(isCompactLauncher ? 44 : 46, Math.round(anchorRect.height))) : (isCompactLauncher ? 36 : 34);
    const fallbackFont = `${Math.max(12, Math.min(15, height - 18))}px Arial, Helvetica, sans-serif`;
    const fallbackBackground = "linear-gradient(180deg,#2f2f2f,#181818)";

    if (isCompactLauncher) {
      return {
        position: "static",
        zIndex: "2147483647",
        width: `${height}px`,
        height: `${height}px`,
        minWidth: `${height}px`,
        minHeight: `${height}px`,
        maxWidth: `${height}px`,
        maxHeight: `${height}px`,
        margin: computed?.margin ? computed.margin : "0 6px 0 0",
        padding: "0",
        borderRadius: computed?.borderRadius && computed.borderRadius !== "0px" ? computed.borderRadius : "7px",
        border: computed?.border && computed.border !== "0px none rgb(0, 0, 0)" ? computed.border : "1px solid rgba(255,255,255,.18)",
        background: computed?.background && computed.background !== "rgba(0, 0, 0, 0)" ? computed.background : fallbackBackground,
        color: computed?.color || "#f2f2f2",
        boxShadow: computed?.boxShadow && computed.boxShadow !== "none" ? computed.boxShadow : "none",
        font: computed?.font || fallbackFont,
        fontWeight: computed?.fontWeight || "700",
        lineHeight: "1",
        letterSpacing: computed?.letterSpacing || "normal",
        textShadow: computed?.textShadow && computed.textShadow !== "none" ? computed.textShadow : "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        verticalAlign: "middle",
        textAlign: "center",
        whiteSpace: "nowrap",
        backdropFilter: computed?.backdropFilter || "none",
        overflow: "hidden",
        appearance: "none",
        WebkitAppearance: "none",
        top: "",
        right: "",
        bottom: "",
        left: "",
      };
    }

    return {
      position: "static",
      zIndex: "2147483647",
      width: "auto",
      height: `${height}px`,
      minWidth: "0",
      minHeight: `${height}px`,
      maxWidth: "none",
      maxHeight: "none",
      margin: computed?.margin ? computed.margin : "0 6px 0 0",
      padding: computed?.padding && computed.padding !== "0px" ? computed.padding : "0 11px",
      borderRadius: computed?.borderRadius && computed.borderRadius !== "0px" ? computed.borderRadius : "6px",
      border: computed?.border && computed.border !== "0px none rgb(0, 0, 0)" ? computed.border : "1px solid rgba(255,255,255,.18)",
      background: computed?.background && computed.background !== "rgba(0, 0, 0, 0)" ? computed.background : fallbackBackground,
      color: computed?.color || "#f2f2f2",
      boxShadow: computed?.boxShadow && computed.boxShadow !== "none" ? computed.boxShadow : "none",
      font: computed?.font || fallbackFont,
      fontWeight: computed?.fontWeight || "700",
      lineHeight: computed?.lineHeight || "1",
      letterSpacing: computed?.letterSpacing || "normal",
      textShadow: computed?.textShadow && computed.textShadow !== "none" ? computed.textShadow : "none",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      verticalAlign: "middle",
      textAlign: "center",
      whiteSpace: "nowrap",
      backdropFilter: computed?.backdropFilter || "none",
      overflow: "hidden",
      appearance: "none",
      WebkitAppearance: "none",
      top: "",
      right: "",
      bottom: "",
      left: "",
    };
  }

  function applyStyle(el, styleObj) {
    Object.assign(el.style, {
      top: "",
      right: "",
      bottom: "",
      left: "",
    });
    Object.assign(el.style, styleObj);
  }

  function updateLauncherButtonPosition(useFallback = false, anchorTarget = null) {
    const btn = document.getElementById("rw-payout-launcher");
    if (!btn) return;

    if (useFallback || btn.classList.contains("rwph-nav-launcher-fallback")) {
      btn.remove();
      return;
    }

    btn.classList.remove("rwph-nav-launcher-fallback", "rwph-mobile-launcher-fallback", "rwph-mobile-header-launcher");
    btn.classList.add(rwphIsMobileOrPdaView() ? "rwph-mobile-header-launcher" : "rwph-faction-header-launcher");
    applyStyle(btn, getLauncherPositionStyle("faction-warfare", anchorTarget));
    btn.title = "Open Ranked War Payout Helper";
    btn.innerHTML = rwphLauncherLogoHtml();
    updateLauncherCornerButtonLabels();
  }

  function rwphLauncherLogoHtml(forceLogoOnly = false) {
    const isMobileLauncher = forceLogoOnly || rwphIsMobileOrPdaView();
    const logoSize = isMobileLauncher ? 30 : 20;
    const imgHtml = `<img src="${RWPH_LAUNCHER_LOGO_DATA_URI}" alt="" aria-hidden="true" draggable="false" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 0 5px rgba(249,115,22,.58));flex:0 0 auto;" />`;
    if (isMobileLauncher) return imgHtml;
    return `${imgHtml}<span class="rwph-launcher-text" style="pointer-events:none;display:inline-block;line-height:1;">Ranked War Payout Helper</span>`;
  }

  function setLauncherOpenState(isOpen) {
    const btn = document.getElementById("rw-payout-launcher");
    if (!btn) return;
    btn.innerHTML = rwphLauncherLogoHtml();
    btn.dataset.rwphOpen = isOpen ? "1" : "0";
    btn.title = isOpen ? "Close Ranked War Payout Helper" : "Open Ranked War Payout Helper";
    btn.setAttribute("aria-label", btn.title);
  }

  function createLauncherButton() {
    if (!rwphShouldShowLauncherOnThisPage()) {
      removeLauncherButton();
      return;
    }

    let btn = document.getElementById("rw-payout-launcher");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "rw-payout-launcher";
      btn.type = "button";
      btn.innerHTML = rwphLauncherLogoHtml();
      btn.setAttribute("aria-label", "Open Ranked War Payout Helper");
      btn.addEventListener("click", togglePanel);
    }

    rwphMountLauncherBesideFactionWarfare(btn);
  }

  function cycleLauncherCorner() {
    const status = document.getElementById("rw-status") || document.getElementById("rw-paywall-status");
    rwphToastPanelInfo(status, "Launcher is fixed beside the Faction Warfare button on desktop and uses a phone/PDA fallback when Torn hides that header button.", "info", "RWPH Panel");
  }

  function rwphSafeJsonGet(key, fallback = {}) {
    try {
      const raw = GM_getValue(key, "");
      if (!raw) return fallback;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      return fallback;
    }
  }

  function rwphSafeJsonSet(key, value) {
    try {
      GM_setValue(key, JSON.stringify(value || {}));
    } catch (e) {
      console.warn("RWPH could not save state:", e);
    }
  }

  function rwphCurrentPageKey() {
    // Track the real Torn page, not hash-only UI sections. This keeps RWPH open on refresh
    // for the same page, but lets it auto-close when Torn moves to a different page/search URL.
    return `${location.origin}${location.pathname}${location.search}`;
  }

  function rwphSessionJsonGet(key, fallback = {}) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function rwphSessionJsonSet(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value || {}));
    } catch (e) {
      console.warn("RWPH could not save tab/page state:", e);
    }
  }

  function rwphSetPanelOpenStateForPage(pageKey, isOpen) {
    const state = rwphSessionJsonGet(PANEL_OPEN_STORAGE_KEY, {});
    if (isOpen) state[pageKey || rwphCurrentPageKey()] = "1";
    else delete state[pageKey || rwphCurrentPageKey()];
    rwphSessionJsonSet(PANEL_OPEN_STORAGE_KEY, state);

    // Clear the old global GM flag so opening RWPH in one browser tab no longer forces it
    // to auto-open in every other Torn tab.
    try { GM_setValue(PANEL_OPEN_STORAGE_KEY, "0"); } catch (_) {}
  }

  function rwphSetPanelOpenState(isOpen) {
    rwphSetPanelOpenStateForPage(rwphCurrentPageKey(), isOpen);
  }

  function rwphGetPanelOpenState() {
    const state = rwphSessionJsonGet(PANEL_OPEN_STORAGE_KEY, {});
    return state[rwphCurrentPageKey()] === "1";
  }

  function rwphCloseAllPanelsForPageChange(previousPageKey, nextPageKey) {
    const selectors = [
      "#rw-payout-helper",
      "#rw-pay-all-panel",
      "#rwph-xanax-send-status",
      "#rw-wrong-payment-panel",
    ];

    for (const selector of selectors) {
      for (const panel of Array.from(document.querySelectorAll(selector))) {
        try { rwphSavePanelLayout(panel); } catch (_) {}
        try { panel.remove(); } catch (_) {}
      }
    }

    if (previousPageKey) rwphSetPanelOpenStateForPage(previousPageKey, false);
    if (nextPageKey) rwphSetPanelOpenStateForPage(nextPageKey, false);
    sessionStorage.setItem("rwph_xanax_helper_closed", "1");
    setLauncherOpenState(false);
  }

  function rwphInstallPageNavigationAutoClose() {
    if (window.__rwphPageNavigationAutoCloseInstalled) return;
    window.__rwphPageNavigationAutoCloseInstalled = true;

    let lastPageKey = rwphCurrentPageKey();
    const checkPageChange = () => {
      const currentPageKey = rwphCurrentPageKey();
      if (currentPageKey === lastPageKey) return;
      const previousPageKey = lastPageKey;
      lastPageKey = currentPageKey;
      rwphCloseAllPanelsForPageChange(previousPageKey, currentPageKey);
      syncLauncherButtonVisibility();
      rwphScheduleFirstRunTutorialAutoOpen(900);
    };

    const wrapHistoryMethod = (methodName) => {
      const original = history[methodName];
      if (typeof original !== "function") return;
      history[methodName] = function (...args) {
        const result = original.apply(this, args);
        setTimeout(checkPageChange, 50);
        return result;
      };
    };

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", () => setTimeout(checkPageChange, 50));
    window.addEventListener("hashchange", () => setTimeout(checkPageChange, 50));
    setInterval(checkPageChange, 1000);
  }

  function rwphSavePanelLayout(panel) {
    if (!panel || !panel.id) return;
    const rect = panel.getBoundingClientRect();
    if (!rect || rect.width < 40 || rect.height < 40) return;
    const layouts = rwphSafeJsonGet(PANEL_LAYOUT_STORAGE_KEY, {});
    layouts[panel.id] = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
    rwphSafeJsonSet(PANEL_LAYOUT_STORAGE_KEY, layouts);
  }

  function rwphApplyPanelLayout(panel) {
    if (!panel || !panel.id) return;
    const saved = rwphSafeJsonGet(PANEL_LAYOUT_STORAGE_KEY, {})[panel.id];
    if (!saved) return;

    const mobilePanel = window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches;
    const isXanaxHelper = panel.id === "rwph-xanax-send-status";
    const minWidth = panel.id === "rw-results-panel" ? 160 : (isXanaxHelper ? (mobilePanel ? 270 : 320) : 150);
    const minHeight = isXanaxHelper ? (mobilePanel ? 300 : 340) : 110;
    const width = Math.min(Math.max(minWidth, Number(saved.width) || minWidth), Math.max(minWidth, window.innerWidth - 16));
    const height = Math.min(Math.max(minHeight, Number(saved.height) || minHeight), Math.max(minHeight, window.innerHeight - 16));
    const left = Math.min(Math.max(8, Number(saved.left) || 8), Math.max(8, window.innerWidth - width - 8));
    const top = Math.min(Math.max(8, Number(saved.top) || 8), Math.max(8, window.innerHeight - height - 8));

    panel.style.setProperty("position", "fixed", "important");
    panel.style.setProperty("left", `${left}px`, "important");
    panel.style.setProperty("top", `${top}px`, "important");
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("bottom", "auto", "important");
    panel.style.setProperty("width", `${width}px`, "important");
    panel.style.setProperty("height", `${height}px`, "important");
    panel.style.setProperty("max-height", "none", "important");
    panel.style.setProperty("transform", "none", "important");
  }

  function rwphSaveActiveTab(area, tabName) {
    const state = rwphSafeJsonGet(ACTIVE_TAB_STORAGE_KEY, {});
    state[area] = tabName;
    rwphSafeJsonSet(ACTIVE_TAB_STORAGE_KEY, state);
  }

  function rwphGetActiveTab(area, fallback) {
    const state = rwphSafeJsonGet(ACTIVE_TAB_STORAGE_KEY, {});
    return state[area] || fallback;
  }

  function rwphSavePayoutFormState() {
    const ids = ["rw-from", "rw-to", "rw-points-from", "rw-points-to", "rw-total", "rw-total-overall", "rw-points-total", "rw-points-total-overall", "rw-war-hit-weight", "rw-outside-hit-weight", "rw-retaliation-hit-weight", "rw-assist-weight", "rw-respect-weight", "rw-basic-fast-mode", "rw-point-war-hit", "rw-point-assist", "rw-point-outside", "rw-point-retal", "rw-point-hospital", "rw-point-enemy-hospital", "rw-point-respect", "rw-point-respect-step", "rw-point-fair-fight", "rw-point-fair-fight-avg-step", "rw-point-fair-fight-bonus-step", "rw-excluded-members", "rw-points-excluded-members"];
    const state = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      state[id] = el.type === "checkbox" ? !!el.checked : String(el.value || "");
    }
    rwphSafeJsonSet(PAYOUT_FORM_STATE_STORAGE_KEY, state);
  }

  function rwphRestorePayoutFormState() {
    const state = rwphSafeJsonGet(PAYOUT_FORM_STATE_STORAGE_KEY, {});
    if (state["rw-hit-weight"] && !state["rw-war-hit-weight"]) state["rw-war-hit-weight"] = state["rw-hit-weight"];
    if (state["rw-hit-weight"] && !state["rw-outside-hit-weight"]) state["rw-outside-hit-weight"] = state["rw-hit-weight"];
    if (state["rw-outside-hit-weight"] && !state["rw-retaliation-hit-weight"]) state["rw-retaliation-hit-weight"] = state["rw-outside-hit-weight"];
    if (state["rw-hit-weight"] && !state["rw-retaliation-hit-weight"]) state["rw-retaliation-hit-weight"] = state["rw-hit-weight"];
    if (state["rw-total"] && !state["rw-points-total"]) state["rw-points-total"] = state["rw-total"];
    if (state["rw-total"] && !state["rw-total-overall"]) state["rw-total-overall"] = state["rw-total"];
    if (state["rw-points-total"] && !state["rw-points-total-overall"]) state["rw-points-total-overall"] = state["rw-points-total"];
    if (state["rw-from"] && !state["rw-points-from"]) state["rw-points-from"] = state["rw-from"];
    if (state["rw-to"] && !state["rw-points-to"]) state["rw-points-to"] = state["rw-to"];
    if (GM_getValue(PAYOUT_FORM_SCHEMA_STORAGE_KEY, "") !== "retal-bonus-v255") {
      if (String(state["rw-point-retal"] ?? "").trim() === "4") state["rw-point-retal"] = "0.2";
      GM_setValue(PAYOUT_FORM_SCHEMA_STORAGE_KEY, "retal-bonus-v255");
    }
    for (const [id, value] of Object.entries(state)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = !!value;
      else if (value !== undefined && value !== null && String(value) !== "") el.value = String(value);
    }
  }

  function rwphAttachPayoutFormPersistence() {
    const ids = ["rw-from", "rw-to", "rw-points-from", "rw-points-to", "rw-total", "rw-total-overall", "rw-points-total", "rw-points-total-overall", "rw-war-hit-weight", "rw-outside-hit-weight", "rw-retaliation-hit-weight", "rw-assist-weight", "rw-respect-weight", "rw-basic-fast-mode", "rw-point-war-hit", "rw-point-assist", "rw-point-outside", "rw-point-retal", "rw-point-hospital", "rw-point-enemy-hospital", "rw-point-respect", "rw-point-respect-step", "rw-point-fair-fight", "rw-point-fair-fight-avg-step", "rw-point-fair-fight-bonus-step", "rw-excluded-members", "rw-points-excluded-members"];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el || el.dataset.rwphPersistReady === "1") continue;
      el.dataset.rwphPersistReady = "1";
      el.addEventListener("input", rwphSavePayoutFormState);
      el.addEventListener("change", rwphSavePayoutFormState);
    }
  }


  function rwphPanelThemePresets() {
    const presets = {
      bronze: {
        label: "Bronze Gold",
        bg: "#130b07", bg2: "#21110b", panel: "#211714", panel2: "#2b1d18", panel3: "#3a241c",
        line: "rgba(184,136,89,.46)", line2: "rgba(251,191,36,.40)",
        text: "#fff2dd", soft: "#cfaa8e", accent: "#fbbf24", accent2: "#f97316", good: "#22c55e", danger: "#7f1d1d"
      },
      blue: {
        label: "Ocean Blue",
        bg: "#020617", bg2: "#082f49", panel: "#0f172a", panel2: "#0c4a6e", panel3: "#075985",
        line: "rgba(56,189,248,.46)", line2: "rgba(125,211,252,.42)",
        text: "#f0f9ff", soft: "#bae6fd", accent: "#38bdf8", accent2: "#0ea5e9", good: "#86efac", danger: "#7f1d1d"
      },
      green: {
        label: "Forest Green",
        bg: "#020f08", bg2: "#052e16", panel: "#102016", panel2: "#14532d", panel3: "#166534",
        line: "rgba(34,197,94,.46)", line2: "rgba(134,239,172,.42)",
        text: "#f0fdf4", soft: "#bbf7d0", accent: "#86efac", accent2: "#22c55e", good: "#facc15", danger: "#7f1d1d"
      },
      purple: {
        label: "Royal Purple",
        bg: "#0b0616", bg2: "#1e1233", panel: "#1e1b4b", panel2: "#4c1d95", panel3: "#6d28d9",
        line: "rgba(167,139,250,.48)", line2: "rgba(196,181,253,.42)",
        text: "#faf5ff", soft: "#ddd6fe", accent: "#c4b5fd", accent2: "#a78bfa", good: "#86efac", danger: "#7f1d1d"
      },
      crimson: {
        label: "Crimson Red",
        bg: "#160606", bg2: "#2a0a0a", panel: "#2a0a0a", panel2: "#7f1d1d", panel3: "#991b1b",
        line: "rgba(248,113,113,.48)", line2: "rgba(254,202,202,.38)",
        text: "#fff1f2", soft: "#fca5a5", accent: "#fecaca", accent2: "#f87171", good: "#86efac", danger: "#450a0a"
      },
      neon: {
        label: "Neon Cyan",
        bg: "#020617", bg2: "#07111f", panel: "#07111f", panel2: "#0e7490", panel3: "#155e75",
        line: "rgba(34,211,238,.50)", line2: "rgba(103,232,249,.46)",
        text: "#ecfeff", soft: "#a5f3fc", accent: "#67e8f9", accent2: "#22d3ee", good: "#f0abfc", danger: "#7f1d1d"
      },
      steel: {
        label: "Steel Grey",
        bg: "#030712", bg2: "#111827", panel: "#111827", panel2: "#374151", panel3: "#4b5563",
        line: "rgba(156,163,175,.48)", line2: "rgba(229,231,235,.30)",
        text: "#f9fafb", soft: "#d1d5db", accent: "#e5e7eb", accent2: "#9ca3af", good: "#86efac", danger: "#7f1d1d"
      },
      candy: {
        label: "Candy Pink",
        bg: "#19020b", bg2: "#500724", panel: "#500724", panel2: "#831843", panel3: "#be185d",
        line: "rgba(249,168,212,.48)", line2: "rgba(251,207,232,.42)",
        text: "#fff1f2", soft: "#f9a8d4", accent: "#fbcfe8", accent2: "#f472b6", good: "#bbf7d0", danger: "#7f1d1d"
      },
      midnight: {
        label: "Midnight Black",
        bg: "#020207", bg2: "#080b16", panel: "#09090f", panel2: "#151625", panel3: "#202337",
        line: "rgba(148,163,184,.42)", line2: "rgba(226,232,240,.32)",
        text: "#f8fafc", soft: "#cbd5e1", accent: "#e2e8f0", accent2: "#64748b", good: "#22c55e", danger: "#7f1d1d"
      },
      lava: {
        label: "Lava Orange",
        bg: "#150504", bg2: "#3b0a04", panel: "#2a0905", panel2: "#7c2d12", panel3: "#9a3412",
        line: "rgba(251,146,60,.50)", line2: "rgba(254,215,170,.42)",
        text: "#fff7ed", soft: "#fed7aa", accent: "#fb923c", accent2: "#ef4444", good: "#86efac", danger: "#450a0a"
      },
      ice: {
        label: "Arctic Ice",
        bg: "#03111d", bg2: "#0c4a6e", panel: "#082f49", panel2: "#0369a1", panel3: "#0284c7",
        line: "rgba(186,230,253,.50)", line2: "rgba(224,242,254,.48)",
        text: "#f0f9ff", soft: "#dbeafe", accent: "#e0f2fe", accent2: "#7dd3fc", good: "#bbf7d0", danger: "#7f1d1d"
      },
      toxic: {
        label: "Toxic Lime",
        bg: "#040b02", bg2: "#143000", panel: "#0f1f07", panel2: "#365314", panel3: "#4d7c0f",
        line: "rgba(163,230,53,.50)", line2: "rgba(217,249,157,.45)",
        text: "#f7fee7", soft: "#d9f99d", accent: "#bef264", accent2: "#84cc16", good: "#22c55e", danger: "#7f1d1d"
      },
      sunset: {
        label: "Sunset Glow",
        bg: "#190816", bg2: "#431407", panel: "#36111b", panel2: "#9f1239", panel3: "#c2410c",
        line: "rgba(251,113,133,.48)", line2: "rgba(253,186,116,.44)",
        text: "#fff7ed", soft: "#fecdd3", accent: "#fdba74", accent2: "#fb7185", good: "#bbf7d0", danger: "#7f1d1d"
      },
      cyberpunk: {
        label: "Cyberpunk Pink",
        bg: "#080617", bg2: "#1e1b4b", panel: "#111027", panel2: "#701a75", panel3: "#0e7490",
        line: "rgba(217,70,239,.48)", line2: "rgba(103,232,249,.46)",
        text: "#fdf4ff", soft: "#f0abfc", accent: "#f0abfc", accent2: "#22d3ee", good: "#bef264", danger: "#7f1d1d"
      },
      emerald: {
        label: "Emerald Glow",
        bg: "#02130e", bg2: "#064e3b", panel: "#052e2b", panel2: "#047857", panel3: "#059669",
        line: "rgba(52,211,153,.48)", line2: "rgba(167,243,208,.42)",
        text: "#ecfdf5", soft: "#a7f3d0", accent: "#34d399", accent2: "#10b981", good: "#facc15", danger: "#7f1d1d"
      },
      ruby: {
        label: "Ruby Blood",
        bg: "#130308", bg2: "#3f0713", panel: "#2a0710", panel2: "#881337", panel3: "#be123c",
        line: "rgba(244,63,94,.50)", line2: "rgba(254,205,211,.40)",
        text: "#fff1f2", soft: "#fda4af", accent: "#fb7185", accent2: "#e11d48", good: "#86efac", danger: "#450a0a"
      },
      aqua: {
        label: "Aqua Teal",
        bg: "#021012", bg2: "#134e4a", panel: "#0f2f32", panel2: "#0f766e", panel3: "#14b8a6",
        line: "rgba(45,212,191,.48)", line2: "rgba(153,246,228,.44)",
        text: "#f0fdfa", soft: "#99f6e4", accent: "#5eead4", accent2: "#2dd4bf", good: "#facc15", danger: "#7f1d1d"
      },
      amber: {
        label: "Amber Noir",
        bg: "#090604", bg2: "#1c1207", panel: "#15100b", panel2: "#78350f", panel3: "#92400e",
        line: "rgba(245,158,11,.46)", line2: "rgba(252,211,77,.42)",
        text: "#fffbeb", soft: "#fde68a", accent: "#fcd34d", accent2: "#d97706", good: "#86efac", danger: "#7f1d1d"
      },
      violetstorm: {
        label: "Violet Storm",
        bg: "#080510", bg2: "#2e1065", panel: "#1b1035", panel2: "#5b21b6", panel3: "#7c3aed",
        line: "rgba(139,92,246,.50)", line2: "rgba(216,180,254,.42)",
        text: "#faf5ff", soft: "#d8b4fe", accent: "#d8b4fe", accent2: "#8b5cf6", good: "#86efac", danger: "#7f1d1d"
      },
      desert: {
        label: "Desert Sand",
        bg: "#120b05", bg2: "#3b2f1f", panel: "#24180d", panel2: "#7c5b2b", panel3: "#a16207",
        line: "rgba(217,119,6,.44)", line2: "rgba(253,230,138,.40)",
        text: "#fef3c7", soft: "#fde68a", accent: "#facc15", accent2: "#a16207", good: "#86efac", danger: "#7f1d1d"
      },
      ghost: {
        label: "Ghost White",
        bg: "#0b1018", bg2: "#1f2937", panel: "#111827", panel2: "#334155", panel3: "#64748b",
        line: "rgba(203,213,225,.48)", line2: "rgba(248,250,252,.36)",
        text: "#ffffff", soft: "#e5e7eb", accent: "#f8fafc", accent2: "#cbd5e1", good: "#86efac", danger: "#7f1d1d"
      },
      royalgold: {
        label: "Royal Gold",
        bg: "#0f0a02", bg2: "#2f2106", panel: "#1d1506", panel2: "#854d0e", panel3: "#ca8a04",
        line: "rgba(234,179,8,.52)", line2: "rgba(254,240,138,.44)",
        text: "#fefce8", soft: "#fef08a", accent: "#fde047", accent2: "#eab308", good: "#86efac", danger: "#7f1d1d"
      }
    };

    // v1.1.407: each colour preset now carries its own visual style, not just a colour swap.
    const styleCycle = [
      { styleName:"Classic plated", radius:"16px", cardRadius:"14px", buttonRadius:"12px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".01em", texture:"linear-gradient(135deg, rgba(255,255,255,.045) 0 1px, transparent 1px 11px)", headerTexture:"linear-gradient(90deg, rgba(255,255,255,.10), transparent 45%)", cardTexture:"radial-gradient(circle at 100% 0%, rgba(255,255,255,.08), transparent 26%)", buttonTexture:"linear-gradient(90deg, rgba(255,255,255,.10), transparent 50%)" },
      { styleName:"Glass waves", radius:"22px", cardRadius:"18px", buttonRadius:"999px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".02em", texture:"radial-gradient(ellipse at 10% 10%, rgba(255,255,255,.09), transparent 28%)", headerTexture:"linear-gradient(120deg, rgba(255,255,255,.16), transparent 38%)", cardTexture:"linear-gradient(145deg, rgba(255,255,255,.08), transparent 46%)", buttonTexture:"linear-gradient(145deg, rgba(255,255,255,.16), transparent 52%)" },
      { styleName:"Leaf panels", radius:"18px 6px 18px 6px", cardRadius:"16px 6px 16px 6px", buttonRadius:"10px 20px 10px 20px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".01em", texture:"radial-gradient(ellipse at 0% 100%, rgba(255,255,255,.07), transparent 33%)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.10), transparent 45%)", cardTexture:"repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 1px, transparent 1px 12px)", buttonTexture:"linear-gradient(135deg, rgba(255,255,255,.12), transparent 55%)" },
      { styleName:"Royal bevel", radius:"10px", cardRadius:"8px", buttonRadius:"8px", borderWidth:"2px", borderStyle:"double", buttonCase:"uppercase", buttonTracking:".06em", texture:"linear-gradient(45deg, rgba(255,255,255,.055) 25%, transparent 25% 50%, rgba(255,255,255,.035) 50% 75%, transparent 75%)", headerTexture:"linear-gradient(180deg, rgba(255,255,255,.15), rgba(0,0,0,.05))", cardTexture:"linear-gradient(135deg, rgba(255,255,255,.08), transparent 55%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.08))" },
      { styleName:"Sharp cuts", radius:"4px", cardRadius:"4px", buttonRadius:"3px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".07em", texture:"linear-gradient(135deg, transparent 0 42%, rgba(255,255,255,.055) 42% 44%, transparent 44% 100%)", headerTexture:"linear-gradient(110deg, rgba(255,255,255,.15) 0 18%, transparent 18% 100%)", cardTexture:"linear-gradient(135deg, rgba(255,255,255,.05), transparent 50%)", buttonTexture:"linear-gradient(110deg, rgba(255,255,255,.15) 0 35%, transparent 35%)" },
      { styleName:"Scanline neon", radius:"14px", cardRadius:"12px", buttonRadius:"10px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".08em", texture:"repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px 7px)", headerTexture:"repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 2px, transparent 2px 12px)", cardTexture:"repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 9px)", buttonTexture:"linear-gradient(90deg, rgba(255,255,255,.14), transparent 44%, rgba(255,255,255,.06))" },
      { styleName:"Industrial steel", radius:"8px", cardRadius:"6px", buttonRadius:"6px", borderWidth:"2px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".05em", texture:"repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 2px, transparent 2px 10px)", headerTexture:"linear-gradient(180deg, rgba(255,255,255,.12), transparent 50%)", cardTexture:"linear-gradient(180deg, rgba(255,255,255,.06), transparent 54%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.16), rgba(0,0,0,.12))" },
      { styleName:"Bubble pop", radius:"28px", cardRadius:"24px", buttonRadius:"999px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".01em", texture:"radial-gradient(circle at 20% 30%, rgba(255,255,255,.11), transparent 10%), radial-gradient(circle at 82% 18%, rgba(255,255,255,.08), transparent 12%)", headerTexture:"radial-gradient(circle at 20% 50%, rgba(255,255,255,.18), transparent 22%)", cardTexture:"radial-gradient(circle at 90% 15%, rgba(255,255,255,.12), transparent 18%)", buttonTexture:"radial-gradient(circle at 15% 20%, rgba(255,255,255,.28), transparent 22%)" },
      { styleName:"Minimal matte", radius:"12px", cardRadius:"10px", buttonRadius:"8px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".015em", texture:"linear-gradient(180deg, rgba(255,255,255,.025), transparent 50%)", headerTexture:"linear-gradient(90deg, rgba(255,255,255,.07), transparent 45%)", cardTexture:"linear-gradient(180deg, rgba(255,255,255,.035), transparent 60%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.075), transparent 60%)" },
      { styleName:"Cracked heat", radius:"13px", cardRadius:"10px", buttonRadius:"8px 18px 8px 18px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".05em", texture:"linear-gradient(35deg, transparent 0 47%, rgba(255,255,255,.07) 47% 49%, transparent 49% 100%), linear-gradient(145deg, transparent 0 63%, rgba(255,255,255,.045) 63% 65%, transparent 65%)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.16), transparent 35%)", cardTexture:"linear-gradient(145deg, transparent 0 72%, rgba(255,255,255,.06) 72% 74%, transparent 74%)", buttonTexture:"linear-gradient(135deg, rgba(255,255,255,.17), transparent 48%)" },
      { styleName:"Frosted soft", radius:"24px", cardRadius:"20px", buttonRadius:"18px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".015em", texture:"radial-gradient(circle at 30% 0%, rgba(255,255,255,.16), transparent 30%)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.22), transparent 50%)", cardTexture:"linear-gradient(135deg, rgba(255,255,255,.12), transparent 55%)", buttonTexture:"linear-gradient(135deg, rgba(255,255,255,.22), transparent 55%)" },
      { styleName:"Hazard slashes", radius:"10px", cardRadius:"8px", buttonRadius:"6px", borderWidth:"2px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".08em", texture:"repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 4px, transparent 4px 16px)", headerTexture:"repeating-linear-gradient(135deg, rgba(255,255,255,.13) 0 6px, transparent 6px 18px)", cardTexture:"repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 3px, transparent 3px 14px)", buttonTexture:"repeating-linear-gradient(135deg, rgba(255,255,255,.14) 0 5px, transparent 5px 16px)" },
      { styleName:"Soft sunset", radius:"26px 12px 26px 12px", cardRadius:"20px 10px 20px 10px", buttonRadius:"18px 8px 18px 8px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".02em", texture:"radial-gradient(circle at 0% 0%, rgba(255,255,255,.11), transparent 32%)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.16), transparent 48%)", cardTexture:"radial-gradient(circle at 100% 100%, rgba(255,255,255,.10), transparent 30%)", buttonTexture:"linear-gradient(135deg, rgba(255,255,255,.18), transparent 54%)" },
      { styleName:"Cyber grid", radius:"6px", cardRadius:"5px", buttonRadius:"4px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".09em", texture:"linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)", textureSize:"18px 18px", headerTexture:"linear-gradient(90deg, rgba(255,255,255,.14), transparent 35%)", cardTexture:"linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", cardTextureSize:"16px 16px", buttonTexture:"linear-gradient(90deg, rgba(255,255,255,.16), transparent 42%)" },
      { styleName:"Gem glow", radius:"18px 18px 6px 18px", cardRadius:"16px 16px 5px 16px", buttonRadius:"12px 12px 4px 12px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".02em", texture:"linear-gradient(135deg, rgba(255,255,255,.09), transparent 30%, rgba(255,255,255,.04) 65%, transparent)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.17), transparent 42%)", cardTexture:"linear-gradient(135deg, rgba(255,255,255,.08), transparent 55%)", buttonTexture:"linear-gradient(135deg, rgba(255,255,255,.18), transparent 54%)" },
      { styleName:"Blade ruby", radius:"5px 20px 5px 20px", cardRadius:"4px 18px 4px 18px", buttonRadius:"3px 16px 3px 16px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".06em", texture:"linear-gradient(120deg, transparent 0 38%, rgba(255,255,255,.08) 38% 40%, transparent 40% 100%)", headerTexture:"linear-gradient(120deg, rgba(255,255,255,.17) 0 26%, transparent 26%)", cardTexture:"linear-gradient(120deg, rgba(255,255,255,.06), transparent 50%)", buttonTexture:"linear-gradient(120deg, rgba(255,255,255,.16), transparent 48%)" },
      { styleName:"Aqua ripples", radius:"20px", cardRadius:"16px", buttonRadius:"999px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".02em", texture:"repeating-radial-gradient(circle at 20% 20%, rgba(255,255,255,.055) 0 2px, transparent 2px 18px)", headerTexture:"linear-gradient(100deg, rgba(255,255,255,.16), transparent 48%)", cardTexture:"repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,.045) 0 2px, transparent 2px 16px)", buttonTexture:"linear-gradient(100deg, rgba(255,255,255,.18), transparent 52%)" },
      { styleName:"Noir plaque", radius:"7px", cardRadius:"6px", buttonRadius:"4px", borderWidth:"2px", borderStyle:"ridge", buttonCase:"uppercase", buttonTracking:".065em", texture:"linear-gradient(180deg, rgba(255,255,255,.05), transparent 45%)", headerTexture:"linear-gradient(180deg, rgba(255,255,255,.16), rgba(0,0,0,.14))", cardTexture:"linear-gradient(180deg, rgba(255,255,255,.06), transparent 54%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.16))" },
      { styleName:"Storm arcs", radius:"16px 6px 16px 6px", cardRadius:"14px 5px 14px 5px", buttonRadius:"10px 5px 10px 5px", borderWidth:"1px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".07em", texture:"radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.10), transparent 22%), linear-gradient(150deg, transparent 0 58%, rgba(255,255,255,.06) 58% 60%, transparent 60%)", headerTexture:"linear-gradient(150deg, rgba(255,255,255,.17), transparent 46%)", cardTexture:"linear-gradient(150deg, rgba(255,255,255,.07), transparent 52%)", buttonTexture:"linear-gradient(150deg, rgba(255,255,255,.17), transparent 50%)" },
      { styleName:"Parchment cards", radius:"12px", cardRadius:"2px 18px 2px 18px", buttonRadius:"2px 14px 2px 14px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".015em", texture:"repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px 13px)", headerTexture:"linear-gradient(90deg, rgba(255,255,255,.12), transparent 45%)", cardTexture:"repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 11px)", buttonTexture:"linear-gradient(90deg, rgba(255,255,255,.15), transparent 48%)" },
      { styleName:"Clean ghost", radius:"18px", cardRadius:"14px", buttonRadius:"12px", borderWidth:"1px", borderStyle:"solid", buttonCase:"none", buttonTracking:".025em", texture:"linear-gradient(180deg, rgba(255,255,255,.08), transparent 55%)", headerTexture:"linear-gradient(135deg, rgba(255,255,255,.14), transparent 48%)", cardTexture:"linear-gradient(180deg, rgba(255,255,255,.06), transparent 60%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.16), transparent 56%)" },
      { styleName:"Crown trim", radius:"14px 14px 4px 4px", cardRadius:"12px 12px 4px 4px", buttonRadius:"10px 10px 3px 3px", borderWidth:"2px", borderStyle:"solid", buttonCase:"uppercase", buttonTracking:".08em", texture:"linear-gradient(90deg, rgba(255,255,255,.08), transparent 28%, rgba(255,255,255,.04) 72%, transparent)", headerTexture:"linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.04))", cardTexture:"linear-gradient(90deg, rgba(255,255,255,.06), transparent 52%)", buttonTexture:"linear-gradient(180deg, rgba(255,255,255,.20), rgba(0,0,0,.08))" }
    ];

    Object.keys(presets).forEach((key, index) => {
      Object.assign(presets[key], styleCycle[index % styleCycle.length]);
    });
    return presets;
  }

  function rwphGetPanelThemeKey() {
    const saved = String(GM_getValue(PANEL_THEME_STORAGE_KEY, "bronze") || "bronze").toLowerCase();
    const presets = rwphPanelThemePresets();
    return presets[saved] ? saved : "bronze";
  }

  function rwphGetPanelThemePreset(key = "") {
    const presets = rwphPanelThemePresets();
    return presets[String(key || rwphGetPanelThemeKey()).toLowerCase()] || presets.bronze;
  }

  function rwphPanelThemeCss(theme, includeStandalonePage = false) {
    const t = theme || rwphGetPanelThemePreset();
    const themeTexture = t.texture ? `${t.texture},` : "";
    const themeHeaderTexture = t.headerTexture ? `${t.headerTexture},` : "";
    const themeCardTexture = t.cardTexture ? `${t.cardTexture},` : "";
    const themeButtonTexture = t.buttonTexture ? `${t.buttonTexture},` : "";
    const themeTextureSize = t.textureSize || "auto";
    const themeCardTextureSize = t.cardTextureSize || themeTextureSize;
    const themeRadius = t.radius || "16px";
    const themeCardRadius = t.cardRadius || "14px";
    const themeButtonRadius = t.buttonRadius || "12px";
    const themeBorderWidth = t.borderWidth || "1px";
    const themeBorderStyle = t.borderStyle || "solid";
    const themeButtonCase = t.buttonCase || "none";
    const themeButtonTracking = t.buttonTracking || ".01em";
    const standaloneScope = includeStandalonePage ? `
      body,
      .app,
      .hero,
      .topbar,
      .side,
      .summary-card,
      .result-card,
      .pay-all-panel,
      .rwph-loading-shell,
      .rwph-status-card,
      .rwph-side-card,
      .mini,
      .wait-note,` : "";
    return `
      :root{
        --rwph-theme-bg:${t.bg};
        --rwph-theme-bg2:${t.bg2};
        --rwph-theme-panel:${t.panel};
        --rwph-theme-panel2:${t.panel2};
        --rwph-theme-panel3:${t.panel3};
        --rwph-theme-line:${t.line};
        --rwph-theme-line2:${t.line2};
        --rwph-theme-text:${t.text};
        --rwph-theme-soft:${t.soft};
        --rwph-theme-gold:${t.accent};
        --rwph-theme-orange:${t.accent2};
        --rwph-theme-green:${t.good};
        --rwph-theme-red:${t.danger};
        --rwph-theme-shadow:0 22px 70px rgba(0,0,0,.62),0 0 34px ${t.line};
        --rwph-theme-radius:${themeRadius};
        --rwph-theme-card-radius:${themeCardRadius};
        --rwph-theme-button-radius:${themeButtonRadius};
        --rwph-theme-border-width:${themeBorderWidth};
        --rwph-theme-border-style:${themeBorderStyle};
      }

      ${standaloneScope}
      #rw-payout-helper,
      #rw-pay-all-panel,
      .rw-pay-all-panel,
      #rwph-xanax-send-status,
      .rwph-floating-panel,
      .rwph-results-loading-panel,
      .rwph-results-html-panel,
      .rw-results-panel,
      .rw-main-panel,
      .rw-locked-panel,
      .rw-admin-panel,
      .rw-help-panel,
      .rw-payment-panel,
      .rw-admin-box,
      .rw-how-box,
      .rw-modal,
      .rw-popup,
      .rw-toast,
      .rw-settings-panel,
      .rw-api-tos-card,
      .rw-api-tos-dropdown,
      .rw-settings-dropdown,
      .rw-card,
      .rw-box,
      .rw-section,
      .rw-panel,
      [id^="rwph-"][class*="panel"],
      [class^="rwph-"][class*="panel"],
      [class*="rwph-"][class*="panel"],
      .rwph-panel-theme-picker{
        background:
          ${themeTexture}
          radial-gradient(circle at 18% 0%, ${t.line2}, transparent 32%),
          radial-gradient(circle at 86% 8%, ${t.line}, transparent 30%),
          linear-gradient(180deg, ${t.panel}, ${t.bg}) !important;
        background-size:${themeCardTextureSize}, auto, auto, auto!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
        box-shadow:var(--rwph-theme-shadow)!important;
      }

      #rw-payout-helper header,
      #rw-payout-helper .rw-header,
      #rw-payout-helper .rw-title,
      #rw-payout-helper .rw-panel-head,
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-tabbar,
      #rw-pay-all-panel .rw-pay-all-head,
      .rw-pay-all-panel .rw-pay-all-head,
      .rwph-floating-panel .rwph-panel-head,
      .rwph-results-loading-panel .rwph-results-loading-head,
      .rwph-results-html-head,
      .rw-admin-box h1,
      .rw-admin-box h2,
      .rw-how-box h1,
      .rw-how-box h2,
      .rw-api-tos-title,
      .rw-settings-dropdown > summary,
      .rw-api-tos-dropdown > summary{
        background:${themeHeaderTexture}linear-gradient(135deg, ${t.panel3}, ${t.panel})!important;
        background-size:${themeTextureSize}, auto!important;
        border-color:${t.line2}!important;
        color:${t.accent}!important;
      }

      #rw-payout-helper button,
      #rw-payout-helper .rw-button,
      #rw-payout-helper .rw-tab,
      #rw-payout-helper a.btn,
      #rw-pay-all-panel button,
      #rw-pay-all-panel a.btn,
      .rw-pay-all-panel button,
      .rw-pay-all-panel a.btn,
      .rwph-floating-panel button,
      .rwph-floating-panel a.btn,
      .rwph-results-html-panel button,
      .rwph-results-html-panel a.btn,
      .rw-results-panel button,
      .rw-results-panel a.btn,
      .rw-admin-box button,
      .rw-how-box button{
        background:${themeButtonTexture}linear-gradient(180deg, ${t.panel3}, ${t.panel})!important;
        background-size:${themeTextureSize}, auto!important;
        border-color:${t.line2}!important;
        color:${t.text}!important;
        box-shadow:0 10px 22px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.05)!important;
      }

      #rw-payout-helper button.primary,
      #rw-payout-helper .primary,
      #rw-payout-helper .rw-primary,
      #rw-payout-helper .rw-tab.active,
      #rw-payout-helper [aria-selected="true"],
      #rw-pay-all-panel .primary,
      .rw-pay-all-panel .primary,
      .rwph-floating-panel .primary,
      .rwph-results-html-panel .primary,
      .rw-results-panel .primary{
        background:linear-gradient(135deg, ${t.accent}, ${t.accent2})!important;
        border-color:${t.line2}!important;
        color:${t.bg}!important;
      }

      ${includeStandalonePage ? "body h1, body h2, body h3, body .title-text, body .results-side-title, body .summary-card span, body .result-name," : ""}
      #rw-payout-helper h1,
      #rw-payout-helper h2,
      #rw-payout-helper h3,
      #rw-payout-helper .rw-title,
      #rw-payout-helper .rw-section-title,
      #rw-payout-helper .rw-api-tos-title,
      #rw-pay-all-panel h1,
      #rw-pay-all-panel h2,
      .rw-pay-all-panel h1,
      .rw-pay-all-panel h2,
      .rwph-floating-panel h1,
      .rwph-floating-panel h2,
      .rwph-results-loading-panel h1,
      .rwph-results-loading-panel h2,
      .rwph-results-html-title,
      .rwph-results-html-preview-title,
      .rw-results-panel h1,
      .rw-results-panel h2,
      .rw-admin-box h1,
      .rw-admin-box h2,
      .rw-how-box h1,
      .rw-how-box h2{
        color:${t.accent}!important;
      }

      #rw-payout-helper label,
      #rw-payout-helper .rw-muted,
      #rw-payout-helper .muted,
      #rw-payout-helper small,
      #rw-payout-helper .rw-calc-brief,
      #rw-pay-all-panel .muted,
      .rw-pay-all-panel .muted,
      .rwph-floating-panel .muted,
      .rwph-results-loading-panel .muted,
      .rwph-results-html-note,
      .rwph-results-html-status,
      .rw-results-panel .muted,
      .rw-admin-box .muted,
      .rw-how-box .muted{
        color:${t.soft}!important;
      }

      #rw-payout-helper input,
      #rw-payout-helper textarea,
      #rw-payout-helper select,
      #rw-pay-all-panel input,
      #rw-pay-all-panel textarea,
      #rw-pay-all-panel select,
      .rw-pay-all-panel input,
      .rw-pay-all-panel textarea,
      .rw-pay-all-panel select,
      .rwph-floating-panel input,
      .rwph-floating-panel textarea,
      .rwph-floating-panel select,
      .rwph-results-html-panel textarea,
      .rw-results-panel input,
      .rw-results-panel textarea,
      .rw-results-panel select,
      .rw-admin-box input,
      .rw-admin-box textarea,
      .rw-admin-box select,
      .rw-how-box input,
      .rw-how-box textarea,
      .rw-how-box select{
        background:${t.bg}!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
      }

      ${includeStandalonePage ? "body .summary-card, body .result-card, body .rwph-status-card, body .rwph-side-card, body .mini, body .wait-note," : ""}
      #rw-payout-helper .card,
      #rw-payout-helper .rw-card,
      #rw-payout-helper .rw-box,
      #rw-payout-helper .rw-section,
      #rw-payout-helper .rw-api-tos-content,
      #rw-payout-helper .rw-calc-brief,
      #rw-payout-helper details,
      #rw-pay-all-panel .rw-pay-all-row,
      .rw-pay-all-panel .rw-pay-all-row,
      .rwph-floating-panel .rw-card,
      .rwph-results-loading-panel .rw-card,
      .rwph-results-html-preview-wrap,
      .rwph-results-html-preview,
      .rw-results-panel .summary-card,
      .rw-results-panel .result-card,
      .rw-admin-box .rw-card,
      .rw-how-box .rw-card{
        background:${themeCardTexture}${t.panel2}!important;
        background-size:${themeCardTextureSize}, auto!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
      }

      #rw-payout-helper details.rw-per-hit-settings,
      #rw-payout-helper details.rw-points-settings{
        border-color:${t.line2}!important;
        background:${themeTexture}radial-gradient(circle at 12% 0%, ${t.line2}, transparent 32%),linear-gradient(180deg, ${t.panel3}, ${t.bg})!important;
        background-size:${themeTextureSize}, auto, auto!important;
        box-shadow:0 0 0 1px rgba(255,255,255,.055) inset,0 18px 44px rgba(0,0,0,.42),0 0 28px ${t.line}!important;
      }
      #rw-payout-helper details.rw-per-hit-settings::before,
      #rw-payout-helper details.rw-points-settings::before{
        background:linear-gradient(180deg,${t.accent},${t.accent2})!important;
      }
      #rw-payout-helper details.rw-per-hit-settings > summary,
      #rw-payout-helper details.rw-points-settings > summary{
        background:${themeHeaderTexture}linear-gradient(135deg, ${t.line2}, ${t.line}),linear-gradient(180deg, ${t.panel3}, ${t.panel})!important;
        background-size:${themeTextureSize}, auto, auto!important;
        color:${t.accent}!important;
        border-bottom-color:${t.line}!important;
      }


      /* v1.1.386: make every RWPH panel interior follow the chosen theme */
      #rw-payout-helper,
      #rw-payout-helper .rw-body,
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper .rw-unified-tab-panel,
      #rw-payout-helper .rw-tabs,
      #rw-payout-helper .rw-actions,
      #rw-payout-helper .rw-licence-control-grid,
      #rw-payout-helper #rw-paywall-unlock-section,
      #rw-payout-helper #rw-paywall-admin-section,
      #rw-payout-helper #rw-paywall-how-section,
      #rw-payout-helper #rw-payout-tab,
      #rw-payout-helper #rw-admin-tab-section,
      #rw-payout-helper #rw-how-tab-section,
      #rw-payout-helper #rw-results-panel,
      #rw-payout-helper .rw-admin-unified-panel,
      #rw-payout-helper .rw-help-section-card,
      #rw-payout-helper .rw-help-dropdown-content,
      #rw-payout-helper .rw-api-visible-card,
      #rw-payout-helper .rw-admin-advanced-box,
      #rw-payout-helper .rw-cache-tools,
      #rw-payout-helper .rw-mode-cache-tools,
      #rw-payout-helper .rw-compact-check-grid,
      #rw-payout-helper .rw-primary-calc-actions,
      #rw-payout-helper .rw-settings-calc-actions,
      #rw-payout-helper .rw-settings-time-actions,
      #rw-payout-helper #rw-main-payment-code,
      #rw-payout-helper #rw-paywall-code,
      #rw-payout-helper #rw-admin-results,
      #rw-payout-helper #rw-results,
      #rw-payout-helper #rw-results-placeholder,
      #rw-pay-all-panel,
      #rw-pay-all-panel .rw-pay-all-body,
      #rw-pay-all-panel .rw-pay-all-list,
      #rw-pay-all-panel .rw-pay-all-row,
      .rw-pay-all-panel,
      .rw-pay-all-panel .rw-pay-all-body,
      .rw-pay-all-panel .rw-pay-all-list,
      .rw-pay-all-panel .rw-pay-all-row,
      .rwph-floating-panel,
      .rwph-floating-panel-body,
      .rwph-panel-theme-picker,
      .rwph-panel-theme-picker-body,
      .rwph-panel-theme-grid,
      .rwph-panel-theme-current,
      .rwph-results-loading-panel,
      .rwph-results-loading-panel .rwph-loading-shell,
      .rwph-results-loading-panel .rwph-status-card,
      .rwph-results-loading-panel .rwph-side-card,
      .rwph-results-html-panel,
      .rwph-results-html-panel .rwph-results-html-preview-wrap,
      .rwph-results-html-panel .rwph-results-html-preview,
      .rwph-results-html-panel .rwph-select-raw-html-row,
      .rwph-results-html-panel .rwph-results-html-box,
      .rw-results-panel,
      .rw-results-panel .summary,
      .rw-results-panel .summary-card,
      .rw-results-panel .result-card{
        background:
          ${themeCardTexture}
          radial-gradient(circle at 16% 0%, ${t.line2}, transparent 34%),
          radial-gradient(circle at 92% 10%, ${t.line}, transparent 34%),
          linear-gradient(180deg, ${t.panel}, ${t.bg}) !important;
        background-size:${themeCardTextureSize}, auto, auto, auto!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
      }

      #rw-payout-helper .rw-body,
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper #rw-payout-tab,
      #rw-payout-helper #rw-admin-tab-section,
      #rw-payout-helper #rw-how-tab-section,
      #rw-payout-helper #rw-paywall-unlock-section,
      #rw-payout-helper #rw-paywall-admin-section,
      #rw-payout-helper #rw-paywall-how-section,
      .rwph-panel-theme-picker-body,
      .rwph-floating-panel-body,
      .rwph-results-html-panel .rwph-results-html-preview,
      .rwph-results-html-panel .rwph-results-html-box{
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
      }

      #rw-payout-helper .rw-small,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list,
      #rw-payout-helper .rw-help-dropdown-content,
      #rw-payout-helper .rw-api-visible-summary,
      #rw-payout-helper .rw-cache-status,
      #rw-payout-helper .rw-compact-cache-status,
      #rw-payout-helper #rw-status,
      #rw-payout-helper #rw-paywall-status,
      #rw-payout-helper #rw-admin-status,
      #rw-payout-helper #rw-admin-status-summary,
      .rwph-panel-theme-picker .rw-small,
      .rwph-panel-theme-picker span,
      .rwph-results-html-panel span{
        color:${t.soft}!important;
      }

      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-api-visible-head,
      #rw-payout-helper .rw-help-dropdown-summary,
      #rw-payout-helper .rw-api-tos-title,
      #rw-payout-helper details > summary,
      #rw-pay-all-panel .rw-pay-all-head,
      .rw-pay-all-panel .rw-pay-all-head,
      .rwph-panel-theme-picker-head,
      .rwph-floating-panel-head,
      .rwph-results-html-head{
        background:
          ${themeHeaderTexture}
          radial-gradient(circle at 14% 0%, ${t.line2}, transparent 32%),
          linear-gradient(135deg, ${t.panel3}, ${t.panel}) !important;
        background-size:${themeTextureSize}, auto, auto!important;
        border-color:${t.line2}!important;
        color:${t.accent}!important;
      }

      #rw-payout-helper .rw-api-visible-badge,
      #rw-payout-helper .rw-api-visible-dot,
      #rw-payout-helper b,
      .rwph-panel-theme-picker b,
      .rwph-results-html-panel b{
        color:${t.accent}!important;
      }

      #rw-payout-helper input[type="checkbox"],
      #rw-payout-helper input[type="radio"]{
        accent-color:${t.accent}!important;
      }


      /* v1.1.386: include the Xanax/payment helper panel in the selected theme */
      #rwph-xanax-send-status,
      #rwph-xanax-send-status .rwph-xanax-scroll,
      #rwph-xanax-send-status .rwph-xanax-detail-card,
      #rwph-xanax-send-status .rwph-xanax-actions,
      #rwph-xanax-send-status .rwph-xanax-steps,
      #rwph-xanax-send-status .rwph-xanax-safety-note,
      #rwph-xanax-send-status .rwph-xanax-helper-message,
      #rwph-xanax-send-status .rwph-xanax-expiry,
      #rwph-xanax-send-status .rw-payment-expiry,
      #rwph-xanax-send-status .rwph-xanax-expiry-hero{
        background:
          ${themeCardTexture}
          radial-gradient(circle at 16% 0%, ${t.line2}, transparent 34%),
          radial-gradient(circle at 92% 10%, ${t.line}, transparent 34%),
          linear-gradient(180deg, ${t.panel}, ${t.bg}) !important;
        background-size:${themeCardTextureSize}, auto, auto, auto!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 16px 44px rgba(0,0,0,.34)!important;
      }

      #rwph-xanax-send-status #rwph-payment-helper-title,
      #rwph-xanax-send-status .rwph-xanax-detail-title{
        background:
          ${themeHeaderTexture}
          radial-gradient(circle at 14% 0%, ${t.line2}, transparent 32%),
          linear-gradient(135deg, ${t.panel3}, ${t.panel}) !important;
        background-size:${themeTextureSize}, auto, auto!important;
        border:1px solid ${t.line2}!important;
        border-radius:12px!important;
        color:${t.accent}!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;
      }

      #rwph-xanax-send-status button,
      #rwph-xanax-send-status #rwph-close-helper,
      #rwph-xanax-send-status .rwph-xanax-actions button{
        background:linear-gradient(180deg, ${t.panel3}, ${t.panel})!important;
        border:1px solid ${t.line2}!important;
        color:${t.text}!important;
        box-shadow:0 10px 22px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.05)!important;
      }

      #rwph-xanax-send-status #rwph-close-helper,
      #rwph-xanax-send-status .danger{
        background:linear-gradient(180deg, ${t.danger}, ${t.bg})!important;
        border-color:rgba(248,113,113,.52)!important;
        color:#fee2e2!important;
      }

      #rwph-xanax-send-status .rwph-xanax-helper-subtitle,
      #rwph-xanax-send-status .rwph-xanax-expiry-note,
      #rwph-xanax-send-status .rwph-xanax-steps,
      #rwph-xanax-send-status .rwph-xanax-small-blue,
      #rwph-xanax-send-status .rwph-xanax-expiry,
      #rwph-xanax-send-status .rwph-expire-clock{
        color:${t.soft}!important;
      }

      #rwph-xanax-send-status b,
      #rwph-xanax-send-status .rwph-xanax-code,
      #rwph-xanax-send-status .rwph-xanax-detail-title,
      #rwph-xanax-send-status [data-rwph-expire-count]{
        color:${t.accent}!important;
      }

      #rwph-xanax-send-status .rwph-xanax-helper-error,
      #rwph-xanax-send-status .rwph-xanax-safety-note{
        color:#fca5a5!important;
        border-color:rgba(248,113,113,.34)!important;
      }

      #rwph-xanax-send-status input,
      #rwph-xanax-send-status textarea,
      #rwph-xanax-send-status select{
        background:${t.bg}!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
      }



      /* v1.1.386: broad RWPH-only UI coverage. Does not target generated newsletter HTML inside preview/raw code. */
      #rw-payout-helper :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      #rw-pay-all-panel :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rw-pay-all-panel :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      #rwph-xanax-send-status :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rwph-floating-panel :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rwph-results-loading-panel :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rw-results-panel :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rwph-panel-theme-picker :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form),
      .rwph-results-html-panel > :where(div,section,article,aside,nav,header,footer,main,details,summary,fieldset,form):not(.rwph-results-html-preview-wrap),
      .rwph-results-html-panel .rwph-results-html-head,
      .rwph-results-html-panel .rwph-results-html-status,
      .rwph-results-html-panel .rwph-raw-html-copy-note{
        border-color:${t.line}!important;
        color:${t.text}!important;
      }

      #rw-payout-helper :where(.rw-body,.rw-tab-section,.rw-unified-tab-panel,.rw-tabs,.rw-actions,.rw-cache-tools,.rw-mode-cache-tools,.rw-compact-check-grid,.rw-primary-calc-actions,.rw-settings-calc-actions,.rw-settings-time-actions,.rw-api-visible-card,.rw-help-section-card,.rw-help-dropdown-content,.rw-admin-unified-panel,.rw-admin-advanced-box,.rw-api-tos-content,.rw-card,.rw-box,.rw-section),
      #rw-pay-all-panel :where(.rw-pay-all-body,.rw-pay-all-list,.rw-pay-all-row),
      .rw-pay-all-panel :where(.rw-pay-all-body,.rw-pay-all-list,.rw-pay-all-row),
      #rwph-xanax-send-status :where(.rwph-xanax-scroll,.rwph-xanax-detail-card,.rwph-xanax-actions,.rwph-xanax-steps,.rwph-xanax-safety-note,.rwph-xanax-helper-message,.rwph-xanax-expiry,.rw-payment-expiry,.rwph-xanax-expiry-hero),
      .rwph-floating-panel :where(.rw-card,.rw-box,.rw-section,.rwph-floating-panel-body),
      .rwph-results-loading-panel :where(.rwph-loading-shell,.rwph-status-card,.rwph-side-card),
      .rw-results-panel :where(.summary,.summary-card,.result-card,.results-action-zone,.side,.hero,.topbar,.app),
      .rwph-panel-theme-picker :where(.rwph-panel-theme-picker-body,.rwph-panel-theme-grid,.rwph-panel-theme-current),
      .rwph-results-html-panel :where(.rwph-results-html-preview-wrap,.rwph-raw-html-copy-note,.rwph-results-html-box){
        background:
          ${themeCardTexture}
          radial-gradient(circle at 16% 0%, ${t.line2}, transparent 34%),
          radial-gradient(circle at 92% 10%, ${t.line}, transparent 34%),
          linear-gradient(180deg, ${t.panel2}, ${t.bg})!important;
        background-size:${themeCardTextureSize}, auto, auto, auto!important;
        border-color:${t.line}!important;
        color:${t.text}!important;
      }

      /* Keep the rendered newsletter HTML itself on its own generated colours. */
      .rwph-results-html-panel .rwph-results-html-preview,
      .rwph-results-html-panel .rwph-results-html-preview *,
      .rwph-results-html-panel textarea.rwph-results-html-box{
        font-family:inherit;
      }


      /* v1.1.386: force Basic/Advanced dropdowns and every RWPH button to follow the chosen theme */
      #rw-payout-helper details.rw-per-hit-settings,
      #rw-payout-helper details.rw-points-settings,
      #rw-payout-helper details.rw-per-hit-settings .rw-api-tos-content,
      #rw-payout-helper details.rw-points-settings .rw-api-tos-content,
      #rw-payout-helper details.rw-per-hit-settings .rw-compact-check-grid,
      #rw-payout-helper details.rw-points-settings .rw-compact-check-grid,
      #rw-payout-helper details.rw-per-hit-settings .rw-cache-tools,
      #rw-payout-helper details.rw-points-settings .rw-cache-tools,
      #rw-payout-helper details.rw-per-hit-settings .rw-mode-cache-tools,
      #rw-payout-helper details.rw-points-settings .rw-mode-cache-tools,
      #rw-payout-helper details.rw-per-hit-settings .rw-primary-calc-actions,
      #rw-payout-helper details.rw-points-settings .rw-primary-calc-actions,
      #rw-payout-helper details.rw-per-hit-settings .rw-settings-calc-actions,
      #rw-payout-helper details.rw-points-settings .rw-settings-calc-actions,
      #rw-payout-helper details.rw-per-hit-settings .rw-settings-time-actions,
      #rw-payout-helper details.rw-points-settings .rw-settings-time-actions,
      #rw-payout-helper details.rw-per-hit-settings label,
      #rw-payout-helper details.rw-points-settings label,
      #rw-payout-helper details.rw-per-hit-settings .rw-calc-brief,
      #rw-payout-helper details.rw-points-settings .rw-calc-brief,
      #rw-payout-helper details.rw-per-hit-settings input,
      #rw-payout-helper details.rw-points-settings input,
      #rw-payout-helper details.rw-per-hit-settings textarea,
      #rw-payout-helper details.rw-points-settings textarea,
      #rw-payout-helper details.rw-per-hit-settings select,
      #rw-payout-helper details.rw-points-settings select{
        background:
          radial-gradient(circle at 12% 0%, ${t.line2}, transparent 34%),
          radial-gradient(circle at 92% 8%, ${t.line}, transparent 34%),
          linear-gradient(180deg, ${t.panel2}, ${t.bg}) !important;
        border-color:${t.line}!important;
        color:${t.text}!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
      }

      #rw-payout-helper details.rw-per-hit-settings,
      #rw-payout-helper details.rw-points-settings{
        border-color:${t.line2}!important;
        box-shadow:
          0 0 0 1px rgba(255,255,255,.055) inset,
          0 18px 44px rgba(0,0,0,.42),
          0 0 32px ${t.line}!important;
      }

      #rw-payout-helper details.rw-per-hit-settings::before,
      #rw-payout-helper details.rw-points-settings::before{
        background:linear-gradient(180deg,${t.accent},${t.accent2})!important;
        box-shadow:0 0 18px ${t.line2}!important;
      }

      #rw-payout-helper details.rw-per-hit-settings > summary,
      #rw-payout-helper details.rw-points-settings > summary{
        background:
          radial-gradient(circle at 12% 0%, ${t.line2}, transparent 34%),
          linear-gradient(135deg, ${t.panel3}, ${t.panel})!important;
        border-color:${t.line2}!important;
        color:${t.accent}!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 24px rgba(0,0,0,.24)!important;
      }

      #rw-payout-helper details.rw-per-hit-settings > summary::after,
      #rw-payout-helper details.rw-points-settings > summary::after{
        background:linear-gradient(180deg, ${t.bg2}, ${t.bg})!important;
        border-color:${t.line2}!important;
        color:${t.soft}!important;
      }

      #rw-payout-helper details.rw-per-hit-settings[open] > summary::after,
      #rw-payout-helper details.rw-points-settings[open] > summary::after{
        color:${t.good}!important;
        border-color:${t.good}!important;
      }

      #rw-payout-helper :where(button,a.btn,.btn,.rw-button,.rw-tab,.rw-primary,.secondary,.danger,.success),
      #rw-pay-all-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      .rw-pay-all-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      #rwph-xanax-send-status :where(button,a.btn,.btn),
      .rwph-floating-panel :where(button,a.btn,.btn),
      .rwph-results-loading-panel :where(button,a.btn,.btn),
      .rwph-results-html-panel :where(button,a.btn,.btn),
      .rw-results-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      .rwph-panel-theme-picker :where(button,a.btn,.btn){
        background:
          ${themeButtonTexture}
          radial-gradient(circle at 18% 0%, ${t.line2}, transparent 36%),
          linear-gradient(180deg, ${t.panel3}, ${t.panel})!important;
        background-size:${themeTextureSize}, auto, auto!important;
        border:1px solid ${t.line2}!important;
        color:${t.text}!important;
        box-shadow:0 10px 22px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.07)!important;
        text-shadow:none!important;
      }

      #rw-payout-helper :where(button.primary,.primary,.rw-primary,.rw-tab.active,[aria-selected="true"]),
      #rw-pay-all-panel :where(button.primary,.primary),
      .rw-pay-all-panel :where(button.primary,.primary),
      #rwph-xanax-send-status :where(button.primary,.primary),
      .rwph-floating-panel :where(button.primary,.primary),
      .rwph-results-loading-panel :where(button.primary,.primary),
      .rwph-results-html-panel :where(button.primary,.primary),
      .rw-results-panel :where(button.primary,.primary),
      .rwph-panel-theme-picker :where(button.primary,.primary,.rwph-theme-choice.primary){
        background:linear-gradient(135deg, ${t.accent}, ${t.accent2})!important;
        border-color:${t.line2}!important;
        color:${t.bg}!important;
        box-shadow:0 12px 26px rgba(0,0,0,.30),0 0 20px ${t.line}!important;
      }

      #rw-payout-helper :where(button.danger,.danger),
      #rw-pay-all-panel :where(button.danger,.danger),
      .rw-pay-all-panel :where(button.danger,.danger),
      #rwph-xanax-send-status :where(button.danger,.danger,#rwph-close-helper),
      .rwph-floating-panel :where(button.danger,.danger),
      .rwph-results-loading-panel :where(button.danger,.danger),
      .rw-results-panel :where(button.danger,.danger),
      .rwph-panel-theme-picker :where(button.danger,.danger){
        background:linear-gradient(180deg, ${t.danger}, ${t.bg})!important;
        border-color:rgba(248,113,113,.55)!important;
        color:#fee2e2!important;
      }

      #rw-payout-helper :where(button.success,.success),
      #rw-pay-all-panel :where(button.success,.success),
      .rw-pay-all-panel :where(button.success,.success),
      #rwph-xanax-send-status :where(button.success,.success),
      .rwph-floating-panel :where(button.success,.success),
      .rwph-results-loading-panel :where(button.success,.success),
      .rw-results-panel :where(button.success,.success),
      .rwph-panel-theme-picker :where(button.success,.success){
        background:linear-gradient(180deg, ${t.good}, ${t.panel})!important;
        border-color:${t.good}!important;
        color:${t.bg}!important;
      }

      #rw-payout-helper :where(button:hover,a.btn:hover,.btn:hover,.rw-button:hover,.rw-tab:hover),
      #rw-pay-all-panel :where(button:hover,a.btn:hover,.btn:hover),
      .rw-pay-all-panel :where(button:hover,a.btn:hover,.btn:hover),
      #rwph-xanax-send-status :where(button:hover,a.btn:hover,.btn:hover),
      .rwph-floating-panel :where(button:hover,a.btn:hover,.btn:hover),
      .rwph-results-loading-panel :where(button:hover,a.btn:hover,.btn:hover),
      .rwph-results-html-panel :where(button:hover,a.btn:hover,.btn:hover),
      .rw-results-panel :where(button:hover,a.btn:hover,.btn:hover),
      .rwph-panel-theme-picker :where(button:hover,a.btn:hover,.btn:hover){
        border-color:${t.accent}!important;
        filter:brightness(1.12)!important;
      }

      #rw-payout-helper :where(button:disabled,.btn[aria-disabled="true"],.btn:disabled),
      #rw-pay-all-panel :where(button:disabled,.btn:disabled),
      .rw-pay-all-panel :where(button:disabled,.btn:disabled),
      .rwph-floating-panel :where(button:disabled,.btn:disabled),
      .rwph-results-loading-panel :where(button:disabled,.btn:disabled),
      .rw-results-panel :where(button:disabled,.btn:disabled){
        opacity:.58!important;
        filter:saturate(.65)!important;
        cursor:not-allowed!important;
      }

      /* v1.1.407: theme styles now change shapes, borders, button text, and theme picker scrolling. */
      #rw-payout-helper,
      #rw-pay-all-panel,
      .rw-pay-all-panel,
      #rwph-xanax-send-status,
      .rwph-floating-panel,
      .rwph-results-loading-panel,
      .rwph-results-html-panel,
      .rw-results-panel,
      .rwph-panel-theme-picker{
        border-radius:var(--rwph-theme-radius)!important;
        border-width:var(--rwph-theme-border-width)!important;
        border-style:var(--rwph-theme-border-style)!important;
      }

      #rw-payout-helper :where(.rw-body,.rw-card,.rw-box,.rw-section,details,.rw-api-visible-card,.rw-help-section-card,.rw-help-dropdown-content),
      #rw-pay-all-panel :where(.rw-pay-all-body,.rw-pay-all-list,.rw-pay-all-row),
      .rw-pay-all-panel :where(.rw-pay-all-body,.rw-pay-all-list,.rw-pay-all-row),
      #rwph-xanax-send-status :where(.rwph-xanax-scroll,.rwph-xanax-detail-card,.rwph-xanax-actions,.rwph-xanax-steps,.rwph-xanax-safety-note,.rwph-xanax-helper-message,.rwph-xanax-expiry,.rw-payment-expiry,.rwph-xanax-expiry-hero),
      .rwph-floating-panel :where(.rw-card,.rw-box,.rw-section,.rwph-floating-panel-body),
      .rwph-results-loading-panel :where(.rwph-loading-shell,.rwph-status-card,.rwph-side-card),
      .rw-results-panel :where(.summary,.summary-card,.result-card,.results-action-zone,.side,.hero,.topbar,.app),
      .rwph-panel-theme-picker :where(.rwph-panel-theme-picker-body,.rwph-panel-theme-grid,.rwph-panel-theme-current){
        border-radius:var(--rwph-theme-card-radius)!important;
        border-style:var(--rwph-theme-border-style)!important;
      }

      #rw-payout-helper :where(button,a.btn,.btn,.rw-button,.rw-tab,.rw-primary,.secondary,.danger,.success),
      #rw-pay-all-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      .rw-pay-all-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      #rwph-xanax-send-status :where(button,a.btn,.btn),
      .rwph-floating-panel :where(button,a.btn,.btn),
      .rwph-results-loading-panel :where(button,a.btn,.btn),
      .rwph-results-html-panel :where(button,a.btn,.btn),
      .rw-results-panel :where(button,a.btn,.btn,.pay-all-btn,.pay-all-close,.pay-all-undo),
      .rwph-panel-theme-picker :where(button,a.btn,.btn){
        border-radius:var(--rwph-theme-button-radius)!important;
        text-transform:${themeButtonCase}!important;
        letter-spacing:${themeButtonTracking}!important;
        border-width:var(--rwph-theme-border-width)!important;
        border-style:var(--rwph-theme-border-style)!important;
      }

      .rwph-panel-theme-picker{
        display:flex!important;
        flex-direction:column!important;
        width:min(520px, calc(100vw - 24px))!important;
        height:min(720px, calc(100vh - 28px))!important;
        max-width:calc(100vw - 16px)!important;
        max-height:calc(100vh - 16px)!important;
        min-width:min(300px, calc(100vw - 24px))!important;
        min-height:260px!important;
        overflow:hidden!important;
      }
      .rwph-panel-theme-picker-head{
        flex:0 0 auto!important;
        position:sticky!important;
        top:0!important;
        z-index:20!important;
        cursor:move!important;
        user-select:none!important;
      }
      .rwph-panel-theme-picker-body{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior:contain!important;
        scrollbar-width:thin!important;
        scrollbar-color:${t.accent} ${t.bg}!important;
        padding-right:8px!important;
      }
      .rwph-panel-theme-grid{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:10px!important;
        overflow:visible!important;
      }
      .rwph-panel-theme-picker > .rw-resize-handle{
        position:absolute!important;
        width:18px!important;
        height:18px!important;
        z-index:30!important;
        touch-action:none!important;
        -webkit-user-select:none!important;
        user-select:none!important;
        opacity:.95!important;
        background:rgba(2,6,23,.18)!important;
      }
      .rwph-panel-theme-picker > .rw-resize-handle-se{
        right:7px!important;
        bottom:7px!important;
        cursor:nwse-resize!important;
        border-right:2px solid ${t.accent}!important;
        border-bottom:2px solid ${t.accent2}!important;
        border-radius:0 0 8px 0!important;
      }
      .rwph-panel-theme-picker > .rw-resize-handle-sw{
        left:7px!important;
        bottom:7px!important;
        cursor:nesw-resize!important;
        border-left:2px solid ${t.accent}!important;
        border-bottom:2px solid ${t.accent2}!important;
        border-radius:0 0 0 8px!important;
      }
      .rwph-panel-theme-picker > .rw-resize-handle-nw{
        left:7px!important;
        top:7px!important;
        cursor:nwse-resize!important;
        border-left:2px solid ${t.accent}!important;
        border-top:2px solid ${t.accent2}!important;
        border-radius:8px 0 0 0!important;
      }

      .rwph-theme-choice{
        justify-content:flex-start!important;
        min-height:48px!important;
        border-radius:var(--rwph-theme-button-radius)!important;
      }
      .rwph-theme-choice small{
        display:block!important;
        color:${t.soft}!important;
        font-size:10px!important;
        font-weight:700!important;
        margin-top:2px!important;
        text-transform:none!important;
        letter-spacing:0!important;
      }
      .rwph-panel-theme-picker-body::-webkit-scrollbar{
        width:8px!important;
        height:8px!important;
      }
      .rwph-panel-theme-picker-body::-webkit-scrollbar-track{
        background:${t.bg}!important;
        border-radius:999px!important;
      }
      .rwph-panel-theme-picker-body::-webkit-scrollbar-thumb{
        background:linear-gradient(180deg,${t.accent},${t.accent2})!important;
        border:2px solid ${t.bg}!important;
        border-radius:999px!important;
      }

      #rw-payout-helper ::-webkit-scrollbar-thumb,
      #rw-pay-all-panel ::-webkit-scrollbar-thumb,
      .rw-pay-all-panel ::-webkit-scrollbar-thumb,
      #rwph-xanax-send-status ::-webkit-scrollbar-thumb,
      .rwph-floating-panel ::-webkit-scrollbar-thumb,
      .rwph-results-loading-panel ::-webkit-scrollbar-thumb,
      .rwph-results-html-panel ::-webkit-scrollbar-thumb,
      .rw-results-panel ::-webkit-scrollbar-thumb{
        background:linear-gradient(180deg,${t.accent},${t.accent2})!important;
        border:2px solid ${t.bg}!important;
      }
    `;
  }

  function rwphApplyPanelThemeChoice(key = "") {
    const themeKey = key || rwphGetPanelThemeKey();
    const theme = rwphGetPanelThemePreset(themeKey);
    let style = document.getElementById("rwph-panel-theme-choice-v1379");
    if (!style) {
      style = document.createElement("style");
      style.id = "rwph-panel-theme-choice-v1379";
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = rwphPanelThemeCss(theme);
    document.documentElement.setAttribute("data-rwph-panel-theme", themeKey);
    const current = document.getElementById("rw-current-panel-theme-label");
    if (current) current.textContent = theme.label;
  }

  function rwphClosePanelThemePicker() {
    const panel = document.getElementById("rwph-panel-theme-picker");
    if (panel) panel.remove();
  }

  function rwphOpenPanelThemePicker() {
    rwphClosePanelThemePicker();
    const presets = rwphPanelThemePresets();
    const currentKey = rwphGetPanelThemeKey();
    const panel = document.createElement("section");
    panel.id = "rwph-panel-theme-picker";
    panel.className = "rwph-floating-panel rwph-panel-theme-picker";
    panel.innerHTML = `
      <div class="rwph-panel-head rwph-panel-theme-picker-head">
        <span>Panel Theme / Colours</span>
        <button id="rwph-theme-picker-close" class="danger" type="button" title="Close">×</button>
      </div>
      <div class="rwph-panel-theme-picker-body">
        <div class="rw-small">Choose a theme below. It changes the colours of all RWPH script panels, helpers, dropdowns and buttons, but it does not change the generated newsletter HTML code. Saved for this browser/PDA.</div>
        <div class="rwph-panel-theme-current">Current theme: <b id="rw-current-panel-theme-label">${esc(presets[currentKey].label)}</b></div>
        <div class="rwph-panel-theme-grid">
          ${Object.entries(presets).map(([key, theme]) => `
            <button class="rwph-theme-choice ${key === currentKey ? "primary" : "secondary"}" type="button" data-rwph-theme-key="${esc(key)}" style="border-color:${esc(theme.line2)}!important;border-radius:${esc(theme.buttonRadius || "12px")}!important;background:${esc(theme.buttonTexture ? `${theme.buttonTexture},` : "")}linear-gradient(135deg,${esc(theme.panel3)},${esc(theme.bg)})!important;color:${esc(theme.text)}!important;">
              <span class="rwph-theme-swatch" style="background:linear-gradient(135deg,${esc(theme.accent)},${esc(theme.accent2)});"></span>
              <span>${esc(theme.label)}<small>${esc(theme.styleName || "Custom style")}</small></span>
            </button>`).join("")}
        </div>
        <button id="rwph-theme-reset" class="secondary" type="button">Reset to Bronze Gold</button>
      </div>
      <div class="rwph-resize-handle" data-rwph-resize-dir="se" title="Resize"></div>
    `;
    document.body.appendChild(panel);
    rwphEnablePanelMoveResize(panel, ".rwph-panel-theme-picker-head");
    rwphApplyPanelThemeChoice(currentKey);

    panel.querySelector("#rwph-theme-picker-close")?.addEventListener("click", rwphClosePanelThemePicker);
    panel.querySelector("#rwph-theme-reset")?.addEventListener("click", () => {
      GM_setValue(PANEL_THEME_STORAGE_KEY, "bronze");
      rwphApplyPanelThemeChoice("bronze");
      rwphOpenPanelThemePicker();
    });
    panel.querySelectorAll("[data-rwph-theme-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-rwph-theme-key") || "bronze";
        GM_setValue(PANEL_THEME_STORAGE_KEY, key);
        rwphApplyPanelThemeChoice(key);
        panel.querySelectorAll("[data-rwph-theme-key]").forEach((b) => b.classList.toggle("primary", b === btn));
        panel.querySelectorAll("[data-rwph-theme-key]").forEach((b) => b.classList.toggle("secondary", b !== btn));
      });
    });
  }

  function attachPanelThemeButton() {
    const btn = document.getElementById("rw-open-theme-picker");
    if (!btn || btn.dataset.rwphThemeReady === "1") return;
    btn.dataset.rwphThemeReady = "1";
    btn.addEventListener("click", rwphOpenPanelThemePicker);
  }


  function attachMoveLauncherButton() {
    ["rw-move-launcher", "rw-move-launcher-admin"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.rwphCornerReady === "1") return;
      btn.dataset.rwphCornerReady = "1";
      btn.addEventListener("click", cycleLauncherCorner);
    });
    updateLauncherCornerButtonLabels();
  }

  function closePanel() {
    const panel = document.getElementById("rw-payout-helper");
    if (panel) {
      rwphSavePanelLayout(panel);
      panel.remove();
    }
    rwphSetPanelOpenState(false);
    setLauncherOpenState(false);
  }

  function togglePanel() {
    const panel = document.getElementById("rw-payout-helper");

    if (panel) {
      closePanel();
      return;
    }

    createPanel();
  }

  function apiPost(path, body) {
    return new Promise((resolve, reject) => {
      const safePath = String(path || "");
      const requestTimeout = safePath.includes("/api/calc/") ? 300000 : 120000;
      GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}${path}`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(body || {}),
        timeout: requestTimeout,
        onload: (res) => {
          try {
            const json = JSON.parse(res.responseText || "{}");
            if (!json.ok) {
              const err = new Error(json.error || `Server error ${res.status}`);
              err.retryAfterSeconds = Number(json.retryAfterSeconds || 0);
              err.cooldownEndsAtMs = Number(json.cooldownEndsAtMs || 0);
              err.status = Number(res.status || 0);
              reject(err);
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Could not parse server response. Status ${res.status}.`));
          }
        },
        onerror: () => reject(new Error("Failed to reach paywall server.")),
        ontimeout: () => reject(new Error("Paywall server request timed out. On phone/Torn PDA, large wars or Torn API delays can take longer; try again or use a cached report if available.")),
      });
    });
  }


  function apiPostCancelable(path, body, options = {}) {
    let request = null;
    let settled = false;
    const promise = new Promise((resolve, reject) => {
      const safePath = String(path || "");
      const requestTimeout = Number(options.timeout || 0) > 0 ? Number(options.timeout) : (safePath.includes("/api/calc/") ? 600000 : 120000);
      request = GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}${path}`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(body || {}),
        timeout: requestTimeout,
        onload: (res) => {
          settled = true;
          try {
            const json = JSON.parse(res.responseText || "{}");
            if (!json.ok) {
              const err = new Error(json.error || `Server error ${res.status}`);
              err.retryAfterSeconds = Number(json.retryAfterSeconds || 0);
              err.cooldownEndsAtMs = Number(json.cooldownEndsAtMs || 0);
              err.status = Number(res.status || 0);
              err.cancelled = !!json.cancelled;
              reject(err);
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Could not parse server response. Status ${res.status}.`));
          }
        },
        onerror: () => { settled = true; reject(new Error("Failed to reach paywall server.")); },
        ontimeout: () => { settled = true; reject(new Error("Paywall server request timed out. On phone/Torn PDA, large wars or Torn API delays can take longer; try again or use a cached report if available.")); },
        onabort: () => { settled = true; const err = new Error("Calculation cancelled because the results loading tab was closed."); err.cancelled = true; reject(err); },
      });
    });
    return {
      promise,
      abort: () => {
        if (settled) return;
        try { if (request && typeof request.abort === "function") request.abort(); } catch (_) {}
      },
    };
  }

  function rwphSendCalcCancel(progressId, reason = "Results loading tab closed before calculation finished.") {
    const id = String(progressId || "").trim();
    if (!id) return;
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}/api/calc/cancel`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ progressId: id, reason }),
        timeout: 10000,
        onload: () => {},
        onerror: () => {},
        ontimeout: () => {},
      });
    } catch (_) {}
  }

  function rwphCleanResponsePreview(text, maxLen = 260) {
    return String(text || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen);
  }

  function rwphParseAdminJsonResponse(res) {
    const raw = String(res?.responseText ?? res?.response ?? "");
    const trimmed = raw.trim();

    if (!trimmed) {
      throw new Error(`Admin server returned an empty response. Status ${res?.status || 0}. Make sure the backend/admin route is running.`);
    }

    try {
      return JSON.parse(trimmed);
    } catch (_) {}

    // Some mobile/PDA/tunnel wrappers can return text around the JSON. Try to salvage the JSON object before failing.
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const possibleJson = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(possibleJson);
      } catch (_) {}
    }

    const preview = rwphCleanResponsePreview(trimmed);
    const looksHtml = /<\s*!doctype|<\s*html|ngrok|browser warning|tunnel/i.test(trimmed);
    if (looksHtml) {
      throw new Error(`Admin server returned HTML instead of JSON. Status ${res?.status || 0}. Check the backend URL/tunnel is pointing to the RWPH server and restart the server if needed. Response: ${preview || "HTML page"}`);
    }

    throw new Error(`Could not parse admin server response. Status ${res?.status || 0}. Response: ${preview || "No readable response text"}`);
  }

  function adminRequest(method, path, adminKey, body = {}) {
    return new Promise((resolve, reject) => {
      const isGet = String(method).toUpperCase() === "GET";
      const sep = path.includes("?") ? "&" : "?";
      const url = isGet
        ? `${PAYWALL_API_BASE}${path}${sep}adminKey=${encodeURIComponent(adminKey)}&_rwph=${Date.now()}`
        : `${PAYWALL_API_BASE}${path}`;

      GM_xmlhttpRequest({
        method,
        url,
        responseType: "text",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "ngrok-skip-browser-warning": "true",
          "Cache-Control": "no-cache",
        },
        data: isGet ? undefined : JSON.stringify({ ...(body || {}), adminKey, _rwph: Date.now() }),
        timeout: 120000,
        onload: (res) => {
          try {
            const json = rwphParseAdminJsonResponse(res);
            if (!json.ok) {
              const err = new Error(json.error || `Admin server error ${res.status}`);
              err.status = Number(res.status || 0);
              reject(err);
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(e);
          }
        },
        onerror: () => reject(new Error("Failed to reach admin server. Check the backend/tunnel URL and @connect domain.")),
        ontimeout: () => reject(new Error("Admin server request timed out.")),
      });
    });
  }

  function formatUnixDate(unixSeconds) {
    if (!unixSeconds) return "Unknown";
    return new Date(Number(unixSeconds) * 1000).toLocaleString();
  }

  async function grantOwnerLicenseFromAdminKey(adminKey, statusEl) {
    if (!adminKey) throw new Error("Enter your admin key first.");

    const result = await adminRequest("POST", "/api/admin/grant-owner", adminKey, { days: 10000 });

    if (statusEl) {
      rwphToastPanelInfo(
        statusEl,
        `Admin key saved. Owner license granted to ${result.name || "Owner"} (${result.tornId}) until ${formatUnixDate(result.expiresAt)}.`,
        "info",
        "RWPH Admin"
      );
    }

    return result;
  }

  async function extendAdminLicenseFromCurrentForm(statusEl, skipConfirm = false) {
    const adminKey = document.getElementById("rw-admin-key")?.value.trim();
    const tornId = document.getElementById("rw-admin-torn-id")?.value.trim();
    const name = document.getElementById("rw-admin-name")?.value.trim() || `User ${tornId}`;
    const days = Number(document.getElementById("rw-admin-days")?.value || 30);

    if (!adminKey) throw new Error("Enter your admin key first.");
    if (!tornId) throw new Error("Enter a Torn ID first.");
    if (!days || days <= 0) throw new Error("Enter valid extension days.");

    if (!skipConfirm && !confirm(`Extend license for ${name} (${tornId}) by ${days} day(s)?`)) return null;

    GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
    if (statusEl) statusEl.textContent = `Extending ${name} (${tornId}) by ${days} day(s)...`;

    const result = await adminRequest("POST", "/api/admin/extend", adminKey, { tornId, name, days });

    if (statusEl) {
      const previousText = result.previousExpiresAt ? ` Previous expiry: ${formatUnixDate(result.previousExpiresAt)}.` : "";
      rwphToastPanelInfo(
        statusEl,
        `Extended license for ${result.name || name} (${result.tornId || tornId}) by ${result.days || days} day(s).${previousText} New expiry: ${formatUnixDate(result.expiresAt)}.`,
        "info",
        "RWPH Admin"
      );
    }

    return result;
  }

  async function removeAdminLicenseDaysFromCurrentForm(statusEl, skipConfirm = false) {
    const adminKey = document.getElementById("rw-admin-key")?.value.trim();
    const tornId = document.getElementById("rw-admin-torn-id")?.value.trim();
    const name = document.getElementById("rw-admin-name")?.value.trim() || `User ${tornId}`;
    const days = Number(document.getElementById("rw-admin-days")?.value || 30);

    if (!adminKey) throw new Error("Enter your admin key first.");
    if (!tornId) throw new Error("Enter a Torn ID first.");
    if (!days || days <= 0) throw new Error("Enter valid days to remove.");

    if (!skipConfirm && !confirm(`Remove ${days} licence day(s) from ${name} (${tornId})?`)) return null;

    GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
    if (statusEl) statusEl.textContent = `Removing ${days} licence day(s) from ${name} (${tornId})...`;

    const result = await adminRequest("POST", "/api/admin/remove", adminKey, { tornId, name, days });

    if (statusEl) {
      const previousText = result.previousExpiresAt ? ` Previous expiry: ${formatUnixDate(result.previousExpiresAt)}.` : "";
      const endedText = result.expiredNow ? " Licence is now expired." : "";
      rwphToastPanelInfo(
        statusEl,
        `Removed ${result.days || days} licence day(s) from ${result.name || name} (${result.tornId || tornId}).${previousText} New expiry: ${formatUnixDate(result.expiresAt)}.${endedText}`,
        result.expiredNow ? "warn" : "info",
        "RWPH Admin"
      );
    }

    return result;
  }

  // v1.1.133: admin licence cards show time left and the Fill button copies both Torn ID and name.
  // v1.1.141: panel open state is now tab/page scoped; RWPH panels auto-close on Torn page changes, stay open when switching browser tabs, and reopen after refresh on the same page.
  // v1.1.142: unified panel scrolling so each panel/tab uses one clean scroll area instead of split/nested scroll panels.
  // v1.1.139: hidden white outer panel scrollbars while keeping blue internal RWPH scrollbars.
  // v1.1.138: moving/resizing is enabled for all RWPH floating panels, including Payments/manual-review helpers.
  // v1.1.137: removed the Add Balance removal sentence from Help panel wording.
  // v1.1.136: clearer payment expiry timers, auto-close on licence payment flow, and tighter panel fit.
  // v1.1.151: Buy Licence and Extend Licence now match the Fetch + Calculate button background.
  // v1.1.153: Results loading tab now explains what is loading and gives rough wait-time guidance.
  // v1.1.144: main panel licence controls rearranged so Your Expiration sits under Extend Licence and Lock sits under Save Key.
  // v1.1.145: swapped the main panel positions so Reopen Results appears above Fetch + Calculate after results are available.
  // v1.1.146: restored the Xanax Payment Helper action buttons by moving them high in the helper body and forcing them visible inside the panel.
  // v1.1.147: Xanax Payment Helper now reuses the main Payment Code Ready expiry timer and gives it a stronger highlighted style.
  // v1.1.148: swapped the main panel Fetch + Calculate and Reopen Results positions/sizes.
  // v1.1.149: fixed Xanax Payment Helper styling when the main panel auto-closes, restored visible timer/buttons, and hardened move/resize.
  // v1.1.167: added Help panel TOS / Responsible Use and API Usage sections.
  // v1.1.170: API notice is now a themed dropdown; API ToS table matches Help panel styling.
  // v1.1.168: added TOS uptime and update commitment wording.
  // v1.1.150: moved the Xanax helper expiry timer and copy buttons into the Required payment details block for better visibility.
  // v1.1.155: added Torn API rate-limit retry messaging so error 5 does not immediately fail the results tab.
  // v1.1.156: fixed the results loading elapsed counter and removed per-member Total Respect from result cards.
  // v1.1.191: results loading timer now counts past 59 seconds and loading step dots turn green as stages progress.
  // v1.1.192: results loading step dots now turn green from live server progress for licence, attack fetch, sorting, weighting, and final build stages.
  // v1.1.193: loading dots now update the loading tab DOM directly so Torn PDA/phone can show green stages reliably.
  // v1.1.194: loading dots now light the remaining calculation stages in order before the results page replaces the loading screen.
  // v1.1.219: removed the Fetch + Calculate time lock; cached reports now trigger a popup prompt instead.
  // v1.1.219: Use Cached Report opens matching cached reports, and server cache expires after 24 hours.
  // v1.1.219: licence verification rate limit is reduced to 2 checks per minute.
  // v1.1.220: moved cached report controls below Fetch + Calculate and renamed launcher movement controls.
  // v1.1.222: cached report status now shows exact saved and expiry timestamps instead of countdown text.
  // v1.1.224: payment codes are restored from the backend/database only; Payments Copy Panel buttons disappear after use and can restore the last hidden button.
  // v1.1.225: Your Expiration has a browser-side 2/minute click guard, and Payments Copy Panel hiding now uses forced !important hidden state.
  // v1.1.226: fullscreen Fetch + Calculate results panel now matches the RWPH midnight-blue main panel theme and layout.
  // v1.1.227: fullscreen Fetch + Calculate results panel layout rebuilt with a report header, summary strip, action side panel, and main member results area.
  // v1.1.235: Per Hit and Points System reports now have separate database cache buttons and both cached report types preserve Payments Copy Panel handoff.
  // v1.1.236: moved each cache/open/delete control inside its matching Per Hit or Points settings dropdown and shortened cached button labels.
  // v1.1.233: Basic Calculations now uses a dropdown card matching the main panel theme.
  // v1.1.249: Points System fair-fight checkbox now supports custom Avg FF step size and custom bonus-per-step per payable hit; disabled checkbox adds no FF bonus.
  // v1.1.249: cleaned up Per Hit and Points System fullscreen member cards without changing calculation, cache, or Payments logic.
    // v1.1.258: Payments Copy Panel rows now carry explicit payout amount aliases and the amount prefill detector is more reliable on Torn banking fields.
    // v1.1.260: Payments Copy Panel amount prefill is scoped to the current selected member/payment form so the next payout does not land in the previous amount field.
    // v1.1.257: Cached reports ignore changed payout fields when matching saved backend/database reports.
  // v1.1.244: Use Cached Report opens through a dedicated backend cache-open route for both Per Hit and Points System reports.
  // v1.1.241: Use Cached Report now checks each mode independently so Per Hit and Points System buttons do not depend on the other dropdown being valid.
  // v1.1.238: moved public performance/cache status text into both Basic Calculations and Advanced Calculations dropdowns.
  // v1.1.237: moved Member Payout into both Basic Calculations and Advanced Calculations so each calculation section is self-contained.
  // v1.1.232: Points System hospital bonus now only applies to verified own-faction hospitalizations.
  // v1.1.232: added Points System Results mode with attack contribution scoring, own-faction hospital bonuses, and fair-fight modifiers.
  // v1.1.228: added Delete Cached Report beside Use Cached Report with a 10-minute successful-delete cooldown.
  // v1.1.229: updated Help panel wording for database-only cache deletion, cached-report payments, pending Xanax codes, live payment checks, and new button limits.
  // v1.1.230: hardened cached-report Payments row handoff, payment-copy button hiding when clipboard access fails, and Xanax helper restoration from backend/database on the item tab.
  // v1.1.195: loading dots also update on PC/desktop through direct DOM, postMessage, and loading-tab self polling.
  // v1.1.157: info-style button feedback moved out of the panel footer.
  // v1.1.158: expanded feedback across Admin, Results, Payments, and Xanax helper actions.
  // v1.1.159: feedback now appears as closable popup panels below the active RWPH panel and auto-closes after 30 seconds.
  // v1.1.175: Xanax Payment Helper close button now matches the main panel close button style and stays visible in the pinned header area.
  // v1.1.198: launcher button now only appears on Torn faction pages.
  // v1.1.199: Help panel cards are now dropdown buttons to keep the Help tab compact.
  // v1.1.183: Admin Remove replaces Revoke and subtracts licence days from the selected licence expiry. The old /api/admin/revoke alias has been removed.
  // v1.1.184: main panel opening always verifies an active server-side licence; missing/expired server licence locks the panel.
  function renderAdminLicenses(licenses) {
    if (!licenses || !licenses.length) {
      return `<div class="rw-muted">No active licenses found.</div>`;
    }

    const sorted = [...licenses].sort((a, b) => Number(b.expiresAt || 0) - Number(a.expiresAt || 0));

    return `
      <div class="rw-admin-list">
        ${sorted.map((license) => `
          <div class="rw-admin-license-card">
            <div class="rw-admin-license-top">
              <div>
                <div class="rw-admin-license-name">${esc(license.name || `User ${license.tornId}`)}</div>
                <div class="rw-result-id">Torn ID: ${esc(license.tornId || "unknown")}</div>
              </div>
              <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;">
                <button class="secondary rw-admin-fill-revoke" data-torn-id="${esc(license.tornId || "")}" data-name="${esc(license.name || `User ${license.tornId}`)}" style="margin:0;padding:5px 8px;">Fill</button>
              </div>
            </div>
            <div class="rw-muted" style="margin-top:6px;">
              Days left: ${esc(formatLicenseDaysLeft(license.expiresAt))}<br>
              Expires: ${esc(formatUnixDate(license.expiresAt))}<br>
              ${license.manualGrant ? "Manual grant" : "Payment/license record"}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }


  function rwphScheduleLicenseLockback(expiresAt) {
    const exp = Number(expiresAt || 0);
    if (window.__rwphLicenseExpiryTimer) {
      clearTimeout(window.__rwphLicenseExpiryTimer);
      window.__rwphLicenseExpiryTimer = null;
    }

    if (!Number.isFinite(exp) || exp <= 0) return;

    const msUntilExpiry = (exp * 1000) - Date.now();
    if (msUntilExpiry <= 0) {
      returnToLockedPanel("Your licence has expired. Buy Licence or extend your licence to unlock RWPH again.");
      return;
    }

    window.__rwphLicenseExpiryTimer = setTimeout(() => {
      returnToLockedPanel("Your licence has expired. Buy Licence or extend your licence to unlock RWPH again.");
    }, Math.min(msUntilExpiry + 1000, 2147483647));
  }


  function rwphReadManualLicenseCheckTimes() {
    try {
      const raw = GM_getValue(LICENSE_CHECK_RATE_STORAGE_KEY, "[]");
      const arr = Array.isArray(raw) ? raw : JSON.parse(String(raw || "[]"));
      return arr.map((x) => Number(x || 0)).filter((x) => Number.isFinite(x) && x > 0);
    } catch (_) {
      return [];
    }
  }

  function rwphWriteManualLicenseCheckTimes(times) {
    try { GM_setValue(LICENSE_CHECK_RATE_STORAGE_KEY, JSON.stringify((times || []).slice(-5))); } catch (_) {}
  }

  function rwphTryUseManualLicenseCheck(statusEl, buttonEl) {
    const nowMs = Date.now();
    const windowMs = 60 * 1000;
    const limit = 2;
    const fresh = rwphReadManualLicenseCheckTimes().filter((ts) => nowMs - ts < windowMs);
    if (fresh.length >= limit) {
      const waitSeconds = Math.max(1, Math.ceil((windowMs - (nowMs - fresh[0])) / 1000));
      const message = `Your Expiration can only be checked ${limit} times per minute. Try again in ${waitSeconds} second${waitSeconds === 1 ? "" : "s"}.`;
      if (statusEl) statusEl.textContent = message;
      if (buttonEl) {
        buttonEl.disabled = true;
        const originalText = buttonEl.dataset.rwphOriginalText || buttonEl.textContent || "Your Expiration";
        buttonEl.dataset.rwphOriginalText = originalText;
        buttonEl.textContent = `Wait ${waitSeconds}s`;
        setTimeout(() => {
          if (!buttonEl.isConnected) return;
          buttonEl.disabled = false;
          buttonEl.textContent = buttonEl.dataset.rwphOriginalText || "Your Expiration";
        }, Math.min(waitSeconds * 1000, 60000));
      }
      return false;
    }
    fresh.push(nowMs);
    rwphWriteManualLicenseCheckTimes(fresh);
    if (buttonEl) {
      buttonEl.disabled = true;
      setTimeout(() => { if (buttonEl.isConnected) buttonEl.disabled = false; }, 1200);
    }
    return true;
  }

  async function getSavedLicenseInfo() {
    const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
    const userKey =
      document.getElementById("rw-key")?.value.trim() ||
      document.getElementById("rw-paywall-key")?.value.trim() ||
      GM_getValue(STORAGE_KEY, "");

    if (!token && !userKey) {
      return { valid: false, error: "No saved license token or Torn API key found. Buy Licence or paste your Torn API key first." };
    }

    try {
      const result = await apiPost("/api/paywall/verify-token", { token, userKey });
      if (result.valid && Number(result.expiresAt || 0) <= Math.floor(Date.now() / 1000)) {
        GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, "");
        return { valid: false, error: "License expired." };
      }
      if (result.valid && result.token) GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
      if (result.valid && result.expiresAt) rwphScheduleLicenseLockback(result.expiresAt);
      return result;
    } catch (e) {
      return { valid: false, error: e.message || "License check failed." };
    }
  }

  function formatLicenseDaysLeft(expiresAt) {
    const secondsLeft = Number(expiresAt || 0) - Math.floor(Date.now() / 1000);
    if (!Number.isFinite(secondsLeft) || secondsLeft <= 0) return "Expired";

    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);

    if (days >= 1) return `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}`;
    if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
    return "Under 1 hour";
  }

  function rwphCloseLicenceInfoPanel() {
    document.getElementById("rwph-licence-info-panel")?.remove();
  }

  function rwphOpenLicenceInfoPanel(info = {}) {
    rwphCloseLicenceInfoPanel();
    rwphEnsureFloatingPanelCss();

    const valid = info.valid === true;
    const userName = info.name || "this user";
    const tornId = info.tornId || "unknown";
    const expiresText = info.expiresAt ? formatUnixDate(info.expiresAt) : "No active expiry found";
    const timeLeft = info.expiresAt ? formatLicenseDaysLeft(info.expiresAt) : "No active licence";

    const panel = document.createElement("div");
    panel.id = "rwph-licence-info-panel";
    panel.className = "rwph-floating-panel rwph-licence-info-panel";
    panel.style.cssText = `
      position: fixed;
      z-index: 1000003;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(520px, calc(100vw - 18px));
      max-height: min(620px, calc(100vh - 18px));
      overflow: hidden;
      border-radius: 22px;
      border: 1px solid rgba(245,158,11,.35);
      color: #fff7ed;
      font-family: Inter, Segoe UI, Arial, sans-serif;
    `;
    panel.innerHTML = `
      <style>
        #rwph-licence-info-panel * { box-sizing: border-box; }
        #rwph-licence-info-panel .rwph-panel-head { display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.10);cursor:move;touch-action:none;-webkit-user-select:none;user-select:none; }
        #rwph-licence-info-panel .rwph-panel-title { display:flex;align-items:center;gap:14px;font-weight:950;font-size:18px;color:#fff; }
        #rwph-licence-info-panel .rwph-panel-title img { width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(249,115,22,.70));pointer-events:none; }
        #rwph-licence-info-panel .rwph-floating-panel-body { padding:14px; overflow-y:auto; overflow-x:hidden; max-height:calc(100vh - 92px); }
        #rwph-licence-info-panel .rwph-licence-status-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px; }
        #rwph-licence-info-panel .rw-card { border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:10px;background:rgba(15,23,42,.54); }
        #rwph-licence-info-panel .rwph-stat-label { font-size:11px;color:#b9dcff;font-weight:800;margin-bottom:3px; }
        #rwph-licence-info-panel .rwph-stat-value { font-size:13px;color:#fff;font-weight:950;line-height:1.35; }
        #rwph-licence-info-panel .rwph-licence-note { font-size:12px;line-height:1.45;color:#c7e8ff;margin:4px 0 8px; }
        #rwph-licence-info-panel .rwph-licence-actions { display:flex;justify-content:flex-end;gap:8px;margin-top:12px; }
        #rwph-licence-info-panel #rwph-licence-info-close { min-width:42px;font-size:18px;padding:6px 10px; }
        @media (max-width:520px){ #rwph-licence-info-panel .rwph-licence-status-grid{grid-template-columns:1fr;} }
      </style>
      <div class="rwph-panel-head">
        <div class="rwph-panel-title"><img src="${RWPH_LAUNCHER_LOGO_DATA_URI}" alt="RWPH"><span>Your Licence Info</span></div>
        <button id="rwph-licence-info-close" class="danger" type="button" title="Close" aria-label="Close">×</button>
      </div>
      <div class="rwph-floating-panel-body">
        ${valid ? "" : `<div class="rw-card" style="border-color:rgba(239,68,68,.55);margin-bottom:10px;"><b>Licence check:</b> ${esc(info.error || "No active saved licence found.")}</div>`}
        <div class="rwph-licence-status-grid">
          <div class="rw-card"><div class="rwph-stat-label">User</div><div class="rwph-stat-value">${esc(userName)} (${esc(tornId)})</div></div>
          <div class="rw-card"><div class="rwph-stat-label">Licence status</div><div class="rwph-stat-value">${valid ? "Active" : "Not active"}</div></div>
          <div class="rw-card"><div class="rwph-stat-label">Time left</div><div class="rwph-stat-value">${esc(timeLeft)}</div></div>
          <div class="rw-card"><div class="rwph-stat-label">Expires</div><div class="rwph-stat-value">${esc(expiresText)}</div></div>
          <div class="rw-card"><div class="rwph-stat-label">Base licence</div><div class="rwph-stat-value">15 days per Xanax</div></div>
        </div>
        <div class="rwph-licence-actions"><button id="rwph-licence-info-close-bottom" class="secondary" type="button">Close</button></div>
      </div>
    `;
    document.body.appendChild(panel);
    panel.querySelector("#rwph-licence-info-close")?.addEventListener("click", rwphCloseLicenceInfoPanel);
    panel.querySelector("#rwph-licence-info-close-bottom")?.addEventListener("click", rwphCloseLicenceInfoPanel);
    rwphEnablePanelMoveResize(panel, ".rwph-panel-head");
  }

  async function showLicenseDays(statusEl, options = {}) {
    const info = await getSavedLicenseInfo();

    if (!info.valid) {
      rwphOpenLicenceInfoPanel(info || {});
      if (statusEl) statusEl.textContent = "Licence info panel opened.";
      if (document.getElementById("rw-key")) {
        const lockMsg = info.revoked
          ? "Your licence was revoked by an admin. Buy Licence or contact the owner to unlock RWPH again."
          : "Your licence has expired. Buy Licence or extend your licence to unlock RWPH again.";
        returnToLockedPanel(lockMsg);
      }
      return false;
    }

    rwphOpenLicenceInfoPanel(info || {});
    if (statusEl) statusEl.textContent = "Licence info panel opened.";
    return true;
  }

  function returnToLockedPanel(message = "Your licence has expired or was revoked. Buy Licence to unlock RWPH again.") {
    GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, "");
    if (window.__rwphLicenseMonitor) {
      clearInterval(window.__rwphLicenseMonitor);
      window.__rwphLicenseMonitor = null;
    }
    if (window.__rwphLicenseExpiryTimer) {
      clearTimeout(window.__rwphLicenseExpiryTimer);
      window.__rwphLicenseExpiryTimer = null;
    }

    const panel = document.getElementById("rw-payout-helper");
    if (!panel) return;

    showPaywallScreen(panel, { skipAutoUnlock: true });
    setTimeout(() => {
      const status = document.getElementById("rw-paywall-status");
      if (status) status.textContent = message;
    }, 0);
  }

  function startLicenseExpiryMonitor() {
    if (window.__rwphLicenseMonitor) clearInterval(window.__rwphLicenseMonitor);

    const checkLicenseNow = async () => {
      const panel = document.getElementById("rw-payout-helper");
      if (!panel || !document.getElementById("rw-key")) return;

      const info = await getSavedLicenseInfo();
      if (!info.valid) {
        const lockMsg = info.revoked
          ? "Your licence was revoked by an admin. Buy Licence or contact the owner to unlock RWPH again."
          : "Your licence has expired. Buy Licence or extend your licence to unlock RWPH again.";
        returnToLockedPanel(lockMsg);
        return;
      }
      if (info.expiresAt) rwphScheduleLicenseLockback(info.expiresAt);
    };

    // Licence is already verified when the panel opens. Keep the monitor slow so it does not consume the manual Your Expiration 2/minute allowance.
    window.__rwphLicenseMonitor = setInterval(checkLicenseNow, 10 * 60 * 1000);
  }



  function rwphFindAdminRoot(node) {
    return node?.closest?.("#rw-payout-helper") || document;
  }

  function rwphAdminQuery(root, selector) {
    return (root && root.querySelector ? root : document).querySelector(selector) || document.querySelector(selector);
  }

  function rwphAdminInputValue(root, selector) {
    return String(rwphAdminQuery(root, selector)?.value || "").trim();
  }

  function rwphRenderAdminStatusSummary(result) {
    const calculations = result.calculations || {};
    const cache = result.cache || {};
    const stats = result.stats || {};
    return `
      <div class="rw-admin-status-grid">
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Calculations</div><div class="rw-admin-status-value">${Number(calculations.active || 0)} active / direct start</div></div>
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Report cache</div><div class="rw-admin-status-value">${Number(cache.reportCacheEntries || 0)} saved</div></div>
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Cache hits</div><div class="rw-admin-status-value">${Number(stats.reportCacheHits || 0)}</div></div>
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Reports made</div><div class="rw-admin-status-value">${Number(stats.reportsCreated || 0)}</div></div>
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Torn cache</div><div class="rw-admin-status-value">${Number(cache.tornMemoryEntries || 0)} live</div></div>
        <div class="rw-admin-status-card"><div class="rw-admin-status-label">Storage</div><div class="rw-admin-status-value">${esc(result.storage?.mode || "json")}</div></div>
      </div>`;
  }

  function rwphGetAdminKeyFromPanel(root) {
    const adminKey = rwphAdminInputValue(root, "#rw-admin-key");
    if (!adminKey) throw new Error("Enter your admin key first.");
    return adminKey;
  }

  async function rwphRefreshAdminLicensesFromPanel(root) {
    const status = rwphAdminQuery(root, "#rw-admin-status");
    const results = rwphAdminQuery(root, "#rw-admin-results");
    const adminKey = rwphGetAdminKeyFromPanel(root);
    GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
    if (status) status.textContent = "Loading licences from server...";
    if (results) results.innerHTML = "";
    const result = await adminRequest("POST", "/api/admin/licenses", adminKey);
    if (results) results.innerHTML = renderAdminLicenses(result.licenses || []);
    rwphToastPanelInfo(status, `Loaded ${(result.licenses || []).length} licence(s).`, "info", "RWPH Admin");
    return result;
  }

  async function rwphLoadAdminServerStatusFromPanel(root) {
    const status = rwphAdminQuery(root, "#rw-admin-status");
    const box = rwphAdminQuery(root, "#rw-admin-status-summary");
    const adminKey = rwphGetAdminKeyFromPanel(root);
    GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
    if (status) status.textContent = "Loading server status...";
    const result = await adminRequest("POST", "/api/admin/status", adminKey);
    if (box) box.innerHTML = rwphRenderAdminStatusSummary(result);
    rwphToastPanelInfo(status, `Server online. ${Number(result.calculations?.active || 0)} calculation(s) active. Report cache has ${Number(result.cache?.reportCacheEntries || 0)} saved item(s).`, "info", "RWPH Admin");
    return result;
  }

  function rwphFindAdminSection(root) {
    const scope = root && root.querySelector ? root : document;
    return scope.querySelector("#rw-paywall-admin-section, #rw-admin-tab-section") || document.querySelector("#rw-paywall-admin-section, #rw-admin-tab-section");
  }

  function rwphEnsureAdminGateNote(adminSection) {
    if (!adminSection) return null;
    let note = adminSection.querySelector("#rw-admin-gate-note");
    if (note) return note;
    note = document.createElement("div");
    note.id = "rw-admin-gate-note";
    note.className = "rw-muted rw-admin-gate-note";
    note.textContent = "Enter your ADMIN_KEY and click Save Admin Key to show the admin tools.";
    const saveBtn = adminSection.querySelector("#rw-admin-save-key");
    const row = saveBtn?.closest?.(".rw-actions") || adminSection.querySelector("#rw-admin-key")?.closest?.("label");
    if (row?.parentNode) row.insertAdjacentElement("afterend", note);
    else adminSection.prepend(note);
    return note;
  }

  function rwphSetAdminToolsVisible(root, visible, message = "") {
    const adminSection = rwphFindAdminSection(root);
    if (!adminSection) return;
    const unlocked = !!visible;
    adminSection.dataset.rwphAdminUnlocked = unlocked ? "1" : "0";

    const note = rwphEnsureAdminGateNote(adminSection);
    if (note) {
      note.hidden = unlocked;
      note.textContent = message || (unlocked
        ? "Admin tools unlocked."
        : "Enter your ADMIN_KEY and click Save Admin Key to show the admin tools.");
    }

    adminSection.querySelectorAll([
      "#rw-admin-list",
      "#rw-admin-status-load",
      "#rw-move-launcher-admin",
      "#rw-admin-grant",
      "#rw-admin-extend",
      "#rw-admin-revoke",
      ".rw-admin-advanced-box",
      "#rw-admin-results"
    ].join(",")).forEach((el) => { el.hidden = !unlocked; });

    ["#rw-admin-torn-id", "#rw-admin-name", "#rw-admin-days"].forEach((selector) => {
      const label = adminSection.querySelector(selector)?.closest?.("label");
      if (label) label.hidden = !unlocked;
    });

    const status = adminSection.querySelector("#rw-admin-status");
    if (status && !unlocked && !String(status.textContent || "").trim()) {
      status.textContent = "Admin tools are hidden until a valid admin key is saved.";
    }
  }

  function rwphAdminToolsAreVisible(root) {
    return rwphFindAdminSection(root)?.dataset?.rwphAdminUnlocked === "1";
  }

  async function rwphSaveAdminKeyAndRevealTools(root, options = {}) {
    const status = rwphAdminQuery(root, "#rw-admin-status");
    const adminKey = rwphGetAdminKeyFromPanel(root);
    GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
    rwphSetAdminToolsVisible(root, false, "Checking admin key with the server...");
    if (status) status.textContent = "Checking admin key with the server...";

    const serverStatus = await adminRequest("POST", "/api/admin/status", adminKey);
    rwphSetAdminToolsVisible(root, true);
    const summary = rwphAdminQuery(root, "#rw-admin-status-summary");
    if (summary) summary.innerHTML = rwphRenderAdminStatusSummary(serverStatus);

    if (options.grantOwner !== false) {
      try {
        await grantOwnerLicenseFromAdminKey(adminKey, status);
      } catch (e) {
        rwphToastPanelInfo(status, `Admin key verified. Owner licence auto-grant was skipped: ${e.message}`, "warn", "RWPH Admin");
      }
    } else {
      rwphToastPanelInfo(status, "Admin key verified. Admin tools unlocked.", "info", "RWPH Admin");
    }

    if (options.refreshLicenses !== false) {
      try {
        await rwphRefreshAdminLicensesFromPanel(root);
      } catch (e) {
        rwphToastPanelInfo(status, `Admin tools unlocked, but licence list could not load: ${e.message}`, "warn", "RWPH Admin");
      }
    }
    return serverStatus;
  }

  function rwphBindAdminControls(root) {
    const panelRoot = root && root.addEventListener ? root : document;
    if (panelRoot.__rwphAdminDelegatedBound) return;
    panelRoot.__rwphAdminDelegatedBound = true;
    panelRoot.addEventListener("click", async (event) => {
      const target = event.target;
      const adminAction = target?.closest?.("#rw-admin-save-key, #rw-admin-list, #rw-admin-status-load, #rw-admin-grant, #rw-admin-extend, #rw-admin-revoke, .rw-admin-fill-revoke");
      if (!adminAction || !panelRoot.contains?.(adminAction)) return;
      const rootScope = rwphFindAdminRoot(adminAction);
      const status = rwphAdminQuery(rootScope, "#rw-admin-status");
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      try {
        if (adminAction.id !== "rw-admin-save-key" && !rwphAdminToolsAreVisible(rootScope)) {
          throw new Error("Save a valid admin key first. Admin tools are hidden until the server accepts the key.");
        }
        if (adminAction.classList?.contains("rw-admin-fill-revoke")) {
          const filledId = adminAction.dataset.tornId || "";
          const filledName = adminAction.dataset.name || (filledId ? `User ${filledId}` : "");
          const idInput = rwphAdminQuery(rootScope, "#rw-admin-torn-id");
          const nameInput = rwphAdminQuery(rootScope, "#rw-admin-name");
          if (idInput) idInput.value = filledId;
          if (nameInput) nameInput.value = filledName;
          rwphToastPanelInfo(status, filledName ? `Filled ${filledName} (${filledId}) into the admin form.` : `Filled Torn ID ${filledId} into the admin form.`, "info", "RWPH Admin");
          return;
        }

        if (adminAction.id === "rw-admin-status-load") {
          await rwphLoadAdminServerStatusFromPanel(rootScope);
          return;
        }

        if (adminAction.id === "rw-admin-list") {
          await rwphRefreshAdminLicensesFromPanel(rootScope);
          return;
        }

        if (adminAction.id === "rw-admin-save-key") {
          await rwphSaveAdminKeyAndRevealTools(rootScope, { grantOwner: true, refreshLicenses: true });
          return;
        }

        if (adminAction.id === "rw-admin-grant") {
          const adminKey = rwphGetAdminKeyFromPanel(rootScope);
          const tornId = rwphAdminInputValue(rootScope, "#rw-admin-torn-id");
          const name = rwphAdminInputValue(rootScope, "#rw-admin-name") || `User ${tornId}`;
          const days = Number(rwphAdminQuery(rootScope, "#rw-admin-days")?.value || 30);
          if (!tornId) return alert("Enter the player's Torn ID.");
          if (!days || days <= 0) return alert("Enter valid licence days.");
          GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
          if (status) status.textContent = `Granting ${days} day licence to ${name} (${tornId})...`;
          const result = await adminRequest("POST", "/api/admin/grant", adminKey, { tornId, name, days });
          rwphToastPanelInfo(status, `Granted licence to ${result.name || name} (${result.tornId || tornId}) until ${formatUnixDate(result.expiresAt)}.`, "info", "RWPH Admin");
          await rwphRefreshAdminLicensesFromPanel(rootScope);
          return;
        }

        if (adminAction.id === "rw-admin-extend") {
          const result = await extendAdminLicenseFromCurrentForm(status);
          if (result) await rwphRefreshAdminLicensesFromPanel(rootScope);
          return;
        }

        if (adminAction.id === "rw-admin-revoke") {
          const result = await removeAdminLicenseDaysFromCurrentForm(status);
          if (result) await rwphRefreshAdminLicensesFromPanel(rootScope);
        }
      } catch (e) {
        const actionName = adminAction.id === "rw-admin-save-key" ? "Admin key save" : adminAction.id === "rw-admin-list" ? "Admin list" : adminAction.id === "rw-admin-status-load" ? "Server status" : adminAction.id === "rw-admin-grant" ? "Admin grant" : adminAction.id === "rw-admin-extend" ? "Admin extend" : adminAction.id === "rw-admin-revoke" ? "Admin remove" : "Admin action";
        rwphToastPanelError(status, `${actionName} error: ${e.message}`, "RWPH Admin");
      }
    }, true);
  }
  async function rwphCheckLicenseOnPanelOpen() {
    const info = await getSavedLicenseInfo();

    if (!info.valid) {
      GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, "");
      const lowerError = String(info.error || "").toLowerCase();
      const message = info.revoked
        ? "Your licence was revoked by an admin. Buy Licence or contact the owner to unlock RWPH again."
        : lowerError.includes("expired")
          ? "Your licence has expired. Buy Licence or extend your licence to unlock RWPH again."
          : lowerError.includes("server licence") || lowerError.includes("server license") || lowerError.includes("no active")
            ? "No active server licence was found. Buy Licence, Extend Licence, or ask an admin to grant licence days."
            : (info.error || "No active licence found. Buy Licence, Extend Licence, or use Unlock Panel after your licence is active.");
      return { valid: false, info, message };
    }

    if (info.token) GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, info.token);
    if (info.expiresAt) rwphScheduleLicenseLockback(info.expiresAt);
    return { valid: true, info, message: "Licence active." };
  }

  async function rwphUnlockMainPanelIfActive(statusEl, reason = "auto") {
    const panel = document.getElementById("rw-payout-helper");
    const keyInput = document.getElementById("rw-paywall-key");
    if (!panel || !keyInput || document.getElementById("rw-key")) return false;
    if (window.__rwphAutoUnlockInFlight) return false;

    const key = keyInput.value.trim();
    const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
    if (!key && !token) return false;

    window.__rwphAutoUnlockInFlight = true;
    try {
      if (key) GM_setValue(STORAGE_KEY, key);
      if (statusEl) {
        statusEl.textContent = reason === "save"
          ? "API key saved. Checking active licence..."
          : "Checking active licence...";
      }

      const info = await getSavedLicenseInfo();
      if (!panel.isConnected || document.getElementById("rw-key")) return false;

      if (!info.valid) {
        if (statusEl && reason !== "silent") {
          statusEl.textContent = "No active licence found yet. Buy Licence, Extend Licence, or use Unlock Panel after payment is complete.";
        }
        return false;
      }

      if (info.token) GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, info.token);
      if (info.expiresAt) rwphScheduleLicenseLockback(info.expiresAt);
      clearPendingPayment();
      showMainScreen(panel);

      const mainStatus = document.getElementById("rw-status");
      if (mainStatus) {
        mainStatus.textContent = `Licence active for ${info.name || "this user"}. Main panel unlocked automatically.`;
      }
      return true;
    } catch (e) {
      if (statusEl && reason !== "silent") statusEl.textContent = "Auto-unlock check failed: " + (e.message || e);
      return false;
    } finally {
      window.__rwphAutoUnlockInFlight = false;
    }
  }

  function panelBaseCss() {
    // All selectors in this stylesheet must stay scoped to RWPH elements. Do not style body/html/Torn globals here.
    return `
      #rw-payout-helper {
        position: fixed;
        z-index: 999999;
        right: 18px;
        top: 90px;
        width: 300px;
        max-height: 78vh;
        overflow: visible;
        min-width: 240px;
        min-height: 220px;
        background:
          linear-gradient(180deg, rgba(28,20,18,.98) 0%, rgba(38,25,22,.98) 9%, rgba(21,19,18,.98) 9.5%, rgba(24,21,20,.98) 100%) !important;
        color: #f8efe7 !important;
        border: 1px solid rgba(186,136,87,.30);
        border-radius: 20px;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 0 4px rgba(92,26,20,.20) inset, 0 0 24px rgba(170,58,34,.10), 0 22px 55px rgba(0,0,0,.78);
        font: 11px Arial, sans-serif;
        backdrop-filter: blur(14px);
      }
      #rw-payout-helper * { box-sizing: border-box; }
      #rw-payout-helper::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 20px;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 14%, rgba(255,132,64,.10), transparent 20%),
          radial-gradient(circle at 82% 10%, rgba(185,46,46,.10), transparent 22%),
          linear-gradient(135deg, transparent 0 66%, rgba(124,35,24,.06) 66% 69%, transparent 69% 100%),
          repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 2px, transparent 2px 18px),
          repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 1px, transparent 1px 16px);
        mix-blend-mode: screen;
        opacity: .78;
      }
      #rw-payout-helper::after {
        content: "";
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 72px;
        height: 10px;
        border-radius: 0 0 12px 12px;
        background: linear-gradient(180deg, rgba(181,134,66,.95), rgba(116,72,31,.95));
        box-shadow: 0 2px 0 rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.05) inset;
        pointer-events: none;
        opacity: .92;
      }
      #rw-payout-helper .rw-head {
        position: relative;
        z-index: 1;
        padding: 12px 14px;
        background: linear-gradient(90deg, rgba(95,26,19,.96), rgba(140,53,31,.94) 48%, rgba(95,26,19,.96)) !important;
        color: #fff2dd !important;
        border-bottom: 1px solid rgba(192,144,84,.28);
        border-radius: 18px 18px 0 0;
        box-shadow: inset 0 -4px 0 rgba(70,17,13,.55), inset 0 1px 0 rgba(255,255,255,.05);
        cursor: move;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 900;
        letter-spacing: .8px;
        text-transform: uppercase;
        text-shadow: 0 1px 0 rgba(0,0,0,.55), 0 0 8px rgba(255,166,94,.16);
      }
      #rw-payout-helper > .rw-body { position: relative; z-index: 1; padding: 20px 14px 14px; max-height: calc(78vh - 48px); overflow: auto; }
      #rw-payout-helper .rw-results-panel {
        position: fixed !important;
        z-index: 1000002 !important;
        right: 328px;
        top: 90px;
        width: 430px;
        max-width: calc(100vw - 24px);
        max-height: 78vh;
        overflow: auto;
        min-width: 280px;
        min-height: 220px;
        background:
          linear-gradient(180deg, rgba(28,20,18,.98) 0%, rgba(38,25,22,.98) 9%, rgba(21,19,18,.98) 9.5%, rgba(24,21,20,.98) 100%) !important;
        border: 1px solid rgba(186,136,87,.30);
        border-radius: 20px;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 0 4px rgba(92,26,20,.20) inset, 0 0 24px rgba(170,58,34,.10), 0 22px 55px rgba(0,0,0,.78);
        color: #f8efe7 !important;
        backdrop-filter: blur(14px);
      }
      #rw-payout-helper .rw-results-panel[hidden] { display: none !important; }
      #rw-payout-helper .rw-results-panel:not([hidden]) { display: block !important; }
      #rw-payout-helper .rw-results-panel .rw-body { padding: 12px 10px 10px; }
      #rw-payout-helper .rw-results-panel .rw-head { cursor: move; }
      @media (max-width: 760px) {
        #rw-payout-helper .rw-results-panel {
          right: 12px;
          left: 12px;
          top: 390px;
          width: auto;
          max-height: 55vh;
        }
      }
      #rw-payout-helper .rw-head::before,
      #rw-payout-helper .rw-head::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 28px;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(230,186,116,.9), transparent);
        transform: translateY(-50%);
      }
      #rw-payout-helper .rw-head::before { left: 10px; }
      #rw-payout-helper .rw-head::after { right: 44px; }
      #rw-payout-helper .rw-head span {
        display: inline-block;
        padding: 0 24px;
      }
      #rw-payout-helper .rw-resize-handle {
        position: absolute;
        right: 7px;
        bottom: 7px;
        width: 22px;
        height: 22px;
        z-index: 5;
        cursor: nwse-resize;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
        border-right: 2px solid rgba(230,186,116,.72);
        border-bottom: 2px solid rgba(230,186,116,.72);
        border-radius: 0 0 8px 0;
        opacity: .9;
      }

      #rw-payout-helper label { display: block; margin-top: 10px; color: #e9c59f !important; font-weight: 700; text-shadow: 0 0 8px rgba(255,140,66,.06); }
      #rw-payout-helper input {
        width: 100%;
        margin-top: 5px;
        padding: 9px 10px;
        border-radius: 12px;
        border: 1px solid rgba(183,133,85,.30);
        background: linear-gradient(180deg, rgba(29,23,21,.88), rgba(40,31,27,.85)) !important;
        color: #fff !important;
        outline: none;
        box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 0 12px rgba(160,78,44,.05);
      }
      #rw-payout-helper input:focus {
        border-color: rgba(223,171,103,.82);
        box-shadow: 0 0 0 3px rgba(223,171,103,.10), 0 0 18px rgba(165,49,34,.08);
      }
      #rw-payout-helper input[type="checkbox"] { width: auto; margin-right: 6px; }
      #rw-payout-helper .rw-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      #rw-payout-helper button {
        margin-top: 10px;
        padding: 9px 12px;
        border: 1px solid rgba(183,133,85,.30);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(149,58,34,.98), rgba(181,84,38,.96) 18%, rgba(108,40,24,.98) 18.5%, rgba(88,30,22,.98) 100%) !important;
        color: white !important;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 -4px 0 rgba(79,22,18,.55) inset, 0 10px 22px rgba(0,0,0,.40);
      }
      #rw-payout-helper button:hover { filter: brightness(1.08); }
      #rw-payout-helper #rw-start-payment,
      #rw-payout-helper #rw-extend-licence {
        background: linear-gradient(180deg, rgba(149,58,34,.98), rgba(181,84,38,.96) 18%, rgba(108,40,24,.98) 18.5%, rgba(88,30,22,.98) 100%) !important;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 -4px 0 rgba(79,22,18,.55) inset, 0 10px 22px rgba(0,0,0,.40) !important;
      }
      #rw-payout-helper button.secondary { background: linear-gradient(180deg, rgba(70,57,45,.95), rgba(50,42,36,.95) 18%, rgba(36,31,28,.95) 100%) !important; box-shadow: 0 -3px 0 rgba(36,27,24,.45) inset; }
      #rw-payout-helper button.danger { background: linear-gradient(180deg, rgba(126,28,24,.98), rgba(164,40,30,.96) 18%, rgba(95,21,20,.98) 100%) !important; box-shadow: 0 -3px 0 rgba(65,15,14,.45) inset; }
      #rw-payout-helper .rw-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      #rw-payout-helper .rw-muted { color: #d4c1b4 !important; margin-top: 10px; line-height: 1.45; }
      #rw-payout-helper .rw-small { font-size: 11px; color: #cfaa8e !important; line-height: 1.45; }
      #rw-payout-helper .rw-summary {
        margin: 12px 0;
        padding: 10px;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(58,26,21,.92) 0%, rgba(39,30,27,.92) 16%, rgba(31,27,24,.90) 100%) !important;
        border: 1px solid rgba(184,136,89,.24);
        color: #fff2dd !important;
        line-height: 1.55;
      }
      #rw-payout-helper .rw-card-list { display:flex; flex-direction:column; gap:10px; margin-top:10px; }
      #rw-payout-helper .rw-result-card {
        position: relative;
        background: linear-gradient(180deg, rgba(63,29,23,.90) 0%, rgba(39,30,27,.90) 14%, rgba(32,29,27,.90) 100%) !important;
        border:1px solid rgba(184,136,89,.22);
        border-radius:14px;
        overflow: hidden;
        padding:10px;
        color:#edf4ff !important;
        box-shadow: 0 0 12px rgba(146,59,31,.06), 0 10px 24px rgba(0,0,0,.36);
      }
      #rw-payout-helper .rw-result-top { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
      #rw-payout-helper .rw-result-card::before { content:""; position:absolute; inset:0 auto auto 0; width:100%; height:5px; background: linear-gradient(90deg, rgba(216,170,106,.95), rgba(155,61,33,.92), rgba(216,170,106,.95)); }
      #rw-payout-helper .rw-result-player { min-width:0; }
      #rw-payout-helper .rw-result-name { font-weight:900; font-size:14px; color:#fff5ee !important; word-break:break-word; text-shadow: 0 0 8px rgba(255,140,66,.08); letter-spacing: .2px; }
      #rw-payout-helper .rw-result-id { font-size:11px; color:#c8a892 !important; margin-top:2px; }
      #rw-payout-helper .rw-result-payout { text-align:right; font-weight:900; color:#ffdfbf !important; white-space:nowrap; text-shadow: 0 0 10px rgba(255,140,66,.14); }
      #rw-payout-helper .rw-stat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:7px; margin-top:9px; }
      #rw-payout-helper .rw-stat-box { background: linear-gradient(180deg, rgba(46,28,24,.74), rgba(28,24,22,.70)) !important; border: 1px solid rgba(184,136,89,.12); border-radius:10px; padding:7px; text-align:center; box-shadow: inset 0 1px 0 rgba(255,255,255,.03); }
      #rw-payout-helper .rw-stat-label { font-size:10px; color:#d0a78c !important; }
      #rw-payout-helper .rw-stat-value { font-weight:900; color:#fff7f1 !important; }
      #rw-payout-helper .rw-code { margin-top:6px; padding:7px; font-size:10px; border-radius:8px; }
      #rw-payout-helper .rw-payment-card {
        margin-top: 8px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(255, 201, 115, .42);
        background:
          radial-gradient(circle at 18% 10%, rgba(255, 188, 92, .18), transparent 32%),
          linear-gradient(180deg, rgba(83,31,22,.96), rgba(33,25,22,.94));
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 18px rgba(255, 128, 54, .12);
      }
      #rw-payout-helper .rw-payment-title {
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        color: #ffe0b4 !important;
        letter-spacing: .4px;
        text-shadow: 0 0 10px rgba(255,166,94,.22);
      }
      #rw-payout-helper .rw-payment-instruction { margin-top: 6px; color: #fff1df !important; line-height: 1.35; }
      #rw-payout-helper .rw-payment-recipient {
        margin-top: 5px;
        padding: 6px;
        border-radius: 8px;
        background: rgba(0,0,0,.22);
        border: 1px solid rgba(255,255,255,.08);
        font-weight: 900;
        color: #fff7ec !important;
        text-align: center;
      }
      #rw-payout-helper .rw-payment-code {
        margin-top: 5px;
        padding: 7px;
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(26,19,16,.96), rgba(49,28,20,.92));
        border: 1px solid rgba(255, 201, 115, .30);
        color: #ffdcae !important;
        font-size: 13px;
        font-weight: 900;
        text-align: center;
        word-break: break-word;
        letter-spacing: .5px;
      }
      #rw-payout-helper .rw-payment-note { margin-top: 6px; color: #cfaa8e !important; font-size: 9px; line-height: 1.35; }
      #rw-payout-helper .rw-head { padding: 7px 8px; border-radius: 14px 14px 0 0; letter-spacing:.25px; font-size:10px; }
      #rw-payout-helper .rw-head span { padding: 0 8px; }
      #rw-payout-helper .rw-head::before, #rw-payout-helper .rw-head::after { width: 12px; }
      #rw-payout-helper .rw-head::after { right: 30px; }
      #rw-payout-helper .rw-head span::before,
      #rwph-payment-helper-title::before { width: 38px; height: 38px; flex-basis: 38px; }
      #rw-payout-helper > .rw-body { padding: 12px 8px 8px; }
      #rw-payout-helper label { margin-top: 6px; font-size: 10px; }
      #rw-payout-helper input { margin-top: 3px; padding: 5px 6px; border-radius: 8px; font-size: 10px; }
      #rw-payout-helper .rw-row { gap: 5px; }
      #rw-payout-helper button { margin-top: 6px; padding: 5px 7px !important; border-radius: 8px; font-size: 10px !important; }
      #rw-payout-helper .rw-actions { gap: 5px; }
      #rw-payout-helper .rw-muted { margin-top: 6px; font-size: 10px; line-height: 1.3; }
      #rw-payout-helper .rw-small { font-size: 9px; line-height: 1.3; }
      #rw-payout-helper .rw-summary { margin: 7px 0; padding: 7px; border-radius: 9px; line-height: 1.35; font-size: 10px; }
      #rw-payout-helper .rw-card-list { gap: 6px; margin-top: 6px; }
      #rw-payout-helper .rw-result-card { padding: 7px; border-radius: 9px; }
      #rw-payout-helper .rw-result-card::before { height: 3px; }
      #rw-payout-helper .rw-result-top { gap: 5px; }
      #rw-payout-helper .rw-result-name { font-size: 10px; }
      #rw-payout-helper .rw-result-id { font-size: 9px; }
      #rw-payout-helper .rw-result-payout { font-size: 10px; }
      #rw-payout-helper .rw-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 5px; }
      #rw-payout-helper .rw-stat-box { padding: 4px; border-radius: 7px; }
      #rw-payout-helper .rw-stat-label { font-size: 8px; }
      #rw-payout-helper .rw-stat-value { font-size: 10px; }
      #rw-payout-helper .rw-tabs { margin-top: 7px; gap: 5px; }
      #rw-payout-helper .rw-tab-btn { flex: 1 1 auto; padding: 5px 6px !important; font-size: 9px !important; }
      #rw-payout-helper .rw-admin-box { margin-top: 7px; padding: 7px; border-radius: 9px; }
      #rw-payout-helper .rw-admin-list { gap: 6px; margin-top: 6px; }
      #rw-payout-helper .rw-admin-license-card { padding: 6px; border-radius: 8px; }
      #rw-payout-helper .rw-admin-license-name { font-size: 10px; }

      #rw-payout-helper .rw-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0 12px;
      }
      #rw-payout-helper .rw-tab-btn {
        margin-top: 0;
        padding: 8px 10px;
      }
      #rw-payout-helper .rw-tab-btn.active {
        background: linear-gradient(180deg, rgba(197,91,44,.98), rgba(119,39,24,.98)) !important;
        border-color: rgba(229,177,105,.42);
      }
      #rw-payout-helper .rw-tab-section[hidden] {
        display: none !important;
      }
      #rw-payout-helper .rw-admin-box {
        margin-top: 10px;
        padding: 10px;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(58,26,21,.78), rgba(31,27,24,.86));
        border: 1px solid rgba(184,136,89,.20);
      }
      #rw-payout-helper .rw-admin-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
      }
      #rw-payout-helper .rw-admin-license-card {
        border: 1px solid rgba(184,136,89,.18);
        border-radius: 12px;
        padding: 9px;
        background: linear-gradient(180deg, rgba(44,32,27,.84), rgba(28,24,22,.84));
      }
      #rw-payout-helper .rw-admin-license-top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: flex-start;
      }
      #rw-payout-helper .rw-admin-license-name {
        font-weight: 900;
        color: #fff2dd !important;
      }
      #rw-payout-helper .rw-how-box {
        margin-top: 10px;
        padding: 10px;
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(58,26,21,.76), rgba(31,27,24,.86));
        border: 1px solid rgba(184,136,89,.22);
        color: #f8efe7 !important;
        line-height: 1.48;
        font-size: 11px;
      }
      #rw-payout-helper .rw-how-title {
        font-weight: 900;
        color: #fff2dd !important;
        margin-bottom: 7px;
        font-size: 12px;
        letter-spacing: .2px;
      }
      #rw-payout-helper .rw-how-intro {
        margin: 0 0 8px;
        color: #ead3bf !important;
      }
      #rw-payout-helper .rw-how-list {
        margin: 6px 0 0 16px;
        padding: 0;
      }
      #rw-payout-helper .rw-how-list li {
        margin: 6px 0;
      }
      #rw-payout-helper .rw-how-list li b {
        color: #fff2dd !important;
      }
      #rw-payout-helper .rw-help-api-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-top: 8px;
      }
      #rw-payout-helper .rw-help-api-card {
        padding: 8px 9px;
        border-radius: 10px;
        border: 1px solid rgba(184,136,89,.18);
        background: linear-gradient(180deg, rgba(44,32,27,.84), rgba(28,24,22,.84));
        color: #f8efe7 !important;
        box-sizing: border-box;
      }
      #rw-payout-helper .rw-help-api-card,
      #rw-payout-helper .rw-help-api-card * {
        color: #f8efe7 !important;
      }
      #rw-payout-helper .rw-help-api-title {
        margin: 0 0 5px;
        color: #fff2dd !important;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .2px;
        text-shadow: 0 1px 0 rgba(0,0,0,.58), 0 0 10px rgba(255,172,85,.14);
      }
      #rw-payout-helper .rw-help-api-text {
        margin: 4px 0 0;
        color: #ead3bf !important;
        font-size: 10px;
        line-height: 1.42;
        overflow-wrap: anywhere;
      }
      #rw-payout-helper .rw-help-api-text b {
        color: #fff2dd !important;
        font-weight: 900;
      }
      #rw-payout-helper .rw-feature-group {
        list-style: none;
        margin: 12px 0 6px -16px !important;
        padding: 6px 8px;
        border-radius: 9px;
        background: linear-gradient(90deg, rgba(122,43,28,.72), rgba(67,35,26,.52));
        border: 1px solid rgba(184,136,89,.16);
        color: #ffd9b7 !important;
        font-weight: 900;
      }
      #rw-payout-helper .rw-how-note {
        margin-top: 8px;
        color: #cfaa8e !important;
        font-size: 10px;
        line-height: 1.45;
      }
      #rw-payout-helper .rw-api-tos-card {
        margin: 8px 0 10px;
        padding: 9px;
        border-radius: 12px;
        border: 1px solid rgba(184,136,89,.22);
        background: linear-gradient(180deg, rgba(58,26,21,.76), rgba(31,27,24,.86));
        color: #f8efe7 !important;
        box-sizing: border-box;
      }
      #rw-payout-helper .rw-api-tos-card,
      #rw-payout-helper .rw-api-tos-card *,
      #rw-payout-helper .rw-api-tos-content,
      #rw-payout-helper .rw-api-tos-content *,
      #rw-payout-helper .rw-api-tos-table,
      #rw-payout-helper .rw-api-tos-table *,
      #rw-payout-helper .rw-api-tos-table tbody,
      #rw-payout-helper .rw-api-tos-table tr,
      #rw-payout-helper .rw-api-tos-table td {
        color: #f8efe7 !important;
      }
      #rw-payout-helper details.rw-api-tos-card {
        padding: 0;
        overflow: hidden;
      }
      #rw-payout-helper .rw-api-tos-title {
        font-weight: 900;
        color: #fff2dd !important;
        margin: 0 0 6px;
        font-size: 12px;
        letter-spacing: .2px;
      }
      #rw-payout-helper summary.rw-api-tos-title {
        margin: 0;
        padding: 9px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        border-radius: 12px;
        background: linear-gradient(90deg, rgba(122,43,28,.72), rgba(67,35,26,.52));
        border-bottom: 1px solid transparent;
      }
      #rw-payout-helper summary.rw-api-tos-title::-webkit-details-marker {
        display: none;
      }
      #rw-payout-helper summary.rw-api-tos-title::after {
        content: "▾";
        color: #ffd9b7 !important;
        font-size: 12px;
        flex: 0 0 auto;
      }
      #rw-payout-helper details.rw-api-tos-card[open] summary.rw-api-tos-title {
        border-radius: 12px 12px 0 0;
        border-bottom-color: rgba(184,136,89,.22);
      }
      #rw-payout-helper details.rw-api-tos-card[open] summary.rw-api-tos-title::after {
        content: "▴";
      }
      #rw-payout-helper .rw-api-tos-content {
        padding: 9px;
      }
      #rw-payout-helper .rw-api-tos-table-wrap {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        border-radius: 10px;
        border: 1px solid rgba(184,136,89,.22);
        background: rgba(22,18,17,.34);
      }
      #rw-payout-helper table.rw-api-tos-table {
        width: 100%;
        min-width: 0;
        border-collapse: collapse;
        table-layout: fixed;
        color: #f8efe7 !important;
        font-size: 10px;
        line-height: 1.35;
      }
      #rw-payout-helper .rw-api-tos-table th,
      #rw-payout-helper .rw-api-tos-table td {
        border-bottom: 1px solid rgba(184,136,89,.18);
        padding: 6px 7px;
        vertical-align: top;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      #rw-payout-helper .rw-api-tos-table th {
        color: #fff2dd !important;
        background: linear-gradient(90deg, rgba(122,43,28,.52), rgba(67,35,26,.38));
        font-weight: 900;
        text-align: left;
      }
      #rw-payout-helper .rw-api-tos-table td:first-child {
        width: 34%;
        color: #fff2dd !important;
        font-weight: 900;
      }
      #rw-payout-helper .rw-api-tos-card .rw-api-tos-title,
      #rw-payout-helper .rw-api-tos-card .rw-api-tos-table td:first-child,
      #rw-payout-helper .rw-api-tos-card .rw-api-tos-table th {
        color: #ffffff !important;
      }
      #rw-payout-helper .rw-api-tos-table tr:last-child td {
        border-bottom: 0;
      }
      #rw-payout-helper .rw-api-visible-card {
        margin: 6px 0 8px !important;
        padding: 7px 8px !important;
        border-radius: 10px !important;
        border: 1px solid rgba(250,204,21,.34) !important;
        border-left: 4px solid rgba(250,204,21,.82) !important;
        background: linear-gradient(180deg, rgba(88,57,12,.56), rgba(15,23,42,.70)) !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 8px 18px rgba(0,0,0,.20) !important;
        color: #fff8db !important;
        box-sizing: border-box !important;
      }
      #rw-payout-helper .rw-api-visible-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 6px !important;
        margin-bottom: 4px !important;
        color: #fffbe6 !important;
        font-size: 11px !important;
        line-height: 1.1 !important;
        font-weight: 950 !important;
        text-transform: uppercase !important;
        letter-spacing: .24px !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.50) !important;
      }
      #rw-payout-helper .rw-api-visible-badge {
        flex: 0 0 auto !important;
        padding: 3px 6px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(250,204,21,.34) !important;
        background: rgba(2,6,23,.40) !important;
        color: #fde68a !important;
        font-size: 8px !important;
        line-height: 1 !important;
        font-weight: 950 !important;
        white-space: nowrap !important;
      }
      #rw-payout-helper .rw-api-visible-summary {
        color: #fef3c7 !important;
        font-size: 10px !important;
        line-height: 1.32 !important;
        font-weight: 800 !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }
      #rw-payout-helper .rw-api-visible-summary b {
        color: #ffffff !important;
        font-weight: 950 !important;
      }
      #rw-payout-helper .rw-api-visible-dot {
        color: #fde68a !important;
        font-weight: 950 !important;
        padding: 0 3px !important;
      }
      @media (max-width: 560px), (pointer: coarse) {
        #rw-payout-helper .rw-api-visible-card { padding: 6px 7px !important; }
        #rw-payout-helper .rw-api-visible-head { gap: 5px !important; }
        #rw-payout-helper .rw-api-visible-summary { font-size: 9.5px !important; line-height: 1.28 !important; }
      }
      #rw-payout-helper .rw-manual-warning {
        margin: 8px 0 0;
        padding: 8px;
        border-radius: 10px;
        border: 1px solid rgba(255, 214, 115, .36);
        background: linear-gradient(180deg, rgba(88,57,12,.62), rgba(41,30,14,.72));
        color: #fff1c4 !important;
        font-size: 10px;
        line-height: 1.42;
        font-weight: 800;
      }

      /* v1.1.53 readability boost */
      #rw-payout-helper,
      #rw-results-panel {
        color: #fff8ef !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.42);
      }
      #rw-payout-helper .rw-lock-pay-heading {
        margin: 0 0 9px;
        padding: 9px 10px;
        border-radius: 12px;
        border: 1px solid rgba(255, 216, 139, .48);
        background:
          radial-gradient(circle at 12% 10%, rgba(255,207,123,.22), transparent 30%),
          linear-gradient(180deg, rgba(133,48,28,.98), rgba(62,28,22,.96));
        color: #fff0c8 !important;
        font-size: 12px;
        font-weight: 950;
        line-height: 1.28;
        text-align: center;
        letter-spacing: .35px;
        text-transform: uppercase;
        box-shadow: 0 0 0 1px rgba(255,255,255,.05) inset, 0 0 18px rgba(255,156,70,.14);
        text-shadow: 0 1px 0 rgba(0,0,0,.65), 0 0 12px rgba(255,198,112,.22);
      }
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-head span {
        color: #fff3dd !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.72), 0 0 12px rgba(255,188,102,.22);
      }
      #rw-payout-helper label,
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-feature-group,
      #rw-payout-helper .rw-payment-title,
      #rw-payout-helper .rw-result-name,
      #rw-payout-helper .rw-admin-license-name {
        color: #ffe3b8 !important;
        font-weight: 950 !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.58), 0 0 10px rgba(255,172,85,.14);
      }
      #rw-payout-helper .rw-small,
      #rw-payout-helper .rw-muted,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list li,
      #rw-payout-helper .rw-how-note,
      #rw-payout-helper .rw-payment-instruction,
      #rw-payout-helper .rw-payment-note {
        color: #f4d8bf !important;
        font-weight: 700;
        line-height: 1.5;
      }
      #rw-payout-helper .rw-how-list li b,
      #rw-payout-helper .rw-summary b,
      #rw-payout-helper .rw-stat-value,
      #rw-payout-helper .rw-result-payout,
      #rw-payout-helper .rw-payment-code,
      #rw-payout-helper .rw-payment-recipient {
        color: #fff5e9 !important;
        font-weight: 950 !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.58), 0 0 10px rgba(255,188,102,.12);
      }
      #rw-payout-helper .rw-result-id,
      #rw-payout-helper .rw-stat-label {
        color: #e8bd95 !important;
        font-weight: 800;
      }
      #rw-payout-helper input {
        color: #fffaf3 !important;
        font-weight: 850;
      }
      #rw-payout-helper input::placeholder {
        color: rgba(255,226,190,.65) !important;
      }
      #rw-payout-helper button {
        color: #fff7ed !important;
        font-weight: 950 !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.56);
      }
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-result-card,
      #rw-results-panel .rw-summary,
      #rw-results-panel .rw-result-card {
        border-color: rgba(226, 171, 102, .34) !important;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 18px rgba(255,137,58,.07), 0 10px 24px rgba(0,0,0,.36);
      }


      /* v1.1.56 sleek modern theme */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel {
        font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif !important;
        background:
          radial-gradient(circle at 16% 0%, rgba(245,158,11,.16), transparent 28%),
          radial-gradient(circle at 88% 8%, rgba(129,140,248,.13), transparent 30%),
          linear-gradient(180deg, rgba(8,13,25,.97), rgba(15,23,42,.96) 54%, rgba(10,15,28,.98)) !important;
        color: #fff7ed !important;
        border: 1px solid rgba(251,191,36,.28) !important;
        border-radius: 18px !important;
        box-shadow:
          0 0 0 1px rgba(255,255,255,.06) inset,
          0 18px 55px rgba(0,0,0,.66),
          0 0 34px rgba(245,158,11,.10) !important;
        backdrop-filter: blur(18px) saturate(1.2) !important;
        text-shadow: none !important;
      }
      #rw-payout-helper::before {
        background:
          linear-gradient(135deg, rgba(255,255,255,.045) 0 1px, transparent 1px 18px),
          linear-gradient(90deg, rgba(245,158,11,.035), transparent 42%, rgba(129,140,248,.035)) !important;
        opacity: .62 !important;
        mix-blend-mode: screen !important;
      }
      #rw-payout-helper::after { display: none !important; }
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-results-panel .rw-head {
        background:
          linear-gradient(135deg, rgba(15,23,42,.94), rgba(30,41,59,.92) 50%, rgba(49,46,129,.84)) !important;
        color: #fff7ed !important;
        border-bottom: 1px solid rgba(251,191,36,.24) !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 12px 24px rgba(2,8,23,.22) !important;
        border-radius: 18px 18px 0 0 !important;
        letter-spacing: .6px !important;
        text-transform: uppercase !important;
        text-shadow: 0 0 12px rgba(245,158,11,.24) !important;
      }
      #rw-payout-helper .rw-head::before,
      #rw-payout-helper .rw-head::after { display: none !important; }
      #rw-payout-helper .rw-head span {
        display: inline-flex !important;
        align-items: center;
        gap: 13px;
      }
      #rw-payout-helper .rw-head span::before {
        content: "";
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 6px;
        background: url("${RWPH_LAUNCHER_LOGO_DATA_URI}") center / contain no-repeat;
        filter: drop-shadow(0 0 8px rgba(245,158,11,.24));
      }
      #rwph-payment-helper-title {
        display: flex !important;
        align-items: center;
        justify-content: center;
        gap: 13px;
      }
      #rwph-payment-helper-title::before {
        content: "";
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 6px;
        background: url("${RWPH_LAUNCHER_LOGO_DATA_URI}") center / contain no-repeat;
        filter: drop-shadow(0 0 8px rgba(245,158,11,.24));
      }
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel .rw-body {
        scrollbar-color: rgba(245,158,11,.55) rgba(26,26,26,.75);
      }
      #rw-payout-helper label,
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-payment-title,
      #rw-payout-helper .rw-result-name,
      #rw-payout-helper .rw-admin-license-name {
        color: #dff8ff !important;
        text-shadow: 0 0 10px rgba(245,158,11,.14) !important;
        font-weight: 850 !important;
      }
      #rw-payout-helper input {
        background: linear-gradient(180deg, rgba(2,6,23,.78), rgba(15,23,42,.78)) !important;
        border: 1px solid rgba(148,163,184,.24) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.05) inset !important;
      }
      #rw-payout-helper input:focus {
        border-color: rgba(245,158,11,.80) !important;
        box-shadow: 0 0 0 3px rgba(245,158,11,.15), 0 0 18px rgba(129,140,248,.11) !important;
      }
      #rw-payout-helper input::placeholder { color: rgba(203,213,225,.62) !important; }
      #rw-payout-helper button {
        background: linear-gradient(135deg, rgba(14,165,233,.95), rgba(79,70,229,.88)) !important;
        border: 1px solid rgba(251,191,36,.36) !important;
        color: #fff7ed !important;
        box-shadow: 0 10px 22px rgba(14,165,233,.14), 0 1px 0 rgba(255,255,255,.10) inset !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.38) !important;
        transition: transform .12s ease, filter .12s ease, box-shadow .12s ease !important;
      }
      #rw-payout-helper button:hover {
        filter: brightness(1.08) saturate(1.08) !important;
        transform: translateY(-1px);
        box-shadow: 0 13px 26px rgba(14,165,233,.18), 0 1px 0 rgba(255,255,255,.10) inset !important;
      }
      #rw-payout-helper button:disabled {
        cursor: not-allowed !important;
        opacity: .58 !important;
        filter: grayscale(.25) brightness(.82) !important;
        transform: none !important;
      }
      #rw-payout-helper button.secondary,
      #rw-payout-helper .rw-tab-btn {
        background: linear-gradient(180deg, rgba(30,41,59,.90), rgba(15,23,42,.90)) !important;
        border-color: rgba(148,163,184,.23) !important;
        color: #dff8ff !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.06) inset !important;
      }
      #rw-payout-helper button.danger {
        background: linear-gradient(135deg, rgba(244,63,94,.95), rgba(153,27,27,.92)) !important;
        border-color: rgba(251,113,133,.36) !important;
      }
      #rw-payout-helper .rw-tab-btn.active {
        background: linear-gradient(135deg, rgba(14,165,233,.94), rgba(245,158,11,.88)) !important;
        border-color: rgba(251,191,36,.44) !important;
      }
      #rw-payout-helper .rw-muted,
      #rw-payout-helper .rw-small,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list li,
      #rw-payout-helper .rw-how-note,
      #rw-payout-helper .rw-payment-instruction,
      #rw-payout-helper .rw-payment-note {
        color: #cfaa8e !important;
        text-shadow: none !important;
      }
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-result-card,
      #rw-payout-helper .rw-admin-license-card,
      #rw-payout-helper .rw-payment-card,
      #rw-payout-helper .rw-stat-box,
      #rw-payout-helper .rw-code,
      #rw-results-panel .rw-summary,
      #rw-results-panel .rw-result-card {
        background: linear-gradient(180deg, rgba(15,23,42,.72), rgba(2,6,23,.58)) !important;
        border: 1px solid rgba(251,191,36,.18) !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        color: #fff7ed !important;
      }
      #rw-payout-helper .rw-result-card::before {
        background: linear-gradient(90deg, rgba(245,158,11,.95), rgba(245,158,11,.95), rgba(249,115,22,.95)) !important;
      }
      #rw-payout-helper .rw-stat-label,
      #rw-payout-helper .rw-result-id {
        color: #f2b84b !important;
      }
      #rw-payout-helper .rw-stat-value,
      #rw-payout-helper .rw-result-payout,
      #rw-payout-helper .rw-payment-code,
      #rw-payout-helper .rw-payment-recipient,
      #rw-payout-helper .rw-summary b,
      #rw-payout-helper .rw-how-list li b {
        color: #fff7ed !important;
        text-shadow: 0 0 10px rgba(245,158,11,.14) !important;
      }
      #rw-payout-helper .rw-result-payout,
      #rw-payout-helper .rw-payment-code { color: #fde68a !important; }
      #rw-payout-helper .rw-feature-group,
      #rw-payout-helper .rw-lock-pay-heading {
        background: linear-gradient(135deg, rgba(14,165,233,.20), rgba(245,158,11,.16)) !important;
        border: 1px solid rgba(251,191,36,.30) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 10px 22px rgba(14,165,233,.08) !important;
        text-shadow: 0 0 12px rgba(245,158,11,.18) !important;
      }
      #rw-payout-helper .rw-api-tos-card,
      #rw-payout-helper .rw-settings-dropdown {
        background:
          radial-gradient(circle at 18% 0%, rgba(245,158,11,.14), transparent 34%),
          linear-gradient(180deg, rgba(15,23,42,.76), rgba(2,6,23,.60)) !important;
        border: 1px solid rgba(251,191,36,.22) !important;
        border-radius: 14px !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.055) inset, 0 12px 26px rgba(0,0,0,.24) !important;
        color: #fff7ed !important;
      }
      #rw-payout-helper summary.rw-api-tos-title,
      #rw-payout-helper .rw-settings-dropdown > summary.rw-api-tos-title {
        min-height: 38px;
        background: linear-gradient(135deg, rgba(14,165,233,.22), rgba(245,158,11,.18)) !important;
        border: 1px solid rgba(251,191,36,.25) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 10px 20px rgba(14,165,233,.08) !important;
        text-shadow: 0 0 12px rgba(245,158,11,.18) !important;
        text-transform: uppercase;
        letter-spacing: .35px;
        justify-content: center !important;
        text-align: center !important;
      }
      #rw-payout-helper summary.rw-api-tos-title::after {
        color: #fde68a !important;
        margin-left: auto;
        text-shadow: 0 0 10px rgba(245,158,11,.24) !important;
      }
      #rw-payout-helper details.rw-api-tos-card[open] summary.rw-api-tos-title {
        border-bottom-color: rgba(251,191,36,.22) !important;
      }
      #rw-payout-helper .rw-api-tos-content {
        color: #cfaa8e !important;
      }
      #rw-payout-helper .rw-per-hit-note {
        margin: 0 0 8px;
        color: #cfaa8e !important;
        font-size: 11px;
        line-height: 1.45;
        font-weight: 800;
      }
      #rw-payout-helper .rw-settings-calc-actions {
        margin-top: 10px !important;
        padding-top: 10px !important;
        border-top: 1px solid rgba(251,191,36,.16) !important;
      }
      #rw-payout-helper .rw-settings-calc-actions button {
        width: 100% !important;
      }

      #rw-payout-helper details.rw-settings-dropdown {
        margin: 6px 0 7px !important;
        border-radius: 10px !important;
      }
      #rw-payout-helper details.rw-settings-dropdown > summary.rw-api-tos-title {
        padding: 7px 9px !important;
        min-height: 28px !important;
        font-size: 11px !important;
        line-height: 1.15 !important;
      }
      #rw-payout-helper details.rw-settings-dropdown > .rw-api-tos-content {
        padding: 7px !important;
      }
      #rw-payout-helper details.rw-settings-dropdown .rw-row {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 5px !important;
        margin-top: 4px !important;
      }
      #rw-payout-helper details.rw-settings-dropdown label {
        margin-top: 4px !important;
        font-size: 9.5px !important;
        line-height: 1.18 !important;
      }
      #rw-payout-helper details.rw-settings-dropdown input,
      #rw-payout-helper details.rw-settings-dropdown textarea {
        margin-top: 2px !important;
        padding: 4px 5px !important;
        min-height: 24px !important;
        font-size: 10px !important;
      }
      #rw-payout-helper details.rw-settings-dropdown textarea {
        width: 100% !important;
        min-height: 38px !important;
        resize: vertical !important;
        line-height: 1.25 !important;
      }
      #rw-payout-helper .rw-calc-brief {
        margin: 4px 0 !important;
        padding: 5px 6px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        background: rgba(15,23,42,.48) !important;
        color: #cfaa8e !important;
        font-size: 9.5px !important;
        line-height: 1.25 !important;
        font-weight: 800 !important;
        overflow-wrap: anywhere !important;
      }
      #rw-payout-helper .rw-calc-mini-note {
        opacity: .92 !important;
        font-size: 9px !important;
      }
      #rw-payout-helper .rw-mode-cache-tools {
        margin: 5px 0 !important;
        padding: 0 !important;
      }
      #rw-payout-helper .rw-compact-cache-status {
        margin-top: 4px !important;
        padding: 4px 5px !important;
        border-radius: 7px !important;
        font-size: 9px !important;
        line-height: 1.2 !important;
      }
      #rw-payout-helper .rw-compact-check-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 4px !important;
        margin-top: 5px !important;
      }
      #rw-payout-helper .rw-compact-check-grid-single {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      #rw-payout-helper .rw-compact-check-grid label {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 5px !important;
        margin: 0 !important;
        padding: 5px 6px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(251,191,36,.14) !important;
        background: rgba(15,23,42,.44) !important;
        color: #fff7ed !important;
        font-size: 9px !important;
        line-height: 1.12 !important;
        text-align: left !important;
      }
      #rw-payout-helper .rw-compact-check-grid input[type="checkbox"] {
        width: auto !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        flex: 0 0 auto !important;
      }
      @media (max-width: 760px), (pointer: coarse) {
        #rw-payout-helper .rw-compact-check-grid { grid-template-columns: minmax(0, 1fr) !important; }
        #rw-payout-helper details.rw-settings-dropdown .rw-row { grid-template-columns: minmax(0, 1fr) !important; }
      }
      #rw-payout-helper .rw-payment-card {
        background:
          radial-gradient(circle at 20% 0%, rgba(249,115,22,.18), transparent 35%),
          linear-gradient(180deg, rgba(15,23,42,.88), rgba(2,6,23,.72)) !important;
      }
      #rw-payout-helper .rw-resize-handle {
        border-right-color: rgba(245,158,11,.78) !important;
        border-bottom-color: rgba(245,158,11,.78) !important;
        opacity: .95 !important;
      }
      /* v1.1.59 Torn PDA / phone half-size defaults */
      @media (max-width: 760px), (pointer: coarse) {
        #rw-payout-helper {
          width: 150px !important;
          min-width: 150px !important;
          min-height: 120px !important;
          max-height: 42vh !important;
          right: 8px !important;
          top: 74px !important;
        }
        #rw-payout-helper > .rw-body {
          max-height: calc(42vh - 38px) !important;
        }
        #rw-payout-helper .rw-results-panel {
          width: 215px !important;
          min-width: 160px !important;
          min-height: 120px !important;
          max-height: 40vh !important;
          right: 8px !important;
          left: auto !important;
          top: 250px !important;
        }
        #rw-payout-helper .rw-results-panel .rw-body {
          max-height: calc(40vh - 38px) !important;
          overflow: auto !important;
        }
        #rwph-xanax-send-status {
          width: 180px !important;
          max-width: calc(100vw - 16px) !important;
          min-width: 150px !important;
          min-height: 110px !important;
          right: 8px !important;
          bottom: 8px !important;
          padding: 8px 9px !important;
          font-size: 10px !important;
        }
        #rwph-payment-helper-title {
          font-size: 11px !important;
          margin-right: 24px !important;
        }
      }
      /* v1.1.67 center all panel content */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rw-payout-helper .rw-body,
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-result-card,
      #rw-payout-helper .rw-admin-license-card,
      #rw-payout-helper .rw-payment-card,
      #rw-payout-helper .rw-muted,
      #rw-payout-helper .rw-small,
      #rw-payout-helper label,
      #rw-payout-helper input,
      #rw-payout-helper button {
        text-align: center !important;
      }
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-head span,
      #rwph-payment-helper-title {
        justify-content: center !important;
        text-align: center !important;
        width: 100%;
      }
      #rw-payout-helper .rw-actions,
      #rw-payout-helper .rw-row,
      #rw-payout-helper .rw-tabs,
      #rw-payout-helper .rw-result-top,
      #rw-payout-helper .rw-admin-license-top {
        justify-content: center !important;
        align-items: center !important;
      }
      #rw-payout-helper .rw-result-top,
      #rw-payout-helper .rw-admin-license-top {
        flex-direction: column !important;
      }
      #rw-payout-helper .rw-result-player,
      #rw-payout-helper .rw-result-payout,
      #rw-payout-helper .rw-result-id,
      #rw-payout-helper .rw-result-name,
      #rw-payout-helper .rw-payment-recipient,
      #rw-payout-helper .rw-payment-code {
        text-align: center !important;
        width: 100%;
      }
      #rw-payout-helper .rw-card-list,
      #rw-payout-helper .rw-admin-list {
        align-items: stretch !important;
      }
      #rw-payout-helper .rw-stat-grid,
      #rw-payout-helper .rw-card-list,
      #rw-payout-helper .rw-admin-list {
        justify-items: center !important;
      }
      #rw-payout-helper .rw-how-list {
        margin-left: 0 !important;
        padding-left: 0 !important;
        list-style-position: inside !important;
        text-align: center !important;
      }
      #rw-payout-helper .rw-how-list li {
        text-align: center !important;
      }
      #rw-payout-helper .rw-feature-group {
        margin-left: 0 !important;
        text-align: center !important;
      }
      #rw-payout-helper .rw-admin-license-top > div,
      #rw-payout-helper .rw-result-top > div {
        width: 100%;
        text-align: center !important;
      }
      #rw-payout-helper input::placeholder { text-align: center !important; }

      #rw-payout-helper .rw-pay-all-panel {
        position: fixed;
        z-index: 2147483647;
        inset: 70px auto auto 14px;
        width: min(360px, calc(100vw - 28px));
        max-height: calc(100vh - 100px);
        overflow: auto;
        padding: 12px;
        border-radius: 18px;
        border: 1px solid rgba(251,191,36,.28);
        background:
          radial-gradient(circle at 18% 0%, rgba(245,158,11,.20), transparent 34%),
          linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96));
        box-shadow: 0 20px 60px rgba(0,0,0,.58), 0 0 28px rgba(245,158,11,.12);
        backdrop-filter: blur(14px);
        color: #f8fafc !important;
        text-align: center !important;
      }
      #rw-payout-helper .rw-pay-all-panel[hidden] { display:none !important; }
      #rw-payout-helper .rw-pay-all-head {
        display:flex;
        justify-content:center;
        align-items:center;
        gap:8px;
        margin-bottom:10px;
        cursor: move;
        touch-action: none;
      }
      #rw-payout-helper .rw-pay-all-title {
        font-size: 14px;
        font-weight: 950;
        color: #fff2dd !important;
        text-transform: uppercase;
        letter-spacing: .5px;
      }
      #rw-payout-helper .rw-pay-all-close {
        position:absolute;
        top:8px;
        right:8px;
        min-height: 26px;
        padding: 3px 8px !important;
      }
      #rw-payout-helper .rw-pay-all-note {
        color:#c7d2fe !important;
        font-size: 11px;
        line-height:1.45;
        margin: 0 22px 10px;
      }
      #rw-payout-helper .rw-pay-all-balance-warning {
        margin:0 4px 10px !important;
        padding:11px 10px !important;
        border-radius:14px !important;
        border:2px solid rgba(250,204,21,.76) !important;
        border-left:6px solid rgba(249,115,22,.92) !important;
        background:linear-gradient(180deg, rgba(120,53,15,.88), rgba(69,26,3,.84)) !important;
        color:#fff7ed !important;
        font:950 12px/1.35 Arial,Helvetica,sans-serif !important;
        text-align:center !important;
        box-shadow:0 0 22px rgba(245,158,11,.20), inset 0 1px 0 rgba(255,255,255,.07) !important;
      }
      #rw-payout-helper .rw-pay-all-balance-warning b { color:#fef3c7 !important; }
      #rw-payout-helper .rw-pay-all-accept-warning {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:100% !important;
        margin:8px 0 5px !important;
        padding:8px 10px !important;
        min-height:32px !important;
        border-radius:11px !important;
        border:2px solid rgba(254,243,199,.78) !important;
        background:linear-gradient(135deg, rgba(250,204,21,.96), rgba(249,115,22,.94)) !important;
        color:#1b1208 !important;
        font:950 12px/1.15 Arial,Helvetica,sans-serif !important;
        letter-spacing:.35px !important;
        text-transform:uppercase !important;
        cursor:pointer !important;
        box-shadow:0 0 18px rgba(245,158,11,.30), inset 0 1px 0 rgba(255,255,255,.25) !important;
      }
      #rw-payout-helper .rw-pay-all-accept-warning.rw-pay-all-warning-accepted,
      #rw-payout-helper .rw-pay-all-accept-warning:disabled {
        border-color:rgba(34,197,94,.56) !important;
        background:linear-gradient(135deg, rgba(34,197,94,.88), rgba(21,128,61,.88)) !important;
        color:#ecfdf5 !important;
        cursor:default !important;
      }
      #rw-payout-helper .rw-pay-all-warning-state {
        color:#fef3c7 !important;
        font:900 9.5px/1.25 Arial,Helvetica,sans-serif !important;
        opacity:.98 !important;
      }
      #rw-payout-helper .rw-pay-all-panel[data-pay-warning-accepted="1"] .rw-pay-all-warning-state { color:#bbf7d0 !important; }
      #rw-payout-helper .rw-pay-all-list {
        display:grid;
        gap:8px;
      }
      #rw-payout-helper .rw-pay-all-row {
        display:grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap:6px;
        align-items:center;
        padding:8px;
        border-radius: 14px;
        border:1px solid rgba(251,191,36,.16);
        background: rgba(15,23,42,.72);
      }
      #rw-payout-helper .rw-pay-all-member {
        min-width:0;
        font-size: 11px;
        font-weight: 900;
        color:#f8fafc !important;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      #rw-payout-helper .rw-pay-all-payout {
        display:block;
        margin-top:2px;
        color:#86efac !important;
        font-size: 11px;
        font-weight: 950;
      }
      #rw-payout-helper .rw-pay-all-copy {
        padding:5px 7px !important;
        min-height: 26px !important;
        font-size: 10px !important;
        white-space:nowrap;
      }
      #rw-payout-helper .rw-pay-all-copy[disabled],
      #rw-payout-helper .rw-pay-all-copy[aria-disabled="true"],
      #rw-payout-helper .rw-pay-all-copy[data-pay-prefill-locked="1"] {
        opacity:.42 !important;
        cursor:not-allowed !important;
        filter:grayscale(.55) !important;
        box-shadow:none !important;
        pointer-events:none !important;
      }
      @media (max-width: 760px), (pointer: coarse) {
        #rw-payout-helper .rw-pay-all-panel {
          inset: 60px auto auto 8px;
          width: min(300px, calc(100vw - 16px));
          max-height: calc(100vh - 76px);
          padding: 9px;
        }
        #rw-payout-helper .rw-pay-all-row {
          grid-template-columns: minmax(0, 1fr) max-content max-content !important;
          grid-auto-flow: column !important;
          align-items: center !important;
        }
        #rw-payout-helper .rw-pay-all-copy {
          display: inline-flex !important;
          width: auto !important;
          max-width: none !important;
          flex: 0 0 auto !important;
          white-space: nowrap !important;
        }
      }
      #rw-payout-helper a { color: #fbbf24 !important; }


      /* v1.1.97 COMPLETE LAYOUT REFRESH - dashboard panels */
      #rw-payout-helper {
        width: 520px !important;
        max-width: calc(100vw - 22px) !important;
        border-radius: 30px !important;
        background:
          radial-gradient(circle at 20% -10%, rgba(249,115,22,.20), transparent 28%),
          radial-gradient(circle at 92% 0%, rgba(245,158,11,.22), transparent 32%),
          linear-gradient(145deg, rgba(2,6,23,.98), rgba(15,23,42,.96) 48%, rgba(8,13,28,.98)) !important;
        border: 1px solid rgba(251,191,36,.26) !important;
        box-shadow: 0 28px 80px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.07), 0 0 42px rgba(245,158,11,.12) !important;
      }
      #rw-payout-helper::before,
      #rw-payout-helper::after { display:none !important; }
      #rw-payout-helper .rw-head {
        min-height: 86px !important;
        padding: 16px 64px 16px 20px !important;
        border-radius: 28px 28px 0 0 !important;
        background:
          linear-gradient(135deg, rgba(14,165,233,.20), rgba(245,158,11,.20)),
          rgba(15,23,42,.74) !important;
        border-bottom: 1px solid rgba(251,191,36,.20) !important;
        justify-content: center !important;
      }
      #rw-payout-helper .rw-head span {
        padding: 0 !important;
        font-size: 13px !important;
        letter-spacing: 1.15px !important;
      }
      #rw-payout-helper .rw-head button[id$="close"],
      #rw-payout-helper #rw-close {
        position: absolute !important;
        right: 12px !important;
        top: 16px !important;
        width: 40px !important;
        height: 40px !important;
        padding: 0 !important;
        border-radius: 14px !important;
      }
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel .rw-body {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 12px !important;
        padding: 14px !important;
        max-height: calc(84vh - 86px) !important;
      }
      #rw-payout-helper .rw-small,
      #rw-payout-helper .rw-muted {
        margin: 0 !important;
        padding: 10px 12px !important;
        border-radius: 16px !important;
        border: 1px solid rgba(251,191,36,.14) !important;
        background: rgba(15,23,42,.46) !important;
      }
      #rw-payout-helper .rw-tabs {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin: 0 !important;
        padding: 6px !important;
        border-radius: 18px !important;
        background: rgba(2,6,23,.52) !important;
        border: 1px solid rgba(251,191,36,.16) !important;
      }
      #rw-payout-helper .rw-tab-btn {
        margin: 0 !important;
        min-height: 34px !important;
        border-radius: 14px !important;
        padding: 8px 6px !important;
        font-size: 10px !important;
      }
      #rw-payout-helper .rw-tab-section:not([hidden]) {
        display: grid !important;
        gap: 12px !important;
        padding: 0 !important;
      }
      #rw-payout-helper label {
        display: grid !important;
        gap: 7px !important;
        margin: 0 !important;
        padding: 11px !important;
        border-radius: 18px !important;
        border: 1px solid rgba(251,191,36,.14) !important;
        background: linear-gradient(180deg, rgba(15,23,42,.52), rgba(2,6,23,.30)) !important;
      }
      #rw-payout-helper input {
        margin: 0 !important;
        min-height: 38px !important;
        border-radius: 13px !important;
      }
      #rw-payout-helper .rw-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }
      #rw-payout-helper .rw-actions {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)) !important;
        gap: 8px !important;
        width: 100% !important;
      }
      #rw-payout-helper .rw-actions button,
      #rw-payout-helper .rw-actions a,
      #rw-payout-helper button {
        margin-top: 0 !important;
        min-height: 38px !important;
        border-radius: 14px !important;
      }
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-payment-card,
      #rw-payout-helper .rw-admin-license-card {
        border-radius: 22px !important;
        padding: 14px !important;
        background:
          linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        border: 1px solid rgba(251,191,36,.16) !important;
      }
      #rw-payout-helper .rw-how-box {
        display: grid !important;
        gap: 8px !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
      }
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-payment-title {
        font-size: 13px !important;
        text-transform: uppercase !important;
        letter-spacing: .9px !important;
      }
      #rw-payout-helper .rw-how-list {
        display: grid !important;
        gap: 6px !important;
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #rw-payout-helper .rw-how-list li {
        padding: 8px 10px !important;
        border-radius: 13px !important;
        background: rgba(2,6,23,.32) !important;
        border: 1px solid rgba(251,191,36,.08) !important;
      }
      #rw-payout-helper .rw-feature-group,
      #rw-payout-helper .rw-lock-pay-heading {
        border-radius: 18px !important;
        padding: 10px 12px !important;
      }
      #rw-payout-helper .rw-stat-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      #rw-payout-helper .rw-results-panel {
        width: min(860px, calc(100vw - 28px)) !important;
        right: 18px !important;
        left: auto !important;
        top: 84px !important;
        border-radius: 30px !important;
        background:
          radial-gradient(circle at 18% 0%, rgba(249,115,22,.18), transparent 30%),
          linear-gradient(145deg, rgba(2,6,23,.98), rgba(15,23,42,.96)) !important;
      }
      #rw-payout-helper .rw-card-list {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
        gap: 10px !important;
      }
      #rw-payout-helper .rw-result-card {
        display: grid !important;
        gap: 10px !important;
        border-radius: 22px !important;
        padding: 14px !important;
      }
      #rw-payout-helper .rw-result-top {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 6px !important;
      }
      #rw-payout-helper .rw-result-payout {
        display: inline-flex !important;
        justify-content: center !important;
        justify-self: center !important;
        width: auto !important;
        padding: 7px 10px !important;
        border-radius: 999px !important;
        background: rgba(34,197,94,.13) !important;
        border: 1px solid rgba(134,239,172,.16) !important;
      }
      #rw-payout-helper .rw-stat-box {
        border-radius: 15px !important;
        padding: 9px !important;
      }
      #rwph-xanax-send-status {
        width: min(460px, calc(100vw - 24px)) !important;
        border-radius: 28px !important;
        padding: 16px !important;
        background:
          radial-gradient(circle at 20% -8%, rgba(249,115,22,.22), transparent 30%),
          radial-gradient(circle at 92% 0%, rgba(245,158,11,.20), transparent 34%),
          linear-gradient(145deg, rgba(2,6,23,.98), rgba(15,23,42,.98)) !important;
        border: 1px solid rgba(251,191,36,.26) !important;
        box-shadow: 0 26px 80px rgba(0,0,0,.70), 0 0 36px rgba(245,158,11,.14) !important;
        text-align: center !important;
      }
      #rwph-xanax-send-status button {
        border-radius: 14px !important;
        padding: 9px 11px !important;
        min-height: 36px !important;
      }
      #rw-payout-helper .rw-pay-all-panel {
        width: min(320px, calc(100vw - 22px)) !important;
        inset: 72px auto auto 12px !important;
        border-radius: 26px !important;
        padding: 12px !important;
        background:
          radial-gradient(circle at 0% 0%, rgba(245,158,11,.20), transparent 30%),
          linear-gradient(180deg, rgba(2,6,23,.98), rgba(15,23,42,.96)) !important;
      }
      #rw-payout-helper .rw-pay-all-row {
        grid-template-columns: minmax(0, 1fr) max-content max-content !important;
        grid-auto-flow: column !important;
        gap: 5px !important;
        align-items:center !important;
        border-radius: 16px !important;
      }
      #rw-payout-helper .rw-pay-all-copy {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width: auto !important;
        max-width:none !important;
        flex:0 0 auto !important;
        white-space:nowrap !important;
      }
      @media (max-width: 760px), (pointer: coarse) {
        #rw-payout-helper {
          width: min(360px, calc(100vw - 16px)) !important;
          min-width: 220px !important;
          max-height: 76vh !important;
        }
        #rw-payout-helper .rw-row,
        #rw-payout-helper .rw-stat-grid {
          grid-template-columns: 1fr !important;
        }
        #rw-payout-helper .rw-actions,
        #rw-payout-helper .rw-tabs {
          grid-template-columns: 1fr !important;
        }
        #rw-payout-helper .rw-results-panel {
          width: min(360px, calc(100vw - 16px)) !important;
          left: 8px !important;
          right: 8px !important;
          top: 76px !important;
          max-height: 72vh !important;
        }
        #rw-payout-helper .rw-card-list {
          grid-template-columns: 1fr !important;
        }
      }



      /* v1.1.132 compact Xanax helper layout: keep every control inside the helper panel */
      #rwph-xanax-send-status {
        box-sizing:border-box !important;
        width:min(420px, calc(100vw - 24px)) !important;
        max-width:calc(100vw - 24px) !important;
        max-height:calc(100vh - 24px) !important;
        overflow:auto !important;
        overflow-x:hidden !important;
        padding:12px !important;
        text-align:left !important;
        overscroll-behavior:contain !important;
        scrollbar-width:thin !important;
      }
      #rwph-xanax-send-status,
      #rwph-xanax-send-status * {
        box-sizing:border-box !important;
      }
      #rwph-xanax-send-status * {
        max-width:100% !important;
        overflow-wrap:anywhere !important;
      }
      #rwph-xanax-send-status #rwph-close-helper {
        position:absolute !important;
        top:10px !important;
        right:12px !important;
        width:36px !important;
        height:36px !important;
        min-width:36px !important;
        min-height:36px !important;
        padding:0 !important;
        border-radius:14px !important;
        line-height:1 !important;
        font-size:20px !important;
        font-weight:950 !important;
        display:grid !important;
        place-items:center !important;
        z-index:70 !important;
      }
      #rwph-xanax-send-status #rwph-payment-helper-title {
        display:block !important;
        margin:0 32px 6px 0 !important;
        padding:8px 10px !important;
        font-weight:900 !important;
        font-size:13px !important;
        line-height:1.15 !important;
        cursor:move !important;
        touch-action:none !important;
        -webkit-user-select:none !important;
        user-select:none !important;
      }
      #rwph-xanax-send-status .rwph-xanax-helper-subtitle {
        font-size:10.5px !important;
        color:#f2b84b !important;
        margin:0 0 7px !important;
        line-height:1.25 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-helper-message {
        margin:0 0 8px !important;
        line-height:1.32 !important;
        color:#fff2dd !important;
      }
      #rwph-xanax-send-status .rwph-xanax-helper-message.rwph-xanax-helper-error {
        color:#fca5a5 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-detail-card {
        padding:9px !important;
        border-radius:10px !important;
        background:linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.76)) !important;
        border:1px solid rgba(251,191,36,.22) !important;
        margin:7px 0 !important;
        box-shadow:0 0 0 1px rgba(255,255,255,.03) inset !important;
        line-height:1.32 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-detail-title {
        font-size:10px !important;
        color:#f2b84b !important;
        text-transform:uppercase !important;
        letter-spacing:.5px !important;
        font-weight:900 !important;
        margin-bottom:6px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-code {
        display:inline-block !important;
        font-weight:950 !important;
        color:#fde68a !important;
        word-break:break-word !important;
      }
      #rwph-xanax-send-status .rwph-xanax-small-blue,
      #rwph-xanax-send-status .rwph-xanax-expiry {
        color:#f2b84b !important;
      }
      #rwph-xanax-send-status .rwph-xanax-small-blue { font-size:10px !important; }
      #rwph-xanax-send-status .rwph-xanax-expiry {
        font-size:10.5px !important;
        margin-top:6px !important;
        line-height:1.25 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions {
        display:grid !important;
        grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
        gap:6px !important;
        margin-top:8px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions button {
        width:100% !important;
        min-width:0 !important;
        white-space:normal !important;
        line-height:1.12 !important;
        padding:8px 6px !important;
        min-height:34px !important;
        font-weight:800 !important;
        cursor:pointer !important;
      }
      #rwph-xanax-send-status .rwph-xanax-steps {
        font-size:10.8px !important;
        color:#e8d39a !important;
        margin-top:9px !important;
        line-height:1.35 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-safety-note {
        font-size:10.4px !important;
        color:#fca5a5 !important;
        margin-top:8px !important;
        line-height:1.3 !important;
        border-top:1px solid rgba(248,113,113,.22) !important;
        padding-top:7px !important;
        padding-right:20px !important;
      }

      /* v1.1.175: make the Xanax Payment Helper close button match the main panel close button */
      #rwph-xanax-send-status #rwph-close-helper {
        position:absolute !important;
        top:10px !important;
        right:12px !important;
        width:36px !important;
        height:36px !important;
        min-width:36px !important;
        min-height:36px !important;
        padding:0 !important;
        border-radius:14px !important;
        display:grid !important;
        place-items:center !important;
        font-size:20px !important;
        font-weight:950 !important;
        line-height:1 !important;
        z-index:90 !important;
      }
      #rwph-xanax-send-status #rwph-payment-helper-title {
        padding-right:50px !important;
        min-height:40px !important;
      }
      @media (max-width:420px), (pointer:coarse) {
        #rwph-xanax-send-status {
          right:6px !important;
          bottom:6px !important;
          width:calc(100vw - 12px) !important;
          min-width:0 !important;
          max-width:calc(100vw - 12px) !important;
          max-height:calc(100vh - 12px) !important;
          padding:8px !important;
          font-size:10.5px !important;
        }
        #rwph-xanax-send-status #rwph-payment-helper-title {
          font-size:11.5px !important;
          padding:7px 8px !important;
          margin-right:30px !important;
        }
        #rwph-xanax-send-status .rwph-xanax-detail-card {
          padding:7px !important;
          margin:6px 0 !important;
        }
        #rwph-xanax-send-status .rwph-xanax-actions {
          grid-template-columns:1fr !important;
          gap:5px !important;
        }
        #rwph-xanax-send-status .rwph-xanax-steps {
          font-size:10.3px !important;
          line-height:1.3 !important;
        }
        #rwph-xanax-send-status .rwph-xanax-safety-note {
          font-size:10px !important;
        }
      }

      /* v1.1.102 Torn-style dark/red theme */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rwph-xanax-send-status,
      #rw-payout-helper .rw-pay-all-panel {
        color:#d7d7d7 !important;
        background:linear-gradient(180deg,#262626 0%,#1b1b1b 100%) !important;
        border:1px solid #444 !important;
        border-radius:8px !important;
        box-shadow:0 16px 42px rgba(0,0,0,.72),inset 0 1px 0 rgba(255,255,255,.045) !important;
      }
      #rw-payout-helper::before,
      #rw-payout-helper .rw-results-panel::before,
      #rwph-xanax-send-status::before {
        background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 24px),linear-gradient(180deg,rgba(255,255,255,.035),transparent 28%) !important;
        opacity:.7 !important;
      }
      #rw-payout-helper::after { display:none !important; }
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-results-panel .rw-head,
      #rwph-payment-helper-title,
      #rw-payout-helper .rw-pay-all-head {
        background:linear-gradient(180deg,#333,#202020) !important;
        color:#f1f1f1 !important;
        border-color:#4a4a4a !important;
        border-bottom:3px solid #8d2422 !important;
        text-shadow:0 1px 0 #000 !important;
        border-radius:7px 7px 0 0 !important;
      }
      #rw-payout-helper .rw-head::before,
      #rw-payout-helper .rw-head::after {
        background:linear-gradient(90deg,transparent,rgba(180,59,54,.9),transparent) !important;
      }
      #rw-payout-helper button,
      #rwph-xanax-send-status button,
      #rw-payout-helper a.btn,
      #rw-payout-helper .rw-pay-all-copy,
      #rw-payout-helper .rw-pay-all-undo {
        background:linear-gradient(180deg,#b73a35,#7d1f1f) !important;
        border:1px solid #5e1a1a !important;
        border-radius:5px !important;
        color:#fff !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 2px 8px rgba(0,0,0,.38) !important;
        text-shadow:0 1px 0 #000 !important;
      }
      #rw-payout-helper button.secondary,
      #rw-payout-helper .secondary,
      #rwph-xanax-send-status button.secondary,
      #rw-payout-helper a.btn.secondary {
        background:linear-gradient(180deg,#3c3c3c,#262626) !important;
        border-color:#555 !important;
        color:#e7e7e7 !important;
      }
      #rw-payout-helper button.danger,
      #rwph-xanax-send-status button.danger {
        background:linear-gradient(180deg,#cd4740,#7c1f1f) !important;
        border-color:#5e1919 !important;
      }
      #rw-payout-helper input,
      #rw-payout-helper textarea,
      #rw-payout-helper select {
        background:#151515 !important;
        border:1px solid #4b4b4b !important;
        color:#eeeeee !important;
        border-radius:5px !important;
        box-shadow:inset 0 1px 4px rgba(0,0,0,.65) !important;
      }
      #rw-payout-helper input:focus,
      #rw-payout-helper textarea:focus,
      #rw-payout-helper select:focus {
        border-color:#a73531 !important;
        box-shadow:0 0 0 2px rgba(173,57,52,.18),inset 0 1px 4px rgba(0,0,0,.65) !important;
      }
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-card,
      #rw-payout-helper .rw-result-card,
      #rw-payout-helper .rw-stat-box,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-payment-box,
      #rw-payout-helper .rw-pay-all-row,
      #rw-payout-helper .rw-pay-all-info,
      #rw-payout-helper .rw-tab-section {
        background:linear-gradient(180deg,#242424,#1b1b1b) !important;
        border:1px solid #3d3d3d !important;
        color:#d7d7d7 !important;
        border-radius:7px !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 6px 18px rgba(0,0,0,.30) !important;
      }
      #rw-payout-helper .rw-result-card::before { background:linear-gradient(90deg,#7b1f1f,#c3423a,#7b1f1f) !important; }
      #rw-payout-helper label,
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-feature-group,
      #rw-payout-helper .rw-result-name,
      #rw-payout-helper .rw-stat-value,
      #rw-payout-helper .rw-pay-all-title,
      #rw-payout-helper .rw-pay-all-member,
      #rwph-xanax-send-status b { color:#f0f0f0 !important; }
      #rw-payout-helper .rw-small,
      #rw-payout-helper .rw-muted,
      #rw-payout-helper .rw-how-list li,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-pay-all-note,
      #rw-payout-helper .rw-pay-all-info { color:#c9c9c9 !important; }
      #rw-payout-helper .rw-result-payout,
      #rw-payout-helper .rw-pay-all-payout,
      #rw-payout-helper .rw-payment-code,
      #rw-payout-helper .rw-payment-recipient {
        color:#ffffff !important;
        background:rgba(139,32,31,.22) !important;
        border:1px solid rgba(175,58,52,.42) !important;
      }
      #rw-payout-launcher {
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
        outline:none !important;
        appearance:none !important;
        -webkit-appearance:none !important;
      }
      #rw-payout-launcher.rwph-nav-launcher {
        position:fixed !important;
        z-index:2147483647 !important;
        display:inline-flex !important;
        width:28px !important;
        height:28px !important;
        min-width:28px !important;
        min-height:28px !important;
        max-width:28px !important;
        max-height:28px !important;
        margin:0 !important;
        padding:0 !important;
        vertical-align:middle !important;
        align-items:center !important;
        justify-content:center !important;
        line-height:1 !important;
        cursor:pointer !important;
      }
      #rw-payout-launcher.rwph-nav-launcher-fallback {
        display:none !important;
      }
      #rw-payout-launcher.rwph-mobile-header-launcher,
      #rw-payout-launcher.rwph-mobile-launcher-fallback {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:0 !important;
        padding:0 !important;
        line-height:1 !important;
        text-indent:0 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
      }
      #rw-payout-launcher.rwph-mobile-header-launcher .rwph-launcher-text,
      #rw-payout-launcher.rwph-mobile-launcher-fallback .rwph-launcher-text {
        display:none !important;
      }
      #rw-payout-launcher:hover,
      #rw-payout-launcher:focus,
      #rw-payout-launcher:active {
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
        outline:none !important;
      }
      #rw-payout-launcher img {
        filter:drop-shadow(0 3px 8px rgba(0,0,0,.72)) drop-shadow(0 0 10px rgba(249,115,22,.65)) !important;
      }
      #rw-payout-helper .rw-head span::before,
      #rwph-payment-helper-title::before { filter:drop-shadow(0 0 6px rgba(170,50,45,.45)) grayscale(.2) saturate(.85) !important; }

      /* v1.1.136 fit pass: keep every RWPH panel, form, button and helper inside its visible box */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rw-payout-helper .rw-pay-all-panel,
      #rw-pay-all-panel,
      #rwph-xanax-send-status,
      #rw-wrong-payment-panel {
        box-sizing:border-box !important;
        max-width:calc(100vw - 16px) !important;
        max-height:calc(100vh - 16px) !important;
        overflow:auto !important;
        overflow-x:hidden !important;
        overscroll-behavior:contain !important;
        scrollbar-width:thin !important;
      }
      #rw-payout-helper {
        width:min(300px, calc(100vw - 16px)) !important;
        min-width:min(240px, calc(100vw - 16px)) !important;
        max-height:calc(100vh - 16px) !important;
      }
      #rw-payout-helper *,
      #rw-pay-all-panel *,
      #rwph-xanax-send-status *,
      #rw-wrong-payment-panel * {
        box-sizing:border-box !important;
        max-width:100% !important;
        overflow-wrap:anywhere !important;
      }
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel .rw-body,
      #rw-payout-helper .rw-pay-all-body,
      #rw-pay-all-panel .rw-pay-all-body,
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-payment-card {
        min-width:0 !important;
        overflow-x:hidden !important;
      }
      #rw-payout-helper .rw-body {
        max-height:calc(100vh - 58px) !important;
        padding:8px !important;
      }
      #rw-payout-helper .rw-actions,
      #rw-payout-helper .rw-tabs,
      #rw-payout-helper .rw-result-actions,
      #rw-payout-helper .rw-pay-all-actions {
        display:flex !important;
        flex-wrap:wrap !important;
        gap:5px !important;
        align-items:stretch !important;
      }
      #rw-payout-helper .rw-actions button,
      #rw-payout-helper .rw-tabs button,
      #rw-payout-helper .rw-result-actions button,
      #rw-payout-helper .rw-pay-all-actions button {
        flex:1 1 calc(50% - 5px) !important;
        min-width:0 !important;
        white-space:normal !important;
        line-height:1.15 !important;
      }
        flex-basis:100% !important;
      }
      #rw-payout-helper .rw-licence-control-grid {
        display:grid !important;
        grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
        gap:6px !important;
      }
      #rw-payout-helper .rw-licence-control-grid button {
        width:100% !important;
        flex:unset !important;
      }
      #rw-payout-helper input,
      #rw-payout-helper textarea,
      #rw-payout-helper select {
        min-width:0 !important;
        width:100% !important;
      }
      #rw-payout-helper .rw-row {
        grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)) !important;
        gap:5px !important;
      }
      #rw-payout-helper .rw-stat-grid {
        grid-template-columns:repeat(auto-fit, minmax(70px, 1fr)) !important;
      }
      #rw-payout-helper .rw-result-top,
      #rw-payout-helper .rw-pay-all-row {
        min-width:0 !important;
      }
      #rw-payout-helper .rw-payment-expiry,
      #rwph-xanax-send-status .rwph-xanax-expiry {
        margin-top:6px !important;
        padding:6px 7px !important;
        border-radius:7px !important;
        background:rgba(14,165,233,.10) !important;
        border:1px solid rgba(251,191,36,.28) !important;
        color:#fde68a !important;
        font-size:10px !important;
        font-weight:800 !important;
        line-height:1.25 !important;
        text-align:center !important;
      }
      #rw-payout-helper .rw-payment-expiry.rwph-expired,
      #rwph-xanax-send-status .rwph-xanax-expiry.rwph-expired {
        background:rgba(239,68,68,.13) !important;
        border-color:rgba(248,113,113,.40) !important;
        color:#fecaca !important;
      }
      #rw-payout-helper .rwph-expire-clock,
      #rwph-xanax-send-status .rwph-expire-clock {
        display:inline-block !important;
        margin-left:4px !important;
        color:#fff2dd !important;
        font-weight:700 !important;
      }
      @media (max-width:420px), (pointer:coarse) {
        #rw-payout-helper {
          right:6px !important;
          top:60px !important;
          width:calc(100vw - 12px) !important;
          min-width:0 !important;
        }
        #rw-payout-helper .rw-actions button,
        #rw-payout-helper .rw-tabs button,
        #rw-payout-helper .rw-result-actions button,
        #rw-payout-helper .rw-pay-all-actions button {
          flex-basis:100% !important;
        }
      }

      /* v1.1.139 scrollbar polish: hide outer white panel bars, keep RWPH inner scrollbars blue */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rw-payout-helper .rw-pay-all-panel,
      #rw-pay-all-panel,
      #rwph-xanax-send-status,
      #rw-wrong-payment-panel {
        scrollbar-width:none !important;
        -ms-overflow-style:none !important;
      }
      #rw-payout-helper::-webkit-scrollbar,
      #rw-payout-helper .rw-results-panel::-webkit-scrollbar,
      #rw-payout-helper .rw-pay-all-panel::-webkit-scrollbar,
      #rw-pay-all-panel::-webkit-scrollbar,
      #rwph-xanax-send-status::-webkit-scrollbar,
      #rw-wrong-payment-panel::-webkit-scrollbar {
        width:0 !important;
        height:0 !important;
        background:transparent !important;
      }
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel .rw-body,
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper .rw-card-list,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-payment-card,
      #rw-payout-helper .rw-pay-all-list,
      #rw-pay-all-panel .pay-all-list,
      #rw-pay-all-panel .rw-pay-all-list {
        scrollbar-width:thin !important;
        scrollbar-color:rgba(245,158,11,.78) rgba(15,23,42,.34) !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar,
      #rw-payout-helper .rw-tab-section::-webkit-scrollbar,
      #rw-payout-helper .rw-card-list::-webkit-scrollbar,
      #rw-payout-helper .rw-how-box::-webkit-scrollbar,
      #rw-payout-helper .rw-admin-box::-webkit-scrollbar,
      #rw-payout-helper .rw-payment-card::-webkit-scrollbar,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar,
      #rw-pay-all-panel .pay-all-list::-webkit-scrollbar,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar {
        width:8px !important;
        height:8px !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar-track,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar-track,
      #rw-payout-helper .rw-tab-section::-webkit-scrollbar-track,
      #rw-payout-helper .rw-card-list::-webkit-scrollbar-track,
      #rw-payout-helper .rw-how-box::-webkit-scrollbar-track,
      #rw-payout-helper .rw-admin-box::-webkit-scrollbar-track,
      #rw-payout-helper .rw-payment-card::-webkit-scrollbar-track,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar-track,
      #rw-pay-all-panel .pay-all-list::-webkit-scrollbar-track,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar-track {
        background:rgba(15,23,42,.34) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-tab-section::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-card-list::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-how-box::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-admin-box::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-payment-card::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar-thumb,
      #rw-pay-all-panel .pay-all-list::-webkit-scrollbar-thumb,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar-thumb {
        background:linear-gradient(180deg, rgba(245,158,11,.92), rgba(249,115,22,.82)) !important;
        border:2px solid rgba(15,23,42,.50) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-tab-section::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-card-list::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-how-box::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-admin-box::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-payment-card::-webkit-scrollbar-thumb:hover,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar-thumb:hover,
      #rw-pay-all-panel .pay-all-list::-webkit-scrollbar-thumb:hover,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar-thumb:hover {
        background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.92)) !important;
      }


      /* v1.1.405 bigger panel header logos */
      #rw-payout-helper .rw-head {
        min-height:86px !important;
      }
      #rw-payout-helper .rw-head span {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:13px !important;
      }
      #rw-payout-helper .rw-head span::before,
      #rwph-payment-helper-title::before {
        width:46px !important;
        height:46px !important;
        flex:0 0 46px !important;
        border-radius:12px !important;
        filter:drop-shadow(0 0 14px rgba(249,115,22,.68)) !important;
      }
      #rwph-payment-helper-title {
        min-height:78px !important;
        gap:13px !important;
      }
      .rwph-floating-panel .rwph-panel-head img,
      #rw-wrong-payment-panel .rwph-floating-panel-head img {
        width:54px !important;
        height:54px !important;
      }

      /* v1.1.141 scroll + corner resize polish: one inner blue scrollbar, pinned headers, four-corner resizing */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rw-payout-helper .rw-pay-all-panel,
      #rw-pay-all-panel,
      #rwph-xanax-send-status,
      #rw-wrong-payment-panel {
        overflow:hidden !important;
        overflow-x:hidden !important;
        display:flex !important;
        flex-direction:column !important;
        min-height:120px !important;
      }
      #rw-payout-helper .rw-head,
      #rw-payout-helper .rw-results-panel .rw-head,
      #rw-payout-helper .rw-pay-all-head,
      #rw-pay-all-panel .rw-pay-all-head,
      #rwph-xanax-send-status #rwph-payment-helper-title,
      #rw-wrong-payment-panel .rwph-floating-panel-head {
        flex:0 0 auto !important;
        position:sticky !important;
        top:0 !important;
        z-index:20 !important;
      }
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel .rw-body,
      #rw-payout-helper .rw-pay-all-list,
      #rw-pay-all-panel .rw-pay-all-list,
      #rwph-xanax-send-status .rwph-xanax-scroll,
      #rw-wrong-payment-panel .rwph-floating-panel-body {
        flex:1 1 auto !important;
        min-height:0 !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        overscroll-behavior:contain !important;
        scrollbar-width:thin !important;
        scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36) !important;
      }
      #rwph-xanax-send-status .rwph-xanax-scroll {
        padding:0 2px 2px !important;
      }
      #rw-wrong-payment-panel .rwph-floating-panel-body {
        padding:0 2px 2px !important;
        scrollbar-width:thin !important;
        scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36) !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar,
      #rwph-xanax-send-status .rwph-xanax-scroll::-webkit-scrollbar,
      #rw-wrong-payment-panel .rwph-floating-panel-body::-webkit-scrollbar {
        width:8px !important;
        height:8px !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar-track,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar-track,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar-track,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar-track,
      #rwph-xanax-send-status .rwph-xanax-scroll::-webkit-scrollbar-track,
      #rw-wrong-payment-panel .rwph-floating-panel-body::-webkit-scrollbar-track {
        background:rgba(15,23,42,.34) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper > .rw-body::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-results-panel .rw-body::-webkit-scrollbar-thumb,
      #rw-payout-helper .rw-pay-all-list::-webkit-scrollbar-thumb,
      #rw-pay-all-panel .rw-pay-all-list::-webkit-scrollbar-thumb,
      #rwph-xanax-send-status .rwph-xanax-scroll::-webkit-scrollbar-thumb,
      #rw-wrong-payment-panel .rwph-floating-panel-body::-webkit-scrollbar-thumb {
        background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.88)) !important;
        border:2px solid rgba(15,23,42,.50) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper .rw-resize-handle,
      #rw-pay-all-panel .rw-resize-handle,
      #rwph-xanax-send-status .rw-resize-handle,
      #rw-wrong-payment-panel .rw-resize-handle {
        position:absolute !important;
        width:18px !important;
        height:18px !important;
        z-index:30 !important;
        touch-action:none !important;
        -webkit-user-select:none !important;
        user-select:none !important;
        opacity:.95 !important;
        background:rgba(2,6,23,.18) !important;
      }
      #rw-payout-helper .rw-resize-handle-se,
      #rw-pay-all-panel .rw-resize-handle-se,
      #rwph-xanax-send-status .rw-resize-handle-se,
      #rw-wrong-payment-panel .rw-resize-handle-se {
        right:5px !important;
        bottom:5px !important;
        cursor:nwse-resize !important;
        border-right:2px solid rgba(245,158,11,.88) !important;
        border-bottom:2px solid rgba(245,158,11,.88) !important;
        border-left:0 !important;
        border-top:0 !important;
        border-radius:0 0 8px 0 !important;
      }
      #rw-payout-helper .rw-resize-handle-sw,
      #rw-pay-all-panel .rw-resize-handle-sw,
      #rwph-xanax-send-status .rw-resize-handle-sw,
      #rw-wrong-payment-panel .rw-resize-handle-sw {
        left:5px !important;
        bottom:5px !important;
        cursor:nesw-resize !important;
        border-left:2px solid rgba(245,158,11,.88) !important;
        border-bottom:2px solid rgba(245,158,11,.88) !important;
        border-right:0 !important;
        border-top:0 !important;
        border-radius:0 0 0 8px !important;
      }

      #rw-payout-helper .rw-resize-handle-nw,
      #rw-pay-all-panel .rw-resize-handle-nw,
      #rwph-xanax-send-status .rw-resize-handle-nw,
      #rw-wrong-payment-panel .rw-resize-handle-nw {
        left:5px !important;
        top:5px !important;
        cursor:nwse-resize !important;
        border-left:2px solid rgba(245,158,11,.88) !important;
        border-top:2px solid rgba(245,158,11,.88) !important;
        border-right:0 !important;
        border-bottom:0 !important;
        border-radius:8px 0 0 0 !important;
      }
      #rw-payout-helper .rw-resize-handle:hover,
      #rw-pay-all-panel .rw-resize-handle:hover,
      #rwph-xanax-send-status .rw-resize-handle:hover,
      #rw-wrong-payment-panel .rw-resize-handle:hover {
        opacity:1 !important;
        filter:drop-shadow(0 0 6px rgba(245,158,11,.65)) !important;
      }

      /* v1.1.187 PDA/phone move + resize polish: larger touch targets and no top-right handle */
      #rw-payout-helper .rw-resize-handle-ne,
      #rw-pay-all-panel .rw-resize-handle-ne,
      #rwph-xanax-send-status .rw-resize-handle-ne,
      #rw-wrong-payment-panel .rw-resize-handle-ne,
      #rw-pay-all-panel .resize-handle-ne { display:none !important; pointer-events:none !important; }
      @media (max-width: 760px), (pointer: coarse) {
        #rw-payout-helper .rw-head,
        #rw-pay-all-panel .rw-pay-all-head,
        #rwph-xanax-send-status .rwph-xanax-head,
        #rw-wrong-payment-panel .rwph-floating-panel-head {
          min-height:42px !important;
          padding-top:8px !important;
          padding-bottom:8px !important;
          touch-action:none !important;
          cursor:grab !important;
        }
        #rw-payout-helper .rw-resize-handle,
        #rw-pay-all-panel .rw-resize-handle,
        #rwph-xanax-send-status .rw-resize-handle,
        #rw-wrong-payment-panel .rw-resize-handle,
        #rw-pay-all-panel .resize-handle {
          width:30px !important;
          height:30px !important;
          z-index:60 !important;
          background:rgba(2,6,23,.28) !important;
        }
        #rw-payout-helper .rw-resize-handle-se,
        #rw-pay-all-panel .rw-resize-handle-se,
        #rwph-xanax-send-status .rw-resize-handle-se,
        #rw-wrong-payment-panel .rw-resize-handle-se,
        #rw-pay-all-panel .resize-handle-se { right:3px !important; bottom:3px !important; border-width:3px !important; }
        #rw-payout-helper .rw-resize-handle-sw,
        #rw-pay-all-panel .rw-resize-handle-sw,
        #rwph-xanax-send-status .rw-resize-handle-sw,
        #rw-wrong-payment-panel .rw-resize-handle-sw,
        #rw-pay-all-panel .resize-handle-sw { left:3px !important; bottom:3px !important; border-width:3px !important; }
        #rw-payout-helper .rw-resize-handle-nw,
        #rw-pay-all-panel .rw-resize-handle-nw,
        #rwph-xanax-send-status .rw-resize-handle-nw,
        #rw-wrong-payment-panel .rw-resize-handle-nw,
        #rw-pay-all-panel .resize-handle-nw { left:3px !important; top:3px !important; border-width:3px !important; }
      }


      /* v1.1.174: Help API ToS cards match the midnight-blue Help section theme */
      #rw-payout-helper .rw-help-api-grid .rw-help-api-card,
      #rw-payout-helper .rw-help-api-card {
        background: linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
      }
      #rw-payout-helper .rw-help-api-card *,
      #rw-payout-helper .rw-help-api-title,
      #rw-payout-helper .rw-help-api-text,
      #rw-payout-helper .rw-help-api-text b {
        color: #fff7ed !important;
      }
      #rw-payout-helper .rw-help-api-title {
        color: #fff7ed !important;
        text-shadow: 0 0 10px rgba(245,158,11,.16) !important;
      }
      #rw-payout-helper .rw-help-api-text {
        color: #cfaa8e !important;
      }
      #rw-payout-helper .rw-help-api-text b {
        color: #fff7ed !important;
      }


      /* v1.1.176: make every Help section match the midnight-blue API ToS section theme */
      #rw-payout-helper .rw-how-box {
        background: linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
      }
      #rw-payout-helper .rw-how-box *,
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list,
      #rw-payout-helper .rw-how-list li,
      #rw-payout-helper .rw-how-list li b {
        color: #fff7ed !important;
      }
      #rw-payout-helper .rw-how-title {
        color: #fff7ed !important;
        text-shadow: 0 0 10px rgba(245,158,11,.16) !important;
      }
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list li {
        color: #cfaa8e !important;
      }
      #rw-payout-helper .rw-how-list li b {
        color: #fff7ed !important;
      }


      /* v1.1.178: licence/control buttons use the midnight-blue Help-panel style */
      #rw-payout-helper #rw-unlock-existing,
      #rw-payout-helper #rw-start-payment,
      #rw-payout-helper #rw-extend-licence,
      #rw-payout-helper #rw-lock {
        background: linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88)) !important;
        border: 1px solid rgba(251,191,36,.24) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.75) !important;
      }
      #rw-payout-helper #rw-unlock-existing:hover,
      #rw-payout-helper #rw-start-payment:hover,
      #rw-payout-helper #rw-extend-licence:hover,
      #rw-payout-helper #rw-lock:hover {
        filter: brightness(1.08) !important;
        border-color: rgba(251,191,36,.42) !important;
      }

      /* v1.1.179: one matching button style across every RWPH panel */
      #rw-payout-helper button,
      #rw-payout-helper button.secondary,
      #rw-payout-helper button.danger,
      #rw-payout-helper .rw-tab-btn,
      #rw-payout-helper .rw-tab-btn.active,
      #rw-payout-helper a.btn,
      #rw-payout-helper a.btn.secondary,
      #rw-payout-helper .secondary,
      #rw-payout-helper .rw-pay-all-copy,
      #rw-payout-helper .rw-pay-all-undo,
      #rwph-xanax-send-status button,
      #rwph-xanax-send-status button.secondary,
      #rwph-xanax-send-status button.danger,
      #rw-wrong-payment-panel button,
      .rwph-info-popup-panel button {
        background: linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88)) !important;
        border: 1px solid rgba(251,191,36,.24) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.75) !important;
      }
      #rw-payout-helper button:hover,
      #rw-payout-helper a.btn:hover,
      #rwph-xanax-send-status button:hover,
      #rw-wrong-payment-panel button:hover,
      .rwph-info-popup-panel button:hover {
        filter: brightness(1.08) !important;
        border-color: rgba(251,191,36,.42) !important;
      }


      /* v1.1.188: make every RWPH panel close button match the main panel close button */
      #rw-payout-helper #rw-close,
      #rw-payout-helper #rw-results-close,
      #rw-payout-helper .rw-pay-all-close,
      #rw-payout-helper [data-pay-all-close],
      #rwph-xanax-send-status #rwph-close-helper,
      #rw-wrong-payment-panel #rw-wrong-payment-close,
      .rwph-info-popup-panel .rwph-info-popup-close {
        position: absolute !important;
        right: 12px !important;
        top: 16px !important;
        width: 40px !important;
        height: 40px !important;
        min-width: 36px !important;
        min-height: 36px !important;
        max-width: 36px !important;
        max-height: 36px !important;
        padding: 0 !important;
        margin: 0 !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 14px !important;
        border: 1px solid rgba(251,191,36,.24) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        background: linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88)) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.75) !important;
        font: 950 20px/1 Arial, Helvetica, sans-serif !important;
        cursor: pointer !important;
        z-index: 120 !important;
        text-align: center !important;
      }
      #rw-payout-helper #rw-close:hover,
      #rw-payout-helper #rw-results-close:hover,
      #rw-payout-helper .rw-pay-all-close:hover,
      #rw-payout-helper [data-pay-all-close]:hover,
      #rwph-xanax-send-status #rwph-close-helper:hover,
      #rw-wrong-payment-panel #rw-wrong-payment-close:hover,
      .rwph-info-popup-panel .rwph-info-popup-close:hover {
        filter: brightness(1.08) !important;
        border-color: rgba(251,191,36,.42) !important;
      }
      #rw-wrong-payment-panel,
      .rwph-info-popup-panel,
      #rwph-xanax-send-status,
      #rw-payout-helper .rw-pay-all-panel {
        position: fixed !important;
      }

      /* v1.1.179: API ToS / Usage rows use the exact same Help card shell */
      #rw-payout-helper .rw-help-api-grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 8px !important;
        margin-top: 8px !important;
      }
      #rw-payout-helper .rw-help-api-grid > .rw-help-api-card {
        display: block !important;
        margin-top: 0 !important;
        padding: 8px 9px !important;
        border-radius: 10px !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        background: linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        box-sizing: border-box !important;
      }


      #rw-payout-helper .rw-tutorial-first-open-highlight {
        box-shadow: 0 0 0 2px rgba(251,191,36,.75), 0 0 18px rgba(249,115,22,.35) !important;
      }

      /* v1.1.177: every Help card now uses the exact same card shell as API ToS / Usage Table cards */
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-help-section-card {
        display: block !important;
        margin-top: 8px !important;
        padding: 8px 9px !important;
        border-radius: 10px !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        background: linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
        box-sizing: border-box !important;
      }
      #rw-payout-helper .rw-how-box *,
      #rw-payout-helper .rw-help-section-card *,
      #rw-payout-helper .rw-how-title,
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list,
      #rw-payout-helper .rw-how-list li,
      #rw-payout-helper .rw-how-list li b {
        color: #fff7ed !important;
      }
      #rw-payout-helper .rw-how-title {
        margin: 0 0 5px !important;
        color: #fff7ed !important;
        font-size: 11px !important;
        font-weight: 950 !important;
        letter-spacing: .2px !important;
        text-shadow: 0 0 10px rgba(245,158,11,.16) !important;
      }
      #rw-payout-helper .rw-how-intro,
      #rw-payout-helper .rw-how-list li {
        color: #cfaa8e !important;
        font-size: 10px !important;
        line-height: 1.42 !important;
      }
      #rw-payout-helper .rw-how-list {
        margin: 4px 0 0 16px !important;
        padding: 0 !important;
      }
      #rw-payout-helper .rw-how-list li {
        margin: 4px 0 !important;
      }
      #rw-payout-helper .rw-how-list li b,
      #rw-payout-helper .rw-how-intro b {
        color: #fff7ed !important;
        font-weight: 900 !important;
      }



      /* v1.1.197: stronger readable text across every RWPH panel */
      #rw-payout-helper,
      #rw-payout-helper .rw-results-panel,
      #rw-payout-helper .rw-pay-all-panel,
      #rwph-xanax-send-status,
      #rw-wrong-payment-panel,
      .rwph-info-popup-panel {
        color: #f4fbff !important;
        -webkit-font-smoothing: antialiased !important;
        text-rendering: optimizeLegibility !important;
      }
      #rw-payout-helper :is(h1,h2,h3,h4,.rw-head,.rw-head span,.rw-how-title,.rw-summary,.rw-card-title,.rw-member-name,.rw-admin-title,.rw-payment-title,.rw-result-name,.rw-pay-all-title,strong,b),
      #rwph-xanax-send-status :is(h1,h2,h3,h4,.rwph-xanax-title,.rwph-xanax-payment-title,strong,b),
      #rw-wrong-payment-panel :is(h1,h2,h3,h4,strong,b),
      .rwph-info-popup-panel :is(h1,h2,h3,h4,.rwph-info-popup-title,strong,b) {
        color: #ffffff !important;
        font-weight: 950 !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.95), 0 0 14px rgba(251,191,36,.28) !important;
      }
      #rw-payout-helper :is(p,li,span,small,div,label,td,th,.rw-muted,.rw-small,.rw-how-intro,.rw-how-list li,.rw-help-section-card,.rw-help-api-card,.rw-summary,.rw-result-card,.rw-admin-box),
      #rwph-xanax-send-status :is(p,li,span,small,div,label,td,th,.rwph-xanax-note,.rwph-xanax-muted),
      #rw-wrong-payment-panel :is(p,li,span,small,div,label),
      .rwph-info-popup-panel :is(p,li,span,small,div,label) {
        color: #e6f6ff !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.72) !important;
      }
      #rw-payout-helper :is(.rw-muted,.rw-small,.rw-help-note,.rw-how-intro,.rw-how-list li),
      #rwph-xanax-send-status :is(.rwph-xanax-note,.rwph-xanax-muted),
      .rwph-info-popup-panel .rwph-info-popup-message {
        color: #fff2dd !important;
      }
      #rw-payout-helper :is(button,a.btn,.rw-tab-btn,.rw-pay-all-copy,.rw-pay-all-undo),
      #rwph-xanax-send-status button,
      #rw-wrong-payment-panel button,
      .rwph-info-popup-panel button {
        color: #ffffff !important;
        font-weight: 950 !important;
        letter-spacing: .28px !important;
        text-shadow: 0 1px 1px rgba(0,0,0,1), 0 0 12px rgba(251,191,36,.34) !important;
      }
      #rw-payout-helper :is(input,textarea,select),
      #rwph-xanax-send-status :is(input,textarea,select),
      #rw-wrong-payment-panel :is(input,textarea,select) {
        color: #ffffff !important;
        font-weight: 800 !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.75) !important;
      }
      #rw-payout-helper :is(input,textarea)::placeholder,
      #rwph-xanax-send-status :is(input,textarea)::placeholder,
      #rw-wrong-payment-panel :is(input,textarea)::placeholder {
        color: #fde68a !important;
        opacity: .9 !important;
      }

      /* v1.1.142 unified scroll polish: one scroll body per panel/tab, no nested admin/help/tool scroll panes */
      #rw-payout-helper > .rw-body,
      #rw-payout-helper .rw-results-panel > .rw-body {
        overflow-y:auto !important;
        overflow-x:hidden !important;
        min-height:0 !important;
      }
      #rw-payout-helper .rw-tab-section,
      #rw-payout-helper .rw-admin-box,
      #rw-payout-helper .rw-how-box,
      #rw-payout-helper .rw-summary,
      #rw-payout-helper .rw-payment-card,
      #rw-payout-helper .rw-card-list,
      #rw-payout-helper .rw-admin-list,
      #rw-payout-helper .rw-result-actions {
        max-height:none !important;
        overflow:visible !important;
        overflow-x:visible !important;
        overflow-y:visible !important;
        scrollbar-width:none !important;
      }
      #rw-payout-helper .rw-tab-section::-webkit-scrollbar,
      #rw-payout-helper .rw-admin-box::-webkit-scrollbar,
      #rw-payout-helper .rw-how-box::-webkit-scrollbar,
      #rw-payout-helper .rw-summary::-webkit-scrollbar,
      #rw-payout-helper .rw-payment-card::-webkit-scrollbar,
      #rw-payout-helper .rw-card-list::-webkit-scrollbar,
      #rw-payout-helper .rw-admin-list::-webkit-scrollbar,
      #rw-payout-helper .rw-result-actions::-webkit-scrollbar {
        width:0 !important;
        height:0 !important;
        background:transparent !important;
      }
      #rw-payout-helper .rw-admin-unified-panel,
      #rw-payout-helper .rw-unified-tab-panel:not([hidden]) {
        display:grid !important;
        gap:10px !important;
        min-width:0 !important;
      }
      #rw-payout-helper .rw-admin-unified-panel > .rw-small,
      #rw-payout-helper .rw-admin-unified-panel > label,
      #rw-payout-helper .rw-admin-unified-panel > .rw-actions {
        margin-top:0 !important;
      }
      #rw-payout-helper .rw-admin-unified-panel .rw-actions {
        padding-bottom:2px !important;
      }
      #rw-payout-helper .rw-admin-gate-note {
        padding: 9px 10px !important;
        border-radius: 12px !important;
        border: 1px dashed rgba(251,191,36,.34) !important;
        background: rgba(2,6,23,.34) !important;
        color: #fde68a !important;
        font-weight: 900 !important;
      }
      #rw-payout-helper #rw-admin-results,
      #rw-payout-helper #rw-admin-status,
      #rw-payout-helper #rw-status,
      #rw-payout-helper #rw-results-placeholder,
      #rw-payout-helper #rw-main-payment-code,
      #rw-payout-helper #rw-paywall-code,
      #rw-payout-helper #rw-paywall-status {
        min-width:0 !important;
        overflow-wrap:anywhere !important;
      }
      #rw-payout-helper .rw-pay-all-panel,
      #rw-pay-all-panel {
        overflow-y:auto !important;
        overflow-x:hidden !important;
        scrollbar-width:thin !important;
        scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36) !important;
      }
      #rw-payout-helper .rw-pay-all-panel::-webkit-scrollbar,
      #rw-pay-all-panel::-webkit-scrollbar {
        width:8px !important;
        height:8px !important;
      }
      #rw-payout-helper .rw-pay-all-panel::-webkit-scrollbar-track,
      #rw-pay-all-panel::-webkit-scrollbar-track {
        background:rgba(15,23,42,.34) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper .rw-pay-all-panel::-webkit-scrollbar-thumb,
      #rw-pay-all-panel::-webkit-scrollbar-thumb {
        background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.88)) !important;
        border:2px solid rgba(15,23,42,.50) !important;
        border-radius:999px !important;
      }
      #rw-payout-helper .rw-pay-all-list,
      #rw-pay-all-panel .rw-pay-all-list,
      #rw-pay-all-panel .pay-all-list {
        max-height:none !important;
        overflow:visible !important;
        flex:0 0 auto !important;
        scrollbar-width:none !important;
      }

      #rw-payout-helper .rw-pay-all-list,
      #rw-pay-all-panel .rw-pay-all-list {
        padding-right:3px !important;
      }

      /* v1.1.146: keep the Xanax Payment Helper copy buttons visible and high in the panel */
      #rwph-xanax-send-status .rwph-xanax-scroll {
        display:grid !important;
        gap:7px !important;
        align-content:start !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions {
        display:grid !important;
        grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
        gap:7px !important;
        margin:2px 0 4px !important;
        padding:0 !important;
        position:relative !important;
        z-index:25 !important;
        visibility:visible !important;
        opacity:1 !important;
        min-height:36px !important;
        overflow:visible !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions button {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        width:100% !important;
        min-width:0 !important;
        min-height:36px !important;
        padding:8px 6px !important;
        font-size:11px !important;
        line-height:1.15 !important;
        white-space:normal !important;
        cursor:pointer !important;
      }

      /* v1.1.147: make the Xanax helper expiry timer match and stand out like the main payment card timer */
      #rwph-xanax-send-status .rwph-xanax-expiry-hero {
        display:grid !important;
        grid-template-columns:1fr !important;
        gap:2px !important;
        margin:9px 0 2px !important;
        padding:10px 12px !important;
        border-radius:14px !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(251,191,36,.22), transparent 58%),
          linear-gradient(180deg, rgba(14,165,233,.18), rgba(2,6,23,.90)) !important;
        border:1px solid rgba(251,191,36,.62) !important;
        box-shadow:
          0 0 0 1px rgba(255,255,255,.05) inset,
          0 0 22px rgba(245,158,11,.18),
          0 10px 22px rgba(0,0,0,.28) !important;
        color:#fff2dd !important;
        text-align:center !important;
        font-size:12px !important;
        font-weight:950 !important;
        letter-spacing:.2px !important;
        line-height:1.22 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero b {
        display:block !important;
        margin-bottom:2px !important;
        color:#f8fafc !important;
        font-size:10px !important;
        text-transform:uppercase !important;
        letter-spacing:.75px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero [data-rwph-expire-count] {
        display:inline-block !important;
        min-width:54px !important;
        padding:2px 8px !important;
        border-radius:999px !important;
        background:rgba(253,230,138,.15) !important;
        border:1px solid rgba(253,230,138,.32) !important;
        color:#ffffff !important;
        font-size:18px !important;
        font-weight:1000 !important;
        line-height:1.05 !important;
        text-shadow:0 0 10px rgba(251,191,36,.42) !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero .rwph-expire-clock {
        display:block !important;
        margin:5px 0 0 !important;
        color:#fde68a !important;
        font-size:10px !important;
        font-weight:900 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero.rwph-expired {
        background:
          radial-gradient(circle at 50% 0%, rgba(248,113,113,.24), transparent 58%),
          linear-gradient(180deg, rgba(127,29,29,.38), rgba(2,6,23,.92)) !important;
        border-color:rgba(248,113,113,.70) !important;
        box-shadow:0 0 22px rgba(248,113,113,.18), 0 10px 22px rgba(0,0,0,.28) !important;
        color:#fecaca !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-note {
        margin:5px 0 0 !important;
        color:#fde68a !important;
        font-size:10px !important;
        font-weight:800 !important;
        line-height:1.25 !important;
        text-align:center !important;
      }
      @media (max-width:420px), (pointer:coarse) {
        #rwph-xanax-send-status .rwph-xanax-actions {
          grid-template-columns:1fr !important;
          min-height:76px !important;
        }
      }

      /* v1.1.149: keep the Xanax Payment Helper usable even after the main panel auto-closes */
      #rwph-xanax-send-status {
        position:fixed !important;
        display:flex !important;
        flex-direction:column !important;
        width:min(430px, calc(100vw - 20px)) !important;
        min-width:min(300px, calc(100vw - 20px)) !important;
        min-height:min(360px, calc(100vh - 20px)) !important;
        max-width:calc(100vw - 16px) !important;
        max-height:calc(100vh - 16px) !important;
        overflow:hidden !important;
      }
      #rwph-xanax-send-status #rwph-payment-helper-title {
        flex:0 0 auto !important;
        cursor:move !important;
        touch-action:none !important;
        position:sticky !important;
        top:0 !important;
        z-index:45 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-scroll {
        flex:1 1 auto !important;
        min-height:0 !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        padding:0 4px 8px !important;
        display:grid !important;
        gap:7px !important;
        align-content:start !important;
        scrollbar-width:thin !important;
        scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36) !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions,
      #rwph-xanax-send-status .rwph-xanax-expiry-hero {
        flex:0 0 auto !important;
        visibility:visible !important;
        opacity:1 !important;
        display:grid !important;
        position:relative !important;
        z-index:35 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions button {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        pointer-events:auto !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero {
        order:3 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions {
        order:5 !important;
      }
      #rwph-xanax-send-status .rw-resize-handle {
        display:block !important;
        pointer-events:auto !important;
        visibility:visible !important;
        opacity:.98 !important;
        z-index:60 !important;
      }
      @media (max-width:420px), (pointer:coarse) {
        #rwph-xanax-send-status {
          right:6px !important;
          bottom:6px !important;
          width:calc(100vw - 12px) !important;
          min-width:0 !important;
          min-height:min(330px, calc(100vh - 12px)) !important;
          max-width:calc(100vw - 12px) !important;
          max-height:calc(100vh - 12px) !important;
        }
      }

      /* v1.1.154: compact Xanax helper content and keep the timer tied to the main saved Payment Code Ready expiry */
      #rwph-xanax-send-status {
        width:min(400px, calc(100vw - 20px)) !important;
        min-height:min(310px, calc(100vh - 20px)) !important;
        padding:9px !important;
      }
      #rwph-xanax-send-status #rwph-payment-helper-title {
        margin:0 30px 4px 0 !important;
        padding:6px 8px !important;
        font-size:12px !important;
        line-height:1.1 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-scroll {
        gap:5px !important;
        padding:0 3px 5px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-helper-subtitle {
        margin:0 0 3px !important;
        font-size:9.8px !important;
        line-height:1.15 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-helper-message {
        margin:0 0 4px !important;
        font-size:10.6px !important;
        line-height:1.22 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-detail-card {
        margin:4px 0 !important;
        padding:7px !important;
        border-radius:10px !important;
        font-size:10.6px !important;
        line-height:1.22 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-detail-title {
        margin-bottom:4px !important;
        font-size:9.3px !important;
        letter-spacing:.45px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero {
        margin:5px 0 1px !important;
        padding:7px 8px !important;
        border-radius:12px !important;
        gap:1px !important;
        line-height:1.08 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero b {
        margin-bottom:1px !important;
        font-size:8.8px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero [data-rwph-expire-count] {
        min-width:48px !important;
        padding:1px 7px !important;
        font-size:16px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-hero .rwph-expire-clock {
        margin:3px 0 0 !important;
        font-size:9.2px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-expiry-note {
        margin:3px 0 0 !important;
        font-size:9.2px !important;
        line-height:1.12 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions {
        gap:5px !important;
        margin:4px 0 3px !important;
        min-height:30px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-actions button {
        min-height:30px !important;
        padding:6px 5px !important;
        font-size:10.2px !important;
        line-height:1.05 !important;
        border-radius:10px !important;
      }
      #rwph-xanax-send-status .rwph-xanax-steps {
        margin-top:5px !important;
        font-size:9.8px !important;
        line-height:1.22 !important;
      }
      #rwph-xanax-send-status .rwph-xanax-safety-note {
        margin-top:5px !important;
        padding-top:5px !important;
        padding-right:18px !important;
        font-size:9.5px !important;
        line-height:1.18 !important;
      }
      @media (max-width:420px), (pointer:coarse) {
        #rwph-xanax-send-status {
          min-height:min(300px, calc(100vh - 12px)) !important;
          padding:7px !important;
        }
        #rwph-xanax-send-status .rwph-xanax-actions {
          grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
          min-height:30px !important;
        }
      }


      /* v1.1.199: Help tab cards are compact dropdown buttons */
      #rw-payout-helper details.rw-help-dropdown {
        display: block !important;
        padding: 0 !important;
        overflow: hidden !important;
        max-height: none !important;
      }
      #rw-payout-helper summary.rw-help-dropdown-summary {
        margin: 0 !important;
        padding: 10px 11px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        width: 100% !important;
        min-height: 38px !important;
        border-radius: 12px !important;
        cursor: pointer !important;
        user-select: none !important;
        list-style: none !important;
        color: #ffffff !important;
        font-size: 11.5px !important;
        font-weight: 1000 !important;
        letter-spacing: .34px !important;
        text-transform: none !important;
        background:
          radial-gradient(circle at 12% 0%, rgba(251,146,60,.18), transparent 34%),
          linear-gradient(90deg, rgba(122,43,28,.86), rgba(67,35,26,.62)) !important;
        border: 1px solid rgba(251,191,36,.26) !important;
        box-shadow:
          0 1px 0 rgba(255,255,255,.06) inset,
          0 8px 18px rgba(0,0,0,.20) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.95), 0 0 10px rgba(255,172,85,.18) !important;
      }
      #rw-payout-helper summary.rw-help-dropdown-summary::-webkit-details-marker {
        display: none !important;
      }
      #rw-payout-helper summary.rw-help-dropdown-summary::after {
        content: "▾" !important;
        flex: 0 0 auto !important;
        width: 22px !important;
        height: 22px !important;
        display: inline-grid !important;
        place-items: center !important;
        border-radius: 999px !important;
        color: #fff7ed !important;
        background: rgba(15,23,42,.38) !important;
        border: 1px solid rgba(251,191,36,.25) !important;
        box-shadow: 0 0 12px rgba(251,146,60,.12) !important;
        font-size: 12px !important;
        line-height: 1 !important;
      }
      #rw-payout-helper details.rw-help-dropdown[open] > summary.rw-help-dropdown-summary {
        border-radius: 12px 12px 0 0 !important;
        border-bottom-color: rgba(251,191,36,.18) !important;
      }
      #rw-payout-helper details.rw-help-dropdown[open] > summary.rw-help-dropdown-summary::after {
        content: "▴" !important;
      }
      #rw-payout-helper .rw-help-dropdown-content {
        padding: 10px 11px 11px !important;
        background: linear-gradient(180deg, rgba(15,23,42,.18), rgba(2,6,23,.12)) !important;
        border-left: 1px solid rgba(184,136,89,.16) !important;
        border-right: 1px solid rgba(184,136,89,.16) !important;
        border-bottom: 1px solid rgba(184,136,89,.16) !important;
        border-radius: 0 0 12px 12px !important;
      }
      #rw-payout-helper details.rw-help-dropdown:not([open]) > .rw-help-dropdown-content {
        display: none !important;
      }
      #rw-payout-helper .rw-help-dropdown-content > :first-child {
        margin-top: 0 !important;
      }
      #rw-payout-helper .rw-help-dropdown-content > :last-child {
        margin-bottom: 0 !important;
      }
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown {
        margin: 0 !important;
      }
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown summary.rw-help-dropdown-summary {
        min-height: 34px !important;
        padding: 8px 9px !important;
        border-radius: 10px !important;
        font-size: 10.5px !important;
        background:
          radial-gradient(circle at 12% 0%, rgba(251,191,36,.14), transparent 36%),
          linear-gradient(90deg, rgba(15,23,42,.84), rgba(30,41,59,.74)) !important;
        border-color: rgba(251,191,36,.24) !important;
      }
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown[open] summary.rw-help-dropdown-summary {
        border-radius: 10px 10px 0 0 !important;
      }


      /* v1.1.203: Help dropdown buttons use the same midnight-blue shell as the main panel */
      #rw-payout-helper summary.rw-help-dropdown-summary,
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown summary.rw-help-dropdown-summary {
        background:
          radial-gradient(circle at 16% 0%, rgba(245,158,11,.16), transparent 28%),
          radial-gradient(circle at 88% 8%, rgba(129,140,248,.13), transparent 30%),
          linear-gradient(180deg, rgba(8,13,25,.97), rgba(15,23,42,.96) 54%, rgba(10,15,28,.98)) !important;
        border: 1px solid rgba(251,191,36,.28) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        color: #fff7ed !important;
        box-shadow:
          0 1px 0 rgba(255,255,255,.06) inset,
          0 10px 22px rgba(2,8,23,.34),
          0 0 18px rgba(245,158,11,.08) !important;
        text-shadow: 0 0 12px rgba(245,158,11,.20) !important;
      }
      #rw-payout-helper details.rw-help-dropdown[open] > summary.rw-help-dropdown-summary,
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown[open] summary.rw-help-dropdown-summary {
        border-bottom-color: rgba(251,191,36,.24) !important;
      }
      #rw-payout-helper summary.rw-help-dropdown-summary::after,
      #rw-payout-helper .rw-help-api-grid > details.rw-help-dropdown summary.rw-help-dropdown-summary::after {
        color: #fff2dd !important;
        background: rgba(15,23,42,.72) !important;
        border: 1px solid rgba(251,191,36,.30) !important;
        box-shadow: 0 0 12px rgba(245,158,11,.12) !important;
      }

      /* v1.1.200: clear active-tab highlight for main and locked panel navigation */
      #rw-payout-helper .rw-tabs .rw-tab-btn {
        position: relative !important;
        isolation: isolate !important;
      }
      #rw-payout-helper .rw-tabs .rw-tab-btn:not(.active) {
        opacity: .74 !important;
        filter: saturate(.82) brightness(.88) !important;
      }
      #rw-payout-helper .rw-tabs .rw-tab-btn:not(.active):hover {
        opacity: .96 !important;
        filter: brightness(1.06) saturate(1.05) !important;
      }
      #rw-payout-helper .rw-tabs .rw-tab-btn.active,
      #rw-payout-helper .rw-tabs .rw-tab-btn[aria-selected="true"] {
        background:
          radial-gradient(circle at 18% 0%, rgba(249,115,22,.40), transparent 38%),
          linear-gradient(135deg, rgba(14,165,233,1), rgba(79,70,229,.96)) !important;
        border: 1px solid rgba(165,243,252,.78) !important;
        border-left: 4px solid rgba(249,115,22,1) !important;
        color: #ffffff !important;
        opacity: 1 !important;
        filter: none !important;
        transform: translateY(-1px) !important;
        box-shadow:
          0 0 0 1px rgba(255,255,255,.10) inset,
          0 0 20px rgba(245,158,11,.42),
          0 12px 28px rgba(14,165,233,.26) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,1), 0 0 14px rgba(224,242,254,.46) !important;
      }
      #rw-payout-helper .rw-tabs .rw-tab-btn.active::after,
      #rw-payout-helper .rw-tabs .rw-tab-btn[aria-selected="true"]::after {
        content: "" !important;
        position: absolute !important;
        left: 12px !important;
        right: 12px !important;
        bottom: 4px !important;
        height: 2px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.92) !important;
        box-shadow: 0 0 10px rgba(224,242,254,.65) !important;
        pointer-events: none !important;
      }

      /* v1.1.219: report cache / admin status cards match the midnight-blue RWPH theme */
      #rw-payout-helper .rw-cache-tools,
      #rw-payout-helper .rw-admin-advanced-box,
      #rw-payout-helper .rw-performance-box {
        margin-top: 8px !important;
        padding: 9px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(251,191,36,.18) !important;
        border-left: 4px solid rgba(245,158,11,.66) !important;
        background:
          radial-gradient(circle at 16% 0%, rgba(245,158,11,.12), transparent 30%),
          linear-gradient(180deg, rgba(30,41,59,.54), rgba(2,6,23,.38)) !important;
        color: #fff7ed !important;
        box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26) !important;
      }
      #rw-payout-helper .rw-cache-tools .rw-actions,
      #rw-payout-helper .rw-admin-advanced-box .rw-actions {
        margin-top: 6px !important;
      }
      #rw-payout-helper .rw-admin-status-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
        margin-top: 8px !important;
      }
      #rw-payout-helper .rw-admin-status-card {
        border-radius: 10px !important;
        padding: 8px !important;
        border: 1px solid rgba(251,191,36,.16) !important;
        background: linear-gradient(180deg, rgba(15,23,42,.70), rgba(2,6,23,.50)) !important;
        color: #fff7ed !important;
      }
      #rw-payout-helper .rw-admin-status-label {
        font-size: 9px !important;
        color: #fde68a !important;
        font-weight: 900 !important;
      }
      #rw-payout-helper .rw-admin-status-value {
        margin-top: 2px !important;
        color: #ffffff !important;
        font-size: 12px !important;
        font-weight: 1000 !important;
      }



    `;
  }



  function rwphEnsureFloatingPanelCss() {
    try {
      const cssId = "rwph-floating-panel-global-style";
      const cssText = panelBaseCss();
      let style = document.getElementById(cssId);
      if (!style) {
        style = document.createElement("style");
        style.id = cssId;
        (document.head || document.documentElement || document.body).appendChild(style);
      }
      if (style.textContent !== cssText) style.textContent = cssText;
    } catch (e) {
      console.warn("Could not inject RWPH floating panel styles:", e);
    }
  }

  function rwphSetTabButtonActive(button, isActive) {
    if (!button) return;
    button.classList.toggle("active", !!isActive);
    button.classList.toggle("secondary", !isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }




  function buildPayoutCsvText(rows, summary = {}) {
    const pointsMode = summary?.pointsMode || summary?.calculationMode === "points";
    const memberPayout = rwphSummaryMemberPayout(summary, rows || []);
    const share = (payout) => memberPayout > 0 ? `${((Number(payout || 0) / memberPayout) * 100).toFixed(2)}%` : "0.00%";
    const header = pointsMode
      ? ["Torn ID", "Name", "War Hits", "Assists", "Outside Hits", "Retaliation Hits", "Total Tracked", "Payable Events", "Own-Faction Hospital Hits", "Own-Faction Hospital Bonus", "Enemy War Faction Hospital Hits", "Enemy War Faction Hospital Bonus", "Points", "Base Points", "Avg Fair Fight", "FF Bonus Per Payable Hit", "Fair Fight Bonus", "Total Respect", "Respect", "Payout", "Share"]
      : ["Torn ID", "Name", "War Hits", "Assists", "Outside Hits", "Retaliation Hits", "Total Tracked", "Payable Events", "Total Respect", "Respect", "Weight", "Payout", "Share"];
    const body = (rows || []).map((r) => {
      const payout = Number(r.payout || 0);
      return pointsMode ? [
        r.id,
        r.name,
        r.warHits ?? r.attacks ?? 0,
        r.assists,
        r.outsideHits || 0,
        r.retaliationHits || 0,
        r.totalTrackedHits || 0,
        r.payableEvents || 0,
        r.hospitalizingHits || 0,
        Number(r.hospitalBonusPoints || 0).toFixed(2),
        r.enemyFactionHospitalizingHits || 0,
        Number(r.enemyFactionHospitalBonusPoints || 0).toFixed(2),
        Number(r.points ?? r.weight ?? 0).toFixed(2),
        Number(r.basePoints || 0).toFixed(2),
        Number(r.avgFairFight || 1).toFixed(2),
        Number(r.fairFightPerPayableHitBonus || 0).toFixed(2),
        Number(r.fairFightBonusPoints || 0).toFixed(2),
        Number(r.totalRespect ?? r.respect ?? 0).toFixed(2),
        Number(r.respect || 0).toFixed(2),
        Math.round(payout),
        share(payout),
      ] : [
        r.id,
        r.name,
        r.warHits ?? r.attacks ?? 0,
        r.assists,
        r.outsideHits || 0,
        r.retaliationHits || 0,
        r.totalTrackedHits || 0,
        r.payableEvents || 0,
        Number(r.totalRespect ?? r.respect ?? 0).toFixed(2),
        Number(r.respect || 0).toFixed(2),
        Number(r.weight || 0).toFixed(2),
        Math.round(payout),
        share(payout),
      ];
    });

    return [header, ...body]
      .map((line) => line.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
  }

  function rwphFactionControlsPayAllUrl() {
    // v1.1.413: current-tab payments route points at faction controls/vault and carries the RWPH handoff flag.
    return "https://www.torn.com/factions.php?step=your&rwphPayAll=1#/tab=controls&subtab=vault";
  }

  function rwphPayAllRowAmount(row) {
    const r = row || {};
    const candidates = [
      r.payout,
      r.payoutAmount,
      r.paymentAmount,
      r.memberPayment,
      r.amount,
      r.payAmount,
      r.payableAmount,
      r.money,
      r.cash,
    ];
    for (const candidate of candidates) {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
    return 0;
  }

  function rwphNormalizePayAllRow(row) {
    const r = row || {};
    const amount = rwphPayAllRowAmount(r);
    const id = String(r.id || r.tornId || r.userId || "unknown");
    const name = r.name || r.username || r.memberName || `Unknown ${id}`;
    return {
      ...r,
      id,
      name,
      payout: amount,
      payoutAmount: amount,
      paymentAmount: amount,
      memberPayment: amount,
      amount,
    };
  }

  function rwphNormalizePayAllRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(rwphNormalizePayAllRow);
  }

  function rwphBuildPayAllRowsPayload(rows) {
    return JSON.stringify({ createdAt: Date.now(), rows: rwphNormalizePayAllRows(rows || []) });
  }

  function rwphParsePayAllRowsPayload(raw) {
    if (!raw) return null;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    const createdAt = Number(parsed.createdAt || 0);
    if (Date.now() - createdAt > 6 * 60 * 60 * 1000) return null;
    return { rows: parsed.rows, createdAt };
  }

  function rwphStorePayAllRows(rows) {
    const payload = rwphBuildPayAllRowsPayload(rows || []);
    try {
      GM_setValue(PAY_ALL_ROWS_STORAGE_KEY, payload);
    } catch (e) {
      console.warn("Could not save Payments rows to userscript storage:", e);
    }
    try {
      localStorage.setItem(PAY_ALL_ROWS_FALLBACK_STORAGE_KEY, payload);
    } catch (e) {
      console.warn("Could not save Payments rows to fallback storage:", e);
    }
  }

  function rwphGetStoredPayAllRows() {
    const sources = [];
    try { sources.push(GM_getValue(PAY_ALL_ROWS_STORAGE_KEY, "")); } catch (_) {}
    try { sources.push(localStorage.getItem(PAY_ALL_ROWS_FALLBACK_STORAGE_KEY) || ""); } catch (_) {}

    let best = null;
    for (const raw of sources) {
      try {
        const payload = rwphParsePayAllRowsPayload(raw);
        if (payload?.rows?.length && (!best || payload.createdAt > best.createdAt)) best = payload;
      } catch (e) {
        console.warn("Could not load Payments rows from one storage source:", e);
      }
    }
    return rwphNormalizePayAllRows(best?.rows || []);
  }

  function rwphParseRecentPayAllReportPayload(raw) {
    if (!raw) return null;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || !parsed.html) return null;
    const expiresAt = Number(parsed.expiresAt || 0);
    const createdAt = Number(parsed.createdAt || 0);
    if (!expiresAt || Date.now() > expiresAt) return null;
    return {
      html: String(parsed.html || ""),
      filename: String(parsed.filename || "rwph-results-report.html"),
      createdAt,
      expiresAt,
    };
  }

  function rwphGetRecentPayAllReport() {
    const sources = [];
    try { sources.push(GM_getValue(PAY_ALL_REPORT_REOPEN_STORAGE_KEY, "")); } catch (_) {}
    try { sources.push(localStorage.getItem(PAY_ALL_REPORT_REOPEN_STORAGE_KEY) || ""); } catch (_) {}
    let best = null;
    for (const raw of sources) {
      try {
        const payload = rwphParseRecentPayAllReportPayload(raw);
        if (payload?.html && (!best || payload.createdAt > best.createdAt)) best = payload;
      } catch (e) {
        console.warn("Could not load recent RWPH report reopen payload:", e);
      }
    }
    if (!best) {
      try { GM_setValue(PAY_ALL_REPORT_REOPEN_STORAGE_KEY, ""); } catch (_) {}
      try { localStorage.removeItem(PAY_ALL_REPORT_REOPEN_STORAGE_KEY); } catch (_) {}
    }
    return best;
  }

  function rwphStoreRecentPayAllReport(html, filename = "rwph-results-report.html") {
    const value = String(html || "");
    if (!value || value.length < 1000) return false;
    const now = Date.now();
    const payload = JSON.stringify({
      createdAt: now,
      expiresAt: now + PAY_ALL_REPORT_REOPEN_TTL_MS,
      filename: String(filename || "rwph-results-report.html"),
      html: value,
    });
    let saved = false;
    try { GM_setValue(PAY_ALL_REPORT_REOPEN_STORAGE_KEY, payload); saved = true; } catch (_) {}
    try { localStorage.setItem(PAY_ALL_REPORT_REOPEN_STORAGE_KEY, payload); saved = true; } catch (_) {}
    return saved;
  }

  function rwphBuildResultsReportFilename(summary = {}) {
    const faction = String(summary?.factionName || summary?.faction?.name || "faction").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "faction";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `rwph-${faction}-results-${stamp}.html`;
  }

  function rwphStoreRecentPayAllReportFromRows(rows, summary = {}) {
    try {
      const html = buildFullscreenResultsHtml(rows || [], summary || {});
      return rwphStoreRecentPayAllReport(html, rwphBuildResultsReportFilename(summary || {}));
    } catch (e) {
      console.warn("Could not store recent RWPH report before opening Payments:", e);
      return false;
    }
  }

  function rwphOpenRecentPayAllReportFromStorage() {
    const payload = rwphGetRecentPayAllReport();
    if (!payload?.html) return false;
    try {
      const blob = new Blob([payload.html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 30000);
      if (tab) return true;
      window.location.href = url;
      return true;
    } catch (e) {
      console.warn("Could not reopen recent RWPH report:", e);
      return false;
    }
  }

  function rwphRecentPayAllReportButtonHtml() {
    const report = rwphGetRecentPayAllReport();
    if (!report?.html) return "";
    const minutesLeft = Math.max(1, Math.ceil((Number(report.expiresAt || 0) - Date.now()) / 60000));
    return `<button type="button" class="secondary rw-pay-all-reopen-report" data-reopen-pay-report="1" title="Reopen the report for ${minutesLeft} more minute(s)">Reopen Report</button>`;
  }

  function rwphSchedulePayAllReportButtonExpiry(panel) {
    if (!panel) return;
    const refresh = () => {
      const btn = panel.querySelector?.("[data-reopen-pay-report]");
      if (!btn) return;
      const report = rwphGetRecentPayAllReport();
      const msLeft = Number(report?.expiresAt || 0) - Date.now();
      if (!report?.html || msLeft <= 0) {
        try { btn.remove(); } catch (_) {}
        return;
      }
      try { setTimeout(refresh, Math.max(1000, Math.min(msLeft + 500, PAY_ALL_REPORT_REOPEN_TTL_MS + 500))); } catch (_) {}
    };
    refresh();
  }

  function rwphOpenPayAllInFactionControls(rows) {
    rwphStorePayAllRows(rows || []);
    rwphStoreRecentPayAllReportFromRows(rows || [], lastSummary || {});
    const url = rwphFactionControlsPayAllUrl();
    try { rwphQueueCrossTabPopup("payments", "Payments opened in the current Torn tab on the faction vault/controls page. Use the copy-only panel there.", "info", "RWPH Payments"); } catch (_) {}
    try { closePanel(); } catch (_) {}
    try { rwphCloseAllPanelsExceptPayAll(); } catch (_) {}
    try {
      if (window.top && window.top !== window) { window.top.location.href = url; return true; }
    } catch (_) {}
    try {
      window.location.assign(url);
      return true;
    } catch (e) {
      console.warn("Current-tab Payments faction vault navigation failed:", e);
      try { window.location.href = url; return true; } catch (_) {}
      return false;
    }
  }


  function rwphSafeDownloadFilename(name, fallback = "rwph-results-page.html") {
    const raw = String(name || fallback || "rwph-results-page.html").trim();
    const cleaned = raw.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").slice(0, 160).trim();
    return cleaned || fallback;
  }

  function rwphTriggerDownloadAnchor(url, filename) {
    try {
      const a = document.createElement("a");
      a.href = String(url || "");
      a.download = rwphSafeDownloadFilename(filename);
      a.rel = "noopener";
      a.style.setProperty("display", "none", "important");
      (document.body || document.documentElement).appendChild(a);
      if (typeof a.click === "function") a.click();
      else a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      setTimeout(() => { try { a.remove(); } catch (_) {} }, 250);
      return true;
    } catch (e) {
      console.warn("RWPH anchor download failed:", e);
      return false;
    }
  }

  function rwphDownloadTextFileStrong(filename, text, mime = "text/html;charset=utf-8") {
    const safeName = rwphSafeDownloadFilename(filename);
    const value = String(text || "");
    const type = String(mime || "text/html;charset=utf-8");

    try {
      if (typeof GM_download === "function") {
        const dataUrl = "data:" + type + "," + encodeURIComponent(value);
        if (dataUrl.length < 1900000) {
          GM_download({ url: dataUrl, name: safeName, saveAs: false });
          return true;
        }
      }
    } catch (e) {
      console.warn("RWPH GM_download data-url export failed:", e);
    }

    try {
      const blob = new Blob([value], { type });
      const url = URL.createObjectURL(blob);
      const ok = rwphTriggerDownloadAnchor(url, safeName);
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 15000);
      if (ok) return true;
    } catch (e) {
      console.warn("RWPH Blob export failed:", e);
    }

    try {
      const dataUrl = "data:" + type + "," + encodeURIComponent(value);
      if (dataUrl.length < 1900000 && rwphTriggerDownloadAnchor(dataUrl, safeName)) return true;
    } catch (e) {
      console.warn("RWPH data-url export failed:", e);
    }

    return false;
  }


  function rwphSubmitMainExportDownloadForm(filename, content, mime = "text/plain;charset=utf-8", extension = "txt") {
    try {
      const base = String(PAYWALL_API_BASE || "").replace(/\/+$/, "");
      if (!base) return false;
      const ext = String(extension || "txt").replace(/[^a-z0-9]/gi, "").toLowerCase() || "txt";
      const safeName = rwphSafeDownloadFilename(filename || (ext === "csv" ? "torn-rw-payouts.csv" : "rwph-results-page.html"));
      const form = document.createElement("form");
      form.method = "POST";
      form.action = base + "/api/calc/download-file";
      form.target = "_blank";
      form.acceptCharset = "UTF-8";
      form.style.position = "fixed";
      form.style.left = "-9999px";
      form.style.top = "-9999px";
      const add = (name, value) => {
        const input = document.createElement("textarea");
        input.name = name;
        input.value = String(value == null ? "" : value);
        form.appendChild(input);
      };
      add("filename", safeName);
      add("content", String(content || ""));
      add("mime", mime || "text/plain;charset=utf-8");
      add("extension", ext);
      (document.body || document.documentElement).appendChild(form);
      form.submit();
      setTimeout(() => { try { form.remove(); } catch (_) {} }, 1000);
      return true;
    } catch (e) {
      console.warn("RWPH main direct form export failed:", e);
      return false;
    }
  }

  function rwphOpenExportTextFallbackPanel(kind, text, filename, mime = "text/plain;charset=utf-8", reason = "Download fallback ready.", downloadUrl = "", inlineUrl = "") {
    try {
      const old = document.getElementById("rwph-export-text-panel");
      if (old) old.remove();

      const label = String(kind || "Export").toUpperCase();
      const safeName = rwphSafeDownloadFilename(filename || (label === "CSV" ? "torn-rw-payouts.csv" : "rwph-results-page.html"));
      const value = String(text || "");
      const panel = document.createElement("section");
      panel.id = "rwph-export-text-panel";
      panel.className = "rwph-results-html-panel";
      panel.style.display = "flex";
      panel.style.visibility = "visible";
      panel.style.opacity = "1";
      panel.innerHTML = `
        <div class="rwph-results-html-head">
          <div>
            <div class="rwph-results-html-title">Export ${esc(label)}</div>
            <div class="rwph-results-html-note">On Torn PDA, use the download link below. If PDA blocks downloads, copy the raw ${esc(label)} box and save it manually.</div>
          </div>
          <a class="rwph-results-html-close" href="#" title="Close">×</a>
        </div>
        <div class="rwph-results-html-status">${esc(reason || "Download fallback ready.")} File name: ${esc(safeName)}</div>
        <div class="rwph-export-html-actions" id="rwph-export-text-actions"></div>
        <textarea class="rwph-results-html-box" id="rwph-export-text-box" readonly spellcheck="false" onfocus="this.select()" onclick="this.focus()" oncontextmenu="this.focus();this.select();"></textarea>
      `;
      (document.body || document.documentElement).appendChild(panel);

      const actions = panel.querySelector("#rwph-export-text-actions");
      const addLink = (href, textContent, isDownload = true) => {
        if (!actions || !href) return;
        const a = document.createElement("a");
        a.href = href;
        if (isDownload) a.download = safeName;
        a.target = "_self";
        a.textContent = textContent;
        actions.appendChild(a);
      };
      addLink(downloadUrl, `Download .${safeName.split(".").pop() || "file"} File`, true);
      addLink(inlineUrl, `Open ${label} in this tab`, false);
      try {
        const blob = new Blob([value], { type: mime || "text/plain;charset=utf-8" });
        const localUrl = URL.createObjectURL(blob);
        addLink(localUrl, downloadUrl ? "Backup Local Download" : `Download .${safeName.split(".").pop() || "file"} File`, true);
        setTimeout(() => { try { URL.revokeObjectURL(localUrl); } catch (_) {} }, 10 * 60 * 1000);
      } catch (_) {}

      const box = panel.querySelector("#rwph-export-text-box");
      if (box) {
        box.value = value;
        setTimeout(() => { try { box.focus(); box.select(); } catch (_) {} }, 80);
      }
      const close = panel.querySelector(".rwph-results-html-close");
      if (close) close.addEventListener("click", (ev) => {
        try { ev.preventDefault(); } catch (_) {}
        try { panel.remove(); } catch (_) {}
      });
      try { makeDraggable(panel, ".rwph-results-html-head"); makeResizable(panel); } catch (_) {}
      return panel;
    } catch (e) {
      console.warn("RWPH export fallback panel failed:", e);
      return null;
    }
  }

  async function rwphCreateServerExportFile(filename, text, mime = "text/plain;charset=utf-8", extension = "txt") {
    const base = String(PAYWALL_API_BASE || "").replace(/\/+$/, "");
    if (!base || typeof fetch !== "function") throw new Error("Server export unavailable.");
    const res = await fetch(base + "/api/calc/export-file", {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ filename, content: String(text || ""), mime, extension }),
    });
    const data = await res.json().catch(() => ({ ok: false, error: "Bad export response" }));
    if (!res.ok || !data?.ok) throw new Error(data?.error || `Export failed with status ${res.status}`);
    return data;
  }

  async function rwphExportTextPdaSafe({ kind, filename, text, mime, extension, statusEl }) {
    const label = String(kind || "export").toUpperCase();
    const safeName = rwphSafeDownloadFilename(filename || (extension === "csv" ? "torn-rw-payouts.csv" : "rwph-results-page.html"));
    const value = String(text || "");
    const type = mime || "text/plain;charset=utf-8";
    const ext = extension || "txt";

    let formStarted = false;
    try {
      if (statusEl) statusEl.textContent = `Starting ${label} download...`;
      // Direct POST download happens immediately from the user's click handler. This is more reliable
      // than waiting for fetch/blob permissions, especially inside Torn PDA.
      formStarted = rwphSubmitMainExportDownloadForm(safeName, value, type, ext);
    } catch (_) { formStarted = false; }

    let localStarted = false;
    if (!formStarted && !(typeof rwphIsMobileOrPdaView === "function" && rwphIsMobileOrPdaView())) {
      try { localStarted = !!rwphDownloadTextFileStrong(safeName, value, type); } catch (_) { localStarted = false; }
    }

    const panel = rwphOpenExportTextFallbackPanel(
      label,
      value,
      safeName,
      type,
      formStarted
        ? `${label} download was sent to the browser. If no .${ext} file appears, use the backup options below.`
        : (localStarted ? `Local ${label} download started. If no .${ext} file appears, use the backup options below.` : `${label} automatic download was blocked. Use the backup options below.`)
    );

    // Still create a server-backed GET link where possible, but do not depend on it for the main click.
    try {
      const data = await rwphCreateServerExportFile(safeName, value, type, ext);
      const downloadUrl = data.downloadUrl || "";
      const inlineUrl = data.inlineUrl || (downloadUrl ? String(downloadUrl) + "?inline=1" : "");
      if (downloadUrl) {
        const boxPanel = document.getElementById("rwph-export-text-panel") || panel;
        const actions = boxPanel?.querySelector?.("#rwph-export-text-actions");
        if (actions && !actions.querySelector("[data-rwph-server-download]")) {
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = data.filename || safeName;
          a.target = "_self";
          a.textContent = `Server Download .${ext} File`;
          a.setAttribute("data-rwph-server-download", "1");
          actions.insertBefore(a, actions.firstChild || null);
          if (inlineUrl) {
            const open = document.createElement("a");
            open.href = inlineUrl;
            open.target = "_self";
            open.textContent = `Open ${label} in this tab`;
            actions.insertBefore(open, a.nextSibling);
          }
        }
      }
    } catch (e) {
      console.warn("RWPH server export link could not be created:", e);
    }

    return !!(formStarted || localStarted || panel);
  }


  function rwphHandleResultsHtmlDownloadMessage(event) {
    try {
      const data = event && event.data;
      if (!data || data.rwphType !== "rwph-results-html-download-request") return;
      const filename = rwphSafeDownloadFilename(data.filename || "rwph-results-page.html");
      const html = String(data.html || "");
      if (!html) return;
      const ok = rwphDownloadTextFileStrong(filename, html, "text/html;charset=utf-8");
      try {
        event.source && event.source.postMessage({
          rwphType: "rwph-results-html-download-ack",
          requestId: data.requestId || "",
          ok: !!ok,
        }, "*");
      } catch (_) {}
      if (ok) rwphShowToast(`Export HTML download started: ${filename}`, "info", 30000, "RWPH Export");
      else rwphShowToast("Export HTML could not start automatically. Use the fallback HTML box and save the code as an .html file.", "warn", 30000, "RWPH Export");
    } catch (e) {
      console.warn("RWPH parent export download handler failed:", e);
    }
  }


  function rwphHandleResultsPaymentsNavigateMessage(event) {
    try {
      const data = event && event.data;
      if (!data || data.rwphType !== "rwph-results-open-payments-request") return;
      const rows = Array.isArray(data.rows) ? data.rows : [];
      if (!rows.length) return;
      rwphStorePayAllRows(rows);
      const html = String(data.html || "");
      if (html && html.length > 1000) rwphStoreRecentPayAllReport(html, data.filename || "rwph-results-report.html");
      else rwphStoreRecentPayAllReportFromRows(rows, data.summary || lastSummary || {});
      try {
        event.source && event.source.postMessage({ rwphType: "rwph-results-open-payments-ack", requestId: data.requestId || "", ok: true }, "*");
      } catch (_) {}
      rwphQueueCrossTabPopup("payments", "Payments opened in the current Torn tab on the faction vault/controls page. Use the copy-only panel there.", "info", "RWPH Payments");
      try { closePanel(); } catch (_) {}
      try { rwphCloseAllPanelsExceptPayAll(); } catch (_) {}
      const url = rwphFactionControlsPayAllUrl();
      try { window.location.assign(url); } catch (_) { window.location.href = url; }
    } catch (e) {
      console.warn("RWPH parent Payments navigation handler failed:", e);
    }
  }

  try {
    if (!window.__rwphResultsHtmlDownloadBridgeReady) {
      window.__rwphResultsHtmlDownloadBridgeReady = true;
      window.addEventListener("message", rwphHandleResultsHtmlDownloadMessage, false);
      window.addEventListener("message", rwphHandleResultsPaymentsNavigateMessage, false);
    }
  } catch (_) {}

  function buildFullscreenResultsHtml(rows, summary) {
    const pointsMode = !!(summary?.pointsMode || summary?.calculationMode === "points");
    const list = (rows || []).map((r, index) => ({
      rank: index + 1,
      id: String(r.id || "unknown"),
      name: r.name || `Unknown ${r.id || "unknown"}`,
      attacks: Number(r.warHits ?? r.attacks ?? 0),
      warHits: Number(r.warHits ?? r.attacks ?? 0),
      assists: Number(r.assists || 0),
      outsideHits: Number(r.outsideHits || 0),
      retaliationHits: Number(r.retaliationHits || 0),
      chainMaintenanceHits: Number(r.chainMaintenanceHits || 0),
      hospitalizingHits: Number(r.hospitalizingHits || 0),
      enemyFactionHospitalizingHits: Number(r.enemyFactionHospitalizingHits || 0),
      weight: Number(r.weight || 0),
      points: Number(r.points ?? r.weight ?? 0),
      basePoints: Number(r.basePoints || 0),
      hospitalBonusPoints: Number(r.hospitalBonusPoints || 0),
      enemyFactionHospitalBonusPoints: Number(r.enemyFactionHospitalBonusPoints || 0),
      fairFightBonusPoints: Number(r.fairFightBonusPoints || 0),
      fairFightPerPayableHitBonus: Number(r.fairFightPerPayableHitBonus || 0),
      avgFairFight: Number(r.avgFairFight || 1),
      bestFairFight: Number(r.bestFairFight || 1),
      totalRespect: Number(r.totalRespect ?? r.respect ?? 0),
      respect: Number(r.respect || 0),
      payout: Number(r.payout || 0),
      payoutAmount: Number(r.payout || 0),
      paymentAmount: Number(r.payout || 0),
      memberPayment: Number(r.payout || 0),
      amount: Number(r.payout || 0),
      totalTrackedHits: Number(r.totalTrackedHits || 0),
      payableEvents: Number(r.payableEvents || 0),
    }));

    const memberPayout = rwphSummaryMemberPayout(summary, list);
    const overallTotalPayout = rwphSummaryOverallTotalPayout(summary, list);
    const perHitAmount = rwphSummaryPerHitAmount(summary, list);
    const perPointAmount = pointsMode ? rwphSummaryPerHitAmount(summary, list) : 0;
    const includeLeftFactionMembers = false;
    const removedLeftFactionHits = Number(summary?.removedLeftFactionHits ?? summary?.calcMeta?.removedLeftFactionHits ?? summary?.calcMeta?.manualExcludedMembersHits ?? 0);
    const totalPayout = memberPayout;
    const rowsJson = JSON.stringify(list).replaceAll("<", "\\u003c");
    const summaryJson = JSON.stringify(summary || {}).replaceAll("<", "\\u003c");
    const csvText = buildPayoutCsvText(list, summary || {});
    const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`;
    const payAllHref = rwphFactionControlsPayAllUrl();

    const rwphNewsletterThemes = {
      gold: { title: "Newsletter", panelA:"#1b1208", panelB:"#111827", head:"#2a1609", outer:"#120905", line:"#b88759", cardLine:"#5b3418", accent:"#ffd37a", text:"#fff7ed", muted:"#cfaa8e", good:"#86efac" },
      blue: { title: "Newsletter Blue", panelA:"#0f172a", panelB:"#082f49", head:"#0c4a6e", outer:"#020617", line:"#38bdf8", cardLine:"#075985", accent:"#7dd3fc", text:"#f0f9ff", muted:"#bae6fd", good:"#86efac" },
      green: { title: "Newsletter Green", panelA:"#102016", panelB:"#052e16", head:"#14532d", outer:"#020f08", line:"#22c55e", cardLine:"#166534", accent:"#86efac", text:"#f0fdf4", muted:"#bbf7d0", good:"#facc15" },
      purple: { title: "Newsletter Purple", panelA:"#1e1233", panelB:"#2e1065", head:"#4c1d95", outer:"#0b0616", line:"#a78bfa", cardLine:"#6d28d9", accent:"#c4b5fd", text:"#faf5ff", muted:"#ddd6fe", good:"#86efac" },
      crimson: { title: "Newsletter Crimson", panelA:"#2a0a0a", panelB:"#450a0a", head:"#7f1d1d", outer:"#160606", line:"#f87171", cardLine:"#991b1b", accent:"#fecaca", text:"#fff1f2", muted:"#fca5a5", good:"#86efac" },
      neon: { title: "Newsletter Neon", panelA:"#07111f", panelB:"#111827", head:"#0f172a", outer:"#020617", line:"#22d3ee", cardLine:"#0e7490", accent:"#67e8f9", text:"#ecfeff", muted:"#a5f3fc", good:"#f0abfc" },
      ice: { title: "Newsletter Ice", panelA:"#ecfeff", panelB:"#cffafe", head:"#0891b2", outer:"#f0fdfa", line:"#06b6d4", cardLine:"#67e8f9", accent:"#155e75", text:"#083344", muted:"#0e7490", good:"#047857" },
      sunset: { title: "Newsletter Sunset", panelA:"#431407", panelB:"#7c2d12", head:"#9a3412", outer:"#1c0a04", line:"#fb923c", cardLine:"#c2410c", accent:"#fed7aa", text:"#fff7ed", muted:"#fdba74", good:"#bbf7d0" },
      toxic: { title: "Newsletter Toxic", panelA:"#172105", panelB:"#365314", head:"#4d7c0f", outer:"#080d03", line:"#a3e635", cardLine:"#65a30d", accent:"#d9f99d", text:"#f7fee7", muted:"#bef264", good:"#67e8f9" },
      steel: { title: "Newsletter Steel", panelA:"#111827", panelB:"#374151", head:"#4b5563", outer:"#030712", line:"#9ca3af", cardLine:"#6b7280", accent:"#e5e7eb", text:"#f9fafb", muted:"#d1d5db", good:"#86efac" },
      candy: { title: "Newsletter Candy", panelA:"#500724", panelB:"#831843", head:"#be185d", outer:"#19020b", line:"#f9a8d4", cardLine:"#db2777", accent:"#fbcfe8", text:"#fff1f2", muted:"#f9a8d4", good:"#bbf7d0" },
      ocean: { title: "Newsletter Ocean", panelA:"#06283d", panelB:"#075985", head:"#0369a1", outer:"#031724", line:"#38bdf8", cardLine:"#0284c7", accent:"#bae6fd", text:"#f0f9ff", muted:"#7dd3fc", good:"#86efac" },
      fire: { title: "Newsletter Fire", panelA:"#3b0a03", panelB:"#7f1d1d", head:"#b91c1c", outer:"#160404", line:"#f97316", cardLine:"#dc2626", accent:"#fed7aa", text:"#fff7ed", muted:"#fdba74", good:"#fef08a" },
      forest: { title: "Newsletter Forest", panelA:"#052e16", panelB:"#064e3b", head:"#065f46", outer:"#02170b", line:"#34d399", cardLine:"#047857", accent:"#a7f3d0", text:"#ecfdf5", muted:"#6ee7b7", good:"#fde68a" },
      royal: { title: "Newsletter Royal", panelA:"#1e1b4b", panelB:"#312e81", head:"#4338ca", outer:"#0b1026", line:"#818cf8", cardLine:"#4f46e5", accent:"#c7d2fe", text:"#eef2ff", muted:"#a5b4fc", good:"#fcd34d" },
      ghost: { title: "Newsletter Ghost", panelA:"#f8fafc", panelB:"#e2e8f0", head:"#94a3b8", outer:"#ffffff", line:"#64748b", cardLine:"#cbd5e1", accent:"#0f172a", text:"#020617", muted:"#334155", good:"#166534" },
      rose: { title: "Newsletter Rose", panelA:"#2d0714", panelB:"#4c0519", head:"#9f1239", outer:"#17030a", line:"#fb7185", cardLine:"#be123c", accent:"#fecdd3", text:"#fff1f2", muted:"#fda4af", good:"#86efac" },
    };

    function rwphBuildCompactThemedNewsletterHtmlStatic(options = {}) {
      const sourceRows = Array.isArray(list) ? list : [];
      const maxRows = 120;
      const themeKey = String(options?.theme || "gold").toLowerCase();
      const theme = rwphNewsletterThemes[themeKey] || rwphNewsletterThemes.gold;
      const shownRows = sourceRows.slice(0, maxRows);
      const s = summary || {};
      const isPoints = !!(s.pointsMode || s.calculationMode === "points");
      const title = String(s.factionName || s.newsletterTitle || "Ranked War Payout Results");
      const mode = isPoints ? "Advanced" : "Basic";
      const totalPaid = sourceRows.reduce((sum, r) => sum + Number(r.payout || 0), 0);
      const shownPaid = shownRows.reduce((sum, r) => sum + Number(r.payout || 0), 0);
      const totalRespect = Number(s.totalRespect || sourceRows.reduce((sum, r) => sum + Number(r.totalRespect || r.respect || 0), 0));
      const totalPayable = Number(s.totalPayableEvents || sourceRows.reduce((sum, r) => sum + Number(r.payableEvents || 0), 0));
      let perUnit = Number(isPoints ? (s.perPointAmount || s.perHitAmount || s.payPerPoint || 0) : (s.perHitAmount || s.payPerHit || 0));
      if (!perUnit) {
        const units = sourceRows.reduce((sum, r) => sum + Number(isPoints ? (r.points || r.weight || 0) : (r.payableEvents || r.weight || r.warHits || r.attacks || 0)), 0);
        perUnit = units ? totalPaid / units : 0;
      }
      const stat = (label, value, bg) => `<td width="50%" bgcolor="${bg}" align="center" style="border:1px solid ${theme.line};padding:3px;color:${theme.text};word-break:break-word"><b style="color:${theme.accent}">${esc(label)}</b><br>${esc(value)}</td>`;
      const memberCell = (r, index, bg) => {
        const metric = isPoints ? Number(r.points || r.weight || 0).toFixed(1) : String(Number(r.payableEvents || r.weight || r.warHits || r.attacks || 0));
        return `<td width="50%" bgcolor="${bg}" align="center" style="border:1px solid ${theme.cardLine};padding:3px;color:${theme.text};word-break:break-word;vertical-align:top"><b style="color:${theme.accent}">#${index + 1}</b> <b>${esc(String(r.name || ("Unknown " + (r.id || ""))).replace(/\s+/g, " ").trim())}</b><br><span style="color:${theme.muted}">${isPoints ? "Pts " : "Hits "}${esc(metric)}</span><br><b style="color:${theme.good}">${esc(money(r.payout || 0))}</b></td>`;
      };
      let html = "";
      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${theme.outer};color:${theme.text};font:10px Arial,Helvetica,sans-serif">`;
      html += `<tr><td colspan="2" bgcolor="${theme.head}" align="center" style="border:1px solid ${theme.line};padding:6px;color:${theme.text}"><div style="font-size:14px;font-weight:bold;color:${theme.accent}">${esc(title)}</div><div style="font-size:9px;color:${theme.muted}">${esc(mode)} payout newsletter • ${esc(theme.title)} • compact 120-card layout</div></td></tr>`;
      html += `<tr>${stat("Total Payout", money(totalPaid), theme.panelA)}${stat(isPoints ? "Per Point" : "Per Hit", money(perUnit), theme.panelB)}</tr>`;
      html += `<tr>${stat("Payable Hits", String(totalPayable || 0), theme.panelB)}${stat("Total Respect", Number(totalRespect || 0).toFixed(2), theme.panelA)}</tr>`;
      html += `<tr>${stat("Members Shown", String(shownRows.length) + (sourceRows.length > maxRows ? " / " + sourceRows.length : ""), theme.panelA)}${stat("Shown Payout", money(shownPaid), theme.panelB)}</tr>`;
      html += `<tr><td colspan="2" bgcolor="${theme.head}" align="center" style="border:1px solid ${theme.line};padding:4px;color:${theme.accent};font-weight:bold">Payout Cards</td></tr>`;
      for (let i = 0; i < shownRows.length; i += 2) {
        html += "<tr>";
        html += memberCell(shownRows[i], i, i % 4 === 0 ? theme.panelA : theme.panelB);
        if (shownRows[i + 1]) {
          html += memberCell(shownRows[i + 1], i + 1, i % 4 === 0 ? theme.panelB : theme.panelA);
        } else {
          html += `<td width="50%" bgcolor="${theme.outer}" style="border:1px solid ${theme.cardLine};padding:3px">&nbsp;</td>`;
        }
        html += "</tr>";
      }
      if (!shownRows.length) {
        html += `<tr><td colspan="2" align="center" bgcolor="${theme.panelA}" style="border:1px solid ${theme.cardLine};padding:8px;color:${theme.accent}">No payout rows found.</td></tr>`;
      }
      if (sourceRows.length > maxRows) {
        html += `<tr><td colspan="2" align="center" bgcolor="${theme.head}" style="border:1px solid ${theme.line};padding:4px;color:${theme.muted}">Only the first 120 rows are included so the Torn faction newsletter stays short enough to post.</td></tr>`;
      }
      html += `<tr><td colspan="2" align="center" bgcolor="${theme.outer}" style="border:1px solid ${theme.cardLine};padding:4px;color:${theme.muted}">Generated by Ranked War Payout Helper. Review payouts before sending funds.</td></tr>`;
      html += "</table>";
      return html.replace(/>\s+</g, "><").trim();
    }

    const rwphNewsletterVariants = [
      { key: "gold", panelId: "rwph-results-html-panel-gold", buttonId: "resultsHtmlPanelGoldBtn", label: "Newsletter", prefix: "rwph-newsletter-gold" },
      { key: "blue", panelId: "rwph-results-html-panel-blue", buttonId: "resultsHtmlPanelBlueBtn", label: "Newsletter Blue", prefix: "rwph-newsletter-blue" },
      { key: "green", panelId: "rwph-results-html-panel-green", buttonId: "resultsHtmlPanelGreenBtn", label: "Newsletter Green", prefix: "rwph-newsletter-green" },
      { key: "purple", panelId: "rwph-results-html-panel-purple", buttonId: "resultsHtmlPanelPurpleBtn", label: "Newsletter Purple", prefix: "rwph-newsletter-purple" },
      { key: "crimson", panelId: "rwph-results-html-panel-crimson", buttonId: "resultsHtmlPanelCrimsonBtn", label: "Newsletter Crimson", prefix: "rwph-newsletter-crimson" },
      { key: "neon", panelId: "rwph-results-html-panel-neon", buttonId: "resultsHtmlPanelNeonBtn", label: "Newsletter Neon", prefix: "rwph-newsletter-neon" },
      { key: "ice", panelId: "rwph-results-html-panel-ice", buttonId: "resultsHtmlPanelIceBtn", label: "Newsletter Ice", prefix: "rwph-newsletter-ice" },
      { key: "sunset", panelId: "rwph-results-html-panel-sunset", buttonId: "resultsHtmlPanelSunsetBtn", label: "Newsletter Sunset", prefix: "rwph-newsletter-sunset" },
      { key: "toxic", panelId: "rwph-results-html-panel-toxic", buttonId: "resultsHtmlPanelToxicBtn", label: "Newsletter Toxic", prefix: "rwph-newsletter-toxic" },
      { key: "steel", panelId: "rwph-results-html-panel-steel", buttonId: "resultsHtmlPanelSteelBtn", label: "Newsletter Steel", prefix: "rwph-newsletter-steel" },
      { key: "candy", panelId: "rwph-results-html-panel-candy", buttonId: "resultsHtmlPanelCandyBtn", label: "Newsletter Candy", prefix: "rwph-newsletter-candy" },
      { key: "ocean", panelId: "rwph-results-html-panel-ocean", buttonId: "resultsHtmlPanelOceanBtn", label: "Newsletter Ocean", prefix: "rwph-newsletter-ocean" },
      { key: "fire", panelId: "rwph-results-html-panel-fire", buttonId: "resultsHtmlPanelFireBtn", label: "Newsletter Fire", prefix: "rwph-newsletter-fire" },
      { key: "forest", panelId: "rwph-results-html-panel-forest", buttonId: "resultsHtmlPanelForestBtn", label: "Newsletter Forest", prefix: "rwph-newsletter-forest" },
      { key: "royal", panelId: "rwph-results-html-panel-royal", buttonId: "resultsHtmlPanelRoyalBtn", label: "Newsletter Royal", prefix: "rwph-newsletter-royal" },
      { key: "ghost", panelId: "rwph-results-html-panel-ghost", buttonId: "resultsHtmlPanelGhostBtn", label: "Newsletter Ghost", prefix: "rwph-newsletter-ghost" },
      { key: "rose", panelId: "rwph-results-html-panel-rose", buttonId: "resultsHtmlPanelRoseBtn", label: "Newsletter Rose", prefix: "rwph-newsletter-rose" },
    ].map((variant) => {
      const theme = rwphNewsletterThemes[variant.key] || rwphNewsletterThemes.gold;
      const html = rwphBuildCompactThemedNewsletterHtmlStatic({ theme: variant.key });
      return { ...variant, themeTitle: theme.title, html, length: html.length.toLocaleString() };
    });

    const rwphNewsletterButtonsHtml = `<details class="rwph-newsletter-dropdown">
      <summary class="btn secondary rwph-newsletter-dropdown-summary">Newsletter ▾</summary>
      <div class="rwph-newsletter-dropdown-menu">
        ${rwphNewsletterVariants.map((variant) => `<a class="rwph-newsletter-dropdown-item" id="${esc(variant.buttonId)}" href="#${esc(variant.panelId)}" data-open-results-html-panel="${esc(variant.panelId)}">${esc(variant.label)}</a>`).join("")}
      </div>
    </details>`;
    const rwphNewsletterPanelsHtml = rwphNewsletterVariants.map((variant) => `
    <section class="rwph-results-html-panel" id="${esc(variant.panelId)}" aria-label="${esc(variant.label)} HTML panel">
      <div class="rwph-results-html-head">
        <div>
          <div class="rwph-results-html-title">${esc(variant.label)} HTML</div>
          <div class="rwph-results-html-note">${esc(variant.themeTitle)} theme. Preview is shown below. Right-click inside the HTML box, choose Select All, then Copy. Generated size: ${esc(variant.length)} characters.</div>
        </div>
        <a class="rwph-results-html-close" href="#" title="Close">×</a>
      </div>
      <div class="rwph-results-html-status">${esc(variant.label)} preview ready. ${esc(variant.length)} characters.</div>
      <div class="rwph-results-html-preview-wrap">
        <div class="rwph-results-html-preview-title">Preview</div>
        <div class="rwph-results-html-preview">${variant.html}</div>
      </div>
      <div class="rwph-results-html-preview-title">Raw HTML</div>
      <div class="rwph-raw-html-copy-note">
        On PC triple click on the raw code to select all and press Ctrl+C to copy. On Phone/PDA hold click on the raw code click Select All then click Copy then paste it in the source code in your faction newsletter tab.
      </div>
      <textarea class="rwph-results-html-box" id="${esc(variant.panelId)}-box" data-rwph-raw-html-box="1" readonly spellcheck="false" aria-label="${esc(variant.label)} raw HTML code" onclick="try{if(event && event.detail >= 3){this.focus();this.select();this.setSelectionRange(0,this.value.length)}}catch(e){}" ondblclick="try{this.focus();this.select();this.setSelectionRange(0,this.value.length)}catch(e){}" oncontextmenu="this.focus();">${esc(variant.html)}</textarea>
    </section>`).join("");

    const cards = list.map((r) => {
      const mainMetricLabel = pointsMode ? "Points" : "Weight";
      const mainMetricValue = pointsMode ? r.points.toFixed(2) : r.weight.toFixed(2);
      const secondaryMetricLabel = pointsMode ? "Payable Hits" : "Payable";
      const secondaryMetricValue = Number(r.payableEvents || 0);
      return `
      <article class="result-card ${pointsMode ? "result-card-points" : "result-card-per-hit"}">
        <div class="result-card-head">
          <div class="result-rank-pill">#${esc(r.rank)}</div>
          <div class="result-player">
            <div class="result-name">${esc(r.name)}</div>
            <div class="result-id">Torn ID: ${esc(r.id)}</div>
          </div>
          <div class="result-payout-block">
            <span>Payout</span>
            <b class="payout">${esc(money(r.payout))}</b>
          </div>
        </div>
        <div class="result-quick-row">
          <div class="result-highlight"><span>${mainMetricLabel}</span><b>${mainMetricValue}</b></div>
          <div class="result-highlight"><span>${secondaryMetricLabel}</span><b>${secondaryMetricValue}</b></div>
        </div>
        <div class="stats">
          <div><span>War</span><b>${r.warHits}</b></div>
          <div><span>Assists</span><b>${r.assists}</b></div>
          <div><span>Outside</span><b>${r.outsideHits}</b></div>
          <div><span>Retals</span><b>${r.retaliationHits}</b></div>
          ${pointsMode ? `<div><span>Own Hosp</span><b>${r.hospitalizingHits}</b></div>
          <div><span>Enemy Hosp</span><b>${r.enemyFactionHospitalizingHits}</b></div>
          <div><span>Base</span><b>${r.basePoints.toFixed(2)}</b></div>
          <div><span>Fair Bonus</span><b>${r.fairFightBonusPoints.toFixed(2)}</b></div>
          <div><span>FF / Hit</span><b>${r.fairFightPerPayableHitBonus.toFixed(2)}</b></div>
          <div><span>Own Bonus</span><b>${r.hospitalBonusPoints.toFixed(2)}</b></div>
          <div><span>Enemy Bonus</span><b>${r.enemyFactionHospitalBonusPoints.toFixed(2)}</b></div>
          <div><span>Avg FF</span><b>${r.avgFairFight.toFixed(2)}x</b></div>` : `<div><span>Tracked</span><b>${r.totalTrackedHits}</b></div>
          <div><span>Payable</span><b>${r.payableEvents}</b></div>
          <div><span>Respect</span><b>${r.respect.toFixed(2)}</b></div>`}
        </div>
      </article>`;
    }).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pointsMode ? "RWPH Points System Results" : "RWPH Per Hit Results"}</title>
  <style>
    :root {
      --bg:#020617;
      --panel:#0f172a;
      --panel2:#111827;
      --line:rgba(251,191,36,.24);
      --text:#f8fafc;
      --muted:#a5b4fc;
      --blue:#f59e0b;
      --indigo:#6366f1;
      --green:#86efac;
    }
    * { box-sizing:border-box; }
    ${rwphPanelThemeCss(rwphGetPanelThemePreset(), true)}
    body {
      margin:0;
      min-height:100vh;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      color:var(--text);
      background:
        radial-gradient(circle at 15% 0%, rgba(245,158,11,.22), transparent 26%),
        radial-gradient(circle at 88% 0%, rgba(245,158,11,.20), transparent 28%),
        linear-gradient(180deg, #020617, #0f172a 42%, #020617);
      padding:18px;
    }
    .app { max-width:1320px; margin:0 auto; }
    .hero {
      position:sticky;
      top:0;
      z-index:10;
      padding:14px;
      margin-bottom:14px;
      border:1px solid var(--line);
      border-radius:20px;
      background:linear-gradient(180deg, rgba(15,23,42,.96), rgba(15,23,42,.86));
      box-shadow:0 20px 60px rgba(0,0,0,.48), 0 0 24px rgba(245,158,11,.10);
      backdrop-filter: blur(14px);
    }
    .title { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .title img { width:34px; height:34px; object-fit:contain; filter:drop-shadow(0 0 10px rgba(245,158,11,.35)); }
    h1 { font-size:22px; margin:0; letter-spacing:.3px; }
    .toolbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    .btn {
      display:inline-block;
      text-decoration:none;
      border:1px solid rgba(251,191,36,.32);
      background:linear-gradient(135deg, rgba(14,165,233,.96), rgba(79,70,229,.92));
      color:#fff7ed;
      font-weight:900;
      padding:10px 12px;
      border-radius:12px;
      cursor:pointer;
      box-shadow:0 10px 22px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.12);
    }
    .btn.secondary { background:linear-gradient(135deg, rgba(30,41,59,.96), rgba(49,46,129,.88)); }
    .summary {
      display:grid;
      grid-template-columns:repeat(7, minmax(0, 1fr));
      gap:10px;
      margin-bottom:14px;
    }
    .summary-card, .result-card {
      border:1px solid var(--line);
      border-radius:18px;
      background:linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.82));
      box-shadow:0 14px 34px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.05);
    }
    .summary-card { padding:12px; }
    .summary-card span, .result-id, .stats span { color:var(--muted); font-size:11px; text-transform:uppercase; font-weight:800; letter-spacing:.5px; }
    .summary-card b { display:block; margin-top:3px; font-size:18px; color:#fff2dd; }
    .grid {
      display:grid;
      grid-template-columns:repeat(auto-fill, minmax(285px, 1fr));
      gap:12px;
    }
    .result-card { padding:12px; }
    .result-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
    .result-name { font-weight:950; color:#f8fafc; }
    .payout { font-size:18px; color:var(--green); font-weight:950; white-space:nowrap; }
    .stats { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:7px; margin:10px 0; }
    .stats div { padding:8px; border-radius:12px; background:rgba(15,23,42,.72); border:1px solid rgba(251,191,36,.12); }
    .stats b { display:block; color:#fff; margin-top:2px; }
    /* v1.1.67 center fullscreen results content */
    body, .app, .hero, .summary-card, .result-card, .result-name, .result-id, .payout, .stats div { text-align:center; }
    .title, .toolbar, .result-top { justify-content:center; align-items:center; text-align:center; }
    .result-top { flex-direction:column; }
    .summary-card b, .stats b { text-align:center; }
    .pay-all-panel {
      position:fixed;
      z-index:9999;
      inset:76px 16px auto auto;
      width:min(560px, calc(100vw - 32px));
      max-height:calc(100vh - 100px);
      overflow:hidden;
      display:flex;
      flex-direction:column;
      padding:14px;
      border:1px solid rgba(251,191,36,.28);
      border-radius:20px;
      background:radial-gradient(circle at 18% 0%, rgba(245,158,11,.20), transparent 34%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96));
      box-shadow:0 20px 60px rgba(0,0,0,.58), 0 0 28px rgba(245,158,11,.12);
      backdrop-filter:blur(14px);
      text-align:center;
    }
    .pay-all-panel[hidden] { display:none !important; }
    .pay-all-panel h2 { margin:0 0 6px; font-size:18px; color:#fff2dd; }
    .pay-all-head { cursor:move; touch-action:none; -webkit-user-select:none; user-select:none; padding:2px 34px 6px; position:sticky; top:0; z-index:5; flex:0 0 auto; }
    .resize-handle { position:absolute; width:20px; height:20px; z-index:8; touch-action:none; -webkit-user-select:none; user-select:none; opacity:.95; background:rgba(2,6,23,.18); }
    .resize-handle-se { right:7px; bottom:7px; cursor:nwse-resize; border-right:2px solid rgba(251,191,36,.80); border-bottom:2px solid rgba(251,191,36,.80); border-radius:0 0 8px 0; }
    .resize-handle-sw { left:7px; bottom:7px; cursor:nesw-resize; border-left:2px solid rgba(251,191,36,.80); border-bottom:2px solid rgba(251,191,36,.80); border-radius:0 0 0 8px; }
    .resize-handle-nw { left:7px; top:7px; cursor:nwse-resize; border-left:2px solid rgba(251,191,36,.80); border-top:2px solid rgba(251,191,36,.80); border-radius:8px 0 0 0; }
    .pay-all-note { margin:0 26px 10px; color:#c7d2fe; font-size:12px; line-height:1.45; }
    .pay-all-info { margin:0 18px 12px; padding:10px 12px; border-radius:14px; border:1px solid rgba(251,191,36,.18); background:rgba(15,23,42,.66); color:#fff2dd; font-size:11px; line-height:1.45; text-align:left; }
    .pay-all-info b { color:#fff2dd; }
    .pay-all-info ul { margin:6px 0 0 16px; padding:0; }
    .pay-all-info li { margin:3px 0; }
    .pay-all-close { position:absolute!important; top:10px!important; right:12px!important; width:36px!important; height:36px!important; min-width:36px!important; min-height:36px!important; padding:0!important; display:grid!important; place-items:center!important; border-radius:14px!important; border:1px solid rgba(251,191,36,.24)!important; border-left:4px solid rgba(245,158,11,.66)!important; background:linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88))!important; color:#fff7ed!important; font:950 20px/1 Arial,Helvetica,sans-serif!important; box-shadow:0 1px 0 rgba(255,255,255,.045) inset,0 12px 26px rgba(0,0,0,.26)!important; text-shadow:0 1px 0 rgba(0,0,0,.75)!important; cursor:pointer!important; z-index:120!important; }
    .pay-all-reopen-report { position:absolute!important; top:10px!important; right:54px!important; min-height:36px!important; padding:0 10px!important; border-radius:14px!important; z-index:120!important; font-size:11px!important; white-space:nowrap!important; }
    .pay-all-undo { margin:0 0 10px; padding:7px 10px; font-size:11px; border-radius:10px; }
    .pay-all-list { display:grid; gap:8px; overflow-y:auto; overflow-x:hidden; min-height:0; flex:1 1 auto; padding-right:3px; scrollbar-width:thin; scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36); }
    .pay-all-list::-webkit-scrollbar { width:8px; height:8px; }
    .pay-all-list::-webkit-scrollbar-track { background:rgba(15,23,42,.34); border-radius:999px; }
    .pay-all-list::-webkit-scrollbar-thumb { background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.88)); border:2px solid rgba(15,23,42,.50); border-radius:999px; }
    .pay-all-row {
      display:grid;
      grid-template-columns:minmax(0, 1fr) auto auto;
      gap:7px;
      align-items:center;
      padding:9px;
      border-radius:14px;
      border:1px solid rgba(251,191,36,.16);
      background:rgba(15,23,42,.72);
    }
    .pay-all-member {
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      font-size:12px;
      font-weight:900;
      color:#f8fafc;
    }
    .pay-all-payout { display:block; margin-top:2px; color:#86efac; font-weight:950; }
    .copy-small { padding:7px 8px; font-size:11px; border-radius:10px; }
    .copy-small.rwph-pay-button-hidden { display:none !important; visibility:hidden !important; pointer-events:none !important; }
    .grid { justify-items:stretch; }
    .resize-handle-ne { display:none!important; pointer-events:none!important; }
    @media (max-width: 760px), (pointer: coarse) {
      .pay-all-head { min-height:42px!important; padding-top:8px!important; padding-bottom:8px!important; touch-action:none!important; cursor:grab!important; }
      .resize-handle { width:30px!important; height:30px!important; z-index:60!important; background:rgba(2,6,23,.28)!important; }
      .resize-handle-se { right:3px!important; bottom:3px!important; border-width:3px!important; }
      .resize-handle-sw { left:3px!important; bottom:3px!important; border-width:3px!important; }
      .resize-handle-nw { left:3px!important; top:3px!important; border-width:3px!important; }
    }

    /* v1.1.97 fullscreen results layout refresh */
    .app {
      display:grid;
      grid-template-columns: 290px minmax(0,1fr);
      grid-template-areas: "hero summary" "hero results";
      gap:16px;
      align-items:start;
    }
    .hero {
      grid-area: hero;
      position: sticky;
      top: 18px;
      min-height: calc(100vh - 36px);
      max-height: calc(100vh - 36px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 14px;
      border-radius: 28px;
      background:
        radial-gradient(circle at 50% 0%, rgba(245,158,11,.22), transparent 35%),
        linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.88));
    }
    .title { flex-direction: column; text-align:center; }
    .title img { width:64px; height:64px; }













    @media (max-width:760px){



}
    .close-hint { margin:0; padding:9px 10px; border-radius:12px; border:1px solid rgba(251,191,36,.16); background:rgba(15,23,42,.58); color:#cfaa8e; font-size:11px; font-weight:800; line-height:1.35; text-align:center; }
    .results-action-zone { display:grid; gap:8px; margin:10px 0 0; padding-top:12px; border-top:1px solid rgba(251,191,36,.18); }
    .results-action-zone .btn { width:100%; }
    .results-action-note { margin:0; color:#c8c8c8; font-size:11px; font-weight:800; line-height:1.35; }
    .rwph-newsletter-dropdown{width:100%;box-sizing:border-box;border-radius:14px;}
    .rwph-newsletter-dropdown-summary{list-style:none;cursor:pointer;user-select:none;display:block;box-sizing:border-box;}
    .rwph-newsletter-dropdown-summary::-webkit-details-marker{display:none;}
    .rwph-newsletter-dropdown-menu{display:grid;gap:7px;margin-top:7px;padding:8px;border:1px solid rgba(251,191,36,.22);border-radius:14px;background:rgba(2,6,23,.68);box-shadow:inset 0 1px 0 rgba(255,255,255,.04);max-height:320px;overflow:auto;}
    .rwph-newsletter-dropdown-item{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none!important;color:#fff7ed!important;border:1px solid rgba(251,191,36,.24);border-left:4px solid rgba(245,158,11,.62);border-radius:12px;padding:9px 10px;background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88));font:900 11px/1.2 Arial,Helvetica,sans-serif;box-shadow:0 10px 22px rgba(0,0,0,.22);}
    .rwph-newsletter-dropdown-item:hover{filter:brightness(1.12);transform:translateY(-1px);}
    .rwph-newsletter-dropdown[open] .rwph-newsletter-dropdown-summary{border-color:rgba(251,191,36,.45);box-shadow:0 0 0 2px rgba(245,158,11,.10) inset;}
    .rwph-results-html-panel{position:fixed;z-index:2147483646;left:50%;top:50%;transform:translate(-50%,-50%);width:min(900px,calc(100vw - 22px));height:min(820px,calc(100vh - 22px));display:none;flex-direction:column;gap:10px;padding:12px;box-sizing:border-box;border-radius:20px;border:1px solid rgba(251,191,36,.45);background:linear-gradient(180deg,rgba(15,23,42,.99),rgba(2,6,23,.98));box-shadow:0 28px 90px rgba(0,0,0,.78),0 0 45px rgba(245,158,11,.16);color:#fff2dd;font-family:Arial,Helvetica,sans-serif;}
    .rwph-results-html-panel:target{display:flex!important;visibility:visible!important;opacity:1!important;}
    .rwph-results-html-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border:1px solid rgba(251,191,36,.22);border-radius:16px;background:linear-gradient(135deg,rgba(30,41,59,.94),rgba(8,47,73,.70));}
    .rwph-results-html-title{font:950 15px/1.15 Arial,Helvetica,sans-serif;letter-spacing:.35px;text-transform:uppercase;color:#f8fafc;}
    .rwph-results-html-note{font:800 11px/1.35 Arial,Helvetica,sans-serif;color:#fde68a;margin-top:3px;}
    .rwph-results-html-close{min-width:42px;width:42px;height:42px;display:grid;place-items:center;text-decoration:none!important;border:1px solid rgba(251,191,36,.3);border-left:4px solid rgba(245,158,11,.66);border-radius:14px;background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88));color:#fff7ed!important;font:950 22px/1 Arial,Helvetica,sans-serif;cursor:pointer;}
    .rwph-export-html-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;}
    .rwph-export-html-actions a{display:grid;place-items:center;text-decoration:none!important;color:#fff7ed!important;border:1px solid rgba(251,191,36,.30);border-left:4px solid rgba(245,158,11,.72);border-radius:14px;background:linear-gradient(180deg,rgba(30,41,59,.96),rgba(2,6,23,.90));font:950 12px/1.15 Arial,Helvetica,sans-serif;padding:11px 10px;min-height:42px;box-shadow:0 10px 22px rgba(0,0,0,.22);}
    .rwph-export-html-actions a:hover{filter:brightness(1.12);transform:translateY(-1px);}
    .rwph-results-html-box{flex:1 1 auto;min-height:120px;width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(251,191,36,.28);background:#020617;color:#f8fafc;padding:10px;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;overflow:auto;resize:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);-webkit-user-select:text!important;user-select:text!important;cursor:text;outline:none;margin:0;text-align:left;-webkit-touch-callout:default!important;touch-action:auto!important;}
    .rwph-results-html-box::selection{background:rgba(251,191,36,.42)!important;color:#fff!important;}
    .rwph-raw-html-copy-note{display:block;margin:0 0 6px 0;padding:8px;border:1px solid rgba(251,191,36,.22);border-radius:13px;background:rgba(2,6,23,.42);box-sizing:border-box;text-align:center;color:#fde68a;font:850 10px/1.35 Arial,Helvetica,sans-serif;}
    .rwph-results-html-status{min-height:18px;text-align:center;color:#fde68a;font:800 11px/1.3 Arial,Helvetica,sans-serif;}
    .rwph-results-html-preview-wrap{flex:0 1 auto;max-height:45%;min-height:120px;overflow:auto;border-radius:14px;border:1px solid rgba(251,191,36,.28);background:#020617;padding:8px;box-sizing:border-box;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);}
    .rwph-results-html-preview-title{color:#fde68a;text-align:center;font:900 11px/1.2 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.25px;margin:0 0 5px;}
    .rwph-results-html-preview{width:100%;max-width:100%;box-sizing:border-box;overflow:auto;background:#020617;border-radius:10px;padding:3px;}
    .rwph-results-html-preview table{max-width:100%!important;}
    @media (max-width:760px){.rwph-results-html-panel{width:calc(100vw - 12px);height:calc(100vh - 12px);padding:8px}.rwph-results-html-preview-wrap{max-height:42%;min-height:100px}.rwph-export-html-actions{grid-template-columns:1fr}.rwph-results-html-box{font-size:11px;}}

    /* v1.1.386 unified RWPH panel palette for results/newsletter page */
    :root{
      --rwph-theme-bg:#130b07;
      --rwph-theme-panel:#211714;
      --rwph-theme-panel2:#2b1d18;
      --rwph-theme-panel3:#3a241c;
      --rwph-theme-line:rgba(184,136,89,.42);
      --rwph-theme-line2:rgba(251,191,36,.34);
      --rwph-theme-text:#fff2dd;
      --rwph-theme-soft:#cfaa8e;
      --rwph-theme-gold:#fbbf24;
      --rwph-theme-orange:#f97316;
    }
    body{
      background:
        radial-gradient(circle at 18% 0%, rgba(251,191,36,.12), transparent 34%),
        radial-gradient(circle at 86% 8%, rgba(249,115,22,.10), transparent 32%),
        linear-gradient(180deg,#130b07,#070402) !important;
      color:var(--rwph-theme-text) !important;
    }
    .topbar,.side,.summary-card,.result-card,.pay-all-panel,.rwph-results-html-panel{
      background:
        radial-gradient(circle at 18% 0%, rgba(251,191,36,.13), transparent 32%),
        linear-gradient(180deg, rgba(33,23,20,.98), rgba(11,7,5,.98)) !important;
      border-color:var(--rwph-theme-line) !important;
      color:var(--rwph-theme-text) !important;
      box-shadow:0 18px 55px rgba(0,0,0,.56),0 0 22px rgba(184,136,89,.12) !important;
    }
    .btn,.rwph-newsletter-dropdown-item,.pay-all-btn,.pay-all-close,.pay-all-undo{
      background:linear-gradient(180deg, rgba(58,36,28,.98), rgba(33,23,20,.94)) !important;
      border-color:var(--rwph-theme-line2) !important;
      color:var(--rwph-theme-text) !important;
    }
    .btn:hover,.rwph-newsletter-dropdown-item:hover,.pay-all-btn:hover{
      filter:brightness(1.12) !important;
      border-color:rgba(251,191,36,.58) !important;
    }
    h1,h2,h3,.title-text,.results-side-title,.summary-card span,.result-name,.rwph-results-html-title,.rwph-results-html-preview-title{
      color:var(--rwph-theme-gold) !important;
    }
    .result-id,.sub,.close-hint,.results-action-note,.rwph-results-html-note,.rwph-results-html-status{
      color:var(--rwph-theme-soft) !important;
    }
    textarea,input,select{
      background:rgba(19,11,7,.88) !important;
      border-color:var(--rwph-theme-line) !important;
      color:var(--rwph-theme-text) !important;
    }

    .toolbar { display:grid; grid-template-columns:1fr; width:100%; margin-top:0; }
    .btn { width:100%; text-align:center; }
    .summary { grid-area: summary; grid-template-columns: repeat(4, minmax(0,1fr)); }
    .grid { grid-area: results; grid-template-columns: repeat(auto-fill, minmax(245px,1fr)); }
    .result-card { border-radius:24px; padding:14px; }
    .result-top { display:grid; grid-template-columns:1fr; gap:8px; }
    .payout { justify-self:center; padding:7px 10px; border-radius:999px; background:rgba(134,239,172,.12); border:1px solid rgba(134,239,172,.16); }
    .stats { grid-template-columns: repeat(3,minmax(0,1fr)); }
    @media (max-width: 900px) {
      .app { display:block; }
      .hero { position:static; min-height:0; max-height:none; overflow:visible; }
      .summary { grid-template-columns:repeat(2, minmax(0,1fr)); }
      .toolbar { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width:780px) {
      body { padding:8px; }
      .summary { grid-template-columns:repeat(2, minmax(0, 1fr)); }
      .grid { grid-template-columns:1fr; }
      .hero { position:static; }
      h1 { font-size:18px; }
    }
  
    /* v1.1.102 Torn-style dark/red theme */
    body{background:#121212!important;color:#d7d7d7!important;font-family:Arial,Helvetica,sans-serif!important;}
    body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 16%),repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 1px,transparent 1px 28px)!important;}
    header,.hero,.titlebar{background:linear-gradient(180deg,#303030,#202020)!important;border-color:#454545!important;border-bottom:3px solid #7b1f1f!important;}
    h1,h2,h3,.title,.member-name,.value,.payout,strong,b{color:#f2f2f2!important;text-shadow:0 1px 0 #000!important;}
    p,.muted,.label,td,li,span{color:#c8c8c8!important;}
    .btn,button,a.btn{background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88))!important;color:#fff7ed!important;border:1px solid rgba(251,191,36,.24)!important;border-left:4px solid rgba(245,158,11,.66)!important;border-radius:7px!important;box-shadow:0 1px 0 rgba(255,255,255,.045) inset,0 12px 26px rgba(0,0,0,.26)!important;text-shadow:0 1px 0 rgba(0,0,0,.75)!important;}
    .btn:hover,button:hover,a.btn:hover{filter:brightness(1.08)!important;}
    .btn.secondary,button.secondary,a.secondary{background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88))!important;color:#fff7ed!important;border-color:rgba(251,191,36,.24)!important;}
    th{background:linear-gradient(180deg,#333,#242424)!important;color:#eee!important;border-color:#474747!important;}td,table{border-color:#373737!important;}.bar,.fill,.bar-fill{background:linear-gradient(90deg,#8f2623,#d24a43)!important;}

    .key-dot.payout{background:#24d18a!important;box-shadow:0 0 12px rgba(36,209,138,.45)!important;}
    .key-dot.weight{background:#fbbf24!important;box-shadow:0 0 12px rgba(251,191,36,.45)!important;}
    .bar.payout{background:linear-gradient(90deg,#138a55,#24d18a,#b7f7d6)!important;box-shadow:0 0 16px rgba(36,209,138,.28)!important;}
    .bar.weight{background:linear-gradient(90deg,#d97706,#f59e0b,#fde68a)!important;box-shadow:0 0 14px rgba(245,158,11,.32)!important;}
    /* v1.1.197: stronger readable text on fullscreen results and payments pages */
    body,.app,.hero,.grid,.summary,.result-card,.stat,.toolbar,.box,.panel,.card,.member-card,.summary-card,.stat-card,.chart-card,.table-card{
      color:#f4fbff!important;
      -webkit-font-smoothing:antialiased!important;
      text-rendering:optimizeLegibility!important;
    }
    h1,h2,h3,h4,.title,.member-name,.value,.payout,strong,b,.summary .value,.stat .value{
      color:#ffffff!important;
      font-weight:950!important;
      text-shadow:0 1px 1px rgba(0,0,0,.95),0 0 14px rgba(251,191,36,.28)!important;
    }
      color:#e6f6ff!important;
      text-shadow:0 1px 1px rgba(0,0,0,.72)!important;
    }
    .btn,button,a.btn{
      color:#ffffff!important;
      font-weight:950!important;
      letter-spacing:.28px!important;
      text-shadow:0 1px 1px rgba(0,0,0,1),0 0 12px rgba(251,191,36,.34)!important;
    }
    input,textarea,select{
      color:#ffffff!important;
      font-weight:800!important;
      text-shadow:0 1px 1px rgba(0,0,0,.75)!important;
    }
    input::placeholder,textarea::placeholder{color:#fde68a!important;opacity:.9!important;}

    /* v1.1.135: compact results toolbar/sidebar so every action fits cleanly */
    .app{grid-template-columns:260px minmax(0,1fr)!important;gap:12px!important;}
    .hero{padding:10px!important;gap:8px!important;min-height:calc(100vh - 36px)!important;max-height:calc(100vh - 36px)!important;}
    .title{gap:6px!important;margin-bottom:4px!important;}
    .title img{width:44px!important;height:44px!important;}
    h1{font-size:17px!important;line-height:1.12!important;}
    .results-action-zone .btn{padding:7px 8px!important;min-height:31px!important;font-size:11.5px!important;line-height:1.12!important;border-radius:8px!important;}
    .close-hint{font-size:10px!important;line-height:1.24!important;padding:7px 8px!important;border-radius:9px!important;}
    .results-action-zone{grid-template-columns:1fr 1fr!important;gap:6px!important;margin-top:0!important;padding-top:8px!important;}
    .results-action-note{grid-column:1/-1!important;font-size:10px!important;line-height:1.22!important;margin:0!important;}
    .results-action-zone .btn{margin:0!important;}
    .summary{gap:8px!important;margin-bottom:10px!important;}
    .summary-card{padding:9px!important;}
    .summary-card b{font-size:15px!important;}
    .grid{gap:10px!important;}
    @media (max-width: 900px){
      .app{display:block!important;}
      .hero{min-height:0!important;max-height:none!important;}
      .results-action-zone{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }

    /* v1.1.136 fullscreen results fit pass */
    *,*::before,*::after{box-sizing:border-box!important;}
    body{overflow-x:hidden!important;}
    .hero{overflow-x:hidden!important;scrollbar-width:thin!important;}
    .btn,button,a.btn{white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.15!important;}
    .result-top{min-width:0!important;}
    .stats{grid-template-columns:repeat(auto-fit,minmax(72px,1fr))!important;}
    @media (max-width: 520px){
      body{padding:6px!important;}
      .summary{grid-template-columns:1fr!important;}
      .results-action-zone{grid-template-columns:1fr!important;}
    }

    /* v1.1.226: final results-panel theme pass to match the main RWPH panel */
    :root{
      --rwph-bg:#020617!important;
      --rwph-panel:#0f172a!important;
      --rwph-panel-deep:#020617!important;
      --rwph-panel-soft:#1e293b!important;
      --rwph-line:rgba(251,191,36,.24)!important;
      --rwph-line-strong:rgba(251,191,36,.42)!important;
      --rwph-text:#fff7ed!important;
      --rwph-muted:#cfaa8e!important;
      --rwph-blue:#f59e0b!important;
      --rwph-green:#f2b84b!important;
    }
    html,body{
      color:var(--rwph-text)!important;
      background:
        radial-gradient(circle at 12% 0%, rgba(245,158,11,.22), transparent 28%),
        radial-gradient(circle at 90% 4%, rgba(245,158,11,.18), transparent 30%),
        linear-gradient(180deg, #020617 0%, #0b1120 48%, #020617 100%)!important;
      font-family:Arial, Helvetica, sans-serif!important;
    }
    body::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      background:repeating-linear-gradient(0deg, rgba(251,191,36,.035) 0 1px, transparent 1px 28px)!important;
      opacity:.55!important;
      z-index:-1;
    }
    .app{
      max-width:1380px!important;
      margin:0 auto!important;
      align-items:start!important;
    }
    .hero{
      border:1px solid var(--rwph-line)!important;
      border-radius:22px!important;
      background:radial-gradient(circle at 50% 0%, rgba(245,158,11,.18), transparent 38%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.94))!important;
      box-shadow:0 24px 70px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.06), 0 0 24px rgba(245,158,11,.09)!important;
      backdrop-filter:blur(14px)!important;
      scrollbar-width:thin!important;
      scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36)!important;
    }
    .hero::-webkit-scrollbar{width:8px!important;height:8px!important;}
    .hero::-webkit-scrollbar-track{background:rgba(15,23,42,.34)!important;border-radius:999px!important;}
    .hero::-webkit-scrollbar-thumb{background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.88))!important;border:2px solid rgba(15,23,42,.50)!important;border-radius:999px!important;}
    .title{
      margin:0!important;
      padding:12px 10px!important;
      border:1px solid rgba(251,191,36,.18)!important;
      border-left:4px solid rgba(245,158,11,.72)!important;
      border-radius:16px!important;
      background:linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.78))!important;
      box-shadow:0 10px 24px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.05)!important;
    }
    .title img{filter:drop-shadow(0 0 14px rgba(251,191,36,.42))!important;}
    h1{
      color:#ffffff!important;
      font-weight:950!important;
      letter-spacing:.28px!important;
      text-shadow:0 1px 1px rgba(0,0,0,.95), 0 0 14px rgba(251,191,36,.28)!important;
    }
    .results-mode-note{
      margin:6px 0 0!important;
      color:#fff2dd!important;
      font-size:10.5px!important;
      font-weight:850!important;
      line-height:1.32!important;
      text-shadow:0 1px 1px rgba(0,0,0,.72)!important;
    }
    .results-action-zone{
      display:grid!important;
      gap:7px!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
    }
    .close-hint,
    .results-action-note{
      border:1px solid rgba(251,191,36,.16)!important;
      border-left:4px solid rgba(245,158,11,.58)!important;
      border-radius:14px!important;
      background:linear-gradient(180deg, rgba(30,41,59,.66), rgba(2,6,23,.48))!important;
      color:#fff2dd!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
      padding:8px 9px!important;
      font-weight:800!important;
    }
    .btn,button,a.btn,
    .results-action-zone .btn,
    #csvBtn,#payAllBtn{
      background:linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88))!important;
      color:#fff7ed!important;
      border:1px solid rgba(251,191,36,.24)!important;
      border-left:4px solid rgba(245,158,11,.66)!important;
      border-radius:12px!important;
      box-shadow:0 1px 0 rgba(255,255,255,.045) inset, 0 12px 26px rgba(0,0,0,.26)!important;
      text-shadow:0 1px 0 rgba(0,0,0,.75)!important;
      font-weight:950!important;
      transition:transform .12s ease, filter .12s ease, border-color .12s ease!important;
    }
    .btn:hover,button:hover,a.btn:hover{
      filter:brightness(1.10)!important;
      transform:translateY(-1px)!important;
      border-color:rgba(251,191,36,.44)!important;
    }
    .summary{
      grid-area:summary!important;
      align-self:start!important;
    }
    .summary-card,
    .result-card,
    .stats div{
      background:linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.88))!important;
      border:1px solid rgba(251,191,36,.22)!important;
      border-left:4px solid rgba(245,158,11,.46)!important;
      border-radius:16px!important;
      box-shadow:0 14px 34px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.045)!important;
    }
    .summary-card span,
    .result-id,
    .stats span{
      color:#fde68a!important;
      text-shadow:0 1px 1px rgba(0,0,0,.72)!important;
    }
    .summary-card b,
    .stats b,
    .result-name{
      color:#ffffff!important;
      text-shadow:0 1px 1px rgba(0,0,0,.92), 0 0 12px rgba(251,191,36,.18)!important;
    }
    .result-card{
      padding:12px!important;
      position:relative!important;
      overflow:hidden!important;
    }
    .result-card::before{
      content:""!important;
      position:absolute!important;
      inset:0 0 auto 0!important;
      height:3px!important;
      background:linear-gradient(90deg, rgba(245,158,11,.25), rgba(251,191,36,.90), rgba(245,158,11,.35))!important;
      opacity:.92!important;
    }
    .payout{
      color:#bbf7d0!important;
      background:rgba(22,101,52,.20)!important;
      border:1px solid rgba(134,239,172,.28)!important;
      border-radius:12px!important;
      padding:6px 9px!important;
      box-shadow:0 0 18px rgba(34,197,94,.12)!important;
    }
    .grid{
      grid-area:results!important;
    }
    .pay-all-panel{
      border:1px solid rgba(251,191,36,.28)!important;
      border-left:4px solid rgba(245,158,11,.54)!important;
      border-radius:20px!important;
      background:radial-gradient(circle at 18% 0%, rgba(245,158,11,.20), transparent 34%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96))!important;
      box-shadow:0 20px 60px rgba(0,0,0,.58), 0 0 28px rgba(245,158,11,.12)!important;
      color:#fff7ed!important;
    }
    .pay-all-row,
    .pay-all-info{
      background:linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.72))!important;
      border:1px solid rgba(251,191,36,.18)!important;
      border-left:4px solid rgba(245,158,11,.44)!important;
      border-radius:14px!important;
    }
    @media (max-width:900px){
      .app{display:block!important;}
      .hero{margin-bottom:12px!important;}
      .summary{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }
    @media (max-width:520px){
      .summary{grid-template-columns:1fr!important;}
      .title{padding:10px 8px!important;}
    }

    /* v1.1.227: results page layout refresh */
    body{padding:16px!important;}
    .app{
      display:grid!important;
      grid-template-columns:minmax(0, 1fr) 350px!important;
      grid-template-areas:
        "hero hero"
        "summary actions"
        "results actions"!important;
      gap:14px!important;
      max-width:1420px!important;
      margin:0 auto!important;
      align-items:start!important;
    }
    .hero{
      grid-area:hero!important;
      position:relative!important;
      top:auto!important;
      z-index:1!important;
      min-height:0!important;
      max-height:none!important;
      margin:0!important;
      overflow:visible!important;
      padding:14px!important;
    }
    .results-hero-head{
      display:grid!important;
      grid-template-columns:auto minmax(0,1fr)!important;
      gap:12px!important;
      align-items:center!important;
    }
    .results-hero-logo{
      width:88px!important;
      height:88px!important;
      object-fit:contain!important;
      filter:drop-shadow(0 0 16px rgba(251,191,36,.42))!important;
    }
    .results-hero-copy{text-align:left!important;min-width:0!important;}
    .results-hero-copy h1{
      font-size:24px!important;
      line-height:1.08!important;
      margin:0 0 6px!important;
      text-align:left!important;
    }
    .results-mode-note{
      margin:0!important;
      max-width:900px!important;
      text-align:left!important;
    }
    .results-hero-meta{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:9px!important;
      margin-top:12px!important;
    }
    .results-meta-card,
    .results-section-head,
    .results-side-panel{
      border:1px solid rgba(251,191,36,.18)!important;
      border-left:4px solid rgba(245,158,11,.58)!important;
      border-radius:16px!important;
      background:linear-gradient(180deg, rgba(30,41,59,.78), rgba(2,6,23,.58))!important;
      box-shadow:0 12px 28px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.045)!important;
    }
    .results-meta-card{
      padding:10px!important;
      text-align:left!important;
      overflow:hidden!important;
    }
    .results-meta-card span,
    .results-section-head span{
      display:block!important;
      color:#fde68a!important;
      font-size:10px!important;
      letter-spacing:.52px!important;
      text-transform:uppercase!important;
      font-weight:950!important;
      text-shadow:0 1px 1px rgba(0,0,0,.70)!important;
    }
    .results-meta-card b{
      display:block!important;
      margin-top:4px!important;
      color:#ffffff!important;
      font-size:16px!important;
      line-height:1.16!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      white-space:nowrap!important;
      text-shadow:0 1px 1px rgba(0,0,0,.92),0 0 12px rgba(251,191,36,.18)!important;
    }
    .summary{
      grid-area:summary!important;
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:10px!important;
      margin:0!important;
      align-self:start!important;
    }
    .summary-card{text-align:left!important;padding:12px!important;}
    .summary-card b{text-align:left!important;font-size:17px!important;}
    .results-side-panel{
      grid-area:actions!important;
      position:sticky!important;
      top:16px!important;
      display:grid!important;
      gap:9px!important;
      padding:12px!important;
      margin:0!important;
      align-self:start!important;
      max-height:calc(100vh - 32px)!important;
      overflow:auto!important;
      scrollbar-width:thin!important;
      scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36)!important;
    }
    .results-side-title{
      margin:0!important;
      color:#ffffff!important;
      font-size:15px!important;
      font-weight:950!important;
      letter-spacing:.24px!important;
      text-align:left!important;
    }
    .results-action-zone .btn{
      width:100%!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:36px!important;
      padding:9px 10px!important;
      text-align:center!important;
    }
    .close-hint,
    .results-action-note{
      text-align:left!important;
      font-size:10.5px!important;
      line-height:1.34!important;
    }
    .results-action-zone{
      display:grid!important;
      grid-template-columns:1fr!important;
      gap:8px!important;
      margin:0!important;
      padding:0!important;
    }
    .member-results-panel{
      grid-area:results!important;
      min-width:0!important;
    }
    .results-section-head{
      display:flex!important;
      justify-content:space-between!important;
      align-items:center!important;
      gap:10px!important;
      margin:0 0 10px!important;
      padding:12px 14px!important;
      text-align:left!important;
    }
    .results-section-head h2{
      margin:0!important;
      color:#ffffff!important;
      font-size:17px!important;
      font-weight:950!important;
      text-align:left!important;
      text-shadow:0 1px 1px rgba(0,0,0,.92),0 0 12px rgba(251,191,36,.18)!important;
    }
    .results-section-head p{
      margin:4px 0 0!important;
      color:#fff2dd!important;
      font-size:11px!important;
      line-height:1.35!important;
      font-weight:800!important;
      text-align:left!important;
    }
    .grid{
      grid-area:auto!important;
      display:grid!important;
      grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;
      gap:11px!important;
      margin:0!important;
    }
    .result-card{text-align:left!important;display:flex!important;flex-direction:column!important;gap:10px!important;padding:13px!important;}
    .result-card-head{
      display:grid!important;
      grid-template-columns:auto minmax(0,1fr) auto!important;
      gap:10px!important;
      align-items:center!important;
      min-width:0!important;
    }
    .result-rank-pill{
      display:grid!important;
      place-items:center!important;
      min-width:42px!important;
      height:42px!important;
      padding:0 8px!important;
      border-radius:14px!important;
      border:1px solid rgba(251,191,36,.24)!important;
      background:linear-gradient(180deg, rgba(245,158,11,.18), rgba(15,23,42,.78))!important;
      color:#fff2dd!important;
      font-size:13px!important;
      font-weight:950!important;
      text-shadow:0 1px 1px rgba(0,0,0,.92)!important;
    }
    .result-player{min-width:0!important;text-align:left!important;}
    .result-name{
      text-align:left!important;
      font-size:15px!important;
      line-height:1.12!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      white-space:nowrap!important;
    }
    .result-id{text-align:left!important;font-size:10px!important;margin-top:4px!important;}
    .result-payout-block{
      display:grid!important;
      gap:3px!important;
      justify-items:end!important;
      text-align:right!important;
      min-width:112px!important;
    }
    .result-payout-block span{
      color:#fde68a!important;
      font-size:10px!important;
      letter-spacing:.52px!important;
      text-transform:uppercase!important;
      font-weight:950!important;
      text-shadow:0 1px 1px rgba(0,0,0,.70)!important;
    }
    .result-payout-block .payout,
    .payout{text-align:right!important;margin:0!important;white-space:nowrap!important;}
    .result-quick-row{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:8px!important;
    }
    .result-highlight{
      padding:9px 10px!important;
      border-radius:14px!important;
      border:1px solid rgba(251,191,36,.18)!important;
      background:linear-gradient(180deg, rgba(30,41,59,.74), rgba(2,6,23,.58))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
      text-align:left!important;
      min-width:0!important;
    }
    .result-highlight span{
      display:block!important;
      color:#fde68a!important;
      font-size:10px!important;
      letter-spacing:.48px!important;
      text-transform:uppercase!important;
      font-weight:950!important;
      text-align:left!important;
    }
    .result-highlight b{
      display:block!important;
      margin-top:3px!important;
      color:#ffffff!important;
      font-size:15px!important;
      line-height:1.1!important;
      text-align:left!important;
    }
    .stats{grid-template-columns:repeat(4,minmax(0,1fr))!important;margin:0!important;}
    .stats div{padding:8px 9px!important;min-width:0!important;}
    .stats div,.stats span,.stats b{text-align:left!important;}
    .stats span{font-size:9.5px!important;line-height:1.1!important;}
    .stats b{font-size:13px!important;line-height:1.12!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}
    @media (max-width:1100px){
      body{padding:12px!important;}
      .app{
        grid-template-columns:1fr!important;
        grid-template-areas:
          "hero"
          "actions"
          "summary"
          "results"!important;
      }
      .results-side-panel{position:relative!important;top:auto!important;max-height:none!important;}
      .results-action-zone{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
      .results-action-note{grid-column:1/-1!important;}
      .summary{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
      .results-hero-meta{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }
    @media (max-width:680px){
      body{padding:8px!important;}
      .results-hero-head{grid-template-columns:1fr!important;text-align:center!important;}
      .results-hero-logo{margin:0 auto!important;}
      .results-hero-copy,.results-hero-copy h1,.results-mode-note{text-align:center!important;}
      .results-section-head{display:block!important;}
      .grid{grid-template-columns:1fr!important;}
      .result-card-head{grid-template-columns:auto minmax(0,1fr)!important;align-items:start!important;}
      .result-payout-block{grid-column:1 / -1!important;justify-items:start!important;text-align:left!important;min-width:0!important;width:100%!important;}
      .result-payout-block .payout,.payout{text-align:left!important;width:100%!important;}
      .result-quick-row{grid-template-columns:1fr!important;}
      .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }


    /* v1.1.251: visual-only cleanup for existing result-card layout and top summary cards */
    .result-card{border-color:rgba(251,191,36,.22)!important;background:linear-gradient(180deg,rgba(15,23,42,.95),rgba(2,6,23,.86))!important;box-shadow:0 14px 32px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.055)!important;}
    .result-card-head{padding-bottom:2px!important;border-bottom:1px solid rgba(251,191,36,.10)!important;}
    .result-payout-block .payout{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;padding:6px 10px!important;border-radius:999px!important;background:rgba(34,197,94,.10)!important;border:1px solid rgba(134,239,172,.18)!important;}
    .result-highlight,.stats div{box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;}
    .stats div{display:flex!important;flex-direction:column!important;justify-content:space-between!important;gap:3px!important;min-height:50px!important;}
    .stats span{display:block!important;min-height:20px!important;}
    .stats b{display:block!important;}

  </style>
</head>
<body>
  <main class="app">
    <section class="hero">
      <div class="results-hero-head">
        <img class="results-hero-logo" src="${RWPH_LAUNCHER_LOGO_DATA_URI}" alt="RWPH">
        <div class="results-hero-copy">
          <h1>${pointsMode ? "Points System Results" : "Per Hit Results"}</h1>
          <p class="results-mode-note">${pointsMode ? "Completed ranked-war contribution report. Uses hybrid rankedwarreport + attack-log scoring when available, then splits payouts by final points score." : "Completed ranked-war payout report. Uses backend/database cache only, expires cached reports after 24 hours, and keeps payments manual-review only."}</p>
        </div>
      </div>
      <div class="results-hero-meta" aria-label="Report details">
        <div class="results-meta-card"><span>Faction</span><b>${esc(summary?.factionName || summary?.faction?.name || "Faction")}</b></div>
        <div class="results-meta-card"><span>Report Type</span><b>${pointsMode ? "Points system" : "Finished war"}</b></div>
        ${pointsMode ? `<div class="results-meta-card"><span>Total Points</span><b>${Number(summary?.totalPoints ?? summary?.totalWeight ?? 0).toFixed(2)}</b></div>` : `<div class="results-meta-card"><span>Per Hit Amount</span><b>${esc(money(perHitAmount))}</b></div>`}
      </div>
    </section>
      <div class="results-action-zone" aria-label="Results actions">
        <p class="results-action-note"><b>Results actions:</b> download this results page as HTML, export CSV for records, use Payments, or open the Newsletter dropdown for compact themed HTML panels.</p>
        <a class="btn secondary" id="thisPageHtmlBtn" href="#" role="button">Export Html</a>
        <a class="btn secondary" id="csvBtn" href="#" role="button">Export CSV</a>
        <a class="btn secondary" id="payAllBtn" href="${esc(payAllHref)}" onclick="return window.rwphOpenPaymentsSameTab ? window.rwphOpenPaymentsSameTab(event) : true;">Payments</a>
        ${rwphNewsletterButtonsHtml}
      </div>
      <p class="close-hint">To close this results page, use the close button on the browser/Torn PDA web tab. After Calculate, the matching settings dropdown shows <b>Use Cached Report</b> when a cached report is available. Cached reports are kept in the backend/database for 24 hours, then deleted automatically.</p>
    </aside>

    ${rwphNewsletterPanelsHtml}

    <section class="summary" aria-label="Report summary">
      <div class="summary-card"><span>Member Payout</span><b>${esc(money(memberPayout))}</b></div>
      <div class="summary-card"><span>Total Payout</span><b>${esc(money(overallTotalPayout))}</b></div>
      ${pointsMode ? `<div class="summary-card"><span>Per Point Amount</span><b>${esc(money(perPointAmount))}</b></div>` : `<div class="summary-card"><span>Per Hit Amount</span><b>${esc(money(perHitAmount))}</b></div>`}
      <div class="summary-card"><span>War Source</span><b>${rwphWarSourceLabel(summary?.selectedWar?.timeSource)}</b></div>
      <div class="summary-card"><span>${pointsMode ? "Total Points" : "Total weight"}</span><b>${Number(pointsMode ? (summary?.totalPoints ?? summary?.totalWeight ?? 0) : (summary?.totalWeight || 0)).toFixed(2)}</b></div>
      <div class="summary-card"><span>Total Respect</span><b>${Number(summary?.totalRespect || 0).toFixed(2)}</b></div>
      <div class="summary-card"><span>War Hits</span><b>${Number(summary?.totalWarHits ?? summary?.totalHits ?? 0)}</b></div>
      <div class="summary-card"><span>Assists</span><b>${Number(summary?.totalAssists || 0)}</b></div>
      <div class="summary-card"><span>Outside Hits</span><b>${Number(summary?.totalOutsideHits || 0)}</b></div>
      <div class="summary-card"><span>Retals</span><b>${Number(summary?.totalRetaliationHits || 0)}</b></div>
      <div class="summary-card"><span>${pointsMode ? "Own-Faction Hospital Hits" : "Tracked"}</span><b>${Number(pointsMode ? (summary?.totalHospitalizingHits || 0) : (summary?.totalTrackedHits || 0))}</b></div>
      ${pointsMode ? `<div class="summary-card"><span>Enemy War Hospital Hits</span><b>${Number(summary?.totalEnemyFactionHospitalizingHits || 0)}</b></div>` : ""}
      ${pointsMode ? `<div class="summary-card"><span>Enemy Hospital Bonus</span><b>${Number(summary?.totalEnemyFactionHospitalBonusPoints || 0).toFixed(2)}</b></div>` : ""}
      <div class="summary-card"><span>${pointsMode ? "Fair Bonus" : "Payable"}</span><b>${pointsMode ? Number(summary?.totalFairFightBonusPoints || 0).toFixed(2) : Number(summary?.calcMeta?.payableEvents || 0)}</b></div>
      <div class="summary-card"><span>Removed Member Hits</span><b>${removedLeftFactionHits}</b></div>
      <div class="summary-card"><span>Members</span><b>${list.length}</b></div>
    </section>

    <section class="member-results-panel" aria-label="Member payout results">
      <div class="results-section-head">
        <div>
          <span>Member Results</span>
          <h2>${pointsMode ? "Contribution point rows" : "Payout rows"}</h2>
          <p>${pointsMode ? "Review each member score and payout before using the Payments helper. Points mode pays by total contribution score, not flat per-hit pay." : "Review each member payout before using the Payments helper. RWPH never sends money or confirms Torn actions automatically."}</p>
        </div>
        <div class="results-meta-card"><span>Rows</span><b>${list.length}</b></div>
      </div>
      <section class="grid">${cards || `<div class="result-card">No payable or tracked attacks found.</div>`}</section>
    </section>
  </main>

  <aside class="pay-all-panel" id="payAllPanel" hidden>
    <button class="btn secondary pay-all-close" id="payAllClose" type="button">×</button>
    <button class="btn secondary pay-all-reopen-report" id="payAllReopenReport" type="button" title="Reopen this report for 10 minutes after opening Payments">Reopen Report</button>
    <h2 class="pay-all-head">Payments Copy Panel</h2>
    <p class="pay-all-note">Use this helper inside Torn faction controls. It is a payout checklist, not an automatic payment sender.</p>
    <div class="pay-all-info">
      <b>How to use Payments:</b>
      <ul>
        <li><b>Name + ID</b> copies the member name and Torn ID, and tries to prefill the visible member field.</li>
        <li><b>Amount</b> copies that member's payout amount, and tries to prefill the visible money field.</li>
        <li>After a Name + ID or Amount button is pressed once, that button disappears so you can track what has already been used.</li>
        <li>Use <b>Bring Back Disappeared Button</b> to bring back the most recently hidden button.</li>
        <li>If a field is not visible, open the correct faction banking/add money area first, then use Undo and press the button again.</li>
        <li>You still manually review the member, amount, and final Torn confirmation. RWPH never clicks Add Money, Send, or Confirm.</li>
      </ul>
    </div>
    <button class="btn secondary pay-all-undo" id="payAllUndo" type="button">Bring Back Disappeared Button</button>
    <div class="pay-all-list" id="payAllList"></div>
    <div class="resize-handle resize-handle-nw" data-resize-dir="nw" title="Resize from top-left"></div>
    <div class="resize-handle resize-handle-sw" data-resize-dir="sw" title="Resize from bottom-left"></div>
    <div class="resize-handle resize-handle-se" data-resize-dir="se" title="Resize from bottom-right"></div>
  </aside>

  <script>
    const rows = ${rowsJson};
    const summary = ${summaryJson};
    const csvText = ${JSON.stringify(csvText).replaceAll("<", "\\u003c")};
    const rwphApiBase = ${JSON.stringify(PAYWALL_API_BASE)};
    const payAllRowsFallbackStorageKey = "rw_payout_helper_pay_all_rows_fallback";
    const payAllReportReopenStorageKey = "rw_payout_helper_recent_pay_all_report";
    const payAllReportReopenTtlMs = 10 * 60 * 1000;
    const rwphOpenResultsStorageKey = "rw_payout_helper_last_results_html_open";

    function rwphRememberStandaloneResultsOpen() {
      try {
        localStorage.setItem(rwphOpenResultsStorageKey, JSON.stringify({
          active: true,
          url: String(location.href || ""),
          createdAt: Date.now(),
          html: "<!doctype html>\n" + document.documentElement.outerHTML
        }));
      } catch (_) {}
    }
    window.addEventListener("beforeunload", rwphRememberStandaloneResultsOpen);
    setTimeout(rwphRememberStandaloneResultsOpen, 250);

    function storePayAllRowsFallback() {
      try {
        localStorage.setItem(payAllRowsFallbackStorageKey, JSON.stringify({ createdAt: Date.now(), rows: rows || [] }));
      } catch (e) {}
    }

    function storePayAllReportReopenSnapshot() {
      try {
        const html = getCurrentResultsPageHtml();
        if (!html || html.length < 1000) return false;
        const now = Date.now();
        localStorage.setItem(payAllReportReopenStorageKey, JSON.stringify({
          createdAt: now,
          expiresAt: now + payAllReportReopenTtlMs,
          filename: rwphExportHtmlFilename ? rwphExportHtmlFilename() : "rwph-results-report.html",
          html: html
        }));
        return true;
      } catch (e) {
        console.warn("RWPH could not store recent report reopen snapshot:", e);
        return false;
      }
    }

    storePayAllRowsFallback();

    function money(n) {
      return "$" + Math.round(Number(n || 0)).toLocaleString();
    }

    function rwphTriggerDirectDownload(url, filename) {
      try {
        const a = document.createElement("a");
        a.href = String(url || "");
        a.download = String(filename || "rwph-export.txt").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-");
        a.rel = "noopener";
        a.target = "_self";
        a.style.display = "none";
        document.body.appendChild(a);
        if (typeof a.click === "function") a.click();
        else a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        setTimeout(() => { try { a.remove(); } catch (_) {} }, 250);
        return true;
      } catch (e) {
        console.warn("RWPH direct download failed:", e);
        return false;
      }
    }

    function downloadText(filename, text, type) {
      const safeName = String(filename || "rwph-export.txt").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-");
      const mime = String(type || "text/plain;charset=utf-8");
      const value = String(text || "");
      try {
        const blob = new Blob([value], { type: mime });
        const url = URL.createObjectURL(blob);
        const ok = rwphTriggerDirectDownload(url, safeName);
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 15000);
        if (ok) return true;
      } catch (e) { console.warn("RWPH Blob download failed:", e); }
      try {
        const dataUrl = "data:" + mime + "," + encodeURIComponent(value);
        if (dataUrl.length < 1900000 && rwphTriggerDirectDownload(dataUrl, safeName)) return true;
      } catch (e) { console.warn("RWPH data-url download failed:", e); }
      return false;
    }

    function rwphSubmitExportDownloadForm(kind, filename, content, mime, extension, inline) {
      try {
        var base = String(rwphApiBase || "").replace(/\/+$/, "");
        if (!base) return false;
        var ext = String(extension || "txt").replace(/[^a-z0-9]/gi, "").toLowerCase() || "txt";
        var safeName = rwphExportFileSafeName(filename, ext === "csv" ? "torn-rw-payouts.csv" : "rwph-results-page.html", ext);
        var form = document.createElement("form");
        form.method = "POST";
        form.action = base + "/api/calc/download-file";
        form.target = "_blank";
        form.acceptCharset = "UTF-8";
        form.style.position = "fixed";
        form.style.left = "-9999px";
        form.style.top = "-9999px";
        function field(name, value) {
          var input = document.createElement("textarea");
          input.name = name;
          input.value = String(value == null ? "" : value);
          form.appendChild(input);
        }
        field("filename", safeName);
        field("content", String(content || ""));
        field("mime", mime || "text/plain;charset=utf-8");
        field("extension", ext);
        if (inline) field("inline", "1");
        (document.body || document.documentElement).appendChild(form);
        form.submit();
        setTimeout(function(){ try { form.remove(); } catch (_) {} }, 1000);
        return true;
      } catch (e) {
        console.warn("RWPH direct form export failed:", e);
        return false;
      }
    }

    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>"]/g, function(ch) {
        return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[ch] || ch;
      });
    }

    function rwphIsPdaOrMobileExportView() {
      try {
        var ua = navigator.userAgent || "";
        if (/(torn\s*pda|tornpda|android|iphone|ipad|ipod|mobile|phone|wv\))/i.test(ua)) return true;
        if (window.matchMedia && window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) return true;
      } catch (_) {}
      return false;
    }

    function rwphExportFileSafeName(filename, fallback, extension) {
      var ext = String(extension || "txt").replace(/[^a-z0-9]/gi, "").toLowerCase() || "txt";
      var name = String(filename || fallback || ("rwph-export." + ext)).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").slice(0, 140).trim();
      if (!name) name = String(fallback || ("rwph-export." + ext));
      var re = new RegExp("\\." + ext + "$", "i");
      if (!re.test(name)) name = name.replace(/\.[a-z0-9]{1,8}$/i, "") + "." + ext;
      return name;
    }

    function rwphCreateLocalExportUrl(content, mime) {
      try {
        var blob = new Blob([String(content || "")], { type: mime || "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        setTimeout(function() { try { URL.revokeObjectURL(url); } catch (_) {} }, 10 * 60 * 1000);
        return url;
      } catch (e) {
        console.warn("RWPH local export URL failed:", e);
        return "";
      }
    }

    function rwphOpenExportFileFallbackPanel(kind, content, filename, mime, reason, downloadUrl, inlineUrl) {
      try {
        var old = document.getElementById("rwph-export-html-panel") || document.getElementById("rwph-export-file-panel");
        if (old) old.remove();
        var label = String(kind || "Export").toUpperCase();
        var ext = label === "CSV" ? "csv" : (label === "HTML" ? "html" : "txt");
        var safeName = rwphExportFileSafeName(filename, ext === "csv" ? "torn-rw-payouts.csv" : "rwph-results-page.html", ext);
        var value = String(content || "");
        var panel = document.createElement("section");
        panel.id = "rwph-export-file-panel";
        panel.className = "rwph-results-html-panel";
        panel.style.display = "flex";
        panel.style.visibility = "visible";
        panel.style.opacity = "1";
        panel.innerHTML = ''
          + '<div class="rwph-results-html-head">'
          + '<div><div class="rwph-results-html-title">Export ' + escapeHtml(label) + '</div>'
          + '<div class="rwph-results-html-note">On Torn PDA, tap the download link below. If PDA blocks downloads, copy the raw ' + escapeHtml(label) + ' box and save it manually.</div></div>'
          + '<a class="rwph-results-html-close" href="#" title="Close">×</a>'
          + '</div>'
          + '<div class="rwph-results-html-status">' + escapeHtml(reason || "Download fallback ready.") + ' File name: ' + escapeHtml(safeName) + '</div>'
          + '<div class="rwph-export-html-actions" id="rwph-export-file-actions"></div>'
          + '<textarea class="rwph-results-html-box" id="rwph-export-file-box" readonly spellcheck="false" onfocus="this.select()" onclick="this.focus()" oncontextmenu="this.focus();this.select();"></textarea>';
        (document.body || document.documentElement).appendChild(panel);

        var actions = document.getElementById("rwph-export-file-actions");
        function addLink(href, text, shouldDownload) {
          if (!actions || !href) return;
          var a = document.createElement("a");
          a.href = String(href || "");
          if (shouldDownload) a.download = safeName;
          a.target = "_self";
          a.textContent = text;
          actions.appendChild(a);
        }
        addLink(downloadUrl, "Download ." + ext + " File", true);
        addLink(inlineUrl, "Open " + label + " in this tab", false);
        var localUrl = rwphCreateLocalExportUrl(value, mime || "text/plain;charset=utf-8");
        addLink(localUrl, downloadUrl ? "Backup Local Download" : ("Download ." + ext + " File"), true);

        var box = document.getElementById("rwph-export-file-box");
        if (box) {
          box.value = value;
          setTimeout(function() { try { box.focus(); box.select(); } catch (_) {} }, 60);
        }
        var close = panel.querySelector(".rwph-results-html-close");
        if (close) close.addEventListener("click", function(ev) { try { ev.preventDefault(); } catch (_) {} try { panel.remove(); } catch (_) {} });
        try { setupMoveResize(panel, ".rwph-results-html-head"); } catch (_) {}
        return panel;
      } catch (e) {
        console.warn("RWPH export fallback panel failed:", e);
        return null;
      }
    }

    function rwphStartServerTextAttachmentDownload(kind, filename, content, mime, extension, fallbackFn) {
      try {
        var base = String(rwphApiBase || "").replace(/\/+$/, "");
        if (!base || typeof fetch !== "function") return false;
        var ext = String(extension || "txt").toLowerCase();
        var safeName = rwphExportFileSafeName(filename, ext === "csv" ? "torn-rw-payouts.csv" : "rwph-results-page.html", ext);
        fetch(base + "/api/calc/export-file", {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ filename: safeName, content: String(content || ""), mime: mime || "text/plain;charset=utf-8", extension: ext })
        }).then(function(res) {
          return res.json().catch(function() { return { ok: false, error: "Bad export response" }; });
        }).then(function(data) {
          if (data && data.ok && data.downloadUrl) {
            var downloadUrl = String(data.downloadUrl || "");
            var inlineUrl = String(data.inlineUrl || (downloadUrl ? downloadUrl + "?inline=1" : ""));
            if (!rwphIsPdaOrMobileExportView()) {
              try { rwphTriggerDirectDownload(downloadUrl, data.filename || safeName); } catch (_) {}
              try {
                var iframe = document.createElement("iframe");
                iframe.style.position = "fixed";
                iframe.style.left = "-9999px";
                iframe.style.top = "-9999px";
                iframe.style.width = "1px";
                iframe.style.height = "1px";
                iframe.src = downloadUrl;
                (document.body || document.documentElement).appendChild(iframe);
                setTimeout(function() { try { iframe.remove(); } catch (_) {} }, 60000);
              } catch (_) {}
            }
            rwphOpenExportFileFallbackPanel(kind, content, data.filename || safeName, mime, rwphIsPdaOrMobileExportView() ? ("PDA-safe " + String(kind || "export").toUpperCase() + " export ready. Tap Download below.") : ("Server download started. If no file appears, press Download below."), downloadUrl, inlineUrl);
            return;
          }
          if (fallbackFn) fallbackFn((data && (data.error || data.message)) || "Server export failed.");
        }).catch(function(e) {
          console.warn("RWPH server export failed:", e);
          if (fallbackFn) fallbackFn("Server export failed or was blocked.");
        });
        return true;
      } catch (e) {
        console.warn("RWPH server export setup failed:", e);
        return false;
      }
    }

    function exportCsv(ev) {
      try {
        if (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {} }
        var filename = "torn-rw-payouts.csv";
        var value = String(csvText || "");
        var started = rwphSubmitExportDownloadForm("CSV", filename, value, "text/csv;charset=utf-8", "csv", false);
        // Always open the fallback/copy panel too. PDA often blocks automatic downloads,
        // but the visible link/text box still lets the user get the file contents.
        rwphOpenExportFileFallbackPanel("CSV", value, filename, "text/csv;charset=utf-8", started ? "CSV download was sent to the browser. If no file appears, use the backup options below." : "CSV automatic download was blocked. Use the backup options below.");
        if (!started && !rwphIsPdaOrMobileExportView()) downloadText(filename, value, "text/csv;charset=utf-8");
        return false;
      } catch (e) {
        console.warn("RWPH CSV export failed:", e);
        try { rwphOpenExportFileFallbackPanel("CSV", String(csvText || ""), "torn-rw-payouts.csv", "text/csv;charset=utf-8", "CSV export failed. Copy the raw CSV below."); } catch (_) {}
        return false;
      }
    }

    function rwphStripInlineScrollStyles(html) {
      return String(html || "")
        .replace(/\s*(?:overflow(?:-x|-y)?|scrollbar-width|scrollbar-color|-ms-overflow-style|-webkit-overflow-scrolling)\s*:\s*[^;\}"]+;?/gi, "")
        .trim();
    }

    async function copyText(text) {
      const value = String(text || "");
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (e) {}
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "readonly");
        ta.style.position = "fixed";
        ta.style.left = "0";
        ta.style.top = "0";
        ta.style.width = "1px";
        ta.style.height = "1px";
        ta.style.opacity = "0";
        ta.style.zIndex = "2147483647";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { ta.setSelectionRange(0, ta.value.length); } catch (_) {}
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (e) {
        return false;
      }
    }

    const payAllUndoStack = [];

    function setupMoveResize(panel, handleSelector) {
      if (!panel) return;
      panel.querySelectorAll?.(":scope > .resize-handle-ne, :scope > .rw-resize-handle-ne").forEach(function(h) { h.remove(); });
      if (panel.dataset.moveResizeReady === "1") return;
      panel.dataset.moveResizeReady = "1";
      const layoutKey = panel.dataset.layoutKey || "rwph_fullscreen_pay_all_layout";
      const handle = panel.querySelector(handleSelector);
      let dragging = false;
      let resizing = false;
      let activeDir = "se";
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;
      let startWidth = 0;
      let startHeight = 0;

      // Top-right resize is removed on every panel so it cannot clash with close buttons.
      panel.querySelectorAll(":scope > .resize-handle-ne").forEach(function(h) { h.remove(); });
      ["nw", "sw", "se"].forEach(function(dir) {
        if (!panel.querySelector(".resize-handle-" + dir)) {
          const h = document.createElement("div");
          h.className = "resize-handle resize-handle-" + dir;
          h.dataset.resizeDir = dir;
          h.title = dir === "nw" ? "Resize from top-left" : dir === "sw" ? "Resize from bottom-left" : "Resize from bottom-right";
          panel.appendChild(h);
        }
      });

      function point(e) {
        const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
        return { x: Number((t && t.clientX) || e.clientX || 0), y: Number((t && t.clientY) || e.clientY || 0) };
      }
      function save() {
        const rect = panel.getBoundingClientRect();
        try { localStorage.setItem(layoutKey, JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) })); } catch (_) {}
      }
      function apply() {
        try {
          const saved = JSON.parse(localStorage.getItem(layoutKey) || "null");
          if (!saved) return;
          const minWidth = 250, minHeight = 180;
          const width = Math.min(Math.max(minWidth, Number(saved.width) || minWidth), Math.max(minWidth, window.innerWidth - 16));
          const height = Math.min(Math.max(minHeight, Number(saved.height) || minHeight), Math.max(minHeight, window.innerHeight - 16));
          const left = Math.min(Math.max(8, Number(saved.left) || 8), Math.max(8, window.innerWidth - width - 8));
          const top = Math.min(Math.max(8, Number(saved.top) || 8), Math.max(8, window.innerHeight - height - 8));
          panel.style.setProperty("left", left + "px", "important");
          panel.style.setProperty("top", top + "px", "important");
          panel.style.setProperty("right", "auto", "important");
          panel.style.setProperty("bottom", "auto", "important");
          panel.style.setProperty("inset", "auto auto auto auto", "important");
          panel.style.setProperty("width", width + "px", "important");
          panel.style.setProperty("height", height + "px", "important");
          panel.style.setProperty("max-height", "none", "important");
          panel.style.setProperty("overflow", "hidden", "important");
        } catch (_) {}
      }
      function beginDrag(e) {
        if (!handle || !e.target.closest(handleSelector) || e.target.closest("button,a,input,textarea,select,.resize-handle")) return;
        const p = point(e);
        const rect = panel.getBoundingClientRect();
        dragging = true;
        startX = p.x; startY = p.y; startLeft = rect.left; startTop = rect.top;
        panel.style.setProperty("left", rect.left + "px", "important"); panel.style.setProperty("top", rect.top + "px", "important"); panel.style.setProperty("right", "auto", "important"); panel.style.setProperty("bottom", "auto", "important"); panel.style.setProperty("inset", "auto auto auto auto", "important");
        e.preventDefault();
        e.stopPropagation?.();
      }
      function beginResize(e) {
        const resizeHandle = e.target.closest(".resize-handle");
        if (!resizeHandle || !panel.contains(resizeHandle)) return;
        const p = point(e);
        const rect = panel.getBoundingClientRect();
        resizing = true;
        activeDir = resizeHandle.dataset.resizeDir || (resizeHandle.className.match(/resize-handle-(nw|sw|se)/) || [])[1] || "se";
        startX = p.x; startY = p.y; startLeft = rect.left; startTop = rect.top; startWidth = rect.width; startHeight = rect.height;
        panel.style.setProperty("left", rect.left + "px", "important"); panel.style.setProperty("top", rect.top + "px", "important"); panel.style.setProperty("right", "auto", "important"); panel.style.setProperty("bottom", "auto", "important"); panel.style.setProperty("inset", "auto auto auto auto", "important"); panel.style.setProperty("max-height", "none", "important"); panel.style.setProperty("overflow", "hidden", "important");
        e.preventDefault();
        e.stopPropagation?.();
      }
      function move(e) {
        const p = point(e);
        if (dragging) {
          const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
          const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
          panel.style.setProperty("left", Math.min(Math.max(8, startLeft + p.x - startX), maxLeft) + "px", "important");
          panel.style.setProperty("top", Math.min(Math.max(8, startTop + p.y - startY), maxTop) + "px", "important");
          e.preventDefault();
        }
        if (resizing) {
          const minWidth = 250, minHeight = 180;
          const maxWidth = Math.max(minWidth, window.innerWidth - 16);
          const maxHeight = Math.max(minHeight, window.innerHeight - 16);
          const dx = p.x - startX;
          const dy = p.y - startY;
          let width = startWidth;
          let height = startHeight;
          let left = startLeft;
          let top = startTop;
          if (activeDir.includes("e")) width = startWidth + dx;
          if (activeDir.includes("s")) height = startHeight + dy;
          if (activeDir.includes("w")) width = startWidth - dx;
          if (activeDir.includes("n")) height = startHeight - dy;
          width = Math.min(Math.max(minWidth, width), maxWidth);
          height = Math.min(Math.max(minHeight, height), maxHeight);
          if (activeDir.includes("w")) left = startLeft + (startWidth - width);
          if (activeDir.includes("n")) top = startTop + (startHeight - height);
          left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8));
          top = Math.min(Math.max(8, top), Math.max(8, window.innerHeight - height - 8));
          panel.style.setProperty("left", left + "px", "important");
          panel.style.setProperty("top", top + "px", "important");
          panel.style.setProperty("width", width + "px", "important");
          panel.style.setProperty("height", height + "px", "important");
          e.preventDefault();
        }
      }
      function end() {
        if (dragging || resizing) save();
        dragging = false;
        resizing = false;
      }
      apply();
      if (handle) { handle.addEventListener("mousedown", beginDrag); handle.addEventListener("touchstart", beginDrag, { passive:false }); }
      panel.addEventListener("mousedown", beginResize);
      panel.addEventListener("touchstart", beginResize, { passive:false });
      document.addEventListener("mousemove", move);
      document.addEventListener("touchmove", move, { passive:false });
      document.addEventListener("mouseup", end);
      document.addEventListener("touchend", end);
      document.addEventListener("touchcancel", end);
    }


    function hidePayAllButton(btn, label) {
      if (!btn) return;
      btn.dataset.originalLabel = label || btn.textContent || "Button";
      btn.textContent = btn.dataset.originalLabel;
      btn.classList.add("rwph-pay-button-hidden");
      btn.hidden = true;
      btn.disabled = true;
      btn.setAttribute("aria-hidden", "true");
      btn.style.setProperty("display", "none", "important");
      btn.style.setProperty("visibility", "hidden", "important");
      btn.style.setProperty("pointer-events", "none", "important");
      payAllUndoStack.push(btn);
    }

    function undoLastPayAllDisappear() {
      while (payAllUndoStack.length) {
        const btn = payAllUndoStack.pop();
        if (btn && btn.isConnected) {
          btn.classList.remove("rwph-pay-button-hidden");
          btn.hidden = false;
          btn.disabled = false;
          btn.removeAttribute("aria-hidden");
          btn.style.removeProperty("display");
          btn.style.removeProperty("visibility");
          btn.style.removeProperty("pointer-events");
          btn.textContent = btn.dataset.originalLabel || btn.textContent || "Button";
          return true;
        }
      }
      return false;
    }

    function dismissPayAllCopyPopupsSilently() {
      ["rwphFullPopupPanelLive", "rwph-info-popup-panel-live"].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll && document.querySelectorAll(".rwph-info-popup-panel").forEach(function(el) {
        try { el.remove(); } catch (e) {}
      });
    }

    function renderPayAllPanel() {
      const list = document.getElementById("payAllList");
      if (!list) return;
      list.innerHTML = rows.map(function(r, index) {
        const name = r.name || ("Unknown " + (r.id || "unknown"));
        const id = String(r.id || "unknown");
        const payoutRaw = String(Math.round(Number(r.payout || 0)));
        const display = money(r.payout || 0);
        return '<div class="pay-all-row">'
          + '<div class="pay-all-member">' + (index + 1) + '. ' + escapeHtml(name) + ' [' + escapeHtml(id) + ']'
          + '<span class="pay-all-payout">' + escapeHtml(display) + '</span></div>'
          + '<button class="btn secondary copy-small" data-copy-name="' + index + '">Name + ID</button>'
          + '<button class="btn secondary copy-small" data-copy-amount="' + index + '">Amount</button>'
          + '</div>';
      }).join("") || '<div class="pay-all-row"><div class="pay-all-member">No payable members found.</div></div>';
    }

    function openPayAllPanel() {
      storePayAllRowsFallback();
      renderPayAllPanel();
      const panel = document.getElementById("payAllPanel");
      setupMoveResize(panel, ".pay-all-head");
      panel.hidden = false;
    }

    function getCurrentResultsPageHtml() {
      var docClone = document.documentElement.cloneNode(true);

      // Do not include hidden newsletter/raw-html/export helper panels in the page export.
      docClone.querySelectorAll(".rwph-results-html-panel,#rwph-export-html-panel").forEach(function(el) {
        try { el.remove(); } catch (_) {}
      });

      // Make the exported file a clean static results page, not a second live RWPH tool page.
      docClone.querySelectorAll("script").forEach(function(el) {
        try { el.remove(); } catch (_) {}
      });

      var cleanButton = docClone.querySelector("#thisPageHtmlBtn");
      if (cleanButton) {
        cleanButton.textContent = "Export Html";
        cleanButton.removeAttribute("onclick");
        cleanButton.removeAttribute("href");
        cleanButton.setAttribute("data-downloaded-from", "rwph-results-page");
      }

      // Preserve current textarea/input values where useful.
      Array.prototype.forEach.call(document.querySelectorAll("textarea"), function(src) {
        try {
          var id = src.id;
          if (!id) return;
          var dst = docClone.querySelector("#" + CSS.escape(id));
          if (dst) dst.textContent = src.value || src.textContent || "";
        } catch (_) {}
      });

      return "<!doctype html>\n" + docClone.outerHTML;
    }

    function rwphExportHtmlFilename() {
      var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      return "rwph-results-page-" + stamp + ".html";
    }


    function rwphRequestParentHtmlDownload(filename, html, fallbackFn) {
      var requestId = "rwph-export-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      var sent = false;
      var finished = false;
      function fallback(reason) {
        if (finished) return;
        finished = true;
        try { window.removeEventListener("message", onAck, false); } catch (_) {}
        try { fallbackFn && fallbackFn(reason || "Parent download bridge did not respond."); } catch (_) {}
      }
      function onAck(ev) {
        try {
          var data = ev && ev.data;
          if (!data || data.rwphType !== "rwph-results-html-download-ack" || data.requestId !== requestId) return;
          finished = true;
          try { window.removeEventListener("message", onAck, false); } catch (_) {}
          if (!data.ok) fallback("Parent download bridge could not start the download.");
        } catch (_) {}
      }
      try { window.addEventListener("message", onAck, false); } catch (_) {}
      var payload = { rwphType: "rwph-results-html-download-request", requestId: requestId, filename: filename, html: String(html || "") };
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(payload, "*");
          sent = true;
        }
      } catch (_) {}
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
          sent = true;
        }
      } catch (_) {}
      if (sent) {
        setTimeout(function() { fallback("Parent download bridge did not respond, so the local fallback is open below."); }, 900);
        return true;
      }
      try { window.removeEventListener("message", onAck, false); } catch (_) {}
      return false;
    }

    function rwphHtmlDownloadSafeName(filename) {
      return String(filename || "rwph-results-page.html").replace(/[\/:*?"<>|\u0000-\u001f]+/g, "-") || "rwph-results-page.html";
    }

    var rwphLastExportBlobUrl = "";
    function rwphCreateLocalHtmlDownloadUrl(html) {
      try {
        if (rwphLastExportBlobUrl) {
          try { URL.revokeObjectURL(rwphLastExportBlobUrl); } catch (_) {}
          rwphLastExportBlobUrl = "";
        }
        var blob = new Blob([String(html || "")], { type: "text/html;charset=utf-8" });
        rwphLastExportBlobUrl = URL.createObjectURL(blob);
        setTimeout(function() {
          try {
            if (rwphLastExportBlobUrl) URL.revokeObjectURL(rwphLastExportBlobUrl);
            rwphLastExportBlobUrl = "";
          } catch (_) {}
        }, 10 * 60 * 1000);
        return rwphLastExportBlobUrl;
      } catch (e) {
        console.warn("RWPH could not create local HTML download URL:", e);
        return "";
      }
    }

    function rwphOpenExportHtmlFallbackPanel(html, filename, reason, downloadUrl, inlineUrl) {
      return rwphOpenExportFileFallbackPanel("HTML", String(html || ""), filename || "rwph-results-page.html", "text/html;charset=utf-8", reason || "Download fallback ready.", downloadUrl || "", inlineUrl || ((downloadUrl || "") ? String(downloadUrl) + "?inline=1" : ""));
    }

    function rwphDownloadHtmlWithoutBlob(filename, html, reason) {
      var value = String(html || "");
      var safeName = rwphHtmlDownloadSafeName(filename);

      try {
        var blob = new Blob([value], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var ok = rwphTriggerDirectDownload(url, safeName);
        setTimeout(function() { try { URL.revokeObjectURL(url); } catch (_) {} }, 15000);
        if (ok) return true;
      } catch (e) {
        console.warn("RWPH Blob HTML export failed:", e);
      }

      try {
        var href = "data:text/html;charset=utf-8," + encodeURIComponent(value);
        if (href.length < 1900000 && rwphTriggerDirectDownload(href, safeName)) return true;
      } catch (e) {
        console.warn("RWPH data-link HTML export failed:", e);
      }

      rwphOpenExportHtmlFallbackPanel(value, safeName, reason || "Download was blocked by this browser/PDA.");
      return false;
    }

    function rwphStartServerHtmlAttachmentDownload(filename, html, fallbackFn) {
      try {
        var base = String(rwphApiBase || "").replace(/\/+$/, "");
        if (!base || typeof fetch !== "function") return false;
        var safeName = rwphHtmlDownloadSafeName(filename);
        fetch(base + "/api/calc/export-html-file", {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ filename: safeName, html: String(html || "") })
        }).then(function(res) {
          return res.json().catch(function() { return { ok: false, error: "Bad export response" }; });
        }).then(function(data) {
          if (data && data.ok && data.downloadUrl) {
            var downloadUrl = String(data.downloadUrl || "");
            var inlineUrl = String(data.inlineUrl || (downloadUrl ? downloadUrl + "?inline=1" : ""));
            if (!rwphIsPdaOrMobileExportView()) {
              try { rwphTriggerDirectDownload(downloadUrl, data.filename || safeName); } catch (_) {}
              try {
                var iframe = document.createElement("iframe");
                iframe.style.position = "fixed";
                iframe.style.left = "-9999px";
                iframe.style.top = "-9999px";
                iframe.style.width = "1px";
                iframe.style.height = "1px";
                iframe.src = downloadUrl;
                (document.body || document.documentElement).appendChild(iframe);
                setTimeout(function() { try { iframe.remove(); } catch (_) {} }, 60000);
              } catch (_) {}
            }
            // PDA-safe: visible direct link needs a second real tap, which PDA allows more reliably than hidden iframe downloads.
            rwphOpenExportHtmlFallbackPanel(html, safeName, rwphIsPdaOrMobileExportView() ? "PDA-safe HTML export ready. Tap Download below." : "Server download started. If no .html file appears, press Download .html File below.", downloadUrl, inlineUrl);
            return;
          }
          if (fallbackFn) fallbackFn((data && (data.error || data.message)) || "Server export failed.");
        }).catch(function(e) {
          console.warn("RWPH server HTML export failed:", e);
          if (fallbackFn) fallbackFn("Server export failed or was blocked.");
        });
        return true;
      } catch (e) {
        console.warn("RWPH server export setup failed:", e);
        return false;
      }
    }

    function downloadThisResultsPageHtml(ev) {
      try {
        if (ev) {
          if (ev.__rwphExportHandled) return false;
          ev.__rwphExportHandled = true;
          try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
        }
        var html = getCurrentResultsPageHtml();
        var filename = rwphExportHtmlFilename();
        var started = rwphSubmitExportDownloadForm("HTML", filename, html, "text/html;charset=utf-8", "html", false);
        rwphOpenExportHtmlFallbackPanel(html, filename, started ? "HTML download was sent to the browser. If no file appears, use the backup options below." : "HTML automatic download was blocked. Use the backup options below.");
        if (!started && !rwphIsPdaOrMobileExportView()) rwphDownloadHtmlWithoutBlob(filename, html, "Trying local browser download.");
        return false;
      } catch (e) {
        try { rwphOpenExportHtmlFallbackPanel("", "rwph-results-page.html", "Could not export this results page HTML."); } catch (_) {}
        console.warn("RWPH result page HTML export failed:", e);
        return false;
      }
    }

    function openResultsHtmlPanel(panelId) {
      try {
        panelId = panelId || "rwph-results-html-panel-gold";
        var existingPanel = document.getElementById(panelId);
        if (existingPanel) {
          try { location.hash = panelId; } catch (_) {}
          existingPanel.style.display = "flex";
          existingPanel.style.visibility = "visible";
          existingPanel.style.opacity = "1";
          var existingBox = existingPanel.querySelector(".rwph-results-html-box");
          var existingStatus = existingPanel.querySelector(".rwph-results-html-status");
          if (existingStatus) existingStatus.textContent = "Newsletter HTML ready. " + ((existingBox && existingBox.value) ? existingBox.value.length.toLocaleString() : "0") + " characters.";
          return;
        }

        var panel = document.createElement("section");
        panel.id = "rwph-results-html-panel";
        panel.className = "rwph-results-html-panel";
        panel.setAttribute("aria-label", "Results HTML panel");
        panel.innerHTML = ''
          + '<div class="rwph-results-html-head">'
          + '<div><div class="rwph-results-html-title">Newsletter HTML</div><div class="rwph-results-html-note">Compact themed layout for Torn faction newsletters. Built to fit 120 member cards plus main stats.</div></div>'
          + '<button class="rwph-results-html-close" type="button" title="Close">×</button>'
          + '</div>'
          + '<div class="rwph-results-html-status" id="resultsHtmlPanelStatus">Right-click inside the HTML box, choose Select All, then Copy.</div>'
          + '<div class="rwph-results-html-preview-wrap"><div class="rwph-results-html-preview-title">Preview</div><div class="rwph-results-html-preview" id="resultsHtmlPanelPreview"></div></div>'
          + '<div class="rwph-results-html-preview-title">Raw HTML — right-click here, Select All, then Copy</div>'
          + '<textarea class="rwph-results-html-box" id="resultsHtmlPanelBox" readonly spellcheck="false" onfocus="this.select()" onclick="this.focus()" oncontextmenu="this.focus();this.select();"></textarea>';
        (document.body || document.documentElement).appendChild(panel);
        panel.style.display = "flex";
        panel.style.visibility = "visible";
        panel.style.opacity = "1";

        var box = document.getElementById("resultsHtmlPanelBox");
        var status = document.getElementById("resultsHtmlPanelStatus");
        if (box) {
          if (status) status.textContent = "Building themed newsletter HTML...";
          setTimeout(function() {
            try {
              box.value = buildCompactThemedNewsletterHtml();
              var preview = document.getElementById("resultsHtmlPanelPreview");
              if (preview) preview.innerHTML = box.value;
              if (status) status.textContent = "Themed newsletter HTML ready. " + (box.value || "").length.toLocaleString() + " characters.";
              try { box.focus(); box.select(); } catch (_) {}
            } catch (e) {
              if (status) status.textContent = "Could not build results HTML.";
              console.warn("RWPH results HTML build failed:", e);
            }
          }, 25);
        }

        function closeResultsHtmlPanel() {
          try { panel.remove(); } catch (_) {}
        }
        var closeControl = panel.querySelector(".rwph-results-html-close");
        if (closeControl) closeControl.addEventListener("click", closeResultsHtmlPanel);
        panel.addEventListener("keydown", function(ev) {
          if (ev && ev.key === "Escape") closeResultsHtmlPanel();
        });
} catch (e) {
        console.warn("RWPH results HTML panel failed:", e);
      }
    }

    window.rwphExportResultsHtml = downloadThisResultsPageHtml;

    var thisPageHtmlBtn = document.getElementById("thisPageHtmlBtn");
    if (thisPageHtmlBtn) {
      thisPageHtmlBtn.addEventListener("click", downloadThisResultsPageHtml);
    }
    var csvBtn = document.getElementById("csvBtn");
    if (csvBtn) {
      csvBtn.addEventListener("click", exportCsv);
      csvBtn.addEventListener("touchend", exportCsv, { passive: false });
    }
    document.addEventListener("click", function(ev) {
      var target = ev && ev.target;
      var htmlBtn = target && target.closest ? target.closest("#thisPageHtmlBtn") : null;
      if (htmlBtn) {
        downloadThisResultsPageHtml(ev);
        return;
      }
      var csvExportBtn = target && target.closest ? target.closest("#csvBtn") : null;
      if (csvExportBtn) exportCsv(ev);
    }, true);

    window.rwphOpenResultsHtmlPanel = openResultsHtmlPanel;

    function rwphHandleResultsHtmlPanelClick(ev) {
      var target = ev && ev.target;
      var btn = target && target.closest ? target.closest("[data-open-results-html-panel]") : null;
      if (!btn) return;
      var panelId = btn.getAttribute("data-open-results-html-panel") || "rwph-results-html-panel-gold";
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      openResultsHtmlPanel(panelId);
    }

    document.querySelectorAll("[data-open-results-html-panel]").forEach(function(btn) {
      btn.addEventListener("click", rwphHandleResultsHtmlPanelClick);
      btn.addEventListener("touchend", rwphHandleResultsHtmlPanelClick, { passive: false });
    });
    document.addEventListener("click", rwphHandleResultsHtmlPanelClick, true);

    function rwphSelectRawHtmlBox(box) {
      if (!box) return false;
      try {
        box.focus();
        box.select();
        if (typeof box.setSelectionRange === "function") box.setSelectionRange(0, String(box.value || "").length);
        return true;
      } catch (_) {
        return false;
      }
    }

    document.addEventListener("click", function(ev) {
      var box = ev && ev.target && ev.target.closest ? ev.target.closest(".rwph-results-html-box") : null;
      if (!box) return;
      if (Number(ev.detail || 0) >= 3) {
        setTimeout(function(){ rwphSelectRawHtmlBox(box); }, 0);
      }
    }, true);

    // v1.1.386: newsletter raw HTML selection uses PC triple-click, or phone/PDA hold-click browser menu.


    function rwphOpenPaymentsSameTab(ev) {
      try {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        storePayAllRowsFallback();
        storePayAllReportReopenSnapshot();
        var requestId = "rwph-payments-" + Date.now() + "-" + Math.random().toString(16).slice(2);
        var html = "";
        try { html = getCurrentResultsPageHtml(); } catch (_) { html = ""; }
        var filename = "rwph-results-report.html";
        try { filename = rwphExportHtmlFilename ? rwphExportHtmlFilename() : filename; } catch (_) {}
        var payload = {
          rwphType: "rwph-results-open-payments-request",
          requestId: requestId,
          rows: rows || [],
          summary: summary || {},
          html: html,
          filename: filename
        };
        var sent = false;
        var finished = false;
        function fallbackNavigate() {
          if (finished) return;
          finished = true;
          try { window.removeEventListener("message", onAck, false); } catch (_) {}
          var url = "https://www.torn.com/factions.php?step=your&rwphPayAll=1#/tab=controls&subtab=vault";
          // Do not open the vault inside the results iframe/panel. Navigate the main Torn page whenever possible.
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = url;
              try { window.close(); } catch (_) {}
              return;
            }
          } catch (_) {}
          try {
            if (window.top && window.top !== window) {
              window.top.location.href = url;
              return;
            }
          } catch (_) {}
          try {
            if (window.parent && window.parent !== window) {
              window.parent.location.href = url;
              return;
            }
          } catch (_) {}
          window.location.href = url;
        }
        function onAck(messageEvent) {
          try {
            var data = messageEvent && messageEvent.data;
            if (!data || data.rwphType !== "rwph-results-open-payments-ack" || data.requestId !== requestId) return;
            finished = true;
            try { window.removeEventListener("message", onAck, false); } catch (_) {}
            try { window.close(); } catch (_) {}
          } catch (_) {}
        }
        try { window.addEventListener("message", onAck, false); } catch (_) {}
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, "*");
            sent = true;
          }
        } catch (_) {}
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, "*");
            sent = true;
          }
        } catch (_) {}
        if (sent) {
          setTimeout(fallbackNavigate, 1200);
          return false;
        }
        fallbackNavigate();
        return false;
      } catch (e) {
        console.warn("RWPH same-tab Payments navigation failed:", e);
        return true;
      }
    }
    window.rwphOpenPaymentsSameTab = rwphOpenPaymentsSameTab;

    var payAllOpenBtn = document.getElementById("payAllBtn");
    if (payAllOpenBtn) {
      payAllOpenBtn.addEventListener("click", rwphOpenPaymentsSameTab);
      payAllOpenBtn.addEventListener("touchend", rwphOpenPaymentsSameTab, { passive: false });
    }

    document.getElementById("payAllPanel").addEventListener("click", async function(e) {
      const nameBtn = e.target.closest("[data-copy-name]");
      const amountBtn = e.target.closest("[data-copy-amount]");
      if (nameBtn) {
        dismissPayAllCopyPopupsSilently();
        const r = rows[Number(nameBtn.dataset.copyName)] || {};
        const name = r.name || ("Unknown " + (r.id || "unknown"));
        var value = name + " [" + (r.id || "unknown") + "]";
        try { await copyText(value); } catch (e) {}
        // Copy buttons on the Payments Copy Panel are intentionally silent and disappear even if clipboard access is blocked.
        hidePayAllButton(nameBtn, "Name + ID");
      }
      if (amountBtn) {
        dismissPayAllCopyPopupsSilently();
        const r = rows[Number(amountBtn.dataset.copyAmount)] || {};
        var amountValue = String(Math.round(Number(r.payout || 0)));
        try { await copyText(amountValue); } catch (e) {}
        // Copy buttons on the Payments Copy Panel are intentionally silent and disappear even if clipboard access is blocked.
        hidePayAllButton(amountBtn, "Amount");
      }
    });

    const payAllClose = document.getElementById("payAllClose");
    if (payAllClose) payAllClose.addEventListener("click", function() { document.getElementById("payAllPanel").hidden = true; });
    const payAllReopenReport = document.getElementById("payAllReopenReport");
    if (payAllReopenReport) payAllReopenReport.addEventListener("click", function() {
      try {
        storePayAllReportReopenSnapshot();
        var blob = new Blob([getCurrentResultsPageHtml()], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var tab = window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(function(){ try { URL.revokeObjectURL(url); } catch (_) {} }, 30000);
        if (!tab) window.location.href = url;
      } catch (e) { console.warn("Could not reopen RWPH report:", e); }
    });
    const payAllUndo = document.getElementById("payAllUndo");
    if (payAllUndo) payAllUndo.addEventListener("click", function() { undoLastPayAllDisappear(); });
    setupMoveResize(document.getElementById("payAllPanel"), ".pay-all-head");
  </script>
</body>
</html>`;
  }

  function buildResultsLoadingHtml(progressId = "", startedAtMs = Date.now()) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RWPH Loading Results</title>
  <style>
    * { box-sizing:border-box; }
    ${rwphPanelThemeCss(rwphGetPanelThemePreset(), true)}
    :root{
      --rw-bg:#130b07;
      --rw-bg2:#21110b;
      --rw-panel:#211714;
      --rw-panel2:#2b1d18;
      --rw-panel3:#3a241c;
      --rw-line:rgba(184,136,89,.34);
      --rw-line2:rgba(251,191,36,.28);
      --rw-text:#fff2dd;
      --rw-soft:#cfaa8e;
      --rw-gold:#fbbf24;
      --rw-orange:#f97316;
      --rw-green:#22c55e;
      --rw-red:#7f1d1d;
      --rw-shadow:0 18px 55px rgba(0,0,0,.56);

      /* v1.1.386 unified RWPH loading panel palette */
      --rwph-theme-bg:#130b07;
      --rwph-theme-panel:#211714;
      --rwph-theme-panel2:#2b1d18;
      --rwph-theme-panel3:#3a241c;
      --rwph-theme-gold:#fbbf24;
      --rwph-theme-soft:#cfaa8e;
    }
    html,body{
      scrollbar-width:thin;
      scrollbar-color:rgba(245,158,11,.78) rgba(15,23,42,.34);
    }
    *{
      scrollbar-width:thin;
      scrollbar-color:rgba(245,158,11,.78) rgba(15,23,42,.34);
    }
    ::-webkit-scrollbar{width:8px;height:8px;}
    ::-webkit-scrollbar-track{background:rgba(15,23,42,.34);border-radius:999px;}
    ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(245,158,11,.92),rgba(249,115,22,.82));border:2px solid rgba(15,23,42,.50);border-radius:999px;}
    ::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,rgba(251,191,36,.96),rgba(245,158,11,.92));}
    body{
      font-family:Arial,Helvetica,sans-serif;
      color:var(--rw-text);
      background:
        radial-gradient(circle at 12% 0%, rgba(251,191,36,.18), transparent 30%),
        radial-gradient(circle at 88% 8%, rgba(185,28,28,.13), transparent 28%),
        linear-gradient(180deg,#100806 0%,#21110b 48%,#090504 100%);
      padding:16px;
      overflow-x:hidden;
    }
    body::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      background:
        linear-gradient(90deg,rgba(251,191,36,.028) 1px,transparent 1px),
        linear-gradient(0deg,rgba(251,191,36,.022) 1px,transparent 1px);
      background-size:34px 34px;
      opacity:.58;
      mix-blend-mode:screen;
    }
    .rwph-loading-shell{
      position:relative;
      z-index:1;
      width:min(860px,100%);
      margin:0 auto;
      overflow:hidden;
      border:1px solid var(--rw-line);
      border-radius:22px;
      background:
        radial-gradient(circle at 16% 0%,rgba(251,191,36,.12),transparent 34%),
        linear-gradient(180deg,rgba(58,26,21,.96) 0%,rgba(31,27,24,.96) 30%,rgba(14,10,8,.98) 100%);
      box-shadow:var(--rw-shadow),inset 0 1px 0 rgba(255,255,255,.07),0 0 28px rgba(184,136,89,.12);
    }
    .rwph-loading-shell::after{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      border-radius:22px;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.035);
    }
    .rwph-loading-head{
      display:grid;
      grid-template-columns:1fr auto;
      gap:14px;
      align-items:center;
      padding:14px 16px;
      border-bottom:1px solid rgba(184,136,89,.24);
      background:
        linear-gradient(135deg,rgba(68,32,24,.98),rgba(42,31,27,.96) 45%,rgba(20,15,13,.98));
    }
    .rwph-brand{display:flex;align-items:center;gap:12px;min-width:0;}
    .rwph-logo-wrap{
      flex:0 0 auto;
      width:84px;
      height:84px;
      border-radius:22px;
      display:grid;
      place-items:center;
      border:1px solid rgba(251,191,36,.25);
      background:linear-gradient(180deg,rgba(63,29,23,.92),rgba(20,15,13,.96));
      box-shadow:0 12px 28px rgba(0,0,0,.34),0 0 18px rgba(251,191,36,.12),inset 0 1px 0 rgba(255,255,255,.06);
    }
    img{width:70px;height:70px;object-fit:contain;filter:drop-shadow(0 0 18px rgba(251,191,36,.50));}
    .eyebrow{
      display:inline-flex;
      align-items:center;
      gap:6px;
      margin-bottom:4px;
      color:#fde68a;
      font:950 10px/1 Arial,Helvetica,sans-serif;
      letter-spacing:.9px;
      text-transform:uppercase;
    }
    .eyebrow::before{content:"";width:7px;height:7px;border-radius:999px;background:#f59e0b;box-shadow:0 0 12px rgba(245,158,11,.8);}
    h1{margin:0;color:#fff7ed;font:950 22px/1.05 Arial,Helvetica,sans-serif;text-shadow:0 1px 1px #000,0 0 16px rgba(251,191,36,.2);}
    .sub{margin-top:4px;color:var(--rw-soft);font-size:12px;font-weight:800;line-height:1.35;}
    .loading-time{
      display:grid;
      grid-template-columns:auto 1fr;
      align-items:center;
      gap:9px;
      min-width:154px;
      padding:10px 12px;
      border:1px solid rgba(251,191,36,.24);
      border-left:4px solid rgba(245,158,11,.82);
      border-radius:16px;
      background:linear-gradient(180deg,rgba(63,29,23,.88),rgba(20,15,13,.94));
      color:#fff2dd;
      box-shadow:0 12px 28px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.05);
      white-space:nowrap;
    }
    .loading-dot{
      width:10px;
      height:10px;
      border-radius:999px;
      background:#f59e0b;
      box-shadow:0 0 16px rgba(245,158,11,.88);
      animation:rwphLoadPulse 1.18s ease-in-out infinite;
    }
    .time-label{display:block;color:#cfaa8e;font:900 10px/1 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.6px;}
    #rwph-load-seconds{display:block;margin-top:3px;color:#fff;font:950 18px/1 Arial,Helvetica,sans-serif;}
    .rwph-loading-body{padding:14px;display:grid;gap:12px;}
    .rwph-dashboard{
      display:grid;
      grid-template-columns:1.15fr .85fr;
      gap:12px;
      align-items:stretch;
    }
    .rwph-status-card,.rwph-side-card,.wait-note,.loading-list li{
      border:1px solid rgba(184,136,89,.22);
      border-radius:16px;
      background:linear-gradient(180deg,rgba(63,29,23,.72),rgba(20,15,13,.70));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 10px 24px rgba(0,0,0,.22);
    }
    .rwph-status-card{padding:12px;display:grid;gap:10px;}
    .status-title{display:flex;justify-content:space-between;gap:10px;align-items:center;color:#fff;font:950 13px/1.2 Arial,Helvetica,sans-serif;}
    .status-pill{
      flex:0 0 auto;
      border:1px solid rgba(245,158,11,.28);
      border-radius:999px;
      padding:5px 8px;
      color:#fde68a;
      background:rgba(113,63,18,.26);
      font:950 10px/1 Arial,Helvetica,sans-serif;
      text-transform:uppercase;
      letter-spacing:.4px;
    }
    .rwph-live-status{
      color:#fff2dd;
      font-size:12px;
      font-weight:900;
      line-height:1.42;
      padding:10px;
      border:1px solid rgba(251,191,36,.16);
      border-radius:14px;
      background:rgba(10,8,7,.42);
    }
    .rwph-progress-block{display:grid;gap:7px;}
    .rwph-progress-top{display:flex;justify-content:space-between;gap:10px;color:#cfaa8e;font:900 11px/1 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.45px;}
    .rwph-progress-wrap{
      height:13px;
      border-radius:999px;
      overflow:hidden;
      border:1px solid rgba(251,191,36,.28);
      background:rgba(10,8,7,.72);
      box-shadow:inset 0 1px 6px rgba(0,0,0,.55);
    }
    .rwph-progress-bar{
      height:100%;
      width:8%;
      border-radius:999px;
      background:linear-gradient(90deg,#7f1d1d,#f97316,#fbbf24,#fef3c7);
      box-shadow:0 0 16px rgba(245,158,11,.45);
      transition:width .35s ease;
    }
    .rwph-open-results-button{
      width:100%;
      border:1px solid rgba(184,136,89,.26);
      border-left:4px solid rgba(148,163,184,.70);
      border-radius:15px;
      background:linear-gradient(180deg,rgba(63,29,23,.72),rgba(20,15,13,.82));
      color:#cfaa8e;
      font:950 15px/1 Arial,Helvetica,sans-serif;
      padding:13px 12px;
      box-shadow:0 14px 30px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.05);
      cursor:not-allowed;
      opacity:.86;
      transition:background .2s ease,border-color .2s ease,color .2s ease,opacity .2s ease,transform .2s ease;
    }
    .rwph-open-results-button:disabled{filter:saturate(.75);}
    .rwph-open-results-button[data-state="ready"]{
      border-color:rgba(34,197,94,.40);
      border-left-color:rgba(34,197,94,.86);
      background:linear-gradient(180deg,rgba(22,101,52,.98),rgba(20,83,45,.95) 45%,rgba(5,46,22,.96));
      color:#dcfce7;
      cursor:pointer;
      opacity:1;
      box-shadow:0 14px 30px rgba(0,0,0,.30),0 0 18px rgba(34,197,94,.16),inset 0 1px 0 rgba(255,255,255,.06);
    }
    .rwph-open-results-button[data-state="ready"]:hover{transform:translateY(-1px);}
    .rwph-side-card{padding:12px;display:grid;gap:9px;}
    .side-title{color:#fde68a;font:950 12px/1 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.55px;}
    .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .mini{
      border:1px solid rgba(184,136,89,.18);
      border-radius:13px;
      background:rgba(10,8,7,.34);
      padding:9px;
      min-height:62px;
    }
    .mini b{display:block;color:#fff;font-size:12px;margin-bottom:4px;}
    .mini span{display:block;color:#cfaa8e;font-size:11px;font-weight:800;line-height:1.32;}
    .loading-list{margin:0;padding:0;display:grid;gap:8px;list-style:none;counter-reset:rwphStep;}
    .loading-list li{
      counter-increment:rwphStep;
      position:relative;
      display:grid;
      grid-template-columns:32px 1fr;
      gap:10px;
      align-items:center;
      color:#fff2dd;
      font-size:12px;
      font-weight:850;
      line-height:1.35;
      padding:10px;
      transition:border-color .2s ease,background .2s ease,color .2s ease,transform .2s ease;
    }
    .loading-list li::before{
      content:counter(rwphStep);
      width:30px;
      height:30px;
      display:grid;
      place-items:center;
      border-radius:12px;
      border:1px solid rgba(251,191,36,.25);
      background:linear-gradient(180deg,rgba(127,29,29,.55),rgba(63,29,23,.68));
      color:#fde68a;
      font:950 12px/1 Arial,Helvetica,sans-serif;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 12px rgba(245,158,11,.10);
    }
    .loading-list li.rwph-load-step-active{
      border-color:rgba(245,158,11,.48);
      background:linear-gradient(180deg,rgba(127,29,29,.38),rgba(63,29,23,.66));
      color:#fff7ed;
      transform:translateY(-1px);
    }
    .loading-list li.rwph-load-step-active::before{background:linear-gradient(180deg,#b45309,#7c2d12);box-shadow:0 0 18px rgba(245,158,11,.42);}
    .loading-list li.rwph-load-step-done{
      border-color:rgba(34,197,94,.38);
      background:linear-gradient(180deg,rgba(20,83,45,.28),rgba(20,15,13,.62));
      color:#dcfce7;
    }
    .loading-list li.rwph-load-step-done::before{
      content:"✓";
      background:linear-gradient(180deg,#22c55e,#166534);
      color:#ecfdf5;
      border-color:rgba(34,197,94,.34);
      box-shadow:0 0 16px rgba(34,197,94,.34);
    }
    .wait-note{
      padding:11px 12px;
      border-color:rgba(250,204,21,.24);
      background:linear-gradient(180deg,rgba(113,63,18,.26),rgba(20,15,13,.66));
      color:#fef3c7;
      font-size:12px;
      font-weight:850;
      line-height:1.45;
    }
    .wait-note b{color:#fff7d6;}
    @keyframes rwphLoadPulse{0%,100%{transform:scale(.82);opacity:.68;}50%{transform:scale(1.22);opacity:1;}}
    @media (max-width:740px){
      body{padding:10px;}
      .rwph-loading-head{grid-template-columns:1fr;align-items:stretch;}
      .loading-time{justify-content:center;grid-template-columns:auto auto;}
      .rwph-dashboard{grid-template-columns:1fr;}
      .mini-grid{grid-template-columns:1fr;}
      h1{font-size:19px;}
    }
  </style>
</head>
<body>
  <main class="rwph-loading-shell">
    <div class="rwph-loading-head">
      <div class="rwph-brand">
        <div class="rwph-logo-wrap"><img src="${RWPH_LAUNCHER_LOGO_DATA_URI}" alt="RWPH"></div>
        <div>
          <div class="eyebrow">Ranked War Payout Helper</div>
          <h1>Building Results</h1>
          <div class="sub">RWPH is calculating the selected war with the same bronze main-panel theme and backend cache rules.</div>
        </div>
      </div>
      <div class="loading-time">
        <span class="loading-dot"></span>
        <span><span class="time-label">Elapsed</span><b id="rwph-load-seconds">0 sec</b></span>
      </div>
    </div>

    <section class="rwph-loading-body">
      <div class="rwph-dashboard">
        <div class="rwph-status-card">
          <div class="status-title">
            <span>Live calculation status</span>
            <span class="status-pill">Server side</span>
          </div>
          <div class="rwph-progress-block">
            <div class="rwph-progress-top"><span>Calculation progress</span><span>Live backend stages</span></div>
            <div class="rwph-progress-wrap" aria-label="Calculation progress"><div id="rwph-progress-bar" class="rwph-progress-bar"></div></div>
          </div>
          <div id="rwph-live-status" class="rwph-live-status">Starting calculation. Keep this tab open. The results button unlocks when data is complete.</div>
          <button id="rwph-open-results-button" class="rwph-open-results-button" type="button" disabled aria-disabled="true" data-state="locked">Results Locked — Loading Data</button>
        </div>

        <aside class="rwph-side-card" aria-label="Loading notes">
          <div class="side-title">What RWPH is doing</div>
          <div class="mini-grid">
            <div class="mini"><b>Cache first</b><span>Uses the backend cache when a matching war report is already saved.</span></div>
            <div class="mini"><b>Safe fetch</b><span>Retries Torn API delays and keeps progress updated while it works.</span></div>
            <div class="mini"><b>Manual open</b><span>The button stays visible, locked while loading, then unlocks when data is complete.</span></div>
            <div class="mini"><b>Same rules</b><span>Basic and Advanced cache blocking stays controlled by the backend.</span></div>
          </div>
        </aside>
      </div>

      <ul class="loading-list" aria-label="What RWPH is loading">
        <li class="rwph-load-step-active" data-rwph-load-step="0">Verifies your licence and confirms server access.</li>
        <li data-rwph-load-step="1">Checks the backend/database report cache for this finished war and payout setup.</li>
        <li data-rwph-load-step="2">Fetches and sorts war hits, outside hits, retals, and assists.</li>
        <li data-rwph-load-step="3">Applies your weights and splits the Member Payout across members.</li>
      </ul>

      <div class="wait-note"><b>Keep this loading tab open:</b> closing it before the calculation finishes can cancel the backend job. When the data is complete, click <b>Open Results Page</b> to show the full results and tools.</div>
    </section>
  </main>
  <script>
    (function(){
      var started = Number(${JSON.stringify(Number(startedAtMs || Date.now()))}) || Date.now();
      var el = document.getElementById("rwph-load-seconds");
      var statusEl = document.getElementById("rwph-live-status");
      var openResultsButton = document.getElementById("rwph-open-results-button");
      var barEl = document.getElementById("rwph-progress-bar");
      var steps = Array.prototype.slice.call(document.querySelectorAll("[data-rwph-load-step]"));
      var rwphProgressId = ${JSON.stringify(String(progressId || ""))};
      var rwphApiBase = ${JSON.stringify(PAYWALL_API_BASE)};
      var highestDoneStep = -1;
      var rwphManualResultsHtml = "";
      window.rwphManualResultsHtml = "";
      var rwphManualResultsStorageKey = rwphProgressId ? ("rwph_manual_results_html_" + rwphProgressId) : "";
      function formatElapsed(total){
        total = Math.max(0, Math.floor(Number(total) || 0));
        var mins = Math.floor(total / 60);
        var secs = total % 60;
        if (mins <= 0) return total + " " + (total === 1 ? "sec" : "secs");
        return mins + "m " + String(secs).padStart(2, "0") + "s";
      }
      function updateStepDots(total){
        // Dots are completed by live server progress, not by elapsed time.
      }
      function progressFromStep(stepIndex){
        var doneIndex = Math.max(0, Math.min(4, Math.floor(Number(stepIndex) || 0)));
        return [12, 28, 62, 82, 96][doneIndex] || 8;
      }
      function setProgressBar(percent){
        if (!barEl) barEl = document.getElementById("rwph-progress-bar");
        if (!barEl) return;
        var safe = Number(percent);
        if (!isFinite(safe)) safe = 8;
        safe = Math.max(3, Math.min(100, safe));
        barEl.style.width = safe + "%";
      }
      var currentProgressPercent = 3;
      function paintSteps(activeStep, percent){
        var active = Number(activeStep);
        if (!isFinite(active)) active = 0;
        active = Math.max(0, Math.min(4, Math.floor(active)));
        var completeAll = Number(percent) >= 99.5 || active >= 5;
        steps.forEach(function(step, index){
          var isDone = completeAll || index < active;
          var isActive = !completeAll && index === active;
          step.classList.toggle("rwph-load-step-done", isDone);
          step.classList.toggle("rwph-load-step-active", isActive);
        });
        highestDoneStep = completeAll ? 4 : Math.max(highestDoneStep, active - 1);
      }
      window.rwphSetLoadingProgress = function(percent, label, stepIndex){
        var safePercent = Number(percent);
        if (!isFinite(safePercent)) safePercent = progressFromStep(stepIndex);
        safePercent = Math.max(currentProgressPercent, Math.max(3, Math.min(100, safePercent)));
        currentProgressPercent = safePercent;
        paintSteps(stepIndex, safePercent);
        setProgressBar(safePercent);
        if (statusEl && label) statusEl.textContent = String(label);
      };
      window.rwphSetLoadingStepDone = function(stepIndex, updateBar){
        var activeStep = Number(stepIndex);
        if (!isFinite(activeStep)) return;
        activeStep = Math.max(0, Math.min(4, Math.floor(activeStep)));
        var percent = progressFromStep(activeStep);
        paintSteps(activeStep, percent);
        if (updateBar !== false) setProgressBar(percent);
      };
      function rwphOpenManualResultsPage(){
        var html = String(rwphManualResultsHtml || window.rwphManualResultsHtml || "");
        if (!html && rwphManualResultsStorageKey) {
          try {
            var raw = localStorage.getItem(rwphManualResultsStorageKey);
            var stored = raw ? JSON.parse(raw) : null;
            if (stored && stored.progressId === rwphProgressId && stored.html) html = String(stored.html || "");
          } catch (_) {}
        }
        if (!html) {
          if (statusEl) statusEl.textContent = "Results are not ready yet. Wait until the calculation says data complete.";
          return;
        }
        try {
          if (window.rwphLoadingTimer) clearInterval(window.rwphLoadingTimer);
          if (window.rwphLoadingCatchupTimer) clearInterval(window.rwphLoadingCatchupTimer);
          if (window.rwphLoadingProgressPoller) clearInterval(window.rwphLoadingProgressPoller);
          if (window.rwphManualResultsStoragePoller) clearInterval(window.rwphManualResultsStoragePoller);
        } catch (_) {}
        try {
          if (rwphManualResultsStorageKey) localStorage.removeItem(rwphManualResultsStorageKey);
        } catch (_) {}
        try {
          var topUrl = String(location.href || "");
          try {
            if (parent && parent.location && parent.location.href && String(parent.location.href) !== "about:blank") topUrl = String(parent.location.href);
          } catch (_) {}
          localStorage.setItem("rw_payout_helper_last_results_html_open", JSON.stringify({
            active: true,
            url: topUrl,
            createdAt: Date.now(),
            html: String(html || "")
          }));
          localStorage.setItem("rw_payout_helper_results_loading_panel_state", JSON.stringify({
            active: true,
            type: "results",
            url: topUrl,
            progressId: rwphProgressId,
            startedAtMs: started,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            html: String(html || "")
          }));
        } catch (_) {}
        document.open();
        document.write(html);
        document.close();
      }

      function rwphShowManualResultsButton(html){
        if (html) {
          rwphManualResultsHtml = String(html || "");
          window.rwphManualResultsHtml = rwphManualResultsHtml;
        }
        if (openResultsButton) {
          openResultsButton.hidden = false;
          openResultsButton.disabled = false;
          openResultsButton.setAttribute("aria-disabled", "false");
          openResultsButton.setAttribute("data-state", "ready");
          openResultsButton.textContent = "Open Results Page";
        }
        window.rwphSetLoadingProgress(100, "Results data complete. Click Open Results Page when you are ready.", 4);
        if (statusEl) statusEl.textContent = "Results data complete. Click Open Results Page when you are ready.";
      }

      function rwphCheckStoredManualResults(){
        if (!rwphManualResultsStorageKey || rwphManualResultsHtml) return;
        try {
          var raw = localStorage.getItem(rwphManualResultsStorageKey);
          var stored = raw ? JSON.parse(raw) : null;
          if (stored && stored.progressId === rwphProgressId && stored.html) {
            rwphShowManualResultsButton(stored.html);
          }
        } catch (_) {}
      }

      window.rwphShowManualResultsButton = rwphShowManualResultsButton;
      if (openResultsButton) openResultsButton.addEventListener("click", function(ev){
        if (openResultsButton.disabled || openResultsButton.getAttribute("data-state") !== "ready") {
          ev.preventDefault();
          if (statusEl) statusEl.textContent = "Results are still loading. The button will unlock when data is complete.";
          return;
        }
        rwphOpenManualResultsPage();
      });

      window.addEventListener("message", function(event){
        var data = event && event.data;
        if (!data) return;
        if (data.rwphType === "rwph-manual-results-ready") {
          if (rwphProgressId && data.progressId && data.progressId !== rwphProgressId) return;
          rwphShowManualResultsButton(data.html || "");
          try {
            var topUrl = String(location.href || "");
            try {
              if (parent && parent.location && parent.location.href && String(parent.location.href) !== "about:blank") topUrl = String(parent.location.href);
            } catch (_) {}
            if (data.html) localStorage.setItem("rw_payout_helper_results_loading_panel_state", JSON.stringify({
              active: true,
              type: "ready",
              url: topUrl,
              progressId: rwphProgressId,
              startedAtMs: started,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              html: String(data.html || "")
            }));
          } catch (_) {}
          return;
        }
        if (data.rwphType !== "rwph-calc-progress") return;
        if (isFinite(Number(data.percent))) window.rwphSetLoadingProgress(Number(data.percent), data.label || "", data.step);
        else window.rwphSetLoadingStepDone(data.step);
      });
      function pollProgressFromLoadingTab(){
        if (!rwphProgressId || !rwphApiBase || typeof fetch !== "function") return;
        fetch(rwphApiBase + "/api/calc/progress", {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ progressId: rwphProgressId })
        }).then(function(res){ return res && res.json ? res.json() : null; })
          .then(function(json){
            if (json && json.ok) {
              if (Number(json.percent) >= 0) window.rwphSetLoadingProgress(Number(json.percent), json.label || "", Number(json.step));
              else if (Number(json.step) >= 0) window.rwphSetLoadingStepDone(Number(json.step));
              if (json.resultHtmlReady && !rwphManualResultsHtml) {
                try {
                  fetch(rwphApiBase + "/api/calc/result-html?progressId=" + encodeURIComponent(rwphProgressId), { cache: "no-store", headers: { "ngrok-skip-browser-warning": "true" } })
                    .then(function(r){ return r && r.json ? r.json() : null; })
                    .then(function(payload){ if (payload && payload.ok && payload.ready && payload.html) rwphShowManualResultsButton(payload.html); })
                    .catch(function(){});
                } catch (_) {}
              }
              if (statusEl && json.label) statusEl.textContent = json.label;
              if (statusEl && json.cancelled) statusEl.textContent = json.label || "Calculation cancelled because this loading panel was closed.";
            }
          }).catch(function(){});
      }
      function tick(){
        if (!el) el = document.getElementById("rwph-load-seconds");
        if (!el) return;
        var total = Math.max(0, Math.floor((Date.now() - started) / 1000));
        el.textContent = formatElapsed(total);
        updateStepDots(total);
      }
      function wake(){
        tick();
        pollProgressFromLoadingTab();
        setTimeout(tick, 80);
        setTimeout(tick, 350);
        setTimeout(pollProgressFromLoadingTab, 500);
      }
      tick();
      window.rwphLoadingTimer = setInterval(tick, 1000);
      window.rwphLoadingCatchupTimer = setInterval(tick, 5000);
      setTimeout(tick, 250);
      setTimeout(tick, 1000);
      setTimeout(tick, 61000);
      document.addEventListener("visibilitychange", wake);
      window.addEventListener("pageshow", wake);
      window.addEventListener("focus", wake);
      window.addEventListener("online", wake);
      rwphCheckStoredManualResults();
      window.rwphManualResultsStoragePoller = setInterval(rwphCheckStoredManualResults, 1000);
      pollProgressFromLoadingTab();
      window.rwphLoadingProgressPoller = setInterval(pollProgressFromLoadingTab, 1500);
    })();
  </script>
</body>
</html>`;
  }


  function rwphFormatResultsLoadingElapsed(startedAt) {
    const total = Math.max(0, Math.floor((Date.now() - Number(startedAt || Date.now())) / 1000));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    if (mins <= 0) return `${total} ${total === 1 ? "sec" : "secs"}`;
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  function rwphStartResultsLoadingCounter(tab, startedAt) {
    const started = Number(startedAt || Date.now());
    let missingTicks = 0;
    let closedTicks = 0;
    let timer = null;
    const tick = () => {
      try {
        if (!tab) {
          if (timer) clearInterval(timer);
          return;
        }
        if (tab.closed) {
          closedTicks += 1;
          // v1.1.386: mobile/PDA can briefly report popup tabs as closed while backgrounded.
          // Do not kill the parent timer unless it has looked closed for a long time.
          if (closedTicks > 60 && timer) clearInterval(timer);
          return;
        }
        closedTicks = 0;
        const doc = tab.document;
        const el = doc && doc.getElementById && doc.getElementById("rwph-load-seconds");
        if (!el) {
          missingTicks += 1;
          if (missingTicks > 120 && timer) clearInterval(timer);
          return;
        }
        missingTicks = 0;
        el.textContent = rwphFormatResultsLoadingElapsed(started);
      } catch (_) {
        // A refreshed blob/loading tab can be temporarily inaccessible while it reloads.
        // Keep the counter alive so it reconnects instead of freezing permanently.
        missingTicks += 1;
        if (missingTicks > 120 && timer) clearInterval(timer);
      }
    };
    timer = setInterval(tick, 1000);
    setTimeout(tick, 120);
    setTimeout(tick, 1100);
    setTimeout(tick, 5000);
    setTimeout(tick, 61000);
    return () => clearInterval(timer);
  }

  function rwphLoadingPercentFromStep(stepIndex) {
    const doneIndex = Math.max(0, Math.min(4, Number(stepIndex || 0)));
    return [12, 28, 62, 82, 96][doneIndex] || 8;
  }

  function rwphPostResultsLoadingStep(tab, stepIndex, percent = null, label = "") {
    const doneIndex = Math.max(0, Math.min(4, Number(stepIndex || 0)));
    const safePercent = Number.isFinite(Number(percent)) ? Math.max(3, Math.min(100, Number(percent))) : rwphLoadingPercentFromStep(doneIndex);
    try {
      if (tab && !tab.closed && typeof tab.postMessage === "function") {
        tab.postMessage({ rwphType: "rwph-calc-progress", step: doneIndex, percent: safePercent, label: String(label || "") }, "*");
      }
    } catch (_) {}
    try {
      if (tab && tab.window && typeof tab.window.postMessage === "function") {
        tab.window.postMessage({ rwphType: "rwph-calc-progress", step: doneIndex, percent: safePercent, label: String(label || "") }, "*");
      }
    } catch (_) {}
  }

  function rwphPaintResultsLoadingSteps(doc, activeStep, percent) {
    const steps = doc && doc.querySelectorAll ? Array.prototype.slice.call(doc.querySelectorAll("[data-rwph-load-step]")) : [];
    if (!steps.length) return false;
    const safeActive = Math.max(0, Math.min(4, Math.floor(Number(activeStep || 0))));
    const completeAll = Number(percent) >= 99.5;
    steps.forEach((step, index) => {
      const isDone = completeAll || index < safeActive;
      const isActive = !completeAll && index === safeActive;
      step.classList.toggle("rwph-load-step-done", isDone);
      step.classList.toggle("rwph-load-step-active", isActive);
    });
    return true;
  }

  function rwphSetResultsLoadingStepDone(tab, stepIndex, percent = null, label = "") {
    const activeStep = Math.max(0, Math.min(4, Number(stepIndex || 0)));
    const safePercent = Number.isFinite(Number(percent)) ? Math.max(3, Math.min(100, Number(percent))) : rwphLoadingPercentFromStep(activeStep);
    try {
      if (!tab || tab.closed) return;
      rwphPostResultsLoadingStep(tab, activeStep, safePercent, label);
      // Direct DOM update helps Torn PDA/phone; postMessage helps PC/desktop popups.
      const doc = tab.document;
      if (rwphPaintResultsLoadingSteps(doc, activeStep, safePercent)) {
        const bar = doc.getElementById && doc.getElementById("rwph-progress-bar");
        if (bar) {
          const current = Number(String(bar.style.width || "0").replace("%", "")) || 0;
          bar.style.width = Math.max(current, safePercent) + "%";
        }
        const status = doc.getElementById && doc.getElementById("rwph-live-status");
        if (status && label) status.textContent = String(label);
        return;
      }
      if (tab.window && typeof tab.window.rwphSetLoadingProgress === "function") {
        tab.window.rwphSetLoadingProgress(safePercent, label, activeStep);
      } else if (tab.window && typeof tab.window.rwphSetLoadingStepDone === "function") {
        tab.window.rwphSetLoadingStepDone(activeStep);
      }
    } catch (_) {
      try {
        rwphPostResultsLoadingStep(tab, activeStep, safePercent, label);
        if (tab && tab.window && typeof tab.window.rwphSetLoadingProgress === "function") {
          tab.window.rwphSetLoadingProgress(safePercent, label, activeStep);
        } else if (tab && tab.window && typeof tab.window.rwphSetLoadingStepDone === "function") {
          tab.window.rwphSetLoadingStepDone(activeStep);
        }
      } catch (__) {}
    }
  }

  function rwphSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }

  async function rwphShowResultsLoadingCompletion(tab) {
    try {
      if (!tab || tab.closed) return;
      // v1.1.194: after the server returns, later calculation stages can finish too fast to see.
      // Light the remaining loading dots in order before replacing the loading page with results.
      const completion = [
        [1, 64, "Attack/report data loaded"],
        [2, 76, "Hits sorted"],
        [3, 88, "Payout split applied"],
        [4, 100, "Results ready"],
      ];
      for (const [step, percent, label] of completion) {
        rwphSetResultsLoadingStepDone(tab, step, percent, label);
        await rwphSleep(60);
      }
    } catch (_) {}
  }

  function rwphStartResultsProgressPolling(tab, progressId, onClosed = null) {
    const id = String(progressId || "").trim();
    const hasResultsTab = !!tab;
    if (!id) return () => {};
    let stopped = false;
    let pending = false;
    let timer = null;
    let closedSince = 0;
    let closedChecks = 0;
    const closedGraceMs = 45000;

    const poll = () => {
      if (stopped || pending) return;
      try {
        if (hasResultsTab && tab.closed) {
          if (tab.rwphIsLoadingPanel) {
            stopped = true;
            if (timer) clearInterval(timer);
            try { if (typeof onClosed === "function") onClosed(); } catch (_) {}
            return;
          }
          // v1.1.386: do not cancel just because a phone/PDA browser temporarily pauses
          // or misreports a background loading tab. Only treat it as closed after a long,
          // repeated closed state while the main Torn tab is visible again.
          if (document.visibilityState === "hidden") return;
          if (!closedSince) closedSince = Date.now();
          closedChecks += 1;
          if (Date.now() - closedSince >= closedGraceMs && closedChecks >= 12) {
            stopped = true;
            if (timer) clearInterval(timer);
            try { if (typeof onClosed === "function") onClosed(); } catch (_) {}
          }
          return;
        }
        closedSince = 0;
        closedChecks = 0;
      } catch (_) {
        closedSince = 0;
        closedChecks = 0;
      }
      pending = true;
      GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}/api/calc/progress`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ progressId: id }),
        timeout: 15000,
        onload: (res) => {
          pending = false;
          try {
            const json = JSON.parse(res.responseText || "{}");
            if (json && json.ok && Number(json.step) >= 0) {
              rwphSetResultsLoadingStepDone(tab, Number(json.step), Number(json.percent), json.label || "");
            }
          } catch (_) {}
        },
        onerror: () => { pending = false; },
        ontimeout: () => { pending = false; },
      });
    };

    timer = setInterval(poll, 1500);
    setTimeout(poll, 80);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }

  function rwphStartResultsTabCloseWatcher(tab, progressId, onClosed = null) {
    if (!tab) return () => {};
    const id = String(progressId || "").trim();
    let stopped = false;
    let cancelled = false;
    let timer = null;
    let closedSince = 0;
    let closedChecks = 0;
    const closedGraceMs = 45000;
    const cancelOnce = () => {
      if (stopped || cancelled) return;
      try {
        if (tab && !tab.closed) {
          closedSince = 0;
          closedChecks = 0;
          return;
        }
      } catch (_) {
        // Temporary cross-document reload/access errors are not a close signal.
        closedSince = 0;
        closedChecks = 0;
        return;
      }
      // v1.1.386: background tab pauses should not cancel calculations. Only cancel after
      // the loading window has looked closed repeatedly, with a grace period, while the main tab is visible.
      if (document.visibilityState === "hidden") return;
      if (!closedSince) closedSince = Date.now();
      closedChecks += 1;
      if (Date.now() - closedSince < closedGraceMs || closedChecks < 12) return;
      cancelled = true;
      if (timer) clearInterval(timer);
      rwphSendCalcCancel(id, "Results loading tab was closed before RWPH finished calculating.");
      try { if (typeof onClosed === "function") onClosed(); } catch (_) {}
    };
    timer = setInterval(cancelOnce, 2000);
    setTimeout(cancelOnce, 5000);
    window.addEventListener("focus", cancelOnce);
    document.addEventListener("visibilitychange", cancelOnce);
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }

  function rwphCloseExistingResultsLoadingPanel() {
    try {
      const existing = document.getElementById("rwph-results-loading-panel");
      if (existing) existing.remove();
    } catch (_) {}
  }

  function rwphStyleResultsLoadingPanelControls(panel) {
    if (!panel) return;
    try {
      panel.querySelectorAll(":scope > .resize-handle").forEach((h) => {
        const dir = h.dataset.resizeDir || "";
        h.style.setProperty("position", "absolute", "important");
        h.style.setProperty("width", "18px", "important");
        h.style.setProperty("height", "18px", "important");
        h.style.setProperty("z-index", "70", "important");
        h.style.setProperty("touch-action", "none", "important");
        h.style.setProperty("-webkit-user-select", "none", "important");
        h.style.setProperty("user-select", "none", "important");
        h.style.setProperty("opacity", ".95", "important");
        h.style.setProperty("background", "rgba(2,6,23,.18)", "important");
        h.style.setProperty("border-color", "rgba(245,158,11,.88)", "important");
        h.style.setProperty("border-style", "solid", "important");
        h.style.setProperty("box-sizing", "border-box", "important");
        h.style.setProperty("filter", "drop-shadow(0 0 6px rgba(245,158,11,.22))", "important");
        if (dir === "se") {
          h.style.setProperty("right", "5px", "important");
          h.style.setProperty("bottom", "5px", "important");
          h.style.setProperty("cursor", "nwse-resize", "important");
          h.style.setProperty("border-width", "0 2px 2px 0", "important");
          h.style.setProperty("border-radius", "0 0 8px 0", "important");
        } else if (dir === "sw") {
          h.style.setProperty("left", "5px", "important");
          h.style.setProperty("bottom", "5px", "important");
          h.style.setProperty("cursor", "nesw-resize", "important");
          h.style.setProperty("border-width", "0 0 2px 2px", "important");
          h.style.setProperty("border-radius", "0 0 0 8px", "important");
        } else if (dir === "nw") {
          h.style.setProperty("left", "5px", "important");
          h.style.setProperty("top", "5px", "important");
          h.style.setProperty("cursor", "nwse-resize", "important");
          h.style.setProperty("border-width", "2px 0 0 2px", "important");
          h.style.setProperty("border-radius", "8px 0 0 0", "important");
        }
      });

      if (window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches) {
        panel.querySelectorAll(":scope > .resize-handle").forEach((h) => {
          h.style.setProperty("width", "30px", "important");
          h.style.setProperty("height", "30px", "important");
          h.style.setProperty("z-index", "90", "important");
          h.style.setProperty("background", "rgba(2,6,23,.28)", "important");
          if (h.dataset.resizeDir === "se") {
            h.style.setProperty("right", "3px", "important");
            h.style.setProperty("bottom", "3px", "important");
            h.style.setProperty("border-width", "0 3px 3px 0", "important");
          } else if (h.dataset.resizeDir === "sw") {
            h.style.setProperty("left", "3px", "important");
            h.style.setProperty("bottom", "3px", "important");
            h.style.setProperty("border-width", "0 0 3px 3px", "important");
          } else if (h.dataset.resizeDir === "nw") {
            h.style.setProperty("left", "3px", "important");
            h.style.setProperty("top", "3px", "important");
            h.style.setProperty("border-width", "3px 0 0 3px", "important");
          }
        });
      }
    } catch (_) {}
  }

  function rwphCreateResultsLoadingPanel(progressId = "", loadingHtml = "", startedAtMs = Date.now()) {
    rwphCloseExistingResultsLoadingPanel();

    const savedLayoutKey = "rwph_results_loading_panel_layout";
    let closed = false;
    let fullscreen = false;
    let previousLayout = null;

    const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);
    const point = (ev) => {
      const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]);
      return { x: Number((t && t.clientX) || ev.clientX || 0), y: Number((t && t.clientY) || ev.clientY || 0) };
    };

    const panel = document.createElement("div");
    panel.id = "rwph-results-loading-panel";
    panel.className = "rwph-floating-panel rwph-results-loading-panel";
    panel.dataset.layoutKey = savedLayoutKey;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "RWPH results loading panel");
    panel.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:2147483600",
      "width:min(900px,calc(100vw - 24px))",
      "height:min(820px,calc(100vh - 24px))",
      "min-width:min(320px,calc(100vw - 24px))",
      "min-height:min(420px,calc(100vh - 24px))",
      "display:flex",
      "flex-direction:column",
      "border-radius:18px",
      "border:1px solid rgba(251,191,36,.42)",
      "background:linear-gradient(180deg,rgba(33,23,20,.99),rgba(11,7,5,.99))",
      "box-shadow:0 22px 70px rgba(0,0,0,.62),0 0 28px rgba(184,136,89,.18)",
      "overflow:hidden",
      "box-sizing:border-box",
      "color:#fff2dd",
    ].join(";");

    const head = document.createElement("div");
    head.className = "rwph-results-loading-panel-head";
    head.style.cssText = [
      "position:relative",
      "z-index:2147483602",
      "flex:0 0 auto",
      "height:54px",
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:10px",
      "padding:8px 10px 8px 12px",
      "background:linear-gradient(135deg,rgba(68,32,24,.99),rgba(20,15,13,.99))",
      "border-bottom:1px solid rgba(184,136,89,.34)",
      "cursor:move",
      "user-select:none",
      "touch-action:none",
      "color:#fff2dd",
      "font:950 12px/1 Arial,Helvetica,sans-serif",
      "box-sizing:border-box",
    ].join(";");

    const title = document.createElement("div");
    title.style.cssText = "min-width:0;flex:1 1 auto;overflow:hidden;";
    title.innerHTML = '<div style="color:#fde68a;font-size:10px;letter-spacing:.75px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Ranked War Payout Helper</div><div style="color:#fff7ed;font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Results Loading</div>';

    const controls = document.createElement("div");
    controls.style.cssText = [
      "position:relative",
      "z-index:2147483603",
      "display:flex",
      "align-items:center",
      "gap:8px",
      "flex:0 0 auto",
      "pointer-events:auto",
    ].join(";");

    const makeControlButton = (label, titleText, fontSize = "14px") => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.title = titleText;
      btn.setAttribute("aria-label", titleText);
      btn.style.cssText = [
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "width:36px",
        "height:36px",
        "min-width:36px",
        "min-height:36px",
        "border-radius:12px",
        "border:1px solid rgba(251,191,36,.36)",
        "background:linear-gradient(180deg,rgba(63,29,23,.98),rgba(20,15,13,.98))",
        "color:#fff7ed",
        `font:950 ${fontSize}/1 Arial,Helvetica,sans-serif`,
        "cursor:pointer",
        "box-shadow:0 1px 0 rgba(255,255,255,.045) inset,0 12px 26px rgba(0,0,0,.26)",
        "text-shadow:0 1px 0 rgba(0,0,0,.75)",
        "padding:0",
        "margin:0",
        "pointer-events:auto",
      ].join(";");
      btn.addEventListener("mousedown", (ev) => ev.stopPropagation());
      btn.addEventListener("touchstart", (ev) => ev.stopPropagation(), { passive: true });
      return btn;
    };

    const fullBtn = makeControlButton("⛶", "Fullscreen results loading panel", "16px");
    const closeBtn = makeControlButton("×", "Close results loading panel", "22px");

    controls.appendChild(fullBtn);
    controls.appendChild(closeBtn);
    head.appendChild(title);
    head.appendChild(controls);

    const frame = document.createElement("iframe");
    frame.id = "rwph-results-loading-frame";
    frame.setAttribute("title", "RWPH results loading");
    frame.style.cssText = [
      "position:relative",
      "z-index:1",
      "flex:1 1 auto",
      "width:100%",
      "min-height:0",
      "border:0",
      "background:#100806",
      "display:block",
    ].join(";");

    panel.appendChild(head);
    panel.appendChild(frame);
    (document.body || document.documentElement).appendChild(panel);

    const makeResizeHandle = (dir) => {
      const h = document.createElement("div");
      h.className = "rwph-results-resize-handle rwph-results-resize-" + dir;
      h.dataset.resizeDir = dir;
      h.title = dir === "nw" ? "Resize from top-left" : dir === "sw" ? "Resize from bottom-left" : "Resize from bottom-right";
      h.style.cssText = [
        "position:absolute",
        "width:22px",
        "height:22px",
        "z-index:2147483604",
        "touch-action:none",
        "user-select:none",
        "-webkit-user-select:none",
        "opacity:.98",
        "background:rgba(2,6,23,.20)",
        "border-color:rgba(245,158,11,.94)",
        "border-style:solid",
        "box-sizing:border-box",
        "filter:drop-shadow(0 0 6px rgba(245,158,11,.32))",
      ].join(";");
      if (dir === "se") {
        h.style.right = "5px"; h.style.bottom = "5px"; h.style.cursor = "nwse-resize"; h.style.borderWidth = "0 3px 3px 0"; h.style.borderRadius = "0 0 8px 0";
      } else if (dir === "sw") {
        h.style.left = "5px"; h.style.bottom = "5px"; h.style.cursor = "nesw-resize"; h.style.borderWidth = "0 0 3px 3px"; h.style.borderRadius = "0 0 0 8px";
      } else {
        h.style.left = "5px"; h.style.top = "5px"; h.style.cursor = "nwse-resize"; h.style.borderWidth = "3px 0 0 3px"; h.style.borderRadius = "8px 0 0 0";
      }
      panel.appendChild(h);
      return h;
    };
    ["nw", "sw", "se"].forEach(makeResizeHandle);

    const saveLayout = () => {
      if (fullscreen) return;
      try {
        const r = panel.getBoundingClientRect();
        localStorage.setItem(savedLayoutKey, JSON.stringify({
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        }));
      } catch (_) {}
    };

    const applySavedLayout = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(savedLayoutKey) || "null");
        if (!saved) return;
        const minW = 280, minH = 220;
        const maxW = Math.max(minW, window.innerWidth - 16);
        const maxH = Math.max(minH, window.innerHeight - 16);
        const w = clamp(saved.width, minW, maxW);
        const h = clamp(saved.height, minH, maxH);
        const l = clamp(saved.left, 8, Math.max(8, window.innerWidth - w - 8));
        const t = clamp(saved.top, 8, Math.max(8, window.innerHeight - h - 8));
        panel.style.setProperty("left", l + "px", "important");
        panel.style.setProperty("top", t + "px", "important");
        panel.style.setProperty("right", "auto", "important");
        panel.style.setProperty("bottom", "auto", "important");
        panel.style.setProperty("width", w + "px", "important");
        panel.style.setProperty("height", h + "px", "important");
        panel.style.setProperty("max-height", "none", "important");
      } catch (_) {}
    };

    let dragging = false;
    let resizing = false;
    let activeDir = "se";
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, startWidth = 0, startHeight = 0;

    const beginDrag = (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest("button,.rwph-results-resize-handle")) return;
      const p = point(ev);
      const r = panel.getBoundingClientRect();
      dragging = true;
      resizing = false;
      fullscreen = false;
      fullBtn.textContent = "⛶";
      fullBtn.title = "Fullscreen results loading panel";
      startX = p.x; startY = p.y; startLeft = r.left; startTop = r.top;
      panel.style.setProperty("left", r.left + "px", "important");
      panel.style.setProperty("top", r.top + "px", "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      ev.preventDefault();
      ev.stopPropagation?.();
    };

    const beginResize = (ev) => {
      const handle = ev.target && ev.target.closest ? ev.target.closest(".rwph-results-resize-handle") : null;
      if (!handle || !panel.contains(handle)) return;
      const p = point(ev);
      const r = panel.getBoundingClientRect();
      resizing = true;
      dragging = false;
      fullscreen = false;
      fullBtn.textContent = "⛶";
      fullBtn.title = "Fullscreen results loading panel";
      activeDir = handle.dataset.resizeDir || "se";
      startX = p.x; startY = p.y; startLeft = r.left; startTop = r.top; startWidth = r.width; startHeight = r.height;
      panel.style.setProperty("left", r.left + "px", "important");
      panel.style.setProperty("top", r.top + "px", "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      ev.preventDefault();
      ev.stopPropagation?.();
    };

    const move = (ev) => {
      if (!dragging && !resizing) return;
      const p = point(ev);
      if (dragging) {
        const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
        panel.style.setProperty("left", clamp(startLeft + p.x - startX, 8, maxLeft) + "px", "important");
        panel.style.setProperty("top", clamp(startTop + p.y - startY, 8, maxTop) + "px", "important");
      }
      if (resizing) {
        const minW = 280, minH = 220;
        const maxW = Math.max(minW, window.innerWidth - 16);
        const maxH = Math.max(minH, window.innerHeight - 16);
        const dx = p.x - startX;
        const dy = p.y - startY;
        let w = startWidth, h = startHeight, l = startLeft, t = startTop;
        if (activeDir.includes("e")) w = startWidth + dx;
        if (activeDir.includes("s")) h = startHeight + dy;
        if (activeDir.includes("w")) w = startWidth - dx;
        if (activeDir.includes("n")) h = startHeight - dy;
        w = clamp(w, minW, maxW);
        h = clamp(h, minH, maxH);
        if (activeDir.includes("w")) l = startLeft + (startWidth - w);
        if (activeDir.includes("n")) t = startTop + (startHeight - h);
        l = clamp(l, 8, Math.max(8, window.innerWidth - w - 8));
        t = clamp(t, 8, Math.max(8, window.innerHeight - h - 8));
        panel.style.setProperty("left", l + "px", "important");
        panel.style.setProperty("top", t + "px", "important");
        panel.style.setProperty("right", "auto", "important");
        panel.style.setProperty("bottom", "auto", "important");
        panel.style.setProperty("width", w + "px", "important");
        panel.style.setProperty("height", h + "px", "important");
      }
      ev.preventDefault();
    };

    const endMove = () => {
      if (dragging || resizing) saveLayout();
      dragging = false;
      resizing = false;
    };

    head.addEventListener("mousedown", beginDrag);
    head.addEventListener("touchstart", beginDrag, { passive: false });
    panel.addEventListener("mousedown", beginResize);
    panel.addEventListener("touchstart", beginResize, { passive: false });
    document.addEventListener("mousemove", move);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("mouseup", endMove);
    document.addEventListener("touchend", endMove);
    document.addEventListener("touchcancel", endMove);

    const markClosed = () => {
      closed = true;
      rwphClearResultsLoadingPanelState();
      rwphClearRememberedOpenResultsPage();
      try { document.removeEventListener("mousemove", move); } catch (_) {}
      try { document.removeEventListener("touchmove", move); } catch (_) {}
      try { document.removeEventListener("mouseup", endMove); } catch (_) {}
      try { document.removeEventListener("touchend", endMove); } catch (_) {}
      try { document.removeEventListener("touchcancel", endMove); } catch (_) {}
      try { panel.remove(); } catch (_) {}
    };
    closeBtn.addEventListener("click", (ev) => {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      markClosed();
    });

    const toggleFullscreen = () => {
      try {
        if (!fullscreen) {
          const r = panel.getBoundingClientRect();
          previousLayout = { left: r.left, top: r.top, width: r.width, height: r.height };
          panel.style.setProperty("left", "6px", "important");
          panel.style.setProperty("top", "6px", "important");
          panel.style.setProperty("right", "auto", "important");
          panel.style.setProperty("bottom", "auto", "important");
          panel.style.setProperty("width", "calc(100vw - 12px)", "important");
          panel.style.setProperty("height", "calc(100vh - 12px)", "important");
          panel.style.setProperty("min-width", "0", "important");
          panel.style.setProperty("min-height", "0", "important");
          panel.style.setProperty("max-height", "none", "important");
          panel.style.setProperty("border-radius", "14px", "important");
          fullscreen = true;
          fullBtn.textContent = "▣";
          fullBtn.title = "Exit fullscreen results loading panel";
          fullBtn.setAttribute("aria-label", "Exit fullscreen results loading panel");
        } else {
          const r = previousLayout || { left: 18, top: 18, width: Math.min(900, window.innerWidth - 24), height: Math.min(820, window.innerHeight - 24) };
          panel.style.setProperty("left", clamp(r.left, 8, Math.max(8, window.innerWidth - 288)) + "px", "important");
          panel.style.setProperty("top", clamp(r.top, 8, Math.max(8, window.innerHeight - 228)) + "px", "important");
          panel.style.setProperty("right", "auto", "important");
          panel.style.setProperty("bottom", "auto", "important");
          panel.style.setProperty("width", clamp(r.width, 280, Math.max(280, window.innerWidth - 16)) + "px", "important");
          panel.style.setProperty("height", clamp(r.height, 220, Math.max(220, window.innerHeight - 16)) + "px", "important");
          panel.style.setProperty("min-width", "280px", "important");
          panel.style.setProperty("min-height", "220px", "important");
          panel.style.setProperty("border-radius", "18px", "important");
          fullscreen = false;
          fullBtn.textContent = "⛶";
          fullBtn.title = "Fullscreen results loading panel";
          fullBtn.setAttribute("aria-label", "Fullscreen results loading panel");
          saveLayout();
        }
      } catch (e) {
        console.warn("Could not toggle results loading panel fullscreen:", e);
      }
    };
    fullBtn.addEventListener("click", (ev) => {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      toggleFullscreen();
    });

    try {
      const media = window.matchMedia?.("(max-width: 760px), (pointer: coarse)");
      if (media && media.matches) {
        panel.style.right = "6px";
        panel.style.bottom = "6px";
        panel.style.width = "calc(100vw - 12px)";
        panel.style.height = "calc(100vh - 12px)";
        panel.style.minWidth = "0";
        panel.style.minHeight = "0";
        panel.querySelectorAll(".rwph-results-resize-handle").forEach((h) => {
          h.style.width = "32px";
          h.style.height = "32px";
          h.style.zIndex = "2147483605";
        });
      } else {
        applySavedLayout();
      }
    } catch (_) {
      applySavedLayout();
    }

    const fakeTab = {
      rwphIsLoadingPanel: true,
      rwphPanel: panel,
      rwphFrame: frame,
      get closed() {
        try { return closed || !document.body.contains(panel); } catch (_) { return true; }
      },
      get document() {
        return frame.contentDocument || frame.contentWindow?.document || document;
      },
      get window() {
        return frame.contentWindow || window;
      },
      focus() {
        try { panel.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
      },
      postMessage(message, targetOrigin) {
        try { frame.contentWindow?.postMessage(message, targetOrigin || "*"); } catch (_) {}
      },
      close: markClosed,
    };

    try {
      const doc = frame.contentDocument || frame.contentWindow?.document;
      doc.open();
      doc.write(String(loadingHtml || ""));
      doc.close();
      setTimeout(() => rwphStartResultsLoadingCounter(fakeTab, startedAtMs), 250);
    } catch (e) {
      console.warn("Could not write loading page into results loading panel:", e);
    }

    return fakeTab;
  }

  function openBlankResultsTab(progressId = "") {
    try {
      const rwphLoadingStartedAt = Date.now();
      const loadingHtml = buildResultsLoadingHtml(progressId, rwphLoadingStartedAt);
      const tab = rwphCreateResultsLoadingPanel(progressId, loadingHtml, rwphLoadingStartedAt);
      if (tab) {
        rwphRememberResultsLoadingPanelState({
          type: "loading",
          progressId,
          startedAtMs: rwphLoadingStartedAt,
        });
      }
      return tab;
    } catch (e) {
      console.warn("Could not open RWPH results loading panel:", e);
      return null;
    }
  }



  function rwphRestoreResultsLoadingPanelAfterRefresh() {
    try {
      const stored = rwphReadResultsLoadingPanelState(true);
      if (!stored || !stored.active) return false;

      const progressId = String(stored.progressId || "").trim();
      const type = String(stored.type || "loading");
      const html = String(stored.html || "");
      const startedAtMs = Number(stored.startedAtMs || stored.createdAt || Date.now());

      if (!progressId && !html) {
        rwphClearResultsLoadingPanelState();
        return false;
      }

      // Results already opened inside the panel: restore the same panel with the results HTML in the frame.
      if (type === "results" && html) {
        rwphCreateResultsLoadingPanel(progressId, html, startedAtMs);
        return true;
      }

      // Loading or ready state: recreate the loading panel and resume progress/result polling.
      const loadingHtml = buildResultsLoadingHtml(progressId, startedAtMs);
      const tab = rwphCreateResultsLoadingPanel(progressId, loadingHtml, startedAtMs);
      if (!tab) return false;

      const locallyStored = (() => {
        try {
          const raw = progressId ? localStorage.getItem("rwph_manual_results_html_" + progressId) : "";
          const parsed = raw ? JSON.parse(raw) : null;
          return parsed && parsed.html ? String(parsed.html || "") : "";
        } catch (_) {
          return "";
        }
      })();

      const readyHtml = html || locallyStored;
      if (readyHtml) {
        rwphDirectUnlockLoadingTab(tab, progressId, readyHtml);
        rwphRememberResultsLoadingPanelState({
          type: "ready",
          progressId,
          startedAtMs,
          html: readyHtml
        });
        return true;
      }

      const cancelRestoredLoading = () => {
        rwphClearResultsLoadingPanelState();
        if (progressId) rwphSendCalcCancel(progressId, "Results loading panel was closed after a page refresh before RWPH finished calculating.");
      };

      rwphStartResultsProgressPolling(tab, progressId, cancelRestoredLoading);
      rwphStartResultsTabCloseWatcher(tab, progressId, cancelRestoredLoading);
      rwphSetResultsLoadingStepDone(tab, 0, 8, "Results loading panel restored after refresh. Reconnecting to calculation...");

      // Extra direct result-html fetch after restore, in case the backend had finished while the page was refreshing.
      setTimeout(() => {
        try {
          if (!progressId) return;
          GM_xmlhttpRequest({
            method: "GET",
            url: `${PAYWALL_API_BASE}/api/calc/result-html?progressId=${encodeURIComponent(progressId)}`,
            headers: { "ngrok-skip-browser-warning": "true" },
            timeout: 20000,
            onload: (res) => {
              try {
                const payload = JSON.parse(res.responseText || "{}");
                if (payload && payload.ok && payload.ready && payload.html) {
                  const ready = rwphInjectMainScrollbarCssIntoHtml(String(payload.html || ""));
                  rwphDirectUnlockLoadingTab(tab, progressId, ready);
                  rwphRememberResultsLoadingPanelState({
                    type: "ready",
                    progressId,
                    startedAtMs,
                    html: ready
                  });
                }
              } catch (_) {}
            },
          });
        } catch (_) {}
      }, 800);

      return true;
    } catch (e) {
      console.warn("RWPH could not restore results loading panel after refresh:", e);
      return false;
    }
  }


  function rwphStoreManualResultHtmlOnServer(progressId, html) {
    const id = String(progressId || "").trim();
    if (!id || !html) return;
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}/api/calc/result-html`,
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        data: JSON.stringify({ progressId: id, html: String(html || "") }),
        timeout: 30000,
      });
    } catch (e) {
      try {
        fetch(`${PAYWALL_API_BASE}/api/calc/result-html`, {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ progressId: id, html: String(html || "") }),
        }).catch(() => {});
      } catch (_) {}
    }
  }

  function rwphMainPanelScrollbarCss() {
    return `<style id="rwph-main-scrollbar-match">
      html, body {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(245,158,11,.78) rgba(15,23,42,.34) !important;
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(245,158,11,.78) rgba(15,23,42,.34);
      }
      ::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      ::-webkit-scrollbar-track {
        background: rgba(15,23,42,.34) !important;
        border-radius: 999px !important;
      }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(245,158,11,.92), rgba(249,115,22,.82)) !important;
        border: 2px solid rgba(15,23,42,.50) !important;
        border-radius: 999px !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.92)) !important;
      }
    </style>`;
  }

  function rwphInjectMainScrollbarCssIntoHtml(html) {
    const css = rwphMainPanelScrollbarCss();
    const raw = String(html || "");
    if (!raw) return raw;
    if (raw.includes("rwph-main-scrollbar-match")) return raw;
    if (/<\/head>/i.test(raw)) return raw.replace(/<\/head>/i, `${css}</head>`);
    return css + raw;
  }

  function rwphDirectUnlockLoadingTab(tab, progressId, html) {
    const id = String(progressId || "").trim();
    if (!tab || tab.closed || !html) return false;
    html = rwphInjectMainScrollbarCssIntoHtml(html);

    let unlocked = false;

    try {
      if (tab.window) {
        tab.window.rwphManualResultsHtml = String(html || "");
      }
    } catch (_) {}

    try {
      const doc = tab.document;
      const btn = doc && doc.getElementById ? doc.getElementById("rwph-open-results-button") : null;
      const status = doc && doc.getElementById ? doc.getElementById("rwph-live-status") : null;
      const bar = doc && doc.getElementById ? doc.getElementById("rwph-progress-bar") : null;
      const steps = doc && doc.querySelectorAll ? Array.prototype.slice.call(doc.querySelectorAll("[data-rwph-load-step]")) : [];

      if (btn) {
        btn.hidden = false;
        btn.disabled = false;
        btn.setAttribute("aria-disabled", "false");
        btn.setAttribute("data-state", "ready");
        btn.textContent = "Open Results Page";
        btn.onclick = function(ev) {
          try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (_) {}
          try {
            rwphRememberOpenResultsPageHtml(String(html || ""));
            rwphRememberResultsLoadingPanelState({
              type: "results",
              progressId: id,
              html: String(html || "")
            });
            doc.open();
            doc.write(String(html || ""));
            doc.close();
          } catch (_) {}
          return false;
        };
        unlocked = true;
      }

      if (status) status.textContent = "Results data complete. Click Open Results Page when you are ready.";
      if (bar) bar.style.width = "100%";
      steps.forEach((step) => {
        try {
          step.classList.add("rwph-load-step-done");
          step.classList.remove("rwph-load-step-active");
        } catch (_) {}
      });
    } catch (_) {}

    try {
      if (tab.window && typeof tab.window.rwphShowManualResultsButton === "function") {
        tab.window.rwphShowManualResultsButton(String(html || ""));
        unlocked = true;
      }
    } catch (_) {}

    try {
      if (tab.window && id) {
        tab.window.localStorage.setItem("rwph_manual_results_html_" + id, JSON.stringify({
          progressId: id,
          createdAt: Date.now(),
          html: String(html || ""),
        }));
      }
    } catch (_) {}

    return unlocked;
  }

  function rwphPrepareManualResultsOpenButton(tab, progressId, rows, summary) {
    const id = String(progressId || "").trim();
    if (!id || !tab || tab.closed) return false;

    let html = "";
    try {
      html = rwphInjectMainScrollbarCssIntoHtml(buildFullscreenResultsHtml(rows || [], summary || {}));
    } catch (e) {
      console.warn("Could not build manual-open results HTML:", e);
      return false;
    }

    try { rwphSetResultsLoadingStepDone(tab, 4, 100, "Results data complete. Unlocking Open Results Page..."); } catch (_) {}
    rwphStoreManualResultHtmlOnServer(id, html);
    rwphDirectUnlockLoadingTab(tab, id, html);

    try {
      localStorage.setItem("rwph_manual_results_html_" + id, JSON.stringify({
        progressId: id,
        createdAt: Date.now(),
        html,
      }));
      rwphRememberResultsLoadingPanelState({
        type: "ready",
        progressId: id,
        html,
      });
    } catch (e) {
      console.warn("Could not store manual-open results HTML:", e);
    }

    try {
      if (typeof tab.postMessage === "function") {
        tab.postMessage({ rwphType: "rwph-manual-results-ready", progressId: id, html }, "*");
      }
    } catch (_) {}
    try {
      if (tab.window && typeof tab.window.postMessage === "function") {
        tab.window.postMessage({ rwphType: "rwph-manual-results-ready", progressId: id, html }, "*");
      }
    } catch (_) {}
    try {
      if (tab.window && typeof tab.window.rwphShowManualResultsButton === "function") {
        tab.window.rwphShowManualResultsButton(html);
      }
    } catch (_) {}
    try {
      setTimeout(() => {
        try {
          rwphDirectUnlockLoadingTab(tab, id, html);
          if (tab && !tab.closed && tab.window && typeof tab.window.rwphShowManualResultsButton === "function") {
            tab.window.rwphShowManualResultsButton(html);
          } else if (tab && !tab.closed && typeof tab.postMessage === "function") {
            tab.postMessage({ rwphType: "rwph-manual-results-ready", progressId: id, html }, "*");
          }
        } catch (_) {}
      }, 650);
      setTimeout(() => {
        try { rwphDirectUnlockLoadingTab(tab, id, html); } catch (_) {}
      }, 1800);
    } catch (_) {}

    return true;
  }

  function writeFullscreenResultsTab(tab, rows, summary) {
    if (!tab || tab.closed) return false;
    const html = buildFullscreenResultsHtml(rows || [], summary || {});
    try {
      tab.document.open();
      tab.document.write(html);
      tab.document.close();
      try { tab.focus(); } catch (_) {}
      return true;
    } catch (e) {
      console.warn("Could not write fullscreen results into pre-opened tab:", e);
      return false;
    }
  }

  function openFullscreenResultsTab(rows, summary) {
    const tab = openBlankResultsTab();
    if (tab && writeFullscreenResultsTab(tab, rows, summary)) return true;

    // Last-resort fallback for browsers that block document.write into a new tab.
    // This avoids GM_openInTab/blob URLs because Torn PDA can close those tabs or block their button scripts.
    try {
      const html = buildFullscreenResultsHtml(rows || [], summary || {});
      const fallback = window.open("about:blank", "_blank");
      if (!fallback || fallback.closed) return false;
      fallback.document.open();
      fallback.document.write(html);
      fallback.document.close();
      return true;
    } catch (e) {
      console.warn("Could not open fullscreen results tab:", e);
      return false;
    }
  }

  function rwphClearLastResults() {
    // v1.1.219: cached-report opening is database-only now.
    // Clear any old browser-saved report so RWPH cannot reopen stale local cache data.
    GM_setValue(LAST_RESULTS_STORAGE_KEY, "");
  }

  function rwphUpdateLastResultsButton() {
    const actions = document.getElementById("rw-last-results-actions");
    const runBtn = document.getElementById("rw-run");
    if (rwphLastResultsButtonTimer) {
      clearTimeout(rwphLastResultsButtonTimer);
      rwphLastResultsButtonTimer = null;
    }
    if (actions) actions.hidden = false;
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = "Calculate";
      runBtn.title = "Create the normal per-hit payout report for the last finished ranked war. If a matching cached report exists, RWPH will ask you to open it instead.";
    }
    rwphRenderCacheButtonStates(true);
  }

  function rwphSaveLastResults(rows, summary) {
    // v1.1.219: do not save reports in browser storage.
    // Reports can only be reopened through the backend/database cache.
    rwphClearLastResults();
    rwphUpdateLastResultsButton();
  }


  function rwphNormalizeCalculationMode(mode) {
    return String(mode || "standard") === "points" ? "points" : "standard";
  }

  function rwphModeLabel(mode) {
    return rwphNormalizeCalculationMode(mode) === "points" ? "Points System" : "Per Hit";
  }
  function rwphHtmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function rwphMemberManagementModeKey(mode = "standard") {
    return rwphNormalizeCalculationMode(mode);
  }

  function rwphReadAllMemberManagementState() {
    try {
      const parsed = JSON.parse(GM_getValue(MEMBER_MANAGEMENT_STORAGE_KEY, "{}") || "{}");
      const all = parsed && typeof parsed === "object" ? parsed : {};
      const nowMs = Date.now();
      let changed = false;
      for (const [modeKey, state] of Object.entries(all)) {
        const savedAt = Number(state?.updatedAtMs || 0);
        if (savedAt > 0 && nowMs - savedAt > MEMBER_MANAGEMENT_EXPIRY_MS) {
          delete all[modeKey];
          changed = true;
        }
      }
      if (changed) GM_setValue(MEMBER_MANAGEMENT_STORAGE_KEY, JSON.stringify(all));
      return all;
    } catch (_) {
      return {};
    }
  }

  function rwphReadMemberManagementState(mode = "standard") {
    const all = rwphReadAllMemberManagementState();
    const key = rwphMemberManagementModeKey(mode);
    const state = all[key] && typeof all[key] === "object" ? all[key] : {};
    const members = state.members && typeof state.members === "object" ? state.members : {};
    return { ...state, members };
  }

  function rwphSaveMemberManagementState(mode = "standard", state = {}) {
    const all = rwphReadAllMemberManagementState();
    const key = rwphMemberManagementModeKey(mode);
    all[key] = {
      ...state,
      members: state.members && typeof state.members === "object" ? state.members : {},
      updatedAtMs: Date.now(),
    };
    GM_setValue(MEMBER_MANAGEMENT_STORAGE_KEY, JSON.stringify(all));
    rwphScheduleAutoCacheCheck(250);
  }

  function rwphMemberManagementMemberKey(member = {}) {
    const id = String(member.id ?? member.tornId ?? member.userId ?? "").trim();
    if (id) return `id:${id}`;
    const name = String(member.name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    return name ? `name:${name}` : "";
  }

  function rwphGetMemberManagementPayload(mode = "standard") {
    const state = rwphReadMemberManagementState(mode);
    const members = state.members || {};
    return Object.values(members)
      .map((entry) => ({
        id: String(entry?.id || "").trim(),
        name: String(entry?.name || "").trim(),
        exclude: !!entry?.exclude,
        hitsToRemove: Math.max(0, Math.floor(Number(entry?.hitsToRemove || 0) || 0)),
        respectToRemove: Math.max(0, Number(entry?.respectToRemove || 0) || 0),
      }))
      .filter((entry) => entry.id || entry.name)
      .filter((entry) => entry.exclude || entry.hitsToRemove > 0 || entry.respectToRemove > 0);
  }

  function rwphMemberManagementSignature(mode = "standard") {
    return JSON.stringify(rwphGetMemberManagementPayload(mode).sort((a, b) => String(a.id || a.name).localeCompare(String(b.id || b.name))));
  }

  function rwphBuildMemberManagementExcludedText(mode = "standard") {
    return rwphGetMemberManagementPayload(mode)
      .filter((entry) => entry.exclude)
      .map((entry) => entry.id || entry.name)
      .join("\n");
  }


  function rwphTimeInputIds(mode = "standard") {
    return rwphNormalizeCalculationMode(mode) === "points"
      ? { from: "rw-points-from", to: "rw-points-to" }
      : { from: "rw-from", to: "rw-to" };
  }

  function rwphGetTimeWindowForMode(mode = "standard") {
    const ids = rwphTimeInputIds(mode);
    const fromEl = document.getElementById(ids.from);
    const toEl = document.getElementById(ids.to);
    return {
      from: dateTimeLocalToUnix(fromEl?.value || ""),
      to: dateTimeLocalToUnix(toEl?.value || ""),
    };
  }

  function rwphSetTimeWindowForMode(mode = "standard", from = 0, to = 0) {
    const ids = rwphTimeInputIds(mode);
    const fromEl = document.getElementById(ids.from);
    const toEl = document.getElementById(ids.to);
    if (fromEl) fromEl.value = toDateTimeLocalValue(from);
    if (toEl) toEl.value = toDateTimeLocalValue(to);
  }

  function rwphTotalPayoutInputId(mode) {
    return rwphNormalizeCalculationMode(mode) === "points" ? "rw-points-total" : "rw-total";
  }

  function rwphGetTotalPayoutForMode(mode) {
    const preferred = document.getElementById(rwphTotalPayoutInputId(mode));
    const fallback = document.getElementById("rw-total") || document.getElementById("rw-points-total");
    return rwphGetMoneyInputNumber(preferred || fallback);
  }

  function rwphOverallTotalPayoutInputId(mode) {
    return rwphNormalizeCalculationMode(mode) === "points" ? "rw-points-total-overall" : "rw-total-overall";
  }

  function rwphGetOverallTotalPayoutForMode(mode) {
    const preferred = document.getElementById(rwphOverallTotalPayoutInputId(mode));
    const fallback = document.getElementById(rwphTotalPayoutInputId(mode));
    const value = rwphGetMoneyInputNumber(preferred || fallback);
    return Number.isFinite(value) && value > 0 ? value : rwphGetTotalPayoutForMode(mode);
  }

  function rwphSummaryMemberPayout(summary, rows = []) {
    const explicit = Number(summary?.memberPayout ?? summary?.totalPayout ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return (rows || []).reduce((sum, r) => sum + Number(r?.payout || 0), 0);
  }

  function rwphSummaryOverallTotalPayout(summary, rows = []) {
    const explicit = Number(summary?.overallTotalPayout ?? summary?.totalPayoutDisplay ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return rwphSummaryMemberPayout(summary, rows);
  }

  function rwphSummaryTotalWeight(summary, rows = []) {
    const explicit = Number(summary?.totalWeight ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return (rows || []).reduce((sum, r) => sum + Number(r?.weight || 0), 0);
  }

  function rwphSummaryPerHitAmount(summary, rows = []) {
    const explicit = Number(summary?.perHitAmount ?? summary?.perWeightedHitAmount ?? summary?.calcMeta?.perHitAmount ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const totalWeight = rwphSummaryTotalWeight(summary, rows);
    const memberPayout = rwphSummaryMemberPayout(summary, rows);
    return totalWeight > 0 ? memberPayout / totalWeight : 0;
  }

  function rwphFixedPerHitWeight(inputId, defaultValue = 1) {
    const el = document.getElementById(inputId);
    if (!el) return defaultValue ? 1 : 0;
    return el.checked ? 1 : 0;
  }

  function rwphPointEnemyHospitalBonusValue() {
    return Number(document.getElementById("rw-point-enemy-hospital")?.value || -1);
  }

  function rwphPointRespectScoreValue() {
    return Number(document.getElementById("rw-point-respect")?.value || 0.01);
  }

  function rwphPointRespectStepValue() {
    return Number(document.getElementById("rw-point-respect-step")?.value || 0.01);
  }

  function rwphPointFairFightAvgStepValue() {
    return Number(document.getElementById("rw-point-fair-fight-avg-step")?.value || 0.02);
  }

  function rwphPointFairFightBonusStepValue() {
    return Number(document.getElementById("rw-point-fair-fight-bonus-step")?.value || 0.01);
  }

  function rwphExcludedMembersInputId(mode = "standard") {
    return rwphNormalizeCalculationMode(mode) === "points" ? "rw-points-excluded-members" : "rw-excluded-members";
  }

  function rwphSyncMemberManagementHiddenFields() {
    const basic = document.getElementById("rw-excluded-members");
    const points = document.getElementById("rw-points-excluded-members");
    if (basic) basic.value = rwphBuildMemberManagementExcludedText("standard");
    if (points) points.value = rwphBuildMemberManagementExcludedText("points");
    rwphUpdateMemberManagementSummaries();
  }

  function rwphUpdateMemberManagementSummaries() {
    const setSummary = (mode, id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const payload = rwphGetMemberManagementPayload(mode);
      const excluded = payload.filter((m) => m.exclude).length;
      const hitMembers = payload.filter((m) => !m.exclude && Number(m.hitsToRemove || 0) > 0).length;
      const respectMembers = payload.filter((m) => !m.exclude && Number(m.respectToRemove || 0) > 0).length;
      const hits = payload.reduce((sum, m) => sum + (!m.exclude ? Math.max(0, Number(m.hitsToRemove || 0) || 0) : 0), 0);
      const respect = payload.reduce((sum, m) => sum + (!m.exclude ? Math.max(0, Number(m.respectToRemove || 0) || 0) : 0), 0);
      if (!payload.length) el.textContent = "No member changes selected.";
      else el.textContent = `${excluded} excluded • ${hitMembers} payable-hit adjusted • ${hits} payable hit(s) removed • ${respectMembers} respect adjusted • ${Number(respect.toFixed(2))} respect removed`;
    };
    setSummary("standard", "rw-member-management-summary");
    setSummary("points", "rw-points-member-management-summary");
  }

  function rwphGetExcludedMembersTextForMode(mode = "standard") {
    const text = rwphBuildMemberManagementExcludedText(mode);
    const el = document.getElementById(rwphExcludedMembersInputId(mode));
    if (el) el.value = text;
    return text;
  }

  function rwphExcludedMembersSignature(mode = "standard") {
    return rwphGetExcludedMembersTextForMode(mode)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function rwphBasicFastModeEnabled() {
    return document.getElementById("rw-basic-fast-mode")?.checked === true;
  }


  function rwphCloseMemberManagementPanel() {
    const panel = document.getElementById("rwph-member-management-panel");
    if (panel) panel.remove();
  }

  function rwphMemberManagementPanelCss() {
    return `
      #rwph-member-management-panel{background:var(--rw-panel-bg)!important;color:var(--rw-text)!important;border:1px solid var(--rw-border)!important;border-radius:var(--rw-panel-radius,16px)!important;box-shadow:var(--rw-panel-shadow,0 24px 70px rgba(0,0,0,.55))!important;overflow:hidden!important;}
      #rwph-member-management-panel .rwph-floating-panel-head{background:var(--rw-head-bg)!important;border-bottom:1px solid var(--rw-border)!important;min-height:58px!important;padding:10px 56px 10px 14px!important;display:flex!important;align-items:center!important;gap:10px!important;}
      #rwph-member-management-panel .rwph-floating-panel-head:before{content:"";width:42px;height:42px;flex:0 0 42px;background:url("${RWPH_LAUNCHER_LOGO_DATA_URI}") center/contain no-repeat!important;filter:drop-shadow(0 0 8px var(--rw-accent-soft,rgba(251,191,36,.35)))!important;}
      #rwph-member-management-panel .rwph-mm-heading{display:flex;flex-direction:column;gap:2px;line-height:1.15;}
      #rwph-member-management-panel .rwph-mm-heading b{font-size:16px;color:var(--rw-text)!important;}
      #rwph-member-management-panel .rwph-mm-body{height:calc(100% - 58px);max-height:none;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;background:var(--rw-body-bg,transparent)!important;}
      #rwph-member-management-panel .rwph-mm-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:2px;padding:10px;border:1px solid var(--rw-border);border-radius:var(--rw-card-radius,12px);background:var(--rw-card-bg);box-shadow:var(--rw-card-shadow);}
      #rwph-member-management-panel .rwph-mm-status{font-size:12px;opacity:.92;line-height:1.35;padding:9px 10px;border:1px solid var(--rw-border);border-radius:var(--rw-card-radius,12px);background:var(--rw-card-bg);color:var(--rw-muted);}
      #rwph-member-management-panel .rwph-mm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:10px;}
      #rwph-member-management-panel .rwph-mm-card{border:1px solid var(--rw-border);background:var(--rw-card-bg);border-radius:var(--rw-card-radius,12px);padding:11px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--rw-card-shadow);}
      #rwph-member-management-panel .rwph-mm-title{font-weight:900;color:var(--rw-text);font-size:13px;}
      #rwph-member-management-panel .rwph-mm-sub{font-size:11px;color:var(--rw-muted);}
      #rwph-member-management-panel .rwph-mm-card label{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--rw-text);}
      #rwph-member-management-panel .rwph-mm-card label:not(:has(input[type=checkbox])){display:grid;grid-template-columns:1fr;align-items:start;}
      #rwph-member-management-panel .rwph-mm-card input[type=number]{width:100%;box-sizing:border-box;margin-top:4px;}
      #rwph-member-management-panel .rwph-mm-empty{padding:12px;border:1px dashed var(--rw-border);border-radius:var(--rw-card-radius,12px);color:var(--rw-muted);background:var(--rw-card-bg);}
      #rwph-member-management-panel button{border-radius:var(--rw-button-radius,10px)!important;}
      #rwph-member-management-panel .rwph-mm-body::-webkit-scrollbar{width:10px;height:10px;}
      #rwph-member-management-panel .rwph-mm-body::-webkit-scrollbar-track{background:var(--rw-scroll-track);border-radius:10px;}
      #rwph-member-management-panel .rwph-mm-body::-webkit-scrollbar-thumb{background:var(--rw-scroll-thumb);border-radius:10px;border:2px solid var(--rw-scroll-track);}
    `;
  }

  function rwphRenderMemberManagementCards(mode, members = []) {
    const state = rwphReadMemberManagementState(mode);
    const stored = state.members || {};
    if (!Array.isArray(members) || !members.length) {
      return `<div class="rwph-mm-empty">No ranked-war report members were found for the selected war/time window.</div>`;
    }
    return `<div class="rwph-mm-grid">${members.map((member, index) => {
      const key = rwphMemberManagementMemberKey(member) || `idx:${index}`;
      const saved = stored[key] || {};
      const id = String(member.id || "");
      const name = String(member.name || (id ? `Torn ID ${id}` : "Unknown member"));
      const checked = saved.exclude ? "checked" : "";
      const hitsToRemove = Math.max(0, Math.floor(Number(saved.hitsToRemove || 0) || 0));
      const respectToRemove = Math.max(0, Number(saved.respectToRemove || 0) || 0);
      const maxHits = Math.max(0, Math.floor(Number(member.payableEvents ?? member.payableHits ?? member.warHits ?? member.attacks ?? 0) || 0));
      const memberRespect = Math.max(0, Number(member.totalRespect ?? member.score ?? 0) || 0);
      return `
        <div class="rwph-mm-card" data-mm-key="${rwphHtmlEscape(key)}" data-mm-id="${rwphHtmlEscape(id)}" data-mm-name="${rwphHtmlEscape(name)}">
          <div class="rwph-mm-title">${rwphHtmlEscape(name)}${id ? ` <span class="rwph-mm-sub">[${rwphHtmlEscape(id)}]</span>` : ""}</div>
          <div class="rwph-mm-sub">Payable hits: ${rwphHtmlEscape(maxHits)} • Respect: ${rwphHtmlEscape(memberRespect)}</div>
          <label><input type="checkbox" class="rwph-mm-exclude" ${checked}> Remove this member completely</label>
          <label>Payable hits to remove
            <input type="number" class="rwph-mm-hits" value="${rwphHtmlEscape(hitsToRemove)}" min="0" max="${rwphHtmlEscape(maxHits)}" step="1" inputmode="numeric">
          </label>
          <label>Respect to remove
            <input type="number" class="rwph-mm-respect" value="${rwphHtmlEscape(Number(respectToRemove.toFixed ? respectToRemove.toFixed(2) : respectToRemove))}" min="0" max="${rwphHtmlEscape(memberRespect)}" step="0.01" inputmode="decimal">
          </label>
        </div>`;
    }).join("")}</div>`;
  }

  function rwphCaptureMemberManagementPanel(mode) {
    const panel = document.getElementById("rwph-member-management-panel");
    if (!panel) return;
    const currentMembers = {};
    panel.querySelectorAll(".rwph-mm-card").forEach((card) => {
      const key = String(card.dataset.mmKey || "").trim();
      if (!key) return;
      const exclude = card.querySelector(".rwph-mm-exclude")?.checked === true;
      const hitsToRemove = Math.max(0, Math.floor(Number(card.querySelector(".rwph-mm-hits")?.value || 0) || 0));
      const respectToRemove = Math.max(0, Number(card.querySelector(".rwph-mm-respect")?.value || 0) || 0);
      const entry = {
        id: String(card.dataset.mmId || "").trim(),
        name: String(card.dataset.mmName || "").trim(),
        exclude,
        hitsToRemove,
        respectToRemove,
      };
      if (entry.exclude || entry.hitsToRemove > 0 || entry.respectToRemove > 0) currentMembers[key] = entry;
    });
    const meta = panel.rwphMemberManagementMeta || {};
    rwphSaveMemberManagementState(mode, { ...meta, members: currentMembers });
    rwphSyncMemberManagementHiddenFields();
  }

  async function rwphLoadMemberManagementMembers(mode = "standard", statusEl = null) {
    const userKey = document.getElementById("rw-key")?.value?.trim() || "";
    const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
    if (!userKey) throw new Error("Enter your Torn API key first.");
    const result = await apiPost("/api/calc/member-management-members", {
      userKey,
      token,
      calculationMode: rwphNormalizeCalculationMode(mode),
      from: rwphGetTimeWindowForMode(mode).from,
      to: rwphGetTimeWindowForMode(mode).to,
    });
    return result;
  }

  async function rwphOpenMemberManagementPanel(mode = "standard") {
    const safeMode = rwphNormalizeCalculationMode(mode);
    rwphCloseMemberManagementPanel();
    rwphEnsureFloatingPanelCss();
    rwphSyncMemberManagementHiddenFields();
    const modeTitle = safeMode === "points" ? "Advanced Member Management" : "Basic Member Management";
    const panel = document.createElement("div");
    panel.id = "rwph-member-management-panel";
    panel.className = "rwph-floating-panel rwph-member-management-panel";
    panel.style.width = "720px";
    panel.style.maxWidth = "96vw";
    panel.style.left = "calc(50vw - 360px)";
    panel.style.top = "80px";
    panel.innerHTML = `
      <style>${rwphMemberManagementPanelCss()}</style>
      <div class="rwph-floating-panel-head rwph-panel-head">
        <div class="rwph-mm-heading"><b>${rwphHtmlEscape(modeTitle)}</b><span class="rwph-mm-sub">Ranked-war report members</span></div>
        <button id="rwph-mm-close" class="rwph-mini-close" type="button">×</button>
      </div>
      <div class="rwph-mm-body">
        <div class="rwph-mm-toolbar">
          <button id="rwph-mm-refresh" type="button">Refresh Members</button>
          <button id="rwph-mm-save" class="secondary" type="button">Save Changes</button>
          <button id="rwph-mm-clear" class="danger" type="button">Clear All</button>
        </div>
        <div class="rwph-mm-status" id="rwph-mm-status">Loading selected ranked-war report members...</div>
        <div id="rwph-mm-cards"><div class="rwph-mm-empty">Loading...</div></div>
      </div>`;
    document.body.appendChild(panel);
    rwphEnablePanelMoveResize(panel, ".rwph-floating-panel-head");
    const status = panel.querySelector("#rwph-mm-status");
    const cards = panel.querySelector("#rwph-mm-cards");
    const close = () => { rwphCaptureMemberManagementPanel(safeMode); rwphCloseMemberManagementPanel(); };
    panel.querySelector("#rwph-mm-close")?.addEventListener("click", close);
    panel.querySelector("#rwph-mm-save")?.addEventListener("click", () => {
      rwphCaptureMemberManagementPanel(safeMode);
      if (status) status.textContent = "Member Management saved. These changes will apply to calculations for 20 minutes, then reset to defaults.";
    });
    panel.querySelector("#rwph-mm-clear")?.addEventListener("click", () => {
      panel.querySelectorAll(".rwph-mm-exclude").forEach((el) => { el.checked = false; });
      panel.querySelectorAll(".rwph-mm-hits").forEach((el) => { el.value = "0"; });
      panel.querySelectorAll(".rwph-mm-respect").forEach((el) => { el.value = "0"; });
      rwphCaptureMemberManagementPanel(safeMode);
      if (status) status.textContent = "All member management changes cleared. Saved defaults will apply for 20 minutes.";
    });
    const reload = async () => {
      try {
        if (status) status.textContent = "Loading selected ranked-war report members...";
        const result = await rwphLoadMemberManagementMembers(safeMode, status);
        panel.rwphMemberManagementMeta = {
          factionId: result.factionId || "",
          factionName: result.factionName || "",
          reportId: result.reportId || "",
          from: result.from || 0,
          to: result.to || 0,
        };
        if (cards) cards.innerHTML = rwphRenderMemberManagementCards(safeMode, result.members || []);
        if (status) status.textContent = `Loaded ${(result.members || []).length} member card(s). Tick members to remove them fully, or type how many payable hits/respect to remove. Click Save Changes to remember the settings for 20 minutes.`;
      } catch (e) {
        if (cards) cards.innerHTML = `<div class="rwph-mm-empty">${rwphHtmlEscape(e.message || e)}</div>`;
        if (status) status.textContent = "Could not load ranked-war report members.";
      }
    };
    panel.querySelector("#rwph-mm-refresh")?.addEventListener("click", reload);
    panel.addEventListener("change", () => rwphCaptureMemberManagementPanel(safeMode));
    panel.addEventListener("input", (event) => {
      if (event.target?.classList?.contains("rwph-mm-hits")) {
        const max = Number(event.target.getAttribute("max") || 0);
        let n = Math.max(0, Math.floor(Number(event.target.value || 0) || 0));
        if (Number.isFinite(max) && max > 0 && n > max) n = max;
        event.target.value = String(n);
      }
      if (event.target?.classList?.contains("rwph-mm-respect")) {
        const max = Number(event.target.getAttribute("max") || 0);
        let n = Math.max(0, Number(event.target.value || 0) || 0);
        if (Number.isFinite(max) && max > 0 && n > max) n = max;
        event.target.value = String(n);
      }
      rwphCaptureMemberManagementPanel(safeMode);
    });
    await reload();
  }

  // v1.1.386: Basic  removed.

  function rwphEnsureCacheState(mode) {
    const safeMode = rwphNormalizeCalculationMode(mode);
    rwphCachedReports ||= {};
    rwphCachedReports[safeMode] ||= { available: false, info: null };
    return rwphCachedReports[safeMode];
  }

  function rwphGetPayoutCacheSignature(calculationMode = null) {
    const userKey = document.getElementById("rw-key")?.value?.trim() || "";
    const mode = calculationMode ? rwphNormalizeCalculationMode(calculationMode) : null;
    const standardTime = rwphGetTimeWindowForMode("standard");
    const pointsTime = rwphGetTimeWindowForMode("points");
    const timeSignatureFor = (time) => time.from && time.to && time.to > time.from ? `manual-time:${time.from}-${time.to}` : "auto-last-finished-war";
    const selectedTimeSignature = mode === "points" ? timeSignatureFor(pointsTime) : mode === "standard" ? timeSignatureFor(standardTime) : `standard:${timeSignatureFor(standardTime)}|points:${timeSignatureFor(pointsTime)}`;
    const signatureParts = [userKey ? "key" : "no-key", selectedTimeSignature, "ignore-payout-settings-v1"];

    if (!mode || mode === "standard") {
      signatureParts.push(
        "standard",
        rwphFixedPerHitWeight("rw-war-hit-weight", 1),
        rwphFixedPerHitWeight("rw-outside-hit-weight", 1),
        rwphFixedPerHitWeight("rw-retaliation-hit-weight", 1),
        rwphFixedPerHitWeight("rw-assist-weight", 0),
        rwphFixedPerHitWeight("rw-respect-weight", 0),
        "basic-respect-weight-v1",
        rwphBasicFastModeEnabled() ? "basic-fast-report-only-v1" : "basic-normal-hybrid-v1",
        "member-management-v1",
        `exclude:${rwphExcludedMembersSignature("standard")}`,
        `memberManagement:${rwphMemberManagementSignature("standard")}`,
      );
    }

    if (!mode || mode === "points") {
      signatureParts.push(
        "points",
        Number(document.getElementById("rw-point-war-hit")?.value || 10),
        Number(document.getElementById("rw-point-assist")?.value || 3),
        Number(document.getElementById("rw-point-outside")?.value || 2),
        Number(document.getElementById("rw-point-retal")?.value || 0.2),
        Number(document.getElementById("rw-point-hospital")?.value || 2),
        rwphPointEnemyHospitalBonusValue(),
        rwphPointRespectScoreValue(),
        rwphPointRespectStepValue(),
        "advanced-respect-score-step-v2",
        document.getElementById("rw-point-fair-fight")?.checked !== false ? "ff" : "no-ff",
        rwphPointFairFightAvgStepValue(),
        rwphPointFairFightBonusStepValue(),
        "avg-ff-custom-step-per-payable-hit-v2",
        "war-faction-retals-war-hit-plus-bonus-v1",
        "member-management-v1",
        `exclude:${rwphExcludedMembersSignature("points")}`,
        `memberManagement:${rwphMemberManagementSignature("points")}`,
      );
    }

    return signatureParts.join("|");
  }

  function rwphBuildCacheRequestPayload(calculationMode = "standard") {
    return {
      userKey: document.getElementById("rw-key")?.value?.trim() || "",
      token: GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, ""),
      from: rwphGetTimeWindowForMode(calculationMode).from,
      to: rwphGetTimeWindowForMode(calculationMode).to,
      calculationMode: rwphNormalizeCalculationMode(calculationMode),
      memberPayout: rwphGetTotalPayoutForMode(calculationMode),
      totalPayout: rwphGetTotalPayoutForMode(calculationMode),
      overallTotalPayout: rwphGetOverallTotalPayoutForMode(calculationMode),
      warHitWeight: rwphFixedPerHitWeight("rw-war-hit-weight", 1),
      outsideHitWeight: rwphFixedPerHitWeight("rw-outside-hit-weight", 1),
      retaliationHitWeight: rwphFixedPerHitWeight("rw-retaliation-hit-weight", 1),
      assistWeight: rwphFixedPerHitWeight("rw-assist-weight", 0),
      respectWeight: rwphFixedPerHitWeight("rw-respect-weight", 0),
      basicFastMode: rwphNormalizeCalculationMode(calculationMode) === "standard" && rwphBasicFastModeEnabled(),
      basic120ResultsPage: false,
      pointWarHitValue: Number(document.getElementById("rw-point-war-hit")?.value || 10),
      pointAssistValue: Number(document.getElementById("rw-point-assist")?.value || 3),
      pointOutsideHitValue: Number(document.getElementById("rw-point-outside")?.value || 2),
      pointRetaliationHitValue: Number(document.getElementById("rw-point-retal")?.value || 0.2),
      pointHospitalBonus: Number(document.getElementById("rw-point-hospital")?.value || 2),
      pointEnemyHospitalBonus: rwphPointEnemyHospitalBonusValue(),
      pointRespectValue: rwphPointRespectScoreValue(),
      pointRespectStep: rwphPointRespectStepValue(),
      pointFairFightEnabled: document.getElementById("rw-point-fair-fight")?.checked !== false,
      pointFairFightAvgStep: rwphPointFairFightAvgStepValue(),
      pointFairFightBonusPerStep: rwphPointFairFightBonusStepValue(),
      includeLeftFactionMembers: false,
      excludedMembersText: rwphGetExcludedMembersTextForMode(calculationMode),
      memberManagement: rwphGetMemberManagementPayload(calculationMode),
    };
  }

  function rwphValidateCacheFormForMode(calculationMode = "standard") {
    const payload = rwphBuildCacheRequestPayload(calculationMode);
    const mode = rwphNormalizeCalculationMode(calculationMode);
    // Cache lookup/open/delete should not be blocked by changed payout fields.
    // The saved cached report keeps its own Member Payout and Total Payout values.
    const sharedInvalid = !payload.userKey;
    const perHitInvalid = payload.warHitWeight < 0 || payload.outsideHitWeight < 0 || payload.retaliationHitWeight < 0 || payload.assistWeight < 0 || payload.respectWeight < 0;
    const pointsInvalid = payload.pointWarHitValue < 0 || payload.pointAssistValue < 0 || payload.pointOutsideHitValue < 0 || payload.pointRetaliationHitValue < 0 || payload.pointHospitalBonus < 0 || payload.pointRespectValue < 0 || payload.pointRespectStep <= 0 || (payload.pointFairFightEnabled !== false && (payload.pointFairFightAvgStep <= 0 || payload.pointFairFightBonusPerStep < 0));
    if (sharedInvalid || (mode === "standard" && perHitInvalid) || (mode === "points" && pointsInvalid)) {
      return { ok: false, payload };
    }
    return { ok: true, payload };
  }

  function rwphCacheStateSummaryText(calculationMode = null) {
    const mode = calculationMode ? rwphNormalizeCalculationMode(calculationMode) : null;
    const modes = mode ? [mode] : ["standard", "points"];
    const parts = [];
    for (const currentMode of modes) {
      const state = rwphEnsureCacheState(currentMode);
      if (!state.available) continue;
      const info = state.info || {};
      const cachedAtMs = Number(info?.cachedAtMs || info?.cache?.cachedAtMs || info?.summary?.cachedAtMs || 0);
      const expiresAtMs = Number(info?.expiresAtMs || info?.cache?.expiresAtMs || info?.summary?.cacheExpiresAtMs || 0);
      const savedText = cachedAtMs ? ` saved ${new Date(cachedAtMs).toLocaleString()}` : "";
      const expiryText = expiresAtMs ? ` expires ${new Date(expiresAtMs).toLocaleString()}` : "";
      parts.push(`${rwphModeLabel(currentMode)}${savedText}${expiryText}`);
    }
    if (parts.length) return `Database cached ${mode ? rwphModeLabel(mode) + " " : ""}report${parts.length === 1 ? "" : "s"} found: ${parts.join(" | ")}. Open it from the matching settings dropdown.`;
    if (mode) return `No matching ${rwphModeLabel(mode)} database cached report found yet. Calculate in ${rwphModeLabel(mode)} Settings will create one.`;
    return "No matching database cached reports found yet. Calculate in Basic Calculations or Advanced Calculations will create one.";
  }

  function rwphCacheStatusElements(calculationMode = null) {
    const mode = calculationMode ? rwphNormalizeCalculationMode(calculationMode) : null;
    const ids = mode === "standard"
      ? ["rw-cache-status-per-hit"]
      : mode === "points"
        ? ["rw-cache-status-points"]
        : ["rw-cache-status-per-hit", "rw-cache-status-points"];
    return ids.map((id) => document.getElementById(id)).filter(Boolean);
  }

  function rwphSetCacheStatusText(text, calculationMode = null) {
    for (const el of rwphCacheStatusElements(calculationMode)) {
      el.textContent = text;
    }
  }

  function rwphRenderCacheButtonStates(silent = false) {
    const buttonPairs = [
      { mode: "standard", useId: "rw-use-cache", deleteId: "rw-delete-cache" },
      { mode: "points", useId: "rw-use-points-cache", deleteId: "rw-delete-points-cache" },
    ];

    for (const pair of buttonPairs) {
      const state = rwphEnsureCacheState(pair.mode);
      const label = rwphModeLabel(pair.mode);
      const useBtn = document.getElementById(pair.useId);
      const deleteBtn = document.getElementById(pair.deleteId);
      if (useBtn) {
        useBtn.hidden = false;
        useBtn.disabled = !state.available;
        useBtn.textContent = "Use Cached Report";
        useBtn.title = state.available ? `Open the matching backend/database cached ${label} report for the selected war/time window.` : `RWPH auto-checks the backend/database for a matching ${label} cached report when your key and calculation settings are ready. Payout fields do not block cache matching.`;
      }
      if (deleteBtn) {
        deleteBtn.hidden = false;
        deleteBtn.disabled = !state.available;
        deleteBtn.textContent = "Delete Cache";
        deleteBtn.title = state.available ? `Delete the matching backend/database cached ${label} report. You can delete one cached report every 10 minutes.` : `Delete becomes available when RWPH finds a matching ${label} backend/database cached report.`;
      }
    }

    if (!silent || rwphEnsureCacheState("standard").available || rwphEnsureCacheState("points").available) {
      rwphSetCacheStatusText(rwphCacheStateSummaryText("standard"), "standard");
      rwphSetCacheStatusText(rwphCacheStateSummaryText("points"), "points");
    }
  }

  function rwphSetCacheButtonState(calculationMode, available, info = null, silent = false) {
    rwphClearLastResults();
    const mode = rwphNormalizeCalculationMode(calculationMode);
    const state = rwphEnsureCacheState(mode);
    state.available = !!available;
    state.info = info || null;
    if (mode === "standard") {
      rwphCachedReportAvailable = state.available;
      rwphCachedReportInfo = state.info;
    }
    rwphRenderCacheButtonStates(silent);
  }

  function rwphScheduleAutoCacheCheck(delayMs = 650) {
    if (rwphAutoCacheCheckTimer) clearTimeout(rwphAutoCacheCheckTimer);
    rwphAutoCacheCheckTimer = setTimeout(() => rwphAutoCheckCompletedWarCache(true), Math.max(100, Number(delayMs) || 650));
  }

  async function rwphAutoCheckCompletedWarCache(silent = true, calculationMode = null) {
    const status = document.getElementById("rw-status");
    const modes = calculationMode ? [rwphNormalizeCalculationMode(calculationMode)] : ["standard", "points"];
    const signature = `${calculationMode ? rwphNormalizeCalculationMode(calculationMode) : "both"}|${rwphGetPayoutCacheSignature(calculationMode)}`;

    if (silent && signature === rwphLastCacheCheckSignature) return;
    rwphLastCacheCheckSignature = signature;

    let checkedAny = false;
    let foundAny = false;

    for (const mode of modes) {
      const validation = rwphValidateCacheFormForMode(mode);
      const label = rwphModeLabel(mode);

      if (!validation.ok) {
        rwphSetCacheButtonState(mode, false, null, true);
        rwphSetCacheStatusText(`${label} cache auto-check waits for your API key and valid ${label} calculation settings.`, mode);
        continue;
      }

      checkedAny = true;
      try {
        rwphSetCacheStatusText(`Auto-checking ${label} report cache...`, mode);
        const result = await apiPost("/api/calc/report-cache", validation.payload);
        const isCached = !!result.cached;
        foundAny = foundAny || isCached;
        rwphSetCacheButtonState(mode, isCached, result, true);
        rwphSetCacheStatusText(rwphCacheStateSummaryText(mode), mode);
      } catch (e) {
        rwphSetCacheButtonState(mode, false, null, true);
        const useId = mode === "points" ? "rw-use-points-cache" : "rw-use-cache";
        const deleteId = mode === "points" ? "rw-delete-points-cache" : "rw-delete-cache";
        for (const id of [useId, deleteId]) {
          const btn = document.getElementById(id);
          if (btn) {
            btn.disabled = true;
            if (id.includes("use")) btn.textContent = "Use Cached Report";
            if (id.includes("delete")) btn.textContent = "Delete Cache";
            btn.title = e.message || `${label} cache auto-check failed.`;
          }
        }
        const transientTorn = /temporary backend error|Backend error occurred|Torn is still busy|tornCode.?17|Torn returned a temporary backend error/i.test(String(e.message || ""));
        rwphSetCacheStatusText(transientTorn ? `${label} cache auto-check skipped: Torn is temporarily busy. Calculate can be tried again in 30-60 seconds.` : `${label} cache auto-check failed: ${e.message}`, mode);
        if (!silent) rwphToastPanelError(status, transientTorn ? `${label} cache auto-check skipped because Torn is temporarily busy. Wait 30-60 seconds, then try again.` : `${label} cache auto-check error: ${e.message}`, "RWPH Cache");
      }
    }

    rwphRenderCacheButtonStates(true);

    if (!checkedAny && !calculationMode) {
      rwphSetCacheStatusText("Cache auto-check waits for your API key and valid calculation settings.");
    }

    if (!silent && status) {
      rwphToastPanelInfo(status, foundAny ? "Cached report found and ready to open." : "No matching cached reports found yet.", foundAny ? "info" : "warn", "RWPH Cache");
    }
  }

  async function rwphOpenCachedReport(calculationMode = "standard") {
    const mode = rwphNormalizeCalculationMode(calculationMode);
    const label = rwphModeLabel(mode);
    const status = document.getElementById("rw-status");
    const results = document.getElementById("rw-results");
    rwphClearLastResults();

    const validation = rwphValidateCacheFormForMode(mode);
    if (!validation.ok) {
      return rwphToastPanelError(status, `Enter your API key and valid ${label} calculation settings before opening a cached report. Payout fields do not need to match the saved cache.`, "RWPH Cache");
    }

    // v1.1.244: Use Cached Report now opens through a dedicated cache-open endpoint.
    // This avoids running the normal calculation route and lets the tab pre-open immediately
    // from the click handler, which fixes popup blockers for both Per Hit and Points System.
    const progressId = `rwph-cache-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    let preOpenedResultsTab = null;
    let stopProgressPolling = null;

    try {
      if (status) status.textContent = `Opening matching cached ${label} report...`;
      rwphSetCacheStatusText(`Opening matching cached ${label} report...`, mode);
      preOpenedResultsTab = openBlankResultsTab(progressId);
      stopProgressPolling = rwphStartResultsProgressPolling(preOpenedResultsTab, progressId);
      rwphSetResultsLoadingStepDone(preOpenedResultsTab, 0);

      const result = await apiPost("/api/calc/report-cache/open", {
        ...validation.payload,
        progressId,
      });

      lastRows = result.rows || [];
      lastSummary = result.summary || {};
      rwphStorePayAllRows(lastRows);
      rwphSaveLastResults(lastRows, lastSummary);
      rwphSetCacheButtonState(mode, true, {
        factionName: lastSummary?.factionName || result.factionName || "",
        cache: result.cache || null,
        expiresAtMs: result.cache?.expiresAtMs || 0,
        cachedAtMs: result.cache?.cachedAtMs || 0,
        summary: lastSummary,
      }, true);
      if (results) results.innerHTML = renderRows(lastRows, lastSummary);

      const manualOpenReady = rwphPrepareManualResultsOpenButton(preOpenedResultsTab, progressId, lastRows, lastSummary);
      if (stopProgressPolling) {
        stopProgressPolling();
        stopProgressPolling = null;
      }
      if (manualOpenReady) {
        rwphSetResultsLoadingStepDone(preOpenedResultsTab, 4, 100, "Results data complete. Click Open Results Page when you are ready.");
      } else {
        await rwphShowResultsLoadingCompletion(preOpenedResultsTab);
      }
      if (manualOpenReady) {
        const resultsPanel = document.getElementById("rw-results-panel");
        if (resultsPanel) {
          resultsPanel.hidden = true;
          resultsPanel.setAttribute("hidden", "");
          resultsPanel.style.display = "none";
        }
        rwphSetCacheStatusText(rwphCacheStateSummaryText(mode), mode);
        rwphToastPanelInfo(status, `Cached ${label} report loaded. Click Open Results Page in the loading panel when ready.`, "info", "RWPH Cache");
      } else {
        const resultsPanel = document.getElementById("rw-results-panel");
        if (resultsPanel) {
          resultsPanel.hidden = false;
          resultsPanel.removeAttribute("hidden");
          resultsPanel.style.display = "block";
          resultsPanel.style.visibility = "visible";
          resultsPanel.style.opacity = "1";
          resultsPanel.scrollTop = 0;
        }
        rwphSetCacheStatusText(rwphCacheStateSummaryText(mode), mode);
        rwphToastPanelInfo(status, `Cached ${label} report loaded in the panel because the loading panel was blocked.`, "warn", "RWPH Cache");
      }
    } catch (e) {
      if (stopProgressPolling) {
        stopProgressPolling();
        stopProgressPolling = null;
      }
      if (preOpenedResultsTab && !preOpenedResultsTab.closed) {
        try {
          preOpenedResultsTab.document.open();
          preOpenedResultsTab.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RWPH Cached Report</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#121212;color:#d7d7d7;font-family:Arial,Helvetica,sans-serif;padding:20px;text-align:center}.box{max-width:560px;border:1px solid #474747;border-radius:8px;background:linear-gradient(180deg,#242424,#1a1a1a);padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.45)}h1{margin:0 0 8px;color:#f2f2f2}p{color:#c8c8c8;font-weight:800}</style></head><body><div class="box"><h1>Cached Report Not Opened</h1><p>${esc(e.message || e)}</p><p>Close this tab, then use ${label} Settings Calculate to create or refresh the cached report.</p></div></body></html>`);
          preOpenedResultsTab.document.close();
        } catch (_) {}
      }
      rwphSetCacheButtonState(mode, false, null, true);
      rwphSetCacheStatusText(`${label} cached report open failed: ${e.message}`, mode);
      rwphToastPanelError(status, `${label} cached report open failed: ${e.message}`, "RWPH Cache");
    }
  }

  async function rwphDeleteMatchingCachedReport(calculationMode = "standard") {
    const mode = rwphNormalizeCalculationMode(calculationMode);
    const modeLabel = rwphModeLabel(mode);
    const status = document.getElementById("rw-status");
    const deleteBtn = document.getElementById(mode === "points" ? "rw-delete-points-cache" : "rw-delete-cache");
    const validation = rwphValidateCacheFormForMode(mode);

    if (!rwphEnsureCacheState(mode).available) {
      await rwphAutoCheckCompletedWarCache(false, mode);
    }
    if (!rwphEnsureCacheState(mode).available) {
      return rwphToastPanelError(status, `No matching ${modeLabel} database cached report was found to delete.`, "RWPH Cache");
    }
    if (!validation.payload.userKey) return rwphToastPanelError(status, "Enter your Torn API key before deleting a cached report.", "RWPH Cache");
    if (validation.payload.totalPayout <= 0) return rwphToastPanelError(status, "Enter a Member Payout greater than 0 before deleting a cached report.", "RWPH Cache");

    try {
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = "Deleting...";
      }
      rwphSetCacheStatusText(`Deleting matching ${modeLabel} database cached report...`, mode);
      const result = await apiPost("/api/calc/report-cache/delete", validation.payload);
      rwphLastCacheCheckSignature = "";
      rwphSetCacheButtonState(mode, false, null, false);
      rwphSetCacheStatusText(result.deleted ? `Cached ${modeLabel} report deleted. ${modeLabel} Settings Calculate can create a fresh report.` : (result.message || `No matching ${modeLabel} database cached report was found to delete.`), mode);
      rwphToastPanelInfo(status, result.message || `Cached ${modeLabel} report deleted.`, result.deleted ? "info" : "warn", "RWPH Cache");
    } catch (e) {
      const wait = Number(e?.retryAfterSeconds || 0);
      const msg = wait > 0 ? `You can delete one cached report every 10 minutes. Wait ${wait} seconds, then try again.` : `Delete cached report error: ${e.message}`;
      rwphSetCacheStatusText(msg);
      rwphToastPanelError(status, msg, "RWPH Cache");
      rwphRenderCacheButtonStates(true);
    }
  }

  function rwphWarSourceLabel(value) {
    if (value === "current-ranked-war-report") return "Current RW Report";
    if (value === "last-ranked-war-report") return "Last RW Report";
    if (value === "current-ranked-war") return "Current RW";
    if (value === "last-ranked-war") return "Last RW";
    if (value === "manual-fallback") return "Manual";
    return value ? String(value) : "Manual";
  }

  function renderRows(rows, summary) {
    if (!rows || !rows.length) return `<div class="rw-muted">No payable or tracked attacks found.</div>`;
    const pointsMode = !!(summary?.pointsMode || summary?.calculationMode === "points");
    const includeLeftFactionMembers = false;
    const removedLeftFactionHits = Number(summary?.removedLeftFactionHits ?? summary?.calcMeta?.removedLeftFactionHits ?? summary?.calcMeta?.manualExcludedMembersHits ?? 0);

    return `
      <div class="rw-summary">
        <b>Member Payout:</b> ${money(rwphSummaryMemberPayout(summary, rows))} | <b>Total Payout:</b> ${money(rwphSummaryOverallTotalPayout(summary, rows))}<br>
        ${summary?.selectedWar?.timeSource ? `<b>War source:</b> ${esc(rwphWarSourceLabel(summary.selectedWar.timeSource))}<br>` : ""}
        <b>${pointsMode ? "Total points" : "Total weight"}:</b> ${Number(pointsMode ? (summary?.totalPoints ?? summary?.totalWeight ?? 0) : (summary?.totalWeight || 0)).toFixed(2)} |
        <b>${pointsMode ? "Scored events" : "Payable events"}:</b> ${Number(summary?.calcMeta?.payableEvents || 0)}<br>
        ${pointsMode ? `<b>Own-faction hospital hits:</b> ${Number(summary?.totalHospitalizingHits || 0)} | <b>Enemy war hospital hits:</b> ${Number(summary?.totalEnemyFactionHospitalizingHits || 0)}<br><b>Own hospital bonus:</b> ${Number(summary?.totalHospitalBonusPoints || summary?.totalOwnFactionHospitalBonusPoints || 0).toFixed(2)} | <b>Enemy hospital bonus:</b> ${Number(summary?.totalEnemyFactionHospitalBonusPoints || 0).toFixed(2)} | <b>Fair-fight bonus:</b> ${Number(summary?.totalFairFightBonusPoints || 0).toFixed(2)}<br>` : ""}
        <b>Total respect:</b> ${Number(summary?.totalRespect || 0).toFixed(2)} |
        <b>Respect:</b> ${Number(summary?.payoutRespect ?? summary?.respect ?? 0).toFixed(2)}<br>
        <b>War hits:</b> ${Number(summary?.totalWarHits ?? summary?.totalHits ?? 0)} |
        <b>Assists:</b> ${Number(summary?.totalAssists || 0)}<br>
        <b>Outside hits:</b> ${Number(summary?.totalOutsideHits || 0)} |
        <b>Retaliation hits:</b> ${Number(summary?.totalRetaliationHits || 0)}<br>
        <b>Tracked hits:</b> ${Number(summary?.totalTrackedHits || 0)} |
        <b>Removed member hits:</b> ${removedLeftFactionHits}<br>
        <b>Fetched attacks:</b> ${Number(summary?.attacksFetched || 0)}<br>
        <b>Own faction attacks:</b> ${Number(summary?.calcMeta?.ownFactionAttacks || 0)} |
        <b>Skipped failed:</b> ${Number(summary?.calcMeta?.skippedFailed || 0)}<br>
        ${(summary?.warnings || []).length ? `<div class="rw-code">${(summary.warnings || []).map(esc).join("<br>")}</div>` : ""}
        </div>
        <div class="rw-actions">
          <button class="secondary" data-export-html="1">Export Html</button>
          <button class="secondary" data-export-csv="1">Export CSV</button>
          <button class="secondary" data-pay-all="1">Payments</button>
        </div>
      </div>
      <div class="rw-card-list">
        ${rows.map((r, index) => {
          const name = r.name || `Unknown ${r.id}`;
          const id = r.id || "unknown";
          const attacks = Number(r.warHits ?? r.attacks ?? 0);
          const assists = Number(r.assists || 0);
          const outsideHits = Number(r.outsideHits || 0);
          const retaliationHits = Number(r.retaliationHits || 0);
          const weight = Number(r.weight || 0);
          const points = Number(r.points ?? r.weight ?? 0);
          const totalRespect = Number(r.totalRespect ?? r.respect ?? 0);
          const respect = Number(r.respect || 0);
          const payout = Number(r.payout || 0);

          return `
            <div class="rw-result-card">
              <div class="rw-result-top">
                <div class="rw-result-player">
                  <div class="rw-result-name">${index + 1}. ${esc(name)}</div>
                  <div class="rw-result-id">Torn ID: ${esc(id)}</div>
                </div>
                <div class="rw-result-payout">${money(payout)}</div>
              </div>
              <div class="rw-stat-grid">
                <div class="rw-stat-box"><div class="rw-stat-label">War Hits</div><div class="rw-stat-value">${attacks}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Assists</div><div class="rw-stat-value">${assists}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Outside Hits</div><div class="rw-stat-value">${outsideHits}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Retals</div><div class="rw-stat-value">${retaliationHits}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Tracked</div><div class="rw-stat-value">${Number(r.totalTrackedHits || 0)}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Payable</div><div class="rw-stat-value">${Number(r.payableEvents || 0)}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">${pointsMode ? "Points" : "Weight"}</div><div class="rw-stat-value">${pointsMode ? points.toFixed(2) : weight.toFixed(2)}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">${pointsMode ? "Own-Faction Hospital Hits" : "Respect"}</div><div class="rw-stat-value">${pointsMode ? Number(r.hospitalizingHits || 0) : respect.toFixed(2)}</div></div>
                ${pointsMode ? `<div class="rw-stat-box"><div class="rw-stat-label">Enemy War Hospital Hits</div><div class="rw-stat-value">${Number(r.enemyFactionHospitalizingHits || 0)}</div></div><div class="rw-stat-box"><div class="rw-stat-label">Enemy Hospital Bonus</div><div class="rw-stat-value">${Number(r.enemyFactionHospitalBonusPoints || 0).toFixed(2)}</div></div><div class="rw-stat-box"><div class="rw-stat-label">Fair Bonus</div><div class="rw-stat-value">${Number(r.fairFightBonusPoints || 0).toFixed(2)}</div></div><div class="rw-stat-box"><div class="rw-stat-label">FF/Payable Hit</div><div class="rw-stat-value">${Number(r.fairFightPerPayableHitBonus || 0).toFixed(2)}</div></div><div class="rw-stat-box"><div class="rw-stat-label">Avg FF</div><div class="rw-stat-value">${Number(r.avgFairFight || 1).toFixed(2)}x</div></div>` : ""}
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }


  function rwphEnsurePayAllStandaloneStyles() {
    if (document.getElementById("rw-pay-all-standalone-style")) return;
    const style = document.createElement("style");
    style.id = "rw-pay-all-standalone-style";
    style.textContent = `
      .rw-pay-all-panel {
        position: fixed !important;
        z-index: 2147483647 !important;
        top: 78px !important;
        left: 12px !important;
        right: auto !important;
        width: min(360px, calc(100vw - 24px)) !important;
        max-height: calc(100vh - 116px) !important;
        overflow: hidden !important;
        display:flex !important;
        flex-direction:column !important;
        padding: 9px !important;
        border: 1px solid rgba(251,191,36,.28) !important;
        border-radius: 18px !important;
        background: radial-gradient(circle at 18% 0%, rgba(245,158,11,.18), transparent 34%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96)) !important;
        color: #f8fafc !important;
        box-shadow: 0 20px 60px rgba(0,0,0,.58), 0 0 28px rgba(245,158,11,.12) !important;
        font-family: Inter, Segoe UI, Arial, sans-serif !important;
        text-align: center !important;
      }
      .rw-pay-all-panel[hidden] { display:none !important; }
      .rw-pay-all-head { cursor: move; touch-action:none; display:flex; justify-content:center; align-items:center; padding: 0 28px 8px; position:sticky; top:0; z-index:5; flex:0 0 auto; }
      .rw-pay-all-title { font-weight:950; color:#fff2dd; font-size:13px; }
      .rw-pay-all-note { color:#c7d2fe; font-size:10px; line-height:1.35; margin:0 18px 7px; }
      .rw-pay-all-balance-warning { margin:0 2px 8px; padding:9px 8px; border-radius:13px; border:2px solid rgba(250,204,21,.76); border-left:6px solid rgba(249,115,22,.92); background:linear-gradient(180deg, rgba(120,53,15,.88), rgba(69,26,3,.84)); color:#fff7ed; font:950 11px/1.32 Arial,Helvetica,sans-serif; text-align:center; box-shadow:0 0 20px rgba(245,158,11,.18), inset 0 1px 0 rgba(255,255,255,.07); }
      .rw-pay-all-balance-warning b { color:#fef3c7; }
      .rw-pay-all-accept-warning { display:inline-flex !important; align-items:center !important; justify-content:center !important; width:100% !important; margin:8px 0 5px !important; padding:8px 10px !important; min-height:32px !important; border-radius:11px !important; border:2px solid rgba(254,243,199,.78) !important; background:linear-gradient(135deg, rgba(250,204,21,.96), rgba(249,115,22,.94)) !important; color:#1b1208 !important; font:950 12px/1.15 Arial,Helvetica,sans-serif !important; letter-spacing:.35px !important; text-transform:uppercase !important; cursor:pointer !important; box-shadow:0 0 18px rgba(245,158,11,.30), inset 0 1px 0 rgba(255,255,255,.25) !important; }
      .rw-pay-all-accept-warning.rw-pay-all-warning-accepted, .rw-pay-all-accept-warning:disabled { border-color:rgba(34,197,94,.56) !important; background:linear-gradient(135deg, rgba(34,197,94,.88), rgba(21,128,61,.88)) !important; color:#ecfdf5 !important; cursor:default !important; }
      .rw-pay-all-warning-state { color:#fef3c7; font:900 9.5px/1.25 Arial,Helvetica,sans-serif; opacity:.98; }
      .rw-pay-all-panel[data-pay-warning-accepted="1"] .rw-pay-all-warning-state { color:#bbf7d0; }
      .rw-pay-all-info { margin:0 8px 8px; padding:8px 9px; border-radius:12px; border:1px solid rgba(251,191,36,.16); background:rgba(15,23,42,.62); color:#fff2dd; font-size:9.5px; line-height:1.35; text-align:left; }
      .rw-pay-all-info b { color:#fff2dd; }
      .rw-pay-all-info ul { margin:5px 0 0 13px; padding:0; }
      .rw-pay-all-info li { margin:2px 0; }
      .rw-pay-all-close { position:absolute !important; top:10px !important; right:12px !important; width:36px !important; height:36px !important; min-width:36px !important; min-height:36px !important; padding:0 !important; display:grid !important; place-items:center !important; border-radius:14px !important; border:1px solid rgba(251,191,36,.24) !important; border-left:4px solid rgba(245,158,11,.66) !important; background:linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.88)) !important; color:#fff7ed !important; font:950 20px/1 Arial,Helvetica,sans-serif !important; box-shadow:0 1px 0 rgba(255,255,255,.045) inset,0 12px 26px rgba(0,0,0,.26) !important; text-shadow:0 1px 0 rgba(0,0,0,.75) !important; cursor:pointer !important; z-index:120 !important; }
      .rw-pay-all-reopen-report { position:absolute !important; top:10px !important; right:56px !important; min-height:36px !important; padding:0 10px !important; border-radius:14px !important; z-index:120 !important; font:950 10px/1.1 Arial,Helvetica,sans-serif !important; white-space:nowrap !important; }
      .rw-pay-all-undo { margin:0 0 8px; padding:6px 8px; min-height:26px; border-radius:10px; border:1px solid rgba(251,191,36,.28); background:linear-gradient(135deg, rgba(30,41,59,.96), rgba(49,46,129,.88)); color:#fff7ed; font-size:10px; font-weight:950; cursor:pointer; }
      .rw-pay-all-list { display:grid; gap:6px; overflow-y:auto; overflow-x:hidden; min-height:0; flex:1 1 auto; padding-right:3px; scrollbar-width:thin; scrollbar-color:rgba(245,158,11,.86) rgba(15,23,42,.36); }
      .rw-pay-all-list::-webkit-scrollbar { width:8px; height:8px; }
      .rw-pay-all-list::-webkit-scrollbar-track { background:rgba(15,23,42,.34); border-radius:999px; }
      .rw-pay-all-list::-webkit-scrollbar-thumb { background:linear-gradient(180deg, rgba(251,191,36,.96), rgba(245,158,11,.88)); border:2px solid rgba(15,23,42,.50); border-radius:999px; }
      .rw-pay-all-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:5px; align-items:center; padding:7px; border-radius:12px; border:1px solid rgba(251,191,36,.16); background:rgba(15,23,42,.72); }
      .rw-pay-all-member { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; font-weight:900; color:#f8fafc; }
      .rw-pay-all-payout { display:block; margin-top:1px; color:#86efac; font-size:10px; font-weight:950; }
      .rw-pay-all-copy { display:inline-flex !important; align-items:center; justify-content:center; width:auto !important; max-width:none !important; padding:5px 6px; min-height:24px; border-radius:9px; border:1px solid rgba(251,191,36,.28); background:linear-gradient(135deg, rgba(30,41,59,.96), rgba(49,46,129,.88)); color:#fff7ed; font-size:10px; font-weight:950; cursor:pointer; white-space:nowrap; }
      .rw-pay-all-copy[disabled], .rw-pay-all-copy[aria-disabled="true"], .rw-pay-all-copy[data-pay-prefill-locked="1"] { opacity:.42 !important; cursor:not-allowed !important; filter:grayscale(.55) !important; box-shadow:none !important; pointer-events:none !important; }
      .rw-pay-all-copy.rwph-pay-button-hidden { display:none !important; visibility:hidden !important; pointer-events:none !important; }
      .rw-resize-handle { position:absolute; width:18px; height:18px; z-index:8; touch-action:none; -webkit-user-select:none; user-select:none; opacity:.95; background:rgba(2,6,23,.18); }
      .rw-resize-handle-se { right:7px; bottom:7px; cursor:nwse-resize; border-right:2px solid rgba(251,191,36,.80); border-bottom:2px solid rgba(251,191,36,.80); border-radius:0 0 8px 0; }
      .rw-resize-handle-sw { left:7px; bottom:7px; cursor:nesw-resize; border-left:2px solid rgba(251,191,36,.80); border-bottom:2px solid rgba(251,191,36,.80); border-radius:0 0 0 8px; }
      .rw-resize-handle-nw { left:7px; top:7px; cursor:nwse-resize; border-left:2px solid rgba(251,191,36,.80); border-top:2px solid rgba(251,191,36,.80); border-radius:8px 0 0 0; }
      @media (max-width: 760px), (pointer: coarse) {
        .rw-pay-all-panel { top: 64px !important; left: 8px !important; right: auto !important; width: min(360px, calc(100vw - 16px)) !important; max-height: calc(100vh - 96px) !important; }
        .rw-pay-all-row {
          grid-template-columns: minmax(0, 1fr) max-content max-content !important;
          grid-auto-flow: column !important;
          gap:4px !important;
          padding:6px !important;
          align-items:center !important;
        }
        .rw-pay-all-member { min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
        .rw-pay-all-copy {
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          width:auto !important;
          max-width:none !important;
          padding:4px 5px !important;
          min-height:24px !important;
          min-width:46px !important;
          font-size:9px !important;
          white-space:nowrap !important;
          flex:0 0 auto !important;
        }
        .rw-pay-all-head { min-height:42px !important; padding-top:8px !important; padding-bottom:8px !important; touch-action:none !important; cursor:grab !important; }
        .rw-resize-handle { width:30px !important; height:30px !important; z-index:60 !important; background:rgba(2,6,23,.28) !important; }
        .rw-resize-handle-se { right:3px !important; bottom:3px !important; border-width:3px !important; }
        .rw-resize-handle-sw { left:3px !important; bottom:3px !important; border-width:3px !important; }
        .rw-resize-handle-nw { left:3px !important; top:3px !important; border-width:3px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  let rwphPayAllActiveScope = null;
  let rwphPayAllLastMemberField = null;

  function rwphPayAllFieldScope(el) {
    if (!el || !el.closest) return null;
    const selectors = [
      "form",
      "[role='dialog']",
      "[aria-modal='true']",
      "[class*='modal']",
      "[class*='popup']",
      "[class*='dialog']",
      "[class*='money']",
      "[class*='bank']",
      "[class*='payment']",
      "[class*='pay']",
      "[class*='send']",
      "[class*='give']",
      "[class*='transfer']",
      "section",
      "article",
      "main"
    ].join(",");
    const scope = el.closest(selectors);
    return (scope && scope !== document.body && scope !== document.documentElement) ? scope : null;
  }

  function rwphPayAllFieldsInScope(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    return Array.from(root.querySelectorAll("input, textarea, [contenteditable='true'], [role='textbox'], [role='spinbutton']"))
      .filter(rwphSendHelperVisible)
      .filter((el) => !el.disabled && !el.readOnly && el.getAttribute?.("aria-disabled") !== "true")
      .filter((el) => !el.closest?.("#rw-pay-all-panel, #rw-payout-helper, #rwph-xanax-send-status, .rw-pay-all-panel"))
      .filter((el) => {
        const type = String(el.type || "").toLowerCase();
        return !["hidden", "button", "submit", "reset", "checkbox", "radio", "file", "image", "password"].includes(type);
      });
  }

  function renderPayAllCopyPanelHtml(rows) {
    const safeRows = rows || [];
    return `
      <div id="rw-pay-all-panel" class="rw-pay-all-panel" hidden>
        <button type="button" class="danger rw-pay-all-close" data-pay-all-close="1">×</button>
        ${rwphRecentPayAllReportButtonHtml()}
        <div class="rw-pay-all-head">
          <div class="rw-pay-all-title">Payments Copy Panel</div>
        </div>
        <div class="rw-pay-all-note">Use this helper inside Torn faction controls. It is a payout checklist, not an automatic payment sender.</div>
        <div class="rw-pay-all-balance-warning" data-pay-warning-box="1">
          <div><b>BIG WARNING:</b> In Torn faction controls, change the payment type from <b>Give money</b> to <b>Add To Balance</b> before paying members. Check this before every payout.</div>
          <button type="button" class="rw-pay-all-accept-warning" data-pay-warning-accept="1">Accept Warning</button>
          <div class="rw-pay-all-warning-state" data-pay-warning-state="1">Prefill buttons are locked until you accept this warning.</div>
        </div>
        <div class="rw-pay-all-info">
          <b>How to use:</b>
          <ul>
            <li><b>Name + ID</b> copies/prefills the member.</li>
            <li><b>Amount</b> copies/prefills the payout money.</li>
            <li>Buttons disappear after one click so you can track progress.</li>
            <li>Use <b>Bring Back Disappeared Button</b> to bring back only the most recently hidden button.</li>
            <li>Open the correct add money/banking fields first. If Torn hides the amount field until a member is selected, press Name + ID first, then press Amount.</li>
            <li>You manually review and confirm every payment in Torn.</li>
          </ul>
        </div>
        <button type="button" class="secondary rw-pay-all-undo" data-pay-all-undo="1">Bring Back Disappeared Button</button>
        <div class="rw-pay-all-list">
          ${safeRows.map((r, index) => {
            const name = r.name || `Unknown ${r.id || "unknown"}`;
            const id = String(r.id || "unknown");
            const payout = rwphPayAllRowAmount(r);
            return `
              <div class="rw-pay-all-row">
                <div class="rw-pay-all-member">${index + 1}. ${esc(name)} [${esc(id)}]<span class="rw-pay-all-payout">${money(payout)}</span></div>
                <button type="button" class="secondary rw-pay-all-copy" data-pay-copy-name="${index}" data-pay-prefill-locked="1" aria-disabled="true" disabled>Name + ID</button>
                <button type="button" class="secondary rw-pay-all-copy" data-pay-copy-amount="${index}" data-pay-prefill-locked="1" aria-disabled="true" disabled>Amount</button>
              </div>`;
          }).join("") || `<div class="rw-pay-all-row"><div class="rw-pay-all-member">No payable members found.</div></div>`}
        </div>
      </div>`;
  }

  function rwphSetPayAllWarningAccepted(panel, accepted) {
    if (!panel) return;
    const isAccepted = !!accepted;
    panel.dataset.payWarningAccepted = isAccepted ? "1" : "0";
    for (const btn of Array.from(panel.querySelectorAll(".rw-pay-all-copy"))) {
      const alreadyHidden = btn.hidden || btn.classList?.contains("rwph-pay-button-hidden") || btn.getAttribute("aria-hidden") === "true";
      if (alreadyHidden) continue;
      btn.disabled = !isAccepted;
      if (isAccepted) {
        btn.removeAttribute("aria-disabled");
        btn.removeAttribute("data-pay-prefill-locked");
      } else {
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("data-pay-prefill-locked", "1");
      }
    }
    const acceptBtn = panel.querySelector("[data-pay-warning-accept]");
    if (acceptBtn) {
      acceptBtn.disabled = isAccepted;
      acceptBtn.classList.toggle("rw-pay-all-warning-accepted", isAccepted);
      acceptBtn.textContent = isAccepted ? "Warning Accepted" : "Accept Warning";
      acceptBtn.setAttribute("aria-pressed", isAccepted ? "true" : "false");
    }
    const state = panel.querySelector("[data-pay-warning-state]");
    if (state) {
      state.textContent = isAccepted
        ? "Unlocked. Still manually check Add To Balance before every payout."
        : "Prefill buttons are locked until you accept this warning.";
    }
  }

  function rwphIsPayAllWarningAccepted(panel) {
    return !!(panel && panel.dataset?.payWarningAccepted === "1");
  }

  function rwphRequirePayAllWarningAccepted(panel, statusEl = null) {
    if (rwphIsPayAllWarningAccepted(panel)) return true;
    rwphToastPanelInfo(statusEl && rwphCanWriteStatusText(statusEl) ? statusEl : null, "Click Accept Warning first, then confirm Torn is set to Add To Balance before using prefill buttons.", "warn", "RWPH Payments");
    return false;
  }

  function closePayAllCopyPanel() {
    const existing = document.getElementById("rw-pay-all-panel");
    if (existing) existing.remove();
  }

  function rwphPayAllFieldMeta(el) {
    if (!el) return "";
    const attrs = ["id", "class", "name", "placeholder", "aria-label", "title", "data-name", "data-id", "type", "role"];
    const attrText = attrs.map((a) => String(el.getAttribute?.(a) || "")).join(" ");
    const wrap = rwphSendHelperText(el.closest?.("label, div, li, tr, td, section, form") || el.parentElement || el);
    return `${attrText} ${wrap}`.replace(/\s+/g, " ").toLowerCase();
  }

  function rwphPayAllEditableFields(scope = null) {
    return rwphPayAllFieldsInScope(scope || document);
  }


  function rwphFindPayAllMemberField() {
    const fields = rwphPayAllEditableFields();
    const scored = fields.map((el) => {
      const meta = rwphPayAllFieldMeta(el);
      let score = 0;
      if (/\b(user|player|member|recipient|name|id|torn)\b/.test(meta)) score += 8;
      if (/\b(to|add|target|search)\b/.test(meta)) score += 2;
      if ((el.tagName || "").toLowerCase() === "input" && ["text", "search", ""].includes(String(el.type || "").toLowerCase())) score += 2;
      if (/\b(amount|money|cash|balance|dollar|qty|quantity|message|comment|reason|note)\b/.test(meta)) score -= 12;
      return { el, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

    return scored[0]?.el || fields.find((el) => {
      const meta = rwphPayAllFieldMeta(el);
      return !/\b(amount|money|cash|balance|dollar|qty|quantity|message|comment|reason|note)\b/.test(meta) && String(el.type || "").toLowerCase() !== "number";
    }) || null;
  }

  function rwphFindPayAllAmountField(scope = null) {
    const scopedFields = scope ? rwphPayAllEditableFields(scope) : [];
    const fields = scopedFields.length ? scopedFields : rwphPayAllEditableFields();
    const amountRe = /\b(amount|money|cash|balance|dollar|payout|payment|pay|value|funds|give|transfer|deposit|send|add\s*money|add\s*to\s*balance)\b/;
    const hardNoRe = /\b(message|comment|reason|note|search|filter|api|key|code)\b/;
    const memberRe = /\b(user|player|member|recipient|username|profile|name|id|torn)\b/;

    const fieldTypeScore = (el) => {
      const type = String(el.type || "").toLowerCase();
      const inputMode = String(el.getAttribute?.("inputmode") || "").toLowerCase();
      let score = 0;
      if (["number", "tel"].includes(type)) score += 10;
      if (/\b(numeric|decimal)\b/.test(inputMode)) score += 8;
      if (el.getAttribute?.("role") === "spinbutton") score += 6;
      if ((el.tagName || "").toLowerCase() === "input" && ["text", "", "tel", "number"].includes(type)) score += 2;
      return score;
    };

    // Best case: Torn exposes useful field text, name, id, placeholder, type, role, or inputmode.
    // When Name + ID was clicked first, prefer amount-like fields after that current member field.
    const memberIndex = rwphPayAllLastMemberField ? fields.indexOf(rwphPayAllLastMemberField) : -1;
    const scored = fields.map((el, index) => {
      const meta = rwphPayAllFieldMeta(el);
      const hasAmountWords = amountRe.test(meta) || /[$]/.test(meta);
      let score = fieldTypeScore(el);
      if (hasAmountWords) score += 18;
      if (/\b(add\s*money|add\s*to\s*balance|give|transfer|deposit|send|payment|payout)\b/.test(meta)) score += 8;
      if (/[$]/.test(meta)) score += 5;
      // Do not reject an amount field just because the surrounding Torn form also contains member text.
      // Only penalize member/search words when the field has no money/amount clues.
      if (memberRe.test(meta) && !hasAmountWords) score -= 18;
      if (hardNoRe.test(meta) && !hasAmountWords) score -= 20;
      if (memberIndex >= 0) {
        if (index > memberIndex) score += 6;
        else score -= 10;
        score -= Math.min(Math.abs(index - memberIndex), 20) * 0.02;
      } else {
        score += Math.min(index, 8) * 0.05;
      }
      return { el, score, meta, hasAmountWords };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

    if (scored[0]?.el) return scored[0].el;

    const numeric = fields.find((el) => {
      const meta = rwphPayAllFieldMeta(el);
      const typeScore = fieldTypeScore(el);
      if (!typeScore) return false;
      return !hardNoRe.test(meta) && !/\b(search|filter|message|comment|reason|note)\b/.test(meta);
    });
    if (numeric) return numeric;

    // Last-resort Torn fallback: after the current member field is visible, use the next editable field in the same active payment form.
    const memberField = rwphPayAllLastMemberField && rwphSendHelperVisible(rwphPayAllLastMemberField)
      ? rwphPayAllLastMemberField
      : rwphFindPayAllMemberField();
    const startIndex = memberField ? fields.indexOf(memberField) + 1 : 0;
    const afterMember = fields.slice(Math.max(0, startIndex)).find((el) => {
      const meta = rwphPayAllFieldMeta(el);
      const type = String(el.type || "").toLowerCase();
      if (["search", "email", "url"].includes(type)) return false;
      if (hardNoRe.test(meta)) return false;
      if (amountRe.test(meta) || fieldTypeScore(el) > 0) return true;
      return !memberRe.test(meta);
    });
    return afterMember || null;
  }


  function rwphIsTouchPhoneOrPda() {
    try {
      return !!(window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches || /Android|iPhone|iPad|iPod|Mobile|TornPDA|Torn PDA/i.test(navigator.userAgent || ""));
    } catch (_) {
      return false;
    }
  }

  function rwphSetPayAllFieldValue(el, value) {
    if (!el) return false;

    const text = String(value ?? "");
    const touchMode = rwphIsTouchPhoneOrPda();

    // On Torn PDA/phones, focusing Torn's payment fields opens the software keypad.
    // For the Payments Copy Panel we set values silently and blur afterwards, so copy/prefill buttons stay fast.
    if (el.getAttribute?.("contenteditable") === "true" || el.getAttribute?.("role") === "textbox") {
      if (!touchMode) return rwphSetContentEditable(el, text);
      try {
        el.textContent = text;
        el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: text, inputType: "insertText" }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        el.blur?.();
        document.activeElement?.blur?.();
        return true;
      } catch (_) {
        return false;
      }
    }

    let oldReadOnly;
    let hadReadOnly = false;
    let oldInputMode;
    if (touchMode) {
      try {
        oldReadOnly = el.readOnly;
        hadReadOnly = el.hasAttribute?.("readonly") || false;
        oldInputMode = el.getAttribute?.("inputmode");
        el.setAttribute?.("inputmode", "none");
        // Keep the field from summoning the keypad if the browser focuses it because of Torn handlers.
        try { el.readOnly = true; } catch (_) {}
      } catch (_) {}
    } else {
      el.focus?.({ preventScroll: true });
      el.click?.();
    }

    try {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc?.set) desc.set.call(el, text);
      else el.value = text;
    } catch {
      try { el.value = text; } catch { return false; }
    } finally {
      if (touchMode) {
        try {
          if (oldInputMode === null || oldInputMode === undefined) el.removeAttribute?.("inputmode");
          else el.setAttribute?.("inputmode", oldInputMode);
          try { el.readOnly = oldReadOnly; } catch (_) {}
          if (!hadReadOnly) el.removeAttribute?.("readonly");
        } catch (_) {}
      }
    }

    try { el.setAttribute?.("value", text); } catch {}
    [
      new InputEvent("beforeinput", { bubbles: true, cancelable: true, data: text, inputType: "insertText" }),
      new InputEvent("input", { bubbles: true, cancelable: true, data: text, inputType: "insertText" }),
      new Event("change", { bubbles: true }),
      new KeyboardEvent("keyup", { bubbles: true, key: "0", code: "Digit0" }),
      new Event("blur", { bubbles: true }),
    ].forEach((evt) => { try { el.dispatchEvent(evt); } catch {} });

    if (touchMode) {
      try { el.blur?.(); } catch (_) {}
      try { document.activeElement?.blur?.(); } catch (_) {}
    }

    return true;
  }


  async function rwphPrefillPayAllMember(row) {
    const id = String(row?.id || "unknown");
    const name = row?.name || `Unknown ${id}`;
    const value = `${name} [${id}]`;
    const field = rwphFindPayAllMemberField();
    rwphPayAllLastMemberField = field || null;
    rwphPayAllActiveScope = rwphPayAllFieldScope(field) || null;
    const filled = rwphSetPayAllFieldValue(field, value);
    // Some Torn faction-control forms rebuild the amount input after a member is selected.
    // Keep the active form context tied to the latest selected member before the Amount button runs.
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (field && rwphSendHelperVisible(field)) {
      rwphPayAllLastMemberField = field;
      rwphPayAllActiveScope = rwphPayAllFieldScope(field) || rwphPayAllActiveScope;
    }
    await copyText(value).catch(() => false);
    return { filled, value };
  }

  async function rwphPrefillPayAllAmount(row) {
    const value = String(rwphPayAllRowAmount(row));
    const scope = rwphPayAllActiveScope && rwphSendHelperVisible(rwphPayAllActiveScope) ? rwphPayAllActiveScope : null;
    let field = rwphFindPayAllAmountField(scope);
    let filled = rwphSetPayAllFieldValue(field, value);
    // Torn can render/re-render the amount field shortly after the member field/search selection changes.
    // Prefer the current member's active form/scope so the next payout does not land in an old amount box.
    for (let attempt = 0; !filled && attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const retryScope = rwphPayAllActiveScope && rwphSendHelperVisible(rwphPayAllActiveScope) ? rwphPayAllActiveScope : null;
      field = rwphFindPayAllAmountField(retryScope);
      filled = rwphSetPayAllFieldValue(field, value);
    }
    if (filled && field) {
      try { field.dataset.rwphLastPayAllAmountAt = String(Date.now()); } catch (_) {}
    }
    await copyText(value).catch(() => false);
    return { filled, value };
  }

  function rwphDismissPayAllCopyPopupsSilently() {
    try {
      ["rwph-info-popup-panel-live", "rwphFullPopupPanelLive"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll?.(".rwph-info-popup-panel").forEach((el) => {
        try { el.remove(); } catch (_) {}
      });
    } catch (_) {}
  }

  function rwphHidePayAllActionButton(btn, label, stack) {
    if (!btn) return;
    btn.dataset.rwphOriginalText = label || btn.textContent || "Button";
    btn.textContent = btn.dataset.rwphOriginalText;
    btn.classList.add("rwph-pay-button-hidden");
    btn.hidden = true;
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
    try {
      btn.style.setProperty("display", "none", "important");
      btn.style.setProperty("visibility", "hidden", "important");
      btn.style.setProperty("pointer-events", "none", "important");
    } catch (_) {}
    if (stack) stack.push(btn);
  }

  function rwphUndoLastPayAllDisappear(stack) {
    if (!stack) return false;
    while (stack.length) {
      const btn = stack.pop();
      if (btn && btn.isConnected) {
        btn.classList.remove("rwph-pay-button-hidden");
        btn.hidden = false;
        btn.disabled = false;
        btn.removeAttribute("aria-hidden");
        try {
          btn.style.removeProperty("display");
          btn.style.removeProperty("visibility");
          btn.style.removeProperty("pointer-events");
        } catch (_) {}
        btn.textContent = btn.dataset.rwphOriginalText || btn.textContent || "Button";
        return true;
      }
    }
    return false;
  }

  function openPayAllCopyPanel(rows) {
    closePayAllCopyPanel();
    rwphEnsurePayAllStandaloneStyles();
    const safeRows = rows || [];
    const wrap = document.createElement("div");
    wrap.innerHTML = renderPayAllCopyPanelHtml(safeRows);
    const panel = wrap.firstElementChild;
    document.body.appendChild(panel);
    panel.hidden = false;
    rwphSetPayAllWarningAccepted(panel, false);
    rwphEnablePanelMoveResize(panel, ".rw-pay-all-head");
    rwphSchedulePayAllReportButtonExpiry(panel);
    rwphConsumeCrossTabPopup("payments", panel, 550);
    const payAllUndoStack = [];

    panel.addEventListener("click", async (e) => {
      const closeBtn = e.target.closest?.("[data-pay-all-close]");
      if (closeBtn) {
        closePayAllCopyPanel();
        return;
      }

      const reopenReportBtn = e.target.closest?.("[data-reopen-pay-report]");
      if (reopenReportBtn) {
        const opened = rwphOpenRecentPayAllReportFromStorage();
        if (!opened) {
          try { reopenReportBtn.remove(); } catch (_) {}
          rwphToastPanelInfo(null, "The 10-minute report reopen link has expired.", "warn", "RWPH Payments");
        }
        return;
      }

      const acceptWarningBtn = e.target.closest?.("[data-pay-warning-accept]");
      if (acceptWarningBtn) {
        rwphSetPayAllWarningAccepted(panel, true);
        rwphToastPanelInfo(null, "Payment prefill buttons unlocked. Still manually confirm Add To Balance before paying.", "info", "RWPH Payments");
        return;
      }

      const undoBtn = e.target.closest?.("[data-pay-all-undo]");
      if (undoBtn) {
        rwphUndoLastPayAllDisappear(payAllUndoStack);
        return;
      }

      const nameBtn = e.target.closest?.("[data-pay-copy-name]");
      if (nameBtn) {
        if (!rwphRequirePayAllWarningAccepted(panel, panel)) return;
        rwphDismissPayAllCopyPopupsSilently();
        const row = safeRows[Number(nameBtn.dataset.payCopyName)] || {};
        const res = await rwphPrefillPayAllMember(row);
        // Copy buttons on the Payments Copy Panel are intentionally silent.
        rwphHidePayAllActionButton(nameBtn, "Name + ID", payAllUndoStack);
        return;
      }

      const amountBtn = e.target.closest?.("[data-pay-copy-amount]");
      if (amountBtn) {
        if (!rwphRequirePayAllWarningAccepted(panel, panel)) return;
        rwphDismissPayAllCopyPopupsSilently();
        const row = safeRows[Number(amountBtn.dataset.payCopyAmount)] || {};
        const res = await rwphPrefillPayAllAmount(row);
        // Copy buttons on the Payments Copy Panel are intentionally silent.
        rwphHidePayAllActionButton(amountBtn, "Amount", payAllUndoStack);
      }
    });
  }

  function rwphCloseAllPanelsExceptPayAll() {
    const selectors = [
      "#rw-payout-helper",
      "#rwph-xanax-send-status",
      "#rw-wrong-payment-panel",
      "#rwph-theme-picker-panel",
      "#rwph-licence-info-panel",
      "#rw-results-panel",
      ".rwph-results-loading-panel",
      ".rwph-results-html-panel",
      "#rwph-export-html-panel"
    ];
    for (const selector of selectors) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        if (el?.id === "rw-pay-all-panel" || el?.classList?.contains("rw-pay-all-panel")) continue;
        try { rwphSavePanelLayout(el); } catch (_) {}
        try { el.remove(); } catch (_) {}
      }
    }
    rwphSetPanelOpenState(false);
    setLauncherOpenState(false);
  }

  function rwphMaybeOpenPayAllFromFactionControlsUrl() {
    if (!(window.location.href || "").includes("/factions.php")) return false;
    if (!(window.location.href || "").includes("rwphPayAll=1")) return false;

    // In faction controls/vault, show only the compact copy panel and keep every other RWPH panel closed.
    rwphCloseAllPanelsExceptPayAll();

    setTimeout(() => {
      rwphCloseAllPanelsExceptPayAll();
      const rows = rwphGetStoredPayAllRows();
      openPayAllCopyPanel(rows || []);
      rwphCloseAllPanelsExceptPayAll();
    }, 900);
    return true;
  }

  function safeNumber(value) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function percent(value, total) {
    const v = safeNumber(value);
    const t = safeNumber(total);
    if (!t) return "0.0%";
    return ((v / t) * 100).toFixed(1) + "%";
  }





  function setupXanaxPaymentButtonHandler() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-open-xanax-payment]");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const code = btn.getAttribute("data-open-xanax-payment") || "";
      if (!code) return alert("No payment code found. Click Buy Licence again.");
      openXanaxPaymentPage(code);
    });
  }

  function rwphSendHelperVisible(el) {
    if (!el) return false;
    const s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0" && el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  function rwphSendHelperText(el) {
    return String(el?.textContent || el?.value || el?.getAttribute?.("title") || el?.getAttribute?.("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function rwphSendHelperClick(el) {
    if (!el) return;
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  }

  function rwphSendHelperSetValue(el, value) {
    if (!el) return false;
    const textValue = String(value ?? "");
    const touchMode = rwphIsTouchPhoneOrPda();

    // On Torn PDA/phones, focusing the Xanax send fields can open the software keypad.
    // Set the value silently and blur afterwards so Copy Receiver / Copy Code stay smooth.
    if (el.getAttribute?.("contenteditable") === "true" || el.getAttribute?.("role") === "textbox") {
      if (!touchMode) return rwphSetContentEditable(el, textValue);
      try {
        el.textContent = textValue;
        el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: textValue, inputType: "insertText" }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        el.blur?.();
        document.activeElement?.blur?.();
        return true;
      } catch (_) {
        return false;
      }
    }

    let oldReadOnly;
    let hadReadOnly = false;
    let oldInputMode;

    if (touchMode) {
      try {
        oldReadOnly = el.readOnly;
        hadReadOnly = el.hasAttribute?.("readonly") || false;
        oldInputMode = el.getAttribute?.("inputmode");
        el.setAttribute?.("inputmode", "none");
        try { el.readOnly = true; } catch (_) {}
      } catch (_) {}
    } else {
      el.focus?.({ preventScroll: true });
      el.click?.();
    }

    try {
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc?.set) desc.set.call(el, textValue);
      else el.value = textValue;
    } catch {
      try { el.value = textValue; } catch { return false; }
    } finally {
      if (touchMode) {
        try {
          if (oldInputMode === null || oldInputMode === undefined) el.removeAttribute?.("inputmode");
          else el.setAttribute?.("inputmode", oldInputMode);
          try { el.readOnly = oldReadOnly; } catch (_) {}
          if (!hadReadOnly) el.removeAttribute?.("readonly");
        } catch (_) {}
      }
    }

    try { el.setAttribute?.("value", textValue); } catch {}
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: textValue, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
    if (touchMode) {
      try { el.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}
      try { el.blur?.(); } catch (_) {}
      try { document.activeElement?.blur?.(); } catch (_) {}
    }
    return true;
  }

  function rwphSendHelperSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function rwphSendHelperPanelStatus(message, isError = false) {
    rwphEnsureFloatingPanelCss();
    if (sessionStorage.getItem("rwph_xanax_helper_closed") === "1") return;
    let box = document.getElementById("rwph-xanax-send-status");
    if (!box) {
      box = document.createElement("div");
      box.id = "rwph-xanax-send-status";
      box.style.cssText = `
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 1000000;
        width: ${window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches ? "min(330px, calc(100vw - 12px))" : "min(420px, calc(100vw - 24px))"};
        max-width: ${window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches ? "calc(100vw - 12px)" : "calc(100vw - 24px)"};
        min-width: ${window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches ? "240px" : "300px"};
        max-height: ${window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches ? "calc(100vh - 12px)" : "calc(100vh - 24px)"};
        overflow: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        padding: ${window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches ? "8px" : "12px"};
        border-radius: 16px;
        border: 1px solid rgba(251,191,36,.35);
        background: radial-gradient(circle at 18% 0%, rgba(245,158,11,.16), transparent 32%), linear-gradient(180deg, rgba(8,13,25,.97), rgba(15,23,42,.96));
        color: #fff7ed;
        font: 12px Inter, Segoe UI, Arial, sans-serif;
        line-height: 1.45;
        text-align: center;
        box-shadow: 0 18px 44px rgba(0,0,0,.55), 0 0 24px rgba(245,158,11,.12);
        backdrop-filter: blur(14px) saturate(1.2);
      `;
      document.body.appendChild(box);
    }

    box.style.borderColor = isError ? "rgba(251,113,133,.70)" : "rgba(251,191,36,.35)";
    box.style.setProperty("display", "flex", "important");
    box.style.setProperty("flex-direction", "column", "important");
    box.style.setProperty("overflow", "hidden", "important");
    box.innerHTML = message;
    rwphEnablePanelMoveResize(box, "#rwph-payment-helper-title");
  }

  function rwphFindLikelySendPanel() {
    const selectors = [
      "form",
      "[class*='send']",
      "[class*='Send']",
      "[class*='modal']",
      "[class*='Modal']",
      "[class*='dialog']",
      "[class*='Dialog']",
      "[class*='panel']",
      "[class*='Panel']",
      "[class*='popup']",
      "[class*='Popup']",
      "[class*='drawer']",
      "[class*='Drawer']"
    ].join(",");

    const candidates = Array.from(document.querySelectorAll(selectors)).filter(rwphSendHelperVisible);

    const scored = candidates.map((panel) => {
      const inputs = Array.from(panel.querySelectorAll("input, textarea, [contenteditable='true']")).filter(rwphSendHelperVisible);
      const txt = rwphSendHelperText(panel);
      let score = 0;
      if (inputs.length) score += 2;
      if (txt.includes("send")) score += 3;
      if (txt.includes("xanax")) score += 3;
      if (txt.includes("recipient") || txt.includes("player") || txt.includes("user")) score += 2;
      if (txt.includes("message")) score += 1;
      return { panel, score };
    }).filter((x) => x.score >= 3);

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.panel || null;
  }

  function rwphPressEnter(el) {
    if (!el) return;
    ["keydown", "keypress", "keyup"].forEach((type) => {
      el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: "Enter", code: "Enter", which: 13, keyCode: 13 }));
    });
  }

  function rwphFindUserField(panel) {
    const scope = panel || document;
    const inputs = Array.from(scope.querySelectorAll("input[type='text'], input:not([type]), input[type='search'], input[type='number']"))
      .filter(rwphSendHelperVisible)
      .filter((el) => {
        const meta = `${el.placeholder || ""} ${el.name || ""} ${el.id || ""} ${el.className || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
        const wrap = rwphSendHelperText(el.closest?.("label, div, li") || el.parentElement);
        if (meta.includes("amount") || meta.includes("qty") || meta.includes("quantity") || meta.includes("money") || meta.includes("message")) return false;
        return meta.includes("user") || meta.includes("player") || meta.includes("recipient") || meta.includes("name") || meta.includes("id") || wrap.includes("user") || wrap.includes("player") || wrap.includes("recipient") || wrap.includes("send to") || wrap.includes("to:");
      });

    if (inputs.length) return inputs[0];

    const all = Array.from(scope.querySelectorAll("input[type='text'], input:not([type]), input[type='search']"))
      .filter(rwphSendHelperVisible)
      .filter((el) => {
        const meta = `${el.placeholder || ""} ${el.name || ""} ${el.id || ""} ${el.className || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
        return !meta.includes("amount") && !meta.includes("qty") && !meta.includes("quantity") && !meta.includes("money") && !meta.includes("message") && !meta.includes("search") && !meta.includes("filter");
      });
    return all[0] || null;
  }

  function rwphFindRecipientOption() {
    return Array.from(document.querySelectorAll("li, div, a, span, button, [role='option']"))
      .filter(rwphSendHelperVisible)
      .find((el) => {
        const txt = rwphSendHelperText(el);
        return txt.includes(PAYMENT_RECEIVER_NAME.toLowerCase()) || txt.includes(PAYMENT_RECEIVER_ID);
      }) || null;
  }

  function rwphFindMessageField(panel) {
    const scope = panel || document;
    const fields = Array.from(scope.querySelectorAll("textarea, input[type='text'], input:not([type]), [contenteditable='true']"))
      .filter(rwphSendHelperVisible);

    return fields.find((el) => {
      const tag = el.tagName.toLowerCase();
      const meta = `${el.placeholder || ""} ${el.name || ""} ${el.id || ""} ${el.className || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
      const wrap = rwphSendHelperText(el.closest?.("label, div, li") || el.parentElement);
      return tag === "textarea" || el.getAttribute("contenteditable") === "true" || meta.includes("message") || wrap.includes("message") || wrap.includes("comment");
    }) || null;
  }

  function rwphSetContentEditable(el, value) {
    if (!el) return false;
    const touchMode = rwphIsTouchPhoneOrPda();
    if (!touchMode) {
      el.focus?.({ preventScroll: true });
      el.click?.();
    }
    el.textContent = String(value ?? "");
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: value, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (touchMode) {
      try { el.blur?.(); } catch (_) {}
      try { document.activeElement?.blur?.(); } catch (_) {}
    }
    return true;
  }

  async function rwphPasteReceiverIntoOpenForm() {
    const panel = rwphFindLikelySendPanel() || document;
    const userField = rwphFindUserField(panel) || rwphFindUserField(document);

    await copyText(PAYMENT_RECEIVER_TEXT).catch(() => false);

    if (!userField) {
      return { ok: false, error: "Could not find the User ID field. Open Xanax > Send this item first, then press Copy Receiver again. Receiver copied as fallback." };
    }

    rwphSendHelperSetValue(userField, PAYMENT_RECEIVER_TEXT);
    await rwphSendHelperSleep(650);

    const option = rwphFindRecipientOption();
    if (option) {
      option.scrollIntoView?.({ block: "center", inline: "center" });
      option.click?.();
      rwphSendHelperClick(option);
    } else {
      rwphPressEnter(userField);
    }

    return { ok: true };
  }

  async function rwphPastePaymentCodeIntoOpenForm(paymentCode) {
    const panel = rwphFindLikelySendPanel() || document;

    await copyText(paymentCode).catch(() => false);

    const msgField = rwphFindMessageField(panel) || rwphFindMessageField(document);
    if (!msgField) {
      return { ok: false, error: "Could not find the Add Message field. Open the message box first, then press Copy Code again. Code copied as fallback." };
    }

    if (msgField.getAttribute?.("contenteditable") === "true") rwphSetContentEditable(msgField, paymentCode);
    else rwphSendHelperSetValue(msgField, paymentCode);

    return { ok: true };
  }

  function rwphPaymentHelperHtml(code, message, isError = false) {
    const expiresAtMs = Number(rwphPaymentExpiryForCode(code));
    setTimeout(rwphStartExpiryTimer, 0);
    return `
      <button id="rwph-close-helper" class="danger" type="button" title="Close" aria-label="Close Xanax Payment Helper">×</button>
      <div id="rwph-payment-helper-title">RWPH Payment Helper</div>
      <div class="rwph-xanax-scroll">
        <div class="rwph-xanax-helper-subtitle">Xanax licence payment • Prefill/copy only • You confirm manually</div>
        <div class="rwph-xanax-helper-message ${isError ? 'rwph-xanax-helper-error' : ''}">${message}</div>

        <div class="rwph-xanax-detail-card">
          <div class="rwph-xanax-detail-title">Required payment details</div>

          ${rwphPaymentExpiryHtml(expiresAtMs, "rw-payment-expiry rwph-xanax-expiry rwph-xanax-expiry-hero")}
          <div class="rwph-xanax-expiry-note">RWPH checks automatically after you send while this timer is active.</div>

          <div class="rwph-xanax-actions" aria-label="Xanax payment helper actions">
            <button id="rwph-copy-receiver" type="button">Copy Receiver</button>
            <button id="rwph-copy-code" type="button">Copy Code</button>
          </div>

          <div><b>Send item:</b> ${esc(PAYMENT_ITEM_NAME)} <span class="rwph-xanax-small-blue">only</span></div>
          <div><b>Send to:</b> ${esc(PAYMENT_RECEIVER_TEXT)}</div>
          <div><b>Message code:</b> <span class="rwph-xanax-code">${esc(code)}</span></div>
          <div><b>Licence time:</b> 15 days per Xanax, plus any active bonus deals.</div>
        </div>

      <div class="rwph-xanax-steps">
        <b>How to use:</b><br>
        1. Open your <b>Xanax</b> item.<br>
        2. Click <b>Send this item</b> yourself.<br>
        3. Click <b>Add Message</b> yourself.<br>
        4. Press <b>Copy Receiver</b> to copy/prefill the receiver field.<br>
        5. Press <b>Copy Code</b> to copy/prefill the message field.<br>
        6. Choose the Xanax amount, review everything, then manually Send/Confirm.
      </div>

        <div class="rwph-xanax-safety-note">
          RWPH never clicks Send, never clicks Confirm, and never sends items for you. Only Xanax with the exact payment code can auto-add licence time. Wrong items or missing/incorrect codes need manual review.
        </div>
      </div>
    `;
  }

  function rwphRenderPaymentHelperPanel(code, message, isError = false) {
    rwphSendHelperPanelStatus(rwphPaymentHelperHtml(code, message, isError), isError);
    const box = document.getElementById("rwph-xanax-send-status");
    if (box) box.dataset.rwphPaymentCode = String(code || "");
  }

  function rwphMaybeAutoClosePaymentHelper() {
    const state = window.__rwphPaymentHelperButtonState || {};
    if (state.receiverClicked && state.codeClicked) {
      sessionStorage.setItem("rwph_xanax_helper_closed", "1");
      setTimeout(() => {
        document.getElementById("rwph-xanax-send-status")?.remove();
      }, 650);
    }
  }

  function rwphSetupPaymentHelperPanelClicks(code) {
    window.__rwphPaymentHelperButtonState ||= { receiverClicked: false, codeClicked: false };

    if (window.__rwphPaymentHelperClicksInstalled) return;
    window.__rwphPaymentHelperClicksInstalled = true;

    document.addEventListener("click", async (e) => {
      const target = e.target;
      if (!target || !target.id || !String(target.id).startsWith("rwph-")) return;

      if (target.id === "rwph-close-helper") {
        e.preventDefault();
        e.stopPropagation();
        sessionStorage.setItem("rwph_xanax_helper_closed", "1");
        document.getElementById("rwph-xanax-send-status")?.remove();
        return;
      }

      const payload = getXanaxPaymentHelper();
      const currentCode = payload?.code || code;

      if (target.id === "rwph-copy-receiver") {
        e.preventDefault();
        window.__rwphPaymentHelperButtonState ||= { receiverClicked: false, codeClicked: false };
        window.__rwphPaymentHelperButtonState.receiverClicked = true;

        const res = await rwphPasteReceiverIntoOpenForm();
        if (res.ok) {
          rwphShowToast(`Receiver copied/prefilled: ${PAYMENT_RECEIVER_TEXT}. Review before sending.`, "info", 10000, "RWPH Payment Helper");
        } else {
          rwphShowToast(res.error, "warn", 10000, "RWPH Payment Helper");
        }
        rwphMaybeAutoClosePaymentHelper();
      }

      if (target.id === "rwph-copy-code") {
        e.preventDefault();
        window.__rwphPaymentHelperButtonState ||= { receiverClicked: false, codeClicked: false };
        window.__rwphPaymentHelperButtonState.codeClicked = true;

        const res = await rwphPastePaymentCodeIntoOpenForm(currentCode);
        if (res.ok) {
          rwphShowToast("Payment code copied/prefilled into the Add Message field. Review before sending.", "info", 10000, "RWPH Payment Helper");
        } else {
          rwphShowToast(res.error, "warn", 10000, "RWPH Payment Helper");
        }
        rwphMaybeAutoClosePaymentHelper();
      }
    });
  }

  function shouldRunXanaxPaymentAutofill() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("rwphSendXanax") === "1" && !!params.get("rwphCode")) return true;
      return /\/item\.php/i.test(window.location.pathname || "") && !!getXanaxPaymentHelper()?.code;
    } catch {
      return false;
    }
  }

  async function runXanaxPaymentAutofillFromUrl() {
    if (!shouldRunXanaxPaymentAutofill()) return;

    const params = new URLSearchParams(window.location.search || "");
    const explicitRequest = params.get("rwphSendXanax") === "1" && !!params.get("rwphCode");
    let code = params.get("rwphCode") || getXanaxPaymentHelper()?.code || "";
    if (!code) return;

    if (explicitRequest) {
      // A fresh helper tab/open request should override an old close flag in this tab.
      sessionStorage.removeItem("rwph_xanax_helper_closed");
    }

    if (sessionStorage.getItem("rwph_xanax_helper_closed") === "1" && !explicitRequest) return;

    const existingPanel = document.getElementById("rwph-xanax-send-status");
    const existingPayload = getXanaxPaymentHelper();
    if (existingPanel?.dataset?.rwphPaymentCode === String(code) && existingPayload?.code === String(code)) {
      return;
    }

    let helperConfirmed = saveXanaxPaymentHelper(code);
    if (!helperConfirmed) {
      const restored = await restorePendingPaymentFromDatabase(getPaymentUserKey(), "helper");
      if (restored?.code) {
        code = String(restored.code);
        helperConfirmed = saveXanaxPaymentHelper(code);
      }
    }

    window.__rwphPaymentHelperButtonState = { receiverClicked: false, codeClicked: false };
    rwphSetupPaymentHelperPanelClicks(code);

    if (!helperConfirmed) {
      rwphRenderPaymentHelperPanel(
        code,
        `RWPH could not confirm this payment code in the backend/database. Click <b>Buy Licence</b> or <b>Extend Licence</b> again so RWPH can reopen the current database-backed Xanax Payment Helper.`,
        true
      );
      rwphConsumeCrossTabPopup("xanax-payment", "#rwph-xanax-send-status", 650);
      return;
    }

    await copyText(code).catch(() => false);
    rwphRenderPaymentHelperPanel(
      code,
      `Payment helper loaded. Open your <b>${esc(PAYMENT_ITEM_NAME)}</b>, manually open <b>Send this item</b> and <b>Add Message</b>, then use the buttons below to copy/prefill the receiver and code.`
    );
    rwphConsumeCrossTabPopup("xanax-payment", "#rwph-xanax-send-status", 650);
  }

  function rwphScheduleXanaxPaymentHelperOpen() {
    const run = () => {
      runXanaxPaymentAutofillFromUrl().catch((e) => console.warn("RWPH payment helper open retry failed:", e));
    };

    [0, 250, 750, 1500, 3000, 5500].forEach((delay) => setTimeout(run, delay));
    window.addEventListener("focus", () => setTimeout(run, 150));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) setTimeout(run, 150);
    });

    let lastHref = location.href;
    if (!window.__rwphXanaxPaymentHelperUrlWatcher) {
      window.__rwphXanaxPaymentHelperUrlWatcher = setInterval(() => {
        if (location.href !== lastHref) {
          lastHref = location.href;
          setTimeout(run, 150);
          setTimeout(run, 1000);
        }
      }, 1000);
    }
  }

  function rwphResultsExportFilename(extension = "html") {
    const ext = String(extension || "html").replace(/[^a-z0-9]/gi, "").toLowerCase() || "html";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return ext === "csv" ? "torn-rw-payouts.csv" : `rwph-results-page-${stamp}.${ext}`;
  }

  async function downloadCSV(rows, statusEl = null) {
    if (!rows.length) return alert("No payout rows to export yet.");

    const csv = buildPayoutCsvText(rows, lastSummary || {});
    try {
      await rwphExportTextPdaSafe({
        kind: "CSV",
        filename: rwphResultsExportFilename("csv"),
        text: csv,
        mime: "text/csv;charset=utf-8",
        extension: "csv",
        statusEl,
      });
      return true;
    } catch (e) {
      console.warn("RWPH CSV export fallback used:", e);
      return false;
    }
  }

  async function rwphExportResultsHtmlFromPanel(rows, summary, statusEl = null) {
    if (!rows?.length) return alert("Calculate results first.");
    const html = rwphInjectMainScrollbarCssIntoHtml(buildFullscreenResultsHtml(rows || [], summary || {}));
    try {
      await rwphExportTextPdaSafe({
        kind: "HTML",
        filename: rwphResultsExportFilename("html"),
        text: html,
        mime: "text/html;charset=utf-8",
        extension: "html",
        statusEl,
      });
      return true;
    } catch (e) {
      console.warn("RWPH HTML export fallback used:", e);
      return false;
    }
  }

  function rwphGetPoint(e) {
    const touch = e?.touches?.[0] || e?.changedTouches?.[0];
    return {
      x: Number(touch?.clientX ?? e?.clientX ?? 0),
      y: Number(touch?.clientY ?? e?.clientY ?? 0),
    };
  }

  function rwphBlockTouchDefaults(el) {
    if (!el) return;
    el.style.touchAction = "none";
    el.style.webkitUserSelect = "none";
    el.style.userSelect = "none";
  }

  function rwphSetPanelStyle(panel, prop, value) {
    if (!panel) return;
    panel.style.setProperty(prop, String(value), "important");
  }

  function makeDraggable(panel, handleSelector = ".rw-head") {
    if (!panel || panel.dataset.rwphDragReady === "1") return;
    panel.dataset.rwphDragReady = "1";

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function beginDrag(e) {
      const target = e.target;
      const handle = target.closest?.(handleSelector);
      if (!handle || !panel.contains(handle)) return;
      if (target.closest?.("button, input, textarea, select, a, .rw-resize-handle")) return;

      const point = rwphGetPoint(e);
      const rect = panel.getBoundingClientRect();
      dragging = true;
      startX = point.x;
      startY = point.y;
      startLeft = rect.left;
      startTop = rect.top;

      rwphSetPanelStyle(panel, "left", `${rect.left}px`);
      rwphSetPanelStyle(panel, "top", `${rect.top}px`);
      rwphSetPanelStyle(panel, "right", "auto");
      rwphSetPanelStyle(panel, "bottom", "auto");
      rwphSetPanelStyle(panel, "position", "fixed");
      rwphSetPanelStyle(panel, "transform", "none");
      rwphSetPanelStyle(panel, "max-width", "calc(100vw - 16px)");
      rwphSetPanelStyle(panel, "max-height", "calc(100vh - 16px)");

      rwphBlockTouchDefaults(handle);
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    function moveDrag(e) {
      if (!dragging) return;
      const point = rwphGetPoint(e);
      const dx = point.x - startX;
      const dy = point.y - startY;
      const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
      rwphSetPanelStyle(panel, "left", `${Math.min(Math.max(8, startLeft + dx), maxLeft)}px`);
      rwphSetPanelStyle(panel, "top", `${Math.min(Math.max(8, startTop + dy), maxTop)}px`);
      e.preventDefault?.();
    }

    function endDrag() {
      if (dragging) rwphSavePanelLayout(panel);
      dragging = false;
    }

    panel.addEventListener("mousedown", beginDrag);
    panel.addEventListener("touchstart", beginDrag, { passive: false });

    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("touchmove", moveDrag, { passive: false });

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
  }

  function makeResizable(panel) {
    if (!panel) return;

    if (!panel.style.position) rwphSetPanelStyle(panel, "position", "fixed");
    rwphSetPanelStyle(panel, "overflow", "hidden");

    // Top-right resize is intentionally removed so it does not clash with panel close buttons.
    const handleDefs = [
      { dir: "nw", title: "Resize from top-left" },
      { dir: "sw", title: "Resize from bottom-left" },
      { dir: "se", title: "Resize from bottom-right" },
    ];

    panel.querySelectorAll(":scope > .rw-resize-handle-ne, :scope > .resize-handle-ne").forEach((handle) => handle.remove());

    handleDefs.forEach(({ dir, title }) => {
      let handle = panel.querySelector(`:scope > .rw-resize-handle-${dir}`);
      if (!handle) {
        handle = document.createElement("div");
        handle.className = `rw-resize-handle rw-resize-handle-${dir}`;
        handle.dataset.rwphResizeDir = dir;
        handle.title = title;
        panel.appendChild(handle);
      }
      rwphBlockTouchDefaults(handle);
    });

    // Remove top-right handles and normalize legacy single-corner handles if an older panel left one behind.
    Array.from(panel.children || []).forEach((child) => {
      if (child.classList?.contains("rw-resize-handle-ne") || child.dataset?.rwphResizeDir === "ne") {
        child.remove();
        return;
      }
      if (child.classList?.contains("rw-resize-handle") && !child.dataset.rwphResizeDir) {
        child.dataset.rwphResizeDir = "se";
        child.classList.add("rw-resize-handle-se");
        child.title = "Resize from bottom-right";
      }
    });

    if (panel.dataset.rwphResizeReady === "1") return;
    panel.dataset.rwphResizeReady = "1";

    let resizing = false;
    let activeDir = "se";
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let startWidth = 0;
    let startHeight = 0;

    function panelMinimums() {
      const mobilePanel = window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches;
      const isResultsPanel = panel.classList?.contains("rw-results-panel");
      const isXanaxHelper = panel.id === "rwph-xanax-send-status";
      const isPayAll = panel.id === "rw-pay-all-panel" || panel.classList?.contains("rw-pay-all-panel");
      const minWidth = mobilePanel
        ? (isResultsPanel ? 170 : (isXanaxHelper ? 240 : (isPayAll ? 240 : 170)))
        : (isResultsPanel ? 280 : (isXanaxHelper ? 300 : (isPayAll ? 260 : 240)));
      const minHeight = mobilePanel ? (isXanaxHelper ? 180 : 120) : 180;
      return { minWidth, minHeight };
    }

    function beginResize(e) {
      const resizeHandle = e.target.closest?.(".rw-resize-handle");
      if (!resizeHandle || !panel.contains(resizeHandle)) return;
      const point = rwphGetPoint(e);
      const rect = panel.getBoundingClientRect();
      resizing = true;
      activeDir = resizeHandle.dataset.rwphResizeDir || (resizeHandle.className.match(/rw-resize-handle-(nw|sw|se)/)?.[1]) || "se";
      startX = point.x;
      startY = point.y;
      startLeft = rect.left;
      startTop = rect.top;
      startWidth = rect.width || panel.offsetWidth || 300;
      startHeight = rect.height || panel.offsetHeight || 240;
      rwphSetPanelStyle(panel, "left", `${rect.left}px`);
      rwphSetPanelStyle(panel, "top", `${rect.top}px`);
      rwphSetPanelStyle(panel, "right", "auto");
      rwphSetPanelStyle(panel, "bottom", "auto");
      rwphSetPanelStyle(panel, "position", "fixed");
      rwphSetPanelStyle(panel, "transform", "none");
      rwphSetPanelStyle(panel, "max-width", "none");
      rwphSetPanelStyle(panel, "max-height", "none");
      rwphSetPanelStyle(panel, "overflow", "hidden");
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    function moveResize(e) {
      if (!resizing) return;
      const point = rwphGetPoint(e);
      const dx = point.x - startX;
      const dy = point.y - startY;
      const { minWidth, minHeight } = panelMinimums();
      const maxWidth = Math.max(minWidth, window.innerWidth - 16);
      const maxHeight = Math.max(minHeight, window.innerHeight - 16);

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      if (activeDir.includes("e")) newWidth = startWidth + dx;
      if (activeDir.includes("s")) newHeight = startHeight + dy;
      if (activeDir.includes("w")) newWidth = startWidth - dx;
      if (activeDir.includes("n")) newHeight = startHeight - dy;

      newWidth = Math.min(Math.max(minWidth, newWidth), maxWidth);
      newHeight = Math.min(Math.max(minHeight, newHeight), maxHeight);

      if (activeDir.includes("w")) newLeft = startLeft + (startWidth - newWidth);
      if (activeDir.includes("n")) newTop = startTop + (startHeight - newHeight);

      newLeft = Math.min(Math.max(8, newLeft), Math.max(8, window.innerWidth - newWidth - 8));
      newTop = Math.min(Math.max(8, newTop), Math.max(8, window.innerHeight - newHeight - 8));

      rwphSetPanelStyle(panel, "left", `${newLeft}px`);
      rwphSetPanelStyle(panel, "top", `${newTop}px`);
      rwphSetPanelStyle(panel, "width", `${newWidth}px`);
      rwphSetPanelStyle(panel, "height", `${newHeight}px`);
      rwphSetPanelStyle(panel, "overflow", "hidden");
      e.preventDefault?.();
    }

    function endResize() {
      if (resizing) rwphSavePanelLayout(panel);
      resizing = false;
    }

    panel.addEventListener("mousedown", beginResize);
    panel.addEventListener("touchstart", beginResize, { passive: false });

    document.addEventListener("mousemove", moveResize);
    document.addEventListener("touchmove", moveResize, { passive: false });

    document.addEventListener("mouseup", endResize);
    document.addEventListener("touchend", endResize);
    document.addEventListener("touchcancel", endResize);
  }

  function rwphEnablePanelMoveResize(panel, handleSelector = ".rw-head") {
    if (!panel) return;
    panel.querySelectorAll?.(":scope > .rw-resize-handle-ne, :scope > .resize-handle-ne").forEach((handle) => handle.remove());
    makeDraggable(panel, handleSelector);
    makeResizable(panel);
    rwphApplyPanelLayout(panel);
  }



  function rwphMakeHelpPanelCardsDropdowns(root = document) {
    try {
      const scope = root?.querySelectorAll ? root : document;
      const makeDropdown = (card, titleSelector) => {
        if (!card || card.dataset.rwphDropdown === "1" || String(card.tagName || "").toLowerCase() === "details") return;
        const title = card.querySelector(`:scope > ${titleSelector}`);
        if (!title) return;

        const details = document.createElement("details");
        Array.from(card.attributes || []).forEach((attr) => {
          if (attr.name !== "class") details.setAttribute(attr.name, attr.value);
        });
        details.className = card.className;
        details.classList.add("rw-help-dropdown");
        details.dataset.rwphDropdown = "1";

        const summary = document.createElement("summary");
        summary.className = title.className;
        summary.classList.add("rw-help-dropdown-summary");
        summary.innerHTML = title.innerHTML;
        summary.setAttribute("role", "button");

        const content = document.createElement("div");
        content.className = "rw-help-dropdown-content";
        Array.from(card.childNodes || []).forEach((node) => {
          if (node === title) return;
          content.appendChild(node);
        });

        details.appendChild(summary);
        details.appendChild(content);
        card.replaceWith(details);
      };

      scope.querySelectorAll("#rw-paywall-how-section > .rw-help-section-card, #rw-how-tab-section > .rw-help-section-card")
        .forEach((card) => makeDropdown(card, ".rw-how-title"));
      scope.querySelectorAll("#rw-paywall-how-section .rw-help-api-grid > .rw-help-api-card.rw-help-section-card, #rw-how-tab-section .rw-help-api-grid > .rw-help-api-card.rw-help-section-card")
        .forEach((card) => makeDropdown(card, ".rw-help-api-title"));
    } catch (e) {
      console.warn("Could not convert RWPH help cards to dropdowns:", e);
    }
  }

  function showPaywallScreen(panel, options = {}) {
    const savedKey = GM_getValue(STORAGE_KEY, "");
    const savedAdminKey = GM_getValue(ADMIN_KEY_STORAGE_KEY, "");

    panel.innerHTML = `
      <style>${panelBaseCss()}
  </style>
      <div class="rw-head">
        <span>Ranked War Payout Helper</span>
        <button id="rw-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
      </div>
      <div class="rw-body">
        <div class="rw-lock-pay-heading">Each Xanax will extend your licence by 15 days</div>
        <div class="rw-small">
          This version is server-locked. The backend verifies your license and performs the payout calculation server-side.
        </div>
        <div class="rw-small">
          After unlocking, RWPH only creates reports for the latest completed ranked war. Current/active wars must finish first. If a matching backend/database cached report exists, RWPH shows a popup and the matching cached-report button opens the backend/database cached report. Delete Cache inside the matching settings dropdown removes that database cached report with a one-delete-per-10-minutes limit.
        </div>

        <div class="rw-tabs" role="tablist" aria-label="Locked panel tabs">
          <button id="rw-paywall-tab-pay" class="rw-tab-btn active" role="tab" aria-selected="true" aria-pressed="true">Unlock</button>
          <button id="rw-paywall-tab-admin" class="rw-tab-btn secondary" role="tab" aria-selected="false" aria-pressed="false">Admin</button>
          <button id="rw-paywall-tab-how" class="rw-tab-btn secondary" role="tab" aria-selected="false" aria-pressed="false">Help</button>
        </div>

        <div id="rw-paywall-unlock-section" class="rw-tab-section">
          <label>Your Torn API Key -Limited Access-
            <input id="rw-paywall-key" type="password" value="${esc(savedKey)}" placeholder="Paste your Torn API key">
          </label>
          <div class="rw-api-visible-card" role="note" aria-label="API key usage notice">
            <div class="rw-api-visible-head"><span>API Key Notice</span><span class="rw-api-visible-badge">Limited Access</span></div>
            <div class="rw-api-visible-summary">
              <b>Purpose:</b> verify licence + build ranked-war payout reports <span class="rw-api-visible-dot">•</span>
              <b>Reads:</b> Torn ID, faction/member, ranked-war and attack data needed for calculations <span class="rw-api-visible-dot">•</span>
              <b>Stored:</b> only in your browser/PDA when you click Save Key <span class="rw-api-visible-dot">•</span>
              <b>Backend:</b> sent only to your configured RWPH server for licence checks and calculations <span class="rw-api-visible-dot">•</span>
              <b>Never:</b> Torn password, automatic attacks, automatic item sends, or automatic cash sends
            </div>
          </div>
          <div class="rw-actions">
            <button id="rw-unlock-existing">Unlock Panel</button>
            <button id="rw-start-payment">Buy Licence</button>
            <button id="rw-paywall-save-key" class="secondary">Save Key</button>
            <button id="rw-free-trial" class="secondary">7 Day Free Trial</button>
            <button id="rw-check-license-days" class="secondary">Your Expiration</button>
          </div>
          <div id="rw-paywall-status" class="rw-muted">Enter your key and click Unlock Panel if you already have a licence, or Buy Licence to start a new payment.</div>
          <div id="rw-paywall-code"></div>
        </div>

        <div id="rw-paywall-admin-section" class="rw-tab-section rw-unified-tab-panel" hidden>
          <div class="rw-admin-box rw-admin-unified-panel">
            <div class="rw-small">
              Admin tools are available here even while the helper is locked. Keep your admin key private.
            </div>

            <label>Admin Key
              <input id="rw-admin-key" type="password" value="${esc(savedAdminKey)}" placeholder="Paste ADMIN_KEY from your .env">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-save-key" class="secondary">Save Admin Key</button>
              <button id="rw-admin-list">List Licences</button>
            </div>

            <label>Player Torn ID
              <input id="rw-admin-torn-id" type="text" placeholder="Example: 1234567">
            </label>

            <label>Player Name
              <input id="rw-admin-name" type="text" placeholder="Optional, example: PlayerName">
            </label>

            <label>License Days
              <input id="rw-admin-days" type="number" value="30" min="1">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-grant">Grant License</button>
              <button id="rw-admin-extend" class="secondary">Extend License</button>
              <button id="rw-admin-revoke" class="danger">Remove</button>
            </div>
          </div>

          <div id="rw-admin-status" class="rw-muted">Admin tools ready.</div>
          <div id="rw-admin-results"></div>
        </div>

                <div id="rw-paywall-how-section" class="rw-tab-section" hidden>

          <div class="rw-how-box rw-help-api-card rw-help-section-card rw-help-hero-card">
            <div class="rw-how-title">RWPH Help</div>
            <p class="rw-how-intro">
              Ranked War Payout Helper is a manual payout calculator for Torn ranked wars. It reads the war/report data you ask it to use, builds Basic or Advanced results, and gives you payment/newsletter helper panels. You still review every result and manually complete every Torn action yourself.
            </p>
          </div>



          <div class="rw-how-box rw-help-api-card rw-help-section-card rw-tutorial-card">
            <div class="rw-how-title">Step-by-Step Tutorial</div>
            <ul class="rw-how-list">
              <li><b>1. Open RWPH:</b> go to a Torn faction page and click the Ranked War Payout Helper launcher beside Faction Warfare.</li>
              <li><b>2. Save your API key:</b> paste your Torn limited API key, then click <b>Save Key</b>. It is saved only on this browser/PDA.</li>
              <li><b>3. Unlock or buy:</b> click <b>Unlock Panel</b> if you already have a licence, or <b>Buy Licence</b> to create a Xanax payment code.</li>
              <li><b>4. Choose payout mode:</b> use <b>Basic Calculations</b> for simple per-hit payouts, or <b>Advanced Calculations</b> for weighted points.</li>
              <li><b>5. Fill war times:</b> click <b>Auto-fill Last Finished War</b> when available, then check the start and finish times before calculating.</li>
              <li><b>6. Enter payout amount:</b> add the member payout pool you want split across eligible members.</li>
              <li><b>7. Exclude members if needed:</b> open Member Management to exclude members or remove member hits before calculating.</li>
              <li><b>8. Calculate:</b> press the Calculate button inside the mode you picked. The loading panel shows each stage.</li>
              <li><b>9. Review results:</b> check stats, members, payout amounts, and managed member removals before using payment tools.</li>
              <li><b>10. Pay and post manually:</b> use the Payments and Newsletter tools to copy/prefill details, then manually confirm everything in Torn yourself.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Fast Start</div>
            <ul class="rw-how-list">
              <li><b>1. API key:</b> paste a Torn API key that has the faction/ranked-war access needed for reports.</li>
              <li><b>2. Save or unlock:</b> Save Key stores it on this browser/PDA only. Unlock Panel checks your active licence.</li>
              <li><b>3. Pick a calculation dropdown:</b> use <b>Basic Calculations</b> for simple per-hit style payouts, or <b>Advanced Calculations</b> for points-based payouts.</li>
              <li><b>4. Set war times:</b> use Auto-fill Last Finished War when possible, then check the start/end times.</li>
              <li><b>5. Calculate:</b> click the Calculate button inside the dropdown you are using. The loading panel shows progress and then lets you open results.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Basic Calculations</div>
            <ul class="rw-how-list">
              <li><b>Best for:</b> quick payout splits where checked hit types count as 1 each.</li>
              <li><b>Hit type boxes:</b> War hits, Outside hits, Retals, and Assists control what counts in the Basic result.</li>
              <li><b>Fast Mode:</b> uses ranked-war report data only. It is quicker, but skips attack-log extras like assists, outside hits, and retals.</li>
              <li><b>Member Payout:</b> the amount you want split between eligible members.</li>
              <li><b>Total Payout:</b> your overall reference total. Member Payout is the value used for the member split.</li>
              <li><b>Member Management:</b> open the management panel to exclude members or remove specific payable hit counts before payouts are recalculated.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Advanced Calculations</div>
            <ul class="rw-how-list">
              <li><b>Best for:</b> payout splits based on contribution points instead of simple hit counts.</li>
              <li><b>Point values:</b> set values for war hits, assists, outside hits, retals, hospital bonuses, enemy hospital bonuses, and fair-fight bonus.</li>
              <li><b>Negative enemy hospital bonus:</b> enemy war-faction hospital bonus can be negative when you want to punish that action.</li>
              <li><b>Fair-fight modifier:</b> when enabled, Avg FF over 1.00 can add bonus points per payable hit. It is capped at 3.00.</li>
              <li><b>Member Management:</b> Advanced has its own member management settings and recalculates points payouts after exclusions or payable hit removals.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Cache and Results</div>
            <ul class="rw-how-list">
              <li><b>Separate caches:</b> Basic and Advanced reports use separate backend/database caches.</li>
              <li><b>Duplicate protection:</b> if a matching cached report already exists, RWPH asks you to use that report instead of starting a duplicate calculation.</li>
              <li><b>Use Cached Report:</b> opens the matching cached Basic or Advanced report when available.</li>
              <li><b>Delete Cache:</b> removes the matching cached report. Successful deletes are limited to one every 10 minutes.</li>
              <li><b>Results panel:</b> shows all result stats, member cards, CSV export, Export Html, Payments, and Newsletter tools.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Payments and Newsletters</div>
            <ul class="rw-how-list">
              <li><b>Payments:</b> opens the payment helper from the results page. RWPH helps copy/prefill details but does not send money.</li>
              <li><b>Manual safety:</b> always check Torn fields yourself before confirming any payment. Use Add To Balance where your faction process requires it.</li>
              <li><b>Export Html:</b> downloads the current results page as an HTML file for records.</li>
              <li><b>Newsletter dropdown:</b> opens styled newsletter HTML versions. Each panel has a preview and a raw HTML box.</li>
              <li><b>Copy newsletter HTML:</b> right-click inside the raw HTML box, choose Select All, then Copy.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Licence and Admin</div>
            <ul class="rw-how-list">
              <li><b>Buy Licence:</b> creates a Xanax payment code and opens the payment helper.</li>
              <li><b>Extend Licence:</b> creates an extension payment code. Existing active pending codes are reused where possible.</li>
              <li><b>Your Expiration:</b> opens a licence info panel with the current expiry and time left.</li>
              <li><b>Admin panel:</b> admins can grant, extend, list, fill, and remove licence days after a valid ADMIN_KEY is saved and verified by the server.</li>
              <li><b>Keep admin secrets private:</b> never share ADMIN_KEY, PAYWALL_SECRET, private server URLs, or licence tokens with untrusted people.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Panels, PDA, and Troubleshooting</div>
            <ul class="rw-how-list">
              <li><b>Move panels:</b> drag the panel header/title area.</li>
              <li><b>Resize panels:</b> use the resize handles. Layout is remembered for supported panels.</li>
              <li><b>Loading panel:</b> shows stages and progress. Closing it cancels the running backend calculation where supported.</li>
              <li><b>If a button does nothing:</b> refresh Torn/PDA, reopen RWPH, and confirm you installed the newest userscript.</li>
              <li><b>If API calls slow down:</b> Torn may be rate-limiting. Wait, use cached reports, and avoid repeated calculations.</li>
              <li><b>If the server fails:</b> check that PAYWALL_API_BASE points to your running backend and that the /health endpoint works.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">API Key Terms - Short Version</div>
            <ul class="rw-how-list">
              <li><b>What it is used for:</b> licence checks, Torn ID verification, faction/member data, ranked-war reports, and attack data required for payouts.</li>
              <li><b>Where it is stored:</b> only in local browser/Tampermonkey/Torn PDA storage when you click Save Key.</li>
              <li><b>Where it is sent:</b> only to the configured RWPH backend for checks and calculations.</li>
              <li><b>What RWPH never needs:</b> Torn password, automatic attacking, automatic item sending, or automatic money sending.</li>
              <li><b>Your control:</b> you can clear the saved key from userscript/browser storage, lock the panel, or revoke/rotate the key in Torn.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Responsible Use</div>
            <ul class="rw-how-list">
              <li><b>Review everything:</b> results can be affected by Torn API limits, cache state, wrong time windows, exclusions, or server issues.</li>
              <li><b>Manual actions only:</b> RWPH does not confirm Torn payments or gameplay actions for you.</li>
              <li><b>Follow rules:</b> use RWPH only in ways allowed by Torn, your faction, and your server/licence setup.</li>
              <li><b>No uptime guarantee:</b> Torn, Torn PDA, browsers, hosting, or API changes can temporarily break features.</li>
            </ul>
          </div>

        </div>

      <div id="rw-results-panel" class="rw-results-panel" hidden>
        <div class="rw-head">
          <span>Per Hit Results</span>
          <button id="rw-results-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
        </div>
        <div class="rw-body">
          <div id="rw-results"></div>
        </div>
      </div>`;

    rwphMakeHelpPanelCardsDropdowns(panel);
    rwphEnablePanelMoveResize(panel);
    const lockedResultsPanel = document.getElementById("rw-results-panel");
    rwphEnablePanelMoveResize(lockedResultsPanel);
    attachMoveLauncherButton();
    attachPanelThemeButton();
    rwphBindAdminControls(panel);
    rwphSetAdminToolsVisible(panel, false, savedAdminKey ? "Saved admin key found. Click Save Admin Key to verify it and show the admin tools." : "Enter your ADMIN_KEY and click Save Admin Key to show the admin tools.");

    document.getElementById("rw-close").addEventListener("click", closePanel);

    const payTabBtn = document.getElementById("rw-paywall-tab-pay");
    const adminTabBtn = document.getElementById("rw-paywall-tab-admin");
    const howTabBtn = document.getElementById("rw-paywall-tab-how");
    const paySection = document.getElementById("rw-paywall-unlock-section");
    const adminSection = document.getElementById("rw-paywall-admin-section");
    const howSection = document.getElementById("rw-paywall-how-section");

    function switchLockedTab(tabName) {
      rwphSaveActiveTab("locked", tabName);
      const showAdmin = tabName === "admin";
      const showHow = tabName === "how";
      paySection.hidden = showAdmin || showHow;
      adminSection.hidden = !showAdmin;
      howSection.hidden = !showHow;
      rwphSetTabButtonActive(payTabBtn, !showAdmin && !showHow);
      rwphSetTabButtonActive(adminTabBtn, showAdmin);
      rwphSetTabButtonActive(howTabBtn, showHow);
    }

    payTabBtn.addEventListener("click", () => switchLockedTab("unlock"));
    adminTabBtn.addEventListener("click", () => switchLockedTab("admin"));
    howTabBtn.addEventListener("click", () => switchLockedTab("how"));
    switchLockedTab(rwphGetActiveTab("locked", "unlock"));

    const lockedSaveKeyBtn = document.getElementById("rw-paywall-save-key");
    if (lockedSaveKeyBtn) {
      lockedSaveKeyBtn.addEventListener("click", async () => {
        const key = document.getElementById("rw-paywall-key").value.trim();
        GM_setValue(STORAGE_KEY, key);
        const msg = key ? "API key saved locally." : "Saved blank API key locally.";
        const status = document.getElementById("rw-paywall-status");
        rwphToastPanelInfo(status, msg, "info", "RWPH Info");
        if (key) await rwphUnlockMainPanelIfActive(status, "save");
      });
    }

    const lockedUnlockBtn = document.getElementById("rw-unlock-existing");
    if (lockedUnlockBtn) {
      lockedUnlockBtn.addEventListener("click", async () => {
        const status = document.getElementById("rw-paywall-status");
        const key = document.getElementById("rw-paywall-key")?.value.trim() || "";
        if (key) GM_setValue(STORAGE_KEY, key);

        status.textContent = "Checking licence...";
        const info = await getSavedLicenseInfo();
        if (!info.valid) {
          rwphToastPanelError(status, "Unlock failed: " + (info.error || (info.revoked ? "Licence revoked." : "No active licence found.")), "RWPH Licence");
          return;
        }

        if (info.token) GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, info.token);
        rwphToastPanelInfo(status, "Licence active. Unlocking RWPH...", "info", "RWPH Licence");
        clearPendingPayment();
        showMainScreen(panel);
        const mainStatus = document.getElementById("rw-status");
        if (mainStatus) mainStatus.textContent = "Licence active. Main panel unlocked.";
      });
    }

    document.getElementById("rw-start-payment").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      const codeBox = document.getElementById("rw-paywall-code");
      const userKey = document.getElementById("rw-paywall-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");
      const paymentTab = null;

      try {
        GM_setValue(STORAGE_KEY, userKey);
        status.textContent = "Creating payment code and changing this tab to the Xanax send page...";
        codeBox.innerHTML = "";

        const result = await apiPost("/api/paywall/start", { userKey });
        if (result.alreadyPaid && result.token) {
          closePreOpenedPaymentTab(paymentTab);
          clearPendingPayment();
          GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
          rwphToastPanelInfo(status, "Existing license found. Loading tool...", "info", "RWPH Licence");
          closePanel();
          createPanel();
          return;
        }

        rwphOpenPaymentHelperFromPendingResult(result, paymentTab, status, codeBox, "unlock");
        setTimeout(closePanel, 150);
      } catch (e) {
        closePreOpenedPaymentTab(paymentTab);
        rwphToastPanelError(status, "Payment start error: " + e.message, "RWPH Payment");
      }
    });

    document.getElementById("rw-free-trial").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      const codeBox = document.getElementById("rw-paywall-code");
      const userKey = document.getElementById("rw-paywall-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");

      if (!confirm("Start your 7 day free trial? This can only be used once per Torn account.")) return;

      try {
        GM_setValue(STORAGE_KEY, userKey);
        clearPendingPayment();
        updatePendingPaymentUi();
        status.textContent = "Activating 7 day free trial...";
        codeBox.innerHTML = "";

        const result = await apiPost("/api/paywall/trial", { userKey });
        if (!result.token) throw new Error(result.message || "Trial did not return a license token.");

        GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
        rwphToastPanelInfo(status, `${result.message || "7 day free trial activated."} Loading tool...`, "info", "RWPH Trial");
        closePanel();
        createPanel();
      } catch (e) {
        rwphToastPanelError(status, "Free trial error: " + e.message, "RWPH Trial");
      }
    });

    updatePendingPaymentUi();
    restorePendingPaymentFromDatabase(document.getElementById("rw-paywall-key")?.value.trim(), "unlock");
    setInterval(updatePendingPaymentUi, 30000);
    if (!options.skipAutoUnlock) {
      setTimeout(() => rwphUnlockMainPanelIfActive(document.getElementById("rw-paywall-status"), "silent"), 250);
    }

    document.getElementById("rw-check-license-days").addEventListener("click", async (event) => {
      const status = document.getElementById("rw-paywall-status");
      const button = event.currentTarget;
      if (!rwphTryUseManualLicenseCheck(status, button)) return;
      if (status) status.textContent = "Checking saved license...";
      await showLicenseDays(status, { openPanel: true });
      if (button?.isConnected) button.disabled = false;
    });

    function getAdminKeyFromInput() {
      const adminKey = document.getElementById("rw-admin-key").value.trim();
      if (!adminKey) throw new Error("Enter your admin key first.");
      return adminKey;
    }

    function renderAdminStatusSummary(result) {
      const calculations = result.calculations || {};
      const cache = result.cache || {};
      const stats = result.stats || {};
      return `
        <div class="rw-admin-status-grid">
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Calculations</div><div class="rw-admin-status-value">${Number(calculations.active || 0)} active / direct start</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Report cache</div><div class="rw-admin-status-value">${Number(cache.reportCacheEntries || 0)} saved</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Cache hits</div><div class="rw-admin-status-value">${Number(stats.reportCacheHits || 0)}</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Reports made</div><div class="rw-admin-status-value">${Number(stats.reportsCreated || 0)}</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Torn cache</div><div class="rw-admin-status-value">${Number(cache.tornMemoryEntries || 0)} live</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Storage</div><div class="rw-admin-status-value">${esc(result.storage?.mode || "json")}</div></div>
        </div>`;
    }

    async function loadAdminServerStatus() {
      const status = document.getElementById("rw-admin-status");
      const box = document.getElementById("rw-admin-status-summary");
      const adminKey = getAdminKeyFromInput();
      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading server status...";
      const result = await adminRequest("POST", "/api/admin/status", adminKey);
      if (box) box.innerHTML = renderAdminStatusSummary(result);
      rwphToastPanelInfo(status, `Server online. ${Number(result.calculations?.active || 0)} calculation(s) active. Report cache has ${Number(result.cache?.reportCacheEntries || 0)} saved item(s).`, "info", "RWPH Admin");
    }

    async function refreshAdminLicenses() {
      const status = document.getElementById("rw-admin-status");
      const results = document.getElementById("rw-admin-results");
      const adminKey = getAdminKeyFromInput();

      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading licences from server...";
      results.innerHTML = "";

      const result = await adminRequest("POST", "/api/admin/licenses", adminKey);
      results.innerHTML = renderAdminLicenses(result.licenses || []);
      rwphToastPanelInfo(status, `Loaded ${(result.licenses || []).length} licence(s).`, "info", "RWPH Admin");

      results.querySelectorAll(".rw-admin-fill-revoke").forEach((btn) => {
        btn.addEventListener("click", () => {
          const filledId = btn.dataset.tornId || "";
          const filledName = btn.dataset.name || (filledId ? `User ${filledId}` : "");
          document.getElementById("rw-admin-torn-id").value = filledId;
          document.getElementById("rw-admin-name").value = filledName;
          rwphToastPanelInfo(
            document.getElementById("rw-admin-status"),
            filledName ? `Filled ${filledName} (${filledId}) into the admin form.` : `Filled Torn ID ${filledId} into the admin form.`,
            "info",
            "RWPH Admin"
          );
        });
      });
    }

    document.getElementById("rw-admin-status-load")?.addEventListener("click", async () => {
      try {
        await loadAdminServerStatus();
      } catch (e) {
        rwphToastPanelError(document.getElementById("rw-admin-status"), "Server status error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-save-key").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        await rwphSaveAdminKeyAndRevealTools(panel, { grantOwner: true, refreshLicenses: true });
      } catch (e) {
        GM_setValue(ADMIN_KEY_STORAGE_KEY, "");
        rwphSetAdminToolsVisible(panel, false, "Invalid admin key. Admin tools are still hidden.");
        rwphToastPanelError(status, "Admin key check failed: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-list").addEventListener("click", async () => {
      try {
        await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(document.getElementById("rw-admin-status"), "Admin list error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-grant").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = getAdminKeyFromInput();
        const tornId = document.getElementById("rw-admin-torn-id").value.trim();
        const name = document.getElementById("rw-admin-name").value.trim() || `User ${tornId}`;
        const days = Number(document.getElementById("rw-admin-days").value || 30);

        if (!tornId) return alert("Enter the player's Torn ID.");
        if (!days || days <= 0) return alert("Enter valid license days.");

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = `Granting ${days} day license to ${name} (${tornId})...`;

        const result = await adminRequest("POST", "/api/admin/grant", adminKey, { tornId, name, days });

        rwphToastPanelInfo(status, `Granted license to ${result.name || name} (${result.tornId || tornId}) until ${formatUnixDate(result.expiresAt)}.`, "info", "RWPH Admin");
        await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin grant error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-extend").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await extendAdminLicenseFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin extend error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-revoke").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await removeAdminLicenseDaysFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin remove error: " + e.message, "RWPH Admin");
      }
    });
  }


  let rwphNextUseCacheOnly = false;
  let rwphNextUseCacheOnlyMode = "standard";
  let rwphAutoCacheCheckTimer = null;
  let rwphLastCacheCheckSignature = "";
  let rwphCachedReports = {
    standard: { available: false, info: null },
    points: { available: false, info: null },
  };
  let rwphCachedReportAvailable = false;
  let rwphCachedReportInfo = null;

  function showMainScreen(panel) {
    const savedKey = GM_getValue(STORAGE_KEY, "");
    const savedAdminKey = GM_getValue(ADMIN_KEY_STORAGE_KEY, "");
    const current = Math.floor(Date.now() / 1000);
    const twoDaysAgo = current - 172800;

    panel.innerHTML = `
      <style>${panelBaseCss()}
  </style>
      <div class="rw-head">
        <span>Ranked War Payout Helper</span>
        <button id="rw-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
      </div>
      <div class="rw-body">
        <div class="rw-small">
          Server-side locked version. Your backend verifies the license and calculates payouts.
        </div>
        <div class="rw-small">
          Completed-war mode: use the highlighted Basic Calculations or Advanced Calculations dropdown. Each dropdown has its own times, payout amount, cache controls, exclusions, and Calculate button.
        </div>

        <div class="rw-tabs" role="tablist" aria-label="Main panel tabs">
          <button id="rw-tab-payout" class="rw-tab-btn active" role="tab" aria-selected="true" aria-pressed="true">Payout</button>
          <button id="rw-tab-admin" class="rw-tab-btn secondary" role="tab" aria-selected="false" aria-pressed="false">Admin</button>
          <button id="rw-tab-how" class="rw-tab-btn secondary" role="tab" aria-selected="false" aria-pressed="false">Help</button>
        </div>

        <div id="rw-payout-tab" class="rw-tab-section">
          <label>API Key
            <input id="rw-key" type="password" value="${esc(savedKey)}" placeholder="Paste Torn API key">
          </label>
          <div class="rw-api-visible-card" role="note" aria-label="API key usage notice">
            <div class="rw-api-visible-head"><span>API Key Notice</span><span class="rw-api-visible-badge">Limited Access</span></div>
            <div class="rw-api-visible-summary">
              <b>Purpose:</b> verify licence + build ranked-war payout reports <span class="rw-api-visible-dot">•</span>
              <b>Reads:</b> Torn ID, faction/member, ranked-war and attack data needed for calculations <span class="rw-api-visible-dot">•</span>
              <b>Stored:</b> only in your browser/PDA when you click Save Key <span class="rw-api-visible-dot">•</span>
              <b>Backend:</b> sent only to your configured RWPH server for licence checks and calculations <span class="rw-api-visible-dot">•</span>
              <b>Never:</b> Torn password, automatic attacks, automatic item sends, or automatic cash sends
            </div>
          </div>
          <div class="rw-actions rw-licence-control-grid">
            <button id="rw-extend-licence">Extend Licence</button>
            <button id="rw-save" class="secondary">Save Key</button>
            <button id="rw-license-days" class="secondary">Your Expiration</button>
            <button id="rw-lock" class="secondary">Lock Panel</button>
          </div>
          <div class="rw-small">RWPH only creates payout reports for the latest completed ranked war. Active/current wars cannot be calculated until they finish. If a matching backend/database cached report exists, RWPH shows a popup and the matching cached-report button opens the backend/database cached result.</div>
          <details class="rw-api-tos-card rw-api-tos-dropdown rw-settings-dropdown rw-per-hit-settings">
            <summary class="rw-api-tos-title">Basic Calculations</summary>
            <div class="rw-api-tos-content">
              <div class="rw-cache-tools rw-mode-cache-tools">
                <div class="rw-calc-brief"><b>Cache:</b> auto-checks matching reports. Use/Delete below; deletes are limited to 1 per 10 minutes.</div>
                <div id="rw-cache-status-per-hit" class="rw-muted rw-compact-cache-status">Cache waits for key/settings.</div>
              </div>
              <div class="rw-row">
                <label>War start date/time
                  <input id="rw-from" type="datetime-local" value="${toDateTimeLocalValue(twoDaysAgo)}">
                </label>
                <label>War end date/time
                  <input id="rw-to" type="datetime-local" value="${toDateTimeLocalValue(current)}">
                </label>
              </div>
              <div class="rw-actions rw-settings-time-actions">
                <button id="rw-autofill" class="secondary" type="button" data-rwph-autofill-mode="standard">Auto-fill Last Finished War</button>
              </div>
              <div class="rw-row">
                <label>Member Payout
                  <input id="rw-total" type="text" value="$100,000,000" inputmode="decimal" autocomplete="off" spellcheck="false">
                </label>
                <label>Total Payout
                  <input id="rw-total-overall" type="text" value="$100,000,000" inputmode="decimal" autocomplete="off" spellcheck="false">
                </label>
              </div>
              <div class="rw-calc-brief">Tick hit types/respect to include. Each checked hit type counts as <b>1</b>; Respect adds that member's payout respect to their payout weight.</div>
              <div class="rw-compact-check-grid">
                <label><input id="rw-war-hit-weight" type="checkbox" checked> War hits</label>
                <label><input id="rw-outside-hit-weight" type="checkbox" checked> Outside hits</label>
                <label><input id="rw-retaliation-hit-weight" type="checkbox" checked> Retals</label>
                <label><input id="rw-assist-weight" type="checkbox"> Assists</label>
                <label><input id="rw-respect-weight" type="checkbox"> Respect</label>
              </div>
              <div class="rw-compact-check-grid rw-compact-check-grid-single">
                <label><input id="rw-basic-fast-mode" type="checkbox"> Fast Mode — ranked-war report only</label>
              </div>
              <div class="rw-calc-brief rw-calc-mini-note">Fast Mode is much quicker. It uses Torn rankedwarreport for War Hits, members, Respect and Total Respect, but skips attack-log extras like assists, outside hits and retals.</div>
              <div class="rw-actions rw-member-management-actions">
                <button id="rw-member-management" class="secondary" type="button" data-member-management-mode="standard">Member Management</button>
                <span id="rw-member-management-summary" class="rw-muted rw-member-management-summary">No member changes selected.</span>
              </div>
              <textarea id="rw-excluded-members" rows="1" hidden style="display:none"></textarea>
              <div class="rw-calc-brief rw-calc-mini-note">Open Member Management to remove a member completely, remove payable hits, or subtract respect from a member before payouts are recalculated.</div>
              <div class="rw-actions rw-primary-calc-actions rw-settings-calc-actions">
                <button id="rw-run" type="button">Calculate</button>
                <button id="rw-use-cache" class="secondary" type="button" disabled>Use Cached Report</button>
                <button id="rw-delete-cache" class="danger" type="button" disabled>Delete Cache</button>
              </div>
            </div>
          </details>
          <details class="rw-api-tos-card rw-api-tos-dropdown rw-settings-dropdown rw-points-settings">
            <summary class="rw-api-tos-title">Advanced Calculations</summary>
            <div class="rw-api-tos-content">
              <div class="rw-calc-brief"><b>Advanced:</b> splits Member Payout by points from war/assist/outside/retal/hospital and Avg FF settings.</div>
              <div class="rw-cache-tools rw-mode-cache-tools">
                <div class="rw-calc-brief"><b>Cache:</b> auto-checks matching reports. Use/Delete below; deletes are limited to 1 per 10 minutes.</div>
                <div id="rw-cache-status-points" class="rw-muted rw-compact-cache-status">Cache waits for key/settings.</div>
              </div>
              <div class="rw-row">
                <label>War start date/time
                  <input id="rw-points-from" type="datetime-local" value="${toDateTimeLocalValue(twoDaysAgo)}">
                </label>
                <label>War end date/time
                  <input id="rw-points-to" type="datetime-local" value="${toDateTimeLocalValue(current)}">
                </label>
              </div>
              <div class="rw-actions rw-settings-time-actions">
                <button id="rw-points-autofill" class="secondary" type="button" data-rwph-autofill-mode="points">Auto-fill Last Finished War</button>
              </div>
              <div class="rw-row">
                <label>Member Payout
                  <input id="rw-points-total" type="text" value="$100,000,000" inputmode="decimal" autocomplete="off" spellcheck="false">
                </label>
                <label>Total Payout
                  <input id="rw-points-total-overall" type="text" value="$100,000,000" inputmode="decimal" autocomplete="off" spellcheck="false">
                </label>
              </div>
              <div class="rw-actions rw-member-management-actions">
                <button id="rw-points-member-management" class="secondary" type="button" data-member-management-mode="points">Member Management</button>
                <span id="rw-points-member-management-summary" class="rw-muted rw-member-management-summary">No member changes selected.</span>
              </div>
              <textarea id="rw-points-excluded-members" rows="1" hidden style="display:none"></textarea>
              <div class="rw-calc-brief rw-calc-mini-note">Open Member Management to remove a member completely, remove payable hits, or subtract respect from a member before points payouts are recalculated.</div>
              <div class="rw-row">
                <label>War hit points
                  <input id="rw-point-war-hit" type="number" value="10" step="0.1" min="0">
                </label>
                <label>Assist points
                  <input id="rw-point-assist" type="number" value="3" step="0.1" min="0">
                </label>
              </div>
              <div class="rw-row">
                <label>Outside hit points
                  <input id="rw-point-outside" type="number" value="2" step="0.1" min="0">
                </label>
                <label>War-faction retal bonus points
                  <input id="rw-point-retal" type="number" value="0.2" step="0.1" min="0">
                </label>
              </div>
              <div class="rw-row">
                <label>Own-faction hospital bonus points
                  <input id="rw-point-hospital" type="number" value="2" step="0.1" min="0">
                </label>
                <label>Enemy war faction hospital bonus points (can be negative)
                  <input id="rw-point-enemy-hospital" type="number" value="-1" step="0.1">
                </label>
              </div>
              <div class="rw-row">
                <label>Respect score to add
                  <input id="rw-point-respect" type="number" value="0.01" step="0.01" min="0">
                </label>
                <label>Per respect earned
                  <input id="rw-point-respect-step" type="number" value="0.01" step="0.01" min="0.01">
                </label>
              </div>
              <div class="rw-calc-brief rw-calc-mini-note">Default: every <b>0.01</b> respect earned adds <b>0.01</b> score. You can change both the score added and the respect amount.</div>
              <div class="rw-compact-check-grid rw-compact-check-grid-single">
                <label><input id="rw-point-fair-fight" type="checkbox" checked> Use fair-fight modifier</label>
              </div>
              <div class="rw-row">
                <label>Avg FF required per bonus step
                  <input id="rw-point-fair-fight-avg-step" type="number" value="0.02" step="0.01" min="0.01">
                </label>
                <label>Point bonus per payable hit per step
                  <input id="rw-point-fair-fight-bonus-step" type="number" value="0.01" step="0.01" min="0">
                </label>
              </div>
              <div class="rw-calc-brief rw-calc-mini-note">Avg FF over 1.00 adds the configured bonus per payable hit. Capped at 3.00; untick for no FF bonus.</div>
              <div class="rw-actions rw-primary-calc-actions rw-settings-calc-actions">
                <button id="rw-points-run" class="secondary" type="button">Calculate</button>
                <button id="rw-use-points-cache" class="secondary" type="button" disabled>Use Cached Report</button>
                <button id="rw-delete-points-cache" class="danger" type="button" disabled>Delete Cache</button>
              </div>
            </div>
          </details>
          <div class="rw-actions" id="rw-last-results-actions">
            <button id="rw-open-theme-picker" class="secondary" type="button">Panel Theme / Colours</button>
          </div>
          <div id="rw-main-payment-code"></div>
          <div id="rw-status" class="rw-muted">Ready.</div>
          <div id="rw-results-placeholder" class="rw-muted">Results will open in a separate results panel after you click Calculate in Basic Calculations or Advanced Calculations.</div>
        </div>

        <div id="rw-admin-tab-section" class="rw-tab-section rw-unified-tab-panel" hidden>
          <div class="rw-admin-box rw-admin-unified-panel">
            <div class="rw-small">
              Admin tools call your backend directly. Keep your admin key private.
            </div>

            <label>Admin Key
              <input id="rw-admin-key" type="password" value="${esc(savedAdminKey)}" placeholder="Paste ADMIN_KEY from your .env">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-save-key" class="secondary">Save Admin Key</button>
              <button id="rw-admin-list">List Licences</button>
              <button id="rw-admin-status-load" class="secondary" type="button">Server Status</button>
            </div>
            <div class="rw-admin-advanced-box">
              <div class="rw-small"><b>Admin-only advanced mode:</b> force refresh bypasses the completed-war report cache for the next Fetch + Calculate only. Use it only if you believe cached results are wrong.</div>
              <label style="display:flex;align-items:center;gap:6px;margin-top:6px;">
                <input id="rw-admin-force-refresh" type="checkbox" style="width:auto;margin:0;"> Force refresh next report
              </label>
              <div id="rw-admin-status-summary" class="rw-small">Server status will appear here.</div>
            </div>

            <label>Player Torn ID
              <input id="rw-admin-torn-id" type="text" placeholder="Example: 1234567">
            </label>

            <label>Player Name
              <input id="rw-admin-name" type="text" placeholder="Optional, example: PlayerName">
            </label>

            <label>License Days
              <input id="rw-admin-days" type="number" value="30" min="1">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-grant">Grant License</button>
              <button id="rw-admin-extend" class="secondary">Extend License</button>
              <button id="rw-admin-revoke" class="danger">Remove</button>
            </div>
          </div>

          <div id="rw-admin-status" class="rw-muted">Admin tools ready.</div>
          <div id="rw-admin-results"></div>
        </div>

                <div id="rw-how-tab-section" class="rw-tab-section" hidden>

          <div class="rw-how-box rw-help-api-card rw-help-section-card rw-help-hero-card">
            <div class="rw-how-title">RWPH Help</div>
            <p class="rw-how-intro">
              Ranked War Payout Helper is a manual payout calculator for Torn ranked wars. It reads the war/report data you ask it to use, builds Basic or Advanced results, and gives you payment/newsletter helper panels. You still review every result and manually complete every Torn action yourself.
            </p>
          </div>



          <div class="rw-how-box rw-help-api-card rw-help-section-card rw-tutorial-card">
            <div class="rw-how-title">Step-by-Step Tutorial</div>
            <ul class="rw-how-list">
              <li><b>1. Open RWPH:</b> go to a Torn faction page and click the Ranked War Payout Helper launcher beside Faction Warfare.</li>
              <li><b>2. Save your API key:</b> paste your Torn limited API key, then click <b>Save Key</b>. It is saved only on this browser/PDA.</li>
              <li><b>3. Unlock or buy:</b> click <b>Unlock Panel</b> if you already have a licence, or <b>Buy Licence</b> to create a Xanax payment code.</li>
              <li><b>4. Choose payout mode:</b> use <b>Basic Calculations</b> for simple per-hit payouts, or <b>Advanced Calculations</b> for weighted points.</li>
              <li><b>5. Fill war times:</b> click <b>Auto-fill Last Finished War</b> when available, then check the start and finish times before calculating.</li>
              <li><b>6. Enter payout amount:</b> add the member payout pool you want split across eligible members.</li>
              <li><b>7. Exclude members if needed:</b> open Member Management to exclude members or remove member hits before calculating.</li>
              <li><b>8. Calculate:</b> press the Calculate button inside the mode you picked. The loading panel shows each stage.</li>
              <li><b>9. Review results:</b> check stats, members, payout amounts, and managed member removals before using payment tools.</li>
              <li><b>10. Pay and post manually:</b> use the Payments and Newsletter tools to copy/prefill details, then manually confirm everything in Torn yourself.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Fast Start</div>
            <ul class="rw-how-list">
              <li><b>1. API key:</b> paste a Torn API key that has the faction/ranked-war access needed for reports.</li>
              <li><b>2. Save or unlock:</b> Save Key stores it on this browser/PDA only. Unlock Panel checks your active licence.</li>
              <li><b>3. Pick a calculation dropdown:</b> use <b>Basic Calculations</b> for simple per-hit style payouts, or <b>Advanced Calculations</b> for points-based payouts.</li>
              <li><b>4. Set war times:</b> use Auto-fill Last Finished War when possible, then check the start/end times.</li>
              <li><b>5. Calculate:</b> click the Calculate button inside the dropdown you are using. The loading panel shows progress and then lets you open results.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Basic Calculations</div>
            <ul class="rw-how-list">
              <li><b>Best for:</b> quick payout splits where checked hit types count as 1 each.</li>
              <li><b>Hit type boxes:</b> War hits, Outside hits, Retals, and Assists control what counts in the Basic result.</li>
              <li><b>Fast Mode:</b> uses ranked-war report data only. It is quicker, but skips attack-log extras like assists, outside hits, and retals.</li>
              <li><b>Member Payout:</b> the amount you want split between eligible members.</li>
              <li><b>Total Payout:</b> your overall reference total. Member Payout is the value used for the member split.</li>
              <li><b>Member Management:</b> open the management panel to exclude members or remove specific payable hit counts before payouts are recalculated.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Advanced Calculations</div>
            <ul class="rw-how-list">
              <li><b>Best for:</b> payout splits based on contribution points instead of simple hit counts.</li>
              <li><b>Point values:</b> set values for war hits, assists, outside hits, retals, hospital bonuses, enemy hospital bonuses, and fair-fight bonus.</li>
              <li><b>Negative enemy hospital bonus:</b> enemy war-faction hospital bonus can be negative when you want to punish that action.</li>
              <li><b>Fair-fight modifier:</b> when enabled, Avg FF over 1.00 can add bonus points per payable hit. It is capped at 3.00.</li>
              <li><b>Member Management:</b> Advanced has its own member management settings and recalculates points payouts after exclusions or payable hit removals.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Cache and Results</div>
            <ul class="rw-how-list">
              <li><b>Separate caches:</b> Basic and Advanced reports use separate backend/database caches.</li>
              <li><b>Duplicate protection:</b> if a matching cached report already exists, RWPH asks you to use that report instead of starting a duplicate calculation.</li>
              <li><b>Use Cached Report:</b> opens the matching cached Basic or Advanced report when available.</li>
              <li><b>Delete Cache:</b> removes the matching cached report. Successful deletes are limited to one every 10 minutes.</li>
              <li><b>Results panel:</b> shows all result stats, member cards, CSV export, Export Html, Payments, and Newsletter tools.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Payments and Newsletters</div>
            <ul class="rw-how-list">
              <li><b>Payments:</b> opens the payment helper from the results page. RWPH helps copy/prefill details but does not send money.</li>
              <li><b>Manual safety:</b> always check Torn fields yourself before confirming any payment. Use Add To Balance where your faction process requires it.</li>
              <li><b>Export Html:</b> downloads the current results page as an HTML file for records.</li>
              <li><b>Newsletter dropdown:</b> opens styled newsletter HTML versions. Each panel has a preview and a raw HTML box.</li>
              <li><b>Copy newsletter HTML:</b> right-click inside the raw HTML box, choose Select All, then Copy.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Licence and Admin</div>
            <ul class="rw-how-list">
              <li><b>Buy Licence:</b> creates a Xanax payment code and opens the payment helper.</li>
              <li><b>Extend Licence:</b> creates an extension payment code. Existing active pending codes are reused where possible.</li>
              <li><b>Your Expiration:</b> opens a licence info panel with the current expiry and time left.</li>
              <li><b>Admin panel:</b> admins can grant, extend, list, fill, and remove licence days after a valid ADMIN_KEY is saved and verified by the server.</li>
              <li><b>Keep admin secrets private:</b> never share ADMIN_KEY, PAYWALL_SECRET, private server URLs, or licence tokens with untrusted people.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Panels, PDA, and Troubleshooting</div>
            <ul class="rw-how-list">
              <li><b>Move panels:</b> drag the panel header/title area.</li>
              <li><b>Resize panels:</b> use the resize handles. Layout is remembered for supported panels.</li>
              <li><b>Loading panel:</b> shows stages and progress. Closing it cancels the running backend calculation where supported.</li>
              <li><b>If a button does nothing:</b> refresh Torn/PDA, reopen RWPH, and confirm you installed the newest userscript.</li>
              <li><b>If API calls slow down:</b> Torn may be rate-limiting. Wait, use cached reports, and avoid repeated calculations.</li>
              <li><b>If the server fails:</b> check that PAYWALL_API_BASE points to your running backend and that the /health endpoint works.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">API Key Terms - Short Version</div>
            <ul class="rw-how-list">
              <li><b>What it is used for:</b> licence checks, Torn ID verification, faction/member data, ranked-war reports, and attack data required for payouts.</li>
              <li><b>Where it is stored:</b> only in local browser/Tampermonkey/Torn PDA storage when you click Save Key.</li>
              <li><b>Where it is sent:</b> only to the configured RWPH backend for checks and calculations.</li>
              <li><b>What RWPH never needs:</b> Torn password, automatic attacking, automatic item sending, or automatic money sending.</li>
              <li><b>Your control:</b> you can clear the saved key from userscript/browser storage, lock the panel, or revoke/rotate the key in Torn.</li>
            </ul>
          </div>

          <div class="rw-how-box rw-help-api-card rw-help-section-card">
            <div class="rw-how-title">Responsible Use</div>
            <ul class="rw-how-list">
              <li><b>Review everything:</b> results can be affected by Torn API limits, cache state, wrong time windows, exclusions, or server issues.</li>
              <li><b>Manual actions only:</b> RWPH does not confirm Torn payments or gameplay actions for you.</li>
              <li><b>Follow rules:</b> use RWPH only in ways allowed by Torn, your faction, and your server/licence setup.</li>
              <li><b>No uptime guarantee:</b> Torn, Torn PDA, browsers, hosting, or API changes can temporarily break features.</li>
            </ul>
          </div>

        </div>

      <div id="rw-results-panel" class="rw-results-panel" hidden>
        <div class="rw-head">
          <span>Per Hit Results</span>
          <button id="rw-results-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
        </div>
        <div class="rw-body">
          <div id="rw-results"></div>
        </div>
      </div>`;

    rwphMakeHelpPanelCardsDropdowns(panel);
    rwphEnablePanelMoveResize(panel);
    const mainResultsPanel = document.getElementById("rw-results-panel");
    rwphEnablePanelMoveResize(mainResultsPanel);
    attachMoveLauncherButton();
    attachPanelThemeButton();

    const payoutTabBtn = document.getElementById("rw-tab-payout");
    const adminTabBtn = document.getElementById("rw-tab-admin");
    const howTabBtn = document.getElementById("rw-tab-how");
    const payoutTab = document.getElementById("rw-payout-tab");
    const adminTab = document.getElementById("rw-admin-tab-section");
    const howTab = document.getElementById("rw-how-tab-section");

    function switchTab(tabName) {
      rwphSaveActiveTab("main", tabName);
      const showAdmin = tabName === "admin";
      const showHow = tabName === "how";
      payoutTab.hidden = showAdmin || showHow;
      adminTab.hidden = !showAdmin;
      howTab.hidden = !showHow;
      rwphSetTabButtonActive(payoutTabBtn, !showAdmin && !showHow);
      rwphSetTabButtonActive(adminTabBtn, showAdmin);
      rwphSetTabButtonActive(howTabBtn, showHow);
    }

    payoutTabBtn.addEventListener("click", () => switchTab("payout"));
    adminTabBtn.addEventListener("click", () => switchTab("admin"));
    howTabBtn.addEventListener("click", () => switchTab("how"));
    rwphRestorePayoutFormState();
    rwphSyncMemberManagementHiddenFields();
    rwphAttachMoneyInputFormatting();
    rwphFormatPayoutMoneyInputs();
    rwphAttachPayoutFormPersistence();
    switchTab(rwphGetActiveTab("main", "payout"));

    rwphBindAdminControls(panel);
    rwphSetAdminToolsVisible(panel, false, savedAdminKey ? "Saved admin key found. Click Save Admin Key to verify it and show the admin tools." : "Enter your ADMIN_KEY and click Save Admin Key to show the admin tools.");

    document.getElementById("rw-close").addEventListener("click", closePanel);

    document.getElementById("rw-save").addEventListener("click", () => {
      const key = document.getElementById("rw-key").value.trim();
      GM_setValue(STORAGE_KEY, key);
      const status = document.getElementById("rw-status");
      rwphToastPanelInfo(status, "API key saved locally.", "info", "RWPH Info");
    });

    rwphUpdateLastResultsButton();
    ["rw-key", "rw-from", "rw-to", "rw-points-from", "rw-points-to", "rw-total", "rw-total-overall", "rw-points-total", "rw-points-total-overall", "rw-war-hit-weight", "rw-outside-hit-weight", "rw-retaliation-hit-weight", "rw-assist-weight", "rw-respect-weight", "rw-basic-fast-mode", "rw-point-war-hit", "rw-point-assist", "rw-point-outside", "rw-point-retal", "rw-point-hospital", "rw-point-enemy-hospital", "rw-point-respect", "rw-point-respect-step", "rw-point-fair-fight", "rw-point-fair-fight-avg-step", "rw-point-fair-fight-bonus-step", "rw-excluded-members", "rw-points-excluded-members"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => rwphScheduleAutoCacheCheck(700));
        input.addEventListener("change", () => rwphScheduleAutoCacheCheck(700));
      }
    });
    rwphScheduleAutoCacheCheck(900);

    document.getElementById("rw-member-management")?.addEventListener("click", () => rwphOpenMemberManagementPanel("standard"));
    document.getElementById("rw-points-member-management")?.addEventListener("click", () => rwphOpenMemberManagementPanel("points"));

    const legacyCsvBtn = document.getElementById("rw-csv");
    if (legacyCsvBtn) legacyCsvBtn.addEventListener("click", () => downloadCSV(lastRows, document.getElementById("rw-status")));

    const resultsCloseBtn = document.getElementById("rw-results-close");
    if (resultsCloseBtn) {
      resultsCloseBtn.addEventListener("click", () => {
        const resultsPanel = document.getElementById("rw-results-panel");
        if (resultsPanel) {
          resultsPanel.hidden = true;
          resultsPanel.setAttribute("hidden", "");
          resultsPanel.style.display = "none";
        }
      });
    }

    document.getElementById("rw-payout-helper").addEventListener("click", async (e) => {
      const status = document.getElementById("rw-status");
      const exportHtmlBtn = e.target.closest("[data-export-html]");
      const exportCsvBtn = e.target.closest("[data-export-csv]");

      if (exportHtmlBtn) {
        if (!lastRows.length) return alert("Calculate results first.");
        const htmlReady = await rwphExportResultsHtmlFromPanel(lastRows, lastSummary || {}, status);
        rwphToastPanelInfo(status, htmlReady ? "HTML export ready. On PDA, use the download/copy panel if it opened." : "HTML automatic download was blocked. Use the export fallback panel.", htmlReady ? "info" : "warn", "RWPH Results");
        return;
      }

      if (exportCsvBtn) {
        if (!lastRows.length) return alert("Calculate results first.");
        const csvReady = await downloadCSV(lastRows, status);
        rwphToastPanelInfo(status, csvReady ? "CSV export ready. On PDA, use the download/copy panel if it opened." : "CSV automatic download was blocked. Use the export fallback panel.", csvReady ? "info" : "warn", "RWPH Results");
        return;
      }

      const payAllBtn = e.target.closest("[data-pay-all]");
      if (payAllBtn) {
        if (!lastRows.length) return alert("Calculate results first.");
        const opened = rwphOpenPayAllInFactionControls(lastRows);
        if (!opened) {
          rwphClearCrossTabPopup("payments");
          rwphToastPanelInfo(
            status,
            "Could not change to the faction vault page. Payments data was saved; open faction controls and use the RWPH Payments link again.",
            "warn",
            "RWPH Payments"
          );
        } else if (status) {
          status.textContent = "Payments helper is opening on the current tab.";
        }
        return;
      }

      const payAllCloseBtn = e.target.closest("[data-pay-all-close]");
      if (payAllCloseBtn) {
        closePayAllCopyPanel();
        return;
      }

      const payAllAcceptWarningBtn = e.target.closest("[data-pay-warning-accept]");
      if (payAllAcceptWarningBtn) {
        const payPanel = payAllAcceptWarningBtn.closest("#rw-pay-all-panel, .rw-pay-all-panel") || document.getElementById("rw-pay-all-panel");
        rwphSetPayAllWarningAccepted(payPanel, true);
        rwphToastPanelInfo(status, "Payment prefill buttons unlocked. Still manually confirm Add To Balance before paying.", "info", "RWPH Payments");
        return;
      }

      const payAllUndoBtn = e.target.closest("[data-pay-all-undo]");
      if (payAllUndoBtn) {
        rwphUndoLastPayAllDisappear(rwphPayAllInlineUndoStack);
        return;
      }

      const payNameBtn = e.target.closest("[data-pay-copy-name]");
      if (payNameBtn) {
        const payPanel = payNameBtn.closest("#rw-pay-all-panel, .rw-pay-all-panel") || document.getElementById("rw-pay-all-panel");
        if (!rwphRequirePayAllWarningAccepted(payPanel, status)) return;
        rwphDismissPayAllCopyPopupsSilently();
        const row = lastRows[Number(payNameBtn.dataset.payCopyName)] || {};
        const res = await rwphPrefillPayAllMember(row);
        // Copy buttons on the Payments Copy Panel are intentionally silent.
        rwphHidePayAllActionButton(payNameBtn, "Name + ID", rwphPayAllInlineUndoStack);
        return;
      }

      const payAmountBtn = e.target.closest("[data-pay-copy-amount]");
      if (payAmountBtn) {
        const payPanel = payAmountBtn.closest("#rw-pay-all-panel, .rw-pay-all-panel") || document.getElementById("rw-pay-all-panel");
        if (!rwphRequirePayAllWarningAccepted(payPanel, status)) return;
        rwphDismissPayAllCopyPopupsSilently();
        const row = lastRows[Number(payAmountBtn.dataset.payCopyAmount)] || {};
        const res = await rwphPrefillPayAllAmount(row);
        // Copy buttons on the Payments Copy Panel are intentionally silent.
        rwphHidePayAllActionButton(payAmountBtn, "Amount", rwphPayAllInlineUndoStack);
        return;
      }

    });

    document.getElementById("rw-license-days").addEventListener("click", async (event) => {
      const status = document.getElementById("rw-status");
      const button = event.currentTarget;
      if (!rwphTryUseManualLicenseCheck(status, button)) return;
      if (status) status.textContent = "Checking saved license...";
      await showLicenseDays(status, { openPanel: true });
      if (button?.isConnected) button.disabled = false;
    });

    document.getElementById("rw-extend-licence").addEventListener("click", async () => {
      const status = document.getElementById("rw-status");
      const codeBox = document.getElementById("rw-main-payment-code");
      const userKey = document.getElementById("rw-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");
      const paymentTab = null;

      try {
        GM_setValue(STORAGE_KEY, userKey);
        status.textContent = "Creating extension payment code and changing this tab to the Xanax send page...";
        if (codeBox) codeBox.innerHTML = "";

        const result = await apiPost("/api/paywall/start", { userKey, extend: true });
        rwphOpenPaymentHelperFromPendingResult(result, paymentTab, status, codeBox, "extend");
        setTimeout(closePanel, 150);
      } catch (e) {
        closePreOpenedPaymentTab(paymentTab);
        rwphToastPanelError(status, "Extend licence error: " + e.message, "RWPH Payment");
      }
    });

    document.getElementById("rw-lock").addEventListener("click", () => {
      const panel = document.getElementById("rw-payout-helper");
      if (panel) showPaywallScreen(panel, { skipAutoUnlock: true });
    });

    startLicenseExpiryMonitor();
    updatePendingPaymentUi();
    restorePendingPaymentFromDatabase(document.getElementById("rw-key")?.value.trim(), "extend");

    async function rwphAutoFillWarTimesForMode(mode = "standard") {
      const status = document.getElementById("rw-status");
      const userKey = document.getElementById("rw-key").value.trim();
      const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
      if (!userKey) return alert("Enter your Torn API key first.");

      try {
        GM_setValue(STORAGE_KEY, userKey);
        if (status) status.textContent = `Asking server for the last finished ranked war for ${rwphModeLabel(mode)}...`;
        const result = await apiPost("/api/calc/war-times", { userKey, token });
        const war = result.war;
        rwphSetTimeWindowForMode(mode, war.start, war.end);
        rwphSavePayoutFormState();
        rwphScheduleAutoCacheCheck(250);
        const msg = `${rwphModeLabel(mode)} times auto-filled: ${readableTime(war.start)} to ${readableTime(war.end)}.`;
        rwphToastPanelInfo(status, msg, "info", "RWPH Info");
      } catch (e) {
        rwphToastPanelError(status, "Auto-fill error: " + e.message, "RWPH War Times");
      }
    }

    document.getElementById("rw-autofill")?.addEventListener("click", () => rwphAutoFillWarTimesForMode("standard"));
    document.getElementById("rw-points-autofill")?.addEventListener("click", () => rwphAutoFillWarTimesForMode("points"));

    document.getElementById("rw-use-cache")?.addEventListener("click", async () => {
      await rwphOpenCachedReport("standard");
    });

    document.getElementById("rw-use-points-cache")?.addEventListener("click", async () => {
      await rwphOpenCachedReport("points");
    });

    document.getElementById("rw-delete-cache")?.addEventListener("click", async () => {
      await rwphDeleteMatchingCachedReport("standard");
    });

    document.getElementById("rw-delete-points-cache")?.addEventListener("click", async () => {
      await rwphDeleteMatchingCachedReport("points");
    });

    async function rwphRunCalculation(calculationMode = "standard", runOptions = {}) {
      rwphFormatPayoutMoneyInputs();
      rwphSavePayoutFormState();
      const status = document.getElementById("rw-status");
      const results = document.getElementById("rw-results");
      const mode = rwphNormalizeCalculationMode(calculationMode);
      const isPointsMode = mode === "points";
      const userKey = document.getElementById("rw-key").value.trim();
      const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
      const useCacheOnly = !!runOptions.useCacheOnly || (rwphNextUseCacheOnly && rwphNormalizeCalculationMode(rwphNextUseCacheOnlyMode) === mode);
      rwphNextUseCacheOnly = false;
      rwphNextUseCacheOnlyMode = "standard";
      const forceRefresh = !!document.getElementById("rw-admin-force-refresh")?.checked;
      const adminKeyForRefresh = forceRefresh ? (GM_getValue(ADMIN_KEY_STORAGE_KEY, "") || document.getElementById("rw-admin-key")?.value?.trim() || "") : "";

      // v1.1.328: Do not run an awaited cache pre-check before opening the results tab.
      // Mobile/Torn PDA treats window.open after an awaited request as non-user-initiated,
      // which can make Calculate look like it never starts. The backend still checks the
      // matching report cache and returns cacheExists when needed.

      const selectedTimeWindow = rwphGetTimeWindowForMode(mode);
      const from = selectedTimeWindow.from;
      const to = selectedTimeWindow.to;
      const totalPayout = rwphGetTotalPayoutForMode(mode);
      const overallTotalPayout = rwphGetOverallTotalPayoutForMode(mode);
      const warHitWeight = rwphFixedPerHitWeight("rw-war-hit-weight", 1);
      const outsideHitWeight = rwphFixedPerHitWeight("rw-outside-hit-weight", 1);
      const retaliationHitWeight = rwphFixedPerHitWeight("rw-retaliation-hit-weight", 1);
      const assistWeight = rwphFixedPerHitWeight("rw-assist-weight", 0);
      const respectWeight = rwphFixedPerHitWeight("rw-respect-weight", 0);
      const basicFastMode = !isPointsMode && rwphBasicFastModeEnabled();
      const basic120ResultsPage = false;
      const pointWarHitValue = Number(document.getElementById("rw-point-war-hit")?.value || 10);
      const pointAssistValue = Number(document.getElementById("rw-point-assist")?.value || 3);
      const pointOutsideHitValue = Number(document.getElementById("rw-point-outside")?.value || 2);
      const pointRetaliationHitValue = Number(document.getElementById("rw-point-retal")?.value || 0.2);
      const pointHospitalBonus = Number(document.getElementById("rw-point-hospital")?.value || 2);
      const pointEnemyHospitalBonus = rwphPointEnemyHospitalBonusValue();
      const pointRespectValue = rwphPointRespectScoreValue();
      const pointRespectStep = rwphPointRespectStepValue();
      const pointFairFightEnabled = document.getElementById("rw-point-fair-fight")?.checked !== false;
      const pointFairFightAvgStep = rwphPointFairFightAvgStepValue();
      const pointFairFightBonusPerStep = rwphPointFairFightBonusStepValue();
      const includeLeftFactionMembers = false;
      rwphSyncMemberManagementHiddenFields();
      const excludedMembersText = rwphGetExcludedMembersTextForMode(mode);
      const memberAdjustments = rwphGetMemberManagementPayload(mode);
      if (!userKey) return alert("Enter your Torn API key.");
      if (totalPayout <= 0) return alert("Enter a Member Payout greater than 0.");
      if (overallTotalPayout < 0) return alert("Total Payout cannot be negative.");
      if (warHitWeight < 0 || outsideHitWeight < 0 || retaliationHitWeight < 0 || assistWeight < 0 || respectWeight < 0) return alert("Weights cannot be negative.");
      if (pointWarHitValue < 0 || pointAssistValue < 0 || pointOutsideHitValue < 0 || pointRetaliationHitValue < 0 || pointHospitalBonus < 0 || pointRespectValue < 0) return alert("Advanced Calculation values cannot be negative.");
      if (!Number.isFinite(pointRespectStep) || pointRespectStep <= 0) return alert("Advanced Respect per respect earned must be greater than 0.");
      if (pointFairFightEnabled && (!Number.isFinite(pointFairFightAvgStep) || pointFairFightAvgStep <= 0)) return alert("Avg FF required per bonus step must be greater than 0.");
      if (pointFairFightEnabled && (!Number.isFinite(pointFairFightBonusPerStep) || pointFairFightBonusPerStep < 0)) return alert("Point bonus per payable hit per step cannot be negative.");

      let preOpenedResultsTab = null;
      let stopProgressPolling = null;
      let stopTabCloseWatcher = null;
      let calcRequest = null;
      let calculationFinished = false;
      let calculationCancelledByClosedTab = false;
      const progressId = `rwph-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      try {
        GM_setValue(STORAGE_KEY, userKey);
        results.innerHTML = "";
        status.textContent = useCacheOnly
          ? "Opening matching cached completed-war report..."
          : (isPointsMode
            ? "Server is verifying licence, using the selected war/time window, fetching attacks, scoring contribution points, applying war-faction retal bonus, own-faction/enemy-faction hospital, and configurable Respect Score, Avg FF per-payable-hit bonus, and splitting the payout by final points. If Torn rate-limits the API, RWPH will pause and retry instead of failing straight away..."
            : (basicFastMode
              ? "Server is verifying licence, checking the report cache, then using Torn rankedwarreport only for a much faster Basic result. Attack-log extras are skipped in Fast Mode..."
              : "Server is verifying licence, checking the report cache, using the selected war/time window, fetching attacks, classifying hits, applying hit/respect weights, and calculating payouts. If Torn rate-limits the API, RWPH will pause and retry instead of failing straight away..."));
        preOpenedResultsTab = openBlankResultsTab(progressId);
        const cancelBecauseTabClosed = () => {
          if (calculationFinished || calculationCancelledByClosedTab) return;
          calculationCancelledByClosedTab = true;
          rwphSendCalcCancel(progressId, "Results loading tab was closed before RWPH finished calculating.");
          try { if (calcRequest && typeof calcRequest.abort === "function") calcRequest.abort(); } catch (_) {}
          if (status) status.textContent = "Calculation cancelled because the results loading tab was closed.";
        };
        stopProgressPolling = rwphStartResultsProgressPolling(preOpenedResultsTab, progressId, cancelBecauseTabClosed);
        stopTabCloseWatcher = rwphStartResultsTabCloseWatcher(preOpenedResultsTab, progressId, cancelBecauseTabClosed);
        rwphSetResultsLoadingStepDone(preOpenedResultsTab, 0);

        calcRequest = apiPostCancelable("/api/calc/rw-payout", {
          userKey,
          token,
          progressId,
          calculationMode: isPointsMode ? "points" : "standard",
          from,
          to,
          memberPayout: totalPayout,
          totalPayout,
          overallTotalPayout,
          warHitWeight,
          outsideHitWeight,
          retaliationHitWeight,
          assistWeight,
          respectWeight,
          basicFastMode,
          basic120ResultsPage,
          pointWarHitValue,
          pointAssistValue,
          pointOutsideHitValue,
          pointRetaliationHitValue,
          pointHospitalBonus,
          pointEnemyHospitalBonus,
          pointRespectValue,
          pointRespectStep,
          pointFairFightEnabled,
          pointFairFightAvgStep,
          pointFairFightBonusPerStep,
          includeLeftFactionMembers,
          excludedMembersText,
          memberManagement: memberAdjustments,
          memberAdjustments,
          useCacheOnly,
          forceRefresh,
          adminKey: adminKeyForRefresh,
        }, { timeout: 600000 });
        const result = await calcRequest.promise;
        calculationFinished = true;
        if (stopTabCloseWatcher) {
          stopTabCloseWatcher();
          stopTabCloseWatcher = null;
        }

        if (result.cacheExists) {
          if (preOpenedResultsTab && !preOpenedResultsTab.closed) {
            try { preOpenedResultsTab.close(); } catch (_) {}
          }
          rwphSetCacheButtonState(result.calculationMode || (isPointsMode ? "points" : "standard"), true, result, false);
          rwphToastPanelInfo(status, result.message || "There is already a cached report. Open the matching settings dropdown and click Use Cached Report.", "warn", "RWPH Cached Report");
          return;
        }

        lastRows = result.rows || [];
        lastSummary = result.summary || {};
        rwphStorePayAllRows(lastRows);
        rwphSaveLastResults(lastRows, lastSummary);
        const reportCacheReady = !!(result.cached || result.cache?.hit || result.cache?.saved || lastSummary?.cacheSaved);
        rwphSetCacheButtonState(isPointsMode ? "points" : "standard", reportCacheReady, { factionName: lastSummary?.factionName || result.factionName || "", cache: result.cache || null, expiresAtMs: result.cache?.expiresAtMs || 0, cachedAtMs: result.cache?.cachedAtMs || 0, summary: lastSummary }, false);
        results.innerHTML = renderRows(lastRows, lastSummary);

        const manualOpenReady = rwphPrepareManualResultsOpenButton(preOpenedResultsTab, progressId, lastRows, lastSummary);
        if (stopProgressPolling) {
          stopProgressPolling();
          stopProgressPolling = null;
        }
        if (manualOpenReady) {
          rwphSetResultsLoadingStepDone(preOpenedResultsTab, 4, 100, "Results data complete. Click Open Results Page when you are ready.");
        } else {
          await rwphShowResultsLoadingCompletion(preOpenedResultsTab);
        }
        if (manualOpenReady) {
          const resultsPanel = document.getElementById("rw-results-panel");
          if (resultsPanel) {
            resultsPanel.hidden = true;
            resultsPanel.setAttribute("hidden", "");
            resultsPanel.style.display = "none";
          }
          rwphToastPanelInfo(status, `${result.cached ? "Cached report loaded" : (isPointsMode ? "Points report done" : "Done")}. ${lastRows.length} members. War ${Number(lastSummary.totalWarHits || 0)}, assists ${Number(lastSummary.totalAssists || 0)}, outside ${Number(lastSummary.totalOutsideHits || 0)}, retals ${Number(lastSummary.totalRetaliationHits || 0)}${isPointsMode ? `, points ${Number(lastSummary.totalPoints || lastSummary.totalWeight || 0).toFixed(2)}` : ""}. Click Open Results Page in the loading panel when ready.`, "info", isPointsMode ? "RWPH Points" : "RWPH Results");
        } else {
          const resultsPanel = document.getElementById("rw-results-panel");
          if (resultsPanel) {
            resultsPanel.hidden = false;
            resultsPanel.removeAttribute("hidden");
            resultsPanel.style.display = "block";
            resultsPanel.style.visibility = "visible";
            resultsPanel.style.opacity = "1";
            resultsPanel.scrollTop = 0;
          }
          rwphToastPanelInfo(status, `${result.cached ? "Cached report loaded" : (isPointsMode ? "Points report done" : "Done")}. ${lastRows.length} members. War ${Number(lastSummary.totalWarHits || 0)}, assists ${Number(lastSummary.totalAssists || 0)}, outside ${Number(lastSummary.totalOutsideHits || 0)}, retals ${Number(lastSummary.totalRetaliationHits || 0)}${isPointsMode ? `, points ${Number(lastSummary.totalPoints || lastSummary.totalWeight || 0).toFixed(2)}` : ""}. Popup blocked, so results opened in the panel.`, "warn", isPointsMode ? "RWPH Points" : "RWPH Results");
        }
      } catch (e) {
        if (stopProgressPolling) {
          stopProgressPolling();
          stopProgressPolling = null;
        }
        if (stopTabCloseWatcher) {
          stopTabCloseWatcher();
          stopTabCloseWatcher = null;
        }
        if (calculationCancelledByClosedTab || e?.cancelled || /cancelled/i.test(String(e?.message || ""))) {
          rwphToastPanelInfo(status, "Calculation stopped because the results loading tab was closed before it finished.", "warn", "RWPH Results");
          return;
        }
        if (preOpenedResultsTab && !preOpenedResultsTab.closed) {
          try {
            preOpenedResultsTab.document.open();
            preOpenedResultsTab.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RWPH Results Error</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#121212;color:#d7d7d7;font-family:Arial,Helvetica,sans-serif;padding:20px;text-align:center}.box{max-width:520px;border:1px solid #474747;border-radius:8px;background:linear-gradient(180deg,#242424,#1a1a1a);padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.45)}h1{margin:0 0 8px;color:#f2f2f2}p{color:#c8c8c8;font-weight:800}
    /* v1.1.102 Torn-style dark/red theme */
    body{background:#121212!important;color:#d7d7d7!important;font-family:Arial,Helvetica,sans-serif!important;}
    body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 16%),repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 1px,transparent 1px 28px)!important;}
    header,.hero,.titlebar{background:linear-gradient(180deg,#303030,#202020)!important;border-color:#454545!important;border-bottom:3px solid #7b1f1f!important;}
    h1,h2,h3,.title,.member-name,.value,.payout,strong,b{color:#f2f2f2!important;text-shadow:0 1px 0 #000!important;}
    p,.muted,.label,td,li,span{color:#c8c8c8!important;}
    .btn,button,a.btn{background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88))!important;color:#fff7ed!important;border:1px solid rgba(251,191,36,.24)!important;border-left:4px solid rgba(245,158,11,.66)!important;border-radius:7px!important;box-shadow:0 1px 0 rgba(255,255,255,.045) inset,0 12px 26px rgba(0,0,0,.26)!important;text-shadow:0 1px 0 rgba(0,0,0,.75)!important;}
    .btn:hover,button:hover,a.btn:hover{filter:brightness(1.08)!important;}
    .btn.secondary,button.secondary,a.secondary{background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(2,6,23,.88))!important;color:#fff7ed!important;border-color:rgba(251,191,36,.24)!important;}
    th{background:linear-gradient(180deg,#333,#242424)!important;color:#eee!important;border-color:#474747!important;}td,table{border-color:#373737!important;}.bar,.fill,.bar-fill{background:linear-gradient(90deg,#8f2623,#d24a43)!important;}

  </style></head><body><div class="box"><h1>RWPH Results Error</h1><p>${esc(e.message || e)}</p><p>${String(e.message || e).toLowerCase().includes("too many requests") || String(e.message || e).toLowerCase().includes("rate limit") ? "Torn is rate limiting API requests right now. RWPH now retries automatically, but if this still appears wait 1-3 minutes before running Fetch + Calculate again." : "You can close this tab and try Calculate again."}</p></div></body></html>`);
            preOpenedResultsTab.document.close();
          } catch (_) {}
        }
        rwphToastPanelError(status, "Error: " + e.message, "RWPH Results");
        if (String(e.message).toLowerCase().includes("license") || String(e.message).toLowerCase().includes("licence")) {
          returnToLockedPanel(String(e.message).toLowerCase().includes("revoked") ? "Your licence was revoked by an admin. Buy Licence or contact the owner to unlock RWPH again." : "Your licence has expired. Buy Licence or extend your licence to unlock RWPH again.");
        }
      }
    }

    document.getElementById("rw-run")?.addEventListener("click", () => rwphRunCalculation("standard"));
    document.getElementById("rw-points-run")?.addEventListener("click", () => rwphRunCalculation("points"));


    function getAdminKeyFromInput() {
      const adminKey = document.getElementById("rw-admin-key").value.trim();
      if (!adminKey) throw new Error("Enter your admin key first.");
      return adminKey;
    }

    function renderAdminStatusSummary(result) {
      const calculations = result.calculations || {};
      const cache = result.cache || {};
      const stats = result.stats || {};
      return `
        <div class="rw-admin-status-grid">
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Calculations</div><div class="rw-admin-status-value">${Number(calculations.active || 0)} active / direct start</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Report cache</div><div class="rw-admin-status-value">${Number(cache.reportCacheEntries || 0)} saved</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Cache hits</div><div class="rw-admin-status-value">${Number(stats.reportCacheHits || 0)}</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Reports made</div><div class="rw-admin-status-value">${Number(stats.reportsCreated || 0)}</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Torn cache</div><div class="rw-admin-status-value">${Number(cache.tornMemoryEntries || 0)} live</div></div>
          <div class="rw-admin-status-card"><div class="rw-admin-status-label">Storage</div><div class="rw-admin-status-value">${esc(result.storage?.mode || "json")}</div></div>
        </div>`;
    }

    async function loadAdminServerStatus() {
      const status = document.getElementById("rw-admin-status");
      const box = document.getElementById("rw-admin-status-summary");
      const adminKey = getAdminKeyFromInput();
      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading server status...";
      const result = await adminRequest("POST", "/api/admin/status", adminKey);
      if (box) box.innerHTML = renderAdminStatusSummary(result);
      rwphToastPanelInfo(status, `Server online. ${Number(result.calculations?.active || 0)} calculation(s) active. Report cache has ${Number(result.cache?.reportCacheEntries || 0)} saved item(s).`, "info", "RWPH Admin");
    }

    async function refreshAdminLicenses() {
      const status = document.getElementById("rw-admin-status");
      const results = document.getElementById("rw-admin-results");
      const adminKey = getAdminKeyFromInput();

      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading licences from server...";
      results.innerHTML = "";

      const result = await adminRequest("POST", "/api/admin/licenses", adminKey);
      results.innerHTML = renderAdminLicenses(result.licenses || []);
      rwphToastPanelInfo(status, `Loaded ${(result.licenses || []).length} licence(s).`, "info", "RWPH Admin");

      results.querySelectorAll(".rw-admin-fill-revoke").forEach((btn) => {
        btn.addEventListener("click", () => {
          const filledId = btn.dataset.tornId || "";
          const filledName = btn.dataset.name || (filledId ? `User ${filledId}` : "");
          document.getElementById("rw-admin-torn-id").value = filledId;
          document.getElementById("rw-admin-name").value = filledName;
          rwphToastPanelInfo(
            document.getElementById("rw-admin-status"),
            filledName ? `Filled ${filledName} (${filledId}) into the admin form.` : `Filled Torn ID ${filledId} into the admin form.`,
            "info",
            "RWPH Admin"
          );
        });
      });
    }

    document.getElementById("rw-admin-status-load")?.addEventListener("click", async () => {
      try {
        await loadAdminServerStatus();
      } catch (e) {
        rwphToastPanelError(document.getElementById("rw-admin-status"), "Server status error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-save-key").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        await rwphSaveAdminKeyAndRevealTools(panel, { grantOwner: true, refreshLicenses: true });
      } catch (e) {
        GM_setValue(ADMIN_KEY_STORAGE_KEY, "");
        rwphSetAdminToolsVisible(panel, false, "Invalid admin key. Admin tools are still hidden.");
        rwphToastPanelError(status, "Admin key check failed: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-list").addEventListener("click", async () => {
      try {
        await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(document.getElementById("rw-admin-status"), "Admin list error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-grant").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = getAdminKeyFromInput();
        const tornId = document.getElementById("rw-admin-torn-id").value.trim();
        const name = document.getElementById("rw-admin-name").value.trim() || `User ${tornId}`;
        const days = Number(document.getElementById("rw-admin-days").value || 30);

        if (!tornId) return alert("Enter the player's Torn ID.");
        if (!days || days <= 0) return alert("Enter valid license days.");

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = `Granting ${days} day license to ${name} (${tornId})...`;

        const result = await adminRequest("POST", "/api/admin/grant", adminKey, { tornId, name, days });

        rwphToastPanelInfo(status, `Granted license to ${result.name || name} (${result.tornId || tornId}) until ${formatUnixDate(result.expiresAt)}.`, "info", "RWPH Admin");
        await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin grant error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-extend").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await extendAdminLicenseFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin extend error: " + e.message, "RWPH Admin");
      }
    });

    document.getElementById("rw-admin-revoke").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await removeAdminLicenseDaysFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        rwphToastPanelError(status, "Admin remove error: " + e.message, "RWPH Admin");
      }
    });
  }


  async function createPanel(options = {}) {
    if (document.getElementById("rw-payout-helper")) return;

    const panel = document.createElement("div");
    panel.id = "rw-payout-helper";
    document.body.appendChild(panel);
    rwphSetPanelOpenState(true);
    setLauncherOpenState(true);
    rwphApplyPanelLayout(panel);

    panel.innerHTML = `<style>${panelBaseCss()}
  </style><div class="rw-body"><div class="rw-muted">Checking licence with server...</div></div>`;

    const licenseState = await rwphCheckLicenseOnPanelOpen();
    if (!document.body.contains(panel)) return;
    if (!licenseState.valid) {
      showPaywallScreen(panel, { skipAutoUnlock: true });
      setTimeout(() => {
        const status = document.getElementById("rw-paywall-status");
        if (status) status.textContent = licenseState.message || "Licence check failed. Unlock Panel when your licence is active.";
      }, 0);
      if (options && options.openTutorial) setTimeout(() => rwphOpenTutorialInPanel(panel), 140);
      return;
    }

    showMainScreen(panel);
    if (options && options.openTutorial) setTimeout(() => rwphOpenTutorialInPanel(panel), 140);
  }

  rwphInstallPageNavigationAutoClose();
  rwphInstallLauncherNavObserver();
  setupXanaxPaymentButtonHandler();
  syncLauncherButtonVisibility();
  rwphScheduleXanaxPaymentHelperOpen();
  rwphMaybeOpenPayAllFromFactionControlsUrl();
  if (rwphShouldShowLauncherOnThisPage() && rwphGetPanelOpenState()) {
    setTimeout(() => createPanel(), 250);
  }
  rwphScheduleFirstRunTutorialAutoOpen(900);
  function rwphInjectUnifiedPanelThemeV1375() {
    try {
      if (document.getElementById("rwph-unified-panel-theme-v1375")) return;
      const style = document.createElement("style");
      style.id = "rwph-unified-panel-theme-v1375";
      style.textContent = `
        :root{
          --rwph-theme-bg:#130b07;
          --rwph-theme-bg2:#21110b;
          --rwph-theme-panel:#211714;
          --rwph-theme-panel2:#2b1d18;
          --rwph-theme-panel3:#3a241c;
          --rwph-theme-line:rgba(184,136,89,.42);
          --rwph-theme-line2:rgba(251,191,36,.34);
          --rwph-theme-text:#fff2dd;
          --rwph-theme-soft:#cfaa8e;
          --rwph-theme-gold:#fbbf24;
          --rwph-theme-orange:#f97316;
          --rwph-theme-green:#22c55e;
          --rwph-theme-red:#7f1d1d;
          --rwph-theme-shadow:0 22px 70px rgba(0,0,0,.62),0 0 30px rgba(184,136,89,.18);
        }

        #rw-payout-helper,
        #rw-pay-all-panel,
        .rw-pay-all-panel,
        .rwph-floating-panel,
        .rwph-results-loading-panel,
        .rwph-results-html-panel,
        .rw-results-panel,
        .rw-main-panel,
        .rw-locked-panel,
        .rw-admin-panel,
        .rw-help-panel,
        .rw-payment-panel,
        .rw-admin-box,
        .rw-how-box,
        .rw-modal,
        .rw-popup,
        .rw-toast,
        .rw-settings-panel,
        .rw-api-tos-card,
        .rw-api-tos-dropdown,
        .rw-settings-dropdown,
        .rw-card,
        .rw-box,
        .rw-section,
        .rw-panel,
        [id^="rwph-"][class*="panel"],
        [class^="rwph-"][class*="panel"],
        [class*="rwph-"][class*="panel"],
        [class*="rw-"][class*="panel"]{
          background:
            radial-gradient(circle at 18% 0%, rgba(251,191,36,.17), transparent 32%),
            radial-gradient(circle at 86% 8%, rgba(249,115,22,.10), transparent 30%),
            linear-gradient(180deg, rgba(33,23,20,.99), rgba(11,7,5,.99)) !important;
          border-color: var(--rwph-theme-line) !important;
          color: var(--rwph-theme-text) !important;
          box-shadow: var(--rwph-theme-shadow) !important;
        }

        #rw-payout-helper *,
        #rw-pay-all-panel *,
        .rw-pay-all-panel *,
        .rwph-floating-panel *,
        .rwph-results-loading-panel *,
        .rwph-results-html-panel *,
        .rw-results-panel *,
        .rw-main-panel *,
        .rw-locked-panel *,
        .rw-admin-panel *,
        .rw-help-panel *,
        .rw-payment-panel *,
        .rw-admin-box *,
        .rw-how-box *{
          scrollbar-width: thin !important;
          scrollbar-color: rgba(245,158,11,.78) rgba(15,23,42,.34) !important;
        }

        #rw-payout-helper ::-webkit-scrollbar,
        #rw-pay-all-panel ::-webkit-scrollbar,
        .rw-pay-all-panel ::-webkit-scrollbar,
        .rwph-floating-panel ::-webkit-scrollbar,
        .rwph-results-loading-panel ::-webkit-scrollbar,
        .rwph-results-html-panel ::-webkit-scrollbar,
        .rw-results-panel ::-webkit-scrollbar{width:8px;height:8px;}
        #rw-payout-helper ::-webkit-scrollbar-track,
        #rw-pay-all-panel ::-webkit-scrollbar-track,
        .rw-pay-all-panel ::-webkit-scrollbar-track,
        .rwph-floating-panel ::-webkit-scrollbar-track,
        .rwph-results-loading-panel ::-webkit-scrollbar-track,
        .rwph-results-html-panel ::-webkit-scrollbar-track,
        .rw-results-panel ::-webkit-scrollbar-track{background:rgba(15,23,42,.34);border-radius:999px;}
        #rw-payout-helper ::-webkit-scrollbar-thumb,
        #rw-pay-all-panel ::-webkit-scrollbar-thumb,
        .rw-pay-all-panel ::-webkit-scrollbar-thumb,
        .rwph-floating-panel ::-webkit-scrollbar-thumb,
        .rwph-results-loading-panel ::-webkit-scrollbar-thumb,
        .rwph-results-html-panel ::-webkit-scrollbar-thumb,
        .rw-results-panel ::-webkit-scrollbar-thumb{
          background:linear-gradient(180deg,rgba(245,158,11,.92),rgba(249,115,22,.82));
          border:2px solid rgba(15,23,42,.50);
          border-radius:999px;
        }

        #rw-payout-helper header,
        #rw-payout-helper .rw-header,
        #rw-payout-helper .rw-title,
        #rw-payout-helper .rw-panel-head,
        #rw-payout-helper .rw-tabbar,
        #rw-pay-all-panel .rw-pay-all-head,
        .rw-pay-all-panel .rw-pay-all-head,
        .rwph-floating-panel .rwph-panel-head,
        .rwph-results-loading-panel .rwph-results-loading-head,
        .rwph-results-html-head,
        .rw-admin-box h1,
        .rw-admin-box h2,
        .rw-how-box h1,
        .rw-how-box h2,
        .rw-api-tos-title,
        .rw-settings-dropdown > summary,
        .rw-api-tos-dropdown > summary{
          background:
            linear-gradient(135deg, rgba(58,36,28,.98), rgba(33,23,20,.96)) !important;
          border-color: var(--rwph-theme-line2) !important;
          color: var(--rwph-theme-gold) !important;
        }

        #rw-payout-helper button,
        #rw-payout-helper .rw-button,
        #rw-payout-helper .rw-tab,
        #rw-payout-helper a.btn,
        #rw-pay-all-panel button,
        #rw-pay-all-panel a.btn,
        .rw-pay-all-panel button,
        .rw-pay-all-panel a.btn,
        .rwph-floating-panel button,
        .rwph-floating-panel a.btn,
        .rwph-results-html-panel button,
        .rwph-results-html-panel a.btn,
        .rw-results-panel button,
        .rw-results-panel a.btn,
        .rw-admin-box button,
        .rw-how-box button{
          background: linear-gradient(180deg, rgba(58,36,28,.98), rgba(33,23,20,.94)) !important;
          border-color: var(--rwph-theme-line2) !important;
          color: var(--rwph-theme-text) !important;
          box-shadow:0 10px 22px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.05) !important;
        }

        #rw-payout-helper button:hover,
        #rw-payout-helper .rw-button:hover,
        #rw-payout-helper .rw-tab:hover,
        #rw-payout-helper a.btn:hover,
        #rw-pay-all-panel button:hover,
        #rw-pay-all-panel a.btn:hover,
        .rw-pay-all-panel button:hover,
        .rw-pay-all-panel a.btn:hover,
        .rwph-floating-panel button:hover,
        .rwph-floating-panel a.btn:hover,
        .rwph-results-html-panel button:hover,
        .rwph-results-html-panel a.btn:hover,
        .rw-results-panel button:hover,
        .rw-results-panel a.btn:hover,
        .rw-admin-box button:hover,
        .rw-how-box button:hover{
          filter:brightness(1.12) !important;
          border-color: rgba(251,191,36,.58) !important;
        }

        #rw-payout-helper button.primary,
        #rw-payout-helper .primary,
        #rw-payout-helper .rw-primary,
        #rw-payout-helper .rw-tab.active,
        #rw-payout-helper [aria-selected="true"],
        #rw-pay-all-panel .primary,
        .rw-pay-all-panel .primary,
        .rwph-floating-panel .primary,
        .rwph-results-html-panel .primary,
        .rw-results-panel .primary{
          background:linear-gradient(135deg, rgba(251,191,36,.96), rgba(249,115,22,.90)) !important;
          border-color:rgba(251,191,36,.72) !important;
          color:#1f1308 !important;
        }

        #rw-payout-helper input,
        #rw-payout-helper textarea,
        #rw-payout-helper select,
        #rw-pay-all-panel input,
        #rw-pay-all-panel textarea,
        #rw-pay-all-panel select,
        .rw-pay-all-panel input,
        .rw-pay-all-panel textarea,
        .rw-pay-all-panel select,
        .rwph-floating-panel input,
        .rwph-floating-panel textarea,
        .rwph-floating-panel select,
        .rwph-results-html-panel textarea,
        .rw-results-panel input,
        .rw-results-panel textarea,
        .rw-results-panel select,
        .rw-admin-box input,
        .rw-admin-box textarea,
        .rw-admin-box select,
        .rw-how-box input,
        .rw-how-box textarea,
        .rw-how-box select{
          background:rgba(19,11,7,.88) !important;
          border-color:var(--rwph-theme-line) !important;
          color:var(--rwph-theme-text) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
        }

        #rw-payout-helper input::placeholder,
        #rw-payout-helper textarea::placeholder,
        #rw-pay-all-panel input::placeholder,
        #rw-pay-all-panel textarea::placeholder,
        .rw-pay-all-panel input::placeholder,
        .rw-pay-all-panel textarea::placeholder,
        .rwph-floating-panel input::placeholder,
        .rwph-floating-panel textarea::placeholder,
        .rw-results-panel input::placeholder,
        .rw-results-panel textarea::placeholder{
          color:rgba(207,170,142,.72) !important;
        }

        #rw-payout-helper label,
        #rw-payout-helper .rw-muted,
        #rw-payout-helper .muted,
        #rw-payout-helper small,
        #rw-payout-helper .rw-calc-brief,
        #rw-pay-all-panel .muted,
        .rw-pay-all-panel .muted,
        .rwph-floating-panel .muted,
        .rwph-results-loading-panel .muted,
        .rwph-results-html-note,
        .rwph-results-html-status,
        .rw-results-panel .muted,
        .rw-admin-box .muted,
        .rw-how-box .muted{
          color:var(--rwph-theme-soft) !important;
        }

        #rw-payout-helper h1,
        #rw-payout-helper h2,
        #rw-payout-helper h3,
        #rw-payout-helper .rw-title,
        #rw-payout-helper .rw-section-title,
        #rw-payout-helper .rw-api-tos-title,
        #rw-pay-all-panel h1,
        #rw-pay-all-panel h2,
        .rw-pay-all-panel h1,
        .rw-pay-all-panel h2,
        .rwph-floating-panel h1,
        .rwph-floating-panel h2,
        .rwph-results-loading-panel h1,
        .rwph-results-loading-panel h2,
        .rwph-results-html-title,
        .rwph-results-html-preview-title,
        .rw-results-panel h1,
        .rw-results-panel h2,
        .rw-admin-box h1,
        .rw-admin-box h2,
        .rw-how-box h1,
        .rw-how-box h2{
          color:var(--rwph-theme-gold) !important;
        }

        #rw-payout-helper .card,
        #rw-payout-helper .rw-card,
        #rw-payout-helper .rw-box,
        #rw-payout-helper .rw-section,
        #rw-payout-helper .rw-api-tos-content,
        #rw-payout-helper .rw-calc-brief,
        #rw-payout-helper details,
        #rw-pay-all-panel .rw-pay-all-row,
        .rw-pay-all-panel .rw-pay-all-row,
        .rwph-floating-panel .rw-card,
        .rwph-results-loading-panel .rw-card,
        .rwph-results-html-preview-wrap,
        .rwph-results-html-preview,
        .rw-results-panel .summary-card,
        .rw-results-panel .result-card,
        .rw-admin-box .rw-card,
        .rw-how-box .rw-card{
          background:rgba(43,29,24,.74) !important;
          border-color:var(--rwph-theme-line) !important;
          color:var(--rwph-theme-text) !important;
        }

        #rw-payout-helper .danger,
        #rw-pay-all-panel .danger,
        .rw-pay-all-panel .danger,
        .rwph-floating-panel .danger,
        .rw-results-panel .danger{
          border-color:rgba(248,113,113,.46) !important;
          background:linear-gradient(180deg,rgba(127,29,29,.88),rgba(69,10,10,.88)) !important;
          color:#fee2e2 !important;
        }


        /* v1.1.386: Stronger Basic/Advanced calculation dropdown cards */
        #rw-payout-helper details.rw-per-hit-settings,
        #rw-payout-helper details.rw-points-settings{
          position:relative !important;
          overflow:hidden !important;
          margin:14px 0 !important;
          border-radius:18px !important;
          border:1px solid rgba(251,191,36,.55) !important;
          background:
            radial-gradient(circle at 12% 0%, rgba(251,191,36,.23), transparent 32%),
            linear-gradient(180deg, rgba(58,36,28,.96), rgba(19,11,7,.92)) !important;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.055) inset,
            0 18px 44px rgba(0,0,0,.42),
            0 0 28px rgba(245,158,11,.12) !important;
        }
        #rw-payout-helper details.rw-per-hit-settings::before,
        #rw-payout-helper details.rw-points-settings::before{
          content:"" !important;
          position:absolute !important;
          inset:0 auto 0 0 !important;
          width:6px !important;
          background:linear-gradient(180deg,#fbbf24,#f97316) !important;
          opacity:.95 !important;
          pointer-events:none !important;
        }
        #rw-payout-helper details.rw-points-settings::before{
          background:linear-gradient(180deg,#fb7185,#a78bfa) !important;
        }
        #rw-payout-helper details.rw-per-hit-settings > summary,
        #rw-payout-helper details.rw-points-settings > summary{
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:10px !important;
          min-height:48px !important;
          padding:13px 14px 13px 18px !important;
          border-radius:17px 17px 0 0 !important;
          border-bottom:1px solid rgba(251,191,36,.24) !important;
          background:
            linear-gradient(135deg, rgba(251,191,36,.18), rgba(249,115,22,.10)),
            linear-gradient(180deg, rgba(58,36,28,.98), rgba(33,23,20,.96)) !important;
          color:#fbbf24 !important;
          font-size:14px !important;
          font-weight:1000 !important;
          letter-spacing:.35px !important;
          text-transform:uppercase !important;
          cursor:pointer !important;
        }
        #rw-payout-helper details.rw-per-hit-settings > summary::after,
        #rw-payout-helper details.rw-points-settings > summary::after{
          content:"OPEN SETTINGS" !important;
          flex:0 0 auto !important;
          padding:5px 8px !important;
          border-radius:999px !important;
          border:1px solid rgba(251,191,36,.32) !important;
          background:rgba(2,6,23,.45) !important;
          color:#cfaa8e !important;
          font-size:9px !important;
          font-weight:950 !important;
          letter-spacing:.25px !important;
        }
        #rw-payout-helper details.rw-per-hit-settings[open] > summary::after,
        #rw-payout-helper details.rw-points-settings[open] > summary::after{
          content:"OPEN" !important;
          color:#86efac !important;
          border-color:rgba(34,197,94,.38) !important;
        }
        #rw-payout-helper details.rw-points-settings > summary{
          background:
            linear-gradient(135deg, rgba(251,113,133,.16), rgba(167,139,250,.12)),
            linear-gradient(180deg, rgba(58,36,28,.98), rgba(33,23,20,.96)) !important;
          color:#fda4af !important;
        }
        #rw-payout-helper details.rw-per-hit-settings .rw-api-tos-content,
        #rw-payout-helper details.rw-points-settings .rw-api-tos-content{
          padding:13px !important;
          background:
            linear-gradient(180deg, rgba(33,23,20,.72), rgba(11,7,5,.68)) !important;
        }
        #rw-payout-helper details.rw-per-hit-settings label,
        #rw-payout-helper details.rw-points-settings label,
        #rw-payout-helper details.rw-per-hit-settings .rw-calc-brief,
        #rw-payout-helper details.rw-points-settings .rw-calc-brief,
        #rw-payout-helper details.rw-per-hit-settings .rw-compact-check-grid,
        #rw-payout-helper details.rw-points-settings .rw-compact-check-grid,
        #rw-payout-helper details.rw-per-hit-settings .rw-cache-tools,
        #rw-payout-helper details.rw-points-settings .rw-cache-tools{
          background:rgba(43,29,24,.66) !important;
          border:1px solid rgba(251,191,36,.16) !important;
          border-radius:13px !important;
          padding:9px !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.035) !important;
        }
        #rw-payout-helper details.rw-per-hit-settings .rw-primary-calc-actions,
        #rw-payout-helper details.rw-points-settings .rw-primary-calc-actions{
          border:1px solid rgba(251,191,36,.24) !important;
          background:rgba(19,11,7,.72) !important;
          border-radius:15px !important;
          padding:10px !important;
        }


        .rwph-panel-theme-picker{
          position:fixed!important;
          z-index:2147483647!important;
          left:50%!important;
          top:50%!important;
          transform:translate(-50%,-50%)!important;
          width:min(560px,calc(100vw - 20px))!important;
          max-height:calc(100vh - 24px)!important;
          overflow:auto!important;
          padding:12px!important;
          border-radius:22px!important;
          border:1px solid var(--rwph-theme-line2)!important;
          box-sizing:border-box!important;
        }
        .rwph-panel-theme-picker-head{
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          gap:10px!important;
          padding:10px 12px!important;
          border-radius:16px!important;
          border:1px solid var(--rwph-theme-line2)!important;
          cursor:move!important;
          user-select:none!important;
          touch-action:none!important;
          color:var(--rwph-theme-gold)!important;
          font:950 14px/1.2 Arial,Helvetica,sans-serif!important;
          text-transform:uppercase!important;
          letter-spacing:.35px!important;
        }
        .rwph-panel-theme-picker-body{
          display:grid!important;
          gap:10px!important;
          padding:10px 2px 2px!important;
        }
        .rwph-panel-theme-current{
          padding:9px 10px!important;
          border-radius:13px!important;
          border:1px solid var(--rwph-theme-line)!important;
          background:rgba(2,6,23,.28)!important;
          color:var(--rwph-theme-soft)!important;
          text-align:center!important;
          font:850 11px/1.35 Arial,Helvetica,sans-serif!important;
        }
        .rwph-panel-theme-current b{color:var(--rwph-theme-gold)!important;}
        .rwph-panel-theme-grid{
          display:grid!important;
          grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important;
          gap:8px!important;
        }
        .rwph-theme-choice{
          display:flex!important;
          align-items:center!important;
          justify-content:flex-start!important;
          gap:8px!important;
          min-height:42px!important;
          border-radius:13px!important;
          padding:8px 10px!important;
          font:900 11px/1.2 Arial,Helvetica,sans-serif!important;
          text-align:left!important;
        }
        .rwph-theme-swatch{
          flex:0 0 24px!important;
          width:24px!important;
          height:24px!important;
          border-radius:999px!important;
          border:1px solid rgba(255,255,255,.28)!important;
          box-shadow:0 0 12px rgba(255,255,255,.12)!important;
        }

        #rw-payout-helper .success,
        #rw-pay-all-panel .success,
        .rw-pay-all-panel .success,
        .rwph-floating-panel .success,
        .rw-results-panel .success{
          border-color:rgba(34,197,94,.46) !important;
          background:linear-gradient(180deg,rgba(20,83,45,.88),rgba(5,46,22,.88)) !important;
          color:#dcfce7 !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {
      console.warn("RWPH unified panel theme failed:", e);
    }
  }


  rwphInjectUnifiedPanelThemeV1375();
  rwphApplyPanelThemeChoice();
  setTimeout(rwphRestoreResultsLoadingPanelAfterRefresh, 450);

})();
