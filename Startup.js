/** Startup.js - All the code for starting AboveVTT when abovevtt=true in the query
 * This is not injected on the Character sheet unless abovevtt=true is in the query
 * So if you need anything to execute on the Character sheet when abovevtt is not running, do that in CharacterPage.js
 */


/** The first time the window loads, start doing all the things */
$(function() {
  if (is_abovevtt_page()) { // Only execute if the app is starting up
    console.log("startup calling init_splash");
    init_loading_overlay_beholder();
    window.addEventListener("scroll", function(event) { // this used to be in init_splash, but I'm not exactly sure wy it's needed
      event.stopImmediatePropagation();
    }, true);
    startup_step("Gathering basic campaign info");
    harvest_game_id()                 // find our campaign id
      .then(set_game_id)              // set it to window.gameId
      .then(() => {                   // load settings
        window.EXPERIMENTAL_SETTINGS = JSON.parse(localStorage.getItem(`ExperimentalSettings${window.gameId}`)) || {};
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
          throw "Invalid AboveVTT page!"
        }
      })
      .then(remove_loading_overlay)
      .catch((error) => {
        console.error(`Failed to start AboveVTT on ${window.location.href}`, error);
        showDebuggingAlert();
      });
  }
});

async function start_above_vtt_common() {
  console.log("start_above_vtt_common");
  // make sure we have a campaign id
  window.STARTING = true; // TODO: clean up how this gets set to false
  window.TOKEN_OBJECTS = {};
  window.REVEALED = [];
  window.DRAWINGS = [];
  window.PLAYER_STATS = {};
  window.CONNECTED_PLAYERS = {};
  window.CURRENTLY_SELECTED_TOKENS = [];
  window.TOKEN_PASTE_BUFFER = [];
  window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
  window.TOKEN_CUSTOMIZATIONS = [];
  window.TOKEN_SETTINGS = $.parseJSON(localStorage.getItem('TokenSettings' + window.gameId)) || {};

  startup_step("Gathering player character data");
  gather_pcs();

  $("#site").append("<div id='windowContainment'></div>");

  startup_step("Fetching config data from DDB");
  fetch_config_json();
  startup_step("Fetching token customizations");
  fetch_token_customizations();

  startup_step("Fetching campaign info from AboveVTT servers");
  await AboveApi.getCampaignData();

  startup_step("Creating StatHandler, PeerManager, and MessageBroker");
  window.StatHandler = new StatHandler();
  window.PeerManager = new PeerManager();
  window.MB = new MessageBroker();
}

async function start_above_vtt_for_dm() {
  if (!is_abovevtt_page() || !is_encounters_page() || !window.DM) {
    throw `start_above_vtt_for_dm cannot start on ${window.location.href}; window.DM: ${window.DM}`;
  }

  await start_above_vtt_common();

  startup_step("Migrating to AboveVTT cloud");
  await migrate_to_cloud_if_necessary();

  window.PLAYER_SHEET = false;
  window.PLAYER_ID = false;
  window.PLAYER_NAME = dm_id;
  window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
  window.CONNECTED_PLAYERS['0'] = abovevtt_version; // ID==0 is DM

  startup_step("Fetching Encounters from DDB");
  const avttId = window.location.pathname.split("/").pop();
  window.EncounterHandler = new EncounterHandler(avttId);
  await window.EncounterHandler.fetchAllEncounters();

  startup_step("Creating ScenesHandler");
  window.ScenesHandler = new ScenesHandler(window.gameId);

  startup_step("Setting up UI");
  // This brings in the styles that are loaded on the character sheet to support the "send to gamelog" feature.
  $("body").append(`<link rel="stylesheet" type="text/css" href="https://media.dndbeyond.com/character-tools/styles.bba89e51f2a645f81abb.min.css" >`);
  $("#site-main").css({"display": "block", "visibility": "hidden"});
  $(".dice-rolling-panel").css({"visibility": "visible"});
  $("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
  $("div.dice-toolbar").css({"bottom": "35px"});
  $("#ddbeb-popup-container").css({"display": "block", "visibility": "visible"});
  init_ui();

  startup_step("Fetching scenes from AboveVTT servers");
  await fetch_sceneList_and_scenes();

  startup_step("Start up complete");
}

async function start_above_vtt_for_players() {
  if (!is_abovevtt_page() || !is_characters_page() || window.DM) {
    throw `start_above_vtt_for_players cannot start on ${window.location.href}; window.DM: ${window.DM}`;
  }

  await start_above_vtt_common();

  window.PLAYER_SHEET = window.location.pathname;
  window.PLAYER_ID = getPlayerIDFromSheet(window.PLAYER_SHEET);

  startup_step("Setting up UI");
  await lock_character_gamelog_open();
  init_character_page_sidebar();
  init_ui();
  reposition_player_sheet();
  hide_player_sheet();
  $("#loading_overlay").css("z-index", 0); // Allow them to see their character sheets, etc even if the DM isn't online yet
  observe_character_sheet_aoe($(document));

  $(window).off("resize").on("resize", function() {
    if (window.showPanel === undefined) {
      window.showPanel = is_sidebar_visible();
    }
    init_character_page_sidebar();
    setTimeout(function(){
      if(!window.showPanel){
        hide_sidebar();
      }
    }, 1000);

  });

  startup_step("Fetching scene from AboveVTT server");
  const currentSceneData = await AboveApi.getCurrentScene();
  if (currentSceneData.playerscene) {
    window.startupSceneId = currentSceneData.playerscene;
    const activeScene = await AboveApi.getScene(currentSceneData.playerscene);
    console.log("attempting to handle scene", activeScene);
    startup_step("Loading Scene");
    window.MB.handleScene(activeScene);
  }

  startup_step("Start up complete");
}

function startup_step(stepDescription) {
  console.log("startup_step", stepDescription);
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
  $(".ct-character-header__group--game-log").click();
  $(".ct-sidebar__control--unlock").click();
}

async function migrate_to_cloud_if_necessary() {
  if (!window.DM) {
    console.debug("migrate_to_cloud_if_necessary not DM");
    return; // only the DM can migrate
  }
  if (window.CLOUD) {
    console.debug("migrate_to_cloud_if_necessary already in the cloud");
    return; // we're already using cloud data
  }

  const gameId = find_game_id();
  if (localStorage.getItem(`Migrated${gameId}`) != null) {
    console.debug("migrate_to_cloud_if_necessary already migrated");
    // we've already migrated this campaign, but we don't have window.CLOUD set for some reason
    await AboveApi.setCampaignData();
    await AboveApi.getCampaignData();
    return;
  }

  const localData = localStorage.getItem(`ScenesHandler${gameId}`);
  let localScenes = [];
  if (localData !== null) {
    // we have local data so let's move it to the cloud
    // this also does what `setCampaignData` does so there's no need to call `setCampaignData` here
    console.debug("migrate_to_cloud_if_necessary localData", localData);
    const scenes = JSON.parse(localData);
    if (Array.isArray(scenes) && scenes.length > 0) {
      localScenes = scenes;
    }
  }

  if (localScenes.length) {
    await AboveApi.migrateScenes(window.gameId, localScenes);
  } else {
    // this is a fresh campaign so let's tell the cloud about it
    console.debug("migrate_to_cloud_if_necessary no localData");
    await AboveApi.migrateScenes(window.gameId, [
      {
        id: "666",
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
        reveals: []
      }
    ]);
  }
  await AboveApi.setCampaignData(); // migrate should do this for us, but just in case
  await AboveApi.getCampaignData(); // make sure we have the latest data now that we've migrated
}

// only call this once on startup
async function fetch_sceneList_and_scenes() {
  console.log("fetch_sceneList_and_scenes calling AboveApi.getSceneList");
  window.ScenesHandler.scenes = await AboveApi.getSceneList();
  console.log("fetch_sceneList_and_scenes calling AboveApi.getCurrentScene");
  if (window.ScenesHandler.scenes.length === 0) {
    window.ScenesHandler.scenes = await add_scenes_for_new_campaign();
  }

  const currentSceneData = await AboveApi.getCurrentScene();

  if (currentSceneData.playerscene) {
    window.PLAYER_SCENE_ID = currentSceneData.playerscene;
  } else if (window.ScenesHandler.scenes.length > 0) {
    window.PLAYER_SCENE_ID = window.ScenesHandler.scenes[0].id;
    console.log("fetch_sceneList_and_scenes sending custom/myVTT/switch_scene", { sceneId: window.ScenesHandler.scenes[0].id });
    window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: window.ScenesHandler.scenes[0].id });
  }

  console.log("fetch_sceneList_and_scenes set window.PLAYER_SCENE_ID to", window.PLAYER_SCENE_ID);

  if (currentSceneData.dmscene) {
    const activeScene = await AboveApi.getScene(currentSceneData.dmscene);
    console.log("attempting to handle scene", activeScene);
    window.MB.handleScene(activeScene);
  } else if (window.ScenesHandler.scenes.length > 0) {
    const activeScene = await AboveApi.getScene(window.ScenesHandler.scenes[0].id);
    console.log("attempting to handle scene", activeScene);
    window.MB.handleScene(activeScene);
  }

  console.log("fetch_sceneList_and_scenes calling refresh_scenes");
  refresh_scenes();
  console.log("fetch_sceneList_and_scenes calling did_update_scenes");
  did_update_scenes();
  console.log("fetch_sceneList_and_scenes done");
}

async function add_scenes_for_new_campaign() {
  await AboveApi.migrateScenes(window.gameId, [
    {
      id: "666",
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
      reveals: []
    }
  ]);
  await AboveApi.setCampaignData(); // migrate should do this for us, but just in case
  await AboveApi.getCampaignData(); // make sure we have the latest data now that we've migrated
  return await AboveApi.getSceneList();    // now fetch the scenes from the server
}
