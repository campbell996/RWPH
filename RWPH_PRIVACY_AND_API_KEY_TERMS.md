
## v1.1.212 API ToS / Usage Summary

RWPH uses a saved Torn API key to verify the user's Torn ID/faction access and fetch the ranked war data needed for payout calculations. This may include faction/member names and IDs, ranked war timing where available, and attack records inside the selected war time window.

The userscript stores the API key locally in browser/Torn PDA userscript storage when the user clicks **Save Key**. The key is sent to the configured RWPH backend only when checking licence/payment access or calculating payout results. The backend is not designed to save user API keys in `paywall-db.json`.

RWPH does not need the user's Torn password, does not log into the user's Torn account, and does not automatically send Torn money or Xanax. All Torn money payments and Xanax item sends must be reviewed and confirmed manually by the user inside Torn.

# RWPH Privacy And API Key Terms

## Purpose of Use
RWPH uses a user's Torn API key to identify the Torn account, verify licence ownership, fetch faction and ranked-war data, calculate payouts, check licence status, and check payment/licence extension status.

## API Key Access Level
Users should use a Torn Limited Access API key with only the access needed for faction API calls and ranked-war payout calculations. Users should not provide a full-access key.

## Local Key Storage
When a user clicks Save Key, the userscript stores the key locally in that user's Tampermonkey or Torn PDA storage on that device.

## Backend Key Handling
The key is sent to the RWPH backend during unlock, licence, payment, war-time, and calculation requests so the backend can call the Torn API. The backend is not designed to save user API keys in paywall-db.json.

## Backend Stored Data
The backend database may store licence records, trial use, payment codes, used payment records, Xanax quantities, bonus progress, revoked users, payment fingerprints, Torn IDs, names, and expiry times.

## Data Sharing
RWPH data is for operating the tool only. User API keys and licence/payment records will not be sold, posted publicly, or shared with unrelated third parties.

## User Responsibility
Users should revoke or rotate their Torn API key anytime they no longer want RWPH to use it.

## Owner Responsibility
The backend owner must keep .env, OWNER_TORN_API_KEY, ADMIN_KEY, PAYWALL_SECRET, and paywall-db.json private and secure.
