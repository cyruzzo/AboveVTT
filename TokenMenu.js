
// deprecated. replaced by mytokens
tokendata={
	folders:{},
};

// deprecated, but still needed for migrate_to_my_tokens() to work
function convert_path(path){
	var pieces=path.split("/");
	var current=tokendata;

	for(var i=0;i<pieces.length;i++){
		if(!current || pieces[i]=="")
			continue;
		current=current.folders[pieces[i]];
	}
	return current || {};
}

// deprecated, but still needed for migrate_to_my_tokens() to work
function persist_customtokens(){
	console.warn("persist_customtokens no longer supported");
	// delete tokendata.folders["AboveVTT BUILTIN"];
	// localStorage.setItem("CustomTokens",JSON.stringify(tokendata));
	// delete tokendata.folders["AboveVTT BUILTIN"];
}

function context_menu_flyout(id, hoverEvent, buildFunction) {
	let contextMenu = $("#tokenOptionsPopup");
	if (contextMenu.length === 0) {
		console.warn("context_menu_flyout, but #tokenOptionsPopup could not be found");
		return;
	}

	if (hoverEvent.type === "mouseenter") {
		let flyout = $(`<div id='${id}' class='context-menu-flyout'></div>`);
		$(`.context-menu-flyout`).remove(); // never duplicate

		buildFunction(flyout);
		$("#tokenOptionsContainer").append(flyout);
		observe_hover_text(flyout);

		let contextMenuCenter = (contextMenu.height() / 2);
		let flyoutHeight = flyout.height();
		let diff = (contextMenu.height() - flyoutHeight);
		let flyoutTop = contextMenuCenter - (flyoutHeight / 2); // center alongside the contextmenu


		if (diff > 0) {
			// the flyout is smaller than the contextmenu. Make sure it's alongside the hovered row			
			// align to the top of the row. 14 is half the height of the button
			let buttonPosition = $(".flyout-from-menu-item:hover")[0].getBoundingClientRect().y - $("#tokenOptionsPopup")[0].getBoundingClientRect().y + 14
			if(buttonPosition < contextMenuCenter) {
				flyoutTop =  buttonPosition - (flyoutHeight / 5)
			}
			else{
				flyoutTop =  buttonPosition - (flyoutHeight / 2)
			}				
		}	

		flyout.css({
			left: contextMenu.width(),
			top: flyoutTop,
		});

		if ($(".context-menu-flyout")[0].getBoundingClientRect().top < 0) {
			flyout.css("top", 0)
		}
		else if($(".context-menu-flyout")[0].getBoundingClientRect().bottom > window.innerHeight-15) {
			flyout.css({
				top: 'unset',
				bottom: 0
			});
		}
		
	} 
}

function close_token_context_menu() {
	$("#tokenOptionsClickCloseDiv").click();
}

/**
 * Opens a sidebar modal with token configuration options
 * @param tokenIds {Array<String>} an array of ids for the tokens being configured
 */
function token_context_menu_expanded(tokenIds, e) {
	if (tokenIds === undefined || tokenIds.length === 0) {
		console.warn(`token_context_menu_expanded was called without any token ids`);
		return;
	}

	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined)

	if (tokens.length === 0) {
		console.warn(`token_context_menu_expanded was called with ids: ${JSON.stringify(tokenIds)}, but no matching tokens could be found`);
		return;
	}

	// Aoe tokens are treated differently from everything else so we need to check this more often
	let isAoeList = tokens.map(t => t.isAoe());
	let uniqueAoeList = [...new Set(isAoeList)];
	const allTokensAreAoe = (uniqueAoeList.length === 1 && uniqueAoeList[0] === true);
	const someTokensAreAoe = (uniqueAoeList.includes(true));

	$("#tokenOptionsPopup").remove();
	let tokenOptionsClickCloseDiv = $("<div id='tokenOptionsClickCloseDiv'></div>");
	tokenOptionsClickCloseDiv.off().on("click", function(){
		$("#tokenOptionsPopup").remove();
		$('.context-menu-list').trigger('contextmenu:hide')
		tokenOptionsClickCloseDiv.remove();
		$("#tokenOptionsContainer .sp-container").spectrum("destroy");
		$("#tokenOptionsContainer .sp-container").remove();
		$(`.context-menu-flyout`).remove(); 
	});

	let moveableTokenOptions = $("<div id='tokenOptionsPopup'></div>");

	
	let body = $("<div id='tokenOptionsContainer'></div>");
	moveableTokenOptions.append(body);

	$('body').append(moveableTokenOptions);
	$('body').append(tokenOptionsClickCloseDiv);

	// stat block / character sheet


	if (tokens.length === 1) {
		let token = tokens[0];
		if (token.isPlayer() && window.DM) {
			let button = $(`<button>Open Character Sheet<span class="material-icons icon-view"></span></button>`);
			button.on("click", function() {
				open_player_sheet(token.options.id);
				close_token_context_menu();
			});
			body.append(button);
		} else if (token.isMonster()) {
			let button = $(`<button>Open Monster Stat Block<span class="material-icons icon-view"></span></button>`);
			button.on("click", function() {
				load_monster_stat(token.options.monster, token.options.id);
				close_token_context_menu();
			});
			if(token.options.player_owned || window.DM){
				body.append(button);
			}
		}
	}

	if (window.DM && !allTokensAreAoe) {
		let addButtonInternals = `Add to Combat Tracker<span class="material-icons icon-person-add"></span>`;
		let removeButtonInternals = `Remove From Combat Tracker<span class="material-icons icon-person-remove"></span>`;
		let combatButton = $(`<button></button>`);
		let inCombatStatuses = [...new Set(tokens.map(t => t.isInCombatTracker()))];
		if (inCombatStatuses.length === 1 && inCombatStatuses[0] === true) {
			// they are all in the combat tracker. Make it a remove button
			combatButton.addClass("remove-from-ct");
			combatButton.html(removeButtonInternals);
		} else {
			// if any are not in the combat tracker, make it an add button.
			combatButton.addClass("add-to-ct");
			combatButton.html(addButtonInternals);
		}
		combatButton.on("click", function(clickEvent) {
			let clickedButton = $(clickEvent.currentTarget);
			if (clickedButton.hasClass("remove-from-ct")) {
				clickedButton.removeClass("remove-from-ct").addClass("add-to-ct");
				clickedButton.html(addButtonInternals);
				tokens.forEach(t =>{
					t.options.ct_show = undefined;
					ct_remove_token(t, false);
					t.update_and_sync();
				});
			} else {
				clickedButton.removeClass("add-to-ct").addClass("remove-from-ct");
				clickedButton.html(removeButtonInternals);
				tokens.forEach(t => {
					ct_add_token(t, false)
					t.update_and_sync();
				});
			}

			ct_reorder();
			ct_persist();
		});
		
		body.append(combatButton);


		let hideText = tokenIds.length > 1 ? "Hide Tokens" : "Hide Token"
		let hiddenMenuButton = $(`<button class="${determine_hidden_classname(tokenIds)} context-menu-icon-hidden icon-invisible material-icons">${hideText}</button>`)
		hiddenMenuButton.off().on("click", function(clickEvent){
			let clickedItem = $(this);
			let hideAll = clickedItem.hasClass("some-active");
			tokens.forEach(token => {
				if (hideAll || token.options.hidden !== true) {
					token.hide();
				} else {
					token.show();
				}
				token.place_sync_persist();
			});
			clickedItem.removeClass("single-active all-active some-active active-condition");
			clickedItem.addClass(determine_hidden_classname(tokenIds));
		});
		body.append(hiddenMenuButton);
	}

	let toTopMenuButton = $("<button class='material-icons to-top'>Move to Top</button>");
	let toBottomMenuButton = $("<button class='material-icons to-bottom'>Move to Bottom</button>")

	if(window.DM || (tokens.length == 1 && (tokens[0].isPlayer() || (tokens[0].options.player_owned && !tokens[0].isPlayer())))) {
		body.append(toTopMenuButton);
		body.append(toBottomMenuButton);

		toTopMenuButton.off().on("click", function(tokenIds){
			tokens.forEach(token => {
				$(".token").each(function(){	
					let tokenId = $(this).attr('data-id');	
					let tokenzindexdiff = window.TOKEN_OBJECTS[tokenId].options.zindexdiff;
					if (tokenzindexdiff >= window.TOKEN_OBJECTS[token.options.id].options.zindexdiff && tokenId != token.options.id) {
						window.TOKEN_OBJECTS[token.options.id].options.zindexdiff = tokenzindexdiff + 1;
					}		
				});
				token.place_sync_persist();
			});
		});

		toBottomMenuButton.off().on("click", function(tokenIds){
			tokens.forEach(token => {			
				$(".token").each(function(){	
					let tokenId = $(this).attr('data-id');	
					let tokenzindexdiff = window.TOKEN_OBJECTS[tokenId].options.zindexdiff;
					if (tokenzindexdiff <= window.TOKEN_OBJECTS[token.options.id].options.zindexdiff && tokenId != token.options.id) {
						window.TOKEN_OBJECTS[token.options.id].options.zindexdiff = Math.max(tokenzindexdiff - 1, -5000);
					}		
				});
				token.place_sync_persist();
			});
		});
	}

	if (tokens.length === 1) {
		body.append(build_menu_stat_inputs(tokenIds));
		$(".hpMenuInput").on('focus', function(event){
			event.target.select();
		});
		$(".maxHpMenuInput").on('focus', function(event){
			event.target.select();
		});
		$(".acMenuInput").on('focus', function(event){
				event.target.select();
		});
		$(".elevMenuInput").on('focus', function(event){
				event.target.select();
		});
	}

	
	if(tokens.length == 1 && ((tokens[0].options.player_owned && !tokens[0].options.disablestat && !tokens[0].isPlayer()) || (window.DM && !tokens[0].isPlayer()))){ 
		$(".maxHpMenuInput").prop('disabled', false);
		$(".acMenuInput").prop('disabled', false);
		$(".hpMenuInput").prop('disabled', false);
	}
	else { 
		$(".maxHpMenuInput").prop('disabled', true);
		$(".acMenuInput").prop('disabled', true);
		$(".hpMenuInput").prop('disabled', true);
	}	
	let conditionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Conditions / Markers</div></div>`);	
	conditionsRow.hover(function (hoverEvent) {
		context_menu_flyout("conditions-flyout", hoverEvent, function(flyout) {
			flyout.append(build_conditions_and_markers_flyout_menu(tokenIds));
		})
	});

	body.append(conditionsRow);
	let adjustmentsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Adjustments</div></div>`);
	adjustmentsRow.hover(function (hoverEvent) {
		context_menu_flyout("adjustments-flyout", hoverEvent, function(flyout) {
			flyout.append(build_adjustments_flyout_menu(tokenIds));
		})
	});
	if(window.DM || (tokens.length == 1 && (tokens[0].options.player_owned == true || tokens[0].isPlayer()))){
		body.append(adjustmentsRow);
	}

	// Auras (torch, lantern, etc)
	let aurasRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Auras</div></div>`);
	aurasRow.hover(function (hoverEvent) {
		context_menu_flyout("auras-flyout", hoverEvent, function(flyout) {
			flyout.append(build_token_auras_inputs(tokenIds));
		})
	});
	if(window.DM || (tokens.length == 1 && (tokens[0].options.player_owned == true || tokens[0].isPlayer()))){
		if (!someTokensAreAoe) {
			body.append(aurasRow);
		}
	}
	if(window.DM) {
		if (tokens.length === 1) {
			let notesRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Note</div></div>`);
			notesRow.hover(function (hoverEvent) {
				context_menu_flyout("notes-flyout", hoverEvent, function(flyout) {
					flyout.append(build_notes_flyout_menu(tokenIds));
				})
			});
			body.append(notesRow);
		}
	}

	if(window.DM) {
		let optionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Options</div></div>`);
		optionsRow.hover(function (hoverEvent) {
			context_menu_flyout("options-flyout", hoverEvent, function(flyout) {
				flyout.append(build_options_flyout_menu(tokenIds));
				update_token_base_visibility(flyout);
			});
		});
		body.append(optionsRow);
	}

	if(window.DM) {
		body.append(`<hr style="opacity: 0.3" />`);
		let deleteTokenMenuButton = $("<button class='deleteMenuButton icon-close-red material-icons'>Delete</button>")
	 	body.append(deleteTokenMenuButton);
	 	deleteTokenMenuButton.off().on("click", function(){
	 		if(!$(e.target).hasClass("tokenselected")){
	 			deselect_all_tokens();
	 		}
	 		tokens.forEach(token => {
	 			token.selected = true;
	 		});
			delete_selected_tokens();
			close_token_context_menu();
	 	});
	 }


	$("#tokenOptionsPopup").addClass("moveableWindow");
	$("#tokenOptionsPopup").draggable({
			addClasses: false,
			scroll: false,
			containment: "#windowContainment",
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();

			}
		});
	

	moveableTokenOptions.css("left", Math.max(e.clientX - 230, 0) + 'px');

	if($(moveableTokenOptions).height() + e.clientY > window.innerHeight - 20) {
		moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
	}
	else {
		moveableTokenOptions.css("top", e.clientY - 10 + 'px');
	}	
}

/**
 * Builds and returns HTML inputs for updating token auras
 * @param tokens {Array<Token>} the token objects that the aura configuration HTML is for
 * @returns {*|jQuery|HTMLElement}
 */
function build_token_auras_inputs(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	body.css({
		width: "290px", // once we add Markers, make this wide enough to contain them all
		padding: "5px",
		display: "flex",
		"flex-direction": "row"
	})

	let allTokensArePlayer = true;
	for(token in tokens){
		if(!window.TOKEN_OBJECTS[tokens[token].options.id].isPlayer()){
			allTokensArePlayer=false;
			break;
		}
	}

	let auraVisibleValues = tokens.map(t => t.options.auraVisible);
	let uniqueAuraVisibleValues = [...new Set(auraVisibleValues)];

	let hideAuraFromPlayers = tokens.map(t => t.options.hideaurafog);
	let uniqueHideAuraFromPlayers = [...new Set(hideAuraFromPlayers)];

	let auraLightValues = tokens.map(t => t.options.auraislight);
	let uniqueAuraLightValues = [...new Set(auraLightValues)];

	let auraOwnedValues = tokens.map(t => t.options.auraowned);
	let uniqueAuraOwnedValues = [...new Set(auraOwnedValues)];


	let auraIsEnabled = null;
	if (uniqueAuraVisibleValues.length === 1) {
		auraIsEnabled = uniqueAuraVisibleValues[0];
	}
	let hideAuraIsEnabled = null;
	if (uniqueHideAuraFromPlayers.length === 1) {
		hideAuraIsEnabled = uniqueHideAuraFromPlayers[0];
	}
	let auraIsLightEnabled = null;
	if (uniqueAuraLightValues.length === 1) {
		auraIsLightEnabled = uniqueAuraLightValues[0];
	}
	let auraOnlyForOwnedTokenEnabled = null;
	if (uniqueAuraOwnedValues.length === 1) {
		auraOnlyForOwnedTokenEnabled = uniqueAuraOwnedValues[0];
	}

	let aura1Feet = tokens.map(t => t.options.aura1.feet);
	let uniqueAura1Feet = aura1Feet.length === 1 ? aura1Feet[0] : ""
	let aura2Feet = tokens.map(t => t.options.aura2.feet);
	let uniqueAura2Feet = aura2Feet.length === 1 ? aura2Feet[0] : ""
	let aura1Color = tokens.map(t => t.options.aura1.color);
	let uniqueAura1Color = aura1Color.length === 1 ? aura1Color[0] : ""
	let aura2Color = tokens.map(t => t.options.aura2.color);
	let uniqueAura2Color = aura2Color.length === 1 ? aura2Color[0] : ""

	let upsq = 'ft';
	if (window.CURRENT_SCENE_DATA.upsq !== undefined && window.CURRENT_SCENE_DATA.upsq.length > 0) {
		upsq = window.CURRENT_SCENE_DATA.upsq;
	}
	let wrapper = $(`
		<div class="token-config-aura-input">

			<div class="token-config-aura-wrapper">
				<div class="token-image-modal-footer-select-wrapper">
					<div class="token-image-modal-footer-title">Preset</div>
					<select class="token-config-aura-preset">
						<option value="none"></option>
						<option value="candle">Candle (5/5)</option>
						<option value="torch">Torch / Light (20/20)</option>
						<option value="lamp">Lamp (15/30)</option>
						<option value="lantern">Lantern (30/30)</option>
					</select>
				</div>
				<div class="menu-inner-aura">
					<h3 style="margin-bottom:0px;">Inner Aura</h3>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="aura-radius" name="aura1" type="text" value="${uniqueAura1Feet}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="aura1Color" value="${uniqueAura1Color}" >
					</div>
				</div>
				<div class="menu-outer-aura">
					<h3 style="margin-bottom:0px;">Outer Aura</h3>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="aura-radius" name="aura2" type="text" value="${uniqueAura2Feet}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="aura2Color" value="${uniqueAura1Color}" >
					</div>
				</div>
			</div>
		</div>
	`);

	const auraOption = {
		name: "auraVisible",
		label: "Enable Token Auras",
		type: "toggle",
		options: [
			{ value: true, label: "Visible", description: "Token Auras are visible." },
			{ value: false, label: "Hidden", description: "Token Auras are hidden." }
		],
		defaultValue: false
	};
	let enabledAurasInput = build_toggle_input( auraOption, auraIsEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name] = newValue;
			token.place_sync_persist();
		});
		if (newValue) {
			wrapper.find(".token-config-aura-wrapper").show();
		} else {
			wrapper.find(".token-config-aura-wrapper").hide();
		}
	});
	wrapper.prepend(enabledAurasInput);

	const auraOnlyForOwnedToken = {
		name: "auraowned",
		label: "Only show owned tokens aura",
		type: "toggle",
		options: [
			{ value: true, label: "Owned tokens Aura", description: "Only showing to the player their own token aura and other tokens with 'Player Accessible Stats' auras" },
			{ value: false, label: "All Auras", description: "Showing all token Auras" }
		],
		defaultValue: false
	};
	let auraOwnedInput = build_toggle_input(auraOnlyForOwnedToken, auraOnlyForOwnedTokenEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name] = newValue;
			token.place_sync_persist();
		});
		check_token_visibility();
	});
	if(allTokensArePlayer && window.DM)
		wrapper.find(".token-config-aura-wrapper").prepend(auraOwnedInput);
	
	const auraIsLightOption = {
		name: "auraislight",
		label: "Change aura appearance to light",
		type: "toggle",
		options: [
			{ value: true, label: "Light", description: "The token's aura is visually changed to look like light and is interacting with the scene darkness filter. If set on a player token: tokens not in visible 'light' auras are hidden." },
			{ value: false, label: "Default", description: "Enable this to make the token's aura look like light and interact with the scene darkness filter. If set on a player token: hide tokens not in visible 'light' auras." }
		],
		defaultValue: false
	};
	let auraIsLightInput = build_toggle_input(auraIsLightOption, auraIsLightEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name] = newValue;
			token.place_sync_persist();
		});
		check_token_visibility();
	});	
	wrapper.find(".token-config-aura-wrapper").prepend(auraIsLightInput);

	const hideAuraInFogOption = {
		name: "hideaurafog",
		label: "Hide aura when hidden in fog",
		type: "toggle",
		options: [
			{ value: true, label: "Hidden", description: "The token's aura is hidden from players when the token is in fog." },
			{ value: false, label: "Visible", description: "The token's aura is visible to players when the token is in fog." }
		],
		defaultValue: false
	};
	let hideAuraInFog = build_toggle_input(hideAuraInFogOption, hideAuraIsEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name] = newValue;
			token.place_sync_persist();
		});
	});
	if(window.DM) {
		wrapper.find(".token-config-aura-wrapper").prepend(hideAuraInFog);
	}
	

	wrapper.find("h3.token-image-modal-footer-title").after(enabledAurasInput);
	if (auraIsEnabled) {
		wrapper.find(".token-config-aura-wrapper").show();
	} else {
		wrapper.find(".token-config-aura-wrapper").hide();
	}

	let radiusInputs = wrapper.find('input.aura-radius');
	radiusInputs.on('keyup', function(event) {
		let newRadius = event.target.value;
		if (event.key == "Enter" && newRadius !== undefined && newRadius.length > 0) {
			tokens.forEach(token => {
				token.options[event.target.name]['feet'] = newRadius;
				token.place_sync_persist();
			});
			$(event.target).closest(".token-config-aura-wrapper").find(".token-config-aura-preset")[0].selectedIndex = 0;
		}
	});
	radiusInputs.on('focusout', function(event) {
		let newRadius = event.target.value;
		if (newRadius !== undefined && newRadius.length > 0) {
			tokens.forEach(token => {
				token.options[event.target.name]['feet'] = newRadius;
				token.place_sync_persist();
			});
			$(event.target).closest(".token-config-aura-wrapper").find(".token-config-aura-preset")[0].selectedIndex = 0;
		}
	});

	let colorPickers = wrapper.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		containerClassName: 'prevent-sidebar-modal-close',
		clickoutFiresChange: true,
		appendTo: "parent"
	});
	wrapper.find("input[name='aura1Color']").spectrum("set", uniqueAura1Color);
	wrapper.find("input[name='aura2Color']").spectrum("set", uniqueAura2Color);
	const colorPickerChange = function(e, tinycolor) {
		let auraName = e.target.name.replace("Color", "");
		let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
		console.log(auraName, e, tinycolor);
		if (e.type === 'change') {
			tokens.forEach(token => {
				token.options[auraName]['color'] = color;
				token.place_sync_persist();
			});
			$(e.target).closest(".token-config-aura-wrapper").find(".token-config-aura-preset")[0].selectedIndex = 0;
		} else {
			tokens.forEach(token => {
				let selector = "div[data-id='" + token.options.id + "']";
				let html = $("#tokens").find(selector);
				let options = Object.assign({}, token.options);
				options[auraName]['color'] = color;
				setTokenAuras(html, token.options)
			});
		}
	};
	colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
	colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
	colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it


	wrapper.find(".token-config-aura-preset").on("change", function(e) {
		let feet1 = "";
		let feet2 = "";
		let preset = e.target.value;
		if (preset === "candle") {
			feet1 = "5";
			feet2 = "5";
		} else if (preset === "torch") {
			feet1 = "20";
			feet2 = "20";
		} else if (preset === "lamp") {
			feet1 = "15";
			feet2 = "30";
		} else if (preset === "lantern") {
			feet1 = "30";
			feet2 = "30";
		} else {
			console.warn("somehow got an unexpected preset", preset, e);
		}
		let wrapper = $(e.target).closest(".token-config-aura-wrapper");
		wrapper.find("input[name='aura1']").val(feet1);
		wrapper.find("input[name='aura2']").val(feet2);

		let color1 = "rgba(255, 129, 0, 0.3)";
		let color2 = "rgba(255, 255, 0, 0.1)";
		wrapper.find("input[name='aura1Color']").spectrum("set", color1);
		wrapper.find("input[name='aura2Color']").spectrum("set", color2);

		tokens.forEach(token => {
			token.options.aura1.feet = feet1;
			token.options.aura2.feet = feet2;
			token.options.aura1.color = color1;
			token.options.aura2.color = color2;
			token.place_sync_persist();
		});
	});

	$("#VTTWRAPPER .sidebar-modal").on("remove", function () {
		console.log("removing sidebar modal!!!");
		colorPickers.spectrum("destroy");
	});
	body.append(wrapper);

	return body;
}

function build_menu_stat_inputs(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div id='menuStatDiv'></div>");
	let hp = '';
	let max_hp = '';
	let ac = '';
	let elev = '';

	if(tokens.length == 1 && ((tokens[0].options.player_owned && !tokens[0].options.disablestat) || (!tokens[0].options.hidestat && tokens[0].isPlayer() && !tokens[0].options.disablestat) || window.DM)){
		hp = (typeof tokens[0].options.hp !== 'undefined') ? tokens[0].options.hp : '';
		max_hp = (typeof tokens[0].options.max_hp !==  'undefined') ? tokens[0].options.max_hp : '';
		ac = (typeof tokens[0].options.ac !== 'undefined') ? tokens[0].options.ac : '';
		elev = (typeof tokens[0].options.elev !== 'undefined') ? tokens[0].options.elev : '';
	}
	else{
		hp = "????";
		max_hp = "????";
		ac = "????";
		elev = (typeof tokens[0].options.elev !== 'undefined') ? tokens[0].options.elev : '';
	}

	let hpMenuInput = $(`<label class='menu-input-label'>HP<input value='${hp}' class='menu-input hpMenuInput' type="text"></label>`);
	let maxHpMenuInput = $(`<label class='menu-input-label'>Max HP<input value='${max_hp}' class='menu-input maxHpMenuInput' type="text"></label>`);
	let acMenuInput = $(`<label class='menu-input-label'>AC<input value='${ac}' class='menu-input acMenuInput' type="text"></label>`);
	let elevMenuInput = $(`<label class='menu-input-label'>Elevation<input value='${elev}' class='menu-input elevMenuInput' type="number"></label>`);
	body.append(elevMenuInput);
	body.append(acMenuInput);
	body.append(hpMenuInput);
	body.append(maxHpMenuInput);




	hpMenuInput.on('keyup', function(event) {
		let newValue = event.target.value;
		let newHP = newValue;

		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newHP = parseInt(token.options.hp) + parseInt(newValue);
				}
				token.options.hp = newHP;
				token.place_sync_persist();
				$(".hpMenuInput").val(newHP);
			});
		}
	});
	hpMenuInput.on('focusout', function(event) {
		let newValue = event.target.value;
		let newHP = newValue;

		tokens.forEach(token => {
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newHP = parseInt(token.options.hp) + parseInt(newValue);
			}
			token.options.hp = newHP;
			token.place_sync_persist();
			$(".hpMenuInput").val(newHP);
		});
	});

	maxHpMenuInput.on('keyup', function(event) {
		let newValue = event.target.value;
		let newMaxHP = newValue;

		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newMaxHP = parseInt(token.options.max_hp) + parseInt(newValue);
				}
				token.options.max_hp = newMaxHP;
				token.place_sync_persist();
				$(".maxHpMenuInput").val(newMaxHP);
			});
		}
	});
	maxHpMenuInput.on('focusout', function(event) {
		let newValue = event.target.value;
		let newMaxHP = newValue;

		tokens.forEach(token => {
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newMaxHP = parseInt(token.options.max_hp) + parseInt(newValue);
			}
			token.options.max_hp = newMaxHP;
			token.place_sync_persist();
			$(".maxHpMenuInput").val(newMaxHP);
		});
	});

	acMenuInput.on('keyup', function(event) {
		let newValue = event.target.value;
		let newAC = newValue;

		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newAC = parseInt(token.options.ac) + parseInt(newValue);
				}
				token.options.ac = newAC;
				token.place_sync_persist();
				$(".acMenuInput").val(newAC);
			});
		}
	});
	acMenuInput.on('focusout', function(event) {
		let newValue = event.target.value;
		let newAC = newValue;

		tokens.forEach(token => {
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newAC = parseInt(token.options.ac) + parseInt(newValue);
			}
			token.options.ac = newAC;
			token.place_sync_persist();
			$(".acMenuInput").val(newAC);
		});
	});

	elevMenuInput.on('keyup', function(event) {
		if (event.key == "Enter") {
			tokens.forEach(token => {
				token.options.elev = event.target.value;
				token.place_sync_persist();
			});
		}
	});
	elevMenuInput.on('focusout', function(event) {
		tokens.forEach(token => {
			token.options.elev = event.target.value;
			token.place_sync_persist();
		});
	});

	return body;


}

function build_notes_flyout_menu(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	let id = tokens[0].options.id;
	body.css({
		width: "200px", // once we add Markers, make this wide enough to contain them all
		padding: "5px",
		"flex-direction": "row"
	});
	let editNoteButton = $(`<button class="icon-note material-icons">Create Note</button>`)
	if(tokenIds.length=1){
		let has_note=id in window.JOURNAL.notes;
		if(has_note){
			let viewNoteButton = $(`<button class="icon-view-note material-icons">View Note</button>`)		
			let deleteNoteButton = $(`<button class="icon-note-delete material-icons">Delete Note</button>`)
			editNoteButton = $(`<button class="icon-note material-icons">Edit Note</button>`)
			body.append(viewNoteButton);
			body.append(editNoteButton);		
			body.append(deleteNoteButton);	
			viewNoteButton.off().on("click", function(){
				window.JOURNAL.display_note(id);
			});
			deleteNoteButton.off().on("click", function(){
				if(id in window.JOURNAL.notes){
					delete window.JOURNAL.notes[id];
					window.JOURNAL.persist();
					window.TOKEN_OBJECTS[id].place();
				}
			});
		}
		else {
			body.append(editNoteButton);
		}

		editNoteButton.off().on("click", function(){
			if (!(id in window.JOURNAL.notes)) {
				window.JOURNAL.notes[id] = {
					title: window.TOKEN_OBJECTS[id].options.name,
					text: '',
					plain: '',
					player: false
				}
			}
			window.JOURNAL.edit_note(id);
		});		
	}

	return body;
}

	

function build_conditions_and_markers_flyout_menu(tokenIds) {

	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	body.css({
		width: "fit-content", // once we add Markers, make this wide enough to contain them all
		padding: "5px",
		display: "flex",
		"flex-direction": "row"
	})

	const buildConditionItem = function(conditionName) {

		let conditionItem = $(`<li class="${determine_condition_item_classname(tokenIds, conditionName)} icon-${conditionName.toLowerCase().replaceAll("(", "-").replaceAll(")", "").replaceAll(" ", "-")}"></li>`);
		if (conditionName.startsWith("#")) {
			let colorItem = $(`<span class="color-condition"></span>`);
			conditionItem.append(colorItem);
			colorItem.css("background-color", conditionName);
		} else {
			conditionItem.append(`<span>${conditionName}</span>`);
		}

		conditionItem.on("click", function (clickEvent) {
			let clickedItem = $(clickEvent.currentTarget);
			let deactivateAll = clickedItem.hasClass("some-active");
			tokens.forEach(token => {
				if (deactivateAll || token.hasCondition(conditionName)) {
					token.removeCondition(conditionName)
				} else {
					token.addCondition(conditionName)
				}
				token.place_sync_persist();
			});
			clickedItem.removeClass("single-active all-active some-active active-condition");
			clickedItem.addClass(determine_condition_item_classname(tokenIds, conditionName));
		});
		return conditionItem;
	};

	let isPlayerTokensSelected = false;
	tokens.forEach(token => {
		if(token.isPlayer())
		{
			isPlayerTokensSelected = true;
		}
	});	
	let conditionsList = $(`<ul></ul>`);
	conditionsList.css("width", "180px");
	body.append(conditionsList);
	STANDARD_CONDITIONS.forEach(conditionName => {
		let conditionItem = buildConditionItem(conditionName);
		conditionItem.addClass("icon-condition");
		conditionsList.append(conditionItem);
	});
	if(isPlayerTokensSelected)
	{
		conditionsList.append($("<div id='playerTokenSelectedWarning'>A player token is selected this column of conditions must be set on the character sheet. Selecting a condition here will whisper the selected player(s).</div>"));
	}

	let markersList = $(`<ul></ul>`);
	markersList.css("width", "185px");
	body.append(markersList);
	CUSTOM_CONDITIONS.forEach(conditionName => {
		let conditionItem = buildConditionItem(conditionName);
		conditionItem.addClass("markers-icon");
		markersList.append(conditionItem);

	});

	let removeAllItem = $(`<li class="icon-condition icon-close-red"><span>Remove All</span></li>`);
	removeAllItem.on("click", function () {
		$(".active-condition").click(); // anything that is active should be deactivated.

	});
	conditionsList.prepend(removeAllItem);

	return body;
}

function build_adjustments_flyout_menu(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);

	// Aoe tokens are treated differently from everything else so we need to check this more often
	let isAoeList = tokens.map(t => t.isAoe());
	let uniqueAoeList = [...new Set(isAoeList)];
	const allTokensAreAoe = (uniqueAoeList.length === 1 && uniqueAoeList[0] === true);

	let body = $("<div></div>");
	body.css({
		width: "320px",
		padding: "5px"
	});
	// name
	let tokenNames = tokens.map(t => t.options.name);
	let uniqueNames = [...new Set(tokenNames)];
	let nameInput = $(`<input title="Token Name" placeholder="Token Name" name="name" type="text" />`);
	if (uniqueNames.length === 1) {
		nameInput.val(tokenNames[0]);
	} else {
		nameInput.attr("placeholder", "Multiple Values");
	}

	nameInput.on('keyup', function(event) {
		let newName = event.target.value;
		if (event.key == "Enter" && newName !== undefined && newName.length > 0) {
			tokens.forEach(token => {
				token.options.name = newName;
				token.place_sync_persist();
			});
		}
	});
	nameInput.on('focusout', function(event) {
		let newName = event.target.value;
		if (newName !== undefined && newName.length > 0) {
			tokens.forEach(token => {
				token.options.name = newName;
				token.place_sync_persist();
			});
		}
	});
	let nameWrapper = $(`
		<div class="token-image-modal-url-label-wrapper">
			<div class="token-image-modal-footer-title">Token Name</div>
		</div>
	`);
	nameWrapper.append(nameInput); // input below label
	body.append(nameWrapper);

	let tokenSizes = [];
	tokens.forEach(t => {
		tokenSizes.push(t.numberOfGridSpacesWide());
		tokenSizes.push(t.numberOfGridSpacesTall());
	});
	let uniqueSizes = [...new Set(tokenSizes)];
	console.log("uniqueSizes", uniqueSizes);
	let sizeInputs = build_token_size_input(uniqueSizes, function (newSize) {
		const hpps = Math.round(window.CURRENT_SCENE_DATA.hpps);
		if (!isNaN(newSize)) {
			newSize = hpps * newSize;
		} else {
			console.log(`not updating tokens with size ${newSize}`); // probably undefined because we inject the "multiple" options below
			return;
		}
		tokens.forEach(token => {			
			// Reset imageScale if new size is larger
			if(token.options.size < newSize) {
				token.imageSize(1);
			}
			token.size(newSize);	
			clampTokenImageSize(token.options.imageSize, token.options.size);
		});
	}, allTokensAreAoe); // if we're only dealing with aoe, don't bother displaying the select list. Just show the size input
	body.append(sizeInputs);
	if (allTokensAreAoe) {
		sizeInputs.find("select").closest(".token-image-modal-footer-select-wrapper").hide(); // if we're only dealing with aoe, don't bother displaying the select list. Just show the size input
	}

	if (!allTokensAreAoe) {

		//image scaling size
		let tokenImageScales = tokens.map(t => t.options.imageSize);
		let uniqueScales = [...new Set(tokenImageScales)];
		let startingScale = uniqueScales.length === 1 ? uniqueScales[0] : 1;
		let imageSizeWrapper = build_token_image_scale_input(startingScale, tokens, function (imageSize) {
			tokens.forEach(token => {
				imageSize = clampTokenImageSize(imageSize, token.options.size);
				token.options.imageSize = imageSize;
				$(`.VTTToken[data-id='${token.options.id}']`).css("--token-scale", imageSize)
				token.place_sync_persist();
			});
		});
		body.append(imageSizeWrapper);
		if (tokens.some((t) => t.isAoe())){
			let imageSizeInput = imageSizeWrapper.find(".image-scale-input-number");
			let imageSizeInputRange = imageSizeWrapper.find(".image-scale-input-range");
			imageSizeInputRange.attr("disabled", true)
			imageSizeInputRange.attr("title", "Aoe tokens can't be adjusted this way")
			imageSizeInput.attr("disabled",true)
			imageSizeInput.attr("title", "Aoe tokens can't be adjusted this way")
		}


		//border color selections
		let tokenBorderColors = tokens.map(t => t.options.color);
		let initialColor = tokenBorderColors.length === 1 ? tokenBorderColors[0] : random_token_color();
		const borderColorWrapper = build_token_border_color_input(initialColor, function (newColor, eventType) {
			if (eventType === 'change') {
				tokens.forEach(token => {
					token.options.color = newColor;
					$("#combat_area tr[data-target='" + token.options.id + "'] img[class*='Avatar']").css("border-color", newColor);
					token.place_sync_persist();
				});
			}
			else {
				tokens.forEach(token => {
					token.options.color = newColor;
					token.place_sync_persist();
				});
			}
		});
		body.append(borderColorWrapper);

		let changeImageMenuButton = $("<button id='changeTokenImage' class='material-icons'>Change Token Image</button>")
		body.append(changeImageMenuButton)

		changeImageMenuButton.off().on("click", function() {
			close_token_context_menu();
			id = tokens[0].options.id;
			if (!(id in window.TOKEN_OBJECTS)) {
				return;
			}
			let tok = window.TOKEN_OBJECTS[id];
			display_change_image_modal(tok);
		});
	}
	return body;
}

function build_token_image_scale_input(startingScale, tokens, didUpdate) {
	if (isNaN(startingScale)) {
		startingScale = 1;
	}
	let maxImageScale
	if(!tokens){
		maxImageScale = 6;
	}
	else{
		maxImageScale = getTokenMaxImageScale(tokens[0].options.size);
	}


	let imageSizeInput = $(`<input class="image-scale-input-number" type="number" max="${maxImageScale}" min="0.2" step="0.1" title="Token Image Scale" placeholder="1.0" name="Image Scale">`);
	let imageSizeInputRange = $(`<input class="image-scale-input-range" type="range" value="1" min="0.2" max="${maxImageScale}" step="0.1"/>`);
	imageSizeInput.val(startingScale || 1);
	imageSizeInputRange.val(startingScale || 1);
	imageSizeInput.on('keyup', function(event) {
		let imageSize = event.target.value;	
		if(tokens !== false){
			imageSize = clampTokenImageSize(imageSize, tokens[0].options.size);
		}

		if (event.key === "Enter") {
		if(tokens !== false){
			imageSize = clampTokenImageSize(imageSize, tokens[0].options.size);
		}
			imageSizeInput.val(imageSize);
			imageSizeInputRange.val(imageSize);
			didUpdate(imageSize);
		} else if (event.key === "Escape") {
			$(event.target).blur();
		}
		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInput.on('focusout', function(event) {
		let imageSize = event.target.value;		
		if(tokens !== false){
			imageSize = clampTokenImageSize(imageSize, tokens[0].options.size);
		}
		imageSizeInput.val(imageSize);	
		imageSizeInputRange.val(imageSize);
		didUpdate(imageSize);

		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInput.on(' input change', function(){
		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInputRange.on(' input change', function(){
		imageSizeInput.val(imageSizeInputRange.val());
	});
	imageSizeInputRange.on('mouseup', function(){
		let imageSize = event.target.value;	
		if(tokens !== false){
			imageSize = clampTokenImageSize(imageSize, tokens[0].options.size);
		}
		didUpdate(imageSize);
	});
	let imageSizeWrapper = $(`
		<div class="token-image-modal-url-label-wrapper image-size-wrapper">
			<div class="token-image-modal-footer-title image-size-title">Token Image Scale</div>
		</div>
	`);
	imageSizeWrapper.append(imageSizeInput); // Beside Label
	imageSizeWrapper.append(imageSizeInputRange); // input below label
	return imageSizeWrapper;
}

function build_options_flyout_menu(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);

	// Aoe tokens are treated differently from everything else so we need to check this more often
	let isAoeList = tokens.map(t => t.isAoe());
	let uniqueAoeList = [...new Set(isAoeList)];
	const allTokensAreAoe = (uniqueAoeList.length === 1 && uniqueAoeList[0] === true);
	let player_selected = false;

	let body = $("<div></div>");
	body.css({
		width: "320px",
		padding: "5px"
	})

	let token_settings = token_setting_options();
	if (tokens.length === 1 && !tokens[0].isPlayer()){
		let removename = "hidestat";
		token_settings = $.grep(token_settings, function(e){
		     return e.name != removename;
		});
	}
	for (var i = 0; i < tokens.length; i++) {
	    if(tokens[i].isPlayer()){
	    	player_selected = true;
	    	break;
	    }
	}
	if (player_selected){
		let removename = "player_owned";
		token_settings = $.grep(token_settings, function(e){
		     return e.name != removename;
		});
	}
	for(let i = 0; i < token_settings.length; i++) {
		let setting = token_settings[i];
		if (allTokensAreAoe && !availableToAoe.includes(setting.name)) {
			continue;
		} else if(setting.hiddenSetting) {
			continue;
		}

		let tokenSettings = tokens.map(t => t.options[setting.name]);
		let uniqueSettings = [...new Set(tokenSettings)];
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}

		if (setting.type === "dropdown") {
			let inputWrapper = build_dropdown_input(setting, currentValue, function(name, newValue) {
				tokens.forEach(token => {
					token.options[name] = newValue;
					token.place_sync_persist();
				});
			});
			body.append(inputWrapper);
		} else if (setting.type === "toggle") {
			let inputWrapper = build_toggle_input(setting, currentValue, function (name, newValue) {
				tokens.forEach(token => {
					token.options[name] = newValue;
					token.place_sync_persist();
				});
			});
			body.append(inputWrapper);
		} else {
			console.warn("build_options_flyout_menu failed to handle token setting option with type", setting.type);
		}
	}

	let resetToDefaults = $(`<button class='token-image-modal-remove-all-button' title="Reset all token settings back to their default values." style="width:100%;padding:8px;margin:10px 0px;">Reset Token Settings to Defaults</button>`);
	resetToDefaults.on("click", function (clickEvent) {
		let formContainer = $(clickEvent.currentTarget).parent();

		// disable all toggle switches
		formContainer
			.find(".rc-switch")
			.removeClass("rc-switch-checked")
			.removeClass("rc-switch-unknown");

		// set all dropdowns to their default values
		formContainer
			.find("select")
			.each(function () {
				let el = $(this);
				let matchingOption = token_settings.find(o => o.name === el.attr("name"));
				el.find(`option[value=${matchingOption.defaultValue}]`).attr('selected','selected');
			});

		// This is why we want multiple callback functions.
		// We're about to call updateValue a bunch of times and only need to update the UI (or do anything else really) one time
		token_settings.forEach(option => {
			tokens.forEach(token => token.options[option.name] = option.defaultValue);
		});
		tokens.forEach(token => token.place_sync_persist());


	});
	body.append(resetToDefaults);
	return body;
}

/**
 * Builds and returns HTML inputs for updating token size
 * @param tokenSizes {Array<Number>} the current size of the token this input is for
 * @param changeHandler {function} the function to be called when the input changes. This function takes a single {float} variable. EX: function(numberOfSquares) { ... } where numberOfSquares is 1 for medium, 2 for large, etc
 * @param forceCustom {boolean} whether or not to force the current setting to be custom even if the size is a standard size... We do this for aoe
 * @returns {*|jQuery|HTMLElement} the jQuery object containing all the input elements
 */
function build_token_size_input(tokenSizes, changeHandler, forceCustom = false) {
	let numGridSquares = undefined;
	// get the first value if there's only 1 value
	if (tokenSizes.length === 1) {
		numGridSquares = tokenSizes[0]
		if (isNaN(numGridSquares)) {
			numGridSquares = 1;
		}
	} else {
		// multiple options
		numGridSquares = -1
	}

	let upsq = window.CURRENT_SCENE_DATA.upsq;
	if (upsq === undefined || upsq.length === 0) {
		upsq = "ft";
	}

	const isSizeCustom = (forceCustom || ![0.5, 1, 2, 3, 4].includes(numGridSquares));
	console.log("isSizeCustom: ", isSizeCustom, ", forceCustom: ", forceCustom, ", numGridSquares: ", numGridSquares, ", [0.5, 1, 2, 3, 4].includes(numGridSquares):", [0.5, 1, 2, 3, 4].includes(numGridSquares))

	// Limit custom token scale to grid size 
	const maxScale = Math.max(window.CURRENT_SCENE_DATA.width / window.CURRENT_SCENE_DATA.hpps);

	let customStyle = isSizeCustom ? "display:flex;" : "display:none;"
	const size = (numGridSquares > 0) ? (numGridSquares * window.CURRENT_SCENE_DATA.fpsq) : 1;
	let output = $(`
 		<div class="token-image-modal-footer-select-wrapper">
 			<div class="token-image-modal-footer-title">Token Size</div>
 			<select name="data-token-size">
			 	${numGridSquares === -1 ? '<option value="multiple" selected="selected" disabled="disabled">Multiple Values</option>' : ""}
 				<option value="0.5" ${numGridSquares > 0 && numGridSquares < 1 ? "selected='selected'": ""}>Tiny (2.5${upsq})</option>
 				<option value="1" ${numGridSquares === 1 ? "selected='selected'": ""}>Small/Medium (5${upsq})</option>
 				<option value="2" ${numGridSquares === 2 ? "selected='selected'": ""}>Large (10${upsq})</option>
 				<option value="3" ${numGridSquares === 3 ? "selected='selected'": ""}>Huge (15${upsq})</option>
 				<option value="4" ${numGridSquares === 4 ? "selected='selected'": ""}>Gargantuan (20${upsq})</option>
 				<option value="custom" ${numGridSquares !== -1 && isSizeCustom ? "selected='selected'": ""}>Custom</option>
 			</select>
 		</div>
 		<div class="token-image-modal-footer-select-wrapper" style="${customStyle}">
 			<div class="token-image-modal-footer-title">Custom size in ${upsq}</div>
 			<input type="number" min="${window.CURRENT_SCENE_DATA.fpsq / 2}" step="${window.CURRENT_SCENE_DATA.fpsq /2}"
			 name="data-token-size-custom" value=${size} style="width: 3rem;">
 		</div>
 	`);

	let tokenSizeInput = output.find("select");
	let customSizeInput = output.find("input");

	tokenSizeInput.change(function(event) {
		let customInputWrapper = $(event.target).parent().next();
		console.log("tokenSizeInput changed");
		if ($(event.target).val() === "custom") {
			customInputWrapper.show();
		} else {
			customInputWrapper.find("input").val($(event.target).val() * window.CURRENT_SCENE_DATA.fpsq)
			customInputWrapper.hide();
			changeHandler(parseFloat($(event.target).val()));
		}
	});

	customSizeInput.change(function(event) {
		console.log("customSizeInput changed");
		// convert custom footage into squares
		let newValue = 
			parseFloat($(event.target).val() / window.CURRENT_SCENE_DATA.fpsq);
		// tiny is the smallest you can go with a custom size
		if (newValue < 0.5){
			 newValue = 0.5
			$(event.target).val(window.CURRENT_SCENE_DATA.fpsq / 2)
		}
		if (!isNaN(newValue)) {
			changeHandler(newValue);
		}
	});

	return output;
}

/**
 * Ensures the new imageSize is within the allowed boundaries.
 * @param {number|string} newImageSize the new expected imageSize
 * @param {number} tokenSize the current token size
 * @returns the clamped imageSize
 */
 function clampTokenImageSize(newImageSize, tokenSize) {

	const maxScale = getTokenMaxImageScale(tokenSize);
	newImageSize = parseFloat(newImageSize);
	newImageSize = clamp(newImageSize, 0.2, maxScale);	

	// Update the DOM inputs if available
	updateScaleInputs(newImageSize, maxScale);

	return newImageSize;
}

/**
 * Calculates the maximum imageScale for the given token size.
 * @param {number} tokenSize current size of the token
 * @returns maximum value for imageScale
 */
 function getTokenMaxImageScale(tokenSize) {
	return Math.min(6, window.CURRENT_SCENE_DATA.width / parseFloat(tokenSize));
}

/**
 * Updates the imageScales DOM inputs.
 * @param {number} newScale the new imageScale
 * @param {number} maxScale the maximum allowed imageScale
 */
function updateScaleInputs(newScale, maxScale) {
	// Get DOM inputs
	const imageScaleInputNumber = $(".image-scale-input-number");
	const imageScaleInputRange = $(".image-scale-input-range");

	// Update current value
	if(parseFloat(imageScaleInputNumber.val()) > maxScale) {
		imageScaleInputNumber.val(newScale);
	}
	if(parseFloat(imageScaleInputRange.val()) > maxScale) {
		imageScaleInputRange.val(newScale);
	}

	// Update max values
	imageScaleInputNumber.attr('max', maxScale);
	imageScaleInputRange.attr('max', maxScale);
}
