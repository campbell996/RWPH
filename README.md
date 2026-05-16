Ranked War Payout Helper

Ranked War Payout Helper is a Torn userscript designed to help faction leaders,
payout managers, and trusted admins calculate ranked war payouts quickly, safely, and consistently.


The script provides a compact in-game panel, server-side license protection, ranked war payout calculations,
member result cards, CSV export, HTML payout newsletters, Add Balance helper links, and a Xanax-based license
payment flow.


Torn Userscript
Ranked War Payouts
Server-Side Locked
Xanax License System
CSV Export
HTML Newsletter
What This Script Does

Ranked War Payout Helper helps calculate how much each faction member should be paid after a ranked war.
It can fetch war activity, apply payout weights, calculate each member’s share, and display the results in
a clean payout panel.


The script is built for payout managers who want a faster way to review attacks, assists, respect, weighted
scores, and final payout amounts without manually building everything from scratch.

Server-Side Protection

This script is server-side locked. The Tampermonkey userscript is only the front-end panel.
Unlock checks, free trials, payment checks, license expiration checks, admin actions, and payout calculations
must go through the backend server.


If the backend server is offline, the ngrok tunnel is closed, or the script is pointing to the wrong
PAYWALL_API_BASE, users will not be able to unlock, check payments, check expiration,
claim trials, or calculate payouts.


Removing the visible paywall from the userscript does not unlock the protected calculation routes.
The backend still rejects users without a valid license.

Main Features
Launcher Button
Small RWPH launcher button on Torn.
Opens and closes the Ranked War Payout Helper panel.
Can be moved between screen corners.
Saves the chosen launcher position.
Locked Access Screen
Users must unlock the helper before using protected features.
Supports paid licenses, admin-granted licenses, and a one-time free trial.
Requires the user’s Torn API key.
License status is checked through the backend server.
2 Day Free Trial
Each Torn account can claim one free 2 day trial.
Trial use is saved server-side.
Clearing Tampermonkey storage does not reset the trial.
Trial licenses work like normal licenses during the trial period.
Xanax Payment System
Users can click Start Payment to generate a unique payment code.
The payment code is saved locally for 10 minutes if unused.
Each Xanax sent to Evil_Panda_420 [3236276] adds 15 days to the user’s licence.
The exact payment code must be included as the message.
Check Payment asks the backend to verify the item and matching message.
If the payment is found, the backend grants or extends the license.
RWPH Xanax Payment Helper
Opens the Torn items page.
Shows a floating payment helper box.
Copies the payment code as a fallback.
Includes buttons to paste the receiver and payment code into the open send form.
Does not click final Send or Confirm.
The user still chooses the quantity and manually confirms the item send.
Your Expiration
Shows who the license belongs to.
Shows how much time is left.
Shows the license expiry date and time.
Works through the backend license database.
Ranked War Payout Calculation
Auto-fills current or recently finished war times where available.
Allows manual start and finish time input.
Lets payout managers enter the total payout pool.
Supports normal hit weight.
Supports assist weight, with default assist weight set to 0.
Can filter ranked war attacks.
Can include chain-hit fallback if ranked war flags are missing.
Calculations are performed through the backend server.
Fetch + Calculate Results
Fetches war data and member activity.
Checks the user’s license before calculating.
Displays member payout result cards in a separate results panel.
Shows member name, Torn ID, payout amount, attacks, assists, respect, and weighted score.
Includes a close button for the results panel.
Add Balance Buttons
Each member result card includes an Add Balance button.
The button opens Torn faction controls in a new tab.
The member and payout amount are prefilled where supported.
The user still manually reviews and confirms the payment in Torn.
Add Balance (All)
Opens every member’s Add Balance page one at a time.
Runs from one button press.
Designed to reduce popup blocking by opening tabs in sequence.
Final faction money transfers are still manually confirmed by the user.
Export CSV
Exports payout results into a spreadsheet-friendly CSV file.
Includes member IDs, names, stats, weights, and payout amounts.
Export button appears in the results panel toolbar beside Add Balance options.
Create HTML Newsletter
Creates a styled HTML ranked war payout report.
Includes payout summary totals.
Includes average payout information.
Includes chart-style payout sections.
Includes a full member payout table.
Useful for sharing war payout summaries with faction members.
How Users Unlock Access
Install Tampermonkey.
Install the latest Ranked War Payout Helper userscript.
Open Torn.
Click the RWPH launcher button.
Enter a Torn API key with limited access.
Use the 2 day free trial, or generate a payment code with Start Payment.
Send Xanax to Evil_Panda_420 [3236276] with the exact payment code as the message.
Click Check Payment.
If the backend finds the payment, the license unlocks.
How To Calculate Payouts
Unlock the helper first.
Open the payout tab.
Enter the user’s Torn API key.
Click Auto-fill War Times or manually enter war start and finish times.
Enter the total payout pool.
Adjust hit weight and assist weight if needed.
Choose ranked war filtering options.
Click Fetch + Calculate.
Review the result cards in the results panel.
How To Pay Members
Calculate results first.
Use Add Balance on a member card to open that member’s prefilled faction controls page.
Use Add Balance (All) to open all payout tabs one at a time.
Review the member and amount in Torn.
Manually confirm the payment inside Torn.

The script does not automatically send faction money. It prepares payout pages only.
The user remains responsible for reviewing and confirming every payment.

Admin Tools

The script also includes admin tools for the owner or trusted admins. These tools require the private admin key
and communicate with the backend server.

Save admin key locally in Tampermonkey storage.
List current licenses.
Grant a license by Torn ID.
Extend an existing license.
Revoke a license.
Grant the configured owner a long owner license.
Backend Requirements

Normal users only need the Tampermonkey userscript. The owner must keep the backend server running.
The backend handles trials, license checks, payment checks, admin routes, database records, and protected payout calculations.

The backend can run on localhost for private testing.
The backend can run through ngrok for temporary online access.
The backend can be hosted on a Node.js host for public use.
The userscript must point to the backend URL with PAYWALL_API_BASE.
For public users, PAYWALL_API_BASE must not be localhost.
Private Owner Files And Secrets
Do not share these with normal users:

.env
OWNER_TORN_API_KEY
ADMIN_KEY
PAYWALL_SECRET
paywall-db.json
server.js backend files, unless intentionally hosting or developing privately
Troubleshooting
Failed to fetch: backend server is offline, ngrok is closed, or the API base URL is wrong.
Cannot unlock: check the API key, payment code, receiver, item, and backend console.
Cannot calculate: check license status, war times, API key access, and server health.
Add Balance tabs blocked: allow popups/tabs for Torn or use individual Add Balance buttons.
Xanax helper will not paste: manually paste the copied receiver and code into the open send form.
Online test: open your backend URL followed by /health. If that fails, the userscript cannot work online.
Summary

Ranked War Payout Helper is a compact Torn payout tool built for ranked war payout management.
It combines server-side licensing, free trials, Xanax-based payments, secure calculation routes,
payout result cards, Add Balance helpers, CSV exports, and HTML payout newsletters.


The most important thing to remember is simple:
the userscript needs the backend server to unlock and calculate.


Ranked War Payout Helper is a third-party helper script for Torn payout management.
Users should always review all calculated payouts and payment pages before sending money or items.
