/* LoadCharacterPage.js
*
* Double-check the manifest, but this script should only be executed on the character sheet when abovevtt is not running
*/

console.log("LoadCharacterPage.js is executing");

// Make sure we don't execute this file if Load.js has executed
const isVttGamePage = window.location.search.includes("abovevtt=true");

if (!isVttGamePage) {

    var l = document.createElement('div');
    l.setAttribute("style", "display:none;");
    l.setAttribute("id", "extensionpath");
    l.setAttribute("data-path", chrome.runtime.getURL("/"));
    (document.body || document.documentElement).appendChild(l);

    // load stylesheets
    [
        "DiceContextMenu/DiceContextMenu.css"
    ].forEach(function(value, index, array) {
        let l = document.createElement('link');
        l.href = chrome.runtime.getURL(value);
        l.rel = "stylesheet";
        console.log(`attempting to append ${value}`);
        (document.head || document.documentElement).appendChild(l);
    });

    window.scripts = [
        // External Dependencies
        { src: "jquery-3.6.0.min.js" },
        // AboveVTT Files
        { src: "CoreFunctions.js" },
        { src: "DiceContextMenu/DiceContextMenu.js" },
        // Files that execute when loaded
        { src: "DiceRoller.js" },
        { src: "CharactersPage.js" } // this needs to execute after DiceRoller
    ]

    // Too many of our scripts depend on each other.
    // This ensures that they are loaded sequentially to avoid any race conditions.
    function injectScript() {
        if (window.scripts.length === 0) {
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
}
