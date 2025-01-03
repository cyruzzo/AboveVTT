/** CampaignPage.js - functions that only execute on the campaign page */

$(function() {
  if (is_campaign_page()) {
    window.gameIndexedDb = undefined;
    if(window.DM)
      window.globalIndexedDB = undefined;
    monitor_console_logs();
    harvest_game_id()                 // find our campaign id
      .then(set_game_id)              // set it to window.gameId
      .then(harvest_campaign_secret)  // find our join link
      .then(set_campaign_secret)      // set it to window.CAMPAIGN_SECRET
      .then(store_campaign_info)      // store gameId and campaign secret in localStorage for use on other pages     
      .then(() => {
         openCampaignDB(async function() {
          if (is_gamelog_popout()) {
            window.MB = new MessageBroker();
            window.JOURNAL = new JournalManager(window.gameId);
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            window.PLAYER_ID = urlParams.get('id');
            window.DM = window.PLAYER_ID == 'false';
            window.PLAYER_NAME = urlParams.get('player_name');
            inject_chat_buttons();
          } else {
            inject_instructions();
            inject_dm_join_button();  
            inject_player_join_buttons();
          }
         });
      })
      .catch(error => {
        showError(error, "Failed to set up campaign page");
      });
  }
});


async function openCampaignDB(startUp = function(){}) {
  const DBOpenRequest = await indexedDB.open(`AboveVTT-${window.gameId}`, 2); // version 2
  
  DBOpenRequest.onsuccess = (e) => {
    window.gameIndexedDb = DBOpenRequest.result;
  };
  DBOpenRequest.onerror = (e) => {
    console.warn(e);
  };
  DBOpenRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if(!db.objectStoreNames?.contains('exploredData')){
        const objectStore = db.createObjectStore("exploredData", { keyPath: "exploredId" });
      }
      if(!db.objectStoreNames?.contains('journalData')){
        const objectStore2 = db.createObjectStore("journalData", { keyPath: "journalId" });
      }
  };
   
  
  const DBOpenRequest2 = await indexedDB.open(`AboveVTT-Global`, 2);
  
  DBOpenRequest2.onsuccess = (e) => {
    window.globalIndexedDB = DBOpenRequest2.result;
    startUp()
  };
  DBOpenRequest2.onerror = (e) => {
    console.warn(e);
  };
  DBOpenRequest2.onupgradeneeded = (event) => {
      const db = event.target.result;
      if(!db.objectStoreNames?.contains('customizationData')){
        const objectStore = db.createObjectStore("customizationData", { keyPath: "customizationId" });
      }
      if(!db.objectStoreNames?.contains('journalData')){
        const objectStore2 = db.createObjectStore("journalData", { keyPath: "journalId" });
      }
  };
}
function inject_instructions() {
  if (!is_campaign_page()) return;

  let ddbHeader = $(".ddb-campaigns-detail-header-secondary-sharing");

  // SCB: Add a dummy DIV to force the AboutVTT DIV below the standard DDB buttons
  ddbHeader.append($("<div style='clear:both'>"));

  // SCB:Create a 'content DIV' for AboveVTT to add our controls to, so we can control styling better
  const contentDiv = $("<div class='above-vtt-content-div'>");
  ddbHeader.append(contentDiv);

  // SCB: Append our logo
  contentDiv.append(`<img class='above-vtt-logo above-vtt-right-margin-5px' width='120px' src='${window.EXTENSION_PATH}assets/logo.png' alt="above vtt logo" />`);

  let instructionsButton = $("<a class='above-vtt-campaignscreen-white-button above-vtt-right-margin-5px instructions btn modal-link ddb-campaigns-detail-body-listing-campaign-link'>Instructions</a>");
  contentDiv.append(instructionsButton);
  instructionsButton.click(function(e) {
    $("#campaign_banner").toggle();
  });

  const campaign_banner = $("<div id='campaign_banner'></div>");
  campaign_banner.append(`
    <h4><img class='above-vtt-right-margin-5px' alt='above vtt logo' width='100px' src='${window.EXTENSION_PATH}assets/logo.png'>Basic Instructions!</h4>
    <br>If you are the DM, press <b>JOIN AS DM</b> above. If you have a free DnDBeyond account make sure you have 1 free encounter slot to join as DM. Free accounts are limited to 8 encounters.<br><br>
    Players, press <b>JOIN AboveVTT</b> next to your character at the bottom, and then wait for your DM to join.<br><br>
    Please check that you do not have any other extensions for DndBeyond (like Beyond20) enabled. <b>Disable them</b> or you will not be able to roll dice!<br><br>
    If you're looking for tutorials, take a look at our <a target='_blank' href='https://www.youtube.com/channel/UCrVm9Al59iHE19IcqaKqqXA'>YouTube Channel!!</a><br>
    If you need help, or just want to send us your feedback, join the <a target='_blank' href='https://discord.gg/cMkYKqGzRh'>AboveVTT Discord Community</a>.<br>
    Do you like what you see? Then please support me on <a target='_blank' href='https://www.patreon.com/AboveVTT'>AboveVTT Patreon!</a><br><br>
    <b>Deprecation</b> Due to technical changes. You no longer can join as DM if you're not the real DM of the campaign. If you need help recovering your local data for this campaign contact us on discord<br><br>
    Use this button to delete all locally held data, to 'clear the cache' as it were: <br>
  `);
  campaign_banner.hide();
  $(".ddb-campaigns-detail-header-secondary-description").first().before(campaign_banner);

  const delete_button = $("<a class='above-vtt-campaignscreen-black-button button btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above_delete'>Delete AboveVTT Data for this campaign</a>");
  delete_button.click(function() {
    if (confirm("Are you sure?")) {
      let gameId = find_game_id();
      localStorage.removeItem("ScenesHandler" + gameId);
      localStorage.removeItem("current_source" + gameId);
      localStorage.removeItem("current_chapter" + gameId);
      localStorage.removeItem("current_scene" + gameId);
      localStorage.removeItem("CombatTracker" + gameId);
      localStorage.removeItem("Journal" + gameId);
      localStorage.removeItem("JournalChapters" + gameId);
      localStorage.removeItem("TokenSettings" + gameId);
      gameIndexedDb.transaction([`exploredData`], "readwrite").objectStore('exploredData').clear();
      gameIndexedDb.transaction([`journalData`], "readwrite").objectStore('journalData').clear();
    }
  });
  campaign_banner.append(delete_button);

  const delete_button2 = $("<a class='above-vtt-campaignscreen-black-button button btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above_delete2'>Delete Global AboveVTT Data (soundpads, tokens..)</a>");
  delete_button2.click(function() {
    if (confirm("Are you sure?")) {
      localStorage.removeItem("Soundpads");
      localStorage.removeItem("CustomTokens");
      localStorage.removeItem("TokenCustomizations");
      globalIndexedDB.transaction([`customizationData`], "readwrite").objectStore('customizationData').clear();
      globalIndexedDB.transaction([`journalData`], "readwrite").objectStore('journalData').clear();
    }
  });
  campaign_banner.append(delete_button2);
}

function inject_dm_join_button() {
  if (!is_campaign_page()) return;
  if ($(".ddb-campaigns-detail-body-dm-notes-private").length === 0) return; // The owner of the campaign (the DM) is the only one with private notes on the campaign page
  // The owner of the campaign (the DM) is the only one with private notes on the campaign page
  console.log("inject_dm_join_button");

  $(".ddb-campaigns-invite-container").append(`
    <div class="above-vtt-warning-div" style="display: flex;flex-direction: column; align-items: center;justify-content: center; text-align: center;padding: 5px;border: 2px solid #c53131; border-radius: 4px;">
      <div class="above-vtt-warning-secondary-div">
        <a class="above-vtt-warning-secondary-div" style="color: #c53131; font-weight: 900; font-size: 16px; font-family: roboto;">WARNING FOR ABOVEVTT!!!</a>
      </div>
      <a class="ddb-campaigns-warning-div" style="color: #333;">If you press 'RESET INVITE LINK' you will lose your cloud data!<br>Players will also have to visit/join from the campaign page at least once after reset to sync.</a>
        
    </div>
  `);

  let dmJoinButton = $("<a class='above-vtt-campaignscreen-blue-button above-vtt-right-margin-5px button joindm btn modal-link ddb-campaigns-detail-body-listing-campaign-link'>JOIN AS DM</a>");
  $(".above-vtt-content-div").append(dmJoinButton);
  dmJoinButton.click(function(e) {
    e.preventDefault();
    $(e.currentTarget).addClass("button-loading");
    DDBApi.fetchAllEncounters()         	    // Fetch all encounters, so we can delete all the old AboveVTT encounters in the next step
      .then(DDBApi.deleteAboveVttEncounters)	// Delete any AboveVTT encounters that we've created in the past because we don't want to bloat the user's encounters with a bunch of AboveVTT encounters
      .then(DDBApi.createAboveVttEncounter)  	// Create a new AboveVTT encounter that's tied to this campaign. We need an encounter tied to this campaign so that the dice rolling feature is tied to the current campaign.
      .then((avttEncounter) => {
        console.log("About to start AboveVTT for DM using a fresh encounter", avttEncounter);
        window.open(`https://www.dndbeyond.com/encounters/${avttEncounter.id}?abovevtt=true`, '_blank');
        // pop up blockers can prevent us from opening in a new tab. Tell our users in case this happens to them
        let oldText = $(".joindm").text();
        $(".joindm").removeClass("button-loading");
        $(".joindm").text("Check for blocked pop ups!");
        // reset our join button text, so it looks normal the next time they're on this tab
        setTimeout(function () {
          $(".joindm").text(oldText);
        }, 2000);
      })
      .catch((error) => {
        if (error.message && error.message.includes("EncounterLimitException")) {
          showErrorMessage(
            error,
            "It looks like you have too many encounters. DndBeyond limits free accounts to 8 encounters, and AboveVTT requires 1 encounter to run. Try deleting a few encounters, and then try again.",
            `<a href="https://www.dndbeyond.com/my-encounters" target="_blank">My Encounters</a>`
          );
        } else {
          showError(error, "Failed to start AboveVTT from dm join button");
        }
      })
      .finally(() => {
        $(e.currentTarget).removeClass("button-loading");
      });
  });
}

function inject_player_join_buttons() {
  if (!is_campaign_page()) return;
  console.log("inject_campaign_page_buttons");
  $(".ddb-campaigns-character-card-footer-links").each(function() {
    const characterCard = $(this);
    if(characterCard.find(".ddb-campaigns-character-card-footer-links-item-edit").length > 0) {
      const characterPagePathname = characterCard.find(".ddb-campaigns-character-card-footer-links-item-view").attr('href');
      characterCard.prepend(`<a style='color:white;background: #1b9af0;' href='https://www.dndbeyond.com${characterPagePathname}?abovevtt=true' target='_blank' class='button ddb-campaigns-character-card-footer-links-item'>JOIN AboveVTT</a>`);
    }
  });
}
