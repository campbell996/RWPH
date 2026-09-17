# Ranked War Payout Helper — RWPH

<p align="center">
  <a href="https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/campbell996/RWPH/refs/heads/main/rwph.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update RWPH.</strong></p>

**Ranked War Payout Helper (RWPH)** is a Torn userscript for calculating ranked-war payouts, comparing member contribution, managing payout adjustments, keeping up to three saved reports per faction, and preparing manual faction payments.

Current userscript version: **1.1.477**  
Userscript name: **Ranked War Payout Helper**  
Namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**

> **Important:** RWPH is a manual helper. It does not automatically attack, send money/items, confirm Torn payments, buy, sell, or perform gameplay actions for you. Always review the results before acting on them.

---

## What's New in v1.1.477

- Fixed reports not appearing in **Cached Reports** after a calculation.
- RWPH now uses a clean Saved Reports v2 storage table for all three faction report slots.
- Compatible saved rows from the previous Saved Reports table are imported once where possible.
- A completed calculation is only marked as saved after the Worker immediately reads the saved row back successfully.
- Cached Reports list, load, delete, Auto Delete, exact-settings matching and the three-slot capacity check all use the same storage path.
- Exact-settings matches still open Cached Reports and highlight the matching report instead of recalculating.
- Existing Auto Delete and refresh-on-open/delete behaviour remain unchanged.

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

The unlocked main panel has a dedicated **Cached Reports** button. This is RWPH's completed-report storage system.

Each faction has **3 saved report slots**.

Before a calculation starts, RWPH compares the current effective calculation settings with the three saved reports:

- If a saved report uses the **exact same effective settings**, RWPH does not recalculate it.
- Cached Reports opens automatically and the matching report is highlighted.
- If any effective calculation setting is different, RWPH treats it as a new report and calculates normally when a slot is available.
- Effective settings include the calculation mode/system, war start/end, payout values, Basic/Advanced calculation values, Fast Mode, and Member Management adjustments. Theme/logo choices are not calculation settings.

After a successful new calculation:

- RWPH saves the completed Basic or Advanced report automatically.
- RWPH uses the first empty slot.
- If the first save attempt fails, RWPH retries once.
- If both save attempts fail, RWPH shows the save error so you know the report was not stored.
- If all 3 slots are full and there is no exact-settings match, RWPH opens Cached Reports and does not start another calculation until you delete one report or Auto Delete frees a slot.

The Cached Reports panel shows each slot with the calculation type, war period, save time, member count and report totals.

From the panel you can:

- **Load Report** — open the exact report that was saved.
- **Delete** — immediately clear that slot.
- **Auto Delete** — turn automatic expiry on/off for the faction.
- **Delete after** — choose 1h, 3h, 6h, 12h, 24h, 48h, 3 days, or 7 days.

Auto Delete is a faction-level setting. When enabled, reports older than the selected age are removed by the backend before they count toward the 3 saved slots.

The panel refreshes when it is first opened and after a report is deleted. It does **not** continuously poll the backend.

Saved reports are shared at the **faction level**, so licensed users calculating for the same faction see that faction's slots. Loading a saved report does not apply whatever settings are currently visible in Basic/Advanced; it loads the saved result exactly as it was calculated.

The old hidden automatic cache system, mode-specific Use Cached Report buttons, and Delete Cache cooldown are no longer used. The only matching behavior is the visible three-slot Cached Reports panel checking for an exact settings duplicate before a new calculation starts.

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

Open **Cached Reports**. The panel refreshes when it opens. If a slot is empty, run a successful calculation to save a report. Each faction has its own three slots.

### All three saved-report slots are full

RWPH requires an empty Saved Reports slot before a new calculation can start. If all three slots are occupied, pressing Calculate opens Cached Reports instead of the loading panel. Delete one saved report, then press Calculate again.

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

## Current Version Summary — v1.1.477

RWPH v1.1.477 uses the faction-level **Cached Reports** panel with three saved-report slots per faction. Saved Reports now use a clean v2 storage table, with a one-time import of compatible rows from the previous table where possible. Every completed calculation is verified by reading the saved row back before RWPH reports that it was cached. Exact-settings matching, three-slot capacity, Auto Delete, and refresh-on-open/delete behavior remain available.

The Advanced preset/shared-settings system, persistent per-setting help, themed dropdowns, calculation formulas, licensing, payment tools, Member Management, and Torn attack-data speed cache remain available.
