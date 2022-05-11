
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
	target.find("footer").remove()
	target.find("#footer-push").remove();
	target.find("#footer").remove();
	target.find(".integrated-dice__container").hide();
	// attempt to the tokens name first, failing tha
	const displayName = window.TOKEN_OBJECTS[tokenId]?.options.name || target.find(".mon-stat-block__name-link").text(); // Wolf, Owl, etc
	const creatureAvatar = window.TOKEN_OBJECTS[tokenId]?.options.imgsrc || stats.data.avatarUrl;

	const clickHandler = function(clickEvent) {
		roll_button_clicked(clickEvent, displayName, creatureAvatar, "monster", stats.data.id)
	};

	const rightClickHandler = function(contextmenuEvent) {
		roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar, "monster", stats.data.id);
	}

	replace_ability_scores_with_avtt_rollers(target, ".ability-block__stat" ,".ability-block__heading", true)
	replace_saves_skill_with_avtt_rollers(target, ".mon-stat-block__tidbit", ".mon-stat-block__tidbit-label", ".mon-stat-block__tidbit-data", true )

	// replace all "to hit" and "damage" rolls
	$(target).find(".mon-stat-block p").each(function() {
		let currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length == 0) {
			$(currentElement).find("span").each(function (){
				console.log("this",$(this))
				const modMatch = $(this).attr("data-dicenotation")?.match(/(\+|-).*/gm)
				const modifier = (modMatch ? modMatch.shift() : "").replaceAll("(", "").replaceAll(")", "");
				const dice = $(this).attr("data-dicenotation")?.replace(/(\+|-).*/gm, "")
				const rollType = $(this).attr("data-rolltype")?.replace(" ","-")
				const actionType = $(this).attr("data-rollaction")?.replace(" ","-") || "custom"
				const text = $(this)?.text()
				$(this).replaceWith(`<button data-exp=${dice} data-mod=${modifier} data-rolltype=${rollType} data-actiontype=${actionType} class='avtt-roll-button' title="${actionType} ${rollType}">${text}</button>`)
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
	target.find(".mon-stat-block__description-block-content > p").each(function() {
		let element = $(this);
		if (element.find(".injected-input").length == 0) {
			const matchForEachSlot = element.text().match(/([0-9])\/Day each:/i)
			if (matchForEachSlot){
				const numberFound = parseInt(matchForEachSlot[1]);
				element.children().each(function (indexInArray, valueOfElement) { 
					const key  = $(valueOfElement).text()
					const remaining = token.get_tracked_ability(key, numberFound);

					$(valueOfElement).after(createCountTracker(tokenId, key.replace(/\s/g, ""), remaining, "", ""))
				});			
			}
			
		}
	});	
}

/**
 * Creates the input tracker used for spell/legendaries and then calls token.track_ability
 * @param {object} token 
 * @param {string} key 
 * @param {string} remaining 
 * @param {string} foundDescription 
 * @param {string} descriptionPostfix 
 * @returns 
 */
function createCountTracker(token, key, remaining, foundDescription, descriptionPostfix) {
	const input = $(`<input class="injected-input" data-token-id="${token.id}" data-tracker-key="${key}" type="number" value="${remaining}" style="font-size: 14px; width: 40px; appearance: none; border: 1px solid #d8e1e8; border-radius: 3px;"> ${foundDescription} ${descriptionPostfix}</input>`);
	input.off("change").on("change", function(changeEvent) {
		const updatedValue = changeEvent.target.value;
		console.log(`add_ability_tracker_inputs ${key} changed to ${updatedValue}`);
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
	let token = window.TOKEN_OBJECTS[tokenId];
	if (token === undefined) {
		// nothing to track if we don't have a token
		return;
	}

	// Unfortunately, we can't just do a regex replace because DDB breaks if we mess with their html.
	// However, it seems to work just fine if we append the input at the end instead of inline.

	const processInput = function(element, regex, descriptionPostfix, includeMatchingDescription = true) {
		let foundMatches = element.text().match(regex); // matches `(1 slot)`, `(4 slots)`, etc
		if (foundMatches !== undefined && foundMatches != null && foundMatches.length > 1) {
			let numberFound = parseInt(foundMatches[1]);
			if (!isNaN(numberFound)) {
				let foundDescription = includeMatchingDescription ? foundMatches.input.substring(0, foundMatches.index) : descriptionPostfix; // `1st level `, `2nd level `, etc.
				let key = foundDescription.replace(/\s/g, ""); // `1stlevel`, `2ndlevel`, etc.
				let remaining = token.get_tracked_ability(key, numberFound);
				const input = createCountTracker(token, key, remaining, foundDescription, descriptionPostfix)
				element.append(`<br>`);
				element.append(input);
			}
		}
	}

	// //Spell Slots, or technically anything with 'slot'... might be able to refine the regex a bit better...
	target.find(".mon-stat-block__description-block-content > p").each(function() {
		let element = $(this);
		if (element.find(".injected-input").length === 0) {
			processInput(element, /\(([0-9]) slots?\)/, "slots remaining");
			processInput(element, /\(([0-9])\/Day\)/i, "remaining");
			processInput(element, /can take ([0-9]) legendary actions/i, "Legendary Actions remaining", false);
		}
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
		const currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length === 0) {
			const abilityType = $(this).find(innerSelector).html()
			const rollType="check"
			// matches (+1) 
			let updated = currentElement.html()
				.replaceAll(/(\([+\-] ?[0-9][0-9]?\))/g, `<button data-exp='1d20' data-mod='$1' data-rolltype=${rollType} data-actiontype=${abilityType} class='avtt-roll-button' title="${abilityType} ${rollType}">$1</button>`);
			$(currentElement).html(updated);
		}
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
	let currentElement = $(this)
	if (currentElement.find(".avtt-roll-button").length === 0) {
		const label = $(currentElement).find(labelSelector).html()
		if (label === "Saving Throws" || label === "Skills"){
			// get the tidbits in the form of ["DEX +3", "CON +4"] or ["Athletics +6", "Perception +3"]
			const tidbitData = $(currentElement).find(dataSelector).text().trim().split(",")
			const allTidBits = []
			tidbitData.forEach((tidbit) => {
				// can only be saving throw or skills here, which is either save/check respectively
				const rollType = label === "Saving Throws" ? "save" : "check"
				// will be DEX/CON/ATHLETICS/PERCEPTION
				const actionType = tidbit.trim().split(" ")[0]
				// matches "+1"
				allTidBits.push(tidbit.replace(/([+\-] ?[0-9][0-9]?)/, `<button data-exp='1d20' data-mod='$1' data-rolltype=${rollType} data-actiontype=${actionType} class='avtt-roll-button' title="${actionType} ${rollType}">$1</button>`))
			})
			const thisTidBitData = $(currentElement).find(dataSelector)
			$(thisTidBitData).html(allTidBits);				
		}
	}
});}


/**
 * Scans the player sheet to add in roller buttons to the extra tab
 * @param {$} target jquery selected element
 */
function scan_player_creature_pane(target) {
	console.group("scan_player_creature_pan")

	let creatureType = target.find(".ct-sidebar__header .ct-sidebar__header-parent").text(); // wildshape, familiar, summoned, etc
	let creatureName = target.find(".ct-sidebar__header .ddbc-creature-name").text(); // Wolf, Owl, etc
	let creatureAvatar = window.pc.image;
 	try {
 		// not all creatures have an avatar for some reason
 		creatureAvatar = target.find(".ct-sidebar__header .ct-sidebar__header-preview-image").css("background-image").slice(4, -1).replace(/"/g, "");
 	} catch { }
	let pc = window.pcs.find(t => t.sheet.includes(find_currently_open_character_sheet()));
	let displayName = `${pc.name} (${creatureName} ${creatureType})`;
	
	const clickHandler = function(clickEvent) {
		roll_button_clicked(clickEvent, displayName, creatureAvatar)
	};

	const rightClickHandler = function(contextmenuEvent) {
		roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar);
	}


	replace_ability_scores_with_avtt_rollers(target, ".ddbc-creature-block__ability-stat", ".ddbc-creature-block__ability-heading")
	replace_saves_skill_with_avtt_rollers(target, ".ddbc-creature-block__tidbit",".ddbc-creature-block__tidbit-label", ".ddbc-creature-block__tidbit-data" )

	// replace all "to hit" and "damage" rolls
	$(target).find(".ct-creature-pane__block p").each(function() {
		let currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length === 0) {
			// apply most specific regex first matching all possible ways to write a dice notation
			// to account for all the nuances of DNDB dice notation.
			// numbers can be swapped for any number in the following comment
			// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
			const damageRollRegex = /(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)/g
			// matches " +1 " or " + 1 "
			const hitRollRegex = /\s([+-]\s?[0-9]+)\s/g
			let actionType = currentElement.find("strong").html() || "custom"
			let updated = currentElement.html()
				.replaceAll(damageRollRegex, `<button data-exp='$2' data-mod='$3' data-rolltype='damage' data-actiontype=${actionType} class='avtt-roll-button' title="${actionType} damage">$1</button>`)
				.replaceAll(hitRollRegex, `<button data-exp='1d20' data-mod='$1' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title="${actionType} to hit">$1</button>`)
			$(currentElement).html(updated);
		}
	});
	$(target).find(".avtt-roll-button").click(clickHandler);
	$(target).find(".avtt-roll-button").on("contextmenu", rightClickHandler);
	console.groupEnd()
}

function find_currently_open_character_sheet() {
	if (is_characters_page()) {
		return window.location.pathname;
	}
	let sheet;
	$("#sheet").find("iframe").each(function () {
		let src = $(this).attr("src");
		if (src != "") {
			sheet = src;
		}
	})
	return sheet;
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

	let pressedButton = $(contextmenuEvent.currentTarget);
	let expression = pressedButton.attr('data-exp');
	let modifier = pressedButton.attr('data-mod')?.replaceAll("(", "")?.replaceAll(")", "");
	let rollType = pressedButton.attr('data-rolltype');
	let actionType = pressedButton.attr('data-actiontype');

	if (rollType === "damage") {
		damage_dice_context_menu(expression, modifier, actionType, rollType, displayName, imgUrl, entityType, entityId)
			.present(contextmenuEvent.clientY, contextmenuEvent.clientX) // TODO: convert from iframe to main window
	} else {
		standard_dice_context_menu(modifier, actionType, rollType, displayName, imgUrl, entityType, entityId)
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
	let pressedButton = $(clickEvent.currentTarget);
	let expression = pressedButton.attr('data-exp');
	let modifier = pressedButton.attr('data-mod')?.replaceAll("(", "")?.replaceAll(")", "");
	let rollType = pressedButton.attr('data-rolltype');
	let action = pressedButton.attr('data-actiontype');

	window.diceRoller.roll(new DiceRoll(
		`${expression}${modifier}`,
		action,
		rollType,
		displayName,
		imgUrl,
		entityType,
		entityId
	));
}
