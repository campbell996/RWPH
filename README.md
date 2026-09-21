# Ranked War Payout Helper — RWPH

<p align="center">
  <a href="https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/campbell996/RWPH/refs/heads/main/rwph.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update RWPH.</strong></p>

**Ranked War Payout Helper (RWPH)** is a Torn userscript for calculating ranked-war payouts, comparing member contribution, managing payout adjustments, keeping up to three saved reports per faction, and preparing manual faction payments.

Current userscript version: **1.1.486**  
Userscript name: **Ranked War Payout Helper**  
Namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**

> **Important:** RWPH is a manual helper. It does not automatically attack, send money/items, confirm Torn payments, buy, sell, or perform gameplay actions for you. Always review the results before acting on them.

---

## What's New in v1.1.486

- Fixed the **expired/stale Extend Licence payment-code handoff** that could open Torn's Xanax helper and then say RWPH could not confirm the payment code in the backend/database.
- The helper remembers whether the payment was started from **Buy Licence** or **Extend Licence**.
- If a just-opened helper finds that its original database challenge is missing, expired, or replaced, RWPH automatically repeats the same Buy/Extend start action so the backend can reuse the current challenge or create a fresh one.
- If the current database payment code differs from the code in the Torn helper URL, RWPH switches the helper to the current code automatically.
- Payment auto-check runs on the Torn item helper page once the current database-backed code is confirmed.
- No MySQL schema migration is required. If the v1.1.484+ backend is already deployed, this fix only requires updating the userscript.

## What's New in v1.1.484

- **Buy Licence / Extend Licence are now direct SQL hot paths:** creating or restoring a payment code no longer loads every RWPH licence, payment, trial, setting, and admin record.
- **Payment confirmation is targeted:** RWPH checks used payment fingerprints directly, then updates only the affected user's licence, payment, and challenge rows in one transaction.
- **Licence checks are lighter everywhere:** calculations, war auto-fill, Cached Reports authorization, Unlock Panel, and licence-info checks now read only the current user's indexed licence row.
- **Free Trial is direct too:** activation checks and writes only that user's trial/licence records.
- **Admin licence operations are faster:** list, grant, extend, remove-days, and status counts use targeted SQL rather than the old full-state loader.
- **Duplicate-click protection:** Buy Licence and Extend Licence disable while their payment-code request is running.
- **No overlapping payment polls:** if a live payment check takes longer than the 15-second interval, RWPH waits for it to finish instead of starting another one.
- **Faster extension completion:** after a payment is confirmed, the Licence Info panel uses the expiry returned by that same response instead of making an immediate second licence request.
- **Legacy bulk loader isolated:** full-state load/save remains only for the explicit legacy JSON import route.
- No database schema migration is required from v1.1.483. Redeploy the backend and install/update `rwph.user.js`.

---

## Quick Start

1. Install or update `rwph.user.js`.
2. Open a Torn faction page.
3. Click the RWPH launcher near the faction/faction-warfare area.
4. Enter your Torn API key.
5. Click **Save Key** if you want it remembered on that browser/device.
6. Unlock RWPH with your active licence, or use the available licence/trial controls.
7. Open **Basic Calculations** or **Advanced Calculations**.
8. Use **Auto-fill Last Finished War** when available, or enter the finished-war time range manually.
9. Enter the payout amount.
10. Review the settings and optional Member Management adjustments.
11. Click **Calculate**.
12. Review the results before using the payment/copy/export tools.
13. Use **Cached Reports** on the unlocked main panel whenever you want to reopen one of your faction’s three saved reports.

RWPH is designed around **finished ranked wars**. Active wars are not treated as final payout reports.

---

## Basic Calculations

Basic mode is the simplest payout method.

It is intended for factions that mainly want a straightforward payable-hit calculation without the extra Advanced scoring controls.

Depending on the selected Basic options, RWPH can account for relevant war activity while keeping the payout setup easy to understand.

### Fast Mode

Fast Mode uses Torn's finished ranked-war report data where possible to reduce the amount of attack-log fetching required.

Fast Mode is useful when speed matters more than attack-log extras. Because it uses the lighter report data, extras such as assists, outside hits, and retals may not be available in the same detail as a full calculation.

---

## Advanced Calculations

Advanced Calculations uses a **preset + editable settings** system.

The preset dropdown is not a locked formula picker. Instead:

1. Select a calculation system.
2. RWPH fills the shared Advanced settings with that system's recommended values.
3. Change any setting you want.
4. Calculate using the values currently shown.

There is no separate **Custom** calculation system. **Editing any preset makes your own customised version of that selected system.**

### Calculation System Presets

RWPH currently includes:

- **Hybrid — Hits + Performance (Recommended)**
- **Weighted Points**
- **Exact Fair Fight**
- **Fixed Pay Per Hit**
- **Adjusted Respect Share**
- **Tiered Fair Fight**
- **Base Pay + Bonus Points**
- **Energy / Efficiency**
- **Equal / Participation Pay**
- **RWPH Recommended**
- **RWPH Classic Advanced**

Selecting a different preset loads that preset's recommended values into the same shared Advanced settings.

Use **Reload Selected Preset Defaults** if you want to discard your current edits and reload the selected system's normal values.

---

## Advanced Setting Help Buttons

Every visible Advanced setting has its own small **`?`** button.

Click the `?` beside a setting to get a short explanation in an RWPH notification.

Help is available for settings including:

- Calculation System
- War start/end date and time
- Member Payout
- Total Payout
- War Hit points
- Assist points
- Outside Hit points
- War Retal modifier and modifier type
- Overseas modifier and modifier type
- Chain-maintenance-only outside hits
- Hospital bonuses
- Respect scoring
- Chain-bonus respect handling
- War-only respect scoring
- Fair Fight on/off
- Fair Fight mode
- Linear FF rate
- Average FF step settings
- Hybrid allocation percentages
- Hybrid retal support

These setting-help notifications follow the selected RWPH colour theme and stay open until you press **×** or click the same `?` again. Other normal RWPH notifications still close after about five seconds.

---

## Shared Advanced Settings

### War and payout

- **War start date/time** — beginning of the period RWPH calculates.
- **War end date/time** — end of the period RWPH calculates.
- **Member Payout** — money pool distributed between eligible members.
- **Total Payout** — reference value for the overall payout/income.

### Main point values

- **War Hit points**
- **Assist points**
- **Outside Hit points**
- **War Retal modifier / bonus**
- **Retal modifier type**
- **Overseas modifier / bonus**
- **Overseas modifier type**
- **Outside value applies to chain-maintenance hits only**

Retal/overseas modifiers can use additive or multiplier behaviour depending on the selected preset/settings.

### Hospital bonuses

- **Hospitalize bonus points**
- **Enemy war faction hospital bonus points**

The enemy-faction hospital setting can be negative, zero, or positive.

### Respect scoring

- **Respect score to add**
- **Per respect earned**
- **Ignore chain-bonus multiplier for respect**
- **Apply respect score to war hits only**

Set the respect score to `0` if respect should not add payout points.

### Fair Fight

RWPH supports multiple Fair Fight behaviours, including:

- None
- Exact
- Tiered
- Linear
- Average-step scoring

Fair Fight settings are automatically filled by presets but remain editable.

### Hybrid allocation

Hybrid has editable allocation percentages for:

- Participation
- Performance
- War contribution
- Support

The percentages are normalised automatically when necessary.

---

## RWPH Classic Advanced

**RWPH Classic Advanced** preserves the older Advanced-style setup for users who preferred the previous scoring approach.

Users upgrading from the old Custom Advanced setup can continue with the Classic preset and edit its shared settings normally.

---

## Member Management

Member Management lets you adjust a report before final payout calculation.

Available adjustments include:

- Exclude a member completely.
- Remove payable hits from a member.
- Subtract respect from a member.

Member Management changes are applied before the final payout shares are calculated.

Saved Member Management adjustments are temporary and are intended for the current payout workflow rather than permanent faction records.

---

## Cached Reports

The unlocked main panel has a dedicated **Cached Reports** button. Cached Reports are stored by **faction ID** and the panel shows the three newest completed reports for that faction.

There are no fixed saved-report slot records. The cards are simply displayed as:

- **Saved Report 1** — newest
- **Saved Report 2** — second newest
- **Saved Report 3** — third newest

When you press Calculate, RWPH performs one cache preflight before opening the loading panel. The preflight uses the full effective calculation setup, including mode/system, war dates, payout values, Basic/Advanced settings, Fast Mode and Member Management changes.

- If an exact match already exists, RWPH opens Cached Reports and highlights it instead of recalculating.
- If any calculation setting is different and fewer than three reports exist, RWPH calculates and stores a new report.
- If all three reports exist and there is no exact match, RWPH opens Cached Reports so you can delete one first.

Each cached report stores the exact completed result payload. **Load Report** reopens that saved result without fetching Torn attack data or recalculating it.

### Auto Delete

Auto Delete is optional and shared by the faction. Available ages are **1h, 3h, 6h, 12h, 24h, 48h, 3 days and 7 days**.

When enabled, each cached report receives an expiry time based on when it was saved. Expired reports are removed before they count toward the three-report limit. Turning Auto Delete off removes expiry from the faction's current cached reports.

The panel refreshes when it is opened and immediately after deleting a report. It does not poll continuously.

---

## Results

After calculation, RWPH shows the completed report in the Results workflow.

Depending on the selected mode/system, results can include relevant member contribution, point totals, payout amounts, hit/respect information, and other available war statistics.

RWPH also keeps the loading/progress panel available while longer calculations are running.

Always review the report before paying members.

---

## Payments Copy Panel

The Payments Copy Panel helps faction leaders work through the calculated payout list manually.

It can prepare/copy the member and amount details required for payment, while keeping the final Torn action manual.

RWPH does **not** automatically press Torn's final send/confirm button.

---

## Payout Amount Input

RWPH accepts normal numbers and common shorthand where supported, for example:

- `100000000`
- `100m`
- `1.5b`
- `346.21b`
- `1t`

Formatted values are shown in a more readable money format after processing.

---

## Theme / Colours

The Theme / Colours control changes RWPH's visual colours across supported panels, buttons, cards, inputs, notifications, and Advanced preset controls.

The Advanced Calculation System dropdown now follows the currently selected theme/colour instead of using a mismatched fixed background.

---

## Logo Selector

RWPH includes multiple selectable logo styles.

Changing the selected logo updates supported RWPH launchers/panels while keeping the current calculation and payout settings intact.

---

## Movable / Resizable Panels

Supported RWPH panels can be moved and resized.

When a supported panel is resized from its corner, the text and related UI sizing scale with the panel. Saved layout information is restored when the panel is reopened where supported.

---

## Launcher Behaviour

The RWPH launcher is intended to stay attached to the appropriate faction area instead of drifting when the Torn page scrolls or changes.

Desktop and PDA/mobile layouts may use different launcher sizing to fit the available space.

---

## API Key and Privacy

RWPH needs a Torn API key for the data required by its calculations.

When you choose to save the key, it is stored in your browser/userscript/PDA storage for use by RWPH.

RWPH does not need your Torn password.

You remain in control of your Torn API key and can clear the saved key from RWPH/browser storage or rotate/revoke it in Torn when needed.

See `RWPH_PRIVACY_AND_API_KEY_TERMS.md` for the included privacy/API-key terms.

---

## Troubleshooting

### The launcher does not appear

- Make sure the userscript is enabled.
- Reload the Torn faction page.
- Check that the userscript manager/PDA allows RWPH to run on Torn.
- Try reopening the faction page after updating RWPH.

### RWPH cannot unlock or calculate

- Confirm your internet connection is working.
- Confirm your Torn API key is valid.
- Confirm the API key has the access required for the data RWPH is trying to read.
- Confirm your RWPH licence is active.
- Reload Torn and retry once if Torn/API services were temporarily unavailable.

### Calculation is slow

Calculation time depends heavily on how much attack data exists for the finished war and whether reusable Torn attack data is already available from RWPH’s temporary request cache.

RWPH includes request reuse, attack-data caching, faster finished-war fetching where supported, and fallback behaviour when a faster Torn endpoint cannot be used.

### Torn reports a rate limit

Wait briefly and try again. RWPH uses request spacing/retry handling, but Torn may still rate-limit a key when it is also being heavily used by other tools.

### A saved report is not available

Open **Cached Reports**. The panel loads the three newest reports for the faction ID shown in the panel header. If fewer than three exist, successful calculations can add new reports.

### All three cached reports are full

RWPH allows up to three cached reports per faction. If all three exist and the current settings do not exactly match one of them, pressing Calculate opens Cached Reports instead of the loading panel. Delete one report, then calculate again.

### A setting is confusing

Click the small **`?`** beside that Advanced setting. RWPH will show what the setting does and how it affects the calculation.

---

## Updating RWPH

When a new userscript version is released:

1. Install/update the newest `rwph.user.js`.
2. Reload Torn.
3. Open RWPH and confirm the displayed userscript version/settings behave as expected.
4. Run a report you already know if you want to verify the new version before using it for a live faction payout.

Saved local settings are preserved where possible between versions.

---

## Responsible Use

- Review every payout report before paying members.
- Check the selected preset and any customised Advanced values.
- Confirm the war time range is correct.
- Review Member Management adjustments.
- Treat Torn/API outages, incomplete data, or rate limits as reasons to verify the report before use.
- Keep final Torn payment/gameplay actions manual.

---

## Current Version Summary — v1.1.486

RWPH v1.1.486 keeps the v1.1.485 layout and fixes stale/expired Buy/Extend payment-helper handoffs so the current database-backed payment code is automatically restored or recreated when necessary.

## v1.1.486 - Payment Helper Recovery

- Keeps the v1.1.485 layout where Cached Reports sits between Basic Calculations and Advanced Calculations.
- Fixes stale/expired Buy/Extend helper handoffs by remembering the original payment intent and repairing a missing/replaced payment challenge automatically.
- If the backend supplies a replacement payment code, the Torn helper switches to that current code and updates its URL instead of continuing with the stale code.
- Starts payment auto-check on the Torn item/helper page after the database-backed payment code is confirmed.
- Backend v1.1.484 remains compatible and does not need redeploying; no database migration is required.

RWPH v1.1.484 keeps the v1.1.482 fast Cached Reports system and v1.1.483 fast Admin Key activation, while converting the remaining common licence/payment/admin hot paths to targeted indexed MySQL operations. Buy/Extend, licence checks, payment confirmation, trial activation, and admin licence changes no longer need the legacy full-state database loader.

The Advanced preset/shared-settings system, persistent per-setting help, themed dropdowns, calculation formulas, licensing, payment tools, Member Management, Cached Reports, and Torn attack-data speed cache remain available.


## v1.1.484 - Faster Licence, Payment, and Admin Hot Paths

Buy/Extend, pending-payment lookup, payment confirmation, licence verification, Free Trial, admin licence list/grant/extend/remove, and admin status counts now use targeted indexed MySQL operations. Buy/Extend requests are click-locked, payment auto-checks cannot overlap, and extension completion reuses the returned licence expiry instead of immediately checking the licence again. The legacy full-state loader remains only for legacy JSON import. No schema migration is required from v1.1.483.

## v1.1.483 - Faster Admin Key activation

Saving the Admin Key now performs one verify + owner-licence grant request. The backend writes only the owner user/licence/metadata rows directly, returns a fresh signed licence token, and the userscript unlocks the admin controls immediately. The full licence list is no longer loaded automatically during key save. No schema migration is required from v1.1.482.
