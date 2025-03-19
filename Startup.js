/** Startup.js - All the code for starting AboveVTT when abovevtt=true in the query
 * This is not injected on the Character sheet unless abovevtt=true is in the query
 * So if you need anything to execute on the Character sheet when abovevtt is not running, do that in CharacterPage.js
 */
import { init_audio_mixer } from './audio/index.js'

/** The first time the window loads, start doing all the things */
$(function() {
  if (is_abovevtt_page()) { // Only execute if the app is starting up
    console.log("startup calling init_splash");
    window.STARTING = true; // TODO: clean up how this gets set to false
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
        window.EXPERIMENTAL_SETTINGS = JSON.parse(localStorage.getItem(`ExperimentalSettings${window.gameId}`)) || {};
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
        for(let i in scenesKeys){
          localStorage.removeItem(scenesKeys[i][0]);
        }
      })
      .then(init_splash)              // show the splash screen; it reads from settings. That's why we show it here instead of earlier
      .then(harvest_campaign_secret)  // find our join link
      .then(set_campaign_secret)      // set it to window.CAMPAIGN_SECRET
      .then(() => {

        if (is_encounters_page()) {
          startup_step("Starting AboveVTT for DM");
          return start_above_vtt_for_dm();
        } else if (is_characters_page()) {
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

        let lastSendToDefault = localStorage.getItem(`${gameId}-sendToDefault`, gamelog_send_to_text()); 

        if(lastSendToDefault != null){
          $(`[class*='listItemTextRoot']:contains('${lastSendToDefault}')`).click();
        }
        $('body').toggleClass('reduceMovement', (window.EXPERIMENTAL_SETTINGS['reduceMovement'] == true));
        $('body').toggleClass('mobileAVTTUI', (window.EXPERIMENTAL_SETTINGS['iconUi'] == true));
          // STREAMING STUFF

        window.STREAMPEERS = {};
        window.MYSTREAMID = uuid();
        window.JOINTHEDICESTREAM = window.EXPERIMENTAL_SETTINGS['streamDiceRolls'];
        
        const allDiceRegex = /\d+d(?:100|20|12|10|8|6|4)(?:kh\d+|kl\d+|ro(<|<=|>|>=|=)\d+)*/g; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
        const validExpressionRegex = /^[dkhlro<=>\s\d+\-\(\)]*$/g; // any of these [d, kh, kl, spaces, numbers, +, -] // Should we support [*, /] ?
        const validModifierSubstitutions = /(?<!\w)(str|dex|con|int|wis|cha|pb)(?!\w)/gi // case-insensitive shorthand for stat modifiers as long as there are no letters before or after the match. For example `int` and `STR` would match, but `mint` or `strong` would not match.
        const diceRollCommandRegex = /^\/(r|roll|save|hit|dmg|skill|heal)\s/; // matches only the slash command. EG: `/r 1d20` would only match `/r`
        const multiDiceRollCommandRegex = /\/(ir|r|roll|save|hit|dmg|skill|heal) [^\/]*/g; // globally matches the full command. EG: `note: /r 1d20 /r2d4` would find ['/r 1d20', '/r2d4']
        const allowedExpressionCharactersRegex = /^(d\d|\d+d\d+|kh\d+|kl\d+|ro(<|<=|>|>=|=)\d+|\+|-|\d+|\s+|STR|str|DEX|dex|CON|con|INT|int|WIS|wis|CHA|cha|PB|pb)*/; // this is explicitly different from validExpressionRegex. This matches an expression at the beginning of a string while validExpressionRegex requires the entire string to match. It is also explicitly declaring the modifiers as case-sensitive because we can't search the entire thing as case-insensitive because the `d` in 1d20 needs to be lowercase.

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
                
            for(let i in window.CURRENTLY_SELECTED_TOKENS){

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
                    window.scroll(viewPos.x - window.innerWidth/2 + sidebarSize/2 - 20, viewPos.y - window.innerHeight/2 - 20);  //20 for scrollbar  
                  }
                  else if(windowRatio != 1){
                    change_zoom(event.data.zoom);
                    window.scroll(event.data.x - window.innerWidth/2 + sidebarSize/2, event.data.y - window.innerHeight/2);          
                    change_zoom(event.data.zoom * windowRatio)
                  }
                  else{              
                    change_zoom(event.data.zoom);
                    window.scroll(event.data.x - window.innerWidth/2 + sidebarSize/2, event.data.y - window.innerHeight/2);    
                  }
                })
                
              }
           
            }

          }
          else if(event.data.msgType == 'CharacterData'){
            update_pc_with_data(event.data.characterId, event.data.pcData);
          }
        })
        
        
        tabCommunicationChannel.postMessage({
          msgType: 'setupObserver',
          tab: (window.EXPERIMENTAL_SETTINGS['disableSendToTab'] ==  true) ? undefined : window.PLAYER_ID,
          iframeTab: window.PLAYER_ID,
          rpgRoller: window.EXPERIMENTAL_SETTINGS['rpgRoller']
        })
        sendBeyond20Event('register-generic-tab', {action:'register-generic-tab'});
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
    }
    .aoe-style-fire{
      background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/fire_background.png);
    }
    .aoe-style-lightning{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/lightning.png);
    }
    .aoe-style-slashing{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/slashing.png);
    }
    .aoe-style-darkness{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/fire_background.png);
    }
    .aoe-style-fog-cloud{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/fog_cloud_tileable.png) !important;
    }
    .aoe-style-hypnotic-pattern{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/hypnotic-pattern.png) !important;
    }
    .aoe-style-stinking-cloud{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/fog_cloud_tileable.png) !important;
    }
    .aoe-style-web{
        background-image: url(https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/tileable3pxsquareweb.png) !important;
    }

    [data-animation='fairy-fx'] .islight,
    .aura-element[data-animation='fairy-fx'][id*='aura_'] {
        -webkit-mask-image: url('https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/fairys.png');
    }

    [data-animation='fairy-fx'] .islight:before,
    .aura-element[data-animation='fairy-fx'][id*='aura_']:before {
        -webkit-mask-image: url('https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/fairys.png');
    }

    [data-animation='spore-fx'] .islight,
    .aura-element[data-animation='spore-fx'][id*='aura_'] {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/spore.png");
    }

    [data-animation='lightning-fx'] .islight,
    .aura-element[data-animation='lightning-fx'][id*='aura_'] {
        --mask-1: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/lightningcircle.png");
    }

    [data-animation='magic-circle-fx'] .islight,
    .aura-element[data-animation='magic-circle-fx'][id*='aura_'] {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/magiccircle1.png");
    }

    [data-animation='magic-circle-2-fx'] .islight,
    .aura-element[data-animation='magic-circle-2-fx'][id*='aura_'] {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/magiccircle2.png");
    }
    [data-animation='hurricane-fx'] .islight,
    .aura-element[data-animation='hurricane-fx'][id*='aura_'] {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/hurricane_cloud.png");
    }

    [data-animation='hurricane-fx'] .islight:before,
    .aura-element[data-animation='hurricane-fx'][id*='aura_']:before
    {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/lightning_2.png");
    }
    [data-animation='snow-fx'] .islight:before,
    .aura-element[data-animation='snow-fx'][id*='aura_']:before,
    [data-animation='snow-fx'] .islight:after,
    .aura-element[data-animation='snow-fx'][id*='aura_']:after
    {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/snow.png");
    }
    [data-animation='bubble-fx'] .islight:before,
    .aura-element[data-animation='bubble-fx'][id*='aura_']:before,
    [data-animation='bubble-fx'] .islight:after,
    .aura-element[data-animation='bubble-fx'][id*='aura_']:after
    {
        -webkit-mask-image: url("https://abovevtt-assets.s3.eu-central-1.amazonaws.com/mask-images/bubble.png");
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
  window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
  window.TOKEN_PASTE_BUFFER = [];
  window.TOKEN_SETTINGS = $.parseJSON(localStorage.getItem(`TokenSettings${window.gameId}`)) || {};
  window.all_token_objects = {};
  window.CAMPAIGN_INFO = await DDBApi.fetchCampaignInfo(window.gameId);
  window.PC_TOKENS_NEEDING_UPDATES = [];
  window.PC_NEEDS_API_CALL = {};

  await load_external_script("https://www.youtube.com/iframe_api");
  $("#site").append("<div id='windowContainment'></div>");

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
}

async function start_above_vtt_for_dm() {
  if (!is_abovevtt_page() || !is_encounters_page() || !window.DM) {
    throw new Error(`start_above_vtt_for_dm cannot start on ${window.location.href}; window.DM: ${window.DM}`);
  }
  $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=no')
  window.PLAYER_ID = false;
  window.PLAYER_IMG = dmAvatarUrl;
  window.PLAYER_NAME = dm_id;
  window.PLAYER_SHEET = false;

  await start_above_vtt_common();
  window.CONNECTED_PLAYERS['0'] = window.AVTT_VERSION; // ID==0 is DM

  startup_step("Fetching scenes from cloud");
  window.ScenesHandler = new ScenesHandler();
  window.ScenesHandler.scenes = await AboveApi.getSceneList();
  await migrate_to_cloud_if_necessary();

  startup_step("Fetching Encounters from DDB");
  const avttId = window.location.pathname.split("/").pop();
  window.EncounterHandler = new EncounterHandler(avttId);
  await window.EncounterHandler.fetchAllEncounters();

  startup_step("Setting up UI");
  // This brings in the styles that are loaded on the character sheet to support the "send to gamelog" feature.
  $("body").append(`<link rel="stylesheet" type="text/css" href="https://media.dndbeyond.com/character-tools/styles.bba89e51f2a645f81abb.min.css" >`);
  $("#site-main").css({"display": "block", "visibility": "hidden"});
  $(".dice-rolling-panel").css({"visibility": "visible"});
  $("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
  $("#ddbeb-popup-container").css({"display": "block", "visibility": "visible"});
  init_ui();

  startup_step("Fetching scenes from AboveVTT servers");
  let activeScene = await fetch_sceneList_and_scenes();

  startup_step("Migrating scene folders");
  await migrate_scene_folders();

  if (activeScene) {
    if(activeScene.data.playlist != undefined && activeScene.data.playlist != 0 && window.MIXER.state().playlists[activeScene.data.playlist] != undefined){
      window.MIXER.setPlaylist(activeScene.data.playlist)
    }
  }

  did_update_scenes();

  startup_step("Start up complete");
  window.MB.sendMessage("custom/myVTT/DMAvatar", {
    avatar: dmAvatarUrl
  })
  $(window).off('scroll.projectorMode').on("scroll.projectorMode", projector_scroll_event);
  remove_loading_overlay();
}

async function start_above_vtt_for_players() {
  if (!is_abovevtt_page() || !is_characters_page() || window.DM) {
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
    init_character_page_sidebar();
    reposition_player_sheet();
    setTimeout(function(){
      if(!window.showPanel){
        hide_sidebar(false);
      }
    }, 1000);
    if(!window.CURRENT_SCENE_DATA.is_video || !window.CURRENT_SCENE_DATA.player_map.includes('youtu')){
      $("#youtube_controls_button").css('visibility', 'hidden');
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

function startup_step(stepDescription) {
  console.log(`startup_step ${stepDescription}`);
  $("#loading-overlay-beholder > .sidebar-panel-loading-indicator > .loading-status-indicator__subtext").text(stepDescription);
}

async function lock_character_gamelog_open() {
  if ($(".ct-sidebar__portal").length == 0) {
    // not ready yet, try again in a second
    console.log("lock_gamelog_open couldn't find the sidebar. Trying again in 1 second");
    await async_sleep(1000); // init_character_page_sidebar has a delay in it which we still need to clean up
    return await lock_character_gamelog_open();
  }

  // Open the gamelog, and lock it open
  let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button");
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
  // TODO: replace this with the new tutorial map
  await AboveApi.migrateScenes(window.gameId, [
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
  ]);
  // now fetch the scenes from the server
  window.ScenesHandler.scenes = await AboveApi.getSceneList();
}

// only call this once on startup
async function fetch_sceneList_and_scenes() {

  window.ScenesHandler.scenes = await AboveApi.getSceneList();

  const currentSceneData = await AboveApi.getCurrentScene();

  if (currentSceneData.playerscene && window.ScenesHandler.scenes.find(s => s.id === currentSceneData.playerscene)) {
    window.PLAYER_SCENE_ID = currentSceneData.playerscene;
  } else if (window.ScenesHandler.scenes.length > 0) {
    window.PLAYER_SCENE_ID = window.ScenesHandler.scenes[0].id;
    console.log("fetch_sceneList_and_scenes sending custom/myVTT/switch_scene", { sceneId: window.ScenesHandler.scenes[0].id });
    // window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: window.ScenesHandler.scenes[0].id });
  }

  console.log("fetch_sceneList_and_scenes set window.PLAYER_SCENE_ID to", window.PLAYER_SCENE_ID);

  let activeScene = undefined;
  if (currentSceneData.dmscene && window.ScenesHandler.scenes.find(s => s.id === currentSceneData.dmscene)) {
    activeScene = await AboveApi.getScene(currentSceneData.dmscene);
    console.log("attempting to handle scene", activeScene);
    // window.MB.handleScene(activeScene);
  } else if (window.ScenesHandler.scenes.length > 0) {
    activeScene = await AboveApi.getScene(window.ScenesHandler.scenes[0].id);
    console.log("attempting to handle scene", activeScene);
  }
  window.MB.handleScene(activeScene);
  console.log("fetch_sceneList_and_scenes done");
  return activeScene;
}
