# Ranked War Payout Helper — RWPH

<p align="center">
  <a href="https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/campbell996/RWPH/refs/heads/main/rwph.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update the RWPH userscript.</strong></p>

**Ranked War Payout Helper (RWPH)** is a Torn userscript with a standalone Cloudflare Worker + MySQL backend for calculating ranked-war payouts, managing licences, caching finished reports, and helping faction leaders prepare manual payments.

Current userscript version: **1.1.465**  
Userscript name: **Ranked War Payout Helper**  
Namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**

> **Important:** RWPH is a manual helper. It does not automatically attack, send cash, send items, confirm Torn payments, buy, sell, or perform gameplay actions for you. Always review results and manually confirm Torn actions yourself.

---

## Current Architecture

RWPH now uses the standalone Cloudflare/MySQL backend introduced in v1.1.454:

```text
RWPH userscript
      ↓
Cloudflare Worker (rwph-backend)
      ↓
Cloudflare Hyperdrive (HYPERDRIVE)
      ↓
Aiven MySQL (defaultdb)
```

The Cloudflare Worker handles licence verification, licence payments, Torn API requests used by calculations, report caching, calculation progress, exports, and admin functions.

The production Worker URL is:

`https://rwph-backend.rankedwarpayouthelper.workers.dev`

Persistent backend data is stored in normalized MySQL tables. The old `paywall-db.json` is retained only as an optional legacy import source and is **not** the live database.

For backend installation, see:

- `TAKEOVER_INSTALL.md`
- `backend/BACKEND_SETUP.md`
- `backend/MYSQL_DATABASE_SETUP.md`

---

## What Changed Recently

### v1.1.465 — Shared editable Advanced settings + Results error fix

- Removed **Custom Advanced** as a separate calculation-system choice.
- Every Advanced calculation system is now a **preset loader** for one shared editable Advanced Settings panel.
- Selecting a system immediately loads that system's recommended values for hits, assists, outside hits, retals, overseas handling, hospital/respect scoring, Fair Fight mode, Hybrid allocation, and Defence activity credit.
- After a preset loads, every visible setting remains editable. The calculation uses the values currently shown in the fields, so changing any field creates your own customised version of the selected system without changing to a separate Custom mode.
- Added **RWPH Classic Advanced** as a normal preset. Upgrades from the old Custom Advanced mode are migrated to this preset and existing saved custom point values are preserved.
- Fresh installs default to **Hybrid — Hits + Performance (Recommended)** and load its shared settings automatically.
- Advanced cache identity now includes the selected system **and all current shared scoring settings**, while payout amount changes still do not invalidate the report cache.
- Fixed the Results error **`includeLeftFactionMembers is not defined`** by explicitly defining the intended value before calculation requests are built.
- Added regression tests proving preset defaults, editable overrides, Hybrid split changes, cache isolation, legacy Custom migration, and the Results variable fix.
- This release changes backend scoring logic, so **redeploy the supplied v1.1.465 Cloudflare Worker** when upgrading.

### v1.1.464 — Selectable payout calculation systems (historical; superseded by v1.1.465)

- Added a **Calculation System** dropdown inside Advanced Calculations.
- At v1.1.464, the existing **Custom Advanced** formula was still a separate selectable option. v1.1.465 replaces that model with RWPH Classic + shared editable settings.
- Added selectable systems for **Hybrid — Hits + Performance**, **Weighted Points**, **Exact Fair Fight**, **Fixed Pay Per Hit**, **Adjusted Respect Share**, **Tiered Fair Fight**, **Base Pay + Bonus Points**, **Energy / Efficiency**, **Turtling / Defence**, **Equal / Participation Pay**, and **RWPH Recommended**.
- v1.1.464 kept Custom Advanced selected by default for upgrade safety. v1.1.465 now migrates old Custom settings to RWPH Classic and uses Hybrid as the fresh-install default.
- Advanced report caches are now isolated by selected calculation system so a cached report created by one preset cannot be opened as another preset.
- Member Management continues to recalculate payouts after member exclusions/hit or respect adjustments.
- The new preset calculations run from the same finished-war attack dataset and use the existing calculation progress/results/payment workflow.
- This release changes backend calculation logic, so **the Cloudflare Worker must be redeployed** when upgrading to v1.1.464.

### v1.1.463 — Conservative userscript cleanup

- Removed verified-unused legacy helpers and abandoned theme-layout generators.
- Removed stale launcher-corner code and an obsolete swallowed `placeLauncher()` call.
- Removed unused local variables and the unused `GM_setClipboard` permission.
- Removed historical in-code version-comment clutter and excess blank lines.
- Kept all current DOM IDs, backend route strings, embedded logo assets, calculation logic, licensing, caches, payments, themes, PDA behavior, and UI controls intact.
- No backend redeploy is required for this cleanup.

### v1.1.462 — Production Worker domain update

- Production backend URL is now `https://rwph-backend.rankedwarpayouthelper.workers.dev`.
- The userscript `@connect` permission and backend base URL now point to the new Worker domain.
- The Wrangler setup helper and takeover-install documentation now use the new address.
- Calculation formulas, licence logic, cached reports, payments, Member Management, UI behaviour, and backend routes are unchanged.

### v1.1.461 — Advanced guide button placement

- The small **`?`** Advanced setup-guide button now sits inside the **Advanced Calculations** header beside its open/status area.
- The main logo controls no longer contain the Advanced help button.
- Clicking `?` switches the same live Advanced settings between the normal compact view and the detailed setup guide.
- Calculation formulas, cache matching, Member Management, licence behaviour, and backend routes are unchanged.

### v1.1.460 — Optional Advanced setup guide

- Restored the compact Advanced Calculations layout as the normal/default view.
- Added an optional detailed setup guide for users who want explanations and examples.
- The guide uses the same live fields, so values are not duplicated or lost when switching views.
- **Restore Recommended Defaults** is available while the guide is open and only resets Advanced scoring settings.

### v1.1.457 — Faster calculations

- Prefers Torn API v2 `faction/attacksfull`, allowing up to 1,000 attack records per request where available.
- Automatically falls back to the older attack-fetch path when needed.
- Fixed attack-range memory cache keys so repeated finished-war calculations can reuse data correctly.
- Basic and Advanced calculations can reuse an already-fetched whole-war attack range while the Worker cache is warm.
- Finished attack-fetch cache lifetime is 30 minutes.
- Torn request spacing defaults to 700 ms with retry/backoff handling.

### v1.1.456 — Fewer unnecessary backend requests

- Duplicate identical backend requests are coalesced.
- Cache checks are performed only for the calculation mode being used.
- Cache checks wait until the Basic or Advanced calculation section is opened/used instead of being needlessly triggered by unrelated controls.
- Idle pending-payment lookups are skipped unless there is actually a pending payment to restore/check.
- Duplicate calculation-progress polling was removed.

### v1.1.455 — Resize scaling

- Resizing supported RWPH panels from the corners also scales text and line-height.
- Buttons and input text scale with the panel where appropriate.
- The saved panel layout remembers the matching text scale.

### v1.1.454 — Standalone Cloudflare/MySQL backend

- Moved the backend to Cloudflare Workers + Hyperdrive + Aiven MySQL.
- Added normalized MySQL storage for licences, payment challenges, payments, trials, report cache, settings, admin actions, and runtime metadata.

---

## Requirements

### For normal users

- Torn in a desktop browser, mobile browser, or Torn PDA/userscript environment.
- Tampermonkey, Violentmonkey, or equivalent userscript support.
- A Torn API key with the faction/ranked-war access required by RWPH.
- An active RWPH licence or unused 7-day trial.
- Access to the configured RWPH Cloudflare backend.

### For the backend owner

- Cloudflare account with Workers and Hyperdrive.
- Aiven MySQL database, using `defaultdb` in the supplied setup.
- Node.js LTS + npm locally for Wrangler/setup scripts.
- Wrangler login to the Cloudflare account that owns the Worker.
- A Torn API key belonging to the account that receives Xanax licence payments.

---

## Quick Start — Users

1. Install `rwph.user.js` in Tampermonkey/Violentmonkey or your supported Torn PDA userscript system.
2. Open a Torn faction page.
3. Click the RWPH launcher beside the **Faction Warfare** area/header control.
4. Paste your Torn API key.
5. Click **Save Key** if you want RWPH to remember it on that browser/PDA.
6. Click **Unlock Panel** if you already have an active licence.
7. If you do not have a licence, use **Buy Licence** or the one-time **7 Day Free Trial**.
8. Open **Basic Calculations** or **Advanced Calculations**.
9. Use **Auto-fill Last Finished War** or enter the required finished-war time range.
10. Enter the Member Payout amount, review settings, optionally use Member Management, then click **Calculate**.
11. Review the full results before using Payments/Newsletter/export tools.

RWPH is designed around completed ranked-war reports. Active/current wars are not treated as finished payout reports.

---

## Licence System

RWPH uses backend-verified licences.

Current default payment configuration in the supplied Worker config:

- Item: **Xanax**
- Torn item ID: **206**
- Quantity per payment unit: **1**
- Licence time: **15 days per Xanax**
- Trial: **one-time 7-day free trial per Torn account**

### Buy / Extend flow

1. Click **Buy Licence** or **Extend Licence**.
2. RWPH requests a payment challenge/code from the backend.
3. RWPH opens/navigates to the Torn Xanax send page and shows the payment helper.
4. Send the required Xanax manually to the configured receiver and include the exact payment code.
5. RWPH checks the backend for the matching Torn item transfer.
6. When the payment is verified, the licence is created or extended.

The payment helper can prefill/copy details, but RWPH never presses Torn's final **Send** or **Confirm** action for you.

The old licence purchase bonus system has been removed. Licence payments add only the configured base time.

---

## Main Panel

The unlocked main panel contains three tabs:

- **Payout**
- **Admin**
- **Help**

Main controls include:

- API Key
- Save Key
- Extend Licence
- Your Expiration
- Lock Panel
- Theme / Colours
- Logo Selector
- Basic Calculations
- Advanced Calculations

The selected API key is stored locally only when **Save Key** is pressed.

---

## Basic Calculations

Basic mode is intended for a simpler per-hit payout split.

Each selected **hit type** counts as a weight of **1**. Respect is a separate optional contribution: when enabled, the member's payout respect is added to their payout weight. Current controls are:

- War hits — enabled by default
- Outside hits — enabled by default
- Retals — enabled by default
- Assists — disabled by default
- Respect — disabled by default

Basic mode keeps contribution categories separate so they are not unintentionally double-counted. In particular:

- War-faction retals remain in the **Retaliation Hits** bucket in Basic mode.
- Non-war-faction retals are treated as **Outside Hits**.
- Assists are tracked separately rather than also counting as normal war hits.

### Basic Fast Mode

Basic mode also includes:

**Fast Mode — ranked-war report only**

Fast Mode is much quicker because it uses Torn's ranked-war report for:

- War Hits
- Members
- Respect
- Total Respect

Fast Mode intentionally skips attack-log extras such as:

- Assists
- Outside hits
- Retals

Use Fast Mode when you only need the ranked-war report data and want the quickest possible calculation.

---

## Advanced Calculations

Advanced Calculations uses a **Calculation System** dropdown plus **one shared editable settings panel**.

The dropdown is a preset selector, not a locked formula selector:

1. Choose a calculation system.
2. RWPH automatically fills the shared settings with that system's recommended values.
3. Leave the values alone to use the normal preset.
4. Change any value to create your faction's customised version of that selected system.
5. Choosing another system loads that other system's recommended values into the same fields.

There is **no separate Custom Advanced system** in v1.1.465. Customisation is done directly by editing the shared settings after selecting any preset.

The small **`?`** button in the Advanced Calculations header toggles the detailed setup guide for the same live settings. It does not create a second copy of the controls.

### Available calculation-system presets

| Preset | Recommended/default behaviour |
| --- | --- |
| **Hybrid — Hits + Performance (Recommended)** | 50% participation + 30% exact-FF performance + 15% war contribution + 5% verified support. War-retal and overseas modifiers default to ×1.25. |
| **Weighted Points** | War hit uses exact FF; war retal ×1.25; overseas war hit ×1.25; assist 0.65; outside 0.35. |
| **Exact Fair Fight** | War hit uses exact FF; war retal ×1.25; overseas ×1.25; assist 0.60; outside 0.30. |
| **Fixed Pay Per Hit** | War hit 1.00; war retal ×1.25; overseas ×1.25; assist 0.50; outside 0.25; FF disabled. |
| **Adjusted Respect Share** | War action values default to 0; respect defaults to 1 point per 1 adjusted war respect; chain-bonus multiplier is removed where Torn exposes it. |
| **Tiered Fair Fight** | War hits use the RWPH FF brackets; retal/overseas ×1.25; assist 0.60; outside 0.30. |
| **Base Pay + Bonus Points** | War hit 1.00; Linear FF bonus 0.50 per +1.00 FF; retal +0.25; overseas +0.25; hospitalize +0.10; assist 0.50; outside 0.30. |
| **Energy / Efficiency** | Exact-FF war scoring; retal +0.25; assist 0.50; only chain-maintenance outside hits score 0.30 by default. |
| **Turtling / Defence** | War hit 1.00; retal +0.50; assist 0.50; outside 0; +0.25 per unique 15-minute payable activity block. |
| **Equal / Participation Pay** | War/assist/outside values default to 1 and each qualifying member receives one equal share. |
| **RWPH Recommended** | Exact FF +0.25 war-retal +0.25 overseas; assist 0.60; outside 0.30. |
| **RWPH Classic Advanced** | Loads the old Advanced defaults: War 10, Assist 3, Outside 2, retal +0.20, hospital/respect settings and Avg-FF step scoring. |

### Shared editable settings

The same controls are available regardless of which preset is selected:

- **War hit points**
- **Assist points**
- **Outside hit points**
- **War-faction retal value** and **Add / Multiplier** mode
- **Overseas value** and **Add / Multiplier** mode
- **Outside chain-only** switch
- **Hospitalize bonus**
- **Enemy war-faction hospital adjustment** (can be negative)
- **Respect points** and **respect step**
- **Ignore chain-bonus multiplier for respect**
- **War-only respect**
- **Fair Fight enabled**
- **Fair Fight mode:** None, Exact, Tiered, Linear, or Average-FF Step
- **Linear FF rate**
- **Average-FF step size** and **bonus per step**
- **Hybrid allocation percentages** and retal support value
- **Defence activity-block minutes/value**

Some controls naturally matter only to a particular formula shape—for example, Hybrid percentages are used by Hybrid and Defence activity-block values are used by Turtling / Defence—but they remain part of the same shared settings panel.

### Retal and overseas modifier modes

For both war retals and overseas war hits you can choose:

- **Add points** — a value of `0.25` adds `+0.25` to that hit.
- **Multiply by 1 + value** — a value of `0.25` applies `×1.25`.

If a war hit qualifies for both retal and overseas modifiers, both configured adjustments are applied in sequence.

### Fair Fight modes

- **None** — the base war-hit value is used with no FF adjustment.
- **Exact FF** — base war-hit value × exact FF.
- **Tiered FF** — base war-hit value × the RWPH FF bracket value.
- **Linear FF bonus** — base war-hit value + `(FF - 1) × Linear Rate`.
- **Average FF step bonus** — uses the member's average FF and adds the configured per-payable-hit step bonus after tracked contributions are built.

FF values are capped to the normal 1.00–3.00 scoring range used by RWPH.

### Tiered Fair Fight table

| Fair Fight | Tier value |
| --- | ---: |
| 1.00–1.24 | 1.00 |
| 1.25–1.49 | 1.10 |
| 1.50–1.74 | 1.25 |
| 1.75–1.99 | 1.40 |
| 2.00–2.24 | 1.60 |
| 2.25–2.49 | 1.80 |
| 2.50–2.74 | 2.10 |
| 2.75–2.99 | 2.40 |
| 3.00 | 2.75 |

### Hybrid allocation

Hybrid defaults to:

```text
50%  Participation
30%  Performance
15%  War contribution
 5%  Support
```

All four percentages are editable. If they do not total exactly 100, RWPH normalises them. If an entire component has no qualifying faction activity, its share is redistributed across the active components so the Member Payout remains fully allocated.

### Adjusted Respect

Respect can be added to **any** Advanced preset through the shared respect controls. **Adjusted Respect Share** simply loads defaults that make respect the primary score and enables:

- Ignore chain-bonus multiplier for respect.
- Apply respect score to war hits only.

If Torn does not expose a usable chain multiplier for a record, RWPH uses the respect value available rather than guessing.

### Turtling / Defence limitation

Turtling / Defence remains a **verified-data proxy**. RWPH does not claim to know true online time, hospital duration, or intentional turtle time. It can only award activity credit from verifiable payable war-hit/assist timestamps in the attack data.

### RWPH Classic Advanced migration

Old saved **Custom Advanced** configurations are migrated to **RWPH Classic Advanced**. If you had manually changed the old Custom Advanced values, RWPH preserves those saved values during the migration instead of overwriting them with a new preset.

RWPH Classic is now just another preset in the shared engine. Select another system to load that system's defaults, or edit Classic's loaded fields directly to customise it.

## Member Management

Basic and Advanced each have a Member Management button.

Member Management allows you to adjust the calculation before the final payout is built. Depending on the mode, you can:

- Exclude a member completely.
- Remove a selected number of payable hits.
- Remove/subtract respect from a member.

Member Management changes are saved locally for approximately **20 minutes** so they can survive panel changes/reopens during the calculation workflow.

Member Management has its own movable/resizable panel and responsive card layout.

---

## Finished-War Data and Calculation Sources

RWPH uses Torn ranked-war report data where available and attack logs where needed.

### Calculation data behaviour

Basic keeps its existing ranked-war-report/attack-log behaviour. All v1.1.465 Advanced presets use the shared attack-data scoring engine so the current editable FF, retal, overseas, respect, hospital and support settings can be applied consistently per tracked contribution.

When Torn exposes a usable ranked-war report for the existing report-backed paths, RWPH can use it for authoritative ranked-war values such as:

- War Hits
- Member participation
- Ranked-war score/respect data
- Total Respect

Attack logs are then used for extras that ranked-war report data does not expose in enough detail, including:

- Assists
- Outside hits
- Retals / retal evidence
- Advanced hospital bonuses
- Fair Fight details

This avoids double-counting report War Hits while still allowing the extra contribution categories needed by RWPH.

If the ranked-war report path cannot be used, RWPH can fall back to attack-log processing where supported.

---

## Calculation Speed and Torn API Handling

RWPH includes several performance protections:

- Preferred `faction/attacksfull` fetch path with up to 1,000 attacks per request where supported.
- Compatibility fallback to the older attack-fetch path.
- 30-minute attack-range memory cache for finished-war data.
- Whole-war attack reuse between Basic and Advanced while Worker memory remains warm.
- Torn API request queueing and retry/backoff handling.
- Default Torn request spacing of 700 ms.
- Duplicate backend request coalescing in the userscript.
- A single calculation-progress poller instead of duplicate polling.
- Cache checks only for the calculation mode currently being used.

If Torn rate-limits a request, RWPH is designed to pause/retry rather than immediately failing where possible.

---

## Report Cache

Finished calculation reports can be stored in the backend/MySQL report cache.

Current behaviour:

- Basic and Advanced caches are separate.
- Advanced cached reports are additionally isolated by **Calculation System**, so one preset can never be opened as another preset.
- Cache matching includes the relevant calculation mode/system/settings.
- Member Payout / Total Payout edits do not unnecessarily trigger repeated cache lookups.
- **Use Cached Report** opens a matching database-backed cached report.
- **Delete Cache** deletes the matching report.
- A successful cache delete is limited to **one every 10 minutes per user**.
- Default backend report cache TTL is **24 hours** (`REPORT_CACHE_TTL_MS=86400000`).
- Browser-only report fallback is not used as the authoritative cached report store.

The backend can still use temporary Worker memory caches for short-lived Torn/calculation data; persistent report cache data is stored in MySQL.

---

## Results and Loading Panel

When Calculate is pressed, RWPH opens its loading/results workflow.

The loading panel shows the calculation progressing through stages such as:

1. Licence/server verification.
2. Backend/database report-cache check.
3. Fetching and sorting war hits, outside hits, retals, assists, and other required data.
4. Applying Basic weights or Advanced points and splitting the Member Payout.
5. Building the final results page/tools.

The elapsed timer continues beyond 59 seconds.

Closing/cancelling the loading workflow can request backend calculation cancellation where supported.

The results view can include:

- War/member summary information
- War Hits
- Assists
- Outside Hits
- Retaliation Hits
- Respect / Total Respect
- Basic weight or Advanced points
- Member payout amount
- Warnings/calculation-source notes
- Excluded/adjusted member information
- Payments / export / newsletter helper controls

Always review the report before paying members.

---

## Payments Copy Panel

The Payments tool is a manual payout helper.

It can provide member rows containing:

- Torn name + ID
- Payout amount
- Copy/prefill helpers

The panel requires **Accept Warning** before payment-copy/prefill controls unlock.

On PDA/phone RWPH uses fallbacks intended to reduce unwanted software-keyboard focus while filling/copying payment information.

The Payments panel does not send cash automatically and does not confirm a Torn payment for you.

---

## Payout Amount Input

Payout fields accept normal numbers and shorthand values such as:

```text
100000000
100m
346.21m
4.5b
1t
```

RWPH formats valid payout values as currency with commas.

---

## Theme / Colours and Logo Selector

RWPH includes UI customisation without changing the calculation rules.

### Theme / Colours

- Built-in colour themes.
- Custom colour picker.
- Theme colours are applied across main/floating panels, cards, buttons, inputs, popups, Member Management, Payments, and Results.

### Logo Selector

- Select from the supplied RWPH logo choices.
- The selected logo is reused on the launcher and RWPH panels.
- Transparent wide logos are used rather than forcing a square crop.

---

## Movable / Resizable Panels

Supported floating panels can be moved and resized.

The resize system also scales panel text with panel size and saves the resulting layout/scale locally.

This applies to the main RWPH panel and supported helper panels such as:

- Results/loading
- Payments Copy Panel
- Member Management
- Xanax Payment Helper
- Theme / Colours
- Logo Selector
- Licence/info panels

Phone/PDA layouts have additional sizing and launcher handling so the UI remains usable on smaller displays.

---

## Launcher Behaviour

RWPH detects supported Torn faction/faction-war pages and mounts its launcher near the Torn **Faction Warfare** header area.

Desktop and PDA/mobile use different fitting logic so the launcher remains in the page/header flow rather than becoming a permanently floating screen overlay.

The selected RWPH logo is used by the launcher.

---

## Help and Tutorial

The built-in Help tab includes dropdown sections covering:

- Step-by-step tutorial
- Fast start
- Basic Calculations
- Advanced Calculations
- Licence/payment flow
- Results/loading
- Payments
- API key use
- Backend/server information
- Troubleshooting

First-time users may be shown the tutorial automatically on supported Torn faction pages.

---

## Admin Tools

Admin tools are available from both locked and unlocked RWPH panels when a valid admin key is supplied.

Current admin functions include:

- Save/check Admin Key
- Server/backend status
- List licences
- Grant licence
- Extend licence
- Remove licence days
- Owner grant helper
- Fill selected licence/user information into the admin form

Admin routes are protected by the Cloudflare Worker secret:

```text
RWPH_ADMIN_KEY
```

Keep this secret private.

---

## API Key and Privacy Behaviour

RWPH uses a Torn API key to read the Torn data required for licence identity checks and ranked-war calculations.

The script may use the key for:

- Torn user identity
- Faction/member information
- Ranked-war information
- Ranked-war report data
- Attack data required for the selected calculation

When **Save Key** is used, the API key is stored locally in userscript/browser storage on that device.

The key is sent to the configured RWPH backend only when required for licence/report/calculation functionality. It is not intended to be stored as a persistent user API-key column in the MySQL licence database.

RWPH never needs your Torn password.

See `RWPH_PRIVACY_AND_API_KEY_TERMS.md` for the package's detailed API-key/privacy terms.

---

## Backend Database

The normalized MySQL backend uses the following persistent tables:

1. `rwph_users`
2. `rwph_licences`
3. `rwph_licence_metadata`
4. `rwph_payment_challenges`
5. `rwph_payments`
6. `rwph_trials`
7. `rwph_report_cache`
8. `rwph_report_cache_delete_cooldowns`
9. `rwph_settings`
10. `rwph_admin_actions`
11. `rwph_runtime_meta`
12. `rwph_config`
13. `rwph_schema_migrations`

Short-lived calculation progress, temporary export data, Torn response caches, attack-fetch caches, and rate-limit buckets can remain in Worker memory because they are temporary rather than authoritative persistent user data.

The expected standalone schema marker is:

```text
1.1.454-mysql-normalized
```

---

## Backend Owner Setup

### Recommended automatic setup

1. Extract this package.
2. Open the `backend` folder.
3. Run `RWPH_Wrangler_Auto_Setup.bat` on Windows.
4. Choose **1 - FIRST-TIME FULL SETUP + DATABASE INSTALL**.
5. Confirm/create the Hyperdrive binding.
6. Configure the Torn payment receiver.
7. Set the required Worker secrets.
8. Install/verify the MySQL schema.
9. Deploy the Worker.
10. Verify `/health` and `/db-test`.

### Required Worker secrets

```text
RWPH_LICENSE_SECRET
RWPH_ADMIN_KEY
RWPH_OWNER_TORN_API_KEY
```

### Important Worker settings

The supplied `backend/wrangler.jsonc` currently includes settings such as:

```text
RWPH_REQUIRED_ITEM_ID=206
RWPH_REQUIRED_ITEM_NAME=Xanax
RWPH_REQUIRED_ITEM_QTY=1
RWPH_XANAX_DAYS=15
REPORT_CACHE_TTL_MS=86400000
ATTACK_FETCH_CACHE_TTL_MS=1800000
TORN_API_MIN_INTERVAL_MS=700
TORN_API_MAX_RETRIES=6
```

If your Cloudflare Hyperdrive ID differs from the packaged value, update it using the supplied setup tools before deployment.

### Health checks

After deployment, check:

```text
/health
/db-test
```

A correct `/db-test` should report no missing required tables and the expected standalone schema marker.

---

## Package Contents

| Path | Purpose |
| --- | --- |
| `rwph.user.js` | Main userscript installed by RWPH users. |
| `README.md` | Current feature/setup overview. |
| `RWPH_PRIVACY_AND_API_KEY_TERMS.md` | Privacy/API-key handling terms. |
| `TAKEOVER_INSTALL.md` | Standalone Cloudflare/MySQL takeover deployment guide. |
| `VERSION.txt` | Package/userscript version information. |
| `rwph_launcher_logo_256.png` | Packaged RWPH launcher/logo asset. |
| `backend/src/index.js` | Cloudflare Worker backend. |
| `backend/wrangler.jsonc` | Worker/Hyperdrive configuration. |
| `backend/schema.sql` | Full normalized MySQL schema. |
| `backend/migrations/takeover_existing_rwph_database.sql` | Migration/takeover schema for an existing RWPH database. |
| `backend/BACKEND_SETUP.md` | Detailed backend setup notes. |
| `backend/MYSQL_DATABASE_SETUP.md` | Detailed MySQL table/setup notes. |
| `backend/RWPH_Wrangler_Auto_Setup.bat` | Windows setup/deployment helper. |
| `backend/scripts/*` | Hyperdrive/database setup, diagnostics, config, and legacy import scripts. |
| `backend/test-standalone.mjs` | Standalone backend test suite. |
| `legacy-original/paywall-db.json` | Old JSON state included only for optional migration/import. |
| `legacy-original/ORIGINAL_README.md` | Archived original README/reference. |

Normal users usually only need `rwph.user.js`.

---

## Security Notes

Keep the following private:

- Torn API keys
- `RWPH_OWNER_TORN_API_KEY`
- `RWPH_LICENSE_SECRET`
- `RWPH_ADMIN_KEY`
- Database credentials / Hyperdrive origin credentials
- Private database backups

Recommended practices:

- Use long random values for licence/admin secrets.
- Never commit secrets to a public GitHub repository.
- Do not hard-code private MySQL credentials in the userscript.
- Use Cloudflare Worker secrets for sensitive backend values.
- Keep Aiven/MySQL access restricted.
- Back up the MySQL database before major migrations/admin changes.
- Rotate a secret immediately if it is exposed.

---

## Troubleshooting

### RWPH says it cannot reach the backend

Check:

- The Worker is deployed.
- `/health` responds successfully.
- `PAYWALL_API_BASE` in `rwph.user.js` points to the correct Worker URL.
- The userscript `@connect` entry allows that backend domain.
- The Worker has all required secrets.
- Hyperdrive can reach the MySQL database.

### `/health` says `configuration-required`

At least one required Worker secret is missing. Configure:

```text
RWPH_LICENSE_SECRET
RWPH_ADMIN_KEY
RWPH_OWNER_TORN_API_KEY
```

Then redeploy/check again.

### `/db-test` reports missing tables

Run the database installer/schema again:

- `RWPH_Wrangler_Auto_Setup.bat` database-install option, or
- `backend/schema.sql`, or
- `backend/migrations/takeover_existing_rwph_database.sql` for an existing RWPH database.

### Calculation is slow

Calculation time depends mainly on the amount of Torn attack data that must be fetched and Torn API availability.

Try:

- Reusing a cached finished report when available.
- Using **Basic Fast Mode** when attack-log extras are not needed.
- Re-running Basic/Advanced while the Worker attack cache is still warm.
- Checking that the deployed backend is v1.1.457-compatible or newer so `attacksfull` and fixed attack-range caching are active.

### Torn rate-limit message

RWPH queues Torn API requests and retries with backoff. Avoid repeatedly restarting calculations while a large report is already running.

### Cached report button is disabled

Open the correct Basic/Advanced section and make sure the API key, war time/settings, and mode match an existing cached report. Basic and Advanced caches are checked independently.

### Delete Cache is temporarily blocked

A successful report-cache deletion is limited to one every 10 minutes per user.

### Launcher does not appear

Check that:

- The userscript is enabled.
- You are on a supported Torn faction/faction-war page.
- You do not have an older duplicate RWPH userscript also running.
- Refresh the faction page after installing/updating the script.

### Payment helper cannot confirm a Xanax payment

Check that:

- The payment code has not expired.
- The exact payment code was included.
- The correct receiver received the Xanax.
- The owner's Torn API key can see the required item-transfer data.
- The backend Worker and database are healthy.

---

## Updating RWPH

For a userscript-only release:

1. Replace/update `rwph.user.js` in Tampermonkey/Violentmonkey/Torn PDA.
2. Refresh Torn.

For a backend release:

1. Update the files in `backend`.
2. Run the backend checks/tests.
3. Deploy with Wrangler/the supplied setup helper.
4. Verify `/health` and `/db-test`.

Versions **1.1.459–1.1.461** are userscript/UI changes built on the v1.1.457 calculation/backend behaviour, so an already-deployed compatible v1.1.457 backend does not need to be redeployed solely for the Advanced help-button changes.

Version **1.1.463** keeps the current production Worker address and performs a conservative userscript-only cleanup. No backend redeploy is required for v1.1.463 alone.

Version **1.1.464** introduced the selectable payout-system engine. Version **1.1.465** changes those systems into preset loaders for one shared editable settings engine and fixes the Results variable error. **Redeploy the supplied v1.1.465 backend** before using the shared Advanced settings.

---

## Responsible Use

RWPH is not an official Torn product.

Use it in accordance with:

- Torn's rules and API rules.
- Your faction's payout policies.
- Your own server/security requirements.

RWPH produces calculation assistance, not a guarantee that every payout configuration is correct for your faction. Review the report before paying anyone.

---

## Current Version Summary — v1.1.465

RWPH v1.1.465 currently combines:

- Standalone Cloudflare Worker + Aiven MySQL backend.
- Backend-verified licences and Xanax payment challenges.
- One-time 7-day trial.
- Basic per-hit calculations and Basic Fast Mode.
- **12 Advanced preset choices feeding one shared editable settings panel.**
- No separate Custom Advanced mode; edit any preset's loaded values to customise it.
- **RWPH Classic Advanced** migration/preset for old Advanced users.
- Optional `?` Advanced setup guide inside the Advanced header.
- Member Management with recalculation after exclusions/hit/respect adjustments.
- Advanced per-attack scoring for FF, retals, overseas hits, respect, hospital adjustments, Hybrid allocation, and Defence activity credit.
- Faster `attacksfull` retrieval with compatibility fallback and warm attack-range reuse.
- Backend/database cached reports with system + customised-settings isolation.
- Cached-report deletion cooldown.
- Results/loading workflow and Payments Copy Panel.
- Export/newsletter helpers.
- Theme / Colours and Logo Selector.
- Movable/resizable panels with resize-based text scaling.
- Desktop/PDA/phone launcher/layout handling.
- Admin licence tools.
- Reduced unnecessary backend polling/requests.
- Fix for the v1.1.464 Results error `includeLeftFactionMembers is not defined`.

