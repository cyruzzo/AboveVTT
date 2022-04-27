
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
	});

	target.append(sel);
	target.append(import_button);
}

function edit_scene_dialog(scene_id) {
	let scene = window.ScenesHandler.scenes[scene_id];
	scene.fog_of_war = "1"; // ALWAYS ON since 0.0.18
	console.log('edit_scene_dialog');
	$("#scene_selector").attr('disabled', 'disabled');
	dialog = $("<div id='edit_dialog'></div>");
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

	template_section = $("<div id='template_section'/>");


	dialog.append(template_section);
	controls = $("<div/>");
	controls.append("Import Template FROM:");
	toggle_ddb = $("<button>DnDBeyond.com</button>")
	toggle_ddb.click(function() {
		mega_importer(true);
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
	dialog.css('position', 'fixed');
	dialog.css('width', '600px');
	dialog.css('top', '100px');
	dialog.css('left', '300px');
	dialog.css('height', '350px');
	dialog.css('z-index', 99999);
	dialog.css('border', 'solid 1px black');

	$("#site").append(dialog);

	var container = scene_properties;

	container.empty();

	let f = $("<form />");
	f.on('submit', function(e) { e.preventDefault(); });

	let addrow = function(name, title, type = 'text') {
		var row = $("<div style='width:100%;'/>");
		var c1 = $("<div style='display: inline-block; width:30%'>" + title + "</div>");
		c1.css("font-weight", "bold");
		var c2 = $("<div style='display:inline-block; width:70%'/>");
		var i = $("<input />");
		i.attr('type', type);
		i.attr('name', name);
		i.val(scene[name]);
		i.css("width", "70%");
		c2.append(i);
		row.append(c1);
		row.append(c2);
		f.append(row);
	};

	let addrow_with_checkbox = function(name, title, checkbox_name, checkbox_title, type = 'text') {
		var row = $("<div style='width:100%;'/>");
		var c1 = $("<div style='display: inline-block; width:30%'>" + title + "</div>");
		c1.css("font-weight", "bold");
		var c2 = $("<div style='display:inline-block; width:50%'/>");
		var i = $("<input />");
		i.attr('type', type);
		i.attr('name', name);
		i.val(scene[name]);
		i.css("width", "100%");

		var c3 = $("<div style='display: inline-block;'>&nbsp;&nbsp;" + checkbox_title + "&nbsp;&nbsp;</div>");
		c3.css("font-weight", "bold");
		var c4 = $("<div style='display:inline-block;'/>");
		var t = $("<input />");
		t.attr('type', "checkbox");
		t.attr('name', checkbox_name);
		t.prop('checked', scene[checkbox_name] === "1");
		c2.append(i);
		c4.append(t);
		row.append(c1);
		row.append(c2);
		row.append(c3);
		row.append(c4);
		f.append(row);
	};

	var uuid_hidden = $("<input name='uuid' type='hidden'/>");
	uuid_hidden.val(scene['uuid']);
	f.append(uuid_hidden);

	addrow('title', 'Scene Title');
	addrow_with_checkbox('player_map', 'Player Map', 'player_map_is_video', "Is Video?");
	addrow_with_checkbox('dm_map', 'Dm Map', 'dm_map_is_video', "Is Video?");
	addrow('dm_map_usable', 'Use DM Map (1 to enable)');
	wizard = $("<button><b>Super Mega Wizard</b></button>");
	manual_button = $("<button>Manual Grid Data</button>");

	grid_buttons = $("<div style='display:inline-block; width:70%'/>");
	grid_buttons.append(wizard);
	grid_buttons.append(manual_button);
	f.append($("<div><div style='display:inline-block;width:30%'><b>Grid and Scale</b></div></div>").append(grid_buttons));


	var manual = $("<div/>");
	manual.append($("<div><div style='display:inline-block; width:30%'>Grid size in original image</div><div style='display:inline-block;width:70%;'><input name='hpps'> X <input name='vpps'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Offset</div><div style='display:inline-block;width:70%;'><input name='offsetx'> X <input name='offsety'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Snap to Grid(1 to enable)</div><div style='display:inline-block; width:70'%'><input name='snap'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Show Grid(1 to enable)</div><div style='display:inline-block; width:70'%'><input name='grid'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Units per square</div><div style='display:inline-block; width:70'%'><input name='fpsq'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Distance Unit (i.e. feet)</div><div style='display:inline-block; width:70'%'><input name='upsq'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Grid is a subdivided 10 units</div><div style='display:inline-block; width:70'%'><input name='grid_subdivided'></div></div>"));
	manual.append($("<div><div style='display:inline-block; width:30%'>Image Scale Factor</div><div style='display:inline-block; width:70'%'><input name='scale_factor'></div></div>"));
	manual.hide();

	manual.find("input").each(function() {
		$(this).css("width", "60px");
		$(this).val(scene[$(this).attr('name')]);
	})
	f.append(manual);
	manual_button.click(function() {
		if (manual.is(":visible"))
			manual.hide();
		else
			manual.show();
	});


	if (typeof scene.fog_of_war == "undefined")
		scene.fog_of_war = "1";


	var sub = $("<button>Save And Switch</button>");

	if(window.CLOUD)
		sub.html("Save");

	sub.click(function() {
		f.find("input").each(function() {
			var n = $(this).attr('name');
			var t = $(this).attr('type');
			let nValue = null;
			if (t == "checkbox") {
				nValue = $(this).prop("checked") ? "1" : "0";
			}
			else {
				nValue = $(this).val();
			}

			if ( ((n === 'player_map') || (n==='dm_map')) ) {
				nValue = parse_img(nValue);
			}

			scene[n] = nValue;
			console.log('setto ' + n + ' a ' + $(this).val());
		});
		if(window.CLOUD){
			window.ScenesHandler.persist_scene(scene_id,true,true);
		}
		else{
			window.ScenesHandler.persist();
			window.ScenesHandler.switch_scene(scene_id);
		}
		$("#edit_dialog").remove();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();
	});
	

	


	let grid_5 = function(enable_grid = false, enable_snap = true) {

		console.log("enable_grid " + enable_grid + " enable_snap" + enable_snap);

		$("#scene_selector_toggle").show();
		$("#tokens").show();
		window.WIZARDING = false;

		if (enable_snap)
			window.ScenesHandler.scene.snap = "1";
		else
			window.ScenesHandler.scene.snap = "0";

		if (enable_grid)
			window.ScenesHandler.scene.grid = "1";
		else
			window.ScenesHandler.scene.grid = "0";

		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.grid_subdivided = "0";
		consider_upscaling(window.ScenesHandler.scene);
		if(window.CLOUD)
			window.ScenesHandler.persist_current_scene();
		else
			window.ScenesHandler.persist();	
		window.ScenesHandler.reload();
		$("#wizard_popup").empty().append("You're good to go!!");

		$("#wizard_popup").delay(2000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
	};

	let grid_10 = function() {
		$("#wizard_popup").empty().append("Do you want me to subdivide the map grid in 2 so you can get correct token size? <button id='grid_divide'>Yes</button> <button id='grid_nodivide'>No</button>");

		$("#grid_divide").click(function() {
			window.WIZARDING = false;
			$("#scene_selector_toggle").show();
			$("#tokens").show();
			$("#wizard_popup").empty().append("You're good to go! AboveVTT is now super-imposing a grid that divides the original grid map in half. If you want to hide this grid just edit the manual grid data.");
			window.ScenesHandler.scene.grid_subdivided = "1";
			window.ScenesHandler.scene.snap = "1";
			window.ScenesHandler.scene.grid = "1";
			window.ScenesHandler.scene.fpsq = "5";
			window.ScenesHandler.scene.upsq = "ft";
			window.ScenesHandler.scene.hpps /= 2;
			window.ScenesHandler.scene.vpps /= 2;
			
			consider_upscaling(window.ScenesHandler.scene);
			
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
			if(window.CLOUD)
				window.ScenesHandler.persist_current_scene();
			else
				window.ScenesHandler.persist();
			window.ScenesHandler.reload();
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
			if(window.CLOUD)
				window.ScenesHandler.persist_current_scene();
			else
				window.ScenesHandler.persist();
			window.ScenesHandler.reload();
			$("#wizard_popup").empty().append("You're good to go! Medium token will match the original grid size");
			$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
				$("#wizard_popup").remove();
			});
		});
	}

	let grid_15 = function() {
		window.WIZARDING = false;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale and snapping is enabled. We don't currently support overimposing a grid in this scale..'");
		window.ScenesHandler.scene.grid_subdivided = "0";
		window.ScenesHandler.scene.snap = "1";
		window.ScenesHandler.scene.grid = "0";
		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.hpps /= 3;
		window.ScenesHandler.scene.vpps /= 3;
		consider_upscaling(window.ScenesHandler.scene);
		$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
		if(window.CLOUD)
			window.ScenesHandler.persist_current_scene();
		else
			window.ScenesHandler.persist();
		window.ScenesHandler.reload();
	}


	let grid_20 = function() {
		window.WIZARDING = false;
		$("#scene_selector_toggle").show();
		$("#tokens").show();
		$("#wizard_popup").empty().append("You're good to go! Token will be of the correct scale and snapping is enabled.");
		window.ScenesHandler.scene.grid_subdivided = "0";
		window.ScenesHandler.scene.snap = "1";
		window.ScenesHandler.scene.grid = "1";
		window.ScenesHandler.scene.fpsq = "5";
		window.ScenesHandler.scene.upsq = "ft";
		window.ScenesHandler.scene.hpps /= 4;
		window.ScenesHandler.scene.vpps /= 4;
		consider_upscaling(window.ScenesHandler.scene);
		$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
			$("#wizard_popup").remove();
		});
		if(window.CLOUD)
			window.ScenesHandler.persist_current_scene();
		else
			window.ScenesHandler.persist();
		window.ScenesHandler.reload();
	}

	let align_grid = function(square = false, just_rescaling = true) {


		/*window.ScenesHandler.persist();*/
		window.ScenesHandler.switch_scene(scene_id, function() {
			$("#tokens").hide();

			if (!just_rescaling)
				window.CURRENT_SCENE_DATA.grid = "1";
			else
				window.CURRENT_SCENE_DATA.grid = "0";

			window.CURRENT_SCENE_DATA.grid_subdivided = "0";
			window.CURRENT_SCENE_DATA.scale_factor=1;
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



			let regrid = function(e) {

				window.WIZARDING = true;
				if (!just_rescaling)
					window.CURRENT_SCENE_DATA.grid = 1;
				else
					window.CURRENT_SCENE_DATA.grid = 0;
				let al1 = {
					x: parseInt(aligner1.css("left")) + 29,
					y: parseInt(aligner1.css("top")) + 29,
				};

				let al2 = {
					x: parseInt(aligner2.css("left")) + 29,
					y: parseInt(aligner2.css("top")) + 29,
				};


				if (just_rescaling) {
					ppsx = (al2.x - al1.x);
					ppsy = (al2.y - al1.y);
					offsetx = 0;
					offsety = 0;
				}
				else {
					ppsx = (al2.x - al1.x) / 3.0;
					ppsy = (al2.y - al1.y) / 3.0;
					offsetx = al1.x % ppsx;
					offsety = al1.y % ppsy;
				}
				console.log("ppsx " + ppsx + "ppsy " + ppsy + "offsetx " + offsetx + "offsety " + offsety)
				window.CURRENT_SCENE_DATA.hpps = ppsx;
				window.CURRENT_SCENE_DATA.vpps = ppsy;
				window.CURRENT_SCENE_DATA.offsetx = offsetx;
				window.CURRENT_SCENE_DATA.offsety = offsety;
				reset_canvas();
				redraw_canvas();
			};

			let click2 = {
				x: 0,
				y: 0
			};
			aligner2.draggable({
				stop: regrid,
				start: function(event) {
					window.CURRENT_SCENE_DATA.grid = 0;
					reset_canvas(); redraw_canvas();
					click2.x = event.clientX;
					click2.y = event.clientY;
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {
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
					window.CURRENT_SCENE_DATA.grid = 0;
					reset_canvas(); redraw_canvas();
					click1.x = event.clientX;
					click1.y = event.clientY;
					$("#aligner1").attr('original-top', parseInt($(event.target).css("top")));
					$("#aligner1").attr('original-left', parseInt($(event.target).css("left")));
					$("#aligner2").attr('original-top', parseInt($("#aligner2").css("top")));
					$("#aligner2").attr('original-left', parseInt($("#aligner2").css("left")));
				},
				drag: function(event, ui) {

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

			if (!just_rescaling)
				wizard_popup.append("Move the pointers at the center of the map to define 3x3 Square on the map! ZOOM IN with the Top Right + button. <button id='step2btn'>Press when it's good enough</button>");
			else
				wizard_popup.append("Set the green square to roughly the size of a medium token! <button id='step2btn'>Press when it's good enough</button>");


			$("body").append(wizard_popup);

			regrid();


			wizard_popup.find("#step2btn").click(
				function() {
					aligner1.remove();
					aligner2.remove();

					if (just_rescaling) {
						grid_5(false, false);
					}
					else if (!square) {
						$("#wizard_popup").empty().append("Nice!! How many units (i.e. feet) per square ? <button id='grid_5'>5</button> <button id='grid_10'>10</button> <button id='grid_15'>15</button> <button id='grid_20'>20</button>");
						$("#grid_5").click(function() { grid_5(); });
						$("#grid_10").click(function() { grid_10(); });
						$("#grid_15").click(function() { grid_15(); });
						$("#grid_20").click(function() { grid_20(); });
						$("#grid_100").click(function() { grid_100(); });
					}
					else { // just creating a 5 foot grid
						grid_5(true);
					}

				}
			);
		});
	}; // END OF ALIGN GRID WIZARD!

	wizard.click(
		function() {

			f.find("input").each(function() {
				var n = $(this).attr('name');
				var t = $(this).attr('type');
				let nValue = null;
				if (t == "checkbox") {
					nValue = $(this).prop("checked") ? "1" : "0";
				}
				else {
					nValue = $(this).val();
				}

				if (((n === 'player_map') || (n==='dm_map'))
					&& nValue.startsWith("https://drive.google.com")
					&& nValue.indexOf("uc?id=") < 0
				) {
					nValue = 'https://drive.google.com/uc?id=' + nValue.split('/')[5];
				}
				scene[n] = nValue;
			});

			scene.scale_factor=1;

			if(window.CLOUD)
				window.ScenesHandler.persist_current_scene();
			else
				window.ScenesHandler.persist();
			window.ScenesHandler.switch_scene(scene_id);


			$("#edit_dialog").remove();
			$("#scene_selector").removeAttr("disabled");
			$("#scene_selector_toggle").click();
			$("#scene_selector_toggle").hide();


			prewiz = $("<table id='prewiz'/>");

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

		}
	);


	cancel = $("<button>Cancel</button>");
	cancel.click(function() {
		$("#edit_dialog").remove();
		$("#scene_selector").removeAttr("disabled");
	})


	var hide_all_button = $("<button>COVER WITH FOG</button>");
	if(window.CLOUD){
		hide_all_button.hide();
	}
	hide_all_button.click(function() {
		r = confirm("This will delete all current FOG zones on this scene and HIDE ALL THE MAP to the player. Are you sure?");
		if (r == true) {
			scene.reveals = [];
			if (scene_id == window.ScenesHandler.current_scene_id) {
				window.REVEALED = [];
				redraw_canvas();
			}
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});

	/*var export_grid=$("<button>Send Grid Data to the Community</button>")
	export_grid.click(function(){
	});*/



	f.append(sub);
	f.append(cancel);
	f.append(hide_all_button);
	//		f.append(export_grid);
	container.css('opacity', '0.0');
	container.append(f);
	container.animate({
		opacity: '1.0'
	}, 1000);





}

function refresh_scenes() {
	target = $("#scene_selector");
	target.find(".scene").remove();

	for (var i = 0; i < window.ScenesHandler.scenes.length; i++) {
		let scene_id = i;
		var scene = window.ScenesHandler.scenes[i];
		var newobj = $("<div class='scene' data-scene-index='"+i+"'/>");


		title = $("<div class='scene_title' style='text-align:center;'/>");
		title.html(scene.title);

		if ( (i == window.ScenesHandler.current_scene_id)   && (!window.CLOUD))
			newobj.addClass('active_scene');
		newobj.append(title);
		controls = $("<div/>");
		if(window.CLOUD){
			let switch_players=$("<button class='player_scenes_button'>PLAYERS</button>");

			if(window.PLAYER_SCENE_ID==window.ScenesHandler.scenes[scene_id].id){
				console.log("players are here!");
				switch_players.addClass("selected");
			}

			switch_players.click(function(){
				let msg={
					sceneId:window.ScenesHandler.scenes[scene_id].id,
				};
				window.PLAYER_SCENE_ID=window.ScenesHandler.scenes[scene_id].id;
				$(".player_scenes_button.selected").removeClass("selected");
				$(this).addClass("selected");
				window.MB.sendMessage("custom/myVTT/switch_scene",msg);
				add_zoom_to_storage()
			});
			
			let switch_dm=$("<button class='dm_scenes_button'>DM</button>");
			if(window.CURRENT_SCENE_DATA && (window.CURRENT_SCENE_DATA.id==window.ScenesHandler.scenes[scene_id].id)){
				switch_dm.addClass("selected");
			}
			switch_dm.click(function(){
				$(".dm_scenes_button.selected").removeClass("selected");
				let msg={
					sceneId:window.ScenesHandler.scenes[scene_id].id,
					switch_dm: true
				};
				$(this).addClass("selected");
				window.MB.sendMessage("custom/myVTT/switch_scene",msg);
				add_zoom_to_storage()
			});
			if(scene.player_map){
				switch_players.removeAttr("disabled");
				switch_dm.removeAttr("disabled");
			}
			else{
				switch_players.attr("disabled","true");
				switch_dm.attr("disabled","true");
			}
			
			controls.append(switch_players);
			controls.append(switch_dm);
		}
		else{
			switch_button = $("<button>SWITCH</button>");
			if(scene.player_map)
				switch_button.removeAttr("disabled");
			else
				switch_button.attr("disabled","true");
				
			switch_button.click(function() {
				window.ScenesHandler.switch_scene(scene_id);
				$("#scene_selector_toggle").click();
				refresh_scenes();
			});
			controls.append(switch_button);
		}
		edit_button = $("<button><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/edit.svg'></button>");
		edit_button.click(function() {
			edit_scene_dialog(scene_id);
		});
		controls.append(edit_button);
		delete_button=$("<button><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
		delete_button.click(function() {
			r = confirm("Are you sure that you want to delete this scene?");
			if (r == true) {
				if(window.CLOUD){
					window.MB.sendMessage("custom/myVTT/delete_scene",{id:window.ScenesHandler.scenes[scene_id].id})
				}
				window.ScenesHandler.scenes.splice(scene_id, 1);
				if(!window.CLOUD){
					window.ScenesHandler.persist();
				}
				refresh_scenes();
				
			}
		});
		controls.append(delete_button);
		newobj.append(controls);

		$("#addscene").parent().before(newobj);	
	}
	if(!$("#scene_selector").hasClass("ui-sortable")) {
		$("#scene_selector").sortable({
			handle: ".scene_title",
			forcePlaceholderSize: true,
			placeholder: "sortable_placeholder", 
			update: function(event, ui) {
				let fromSceneIndex = ui.item.attr("data-scene-index");
				let toSceneIndex;
				let j = 0;
				let tempScenes = [];
				$("#scene_selector").children('.scene').each(function(j) {
					let oldSceneID = $(this).attr("data-scene-index");
					if (fromSceneIndex == oldSceneID) {
						toSceneIndex = j;
					}
					tempScenes.push(window.ScenesHandler.scenes[oldSceneID]);
					$(this).attr("data-scene-index", j);
					if ($(this).hasClass('active_scene')) {
						window.ScenesHandler.current_scene_id = j;
					}
					j++;
				});
				console.log("Scene "+fromSceneIndex+" moved to "+toSceneIndex);
				if(window.CLOUD){
					let neworder;
					console.log(window.ScenesHandler.scenes);
					if(toSceneIndex < fromSceneIndex){ // moving back
						if(toSceneIndex==0)
							neworder=window.ScenesHandler.scenes[0].order-100;
						else
							neworder=Math.round((window.ScenesHandler.scenes[toSceneIndex].order + window.ScenesHandler.scenes[toSceneIndex-1].order)/2);
					}
					else{
						if(toSceneIndex==(window.ScenesHandler.scenes.length-1)){
							neworder=window.ScenesHandler.scenes[toSceneIndex].order+100;
						}
						else
							neworder=Math.round((window.ScenesHandler.scenes[toSceneIndex].order + window.ScenesHandler.scenes[toSceneIndex+1].order)/2);
					}
					window.ScenesHandler.scenes[fromSceneIndex].order=neworder;
					window.ScenesHandler.persist_scene(fromSceneIndex);
				}
				window.ScenesHandler.scenes = tempScenes;
				window.ScenesHandler.persist();
				refresh_scenes();
			}
		});
	}
	$("#scene_selector").css("overflow","auto");
}

function init_scene_selector() {
	ss = $("<div  id='scene_selector' />");
	ss.hide();


	addblock = $("<div style='float:left;overflow: hidden;display:block;'/>");
	addbutton = $("<button id='addscene'><span class='material-icons button-icon md-dark md-32'>add</span></button></button>");

	addbutton.click(function() {
		window.ScenesHandler.scenes.push({
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
		}
		);
		if(window.CLOUD){
			window.ScenesHandler.persist_scene(window.ScenesHandler.scenes.length -1,true);
		}
		else{
			window.ScenesHandler.persist();
		}
		refresh_scenes();
	});


	addblock.append(addbutton);
	ss.append(addblock);


	let toggle = $("<div id='scene_selector_toggle' class='hideable ddbc-tab-options__header-heading'>SCENES<span class='material-icons md-dark md-14 md-weight-700'>expand_more</span></div>");

	toggle.click(function() {
		if (ss.hasClass("menu_opened")) {
			ss.slideUp().removeClass("menu_opened");
			toggle.removeClass("menu_opened");
			toggle.removeClass("ddbc-tab-options__header-heading--is-active");
		} else {
			ss.slideDown().addClass("menu_opened");
			toggle.addClass("menu_opened");
			toggle.addClass("ddbc-tab-options__header-heading--is-active");
			refresh_scenes();
		}

		

	});
	$(window.document.body).append(ss);
	let pill = $(`<div id="scene_selector_toggle_pill" class="ddbc-tab-options--layout-pill" />`);
	pill.append(toggle);
	$(window.document.body).append(pill);
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

function init_ddb_importer(target) {

	panel = $("<div id='scenes-panel' class='sidepanel-content'></div>");
	target.append(panel);


	var source_select = $("<select id='source_select'/>");
	source_select.css("display", "inline");
	window.ScenesHandler.build_adventures(function() {

		display_sources();
		$("#source_select").change();
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

function fill_importer(scene_set, start) {
	area = $("#importer_area");
	area.empty();
	area.css("opacity", "0");
	area.animate({ opacity: "1" }, 300);

	var ddb_extra_found=false;
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
		
			$("#scene_properties input[name='player_map']").val(scene.player_map);
			$("#scene_properties input[name='dm_map']").val(scene.dm_map);
			$("#scene_properties input[name='title']").val(scene.title);
			$("#scene_properties input[name='scale']").val(scene.scale);

			if (typeof scene.player_map_is_video !== "undefined")
				$("#scene_properties input[name='player_map_is_video']").prop('checked', scene.player_map_is_video === "1");
			if (typeof scene.dm_map_is_video !== "undefined")
				$("#scene_properties input[name='dm_map_is_video']").prop('checked', scene.dm_map_is_video === "1");


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
		});

		entry.append($("<div>").append(b));
		area.append(entry);
	}

	footer = $("#importer_footer");
	footer.empty();

	cancel = $("<button>CLOSE</button>");
	cancel.click(function() {
		$("#mega_importer").remove();
	});

	prev = $("<button>PREV</button>");
	if (start == 0)
		prev.attr("disabled", "disabled");

	prev.click(function() {
		fill_importer(scene_set, start - 8);
	})

	next = $("<button>NEXT</button>");
	if (i == scene_set.length)
		next.attr("disabled", "disabled");
	next.click(function() {
		fill_importer(scene_set, start + 8);
	});

	buttons = $("<div/>");

	buttons.css("right", "0");
	buttons.css("position", "absolute");
	buttons.append(cancel);
	buttons.append(prev);
	buttons.append(next);
	footer.append(buttons);



}

function mega_importer(DDB = false) {
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
		init_ddb_importer(toggles);
	}
	container.append(toggles);
	area = $("<div id='importer_area'/>").css({ height: "480px", width: "100%" });
	container.append(area);
	bottom = $("<div id='importer_footer'/>").css({ height: "30px", width: "100%" });
	container.append(bottom);
	$("body").append(container);
	if (!DDB)
		first.click();
}



