/* CharactersPage.js - scripts that are exclusive to the Characters page */

$(function() {
  init_characters_pages();
});

let recentCharacterUpdates = {};

const tabCommunicationChannel = new BroadcastChannel('tabCommunication');


const sendCharacterUpdateEvent = mydebounce(() => {
  console.log("sendCharacterUpdateEvent")
  if (is_abovevtt_page()) {
    window.MB.sendMessage("custom/myVTT/character-update", {
      characterId: window.PLAYER_ID,
      pcData: {...recentCharacterUpdates}
    });
  }
  else{
    tabCommunicationChannel.postMessage({
      characterId: window.location.href.split('/').slice(-1)[0],
      pcData: {...recentCharacterUpdates}
    });
  }
  recentCharacterUpdates = {};
}, 1500);

/** @param changes {object} the changes that were observed. EX: {hp: 20} */
function character_sheet_changed(changes) {
    console.log("character_sheet_changed", changes);
    recentCharacterUpdates = {...recentCharacterUpdates, ...changes};
    sendCharacterUpdateEvent();
}

function send_character_hp() {
  character_sheet_changed({
    hitPointInfo: {
      current: parseInt($(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-current-label']`).text()),
      maximum: parseInt($(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-max-label']`).text()),
      temp: parseInt($(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-temp-label']`).text()) || 0
    }
  });
}

function init_characters_pages() {
  // this is injected on Main.js when avtt is running. Make sure we set it when avtt is not running
  if (typeof window.EXTENSION_PATH !== "string" || window.EXTENSION_PATH.length <= 1) {
    window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
  }

  // it's ok to call both of these, because they will do any clean up they might need and then return early
  init_character_sheet_page();
  init_character_list_page_without_avtt();
}

/** actions to take on the character sheet when AboveVTT is NOT running */
function init_character_sheet_page() {
  if (!is_characters_page()) return;

  // check for name and image
  set_window_name_and_image(function() {
    observe_character_sheet_changes($(document));
    inject_join_exit_abovevtt_button();
    observe_character_theme_change();
    observe_character_image_change();
  });

  // observe window resizing and injeect our join/exit button if necessary
  window.addEventListener('resize', function(event) {
    inject_join_exit_abovevtt_button();
  });
}

/** actions to take on the characters list when AboveVTT is NOT running */
function init_character_list_page_without_avtt() {
  if (!is_characters_list_page()) {
    window.location_href_observer?.disconnect();
    delete window.oldHref;
    return;
  }

  inject_join_button_on_character_list_page();

  // observe window.location change. DDB dynamically changes the page when you click the View button instead of navigating to a new page

  window.oldHref = document.location.href;
  if (window.location_href_observer) {
    window.location_href_observer.disconnect();
  }
  window.location_href_observer = new MutationObserver(function(mutationList, observer) {
    if (oldHref !== document.location.href) {
      console.log("Detected location change from", oldHref, "to", document.location.href);
      window.oldHref = document.location.href;
      init_characters_pages();
    }
  });
  window.location_href_observer.observe(document.querySelector("body"), { childList: true, subtree: true });
}

/** Called from our character sheet observer for Dice Roll formulae.
 * @param element the jquery element that we observed changes to */
function inject_dice_roll(element) {
  if (element.find("button.avtt-roll-formula-button").length > 0) {
    console.debug("inject_dice_roll already has a button")
    return;
  }
  const slashCommands = [...element.text().matchAll(multiDiceRollCommandRegex)];
  if (slashCommands.length === 0) return;
  console.debug("inject_dice_roll slashCommands", slashCommands);
  let updatedInnerHtml = element.text();
  for (const command of slashCommands) {
    try {
      const diceRoll = DiceRoll.fromSlashCommand(command[0], window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
      updatedInnerHtml = updatedInnerHtml.replace(command[0], `<button class='avtt-roll-formula-button integrated-dice__container' title="${diceRoll.action?.toUpperCase() ?? "CUSTOM"}: ${diceRoll.rollType?.toUpperCase() ?? "ROLL"}" data-slash-command="${command[0]}">${diceRoll.expression}</button>`);
    } catch (error) {
      console.warn("inject_dice_roll failed to parse slash command. Removing the command to avoid infinite loop", command, command[0]);
      updatedInnerHtml = updatedInnerHtml.replace(command[0], '');
    }
  }
  element.empty();
  console.debug("inject_dice_roll updatedInnerHtml", updatedInnerHtml);
  element.append(updatedInnerHtml);
  element.find("button.avtt-roll-formula-button").click(function(clickEvent) {
    clickEvent.stopPropagation();
    const slashCommand = $(clickEvent.currentTarget).attr("data-slash-command");
    const diceRoll = DiceRoll.fromSlashCommand(slashCommand, window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
    window.diceRoller.roll(diceRoll);
  });
}

/**
 * Observes character sheet changes and:
 *     injects Dice Roll buttons when a slash command is in item notes.
 *     updates window.PLAYER_NAME when the character name changes.
 * @param {DOMObject} documentToObserve documentToObserve is `$(document)` on the characters page, and `$(event.target).contents()` every where else */
function observe_character_sheet_changes(documentToObserve) {
  if (window.character_sheet_observer) {
    window.character_sheet_observer.disconnect();
  }
  if (is_abovevtt_page()) {
    tabCommunicationChannel.addEventListener ('message', (event) => {
         window.MB.sendMessage("custom/myVTT/character-update", {
          characterId: event.data.characterId,
          pcData: event.data.pcData
        });
    });
  }
  window.character_sheet_observer = new MutationObserver(function(mutationList, observer) {

    // console.log("character_sheet_observer", mutationList);

    // initial injection of our buttons
    const notes = documentToObserve.find(".ddbc-note-components__component:not('.above-vtt-dice-visited')");
    notes.each(function() {
      // console.log("character_sheet_observer iterating", mutationList);
      try {
        inject_dice_roll($(this));
        $(this).addClass("above-vtt-dice-visited"); // make sure we only parse this element once
      } catch (error) {
        console.log("inject_dice_roll failed to process element", error);
      }
    });

    // handle updates to element changes that would strip our buttons
    mutationList.forEach(mutation => {
      try {
        const mutationParent = $(mutation.target).parent();
        switch (mutation.type) {
          case "attributes":
              if (mutationParent.hasClass('ct-condition-manage-pane__condition-toggle') && $(mutation.target).hasClass('ddbc-toggle-field')) { // conditions update from sidebar
                let conditionsSet = [];
                $(`.ct-condition-manage-pane__condition`).each(function () {
                  if ($(this).find(`.ddbc-toggle-field[aria-checked='true']`).length > 0) {
                    conditionsSet.push($(this).find('.ct-condition-manage-pane__condition-name').text());
                  }
                });
                character_sheet_changed({conditions: conditionsSet});
              }
            break;
          case "childList":
              if ($(mutation.addedNodes[0]).hasClass('ct-health-summary__hp-number')) {
                send_character_hp();
              } else if (($(mutation.removedNodes[0]).hasClass('ct-health-summary__hp-item-input') && $(mutation.target).hasClass('ct-health-summary__hp-item-content')) || ($(mutation.removedNodes[0]).hasClass('ct-health-summary__deathsaves-label') && $(mutation.target).hasClass('ct-health-summary__hp-item'))) {
                send_character_hp();
              } else if ($(mutation.target).hasClass('ct-health-summary__deathsaves') || $(mutation.target).hasClass('ct-health-summary__deathsaves-mark')) {
                character_sheet_changed({
                  hitPointInfo: {
                    current: 0,
                    temp: 0
                  },
                  deathSaveInfo: {
                    failCount: $('.ct-health-summary__deathsaves--fail .ct-health-summary__deathsaves-mark--active').length,
                    successCount: $('.ct-health-summary__deathsaves--success .ct-health-summary__deathsaves-mark--active').length
                  }
                });
              }
            mutation.addedNodes.forEach(node => {
              if (typeof node.data === "string" && node.data.match(multiDiceRollCommandRegex)?.[0]) {
                try {
                  inject_dice_roll($(mutation.target));
                } catch (error) {
                  console.log("inject_dice_roll failed to process element", error);
                }
              }
            });
            break;
          case "characterData":

              if (mutationParent.parent().hasClass('ct-health-summary__hp-item-content')) {
                let labelledBy = mutationParent.attr('aria-labelledby');
                if (
                  labelledBy.includes('ct-health-summary-current-label') ||
                  labelledBy.includes('ct-health-summary-max-label') ||
                  labelledBy.includes('ct-health-summary-temp-label')
                ) {
                  send_character_hp();
                }
              } else if (mutationParent.hasClass('ddbc-armor-class-box__value')) { // ac update from sidebar
                character_sheet_changed({armorClass: parseInt($(`.ddbc-armor-class-box__value`).text())});
              }
            if (typeof mutation.target.data === "string") {
              if (mutation.target.data.match(multiDiceRollCommandRegex)?.[0]) {
                try {
                  inject_dice_roll($(mutation.target));
                } catch (error) {
                  console.log("inject_dice_roll failed to process element", error);
                }
              } else if (mutation.target.parentElement.classList.contains("ddb-character-app-sn0l9p")) {
                window.PLAYER_NAME = mutation.target.data;
                character_sheet_changed({name: mutation.target.data});
              }
            }
            break;
        }
      } catch (error) {
        console.warn("character_sheet_observer failed to parse mutation", error, mutation);
      }
    });
  });

  const mutation_target = documentToObserve.get(0);
  const mutation_config = { attributes: true, childList: true, characterData: true, subtree: true };
  window.character_sheet_observer.observe(mutation_target, mutation_config);
}

/** Attempts to read the player name and image from the page every.
 * This will retry every second until it successfully reads from the page
 * @param {function} callback a function to execute after player name and image have been read from the page */
function set_window_name_and_image(callback) {
  if (!is_characters_page()) return;
  if (window.set_window_name_and_image_attempts > 30) {
    console.warn("set_window_name_and_image has failed after 30 attempts");
    delete window.set_window_name_and_image_attempts;
    if (is_abovevtt_page()) {
      showError(new Error("set_window_name_and_image has failed after 30 attempts"));
    }
    return;
  }

  console.debug("set_window_name_and_image");

  window.PLAYER_NAME = $(".ddb-character-app-sn0l9p").text();
  try {
    // This should be just fine, but catch any parsing errors just in case
    window.PLAYER_IMG = get_higher_res_url($(".ddbc-character-avatar__portrait").css("background-image").slice(4, -1).replace(/"/g, ""));
  } catch {}

  if (typeof window.PLAYER_NAME !== "string" || window.PLAYER_NAME.length <= 1 || typeof window.PLAYER_IMG !== "string" || window.PLAYER_IMG.length <= 1) {
    // try again
    if (!window.set_window_name_and_image_attempts) {
      window.set_window_name_and_image_attempts = 1;
    }
    window.set_window_name_and_image_attempts += 1
    setTimeout(function() {
      set_window_name_and_image(callback);
    }, 1000);
  } else {
    // we're done
    if (typeof callback === "function") {
      callback();
    }
    delete window.set_window_name_and_image_attempts;
  }
}

/** Adds a button to the character sheet.
 * If AboveVTT is not running, the button will be a join button
 * If AboveVTT is running, the button will be an exit button */
function inject_join_exit_abovevtt_button() {
  if (!is_characters_page()) return;                        // wrong page, dude
  if ($(".ddbc-campaign-summary").length === 0) return;     // we don't have any campaign data
  if ($("#avtt-character-join-button").length > 0) return;  // we already injected a button

  const desktopPosition = $(".ct-character-sheet-desktop > .ct-character-header-desktop > .ct-character-header-desktop__group--gap");
  const tabletPosition = $(".ct-character-sheet-tablet .ct-main-tablet > .ct-main-tablet__campaign");
  const mobilePosition = $(".ct-character-sheet-mobile .ct-main-mobile > .ct-main-mobile__campaign");

  const buttonText = is_abovevtt_page() ? "Exit AboveVTT" : "Join AboveVTT";
  const button = $(`<a id="avtt-character-join-button" class="ct-character-header-desktop__button" style="float:right;"><img style="height:18px;" src="${window.EXTENSION_PATH + "assets/avtt-logo.png"}" title="AboveVTT Logo" />${buttonText}</a>`);

  if (desktopPosition.length > 0) {
    desktopPosition.append(button);
    button.css({
      "color": "white"
    });
  } else if (tabletPosition.length > 0) {
    tabletPosition.prepend(button);
    if (tabletPosition.hasClass("ct-main-tablet__campaign--dark-mode")) {
      button.css({"color": "white", "background": "rgba(16,22,26,.859)"});
    } else {
      button.css({"background": "white"});
    }
  } else if (mobilePosition.length > 0) {
    mobilePosition.prepend(button);
    if (mobilePosition.hasClass("ct-main-mobile__campaign--dark-mode")) {
      button.css({"color": "white", "background": "rgba(16,22,26,.859)"});
    } else {
      button.css({"background": "white"});
    }
  }

  button.click(function(event) {
    if (is_abovevtt_page()) {
      window.location.href = `${window.location.origin}${window.location.pathname}`;
    } else {
      window.location.href = `${window.location.origin}${window.location.pathname}?abovevtt=true`;
    }
  });
}

function inject_join_button_on_character_list_page() {
  if (!is_characters_list_page()) return;
  if (!window.inject_join_button_on_character_list_page_attempts) {
    window.inject_join_button_on_character_list_page_attempts = 1;
  }
  if (window.inject_join_button_on_character_list_page_attempts > 30) {
    console.warn("inject_join_button_on_character_list_page gave up after 30 attempts");
    return;
  }

  const list = $(".ddb-characters-listing-body");
  if (list.length === 0) {
    // not loaded yet. Try again in 1 second
    window.inject_join_button_on_character_list_page_attempts += 1;
    setTimeout(function() {
      inject_join_button_on_character_list_page();
    }, 1000);
    return;
  }
  delete window.inject_join_button_on_character_list_page_attempts

  // const characterCards = list.find(".ddb-campaigns-character-card-campaign-links-campaign-link");
  const characterCards = list.find(".ddb-campaigns-character-card-campaign-links");
  characterCards.each((_, campaignLink) => {
    const cardFooter = $(campaignLink).siblings(".ddb-campaigns-character-card-footer").find(".ddb-campaigns-character-card-footer-links");
    const joinButton = $(`<a href='#' class='button ddb-campaigns-character-card-footer-links-item' style='color:white;background: #1b9af0;text-align: center;border-radius: 2px;box-shadow: inset 0 1px 0 rgb(255 255 255 / 10%), 0 1px 2px rgb(0 0 0 / 5%);background-repeat: repeat-x;border: 1px solid #070707;border-color: rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25);margin-top: 5px;padding-left: 4px;padding-right: 4px;'>JOIN AboveVTT</a>`);
    cardFooter.prepend(joinButton);
    joinButton.click(function(e) {
      e.preventDefault();
      let sheet;
      const thisButton = $(e.currentTarget);
      const thisButtonSiblings = $(e.currentTarget).siblings("a");
      thisButtonSiblings.each((_, siblingAnchor) => {
        if (!sheet) { // look for the "View" link, and grab the href value of it
          sheet = siblingAnchor.href.match(charactersPageRegex)?.[0];
        }
      });
      if (sheet) {
        window.open(`https://www.dndbeyond.com${sheet}?abovevtt=true`, '_blank');
      } else {
        showError(new Error("Failed to find the View link"), "thisButton:", thisButton, ", thisButtonSiblings:", thisButtonSiblings, "clickEvent:", e);
      }
    });
  });
}

function observe_character_theme_change() {
  if (window.theme_observer) window.theme_observer.disconnect();
  window.theme_observer = new MutationObserver(function(mutationList, observer) {
    // console.log("theme_observer mutationList", mutationList);
    mutationList.forEach(mutation => {
      // console.log("theme_observer mutation", mutation, mutation.addedNodes, mutation.addedNodes.length);
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // console.log("theme_observer node", node);
          if (node.innerHTML && node.innerHTML.includes("--dice-color")) {
            // console.log("theme_observer is calling find_and_set_player_color", mutation, node);
            const newColor = node.innerHTML.match(/#(?:[0-9a-fA-F]{3}){1,2}/)?.[0];
            if (newColor) {
              update_window_color(newColor);
              window.PeerManager.send(PeerEvent.preferencesChange());
              character_sheet_changed({color: newColor});
            }
          }
        });
      }
    });
  });
  window.theme_observer.observe(document.documentElement, { childList: true });
}

function observe_character_image_change() {
  if (window.character_image_observer) window.character_image_observer.disconnect();
  window.character_image_observer = new MutationObserver(function(mutationList, observer) {
    mutationList.forEach(mutation => {
      try {
        // This should be just fine, but catch any parsing errors just in case
        const updatedUrl = get_higher_res_url($(mutation.target).css("background-image").slice(4, -1).replace(/"/g, ""));
        window.PLAYER_IMG = updatedUrl;
        character_sheet_changed({image: updatedUrl});
      } catch { }
    });
  });
  window.character_image_observer.observe(document.querySelector(".ddbc-character-avatar__portrait"), { attributeFilter: ["style"] });
}

function update_window_color(colorValue) {
  let pc = find_pc_by_player_id(my_player_id());
  if (pc?.decorations?.characterTheme?.themeColor) {
    pc.decorations.characterTheme.themeColor = colorValue;
    find_and_set_player_color();
  }
}
