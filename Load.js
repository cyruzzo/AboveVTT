var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);

["jquery.magnific-popup.min.js","purify.min.js","Settings.js","SoundPad.js","color-picker.js", "TokenMenu.js","SceneData.js", "jquery.ui.touch-punch.js", "CombatTracker.js", "StatHandler.js", "rpg-dice-roller.bundle.min.js", "MonsterDice.js", "Fog.js", "jquery.contextMenu.js", "PlayerPanel.js", "Token.js", "Jitsi.js", "MessageBroker.js", "ScenesHandler.js", "MonsterPanel.js", "ScenesPanel.js", "Main.js", "mousetrap.1.6.5.min.js", "KeypressHandler.js"].forEach(function(value, index, array) {
	var s = document.createElement('script');

	s.src = chrome.runtime.getURL(value);

	(document.head || document.documentElement).appendChild(s);

});


var l = document.createElement('link');
l.href = chrome.runtime.getURL("jquery.contextMenu.css");
l.rel = "stylesheet";

(document.head || document.documentElement).appendChild(l);

var l = document.createElement('link');
l.href = chrome.runtime.getURL("abovevtt.css");
l.rel = "stylesheet";

(document.head || document.documentElement).appendChild(l);

var l = document.createElement('link');
l.href = chrome.runtime.getURL("color-picker.min.css");
l.rel = "stylesheet";

(document.head || document.documentElement).appendChild(l);

var l = document.createElement('link');
l.href = chrome.runtime.getURL("magnific-popup.css");
l.rel = "stylesheet";

(document.head || document.documentElement).appendChild(l);

