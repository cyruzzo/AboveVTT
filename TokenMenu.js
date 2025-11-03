
// deprecated. replaced by mytokens
tokendata={
	folders:{},
};

// deprecated, but still needed for migrate_to_my_tokens() to work
function convert_path(path){
	let pieces=path.split("/");
	let current=tokendata;

	for(let i=0;i<pieces.length;i++){
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
	
	if (hoverEvent.type === "mouseleave") {
		clearTimeout(window.contextFlyoutTimeout)
	}
	if (hoverEvent.type === "mouseenter") {
		window.contextFlyoutTimeout = setTimeout(() => {
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
				let buttonPosition = $(hoverEvent.currentTarget).closest('.flyout-from-menu-item')[0].getBoundingClientRect().y - $("#tokenOptionsPopup")[0].getBoundingClientRect().y + 14
				if (buttonPosition < contextMenuCenter) {
					flyoutTop = buttonPosition - (flyoutHeight / 5)
				}
				else {
					flyoutTop = buttonPosition - (flyoutHeight / 2)
				}
			}

			flyout.css({
				left: contextMenu.width(),
				top: flyoutTop,
			});

			if ($(".context-menu-flyout")[0].getBoundingClientRect().top < 0) {
				flyout.css("top", 0)
			}
			else if ($(".context-menu-flyout")[0].getBoundingClientRect().bottom > window.innerHeight - 15) {
				flyout.css({
					top: 'unset',
					bottom: 0
				});
			}
		}, 150)
	} 
}

function close_token_context_menu() {
	$("#tokenOptionsClickCloseDiv").click();
}


function select_tokens_in_aoe(aoeTokens, selectPlayerTokens = true){
	deselect_all_tokens();
	let rayCast = document.getElementById("raycastingCanvas");
	let canvas = new OffscreenCanvas(rayCast.width, rayCast.height);
	let ctx = canvas.getContext('2d', { willReadFrequently: true }); //rare case where we can allow cpu do so all the lifting since it is not rendered
	


	ctx.globalCompositeOperation='source-over';
	aoeTokens.forEach(token => {
		draw_aoe_to_canvas($(`#tokens .token[data-id='${token.options.id}']`), ctx);
	});


	let promises = [];
	for (let id in window.TOKEN_OBJECTS) {
		if((!selectPlayerTokens && window.TOKEN_OBJECTS[id].isPlayer()) || 
			window.TOKEN_OBJECTS[id].options.combatGroupToken ||
			window.TOKEN_OBJECTS[id].options.type != undefined || 
			window.TOKEN_OBJECTS[id].isAoe())
				continue;

		promises.push(new Promise(function(resolve) {
			let tokenSelector = "div.token[data-id='" + id + "']";

			//Combining some and filter cut down about 140ms for average sized picture
			
			const isInAoe = (is_token_in_aoe_context(id, ctx)); 
			
			if (isInAoe && !window.TOKEN_OBJECTS[id].options.hidden && !window.TOKEN_OBJECTS[id].options.locked) {
				let tokenDiv = $(`#tokens>div[data-id='${id}']`)
				if(tokenDiv.css("pointer-events")!="none" && tokenDiv.css("display")!="none" && !tokenDiv.hasClass("ui-draggable-disabled")) {
					window.TOKEN_OBJECTS[id].selected = true;
				}
			}		
			resolve();
		}));
	}
	Promise.all(promises).then(()=>{
		draw_selected_token_bounding_box();
	})
	close_token_context_menu();
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

	let door = (tokenIds.length == 1) ? $(`[data-id='${tokenIds}'].door-button`) : undefined;

	

	if (tokens.length === 0 && door.length == 0) {
		console.warn(`token_context_menu_expanded was called with ids: ${JSON.stringify(tokenIds)}, but no matching tokens could be found`);
		return;
	}
	if(door?.length > 0 && !window.DM){
		return;
	}




	$("#tokenOptionsPopup").remove();

	create_context_background(['#tokenOptionsPopup', '.context-menu-flyout'], function(){
		$('.context-menu-list').trigger('contextmenu:hide')
		$("#tokenOptionsContainer .sp-container").spectrum("destroy");
		$("#tokenOptionsContainer .sp-container").remove();
		clear_temp_canvas();
	});


	let moveableTokenOptions = $("<div id='tokenOptionsPopup'></div>");

	
	let body = $("<div id='tokenOptionsContainer'></div>");
	moveableTokenOptions.append(body);

	$('body').append(moveableTokenOptions);

	$("#tokenOptionsPopup").addClass("moveableWindow");
	$("#tokenOptionsPopup").draggable({
		addClasses: false,
		scroll: false,
		handle: "div:not(:has(select)), button, label, input",
		start: function () {
			$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function () {
			$('.iframeResizeCover').remove();

		}
	});

	if(door?.length == 1){

		if(window.DM) {
			const isTeleporter = door.find('.teleporter').length>0;
			
			if(window.TOKEN_OBJECTS[tokenIds] == undefined){
				let options = {
					...default_options(),
					left: `${parseFloat(door.css('--mid-x')) - 25}px`,
					top: `${parseFloat(door.css('--mid-y')) - 25}px`,
					id: tokenIds[0].replaceAll('.', ''),
					vision:{
						feet: 0,
						color: `rgba(0, 0, 0, 0)`
					},
					imgsrc: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`,
					type: 'door',
					size: 50,
					scaleCreated: window.CURRENT_SCENE_DATA.scale_factor,
					auraislight: false
				};
				window.ScenesHandler.create_update_token(options)
			}
			if(!isTeleporter){
				let openButton = $(`<button class=" context-menu-icon-hidden door-open material-icons">Open/Close</button>`)
				openButton.off().on("click", function(clickEvent){
					let clickedItem = $(this);
					let locked = door.hasClass('locked');
					let secret = door.hasClass('secret');

					const type = isDoor ? (secret ? (locked ? 5 : 4) : (locked ? 2 : 0)) : (secret ? (locked ? 7 : 6) : (locked ? 3 : 1))
			
					let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  
	            
	            	let opened = (/rgba.*0\.5\)/g).test(doors[0][2]) ? true : false;
					isOpen = opened ? 'closed' : 'open';

					door.toggleClass('open', !opened);

	        		window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
	                let data = ['line',
								 'wall',
								 doorColors[type][isOpen],
								 x1,
								 y1,
								 x2,
								 y2,
								 12,
								 doors[0][8],
								 doors[0][9],
					 			 (doors[0][10] != undefined ? doors[0][10] : ""),
					 			 (doors[0][11] != undefined ? doors[0][11] : "")
					];	
					window.DRAWINGS.push(data);
					window.wallUndo.push({
						undo: [data],
						redo: [doors[0]]
					})


					redraw_light_walls();
					redraw_drawn_light();
					redraw_light();


					sync_drawings();
					if(window.TOKEN_OBJECTS[`${x1}${y1}${x2}${y2}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','')]  != undefined){
						window.TOKEN_OBJECTS[`${x1}${y1}${x2}${y2}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','')].place_sync_persist();
					}
				});
				
				body.append(openButton);
			}
			
			if(isTeleporter){

				if(window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords != undefined){
					let scale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated : 1/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated ;
					let teleScale = window.CURRENT_SCENE_DATA.scale_factor != undefined && window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords != undefined ? window.CURRENT_SCENE_DATA.scale_factor/window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.scale : window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords != undefined  ? 1/window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.scale : 1;
				
					let canvas = document.getElementById("temp_overlay");
					let context = canvas.getContext("2d");
					let brushpoints = [];
					let [originX, originY] = [(parseInt(window.TOKEN_OBJECTS[tokenIds].options.left)+25)*scale, (parseInt(window.TOKEN_OBJECTS[tokenIds].options.top)+25)*scale]
					let [endX, endY] = [window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.left*teleScale, window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.top*teleScale]

					let [rectX, rectY] = [endX - window.CURRENT_SCENE_DATA.hpps/2, endY-window.CURRENT_SCENE_DATA.vpps/2]
					context.setLineDash([5, 5])
					drawRect(context, rectX, rectY, window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps, '#fff', false)



					endX = endX - (endX-originX)*0.03;
					endY = endY - (endY-originY)*0.03;
					brushpoints.push({x:originX, y:originY}); // 4 points so arrow head works
					brushpoints.push({x:originX, y:originY});
					brushpoints.push({x:originX, y:originY});
					brushpoints.push({x:originX, y:originY});
					// draw a dot
					brushpoints.push({x:endX, y:endY});
					

					drawBrushArrow(context, brushpoints,'#fff',6, undefined, 'dash');
					context.setLineDash([])
				}
				let teleportLocButton = $(`<button class=" context-menu-icon-hidden door-open material-icons">Set One-way Teleporter Location</button>`)
				teleportLocButton.off().on("click", function(clickEvent){
					let scale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated : 1/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated ;
					
					$('#tokenOptionsClickCloseDiv').click();
					let target = $("#temp_overlay, #fog_overlay, #VTT, #black_layer");	
					$("#temp_overlay").css('z-index', '50');
					let canvas = document.getElementById("temp_overlay");
					let context = canvas.getContext("2d");
					target.css('cursor', 'crosshair');
					target.off('mousemove.drawTele').on('mousemove.drawTele', function(e){
						clear_temp_canvas();
						let brushpoints = [];
						let [originX, originY] = [(parseInt(window.TOKEN_OBJECTS[tokenIds].options.left)+25)*scale, (parseInt(window.TOKEN_OBJECTS[tokenIds].options.top)+25)*scale]
						let [endX, endY] = get_event_cursor_position(e);

						let [rectX, rectY] = [endX - window.CURRENT_SCENE_DATA.hpps/2, endY-window.CURRENT_SCENE_DATA.vpps/2]
						context.setLineDash([5, 5])
						drawRect(context, rectX, rectY, window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps, '#fff', false)



						endX = endX - (endX-originX)*0.03;
						endY = endY - (endY-originY)*0.03;
						brushpoints.push({x:originX, y:originY}); // 4 points so arrow head works
						brushpoints.push({x:originX, y:originY});
						brushpoints.push({x:originX, y:originY});
						brushpoints.push({x:originX, y:originY});
						// draw a dot
						brushpoints.push({x:endX, y:endY});
						

						drawBrushArrow(context, brushpoints,'#fff',6, undefined, 'dash');
						context.setLineDash([])
						
					});
					target.off('mouseup.setTele touchend.setTele').on('mouseup.setTele touchend.setTele', function(e){
						if ( e.button == 2) {
							return;
						}
						const [mouseX, mouseY] = get_event_cursor_position(e);
						window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords = {'left': mouseX, 'top': mouseY, 'scale': window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1}
						if(window.all_token_objects[tokenIds] != undefined){
							window.all_token_objects[tokenIds].options.teleporterCoords = {'left': mouseX, 'top': mouseY, 'scale': window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1}
						}
						window.TOKEN_OBJECTS[tokenIds].place(0);
						window.TOKEN_OBJECTS[tokenIds].sync($.extend(true, {}, window.TOKEN_OBJECTS[tokenIds].options));

						clear_temp_canvas();
						target.off('mouseup.setTele touchend.setTele');
						target.off('mousemove.drawTele')
						$("#temp_overlay").css('z-index', '25');
					});
				});
				
				body.append(teleportLocButton);

				let teleportTwoWayButton = $(`<button class=" context-menu-icon-hidden door-open material-icons">Set Return Teleporter Location</button>`)
				teleportTwoWayButton.off().on("click", function(clickEvent){
					let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  

					let scale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated : 1/window.TOKEN_OBJECTS[tokenIds].options.scaleCreated ;
					
					$('#tokenOptionsClickCloseDiv').click();
					let target = $("#temp_overlay, #fog_overlay, #VTT, #black_layer");	
					$("#temp_overlay").css('z-index', '50');
					let canvas = document.getElementById("temp_overlay");
					let context = canvas.getContext("2d");
					target.css('cursor', 'crosshair');
					target.off('mousemove.drawTele').on('mousemove.drawTele', function(e){
						clear_temp_canvas();
						let brushpoints = [];
						let [originX, originY] = [(parseInt(window.TOKEN_OBJECTS[tokenIds].options.left)+25)*scale, (parseInt(window.TOKEN_OBJECTS[tokenIds].options.top)+25)*scale]
						let [endX, endY] = get_event_cursor_position(e);

						let [rectX, rectY] = [endX - window.CURRENT_SCENE_DATA.hpps/2, endY-window.CURRENT_SCENE_DATA.vpps/2]
						context.setLineDash([5, 5])
						drawRect(context, rectX, rectY, window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps, '#fff', false)



						endX = endX - (endX-originX)*0.03;
						endY = endY - (endY-originY)*0.03;
						brushpoints.push({x:originX, y:originY}); // 4 points so arrow head works
						brushpoints.push({x:originX, y:originY});
						brushpoints.push({x:originX, y:originY});
						brushpoints.push({x:originX, y:originY});
						// draw a dot
						brushpoints.push({x:endX, y:endY});
						

						drawBrushArrow(context, brushpoints,'#fff',6, undefined, 'dash');
						context.setLineDash([])
						
					});
					target.off('mouseup.setTele touchend.setTele').on('mouseup.setTele touchend.setTele', function(e){
						if ( e.button == 2) {
							return;
						}

						const [mouseX, mouseY] = get_event_cursor_position(e);
						const [originX, originY] = [(parseInt(window.TOKEN_OBJECTS[tokenIds].options.left)+25)*scale, (parseInt(window.TOKEN_OBJECTS[tokenIds].options.top)+25)*scale]
						
						let data = ['line',
								 'wall',
								 doors[0][2],
								 mouseX-5,
								 mouseY,
								 mouseX+5,
								 mouseY,
								 12,
								 doors[0][8],
								 doors[0][9],
					 			 (doors[0][10] != undefined ? doors[0][10] : ""),
					 			 (doors[0][11] != undefined ? doors[0][11] : "")
					 	]
					 	window.DRAWINGS.push(data);
					 	window.wallUndo.push({
							undo: [[...data]],
						})
						let clonePortalId = `${mouseX-5}${mouseY}${mouseX+5}${mouseY}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','') 
			
			 			if(window.TOKEN_OBJECTS[clonePortalId] == undefined){
							let options = {
								...default_options(),
								left: `${mouseX-25}px`,
								top: `${mouseY-25}px`,
								id: clonePortalId,
								vision:{
									feet: 0,
									color: `rgba(0, 0, 0, 0)`
								},
								imgsrc: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`,
								type: 'door',
								size: 50,
								scaleCreated: window.CURRENT_SCENE_DATA.scale_factor,
								teleporterCoords: {
									'left': originX,
									'top': originY,
									'scale': window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1
								}
							};
							window.ScenesHandler.create_update_token(options)
						}
						redraw_light_walls();
						sync_drawings();
						window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords = {'left': mouseX, 'top': mouseY, 'scale': window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1}
						if(window.all_token_objects[tokenIds] != undefined){
							window.all_token_objects[tokenIds].options.teleporterCoords = {'left': mouseX, 'top': mouseY, 'scale': window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1}
						}
						window.TOKEN_OBJECTS[tokenIds].place(0);
						window.TOKEN_OBJECTS[tokenIds].sync($.extend(true, {}, window.TOKEN_OBJECTS[tokenIds].options));

						clear_temp_canvas();
						target.off('mouseup.setTele touchend.setTele');
						target.off('mousemove.drawTele')
						$("#temp_overlay").css('z-index', '25');
					});
				});
				body.append(teleportTwoWayButton);

				let copyPortalId = $(`<button class=" context-menu-icon-hidden link material-icons">Copy Portal ID</button>`)
				copyPortalId.off().on("click", function(clickEvent){
					const copyLink = `${tokenIds};${window.CURRENT_SCENE_DATA.id}`
			        navigator.clipboard.writeText(copyLink);
				});
				body.append(copyPortalId);

				let crossSceneIdInputContainer = $(`
				<div class="token-image-modal-footer-select-wrapper" style="display:flex">
	 				<div class="token-image-modal-footer-title">Cross Scene Portal ID</div>
	 				<input style='width:80px;' title="Cross Scene Linked Portal" onclick="this.select();" placeholder="Cross Scene Linked Portal ID" type="text" />
	 			</div>`);
	 			const crossSceneInput = crossSceneIdInputContainer.find('input');
	 			if(window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords?.linkedPortalId != undefined){
	 				crossSceneInput.val(`${window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.linkedPortalId};${window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords.sceneId}`)
	 			}

				crossSceneInput.off().on("change.edit focusout.edit", function(event){
					const values = $(this).val().split(';')
					const portalTokenId = values[0];
					const sceneId = values[1];
					if(sceneId == undefined || portalTokenId == undefined){
						delete window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords;
						if(window.all_token_objects[tokenIds] != undefined){
							delete window.all_token_objects[tokenIds].options.teleporterCoords;
						}
					} else{
						window.TOKEN_OBJECTS[tokenIds].options.teleporterCoords = {'linkedPortalId': portalTokenId, 'sceneId': sceneId}
						if(window.all_token_objects[tokenIds] != undefined){
							window.all_token_objects[tokenIds].options.teleporterCoords = {'linkedPortalId': portalTokenId, 'sceneId': sceneId}
						}
					}
					
					window.TOKEN_OBJECTS[tokenIds].place(0);
					window.TOKEN_OBJECTS[tokenIds].sync($.extend(true, {}, window.TOKEN_OBJECTS[tokenIds].options));
					redraw_light_walls();
				})

				body.append(crossSceneIdInputContainer);

			}



			let notesRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Note</div></div>`);
			notesRow.hover(function (hoverEvent) {
				context_menu_flyout("notes-flyout", hoverEvent, function(flyout) {
					flyout.append(build_notes_flyout_menu(tokenIds, flyout));
				})
			});
			body.append(notesRow);

			let lightRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Vision/Light</div></div>`);

			lightRow.hover(function (hoverEvent) {
				context_menu_flyout("light-flyout", hoverEvent, function(flyout) {
					flyout.append(build_token_light_inputs(tokenIds, true));
				})
			});
			if(window.CURRENT_SCENE_DATA.disableSceneVision != true && window.DM){		
				body.append(lightRow);		
			}
	 

            let x1 = parseInt(door.attr('data-x1'));
            let x2 = parseInt(door.attr('data-x2'));
            let y1 = parseInt(door.attr('data-y1'));
            let y2 = parseInt(door.attr('data-y2'));

            let locked = door.hasClass('locked');
            let secret = door.hasClass('secret');

            let isDoor = door.children('.door').length>0;
            let isWindow = door.children('.window').length>0;
            let isCurtain = door.children('.curtain').length>0;

            let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  
            let color = doors[0][2];
            let isOpen = (/rgba.*0\.5\)/g).test(color) ? 'open' : 'closed';

            

            body.append($('<div class="token-image-modal-footer-title" style="margin-top:10px">Door Type</div>'));


            if(!isTeleporter){
            	let lockedButton = $(`<button class="${door.hasClass('locked') ? 'single-active active-condition' : 'none-active'} context-menu-icon-hidden door-lock material-icons">Locked</button>`)
				lockedButton.off().on("click", function(clickEvent){
					let clickedItem = $(this);
					let locked = door.hasClass('locked');
					let secret = door.hasClass('secret');

					const type = isDoor ? (secret ? (!locked ? 5 : 4) : (!locked ? 2 : 0)) : isWindow ? (secret ? (!locked ? 7 : 6) : (!locked ? 3 : 1)) : isCurtain ? (secret ? (!locked ? 11 : 10) : (!locked ? 9 : 8)) : 12
						
					door.toggleClass('locked', !locked);
					let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  
	            
	        		window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
	                let data = ['line',
								 'wall',
								 doorColors[type][isOpen],
								 x1,
								 y1,
								 x2,
								 y2,
								 12,
								 doors[0][8],
								 doors[0][9],
					 			 (doors[0][10] != undefined ? doors[0][10] : ""),
					 			 (doors[0][11] != undefined ? doors[0][11] : "")
					];	
					window.DRAWINGS.push(data);
					window.wallUndo.push({
						undo: [data],
						redo: [doors[0]]
					})
					redraw_light_walls();
					redraw_light();


					sync_drawings();

					clickedItem.removeClass("single-active all-active some-active active-condition");

					clickedItem.addClass(`${!locked ? 'single-active active-condition' : ''}`);
				});
				body.append(lockedButton);
            }
			
		
			
			let secretButton = $(`<button class="${door.hasClass('secret') ? 'single-active active-condition' : 'none-active'} context-menu-icon-hidden door-secret material-icons">Secret</button>`)
			secretButton.off().on("click", function(clickEvent){
				let clickedItem = $(this);
				let locked = door.hasClass('locked');
				let secret = door.hasClass('secret');

				const type = isDoor ? (!secret ? (locked ? 5 : 4) : (locked ? 2 : 0)) : isWindow ? (!secret ? (locked ? 7 : 6) : (locked ? 3 : 1)) : isCurtain ? (!secret ? (locked ? 11 : 10) : (locked ? 9 : 8)) : !secret ? 13 : 12
				
				isOpen = locked ? 'closed' : isOpen;

				door.toggleClass('secret', !secret);
				let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  
            
        		window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
                let data = ['line',
							 'wall',
							 doorColors[type][isOpen],
							 x1,
							 y1,
							 x2,
							 y2,
							 12,
							 doors[0][8],
							 doors[0][9],
				 			 (doors[0][10] != undefined ? doors[0][10] : ""),
				 			 (doors[0][11] != undefined ? doors[0][11] : "")
				];	
				window.DRAWINGS.push(data);
				window.wallUndo.push({
					undo: [data],
					redo: [doors[0]]
				})
				redraw_light_walls();
				redraw_light();


				sync_drawings();

				clickedItem.removeClass("single-active all-active some-active active-condition");

				clickedItem.addClass(`${!secret ? 'single-active active-condition' : ''}`);
			});
			body.append(secretButton);

			let hideButton = $(`<button class="${door.attr('data-hidden') == 'true' ? 'single-active active-condition' : 'none-active'} context-menu-icon-hidden door-hidden material-icons">Hide Icon-Show Walls to View</button>`)
			hideButton.off().on("click", function(clickEvent){
				let clickedItem = $(this);
				let hidden = door.attr('data-hidden') == 'true';
				let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && parseInt(d[3]) == x1 && parseInt(d[4]) == y1 && parseInt(d[5]) == x2 && parseInt(d[6]) == y2))  
            
        		
               
				door.attr('data-hidden', !hidden);
        		window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
                let data = ['line',
							 'wall',
							 doors[0][2],
							 x1,
							 y1,
							 x2,
							 y2,
							 12,
							 doors[0][8],
							 !hidden,
				 			 (doors[0][10] != undefined ? doors[0][10] : ""),
				 			 (doors[0][11] != undefined ? doors[0][11] : "")
				];	
				window.DRAWINGS.push(data);
				window.wallUndo.push({
					undo: [data],
					redo: [doors[0]]
				})
				redraw_light_walls();
				redraw_light();


				sync_drawings();

				clickedItem.removeClass("single-active all-active some-active active-condition");

				clickedItem.addClass(`${!hidden ? 'single-active active-condition' : ''}`);
			});
			body.append(hideButton);
			

		}

		

		if(e.touches?.length>0){
			moveableTokenOptions.css("left", Math.max(e.touches[0].clientX - 230, 0) + 'px');
			if($(moveableTokenOptions).height() + e.touches[0].clientY > window.innerHeight - 20) {
				moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
			}
			else {
				moveableTokenOptions.css("top", e.touches[0].clientY - 10 + 'px');
			}	
			$(moveableTokenOptions).toggleClass('touch', true);

			
		}
		else{
			moveableTokenOptions.css("left", Math.max(e.clientX - 230, 0) + 'px');
			if($(moveableTokenOptions).height() + e.clientY > window.innerHeight - 20) {
				moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
			}
			else {
				moveableTokenOptions.css("top", e.clientY - 10 + 'px');
			}	
			$(moveableTokenOptions).toggleClass('touch', false);
		}



		return;
	}

	let audioToken = (tokenIds.length == 1 && window.TOKEN_OBJECTS[tokenIds]?.options?.audioChannel) ? $(`[data-id='${tokenIds}']`) : undefined;
	// Aoe tokens are treated differently from everything else so we need to check this more often
	let isAoeList = tokens.map(t => t.isAoe());
	let uniqueAoeList = [...new Set(isAoeList)];
	const allTokensAreAoe = (uniqueAoeList.length === 1 && uniqueAoeList[0] === true);
	const someTokensAreAoe = (uniqueAoeList.includes(true));

	if(audioToken != undefined){
		if(!window.DM)
			return;
		
		
		if(window.TOKEN_OBJECTS[tokenIds].options.audioChannel?.audioArea != undefined){
			clear_temp_canvas();
			drawPolygon(temp_context, window.TOKEN_OBJECTS[tokenIds].options.audioChannel.audioArea, 'rgba(255, 0, 0, 0.3)', true);
		}
		
		if (tokens.length > 1 || (tokens.length == 1 && tokens[0].options.groupId != undefined)) {
			let addButtonInternals = `Group Tokens<span class="material-icons add-link"></span>`;
			let removeButtonInternals = `Remove From Group<span class="material-icons link-off"></span>`;
			let groupTokens = $(`<button class='${determine_grouped_classname(tokenIds)} context-menu-icon-grouped material-icons'></button>`);
			if (groupTokens.hasClass('single-active')) {
				// they are all in a group. Make it a remove button
				groupTokens.addClass("remove-from-group");
				groupTokens.html(removeButtonInternals);
			} else {
				// if any are not in the combat tracker, make it an add button.
				groupTokens.addClass("add-to-group");
				groupTokens.html(addButtonInternals);
			}
			groupTokens.off().on("click", function(clickEvent){
				let clickedItem = $(this);
				let groupAll = clickedItem.hasClass("some-active");
				let group = uuid();
				tokens.forEach(token => {
					if (groupAll || clickedItem.hasClass('add-to-group')) {
						token.options.groupId = group;
					} else {
						token.options.groupId = undefined;
					}
					token.place_sync_persist();
				});
				clickedItem.removeClass("single-active all-active some-active active-condition");
				clickedItem.addClass(determine_grouped_classname(tokenIds));
			});
			body.append(groupTokens);
		}
		let polygonAudioButton = $(`<button class="context-menu-icon-hidden spatial-tracking material-icons">${window.TOKEN_OBJECTS[tokenIds].options.audioChannel.audioArea == undefined ? 'Draw Polygon Audio Area' : 'Remove Polygon Audio Area'}</button>`)
		polygonAudioButton.off().on("click", function(clickEvent){
			let clickedItem = $(this);
			if(window.TOKEN_OBJECTS[tokenIds].options.audioChannel.audioArea == undefined){
				window.drawingAudioTokenId = tokenIds[0];
				window.drawAudioPolygon = true;
				close_token_context_menu();
			}
			else{
				$(this).text('Draw Polygon Audio Area')
				delete window.TOKEN_OBJECTS[tokenIds].options.audioChannel.audioArea;
				window.TOKEN_OBJECTS[tokenIds].place_sync_persist();
				clear_temp_canvas();
			}

		});
		let toTopMenuButton = $("<button class='material-icons to-top'>Move to Top</button>");
		let toBottomMenuButton = $("<button class='material-icons to-bottom'>Move to Bottom</button>")


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
		let lockSettings = token_setting_options().filter((d) => d.name == 'lockRestrictDrop')[0];

		let selectedTokenSettings = tokens.map(t => t.options.lockRestrictDrop);
		let uniqueSettings = [...new Set(selectedTokenSettings)];
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}	else if(uniqueSettings.length === 0){
			currentValue = undefined;
		}

		let lockDropdown = build_dropdown_input(lockSettings, currentValue, function(name, newValue) {
			tokens.forEach(token => {
				token.options[name] = newValue;
				token.place_sync_persist();
			});
		});
		let lockTitle = lockDropdown.find('.token-image-modal-footer-title')
		lockTitle.empty();
		lockTitle.toggleClass('material-icons door-lock', true);
		lockTitle.toggleClass('token-image-modal-footer-title', false);
		body.append(lockDropdown);
		
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
			});

			clickedItem.removeClass("single-active all-active some-active active-condition");
			clickedItem.addClass(determine_hidden_classname(tokenIds));
		});
		body.append(hiddenMenuButton);

		let attenuateButton = $(`<button class="${window.TOKEN_OBJECTS[tokenIds].options.audioChannel.attenuate ? 'single-active active-condition' : 'none-active'} context-menu-icon-hidden spatial-audio-off material-icons">Distance based volume</button>`)
		attenuateButton.off().on("click", function(clickEvent){
			let clickedItem = $(this);
			
			window.TOKEN_OBJECTS[tokenIds].options.audioChannel.attenuate = !window.TOKEN_OBJECTS[tokenIds].options.audioChannel.attenuate;
			let classes = window.TOKEN_OBJECTS[tokenIds].options.audioChannel.attenuate ? 'single-active active-condition context-menu-icon-hidden spatial-audio-off material-icons' : 'none-active context-menu-icon-hidden spatial-audio-off material-icons';
			$(this).attr('class', `${classes}`)
			window.TOKEN_OBJECTS[tokenIds].place_sync_persist();
		});


		body.append(attenuateButton);
		let wallsBlockedButton = $(`<button class="${window.TOKEN_OBJECTS[tokenIds].options.audioChannel.wallsBlocked ? 'single-active active-condition' : 'none-active'} context-menu-icon-hidden select-to-speak material-icons">Blocked by Walls</button>`)
		wallsBlockedButton.off().on("click", function(clickEvent){
			let clickedItem = $(this);
			
			window.TOKEN_OBJECTS[tokenIds].options.audioChannel.wallsBlocked = !window.TOKEN_OBJECTS[tokenIds].options.audioChannel.wallsBlocked;
			let classes = window.TOKEN_OBJECTS[tokenIds].options.audioChannel.wallsBlocked ? 'single-active active-condition context-menu-icon-hidden select-to-speak material-icons' : 'none-active context-menu-icon-hidden select-to-speak material-icons';
			$(this).attr('class', `${classes}`)
			window.TOKEN_OBJECTS[tokenIds].place_sync_persist();
		});

		body.append(wallsBlockedButton);
		let upsq = window.CURRENT_SCENE_DATA.upsq;
		if (upsq === undefined || upsq.length === 0) {
			upsq = "ft";
		}
		let audioRangeInput = $(`
			<div class="token-image-modal-footer-select-wrapper" style="display:flex">
 				<div class="token-image-modal-footer-title">Range in ${upsq}</div>
 				<input type="number" min="${window.CURRENT_SCENE_DATA.fpsq / 2}" step="${window.CURRENT_SCENE_DATA.fpsq /2}"
			 name="data-token-size-custom" value=${window.TOKEN_OBJECTS[tokenIds].options.audioChannel.range} style="width: 3rem;">
 			</div>
 		`)
		audioRangeInput.find('input').off().on("keyup focusout", function(clickEvent){
			let clickedItem = $(this);
			
			window.TOKEN_OBJECTS[tokenIds].options.audioChannel.range = $(this).val();
			window.TOKEN_OBJECTS[tokenIds].place_sync_persist();
		});

		body.append(audioRangeInput);



		body.append(polygonAudioButton);

		if (tokens.length === 1) {
			let notesRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Note</div></div>`);
			notesRow.hover(function (hoverEvent) {
				context_menu_flyout("notes-flyout", hoverEvent, function(flyout) {
					flyout.append(build_notes_flyout_menu(tokenIds, flyout));
				})
			});
			body.append(notesRow);
		}


	
	/*	let optionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Options</div></div>`);
		optionsRow.hover(function (hoverEvent) {
			context_menu_flyout("options-flyout", hoverEvent, function(flyout) {
				flyout.append(build_options_flyout_menu(tokenIds));
				update_token_base_visibility(flyout);
			});
		});
		body.append(optionsRow);*/

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
		

		if(e.touches?.length>0){
			moveableTokenOptions.css("left", Math.max(e.touches[0].clientX - 230, 0) + 'px');
			if($(moveableTokenOptions).height() + e.touches[0].clientY > window.innerHeight - 20) {
				moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
			}
			else {
				moveableTokenOptions.css("top", e.touches[0].clientY - 10 + 'px');
			}	
			$(moveableTokenOptions).toggleClass('touch', true);

			
		}
		else{
			moveableTokenOptions.css("left", Math.max(e.clientX - 230, 0) + 'px');
			if($(moveableTokenOptions).height() + e.clientY > window.innerHeight - 20) {
				moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
			}
			else {
				moveableTokenOptions.css("top", e.clientY - 10 + 'px');
			}	
			$(moveableTokenOptions).toggleClass('touch', false);
		}
		return;
	}

	// stat block / character sheet

	if (tokens.length === 1) {
		let token = tokens[0];
		if (token.isPlayer() && !token.options.id.includes(window.PLAYER_ID)) {
			let button = $(`<button>Open Character Sheet<span class="material-icons icon-view"></span></button>`);
			button.on("click", function() {
				open_player_sheet(token.options.id, undefined, token.options.name);
				close_token_context_menu();
			});
			body.append(button);
		} 
		else if(token.options.statBlock){
			let button =$('<button>Open Monster Stat Block<span class="material-icons icon-view"></span></button>');
			
			button.click(function(){
				let customStatBlock = window.JOURNAL.notes[token.options.statBlock].text;
				let pcURL = $(customStatBlock).find('.custom-pc-sheet.custom-stat').text();
				if(pcURL){
					open_player_sheet(pcURL, undefined, token.options.name);
				}else{
					load_monster_stat(undefined, token.options.id, customStatBlock)
				}

				
				close_token_context_menu();
			});
			if(token.options.player_owned || window.DM){
				body.append(button);
			}
		}
		else if (token.isMonster()) {
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

		let addGroupButtonInternals = `Add to Combat as Group<span class="material-symbols-outlined group_add"></span>`;
		let removeGroupButtonInternals = `Remove Group from Combat<span class="material-symbols-outlined group_remove"></span>`;

		let combatButton = $(`<button></button>`);
		let groupCombatButton =$(`<button></button>`)

		let inCombatStatuses = [...new Set(tokens.map(t => t.isInCombatTracker()))];
		let inCombatGroupStatuses = [...new Set(tokens.map(t => t.options.combatGroup != undefined))];

		if (inCombatStatuses.length === 1 && inCombatStatuses[0] === true) {
			// they are all in the combat tracker. Make it a remove button
			combatButton.addClass("remove-from-ct");
			combatButton.html(removeButtonInternals);
		} else {
			// if any are not in the combat tracker, make it an add button.
			combatButton.addClass("add-to-ct");
			combatButton.html(addButtonInternals);
		}

		if (inCombatGroupStatuses.length === 1 && inCombatGroupStatuses[0] === true) {
			// they are all in the combat tracker. Make it a remove button
			groupCombatButton.addClass("remove-from-ct");
			groupCombatButton.html(removeGroupButtonInternals);
		} else {
			// if any are not in the combat tracker, make it an add button.
			groupCombatButton.addClass("add-to-ct");
			groupCombatButton.html(addGroupButtonInternals);
		}


		let shiftClick = jQuery.Event("click");
		shiftClick.shiftKey = true;
		let ctrlClick = jQuery.Event("click");
		ctrlClick.ctrlKey = true;

		let roll_adv = $('<button title="Advantage to roll" id="adv" name="roll_mod" value="OFF" class="roll_mods_button icon-advantage markers-icon" />')
		roll_adv.click(function(e){
			e.stopPropagation();
			$(this).parent().trigger(shiftClick);
		});

		let roll_disadv = $('<button title="Disadvantage to roll" id="disadv" name="roll_mod" value="OFF" class="roll_mods_button icon-disadvantage markers-icon" />')

		roll_disadv.click(function(e){
			e.stopPropagation();
			$(this).parent().trigger(ctrlClick);
		});

		combatButton.append(roll_adv, roll_disadv);


		combatButton.on("click", function(clickEvent) {
			let clickedButton = $(clickEvent.currentTarget);
			if (clickedButton.hasClass("remove-from-ct")) {
				clickedButton.removeClass("remove-from-ct").addClass("add-to-ct");
				clickedButton.html(addButtonInternals);
				clickedButton.append(roll_adv.clone(true, true), roll_disadv.clone(true, true));
				clickedButton.find('#disadv').click(function(e){
					e.stopPropagation();
					$(this).parent().trigger(ctrlClick);
				});

				clickedButton.find('#adv').click(function(e){
					e.stopPropagation();
					$(this).parent().trigger(shiftClick);
				});
				const reset_init = getCombatTrackersettings().remove_init;
				tokens.forEach(t =>{
					if(t.options.combatGroup && Object.values(window.TOKEN_OBJECTS).filter(d=>d.options.combatGroup == t.options.combatGroup).length == 2 && window.TOKEN_OBJECTS[t.options.combatGroup]){
						window.TOKEN_OBJECTS[t.options.combatGroup].delete()
					}
					if(window.all_token_objects[t.options.id] == undefined)
						window.all_token_objects[t.options.id] = t;
					t.options.ct_show = undefined;
					t.options.combatGroup = undefined;
					window.all_token_objects[t.options.id].options.ct_show = undefined;
					window.all_token_objects[t.options.id].options.combatGroup = undefined;
					if(reset_init == true){
						t.options.init = undefined;
						window.all_token_objects[t.options.id].options.init = undefined;
					}
					ct_remove_token(t, false);
					t.update_and_sync();
				});
			} else {
				clickedButton.removeClass("add-to-ct").addClass("remove-from-ct");
				clickedButton.html(removeButtonInternals);
				const reset_init = getCombatTrackersettings().remove_init;

				const autoGroup = getCombatTrackersettings().autoGroup;

				if(autoGroup === '1'){
					const groupedByStat = tokens.reduce((acc, token) => {
						//split  into groups based on statblock - players get added individually
						const key = token.options.statBlock ? `SB-${token.options.statBlock}` : token.options.sheet ? token.options.sheet : token.options.stat;
						if (!acc[key]) {
							acc[key] = [];
						}
						acc[key].push(token);
						return acc;
					}, {});

					for(let i in groupedByStat){		
						let group = uuid();
						let allHidden = true;
						let allVisibleNames = true
						const reset_init = getCombatTrackersettings().remove_init;
						
						groupedByStat[i].forEach(t => {
							if(t.isPlayer()){
								if(window.all_token_objects[t.options.id] == undefined)
									window.all_token_objects[t.options.id] = t;
								t.options.combatGroup = undefined;
								window.all_token_objects[t.options.id].options.combatGroup = undefined;

								if(reset_init == true){
									t.options.init = undefined;
									window.all_token_objects[t.options.id].options.init = undefined;
								}
								ct_add_token(t, false, undefined, clickEvent.shiftKey, clickEvent.ctrlKey)
								t.update_and_sync();
								return;
							}
							ct_remove_token(t, false);
							if(t.options.combatGroup != undefined && Object.values(window.TOKEN_OBJECTS)?.filter(d=>d.options.combatGroup == t.options.combatGroup)?.length == 2 && window.TOKEN_OBJECTS[t.options.combatGroup]){
								window.TOKEN_OBJECTS[t.options.combatGroup].delete()
							}
							if(t.options.hidden !== true){
								allHidden = false
							}
							if(!t.isPlayer() && t.options.revealname == false){
								allVisibleNames = false;
							}
							if(window.all_token_objects[t.options.id] == undefined)
								window.all_token_objects[t.options.id] = t;
							if(reset_init == true){
								t.options.init = undefined;
								window.all_token_objects[t.options.id].options.init = undefined;
							}
							t.options.combatGroup = group;
							window.all_token_objects[t.options.id].options.combatGroup = group;

							ct_add_token(t, false, undefined, clickEvent.shiftKey,  clickEvent.ctrlKey);
							t.update_and_sync();
						});
						if(i.includes('/character')) // player was added invidiually don't put a group in the combat tracker
							continue;
						let t = new Token({
							...groupedByStat[i][0].options,
							id: group,
							combatGroupToken: group,
							ct_show: !allHidden,
							revealname: allVisibleNames,
							name: `${groupedByStat[i][0].options.name} Group`,
						});
						delete t.options.groupId; 
						window.TOKEN_OBJECTS[group] = t;
						if(window.all_token_objects[group] == undefined){
							window.all_token_objects[group] = t;
						}
						t.sync = mydebounce(function(options) { // VA IN FUNZIONE SOLO SE IL TOKEN NON ESISTE GIA					
							window.MB.sendMessage('custom/myVTT/token', options);
						}, 300);
						t.place_sync_persist();
						ct_add_token(window.TOKEN_OBJECTS[group], false, undefined, clickEvent.shiftKey, clickEvent.ctrlKey)	
					
					}
				}
				else{
					tokens.forEach(t => {
						if(window.all_token_objects[t.options.id] == undefined)
							window.all_token_objects[t.options.id] = t;
						t.options.combatGroup = undefined;
						window.all_token_objects[t.options.id].options.combatGroup = undefined;

						if(reset_init == true){
							t.options.init = undefined;
							window.all_token_objects[t.options.id].options.init = undefined;
						}
						ct_add_token(t, false, undefined, clickEvent.shiftKey, clickEvent.ctrlKey)
						t.update_and_sync();
					});
				}
			}

			debounceCombatReorder();
		});
		groupCombatButton.on("click", function(clickEvent) {
			let clickedButton = $(clickEvent.currentTarget);
			if (clickedButton.hasClass("remove-from-ct")) {
				combatButton.removeClass("remove-from-ct").addClass("add-to-ct");
				combatButton.html(addButtonInternals);
				clickedButton.removeClass("remove-from-ct").addClass("add-to-ct");
				clickedButton.html(addGroupButtonInternals);
				clickedButton.append(roll_adv.clone(true, true), roll_disadv.clone(true, true));
				clickedButton.find('#disadv').click(function(e){
					e.stopPropagation();
					$(this).parent().trigger(ctrlClick);
				});
				clickedButton.find('#adv').click(function(e){
					e.stopPropagation();
					$(this).parent().trigger(shiftClick);
				});
				const reset_init = getCombatTrackersettings().remove_init;
				tokens.forEach(t =>{
					if(t.options.combatGroup != undefined && Object.values(window.TOKEN_OBJECTS)?.filter(d=>d.options.combatGroup == t.options.combatGroup)?.length == 2 && window.TOKEN_OBJECTS[t.options.combatGroup]){
						window.TOKEN_OBJECTS[t.options.combatGroup].delete()
					}
					if(window.all_token_objects[t.options.id] == undefined)
						window.all_token_objects[t.options.id] = t;
					if(reset_init == true){
						t.options.init = undefined;
						window.all_token_objects[t.options.id].options.init = undefined;
					}
					t.options.combatGroup = undefined;
					t.options.ct_show = undefined;
					
					window.all_token_objects[t.options.id].options.combatGroup = undefined;
					window.all_token_objects[t.options.id].options.ct_show = undefined;
					ct_remove_token(t, false);
					t.update_and_sync();
				});
			} else {
				clickedButton.removeClass("add-to-ct").addClass("remove-from-ct");
				clickedButton.html(removeGroupButtonInternals);
				combatButton.removeClass("add-to-ct").addClass("remove-from-ct");
				combatButton.html(removeButtonInternals);
				let group = uuid();
				let allHidden = true;
				let allVisibleNames = true
				const reset_init = getCombatTrackersettings().remove_init;
	

				tokens.forEach(t => {
					ct_remove_token(t, false);
					if(t.options.combatGroup != undefined && Object.values(window.TOKEN_OBJECTS)?.filter(d=>d.options.combatGroup == t.options.combatGroup)?.length == 2 && window.TOKEN_OBJECTS[t.options.combatGroup]){
						window.TOKEN_OBJECTS[t.options.combatGroup].delete()
					}
					if(t.options.hidden !== true){
						allHidden = false
					}
					if(!t.isPlayer() && t.options.revealname == false){
						allVisibleNames = false;
					}
					if(window.all_token_objects[t.options.id] == undefined)
						window.all_token_objects[t.options.id] = t;
					if(reset_init == true){
						t.options.init = undefined;
						window.all_token_objects[t.options.id].options.init = undefined;
					}
					t.options.combatGroup = group;
					window.all_token_objects[t.options.id].options.combatGroup = group;

					ct_add_token(t, false, undefined, clickEvent.shiftKey,  clickEvent.ctrlKey);
					t.update_and_sync();
				});	
				let t = new Token({
					...tokens[0].options,
					id: group,
					combatGroupToken: group,
					ct_show: !allHidden,
					revealname: allVisibleNames,
					name: `${tokens[0].options.name} Group`,
				});
				delete t.options.groupId; 
				window.TOKEN_OBJECTS[group] = t;
				if(window.all_token_objects[group] == undefined){
					window.all_token_objects[group] = t;
				}
				t.sync = mydebounce(function(options) { // VA IN FUNZIONE SOLO SE IL TOKEN NON ESISTE GIA					
					window.MB.sendMessage('custom/myVTT/token', options);
				}, 300);
				t.place_sync_persist();
				ct_add_token(window.TOKEN_OBJECTS[group], false, undefined, clickEvent.shiftKey, clickEvent.ctrlKey)
			}
		debounceCombatReorder();
		});


		body.append(combatButton);
		if(tokens.length >1){
			groupCombatButton.append(roll_adv.clone(true,true), roll_disadv.clone(true,true));
			body.append(groupCombatButton);
		}
	}
	else if(allTokensAreAoe){

		let selectInAoeButton = $(`<button class="aoe-select-tokens material-icons">Select Tokens in Aoe</button>`)
		selectInAoeButton.off().on("click", function(clickEvent){
			select_tokens_in_aoe(tokens)
		});

		body.append(selectInAoeButton);

		let selectMosnterInAoeButton = $(`<button class="aoe-select-tokens material-icons">Aoe select non-players</button>`)
		selectMosnterInAoeButton.off().on("click", function(clickEvent){
			select_tokens_in_aoe(tokens, false)
		});

		body.append(selectMosnterInAoeButton);

		
	}
	if(window.DM){
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
			});

			clickedItem.removeClass("single-active all-active some-active active-condition");
			clickedItem.addClass(determine_hidden_classname(tokenIds));
		});

		body.append(hiddenMenuButton);

		let lockSettings = token_setting_options().filter((d) => d.name == 'lockRestrictDrop')[0];

		let selectedTokenSettings = tokens.map(t => t.options.lockRestrictDrop);
		let uniqueSettings = [...new Set(selectedTokenSettings)];
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}	else if(uniqueSettings.length === 0){
			currentValue = undefined;
		}

		let lockDropdown = build_dropdown_input(lockSettings, currentValue, function(name, newValue) {
			tokens.forEach(token => {
				token.options[name] = newValue;
				token.place_sync_persist();
			});
		});
		let lockTitle = lockDropdown.find('.token-image-modal-footer-title')
		lockTitle.empty();
		lockTitle.toggleClass('material-icons door-lock', true);
		lockTitle.toggleClass('token-image-modal-footer-title', false);

		body.append(lockDropdown);
	}
	
	if (tokens.length > 1 || (tokens.length == 1 && tokens[0].options.groupId != undefined)) {
		let addButtonInternals = `Group Tokens<span class="material-icons add-link"></span>`;
		let removeButtonInternals = `Remove From Group<span class="material-icons link-off"></span>`;
		let groupTokens = $(`<button class='${determine_grouped_classname(tokenIds)} context-menu-icon-grouped material-icons'></button>`);
		if (groupTokens.hasClass('single-active')) {
			// they are all in a group. Make it a remove button
			groupTokens.addClass("remove-from-group");
			groupTokens.html(removeButtonInternals);
		} else {
			// if any are not in the combat tracker, make it an add button.
			groupTokens.addClass("add-to-group");
			groupTokens.html(addButtonInternals);
		}
		groupTokens.off().on("click", function(clickEvent){
			let clickedItem = $(this);
			let groupAll = clickedItem.hasClass("some-active");
			let group = uuid();
			tokens.forEach(token => {
				if (groupAll || clickedItem.hasClass('add-to-group')) {
					token.options.groupId = group;
				} else {
					token.options.groupId = undefined;
				}
				token.place_sync_persist();
			});
			clickedItem.removeClass("single-active all-active some-active active-condition");
			clickedItem.addClass(determine_grouped_classname(tokenIds));
		});
		body.append(groupTokens);
	}

	// Start Quick Group Roll
	if (window.DM) {
		let quickRollMenu = $("<button class='material-icons open-menu'>Add/Remove from Quick Rolls</button>")
		body.append(quickRollMenu);
		quickRollMenu.on("click", function(clickEvent){
			if(!childWindows['Quick Roll Menu'])
				$("#qrm_dialog").show()
			if ($('#quick_roll_area').length == 0){
				close_token_context_menu()
				open_quick_roll_menu(e)
			}
			tokens.forEach(token => {
				$(token).each(function(){
					if (window.TOKEN_OBJECTS[token.options.id].in_qrm == true) {
						remove_from_quick_roll_menu(token)
					}
					else {
						add_to_quick_roll_menu(token)
					}
				})
			})
			if(childWindows['Quick Roll Menu']){
				qrm_update_popout();
			}
		})
	}
	// End Quick Group Roll 
	let toTopMenuButton = $("<button class='material-icons to-top'>Move to Top</button>");
	let toBottomMenuButton = $("<button class='material-icons to-bottom'>Move to Bottom</button>")
	let sendToGamelogButton = $("<button class='material-icons send-to'>Send To Gamelog</button>")

	body.append(toTopMenuButton);
	body.append(toBottomMenuButton);
	body.append(sendToGamelogButton);

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

	sendToGamelogButton.off().on("click", function(tokenIds){
		tokens.forEach(async token => {				
			
			function setImageAttr(tokenImage, token){
				let largeAvatar = cached_monster_items[token.options.monster].monsterData.largeAvatarUrl;
			    let avatar = cached_monster_items[token.options.monster].monsterData.avatarUrl;
			    let basicAvatar = cached_monster_items[token.options.monster].monsterData.basicAvatarUrl;
			    tokenImage.find('img').attr('src', largeAvatar);
			    tokenImage.find('img').attr('data-large-avatar-url', largeAvatar);
			    tokenImage.find('img').attr('data-avatar-url', largeAvatar);
			    tokenImage.find('img').attr('data-basic-avatar-url', largeAvatar);
			    tokenImage.find('img').attr('data-current-avatar-url', "largeAvatarUrl");
			}

			const imageSrc = token.options.imgsrc.startsWith('above-bucket-not-a-url') ? await getAvttStorageUrl(token.options.imgsrc) : token.options.imgsrc;
			let tokenImage = $(`<div class="image" style="display: block; max-width:100%;"><${(token.options.videoToken == true || ['.mp4', '.webm', '.m4v'].some(d => imageSrc.includes(d))) ? 'video disableremoteplayback muted' : 'img'} class='magnify' style='max-width:100%;' href='${imageSrc}' src='${imageSrc}'/>  </div>`);
			
			if(typeof token.options.monster == 'number' && token.options.itemType == 'monster' && token.options.alternativeImages == undefined){

				if(cached_monster_items[token.options.monster] != undefined){
					setImageAttr(tokenImage, token);
					send_html_to_gamelog(tokenImage[0].outerHTML);
				}
				else{
					fetch_and_cache_monsters([token.options.monster], function(){
						setImageAttr(tokenImage, token);
						send_html_to_gamelog(tokenImage[0].outerHTML);
					})
				}
			}
			else{
				send_html_to_gamelog(tokenImage[0].outerHTML);
			}

			

           	
            
		});
	});


	
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
	

	

	if((window.DM && tokens.length != 1) || (tokens.length == 1 && ((tokens[0].options.player_owned && !tokens[0].options.disablestat && !tokens[0].isPlayer()) || (window.DM && !tokens[0].isPlayer())))){ 
		$(".maxHpMenuInput").prop('readonly', false);
		$(".acMenuInput").prop('readonly', false);
		$(".hpMenuInput").prop('readonly', false);
	}
	else { 
		if(tokens[0].isPlayer()){
			$(".maxHpMenuInput, .acMenuInput, .hpMenuInput").off('click.message').on('click.message', function(){
				showTempMessage('Player HP/AC must be adjusted on the character sheet.')
			})
		}
		$(".maxHpMenuInput").prop('readonly', true);
		$(".acMenuInput").prop('readonly', true);
		$(".hpMenuInput").prop('readonly', true);
	}	
	if(window.DM || (tokens.length == 1 && (tokens[0].options.player_owned == true || tokens[0].isPlayer()))){
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
					if(window.JOURNAL.notes[token.options.id]){
						window.JOURNAL.notes[token.options.id].title = newName;
						window.JOURNAL.persist();
					}
					token.options.name = newName;
					token.place_sync_persist();

				});
			}
		});
		nameInput.on('focusout', function(event) {
			let newName = event.target.value;
			if (newName !== undefined && newName.length > 0) {
				tokens.forEach(token => {
					if(window.JOURNAL.notes[token.options.id]){
						window.JOURNAL.notes[token.options.id].title = newName;
						window.JOURNAL.persist();
					}
					token.options.name = newName;
					token.place_sync_persist();		
				});

			}
		});
		let nameWrapper = $(`
			<div class="token-image-modal-url-label-wrapper">
				<div class="token-image-modal-footer-title">Name</div>
			</div>
		`);
		nameWrapper.append(nameInput); // input below label


		
		body.append(nameWrapper);
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


	let conditionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Conditions / Markers</div></div>`);	
	conditionsRow.hover(function (hoverEvent) {
		context_menu_flyout("conditions-flyout", hoverEvent, function(flyout) {
			flyout.append(build_conditions_and_markers_flyout_menu(tokenIds));
		})
	});

	body.append(conditionsRow);


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
	let lightRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Vision/Light</div></div>`);

	lightRow.hover(function (hoverEvent) {
		context_menu_flyout("light-flyout", hoverEvent, function(flyout) {
			flyout.append(build_token_light_inputs(tokenIds));
		})
	});
	if(window.CURRENT_SCENE_DATA.disableSceneVision != true && (window.DM || (tokens.length == 1 && (tokens[0].options.player_owned == true || tokens[0].isPlayer()) && tokens[0].options.auraislight==true))){
		if (!someTokensAreAoe) {
			body.append(lightRow);
		}
	}

	if(window.DM) {
		if (tokens.length === 1) {
			let notesRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Note</div></div>`);
			notesRow.hover(function (hoverEvent) {
				context_menu_flyout("notes-flyout", hoverEvent, function(flyout) {
					flyout.append(build_notes_flyout_menu(tokenIds, flyout));
				})
			});
			body.append(notesRow);
		}
	}

/*	if(window.DM) {
		let optionsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item"><div class="token-image-modal-footer-title">Token Options</div></div>`);
		optionsRow.hover(function (hoverEvent) {
			context_menu_flyout("options-flyout", hoverEvent, function(flyout) {
				flyout.append(build_options_flyout_menu(tokenIds));
				update_token_base_visibility(flyout);
			});
		});
		body.append(optionsRow);
	}*/
	let adjustmentsRow = $(`<div class="token-image-modal-footer-select-wrapper flyout-from-menu-item token-settings"><div class="token-image-modal-footer-title">Token Settings</div></div>`);
	adjustmentsRow.hover(function (hoverEvent) {
		context_menu_flyout("adjustments-flyout", hoverEvent, function(flyout) {
			const menuBody = build_adjustments_flyout_menu(tokenIds);
			flyout.append(menuBody);
			update_token_base_visibility(flyout);
		})

	});
	const allPlayerOwned = !tokens.some(d => {return d.options.player_owned != true && !d.isPlayer()});


	if (window.DM || allPlayerOwned == true || allTokensAreAoe){
		body.append(adjustmentsRow);
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
	

	

	if(e.touches?.length>0){
		moveableTokenOptions.css("left", Math.max(e.touches[0].clientX - 230, 0) + 'px');
		if($(moveableTokenOptions).height() + e.touches[0].clientY > window.innerHeight - 20) {
			moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
		}
		else {
			moveableTokenOptions.css("top", e.touches[0].clientY - 10 + 'px');
		}	
		$(moveableTokenOptions).toggleClass('touch', true);

		
	}
	else{
		moveableTokenOptions.css("left", Math.max(e.clientX - 230, 0) + 'px');
		if($(moveableTokenOptions).height() + e.clientY > window.innerHeight - 20) {
			moveableTokenOptions.css("top", (window.innerHeight - $(moveableTokenOptions).height() - 20 + 'px'));
		}
		else {
			moveableTokenOptions.css("top", e.clientY - 10 + 'px');
		}	
		$(moveableTokenOptions).toggleClass('touch', false);
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
	for(let token = 0; token < tokens.length; token++){
		if(!window.TOKEN_OBJECTS[tokens[token].options.id].isPlayer()){
			allTokensArePlayer=false;
			break;
		}
	}

	let auraVisibleValues = tokens.map(t => t.options.auraVisible);
	let uniqueAuraVisibleValues = [...new Set(auraVisibleValues)];

	

	let auraIsEnabled = null;
	if (uniqueAuraVisibleValues.length === 1) {
		auraIsEnabled = uniqueAuraVisibleValues[0];
	}

	let hideAuraFromPlayers = tokens.map(t => t.options.hideaura);
	let uniqueHideAuraFromPlayers = [...new Set(hideAuraFromPlayers)];
	
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
					<div class="token-image-modal-footer-title">Animation</div>
					<div class="token-image-modal-footer-title"><button id='editAnimations'>Edit</button></div>
					<select class="token-config-animation-preset">
						<option value=""></option>
					</select>
				</div>
				<div class="token-image-modal-footer-select-wrapper">		
					<div class="token-image-modal-footer-title">Preset</div>
					<div class="token-image-modal-footer-title"><button id='editPresets'>Edit</button></div>
					<select class="token-config-aura-preset">
						<option value=""></option>
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
	let animationPresets = {
		'None': 'none',
		'Static Blur': 'static-blur-fx',
		'Flicker': 'flicker-fx',	
		'Rays': 'rays-fx',
		'Dome': 'force-fx',
		'Wild Magic': 'wild-fx',
		'Fairy': 'fairy-fx',
		'Magic Circle': 'magic-circle-fx',
		'Magic Circle 2': 'magic-circle-2-fx',
		'Spores': 'spore-fx',
		'Lightning Circle': 'lightning-fx',
		'Hurricane': 'hurricane-fx',
		'Snow': 'snow-fx',
		'Bubble': 'bubble-fx'
	}
	if(localStorage.getItem('AURA_PRESETS') == null){
		window.AURA_PRESETS = [
			{
				name: 'No Aura (0/0)',
				aura1: {
					feet: '0'
				},
				aura2: {
					feet: '0'
				}	
			},
			{
				name: 'Paladin (10/0)',
				aura1: {
					feet: '10',
					color: 'rgba(255, 255, 139, 0.5)'
				},
				aura2: {
					feet: '0',
					color: "rgba(255, 255, 139, 0)"
				}
			},
			{
				name: 'Paladin (30/0)',
				aura1: {
					feet: '30',
					color: 'rgba(255, 255, 139, 0.5)'
				},
				aura2: {
					feet: '0',
					color: "rgba(255, 255, 139, 0)"
				}
			},
			{
				name: 'Spirit Guardians (15/0)',
				aura1: {
					feet: '15',
					color: 'rgba(255, 255, 139, 0.5)'
				},
				aura2: {
					feet: '0',
					color: "rgba(100, 100, 20, 0)"
				}
			},
		]
	}
	else{
		window.AURA_PRESETS = JSON.parse(localStorage.getItem('AURA_PRESETS'));
	}
	wrapper.find('#editPresets').off('click.editPresets').on('click.editPresets', function(){
		create_aura_presets_edit();		
	})
	wrapper.find(".token-config-aura-preset").on("change", function(e) {

		let preset = e.target.value;
		let selectedPreset = window.AURA_PRESETS.filter(d=> d.name == preset)[0]
		
		if(!selectedPreset) {
			console.warn("somehow got an unexpected preset", preset, e);
			return;
		}
		let wrapper = $(e.target).closest(".token-config-aura-wrapper");


		if(selectedPreset.aura1.feet){
			wrapper.find("input[name='aura1']").val(selectedPreset.aura1.feet);
		}
		
		if(selectedPreset.aura2.feet){
			wrapper.find("input[name='aura2']").val(selectedPreset.aura2.feet);
		}


		if(selectedPreset.aura1.color){
			wrapper.find("input[name='aura1Color']").spectrum("set", selectedPreset.aura1.color);
		}
		
		if(selectedPreset.aura2.color){
			wrapper.find("input[name='aura2Color']").spectrum("set", selectedPreset.aura2.color);
		}

		
		

		tokens.forEach(token => {
			token.options.aura1.feet = (selectedPreset.aura1.feet) ? selectedPreset.aura1.feet : token.options.aura1.feet;
			token.options.aura2.feet = (selectedPreset.aura2.feet) ? selectedPreset.aura2.feet : token.options.aura2.feet;
			token.options.aura1.color = (selectedPreset.aura1.color) ? selectedPreset.aura1.color : token.options.aura1.color;
			token.options.aura2.color = (selectedPreset.aura2.color) ? selectedPreset.aura2.color : token.options.aura2.color;
			token.place_sync_persist();
		});
	});
	for(let i = 0; i<window.AURA_PRESETS.length; i++){
		wrapper.find('.token-config-aura-preset').append(`<option value="${window.AURA_PRESETS[i].name}">${window.AURA_PRESETS[i].name}</option>`)
	}


	if(localStorage.getItem('ANIMATION_PRESETS') == null){
		window.ANIMATION_PRESETS = [];
	}
	else{
		window.ANIMATION_PRESETS = JSON.parse(localStorage.getItem('ANIMATION_PRESETS'));
	}

	for(let option in animationPresets){
		let allTokenSelected = tokens.map(t => t.options.animation?.aura);
		let selected = allTokenSelected.length === 1 ? allTokenSelected[0] : "";
		wrapper.find('.token-config-animation-preset').append(`<option ${animationPresets[option] == selected ? `selected=true` : ''} value="${animationPresets[option]}">${option}</option>`)
	}
	for(let i = 0; i<window.ANIMATION_PRESETS.length; i++){
		let allTokenSelected = tokens.map(t => t.options.animation?.aura);
		let selected = allTokenSelected.length === 1 ? allTokenSelected[0] : "";
		wrapper.find('.token-config-animation-preset').append(`<option ${window.ANIMATION_PRESETS[i].name == selected ? `selected=true` : ''} value="${window.ANIMATION_PRESETS[i].name}">${window.ANIMATION_PRESETS[i].name}</option>`)
	}
	wrapper.find('#editAnimations').off('click.editPresets').on('click.editPresets', function(){
		create_animation_presets_edit();		
	})
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
	let enabledAurasInput = build_toggle_input(auraOption, auraIsEnabled, function(name, newValue) {
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
	
	wrapper.find("h3.token-image-modal-footer-title").after(enabledAurasInput);
	if (auraIsEnabled) {
		wrapper.find(".token-config-aura-wrapper").show();
	} else {
		wrapper.find(".token-config-aura-wrapper").hide();
	}
	const hideAuraLabel = (allTokensArePlayer) ? 'Hide Aura from other Players' : 'Hide Aura from Players';
	const hideAura = {
		name: "hideaura",
		label: hideAuraLabel,
		type: "toggle",
		options: [
			{ value: true, label: "Hidden", description: "The token's aura is hidden from players." },
			{ value: false, label: "Visible", description: "The token's aura is visible to players." }
		],
		defaultValue: false
	};
	const hideAuraInput = build_toggle_input(hideAura, hideAuraIsEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name] = newValue;
			token.place_sync_persist();
		});
	});
	if(window.DM || (tokens.length == 1 && (window.TOKEN_OBJECTS[tokens[0].options.id].options.player_owned || allTokensArePlayer))){
		wrapper.find(".token-config-aura-wrapper").prepend(hideAuraInput);
	}
	let radiusInputs = wrapper.find('input.aura-radius');
	radiusInputs.on('keyup', function(event) {
		let newRadius = event.target.value;
		if (event.key == "Enter" && newRadius !== undefined && newRadius.length > 0) {
			tokens.forEach(token => {
				token.options[event.target.name]['feet'] = newRadius;
				token.place_sync_persist();
			});
		}
	});
	radiusInputs.on('focusout', function(event) {
		let newRadius = event.target.value;
		if (newRadius !== undefined && newRadius.length > 0) {
			tokens.forEach(token => {
				token.options[event.target.name]['feet'] = newRadius;
				token.place_sync_persist();
			});		
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


	wrapper.find(".token-config-animation-preset").on("change", function(e) {

		let preset = e.target.value;
		let customPreset = false;
		if(window.ANIMATION_PRESETS && window.ANIMATION_PRESETS.some(d=> d.name == e.target.value)){
			customPreset = window.ANIMATION_PRESETS.filter(d=> d.name == e.target.value)[0]
		}
		tokens.forEach(token => {
			if(customPreset == false){
				token.options.animation= {
					...token.options.animation,
					aura: preset,
					customAuraMask: undefined,
					customAuraRotate: undefined
				}
			}
			else{
				token.options.animation= {
					...token.options.animation,
					aura: preset,
					customAuraMask: customPreset.mask,
					customAuraRotate: customPreset.rotate
				}
			}
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
/**
 * Builds and returns HTML inputs for updating token auras
 * @param tokens {Array<Token>} the token objects that the aura configuration HTML is for
 * @returns {*|jQuery|HTMLElement}
 */
function build_token_light_inputs(tokenIds, door=false) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	body.css({
		width: "290px", // once we add Markers, make this wide enough to contain them all
		padding: "5px",
		display: "flex",
		"flex-direction": "row"
	})

	let allTokensArePlayer = true;
	for(let token = 0; token<tokens.length; token++){
		if(!window.TOKEN_OBJECTS[tokens[token].options.id].isPlayer()){
			allTokensArePlayer=false;
			break;
		}
	}


	let auraLightValues = tokens.map(t => t.options.auraislight);
	let uniqueAuraLightValues = [...new Set(auraLightValues)];

	let auraRevealVisionValues = tokens.map(t => t.options.share_vision);
	let uniqueAuraRevealVisionValues = [...new Set(auraRevealVisionValues)];

	let auraIsLightEnabled = null;
	if (uniqueAuraLightValues.length === 1) {
		auraIsLightEnabled = uniqueAuraLightValues[0];
	}



	let auraRevealVisionEnabled = null;
	if (uniqueAuraRevealVisionValues.length === 1) {
		auraRevealVisionEnabled = uniqueAuraRevealVisionValues[0];
	}

	let aura1Feet = tokens.map(t => t.options.light1.feet);
	let uniqueAura1Feet = aura1Feet.length === 1 ? aura1Feet[0] : "";
	let aura2Feet = tokens.map(t => t.options.light2.feet);
	let uniqueAura2Feet = aura2Feet.length === 1 ? aura2Feet[0] : "";
	let aura1Color = tokens.map(t => t.options.light1.color);
	let uniqueAura1Color = aura1Color.length === 1 ? aura1Color[0] : window.TOKEN_SETTINGS?.light1?.color ? window.TOKEN_SETTINGS.light1.color : "";
	let aura2Color = tokens.map(t => t.options.light2.color);
	let uniqueAura2Color = aura2Color.length === 1 ? aura2Color[0] : window.TOKEN_SETTINGS?.light2?.color ? window.TOKEN_SETTINGS.light2.color : "";
	let visionFeet = tokens.map(t => t.options.vision.feet);
	let uniqueVisionFeet = visionFeet.length === 1 ? visionFeet[0] : "";
	let visionColor = tokens.map(t => t.options.vision.color);
	let uniqueVisionColor = visionColor.length === 1 ? visionColor[0] : window.TOKEN_SETTINGS?.vision?.color ? window.TOKEN_SETTINGS.vision.color : "";

	let light1DaylightColor = tokens.map(t => t.options.light1.daylight);
	let uniquelight1DaylightColor = light1DaylightColor.length === 1 ? light1DaylightColor[0] == true ? 'active-daylight' : '' : '';

	let light2DaylightColor = tokens.map(t => t.options.light2.daylight);
	let uniquelight2DaylightColor = light2DaylightColor.length === 1 ? light2DaylightColor[0] == true ? 'active-daylight' : '' : '';


	let upsq = 'ft';
	if (window.CURRENT_SCENE_DATA.upsq !== undefined && window.CURRENT_SCENE_DATA.upsq.length > 0) {
		upsq = window.CURRENT_SCENE_DATA.upsq;
	}
	let wrapper = $(`
		<div class="token-config-aura-input">

			<div class="token-config-aura-wrapper">			
				<div class="token-image-modal-footer-select-wrapper">
					<div class="token-image-modal-footer-title">Animation</div>
					<div class="token-image-modal-footer-title"><button id='editAnimations'>Edit</button></div>
					<select class="token-config-animation-preset">
						<option value=""></option>
					</select>
				</div>
				<div class="token-image-modal-footer-select-wrapper">
					<div class="token-image-modal-footer-title">Darkvision Type</div>
					<select class="token-config-visiontype-preset">
						<option value=""></option>
					</select>
				</div>
				<div class="token-image-modal-footer-select-wrapper">		
					<div class="token-image-modal-footer-title">Preset</div>
					<div class="token-image-modal-footer-title"><button id='editPresets'>Edit</button></div>
					<select class="token-config-aura-preset">
						<option value=""></option>
					</select>
				</div>
				<div class="menu-vision-aura">
					<h3 style="margin-bottom:0px;">Darkvision</h3>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="vision-radius" name="vision" type="text" value="${uniqueVisionFeet}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="visionColor" value="${uniqueVisionColor}" >
					</div>
				</div>
				<div class="menu-inner-aura">
					<h3 style="margin-bottom:0px;">Inner Light</h3>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="light-radius" name="light1" type="text" value="${uniqueAura1Feet}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<button name='light1' title='Uses daylight color instead of custom color' class='daylight ${uniquelight1DaylightColor}'><span class="material-symbols-outlined">sunny</span></button>
						<input class="spectrum" name="light1Color" value="${uniqueAura1Color}" >
	
					</div>
				</div>
				<div class="menu-outer-aura">
					<h3 style="margin-bottom:0px;">Outer Light</h3>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="light-radius" name="light2" type="text" value="${uniqueAura2Feet}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<button name='light2' title='Uses daylight color instead of custom color' class='daylight ${uniquelight2DaylightColor}'><span class="material-symbols-outlined">sunny</span></button>
						<input class="spectrum" name="light2Color" value="${uniqueAura1Color}" >
						
					</div>
				</div>
			</div>
		</div>
	`);




	if(localStorage.getItem('LIGHT_PRESETS') == null){
		window.LIGHT_PRESETS = [
			{
				name: 'No Light (0/0)',
				vision: {
				},
				light1: {
					feet: '0'
				},
				light2: {
					feet: '0'
				}	
			},
			{
				name: 'Candle (5/5)',
				vision: {
				},
				light1: {
					feet: '5',
					color: 'rgba(255, 255, 255, 1)'
				},
				light2: {
					feet: '5',
					color: "rgba(142, 142, 142, 1)"
				}
			},
			{
				name: 'Torch (20/20)',
				vision: {
				},
				light1: {
					feet: '20',
					color: 'rgba(255, 255, 255, 1)'
				},
				light2: {
					feet: '20',
					color: "rgba(142, 142, 142, 1)"
				}
			},
			{
				name: 'Lamp (15/30)',
				vision: {
				},
				light1: {
					feet: '15',
					color: 'rgba(255, 255, 255, 1)'
				},
				light2: {
					feet: '30',
					color: "rgba(142, 142, 142, 1)"
				}
			},
			{
				name: 'Lantern (30/30)',
				vision: {
				},
				light1: {
					feet: '30',
					color: 'rgba(255, 255, 255, 1)'
				},
				light2: {
					feet: '30',
					color: "rgba(142, 142, 142, 1)"
				}
			},
		]
	}
	else{
		window.LIGHT_PRESETS = JSON.parse(localStorage.getItem('LIGHT_PRESETS'));
	}

	if(localStorage.getItem('ANIMATION_PRESETS') == null){
		window.ANIMATION_PRESETS = [];
	}
	else{
		window.ANIMATION_PRESETS = JSON.parse(localStorage.getItem('ANIMATION_PRESETS'));
	}

	let animationPresets = {
		'None': 'none',
		'Static Blur': 'static-blur-fx',
		'Flicker': 'flicker-fx',	
		'Rays': 'rays-fx',
		'Dome': 'force-fx',
		'Wild Magic': 'wild-fx',
		'Fairy': 'fairy-fx',
		'Magic Circle': 'magic-circle-fx',
		'Magic Circle 2': 'magic-circle-2-fx',
		'Spores': 'spore-fx',
		'Lightning Circle': 'lightning-fx',
		'Hurricane': 'hurricane-fx',
		'Snow': 'snow-fx',
		'Bubble': 'bubble-fx'				
	}
	let darkVisionType = {
		'Darkvision': 'darkvision',	
		'Devilsight': 'devilsight',
		'Truesight': 'truesight'	
	}

	for(let i=0; i<window.LIGHT_PRESETS.length; i++){
		wrapper.find('.token-config-aura-preset').append(`<option value="${window.LIGHT_PRESETS[i].name}">${window.LIGHT_PRESETS[i].name}</option>`)
	}

	for(let option in animationPresets){
		let allTokenSelected = tokens.map(t => t.options.animation?.light);
		let selected = allTokenSelected.length === 1 ? allTokenSelected[0] : "";
		wrapper.find('.token-config-animation-preset').append(`<option ${animationPresets[option] == selected ? `selected=true` : ''} value="${animationPresets[option]}">${option}</option>`)
	}

	for(let i=0; i<window.ANIMATION_PRESETS.length; i++){
		let allTokenSelected = tokens.map(t => t.options.animation?.light);
		let selected = allTokenSelected.length === 1 ? allTokenSelected[0] : "";
		wrapper.find('.token-config-animation-preset').append(`<option ${window.ANIMATION_PRESETS[i].name == selected ? `selected=true` : ''} value="${window.ANIMATION_PRESETS[i].name}">${window.ANIMATION_PRESETS[i].name}</option>`)
	}

	for(let option in darkVisionType){
		let allTokenSelected = tokens.map(t => t.options.sight);
		let selected = allTokenSelected.length === 1 ? allTokenSelected[0] : "";
		wrapper.find('.token-config-visiontype-preset').append(`<option ${darkVisionType[option] == selected ? `selected=true` : ''} value="${darkVisionType[option]}">${option}</option>`)
	}
	
	wrapper.find('#editPresets').off('click.editPresets').on('click.editPresets', function(){
		create_light_presets_edit();		
	})
	wrapper.find('#editAnimations').off('click.editPresets').on('click.editPresets', function(){
		create_animation_presets_edit(true);		
	})
	wrapper.find('.daylight').off('click.editDaylight').on('click.editDaylight', function(){
		$(this).toggleClass('active-daylight');
		let newValue = $(this).hasClass('active-daylight');	
		let name = $(this).attr('name');
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			token.options[name].daylight = newValue;
			token.place_sync_persist();
		});	
	})


	const lightOption = {
		name: "auraislight",
		label: "Enable Token Vision/Light",
		type: "toggle",
		options: [
			{ value: true, label: "Enable", description: "Token has light/vision." },
			{ value: false, label: "Disable", description: "Token has no light/vision." }
		],
		defaultValue: false
	};

	

	const revealvisionOption = {
		name: "share_vision",
		label: "Share vision",
		type: "dropdown",
		options: [
			{ value: false, label: "Disabled", description: "Token vision is not shared." },
			{ value: true, label: "All Players", description: "Token vision is shared with all players." },
		],
		defaultValue: false
	};

	for(let i=0; i<window.playerUsers.length; i++){
		if(!revealvisionOption.options.some(d => d.value == window.playerUsers[i].userId)){
			let option = {value: window.playerUsers[i].userId, label: window.playerUsers[i].userName, desciption: `Token vision is shared with ${window.playerUsers[i].userName}`}
			revealvisionOption.options.push(option)
		}

	}
	let revealVisionInput = build_dropdown_input(revealvisionOption, auraRevealVisionEnabled, function(name, newValue) {
		console.log(`${name} setting is now ${newValue}`);
		tokens.forEach(token => {
			if(newValue == 'true')
                newValue = true;
            else if(newValue == 'false')
                newValue = false;
			token.options[name] = newValue;
			token.place_sync_persist();
		});
	});

	let enabledLightInput = build_toggle_input( lightOption, auraIsLightEnabled, function(name, newValue) {
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
	wrapper.prepend(enabledLightInput);
	if(!window.DM){
		enabledLightInput.hide();
	}

	wrapper.find(".token-config-aura-wrapper").prepend(revealVisionInput);
	

	wrapper.find("h3.token-image-modal-footer-title").after(enabledLightInput);
	if (auraIsLightEnabled) {
		wrapper.find(".token-config-aura-wrapper").show();
	} else {
		wrapper.find(".token-config-aura-wrapper").hide();
	}

	let radiusInputs = wrapper.find('input.light-radius, input.vision-radius');
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
	wrapper.find("input[name='light1Color']").spectrum("set", uniqueAura1Color);
	wrapper.find("input[name='light2Color']").spectrum("set", uniqueAura2Color);
	const colorPickerChange = function(e, tinycolor) {
		let auraName = e.target.name.replace("Color", "");
		let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
		console.log(auraName, e, tinycolor);
		if (e.type === 'change') {
			tokens.forEach(token => {
				token.options[auraName]['color'] = color;
				token.place_sync_persist();
			});
			$(".token-config-aura-preset")[0].selectedIndex = 0;
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

		let preset = e.target.value;
		let selectedPreset = window.LIGHT_PRESETS.filter(d=> d.name == preset)[0]
		
		if(!selectedPreset) {
			console.warn("somehow got an unexpected preset", preset, e);
			return;
		}
		let wrapper = $(e.target).closest(".token-config-aura-wrapper");
		if(selectedPreset.vision.feet){
			wrapper.find("input[name='vision']").val(selectedPreset.vision.feet);
		}

		if(selectedPreset.light1.feet){
			wrapper.find("input[name='light1']").val(selectedPreset.light1.feet);
		}
		
		if(selectedPreset.light2.feet){
			wrapper.find("input[name='light2']").val(selectedPreset.light2.feet);
		}
		if(selectedPreset.vision.color){
			wrapper.find("input[name='visionColor']").spectrum("set", selectedPreset.vision.color);
		}

		if(selectedPreset.light1.color){
			wrapper.find("input[name='light1Color']").spectrum("set", selectedPreset.light1.color);
		}
		
		if(selectedPreset.light2.color){
			wrapper.find("input[name='light2Color']").spectrum("set", selectedPreset.light2.color);
		}

		
		

		tokens.forEach(token => {
			token.options.vision.feet = (selectedPreset.vision.feet) ? selectedPreset.vision.feet : token.options.vision.feet;
			token.options.vision.color = (selectedPreset.vision.color) ? selectedPreset.vision.color : token.options.vision.color;
			token.options.light1.feet = (selectedPreset.light1.feet) ? selectedPreset.light1.feet : token.options.light1.feet;
			token.options.light2.feet = (selectedPreset.light2.feet) ? selectedPreset.light2.feet : token.options.light2.feet;
			token.options.light1.color = (selectedPreset.light1.color) ? selectedPreset.light1.color : token.options.light1.color;
			token.options.light2.color = (selectedPreset.light2.color) ? selectedPreset.light2.color : token.options.light2.color;
			token.place_sync_persist();
		});
	});

	wrapper.find(".token-config-animation-preset").on("change", function(e) {

		let preset = e.target.value;
		let customPreset = false;
		if(window.ANIMATION_PRESETS && window.ANIMATION_PRESETS.some(d=> d.name == e.target.value)){
			customPreset = window.ANIMATION_PRESETS.filter(d=> d.name == e.target.value)[0]
		}

		tokens.forEach(token => {
			if(customPreset == false){
				token.options.animation= {
					...token.options.animation,
					light: preset,
					customLightMask: undefined,
					customLightRotate: undefined,
					customLightDarkvision: undefined

				}
			}
			else{
				token.options.animation= {
					...token.options.animation,
					light: preset,
					customLightMask: customPreset.mask,
					customLightRotate: customPreset.rotate,
					customLightDarkvision: customPreset.darkvision
				}
			}
			
			token.place_sync_persist();
		});
	});

	wrapper.find(".token-config-visiontype-preset").on("change", function(e) {

		let preset = e.target.value;

		tokens.forEach(token => {
			
			token.options.sight = preset;
				
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
function create_aura_presets_edit(){
	let dialog = $('#edit_preset_aura_dialog')

	dialog.remove();
	dialog = $(`<div id='edit_preset_aura_dialog'></div>`);
	
		

	let upsq = 'ft';
	if (window.CURRENT_SCENE_DATA.upsq !== undefined && window.CURRENT_SCENE_DATA.upsq.length > 0) {
		upsq = window.CURRENT_SCENE_DATA.upsq;
	}
	let aura_presets = $('<table id="aura_presets_properties"/>');
	dialog.append(aura_presets);

	let titleRow = $(`
		<tr class='aura_preset_title_row'>
				<th>
					Name
				</th>
				<th>
					Inner Aura	
				</th>
				<th>
					Outer Aura	
				</th>
				<th>
				</th>
			</tr>
			`)
	aura_presets.append(titleRow);
	for(let i=0; i<window.AURA_PRESETS.length; i++){
		let row = $(`
			<tr class='aura_preset_row' data-index='${i}'>
				<td>
					<input class='aura_preset_title' value='${window.AURA_PRESETS[i].name}'></input>
				</td>
				<td class="menu-inner-aura">
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="aura-radius" name="aura1" type="text" value="${(window.AURA_PRESETS[i].aura1?.feet) ? window.AURA_PRESETS[i].aura1.feet : ``}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="aura1Color" value="${(window.AURA_PRESETS[i].aura1?.color) ? window.AURA_PRESETS[i].aura1.color : `rgba(0, 0, 0, 0)`}" >
					</div>
				</td>
				<td class="menu-outer-aura">
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="aura-radius" name="aura2" type="text" value="${(window.AURA_PRESETS[i].aura2?.feet) ? window.AURA_PRESETS[i].aura2.feet : ``}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="aura2Color" value="${(window.AURA_PRESETS[i].aura2?.color) ? window.AURA_PRESETS[i].aura2.color : `rgba(0, 0, 0, 0)`}" >
					</div>
				</td>
				<td><div class='removePreset'><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div></td>

			</tr>
		`)
		row.find('input.aura_preset_title').off('change.name').on('change.name', function(){
			window.AURA_PRESETS[i].name = $(this).val().replaceAll(/['"<>]/g, '');
			localStorage.setItem('AURA_PRESETS', JSON.stringify(window.AURA_PRESETS));
		})
		row.find('input[class*="radius"]').off('change.radius').on('change.radius', function(){
			let auraname = $(this).attr('name');
			window.AURA_PRESETS[i][auraname].feet = $(this).val();
			localStorage.setItem('AURA_PRESETS', JSON.stringify(window.AURA_PRESETS));
		})
		row.find('.removePreset').off('click.removePreset').on('click.removePreset', function(){
			window.AURA_PRESETS.splice(i, 1);
			localStorage.setItem('AURA_PRESETS', JSON.stringify(window.AURA_PRESETS));
			create_aura_presets_edit();
		})
		let colorPickers = row.find('input.spectrum');
		colorPickers.spectrum({
			type: "color",
			showInput: true,
			showInitial: true,
			containerClassName: 'prevent-sidebar-modal-close',
			clickoutFiresChange: true,
			appendTo: "parent"
		});

		const colorPickerChange = function(e, tinycolor) {
			let auraName = e.target.name.replace("Color", "");
			window.AURA_PRESETS[i][auraName].color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
			console.log(auraName, e, tinycolor);
			localStorage.setItem('AURA_PRESETS', JSON.stringify(window.AURA_PRESETS));
		};
		colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
		colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
		colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it

		aura_presets.append(row);

	}

	let addButton = $(`<div id='addAuraPreset'>+</div>`)

	addButton.off('click.addPreset').on('click.addPreset', function(){
		window.AURA_PRESETS.push({
			name: 'New Preset',
			aura1: {
			},
			aura2: {
			}
		});
		localStorage.setItem('AURA_PRESETS', JSON.stringify(window.AURA_PRESETS));
		create_aura_presets_edit();
	});
	aura_presets.append(addButton);

	adjust_create_import_edit_container(dialog, undefined, undefined, 975);
}
function create_light_presets_edit(){
	let dialog = $('#edit_preset_light_dialog')

	dialog.remove();
	dialog = $(`<div id='edit_preset_light_dialog'></div>`);
	
		

	let upsq = 'ft';
	if (window.CURRENT_SCENE_DATA.upsq !== undefined && window.CURRENT_SCENE_DATA.upsq.length > 0) {
		upsq = window.CURRENT_SCENE_DATA.upsq;
	}
	let light_presets = $('<table id="light_presets_properties"/>');
	dialog.append(light_presets);

	let titleRow = $(`
		<tr class='light_preset_title_row'>
				<th>
					Name
				</th>
				<th>
					Darkvision		
				</th>
				<th>
					Inner Light			
				</th>
				<th>
					Outer Light
				</th>
				<th>
				</th>
			</tr>
			`)
	light_presets.append(titleRow);
	for(let i=0; i<window.LIGHT_PRESETS.length; i++){
		let row = $(`
			<tr class='light_preset_row' data-index='${i}'>
				<td>
					<input class='light_preset_title' value='${window.LIGHT_PRESETS[i].name}'></input>
				</td>
				<td class="menu-vision-aura">
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="vision-radius" name="vision" type="text" value="${(window.LIGHT_PRESETS[i].vision?.feet) ? window.LIGHT_PRESETS[i].vision.feet : ``}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="visionColor" value="${(window.LIGHT_PRESETS[i].vision?.color) ? window.LIGHT_PRESETS[i].vision.color : `rgba(0, 0, 0, 0)`}" >
					</div>
				</td>
				<td class="menu-inner-aura">
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="light-radius" name="light1" type="text" value="${(window.LIGHT_PRESETS[i].light1?.feet) ? window.LIGHT_PRESETS[i].light1.feet : ``}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="light1Color" value="${(window.LIGHT_PRESETS[i].light1?.color) ? window.LIGHT_PRESETS[i].light1.color : `rgba(0, 0, 0, 0)`}" >
					</div>
				</td>
				<td class="menu-outer-aura">
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Radius (${upsq})</div>
						<input class="light-radius" name="light2" type="text" value="${(window.LIGHT_PRESETS[i].light2?.feet) ? window.LIGHT_PRESETS[i].light2.feet : ``}" style="width: 3rem" />
					</div>
					<div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
						<div class="token-image-modal-footer-title">Color</div>
						<input class="spectrum" name="light2Color" value="${(window.LIGHT_PRESETS[i].light2?.color) ? window.LIGHT_PRESETS[i].light2.color : `rgba(0, 0, 0, 0)`}" >
					</div>
				</td>
				<td><div class='removePreset'><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div></td>

			</tr>
		`)
		row.find('input.light_preset_title').off('change.name').on('change.name', function(){
			window.LIGHT_PRESETS[i].name = $(this).val().replaceAll(/['"<>]/g, '');
			localStorage.setItem('LIGHT_PRESETS', JSON.stringify(window.LIGHT_PRESETS));
		})
		row.find('input[class*="radius"]').off('change.radius').on('change.radius', function(){
			let lightname = $(this).attr('name');
			window.LIGHT_PRESETS[i][lightname].feet = $(this).val();
			localStorage.setItem('LIGHT_PRESETS', JSON.stringify(window.LIGHT_PRESETS));
		})
		row.find('.removePreset').off('click.removePreset').on('click.removePreset', function(){
			window.LIGHT_PRESETS.splice(i, 1);
			localStorage.setItem('LIGHT_PRESETS', JSON.stringify(window.LIGHT_PRESETS));
			create_light_presets_edit();
		})
		let colorPickers = row.find('input.spectrum');
		colorPickers.spectrum({
			type: "color",
			showInput: true,
			showInitial: true,
			containerClassName: 'prevent-sidebar-modal-close',
			clickoutFiresChange: true,
			appendTo: "parent"
		});

		const colorPickerChange = function(e, tinycolor) {
			let auraName = e.target.name.replace("Color", "");
			window.LIGHT_PRESETS[i][auraName].color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
			console.log(auraName, e, tinycolor);
			localStorage.setItem('LIGHT_PRESETS', JSON.stringify(window.LIGHT_PRESETS));
		};
		colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
		colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
		colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it

		light_presets.append(row);

	}

	let addButton = $(`<div id='addLightPreset'>+</div>`)

	addButton.off('click.addPreset').on('click.addPreset', function(){
		window.LIGHT_PRESETS.push({
			name: 'New Preset',
			vision: {
			},
			light1: {
			},
			light2: {
			}
		});
		localStorage.setItem('LIGHT_PRESETS', JSON.stringify(window.LIGHT_PRESETS));
		create_light_presets_edit();
	});
	light_presets.append(addButton);

	adjust_create_import_edit_container(dialog, undefined, undefined, 975);
}
function create_animation_presets_edit(isVision = false){
	let dialog = $('#edit_preset_animation_dialog')

	dialog.remove();
	dialog = $(`<div id='edit_preset_animation_dialog'></div>`);
	
		

	let upsq = 'ft';
	if (window.CURRENT_SCENE_DATA.upsq !== undefined && window.CURRENT_SCENE_DATA.upsq.length > 0) {
		upsq = window.CURRENT_SCENE_DATA.upsq;
	}
	let animation_presets = $('<table id="animation_presets_properties"/>');
	dialog.append(animation_presets);

	let titleRow = $(`
		<tr class='animation_preset_title_row'>
				<th>
					Name
				</th>
				<th>
					Transparency Mask		
				</th>
				<th>
					Rotate	
				</th>
				${isVision ? `<th>
					Apply to Darkvision			
				</th>` : ``}
			</tr>
			`)
	animation_presets.append(titleRow);
	for(let i=0; i<window.ANIMATION_PRESETS.length; i++){
		

		let row = $(`
			<tr class='animation_preset_row ${isVision ? `visionOptions` : ``}' data-index='${i}'>
				<td><input class='animation_preset_title' value='${window.ANIMATION_PRESETS[i].name}'></input>
				<td><input class='animation_preset_mask' placeholder='transparency mask url' value='${window.ANIMATION_PRESETS[i].mask}'></input></td>
				<td><button name="rotate_button" data-id='rotate' type="button" role="switch" class="rc-switch ${(window.ANIMATION_PRESETS[i].rotate === true) ? 'rc-switch-checked' : ''}"><span class="rc-switch-inner"></span></button></td>
				${isVision ? ` <td><button name="apply_darkvision" data-id='darkvision' type="button" role="switch" class="rc-switch ${(window.ANIMATION_PRESETS[i].darkvision === true) ? 'rc-switch-checked' : ''}"><span class="rc-switch-inner"></span></button></td>` : ''}
				<td><div class='removePreset'><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div></td>
			</tr>
		`)

	    let input = row.find('button[data-id]');

		input.click(function(clickEvent) {
		  	let isChecked = $(clickEvent.currentTarget).hasClass("rc-switch-checked");
		  	$(clickEvent.currentTarget).toggleClass("rc-switch-checked", !isChecked)
		   	window.ANIMATION_PRESETS[i][$(this).attr('data-id')] = !isChecked;
		   	localStorage.setItem('ANIMATION_PRESETS', JSON.stringify(window.ANIMATION_PRESETS));
		});
		row.find('input.animation_preset_title').off('change.name').on('change.name', function(){
			window.ANIMATION_PRESETS[i].name = $(this).val().replaceAll(/['"<>]/g, '');
			localStorage.setItem('ANIMATION_PRESETS', JSON.stringify(window.ANIMATION_PRESETS));
		})
		row.find('input[class*="animation_preset_mask"]').off('change.mask').on('change.mask', function(){
			window.ANIMATION_PRESETS[i].mask = $(this).val();
			localStorage.setItem('ANIMATION_PRESETS', JSON.stringify(window.ANIMATION_PRESETS));
		})
		row.find('.removePreset').off('click.removePreset').on('click.removePreset', function(){
			window.ANIMATION_PRESETS.splice(i, 1);
			localStorage.setItem('ANIMATION_PRESETS', JSON.stringify(window.ANIMATION_PRESETS));
			create_animation_presets_edit(isVision);
		})
		
		animation_presets.append(row);

	}

	let addButton = $(`<div id='addAnimationPreset'>+</div>`)

	addButton.off('click.addPreset').on('click.addPreset', function(){
		window.ANIMATION_PRESETS.push({
			name: 'New Preset',
			mask: '',
			rotate: false,
		});
		localStorage.setItem('ANIMATION_PRESETS', JSON.stringify(window.ANIMATION_PRESETS));
		create_animation_presets_edit(isVision);
	});
	animation_presets.append(addButton);

	adjust_create_import_edit_container(dialog, undefined, undefined, 975);
}
function build_menu_stat_inputs(tokenIds) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div id='menuStatDiv'></div>");
	let hp = '';
	let max_hp = '';
	let ac = '';
	let elev = '';

	if(tokens.length == 1 && ((tokens[0].options.player_owned && !tokens[0].options.disablestat) || (!tokens[0].options.hidestat && tokens[0].isPlayer() && !tokens[0].options.disablestat) || tokens[0].options.id.includes(window.PLAYER_ID) || window.window.DM)){
		hp = tokens[0].hp;
		max_hp = tokens[0].maxHp;
		ac = tokens[0].ac;
		elev = (typeof tokens[0].options.elev !== 'undefined') ? tokens[0].options.elev : '';
	}
	else if(window.DM && tokens.length>1){
		hp = '';
		max_hp = '';
		ac = '';
		elev = '';
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



	
	hpMenuInput.find('input').on('keyup', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;		
		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(token.isPlayer())
					return;
				let newHP = newValue;
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newHP = token.hp + parseInt(newValue);
				}
				token.hp = newHP - token.tempHp;
				token.place_sync_persist();
				if(tokens.length == 1){
					$(".hpMenuInput").val(newHP);
				}
				else{
					$(".hpMenuInput").val('');
				}
			});
		}
	});
	hpMenuInput.find('input').on('focusout', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;	
		tokens.forEach(token => {
			if(token.isPlayer())
				return;
			let newHP = newValue;
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newHP = token.hp + parseInt(newValue);
			}
			token.hp = newHP - token.tempHp;
			token.place_sync_persist();
			if(tokens.length == 1){
				$(".hpMenuInput").val(newHP);
			}
			else{
				$(".hpMenuInput").val('');
			}
			
		});
	});

	maxHpMenuInput.find('input').on('keyup', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;		
		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(token.isPlayer())
					return;
				let newMaxHP = newValue;
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newMaxHP = token.maxHp + parseInt(newValue);
				}
				token.maxHp = newMaxHP;
				token.place_sync_persist();
				if(tokens.length == 1){
					$(".maxHpMenuInput").val(newMaxHP);
				}
				else{
					$(".maxHpMenuInput").val('');
				}
				
			});
		}
	});
	maxHpMenuInput.find('input').on('focusout', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;
		tokens.forEach(token => {
			if(token.isPlayer())
				return;
			let newMaxHP = newValue;
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newMaxHP = token.maxHp + parseInt(newValue);
			}
			token.maxHp = newMaxHP;
			token.place_sync_persist();
			if(tokens.length == 1){
				$(".maxHpMenuInput").val(newMaxHP);
			}
			else{
				$(".maxHpMenuInput").val('');
			}
		});
	});

	acMenuInput.find('input').on('keyup', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;		
		if (event.key == "Enter" && newValue !== undefined && newValue.length > 0) {
			tokens.forEach(token => {
				if(token.isPlayer())
					return;
				let newAC = newValue;
				if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
					newAC = parseInt(token.options.ac) + parseInt(newValue);
				}
				token.ac = newAC;
				token.place_sync_persist();
				if(tokens.length == 1){
					$(".acMenuInput").val(newAC);
				}
				else{
					$(".acMenuInput").val('');
				}
				
			});
		}
	});
	acMenuInput.find('input').on('focusout', function(event) {
		let newValue = event.target.value;
		if($(event.target).prop('readonly') || newValue == '')
			return;
		tokens.forEach(token => {
			if(token.isPlayer())
				return;
			let newAC = newValue;
			if(newValue.indexOf("+") == 0 || newValue.indexOf("-") == 0){
				newAC = parseInt(token.options.ac) + parseInt(newValue);
			}
			token.ac = newAC;
			token.place_sync_persist();
			if(tokens.length == 1){
				$(".acMenuInput").val(newAC);
			}
			else{
				$(".acMenuInput").val('');
			}
		});
	});

	elevMenuInput.find('input').on('keyup', function(event) {
		if(event.target.value == '')
			return;
		if (event.key == "Enter") {
			tokens.forEach(token => {
				token.options.elev = event.target.value;
				token.place_sync_persist();
			});
		}
	});
	elevMenuInput.find('input').on('focusout', function(event) {
		if(event.target.value == '')
			return;
		tokens.forEach(token => {
			token.options.elev = event.target.value;
			token.place_sync_persist();
		});
	});

	return body;


}



function build_notes_flyout_menu(tokenIds, flyout) {
	let tokens = tokenIds.map(id => window.TOKEN_OBJECTS[id]).filter(t => t !== undefined);
	let body = $("<div></div>");
	let id = tokenIds.length == 1 ? tokenIds[0] : tokens[0].options.id;
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
			let noteLinkButton = $(`<button class="icon-view-note material-icons">Copy Tooltip Link</button>`)		
			let noteEmbedLinkButton = $(`<button class="icon-view-note material-icons">Copy Embed Tags</button>`)		
			let deleteNoteButton = $(`<button class="icon-note-delete material-icons">Delete Note</button>`)
			
			editNoteButton = $(`<button class="icon-note material-icons">Edit Note</button>`)
			body.append(viewNoteButton, noteLinkButton, noteEmbedLinkButton, editNoteButton, deleteNoteButton);	
			viewNoteButton.off().on("click", function(){
				window.JOURNAL.display_note(id);
				$('#tokenOptionsClickCloseDiv').click();
			});
			noteLinkButton.off().on("click", function(){
				let copyLink = `[note]${id};${window.JOURNAL.notes[id].title}[/note]`
		        navigator.clipboard.writeText(copyLink);
			});
			noteEmbedLinkButton.off().on("click", function(){
				let copyLink = `[note embed]${id};${window.JOURNAL.notes[id].title}[/note]`
		        navigator.clipboard.writeText(copyLink);
			});

			deleteNoteButton.off().on("click", function(){
				if (window.confirm(`Are you sure you want to delete this note?`)) {
					if(id in window.JOURNAL.notes){
						delete window.JOURNAL.notes[id];
						window.JOURNAL.persist();
						window.TOKEN_OBJECTS[id].place_sync_persist();	
						body.remove();
						if(flyout != undefined)
							flyout.append(build_notes_flyout_menu(tokenIds, flyout))	
						window.MB.sendMessage("custom/myVTT/note", {
							note: window.JOURNAL.notes[id],
							id: id,
							delete: true
						})		
					}
				}
			});
		}
		else {
			body.append(editNoteButton);
			let editSharedNoteButton = $(`<button class="icon-note material-icons">Create Shared Note</button>`)
			editSharedNoteButton.off().on("click", function(){
				if (!(id in window.JOURNAL.notes)) {
					let title = window.TOKEN_OBJECTS[id] ? window.TOKEN_OBJECTS[id].options.name : `Note`
					window.JOURNAL.notes[id] = {
						title: title,
						text: '',
						plain: '',
						player: true
					}
				}
				window.MB.sendMessage("custom/myVTT/note", {
					note: window.JOURNAL.notes[id],
					id: id
				})
				window.TOKEN_OBJECTS[id].place_sync_persist();
				$('#tokenOptionsClickCloseDiv').click();
				window.JOURNAL.edit_note(id);

			});	
			body.append(editSharedNoteButton);
		}

		editNoteButton.off().on("click", function(){
			if (!(id in window.JOURNAL.notes)) {
				let title = window.TOKEN_OBJECTS[id] ? window.TOKEN_OBJECTS[id].options.name : `Note`
				window.JOURNAL.notes[id] = {
					title: title,
					text: '',
					plain: '',
					player: false
				}
				window.MB.sendMessage("custom/myVTT/note", {
					note: window.JOURNAL.notes[id],
					id: id
				})
				window.TOKEN_OBJECTS[id].place_sync_persist();

			}
			$('#tokenOptionsClickCloseDiv').click();
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
			let lockedConditions = {
				[conditionName] : '',
				...JSON.parse(localStorage.getItem(`lockedConditions.${window.gameId}`))
			}
			let colorItem = $(`<input type='text' placeholder='custom condition'></input>`);
			tokens.every(token => {
				let colorItemArr = token.options.custom_conditions.find(e => e.name === conditionName)
				if(colorItemArr != undefined){
					colorItem.val(colorItemArr.text);	
					return false;
				}
				else{
					colorItem.val(lockedConditions[conditionName]);
					return false;
				}
				return true;
			});
		
			conditionItem.append(colorItem);
			colorItem.css("background-color", conditionName);
			colorItem.on("change", function(){
				let clickedItem = $(this).parent();
				tokens.forEach(token => {
					if($(this).val() == "" && token.hasCondition(conditionName)){
						token.removeCondition(conditionName)
					}
					else{
						if(token.hasCondition(conditionName)){
							token.removeCondition(conditionName);
						}
						token.addCondition(conditionName, $(this).val());
						if(conditionItem.find(`.condition-lock.locked`).length>0){
							lockedConditions = {
								...lockedConditions,
								[conditionName] : $(this).val(),
							}
							localStorage.setItem(`lockedConditions.${window.gameId}`, JSON.stringify(lockedConditions));
						}
					}	
					token.place_sync_persist();	
				});
				clickedItem.removeClass("single-active all-active some-active active-condition");
				clickedItem.addClass(determine_condition_item_classname(tokenIds, conditionName));
			});



			conditionItem.off(`click.customCondition`).on('click.customCondition', function(){
				let clickedItem = $(this);
				tokens.forEach(token => {
						if(token.hasCondition(conditionName)){
							token.removeCondition(conditionName);
						}
						else{
							token.addCondition(conditionName, $(this).find('input').val());
						}
					token.place_sync_persist();	
				});
				clickedItem.removeClass("single-active all-active some-active active-condition");
				clickedItem.addClass(determine_condition_item_classname(tokenIds, conditionName));

			});

			
			let conditionLocked = lockedConditions[conditionName] != '';

			const conditionLock = $(`<span class="${conditionLocked ? `locked` : ''} condition-lock material-icons material-symbols-outlined"></span>`)
			
			conditionLock.off(`click.lock`).on(`click.lock`, function(e){
				e.stopPropagation();
				if($(this).hasClass('locked')){
					lockedConditions = {
						...lockedConditions,
						[conditionName] : '',
					}
					$(this).toggleClass('locked', false);
				}
				else{
					lockedConditions = {
						...lockedConditions,
						[conditionName] : colorItem.val(),
					}
					$(this).toggleClass('locked', true);
				}


				localStorage.setItem(`lockedConditions.${window.gameId}`, JSON.stringify(lockedConditions));
			})

			conditionItem.append(conditionLock);


		} else {
			conditionItem.append(`<span>${conditionName}</span>`);
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
		}

		let conditionDuration = $(`<input type='text' class='condition-duration-input' placeholder=''></input>`);
		let conditionDurationIcon = $(`<span class='condition-duration-icon'></span>`)
		let durVal = tokens[0].conditionDuration(conditionName);
		if(tokens.every(t=> t.conditionDuration(conditionName) === durVal)) {
			conditionDuration.val(durVal);
		}
		conditionDuration.off('click').on('click',function(event) {
			event.stopPropagation();
			this.select();
			conditionDurationIcon.addClass('hiddenIcon');
		})
		conditionDuration.off('focusout').on('focusout', function(event) {
			function update_cond(cond, token, newDur) {
				if(cond.name === conditionName) {
					cond.duration = newDur;
					token.place_sync_persist();
				}}
			let newDur = event.target.value === '' ? '' : parseInt(event.target.value);
			if (!isNaN(newDur)) {
				tokens.forEach(token => {
					token.options.custom_conditions?.forEach(c=> update_cond(c, token, newDur));
					token.options.conditions?.forEach(c=> update_cond(c, token, newDur));
				});
			}
			conditionDurationIcon.toggleClass('hiddenIcon', newDur !== undefined && newDur !== '')
		});
		conditionDurationIcon.toggleClass('hiddenIcon', durVal !== undefined && durVal !== '')
		conditionItem.append(conditionDuration);
		conditionItem.append(conditionDurationIcon);	
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
	conditionsList.css("width", "195px");
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
	markersList.css("width", "195px");
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
	let player_selected = false;

	let body = $("<div></div>");
	body.css({
		width: "320px",
		padding: "5px"
	});
	// name
	
	let tokenSizes = [];
	tokens.forEach(t => {
		if(t.isLineAoe()){
			tokenSizes.push(t.numberOfGridSpacesTall());
		}
		else{
			tokenSizes.push(t.numberOfGridSpacesWide());
		}
	});


	let uniqueSizes = [...new Set(tokenSizes)];

	console.log("uniqueSizes", uniqueSizes);
	let lineaoe = tokens.length == 1 && tokens[0].isLineAoe();
	let linewidthsize = tokens[0].numberOfGridSpacesWide();
	let sizeInputs = build_token_size_input(uniqueSizes, function (newSize, linewidth=false) {
		let tokenMultiplierAdjustment = (!window.CURRENT_SCENE_DATA.scaleAdjustment) ? 1 : (window.CURRENT_SCENE_DATA.scaleAdjustment.x > window.CURRENT_SCENE_DATA.scaleAdjustment.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : window.CURRENT_SCENE_DATA.scaleAdjustment.y;
			
		const hpps = window.CURRENT_SCENE_DATA.hpps * tokenMultiplierAdjustment;
		if (!isNaN(newSize)) {
			newSize = hpps * newSize;
		} else {
			console.log(`not updating tokens with size ${newSize}`); // probably undefined because we inject the "multiple" options below
			return;
		}
		tokens.forEach(token => {			
			token.size(newSize, linewidth);
			clampTokenImageSize(token.options.imageSize, token.options.size);
		});
	}, allTokensAreAoe, lineaoe, linewidthsize); // if we're only dealing with aoe, don't bother displaying the select list. Just show the size input
	body.append(sizeInputs);
	if (allTokensAreAoe) {
		sizeInputs.find("select").closest(".token-image-modal-footer-select-wrapper").hide(); // if we're only dealing with aoe, don't bother displaying the select list. Just show the size input
	}


	if (!allTokensAreAoe) {
		//image scaling size
		let tokenImageScales = tokens.map(t => t.options.imageSize);
		let uniqueScales = [...new Set(tokenImageScales)];
		let startingScale = uniqueScales.length === 1 ? uniqueScales[0] : 1;
		let imageSizeWrapper = build_token_image_scale_input(startingScale, tokens, function (imageSize, persist=false) {
			tokens.forEach(token => {
				imageSize = clampTokenImageSize(imageSize, token.options.size);
				token.options.imageSize = imageSize;
				$(`.VTTToken[data-id='${token.options.id}']`).css("--token-scale", imageSize)
				if(persist == true)
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

		

		let tokenOffsetX = tokens.map(t => t.options.offset?.x);
		let uniqueOffsetX = [...new Set(tokenOffsetX)];

		let startingOffsetX = uniqueOffsetX.length === 1 && uniqueOffsetX[0] != undefined ? uniqueOffsetX[0] : 0;
		let offsetXWrapper = build_token_num_input(startingOffsetX, tokens, 'Image Offset X', '', '', 1, function (offsetX, persist=false) {
			tokens.forEach(token => {
				let underdarknessDivisor = token.options.underDarkness ? parseInt(window.CURRENT_SCENE_DATA.scale_factor) : 1;
				if(token.options.offset == undefined)
				token.options.offset = {x: 0, y:0};
				token.options.offset.x = offsetX;
				$(`.VTTToken[data-id='${token.options.id}']`).css({
					"--offsetX": `${parseFloat(offsetX) / 90 * token.options.size}px`,
					"--offsetY": `${parseFloat(token.options.offset.y) / 90 * token.options.size}px`
				})

				if(persist)
					token.place_sync_persist();
			});
		});
		body.append(offsetXWrapper);

		let tokenOffsetY = tokens.map(t => t.options.offset?.y);
		let uniqueOffsetY = [...new Set(tokenOffsetY)];
		let startingOffsetY = uniqueOffsetY.length === 1  && uniqueOffsetY[0] != undefined ? uniqueOffsetY[0] : 0;

		let offsetYWrapper = build_token_num_input(startingOffsetY, tokens, 'Image Offset Y', '', '', 1, function (offsetY, persist=false) {
			tokens.forEach(token => {
				let underdarknessDivisor = token.options.underDarkness ? parseInt(window.CURRENT_SCENE_DATA.scale_factor) : 1;
				if(token.options.offset == undefined)
					token.options.offset = {x: 0, y:0};
				token.options.offset.y = offsetY;
				$(`.VTTToken[data-id='${token.options.id}']`).css({
					"--offsetX": `${parseFloat(token.options.offset.x) / 90 * token.options.size}px`,
					"--offsetY": `${parseFloat(offsetY) / 90 * token.options.size}px`
				})
				if(persist)
					token.place_sync_persist();
			});
		});
		body.append(offsetYWrapper);


		let tokenImageZoom = tokens.map(t => t.options.imageZoom);
		let uniqueImageZoom = [...new Set(tokenImageZoom)];
		let startingImageZoom = uniqueImageZoom.length === 1 && uniqueImageZoom[0] != undefined ? uniqueImageZoom[0] : 0;
		let imageZoomWrapper = build_token_num_input(startingImageZoom, tokens, 'Image Zoom %', -100, '', 5, function (imageZoom, persist=false) {
			tokens.forEach(token => {
				token.options.imageZoom = imageZoom;
				const newInset = 49.5 * parseFloat(imageZoom)/100;
				$(`.VTTToken[data-id='${token.options.id}']`).css({
					"--view-box": `inset(${newInset}% ${newInset}% ${newInset}% ${newInset}%)`,
					"--image-zoom": `${parseFloat(imageZoom)+100}%` //adjust from viewbox to background-size property
				});
				if(persist)
					token.place_sync_persist();
			});
		});
		body.append(imageZoomWrapper);

		let tokenOpacity = tokens.map(t => t.options.imageOpacity);
		let uniqueOpacity = [...new Set(tokenOpacity)];
		let startingOpacity = uniqueOpacity.length === 1 && uniqueOpacity[0] != undefined ? uniqueOpacity[0] : 1;
		let opacityWrapper = build_token_num_input(startingOpacity, tokens,  'Image Opacity', 0, 1, 0.1, function (opacity, persist=false) {
			tokens.forEach(token => {
				token.options.imageOpacity = opacity;
				$(`.VTTToken[data-id='${token.options.id}']`).css("--image-opacity", opacity)
				if(persist)
					token.place_sync_persist();
			});
		});
		body.append(opacityWrapper);

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


	}

	let token_settings = token_setting_options();
	if (tokens.length === 1 && !tokens[0].isPlayer()){
		let removename = "hidestat";
		token_settings = $.grep(token_settings, function(e){
				return e.name != removename;
		});
	}
	for (let i = 0; i < tokens.length; i++) {
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
	if (!window.DM) {
		token_settings = $.grep(token_settings, function (e) {
			return e.player == true;
		});
	}
	for(let i = 0; i < token_settings.length; i++) {
		let setting = token_settings[i];
		if (allTokensAreAoe && !availableToAoe.includes(setting.name)) {
			continue;
		} else if(setting.hiddenSetting || setting.name == 'maxAge' || setting.name == 'defaultmaxhptype' || setting.name == 'placeType' || setting.globalSettingOnly || setting.name == 'lockRestrictDrop' || setting.name == 'hidden' ) {
			continue;
		}

		let tokenSettings = tokens.map(t => t.options[setting.name]);
		let uniqueSettings = [...new Set(tokenSettings)].filter(d => d != undefined);
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}	else if(uniqueSettings.length === 0){
			currentValue = undefined;
		}


		if (setting.type === "dropdown") {
			let inputWrapper = build_dropdown_input(setting, currentValue, function(name, newValue) {
				tokens.forEach(token => {
					token.options[name] = newValue;
					token.place_sync_persist();
				});
				if(setting.name =='tokenStyleSelect'){		
					for(let j=0; j<token_settings.length; j++){
						let setting = token_settings[j];
						if(setting.type === "toggle"){
							let tokenSettings = tokens.map(t => t.options[setting.name]);
							let uniqueSettings = [...new Set(tokenSettings)].filter(d => d != undefined);
							let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
							if (uniqueSettings.length === 1) {
								currentValue = uniqueSettings[0];
							}
							$(`#adjustments-flyout button[name='${setting.name}']`).toggleClass('rc-switch-checked', currentValue == '1')
						}
						
					}
				}
			});
			if(setting.menuPosition != undefined){
				const position = body.find(`>div:nth-of-type(${setting.menuPosition})`)
				if (position.length > 0)
					position.before(inputWrapper)
				else
					body.append(inputWrapper)
			}
			else{
				body.append(inputWrapper);
			}
			
		} else if (setting.type === "toggle") {
			let inputWrapper = build_toggle_input(setting, currentValue, function (name, newValue) {
				tokens.forEach(token => {
					token.options[name] = newValue;
					token.place_sync_persist(true);
				});
			});
			if(setting.menuPosition != undefined){
				const position = body.find(`>div:nth-of-type(${setting.menuPosition})`)
				if(position.length>0)
					position.before(inputWrapper)
				else
					body.append(inputWrapper)
			}
			else{
				body.append(inputWrapper);
			}
		} else {
			console.warn("build_options_flyout_menu failed to handle token setting option with type", setting.type);
		}
	}
	if(window.DM){
		let tokenMaxAges = [];
		let tokenAges = [];
		tokens.forEach(t => {
			tokenMaxAges.push(t.options.maxAge);
			tokenAges.push(t.options.age);
		});
		let uniqueMaxAges = [...new Set(tokenMaxAges)]
		let uniqueAges = [...new Set(tokenAges)]
		body.append(build_age_inputs(uniqueAges, uniqueMaxAges, 
			function(age){
				tokens.forEach(token => {
					token.options.age = age;
					token.place_sync_persist();
				});
			
			}, 
			function(maxAge, updateToken){

				tokens.forEach(token => {
					token.options.maxAge = maxAge;
					if(updateToken)
						token.place_sync_persist();
				});
			}));	
		$(".ageMenuInput").on('focus', function(event){
			event.target.select();
		});
	}



	return body;
}

function build_age_inputs(tokenAges, tokenMaxAges, ageChangeHandler, maxAgeChangeHandler) {

	let maxAge = false;
	// get the first value if there's only 1 value
	if (tokenMaxAges.length === 1) {
		maxAge = tokenMaxAges[0]
	}
	else{
		maxAge = -1;
	}


	let age = '';
	// get the first value if there's only 1 value
	if (tokenAges.length === 1) {
		age = tokenAges[0]
		if (isNaN(age)) {
			ages = '';
		}
	}

	const isSizeCustom = (maxAge == 'custom');


	let customStyle = isSizeCustom ? "display:flex;" : "display:none;"

	let output = $(`
 		<div class="token-image-modal-footer-select-wrapper sidebar-hover-text" data-hover='Sets a countdown timer on the token, useful for temporary summoned creatures. Counts down once per turn.'>
 			<div class="token-image-modal-footer-title">Token Time Limit</div>
 			<select name="data-token-size">
			 	${maxAge === -1 ? '<option value="multiple" selected="selected" disabled="disabled">Multiple Values</option>' : ""}
 				<option value="false" ${maxAge === false ? "selected='selected'": ""}>None</option>
 				<option value="1" ${maxAge === 1 ? "selected='selected'": ""}>1 Round</option>
 				<option value="10" ${maxAge === 10 ? "selected='selected'": ""}>1 Minute</option>
 				<option value="custom" ${maxAge === 'custom' ? "selected='selected'": ""}>Custom</option>
 			</select>
 		</div>
 		<div class="token-image-modal-footer-select-wrapper sidebar-hover-text" style="${customStyle}" data-hover='Length of countdown timer'>
 			<div class="token-image-modal-footer-title">Custom Time Limit</div>
 			<input type="number" min="0" step="1"
			 name="data-token-size-custom" value=${age} style="width: 3rem;">
 		</div>
 	`);

	let tokenMaxAgeInput = output.find("select");
	let customAgeInput = output.find("input");

	tokenMaxAgeInput.off('change focusout').on('change focusout', function(event) {
		let val = event.target.value == 'false' ? false : event.target.value;
		let customInputWrapper = $(event.target).parent().next();
		if (val === "custom") {
			customInputWrapper.show();
		} 
		else{
			customInputWrapper.hide();
		}
		if(!isNaN(parseInt(val))){
			maxAgeChangeHandler(parseInt(val), false);	
			ageChangeHandler(parseInt(val));
		}
		else if(val == 'custom'){
			maxAgeChangeHandler(val, false);	
			customAgeInput.trigger('focusout');
		}
		else{
			maxAgeChangeHandler(val, true);	
		}
		

	});
	customAgeInput.on('focusout', function(event) {
		ageChangeHandler(parseInt(event.target.value));		
	});


	return output;
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
			didUpdate(imageSize, true);
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
		didUpdate(imageSize, true);

		imageSizeInputRange.val(imageSizeInput.val());
	});
	imageSizeInput.on(' input change', function(){
		let imageSize = event.target.value;
		imageSizeInputRange.val(imageSize);
		didUpdate(imageSize);
	});
	imageSizeInputRange.on(' input change', function(){
		let imageSize = event.target.value;
		imageSizeInput.val(imageSize);
		didUpdate(imageSize);
	});
	imageSizeInputRange.on('mouseup', function(){
		let imageSize = event.target.value;	
		if(tokens !== false){
			imageSize = clampTokenImageSize(imageSize, tokens[0].options.size);
		}
		didUpdate(imageSize, true);
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

function build_token_scale_input(startingScale, tokens, name, min=0.1, max=10, step=0.1, didUpdate) {
	let imageInput = $(`<input class="image-input-number" type="number" max="${max}" min="${min}" step="${step}" title="Token Image Scale" placeholder="1.0" name="Image Scale">`);
	let imageInputRange = $(`<input class="image-input-range" type="range" value="1" min="${min}" max="${max}" step="${step}"/>`);
	imageInput.val(startingScale || 1);
	imageInputRange.val(startingScale || 1);
	imageInput.on('keyup', function(event) {
		let value = event.target.value;	
		

		if (event.key === "Enter") {
	
			imageInput.val(value);
			imageInputRange.val(value);
			didUpdate(value, true);
		} else if (event.key === "Escape") {
			$(event.target).blur();
		}
		imageInputRange.val(imageInput.val());
	});
	imageInput.on('focusout', function(event) {
		let value = event.target.value;		
		
		imageInput.val(value);	
		imageInputRange.val(value);
		didUpdate(value, true);

		imageInputRange.val(imageInput.val());
	});
	imageInput.on(' input change', function(){
		let value = event.target.value;
		didUpdate(value);
		imageInputRange.val(imageInput.val());
	});
	imageInputRange.on(' input change', function(){
		let value = event.target.value;
		didUpdate(value);
		imageInput.val(imageInputRange.val());
	});
	imageInputRange.on('mouseup', function(){
		let value = event.target.value;	
		didUpdate(value, true);
	});
	let imageWrapper = $(`
		<div class="token-image-modal-url-label-wrapper image-size-wrapper">
			<div class="token-image-modal-footer-title image-size-title">${name}</div>
		</div>
	`);
	imageWrapper.append(imageInput); // Beside Label
	imageWrapper.append(imageInputRange); // input below label
	return imageWrapper;
}

function build_token_num_input(startingScale=1, tokens, name, min=0.1, max=10, step=0.1, didUpdate) {
	let imageInput = $(`<input class="image-input-number" type="number" max="${max}" min="${min}" step="${step}" title="Token Image Scale" placeholder="${startingScale}" name="Image Scale">`);

	imageInput.val(startingScale);

	imageInput.on('keyup', function(event) {
		let value = event.target.value;	
		if (event.key === "Enter") {
			imageInput.val(value);
			didUpdate(value, true);
		} else if (event.key === "Escape") {
			$(event.target).blur();
		}
	});
	imageInput.on('focusout', function(event) {
		let value = event.target.value;		
		imageInput.val(value);	
		didUpdate(value, true);
	});
	imageInput.on('input change', function(){
		let value = event.target.value;	
		imageInput.val(value);
		didUpdate(value);
	});
	let imageWrapper = $(`
		<div class="token-image-modal-url-label-wrapper image-size-wrapper">
			<div class="token-image-modal-footer-title image-size-title">${name}</div>
		</div>
	`);
	imageWrapper.append(imageInput); // Beside Label
	return imageWrapper;
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
	for (let i = 0; i < tokens.length; i++) {
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
		} else if(setting.hiddenSetting || setting.name == 'maxAge' || setting.name == 'defaultmaxhptype' || setting.name == 'placeType' || setting.globalSettingOnly) {
			continue;
		}

		let tokenSettings = tokens.map(t => t.options[setting.name]);
		let uniqueSettings = [...new Set(tokenSettings)].filter(d => d != undefined);
		if(uniqueSettings.length = 0)
			uniqueSettings = [undefined]
		let currentValue = null; // passing null will set the switch as unknown; undefined is the same as false
		if (uniqueSettings.length === 1) {
			currentValue = uniqueSettings[0];
		}
		else if(uniqueSettings.length === 0){
			currentValue = undefined;
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
					token.place_sync_persist(true);
				});
			});
			body.append(inputWrapper);
		} else {
			console.warn("build_options_flyout_menu failed to handle token setting option with type", setting.type);
		}
	}
	
	let tokenMaxAges = [];
	let tokenAges = [];
	tokens.forEach(t => {
		tokenMaxAges.push(t.options.maxAge);
		tokenAges.push(t.options.age);
	});
	let uniqueMaxAges = [...new Set(tokenMaxAges)]
	let uniqueAges = [...new Set(tokenAges)]
	body.append(build_age_inputs(uniqueAges, uniqueMaxAges, 
		function(age){
			tokens.forEach(token => {
				token.options.age = age;
				token.place_sync_persist();
			});
		
		}, 
		function(maxAge, updateToken){

			tokens.forEach(token => {
				token.options.maxAge = maxAge;
				if(updateToken)
					token.place_sync_persist();
			});
		}));	
	$(".ageMenuInput").on('focus', function(event){
		event.target.select();
	});


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
function build_token_size_input(tokenSizes, changeHandler, forceCustom = false, lineaoe=false, linewidthsize=1) {
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
	const maxScale = Math.max(window.CURRENT_SCENE_DATA.width * window.CURRENT_SCENE_DATA.scale_factor / window.CURRENT_SCENE_DATA.hpps);

	let customStyle = isSizeCustom ? "display:flex;" : "display:none;"
	const size = (numGridSquares > 0) ? (numGridSquares * window.CURRENT_SCENE_DATA.fpsq) : 1;
	const lineSize = linewidthsize * window.CURRENT_SCENE_DATA.fpsq;
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
 		${lineaoe == true ? `
		 		<div class="token-image-modal-footer-select-wrapper" style="${customStyle}">
		 			<div class="token-image-modal-footer-title">Custom line width in ${upsq}</div>
		 			<input type="number" min="${window.CURRENT_SCENE_DATA.fpsq / 2}" step="${window.CURRENT_SCENE_DATA.fpsq /2}"
					 name="data-token-line-width-custom" value=${lineSize} style="width: 3rem;">
		 		</div>

 		`: ``}
 	`);

	let tokenSizeInput = output.find("select");
	let customSizeInput = output.find("input[name='data-token-size-custom']");

	tokenSizeInput.off('change focusout').on('change focusout', function(event) {
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

	customSizeInput.off('change focusout').on('change focusout', function(event) {
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

	if(lineaoe == true){
		let customLineWidthInput = output.find("input[name='data-token-line-width-custom']");
		customLineWidthInput.change(function(event) {
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
			changeHandler(newValue, lineaoe);
		}
	});
	}

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
	return Math.min(6, window.CURRENT_SCENE_DATA.width * window.CURRENT_SCENE_DATA.scale_factor / parseFloat(tokenSize));
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

//Start Quick Roll Menu//

function open_quick_roll_menu(e){
	//opens a roll menu for group rolls 
	console.log("Opening Roll menu")
	$("#qrm_dialog").remove();

	let qrm = $("<div id='qrm_dialog'></div>");
	qrm.css('background', "#f9f9f9");
	qrm.css('width', '410px');
	qrm.css('top', e.clientY+'px');
	qrm.css('left', e.clientX+'px');
	qrm.css('height', '250px');
	qrm.css('z-index', 49001);
	qrm.css('border', 'solid 2px gray');
	qrm.css('display', 'flex');
	qrm.css('margin', '1px 1px')
	qrm.css('flex-direction', 'column');
	qrm.css('position', 'fixed')
	qrm.css('border-style', 'solid');
    qrm.css('border-color', '#ddd'); 

	$("#site").append(qrm);
	qrm.empty();	
	
	qrm.addClass("moveableWindow");

	const qrm_title_bar=$("<div id='quick_roll_title_bar' class='text-input-title-bar restored'> Quick Roll Menu </div>")
	qrm_title_bar.css('padding', '1px 3px');
	qrm_title_bar.css('position', 'sticky');
	const qrm_title_bar_popout=$('<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>');
	const qrm_title_bar_exit=$('<div id="quick_roll_title_bar_exit" class="title-bar-exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
	qrm_area=$("<table id='quick_roll_area'/>");
	
	const qrm_list_wrapper = $(`<div class="menu_table"></div>`);
	qrm_list_wrapper.mouseover(function(){
		$(this).css('--scrollY', $(this).scrollTop());
	});
	qrm_title_bar_exit.click(function(){
		$("#qrm_clear_all").click();
		$("#qrm_dialog").remove();
	});
	qrm_title_bar_popout.click(function() {
		$("#qrm_dialog").hide();
		let name = "Quick Roll Menu";

		$('#qrm_dialog #quick_roll_footer select#qrm_save_dropdown').find(`option[value='${$("#qrm_dialog #quick_roll_footer select#qrm_save_dropdown").val()}']`).attr('selected', 'selected');
		$('#qrm_dialog #quick_roll_footer select#qrm_apply_conditions').find(`option[value='${$("#qrm_dialog #quick_roll_footer select#qrm_apply_conditions").val()}']`).attr('selected', 'selected');	
		popoutWindow(name, $("#qrm_dialog"), $("#qrm_dialog").width(),  $("#qrm_dialog").height()-25);//subtract titlebar height
		qrm_update_popout();
		
		//clear the popout on close
		$(window.childWindows[name]).on('unload', function(){
			$("#qrm_clear_all").click();
			$("#qrm_dialog").remove();
			$(window.childWindows[name]).off();
		});


	})
	qrm_title_bar.append(qrm_title_bar_popout);
	qrm_title_bar.append(qrm_title_bar_exit);
	$("#qrm_dialog").append(qrm_title_bar);
	qrm_list_wrapper.append(qrm_area);

	$(qrm_title_bar).dblclick(function(){
		if($(qrm_title_bar).hasClass("restored")){
			$(qrm_title_bar).data("prev-height", $("#qrm_dialog").height());
			$(qrm_title_bar).data("prev-width", $("#qrm_dialog").width());
			$(qrm_title_bar).data("prev-top", $("#qrm_dialog").css("top"));
			$(qrm_title_bar).data("prev-left", $("#qrm_dialog").css("left"));
			$("#qrm_dialog").css("top", $(qrm_title_bar).data("prev-minimized-top"));
			$("#qrm_dialog").css("left", $(qrm_title_bar).data("prev-minimized-left"));
			$("#qrm_dialog").height(25);
			$("#qrm_dialog").width(200);
			$("#qrm_dialog").css("visibility", "hidden");
			$(qrm_title_bar).css("visibility", "visible");
			$(qrm_title_bar).addClass("minimized");
			$(qrm_title_bar).removeClass("restored");
		}
		else if($(qrm_title_bar).hasClass("minimized")){
			$(qrm_title_bar).data("prev-minimized-top", $("#qrm_dialog").css("top"));
			$(qrm_title_bar).data("prev-minimized-left", $("#qrm_dialog").css("left"));
			$("#qrm_dialog").height($(qrm_title_bar).data("prev-height"));
			$("#qrm_dialog").width($(qrm_title_bar).data("prev-width"));
			$("#qrm_dialog").css("top", $(qrm_title_bar).data("prev-top"));
			$("#qrm_dialog").css("left", $(qrm_title_bar).data("prev-left"));
			$(qrm_title_bar).addClass("restored");
			$(qrm_title_bar).removeClass("minimized");
			$("#qrm_dialog").css("visibility", "visible");
		}
	});
	let qrm_dc_input = $('<input class="menu_roll_input" id="qrm_save_dc" placeholder="Save DC" name="save_dc" title="Enter the value for the DC of the saving throw."></input>')
	//qrm_dc_input.tooltip({show: { duration: 1000 }});
	qrm_dc_input.attr('style', 'width: 25% !important');

	// Lets add the selectmenu image to each of these save types too... use the images from character sheet for save.
	let save_type_dropdown = $('<select class="general_input" id="qrm_save_dropdown" title="Select the type of saving throw to be made. ">Save Type</select>')
	save_type_dropdown.append($(`<option value="1" data-name="dex" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/dexterity.svg)'>DEXTERITY</option>`)) 
	save_type_dropdown.append($(`<option value="4" data-name="wis" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/wisdom.svg)'>WISDOM</option>`))
	save_type_dropdown.append($(`<option value="2" data-name="con" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/constitution.svg)'>CONSTITUTION</option>`))
	save_type_dropdown.append($(`<option value="0" data-name="str" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/strength.svg)'>STRENGTH</option>`))
	save_type_dropdown.append($(`<option value="3" data-name="int" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/intelligence.svg)'>INTELLIGENCE</option>`))
	save_type_dropdown.append($(`<option value="5" data-name="cha" data-style='url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/abilities/charisma.svg)'>CHARISMA</option>`))
	//save_type_dropdown.tooltip({show: { duration: 1000 }})
	save_type_dropdown.attr('style', 'width: 22% !important');

	$( function() {
		$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
		_renderItem: function( ul, item ) {
			let li = $( `<li class='icon-avatar' >` )
			wrapper = $( "<div>", { text: item.label } );
			$( "<li>", {
			style: 'background-image: ' + item.element.attr( "data-style" ),
			"class": "ui-icon " + item.element.attr( "data-class" )}).appendTo(wrapper);
			return li.append( wrapper ).appendTo( ul );
		}
		});
		$("#qrm_save_dropdown")
		.iconselectmenu({ change: function( event, ui ) { save_type_change(this); }})
    		.addClass( "ui-menu-icons" );
	});

	let damage_input  = $('<input class="menu_roll_input" id="hp_adjustment_failed_save" placeholder="Damage/Roll" title="Enter the integer value for damage or the roll to be made i.e. 8d6"></input>')
	//damage_input.tooltip({show: { duration: 1000 }})
	damage_input.attr('style', 'width: 25% !important');

	let half_damage_input = $('<input class="menu_roll_input" id="half_damage_save" placeholder="Success Damage" title="Enter the integer value for half damage, or autopopulate from damage entry as half rounded down.""></input>')
	//half_damage_input.tooltip({show: { duration: 1000 }})
	half_damage_input.attr('style', 'width: 25% !important');

	damage_input.change(function(){
		_dmg = $('#hp_adjustment_failed_save').val();
		if (_dmg.includes('d')) {
			let expression = _dmg
			let roll = new rpgDiceRoller.DiceRoll(expression);
			console.log(expression + "->" + roll.total);
			//reassign to the input 
			_dmg = roll.total
			$('#hp_adjustment_failed_save').val(_dmg);
		}
		else {
			_dmg.replace(/[^\d.-]/g, '')
		}
		$("#half_damage_save").val(Math.floor(_dmg/2));
		qrm_update_popout();
	});

	//Roll Button 
	let qrm_roll=$("<button id='qrm_roll_button' >ROLL</button>");
	qrm_roll.css('width', '13%');
	qrm_roll.click(function() {
		$('#qrm_apply_damage').show()
		$('#qrm_apply_healing').show()
		$("#quick_roll_area").children('tr').children('td').find('#roll_bonus').each(function (){
			let modifier = $(this).val().toLowerCase();
			// Add a + if the user doesn't add anything. 
			if (!modifier.includes('+') && !modifier.includes('-')){
				modifier = '+' + modifier
			}
			dice = '1d20'
			if (modifier.includes("a") == true) {
				modifier = modifier.replace(/[^\d.-]/g, '');
				dice = '2d20kh1 +';
			}
			else if (modifier.includes("d") == true) {
				modifier = modifier.replace(/[^\d.-]/g, '');
				dice = '2d20kl1 +';
			}
			let expression = dice + modifier;
			let roll = new rpgDiceRoller.DiceRoll(expression);
			console.log(expression + "->" + roll.total);
			//reassign to the input 
			result = $(this).parent().children('#qrm_roll_result')
		
			// Append success or fail to the value... not sure this is best, there are a few ways but this is simple
			//display a Save success or failure.
			save_dc = $("#qrm_save_dc").val()
			if (save_dc != ""){
				if (parseInt(roll.total) >= parseInt(save_dc)){
					result.val(roll.total + ' Success!')
					result.css('background', 'green')
				}
				else {
					result.val(roll.total + ' Fail!')
					result.css('background', 'red')}
			}
			else {//if not defined apply full damage.
				result.val(roll.total + ' Auto-Fail')
				result.css('background', 'yellow')
			}
		});
		setTimeout(qrm_update_popout,500);
	});

	//Clear Button
	let qrm_clear = $("<button id='qrm_clear_all' >CLEAR </button>");
	qrm_clear.css('width', '15%');
	qrm_clear.css('bottom', '5px');
	qrm_clear.css('right', '5px')
	qrm_clear.css('position','absolute');

	qrm_clear.click(function() {
		$("#quick_roll_area").children('tr').each(function (){
			$(this).find('#qrm_remove').click()
		});
		qrm_update_popout();
	});

	let qrm_sendToGamelog = $("<button id='qrm-block-send-to-game-log'><span class='material-symbols-outlined'>login</span></button>");
	qrm_sendToGamelog.click(function() {
		let results = $("#quick_roll_area").clone();
		results.find('#roll_bonus, .roll_mods_group, td>td:nth-of-type(2), td>td:nth-of-type(3)').remove();
		results.find('input').replaceWith(function(){
			return $(`<span>${$(this).val()}</span>`)
		})
		results.find('img').attr('width', '30').attr('height', '30');
		results.find('tr').css({
			'max-height': '30px',
			'height': '30px'
		})
		results.find('tr>td:first-of-type').css({
			'width': '30px',
			'height': '30px'
		})
		results.find('tr>td:nth-of-type(even)').css({
			'height': '15px',
			'font-size': '12px'
		})
		results.css({'width':'100%'});
		results.find('tr td span').each(function(){
			if($(this).text().match(/fail/gi)){
				$(this).toggleClass('save-fail', true)
			}
			else{
				$(this).toggleClass('save-success', true)
			}
		})
		const rows = results.find('tr[data-target]');
		rows.each(function(){
			const target = $(this).attr('data-target');
			if (window.all_token_objects[target]?.options.revealname != true){
				$(this).toggleClass('hideQrmRowFromPlayers')
			}

		})
		results.attr('id','qrm-gamelog');
		let msgdata = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: results[0].outerHTML,
		};
		window.MB.inject_chat(msgdata);
	});

	//Update HP buttons	
	let qrm_hp_adjustment_wrapper=$('<div id="qrm_adjustment_wrapper" class="adjustments_wrapper"></div>');

	let damage_hp = $('<button title="Apply Roll as Damage" id="qrm_damage" value="ON" class="damage_heal_button active_roll_mod" >DAMAGE</button>')
	damage_hp.click(function() {
	
		console.log($(this).val())
		console.log($(this))
		//toggle off the other button
		$(heal_hp).val("OFF")
		$(heal_hp).removeClass('active_roll_mod')
		
		if($(this).val() == "ON"){
			$(this).val("OFF");
			$(this).removeClass('active_roll_mod')
		}
	  	else if($(this).val() == "OFF"){
			$(this).val("ON");
			$(this).addClass('active_roll_mod')
		}
	});
	let heal_hp = $('<button title="Apply Roll as Healing" id="qrm_healing" value="OFF" class="damage_heal_button">HEAL</button>')
	heal_hp.click(function(){
		
		console.log('EHRE')
		console.log($(this).val())
		console.log($(this))
		//toggle off the other button
		$(damage_hp).val("OFF")
		$(damage_hp).removeClass('active_roll_mod')

		if($(this).val() == "ON"){
			$(this).val("OFF");
			$(this).removeClass('active_roll_mod')
		}
	  	else if($(this).val() == "OFF"){
			$(this).val("ON");
			$(this).addClass('active_roll_mod')
		}
	});

	qrm_hp_adjustment_wrapper.append(heal_hp)
	qrm_hp_adjustment_wrapper.append(damage_hp)

	//Allow applying condtions with damage/healing after a failed save
	apply_conditions = $('<select class="general_input" id="qrm_apply_conditions" title="Select a conditions to be applied on failed save."> Apply Conditions </select>');
	apply_conditions.attr('style', 'width: 26% !important');
	apply_conditions.append($(`<option value='conditions' data-style="background-image: none !important;">CONDITIONS</option>`))
	apply_conditions.append($(`<option value='remove_all' data-class="dropdown-remove" >Remove All</option>`))

	STANDARD_CONDITIONS.forEach(conditionName => {
		let cond_name = conditionName.toLowerCase().replaceAll("(", "-").replaceAll(")", "").replaceAll(" ", "-")
		apply_conditions.append($(`<option value=${conditionName} data-name="${cond_name}" data-style="background-image: url(https://www.dndbeyond.com/content/1-0-1849-0/skins/waterdeep/images/icons/conditions/${cond_name}.svg)";>${cond_name}</option>`));
	});
	CUSTOM_CONDITIONS.forEach(conditionName => {
		let cond_name = conditionName.toLowerCase().replaceAll("(", "-").replaceAll(")", "").replaceAll(" ", "-")
		if (cond_name.includes('#')){
			apply_conditions.append($(`<option value=${conditionName} data-style="background-color: ${cond_name}; background-image: none;";>Custom Condition</option>`));
		}
		else{
			let cond = $(`<option  value=${conditionName} data-name="${cond_name}" data-class="dropdown-${cond_name}";>${cond_name}</option>`)
			apply_conditions.append(cond);
		}
	});
		
	$( function() {
			$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
			_renderItem: function( ul, item ) {
				let li = $( `<li class='icon-avatar' >` )
				wrapper = $( "<div>", { text: item.label } );
				$( "<li>", {
				style: item.element.attr( "data-style" ),
				"class": "ui-icon " + item.element.attr( "data-class" )}).appendTo(wrapper);
				return li.append( wrapper ).appendTo( ul );
			}
			});
			$("#qrm_apply_conditions")
			.iconselectmenu()
			.iconselectmenu( "menuWidget")
				.addClass( "ui-menu-icons" );
	});
	apply_conditions.attr('style', 'width: 26% !important');

	let apply_adjustments = $('<button title="Apply Damage/Healing and Conditions on failed save" id="qrm_apply_adjustments" class="general_input"> APPLY </button>')
	apply_adjustments.click(function() {
		qrm_apply_hp_adjustment($('#qrm_healing').val());
	});

	let qrm_footer = $("<div id='quick_roll_footer' class='footer-input-wrapper tfoot'/>");
	qrm_footer.css({
		'bottom': '0',
		'position':'sticky',
		'background': "#f9f9f9",
		'height': 'fit-content',
	    'display': 'flex',
	    'flex-direction': 'row',
	    'flex-wrap': 'wrap',
	    'justify-content': 'flex-start',
	    'align-items': 'center',
	    'row-gap': '5px',
	});

	
	qrm_footer.append(damage_input)
	qrm_footer.append(half_damage_input)
	qrm_footer.append(qrm_dc_input)
	qrm_footer.append(save_type_dropdown)
	qrm_footer.append(qrm_roll);
	qrm_footer.append(apply_conditions);
	
	qrm_footer.append(qrm_hp_adjustment_wrapper);
	qrm_footer.append(apply_adjustments)
	//qrm_footer.append(heal_hp);
	//qrm_footer.append(damage_hp);
	qrm_footer.append(qrm_sendToGamelog);
	qrm_footer.append(qrm_clear);
	//damage_hp.hide()
	//heal_hp.hide()

	//header
	qrm.append(qrm_title_bar);
	//body
	qrm.append(qrm_list_wrapper);
	//footer
	qrm.append(qrm_footer);
	
	qrm.css('opacity', '0.0');
	qrm.animate({
		opacity: '1.0'
	}, 1000);
	
	qrm.draggable({
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
	qrm.resizable({
		addClasses: false,
		handles: "all",
		containment: "#windowContainment",
		start: function () {
			$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function () {
			$('.iframeResizeCover').remove();
		},
		minWidth: 215,
		minHeight: 200
	});
	$("#qrm_dialog").mousedown(function() {
		frame_z_index_when_click($(this));
	});
}

function add_to_quick_roll_menu(token){
	//Adds a specific target to the quick roll menu

	window.TOKEN_OBJECTS[token.options.id].in_qrm = true

	if(token.options.name == "Not in the current map")
		return;
	if (token.isAoe()) {
		return; // don't add aoe to combat tracker
	}

	qrm_entry=$("<tr/>");
	qrm_entry.attr("data-target", token.options.id);	
	qrm_entry.attr("data-name", token.options.name);
	//qrm_entry.tooltip({show: { duration: 1000 }});
	let img;
	let video = false;
	if(token.options.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => token.options.imgsrc.includes(d))){
		img = $(`<video disableRemotePlayback muted width=42 height=42 class='Avatar_AvatarPortrait__2dP8u' title='${token.options.name}'>`);
		video = true;
	} 
	else{
		img = $(`<img width=42 height=42 class='Avatar_AvatarPortrait__2dP8u' title='${token.options.name}'>`);
	}

	updateImgSrc(token.options.imgsrc, img, video);
	img.css('border','3px solid '+token.options.color);
	img.css('margin', '2px 2px');
	if (token.options.hidden == true){
		img.css('opacity','0.5');
	}
	//img.tooltip({show: { duration: 1000 },position: { my: "left+15 center", at: "right center" }});
	qrm_entry.append($("<td/>").append(img));
	
	//qrm_entry_name_hp_bonus = $("<td style='width:60%;'/>")
	qrm_entry_name = $("<td style='display:block; width:100%; overflow:hidden;'/>")
	qrm_entry_row = $("<td style='display:block; width:100%;'/>")
	qrm_entry_row_rolls = $("<td style='display:inline-flex; width:30%;'/>")
	qrm_entry_row_hp = $("<td style='display:inline-flex; width:25%; white-space: nowrap;'/>")
	qrm_entry_row_buttons = $("<td style='display:inline-flex; width:45%;'/>")

	name_line = $("<div class='qrm_name_line'>"+token.options.name+"</div>")

	if(token.options.monster > 0)
		qrm_entry.attr('data-monster',token.options.monster);

	let roll_box=$("<input id='roll_bonus' class='menu_roll_input' maxlength=4 style='text-align: center; font-size:12px; width:35%;' title='Use +/- for custom bonus, add A or D for Adv/Disadv'>");
	//roll_box.tooltip({show: { duration: 1000 }});

	let roll_result=$("<input id='qrm_roll_result' class='menu_roll_input' style='text-align: center; font-size:12px; margin:2px; width:55%;' title='Result of roll'>");
	//roll_result.tooltip({show: { duration: 1000 }});

	let roll_mods=$('<div class="roll_mods_group"></div>');
	//roll_mods.tooltip({show: { duration: 1000 }});

	roll_mod_adv = $('<button title="Advantage to roll" id="adv" name="roll_mod" value="OFF" class="roll_mods_button icon-advantage markers-icon" />')
	//roll_mod_adv.tooltip({show: { duration: 1000 }})
	roll_mod_adv.click(function(){
		let row_id = $(this).closest('tr').attr('data-target');
		let target_button = $(`tr[data-target='${row_id}'] #adv`);
		let roll_bonus_target = target_button.parent().parent().children('#roll_bonus');
		roll_bonus_target.val(roll_bonus_target.val().replaceAll(/[ad]/gi, ''))
	
		let disadv_button = target_button.parent().children('#disadv');
		$(disadv_button).val("OFF")
		$(disadv_button).removeClass('active_roll_mod')
		
		if(target_button.val() == "ON"){
			target_button.val("OFF");
			target_button.removeClass('active_roll_mod')
		}
	  	else if(target_button.val() == "OFF"){
			target_button.val("ON");
			roll_bonus_target.val(roll_bonus_target.val() + 'a')
			target_button.addClass('active_roll_mod')
		}
		if(childWindows['Quick Roll Menu']){
			qrm_update_popout();
		}
	});
	roll_mod_disadv = $('<button title="Disadvantage to roll" id="disadv" name="roll_mod" value="OFF" class="roll_mods_button icon-disadvantage markers-icon" />')
	//roll_mod_disadv.tooltip({show: { duration: 1000 }})
	roll_mod_disadv.click(function(){
		let row_id = $(this).closest('tr').attr('data-target');
		let target_button = $(`tr[data-target='${row_id}'] #disadv`);
		let roll_bonus_target=target_button.parent().parent().children('#roll_bonus');
		roll_bonus_target.val(roll_bonus_target.val().replaceAll(/[ad]/gi, ''))

		let adv_button = target_button.parent().children('#adv');
		$(adv_button).val("OFF")
		$(adv_button).removeClass('active_roll_mod')

		if(target_button.val() == "ON"){
			target_button.val("OFF");
			target_button.removeClass('active_roll_mod')
		}
	  	else if(target_button.val() == "OFF"){
			target_button.val("ON");
			roll_bonus_target.val(roll_bonus_target.val() + 'd')
			target_button.addClass('active_roll_mod')
		}
		if(childWindows['Quick Roll Menu']){
			qrm_update_popout();
		}
	});
	roll_mods.append(roll_mod_adv)
	roll_mods.append(roll_mod_disadv)

	roll_bonus = qrm_fetch_stat(token);
	roll_box.val(roll_bonus)

	let hp_input = $("<input id='qrm_hp' class='menu_hp_input'>");
	hp_input.css('text-align', 'right');
	
	if(token.isPlayer()){
		hp_input.prop("disabled", true);
		hp_input.css('color', 'gray')
	}
	hp_input.val(token.hp);

	if(hp_input.val() === '0'){
		qrm_entry.toggleClass("ct_dead", true);
	}
	else{
		qrm_entry.toggleClass("ct_dead", false);
	}

	let divider = $("<div style='display:inline-block;'>/</>");
		
	let maxhp_input = $("<input id='qrm_maxhp' class='menu_hp_input'>");
	maxhp_input.css('text-align', 'left');

	if(token.isPlayer()){
		maxhp_input.prop("disabled", true);
		maxhp_input.css('color', 'gray')
	}
	maxhp_input.val(token.maxHp);

	if (!token.isPlayer()) {
		hp_input.change(function(e) {
			let selector = "div[data-id='" + token.options.id + "']";
			let old = $("#tokens").find(selector);
		
			if (hp_input.val().trim().startsWith("+") || hp_input.val().trim().startsWith("-")) {
				hp_input.val(Math.max(0, parseInt(token.hp) + parseInt(hp_input.val())));
			}

			old.find(".hp").val(hp_input.val().trim());	

			if(window.all_token_objects[token.options.id] != undefined){
				window.all_token_objects[token.options.id].hp = hp_input.val();
			}			
			if(window.TOKEN_OBJECTS[token.options.id] != undefined){		
				window.TOKEN_OBJECTS[token.options.id].hp = hp_input.val();	
				window.TOKEN_OBJECTS[token.options.id].update_and_sync();
			}			
			qrm_update_popout();
		});
		hp_input.click(function(e) {
			$(e.target).select();
		});
		maxhp_input.change(function(e) {
			let selector = "div[data-id='" + token.options.id + "']";
			let old = $("#tokens").find(selector);

			if (maxhp_input.val().trim().startsWith("+") || maxhp_input.val().trim().startsWith("-")) {
				maxhp_input.val(Math.max(0, parseInt(token.hp) + parseInt(maxhp_input.val())));
			}

			old.find(".max_hp").val(maxhp_input.val().trim());
			if(window.all_token_objects[token.options.id] != undefined){
				window.all_token_objects[token.options.id].maxHp = maxhp_input.val();
			}
			if(window.TOKEN_OBJECTS[token.options.id] != undefined){		
				window.TOKEN_OBJECTS[token.options.id].maxHp = maxhp_input.val();	
				window.TOKEN_OBJECTS[token.options.id].update_and_sync();
			}			
			qrm_update_popout();
		});
		maxhp_input.click(function(e) {
			$(e.target).select();
		});
	}
	else {
		hp_input.keydown(function(e) { if (e.keyCode == '13') token.update_from_page(); e.preventDefault(); }); // DISABLE WITHOUT MAKING IT LOOK UGLY
		maxhp_input.keydown(function(e) { if (e.keyCode == '13') token.update_from_page(); e.preventDefault(); });
	}

	const qrm_resistance_button = $(`<button title="resistance" class='resistanceButton qrm_buttons_bar' style="display:inline-flex;"><span class="material-symbols-outlined">person_shield</span></button>`);


	qrm_entry_buttons = $("<td style='height:100%; text-align: right; width:100%; top: 1px; position: relative; white-space:nowrap; display:flex'>");
	
	qrm_resistance_button.off('click.resistance').on('click.resistance', function(){
		qrm_resistance_button.toggleClass('enabled');
		qrm_update_popout();
	});
	qrm_entry_buttons.append(qrm_resistance_button);

	find=$('<button class="qrm_buttons_bar" title="Find Token" style="display:inline-flex;"><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg></button>');
	//find.tooltip({show: { duration: 1000 }})
	find.click(function(){
		let target=$(this).parent().parent().parent().parent().attr('data-target');
		if(target in window.TOKEN_OBJECTS){
			window.TOKEN_OBJECTS[target].highlight();	     
		}
		else if(target in window.all_token_objects){
			place_token_in_center_of_view(window.all_token_objects[target].options);
		  	$(`#quick_roll_area tr[data-target='${target}'] .findSVG`).remove();
           	let findSVG=$('<svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg>');	
            $(`#quick_roll_area tr[data-target='${target}'] .findTokenCombatButton`).append(findSVG);
		}
	});
	qrm_entry_buttons.append(find);

	remove_from_list=$('<button title="Remove from menu" id="qrm_remove" class="qrm_buttons_bar" style="display:inline-flex;"><svg class="delSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg></button>');
	//remove_from_list.tooltip({show: { duration: 1000 }})
	remove_from_list.click(
		function() {
			console.log('Removing from list')
			let target=$(this).parent().parent().parent().parent().attr('data-target');
			if(target in window.TOKEN_OBJECTS){
				remove_from_quick_roll_menu(window.TOKEN_OBJECTS[target]);	     
			}
		}
	);
	qrm_entry_buttons.append(remove_from_list);
	
	if(token.options.statBlock){
		stat_block=$('<button title="Open Monster Stat Block" class="qrm_buttons_bar" style="display:inline-flex;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		
		stat_block.click(function(){
			window.JOURNAL.display_note(token.options.statBlock);
		});
		if(!token.isMonster()){
			stat_block.css("visibility", "hidden");
		}
	}
	else if(token.isMonster() == true){
		stat_block=$('<button title="Open Monster Stat Block" class="qrm_buttons_bar" style="display:inline-flex;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		
		stat_block.click(function(){
			load_monster_stat(token.options.monster, token.options.id);
		});
		if(!token.isMonster()){
				stat_block.css("visibility", "hidden");
		}
	}	
	else if (token.isPlayer() == true) {
		stat_block=$('<button title="Open Player Stat Block" class="qrm_buttons_bar" style="display:inline-flex;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		stat_block.click(function(){
			open_player_sheet(token.options.id, undefined, token.options.name);
		});
	}
	else{
		stat_block=$('<button title="No Stat Block for custom tokens" disabled="true" class="qrm_buttons_bar" style="display:inline-flex;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		//can add the below if people don't like the disabled button
		//stat_block.click(function(){
		//	alert('Sorry, this appears to be a custom token, there was no stat block to fetch.');
		//});
	}
	qrm_entry_buttons.append(stat_block)
	//stat_block.tooltip({show: { duration: 1000 }})

	qrm_entry_name.append(name_line);
	
	qrm_entry_row_rolls.append(roll_box);
	qrm_entry_row_rolls.append(roll_result);
	qrm_entry_row_rolls.append(roll_mods);
	
	qrm_entry_row_hp.append(hp_input);
	qrm_entry_row_hp.append(divider);
	qrm_entry_row_hp.append(maxhp_input);

	qrm_entry_row.append(qrm_entry_row_rolls)
	qrm_entry_row.append(qrm_entry_row_hp)

	
	qrm_entry_row_buttons.append(qrm_entry_buttons)
	qrm_entry_row.append(qrm_entry_row_buttons)

	qrm_entry.append(qrm_entry_name);
	qrm_entry.append(qrm_entry_row);
	
	qrm_update_popout();
	$("#quick_roll_area").append(qrm_entry)
}

function save_type_change(dropdown){
	console.log("Save type is: "+ dropdown.value );
	$('#quick_roll_area').children('tr').each(function () {
		let x = window.TOKEN_OBJECTS[$(this).attr('data-target')]
		roll_bonus = qrm_fetch_stat(x)
		$(this).find('#roll_bonus').val(roll_bonus)
	});
}

function qrm_fetch_stat(token) {
	let roll_bonus
	//if its a monster it needs to be calulated.
	if(token.options.monster > 0 || token.options.monster == 'open5e'){
		let stat = (cached_monster_items[token.options.monster]?.monsterData) ? cached_monster_items[token.options.monster]?.monsterData : cached_open5e_items[token.options.itemId]?.monsterData;

		if(typeof(stat) != 'undefined'){
			save_dropdown_value = parseInt($('#qrm_save_dropdown').val());
			
			//modifier = Math.floor((stat.stats.find(obj => {return obj.statId === save_dropdown_value}).value - 10) / 2.0);
			modifier = Math.floor((stat.stats[save_dropdown_value].value - 10) / 2.0);
			save_dropdown_value += 1;// need +1 offset for saves (not normal ability scores as above) as they are stored differently
			
			let x = stat.savingThrows.find(obj => {return obj.statId === save_dropdown_value});
			
			if (typeof(x) != 'undefined'){
				//add proficiency bonus if proficent 
				saving_throw_bonus = convert_CR_to_proficiency(stat.challengeRatingId);
				if (x.bonusModifier != null){
					saving_throw_bonus += x.bonusModifier;
				}
			}
			else {
				saving_throw_bonus = 0; 
			}
			roll_bonus = modifier + saving_throw_bonus;
			if (roll_bonus >= 0){
				roll_bonus = "+"+roll_bonus;
			}
		}
		console.log(roll_bonus);
	}
	else if (token.isPlayer() == true) {
		save_dropdown_value = parseInt($('#qrm_save_dropdown').val());
		//This relies of player data being loaded, which may take a few seconds after the page opens
		//if its a player character they have the save stored
		roll_bonus = token.options.abilities[save_dropdown_value]['save']

		if (roll_bonus >= 0){
			roll_bonus = "+"+roll_bonus;
		}
	}
	else{
		//if its an custom token, give no bonus. But still allow a roll (if it has stats) 
		//if has stats
		save_dropdown_value = parseInt($('#qrm_save_dropdown').val());
		if(token.options.customStat != undefined){
			roll_bonus = token.options.customStat[save_dropdown_value]['save']
		}
		if(roll_bonus == undefined){
			roll_bonus = "+"+0;	
		}
	}
	qrm_update_popout()
	return roll_bonus
}
	
function remove_from_quick_roll_menu(token) {
	let id = token.options.id;
	if ($("#quick_roll_area tr[data-target='" + id + "']").length > 0) {
		$("#quick_roll_area tr[data-target='" + id + "']").remove(); // delete token from qrm if there
	}
	window.TOKEN_OBJECTS[token.options.id].in_qrm = undefined;
	qrm_update_popout()
}

function convert_CR_to_proficiency(challenge_rating){
	//Apparently proficinecy bonus isn't stored in the monster data, unless i just missed it. 
	//And this should be significantly faster than having to reread the statblock.
	CR = challenge_rating;
	switch (true) {
		case CR >= 34://CR 29
			prof = 9;
			break;
		case CR >= 30://CR 25 
			prof = 8;
			break;
		case CR >= 25://CR 21
			prof = 7;
			break;
		case CR >= 21://CR 17
			prof = 6;
			break;
		case CR >= 17://CR 13
			prof = 5;
			break;
		case CR >= 13://CR 9 
			prof = 4;
			break;
		case CR >= 9://CR 5
			prof = 3;
			break;
		case CR <= 8://CR <4 
			prof = 2;
			break;
	}
	return prof;
}

function qrm_update_popout(){
	
	if(childWindows['Quick Roll Menu']){
		updatePopoutWindow("Quick Roll Menu", $("#qrm_dialog"));
		removeFromPopoutWindow("Quick Roll Menu", "#quick_roll_title_bar");

		//remove the iconselectmenu, since it won't work in the popout
		removeFromPopoutWindow("Quick Roll Menu", "#qrm_save_dropdown-button");
        removeFromPopoutWindow("Quick Roll Menu", "#qrm_apply_conditions-button")
        $(childWindows['Quick Roll Menu'].document).find(".general_input").css('display', '');

		$(childWindows['Quick Roll Menu'].document).find("#qrm_dialog").css({
			'display': 'block',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'width': '100%',
			'height': '100%'
		});
		console.log('Update QRM popout');
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_area input#qrm_hp').change(function(e) {
			let id = $(this).parent().parent().parent().attr("data-target");			
			$(`tr[data-target='${id}'] #qrm_hp`).val($(this).val());
			$(`tr[data-target='${id}'] #qrm_hp`).trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_area input#qrm_maxhp').change(function(e) {
			let id = $(this).parent().parent().parent().attr("data-target");
			$(`tr[data-target='${id}'] #qrm_maxhp`).val($(this).val());
			$(`tr[data-target='${id}'] #qrm_maxhp`).trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_area input#roll_bonus').change(function(e) {
			let id = $(this).parent().parent().parent().attr("data-target");
			console.log($(`tr[data-target='${id}'] #roll_bonus`))
			$(`tr[data-target='${id}'] #roll_bonus`).val($(this).val());
			$(`tr[data-target='${id}'] #roll_bonus`).trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_area input#roll_result').change(function(e) {
			let id = $(this).parent().parent().parent().attr("data-target");
			$(`tr[data-target='${id}'] #roll_result`).val($(this).val());
			$(`tr[data-target='${id}'] #roll_result`).trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer input#damage_failed_save').change(function(e) {
			$("#qrm_dialog #quick_roll_footer input#damage_failed_save").val($(this).val());
			$("#qrm_dialog #quick_roll_footer input#damage_failed_save").trigger("change");
			qrm_update_popout();
		});
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer input#hp_adjustment_failed_save').change(function(e) {
			$("#qrm_dialog #quick_roll_footer input#hp_adjustment_failed_save").val($(this).val());
			$("#qrm_dialog #quick_roll_footer input#hp_adjustment_failed_save").trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer input#half_damage_save').change(function(e) {
			$("#qrm_dialog #quick_roll_footer input#half_damage_save").val($(this).val());
			$('#qrm_dialog #quick_roll_footer input#half_damage_save').trigger("change");
			qrm_update_popout();
		});	
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer input#qrm_save_dc').change(function(e) {
			$("#qrm_dialog #quick_roll_footer input#qrm_save_dc").val($(this).val());
			$('#qrm_dialog #quick_roll_footer input#qrm_save_dc').trigger("change");
			qrm_update_popout();
		});			
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer select#qrm_save_dropdown').change(function(e) {
			$("#qrm_dialog #quick_roll_footer select#qrm_save_dropdown").find(`option[selected='selected']`).removeAttr('selected');
			$("#qrm_dialog #quick_roll_footer select#qrm_save_dropdown").find(`option[value='${$(this).val()}']`).attr('selected', 'selected');
			$("#qrm_dialog #quick_roll_footer select#qrm_save_dropdown").val($(this).val());
			$('#qrm_dialog #quick_roll_footer select#qrm_save_dropdown').trigger("change");
			save_type_change($("#qrm_save_dropdown"))
			qrm_update_popout();
		});			
		$(childWindows['Quick Roll Menu'].document).find('#qrm_dialog #quick_roll_footer select#qrm_apply_conditions').change(function(e) {
			$("#qrm_dialog #quick_roll_footer select#qrm_apply_conditions").find(`option[selected='selected']`).removeAttr('selected');
			$("#qrm_dialog #quick_roll_footer select#qrm_apply_conditions").find(`option[value='${$(this).val()}']`).attr('selected', 'selected');
			$("#qrm_dialog #quick_roll_footer select#qrm_apply_conditions").val($(this).val());
			$('#qrm_dialog #quick_roll_footer select#qrm_apply_conditions').trigger("change");
			qrm_update_popout();
		});
	
		$(childWindows['Quick Roll Menu'].document).find("#qrm_damage").click(function(){
			let heal_hp = $("#qrm_healing");
			let damage_hp = $("#qrm_damage");
			//toggle off the other button
			$(heal_hp).val("OFF")
			$(heal_hp).removeClass('active_roll_mod')
			
			if($(damage_hp).val() == "ON"){
				$(damage_hp).val("OFF");
				$(damage_hp).removeClass('active_roll_mod')
			}
		  	else if($(damage_hp ).val() == "OFF"){
				$(damage_hp).val("ON");
				$(damage_hp).addClass('active_roll_mod')
			}
			qrm_update_popout();
		});
		$(childWindows['Quick Roll Menu'].document).find("#qrm_healing").click(function(){
			let heal_hp = $("#qrm_healing");
			let damage_hp = $("#qrm_damage");

			//toggle off the other button
			$(damage_hp).val("OFF")
			$(damage_hp).removeClass('active_roll_mod')

			if($(heal_hp).val() == "ON"){
				$(heal_hp).val("OFF");
				$(heal_hp).removeClass('active_roll_mod')
			}
		  	else if($(heal_hp).val() == "OFF"){
				$(heal_hp).val("ON");
				$(heal_hp).addClass('active_roll_mod')
			}
			qrm_update_popout();
		});

		
	}
}

function qrm_apply_hp_adjustment(healing=false){
	if(healing == 'ON'){
		healing = true;
	}
	$("#quick_roll_area").children('tr').each(function (){
		let result = $(this).find('#qrm_roll_result').val();
		if (result == ''){
			//could swap this to an alert if people really think its needed...
			console.log('No roll was performed on this token, but Apply was selected. Rerolling for ALL tokens.')
			$('#qrm_roll_button').click()
		}
		
		let token = window.TOKEN_OBJECTS[$(this).attr('data-target')]
		let hp_adjustment_failed_save = $('#hp_adjustment_failed_save').val()
		let half_damage_save_success = $('#half_damage_save').val()

		hp_adjustment_failed_save = parseInt(hp_adjustment_failed_save.replace(/[^\d.-]/g, ''));
		half_damage_save_success = parseInt(half_damage_save_success.replace(/[^\d.-]/g, ''));

		let damage;
		if (healing == true){
			damage = -hp_adjustment_failed_save || 0
		}
		else{
			
			damage = hp_adjustment_failed_save || 0
			
			if(!result.includes('Fail') && damage > 0) {
				damage = Math.max(half_damage_save_success, 1) || 0
			}	
			if($(this).find('button.resistanceButton.enabled').length>0 && damage>0){
				damage = Math.max(Math.floor(damage/2), 1);
			}
		}
	
		let conditions = $('#qrm_apply_conditions')
		let conditionName = conditions.val()
		if(conditionName == 'conditions'){
			//Do nothing
		} 
		else if(conditionName == "remove_all"){
			//guess this is fine, we update the token immediately. Probably a better way to clear though
			token.options.conditions = []
			token.options.custom_conditions = []
		}
		else if(result.includes('Fail')){
			if(!token.hasCondition(conditionName)){
				token.addCondition(conditionName, conditionName);
			}
		}	
		
		if(token.options?.hitPointInfo?.maximum>0 && token.options?.itemType != 'pc'){
			let _hp = $(this).find('#qrm_hp');
			let _max_hp = $(this).find('#qrm_maxhp');

			let _hp_val = parseInt($(this).find('#qrm_hp').val());//make string an int before comparing otherwise '11' is less than '6'
			let _max_hp_val = parseInt($(this).find('#qrm_maxhp').val())
			//Lets not allow healing over maxhp
			//Unless we are at max_hp then assume they want the temp hp? IDK about this.
			if (_hp_val < _max_hp_val && _hp_val - damage > _max_hp_val){
				_hp.val(_max_hp_val);
			}
			else{
				_hp.val(Math.max(0, token.hp - damage));
			}
			_hp.trigger('change');
		}
		else {
			if (damage != 0){
				let dmg_heal_text;
				if (damage > 0){
					dmg_heal_text = token.options.name + " takes " + damage +" damage (adjust manually)";
				}
				else{
					dmg_heal_text = token.options.name + " heals for " + -damage +" (adjust manually)";
				}
					let msgdata = {
					player: window.PLAYER_NAME,
					img: window.PLAYER_IMG,
					text: dmg_heal_text,
				};
				window.MB.inject_chat(msgdata);
			}
		}
		//token.place_sync_persist();	
		// bit of overlap with place_sync_persist nad update_and_sync, so probably break it up, just to only sync once.
		token.place()
		token.update_and_sync();
		qrm_update_popout();
	});
}

//end Quick Roll Menu//