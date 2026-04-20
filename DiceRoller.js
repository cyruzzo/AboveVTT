/** DiceRoller.js - DDB dice rolling functions */

const allDiceRegex = /\d+d(?:100|20|12|10|8|6|4)((?:kh|kl|ro(<|<=|>|>=|=)|min)\d+)*|^\d+|^[-+]?\d+[+-]\d+$/gi; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
const rpgDiceRegex = /\d+d(?:\d+)((?:kh|kl|ro(<|<=|>|>=|=)|min)\d+)*|^\d+|^[-+]?\d+[+-]\d+$/gi; 
const validExpressionRegex = /^[dkhlromin<=>\s\d+\-\(\)]*$/gi; // any of these [d, kh, kl, spaces, numbers, +, -] // Should we support [*, /] ?
const validModifierSubstitutions = /(?<!\w)(str|dex|con|int|wis|cha|pb)(?!\w)/gi // case-insensitive shorthand for stat modifiers as long as there are no letters before or after the match. For example `int` and `STR` would match, but `mint` or `strong` would not match.
const diceRollCommandRegex = /^\/(r|roll|save|hit|dmg|skill|heal)\s/gi; // matches only the slash command. EG: `/r 1d20` would only match `/r`
const multiDiceRollCommandRegex = /\/(ir|r|roll|save|hit|dmg|skill|heal) [^\/]*/gi; // globally matches the full command. EG: `note: /r 1d20 /r2d4` would find ['/r 1d20', '/r2d4']
const allowedExpressionCharactersRegex = /^(d\d|\d+d\d+|kh\d+|kl\d+|ro(<|<=|>|>=|=)\d+|min\d+|\d+|\s+|[+-]\s*STR|[+-]\s*DEX|[+-]\s*CON|[+-]\s*INT|[+-]\s*WIS|[+-]\s*CHA|[+-]\s*PB|\+|-)*/gi; // this is explicitly different from validExpressionRegex. This matches an expression at the beginning of a string while validExpressionRegex requires the entire string to match. +/- at the end so it includes modifiers first

class DiceRoll {
    // `${action}: ${rollType}` is how the gamelog message is displayed

    // don't allow changing these. They can only be set from within the constructor.
    #fullExpression = "";
    get expression() { return this.#fullExpression; }
    set expression(fullExpression) {this.#fullExpression = fullExpression}
    #individualDiceExpressions = [];
    get diceExpressions() { return this.#individualDiceExpressions; }

    #calculatedExpressionConstant = 0;
    get calculatedConstant() { return this.#calculatedExpressionConstant; }

    #separatedDiceToRoll = {};
    get diceToRoll() { return this.#separatedDiceToRoll; }

    // these can be changed after the object is constructed.

    #diceAction;        // "Rapier", "Fire Bolt", etc. defaults to "custom"
    get action() { return this.#diceAction }
    set action(newAction) {
        if (typeof newAction !== "string" || (/^\s*$/).test(newAction)) { // any empty strings or strings with only whitespace should be set to undefined
            this.#diceAction = undefined;
        } else {
            this.#diceAction = newAction.trim();
        }
    }
    #diceRollType; // "To Hit", "Damage", etc. defaults to "roll"
    get rollType() { return this.#diceRollType }
    set rollType(newRollType) {
        if (typeof newRollType !== "string") {
            this.#diceRollType = undefined;
            return;
        }
        try {
            let alteredRollType = newRollType.trim().toLowerCase().replace("-", " ");
            const validRollTypes = ["to hit", "damage", "save", "check", "heal", "reroll", "initiative", "attack", "roll", "recharge"];
            if (validRollTypes.includes(alteredRollType)) {
                this.#diceRollType = alteredRollType;
            } else {
                console.warn(`not setting rollType. Expected one of ${JSON.stringify(validRollTypes)}, but received "${newRollType}"`);
            }
        } catch (error) {
            console.warn("DiceRoll set rollType failed", error);
            this.#diceRollType = undefined;
        }
    }

    name;       // monster name, player name, etc.
    avatarUrl;  // the url of the image to render in the gamelog message

    entityType; // "character", "monster", etc
    entityId;   // the id of the character, monster, etc

    #sendTo;     // "Self", "Everyone", undefined.
    get sendToOverride() { return this.#sendTo }
    set sendToOverride(newValue) {
        if (["Self", "Everyone", "DungeonMaster", "DM"].includes(newValue)) {
            this.#sendTo = newValue;
        } else {
            this.#sendTo = undefined;
        }
    }


    // DDB parses the object after we give it back to them.
    // expressions that are more complex tend to have incorrect expressions displayed because DDB handles that.
    // We need to adjust the outgoing message according to how we expect DDB to parse it
    isComplex() {
        if (this.diceExpressions.length !== 1) {
            return true; // more than 1 expression messes with the parsing that DDB does
        }

        if (this.expression.includes("ro")) {
            return true; // reroll requires us to roll double the amount of dice, but then strip half the results based on the specified reroll rule
        }

        if (this.expression.includes("min")) {
            return true; // min requires setting a minimum result
        }

        if (this.expression.indexOf(this.diceExpressions[0]) !== 0) {
            return true; // 1-1d4 messes with the parsing that DDB does, but 1d4-1 is just fine
        }

        let advantageMatch = this.diceExpressions[0].match(/kh\d+/g);
        if (this.diceExpressions[0].split('d')[0] > 2 && advantageMatch?.length == 1 || advantageMatch?.length > 1 || (advantageMatch?.length === 1 && !this.diceExpressions[0].endsWith("kh1"))) {
            // anything other than kh1 is complex. Such as kh10 or kh2
            return true;
        }
        let disAdvantageMatch = this.diceExpressions[0].match(/kl\d+/g);
        if (this.diceExpressions[0].split('d')[0] > 2 && disAdvantageMatch?.length == 1 || disAdvantageMatch?.length > 1 || (disAdvantageMatch?.length === 1 && !this.diceExpressions[0].endsWith("kl1"))) {
            // anything other than kl1 is complex. Such as kl10 or kl2
            return true;
        }



        // not sure what else to look for yet, but this appears to be something like "1d20", "1d20-1", "2d20kh1+3". all of which are correctly parsed by DDB
        return false;
    }

    isAdvantage() {
        return !this.isComplex() && this.expression.startsWith("2d") && this.diceExpressions[0].endsWith("kh1");
    }

    isDisadvantage() {
        return !this.isComplex() && this.expression.startsWith("2d") && this.diceExpressions[0].endsWith("kl1");
    }

    /**
     *
     * @param expression {string} dice expression to parse and roll. EG: "1d20+4". This is the only required value
     * @param action {string|undefined} the action this roll represents. EG: "Rapier", "Fire Bolt", "dex", etc. defaults to "custom"
     * @param rollType {string|undefined} the type of roll this is. EG: "to hit", "damage", "save" etc. defaults to "roll"
     * @param name {string|undefined} the name of the creature/player associated with this roll. This is displayed above the roll box in the gamelog. The character sheet defaults to the PC.name, the encounters page defaults to ""
     * @param avatarUrl {string|undefined} the url for the image to be displayed in the gamelog. This is displayed to the left of the roll box in the gamelog. The character sheet defaults to the PC.avatar, the encounters page defaults to ""
     * @param entityType {string|undefined} the type of entity associated with this roll. EG: "character", "monster", "user" etc. Generic rolls from the character sheet defaults to "character", generic rolls from the encounters page defaults to "user"
     * @param entityId {string|undefined} the id of the entity associated with this roll. If {entityType} is "character" this should be the id for that character. If {entityType} is "monster" this should be the id for that monster. If {entityType} is "user" this should be the id for that user.
     * @param sendToOverride {string|undefined} if undefined, the roll will go to whatever the gamelog is set to.
     */
    constructor(expression, action = undefined, rollType = undefined, name = undefined, avatarUrl = undefined, entityType = undefined, entityId = undefined, sendToOverride = undefined, damageType = undefined) {

        let parsedExpression = expression.toLowerCase().replaceAll(/\s+/g, "").replaceAll(/^(d\d+)|([+-])(d\d+)/g, '$21$1$3');; // remove all spaces and 1's to d6 -> 1d6, d8 -> 1d8 etc.

        if (!parsedExpression.match(validExpressionRegex)) {
            console.warn("Not parsing expression because it contains an invalid character", expression);          
            chat_command_error();
            throw new Error("Invalid Expression");
        }

        // find all dice expressions in the expression. converts "1d20+1d4" to ["1d20", "1d4"]
        let separateDiceExpressions = parsedExpression.match(allDiceRegex)
        if(window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true){
            separateDiceExpressions = parsedExpression.match(rpgDiceRegex);
        }
        if (!separateDiceExpressions) {
            console.warn("Not parsing expression because there are no valid dice expressions within it", expression);
            chat_command_error();
            throw new Error("Invalid Expression");
        }
         $('.chat-text-wrapper').removeClass('invalidExpression');

        this.#fullExpression = parsedExpression;
        this.#individualDiceExpressions = separateDiceExpressions;

        this.action = action;
        this.rollType = rollType;
        this.sendToOverride = sendToOverride || gamelog_send_to_text();
        this.damageType = damageType;
        if (name) this.name = name;
        if (avatarUrl) this.avatarUrl = avatarUrl;
        if (entityType) this.entityType = entityType;
        if (entityId) this.entityId = entityId;

        // figure out what constants we need to add or subtract. For example 1d20+4 has a constant of +4. 1d20+1+1d4-3 has a constant of -2/
        let strippedExpression = this.expression.toString() // make sure we use a copy of it
        this.#individualDiceExpressions.forEach(diceExpression => {
            strippedExpression = strippedExpression.replace(diceExpression, "");
        });
        let constantEquation = strippedExpression
            .match(/[+\-]\d+/g) // find any numbers preceded by [+, -] // Should we support [*, /] ?
            ?.reduce((total, current) => total + current); // combine anything we find into a single string; ex: "-2+3"
        if (constantEquation) {
            constantEquation = constantEquation.replaceAll(/(\D)0+(\d)/gi, '$1$2');
            let calculatedConstant = parseInt(eval(constantEquation.toString())); // execute the equation to get a single number
            if (!isNaN(calculatedConstant)) {
                this.#calculatedExpressionConstant = calculatedConstant;
            }
        }

        // figure out how many of each DiceType we need to roll
        this.#individualDiceExpressions.forEach(diceExpression => {
            let diceType = diceExpression.match(/d\d+/g);
            let numberOfDice = parseInt(diceExpression.split("d")[0]);
            if (diceExpression.includes("ro")) {
                console.debug("diceExpression: ", diceExpression, ", includes reroll so we're doubling the number of dice for", diceType, ", numberOfDice before doubling: ", numberOfDice);
                numberOfDice = numberOfDice * 2;
            }
            console.debug("diceExpression: ", diceExpression, ", diceType: ", diceType, ", numberOfDice: ", numberOfDice);
            if (this.#separatedDiceToRoll[diceType] === undefined) {
                this.#separatedDiceToRoll[diceType] = numberOfDice;
            } else {
                this.#separatedDiceToRoll[diceType] += numberOfDice;
            }
        });
    }

    /**
     * @param slashCommandText {string} the slash command to parse and roll. EG: "/hit 2d20kh1+4 Shortsword". This is the only required value
     * @param name {string|undefined} the name of the creature/player associated with this roll. This is displayed above the roll box in the gamelog. The character sheet defaults to the PC.name, the encounters page defaults to ""
     * @param avatarUrl {string|undefined} the url for the image to be displayed in the gamelog. This is displayed to the left of the roll box in the gamelog. The character sheet defaults to the PC.avatar, the encounters page defaults to ""
     * @param entityType {string|undefined} the type of entity associated with this roll. EG: "character", "monster", "user" etc. Generic rolls from the character sheet defaults to "character", generic rolls from the encounters page defaults to "user"
     * @param entityId {string|undefined} the id of the entity associated with this roll. If {entityType} is "character" this should be the id for that character. If {entityType} is "monster" this should be the id for that monster. If {entityType} is "user" this should be the id for that user.
     * @param sendToOverride {string|undefined} if undefined, the roll will go to whatever the gamelog is set to.
     */
    static fromSlashCommand(slashCommandText, name = undefined, avatarUrl = undefined, entityType = undefined, entityId = undefined, sendToOverride = undefined) {
        let modifiedSlashCommand = replaceModifiersInSlashCommand(slashCommandText, entityType, entityId);
        let slashCommand = modifiedSlashCommand.match(diceRollCommandRegex)?.[0];
        let expression = modifiedSlashCommand.replace(diceRollCommandRegex, "").match(allowedExpressionCharactersRegex)?.[0];
        let action = modifiedSlashCommand.replace(diceRollCommandRegex, "").replace(allowedExpressionCharactersRegex, "");
        console.debug("DiceRoll.fromSlashCommand text: ", slashCommandText, ", slashCommand:", slashCommand, ", expression: ", expression, ", action: ", action);
        let rollType = undefined;
        let damageType = undefined;
        if (slashCommand.startsWith("/r")) {
            // /r and /roll allow users to set both the action and the rollType by separating them with `:` so try to parse that out
            [action, rollType] = action.split(":") || [undefined, undefined];
            const damageRegex = /([\s]+)?damage/gi;
            if(rollType?.match(damageRegex)){
                [damageType, rollType] = [rollType.replaceAll(damageRegex, ''), 'damage'];
            }
        } else if (slashCommand.startsWith("/hit")) {
            rollType = "to hit";
        } else if (slashCommand.startsWith("/dmg")) {
            [action, damageType] = action.split(":") || [action, undefined];
            rollType = "damage";
        } else if (slashCommand.startsWith("/skill")) {
            rollType = "check";
        } else if (slashCommand.startsWith("/save")) {
            rollType = "save";
        } else if (slashCommand.startsWith("/heal")) {
            rollType = "heal";
        }
        return new DiceRoll(expression, action, rollType, name, avatarUrl, entityType, entityId, sendToOverride, damageType);
    }
}
function getRollData(rollButton){
    let expression = '';
    let rollType = 'custom';
    let rollTitle = 'AboveVTT';
    const $rollButton = $(rollButton);
    let damageType = window.diceRoller.getDamageType(rollButton);
    if($rollButton.find('.ddbc-damage__value, .ct-spell-caster__modifier-amount').length>0){
      expression = $rollButton.find('.ddbc-damage__value, .ct-spell-caster__modifier-amount').text();
      const damageRollRegex = /([:\s>]|^)(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)([\.\):\s<,]|$)|^\d+$/gi
      expression = `${expression.match(damageRollRegex)[0].replace(/\s*/gi, '')}`

      if($rollButton.find('.ct-spell-caster__modifier-amount').length>0){
        rollType ='damage';
        rollTitle = $rollButton.closest('[class*="styles_content"]')?.find('[class*="styles_spellName"]')?.text() || rollTitle;
        damageType = $rollButton.next()?.find('[class*="damage-type"][aria-label]')?.attr('aria-label')?.replace(' damage', '') || damageType;
      }
    }
    else if($rollButton.find('.ddbc-signed-number').length>0){
      expression = `1d20${$rollButton.find('.ddbc-signed-number').attr('aria-label').replace(/\s/g, '')}`;
    }
    else if($rollButton.find('.ddbc-healing-icon').length > 0){
      expression = $rollButton.text().replace(/\s/g, '');
    }
    else if($rollButton.find('[class*="styles_numberDisplay"]').length > 0){
      expression = `1d20${$rollButton.text().replace(/\s/g, '')}`;
    }
    else if($rollButton.closest('.ddbc-ability-summary__primary').length>0){
        expression = `1d20${$rollButton.closest('.ddbc-ability-summary').find('[class*="styles_numberDisplay"]').text().replace(/\s/g, '')}`;
    }
    else if($rollButton.hasClass('avtt-roll-button')){
      expression = `${$rollButton.attr('data-exp')}${$rollButton.attr('data-mod')}`
      rollTitle = $rollButton.attr('data-actiontype');
      rollType = $rollButton.attr('data-rolltype');
    }
    if($rollButton.hasClass('avtt-roll-formula-button')){
      let slashCommand = DiceRoll.fromSlashCommand($rollButton.attr('data-slash-command'))
      expression = slashCommand.expression;
      damageType = slashCommand.damageType;
      let title = $rollButton.attr('title').split(':');
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


    if($rollButton.parents(`[class*='saving-throws-summary']`).length > 0){
      rollType = 'save'
      rollTitle = $rollButton.closest(`.ddbc-saving-throws-summary__ability`).find('.ddbc-saving-throws-summary__ability-name abbr').text();
    } else if($rollButton.parents(`[class*='ability-summary']`).length > 0){
      rollType = 'check'
      rollTitle = $rollButton.closest(`.ddbc-ability-summary`).find('.ddbc-ability-summary__abbr').text();
    } else if($rollButton.parents(`[class*='skills__col']`).length > 0){
      rollType = 'check';
      rollTitle = $rollButton.closest(`.ct-skills__item`).find('.ct-skills__col--skill').text();
    } else if($rollButton.parents(`[class*='initiative-box'],  .ct-combat-tablet__extra--initiative, .ct-combat__summary-group--initiative`).length > 0 || $rollButton.closest('[class*="styles_boxMobile"]').find('[class*="styles_labelMobile"]').text() == "Initiative"){
      rollTitle = 'Initiative';
      rollType = 'check'
    } else if($rollButton.parents(`[class*='__damage']`).length > 0){
      rollType = 'damage'
      if($rollButton.parents(`[class*='damage-effect__healing']`).length > 0){
        rollType = 'heal'
      }
    } else if($rollButton.parents(`[class*='__tohit']`).length > 0){
      rollType = 'to hit'
    } 
    if(rollType == 'damage' || rollType == 'attack' || rollType == 'to hit' || rollType == 'heal'){
      if($rollButton.parents(`.ddbc-combat-attack--spell`).length > 0){
        rollTitle = $rollButton.closest(`.ddbc-combat-attack--spell`).find('[class*="styles_spellName"]').text();
      }
      else if($rollButton.parents(`.ct-spells-spell`).length > 0){
        rollTitle = $rollButton.closest(`.ct-spells-spell`).find('[class*="styles_spellName"]').text();
      }
      else if($rollButton.parents(`.ddbc-combat-action-attack-weapon`).length > 0){
        rollTitle = $rollButton.closest(`.ddbc-combat-action-attack-weapon`).find('.ddbc-action-name, [class*="styles_actionName"]').text();
      }
      else if($rollButton.parents(`.ddbc-combat-attack--item`).length > 0){
        rollTitle = $rollButton.closest(`.ddbc-combat-attack--item`).find('.ddbc-item-name, [class*="styles_itemName"]').text();
      }
      else if($rollButton.parents(`.ddbc-combat-action-attack-general`).length > 0){
        rollTitle = $rollButton.closest(`.ddbc-combat-action-attack-general`).find('.ddbc-action-name, [class*="styles_actionName"]').text();
      }
    }
    
    expression = adjustRollWithRollBuffs(expression, rollType, $rollButton);

    let roll = new rpgDiceRoller.DiceRoll(expression); 
    let regExpression = new RegExp(`${expression.replace(/[+-]/g, '\\$&')}:\\s`);
    let modifier = (roll.rolls.length > 1 && expression.match(/[+-]\d*$/g)) ? `${roll.rolls[roll.rolls.length-2]}${roll.rolls[roll.rolls.length-1]}` : '';

  


    const followingText = $rollButton[0].nextSibling?.textContent?.trim()?.split(' ')[0]
    damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : damageType;     


    const spellSave = window.diceRoller.getSpellSave(rollButton);

    

    return {
      roll: roll,
      expression: expression,
      rollType: rollType,
      rollTitle: rollTitle,
      modifier: modifier,
      regExpression: regExpression,
      damageType,
      spellSave
    }
}
//window.CHARACTER_AVTT_SETTINGS roll type keys and rollBuff keys
//To do: standardize these to be the same between all
const rollTypeKeys = Object.freeze({
    'damage': {'char': 'damageRoll', 'buff':'dmg'},
    'save': { 'char': 'saveRoll', 'buff':'save'},
    'to hit': { 'char': 'hitRoll', 'buff':'tohit'},
    'attack': { 'char': 'hitRoll', 'buff':'tohit'},
    'tohit': { 'char': 'hitRoll', 'buff':'tohit'},
    'check': { 'char': 'checkRoll', 'buff':'check'}
});

function adjustRollWithRollBuffs(expression, rollType, $rollButton){
    if ($rollButton.closest('.ct-character-sheet__inner').length == 0)
        return expression;
    
    const rollBuffs = window.rollBuffs;
    const charRollKey = rollTypeKeys[rollType]?.char;
    const rollBuffKey = rollTypeKeys[rollType]?.buff || rollType;
    if(charRollKey != undefined ){
        const addToRoll = window.CHARACTER_AVTT_SETTINGS?.[charRollKey]?.replace('PB', getPB());// used to check for custom entered numbers in character roll settings
        const addToRollValid = (addToRoll?.match(allDiceRegex));
        if(addToRollValid)
            expression = `${expression}${addToRoll.match(/[+-]/g) ? '' : '+'}${addToRoll}`;
    }

    if (typeof rollBuffs == 'undefined') 
        return expression;

    for (let i in rollBuffs) {
        const currBuffSet = rollBuffs[i];
        const isMultiOption = Array.isArray(currBuffSet);
        const targetBuff = buffsDebuffs?.[currBuffSet?.[0]];
        const targetMultiOptions = targetBuff?.multiOptions?.[currBuffSet?.[1]];
        const multiOptionAdd = targetMultiOptions?.[rollBuffKey];
        const singleTarget = buffsDebuffs[currBuffSet];
        const singleOptionAdd = singleTarget?.[rollBuffKey];
        if (isMultiOption && multiOptionAdd && multiOptionAdd != '0') {
            expression = `${expression}${multiOptionAdd}`
        }
        else if (!isMultiOption && singleOptionAdd && singleOptionAdd != '0') {
            expression = `${expression}${singleOptionAdd}`
        }

        const multiReplaceRegex = targetMultiOptions?.replace;
        const multiReplaceSelector = targetMultiOptions?.replaceType
        const validMultiButton = (multiReplaceSelector == undefined || multiReplaceSelector?.[rollType] != undefined && $rollButton.closest(multiReplaceSelector[rollType]).length > 0);
        
        const singleReplaceRegex = singleTarget?.replace;
        const singleReplaceSelector = singleTarget?.replaceType;
        const validSingleButton = singleReplaceSelector == undefined || (singleReplaceSelector?.[rollType] != undefined && $rollButton.closest(singleReplaceSelector[rollType]).length > 0);
       
        if (multiReplaceRegex != undefined && validMultiButton) {
            expression = `${expression.replace(multiReplaceRegex, targetMultiOptions.newRoll)}`   
        }
        else if (!isMultiOption && singleReplaceRegex != undefined && validSingleButton){
            expression = `${expression.replace(singleReplaceRegex, singleTarget.newRoll)}` 
        }
    }
    const PB = getPB();
    return expression.replaceAll('PB', PB); 
}
class DiceRoller {
    
    timeoutDuration = 5000; // 5 second timeout seems reasonable. If the message gets dropped we don't want to be stuck waiting forever.

    /// PRIVATE VARIABLES
    #pendingDiceRoll = undefined;
    #pendingMessages = {};
    #orderedPendingIds = [];
    #timeoutId = undefined;
    #multirollTimeout = undefined;
    #multiRollArray = [];
    #critAttackAction = undefined;
    #pendingCritRange = undefined;
    #pendingCritType = undefined;
    #pendingSpellSave = undefined;
    #pendingDamageType = undefined;
    #pendingCrit = undefined;
    #pendingSendTo = undefined;

    /** @returns {boolean} true if a roll has been or will be initiated, and we're actively waiting for DDB messages to come in so we can parse them */
    get #waitingForRoll() {
        // we're about to roll dice so we need to know if we should capture DDB messages.
        // This also blocks other attempts to roll until we've finished processing
        return this.#timeoutId !== undefined;
    }

    constructor() {
        const key = Symbol.for('@dndbeyond/message-broker-lib');
        if (key) {
            this.ddbMB = window[key];
        } else {
            console.warn("DiceRoller failed to get Symbol.for('@dndbeyond/message-broker-lib')");
        }
        if (this.ddbMB) {
            // wrap the original dispatch function so we can block messages when we need to
            this.ddbDispatch = this.ddbMB.dispatch.bind(this.ddbMB);
            this.ddbMB.dispatch = this.#wrappedDispatch.bind(this);
        } else {
            console.warn("DiceRoller failed to get ddbMB");
        }
    }
    setPendingSpellSave(spellSaveText){
        this.#pendingSpellSave = spellSaveText;
    }
    setPendingDamageType(damageTypeText){
        this.#pendingDamageType = damageTypeText;
    }

    /// PUBLIC FUNCTIONS
    getDamageType(button){
      let damageTypeIcon = $(button).find(`.ddbc-damage__icon [class*='damage-type'][aria-label]`)  
      let damageTypeText;
      if(damageTypeIcon.length > 0){
        let typeLowerCase = damageTypeIcon.attr('aria-label').replace(' damage', '');
        damageTypeText = typeLowerCase.charAt(0).toUpperCase() + typeLowerCase.slice(1);;
      }else{
        let damageTypeTitle = $(button).find('.ddbc-tooltip[data-original-title]');
        if(damageTypeTitle.length > 0){
          damageTypeText = damageTypeTitle.attr('data-original-title')
        }
      }
      if(damageTypeText != undefined)
        window.diceRoller.setPendingDamageType(damageTypeText);
      return damageTypeText;
    }
    getSpellSave(button){
        let spellSave = $(button).closest('.ddbc-combat-attack, .ct-spells-spell').find(`[class*='__save']`);
        let spellSaveText;
        if (spellSave.length > 0) {
            spellSaveText = `${spellSave.find('[class*="__save-label"]').text().toUpperCase()} DC${spellSave.find('[class*="__save-value"]').text()}`;
        }
        window.diceRoller.setPendingSpellSave(spellSaveText);
        return spellSaveText;
    }

    setWaitingForRoll(){
        const self = this;
        clearTimeout(self.#timeoutId);
        self.#timeoutId = setTimeout(function () {
            clearTimeout(self.#timeoutId);
            self.#timeoutId = undefined;
            const newDice = $("[class*='DiceContainer_button']").length > 0
            if(newDice)
                self.sendNewFulfilled()
            console.warn("DiceRoller timed out after 5 seconds! Sending message");
        }, self.timeoutDuration);
    }

    getWaitingForRoll(){
        return this.#waitingForRoll;
    }
    /**
     * Attempts to parse the expression, and roll DDB dice.
     * If dice are rolled, the results will be processed to make sure the expression is properly calculated.
     * @param diceRoll {DiceRoll} the dice expression to parse and roll. EG: 1d20+4
     * @returns {boolean} whether or not dice were rolled
     */
    roll(diceRoll, multiroll = false, critRange = 20, critType = 2, spellSave = undefined, damageType = undefined, forceCritType = undefined) {
        try {

            if (diceRoll === undefined || diceRoll.expression === undefined || diceRoll.expression.length === 0) {
                console.warn("DiceRoller.parseAndRoll received an invalid diceRoll object", diceRoll);
                return false;
            }

            if(this.#waitingForRoll){
                diceRoll.damageType = damageType;
                this.#multiRollArray.push(diceRoll);
                return true; // return true so chat rolls recognize it's sent instead of shake error
            }
            
            let self = this;

            let msgdata = {}
            diceRoll.expression = diceRoll.expression.replaceAll(/$\+0|\+0(\D)/gi, '$1')
            let roll = new rpgDiceRoller.DiceRoll(diceRoll.expression); 
            let regExpression = new RegExp(`${diceRoll.expression.replace(/[+-]/g, '\\$&')}:\\s`);
            let rollType = (diceRoll.rollType) ? diceRoll.rollType : 'Custom';
            let rollTitle = (diceRoll.action) ? diceRoll.action : 'AboveVTT';
            let modifier = (roll.rolls.length > 1 && diceRoll.expression.match(/[+-]\d*$/g, '')) ? `${roll.rolls[roll.rolls.length-2]}${roll.rolls[roll.rolls.length-1]}` : '';
            

            let critSuccess = false;
            let critFail = false;

            let results = roll.output.split(/[\:=]/g)[1].split(/[+-]/g);
            let diceNotations = roll.notation.split(/[+-]/g);

            if(!diceNotations[diceNotations.length-1].includes('d')){
               diceNotations.splice(diceNotations.length-1, 1)
            }



            for(let i=0; i<diceNotations.length; i++){

                results[i] = results[i].replace(/[0-9]+d/g, '').replace(/[\]\[]/g, '')
                let resultsArray = results[i].split(',');
                for(let j=0; j<resultsArray.length; j++){
                    let reduceCrit = 0;
                    if(parseInt(diceNotations[i].split('d')[1]) == 20){
                        reduceCrit = 20 - critRange;
                    }
                    else if(rollType == 'attack' || rollType == 'to hit' || rollType == 'tohit' ){
                        continue;
                    }
                    if(parseInt(resultsArray[j]) >= parseInt(diceNotations[i].split('d')[1]) - reduceCrit){
                        critSuccess = true;
                    }
                    if(parseInt(resultsArray[j]) == 1){
                        critFail = true;
                    }
                }
            }
            let critClass = `${critSuccess && critFail ? 'crit-mixed' : critSuccess ? 'crit-success' : critFail ? 'crit-fail' : ''}`

            const ddb3dDiceShareToggle = getDdb3dDiceShareToggle();

            if (window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true || ((is_abovevtt_page() || window.sendToTab != undefined) && !ddb3dDiceShareToggle)){
                if(spellSave == undefined && this.#pendingSpellSave != undefined){
                    spellSave = this.#pendingSpellSave;
                }
                if(damageType == undefined && this.#pendingDamageType != undefined){
                    damageType = this.#pendingDamageType;
                }
                else if(damageType == undefined && diceRoll.damageType != undefined){
                    damageType = diceRoll.damageType;
                }
                let doubleCrit = false;
                let output = roll.output.replace(regExpression, '');
                let total = roll.total;
                let expression = diceRoll.expression;
                if((this.#critAttackAction != undefined && critType == 3) || forceCritType == 3){
                    doubleCrit = true;
                    total = total * 2;
                    const outputSplit = output.split(' = ')
                    output = `2*[${outputSplit[0]}] = ${parseInt(outputSplit[1])*2}`
                    expression = `2*[${expression}]`
                }
                msgdata = {
                  player: diceRoll.name ? diceRoll.name : window.PLAYER_NAME,
                  img: diceRoll.avatarUrl ?  diceRoll.avatarUrl : window.PLAYER_IMG,
                  text: `<div class="tss-24rg5g-DiceResultContainer-Flex abovevtt-roll-container ${critClass}" title='${expression}<br>${output}'>
                            <div class="tss-kucurx-Result">
                                <div class="tss-3-Other-ref tss-1o65fpw-Line-Title-Other">
                                    <span class='aboveDiceOutput'>${rollTitle}</span>
                                    :
                                    <span class='abovevtt-roll-${rollType.replace(' ', '-')}'>${damageType != undefined ? `${damageType} ` : ''}${rollType}</span>
                                </div>
                            </div>
                            <svg width="1" height="32" class="tss-10y9gcy-Divider"><path fill="currentColor" d="M0 0h1v32H0z"></path></svg>
                            <div class="tss-1jo3bnd-TotalContainer-Flex">
                                <div class="tss-3-Other-ref tss-3-Collapsed-ref tss-3-Pending-ref tss-jpjmd5-Total-Other-Collapsed-Pending-Flex">
                                    <span class='aboveDiceTotal'>${total}</span>
                                </div>
                                ${spellSave != undefined ? `<div class='custom-spell-save-text'><span>${spellSave}</span></div>` : ''}
                            </div>

                        </div>
                        `,
                  whisper: (diceRoll.sendToOverride == "DungeonMaster" || diceRoll.sendToOverride == "DM") ? dm_id : ((gamelog_send_to_text() != "Everyone" && diceRoll.sendToOverride != "Everyone") || diceRoll.sendToOverride == "Self") ? window.PLAYER_NAME :  ``,
                  rollType: rollType,
                  rollTitle: rollTitle,
                  result: doubleCrit == true  ? 2*roll.total : roll.total,
                  playerId: window.PLAYER_ID,
                  sendTo: window.sendToTab,
                  entityType: diceRoll.entityType,
                  entityId: diceRoll.entityId,
                  disableDDBDice: !ddb3dDiceShareToggle,
                  sendToOverride: diceRoll.sendToOverride
                };
                if(rollType == 'attack' || rollType == 'to hit' || rollType == 'tohit'){     
                    if(critSuccess == true){
                        this.#critAttackAction = rollTitle;     
                    }
                    else{
                        this.#critAttackAction = undefined;  
                    }
                   
                }
               
            }                         
            else{
                if(spellSave == undefined && this.#pendingSpellSave != undefined){
                    spellSave = this.#pendingSpellSave;
                }
                if(damageType == undefined && this.#pendingDamageType != undefined){
                    damageType = this.#pendingDamageType;
                }
                else if(damageType == undefined && diceRoll.damageType != undefined){
                    damageType = diceRoll.damageType;
                }
                let rollData = {
                    roll: roll,
                    expression: diceRoll.expression,
                    rollType: rollType,
                    rollTitle: rollTitle,
                    modifier: modifier,
                    regExpression: regExpression,
                    spellSave: spellSave,
                    damageType: damageType
                }
                   
                msgdata = {
                  player: diceRoll.name ? diceRoll.name : window.PLAYER_NAME,
                  img: diceRoll.avatarUrl ?  diceRoll.avatarUrl : window.PLAYER_IMG,
                  whisper: (diceRoll.sendToOverride == "DungeonMaster" || diceRoll.sendToOverride == "DM") ? "DungeonMaster" : ((gamelog_send_to_text() != "Everyone" && diceRoll.sendToOverride != "Everyone") || diceRoll.sendToOverride == "Self") ? window.PLAYER_NAME :  ``,
                  playerId: window.PLAYER_ID,
                  rollData: rollData,
                  sendTo: window.sendToTab,
                  entityType: diceRoll.entityType,
                  entityId: diceRoll.entityId,
                  sendToOverride: diceRoll.sendToOverride
                };
            }
            // we're about to roll dice so we need to know if we should capture DDB messages.
            // This also blocks other attempts to roll until we've finished processing
            // don't hold a reference to the object we were given in case it gets altered while we're waiting.
            this.#resetVariables();
            this.setWaitingForRoll();
            this.#pendingDiceRoll = new DiceRoll(diceRoll.expression, diceRoll.action, diceRoll.rollType, diceRoll.name, diceRoll.avatarUrl, diceRoll.entityType, diceRoll.entityId, diceRoll.sendToOverride);
            this.#pendingCritRange = critRange;
            this.#pendingCritType = critType;
            this.#pendingSpellSave = spellSave;
            this.#pendingDamageType = damageType;
            this.#pendingCrit = forceCritType;
            this.#pendingSendTo = diceRoll.sendToOverride;
                if (ddb3dDiceShareToggle && !window.EXPERIMENTAL_SETTINGS['rpgRoller'] && !msgdata?.rollData?.expression?.includes('d')) {
                    setTimeout(() => {
                        const message = self.send_ddb_dice_message(msgdata.rollData.expression, msgdata.player, msgdata.img, msgdata.rollData.rollType, msgdata.rollData.damageType, msgdata.rollData.rollTitle, diceRoll.sendToOverride)
                        self.#resetVariables();
                        self.nextRoll(message, critRange, critType)
                    }, 200)
                return true;
            }
            if (is_abovevtt_page() && (window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true || !ddb3dDiceShareToggle)){
                if (!ddb3dDiceShareToggle) {
                    $('[class*="DiceContainer_customDiceRollOpen"]').click()
                }
                setTimeout(function(){
                    window.MB.inject_chat(msgdata);
                    self.#resetVariables();
                    self.nextRoll(undefined, critRange, critType)      
                }, 200)
                return true;
            }
            else if ((!is_abovevtt_page() && window.sendToTab != undefined) || is_gamelog_popout() ){
                if(window.sendToTab == undefined)
                    window.sendToTab = isNaN(Number(window.PLAYER_ID)) ? false : Number(window.PLAYER_ID);
                    setTimeout(function(){
                        tabCommunicationChannel.postMessage({
                          msgType: 'roll',
                          msg: msgdata,
                          multiroll: multiroll,
                          critRange: critRange,
                          critType: critType,
                          forceCritType: forceCritType
                        });
                    self.#resetVariables();
                    self.nextRoll(undefined, critRange, critType)
                }, 200)
                return true;
            } else if (!is_abovevtt_page() && !ddb3dDiceShareToggle && window.MB?.ws != undefined){
              setTimeout(()=>{
                  const message = self.send_ddb_dice_message(msgdata.rollData.expression, msgdata.player, msgdata.img, msgdata.rollData.rollType, msgdata.rollData.damageType, msgdata.rollData.rollTitle, diceRoll.sendToOverride)
                  self.#resetVariables();
                  self.nextRoll(message, critRange, critType)
              }, 200)
              return true;
            }             

            console.group("DiceRoller.parseAndRoll");
            console.log("attempting to parse diceRoll", diceRoll);



            this.clickDiceButtons(diceRoll);
            console.groupEnd();
            return true;
        } catch (error) {
            console.warn("failed to parse and send expression as DDB roll; expression: ", diceRoll.expression, error);
            this.#resetVariables();
            console.groupEnd();
            return false;
        }
    }
    nextRoll(msg = undefined, critRange = 20, critType = 2){


        if(this.#multiRollArray.length == 0){
            this.#critAttackAction = undefined;
            return;
        }
        if(msg != undefined){
            if(msg.data.rolls[0].rollType == 'attack' || msg.data.rolls[0].rollType == 'to hit' || msg.data.rolls[0].rollType == 'tohit' ){
                let critSuccess = {};
                let critFail = {};


                for(let i=0; i<msg.data.rolls.length; i++){
                    let roll = msg.data.rolls[i];
                    critSuccess[i] = false;
                    critFail[i] = false;

                    for (let j=0; j<roll.diceNotation.set.length; j++){
                        for(let k=0; k<roll.diceNotation.set[j].dice.length; k++){
                            let reduceCrit = 0;
                            const dieType = roll.diceNotation.set[j].dice[k]?.options?.dieType != undefined ? roll.diceNotation.set[j].dice[k]?.options?.dieType : roll.diceNotation.set[j].dice[k]?.dieType
                            const value = roll.diceNotation.set[j].dice[k].faceValue != undefined ? roll.diceNotation.set[j].dice[k].faceValue : roll.diceNotation.set[j].dice[k].dieValue 
                            if (parseInt(dieType.replace('d', '')) == 20)
                                reduceCrit = 20 - critRange
                            else
                                continue;
                            if (value >= parseInt(dieType.replace('d', ''))-reduceCrit && roll.result.values.includes(value)){
                                const value1 = roll.diceNotation.set[j].dice[k - 1]?.faceValue != undefined ? roll.diceNotation.set[j].dice[k - 1]?.faceValue : roll.diceNotation.set[j].dice[k - 1]?.dieValue
                                const value2 = roll.diceNotation.set[j].dice[k + 1]?.faceValue != undefined ? roll.diceNotation.set[j].dice[k + 1]?.faceValue : roll.diceNotation.set[j].dice[k + 1]?.dieValue
                                const value3 = roll.diceNotation.set[j].dice[1]?.faceValue != undefined ? roll.diceNotation.set[j].dice[1]?.faceValue : roll.diceNotation.set[j].dice[1]?.dieValue
                                const value4 = roll.diceNotation.set[j].dice[0]?.faceValue != undefined ? roll.diceNotation.set[j].dice[0]?.faceValue : roll.diceNotation.set[j].dice[0]?.dieValue

                                if(roll.rollKind == 'advantage'){

                                    if (k > 0 && value1 <= value){
                                        critSuccess[i] = true;
                                    }
                                    else if (k == 0 && value2 <= value){
                                        critSuccess[i] = true;
                                    }
                                }
                                else if (roll.rollKind == 'disadvantage' && value3 == value4){
                                    critSuccess[i] = true;
                                }
                                else if(roll.rollKind != 'disadvantage'){
                                    critSuccess[i] = true;
                                }       
                            }
                        }
                    }
                }

               
                if(critSuccess[0] == true){
                    this.#critAttackAction = msg.data.action;
                }
                else{
                    this.#critAttackAction = undefined;
                }
            }
        }
        
        
        let diceRoll = this.#multiRollArray.shift();
        let damageType = diceRoll.damageType;
        if(this.#critAttackAction != undefined && diceRoll.rollType == 'damage'){
            let diceType = diceRoll.expression.match(/d[0-9]+/i)[0];
            let critDice = diceRoll.diceToRoll[diceType] * 2;    
            let maxRoll = diceRoll.diceToRoll[diceType] * parseInt(diceType.replace('d', ''));
            if(critType == 0){
                let newExpression = diceRoll.expression.replace(/^[0-9]+d/i, `${critDice}d`);
                this.roll(new DiceRoll(newExpression, diceRoll.action, diceRoll.rollType, diceRoll.name, diceRoll.avatarUrl, diceRoll.entityType, diceRoll.entityId), true, critRange, critType, undefined, damageType);
            }
            else if(critType == 1){
                // perfect crit damage
                let newExpression = diceRoll.expression.replaceAll(/(([+-])?([\d]+)d([\d]+).*?)([+-]|$)/gi, function (m, m1, m2, m3, m4, m5) {
                    return `${m1}${m2 == '-' ? '' : `+${parseInt(m3) * parseInt(m4)}${m5}`}`
                })
                this.roll(new DiceRoll(newExpression, diceRoll.action, diceRoll.rollType, diceRoll.name, diceRoll.avatarUrl, diceRoll.entityType, diceRoll.entityId), true, critRange, critType, undefined, damageType);
            }
            else if(critType == 2 || critType == 3){
                this.roll(new DiceRoll(diceRoll.expression, diceRoll.action, diceRoll.rollType, diceRoll.name, diceRoll.avatarUrl, diceRoll.entityType, diceRoll.entityId), true, critRange, critType, undefined, damageType);
            }
        }
        else{
            this.roll(diceRoll, true, critRange, critType, undefined, damageType);
        }

    }
    /**
     * clicks the DDB dice and then clicks the roll button
     * @param diceRoll {DiceRoll} the DiceRoll object to roll
     */
    async clickDiceButtons(diceRoll, retries=1) {
        if (retries > 5){
            console.warn(`clickDiceButtons retried dice roll 5 times and failed`, diceRoll);
            this.#resetVariables();
            return;
        }
        if (diceRoll === undefined) {
            console.warn("clickDiceButtons was called without a diceRoll object")
            return;
        }
        $('[data-floating-ui-portal], .roll-mod-container').addClass('hidden');
        if ($(".dice-toolbar").hasClass("rollable") || $(`[class*='DiceContainer_customDiceRollOpen']`).length>0) {
            // clear any that are already selected so we don't roll too many dice
            await $(".dice-toolbar__dropdown-die, [data-dd-action-name='Roll Dice Popup > Clear Dice']").click();
        }
        
        if (($(".dice-toolbar__dropdown").length > 0 && !$(".dice-toolbar__dropdown").hasClass("dice-toolbar__dropdown-selected")) || ($("[class*='DiceContainer_button']").length > 0 && $(`[class*='DiceContainer_customDiceRollOpen']`).length == 0)) {
            // make sure it's open
            await $(".dice-toolbar__dropdown-die, [class*='DiceContainer_button']").click();
        }
        if ($(`.dice-die-button, [class*='AnchoredPopover_wrapper'] [class*='_diceContainer']`).length == 0){
            const self = this;
            setTimeout(function(){
                self.clickDiceButtons(diceRoll, retries + 1)
            }, 60)
            return;
        }
        for (let diceType in diceRoll.diceToRoll) {
            let numberOfDice = diceRoll.diceToRoll[diceType];
            for (let i = 0; i < numberOfDice; i++) {
                await $(`.dice-die-button[data-dice='${diceType}'], [class*='AnchoredPopover_wrapper'] #${diceType}`).click();
            }
        }


        if ($(".dice-toolbar").hasClass("rollable")) {
            console.log("diceRoll.sendToOverride", diceRoll.sendToOverride)
            await $(".dice-toolbar__target").children().first().click();
        }
        if ($(`[class*='DiceContainer_button']`).length>0) {    
            await $(`[data-dd-action-name="Roll Dice Popup > Roll Dice"]`).click();
        }  
        clearTimeout(this.diceRollButtonHide);
        this.diceRollButtonHide = setTimeout(()=>{
            $('[data-floating-ui-portal], .roll-mod-container').removeClass('hidden');
        }, 500)

    }
    send_ddb_dice_message(expression, displayName, imgUrl, rollType = "roll", damageType, actionType = "custom", sendTo = "") {
        let diceRoll = new DiceRoll(expression);
        diceRoll.action = actionType;
        diceRoll.rollType = rollType;
        diceRoll.name = displayName == true ? 'THE DM' : displayName;
        diceRoll.avatarUrl = imgUrl;
        // diceRoll.entityId = monster.id;
        // diceRoll.entityType = monsterData.id;

        console.log("with values", expression, displayName, imgUrl, rollType, damageType, actionType, sendTo)


        try {
            expression = expression.replace(/\s+/g, ''); // remove all whitespace

            const supportedDieTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

            let roll = new rpgDiceRoller.DiceRoll(expression);

            // rpgDiceRoller doesn't give us the notation of each roll so we're going to do our best to find and match them as we go
            let choppedExpression = expression;
            let notationList = [];
            for (let i = 0; i < roll.rolls.length; i++) {
                let currentRoll = roll.rolls[i];
                if (typeof currentRoll === "string") {
                    let idx = choppedExpression.indexOf(currentRoll);
                    let previousNotation = choppedExpression.slice(0, idx);
                    notationList.push(previousNotation);
                    notationList.push(currentRoll);
                    choppedExpression = choppedExpression.slice(idx + currentRoll.length);
                }
            }
            console.log("chopped expression", choppedExpression)
            notationList.push(choppedExpression); // our last notation will still be here so add it to the list

            if (roll.rolls.length != notationList.length) {
                console.warn(`Failed to convert expression to DDB roll; expression ${expression}`);
                console.groupEnd()
                return false;
            }

            let convertedDice = [];       // a list of objects in the format that DDB expects
            let allValues = [];           // all the rolled values
            let convertedExpression = []; // a list of strings that we'll concat for a string representation of the final math being done
            let constantsTotal = 0;       // all the constants added together
            for (let i = 0; i < roll.rolls.length; i++) {
                let currentRoll = roll.rolls[i];
                if (typeof currentRoll === "object") {
                    let currentNotation = notationList[i];
                    let currentDieType = supportedDieTypes.find(dt => currentNotation.includes(dt)); // we do it this way instead of splitting the string so we can easily clean up things like d20kh1, etc. It's less clever, but it avoids any parsing errors
                    if (!supportedDieTypes.includes(currentDieType)) {
                        console.warn(`found an unsupported dieType ${currentNotation}`);
                        console.groupEnd()
                        return false;
                    }
                    if (currentNotation.includes("kh") || currentNotation.includes("kl")) {
                        let cleanerString = currentRoll.toString()
                            .replace("[", "(")    // swap square brackets with parenthesis
                            .replace("]", ")")    // swap square brackets with parenthesis
                            .replace(/d/g, "")     // remove all drop notations
                            .replace(/\s+/g, ''); // remove all whitespace
                        convertedExpression.push(cleanerString);
                    } else {
                        convertedExpression.push(currentRoll.value);
                    }
                    let dice = currentRoll.rolls.map(d => {
                        allValues.push(d.value);
                        console.groupEnd()
                        return { dieType: currentDieType, dieValue: d.value };
                    });

                    convertedDice.push({
                        "dice": dice,
                        "count": dice.length,
                        "dieType": currentDieType,
                        "operation": 0
                    })
                } else if (typeof currentRoll === "string") {
                    convertedExpression.push(currentRoll);
                } else if (typeof currentRoll === "number") {
                    convertedExpression.push(currentRoll);
                    if (i > 0) {
                        if (convertedExpression[i - 1] == "-") {
                            constantsTotal -= currentRoll;
                        } else if (convertedExpression[i - 1] == "+") {
                            constantsTotal += currentRoll;
                        } else {
                            console.warn(`found an unexpected symbol ${convertedExpression[i - 1]}`);
                            console.groupEnd()
                            return false;
                        }
                    } else {
                        constantsTotal += currentRoll;
                    }
                }
            }
            if (sendTo == '') {
                sendTo = gamelog_send_to_text().trim().replace(/\s/gi, '');
            }
            sendTo = sendTo.toLowerCase();
            const rollId = uuid();
            let ddbMessage = {
                id: uuid(),
                dateTime: `${Date.now()}`,
                gameId: `${window.gameId}`,
                userId: `${window.myUser}`,
                source: "web",
                persist: true,
                messageScope: sendTo === "everyone" ? "gameId" : "userId",
                messageTarget: sendTo === "everyone" ? `${window.gameId}` : sendTo === "dungeonmaster" || sendTo === "dm" ? `${window.CAMPAIGN_INFO.dmId}` : `${window.myUser}`,
                entityId: `${window.myUser}`,
                entityType: "user",
                eventType: "dice/roll/fulfilled",
                data: {
                    action: actionType,
                    setId: window.mydice.data.setId,
                    context: {
                        entityId: `${window.myUser}`,
                        entityType: "user",
                        messageScope: sendTo === "everyone" ? "gameId" : "userId",
                        messageTarget: sendTo === "everyone" ? `${window.gameId}` : sendTo === "dungeonmaster" || sendTo === "dm" ? `${window.CAMPAIGN_INFO.dmId}` : `${window.myUser}`,
                        name: displayName,
                        avatarUrl: imgUrl
                    },
                    rollId: rollId,
                    rolls: [
                        {
                            diceNotation: {
                                set: convertedDice,
                                constant: constantsTotal
                            },
                            diceNotationStr: expression,
                            rollType: rollType,
                            rollKind: expression.includes("kh") ? "advantage" : expression.includes("kl") ? "disadvantage" : "",
                            result: {
                                constant: constantsTotal,
                                values: allValues,
                                total: roll.total,
                                text: convertedExpression.join("")
                            }
                        }
                    ]
                }
            };

            this.#pendingMessages[rollId] = {
                ddbMessage,
                pendingDiceRoll: this.#pendingDiceRoll,
                pendingSpellSave: this.#pendingSpellSave,
                pendingDamageType: this.#pendingDamageType,
                pendingCrit: this.#pendingCrit,
                pendingSendTo: this.#pendingSendTo,
                critAttackAction: this.#critAttackAction,
                pendingCritRange: this.#pendingCritRange,
                pendingCritType: this.#pendingCritType
            };
            ddbMessage = this.#swapRollData(ddbMessage);
            this.#orderedPendingIds.push(rollId);
            this.sendNewFulfilled();
            return ddbMessage;
        } catch (error) {
            console.warn(`failed to send expression as DDB roll; expression = ${expression}`, error);
            console.groupEnd()
            return false;
        }
    }
    /// PRIVATE FUNCTIONS

    /** reset all variables back to their default values */
    #resetVariables(resetTimer = true) {
        console.log("resetting local variables");
        if (resetTimer){
            clearTimeout(this.#timeoutId);
            this.#timeoutId = undefined;
        }
        this.#pendingDiceRoll = undefined;
        this.#pendingSpellSave = undefined;
        this.#pendingDamageType = undefined;
        this.#pendingCrit = undefined;
        this.#pendingSendTo = undefined;
    }
    async handleOldFulfilled(message) {
        console.log("capturing fulfilled message: ", message)
        let alteredMessage = await this.#swapRollData(message);
        if (alteredMessage.data?.context?.avatarUrl?.startsWith("above-bucket-not-a-url")) {
            alteredMessage.data.context.avatarUrl = await getAvttStorageUrl(alteredMessage.data.context.avatarUrl, true)
        }
        console.log("altered fulfilled message: ", alteredMessage);
        this.ddbDispatch(alteredMessage);
        await this.#resetVariables();
        this.nextRoll(this.#pendingMessages[message.data.rollId].ddbMessage, this.#pendingMessages[message.data.rollId].pendingCritRange, this.#pendingMessages[message.data.rollId].pendingCritType, this.#pendingMessages[message.data.rollId].pendingDamageType);
        this.#pendingMessages[message.data.rollId] = null;
        delete this.#pendingMessages[message.data.rollId];  
    }
    async sendNewFulfilled() {
        if (this.#orderedPendingIds.length == 0)
            return;
        const firstPending = this.#orderedPendingIds.shift(); // we don't use current fulfilled messages as they dont always come in in order due to time it take dice to roll, modify the deferred message in order instead
        if (this.#pendingMessages[firstPending] == undefined){
            return;
        }
        const newId = uuid();
        
        const message = { ...this.#pendingMessages[firstPending].ddbMessage, eventType: "dice/roll/fulfilled", id: newId, persist: true };
        console.log("capturing fulfilled message: ", message)
        let alteredMessage = message;
        if (alteredMessage.data?.context?.avatarUrl?.startsWith("above-bucket-not-a-url")) {
            alteredMessage.data.context.avatarUrl = await getAvttStorageUrl(alteredMessage.data.context.avatarUrl, true)
        }
        console.log("altered fulfilled message: ", alteredMessage);
        alteredMessage.dateTime = this.#pendingMessages[firstPending]?.ddbMessage?.dateTime || Date.now();
        this.ddbDispatch(alteredMessage);
        if(this.#multiRollArray.length>0){
            const self = this;
            const nextCritRange = self.#pendingMessages[firstPending]?.pendingCritRange;
            const nextCritType = self.#pendingMessages[firstPending]?.pendingCritType;
            const nextDamageType = self.#pendingMessages[firstPending]?.pendingDamageType;
            setTimeout(function () {
                if (newDice) {
                    self.nextRoll(alteredMessage, nextCritRange, nextCritType, nextDamageType);
                }
            }, 60)
        }
        this.#pendingMessages[firstPending] = null;
        delete this.#pendingMessages[firstPending];
        if (this.#orderedPendingIds.length > 0) {
            this.sendNewFulfilled();
        }
    }
    /** wraps all messages that are sent by DDB, and processes any that we need to process, else passes it along as-is */
    async #wrappedDispatch(message) {
        const newDice = $("[class*='DiceContainer_button']").length > 0
        
        if(this.#waitingForRoll && message.source == 'Beyond20'){
            return;
        }
        const ddb3dDiceShareToggle = getDdb3dDiceShareToggle();

        if (message.eventType === "dice/roll/fulfilled" && newDice && ddb3dDiceShareToggle && this.#pendingMessages[message.data.rollId] == undefined && !['death', 'hitdice'].includes(message.data?.action?.toLowerCase().replaceAll(/\s/gi, '')))
            return;
        
        if (!this.#waitingForRoll || (message.eventType === "dice/roll/fulfilled" && !ddb3dDiceShareToggle)) {
            if(message.source == 'Beyond20'){
                this.ddbDispatch(message);
                return;
            }
            if (message.eventType === "dice/roll/fulfilled" && this.#pendingMessages[message.data.rollId] !== undefined) {
                if (message.source == 'Beyond20') {
                    this.ddbDispatch(message);
                    return;
                }
                if(!newDice){
                    this.handleOldFulfilled(message);
                    return;
                }   
                clearTimeout(this.backupSendTimeout)
                this.sendNewFulfilled();           
            } else{
               console.debug("swap image only, not capturing: ", message);
               let ddbMessage = { ...message };
               if (window.CAMPAIGN_INFO?.dmId == ddbMessage.entityId) {
                   ddbMessage.data.context.avatarUrl = dmAvatarUrl
               }
               else if (window.pcs?.filter(d => d.characterId == ddbMessage.entityId)?.length > 0 && ddbMessage?.data?.context != undefined) {
                   ddbMessage.data.context.avatarUrl = window.pcs?.filter(d => d.characterId == ddbMessage.entityId)[0].image
               }

               if (ddbMessage.data?.context?.avatarUrl?.startsWith("above-bucket-not-a-url")) {
                   ddbMessage.data.context.avatarUrl = await getAvttStorageUrl(ddbMessage.data.context.avatarUrl, true)
               }

               if ((this.#pendingSpellSave != undefined || this.#pendingDamageType != undefined) && message.eventType === "dice/roll/fulfilled") {
                   if (this.#pendingSpellSave != undefined)
                       ddbMessage.avttSpellSave = this.#pendingSpellSave;
                   if (this.#pendingDamageType != undefined && ddbMessage.data.rolls.some(d => d.rollType.includes('damage')))
                       ddbMessage.avttDamageType = this.#pendingDamageType;
                   this.ddbDispatch(ddbMessage);
                   await this.#resetVariables();
               }
               else {
                   if (window.DM && window.modifiySendToDDBDiceClicked == true) {
                       if (gamelog_send_to_text() == 'Self') {
                           ddbMessage.messageScope = "userId";
                           ddbMessage.messageTarget = `${window.CAMPAIGN_INFO.dmId}`;
                           ddbMessage.data.context.messageScope = "userId";
                           ddbMessage.data.context.messageTarget = `${window.CAMPAIGN_INFO.dmId}`;
                       }
                       delete window.modifiySendToDDBDiceClicked;
                   }
                   this.ddbDispatch(ddbMessage);
                   await this.#resetVariables();
               }
            }
        } else if (message.eventType === "dice/roll/pending" || message.eventType == 'dice/roll/deferred') {
            if(message.source == 'Beyond20'){
                this.ddbDispatch(message);
                await this.#resetVariables();
                return;
            }
            
            console.log("capturing pending message: ", message);
            let ddbMessage = { ...message };
            this.#pendingMessages[ddbMessage.data.rollId] = {
                ddbMessage,
                pendingDiceRoll: this.#pendingDiceRoll,
                pendingSpellSave: this.#pendingSpellSave,
                pendingDamageType: this.#pendingDamageType,
                pendingCrit: this.#pendingCrit,
                pendingSendTo: this.#pendingSendTo,
                critAttackAction: this.#critAttackAction,
                pendingCritRange: this.#pendingCritRange,
                pendingCritType: this.#pendingCritType
            };
            if(newDice)
                this.#orderedPendingIds.push(ddbMessage.data.rollId);
            
            if (ddbMessage.data?.context?.avatarUrl?.startsWith("above-bucket-not-a-url")) {
                ddbMessage.data.context.avatarUrl = await getAvttStorageUrl(ddbMessage.data.context.avatarUrl, true)
            }
            if(!newDice){
                await this.#swapDiceRollMetadata(ddbMessage);
            }
            else{
                ddbMessage = await this.#swapRollData(ddbMessage)
            }
                
            this.ddbDispatch(ddbMessage);
            this.#resetVariables(newDice);
            const self = this; 
            setTimeout(function() {
                if (newDice){
                    self.nextRoll(self.#pendingMessages[ddbMessage.data.rollId].ddbMessage, self.#pendingMessages[ddbMessage.data.rollId].pendingCritRange, self.#pendingMessages[ddbMessage.data.rollId].pendingCritType, self.#pendingMessages[ddbMessage.data.rollId].pendingDamageType);
                }
            }, 60)
            if(newDice){
                clearTimeout(this.backupSendTimeout)
                this.backupSendTimeout = setTimeout(() => { // if dice are slow to roll display result early
                    this.sendNewFulfilled();
                }, 1000)
            }
        } else if (message.eventType === "dice/roll/fulfilled" && this.#pendingMessages[message.data.rollId] !== undefined) {
            if (!newDice)
                this.handleOldFulfilled(message);
            else
                this.sendNewFulfilled()
        } else if (message.eventType === "dice/roll/fulfilled"){
            this.ddbDispatch(message);
        }
        
    }

    /** iterates over the rolls of a DDB message, calculates #pendingDiceRoll.expression, and swaps any data necessary to make the message match the expression result */
    #swapRollData(ddbMessage) {
        console.group("DiceRoller.#swapRollData");
        try {
            let alteredMessage = { ...ddbMessage };
            const { pendingDiceRoll, pendingSpellSave, pendingDamageType, pendingCrit, pendingSendTo, critAttackAction, pendingCritRange, pendingCritType } = this.#pendingMessages[ddbMessage.data.rollId];
            if(!pendingDiceRoll)
                return alteredMessage;
            alteredMessage.data.rolls.forEach(r => {

                // so we need to parse r.diceNotationStr to figure out the order of the results
                // then iterate over r.result.values to align the dice and their values
                // then work through this.#pendingDiceRoll.expression, and replace each expression with the correct number of values
                // then figure out any constants (such as +4), and update r.diceNotation.constant, and r.result.constant
                // then update r.result.text, and r.result.total

                // 1. match dice types with their results so we can properly replace each dice expression with the correct result
                // all DDB dice types will be grouped together. For example: "1d4+2d6-3d8+4d10-5d20+1d100-2d20kh1+2d20kl1-1d3" turns into "9d20+5d10+3d8+2d6+1d4"
                // all the values are in the same order as the DDB expression so iterate over the expression, and pull out the values that correspond
                let matchedValues = {}; // { d20: [1, 18], ... }
                let rolledExpressions = pendingDiceRoll.expression.match(allDiceRegex);
                console.debug("rolledExpressions: ", rolledExpressions);
                let valuesToMatch = r.result.values;
                rolledExpressions.forEach(diceExpression => {
                    console.debug("diceExpression: ", diceExpression);
                    let diceType = diceExpression.match(/d\d+/g);
                    let numberOfDice = parseInt(diceExpression.split("d")[0]);
                    if (matchedValues[diceType] === undefined) {
                        matchedValues[diceType] = [];
                    }
                    if (diceExpression.includes("ro")) {
                        // we've doubled the dice in case we needed to reroll, so grab twice as many dice as expected
                        numberOfDice = numberOfDice * 2;
                    }
                    matchedValues[diceType] = matchedValues[diceType].concat(valuesToMatch.slice(0, numberOfDice));
                    valuesToMatch = valuesToMatch.slice(numberOfDice);
                });
                console.debug("matchedValues: ", JSON.stringify(matchedValues));

                // 2. replace each dice expression in #pendingDiceRoll.expression with the corresponding dice roll results
                // For example: "2d20kh1+1d4-3" with rolled results of [9, 18, 2] will turn into "18+2-3"
                // we also need to collect the results that we use which will end up being [18, 2] in this example
                let replacedExpression = pendingDiceRoll.expression.toString().replaceAll(/(\D)0+(\d)/gi, '$1$2'); // make sure we have a new string that we alter so we don't accidentally mess up the original
                let replacedValues = []; // will go into the roll object and DDB also parses these.
                pendingDiceRoll.diceExpressions.forEach(diceExpression => {
                    let diceType = diceExpression.match(/d\d+/g);
                    let numberOfDice = parseInt(diceExpression.split("d")[0]);
                    const includesReroll = diceExpression.includes("ro");
                   
                    if (includesReroll) {
                        // we've doubled the dice in case we needed to reroll so grab twice as many dice as expected
                        numberOfDice = numberOfDice * 2;
                    }
                    let calculationValues = matchedValues[diceType].slice(0, numberOfDice);
                    matchedValues[diceType] = matchedValues[diceType].slice(numberOfDice);
                    console.debug(diceExpression, "calculationValues: ", calculationValues);

                    if (includesReroll) {
                        // we have twice as many dice values as we need, so we need to figure out which dice values to drop.
                        // the values are in-order, so we will only keep the front half of the array.
                        // evaluate each of the calculationValues against the reroll rule.
                        // any value that evaluates to false, gets dropped. This allows the reroll dice to "shift" into the front half of the array.
                        // cut the matchedValues down to the expected size. This will drop any reroll dice that we didn't use
                        const half = Math.ceil(calculationValues.length / 2);
                        let rolledValues = calculationValues.slice(0, half)
                        let rerolledValues = calculationValues.slice(half)
                        const rerollModifier = diceExpression.match(/ro(<|<=|>|>=|=)\d+/);
                        calculationValues = rolledValues.map(value => {
                            const rerollExpression = rerollModifier[0].replace('ro', value).replace(/(?<!(<|>))=(?!(<|>))/, "==").replaceAll(/(\D)0+(\d)/gi, '$1$2');
                            console.debug("rerollExpression", rerollExpression)
                            if (eval(rerollExpression)) {
                                return rerolledValues.shift();
                            } else {
                                return value;
                            }
                        });
                    }
                    const includesMin = diceExpression.includes("min");
                    if (includesMin) {                
                        // evaluate each of the calculationValues against the min roll rule.
                        // any value that evaluates to true is set to the minimum value
                        const minRoll = /min(\d+)/.exec(diceExpression);
                        calculationValues = calculationValues.map(value => {
                            const minExpression = minRoll[0].replace('min', `${value}<`).replaceAll(/(\D)0+(\d)/gi, '$1$2');
                            console.debug("minExpression", minExpression)
                            if (eval(minExpression)) {
                                return minRoll[1];
                            } else {
                                return value;
                            }
                        });
                    }

                    if (diceExpression.includes("kh")) {
                        // "keep highest" was used so figure out how many to keep
                        let numberToKeep = parseInt(diceExpression.split("kh")[1]);
                        // then sort and only take the highest values
                        calculationValues = calculationValues.sort((a, b) => b - a).slice(0, numberToKeep);
                        console.debug(diceExpression, "kh calculationValues: ", calculationValues);
                    } else if (diceExpression.includes("kl")) {
                        // "keep lowest" was used so figure out how many to keep
                        let numberToKeep = parseInt(diceExpression.split("kl")[1]);
                        // then sort and only take the lowest values
                        calculationValues = calculationValues.sort((a, b) => a - b).slice(0, numberToKeep);
                        console.debug(diceExpression, "kl calculationValues: ", calculationValues);
                    }

                    // finally, replace the diceExpression with the results that we have. For example 2d20 with results [2, 9] will result in "(2+9)", 1d20 with results of [3] will result in "3"
                    let replacementString = calculationValues.length > 1 ? "(" + calculationValues.join("+") + ")" : calculationValues.join("+"); // if there are more than one make sure they get totalled together
                    replacedExpression = replacedExpression.replace(diceExpression, replacementString);
                    replacedValues = replacedValues.concat(calculationValues);
                });

                // now that we've replaced all the dice expressions with their results, we need to execute the expression to get the final result
                let calculatedTotal = eval(replacedExpression);
                if((critAttackAction != undefined && pendingCritType == 3) || pendingCrit == 3){
                    calculatedTotal = calculatedTotal * 2; 
                }
                console.log("pendingExpression: ", pendingDiceRoll.expression, ", replacedExpression: ", replacedExpression, ", calculatedTotal:", calculatedTotal, ", replacedValues: ", replacedValues);

                // we successfully processed the expression, now let's update the message object
                r.diceNotationStr = pendingDiceRoll.expression; 
                r.diceNotation.constant = pendingDiceRoll.calculatedConstant;
                r.result.constant = pendingDiceRoll.calculatedConstant;
                r.result.text = replacedExpression;
                r.result.total = calculatedTotal;
                if (pendingDiceRoll.isComplex()) {
                    r.result.values = replacedValues;
                }
                if (pendingDiceRoll.rollType) {
                    r.rollType = pendingDiceRoll.rollType;
                }
                // need to update the replacedValues above based on kh and kl if we do this
                if (pendingDiceRoll.isAdvantage()) {
                    r.rollKind = "advantage";
                } else if (pendingDiceRoll.isDisadvantage()) {
                    r.rollKind = "disadvantage";
                }
                pendingDiceRoll.resultTotal = calculatedTotal;
                pendingDiceRoll.resultValues = replacedValues;
                pendingDiceRoll.expressionResult = replacedExpression;
            });
            if(pendingCritRange != undefined){
                alteredMessage.data.critRange = pendingCritRange;
            }
            this.#swapDiceRollMetadata(alteredMessage);

            console.groupEnd();
            return alteredMessage;
        } catch (error) {
            console.warn("Failed to swap roll data", error);
            console.groupEnd();
            return ddbMessage // we failed to parse the message so return the original message
        }
    }

    #swapDiceRollMetadata(ddbMessage) {
        const { pendingDiceRoll, pendingSpellSave, pendingDamageType, pendingCrit, pendingSendTo, critAttackAction, pendingCritRange, pendingCritType } = this.#pendingMessages[ddbMessage.data.rollId];
        if(!pendingDiceRoll)
            return ddbMessage;
        if (pendingDiceRoll?.isComplex()) {
            // We manipulated this enough that DDB won't properly display the formula.
            // We'll look for this later to know that we should swap some HTML after this render
            ddbMessage.avttExpression = pendingDiceRoll.expression;
            ddbMessage.avttExpressionResult = pendingDiceRoll.expressionResult;
            console.log("DiceRoll ddbMessage.avttExpression: ", ddbMessage.avttExpression);
        }
        if((critAttackAction != undefined && pendingCritType == 3) || pendingCrit == 3){
            ddbMessage.avttExpression = `2(${pendingDiceRoll.expression})`;
            ddbMessage.avttExpressionResult = `2(${pendingDiceRoll.expressionResult})`;
        }
        ddbMessage.avttSpellSave = pendingSpellSave;
        if(ddbMessage.data.rolls.some(d=> d.rollType.includes('damage')))
            ddbMessage.avttDamageType = pendingDamageType;

        if (["character", "monster"].includes(pendingDiceRoll.entityType)) {
            ddbMessage.entityType = pendingDiceRoll.entityType;
            ddbMessage.data.context.entityType = pendingDiceRoll.entityType;
        }
        if (pendingDiceRoll.entityId !== undefined) {
            ddbMessage.entityId = pendingDiceRoll.entityId;
            ddbMessage.data.context.entityId = pendingDiceRoll.entityId;
        }
        const isValid = (str) => { return typeof str === "string" && true && str.length > 0 };
        if (isValid(pendingDiceRoll?.action)) {
            ddbMessage.data.action = pendingDiceRoll.action;
        }
        if (isValid(pendingDiceRoll.avatarUrl)) {
            ddbMessage.data.context.avatarUrl = pendingDiceRoll.avatarUrl;
        } 
        else if(window.CAMPAIGN_INFO?.dmId == ddbMessage.entityId || ddbMessage.entityId == 'false'){
            ddbMessage.data.context.avatarUrl = dmAvatarUrl
        } else if(window.pcs?.filter(d => d.characterId == ddbMessage.entityId)?.length>0){
            ddbMessage.data.context.avatarUrl = window.pcs?.filter(d => d.characterId == ddbMessage.entityId)[0].image
        }      
        if (isValid(pendingDiceRoll.name)) {
            ddbMessage.data.context.name = pendingDiceRoll.name;
        }
        if (pendingSendTo != undefined) {
            const sendTo = pendingSendTo.toLowerCase();
            const scope = sendTo === "everyone" ? "gameId" : "userId";
            const target = sendTo === "everyone" ? `${window.gameId}` : sendTo === "dungeonmaster" || sendTo === "dm" ? `${window.CAMPAIGN_INFO.dmId}` : `${window.myUser}`;
            ddbMessage.messageScope = scope
            ddbMessage.data.context.messageScope = scope;
            ddbMessage.messageTarget = target;
            ddbMessage.data.context.messageTarget = target;
        }
        if (this.#pendingMessages[ddbMessage.data.rollId])
            this.#pendingMessages[ddbMessage.data.rollId].ddbMessage = ddbMessage;
    }
}
function getDdb3dDiceShareToggle(){
    const newDice = $("[class*='DiceContainer_button']").length > 0
    const userDiceData = localStorage.getItem('userDiceData')
    return newDice && userDiceData !== null && window.MB?.userid != undefined ? JSON.parse(localStorage.getItem('userDiceData')).state?.[window.MB.userid]?.settings?.visibility != 'disabled' : true;
}
function replace_gamelog_message_expressions(listItem) {

    let expressionSpan = listItem.find("[class*='-Line-Notation'] span");
    if (expressionSpan.length > 0) {
        let avttExpression = listItem.attr("data-avtt-expression");
        if (avttExpression !== undefined && avttExpression.length > 0) {
            expressionSpan.text(avttExpression);
            expressionSpan.attr("title", avttExpression);
            console.log("injected avttExpression", avttExpression);
        }
    }

    let expressionResultSpan = listItem.find("[class*='-Line-Breakdown'] span");
    if (expressionResultSpan.length > 0) {
        let avttExpressionResult = listItem.attr("data-avtt-expression-result");
        if (avttExpressionResult !== undefined && avttExpressionResult.length > 0) {
            expressionResultSpan.text(avttExpressionResult);
            console.log("injected avttExpressionResult", avttExpressionResult);
        }
    }
}

function getCharacterStatModifiers(entityType, entityId) {
    console.debug("getCharacterStatModifiers", entityType, entityId);
    if (entityType === "character" && typeof window.pcs === "object") {
        try {
            const pc = window.pcs.find(pc => pc.sheet.includes(entityId));
            if (typeof pc === "object" && typeof pc.abilities === "object" && typeof pc.proficiencyBonus === "number") {
                const statMods = {
                    "str": pc.abilities.find(a => a.name === "str").modifier,
                    "dex": pc.abilities.find(a => a.name === "dex").modifier,
                    "con": pc.abilities.find(a => a.name === "con").modifier,
                    "int": pc.abilities.find(a => a.name === "int").modifier,
                    "wis": pc.abilities.find(a => a.name === "wis").modifier,
                    "cha": pc.abilities.find(a => a.name === "cha").modifier,
                    "pb": pc.proficiencyBonus
                };
                console.debug("getCharacterStatModifiers built statMods from window.pcs", statMods);
                return statMods;
            }
        } catch (error) {
            console.warn("getCharacterStatModifiers failed to collect abilities from window.pcs", error);
        }
    }
    if (is_characters_page()) {
        try {
            let stats = $(".ddbc-ability-summary__secondary");
            const statMods = {
                "str": stats[0].textContent.match(/[+-]/gi) ? parseInt(stats[0].textContent) : Math.floor((parseInt(stats[0].textContent) - 10) / 2),
                "dex": stats[1].textContent.match(/[+-]/gi) ? parseInt(stats[1].textContent) : Math.floor((parseInt(stats[1].textContent) - 10) / 2),
                "con": stats[2].textContent.match(/[+-]/gi) ? parseInt(stats[2].textContent) : Math.floor((parseInt(stats[2].textContent) - 10) / 2),
                "int": stats[3].textContent.match(/[+-]/gi) ? parseInt(stats[3].textContent) : Math.floor((parseInt(stats[3].textContent) - 10) / 2),
                "wis": stats[4].textContent.match(/[+-]/gi) ? parseInt(stats[4].textContent) : Math.floor((parseInt(stats[4].textContent) - 10) / 2),
                "cha": stats[5].textContent.match(/[+-]/gi) ? parseInt(stats[5].textContent) : Math.floor((parseInt(stats[5].textContent) - 10) / 2),
                "pb": parseInt($(".ct-proficiency-bonus-box__value, .ct-combat-mobile__extra--proficiency [class*='styles_numberDisplay']").text())
            };
            console.debug("getCharacterStatModifiers built statMods from character sheet html", statMods);
            return statMods
        } catch (error) {
            console.warn("getCharacterStatModifiers failed to collect abilities from character sheet", error);
        }
    }
    console.log("getCharacterStatModifiers found nothing");
    return undefined;
}

/**
 * Takes the raw strong from the chat input, and returns a new string with all the modifier keys replaced with numbers.
 * This only works on the character page. If this is called from a different page, it will immediately return the given slashCommand.
 * @example passing "1d20+dex+pb" would return "1d20+3+2" for a player that has a +2 dex mod and a proficiency bonus of 2
 * @param slashCommandText {String} the string from the chat input
 * @returns {String} a new string with numbers instead of modifier if on the characters page, else returns the given slashCommand.
 */
function replaceModifiersInSlashCommand(slashCommandText, entityType, entityId) {
    if (typeof slashCommandText !== "string") {
        console.warn("replaceModifiersInSlashCommand expected a string, but received", slashCommandText);
        return "";
    }

    const expression = slashCommandText.replace(diceRollCommandRegex, "").match(allowedExpressionCharactersRegex)?.[0];

    if (expression === undefined || expression === "") {
        return slashCommandText; // no valid expression to parse
    }

    const modifiers = getCharacterStatModifiers(entityType, entityId);
    if (modifiers === undefined) {
        // This will happen if the DM opens a character sheet before the character stats have loaded
        console.warn("getCharacterStatModifiers returned undefined. This command may not parse properly", slashCommandText);
        return slashCommandText; // missing required info
    }

    let modifiedExpression = `${expression}`; // make sure we use a copy of the string instead of altering the variable that was passed in
    const modifiersToReplace = expression.matchAll(validModifierSubstitutions);
    const validModifierPrefix = /(\s*[+|-]\s*)$/; // we only want to substitute valid parts of the expression. For example: We only want to replace the first `dex` in this string "/r 1d20 + dex dex-based attack"
    for (const match of modifiersToReplace) {
        const mod = match[0];
        const expressionUpToThisPoint = match.input.substring(0, match.index);
        if (validModifierPrefix.test(expressionUpToThisPoint)) {
            // everything up to and including this match is valid. let's replace this modifier with the appropriate value.
            modifiedExpression = modifiedExpression.replace(mod, modifiers[mod.toLowerCase()]); // explicitly only replacing the first match. We do not want to replaceAll here.
        } else {
            break; // we got to a point in the expression that is no longer valid. Stop substituting
        }
    }

    const modifiedCommand = slashCommandText.replaceAll(expression, modifiedExpression);

    console.log("replaceModifiersInSlashCommand changed", slashCommandText, "to", modifiedCommand);
    return modifiedCommand;
}
