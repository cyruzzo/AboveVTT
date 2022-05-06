
$(function() {
    window.diceRoller = new DiceRoller();

    // TODO: remove this once PR #394 is merged
    if (!window.ajaxQueue.addDDBRequest) {
        window.ajaxQueue.addDDBRequest = function(options) {
            get_cobalt_token(function (token) {
                let previousBeforeSend = options.beforeSend;
                options.beforeSend = function (xhr) {
                    if (previousBeforeSend) {
                        previousBeforeSend(xhr);
                    }
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                };
                options.xhrFields = {
                    withCredentials: true
                };
                $.ajax(options);
            });
        }
    }
});

const allDiceRegex = /\d+d(?:100|20|12|10|8|6|4)(?:kh\d+|kl\d+)|\d+d(?:100|20|12|10|8|6|4)/g; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
const validExpressionRegex = /^[dkhl\s\d+\-]*$/g; // any of these [d, kh, kl, spaces, numbers, +, -] // Should we support [*, /] ?

class DiceRoll {
    // `${action}: ${rollType}` is how the gamelog message is displayed

    // don't allow changing these. They can only be set from within the constructor.
    #fullExpression = "";
    get expression() { return this.#fullExpression; }

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
        let alteredRollType = newRollType.trim().toLowerCase().replace("-", " ");
        const validRollTypes = ["to hit", "damage", "save", "check", "heal", undefined]; // undefined is in the list to allow clearing it
        if (validRollTypes.includes(alteredRollType)) {
            this.#diceRollType = alteredRollType;
        } else {
            console.warn(`not setting rollType. Expected one of ${JSON.stringify(validRollTypes)}, but received "${newRollType}"`);
        }
    }

    name;       // monster name, player name, etc.
    avatarUrl;  // the url of the image to render in the gamelog message

    entityType; // "character", "monster", etc
    entityId;   // the id of the character, monster, etc

    // DDB parses the object after we give it back to them.
    // expressions that are more complex tend to have incorrect expressions displayed because DDB handles that.
    // We need to adjust the outgoing message according to how we expect DDB to parse it
    isComplex() {
        if (this.diceExpressions.length !== 1) {
            return true; // more than 1 expression messes with the parsing that DDB does
        }

        if (this.expression.indexOf(this.diceExpressions[0]) !== 0) {
            return true; // 1-1d4 messes with the parsing that DDB does, but 1d4-1 is just fine
        }

        let advantageMatch = this.diceExpressions[0].match(/kh\d+/g);
        if (advantageMatch?.length > 1 || (advantageMatch?.length === 1 && !this.diceExpressions[0].endsWith("kh1"))) {
            // anything other than kh1 is complex. Such as kh10 or kh2
            return true;
        }
        let disAdvantageMatch = this.diceExpressions[0].match(/kl\d+/g);
        if (disAdvantageMatch?.length > 1 || (disAdvantageMatch?.length === 1 && !this.diceExpressions[0].endsWith("kl1"))) {
            // anything other than kl1 is complex. Such as kl10 or kl2
            return true;
        }

        // not sure what else to look for yet, but this appears to be something like "1d20", "1d20-1", "1d20kh1+3". all of which are correctly parsed by DDB
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
     */
    constructor(expression, action = undefined, rollType = undefined, name = undefined, avatarUrl = undefined, entityType = undefined, entityId = undefined) {

        let parsedExpression = expression.replaceAll(/\s+/g, ""); // remove all spaces
        if (!parsedExpression.match(validExpressionRegex)) {
            console.warn("Not parsing expression because it contains an invalid character", expression);
            throw "Invalid Expression";
        }

        // find all dice expressions in the expression. converts "1d20+1d4" to ["1d20", "1d4"]
        let separateDiceExpressions = parsedExpression.match(allDiceRegex)
        if (!separateDiceExpressions) {
            console.warn("Not parsing expression because there are no valid dice expressions within it", expression);
            throw "Invalid Expression";
        }

        this.#fullExpression = parsedExpression;
        this.#individualDiceExpressions = separateDiceExpressions;

        if (action) this.action = action;
        if (rollType) this.rollType = rollType;
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
            let calculatedConstant = parseInt(eval(constantEquation.toString())); // execute the equation to get a single number
            if (!isNaN(calculatedConstant)) {
                this.#calculatedExpressionConstant = calculatedConstant;
            }
        }

        // figure out how many of each DiceType we need to roll
        this.#individualDiceExpressions.forEach(diceExpression => {
            let diceType = diceExpression.match(/d\d+/g);
            let numberOfDice = parseInt(diceExpression.split("d")[0]);
            console.debug("diceExpression: ", diceExpression, ", diceType: ", diceType, ", numberOfDice: ", numberOfDice);
            if (this.#separatedDiceToRoll[diceType] === undefined) {
                this.#separatedDiceToRoll[diceType] = numberOfDice;
            } else {
                this.#separatedDiceToRoll[diceType] += numberOfDice;
            }
        });
    }
}

class DiceRoller {

    timeoutDuration = 10000; // 10 second timeout seems reasonable. If the message gets dropped we don't want to be stuck waiting forever.

    /// PRIVATE VARIABLES
    #pendingDiceRoll = undefined;
    #pendingMessage = undefined;
    #timeoutId = undefined;

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

    /// PUBLIC FUNCTIONS

    /**
     * Attempts to parse the expression, and roll DDB dice.
     * If dice are rolled, the results will be processed to make sure the expression is properly calculated.
     * @param diceRoll {DiceRoll} the dice expression to parse and roll. EG: 1d20+4
     * @returns {boolean} whether or not dice were rolled
     */
    roll(diceRoll) {
        try {
            if (diceRoll === undefined || diceRoll.expression === undefined || diceRoll.expression.length === 0) {
                console.warn("DiceRoller.parseAndRoll received an invalid diceRoll object", diceRoll);
                return false;
            }

            if (this.#waitingForRoll) {
                console.warn("parseAndRoll called while we were waiting for another roll to finish up");
                return false;
            }

            console.group("DiceRoller.parseAndRoll");
            console.log("attempting to parse diceRoll", diceRoll);

            this.#resetVariables();

            // we're about to roll dice so we need to know if we should capture DDB messages.
            // This also blocks other attempts to roll until we've finished processing
            let self = this;
            this.#timeoutId = setTimeout(function () {
                console.warn("DiceRoller timed out after 10 seconds!");
                self.#resetVariables();
            }, this.timeoutDuration);

            // don't hold a reference to the object we were given in case it gets altered while we're waiting.
            this.#pendingDiceRoll = new DiceRoll(diceRoll.expression, diceRoll.action, diceRoll.rollType, diceRoll.name, diceRoll.avatarUrl, diceRoll.entityType, diceRoll.entityId);

            this.clickDiceButtons(diceRoll);
            console.groupEnd();
            return true;
        } catch (error) {
            console.warn("failed to parse and send expression as DDB roll; expression: ", expression, error);
            this.#resetVariables();
            console.groupEnd();
            return false;
        }
    }

    /**
     * clicks the DDB dice and then clicks the roll button
     * @param diceRoll {DiceRoll} the DiceRoll object to roll
     */
    clickDiceButtons(diceRoll) {

        if (diceRoll === undefined) {
            console.warn("clickDiceButtons was called without a diceRoll object")
            return;
        }

        if ($(".dice-toolbar").hasClass("rollable")) {
            // clear any that are already selected so we don't roll too many dice
            $(".dice-toolbar__dropdown-die").click();
        }

        if ($(".dice-toolbar__dropdown").length > 0) {
            if (!$(".dice-toolbar__dropdown").hasClass("dice-toolbar__dropdown-selected")) {
                // make sure it's open
                $(".dice-toolbar__dropdown-die").click();
            }
            for(let diceType in diceRoll.diceToRoll) {
                let numberOfDice = diceRoll.diceToRoll[diceType];
                for (let i = 0; i < numberOfDice; i++) {
                    $(`.dice-die-button[data-dice='${diceType}']`).click();
                }
            }
        }

        if ($(".dice-toolbar").hasClass("rollable")) {
            let theirRollButton = $(".dice-toolbar__target").children().first();
            if (theirRollButton.length > 0) {
                // we found a DDB dice roll button. Click it and move on
                theirRollButton.click();
            }
        }
    }

    /// PRIVATE FUNCTIONS

    /** reset all variables back to their default values */
    #resetVariables() {
        console.log("resetting local variables");
        clearTimeout(this.#timeoutId);
        this.#timeoutId = undefined;
        this.#pendingMessage = undefined;
        this.#pendingDiceRoll = undefined;
    }

    /** wraps all messages that are sent by DDB, and processes any that we need to process, else passes it along as-is */
    #wrappedDispatch(message) {
        console.group("DiceRoller.#wrappedDispatch");
        if (!this.#waitingForRoll) {
            console.debug("not capturing: ", message);
            this.ddbDispatch(message);
        } else if (message.eventType === "dice/roll/pending") {
            console.log("capturing pending message: ", message);
            let ddbMessage = { ...message };
            this.#swapDiceRollMetadata(ddbMessage);
            this.#pendingMessage = ddbMessage;
            this.ddbDispatch(ddbMessage);
        } else if (message.eventType === "dice/roll/fulfilled" && this.#pendingMessage?.data?.rollId === message.data.rollId) {
            console.log("capturing fulfilled message: ", message)
            let alteredMessage = this.#swapRollData(message);
            console.log("altered fulfilled message: ", alteredMessage);
            this.ddbDispatch(alteredMessage);
            this.#resetVariables();
        }
        console.groupEnd();
    }

    /** iterates over the rolls of a DDB message, calculates #pendingDiceRoll.expression, and swaps any data necessary to make the message match the expression result */
    #swapRollData(ddbMessage) {
        console.group("DiceRoller.#swapRollData");
        try {
            let alteredMessage = { ...ddbMessage };
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
                let rolledExpressions = r.diceNotationStr.match(allDiceRegex);
                let valuesToMatch = r.result.values;
                rolledExpressions.forEach(diceExpression => {
                    let diceType = diceExpression.match(/d\d+/g);
                    let numberOfDice = parseInt(diceExpression.split("d")[0]);
                    if (matchedValues[diceType] === undefined) {
                        matchedValues[diceType] = [];
                    }
                    matchedValues[diceType] = matchedValues[diceType].concat(valuesToMatch.slice(0, numberOfDice));
                    valuesToMatch = valuesToMatch.slice(numberOfDice);
                })
                console.debug("matchedValues: ", JSON.stringify(matchedValues));

                // 2. replace each dice expression in #pendingDiceRoll.expression with the corresponding dice roll results
                // For example: "2d20kh1+1d4-3" with rolled results of [9, 18, 2] will turn into "18+2-3"
                // we also need to collect the results that we use which will end up being [18, 2] in this example
                let replacedExpression = this.#pendingDiceRoll.expression.toString(); // make sure we have a new string that we alter so we don't accidentally mess up the original
                let replacedValues = []; // will go into the roll object and DDB also parses these.
                this.#pendingDiceRoll.diceExpressions.forEach(diceExpression => {
                    let diceType = diceExpression.match(/d\d+/g);
                    let numberOfDice = parseInt(diceExpression.split("d")[0]);
                    let calculationValues = matchedValues[diceType].slice(0, numberOfDice);
                    matchedValues[diceType] = matchedValues[diceType].slice(numberOfDice);
                    console.debug(diceExpression, "calculationValues: ", calculationValues);

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
                console.log("pendingExpression: ", this.#pendingDiceRoll.expression, ", replacedExpression: ", replacedExpression, ", calculatedTotal:", calculatedTotal, ", replacedValues: ", replacedValues);

                // we successfully processed the expression, now let's update the message object
                r.diceNotationStr = this.#pendingDiceRoll.expression; // this doesn't appear to actually do anything
                r.diceNotation.constant = this.#pendingDiceRoll.calculatedConstant;
                r.result.constant = this.#pendingDiceRoll.calculatedConstant;
                r.result.text = replacedExpression;
                r.result.total = calculatedTotal;
                if (this.#pendingDiceRoll.isComplex()) {
                    r.result.values = replacedValues;
                }
                if (this.#pendingDiceRoll.rollType) {
                    r.rollType = this.#pendingDiceRoll.rollType;
                }
                // need to update the replacedValues above based on kh and kl if we do this
                if (this.#pendingDiceRoll.isAdvantage()) {
                    r.rollKind = "advantage";
                } else if (this.#pendingDiceRoll.isDisadvantage()) {
                    r.rollKind = "disadvantage";
                }
                this.#pendingDiceRoll.resultTotal = calculatedTotal;
                this.#pendingDiceRoll.resultValues = replacedValues;
                this.#pendingDiceRoll.expressionResult = replacedExpression;
            });

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

        if (this.#pendingDiceRoll?.isComplex()) {
            // We manipulated this enough that DDB won't properly display the formula.
            // We'll look for this later to know that we should swap some HTML after this render
            ddbMessage.avttExpression = this.#pendingDiceRoll.expression;
            ddbMessage.avttExpressionResult = this.#pendingDiceRoll.expressionResult;
            console.log("DiceRoll ddbMessage.avttExpression: ", ddbMessage.avttExpression);
        }

        if (["character", "monster"].includes(this.#pendingDiceRoll.entityType)) {
            ddbMessage.entityType = this.#pendingDiceRoll.entityType;
            ddbMessage.data.context.entityType = this.#pendingDiceRoll.entityType;
        }
        if (this.#pendingDiceRoll.entityId !== undefined) {
            ddbMessage.entityId = this.#pendingDiceRoll.entityId;
            ddbMessage.data.context.entityId = this.#pendingDiceRoll.entityId;
        }
        const isValid = (str) => { return typeof str === "string" && true && str.length > 0 };
        if (isValid(this.#pendingDiceRoll.action)) {
            ddbMessage.data.action = this.#pendingDiceRoll.action;
        }
        if (isValid(this.#pendingDiceRoll.avatarUrl)) {
            ddbMessage.data.context.avatarUrl = this.#pendingDiceRoll.avatarUrl;
        }
        if (isValid(this.#pendingDiceRoll.name)) {
            ddbMessage.data.context.name = this.#pendingDiceRoll.name;
        }
    }
}

function replace_gamelog_message_expressions(listItem) {

    let expressionSpan = listItem.find(".tss-1wcf5kt-Line-Notation span");
    if (expressionSpan.length > 0) {
        let avttExpression = listItem.attr("data-avtt-expression");
        if (avttExpression !== undefined && avttExpression.length > 0) {
            expressionSpan.text(avttExpression);
            expressionSpan.attr("title", avttExpression);
            console.log("injected avttExpression", avttExpression);
        }
    }

    let expressionResultSpan = listItem.find(".tss-16k6xf2-Line-Breakdown span");
    if (expressionResultSpan.length > 0) {
        let avttExpressionResult = listItem.attr("data-avtt-expression-result");
        if (avttExpressionResult !== undefined && avttExpressionResult.length > 0) {
            expressionResultSpan.text(avttExpressionResult);
            console.log("injected avttExpressionResult", avttExpressionResult);
        }
    }
}