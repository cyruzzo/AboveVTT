<h1>Changes in 0.65</h1>

<details><summary>Add monster AC to context menu (DM Only)</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/161">PR 161</a>
<img src="https://user-images.githubusercontent.com/584771/144754842-9e080f7b-fc63-435c-a439-ac074d8bd872.gif" />
</details>

<details><summary>Add player token customization</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/163">PR 163</a>
<h3>Player Token Context Menu</h3>
If the player token has not been placed, the context menu has four options: "Place Token", "Place Hidden token", "Copy Url", and "Customize". Once a token has been placed, the place token options are replaced with "Locate Placed Token".
<h3>Drag and Drop Token Placement</h3>
Player tokens can now be placed on a scene, by dragging the player token image onto a scene and dropping it where you want it placed. If a token has already been placed on a scene, the token will not be placed, but instead will highlight the already placed token.
<img src="https://user-images.githubusercontent.com/584771/144935662-b375ec9e-bfb5-4277-afca-c4a5b4ea7938.gif" />
<h2>Player Token Customization Modal</h2>
Just like the monsters modal, player tokens now support multiple images. Right-click the token in the players pane, and select "Customize" will open the customization modal.
<h3>Image list</h3>
If there are no images, the modal displays the character portrait, and has a form at the bottom to replace the current image.
<h3>Defaulting back to the portrait</h3>
If there are one or more custom images, the form also includes a "Remove All Custom Images" button which will reset back to using the character portrait.
<h3>Drag and Drop</h3>
Each custom image can be drag and dropped onto the scene as long as there isn't already a player token in the scene. If there is, the already placed token will be highlighted.
<img src="https://user-images.githubusercontent.com/584771/144935692-0e524265-5ba4-4be5-9b67-ed59fab9b4f2.gif" />
<h2>Changing the image of an already placed token</h2>
Right-clicking a placed token provides an option to "Change Image" which will open the customization modal. This modal acts exactly like the modal accessed via the Players Pane with one notable exception.
<h3>Set For This Token Only</h3>
At the bottom of the modal is a new button titled "Set For This Token Only" which allows the image to be set on the token without saving it for future use.
<img src="https://user-images.githubusercontent.com/584771/144935724-066d9de8-101a-4808-aa82-531e93295a84.gif" />
</details>

<details><summary>Add Ability to restrict player movement of tokens</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/165">PR 165</a>
<video controls><source src="https://user-images.githubusercontent.com/82621530/145080530-b2336c59-852f-46c6-b3d3-6955e4eddbd8.mp4" type="video/mp4"></video>
</details>

<details><summary>Add ability to change map units. (Defaulting to 'ft')</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/167">PR 167</a>
This setting can be found under the "Manual Grid Data" in Scene Settings.
<img src="https://i.imgur.com/mEJVRi6.png" />
</details>

<details><summary>Add Color Picker for Drawing Tool, and other improvements</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/168">PR 168</a>
<video controls><source src="https://user-images.githubusercontent.com/82621530/145339426-d20d2480-1b64-40b4-960d-209af68b33e7.mp4" type="video/mp4"></video>
</details>

<details><summary>Add alert message indicating players/DM aren't running latest version</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/170">PR 170</a>
On 'playerjoin' message, players will now send their AboveVTT version as well
and character ID.<br/>
The DM will save all of these, and alert in case it detects some players
are running a version older than the newest one seen yet (message broker
doesn't send us the latest available version, so we can't use that).<br/>
Backwards compatibility is handled by popping up a message saying
a player connected with an older version than 0.64 (as 0.65 will include
this change) and avoid popping up messages too fast (interval 3 seconds).<br/>
In addition, we don't re-pop alert message if the same player reconnected
without any change to its AboveVTT version.
</details>

<details><summary>Bug Fix: don't allow players to multi-select hidden tokens and move them</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/171">PR 171</a>
Prior to this fix, when using the selection box, players could select hidden tokens by mistake and move them. In addition, that would have caused the token to be unhidden.
</details>

<details><summary>Update settings panel UI, and add example tokens</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/178">PR 178</a>
This is a UI update to the settings tab.<br/>
It updates the style of the import / export section<br/>
It converts the checkboxes to a toggle that mimics the DDB content sharing settings.<br/>
It adds descriptive hover text to all the settings and import / export buttons<br/>
It adds example tokens that get updated as settings are changed to better show what all the settings do.<br/>
<img src="https://user-images.githubusercontent.com/584771/147675026-f6b13276-f28e-4d0e-8f7e-fbfa1b5e14cc.gif" />
</details>

<details><summary>Bug Fix: HTML sent over websocket is properly decoded.</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/179">PR 179</a>
Version 0.66 will start encoding HTML sent over websocket which will fix the "Send To Gamelog" button not working.
</details>

<details><summary>Add support for non-youtube animated maps</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/182">PR 182</a>
This commit adds support for video hosted animated maps.<br/>
This uses the browser's "video" capability, which means video files<br/>
other than mp4 could be used depending on local codec support.<br/>
Handles import/export backwards compatibility (previous maps are assumed<br/>
to have is_video as false).<br/>
Added a new checkbox to the scene editor called "Is Video?" for<br/>
both the player and DM maps. Logic is as follows:<br/>
If the URL is a youtube link, we handle the map as a YouTube video.<br/>
If "Is Video?" is checked, we handle the map as a hosted video file.<br/>
If "Is Video?" is unchecked, we handle the map as an image.<br/>
<video controls><source src="https://user-images.githubusercontent.com/5877139/146792483-ba194780-1f3f-46ac-b62d-a85421e49519.mov" type="video/mp4"></video>
</details>

<details><summary>Bug Fix: Various Jitsi bug fixes</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/183">PR 183</a>
switches over to the official jitis external api library<br />
fixes various little bugs associated with client / server version missmatching<br />
moved all sha1s out of LibrarySources.txt and into LOCK file for easier review<br />
wrote os portable lock.js for generating programmatically creating LOCK file<br />
</details>

<details><summary>Improvement: 2D line rendering optimizations</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/184">PR 184</a>
Minor 2D rendering optimizations - when drawing lines, we should draw all before stroking
</details>

<details><summary>Add ability to roll from sidebar stat blocks ("extras" tab on character sheets)</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/186">PR 186</a>
This parses sidebar stat blocks, and injects dice rolling abilities just like we do for monster stat blocks. I also added the ability to right-click the buttons which displays a modal like DDB does. The modal contains the following options:<br />
- Send To: [Everyone|Self] (DM only)<br />
- Roll With [Advantage|Flat|Disadvantage] (only for "to hit" roll types)<br />
- Roll As [Crit|Flat] (only for "damage" roll types)<br />
<img src="https://user-images.githubusercontent.com/584771/147706907-2f5b51a1-098b-4112-8fd1-7794baa6cc3f.gif" />
</details>

<details><summary>Improvement: Format AboveVTT dice rolls in the gamelog to match DDB Dice Rolls</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/187">PR 187</a>
This attempts to parse rpgDiceRolls to DDB format before sending them over the websocket. If the parsing fails for any reason or if the expression is too complex, it falls back to the old way.
<img src="https://user-images.githubusercontent.com/584771/147834617-e02e7204-1ce2-4309-822f-2db384b441c0.gif" />
</details>

<details><summary>Bug Fix: non-image links in the gamelog now display as links</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/188">PR 188</a>
I've gone with an alternative approach to the original. If a link is detected, we try to load an image tag with that link, if the image load succeeds, we create an image tag, otherwise we create an <a> tag.
</details>

<details><summary>Added additional regex searches for spells/abilities</summary>
<a href="https://github.com/cyruzzo/AboveVTT/pull/193">PR 193</a>
Added additional regex searches to handle spells and some monster abilities.<br />
Also added a distinction for each monster token when opening the sheet, so that each token has its own counters.<br />
The counters do not persist between game sessions. We can work that out if there is a great desire.<br />
Finally, made a minor change to the combat tracker to hopefully fix the little firefox bug of not showing the combat round.<br />
<video controls><source src="https://i.imgur.com/e95u5Hu.mp4" type="video/mp4"></video>
</details>




