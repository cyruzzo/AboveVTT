/** CoreFunctions.js
 * A place for functions that are required for proper functionality
 * This is loaded from Load.js and LoadCharacterPage.js
 * so be thoughtful about which functions go in this file
 * */


/** The first time we load, collect all the things that we need.
 * Remember that this is injected from both Load.js and LoadCharacterPage.js
 * If you need to add things for when AboveVTT is actively running, do that in Startup.js
 * If you need to add things for when the CharacterPage is running, do that in CharacterPage.js
 * If you need to add things for all of the above situations, do that here */
$(function() {
  window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
  window.AVTT_VERSION = $("#avttversion").attr('data-version');
  $("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></link>');
  $("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />');
  // WORKAROUND FOR ANNOYING DDB BUG WITH COOKIES AND UPVOTING STUFF
  document.cookie="Ratings=;path=/;domain=.dndbeyond.com;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  if (is_encounters_page()) {
    window.DM = true; // the DM plays from the encounters page
  } else if (is_campaign_page()) {
    // The owner of the campaign (the DM) is the only one with private notes on the campaign page
    window.DM = $(".ddb-campaigns-detail-body-dm-notes-private").length === 1;
  } else {
    window.DM = false;
  }

  window.diceRoller = new DiceRoller();
});

const async_sleep = m => new Promise(r => setTimeout(r, m));

const charactersPageRegex = /\/characters\/\d+/;

/** @return {boolean} true if the current page url includes "/characters/<someId>"  */
function is_characters_page() {
  return window.location.pathname.match(charactersPageRegex)?.[0] !== undefined;
}

/** @return {boolean} true if the current page url includes "/characters/"  */
function is_characters_list_page() {
  return window.location.pathname.match(/\/characters(?!\/\d)/)?.[0] !== undefined;
}

/** @return {boolean} true if the current page url includes "/campaigns/"  */
function is_campaign_page() {
  return window.location.pathname.includes("/campaigns/");
}

/** @return {boolean} true if the current page url includes "/encounters/"  */
function is_encounters_page() {
  return window.location.pathname.includes("/encounters/");
}

/** @return {boolean} true if the url has abovevtt=true, and is one of the pages that we allow the app to run on */
function is_abovevtt_page() {
  // we only run the app on the enounters page (DM), and the characters page (players)
  // we also only run the app if abovevtt=true is in the query params
  return window.location.search.includes("abovevtt=true") && (is_encounters_page() || is_characters_page());
}

/** @return {boolean} true if the current page url includes "/campaigns/" and the query contains "popoutgamelog=true" */
function is_gamelog_popout() {
  return is_campaign_page() && window.location.search.includes("popoutgamelog=true");
}

const debuggingAlertText = "Please check the developer console (F12) for errors, and report this via the AboveVTT Discord. You may need to press this OK button before the errors are shown in the console.";
function showDebuggingAlert(message = "An unexpected error occurred!") {
  alert(`${message}\n${debuggingAlertText}`);
}

async function harvest_game_id() {
  if (is_campaign_page()) {
    const fromPath = window.location.pathname.split("/").pop();
    console.log("harvest_game_id found gameId in the url:", fromPath);
    return fromPath;
  }

  if (is_encounters_page()) {
    const encounterId = window.location.pathname.split("/").pop();
    const encounterData = await DDBApi.fetchEncounter(encounterId);
    return encounterData.campaign.id.toString();
  }

  if (is_characters_page()) {
    const characterId = window.location.pathname.split("/").pop();
    window.characterData = await DDBApi.fetchCharacter(characterId);
    return window.characterData.campaign.id.toString();
  }

  throw `harvest_game_id failed to find gameId on ${window.location.href}`;
}

function set_game_id(gameId) {
  window.gameId = gameId;
}

async function harvest_campaign_secret() {
  if (typeof window.gameId !== "string" || window.gameId.length <= 1) {
    throw "harvest_campaign_secret requires gameId to be set. Make sure you call harvest_game_id first";
  }

  if (is_campaign_page()) {
    return $(".ddb-campaigns-invite-primary").text().split("/").pop();
  }

  const secretFromLocalStorage = read_campaign_info(window.gameId);
  if (typeof secretFromLocalStorage === "string" && secretFromLocalStorage.length > 1) {
    console.log("harvest_campaign_secret found it in localStorage");
    return secretFromLocalStorage;
  }

  // we don't have it so load up the campaign page and try to grab it from there
  const iframe = $(`<iframe id='campaign-page-iframe'></iframe>`);
  iframe.css({
    "width": "100%",
    "height": "100%",
    "top": "0px",
    "left": "0px",
    "position": "absolute",
    "visibility": "hidden"
  });
  $(document.body).append(iframe);

  return new Promise((resolve, reject) => {
    iframe.on("load", function (event) {
      if (!this.src) {
        // it was just created. no need to do anything until it actually loads something
        return;
      }
      try {
        const joinLink = $(event.target).contents().find(".ddb-campaigns-invite-primary").text().split("/").pop();
        console.log("harvest_campaign_secret found it by loading the campaign page in an iframe");
        resolve(joinLink);
      } catch(error) {
        console.error("harvest_campaign_secret failed to find the campaign secret by loading the campaign page in an iframe", error);
        reject("harvest_campaign_secret loaded it in localStorage")
      }
      $(event.target).remove();
    });

    iframe.attr("src", `/campaigns/${window.gameId}`);
  });
}

function set_campaign_secret(campaignSecret) {
  window.CAMPAIGN_SECRET = campaignSecret;
}

/** writes window.gameId and window.CAMPAIGN_SECRET to localStorage for faster retrieval in the future */
function store_campaign_info() {
  const campaignId = window.gameId;
  const campaignSecret = window.CAMPAIGN_SECRET;
  if (typeof campaignId !== "string" || campaignId.length < 0) return;
  if (typeof campaignSecret !== "string" || campaignSecret.length < 0) return;
  localStorage.setItem(`AVTT-CampaignInfo-${campaignId}`, campaignSecret);
}

/** @param {string} campaignId the DDB id of the campaign
 * @return {string|undefined} the join link secret if it exists */
function read_campaign_info(campaignId) {
  if (typeof campaignId !== "string" || campaignId.length < 0) return undefined;
  const cs = localStorage.getItem(`AVTT-CampaignInfo-${campaignId}`);
  if (typeof cs === "string" && cs.length > 0) return cs;
  return undefined;
}

/** @param {string} campaignId the DDB id of the campaign */
function remove_campaign_info(campaignId) {
  localStorage.removeItem(`AVTT-CampaignInfo-${campaignId}`);
}

// Low res thumbnails have the form https://www.dndbeyond.com/avatars/thumbnails/17/212/60/60/636377840850178381.jpeg
// Higher res of the same character can be found at  https://www.dndbeyond.com/avatars/17/212/636377840850178381.jpeg
// This is a slightly hacky method of getting the higher resolution image from the url of the thumbnail.
function get_higher_res_url(thumbnailUrl) {
  const thumbnailUrlMatcher = /avatars\/thumbnails\/\d+\/\d+\/\d\d\/\d\d\//;
  if (!thumbnailUrl.match(thumbnailUrlMatcher)) return thumbnailUrl;
  return thumbnailUrl.replace(/\/thumbnails(\/\d+\/\d+\/)\d+\/\d+\//, '$1');
}

/** Finds the id of the campaign in a normalized way that is safe to call from anywhere at any time
 * @returns {String} The id of the DDB campaign we're playing in */
function find_game_id() {
  // this should always exist because we set it right away with harvest_game_id
  if (typeof window.gameId === "string" && window.gameId.length > 1) { // sometimes this gets set to "0" so don't count that as valid
    return window.gameId;
  }

  // this should never happen now that we call `harvest_game_id` on startup
  console.warn("find_game_id does not have a valid window.gameId set yet. Why was harvest_game_id not called? Attempting to find a valid gameId", window.gameId);

  if (is_encounters_page()) {
    if (window.EncounterHandler && window.EncounterHandler.avttEncounter && window.EncounterHandler.avttEncounter.campaign) {
      window.gameId = window.EncounterHandler.avttEncounter.campaign.id;
    } else {
      console.error("Cannot find gameId on encounters page without an API call");
    }
  } else if (is_campaign_page()) {
    window.gameId = window.location.pathname.split("/").pop();
  } else {
    const fromMB = $("#message-broker-client").attr("data-gameId"); // this will return "0" if it's not set
    if (typeof fromMB === "string" && fromMB.length > 1) {
      window.gameId = fromMB;
    } else {
      console.error(`Cannot find a valid gameId on ${window.location.href}; gameId:`, fromMB);
    }
  }

  console.log("find_game_id found:", window.gameId);
  return window.gameId;
}

function gather_pcs() {
  let campaignId = find_game_id();
  if (is_encounters_page() || is_characters_page()) {
    if (window.pcs) return; // we should only need to fetch this once
    // they aren't on this page, but we've added them to localStorage to handle this scenario
    window.pcs = $.parseJSON(localStorage.getItem(`CampaignCharacters${campaignId}`));
    console.log(`reading "CampaignCharacters-${campaignId}", ${JSON.stringify(window.pcs)}`);
    return;
  }

  window.pcs = [];
  $(".ddb-campaigns-detail-body-listing-active").find(".ddb-campaigns-character-card").each(function(idx) {
    let tmp = $(this).find(".ddb-campaigns-character-card-header-upper-character-info-primary");
    let name = tmp.html();
    tmp = $(this).find(".user-selected-avatar");
    if (tmp.length > 0) {
      const lowResUrl = tmp.css("background-image").slice(5, -2); // url("x") TO -> x
      image = get_higher_res_url(lowResUrl)
    } else {
      image = "/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";
    }
    let sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr("href");
    let pc = {
      name: name,
      image: image,
      sheet: sheet === undefined ? "" : sheet,
      data: {}
    };
    console.log("trovato sheet " + sheet);
    window.pcs.push(pc);
  });

  if(!window.DM){
    window.pcs.push({
      name: 'THE DM',
      image: 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png',
      sheet: "", // MessageBroker calls `endsWith` on this so make sure it has something to read
      data: {}
    });
  }
  localStorage.setItem(`CampaignCharacters${campaignId}`, JSON.stringify(window.pcs));
}

function normalize_scene_urls(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return [];
  }
  return scenes.map(sceneData => Object.assign(sceneData, {
    dm_map: parse_img(sceneData.dm_map),
    player_map: parse_img(sceneData.player_map)
  }));
}