# RWPH Privacy and API Key Terms

Version: **1.1.249**

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
- The old Total payout pool control is now named **Member Payout** in both Per Hit Settings and Points System Settings.
- Each mode now also has a **Total Payout** field for showing the full payout record amount in result tabs and newsletters.
- Member Payout remains the amount used to calculate member rows and payment-copy amounts.
- Backend/database cached report signatures include Total Payout so different payout records do not reopen the wrong cached result.

## v1.1.237 Dropdown Cache Button Layout Update
- Per Hit cache controls now live inside the Per Hit Settings dropdown.
- Points System cache controls now live inside the Points System Settings dropdown.
- Both cache-open buttons are named Use Cached Report.
- Both cache-delete buttons are named Delete Cache.

## v1.1.235 Dual Cache + Payments Handoff Update
- Per Hit and Points System results now have separate backend/database cache checks and separate open/delete controls in the panel.
- Cached report opens remain backend/database-only; browser-saved reports are not accepted as the source of truth.
- Cached Per Hit and cached Points reports both preserve payout rows for the manual Payments Copy Panel.
- The one-successful-delete-per-10-minutes cache-delete limit still applies.

## v1.1.234 Calculate Button + Hybrid Points Update
- The normal per-hit calculation button now sits inside **Per Hit Settings** and is named **Calculate**.
- The Points System calculation button now sits inside **Points System Settings** and is named **Calculate**.
- Points System results now use the same hybrid source as the normal result when Torn exposes a ranked-war report: rankedwarreport for war hits/score/total respect, plus attack logs for assists, outside hits, retals, own-faction hospital bonuses, and fair-fight modifier details.
- If rankedwarreport is unavailable, Points System mode falls back to attack-log-only point scoring.

## v1.1.233 Per Hit Settings Dropdown Update
- The normal per-hit weight controls now sit inside a **Per Hit Settings** dropdown.
- The dropdown styling now matches the main panel theme and the Points System Settings styling.
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

RWPH lets licensed users delete a matching backend/database cached report for the latest finished ranked war and current payout settings. This action only affects backend/database cached report data. Browser-saved reports are not used as trusted cache data. To protect the server from spam or accidental repeated deletion, a user can successfully delete only one cached report every 10 minutes.


## v1.1.237 layout note

The Member Payout and Total Payout fields now appear inside both calculation settings dropdowns. Per Hit and Points System cache checks use the values from their matching dropdown.

## v1.1.239 layout note

The public performance/cache status message now appears inside both calculation settings dropdowns instead of below them in the main panel. Each dropdown shows cache auto-check status beside its own Calculate, Use Cached Report, and Delete Cache controls.


## v1.1.240 Results/cache-status update

Per Hit result tabs and newsletter templates show Per Hit Amount. Cache-found status text is now mode-specific so the Points System Settings dropdown only reports matching Points System cached reports and the Per Hit Settings dropdown only reports matching Per Hit cached reports.


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
