# RWPH Privacy and API Key Terms

Version: **1.1.425**

These terms explain how **Ranked War Payout Helper (RWPH)** uses Torn API keys and calculation data. RWPH is a manual ranked-war payout helper. It is not an official Torn product.

---

## 1. What RWPH Does

RWPH helps a faction create ranked-war payout reports. It can:

- verify that a user has an active RWPH licence;
- read Torn faction, member, ranked-war and attack data needed for payout reports;
- calculate Basic and Advanced payout results through the configured RWPH backend;
- show payment helper panels, CSV exports, HTML exports and newsletter HTML;
- help admins manage RWPH licences when admin routes are enabled.

RWPH does **not** send Torn money, send items, attack, travel, buy, sell, confirm payments or perform gameplay actions automatically.

---

## 2. API Key Purpose

RWPH asks for a Torn API key so it can read the information needed for licence checks and ranked-war payout calculations.

Depending on the button you use, RWPH may use the key to read:

- your Torn ID and name;
- your faction access where required;
- faction member names and IDs;
- ranked-war reports and war timing;
- attack records inside the selected war/time window;
- data needed to confirm licence/payment status on the RWPH backend.

RWPH does **not** need your Torn password. Never paste your Torn password into RWPH.

---

## 3. Recommended Key Type

Use the lowest Torn API access level that still allows the faction/ranked-war data you need. Do not use a full-access key unless you understand and accept the risk.

If you stop using RWPH, revoke or rotate the key in Torn's API settings.

---

## 4. Local Storage

When you click **Save Key**, the userscript stores your API key locally in the browser/Tampermonkey/Torn PDA userscript storage on that device.

That means:

- the saved key is intended to stay on your own device;
- clearing browser/userscript storage may remove it;
- anyone with access to the same browser profile/device may be able to use the saved RWPH session;
- you can avoid local storage by pasting the key only when needed.

---

## 5. Backend Use

RWPH sends the key and required calculation settings only to the configured RWPH backend server shown in the userscript configuration.

The backend may use the key to:

- verify licence state;
- fetch Torn data needed for the selected calculation;
- create or open backend cached reports;
- process licence payment/extension checks;
- support admin licence tools when enabled.

Do not point RWPH at a backend you do not trust.

---

## 6. Cached Reports and Calculation Data

RWPH may store generated report data in the backend/database cache so the same report can be reopened without recalculating.

Cached report data may include:

- faction/war identifiers;
- selected start/end times;
- payout settings;
- member names and IDs;
- hit/point/respect totals used in the report;
- final payout rows;
- cache creation and expiry times.

Backend cached reports are intended to expire automatically based on the server configuration.

---

## 7. Licence and Payment Data

RWPH may store licence/payment data on the backend, including:

- Torn ID and name;
- licence expiry time;
- generated payment codes;
- payment pending/complete state;
- admin grant/extend/remove actions.

Xanax payments and Torn money payments must be checked and confirmed manually by the user inside Torn.

---

## 8. Admin Responsibilities

Admins control licence tools and server settings. Admins must keep these private:

- ADMIN_KEY;
- PAYWALL_SECRET;
- database credentials;
- private backend URLs;
- licence tokens or sensitive logs.

Admins are responsible for granting, extending and removing licence days correctly.

---

## 9. Manual Review Required

RWPH results can be affected by:

- wrong war times;
- Torn API rate limits;
- Torn API changes;
- backend downtime;
- cached report state;
- excluded members;
- changed faction membership;
- browser or Torn PDA behaviour.

Always review the results before posting newsletters, exporting files or sending payments.

---

## 10. No Automatic Torn Actions

RWPH is a helper, not an autoplayer. It does not automatically:

- attack;
- send Torn cash;
- send items;
- confirm Torn payment screens;
- buy, sell or trade;
- travel;
- perform gameplay actions.

Users are responsible for every manual action they take in Torn.

---

## 11. User Control

You can stop using RWPH by:

- locking the panel;
- clearing the saved userscript/browser storage;
- deleting the saved API key;
- revoking/rotating the key in Torn;
- disabling or uninstalling the userscript;
- shutting down or changing the configured backend.

---

## 12. Availability

RWPH may be unavailable or inaccurate during:

- Torn outages or API issues;
- hosting/server downtime;
- database issues;
- browser/Torn PDA changes;
- userscript bugs;
- version mismatches;
- maintenance or updates.

No payout should be treated as final until a human has checked it.

---

## 13. Acceptance

By using RWPH, you accept that:

- you are responsible for your API key;
- you are responsible for checking results;
- you are responsible for all Torn actions and payments;
- you should use the tool only in ways allowed by Torn and your faction;
- RWPH is provided as a manual helper with no guarantee of uninterrupted service or perfect results.


## v1.1.387 note

This update renames This page HTML to Export Html and fixes the local results-page HTML export path. API key usage and storage terms are unchanged.


## v1.1.387 note - 15 day Xanax licence

This update changes licence credit from 20 days per Xanax to **15 days per Xanax**. API key usage and backend terms are unchanged.


## v1.1.392 note - admin tools hidden until key verification

The userscript now hides admin-only controls until the server verifies a saved ADMIN_KEY. Admin write requests are protected by the backend admin key check.




## v1.1.401 note - Licence Info panel cleanup

The Licence Info panel no longer displays the removed bonus-system card or removed-bonus note. This is a display-only cleanup; API key usage and backend data handling are unchanged.

## v1.1.400 note - Faction Warfare header launcher

The userscript launcher now mounts to the left of Torn's top **Faction Warfare** button on supported faction pages and shows the RWPH logo plus **Ranked War Payout Helper** text. This is a display/location change only; API key usage and backend data handling are unchanged.

## v1.1.399 note - launcher visibility fix

The userscript launcher now uses stronger Torn sidebar detection and a faction-page-only fallback position so it remains visible on faction pages and faction/ranked-war report pages even if Torn changes or delays the left navigation markup. API key usage and backend data handling are unchanged.


## v1.1.397 note - static faction-page launcher

The userscript launcher is now mounted beside Torn's **Areas** text in the left navigation and is only shown on faction pages and faction/ranked-war report pages. This is a display/location change only; API key usage and backend data handling are unchanged.


## v1.1.396 note - purchase bonus system removed

The purchase bonus system has been removed. New Xanax licence payments add only the configured base licence days. The admin bonus manager routes and controls, user bonus progress display, and the one-time 365 day completion reward route have been removed. Existing licence expiry time is not reduced or recalculated by this update. API key usage is unchanged.



## v1.1.425 note - Theme interaction rollback-safe rebuild

- v1.1.425 fixes the panel interaction bug by moving the rebuilt theme styling back onto the last known working safe selectors. Panels should scroll, move, resize, and accept clicks/taps again while keeping the rebuilt theme visuals.

## v1.1.424 note - Theme interaction safety fix

- v1.1.425 fixes the v1.1.423 theme rebuild interaction layer so panels remain scrollable, movable, clickable, resizable, and usable.
- This update does not change the privacy/API-key behavior.

## v1.1.423 note - Full panel theme/layout rebuild

The userscript theme/colour changer was rebuilt so each theme has its own panel layout, style, colour system, and popup notification style across RWPH panels. This is a visual/UI update only and does not change what API data is requested, stored, or sent.

## v1.1.422 note - Unique panel layouts per theme/colour

The Panel Theme / Colours picker now changes each RWPH panel theme with its own layout profile, spacing, header style, card style, shadows, button feel, and colours. This is a display-only change. It does not change licence checks, payout calculations, payment helper actions, generated newsletter HTML, Torn API permissions, or backend data handling.

## v1.1.420 note - PDA launcher scroll behavior

- PDA/phone launcher remains logo-only.
- The PDA/phone launcher is now anchored to the faction page/header position instead of a sticky/mobile header so it no longer follows the screen while scrolling faction pages.
- PC launcher placement remains unchanged.

## v1.1.419 note - PDA launcher placement

The PDA/phone launcher placement logic from v1.1.414 was restored into the v1.1.418 codebase. This changes only the userscript launcher display behavior: desktop keeps the full text launcher beside Faction Warfare, while PDA/phone uses a logo-only launcher and can detect icon-only Torn header layouts. This does not add extra Torn API permissions or change backend data collection.

## v1.1.418 note - Member Management layout

The Member Management panel layout was adjusted locally so member cards fit inside the panel more cleanly and the Refresh, Save, Clear, and status controls stay visible while scrolling. A follow-up fit patch keeps the same **1.1.418** version while adding bottom scroll padding for the final player card and making the sticky Refresh, Save, Clear, and status strip fully opaque. This does not add extra Torn API permissions or change backend data collection.

## v1.1.412 note - Decimal shorthand parsing

Decimal shorthand money inputs for billion and trillion values are parsed locally before calculation, including `346.1b`, `346.21b`, `346.99b`, `346.1t`, `346.21t`, and `346.99t`. This is still only a local display/input helper and does not add extra Torn API permissions or change backend data collection.

## v1.1.411 note - Money shorthand payout inputs

- Basic and Advanced Member Payout / Total Payout fields can now accept shorthand values such as `346m`, `346.21m`, `346b`, and `346t`.
- These values are converted locally in the userscript to normal numeric payout totals before calculation requests are sent to the backend.
- This is a display/input helper only and does not add extra Torn API permissions or change backend data collection.

## v1.1.410 note - Buy/Extend current-tab navigation

Buy Licence and Extend Licence now change the current Torn tab to the Xanax item-send page instead of opening a new tab.

## v1.1.409 note - Phone/PDA launcher text

The phone/Torn PDA launcher uses a compact logo-only button. Desktop keeps the full logo and **Ranked War Payout Helper** text launcher. Launcher visibility remains limited to supported faction and faction-war report pages.

## v1.1.407 note - Theme picker scroll and unique styles

- Fixed the Theme / Colour picker so it scrolls through all available themes.
- The Theme / Colour picker now uses the same move, resize, and close behaviour as the main panels.
- Added distinct visual styling per theme, such as different shapes, textures, borders, and button styling.
- Theme choices are saved locally in the browser/PDA and do not change server-side payment, licence, or API behaviour.

## v1.1.406 note - Extra panel themes

- Added more selectable panel colour themes.
- Theme choices are saved locally in the browser/PDA and do not change server-side payment, licence, or API behaviour.

## v1.1.405 note - Export HTML and themed popups

- Results Export Html now has stronger browser/PDA download fallbacks.
- RWPH popup panels follow the chosen panel theme colours.
- No new API key permissions or extra Torn API data are required.

## v1.1.404 note - Bigger panel logos

This update enlarges the RWPH logo in panel headers and result/loading header areas. This is a display-only change; API key usage and backend data handling are unchanged.

## v1.1.403 note - First-open tutorial panel

- RWPH can now automatically open the panel once on supported Torn faction pages to show the built-in tutorial.
- The tutorial marker is stored locally in the user's browser/PDA userscript storage.
- This does not change API key permissions or backend data handling.

## v1.1.402 note - Built-in tutorial

- Added a Help-tab tutorial explaining the manual workflow from unlocking through calculation, result review, payments, and newsletters.
- The tutorial reinforces that RWPH helps prepare reports and helper copy/prefill steps only; users still manually review and confirm Torn actions.
