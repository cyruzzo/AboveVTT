
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
	settings_panel = $("<div id='settings-panel' class='sidepanel-content'/>");
	settings_panel.hide();
	$(".sidebar__pane-content").append(settings_panel);
	settings_panel.append(`
		<div class='panel-warning'>EXPERIMENTAL FEATURE ( again?!?!) )</div>
		<p>
		This is still alpha. Use at your risk. The next version will include an import/export wizard.
		</p>
		<p>
		Press <button onclick='export_file();'>EXPORT</button> to save to file all your scenes, custom token library and soundpads
		</p>
		<p>
		Press <button onclick='import_openfile();'>IMPORT</button> to import everything from one file. Scenes from that file will be appended to the one that already are in this campaign..
		</p>
		
	<input accept='.abovevtt' id='input_file' type='file' style='display: none' />
	`);
	$("#input_file").change(import_readfile);
	const token_settings = [
		{
			name: 'hidden',
			label: 'Hide'
		},
		{
			name: 'square',
			label: 'Square Token'
		},
		{
			name: 'locked',
			label: 'Lock Token in Position'
		},
		{
			name: 'disablestat',
			label: 'Disable HP/AC'
		},
		{
			name: 'hidestat',
			label: 'Hide HP/AC from players'
		},
		{
			name: 'disableborder',
			label: 'Disable Border'
		},
		{
			name: 'disableaura',
			label: 'Disable Aura'
		},
		{
			name: 'revealname',
			label: 'Show name to players'
		},
	];

	settings_panel.append(`
		<div>
			<h6>Default Options for newly created Monsters</h6>
			<div>
				${token_settings.map(setting => (
					`
						<div>
							<input type='checkbox' name='${setting.name}' ${window.TOKEN_SETTINGS[setting.name] && 'checked'}>
							<label for='${setting.name}' style='display: inline-block;'>${setting.label}<label/>
						</div>
					`
				)).join('')}
			</div>
		</div>
	`);

	const tokenSettingsHandler = (e) => {
		const $el = $(e.target);
		window.TOKEN_SETTINGS[$el.attr('name')] = $el.is(":checked");
		persist_token_settings(window.TOKEN_SETTINGS);
	}
	token_settings.forEach(setting => {
		$(`#settings-panel input[name='${setting.name}']`).change(tokenSettingsHandler);
	});	
}

function persist_token_settings(settings){
	const gameid = $("#message-broker-client").attr("data-gameId");
	localStorage.setItem("TokenSettings" + gameid, JSON.stringify(settings));
}

function export_file(){
	var DataFile={
		version: 1,
		scenes:[],
		soundpads:{},
		tokendata:{},
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
	};
	reader.readAsText($("#input_file").get(0).files[0]);
}
