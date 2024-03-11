console.log("Load.js is executing");

if (window.location.search.includes("abovevtt=true")) {
	let loadingOverlay = document.createElement('div');
	loadingOverlay.setAttribute("id", "loading_overlay");
	(document.body || document.documentElement).appendChild(loadingOverlay);

	let loadingBg = document.createElement('div');
	loadingBg.setAttribute("id", "loading_overlay_bg");
	loadingOverlay.appendChild(loadingBg);
	if (window.location.pathname.includes("/encounters/")) {
		loadingBg.setAttribute("class", "dm");
	} else if (window.location.pathname.includes("/characters/")) {
		loadingBg.setAttribute("class", "player");
	}
}

var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);

var avttVersion = document.createElement('div');
avttVersion.setAttribute("style", "display:none;");
avttVersion.setAttribute("id", "avttversion");
avttVersion.setAttribute("data-version", chrome.runtime.getManifest().version);
(document.body || document.documentElement).appendChild(avttVersion);

// load stylesheets
[
	"abovevtt.css",
	"jquery-ui.min.css",
	"jquery.ui.theme.min.css",
	"jquery.contextMenu.css",
	"color-picker.min.css",
	"spectrum-2.0.8.min.css",
	"magnific-popup.css",
	"DiceContextMenu/DiceContextMenu.css"
].forEach(function(value, index, array) {
	let l = document.createElement('link');
	l.href = chrome.runtime.getURL(value);
	l.rel = "stylesheet";
	console.log(`attempting to append ${value}`);
	(document.head || document.documentElement).appendChild(l);
});


// load scripts
window.scripts = [
	// External Dependencies
	{ src: "jquery-3.6.0.min.js" },
	{ src: "jquery-ui.min.js" },
	{ src: "jquery.csv.js" },
	//{ src: "jquery.ui.widget.min.js" },
	//{ src: "jquery.ui.mouse.min.js" },
	{ src: "jquery.ui.touch-punch.js" },
	{ src: "jquery.contextMenu.js" },
	{ src: "jquery.magnific-popup.min.js" },
	{ src: "spectrum-2.0.8.min.js" },
	// { src: "jquery.ajax.queue.js" },
	{ src: "purify.min.js" },
	{ src: "rpg-dice-roller.bundle.min.js" },
	{ src: "color-picker.js" },
	{ src: "mousetrap.1.6.5.min.js" },
	{ src: "peerjs.min.js" },
	{ src: "fuse.min.js" },
	// AboveVTT Files
	{ src: "environment.js" },
	{ src: "AboveApi.js" },
	{ src: "DDBApi.js" },
	{ src: "AOETemplates.js" },
	{ src: "Text.js" },
	{ src: "CombatTracker.js" },
	{ src: "EncounterHandler.js" },
	{ src: "Fog.js" },
	{ src: "Journal.js" },
	{ src: "KeypressHandler.js" },
	{ src: "MessageBroker.js" },
	{ src: "MonsterDice.js" },
	{ src: "PlayerPanel.js" },
	{ src: "SceneData.js" },
	{ src: "scenedata/bgdia-scene-data.js" },
	{ src: "scenedata/tod-scene-data.js" },
	{ src: "scenedata/toa-scene-data.js" },
	{ src: "ScenesHandler.js" },
	{ src: "ScenesPanel.js" },
	{ src: "Settings.js" },
	{ src: "SidebarPanel.js" },
	{ src: "StatHandler.js" },
	{ src: "Token.js" },
	{ src: "TokenMenu.js" },
	{ src: "ChatObserver.js" },
	{ src: "DiceContextMenu/DiceContextMenu.js" },
	{ src: "TokensPanel.js" },
	{ src: "TokenCustomization.js" },
	{ src: "built-in-tokens.js" },
	{ src: "PeerManager.js" },
	{ src: "PeerCommunication.js" },
	{ src: "peerVideo.js"},
	{ src: "ajaxQueue/ajaxQueueIndex.js", type: "module" },
	{ src: "DiceRoller.js" },
	{ src: "Main.js" },
	{ src: "MonsterStatBlock.js" },
	// AboveVTT files that execute when loaded
	{ src: "CoreFunctions.js" }, // Make sure CoreFunctions executes before anything else
	{ src: "CampaignPage.js" },
	{ src: "CharactersPage.js" },
	{ src: "audio/index.js", type: "module" },
	{ src: "onedrive/onedrivemsal.js" },
	{ src: "onedrive/onedrivepicker.js" },
	// Startup must be the last file to execute. This is what actually loads the app. It requires all the previous files to be loaded first
	{ src: "Startup.js", type: "module" }

]

// Too many of our scripts depend on each other.
// This ensures that they are loaded sequentially to avoid any race conditions.
function injectScript() {
	if (scripts.length === 0) {
		delete window.scripts;
		return;
	}
	let nextScript = window.scripts.shift();
	let s = document.createElement('script');
	s.src = chrome.runtime.getURL(nextScript.src);
	if (nextScript.type !== undefined) {
		s.setAttribute('type', nextScript.type);
	}
	console.log(`attempting to append ${nextScript.src}`);
	s.onload = function() {
		console.log(`finished injecting ${nextScript.src}`);
		injectScript();
	};
	(document.head || document.documentElement).appendChild(s);
}

injectScript();
