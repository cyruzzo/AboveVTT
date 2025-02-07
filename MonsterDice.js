
/**
 * Adds in rolling buttons and spell tracker inputs to monster frames that are not encounter frames.
 * Specifically monster frames that appear to the player
 * @param {$} target jqeury selected element to put rolling buttons into
 * @param {object} stats stats of the monster
 * @param {string} tokenId id of the token
 */
function scan_monster(target, stats, tokenId) {
	console.group("scan_monster")
	console.log("adding in avtt dice buttons")
	// remove homebrew panels
	target.find(".homebrew-creation-actions").remove();
	target.find(".homebrew-previous-versions").remove();
	target.find(".homebrew-details-footer").remove();
	target.find("#footer-push").remove();
	target.find("#footer").remove();
	target.find(".integrated-dice__container").hide();
	// attempt to the tokens name first, failing tha
	const displayName = window.TOKEN_OBJECTS[tokenId] ? window.TOKEN_OBJECTS[tokenId].options?.revealname == true ? window.TOKEN_OBJECTS[tokenId].options.name : `` : target.find(".mon-stat-block__name-link").text(); // Wolf, Owl, etc
	const creatureAvatar = window.TOKEN_OBJECTS[tokenId]?.options.imgsrc || stats.data.avatarUrl;

	function clickHandler(clickEvent) {
		roll_button_clicked(clickEvent, displayName, creatureAvatar, "monster", stats.data.id)
	};

	function rightClickHandler(contextmenuEvent) {
		roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar, "monster", stats.data.id);
	}

	replace_ability_scores_with_avtt_rollers(target, ".ability-block__stat" ,".ability-block__heading", true)
	replace_saves_skill_with_avtt_rollers(target, ".mon-stat-block__tidbit", ".mon-stat-block__tidbit-label", ".mon-stat-block__tidbit-data", true )

	// replace all "to hit" and "damage" rolls
	$(target).find(".mon-stat-block p").each(function() {
		if ($(this).find(".avtt-roll-button").length == 0) {
				$($(this)).find("span[data-dicenotation]").each(function (){
				// clone the element as if it came from an iframe these variables won't be freed from memory
				let currentElement = $(this).clone()
				const modMatch = $(currentElement).attr("data-dicenotation")?.match(/(\+|-).*/gm)
				const modifier = (modMatch ? modMatch.shift() : "").replaceAll("(", "").replaceAll(")", "").replace(/\s/g, '');;
				const dice = $(currentElement).attr("data-dicenotation")?.replace(/(\+|-).*/gm, "").replace(/\s/g, '');
				const rollType = $(currentElement).attr("data-rolltype")?.replace(" ","-")
				const actionType = $(currentElement).attr("data-rollaction")?.replace(" ","-") || "custom"
				const text = $(currentElement)?.text()
				const followingText = $(this)[0].nextSibling?.textContent?.trim()?.split(' ')[0]


				$(this).replaceWith(`<button data-exp='${dice}' data-mod='${modifier}' data-rolltype='${rollType}' ${followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? `data-damagetype='${followingText}'` : ''} data-actiontype='${actionType}' class='avtt-roll-button' title="${actionType} ${rollType}">${text}</button>`)
				// terminate the clones reference, overkill but rather be safe when it comes to memory
				currentElement = null
			})
		}
	});

	// the iframe all these button exist in doesn't have the styling from above.css so add the styling here
	$(target).find(".avtt-roll-button").css(
	{
		"color": "#b43c35",
		"border": "1px solid #b43c35",
		"border-radius": "4px",
		"background-color":" #fff",
		"white-space":" nowrap",
		"font-size": "14px",
		"font-weight": "600",
		"font-family":"Roboto Condensed,Open Sans,Helvetica,sans-serif",
		"line-height": "18px",
		"letter-spacing": "1px",
		"padding": "1px 4px 0"
	}
	)


	$(target).find(".avtt-roll-button").click(clickHandler);
	$(target).find(".avtt-roll-button").on("contextmenu", rightClickHandler);
	add_ability_tracker_inputs(target, tokenId)
	
	console.groupEnd()
}

/**
 * Adds in tracker input slot on elements that appear as "2/Day each"
 * @param {$} target 
 * @param {string} tokenId 
 */
function add_ability_tracker_inputs_on_each(target, tokenId){
	const token = window.TOKEN_OBJECTS[tokenId];
	if(target.find('.add-input').length)
		return;
	if(target.find('strong:first-of-type').text().match(/at will:|\/day each/gi)){
		target.find('strong').each(function(){
			let currentElement = $(this).nextUntil('strong').addBack();
			if (currentElement.find(".injected-input").length == 0) {
				const matchForEachSlot = currentElement.text().match(/([0-9])\/Day each:|([0-9])\/Day:/gi)

				if (matchForEachSlot){
					let numberFound = parseInt(matchForEachSlot[0]);
					$(this).nextUntil('strong').each(function (indexInArray, valueOfElement) { 
						let spellName = $(valueOfElement).clone().text().replace(/\s/g, "")
						if(spellName == '')
							return;
						// token already has this ability tracked
						if (token.options.abilityTracker?.[spellName] >= 0){
							numberFound = token.options.abilityTracker[spellName]
						}else{
							token.track_ability(spellName, numberFound)
						}
						$(valueOfElement).after(
							createCountTracker(
								token,
								spellName, 
								numberFound,
								 "",
								 ""
							)
						)
						spellName = null
					});			
				}
				
			}
			// terminate the clones reference, overkill but rather be safe when it comes to memory
			currentElement = null
		})
	}
	else{
		target.find(".mon-stat-block__description-block-content > p").each(function() {
			let currentElement = $(this).clone();
			if (currentElement.find(".injected-input").length == 0) {
				const matchForEachSlot = currentElement.text().match(/([0-9])\/Day each:/i)
				if (matchForEachSlot){
					let numberFound = parseInt(matchForEachSlot[1]);
					$(this).children().each(function (indexInArray, valueOfElement) { 
						let spellName = $(valueOfElement).clone().text().replace(/\s/g, "")
						// token already has this ability tracked
						if (token.options.abilityTracker?.[spellName] >= 0){
							numberFound = token.options.abilityTracker[spellName]
						}else{
							token.track_ability(spellName, numberFound)
						}
						$(valueOfElement).after(
							createCountTracker(
								token,
								spellName, 
								numberFound,
								 "",
								 ""
							)
						)
						spellName = null
					});			
				}
				
			}
			// terminate the clones reference, overkill but rather be safe when it comes to memory
			currentElement = null
		});
	}
		
}

function rebuild_ability_trackers(target, tokenId){
	target.find(".injected-input").remove()
	add_ability_tracker_inputs(target, tokenId)
}

/**
 * Creates the input tracker used for spell/legendaries with a change handler that calls token.track_ability
 * @param {string} key 
 * @param {string} remaining 
 * @param {string} foundDescription 
 * @param {string} descriptionPostfix 
 * @returns 
 */
function createCountTracker(token, key, remaining, foundDescription, descriptionPostfix, callback) {
	const input = $(`<input class="injected-input" data-token-id="${token.id}" data-tracker-key="${key}" type="number" value="${remaining}" style="font-size: 14px; width: 40px; appearance: none; border: 1px solid #d8e1e8; border-radius: 3px;"> ${foundDescription} ${descriptionPostfix}</input>`);
	input.off("change").on("change", function(changeEvent) {
		const updatedValue = changeEvent.target.value;
		console.log(`add_ability_tracker_inputs ${key} changed to ${updatedValue}`);
		if(callback)
			callback(key, updatedValue);
		else
			token.track_ability(key, updatedValue);
	});
	return input
}

/**
 * Adds spell/feature/legendary tracker inputs to a monster block
 * @param {$} target 
 * @param {string} tokenId 
 * @returns 
 */
function add_ability_tracker_inputs(target, tokenId) {
	const token = window.TOKEN_OBJECTS[tokenId];
	if (token === undefined) {
		// nothing to track if we don't have a token
		return;
	}

	// Unfortunately, we can't just do a regex replace because DDB breaks if we mess with their html.
	// However, it seems to work just fine if we append the input at the end instead of inline.

	const processInput = function(element, regex, descriptionPostfix, includeMatchingDescription = true) {
		
		const foundMatches = element.clone().text().match(regex); // matches `(1 slot)`, `(4 slots)`, etc
		if (foundMatches !== undefined && foundMatches != null && foundMatches.length > 1) {
			let numberFound = parseInt(foundMatches[1]);
			if (!isNaN(numberFound)) {
				const foundDescription = includeMatchingDescription ? foundMatches.input.substring(0, foundMatches.index) : ''; // `1st level `, `2nd level `, etc.
				const key = foundDescription.replace(/\s/g, ""); // `1stlevel`, `2ndlevel`, etc.
				// token already has this ability tracked, update the input
				if (token.options.abilityTracker?.[key] >= 0){
					numberFound = token.options.abilityTracker[key]
				} else{
					token.track_ability(key, numberFound)
				}
				const input = createCountTracker(token, key, numberFound, foundDescription, descriptionPostfix)
				element.append(`<br>`);
				element.append(input);
			}
		}
		
	}

	// //Spell Slots, or technically anything with 'slot'... might be able to refine the regex a bit better...
	target.find("p").each(function() {
		let element = $(this);
		if(element.find('strong').text().match(/at will|day each/gi) || element.find('.add-input').length)
			return;

		if ($(this).find(".injected-input").length === 0) {
			processInput(element, /\(([0-9]) slots?\)/, "slots remaining")
			processInput(element, /\(([0-9])\/Day\)/i, "remaining")
			processInput(element, /can take ([0-9]) legendary actions/i, "Legendary Actions remaining", false)
		}
		element = null
	});	
	add_ability_tracker_inputs_on_each(target, tokenId)
}

/**
 * replaces ability scores with rolling buttons
 * used by both the extra pane scanning and monster frame scanning
 * they're both slightly different and have different selectors as well button count
 * @param {$} target jquery selected target to add buttons into
 * @param {string} outerSelector an outer selector to find against
 * @param {string} innerSelector and inner selector to find against
 * @param {bool} addAdvDisButton whether to add in additional Crit/Adv/Dis buttons (currently only used by monster frame)
 */
function replace_ability_scores_with_avtt_rollers(target, outerSelector, innerSelector, addAdvDisButton) {
	$(target).find(outerSelector).each(function() {
		let currentElement = $(this).clone()
		if (currentElement.find(".avtt-roll-button").length === 0) {
			const abilityType = $(currentElement).find(innerSelector).html()
			const rollType="check"
			// matches (+1) 
			const updated = currentElement.html()
				.replaceAll(/(\([+\-] ?[0-9][0-9]?\))/g, `<button data-exp='1d20' data-mod='$1' data-rolltype=${rollType} data-actiontype=${abilityType} class='avtt-roll-button' title="${abilityType} ${rollType}">$1</button>`);
			$(this).html(updated);
		}
		// terminate the clones reference, overkill but rather be safe when it comes to memory
		currentElement = null
	});
}

/**
 * replaces "tidbits" with avtt roller buttons
 * tidbits are skills/saving throws as well as additional monster stat items that don't have buttons added to
 * @param {$} target jquery selected element
 * @param {string} outerSelector an outer selector to find against
 * @param {string} labelSelector a selector for the tidbit label
 * @param {string} dataSelector a selector for the data section of the tidbit
 * @param {bool} addAdvDisButton 
 */
function replace_saves_skill_with_avtt_rollers(target, outerSelector, labelSelector, dataSelector, addAdvDisButton){
// replace saving throws, skills, etc
$(target).find(outerSelector).each(function() {
	let currentElement = $(this).clone()
	if (currentElement.find(".avtt-roll-button").length === 0) {
		const label = $(currentElement).find(labelSelector).html()
		if (label === "Saving Throws" || label === "Skills"){
			// get the tidbits in the form of ["DEX +3", "CON +4"] or ["Athletics +6", "Perception +3"]
			const tidbitData = $(currentElement).find(dataSelector).html().trim().split(",")
			const allTidBits = []
			tidbitData.forEach((tidbit) => {
				// can only be saving throw or skills here, which is either save/check respectively
				const rollType = label === "Saving Throws" ? "save" : "check"
				// will be DEX/CON/ATHLETICS/PERCEPTION
				const actionType = tidbit.trim().replace(/\s\S+$/, '')
				// matches " +1 " or " + 1 "
				const rollRegex = /(?<![0-9]+d[0-9]+)([:\s>])([+-]\s?[0-9]+)([:\s<,])?/gi
				
				allTidBits.push(tidbit.replaceAll(rollRegex, `$1<button data-exp='1d20' data-mod='$2' data-rolltype='${rollType}' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'> $2</button>$3`))
			})		
			$(this).find(dataSelector).html(allTidBits);				
		}
	}
	// terminate the clones reference, overkill but rather be safe when it comes to memory
	currentElement = null
});}


/**
 * Scans the player sheet to add in roller buttons to the extra tab
 * @param {$} target jquery selected element
 */
function scan_player_creature_pane(target) {
	console.group("scan_player_creature_pan")

	const creatureType = $(".ct-sidebar__header .ct-sidebar__header-parent, .ct-sidebar__header>div:first-of-type").text(); // wildshape, familiar, summoned, etc	
	const creatureName = $(".ct-sidebar__header .ddbc-creature-name").text(); // Wolf, Owl, etc
	let pcSheet = find_currently_open_character_sheet();
	const pc = find_pc_by_player_id(pcSheet);
	let creatureAvatar = window.pc?.image;
 	try {
 		// not all creatures have an avatar for some reason
 		creatureAvatar = $(".ct-sidebar__header .ct-sidebar__header-preview-image").css("background-image").slice(4, -1).replace(/"/g, "");
 	} catch { }
	const displayName = `${pc.name} (${creatureName} ${creatureType})`;
	
	const clickHandler = function(clickEvent) {
		roll_button_clicked(clickEvent, displayName, creatureAvatar, "monster");
	};

	const rightClickHandler = function(contextmenuEvent) {
		roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar, "monster");
	}


	replace_ability_scores_with_avtt_rollers(target, ".ddbc-creature-block__ability-stat, [class*='styles_stats']>[class*='styles_stat']", ".ddbc-creature-block__ability-heading, [class*='styles_statHeading']")
	replace_saves_skill_with_avtt_rollers(target, ".ddbc-creature-block__tidbit, [class*='styles_tidbit']",".ddbc-creature-block__tidbit-label, [class*='styles_tidbitLabel']", ".ddbc-creature-block__tidbit-data, p" )

	// replace all "to hit" and "damage" rolls
	$(target).find("p, .ddbc-creature-block__attribute-data-extra").each(function() {
		let currentElement = $(this).clone()
		if (currentElement.find(".avtt-roll-button").length === 0) {
			// apply most specific regex first matching all possible ways to write a dice notation
			// to account for all the nuances of DNDB dice notation.
			// numbers can be swapped for any number in the following comment
			// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
			const damageRollRegexBracket = /(\()(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)(\))/gi
			const damageRollRegex = /([:\s>])(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)([:\s<,])/gi
			// matches " +1 " or " + 1 "
			const hitRollRegexBracket = /(?<![0-9]+d[0-9]+)(\()([+-]\s?[0-9]+)(\))/gi
			const hitRollRegex = /(?<![0-9]+d[0-9]+)([:\s>])([+-]\s?[0-9]+)([:\s<,])/gi
			const dRollRegex = /\s(\s?d[0-9]+)\s/gi
			const tableNoSpaceRollRegex = />(\s?d[0-9]+\s?)</gi
			const rechargeRegEx = /(Recharge [0-6]?\s?[–-]?\s?[0-6])/gi
			const actionType = "AboveVTT"
			const updated = currentElement.html()
				.replaceAll(damageRollRegexBracket, `<button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'> $1$2$5</button>`)
				.replaceAll(damageRollRegex, `$1<button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'> $2</button>$5`)
				.replaceAll(hitRollRegexBracket, `<button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1$2$3</button>`)
				.replaceAll(hitRollRegex, `$1<button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $2</button>$3`)
				.replaceAll(dRollRegex, ` <button data-exp='1$1' data-mod='0' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1</button> `)
				.replaceAll(tableNoSpaceRollRegex, `><button data-exp='1$1' data-mod='0' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1</button><`)
				.replaceAll(rechargeRegEx, `<button data-exp='1d6' data-mod='' data-rolltype='recharge' data-actiontype='Recharge' class='avtt-roll-button' title='${actionType}'> $1</button>`)
				




			$(this).html(updated);
		}
		// terminate the clones reference, overkill but rather be safe when it comes to memory
		currentElement = null
	});
	$(target).find('button.avtt-roll-button[data-rolltype]').each(function(){
		let rollAction = $(this).prevUntil('em>strong').find('strong').last().text().replace('.', '') || $(this).attr('data-actiontype');
		rollAction = (rollAction == '') ? $(this).prev('strong').last().text().replace('.', '') : rollAction;
		rollAction = (rollAction == '') ? $(this).prevUntil('strong').last().prev().text().replace('.', '') : rollAction;
		rollAction = (rollAction == '') ? $(this).parent().prevUntil('em>strong').find('strong').last().text().replace('.', '') : rollAction;
		rollAction = (rollAction == '') ? $(this).closest('strong').text().replace('.', '') : rollAction;
		

		rollAction = rollAction.replace(/\s[\s(]+Recharge.*/gi, '') 
		
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

		if(rollAction == ''){
			rollAction = 'Roll';
		}	
		else if(rollAction.replace(' ', '').toLowerCase() == 'savingthrows'){	
			rollAction = $(this)[0].previousSibling.nodeValue.replace(/[\W]+/gi, '');
			rollAction = (rollAction == '') ? $(this).prev().text().replace(/[\W]+/gi, '') : rollAction;
			rollType = 'Save';	
		}
		else if(rollAction.replace(' ', '').toLowerCase() == 'skills'){
			rollAction = $(this)[0].previousSibling.nodeValue.replace(/[\W]+/gi, '');
			rollAction = (rollAction == '') ? $(this).prev().text().replace(/[\W]+/gi, '') : rollAction;
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
		
		const damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined
		if(damageType != undefined){
			$(this).attr('data-damagetype', damageType);
		}
	})
	$(target).find(".avtt-roll-button").off('click.roller').on('click.roller', clickHandler);
	$(target).find(".avtt-roll-button").on("contextmenu", rightClickHandler);
	console.groupEnd()
}



/**
 * When a roll button is right-clicked, this builds and displays a contextmenu, then handles everything related to that contextmenu
 * @param {Event} contextmenuEvent      the event that jQuery gives you from `whatever.on("contextmenu")`
 * @param {String} displayName the name of the player/creature to be displayed in the gamelog
 * @param {String} imgUrl      a url for the image to be displayed in the gamelog for the player/creature that is rolling
 * @param entityType {string|undefined} the type of entity associated with this roll. EG: "character", "monster", "user" etc. Generic rolls from the character sheet defaults to "character", generic rolls from the encounters page defaults to "user"
 * @param entityId {string|undefined} the id of the entity associated with this roll. If {entityType} is "character" this should be the id for that character. If {entityType} is "monster" this should be the id for that monster. If {entityType} is "user" this should be the id for that user.
 */
function roll_button_contextmenu_handler(contextmenuEvent, displayName, imgUrl, entityType = undefined, entityId = undefined) {
	contextmenuEvent.stopPropagation();
	contextmenuEvent.preventDefault();

	const pressedButton = $(contextmenuEvent.currentTarget);
	const expression = pressedButton.attr('data-exp');
	const modifier = pressedButton.attr('data-mod')?.replaceAll("(", "")?.replaceAll(")", "");
	const rollType = pressedButton.attr('data-rolltype');
	const actionType = pressedButton.attr('data-actiontype');
	const damageType = pressedButton.attr('data-damagetype');

	if (rollType === "damage") {
		damage_dice_context_menu(`${expression}${modifier}`, modifier, actionType, rollType, displayName, imgUrl, entityType, entityId, damageType)
			.present(contextmenuEvent.clientY, contextmenuEvent.clientX) // TODO: convert from iframe to main window
	} else {
		standard_dice_context_menu(`${expression}${modifier}`, modifier, actionType, rollType, displayName, imgUrl, entityType, entityId)
			.present(contextmenuEvent.clientY, contextmenuEvent.clientX) // TODO: convert from iframe to main window
	}
}

/**
 * click handler for all avtt roller buttons
 * @param {event} clickEvent 
 * @param {string} displayName display name to send to combat log
 * @param {string} imgUrl image url to sent to combat log
 * @param entityType {string|undefined} the type of entity associated with this roll. EG: "character", "monster", "user" etc. Generic rolls from the character sheet defaults to "character", generic rolls from the encounters page defaults to "user"
 * @param entityId {string|undefined} the id of the entity associated with this roll. If {entityType} is "character" this should be the id for that character. If {entityType} is "monster" this should be the id for that monster. If {entityType} is "user" this should be the id for that user.
 */
function roll_button_clicked(clickEvent, displayName, imgUrl, entityType = undefined, entityId = undefined) {
	let pressedButton = $(clickEvent.currentTarget).clone();
	const expression = pressedButton.attr('data-exp');
	let modifier = pressedButton.attr('data-mod')?.replaceAll("(", "")?.replaceAll(")", "");
	let rollType = pressedButton.attr('data-rolltype');
	const action = pressedButton.attr('data-actiontype');
	const damageType = pressedButton.attr('data-damagetype');
	modifier = modifier == 0 ? '+0' : modifier;

	window.diceRoller.roll(new DiceRoll(
		`${expression}${modifier}`,
		action,
		rollType,
		displayName,
		imgUrl,
		entityType,
		entityId
	), undefined, undefined, undefined, undefined, damageType);
	
	pressedButton = null
}


/** finds all HTML elements on a monster details page that should be rollable and wraps them in buttons that roll rpgDiceRoller dice
 * @param target {jQuery} the jQuery element to search within. Should be the entire monster details page. For example: https://www.dndbeyond.com/monsters/17100-aarakocra
 * @param displayName {string} the name that should be displayed in the gamelog when the user rolls this modifier
 * @param creatureAvatar {string} the url of the image that should be displayed in the gamelog when the user rolls this modifier */
function scan_creature_pane(target, displayName, creatureAvatar) {
	console.group("scan_creature_pane")

	// replace ability scores modifiers
	target.find(".mon-stat-block .mon-stat-block__stat-block .ability-block .ability-block__modifier").each(function() {
		replace_modifiers($(this));
	});

	// replace saving throws, skills, etc
	target.find(".mon-stat-block__tidbits .mon-stat-block__tidbit-data").each(function() {
		replace_stat_block_tidbits($(this));
	});

	// replace all "to hit" and "damage" rolls
	target.find(".mon-stat-block p").each(function() {
		replace_stat_block_description($(this));
	});

	target.find(".avtt-roll-button").on("click", function(clickEvent) {
		roll_button_clicked(clickEvent, displayName, creatureAvatar, "monster")
	});

	target.find(".avtt-roll-button").on("contextmenu", function (contextmenuEvent) {
		roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar, "monster");
	});

	console.groupEnd()
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param target {jQuery} the jQuery element that contains modifiers HTML */
function replace_modifiers(target) {
	let currentElement = $(target).clone()
	if (currentElement.find(".avtt-roll-button").length === 0) {
		const innerHtml = currentElement.html();
		const foundModifiers = innerHtml.match(/([\+\-] ?[0-9][0-9]?)/g);
		if (foundModifiers.length > 0) {
			const mod = foundModifiers[0];
			const button = $(`<button data-exp='1d20' data-mod='${mod}' data-rolltype='tohit' class='avtt-roll-button'>${innerHtml}</button>`);
			$(target).html(button);
		}
	}
	// terminate the clones reference, overkill but rather be safe when it comes to memory
	currentElement = null
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param target {jQuery} the jQuery element that contains modifiers HTML */
function replace_stat_block_tidbits(target) {
	let currentElement = $(target).clone()
	if (currentElement.find(".avtt-roll-button").length === 0) {
		const updated = currentElement.html()
			.replaceAll(/([\+\-] ?[0-9][0-9]?)/g, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>");
		$(target).html(updated);
	}
	// terminate the clones reference, overkill but rather be safe when it comes to memory
	currentElement = null
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param target {jQuery} the jQuery element that contains modifiers HTML */
function replace_stat_block_description(target) {
	let currentElement = $(target).clone()
	if (currentElement.find(".avtt-roll-button").length === 0) {
		// apply most specific regex first matching all possible ways to write a dice notation
		// to account for all the nuances of DNDB dice notation.
		// numbers can be swapped for any number in the following comment
		// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
		const damageRollRegex = /([0-9]+d[0-9]+\s?([\+-]\s?[0-9]+)?)/g
		// matches " +1 " or " + 1 "
		const hitRollRegex = /\s([\+-]\s?[0-9]+)\s/g
		const updated = currentElement.html()
			.replaceAll(damageRollRegex, "<button data-exp='$1' data-mod='' data-rolltype='damage' class='avtt-roll-button'>$1</button>")
			.replaceAll(hitRollRegex, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>")
		$(target).html(updated);
	}
	// terminate the clones reference, overkill but rather be safe when it comes to memory
	currentElement = null
}
