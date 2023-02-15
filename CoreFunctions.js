/** CoreFunctions.js
 * A place for functions that are required for proper functionality
 * This is loaded from Load.js and LoadCharacterPage.js
 * so be thoughtful about which functions go in this file
 * */

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

/** @return {boolean} true if the url has abovevtt=true as a query param */
function is_abovevtt_page() {
  return window.location.search.includes("abovevtt=true");
}

const debuggingAlertText = "Please check the developer console (F12) for errors, and report this via the AboveVTT Discord.";
function showDebuggingAlert(message = "An unexpected error occurred!") {
  alert(`${message}\n${debuggingAlertText}`);
}

/** open the campaign page in an iframe, and collect the join link */
function harvest_game_id_and_join_link(callback) {
  console.debug("harvest_game_id_and_join_link");
  if (typeof callback !== 'function') {
    callback = function(){};
  }

  if (typeof window.gameId === "string" && window.gameId.length > 1 && typeof window.CAMPAIGN_SECRET === "string" && window.CAMPAIGN_SECRET.length > 1) {
    // we already have it
    console.log("harvest_game_id_and_join_link", window.gameId, window.CAMPAIGN_SECRET);
    callback();
    return;
  }

  if (is_campaign_page()) {
    window.gameId = window.location.pathname.split("/").pop();
    window.CAMPAIGN_SECRET = $(".ddb-campaigns-invite-primary").text().split("/").pop();
    console.log("harvest_game_id_and_join_link", window.gameId, window.CAMPAIGN_SECRET);
    store_campaign_info();
    callback();
    return;
  }

  if (!window.joinLinkAttempts) {
    window.joinLinkAttempts = 0;
  }
  window.joinLinkAttempts += 1;
  if (window.joinLinkAttempts > 10) {
    console.warn("harvest_game_id_and_join_link gave up after 10 attempts")
    delete window.joinLinkAttempts;
    if (is_abovevtt_page()) {
      showDebuggingAlert();
    }
    return;
  }

  // make sure we have a campaign id
  if (typeof window.gameId !== "string" || window.gameId.length <= 1) { // sometimes this gets set to "0" so don't count that as valid
    if (is_encounters_page()) {
      const urlParams = new URLSearchParams(window.location.search);
      window.gameId = urlParams.get('cid');
    } else if (is_characters_page()) {
      let campaignHref = $(".ct-campaign-pane__name-link");
      if (campaignHref.length === 0) {                    // if we don't have this element yet
        $(".ddbc-campaign-summary").click();              // try to reveal it
        campaignHref = $(".ct-campaign-pane__name-link"); // then try again
      }
      const campaignLink = campaignHref.attr("href");
      const campaignHrefParts = campaignLink ? campaignLink.split("/") : undefined;
      const campaignId = campaignHrefParts ? campaignHrefParts[campaignHrefParts.length - 1] : undefined;
      if (typeof campaignId !== "string" || campaignId.length <= 1) { // we still haven't found it so try again
        console.debug("harvest_game_id_and_join_link couldn't find campaign id. trying again in 1 second");
        setTimeout(function () {
          harvest_game_id_and_join_link(callback);
        }, 1000);
        return;
      }

      // we finally have the campaign id
      window.gameId = campaignId;
    } else {
      console.error("harvest_game_id_and_join_link is not supported on", window.location);
      return;
    }
  }

  // now let's find the join link

  const secretFromLocalStorage = read_campaign_info(window.gameId);
  if (typeof secretFromLocalStorage === "string" && secretFromLocalStorage.length > 1) {
    window.CAMPAIGN_SECRET = secretFromLocalStorage;
    delete window.joinLinkAttempts;
    console.log("harvest_game_id_and_join_link", window.gameId, window.CAMPAIGN_SECRET);
    callback();
    return;
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
  iframe.attr("src", `/campaigns/${window.gameId}`);
  window.joinLinkAttempts = 0;
  look_for_join_link(iframe, callback);
}

/** called from {@link harvest_game_id_and_join_link} and looks for the join link within the supplied iframe */
function look_for_join_link(iframe, callback) {
  if (!window.joinLinkAttempts) {
    window.joinLinkAttempts = 0;
  }
  window.joinLinkAttempts += 1;
  if (window.joinLinkAttempts > 30) {
    console.warn("look_for_join_link gave up after 30 attempts");
    delete window.joinLinkAttempts;
    if (is_abovevtt_page()) {
      showDebuggingAlert();
    }
    return;
  }
  const joinLink = iframe.contents().find(".ddb-campaigns-invite-primary").text();
  const joinLinkId = joinLink?.split("/")?.pop()
  if (typeof joinLinkId === "string" && joinLinkId.length > 1) {
    window.CAMPAIGN_SECRET = joinLinkId;
    iframe.remove();
    store_campaign_info();
    console.debug("look_for_join_link", window.gameId, window.CAMPAIGN_SECRET);
    callback();
  } else {
    // try again in 1 seconds
    console.debug("look_for_join_link checking again in 1 second");
    setTimeout(function() {
      look_for_join_link(iframe, callback);
    }, 1000);
  }
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
