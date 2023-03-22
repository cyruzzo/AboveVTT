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
  monitor_console_logs();
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

function monitor_console_logs() {
  // slightly modified version of https://stackoverflow.com/a/67449524
  if (console.concerningLogs === undefined) {
    console.concerningLogs = [];
    console.otherLogs = [];
    function TS() {
      return (new Date).toISOString();
    }
    function addLog(log) {
      if (log.type !== 'log' && log.type !== 'debug') { // we don't currently track debug, but just in case we add them
        console.concerningLogs.unshift(log);
        if (console.concerningLogs.length > 100) {
          console.concerningLogs.length = 100;
        }
        if (get_avtt_setting_value("aggressiveErrorMessages")) {
          showError(new Error(`${log.type} ${log.message}`), ...log.value);
        }
      } else {
        console.otherLogs.unshift(log);
        if (console.otherLogs.length > 100) {
          console.otherLogs.length = 100;
        }
      }
    }
    window.addEventListener('error', function(event) {
      addLog({
        type: "exception",
        timeStamp: TS(),
        value: [event.message, `${event.filename}:${event.lineno}:${event.colno}`, event.error?.stack]
      });
      return false;
    });
    window.addEventListener('onunhandledrejection', function(event) {
      addLog({
        type: "exception",
        timeStamp: TS(),
        value: [event.message, `${event.filename}:${event.lineno}:${event.colno}`, event.error?.stack]
      });
      return false;
    });
    window.onerror = function (error, url, line, colno) {
      addLog({
        type: "exception",
        timeStamp: TS(),
        value: [error, `${url}:${line}:${colno}`]
      });
      return false;
    }
    window.onunhandledrejection = function (event) {
      addLog({
        type: "promiseRejection",
        timeStamp: TS(),
        value: [event.message, `${event.filename}: ${event.lineno}:${event.colno}`, event.error?.stack]
      });
    }

    function hookLogType(logType) {
      const original = console[logType].bind(console);
      return function() {
        addLog({
          type: logType,
          timeStamp: TS(),
          value: Array.from(arguments)
        });
        // Function.prototype.apply.call(console.log, console, arguments);
        original.apply(console, arguments);
      }
    }

    // we don't care about debug logs right now
    ['log', 'error', 'warn'].forEach(logType=> {
      console[logType] = hookLogType(logType)
    });
  }
}

function process_monitored_logs() {
  const logs = [...console.concerningLogs, ...console.otherLogs].sort((a, b) => a.timeStamp < b.timeStamp ? 1 : -1);
  let processedLogs = [];
  logs.forEach(log => {
    let messageString = `\n${log.type.toUpperCase()} ${log.timeStamp}`;
    // processedLogs.push(prefix);
    log.value.forEach((value, index) => {
      const logItem = log.value[index];
      let logString = '\n';
      if (typeof logItem === "object") {
        logString += `      ${JSON.stringify(logItem)}`;
      } else {
        logString += `      ${logItem}`;
      }
      messageString += logString.replaceAll(MYCOBALT_TOKEN, '[REDACTED]').replaceAll(window.CAMPAIGN_SECRET, '[REDACTED]');
    })
    processedLogs.push(messageString);
  });
  return processedLogs.join('\n');
}

function is_release_build() {
  return (!is_beta_build() && !is_local_build());
}
function is_beta_build() {
  return AVTT_ENVIRONMENT.versionSuffix?.includes("beta");
}
function is_local_build() {
  return AVTT_ENVIRONMENT.versionSuffix?.includes("local");
}

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
  remove_loading_overlay(); // in case there was an error starting up, remove the loading overlay, so they're not completely stuck
  delete window.logSnapshot;
}

/** Displays an error to the user. Only use this if you don't want to look for matching github issues
 * @see showError
 * @param {Error} error an error object to be parsed and displayed
 * @param {string|*[]} extraInfo other relevant information */
function showErrorMessage(error, ...extraInfo) {
  removeError();
  window.logSnapshot = process_monitored_logs(false);

  console.log("showErrorMessage", ...extraInfo, error);
  if (error?.constructor?.name !== "Error") {
    error = new Error(error?.toString());
  }
  const stack = error.stack || new Error().stack;

  const extraStrings = extraInfo.map(ei => {
    if (typeof ei === "object") {
      return JSON.stringify(ei);
    } else {
      return ei?.toString();
    }
  }).join('<br />');

  let container = $("#above-vtt-error-message");
  if (container.length === 0) {
    const container = $(`
      <div id="above-vtt-error-message">
        <h2>An unexpected error occurred!</h2>
        <h3 id="error-message">${error.message}</h3>
        <div id="error-message-details">${extraStrings}</div>
        <pre id="error-message-stack" style="display: none">${error.message}<br/>${extraStrings}</pre>
        <div id="error-github-issue"></div>
        <div class="error-message-buttons">
          <button id="close-error-button">Close</button>
          <button id="copy-error-button">Copy logs to clipboard</button>
        </div>
      </div>
    `);
    $(document.body).append(container);
  } else {
    $("#error-message-stack").append("<br /><br />---------- Another Error Occurred ----------<br /><br />");
  }

  $("#error-message-stack")
    .append('<br />')
    .append(stack);

  $("#close-error-button").on("click", removeError);

  $("#copy-error-button").on("click", function () {
    copy_to_clipboard(build_external_error_message());
  });

  if (get_avtt_setting_value("aggressiveErrorMessages")) {
    $("#error-message-stack").show();
  }
}

/** Displays an error to the user, and looks for matching github issues
 * @param {Error} error an error object to be parsed and displayed
 * @param {string|*[]} extraInfo other relevant information */
function showError(error, ...extraInfo) {
  if (error?.constructor?.name !== "Error") {
    error = new Error(error);
  }

  showErrorMessage(error, ...extraInfo);

  $("#above-vtt-error-message .error-message-buttons").append(`<div style="float: right;top:-22px;position:relative;">Use this button to share logs with developers!<span class="material-symbols-outlined" style="color:red;font-size: 40px;top: 14px;position: relative;">line_end_arrow_notch</span></div>`);

  look_for_github_issue(error.message, ...extraInfo)
    .then((issues) => {
      add_issues_to_error_message(issues, error.message);
    })
    .catch(githubError => {
      console.error("look_for_github_issue", "Failed to look for github issues", githubError);
    });
}

function build_external_error_message(limited = false) {
  const codeBookend = "\n```\n";

  const error = $("#error-message-stack").html().replaceAll("<br />", "\n").replaceAll("<br/>", "\n").replaceAll("<br>", "\n");
  const formattedError = `**Error:**${codeBookend}${error}${codeBookend}`;

  const environment = JSON.stringify({
    avttVersion: `${window.AVTT_VERSION}${AVTT_ENVIRONMENT.versionSuffix}`,
    browser: get_browser(),
  });
  const formattedEnvironment = `**Environment:**${codeBookend}${environment}${codeBookend}`;

  const formattedConsoleLogs = `**Other Logs:**${codeBookend}${window.logSnapshot}`; // exclude the closing codeBookend, so we can cleanly slice the full message

  const fullMessage = formattedError + formattedEnvironment + formattedConsoleLogs;

  if (limited) {
    return fullMessage.slice(0, 2000) + codeBookend;
  }

  return fullMessage + codeBookend;
}

function add_issues_to_error_message(issues, errorMessage) {
  if (issues.length > 0) {

    let ul = $("#error-issues-list");
    if (ul.length === 0) {
      ul = $(`<ul id="error-issues-list" style="list-style: inside"></ul>`);
      $("#error-github-issue").append(`<p class="error-good-news">We found some issues that might be similar. Check them out to see if there's a known workaround for the error you just encountered.</p>`);
      $("#error-github-issue").append(ul);
    }

    issues.forEach(issue => {
      const li = $(`<li><a href="${issue.html_url}" target="_blank">${issue.title}</a></li>`);
      ul.append(li);
      if (issue.labels.find(l => l.name === "workaround")) {
        li.addClass("github-issue-workaround");
      }
    });

  }

  // give them a button to create a new github issue.
  // If this gets spammed, we can change the logic to only include this if issues.length === 0
  if ($("#create-github-button").length === 0) {
    $("#error-github-issue").append(`<div style="margin-top:20px;">Creating a Github Issue <i>(account required)</i> is very helpful. It gives the developers all the details they need to fix the bug. Alternatively, you can use the copy "Copy Error Message" button and then paste it on the AboveVTT discord or subreddit and a developer will eventually create a Github Issue for it.</div>`);
    const githubButton = $(`<button id="create-github-button" style="float: left">Create Github Issue</button>`);
    githubButton.click(function() {
      const textToCopy = $("#error-message-stack").html().replaceAll("<br />", "\n").replaceAll("<br/>", "\n").replaceAll("<br>", "\n");
      const environment = JSON.stringify({
        avttVersion: `${window.AVTT_VERSION}${AVTT_ENVIRONMENT.versionSuffix}`,
        browser: get_browser(),
      });
      const errorBody = build_external_error_message(true);
      console.log("look_for_github_issue", `appending createIssueUrl`, errorMessage, errorBody);
      open_github_issue(errorMessage, errorBody);
    });
    $("#above-vtt-error-message .error-message-buttons").append(githubButton);
  }
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
    // we are not making a shortcut for `color` because the logic is too complex. See color_from_pc_object for details
    return {
      ...characterData,
      image: characterData.decorations?.avatar?.avatarUrl || characterData.avatarUrl || defaultAvatarUrl,
      sheet: `/profile/${characterData.userId}/characters/${characterData.characterId}`
    }
  });
}

function debounced_handle_character_update(msg) {
  console.debug("debounced_handle_character_update", msg);
  const playerId = msg?.data?.characterId;
  if (!playerId) return;
  if (!window.PLAYER_UPDATE_FUNCTIONS) {
    window.PLAYER_UPDATE_FUNCTIONS = {};
  }
  if (!window.PLAYER_UPDATE_FUNCTIONS[playerId]) {
    window.PLAYER_UPDATE_FUNCTIONS[playerId] = mydebounce(() => {
      update_window_pc(playerId)
        .then(() => {
          console.log("debounced_handle_character_update called update_window_pc", playerId);
          const pc = find_pc_by_player_id(playerId);
          if (window.DM && pc) {
            const tokenObject = window.TOKEN_OBJECTS[pc.sheet];
            if (tokenObject) {
              const color = color_from_pc_object(pc);
              tokenObject.options.color = color;
              $(`#combat_area tr[data-target='${tokenObject.options.id}'] img[class*='Avatar']`).css("border-color", color);
              const alternativeImages = tokenObject.options.alternativeImages || [];
              if (typeof pc.image === "string" && pc.image.length > 0 && alternativeImages && alternativeImages.indexOf(tokenObject.options.imgsrc) < 0) {
                // the token is not using a custom image so update it with whatever the player has set
                tokenObject.options.imgsrc = pc.image;
              }
              tokenObject.place_sync_persist();
            }
          }
        })
        .catch(error => {
          console.warn("debounced_handle_character_update failed to update_window_pc", playerId, error);
        });

      // old way of updating character data that's still being used
      if (window.DM) {
        const pc = window.pcs.find(pc => pc.sheet.includes(playerId));
        if (pc) {
          console.log("debounced_handle_character_update is calling getPlayerData", playerId);
          getPlayerData(pc.sheet, function (playerData) {
            window.PLAYER_STATS[playerData.id] = playerData;
            window.MB.sendTokenUpdateFromPlayerData(playerData);
            update_pclist();
            send_player_data_to_all_peers(playerData);
          });
        }
      }
    }, 4000);
  }
  console.debug("debounced_handle_character_update calling debounce function", playerId);
  window.PLAYER_UPDATE_FUNCTIONS[playerId]();
}

async function update_window_pc(characterId) {
  const index = window.pcs.findIndex(pc => pc.id.toString() === characterId.toString());
  if (index < 0) return; // We haven't even finished fetching all window.pcs yet. No need to update this one yet.
  const allCharacterDetails = await DDBApi.fetchCharacterDetails([characterId]);
  const characterData = allCharacterDetails[0];
  const oldData = window.pcs[index];
  window.pcs[index] = {
    ...oldData,
    ...characterData,
    image: characterData.decorations?.avatar?.avatarUrl || defaultAvatarUrl,
    sheet: `/profile/${characterData.userId}/characters/${characterData.characterId}`
  };
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

async function look_for_github_issue(...searchTerms) {

  const searchTermStrings = searchTerms.map(ei => {
    if (typeof ei === "object") {
      return JSON.stringify(ei);
    } else {
      return ei?.toString();
    }
  });


  // fetch issues that have been marked as bugs
  const request = await fetch("https://api.github.com/repos/cyruzzo/AboveVTT/issues?labels=bug&state=all", { credentials: "omit" });
  const response = await request.json();

  // remove any that have been marked as potential-duplicate
  const filteredIssues = response.filter(issue => !issue.labels.find(l => l.name === "potential-duplicate" || l.name === "released")).reverse();

  // instantiate fuse to fuzzy match parts of the github issues that we just downloaded
  const fuse = new Fuse(filteredIssues, {
    threshold: 0.4,         // we want the matches to be a little closer. Default is 0.6, and the lower the threshold the smaller the variance that's allowed
    includeScore: true,     // we want to know the match score, so we can sort by it after we've merged multiple arrays of search results
    keys: ['title', 'body'] // look at the title and body of each item
  });

  return searchTermStrings
    .flatMap(st => {
      // iterate over every search term and collect matching results
      return fuse.search(st)
    })
    .sort((a, b) => {
      // sort by result.score. The lower the score, the more accurate the match
      if (a.score === b.score) return 0;
      return a.score < b.score ? -1 : 1;
    })
    .map(result => {
      // fuse returns a wrapped object, but we want the original object
      return result.item
    })
    .filter((value, index, array) => {
      // Finally we need to remove duplicates
      // Find the first index that matches the current issue.number
      const matchingIndex = array.findIndex(i => i.number === value.number)
      // Only keep this item if it's the first one we've found
      return matchingIndex === index
    });
}

async function fetch_github_issue_comments(issueNumber) {
  const request = await fetch("https://api.github.com/repos/cyruzzo/AboveVTT/issues?labels=bug", { credentials: "omit" });
  const response = await request.json();
  console.log(response);
  return response;
}

function open_github_issue(title, body) {
  const url = `https://github.com/cyruzzo/AboveVTT/issues/new?labels=bug&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank');
}
