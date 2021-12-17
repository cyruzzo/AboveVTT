var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);

// load stylesheets
[
	"jquery-ui.min.css",
	"jquery.ui.theme.min.css",
	"jquery.contextMenu.css",
	"abovevtt.css",
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
	"jquery-1.8.2.min.js",
	"jquery-ui.min.js",
	"jquery.ui.widget.min.js",
	"jquery.ui.mouse.min.js",
	"jquery.ui.touch-punch.js",
	"jquery.contextMenu.js",
	"jquery.magnific-popup.min.js",
	"purify.min.js",
	"DnDBeyond/DDBCharacterData.js",
	"EncounterHandler.js",
	"SidebarPanel.js",
	"Journal.js",
	"Settings.js",
	"SoundPad.js",
	"color-picker.js",
	"AOETemplates.js",
	"SceneData.js",
	"CombatTracker.js",
	"StatHandler.js",
	"rpg-dice-roller.bundle.min.js",
	"MonsterDice.js",
	"Fog.js",
	"TokenMenu.js",
	"PlayerPanel.js",
	"Token.js",
	"Jitsi.js",
	"jitsi_external_api.js",
	"MessageBroker.js",
	"ScenesHandler.js",
	"MonsterPanel.js",
	"ScenesPanel.js",
	"mousetrap.1.6.5.min.js",
	"KeypressHandler.js",
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
