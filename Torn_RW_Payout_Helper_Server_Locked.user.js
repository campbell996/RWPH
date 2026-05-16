// ==UserScript==
// @name         Ranked War Payout Helper - Server Locked
// @namespace    https://chatgpt.com/
// @version      1.1.51
// @description  Server-side locked Torn ranked-war payout helper. Backend verifies license and calculates payouts.
// @license      Copyright BackFromTheDead_Gaming Campbell. All Rights Reserved. Personal use only. Redistribution, resale, or modified reposting is not permitted without permission.
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  // Change this after hosting your backend online.
  const PAYWALL_API_BASE = "https://gooey-eagle-rentable.ngrok-free.dev";

  const STORAGE_KEY = "rw_payout_helper_api_key";
  const PAYWALL_TOKEN_STORAGE_KEY = "rw_payout_helper_license_token";
  const LAUNCHER_CORNER_STORAGE_KEY = "rw_payout_helper_launcher_corner";
  const ADMIN_KEY_STORAGE_KEY = "rw_payout_helper_admin_key";
  const PENDING_PAYMENT_STORAGE_KEY = "rw_payout_helper_pending_payment";
  const XANAX_PAYMENT_HELPER_STORAGE_KEY = "rw_payout_helper_xanax_payment_helper";
  const PENDING_PAYMENT_TTL_MS = 10 * 60 * 1000;
  const LAUNCHER_CORNERS = ["bottom-right", "bottom-left", "top-left", "top-right"];
  const ADD_BALANCE_ALL_DELAY_MS = 1500;
  const PAYMENT_ITEM_ID = "206";
  const PAYMENT_ITEM_NAME = "Xanax";
  const PAYMENT_RECEIVER_NAME = "Evil_Panda_420";
  const PAYMENT_RECEIVER_ID = "3236276";
  const PAYMENT_RECEIVER_TEXT = `${PAYMENT_RECEIVER_NAME} [${PAYMENT_RECEIVER_ID}]`;

  let lastRows = [];
  let lastSummary = {};

  function money(n) {
    return "$" + Math.round(Number(n || 0)).toLocaleString();
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

    const pending = {
      code: String(result.code),
      instructions: String(result.instructions || ""),
      tornId: result.tornId ? String(result.tornId) : "",
      name: result.name ? String(result.name) : "",
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + PENDING_PAYMENT_TTL_MS,
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

      if (Date.now() > Number(pending.expiresAtMs)) {
        clearPendingPayment();
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

  function saveXanaxPaymentHelper(code) {
    if (!code) return;
    const payload = {
      code: String(code),
      receiverId: PAYMENT_RECEIVER_ID,
      receiverName: PAYMENT_RECEIVER_NAME,
      receiverText: PAYMENT_RECEIVER_TEXT,
      itemId: PAYMENT_ITEM_ID,
      itemName: PAYMENT_ITEM_NAME,
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + PENDING_PAYMENT_TTL_MS,
    };
    GM_setValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, JSON.stringify(payload));
  }

  function getXanaxPaymentHelper() {
    try {
      const raw = GM_getValue(XANAX_PAYMENT_HELPER_STORAGE_KEY, "");
      if (!raw) return null;
      const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!payload || !payload.code || !payload.expiresAtMs) return null;
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

  function openXanaxPaymentPage(code) {
    sessionStorage.removeItem("rwph_xanax_helper_closed");
    saveXanaxPaymentHelper(code);
    copyText(`Send ${PAYMENT_ITEM_NAME} to ${PAYMENT_RECEIVER_TEXT} with message: ${code}`).catch(() => false);
    const url = buildXanaxPaymentUrl(code);

    try {
      if (typeof GM_openInTab === "function") {
        GM_openInTab(url, {
          active: true,
          insert: true,
          setParent: true,
        });
        return true;
      }
    } catch (e) {
      console.warn("GM_openInTab failed for payment helper:", e);
    }

    const tab = window.open(url, "_blank", "noopener,noreferrer");
    return !!tab;
  }

  function renderPaymentCodeCard(code, minutesLeftText = "Saved for 10 minutes.") {
    const safeCode = esc(code || "");
    return `
      <div class="rw-payment-card">
        <div class="rw-payment-title">Payment Code Ready</div>
        <div class="rw-payment-instruction">Send <b>1x or more ${esc(PAYMENT_ITEM_NAME)}</b> to:</div>
        <div class="rw-payment-recipient">${esc(PAYMENT_RECEIVER_TEXT)}</div>
        <div class="rw-payment-instruction">Use this exact message:</div>
        <div class="rw-payment-code">${safeCode}</div>
        <div class="rw-payment-note">${esc(minutesLeftText)} The helper can open your items page and try to prefill the ${esc(PAYMENT_ITEM_NAME)} send form. You still review and press Send yourself.</div>
        <button type="button" data-open-xanax-payment="${safeCode}">Open ${esc(PAYMENT_ITEM_NAME)} Send Page</button>
      </div>`;
  }

  function updatePendingPaymentUi() {
    const pending = getPendingPayment();
    const btn = document.getElementById("rw-check-payment");
    const codeBox = document.getElementById("rw-paywall-code");
    const status = document.getElementById("rw-paywall-status");

    if (btn) {
      if (pending) {
        btn.textContent = "Check Payment (Saved)";
        btn.title = `Saved payment code: ${pending.code}. Expires in about ${pendingPaymentMinutesLeft(pending)} minute(s).`;
      } else {
        btn.textContent = "Check Payment";
        btn.title = "";
      }
    }

    if (codeBox && pending) {
      codeBox.innerHTML = renderPaymentCodeCard(
        pending.code,
        `Saved payment code. Expires in about ${pendingPaymentMinutesLeft(pending)} minute(s).`
      );
    }

    if (status && pending && !String(status.textContent || "").trim().startsWith("Send ")) {
      status.textContent = pending.instructions || "Saved payment code found. Send the item, then click Check Payment (Saved).";
    }
  }


  function launcherCornerLabel(corner) {
    return String(corner || "bottom-right")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function getLauncherCorner() {
    const saved = GM_getValue(LAUNCHER_CORNER_STORAGE_KEY, "bottom-right");
    return LAUNCHER_CORNERS.includes(saved) ? saved : "bottom-right";
  }

  function setLauncherCorner(corner) {
    GM_setValue(LAUNCHER_CORNER_STORAGE_KEY, corner);
    updateLauncherButtonPosition();
  }

  function getLauncherPositionStyle(corner) {
    const base = {
      position: "fixed",
      zIndex: "999998",
      width: "42px",
      height: "36px",
      padding: "0 5px",
      borderRadius: "10px",
      border: "1px solid rgba(209, 166, 99, .78)",
      background: "linear-gradient(180deg, rgba(94,30,21,.98) 0%, rgba(129,42,27,.98) 18%, rgba(63,25,18,.98) 18.5%, rgba(34,28,26,.98) 100%)",
      color: "#fff4de",
      boxShadow: "0 0 0 1px rgba(255,255,255,.06) inset, 0 -6px 0 rgba(210,165,92,.12) inset, 0 0 14px rgba(177,63,37,.16), 0 18px 34px rgba(0,0,0,.62)",
      font: "800 10px Arial, sans-serif",
      letterSpacing: ".3px",
      textShadow: "0 1px 0 rgba(0,0,0,.55), 0 0 10px rgba(255,188,102,.18)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      backdropFilter: "blur(8px)",
      overflow: "hidden",
    };

    if (corner.includes("bottom")) {
      base.bottom = corner === "bottom-right" ? "92px" : "18px";
    } else {
      base.top = "90px";
    }

    if (corner.includes("right")) {
      base.right = "18px";
    } else {
      base.left = "18px";
    }

    return base;
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

  function updateLauncherButtonPosition() {
    const btn = document.getElementById("rw-payout-launcher");
    if (!btn) return;

    const corner = getLauncherCorner();
    applyStyle(btn, getLauncherPositionStyle(corner));
    btn.title = `Open Ranked War Payout Helper (${launcherCornerLabel(corner)})`;
  }

  function setLauncherOpenState(isOpen) {
    const btn = document.getElementById("rw-payout-launcher");
    if (!btn) return;
    btn.textContent = isOpen ? "×" : "RWPH";
    btn.title = isOpen ? "Close Ranked War Payout Helper" : "Open Ranked War Payout Helper";
  }

  function createLauncherButton() {
    if (document.getElementById("rw-payout-launcher")) return;

    const btn = document.createElement("button");
    btn.id = "rw-payout-launcher";
    btn.type = "button";
    btn.textContent = "RWPH";
    btn.setAttribute("aria-label", "Open Ranked War Payout Helper");
    btn.addEventListener("click", togglePanel);

    document.body.appendChild(btn);
    updateLauncherButtonPosition();
  }

  function cycleLauncherCorner() {
    const current = getLauncherCorner();
    const index = LAUNCHER_CORNERS.indexOf(current);
    const next = LAUNCHER_CORNERS[(index + 1) % LAUNCHER_CORNERS.length];
    setLauncherCorner(next);

    const status = document.getElementById("rw-status") || document.getElementById("rw-paywall-status");
    if (status) {
      status.textContent = `Panel button moved to ${launcherCornerLabel(next)}.`;
    }
  }

  function attachMoveLauncherButton() {
    const btn = document.getElementById("rw-move-launcher");
    if (!btn) return;

    btn.addEventListener("click", cycleLauncherCorner);
    btn.textContent = `Move Button Corner (${launcherCornerLabel(getLauncherCorner())})`;
  }

  function closePanel() {
    const panel = document.getElementById("rw-payout-helper");
    if (panel) panel.remove();
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
      GM_xmlhttpRequest({
        method: "POST",
        url: `${PAYWALL_API_BASE}${path}`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(body || {}),
        timeout: 120000,
        onload: (res) => {
          try {
            const json = JSON.parse(res.responseText || "{}");
            if (!json.ok) {
              reject(new Error(json.error || `Server error ${res.status}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Could not parse server response. Status ${res.status}.`));
          }
        },
        onerror: () => reject(new Error("Failed to reach paywall server.")),
        ontimeout: () => reject(new Error("Paywall server request timed out.")),
      });
    });
  }


  function adminRequest(method, path, adminKey, body = {}) {
    return new Promise((resolve, reject) => {
      const isGet = String(method).toUpperCase() === "GET";
      const url = isGet
        ? `${PAYWALL_API_BASE}${path}?adminKey=${encodeURIComponent(adminKey)}`
        : `${PAYWALL_API_BASE}${path}`;

      GM_xmlhttpRequest({
        method,
        url,
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        data: isGet ? undefined : JSON.stringify({ ...(body || {}), adminKey }),
        timeout: 120000,
        onload: (res) => {
          try {
            const json = JSON.parse(res.responseText || "{}");

            if (!json.ok) {
              reject(new Error(json.error || `Admin server error ${res.status}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Could not parse admin server response. Status ${res.status}.`));
          }
        },
        onerror: () => reject(new Error("Failed to reach admin server.")),
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
      statusEl.textContent =
        `Admin key saved. Owner license granted to ${result.name || "Owner"} ` +
        `(${result.tornId}) until ${formatUnixDate(result.expiresAt)}.`;
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
      statusEl.textContent =
        `Extended license for ${result.name || name} (${result.tornId || tornId}) by ${result.days || days} day(s).` +
        previousText +
        ` New expiry: ${formatUnixDate(result.expiresAt)}.`;
    }

    return result;
  }

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
                <button class="secondary rw-admin-fill-revoke" data-torn-id="${esc(license.tornId || "")}" style="margin:0;padding:5px 8px;">Fill Revoke</button>
              </div>
            </div>
            <div class="rw-muted" style="margin-top:6px;">
              Expires: ${esc(formatUnixDate(license.expiresAt))}<br>
              ${license.manualGrant ? "Manual grant" : "Payment/license record"}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }


  async function getSavedLicenseInfo() {
    const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
    const userKey =
      document.getElementById("rw-key")?.value.trim() ||
      document.getElementById("rw-paywall-key")?.value.trim() ||
      GM_getValue(STORAGE_KEY, "");

    if (!token && !userKey) {
      return { valid: false, error: "No saved license token or Torn API key found. Start payment or paste your Torn API key first." };
    }

    try {
      const result = await apiPost("/api/paywall/verify-token", { token, userKey });
      if (result.valid && result.token) GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
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
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  async function showLicenseDays(statusEl) {
    const info = await getSavedLicenseInfo();

    if (!info.valid) {
      statusEl.textContent = "License check: " + (info.error || "No valid saved license found.");
      return false;
    }

    statusEl.textContent =
      `License active for ${info.name || "this user"} (${info.tornId || "unknown"}). ` +
      `Time left: ${formatLicenseDaysLeft(info.expiresAt)}. Expires: ${formatUnixDate(info.expiresAt)}.`;
    return true;
  }

  async function verifySavedLicense() {
    const info = await getSavedLicenseInfo();
    return !!info.valid;
  }

  function panelBaseCss() {
    return `
      #rw-payout-helper {
        position: fixed;
        z-index: 999999;
        right: 18px;
        top: 90px;
        width: 300px;
        max-height: 78vh;
        overflow: visible;
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
      #rw-payout-helper .rw-results-panel .rw-head { cursor: default; }
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
      #rw-payout-helper .rw-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-top:9px; }
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
    `;
  }

  function renderRows(rows, summary) {
    if (!rows || !rows.length) return `<div class="rw-muted">No payable attacks found.</div>`;

    return `
      <div class="rw-summary">
        <b>Total payout:</b> ${money(summary?.totalPayout || 0)}<br>
        <b>Total weight:</b> ${Number(summary?.totalWeight || 0).toFixed(2)} |
        <b>Hits:</b> ${Number(summary?.totalHits || 0)} |
        <b>Assists:</b> ${Number(summary?.totalAssists || 0)}<br>
        <b>Fetched attacks:</b> ${Number(summary?.attacksFetched || 0)} |
        <b>Member names loaded:</b> ${Number(summary?.nameCount || 0)}
        <div class="rw-actions">
          <button class="secondary" data-open-add-balance-all="1">Add Balance (All)</button>
          <button class="secondary" data-export-csv="1">Export CSV</button>
          <button class="secondary" data-create-newsletter="1">Create HTML Newsletter</button>
        </div>
      </div>
      <div class="rw-card-list">
        ${rows.map((r, index) => {
          const name = r.name || `Unknown ${r.id}`;
          const id = r.id || "unknown";
          const attacks = Number(r.attacks || 0);
          const assists = Number(r.assists || 0);
          const weight = Number(r.weight || 0);
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
                <div class="rw-stat-box"><div class="rw-stat-label">Hits</div><div class="rw-stat-value">${attacks}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Assists</div><div class="rw-stat-value">${assists}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Weight</div><div class="rw-stat-value">${weight.toFixed(2)}</div></div>
                <div class="rw-stat-box"><div class="rw-stat-label">Respect</div><div class="rw-stat-value">${respect.toFixed(2)}</div></div>
              </div>
              <div class="rw-actions">
                <button class="secondary" data-fill-add-balance="${esc(buildFactionAddBalanceUrl(id, payout))}">Add Balance</button>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }

  function buildPayoutText(rows) {
    return (rows || [])
      .map((r, index) => {
        const payout = Math.round(Number(r.payout || 0));
        const id = String(r.id || "unknown");
        const name = r.name || `Unknown ${id}`;
        return `${index + 1}. ${name} [${id}] — ${money(payout)} — RW payout`;
      })
      .join("\n");
  }

  function buildFactionAddBalanceUrl(id, payout) {
    const safeId = encodeURIComponent(String(id || ""));
    const safePayout = encodeURIComponent(String(Math.max(0, Math.round(Number(payout || 0)))));
    return `https://www.torn.com/factions.php?step=your#/tab=controls&addMoneyTo=${safeId}&money=${safePayout}`;
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

  function buildWarPayoutNewsletterHtml(rows, summary) {
    const list = (rows || []).map((r, index) => ({
      rank: index + 1,
      id: String(r.id || "unknown"),
      name: r.name || `Unknown ${r.id || "unknown"}`,
      attacks: safeNumber(r.attacks),
      assists: safeNumber(r.assists),
      respect: safeNumber(r.respect),
      weight: safeNumber(r.weight),
      payout: safeNumber(r.payout),
    }));

    const totalPayout = safeNumber(summary?.totalPayout) || list.reduce((sum, r) => sum + r.payout, 0);
    const totalHits = safeNumber(summary?.totalHits) || list.reduce((sum, r) => sum + r.attacks, 0);
    const totalAssists = safeNumber(summary?.totalAssists) || list.reduce((sum, r) => sum + r.assists, 0);
    const totalWeight = safeNumber(summary?.totalWeight) || list.reduce((sum, r) => sum + r.weight, 0);
    const totalRespect = list.reduce((sum, r) => sum + r.respect, 0);
    const maxPayout = Math.max(1, ...list.map((r) => r.payout));
    const maxWeight = Math.max(1, ...list.map((r) => r.weight));
    const generatedAt = new Date().toLocaleString();
    const chartRows = [...list].sort((a, b) => b.payout - a.payout).slice(0, 25);

    const statCard = (label, value, sub = "") => `
      <div class="stat-card">
        <div class="stat-label">${esc(label)}</div>
        <div class="stat-value">${esc(value)}</div>
        ${sub ? `<div class="stat-sub">${esc(sub)}</div>` : ""}
      </div>`;

    const chartHtml = chartRows.map((r) => {
      const payoutWidth = Math.max(3, Math.min(100, (r.payout / maxPayout) * 100));
      const weightWidth = Math.max(3, Math.min(100, (r.weight / maxWeight) * 100));
      return `
        <div class="chart-row">
          <div class="chart-name">
            <strong>${esc(r.rank)}. ${esc(r.name)}</strong>
            <span>${esc(r.id)} · ${esc(money(r.payout))} · ${esc(percent(r.payout, totalPayout))}</span>
          </div>
          <div class="bar-wrap" title="Payout share">
            <div class="bar payout" style="width:${payoutWidth.toFixed(2)}%"></div>
          </div>
          <div class="bar-wrap weight-wrap" title="Weighted contribution">
            <div class="bar weight" style="width:${weightWidth.toFixed(2)}%"></div>
          </div>
        </div>`;
    }).join("");

    const tableRows = list.map((r) => `
      <tr>
        <td>${r.rank}</td>
        <td><strong>${esc(r.name)}</strong><br><span class="muted">${esc(r.id)}</span></td>
        <td class="num">${r.attacks}</td>
        <td class="num">${r.assists}</td>
        <td class="num">${r.respect.toFixed(2)}</td>
        <td class="num">${r.weight.toFixed(2)}</td>
        <td class="num strong">${esc(money(r.payout))}</td>
        <td class="num">${esc(percent(r.payout, totalPayout))}</td>
      </tr>`).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ranked War Payout Newsletter</title>
  <style>
    :root {
      --bg:#151211;
      --panel:#211b18;
      --panel2:#30221d;
      --line:#7c5034;
      --gold:#d8aa6a;
      --bronze:#b85d35;
      --red:#7a271e;
      --text:#fff4e8;
      --muted:#d0aa8e;
      --green:#7dd082;
    }
    * { box-sizing:border-box; }
    body {
      margin:0;
      font-family: Arial, Helvetica, sans-serif;
      color:var(--text);
      background:
        radial-gradient(circle at 15% 0%, rgba(184,93,53,.24), transparent 28%),
        radial-gradient(circle at 85% 0%, rgba(216,170,106,.16), transparent 24%),
        linear-gradient(180deg, #141110, #211916 45%, #12100f);
      padding:22px;
    }
    .newsletter {
      max-width:1050px;
      margin:0 auto;
      border:1px solid rgba(216,170,106,.28);
      border-radius:22px;
      overflow:hidden;
      box-shadow:0 24px 70px rgba(0,0,0,.45), inset 0 0 0 4px rgba(122,39,30,.18);
      background:linear-gradient(180deg, rgba(33,27,24,.98), rgba(22,19,18,.98));
    }
    .hero {
      padding:28px 30px;
      background:
        linear-gradient(90deg, rgba(122,39,30,.95), rgba(184,93,53,.86), rgba(122,39,30,.95));
      border-bottom:4px solid rgba(216,170,106,.75);
    }
    .eyebrow { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#ffe7c2; font-weight:800; }
    h1 { margin:6px 0 8px; font-size:34px; line-height:1.05; }
    .subtitle { color:#ffe9d6; font-size:14px; }
    .content { padding:24px; }
    .stats { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:22px; }
    .stat-card {
      border:1px solid rgba(216,170,106,.22);
      background:linear-gradient(180deg, rgba(48,34,29,.95), rgba(30,25,23,.95));
      border-radius:16px;
      padding:14px;
    }
    .stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.8px; font-weight:800; }
    .stat-value { font-size:22px; font-weight:900; margin-top:3px; color:#fff8ef; }
    .stat-sub { margin-top:3px; font-size:11px; color:var(--muted); }
    .section {
      margin-top:22px;
      padding:18px;
      border:1px solid rgba(216,170,106,.20);
      border-radius:18px;
      background:linear-gradient(180deg, rgba(33,27,24,.92), rgba(24,21,20,.92));
    }
    h2 { margin:0 0 14px; font-size:20px; }
    .chart-key { display:flex; gap:16px; color:var(--muted); font-size:12px; margin-bottom:14px; }
    .key-dot { display:inline-block; width:10px; height:10px; border-radius:999px; margin-right:5px; }
    .key-dot.payout { background:var(--gold); }
    .key-dot.weight { background:var(--bronze); }
    .chart-row { margin:10px 0 14px; }
    .chart-name { display:flex; justify-content:space-between; gap:12px; font-size:12px; margin-bottom:4px; }
    .chart-name span { color:var(--muted); text-align:right; }
    .bar-wrap { height:12px; border-radius:999px; background:rgba(0,0,0,.35); overflow:hidden; border:1px solid rgba(216,170,106,.10); }
    .bar-wrap.weight-wrap { height:7px; margin-top:3px; opacity:.9; }
    .bar { height:100%; border-radius:999px; }
    .bar.payout { background:linear-gradient(90deg, var(--gold), #ffe0a3); }
    .bar.weight { background:linear-gradient(90deg, var(--red), var(--bronze)); }
    table { width:100%; border-collapse:collapse; overflow:hidden; border-radius:14px; }
    th, td { padding:10px 9px; border-bottom:1px solid rgba(216,170,106,.12); font-size:12px; vertical-align:middle; }
    th { color:#ffe5bf; text-align:left; background:rgba(122,39,30,.35); text-transform:uppercase; font-size:10px; letter-spacing:.8px; }
    tr:nth-child(even) td { background:rgba(255,255,255,.025); }
    .num { text-align:right; white-space:nowrap; }
    .strong { color:#ffdfbf; font-weight:900; }
    .muted { color:var(--muted); font-size:11px; }
    .footer { padding:14px 24px 22px; color:var(--muted); font-size:11px; text-align:center; }
    @media (max-width:760px) {
      body { padding:10px; }
      .stats { grid-template-columns:1fr; }
      .chart-name { display:block; }
      .chart-name span { display:block; text-align:left; margin-top:2px; }
      th, td { font-size:11px; padding:7px 5px; }
      h1 { font-size:26px; }
    }
  </style>
</head>
<body>
  <main class="newsletter">
    <header class="hero">
      <div class="eyebrow">Ranked War Payout Helper</div>
      <h1>Ranked War Payout Newsletter</h1>
      <div class="subtitle">Generated ${esc(generatedAt)} · ${list.length} paid members</div>
    </header>
    <section class="content">
      <div class="stats">
        ${statCard("Total Payout", money(totalPayout), `${list.length} members paid`)}
        ${statCard("Total Hits", String(totalHits), `${totalAssists} assists`)}
        ${statCard("Total Weight", totalWeight.toFixed(2), `${totalRespect.toFixed(2)} total respect`)}
        ${statCard("Fetched Attacks", String(safeNumber(summary?.attacksFetched)), "from server calculation")}
        ${statCard("Names Loaded", String(safeNumber(summary?.nameCount)), "member name matches")}
        ${statCard("Average Payout", money(list.length ? totalPayout / list.length : 0), "per paid member")}
      </div>

      <section class="section">
        <h2>Payout Chart</h2>
        <div class="chart-key">
          <span><i class="key-dot payout"></i>Payout amount</span>
          <span><i class="key-dot weight"></i>Weighted contribution</span>
        </div>
        ${chartHtml || `<div class="muted">No chart data available.</div>`}
      </section>

      <section class="section">
        <h2>Detailed Payout Table</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th class="num">Hits</th>
              <th class="num">Assists</th>
              <th class="num">Respect</th>
              <th class="num">Weight</th>
              <th class="num">Payout</th>
              <th class="num">Share</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </section>
    </section>
    <footer class="footer">Created with Ranked War Payout Helper. Review payouts before sending faction funds.</footer>
  </main>
</body>
</html>`;
  }

  function createHtmlNewsletter(rows, summary) {
    const html = buildWarPayoutNewsletterHtml(rows, summary || {});
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `ranked-war-payout-newsletter-${stamp}.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Download still happens below if preview is blocked.
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return filename;
  }

  function openAddBalanceTab(url, active = true) {
    try {
      if (typeof GM_openInTab === "function") {
        GM_openInTab(url, {
          active,
          insert: true,
          setParent: true,
        });
        return true;
      }
    } catch {
      // Fall back to normal window.open below.
    }

    const tab = window.open(url, "_blank", "noopener,noreferrer");
    return !!tab;
  }

  function setupXanaxPaymentButtonHandler() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-open-xanax-payment]");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const code = btn.getAttribute("data-open-xanax-payment") || "";
      if (!code) return alert("No payment code found. Click Start Payment again.");
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
    el.focus?.();
    el.click?.();

    try {
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc?.set) desc.set.call(el, value);
      else el.value = value;
    } catch {
      el.value = value;
    }

    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: value, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
    return true;
  }

  function rwphSendHelperSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function rwphSendHelperPanelStatus(message, isError = false) {
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
        max-width: 360px;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(224, 171, 96, .45);
        background: linear-gradient(180deg, rgba(55,28,23,.98), rgba(24,21,20,.98));
        color: #fff2dd;
        font: 12px Arial, sans-serif;
        line-height: 1.4;
        box-shadow: 0 14px 34px rgba(0,0,0,.45), 0 0 20px rgba(181,84,38,.18);
      `;
      document.body.appendChild(box);
    }

    box.style.borderColor = isError ? "rgba(255,90,90,.65)" : "rgba(224,171,96,.45)";
    box.innerHTML = message;
  }

  function rwphNodeMeta(el) {
    if (!el) return "";
    const attrs = ["id", "class", "name", "placeholder", "aria-label", "title", "data-item", "data-itemid", "data-id", "href", "src", "alt", "value"];
    return attrs.map((a) => String(el.getAttribute?.(a) || "")).join(" ").toLowerCase();
  }

  function rwphLooksLikeXanax(el) {
    if (!el) return false;
    const txt = rwphSendHelperText(el);
    const meta = rwphNodeMeta(el);
    return txt.includes("xanax") || meta.includes("xanax") || meta.includes(`item${PAYMENT_ITEM_ID}`) || meta.includes(`item_id=${PAYMENT_ITEM_ID}`) || meta.includes(`itemid=${PAYMENT_ITEM_ID}`) || meta.includes(`item=${PAYMENT_ITEM_ID}`) || meta.includes(`id=${PAYMENT_ITEM_ID}`);
  }

  function rwphBestContainer(el) {
    if (!el) return null;
    return el.closest?.("li, tr, [class*='item'], [class*='row'], [class*='wrap'], [class*='cont'], [class*='drug'], [class*='inventory'], [data-item], [data-itemid]") || el;
  }

  function rwphAllClickable(scope = document) {
    return Array.from(scope.querySelectorAll("button, a, input[type='button'], input[type='submit'], [role='button'], [onclick], [class*='button'], [class*='btn']"))
      .filter(rwphSendHelperVisible);
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

  function rwphFindXanaxContainer() {
    const exactNodes = Array.from(document.querySelectorAll("*"))
      .filter(rwphSendHelperVisible)
      .filter(rwphLooksLikeXanax);

    const containers = [];
    for (const node of exactNodes) {
      const c = rwphBestContainer(node);
      if (c && !containers.includes(c)) containers.push(c);
    }

    containers.sort((a, b) => {
      const at = rwphSendHelperText(a).length;
      const bt = rwphSendHelperText(b).length;
      return at - bt;
    });

    return containers[0] || exactNodes[0] || null;
  }

  function rwphFindXanaxSendOpenControl() {
    // Manual-only safety mode: do not search for or auto-open Torn's "Send this item" controls.
    return null;
  }

  function rwphFindXanaxClickable() {
    // Manual-only safety mode: users must click their Xanax item themselves.
    return null;
  }

  function rwphFindItemSearchField() {
    const fields = Array.from(document.querySelectorAll("input[type='text'], input[type='search'], input:not([type])"))
      .filter(rwphSendHelperVisible)
      .filter((el) => {
        const meta = `${el.placeholder || ""} ${el.name || ""} ${el.id || ""} ${el.className || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
        return meta.includes("search") || meta.includes("filter") || meta.includes("item");
      });
    return fields[0] || null;
  }

  function rwphPressEnter(el) {
    if (!el) return;
    ["keydown", "keypress", "keyup"].forEach((type) => {
      el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: "Enter", code: "Enter", which: 13, keyCode: 13 }));
    });
  }

  async function rwphSearchForXanaxIfPossible() {
    // Manual-only safety mode: do not search/filter/click Torn inventory automatically.
    return false;
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
    el.focus?.();
    el.click?.();
    el.textContent = String(value ?? "");
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: value, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  async function rwphOpenMessageBox(panel) {
    // Manual-only safety mode: users must click "Add Message" themselves.
    return !!rwphFindMessageField(panel || document);
  }

  async function rwphClickOpenXanaxSendPanel() {
    // Manual-only safety mode: do not auto-click Xanax or "Send this item".
    return rwphFindLikelySendPanel();
  }

  async function rwphFillXanaxSendForm(paymentCode) {
    // Manual-only safety mode: never auto-open the send form or fill it automatically.
    await copyText(paymentCode).catch(() => false);
    return {
      ok: false,
      error: "Auto-open and auto-fill are disabled. Manually open Xanax > Send this item > Add Message, then use Copy Receiver and Copy Code."
    };
  }


  async function rwphFillVisiblePaymentFields(paymentCode) {
    // Manual-only safety mode: do not bulk-fill fields.
    await copyText(paymentCode).catch(() => false);
    return { ok: false, filledUser: false, filledMessage: false };
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
    const left = Math.max(0, Math.ceil(((getXanaxPaymentHelper()?.expiresAtMs || Date.now()) - Date.now()) / 60000));
    return `
      <button id="rwph-close-helper" type="button" title="Close" style="position:absolute;top:7px;right:8px;width:22px;height:22px;border-radius:999px;border:1px solid rgba(224,171,96,.36);background:rgba(0,0,0,.28);color:#fff2dd;font-weight:900;line-height:18px;cursor:pointer;padding:0;">×</button>
      <div style="font-weight:900;font-size:13px;margin:0 28px 6px 0;color:#fff2dd;">RWPH Xanax Payment Helper</div>
      <div style="margin-bottom:6px;${isError ? 'color:#ffb4a8;' : ''}">${message}</div>
      <div style="padding:8px;border-radius:9px;background:rgba(0,0,0,.22);margin:7px 0;">
        <div><b>Item:</b> ${esc(PAYMENT_ITEM_NAME)}</div>
        <div><b>Send to:</b> ${esc(PAYMENT_RECEIVER_TEXT)}</div>
        <div><b>Message:</b> <span style="font-weight:900;color:#ffe3bd;">${esc(code)}</span></div>
        <div style="font-size:11px;color:#cfaa8e;margin-top:4px;">Saved for about ${left} minute(s).</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
        <button id="rwph-copy-receiver" type="button" style="padding:7px;border-radius:8px;border:1px solid rgba(224,171,96,.4);background:#5f1a13;color:#fff2dd;font-weight:800;cursor:pointer;">Copy Receiver</button>
        <button id="rwph-copy-code" type="button" style="padding:7px;border-radius:8px;border:1px solid rgba(224,171,96,.4);background:#5f1a13;color:#fff2dd;font-weight:800;cursor:pointer;">Copy Code</button>
      </div>
      <div style="font-size:11px;color:#cfaa8e;margin-top:8px;line-height:1.35;">
        Manual-safe mode: manually click your Xanax item, click <b>Send this item</b>, then click <b>Add Message</b>. After the fields are visible, use <b>Copy Receiver</b> and <b>Copy Code</b> to paste/copy the details. You choose the amount yourself and manually click Send/Confirm.
      </div>
    `;
  }

  function rwphRenderPaymentHelperPanel(code, message, isError = false) {
    rwphSendHelperPanelStatus(rwphPaymentHelperHtml(code, message, isError), isError);
  }

  function rwphSetupPaymentHelperPanelClicks(code) {
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
        const res = await rwphPasteReceiverIntoOpenForm();
        if (res.ok) {
          rwphRenderPaymentHelperPanel(currentCode, `Receiver pasted into the User ID field: <b>${esc(PAYMENT_RECEIVER_TEXT)}</b>. Review before sending.`);
        } else {
          rwphRenderPaymentHelperPanel(currentCode, esc(res.error), true);
        }
      }

      if (target.id === "rwph-copy-code") {
        e.preventDefault();
        const res = await rwphPastePaymentCodeIntoOpenForm(currentCode);
        if (res.ok) {
          rwphRenderPaymentHelperPanel(currentCode, "Payment code pasted into the message field. Review before sending.");
        } else {
          rwphRenderPaymentHelperPanel(currentCode, esc(res.error), true);
        }
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
    const code = params.get("rwphCode") || getXanaxPaymentHelper()?.code || "";
    if (!code) return;

    saveXanaxPaymentHelper(code);
    rwphSetupPaymentHelperPanelClicks(code);
    await copyText(code).catch(() => false);
    rwphRenderPaymentHelperPanel(
      code,
      `Payment helper loaded. Auto-open, auto-fill, and auto-send are disabled. The payment code has been copied as a fallback. Manually open your <b>${esc(PAYMENT_ITEM_NAME)}</b>, click <b>Send this item</b>, then click <b>Add Message</b>. After the fields are visible, use the two buttons below.`
    );
  }

  function renderPayoutQueue(rows) {
    if (!rows || !rows.length) {
      return `<div class="rw-muted">No payout queue available yet. Calculate results first.</div>`;
    }

    const total = rows.reduce((sum, r) => sum + Math.round(Number(r.payout || 0)), 0);

    return `
      <div class="rw-summary">
        <b>Faction Balance Payout Queue</b><br>
        Each member button opens Torn faction controls with <b>Add to balance</b> prefilled. You still review it, then click Add Money and Confirm in Torn.<br>
        <b>Queue total:</b> ${money(total)} | <b>Members:</b> ${rows.length}
        <div class="rw-actions">
          <button class="secondary" data-copy-all-payouts="1">Copy All Payouts</button>
          <button class="secondary" data-open-profile="https://www.torn.com/factions.php?step=your#/tab=controls">Open Faction Controls</button>
        </div>
      </div>
      <div class="rw-card-list">
        ${rows.map((r, index) => {
          const id = String(r.id || "unknown");
          const name = r.name || `Unknown ${id}`;
          const payout = Math.round(Number(r.payout || 0));
          const url = buildFactionAddBalanceUrl(id, payout);

          return `
            <div class="rw-result-card">
              <div class="rw-result-top">
                <div class="rw-result-player">
                  <div class="rw-result-name">${index + 1}. ${esc(name)}</div>
                  <div class="rw-result-id">Torn ID: ${esc(id)}</div>
                </div>
                <div class="rw-result-payout">${money(payout)}</div>
              </div>
              <div class="rw-actions">
                <button class="secondary" data-fill-add-balance="${esc(url)}">Add Balance</button>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }

  function downloadCSV(rows) {
    if (!rows.length) return alert("No payout rows to export yet.");

    const header = ["Torn ID", "Name", "Hits", "Assists", "Weight", "Respect", "Payout"];
    const body = rows.map((r) => [
      r.id,
      r.name,
      r.attacks,
      r.assists,
      Number(r.weight || 0).toFixed(2),
      Number(r.respect || 0).toFixed(2),
      Math.round(Number(r.payout || 0)),
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "torn-rw-payouts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function makeDraggable(panel) {
    const head = panel.querySelector(".rw-head");
    if (!head) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startTop = 0;

    head.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startRight = Number.parseInt(getComputedStyle(panel).right, 10);
      startTop = Number.parseInt(getComputedStyle(panel).top, 10);
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.right = `${startRight - dx}px`;
      panel.style.top = `${Math.max(10, startTop + dy)}px`;
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  function showPaywallScreen(panel) {
    const savedKey = GM_getValue(STORAGE_KEY, "");
    const savedAdminKey = GM_getValue(ADMIN_KEY_STORAGE_KEY, "");

    panel.innerHTML = `
      <style>${panelBaseCss()}</style>
      <div class="rw-head">
        <span>Ranked War Payout Helper - Locked</span>
        <button id="rw-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
      </div>
      <div class="rw-body">
        <div class="rw-small">
          This version is server-locked. The backend verifies your license and performs the payout calculation server-side.
        </div>

        <div class="rw-tabs">
          <button id="rw-paywall-tab-pay" class="rw-tab-btn active">Unlock</button>
          <button id="rw-paywall-tab-admin" class="rw-tab-btn secondary">Admin</button>
          <button id="rw-paywall-tab-how" class="rw-tab-btn secondary">Help</button>
        </div>

        <div id="rw-paywall-unlock-section" class="rw-tab-section">
          <label>Your Torn API Key -Limited Access-
            <input id="rw-paywall-key" type="password" value="${esc(savedKey)}" placeholder="Paste your Torn API key">
          </label>
          <div class="rw-actions">
            <button id="rw-start-payment">Start Payment</button>
            <button id="rw-free-trial" class="secondary">2 Day Free Trial</button>
            <button id="rw-check-payment" class="secondary">Check Payment</button>
            <button id="rw-check-license-days" class="secondary">Your Expiration</button>
            <button id="rw-move-launcher" class="secondary">Move Button Corner</button>
          </div>
          <div id="rw-paywall-status" class="rw-muted">Enter your key and click Start Payment.</div>
          <div id="rw-paywall-code"></div>
        </div>

        <div id="rw-paywall-admin-section" class="rw-tab-section" hidden>
          <div class="rw-admin-box">
            <div class="rw-small">
              Admin tools are available here even while the helper is locked. Keep your admin key private.
            </div>

            <label>Admin Key
              <input id="rw-admin-key" type="password" value="${esc(savedAdminKey)}" placeholder="Paste ADMIN_KEY from your .env">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-save-key" class="secondary">Save Admin Key</button>
              <button id="rw-admin-list">List Licenses</button>
              <button id="rw-move-launcher-admin" class="secondary">Move Button Corner</button>
            </div>
          </div>

          <div class="rw-admin-box">
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
              <button id="rw-admin-revoke" class="danger">Revoke License</button>
            </div>
          </div>

          <div id="rw-admin-status" class="rw-muted">Admin tools ready.</div>
          <div id="rw-admin-results"></div>
        </div>

                <div id="rw-paywall-how-section" class="rw-tab-section" hidden>

          <div class="rw-how-box">
            <div class="rw-how-title">All Features</div>
            <p class="rw-how-intro">Ranked War Payout Helper is a server-side locked payout tool for Torn ranked wars. The userscript shows the panel, but the important checks and calculations happen on your backend server.</p>
            <ul class="rw-how-list">
              <li class="rw-feature-group">Server-side protection</li>
              <li><b>Server-side license checks:</b> trials, payments, admin actions, expiration checks, and payout calculations all go through your backend.</li>
              <li><b>No server, no unlock:</b> if the backend is offline, ngrok is closed, or PAYWALL_API_BASE is wrong, users cannot unlock, claim trials, check payments, check expiration, or calculate payouts.</li>
              <li><b>Harder to bypass:</b> removing the visible paywall from Tampermonkey does not unlock the protected calculation routes. The server still rejects unlicensed users.</li>
              <li><b>Backend database:</b> the server stores licenses, trial claims, payment codes, and payment records in paywall-db.json.</li>

              <li class="rw-feature-group">Panel and layout</li>
              <li><b>RWPH launcher:</b> opens the helper from a small button on Torn.</li>
              <li><b>Move Button Corner:</b> moves the launcher between screen corners and saves the chosen position.</li>
              <li><b>Ranked-war theme:</b> compact dark faction-banner styling made to fit Torn.</li>

              <li class="rw-feature-group">Unlocking access</li>
              <li><b>Locked screen:</b> users can unlock with a paid license, a 2 day free trial, or an admin-granted license.</li>
              <li><b>2 Day Free Trial:</b> each Torn account can claim one server-side trial. Clearing Tampermonkey storage does not reset it.</li>
              <li><b>Start Payment:</b> generates a unique payment code for that user.</li>
              <li><b>Saved payment code:</b> unused payment codes stay saved locally for 10 minutes so Check Payment can reuse them.</li>
              <li><b>Xanax payment:</b> Each Xanax you send to Evil_Panda_420 [3236276] will add 15 days to your licence. Also make sure to add the exact payment code as the message.</li>
              <li><b>Check Payment:</b> asks the backend to check the owner account for the correct item and matching message, then grants the license if found.</li>
              <li><b>Your Expiration:</b> shows who the license belongs to, how much time is left, and the expiry date/time.</li>

              <li class="rw-feature-group">Xanax payment helper</li>
              <li><b>RWPH Xanax Payment Helper:</b> opens Torn items and shows a helper box for the payment step.</li>
              <li><b>Copy Receiver:</b> copies or pastes Evil_Panda_420 [3236276] into the open User ID field.</li>
              <li><b>Copy Code:</b> copies or pastes the payment code into the open Add Message field.</li>
              <li><b>Safe send flow:</b> the helper does not click final Send or Confirm. Users must review the item, amount, receiver, and message before sending.</li>

              <li class="rw-feature-group">War payout calculator</li>
              <li><b>Auto-fill War Times:</b> fills the current or most recently finished ranked war times where available.</li>
              <li><b>Manual war times:</b> users can set exact start and finish date/time manually.</li>
              <li><b>Total payout pool:</b> enter the full amount to split between members.</li>
              <li><b>Normal hit weight:</b> controls how much regular attacks count toward payout share.</li>
              <li><b>Assist weight:</b> controls how much assists count. Default is 0.</li>
              <li><b>Ranked-war filtering:</b> option to count only attacks flagged as ranked-war attacks.</li>
              <li><b>Chain-hit fallback:</b> option to include chain hits if the ranked-war flag is missing.</li>
              <li><b>Fetch + Calculate:</b> verifies the license, fetches Torn data, calculates server-side, and returns payout results.</li>
              <li><b>Member result cards:</b> show member name, Torn ID, payout amount, attacks, assists, respect, and weighted score.</li>

              <li class="rw-feature-group">Payout actions and exports</li>
              <li><b>Add Balance:</b> opens Torn faction controls in a new tab with that member and payout amount prefilled.</li>
              <li><b>Add Balance (All):</b> opens every member's prefilled Add Balance tab one at a time from one button press.</li>
              <li><b>Manual confirmation:</b> Add Balance prepares the Torn page only. It does not automatically send faction money.</li>
              <li><b>Export CSV:</b> downloads a spreadsheet-friendly payout file with member IDs, names, stats, weights, and payouts.</li>
              <li><b>Create HTML Newsletter:</b> creates a styled war payout report with totals, averages, chart-style payout section, and full member table.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How Users Unlock Access</div>
            <ul class="rw-how-list">
              <li>Install Tampermonkey and the latest Ranked War Payout Helper userscript.</li>
              <li>Open Torn and click the RWPH launcher button.</li>
              <li>Paste a Torn API key into the locked screen.</li>
              <li>Use either <b>2 Day Free Trial</b> or <b>Start Payment</b>.</li>
              <li>For payment, send 1x or more Xanax to Evil_Panda_420 [3236276] with the exact payment code as the message.</li>
              <li>Click <b>Check Payment</b>. If the server finds the matching item and message, the panel unlocks.</li>
              <li>Click <b>Your Expiration</b> anytime to check how long is left.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How To Calculate Payouts</div>
            <ul class="rw-how-list">
              <li>Unlock the helper first. The backend will not calculate without a valid license.</li>
              <li>Paste the user's Torn API key in the Payout tab.</li>
              <li>Click <b>Auto-fill War Times</b>, or manually set the war start/end times.</li>
              <li>Enter the total payout pool.</li>
              <li>Adjust hit and assist weights if needed.</li>
              <li>Click <b>Fetch + Calculate</b>.</li>
              <li>Review every member result before paying anyone.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How To Pay Members</div>
            <ul class="rw-how-list">
              <li>Use <b>Add Balance</b> on a member card to open that member's prefilled faction controls page.</li>
              <li>Use <b>Add Balance (All)</b> to open every member's prefilled page one at a time.</li>
              <li>Review the member, amount, and faction controls page before confirming.</li>
              <li>The helper never sends faction money by itself. Final payment stays under your control inside Torn.</li>
            </ul>
          </div>

          <div class="rw-how-box">
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">Troubleshooting</div>
            <ul class="rw-how-list">
              <li><b>Failed to fetch:</b> backend server is offline, ngrok is closed, or PAYWALL_API_BASE is wrong.</li>
              <li><b>Cannot unlock:</b> check the user's API key, exact payment code, receiver, item, and backend console.</li>
              <li><b>Cannot calculate:</b> check license status, API key access, war times, and server health.</li>
              <li><b>Add Balance tabs blocked:</b> allow popups/tabs for Torn, or use each member's Add Balance button one by one.</li>
              <li><b>Xanax helper will not paste:</b> manually paste the copied receiver and code after opening Send this item and Add Message.</li>
              <li><b>Server test:</b> open your backend URL plus /health. If /health fails, the userscript cannot work online.</li>
            </ul>
          </div>
      </div>
      <div id="rw-results-panel" class="rw-results-panel" hidden>
        <div class="rw-head">
          <span>Fetch + Calculate Results</span>
          <button id="rw-results-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
        </div>
        <div class="rw-body">
          <div id="rw-results"></div>
        </div>
      </div>`;

    makeDraggable(panel);
    attachMoveLauncherButton();
    document.getElementById("rw-move-launcher-admin").addEventListener("click", cycleLauncherCorner);
    document.getElementById("rw-close").addEventListener("click", closePanel);

    const payTabBtn = document.getElementById("rw-paywall-tab-pay");
    const adminTabBtn = document.getElementById("rw-paywall-tab-admin");
    const howTabBtn = document.getElementById("rw-paywall-tab-how");
    const paySection = document.getElementById("rw-paywall-unlock-section");
    const adminSection = document.getElementById("rw-paywall-admin-section");
    const howSection = document.getElementById("rw-paywall-how-section");

    function switchLockedTab(tabName) {
      const showAdmin = tabName === "admin";
      const showHow = tabName === "how";
      paySection.hidden = showAdmin || showHow;
      adminSection.hidden = !showAdmin;
      howSection.hidden = !showHow;
      payTabBtn.classList.toggle("active", !showAdmin && !showHow);
      payTabBtn.classList.toggle("secondary", showAdmin || showHow);
      adminTabBtn.classList.toggle("active", showAdmin);
      adminTabBtn.classList.toggle("secondary", !showAdmin);
      howTabBtn.classList.toggle("active", showHow);
      howTabBtn.classList.toggle("secondary", !showHow);
    }

    payTabBtn.addEventListener("click", () => switchLockedTab("unlock"));
    adminTabBtn.addEventListener("click", () => switchLockedTab("admin"));
    howTabBtn.addEventListener("click", () => switchLockedTab("how"));

    document.getElementById("rw-start-payment").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      const codeBox = document.getElementById("rw-paywall-code");
      const userKey = document.getElementById("rw-paywall-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");

      try {
        GM_setValue(STORAGE_KEY, userKey);
        status.textContent = "Creating payment code...";
        codeBox.innerHTML = "";

        const result = await apiPost("/api/paywall/start", { userKey });
        if (result.alreadyPaid && result.token) {
          clearPendingPayment();
          GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
          status.textContent = "Existing license found. Loading tool...";
          closePanel();
          createPanel();
          return;
        }

        savePendingPayment(result);
        status.textContent = result.instructions || "Payment code created.";
        codeBox.innerHTML = renderPaymentCodeCard(result.code, "Saved for 10 minutes. Use Check Payment (Saved) after sending.");
        updatePendingPaymentUi();
      } catch (e) {
        status.textContent = "Payment start error: " + e.message;
      }
    });

    document.getElementById("rw-free-trial").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      const codeBox = document.getElementById("rw-paywall-code");
      const userKey = document.getElementById("rw-paywall-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");

      if (!confirm("Start your 2 day free trial? This can only be used once per Torn account.")) return;

      try {
        GM_setValue(STORAGE_KEY, userKey);
        clearPendingPayment();
        updatePendingPaymentUi();
        status.textContent = "Activating 2 day free trial...";
        codeBox.innerHTML = "";

        const result = await apiPost("/api/paywall/trial", { userKey });
        if (!result.token) throw new Error(result.message || "Trial did not return a license token.");

        GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
        status.textContent = `${result.message || "2 day free trial activated."} Loading tool...`;
        closePanel();
        createPanel();
      } catch (e) {
        status.textContent = "Free trial error: " + e.message;
      }
    });

    document.getElementById("rw-check-payment").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      const userKey = document.getElementById("rw-paywall-key").value.trim();
      if (!userKey) return alert("Enter your Torn API key first.");

      try {
        GM_setValue(STORAGE_KEY, userKey);
        const pending = getPendingPayment();
        status.textContent = pending
          ? `Checking payment for saved code ${pending.code}...`
          : "Checking payment...";
        const result = await apiPost("/api/paywall/check", { userKey });

        if (!result.paid) {
          status.textContent = result.error || "Payment not found yet.";
          updatePendingPaymentUi();
          return;
        }

        clearPendingPayment();
        GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, result.token);
        status.textContent = "Unlocked. Loading tool...";
        closePanel();
        createPanel();
      } catch (e) {
        status.textContent = "Payment check error: " + e.message;
        updatePendingPaymentUi();
      }
    });

    updatePendingPaymentUi();
    setInterval(updatePendingPaymentUi, 30000);

    document.getElementById("rw-check-license-days").addEventListener("click", async () => {
      const status = document.getElementById("rw-paywall-status");
      status.textContent = "Checking saved license...";
      await showLicenseDays(status);
    });

    function getAdminKeyFromInput() {
      const adminKey = document.getElementById("rw-admin-key").value.trim();
      if (!adminKey) throw new Error("Enter your admin key first.");
      return adminKey;
    }

    async function refreshAdminLicenses() {
      const status = document.getElementById("rw-admin-status");
      const results = document.getElementById("rw-admin-results");
      const adminKey = getAdminKeyFromInput();

      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading licenses from server...";
      results.innerHTML = "";

      const result = await adminRequest("GET", "/api/admin/licenses", adminKey);
      results.innerHTML = renderAdminLicenses(result.licenses || []);
      status.textContent = `Loaded ${(result.licenses || []).length} license(s).`;

      results.querySelectorAll(".rw-admin-fill-revoke").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("rw-admin-torn-id").value = btn.dataset.tornId || "";
          document.getElementById("rw-admin-status").textContent = `Filled Torn ID ${btn.dataset.tornId || ""} for revoke/grant.`;
        });
      });
    }

    document.getElementById("rw-admin-save-key").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = document.getElementById("rw-admin-key").value.trim();
        if (!adminKey) return alert("Enter your admin key first.");

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = "Admin key saved. Granting owner 10,000 day license...";

        await grantOwnerLicenseFromAdminKey(adminKey, status);
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin key saved, but owner license grant failed: " + e.message;
      }
    });

    document.getElementById("rw-admin-list").addEventListener("click", async () => {
      try {
        await refreshAdminLicenses();
      } catch (e) {
        document.getElementById("rw-admin-status").textContent = "Admin list error: " + e.message;
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

        status.textContent = `Granted license to ${result.name || name} (${result.tornId || tornId}) until ${formatUnixDate(result.expiresAt)}.`;
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin grant error: " + e.message;
      }
    });

    document.getElementById("rw-admin-extend").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await extendAdminLicenseFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin extend error: " + e.message;
      }
    });

    document.getElementById("rw-admin-revoke").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = getAdminKeyFromInput();
        const tornId = document.getElementById("rw-admin-torn-id").value.trim();

        if (!tornId) return alert("Enter the player's Torn ID.");
        if (!confirm(`Revoke license for Torn ID ${tornId}?`)) return;

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = `Revoking license for Torn ID ${tornId}...`;

        await adminRequest("POST", "/api/admin/revoke", adminKey, { tornId });

        status.textContent = `Revoked license for Torn ID ${tornId}.`;
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin revoke error: " + e.message;
      }
    });
  }


  function showMainScreen(panel) {
    const savedKey = GM_getValue(STORAGE_KEY, "");
    const savedAdminKey = GM_getValue(ADMIN_KEY_STORAGE_KEY, "");
    const current = Math.floor(Date.now() / 1000);
    const twoDaysAgo = current - 172800;

    panel.innerHTML = `
      <style>${panelBaseCss()}</style>
      <div class="rw-head">
        <span>Ranked War Payout Helper</span>
        <button id="rw-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
      </div>
      <div class="rw-body">
        <div class="rw-small">
          Server-side locked version. Your backend verifies the license and calculates payouts.
        </div>

        <div class="rw-tabs">
          <button id="rw-tab-payout" class="rw-tab-btn active">Payout</button>
          <button id="rw-tab-admin" class="rw-tab-btn secondary">Admin</button>
          <button id="rw-tab-how" class="rw-tab-btn secondary">Help</button>
        </div>

        <div id="rw-payout-tab" class="rw-tab-section">
          <label>API Key
            <input id="rw-key" type="password" value="${esc(savedKey)}" placeholder="Paste Torn API key">
          </label>
          <div class="rw-row">
            <label>War start date/time
              <input id="rw-from" type="datetime-local" value="${toDateTimeLocalValue(twoDaysAgo)}">
            </label>
            <label>War end date/time
              <input id="rw-to" type="datetime-local" value="${toDateTimeLocalValue(current)}">
            </label>
          </div>
          <div class="rw-actions">
            <button id="rw-autofill" class="secondary">Auto-fill War Times</button>
          </div>
          <label>Total payout pool
            <input id="rw-total" type="number" value="100000000" min="0">
          </label>
          <div class="rw-row">
            <label>Normal hit weight
              <input id="rw-hit-weight" type="number" value="1" step="0.1">
            </label>
            <label>Assist weight
              <input id="rw-assist-weight" type="number" value="0" step="0.1">
            </label>
          </div>
          <label><input id="rw-only" type="checkbox" checked> Count ranked-war flagged attacks only</label>
          <label><input id="rw-chain" type="checkbox" checked> Include chain hits if ranked-war flag is missing</label>
          <div class="rw-actions">
            <button id="rw-run">Fetch + Calculate</button>
            <button id="rw-save" class="secondary">Save Key</button>
            <button id="rw-license-days" class="secondary">Your Expiration</button>
            <button id="rw-move-launcher" class="secondary">Move Button Corner</button>
            <button id="rw-lock" class="secondary">Lock/Reset License</button>
          </div>
          <div id="rw-status" class="rw-muted">Ready.</div>
          <div id="rw-results-placeholder" class="rw-muted">Results will open in a separate results panel after Fetch + Calculate.</div>
        </div>

        <div id="rw-admin-tab-section" class="rw-tab-section" hidden>
          <div class="rw-admin-box">
            <div class="rw-small">
              Admin tools call your backend directly. Keep your admin key private.
            </div>

            <label>Admin Key
              <input id="rw-admin-key" type="password" value="${esc(savedAdminKey)}" placeholder="Paste ADMIN_KEY from your .env">
            </label>

            <div class="rw-actions">
              <button id="rw-admin-save-key" class="secondary">Save Admin Key</button>
              <button id="rw-admin-list">List Licenses</button>
            </div>
          </div>

          <div class="rw-admin-box">
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
              <button id="rw-admin-revoke" class="danger">Revoke License</button>
            </div>
          </div>

          <div id="rw-admin-status" class="rw-muted">Admin tools ready.</div>
          <div id="rw-admin-results"></div>
        </div>

                <div id="rw-how-tab-section" class="rw-tab-section" hidden>

          <div class="rw-how-box">
            <div class="rw-how-title">All Features</div>
            <p class="rw-how-intro">Ranked War Payout Helper is a server-side locked payout tool for Torn ranked wars. The userscript shows the panel, but the important checks and calculations happen on your backend server.</p>
            <ul class="rw-how-list">
              <li class="rw-feature-group">Server-side protection</li>
              <li><b>Server-side license checks:</b> trials, payments, admin actions, expiration checks, and payout calculations all go through your backend.</li>
              <li><b>No server, no unlock:</b> if the backend is offline, ngrok is closed, or PAYWALL_API_BASE is wrong, users cannot unlock, claim trials, check payments, check expiration, or calculate payouts.</li>
              <li><b>Harder to bypass:</b> removing the visible paywall from Tampermonkey does not unlock the protected calculation routes. The server still rejects unlicensed users.</li>
              <li><b>Backend database:</b> the server stores licenses, trial claims, payment codes, and payment records in paywall-db.json.</li>

              <li class="rw-feature-group">Panel and layout</li>
              <li><b>RWPH launcher:</b> opens the helper from a small button on Torn.</li>
              <li><b>Move Button Corner:</b> moves the launcher between screen corners and saves the chosen position.</li>
              <li><b>Ranked-war theme:</b> compact dark faction-banner styling made to fit Torn.</li>

              <li class="rw-feature-group">Unlocking access</li>
              <li><b>Locked screen:</b> users can unlock with a paid license, a 2 day free trial, or an admin-granted license.</li>
              <li><b>2 Day Free Trial:</b> each Torn account can claim one server-side trial. Clearing Tampermonkey storage does not reset it.</li>
              <li><b>Start Payment:</b> generates a unique payment code for that user.</li>
              <li><b>Saved payment code:</b> unused payment codes stay saved locally for 10 minutes so Check Payment can reuse them.</li>
              <li><b>Xanax payment:</b> Each Xanax you send to Evil_Panda_420 [3236276] will add 15 days to your licence. Also make sure to add the exact payment code as the message.</li>
              <li><b>Check Payment:</b> asks the backend to check the owner account for the correct item and matching message, then grants the license if found.</li>
              <li><b>Your Expiration:</b> shows who the license belongs to, how much time is left, and the expiry date/time.</li>

              <li class="rw-feature-group">Xanax payment helper</li>
              <li><b>RWPH Xanax Payment Helper:</b> opens Torn items and shows a helper box for the payment step.</li>
              <li><b>Copy Receiver:</b> copies or pastes Evil_Panda_420 [3236276] into the open User ID field.</li>
              <li><b>Copy Code:</b> copies or pastes the payment code into the open Add Message field.</li>
              <li><b>Safe send flow:</b> the helper does not click final Send or Confirm. Users must review the item, amount, receiver, and message before sending.</li>

              <li class="rw-feature-group">War payout calculator</li>
              <li><b>Auto-fill War Times:</b> fills the current or most recently finished ranked war times where available.</li>
              <li><b>Manual war times:</b> users can set exact start and finish date/time manually.</li>
              <li><b>Total payout pool:</b> enter the full amount to split between members.</li>
              <li><b>Normal hit weight:</b> controls how much regular attacks count toward payout share.</li>
              <li><b>Assist weight:</b> controls how much assists count. Default is 0.</li>
              <li><b>Ranked-war filtering:</b> option to count only attacks flagged as ranked-war attacks.</li>
              <li><b>Chain-hit fallback:</b> option to include chain hits if the ranked-war flag is missing.</li>
              <li><b>Fetch + Calculate:</b> verifies the license, fetches Torn data, calculates server-side, and returns payout results.</li>
              <li><b>Member result cards:</b> show member name, Torn ID, payout amount, attacks, assists, respect, and weighted score.</li>

              <li class="rw-feature-group">Payout actions and exports</li>
              <li><b>Add Balance:</b> opens Torn faction controls in a new tab with that member and payout amount prefilled.</li>
              <li><b>Add Balance (All):</b> opens every member's prefilled Add Balance tab one at a time from one button press.</li>
              <li><b>Manual confirmation:</b> Add Balance prepares the Torn page only. It does not automatically send faction money.</li>
              <li><b>Export CSV:</b> downloads a spreadsheet-friendly payout file with member IDs, names, stats, weights, and payouts.</li>
              <li><b>Create HTML Newsletter:</b> creates a styled war payout report with totals, averages, chart-style payout section, and full member table.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How Users Unlock Access</div>
            <ul class="rw-how-list">
              <li>Install Tampermonkey and the latest Ranked War Payout Helper userscript.</li>
              <li>Open Torn and click the RWPH launcher button.</li>
              <li>Paste a Torn API key into the locked screen.</li>
              <li>Use either <b>2 Day Free Trial</b> or <b>Start Payment</b>.</li>
              <li>For payment, send 1x or more Xanax to Evil_Panda_420 [3236276] with the exact payment code as the message.</li>
              <li>Click <b>Check Payment</b>. If the server finds the matching item and message, the panel unlocks.</li>
              <li>Click <b>Your Expiration</b> anytime to check how long is left.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How To Calculate Payouts</div>
            <ul class="rw-how-list">
              <li>Unlock the helper first. The backend will not calculate without a valid license.</li>
              <li>Paste the user's Torn API key in the Payout tab.</li>
              <li>Click <b>Auto-fill War Times</b>, or manually set the war start/end times.</li>
              <li>Enter the total payout pool.</li>
              <li>Adjust hit and assist weights if needed.</li>
              <li>Click <b>Fetch + Calculate</b>.</li>
              <li>Review every member result before paying anyone.</li>
            </ul>
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">How To Pay Members</div>
            <ul class="rw-how-list">
              <li>Use <b>Add Balance</b> on a member card to open that member's prefilled faction controls page.</li>
              <li>Use <b>Add Balance (All)</b> to open every member's prefilled page one at a time.</li>
              <li>Review the member, amount, and faction controls page before confirming.</li>
              <li>The helper never sends faction money by itself. Final payment stays under your control inside Torn.</li>
            </ul>
          </div>

          <div class="rw-how-box">
          </div>

          <div class="rw-how-box">
            <div class="rw-how-title">Troubleshooting</div>
            <ul class="rw-how-list">
              <li><b>Failed to fetch:</b> backend server is offline, ngrok is closed, or PAYWALL_API_BASE is wrong.</li>
              <li><b>Cannot unlock:</b> check the user's API key, exact payment code, receiver, item, and backend console.</li>
              <li><b>Cannot calculate:</b> check license status, API key access, war times, and server health.</li>
              <li><b>Add Balance tabs blocked:</b> allow popups/tabs for Torn, or use each member's Add Balance button one by one.</li>
              <li><b>Xanax helper will not paste:</b> manually paste the copied receiver and code after opening Send this item and Add Message.</li>
              <li><b>Server test:</b> open your backend URL plus /health. If /health fails, the userscript cannot work online.</li>
            </ul>
          </div>
      </div>
      <div id="rw-results-panel" class="rw-results-panel" hidden>
        <div class="rw-head">
          <span>Fetch + Calculate Results</span>
          <button id="rw-results-close" class="danger" style="margin:0;padding:4px 8px;">×</button>
        </div>
        <div class="rw-body">
          <div id="rw-results"></div>
        </div>
      </div>`;

    makeDraggable(panel);
    attachMoveLauncherButton();

    const payoutTabBtn = document.getElementById("rw-tab-payout");
    const adminTabBtn = document.getElementById("rw-tab-admin");
    const howTabBtn = document.getElementById("rw-tab-how");
    const payoutTab = document.getElementById("rw-payout-tab");
    const adminTab = document.getElementById("rw-admin-tab-section");
    const howTab = document.getElementById("rw-how-tab-section");

    function switchTab(tabName) {
      const showAdmin = tabName === "admin";
      const showHow = tabName === "how";
      payoutTab.hidden = showAdmin || showHow;
      adminTab.hidden = !showAdmin;
      howTab.hidden = !showHow;
      payoutTabBtn.classList.toggle("active", !showAdmin && !showHow);
      payoutTabBtn.classList.toggle("secondary", showAdmin || showHow);
      adminTabBtn.classList.toggle("active", showAdmin);
      adminTabBtn.classList.toggle("secondary", !showAdmin);
      howTabBtn.classList.toggle("active", showHow);
      howTabBtn.classList.toggle("secondary", !showHow);
    }

    payoutTabBtn.addEventListener("click", () => switchTab("payout"));
    adminTabBtn.addEventListener("click", () => switchTab("admin"));
    howTabBtn.addEventListener("click", () => switchTab("how"));

    document.getElementById("rw-close").addEventListener("click", closePanel);

    document.getElementById("rw-save").addEventListener("click", () => {
      const key = document.getElementById("rw-key").value.trim();
      GM_setValue(STORAGE_KEY, key);
      document.getElementById("rw-status").textContent = "API key saved locally.";
    });

    const legacyCsvBtn = document.getElementById("rw-csv");
    if (legacyCsvBtn) legacyCsvBtn.addEventListener("click", () => downloadCSV(lastRows));

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

    document.getElementById("rw-payout-helper").addEventListener("click", (e) => {
      const status = document.getElementById("rw-status");
      const exportCsvBtn = e.target.closest("[data-export-csv]");

      if (exportCsvBtn) {
        if (!lastRows.length) return alert("Calculate results first.");
        downloadCSV(lastRows);
        if (status) status.textContent = "CSV exported from the results panel.";
        return;
      }

      const newsletterBtn = e.target.closest("[data-create-newsletter]");

      if (newsletterBtn) {
        if (!lastRows.length) return alert("Calculate results first.");

        try {
          const filename = createHtmlNewsletter(lastRows, lastSummary);
          status.textContent = `HTML newsletter created: ${filename}. A preview tab should open and the file should download.`;
        } catch (err) {
          status.textContent = "Newsletter error: " + err.message;
        }
        return;
      }

      const openAllBtn = e.target.closest("[data-open-add-balance-all]");

      if (openAllBtn) {
        if (!lastRows.length) return alert("Calculate results first.");

        const payableRows = lastRows.filter((r) => Math.round(Number(r.payout || 0)) > 0 && r.id);
        if (!payableRows.length) return alert("No payable members to open.");

        const confirmed = confirm(
          `Open ${payableRows.length} Add Balance tabs one at a time?

` +
          `One tab will open every ${ADD_BALANCE_ALL_DELAY_MS / 1000} seconds. ` +
          "Each tab will be prefilled only. You still need to review, click Add Money, and confirm in Torn."
        );
        if (!confirmed) return;

        openAllBtn.disabled = true;
        openAllBtn.textContent = "Opening...";

        let index = 0;
        let opened = 0;
        let blocked = 0;

        const openNext = () => {
          if (index >= payableRows.length) {
            openAllBtn.disabled = false;
            openAllBtn.textContent = "Add Balance (All)";
            status.textContent = blocked
              ? `Finished. Opened ${opened}/${payableRows.length} Add Balance tabs. ${blocked} may have been blocked by your browser.`
              : `Finished. Opened ${opened}/${payableRows.length} Add Balance tabs one at a time.`;
            return;
          }

          const r = payableRows[index];
          const payout = Math.round(Number(r.payout || 0));
          const label = `${r.name || `Torn ID ${r.id}`} — ${money(payout)}`;
          const url = buildFactionAddBalanceUrl(r.id, payout);
          const ok = openAddBalanceTab(url, index === 0);

          if (ok) opened += 1;
          else blocked += 1;

          status.textContent = `Opening Add Balance ${index + 1}/${payableRows.length}: ${label}`;
          index += 1;

          setTimeout(openNext, ADD_BALANCE_ALL_DELAY_MS);
        };

        openNext();
        return;
      }

      const fillAddBalanceBtn = e.target.closest("[data-fill-add-balance]");
      if (!fillAddBalanceBtn) return;

      const url = fillAddBalanceBtn.getAttribute("data-fill-add-balance");

      status.textContent = "Opening a new tab with Add Balance prefilled. Review before clicking Add Money and Confirm.";
      openAddBalanceTab(url, true);
    });

    document.getElementById("rw-license-days").addEventListener("click", async () => {
      const status = document.getElementById("rw-status");
      status.textContent = "Checking saved license...";
      await showLicenseDays(status);
    });

    document.getElementById("rw-lock").addEventListener("click", () => {
      GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, "");
      closePanel();
      createPanel();
    });

    document.getElementById("rw-autofill").addEventListener("click", async () => {
      const status = document.getElementById("rw-status");
      const userKey = document.getElementById("rw-key").value.trim();
      const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");
      if (!userKey) return alert("Enter your Torn API key first.");

      try {
        GM_setValue(STORAGE_KEY, userKey);
        status.textContent = "Asking server for current or most recently finished ranked war...";
        const result = await apiPost("/api/calc/war-times", { userKey, token });
        const war = result.war;
        document.getElementById("rw-from").value = toDateTimeLocalValue(war.start);
        document.getElementById("rw-to").value = toDateTimeLocalValue(war.end);
        const type = war.isActive ? "current active war" : "most recently finished war";
        status.textContent = `Auto-filled ${type}: ${readableTime(war.start)} to ${readableTime(war.end)}.`;
      } catch (e) {
        status.textContent = "Auto-fill error: " + e.message;
      }
    });

    document.getElementById("rw-run").addEventListener("click", async () => {
      const status = document.getElementById("rw-status");
      const results = document.getElementById("rw-results");
      const userKey = document.getElementById("rw-key").value.trim();
      const token = GM_getValue(PAYWALL_TOKEN_STORAGE_KEY, "");

      const from = dateTimeLocalToUnix(document.getElementById("rw-from").value);
      const to = dateTimeLocalToUnix(document.getElementById("rw-to").value);
      const totalPayout = Number(document.getElementById("rw-total").value);
      const hitWeight = Number(document.getElementById("rw-hit-weight").value);
      const assistWeight = Number(document.getElementById("rw-assist-weight").value);
      const rwOnly = document.getElementById("rw-only").checked;
      const includeChainHits = document.getElementById("rw-chain").checked;

      if (!userKey) return alert("Enter your Torn API key.");
      if (!from || !to || to <= from) return alert("Enter a valid start/end date and time.");
      if (totalPayout <= 0) return alert("Enter a payout pool greater than 0.");

      try {
        GM_setValue(STORAGE_KEY, userKey);
        results.innerHTML = "";
        status.textContent = "Server is verifying license and calculating payouts...";

        const result = await apiPost("/api/calc/rw-payout", {
          userKey,
          token,
          from,
          to,
          totalPayout,
          hitWeight,
          assistWeight,
          rwOnly,
          includeChainHits,
        });

        lastRows = result.rows || [];
        lastSummary = result.summary || {};
        results.innerHTML = renderRows(lastRows, lastSummary);
        const resultsPanel = document.getElementById("rw-results-panel");
        if (resultsPanel) {
          resultsPanel.hidden = false;
          resultsPanel.removeAttribute("hidden");
          resultsPanel.style.display = "block";
          resultsPanel.style.visibility = "visible";
          resultsPanel.style.opacity = "1";
          resultsPanel.scrollTop = 0;
        }
        status.textContent = `Done. ${lastRows.length} members with payable contribution. Results opened in the separate results panel.`;
      } catch (e) {
        status.textContent = "Error: " + e.message;
        if (String(e.message).toLowerCase().includes("license")) {
          GM_setValue(PAYWALL_TOKEN_STORAGE_KEY, "");
        }
      }
    });

    function getAdminKeyFromInput() {
      const adminKey = document.getElementById("rw-admin-key").value.trim();
      if (!adminKey) throw new Error("Enter your admin key first.");
      return adminKey;
    }

    async function refreshAdminLicenses() {
      const status = document.getElementById("rw-admin-status");
      const results = document.getElementById("rw-admin-results");
      const adminKey = getAdminKeyFromInput();

      GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
      status.textContent = "Loading licenses from server...";
      results.innerHTML = "";

      const result = await adminRequest("GET", "/api/admin/licenses", adminKey);
      results.innerHTML = renderAdminLicenses(result.licenses || []);
      status.textContent = `Loaded ${(result.licenses || []).length} license(s).`;

      results.querySelectorAll(".rw-admin-fill-revoke").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("rw-admin-torn-id").value = btn.dataset.tornId || "";
          document.getElementById("rw-admin-status").textContent = `Filled Torn ID ${btn.dataset.tornId || ""} for revoke/grant.`;
        });
      });
    }

    document.getElementById("rw-admin-save-key").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = document.getElementById("rw-admin-key").value.trim();
        if (!adminKey) return alert("Enter your admin key first.");

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = "Admin key saved. Granting owner 10,000 day license...";

        await grantOwnerLicenseFromAdminKey(adminKey, status);
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin key saved, but owner license grant failed: " + e.message;
      }
    });

    document.getElementById("rw-admin-list").addEventListener("click", async () => {
      try {
        await refreshAdminLicenses();
      } catch (e) {
        document.getElementById("rw-admin-status").textContent = "Admin list error: " + e.message;
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

        status.textContent = `Granted license to ${result.name || name} (${result.tornId || tornId}) until ${formatUnixDate(result.expiresAt)}.`;
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin grant error: " + e.message;
      }
    });

    document.getElementById("rw-admin-extend").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");
      try {
        const result = await extendAdminLicenseFromCurrentForm(status);
        if (result) await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin extend error: " + e.message;
      }
    });

    document.getElementById("rw-admin-revoke").addEventListener("click", async () => {
      const status = document.getElementById("rw-admin-status");

      try {
        const adminKey = getAdminKeyFromInput();
        const tornId = document.getElementById("rw-admin-torn-id").value.trim();

        if (!tornId) return alert("Enter the player's Torn ID.");
        if (!confirm(`Revoke license for Torn ID ${tornId}?`)) return;

        GM_setValue(ADMIN_KEY_STORAGE_KEY, adminKey);
        status.textContent = `Revoking license for Torn ID ${tornId}...`;

        await adminRequest("POST", "/api/admin/revoke", adminKey, { tornId });

        status.textContent = `Revoked license for Torn ID ${tornId}.`;
        await refreshAdminLicenses();
      } catch (e) {
        status.textContent = "Admin revoke error: " + e.message;
      }
    });
  }


  async function createPanel() {
    if (document.getElementById("rw-payout-helper")) return;

    const panel = document.createElement("div");
    panel.id = "rw-payout-helper";
    document.body.appendChild(panel);
    setLauncherOpenState(true);

    panel.innerHTML = `<style>${panelBaseCss()}</style><div class="rw-body"><div class="rw-muted">Checking license...</div></div>`;

    const valid = await verifySavedLicense();
    if (!valid) {
      showPaywallScreen(panel);
      return;
    }

    showMainScreen(panel);
  }

  setupXanaxPaymentButtonHandler();
  createLauncherButton();
  runXanaxPaymentAutofillFromUrl();
})();
