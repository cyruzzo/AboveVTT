["SceneData.js", "jquery.ui.touch-punch.js", "CombatTracker.js", "StatHandler.js", "rpg-dice-roller.bundle.min.js", "MonsterDice.js", "Fog.js", "jquery.contextMenu.js", "PlayerPanel.js", "Token.js", "Jitsi.js", "MessageBroker.js", "ScenesHandler.js", "MonsterPanel.js", "ScenesPanel.js", "Main.js"].forEach(function(value, index, array) {
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


var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);
