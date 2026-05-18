# Ranked War Payout Helper

<p align="center">
  <a href="https://github.com/campbell996/RWPH/raw/refs/heads/main/Torn_RW_Payout_Helper_Server_Locked.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download Here">
  </a>
</p>

<p align="center"><strong>Click Download Here to install or update the RWPH userscript.</strong></p>

**Ranked War Payout Helper**, also called **RWPH**, is a Torn userscript and Node.js backend package for calculating faction ranked-war payouts. The userscript gives players a floating Torn panel, while the backend verifies licences, checks item payments, fetches Torn ranked-war data, and calculates payouts server-side.

Current package version: **1.1.216**  
Userscript name: **Ranked War Payout Helper**  
Userscript namespace: **RankedWarPayoutHelper**  
Author: **Evil_Panda_420**

---

## Important Notice

RWPH is a helper tool. It can calculate payouts, prepare payment rows, copy payment details, prefill some Torn fields, and create newsletter/export files. It does **not** automatically approve payouts, automatically send Torn money, automatically send Xanax, or replace manual checking.

RWPH is a manual payout calculator and copy/prefill helper. It does not send items, send cash, confirm payments, attack, buy, sell, travel, or perform Torn gameplay actions automatically. Users must manually review and confirm all Torn actions.

### Public Performance Mode

RWPH now protects public servers with completed-war report caching, a calculation queue, cooldowns, route rate limits, short Torn API memory caching, and admin-only force refresh. Users can open a matching cached report when the same finished war and payout settings were already calculated. Storage remains JSON for now; MySQL can be added later without changing the userscript flow.

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
4. Enter the total payout pool.
5. Set the weights you want.
6. Click **Fetch + Calculate**.
7. Wait for the loading dots/results page.
8. Review all results before paying.

### Exporting Results

After a successful calculation, use:

- **Export CSV** for spreadsheet records.
- **Create Torn Newsletter** for a formatted Torn newsletter.
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

### Floating Torn Launcher

RWPH adds a floating **RWPH** launcher logo in Torn. The launcher:

- Only appears on Torn faction pages, such as `https://www.torn.com/factions.php`.
- Opens the Ranked War Payout Helper panel.
- Can be moved between corners with **Button Movements**.
- Uses a clean floating-logo style without a heavy button background.
- Saves launcher position locally in the userscript storage.

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
- Newsletter tools
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
- Licence expiry display with **Your Expiration**.
- Admin grant, extend, remove, and list tools.
- Server-side signed licence token verification.
- Licence data stored in the backend database file.

### Xanax Licence Payment Helper

By default, the included `.env.example` is configured for Xanax payments:

- Required item ID: `206`
- Required item name: `Xanax`
- Required quantity: `1`
- Default licence days per Xanax: `20`

The backend can be configured to use a different item, name, quantity, or licence duration.

When the user clicks **Buy Licence** or **Extend Licence**, RWPH:

1. Creates a unique payment code.
2. Shows the receiver, item requirement, and code.
3. Opens the Xanax Payment Helper page/tab where possible.
4. Provides **Copy Receiver** and **Copy Code** helpers.
5. Checks the backend for payment confirmation.
6. Unlocks or extends the licence after a valid matching payment is detected.

The payment code expires after a short time. Users must send the item manually inside Torn and include the exact code.

### Bonus Licence Milestones

The backend supports bonus licence days for item payments.

Default cumulative per-user milestones:

| Total Xanax paid by that Torn ID | Bonus days |
| ---: | ---: |
| 15 | +20 |
| 30 | +50 |
| 60 | +100 |
| 100 | +250 |

Default single-order bonuses:

| Xanax sent in one order | Bonus days |
| ---: | ---: |
| 50 | +365 |
| 100 | +730 |

These values are controlled in `.env` with:

```env
BONUS_MILESTONES=15:20,30:50,60:100,100:250
SINGLE_ORDER_BONUS_MILESTONES=50:365,100:730
```

Bonuses are calculated per Torn user. Another user's payments do not count toward someone else's cumulative milestone progress.

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
- Total payout pool
- War Hit Weight
- Outside Hit Weight
- Retaliation Hit Weight
- Assist Weight

Useful buttons:

- **Save Key** saves the Torn API key locally.
- **Your Expiration** checks remaining licence time.
- **Lock Panel** returns to the locked panel.
- **Auto-fill Last Finished War** detects the latest completed ranked war. Current/active wars are not calculated.
- **Fetch + Calculate** runs the payout calculation on the backend for the last finished ranked war only.
- **Reopen Results** reopens the most recent successful results for 10 minutes. While it is visible, RWPH blocks creating another report.
- **Button Movements** moves the floating launcher.

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

RWPH uses weighted contribution points to split the total payout pool.

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
member payout = total payout pool × (member weight / total faction weight)
```

If every weight is zero, no meaningful payout split can be calculated.

### Results Loading Screen

When the user clicks **Fetch + Calculate**, RWPH opens a loading/results tab. The loading screen includes a timer and five progress steps.

The dots turn green as the backend progresses through:

1. Verifying the licence with the server.
2. Fetching the attack log for the selected start and finish times.
3. Sorting war hits, outside hits, retals, and assists.
4. Applying weights and splitting the payout pool across members.
5. Building the fullscreen results page, payment tools, CSV export, and newsletter buttons.

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

### Torn Newsletter Generator

RWPH can create a Torn newsletter HTML file from the results.

General workflow:

1. Calculate results.
2. Click a newsletter button.
3. Open the downloaded HTML file.
4. Copy the formatted newsletter content.
5. Paste it into Torn's faction newsletter editor.
6. Preview and adjust if Torn strips any styling.

Different newsletter themes/layouts may survive Torn formatting differently.

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
- Newsletter actions
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
- Do not paste secrets into public chats or faction newsletters.
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

### v1.1.216
- Added completed-war report caching for same faction/war/settings reports.
- Added Use Cached Report and Check Cache controls.
- Added backend calculation queue, route rate limits, and per-user cooldown protection.
- Added short Torn API memory caching for finished-war/faction data.
- Added admin-only force refresh and server status tools.
- Kept storage on the current JSON database for now, with MySQL-ready organisation for a later update.
- Kept all new controls in the same midnight-blue RWPH theme/layout.


### v1.1.215

- Added clearer completed-war-only and 10-minute report-lock wording to the Help panel.
- Added the same notice to the locked panel, main payout panel, loading screen, and results page where users need to see it.
- Clarified that Fetch + Calculate uses the latest finished ranked war, not an active/current war.

### v1.1.214

- Changed **Fetch + Calculate** to calculate the latest completed ranked war only.
- Current/active ranked wars are no longer calculated. Users must wait until the war is finished.
- **Auto-fill War Times** was renamed to **Auto-fill Last Finished War** in the panel.
- Added a 10-minute report lock: while **Reopen Results** is visible, users cannot create another payout report.
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
