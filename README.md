# Ranked War Payout Helper — RWPH

<p align="center">
  <a href="https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/campbell996/RWPH/refs/heads/main/rwph.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update the RWPH userscript.</strong></p>

**Ranked War Payout Helper (RWPH)** is a Torn userscript with a standalone Cloudflare Worker + MySQL backend for calculating ranked-war payouts, managing licences, caching finished reports, and helping faction leaders prepare manual payments.

Current userscript version: **1.1.461**  
Userscript name: **Ranked War Payout Helper**  
Namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**

> **Important:** RWPH is a manual helper. It does not automatically attack, send cash, send items, confirm Torn payments, buy, sell, or perform gameplay actions for you. Always review results and manually confirm Torn actions yourself.

---

## What Changed Recently

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

Advanced mode gives members contribution points and splits the **Member Payout** according to each member's share of the final points.

The normal Advanced view is compact. Click the small **`?`** button in the Advanced Calculations header to show the detailed setup guide. Click it again to return to the compact view.

### Recommended/default Advanced values

| Setting | Default |
| --- | ---: |
| War hit | 10 points |
| Assist | 3 points |
| Outside hit | 2 points |
| War-faction retal bonus | +0.2 points |
| Own-faction hospital bonus | +2 points |
| Enemy war-faction hospital bonus | -1 point |
| Respect score | +0.01 point per 0.01 respect |
| Fair Fight | Enabled |
| Avg FF step | +0.02 |
| FF point bonus | +0.01 per payable hit per step |
| Avg FF cap | 3.00 |

### Retal handling in Advanced mode

- A retal against the war faction still counts as the normal **War Hit** and then receives the configured **retal bonus**.
- A retal against a non-war faction is treated as an **Outside Hit**.

### Hospital bonuses

Advanced mode can apply extra points for verified hospitalizing results:

- Own-faction hospital bonus defaults to **+2**.
- Enemy war-faction hospital bonus defaults to **-1** and may be changed to a negative, zero, or positive value.

### Respect Score

The default Advanced Respect Score is:

```text
+0.01 point for every 0.01 respect earned
```

Example: 2.50 respect adds 2.50 Advanced points with the default values.

Set **Respect score to add** to `0` if you do not want respect to affect Advanced payouts.

### Fair Fight bonus

With defaults:

- Avg FF 1.00 = no FF bonus.
- Every +0.02 Avg FF above 1.00 = one bonus step.
- Each step adds +0.01 point per payable hit.
- Avg FF is capped at 3.00 for this bonus.

Example: Avg FF 1.40 is 0.40 above 1.00. At 0.02 per step, that is 20 steps, giving +0.20 points per payable hit.

Untick **Use fair-fight modifier** to disable the FF bonus entirely.

### Advanced setup guide

Clicking the `?` button reveals explanations, worked examples, recommended values, and **Restore Recommended Defaults**.

Restore Recommended Defaults resets only the Advanced scoring settings and Fair Fight option. It does **not** change:

- War times
- Member Payout
- Total Payout
- Member Management adjustments

---

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

### Hybrid calculation behaviour

When Torn exposes a usable ranked-war report, RWPH can use it for authoritative ranked-war values such as:

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
- Cache matching includes the relevant calculation mode/settings.
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

---

## Responsible Use

RWPH is not an official Torn product.

Use it in accordance with:

- Torn's rules and API rules.
- Your faction's payout policies.
- Your own server/security requirements.

RWPH produces calculation assistance, not a guarantee that every payout configuration is correct for your faction. Review the report before paying anyone.

---

## Current Version Summary — v1.1.461

RWPH v1.1.461 currently combines:

- Standalone Cloudflare Worker + Aiven MySQL backend.
- Backend-verified licences and Xanax payment challenges.
- One-time 7-day trial.
- Basic per-hit calculations.
- Basic Fast Mode.
- Advanced points calculations.
- Optional `?` Advanced setup guide inside the Advanced header.
- Member Management.
- Ranked-war report + attack-log hybrid processing.
- Faster `attacksfull` attack retrieval with compatibility fallback.
- Warm attack-range reuse between calculations.
- Backend/database cached reports.
- Cached-report deletion cooldown.
- Results/loading workflow.
- Payments Copy Panel.
- Export/newsletter helpers.
- Theme / Colours and custom colour picker.
- Logo Selector.
- Movable/resizable panels with resize-based text scaling.
- Desktop/PDA/phone launcher/layout handling.
- Admin licence tools.
- Reduced unnecessary backend polling/requests.

