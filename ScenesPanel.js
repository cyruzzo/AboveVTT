
function consider_upscaling(target){
		if(target.hpps < 60 && target.hpps > 25  && target.vpps < 60 && target.vpps > 25){
			target.scale_factor=2;
		}
		else if(target.hpps <=25 || target.vpps <=25){
			target.scale_factor=4;
		}
		else{
			target.scale_factor=1;
		}
}



function handle_basic_form_toggle_click(event){
	if ($(event.currentTarget).hasClass("rc-switch-checked")) {
		// it was checked. now it is no longer checked
		$(event.currentTarget).removeClass("rc-switch-checked");
	  } else {
		// it was not checked. now it is checked
		$(event.currentTarget).removeClass("rc-switch-unknown");
		$(event.currentTarget).addClass("rc-switch-checked");
	  }
}

function handle_map_toggle_click(event){
	handle_basic_form_toggle_click(event)
	// validate image input expects the target to be the input not the t oggle

	//validate_image_input($(event.currentTarget).prev().find("input")[0])
}


async function get_edit_form_data(){
	// bain todo, call image validation here and stop if it's not valid
	let data = {}
	let promises = [];
	
	$("#edit_scene_form").find("input, button.rc-switch").each(function(index) {	
		promises.push(new Promise(async (resolve, reject) => {
			const inputName = $(this).attr('name');
			if(inputName == undefined)
				return resolve();
			let inputValue = $(this).val();

			if ( ((inputName === 'player_map') || (inputName==='dm_map')) ) {
				inputValue = await parse_img(inputValue);
			}
			else if ($(this).is("button")){
				inputValue = $(this).hasClass("rc-switch-checked") ? "1" : "0"
			}
			
			data[inputName] = await inputValue;
			resolve();
		}))
	})
	
	await Promise.all(promises);
	return data;
	
}

async function validate_image_input(element){
		const self = element

		$(`#${self.name}_validator`).remove()
		// no value so can't validate, return early
		if (self.value?.length === 0) return
		if(self.value.startsWith("data:")){
			$(element).val("URLs that start with 'data:' will cause crashes. URL has been removed");
			return;
	}
	const img = await parse_img(self.value)
	const validIcon = $(`<span id="${self.name}_validator" data-hover="Map image valid" class="sidebar-hovertext material-icons url-validator valid">check_circle_outline</span>`)

	// default as valid
	$(self).parent().css("position","relative")
	$(self).before(validIcon)
	$(self).attr("data-valid",true)

	const display_not_valid = (hoverText) => {
		$(self).prev().html("highlight_off")
		$(self).prev().removeClass("valid loading")
		$(self).prev().addClass("invalid")
		$(self).prev().attr("data-hover", hoverText)
		$(self).attr("data-valid", false)
	
		$(self).addClass("chat-error-shake");
        setTimeout(function () {
            $(self).removeClass("chat-error-shake");
        }, 150);
	}

	const display_unsure = () => {
		$(self).prev().html("question_mark")
		$(self).prev().attr("title")
		$(self).prev().removeClass("valid loading")
		$(self).prev().addClass("unsure")
		$(self).prev().attr("data-hover", "URL is ok. Video/UVTT validation not available")
		$(self).attr("data-valid", false)
	}
	let url
	try {
		url = new URL(img)
	} catch (_) {
		display_not_valid("URL is invalid")
		return
	}

	let sceneData = window.ScenesHandler.scenes.filter(d => d.id == $('#edit_dialog').attr('data-scene-id'))[0];
	if (sceneData.UVTTFile == 1 || $("#player_map_is_video_toggle").hasClass("rc-switch-checked") || $("#dm_map_is_video_toggle").hasClass("rc-switch-checked")){
		display_unsure()
		return
	}
	try{
		function testImage(URL) {
			const tester=new Image();
			tester.onload=imageFound;
			tester.onerror=imageNotFound;
			tester.src=URL;
			$(self).prev().removeClass("valid invalid")
			$(self).prev().addClass("loading")
			$(self).prev().html("autorenew")

		}
		
		function imageFound() {
			$(self).prev().removeClass("loading invalid")
			$(self).prev().addClass("valid")
			$(self).prev().html("check_circle_outline")
		}
		
		function imageNotFound() {
			display_not_valid("Image not found")
		}
		
		testImage(url);
	} catch (_) {
		display_not_valid("Image not found")
	}
}


async function getUvttData(url){
	return await throttleGoogleApi(async () => {
		let api_url = url;
		let jsonData = {};
		if(api_url.startsWith('https://drive.google.com')){
			api_url = await getGoogleDriveAPILink(api_url);
		}
		else if(api_url.includes('dropbox.com')){		
			let splitUrl = url.split('dropbox.com');
			api_url = `https://dl.dropboxusercontent.com${splitUrl[splitUrl.length-1]}`
		}
		else if(url.includes("https://1drv.ms/"))
		{
	  	  if(url.split('/')[4].length == 1){
	        alert('Your onedrive files are stored on sharepoint servers which prevents UVTT files from working')
	      }
	      else{
	        api_url = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
	      }
		}
		else if(url.startsWith('above-bucket-not-a-url')){
			api_url = await getAvttStorageUrl(url, true);
		}

		await $.getJSON(api_url, function(data){
			jsonData = data;
		});
		return Promise.resolve(jsonData);
	})
}

function getGoogleDriveAPILink(url){
	return throttleGoogleApi(() => {
		if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") < 0 && url.indexOf("thumbnail?id=") < 0) {
			const parsed = 'https://drive.google.com/uc?id=' + url.split('/')[5];
			const fileid = parsed.split('=')[1];
			url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;	
		} 
		else if (url.startsWith("https://drive.google.com") && (url.indexOf("uc?id=") > -1 || url.indexOf("thumbnail?id=") > -1 )) {
			const fileid = url.split('=')[1].split('&')[0];
			url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;
		}
		return url;
	})
}

async function import_uvtt_scene_to_new_scene(url, title='New Scene', folderPath, parentId, doorType, doorHidden){
	try{
		let sceneData = await getUvttData(url);
		let aboveSceneData = {
			...create_full_scene_from_uvtt(sceneData, url, doorType, doorHidden),
			title: title,
			folderPath: folderPath,
			parentId: parentId
		} // this sets up scene data for import
		

		await AboveApi.migrateScenes(window.gameId, [aboveSceneData]);

		window.ScenesHandler.scenes.push(aboveSceneData);
		did_update_scenes();
		$(`.scene-item[data-scene-id='${aboveSceneData.id}'] .dm_scenes_button`).click();
		$("#sources-import-main-container").remove();
		expand_all_folders_up_to_id(aboveSceneData.id);
	}
	catch{
		$("#sources-import-main-container").remove();
		showError('Unexpected file format. The file may be on a host that does not support UVTT files or is not a UVTT file.')
		
	}


}


async function get_map_from_uvtt_file(url){
	let sceneData = await getUvttData(url);

	return `data:image/png;base64,${sceneData.image}`
}

function create_full_scene_from_uvtt(data, url, doorType, doorHidden){ //this sets up scene data for import

	DataFile = data;
	/*
	Even though grid size is provided in the UVTT we set it manually to prevent performance issues.
	This should help in the majority of cases for now.
	For larger maps we can consider dropping this to 25 and scaling up instead. 
	Similar to the grid wizard function consider_upscaling() but inverse where we look at the total size to determine grid size and scale.
	Possibly when DataFile.resolution.map_size is > 100 on one side (this would mean 5000px for 50px squares - we often start to get reports of performance issues around this size)
	*/
	let gridSize = 50; 

	let sceneDrawings = []
	let mapOriginX = DataFile.resolution.map_origin?.x != undefined ? DataFile.resolution.map_origin.x : 0;
	let mapOriginY = DataFile.resolution.map_origin?.y != undefined ? DataFile.resolution.map_origin.y : 0;
	let mapSizeX = DataFile.resolution.map_size.x;
	let mapSizeY = DataFile.resolution.map_size.y;

	for(let i = 0; i<DataFile.line_of_sight.length; i++){
		for(let j = 1; j<DataFile.line_of_sight[i].length; j++){

			if((DataFile.line_of_sight[i][j-1].x) < mapOriginX && (DataFile.line_of_sight[i][j].x) < mapOriginX){
				continue;
			}
			if((DataFile.line_of_sight[i][j-1].y) < mapOriginY && (DataFile.line_of_sight[i][j].y) < mapOriginY){
				continue;
			}
			if((DataFile.line_of_sight[i][j-1].x) > mapOriginX+mapSizeX && (DataFile.line_of_sight[i][j-1].x) > mapOriginX + mapSizeX){
				continue;
			}
			if((DataFile.line_of_sight[i][j-1].y) > mapOriginY+mapSizeY && (DataFile.line_of_sight[i][j].y) > mapOriginY + mapSizeY){
				continue;
			}
			sceneDrawings.push(['line',
				'wall',
				"rgba(0, 255, 0, 1)",
				(DataFile.line_of_sight[i][j-1].x-mapOriginX)*gridSize,
				(DataFile.line_of_sight[i][j-1].y-mapOriginY)*gridSize,
				(DataFile.line_of_sight[i][j].x-mapOriginX)*gridSize,
				(DataFile.line_of_sight[i][j].y-mapOriginY)*gridSize,
				6,
				1,
			])
		}
	}
	for(let i = 0; i<DataFile.portals.length; i++){
		let closed = (DataFile.portals[i].closed) ? 'closed' : 'open'
		let color =  doorColors[doorType][closed];
		if((DataFile.portals[i].bounds[0].x) < mapOriginX && (DataFile.portals[i].bounds[1].x) < mapOriginX){
			continue;
		}
		if((DataFile.portals[i].bounds[0].y) < mapOriginY && (DataFile.portals[i].bounds[1].y) < mapOriginY){
			continue;
		}
		if((DataFile.portals[i].bounds[0].x) > mapOriginX+mapSizeX && (DataFile.portals[i].bounds[1].x) > mapOriginX + mapSizeX){
			continue;
		}
		if((DataFile.portals[i].bounds[0].y) > mapOriginY+mapSizeY && (DataFile.portals[i].bounds[1].y) > mapOriginY + mapSizeY){
			continue;
		}
		sceneDrawings.push(['line',
			'wall',
			color,
			(DataFile.portals[i].bounds[0].x-mapOriginX)*gridSize,
			(DataFile.portals[i].bounds[0].y-mapOriginY)*gridSize,
			(DataFile.portals[i].bounds[1].x-mapOriginX)*gridSize,
			(DataFile.portals[i].bounds[1].y-mapOriginY)*gridSize,
			12,
			1,
			doorHidden
		])
	}


	function hexToRGB(hex, alpha) {
	    let r = parseInt(hex.slice(1, 3), 16),
	        g = parseInt(hex.slice(3, 5), 16),
	        b = parseInt(hex.slice(5, 7), 16);

	    if (alpha) {
	        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
	    } else {
	        return "rgb(" + r + ", " + g + ", " + b + ")";
	    }
	}

	let sceneTokens = {};
	for(let i = 0; i<DataFile.lights.length; i++){
		if((DataFile.lights[i].position.x) < mapOriginX){
			continue;
		}
		if((DataFile.lights[i].position.y) < mapOriginY){
			continue;
		}
		if((DataFile.lights[i].position.x) > mapOriginX+mapSizeX){
			continue;
		}
		if((DataFile.lights[i].position.y) > mapOriginY+mapSizeY){
			continue;
		}

		let hexTransparency = parseInt(DataFile.lights[i].color.substring(DataFile.lights[i].color.length - 2, DataFile.lights[i].color.length), 16)/255;
		let intensity = DataFile.lights[i].intensity;
		let clippedColor = `#${(DataFile.lights[i].color.substring(0, DataFile.lights[i].color.length - 2))}`;

		if(hexTransparency > 0)
			intensity = intensity*hexTransparency;

		let lightColor = hexToRGB(clippedColor, intensity);
		let options = {
			...default_options(),
			imgsrc : `https://www.googleapis.com/drive/v3/files/1_QnkvmGct2dzeu-pBO9ofT-828pWvCcn?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`,
			hidden : true,
			tokenStyleSelect : 'definitelyNotAToken',
			light1 : {
				feet:  `${DataFile.lights[i].range * parseInt(window.CURRENT_SCENE_DATA.fpsq)}`,
				color: lightColor
			},
			light2 : {
				feet: '0',
				color: 'rgba(255, 255, 255, 0.5)'
			},
			vision : {
				feet: '0',
				color: 'rgba(255, 255, 255, 0.5)'
			},
			left : `${(DataFile.lights[i].position.x - mapOriginX) * gridSize - gridSize/4}px`,
			top : `${(DataFile.lights[i].position.y - mapOriginY) * gridSize - gridSize/4}px`,
			gridSquares: 0.5,
			size: gridSize/2,
			auraislight: true,
			scaleCreated: 1	
		};
		
		sceneTokens[options.id] = options;
	}

 	let sceneData = {
 		...default_scene_data(),
 		'player_map': url,
	 	'hpps': gridSize,
		'vpps': gridSize,
		'height': gridSize * DataFile.resolution.map_size.y,
		'width': gridSize * DataFile.resolution.map_size.x,
		'offsetx': 0,
		'offsety': 0,
		'scale_factor': 1,
		'drawings': sceneDrawings,
		'tokens': sceneTokens,
		'UVTTFile': 1 
	};

	return sceneData;
}

function open_grid_wizard_controls(scene_id, aligner1, aligner2, regrid=function(){}, copiedSceneData = window.CURRENT_SCENE_DATA) {
	let scene = window.ScenesHandler.scenes[scene_id];
	window.WIZARDING = true;
	function form_row(name, title, inputOverride=null, imageValidation=false) {
		const row = $(`<div style='width:100%;' id='${name}_row'/>`);
		const rowLabel = $("<div style='display: inline-block; width:30%'>" + title + "</div>");
		rowLabel.css("font-weight", "bold");
		const rowInputWrapper = $("<div style='display:inline-block; width:60%; padding-right:8px' />");
		let rowInput
		if(!inputOverride){
			if (imageValidation){
				rowInput = $(`<input type="text" onClick="this.select();" name=${name} style='width:100%' autocomplete="off" value="${scene[name] || "" }" />`);
			}else{
				rowInput = $(`<input type="text" name=${name} style='width:100%' autocomplete="off" value="${scene[name] || ""}" />`);
			}
			 
		}
		else{
			rowInput = inputOverride
		}
		
		rowInputWrapper.append(rowInput);
		row.append(rowLabel);
		row.append(rowInputWrapper);
		return row
	};

	function form_toggle(name, hoverText, defaultOn, callback){
		const toggle = $(
			`<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
			class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
		if (!hoverText) toggle.removeClass("sidebar-hovertext")
		toggle.on("click", callback)
		if (scene[name] === "1" || defaultOn){
			toggle.addClass("rc-switch-checked")
		}
		return toggle
	}

	async function handle_form_grid_on_change(){
		// not editting this scene, don't show live updates to grid
		if (scene.id !== window.CURRENT_SCENE_DATA.id){
			return
		}
	
		const {hpps, vpps, offsetx, offsety, grid_color, grid_line_width, grid_subdivided, grid} = await get_edit_form_data()
		// redraw grid with new information
		if(grid === "1" && window.CURRENT_SCENE_DATA.scale_check){
			let conversion = window.CURRENT_SCENE_DATA.scale_factor * window.CURRENT_SCENE_DATA.conversion
			redraw_grid(parseFloat(hpps*conversion), parseFloat(vpps*conversion), offsetx*conversion, offsety*conversion, grid_color, grid_line_width, grid_subdivided )
		}
		else if(grid === "1"){
			redraw_grid(parseFloat(hpps), parseFloat(vpps), offsetx, offsety, grid_color, grid_line_width, grid_subdivided )
		}
		// redraw grid using current scene data
		else if(grid === "0"){
			clear_grid()
		}
	}

	$("#edit_dialog").remove();

	scene.fog_of_war = "1"; // ALWAYS ON since 0.0.18
	console.log('edit_scene_dialog');
	$("#scene_selector").attr('disabled', 'disabled');
	const dialog = $(`<div id='edit_dialog' data-scene-id='${scene.id}'></div>`);
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");




	scene_properties = $('<div id="scene_properties"/>');
	dialog.append(scene_properties);



	adjust_create_import_edit_container(dialog, undefined, undefined, window.innerWidth-340, 340);

	let container = scene_properties;

	container.empty();

	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });

	let uuid_hidden = $("<input name='uuid' type='hidden'/>");
	uuid_hidden.val(scene['uuid']);
	form.append(uuid_hidden);

	let grid_buttons = $("<div/>");

	let gridType = $(`
		<div id="gridType">
			<fieldset>
  				<legend>Select a grid type:</legend>
  				<div>
				<input type="radio" id="squareGrid" name='grid' value="1" checked='checked'>
				<label for="squareGrid">Square</label>
				<input type="radio" id="horizontalHexGrid" name='grid' value="2">
				<label for="horizontalHexGrid">Horizontal Hex</label>
				<input type="radio" id="verticalHexGrid" name='grid' value="3">
				<label for="verticalHexGrid">Vertical Hex</label>
				</div>
 		 	</fieldset>
		</div>`
	);

	gridType.find('input').on('change', function(){
		$("#horizontalMinorAdjustmentInput").val('50');
		$("#verticalMinorAdjustmentInput").val('50');
		delete window.CURRENT_SCENE_DATA.scaleAdjustment;
		if (window.CURRENT_SCENE_DATA.gridType == 1){
			window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
			window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
		}
		moveAligners(false, true, window.CURRENT_SCENE_DATA.gridType);
		
		window.CURRENT_SCENE_DATA.gridType = $(this).val();
		if (window.CURRENT_SCENE_DATA.gridType == 3){
			
			$(scene_properties).toggleClass('verticalHex', true);
			$(scene_properties).toggleClass('horizontalHex', false);
			$('span.squaresWide').text(' hex columns');
			$('#additionalGridInfo').toggleClass('closed', false);
			$('#gridInstructions').text(`Top left draggable will position the hex grid, bottom right will adjust it's size. Use minor adjustment bars to skew the hex if it isn't a 'perfect hex' on the map. These bars will stretch/squash starting in the top left. To use manual options: Count the number of hex columns for sizing. If the hexes on the map are squashed/stretched at all use the minor adjustment sliders.`)
		} else if (window.CURRENT_SCENE_DATA.gridType == 2){
			$(scene_properties).toggleClass('verticalHex', false);
			$(scene_properties).toggleClass('horizontalHex', true);
		
			$('span.squaresTall').text(` hex rows`);
			$('#additionalGridInfo').toggleClass('closed', false);
			$('#gridInstructions').text(`Top left draggable will position the hex grid, bottom right will adjust it's size. Use minor adjustment bars to skew the hex if it isn't a 'perfect hex' on the map. These bars will stretch/squash starting in the top left. To use manual options: Count the number of hex rows for sizing. If the hexes on the map are squashed/stretched at all use the minor adjustment sliders.`)
		} else if (window.CURRENT_SCENE_DATA.gridType == 1){
			$(scene_properties).toggleClass('verticalHex', false);
			$(scene_properties).toggleClass('horizontalHex', false);
			$('span.squaresTall').text(' squares tall');
			$('span.squaresWide').text(' squares wide');
			$('#verticalMinorAdjustment label').text('Minor Vertical Adjustment')
			$('#horizontalMinorAdjustment label').text('Minor Horizontal Adjustment')
			$('#gridInstructions').text(`Select a 3x3 square using the selectors to align your grid.`)
			$('input[name="fpsq"]').trigger('change');
		}
		regrid();
	})



	let verticalMinorAdjustment = $(`<div id="verticalMinorAdjustment">
			<label for="verticalMinorAdjustmentInput">Minor Vertical Adjustment</label>
			<input type="range" name='verticalMinorAdjustmentInput' min="1" max="100" value="50" class="slider" id="verticalMinorAdjustmentInput" data-orientation="vertical">
			<button id="resetMinorVerticalAdjustmentRange">Reset</button>
	</div>`);
	let horizontalMinorAdjustment = $(`<div id="horizontalMinorAdjustment">
			<label for="horizontalMinorAdjustmentInput">Minor Horizontal Adjustment</label>
		 	<input type="range" name='horizontalMinorAdjustmentInput' min="1" max="100" value="50" class="slider" id="horizontalMinorAdjustmentInput">
			
			<button id="resetMinorHorizontalAdjustmentRange">Reset</button>
	</div>`);

	horizontalMinorAdjustment.find('#resetMinorHorizontalAdjustmentRange').on('click', function(){
		$("#horizontalMinorAdjustmentInput").val('50');
		horizontalMinorAdjustment.find('input').trigger('change');
	})
	verticalMinorAdjustment.find('#resetMinorVerticalAdjustmentRange').on('click', function(){
		$("#verticalMinorAdjustmentInput").val('50');
		verticalMinorAdjustment.find('input').trigger('change');
	})	
	verticalMinorAdjustment.find('input').on('change input',function(){
		if(window.CURRENT_SCENE_DATA.gridType == 1){
			window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
			window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
		}
		else{			
			window.CURRENT_SCENE_DATA.scaleAdjustment = {
				x: 1 + ($('#horizontalMinorAdjustmentInput').val()-50)/500,
				y: 1 + ($('#verticalMinorAdjustmentInput').val()-50)/500
			}	
		}
		moveAligners(false, true);
		
		console.log('verticalMinorAdjustment');

	});
	horizontalMinorAdjustment.find('input').on('change input',function(){
		if(window.CURRENT_SCENE_DATA.gridType == 1){
			window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
			window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());	
		}
		else{			
			window.CURRENT_SCENE_DATA.scaleAdjustment = {
				x: 1 + ($('#horizontalMinorAdjustmentInput').val()-50)/500,
				y: 1 + ($('#verticalMinorAdjustmentInput').val()-50)/500
			}	
		}
		moveAligners(false, true);
		console.log('horizontalMinorAdjustment');
	});
	form.append(gridType, verticalMinorAdjustment, horizontalMinorAdjustment)


	let manual = $("<div id='manual_grid_data'/>");

	manual.append($(`
			<div id='linkAligners' title='Locks the draggable grid aligners to 1:1 aspect ratio' class='hideHex'><div style='display:inline-block; width:40%'>Link Aligners 1:1</div><input style='display: none;' type='number' min='0' max='1' step='1' name='alignersLinked'></div></div>
			<div title='The size the ruler will measure a side of a square.'><div style='display:inline-block; width:40%'>Measurement:</div><div style='display:inline-block; width:60'%'><input type='number' name='fpsq' placeholder='5' value='${window.CURRENT_SCENE_DATA.fpsq}'> <input name='upsq' placeholder='ft' value='${window.CURRENT_SCENE_DATA.upsq}'></div></div>
			<div id='gridSubdividedRow' class='hideHex' style='display: ${(window.CURRENT_SCENE_DATA.fpsq == 10 || window.CURRENT_SCENE_DATA.fpsq == 15 || window.CURRENT_SCENE_DATA.fpsq == 20) ? 'block' : 'none'}' title='Split grid into 5ft sections'><div style='display:inline-block; width:40%'>Split into 5ft squares</div><div style='display:inline-block; width:60'%'><input style='display: none;' type='number' min='0' max='1' step='1' name='grid_subdivided'></div></div>
			<div id='additionalGridInfo' class='closed'>Additional Grid Info / Manual Settings</div>
			<div title='Number of grid squares Width x Height.'><div style='display:inline-block; width:30%'>Grid size</div><div style='display:inline-block;width:70%;'><input id='squaresWide' class='hideHorizontalHex' type='number' min='1' step='any' value='${$("#scene_map").width() / window.CURRENT_SCENE_DATA.hpps}'><span style='display: inline' class='squaresWide hideHorizontalHex'> squares wide</span><br class='hideHorizontalHex'/><input type='number' id='squaresTall' class='hideVerticalHex' value='${$("#scene_map").height() / window.CURRENT_SCENE_DATA.vpps}' min='1' step="any"><span style='display: inline' class='squaresTall hideVerticalHex'> squares tall</span></div></div>
			<div title='Grid offset from the sides of the map in pixels. From top left corner of square and from middle of hex.'>
				<div style='display:inline-block; width:30%'>Offset</div><div style='display:inline-block;width:70%;'>
				<input type='number' name='offsetx' step='any'>px from left<br/>
				<input type='number' name='offsety' step='any'>px from top
				</div>
			</div>
			`));

	manual.find('#linkAligners').append(form_toggle("linkAlignersToggle",null, false,  function(event) {
		handle_basic_form_toggle_click(event);
		if ($(event.currentTarget).hasClass("rc-switch-checked")) {
			manual.find("#linkAligners input").val('1');

			
		} else {
			manual.find("#linkAligners input").val('0');
		}
	}));
	manual.find('#gridSubdividedRow').append(form_toggle("gridSubdividedToggle",null, false,  function(event) {
		handle_basic_form_toggle_click(event);
		if ($(event.currentTarget).hasClass("rc-switch-checked")) {
			manual.find("#gridSubdividedRow input").val('1');
			
		} else {
			manual.find("#gridSubdividedRow input").val('0');
		}
		window.CURRENT_SCENE_DATA.grid_subdivided = $(this).val();
	}));

	manual.find('input[name="fpsq"]').on('change blur', function(){
		if(window.CURRENT_SCENE_DATA.gridType == 1 && $(this).val() == 10 || $(this).val() == 15 || $(this).val() == 20){
			$('#gridSubdividedRow').css('display', 'block');
			$('#gridInstructions').text(`Select a 3x3 square using the selectors to align your grid. To change the grid to be appropriately sized for medium creatures enable split grid.`)
		}
		else{
			$("#gridSubdividedRow input").val('0');
			$('#gridSubdividedRow').css('display', 'none');
			$('#gridInstructions').text(`Select a 3x3 square using the selectors to align your grid.`)
		}
		window.CURRENT_SCENE_DATA.fpsq = $(this).val();
	});

	manual.find('input[name="upsq"]').on('change blur', function(){
		window.CURRENT_SCENE_DATA.upsq = $(this).val();
	});

	manual.find('#additionalGridInfo').on('click', function(){
		$(this).toggleClass('closed');
	})

	manual.find('#squaresWide').on('blur change', function(){
		window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
		window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
		moveAligners(true)
	});
	manual.find('#squaresTall').on('blur change', function(){
		window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
		window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
		moveAligners(true)
	})
	manual.find('input[name="offsetx"]').on('blur change', function(){
		window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
		window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
		let withoutOffset = parseFloat($('#aligner1').css("left")) - parseFloat($(this).attr('data-prev-value'));
		window.CURRENT_SCENE_DATA.offsetx = parseFloat($(this).val());
		$(this).attr('data-prev-value', window.CURRENT_SCENE_DATA.offsetx);
		$('#aligner1').css("left", withoutOffset+window.CURRENT_SCENE_DATA.offsetx);
		moveAligners(true)
	})
	manual.find('input[name="offsety"]').on('blur change', function(){
		window.CURRENT_SCENE_DATA.vpps = $("#scene_map").height()/parseFloat($('#squaresTall').val());
		window.CURRENT_SCENE_DATA.hpps = $("#scene_map").width()/parseFloat($('#squaresWide').val());
		let withoutOffset = parseFloat($('#aligner1').css("top")) - parseFloat($(this).attr('data-prev-value'));
		window.CURRENT_SCENE_DATA.offsety = parseFloat($(this).val());
		$(this).attr('data-prev-value', window.CURRENT_SCENE_DATA.offsety);
		$('#aligner1').css("top", withoutOffset+window.CURRENT_SCENE_DATA.offsety);
		moveAligners(true)
	})

	manual.find('input').on('keydown.enter', function(e){
		if (e.keyCode == 13) {
        	e.preventDefault();
        	$(this).trigger('change')
        	let nextVisibleInput = $('#scene_properties input:visible')[$('#scene_properties input:visible').index(this)+1]
        	if(nextVisibleInput)
        		nextVisibleInput.select();
    	}
	})

	manual.find('input').on('click.select', function(e){
        	$(this).select();	
	})
	
	let moveAligners = function (moveAligner1 = false, minorAdjustments = false, gridType = $('#gridType input:checked').val()){
		let width
		if (window.ScenesHandler.scene.upscaled == "1")
			width = 2;
		else
			width = 1;
		const dash = [30, 5]
		const color = "rgba(255, 0, 0,0.5)";
		window.CURRENT_SCENE_DATA.gridType = gridType;
		if(manual.find('input[name="offsety"]').val()== undefined || manual.find('input[name="offsetx"]').val()==undefined || (manual.find('#squaresTall').val()==undefined || manual.find('#squaresWide').val()==undefined ))
			return;
		if(window.CURRENT_SCENE_DATA.gridType == 1){
			let adjustmentSliders = {
				x: ($('#horizontalMinorAdjustmentInput').val()-50)/10,
				y: ($('#verticalMinorAdjustmentInput').val()-50)/10,
			}
			window.CURRENT_SCENE_DATA.hpps += adjustmentSliders.x;
			window.CURRENT_SCENE_DATA.vpps += adjustmentSliders.y;

			window.CURRENT_SCENE_DATA.offsetx = parseFloat($('input[name="offsetx"]').val());
			window.CURRENT_SCENE_DATA.offsety = parseFloat($('input[name="offsety"]').val());

			if(moveAligner1){
				$('#aligner1').css({
					'top': `${(Math.floor(($('#scene_map').height()/2)/window.CURRENT_SCENE_DATA.vpps)-1)*window.CURRENT_SCENE_DATA.vpps + window.CURRENT_SCENE_DATA.offsety - 29}px`,
					'left': `${(Math.floor(($('#scene_map').width()/2)/window.CURRENT_SCENE_DATA.hpps)-1)*window.CURRENT_SCENE_DATA.hpps + window.CURRENT_SCENE_DATA.offsetx - 29}px`
				});
			}
			
			$('#aligner2').css({
				"left": `${parseFloat($('#aligner1').css("left")) + window.CURRENT_SCENE_DATA.hpps*3}px`,
				"top": `${parseFloat($('#aligner1').css("top")) + window.CURRENT_SCENE_DATA.vpps*3}px`
			})

			if(minorAdjustments){
				let al1 = {
					x: parseInt(aligner1.css("left")) + 29,
					y: parseInt(aligner1.css("top")) + 29,
				};

				window.CURRENT_SCENE_DATA.offsetx  = al1.x % window.CURRENT_SCENE_DATA.hpps;
				window.CURRENT_SCENE_DATA.offsety = al1.y % window.CURRENT_SCENE_DATA.vpps;							
				$('input[name="offsetx"]').val(`${window.CURRENT_SCENE_DATA.offsetx}`)
				$('input[name="offsety"]').val(`${window.CURRENT_SCENE_DATA.offsety}`)
				$('input[name="offsetx"]').attr('data-prev-value', window.CURRENT_SCENE_DATA.offsetx);
				$('input[name="offsety"]').attr('data-prev-value', window.CURRENT_SCENE_DATA.offsety);			
			}
		
			
			redraw_grid(null,null,null,null,color,width,null,dash);
		}
		else if(window.CURRENT_SCENE_DATA.gridType == 2){
			redraw_hex_grid(null,null,null,null,color,width,null,dash, false);
		}
		else if(window.CURRENT_SCENE_DATA.gridType == 3){
			redraw_hex_grid(null,null,null,null,color,width,null,dash, true);
		}

		//to do: move the grid aligners to match the input settings.
	}			


	manual.find("input").each(function() {
		$(this).css("width", "60px");
		$(this).val(scene[$(this).attr('name')]);
	})

	form.append(manual);

	form.append(`
		<div style='margin-top:20px; font-size:11px; font-weight: bold'>Instructions:</div>
		<div style='font-size:11px;' id='gridInstructions'>Select a 3x3 square using the selectors to align your grid.</div>
		<div style='margin-top:20px; font-size:11px; font-weight: bold'>Hover settings for more info</div>

	`);

	if (typeof scene.fog_of_war == "undefined")
		scene.fog_of_war = "1";

	const submitButton = $("<button type='button'>Save</button>");
	submitButton.click(function() {
			remove_zoom_from_storage()
			$('[id="aligner1"]').remove();
			$('[id="aligner2"]').remove();
			if(window.CURRENT_SCENE_DATA.gridType == 1){
				delete window.CURRENT_SCENE_DATA.scaleAdjustment;
			}
			let gridMeasurement = $('input[name="fpsq"]').val();
			if(gridMeasurement == 5){
				grid_5();
			}else if(gridMeasurement == 10){
				grid_10();
			}else if(gridMeasurement == 15){
				grid_15();
			}else if(gridMeasurement == 20){
				grid_20();
			}else{
				$("#scene_selector_toggle").show();
				$("#tokens").show();
				window.WIZARDING = false;
				window.CURRENT_SCENE_DATA = {
					...window.CURRENT_SCENE_DATA,
					upsq: $('input[name="upsq"]').val(),
					fpsq: $('input[name="fpsq"]').val(),
					grid_subdivided: "0"
				}
				consider_upscaling(window.CURRENT_SCENE_DATA);
				window.ScenesHandler.persist_current_scene();
				$("#wizard_popup").empty().append("You're good to go!!");
				$("#exitWizard").remove();
				$("#wizard_popup").delay(2000).animate({ opacity: 0 }, 4000, function() {
					$("#wizard_popup").remove();
				});
				$("#light_container, #darkness_layer, #raycastingCanvas").css('visibility', 'visible');
			}
			$(`#sources-import-main-container`).remove();
			$('#scene_map_container').css('background', '');
	});


	let grid_5 = function() {


		$("#scene_selector_toggle").show();
		$("#tokens").show();
		window.WIZARDING = false;
		window.CURRENT_SCENE_DATA = {
			...window.CURRENT_SCENE_DATA,
			fpsq: "5",
			grid_subdivided: "0"
		}
		consider_upscaling(window.CURRENT_SCENE_DATA);
		window.ScenesHandler.persist_current_scene();
		$("#light_container").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	};

	let grid_10 = function() {

			window.WIZARDING = false;
			let subdivided = $('input[name="grid_subdivided"]').val() == 1;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			$("#wizard_popup").empty().append("You're good to go! AboveVTT is now super-imposing a grid that divides the original grid map in half. If you want to hide this grid just edit the manual grid data.");
			window.CURRENT_SCENE_DATA = {
				...window.CURRENT_SCENE_DATA,
				hpps: (subdivided) ? window.CURRENT_SCENE_DATA.hpps/2 : window.CURRENT_SCENE_DATA.hpps,
				vpps: (subdivided) ? window.CURRENT_SCENE_DATA.vpps/2 : window.CURRENT_SCENE_DATA.vpps,
				fpsq: (subdivided) ? '5' : '10',
				grid_subdivided: $('input[name="grid_subdivided"]').val()
			}
			consider_upscaling(window.CURRENT_SCENE_DATA);
			window.ScenesHandler.persist_current_scene();
			$("#light_container").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
	}

	let grid_15 = function() {
		window.WIZARDING = false;
		let subdivided = $('input[name="grid_subdivided"]').val() == 1;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		window.CURRENT_SCENE_DATA = {
			...window.CURRENT_SCENE_DATA,
			hpps: (subdivided) ? window.CURRENT_SCENE_DATA.hpps/3 : window.CURRENT_SCENE_DATA.hpps,
			vpps: (subdivided) ? window.CURRENT_SCENE_DATA.vpps/3 : window.CURRENT_SCENE_DATA.vpps,
			fpsq:  (subdivided) ? '5' : '15',
			grid_subdivided: "0"
		}
		consider_upscaling(window.CURRENT_SCENE_DATA);
		window.ScenesHandler.persist_current_scene();

		$("#light_container").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	}


	let grid_20 = function() {
		window.WIZARDING = false;
		let subdivided = $('input[name="grid_subdivided"]').val() == 1;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		window.CURRENT_SCENE_DATA = {
			...window.CURRENT_SCENE_DATA,
			hpps: (subdivided) ? window.CURRENT_SCENE_DATA.hpps/4 : window.CURRENT_SCENE_DATA.hpps,
			vpps: (subdivided) ? window.CURRENT_SCENE_DATA.vpps/4 : window.CURRENT_SCENE_DATA.vpps,
			fpsq: (subdivided) ? '5' : '20',
			grid_subdivided: "0"
		}
		consider_upscaling(window.CURRENT_SCENE_DATA);		
		window.ScenesHandler.persist_current_scene();		
		$("#light_container").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	}

	cancel = $("<button type='button' id='cancel_importer'>Cancel</button>");
	cancel.click(function() {
		$('[id="aligner1"]').remove();
		$('[id="aligner2"]').remove();
		window.WIZARDING = false;
		window.ScenesHandler.scenes[window.ScenesHandler.current_scene_id] = copiedSceneData;
		window.ScenesHandler.scene = copiedSceneData;
		window.CURRENT_SCENE_DATA = copiedSceneData;

		window.ScenesHandler.persist_current_scene();
		$("#light_container").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
		$("#tokens").show();	
		$(`#sources-import-main-container`).remove();	
	})
	form.append(submitButton);
	form.append(cancel);
	container.css('opacity', '0.0');
	container.append(form);
	container.animate({
		opacity: '1.0'
	}, 1000);
}

function edit_scene_vision_settings(scene_id){
	let scene = window.ScenesHandler.scenes[scene_id];

	function form_row(name, title, inputOverride=null, imageValidation=false) {
		const row = $(`<div class='lightRow' id='${name}_row'/>`);
		const rowLabel = $("<div class='lightRowLabel'>" + title + "</div>");
		rowLabel.css("font-weight", "700");
		const rowInputWrapper = $("<div style='display:inline-block; flex-grow: 1; padding-right:8px' />");
		let rowInput
		if(!inputOverride){
			if (imageValidation){
				rowInput = $(`<input type="text" onClick="this.select();" name=${name} style='width:100%;' autocomplete="off" value="${scene[name] || "" }" />`);
			}else{
				rowInput = $(`<input type="text" name=${name} style='width:100%' autocomplete="off" value="${scene[name] || ""}" />`);
			}
			 
		}
		else{
			rowInput = inputOverride
		}

		rowInput.toggleClass('lightRowInput', true)
		rowInputWrapper.append(rowInput);
		row.append(rowLabel);
		row.append(rowInputWrapper);
		return row
	};

	function form_toggle(name, hoverText, defaultOn, callback){
		const toggle = $(
			`<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
			class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
		if (!hoverText) toggle.removeClass("sidebar-hovertext")
		toggle.on("click", callback)
		if (scene[name] === "1" || defaultOn){
			toggle.addClass("rc-switch-checked")
		}
		return toggle
	}


	$("#edit_dialog").remove();

	scene.fog_of_war = "1"; // ALWAYS ON since 0.0.18
	console.log('edit_scene_dialog');
	$("#scene_selector").attr('disabled', 'disabled');
	const dialog = $(`<div id='edit_dialog' data-scene-id='${scene.id}'></div>`);
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");


	scene_properties = $('<div id="scene_properties"/>');
	dialog.append(scene_properties);



	adjust_create_import_edit_container(dialog, undefined, undefined, 1000);

	let container = scene_properties;

	container.empty();

	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });

	let uuid_hidden = $("<input name='uuid' type='hidden'/>");
	uuid_hidden.val(scene['uuid']);
	form.append(uuid_hidden);

	let darknessValue = scene.darkness_filter || 0;
	let darknessFilterRange = $(`<input name="darkness_filter" class="darkness-filter-range" type="range" value="${darknessValue}" min="0" max="100" step="1"/>`);
	let darknessNumberInput = $(`<input name='darkness_filter_number' class='styled-number-input' type='number' min='0' max='100' value='${darknessValue}'/>`)
	
	darknessFilterRange.on('input change', function(){
		$("#darkness_layer").toggleClass("smooth-transition", true);
		let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	let darknessPercent = 100 - darknessFilterRangeValue;
   	 	if(window.CURRENT_SCENE_DATA.id == window.ScenesHandler.scenes[scene_id].id) {
	   	 	$('#VTT').css('--darkness-filter', darknessPercent + "%");
   		}
   		setTimeout(function(){
   			$("#darkness_layer").toggleClass("smooth-transition", false);
   		}, 400);
   		darknessNumberInput.val(darknessFilterRange.val());
   		if(darknessFilterRange.val() == 100){
   			playerPreviewHiddenMap.toggleClass('selected', true);
   			playerPreviewVisibleMap.toggleClass('selected', false);
   		}
   		else{
   			playerPreviewHiddenMap.toggleClass('selected', false);
   			playerPreviewVisibleMap.toggleClass('selected', true);
   		}
	});


	darknessFilterRange.on('mouseup', function(){
   	 	let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	scene.darkness_filter = darknessFilterRangeValue;
	});
	form.append(form_row('disableSceneVision',
			'Disable token vision/light',
			form_toggle("disableSceneVision",null, false,  function(event) {
				handle_basic_form_toggle_click(event);
			})
		)
	);

	form.append(form_row('darknessFilter',
						'Line of Sight/Darkness Opacity',
						darknessFilterRange)
	);

	form.find('#darknessFilter_row').attr('title', `This will darken the map by the percentage indicated. This filter interacts with light auras. Any light aura on the map will reveal the darkness. Fully opaque white light will completely eliminate the darkness in it's area.`)
	darknessFilterRange.after(darknessNumberInput);

	let playerPreviewVisibleMap = $(`<img class="player_map_preview zero_darkness" src="https://abovevtt-assets.s3.eu-central-1.amazonaws.com/menu-images/revealed.jpg"></img>`)
	let playerPreviewHiddenMap = $(`<img class="player_map_preview hundred_darkness" src="https://abovevtt-assets.s3.eu-central-1.amazonaws.com/menu-images/darkness.jpg"></img>`)
	

	if(darknessFilterRange.val() == 100){
		playerPreviewHiddenMap.toggleClass('selected', true);
		playerPreviewVisibleMap.toggleClass('selected', false);
	}
	else{
		playerPreviewHiddenMap.toggleClass('selected', false);
		playerPreviewVisibleMap.toggleClass('selected', true);
	}

	playerPreviewVisibleMap.on('click', function(){
		playerPreviewHiddenMap.toggleClass('selected', false);
   		playerPreviewVisibleMap.toggleClass('selected', true);
   		darknessFilterRange.val(0);
   		darknessFilterRange.trigger('change');
	})

	playerPreviewHiddenMap.on('click', function(){
		playerPreviewHiddenMap.toggleClass('selected', true);
   		playerPreviewVisibleMap.toggleClass('selected', false);
   		darknessFilterRange.val(100);
   		darknessFilterRange.trigger('change');
	})


	darknessNumberInput.on('input change', function(){
		$("#darkness_layer").toggleClass("smooth-transition", true);
		darknessFilterRange.val(darknessNumberInput.val());
		let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	let darknessPercent = 100 - darknessFilterRangeValue;
   	 	if(window.CURRENT_SCENE_DATA.id == window.ScenesHandler.scenes[scene_id].id) {
	   	 	$('#VTT').css('--darkness-filter', darknessPercent + "%");
   		}
   		setTimeout(function(){
   			$("#darkness_layer").toggleClass("smooth-transition", false);
   		}, 400); 
   		if(darknessFilterRange.val() == 100){
   			playerPreviewHiddenMap.toggleClass('selected', true);
   			playerPreviewVisibleMap.toggleClass('selected', false);
   		}
   		else{
   			playerPreviewHiddenMap.toggleClass('selected', false);
   			playerPreviewVisibleMap.toggleClass('selected', true);
   		}

	});

	let playerViewLabel = $('<div class="player_map_preview_label">Player view will see the map image even when behind walls at less than 100% darkness opacity. If token vision/light is enabled tokens will be hidden when out of line of sight otherwise line of sight will be ignored.</div>')
	let leaveTrail = form_row('visionTrail',
			'Player Explored Vision Trail',
			form_toggle("visionTrail",null, false,  function(event) {
				handle_basic_form_toggle_click(event);
			})
		)
	leaveTrail.find('#visionTrail_toggle').parent().css('flex-grow','')
	let deleteExploreButton = $(`<button id='deletePlayersExploreData'>Clear player explore data for this scene</button>`)
	deleteExploreButton.off('click.deleteExplore').on('click.deleteExplore', function(){
		let d = confirm("You are sending a messsage to connected players that will clear their explored data for this scene. This cannot be undone. Continue?")
		if(d === true){
			window.MB.sendMessage("custom/myVTT/deleteExplore", {
	        	sceneId: scene.id,
	    	});
		}
	})
	leaveTrail.append(deleteExploreButton)

    let daylightInput = $(`<div class="lightRow">
                    <div class="lightRowLabel">Daylight Color - For light drawings and token light</div>
                    <div class="lightRowInput" style="padding-left: 2px">
                        <input class="spectrum" name="daylight" value="${window.CURRENT_SCENE_DATA.daylight ? window.CURRENT_SCENE_DATA.daylight : 'rgba(255, 255, 255, 1)'}" >
                    </div>
                </div>
                </div>`);

    let colorPickers = daylightInput.find('input.spectrum');
    colorPickers.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        containerClassName: 'prevent-sidebar-modal-close',
        clickoutFiresChange: true,
        appendTo: "parent"
    });
    window.CURRENT_SCENE_DATA.daylight = window.CURRENT_SCENE_DATA.daylight ? window.CURRENT_SCENE_DATA.daylight : 'rgba(255, 255, 255, 1)';
    const originalColor = window.CURRENT_SCENE_DATA.daylight;
	daylightInput.find("input[name='daylight']").spectrum("set", window.CURRENT_SCENE_DATA.daylight);
    const colorPickerChange = function(e, tinycolor) {
        window.CURRENT_SCENE_DATA.daylight = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
 		$('#VTT').css('--daylight-color', window.CURRENT_SCENE_DATA.daylight);
 		redraw_drawn_light();
    };
    colorPickers.on('dragstop.spectrum', colorPickerChange);   // update the token as the player messes around with colors
    colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
    colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it


	form.append(playerPreviewVisibleMap, playerPreviewHiddenMap, playerViewLabel, leaveTrail, daylightInput);

	const cancel = $("<button type='button' id='cancel_importer'>Cancel</button>");
	cancel.click(function() {
		// redraw or clear grid based on scene data
		// discarding any changes that have been made to live modification of grid
		window.CURRENT_SCENE_DATA.daylight = originalColor;
		$('#VTT').css('--daylight-color', originalColor);
		if (scene.id === window.CURRENT_SCENE_DATA.id){
			if(window.CURRENT_SCENE_DATA.grid === "1"){
				redraw_grid()
			}
			else{
				clear_grid()
			}
		}
		$("#sources-import-main-container").remove();
		$(".ddb-classes-page-stylesheet").remove();
		$("#scene_selector").removeAttr("disabled");
		redraw_drawn_light();	
	})
	const submitButton = $("<button type='button'>Save</button>");
	submitButton.click(async function() {
		console.log("Saving scene changes")

		const formData = await get_edit_form_data();
		for (key in formData) {
			scene[key] = formData[key];
		}
		
		const isNew = false;

		window.ScenesHandler.persist_scene(scene_id, isNew);           

		$("#sources-import-main-container").remove();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();
		if(window.CURRENT_SCENE_DATA.id != window.ScenesHandler.scenes[scene_id].id) {
			$(`.scene-item[data-scene-id='${window.ScenesHandler.scenes[scene_id].id}'] .dm_scenes_button`).click();
		}
		did_update_scenes();
	});

	form.append(submitButton);
	form.append(cancel);
	//		f.append(export_grid);
	container.css('opacity', '0.0');
	container.append(form);
	
	container.animate({
		opacity: '1.0'
	}, 1000);
}

function edit_scene_dialog(scene_id) {
	let scene = window.ScenesHandler.scenes[scene_id];

	function form_row(name, title, inputOverride=null, imageValidation=false) {
		const row = $(`<div style='width:100%;' id='${name}_row'/>`);
		const rowLabel = $("<div style='display: inline-block; width:30%'>" + title + "</div>");
		rowLabel.css("font-weight", "bold");
		const rowInputWrapper = $("<div style='display:inline-block; width:60%; padding-right:8px' />");
		let rowInput
		if(!inputOverride){
			if (imageValidation){
				rowInput = $(`<input type="text" onClick="this.select();" name=${name} style='width:100%' autocomplete="off" value="${scene[name] || "" }" />`);
			}else{
				rowInput = $(`<input type="text" name=${name} style='width:100%' autocomplete="off" value="${scene[name] || ""}" />`);
			}
			 
		}
		else{
			rowInput = inputOverride
		}
		
		rowInputWrapper.append(rowInput);
		row.append(rowLabel);
		row.append(rowInputWrapper);
		return row
	};

	function form_toggle(name, hoverText, defaultOn, callback){
		const toggle = $(
			`<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
			class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
		if (!hoverText) toggle.removeClass("sidebar-hovertext")
		toggle.on("click", callback)
		if (scene[name] === "1" || defaultOn){
			toggle.addClass("rc-switch-checked")
		}
		return toggle
	}

	async function handle_form_grid_on_change(){
		// not editting this scene, don't show live updates to grid
		if (scene.id !== window.CURRENT_SCENE_DATA.id){
			return
		}
	
		const {hpps, vpps, offsetx, offsety, grid_color, grid_line_width, grid_subdivided, grid} = await get_edit_form_data()
		// redraw grid with new information
		if(grid === "1" && window.CURRENT_SCENE_DATA.scale_check){
			let conversion = window.CURRENT_SCENE_DATA.scale_factor * window.CURRENT_SCENE_DATA.conversion
			redraw_grid(parseFloat(hpps*conversion), parseFloat(vpps*conversion), offsetx*conversion, offsety*conversion, grid_color, grid_line_width, grid_subdivided )
		}
		else if(grid === "1"){
			redraw_grid(parseFloat(hpps), parseFloat(vpps), offsetx, offsety, grid_color, grid_line_width, grid_subdivided )
		}
		// redraw grid using current scene data
		else if(grid === "0"){
			clear_grid()
		}
	}

	$("#edit_dialog").remove();

	scene.fog_of_war = "1"; // ALWAYS ON since 0.0.18
	console.log('edit_scene_dialog');
	$("#scene_selector").attr('disabled', 'disabled');
	const dialog = $(`<div id='edit_dialog' data-scene-id='${scene.id}'></div>`);
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

	template_section = $("<div id='template_section'/>");


	// dialog.append(template_section);
	controls = $("<div/>");
	controls.append("Import Template From:");
	toggle_ddb = $("<button>DnDBeyond.com</button>")
	toggle_ddb.click(function() {
		load_sources_iframe_for_map_import();
	});
	controls.append(toggle_ddb);


	toggle_grimorium = $("<button>FREE MAPS</button>");
	toggle_grimorium.click(function() {
		mega_importer();
	});
	controls.append(toggle_grimorium);

	template_section.append(controls);

	scene_properties = $('<div id="scene_properties"/>');
	dialog.append(scene_properties);



	adjust_create_import_edit_container(dialog, undefined, undefined, 1000);

	let container = scene_properties;

	container.empty();

	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });

	let uuid_hidden = $("<input name='uuid' type='hidden'/>");
	uuid_hidden.val(scene['uuid']);
	form.append(uuid_hidden);

	form.append(form_row('title', 'Scene Title'))
	const playerMapRow = form_row('player_map', 'Map link', null, true)


	const dropBoxOptions1 = dropBoxOptions(function(links){playerMapRow.find('input').val(links[0].link)});
	const dropBoxbutton1 = createCustomDropboxChooser('Choose Map from Dropbox', dropBoxOptions1);
	const onedriveButton1 = createCustomOnedriveChooser('Choose Map from Onedrive', function(links){playerMapRow.find('input').val(links[0].link)})
	const avttButton1 = createCustomAvttChooser("Choose Map from Azmoria's AVTT File Picker", function (links) { playerMapRow.find('input').val(links[0].link)});


	const dmMapRow = form_row('dm_map', 'DM Only Map', null, true)

	const dropBoxOptions2 = dropBoxOptions(function(links){dmMapRow.find('input').val(links[0].link)});
	const dropBoxbutton2 = createCustomDropboxChooser('Choose DM Map from Dropbox', dropBoxOptions2);
	const onedriveButton2 = createCustomOnedriveChooser('Choose DM Map from Onedrive', function(links){dmMapRow.find('input').val(links[0].link)})
	const avttButton2 = createCustomAvttChooser("Choose Map from Azmoria's AVTT File Picker", function (links) { dmMapRow.find('input').val(links[0].link) });
	
	// add in toggles for these 2 rows
	playerMapRow.append(form_toggle("player_map_is_video", "Video map?", false, handle_map_toggle_click))
	playerMapRow.find('button').append($(`<div class='isvideotogglelabel'>link is video</div>`));
	

	playerMapRow.append(dropBoxbutton1, avttButton1, onedriveButton1);
	

	
	
	
	playerMapRow.attr('title', `This map will be shown to everyone if DM map is off or only players if the DM map is on. If you are using your own maps you will have to upload them to a public accessible place. Eg. discord, imgur, dropbox, gdrive etc.`)
	
	dmMapRow.append(form_toggle("dm_map_is_video", "Video map?", false, handle_map_toggle_click))
	dmMapRow.find('button').append($(`<div class='isvideotogglelabel'>link is video</div>`));
	
	
	dmMapRow.append(dropBoxbutton2, avttButton2, onedriveButton2);


	
	
	dmMapRow.attr('title', `This map will be shown to the DM only. It is used for a nearly indentical map to the main map that had secrets embedded in it that you don't want your players to see. Both maps must have links.`)
	form.append(playerMapRow)	
	form.append(dmMapRow)
	// add a row but override the normal input with a toggle
	form.append(form_row('dmMapToggle',
			'Use DM Map',
			form_toggle("dm_map_usable",null, false,  function(event) {
				handle_basic_form_toggle_click(event);
				if ($(event.currentTarget).hasClass("rc-switch-checked")) {
					form.find("#dm_map_row").show()
					
				} else {
					form.find("#dm_map_row").hide()
				}
			})
		)
	);
	form.find('#dmMapToggle_row').attr('title', `Enable this if you have a 2nd map that has secrets embedded that you don't want your players to see.`)

	let darknessValue = scene.darkness_filter || 0;
	let darknessFilterRange = $(`<input name="darkness_filter" class="darkness-filter-range" type="range" value="${darknessValue}" min="0" max="100" step="1"/>`);
	let darknessNumberInput = $(`<input name='darkness_filter_number' class='styled-number-input' type='number' min='0' max='100' value='${darknessValue}'/>`)
	
	darknessFilterRange.on('input change', function(){
		$("#darkness_layer").toggleClass("smooth-transition", true);
		let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	let darknessPercent = 100 - darknessFilterRangeValue;
   	 	if(window.CURRENT_SCENE_DATA.id == window.ScenesHandler.scenes[scene_id].id) {
	   	 	$('#VTT').css('--darkness-filter', darknessPercent + "%");
   		}
   		setTimeout(function(){
   			$("#darkness_layer").toggleClass("smooth-transition", false);
   		}, 400);
   		darknessNumberInput.val(darknessFilterRange.val());
   		
	});
	darknessNumberInput.on('input change', function(){
		$("#darkness_layer").toggleClass("smooth-transition", true);
		darknessFilterRange.val(darknessNumberInput.val());
		let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	let darknessPercent = 100 - darknessFilterRangeValue;
   	 	if(window.CURRENT_SCENE_DATA.id == window.ScenesHandler.scenes[scene_id].id) {
	   	 	$('#VTT').css('--darkness-filter', darknessPercent + "%");
   		}
   		setTimeout(function(){
   			$("#darkness_layer").toggleClass("smooth-transition", false);
   		}, 400);  		
	});

	darknessFilterRange.on('mouseup', function(){
   	 	let darknessFilterRangeValue = parseInt(darknessFilterRange.val());
   	 	scene.darkness_filter = darknessFilterRangeValue;
	});

	form.append(form_row('darknessFilter',
						'Line of Sight/Darkness Opacity',
						darknessFilterRange)
	);

	let leaveTrail = form_row('visionTrail',
			'Player Explored Vision Trail',
			form_toggle("visionTrail",null, false,  function(event) {
				handle_basic_form_toggle_click(event);
			})
		)
	leaveTrail.find('#visionTrail_toggle').parent().css('flex-grow','')
	let deleteExploreButton = $(`<button id='deletePlayersExploreData' style='position: absolute; left: 36%;'>Clear player explore data for this scene</button>`)
	deleteExploreButton.off('click.deleteExplore').on('click.deleteExplore', function(){
		let d = confirm("You are sending a messsage to connected players that will clear their explored data for this scene. This cannot be undone. Continue?")
		if(d === true){
			window.MB.sendMessage("custom/myVTT/deleteExplore", {
	        	sceneId: scene.id,
	    	});
		}
	})
	leaveTrail.append(deleteExploreButton)

	form.append(leaveTrail);

	form.append(form_row('disableSceneVision',
			'Disable token vision/light',
			form_toggle("disableSceneVision",null, false,  function(event) {
				handle_basic_form_toggle_click(event);
			})
		)
	);
	form.find('#darknessFilter_row').attr('title', `This will darken the map by the percentage indicated. This filter interacts with light auras. Any light aura on the map will reveal the darkness. Fully opaque white light will completely eliminate the darkness in it's area.`)
	darknessFilterRange.after(darknessNumberInput);
	form.append(form_row('snapToGrid', 'Snap to Grid',form_toggle("snap", null, false, function(event) {
		if ($(event.currentTarget).hasClass("rc-switch-checked")) {
			// it was checked. now it is no longer checked
			$(event.currentTarget).removeClass("rc-switch-checked");
			if(window.ScenesHandler.current_scene_id == scene_id){
				window.CURRENT_SCENE_DATA.snap = "0";	
			}	
		} else {
			// it was not checked. now it is checked
			$(event.currentTarget).removeClass("rc-switch-unknown");
			$(event.currentTarget).addClass("rc-switch-checked");
			if(window.ScenesHandler.current_scene_id == scene_id){
				window.CURRENT_SCENE_DATA.snap = "1";
			}	
		}
	})));
	form.find('#snapToGrid_row').attr('title', 'When enabled snaps the tokens to the grid. Otherwise tokens are able to be placed freely. Hold ctrl to when moving a token to temporarily override this.')


	const showGridControls = $("<div id='show_grid_controls'/>");
	const gridColor = $(`<input class="spectrum" name="grid_color" value="${scene["grid_color"] || "rgba(0, 0, 0, 0.5)"}" ></input>`)
	const gridStroke =$(
		`<input id="grid_line_width" name="grid_line_width" style="display:inline-block; position:relative; top:2px; margin:0px; height:12px;"
		type="range" min="0.5" max="10" step="0.5" value="${scene["grid_line_width"] || 0.5}">`)
	const gridStrokeLabel =$(`<label for='grid_line_width'>Grid Line Width</label>`);
	const gridStrokeNumberInput = $(`<input type='number' class='styled-number-input' name='gridStrokeNumberInput' max='10' min='0.5' value='${scene["grid_line_width"] || 0.5}'/>`);
	gridStroke.on("change input", function(){
		gridStrokeNumberInput.val($(this).val());
		handle_form_grid_on_change();
	})
	gridStrokeNumberInput.on("change input", function(){
		gridStroke.val($(this).val());
		handle_form_grid_on_change();
		
	})
	showGridControls.append(
		form_toggle("grid", null, false, function(event) {
			if ($(event.currentTarget).hasClass("rc-switch-checked")) {
				// it was checked. now it is no longer checked
				$(event.currentTarget).removeClass("rc-switch-checked");
				
			} else {
				// it was not checked. now it is checked
				$(event.currentTarget).removeClass("rc-switch-unknown");
				$(event.currentTarget).addClass("rc-switch-checked");
			}
				handle_form_grid_on_change()
		})
	)
	showGridControls.append(gridColor)
	showGridControls.append(gridStroke)
	showGridControls.append(gridStrokeLabel, gridStrokeNumberInput);
	form.append(form_row('drawGrid', 'Draw Grid', showGridControls))
	form.find('#drawGrid_row').attr('title', 'Draw the grid on the map. When enabled more settings for grid appearance will be available.')
	const colorPickers = form.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		containerClassName: '#edit_dialog',
		clickoutFiresChange: false
	});
	form.find(".sp-replacer").css({"height":"22px", "margin-left":"8px", "margin-right":"8px"})
	// redraw the grid here
	colorPickers.on('move.spectrum', handle_form_grid_on_change);   // update the token as the player messes around with colors
	colorPickers.on('change.spectrum', handle_form_grid_on_change); // commit the changes when the user clicks the submit button
	colorPickers.on('hide.spectrum', handle_form_grid_on_change);   // the hide event includes the original color so let's change it back when we get it

	const playlistSelect = $(`<select id='playlistSceneSelect'><option value='0'>None</option></select>`)
	const playlists = window.MIXER.playlists();

	for(let i in playlists){
		playlistSelect.append($(`<option value='${i}'>${playlists[i].name}</option>`))
	}

	const playlistValue = scene.playlist || 0;
	playlistSelect.val(playlistValue);
	playlistSelect.find(`option`).removeAttr('selected');
	playlistSelect.find(`option[value='${playlistValue}']`).attr('selected', 'selected');


	const playlistRow = form_row('playlistRow', 'Load Playlist', playlistSelect)
	playlistRow.attr('title', `This playlist will load when the DM moves players to this scene. The playlist will not change if 'None' is selected.`)
	form.append(playlistRow);

	const weatherSelect = $(`<select id='weatherSceneSelect'><option value='0'>None</option></select>`)
	for(const [weatherType, weatherName] of Object.entries(getWeatherTypes())){
		weatherSelect.append($(`<option value='${weatherType}'>${weatherName}</option>`));
	
	}

	

	const weatherValue = scene.weather || 0;
	weatherSelect.val(weatherValue);
	weatherSelect.find(`option`).removeAttr('selected');
	weatherSelect.find(`option[value='${weatherValue}']`).attr('selected', 'selected');
	

	const weatherRow = form_row('weatherRow', 'Select Weather Overlay', weatherSelect)
	weatherRow.attr('title', `Applies a weather overlay to the scene. The weather overlay will persist until changed by the DM.`)
	form.append(weatherRow);
	
	let initialPosition = form_row('initialPosition',
			'Initial Position',
			$(`<div>X:<input name='initial_x' step="any" type='number' value='${scene.initial_x || ''}'/> Y:<input type='number' step="any" name='initial_y' value='${scene.initial_y || ''}'/> Zoom:<input name='initial_zoom' step="any" type='number' value='${scene.initial_zoom || ''}'/><button id='initialPosition'>Set initial x,y and zoom to current view</button></div>`)
		)
	initialPosition.find('button#initialPosition').off('click.setPos').on('click.setPos', function(e){
		initialPosition.find(`input[name='initial_zoom']`).val(parseFloat(window.ZOOM));
		const sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
		initialPosition.find(`input[name='initial_x']`).val(parseFloat(window.scrollX)+window.innerWidth/2-sidebarSize/2);
		initialPosition.find(`input[name='initial_y']`).val(parseFloat(window.scrollY)+window.innerHeight/2);
	})
	form.append(initialPosition);

	wizard = $("<button type='button'><b>Super Mega Wizard</b></button>");
	manual_button = $("<button type='button'>Manual Grid Data</button>");

	let grid_buttons = $("<div/>");
	grid_buttons.append(wizard);
	grid_buttons.append(manual_button);

	form.append(form_row('gridConfig', 'Grid Configuration', grid_buttons))
	form.find('#gridConfig_row').attr('title', '2 options for setting up the grid. A wizard that will allow you to visually and quickly set up the grid. And manual setings if you know the required sizes. Manual settings also include custom units and unit type eg. 5 ft.')
	
	let manual = $("<div id='manual_grid_data'/>");
	manual.append($("<div style='margin:0px' title='Grid square size in pixels. Width x Height.'><div style='display:inline-block; width:30%'>Grid pixel size in original image</div><div style='display:inline-block;width:70%;'><input type='number' name='hpps'> X <input type='number' name='vpps'></div></div>"));
	manual.append($("<div style='margin:0px' title='Grid offset from the sides of the map in pixels. x offset, y offset.'><div style='display:inline-block; width:30%'>Offset</div><div style='display:inline-block;width:70%;'><input type='number' name='offsetx'> X <input type='number' name='offsety'></div></div>"));
	manual.append($("<div style='margin:0px' title='The size the ruler will measure a side of a square.'><div style='display:inline-block; width:30%'>Units per square</div><div style='display:inline-block; width:70'%'><input type='number' name='fpsq'></div></div>"));
	manual.append($("<div style='margin:0px' title='The unit of the ruler measurment.'><div style='display:inline-block; width:30%'>Distance Unit (i.e. feet)</div><div style='display:inline-block; width:70'%'><input name='upsq'></div></div>"));
	manual.append($("<div style='margin:0px' title='This will multiply the dimensions of the map by the value input.'><div style='display:inline-block; width:30%'>Scene Scale Factor</div><div style='display:inline-block; width:70'%'><input type='number' name='scale_factor'></div></div>"));
	
	manual.find("input").each(function() {
		$(this).css("width", "60px");
		$(this).val(scene[$(this).attr('name')]);
	})
	manual.hide();
	form.append(manual);
	manual_button.click(function() {
		if (manual.is(":visible"))
			manual.hide();
		else
			manual.show();
		
	});

	form.append(`<div style='margin-top:20px; font-size:11px; font-weight: bold'>Hover settings for more info</div>`);


	if (typeof scene.fog_of_war == "undefined")
		scene.fog_of_war = "1";


	const submitButton = $("<button type='button'>Save</button>");
	submitButton.click(async function() {
		console.log("Saving scene changes")

		const formData = await get_edit_form_data();
		for (key in formData) {
			scene[key] = formData[key];
		}
		scene['playlist'] = playlistSelect.val();
		scene['weather'] = weatherSelect.val();

		const isNew = false;
		window.ScenesHandler.persist_scene(scene_id, isNew);



		$("#sources-import-main-container").remove();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();
		if(window.CURRENT_SCENE_DATA.id != window.ScenesHandler.scenes[scene_id].id) {
			$(`.scene-item[data-scene-id='${window.ScenesHandler.scenes[scene_id].id}'] .dm_scenes_button`).click();
		}
		did_update_scenes();
	});



	wizard.click(
		async function() {
		

			const formData = await get_edit_form_data();
			for (key in formData) {
				scene[key] = formData[key];
			}

			let sceneData=Object.assign({},window.ScenesHandler.scenes[scene_id]);
			if(!sceneData.scale_check){

				const scale_factor = (!isNaN(parseInt(sceneData.scale_factor))) ? parseInt(sceneData.scale_factor) : 1;
				sceneData = {
					...sceneData,
					hpps: sceneData.hpps / scale_factor,
					vpps: sceneData.vpps / scale_factor,
					offsetx: sceneData.offsetx / scale_factor,
					offsety: sceneData.offsety / scale_factor
				}
			}
			sceneData ={
				...sceneData,
				scale_check: true,
				reveals: [],
				drawings:[],
				tokens: {}
			}
			if(sceneData.UVTTFile==1){
				container.append(build_combat_tracker_loading_indicator('One moment while we load the UVTT File'));
			}
			else{
				container.append(build_combat_tracker_loading_indicator('Loading Wizard'));
			}
			window.ScenesHandler.scenes[scene_id] = sceneData;


			window.ScenesHandler.switch_scene(scene_id);


			$("#VTT").css("--scene-scale", 1)

			$("#scene_selector").removeAttr("disabled");
			$("#scene_selector_toggle").click();
			$("#scene_selector_toggle").hide();

		}
	);


	cancel = $("<button type='button' id='cancel_importer'>Cancel</button>");
	cancel.click(function() {
		// redraw or clear grid based on scene data
		// discarding any changes that have been made to live modification of grid
		if (scene.id === window.CURRENT_SCENE_DATA.id){
			if(window.CURRENT_SCENE_DATA.grid === "1"){
				redraw_grid()
			}
			else{
				clear_grid()
			}
		}
		$("#sources-import-main-container").remove();
		$(".ddb-classes-page-stylesheet").remove();
		$("#scene_selector").removeAttr("disabled");
		
	})


	/*let export_grid=$("<button>Send Grid Data to the Community</button>")
	export_grid.click(function(){
	});*/



	form.append(submitButton);
	form.append(cancel);
	//		f.append(export_grid);
	container.css('opacity', '0.0');
	container.append(form);

	if($("#dm_map_usable_toggle").hasClass('rc-switch-checked')){
		form.find("#dm_map_row").show()
	}
	else{
		form.find("#dm_map_row").hide()
	}
	
	container.animate({
		opacity: '1.0'
	}, 1000);
	$("#edit_scene_form").find(`[name='player_map']`).attr("placeholder", "Map image or video url here.       Toggle this if video -->");
	$("#edit_scene_form").find(`[name='dm_map']`).attr("placeholder", "Only the DM will see this image/video");
	//validate_image_input($(playerMapRow).find("input")[0])
	//validate_image_input($(dmMapRow).find("input")[0])
}

function display_sources() {
	$("#source_select").empty();
	$("#chapter_select").empty();
	$("#scene_select").empty();

	for (property in window.ScenesHandler.sources) {
		let source = window.ScenesHandler.sources[property];
		$("#source_select").append($("<option value='" + property + "'>" + source.title + "</option>"));
	}
}

function display_chapters(selectedChapter, notOwned = false) {
	$("#chapter_select").empty();
	$("#scene_select").empty();

	let source_name = $("#source_select").val();
	for (property in window.ScenesHandler.sources[source_name].chapters) {
		let chapter = window.ScenesHandler.sources[source_name].chapters[property];
		$("#chapter_select").append($("<option value='" + property + "'>" + chapter.title + "</option>"))
	}


	const chapterSelectMenu = ddb_style_chapter_select(source_name, window.ScenesHandler.sources[source_name].chapters);
	$("#importer_toggles").append(chapterSelectMenu);
	$("#chapter_select").hide();
	if (selectedChapter) {
		$(".quick-menu-item-link").each((idx, el) => {
			const chapterLink = $(el);
			if (chapterLink.attr("data-chapter") === selectedChapter) {
				$(".current-source").removeClass("current-source");
				chapterLink.parent().addClass("current-source");
			}
		});
		if ($(".current-source").length === 1) {
			$("#chapter_select").val(selectedChapter).change();
		} else {
			$("#chapter_select").change(); // couldn't find that chapter so just click the first one
		}
	} else {
		$("#chapter_select").change();
	}
}

function display_scenes(notOwned = false) {



	let source_name = $("#source_select").val();
	let chapter_name = $("#chapter_select").val();
	if(notOwned){
		let area = $("#importer_area");
		area.empty();
		area.css("opacity", "0");
		area.animate({ opacity: "1" }, 300);
		area.append($(`<div>Chapter not available. You may not own it or it is not fully released yet. You can check if you have access to the chapter here here: <a target="_blank" id='check_chapter_access' href='/sources/dnd/${source_name}/${chapter_name}'>https://www.dndbeyond.com/sources/dnd/${source_name}/${chapter_name}</a></div> `)) 
		return;
	}
	fill_importer(window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes, 0);
	console.log(window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes);
	console.log("mostrati...");
	/*$("#scene_select").empty();
	
	let source_name=$("#source_select").val();
	let chapter_name=$("#chapter_select").val();
	for(property in window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes){
				let scene=window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes[property];
				$("#scene_select").append($("<option value='"+property+"'>"+scene.title+"</option>"));
			}			
			$("#scene_select").change();*/
}

function ddb_style_chapter_select(source, chapters) {
	console.log("ddb_style_chapter_select", chapters);
	const menu = $(`
		<div class="sidebar-scroll-menu">
			<ul class="quick-menu quick-menu-tier-1">
				<li class="quick-menu-item quick-menu-item-tier-1">

					<div class="quick-menu-item-label">
						<a class="quick-menu-item-link back-to-source-select" href="#">Source Select</a>
					</div>
					<ul class="quick-menu quick-menu-tier-2 chapter-list">

					</ul>
				</li>
			</ul>
		</div>	
	`);
	const chapterList = menu.find("ul.chapter-list");
	for (const chapterKey in chapters) {
		console.log("building", chapterKey, chapters[chapterKey]);
		const chapterListItem = ddb_style_chapter_list_item(chapterKey, chapters[chapterKey].title);
		chapterList.append(chapterListItem);
		chapterListItem.find("a").click(function(e) {
			e.stopPropagation();
			e.preventDefault();
			$("#chapter_select").val(chapterKey).change();
			$(".current-source").removeClass("current-source");
			$(e.currentTarget).parent().addClass("current-source");
			scene_importer_clicked_source(source, chapterKey);
		});
	}
	chapterList.find("a:first").parent().addClass("current-source");
	menu.find(".back-to-source-select").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		$("#mega_importer").remove();
		$("#sources-import-iframe").show();
	});
	return menu;
}

function ddb_style_chapter_list_item(chapterKey, chapterTitle) {
	console.log("ddb_style_chapter_list_item", chapterKey, chapterTitle)
	return $(`
		<li class="quick-menu-item quick-menu-item-tier-2 quick-menu-item-closed">
			<div class="quick-menu-item-label">
				<a class="quick-menu-item-link" href="#" data-chapter="${chapterKey}">${chapterTitle}</a>
			</div>
		</li>
	`);
}

function init_ddb_importer(target, selectedSource, selectedChapter) {

	panel = $("<div id='scenes-panel' class='sidepanel-content'></div>");
	target.append(panel);


	let source_select = $("<select id='source_select'/>");
	source_select.css("display", "inline");
	if (selectedSource) {
		source_select.hide();
	}



	source_select.change(function() {
		$("#chapter_select").empty();
		$("#scenes_select").empty();
		$("#import_button").attr('disabled', 'disabled');
		let source_name = $("#source_select").val()
		window.ScenesHandler.build_chapters(source_name, function () {
			display_chapters(selectedChapter);
			$('#sources-import-content-container').find(".sidebar-panel-loading-indicator").remove();
		});
	});



	let chapter_select = $("<select id='chapter_select'/>");
	chapter_select.css("display", "inline");
	chapter_select.change(function() {
		$("#scene_select").empty();
		$("#import_button").attr('disabled', 'disabled');
		let source_name = $("#source_select").val();
		let chapter_name = $("#chapter_select").val();

		$("#importer_area").html("Loading........ please wait!");

		window.ScenesHandler.build_scenes(source_name, chapter_name, display_scenes);
	});


	panel.append(source_select);
	panel.append(chapter_select);
	window.ScenesHandler.build_adventures(function() {
		display_sources();
		if (selectedSource) {
			$("#source_select").val(selectedSource).change();
		} else {
			$("#source_select").change();
		}
	});

}

async function fill_importer(scene_set, start, searchState = '') {
	area = $("#importer_area");
	const chapterImports = await build_source_book_chapter_import_section(scene_set);
	area.empty();
	area.css("opacity", "0");
	area.animate({ opacity: "1" }, 300);
	area.append(chapterImports);

	return;
}

function mega_importer(DDB = false, ddbSource, ddbChapter) {
	const container = $("<div id='mega_importer'/>");
	const toggles = $("<div id='importer_toggles'/>");
	container.append(toggles);
	area = $("<div id='importer_area'/>");
	container.append(area);
	bottom = $("<div id='importer_footer'/>").css({ height: "30px", width: "100%" });
	container.append(bottom);
	adjust_create_import_edit_container(container, false);
	if (!DDB) {
		first = false;
		for (let i in PRESET) {
			b = $("<button class='importer_toggle'/>");
			b.attr("data-key", i)
			b.text(i);

			b.click(function() {
				$(".importer_toggle").css("background", "");
				$(this).css("background", "red");
				fill_importer(PRESET[$(this).attr('data-key')], 0);
			})
			toggles.append(b);
			if (!first)
				first = b;
		}
	}
	else {
		if (ddbSource) {
			container.addClass("source_select");
		}
		init_ddb_importer(toggles, ddbSource, ddbChapter);
	}

	if (!DDB){
		first.click();
	}
}




function default_scene_data() {
	let defaultData = {
		id: uuid(),
		title: "New Scene",
		dm_map: "",
		player_map: "",
		scale: "100",
		dm_map_usable: "0",
		player_map_is_video: "0",
		dm_map_is_video: "0",
		fog_of_war: "1",
		tokens: {},
		fpsq: 5,
		upsq: 'ft',
		hpps: 60,
		vpps: 60,
		offsetx: 0,
		offsety: 0,
		grid: 0,
		snap: 0,
		reveals: [[0, 0, 0, 0, 2, 0, 1]],
		order: Date.now(),
		darkness_filter: '0',
		itemType: ItemType.Scene,
		parentId: RootFolder.Scenes.id,
		gridType: 1,
		scale_check: 1
	};
	const sceneCustomDefaults = window.SCENE_DEFAULT_SETTINGS;
	if(sceneCustomDefaults != false){
		defaultData = {
			...defaultData,
			...sceneCustomDefaults
		}
	}
	return defaultData;
}

function build_scene_data_payload(parentId, fullPath, sceneName = "New Scene", mapUrl = "", existingNameSet = new Set()) {
	const sanitizedFullPath = sanitize_folder_path(fullPath || RootFolder.Scenes.path);
	const baseName = avttScenesSafeDecode(sceneName || "New Scene") || "New Scene";
	let candidate = baseName;
	let suffix = 1;
	while (existingNameSet.has(candidate)) {
		candidate = `${baseName} ${suffix}`;
		suffix += 1;
	}
	existingNameSet.add(candidate);

	const sceneData = {
		...default_scene_data(),
		title: candidate,
		player_map: mapUrl || "",
		parentId,
	};

	const normalizedFullPath = sanitize_folder_path(sanitizedFullPath);
	const relativeFolderPath = normalizedFullPath
		.replace(RootFolder.Scenes.path, "")
		.replace(/^\/+/, "");
	sceneData.folderPath = relativeFolderPath;

	const lowerMap = typeof sceneData.player_map === "string" ? sceneData.player_map.toLowerCase() : "";
	if ([".mp4", ".webm", ".m4v", ".mov", ".avi", ".mkv", ".wmv", ".flv"].some((ext) => lowerMap.includes(ext))) {
		sceneData.player_map_is_video = "1";
	}

	return sceneData;
}


function init_scenes_panel() {
	console.log("init_scenes_panel");

	scenesPanel.updateHeader("Scenes");
	add_expand_collapse_buttons_to_header(scenesPanel);

	let searchInput = $(`<input name="scene-search" type="search" style="width:96%;margin:2%" placeholder="search scenes">`);
	searchInput.off("input").on("input", mydebounce(() => {
		let textValue = scenesPanel.header.find("input[name='scene-search']").val();
		redraw_scene_list(textValue);
	}, 500));
	searchInput.off("keyup").on('keyup', function(event) {
		if (event.key === "Escape") {
			$(event.target).blur();
		}
	});

	let reorderButton = $(`<button class="token-row-button reorder-button" title="Reorder Scenes"><span class="material-icons">reorder</span></button>`);
	reorderButton.on("click", function (clickEvent) {
		if ($(clickEvent.currentTarget).hasClass("active")) {
			disable_draggable_change_folder();
		} else {
			enable_draggable_change_folder(ItemType.Scene);
		}
	});

	let addSceneButton = $(`<button class="token-row-button" title="Create New Scene"><span class="material-icons">add_photo_alternate</span></button>`);
	addSceneButton.on("click", function (clickEvent) {
		create_scene_root_container(RootFolder.Scenes.path, RootFolder.Scenes.id);
	});

	let addFolderButton = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
	addFolderButton.on("click", function (clickEvent) {
		let numberOfNewFolders = window.sceneListFolders.filter(i => i.fullPath().startsWith("/New Folder") && i.isRootFolder()).length
		let newFolderName = "New Folder";
		if (numberOfNewFolders > 0) {
			newFolderName = `${newFolderName} ${numberOfNewFolders}`
		}
		const folderId = uuid();
		window.ScenesHandler.scenes.push({
			id: folderId,
			title: newFolderName,
			itemType: ItemType.Folder,
			parentId: RootFolder.Scenes.id,
			folderPath: RootFolder.Scenes.path
		});
		let newFolderItem = SidebarListItem.Folder(folderId, RootFolder.Scenes.path, newFolderName, true, RootFolder.Scenes.id, ItemType.Scene);
		window.sceneListFolders.push(newFolderItem);
		display_folder_configure_modal(newFolderItem);
		did_update_scenes();
		expand_all_folders_up_to_item(newFolderItem);
	});

	let headerWrapper = $(`<div class="scenes-panel-add-buttons-wrapper"></div>`);
	headerWrapper.append(`<span class='reorder-explanation'>Drag items to move them between folders</span>`);
	headerWrapper.append(searchInput);
	headerWrapper.append(addFolderButton);
	headerWrapper.append(addSceneButton);
	headerWrapper.append(reorderButton);
	scenesPanel.header.append(headerWrapper);
	headerWrapper.find(".reorder-explanation").hide();

	register_scene_row_context_menu(); // context menu for each row

	setTimeout(function () {
		expand_folders_to_active_scenes();
	}, 5000); // do better than this... or don't, it probably doesn't matter
}

/**
 * Updates and redraws the scene list in the sidebar
 */
async function did_update_scenes() {
	if (!window.DM) return;

	
	const sanitizedScenes = await normalize_scene_urls(window.ScenesHandler.scenes);

	console.debug("did_update_scenes", `ScenesHandler${find_game_id()}`, sanitizedScenes);


	rebuild_scene_items_list();

	// Filters scene list by search input if scenes-panel is active
	const sceneSearchInput = $("#scenes-panel.selected-tab input[name='scene-search']");
	const sceneSearchTerm = (sceneSearchInput.length > 0) ? sceneSearchInput.val() : '';
	redraw_scene_list(sceneSearchTerm);
}

function rebuild_scene_items_list() {
	console.group("rebuild_scene_items_list");

	window.sceneListFolders = window.ScenesHandler.scenes
		.filter(s => s.itemType === ItemType.Folder)
		.map(f => SidebarListItem.Folder(f.id, folder_path_of_scene(f), f.title, true, f.parentId, ItemType.Scene, f.color))
		.sort(SidebarListItem.sortComparator);

	window.sceneListItems = window.ScenesHandler.scenes
		.filter(s => s.itemType !== ItemType.Folder)
		.map(s => SidebarListItem.Scene(s))
		.sort(SidebarListItem.sortComparator);

	update_token_folders_remembered_state();

	console.groupEnd();
}

async function migrate_scene_folders() {

	console.log(`migrate_scene_folders MB`, window.MB)

	// collect scenes that need to be migrated
	const scenesNeedingMigration = window.ScenesHandler.scenes.filter(s => s.itemType === undefined); // scenes that have been migrated have an itemType
	if (!scenesNeedingMigration) {
		// nothing to migrate
		console.log("migrate_scene_folders does not need to migrate");
		return;
	}

	// collect existing folders
	const folders = window.ScenesHandler.scenes.filter(s => s.itemType === ItemType.Folder);
	let newFolders = []

	// create folders for any path that doesn't exist
	let pathsWithoutFolders = [];
	scenesNeedingMigration
		.filter(s => s.folderPath && folders.find(f => f.folderPath === s.folderPath) === undefined)
		.map(s => s.folderPath)
		.sort()
		.forEach(folderPath => {
			if (!pathsWithoutFolders.includes(folderPath)) { // make sure we don't make duplicate folders
				console.debug(`migrate_scene_folders scenesNeedingMigration parsing ${folderPath}`);
				pathsWithoutFolders.push(folderPath);
			}
			// now make sure we get nested folders that only have folders in them
			const backfillPathParts = folderPath.split("/");
			while (backfillPathParts.length > 0) {
				const lastPathPart = backfillPathParts.pop();
				console.debug(`migrate_scene_folders dropping lastPathPart ${lastPathPart}`);
				const backfillPath = sanitize_folder_path(backfillPathParts.join("/"));
				if (!pathsWithoutFolders.includes(backfillPath)) { // make sure we don't make duplicate folders
					console.debug(`migrate_scene_folders adding backfillPath ${backfillPath}`);
					pathsWithoutFolders.push(backfillPath);
				}
			}
		});

	console.debug(`migrate_scene_folders pathsWithoutFolders before filter ${pathsWithoutFolders}`);
	pathsWithoutFolders = pathsWithoutFolders.filter(fp => fp && fp !== '' && fp !== "/").sort();
	console.log("migrate_scene_folders pathsWithoutFolders", pathsWithoutFolders);

	pathsWithoutFolders.forEach(folderPath => {
			let pathParts = folderPath.split("/");
			let folderName = pathParts.pop();
			let parentPath = sanitize_folder_path(pathParts.join("/"));
			const parentId = folders.concat(newFolders).find(f => f.folderPath === parentPath)?.id || RootFolder.Scenes.id;
			console.log(`migrate_scene_folders creating folderPath: ${folderPath}, parentPath: ${parentPath}, folderName: ${folderName}, parentId: ${parentId}, folders: `, folders);
			newFolders.push({
				id: uuid(),
				title: folderName,
				itemType: ItemType.Folder,
				parentId: parentId,
				folderPath: folderPath
			});
		});

	scenesNeedingMigration
		.forEach(unmigratedScene => {
			unmigratedScene.itemType = ItemType.Scene;
			const parentFolder = folders.concat(newFolders).find(f => f.folderPath === unmigratedScene.folderPath);
			if (parentFolder) {
				console.log("migrate_scene_folders setting parentId: ", parentFolder.id, parentFolder);
				unmigratedScene.parentId = parentFolder.id;
			} else {
				unmigratedScene.parentId = RootFolder.Scenes.id;
				console.log("migrate_scene_folders setting parentId: ", RootFolder.Scenes.id);
			}
		});

	// now let's actually migrate everything
	let itemsToMigrate = scenesNeedingMigration.concat(newFolders);
	let foldersToMigrate = itemsToMigrate.filter(i => i.itemType === ItemType.Folder);
	let scenesToMigrate = itemsToMigrate.filter(i => i.itemType === ItemType.Scene);
	if (scenesToMigrate.length > 0) {
		console.log("migrate_scene_folders is migrating scenes", scenesToMigrate);
		for (const scene of scenesToMigrate) {
			console.log('migrate_scene_folders is sending update_scene', scene)
			// startup_step is not defined at this point?
			$("#loading-overlay-beholder > .sidebar-panel-loading-indicator > .loading-status-indicator__subtext").text(`Migrating scene ${scene.title}`);
			window.MB.sendMessage("custom/myVTT/update_scene", scene);
			await async_sleep(1000); // give it a second before moving on, so we don't flood the message broker or server
		}
	}

	if (foldersToMigrate.length > 0) {
		console.log("migrate_scene_folders is migrating folders", foldersToMigrate);
		await AboveApi.migrateScenes(window.gameId, foldersToMigrate);
		$("#loading-overlay-beholder > .sidebar-panel-loading-indicator > .loading-status-indicator__subtext").text(`Uploading scene folders`);
		await async_sleep(2000); // give the DB 2 seconds to persist the new data before fetching it again
		window.ScenesHandler.scenes = await AboveApi.getSceneList();
	}
	if(itemsToMigrate.length > 0){
		did_update_scenes();
	}
}

/**
 * clears and redraws the list of scenes in the sidebar
 * @param searchTerm {string} the search term used to filter the list of scenes
 */
async function redraw_scene_list(searchTerm) {


	let nameFilter = "";
	if (typeof searchTerm === "string") {
		nameFilter = searchTerm.toLowerCase();
	}

	// this is similar to the structure of a SidebarListItem.Folder row.
	// since we don't have root folders like the tokensPanel does, we want to treat the entire list like a subfolder
	// this will allow us to reuse all the folder traversing functions that the tokensPanel uses
	let list = $(`<div id="${RootFolder.Scenes.id}" data-id="${RootFolder.Scenes.id}" class="folder not-collapsible"><div class="folder-item-list" style="padding: 0;"></div></div>`);
	$('#scenesFolder').remove();
	scenesPanel.body.append(list);
	set_full_path(list, RootFolder.Scenes.path);

	// first let's add all folders because we need the folder to exist in order to add items into it
	// don't filter folders by the searchTerm because we need the folder to exist in order to add items into it
	let promises = [];
	window.sceneListFolders
		.sort(SidebarListItem.folderDepthComparator)
		.forEach(item => { promises.push(new Promise(async (resolve, reject) => {
				let row = await build_sidebar_list_row(item);
				// let folder = find_html_row_from_path(item.folderPath, scenesPanel.body).find(` > .folder-item-list`);
				let folder = $(`#${item.parentId} > .folder-item-list`);
				if (folder.length > 0) {
					folder.append(row);
				} else {
					$(`#scenesFolder`).append(row);
					console.warn("Could not find a folder to append folder item to - appending to root folder", item);
				}
				resolve();
			}))	
		});

	await Promise.all(promises);
	promises = [];

	// now let's add all the other items
	window.sceneListItems
		.sort(SidebarListItem.sortComparator)
		.filter(item => item.nameOrContainingFolderMatches(nameFilter))
		.forEach(item => { promises.push(new Promise(async (resolve, reject) => {
				let row = await build_sidebar_list_row(item);
				let folder = $(`#${item.parentId} > .folder-item-list`);
				if(window.splitPlayerScenes != undefined && Object.values(window.splitPlayerScenes).length>1){
					for(let i in window.splitPlayerScenes){
						if(i != 'players' && window.splitPlayerScenes[i] == item.id){
							let listItem = list_item_from_player_id(i);
							if (!listItem) {
								console.warn("Couldn't find token for player id", i);
								continue;
							}
							let tokenOptions = find_token_options_for_list_item(listItem);
							playerImage = tokenOptions.alternativeImages?.length>0 ? tokenOptions.alternativeImages[0] : listItem?.image;
							let tokenImg = $(`<img src='${playerImage}'></img>`)
							tokenImg.css({
								width: '15px',
								height: '15px',
								position: 'relative',
							})
							row.find('.sidebar-list-item-row-details').after(tokenImg);
						}
					}
					
				}
				if (window.JOURNAL.notes?.[item.id] != undefined){
					const conditionName = "note"
					const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
					const symbolImage = $("<img class='condition-img note-condition' src='" + window.EXTENSION_PATH + "assets/conditons/note.svg'/>");


					conditionContainer.dblclick(function () {
						window.JOURNAL.display_note(item.id);
					})

					



					const noteId = item.id;
					let hoverNoteTimer;
					const sceneId = item.id;
					conditionContainer.on({
						'mouseover': function (e) {
							hoverNoteTimer = setTimeout(function () {
								build_and_display_sidebar_flyout(e.clientY, function (flyout) {
									let noteHover = `<div>
										<div class="tooltip-header">
											<div class="tooltip-header-icon">
											
												</div>
											<div class="tooltip-header-text">
												${item.name}
											</div>
											<div class="tooltip-header-identifier tooltip-header-identifier-condition">
											Note
											</div>
										</div>
										<div class="tooltip-body note-text" style="max-height:calc(100vH - 100px)">
											<div class="tooltip-body-description">
												<div class="tooltip-body-description-text note-text">
													${window.JOURNAL.notes[item.id].text}
												</div>
											</div>
										</div>
									</div>`
									flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
									flyout.addClass('note-flyout');
									flyout.css('max-height', 'calc(100vH - 50px)')
									const tooltipHtml = $(noteHover);
									window.JOURNAL.translateHtmlAndBlocks(tooltipHtml, noteId);
									add_journal_roll_buttons(tooltipHtml);
									window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
									add_stat_block_hover(tooltipHtml, sceneId);
									add_aoe_statblock_click(tooltipHtml, sceneId);

									$(tooltipHtml).find('.add-input').each(function () {
										let numberFound = $(this).attr('data-number');
										const spellName = $(this).attr('data-spell');
										const remainingText = $(this).hasClass('each') ? '' : `${spellName} slots remaining`
										const track_ability = function (key, updatedValue) {
											if (window.JOURNAL.notes[noteId].abilityTracker === undefined) {
												window.JOURNAL.notes[noteId].abilityTracker = {};
											}
											const asNumber = parseInt(updatedValue);
											window.JOURNAL.notes[noteId].abilityTracker[key] = asNumber;
											window.JOURNAL.persist();
											debounceSendNote(noteId, window.JOURNAL.notes[noteId])
										}
										if (window.JOURNAL.notes[noteId].abilityTracker?.[spellName] >= 0) {
											numberFound = window.JOURNAL.notes[noteId].abilityTracker[spellName]
										}
										else {
											track_ability(spellName, numberFound)
										}

										let input = createCountTracker(window.JOURNAL.notes[noteId], spellName, numberFound, remainingText, "", track_ability);
										const playerDisabled = $(this).hasClass('player-disabled');
										if (!window.DM && playerDisabled) {
											input.prop('disabled', true);
										}
										const partyLootTable = $(this).closest('.party-item-table');
										if (partyLootTable.hasClass('shop') && numberFound > 0) {
											$(this).closest('tr').find('td>.item-quantity-take-input').val(1);
										}
										else {
											$(this).closest('tr').find('td>.item-quantity-take-input').val(numberFound);
										}
										$(this).find('p').remove();
										$(this).after(input)
									})
									flyout.append(tooltipHtml);
									let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
									sendToGamelogButton.css({ "float": "right" });
									sendToGamelogButton.on("click", function (ce) {
										ce.stopPropagation();
										ce.preventDefault();

										send_html_to_gamelog(noteHover);
									});

									flyout.css({
										right: '350px',
										width: '400px'
									})

									const buttonFooter = $("<div></div>");
									buttonFooter.css({
										height: "40px",
										width: "100%",
										position: "relative",
										background: "#fff"
									});
									window.JOURNAL.block_send_to_buttons(flyout);
									flyout.append(buttonFooter);
									buttonFooter.append(sendToGamelogButton);
									flyout.find("a").attr("target", "_blank");
									flyout.off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function (event) {
										event.preventDefault();
										render_source_chapter_in_iframe(event.target.href);
									});


									flyout.hover(function (hoverEvent) {
										if (hoverEvent.type === "mouseenter") {
											clearTimeout(removeToolTipTimer);
											removeToolTipTimer = undefined;
										} else {
											remove_tooltip(500);
										}
									});

									flyout.css("background-color", "#fff");
								});
							}, 500);

						},
						'mouseout': function (e) {
							clearTimeout(hoverNoteTimer)
							remove_tooltip(500);
						}

					});




					conditionContainer.css({
						"position": "absolute",
						"top": "0px",
						"left": "0px",
						"height": "14px",
						"width": "12px",
						"border-radius": "2px 2px 50% 2px",
						"overflow": "hidden",
						"border-width": "0px 1px 1px 0px",
						"border-color": "#000",
						"border-style": "solid"
					})

					symbolImage.css({
						'height': "22px",
						'width': "22px",
						'border-radius': "0px",
						'left': "-4px",
						'top': "-7px",
						'position': "absolute"
					})
					conditionContainer.append(symbolImage);
					row.append(conditionContainer);
				}
				// let folder = find_html_row_from_path(item.folderPath, scenesPanel.body).find(` > .folder-item-list`);
				if (folder.length > 0) {
					folder.append(row);
				} else {
					$(`#scenesFolder`).append(row);
					console.warn("Could not find a folder to append scene item to - appending to root folder", item);
				}
				resolve();
			}))
		});

	await Promise.all(promises);

	if (nameFilter.length > 0) {
		// auto expand all folders so we see all the search results
		let allFolders = scenesPanel.body.find(".folder");
		allFolders.removeClass("collapsed");
		for (let i = 0; i < allFolders.length; i++) {
			let currentFolder = $(allFolders[i]);
			let nonFolderDescendents = currentFolder.find(".sidebar-list-item-row:not(.folder)");
			if (nonFolderDescendents.length === 0) {
				// hide folders without results in them
				currentFolder.hide();
			}
		}

	}
	if($('.scenes-panel-add-buttons-wrapper button.reorder-button.active').length>0)
       enable_draggable_change_folder(ItemType.Scene)
}

async function create_scene_inside(parentId, fullPath = RootFolder.Scenes.path, sceneName = "New Scene", mapUrl = "") {
	const sanitizedFullPath = sanitize_folder_path(fullPath || RootFolder.Scenes.path);
	const existingNames = new Set(
		window.ScenesHandler.scenes
			.filter((scene) => scene.itemType !== ItemType.Folder && scene.parentId === parentId)
			.map((scene) => scene.title),
	);

	const sceneData = build_scene_data_payload(parentId, sanitizedFullPath, sceneName, mapUrl, existingNames);

	window.ScenesHandler.scenes.push(sceneData);

	await AboveApi.migrateScenes(window.gameId, [sceneData]);

	const sceneIndex = window.ScenesHandler.scenes.findIndex((scene) => scene.id === sceneData.id);
	if (sceneIndex >= 0) {
		edit_scene_dialog(sceneIndex, true);
	}
	did_update_scenes();
}

function avttScenesSafeDecode(value) {
	if (typeof value !== "string") {
		return value;
	}
	try {
		return decodeURIComponent(value);
	} catch (error) {
		return value;
	}
}

const AVTT_SCENE_ALLOWED_EXTENSIONS = (() => {
	const imageTypes = (typeof allowedImageTypes !== "undefined" && Array.isArray(allowedImageTypes))
		? allowedImageTypes
		: ["jpeg", "jpg", "png", "gif", "bmp", "webp"];
	const videoTypes = (typeof allowedVideoTypes !== "undefined" && Array.isArray(allowedVideoTypes))
		? allowedVideoTypes
		: ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"];
	return new Set([...imageTypes, ...videoTypes].map((ext) => String(ext).toLowerCase()));
})();

function avttScenesNormalizeRelativePath(path) {
	if (typeof path !== "string") {
		return "";
	}
	const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
	if (!normalized) {
		return "";
	}
	return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function avttScenesRelativePathFromLink(link) {
	if (typeof link !== "string" || !link) {
		return "";
	}
	const match = link.match(/^above-bucket-not-a-url\/[^/]+\/(.*)$/i);
	return match && match[1] ? match[1] : "";
}

function avttScenesIsThumbnailKey(relativeKey) {
	if (typeof avttIsThumbnailRelativeKey === "function") {
		return avttIsThumbnailRelativeKey(relativeKey);
	}
	if (typeof relativeKey !== "string" || !relativeKey) {
		return false;
	}
	return /^thumbnails_[^/]+(?:\/|$)/i.test(relativeKey);
}

async function avttScenesFetchFolderListing(relativePath) {
	const targetPath = typeof relativePath === "string" ? relativePath : "";
	if (typeof getFolderListingFromS3 === "function") {
		return await getFolderListingFromS3(targetPath);
	}
	if (typeof AVTT_S3 === "undefined") {
		throw new Error("AVTT_S3 endpoint is not available.");
	}
	const response = await fetch(
		`${AVTT_S3}?user=${window.PATREON_ID}&filename=${encodeURIComponent(targetPath)}&list=true`,
	);
	const json = await response.json();
	return Array.isArray(json?.folderContents) ? json.folderContents : [];
}

async function avttScenesCollectAssets(folderRelativePath) {
	const normalizedBase = avttScenesNormalizeRelativePath(folderRelativePath);
	if (!normalizedBase) {
		return { files: [], folders: [] };
	}
	const stack = [normalizedBase];
	const visited = new Set();
	const files = [];
	const folderPaths = new Set();
	folderPaths.add("");

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || visited.has(current)) {
			continue;
		}
		visited.add(current);
		let entries;
		try {
			entries = await avttScenesFetchFolderListing(current);
		} catch (error) {
			console.warn("Failed to load AVTT folder listing", current, error);
			continue;
		}
		if (!Array.isArray(entries)) {
			continue;
		}
		for (const entry of entries) {
			const keyValue = typeof entry === "string" ? entry : entry?.Key || entry?.key || "";
			if (!keyValue) {
				continue;
			}
			let relativeKey = keyValue;
			if (typeof avttExtractRelativeKey === "function") {
				relativeKey = avttExtractRelativeKey(keyValue);
			} else {
				const prefix = `${window.PATREON_ID}/`;
				relativeKey = keyValue.startsWith(prefix) ? keyValue.slice(prefix.length) : keyValue;
			}
			if (!relativeKey || !relativeKey.startsWith(normalizedBase)) {
				continue;
			}
			if (avttScenesIsThumbnailKey(relativeKey)) {
				continue;
			}
			if (relativeKey.endsWith("/")) {
				if (relativeKey.length > normalizedBase.length) {
					const relativeWithin = relativeKey.slice(normalizedBase.length).replace(/\/+$/, "");
					if (relativeWithin) {
						folderPaths.add(relativeWithin);
					}
				}
				if (!visited.has(relativeKey)) {
					stack.push(relativeKey);
				}
				continue;
			}
			const extension = typeof getFileExtension === "function"
				? getFileExtension(relativeKey)
				: (relativeKey.split(".").pop() || "").toLowerCase();
			if (!AVTT_SCENE_ALLOWED_EXTENSIONS.has(String(extension).toLowerCase())) {
				continue;
			}
			files.push({ relativePath: relativeKey });
		}
	}
	return { files, folders: Array.from(folderPaths) };
}

function avttScenesDeriveSceneName(relativePath) {
	const fileName = (relativePath || "").split("/").filter(Boolean).pop() || relativePath || "Scene";
	const decoded = avttScenesSafeDecode(fileName);
	return decoded.replace(/\.[^.]+$/, "") || decoded;
}

async function importAvttSelections(selectedItems, baseParentId, baseFullPath) {
	if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
		return;
	}
	build_import_loading_indicator("Importing scenes...");
	const sanitizedBaseFullPath = sanitize_folder_path(baseFullPath || RootFolder.Scenes.path);
	const existingFoldersMap = new Map();
	const pendingFoldersMap = new Map();
	const pendingScenes = [];
	const sceneNameSetsByParent = new Map();

	window.ScenesHandler.scenes
		.filter((scene) => scene?.itemType === ItemType.Folder)
		.forEach((folder) => {
			const folderPath = sanitize_folder_path(folder_path_of_scene(folder));
			if (folderPath) {
				existingFoldersMap.set(folderPath, folder);
			}
		});

	existingFoldersMap.set(sanitizedBaseFullPath, { id: baseParentId });

	const getSceneNameSet = (parentId) => {
		if (!sceneNameSetsByParent.has(parentId)) {
			const existingNames = window.ScenesHandler.scenes
				.filter((scene) => scene.itemType !== ItemType.Folder && scene.parentId === parentId)
				.map((scene) => scene.title);
			sceneNameSetsByParent.set(parentId, new Set(existingNames));
		}
		return sceneNameSetsByParent.get(parentId);
	};
	getSceneNameSet(baseParentId);

	const ensureFolderSegments = (segments) => {
		if (!Array.isArray(segments) || segments.length === 0) {
			const baseFolder = existingFoldersMap.get(sanitizedBaseFullPath);
			return {
				parentId: baseFolder?.id ?? baseParentId,
				fullPath: sanitizedBaseFullPath,
				folder: baseFolder || null,
				created: false,
			};
		}
		let parentId = baseParentId;
		let currentPath = sanitizedBaseFullPath;
		let created = false;
		let lastFolder = null;
		const accumulatedSegments = [];

		for (const rawSegment of segments) {
			const segment = avttScenesSafeDecode(rawSegment);
			if (!segment) {
				continue;
			}
			accumulatedSegments.push(segment);
			const candidatePath = sanitize_folder_path(`${sanitizedBaseFullPath}/${accumulatedSegments.join("/")}`);
			let folderData = pendingFoldersMap.get(candidatePath) || existingFoldersMap.get(candidatePath);
			if (!folderData) {
				folderData = {
					id: uuid(),
					title: segment,
					itemType: ItemType.Folder,
					parentId,
				};
				const relativePath = candidatePath.replace(RootFolder.Scenes.path, "").replace(/^\/+/, "");
				if (relativePath) {
					folderData.folderPath = relativePath;
				}
				pendingFoldersMap.set(candidatePath, folderData);
				existingFoldersMap.set(candidatePath, folderData);
				sceneNameSetsByParent.set(folderData.id, new Set());
				created = true;
			}
			getSceneNameSet(folderData.id);
			parentId = folderData.id;
			currentPath = candidatePath;
			lastFolder = folderData;
		}

		return {
			parentId,
			fullPath: currentPath,
			folder: lastFolder,
			created,
		};
	};

	const addSceneForFile = (item, targetContext, sceneNameSource) => {
		const nameSet = getSceneNameSet(targetContext.parentId);
		const sceneData = build_scene_data_payload(
			targetContext.parentId,
			targetContext.fullPath,
			sceneNameSource,
			item.link,
			nameSet,
		);
		pendingScenes.push(sceneData);
	};

	const processStandaloneFile = (item) => {
		if (!item || !item.link) {
			return;
		}
		const relativePath = item.path || avttScenesRelativePathFromLink(item.link);
		const sceneName = relativePath ? avttScenesDeriveSceneName(relativePath) : avttScenesSafeDecode(item.name || "New Scene");
		const targetContext = ensureFolderSegments([]);
		addSceneForFile(item, targetContext, sceneName);
	};

	const processFolderSelection = async (folderItem) => {
		const folderPathRaw = (folderItem && folderItem.path) || avttScenesRelativePathFromLink(folderItem?.link);
		const normalizedRelative = avttScenesNormalizeRelativePath(folderPathRaw);
		if (!normalizedRelative) {
			console.warn("AVTT folder import skipped due to missing folder path", folderItem);
			return;
		}

		const allSegments = normalizedRelative.replace(/\/$/, "").split("/").filter(Boolean);
		const rootFolderName = allSegments.pop();
		if (!rootFolderName) {
			console.warn("AVTT folder import skipped due to unresolved folder name", folderItem);
			return;
		}

		const rootContext = ensureFolderSegments([rootFolderName]);
		getSceneNameSet(rootContext.parentId);

		const { files, folders } = await avttScenesCollectAssets(normalizedRelative);

		const orderedFolders = folders
			.filter((path) => path && path.length > 0)
			.sort((a, b) => {
				const depthDiff = a.split("/").length - b.split("/").length;
				if (depthDiff !== 0) {
					return depthDiff;
				}
				return a.localeCompare(b);
			});

		for (const folderRelative of orderedFolders) {
			const segments = [rootFolderName, ...folderRelative.split("/").filter(Boolean)];
			const ensureResult = ensureFolderSegments(segments);
			if (ensureResult.created && !sceneNameSetsByParent.has(ensureResult.parentId)) {
				sceneNameSetsByParent.set(ensureResult.parentId, new Set());
			}
		}

		for (const asset of files) {
			await async_sleep(1);
			const relativePath = asset.relativePath;
			const relativeWithinFolder = relativePath.slice(normalizedRelative.length);
			const subSegments = relativeWithinFolder.split("/").slice(0, -1).filter(Boolean);
			const segments = [rootFolderName, ...subSegments];
			const targetContext = segments.length > 0 ? ensureFolderSegments(segments) : rootContext;
			const sceneName = avttScenesDeriveSceneName(relativePath);
			const sceneLink = `above-bucket-not-a-url/${window.PATREON_ID}/${relativePath}`;
			addSceneForFile({ link: sceneLink }, targetContext, sceneName);
		}
	};

	for (const item of selectedItems) {
		if (!item) {
			continue;
		}
		if (item.isFolder || item.type === avttFilePickerTypes.FOLDER) {
			await processFolderSelection(item);
		} else {
			processStandaloneFile(item);
		}
	}

	const payload = [...pendingFoldersMap.values(), ...pendingScenes];
	if (!payload.length) {
		return;
	}

	await AboveApi.migrateScenes(window.gameId, payload);

	for (const folderData of pendingFoldersMap.values()) {
		window.ScenesHandler.scenes.push(folderData);
	}
	for (const sceneData of pendingScenes) {
		window.ScenesHandler.scenes.push(sceneData);
	}

	if(pendingScenes.length == 1){
		const sceneIndex = window.ScenesHandler.scenes.findIndex((scene) => scene.id === pendingScenes[0].id);
		if (sceneIndex >= 0) {
			edit_scene_dialog(sceneIndex, true);
		}
	}

	await did_update_scenes();
	$('body>.import-loading-indicator').remove();
}

function create_scene_folder_inside(listItem) {
	let newFolderName = "New Folder";
	const numberOfNewFolders = window.ScenesHandler.scenes.filter(s => s.itemType === ItemType.Folder && s.parentId === listItem.id && s.title.startsWith(newFolderName)).length;
	if (numberOfNewFolders > 0) {
		newFolderName = `${newFolderName} ${numberOfNewFolders}`
	}
	let newSceneFolder = {
		id: uuid(),
		title: newFolderName,
		itemType: ItemType.Folder,
		parentId: listItem.id
	};
	window.ScenesHandler.scenes.push(newSceneFolder);
	let newFolderItem = SidebarListItem.Folder(newSceneFolder.id, folder_path_of_scene(newSceneFolder), newFolderName, false, listItem.id, ItemType.Scene);
	window.sceneListFolders.push(newFolderItem);
	display_folder_configure_modal(newFolderItem);
}

function rename_scene_folder(item, newName, alertUser) {
	console.log(`rename_scene_folder`, item, newName, alertUser);
	const folderIndex = window.ScenesHandler.scenes.findIndex(s => s.id === item.id);
	console.log(`rename_scene_folder folderIndex: ${folderIndex}`)
	if (folderIndex < 0) {
		const warningMessage = `Could not find a folder with id: ${item.id}`
		console.warn('rename_scene_folder', warningMessage, item);
		if (alertUser) {
			showError(new Error(warningMessage), item);
		}
		return;
	}
	console.log(`rename_scene_folder before`, window.ScenesHandler.scenes[folderIndex].title);
	window.ScenesHandler.scenes[folderIndex].title = newName;
	console.log(`rename_scene_folder after`, window.ScenesHandler.scenes[folderIndex].title);
	window.ScenesHandler.persist_scene(folderIndex);
	item.name = newName; // not sure if this will work. Might need to redraw the list

	// did_update_scenes();
	// return undefined;
	return folder_path_of_scene(window.ScenesHandler.scenes[folderIndex]);
}

function register_scene_row_context_menu() {
	$.contextMenu({
		selector: "#scenes-panel .sidebar-list-item-row",
		build: function(element, e) {

			let menuItems = {};

			let rowHtml = $(element);
			let rowItem = find_sidebar_list_item(rowHtml);
			if (rowItem === undefined) {
				console.warn("register_scene_row_context_menu failed to find row item", element, e)
				menuItems["unexpected-error"] = {
					name: "An unexpected error occurred",
					disabled: true
				};
				return { items: menuItems };
			}

			if (rowItem.canEdit() ) {
				menuItems["edit"] = {
					name: "Edit",
					callback: function(itemKey, opt, originalEvent) {
						let itemToEdit = find_sidebar_list_item(opt.$trigger);
						display_sidebar_list_item_configuration_modal(itemToEdit);
					}
				};
			}
			if(rowItem.isTypeScene()){
				menuItems["duplicate"] = {
					name: "Duplicate",
					callback: function(itemKey, opt, originalEvent) {
						let itemToEdit = find_sidebar_list_item(opt.$trigger);
						duplicate_scene(itemToEdit.id);
					}
				};
				menuItems["export"] = {
					name: "Export",
					callback: function(itemKey, opt, originalEvent) {
						let itemToEdit = find_sidebar_list_item(opt.$trigger);
						export_scene_context(itemToEdit.id)
					}
				};
				if (window.JOURNAL.notes[rowItem.id]) {
					menuItems["openSceneNote"] = {
						name: "Open Scene Note",
						callback: function (itemKey, opt, originalEvent) {
							let self = window.JOURNAL;
							let item = find_sidebar_list_item(opt.$trigger);
							self.display_note(item.id, false);
						}
					}
				}
				menuItems["editSceneNote"] = {
					name: window.JOURNAL.notes[rowItem.id] ? "Edit Scene Note" : "Create Scene Note",
					callback: function (itemKey, opt, originalEvent) {

						let self = window.JOURNAL;
						let item = find_sidebar_list_item(opt.$trigger);

						if (!self.notes[item.id]) {
							self.notes[item.id] = {
								title: item.name,
								text: "",
								player: false,
								plain: "",
								isSceneNote: true,
							};
							did_update_scenes();
						}
						self.edit_note(item.id, false);
						
					}
				}
				if (window.JOURNAL.notes[rowItem.id]) {
					menuItems["deleteSceneNote"] = {
						name: "Delete Scene Note",
						callback: function (itemKey, opt, originalEvent) {
							let self = window.JOURNAL;
							let item = find_sidebar_list_item(opt.$trigger);
							delete self.notes[item.id];
							self.persist();
							did_update_scenes();
						}
					}
				}
			}
			if(rowItem.isTypeFolder()){
				menuItems["export"] = {
					name: "Export",
					callback: function(itemKey, opt, originalEvent) {
						let itemToEdit = find_sidebar_list_item(opt.$trigger);
						export_scenes_folder_context(itemToEdit.id)
					}			
				}
			}

			if (rowItem.canDelete()) {

				menuItems["border"] = "---";

				// not a built in folder or token, add an option to delete
				menuItems["delete"] = {
					name: "Delete",
					callback: function(itemKey, opt, originalEvent) {
						let itemToDelete = find_sidebar_list_item(opt.$trigger);
						delete_item(itemToDelete);
					}
				};
			}

			if (Object.keys(menuItems).length === 0) {
				menuItems["not-allowed"] = {
					name: "You are not allowed to configure this item",
					disabled: true
				};
			}
			return { items: menuItems };
		}
	});
}

async function duplicate_scene(sceneId) {
	let scene = await AboveApi.getScene(sceneId);

	const oldSceneId = scene.data.id;
	const newSceneId = uuid();
	let aboveSceneData = {
		...scene.data,
		id: newSceneId
	} 
	
	for(token in aboveSceneData.tokens){
		let oldId = aboveSceneData.tokens[token].id;

		//is a door if it has oldSceneId, we want to keep the position part of the id but replace scene so it is still targeted correctly
		let newId = is_player_id(oldId) ? oldId : oldId.includes(oldSceneId) ? oldId.replace(oldSceneId, newSceneId) : uuid();
		
		for(noteID in window.JOURNAL.notes){
			if(oldId == noteID){	
				window.JOURNAL.notes[newId] = {...window.JOURNAL.notes[noteID]};
			}
		}
		window.JOURNAL.persist();
		aboveSceneData.tokens[newId] = aboveSceneData.tokens[token];
		aboveSceneData.tokens[newId].id = newId;
		if(aboveSceneData.tokens[newId]?.audioChannel != undefined)
			aboveSceneData.tokens[newId].audioChannel.token = newId;
		aboveSceneData.tokens = Object.fromEntries(Object.entries(aboveSceneData.tokens).filter(([k, v]) => k != token));
	}

	await AboveApi.migrateScenes(window.gameId, [aboveSceneData]);

	window.ScenesHandler.scenes.push(aboveSceneData);
	await did_update_scenes();
	await expand_all_folders_up_to_id(aboveSceneData.id);
	$(`.scene-item[data-scene-id='${aboveSceneData.id}'] .dm_scenes_button`).click();
}

function expand_folders_to_active_scenes() {
	if (!window.DM || !window.CURRENT_SCENE_DATA || !window.sceneListItems || !window.PLAYER_SCENE_ID) {
		return;
	}
	let dmSceneItem = window.sceneListItems.find(i => i.id === window.CURRENT_SCENE_DATA.id);
	if (dmSceneItem) {
		expand_all_folders_up_to_item(dmSceneItem);
	}
	let pcSceneItem = window.sceneListItems.find(i => i.sceneId === window.PLAYER_SCENE_ID);
	if (pcSceneItem) {
		expand_all_folders_up_to_item(pcSceneItem);
	}
}

function delete_folder_and_all_scenes_within_it(listItem) {
	console.group(`delete_folder_and_all_scenes_within_it`);

	const scenesToDelete = find_descendants_of_scene_id(listItem.id);

	console.debug("before deleting from scenes", window.ScenesHandler.scenes);
	scenesToDelete.forEach(scene => {
		window.ScenesHandler.delete_scene(scene.id, false);
	});
	console.debug("after deleting from scenes", window.ScenesHandler.scenes);
	console.groupEnd();
}

function move_scenes_to_parent_folder(listItem) {
	console.group(`move_scenes_to_parent_folder`);
	window.ScenesHandler.scenes.forEach((scene, sceneIndex) => {
		if (scene.parentId === listItem.id) {
			// this is a direct child of the listItem we're about to delete. let's move it up one level
			scene.parentId = listItem.parentId || RootFolder.Scenes.id;
			window.ScenesHandler.persist_scene(sceneIndex);
		}
	});
	console.groupEnd();
}

function delete_scenes_folder(listItem) {
	window.ScenesHandler.delete_scene(listItem.id, false);
}

function move_scene_to_folder(listItem, parentId) {
	let sceneIndex = window.ScenesHandler.scenes.findIndex(s => s.id === listItem.id);
	if (sceneIndex < 0) {
		console.error(`move_scene_to_folder couldn't find a scene with id ${listItem.id}`, listItem);
		showError(new Error(`Could not find a scene to move`));
		return;
	}
	window.ScenesHandler.scenes[sceneIndex].parentId = parentId;
	window.ScenesHandler.persist_scene(sceneIndex);
}

function load_sources_iframe_for_map_import(hidden = false) {

	const iframe = $(`<iframe id='sources-import-iframe'></iframe>`);

	adjust_create_import_edit_container(iframe, true);
	if (hidden) {
		iframe.hide();
	} else {
		$('#sources-import-content-container').append(build_combat_tracker_loading_indicator('One moment while we load DnDBeyond Sources'));
	}

	iframe.off("load").on("load", function (event) {
		if (!this.src) return; // it was just created. no need to do anything until it actually loads something
		// hide DDB header and footer content.
		const sourcesBody = $(event.target).contents();
		sourcesBody.find('head').append(`<style id='dndbeyondSourcesiFrameStyles' type="text/css">
			#site-main,
			.single-column #content,
			main[class*='page_root']{
				padding: 0px !important;
			} 
			header[role='banner'],
			header.navigationContainer,
			#site-main > .site-bar,
			#site-main > header.page-header,
			#mega-menu-target,
			footer,
			.ad-container,
			.ddb-site-banner,
			[href*='marketplace.dndbeyond.com'],
			[src*='marketplace.dndbeyond.com']{
				display:none !important;
			}
			.ddb-collapsible-filter{
				top:0px;
				position:sticky !important;
			}
			</style>`);

		sourcesBody.find("#site-main > .container").css({
			"padding-top": "20px"
		})

		$('#sources-import-content-container').find(".sidebar-panel-loading-indicator").remove();

		// give the search bar focus, so we can just start typing to filter sources without having to click into it
		sourcesBody.find("[class*='SearchInput_searchInput']").focus();


		// hijack the links and open our importer instead
		sourcesBody.off('click.importer').on('click.importer', "a[class*='SourceCard_imageLink']", function (event) {
			event.stopPropagation();
			event.preventDefault();
			const sourceAbbreviation = event.currentTarget.href.split("sources/").pop();
			const image = $(event.currentTarget).find("[class*='SourceCard_image']").attr('src');
			const title = $(event.currentTarget).closest("[class*='SourcesList_sourceWrapper']").find("a[class*='SourceCard_sourceTitle']").text().trim();
			scene_importer_clicked_source(sourceAbbreviation, undefined, image, title);
			$('#sources-import-content-container').append(build_combat_tracker_loading_indicator('One moment while we load sourcebook'));
			mega_importer(true, sourceAbbreviation);
			iframe.hide();
		});
		sourcesBody.find("a[class*='SourceCard_sourceTitle']").click(function (event) {
			event.stopPropagation();
			event.preventDefault();
		})
		add_scene_importer_back_button(sourcesBody);
	});

	iframe.attr("src", `/en/library?ownership=owned-shared`);
}

function adjust_create_import_edit_container(content='', empty=true, title='', width100Minus=500, minWidth=850){
	if($(`#sources-import-main-container`).length>0 ){
		let existingContainer = $('#sources-import-content-container');
		if(empty==true) {
			existingContainer.empty();
			existingContainer.append(`<link class="ddb-classes-page-stylesheet" rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/blocks/css/compiled.css" >`);
			existingContainer.append(`<link class="ddb-classes-page-stylesheet"  rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/css/compiled.css" >`);
		}
		existingContainer.append(content);
	}
	else{
		const mainContainer = $(`<div id="sources-import-main-container" class='resize_drag_window moveableWindow'></div>`);
		mainContainer.append(`<link class="ddb-classes-page-stylesheet" rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/blocks/css/compiled.css" >`);
		mainContainer.append(`<link class="ddb-classes-page-stylesheet"  rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/css/compiled.css" >`);
		const titleBar = floating_window_title_bar("sources-import-iframe-title-bar", title);
		mainContainer.prepend(titleBar);
		titleBar.find(".title-bar-exit").click(function() {
			$('#cancel_importer').click();
			$("#sources-import-main-container").remove();
			$("#mega_importer").remove();
			$('[id="aligner1"]').remove();
			$('[id="aligner2"]').remove();
		});
		const contentContainer = $(`<div id="sources-import-content-container"></div>`);
		contentContainer.append(content);
		mainContainer.append(contentContainer);
		mainContainer.draggable({
			addClasses: false,
			scroll: false,
			containment: "#windowContainment",
			start: function() {
				$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function() {
				$('.iframeResizeCover').remove();
			}
		});
		frame_z_index_when_click(mainContainer);
		mainContainer.on('mousedown', function(){frame_z_index_when_click(mainContainer)})
		$(document.body).append(mainContainer);
	}
	$(`#sources-import-main-container`).css({
		'width': `calc(100% - ${width100Minus}px)`,
		'min-width': `${minWidth}px`
	});

}


function floating_window_title_bar(id, title='') {
	// <div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"></path></svg></div>
	return $(`
    <div id="${id}" class="restored floating-window-title-bar">
    <div class='title-bar-title'>${title}</div>
      <div class="title-bar-exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>
    </div>
  `);
}

async function create_scene_root_container(fullPath, parentId) {
	const container = build_import_container();
	container.find(".j-collapsible__search").hide();

	const sectionHtml = build_import_collapsible_section("test", "");
	container.find(".no-results").before(sectionHtml);
	sectionHtml.find(".ddb-collapsible__header").hide();
	sectionHtml.css("border", "none");

	const ddb = await build_tutorial_import_list_item({
		"title": "D&D Beyond",
		"description": "Import Scenes from books you own",
		"category": "Source Books",
		
	}, "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/dnd-beyond-b-red.png", false);
	ddb.css("width", "25%");
	sectionHtml.find("ul").append(ddb);
	ddb.find(".listing-card__callout").hide();
	ddb.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		load_sources_iframe_for_map_import();
	});

	const free = await build_tutorial_import_list_item({
		"title": "Above VTT",
		"description": "Import Scenes that have been preconfigured by the AboveVTT community",
		"category": "Scenes",
		"player_map": "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
	}, "https://raw.githubusercontent.com/cyruzzo/AboveVTT/main/assets/avtt-logo.png", false);
	free.css("width", "25%");
	sectionHtml.find("ul").append(free);
	free.find(".listing-card__callout").hide();
	free.find("a.listing-card__link").click(async function (e) {
		e.stopPropagation();
		e.preventDefault();
		await build_free_map_importer();
	});

	const custom = await build_tutorial_import_list_item({
		"title": "Custom URL",
		"description": "Build a scene from scratch using a URL",
		"category": "Scenes",
		"player_map": "",
	}, "", false);
	custom.css("width", "25%");
	sectionHtml.find("ul").append(custom);
	custom.find(".listing-card__callout").hide();
	custom.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		create_scene_inside(parentId, fullPath);
	});


	const UVTT = await build_tutorial_import_list_item({
		"title": "Import from UVTT File",
		"description": "Build a scene using a Universal Virtual Tabletop file",
		"category": "Scenes",
		"player_map": "",
	}, "", false);
	UVTT.css("width", "25%");
	sectionHtml.find("ul").append(UVTT);
	UVTT.find(".listing-card__callout").hide();
	UVTT.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		build_UVTT_import_window();
	});
	const dropboxImport = await build_tutorial_import_list_item({
		"title": "Dropbox Image or Video",
		"description": "Build a scene using a Dropbox image or video file.",
		"category": "Scenes",
		"player_map": "",
	}, `${window.EXTENSION_PATH}images/Dropbox_Icon.svg`, false);

	const dropboxOptionsImport = dropBoxOptions(function(files){
		create_scene_inside(parentId, fullPath, files[0].name, files[0].link);
	});
	dropboxImport.css("width", "25%");
	sectionHtml.find("ul").append(dropboxImport);
	dropboxImport.find(".listing-card__callout").hide();
	dropboxImport.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		Dropbox.choose(dropboxOptionsImport)
	});
	
	
	const avttFileImport = await build_tutorial_import_list_item({
		"title": "Azmoria's AVTT File Picker Image or Video",
		"description": "Build a scene using an image/video from Azmoria's AVTT File Picker.",
		"category": "Scenes",
		"player_map": "",
	}, `${window.EXTENSION_PATH}assets/avtt-logo.png`, false);
	avttFileImport.css("width", "25%");
	
	sectionHtml.find("ul").append(avttFileImport); 
	
	avttFileImport.find(".listing-card__callout").hide();
	avttFileImport.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		launchFilePicker(async function (files) {
			try {
				await importAvttSelections(files, parentId, fullPath);
			} catch (error) {
				console.error("Failed to import from AVTT File Picker selection", error);
				alert(error?.message || "Failed to import selection from AVTT. See console for details.");
			}
		}, [avttFilePickerTypes.IMAGE, avttFilePickerTypes.VIDEO, avttFilePickerTypes.FOLDER]);
	});


	const onedriveImport = await build_tutorial_import_list_item({
		"title": "Onedrive Image",
		"description": "Build a scene using a Onedrive image file.",
		"category": "Scenes",
		"player_map": "",
	}, `${window.EXTENSION_PATH}images/Onedrive_icon.svg`, false);


	onedriveImport.css("width", "25%");
	sectionHtml.find("ul").append(onedriveImport);
	onedriveImport.find(".listing-card__callout").hide();
	onedriveImport.find("a.listing-card__link").click(function (e) {
		e.stopPropagation();
		e.preventDefault();
    	launchPicker(e, function(files){
			create_scene_inside(parentId, fullPath, files[0].name, files[0].link);
		}, 'single', ['photo', '.webp']);
	});



	const recentlyVisited = build_recently_visited_scene_imports_section();
	container.find(".no-results").before(recentlyVisited);

	adjust_create_import_edit_container(container, true);
	$(`#sources-import-main-container`).attr("data-folder-path", encode_full_path(fullPath));
	$(`#sources-import-main-container`).attr("data-parent-id", parentId);
}
function build_UVTT_import_window() {
	const container = build_UVTT_import_container();
	add_scene_importer_back_button(container);
	adjust_create_import_edit_container(container, true);
}
function build_UVTT_import_container(){
	const container = $(`
		<div class="container" style="height: 100%">
		  <div id="content" class="main content-container" style="height: 100%;overflow: auto">
		    <section class="primary-content" role="main">


		      <div class="static-container">

		        <div class="ddb-collapsible-filter j-collapsible__search">
		        
		        </div>

					
		        

		        
		      </div>
		      <div id='uvtt instructions'>Note: Currently Dropbox is supported. Other hosting sites may work but due to the type of file many will not.</div>
		      <div id='uvtt instructions'>UVTT Maps will take longer to load then regularly hosted images.</div>

		    </section>
		  </div>
		</div>
	`);
	function form_row(name, title, placeholder='', inputOverride=undefined) {
		const row = $(`<div style='width:100%;' id='${name}_row'/>`);
		const rowLabel = $("<div style='display: inline-block; width:30%'>" + title + "</div>");
		rowLabel.css("font-weight", "bold");
		const rowInputWrapper = $("<div style='display:inline-block; width:60%; padding-right:8px' />");
	
		let rowInput = $(`<input type="text" name=${name} placeholder='${placeholder}' style='width:100%' autocomplete="off" value=""}" />`);
			 	
		if(inputOverride){
			rowInput = inputOverride
		}
		
		rowInputWrapper.append(rowInput);
		row.append(rowLabel);
		row.append(rowInputWrapper);
		return row
	};

	function form_toggle(name, hoverText, defaultOn, callback){
		const toggle = $(
			`<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
			class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
		if (!hoverText) toggle.removeClass("sidebar-hovertext")
		toggle.on("click", callback)
		if (defaultOn){
			toggle.addClass("rc-switch-checked")
		}
		return toggle
	}
	
	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });
	form.append(form_row('title', 'Scene Title', 'New Scene'));
	form.append(form_row('player_map', 'UVTT File link', 'URL for .dd2vtt, .uvtt, .df2vtt or other universal vtt file.'));
	const dropBoxOptions1 = dropBoxOptions(function(links){$('#player_map_row input').val(links[0].link)}, false, ['.dd2vtt', '.uvtt', '.df2vtt']);
	const dropBoxbutton1 = createCustomDropboxChooser('Choose UVTT file from Dropbox', dropBoxOptions1);
	const onedriveButton1 = createCustomOnedriveChooser('Choose UVTT file from Onedrive', function(links){$('#player_map_row input').val(links[0].link)}, 'single', ['.dd2vtt', '.uvtt', '.df2vtt'])
	const avttButton1 = createCustomAvttChooser("Choose UVTT File from Azmoria's AVTT File Picker", function (links) { $('#player_map_row input').val(links[0].link) }, [avttFilePickerTypes.UVTT]);

	form.append(dropBoxbutton1);

	form.append(avttButton1);
	
	//form.append(onedriveButton1); if we ever get this working again, or one drive changes things to make them accessible we can reenable it

	const hiddenDoorToggle = form_toggle('hidden_doors_toggle', null, false, function(event) {
		handle_basic_form_toggle_click(event);
	})
	


	const doorTypeSelect = $(`<select id='doorTypeSelectUVTT'></select>`);
	const availableDoors = get_available_doors();
	for(let i in availableDoors){
		doorTypeSelect.append(`<option value='${i}'>${availableDoors[i]}</option>`)
	}

	const doorTypeRow = form_row('door_type_row', 'Door Type', null, doorTypeSelect)
	form.append(doorTypeRow);
	const hiddenDoorsDiv = form_row('hidden_doors', 'Import Doors as Hidden', null, hiddenDoorToggle);
	form.append(hiddenDoorsDiv)

	const submitButton = $("<button type='button'>Save</button>");
	submitButton.click(async function() {
		console.log("Saving scene changes")

		const formData = await get_edit_form_data();
		const folderPath = decode_full_path($(`#sources-import-main-container`).attr("data-folder-path")).replace(RootFolder.Scenes.path, "");
		const parentId = $(`#sources-import-main-container`).attr("data-parent-id");
		container.append(build_combat_tracker_loading_indicator('One moment while we load the UVTT File'));
		const doorType = $('#doorTypeSelectUVTT').val();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();
		import_uvtt_scene_to_new_scene(formData['player_map'], formData['title'], folderPath, parentId, doorType, parseInt(formData['hidden_doors_toggle'])==1)
	});


	form.append(submitButton);


	const staticontainer = container.find('.static-container');
	staticontainer.append(form);
	return container;
}
function build_free_map_importer() {

	const container = build_import_container();
	add_scene_importer_back_button(container);

	get_avtt_scene_import_data().forEach(async section => {
		const logoUrl = await parse_img(section.logo);
		const sectionHtml = build_import_collapsible_section(section.title, logoUrl);
		container.find(".no-results").before(sectionHtml);

		section.scenes.forEach(async scene => {
			try {
				const sceneHtml = await build_tutorial_import_list_item(scene, logoUrl, (scene.player_map_is_video && scene.player_map_is_video !== "0"));
				sectionHtml.find("ul").append(sceneHtml);
			} catch(error) {
				console.warn("Failed to parse scene import data", section.title, scene, error);
			}
		});

	});

	adjust_create_import_edit_container(container, true);
	// give the search bar focus, so we can just start typing to filter sources without having to click into it
	container.find(".ddb-collapsible-filter__input").focus();
}

async function build_source_book_chapter_import_section(sceneSet) {
	const container = build_import_container();
	const sectionHtml = build_import_collapsible_section("test", "");
	container.find(".no-results").before(sectionHtml);
	sectionHtml.find(".ddb-collapsible__header").hide();
	sectionHtml.css("border", "none");
	

	

	let module = await import('./scenedata/ddb-extras.js');


	let DDB_EXTRAS = module.get_ddb_extras;
	let sceneData = [];

	sceneSet.forEach(scene => {
		const tokenSet = {...scene.tokens};
		if (scene.uuid in DDB_EXTRAS) {
			scene = {...default_scene_data(), ...scene, ...DDB_EXTRAS[scene.uuid], ...get_custom_scene_settings()}
		}
		else if(scene.uuid.replace('dnd/', '') in DDB_EXTRAS){
			scene = {...scene, ...DDB_EXTRAS[scene.uuid.replace('dnd/', '')], ...get_custom_scene_settings()}
		}
		scene.tokens = {...scene.tokens, ...tokenSet};
		
		sceneData.push(scene);
		const sceneHtml = build_tutorial_import_list_item(scene, "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/dnd-beyond-b-red.png");
		sectionHtml.find("ul").append(sceneHtml);
 		

 		const uuidString = scene.uuid.replace('dnd/', '');
 		const regEx = new RegExp(`v[0-9]+\/${uuidString}`, "gi");
		const otherVersions = Object.keys(DDB_EXTRAS).filter(d=>d.match(regEx));
		if(otherVersions.length > 0){
			for(let i = 0; i<otherVersions.length; i++){
				scene = {...default_scene_data(), ...scene, ...DDB_EXTRAS[scene.uuid], ...DDB_EXTRAS[otherVersions[i]]}
				scene.tokens = { ...scene.tokens, ...tokenSet };
				sceneData.push(scene);
				const sceneHtml = build_tutorial_import_list_item(scene, "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/dnd-beyond-b-red.png");
				sectionHtml.find("ul").append(sceneHtml);
			}
		}
	});
	DDB_EXTRAS = null;
	module = null;

	const import_chapter = $(`<div class='listing-card__callout-button import-button'>Import Chapter</button>`)
	const folderPath = decode_full_path($(`#sources-import-main-container`).attr("data-folder-path")).replace(RootFolder.Scenes.path, "");
	const parentId = $(`#sources-import-main-container`).attr("data-parent-id");

	import_chapter.off('click.importChap').on('click.importChap', function(){
		build_import_loading_indicator(`Importing Chapter`);
		for(let i=0; i<sceneData.length; i++){
			sceneData[i] = {
				...default_scene_data(),
				...sceneData[i],
				id: uuid(),
				folderPath: folderPath,
				parentId: parentId,
				...get_custom_scene_settings()
			}
			if(Array.isArray(sceneData[i].tokens)){
				let tokensObject = {}
				for(let token in sceneData[i].tokens){

					let tokenId = sceneData[i].tokens[token].id;
					let statBlockID = sceneData[i].tokens[token].statBlock
					tokensObject[tokenId] = sceneData[i].tokens[token];		
				}	
				sceneData[i].tokens = tokensObject;
			}
		}

		AboveApi.migrateScenes(window.gameId, sceneData)
			.then(() => {
				let journalUpdated = false;
				for(let i=0; i<sceneData.length; i++){
					if(sceneData[i].notes != undefined){
						journalUpdated = true;
						for(let id in sceneData[i].notes){
							window.JOURNAL.notes[id] = sceneData[i].notes[id];
						}
						delete sceneData[i].notes;
						
					}
				}
				if(journalUpdated == true)
					window.JOURNAL.persist();
				window.ScenesHandler.scenes = window.ScenesHandler.scenes.concat(sceneData);
				did_update_scenes();
				$(`.scene-item[data-scene-id='${sceneData[0].id}'] .dm_scenes_button`).click();
				$("#sources-import-main-container").remove();
				expand_all_folders_up_to_id(sceneData[0].id);
				$(`body>.import-loading-indicator`).remove();
			})
			.catch(error => {
				$(`body>.import-loading-indicator`).remove();
				showError(error, "Failed to import scene", importData);
			});
	})
		

	container.find('.ddb-collapsible-filter.j-collapsible__search').append(import_chapter)

	return container;
}

function add_scene_importer_back_button(container) {
	const backButton = $(`<a class="quick-menu-item-link importer-back-button" href="#">Back</a>`);

	const searchContainer = container.find(".ddb-collapsible-filter, [class*='SourcesContents_contents']").first();
	searchContainer.prepend(backButton);
	searchContainer.css({ "display": "flex" });
	backButton.click(function (e) {
		e.stopPropagation();
		e.preventDefault();
		const folderPath = $(`#sources-import-main-container`).attr("data-folder-path");
		const parentId = $(`#sources-import-main-container`).attr("data-parent-id");
		// There's only 1 level of depth so just start over
		create_scene_root_container(decode_full_path(folderPath), parentId);
	});

	backButton.css({
		"height": "22px",
		"font-size": "18px",
		"margin-top": "auto",
		"margin-bottom": "auto",
		"background-image": "url(https://www.dndbeyond.com/file-attachments/0/737/chevron-left-green.svg)",
		"background-repeat": "no-repeat",
		"display": "inline",
		"padding": "0px 20px 0px 20px",
		"font-weight": "600"
	});
}

function build_recently_visited_scene_imports_section() {
	read_recently_visited_scene_importer_sources();
	if (window.recentlyVisitedSources.length === 0) {
		return;
	}
	const recentlyVisited = build_import_collapsible_section("Recently Visited", "https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/images/dnd-beyond-b-red.png");
	recentlyVisited.find(".ddb-collapsible__header-callout").hide();
	recentlyVisited.find(".ddb-collapsible__header").off("click");
	recentlyVisited.find(".ddb-collapsible__header").css("cursor", "default");
	let clearButton = $(`<div class="ddb-collapsible-filter__clear j-collapsible__search-clear" style="font-size: 15px;margin-left: 0;">Clear X</div>`);
	clearButton.click(function(e) {
		clear_recently_visited_scene_importer_sources();
		recentlyVisited.remove();
	});
	recentlyVisited.find(".ddb-collapsible__label").append(clearButton);
	recentlyVisited.css("border", "none");
	recentlyVisited.append(`
	<style>
.sources-listing {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: wrap;
      -ms-flex-wrap: wrap;
          flex-wrap: wrap;
  padding: 0;
  margin: 0 auto;
}
.sources-listing--item-wrapper {
  list-style: none;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 100%;
      -ms-flex: 0 0 100%;
          flex: 0 0 100%;
  position: relative;
}
@media (min-width: 400px) {
  .sources-listing--item-wrapper {
    -webkit-flex-basis: 50%;
        -ms-flex-preferred-size: 50%;
            flex-basis: 50%;
  }
}
@media (min-width: 600px) {
  .sources-listing--item-wrapper {
    -webkit-flex-basis: 33%;
        -ms-flex-preferred-size: 33%;
            flex-basis: 33%;
  }
}
@media (min-width: 860px) {
  .sources-listing--item-wrapper {
    -webkit-flex-basis: 25%;
        -ms-flex-preferred-size: 25%;
            flex-basis: 25%;
  }
}
@media (min-width: 1000px) {
  .sources-listing--item-wrapper {
    -webkit-flex-basis: 20%;
        -ms-flex-preferred-size: 20%;
            flex-basis: 20%;
  }
}
.sources-listing--item {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
      -ms-flex-direction: column;
          flex-direction: column;
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.6);
}
.sources-listing--item--avatar {
  height: 225px;
  width: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
}
.sources-listing--item--title {
  font-size: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
  padding: 10px;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
}
</style>
	`);
	window.recentlyVisitedSources.forEach(s => {
		const sItem = build_recently_visited_scene_imports_item(s);
		recentlyVisited.find("ul").append(sItem);
	});
	return recentlyVisited;
}

function build_recently_visited_scene_imports_item(recentlyVisited) {
	let search = `${recentlyVisited.title}|${recentlyVisited.source}`;
	if (recentlyVisited.chapter) {
		search += `|${recentlyVisited.chapter}`;
	}
	const itemHtml = $(`
		<li class="sources-listing--item-wrapper j-collapsible__item" data-collapsible-search="${search}">
			<a href="#" class="sources-listing--item">
				<div class="sources-listing--item--avatar" style="background-image: url('${recentlyVisited.image}');"></div>
				<div class="sources-listing--item--title">${recentlyVisited.title}</div>
			</a>
		</li>
	`);

	itemHtml.find("a").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		// move it to the front of the list
		scene_importer_clicked_source(recentlyVisited.source, recentlyVisited.chapter, recentlyVisited.image, recentlyVisited.title);
		// display the book and chapter
		load_sources_iframe_for_map_import(true);
		mega_importer(true, recentlyVisited.source, recentlyVisited.chapter);
	});

	return itemHtml;
}

function build_tutorial_import_list_item(scene, logo, allowMagnific = true) {
	const logoUrl = parse_img(logo);
	let description = scene.description || "";
	let tags = scene.tags || [];
	if (scene.drawings) {
		if (scene.drawings.find(dl=> dl[1] === "wall")) {
			tags.push("Walls");
		} else {
			tags.push("Drawings");
		}
	}
	if (scene.grid) tags.push("Grid Aligned");
	if (scene.player_map_is_video && scene.player_map_is_video !== "0") tags.push("Video Map");
	if (scene.tokens && Object.keys(scene.tokens).length > 0 && !tags.includes('2024 Tokens')) tags.push("Tokens");
	if (scene.dm_map) tags.push("DM Map");
	if (typeof description !== "string" || description.length === 0 && tags.length > 0) {
		const tagString = tags
			.slice(0, 4) // This might be overkill, but only display the first 4 tags.
			.map(t => `&bull; ${t}`).join("<br>");
		description = `
			<p><strong>This Scene Has:</strong></p>
			<p class="characters-statblock" style="font-family: Roboto Condensed,serif; font-size: 14px">${tagString}</p>
		`;
	}
	let searchTerms = `${scene.title}`;
	if (tags.length > 0) {
		searchTerms += "|"
		searchTerms += tags.join("|");
		if (scene.category) {
			searchTerms += `|${scene.category}`;
		}
	}

	const listItem = $(`
		<li class="j-collapsible__item listing-card" data-collapsible-search="${searchTerms}">
    	<div class="listing-card__content">
        <a href="${scene.player_map}" target="_blank" class="listing-card__link">
					
					<div class="listing-card__bg" style="background-image: url('${scene.thumb || scene.player_map}');background-size: cover;background-position: center;"></div>
					
					<div class="listing-card__body" style="white-space: normal">
						<div class="listing-card__header">
							<img class="listing-card__icon" src="${logoUrl}" alt="logo" />
							<div class="listing-card__header-primary">
								<h3 class="listing-card__title">${scene.title}</h3>
								<div class="listing-card__source">${scene.category || "Scene"}</div>
							</div>
						</div>
					
						<div class="listing-card__description">
							${description}
						</div>
					</div>
				
					<div class="listing-card__callout">
						<div class="listing-card__callout-button import-button"><span>Import</span></div>
					</div>
			
				</a>
			</div>
		</li>
	`);
	listItem.find(".import-button").click(function(e) {
		e.stopPropagation();
		e.preventDefault();
		build_import_loading_indicator(`Importing Scene`);
		const folderPath = decode_full_path($(`#sources-import-main-container`).attr("data-folder-path")).replace(RootFolder.Scenes.path, "");
		const parentId = $(`#sources-import-main-container`).attr("data-parent-id");

		const importData = {
			...default_scene_data(),
			...scene,
			id: uuid(),
			folderPath: folderPath,
			parentId: parentId,
			...get_custom_scene_settings()
		};
		if(Array.isArray(importData.tokens)){
			let tokensObject = {}
			for(let token in importData.tokens){

				let tokenId = importData.tokens[token].id;
				tokensObject[tokenId] = importData.tokens[token];		
			}	
			importData.tokens = tokensObject;
		}
		if(importData.notes != undefined){
			for(let id in importData.notes){
				window.JOURNAL.notes[id] = {...importData.notes[id]};
			}
			window.JOURNAL.persist();
			delete importData.notes;
		}
		AboveApi.migrateScenes(window.gameId, [importData])
			.then(() => {
				window.ScenesHandler.scenes.push(importData);
				did_update_scenes();
				$(`.scene-item[data-scene-id='${importData.id}'] .dm_scenes_button`).click();
				$("#sources-import-main-container").remove();
				expand_all_folders_up_to_id(importData.id);
				$(`body>.import-loading-indicator`).remove();
			})
			.catch(error => {
				$(`body>.import-loading-indicator`).remove();
				showError(error, "Failed to import scene", importData);
			});
	});
	if (allowMagnific) {
		listItem.find("a.listing-card__link").magnificPopup({
			type: 'image'
		});
	}
	if (!logoUrl) {
		listItem.find(".listing-card__icon").hide();
	}
	return listItem;
}

function build_import_container() {
	const container = $(`
	<div class="container" style="height: 100%">
  <div id="content" class="main content-container" style="height: 100%;overflow: auto">
    <section class="primary-content" role="main">


      <div class="static-container">

        <div class="ddb-collapsible-filter j-collapsible__search" style='display: flex;justify-content: space-between;'>
          <div class="ddb-collapsible-filter__box">
            <div class="ddb-collapsible-filter__search-icon"></div>
            <input type="search" class="j-collapsible__search-input ddb-collapsible-filter__input" id="collapsible-search-input" placeholder="Search by Name or Source">
            <div class="ddb-collapsible-filter__clear ddb-collapsible-filter__clear--hidden j-collapsible__search-clear">Clear X</div>
          </div>
        </div>

				<!--		build_import_collapsible_section objects go here		-->



        <div class="ddb-collapsible-filter__no-results ddb-collapsible-filter__no-results--hidden no-results">
          You Rolled a 1
        </div>
      </div>


    </section>
  </div>
</div>
	`);

	container.find(".ddb-collapsible-filter__clear").click(function(e) {
		$(e.currentTarget).parent().find(".ddb-collapsible-filter__input").val("");
		$(".ddb-collapsible__item--hidden").removeClass("ddb-collapsible__item--hidden");
	});
	container.find(".ddb-collapsible-filter__input").on("input change", function(e) {
		const filterValue = e.target.value?.toLowerCase();
		if (filterValue) {
			$(e.currentTarget).parent().find(".ddb-collapsible-filter__clear").removeClass("ddb-collapsible-filter__clear--hidden");
			container.find("li.listing-card").each((idk, el) => {
				const li = $(el);
				const searchTerms = li.attr("data-collapsible-search").toLowerCase();
				console.log(searchTerms, filterValue, searchTerms.includes(filterValue))
				if(searchTerms.includes(filterValue)) {
					li.removeClass("ddb-collapsible__item--hidden");
				} else {
					li.addClass("ddb-collapsible__item--hidden");
				}
			})
		} else {
			$(e.currentTarget).parent().find(".ddb-collapsible-filter__clear").addClass("ddb-collapsible-filter__clear--hidden");
			$(".ddb-collapsible__item--hidden").removeClass("ddb-collapsible__item--hidden");
		}
	});

	return container;
}

function build_import_collapsible_section(sectionLabel, logoUrl) {
	const section = $(`
	        <div class="j-collapsible ddb-collapsible">
          <div class="j-collapsible__trigger ddb-collapsible__header">
            <div class="ddb-collapsible__header-primary">

              <div class="ddb-collapsible__avatar">
                <img class="ddb-collapsible__avatar-img" src="${logoUrl}" alt="${sectionLabel}" style="border:none;">
              </div>

              <div class="ddb-collapsible__label">
                ${sectionLabel}
              </div>
            </div>
            <div class="ddb-collapsible__header-callout">
              <div class="ddb-collapsible__icon"></div>
            </div>
          </div>
          <div class="j-collapsible__content ddb-collapsible__content">


            <!-- Outside Caption -->

            <header class="  no-sub no-nav">

              <!-- Navigation -->


              <!-- Main Title -->


              <!-- Sub title -->


            </header>

            <!-- Inside Caption -->


            <!-- Outside Caption -->


            <!-- Inside Caption -->
            <div class="listing-container listing-container-ul RPGClass-listing card-listing">
              <div class="listing-header">

              </div>
              <div class="listing-body">
                <ul class="listing listing-rpgclass rpgclass-listing">




                </ul>
              </div>
              <div class="listing-footer">

              </div>
            </div>
          </div>
        </div>
	`);
	section.find(".ddb-collapsible__header").click(function(e) {
		const header = $(e.currentTarget);
		const content = header.next();
		if (header.hasClass("ddb-collapsible__header--closed")) {
			header.removeClass("ddb-collapsible__header--closed");
			content.show();
		} else {
			header.addClass("ddb-collapsible__header--closed");
			content.hide();
		}
	});
	if (!logoUrl) {
		section.find(".ddb-collapsible__avatar").hide();
	}
	return section;
}

function scene_importer_clicked_source(source, chapter, image, title) {
	console.log(`scene_importer_clicked_source(${source}, ${chapter}, ${image}, ${title})`);
	if (!window.recentlyVisitedSources) {
		read_recently_visited_scene_importer_sources();
	}
	const existingIndex = window.recentlyVisitedSources.findIndex(s => s.source === source);
	if (existingIndex >= 0) {
		const existing = window.recentlyVisitedSources.splice(existingIndex, 1)[0];
		if (typeof chapter === "string" && chapter.length > 0) {
			existing.chapter = chapter;
		}
		if (typeof image === "string" && image.length > 0) {
			existing.image = image;
		}
		if (typeof title === "string" && title.length > 0) {
			existing.title = title;
		}
		window.recentlyVisitedSources.unshift(existing);
	} else {
		window.recentlyVisitedSources.unshift({
			source: source,
			chapter: chapter || "",
			title: title || "",
			image: image || ""
		});
	}
	window.recentlyVisitedSources = window.recentlyVisitedSources.slice(0, 5); // limit this list to 5 items
	localStorage.setItem(`recentlyVisitedSources`, JSON.stringify(window.recentlyVisitedSources));
}

function clear_recently_visited_scene_importer_sources() {
	localStorage.removeItem(`recentlyVisitedSources`);
}

function read_recently_visited_scene_importer_sources() {
	window.recentlyVisitedSources = [];
	const recentlyVisitedSources = localStorage.getItem(`recentlyVisitedSources`);
	if (recentlyVisitedSources !== null) {
		window.recentlyVisitedSources = JSON.parse(recentlyVisitedSources);
	}
}


