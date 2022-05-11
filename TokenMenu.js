
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

/**
 * Opens a sidebar modal with token configuration options
 * @param tokenIds {Array<String>} an array of ids for the tokens being configured
 */
function token_context_menu_expanded(tokenIds) {

	if (tokenIds === undefined || tokenIds.length === 0) {
		console.warn(`token_context_menu_expanded was called without any token ids`);
		return;
	}

	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined)

	if (tokens.length === 0) {
		console.warn(`token_context_menu_expanded was called with ids: ${JSON.stringify(tokenIds)}, but no matching tokens could be found`);
		return;
	}

	let sidebar = new SidebarPanel("token_context_menu_expanded");
	display_sidebar_modal(sidebar);
	let body = sidebar.body;
	body.append("<h3 class='token-image-modal-footer-title'>Token Configuration</h3>");


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
		<div class="token-image-modal-url-label-wrapper" style="margin: 10px 0 10px 0">
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


	// options
	body.append("<h3 class='token-image-modal-footer-title' style='margin-top: 30px;'>Options</h3>");
	const token_settings = [
		{ name: "hidden", label: "Hide", enabledDescription:"Token is hidden to players", disabledDescription: "Token is visible to players" },
		{ name: "square", label: "Square Token", enabledDescription:"Token is square", disabledDescription: "Token is round" },
		{ name: "locked", label: "Lock Token in Position", enabledDescription:"Token is not moveable, Players can not select this token", disabledDescription: "Token is moveable by at least the DM, players can select it however" },
		{ name: "restrictPlayerMove", label: "Restrict Player Movement", enabledDescription:"Token is not moveable by players", disabledDescription: "Token is moveable by any player" },
		{ name: "disablestat", label: "Disable HP/AC", enabledDescription:"Token stats are not visible", disabledDescription: "Token stats are visible to at least the DM" },
		{ name: "hidestat", label: "Hide Player HP/AC from players", enabledDescription:"Token stats are hidden from players", disabledDescription: "Token stats are visible to players" },
		{ name: "disableborder", label: "Disable Border", enabledDescription:"Token has no border", disabledDescription: "Token has a random coloured border"  },
		{ name: "disableaura", label: "Disable Health Meter", enabledDescription:"Token has no health glow", disabledDescription: "Token has health glow corresponding with their current health" },
		{ name: "revealname", label: "Show name to players", enabledDescription:"Token on hover name is visible to players", disabledDescription: "Token name is hidden to players" },
		{ name: "legacyaspectratio", label: "Ignore Image Aspect Ratio", enabledDescription:"Token will stretch non-square images to fill the token space", disabledDescription: "Token will respect the aspect ratio of the image provided" },
		{ name: "player_owned", label: "Player access to sheet/stats", enabledDescription:"Tokens' sheet is accessible to players via RMB click on token. If token stats is visible to players, players can modify the hp of the token", disabledDescription: "Tokens' sheet is not accessible to players. Players can't modify token stats"}
	];
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

	let resetToDefaults = $(`<button class='token-image-modal-remove-all-button' title="Reset all token settings back to their default values." style="width:100%;padding:8px;margin:10px 0px 30px 0px;">Reset Token Settings to Defaults</button>`);
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


	// Auras (torch, lantern, etc)
	body.append(build_token_auras_inputs(tokens));

}

/**
 * Builds and returns HTML inputs for updating token auras
 * @param tokens {Array<Token>} the token objects that the aura configuration HTML is for
 * @returns {*|jQuery|HTMLElement}
 */
function build_token_auras_inputs(tokens) {


	let auraVisibleValues = tokens.map(t => t.options.auraVisible);
	let uniqueAuraVisibleValues = [...new Set(auraVisibleValues)];

	let auraIsEnabled = null;
	if (uniqueAuraVisibleValues.length === 1) {
		auraIsEnabled = uniqueAuraVisibleValues[0];
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
	<div>
		<h3 class='token-image-modal-footer-title'>Auras</h3>

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

			<h3 style="margin-bottom:0px;">Inner Aura</h3>
			<div class="token-image-modal-footer-select-wrapper" style="padding-left: 20px">
				<div class="token-image-modal-footer-title">Radius (${upsq})</div>
				<input class="aura-radius" name="aura1" type="text" value="${uniqueAura1Feet}" style="width: 3rem" />
			</div>
			<div class="token-image-modal-footer-select-wrapper" style="padding-left: 20px">
				<div class="token-image-modal-footer-title">Color</div>
				<input class="spectrum" name="aura1Color" value="${uniqueAura1Color}" >
			</div>
			
			<h3 style="margin-bottom:0px;">Outer Aura</h3>
			<div class="token-image-modal-footer-select-wrapper" style="padding-left: 20px">
				<div class="token-image-modal-footer-title">Radius (${upsq})</div>
				<input class="aura-radius" name="aura2" type="text" value="${uniqueAura2Feet}" style="width: 3rem" />
			</div>
			<div class="token-image-modal-footer-select-wrapper" style="padding-left: 20px">
				<div class="token-image-modal-footer-title">Color</div>
				<input class="spectrum" name="aura2Color" value="${uniqueAura1Color}" >
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
		clickoutFiresChange: false
	});
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

	return wrapper;
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
