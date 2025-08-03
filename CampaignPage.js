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
      .then(() => {window.CAMPAIGN_INFO = DDBApi.fetchCampaignInfo(window.gameId)})  
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
            inject_player_join_buttons();
            inject_dm_join_button();  
            inject_dice();
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
    tabCommunicationChannel.postMessage({
      msgType: 'DMOpenAlready',
      sendTo: false
    });
    $(e.currentTarget).addClass("button-loading");
    
    try{
      window.open(`${window.document.location.href}?abovevtt=true&dm=true`, '_blank');
      // pop up blockers can prevent us from opening in a new tab. Tell our users in case this happens to them
      let oldText = $(".joindm").text();
      $(".joindm").removeClass("button-loading");
      $(".joindm").text("Check for blocked pop ups!");
      // reset our join button text, so it looks normal the next time they're on this tab
      setTimeout(function () {
        $(".joindm").text(oldText);
      }, 2000);
    }   
    catch(error) {
      if (error.message && error.message.includes("EncounterLimitException")) {
        showErrorMessage(
          error,
          "It looks like you have too many encounters. DndBeyond limits free accounts to 8 encounters, and AboveVTT requires 1 encounter to run. Try deleting a few encounters, and then try again.",
          `<a href="https://www.dndbeyond.com/my-encounters" target="_blank">My Encounters</a>`
        );
      } else {
        showError(error, "Failed to start AboveVTT from dm join button");
      }
    }
      
      
    $(e.currentTarget).removeClass("button-loading");
  });

}

function inject_player_join_buttons() {
  if (!is_campaign_page()) return;
  console.log("inject_campaign_page_buttons");
  $(".ddb-campaigns-character-card-footer-links").each(function() {
    const characterCard = $(this);
    if(characterCard.find(".ddb-campaigns-character-card-footer-links-item-edit").length > 0) {
      const characterPagePathname = characterCard.find(".ddb-campaigns-character-card-footer-links-item-view").attr('href');
      characterCard.prepend(`<a style='color:white;background: #1b9af0;padding: 2px;' href='https://www.dndbeyond.com${characterPagePathname}?abovevtt=true' target='_blank' class='button ddb-campaigns-character-card-footer-links-item'>JOIN AboveVTT</a>`);
    }
  });
}

function inject_dice(){
  window.encounterObserver = new MutationObserver(function(mutationList, observer) {

    mutationList.forEach(mutation => {
      try {
        let mutationTarget = $(mutation.target);
        //Remove beyond20 popup and swtich to gamelog
        if(mutationTarget.hasClass('encounter-details') || mutationTarget.hasClass('encounter-builder')){
          mutationTarget.remove();
         
        }
        if($(mutation.addedNodes).is('.encounter-builder')){
          $(mutation.addedNodes).remove();
        }
        window.encounterObserver.disconnect();
      } catch{
        console.warn("non_sheet_observer failed to parse mutation", error, mutation);
      }
    });
  })


  const mutation_target = $('body')[0];
  //observers changes to body direct children being removed/added
  const mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };
  window.encounterObserver.observe(mutation_target, mutation_config) 

  $('body').append(`<div class="container">
     
        <div id="encounter-builder-root" data-config="{&quot;analyticsEventDelay&quot;:500,&quot;autoSaveTimeFrame&quot;:3000,&quot;assetBasePath&quot;:&quot;https://media.dndbeyond.com/encounter-builder&quot;,&quot;authUrl&quot;:&quot;https://auth-service.dndbeyond.com/v1/cobalt-token&quot;,&quot;branchName&quot;:&quot;refs/tags/v1.0.26&quot;,&quot;buildKey&quot;:&quot;5ae3809f24498ec4c7eeb928446e52f2efde2261&quot;,&quot;buildNumber&quot;:&quot;34&quot;,&quot;campaignDetailsPageBaseUrl&quot;:&quot;https://www.dndbeyond.com/campaigns&quot;,&quot;campaignServiceUrlBase&quot;:&quot;https://www.dndbeyond.com/api/campaign&quot;,&quot;characterServiceUrlBase&quot;:&quot;https://character-service-scds.dndbeyond.com/v2/characters&quot;,&quot;dateMessageUpdateInterval&quot;:60000,&quot;saveUpdateEncounterSpinnerDelay&quot;:3000,&quot;diceApi&quot;:&quot;https://dice-service.dndbeyond.com&quot;,&quot;gameLogBaseUrl&quot;:&quot;https://www.dndbeyond.com&quot;,&quot;ddbApiUrl&quot;:&quot;https://api.dndbeyond.com&quot;,&quot;ddbBaseUrl&quot;:&quot;https://www.dndbeyond.com&quot;,&quot;ddbConfigUrl&quot;:&quot;https://www.dndbeyond.com/api/config/json&quot;,&quot;debug&quot;:false,&quot;encounterServiceUrl&quot;:&quot;https://encounter-service.dndbeyond.com/v1&quot;,&quot;environment&quot;:&quot;production&quot;,&quot;fetchThrottleDelay&quot;:250,&quot;launchDarkylyClientId&quot;:&quot;5c63387e40bda9329a652b74&quot;,&quot;featureFlagsDomain&quot;:&quot;https://api.dndbeyond.com&quot;,&quot;marketplaceUrl&quot;:&quot;https://www.dndbeyond.com/marketplace&quot;,&quot;mediaBucket&quot;:&quot;https://media.dndbeyond.com&quot;,&quot;monsterServiceUrl&quot;:&quot;https://monster-service.dndbeyond.com/v1/Monster&quot;,&quot;production&quot;:true,&quot;sourceUrlBase&quot;:&quot;https://www.dndbeyond.com/sources/&quot;,&quot;subscriptionUrl&quot;:&quot;https://www.dndbeyond.com/subscribe&quot;,&quot;tagName&quot;:&quot;v1.0.26&quot;,&quot;toastAutoDeleteInterval&quot;:3000,&quot;tooltipUrl&quot;:&quot;https://www.dndbeyond.com&quot;,&quot;version&quot;:&quot;1.0.26&quot;}" data-environment="production" data-branch-name="refs/tags/v1.0.26" data-build-number="34" data-build-key="5ae3809f24498ec4c7eeb928446e52f2efde2261" data-debug="false" data-tag-name="v1.0.26" data-version="1.0.26">
           <div class="encounter-details">
           </div>
           <div class="dice-rolling-panel">
              <div class="dice-toolbar  ">
                 <div class="dice-toolbar__dropdown ">
                    <div class=" dice-toolbar__dropdown-die"><span class="dice-icon-die dice-icon-die--d20"></span></div>
                    <div role="group" class="MuiButtonGroup-root MuiButtonGroup-outlined dice-toolbar__target css-3fjwge" aria-label="roll actions">
                       <button class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeMedium MuiButton-outlinedSizeMedium MuiButtonGroup-grouped MuiButtonGroup-groupedHorizontal MuiButtonGroup-groupedOutlined MuiButtonGroup-groupedOutlinedHorizontal MuiButtonGroup-groupedOutlinedPrimary MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeMedium MuiButton-outlinedSizeMedium MuiButtonGroup-grouped MuiButtonGroup-groupedHorizontal MuiButtonGroup-groupedOutlined MuiButtonGroup-groupedOutlinedHorizontal MuiButtonGroup-groupedOutlinedPrimary css-79xub" tabindex="0" type="button">
                          <div class="MuiBox-root css-dgzhqv">
                             <p class="MuiTypography-root MuiTypography-body1 dice-toolbar__target-roll css-9l3uo3">Roll</p>
                          </div>
                       </button>
                    </div>
                    <div class="dice-toolbar__dropdown-top" style="display: none;">
                       <div class="dice-die-button" data-dice="d20">
                          <span class="dice-icon-die dice-icon-die--d20"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d20
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d12">
                          <span class="dice-icon-die dice-icon-die--d12"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d12
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d10">
                          <span class="dice-icon-die dice-icon-die--d10"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d10
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d100">
                          <span class="dice-icon-die dice-icon-die--d100"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d100
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d8">
                          <span class="dice-icon-die dice-icon-die--d8"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d8
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d6">
                          <span class="dice-icon-die dice-icon-die--d6"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d6
                          </div>
                       </div>
                       <div class="dice-die-button" data-dice="d4">
                          <span class="dice-icon-die dice-icon-die--d4"></span>
                          <div class="dice-die-button__tooltip">
                             <div class="dice-die-button__tooltip__pip"></div>
                             d4
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <canvas class="dice-rolling-panel__container" width="1917" height="908" data-engine="Babylon.js v6.3.0" touch-action="none" tabindex="1" style="touch-action: none; -webkit-tap-highlight-color: transparent;"></canvas>
           </div>
        </div>
        <script src="https://media.dndbeyond.com/encounter-builder/static/js/main.221d749b.js"></script>
  </div>
  `);

}