
// deprecated. replaced by mytokens
tokendata={
	folders:{},
};

// deprecated, but still needed for migrate_to_my_tokens() to work
function convert_path(path){
	var pieces=path.split("/");
	var current=tokendata;
	
	for(var i=0;i<pieces.length;i++){
		if(pieces[i]=="")
			continue;
		current=current.folders[pieces[i]];
	}
	return current;
}

// deprecated, but still needed for migrate_to_my_tokens() to work
function persist_customtokens(){
	delete tokendata.folders["AboveVTT BUILTIN"];
	localStorage.setItem("CustomTokens",JSON.stringify(tokendata));
	delete tokendata.folders["AboveVTT BUILTIN"];
}

function context_menu_flyout(id, hoverEvent, buildFunction) {
	let contextMenu = $("#tokenOptionsPopup");
	if (contextMenu.length === 0) {
		console.warn("context_menu_flyout, but #tokenOptionsPopup could not be found");
		return;
	}

	try {
		clearTimeout(window.context_menu_flyout_timer);
	} catch (e) {
		console.debug("failed to clear window.context_menu_flyout_timer", window.context_menu_flyout_timer);
	}

	if (hoverEvent.type === "mouseenter") {
		let flyout = $(`<div id='${id}' class='context-menu-flyout'></div>`);
		$(`.context-menu-flyout`).remove(); // never duplicate

		buildFunction(flyout);
		$("#tokenOptionsContainer").append(flyout);

		let contextMenuCenter = (contextMenu.height() / 2);
		let flyoutHeight = flyout.height();
		let diff = (contextMenu.height() - flyoutHeight);
		let flyoutTop = contextMenuCenter - (flyoutHeight / 2); // center alongside the contextmenu


		if (diff > 0) {
			// the flyout is smaller than the contextmenu. Make sure it's alongside the hovered row			
			// align to the top of the row
			let buttonPosition = $(".flyout-from-menu-item:hover")[0].getBoundingClientRect().y - $("#tokenOptionsPopup")[0].getBoundingClientRect().y
			if(buttonPosition < contextMenuCenter) {
				flyoutTop =  buttonPosition - (flyoutHeight / 5)
			}
			else{
				flyoutTop =  buttonPosition - (flyoutHeight / 1.2)
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
	$("#tokenOptionsPopup").remove();
	let tokenOptionsClickCloseDiv = $("<div id='tokenOptionsClickCloseDiv'></div>");
	tokenOptionsClickCloseDiv.off().on("click", function(){
		$("#tokenOptionsPopup").remove();
		$('.context-menu-list').trigger('contextmenu:hide')
		tokenOptionsClickCloseDiv.remove();
		$(".sp-container").spectrum("destroy");
		$(".sp-container").remove();
		$(`.context-menu-flyout`).remove(); 
	});

	let moveableTokenOptions = $("<div id='tokenOptionsPopup'></div>");

	
	let body = $("<div id='tokenOptionsContainer')></div>");
	moveableTokenOptions.append(body);

	$('body').append(moveableTokenOptions);
	$('body').append(tokenOptionsClickCloseDiv);

	// stat block / character sheet
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
		let token = tokens[0];
		if (token.isPlayer() && window.DM) {
			let button = $(`<button>Open Character Sheet<span class="material-icons icon-view"></span></button>`);
			button.on("click", function() {
				open_player_sheet(token.options.id);
			});
			body.append(button);
		} else if (token.isMonster()) {
			let button = $(`<button>Open Monster Stat Block<span class="material-icons icon-view"></span></button>`);
			button.on("click", function() {
				load_monster_stat(token.options.monster, token.options.id);
				$("#tokenOptionsClickCloseDiv").click();
			});
			if(token.options.player_owned || window.DM){
				body.append(button);
			}
		}
	}

	if(window.DM){
		let addButtonInternals = `Add to Combat Tracker<span class="material-icons icon-person-add"></span>`;
		let removeButtonInternals = `Remove From Combat Tracker<span class="material-icons icon-person-remove"></span>`;
		let combatButton = $(`<button></button>`);
		let inCombatStatuses = [...new Set(tokens.map(t => t.options.combat))];
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
				tokens.forEach(t => ct_remove_token(t, false));
			} else {
				clickedButton.removeClass("add-to-ct").addClass("remove-from-ct");
				clickedButton.html(removeButtonInternals);
				tokens.forEach(t => ct_add_token(t, false));
			}
			ct_persist();
		});
		body.append(combatButton);

	
		let hiddenMenuButton = $(`<button class="`+determine_hidden_classname(tokenIds) + `context-menu-icon-condition icon-invisible material-icons">Hide/Reveal Token</button>`)

		hiddenMenuButton.off().on("click", function(tokenIds){
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
		body.append(aurasRow);
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
		let optionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Options</div></div>`);
		optionsRow.hover(function (hoverEvent) {
			context_menu_flyout("options-flyout", hoverEvent, function(flyout) {
				flyout.append(build_options_flyout_menu(tokenIds));
			})
		});
		body.append(optionsRow);
	}

	if(window.DM) {
		let deleteTokenMenuButton = $("<button class='deleteMenuButton icon-close-red material-icons'>Delete</button>")
	 	body.append(deleteTokenMenuButton);
	 	deleteTokenMenuButton.off().on("click", function(){
	 		if(!$(e.target).hasClass("tokenselected")){
	 			deselect_all_tokens();
	 		}
	 		tokens.forEach(token => {
	 			token.selected = true;
	 		});
			delete_selected_tokens()
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
	
	$("#tokenOptionsPopup").mousedown(function() {
		frame_z_index_when_click($(this));
	});

	moveableTokenOptions.css("left", Math.max(e.clientX - 245, 0) + 'px');

	if($(moveableTokenOptions).height() + e.clientY > window.innerHeight - 20) {
		moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
	}
	else {
		moveableTokenOptions.css("top", e.clientY + 'px');
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

	let auraVisibleValues = tokens.map(t => t.options.auraVisible);
	let uniqueAuraVisibleValues = [...new Set(auraVisibleValues)];

	let hideAuraFromPlayers = tokens.map(t => t.options.hideaurafog);
	let uniqueHideAuraFromPlayers = [...new Set(hideAuraFromPlayers)];



	let auraIsEnabled = null;
	if (uniqueAuraVisibleValues.length === 1) {
		auraIsEnabled = uniqueAuraVisibleValues[0];
	}
	let hideAuraIsEnabled = null;
	if (uniqueHideAuraFromPlayers.length === 1) {
		hideAuraIsEnabled = uniqueHideAuraFromPlayers[0];
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

	let enabledAurasInput = build_toggle_input("auraVisible", "Enable Token Auras", auraIsEnabled, undefined, undefined, function(name, newValue) {
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
	let hideAuraInFog = build_toggle_input("hideaurafog", "Hide aura when hidden in fog", hideAuraIsEnabled, "Token's aura is hidden from players when in fog", "Token's aura is visible to players when token is in fog", function(name, newValue) {
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
	let elevMenuInput = $(`<label class='menu-input-label'>Elevation<input value='${elev}' class='menu-input elevMenuInput' type="text"></label>`);
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
		let newValue = event.target.value;
		let newElev = newValue;

		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newElev = parseInt(token.options.elev) + parseInt(newValue);
				}
				token.options.elev = newElev;
				token.place_sync_persist();
				$(".elevMenuInput").val(newElev);
			});
		}
	});
	elevMenuInput.on('focusout', function(event) {
		let newValue = event.target.value;
		let newElev = newValue;

		tokens.forEach(token => {
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newElev = parseInt(token.options.elev) + parseInt(newValue);
			}
			token.options.elev = newElev;
			token.place_sync_persist();
			$(".elevMenuInput").val(newElev);
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
		width: "380px", // once we add Markers, make this wide enough to contain them all
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

	let conditionsList = $(`<ul></ul>`);
	conditionsList.css("width", "180px");
	body.append(conditionsList);
	STANDARD_CONDITIONS.forEach(conditionName => {
		let conditionItem = buildConditionItem(conditionName);
		conditionItem.addClass("icon-condition");
		conditionsList.append(conditionItem);
	});

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


	// size
	let tokenSizes = tokens.map(t => t.gridSize());
	let uniqueSizes = [...new Set(tokenSizes)];
	console.log("uniqueSizes", uniqueSizes);
	let sizeInputs = build_token_size_input(1, function (newSize) {
		tokens.forEach(token => {
			if (newSize === 0) {
				// tiny comes back as 0 but it's actually 0.5
				token.size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 0.5);
			} else if (!isNaN(newSize)) {
				token.size(Math.round(window.CURRENT_SCENE_DATA.hpps) * newSize);
			} else {
				console.log(`not updating tokens with size ${newSize}`); // probably undefined because we inject the "multiple" options below
			}
		});
	});
	if (uniqueSizes.length === 1) {
		sizeInputs.find(`select > option[value="${uniqueSizes[0]}"]`).attr("selected", "selected");
	} else {
		sizeInputs.find("select").prepend(`<option value="multiple" selected>Multiple Values</option>`);
	}
	body.append(sizeInputs);

	//image scaling size
	let imageSizeInput = $(`<input class="image-scale-input-number" type="number" max="6" min="0.2" step="0.1" title="Token Image Scale" placeholder="1.0" name="Image Scale">`);
	let imageSizeInputRange = $(`<input class="image-scale-input-range" type="range" value="1" min="0.2" max="6" step="0.1"/>`);
	let tokenImageScales = tokens.map(t => t.options.imageSize);
	if(tokenImageScales.length === 1) {
		imageSizeInput.val(tokenImageScales[0] || 1);	
		imageSizeInputRange.val(tokenImageScales[0] || 1);
	}
	imageSizeInput.on('keyup', function(event) {
		var imageSize;
		if(event.target.value <= 6 && event.target.value >= 0.2) { 
			imageSize = event.target.value;
		}
		else if(event.target.value > 6){
			imageSize = 6;
		}
		else if(event.target.value < 0.2){
			imageSize = 0.2;
		}
		if (event.key == "Enter") {
			imageSizeInput.val(imageSize);	
			imageSizeInputRange.val(imageSize);
			tokens.forEach(token => {
				token.options.imageSize = imageSize;
				token.place_sync_persist();
			});
		}
		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInput.on('focusout', function(event) {
		var imageSize;
		if(event.target.value <= 6 && event.target.value >= 0.2) { 
			imageSize = event.target.value;
		}
		else if(event.target.value > 6){
			imageSize = 6;
			imageSizeInput.val(imageSize);	
			imageSizeInputRange.val(imageSize);
		}
		else if(event.target.value < 0.2){
			imageSize = 0.2;
			imageSizeInput.val(imageSize);	
			imageSizeInputRange.val(imageSize);
		}	
		tokens.forEach(token => {
			token.options.imageSize = imageSize;
			token.place_sync_persist();
		});

		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInput.on(' input change', function(){
   	 	imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInputRange.on(' input change', function(){
   	 	imageSizeInput.val(imageSizeInputRange.val());
	});
	imageSizeInputRange.on('mouseup', function(){
   	 	let imageSize = imageSizeInputRange.val();
		tokens.forEach(token => {
			token.options.imageSize = imageSize;
			token.place_sync_persist();
		});
	});
	let imageSizeWrapper = $(`
		<div class="token-image-modal-url-label-wrapper image-size-wrapper">
			<div class="token-image-modal-footer-title image-size-title">Token Image Scale</div>
		</div>
	`);
	imageSizeWrapper.append(imageSizeInput); // Beside Label
	imageSizeWrapper.append(imageSizeInputRange); // input below label
	body.append(imageSizeWrapper);

	//border color selections
	let borderColorInput = $(`<input class="border-color-input" type="color" value="#ddd"/>`);
	let tokenBorderColors = tokens.map(t => t.options.color);
	if(tokenBorderColors.length === 1) {
		borderColorInput.val(tokenBorderColors[0] || "#dddddd");	
	}
	let borderColorWrapper = $(`
		<div class="token-image-modal-url-label-wrapper border-color-wrapper">
			<div class="token-image-modal-footer-title border-color-title">Border Color</div>
		</div>
	`);
	borderColorWrapper.append(borderColorInput); 
	body.append(borderColorWrapper);
	let colorPicker = $(borderColorInput);
	colorPicker.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		containerClassName: 'prevent-sidebar-modal-close',
		clickoutFiresChange: true,
		color: tokens[0].options.color,
		appendTo: "parent"
	});
	const borderColorPickerChange = function(event, tinycolor) {
		let borderColor = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
		if (event.type === 'change') {
			tokens.forEach(token => {
				token.options.color = borderColor;
				$("#combat_area tr[data-target='" + token.options.id + "'] img[class*='Avatar']").css("border-color", borderColor);
				token.place_sync_persist();
			});
		}
		else {
			tokens.forEach(token => {
				token.options.color = borderColor;		
				token.place_sync_persist();	
			});
		}
	};
	colorPicker.on('dragstop.spectrum', borderColorPickerChange);   // update the token as the player messes around with colors
	colorPicker.on('change.spectrum', borderColorPickerChange); // commit the changes when the user clicks the submit button
	colorPicker.on('hide.spectrum', borderColorPickerChange);   // the hide event includes the original color so let's change it back when we get it
	

	let changeImageMenuButton = $("<button id='changeTokenImage' class='material-icons'>Change Token Image</button>")
	if(tokens.length === 1 && window.DM){
		body.append(changeImageMenuButton)
	}

	changeImageMenuButton.off().on("click", function(){	
		id = tokens[0].options.id;
		if (!(id in window.TOKEN_OBJECTS)) {
			return;
		}
		let tok = window.TOKEN_OBJECTS[id];
		display_change_image_modal(tok);
	});

	return body;
}

function build_options_flyout_menu(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	body.css({
		width: "320px",
		padding: "5px"
	})

	let token_settings = [
		{ name: "hidden", label: "Hide", enabledDescription:"Token is hidden to players", disabledDescription: "Token is visible to players" },
		{ name: "square", label: "Square Token", enabledDescription:"Token is square", disabledDescription: "Token is round" },
		{ name: "locked", label: "Lock Token in Position", enabledDescription:"Token is not moveable, Players can not select this token", disabledDescription: "Token is moveable by at least the DM, players can select it however" },
		{ name: "restrictPlayerMove", label: "Restrict Player Movement", enabledDescription:"Token is not moveable by players", disabledDescription: "Token is moveable by any player" },
		{ name: "disablestat", label: "Disable HP/AC", enabledDescription:"Token stats are not visible", disabledDescription: "Token stats are visible to at least the DM" },
		{ name: "hidestat", label: "Hide Player HP/AC from players", enabledDescription:"Token stats are hidden from players", disabledDescription: "Token stats are visible to players" },
		{ name: "hidehpbar", label: "Only show HP values on hover", enabledDescription:"HP values will only be shown when you hover or select a token", disabledDescription: "Enable this to hide HP values except when you hover or select a token." },
		{ name: "disableborder", label: "Disable Border", enabledDescription:"Token has no border", disabledDescription: "Token has a random coloured border"  },
		{ name: "disableaura", label: "Disable Health Meter", enabledDescription:"Token has no health glow", disabledDescription: "Token has health glow corresponding with their current health" },
		{ name: "enablepercenthpbar", label: "Enable Token HP% Bar", enabledDescription:"Token has a traditional visual hp% bar indicator", disabledDescription: "Token does not have a traditional visual hp% bar indicator" },
		{ name: "revealname", label: "Show name to players", enabledDescription:"Token on hover name is visible to players", disabledDescription: "Token name is hidden to players" },
		{ name: "legacyaspectratio", label: "Ignore Image Aspect Ratio", enabledDescription:"Token will stretch non-square images to fill the token space", disabledDescription: "Token will respect the aspect ratio of the image provided" },
		{ name: "player_owned", label: "Player access to sheet/stats", enabledDescription:"Tokens' sheet is accessible to players via RMB click on token. If token stats is visible to players, players can modify the hp of the token", disabledDescription: "Tokens' sheet is not accessible to players. Players can't modify token stats"}
	];
	if (tokens.length == 1 && !tokens[0].isPlayer()){		
		let removename = "hidestat";
		token_settings = $.grep(token_settings, function(e){
		     return e.name != removename;
		});
	}
	for(let i = 0; i < token_settings.length; i++) {
		let setting = token_settings[i];
		let tokenSettings = tokens.map(t => t.options[setting.name]);
		let uniqueSettings = [...new Set(tokenSettings)];
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}
		let inputWrapper = build_toggle_input(setting.name, setting.label, currentValue, setting.enabledDescription, setting.disabledDescription, function(name, newValue) {
			console.log(`${name} setting is now ${newValue}`);
			tokens.forEach(token => {
				token.options[name] = newValue;
				token.place_sync_persist();
			});
		});
		body.append(inputWrapper);
	}

	let resetToDefaults = $(`<button class='token-image-modal-remove-all-button' title="Reset all token settings back to their default values." style="width:100%;padding:8px;margin:10px 0px;">Reset Token Settings to Defaults</button>`);
	resetToDefaults.on("click", function (clickEvent) {
		for (let i = 0; i < token_settings.length; i++) {
			let setting = token_settings[i];
			let toggle = $(clickEvent.target).parent().find(`button[name=${setting.name}]`);
			toggle.removeClass("rc-switch-checked");
			toggle.removeClass("rc-switch-unknown");
			tokens.forEach(token => token.options[setting.name] = false);
		}
		tokens.forEach(token => token.place_sync_persist());
	});
	body.append(resetToDefaults);
	return body;
}

/**
 * Builds and returns HTML inputs for updating token size
 * @param currentTokenSize {number|string} the current size of the token this input is for
 * @param changeHandler {function} the function to be called when the input changes. This function takes a single {float} variable. EX: function(numberOfSquares) { ... } where numberOfSquares is 1 for medium, 2 for large, etc
 * @returns {*|jQuery|HTMLElement} the jQuery object containing all the input elements
 */
function build_token_size_input(currentTokenSize, changeHandler) {
	let sizeNumber = parseFloat(currentTokenSize); // 0.5, 1, 2, 3, 4, 5, etc
	if (isNaN(sizeNumber)) {
		sizeNumber = 1;
	}

	let upsq = window.CURRENT_SCENE_DATA.upsq;
	if (upsq === undefined || upsq.length === 0) {
		upsq = "ft";
	}

	let customStyle = sizeNumber > 4 ? "display:flex;" : "display:none;"

	let output = $(`
 		<div class="token-image-modal-footer-select-wrapper">
 			<div class="token-image-modal-footer-title">Token Size</div>
 			<select name="data-token-size">
 				<option value="0">Tiny (2.5${upsq})</option>
 				<option value="1">Small/Medium (5${upsq})</option>
 				<option value="2">Large (10${upsq})</option>
 				<option value="3">Huge (15${upsq})</option>
 				<option value="4">Gargantuan (20${upsq})</option>
 				<option value="custom">Custom</option>
 			</select>
 		</div>
 		<div class="token-image-modal-footer-select-wrapper" style="${customStyle}">
 			<div class="token-image-modal-footer-title">Number Of Squares</div>
 			<input type="text" name="data-token-size-custom" placeholder="5" style="width: 3rem;">
 		</div>
 	`);

	let tokenSizeInput = output.find("select");
	let customSizeInput = output.find("input");
	if (sizeNumber > 4) {
		tokenSizeInput.val("custom");
		customSizeInput.val(`${sizeNumber}`);
	} else {
		tokenSizeInput.val(`${sizeNumber}`);
	}

	tokenSizeInput.change(function(changeEvent) {
		let selectInput = $(changeEvent.target);
		let newValue = selectInput.val();
		let customInputWrapper = selectInput.parent().next();
		console.log("tokenSizeInput changed");
		if (newValue === "custom") {
			customInputWrapper.show();
		} else {
			customInputWrapper.hide();
			changeHandler(parseFloat(newValue));
		}
	});

	customSizeInput.change(function(changeEvent) {
		console.log("customSizeInput changed");
		let textInput = $(changeEvent.target);
		let numberOfSquares = parseFloat(textInput.val());
		if (!isNaN(numberOfSquares)) {
			changeHandler(numberOfSquares);
		}
	});

	return output;
}
