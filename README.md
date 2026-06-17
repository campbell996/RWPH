# Ranked War Payout Helper

<p align="center">
  <a href="https://github.com/campbell996/RWPH/raw/refs/heads/main/Torn_RW_Payout_Helper_Server_Locked.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update the RWPH userscript.</strong></p>

**Ranked War Payout Helper**, also called **RWPH**, is a Torn userscript and Node.js backend package for calculating faction ranked-war payouts. The userscript gives players a floating Torn panel, while the backend verifies licences, checks item payments, fetches Torn ranked-war data, and calculates payouts server-side.

Current package version: **1.1.419**  
Userscript name: **Ranked War Payout Helper**  
Userscript namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**


### v1.1.419 PDA/phone launcher fix

- PC launcher/header placement is unchanged.
- PDA/phone launcher is forced to a compact logo-only button.
- PDA/phone placement now checks faction header icons, links, hidden labels, image/SVG hints, and top action rows instead of depending only on visible “Faction Warfare” text.
- The old fixed mobile fallback only runs if no usable PDA header/action row can be found.
- This build continues from the v1.1.418 Member Management card-fit patch.


### v1.1.330 manual time/faction-member fixes

- Manual War start/end inputs now control the calculation window instead of being overridden by the latest finished war lookup.
- Cached-report lookup/open/delete also uses the selected manual time window when dates are entered.
- Current faction member filtering now refreshes the live member list for calculations/cache-open, reducing false left-member removals from stale cached member data.

### v1.1.330

- Manual war start/end windows now try to match a faction ranked-war record inside that window.
- When a ranked-war report is matched, War Hits, members, Respect, and Total Respect come from Torn's rankedwarreport instead of attack-log estimates.
- Attack logs are still fetched inside the exact manual start/end window for assists, outside hits, retals, and bonus extras.


---

## Important Notice


RWPH is a manual payout calculator and copy/prefill helper. It does not send items, send cash, confirm payments, attack, buy, sell, travel, or perform Torn gameplay actions automatically. Users must manually review and confirm all Torn actions.


### Points System Results

RWPH now includes an **Advanced Calculations** dropdown with its own **Calculate** button. This opens a new results tab and splits the Member Payout by final contribution score instead of flat per-hit pay. The default score values are:

- War hit on the ranked-war opponent: **10 points**
- War-faction retal bonus: **+0.2 points** by default. War-faction retals still count as War Hits, then add this bonus. Non-war-faction retals count as Outside Hits.
- Assist: **3 points**
- Outside hit / chain-maintenance hit: **2 points**
- Own-faction hospitalizing target bonus: **+2 points**
- Enemy war faction hospitalizing target bonus: **-1 point** by default. This can be changed and can be positive or negative.
- Avg FF bonus: when the fair-fight checkbox is enabled, Avg FF 1.00 gives no bonus; every configured Avg FF step over 1.00 adds the configured point bonus per payable hit. Defaults are +0.02 Avg FF required and +0.01 point per payable hit. Avg FF is capped at 3.00. If the checkbox is off, no fair-fight bonus is added.

The normal per-hit **Calculate** button now lives inside **Basic Calculations** for the existing weighted payout report. Points System mode now uses the same hybrid result source when Torn exposes a ranked-war report: war hits, score, and total respect come from `rankedwarreport`, while assists, outside hits, war-faction retal bonus evidence, own-faction/enemy-faction hospital bonus points, and Avg FF details come from attack logs. If rankedwarreport is unavailable, RWPH falls back to attack-log-only point scoring. Hospital bonus points are only added when the hospitalized target can be verified as one of your own faction members.

### Public Performance Mode

RWPH now protects public servers with completed-war report caching, direct-start calculations, cooldowns, route rate limits, short Torn API memory caching, and admin-only force refresh. Users can open a matching cached report for the same finished war and calculation mode/settings even if Member Payout or Total Payout fields were changed afterward. Storage remains JSON for now; MySQL can be added later without changing the userscript flow.

Before sending Torn money or items, always review the results yourself inside Torn.

This package is not an official Torn product. Use it only in ways that follow Torn rules, your faction rules, and your own server/licence setup.

---

## Requirements

### Browser/User Environment

- Torn in a browser or Torn PDA.
- Tampermonkey, Violentmonkey, or userscript support.
- A Torn API key with the access needed for faction/ranked-war data.
- Access to the faction page where the launcher appears.

### Server Environment

- Node.js **18 or newer**.
- A running backend reachable from the browser/Torn PDA.
- A private `.env` file based on `.env.example`.
- A server URL set in the userscript as `PAYWALL_API_BASE`.
- The backend domain added to the userscript `@connect` metadata.

---

## How to Use the Script

### Unlocking

1. Open a Torn faction page.
2. Click the floating RWPH launcher.
3. Paste your Torn API key.
4. Click **Save Key** if you want it stored locally.
5. Click **Unlock Panel** if you already have a licence.
6. Click **Buy Licence** if you need to pay for a licence.
7. Or click **7 Day Free Trial** if you have not used the trial before.

### Buying or Extending a Licence

1. Click **Buy Licence** or **Extend Licence**.
2. RWPH creates a payment code.
3. Send the configured item to the configured receiver in Torn.
4. Include the exact payment code.
5. RWPH checks for the payment.
6. When verified, your licence unlocks or extends.

### Calculating Payouts

1. Open the unlocked RWPH panel.
2. Confirm your API key is saved or pasted.
3. Use **Auto-fill Last Finished War** to load the latest completed war window.
5. Open **Basic Calculations** or **Advanced Calculations** and set the values you want.
6. Click **Calculate** inside the matching calculation section.
7. Wait for the loading dots/results page.
8. Review all results before paying.

### Exporting Results

After a successful calculation, use:

- **Export CSV** for spreadsheet records.
- **Payments** to open the manual copy/prefill payment helper.

---

## Torn API Key Usage

RWPH asks for a Torn API key because it needs to:

- Verify the user's Torn ID.
- Verify faction/ranked-war access.
- Fetch faction/member names and IDs.
- Fetch ranked-war timing where available.
- Fetch attack records inside the selected war window.
- Send required data to the backend for payout calculation.

When you click **Save Key**, the key is stored locally in browser/Torn PDA userscript storage.

The backend is not designed to save user API keys inside `paywall-db.json`. Server owners should still avoid logging API keys and should protect server logs, `.env`, and backups.

RWPH does not need your Torn password.

---

## What Is Included

The zip package contains both the public userscript file and the owner/server-side files.

| File | Who it is for | Purpose |
| --- | --- | --- |
| `Torn_RW_Payout_Helper_Server_Locked.user.js` | **Users / members** | The Tampermonkey/Torn PDA userscript. This is the main file users install to open the RWPH panel on Torn faction pages. |
| `README.md` | **Users and owner** | This guide. It explains what RWPH does, what is included, safe-use notes, and troubleshooting information. |
| `RWPH_PRIVACY_AND_API_KEY_TERMS.md` | **Users and owner** | Extra privacy and API key terms that explain how API keys and data should be handled. |
| `rwph_launcher_logo_256.png` | **Users and owner** | Launcher logo image used by the userscript/package. |
| `server.js` | **Owner/server-side only** | The private Node.js backend. It handles licence checks, admin tools, Torn API requests, item-payment checks, and protected payout calculations. Do not give this file to normal users unless you want them to host their own backend. |
| `package.json` | **Owner/server-side only** | Backend package metadata and dependency list used by the owner server. |
| `.env.example` | **Owner/server-side only** | Example backend configuration file. The owner copies this to `.env` and fills in private server secrets/API settings. Never share your real `.env` file. |
| `start-server-windows.bat` | **Owner/server-side only** | Windows helper file for starting the backend server. |
| `start-server-mac-linux.sh` | **Owner/server-side only** | Mac/Linux helper file for starting the backend server. |

Normal members usually only need the `.user.js` userscript. The owner/server-side files are for the person hosting and controlling the RWPH backend, licence system, admin tools, and payment checking.

Important owner note: `paywall-db.json` is created by the backend when it runs. It stores licence/payment data and should be backed up and kept private. It is not meant to be shared with users.

---

## Main Features

### Faction Header Launcher

RWPH adds a **Ranked War Payout Helper** button in the top faction header, immediately to the left of Torn's **Faction Warfare** button. The launcher:

- Only appears on Torn faction pages and faction/ranked-war report pages where the Faction Warfare header button is available.
- Opens the Ranked War Payout Helper panel.
- Uses the RWPH logo on the left and the text **Ranked War Payout Helper**.
- Copies the nearby Faction Warfare button styling so it looks like part of the faction header.

### Locked and Unlocked Panels

RWPH has two main panel states:

1. **Locked panel** for users without a verified licence.
2. **Unlocked main panel** for users with an active licence.

The panel checks the saved licence with the backend when it opens. If the licence is missing, expired, revoked, or cannot be verified, RWPH stays on the locked panel.

### Active Tab Highlighting

The selected tab is highlighted in both panel states.

Locked panel tabs:

- **Unlock**
- **Admin**
- **Help**

Unlocked panel tabs:

- **Payout**
- **Admin**
- **Help**

### Dropdown Help Panel

The Help panel is built from dropdown-style buttons. This keeps the panel short and easier to scan.

Help sections explain:

- Current features
- Quick start
- Licence and payment codes
- Main payout panel
- Results loading screen
- Results tab
- Payments helper
- Admin tools
- Popup panels
- Responsible use
- API key usage
- Backend/server settings
- Troubleshooting

All Help dropdown buttons use the same midnight-blue main panel style.

### Server-Side Licence System

RWPH uses a backend-verified licence system. The userscript does not unlock itself by only changing front-end code. The backend verifies the user, creates signed licence tokens, and protects payout calculation routes.

Licence features include:

- Buy licence by sending the configured Torn item.
- Extend licence with additional item payments.
- One-time 7-day free trial per Torn account.
- Existing licence check.
- Licence expiry display with **Your Expiration** in a separate info panel.
- Admin grant, extend, remove, and list tools.
- Server-side signed licence token verification.
- Licence data stored in the backend database file.

### Xanax Licence Payment Helper

By default, the included `.env.example` is configured for Xanax payments:

- Required item ID: `206`
- Required item name: `Xanax`
- Required quantity: `1`
- Default licence days per Xanax: `15`

The backend can be configured to use a different item, name, quantity, or licence duration.

When the user clicks **Buy Licence** or **Extend Licence**, RWPH:

1. Creates a unique payment code.
2. Shows the receiver, item requirement, and code.
3. Changes the current Torn tab to the Xanax Payment Helper/item-send page.
4. Provides **Copy Receiver** and **Copy Code** helpers.
5. Checks the backend for payment confirmation.
6. Unlocks or extends the licence after a valid matching payment is detected.

The payment code expires after a short time. Users must send the item manually inside Torn and include the exact code.

### Purchase Bonus System Removed

The purchase bonus system has been removed. New licence purchases now add only the base configured licence days:

```env
LICENSE_DAYS=15
```

There are no cumulative milestone bonuses, single-order bonuses, bonus dropdown controls, or 365-day completion reward. Existing licence time in the database is not removed.

### Admin Tools

Admin tools are available from both the locked panel and the unlocked main panel.

Admin features:

- Save admin key locally.
- List current licences.
- Grant a licence to a Torn ID.
- Extend an existing licence by adding days.
- Remove licence days from a user.
- Auto-grant the owner account a long licence when the admin key is saved.
- Fill a selected licence into the admin form from the licence list.

Admin routes are protected by `ADMIN_KEY`. Keep it private.

### Payout Calculator

The main payout panel calculates ranked-war member payouts.

Inputs:

- Torn API key
- War start date/time
- War end date/time
- Member Payout
- Total Payout
- War Hit Weight
- Outside Hit Weight
- Retaliation Hit Weight
- Assist Weight

Useful buttons:

- **Save Key** saves the Torn API key locally.
- **Your Expiration** opens the licence info panel with remaining licence time and expiry date.
- **Lock Panel** returns to the locked panel.
- **Auto-fill Last Finished War** detects the latest completed ranked war. Current/active wars are not calculated.
- **Calculate** inside Basic Calculations runs the normal backend payout calculation for the last finished ranked war only.
- **Calculate** inside Advanced Calculations runs the points-based backend payout calculation for the last finished ranked war only.
- **Use Cached Report** inside Basic Calculations or Advanced Calculations opens the matching backend/database cached report when it exists.
- **Delete Cache** inside Basic Calculations or Advanced Calculations removes the matching backend/database cached report and is limited to one successful delete every 10 minutes per user.
- Browser-saved report fallback is disabled.
- The RWPH launcher is fixed beside Torn's **Areas** text on supported faction/report pages.

### Auto-Fill War Times

The backend detects the latest completed ranked war through Torn ranked-war data. Current/active wars are not used for payout reports. When successful, RWPH fills the completed war start and finish fields automatically.

If auto-fill cannot find a finished war, RWPH will not create a payout report until a completed ranked war is available.

### Hybrid Ranked-War Calculation Mode

RWPH attempts to use Torn ranked-war report data when available.

In hybrid mode:

- War Hits come from Torn ranked-war report member attacks.
- Respect and Total Respect come from Torn ranked-war report score/respect fields.
- Assists, Outside Hits, and Retaliation Hits come from the attack-log classifier.
- Attack-log War Hits are ignored in hybrid mode so war hits are not double counted.

If ranked-war report mode fails, RWPH falls back to attack-log calculation and shows a warning.

### Attack Classification

The backend classifies attacks into contribution types:

| Type | Meaning |
| --- | --- |
| War Hits | Ranked-war hits against the selected war opponent. |
| Outside Hits | Hits outside the ranked-war opponent/category, tracked separately. |
| Retaliation Hits | Hits with explicit retaliation evidence or a retaliation multiplier above normal. |
| Assists | Attack results identified as assists. |

Failed attacks such as losses, stalemates, timeouts, escapes, runaways, misses, or failed results do not count as successful hits, except assists are treated separately.

### Weight-Based Payout Split

RWPH uses weighted contribution points to split the Member Payout.

Simplified formula:

```text
member weight =
  (war hits × war hit weight)
+ (outside hits × outside hit weight)
+ (retaliation hits × retaliation hit weight)
+ (assists × assist weight)
```

Then:

```text
member payout = Member Payout × (member weight / total faction weight)
```

If every weight is zero, no meaningful payout split can be calculated.

### Results Loading Screen

When the user clicks **Fetch + Calculate**, RWPH opens a loading/results tab. The loading screen includes a timer and five progress steps.

The dots turn green as the backend progresses through:

1. Verifying the licence with the server.
2. Fetching the attack log for the selected start and finish times.
3. Sorting war hits, outside hits, retals, and assists.
4. Applying weights and splitting the Member Payout across members.

The timer counts total seconds, including past 59 seconds.

### Results Page

After calculation, RWPH builds a fullscreen results page with:

- Summary cards
- Member payout cards
- War hit counts
- Assist counts
- Outside hit counts
- Retaliation hit counts
- Total tracked hits
- Weight values
- Payout amount per member
- Calculation warnings where needed
- Export and helper buttons

### CSV Export

The results page can export a CSV file for spreadsheet use. The CSV includes payout information that can be opened in Excel, Google Sheets, or similar tools.



General workflow:

1. Calculate results.
4. Preview and review before sending.


### Payments Copy Panel

The **Payments** button opens a manual payout helper.

The helper provides payout rows with buttons to copy or prefill:

- Member name + Torn ID
- Payout amount

On Torn PDA/phone, RWPH tries to prefill without focusing fields so the phone keypad does not keep opening.

Payments are intentionally manual. RWPH helps prepare the details, but the user must review and confirm each Torn money payment.

### Popup Feedback Panels

Many actions use small feedback panels instead of browser alerts.

Examples:

- Save Key
- Your Expiration
- Auto-fill Last Finished War
- Admin actions
- Results actions
- Copy actions
- Payment helper actions

Popup panels are movable/clamped near the active RWPH panel and auto-close after a short time.

### Movable and Resizable Panels

RWPH floating panels support moving and resizing. Layout choices are saved locally so the panel can reopen where the user left it.

Supported panels include:

- Main RWPH panel
- Results panel
- Payments Copy Panel
- Xanax Payment Helper
- Manual review/info popup panels

---

## Security Notes

Keep these private:

- Torn API keys
- `OWNER_TORN_API_KEY`
- `PAYWALL_SECRET`
- `ADMIN_KEY`
- `.env`
- Private server URLs if you do not want others using the backend
- `paywall-db.json` if it contains licence/payment records

Recommended practices:

- Use long random values for `PAYWALL_SECRET` and `ADMIN_KEY`.
- Do not commit `.env` to GitHub.
- Only run the backend somewhere you trust.
- Rotate secrets if you accidentally share them.
- Keep backups of your server database before making big admin changes.

---

## Troubleshooting

### `localhost refused to connect`

The backend is not running, the port is wrong, or the browser cannot reach the server.

Fixes:

- Run `npm start`.
- Check `/health`.
- Confirm `PAYWALL_API_BASE` matches the real server URL.
- If using ngrok, confirm the ngrok tunnel is active.

### `Payment start error: Failed to fetch`

The userscript could not reach the backend.

Fixes:

- Check that the backend is online.
- Check `PAYWALL_API_BASE`.
- Check userscript `@connect`.
- Check whether your ngrok/public URL changed.
- Check browser/Torn PDA network permissions.

### Payment Not Found Yet

RWPH did not detect a valid matching payment.

Check:

- Correct receiver Torn ID.
- Correct item.
- Correct quantity.
- Exact payment code.
- Payment code has not expired.
- Owner API key can read item events/payment data.

### Wrong Payment Detected

RWPH found a payment that did not match the expected item/code/quantity.

The user may need manual admin review.

### Too Many Requests / Torn Rate Limit

Torn may be rate-limiting API calls.

Fixes:

- Wait before recalculating.
- Do not spam **Fetch + Calculate**.
- Increase rate-limit settings in `.env`.
- Avoid running several calculations at once.

### Results Loading Seems Stuck

Large wars or Torn API delays can take longer.

Check:

- Loading timer.
- Backend console.
- Torn API errors.
- Server `/health`.
- Browser console if needed.

### Launcher Does Not Show

The launcher only appears on Torn faction pages.

Go to:

```text
https://www.torn.com/factions.php
```

Also check:

- Userscript is enabled.
- You installed the newest version.
- The page was refreshed after installation.
- No duplicate old userscript is installed.

### Duplicate Scripts in Tampermonkey

If you changed `@name` or `@namespace`, Tampermonkey may treat the script as a different script.

Fix:

- Disable or remove old copies.
- Keep only the latest **Ranked War Payout Helper** version.

---

## Updating

When updating RWPH:

1. Backup `.env`.
2. Backup your licence database file if present.
3. Replace the userscript with the newer `.user.js`.
4. Replace backend files as needed.
5. Re-run `npm install` if dependencies changed.
6. Restart the backend.
7. Test `/health`.
8. Refresh Torn and open the faction page.

---

## Recent Changelog

### v1.1.330



### v1.1.330

- Fixed Admin panel button handling with a panel-scoped delegated click handler, so Save Admin Key, List Licences, Server Status, Grant, Extend, Remove, and Fill buttons keep working after panel rebuilds/tab switches.
- Fixed the Payments Copy Panel **Accept Warning** button so it unlocks prefill buttons without replacing/wiping the panel contents.
- Added safer popup/status handling so feedback messages cannot accidentally overwrite full panels.

### v1.1.308

- Active licences now unlock straight into the main payout panel after a saved-key licence check, without needing to press Unlock Panel again.
- Compacted both **Basic Calculations** and **Advanced Calculations** dropdowns with shorter notes, tighter cache text, compact checkbox grids, and smaller spacing.
- Kept all calculation fields, button IDs, payout maths, cache behaviour, and licence checks unchanged.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.307

- Compacted the visible **API Key Notice** under the API key box on both the locked **Unlock** panel and unlocked main **Payout** panel.
- Replaced the larger multi-card notice with one tighter summary line while keeping the important points: purpose, data read, local storage, backend use, no Torn password, and no automatic money/Xanax sending.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.306

- Removed the **Full API ToS / Key Usage Details** dropdown from the locked **Unlock** panel.
- Kept the compact visible **API Key Usage Notice** under the locked API key box.
- Detailed API ToS / Usage Table remains available in the **Help** tab.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.305

- Safely removed clearly unused userscript and server helper code after repeated reference checks.
- Removed the old `Torn_RW_Payout_Helper_Server_Locked.user.js.bak` backup file from the release zip because the running script never uses it.
- Left generated-results-page helper code alone where removal could affect the fullscreen report/payment page.

### v1.1.304


### v1.1.303
- Removed the **Full API ToS / Key Usage Details** dropdown from the unlocked main **Payout** panel.
- Kept the compact visible **API Key Usage Notice** directly under the main API key box.
- Kept the locked Unlock tab API details and the Help tab API ToS / Usage Table available for review.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.302
- Added a permanent visible API Key Usage Notice directly under both API key fields in the locked Unlock tab and unlocked Payout tab.
- The notice now clearly explains why the key is needed, what data is read, where the key is saved, when it is sent to the backend, and what RWPH does not do.
- Full API ToS / Key Usage Details now opens by default below the visible notice.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.301
- Updated README, terms, server version, package version, and userscript version.

### v1.1.300


### v1.1.300

- Updated README, terms, server version, package version, and userscript version.

### v1.1.298

- Updated README, terms, server version, package version, and userscript version.

### v1.1.297

- Kept the phone-friendly layout and no-scrollbar generated HTML cleanup.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.292

- Updated README, terms, server version, package version, and userscript version.

### v1.1.290

- Updated README, terms, server version, package version, and userscript version.

### v1.1.289

- Removed per-player stat grids, ranks, IDs, metric blocks, share values, and extra details from the payout cards themselves.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.288

- Compacted payout user cards to roughly one-quarter of the previous size by tightening padding, font sizes, and spacing.
- Changed payout cards to a compact 4-column stat grid while keeping the full Basic/Advanced stat detail set.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.286

- Updated README, terms, server version, package version, and userscript version.

### v1.1.284

- Replaced wide desktop payout tables with compact 3-column mobile payout rows: Member, Weight/Points, and Payout.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.283

- Updated README, terms, server version, package version, and userscript version.

### v1.1.282

- **Select All** now uses DOM range selection so the full raw HTML visibly highlights in Torn PDA/webviews.
- **Copy All** now copies from the stored full HTML source and keeps the full code highlighted if clipboard access is blocked.
- Added a manual copy prompt fallback when both normal clipboard routes are blocked.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.275

- Added move support via the panel title bar.
- Added resize support with corner handles.
- Added size preset buttons: Small, Wide, Tall, and Full.
- Kept Close, Copy All, and live preview inside the results tab.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.274

- The panel includes the full raw HTML code, **Copy All** and a live inline preview.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.273

- Updated README, terms, server version, package version, and userscript version.

### v1.1.272

- Updated README, terms, server version, package version, and userscript version.

### v1.1.269

- Updated README, terms, server version, package version, and userscript version.

### v1.1.268

- Updated README, terms, server version, package version, and userscript version.

### v1.1.267

- Fixed **Removed Left-Member Hits** over-counting in both **Basic Calculations** and **Advanced Calculations** by counting only hits that were actually included in that mode's calculation.
- Disabled Basic tickbox categories and zero-point Advanced categories no longer increase the removed-hit stat.
- Bonus-only values are still removed with former members, but they still do not count as removed hits.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.266

- Removed former-member bonus points from totals when **Include members who left the faction** is unticked.
- Bonus-only values such as war-faction retal bonus, own-faction hospital bonus, enemy war-faction hospital bonus, and fair-fight bonus are stripped with the former member, but they do **not** increase **Removed Left-Member Hits**.
- Kept **Removed Left-Member Hits** as a unique tracked-hit count only.
- Applied the fix to both **Basic Calculations** and **Advanced Calculations**, including cached-report reopening.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.265

- Fixed **Removed Left-Member Hits** over-counting by counting unique tracked hits only. Bonus-only stats such as war-faction retal bonus, hospital bonus, and fair-fight bonus are no longer added as extra removed hits.
- Applied the corrected removed-left-member hit counter to both **Basic Calculations** and **Advanced Calculations**.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.264

- Result tabs now hide **Removed Left-Member Hits** when **Include members who left the faction** is ticked.
- The removed-hit stat still shows when former members are excluded, so users can see how many hits were removed.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.263

- Fixed **Removed Left-Member Hits** showing `0` in hybrid Basic/Advanced results when former members were already filtered inside report/attack-log sub-calculations.
- Hybrid Basic and Advanced now defer the current-faction filter until after report rows and attack-log extras are merged, so removed hits are counted correctly when **Include members who left the faction** is unticked.
- Updated cache matching version so new reports do not reuse old cached results with the incorrect removed-hit counter.

### v1.1.262
- Added an off-by-default **Include members who left the faction** checkbox inside both Basic Calculations and Advanced Calculations.
- When the checkbox is off, former faction members are removed automatically as before. When it is ticked, former members are kept in that calculation's result rows.
- Both result tabs now show **Removed Left-Member Hits**, the number of tracked hits removed because members had left the faction.
- Cache matching includes the include-left-members setting, while still ignoring changed payout amounts.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.261
- Help text and README now explain not to paste raw HTML source into Torn because it can show as text or lose CSS/background styling.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.260
- Basic and Advanced calculation results automatically remove members who are not in your current faction member list at calculation/open time unless the matching Include members who left the faction checkbox is ticked.
- If former members are removed, RWPH adds a warning naming the removed Torn IDs where available.
- Cache keys include the current-member filter mode so new reports stay separated from older calculation behavior.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.257

- Member Payout is now explicitly sent to the backend as the calculation/payment pool.
- Backend calculation and cache-open payload parsing now prefer `memberPayout` for payment splits while keeping old `totalPayout` compatibility.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.256

- Backend/database report cache matching now ignores changed payout fields.
- **Use Cached Report** can still open the saved Basic or Advanced report even if the user changes Member Payout or Total Payout after the cache was created.
- Cached reports keep and display the payout values saved inside that report; changing payout fields later does not rewrite an old cached report.
- Cache lookup/open/delete still stay separated by faction, finished war, calculation mode, and non-payout calculation settings.

### v1.1.255

- Advanced Calculations now treats retals against enemy ranked-war faction opponents as War Hits plus a configurable retal bonus.
- Added/updated the Advanced Calculations retal box as **War-faction retal bonus points**, defaulting to **0.2**.
- Non-war-faction retals are now classified as Outside Hits instead of Retaliation Hits.
- Updated cache-key protection so old Advanced cached reports do not mix with the new retal bonus rules.
- Updated README, terms, server version, package version, and userscript version.

### v1.1.254

- Retaliation Hits now only count as retaliation when the target is in the selected ranked-war enemy faction.
- Retals against non-war-faction targets are no longer paid/classified as Retaliation Hits.
- Basic Calculations and Advanced Calculations still keep assists, eligible retals, and outside hits separate from War Hits to prevent double counting.
- Updated cache-key protection so cached reports do not mix the older retal rules with the new war-faction-only retal rule.

### v1.1.252

- Renamed **Per Hit Settings** to **Basic Calculations**.
- Renamed **Points System Settings** to **Advanced Calculations**.
- Updated main panel labels, help text, cache messages, README notes, and terms wording to use the new calculation section names.

### v1.1.251

- Removed **Member Payout**, **Total Payout**, and **Members Paid** from the top hero section of both fullscreen result tabs.
- Added **Per Point Amount** to the Points System results summary next to **Total Payout**.
- Cleaned up the existing layout styling in both Per Hit and Points System result tabs without changing the result structure, button order, calculations, cache handling, exports, or Payments handoff.

### v1.1.249
- Cleaned up the member/user card layout in both Per Hit and Points System results tabs so names, payout, main score, and hit stats are easier to read.
- Result-card layout only changed display styling; calculations, cache handling, exports, and Payments handoff are unchanged.
- Moved the long v1.1.247 and v1.1.240 release notes into this Recent Changelog section and removed the old standalone v1.1.237 layout note from the top of the README.
- Changed the default **Enemy war faction hospital bonus points** value from **2** to **-1**. The setting can still be positive or negative.

### v1.1.247

- Added two editable Points System fair-fight controls: **Avg FF required per bonus step** and **Point bonus per payable hit per step**.
- Fair-fight bonus is only applied when **Use fair-fight modifier** is ticked; unticked means no fair-fight bonus points.
- Defaults remain **0.02 Avg FF required** and **0.01 point per payable hit per step**.

- Changed Points System fair-fight scoring to use the member's **Avg FF** instead of multiplying attack points.
- Fair-fight checkbox now uses editable step settings. By default it awards **+0.01 point per payable hit for every +0.02 Avg FF over 1.00**. Avg FF is capped at **3.00** and no bonus is added when the checkbox is off.
- Points results now show the per-payable-hit fair-fight bonus value alongside total Fair Bonus.

- Fixed both **Use Cached Report** buttons so Per Hit and Points System open cached reports through a dedicated backend cache-open route instead of re-entering the normal calculation route.
- Cached reports now pre-open the results tab immediately from the button click, which helps prevent browser/Torn PDA popup blocking.
- Removed the report queue from the loading/results tabs. Calculations now start directly, while Torn API retry/backoff and database report caching remain enabled.


- Added Points System enemy war faction hospital hits and enemy faction hospital bonus points. Enemy war faction hospital bonus can be set to a negative value to subtract points.
- Basic Calculations now use fixed 1-per-hit tick boxes instead of editable weight numbers.


- **Use Cached Report** now works independently inside each system. Per Hit only checks/opens Per Hit cached reports, and Points System only checks/opens Points System cached reports.
- One invalid or incomplete dropdown no longer blocks the other dropdown's cached report button.
- Cache auto-check messages stay mode-specific for each dropdown.

### v1.1.240

- Advanced Calculations now only shows Points cached-report status.
- Basic Calculations now only shows Per Hit cached-report status.

- Renamed the old per-mode **Total payout pool** field to **Member Payout** in both **Basic Calculations** and **Advanced Calculations**.
- Added a new **Total Payout** field to both calculation dropdowns. Member Payout is still the amount split across members; Total Payout is saved/displayed as the full payout record amount.
- Results tabs now show both **Member Payout** and **Total Payout**.
- Backend/database report cache keys now include the new Total Payout value so cached reports do not mix different payout records.


### v1.1.235
- Added separate backend/database cache support in the panel for both **Per Hit** and **Points System** reports.
- Added separate cached-report open buttons for Per Hit and Points System reports.
- Added separate cached-report delete buttons for Per Hit and Points System reports, still protected by the one-successful-delete-per-10-minutes limit.
- Updated cache checking so both result types can be found without relying on browser-saved report data.
- Ensured cached Per Hit and cached Points results both keep the Payments handoff so the Payments Copy Panel can open from either cached report type.

### v1.1.234
- Moved the normal per-hit report button inside **Basic Calculations** and renamed it **Calculate**.
- Moved the Points System report button inside **Advanced Calculations** and renamed it **Calculate**.
- Changed Points System mode to use the same hybrid source as the normal report when possible: rankedwarreport for war hits/score/total respect plus attack logs for assists, outside hits, retals, own-faction hospital bonuses, and fair-fight modifiers.
- Kept attack-log-only Points System fallback for wars where Torn does not return a usable rankedwarreport.

### v1.1.233
- Changed the normal hit weight controls into a collapsed **Basic Calculations** dropdown.
- Matched the Basic Calculations and Advanced Calculations dropdown cards to the main panel blue/modern theme.
- Previously kept the existing per-hit and Points System calculations unchanged.

### v1.1.232

- Changed Points System hospital bonus scoring so the bonus is only awarded when the hospitalized target can be verified as one of your own faction members.
- Added backend tracking for detected hospital results that were skipped because the target was not verified as your own faction.
- Updated Points System labels/help text to say own-faction hospital bonus instead of a general hospital bonus.

### v1.1.231

- Hardened Payments Copy Panel button hiding so buttons still disappear even if browser clipboard permission is blocked.
- Added a local fallback handoff for payment rows so Payments can still open from fullscreen cached-result tabs.
- Hardened Xanax Payment Helper opening on the item tab by restoring the active pending payment code from the backend/database before rendering the helper.

### v1.1.229

- Updated the Help panel to explain the latest cache and payment helper behaviour.
- Help now covers database-only cached reports, cached-report open/delete buttons, 24-hour cache cleanup, and the one-delete-per-10-minutes limit.
- Help now explains that Payments Copy Panel can open from current results or cached reports, hides clicked buttons, and restores only the most recently hidden payment button.
- Help now explains that Buy Licence / Extend Licence reopen an existing pending Xanax payment code from the backend/database when one already exists.
- Help now notes that Your Expiration is limited to 2 manual checks per minute.

### v1.1.228

- Rebuilt the fullscreen Fetch + Calculate results page layout to better match the main RWPH panel layout.
- Added a cleaner report header with faction, report type, total payout, and members paid.
- Kept the layout responsive so smaller screens stack the actions, summary, and member results cleanly.

### v1.1.226

- Refreshed the fullscreen Fetch + Calculate results panel so it matches the main RWPH midnight-blue theme.
- Updated results sidebar cards, buttons, summary cards, member result cards, payment helper panel, spacing, borders, and text contrast.
- Added clearer results-page wording for completed-war reports, backend/database cache, 24-hour cache expiry, and manual-only payments.

### v1.1.225
- Added a browser-side 2-per-minute guard to the **Your Expiration** button so it stops repeated manual licence checks before they hit the backend.
- Slowed the background licence monitor so it no longer burns through the manual expiry-check allowance.
- Fixed Payments Copy Panel buttons not disappearing by forcing the hidden state with the same button CSS strength used by the panel theme.
- **Bring Back Disappeared Button** still restores only the most recently hidden payment-copy button.

### v1.1.224

- Payments Copy Panel opens from the current results or a backend/database cached report.
- Xanax Payment Helper can restore the current pending payment code from the backend/database.
- Xanax/payment status is always re-checked live before licence days are added.
- Browser-only cached licence/payment status is not accepted as final truth.
- Payments Copy Panel buttons disappear after being clicked.
- **Bring Back Disappeared Button** restores only the most recently hidden payment-copy button.

### v1.1.222

- Changed the cached-report status text to show the exact saved time and exact expiry time.
- Removed the countdown-style `Expires in 1440:00` wording from the cache card.

### v1.1.221

- Updated the loading/results tab information to explain completed-war mode, database-only cached reports, 24-hour cache expiry, direct-start loading and Torn API retries.
- Restyled the loading/results tab to match the midnight-blue RWPH panel/card theme.
- Fixed cached-report status text so it updates immediately when a matching backend/database cached report exists.
- Backend now returns saved cache expiry metadata after creating a new report.

### v1.1.220

- Moved the cached report card/section under **Fetch + Calculate** and above the launcher controls used at that time.
- Renamed **Button Movements** to **Launcher Movement** across the panel and README at that time.

### v1.1.219

- Removed the old Fetch + Calculate time lock.
- Fetch + Calculate now shows a popup when a matching cached report already exists.
- **Use Cached Report** inside the matching settings dropdown opens the matching cached report.
- **Delete Cache** inside the matching settings dropdown removes the matching database cached report when a fresh report needs to be created.
- Cached reports auto-expire and are deleted from the backend/database after 24 hours.
- Licence verification/check rate limit changed to 2 checks per minute.

### v1.1.217

- Removed the separate **Check Cache** button.
- Added automatic completed-war cache checking when the API key and payout settings are ready.
- Removed the separate **Reopen Results** button.
- Changed **Use Cached Report** so it opens the saved/cached results report. Later versions split this into separate Per Hit and Points cached-report buttons.
- Backend/database cached reports now expire and are pruned automatically after 24 hours by default.
- Kept the new cache controls in the same midnight-blue RWPH style/theme/layout.

### v1.1.216

- Added completed-war report caching for same faction/war/settings reports.
- Added Use Cached Report and Check Cache controls.
- Replaced the backend calculation queue with direct-start calculations while keeping route rate limits and per-user cooldown protection.
- Added short Torn API memory caching for finished-war/faction data.
- Added admin-only force refresh and server status tools.
- Kept storage on the current JSON database for now, with MySQL-ready organisation for a later update.
- Kept all new controls in the same midnight-blue RWPH theme/layout.

### v1.1.215

- Added clearer completed-war-only and report-lock wording to the Help panel.
- Added the same notice to the locked panel, main payout panel, loading screen, and results page where users need to see it.
- Clarified that Fetch + Calculate uses the latest finished ranked war, not an active/current war.

### v1.1.214

- Changed **Fetch + Calculate** to calculate the latest completed ranked war only.
- Current/active ranked wars are no longer calculated. Users must wait until the war is finished.
- **Auto-fill War Times** was renamed to **Auto-fill Last Finished War** in the panel.
- Added a cached report prompt: while the saved-results reopen control is active, users cannot create another payout report.
- Added server-side protection so edited userscripts cannot bypass the completed-war-only rule or recent-report lock.

### v1.1.213

- Updated `RWPH_PRIVACY_AND_API_KEY_TERMS.md` with clearer API key, backend, licence data, manual-action, and owner responsibility terms.
- Made the README **Download Here** button stand out more at the top of the page.

### v1.1.212

- Moved the Requirements, How to Use the Script, and Torn API Key Usage sections directly under Important Notice.

### v1.1.211

- Updated the README **What Is Included** section to explain every file in the zip.
- Clearly marked which files are public/userscript files and which files are owner/server-side only.
- Added a private owner note for backend-created `paywall-db.json`.

### v1.1.210

- Added a clearer manual-only Torn actions notice to the README Important Notice section.

### v1.1.208

- Removed the Installation, `.env Settings`, and Backend API Routes sections from the README.

### v1.1.207

- Fixed `/api/paywall/trial` returning a generic 500 when Torn rejects a user API key or the server cannot save the trial database.
- Trial activation now uses Torn API v2 `user/basic` first, with the old user/basic endpoint kept as a fallback.
- Server errors now return clearer messages for bad keys, access-level issues, Torn rate limits, and `paywall-db.json` write problems.
- Added optional `DB_FILE` `.env` setting so hosted servers can point the paywall database at a writable path.

### v1.1.206

- Changed the README download link to the raw GitHub userscript URL.
- Replaced the visible download URL with a **Download Here** button badge.

### v1.1.205

- Added the GitHub userscript download link to the top of this README.

### v1.1.204

- Replaced the old changelog-style README with a full feature and setup guide.
- Updated package, userscript, and server version numbers.

### v1.1.203

- Added userscript author metadata: `Evil_Panda_420`.

### v1.1.202

- Changed the userscript name to `Ranked War Payout Helper`.
- Changed the userscript namespace to `RankedWarPayoutHelper`.
- Removed `- Locked` from the locked panel title.

### v1.1.201

- Help panel dropdown button backgrounds now use the same midnight-blue main panel style.
- Applies to locked Help, unlocked Help, and nested API Usage dropdown rows.

### v1.1.200

- Main panel tabs now visibly highlight the selected Payout, Admin, or Help tab.
- Locked panel tabs now visibly highlight the selected Unlock, Admin, or Help tab.
- Strengthened active-tab styling so it is not overridden by unified button styling.

### v1.1.199

- Changed Help panel cards into dropdown-style buttons.
- Help sections are collapsed by default.
- Applies to both locked and unlocked Help tabs.
- API usage rows inside Help are dropdown buttons.

### v1.1.198

- RWPH launcher button only appears on Torn faction pages.
- The userscript still runs on other Torn pages so payment helper/autofill flows can keep working.

### v1.1.197

- Improved panel text contrast.
- Changed launcher to a floating logo style.
- Improved results loading timer and progress dots.
- Added stronger desktop/PDA loading progress handling.

---

## Final Reminder

RWPH is built to make ranked-war payout work faster and cleaner, but the faction/user remains responsible for checking calculations, confirming Torn payments, protecting keys, and following Torn rules.


## v1.1.224 Pending Payment Helper Update

- Buy Licence and Extend Licence now reuse an existing pending backend/database payment code instead of creating a new code.
- If a pending code already exists, RWPH opens the already-created Xanax Payment Helper panel for that code.
- The Xanax Payment Helper now retries opening on the item page after tab load, focus, visibility changes, and Torn URL changes to make the helper panel more reliable.
- Payment status still remains live-only: licence days are only added after the backend/Torn API confirms the payment.


### v1.1.313
- Payments Copy Panel now requires clicking **Accept Warning** before **Name + ID** and **Amount** prefill buttons unlock.
- The warning reminds users to switch Torn faction controls from **Give money** to **Add To Balance** before paying members.


## v1.1.330 update

The old Include Left Members / automatic left-member removal system has been removed. RWPH now removes members only when they are typed or pasted into the Basic/Advanced **Exclude member from results** box. The existing Removed Member Hits result stat now counts hits removed by that manual exclude system.


## v1.1.387

- Fixed results loading dots and progress bar so they follow the same live backend stage/percent state.
- Loading dots now show previous stages as done and the current backend stage as active instead of jumping ahead.





## v1.1.387 - 15 day Xanax licence

- Changed default licence credit from **20 days per Xanax** to **15 days per Xanax**.
- Updated the payment helper to show **15 days per Xanax**.
- Updated `.env.example` so `LICENSE_DAYS` defaults to `15` when present.


## v1.1.387 - Admin purchase bonus toggle

- Added a Purchase Bonus Control section to the Admin panel.
- Admins can refresh, enable, or disable licence bonus days for new Xanax purchases from the panel.
- Existing licences are not changed when bonuses are toggled.
- When disabled, new purchases still receive the normal 15 licence days per Xanax, but bonus days are not added for that purchase.
- Added `/api/admin/bonus-settings` so the userscript can read and update the persisted server setting.

## v1.1.389 - Locked screen 15-day Xanax wording

- Fixed the locked/unlock screen heading so it now says each Xanax extends the licence by **15 days** instead of 20 days.
- Updated the README default Xanax licence days note from 20 to 15.

## v1.1.388 - Admin editable purchase bonuses

- Added admin editing for purchase bonus rules.
- Admins can now change the cumulative user milestone bonus list from the Admin panel.
- Admins can now change the single-order bonus list from the Admin panel.
- Bonus rules are saved in the backend database settings and apply only to new purchases after the change.
- Existing licences and previously recorded payments are not recalculated or reduced.
- The `.env` bonus values still act as startup/default rules when the database has no admin-edited rules saved.


## v1.1.391 - Updated default bonus lists and add-bonus button flow

- Changed default cumulative user milestone bonuses to `25:30,50:30,75:30,100:30,150:30,200:30,250:30,300:30`.
- Changed default single-order bonuses to `10:15,25:45,50:100,100:200,500:1000`.
- Admin-added bonuses save to the backend and then appear as their own green/red button in the Purchase Bonus Dropdown.
- Old v1.1.390 default database bonus rules are migrated to the new default lists so they do not stay stuck on the previous defaults.

## v1.1.390 - Admin bonus dropdown and .env saving

- Changed the Admin purchase bonus section into a dropdown-style bonus manager.
- Each bonus now appears as its own button: green for enabled, red for disabled.
- Clicking a bonus opens an editor panel where admins can change Xanax amount, bonus days, and enabled/disabled status.
- Admins can add new user milestone bonuses and single-order bonuses from the dropdown.
- Admins can delete a bonus rule from the editor panel.
- Saving bonus edits updates the backend database and attempts to write the new bonus config to the server `.env` file.
- `.env` bonus rules now support optional `:off` entries, for example `50:30:off`.
- Existing licence days are not recalculated or removed by changing bonus rules.


## v1.1.392 - Admin panel hidden until valid admin key

- Admin panel now only shows the Admin Key field, Save Admin Key button, and status message until the backend accepts the ADMIN_KEY.
- Licence tools, server status, force refresh, licence list stay hidden for non-admin users.
- Save Admin Key now verifies against `/api/admin/status` before showing any admin tools.
- 


## v1.1.393 - Highest single-order bonus and cumulative milestones

- Single-order purchase bonuses now explicitly award only the highest qualifying single-order tier for that one payment.
- Example: a 25 Xanax single order gets the `25:45` single-order bonus only; it does not also get the lower `10:15` single-order bonus.
- Cumulative user milestone bonuses still use that Torn ID's total recorded Xanax purchase history.
- Milestone bonuses can stack with the highest single-order bonus on the same purchase.
- Example: a 50 Xanax purchase can get the highest qualifying single-order bonus and any cumulative milestone bonuses crossed by that member's total purchases.



## v1.1.401 - Licence Info panel cleanup

- Cleaned the **Your Expiration / Licence Info** panel.
- Removed the **Bonus system: Removed** card.
- Removed the bottom note explaining that bonuses were removed.
- The panel now only shows current licence details and the base 15 days per Xanax licence rate.

## v1.1.400 - Faction Warfare header launcher

- Moved the RWPH launcher away from Torn's left **Areas** sidebar.
- The launcher now mounts directly to the left of the top **Faction Warfare** button on supported faction pages.
- The launcher now shows the RWPH logo plus **Ranked War Payout Helper** text and copies the nearby Faction Warfare button styling.
- Removed the visible page-corner fallback so the launcher will not jump to the wrong corner if Torn renders the header late.

## v1.1.399 - Fixed Areas launcher visibility

- Improved Torn left-navigation detection so the launcher can find **Areas** even when Torn wraps it in different sidebar elements.
- Added stronger faction and ranked-war report URL checks.
- Added a faction-page-only fallback launcher position so the button still appears if Torn loads the sidebar late or changes the Areas markup.
- The launcher still stays hidden on non-faction pages.


## v1.1.397 - Static faction-page launcher beside Areas

- Changed the RWPH launcher from the old movable floating logo into a static Torn left-navigation button beside the **Areas** text.
- The launcher is only shown on Torn faction pages and faction/ranked-war report pages.
- The launcher is removed from other Torn pages.
- Added a navigation MutationObserver so the button reappears beside **Areas** after Torn page changes or sidebar reloads.
- Removed the visible Launcher Movement buttons because the launcher position is now fixed.


## v1.1.396 - Purchase bonus system removed

- Removed cumulative licence milestone bonuses.
- Removed single-order licence bonuses.
- Removed Admin bonus dropdown/add/edit/delete/save controls and `/api/admin/bonus-settings`.
- Removed bonus progress ticks from the Licence Info panel.
- Removed the one-time 365 day completion reward and `/api/paywall/claim-completion-bonus`.
- New Xanax payments now add only the configured base licence days, currently 15 days per Xanax.
- Existing licence expiry time is not reduced or recalculated.


## v1.1.412 - Decimal billion/trillion shorthand hardening

- Hardened shorthand parsing so decimal billion/trillion payout entries convert exactly before calculation.
- Confirmed examples: `346.1b` -> `$346,100,000,000`, `346.21b` -> `$346,210,000,000`, and `346.99b` -> `$346,990,000,000`.
- Confirmed examples: `346.1t` -> `$346,100,000,000,000`, `346.21t` -> `$346,210,000,000,000`, and `346.99t` -> `$346,990,000,000,000`.
- Kept the existing **Member Payout** label unchanged.
- Updated package version to **1.1.412**.

## v1.1.411 - Money shorthand payout inputs

- Basic and Advanced **Member Payout** and **Total Payout** fields now accept shorthand money values.
- Supported examples include `346m`, `346.1m`, `346.21m`, `346.99m`, `346b`, and `346t`.
- Payout inputs now format as `$` values with commas, such as `$346,000,000`.
- Kept the existing **Member Payout** label unchanged.
- Updated package version to **1.1.411**.

## v1.1.395 - Locked 365 day completion reward

- Added a locked **365 Day Completion Bonus** button to the Licence Info panel.
- The button unlocks only after the user has completed every enabled user milestone bonus and every enabled single-order bonus.
- Claiming the reward adds **365 days** onto the current licence expiry. It does not replace or reset the existing licence time.
- The reward is server-tracked as one-time per Torn ID so it cannot be claimed repeatedly.

## v1.1.394 - Licence info panel and bonus completion ticks

- Changed the **Your Expiration** button so it opens a movable/resizable licence info panel instead of showing the expiry details in popup/toast messages.
- The new panel shows the active licence status, expiry date, time left, lifetime Xanax paid, largest single order, and last recorded payment.
- Added all configured user milestone bonuses to the panel with tick marks for completed milestones.
- Added all configured single-order bonuses to the panel with tick marks only for the highest single-order tier completed by a past payment.
- The panel explains that milestone bonuses use bonus-eligible lifetime Xanax total, while single-order bonuses use the highest qualifying tier per payment.
- Added bonus completion data to the normal licence verification response so users can see their own progress without admin access.


## v1.1.410 - Buy/Extend current-tab Xanax navigation

- Changed **Buy Licence** and **Extend Licence** so they no longer open a new tab.
- The current Torn tab now changes to the Xanax item-send page after the payment code is created.
- Existing pending payment codes still reopen the Xanax helper flow, but in the current tab.
- Updated package version to **1.1.410**.

## v1.1.409 - Phone/PDA logo-only launcher

- Phone/Torn PDA launcher now shows the RWPH logo only, with no text beside it.
- PC/desktop launcher still shows the logo plus **Ranked War Payout Helper** text.
- Mobile launcher fallback is now a compact round logo button.
- Launcher visibility rules are unchanged: it only appears on supported faction and faction-war report pages.
- Updated package version to **1.1.409**.

## v1.1.407 - Theme picker scroll, move/resize, and unique styles

- Fixed the Theme / Colour picker so the theme list has its own internal scrollbar.
- The Theme / Colour picker now uses the same move, resize, and close behaviour as the main RWPH panels.
- Added themed scrollbar styling to the Theme / Colour picker body.
- Added a different visual style to every theme, including different panel shapes, card shapes, button shapes, border styles, texture overlays, and button text styling.
- Theme buttons now show the colour name and its style name so each preset is easier to tell apart.
- Updated package version to **1.1.407**.

## v1.1.406 - Extra panel themes and colours

- Added 14 more selectable Panel Theme / Colours presets.
- New themes include Midnight Black, Lava Orange, Arctic Ice, Toxic Lime, Sunset Glow, Cyberpunk Pink, Emerald Glow, Ruby Blood, Aqua Teal, Amber Noir, Violet Storm, Desert Sand, Ghost White, and Royal Gold.
- Theme picker still saves the selected theme per browser/PDA.
- Extra themes apply to RWPH panels, helpers, dropdowns, buttons, popups, loading/results panels, and payment/newsletter tool panels.
- Updated package version to **1.1.406**.

## v1.1.405 - Export HTML download and themed popups

- Fixed Results page **Export Html** with stronger download fallbacks.
- Added a parent-window download bridge so results opened inside the RWPH panel can download from the main Torn page instead of the iframe.
- Added Blob, data-link, and userscript download fallbacks where available.
- RWPH popup/toast panels now follow the selected panel theme colours.
- Updated package version to **1.1.405**.

## v1.1.404 - Bigger panel logos

- Made the RWPH logo much larger in the top/header area of the script panels.
- Enlarged the main/locked/admin/help panel header logo.
- Enlarged the Xanax helper/payment review panel header logos.
- Enlarged the Licence Info panel logo.
- Enlarged the results/loading page header logos.
- Updated package version to **1.1.404**.

## v1.1.403 - First-open tutorial panel

- Added first-time tutorial auto-open on supported Torn faction pages.
- When a user opens a faction page after installing/updating with no prior tutorial marker, RWPH opens the panel automatically.
- The panel switches to the Help tab and expands the **Step-by-Step Tutorial** dropdown.
- A local browser/PDA flag prevents the tutorial from popping up repeatedly after it has been shown once.
- Updated package version to **1.1.403**.

## v1.1.402 - Built-in tutorial

- Added a new **Step-by-Step Tutorial** dropdown inside the Help tab.
- Tutorial covers opening RWPH, saving the API key, unlocking/buying a licence, choosing Basic/Advanced calculations, setting war times, calculating, reviewing results, and manually using payment/newsletter tools.
- Updated package version to **1.1.402**.


## v1.1.419 - PDA/phone logo-only launcher header fix
- PC launcher/header placement remains unchanged.
- PDA/phone launcher is forced to a compact logo-only button.
- PDA/phone placement now searches visible and hidden faction header icons, faction/war links, image/SVG hints, and top action rows instead of depending only on visible “Faction Warfare” text.
- The old fixed mobile fallback only runs if no usable PDA header/action row can be found.
- Continued from the v1.1.418 Member Management card-fit fixes.
- Updated package version to **1.1.419**.

## v1.1.418 - Member Management card layout and sticky controls
- Reworked Member Management member cards so names, IDs, stats, remove checkbox, payable-hit removal, and respect removal fit cleanly inside the panel.
- Improved the Member Management card grid so it safely drops to one column when the panel is too narrow instead of cramping or overflowing.
- Made the Refresh, Save, Clear, and status area sticky at the top of the Member Management panel while scrolling through members.
- Fit patch: changed the Member Management panel body to a flex scroll area with extra bottom padding so the last player card is not clipped off the bottom.
- Fit patch: moved the Refresh, Save, Clear, and status section up into an opaque sticky strip so member cards cannot show through it while scrolling.
- PDA/phone launcher patch: PC header placement is unchanged, while PDA/phone now uses compact logo-only launcher sizing and icon/link detection before falling back to the fixed floating button.
- Kept the v1.1.417 Payments Copy tab isolation fix.
- Package version remains **1.1.418** as requested.

## v1.1.417 - Payments Copy tab isolation fix
- Payments Copy tab now suppresses Results, Loading, main RWPH, export, and newsletter panels.
- The payment handoff tab now opens only the Payments Copy Panel.
- Kept the v1.1.416 Member Management move/resize/close controls and compact layout.
- Updated package version to **1.1.417**.

## v1.1.415 - Payments tab and compact panel patch

- Payments opened from Results now force a copy-panel-only Torn faction-control tab so the main/results RWPH panel does not restore in the new tab.
- Member Management default size and cards are more compact again.
- Payment Copy Panel header spacing was adjusted so the top helper text is not blocked by the close button.
- Updated package version to **1.1.415**.

## v1.1.414 - Member Management panel display and compact layout

- Fixed the Member Management panel so it opens as a solid themed panel instead of appearing transparent.
- Forced the Member Management panel above the main RWPH panel when opened.
- Made the default Member Management panel size smaller.
- Tightened the panel spacing and member card layout so the panel is more compact.
- Updated package version to **1.1.414**.


## v1.1.413 - Member Management and Respect Controls

- Added Member Management buttons to Basic and Advanced calculations.
- Member Management loads ranked-war report members for the selected war/time window.
- Each member card can fully exclude the member, remove payable hits, or subtract respect.
- Saved Member Management settings apply to calculations for 20 minutes, then reset to defaults.
- Added Basic Respect checkbox and Advanced Respect Score settings.
