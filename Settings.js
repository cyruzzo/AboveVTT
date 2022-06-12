const token_setting_options = [
	{
		name: 'tokenStyleSelect',
		type: 'dropdown',
		label: 'Token Style',
		options: [
			$(`<option value='1'>Circle</option>`), 
			$(`<option value='2'>Square</option>`), 
			$(`<option value='3'>No Constraint</option>`), 
			$(`<option value='4'>Virtual Mini Circle</option>`), 
			$(`<option value='5'>Virtual Mini Square</option>`)
 		]
	},
	{
		name: 'tokenBaseStyleSelect',
		type: 'dropdown',
		label: 'Token Base Style',
		options: [
			$(`<option value='1'>Default</option>`), 
			$(`<option value='2'>Grass</option>`), 
			$(`<option value='3'>Tile</option>`), 
			$(`<option value='4'>Sand</option>`), 
			$(`<option value='5'>Rock</option>`),
			$(`<option value='6'>Water</option>`)
 		]
	},
	{
		name: 'hidden',
		label: 'Hide',
		enabledDescription: 'The token is hidden to players.',
		disabledDescription: 'The token is visible to players.',
		enabledValue: 'Hidden',
		disabledValue: 'Visible'
	},     
	{
		name: 'square',
		label: 'Square Token',
		enabledDescription: 'The token is square.',
		disabledDescription: 'The token is clipped to fit within a circle.',
		enabledValue: 'Square',
		disabledValue: 'Round'
	},
	{
		name: 'locked',
		label: 'Disable All Interaction',
		enabledDescription: "The token can not be interacted with in any way. Not movable, not selectable by players, no hp/ac displayed, no border displayed, no nothing. Players shouldn't even know it's a token.",
		disabledDescription: 'The token can be interacted with.',
		enabledValue: 'Interaction Disabled',
		disabledValue: 'Interaction Allowed'
	},
	{
		name: 'restrictPlayerMove',
		label: 'Restrict Player Movement',
		enabledDescription: 'Players can not move the token.',
		disabledDescription: 'Players can move the token.',
		enabledValue: 'Restricted',
		disabledValue: 'Unrestricted'
	},
	{
		name: 'disablestat',
		label: 'Remove HP/AC',
		enabledDescription: 'The token does not have HP/AC shown to either the DM or the players.',
		disabledDescription: 'The token has HP/AC shown to only the DM.',
		enabledValue: 'Removed',
		disabledValue: 'Visible to DM'
	},
	{
		name: 'hidestat',
		label: 'Hide Player HP/AC',
		enabledDescription: "Each player can see their own HP/AC, but can't see the HP/AC of other players.",
		disabledDescription: "Each player can see their own HP/AC as well as the HP/AC of other players.",
		enabledValue: 'Hidden',
		disabledValue: 'Visible'
	},
	{
		name: 'hidehpbar',
		label: 'Only show HP values on hover',
		enabledDescription: "HP values are only shown when you hover or select the token. The 'Disable HP/AC' option overrides this one.",
		disabledDescription: "HP values are always displayed on the token. The 'Disable HP/AC' option overrides this one.",
		enabledValue: 'On Hover',
		disabledValue: 'Always'
	},
	{
		name: 'disableborder',
		label: 'Disable Border',
		enabledDescription: 'The token has a border drawn around the image.',
		disabledDescription: 'The token does not have a border drawn around the image.',
		enabledValue: 'No Border',
		disabledValue: 'Border'
	},
	{
		name: 'disableaura',
		label: 'Disable Health Aura',
		enabledDescription: "An aura is drawn around the token's image that represents current health.",
		disabledDescription: "Enable this to have an aura drawn around the token's image that represents current health.",
		enabledValue: 'No Aura',
		disabledValue: 'Health Aura'
	},
	{
		name: 'enablepercenthpbar',
		label: 'Enable Token HP% Bar',
		enabledDescription: 'The token has a traditional visual hp% bar below it',
		disabledDescription: 'The token does not have a traditional visual hp% bar below it',
		enabledValue: 'Health Bar',
		disabledValue: 'No Bar'
	},
	{
		name: 'revealname',
		label: 'Show name to players',
		enabledDescription: "The token's name is visible to players",
		disabledDescription: "The token's name is hidden from players",
		enabledValue: 'Visible',
		disabledValue: 'Hidden'
	},
	{
		name: 'legacyaspectratio',
		label: 'Ignore Image Aspect Ratio',
		enabledDescription: "The token's image will stretch to fill the token space",
		disabledDescription: "New token's image will respect the aspect ratio of the image provided",
		enabledValue: 'Stretch',
		disabledValue: 'Maintain'
	},
	{
		name: "player_owned",
		label: "Player Accessible Stats",
		enabledDescription: "The token's stat block is accessible to players via the token context menu. Players can also alter the HP/AC of this token.",
		disabledDescription: "The token's stat block is not accessible to players via the token context menu. Players can not alter the HP/AC of this token.",
		enabledValue: 'Player & DM',
		disabledValue: 'DM only'
	}

];

function b64EncodeUnicode(str) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    }

function b64DecodeUnicode(str) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
    


function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}


function cloud_migration(scenedata=null){
	let http_api_gw="https://services.abovevtt.net";
	let searchParams = new URLSearchParams(window.location.search);
	if(searchParams.has("dev")){
		http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
	}
	let gameid = find_game_id();

	if(scenedata==null)
		scenedata=localStorage.getItem("ScenesHandler"+gameid);
	$.ajax({
		url:http_api_gw+"/services?action=migrate&campaign="+window.CAMPAIGN_SECRET,
		type:"POST",
		contentType:'application/json',
		data: scenedata,
		success:function(data){
			localStorage.setItem("Migrated"+gameid,"1");
			alert("Migration (hopefully) completed. You need to Re-Join AboveVTT");
			location.reload();
		}
	});
}

function init_settings(){
	
	let body = settingsPanel.body;

	
	if((!window.CLOUD) && (!window.FORCED_DM)){
		body.append(`
		<h5 class="token-image-modal-footer-title">MIGRATE YOUR SCENES TO THE CLOUD</h5>
		<div class="sidebar-panel-header-explanation">
			<p>Your data is currently stored on your browser's cache. Press migrate to move your data into the AboveVTT cloud (<b>WARNING. YOU RISK LOOSING YOU DATA</b>) </p>
			<button onclick='cloud_migration();' class="sidebar-panel-footer-button sidebar-hover-text" data-hover="This will migrate your data to the cloud. Be careful or you may loose your scenes">MIGRATE</button>
		</div>
		`)
	}
	else if(window.CLOUD){
		body.append('<b>Your scenes are stored in the "cloud"</b>');
	}

	body.append(`
		<h5 class="token-image-modal-footer-title">Import / Export</h5>
		<div class="sidebar-panel-header-explanation">
			<p><b>WARNING</b>: The import / export feature is expirimental. Use at your own risk. A future version will include an import/export wizard.</p>
			<p>Export will download a file containing all of your scenes, custom tokens, and soundpads. 
			Import will allow you to upload an exported file. Scenes from that file will be added to the scenes in this campaign.</p>
			<div class="sidebar-panel-footer-horizontal-wrapper">
			<button onclick='import_openfile();' class="sidebar-panel-footer-button sidebar-hover-text" data-hover="Upload a file containing scenes, custom tokens, and soundpads. This will not overwrite your existing scenes. Any scenes found in the uploaded file will be added to your current list scenes">IMPORT</button>
			<button onclick='export_file();' class="sidebar-panel-footer-button sidebar-hover-text" data-hover="Download a file containing all of your scenes, custom tokens, and soundpads">EXPORT</button>
				<input accept='.abovevtt' id='input_file' type='file' style='display: none' />
		</div>
	`);

	$("#input_file").change(import_readfile);

	body.append(`
		<br />
		<h5 class="token-image-modal-footer-title">Default Options when placing tokens</h5>
		<div class="sidebar-panel-header-explanation">Every time you place a token on the scene, these settings will be used. You can override these settings on a per-token basis by clicking the gear on a specific token row in the tokens tab.</div>
	`);

	let tokenOptionsButton = $(`<button class="sidebar-panel-footer-button">Change The Default Token Options</button>`);
	tokenOptionsButton.on("click", function (clickEvent) {
		build_and_display_sidebar_flyout(clickEvent.clientY, function (flyout) {
			let optionsContainer = build_sidebar_token_options_flyout(token_setting_options, window.TOKEN_SETTINGS, TOKEN_OPTIONS_INPUT_TYPE_TOGGLE, function (name, value) {
				if (value === true || value === false || typeof value === 'string') {
					window.TOKEN_SETTINGS[name] = value;
				} else {
					delete window.TOKEN_SETTINGS[name];
				}
			}, function() {
				persist_token_settings(window.TOKEN_SETTINGS);
				redraw_settings_panel_token_examples();
			});
			optionsContainer.prepend(`<div class="sidebar-panel-header-explanation">Every time you place a token on the scene, these settings will be used. You can override these settings on a per-token basis by clicking the gear on a specific token row in the tokens tab.</div>`);
			flyout.append(optionsContainer);
			position_flyout_left_of(body, flyout);
		});
	});
	body.append(tokenOptionsButton);
	body.append(`<br />`);

	const experimental_features = [
		{
			name: 'DEBUGddbDiceMonsterPanel',
			label: 'Debug Monsters Tab Loading',
			enabledDescription: "All of the loading indicators will be transparent, and the monsters tab will be selected by default. This is to allow developers to visually see what is happening while debugging. (Changing this requires a page reload)",
			disabledDescription: "If you are not a developer, please ignore this feature. It is to allow developers to visually see what is happening in the monsters panel while debugging. (Changing this requires a page reload)",
			dmOnly: true
		}
	];
	
	experimental_features.push({
		name: 'streamDiceRolls',
		label: 'Stream Dice Rolls',
		enabledDescription: `You and your players can find the button to join the dice stream in the game log in the top right corner. Disclaimer: the dice will start small then grow to normal size after a few rolls. They will be contained to the smaller of your window or the sending screen size.`,
		disabledDescription: `This will enable the dice stream feature for everyone. You will all still have to join the dice stream. You and your players can find the button to do this in the game log in the top right corner once this feature is enabled. Disclaimer: the dice will start small then grow to normal size after a few rolls. They will be contained to the smaller of your window or the sending screen size.`
	});
	body.append(`
		<br />
		<h5 class="token-image-modal-footer-title">Experimental Features</h5>
		<div class="sidebar-panel-header-explanation">These are experimental features. You must explicitly opt-in to them. Use at your own risk.</div>
	`);
	for(let i = 0; i < experimental_features.length; i++) {
		let setting = experimental_features[i];
		if (setting.dmOnly === true && !window.DM) {
			continue;
		}
		let currentValue = window.EXPERIMENTAL_SETTINGS[setting.name];
		if (currentValue === undefined && setting.defaultValue !== undefined) {
			currentValue = setting.defaultValue;
		}
		let inputWrapper = build_toggle_input(setting.name, setting.label, currentValue, setting.enabledDescription, setting.disabledDescription, function(name, newValue) {
			console.log(`experimental setting ${name} is now ${newValue}`);
			if (name === "streamDiceRolls") {
				enable_dice_streaming_feature(newValue);
				if(newValue == true) {
					window.MB.sendMessage("custom/myVTT/enabledicestreamingfeature");
				} else {
					window.MB.sendMessage("custom/myVTT/disabledicestream");
				}
			} else {
				window.EXPERIMENTAL_SETTINGS[setting.name] = newValue;
				persist_experimental_settings(window.EXPERIMENTAL_SETTINGS);
			}
		});
		body.append(inputWrapper);
	}
	let optOutOfAll = $(`<button class="token-image-modal-remove-all-button" title="Opt out of all expirimental features." style="width:100%;padding:8px;margin:10px 0px 30px 0px;">Opt out of all</button>`);
	optOutOfAll.click(function () {
		for (let i = 0; i < experimental_features.length; i++) {
			let setting = experimental_features[i];
			let toggle = body.find(`button[name=${setting.name}]`);
			if (toggle.hasClass("rc-switch-checked")) {
				toggle.click();
			}
		}
	});
	body.append(optOutOfAll);

	redraw_settings_panel_token_examples();
}

function redraw_settings_panel_token_examples(settings) {
	let mergedSettings = {...window.TOKEN_SETTINGS};
	if (settings !== undefined) {
		mergedSettings = {...mergedSettings, ...settings};
	}
	delete mergedSettings.imageSize;
	let items = $(".example-tokens-wrapper .example-token");
	for (let i = 0; i < items.length; i++) {
		let item = $(items[i]);
		mergedSettings.imgsrc = item.find("img.token-image").attr("src");
		item.replaceWith(build_example_token(mergedSettings));
	}
}

function build_example_token(options) {
	let mergedOptions = {...default_options(), ...window.TOKEN_SETTINGS, ...options};
	mergedOptions.hp = 10;
	mergedOptions.max_hp = 10;
	mergedOptions.id = `exampleToken-${uuid()}`;
	mergedOptions.size = 100;
	mergedOptions.ac = 10;

	// TODO: this is horribly inneficient. Clean up token.place and then update this
	let token = new Token(mergedOptions);
	token.place(0);
	let html = $(`#tokens div[data-id='${mergedOptions.id}']`).clone();
	token.delete();

	html.addClass("example-token");
	html.css({
		float: "left",
		width: "33%",
		position: "relative",
		opacity: 1,
		top: 0,
		left: 0
	});
	return html;
}

const TOKEN_OPTIONS_INPUT_TYPE_TOGGLE = "toggle";
const TOKEN_OPTIONS_INPUT_TYPE_SELECT = "select";
const TOKEN_OPTIONS_INPUT_TYPE_DROPDOWN = "dropdown";
// used for settings tab, and tokens tab configuration modals. For placed tokens, see `build_options_flyout_menu`
// updateValue: function(name, newValue) {} // only update the data here
// didChange: function() {} // do ui things here
function build_sidebar_token_options_flyout(availableOptions, setValues, inputType, updateValue, didChange) {
	const validInputTypes = [TOKEN_OPTIONS_INPUT_TYPE_TOGGLE, TOKEN_OPTIONS_INPUT_TYPE_SELECT];
	if (!validInputTypes.includes(inputType)) {
		console.error("build_sidebar_token_options_flyout received the wrong inputType. Expected one of", validInputTypes, "but received", inputType);
		return;
	}
	let container = $(`<div class="sidebar-token-options-flyout-container prevent-sidebar-modal-close"></div>`);
	availableOptions.forEach(option => {
		const currentValue = setValues[option.name];
		if(option.type == "dropdown"){
			let inputWrapper = build_dropdown_input(option.name, option.label, currentValue, option.options, function(name, newValue) {
				updateValue(name, newValue);
				if (didChange) {
					didChange();
				}
			});
			
			container.append(inputWrapper);
		
		}
		else if (inputType === TOKEN_OPTIONS_INPUT_TYPE_TOGGLE) {
			let inputWrapper = build_toggle_input(option.name, option.label, currentValue, option.enabledDescription, option.disabledDescription, function (n, v) {
				updateValue(n, v);
				if (didChange) {
					didChange();
				}
			});
			container.append(inputWrapper)
		} else if (inputType === TOKEN_OPTIONS_INPUT_TYPE_SELECT) {
			let inputWrapper = build_token_option_select_input(option, currentValue, function (n, v) {
				updateValue(n, v);
				if (didChange) {
					didChange();
				}
			});
			container.append(inputWrapper)
		}
	});


	// Build example tokens to show the settings changes
	container.append(`<h5 class="token-image-modal-footer-title" style="margin-top:15px;">Example Tokens</h5>`);
	let tokenExamplesWrapper = $(`<div class="example-tokens-wrapper"></div>`);
	container.append(tokenExamplesWrapper);
	// not square image to show aspect ratio
	tokenExamplesWrapper.append(build_example_token({imgsrc: "https://www.dndbeyond.com/avatars/thumbnails/6/359/420/618/636272697874197438.png"}));
	// perfectly square image
	tokenExamplesWrapper.append(build_example_token({imgsrc: "https://www.dndbeyond.com/avatars/8/441/636306375308314493.jpeg"}));
	// idk, something else I guess
	tokenExamplesWrapper.append(build_example_token({imgsrc: "https://i.imgur.com/2Lglcip.png"}));

	let resetToDefaults = $(`<button class='token-image-modal-remove-all-button' title="Reset all token settings back to their default values." style="width:100%;padding:8px;margin:10px 0px;">Reset Token Settings to Defaults</button>`);
	resetToDefaults.on("click", function (clickEvent) {
		if (inputType === TOKEN_OPTIONS_INPUT_TYPE_TOGGLE) {
			$(clickEvent.currentTarget)
				.closest(".sidebar-token-options-flyout-container")
				.find(".rc-switch")
				.removeClass("rc-switch-checked")
				.removeClass("rc-switch-unknown");
		} else if (inputType === TOKEN_OPTIONS_INPUT_TYPE_SELECT) {
			$(clickEvent.currentTarget)
				.closest(".sidebar-token-options-flyout-container")
				.find("select")
				.val("default");
		}
		availableOptions.forEach(option => updateValue(option.name, undefined));
		if (didChange) {
			didChange();
		}
	});
	container.append(resetToDefaults);

	observe_hover_text(container);

	return container;
}

function enable_dice_streaming_feature(enabled){
	if(enabled)
	{
		if($(".stream-dice-button").length>0)
			return;
		$(".glc-game-log>[class*='Container-Flex']").append($(`<div  id="stream_dice"><div class='stream-dice-button'>Dice Stream Disabled</div></div>`));
		$(".stream-dice-button").off().on("click", function(){
			if(window.JOINTHEDICESTREAM){
				update_dice_streaming_feature(false);
			}
			else {
				update_dice_streaming_feature(true);
			}
		})
	}
	else{
		$(".stream-dice-button").remove();
		window.JOINTHEDICESTREAM = false;
		$("[id^='streamer-']").remove();
		for (let peer in window.STREAMPEERS) {
			window.STREAMPEERS[peer].close();
			delete window.STREAMPEERS[peer]
		}
	}
}

function update_dice_streaming_feature(enabled, sendToText=gamelog_send_to_text()) {		

	if (enabled == true) {
		// STREAMING STUFF
		window.JOINTHEDICESTREAM = true;
		$('.stream-dice-button').html("Dice Stream Enabled");
		$('.stream-dice-button').toggleClass("enabled", true);
		$("[role='presentation'] [role='menuitem']").each(function(){
			$(this).off().on("click", function(){
				if($(this).text() == "Everyone") {
					window.MB.sendMessage("custom/myVTT/revealmydicestream",{
						streamid: window.MYSTREAMID
					});		
				}
				else if($(this).text() == "Dungeon Master"){
					window.MB.sendMessage("custom/myVTT/showonlytodmdicestream",{
						streamid: window.MYSTREAMID
					});
				}
				else{
					window.MB.sendMessage("custom/myVTT/hidemydicestream",{
						streamid: window.MYSTREAMID
					});
				}
			});
		});


		// DICE STREAMING ?!?!
		let diceRollPanel = $(".dice-rolling-panel__container");
		if (diceRollPanel.length > 0) {
			window.MYMEDIASTREAM = diceRollPanel[0].captureStream(30);
		}
		if (window.JOINTHEDICESTREAM) {
			
			for (let i in window.STREAMPEERS) {
				console.log("replacing the track")
				window.STREAMPEERS[i].getSenders()[0].replaceTrack(window.MYMEDIASTREAM.getVideoTracks()[0]);
			}
			setTimeout(function(){
				if(sendToText == "Dungeon Master"){
					window.MB.sendMessage("custom/myVTT/showonlytodmdicestream",{
						streamid: window.MYSTREAMID
					});
				}
				else{
					window.MB.sendMessage("custom/myVTT/hidemydicestream",{
						streamid: window.MYSTREAMID
					});
				}		
			}, 1000)
			setTimeout(function(){
				window.MB.sendMessage("custom/myVTT/wannaseemydicecollection", {
					from: window.MYSTREAMID
				})
			}, 500);
		} 
	}
	else {
		$(`.stream-dice-button`).html("Dice Stream Disabled");
		window.JOINTHEDICESTREAM = false;
		$('.stream-dice-button').toggleClass("enabled", false);
		$("[id^='streamer-']").remove();
		window.MB.sendMessage("custom/myVTT/turnoffsingledicestream", {
			to: "everyone",
			from: window.MYSTREAMID
		})
		for (let peer in window.STREAMPEERS) {
			window.STREAMPEERS[peer].close();
			delete window.STREAMPEERS[peer]
		}
	}

}

function persist_token_settings(settings){
	const gameid = find_game_id();
	localStorage.setItem("TokenSettings" + gameid, JSON.stringify(settings));
}


function persist_experimental_settings(settings) {
	const gameid = find_game_id();
	localStorage.setItem("ExperimentalSettings" + gameid, JSON.stringify(settings));
}

function export_scenes(callback){
	if(window.CLOUD){
		let http_api_gw="https://services.abovevtt.net";
		let searchParams = new URLSearchParams(window.location.search);
		if(searchParams.has("dev")){
			http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
		}

		$.ajax({
			url:http_api_gw+"/services?action=export_scenes&campaign="+window.CAMPAIGN_SECRET,
			success: function(data){
				callback(JSON.parse(data))
			}
		})
	}
	else{
		let scenes=[];
		for(i=0;i<window.ScenesHandler.scenes.length;i++){
			var scene=Object.assign({}, window.ScenesHandler.scenes[i]);
			scenes.push(scene);
		}
		callback(scenes);
	}
}

function export_file(){
	let DataFile={
		version: 2,
		scenes:[],
		soundpads:{},
		tokendata:{},
		notes:{},
		journalchapters:[],
		};
	
	export_scenes(
		(scenes)=>{
			DataFile.scenes=scenes;

			DataFile.tokendata=Object.assign({}, tokendata);
			var tmp=DataFile.tokendata.folders['AboveVTT BUILTIN'];
			delete DataFile.tokendata.folders['AboveVTT BUILTIN'];
			DataFile.tokendata.folders['AboveVTT BUILTIN']=tmp;
			DataFile.mytokens=mytokens;
			DataFile.mytokensfolders=mytokensfolders;
			DataFile.notes=window.JOURNAL.notes;
			DataFile.journalchapters=window.JOURNAL.chapters;	
			DataFile.soundpads=window.SOUNDPADS;
			download(b64EncodeUnicode(JSON.stringify(DataFile,null,"\t")),"DataFile.abovevtt","text/plain");
		}
	);

};

function import_openfile(){
	$("#input_file").trigger("click");
}

function import_readfile() {
	var reader = new FileReader();
	reader.onload = function() {
		// DECODE
		var DataFile=null;
		try{
			var DataFile=$.parseJSON(b64DecodeUnicode(reader.result));
		}
		catch{
			
		}
		if(!DataFile){ // pre version 2
			var DataFile=$.parseJSON(atob(reader.result));
		}
		
		console.log(DataFile);
		
		
		for(k in DataFile.soundpads){
			window.SOUNDPADS[k]=DataFile.soundpads[k];
		}
		$("#sounds-panel").remove(); init_audio();
		persist_soundpad();

		if (DataFile.mytokens !== undefined) {
			mytokens = DataFile.mytokens;
		}
		if (DataFile.mytokensfolders !== undefined) {
			mytokensfolders = DataFile.mytokensfolders;
		}
		did_change_mytokens_items();

		for(k in DataFile.tokendata.folders){
			tokendata.folders[k]=DataFile.tokendata.folders[k];
		}
		if(!tokendata.tokens){
			tokendata.tokens={};
		}
		for(k in DataFile.tokendata.tokens){
			tokendata.tokens[k]=DataFile.tokendata.tokens[k];
		}
		persist_customtokens();

		alert('Loading completed. Data merged');
		
		if(DataFile.notes){
			window.JOURNAL.notes=DataFile.notes;
			window.JOURNAL.chapters=DataFile.journalchapters;
			window.JOURNAL.persist();
			window.JOURNAL.build_journal();
		}


		if(window.CLOUD){
			cloud_migration(JSON.stringify(DataFile.scenes));
		}
		else{
			for(i=0;i<DataFile.scenes.length;i++){
				window.ScenesHandler.scenes.push(DataFile.scenes[i]);
			}
		}
	};
	reader.readAsText($("#input_file").get(0).files[0]);
}
