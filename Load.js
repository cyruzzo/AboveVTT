(async function() { //don't leave clutter after load

const isVttGamePage = window.location.search.includes("abovevtt=true");
//match campaign page exactly in case other pages ever get added like campaigns/join that we want to exclude    
const isCampaignPage = !!window.location.pathname.match(/\/campaigns\/[0-9]+$/gi);
const isPlayerPage = !!window.location.pathname.match("/characters");
const isPlainCharacterPage = !isVttGamePage && isPlayerPage //character, builder, or listing

console.log("🎲 AVTT: extension", isVttGamePage ? "VTT":"", isPlainCharacterPage ? "CHAR":"", isCampaignPage ? "CMPGN":"");    
if(!isPlainCharacterPage && !isCampaignPage && !isVttGamePage) {
    console.log("⛔  AVTT: no loading here.")
    return; //don't load anything
}
console.log("⌛ AVTT Loading...")

const isDM = isCampaignPage && window.location.search.includes("dm=true");
const isPopoutGameLog = window.location.search.includes("popoutgamelog=true");
    
const getExtURL = (url) => (chrome || browser).runtime.getURL(url);
const addChild = (c, head=false) => (document[head ? "head" : "body"] || document.documentElement).appendChild(c);

if (isVttGamePage && !isPlainCharacterPage) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = "loading_overlay";
    const loadingBg = document.createElement('div');
    loadingBg.id = "loading_overlay_bg";
    loadingBg.className = isPlayerPage ? "player" : "dm";
    loadingOverlay.appendChild(loadingBg);
    addChild(loadingOverlay); // Add to DOM last to avoid multiple repaints
}

const l = document.createElement('div');
l.id = "extensionpath"
l.style.display = "none";
l.setAttribute("data-path", getExtURL("/"));
addChild(l);
const avttVersion = document.createElement('div');
avttVersion.id = "avttversion";
avttVersion.style.display = "none";
avttVersion.setAttribute("data-version", (chrome||browser).runtime.getManifest().version);
addChild(avttVersion, true);

/////////////////////////////////////
// Style sheet variants to load:
// PlainCharacter, CampaignOrVTT
const loadStyle = isPlainCharacterPage ? [
		"DiceContextMenu/DiceContextMenu.css",
		"jquery.contextMenu.css"
	] : [
		"abovevtt.css",
		"jquery-ui.min.css",
		"jquery.ui.theme.min.css",
		"jquery.contextMenu.css",
		"color-picker.min.css",
		"spectrum-2.0.8.min.css",
		"magnific-popup.css",
		"DiceContextMenu/DiceContextMenu.css"
        ];

loadStyle.forEach(function(value, index, array) {
    const l = document.createElement('link');
    l.href = getExtURL(value);
    l.rel = "stylesheet";
    console.log(`🎨 Loading Style ${value}`);
    addChild(l, true);
});
		
/////////////////////////////////////
// Script loading

//add scripts that are type:module here
const MODULES = { "ajaxQueue/ajaxQueueIndex.js" : true, "audio/index.js" : true, "Startup.js" : true };
	
// Variants of Scripts to load:
// PlainCharacter, NonDMPlayer, NonDMPopout, CampaignOnly, NormalScene
//  Then run Startup if VTTPage
const scripts = isPlainCharacterPage ? [
		// External Dependencies
		"jquery-3.6.0.min.js",
		"jquery.contextMenu.js",	
		"purify.min.js",	
		"ajaxQueue/ajaxQueueIndex.js",
		// AboveVTT Files
		"CoreFunctions.js", // Make sure CoreFunctions executes first
		"DDBApi.js",
		"MonsterDice.js",
		"DiceRoller.js",
		"DiceContextMenu/DiceContextMenu.js",
		"MessageBroker.js",
		"rpg-dice-roller.bundle.min.js",
		// AboveVTT files that execute when loaded
		"CharactersPage.js" // Make sure CharactersPage executes last
	] : (isPopoutGameLog && !isDM) ? [
		"jquery.magnific-popup.min.js",
		"purify.min.js",
		"environment.js",
		"CoreFunctions.js", 	
		"rpg-dice-roller.bundle.min.js",
		"DiceContextMenu/DiceContextMenu.js",
		"DiceRoller.js",	
		"DDBApi.js", 
		"Settings.js",
		"MessageBroker.js",
		"Journal.js",
		"ChatObserver.js",
		"MonsterStatBlock.js",
		"MonsterDice.js",
		"CampaignPage.js"
	] : (isCampaignPage && !isVttGamePage) ? [      
		"environment.js",
		"CoreFunctions.js", 		
		"DDBApi.js", 
		"Settings.js",
		"CampaignPage.js"
	] : [
		// External Dependencies
		"jquery-3.6.0.min.js",
		"jquery-ui.min.js",
		"jquery.csv.js",
		//"jquery.ui.widget.min.js",
		//"jquery.ui.mouse.min.js",
		"jquery.ui.touch-punch.js",
		"jquery.contextMenu.js",
		"jquery.magnific-popup.min.js",
		"spectrum-2.0.8.min.js",
		"purify.min.js",
		"rpg-dice-roller.bundle.min.js",
		"color-picker.js",
		"mousetrap.1.6.5.min.js",
		"peerjs.min.js",
	        "fuse.min.js",
		"ajaxQueue/ajaxQueueIndex.mjs",            
		// AboveVTT Files
		"environment.js",
		"CoreFunctions.js", // Make sure CoreFunctions executes before anything else
		"avttS3Upload.js",
		"AboveApi.js",
		"DDBApi.js",
		"AOETemplates.js",
		"Text.js",
		"CombatTracker.js",
		"EncounterHandler.js",
		"Fog.js",
		"Journal.js",
		"KeypressHandler.js",
		"MessageBroker.js",
		"MonsterDice.js",
		"PlayerPanel.js",
		"ScenesHandler.js",
		"ScenesPanel.js",
		"Settings.js",
		"SidebarPanel.js",
		"StatHandler.js",
		"Token.js",
		"constants/names.js",
		"TokenMenu.js",
		"ChatObserver.js",
		"DiceContextMenu/DiceContextMenu.js",
		"TokensPanel.js",
		"TokenCustomization.js",
		"built-in-tokens.js",
		"PeerManager.js",
		"PeerCommunication.js",
		"peerVideo.js",
		"peerDice.js",		
		"DiceRoller.js",
		"DMScreen.js",
		"Main.js",
		"MonsterStatBlock.js",
		// AboveVTT files that execute when loaded	
		"onedrive/onedrivemsal.js",
		"onedrive/onedrivepicker.js",
		"audio/index.mjs",
    	        "WeatherOverlay.js",
                (isPlayerPage && !isDM) ? "CharactersPage.js" : "SceneData.js" //player vs DM mode
	];

if(isVttGamePage) {
    // Startup must be the last file to execute. This is what actually loads the app.
    // It requires all the previous files to be loaded first
    scripts.push("Startup.mjs");
}
async function injectScripts(scriptsToLoad) {
    for (const script of scriptsToLoad) {
//        try {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = getExtURL(script);
                if(script.endsWith(".mjs")) s.type = "module";
                s.onload = resolve;
                s.onerror = () => reject(new Error(`Could not find or load: ${script}`));
                addChild(s, true);
            });
            console.log(`✅ Loaded: ${script}`);
//        } catch (err) {
//            //this won't catch everything in web extensions
//            console.error(`Critical error injecting ${script}:`, err);
//            throw(err);
//        }
    }
    console.log("🏁 AVTT: done Loading");
}
    
injectScripts(scripts);

}());
