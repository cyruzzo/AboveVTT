var l = document.createElement('div');
l.setAttribute("style", "display:none;");
l.setAttribute("id", "extensionpath");
l.setAttribute("data-path", chrome.runtime.getURL("/"));
(document.body || document.documentElement).appendChild(l);

// ["JitsiInternal.js"].forEach(function(value, index, array) {
	// var s = document.createElement('script');

	// s.src = chrome.runtime.getURL(value);

	// (document.head || document.documentElement).appendChild(s);

// });
	

var l = document.createElement('link');
l.href = chrome.runtime.getURL("abovevtt_jitsi.css");
l.rel = "stylesheet";

(document.head || document.documentElement).appendChild(l);

