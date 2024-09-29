// Helper functions to check max map size - data from https://github.com/jhildenbiddle/canvas-size
function get_canvas_max_length() {
	let browser = get_browser();

	if (browser.mozilla) {
		// Firefox
		return 32767;		
	} else if (browser.msie) {
		// IE
		if (browser >= '11.0') {
			return 16384;
		} else {
			return 8192;
		}
	} else if (!browser.opera) {
		// Chrome
		if (browser.version >= '73.0') {
			return 65535;
		} else {
			return 32767;
		}
	} else {
		// Unsupported
		return 32767;
	}
}

function get_canvas_max_area() {
	let browser = get_browser();
	let max_area = 0;

	if (browser.mozilla) {
		// Firefox
		max_area = (11180 * 11180);
	} else if (browser.msie) {
		// IE
		max_area = (8192 * 8192);		
	} else if (!browser.opera) {
		// Chrome
		max_area = (16384 * 16384);
	} else {
		// Unsupported
		max_area = (16384 * 16384);
	}

	console.log("Browser detected as " + browser.name + " with version " + browser.version);
	return max_area;
}

class ScenesHandler { // ONLY THE DM USES THIS OBJECT

	reload(callback = null) { //This is still used for grid wizard loading since we load so many times.
		this.switch_scene(this.current_scene_id, null);
	}

	async switch_scene(sceneid, callback = null) { //This is still used for grid wizard loading since we load so many times. -- THIS FUNCTION SHOULD DIE AFTER EVERYTHING IS IN THE CLOUD
		
		let grid_5 = function() {
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			window.WIZARDING = false;
			window.CURRENT_SCENE_DATA = {
				...window.CURRENT_SCENE_DATA,
				upsq: "ft",
				fpsq: "5",
				grid_subdivided: "0"
			}
			consider_upscaling(window.CURRENT_SCENE_DATA);
			window.ScenesHandler.persist_current_scene();
			$("#wizard_popup").empty().append("You're good to go!!");
			$("#exitWizard").remove();
			$("#wizard_popup").delay(2000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			$("#light_container").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
		};

		let grid_10 = function() {
			$("#wizard_popup").empty().append("Do you want me to subdivide the map grid in 2 so you can get correct token size? <button id='grid_divide'>Yes</button> <button id='grid_nodivide'>No</button>");

			$("#grid_divide").click(function() {
				window.WIZARDING = false;
				$("#scene_selector_toggle").show();
				$("#tokens").show();
				$("#wizard_popup").empty().append("You're good to go! AboveVTT is now super-imposing a grid that divides the original grid map in half. If you want to hide this grid just edit the manual grid data.");
				window.CURRENT_SCENE_DATA = {
					...window.CURRENT_SCENE_DATA,
					hpps: window.CURRENT_SCENE_DATA.hpps/2,
					vpps: window.CURRENT_SCENE_DATA.vpps/2,
					upsq: "ft",
					fpsq: "5",
					grid_subdivided: "1"
				}
				consider_upscaling(window.CURRENT_SCENE_DATA);
				$("#exitWizard").remove();
				$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
					$("#wizard_popup").remove();
				});
				window.ScenesHandler.persist_current_scene();
				$("#light_container").css('visibility', 'visible');
				$("#darkness_layer").css('visibility', 'visible');
			});

			$("#grid_nodivide").click(function() {
				window.WIZARDING = false;
				$("#scene_selector_toggle").show();
				$("#tokens").show();
				window.CURRENT_SCENE_DATA= {
					...window.CURRENT_SCENE_DATA,
					upsq: "ft",
					fpsq: "10",
					grid_subdivided: "0",
					snap: "1",
					grid: "0"
				}
				consider_upscaling(window.CURRENT_SCENE_DATA);
				window.ScenesHandler.persist_current_scene();
				$("#exitWizard").remove();
				$("#wizard_popup").empty().append("You're good to go! Medium token will match the original grid size");
				$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
					$("#wizard_popup").remove();
				});
				$("#light_container").css('visibility', 'visible');
				$("#darkness_layer").css('visibility', 'visible');
			});
		}

		let grid_15 = function() {
			window.WIZARDING = false;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale. We don't currently support overimposing a grid in this scale..'");
			window.CURRENT_SCENE_DATA = {
				...window.CURRENT_SCENE_DATA,
				hpps: window.CURRENT_SCENE_DATA.hpps/3,
				vpps: window.CURRENT_SCENE_DATA.vpps/3,
				upsq: "ft",
				fpsq: "5",
				grid_subdivided: "0"
			}
			consider_upscaling(window.CURRENT_SCENE_DATA);
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			window.ScenesHandler.persist_current_scene();
			$("#exitWizard").remove();
			$("#light_container").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
		}


		let grid_20 = function() {
			window.WIZARDING = false;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale.");
			window.CURRENT_SCENE_DATA = {
				...window.CURRENT_SCENE_DATA,
				hpps: window.CURRENT_SCENE_DATA.hpps/4,
				vpps: window.CURRENT_SCENE_DATA.vpps/4,
				upsq: "ft",
				fpsq: "5",
				grid_subdivided: "0"
			}
			consider_upscaling(window.CURRENT_SCENE_DATA);
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			window.ScenesHandler.persist_current_scene();
			$("#exitWizard").remove();
			$("#light_container").css('visibility', 'visible');
			$("#darkness_layer").css('visibility', 'visible');
		}

		let align_grid = function(square = false, just_rescaling = true, copiedSceneData) {


		
	    
			$("#tokens").hide();

			window.CURRENT_SCENE_DATA.grid_subdivided = "0";
			$("#VTT").css("--scene-scale", window.CURRENT_SCENE_DATA.scale_factor)
			let aligner1 = $("<canvas id='aligner1'/>");
			aligner1.width(59);
			aligner1.height(59);
			aligner1.css("position", "absolute");
			aligner1.css("border-radius", "50%");
			aligner1.css("top", Math.floor($("#scene_map").height() / copiedSceneData.vpps) / 2 * copiedSceneData.vpps + copiedSceneData.offsety - 29 + "px");
			aligner1.css("left", Math.floor($("#scene_map").width() / copiedSceneData.hpps) / 2  * copiedSceneData.hpps + copiedSceneData.offsetx - 29 + "px");
			aligner1.css("z-index", 40);

			let drawX = function(canvas) {

				let ctx = canvas.getContext("2d");

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

			let canvas1 = aligner1.get(0);

			let ctx = canvas1.getContext("2d");
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

			let aligner2 = $("<canvas id='aligner2'/>");
			aligner2.width(59);
			aligner2.height(59);
			aligner2.css("position", "absolute");
			aligner2.css("border-radius", "50%");
			if (!just_rescaling) {
				aligner2.css("top", parseFloat(aligner1.css('top')) + copiedSceneData.vpps*3 + "px");
				aligner2.css("left", parseFloat(aligner1.css('left')) + copiedSceneData.hpps*3  + "px");
			}
			else {
				aligner2.css("top", parseFloat(aligner1.css('top')) + copiedSceneData.vpps*3 + "px");
				aligner2.css("left", parseFloat(aligner1.css('left')) + copiedSceneData.hpps*3 + "px");
			}
			aligner2.css("z-index", 40);

			let canvas2 = aligner2.get(0);
			canvas2.width = 59;
			canvas2.height = 59;
			ctx = canvas2.getContext("2d");
			ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			ctx.fillRect(0, 0, canvas2.width, canvas2.height);
			ctx.fillStyle = "rgba(0,255,0,0.5)";
			ctx.fillRect(0, 29, 59, 29);
			ctx.fillRect(29, 0, 29, 29);
			drawX(canvas2);


			let pageX = Math.round(parseInt(aligner1.css('left')) * window.ZOOM - ($(window).width() / 2));
			let pageY = Math.round(parseInt(aligner1.css('top')) * window.ZOOM - ($(window).height() / 2));
			$("html,body").animate({
				scrollTop: pageY + window.VTTMargin,
				scrollLeft: pageX + window.VTTMargin
			}, 500);


			let regrid = function(e) {

				window.CURRENT_SCENE_DATA.grid_subdivided = '0';

				let al1 = {
					x: parseInt(aligner1.css("left")) + 29,
					y: parseInt(aligner1.css("top")) + 29,
				};

				let al2 = {
					x: parseInt(aligner2.css("left")) + 29,
					y: parseInt(aligner2.css("top")) + 29,
				};

				let adjustmentSliders = {
					x: ($('#horizontalMinorAdjustmentInput').val()-50)/10,
					y: ($('#verticalMinorAdjustmentInput').val()-50)/10,
				}

				let ppsx;
				let ppsy;
				let offsetx;
				let offsety;
				let numberOfGrid = ($("#gridType input:checked").val() != 1) ? 2 : 3
				if (just_rescaling) {
					ppsx = (al2.x - al1.x);
					ppsy = (al2.y - al1.y);
					offsetx = 0;
					offsety = 0;
				}
				else {
					ppsx = (al2.x - al1.x) / numberOfGrid;
					ppsy = (al2.y - al1.y) / numberOfGrid;
					if(window.CURRENT_SCENE_DATA.gridType == 1){
						ppsx += adjustmentSliders.x;
						ppsy += adjustmentSliders.y;
					}
					
					
					if($('#gridType input:checked').val() == 3){
						ppsy = ppsx;
					}
					else if($('#gridType input:checked').val() == 2){
						ppsx = ppsy;
					}

					offsetx = al1.x % ppsx;
					offsety = al1.y % ppsy;
				}

				const a = 2 * Math.PI / 6;
				let difference;
				if($('#gridType input:checked').val() == 3){			
						offsety = al1.y % (ppsx/1.5 * Math.sin(a)*2);
						 
						offsetx = al1.x % ppsx/1.5 * (1 + Math.cos(a))
						difference = (Math.ceil((al1.x / ppsx/1.5 * (1 + Math.cos(a))))+1)%2
						offsety += ppsx/1.5 * Math.sin(a)*difference
				}
				if($('#gridType input:checked').val() == 2){				
						offsetx = (al1.x % (ppsx/1.5 * Math.sin(a)*2));							
						offsety = al1.y % ppsx/1.5 * (1 + Math.cos(a))
						difference = (Math.ceil((al1.y / ppsx/1.5 * (1 + Math.cos(a))))+1)%2
						offsetx += ppsx/1.5 * Math.sin(a)*difference
				}
				
				console.log("ppsx " + ppsx + "ppsy " + ppsy + "offsetx " + offsetx + "offsety " + offsety)
				window.CURRENT_SCENE_DATA.hpps = Math.abs(ppsx);
				window.CURRENT_SCENE_DATA.vpps = Math.abs(ppsy);
				window.CURRENT_SCENE_DATA.offsetx = Math.abs(offsetx);
				window.CURRENT_SCENE_DATA.offsety = Math.abs(offsety);
				if(window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1){
					window.CURRENT_SCENE_DATA.scaleAdjustment = {
						x: 1 + adjustmentSliders.x/10,
						y: 1 + adjustmentSliders.y/10
					}
				}
				if($("#edit_dialog").length != 0){
					$('#squaresWide').val(`${$('#scene_map').width()/window.CURRENT_SCENE_DATA.hpps}`)
					$('#squaresTall').val(`${$('#scene_map').height()/window.CURRENT_SCENE_DATA.vpps}`)					
					$('input[name="offsetx"]').val(`${window.CURRENT_SCENE_DATA.offsetx}`)
					$('input[name="offsety"]').val(`${window.CURRENT_SCENE_DATA.offsety}`)
					$('input[name="offsetx"]').attr('data-prev-value', window.CURRENT_SCENE_DATA.offsetx);
					$('input[name="offsety"]').attr('data-prev-value', window.CURRENT_SCENE_DATA.offsety);
				}

				let width
				if (window.ScenesHandler.scene.upscaled == "1")
					width = 2;
				else
					width = 1;
				const dash = [30, 5]
				const color = "rgba(255, 0, 0,0.5)";
				// nulls will take the window.current_scene_data from above
				window.CURRENT_SCENE_DATA.gridType = $('#gridType input:checked').val();
				if(window.CURRENT_SCENE_DATA.gridType == 1){
					redraw_grid(null,null,null,null,color,width,null,dash)
				}
				else if(window.CURRENT_SCENE_DATA.gridType == 2){
					redraw_hex_grid(null,null,null,null,color,width,null,dash,false)
				}
				else if(window.CURRENT_SCENE_DATA.gridType == 3){
					redraw_hex_grid(null,null,null,null,color,width,null,dash,true)
				}
				
			};

			let click2 = {
				x: 0,
				y: 0
			};
			aligner2.draggable({
				stop: regrid,
				start: function(event) {
					click2.x = event.clientX;
					click2.y = event.clientY;
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {
					clear_grid()
					
					let zoom = window.ZOOM;

					let original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click2.x + original.left) / zoom),
						top: Math.round((event.clientY - click2.y + original.top) / zoom)
					};

					if ($('#gridType input:checked').val() != 1) {
						
							let left = parseInt($("#aligner1").css('left')) + parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))
							left = (parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))) < 25 ? parseInt($("#aligner1").css('left')) + 25 : left
							let top = (parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))) < 25 ? parseInt($("#aligner1").css('top')) + 25 : Math.round((event.clientY - click2.y + original.top) / zoom);
					
							ui.position = {
								left: left,
								top: top
							};
						draw_wizarding_box()
					}
					else if($('#linkAligners input').val() == 1){
							let left;
							let top;
							if(ui.position.top - parseInt($("#aligner1").css('top')) > ui.position.left - parseInt($("#aligner1").css('left'))){
								left = parseInt($("#aligner1").css('left')) + parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))
								left = (parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))) < 25 ? parseInt($("#aligner1").css('left')) + 25 : left
								top = (parseInt($(event.target).css("top")) - parseInt($("#aligner1").css('top'))) < 25 ? parseInt($("#aligner1").css('top')) + 25 : Math.round((event.clientY - click2.y + original.top) / zoom);
							}
							else {
								top = parseInt($("#aligner1").css('top')) + parseInt($(event.target).css("left")) - parseInt($("#aligner1").css('left'))
								top = (parseInt($(event.target).css("left")) - parseInt($("#aligner1").css('left'))) < 25 ? parseInt($("#aligner1").css('top')) + 25 : top
								left = (parseInt($(event.target).css("left")) - parseInt($("#aligner1").css('left'))) < 25 ? parseInt($("#aligner1").css('left')) + 25 : Math.round((event.clientX - click2.x + original.left) / zoom);						
							}


							ui.position = {
								left: left,
								top: top
							};
						draw_wizarding_box()
					}
					else {			
						draw_wizarding_box()
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
					click1.x = event.clientX;
					click1.y = event.clientY;
					$("#aligner1").attr('original-top', parseInt($(event.target).css("top")));
					$("#aligner1").attr('original-left', parseInt($(event.target).css("left")));
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {
					clear_grid()

					let zoom = window.ZOOM;

					let original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click1.x + original.left) / zoom),
						top: Math.round((event.clientY - click1.y + original.top) / zoom)
					};

					
					if ($('#gridType input:checked').val() != 1 || $('#linkAligners input').val() == 1) { // restrict on 45
						let originalDiff = {
							x:parseInt($("#aligner2").attr('original-left')) - parseInt($("#aligner1").attr('original-left')),
							y:parseInt($("#aligner2").attr('original-top')) - parseInt($("#aligner1").attr('original-top'))
						}
						$("#aligner2").css('left', `${parseInt($("#aligner1").css('left')) + originalDiff.x}px`);
						$("#aligner2").css('top', `${parseInt($("#aligner1").css('top')) + originalDiff.y}px`);
						draw_wizarding_box()

					}
					else {
						draw_wizarding_box()
					}
				}
			});


			$("#VTT").append(aligner1);
			$("#VTT").append(aligner2);

			open_grid_wizard_controls(sceneid, aligner1, aligner2, regrid, copiedSceneData);

			$("#light_container, #darkness_layer, #raycastingCanvas").css('visibility', 'hidden');
			
			regrid();


		}; // END OF ALIGN GRID WIZARD!

		this.current_scene_id = sceneid;
		let self = this;
		let scene = this.scenes[sceneid];
		this.scene = scene;
		if(!scene.id){
			scene.id=uuid();
		}

		if (typeof scene.player_map_is_video === 'undefined') {
			scene.player_map_is_video = "0";
		}
		if (typeof scene.dm_map_is_video === 'undefined') {
			scene.dm_map_is_video = "0";
		}

		window.CURRENT_SCENE_DATA = scene;

		$(".VTTToken, .door-button").each(function() {
			$("#aura_" + $(this).attr("data-id").replaceAll("/", "")).remove();
			$("#light_" + $(this).attr("data-id").replaceAll("/", "")).remove();
			$(`.aura-element-container-clip[id='${$(this).attr("data-id")}']`).remove();
		});
		$(".VTTToken").remove();
		$('#raycastingCanvas').css('opacity', '0');
		$('#scene_map_container').css('background', '#fff');
		for (let i in window.TOKEN_OBJECTS) {
			delete window.TOKEN_OBJECTS[i];
		}
		window.lineOfSightPolygons = {};

		if (scene.grid_subdivided == "1")
			scene.grid = "1";


		if (!scene.hpps) { // THIS IS OLD DATA FROM < 0.0.20!!! WE NEED TO COMPLETE WHAT IS MISSING and TRY TO FIX IT :()
			console.log("converting pre 0.0.20 scene.... Good lock to you, oh brave adventurer")
			scene.hpps = Math.round((6000.0 / scene.scale));
			scene.vpps = scene.hpps;
			scene.offsetx = 0;
			scene.offsety = 0;
			scene.grid = 0;
			scene.snap = 0;
			scene.fpsq = 5;
			scene.upsq = 'ft'

			for (let id in scene.tokens) { // RESCALE ALL THE TOKENS
				let tok_options = scene.tokens[id];
				tok_options.size = (tok_options.size / 60) * scene.hpps;
				tok_options.top = Math.round(parseInt(tok_options.top) / (scene.scale / 100.0)) + "px";
				tok_options.left = Math.round(parseInt(tok_options.left) / (scene.scale / 100.0)) + "px";
			}

			// RESCALE THE REVEALS
			for (let i = 0; i < scene.reveals.length; i++) {
				scene.reveals[i][0] = Math.round((scene.reveals[i][0] / 60.0) * scene.hpps);
				scene.reveals[i][1] = Math.round((scene.reveals[i][1] / 60.0) * scene.hpps);
				scene.reveals[i][2] = Math.round((scene.reveals[i][2] / 60.0) * scene.hpps);
				scene.reveals[i][3] = Math.round((scene.reveals[i][3] / 60.0) * scene.hpps);
			}


		}

		scene.vpps = parseFloat(scene.vpps);
		scene.hpps = parseFloat(scene.hpps);
		scene.offsetx = parseFloat(scene.offsetx);
		scene.offsety = parseFloat(scene.offsety);

		let copiedSceneData = {
			...$.extend(true, {}, window.CURRENT_SCENE_DATA),
			hpps: window.CURRENT_SCENE_DATA.hpps,
			vpps: window.CURRENT_SCENE_DATA.vpps,
			offsetx: window.CURRENT_SCENE_DATA.offsetx,
			offsety: window.CURRENT_SCENE_DATA.offsety
		}

		scene.scale_factor = 1;
		scene.grid_subdivided = '0';

		// CALCOLI DI SCALA non dovrebbero servire piu''
		scene['scale'] = (60.0 / parseInt(scene['hpps'])) * 100; // for backward compatibility, this will be horizonat scale
		scene['scaleX'] = (60.0 / parseInt(scene['hpps'])); // for backward compatibility, this will be horizonat scale
		scene['scaleY'] = (60.0 / parseInt(scene['vpps'])); // for backward compatibility, this will be horizonat sca

		$("#tokens").show();
		$("#grid_overlay").show();


		if (self.scene.fog_of_war == 1) {
			window.FOG_OF_WAR = true;
			//$("#fog_overlay").show();
			window.REVEALED = [[0, 0, 0, 0, 2, 0]].concat(self.scene.reveals);
		}
		else {
			window.FOG_OF_WAR = false;
			window.REVEALED = [];
			//$("#fog_overlay").hide();
		}

		if (typeof self.scene.drawings !== 'undefined') {
			window.DRAWINGS = self.scene.drawings;
		}
		else {
			window.DRAWINGS = [];
		}
		
		let map_url = "";
		let map_is_video = false;
		if ((scene.dm_map != "") && (scene.dm_map_usable == "1") && (window.DM)) {
			map_url = scene.dm_map;
			map_is_video = (scene.dm_map_is_video === "1");
		}
		else {
			map_url = scene.player_map;
			map_is_video = (scene.player_map_is_video === "1");
		}

		if(scene.UVTTFile == 1){
			map_url = await get_map_from_uvtt_file(scene.player_map);
		}

		//This is still used for grid wizard loading since we load so many times -- it is not used for other scene loading though. You can find that in message broker handleScene
		load_scenemap(map_url, map_is_video, window.CURRENT_SCENE_DATA.width, window.CURRENT_SCENE_DATA.height, window.CURRENT_SCENE_DATA.UVTTFile, function() {



			let mapHeight = $("#scene_map").height();
			let mapWidth = $("#scene_map").width();


			let owidth = mapHeight;
			let oheight = mapWidth;
			let max_length = get_canvas_max_length();
			let max_area = get_canvas_max_area();
			console.log("Map size is " + owidth + "x" + oheight + " (with scale factor of " + scene.scale_factor + ") and browser supports max length of " + max_length + "px and max area of " + max_area + "px");

			// Check if the map size is too large
			if (owidth > max_length || oheight > max_length || (owidth * oheight) > max_area) {
				alert("Your map is too large! Your browser supports max width and height of " + max_length + " and a max area (width*height) of " + max_area);
			} else if (scene.scale_factor > 1) {
				let scaled_owidth = (owidth * scene.scale_factor);
				let scaled_oheight = (oheight * scene.scale_factor);
				if (scaled_owidth > max_length || scaled_oheight > max_length || (scaled_owidth * scaled_oheight) > max_area) {
					alert("Your grid size is too large! We try to keep grid squares at least 50px for nice looking token.\nWe had to scale the map size, making it unsupported on your browser.\nTry to re-grid your map and reduce the number of grid squares.");
				}
			}
		
			$("#scene_map").off("load");
			reset_canvas();


			set_default_vttwrapper_size()

			let found_data_tokens=false;
			for (const property in scene.tokens) {
				self.create_update_token(scene.tokens[property]);
				if(scene.tokens[property].imgsrc.startsWith("data:"))
					found_data_tokens=true;
			}

			if(found_data_tokens){
				alert('WARNING. This scene contains token with data: urls as images. Please only use http:// or https:// urls for images');
			}

			if (callback != null)
				callback();

			if (window.EncounterHandler !== undefined) {
				fetch_and_cache_scene_monster_items();
			} else {
				console.log("Not updating avtt encounter");
			}
			align_grid(false, false, copiedSceneData);
		});

		// some things can't be done correctly until after the scene finishes loading
		redraw_settings_panel_token_examples();

	}

	display_scene_properties(scene_id) {
		console.log('inizio....');
		let self = this;
		let scene = this.scenes[scene_id];
		let container = $("#scene_properties");
	}

	build_adventures(callback) {
		let self = this;
		if(Object.keys(self.sources).length!=0){
			callback();
			return;
		}
		
		let f = $("<iframe src='/sources'></iframe");
		f.hide();
		$("#site").append(f);
		
		
		let scraped_sources={};

		f.on("load", function(event) {
			console.log('iframe pronto..');
			let iframe = $(event.target);
			iframe.contents().find(".sources-listing--item--title").each(function(idx) {
				let ddbtype=$(this).closest(".sources-listing").attr('id'); // get Sourcebooks of Adventures
				let title = $(this).html();
				let url = $(this).parent().attr("href");
				let keyword = url.replace('https://www.dndbeyond.com', '').replace('sources/', '');

				if (keyword in self.sources){ // OBJECT ALREADY EXISTS... evito di riscrivere per non perdere i dati
					scraped_sources[keyword]=self.sources.keyword;
					return;
				}
				scraped_sources[keyword] = {
					type: 'dnb',
					ddbtype:ddbtype,
					title: title,
					url: url,
					chapters: {},
				};
			});
			iframe.remove();

			// SORT
			self.sources = Object.keys(scraped_sources)
				.sort(
					function(a, b) {
						if (scraped_sources[a].ddbtype == scraped_sources[b].ddbtype) {
							return ((scraped_sources[a].title == scraped_sources[b].title) ? 0 : ((scraped_sources[a].title > scraped_sources[b].title) ? 1 : -1));
						}
						else {
							return (a.ddbtype == "Adventures") ? 1 : -1;
						}
					}
				)
				.reduce((acc, key) => ({
					...acc, [key]: scraped_sources[key]
				}), {})
			
			
			callback();
		});
	}

	build_chapters(keyword, callback) {
		let self = this;
		console.log('scansiono ' + keyword);
		//let target_list = $("#" + $(event.target).attr('data-target'));
		//let adventure_url = 'https://www.dndbeyond.com/sources/' + keyword;
		let adventure_url="https://www.dndbeyond.com/"+self.sources[keyword].url;

		if (self.sources[keyword].type != 'dnb') {
			callback();
			return;
		}

		// EVITO DI RISCANSIONARE UN OGGETTO CHE HO GIA'
		if (Object.keys(self.sources[keyword].chapters).length > 0) {
			console.log('no.... non scansiono')
			callback();
			return;
		}

		//if($(event.target).attr('data-status')==0){
		let f = $("<iframe name='scraper' src='" + adventure_url + "'></iframe>");
		f.hide();
		$("#site").append(f);

		$('#sources-import-content-container').append(build_combat_tracker_loading_indicator('One moment while we load sourcebook'));
	
		f.on("load", function(event) {
			let iframe = $(event.target);
			console.log('caricato ' + window.frames['scraper'].location.href);

			if (window.frames['scraper'].location.href != adventure_url) {
				console.log('rilevato cambio url');
				let title = "Single Chapter";
				let url = window.frames['scraper'].location.href;
				let ch_keyword = url.replace('https://www.dndbeyond.com', '').replace('/sources/' + keyword + "/", '').replace('/sources/' + keyword.replace('dnd/', '') + "/", '')
				self.sources[keyword].chapters[ch_keyword] = {
					type: 'dnb',
					title: title,
					url: url,
					scenes: [],
				}
			}
			else {
				//chapter, subchapter (eg icewind), chapter, handouts and maps (eg. Curse of Strahd)
				iframe.contents().find("h3 > a, h3 ~ ul strong a, h4 > a, h3.adventure-chapter-header:contains('Appendices') ~ ul a").each(function(idx) {
					let title = $(this).html();
					let url = $(this).attr('href');
					let ch_keyword = url.replace('https://www.dndbeyond.com', '').replace('/sources/' + keyword + "/", '').replace('/sources/' + keyword.replace('dnd/', '') + "/", '')
					self.sources[keyword].chapters[ch_keyword] = {
						type: 'dnb',
						title: title,
						url: url,
						scenes: [],
					};
				});
				//map sections that are just links to maps not always found in other chapters (eg wildemount/eberron)
				iframe.contents().find("h3.adventure-chapter-header:contains('Map') ~ ul a").each(function(idx) {
					if(!(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test($(this).attr('href'))))
						return;
					let title = $(this).html();
					let url = $(this).attr('href');
					let ch_keyword = url.replace('https://www.dndbeyond.com', '').replace('/sources/' + keyword + "/", '').replace('/sources/' + keyword.replace('dnd/', '') + "/", '')
					self.sources[keyword].chapters[ch_keyword] = {
						type: 'dnb',
						title: title,
						url: url,
						scenes: [],
					};
				});
			}
			iframe.remove();
			callback();
		});
	}

	build_scenes(source_keyword, chapter_keyword, callback) {
		let self = this;
		console.log("cerco scene source: " + source_keyword + " | chapter: " + chapter_keyword);
		//let chapter_url='https://www.dndbeyond.com/sources/'+source_keyword+'/'+chapter_keyword;
		let chapter_url = self.sources[source_keyword].chapters[chapter_keyword].url;
		console.log("checking for scenes in " + chapter_url);

		if (self.sources[source_keyword].chapters[chapter_keyword].type != 'dnb') {
			callback();
			return;
		}

		if (Object.keys(self.sources[source_keyword].chapters[chapter_keyword].scenes).length > 0) { // EVITO DI SCANSIONARE DI NUOVO OGGETTI CHE HO GIA
			callback();
			return;
		}	
		if(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(chapter_url)){
			//'Maps' chapter maps at the end of books - individual images
			let dm_map = '';
			let player_map = chapter_url;
			let header = self.sources[source_keyword].chapters[chapter_keyword].title;
			let thumb = chapter_url;
			let id = self.sources[source_keyword].chapters[chapter_keyword].title;
			let title = self.sources[source_keyword].chapters[chapter_keyword].title;

			self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
				id: id,
				uuid: source_keyword + "/" + chapter_keyword + "/" + id,
				title: title,
				dm_map: dm_map,
				player_map: player_map,
				player_map_is_video: "0",
				dm_map_is_video: "0",
				scale: "100",
				dm_map_usable: "0",
				thumb: thumb,
				tokens: {},
			});		
		}

		let f = $("<iframe src='" + chapter_url + "'></iframe>");

		f.hide();
		$("#site").append(f);


		f.on("load", function(event) {
			let iframe = $(event.target);
			if(iframe.contents().length == 0){
				let notOwned = true;
				iframe.remove();
				console.log('Book failed to load - probably do not own it');
				callback(notOwned);
				return;
			}


			iframe.contents().find("figure").each(function(idx) { // FIGURE + FIGCAPTION. 
				let id = $(this).attr('id');
				if (typeof id == typeof undefined)
					return;
				let img1 = $(this).find(".compendium-image-center, .compendium-image-left, .compendium-image-right").attr("href");
				let links = $(this).find("figcaption a");
				let player_map = '';
				let dm_map = '';
				let figure_caption = $(this).find('figcaption');
				let title = figure_caption.clone()    //clone the element
					.children() //select all the children
					.remove()   //remove all the children
					.end()  //again go back to selected element
					.text();

				let thumb = $(this).find("img").attr('src');

				dm_map = img1;
				if (links.length > 0) {
					if(links.filter('[data-title*="Tokens"]').length>0){
						dm_map = links.filter('[data-title*="Tokens"], [title*="Tokens"]').attr('href');
						player_map = links.filter('[data-title*="Player"], [title*="Player"]').attr('href');
					}
					else{
						player_map = links.attr('href');
					}
					
				}
				else {
					player_map = img1;
				}
				self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
					id: id,
					uuid: source_keyword + "/" + chapter_keyword + "/" + id,
					title: title,
					dm_map: dm_map,
					player_map: player_map ? player_map : thumb,
					player_map_is_video: "0",
					dm_map_is_video: "0",
					thumb: thumb,
					scale: "100",
					dm_map_usable: dm_map ? "1" : '0',
					tokens: {},
				});
			});

			// COMPENDIUM IMAGES
			let compendiumWithSubtitle = iframe.contents().find(".compendium-image-with-subtitle-center,.compendium-image-with-subtitle-right,.compendium-image-with-subtitle-left");
			let compendiumWithoutSubtitle = iframe.contents().find(".compendium-image-center, .compendium-image-left, .compendium-image-right");

			if (compendiumWithSubtitle.length > 0) {
				compendiumWithSubtitle.each(function(idx) {
					if ($(this).parent().is('figure') || $(this).is('figure'))
						return;
					let id = $(this).attr('id');
					if (typeof id == typeof undefined) {
						id = $(this).attr('data-content-chunk-id');
					}
					let thumb = $(this).find("img").attr('src');
					let img1 = $(this).find(".compendium-image-center,.compendium-image-right,.compendium-image-left").attr("href");
					let title = $(this).find(".compendium-image-subtitle").text();
					let player_map;
					let dm_map;

					dm_map = img1;
					if ($(this).next().hasClass("compendium-image-view-player")) {
						player_map = $(this).next().find(".compendium-image-center").attr("href");
					}
					else if ($(this).find(".compendium-image-view-player a").length > 0) {
						player_map = $(this).find(".compendium-image-view-player a").attr("href");
					}
					else {
						player_map = img1;
					}

					self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
						id: id,
						uuid: source_keyword + "/" + chapter_keyword + "/" + id,
						title: title,
						dm_map: dm_map,
						player_map: player_map ? player_map : thumb,
						player_map_is_video: "0",
						dm_map_is_video: "0",
						thumb: thumb,
						scale: "100",
						dm_map_usable: dm_map ? "1" : '0',
						tokens: {},
					});
				});
			} else if (compendiumWithoutSubtitle.length > 0) {
				compendiumWithoutSubtitle.each(function(idx) {
					// import it only if there's a player version

					if ($(this).parent().is('figure') || $(this).is('figure'))
						return;
					let playerMapContainer;
					if ($(this).parent().next().is(".compendium-image-view-player")) {
						playerMapContainer = $(this).parent().next().find(".compendium-image-center");
					} else if ($(this).parent().next().find(".compendium-image-center a").length > 0) {
						playerMapContainer = $(this).parent().next().find(".compendium-image-center a");
					} else if($(this).parent().not('.compendium-image-view-player').length > 0){
						playerMapContainer = $(this);
					}
					if (playerMapContainer === undefined || playerMapContainer.length === 0) {
						return;
					}


					let dm_map = $(this).attr('href');
					let player_map = playerMapContainer.attr("href");
					let header = $(this).parent().prevAll("[id]:first");
					let thumb = $(this).find("img").attr('src');
					let id = header.attr("id");
					let title = header.text();

					self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
						id: id,
						uuid: source_keyword + "/" + chapter_keyword + "/" + id,
						title: title,
						dm_map: dm_map,
						player_map: player_map ? player_map : thumb,
						player_map_is_video: "0",
						dm_map_is_video: "0",
						thumb: thumb,
						scale: "100",
						dm_map_usable: dm_map ? "1" : '0',
						tokens: {},
					});

				});
			}

			iframe.remove();
			console.log('INVOKO CALLBACK');
			callback();
		});
	}

	create_update_token(options, save = true) {
		console.log("create_update_token");
		let self = this;
		let id = options.id;
		options.scaleCreated = window.CURRENT_SCENE_DATA.scale_factor;
		this.scene.tokens[id]=options;

		if (!(id in window.TOKEN_OBJECTS)) {

			window.TOKEN_OBJECTS[id] = new Token(options);

			window.TOKEN_OBJECTS[id].sync = mydebounce(function(e) {
				if(window.TOKEN_OBJECTS[id])
					window.MB.sendMessage('custom/myVTT/token', window.TOKEN_OBJECTS[id].options);
			}, 10);
		}

		window.TOKEN_OBJECTS[id].place_sync_persist();
	}


	persist_scene(scene_index,isnew=false){ // CLOUD ONLY FUNCTION
		let sceneData=Object.assign({},this.scenes[scene_index]);
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

		
		if(isnew)
			sceneData.isnewscene=true;

		this.scenes[scene_index] = sceneData;

		window.MB.sendMessage("custom/myVTT/update_scene",sceneData);

		if(window.DM && window.splitPlayerScenes?.players != undefined){
		 	window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: window.splitPlayerScenes});
		}     
	}

	persist_current_scene(dontswitch=false){
		let scene_index = window.ScenesHandler.scenes.findIndex(s => s.id === window.CURRENT_SCENE_DATA.id);
		window.ScenesHandler.scenes[scene_index] = window.CURRENT_SCENE_DATA;
		window.ScenesHandler.scene = window.CURRENT_SCENE_DATA;
		let sceneData=Object.assign({},this.scene);

		sceneData = {
			...sceneData,
			scale_check: true,
			reveals: [],
			drawings:[],
			tokens: {}
		}

		sceneData.isnewscene=false;
		window.MB.sendMessage("custom/myVTT/update_scene",sceneData,dontswitch);
	}

	delete_scene(sceneId, reloadUI = true) { // not the index, but the actual id
		window.MB.sendMessage("custom/myVTT/delete_scene",{ id: sceneId });
		let sceneIndex = window.ScenesHandler.scenes.findIndex(s => s.id === sceneId);
		window.ScenesHandler.scenes.splice(sceneIndex, 1);
		if (reloadUI) {
			did_update_scenes();
		}
		if(window.DM && window.splitPlayerScenes?.players != undefined){
		 	window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: window.splitPlayerScenes});
		}   
	}

	persist() {
		console.error("ScenesHandler.persist is no longer a function. Stop calling it!");
	}

	sync() {
		console.error("ScenesHandler.sync is no longer a function. Stop calling it!");
	}

	constructor() {
		this.sources = {};
		this.scenes = [];
		this.current_scene_id = null;
	}
}

function folder_path_of_scene(scene) {
	const parent = find_parent_of_scene(scene);
	if (parent) {
		const ancestors = find_ancestors_of_scene(parent);
		let ancestorPath = ancestors.reverse().map(s => s.title).join("/")
		if (!ancestorPath.startsWith(RootFolder.Scenes.path)) {
			ancestorPath = `${RootFolder.Scenes.path}/${ancestorPath}`;
		}
		return sanitize_folder_path(ancestorPath);
	} else {
		return RootFolder.Scenes.path;
	}
}
function find_parent_of_scene(scene) {
	return window.ScenesHandler.scenes.find(s => s.id === scene.parentId);
}
function find_ancestors_of_scene(scene, found = []) {
	found.push(scene);
	let parent = find_parent_of_scene(scene);
	if (parent) {
		return find_ancestors_of_scene(parent, found)
	} else {
		// TODO: anything special for parentId === RootFolder.Scene.id?
		return found;
	}
}

function find_descendants_of_scene_id(sceneId) {
	const scene = window.ScenesHandler.scenes.find(s => s.id === sceneId);
	return find_descendants_of_scene(scene);
}

function find_descendants_of_scene(scene, found = []) {
	if (!scene) {
		return found;
	}
	found.push(scene);
	window.ScenesHandler.scenes.forEach(s => {
		if (s.parentId === scene.id) {
			// this is a child, so process it
			found = find_descendants_of_scene(s, found);
		}
	});
	return found;
}