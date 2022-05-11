
/// this injects roll buttons into the monster details page
function scan_monster(target, stats, token_id=false) {
	target.find(".integrated-dice__container").hide();
	target.find(".mon-stat-block__description-block-content p").each(function(idx, element) {

		$(element).find("span[data-rolltype='to hit']").each(function() {
			newblock = $("<div/>");
			newblock.css("display", "inline-block");



			modifier = $(this).text();

			newblock.append("<button data-exp='1d20' data-mod='" + modifier + "' class='above-roll20'>" + modifier + "</button><button class='above-roll20' data-exp='2d20kh1' data-mod='" + modifier + "'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='" + modifier + "'>D</button> to hit");

			$(this).replaceWith(newblock);
			newblock = $("<div/>");
			newblock.css("display", "inline-block");


		});
		
		$(element).find("span[data-rolltype='damage']").each(function(){
			newblock = $("<div/>");
			newblock.css("display", "inline-block");
			dice_notation=$(this).attr('data-dicenotation');
			dice_damagetype=$(this).attr('data-rolldamagetype')
			newblock.append(`<button data-rolldamagetype='${dice_damagetype}' data-exp='${dice_notation}' data-mod='' class='above-roll20'>${dice_notation}</button><button data-rolldamagetype='${dice_damagetype}' data-exp='${dice_notation}' class='above-roll20' data-mod='CRIT'>CRIT</button>`);
			$(this).replaceWith(newblock);

		})


		// these covers "text parsing" for things that do not support the new DDB roll notations
		description = $(element).html();
		description = description.replace(/([\+-][0-9]+) to hit/, "<button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button> to hit");
		//Spell Slots, or technically anything with 'slot'... might be able to refine the regex a bit better...
		//TEMPORARILY DISABLED  description = description.replace(/([0-9]) slot/, '<input style="font-size: 14px; width: 40px; appearance: none;" type="number" value="$1">/$1</input> slot');
		//Actions which go #/Day... again probably could refine the regex a bit better.
		//TEMPORARILY DISABLED  description = description.replace(/([0-9])\/Day/i, '<input style="font-size: 14px; width: 40px; appearance: none;" type="number" value="$1">/$1</input>Day');
		//Legendary actions which go #/Day... again probably could refine the regex a bit better.
		//TEMPORARILY DISABLED description = description.replace(/can take ([0-9]) legendary actions/i, '<input id=legendary_actions style="font-size: 14px; width: 40px; appearance: none;" type="number" value="$1">can take $1 legendary actions</input>');
		
		description = description.replaceAll(/\(([0-9]+d[0-9]+( [\+-] [0-9]+)?)\)/g, "(<button data-exp='$1' data-mod='' class='above-roll20'>$1</button><button data-exp='$1' class='above-roll20' data-mod='CRIT'>CRIT</button>)");
		$(element).html(description);
		
		
	});

	statnew = target.find(".ability-block").html().replaceAll(/\(([\+\-]?[0-9]+)\)/g, "<br><button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button>");
	target.find(".ability-block").html(statnew);

	tidbits = target.find(".mon-stat-block__tidbits").html();
	newtidbits = tidbits.replaceAll(/([\+\-] ?[0-9][0-9]?)/g, "<button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button>");
	target.find(".mon-stat-block__tidbits").html(newtidbits);


	console.log('set handler');
	target.on("click", ".above-roll20", function(e) {
		dice = $(this).attr('data-exp');
		mod = $(this).attr('data-mod');

		if (mod && mod == "CRIT") {
			mod = dice.replace(/^([0-9]+d[0-9]+).*$/, "$1");
		}

		if (mod && mod.charAt(0) != "+")
			mod = "+" + mod;
		else
			mod = mod;

		expression = dice + mod;
		console.log(expression);
		let sentAsDDB = send_rpg_dice_to_ddb(expression);
		if (sentAsDDB) {
			return;
		}
		roll = new rpgDiceRoller.DiceRoll(expression);

		let output_beauty = roll.output.replace(/=(.*)/, "= <b>$1</b>")
		

		if($(this).attr('data-rolldamagetype')){
			output_beauty+= " <b>"+$(this).attr('data-rolldamagetype')+"</b>";
		}
		
		data = {
				player: stats.data.name,
				img: stats.data.avatarUrl,
				text: output_beauty,
				dmonly:true,
			};
		window.MB.inject_chat(data);
		notify_gamelog();
	});
}

// this is intended to be used with the encounterHandler only. It will need some rework if we want to use it for non-encounter stat blocks
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
				let input = $(`<input class="injected-input" data-token-id="${tokenId}" data-tracker-key="${key}" type="number" value="${remaining}" style="font-size: 14px; width: 40px; appearance: none; border: 1px solid #d8e1e8; border-radius: 3px;"> ${foundDescription} ${descriptionPostfix}</input>`);
				input.off("change").on("change", function(changeEvent) {
					let updatedValue = changeEvent.target.value;
					console.log(`add_ability_tracker_inputs ${key} changed to ${updatedValue}`);
					token.track_ability(key, updatedValue);
				});
				element.append(`<br>`);
				element.append(input);
			}
		}
	}

	// //Spell Slots, or technically anything with 'slot'... might be able to refine the regex a bit better...
	target.find(".mon-stat-block__description-block-content > p").each(function() {
		let element = $(this);
		if (element.find(".injected-input").length == 0) {
			processInput(element, /\(([0-9]) slots?\)/, "slots remaining");
			processInput(element, /\(([0-9])\/Day\)/i, "remaining");
			processInput(element, /can take ([0-9]) legendary actions/i, "Legendary Actions remaining", false);
		}
	});	
}

function scan_player_creature_pane(target, tokenId) {
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

	// replace ability scores modifiers
	$(target).find(".ddbc-creature-block__abilities .ddbc-creature-block__ability-modifier").each(function() {
		let currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length == 0) {
			let innerHtml = currentElement.html();
			let foundModifiers = innerHtml.match(/([\+\-] ?[0-9][0-9]?)/g);
			if (foundModifiers.length > 0) {
				let mod = foundModifiers[0];
				let button = $(`<button data-exp='1d20' data-mod='${mod}' data-rolltype='tohit' class='avtt-roll-button'>${innerHtml}</button>`);
				button.click(clickHandler);
				button.on("contextmenu", rightClickHandler)
				$(currentElement).html(button);
			}
		}
	});

	// replace saving throws, skills, etc
	$(target).find(".ddbc-creature-block__tidbits .ddbc-creature-block__tidbit-data").each(function() {
		let currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length == 0) {
			let updated = currentElement.html()
				.replaceAll(/([\+\-] ?[0-9][0-9]?)/g, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>"); // <button class='avtt-roll-button' data-exp='2d20kh1' data-mod='$1'>A</button><button class='avtt-roll-button' data-exp='2d20kl1' data-mod='$1'>D</button>
			$(currentElement).html(updated);
			$(currentElement).find(".avtt-roll-button").click(clickHandler);
			$(currentElement).find(".avtt-roll-button").on("contextmenu", rightClickHandler);
		}
	});

	// replace all "to hit" and "damage" rolls
	$(target).find(".ct-creature-pane__block p").each(function() {
		let currentElement = $(this)
		if (currentElement.find(".avtt-roll-button").length == 0) {
			// apply most specific regex first matching all possible ways to write a dice notation
			// to account for all the nuances of DNDB dice notation.
			// numbers can be swapped for any number in the following comment
			// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
			const damageRollRegex = /([0-9]+d[0-9]+\s?([\+-]\s?[0-9]+)?)/g
			// matches " +1 " or " + 1 "
			const hitRollRegex = /\s([\+-]\s?[0-9]+)\s/g
			let updated = currentElement.html()
				.replaceAll(damageRollRegex, "<button data-exp='$1' data-mod='' data-rolltype='damage' class='avtt-roll-button'>$1</button>")
				.replaceAll(hitRollRegex, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>")
			$(currentElement).html(updated);
			$(currentElement).find(".avtt-roll-button").click(clickHandler);
			$(currentElement).find(".avtt-roll-button").on("contextmenu", rightClickHandler);
		}
	});
	console.groupEnd()
}

// exp: 1d20, modifier: +1, damageType: bludgeoning
function roll_our_dice(displayName, imgUrl, expression, modifier, damageType, dmOnly) {
	let dice = expression;
	// rpgDiceRoller.DiceRoll expects a modifier, so if none is supplied give a +0
	let mod = modifier || "+0";

	if (mod && mod == "CRIT") {
		mod = dice.replace(/^([0-9]+d[0-9]+).*$/, "$1");
	}

	if (mod && mod.charAt(0) != "+") {
		mod = "+" + mod;
	} else {
		mod = mod;
	}
	let roll = new rpgDiceRoller.DiceRoll(dice + mod);
	let output_beauty = roll.output.replace(/=(.*)/, "= <b>$1</b>")
	
	if(damageType){
		output_beauty += ` <b>${damageType}</b>`;
	}
	
	let data = {
		player: displayName,
		img: imgUrl,
		text: output_beauty,
		dmonly: dmOnly,
	};
	window.MB.inject_chat(data);
	notify_gamelog();
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
 * Builds and displays a context menu for roll buttons that matches the one DDB uses
 * @param {Event} contextmenuEvent      the event that jQuery gives you from `whatever.on("contextmenu")`
 * @param {Boolean} isDamageRoll        true if this is a damage roll, false if it's a "to hit" roll.
 * @param {function} rollButtonCallback a function that will be called with a string representation of each user selection: sendTo:[everyone|self], rollWith:[advantage|flat|disadvantage], rollAs:[crit|flat]
 */
function display_roll_button_contextmenu(contextmenuEvent, isDamageRoll, rollButtonCallback) {
	// lifted from the player screen with a few tweaks for easier manipulation and reading
	let overlay = $(`
		<div role="presentation" class="MuiPopover-root jss2" id="options-menu" style="position: fixed; z-index: 1300; inset: 0px;">
			<div aria-hidden="true" style="z-index: -1; position: fixed; inset: 0px; background-color: transparent;"></div>
			<div tabindex="0" data-test="sentinelStart"></div>
			<div class="MuiPaper-root MuiPopover-paper MuiPaper-elevation8 MuiPaper-rounded" tabindex="-1" style="opacity: 1; transform: none; transition: opacity 306ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 204ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transform-origin: 0px 348px;">
				<div class="MuiBox-root jss5 jss2">
					<ul class="MuiList-root MuiList-padding MuiList-subheader">
						<li class="jss3"></li>
						
						<li class="dm-only-option sendto-options">
							<ul class="jss4">
								<li class="MuiListSubheader-root MuiListSubheader-sticky MuiListSubheader-gutters">Send To:</li>
								<div data-sendto="everyone" class="MuiButtonBase-root MuiListItem-root jss6 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss7">
										<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 13.75c-2.34 0-7 1.17-7 3.5V19h14v-1.75c0-2.33-4.66-3.5-7-3.5zM4.34 17c.84-.58 2.87-1.25 4.66-1.25s3.82.67 4.66 1.25H4.34zM9 12c1.93 0 3.5-1.57 3.5-3.5S10.93 5 9 5 5.5 6.57 5.5 8.5 7.07 12 9 12zm0-5c.83 0 1.5.67 1.5 1.5S9.83 10 9 10s-1.5-.67-1.5-1.5S8.17 7 9 7zm7.04 6.81c1.16.84 1.96 1.96 1.96 3.44V19h4v-1.75c0-2.02-3.5-3.17-5.96-3.44zM15 12c1.93 0 3.5-1.57 3.5-3.5S16.93 5 15 5c-.54 0-1.04.13-1.5.35.63.89 1 1.98 1 3.15s-.37 2.26-1 3.15c.46.22.96.35 1.5.35z" fill="#A7B6C2"></path></svg>
									</div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Everyone</span></div>
									<svg class="easy-to-find-checkmark MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.00025 16C5.74425 16 5.48825 15.902 5.29325 15.707L0.29325 10.707C-0.09775 10.316 -0.09775 9.68401 0.29325 9.29301C0.68425 8.90201 1.31625 8.90201 1.70725 9.29301L6.00025 13.586L16.2932 3.29301C16.6842 2.90201 17.3162 2.90201 17.7073 3.29301C18.0983 3.68401 18.0983 4.31601 17.7073 4.70701L6.70725 15.707C6.51225 15.902 6.25625 16 6.00025 16Z" fill="#1B9AF0"></path></svg>
								</div>
								<div data-sendto="self" class="MuiButtonBase-root MuiListItem-root jss6 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss7">
										<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM7.07 18.28C7.5 17.38 10.12 16.5 12 16.5C13.88 16.5 16.51 17.38 16.93 18.28C15.57 19.36 13.86 20 12 20C10.14 20 8.43 19.36 7.07 18.28ZM18.36 16.83C16.93 15.09 13.46 14.5 12 14.5C10.54 14.5 7.07 15.09 5.64 16.83C4.62 15.49 4 13.82 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 13.82 19.38 15.49 18.36 16.83ZM12 6C10.06 6 8.5 7.56 8.5 9.5C8.5 11.44 10.06 13 12 13C13.94 13 15.5 11.44 15.5 9.5C15.5 7.56 13.94 6 12 6ZM12 11C11.17 11 10.5 10.33 10.5 9.5C10.5 8.67 11.17 8 12 8C12.83 8 13.5 8.67 13.5 9.5C13.5 10.33 12.83 11 12 11Z" fill="#A7B6C2"></path></svg>
									</div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Self</span></div>
								</div>
							</ul>
						</li>
						
						<hr class="MuiDivider-root dm-only-option">
						
						<li class="rollwith-options">
							<ul class="jss4">
								<li class="MuiListSubheader-root MuiListSubheader-sticky MuiListSubheader-gutters">Roll With:</li>
								<div data-rollwith="advantage" class="MuiButtonBase-root MuiListItem-root jss6 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss7">
										<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 48 48" aria-hidden="true"><g><polygon fill="#fff" points="33 6 38 36 10 36 16 6"></polygon><polygon fill="#2C9400" points="24 14 28 26 20 26 24 14"></polygon><path fill="#2C9400" d="M44.39,12.1,23.89.39,3.5,12.29,3.61,35.9l20.5,11.71L44.5,35.71ZM31,36l-2-6H19l-2,6H10L21,8h6L38,36Z"></path></g></svg>
									</div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Advantage</span></div>
								</div>
								<div data-rollwith="flat" class="MuiButtonBase-root MuiListItem-root jss6 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss7">
										<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 16 18" aria-hidden="true"><path d="M8 0L0 4.28571V12.9714L8 17.2571L15.4286 13.2571L16 12.9143V4.28571L8 0ZM6.85714 4.74286L3.48571 9.77143L1.37143 5.2L6.85714 4.74286ZM4.57143 10.2857L8 5.08571L11.4286 10.2857H4.57143ZM12.4571 9.77143L9.14286 4.74286L14.5714 5.14286L12.4571 9.77143ZM8.57143 1.6L12.8 3.88571L8.57143 3.54286V1.6ZM7.42857 1.6V3.54286L3.2 3.88571L7.42857 1.6ZM1.14286 7.31429L2.68571 10.7429L1.14286 11.6571V7.31429ZM1.71429 12.6286L3.25714 11.7143L5.77143 14.8571L1.71429 12.6286ZM4.57143 11.4286H10.8571L8 15.7143L4.57143 11.4286ZM10.2286 14.8L12.7429 11.6571L14.2857 12.5714L10.2286 14.8ZM13.4286 10.8L13.3143 10.7429L14.8571 7.31429V11.6571L13.4286 10.8Z" fill="#8A9BA8"></path></svg>
									</div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Flat (One Die)</span></div>
									<svg class="easy-to-find-checkmark MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.00025 16C5.74425 16 5.48825 15.902 5.29325 15.707L0.29325 10.707C-0.09775 10.316 -0.09775 9.68401 0.29325 9.29301C0.68425 8.90201 1.31625 8.90201 1.70725 9.29301L6.00025 13.586L16.2932 3.29301C16.6842 2.90201 17.3162 2.90201 17.7073 3.29301C18.0983 3.68401 18.0983 4.31601 17.7073 4.70701L6.70725 15.707C6.51225 15.902 6.25625 16 6.00025 16Z" fill="#1B9AF0"></path></svg>
								</div>
								<div data-rollwith="disadvantage" class="MuiButtonBase-root MuiListItem-root jss6 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss7">
										<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 48 48" aria-hidden="true"><g><polygon fill="#fff" points="35 8 36 39 12 39 14 8"></polygon><path fill="#b00000" d="M27.38,17.75a9.362,9.362,0,0,1,1.44,5.68v1.12a9.4423,9.4423,0,0,1-1.44,5.71A5.21983,5.21983,0,0,1,23,32H21V16h2A5.19361,5.19361,0,0,1,27.38,17.75Z"></path><path fill="#b00000" d="M44.39,12.1,23.89.39,3.5,12.29,3.61,35.9l20.5,11.71L44.5,35.71ZM35.21,24.55a13.50293,13.50293,0,0,1-1.5,6.41,11.09308,11.09308,0,0,1-4.25,4.42A12.00926,12.00926,0,0,1,23.34,37H15V11h8.16a12.35962,12.35962,0,0,1,6.2,1.56,10.97521,10.97521,0,0,1,4.29,4.41,13.31084,13.31084,0,0,1,1.56,6.39Z"></path></g></svg>
									</div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Disadvantage</span></div>
								</div>
							</ul>
						</li>
						
						<li class="rolldamage-options">
							<ul class="jss4">
								<li class="MuiListSubheader-root MuiListSubheader-sticky MuiListSubheader-gutters">Roll As:</li>
								<div data-rollas="crit" class="MuiButtonBase-root MuiListItem-root jss12 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss13"></div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Crit Damage</span></div>
								</div>
								<div data-rollas="flat" class="MuiButtonBase-root MuiListItem-root jss12 MuiListItem-gutters MuiListItem-button" tabindex="0" role="button" aria-disabled="false">
									<div class="MuiListItemIcon-root jss13"></div>
									<div class="MuiListItemText-root"><span class="MuiTypography-root MuiListItemText-primary MuiTypography-body1 MuiTypography-displayBlock">Flat Roll</span></div>
									<svg class="easy-to-find-checkmark MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.00025 16C5.74425 16 5.48825 15.902 5.29325 15.707L0.29325 10.707C-0.09775 10.316 -0.09775 9.68401 0.29325 9.29301C0.68425 8.90201 1.31625 8.90201 1.70725 9.29301L6.00025 13.586L16.2932 3.29301C16.6842 2.90201 17.3162 2.90201 17.7073 3.29301C18.0983 3.68401 18.0983 4.31601 17.7073 4.70701L6.70725 15.707C6.51225 15.902 6.25625 16 6.00025 16Z" fill="#1B9AF0"></path></svg>
								</div>
							</ul>
						</li>

						<hr class="MuiDivider-root">
					</ul>
					<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-fullWidth" tabindex="0" type="button"><span class="MuiButton-label">Roll</span></button>
				</div>
			</div>
			<div tabindex="0" data-test="sentinelEnd"></div>
		</div>
	`);

	// if the button is low enough, move it above the cursor so it doesn't go off screen
	// likewise, if the button is too far right, move it left of the cursor so it doesn't go off screen
	let body = $(contextmenuEvent.currentTarget).closest("body");
	let bodyHeight = body.height();
	let top = (contextmenuEvent.clientY + 320) > bodyHeight ? contextmenuEvent.clientY - 320 : contextmenuEvent.clientY;
	let left = contextmenuEvent.clientX - 200; // the thing is about 215 wide
	overlay.find(".MuiPaper-root").css({
		top: `${top}px`,
		left: `${left}px`
	});
	
	if (!window.DM) {
		// only DMs get the ability to roll to self
		overlay.find(".dm-only-option").hide();
	}

	if (isDamageRoll) {
		// damage rolls allow a "crit damage" option
		overlay.find(".rollwith-options").hide();
	} else {
		// "to hit" rolls allow for advantage|flat|disadvantage options
		overlay.find(".rolldamage-options").hide();
	}

	// clicking outside the contextmenu should close it
	overlay.click(function(event) {
		event.stopPropagation();
		$(event.currentTarget).remove();
	});

	// handle option selection
	overlay.find("div.MuiButtonBase-root").click(function(clickEvent) {
		clickEvent.stopPropagation();
		let checkmark = $(clickEvent.currentTarget).closest("ul").find(".easy-to-find-checkmark");
		$(clickEvent.currentTarget).append(checkmark);
	});
	
	// when the roll button is pressed, figure out what options were selected, and call the callback
	overlay.find("button.MuiButtonBase-root").click(function(clickEvent) {
		clickEvent.stopPropagation();
		let sendTo = "everyone";
		let rollWith = "flat";
		let rollAs = "flat";
		let rollButton = $(clickEvent.currentTarget);
		let allOptionsLists = rollButton.siblings("ul");
		if (allOptionsLists.length > 0) {
			let optionsList = allOptionsLists[0];
			let selectedOptions = $(optionsList).find(".easy-to-find-checkmark").parent();
			selectedOptions.each(function() {
				let op = $(this);
				if (op.attr("data-sendto") !== undefined) {
					sendTo = op.attr("data-sendto");
				}
				if (op.attr("data-rollwith") !== undefined) {
					rollWith = op.attr("data-rollwith");
				}
				if (op.attr("data-rollas") !== undefined) {
					rollAs = op.attr("data-rollas");
				}
			});
		}
		rollButton.closest(".MuiPopover-root").remove();
		rollButtonCallback(sendTo, rollWith, rollAs);
	});

	body.append(overlay);
}

/**
 * When a roll button is right-clicked, this builds and displays a contextmenu, then handles everything related to that contextmenu
 * @param {Event} contextmenuEvent      the event that jQuery gives you from `whatever.on("contextmenu")`
 * @param {String} displayName the name of the player/creature to be displayed in the gamelog
 * @param {String} imgUrl      a url for the image to be displayed in the gamelog for the player/creature that is rolling
 */
function roll_button_contextmenu_handler(contextmenuEvent, displayName, imgUrl) {
	contextmenuEvent.stopPropagation();
	contextmenuEvent.preventDefault();

	let pressedButton = $(contextmenuEvent.currentTarget);
	let expression = pressedButton.attr('data-exp');
	let modifier = pressedButton.attr('data-mod');
	let damageType = pressedButton.attr('data-rolldamagetype');
	let rollType = pressedButton.attr('data-rolltype');

	display_roll_button_contextmenu(contextmenuEvent, rollType == "damage", function(sendTo, rollWith, rollAs) {
		if (rollWith == "advantage") {
			expression = "2d20kh1";
		} else if (rollWith == "disadvantage") {
			expression = "2d20kl1";
		}
		if (rollAs == "crit") {
			modifier = "CRIT";
		}
		roll_our_dice(displayName, imgUrl, expression, modifier, damageType, sendTo == "self");
	});
}

function roll_button_clicked(clickEvent, displayName, imgUrl) {
	let pressedButton = $(clickEvent.currentTarget);
	let expression = pressedButton.attr('data-exp');
	let modifier = pressedButton.attr('data-mod');
	let damageType = pressedButton.attr('data-rolldamagetype');
	roll_our_dice(displayName, imgUrl, expression, modifier, damageType, false);
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
		roll_button_clicked(clickEvent, displayName, creatureAvatar)
	});

	// temporarily disabled until a new context menu can be built that works on the monster details page
	// target.find(".avtt-roll-button").on("contextmenu", function (contextmenuEvent) {
	// 	roll_button_contextmenu_handler(contextmenuEvent, displayName, creatureAvatar);
	// });

	console.groupEnd()
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param currentElement {jQuery} the jQuery element that contains modifiers HTML */
function replace_modifiers(currentElement) {
	if (currentElement.find(".avtt-roll-button").length === 0) {
		let innerHtml = currentElement.html();
		let foundModifiers = innerHtml.match(/([\+\-] ?[0-9][0-9]?)/g);
		if (foundModifiers.length > 0) {
			let mod = foundModifiers[0];
			let button = $(`<button data-exp='1d20' data-mod='${mod}' data-rolltype='tohit' class='avtt-roll-button'>${innerHtml}</button>`);
			currentElement.html(button);
		}
	}
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param currentElement {jQuery} the jQuery element that contains modifiers HTML */
function replace_stat_block_tidbits(currentElement) {
	if (currentElement.find(".avtt-roll-button").length === 0) {
		let updated = currentElement.html()
			.replaceAll(/([\+\-] ?[0-9][0-9]?)/g, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>");
		currentElement.html(updated);
	}
}

/** finds all things that should be rollable, and wraps them inside a button that can roll rpgDiceRoller dice
 * @param currentElement {jQuery} the jQuery element that contains modifiers HTML */
function replace_stat_block_description(currentElement) {
	if (currentElement.find(".avtt-roll-button").length === 0) {
		// apply most specific regex first matching all possible ways to write a dice notation
		// to account for all the nuances of DNDB dice notation.
		// numbers can be swapped for any number in the following comment
		// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
		const damageRollRegex = /([0-9]+d[0-9]+\s?([\+-]\s?[0-9]+)?)/g
		// matches " +1 " or " + 1 "
		const hitRollRegex = /\s([\+-]\s?[0-9]+)\s/g
		let updated = currentElement.html()
			.replaceAll(damageRollRegex, "<button data-exp='$1' data-mod='' data-rolltype='damage' class='avtt-roll-button'>$1</button>")
			.replaceAll(hitRollRegex, "<button data-exp='1d20' data-mod='$1' data-rolltype='tohit' class='avtt-roll-button'>$1</button>")
		currentElement.html(updated);
	}
}
