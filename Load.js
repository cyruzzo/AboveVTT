(async function() { //don't leave clutter after load
    const runtime = typeof chrome != 'undefined' || typeof browser != 'undefined' ? (chrome || browser).runtime : null; //detect extension context, check type of == undefined specifically for firefox as it errors otherwise

    function pageType(location) { // page type from location: [char, gamelog, campaign, vtt-player, vtt-dm, null]
        //match campaign page exactly in case other pages ever get added like campaigns/join that we want to exclude    
        const isCampaignPage = location.pathname.match(/\/campaigns\/[0-9]+$/gi);
        const isVttGamePage = location.search.includes("abovevtt=true");
        const isPlayerPage = location.pathname.match("/characters");
        const isPlainCharacterPage = !isVttGamePage && isPlayerPage //character, builder, or listing
        const isDM = isCampaignPage && location.search.includes("dm=true");
        const isPopoutGameLog = location.search.includes("popoutgamelog=true");
        if(isPlainCharacterPage) return "char";
        if(isPopoutGameLog && !isDM) return "gamelog";
        if(isCampaignPage && !isVttGamePage) return "campaign";
        if(isVttGamePage) return "vtt-" + ((isPlayerPage && !isDM) ? "player" : "dm");
        return null;
    }
    
    const pgType = pageType(window.location); //only relevant in extension context;
    const isIframe = window.self !== window.top;
    if (runtime?.getURL) { //we are in the extension context - decide whether to bail quickly
        //with this scheme we should never load in iframes from here
        console.log("🎲 AVTT extension: ", pgType);
        if(!pgType || isIframe) { //block iFrame extension loading (eg older Safari) until we want it
            console.log("⛔  AVTT: no extension loading here.")
            return; //don't load anything
        }
    } else{
        //Load this as soon as possible for new dice
        function interceptRollEvent(e) {
            if(e.button == 2) return;
            const newDice = $("[class*='DiceContainer_button']").length > 0;
            if(!newDice) return;
            const target = $(e.target);
            // allow hit dice and death saves roll to go through ddb for auto heals - maybe setup our own message by put to https://character-service.dndbeyond.com/character/v5/life/hp/damage-taken later
            if (target.closest('.ct-reset-pane__hitdie-manager-dice').length>0 || target.closest('[class*="styles_heading__"]').find('>h2').text().trim().match(/^death saves$/gi))
                return;
            const rollButton = target.closest(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`);
            if (!rollButton.length) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            rollDiceButton(e, rollButton[0]);
        }
        window.addEventListener('pointerdown', interceptRollEvent, true);
    }

    //setup to work in both contexts
    const getExtURL = runtime?.getURL ? ((url) => runtime.getURL(url))
          : ((url) => document.querySelector("#extensionpath").dataset.path + url);
    const getExtVersion = runtime?.getManifest ? (() => (chrome||browser).runtime?.getManifest()?.version)
          : ((url) => document.querySelector("#avttversion").dataset.path);
    
    const addChild = (c, where, head=false) => (where[head ? "head" : "body"] || where.documentElement).appendChild(c);
    
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
    const avttCharacterScripts = [
        "Load.js", //load Loader on character sheets to support DBB Character Overhaul Extension
        // External Dependencies
        "jquery-3.6.0.min.js",
        "jquery.contextMenu.js",	
        "purify.min.js",	
        "ajaxQueue/ajaxQueueIndex.mjs",
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
    ];
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
    
    function injectStyles(styles, where) {
        for(const value of styles) {       
            const l = where.createElement('link');
            l.href = getExtURL(value);
            l.rel = "stylesheet";
            console.log(`🎨 Loading Style ${value}`);
            addChild(l, where, true);
        }
    }
    async function injectScripts(scriptsToLoad, where) {
        for (const script of scriptsToLoad) {
            await new Promise((resolve, reject) => {
                const s = where.createElement('script');
                s.src = getExtURL(script);
                if(script.endsWith(".mjs")) s.type = "module";
                s.onload = resolve;
                s.onerror = () => reject(new Error(`Could not find or load: ${script}`));
                addChild(s, where, true);
            });
            console.log(`✅ Loaded: ${script}`);
            //could catch errors here - but it doesn't help much in web extensions
        }
    }
    
    async function inject(pgType, where) {
        console.log("⌛ AVTT Loading", pgType, (isIframe && window.parent) ? ("parent: " + pageType(window.parent.location)) : "");        
        if(pgType.startsWith("vtt-")) {
            const loadingOverlay = where.createElement('div');
            loadingOverlay.id = "loading_overlay";
            const loadingBg = where.createElement('div');
            loadingBg.id = "loading_overlay_bg";
            loadingBg.className = pgType.endsWith("-dm") ? "dm" : "player";
            loadingOverlay.appendChild(loadingBg);
            addChild(loadingOverlay, where);
        }
        const l = where.createElement('div');
        l.id = "extensionpath"
        l.style.display = "none";
        l.setAttribute("data-path", getExtURL("/"));
        addChild(l, where);
        const avttVersion = where.createElement('div');
        avttVersion.id = "avttversion";
        avttVersion.style.display = "none";
        avttVersion.setAttribute("data-version", getExtVersion());
        addChild(avttVersion, where);
        
        injectStyles(pgType === "char" ? simpleAvttStyles : avttStyles, where);
        const scripts = pgType === "char" ?
              avttCharacterScripts
              : pgType === "gamelog" ? [
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
                  "CampaignPage.mjs"
              ] : pgType === "campaign" ? [    
                  "jquery-3.6.0.min.js",  
                  "environment.js",
                  "CoreFunctions.js", 		
                  "DDBApi.js",
                  "AboveApi.js",
                  "audio/index.mjs",
                  "Journal.js",
                  "TokenCustomization.js",
                  "ScenesHandler.js",
                  "Settings.js",
                  "CampaignPage.mjs"
              ] : [
                    "Load.js",//load Loader on VTT full pages (for iframe inject - see below)
                    ...avttScripts,
                   (pgType.endsWith("-dm") ? "SceneData.js" : "CharactersPage.js"),
                  ];
        if(pgType.startsWith("vtt-")) scripts.push("Startup.mjs");        
        await injectScripts(scripts, where);
        console.log("🏁 AVTT: done loading",pgType);
    }
    
    if (runtime?.getURL) { //extension loader context
        await inject(pgType, document);
    } else {
        //in page context install loader on window for iframe injects later
        window.AVTT_INJECT = inject;
    }
}());
