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
var CONDITIONS = {};
$(function() {

  window.EXPERIMENTAL_SETTINGS = {};
  window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
  window.AVTT_VERSION = $("#avttversion").attr('data-version');
  $("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></link>');
  $("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />');
  if (is_encounters_page()) {
    window.DM = true; // the DM plays from the encounters page
    dmAvatarUrl = $('#site-bar').attr('user-avatar') != undefined ? $('#site-bar').attr('user-avatar') : $('.site-bar .user-interactions-profile-img').attr('src');
  } else if (is_campaign_page() && !is_spectator_page()) {
    // The owner of the campaign (the DM) is the only one with private notes on the campaign page
    window.DM = $(".ddb-campaigns-detail-body-dm-notes-private").length === 1;
  } else {
    window.DM = false;
  }
});

const async_sleep = m => new Promise(r => setTimeout(r, m));

const charactersPageRegex = /\/characters\/\d+/;

const tabCommunicationChannel = new BroadcastChannel('aboveVttTabCommunication');

function isIOS() {
  return (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
	  (navigator?.platform === 'MacIntel' && navigator?.maxTouchPoints > 1));
}
function isMac() {
  return (navigator?.userAgentData?.platform || navigator?.platform)?.toLowerCase()?.includes("mac");
}
function getModKeyName() {
  return isMac() ? "&#8984;" : "CTRL";
}
function getCtrlKeyName() {
  return isMac() ? "&#8963;" : "CTRL";
}
function getAltKeyName() {
  return isMac() ? "&#8984;" : "ALT";
}
function getShiftKeyName() {
  return isMac() ? "&#8679;" : "SHIFT";
}


function mydebounce(func, timeout = 800){  
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function throttle(func, wait, option = {leading: true, trailing: true}) {
  let waiting = false;
  let lastArgs = null;
  return function wrapper(...args) {
    if(!waiting) {
      waiting = true;
      const startWaitingPeriod = () => setTimeout(() => {
        if(option.trailing && lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
          startWaitingPeriod();
        }
        else {
          waiting = false;
        }
      }, wait);
      if(option.leading) {
        func.apply(this, args);
      } else {
        lastArgs = args; // if not leading, treat like another any other function call during the waiting period
      }
      startWaitingPeriod();
    }
    else {
      lastArgs = args; 
    }
  }
}
/**
 * Generates a random uuid string.
 * @returns String
 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
/**
 * Add .notification and .highlight-gamelog classes to #switch_gamelog.
 */
function notify_gamelog() {
  if (window.color) {
    $("#switch_gamelog").css("--player-border-color", window.color);
  }
  if (!$("#switch_gamelog").hasClass("selected-tab")) {
    if ($("#switch_gamelog").hasClass("notification")) {
      $("#switch_gamelog").removeClass("notification");
      setTimeout(function() {
        $("#switch_gamelog").addClass("notification");
      }, 400);
    } else {
      $("#switch_gamelog").addClass("notification");
    }
  }

  if ($(".GameLog_GameLog__2z_HZ").scrollTop() < 0) {
    $(".GameLog_GameLog__2z_HZ").addClass("highlight-gamelog");
  }
}
function startup_step(stepDescription) {
  console.log(`startup_step ${stepDescription}`);
  $("#loading-overlay-beholder > .sidebar-panel-loading-indicator > .loading-status-indicator__subtext").text(stepDescription);
}

/// builds and returns the loading indicator that covers the iframe
function build_combat_tracker_loading_indicator(subtext = "One moment while we fetch this monster stat block") {
  let loadingIndicator = $(`
		<div class="sidebar-panel-loading-indicator">
			<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;margin-top:100px;width:100%;position:relative;padding:0 10%;">
      <defs>
      <path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path>
      <clipPath id="beholder-eye-socket-clip-path">
      <path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path>
      </clipPath>
      </defs>
      <g class="beholder-dm-screen__beholder">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3">
      </path>
      <g clip-path="url(#beholder-eye-socket-clip-path)">
      <circle cx="137.5" cy="60" r="7" fill="#1B9AF0">
      <animateMotion dur="2.3s" repeatCount="indefinite">
      <mpath xlink:href="#beholder-eye-move-path"></mpath>
      </animateMotion>
      </circle>
      </g>
      </g>
      <g class="beholder-dm-screen__screen">
      <path fill="#3c1e00ff" stroke="#3b3b3bff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path>
      <path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#3c1e00ff" stroke="#3b3b3bff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
      </svg>
			<div class="loading-status-indicator__subtext">${subtext}</div>
		</div>
	`);
  loadingIndicator.css({
    "display": "block",
    "position": "absolute",
    "height": "100%",
    "width": "100%",
    "top": "0px",
    "left": "0px",
    "z-index": 100000,
    "background": "rgb(235, 241, 245)"
  });
  return loadingIndicator.clone();
}
/**
 * Add Dice buttons into sidebar.
 *
 * We add dice buttons and an input for chatting in the gamelog.
 * This does that injection on initial load as well as any time the character sheet re-adds the gamelog to the sidebar.
 * See `monitor_character_sidebar_changes` for more details on sidebar changes.
 * @returns
 */
function inject_chat_buttons() {
  const gameLog = $(".glc-game-log");
  if (gameLog.find("#chat-text").length > 0) {
    // make sure we only ever inject these once. This gets called a lot on the character sheet which is intentional, but just in case we accidentally call it too many times, let's log it, and return
    return;
  }

  const chatTextWrapper = $(`<div class='chat-text-wrapper sidebar-hover-text' data-hover="Dice Rolling Format: /cmd diceNotation action  &#xa;
    '/r 1d20'&#xa;
    '/roll 1d4 punch:bludgeoning damage'&#xa;
    '/hit 2d20kh1+2 longsword ADV'&#xa;
    '/dmg 1d8-2 longsword:slashing'&#xa;
    '/save 2d20kl1 DEX DISADV'&#xa;
    '/skill 1d20+1d4 Thieves' Tools + Guidance'&#xa;
    Advantage: 2d20kh1 (keep highest)&#xa;
    Disadvantage: 2d20kl1 (keep lowest)&#xa;
    '/w [playername] a whisper to playername'&#xa;
    '/dm for a shortcut to whisper THE DM'"><input id='chat-text' autocomplete="off" placeholder='Chat, /r 1d20+4..'></div>`
  );
  const diceRoller = $(`
    <div class="dice-roller">
      <div>
        <img title="d4" alt="d4" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d4.svg"}"/>
      </div>
      <div>
        <img title="d6" alt="d6" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d6.png"}"/>
      </div>
      <div>
        <img title="d8" alt="d8" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d8.svg"}"/>
      </div>
      <div>
        <img title="d10" alt="d10" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d10.svg"}"/>
      </div>
      <div>
        <img title="d100" alt="d100" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d100.png"}"/>
      </div>
      <div>
        <img title="d12" alt="d12" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d12.svg"}"/>
      </div>
      <div>
        <img title="d20" alt="d20" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d20.svg"}"/>
      </div>
    </div>
  `)  
  const languageSelect= $(`<select id='chat-language'></select>`)
  const ignoredLanguages = ['All'];

  const knownLanguages = get_my_known_languages();
  for (const language of window.ddbConfigJson.languages) {
    if (ignoredLanguages.includes(language.name))
      continue;
    if (!window.DM && !knownLanguages.includes(language.name))
      continue;
    const option = $(`<option value='${language.id}'>${language.name}</option>`)
    languageSelect.append(option);
  }

  gameLog.append(chatTextWrapper, languageSelect, diceRoller);

  $(".dice-roller > div img").on("click", function(e) {
    if ($(".dice-toolbar__dropdown").length > 0 && !window.EXPERIMENTAL_SETTINGS['rpgRoller']) {
      // DDB dice are on the screen so let's use those. Ours will synchronize when these change.
      if (!$(".dice-toolbar__dropdown").hasClass("dice-toolbar__dropdown-selected")) {
        // make sure it's open
        $(".dice-toolbar__dropdown-die").click();
      }
      // select the DDB dice matching the one that the user just clicked
      let dieSize = $(this).attr("alt");
      $(`.dice-die-button[data-dice='${dieSize}']`).click();
    } else {
      // there aren't any DDB dice on the screen so use our own
      const dataCount = $(this).attr("data-count");
      if (dataCount === undefined) {
        $(this).attr("data-count", 1);
        $(this).parent().append(`<span class="dice-badge">1</span>`);
      } else {
        $(this).attr("data-count", parseInt(dataCount) + 1);
        $(this).parent().append(`<span class="dice-badge">${parseInt(dataCount) + 1}</span>`);
      }
      if ($(".dice-roller > div img[data-count]").length > 0) {
        if(!$(".roll-mod-container").hasClass('show')){
          $(".roll-mod-container").addClass("show");
          $(".roll-mod-container").find('input').val(0);
        }
      } else {
        $(".roll-mod-container").removeClass("show");
      }
    }
  });

  
  window.rollButtonObserver = new MutationObserver(function() {
        // Any time the DDB dice buttons change state, we want to synchronize our dice buttons to match theirs.
      $(".dice-die-button").each(function() {
        let dieSize = $(this).attr("data-dice");
        let ourDiceElement = $(`.dice-roller > div img[alt='${dieSize}']`);
        let diceCountElement = $(this).find(".dice-die-button__count");
        ourDiceElement.parent().find("span").remove();
        if (diceCountElement.length == 0) {
          ourDiceElement.removeAttr("data-count");
        } else {
          let diceCount = parseInt(diceCountElement.text());
          ourDiceElement.attr("data-count", diceCount);
          ourDiceElement.parent().append(`<span class="dice-badge">${diceCount}</span>`);
        }
      })


      // make sure our roll button is shown/hidden after all animations have completed
      setTimeout(function() {
        if ($(".dice-toolbar").hasClass("rollable")) {
          if(!$(".roll-mod-container").hasClass('show')){
            $(".roll-mod-container").addClass("show");
            $(".roll-mod-container").find('input').val(0);
          }
        } else {
          $(".roll-mod-container").removeClass("show");
        }
      }, 0);  
    })

  let watchForDicePanel = new MutationObserver((mutations) => {
   mutations.every((mutation) => {
      if (!mutation.addedNodes) return

      for (let i = 0; i < mutation.addedNodes.length; i++) {
        // do things to your newly added nodes here
        let node = mutation.addedNodes[i]
        if ((node.className == 'dice-rolling-panel' || $('.dice-rolling-panel').length>0)){
          const mutation_target = $(".dice-toolbar__dropdown")[0];
      const mutation_config = { attributes: true, childList: true, characterData: true, subtree: true };
      window.rollButtonObserver.observe(mutation_target, mutation_config);
      watchForDicePanel.disconnect();
      return false;
        }
      }
      return true // must return true if doesn't break
    })
  });

  window.sendToDefaultObserver = new MutationObserver(function() {
      localStorage.setItem(`${gameId}-sendToDefault`, gamelog_send_to_text());
  })


  let gamelogObserver = new MutationObserver((mutations) => {
   mutations.every((mutation) => {
      if (!mutation.addedNodes) return
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        // do things to your newly added nodes here
        let node = mutation.addedNodes[i]
        if($(node).attr('class')?.includes('-SendToLabel') || $('.glc-game-log [class*="-SendToLabel"] ~ button').length>0){
          const sendto_mutation_target = $(".glc-game-log [class*='-SendToLabel'] ~ button")[0];
          const sendto_mutation_config = { attributes: true, childList: true, characterData: true, subtree: true };
          window.sendToDefaultObserver.observe(sendto_mutation_target, sendto_mutation_config);
          gamelogObserver.disconnect();
          return false;
        }
      }
      return true // must return true if doesn't break
    })
  });

  watchForDicePanel.observe(document.body, {childList: true, subtree: true, attributes: false, characterData: false});
  gamelogObserver.observe(document.body, {childList: true, subtree: true, attributes: false, characterData: false});

  



  

  

  $(".dice-roller > div img").on("contextmenu", function(e) {
    e.preventDefault();

    if ($(".dice-toolbar__dropdown").length > 0 && !window.EXPERIMENTAL_SETTINGS['rpgRoller']) {
      // There are DDB dice on the screen so update those buttons. Ours will synchronize when these change.
      // the only way I could get this to work was with pure javascript. Everything that I tried with jQuery did nothing
      let dieSize = $(this).attr("alt");
      let  element = $(`.dice-die-button[data-dice='${dieSize}']`)[0];
      let  e = element.ownerDocument.createEvent('MouseEvents');
      e.initMouseEvent('contextmenu', true, true,
          element.ownerDocument.defaultView, 1, 0, 0, 0, 0, false,
          false, false, false, 2, null);
      element.dispatchEvent(e);
    } else {
      let dataCount = $(this).attr("data-count");
      if (dataCount !== undefined) {
        dataCount = parseInt(dataCount) - 1;
        if (dataCount === 0) {
          $(this).removeAttr("data-count");
          $(this).parent().find("span").remove();
        } else {
          $(this).attr("data-count", dataCount);
          $(this).parent().append(`<span class="dice-badge">${dataCount}</span>`);
        }
      }
      if ($(".dice-roller > div img[data-count]").length > 0) {
        if(!$(".roll-mod-container").hasClass('show')){
          $(".roll-mod-container").addClass("show");
          $(".roll-mod-container").find('input').val(0);
        }
      } else {
        $(".roll-mod-container").removeClass("show");
      }
    }
  });

  if ($(".roll-button").length == 0) {
    const rollButton = $(`<button class="roll-button">Roll</button>`);
    const modInput = $(`<div class='roll-mod-container'>
        <button class="roll-button-mod minus">-</button>
        <input class="roll-input-mod" type='number' value='0' step='1'></input>
        <button class="roll-button-mod plus">+</button>
      </div>`)
    modInput.append(rollButton);

    
    $("body").append(modInput);

    modInput.off('click.button').on('click.button', 'button.roll-button-mod', function(e){
      e.preventDefault();
      const clickedButton = $(this)
      const input = modInput.find('input');
      if(clickedButton.hasClass('minus')){
        input.val(parseInt(input.val())-1);
      }
      else if(clickedButton.hasClass('plus')){
        input.val(parseInt(input.val())+1);
      }
    });
    rollButton.on("click", function (e) {
      let modValue = parseInt($('.roll-input-mod').val())
      if ($(".dice-toolbar").hasClass("rollable") && modValue == 0 && !window.EXPERIMENTAL_SETTINGS['rpgRoller']) {     
          let theirRollButton = $(".dice-toolbar__target").children().first();
          if (theirRollButton.length > 0) {
            // we found a DDB dice roll button. Click it and move on
            theirRollButton.click();
            return;
          }
      }

      const rollExpression = [];
      const diceToCount = $(".dice-roller > div img[data-count]").length>0 ? $(".dice-roller > div img[data-count]") : $('.dice-die-button__count')
      diceToCount.each(function() {
        let count, dieType;
        if($(this).is('.dice-die-button__count')){
          count = $(this).text();
          dieType = $(this).closest('[data-dice]').attr("data-dice");
        }
        else{
          count = $(this).attr("data-count");
          dieType = $(this).attr("alt");
        }
        rollExpression.push(count + dieType);
      });
      $('.dice-toolbar__dropdown-selected>div:first-of-type')?.click();
      let expression = `${rollExpression.join("+")}${modValue<0 ? modValue : `+${modValue}`}`
      let sendToDM = window.DM || false;
      let sentAsDDB = send_rpg_dice_to_ddb(expression, sendToDM);
      if (!sentAsDDB) {
        const roll = new rpgDiceRoller.DiceRoll(rollExpression.join("+"));
        
        const text = roll.output;
        const uuid = new Date().getTime();
        const data = {
          player: window.PLAYER_NAME,
          img: window.PLAYER_IMG,
          text: text,
          dmonly: sendToDM,
          id: window.DM ? `li_${uuid}` : undefined
        };
        window.MB.inject_chat(data);

        if (window.DM) { // THIS STOPPED WORKING SINCE INJECT_CHAT
          $("#" + uuid).on("click", () => {
            const newData = {...data, dmonly: false, id: undefined, text: text};
            window.MB.inject_chat(newData);
            $(this).remove();
          });
        }
            
      }

      $(".roll-mod-container").removeClass("show");
      $(".dice-roller > div img[data-count]").removeAttr("data-count");
      $(".dice-roller > div span").remove();
    });
  }

  if (window.chatObserver === undefined) {
    window.chatObserver = new ChatObserver();
  }
  window.chatObserver.observe($("#chat-text"));
  $(".GameLog_GameLog__2z_HZ").scroll(function() {
    if ($(this).scrollTop() >= 0) {
      $(this).removeClass("highlight-gamelog");
    }
  });

  // open, resize, then close the `Send To: (Default)` drop down. It won't resize unless it's open
  $("div.MuiPaper-root.MuiMenu-paper").click();
  setTimeout(function() {
    $("div.MuiPaper-root.MuiMenu-paper").css({
      "min-width": "200px"
    })
    $("div.MuiPaper-root.MuiMenu-paper").click();
  }, 0);
}
function find_currently_open_character_sheet() {
  if (is_characters_page()) {
    return window.location.pathname;
  }
  let sheet;
  $("#sheet").find("iframe").each(function () {
    const src = $(this).clone().attr("src");
    if (src != "") {
      sheet = src;
    }
  })
  return sheet;
}
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
function openDB() {
  
  let promises =[];
  promises.push(new Promise(async (resolve, reject) => {
      const DBOpenRequest = await indexedDB.open(`AboveVTT-${window.gameId}`, 2); // version 2
      DBOpenRequest.onsuccess = (e) => {       
        resolve(DBOpenRequest.result);
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
    })
  );
   
  promises.push(new Promise((resolve, reject) => {
      const DBOpenRequest2 = indexedDB.open(`AboveVTT-Global`, 5);
      DBOpenRequest2.onsuccess = (e) => {
        resolve(DBOpenRequest2.result);
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
          if (db.objectStoreNames?.contains('avttFilePicker')) {
            db.deleteObjectStore('avttFilePicker');
          }
      };
    })
  );
  return Promise.all(promises);
}
function deleteDB(){
  let d = confirm("DELETE ALL LOCAL EXPLORE DATA (CANNOT BE UNDONE)");
  if (d === true) {
    const objectStore = gameIndexedDb.transaction([`exploredData`], "readwrite").objectStore('exploredData');
    const objectStoreRequest = objectStore.clear();
    objectStoreRequest.onsuccess = function(event) {       
      $('#exploredCanvas').remove();
      redraw_light();
      alert('This campaigns local explored vision data has been cleared.')
    };
  }
}
function deleteCurrentExploredScene(){
  let d = confirm("DELETE CURRENT SCENE EXPLORE DATA (CANNOT BE UNDONE)");
  if (d === true) {
    deleteExploredScene(window.CURRENT_SCENE_DATA.id)

  }
}

function deleteExploredScene(sceneId){
    const deleteRequest = gameIndexedDb
     .transaction([`exploredData`], "readwrite")
     .objectStore('exploredData')
     .delete(`explore${window.gameId}${sceneId}`);
    deleteRequest.onsuccess = function(event) {  
      if(sceneId == window.CURRENT_SCENE_DATA.id){
        $('#exploredCanvas').remove();
        redraw_light();
        alert('Scene Explore Trail Data Cleared')
      }        
    };
}
function sanitize_aoe_shape(shape){
     // normalize shape
     switch(shape) {
        case "cube":
            shape = "square";
            break;
        case "sphere":
            shape = "circle";
            break;
        case "cylinder":
            shape = "circle";
    }
    return shape
}
function get_available_styles(){
    return [
        "Acid",
        "Bludgeoning",
        "Cold",
        "Darkness",
        "Default",
        "Fire",
        "Force",
        "Lightning",
        "Nature",
        "Necrotic",
        "Piercing",
        "Poison",
        "Psychic",
        "Radiant",
        "Slashing",
        "Thunder",
        "Water"
    ]
}
function add_aoe_to_statblock(html){

  html = html.replaceAll(/&shy;|­/gi, '')

  const aoeRegEx = /(([\d]+)-foot(-long ([\d]+)-foot-wide|-long, ([\d]+)-foot-wide|-radius, [\d]+-foot-high|-radius)? ([a-zA-z]+))(.*?[\>\s]([a-zA-Z]+) damage)?/gi


  return html.replaceAll(aoeRegEx, function(m, m1, m2,m3, m4, m5, m6, m7, m8){
    const shape = m6.toLowerCase();

    if(shape != 'cone' && shape != 'sphere' && shape != 'cube' && shape != 'cylinder' && shape != 'line')
      return `${m}`

    if(shape == 'emanation')
      return `${m}` // potentially set a button for aura being set on these if an aura doesn't already exist
    else
      return `<button class='avtt-aoe-button' border-width='1px' title='Place area of effect token' 
          data-shape='${shape}' 
          data-style='${m8 != undefined && get_available_styles().some(shape => shape.toLowerCase().includes(m8.toLowerCase())) ? m8.toLowerCase() : 'default'}' 
          data-size='${m2}' 
          data-name='${m6} AoE' 
          ${shape == 'line' ? `data-line-width=${m4 != undefined ? `'${m4}'` : m5 != undefined ? `'${m5}'` : '5'}` : ''}>
          ${m1}
        </button>
        ${m7 != undefined? m7 : ''}
      `
       
  })
}

function add_aoe_statblock_click(target, tokenId = undefined){
  target.find(`button.avtt-aoe-button`).off('click.aoe').on('click.aoe', function(e) {
    e.stopPropagation();
    const color = $(this).attr('data-style');
    const shape = $(this).attr('data-shape');
    const feet = $(this).attr('data-size');
    const name = $(this).attr('data-name');
    const lineWidth = $(this).attr('data-line-width');

    if(is_abovevtt_page() || window.self != window.top){
      window.top.hide_player_sheet();
      window.top.minimize_player_sheet();


      let options = window.top.build_aoe_token_options(color, shape, feet / window.top.CURRENT_SCENE_DATA.fpsq, name, lineWidth / window.top.CURRENT_SCENE_DATA.fpsq)
      if(name == 'Darkness' || name == 'Maddening Darkness' ){
        options = {
          ...options,
          darkness: true
        }
      }
      //if single token selected, place there:
      if(window.top.CURRENTLY_SELECTED_TOKENS.length == 1) {
        window.top.place_aoe_token_at_token(options, window.top.TOKEN_OBJECTS[window.top.CURRENTLY_SELECTED_TOKENS[0]]);
      } 
      else if (window.top.TOKEN_OBJECTS[tokenId] != undefined && !window.top.TOKEN_OBJECTS[tokenId].options.combatGroupToken){
        window.top.place_aoe_token_at_token(options, window.top.TOKEN_OBJECTS[tokenId]);
      }else {
        window.top.place_aoe_token_in_centre(options)
      }
    }
    else if(window.sendToTab != undefined){
      const data = {color: color, shape: shape, feet: feet, name: name, lineWidth: lineWidth, tokenId: tokenId}
      tabCommunicationChannel.postMessage({
        msgType: 'placeAoe',
        data: data,
        sendTo: window.sendToTab
      });
    }
  })
}
function create_update_token(options, save = true) {
  console.log("create_update_token");
  let self = this;
  let id = options.id;
  options.scaleCreated = window.CURRENT_SCENE_DATA.scale_factor;

  if (!(id in window.TOKEN_OBJECTS)) {
    window.TOKEN_OBJECTS[id] = new Token(options);

    window.TOKEN_OBJECTS[id].sync = mydebounce(function(options) {
      window.MB.sendMessage('custom/myVTT/token', options);
    }, 300);
  }

  if(options.repositionAoe != undefined){
    window.TOKEN_OBJECTS[id].place(0);
    let origin, dx, dy;   
    origin = getOrigin(window.TOKEN_OBJECTS[id]);
    dx = origin.x - options.repositionAoe.x;
    dy = origin.y - options.repositionAoe.y;        
    options.left = `${parseFloat(options.left) - dx}px`;
    options.top = `${parseFloat(options.top) - dy}px`;
    delete options.repositionAoe;
  }
  
  window.TOKEN_OBJECTS[id].place(0);
  window.TOKEN_OBJECTS[id].sync($.extend(true, {}, options));

}
function add_journal_roll_buttons(target, tokenId=undefined, specificImage=undefined, specificName=undefined){
  console.group("add_journal_roll_buttons")
  
  let pastedButtons = target.find('.avtt-roll-button, .integrated-dice__container, .avtt-aoe-button');

  for(let i=0; i<pastedButtons.length; i++){
    $(pastedButtons[i]).replaceWith($(pastedButtons[i]).text());
  }

  const rollImage = specificImage ? specificImage : (tokenId) ? window.all_token_objects[tokenId].options.imgsrc : window.PLAYER_IMG
  const rollName = specificName ? specificName : (tokenId) ? window.all_token_objects[tokenId].options.revealname == true || window.all_token_objects[tokenId].options.player_owned ? window.all_token_objects[tokenId].options.name : '' : window.PLAYER_NAME

  const clickHandler = function(clickEvent) {
    clickEvent.stopPropagation();
    roll_button_clicked(clickEvent, rollName, rollImage, tokenId ? "monster" : undefined, tokenId)
  };

  const rightClickHandler = function(contextmenuEvent) {
    contextmenuEvent.stopPropagation();
    roll_button_contextmenu_handler(contextmenuEvent, rollName, rollImage, tokenId ? "monster" : undefined, tokenId);
  }

  // replace all "to hit" and "damage" rolls

  let currentElement = $(target).clone()
  const dashToMinus = /([\s>])−(\d)/gi
  

  // apply most specific regex first matching all possible ways to write a dice notation
  // to account for all the nuances of DNDB dice notation.
  // numbers can be swapped for any number in the following comment
  // matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
  const strongRoll = /(<strong>)(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)(<\/strong>)/gi
  const damageRollRegexBracket = /(\()(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)(\))/gi
  const damageRollRegex = /([:\s>]|^)(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)([\.\):\s<,]|$)/gi
  // matches " +1 " or " + 1 "
  const hitRollRegexBracket = /(?<![0-9]+d[0-9]+)(\()([+-]\s?[0-9]+)(\))/gi
  const hitRollRegex = /(?<![0-9]+d[0-9]+)([:\s>]|^)([+-]\s?[0-9]+)([:\s<,]|$)/gi
  const dRollRegex = /([\s>]|^)(\s?d[0-9]+)([^+-])/gi
  const rechargeRegEx = /(Recharge [0-6]?\s?[—–-]?\s?[0-6])/gi
  const actionType = "roll"
  const rollType = "AboveVTT"
  let updated = currentElement.html()
    .replaceAll(strongRoll, `$2`)
    .replaceAll(dashToMinus, `$1-$2`)
    .replaceAll(damageRollRegexBracket, ` <button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'>$1$2$5</button>`)
    .replaceAll(damageRollRegex, ` $1<button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'>$2</button>$5`)
    .replaceAll(hitRollRegexBracket, ` <button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'>$1$2$3</button>`)
    .replaceAll(hitRollRegex, ` $1<button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'>$2</button>$3`)
    .replaceAll(dRollRegex, `$1<button data-exp='1$2' data-mod='' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'>$2</button>$3`)
    .replaceAll(rechargeRegEx, `<button data-exp='1d6' data-mod='' data-rolltype='recharge' data-actiontype='Recharge' class='avtt-roll-button' title='${actionType}'>$1</button>`)

  updated = add_aoe_to_statblock(updated);

  
  let ignoreFormatting = $(currentElement).find('.ignore-abovevtt-formating');

  let slashCommandElements = $(currentElement).find('.abovevtt-slash-command-journal')

  let $newHTML = $(`<div></div>`).html(updated);
    $newHTML.find('.ignore-abovevtt-formating').each(function(index){
      $(this).empty().append(ignoreFormatting[index].innerHTML);
    })

    $newHTML.find('.abovevtt-slash-command-journal').each(function(index){      
      const slashCommands = [...slashCommandElements[index].innerHTML.matchAll(multiDiceRollCommandRegex)];
      if (slashCommands.length === 0) return;
      console.debug("inject_dice_roll slashCommands", slashCommands);
      let updatedInnerHtml = slashCommandElements[index].innerHTML;
      try {
        slashCommands[0][0] = slashCommands[0][0].replace(/\(|\)/ig, '');
        const diceRoll = DiceRoll.fromSlashCommand(slashCommands[0][0], window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
        updatedInnerHtml = updatedInnerHtml.replace(updatedInnerHtml, `<button class='avtt-roll-formula-button integrated-dice__container' title="${diceRoll.action?.toUpperCase() ?? "CUSTOM"}: ${diceRoll.rollType?.toUpperCase() ?? "ROLL"}" data-slash-command="${slashCommands[0][0]}">${diceRoll.expression}</button>`);
      } catch (error) {
        console.warn("inject_dice_roll failed to parse slash command. Removing the command to avoid infinite loop", slashCommands, slashCommands[0][0]);
        updatedInnerHtml = updatedInnerHtml.replace(updatedInnerHtml, '');
      }
      $(this).empty().append(updatedInnerHtml);
    })

  
  
  


  $(target).html($newHTML[0].innerHTML);


  
  $(target).find('button.avtt-roll-button[data-rolltype]').each(function(){
    let rollAction = $(this).prevUntil('em>strong').find('strong').last().text().replace('.', '');
    rollAction = (rollAction == '') ? $(this).prev('strong').last().text().replace('.', '') : rollAction;
    rollAction = (rollAction == '') ? $(this).prevUntil('strong').last().prev().text().replace('.', '') : rollAction;
    rollAction = (rollAction == '') ? $(this).parent().prevUntil('em>strong').find('strong').last().text().replace('.', '') : rollAction;
    rollAction = (rollAction == '') ? $(this).closest('.mon-stat-block__attribute-value').prev().text().replace('.', '') : rollAction;
    rollAction = (rollAction == '') ? $(this).closest('.mon-stat-block__tidbit, [class*="styles_attribute"]').find('>.mon-stat-block__tidbit-label, >[class*="styles_attributeLabel"]').text().replace('.', '') : rollAction;
    let rollType = $(this).attr('data-rolltype')
    let newStatBlockTables = $(this).closest('table').find('tbody tr:first th').text().toLowerCase();
    if(newStatBlockTables.includes('str') || newStatBlockTables.includes('int')){
      rollAction =  $(this).closest('tr').find('th').text();
      rollType = $(this).closest('td').index() == 2 ? 'Check' : 'Save'
    }
    else if($(this).closest('table').find('tr:first').text().toLowerCase().includes('str')){
      let statIndex = $(this).closest('table').find('tr button').index($(this)); 
      let stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
      rollAction = stats[statIndex];
      rollType = 'Check'
    }
    else if($(this).closest('.ability-block__stat')?.find('.ability-block__heading').length>0){
      rollAction = $(this).closest('.ability-block__stat')?.find('.ability-block__heading').text();
      rollType = 'Check'
    }

    if(rollAction == ''){
      rollAction = 'Roll';
    } 
    else if(rollAction.replace(' ', '').toLowerCase() == 'savingthrows'){ 
      rollAction = $(this)[0].previousSibling?.nodeValue?.replace(/[\W]+/gi, '');
      rollAction = (rollAction == '') ? $(this).prev()?.text()?.replace(/[\W]+/gi, '') : rollAction;
      rollType = 'Save';  
    }
    else if(rollAction.replace(' ', '').toLowerCase() == 'skills'){
      rollAction = $(this)[0].previousSibling?.nodeValue?.replace(/[\W]+/gi, '');
      rollAction = (rollAction == '') ? $(this).prev()?.text()?.replace(/[\W]+/gi, '') : rollAction;
      rollType = 'Check'; 
    }
    else if(rollAction.replace(' ', '').toLowerCase() == 'proficiencybonus'){
      rollAction = 'Proficiency Bonus';
      rollType = 'Roll';  
    }
    else if(rollAction.replace(' ', '').toLowerCase() == 'hp' || rollAction.replace(' ', '').toLowerCase() == 'hitpoints'){
      rollAction = 'Hit Points';
      rollType = 'Roll';  
    }
    else if(rollAction.replace(' ', '').toLowerCase() == 'initiative'){
      rollType = 'Roll';
    }
    
    $(this).attr('data-actiontype', rollAction);
    $(this).attr('data-rolltype', rollType);

    const followingText = $(this)[0].nextSibling?.textContent?.trim()?.split(' ')[0]
    
    const damageType = followingText && window.ddbConfigJson?.damageTypes?.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined
    if(damageType != undefined){
      $(this).attr('data-damagetype', damageType);
    }
  })

  const tokenName = window.all_token_objects && window.all_token_objects[tokenId]?.options?.name ? window.all_token_objects[tokenId]?.options?.name  : window.PLAYER_NAME
  const tokenImage = window.all_token_objects && window.all_token_objects[tokenId]?.options?.imgsrc ? window.all_token_objects[tokenId]?.options?.imgsrc : window.PLAYER_IMG
  const entityType = tokenId ? "monster" : "character";

  // terminate the clones reference, overkill but rather be safe when it comes to memory
  currentElement = null;

  $(target).find(".avtt-roll-button").click(clickHandler);
  $(target).find(".avtt-roll-button").on("contextmenu", rightClickHandler);

  $(target).find("button.avtt-roll-formula-button").off('click.avttRoll').on('click.avttRoll', function(clickEvent) {
  clickEvent.stopPropagation();

    const slashCommand = $(clickEvent.currentTarget).attr("data-slash-command");
    const followingText = $(clickEvent.currentTarget)[0].nextSibling?.textContent?.trim()?.split(' ')[0]
    const damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined     
    const diceRoll = DiceRoll.fromSlashCommand(slashCommand, tokenName, tokenImage, entityType, tokenId, damageType); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
    window.diceRoller.roll(diceRoll, undefined, undefined, undefined, undefined, damageType);
  });
  $(target).find(`button.avtt-roll-formula-button`).off('contextmenu.rpg-roller').on('contextmenu.rpg-roller', function(e){
    e.stopPropagation();
    e.preventDefault();
    let rollData = {}
    if($(this).hasClass('avtt-roll-formula-button')){
       rollData = DiceRoll.fromSlashCommand($(this).attr('data-slash-command'))
       rollData.modifier = `${Math.sign(rollData.calculatedConstant) == 1 ? '+' : ''}${rollData.calculatedConstant}`
    }
    else{
       rollData = getRollData(this)
    }
    
    
    if (rollData.rollType === "damage") {
      damage_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, tokenName, tokenImage, entityType, tokenId, damageType)
        .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
    } else {
      standard_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, tokenName, tokenImage, entityType, tokenId)
        .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
    }
  })

  console.groupEnd()
}

function general_statblock_formating(input){
  input = input.replace(/&nbsp;/g,' ')

  input = input.replace(/^((\s+?)?<(strong|em)>(<(strong|em)>)?([a-z0-9\s\.\(\)]+)(<\/(strong|em)>)?<\/(strong|em)>)/gi, '$6');

  //bold top of statblock info
  input = input.replace(/^(Senses|Gear|Skills|Damage Resistances|Resistances|Immunities|Damage Immunities|Damage Vulnerabilities|Condition Immunities|Languages|Proficiency Bonus|Saving Throws)/gi, `<strong>$1</strong>`)
  input = input.replace(/^(Speed|Hit Points|HP|AC|Armor Class|Challenge|CR)([\s<][\d\()<])/gi, `<strong>$1</strong>$2`)
  // Remove space between letter ranges
  // e.g. a- b
  input = input.replace(/([a-z])- ([a-z])/gi, '$1$2');
  // Replace with right single quote
  input = input.replace(/'/g, '’');
  // e.g. Divine Touch. Melee Spell Attack:
  input = input.replace(
      /^(<span.+?>)?(([a-z0-9]+[\s]?){1,7})(\([^\)]+\))?(\.)([\s]+)?((Melee|Ranged|Melee or Ranged) (Weapon Attack:|Spell Attack:|Attack Roll:))?/gi,
        '$1<em><strong>$2$5</strong></em><em>$4$6$7</em>'
  ).replace(/[\s]+\./gi, '.');

  // Find actions requiring saving throws
  input = input.replace(
      /(?<!\])(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:/gi,
      '<em>$1 Saving Throw:</em>'
  );
  // Emphasize hit
  input = input.replace(/Hit:/g, '<em>Hit:</em>');
  // Emphasize hit or miss
  input = input.replace(/Hit or Miss:/g, '<em>Hit or Miss:</em>');
  // Emphasize trigger (2024 monsters)
  input = input.replace(/Trigger:/g, '<em>Trigger:</em>');
  // Emphasize response (2024 monsters)
  input = input.replace(/Response:/g, '<em>Response:</em>');
  // Emphasize failure/success (2024 monsters)
  input = input.replace(/Failure:/g, '<em>Failure:</em>');
  input = input.replace(/Success:/g, '<em>Success:</em>');
  input = input.replace(/Success or Failure:/g, '<em>Success or Failure:</em>');
  input = input.replace(/Failure or Success:/g, '<em>Failure or Success:</em>');

  return input;
        
}
function process_monitored_logs() {
  const logs = [...console.concerningLogs, ...console.otherLogs].sort((a, b) => a.timeStamp < b.timeStamp ? 1 : -1);
  let processedLogs = [];
  logs.forEach(log => {
    let messageString = `\n${log.type.toUpperCase()} ${log.timeStamp}`;
    // processedLogs.push(prefix);
    log.value.forEach((value, index) => {
      try {
        const logItem = log.value[index];
        let logString = '\n';
        if (typeof logItem === "object") {
          logString += `      ${JSON.stringify(logItem)}`;
        } else {
          logString += `      ${logItem}`;
        }
        messageString += logString.replaceAll(MYCOBALT_TOKEN, '[REDACTED]').replaceAll(window.CAMPAIGN_SECRET, '[REDACTED]');
      } catch (err) {
        console.debug("failed to process log value", err);
      }
    })
    processedLogs.push(messageString);
  });
  return processedLogs.join('\n');
}
function inject_dice(){

  const initialSetupTime = Date.now();


  $('body .container').append(`
        <div id="encounter-builder-root" data-config="{&quot;assetBasePath&quot;:&quot;https://media.dndbeyond.com/encounter-builder&quot;,&quot;authUrl&quot;:&quot;https://auth-service.dndbeyond.com/v1/cobalt-token&quot;,&quot;campaignDetailsPageBaseUrl&quot;:&quot;https://www.dndbeyond.com/campaigns&quot;,&quot;campaignServiceUrlBase&quot;:&quot;https://www.dndbeyond.com/api/campaign&quot;,&quot;characterServiceUrlBase&quot;:&quot;https://character-service-scds.dndbeyond.com/v2/characters&quot;,&quot;diceApi&quot;:&quot;https://dice-service.dndbeyond.com&quot;,&quot;gameLogBaseUrl&quot;:&quot;https://www.dndbeyond.com&quot;,&quot;ddbApiUrl&quot;:&quot;https://api.dndbeyond.com&quot;,&quot;ddbBaseUrl&quot;:&quot;https://www.dndbeyond.com&quot;,&quot;ddbConfigUrl&quot;:&quot;https://www.dndbeyond.com/api/config/json&quot;,&quot;debug&quot;:false,&quot;encounterServiceUrl&quot;:&quot;https://encounter-service.dndbeyond.com/v1&quot;,&quot;featureFlagsDomain&quot;:&quot;https://api.dndbeyond.com&quot;,&quot;mediaBucket&quot;:&quot;https://media.dndbeyond.com&quot;,&quot;monsterServiceUrl&quot;:&quot;https://monster-service.dndbeyond.com/v1/Monster&quot;,&quot;sourceUrlBase&quot;:&quot;https://www.dndbeyond.com/sources/&quot;,&quot;subscriptionUrl&quot;:&quot;https://www.dndbeyond.com/subscribe&quot;,&quot;toastAutoDeleteInterval&quot;:3000000}" >
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

        <style>

          .dice-rolling-panel,.dice-rolling-panel__container {
              width: 100%;
              height: 100%;
              position: fixed;
              top: 0;
              pointer-events: none;
              left: 0;
          }

          .dice-rolling-panel .dice-toolbar {
              position: fixed;
              z-index: 1;
              bottom: 10px;
              left: 10px;
              pointer-events: all
          }
        </style>

  `);
 window.encounterObserver = new MutationObserver(function(mutationList, observer) {

  mutationList.forEach(mutation => {
     try {
       let mutationTarget = $(mutation.target);
       
       if(mutationTarget.hasClass(['encounter-details', 'encounter-builder', 'release-indicator'])){
         mutationTarget.remove();

       }
       if($(mutation.addedNodes).is('.encounter-builder, .release-indicator')){
         $(mutation.addedNodes).remove();
       }
     } catch{
       console.warn("non_sheet_observer failed to parse mutation", error, mutation);
     }
   });
 })

 
 const mutation_target = $('#encounter-builder-root')[0];
 //observers changes to body direct children being removed/added
 const mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };
 window.encounterObserver.observe(mutation_target, mutation_config);

 setTimeout(function(){
   window.encounterObserver.disconnect();
   delete window.encounterObserver;
 }, 20000);
 
}
/**
 * Creates a transparent context background that can be clicked to close items
 * @param {String[]} closeItemTargets - An array of jQuery selectors for items to close when the background is clicked
 * @param {function} callback - A callback function to execute after the items are closed
 * @returns 
 */
function create_context_background(closeItemTargets = [], callback = function(){}) {
  
  const removeItems = function(e, eventElement) {
    e.stopPropagation();
    e.preventDefault();
    const selectors = closeItemTargets.join(',');
    $(selectors).remove();
    $(eventElement).remove();
    callback();
  }
  const contextBackground = $('<div id="tokenOptionsClickCloseDiv" class="avtt-context-background"></div>');
  contextBackground.on('click', function(e){
    removeItems(e, this);
  });
  contextBackground.on('contextmenu', function(e){
    removeItems(e, this);
  })
  $('body').append(contextBackground);
  return contextBackground;
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

/** @return {boolean} true if the current page url includes "/characters/[number]/builder"  */
function is_characters_builder_page() {
  return window.location.pathname.match(/\/characters\/[0-9]+\/builder/)?.[0] !== undefined;
}


/** @return {boolean} true if the current page url includes "/campaigns/"  */
function is_campaign_page() {
  return window.location.pathname.includes("/campaigns/") && !window.location.search.includes("dm=true");
}

/** @return {boolean} true if the current page url includes "/campaigns/"  */
function is_spectator_page() {
  return window.location.search.includes("spectator=true");
}

/** @return {boolean} true if the current page url includes "/encounters/"  */
function is_encounters_page() {
  return window.location.search.includes("dm=true");
}

/** @return {boolean} true if the url has abovevtt=true, and is one of the pages that we allow the app to run on */
function is_abovevtt_page() {
  // we only run the app on the enounters page (DM), and the characters page (players)
  // we also only run the app if abovevtt=true is in the query params
  return window.location.search.includes("abovevtt=true") && (is_encounters_page() || is_characters_page() || is_spectator_page());
}

/** @return {boolean} true if the current page url includes "/campaigns/" and the query contains "popoutgamelog=true" */
function is_gamelog_popout() {
  return is_campaign_page() && window.location.search.includes("popoutgamelog=true");
}
var MYCOBALT_TOKEN = false;
var MYCOBALT_TOKEN_EXPIRATION = 0;
/**
 * UNIFIED TOKEN HANDLING
 * Triggers callback with a valid DDB cobalt token
 * @param {Function} callback
 * @returns void
 */
function get_cobalt_token(callback) {
  if (Date.now() < MYCOBALT_TOKEN_EXPIRATION) {
    console.log("TOKEN IS CACHED");
    callback(MYCOBALT_TOKEN);
    return;
  }
  console.log("GETTING NEW TOKEN");
  $.ajax({
    url: "https://auth-service.dndbeyond.com/v1/cobalt-token",
    type: "post",
    xhrFields: {
      // To allow cross domain cookies
      withCredentials: true
    },
    success: function(data) {
      console.log("GOT NEW TOKEN");
      MYCOBALT_TOKEN = data.token;
      MYCOBALT_TOKEN_EXPIRATION = Date.now() + (data.ttl * 1000) - 10000;
      callback(data.token);
    }
  });
}
function removeError() {
  $("#above-vtt-error-message").remove();
  remove_loading_overlay(); // in case there was an error starting up, remove the loading overlay, so they're not completely stuck
  delete window.logSnapshot;
}

function createCustomOnedriveChooser(text, callback = function(){}, selectionMode = 'single', selectionType = ['photo', 'video', '.webp']){
  let button = $(`<button class="launchPicker"><span class='onedrive-btn-status'></span>${text}</button>`);
  button.off('click.onedrive').on('click.onedrive', function(e){
    e.stopPropagation();
    launchPicker(e, callback, selectionMode, selectionType);
  })
  return button;
}

function createCustomAvttChooser(text, callback = function () { }, selectionType = []) {
  let button = $(`<button class="avttPicker"><span class='avtt-btn-status'></span>${text}</button>`);
  button.off('click.avtt').on('click.avtt', function (e) {
    e.stopPropagation();
    launchFilePicker(callback, selectionType);
  })
  return button;
}
function createCustomDropboxChooser(text, options){
  let button = $(`<button class="dropboxChooser"><span class="dropin-btn-status"></span>${text}</button>`)
  button.off('click.dropbox').on('click.dropbox', function(e){
    e.stopPropagation();
    Dropbox.choose(options)
  })
  return button;
}

function dropBoxOptions(callback, multiselect = false, fileType=['images', 'video']){

  let options = {
     // Required. Called when a user selects an item in the Chooser.
      success: function(files) {
        for(let i = 0; i<files.length; i++){
          files[i].name = files[i].name.replace(/\.[0-9a-zA-Z]*$/g, '')
        }
        callback(files)
          //alert("Here's the file link: " + files[0].link)
      },

      // Optional. Called when the user closes the dialog without selecting a file
      // and does not include any parameters.
      cancel: function() {

      },

      // Optional. "preview" (default) is a preview link to the document for sharing,
      // "direct" is an expiring link to download the contents of the file. For more
      // information about link types, see Link types below.
      linkType: "preview", // or "direct"

      // Optional. A value of false (default) limits selection to a single file, while
      // true enables multiple file selection.
      multiselect: multiselect, // or true

      // Optional. This is a list of file extensions. If specified, the user will
      // only be able to select files with these extensions. You may also specify
      // file types, such as "video" or "images" in the list. For more information,
      // see File types below. By default, all extensions are allowed.
      extensions: fileType,

      // Optional. A value of false (default) limits selection to files,
      // while true allows the user to select both folders and files.
      // You cannot specify `linkType: "direct"` when using `folderselect: true`.
      folderselect: false, // or true
  }

  return options
}
/** Displays an error to the user. Only use this if you don't want to look for matching github issues
 * @see showError
 * @param {Error} error an error object to be parsed and displayed
 * @param {string|*[]} extraInfo other relevant information */
function showErrorMessage(error, ...extraInfo) {
  removeError();
  window.logSnapshot = process_monitored_logs(false);

  console.log("showErrorMessage", ...extraInfo, error.stack);
  if (!(error instanceof Error)) {
    if (typeof error === "object") {
      error = JSON.stringify(error);
    } 
    error = new Error(error?.toString());
  }
  const stack = error.stack || new Error().stack;
  if(stack.includes('Internal Server Error') && stack.includes('AboveApi.getScene')){
    if(!window.DM){
      extraInfo.push('<br/><b>The last scene players were on may have been deleted by the DM. Ask the DM to click the player button beside an existing scene. Even if one is already highlighted click it again to update the server info.</b>')
    }
    else{
      extraInfo.push('<br/><b>The scene you are trying to load does not exist. You may have deleted it - try setting the DM scene to an existing map.</b>')
    }
    
  }
  
  const extraStrings = extraInfo.map(ei => {
    if (typeof ei === "object") {
      if(JSON.stringify(ei).length>300)
        return JSON.stringify(ei).substr(0, 300) + "...";
      else
        return JSON.stringify(ei)
    } else {
      if(ei?.toString().length>300)
        return ei?.toString().substr(0, 300) + "...";
      else
        return ei?.toString()
    }
  }).join('<br />');
  if(typeof error.message == 'object'){
    error.message = JSON.strigify(error.message);
  }
  let container = $("#above-vtt-error-message");
  if(error.message.length > 300)
    error.message = error.message.substr(0, 300) + "...";
  if ($('#error-message-stack').length == 0) {
    $("#above-vtt-error-message").remove();
    const container = $(`
      <div id="above-vtt-error-message">
        <h2>An unexpected error occurred!</h2>
        <h3 id="error-message">${error.message}</h3>
        <div id="error-message-details">${extraStrings}</div>
        <pre id="error-message-stack" style='max-height: 200px;'>${error.message}<br/>${extraStrings}</pre>
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

function showDiceDisabledWarning(){
  window.diceWarning = 1;
  let container = $("#above-vtt-error-message");
  container.remove();
  container = $(`
      <div id="above-vtt-error-message" class="small-error">
        <h2>DDB dice roller not detected</h2>
        <div id="error-message-details">Dice must be enabled on the character sheet for AboveVTT to function properly.</div>
        <div class="error-message-buttons">
          <button id="close-error-button">Close</button>
        </div>
      </div>
    `)
  
  $(document.body).append(container);

  $("#close-error-button").on("click", removeError);
}

function showGoogleDriveWarning(){
  let container = $("#above-vtt-error-message");
  container.remove();
  container = $(`
      <div id="above-vtt-error-message">
        <h2>Google Drive Issue</h2>
        <h3 id="error-message">Google has made changes</h3>
        <div id="error-message-details"><p> If you moved/updated/reuploaded the file you may need a new link. It's possible the link is not shared publicly. If it does not come from 'share->copy link' on the site or the url does not have 'id=' in it it may be a link format we do not currently support. Feel free to reach out to us on discord if you find a different format.</p><p>Otherwise Google has made some changes to google drive links that may cause maps and other images/audio/video to no longer load. </p><p>They no longer support (it was never officially supported) google drive as a public host.</p> <p>We suggesting moving to other hosts such as dropbox, onedrive, imgur, or your prefered hosting solution.</p><p> For more information or help with other hosting options see our discord: <a href='https://discord.com/channels/815028457851191326/823177610149756958/1201995534038990909'>Google Drive Issue</a></p></div>
        <div class="error-message-buttons">
          <button id="close-error-button">Close</button>
        </div>
      </div>
    `)
  
  $(document.body).append(container);

  $("#close-error-button").on("click", removeError);
}

/** Displays an error to the user, and looks for matching github issues
 * @param {Error} error an error object to be parsed and displayed
 * @param {string|*[]} extraInfo other relevant information */
function showError(error, ...extraInfo) {
  if (!(error instanceof Error)) {
    if (typeof error === "object") {
      error = JSON.stringify(error);
    } 
    error = new Error(error?.toString());
  }
  $('#loadingStyles').remove(); 
  showErrorMessage(error, ...extraInfo);

  $("#above-vtt-error-message .error-message-buttons").append(`<div style="float: right;top:-22px;position:relative;">Use this button to share logs with developers!<span class="material-symbols-outlined" style="color:red;font-size: 40px;top: 14px;position: relative;">line_end_arrow_notch</span></div>`);

  look_for_github_issue(error.message, ...extraInfo)
    .then((issues) => {
      add_issues_to_error_message(issues, error.message);
    })
    .catch(githubError => {
      console.log("look_for_github_issue", "Failed to look for github issues", githubError);
    });
  remove_loading_overlay();
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
    $("#error-github-issue").append(`<div style="margin-top:20px;">Creating a Github Issue <i>(account required)</i> is very helpful. It gives the developers all the details they need to fix the bug. Alternatively, you can use the copy "Copy Error Message" button and then paste it on the AboveVTT <a style="font-weight:bold;text-decoration: underline;" target="_blank" href="https://discord.gg/cMkYKqGzRh">Discord Server</a>. Watch threads in discord channel #bugs-n-screenshots for known issues, it may also be addressed in #support.</div>`);
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

function showTempMessage(messageString){
  $('.abovevttTempMessage').remove();
  let messageBox = $(`<div class='abovevttTempMessage'>${messageString}</div>`);
  $('body').append(messageBox);
  setTimeout(function(){
    messageBox.fadeOut(1000, function() { $(this).remove(); });
  }, 1000);

}
/** The string "THE DM" has been used in a lot of places.
 * This prevents typos or case sensitivity in strings.
 * @return {String} "THE DM" */
const dm_id = "THE DM";
// Use Acererak as the avatar, because he's on the DMG cover... but also because he's the fucking boss!
var dmAvatarUrl = "https://www.dndbeyond.com/avatars/thumbnails/30/787/140/140/636395106768471129.jpeg";
const defaultAvatarUrl = "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/characters/default-avatar.png";

/** an object that mimics window.pcs, but specific to the DM */
function generic_pc_object(isDM) {
  let pc = {
    decorations: {
      backdrop: { // barbarian because :shrug:
        largeBackdropAvatarUrl: "https://www.dndbeyond.com/avatars/61/473/636453122224164304.jpeg",
        smallBackdropAvatarUrl: "https://www.dndbeyond.com/avatars/61/472/636453122223383028.jpeg",
        backdropAvatarUrl: "https://www.dndbeyond.com/avatars/61/471/636453122222914252.jpeg",
        thumbnailBackdropAvatarUrl: "https://www.dndbeyond.com/avatars/61/474/636453122224476777.jpeg"
      },
      characterTheme: {
        name: "DDB Red",
        isDarkMode: false,
        isDefault: true,
        backgroundColor: "#FEFEFE",
        themeColor: "#C53131"
      },
      avatar: {
        avatarUrl: defaultAvatarUrl,
        frameUrl: null
      }
    },
    id: 0,
    image: defaultAvatarUrl,
    isAssignedToPlayer: false,
    name: "Unknown Character",
    sheet: "",
    userId: 0,
    passivePerception: 8,
    passiveInvestigation: 8,
    passiveInsight: 8,
    armorClass: 8,
    abilities: [
      {name: "str", save: 0, score: 10, label: "Strength", modifier: 0},
      {name: "dex", save: 0, score: 10, label: "Dexterity", modifier: 0},
      {name: "con", save: 0, score: 10, label: "Constitution", modifier: 0},
      {name: "int", save: 0, score: 10, label: "Intelligence", modifier: 0},
      {name: "wis", save: 0, score: 10, label: "Wisdom", modifier: 0},
      {name: "cha", save: 0, score: 10, label: "Charisma", modifier: 0}
    ],
    proficiencyGroups: [
      {group: 'Languages', values: ''}
    ]
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

function hp_from_pc_object(pc) {
  let hpValue = 0;
  if (!isNaN((pc?.hitPointInfo?.current))) {
    hpValue += parseInt(pc.hitPointInfo.current);
  }
  if (!isNaN((pc?.hitPointInfo?.temp))) {
    hpValue += parseInt(pc.hitPointInfo.temp);
  }
  return hpValue;
}
function max_hp_from_pc_object(pc) {
  if (!isNaN((pc?.hitPointInfo?.maximum))) {
    return parseInt(pc.hitPointInfo.maximum);
  }
  return 1; // this is wrong, but we want to avoid any NaN results from division
}
function hp_aura_color_from_pc_object(pc) {
  const hpValue = hp_from_pc_object(pc);
  const maxHp = max_hp_from_pc_object(pc);
  return token_health_aura(Math.round((hpValue / maxHp) * 100));
}
function hp_aura_box_shadow_from_pc_object(pc) {
  const auraValue = hp_aura_color_from_pc_object(pc);
  return `${auraValue} 0px 0px 11px 3px`;
}
function speed_from_pc_object(pc, speedName = "Walking") {
  return pc?.speeds?.find(s => s.name === speedName)?.distance || 0;
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
 * @param {boolean} useDefault whether to return a generic default object if the pc object is not found
 * @return {object} The window.pcs object that matches the idOrSheet */
function find_pc_by_player_id(idOrSheet, useDefault = true) {
  if (idOrSheet === dm_id) {
    return generic_pc_object(true);
  }
  if (!window.pcs) {
    if(is_abovevtt_page())
      console.error("window.pcs is undefined");
    return useDefault ? generic_pc_object(false) : undefined;
  }
  const regexStr = `characters/${idOrSheet}$`;
  const regex = new RegExp(regexStr, 'gi');
  const pc = window.pcs.find(pc => pc.sheet.match(regex) || pc.sheet == idOrSheet);
  if (pc) {
    return pc;
  }
  if (useDefault) {
    return generic_pc_object(false);
  }
  return undefined;
}

async function rebuild_window_pcs() {
  const campaignCharacters = await DDBApi.fetchCampaignCharacterDetails(window.gameId);
  window.pcs = campaignCharacters.map(characterData => {
    // we are not making a shortcut for `color` because the logic is too complex. See color_from_pc_object for details
    return {
      ...characterData,
      image: characterData.decorations?.avatar?.avatarUrl || characterData.avatarUrl || defaultAvatarUrl,
      sheet: `/profile/${characterData.userId}/characters/${characterData.characterId}`,
      lastSynchronized: Date.now()
    };
  });
}

/**
 * Returns known languages of player's PC
 * @returns {string[]}
 */
function get_my_known_languages() {
  const pc = find_pc_by_player_id(my_player_id())
  const knownLanguages = pc?.proficiencyGroups.find(g => g.group === "Languages")?.values?.trim().split(/\s*,\s*/gi) ?? [];
  knownLanguages?.push('Telepathy');
  return knownLanguages;
}


function update_pc_with_data(playerId, data) {
  if (data.constructor !== Object) {
    console.warn("update_pc_with_data was given invalid data", playerId, data);
    return;
  }
  const index = window.pcs.findIndex(pc => pc.sheet.includes(playerId));
  if (index < 0) {
    console.warn("update_pc_with_data could not find pc with id", playerId);
    return;
  }
  console.debug(`update_pc_with_data is updating ${playerId} with`, data);
  const pc = window.pcs[index];
  window.pcs[index] = {
    ...pc,
    ...data,
    lastSynchronized: Date.now()
  }
 
  if (!window.PC_TOKENS_NEEDING_UPDATES.includes(playerId)) {
    window.PC_TOKENS_NEEDING_UPDATES.push(playerId);
  }
  debounce_pc_token_update();
}


const debounce_pc_token_update = mydebounce(() => {  
  const unusedPlayerData = ['image', 'attacks', 'attunedItems', 'campaign', 'campaignSetting', 'castingInfo', 'classes', 'deathSaveInfo', 'decorations', 'extras', 'immunities', 'level', 'passiveInsight', 'passiveInvestigation', 'passivePerception', 'proficiencyBonus', 'proficiencyGroups', 'race', 'readOnlyUrl', 'resistances', 'senses', 'skills', 'speeds', 'vulnerabilities'];
      
  window.PC_TOKENS_NEEDING_UPDATES.forEach((playerId) => {
    const pc = find_pc_by_player_id(playerId, false);
    let token = window.TOKEN_OBJECTS[pc?.sheet];     

    let crossSceneToken = window.all_token_objects[pc?.sheet] //for the combat tracker and cross scene syncing/tokens - we want to update this even if the token isn't on the current map
   
    if (crossSceneToken && pc) {
      let currentImage = crossSceneToken.options.imgsrc;
      if (currentImage != undefined) {
        const newImage = (crossSceneToken.options.alternativeImages == undefined || crossSceneToken.options.alternativeImages?.length == 0) ? pc.image : currentImage;
        const options = $.extend(true, token.options, pc, { imgsrc: newImage });
        for (let i = 0; i < unusedPlayerData.length; i++) {
          delete options[unusedPlayerData[i]];
        }
        crossSceneToken.options = $.extend(true, {}, options);
        if(token){
          token.hp = pc.hitPointInfo.current; // triggers concentration checks
          token.options.hitPointInfo = pc.hitPointInfo;
          token.options = options;
          if (window.DM) {
            token.place_sync_persist(); // update it on the server
          }
          else {
            token.place(); // update token for players even if dm isn't connected to websocket
          }
        }
      }
    }   
  });
  if (window.DM) {
    update_pc_token_rows();
  }
  window.PC_TOKENS_NEEDING_UPDATES = [];
  
},50);

function update_pc_with_api_call(playerId) {
  if (!playerId) {
    console.log('update_pc_with_api_call was called without a playerId');
    return;
  }
  if (window.PC_TOKENS_NEEDING_UPDATES.includes(playerId)) {
    console.log(`update_pc_with_api_call isn't adding ${playerId} because we're already waiting for debounce_pc_token_update to handle it`);
  } else if (Object.keys(window.PC_NEEDS_API_CALL).includes(playerId)) {
    console.log(`update_pc_with_api_call is already waiting planning to call the API to fetch ${playerId}. Nothing to do right now.`);
  } else {
    const pc = find_pc_by_player_id(playerId, false);
    const twoSecondsAgo = new Date(Date.now() - 2000).getTime();
    if (pc && pc.lastSynchronized && pc.lastSynchronized > twoSecondsAgo) {
      console.log(`update_pc_with_api_call is not adding ${playerId} to window.PC_NEEDS_API_CALL because it has been updated within the last 2 seconds`);
    } else {
      console.log(`update_pc_with_api_call is adding ${playerId} to window.PC_NEEDS_API_CALL`);
      window.PC_NEEDS_API_CALL[playerId] = Date.now();
    }
  }
  if(Object.keys(window.PC_NEEDS_API_CALL).length > 0)
    debounce_fetch_character_from_api();
}

const debounce_fetch_character_from_api = mydebounce(() => {
  const idsAndDates = { ...window.PC_NEEDS_API_CALL }; // make a copy so we can refer to it later
  window.PC_NEEDS_API_CALL = {}; // clear it out in case we get new updates while the API call is active
  const characterIds = Object.keys(idsAndDates);
  console.log('debounce_fetch_character_from_api is about to call DDBApi before update_pc_with_data for ', characterIds);
  DDBApi.fetchCharacterDetails(characterIds).then((characterDataCollection) => {
    characterDataCollection.forEach((characterData) => {
      // check if we've synchronized this player data while the API call was active because we don't want to update the PC with stale data
      const lastSynchronized = find_pc_by_player_id(characterData.characterId, false)?.lastSynchronized;
      if (!lastSynchronized || lastSynchronized < idsAndDates[characterData.characterId]) {
        console.log('debounce_fetch_character_from_api is about to call update_pc_with_data with', characterData.characterId, characterData);
        update_pc_with_data(characterData.characterId, characterData);
      } else {
        console.log(`debounce_fetch_character_from_api is not calling update_pc_with_data for ${characterData.characterId} because ${lastSynchronized} < ${idsAndDates[characterData.characterId]}`);
      }
    });
  });
}, 5000); // wait 5 seconds before making API calls. We don't want to make these calls unless we absolutely have to

async function harvest_game_id() {
  if (is_campaign_page()) {
    const fromPath = window.location.pathname.split("/").pop();
    console.log("harvest_game_id found gameId in the url:", fromPath);
    return fromPath;
  }

  if (is_encounters_page()) {
    return window.location.pathname.split("/").pop();;
  }

  if (is_characters_page()) {
   
    
    const fromLink = $("[href^='/games/']").attr("href")?.split("/")?.pop();
    if (typeof fromLink === "string" && fromLink.length > 1) {
      return fromLink;
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

function projector_scroll_event(event){
      event.stopImmediatePropagation();
      if($('#projector_toggle.enabled > [class*="is-active"]').length>0){
            let sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
            let center = center_of_view(); 


            let zoom = $('#projector_zoom_lock.enabled > [class*="is-active"]').length>0 ? false : window.ZOOM

            tabCommunicationChannel.postMessage({
              msgType: 'projectionScroll',
              x: window.pageXOffset + window.innerWidth/2 - sidebarSize/2,
              y: window.pageYOffset + window.innerHeight/2,
              sceneId: window.CURRENT_SCENE_DATA.id,
              innerHeight: window.innerHeight,
              scrollPercentageY: (window.pageYOffset + window.innerHeight/2) / Math.max( document.body.scrollHeight, document.body.offsetHeight, 
                   document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ),
              scrollPercentageX:  (window.pageXOffset + window.innerWidth/2 - sidebarSize/2) / Math.max( document.body.scrollWidth, document.body.offsetWidth, 
                   document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth ),
              zoom: zoom,
              mapPos: convert_point_from_view_to_map(center.x, center.y, true, true)
            });
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

async function normalize_scene_urls(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return [];
  }

  let scenesArray = await Promise.all(
    scenes.map(async (sceneData) => {
      if (sceneData?.itemType === ItemType.Folder) {
        return sceneData;
      }
      return Object.assign(sceneData, {
        dm_map: await parse_img(sceneData.dm_map),
        player_map: await parse_img(sceneData.player_map),
      });
    }),
  );

  return scenesArray;
}
async function getAvttStorageUrl(url, highPriority = false){
  return await getFileFromS3(url.replace('above-bucket-not-a-url/', ''), highPriority);
}
async function updateImgSrc(url, container, video, highPriority = true, callback = () =>{}){
  if(video == true && url?.includes('onedrive')){
    container.attr('src', url.replace('embed?', 'download?'));
  }
  else if(url.includes("https://1drv.ms/"))
  {
    if(url.split('/')[4].length == 1){
      url = url;
    }
    else{
      url = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
    }
    container.attr('src', url);

  }
  else if(url?.includes('google')){
    throttleImgSrc(() => {
      container.attr('src', parse_img(url));
    })
  }
  else if(url.startsWith('above-bucket-not-a-url'))
  {
    url = await getAvttStorageUrl(url, highPriority)
    container.attr('src', url);
    callback();
  }
  else{
    url = parse_img(url);
    container.attr('src', url);
  }
}
async function updateTokenSrc(url, container, video=false){
  url = await parse_img(url)
  if(video == true && url?.includes('onedrive')){
    container.attr('src', url.replace('embed?', 'download?'));
    container.css('background', `url(${url.replace('embed?', 'download?')})`)
  }
  else if(url.includes("https://1drv.ms/"))
  {
    if(url.split('/')[4].length == 1){
      url = url;
    }
    else{
      url = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
    }
    container.attr('src', url);
    container.css('background', `url(${url})`)
  }
  else if(url.startsWith('above-bucket-not-a-url')){
    url = await getAvttStorageUrl(url, true);
    container.attr('src', url);
    container.css('background', `url(${url})`)
  }
  else{
    url = parse_img(url);
    container.attr('src', url);
    container.css('background', `url(${url})`)
  }
}

const throttleGoogleApi = throttledQueue('throttleGoogleApi', 1, 5000); // map throttle
const throttleImgSrc = throttledQueue('throttleImgSrc', 100, 1000);// listing throttle 
const throttleTokenSrc = throttledQueue('throttleTokenSrc', 10, 1000);// token throttle 
const throttleAudioSrc = throttledQueue('throttleAudioSrc', 1, 1000);// audio throttle 

function throttledQueue(
  timeoutName,
  maxRequestsPerInterval,
  interval,
  evenlySpaced = false
) {
  /**
   * If all requests should be evenly spaced, adjust to suit.
   */
  if (evenlySpaced) {
    interval = interval / maxRequestsPerInterval
    maxRequestsPerInterval = 1
  }
  
  if(!window.ThrottleQueueTimeout){
    window.ThrottleQueueTimeout = {};

  }
  if(!window.ThrottleQueueTimeout[timeoutName]){
    window.ThrottleQueueTimeout[timeoutName]={};
  }
  
  window.ThrottleQueueTimeout[timeoutName].queue = [];
  window.ThrottleQueueTimeout[timeoutName].lastIntervalStart = 0
  window.ThrottleQueueTimeout[timeoutName].numRequestsPerInterval = 0
  
  /**
   * Gets called at a set interval to remove items from the queue.
   * This is a self-adjusting timer, since the browser's setTimeout is highly inaccurate.
   */
  const dequeue = () => {
    const intervalEnd = window.ThrottleQueueTimeout[timeoutName].lastIntervalStart + interval
    const now = Date.now()
    /**
     * Adjust the timer if it was called too early.
     */
    if (now < intervalEnd) {
      
      if(window.ThrottleQueueTimeout[timeoutName].timeout !== undefined){
        clearTimeout(window.ThrottleQueueTimeout[timeoutName].timeout)
      }
      window.ThrottleQueueTimeout[timeoutName].timeout = setTimeout(dequeue, intervalEnd - now)
      return
    }
    window.ThrottleQueueTimeout[timeoutName].lastIntervalStart = now
    window.ThrottleQueueTimeout[timeoutName].numRequestsPerInterval = 0
    for (const callback of window.ThrottleQueueTimeout[timeoutName].queue.splice(0, maxRequestsPerInterval)) {
      void callback()
    }
    if (window.ThrottleQueueTimeout[timeoutName].queue.length) {
      window.ThrottleQueueTimeout[timeoutName].timeout = setTimeout(dequeue, interval)
    } else {
      window.ThrottleQueueTimeout[timeoutName].timeout = undefined
    }
  }

  return fn =>
    new Promise((resolve, reject) => {
      const callback = () =>
        Promise.resolve()
          .then(fn)
          .then(resolve)
          .catch(reject)
      const now = Date.now()
      if (window.ThrottleQueueTimeout[timeoutName].timeout === undefined && now - window.ThrottleQueueTimeout[timeoutName].lastIntervalStart > interval) {
        window.ThrottleQueueTimeout[timeoutName].lastIntervalStart = now   
      }
      if (window.ThrottleQueueTimeout[timeoutName].numRequestsPerInterval < maxRequestsPerInterval) {
        window.ThrottleQueueTimeout[timeoutName].numRequestsPerInterval++;
        void callback()
      } else {
        window.ThrottleQueueTimeout[timeoutName].queue.push(callback)
        if (window.ThrottleQueueTimeout[timeoutName].timeout === undefined) {
          window.ThrottleQueueTimeout[timeoutName].timeout = setTimeout(dequeue, window.ThrottleQueueTimeout[timeoutName].lastIntervalStart + interval - now)
        }
      }
    })
}

async function look_for_github_issue(...searchTerms) {
  // fetch issues that have been marked as bugs
  if (!window.githubBugs) {
    window.githubBugs = []; // don't fetch the same list every single time or we could get rate-limited when things go really bad
    const request = await fetch("https://api.github.com/repos/cyruzzo/AboveVTT/issues?per_page=100&state=all", { credentials: "omit" });
    window.githubBugs = await request.json();
  }

  const searchTermStrings = searchTerms.map(ei => {
    if (typeof ei === "object") {
      return JSON.stringify(ei);
    } else {
      return ei?.toString();
    }
  });

  // remove any that have been marked as potential-duplicate
  const filteredIssues = window.githubBugs.filter(issue => !issue.labels.find(l => l.name === "potential-duplicate" || l.name === "released")).reverse();

  // instantiate fuse to fuzzy match parts of the github issues that we just downloaded
  const fuse = new Fuse(filteredIssues, {
    threshold: 0.4,         // we want the matches to be a little closer. Default is 0.6, and the lower the threshold the smaller the variance that's allowed
    includeScore: true,     // we want to know the match score, so we can sort by it after we've merged multiple arrays of search results
    keys: ['title', 'body'] // look at the title and body of each item
  });

  return searchTermStrings
    .filter(st => st) // filter out undefined, and empty strings
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
//
/**
 * Add inject button into sidebar.
 *
 * When the user clicks on an item in a character sheet, the details are shown in a sidebar.
 * This will inject a "send to gamelog" button and properly send the pertinent sidebar content to the gamelog.
 * @param {DOMObject} sidebarPaneContent
 */
function inject_sidebar_send_to_gamelog_button(sidebarPaneContent) {
  // we explicitly don't want this to happen in `.ct-game-log-pane` because otherwise it will happen to the injected gamelog messages that we're trying to send here
  console.log("inject_sidebar_send_to_gamelog_button")
  let button = $(`<button id='castbutton'">SEND TO GAMELOG</button>`);
  // button.css({
  //  "margin": "10px 0px",
  //  "border": "1px solid #bfccd6",
  //  "border-radius": "4px",
  //  "background-color": "transparent",
  //  "color": "#394b59"
  // });
  button.css({
    "display": "flex",
    "flex-wrap": "wrap",
    "font-family": "Roboto Condensed,Roboto,Helvetica,sans-serif",
    "cursor": "pointer",
    "color": "#838383",
    "line-height": "1",
    "font-weight":" 700",
    "font-size": "12px",
    "text-transform": "uppercase",
    "background-color": "#f2f2f2",
    "margin": "3px 2px",
    "border-radius": "3px",
    "padding": "5px 7px",
    "white-space": "nowrap"
    })
  $(button).hover(
    function () {
      button.css({
          "background-color": "#5d5d5d",
          "color": "#f2f2f2"
      })
    },
    function () {
      button.css({
          "background-color": "#f2f2f2",
          "color": "#5d5d5d"
      })
    }
  );

  sidebarPaneContent.prepend(button);
  button.click(function() {
    // make sure the button grabs dynamically. Don't hold HTML in the button click block because clicking on items back to back will fuck that up

    let sidebar = sidebarPaneContent.closest(".ct-sidebar__portal");
    let toInject = $(`<div style='width: 100%;'></div>`);
    toInject.attr("class", sidebarPaneContent.attr("class")); // set the class on our new element
    toInject.toggleClass('abovevtt-sidebar-injected', true);
    // required
    toInject.append(sidebar.find(".ct-sidebar__header").clone());

    // these are optional, but if they're here, grab them
    toInject.append(sidebarPaneContent.find("[role='list']").clone());
    toInject.append(sidebarPaneContent.find(".ct-spell-detail__level-school").clone());
    toInject.append(sidebarPaneContent.find(".ct-speed-manage-pane__speeds").clone());
    toInject.append(sidebarPaneContent.find(".ct-armor-manage-pane__items").clone());

    if (sidebarPaneContent.find(".ct-creature-pane__block").length > 0) {
      // extras tab creatures need a little extra love
      toInject.append(sidebarPaneContent.find(".ct-creature-pane__block").clone());
      toInject.append(sidebarPaneContent.find(".ct-creature-pane__full-image").clone());
      toInject.find(".ct-sidebar__header").css({
        "margin-left": "20px",
        "margin-right": "20px"
      });
    } else {
      // required... unless it's an extras tab creature
      toInject.append(sidebar.find(".ddbc-html-content").clone());
    }

    // now clean up any edit elements
    toInject.find(".ct-sidebar__header-primary [class*='styles_button']").remove();

    if(is_abovevtt_page()){
      let html = window.MB.encode_message_text(toInject[0].outerHTML);
      data = {
        player: window.PLAYER_NAME,
        img: window.PLAYER_IMG,
        text: html
      };
      window.MB.inject_chat(data);
      notify_gamelog();
    }
    else{
      
      tabCommunicationChannel.postMessage({
        msgType: 'SendToGamelog',
        player: window.PLAYER_NAME,
        img: window.PLAYER_IMG,
        text: toInject[0].outerHTML,
        sendTo: window.sendToTab
      });
    }
    
    
    
    
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

function display_url_embeded(url){
  const encodedUrl = encodeURIComponent(url);
  const src = `${window.EXTENSION_PATH}iframe.html?src=${encodedUrl}`;
  const iframe = $(`<iframe id='embededFileFrame' data-src='${url}' src='${src}'></iframe>`);
  iframe.css({
    width: 'calc(100% + 2px)',
    height: '100%',
    background: 'var(--background-color, #fff)',
    'border-radius': '0px 0px 5px 5px',
    top: '-1px',
    left: '-1px',
    position: 'relative',
    'border-top': '0px'
  })    
  const path = decodeURIComponent(`embed_${url.split('?')[0].replace(/.*\.com\/\d+\/(.*)/gi, '$1')}`).replaceAll(/\s/gi, '-').replaceAll(/[^\d\w]/gi, '');
  const container = find_or_create_generic_draggable_window(path, '', false, true, '#embededFileFrame', 'min(80%, 1000px)', 'min(80%, 600px)', undefined, undefined, false);
  container.find(`#embededFileFrame`).remove();
  container.append(iframe);
  $('body').append(container);
}

function find_or_create_generic_draggable_window(id, titleBarText, addLoadingIndicator = true, addPopoutButton = false, popoutSelector=``, width='80%', height='80%', top='10%', left='10%', showSlow = true, cancelClasses='') {
  console.log(`find_or_create_generic_draggable_window id: ${id}, titleBarText: ${titleBarText}, addLoadingIndicator: ${addLoadingIndicator}, addPopoutButton: ${addPopoutButton}`);
  const existing = id.startsWith("#") ? $(id) : $(`#${id}`);
  if (existing.length > 0) {
    return existing;
  }

  const container = $(`<div class="resize_drag_window" id="${id}"></div>`);
  container.css({
    "left": left,
    "top": top,
    "max-width": "100%",
    "max-height": "100%",
    "position": "fixed",
    "height": height,
    "width": width,
    "z-index": "90000",
    "display": "none"
  });

  $("#site").append(container);

  if (addLoadingIndicator) {
    const loadingIndicator = build_combat_tracker_loading_indicator(`Loading ${titleBarText}`)

    container.append(loadingIndicator);
    loadingIndicator.css({
      'height': 'calc(100% - 26px)',
      'width': 'calc(100% - 4px)',
      'top': '24px',
      'left': '2px',
    });
    loadingIndicator.find('svg').css({
      "top": "25px",
      "margin": '0px',
      "max-height": "calc(100% - 25px)"
    });
  }
  if(showSlow){
    container.show("slow");
  }
  else{
    container.show();
  }
  container.resize(function(e) {
    e.stopPropagation();
  });

  const titleBar = $("<div class='title_bar restored'></div>");
  container.append(titleBar);

  /*Set draggable and resizeable on monster sheets for players. Allow dragging and resizing through iFrames by covering them to avoid mouse interaction*/
  const close_title_button = $(`<div class="title_bar_close_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>`);
  titleBar.append(close_title_button);
  close_title_button.on("click.close", function (event) {
    close_and_cleanup_generic_draggable_window($(event.currentTarget).closest('.resize_drag_window').attr('id'));
  });

  if (addPopoutButton) {
    let popoutButton = $(`<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>`);
    titleBar.append(popoutButton);
    popoutButton.off('click.popout').on('click.popout', function(){
      if($(popoutSelector).is("iframe")){
        
        const name = titleBarText.replace(/(\r\n|\n|\r)/gm, "").trim();
        const params = `scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no,
      width=${container.width()},height=${container.height()},left=100,top=100`;
        let iframeSrc = $(popoutSelector).attr('data-src');
        if (!iframeSrc){
          iframeSrc = $(popoutSelector).attr('src').replace('https://www.dndbeyond.com', '');
          childWindows[name] = window.open(`https://dndbeyond.com${iframeSrc}`, '_blank', params);
        } else{
          childWindows[name] = window.open(iframeSrc, '_blank', params);
        }
          
        close_title_button.click();
        childWindows[name].onbeforeunload = function(){
          closePopout(name);
        }
        function checkTitle() {
          if(childWindows[name].document && childWindows[name].document?.title != name){    
            childWindows[name].document.title = name; 
            setTimeout(checkTitle, 1000); 
          }
        } 
        checkTitle();
      }
      else{
        popoutWindow(titleBarText, $(popoutSelector), container.width(), container.height());
      }

    })
  }

  container.addClass("moveableWindow");

  container.resizable({
    addClasses: false,
    handles: "all",
    containment: "#windowContainment",
    start: function (event, ui) {
      $(event.currentTarget).append($('<div class="iframeResizeCover"></div>'));
    },
    stop: function (event, ui) {
      $('.iframeResizeCover').remove();
    },
    minWidth: 200,
    minHeight: 200
  });

  container.on('mousedown', function(event) {
    frame_z_index_when_click($(event.currentTarget));
  });

  container.draggable({
    addClasses: false,
    scroll: false,
    containment: "#windowContainment",
    distance: 5,
    start: function(event, ui) {
      $(event.currentTarget).append($('<div class="iframeResizeCover"></div>'));
    },
    stop: function(event, ui) {
      $('.iframeResizeCover').remove();
    },
    cancel: cancelClasses
  });

  titleBar.on('dblclick', function(event) {
    const titleBar = $(event.currentTarget);
    if (titleBar.hasClass("restored")) {
      titleBar.data("prev-height", titleBar.height());
      titleBar.data("prev-width", titleBar.width() - 3);
      container.data("prev-top", container.css("top"));
      container.data("prev-left", container.css("left"));
      if(container.find('#sourceChapterIframe').length>0){
          container.data("prev-scroll", $('#sourceChapterIframe')[0].contentWindow.scrollY);
      }  
      container.css("top", container.data("prev-minimized-top"));
      container.css("left", container.data("prev-minimized-left"));
      container.data('prev-height', container.css('height'));
      container.data('prev-width', container.css('width'));

      container.height(23);
      container.width(200);

      titleBar.addClass("minimized");
      titleBar.removeClass("restored");
      titleBar.prepend(`<div class="title_bar_text">${titleBarText}</div>`);
    } else if(titleBar.hasClass("minimized")) {
      container.data("prev-minimized-top", container.css("top"));
      container.data("prev-minimized-left", container.css("left"));
      container.height(container.data('prev-height'));
      container.width(container.data('prev-width'));
      container.css("top", container.data("prev-top"));
      container.css("left", container.data("prev-left"));
      titleBar.addClass("restored");
      titleBar.removeClass("minimized");
      titleBar.find(".title_bar_text").remove();
      if(container.find('#sourceChapterIframe').length>0){
        $('#sourceChapterIframe')[0].contentWindow.scrollTo(0, container.data("prev-scroll"));
      }
  
    }
  });

  return container;
}

function close_and_cleanup_generic_draggable_window(id) {
  const container = id.startsWith("#") ? $(id) : $(`#${id}`);
  container.off('dblclick');
  container.off('mousedown');
  container.draggable('destroy');
  container.resizable('destroy');
  container.find('.title_bar_close_button').off('click');
  container.find('.popout-button').off('click');
  container.remove();
} 
