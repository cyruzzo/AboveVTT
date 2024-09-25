/* CharactersPage.js - scripts that are exclusive to the Characters page */

$(function() {
  init_characters_pages();
});

let recentCharacterUpdates = {};

const debounce_add_extras = mydebounce(() => {
  if (is_abovevtt_page()) {
    $('.add-monster-token-to-vtt').remove();
    const extraRows = $('.ct-extra-row')
    for(let i=0; i<extraRows.length; i++){
      $(extraRows[i]).append($(`<button class='add-monster-token-to-vtt'>+</button>`)) 
    }
    let pc = find_pc_by_player_id(my_player_id(), false)
    const playerTokenID = pc ? pc.sheet : '';
    $('.add-monster-token-to-vtt').off('click.addExtra').on('click.addExtra', async function(e){
      e.stopImmediatePropagation();
      let tokenPosition = (window.TOKEN_OBJECTS[playerTokenID]) ? 
        {
          x: parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.left) + parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.size)/2,
          y: parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.top) + parseFloat(window.TOKEN_OBJECTS[playerTokenID].options.size)/2
        } : 
        center_of_view();

      let playerData = await DDBApi.fetchCharacterDetails([window.PLAYER_ID])
      let tokenName = $(this).parent().find('.ddbc-extra-name').text().replace("*", '');
      let monsterData = playerData[0].extras.creatures.filter(d => d.name == tokenName)[0];

      let extraOptions = {
        hitPointInfo: {
          current: $(this).parent().find('.ct-extra-row__hp-value--current').text(),
          maximum: $(this).parent().find('.ct-extra-row__hp-value--total').text(),
        },       
        armorClass: $(this).parent().find('.ct-extra-row__ac').text(),
        sizeId: monsterData.sizeId,
        name: monsterData.name,
        player_owned: true,
        share_vision: window.myUser ? window.myUser : true,
        hidden: false,
        locked: false,
        deleteableByPlayers: true,
        lockRestrictDrop: "none",
        restrictPlayerMove: false
      }
      if(!window.TOKEN_OBJECTS[playerTokenID])
        tokenPosition = convert_point_from_view_to_map(tokenPosition.x, tokenPosition.y)
      window.MB.sendMessage("custom/myVTT/place-extras-token", {
          monsterData: monsterData,
          centerView: tokenPosition,
          sceneId: window.CURRENT_SCENE_DATA.id,
          extraOptions: extraOptions
      });
    })
  
 
  
  } 

}, 100);

const sendCharacterUpdateEvent = mydebounce(() => {
  if (window.DM) return;
  console.log("sendCharacterUpdateEvent")
  const pcData = {...recentCharacterUpdates};
  recentCharacterUpdates = {};
  if (is_abovevtt_page()) {
    window.MB.sendMessage("custom/myVTT/character-update", {
      characterId: window.PLAYER_ID,
      pcData: pcData
    });
    update_pc_with_data(window.PLAYER_ID, pcData);
  } else {
    tabCommunicationChannel.postMessage({
      msgType: 'CharacterData',
      characterId: window.location.href.split('/').slice(-1)[0],
      pcData: pcData
    });
  }
}, 1500);

/** @param changes {object} the changes that were observed. EX: {hp: 20} */
function character_sheet_changed(changes) {
    console.log("character_sheet_changed", changes);
    recentCharacterUpdates = {...recentCharacterUpdates, ...changes};
    sendCharacterUpdateEvent();
}

function send_character_hp(maxhp) {
  const pc = find_pc_by_player_id(find_currently_open_character_sheet(), false); // use `find_currently_open_character_sheet` in case we're not on CharactersPage for some reason
  if(maxhp > 0){ //the player just died and we are sending removed node max hp data
    character_sheet_changed({
      hitPointInfo: {
        current: 0,
        maximum: maxhp,
        temp: 0
      },
      deathSaveInfo: read_death_save_info()
    });
  }
  else{
    character_sheet_changed({
      hitPointInfo: {
        current: read_current_hp(),
        maximum: read_max_hp(pc?.hitPointInfo?.maximum),
        temp: read_temp_hp()
      },
      deathSaveInfo: read_death_save_info()
    });
  }

}


function read_abilities(container = $(document)) {
  const scoreOnTop = container.find(`.ddbc-ability-summary__primary [class*='styles_signed'][class*='styles_large']`).length === 0;

  let abilitiesObject = [
    {name: 'str', save: 0, score: 0, label: 'Strength', modifier: 0},
    {name: 'dex', save: 0, score: 0, label: 'Dexterity', modifier: 0},
    {name: 'con', save: 0, score: 0, label: 'Constitution', modifier: 0},
    {name: 'int', save: 0, score: 0, label: 'Intelligence', modifier: 0},
    {name: 'wis', save: 0, score: 0, label: 'Wisdom', modifier: 0},
    {name: 'cha', save: 0, score: 0, label: 'Charisma', modifier: 0}
  ];

  for(let i = 0; i < 6; i++){
    if(scoreOnTop){
      abilitiesObject[i].score = parseInt($( container.find(`.ddbc-ability-summary__primary button`)[i]).text());
      abilitiesObject[i].modifier = parseInt($( container.find(`.ddbc-ability-summary__secondary`)[i]).text());
    }
    else{
      abilitiesObject[i].score =  parseInt($( container.find(`.ddbc-ability-summary__secondary`)[i]).text());
      abilitiesObject[i].modifier = parseInt($( container.find(`.ddbc-ability-summary__primary button`)[i]).text());
    }

    

    abilitiesObject[i].save = parseInt($( container.find(`.ddbc-saving-throws-summary__ability-modifier [class*='styles_numberDisplay']`)[i]).text());
  }

  return abilitiesObject;
}

function send_abilities() {
   character_sheet_changed({abilities: read_abilities()});
}

function read_senses(container = $(document)) {
  // this seems to be the same for both desktop and mobile layouts which is nice for once
  try {
    let changeData = {};
    const passiveSenses = container.find(".ct-senses__callouts .ct-senses__callout");
    const perception = parseInt($(passiveSenses[0]).find(".ct-senses__callout-value").text());
    if (perception) changeData.passivePerception = perception;
    const investigation = parseInt($(passiveSenses[1]).find(".ct-senses__callout-value").text());
    if (investigation) changeData.passiveInvestigation = investigation;
    const insight = parseInt($(passiveSenses[2]).find(".ct-senses__callout-value").text());
    if (insight) changeData.passiveInsight = insight;
    const senses = container.find(".ct-senses__summary").text().split(",").map(sense => {
      try {
        const name = sense.trim().split(" ")[0].trim();
        const distance = sense.trim().substring(name.length).trim();
        return { name: name, distance: distance };
      } catch (senseError) {
        console.debug("Failed to parse sense", sense, senseError);
        return undefined;
      }
    }).filter(s => s); // filter out any undefined
    if (senses.length > 0) {
      changeData.senses = senses;
    }
    return changeData;
  } catch (error) {
    console.debug("Failed to send senses", error);
    return undefined;
  }
}

function send_senses() {
  const changeData = read_senses();
  if (changeData) {
    character_sheet_changed(changeData);
  }
}

function read_conditions(container = $(document)) {
  let conditionsSet = [];
  container.find('.ct-conditions-summary .ddbc-condition__name').each(function(){
    let level = null;
    if($(this).find('.ddbc-condition__level').length>0){
      level = parseInt($(this).find('.ddbc-condition__level').text().replace(/\W|\D/gi, ''))
    }
    conditionsSet.push({
      name: $(this).contents().not($(this).children()).text(),
      level: level
    });
  })
  return conditionsSet;
}

function read_speeds(container = $(document), speedManagePage) {
  speedManagePage = speedManagePage || container.find(".ct-speed-manage-pane");
  let speeds = [];
  if (speedManagePage.find(".ct-speed-manage-pane__speeds").length > 0) {
    // the sidebar is open, let's grab them all
    speedManagePage.find(".ct-speed-manage-pane__speed").each(function() {
      const container = $(this);
      const name = container.find(".ct-speed-manage-pane__speed-label").text();
      const distance = parseInt(container.find(".ddbc-distance-number__number").text());
      speeds.push({name: name, distance: distance});
    });
    if (speeds.length) {
      return speeds;
    }
  }

  // just update the primary speed
  const name = container.find(".ct-speed-box__heading").text();
  const distance = parseInt( container.find(".ct-speed-box__box-value .ddbc-distance-number .ddbc-distance-number__number").text() ) || 0;
  return [ { name: name, distance: distance } ];
}

function send_movement_speeds(container, speedManagePage) {
  let speeds = read_speeds(container, speedManagePage);
  if (!speeds) {
    return;
  }
  const pc = find_pc_by_player_id(find_currently_open_character_sheet(), false); // use `find_currently_open_character_sheet` in case we're not on CharactersPage for some reason
  if (pc && pc.speeds) {
    pc.speeds.forEach(pcSpeed => {
      const updatedSpeedIndex = speeds.findIndex(us => us.name === pcSpeed.name);
      if (updatedSpeedIndex < 0) { // couldn't read this speed so inject the pc.speeds value
        speeds.push(pcSpeed);
      }
    })
  }
  if (speeds.length > 0) {
    character_sheet_changed({speeds: speeds});
  }
}

function read_current_hp(container = $(document)) {
 
  let element = container.find(`.ct-health-manager__health-item.ct-health-manager__health-item--cur .ct-health-manager__health-item-value`)
  if(element.length){
    return parseInt(element.text())
  }
  element = container.find(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-current-label']`);
  if (element.length) {
    return parseInt(element.text()) || 0;
  }
  element = container.find(`.ct-status-summary-mobile__hp-current`);
  if (element.length) {
    const hpValue = parseInt(element.text()) || 0;
    if (hpValue && container.find(`.ct-status-summary-mobile__hp--has-temp`).length) {
      // DDB doesn't display the temp value on mobile layouts so set this to 1 less, so we can at least show that there is temp hp. See `read_temp_hp` for the other side of this
      if(container.find('.ct-health-manager__health-item--temp').length){
        return hpValue - parseInt(container.find('.ct-health-manager__health-item--temp .ct-health-manager__input').val()); /// if hp side panel is open check this for temp hp
      }
      return hpValue - 1;
    }
    return hpValue;
  }
  return 0;
}

function read_temp_hp(container = $(document)) {
  let element = container.find(`.ct-health-manager__health-item.ct-health-manager__health-item--temp .ct-health-manager__health-item-value input.ct-health-manager__input`)
  if(element.length){
    return parseInt(element.val())
  }
  element = container.find(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-temp-label']`)
  if (element.length) {
    return parseInt(element.text()) || 0;
  }
  if (container.find(`.ct-status-summary-mobile__hp--has-temp`).length) {
    if(container.find('.ct-health-manager__health-item--temp').length){
        return parseInt(('.ct-health-manager__health-item--temp .ct-health-manager__input').val()); // if hp side panel is open check this for temp hp
      }
    // DDB doesn't display the temp value on mobile layouts so just set it to 1, so we can at least show that there is temp hp. See `read_current_hp` for the other side of this
    return 1;
  }
  return 0;
}

function read_max_hp(currentMaxValue = 0, container = $(document)) {
  let element = container.find(`.ct-health-manager__health-item.ct-health-manager__health-item--max .ct-health-manager__health-item-value .ct-health-manager__health-max-current`)
  if(element.length){
    return parseInt(element.text())
  }
  element = container.find(`.ct-health-summary__hp-number[aria-labelledby*='ct-health-summary-max-label']`);
  if (element.length) {
    return parseInt(element.text()) || currentMaxValue;
  }
  element = container.find(".ct-status-summary-mobile__hp-max");
  if (element.length) {
    return parseInt(element.text()) || currentMaxValue;
  }
  return currentMaxValue;
}

function read_death_save_info(container = $(document)) {
  if (container.find(".ct-status-summary-mobile__deathsaves-marks").length) {
    return {
      failCount: container.find('.ct-status-summary-mobile__deathsaves--fail .ct-status-summary-mobile__deathsaves-mark--active').length || 0,
      successCount: container.find('.ct-status-summary-mobile__deathsaves--success .ct-status-summary-mobile__deathsaves-mark--active').length || 0
    };
  }
  return {
    failCount: container.find('.ct-health-summary__deathsaves--fail .ct-health-summary__deathsaves-mark--active').length || 0,
    successCount: container.find('.ct-health-summary__deathsaves--success .ct-health-summary__deathsaves-mark--active').length || 0
  };
}

function read_inspiration(container = $(document)) {
  if (container.find(".ct-inspiration__status--active").length) {
    return true;
  }
  if (container.find(".ct-status-summary-mobile__inspiration .ct-status-summary-mobile__button--active").length) {
    return true
  }
  return false;
}

// Good canidate for service worker
async function init_characters_pages(container = $(document)) {
  // this is injected on Main.js when avtt is running. Make sure we set it when avtt is not running
  if (typeof window.EXTENSION_PATH !== "string" || window.EXTENSION_PATH.length <= 1) {
    window.EXTENSION_PATH = container.find("#extensionpath").attr('data-path');
  }
  // it's ok to call both of these, because they will do any clean up they might need and then return early
  init_character_sheet_page();
  init_character_list_page_without_avtt();

  if(!is_abovevtt_page()){
    tabCommunicationChannel.addEventListener ('message', (event) => {
      if(event.data.msgType == 'setupObserver'){
        if(event.data.tab == undefined && event.data.rpgRoller != true && window.self==window.top){
          $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller'); 
          $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller')
        }else{
          convertToRPGRoller();
        }

        window.EXPERIMENTAL_SETTINGS['rpgRoller'] = event.data.rpgRoller;
        if(window.sendToTab != false || event.data.tab == undefined){
          window.sendToTab = (window.self != window.top) ? event.data.iframeTab : event.data.tab;     
        }
        if(window.sendToTabRPGRoller != false || event.data.rpgTab == undefined){
          window.sendToTabRPGRoller = (window.self != window.top) ? event.data.iframeTab : event.data.rpgTab;   
        }
      }
      if(event.data.msgType =='removeObserver'){
        $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller'); 
        $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller')
        delete window.EXPERIMENTAL_SETTINGS['rpgRoller'];
        window.sendToTabRPGRoller = undefined;
        window.sendToTab = undefined;
        setTimeout(function(){
          tabCommunicationChannel.postMessage({
           msgType: 'isAboveOpen'
          });
        }, 300)
        
      }
      if(event.data.msgType =='disableSendToTab' && window.self == window.top){
        window.sendToTab = undefined;
      }


    })
    tabCommunicationChannel.postMessage({
      msgType: 'isAboveOpen'
    })


    window.diceRoller = new DiceRoller(); 
    window.ddbConfigJson = await DDBApi.fetchConfigJson();
  }
}

const debounceConvertToRPGRoller =  mydebounce(() => {convertToRPGRoller()}, 20)


const debounceRemoveRPGRoller =  mydebounce(() => {
    $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller'); 
    $(`.integrated-dice__container:not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller')
    delete window.EXPERIMENTAL_SETTINGS['rpgRoller'];
}, 20)


function convertToRPGRoller(){
    if(is_abovevtt_page() && window.EXPERIMENTAL_SETTINGS['rpgRoller'] != true){
      $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller')
      $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller')
      return;
    }
    let urlSplit = window.location.href.split("/");
    if(urlSplit.length > 0 && !is_abovevtt_page()) {
      window.PLAYER_ID = urlSplit[urlSplit.length - 1].split('?')[0];
    }

    $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller').on('contextmenu.rpg-roller', function(e){
          let rollData = {} 
          if($(this).hasClass('avtt-roll-formula-button')){
             rollData = DiceRoll.fromSlashCommand($(this).attr('data-slash-command'))
             rollData.modifier = `${Math.sign(rollData.calculatedConstant) == 1 ? '+' : ''}${rollData.calculatedConstant}`
          }
          else{
             rollData = getRollData(this)
          }
          if(!rollData.expression.match(allDiceRegex) && window.EXPERIMENTAL_SETTINGS['rpgRoller'] != true){
            return;
          }
          e.stopPropagation();
          e.preventDefault();

          
          
          if (rollData.rollType === "damage") {
            damage_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, window.PLAYER_NAME, window.PLAYER_IMG)
              .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
          } else {
            standard_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, window.PLAYER_NAME, window.PLAYER_IMG)
              .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
          }
    })
 
    $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller').on('click.rpg-roller', function(e){
      let rollData = {} 
      rollData = getRollData(this);
      if(!rollData.expression.match(allDiceRegex) && window.EXPERIMENTAL_SETTINGS['rpgRoller'] != true){
        return;
      }
      e.stopImmediatePropagation();
      
      window.diceRoller.roll(new DiceRoll(rollData.expression, rollData.rollTitle, rollData.rollType));
    });
}

function getRollData(rollButton){
    let expression = '';
    let rollType = 'custom';
    let rollTitle = 'AboveVTT';
    if($(rollButton).find('.ddbc-damage__value').length>0){
      expression = $(rollButton).find('.ddbc-damage__value').text().replace(/\s/g, '');
    }
    else if($(rollButton).find('.ddbc-signed-number').length>0){
      expression = `1d20${$(rollButton).find('.ddbc-signed-number').attr('aria-label').replace(/\s/g, '')}`;
    }
    else if($(rollButton).find('.ddbc-healing-icon').length > 0){
      expression = $(rollButton).text().replace(/\s/g, '');
    }
    else if($(rollButton).find('[class*="styles_numberDisplay"]').length > 0){
      expression = `1d20${$(rollButton).text().replace(/\s/g, '')}`;
    }
    else if($(rollButton).hasClass('avtt-roll-button')){
      expression = `${$(rollButton).attr('data-exp')}${$(rollButton).attr('data-mod')}`
      rollTitle = $(rollButton).attr('data-actiontype');
      rollType = $(rollButton).attr('data-rolltype');;
    }
    if($(rollButton).hasClass('avtt-roll-formula-button')){
      expression = DiceRoll.fromSlashCommand($(rollButton).attr('data-slash-command')).expression;
      let title = $(rollButton).attr('title').split(':');
      if(title != undefined && title[0] != undefined){
        rollTitle = title[0];
      }
      if(title != undefined && title[1] != undefined){
        rollType = title[1];
      }  
    }
    if(expression == ''){
      return {
        expression: undefined,
      }
    }

    let roll = new rpgDiceRoller.DiceRoll(expression); 
    let regExpression = new RegExp(`${expression.replace(/[+-]/g, '\\$&')}:\\s`);

    if($(rollButton).parents(`[class*='saving-throws-summary']`).length > 0){
      rollType = 'save'
      rollTitle = $(rollButton).closest(`.ddbc-saving-throws-summary__ability`).find('.ddbc-saving-throws-summary__ability-name abbr').text();
    } else if($(rollButton).parents(`[class*='ability-summary']`).length > 0){
      rollType = 'check'
      rollTitle = $(rollButton).closest(`.ddbc-ability-summary`).find('.ddbc-ability-summary__abbr').text();
    } else if($(rollButton).parents(`[class*='skills__col']`).length > 0){
      rollType = 'check';
      rollTitle = $(rollButton).closest(`.ct-skills__item`).find('.ct-skills__col--skill').text();
    } else if($(rollButton).parents(`[class*='initiative-box']`).length > 0 || $(rollButton).parents(`.ct-combat__summary-group--initiative`).length > 0){
      rollTitle = 'Initiative';
      rollType = 'roll'
    } else if($(rollButton).parents(`[class*='__damage']`).length > 0){
      rollType = 'damage'
      if($(rollButton).parents(`[class*='damage-effect__healing']`).length > 0){
        rollType = 'heal'
      }
    } else if($(rollButton).parents(`[class*='__tohit']`).length > 0){
      rollType = 'to hit'
    } 
    if(rollType == 'damage' || rollType == 'attack' || rollType == 'to hit' || rollType == 'heal'){
      if($(rollButton).parents(`.ddbc-combat-attack--spell`).length > 0){
        rollTitle = $(rollButton).closest(`.ddbc-combat-attack--spell`).find('[class*="styles_spellName"]').text();
      }
      else if($(rollButton).parents(`.ct-spells-spell`).length > 0){
        rollTitle = $(rollButton).closest(`.ct-spells-spell`).find('.ct-spells-spell__label').text();
      }
      else if($(rollButton).parents(`.ddbc-combat-action-attack-weapon`).length > 0){
        rollTitle = $(rollButton).closest(`.ddbc-combat-action-attack-weapon`).find('.ddbc-action-name').text();
      }
      else if($(rollButton).parents(`.ddbc-combat-attack--item`).length > 0){
        rollTitle = $(rollButton).closest(`.ddbc-combat-attack--item`).find('.ddbc-item-name').text();
      }
      else if($(rollButton).parents(`.ddbc-combat-action-attack-general`).length > 0){
        rollTitle = $(rollButton).closest(`.ddbc-combat-action-attack-general`).find('.ddbc-action-name').text();
      }
    }
    const modifier = (roll.rolls.length > 1 && expression.match(/[+-]\d*$/g, '')) ? `${roll.rolls[roll.rolls.length-2]}${roll.rolls[roll.rolls.length-1]}` : '';

    const followingText = $(rollButton)[0].nextSibling?.textContent?.trim()?.split(' ')[0]
    const damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined     

  
    return {
      roll: roll,
      expression: expression,
      rollType: rollType,
      rollTitle: rollTitle,
      modifier: modifier,
      regExpression: regExpression,
      damageType: damageType
    }
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


  inject_join_button_on_character_list_page();

  // observe window.location change. DDB dynamically changes the page when you click the View button instead of navigating to a new page

  window.oldHref = document.location.href;
  if (window.location_href_observer) {
    window.location_href_observer.disconnect();
    delete window.location_href_observer;
  }
  window.location_href_observer = new MutationObserver(function(mutationList, observer) {
    if (oldHref !== document.location.href) {
      if (!is_characters_list_page()) {
        console.log("Detected location change from", oldHref, "to", document.location.href);
        window.oldHref = document.location.href;
        init_characters_pages();
      }
      else{
        init_character_list_page_without_avtt()
      }
    }
    
  });
  window.location_href_observer.observe(document.querySelector("body"), { childList: true, subtree: true });
}

/** Called from our character sheet observer for Dice Roll formulae.
 * @param element the jquery element that we observed changes to */
function inject_dice_roll(element, clear=true) {
  if (element.find(".integrated-dice__container").length > 0) {
    console.debug("inject_dice_roll already has a button")
    return;
  }
  if(element.hasClass("ddbc-note-components__component--damage")){
    element.find('.ddbc-damage').toggleClass('above-vtt-visited ddb-note-roll', true);
  }
  else{
    const slashCommands = [...element.text().matchAll(multiDiceRollCommandRegex)];
    if (slashCommands.length === 0) return;

    console.debug("inject_dice_roll slashCommands", slashCommands);
    let updatedInnerHtml = element.text();
    for (const command of slashCommands) {
      try {
        let iconRoll = command[0].startsWith('/ir');
        let originalCommand = command[0];
        if(iconRoll){
          command[0] = command[0].replace(/^(\/ir)/i, '/r')
          command[1] = 'r';
        }
        const diceRoll = DiceRoll.fromSlashCommand(command[0], window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
        updatedInnerHtml = updatedInnerHtml.replace(originalCommand, `<button class='avtt-roll-formula-button integrated-dice__container ${iconRoll ? 'abovevtt-icon-roll' : ''}' title="${diceRoll.action?.toUpperCase() ?? "CUSTOM"}: ${diceRoll.rollType?.toUpperCase() ?? "ROLL"}" data-slash-command="${command[0]}">${diceRoll.expression}</button>`);
      } catch (error) {
        console.warn("inject_dice_roll failed to parse slash command. Removing the command to avoid infinite loop", command, command[0]);
        updatedInnerHtml = updatedInnerHtml.replace(command[0], '');
      }
    }
    if(clear == true){
      element.empty();
    }
    console.debug("inject_dice_roll updatedInnerHtml", updatedInnerHtml);
    element.append(updatedInnerHtml);
  }


  element.find(".integrated-dice__container, .ddb-note-roll").off('click.avttRoll').on('click.avttRoll', function(clickEvent) {
    clickEvent.stopPropagation();
    
    if($(this).hasClass('avtt-roll-formula-button')){
      const slashCommand = $(clickEvent.currentTarget).attr("data-slash-command");
      const diceRoll = DiceRoll.fromSlashCommand(slashCommand, window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
      window.diceRoller.roll(diceRoll);
    }
    else{
      let rollData = getRollData(this);
      

      window.diceRoller.roll(new DiceRoll(rollData.expression, rollData.rollTitle, rollData.rollType));
    }
   
  });
  element.find(`.integrated-dice__container, .ddb-note-roll`).off('contextmenu.rpg-roller').on('contextmenu.rpg-roller', function(e){
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
        damage_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, window.PLAYER_NAME, window.PLAYER_IMG)
          .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
      } else {
        standard_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, window.PLAYER_NAME, window.PLAYER_IMG)
          .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
      }
  })
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


    if(is_abovevtt_page()){
      if($('.dice-rolling-panel').length == 0 && window.diceWarning == undefined){
        showDiceDisabledWarning();
      }
      else if($('.dice-rolling-panel').length > 0){
        delete window.diceWarning;
      }
    }

    if(is_abovevtt_page()){
      const icons = documentToObserve.find(".ddbc-note-components__component--aoe-icon:not('.above-vtt-visited')");
      if (icons.length > 0) {
        icons.wrap(function() {
          if(!window.top?.CURRENT_SCENE_DATA?.fpsq)
            return;

          $(this).addClass("above-vtt-visited");
          const button = $("<button class='above-aoe integrated-dice__container'></button>");

          const spellContainer = $(this).closest('.ct-spells-spell')
          const name = spellContainer.find(".ddbc-spell-name").first().text()
          let color = "default"
          const feet = $(this).prev().find("[class*='styles_numberDisplay'] span:first-of-type").text();
          const dmgIcon = $(this).closest('.ct-spells-spell').find('.ddbc-damage-type-icon');
          if (dmgIcon.length == 1){
            color = dmgIcon.attr('class').split(' ').filter(d => d.startsWith('ddbc-damage-type-icon--'))[0].split('--')[1];
          }
          let shape = $(this).find('svg').first().attr('class').split(' ').filter(c => c.startsWith('ddbc-aoe-type-icon--'))[0].split('--')[1];
          shape = window.top.sanitize_aoe_shape(shape)
          button.attr("title", "Place area of effect token")
          button.attr("data-shape", shape);
          button.attr("data-style", color);
          button.attr("data-size", Math.round(feet / window.top.CURRENT_SCENE_DATA.fpsq));
          button.attr("data-name", name);

          // Players need the token side panel for this to work for them.
          // adjustments will be needed in enable_Draggable_token_creation when they do to make sure it works correctly
          // set_full_path(button, `${RootFolder.Aoe.path}/${shape} AoE`)
          // enable_draggable_token_creation(button);
          button.css("border-width","1px");
          button.click(function(e) {
            e.stopPropagation();
            // hide the sheet, and drop the token. Don't reopen the sheet because they probably  want to position the token right away
           
            window.top.hide_player_sheet();
            window.top.minimize_player_sheet();

            let options = window.top.build_aoe_token_options(color, shape, feet / window.top.CURRENT_SCENE_DATA.fpsq, name)
            if(name == 'Darkness' || name == 'Maddening Darkness' ){
              options = {
                ...options,
                darkness: true
              }
            }
            window.top.place_aoe_token_in_centre(options)
            // place_token_in_center_of_view only works for the DM
            // place_token_in_center_of_view(options)
          });
          
          return button;
        });
        console.log(`${icons.length} aoe spells discovered`);
      }
    }
   


    const spells = documentToObserve.find(".ct-spells-spell__action:not('.above-vtt-visited')") 
    if (spells.length > 0){
      $(spells).addClass("above-vtt-visited");
      $(spells).css({
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none',
      })
      spells.off().on('mouseover.color', function(e){
        if(e.shiftKey){
          $(this).toggleClass('advantageHover', true)
        }
        else if(e.ctrlKey || e.metaKey){
          $(this).toggleClass('disadvantageHover', true)
        }else{
          $(this).toggleClass('advantageHover', false)
          $(this).toggleClass('disadvantageHover', false)
        }
      })
      spells.off('mouseleave.color').on('mouseleave.color', function(e){
        $(this).toggleClass('advantageHover', false)
        $(this).toggleClass('disadvantageHover', false)
      })
      spells.off('click.multiroll').on('click.multiroll', function(e) {
        e.stopPropagation();
        $(this).closest('.ct-content-group').find(`.ct-slot-manager [aria-checked='false']`).first().click();

        let rollButtons = $(this).parent().find(`.integrated-dice__container:not('.avtt-roll-formula-button'):not('.above-vtt-visited'):not('.above-vtt-dice-visited'):not('.above-aoe'), .integrated-dice__container.abovevtt-icon-roll`);  
        let spellSave = $(this).parent().find(`.ct-spells-spell__save`);   
        let spellSaveText;
        if(spellSave.length>0){
          spellSaveText = `${spellSave.find('.ct-spells-spell__save-label').text().toUpperCase()} DC${spellSave.find('.ct-spells-spell__save-value').text()}`;
        }     
        for(let i = 0; i<rollButtons.length; i++){  
          let data = getRollData(rollButtons[i]);           
          let diceRoll;
          let damageTypeText = window.diceRoller.getDamageType(rollButtons[i]);
          if(data.expression != undefined){
                if (/^1d20[+-]([0-9]+)/g.test(data.expression)) {
                  if(e.altKey){
                    if(e.shiftKey){
                      diceRoll = new DiceRoll(`3d20kh1${data.modifier}`, data.rollTitle, data.rollType);
                    }
                     else if(e.ctrlKey || e.metaKey){
                      diceRoll = new DiceRoll(`3d20kl1${data.modifier}`, data.rollTitle, data.rollType);
                    }
                   }
                   else if(e.shiftKey){
                    diceRoll = new DiceRoll(`2d20kh1${data.modifier}`, data.rollTitle, data.rollType);
                   }
                   else if(e.ctrlKey || e.metaKey){
                    diceRoll = new DiceRoll(`2d20kl1${data.modifier}`, data.rollTitle, data.rollType);
                   }else{
                    diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType);
                   }
                }
                else{
                  diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType)
                }
            window.diceRoller.roll(diceRoll, true, window.CHARACTER_AVTT_SETTINGS.critRange ? window.CHARACTER_AVTT_SETTINGS.critRange : 20, window.CHARACTER_AVTT_SETTINGS.crit ? window.CHARACTER_AVTT_SETTINGS.crit : 2, spellSaveText, damageTypeText);
            spellSaveText = undefined;
          }
        }
        if(rollButtons.length == 0 && spellSaveText != undefined){
          let msgdata = {
            player: window.PLAYER_NAME,
              img: window.PLAYER_IMG,
              text: `<div class='custom-spell-save-text' style='font-weight:600'><span>Casts ${$(this).parent().find('[class*="styles_spellName"]').text()}: </span><span>${spellSaveText}</span></div>`,
              playerId: window.PLAYER_ID,
              sendTo: window.sendToTab 
          }
          if(is_abovevtt_page()){
            window.MB.inject_chat(msgdata)
          }
          else if(window.sendToTab != undefined){
            tabCommunicationChannel.postMessage({
              msgType: 'SendToGamelog',
              player: msgdata.player,
              img: msgdata.img,
              text: msgdata.text,
              sendTo: msgdata.sendTo
            });
          } 
        }     
      });
      if($(`style#advantageHover`).length == 0){
          $('body').append(`
            <style id='advantageHover'>
            .ddbc-combat-attack__icon.above-vtt-visited,
            .ct-spells-spell__action.above-vtt-visited .ct-spells-spell__at-will{
              border: 1px solid var(--theme-color, #ddd);
              border-radius: 5px;
              padding: 3px;
              margin: 0px 2px 0px 0px;
            }
            #site .advantageHover svg [fill="#b0b7bd"], 
            #site .advantageHover svg [fill="#242528"],
            #site .advantageHover svg .prefix__st0,
            #site .advantageHover svg .prefix__st2,
            #site .advantageHover svg .prefix__st4,
            #site .advantageHover svg [fill="#b0b7bd"] *, 
            #site .advantageHover svg [fill="#242528"] *{
              fill: #4fcf4f !important;
            }
            #site .advantageHover {
              color: #4fcf4f !important;
            }
            #site .disadvantageHover svg [fill="#b0b7bd"], 
            #site .disadvantageHover svg [fill="#242528"],
            #site .disadvantageHover svg .prefix__st0,
            #site .disadvantageHover svg .prefix__st2,
            #site .disadvantageHover svg .prefix__st4,
            #site .disadvantageHover svg [fill="#b0b7bd"] *, 
            #site .disadvantageHover svg [fill="#242528"] *{
                fill: #bb4242 !important;
            }
            #site .disadvantageHover {
              color: #4fcf4f !important;
            }
          </style>`);
      }
    }


    const spellDamageButtons = $(`.ddbc-spell-damage-effect .integrated-dice__container:not('.above-vtt-visited-spell-damage')`)
    if(spellDamageButtons.length > 0){
      $(spellDamageButtons).addClass("above-vtt-visited-spell-damage");
      spellDamageButtons.off('click.spellSave').on('click.spellSave', function(e){
        let spellSave = $(this).closest('.ddbc-combat-attack, .ct-spells-spell').find(`[class*='__save']`);   
        let spellSaveText;
        if(spellSave.length>0){
          spellSaveText = `${spellSave.find('[class*="__save-label"]').text().toUpperCase()} DC${spellSave.find('[class*="__save-value"]').text()}`;
        } 
        window.diceRoller.setPendingSpellSave(spellSaveText);
      })
    } 


    const damageButtons = $(`.ddb-note-roll:not('.above-vtt-visited-damage'), .integrated-dice__container:not('.above-vtt-visited-damage')`)
    if(damageButtons.length > 0){
      $(damageButtons).addClass("above-vtt-visited-damage");
      damageButtons.off('click.damageType').on('click.damageType', function(e){
        window.diceRoller.getDamageType(this);
      })
    } 


    const attackIcons = documentToObserve.find(".ddbc-combat-attack__icon:not('.above-vtt-visited')") 
    if (attackIcons.length > 0){
      if(!window.CHARACTER_AVTT_SETTINGS){
        window.CHARACTER_AVTT_SETTINGS = {}
      }
      if($('#icon-roll-optons').length == 0){
        let urlSplit = window.location.href.split("/");
        window.PLAYER_ID = urlSplit[urlSplit.length - 1].split('?')[0];
        window.CHARACTER_AVTT_SETTINGS = $.parseJSON(localStorage.getItem("CHARACTER_AVTT_SETTINGS" + window.PLAYER_ID));
        if(!(typeof window.CHARACTER_AVTT_SETTINGS === 'object') || window.CHARACTER_AVTT_SETTINGS === null){
          window.CHARACTER_AVTT_SETTINGS = {};
        }
        
        let settingOption = { 
            "versatile":{
              label: "Versatile rolls",
              type: "dropdown",
              options: [
                { value: "both", label: "Roll both damages", description: "Both 1 and 2 handed rolls will be rolled." },
                { value: "1", label: "1-Handed", description: "1-handed rolls will be rolled." },
                { value: "2", label: "2-Handed", description: "2-handed rolls will be rolled." }
              ],
              defaultValue: "both"
            },
            "crit":{
              label: "Crit Type",
              type: "dropdown",
              options:[
                { value: "0", label: "Double damage dice", description: "Doubles damage dice for crits." },
                { value: "1", label: "Perfect Crits", description: "Rolls the original dice and adds a max roll" },
                { value: "2", label: "Manual", description: "Rolls are not modified based on crit" },
                ],
              defaultValue: "0"
            },
            "critRange":{
              label: "Crit Range",
              type: "input",
              inputType: 'number',
              max: '20',
              min: '1',
              step: '1',
              defaultValue: "20"
            }
        }
        let options = $(`<div id='icon-roll-options' 
          style= 'z-index: 100000;
              width: 20%;
              height: 20%;
              width: 300px;
              height: 300px;
              position: fixed;
              display: none;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              background: var(--theme-background-solid);
              box-shadow: 0px 0px 4px var(--theme-contrast);
              padding-right: 5px;
              border-radius: 15px;
              border: 1px solid var(--theme-contrast);
              color: var(--theme-contrast);
            '>
        </div>`)
        let closeOptions = $(`<div id='close-icon-roll-options' 
          style='z-index: 99999;
            height: 100%;
            width: 100%;
            position: fixed;
            top: 0px;
            left: 0px;
            background: rgba(0, 0, 0, 0.4);
            display: none;'/>`)
        closeOptions.off().on('click', function(){
          options.css('display', 'none');
          closeOptions.css('display', 'none');
        })
        options.append(closeOptions);
        $('body').append(closeOptions, options);
        for(let i in settingOption){
            if(window.CHARACTER_AVTT_SETTINGS[i] == undefined){
              window.CHARACTER_AVTT_SETTINGS[i] = settingOption[i].defaultValue;
            }
           let wrapper = $(`
             <div id='${i}Setting' style='font-size: 14px;display:flex; margin: 10px 0px 10px 0px;align-items: center;' data-option-name="${i}">
               <div style="margin-right: 3px; margin-left: 10px; flex-grow: 1;font-weight: 700;font-size: 14px;">${settingOption[i].label}:</div>
             </div>
           `);
           let input;
           if(settingOption[i].type == 'dropdown'){
            input = $(`<select name="${i}" style='font-size: 14px; padding:0px'></select>`);

            for (const option of settingOption[i].options) {
              input.append(`<option value="${option.value}">${option.label}</option>`);
            }
            if (window.CHARACTER_AVTT_SETTINGS[i] !== undefined) {
              input.find(`option[value='${window.CHARACTER_AVTT_SETTINGS[i]}']`).attr('selected','selected');
            } 
            const currentlySetOption = settingOption[i].options.find(o => o.value === window.CHARACTER_AVTT_SETTINGS[i]) || settingOption[i].options.find(o => o.value === settingOption[i].defaultValue);
            input.change(function(event) {
              let newValue = event.target.value;
              window.CHARACTER_AVTT_SETTINGS[i] = newValue;
              localStorage.setItem("CHARACTER_AVTT_SETTINGS" + window.PLAYER_ID, JSON.stringify(window.CHARACTER_AVTT_SETTINGS));
              const updatedOption = settingOption[i].options.find(o => o.value === newValue) || settingOption[i].options.find(o => o.value === settingOption[i].defaultValue);
            });
           }
           else if(settingOption[i].type == 'input'){
            input = $(`<input min='${settingOption[i].min}' max='${settingOption[i].max}' step='${settingOption[i].step}' type='${settingOption[i].inputType}' value='${window.CHARACTER_AVTT_SETTINGS[i]}'/>`)
            input.change(function(event) {
              let newValue = event.target.value;
              window.CHARACTER_AVTT_SETTINGS[i] = newValue;
              localStorage.setItem("CHARACTER_AVTT_SETTINGS" + window.PLAYER_ID, JSON.stringify(window.CHARACTER_AVTT_SETTINGS));
            });
           }
            
            wrapper.append(input);

            options.append(wrapper)
        }
        let optionsInfo = $(`<div style='font-size: 11px; margin: 10px; align-items: flex-start; display: flex; flex-direction: column;'>
         <div style='margin-bottom:5px;'>• These settings only apply to rolls made with icons/cast buttons to the left of actions/spells.</div>
         <div style='margin-bottom:5px;'>• Perfect Crits is a normal roll + max roll on crit dice</div>
         <div style='margin-bottom:5px;'>• Hold Shift/Ctrl to roll ADV/DIS respectively.</div>
         <div style='margin-bottom:5px;'>• Hold Alt + Shift/Ctrl to roll Super ADV/DIS respectively</div>
          </div>`)
        options.append(optionsInfo);

      }
      if($('#avtt-icon-roll-span').length == 0){
        let settings = $(`<span id='avtt-icon-roll-span' style="font-weight: 700;font-size: 11px;">AVTT Icon Roll Settings <span style='font-size: 11px;'class="ddbc-manage-icon__icon "></span></span>`)
        settings.off().on('click', function(){
          $('#close-icon-roll-options').css('display', 'block');
          $('#icon-roll-options').css('display', 'block');
        }) 
        $('.ct-primary-box__tab--actions .ct-actions h2').after(settings)
      }

      $(attackIcons).addClass("above-vtt-visited");
      $(attackIcons).css({
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none',
      })
      attackIcons.off().on('mouseover.color', function(e){
        if(e.shiftKey){
          $(this).toggleClass('advantageHover', true)
        }
        else if(e.ctrlKey || e.metaKey){
          $(this).toggleClass('disadvantageHover', true)
        }else{
          $(this).toggleClass('advantageHover', false)
          $(this).toggleClass('disadvantageHover', false)
        }
      })
      attackIcons.off('mouseleave.color').on('mouseleave.color', function(e){
        $(this).toggleClass('advantageHover', false)
        $(this).toggleClass('disadvantageHover', false)
      })
      attackIcons.off('click.multiroll contextmenu.multiroll').on('click.multiroll contextmenu.multiroll', function(e) {
        e.preventDefault();
        e.stopPropagation();
        let versatileRoll = window.CHARACTER_AVTT_SETTINGS.versatile;
                     
        let rollButtons = $(this).parent().find(`.integrated-dice__container:not('.avtt-roll-formula-button'):not('.above-vtt-visited'):not('.above-vtt-dice-visited'):not('.above-aoe'), .integrated-dice__container.abovevtt-icon-roll`);
        let spellSave = $(this).parent().find(`[class*='__save']`);   
        let spellSaveText;
        if(spellSave.length>0){
          spellSaveText = `${spellSave.find('[class*="__save-label"]').text().toUpperCase()} DC${spellSave.find('[class*="__save-value"]').text()}`;
        }    

        for(let i = 0; i<rollButtons.length; i++){  
          let isVersatileDamage = $(rollButtons[i]).parent().hasClass('ddb-combat-item-attack__damage--is-versatile')
          if(isVersatileDamage && versatileRoll =='1'){
            if($(rollButtons[i]).parent().find('.integrated-dice__container:first-of-type')[0] != rollButtons[i])
              continue;
          }
          else if(isVersatileDamage && versatileRoll =='2'){
            if($(rollButtons[i]).parent().find('.integrated-dice__container:first-of-type')[0] == rollButtons[i])
              continue;
          }           
          let data = getRollData(rollButtons[i]);
          
          let damageTypeText = window.diceRoller.getDamageType(rollButtons[i]);
          let diceRoll;
          if(data.expression != undefined){
            if (/^1d20[+-]([0-9]+)/g.test(data.expression)) {
               if(e.altKey){
                  if(e.shiftKey){
                    diceRoll = new DiceRoll(`3d20kh1${data.modifier}`, data.rollTitle, data.rollType);
                   }
                   else if(e.ctrlKey || e.metaKey){
                    diceRoll = new DiceRoll(`3d20kl1${data.modifier}`, data.rollTitle, data.rollType);
                   }
               }
               else if(e.shiftKey){
                diceRoll = new DiceRoll(`2d20kh1${data.modifier}`, data.rollTitle, data.rollType);
               }
               else if(e.ctrlKey || e.metaKey){
                diceRoll = new DiceRoll(`2d20kl1${data.modifier}`, data.rollTitle, data.rollType);
               }else{
                diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType)
               }
            }
            else{
              diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType)
            }
            window.diceRoller.roll(diceRoll, true, window.CHARACTER_AVTT_SETTINGS.critRange ? window.CHARACTER_AVTT_SETTINGS.critRange : 20, window.CHARACTER_AVTT_SETTINGS.crit ? window.CHARACTER_AVTT_SETTINGS.crit : 2, spellSaveText, damageTypeText);
          }
        }   
        if(rollButtons.length == 0 && spellSaveText != undefined){
          let msgdata = {
            player:  window.PLAYER_NAME,
              img: window.PLAYER_IMG,
              text: `<div class='custom-spell-save-text' style='font-weight:600'><span>Casts ${$($(this).parent().find('[class*="__name"]>[class*="__label"]')[0]).text()}: </span><span>${spellSaveText}</span></div>`,
              playerId: window.PLAYER_ID,
              sendTo: window.sendToTab 
          }
          if(is_abovevtt_page()){
            window.MB.inject_chat(msgdata)
          }
          else if(window.sendToTab != undefined){
            tabCommunicationChannel.postMessage({
              msgType: 'SendToGamelog',
              player: msgdata.player,
              img: msgdata.img,
              text: msgdata.text,
              sendTo: msgdata.sendTo
            });
          }    
        }
      })
      if($(`style#advantageHover`).length == 0){
          $('body').append(`
            <style id='advantageHover'>
              menu[class*='styles_tabs']>li>button[class*='styles_tabButton']{
                  max-height: 26px;
              }
              menu[class*='styles_tabs']{
                  margin-bottom: 6px;
              }
              button.avtt-roll-button {
                  /* lifted from DDB encounter stat blocks  */
                  color: #b43c35;
                  border: 1px solid #b43c35;
                  border-radius: 4px;
                  background-color: #fff;
                  white-space: nowrap;
                  font-size: 14px;
                  font-weight: 600;
                  font-family: Roboto Condensed,Open Sans,Helvetica,sans-serif;
                  line-height: 18px;
                  letter-spacing: 1px;
                  padding: 1px 4px 0;
              }
              [class*='ct-primary-box__tab'] .ddbc-tab-options__body,
              .ct-primary-box__tab--actions .ddbc-tab-options__content{
                max-height: 551px;
              }
              
              .ct-description .ddbc-tab-options__content,
              .ct-notes .ddbc-tab-options__content,
              .ct-features .ddbc-tab-options__content{
                height: 569px;
              }
              
              .ct-primary-box .ct-creatures, 
              .ct-primary-box .ct-equipment, 
              .ct-primary-box .ct-extras, 
              .ct-primary-box .ct-spells,
              .ct-primary-box .ct-description,
              .ct-primary-box .ct-features,
              .ct-primary-box .ct-notes{
                height: 612px;
              }


              .ddbc-combat-attack__icon.above-vtt-visited,
              .ct-spells-spell__action.above-vtt-visited .ct-spells-spell__at-will,
              .ddb-note-roll{
                border: 1px solid var(--theme-color, #ddd);
                border-radius: 5px;
                display: flex;
                padding: 4px;
                margin: 0px 2px 0px 0px;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }

              .ddb-note-roll{
                display: inline-flex;
                flex-direction: row;
              }
              #site .advantageHover svg [fill="#b0b7bd"], 
              #site .advantageHover svg [fill="#242528"],
              #site .advantageHover svg .prefix__st0,
              #site .advantageHover svg .prefix__st2,
              #site .advantageHover svg .prefix__st4,
              #site .advantageHover svg [fill="#b0b7bd"] *, 
              #site .advantageHover svg [fill="#242528"] *{
                fill: #4fcf4f !important;
              }
              #site .advantageHover  span{
                color: #4fcf4f !important;
              }
              #site .disadvantageHover svg [fill="#b0b7bd"], 
              #site .disadvantageHover svg [fill="#242528"],
              #site .disadvantageHover svg .prefix__st0,
              #site .disadvantageHover svg .prefix__st2,
              #site .disadvantageHover svg .prefix__st4,
              #site .disadvantageHover svg [fill="#b0b7bd"] *, 
              #site .disadvantageHover svg [fill="#242528"] *{
                  fill: #bb4242 !important;
              }
              #site .disadvantageHover span{
                color: #bb4242 !important;
              }
          </style>`);
      }    
    }


    $(document).off('keydown.keypressAdv keyup.keypressAdv').on('keydown.keypressAdv keyup.keypressAdv', function(e) {
      let target = $('.ddbc-combat-attack__icon.above-vtt-visited:hover, .ct-spells-spell__action.above-vtt-visited:hover')
      if(e.shiftKey){
        $(target).toggleClass('advantageHover', true)
      }
      else if(e.ctrlKey || e.metaKey){
        $(target).toggleClass('disadvantageHover', true)
      }else{
        $(target).toggleClass('advantageHover', false)
        $(target).toggleClass('disadvantageHover', false)
      }
    });

    
    // handle updates to element changes that would strip our buttons
    mutationList.forEach(mutation => {
      try {
        let mutationTarget = $(mutation.target);
        const mutationParent = mutationTarget.parent();
         mutation.addedNodes.forEach(function(added_node){
          if($(added_node).hasClass('integrated-dice__container') || $(added_node).find('.integrated-dice__container')){
            if((!is_abovevtt_page() && (window.sendToTab !== undefined || window.sendToTabRPGRoller !== undefined)) || window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true || window.self != window.top){
              debounceConvertToRPGRoller();
            }
            else{
              $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller'); 
              $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller') 
            }         
          }
        })
        if(mutationTarget[0].nodeName == 'BUTTON' && mutationTarget.attr('name') == 'rpgRoller'){
          if((!is_abovevtt_page() && (window.sendToTab !== undefined || window.sendToTabRPGRoller !== undefined)) || window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true || window.self != window.top)
            debounceConvertToRPGRoller();
          else
            $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('click.rpg-roller');
            $(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`).off('contextmenu.rpg-roller')
        }
        
        mutation.removedNodes.forEach(function(removed_node) {
          if($(removed_node).hasClass("ct-game-log-pane")) {
            setTimeout(function() {
              change_sidbar_tab($("#switch_gamelog"), true);
              // deselect the gamelog tab since we're not technically showing the gamelog
              deselect_all_sidebar_tabs();
              $("#switch_gamelog svg").attr("class", "gamelog-button__icon");
            }, 0);
          }
        });
       

   
        if((mutationTarget.hasClass('.ajs-ok:not(.ajs-hidden)') || mutationTarget.find('.ajs-ok:not(.ajs-hidden)').length>0) && $('.alertify ~ div.alertify:not(.ajs-hidden):last-of-type').length>0 && !['Beyond 20 Settings', 'Beyond 20 Quick Settings', 'Beyond20 Hotkey'].includes($('.alertify ~ div.alertify:not(.ajs-hidden):last-of-type .ajs-header').text())){
           $('.alertify ~ div.alertify:not(.ajs-hidden):last-of-type .ajs-button.ajs-ok').click();
           $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last").click()
        }
        if (($(mutationTarget).hasClass('ct-sidebar__inner') || $(mutation.addedNodes[0]).hasClass('ct-creature-pane')) && mutationTarget.find('.ct-creature-pane').length>0) {
          scan_player_creature_pane(mutationTarget);
        }

        if (mutationTarget.closest(".ct-game-log-pane").length == 0 && mutationTarget.find('.ct-game-log-pane').length == 0 && mutationTarget.find(".ct-sidebar__header").length > 0 && mutationTarget.find(".ddbc-html-content").length > 0 && mutationTarget.find("#castbutton").length == 0) {
          // we explicitly don't want this to happen in `.ct-game-log-pane` because otherwise it will happen to the injected gamelog messages that we're trying to send here
          if(is_abovevtt_page() || (window.sendToTab !== undefined || window.sendToTabRPGRoller !== undefined)){
            if(mutationTarget.hasClass('ct-sidebar__pane-content')){
              inject_sidebar_send_to_gamelog_button(mutationTarget.children('div:first-of-type'));
            }else{
              inject_sidebar_send_to_gamelog_button(mutationTarget.find('.ct-sidebar__inner [class*="styles_content"]>div:first-of-type'));
            }
            
          }
        }
        else if(mutationTarget.closest(".ct-game-log-pane").length > 0){
          $('#castbutton').remove();
        }
         

        if(is_abovevtt_page()){
           
            // console.log(`sidebar inserted: ${event.target.classList}`);
          if (mutationTarget.hasClass('ct-sidebar__pane-content')){
             // The user clicked on something that shows details. Open the sidebar and show it
            show_sidebar();
        
          }
            
          if ($(mutation.addedNodes[0]).hasClass('ct-sidebar__pane-default') || $(mutation.addedNodes[0]).hasClass('ct-reset-pane')) {
            inject_chat_buttons();
            window.MB.reprocess_chat_message_history();
          }

        
          if(mutationTarget.hasClass("ddbc-tab-list__content")){
            if (!is_player_sheet_full_width()) {
              let height = `${$.position?.scrollbarWidth() ? 512 - $.position.scrollbarWidth() : 512}px`
              let searchableHeight = `${$.position?.scrollbarWidth() ? 563 - $.position.scrollbarWidth() : 563}px`
              let containerHeight = `${$.position?.scrollbarWidth() ? 563 - $.position.scrollbarWidth() : 563}px`
              $('.ct-primary-box').css({
                '--content-height': height,
                '--container-height': containerHeight,
                '--searchable-height': searchableHeight,
                "height": "610px",
              });
              // these need a little more space due to the filter search bar
              $(".ct-extras").css({ "height": "540px" });
              $(".ct-equipment").css({ "height": "540px" });
              $(".ct-spells").css({ "height": "540px" });
            }  
          }
        }


        switch (mutation.type) {
          case "attributes":
            if(
              mutationTarget.hasClass("ct-health-summary__deathsaves-mark") ||
              mutationTarget.hasClass("ct-health-manager__input") ||
              mutationTarget.hasClass('ct-status-summary-mobile__deathsaves-mark')
            ) {
              send_character_hp();
            } else if (mutationTarget.hasClass("ct-subsection--senses")) {
              send_senses();
            } else if (mutationTarget.hasClass("ct-status-summary-mobile__button--interactive") && mutationTarget.text() === "Inspiration") {
              character_sheet_changed({inspiration: mutationTarget.hasClass("ct-status-summary-mobile__button--active")});
            } else if(mutationParent.find('[class*="ct-extras"]').length>0 && mutationParent.find('.add-monster-token-to-vtt').length==0){
              debounce_add_extras();
            }

            break;
          case "childList":
            const firstRemoved = $(mutation.removedNodes[0]);
            if (mutationTarget.hasClass('ct-conditions-summary')) { // conditions update from sidebar
              const conditionsSet = read_conditions(documentToObserve);
              character_sheet_changed({conditions: conditionsSet});
            } else if(firstRemoved.hasClass('ct-health-summary__hp-item') && firstRemoved.children('#ct-health-summary-max-label').length){ // this is to catch if the player just died look at the removed node to get value - to prevent 0/0 hp
              let maxhp = parseInt(firstRemoved.find(`.ct-health-summary__hp-number`).text());
              send_character_hp(maxhp);
            }else if (
              ($(mutation.addedNodes[0]).hasClass('ct-health-summary__hp-number')) ||
              (firstRemoved.hasClass('ct-health-summary__hp-item-input') && mutationTarget.hasClass('ct-health-summary__hp-item-content')) ||
              (firstRemoved.hasClass('ct-health-summary__deathsaves-label') && mutationTarget.hasClass('ct-health-summary__hp-item')) ||
              mutationTarget.hasClass('ct-health-summary__deathsaves') ||
              mutationTarget.hasClass('ct-health-summary__deathsaves-mark')
            ) {
              send_character_hp();
            }
            else if(mutationTarget.hasClass('ct-inspiration__status') || mutationTarget.parents('.ct-quick-info__inspiration').length > 0) {
              character_sheet_changed({
                inspiration: mutationTarget.hasClass('ct-inspiration__status--active') || mutationTarget.find('.ddbc-inspiration-token-svg').length>0
              });
            } else if (mutationTarget.hasClass("ct-sense-manage-pane__senses")) {
              send_senses();
            } else if (mutationTarget.hasClass("ct-speed-manage-pane")) {
              send_movement_speeds(documentToObserve, mutationTarget);
            } else if($(mutation.addedNodes[0]).hasClass('ct-extra-row') || ($(mutation.addedNodes[0]).hasClass('ct-content-group') && $('.ct-extra-row').length>0)){
              debounce_add_extras();
            }

            // TODO: check for class or something. We don't need to do this on every mutation
            mutation.addedNodes.forEach(node => {
              if (typeof node.data === "string" && node.data.match(multiDiceRollCommandRegex)?.[0]) {
                try {
                  inject_dice_roll(mutationTarget);
                } catch (error) {
                  console.log("inject_dice_roll failed to process element", error);
                }
              }
            });
            if (mutationTarget.hasClass("ct-sidebar__pane-content")) {
              mutation.removedNodes.forEach(node => {
                if ($(node).hasClass("ct-speed-manage-pane")) {
                  // they just closed the movement speed sidebar panel so
                  send_movement_speeds(documentToObserve, $(node));
                }
              });
            }
            break;
          case "characterData":

              if (mutationParent.parent().hasClass('ct-health-summary__hp-item-content') ||
                mutationParent.hasClass("ct-health-manager__health-item-value") 
              ) {
                send_character_hp();          
              } else if (mutationParent.hasClass('ddbc-armor-class-box__value')) { // ac update from sidebar
                character_sheet_changed({armorClass: parseInt(documentToObserve.find(`.ddbc-armor-class-box__value`).text())});
              }
              else if ($(mutationTarget[0].nextElementSibling).hasClass('ct-armor-manage-pane__heading-extra')) {
                character_sheet_changed({armorClass: parseInt(mutationTarget[0].data)});
              }
              else if(mutationTarget.parents('.ddbc-ability-summary').length>0 || 
                mutationTarget.parents('.ddbc-saving-throws-summary__ability-modifier').length>0
              ){
                send_abilities();
              }
            if (typeof mutation.target.data === "string") {
              if (mutation.target.data.match(multiDiceRollCommandRegex)?.[0]) {
                try {
                  inject_dice_roll(mutationTarget);
                } catch (error) {
                  console.log("inject_dice_roll failed to process element", error);
                }
              } else if (mutation.target.parentElement.classList.contains("ddb-character-app-sn0l9p") || (mutationParent.attr('class').includes('ddb-character-app') && mutationParent.parent().hasClass('ddbc-character-tidbits__heading'))) {
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
    console.warn(`set_window_name_and_image has failed after 30 attempts. window.PLAYER_NAME: ${window.PLAYER_NAME}, window.PLAYER_IMG: ${window.PLAYER_IMG}`);
    delete window.set_window_name_and_image_attempts;
    if (is_abovevtt_page()) {
      showErrorMessage(
        new Error("set_window_name_and_image has failed after 30 attempts"),
        "This can happen if your character is not finished yet. Please make sure your character is finished. If your character is finished, try the following",
        ``,
        `Navigate to the <a href="${window.location.href.replace(window.location.search, '')}/builder/home/basic" target="_blank">Edit Character</a> page`,
        `&nbsp;&nbsp;&nbsp;&nbsp;1. change the avatar image`,
        `&nbsp;&nbsp;&nbsp;&nbsp;2. enable homebrew`,
        `&nbsp;&nbsp;&nbsp;&nbsp;3. make your character public`,
        `&nbsp;&nbsp;&nbsp;&nbsp;4. make sure your character is finished, and save your character`,
        '',
        "After you save your character, you can change the avatar image back to what it was before."
      );
    }
    return;
  }

  console.debug("set_window_name_and_image");

  window.PLAYER_NAME = $(".ddbc-character-tidbits__heading [class*=ddb-character-app]").text();
  try {
    // This should be just fine, but catch any parsing errors just in case
    window.PLAYER_IMG = get_higher_res_url($(".ddbc-character-avatar__portrait").css("background-image").slice(4, -1).replace(/"/g, "")) || defaultAvatarUrl;
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
  if (!is_characters_page() || window.self != window.top) return; // wrong page, dude
  if ($(".ddbc-campaign-summary").length === 0) return;     // we don't have any campaign data
  if ($("#avtt-character-join-button").length > 0) return;  // we already injected a button

  const desktopPosition = $(".ct-character-sheet-desktop > .ct-character-header-desktop > .ct-character-header-desktop__group--gap");
  const tabletPosition = $(".ct-character-sheet-tablet .ct-main-tablet > .ct-main-tablet__campaign");
  const mobilePosition = $(".ct-character-sheet-mobile .ct-main-mobile > .ct-main-mobile__campaign");

  if ( $(`#character-header-adjust-style`).length == 0){
      $(`body`).append($(`<style id='character-header-adjust-style'>
        .ct-character-header-desktop__group--beyond20>.ct-beyond20-settings-button span,
        .ct-character-header-desktop__group--share span.ct-character-header-desktop__button-label
        {
          display:none;
        }
        .ct-beyond20-settings-button{
          padding: 4px 6px;
        }
        .ct-character-header-desktop__group--share>.ct-character-header-desktop__button{
          padding: 6px 6px;
        }
        .ct-character-header-desktop__button{
          margin-right: 12px;
        }
        .ddbc-character-tidbits{
          min-width: 0px !important;
        }
        </style>`));
  }



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
              if(window.PeerManager != undefined)
                window.PeerManager.send(PeerEvent.preferencesChange());
              character_sheet_changed({
                decorations: {
                  characterTheme:{ 
                    themeColor: newColor
                  }
                }
              });
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
        character_sheet_changed({imgsrc: updatedUrl,
                                avatarUrl: updatedUrl,
                                image: updatedUrl});
      } catch { }
    });
  });
  window.character_image_observer.observe(document.querySelector(".ddbc-character-avatar__portrait"), { attributeFilter: ["style"] });
}

function update_window_color(colorValue) {
  let pc = find_pc_by_player_id(my_player_id(), false);
  if (pc?.decorations?.characterTheme?.themeColor) {
    pc.decorations.characterTheme.themeColor = colorValue;
    find_and_set_player_color();
  }
}

function read_pc_object_from_character_sheet(playerId, container = $(document)) {
  if (!is_abovevtt_page()) {
    // window.CAMPAIGN_INFO is defined in Startup.js
    console.warn("read_pc_object_from_character_sheet is currently only supported when AVTT is running");
    return undefined
  }
  if (!playerId || !container || container.length === 0) {
    console.warn("read_pc_object_from_character_sheet expected a playerId and container, but received", playerId, container);
    return undefined;
  }
  let pc = find_pc_by_player_id(playerId, true); // allow a default object here. We're about to overwrite most of it anyway

  try {
    pc.abilities = read_abilities(container);
    pc.armorClass = parseInt(container.find(`.ddbc-armor-class-box__value`).text()) || parseInt(container.find(".ct-combat-mobile__extra--ac .ct-combat-mobile__extra-value").text()) || 0;
    pc.campaign = window.CAMPAIGN_INFO;
    pc.characterId = playerId;
    pc.conditions = read_conditions(container);
    pc.deathSaveInfo = read_death_save_info(container);
    // TODO: figure out how to read decorations
    pc.hitPointInfo = {
      current: read_current_hp(container),
      maximum: read_max_hp(pc?.hitPointInfo?.maximum, container),
      temp: read_temp_hp(container)
    };
    // TODO: immunities?
    // TODO: initiativeBonus?
    pc.inspiration = read_inspiration(container);
    pc.name = container.find(".ct-character-header-info__content [class*='ddb-character-app']").text();
    const pb = parseInt(container.find(".ct-proficiency-bonus-box__value").text());
    if (pb) {
      pc.proficiencyBonus = pb;
    }
    let readSpeeds = read_speeds(container) || [];
    if (readSpeeds) {
      pc.speeds?.forEach(pcSpeed => {
        const updatedSpeedIndex = readSpeeds.findIndex(us => us.name === pcSpeed.name);
        if (updatedSpeedIndex < 0) { // couldn't read this speed so inject the pc.speeds value
          readSpeeds.push(pcSpeed);
        }
      })
    }
    pc = {...pc, ...read_senses(container)};
  } catch (error) {
    console.error("read_pc_object_from_character_sheet caught an error", error);
  }
  update_pc_with_data(playerId, pc);
  return pc;
}
