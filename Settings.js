
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


function init_settings(){
	
	let body = settingsPanel.body;

	body.append(`
		<h5 class="token-image-modal-footer-title">Import / Export</h5>
		<div class="sidebar-panel-header-explanation">
			<p><b>WARNING</b>: The import / export feature is expirimental. Use at your own risk. A future version will include an import/export wizard.</p>
			<p>Export will download a file containing all of your scenes, custom tokens, and soundpads. 
			Import will allow you to upload an exported file. Scenes from that file will be added to the scenes in this campaign.</p>
			<div class="sidebar-panel-footer-horizontal-wrapper">
			<button onclick='import_openfile();' class="sidebar-panel-footer-button sidebar-hovertext" data-hover="Upload a file containing scenes, custom tokens, and soundpads. This will not overwrite your existing scenes. Any scenes found in the uploaded file will be added to your current list scenes">IMPORT</button>
			<button onclick='export_file();' class="sidebar-panel-footer-button sidebar-hovertext" data-hover="Download a file containing all of your scenes, custom tokens, and soundpads">EXPORT</button>
				<input accept='.abovevtt' id='input_file' type='file' style='display: none' />
			<div>
		</div>
	`);
	$("#input_file").change(import_readfile);
	
	body.append(`
		<br />
		<h5 class="token-image-modal-footer-title">Default Options when placing tokens</h5>
		<div class="sidebar-panel-header-explanation">Every time you place a token on the scene, these settings will be used. Custom tokens allow you to override these settings on a per-token basis.</div>
	`);

	const token_settings = [
		{
			name: 'hidden',
			label: 'Hide',
			enabledDescription: 'New tokens will be hidden from players when placed on the scene',
			disabledDescription: 'New tokens will be visible to players when placed on the scene'
		},
		{
			name: 'square',
			label: 'Square Token',
			enabledDescription: 'New tokens will be square',
			disabledDescription: 'New tokens will be round'
		},
		{
			name: 'locked',
			label: 'Lock Token in Position',
			enabledDescription: 'New tokens will not be movable',
			disabledDescription: 'New tokens will be movable'
		},
		{
			name: 'disablestat',
			label: 'Disable HP/AC',
			enabledDescription: 'New tokens will not have HP/AC shown to either the DM or the players. This is most useful for tokens that represent terrain, vehicles, etc.',
			disabledDescription: 'New tokens will have HP/AC shown to only the DM.'
		},
		{
			name: 'hidestat',
			label: 'Hide HP/AC from players',
			enabledDescription: "New player tokens will have their HP/AC hidden from other players. Each player will be able to see their own HP/AC, but won't be able to see the HP/AC of other players.",
			disabledDescription: "New player tokens will have their HP/AC visible to other players. Each player will be able to see their own HP/AC as well as HP/AC of other players."
		},
		{
			name: 'disableborder',
			label: 'Disable Border',
			enabledDescription: 'New tokens will not have a border around them',
			disabledDescription: 'New tokens will have a border around them'
		},
		{
			name: 'disableaura',
			label: 'Disable Aura',
			enabledDescription: 'New tokens will not have an aura around them that represents their current health',
			disabledDescription: 'New tokens will have an aura around them that represents their current health'
		},
		{
			name: 'revealname',
			label: 'Show name to players',
			enabledDescription: 'New tokens will have their name visible to players',
			disabledDescription: 'New tokens will have their name hidden from players'
		},
		{
			name: 'legacyaspectratio',
			label: 'Ignore Image Aspect Ratio',
			enabledDescription: 'New tokens will stretch non-square images to fill the token space',
			disabledDescription: 'New tokens will respect the aspect ratio of the image provided'
		}
	];

	for(let i = 0; i < token_settings.length; i++) {
		let setting = token_settings[i];
		let currentValue = window.TOKEN_SETTINGS[setting.name];
		let inputWrapper = settingsPanel.build_toggle_input(setting.name, setting.label, currentValue, setting.enabledDescription, setting.disabledDescription, function(name, newValue) {
			console.log(`${name} setting is now ${newValue}`);
			window.TOKEN_SETTINGS[name] = newValue;
			persist_token_settings(window.TOKEN_SETTINGS);
			redraw_settings_panel_token_examples();
		});
		body.append(inputWrapper);
	}

	// Build example tokens to show the settings changes
	body.append(`<div class="token-image-modal-footer-title">Example Tokens</div>`);
	let tokenExamplesWrapper = $(`<div class="example-tokens-wrapper"></div>`);
	// not square image to show aspect ratio
	let example1 = build_custom_token_item("example 1", "https://www.dndbeyond.com/avatars/thumbnails/6/359/420/618/636272697874197438.png", 1, -1);
	example1.draggable('disable');
	tokenExamplesWrapper.append(example1);
	// perectly square image
	let example2 = build_custom_token_item("example 2", "https://www.dndbeyond.com/avatars/8/441/636306375308314493.jpeg", 1, -1);
	example2.draggable("disable");
	tokenExamplesWrapper.append(example2);
	// idk, something else I guess
	let example3 = build_custom_token_item("example 3", "https://i.imgur.com/2Lglcip.png", 1, -1);
	example3.draggable("disable");
	tokenExamplesWrapper.append(example3);
	body.append(tokenExamplesWrapper);

	let resetToDefaults = $(`<button class="token-image-modal-remove-all-button" title="Reset all token settings back to their default values." style="width:100%;padding:8px;margin:10px 0px 30px 0px;">Reset Token Settings to Defaults</button>`);
	resetToDefaults.click(function () {
		for (let i = 0; i < token_settings.length; i++) {
			let setting = token_settings[i];
			let toggle = body.find(`button[name=${setting.name}]`);
			if (toggle.hasClass("rc-switch-checked")) {
				toggle.click();
			}
			window.TOKEN_SETTINGS[setting.name] = false;
		}
		persist_token_settings(window.TOKEN_SETTINGS);
		redraw_settings_panel_token_examples();
	});
	body.append(resetToDefaults);


	const experimental_features = [
		// {
		// 	name: 'test',
		// 	label: 'Test One',
		// 	enabledDescription: 'You are testing this feature',
		// 	disabledDescription: 'Testing this feature means, you will see x, y, and z instead of a, b, and c.'
		// }
	];
	if (experimental_features.length > 0) {
		body.append(`
			<br />
			<h5 class="token-image-modal-footer-title">Experimental Features</h5>
			<div class="sidebar-panel-header-explanation">These are experimental features. You must explicitly opt-in to them. Use at your own risk.</div>
		`);
		const experimental_features = [
			// {
			// 	name: 'test',
			// 	label: 'Test One',
			// 	enabledDescription: 'You are testing this feature',
			// 	disabledDescription: 'Testing this feature means, you will see x, y, and z instead of a, b, and c.'
			// }
		];
		for(let i = 0; i < experimental_features.length; i++) {
			let setting = experimental_features[i];
			let currentValue = window.TOKEN_SETTINGS[setting.name];
			let inputWrapper = settingsPanel.build_toggle_input(setting.name, setting.label, currentValue, setting.enabledDescription, setting.disabledDescription, function(name, newValue) {
				console.log(`${name} setting is now ${newValue}`);
				// TODO: store this setting somewhere?
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
	}

	redraw_settings_panel_token_examples();
}

function redraw_settings_panel_token_examples() {
	
	let items = settingsPanel.body.find(".example-tokens-wrapper .custom-token-image-item");
	items.css("margin", "auto");
	items.css("width", "30%");

	if (window.TOKEN_SETTINGS['hidden']) {
		items.css("opacity", 0.5); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
	} else {
		items.css("opacity", 1);
	}

	if (window.TOKEN_SETTINGS['square']) {
		items.find("img").removeClass("token-round");
	} else {
		items.find("img").addClass("token-round");
	}

	if (window.TOKEN_SETTINGS['locked']) {
		// nothing to show here?
	} else {
		// nothing to show here?
	}

	if (window.TOKEN_SETTINGS['disablestat']) {
		items.find(".hpbar").remove();
		items.find(".ac").remove();
	} else if (window.CURRENT_SCENE_DATA !== undefined && window.CURRENT_SCENE_DATA.hpps !== undefined) {
		items.find(".hpbar").remove();
		items.find(".ac").remove();

		// only do this if we've loaded scene data. Otherwise this breaks because it tries to do math on undefined
		let tok = new Token(default_options());
		tok.options.size = items.width();
		tok.options.max_hp = 10;
		tok.options.hp = 10;
		tok.options.ac = 10;
		let hp = tok.build_hp();
		items.append(hp);
		let ac = tok.build_ac();
		items.append(ac);
	}

	if (window.TOKEN_SETTINGS['hidestat']) {
		// anything to show here? This only affects players
	} else {
		// anything to show here? This only affects players
	}

	if (window.TOKEN_SETTINGS['disableborder']) {
		items.find("img").css("border", "0px solid #000")
	} else {
		items.find("img").css("border", "4px solid #000")
	}

	if (window.TOKEN_SETTINGS['disableaura']) {
		items.find("img").css("box-shadow", "");
		items.find("img").css("transform", `scale(1)`);
	} else {
		items.find("img").css("box-shadow", "rgb(5 255 0 / 80%) 0px 0px 7px 7px");
		items.find("img").css("transform", `scale(0.88)`); // close enough
	}

	if (window.TOKEN_SETTINGS['revealname']) {
		// this messes with the size of the example tokens, and we can't use the `VTTToken` class because otherwise the scene will think it's a real token
		// so for now, do nothing, and revisit this in the future
		// items.addClass('hasTooltip');
	} else {
		// items.removeClass('hasTooltip');
	}

	if (window.TOKEN_SETTINGS['legacyaspectratio']) {
		items.find("img").removeClass("preserve-aspect-ratio");
	} else {
		items.find("img").addClass("preserve-aspect-ratio");
	}
}

function persist_token_settings(settings){
	const gameid = $("#message-broker-client").attr("data-gameId");
	localStorage.setItem("TokenSettings" + gameid, JSON.stringify(settings));
}

function export_file(){
	var DataFile={
		version: 2,
		scenes:[],
		soundpads:{},
		tokendata:{},
		notes:{},
		journalchapters:[],
		};
	for(i=0;i<window.ScenesHandler.scenes.length;i++){
		// CHECK IF THE MAP IS FROM DNDBEYOND
		var scene=Object.assign({}, window.ScenesHandler.scenes[i]);
		console.log(scene);
		/*if(scene.player_map.includes("media-waterdeep.cursecdn.com/") && uuid!=""){
			scene.player_map="##UUID##";
		}
		if(scene.dm_map.includes("media-waterdeep.cursecdn.com/") && uuid!=""){
			scene.dm_map="##UUID##";
		}*/ 
		DataFile.scenes.push(scene);
	}
	DataFile.tokendata=Object.assign({}, tokendata);
	var tmp=DataFile.tokendata.folders['AboveVTT BUILTIN'];
	delete DataFile.tokendata.folders['AboveVTT BUILTIN'];
	DataFile.tokendata.folders['AboveVTT BUILTIN']=tmp;
	
	DataFile.notes=window.JOURNAL.notes;
	DataFile.journalchapters=window.JOURNAL.chapters;
	
	DataFile.soundpads=window.SOUNDPADS;
	download(b64EncodeUnicode(JSON.stringify(DataFile,null,"\t")),"DataFile.abovevtt","text/plain");
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
		for(i=0;i<DataFile.scenes.length;i++){
			window.ScenesHandler.scenes.push(DataFile.scenes[i]);
		}
		for(k in DataFile.soundpads){
			window.SOUNDPADS[k]=DataFile.soundpads[k];
		}
		$("#sounds-panel").remove(); init_audio();
		persist_soundpad();
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
		$("#token-panel").remove(); init_tokenmenu();
		
		alert('Loading completed. Data merged');
		
		if(DataFile.notes){
			window.JOURNAL.notes=DataFile.notes;
			window.JOURNAL.chapters=DataFile.journalchapters;
			window.JOURNAL.persist();
			window.JOURNAL.build_journal();
		}
		
		
	};
	reader.readAsText($("#input_file").get(0).files[0]);
}
