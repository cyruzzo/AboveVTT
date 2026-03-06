(async function() { //don't leave clutter after load

    const runtime = (chrome || browser).runtime; //detect extension context
    const isVttGamePage = window.location.search.includes("abovevtt=true");
    //match campaign page exactly in case other pages ever get added like campaigns/join that we want to exclude    
    const isCampaignPage = !!window.location.pathname.match(/\/campaigns\/[0-9]+$/gi);
    const isPlayerPage = !!window.location.pathname.match("/characters");
    const isPlainCharacterPage = !isVttGamePage && isPlayerPage //character, builder, or listing

    //we need Loaders later for character frames so we need cleverness here:
    if(runtime) { //we are in the extension loader - decide whether to bail quickly        
        console.log("🎲 AVTT: extension", isVttGamePage ? "VTT":"", isPlainCharacterPage ? "CHAR":"", isCampaignPage ? "CMPGN":"");    
        if(!isPlainCharacterPage && !isCampaignPage && !isVttGamePage) {
            console.log("⛔  AVTT: no loading here.")
            return; //don't load anything
        }
    }
    
    const getExtURL = runtime ? ((url) => runtime.getURL(url))
          : ((url) => document.querySelector("#extensionpath").dataset.path + url);
    const addChild = (c, head=false, e=document) => (e[head ? "head" : "body"] || e.documentElement).appendChild(c);
    function loadingOverlay(element, isPlayer) {
        const loadingOverlay = element.createElement('div');
        loadingOverlay.id = "loading_overlay";
        const loadingBg = element.createElement('div');
        loadingBg.id = "loading_overlay_bg";
        loadingBg.className = isPlayer ? "player" : "dm";
        loadingOverlay.appendChild(loadingBg);
        addChild(loadingOverlay); // Add to DOM last to avoid multiple repaints
    }
    function install_divs(element) {
        const l = element.createElement('div');
        l.id = "extensionpath"
        l.style.display = "none";
        l.setAttribute("data-path", getExtURL("/"));
        addChild(l);
        const avttVersion = element.createElement('div');
        avttVersion.id = "avttversion";
        avttVersion.style.display = "none";
        avttVersion.setAttribute("data-version", (chrome||browser).runtime.getManifest().version);
        addChild(avttVersion);
    }
    //These are also necessary for character iframe injection
    const avttScripts = [
	// External Dependencies
	"jquery-3.6.0.min.js",
	"jquery-ui.min.js",
	"jquery.csv.js",
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
    	"WeatherOverlay.js"
    ]
    const avttStyles = [
        "abovevtt.css",
        "jquery-ui.min.css",
        "jquery.ui.theme.min.css",
        "jquery.contextMenu.css",
        "color-picker.min.css",
        "spectrum-2.0.8.min.css",
        "magnific-popup.css",
        "DiceContextMenu/DiceContextMenu.css"
    ];
    const simpleAvttStyles = [
        "DiceContextMenu/DiceContextMenu.css", "jquery.contextMenu.css"
    ]
    function loadStyles(styles, e = document) {
        for(const value of styles) {       
            const l = e.createElement('link');
            l.href = getExtURL(value);
            l.rel = "stylesheet";
            console.log(`🎨 Loading Style ${value}`);
            addChild(l, true, e);
        }
    }
    async function injectScripts(scriptsToLoad) {
        for (const script of scriptsToLoad) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = getExtURL(script);
                if(script.endsWith(".mjs")) s.type = "module";
                s.onload = resolve;
                s.onerror = () => reject(new Error(`Could not find or load: ${script}`));
                addChild(s, true);
            });
            console.log(`✅ Loaded: ${script}`);
            //could catch errors here - but it doesn't help much in web extensions
        }
    }
    
    if(runtime) { //extension loader    
        console.log("⌛ AVTT Loading...")
        const isDM = isCampaignPage && window.location.search.includes("dm=true");
        const isPopoutGameLog = window.location.search.includes("popoutgamelog=true");
        if (isVttGamePage && !isPlainCharacterPage) {
            loadingOverlay(document, isPlayerPage);
        }
        install_divs(document);
        loadStyles(isPlainCharacterPage ? simpleAvttStyles : avttStyles);
    
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
        ] : [...avttScripts,
             "Load.js", //load Loader on VTT full pages
             (isPlayerPage && !isDM) ? "CharactersPage.js" : "SceneData.js"] //player vs DM mode
        
        if(isVttGamePage) {
            // Startup must be the last file to execute. This is what actually loads the app.
            // It requires all the previous files to be loaded first
            scripts.push("Startup.mjs");
        }
        await injectScripts(scripts);
        console.log("🏁 AVTT: done Loading");
    } else {
        //in page context install loaders for later
        window.AVTT_CHARACTER_SCRIPTS_INJECT = (element) => {
            console.log("Injecting Character Scripts", element);
            loadStyles(simpleAvttStyles, element);    
            injectScripts(avttCharacterScripts, element);    
        }
        //keep a frame injector around for later:
        window.AVTT_FULL_INJECT = (element, isDM) => {
            console.log("Injecting Character Page", element);       
            loadingOverlay(element, true);
            install_divx(element);
            loadStyles(avttStyles, element);
            const scripts = [...avttScripts, "CharactersPage.js"];
            //for some reason that code injects both Character and SceneData for DM
            if(isDM) scripts.push("SceneData.js");
            scripts.push("Startup.mjs");
            injectScripts(scripts, element);
        }
    }
}());
