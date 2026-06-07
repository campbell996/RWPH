# RWPH Privacy and API Key Terms

Version: **1.1.392**

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


## v1.1.387 note - admin purchase bonus toggle

Admins can enable or disable bonus licence days for new Xanax purchases from the Admin panel. Toggling this setting does not remove existing licence time. When disabled, new purchases still receive the configured base licence days per Xanax, but no bonus days or bonus milestone progress are added.

## v1.1.389 note - locked screen 15-day wording

This update corrects the locked screen text to show **15 days per Xanax**. Licence/payment rules, API key usage, and backend terms are unchanged.

## v1.1.388 note - admin editable purchase bonuses

Admins can add or change the purchase bonus milestone rules from the Admin panel. These saved backend settings apply only to new Xanax licence purchases made after the change. Existing licence time is not removed or recalculated by editing bonus rules. API key usage and backend data handling are unchanged.


## v1.1.390 note - admin bonus dropdown and .env saving

Admins can now manage individual purchase bonus rules from a dropdown in the Admin panel. Bonus entries can be enabled, disabled, edited, added, or deleted, and saving attempts to write the updated bonus configuration to the server `.env` file. These changes apply only to new Xanax licence purchases after the edit. Existing licence time is not removed or recalculated. API key usage is unchanged.


## v1.1.391 note - updated purchase bonus defaults

This update changes the default cumulative user milestone bonuses to `25:30,50:30,75:30,100:30,150:30,200:30,250:30,300:30` and default single-order bonuses to `10:15,25:45,50:100,100:200,500:1000`. Admins can still add new bonuses from the dropdown; saved bonuses appear as their own green/red buttons and can be written back to `.env` when the server host allows file writes. Existing licence time is not removed or recalculated.


## v1.1.392 note - admin tools hidden until key verification

The userscript now hides admin-only controls until the server verifies a saved ADMIN_KEY. Bonus add/edit/delete/save requests are still protected by the backend admin key check, including `.env` writes.

