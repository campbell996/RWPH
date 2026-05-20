# RWPH Privacy and API Key Terms

Version: **1.1.276**

These terms explain how Ranked War Payout Helper, also called **RWPH**, uses Torn API keys, licence data, payment data, and ranked-war calculation data. RWPH is a manual payout calculator and copy/prefill helper. It is not an official Torn product.

---

## Important Manual-Use Notice

RWPH does **not** send items, send cash, confirm payments, attack, buy, sell, travel, or perform Torn gameplay actions automatically. Users must manually review and confirm all Torn actions inside Torn.

RWPH can calculate payout results, prepare payment rows, copy payment details, prefill some Torn fields where available, and create exports/newsletter text. The user/faction remains responsible for checking results before making any Torn payments.

---

## Purpose of Torn API Key Use

RWPH asks for a Torn API key so it can perform the checks and calculations needed by the tool. Depending on the action being used, this may include:

- Verifying the user's Torn ID and name.
- Verifying faction/ranked-war access where required.
- Fetching faction/member names and IDs.
- Fetching ranked-war timing where available.
- Fetching attack records inside the selected ranked-war time window.
- Checking licence status, trial status, and payment/licence extension status.
- Sending the required calculation data to the configured RWPH backend so payouts can be calculated server-side.

RWPH does **not** need the user's Torn password. Users should never enter a Torn password into RWPH.

---

## Recommended API Key Access Level

Users should use a Torn API key with only the access needed for faction and ranked-war payout calculations. A full-access key should not be provided unless the user fully understands and accepts the risk.

If a key is no longer needed, or if the user no longer wants RWPH to use it, the user should revoke or rotate the key from Torn's API key settings.

---

## Local API Key Storage

When a user clicks **Save Key**, the userscript stores the Torn API key locally in that user's browser/Tampermonkey/Torn PDA userscript storage on that device.

Local storage means:

- The saved key is intended to stay on the user's device.
- Clearing userscript/browser storage may remove the saved key.
- Anyone with access to the same browser profile/device may be able to use the saved RWPH session.

Users who do not want the key saved locally can paste the key when needed instead of using **Save Key**.

---

## Backend API Key Handling

The user's API key may be sent to the configured RWPH backend during unlock, trial, licence, payment, war-time, and payout calculation requests. This allows the backend to call Torn's API and run protected server-side logic.

The backend is not designed to save user API keys inside `paywall-db.json`. Server owners should still avoid logging API keys and should protect server logs, hosting dashboards, backups, crash reports, and any request inspection tools that could expose sensitive data.

---

## Backend Stored Data

The backend database, normally `paywall-db.json` or the path set by `DB_FILE`, may store operational data needed for licences and payment verification. This can include:

- Torn IDs and Torn names.
- Licence expiry times.
- Trial-use records.
- Payment codes.
- Used payment records or payment fingerprints.
- Required item/payment quantities.
- Bonus progress or milestone records.
- Revoked users or removed licence records.
- Admin-created licence grants/extensions/removals.
- Completed-war report cache entries used to reopen/reuse matching payout reports.

Completed-war report cache entries are intended to expire and be deleted from the backend/database automatically after 24 hours by default. This data is used to operate RWPH's licence, payment, trial, cache, calculation, and admin systems.

---

## Data Not Intended To Be Stored

RWPH is not designed to store:

- Torn passwords.
- User API keys inside `paywall-db.json`.
- Automatic Torn cash/item send confirmations.
- Hidden gameplay actions.

Server owners should not modify RWPH to collect unnecessary private information.

---

## Data Sharing

RWPH data should be used only to operate the tool, verify licences/payments, and calculate ranked-war payouts. User API keys, licence records, payment records, faction/member data, and payout results should not be sold, posted publicly, or shared with unrelated third parties.

Faction officers or server owners may share payout exports/results within their faction where appropriate, but they should still avoid exposing unnecessary API key, server, or licence information.

---

## Owner / Server Host Responsibility

The person hosting the RWPH backend is responsible for protecting server-side files and secrets, including:

- `.env`
- `OWNER_TORN_API_KEY`
- `ADMIN_KEY`
- `PAYWALL_SECRET`
- `paywall-db.json` or the configured `DB_FILE` path
- Server logs and backups
- Hosting provider access

The owner should use long random secrets, keep the server updated, restrict admin access, and avoid sharing owner/server-side files with normal users unless they are intended to host their own backend.

---

## User Responsibility

Users are responsible for:

- Providing an appropriate Torn API key.
- Reviewing payout results before paying.
- Manually confirming any Torn cash/item actions.
- Revoking or rotating their API key if they stop using RWPH.
- Following Torn rules and their faction's rules.

---

## No Official Torn Affiliation

RWPH is a community-made tool and is not an official Torn product. Use it only in ways that follow Torn rules, Torn API rules, your faction rules, and your own server/licence setup.


## Report Cache and Public Server Protection

RWPH may save completed-war report results in the backend JSON database so the same faction, finished war, Member Payout, Total Payout, and weight settings can be reused without recalculating. This reduces Torn API pressure and server load. Cached reports contain calculated payout output and report metadata; they are not designed to store user Torn API keys. The backend also uses route rate limits, per-user cooldowns, direct-start calculations and short in-memory Torn API caching to keep public hosting stable.

Storage remains JSON in this version. MySQL is not enabled yet.


## v1.1.219 Cache and Licence Check Update

RWPH no longer uses an old Fetch + Calculate time lock after successful reports. If a matching cached report exists, the panel tells the user in a popup and the user can open it with the matching Per Hit or Points cached-report button. Browser-saved report fallback is disabled: cached reports are only opened when the backend/database has a matching report. Cached reports are automatically deleted from the backend/database after 24 hours. Licence verification/check requests are limited to 2 checks per minute per identity to reduce abuse and protect the backend.


## v1.1.219 Database-Only Cached Report Update

RWPH no longer reopens old browser-saved payout reports as a cache fallback. Cached-report open buttons only work when the backend/database report cache returns a matching completed-war report. Old local last-results data is cleared by the userscript after updating. Cached reports are also pruned from the backend/database on startup and on a scheduled cleanup timer after the 24-hour expiry window.


## v1.1.220 Panel Layout Update

The cached report controls are now positioned directly below **Fetch + Calculate** in the payout panel, and the launcher corner control is named **Launcher Movement**. This is a layout/name change only and does not change the backend/database-only cached report privacy behaviour.


## v1.1.224 Cache Timestamp Display Update

RWPH now shows cached report status using exact saved and expiry timestamps instead of a countdown-style expiry timer. Cached reports are still backend/database-only and still expire/delete after 24 hours.

## v1.1.221 Loading Results and Cache Status Update

The loading/results tab now uses the same midnight-blue RWPH card style as the public cache/admin controls. It explains completed-war-only calculation, database-only cached reports, 24-hour cache expiry, direct-start loading and API retry behaviour. Cached-report status text is also updated as soon as the backend/database confirms a matching report, so users are not told there is no report when one exists.

## v1.1.224 Payment and Cached Report Handling

- Payments Copy Panel may open from a backend/database cached payout report.
- Xanax Payment Helper can restore the current pending payment code from the backend/database.
- Xanax/payment checks are always re-checked live through the backend/Torn API before licence days are added.
- Browser-only cached licence or payment status is not accepted as final proof of payment or licence time.
- Payment helper actions remain manual copy/prefill only. Users must still review and confirm all Torn actions themselves.



## v1.1.224 Pending Payment Helper Update

RWPH may restore an active pending Xanax payment code from the backend/database so users do not accidentally create multiple payment codes. The browser can display and reopen that pending helper, but it is not accepted as proof of payment. Payment/licence status is still verified live through the backend/Torn API before any licence time is added.


## v1.1.225 Licence Check and Payments Copy Panel Update

The **Your Expiration** button is limited in the browser to two manual checks per minute and the backend also rate-limits licence verification. This reduces repeated licence-check traffic and helps protect the RWPH server.

Payments Copy Panel buttons are hidden after use with a forced hidden state so users can more reliably track which payout copy actions have already been used. The restore button only brings back the most recently hidden payment-copy button.



## v1.1.239 Member/Total Payout Update
- The old Total payout pool control is now named **Member Payout** in both Basic Calculations and Advanced Calculations.
- Each mode now also has a **Total Payout** field for showing the full payout record amount in result tabs and newsletters.
- Member Payout remains the amount used to calculate member rows and payment-copy amounts.
- Backend/database cached report signatures include Total Payout so different payout records do not reopen the wrong cached result.

## v1.1.237 Dropdown Cache Button Layout Update
- Per Hit cache controls now live inside the Basic Calculations dropdown.
- Points System cache controls now live inside the Advanced Calculations dropdown.
- Both cache-open buttons are named Use Cached Report.
- Both cache-delete buttons are named Delete Cache.

## v1.1.235 Dual Cache + Payments Handoff Update
- Per Hit and Points System results now have separate backend/database cache checks and separate open/delete controls in the panel.
- Cached report opens remain backend/database-only; browser-saved reports are not accepted as the source of truth.
- Cached Per Hit and cached Points reports both preserve payout rows for the manual Payments Copy Panel.
- The one-successful-delete-per-10-minutes cache-delete limit still applies.

## v1.1.234 Calculate Button + Hybrid Points Update
- The normal per-hit calculation button now sits inside **Basic Calculations** and is named **Calculate**.
- The Points System calculation button now sits inside **Advanced Calculations** and is named **Calculate**.
- Points System results now use the same hybrid source as the normal result when Torn exposes a ranked-war report: rankedwarreport for war hits/score/total respect, plus attack logs for assists, outside hits, retals, own-faction hospital bonuses, and fair-fight modifier details.
- If rankedwarreport is unavailable, Points System mode falls back to attack-log-only point scoring.

## v1.1.233 Basic Calculations Dropdown Update
- The normal per-hit weight controls now sit inside a **Basic Calculations** dropdown.
- The dropdown styling now matches the main panel theme and the Advanced Calculations styling.
- This is a UI/layout update only and does not change what data is read or sent.

## v1.1.232 Points System Hospital Bonus Update

- Points System hospital bonus points now only apply when the hospitalized target is verified as one of your own faction members.
- Hospital results against non-verified targets are still detected for backend warnings, but they do not add hospital bonus points.
- Help/results labels now describe the value as an own-faction hospital bonus.

## v1.1.231 Reliability Hardening Update

- Payments row handoff now has an extra browser fallback so cached/fullscreen result tabs can pass rows to the Payments Copy Panel more reliably.
- Payment-copy buttons still disappear after use even if clipboard access is blocked by the browser.
- The Xanax Payment Helper tries to restore the current pending code from the backend/database on the item tab before showing helper actions.

## v1.1.229 Help Panel Information Update

The in-panel Help section was updated to describe the current cache/payment behaviour more clearly:

- Cached payout reports are backend/database-only and expire after 24 hours.
- Use Cached Report inside the matching settings dropdown opens matching backend/database cached reports.
- Delete Cache inside the matching settings dropdown removes the matching backend/database cached report and is limited to one successful delete every 10 minutes per user.
- Payments Copy Panel can use current results or database cached reports.
- Payments Copy Panel buttons hide after use, and Bring Back Disappeared Button restores only the most recently hidden button.
- Xanax licence payment codes can be recovered from the backend/database while pending, but payment/licence status still requires live backend verification.
- Manual Your Expiration checks are limited to 2 per minute.

## v1.1.228 Results Panel Layout Update

The fullscreen Fetch + Calculate results page now uses a report-header layout, a dedicated actions/export side panel, a summary card strip, and a main member payout area. This is a layout/UI change only and does not change the manual-only payment rules, backend/database cache rules, API-key handling, or licence verification rules.

## v1.1.226 Results Panel Theme Update

- The fullscreen Fetch + Calculate results panel was restyled to match the main RWPH midnight-blue panel theme.
- This is a visual/layout update only. It does not change what data is collected, saved, verified, or cached.
- Payments remain manual-only and cached reports still come only from the backend/database.


## Cached Report Deletion

RWPH lets licensed users delete a matching backend/database cached report for the latest finished ranked war and current calculation mode/settings. This action only affects backend/database cached report data. Browser-saved reports are not used as trusted cache data. To protect the server from spam or accidental repeated deletion, a user can successfully delete only one cached report every 10 minutes.


## v1.1.237 layout note

The Member Payout and Total Payout fields now appear inside both calculation settings dropdowns. Per Hit and Points System cache checks use the values from their matching dropdown.

## v1.1.239 layout note

The public performance/cache status message now appears inside both calculation settings dropdowns instead of below them in the main panel. Each dropdown shows cache auto-check status beside its own Calculate, Use Cached Report, and Delete Cache controls.


## v1.1.240 Results/cache-status update

Per Hit result tabs and newsletter templates show Per Hit Amount. Cache-found status text is now mode-specific so the Advanced Calculations dropdown only reports matching Points System cached reports and the Basic Calculations dropdown only reports matching Per Hit cached reports.


## v1.1.251 Results/export/newsletter layout and stat alignment

- Cleaned up visual spacing/readability in both result tabs without changing calculations or the existing result layout structure.
- Aligned CSV export columns and newsletter stat tables so Per Hit and Points System reports show matching stat names and values.
- Cleaned up newsletter table readability without changing newsletter themes or report flow.

## v1.1.249 Results card layout cleanup

The fullscreen Per Hit and Points System result tabs now use a cleaner member-card layout. This is a display-only change and does not change API-key storage, Torn API usage, payout calculations, cache handling, or manual-only payment rules.

## v1.1.248 Default enemy hospital bonus update

The default Enemy war faction hospital bonus points value is now -1. The field can still be changed by the user and can be positive or negative. This update does not change API-key storage, licence checks, or manual-only payment rules.

## v1.1.247 Avg FF fair-fight bonus update

Points System fair-fight scoring now uses editable stepped Avg FF bonus settings per payable hit. Avg FF 1.00 gives no bonus; every configured Avg FF step over 1.00 adds the configured point bonus per payable hit. Defaults remain +0.02 Avg FF required and +0.01 point per payable hit per step. Avg FF is capped at 3.00, and if the fair-fight checkbox is off no fair-fight bonus points are added. This replaces the older attack-point multiplier behaviour.

## v1.1.244 Cache button reliability update

Use Cached Report now opens through a dedicated backend cache-open route instead of re-entering the normal calculation route. Per Hit and Points System each fetch only their own cached report, and the results tab pre-opens immediately from the button click to reduce browser/Torn PDA popup blocking.


## v1.1.244 Points/hospital bonus and fixed per-hit toggle update

Points System reports can separately show enemy war faction hospital hits and enemy faction hospital bonus points. Per Hit settings now use fixed 1-per-hit include/exclude tick boxes instead of editable numeric weights.


Enemy war faction hospital bonus can be positive or negative so enemy ranked-war faction hospitalisations can add or subtract contribution points.


## v1.1.244 Loading/results queue removal update

RWPH no longer puts result-tab calculations into a report queue. The loading/results tab now starts the selected calculation directly. Backend/database cached reports, route rate limits, cooldowns, and Torn API retry/backoff protection remain in place.


## v1.1.251 Results/newsletter payout display cleanup

- Fullscreen result tabs no longer show Member Payout, Total Payout, or Members Paid in the top hero metadata area.
- Points System result summaries and newsletters can display Per Point Amount wording.
- Newsletter CSS was tightened to improve screen fit without changing newsletter themes or calculation behavior.

## v1.1.252 Calculation section rename

The normal per-hit calculation section is now named **Basic Calculations**. The points-based calculation section is now named **Advanced Calculations**. This is a label/help-text update only and does not change payout calculations, cache handling, exports, payments, or API-key storage.

## v1.1.254 Single-bucket calculation update

Basic Calculations and Advanced Calculations now keep assists, retaliation hits, and outside hits separate from War Hits. If a paid assist/retal/extra attack-log event overlaps with a rankedwarreport War Hit for the same member, RWPH removes one report War Hit from that member's calculated result so the same contribution is not counted twice.



## Recent Changelog

### v1.1.276

- Changed all newsletter buttons to open the raw HTML-code panel directly inside the results tab instead of opening the results tab.
- The panel includes raw HTML code, Copy All, Preview in New Tab, and Download HTML Backup.
- Applies to all Basic and Advanced newsletter themes.

### v1.1.275

- Newsletter buttons now open Torn faction newsletter controls instead of downloading HTML files.
- The faction controls page now shows a RWPH raw HTML panel with Copy All, Preview in New Tab, and Download HTML Backup.
- Newsletter generation remains manual-only; RWPH does not send faction newsletters automatically.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.273

- Newsletter main headings now use the user's faction name, for example **Your Faction Payout Newsletter**, instead of the newsletter button/theme name.
- Applied to all Basic and Advanced newsletter styles.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.272

- Rebuilt newsletter output around self-contained inline HTML-code templates for Torn faction newsletters.
- Result tabs now provide a visible HTML-code panel with copy, rendered preview, and download actions for each theme.
- Newsletter generation remains manual-only; RWPH does not send faction newsletters automatically.

### v1.1.269

- Fixed Basic and Advanced newsletter actions so they open a visible copy/export panel instead of relying on clipboard success only.
- Newsletter links now download Torn-safe text if scripts or clipboard permissions are blocked.
- Manual copy remains review-only; RWPH still does not send faction newsletters or payments automatically.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.268

- Fixed newsletter copy actions by adding stronger fallback copying for Torn PDA/browser contexts that block rich clipboard access.
- Newsletter copy now tries rich HTML, rendered-content copy, plain text, and then a manual copy panel.
- Manual copy remains review-only; RWPH still does not send faction newsletters or payments automatically.

### v1.1.267

- Fixed **Removed Left-Member Hits** over-counting in both Basic Calculations and Advanced Calculations by counting only hits that were actually included in that mode's calculation.
- Disabled Basic tickbox categories and zero-point Advanced categories no longer increase the removed-hit stat.
- Bonus-only values are still removed with former members, but they still do not count as removed hits.

### v1.1.266

- Removed former-member bonus points from totals when **Include members who left the faction** is unticked.
- Bonus-only values such as war-faction retal bonus, own-faction hospital bonus, enemy war-faction hospital bonus, and fair-fight bonus are stripped with the former member, but they do **not** increase **Removed Left-Member Hits**.
- Kept **Removed Left-Member Hits** as a unique tracked-hit count only.
- Applied the fix to both Basic Calculations and Advanced Calculations, including cached-report reopening.

### v1.1.265

- Fixed **Removed Left-Member Hits** over-counting by counting unique tracked hits only. Bonus-only stats such as war-faction retal bonus, hospital bonus, and fair-fight bonus are no longer added as extra removed hits.
- Applied the corrected removed-left-member hit counter to both Basic Calculations and Advanced Calculations.
- Updated newsletter output to show the corrected **Removed Left-Member Hits** stat when former members are excluded.

### v1.1.264

- Result tabs now hide **Removed Left-Member Hits** when **Include members who left the faction** is ticked.
- The removed-hit stat still shows when former members are excluded.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.263

- Fixed the removed-left-member hit counter so hybrid Basic and Advanced results count former-member hits after report and attack-log data are merged.
- Updated cache matching version to avoid reusing old cached reports with the incorrect removed-hit total.

### v1.1.262
- Added an off-by-default **Include members who left the faction** checkbox in both Basic Calculations and Advanced Calculations.
- Result tabs now show **Removed Left-Member Hits** so users can see how many tracked hits were excluded when former members are filtered out.
- Cache matching includes this include-left-members setting, while payout amount changes still do not block cached reports.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.261
- Newsletter buttons now copy Torn-safe rich/plain newsletter content for Torn faction newsletters instead of requiring raw HTML source/code.
- Rich HTML clipboard copy is attempted first, with a readable plain-text fallback if the browser or Torn strips styling.
- Help wording now explains that raw HTML/CSS can show as text in Torn faction newsletters.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.260
- RWPH removes former faction members from Basic and Advanced result rows when the current faction member list can be loaded, unless the matching Include members who left the faction checkbox is ticked.
- Current-member filtering also applies when opening compatible cached reports, so result tabs, exports, newsletters, and payment rows stay aligned to the current faction.
- Removed former members are noted in calculation warnings where possible.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.257

- Member Payout is explicitly treated as the member payment calculation pool.
- Total Payout is retained only as display/report metadata for results and newsletters.
- The backend accepts a dedicated `memberPayout` field and prefers it when calculating payment rows, while keeping backwards compatibility for older requests.

### v1.1.256

- Backend/database cached reports can now be opened even if Member Payout or Total Payout fields changed after the report was saved.
- Cache lookup/open/delete still use faction, finished war, calculation mode, and non-payout calculation settings, but payout fields no longer block cache matching.
- Saved cached reports retain their original saved payout values.

### v1.1.255

- Advanced Calculations retals against enemy ranked-war faction opponents now count as War Hits plus a configurable retal bonus.
- The Advanced Calculations retal setting is now **War-faction retal bonus points**, defaulting to **0.2**.
- Non-war-faction retals are classified as Outside Hits.
- This update changes calculation/classification behavior only; it does not change API-key storage, licence checks, payment verification, or manual-only payment rules.

### v1.1.254

- Retaliation Hits now only count as retaliation when the target is in the selected ranked-war enemy faction.
- Retals against non-war-faction targets are no longer paid/classified as Retaliation Hits.
- Basic Calculations and Advanced Calculations still keep assists, eligible retals, and outside hits separate from War Hits to prevent double counting.
- Updated cache-key protection so cached reports do not mix the older retal rules with the new war-faction-only retal rule.

