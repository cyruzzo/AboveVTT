/** Startup.js - All the code for starting AboveVTT when abovevtt=true in the query
 * This is not injected on the Character sheet unless abovevtt=true is in the query
 * So if you need anything to execute on the Character sheet when abovevtt is not running, do that in CharacterPage.js
 */
import { init_audio_mixer } from './audio/index.js'

/** The first time the window loads, start doing all the things */
$(function() {
  if (is_abovevtt_page()) { // Only execute if the app is starting up
    console.log("startup calling init_splash");
    init_loading_overlay_beholder();
    addBeyond20EventListener("rendered-roll", (request) => {$('.avtt-sidebar-controls #switch_gamelog').click();});
    $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no')
    startup_step("Gathering basic campaign info");
    harvest_game_id()                 // find our campaign id
      .then(set_game_id)              // set it to window.gameId
      .then(() => {                   // load settings
        window.gameIndexedDb = undefined;
        if(window.DM)
          window.globalIndexedDB = undefined;
      })
      .then(openDB)
      .then((databases)=> {
        window.gameIndexedDb = databases[0];
        window.globalIndexedDB = databases[1];
        const campaignSettings = JSON.parse(localStorage.getItem(`ExperimentalSettings${window.gameId}`)) || {};
        const globalSettings = JSON.parse(localStorage.getItem(`ExperimentalSettingsGlobal`)) || {}; ;
        window.EXPERIMENTAL_SETTINGS = {...campaignSettings, ...globalSettings};
        if (is_release_build()) {
          // in case someone left this on during beta testing, we should not allow it here
          set_avtt_setting_value("aggressiveErrorMessages", false);
        }
        if (is_abovevtt_page()) {
          monitor_console_logs();
        }
        window.diceRoller = new DiceRoller();  
        localStorage.removeItem("ScenesHandler" + gameId);
        let scenesKeys = Object.entries(localStorage).filter(key => key[0].includes('ScenesHandler'));
        for(let i=0; i<scenesKeys.length; i++){
          localStorage.removeItem(scenesKeys[i][0]);
        }
      })
      .then(init_splash)              // show the splash screen; it reads from settings. That's why we show it here instead of earlier
      .then(harvest_campaign_secret)  // find our join link
      .then(set_campaign_secret)      // set it to window.CAMPAIGN_SECRET
      .then(async () => {
        window.CAMPAIGN_INFO = await DDBApi.fetchCampaignInfo(window.gameId)
        window.AVTT_CAMPAIGN_INFO = await AboveApi.getCampaignData();
        return window.CAMPAIGN_INFO.dmId;
      })
      .then((campaignDmId) => {
        const isDmPage = is_encounters_page();
        const isSpectator = is_spectator_page();
        const userId = $(`#message-broker-client[data-userid]`)?.attr('data-userid') || Cobalt?.User?.ID;
        if ((isDmPage && campaignDmId == userId) || isSpectator) {
          inject_dice();
        }
        return { campaignDmId, userId, isDmPage, isSpectator };
      })
      .then((data) => {
        const { campaignDmId, userId, isDmPage, isSpectator } = data;  
        if (isDmPage && campaignDmId == userId) {
          startup_step("Starting AboveVTT for DM");
          return start_above_vtt_for_dm();
        } 
        else if (isSpectator){
          startup_step("Starting AboveVTT for Spectator");
          return start_above_vtt_for_spectator();
        }
        else if(isDmPage){
          startup_step("Player joining as DM")
          return start_player_joining_as_dm();
        }else if (is_characters_page()) {
          startup_step("Starting AboveVTT for character");
          return start_above_vtt_for_players();
        } else {
          startup_step("AboveVTT is not supported on this page!");
          // this should never happen because `is_abovevtt_page` covers all the above cases, but cover all possible cases anyway
          throw new Error(`Invalid AboveVTT page: ${window.location.href}`)
        }
      }).then(()=>{
        addExtensionPathStyles();
        $('body').append(`<script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="h3iaoazdu0wqrfd"></script>`)
      }).then(() => {     
        DDBApi.fetchItemsJsonWithToken().then(data => {
          window.ITEMS_CACHE = data;
        })
       DDBApi.debounceGetPartyInventory()

       
        const lastSendToDefault = localStorage.getItem(`${gameId}-sendToDefault`, gamelog_send_to_text()); 

        if(lastSendToDefault != null){
          $(`[class*='listItemTextRoot']:contains('${lastSendToDefault}')`).parent().click();
        }
        else{
          $(`[class*='listItemTextRoot']:contains('Everyone')`).parent().click();
        }
        $('body').toggleClass('reduceMovement', (window.EXPERIMENTAL_SETTINGS['reduceMovement'] == true));
        $('body').toggleClass('mobileAVTTUI', (window.EXPERIMENTAL_SETTINGS['iconUi'] != false));
        $('body').toggleClass('color-blind-avtt', (window.EXPERIMENTAL_SETTINGS['colorBlindText'] == true));
          // STREAMING STUFF

        window.STREAMPEERS = {};
        window.MYSTREAMID = uuid();
        window.JOINTHEDICESTREAM = window.EXPERIMENTAL_SETTINGS['streamDiceRolls'];
        
        const allDiceRegex = /\d+d(?:100|20|12|10|8|6|4)((?:kh|kl|ro(<|<=|>|>=|=)|min)\d+)*/gi; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
        const validExpressionRegex = /^[dkhlro<=>\s\d+\-\(\)]*$/gi; // any of these [d, kh, kl, spaces, numbers, +, -] // Should we support [*, /] ?
        const validModifierSubstitutions = /(?<!\w)(str|dex|con|int|wis|cha|pb)(?!\w)/gi // case-insensitive shorthand for stat modifiers as long as there are no letters before or after the match. For example `int` and `STR` would match, but `mint` or `strong` would not match.
        const diceRollCommandRegex = /^\/(r|roll|save|hit|dmg|skill|heal)\s/gi; // matches only the slash command. EG: `/r 1d20` would only match `/r`
        const multiDiceRollCommandRegex = /\/(ir|r|roll|save|hit|dmg|skill|heal) [^\/]*/gi; // globally matches the full command. EG: `note: /r 1d20 /r2d4` would find ['/r 1d20', '/r2d4']
        const allowedExpressionCharactersRegex = /^(d\d|\d+d\d+|kh\d+|kl\d+|ro(<|<=|>|>=|=)\d+|min\d+|\+|-|\d+|\s+|STR|DEX|CON|INT|WIS|CHA|PB)*/gi; // this is explicitly different from validExpressionRegex. This matches an expression at the beginning of a string while validExpressionRegex requires the entire string to match. It is also explicitly declaring the modifiers as case-sensitive because we can't search the entire thing as case-insensitive because the `d` in 1d20 needs to be lowercase.

        if(window.EXPERIMENTAL_SETTINGS['streamDiceRolls']){
          enable_dice_streaming_feature(window.JOINTHEDICESTREAM );
        }
        tabCommunicationChannel.addEventListener ('message', (event) => {
          if(event.data.msgType == 'CharacterData' && !find_pc_by_player_id(event.data.characterId, false))
            return;
          if(event.data.msgType == 'roll'){
            if(window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true && event.data.msg.sendTo == window.PLAYER_ID){
               window.MB.inject_chat(event.data.msg);
            }
            else{
              if(event.data.msg.sendTo == window.PLAYER_ID){
                window.diceRoller.roll(new DiceRoll(
                  `${event.data.msg.rollData.expression}`,
                  event.data.msg.rollData.rollTitle,
                  event.data.msg.rollData.rollType,
                  event.data.msg.player,
                  event.data.msg.img,
                  "character",
                  event.data.msg.playerId
                ), event.data.multiroll, event.data.critRange, event.data.critType, event.data.msg.rollData.spellSave, event.data.msg.rollData.damageType);
              }
            }       
            return;
          }
          if(event.data.msgType =='SendToGamelog'){
            if(event.data.sendTo == window.PLAYER_ID || (window.DM && event.data.sendTo == false)){
              let html = window.MB.encode_message_text(event.data.text);
              let data = {
                player: event.data.player,
                img: event.data.img,
                text: html
              };
              window.MB.inject_chat(data);
              notify_gamelog();
            }
            return;
          }
          if(event.data.msgType=='isAboveOpen'){
            tabCommunicationChannel.postMessage({
              msgType: 'setupObserver',
              tab: (window.EXPERIMENTAL_SETTINGS['disableSendToTab'] ==  true) ? undefined : window.PLAYER_ID,
              rpgTab: (window.EXPERIMENTAL_SETTINGS['rpgRoller'] ==  true) ? window.PLAYER_ID : undefined,
              iframeTab: window.PLAYER_ID,
              rpgRoller: window.EXPERIMENTAL_SETTINGS['rpgRoller']
            })
            return;
          }
          if(window.DM && event.data.msgType=='gamelogDamageButtons'){
            if($(`.tokenselected:not([data-id*='profile'])`).length == 0){
              showTempMessage('No non-player tokens selected');
            }
                
            for(let i=0; i<window.CURRENTLY_SELECTED_TOKENS.length; i++){

              let id = window.CURRENTLY_SELECTED_TOKENS[i];
              let token = window.TOKEN_OBJECTS[id];
              if(token.isPlayer() || token.isAoe())
                continue;
              let newHp = Math.max(0, parseInt(token.hp) - parseInt(event.data.damage));

              if(window.all_token_objects[id] != undefined){
                window.all_token_objects[id].hp = newHp;
              }     
              if(token != undefined){   
                token.hp = newHp;
                token.place_sync_persist()
                addFloatingCombatText(id, event.data.damage, event.data.damage<0);
              }   
            }
          }
          if(event.data.msgType=='DMOpenAlready' && window.DM && window.location.href.includes(event.data.url)){  
            window.close();
          }
          if(event.data.msgType=='dropExtra' && (event.data.sendTo == window.PLAYER_ID || (window.DM && event.data.sendTo == false))){    
            if(event.data.data.playerID != undefined){
              let pc = find_pc_by_player_id(event.data.data.playerID, false)
              const playerTokenID = pc ? pc.sheet : '';
              let tokenPosition = (window.TOKEN_OBJECTS[playerTokenID]) ? 
              {
                x: parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.left) + parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.size)/2,
                y: parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.top) + parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.size)/2
              } : 
              center_of_view();
              if(!window.TOKEN_OBJECTS[playerTokenID])
                tokenPosition = convert_point_from_view_to_map(tokenPosition.x, tokenPosition.y)
              event.data.data.centerView = tokenPosition;
              event.data.data.sceneId = window.CURRENT_SCENE_DATA.id;
              const playerUser = window.playerUsers.filter(d=> d.id == event.data.data.playerID)[0]?.userId     
              event.data.data.extraOptions.share_vision = playerUser ? playerUser : true; 
            }
              
            if(window.DM){
              let left = parseInt(event.data.data.centerView.x);
              let top = parseInt(event.data.data.centerView.y);
              let monsterId = event.data.data.monsterData.baseId;
              fetch_and_cache_monsters([monsterId], function(){
                create_and_place_token(window.cached_monster_items[monsterId], undefined, undefined, left, top, undefined, undefined, true, event.data.data.extraOptions)
              });
            }
            else{
              window.MB.sendMessage("custom/myVTT/place-extras-token", event.data.data);
            }
          }                 
          if(event.data.msgType=='placeAoe' && (event.data.sendTo == window.PLAYER_ID || (window.DM && event.data.sendTo == false)))  {
              let options = build_aoe_token_options(event.data.data.color, event.data.data.shape, event.data.data.feet / window.CURRENT_SCENE_DATA.fpsq, event.data.data.name, event.data.data.lineWidth / window.CURRENT_SCENE_DATA.fpsq)
              if(name == 'Darkness' || name == 'Maddening Darkness' ){
                options = {
                  ...options,
                  darkness: true
                }
              }
              //if single token selected, place there:
              if(window.CURRENTLY_SELECTED_TOKENS.length == 1) {
                place_aoe_token_at_token(options, window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[0]]);
              } 
              else if(window.TOKEN_OBJECTS[event.data.data.tokenId] != undefined){
                place_aoe_token_at_token(options, window.TOKEN_OBJECTS[event.data.data.tokenId]);
              }else {
                place_aoe_token_in_centre(options)
              }
          }      
          if(!window.DM){
            if(event.data.msgType == 'CharacterData'){
              update_pc_with_data(event.data.characterId, event.data.pcData);
              window.MB.sendMessage("custom/myVTT/character-update", {
                characterId: event.data.characterId,
                pcData: event.data.pcData
              });
            }
            else if(event.data.msgType == 'projectionScroll' && event.data.sceneId == window.CURRENT_SCENE_DATA.id){
              let sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
              let windowRatio = window.innerHeight / event.data.innerHeight;

              if(windowRatio == 1 && window.ZOOM == event.data.zoom){
                window.scroll(event.data.x - window.innerWidth/2 + sidebarSize/2, event.data.y - window.innerHeight/2); 
              }
              else{
                throttleProjectionScroll(function(){
                  window.Projecting = true;
                  if(event.data.zoom == false || (windowRatio != 1 && window.ZOOM == event.data.zoom * windowRatio)){
                    let viewPos = convert_point_from_map_to_view(event.data.mapPos.x, event.data.mapPos.y) 
                    window.scroll(viewPos.x-window.innerWidth/2+sidebarSize/2+20, viewPos.y-window.innerHeight/2+20); //20 for scrollbar width
                  }
                  else{              
                    change_zoom(event.data.zoom);
                    let viewPos = convert_point_from_map_to_view(event.data.mapPos.x, event.data.mapPos.y) 
                    window.scroll(viewPos.x-window.innerWidth/2+sidebarSize/2+20, viewPos.y-window.innerHeight/2+20); //20 for scrollbar width    
                  }
                })
                
              }
           
            }

          }
          else if(event.data.msgType == 'CharacterData'){
            update_pc_with_data(event.data.characterId, event.data.pcData);
          }
          if (event.data.msgType == 'DDBMessage'){
            if (event.data.sendTo == window.PLAYER_ID || (window.DM && event.data.sendTo == false)) {
              window.MB.sendMessage(event.data.action, event.data.data);
            }
          }
        })
        
        
        tabCommunicationChannel.postMessage({
          msgType: 'setupObserver',
          tab: (window.EXPERIMENTAL_SETTINGS['disableSendToTab'] ==  true) ? undefined : window.PLAYER_ID,
          iframeTab: window.PLAYER_ID,
          rpgRoller: window.EXPERIMENTAL_SETTINGS['rpgRoller']
        })
        sendBeyond20Event('register-generic-tab', {action:'register-generic-tab'});
        if (is_encounters_page()) {
          window.dispatchEvent(new Event('resize'));
        }
      })
      .catch((error) => {
        showError(error, `Failed to start AboveVTT on ${window.location.href}`);
      });  
     
  }
});


const throttleProjectionScroll = throttle(async (f) => {
    if(window.Projecting == undefined){
      await f();
      setTimeout(function(){
        delete window.Projecting;
      }, 1000/60)     
    }
}, 1000/60)


function addBeyond20EventListener(name, callback) {
    const event = ["Beyond20_" + name, (evt) => {
        const detail = evt.detail || [];
        callback(...detail)
    }, false];
    document.addEventListener(...event);
    return event;
}
function sendBeyond20Event(name, ...args) {
    // You would need a function isFirefox to check if the extension is running in Firefox
    const detail = args;
    const event = new CustomEvent("Beyond20_" + name, { "detail": detail });
    document.dispatchEvent(event);
}
function addExtensionPathStyles(){ // some above server images moved out of extension package
  let styles = `<style id='aboveExtensionPathStyles'>
    body{
      --onedrive-svg: url('${window.EXTENSION_PATH}images/Onedrive_icon.svg');
      --onedrive-mask: url('${window.EXTENSION_PATH}images/Onedrive_icon.png');
      --avtt-mask: url('${window.EXTENSION_PATH}assets/avtt-logo.png');
    }
  </style>`


  $('body').append(styles);
}

function load_external_script(scriptUrl) {
  return new Promise(function (resolve, reject) {
    let script = document.createElement('script');
    script.src = scriptUrl;
    script.addEventListener('error', err => {
      reject(err);
    });
    script.addEventListener('load', resolve);
    document.head.appendChild(script);
  }).catch((err) => {
    console.error(`Failed to load external script`, scriptUrl, err);
  })
}

async function start_above_vtt_common() {
  console.log("start_above_vtt_common");
  // make sure we have a campaign id
  window.CONNECTED_PLAYERS = {};
  // TODO: replace this with a tutorial map that players can mess with whenever there isn't a map for the player
  window.CURRENT_SCENE_DATA = default_scene_data();
  window.CURRENTLY_SELECTED_TOKENS = [];
  window.DRAWINGS = [];
  window.REVEALED = [];
  window.TOKEN_CUSTOMIZATIONS = [];
  window.TOKEN_OBJECTS = {};
  window.ON_SCREEN_TOKENS = {};
  window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
  window.TOKEN_PASTE_BUFFER = [];
  window.TOKEN_SETTINGS = $.parseJSON(localStorage.getItem(`TokenSettings${window.gameId}`)) || {};
  window.all_token_objects = {};
  window.PC_TOKENS_NEEDING_UPDATES = [];
  window.PC_NEEDS_API_CALL = {};

  
  await load_external_script("https://www.youtube.com/iframe_api");
  $("#site").append("<div id='windowContainment'></div>");
  $("body").append(`<style>.ddb-footer{display:none}</style>`);
  startup_step("Gathering player character data");
  await rebuild_window_pcs();
  window.color = color_for_player_id(my_player_id()); // shortcut that we should figure out how to not rely on
  localStorage.removeItem(`CampaignCharacters${window.gameId}`); // clean up old pc data

  startup_step("Fetching config data from DDB");
  if(!window.ddbConfigJson)
    window.ddbConfigJson = await DDBApi.fetchConfigJson();

  window.ddbConfigJson.conditions.forEach(condition => {
    CONDITIONS[condition.definition.name] = condition.definition.description; 
  })

  //ddb data doesn't include the below as tooltip data, add the data manually
  CONDITIONS['Bloodied'] = "<p>A creature is Bloodied while it has half its Hit Points or fewer remaining.</p>"
  CONDITIONS['Burning'] = '<p>A burning creature or object takes 1d4 Fire damage at the start of each of its turns. As an action, you can extinguish fire on yourself by giving yourself the Prone condition and rolling on the ground. The fire also goes out if it is doused, submerged, or suffocated.</p>'
  
  startup_step("Fetching token customizations");
  fetch_token_customizations();

  startup_step("Creating StatHandler, PeerManager, and MessageBroker");
  window.StatHandler = new StatHandler();
  window.PeerManager = new PeerManager();
  window.MB = new MessageBroker();
  init_audio_mixer();
  create_peerVideo_button();
  return true;
}
function start_player_joining_as_dm(){
  if (!is_abovevtt_page() || !is_encounters_page() || !window.DM ){
    throw new Error(`start_above_vtt_for_dm cannot start on ${window.location.href}; window.DM: ${window.DM}`);
  }
  //This is not supported at the moment, if supported the DM should have to choose who can be co-dm - judge people trying to cheat
  const message = $(`
    <div style="
      width: 400px;
        height: fit-content;
        left: 50%;
        transform: translate(-50%, -50%);
        position: fixed;
        z-index: 1000000;
        top: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        align-content: center;
        flex-wrap: wrap;
        text-align: center;
        border: 2px solid #fff;
        background: #000d;
        border-radius:5px;
    ">
      <span style="
      color: #ddd;
      font-size: 25px;
      text-shadow: 1px 0px #000, 0px 1px #000, -1px 0px #000, 0px -1px #000, 1px 1px #000, -1px -1px #000, -1px 1px #000, 1px -1px #000; 
      ">It is not currently possible to join as DM from a player account.</span>
    </div>`);

  $('body').append(message);
  $('#splash').remove();
  $(window).one('click.messageRremove', function(){
    message.remove();
  })

}
async function start_above_vtt_for_dm() {
  if (!is_abovevtt_page() || !is_encounters_page() || !window.DM) {
    throw new Error(`start_above_vtt_for_dm cannot start on ${window.location.href}; window.DM: ${window.DM}`);
  }

  //These functions are removed to stop issues with running on the campaign page and loops/extending objects via $.extend. 
  //We can look at other ways to fix our code so this isn't needed. I've already moved off for...in loops I could find that were targeting arrays.
  delete Array.prototype.clean
  delete Array.prototype.distinct
  delete Array.prototype.each
  delete Array.prototype.sortBy

  window.document.title = `AVTT DM ${window.document.title}`
  $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no')
  window.PLAYER_ID = false;
  window.PLAYER_IMG = dmAvatarUrl;
  window.PLAYER_NAME = dm_id;
  window.PLAYER_SHEET = false;
  $(".sidebar__control").click(); // 15/03/2022 .. DDB broke the gamelog button.
  $(".sidebar__control--lock").closest("button").click(); // lock it open immediately. This is safe to call multiple times
  
  
  await start_above_vtt_common();
  window.CONNECTED_PLAYERS['0'] = window.AVTT_VERSION; // ID==0 is DM

  window.ScenesHandler = new ScenesHandler();
  
  startup_step("Initializing DM Screen");
  initDmScreen(); // Initialize DM screen after ddbConfigJson is loaded

  startup_step("Fetching Encounters from DDB");
  const avttId = window.location.pathname.split("/").pop();
  window.EncounterHandler = new EncounterHandler(avttId);
  await window.EncounterHandler.fetchAllEncounters();
  
  window.SCENE_DEFAULT_SETTINGS = $.parseJSON(localStorage.getItem(`SceneDefaults-${window.gameId}`)) || {};

  startup_step("Setting up UI");
  // This brings in the styles that are loaded on the character sheet to support the "send to gamelog" feature.
  $("body").append(`<link rel="stylesheet" type="text/css" href="https://media.dndbeyond.com/character-tools/styles.bba89e51f2a645f81abb.min.css" >`);
  $("#site-main").css({"display": "block", "visibility": "hidden"});
  $('.page-header, .ddb-campaigns-detail-body, .ddb-campaigns-detail-header').remove();
  $(".dice-rolling-panel").css({"visibility": "visible"});
  $("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
  $("#ddbeb-popup-container").css({"display": "block", "visibility": "visible"});
  $('#noty_layout__bottomRight').remove();
  init_ui();

  startup_step("Fetching scenes from AboveVTT servers");

  let activeScene = await fetch_sceneList_and_scenes();
  await migrate_to_cloud_if_necessary();
  startup_step("Loading scenes");
  did_update_scenes();
  startup_step("Migrating scene folders");
  migrate_scene_folders();

  if (activeScene) {
    if(activeScene.data.playlist != undefined && activeScene.data.playlist != 0 && window.MIXER.state().playlists[activeScene.data.playlist] != undefined){
      window.MIXER.setPlaylist(activeScene.data.playlist)
    }
  }


  startup_step("Loading Tokens");
  await rebuild_token_items_list()
  filter_token_list("");


  startup_step("Start up complete");
  window.MB.sendMessage("custom/myVTT/DMAvatar", {
    avatar: dmAvatarUrl
  })
  $(window).off('scroll.projectorMode').on("scroll.projectorMode", projector_scroll_event);
  inject_chat_buttons();
  inject_dm_roll_default_menu();
  
}
async function start_above_vtt_for_spectator() {
  if (!is_spectator_page()) {
    throw new Error(`start_above_vtt_for_spectoator cannot start on ${window.location.href}; Is Spectator: ${is_spectator_page() }`);
  }

  //These functions are removed to stop issues with running on the campaign page and loops/extending objects via $.extend. 
  //We can look at other ways to fix our code so this isn't needed. I've already moved off for...in loops I could find that were targeting arrays.
  delete Array.prototype.clean
  delete Array.prototype.distinct
  delete Array.prototype.each
  delete Array.prototype.sortBy

  window.document.title = `AVTT Spectator ${window.document.title}`
  $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no')
  const playerId = `spectator-${window.gameId}-${uuid()}`;
  window.PLAYER_ID = playerId;
  window.PLAYER_IMG = dmAvatarUrl;
  window.PLAYER_NAME = playerId;
  window.PLAYER_SHEET = playerId;
  $(".sidebar__control").click(); // 15/03/2022 .. DDB broke the gamelog button.
  $(".sidebar__control--lock").closest("button").click(); // lock it open immediately. This is safe to call multiple times
  $("body").toggleClass("avtt-spectator-sheet", true);
  $('#noty_layout__bottomRight').remove();
  await start_above_vtt_common();
  window.CONNECTED_PLAYERS['0'] = window.AVTT_VERSION; // ID==0 is DM

 

  startup_step("Setting up UI");
  // This brings in the styles that are loaded on the character sheet to support the "send to gamelog" feature.
  $("body").append(`<link rel="stylesheet" type="text/css" href="https://media.dndbeyond.com/character-tools/styles.bba89e51f2a645f81abb.min.css" >`);
  $("#site-main").css({ "display": "block", "visibility": "hidden" });
  $('.page-header, .ddb-campaigns-detail-body, .ddb-campaigns-detail-header').remove();
  $(".dice-rolling-panel").css({ "visibility": "visible" });
  $("div.sidebar").parent().css({ "display": "block", "visibility": "visible" });
  $("#ddbeb-popup-container").css({ "display": "block", "visibility": "visible" });
  init_ui();
  if (get_avtt_setting_value('quickToggleDefaults')?.spectatorHideUi) {
    unhide_interface();
  }
  inject_chat_buttons();
  inject_dm_roll_default_menu();
  startup_step("Fetching scene from AboveVTT server");
  const currentSceneData = await AboveApi.getCurrentScene();
  if (currentSceneData.playerscene) {
    window.startupSceneId = currentSceneData.playerscene;
    window.LOADING = true;
    const activeScene = await AboveApi.getScene(currentSceneData.playerscene);
    console.log("attempting to handle scene", activeScene);
    startup_step("Loading Scene");
    window.MB.handleScene(activeScene);
    startup_step("Start up complete");
  } else {
    console.error("There isn't a player map! we need to display something!");
    startup_step("Start up complete. Waiting for DM to send us a map");
  }
}
const debounceResizeUI = mydebounce(function(){
  init_character_page_sidebar();
  reposition_player_sheet();
  if(!window.showPanel){
    hide_sidebar(false);
  }
}, 100)

function inject_dm_roll_default_menu(){
  if(!window.DM && !is_spectator_page())
    return;
  const gamelogTitle = $('.glc-game-log>[class*="-Container-Flex"]>[class*="-Title"]');
  const flexContainer = $('<div class="tss-ko5p4u-Flex"></div>');
  
  const sendToLabel = $(`<span class="tss-l9t796-SendToLabel">Send To (Default):</span>`)
  const sendToButton = $(`<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary tss-pbe4l0-Button ddb-character-app-bk8fa3" tabindex="0" type="button">
    <span class="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeMedium ddb-character-app-1l6c7y9">
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ddb-character-app-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9 13.75C6.66 13.75 2 14.92 2 17.25V19H16V17.25C16 14.92 11.34 13.75 9 13.75ZM4.34 17C5.18 16.42 7.21 15.75 9 15.75C10.79 15.75 12.82 16.42 13.66 17H4.34ZM9 12C10.93 12 12.5 10.43 12.5 8.5C12.5 6.57 10.93 5 9 5C7.07 5 5.5 6.57 5.5 8.5C5.5 10.43 7.07 12 9 12ZM9 7C9.83 7 10.5 7.67 10.5 8.5C10.5 9.33 9.83 10 9 10C8.17 10 7.5 9.33 7.5 8.5C7.5 7.67 8.17 7 9 7ZM16.04 13.81C17.2 14.65 18 15.77 18 17.25V19H22V17.25C22 15.23 18.5 14.08 16.04 13.81V13.81ZM15 12C16.93 12 18.5 10.43 18.5 8.5C18.5 6.57 16.93 5 15 5C14.46 5 13.96 5.13 13.5 5.35C14.13 6.24 14.5 7.33 14.5 8.5C14.5 9.67 14.13 10.76 13.5 11.65C13.96 11.87 14.46 12 15 12Z" fill="currentColor"></path>
      </svg>
    </span>
    Everyone
    <span class="MuiButton-icon MuiButton-endIcon MuiButton-iconSizeMedium ddb-character-app-pt151d">
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ddb-character-app-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10L12 15L17 10H7Z" fill="currentColor">
        </path>
      </svg>
    </span>
  </button>`)
  const selectMenu = $(`
  <div class="gameLogSendToMenu MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 tss-13wrc40-menuPaper MuiMenu-paper MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 tss-13wrc40-menuPaper MuiPopover-paper css-1os3rtf" tabindex="-1" >
   <ul class="MuiList-root MuiList-padding MuiMenu-list css-r8u8y9" role="menu" tabindex="-1">
      <li class="tss-3a46y9-menuItemRoot MuiMenuItem-root MuiButtonBase-root css-qn0kvh" tabindex="0" role="menuitem" value="0">
       <div class="tss-67466g-listItemIconRoot MuiListItemIcon-root css-17lvc79">
          <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
             <path d="M9 13.75C6.66 13.75 2 14.92 2 17.25V19H16V17.25C16 14.92 11.34 13.75 9 13.75ZM4.34 17C5.18 16.42 7.21 15.75 9 15.75C10.79 15.75 12.82 16.42 13.66 17H4.34ZM9 12C10.93 12 12.5 10.43 12.5 8.5C12.5 6.57 10.93 5 9 5C7.07 5 5.5 6.57 5.5 8.5C5.5 10.43 7.07 12 9 12ZM9 7C9.83 7 10.5 7.67 10.5 8.5C10.5 9.33 9.83 10 9 10C8.17 10 7.5 9.33 7.5 8.5C7.5 7.67 8.17 7 9 7ZM16.04 13.81C17.2 14.65 18 15.77 18 17.25V19H22V17.25C22 15.23 18.5 14.08 16.04 13.81V13.81ZM15 12C16.93 12 18.5 10.43 18.5 8.5C18.5 6.57 16.93 5 15 5C14.46 5 13.96 5.13 13.5 5.35C14.13 6.24 14.5 7.33 14.5 8.5C14.5 9.67 14.13 10.76 13.5 11.65C13.96 11.87 14.46 12 15 12Z" fill="currentColor"></path>
          </svg>
       </div>
       <div class="tss-1us1e8t-listItemTextRoot MuiListItemText-root css-1tsvksn">Everyone</div>
       <div class="tss-67466g-listItemIconRoot MuiListItemIcon-root css-17lvc79">            
        <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
         <path d="M9.00016 16.17L4.83016 12L3.41016 13.41L9.00016 19L21.0002 7.00003L19.5902 5.59003L9.00016 16.17Z" fill="currentColor"></path>
        </svg></div>
      </li>
      <li class="tss-3a46y9-menuItemRoot MuiMenuItem-root MuiButtonBase-root css-qn0kvh" tabindex="-1" role="menuitem" value="1">
         <div class="tss-67466g-listItemIconRoot MuiListItemIcon-root css-17lvc79">
            <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
               <path d="M12 5.9C13.16 5.9 14.1 6.84 14.1 8C14.1 9.16 13.16 10.1 12 10.1C10.84 10.1 9.9 9.16 9.9 8C9.9 6.84 10.84 5.9 12 5.9ZM12 14.9C14.97 14.9 18.1 16.36 18.1 17V18.1H5.9V17C5.9 16.36 9.03 14.9 12 14.9ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM12 13C9.33 13 4 14.34 4 17V20H20V17C20 14.34 14.67 13 12 13Z" fill="currentColor"></path>
            </svg>
         </div>
         <div class="tss-1us1e8t-listItemTextRoot MuiListItemText-root css-1tsvksn">Self</div>
         <div class="tss-67466g-listItemIconRoot MuiListItemIcon-root css-17lvc79">
            <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
               <path d="M9.00016 16.17L4.83016 12L3.41016 13.41L9.00016 19L21.0002 7.00003L19.5902 5.59003L9.00016 16.17Z" fill="currentColor"></path>
            </svg>
         </div>
      </li>
   </ul>
</div>`)
  flexContainer.append(sendToLabel, sendToButton, selectMenu);
  gamelogTitle.append(flexContainer);
  flexContainer.off('click.swapRollDefault').on('click.swapRollDefault', '.gameLogSendToMenu li', function(e){
    e.stopPropagation();
    const target = $(e.target);
    const selectedText = target.text().replaceAll(/\s+/gi, '');
    const selectedSvg = target.find('div:first-of-type svg')?.[0]?.outerHTML;
    sendToButton.html(`
      <span class="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeMedium ddb-character-app-1l6c7y9">
        ${selectedSvg}
      </span>
      ${selectedText}
      <span class="MuiButton-icon MuiButton-endIcon MuiButton-iconSizeMedium ddb-character-app-pt151d">
        <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ddb-character-app-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10L12 15L17 10H7Z" fill="currentColor">
          </path>
        </svg>
      </span>
    `);
    selectMenu.find('li.selected').toggleClass('selected');
    target.toggleClass('selected', true);
    const ddbDiceButton = $('.dice-toolbar__target-user');
    ddbDiceButton.text(`To: ${selectedText}`)
  })


  $('.dice-rolling-panel').off('click.sendTo').on('click.sendTo', '.dice-toolbar__target>button:first-of-type', function(e){
    window.modifiySendToDDBDiceClicked = true;
  })
  //dm only css for campaign page use
  $('body').append(`
    <style>
      .glc-game-log .gameLogSendToMenu li div:last-of-type svg{
        visibility: hidden;
      }
      .glc-game-log .gameLogSendToMenu li.selected div:last-of-type svg{
        visibility: visible;
      }
      .glc-game-log .gameLogSendToMenu li *{
        pointer-events: none;
      }

      .glc-game-log [class*="ddb-character-app"] svg{
       font-size: 20px !important;
       user-select: none;
       width: 1em;
       height: 1em;
       display: inline-block;
       fill: currentcolor;
       flex-shrink: 0;
       font-size: 1.5rem;
       transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      .glc-game-log [class*="-SendToLabel"]{
        width: 60px
      }
      .glc-game-log [class*="-SendToLabel"] ~ button{
        width: 130px
      }
      .glc-game-log [class*="-SendToLabel"] ~ button,
      .glc-game-log [class*="-SendToLabel"] ~ button>span{
              display: flex;
              line-height: 21px;
              flex-wrap: nowrap;
              justify-content: center;
              align-items: center;
      }
      body>img {
        display: revert !important;
      }
      .sidebar{
        height: 100% !important;
      }
      .stream-dice-button{
        top: 40px;
      }
    .gameLogSendToMenu {
        position: absolute;
        top: 100px;
        left: 100px;
        display: flex;
        z-index: 100000000;
        width: 155px !important;
        opacity: 1;
        transform: none;
        transition: opacity 241ms cubic-bezier(0.4, 0, 0.2, 1), transform 161ms cubic-bezier(0.4, 0, 0.2, 1) 150ms;
        transform-origin: 75.8906px 0px;
        padding: 0px !important;
        transform: scale(0);
        border-radius: 5px;
      }

      .MuiButtonBase-root:focus ~ .gameLogSendToMenu
      {
         transition: opacity 241ms cubic-bezier(0.4, 0, 0.2, 1), transform 161ms cubic-bezier(0.4, 0, 0.2, 1);
         transform: scale(1);
      }

    .gameLogSendToMenu ul{
        width: 100%;
    }
    .gameLogSendToMenu ul li {
        width: 100%;
        padding: 0px 5px;
        display: flex !important;
        align-items: center;
        font-family: Roboto;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 40px;
        color: rgb(60 60 60);
        -webkit-box-align: center;
        align-items: center;
    }
    .gameLogSendToMenu ul li:hover {
      backdrop-filter: brightness(0.9)
    }

    .ui-dialog .ui-dialog-titlebar .ui-dialog-titlebar-close {
        position: absolute !important;
        width: 14px !important;
        padding: 2px !important;
        height: 14px !important;
        top: 15px !important;
        right: 4px !important;
    }
    .mce-container .mce-btn i.mce-ico:not(.mce-i-resize) {
        font-size: 16px !important;
        line-height: 20px !important;
        margin: 0px !important;
    }

    .mce-container .mce-btn i.mce-ico:not(.mce-i-resize)::before{
        font-family: 'tinymce', Arial !important;
    }



    .ui-dialog .ui-dialog-titlebar-close::before {
        color: white!important;
        font-size: 25px!important
    }

    .ui-dialog .ui-dialog-content {
     height: 500px !important;
    }
    .ui-dialog .ui-dialog-titlebar {
      border: 1px solid rgba(0,0,0,0.25) !important;
    }
    .journal-button{
      top: 6px !important;
    }
    h3.token-image-modal-footer-title{
      font-size:14px;
    }
    .mce-btn {
      margin-right: 3px !important;
    }
    .mce-btn {
        border: 1px solid #b1b1b1 !important;
        border-color: rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25) rgba(0,0,0,0.25) !important;
        position: relative !important;
        text-shadow: 0 1px 1px rgba(255,255,255,0.75) !important;
        display: inline-block !important;
        *display: inline !important;
        *zoom:1;-webkit-border-radius: 3px !important;
        -moz-border-radius: 3px !important;
        border-radius: 3px !important;
        -webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        -moz-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        background-color: #f0f0f0 !important;
    }

    .mce-i-save:before {
        content: "\\e000" !important;
    }

    .mce-i-newdocument:before {
        content: "\\e001" !important;
    }

    .mce-i-fullpage:before {
        content: "\\e002" !important;
    }

    .mce-i-alignleft:before {
        content: "\\e003" !important;
    }

    .mce-i-aligncenter:before {
        content: "\\e004" !important;
    }

    .mce-i-alignright:before {
        content: "\\e005" !important;
    }

    .mce-i-alignjustify:before {
        content: "\\e006" !important;
    }

    .mce-i-cut:before {
        content: "\\e007" !important;
    }

    .mce-i-paste:before {
        content: "\\e008" !important;
    }

    .mce-i-searchreplace:before {
        content: "\\e009" !important;
    }

    .mce-i-bullist:before {
        content: "\\e00a" !important;
    }

    .mce-i-numlist:before {
        content: "\\e00b" !important;
    }

    .mce-i-indent:before {
        content: "\\e00c" !important;
    }

    .mce-i-outdent:before {
        content: "\\e00d" !important;
    }

    .mce-i-blockquote:before {
        content: "\\e00e" !important;
    }

    .mce-i-undo:before {
        content: "\\e00f" !important;
    }

    .mce-i-redo:before {
        content: "\\e010" !important;
    }

    .mce-i-link:before {
        content: "\\e011" !important;
    }

    .mce-i-unlink:before {
        content: "\\e012" !important;
    }

    .mce-i-anchor:before {
        content: "\\e013" !important;
    }

    .mce-i-image:before {
        content: "\\e014" !important;
    }

    .mce-i-media:before {
        content: "\\e015" !important;
    }

    .mce-i-help:before {
        content: "\\e016" !important;
    }

    .mce-i-code:before {
        content: "\\e017" !important;
    }

    .mce-i-insertdatetime:before {
        content: "\\e018" !important;
    }

    .mce-i-preview:before {
        content: "\\e019" !important;
    }

    .mce-i-forecolor:before {
        content: "\\e01a" !important;
    }

    .mce-i-backcolor:before {
        content: "\\e01a" !important;
    }

    .mce-i-table:before {
        content: "\\e01b" !important;
    }

    .mce-i-hr:before {
        content: "\\e01c" !important;
    }

    .mce-i-removeformat:before {
        content: "\\e01d" !important;
    }

    .mce-i-subscript:before {
        content: "\\e01e" !important;
    }

    .mce-i-superscript:before {
        content: "\\e01f" !important;
    }

    .mce-i-charmap:before {
        content: "\\e020" !important;
    }

    .mce-i-emoticons:before {
        content: "\e021" !important;
    }

    .mce-i-print:before {
        content: "\e022" !important;
    }

    .mce-i-fullscreen:before {
        content: "\\e023" !important;
    }

    .mce-i-spellchecker:before {
        content: "\\e024" !important;
    }

    .mce-i-nonbreaking:before {
        content: "\\e025" !important;
    }

    .mce-i-template:before {
        content: "\\e026" !important;
    }

    .mce-i-pagebreak:before {
        content: "\\e027" !important;
    }

    .mce-i-restoredraft:before {
        content: "\\e028" !important;
    }

    .mce-i-untitled:before {
        content: "\\e029" !important;
    }

    .mce-i-bold:before {
        content: "\\e02a" !important;
    }

    .mce-i-italic:before {
        content: "\\e02b" !important;
    }

    .mce-i-underline:before {
        content: "\\e02c" !important;
    }

    .mce-i-strikethrough:before {
        content: "\\e02d" !important;
    }

    .mce-i-visualchars:before {
        content: "\\e02e" !important;
    }

    .mce-i-visualblocks:before {
        content: "\\e02e" !important;
    }

    .mce-i-ltr:before {
        content: "\\e02f" !important;
    }

    .mce-i-rtl:before {
        content: "\\e030" !important;
    }

    .mce-i-copy:before {
        content: "\\e031" !important;
    }

    .mce-i-resize:before {
        content: "\\e032" !important;
    }

    .mce-i-browse:before {
        content: "\\e034" !important;
    }

    .mce-i-pastetext:before {
        content: "\\e035" !important;
    }

    .mce-i-checkbox:before,.mce-i-selected:before {
        content: "\\e033" !important;
    }



    </style>
    `)
}

async function start_above_vtt_for_players() {
  if (!is_spectator_page() && (!is_abovevtt_page() || !is_characters_page() || window.DM)) {
    throw new Error(`start_above_vtt_for_players cannot start on ${window.location.href}; window.DM: ${window.DM}`);
  }
  
  $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no')
  window.PLAYER_SHEET = window.location.pathname;
  window.PLAYER_ID = getPlayerIDFromSheet(window.PLAYER_SHEET);

  await start_above_vtt_common();

  startup_step("Setting up UI");
  await lock_character_gamelog_open();
  init_character_page_sidebar();
  init_ui();
  reposition_player_sheet();
  hide_player_sheet();
  $("#loading_overlay").css("z-index", 0); // Allow them to see their character sheets, etc even if the DM isn't online yet

  $(window).off("resize").on("resize", function() {
    if (window.showPanel === undefined) {
      window.showPanel = is_sidebar_visible();
    }
    debounceResizeUI();
    if(!window.CURRENT_SCENE_DATA.is_video || !window.CURRENT_SCENE_DATA.player_map.includes('youtu')){
      $("#youtube_controls_button").css('visibility', 'hidden');
    }
    if ($('.stream-dice-button').length == 0){
      $(".glc-game-log>[class*='Container-Flex']").append($(`<div id="stream_dice"><div class='stream-dice-button ${window.JOINTHEDICESTREAM ? `enabled` : ``}'>Dice Stream ${window.JOINTHEDICESTREAM ? `Enabled` : `Disabled`}</div></div>`));
      $(".stream-dice-button").off().on("click", function () {
        if (window.JOINTHEDICESTREAM) {
          update_dice_streaming_feature(false);
        }
        else {
          update_dice_streaming_feature(true);
        }
      })
    }
     
  });

  /*prevents repainting due to ddb adjusting player sheet classes and throttling it*/
  document.addEventListener('scroll', function(e) {
    if(!$(e.target).is('[class*="-GameLog"]')){
      e.preventDefault();
      e.stopImmediatePropagation();
    }

  }, true);

  startup_step("Fetching scene from AboveVTT server");
  const currentSceneData = await AboveApi.getCurrentScene();
  if (currentSceneData.playerscene) {
    window.startupSceneId = currentSceneData.playerscene;
    window.LOADING = true;
    const activeScene = await AboveApi.getScene(currentSceneData.playerscene);
    console.log("attempting to handle scene", activeScene);
    startup_step("Loading Scene");
    window.MB.handleScene(activeScene);
    startup_step("Start up complete");
  } else {
    console.error("There isn't a player map! we need to display something!");
    startup_step("Start up complete. Waiting for DM to send us a map");
  }
  if($('.dice-rolling-panel').length == 0){
    showDiceDisabledWarning();
  }
}


async function lock_character_gamelog_open() {
  if ($(".ct-sidebar__portal").length == 0) {
    // not ready yet, try again in a second
    console.log("lock_gamelog_open couldn't find the sidebar. Trying again in 1 second");
    await async_sleep(1000); // init_character_page_sidebar has a delay in it which we still need to clean up
    return await lock_character_gamelog_open();
  }

  // Open the gamelog, and lock it open
  let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button, button[class*='-gamelog-button']");
  if(gameLogButton.length == 0){
    $(`[d='M243.9 7.7c-12.4-7-27.6-6.9-39.9 .3L19.8 115.6C7.5 122.8 0 135.9 0 150.1V366.6c0 14.5 7.8 27.8 20.5 34.9l184 103c12.1 6.8 26.9 6.8 39.1 0l184-103c12.6-7.1 20.5-20.4 20.5-34.9V146.8c0-14.4-7.7-27.7-20.3-34.8L243.9 7.7zM71.8 140.8L224.2 51.7l152 86.2L223.8 228.2l-152-87.4zM48 182.4l152 87.4V447.1L48 361.9V182.4zM248 447.1V269.7l152-90.1V361.9L248 447.1z']`).closest('[role="button"]'); // this is a fall back to look for the gamelog svg icon and look for it's button.
  }
  gameLogButton.click()
  $(".ct-sidebar__control--unlock").click();
}

async function migrate_to_cloud_if_necessary() {
  if (!window.DM) {
    console.error("migrate_to_cloud_if_necessary was called when window.DM was set to", window.DM);
    return; // only the DM can migrate
  }

  if (window.ScenesHandler.scenes.length > 0) {
    console.log("migrate_to_cloud_if_necessary is not necessary");
    return;
  }

  // this is a fresh campaign so let's push our Tavern Scene
  startup_step("Migrating to AboveVTT cloud");
  const tavernData = [
    {
      ...default_scene_data(),
      title: "The Tavern",
      dm_map: "",
      player_map: "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
      scale: "100",
      dm_map_usable: "0",
      player_map_is_video: "0",
      dm_map_is_video: "0",
      fog_of_war: "1",
      tokens: {},
      grid: "0",
      hpps: "72",
      vpps: "72",
      snap: "1",
      fpsq: "5",
      upsq: "ft",
      offsetx: 29,
      offsety: 54,
    }
  ];
  await AboveApi.migrateScenes(window.gameId, tavernData);

  window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: tavernData[0].id });
  window.PLAYER_SCENE_ID = tavernData[0].id;
  const activeScene = await fetch_sceneList_and_scenes(); 
  return activeScene;
}

// only call this once on startup
async function fetch_sceneList_and_scenes() {

  window.ScenesHandler.scenes = await AboveApi.getSceneList();

  const currentSceneData = await AboveApi.getCurrentScene();

  if (currentSceneData.playerscene && window.ScenesHandler.scenes.find(s => s.id === currentSceneData.playerscene)) {
    window.PLAYER_SCENE_ID = currentSceneData.playerscene;
  } 

  console.log("fetch_sceneList_and_scenes set window.PLAYER_SCENE_ID to", window.PLAYER_SCENE_ID);

  let activeScene = undefined;
  if (currentSceneData.dmscene && window.ScenesHandler.scenes.find(s => s.id === currentSceneData.dmscene)) {
    window.LOADING = true;
    activeScene = await AboveApi.getScene(currentSceneData.dmscene);
    console.log("attempting to handle scene", activeScene);
    // window.MB.handleScene(activeScene);
  } else if (window.ScenesHandler.scenes.length > 0) {
    window.LOADING = true;
    activeScene = await AboveApi.getScene(window.ScenesHandler.scenes[0].id);
    console.log("attempting to handle scene", activeScene);
  }
  if(activeScene)
    window.MB.handleScene(activeScene);
  else
    delete window.LOADING
  console.log("fetch_sceneList_and_scenes done");
  return activeScene;
}
