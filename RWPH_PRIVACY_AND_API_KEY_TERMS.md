# RWPH Privacy & Torn API Key Terms

**Version:** 1.1.555  
**Applies to:** Ranked War Payout Helper (RWPH) user-facing script and service

RWPH is a completed ranked-war payout helper for Torn. This document explains what normal users need to know about API keys, stored report data, licences and manual Torn actions. It intentionally does not document private owner/admin secrets or backend administration.

## Torn API disclosure

| Data Storage | Data Sharing | Purpose of Use | Key Storage & Sharing | Key Access Level |
|---|---|---|---|---|
| **Persistent service data:** licence/payment records and faction Cached Reports until deleted/expired. If you press **Save Key**, the user API key is stored locally on that browser/PDA device and is **not persistently stored in the RWPH database**. | **Faction + service operator:** authorised RWPH users whose key resolves to the same faction can open that faction's cached reports. The service operator can access backend records to operate/support RWPH. Data is not intentionally sold or publicly published. | Licence checks, Torn identity/faction checks, completed ranked-war calculations, Member Management, Cached Reports, Results, exports and newsletter generation. | **Stored locally / used transiently:** a saved key remains on the user's device. Features send it over HTTPS to the RWPH backend for Torn API requests; it is not persistently stored in the backend database or intentionally shared with unrelated third parties. | **Limited Access**, or a custom key containing only the user/faction/ranked-war/attack selections RWPH requires. RWPH never needs your Torn password. |

## What report data RWPH stores

RWPH can store up to **5 completed cached reports per faction**. A cached report can contain the calculation settings, member/result rows, payout totals and other data required to reopen the report without recalculating it. Cached reports remain until they are manually deleted, displaced/limited by the current cache rules, or removed by the faction's optional Auto Delete setting.

Because cached reports are faction-scoped, another authorised RWPH user who resolves to the same Torn faction can open that faction's cached reports.

## Licence and payment records

RWPH stores normal service records required to provide licences and payment verification, such as Torn player identity, licence status/expiry, pending payment codes and completed payment records. These records are separate from the user's locally saved Torn API key.

## Manual Torn actions

RWPH can provide helper/prefill controls for visible Torn forms, but final Torn transactions remain manual. In particular, RWPH does not automatically press the final **Send**, **Confirm**, attack or money-transfer action for the user. Always review visible Torn fields before manually submitting.

## Your controls

You can:

- replace the saved API key in RWPH at any time;
- revoke or rotate the key from Torn;
- delete cached reports through Cached Reports;
- disable Auto Delete or choose its expiry period;
- close/lock RWPH when you are finished;
- choose whether to use payment, export or newsletter tools.

## Accuracy and availability

RWPH depends on Torn API responses, the selected completed-war window, user settings, Member Management adjustments, browser/PDA behaviour and service availability. Review report totals before paying faction members. Torn/API/hosting/browser changes can temporarily interrupt features.

## Acceptance

By using RWPH and supplying a Torn API key, you acknowledge the disclosure above and consent to the key/data handling required for the RWPH features you choose to use.
