
if (window.location.search.includes("abovevtt=true")) {
	let loadingOverlay = document.createElement('div');
	loadingOverlay.setAttribute("id", "loading_overlay");
	loadingOverlay.setAttribute("style", "position: fixed; top: -2%; left: -2%; width: 104%; height: 104%; z-index: 70000; background-color: #26282a;");
	(document.body || document.documentElement).appendChild(loadingOverlay);
}

var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);

// load stylesheets
[
	"abovevtt.css",
	"jquery-ui.min.css",
	"jquery.ui.theme.min.css",
	"jquery.contextMenu.css",
	"color-picker.min.css",
	"magnific-popup.css"
].forEach(function(value, index, array) {
	var l = document.createElement('link');
	l.href = chrome.runtime.getURL(value);
	l.rel = "stylesheet";
	console.log(`attempting to append ${value}`);
	(document.head || document.documentElement).appendChild(l);
});


// load scripts
let scripts = [
	// External Dependencies
	"jquery-3.6.0.min.js",
	"jquery-ui.min.js",
	//"jquery.ui.widget.min.js",
	//"jquery.ui.mouse.min.js",
	"jquery.ui.touch-punch.js",
	"jquery.contextMenu.js",
	"jquery.magnific-popup.min.js",
	"purify.min.js",
	"jitsi_external_api.js",
	"rpg-dice-roller.bundle.min.js",
	"color-picker.js",
	"mousetrap.1.6.5.min.js",
	// AboveVTT Files
	"AOETemplates.js",
	"CombatTracker.js",
	"DnDBeyond/DDBCharacterData.js",
	"EncounterHandler.js",
	"Fog.js",
	"Jitsi.js",
	"Journal.js",
	"KeypressHandler.js",
	"MessageBroker.js",
	"MonsterDice.js",
	"MonsterPanel.js",
	"PlayerPanel.js",
	"SceneData.js",
	"ScenesHandler.js",
	"ScenesPanel.js",
	"Settings.js",
	"SidebarPanel.js",
	"SoundPad.js",
	"StatHandler.js",
	"Token.js",
	"TokenMenu.js",
	// Files that execute when loaded
	"Main.js"
]

// Too many of our scripts depend on each other. 
// This ensures that they are loaded sequentially to avoid any race conditions.

function injectScript() {
	if (scripts.length == 0) {
		return;
	}
	let nextScript = scripts.shift();
	var s = document.createElement('script');
	s.src = chrome.runtime.getURL(nextScript);
	console.log(`attempting to append ${nextScript}`);
	s.onload = function() {
		console.log(`finished injecting ${nextScript}`);
		injectScript();
	};	
	(document.head || document.documentElement).appendChild(s);
}

injectScript();
