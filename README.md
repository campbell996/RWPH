# Ranked War Payout Helper (RWPH)

<p align="center">
  <a href="https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/campbell996/RWPH/refs/heads/main/rwph.user.js">
    <img src="https://img.shields.io/badge/Download%20Here-Install%20%2F%20Update%20RWPH-00ff66?style=for-the-badge&labelColor=06111f&color=00ff66" alt="Download / Update Ranked War Payout Helper">
  </a>
</p>

<p align="center"><strong>Click Download Here to install RWPH or update your existing version.</strong></p>

**Current version:** 1.1.603  
**Author:** Evil_Panda_420  
**Game:** [Torn](https://www.torn.com/)

**RWPH** is a Torn userscript that helps factions calculate payouts for **completed ranked wars**, review member contributions, save reports, prepare faction payments and create newsletters. It provides the information and prefill tools; **you review and manually confirm all Torn payments**.

---

## Getting started

1. Click **Download Here** above and install/update the userscript using a compatible userscript manager or Torn PDA setup.
2. Open your faction page in Torn and click the **RWPH launcher** beside the faction heading.
3. Enter your Torn **Limited Access API key** (or an appropriately configured custom key) and choose **Save Key** if you want to remember it on that device.
4. Unlock your active licence, start an available trial if eligible, or use **Buy / Extend Licence**.
5. Choose **Basic Calculations** or **Advanced Calculations**.
6. Select a completed ranked war, check the war dates, enter the payout amount and review any Member Management adjustments.
7. Click **Calculate**, review the Results panel and choose whether to download, create a newsletter or start payments.

RWPH is intended for **finished ranked wars**. Always check the selected war and payout figures before paying anyone.

## Calculating ranked-war payouts

### Basic Calculations — War Hits only

Basic uses **successful War Hits from the finished ranked-war report**. Each payable War Hit has equal weight. It automatically uses the faster ranked-war-report method; there are no extra Assist, Outside Hit or Retal scoring options in Basic.

Respect can appear in the report, but it **does not change the Basic payout split**.

### Advanced Calculations — Customisable points

Advanced lets you choose a calculation preset, then edit the scoring values before calculating. Presets are starting points, **not locked formulas**. You can use **Reload Selected Preset Defaults** to restore a preset's normal values.

The available presets include Hybrid — Hits + Performance, Weighted Points, Exact Fair Fight, Fixed Pay Per Hit, Adjusted Respect Share, Tiered Fair Fight, Base Pay + Bonus Points, Energy / Efficiency, Equal / Participation Pay, RWPH Recommended and RWPH Classic Advanced.

Depending on your settings, Advanced can account for:

- War Hits, Assists, Outside Hits and War Retals.
- Fair Fight and Respect-based scoring.
- Overseas and other available modifiers.
- Hospitalisation bonuses, including separate own-faction and enemy-faction options.
- Adjustable scoring and payout allocations for the selected system.

Click the small **?** next to an Advanced setting for an explanation of what it does.

### Payout amounts

RWPH accepts ordinary numbers and common shorthand, such as `100m`, `1.5b`, `346.21b` and `1t`.

## Member Management

Before calculating, open **Member Management** to adjust eligible payouts:

- **Remove / Exclude:** Leave a member out of the payout.
- **Remove Hits:** Subtract selected payable hits from a member.
- **Remove Respect:** Subtract selected Respect from a member's report figures; this only affects the payout where the calculation uses Respect.

Save your adjustments to use them in the current calculation. They are temporary and remain available for approximately **20 minutes**.

## Cached Reports — Five per faction

RWPH saves up to **five completed reports per faction**. Use **Cached Reports** on the unlocked main panel to view the five slots, reopen a report or delete one you no longer need.

- **Load Report:** Reopen the saved result without recalculating the war.
- **Delete Report:** Free a slot for a new report.
- **Auto Delete:** Optionally remove reports after a chosen expiry period.
- **Matching settings:** If you try to calculate with the same effective settings as a saved report, RWPH opens Cached Reports and highlights the matching report rather than calculating it again.

If all five slots are occupied and there is no exact match for your new calculation, delete an old report before saving another.

The Cached Reports panel can immediately show a **recently verified** list while it refreshes. Loading or deleting a report still requires an active connection.

## Licences and the Xanax Payment Helper

RWPH provides **Solo** and **Faction** licences. Use **Buy Licence** or **Extend Licence** and follow the **Payment Helper Wizard** on Torn's normal Items page.

### Solo licence

**1 Xanax = 10 days** for one person.

### Faction licence

Faction licences let you select faction members who have **Faction API Access** through their faction positions. Your own account is always included and cannot be removed from your selection. A faction licence requires **at least two people**: you and one other eligible member.

**Every third selected member is free** for each 10-day licence block:

| Selected members, including yourself | Paid members | Free members | Cost per 10 days |
|---:|---:|---:|---:|
| 2 | 2 | 0 | 2 Xanax |
| 3 | 2 | 1 | 2 Xanax |
| 5 | 4 | 1 | 4 Xanax |
| 6 | 4 | 2 | 4 Xanax |
| 9 | 6 | 3 | 6 Xanax |

When extending a faction licence, you can **keep the previously selected members** or **add/remove eligible members** before confirming. Removed members keep any time they already paid for, but do not receive the new extension.

### Sending the Xanax

The Payment Helper Wizard guides you through:

1. Preparing **Xanax → Send this item → Add Message** in Torn.
2. Choosing the licence type, selected faction members (if applicable) and Xanax amount.
3. Using **Prefill Name / ID**, **Prefill Message Code** and **Prefill Xanax Amount**.
4. Reviewing the visible Torn recipient, Xanax quantity and **exact payment message code**.
5. **Manually** sending the Xanax in Torn.

The wizard can use your clipboard if Torn doesn't allow a field to be filled directly. Its step highlighting is guidance only; other navigation buttons remain usable. **RWPH never presses Torn's final Send/Confirm button for you.**

## Results, exports and payments

The **Loading Results** panel shows calculation progress. When a report is ready, the **Results** panel shows member payouts and the available contribution statistics.

From Results you can:

- **Download HTML** or **Download CSV** for a copy of the report.
- **Newsletter:** Create a faction payout newsletter from the report.
- **Start Payments:** Open the **Payment Copy Wizard** and move to Torn's faction payment area.

### Payment Copy Wizard

Before starting, read and accept the warning. **Check that Torn faction controls are set to _Add To Balance_, not _Give money_, when using the RWPH payout workflow.** The **Start Payments** button remains disabled until you click **Accept Warning**.

For each member, use **Prefill Name / ID** and **Prefill Amount** to help populate Torn's payment fields. Verify the selected member and amount, then submit the payment **yourself** in Torn. The highlights guide you but do not lock the other wizard controls.

When the checklist is complete, you can still open the **Newsletter** tool or download **HTML / CSV**.

## Payout newsletters

Create a themed newsletter from a completed report. Available layouts are:

- **Panel Cards — 2 Column**
- **Leaderboard — 1 Column**
- **Compact Cards — 3 Column**

Choose a colour preset or **Custom** colours. The newsletter uses your faction's image and offers a preview plus **Raw HTML** for pasting into Torn.

**Member Card Stats** lets you add optional statistics used in the report. The member's payout and primary calculation statistic remain visible. RWPH checks the newsletter's **65,535-character limit** and prevents copying HTML that is too long.

## Panels, colours and devices

- Move supported panels by dragging their headers and resize them with their available corner handles.
- Use **Theme / Colours** to personalise supported panels and buttons, and **Logo Selector** to choose an RWPH logo style.
- RWPH supports desktop and phone/PDA layouts. Depending on screen or panel size, some content may need scrolling.

## API key and privacy

RWPH needs a **Limited Access** Torn API key, or a custom key with the permissions required for the features you use. It does **not** need your Torn password.

If you choose **Save Key**, the key is saved on your device. RWPH uses it to request the Torn information needed for features such as licence checks, war calculations and faction-member eligibility. Licence/payment records and saved faction reports can be retained so those features work across sessions.

You can replace your saved key or revoke it in Torn. For more information, see the **Help → API Key & Privacy** section inside RWPH.

## Common problems

| Problem | What to try |
|---|---|
| RWPH launcher is missing | Check that the userscript is enabled, open a Torn faction page and refresh Torn. |
| Licence is still checking | Check your connection and allow the request to finish; temporary service interruptions can delay checks. |
| Cannot calculate | Check your API key, active licence, completed war dates and payout settings. |
| Torn API is rate-limited | Allow Torn's API requests to recover, then retry. |
| Cached report is missing | Check the faction, open **Cached Reports**, and see whether the report was deleted or expired. |
| Payment prefill does not work | Manually open the correct Torn form and try Prefill again, or paste the copied field value yourself. |
| A button or panel behaves strangely | Refresh Torn, reopen RWPH and confirm you have installed the latest version. |

**Remember:** RWPH assists with calculations, reports and prefilling fields. Always review your data and complete any real Torn payment actions manually.
