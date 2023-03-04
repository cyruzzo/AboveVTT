
function consider_upscaling(target){
		if(target.hpps < 60 && target.hpps > 25){
			target.scale_factor=2;
			target.hpps *= 2;
			target.vpps *= 2;
			target.offsetx*=2;
			target.offsety*=2;
		}
		else if(target.hpps <=25){
			target.scale_factor=4;
			target.hpps *= 4;
			target.vpps *= 4;
			target.offsetx*=4;
			target.offsety*=4;
		}
		else{
			target.scale_factor=1;
		}
}

function preset_importer(target, key) {
	target.empty();
	let sel = $("<select/>");

	for (var i = 0; i < PRESET[key].length; i++) {
		cur = PRESET[key][i];
		o = $("<option/>");
		o.html(cur.title);
		o.val(i);
		sel.append(o);
	}

	import_button = $("<button>IMPORT</button>");

	import_button.click(function() {
		i = sel.val();
		scene = PRESET[key][i];

		if (typeof scene.player_map_is_video === 'undefined') {
			scene.player_map_is_video = "0";
		}
		if (typeof scene.dm_map_is_video === 'undefined') {
			scene.dm_map_is_video = "0";
		}

		$("#scene_properties input[name='player_map']").val(scene.player_map);
		$("#scene_properties input[name='dm_map']").val(scene.dm_map);
		$("#scene_properties input[name='player_map_is_video']").prop('checked', scene.player_map_is_video === "1");
		$("#scene_properties input[name='dm_map_is_video']").prop('checked', scene.dm_map_is_video === "1");
		$("#scene_properties input[name='title']").val(scene.title);
		$("#scene_properties input[name='scale']").val(scene.scale);

		$("#sources-import-iframe-container").remove();
	});

	target.append(sel);
	target.append(import_button);
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

	validate_image_input($(event.currentTarget).prev().find("input")[0])
}


function get_edit_form_data(){
	// bain todo, call image validation here and stop if it's not valid
	let data = {}
	$("#edit_scene_form").find("input, button.rc-switch").each(function() {
		const inputName = $(this).attr('name');
		let inputValue = $(this).val();

		if ( ((inputName === 'player_map') || (inputName==='dm_map')) ) {
			inputValue = parse_img(inputValue);
		}
		else if ($(this).is("button")){
			inputValue = $(this).hasClass("rc-switch-checked") ? "1" : "0"
		}
		
		data[inputName] = inputValue
	})
	return data
}

function validate_image_input(element){
	const self = element

	$(`#${self.name}_validator`).remove()
	// no value so can't validate, return early
	if (self.value?.length === 0) return
	if(self.value.startsWith("data:")){
		$(element).val("URLs that start with 'data:' will cause crashes. URL has been removed");
		return;
	}
	const img = parse_img(self.value)
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
		$(self).prev().attr("data-hover", "URL is ok. video validation coming soon")
		$(self).attr("data-valid", false)
	}
	let url
	try {
		url = new URL(img)
	} catch (_) {
		display_not_valid("URL is invalid")
		return
	}
	if ($("#player_map_is_video_toggle").hasClass("rc-switch-checked") || $("#dm_map_is_video_toggle").hasClass("rc-switch-checked")){
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
				rowInput = $(`<input type="text" onClick="this.select();" name=${name} style='width:100%' autocomplete="off" onblur="validate_image_input(this)" value="${scene[name] || "" }" />`);
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

	function handle_form_grid_on_change(){
		// not editting this scene, don't show live updates to grid
		if (scene.id !== window.CURRENT_SCENE_DATA.id){
			return
		}
	
		const {hpps, vpps, offsetx, offsety, grid_color, grid_line_width, grid_subdivided, grid} = get_edit_form_data()
		// redraw grid with new information
		if(grid === "1"){
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
	dialog = $(`<div id='edit_dialog' data-scene-id='${scene.id}'></div>`);
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

	template_section = $("<div id='template_section'/>");


	dialog.append(template_section);
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



	adjust_create_import_edit_container(dialog);

	var container = scene_properties;

	container.empty();

	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });

	var uuid_hidden = $("<input name='uuid' type='hidden'/>");
	uuid_hidden.val(scene['uuid']);
	form.append(uuid_hidden);

	form.append(form_row('title', 'Scene Title'))
	const playerMapRow = form_row('player_map', 'Map link', null, true)
	
	const dmMapRow = form_row('dm_map', 'DM Only Map', null, true)
	
	// add in toggles for these 2 rows
	playerMapRow.append(form_toggle("player_map_is_video", "Video map?", false, handle_map_toggle_click))
	playerMapRow.find('button').append($(`<div class='isvideotogglelabel'>link is video</div>`));
	playerMapRow.attr('title', `This map will be shown to everyone if DM map is off or only players if the DM map is on. If you are using your own maps you will have to upload them to a public accessible place. Eg. discord, imgur, dropbox, gdrive etc.`)
	
	dmMapRow.append(form_toggle("dm_map_is_video", "Video map?", false, handle_map_toggle_click))
	dmMapRow.find('button').append($(`<div class='isvideotogglelabel'>link is video</div>`));
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
						'Darkness filter',
						darknessFilterRange)
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

	
	wizard = $("<button type='button'><b>Super Mega Wizard</b></button>");
	manual_button = $("<button type='button'>Manual Grid Data</button>");

	grid_buttons = $("<div/>");
	grid_buttons.append(wizard);
	grid_buttons.append(manual_button);
	form.append(form_row('gridConfig', 'Grid Configuration', grid_buttons))
	form.find('#gridConfig_row').attr('title', '2 options for setting up the grid. A wizard that will allow you to visually and quickly set up the grid. And manual setings if you know the required sizes. Manual settings also include custom units and unit type eg. 5 ft.')
	var manual = $("<div id='manual_grid_data'/>");
	manual.append($("<div title='Grid square size in pixels. Width x Height.'><div style='display:inline-block; width:30%'>Grid size in original image</div><div style='display:inline-block;width:70%;'><input type='number' name='hpps'> X <input type='number' name='vpps'></div></div>"));
	manual.append($("<div title='Grid offset from the sides of the map in pixels. x offset, y offset.'><div style='display:inline-block; width:30%'>Offset</div><div style='display:inline-block;width:70%;'><input type='number' name='offsetx'> X <input type='number' name='offsety'></div></div>"));
	manual.append($("<div title='The size the ruler will measure a side of a square.'><div style='display:inline-block; width:30%'>Units per square</div><div style='display:inline-block; width:70'%'><input type='number' name='fpsq'></div></div>"));
	manual.append($("<div title='The unit of the ruler measurment.'><div style='display:inline-block; width:30%'>Distance Unit (i.e. feet)</div><div style='display:inline-block; width:70'%'><input name='upsq'></div></div>"));
	manual.append($("<div id='gridSubdividedRow' title='Each side of a grid square will be 2x the units per square. For example a units per square of 5 ft and split grid will make 10ft squares and size tokens appropriately. It will split each grid square into 4 small/medium creature locations used for snap to grid, the ruler etc.'><div style='display:inline-block; width:30%'>Large creature grid squares</div><div style='display:inline-block; width:70'%'><input style='display: none;' type='number' min='0' max='1' step='1' name='grid_subdivided'></div></div>"));
	manual.append($("<div title='This will multiply the dimensions of the map by the value input.'><div style='display:inline-block; width:30%'>Image Scale Factor</div><div style='display:inline-block; width:70'%'><input type='number' name='scale_factor'></div></div>"));
	manual.find('#gridSubdividedRow').append(form_toggle("gridSubdividedToggle",null, false,  function(event) {
		handle_basic_form_toggle_click(event);
		if ($(event.currentTarget).hasClass("rc-switch-checked")) {
			manual.find("#gridSubdividedRow input").val('1');
			
		} else {
			manual.find("#gridSubdividedRow input").val('0');
		}
	}));
	
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
	submitButton.click(function() {
		console.log("Saving scene changes")

		const formData = get_edit_form_data();
		for (key in formData) {
			scene[key] = formData[key];
		}

		const isNew = false;
		window.ScenesHandler.persist_scene(scene_id, isNew);
		$("#sources-import-main-container").remove();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();
		$(`.scene-item[data-scene-id='${window.ScenesHandler.scenes[scene_id].id}'] .dm_scenes_button`).click();
		did_update_scenes();
	});

	let grid_5 = function() {


		$("#scene_selector_toggle").show();
		$("#tokens").show();
		window.WIZARDING = false;
		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.grid_subdivided = "0";
		consider_upscaling(window.ScenesHandler.scene);
		window.ScenesHandler.persist_current_scene();
		window.ScenesHandler.reload();
		$("#wizard_popup").empty().append("You're good to go!!");
		$("#exitWizard").remove();
		$("#wizard_popup").delay(2000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
		$("#raycastingCanvas").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	};

	let grid_10 = function() {
		$("#wizard_popup").empty().append("Do you want me to subdivide the map grid in 2 so you can get correct token size? <button id='grid_divide'>Yes</button> <button id='grid_nodivide'>No</button>");

		$("#grid_divide").click(function() {
			window.WIZARDING = false;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			$("#wizard_popup").empty().append("You're good to go! AboveVTT is now super-imposing a grid that divides the original grid map in half. If you want to hide this grid just edit the manual grid data.");
			window.ScenesHandler.scene.grid_subdivided = "1";
			window.ScenesHandler.scene.fpsq = "5";
			window.ScenesHandler.scene.upsq = "ft";
			window.ScenesHandler.scene.hpps /= 2;
			window.ScenesHandler.scene.vpps /= 2;
			
			consider_upscaling(window.ScenesHandler.scene);
			
			$("#exitWizard").remove();
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			window.ScenesHandler.persist_current_scene();
			window.ScenesHandler.reload();
			$("#raycastingCanvas").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
		});

		$("#grid_nodivide").click(function() {
			window.WIZARDING = false;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			window.ScenesHandler.scene.snap = "1";
			window.ScenesHandler.scene.grid_subdivided = "0";
			window.ScenesHandler.scene.grid = "0";
			window.ScenesHandler.scene.fpsq = "10";
			window.ScenesHandler.scene.upsq = "ft";
			consider_upscaling(window.ScenesHandler.scene);
			window.ScenesHandler.persist_current_scene();
			window.ScenesHandler.reload();
			$("#exitWizard").remove();
			$("#wizard_popup").empty().append("You're good to go! Medium token will match the original grid size");
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			$("#raycastingCanvas").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
		});
	}

	let grid_15 = function() {
		window.WIZARDING = false;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale. We don't currently support overimposing a grid in this scale..'");
		window.ScenesHandler.scene.grid_subdivided = "0";
		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.hpps /= 3;
		window.ScenesHandler.scene.vpps /= 3;
		consider_upscaling(window.ScenesHandler.scene);
		$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
		window.ScenesHandler.persist_current_scene();
		$("#exitWizard").remove();
		window.ScenesHandler.reload();
		$("#raycastingCanvas").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	}


	let grid_20 = function() {
		window.WIZARDING = false;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale.");
		window.ScenesHandler.scene.grid_subdivided = "0";
		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.hpps /= 4;
		window.ScenesHandler.scene.vpps /= 4;
		consider_upscaling(window.ScenesHandler.scene);
		$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
		window.ScenesHandler.persist_current_scene();
		$("#exitWizard").remove();
		window.ScenesHandler.reload();
		$("#raycastingCanvas").css('visibility', 'visible');
		$("#darkness_layer").css('visibility', 'visible');
	}

	let align_grid = function(square = false, just_rescaling = true) {


		window.ScenesHandler.scenes[scene_id].scale_factor=1;		
    
		window.ScenesHandler.switch_scene(scene_id, function() {
			$("#tokens").hide();
			window.CURRENT_SCENE_DATA.grid_subdivided = "0";
			$("#VTT").css("--scene-scale", window.CURRENT_SCENE_DATA.scale_factor)
			var aligner1 = $("<canvas id='aligner1'/>");
			aligner1.width(59);
			aligner1.height(59);
			aligner1.css("position", "absolute");
			aligner1.css("border-radius", "50%");
			aligner1.css("top", ($("#scene_map").height() / 2) + "px");
			aligner1.css("left", ($("#scene_map").width() / 2) + "px");
			aligner1.css("z-index", 40);

			drawX = function(canvas) {

				var ctx = canvas.getContext("2d");

				ctx.strokeStyle = "red";
				ctx.lineWidth = 1;
				ctx.setLineDash([10, 10, 19, 10, 10]);
				ctx.beginPath();
				ctx.moveTo(29, 0);
				ctx.lineTo(29, 58);
				ctx.moveTo(0, 29);
				ctx.lineTo(58, 29);
				ctx.stroke();
			};

			var canvas1 = aligner1.get(0);

			var ctx = canvas1.getContext("2d");
			canvas1.width = 59;
			canvas1.height = 59;
			ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			ctx.fillRect(0, 0, canvas1.width, canvas1.height);
			if (square)
				ctx.fillStyle = "rgba(255,0,0,0.5)";
			else
				ctx.fillStyle = "rgba(0,255,0,0.5)";
			ctx.fillRect(0, 0, 59, 29);
			ctx.fillRect(0, 29, 29, 29);
			drawX(canvas1);

			var aligner2 = $("<canvas id='aligner2'/>");
			aligner2.width(59);
			aligner2.height(59);
			aligner2.css("position", "absolute");
			aligner2.css("border-radius", "50%");
			if (!just_rescaling) {
				aligner2.css("top", ($("#scene_map").height() / 2) + 150 + "px");
				aligner2.css("left", ($("#scene_map").width() / 2) + 150 + "px");
			}
			else {
				aligner2.css("top", ($("#scene_map").height() / 2) + 50 + "px");
				aligner2.css("left", ($("#scene_map").width() / 2) + 50 + "px");
			}
			aligner2.css("z-index", 40);

			var canvas2 = aligner2.get(0);
			canvas2.width = 59;
			canvas2.height = 59;
			var ctx = canvas2.getContext("2d");
			ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			ctx.fillRect(0, 0, canvas2.width, canvas2.height);
			ctx.fillStyle = "rgba(0,255,0,0.5)";
			ctx.fillRect(0, 29, 59, 29);
			ctx.fillRect(29, 0, 29, 29);
			drawX(canvas2);


			var pageX = Math.round(parseInt(aligner1.css('left')) * window.ZOOM - ($(window).width() / 2));
			var pageY = Math.round(parseInt(aligner1.css('top')) * window.ZOOM - ($(window).height() / 2));
			$("html,body").animate({
				scrollTop: pageY + 200,
				scrollLeft: pageX + 200,
			}, 500);

			let verticalMinorAdjustment = $(`<div id="verticalMinorAdjustment">
					<input type="range" name='verticalMinorAdjustmentInput' min="1" max="100" value="50" class="slider" id="verticalMinorAdjustmentInput" data-orientation="vertical">
					<label for="verticalMinorAdjustmentInput">Minor Vertical Adjustment</label>
					<button id="resetMinorVerticalAdjustmentRange">Reset</button>
			</div>`);
			let horizontalMinorAdjustment = $(`<div id="horizontalMinorAdjustment">
				 	<input type="range" name='horizontalMinorAdjustmentInput' min="1" max="100" value="50" class="slider" id="horizontalMinorAdjustmentInput">
					<label for="horizontalMinorAdjustmentInput">Minor Horizontal Adjustment</label>
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

			let regrid = function(e) {

				let al1 = {
					x: parseInt(aligner1.css("left")) + 29,
					y: parseInt(aligner1.css("top")) + 29,
				};

				let al2 = {
					x: parseInt(aligner2.css("left")) + 29,
					y: parseInt(aligner2.css("top")) + 29,
				};

				let adjustmentSliders = {
					x: (horizontalMinorAdjustment.find('input').val()-50)/10,
					y: (verticalMinorAdjustment.find('input').val()-50)/10,
				}


				if (just_rescaling) {
					ppsx = (al2.x - al1.x);
					ppsy = (al2.y - al1.y);
					offsetx = 0;
					offsety = 0;
				}
				else {
					ppsx = (al2.x - al1.x) / 3.0 + adjustmentSliders.x;
					ppsy = (al2.y - al1.y) / 3.0 + adjustmentSliders.y;
					offsetx = al1.x % ppsx;
					offsety = al1.y % ppsy;
				}
				console.log("ppsx " + ppsx + "ppsy " + ppsy + "offsetx " + offsetx + "offsety " + offsety)
				window.CURRENT_SCENE_DATA.hpps = Math.abs(ppsx);
				window.CURRENT_SCENE_DATA.vpps = Math.abs(ppsy);
				window.CURRENT_SCENE_DATA.offsetx = Math.abs(offsetx);
				window.CURRENT_SCENE_DATA.offsety = Math.abs(offsety);
				let width
				if (window.ScenesHandler.scene.upscaled == "1")
					width = 2;
				else
					width = 1;
				const dash = [30, 5]
				const color = "rgba(255, 0, 0,0.5)";
				// nulls will take the window.current_scene_data from above
				redraw_grid(null,null,null,null,color,width,null,dash)
			};

			let click2 = {
				x: 0,
				y: 0
			};
			aligner2.draggable({
				stop: regrid,
				start: function(event) {
					reset_canvas(); redraw_fog();
					click2.x = event.clientX;
					click2.y = event.clientY;
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {
					clear_grid()
					draw_wizarding_box()
					let zoom = window.ZOOM;

					let original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click2.x + original.left) / zoom),
						top: Math.round((event.clientY - click2.y + original.top) / zoom)
					};

					if (square) { // restrict on 45
						console.log("PRE");
						console.log(ui.position);
						var rad = Math.PI / 180;
						var angle;

						var offsetLeft = Math.round(ui.position.left - parseInt($("#aligner2").attr('original-left')));
						var offsetTop = Math.round(ui.position.top - parseInt($("#aligner2").attr('original-top')));

						var offset = {
							x: offsetLeft,
							y: offsetTop,
						};
						console.log(offset);
						var distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
						console.log("distanza " + distance);
						if (offset.y > 0)
							angle = 45 * rad;
						else
							angle = 225 * rad;


						ui.position.top = Math.sin(angle) * distance + parseInt($("#aligner2").attr('original-top'));
						console.log(Math.sin(angle) * distance);
						console.log(parseInt($("#aligner2").attr('original-top')));

						ui.position.left = Math.cos(angle) * distance + parseInt($("#aligner2").attr('original-left'));

						console.log(ui.position);
					}

				}
			});

			let click1 = {
				x: 0,
				y: 0
			};

			aligner1.draggable({
				stop: regrid,
				start: function(event) {
					reset_canvas();
					redraw_fog();
					click1.x = event.clientX;
					click1.y = event.clientY;
					$("#aligner1").attr('original-top', parseInt($(event.target).css("top")));
					$("#aligner1").attr('original-left', parseInt($(event.target).css("left")));
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {
					clear_grid()
					draw_wizarding_box()
					let zoom = window.ZOOM;

					let original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click1.x + original.left) / zoom),
						top: Math.round((event.clientY - click1.y + original.top) / zoom)
					};
					if (square) {
						var offsetLeft = Math.round(ui.position.left - parseInt($("#aligner1").attr('original-left')));
						var offsetTop = Math.round(ui.position.top - parseInt($("#aligner1").attr('original-top')));

						console.log("off " + offsetLeft + " " + offsetTop);

						$("#aligner2").css('left', (parseInt($("#aligner2").attr("original-left")) + offsetLeft) + "px");
						$("#aligner2").css('top', (parseInt($("#aligner2").attr("original-top")) + offsetTop) + "px");


					}
				}
			});


			$("#VTT").append(aligner1);
			$("#VTT").append(aligner2);


			wizard_popup = $("<div id='wizard_popup'></div>");
			wizard_popup.css("position", "fixed");
			wizard_popup.css("max-width", "800px");
			wizard_popup.css("top", "40px");
			wizard_popup.css("left", "250px");
			wizard_popup.css("z-index", "200px");
			wizard_popup.css("background", "rgba(254,215,62,0.8)");
			wizard_popup.css("font-size", "20px");



			if (!just_rescaling){
				wizard_popup.append("Move the pointers at the center of the map to define 3x3 Square on the map! ZOOM IN with the Top Right + button. <button id='step2btn'>Press when it's good enough</button>");
								
				verticalMinorAdjustment.find('input').on('change input',function(){
					regrid();
					console.log('verticalMinorAdjustment');

				});
				horizontalMinorAdjustment.find('input').on('change input',function(){
					regrid();
					console.log('horizontalMinorAdjustment');

				});
				wizard_popup.append(verticalMinorAdjustment);
				wizard_popup.append(horizontalMinorAdjustment);


			}
			else{
				wizard_popup.append("Set the green square to roughly the size of a medium token! <button id='step2btn'>Press when it's good enough</button>");
			}


			$("body").append(wizard_popup);
			$("#raycastingCanvas").css('visibility', 'hidden');
			$("#darkness_layer").css('visibility', 'hidden');
			wizard_popup.draggable({
				addClasses: false,
				scroll: false,
				containment: "#windowContainment",
				start: function() {
					$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
					$("#sheet").append($('<div class="iframeResizeCover"></div>'));
				},
				stop: function() {
					$('.iframeResizeCover').remove();
				}
			});
			regrid();


			wizard_popup.find("#step2btn").click(
				function() {
					aligner1.remove();
					aligner2.remove();

					$("#wizard_popup").empty().append("Nice!! How many units (i.e. feet) per square ? <button id='grid_5'>5</button> <button id='grid_10'>10</button> <button id='grid_15'>15</button> <button id='grid_20'>20</button>");
					$("#grid_5").click(function() { grid_5(); });
					$("#grid_10").click(function() { grid_10(); });
					$("#grid_15").click(function() { grid_15(); });
					$("#grid_20").click(function() { grid_20(); });
					$("#grid_100").click(function() { grid_100(); });
				

				}
			);
		});
	}; // END OF ALIGN GRID WIZARD!

	wizard.click(
		function() {

			const formData = get_edit_form_data();
			for (key in formData) {
				scene[key] = formData[key];
			}

			window.ScenesHandler.persist_scene(scene_id,true);
			window.ScenesHandler.switch_scene(scene_id);
			let copiedSceneData = $.extend(true, {}, window.CURRENT_SCENE_DATA);

			$("#VTT").css("--scene-scale", 1)

			$("#edit_dialog").remove();
			$("#scene_selector").removeAttr("disabled");
			$("#scene_selector_toggle").click();
			$("#scene_selector_toggle").hide();


			prewiz = $("<table id='prewiz'/>");
			prewiz.draggable({
				addClasses: false,
				scroll: false,
				containment: "#windowContainment",
				start: function() {
					$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
					$("#sheet").append($('<div class="iframeResizeCover"></div>'));
				},
				stop: function() {
					$('.iframeResizeCover').remove();
				}
			});
			prewiz.append("<tr><td><button id='align_grid'>Align to Grid</button></td><td>Use this if you're working on a pre-gridded map and you want all features to work (precise token size, measurament tool,grid snapping!)</td></tr>");
			prewiz.append("<tr><td><button id='create_grid'>Create Grid</button></td><td>Use this if you want advanced features on a map that don't have a grid!'</td></tr>");
			prewiz.append("<tr><td><button id='rescale'>Just Rescale the Image</button></td><td>Use this if you just wanna change the size of the image.. It's good for generic images, world maps, or if you don't care about features and just want to have fun quickly</td></tr>");

			prewiz.css("position", "fixed");
			prewiz.css("max-width", "800px");
			prewiz.css("top", "150px");
			prewiz.css("left", "250px");
			prewiz.css("z-index", "200px");
			prewiz.css("background", "rgba(254,215,62,1)");
			prewiz.css("font-size", "20px");
			$("body").append(prewiz);

			$("#align_grid").click(function() {
				$("#prewiz").remove();
				align_grid(false, false);
			});
			$("#create_grid").click(function() {
				$("#prewiz").remove();
				align_grid(true, false);
			});
			$("#rescale").click(function() {
				$("#prewiz").remove();
				align_grid(true, true)
			});

			let exitWizard = $(`<button id='exitWizard' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'>Cancel Wizard<button>`);
			$("body").append(exitWizard);
			exitWizard.on('click', function(){
				$("#prewiz").remove();
				$("#wizard_popup").remove();
				exitWizard.remove();
				$('#aligner1').remove();
				$('#aligner2').remove();
				window.WIZARDING = false;
				window.ScenesHandler.scenes[window.ScenesHandler.current_scene_id] = copiedSceneData;
				window.ScenesHandler.scene = copiedSceneData;
				window.CURRENT_SCENE_DATA = copiedSceneData;

				window.ScenesHandler.persist_current_scene();
				$("#raycastingCanvas").css('visibility', 'visible');
				$("#darkness_layer").css('visibility', 'visible');
				$("#tokens").show();
			});

		}
	);


	cancel = $("<button type='button'>Cancel</button>");
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


	/*var export_grid=$("<button>Send Grid Data to the Community</button>")
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
	validate_image_input($(playerMapRow).find("input")[0])
	validate_image_input($(dmMapRow).find("input")[0])
}

function display_sources() {
	$("#source_select").empty();
	$("#chapter_select").empty();
	$("#scene_select").empty();

	for (property in window.ScenesHandler.sources) {
		var source = window.ScenesHandler.sources[property];
		$("#source_select").append($("<option value='" + property + "'>" + source.title + "</option>"));
	}
}

function display_chapters() {
	$("#chapter_select").empty();
	$("#scene_select").empty();

	var source_name = $("#source_select").val();
	for (property in window.ScenesHandler.sources[source_name].chapters) {
		var chapter = window.ScenesHandler.sources[source_name].chapters[property];
		$("#chapter_select").append($("<option value='" + property + "'>" + chapter.title + "</option>"))
	}
	$("#chapter_select").change();


	const chapterSelectMenu = ddb_style_chapter_select(window.ScenesHandler.sources[source_name].chapters);
	$("#importer_toggles").append(chapterSelectMenu);
	$("#chapter_select").hide();
}

function display_scenes() {
	var source_name = $("#source_select").val();
	var chapter_name = $("#chapter_select").val();
	fill_importer(window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes, 0);
	console.log(window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes);
	console.log("mostrati...");
	/*$("#scene_select").empty();
	
	var source_name=$("#source_select").val();
	var chapter_name=$("#chapter_select").val();
	for(property in window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes){
				var scene=window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes[property];
				$("#scene_select").append($("<option value='"+property+"'>"+scene.title+"</option>"));
			}			
			$("#scene_select").change();*/
}

function ddb_style_chapter_select(chapters) {
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

function init_ddb_importer(target, selectedSource) {

	panel = $("<div id='scenes-panel' class='sidepanel-content'></div>");
	target.append(panel);


	var source_select = $("<select id='source_select'/>");
	source_select.css("display", "inline");
	if (selectedSource) {
		source_select.hide();
	}

	window.ScenesHandler.build_adventures(function() {
		display_sources();
		if (selectedSource) {
			$("#source_select").val(selectedSource).change();
		} else {
			$("#source_select").change();
		}
	});

	source_select.change(function() {
		$("#chapter_select").empty();
		$("#scenes_select").empty();
		$("#import_button").attr('disabled', 'disabled');
		var source_name = $("#source_select").val()
		window.ScenesHandler.build_chapters(source_name, display_chapters);
	});



	var chapter_select = $("<select id='chapter_select'/>");
	chapter_select.css("display", "inline");
	chapter_select.change(function() {
		$("#scene_select").empty();
		$("#import_button").attr('disabled', 'disabled');
		var source_name = $("#source_select").val();
		var chapter_name = $("#chapter_select").val();

		$("#importer_area").html("Loading........ please wait!");

		window.ScenesHandler.build_scenes(source_name, chapter_name, display_scenes);
	});

	/*	var scene_select=$("<select id='scene_select'/>");
	
		scene_select.change(function(){
			console.log('prepare scene properties');
			var source_name=$("#source_select").val();
			var chapter_name=$("#chapter_select").val();
			var scene_name=$("#scene_select").val();
			if(scene_name)
				$("#import_button").removeAttr('disabled');
			else
				$("#import_button").attr('disabled','disabled');
			//window.ScenesHandler.display_scene_properties(source_name,chapter_name,scene_name);
			
		});*/


	/*import_button=$("<button id='import_button'>IMPORT</button>");
	import_button.attr('disabled','disabled');
	
	import_button.click(function(){
		var source_name=$("#source_select").val();
		var chapter_name=$("#chapter_select").val();
		var scene_name=$("#scene_select").val();
		
		scene=window.ScenesHandler.sources[source_name].chapters[chapter_name].scenes[scene_name];
		$("#scene_properties input[name='player_map']").val(scene.player_map);
		$("#scene_properties input[name='dm_map']").val(scene.dm_map);
		$("#scene_properties input[name='title']").val(scene.title);
	});*/

	panel.append(source_select);
	panel.append(chapter_select);
	//panel.append($("<div/>").append(scene_select));
	//panel.append($("<div/>").append(import_button));


}

function fill_importer(scene_set, start, searchState = '') {
	area = $("#importer_area");
	area.empty();
	area.css("opacity", "0");
	area.animate({ opacity: "1" }, 300);

	var ddb_extra_found=false;
	totalPages = Math.max(1, Math.ceil(scene_set.length / 8));
	pageNumber = 1 + Math.ceil(start / 8)
	for (var i = start; i < Math.min(start + 8, scene_set.length); i++) {
		let current_scene = scene_set[i];

		if (current_scene.uuid in DDB_EXTRAS) {
			ddb_extra_found=true;
			for (prop in DDB_EXTRAS[current_scene.uuid]) {
				current_scene[prop] = DDB_EXTRAS[current_scene.uuid][prop];
			}
		}


		entry = $("<div/>");
		entry.css({
			float: "left",
			width: "180px",
			height: "200px",
			margin: "15px",
			border: "2px solid black",
			"border-radius": "5px 5px 5px 5px",
			'text-align': 'center',
		});
		img = $("<img>");
		img.css({
			'max-width': '160px',
			'max-height': '150px',

		});
		img.attr("src", scene_set[i].thumb);
		imgcont = $("<div/>").css({ width: '100%', height: '150px' });
		imgcont.append(img);

		title = $("<div style='width: 180px;font-weight:bold'></div>");
		title.text(current_scene.title);
		entry.append(title);

		entry.append(imgcont);
		stats = $("<div/>");
		stats.css("height", "15px");
		stats.css("width", "100%");

		if (scene_set[i].dm_map) {
			stats.append("<b style='background: lightblue; border 1px solid back; margin: 5px;' title='Has DM Map'>DM</b>");
		}

		if ((scene_set[i].snap == "1") || ddb_extra_found) {
			stats.append("<b style='background:gold; border 1px solid back; margin: 5px;' title='PRE-ALIGNED'>PRE-CONFIGURED!</b>");
		}
		entry.append(stats);

		b = $("<button>Import</button>");

		b.click(function() {
			var scene = current_scene;
			if($(`.importer_toggle[data-key="Tutorial Maps"][style*='background: red;']`).length>0){
				window.ScenesHandler.import_completed_scene_with_drawings(scene)
			}
			else{
				$("#scene_properties input[name='player_map']").val(scene.player_map);
				$("#scene_properties input[name='dm_map']").val(scene.dm_map);
				$("#scene_properties input[name='title']").val(scene.title);
				$("#scene_properties input[name='scale']").val(scene.scale);

				
				scene.player_map_is_video === "1" || scene.player_map.includes("youtube") ?
					$("#player_map_is_video_toggle").addClass('rc-switch-checked') : 
					$("#player_map_is_video_toggle").removeClass('rc-switch-checked')
				
			
				scene.dm_map_is_video === "1" ?
					$("dm_map_is_video_toggle").addClass('rc-switch-checked') : 
					$("dm_map_is_video_toggle").removeClass('rc-switch-checked')


				if (typeof scene.uuid !== "undefined")
					$("#scene_properties input[name='uuid']").val(scene.uuid);

				if (typeof scene.dm_map_usable !== "undefined")
					$("#scene_properties input[name='dm_map_usable']").val(scene.dm_map_usable);

				if (typeof scene.hpps !== "undefined")
					$("#scene_properties input[name='hpps']").val(scene.hpps);
				if (typeof scene.grid !== "undefined")
					$("#scene_properties input[name='grid']").val(scene.grid);
				if (typeof scene.vpps !== "undefined")
					$("#scene_properties input[name='vpps']").val(scene.vpps);
				if (typeof scene.snap !== "undefined")
					$("#scene_properties input[name='snap']").val(scene.snap);
				if (typeof scene.fpsq !== "undefined")
					$("#scene_properties input[name='fpsq']").val(scene.fpsq);
				if (typeof scene.upsq !== "undefined")
					$("#scene_properties input[name='upsq']").val(scene.upsq);
				if (typeof scene.offsetx !== "undefined")
					$("#scene_properties input[name='offsetx']").val(scene.offsetx);
				if (typeof scene.offsety !== "undefined")
					$("#scene_properties input[name='offsety']").val(scene.offsety);
				if (typeof scene.grid_subdivided !== "undefined")
					$("#scene_properties input[name='grid_subdivided']").val(scene.grid_subdivided);
				if (typeof scene.scale_factor !== "undefined")
					$("#scene_properties input[name='scale_factor']").val(scene.scale_factor);

				$("#mega_importer").remove();
			
				validate_image_input($("input[name=player_map]")[0])
				validate_image_input($("input[name=dm_map]")[0])
			}

			
		});

		entry.append($("<div>").append(b));
		area.append(entry);
	}

	footer = $("#importer_footer");
	footer.empty();

	prev = $("<button>PREV</button>");
	if (start == 0)
		prev.attr("disabled", "disabled");

	prev.click(function() {
		fill_importer(scene_set, start - 8, searchState);
	})

	next = $("<button>NEXT</button>");
	if (i == scene_set.length)
		next.attr("disabled", "disabled");
	next.click(function() {
		fill_importer(scene_set, start + 8, searchState);
	});

	buttons = $("<div/>");

	buttons.css("right", "0");
	buttons.css("position", "absolute");

	buttons.append(prev);
	buttons.append(next);
	buttons.addClass
	footer.append(buttons);


	let pageNumbersDiv = document.createElement('div');
	pageNumbersDiv.classList.add('page-number');

	let pageSelect = document.createElement('input');
	pageSelect.classList.add('styled-number-input');
	pageSelect.value = pageNumber;
	pageSelect.addEventListener('change', () => {
		const val = pageSelect.value;
		if (val && val >= 0 && val <= totalPages && val > 0) {
			fill_importer(scene_set, (val * 8) - 8, searchState);
		}
	})

	let totalPagesSpan = document.createElement('span');
	totalPagesSpan.innerText = `/ ${totalPages}`;
	totalPagesSpan.style.marginLeft = '5px';
	pageNumbersDiv.append(pageSelect);
	pageNumbersDiv.append(totalPagesSpan);
	footer.append(pageNumbersDiv);

	if(scene_set.length == 0){
		area.append(`<div style='border:none !important;'>There were no maps/handouts found in this chapter</div>`)
	}

	let mapSearchContainer = document.createElement('div');
	let mapSearchLabel = document.createElement('span');
	mapSearchLabel.innerText = "Search By Title: ";
	let mapSearchElement = document.createElement('input');
	mapSearchElement.value = searchState;
	mapSearchElement.addEventListener('change', () => {
		const value = mapSearchElement.value;
		if (value) {
			let clonedScenes = JSON.parse(JSON.stringify(scene_set));
			let filteredScenes = clonedScenes.filter(x => x.title.toLowerCase().includes(value.toLowerCase()));
			fill_importer(filteredScenes, start, value);
		} else {
			if($('#chapter_select').length > 0){
				display_scenes();
			}
			else{
				fill_importer(PRESET[$(`.importer_toggle[style*='background: red']`).attr('data-key')], 0);
			}
		}
	});
	mapSearchContainer.classList.add('mapSearch');
	mapSearchContainer.append(mapSearchLabel);
	mapSearchContainer.append(mapSearchElement);
	footer.append(mapSearchContainer);
}

function mega_importer(DDB = false, ddbSource) {
	container = $("<div id='mega_importer'/>");
	toggles = $("<div id='importer_toggles'/>");

	if (!DDB) {
		first = false;
		for (var i in PRESET) {
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
		init_ddb_importer(toggles, ddbSource);
	}
	container.append(toggles);
	area = $("<div id='importer_area'/>");
	container.append(area);
	bottom = $("<div id='importer_footer'/>").css({ height: "30px", width: "100%" });
	container.append(bottom);
	adjust_create_import_edit_container(container, false);
	if (!DDB){
		first.click();
	}
}




function default_scene_data() {
	return {
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
		reveals: [[0, 0, 0, 0, 2, 0]], // SPECIAL MESSAGE TO REVEAL EVERYTHING
		order: Date.now()
	};
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
		// create_scene_inside(RootFolder.Scenes.path);
		create_scene_root_container(RootFolder.Scenes.path);
	});

	let addFolderButton = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
	addFolderButton.on("click", function (clickEvent) {
		let numberOfNewFolders = window.sceneListFolders.filter(i => i.fullPath().startsWith("/New Folder") && i.isRootFolder()).length
		let newFolderName = "New Folder";
		if (numberOfNewFolders > 0) {
			newFolderName = `${newFolderName} ${numberOfNewFolders}`
		}
		let newFolderItem = SidebarListItem.Folder(path_to_html_id(RootFolder.Scenes.path, newFolderName), RootFolder.Scenes.path, newFolderName, true, path_to_html_id(RootFolder.Scenes.path));
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
	did_update_scenes();
	setTimeout(function () {
		expand_folders_to_active_scenes();
	}, 5000); // do better than this... or don't, it probably doesn't matter
}

/**
 * Updates and redraws the scene list in the sidebar
 */
function did_update_scenes() {
	if (!window.DM) return;

	// store this locally in case we run into the cloud bug that prevents the scenelist event from being sent down
	const sanitizedScenes = normalize_scene_urls(window.ScenesHandler.scenes);
	localStorage.setItem(`ScenesHandler${find_game_id()}`, JSON.stringify(sanitizedScenes));
	console.debug("did_update_scenes", `ScenesHandler${find_game_id()}`, sanitizedScenes);


	rebuild_scene_items_list();

	// Filters scene list by search input if scenes-panel is active
	const sceneSearchInput = $("#scenes-panel.selected-tab input[name='scene-search']");
	const sceneSearchTerm = (sceneSearchInput.length > 0) ? sceneSearchInput.val() : '';
	redraw_scene_list(sceneSearchTerm);
}

function rebuild_scene_items_list() {
	console.group("rebuild_scene_items_list");
	window.sceneListItems = window.ScenesHandler.scenes.map(s => SidebarListItem.Scene(s)).sort(SidebarListItem.sortComparator);
	// TODO: read scene folders from localStorage?
	if (!window.sceneListFolders) {
		window.sceneListFolders = [];
	}
	window.sceneListItems
		.sort(SidebarListItem.folderDepthComparator)
		.forEach(item => {
		if (item.folderPath !== RootFolder.Root.path) {
			// we split the path and backfill empty every folder along the way if needed. This is really important for folders that hold subfolders, but not items
			let parts = item.folderPath.split("/");
			let backfillPath = "";
			parts.forEach(part => {
				let fullBackfillPath = sanitize_folder_path(`${backfillPath}/${part}`);
				if (fullBackfillPath !== "" && fullBackfillPath !== "/" && fullBackfillPath !== RootFolder.Scenes.path && !window.sceneListFolders.find(fi => fi.fullPath() === fullBackfillPath)) {
					// we don't have this folder yet so add it
					let backfillItem = SidebarListItem.Folder(path_to_html_id(backfillPath, part), backfillPath, part, true, path_to_html_id(backfillPath));
					console.log("adding folder", backfillItem);
					window.sceneListFolders.push(backfillItem);
				} else {
					console.log("not adding folder", fullBackfillPath);
				}
				backfillPath = fullBackfillPath;
			});
		}
	});
	update_token_folders_remembered_state();
	console.groupEnd();
}

/**
 * clears and redraws the list of scenes in the sidebar
 * @param searchTerm {string} the search term used to filter the list of scenes
 */
function redraw_scene_list(searchTerm) {
	console.group("redraw_scene_list");

	let nameFilter = "";
	if (typeof searchTerm === "string") {
		nameFilter = searchTerm.toLowerCase();
	}

	// this is similar to the structure of a SidebarListItem.Folder row.
	// since we don't have root folders like the tokensPanel does, we want to treat the entire list like a subfolder
	// this will allow us to reuse all the folder traversing functions that the tokensPanel uses
	let list = $(`<div id="${path_to_html_id(RootFolder.Scenes.path)}" class="folder not-collapsible"><div class="folder-item-list" style="padding: 0;"></div></div>`);
	scenesPanel.body.empty();
	scenesPanel.body.append(list);
	set_full_path(list, RootFolder.Scenes.path);

	// first let's add all folders because we need the folder to exist in order to add items into it
	// don't filter folders by the searchTerm because we need the folder to exist in order to add items into it
	window.sceneListFolders
		.sort(SidebarListItem.folderDepthComparator)
		.forEach(item => {
			let row = build_sidebar_list_row(item);
			// let folder = find_html_row_from_path(item.folderPath, scenesPanel.body).find(` > .folder-item-list`);
			let folder = $(`#${item.parentId} > .folder-item-list`);
			if (folder.length > 0) {
				console.debug("appending folder item", item, folder);
				folder.append(row);
			} else {
				console.warn("Could not find a folder to append folder item to", item);
			}
		});

	// now let's add all the other items
	window.sceneListItems
		.sort(SidebarListItem.sortComparator)
		.filter(item => item.nameOrContainingFolderMatches(nameFilter))
		.forEach(item => {
			let row = build_sidebar_list_row(item);
			let folder = $(`#${item.parentId} > .folder-item-list`);
			// let folder = find_html_row_from_path(item.folderPath, scenesPanel.body).find(` > .folder-item-list`);
			if (folder.length > 0) {
				console.debug("appending scene item", item, folder);
				folder.append(row);
			} else {
				console.warn("Could not find a folder to append scene item to", item);
			}
		});

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

	console.groupEnd();
}

function create_scene_inside(fullPath) {

	let newSceneName = "New Scene";
	let newSceneCount = window.sceneListItems.filter(item => item.folderPath === fullPath && item.name.startsWith(newSceneName)).length;
	if (newSceneCount > 0) {
		newSceneName = `${newSceneName} ${newSceneCount}`;
	}

	let sceneData = default_scene_data();
	sceneData.title = newSceneName;
	sceneData.folderPath = fullPath.replace(RootFolder.Scenes.path, "");

	window.ScenesHandler.scenes.push(sceneData);
	window.ScenesHandler.persist_scene(window.ScenesHandler.scenes.length - 1,true);
	edit_scene_dialog(window.ScenesHandler.scenes.length - 1);
	did_update_scenes();
}

function create_scene_folder_inside(fullPath) {
	let newFolderName = "New Folder";
	let adjustedPath = sanitize_folder_path(fullPath.replace(RootFolder.Scenes.path, ""));
	let numberOfNewFolders = window.sceneListFolders.filter(i => sanitize_folder_path(i.folderPath.replace(RootFolder.Scenes.path, "")) === adjustedPath && i.name.startsWith(newFolderName)).length;
	if (numberOfNewFolders > 0) {
		newFolderName = `${newFolderName} ${numberOfNewFolders}`
	}
	let newFolderFullPath = sanitize_folder_path(`${RootFolder.Scenes.path}/${adjustedPath}`);
	let newFolderItem = SidebarListItem.Folder(path_to_html_id(newFolderFullPath, newFolderName), newFolderFullPath, newFolderName, true, path_to_html_id(newFolderFullPath));
	window.sceneListFolders.push(newFolderItem);
	did_update_scenes();
	display_folder_configure_modal(newFolderItem);
}

function rename_scene_folder(item, newName, alertUser) {
	console.group("rename_scene_folder");
	if (!item.isTypeFolder() || !item.folderPath.startsWith(RootFolder.Scenes.path)) {
		console.groupEnd();
		console.warn("rename_scene_folder called with an incorrect item type", item);
		if (alertUser !== false) {
			showDebuggingAlert();
		}
		return;
	}
	if (!item.canEdit()) {
		console.groupEnd();
		console.warn("rename_scene_folder Not allowed to rename folder", item);
		if (alertUser !== false) {
			showDebuggingAlert();
		}
		return;
	}


	let fromFullPath = sanitize_folder_path(item.fullPath().replace(RootFolder.Scenes.path, ""));
	let fromFolderPath = sanitize_folder_path(item.folderPath.replace(RootFolder.Scenes.path, ""));
	let toFullPath = sanitize_folder_path(`${fromFolderPath}/${newName}`);

	const newId = path_to_html_id(toFullPath);
	const existingFolder = window.sceneListFolders.find(f => f.id === newId);
	if (existingFolder !== undefined) {
		console.groupEnd();
		console.warn(`Attempted to rename folder to ${newName}, which would be have a path: ${toFullPath} but a folder with that path already exists. item: `, item, ", existingFolder: ", existingFolder);
		if (alertUser !== false) {
			alert(`An item with the name "${newName}" already exists at "${item.fullPath()}"`);
		}
		return;
	}


	console.log(`updating scenes from ${fromFullPath} to ${toFullPath}`);
	window.ScenesHandler.scenes.forEach((scene, index) => {
		if (scene.folderPath?.startsWith(fromFullPath)) {
			let newFolderPath = sanitize_folder_path(scene.folderPath.replace(fromFullPath, toFullPath));
			console.debug(`changing scene ${scene.title} folderPath from ${scene.folderPath} to ${newFolderPath}`);
			scene.folderPath = newFolderPath;
			window.ScenesHandler.persist_scene(index);
		} else {
			console.debug("not moving scene", scene);
		}
	});

	console.debug("before renaming folder", window.sceneListFolders);
	window.sceneListFolders.forEach(folder => {
		if (folder.fullPath() === item.fullPath()) {
			console.debug(`changing folder from ${folder.name} to ${newName}`);
			folder.name = newName;
			folder.id = path_to_html_id(folder.fullPath());
		} else if (folder.folderPath.startsWith(fromFullPath)) {
			let newFolderPath = sanitize_folder_path(folder.folderPath.replace(fromFullPath, toFullPath));
			console.debug(`changing folder ${folder.name} folderPath from ${folder.folderPath} to ${newFolderPath}`);
			folder.folderPath = newFolderPath;
			folder.id = path_to_html_id(folder.fullPath());
		} else {
			console.debug("not moving folder", folder);
		}
	});
	console.debug("after renaming folder", window.sceneListFolders);

	did_update_scenes();

	console.groupEnd();
	return toFullPath;
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

function expand_folders_to_active_scenes() {
	if (!window.DM || !window.CURRENT_SCENE_DATA || !window.sceneListItems || !window.PLAYER_SCENE_ID) {
		return;
	}
	let dmSceneItem = window.sceneListItems.find(i => i.sceneId === window.CURRENT_SCENE_DATA.id);
	if (dmSceneItem) {
		expand_all_folders_up_to_item(dmSceneItem);
	}
	let pcSceneItem = window.sceneListItems.find(i => i.sceneId === window.PLAYER_SCENE_ID);
	if (pcSceneItem) {
		expand_all_folders_up_to_item(pcSceneItem);
	}
}

function delete_scenes_within_folder(listItem) {
	console.group(`delete_scenes_within_folder`);
	let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(RootFolder.Scenes.path, ""));

	console.log("about to delete all scenes within", adjustedPath);
	console.debug("before deleting from scenes", window.ScenesHandler.scenes);
	window.ScenesHandler.scenes
		.filter(scene => scene.folderPath?.startsWith(adjustedPath))
		.forEach(scene => window.ScenesHandler.delete_scene(scene.id, false));
	console.debug("after deleting from scenes", window.ScenesHandler.scenes);

	console.log("about to delete all folders within", adjustedPath);
	console.debug("before deleting from window.sceneListFolders", window.sceneListFolders);
	window.sceneListFolders = window.sceneListFolders.filter(folder => !folder.folderPath.startsWith(adjustedPath))
	console.debug("after deleting from window.sceneListFolders", window.sceneListFolders);

	console.groupEnd();
}

function move_scenes_to_parent_folder(listItem) {
	console.group(`move_scenes_to_parent_folder`);
	let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(RootFolder.Scenes.path, ""));
	let oneLevelUp = sanitize_folder_path(listItem.folderPath.replace(RootFolder.Scenes.path, ""));

	console.debug("before moving scenes", window.ScenesHandler.scenes);
	window.ScenesHandler.scenes
		.filter(scene => scene.folderPath?.startsWith(adjustedPath))
		.forEach(scene => {
			scene.folderPath = oneLevelUp;
			let sceneIndex = window.ScenesHandler.scenes.findIndex(s => s.id === scene.id);
			window.ScenesHandler.persist_scene(sceneIndex);
		});
	console.debug("after moving scenes", window.ScenesHandler.scenes);

	console.log("about to move all folders within", adjustedPath);
	console.debug("before moving window.sceneListFolders", window.sceneListFolders);
	window.sceneListFolders
		.filter(folder => folder.folderPath.startsWith(adjustedPath) && folder.fullPath() !== listItem.fullPath()) // all subfolders, but don't move the folder we're moving out of
		.forEach(folder => folder.folderPath = sanitize_folder_path(folder.folderPath.replace(adjustedPath, oneLevelUp)))
	console.debug("after deleting from window.sceneListFolders", window.sceneListFolders);

	console.groupEnd();
}

function delete_scenes_folder(listItem) {
	console.debug("before moving window.sceneListFolders", window.sceneListFolders);
	window.sceneListFolders = window.sceneListFolders.filter(folder => folder.fullPath() !== listItem.fullPath())
	console.debug("after deleting from window.sceneListFolders", window.sceneListFolders);
}

function move_scene_to_folder(listItem, folderPath) {
	let sceneIndex = window.ScenesHandler.scenes.findIndex(s => s.id === listItem.sceneId);
	let scene = window.ScenesHandler.scenes[sceneIndex];
	scene.folderPath = sanitize_folder_path(folderPath.replace(RootFolder.Scenes.path, ""));
	window.ScenesHandler.persist_scene(sceneIndex);
}

function move_scenes_folder(listItem, folderPath) {
	console.group(`move_scenes_folder`);
	let fromPath = sanitize_folder_path(listItem.fullPath().replace(RootFolder.Scenes.path, ""));

	// move the actual item
	listItem.folderPath = sanitize_folder_path(folderPath.replace(RootFolder.Scenes.path, ""));
	listItem.id = path_to_html_id(listItem.fullPath());
	listItem.parentId = path_to_html_id(listItem.folderPath);
	let toPath = sanitize_folder_path(listItem.fullPath().replace(RootFolder.Scenes.path, ""));

	// move subfolders. This isn't exactly necessary since we'll just rebuild the list anyway, but any empty folders need to be updated
	window.sceneListFolders.forEach(f => {
		if (f.folderPath.startsWith(fromPath)) {
			f.folderPath = f.folderPath.replace(fromPath, toPath);
			f.id = path_to_html_id(f.fullPath());
			f.parentId = path_to_html_id(f.folderPath);
		}
	});

	// move all scenes within the folder
	window.ScenesHandler.scenes.forEach((scene, sceneIndex) => {
		if (scene.folderPath?.startsWith(fromPath)) {
			console.debug("before moving scene", scene);
			scene.folderPath = scene.folderPath.replace(fromPath, toPath);
			console.debug("after moving scene", scene);
			window.ScenesHandler.persist_scene(sceneIndex);
		}
	});

	console.groupEnd();
}

function load_sources_iframe_for_map_import() {

	const iframe = $(`<iframe id='sources-import-iframe'></iframe>`);


	adjust_create_import_edit_container(iframe, true);
	$('#sources-import-content-container').append(build_combat_tracker_loading_indicator('One moment while we load DnDBeyond Sources'));

	iframe.off("load").on("load", function (event) {
		if (!this.src) return; // it was just created. no need to do anything until it actually loads something
		// hide DDB header and footer content.
		const sourcesBody = $(event.target).contents();
		sourcesBody.find('head').append(`<style id='dndbeyondSourcesiFrameStyles' type="text/css">
			#site-main,
			.single-column #content{
				padding: 0px !important;
			} 
			header[role='banner'],
			#site-main > .site-bar,
			#site-main > header.page-header,
			#mega-menu-target,
			footer,
			.ad-container,
			.ddb-site-banner{
				display:none !important;
			}
			.ddb-collapsible-filter{
				top:0px;
				position:sticky !important;
			}
			</style>`);
		$('#sources-import-content-container').find(".sidebar-panel-loading-indicator").remove();

		// hijack the links and open our importer instead
		sourcesBody.find("a.sources-listing--item").click(function (event) {
			event.stopPropagation();
			event.preventDefault();
			const sourceAbbreviation = event.currentTarget.href.split("/").pop();
			mega_importer(true, sourceAbbreviation);
			iframe.hide();
		});	
	});

	iframe.attr("src", `/sources`);
}

function adjust_create_import_edit_container(content='', empty=true, title=''){
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
		const mainContainer = $(`<div id="sources-import-main-container"></div>`);
		mainContainer.append(`<link class="ddb-classes-page-stylesheet" rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/blocks/css/compiled.css" >`);
		mainContainer.append(`<link class="ddb-classes-page-stylesheet"  rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/content/1-0-2416-0/skins/waterdeep/css/compiled.css" >`);
		const titleBar = floating_window_title_bar("sources-import-iframe-title-bar", title);
		mainContainer.prepend(titleBar);
		titleBar.find(".title-bar-exit").click(function() {
			$("#sources-import-main-container").remove();
			$("#mega_importer").remove();
		});
		const contentContainer = $(`<div id="sources-import-content-container"></div>`);
		contentContainer.append(content);
		mainContainer.append(contentContainer);
		mainContainer.draggable({
			addClasses: false,
			scroll: false,
			containment: "#windowContainment",
			start: function() {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function() {
				$('.iframeResizeCover').remove();
			}
		});
		$(document.body).append(mainContainer);
	}
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

function create_scene_root_container(fullPath) {
	const container = $(`<div class="create-scene-container" data-folder-path="${encode_full_path(fullPath)}"></div>`);
	const ddb = $(`<button>DDB Maps</button>`);
	const free = $(`<button>Free Maps</button>`);
	const custom = $(`<button>Custom URL</button>`);
	container.append(ddb);
	container.append(free);
	container.append(custom);
	ddb.click(function () {
		load_sources_iframe_for_map_import();
	});
	free.click(function() {
		test_tutorial();
	});
	custom.click(function() {
		create_scene_inside(fullPath);
	});
	adjust_create_import_edit_container(container, true);
}

function build_scene_import_list_item(name, imageUrl) {
	// This is taken straight from DDB /sources
	// DDB sets data-collapsible-search="BR|Basic Rules|Sourcebook". We currently just use the name, but we could allow shorthand like they do. Maybe we could do "${name}|Tutorial" or "${name}|Neutral Party"
	// Anyway, we need to update our search mechanism to grab all "li.sources-listing--item-wrapper", and hide any that don't partially match `data-collapsible-search`
	return $(`<li class="sources-listing--item-wrapper j-collapsible__item" data-collapsible-search="${name}">
    <a href="sources/basic-rules" class="sources-listing--item">
        <div class="sources-listing--item--avatar" style="background-image: url('${imageUrl}');"></div>
        <div class="sources-listing--item--title">${name}</div>
    </a>
	</li>`);
}

function test_tutorial() {

	// const importerArea = $("#importer_area");
	// importerArea.empty();
	// importerArea.css({
	// 	"overflow-y": "auto",
	// 	"height": "100%"
	// });
	// $("#importer_footer").hide();
	// $("#importer_toggles").hide();

	const container = build_import_container();
	// importerArea.append(container);

	const tutorialSection = build_import_collapsible_section("AboveVTT Tutorials", `${window.EXTENSION_PATH}assets/avtt-logo.png`);
	container.find(".no-results").before(tutorialSection);

	const theTavernDescription = `
		<p>Learn the basics of AboveVTT by exploring The Tavern!<br><strong>This Tutorial Covers:</strong></p>
		<p class="characters-statblock" style="font-family: Roboto Condensed; font-size: 14px">&bull; Tools<br>&bull; Tokens<br>&bull; Scene Creation</p>
	`;
	const theTavern = build_tutorial_import_list_item(
		"The Tavern",
		"https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
		["tools", "tokens", "scenes"],
		theTavernDescription
	);
	tutorialSection.find("ul").append(theTavern);

	adjust_create_import_edit_container(container, true);
}

function build_tutorial_import_list_item(name, imageUrl, additionalSearchTerms, descriptionHtml) {
	let searchTerms = `${name}`;
	if (Array.isArray(additionalSearchTerms) && additionalSearchTerms.length > 0) {
		searchTerms += "|"
		searchTerms += additionalSearchTerms.join("|");
	}
	const listItem = $(`
		<li class="j-collapsible__item listing-card" data-collapsible-search="${searchTerms}">
    	<div class="listing-card__content">
        <a href="${imageUrl}" target="_blank" class="listing-card__link">
					
					<div class="listing-card__bg" style="background-image: url('${imageUrl}');background-size: cover;background-position: center;"></div>
					
					<div class="listing-card__body" style="white-space: normal">
						<div class="listing-card__header">
							<img class="listing-card__icon" src="${window.EXTENSION_PATH}assets/avtt-logo.png" alt="logo" />
							<div class="listing-card__header-primary">
								<h3 class="listing-card__title">${name}</h3>
								<div class="listing-card__source">Tutorial</div>
							</div>
						</div>
					
						<div class="listing-card__description">
							${descriptionHtml || ""}
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
		alert("build the import functionality!");

	});
	listItem.find("a.listing-card__link").magnificPopup({
		type: 'image'
	});
	return listItem;
}

function build_import_container() {
	return $(`
	<div class="container">
  <div id="content" class="main content-container">
    <section class="primary-content" role="main">


      <div class="static-container">

        <div class="ddb-collapsible-filter j-collapsible__search">
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
	return section;
}
