
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
	"spectrum-2.0.8.min.css",
	"magnific-popup.css"
].forEach(function(value, index, array) {
	let l = document.createElement('link');
	l.href = chrome.runtime.getURL(value);
	l.rel = "stylesheet";
	console.log(`attempting to append ${value}`);
	(document.head || document.documentElement).appendChild(l);
});


// load scripts
let scripts = [
	// External Dependencies
	{ src: "jquery-3.6.0.min.js" },
	{ src: "jquery-ui.min.js" },
	//{ src: "jquery.ui.widget.min.js" },
	//{ src: "jquery.ui.mouse.min.js" },
	{ src: "jquery.ui.touch-punch.js" },
	{ src: "jquery.contextMenu.js" },
	{ src: "jquery.magnific-popup.min.js" },
	{ src: "spectrum-2.0.8.min.js" },
	// { src: "jquery.ajax.queue.js" },
	{ src: "purify.min.js" },
	{ src: "jitsi_external_api.js" },
	{ src: "rpg-dice-roller.bundle.min.js" },
	{ src: "color-picker.js" },
	{ src: "mousetrap.1.6.5.min.js" },
	// AboveVTT Files
	{ src: "AOETemplates.js" },
	{ src: "CombatTracker.js" },
	{ src: "DnDBeyond/DDBCharacterData.js" },
	{ src: "EncounterHandler.js" },
	{ src: "Fog.js" },
	{ src: "Jitsi.js" },
	{ src: "Journal.js" },
	{ src: "KeypressHandler.js" },
	{ src: "MessageBroker.js" },
	{ src: "MonsterDice.js" },
	{ src: "MonsterPanel.js" },
	{ src: "PlayerPanel.js" },
	{ src: "SceneData.js" },
	{ src: "ScenesHandler.js" },
	{ src: "ScenesPanel.js" },
	{ src: "Settings.js" },
	{ src: "SidebarPanel.js" },
	{ src: "SoundPad.js" },
	{ src: "StatHandler.js" },
	{ src: "Token.js" },
	{ src: "TokenMenu.js" },
	// Files that execute when loaded
	{ src: "ajaxQueue/ajaxQueueIndex.js", type: "module" },
	{ src: "DiceRoller.js" },
	{ src: "Main.js" }
]

// Too many of our scripts depend on each other. 
// This ensures that they are loaded sequentially to avoid any race conditions.

function injectScript() {
	if (scripts.length === 0) {
		return;
	}
	let nextScript = scripts.shift();
	let s = document.createElement('script');
	s.src = chrome.runtime.getURL(nextScript.src);
	if (nextScript.type !== undefined) {
		s.setAttribute('type', nextScript.type);
	}
	console.log(`attempting to append ${nextScript}`);
	s.onload = function() {
		console.log(`finished injecting ${nextScript}`);
		injectScript();
	};
	(document.head || document.documentElement).appendChild(s);
}

injectScript();
