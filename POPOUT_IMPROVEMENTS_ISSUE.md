# Popout Stat Block Improvements: Reload Resilience via BroadcastChannel, and Context Menu Fixes

## Summary
Popout stat blocks (PSBs) currently suffer from loss of connection when the main VTT tab refreshes or reconnects. This change introduces an origin-wide `BroadcastChannel` bridge (`abovevtt_statblock_bridge`) to keep popout stat blocks functional across page reloads (keeping popouts open across scenes for multi-scene encounters), and resolves bugs with roll avatars and dice context menus in popouts.

---

## Problems Identified

1. **Tab Refresh / Reconnect Disconnect:**
   - Refreshing or reconnecting the main VTT tab wipes in-memory window handles (`window.childWindows`). The popout's cloned DOM event listeners point to closures in the destroyed parent tab context, breaking all roll buttons after a refresh.
2. **Missing Combined Ability Rolls Post-Refresh:**
   - Boxed action headers (e.g., **"Slam."**) that execute combined attack + damage rolls (`.avtt-ability-roll-button`) fail after refresh.
3. **Incorrect Gamelog Avatar from Popouts:**
   - In some stat block popouts, rolls sent to the gamelog display the D&D Beyond red decorative bar (`stat-block-header-bar.svg`) instead of the token's avatar image.
4. **Popout Context Menu Issues (Pre-existing & Post-Refresh):**
   - **Premature Close (Pre-existing):** Right-clicking a roll button opens the AboveVTT context menu (to select Advantage, Crit, etc.), but clicking any checkbox/option immediately dismisses the menu because the outer presentation backdrop listener lacked a `target !== currentTarget` check.
   - **Lost Context Menu on Refresh:** Right-clicking a roll button after a main tab reload fell back to the native browser context menu.

---

## Changes Implemented

1. **BroadcastChannel Statblock Bridge (`DiceContextMenu/StatblockBridge.js`):**
   - Injected into popout stat blocks via `<script src="...">` from `web_accessible_resources`.
   - Runs in the popout window's independent execution context, remaining active and responsive across parent tab refreshes.
   - Captures roll clicks in capture phase and dispatches roll payloads over a shared `BroadcastChannel('abovevtt_statblock_bridge')`.
   - Keeps popout stat blocks open across scenes so encounters spanning multiple scenes remain uninterrupted.

2. **Combined Ability Roll Support:**
   - The bridge identifies `.avtt-ability-roll-button` elements, queries the associated to-hit and damage roll buttons in DOM order, and dispatches a `multiroll` message.
   - `Startup.mjs` feeds these into `DiceRoller.roll(..., multiroll = true)` to preserve combined rolls and natural 20 critical hit auto-doubling.

3. **Token Avatar Resolution:**
   - Prevented falling back to generic `img` tags (which matched `.mon-stat-block__separator-img`).
   - The receiver in `Startup.mjs` cross-references `entityId` (`tokenId`) against `window.all_token_objects` to always attach the token's active canvas image.

4. **Popout Context Menu Fixes:**
   - Loaded `DiceContextMenu.js` and jQuery into the popout window and wired a capture-phase `contextmenu` listener so right-clicking roll buttons works after refresh.
   - Added `if (clickEvent.target !== clickEvent.currentTarget) return;` to the backdrop dismiss listener in `Main.js`, allowing users to select options (Advantage, Disadvantage, etc.) without closing the menu, and then click **Roll**.
   - Wired the context menu's roll action to dispatch over the bridge when in a popout window.

---

## Testing & Verification

- [x] **Scene Switch (No Refresh):** Switching maps as DM or Player closes open stat block popouts; journal/token notes remain open.
- [x] **Reload Resilience:** Pop out a stat block -> refresh main tab -> PSB stays open -> single rolls and combined ability rolls (**Slam.**) execute successfully in gamelog.
- [x] **Scene Switch (Post-Refresh):** Pop out a stat block -> refresh main tab -> switch scene -> PSB receives `{ type: 'close' }` over BroadcastChannel and closes cleanly.
- [x] **Avatar Image:** Rolls from popout stat blocks show the token's portrait rather than a red block.
- [x] **Dice Context Menu:** Right-clicking a roll button in a PSB (before and after refresh) opens the custom menu; selecting an option keeps the menu open; clicking **Roll** executes the modified roll.

5. **Non-Popout Statblock Multi-Scene Resilience (`MonsterStatBlock.js` & `MonsterDice.js`):**
   - Fixed `ReferenceError: target is not defined` crash in non-popout combo buttons when switching maps by referencing `container` / `targetRescan` instead of undefined `target`.
   - Updated token lookup to check `window.TOKEN_OBJECTS?.[tokenId] || window.all_token_objects?.[tokenId]` across all monster stat block functions, ensuring tokens placed on other scenes remain fully interactive.
   - Brought roll button collection into compliance using DOM-order document position resolution (`get_statblock_ability_roll_buttons`), matching the popout bridge behavior.
