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

function removeError() {
  $("#above-vtt-error-message").remove();
}

/** Displays an error to the user
 * @param {Error} error an error object to be parsed and displayed
 * @param {(string|*[])[]} extraInfo other relevant information */
function showError(error, ...extraInfo) {

  let container = $("#above-vtt-error-message");
  if (container.length === 0) {
    const container = $(`
      <div id="above-vtt-error-message">
        <h2>An unexpected error occurred!</h2>
        <div id="error-message-body">An unexpected error occurred. Please report this via the AboveVTT Discord.</div>
        <pre id="error-message-stack"></pre>
        <div id="error-github-issue"></div>
        <div class="error-message-buttons">
            <button id="close-error-button">Close</button>
            <button id="copy-error-button">Copy Error Message</button>
        </div>
      </div>
    `);
    $(document.body).append(container);
  } else {
    $("#error-message-stack").append("<br /><br />---------- Another Error Occurred ----------<br /><br />");
  }

  console.error(...extraInfo, error);
  if (error?.constructor?.name !== "Error") {
    error = new Error(error);
  }
  const stack = error.stack || new Error().stack;
  const extraStrings = extraInfo.map(ei => {
    if (typeof ei === "object") {
      return JSON.stringify(ei);
    } else {
      return ei?.toString();
    }
  });

  console.log(`extraString`, extraStrings)

  $("#error-message-stack")
    .append(extraStrings.join(`<br />`))
    .append(`<br />`)
    .append(stack);

  $("#close-error-button").on("click", removeError);

  $("#copy-error-button").on("click", function () {
    const textToCopy = $("#error-message-stack").html().replaceAll("<br />", "\n").replaceAll("<br/>", "\n").replaceAll("<br>", "\n");
    copy_to_clipboard("```\n"+textToCopy+"\n```");
  });

  look_for_github_issue(error.message)
    .then(issues => {
      console.log("look_for_github_issue issues", issues);
      if (issues.length > 0) {
        console.log("look_for_github_issue", `appending ${issues.length} issues`);
        const ul = $(`<ul style="list-style: inside"></ul>`);
        $("#error-github-issue").append(`<p>Good News! We found these matching issues:</p>`);
        $("#error-github-issue").append(ul);
        issues.forEach(issue => {
          const li = $(`<li><a href="${issue.html_url}" target="_blank" style="text-decoration: unset;color: -webkit-link;">${issue.title}</a></li>`);
          ul.append(li);
          if (issue.labels.find(l => l.name === "workaround")) {
            li.addClass("github-issue-workaround");
          }
        });
      }
      if ($("#create-github-button").length === 0) {
        $("#error-github-issue").append(`<div style="margin-top:20px;">Creating a Github Issue <i>(account required)</i> is very helpful. It gives the developers all the details they need to fix the bug. Alternatively, you can use the copy "Copy Error Message" button and then paste it on the AboveVTT discord or subreddit and a developer will eventually create a Github Issue for it.</div>`);
        const githubButton = $(`<button id="create-github-button">Create Github Issue</button>`);
        githubButton.click(function() {
          const textToCopy = $("#error-message-stack").html().replaceAll("<br />", "\n").replaceAll("<br/>", "\n").replaceAll("<br>", "\n");
          const errorBody = "```\n"+textToCopy+"\n```";
          console.log("look_for_github_issue", `appending createIssueUrl`, error.message, errorBody);
          open_github_issue(error.message, errorBody);
        });
        $("#above-vtt-error-message .error-message-buttons").append(githubButton);
      }
    })
    .catch(githubError => {
      console.warn("look_for_github_issue", "Failed to look for github issues", githubError);
    })
    .finally(() => {
      console.log("look_for_github_issue finally");
    })
  ;
}


/** The string "THE DM" has been used in a lot of places.
 * This prevents typos or case sensitivity in strings.
 * @return {String} "THE DM" */
const dm_id = "THE DM";
// Use Acererak as the avatar, because he's on the DMG cover... but also because he's the fucking boss!
const dmAvatarUrl = "https://www.dndbeyond.com/avatars/thumbnails/30/787/140/140/636395106768471129.jpeg";
const defaultAvatarUrl = "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/characters/default-avatar.png";

/** an object that mimics window.pcs, but specific to the DM */
function generic_pc_object(isDM) {
  let pc = {
    "decorations": {
      "backdrop": { // barbarian because :shrug:
        "largeBackdropAvatarUrl":"https://www.dndbeyond.com/avatars/61/473/636453122224164304.jpeg",
        "smallBackdropAvatarUrl":"https://www.dndbeyond.com/avatars/61/472/636453122223383028.jpeg",
        "backdropAvatarUrl":"https://www.dndbeyond.com/avatars/61/471/636453122222914252.jpeg",
        "thumbnailBackdropAvatarUrl":"https://www.dndbeyond.com/avatars/61/474/636453122224476777.jpeg"
      },
      "characterTheme": {
        "name": "DDB Red",
        "isDarkMode": false,
        "isDefault": true,
        "backgroundColor": "#FEFEFE",
        "themeColor": "#C53131"
      },
      "avatar": {
        "avatarUrl": defaultAvatarUrl,
        "frameUrl": null
      }
    },
    "id": 0,
    "image": defaultAvatarUrl,
    "isAssignedToPlayer": false,
    "name": "Unknown Character",
    "sheet": "",
    "userId": 0
  };
  if (isDM) {
    pc.image = dmAvatarUrl;
    pc.decorations.avatar.avatarUrl = dmAvatarUrl;
    pc.name = dm_id;
  }
  return pc;
}

function color_for_player_id(playerId) {
  const pc = find_pc_by_player_id(playerId);
  return color_from_pc_object(pc);
}

function color_from_pc_object(pc) {
  if (!pc) return get_token_color_by_index(-1);
  if (pc.name === dm_id && pc.id === 0) {
    // this is a DM pc object. The DM uses the default DDB theme
    return pc.decorations.characterTheme.themeColor;
  }
  const isDefaultTheme = !!pc.decorations?.characterTheme?.isDefault;
  if (!isDefaultTheme && pc.decorations?.characterTheme?.themeColor) { // only the DM can use the default theme color
    return pc.decorations.characterTheme.themeColor;
  } else {
    const pcIndex = window.pcs.findIndex(p => p.id === p.id);
    return get_token_color_by_index(pcIndex);
  }
}

/** @return {string} The id of the player as a string, {@link dm_id} for the dm */
function my_player_id() {
  if (window.DM) {
    return dm_id;
  } else {
    return `${window.PLAYER_ID}`;
  }
}

/** @param {string} idOrSheet the playerId or pc.sheet of the pc you're looking for
 * @return {object} The window.pcs object that matches the idOrSheet */
function find_pc_by_player_id(idOrSheet) {
  if (idOrSheet === dm_id) {
    return generic_pc_object(true);
  }
  if (!window.pcs) {
    console.error("window.pcs is undefined");
    return generic_pc_object(false);
  }
  const pc = window.pcs.find(pc => pc.sheet.includes(idOrSheet));
  return pc || generic_pc_object(false);
}

async function rebuild_window_pcs() {
  const campaignCharacters = await DDBApi.fetchCampaignCharacterDetails(window.gameId);
  window.pcs = campaignCharacters.map(characterData => {
    return {
      decorations: characterData.decorations,
      id: characterData.characterId,
      image: characterData.decorations?.avatar?.avatarUrl || defaultAvatarUrl,
      isAssignedToPlayer: characterData.isAssignedToPlayer,
      name: characterData.name,
      sheet: `/profile/${characterData.userId}/characters/${characterData.characterId}`,
      userId: characterData.userId,
    }
  });
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
    const campaignSummaryButton = $(".ddbc-campaign-summary");
    if (campaignSummaryButton.length > 0) {
      if ($(".ct-campaign-pane__name-link").length === 0) {
        campaignSummaryButton.click(); // campaign sidebar is closed. open it
      }
      const fromLink = $(".ct-campaign-pane__name-link").attr("href")?.split("/")?.pop();
      if (typeof fromLink === "string" && fromLink.length > 1) {
        return fromLink;
      }
    }

    // we didn't find it on the page so hit the DDB API, and try to pull it from there
    const characterId = window.location.pathname.split("/").pop();
    window.characterData = await DDBApi.fetchCharacter(characterId);
    return window.characterData.campaign.id.toString();
  }

  throw new Error(`harvest_game_id failed to find gameId on ${window.location.href}`);
}

function set_game_id(gameId) {
  window.gameId = gameId;
}

async function harvest_campaign_secret() {
  if (typeof window.gameId !== "string" || window.gameId.length <= 1) {
    throw new Error("harvest_campaign_secret requires gameId to be set. Make sure you call harvest_game_id first");
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

function normalize_scene_urls(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return [];
  }
  return scenes.map(sceneData => Object.assign(sceneData, {
    dm_map: parse_img(sceneData.dm_map),
    player_map: parse_img(sceneData.player_map)
  }));
}

async function look_for_github_issue(searchTerm) {
  console.log("look_for_github_issue", searchTerm);
  const request = await fetch("https://api.github.com/repos/vlaminck/AboveVTT/issues?labels=bug", { credentials: "omit" });
  const response = await request.json();
  console.log("look_for_github_issue", response);
  const filteredResponse = response.filter(issue => issue.title.includes(searchTerm) || issue.body.includes(searchTerm));
  console.log("look_for_github_issue before sort", filteredResponse)
  filteredResponse.sort((a, b) => {
    if (a.labels.find(l => l.name === "workaround")) {
      return -1;
    }
    if (b.labels.find(l => l.name === "workaround")) {
      return 1;
    }
    return 0;
  });
  console.log("look_for_github_issue after sort", filteredResponse);
  return filteredResponse;
}

async function fetch_github_issue_comments(issueNumber) {
  const request = await fetch("https://api.github.com/repos/vlaminck/AboveVTT/issues?labels=bug", { credentials: "omit" });
  const response = await request.json();
  console.log(response);
  return response;
}

function open_github_issue(title, body) {
  const url = `https://github.com/vlaminck/AboveVTT/issues/new?labels=bug&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank');
}