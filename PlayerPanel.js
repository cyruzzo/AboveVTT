function init_pclist() {
	update_pclist();

}

// this is not ideal, but if update_pclist is called while the user is dragging a player token, then draggable breaks and leaves the ui.helper on the screen forever
// to prevent draggable from breaking, we prevent update_pclist from executing while the user is dragging a player token
// once the user stops dragging the player token, we call update_pclist if it was called during the drag
let isDraggingPlayerToken = false;
let pclistUpdateRequired = false;

function update_pclist() {
	if (isDraggingPlayerToken) {
		pclistUpdateRequired = true;
		return;
	}

	// get scroll position
	var scroll_y = $(".sidebar__pane-content").scrollTop();
	
	playersPanel.body.empty();

	gather_pcs();

	const addPartyButtonContainer = $("<div class='add-party-container'></div>");
	const addPartyButton = $("<button id='add-party'>ADD PARTY</button>");
	addPartyButton.on('click', () => {
		window.pcs.forEach(function (player, i) {
			token_button({ target: $(`[data-set-token-id='${player.sheet}']`) }, i, window.pcs.length);
		});
	});
	
	addPartyButtonContainer.append(addPartyButton);
	
	if(window.DM)
		playersPanel.body.append(addPartyButtonContainer);

	window.pcs.forEach(function(item, index) {

		pc = item;
		color = "#" + get_player_token_border_color(pc.sheet);

		let playerData;
		if (pc.sheet in window.PLAYER_STATS) {
			playerData = window.PLAYER_STATS[pc.sheet];
		}

		const newPlayerTemplate = `
			<div class="player-card" data-player-id="${pc.sheet}">
				<div class="player-card-header">
					<div class="player-name">${pc.name}</div>
					<div class="player-actions">
						<button 
							data-set-token-id='${pc.sheet}' data-img='${pc.image}' data-name="${pc.name}"
							data-hp="${playerData ? playerData.hp : ''}"
							data-ac="${playerData ? playerData.ac : ''}"
							data-maxhp="${playerData ? playerData.max_hp : ''}"
							data-color="${color}" class="add-token-btn">
							TOKEN
						</button>
						<button data-target='${pc.sheet}' class="open-sheet-btn">SHEET</button>
						<button class="whisper-btn" data-to="${pc.name}">WHISPER</button>
					</div>
				</div>
				<div class="player-card-content">
					<div class="player-token" style="box-shadow: ${
						playerData ? `${token_health_aura(
							Math.round((playerData.hp / playerData.max_hp) * 100)
						)} 0px 0px 11px 3px` : 'none'
					};">
						<img width="70" height="70" src="${pc.image}" style="border: 3px solid ${color}" />
						${
							playerData ? `
								<div class="player-token-hp">${playerData.hp} / ${playerData.max_hp}</div>
								<div class="player-token-ac">${playerData.ac}</div>
							` : ''
						}
					</div>
					${
						playerData ? `
							<div class="player-info">
								<div class="player-attributes">
									<div class="player-attribute">
										<img src="${window.EXTENSION_PATH + "assets/eye.png"}" title="Passive Perception" />
										<span>${playerData.pp}</span>
									</div>
									${
										playerData.walking ? `
											<div class="player-attribute">
												<img src="${window.EXTENSION_PATH + "assets/walking.png"}" title="Walking Speed" />
												<span>${playerData.walking}</span>
											</div>
											<div class="player-attribute">
												<img src="${window.EXTENSION_PATH}assets/inspiration.svg" title="Inspiration" />
												<span>${playerData.inspiration ? 'Yes' : 'No'}</span>
											</div>
										` : ""
									}
								</div>
								<div class="player-conditions">
									<div class="player-card-title"><b>Conditions:</b></div>
									<div>
										${
											playerData.conditions.map(c => `<span title="${
												CONDITIONS[c] ? [c, ...CONDITIONS[c]].join(`\n`) : [c, ...CONDITIONS.Exhaustion].join(`\n`)
											}">${c}</span>`).join(', ')
										}
									</div>
								</div>
							</div>
						` : `
							<div class="player-no-attributes">
								Character sheet loading, please wait.
							</div>
						`
					}
				</div>
				${
					playerData && playerData.abilities ? `
						<div class="player-see-more">
							<img src="${window.EXTENSION_PATH}assets/arrows_down.png" title="See More" />
						</div>
						<div class="player-card-footer">
							${
								playerData.abilities.map(a => {
									return `
										<div class="ability_value">
											<div class="ability_name">${a.abilityAbbr.toUpperCase()}</div>
											<div class="ability_modifier">${a.modifier}</div>
											<div class="ability_score">${a.score}</div>
										</div>
									`;
								}).join('')
							}
						</div>
					` : ''
				}
			</div>
		`;
		let newplayer=$(newPlayerTemplate);
		if(!window.DM){
			newplayer.find(".add-token-btn,.open-sheet-btn").remove();
			newplayer.find(".player-no-attributes").html("");
		}
		let token = newplayer.find(".player-token");
		token.draggable({
			appendTo: "#VTTWRAPPER",
			zIndex: 100000,
			cursorAt: {top: 0, left: 0},
			helper: function(event) {
				let helper = $(event.currentTarget).find("img").clone();
				let playerId = $(event.currentTarget).closest(".player-card").find(".add-token-btn").attr('data-set-token-id');
				let image = random_image_for_player_token(playerId);
				if (image !== undefined) {
					helper.attr("src", parse_img(image));
				}
				return helper;
			},
			start: function (event, ui) {
				isDraggingPlayerToken = true;
				console.log("row-item drag start");
				let width = window.CURRENT_SCENE_DATA !== undefined ? Math.round(window.CURRENT_SCENE_DATA.hpps) : 100; // the scene hasn't fully loaded, 100 seems like an ok default
				let helperWidth = width / (1.0 / window.ZOOM);
				$(ui.helper).css('width', `${helperWidth}px`);
				$(ui.helper).css('height', `${helperWidth}px`);
				$(this).draggable('instance').offset.click = {
					left: Math.floor(ui.helper.width() / 2),
					top: Math.floor(ui.helper.height() / 2)
				};
			},
			stop: function (event, ui) { 
				// place a token where this was dropped
				console.log("row-item drag stop");
				let src = $(ui.helper).attr("src");
				let playerId = $(event.target).closest(".player-card").find(".add-token-btn").attr('data-set-token-id');
				place_player_token(playerId, event.shiftKey, src, event.pageX, event.pageY);
				isDraggingPlayerToken = false;
				if (pclistUpdateRequired) {
					// update_pclist was called while the user was dragging a player token. 
					// we prevented that call, because jquery draggable breaks if the target is removed while dragging
					// so call it now
					pclistUpdateRequired = false;
					update_pclist();
				}
			}
		});
		playersPanel.body.append(newplayer);
	});

	$(".add-token-btn").on("click", function (event) {
		let playerId = $(event.currentTarget).attr('data-set-token-id');
		place_player_token(playerId, event.button == 2);
	});

	$(".open-sheet-btn").on("click", function () {
		open_player_sheet($(this).attr('data-target'));
	});
	
	$(".whisper-btn").on("click",function(){
		$("#switch_gamelog").click();
		$("#chat-text").val("/whisper ["+$(this).attr('data-to')+ "] ");
		$("#chat-text").focus();
	})

	$(".player-see-more img").on("click", function(e) {
		e.preventDefault();
		const el = $(this).parent().next();
		if (el.hasClass('show')) {
			$(this).removeClass('reverse');
			el.removeClass('show');
		} else {
			$(this).addClass('reverse');
			el.addClass('show');
		}
	});

	// reset scroll position
	$(".sidebar__pane-content").scrollTop(scroll_y);
}

// Low res thumbnails have the form https://www.dndbeyond.com/avatars/thumbnails/17/212/60/60/636377840850178381.jpeg
// Higher res of the same character can be found at  https://www.dndbeyond.com/avatars/17/212/636377840850178381.jpeg
// This is a slightly hacky method of getting the higher resolution image from the url of the thumbnail.
function get_higher_res_url(thumbnailUrl) {
	const thumbnailUrlMatcher = /avatars\/thumbnails\/\d+\/\d+\/\d\d\/\d\d\//;
	if (!thumbnailUrl.match(thumbnailUrlMatcher)) return thumbnailUrl;
	return thumbnailUrl.replace(/\/thumbnails(\/\d+\/\d+\/)\d+\/\d+\//, '$1');
}

function gather_pcs() {
	let campaignId = get_campaign_id();
	if (is_encounters_page() || is_characters_page()) {
		// they aren't on this page, but we've added them to localStorage to handle this scenario
		window.pcs = $.parseJSON(localStorage.getItem(`CampaignCharacters${campaignId}`));
		console.log(`reading "CampaignCharacters-${campaignId}", ${JSON.stringify(window.pcs)}`);
		return;
	}

	window.pcs = [];
	$(".ddb-campaigns-detail-body-listing-active").find(".ddb-campaigns-character-card").each(function(idx) {
		let tmp = $(this).find(".ddb-campaigns-character-card-header-upper-character-info-primary");
		let name = tmp.html();
		tmp = $(this).find(".user-selected-avatar");
		if (tmp.length > 0) {
			const lowResUrl = tmp.css("background-image").slice(5, -2); // url("x") TO -> x
			image = get_higher_res_url(lowResUrl)
		} else {
			image = "/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";
		}
		let sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr("href");
		let pc = {
			name: name,
			image: image,
			sheet: sheet,
			data: {}
		};
		console.log("trovato sheet " + sheet);
		window.pcs.push(pc);
	});
	
	if(!window.DM){
		window.pcs.push({
			name: 'THE DM',
			image: 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png',
			sheet: "", // MessageBroker calls `endsWith` on this so make sure it has something to read
			data: {}
		});
	}
	localStorage.setItem(`CampaignCharacters${campaignId}`, JSON.stringify(window.pcs));
}

function read_player_token_customizations() {
	let customMappingData = localStorage.getItem('PlayerTokenCustomization');
	if (customMappingData !== undefined && customMappingData != null) {
		return $.parseJSON(customMappingData);
	} else {
		return {};
	}
}

function write_player_token_customizations(customMappingData) {
	if (customMappingData !== undefined && customMappingData != null) {
		localStorage.setItem("PlayerTokenCustomization", JSON.stringify(customMappingData));
	}
}

function add_player_image_mapping(playerId, imageUrl) {
	if (playerId === undefined || imageUrl === undefined) {
		return;
	}
	let customMappingData = read_player_token_customizations();
	if (customMappingData[playerId] === undefined) {
		customMappingData[playerId] = { images: [] };
	}
	customMappingData[playerId].images.push(imageUrl);
	write_player_token_customizations(customMappingData);
}

function remove_player_image_mapping(playerId, index) {
	if (playerId === undefined || index === undefined) {
		return;
	}
	let customMappingData = read_player_token_customizations();
	if (customMappingData[playerId] === undefined || customMappingData[playerId].images === undefined) {
		return;
	}

	if (customMappingData[playerId].images.length > index) {
		customMappingData[playerId].images.splice(index, 1);
	}

	write_player_token_customizations(customMappingData);
}

function remove_all_player_image_mappings(playerId) {
	if (playerId === undefined) {
		return;
	}
	let customMappingData = read_player_token_customizations();
	customMappingData[playerId].images = [];
	write_player_token_customizations(customMappingData);
}

function get_player_token_customizations(playerId) {
	read_player_token_customizations();
	let customMappingData = read_player_token_customizations();
	if (customMappingData[playerId] === undefined) {
		return { images: [] };
	}
	return customMappingData[playerId];
}

function get_player_image_mappings(playerId) {
	let customizations = get_player_token_customizations(playerId);
	if (customizations.images !== undefined) {
		return customizations.images;
	}
	return [];
}

function random_image_for_player_token(playerId) {
	let images = get_player_image_mappings(playerId);
	let randomIndex = getRandomInt(0, images.length);
	return images[randomIndex];
}

function get_player_token_border_color(playerId) {
	let index = window.pcs.findIndex(pc => pc.sheet == playerId);
	if (index >= 0 && index < TOKEN_COLORS.length) {
		return TOKEN_COLORS[index];
	}
	return TOKEN_COLORS[0];
}

function register_player_token_customization_context_menu() {
	$.contextMenu({
		selector: '.player-card',
		build: function(element, e) {
			
			let items = {};
			let playerId = element.attr("data-player-id");
			let isTokenOnMap = window.TOKEN_OBJECTS[playerId] !== undefined;
			let pc = window.pcs.find(pc => pc.sheet == playerId);
			let isOwner = pc.sheet.endsWith(window.PLAYER_ID);

			if (isTokenOnMap) {
				items.locate = {
					name: "Locate Placed Token",
					callback: function(itemKey, opt, originalEvent) {
						let playerId = opt.$trigger.attr("data-player-id");
						window.TOKEN_OBJECTS[playerId].highlight();
					}
				};
			} else {

				if (window.DM) {
					items.place = {
						name: "Place Token",
						callback: function(itemKey, opt, originalEvent) {
							let playerId = opt.$trigger.attr("data-player-id");
							place_player_token(playerId, false);
						}
					};
					items.placeHidden = {
						name: "Place Hidden Token",
						callback: function(itemKey, opt, originalEvent) {
							let playerId = opt.$trigger.attr("data-player-id");
							place_player_token(playerId, true);
						}
					};
				}
			}

			items.copy = {
				name: "Copy Url",
				callback: function(itemKey, opt, e) {
					let selectedItem = $(opt.$trigger[0]);
					let imgSrc = selectedItem.find("img").attr("src");
					copy_to_clipboard(imgSrc);
				}
			}
			
			items.border = "---";

			if (window.DM || isOwner) {
				items.customize = {
					name: "Customize",
					callback: function(itemKey, opt, originalEvent) {
						let playerId = opt.$trigger.attr("data-player-id");
						display_player_token_customization_modal(playerId);
					}
				};
			}

			return { items: items };
		}
	});
}

function place_player_token(playerId, hidden, specificImage, eventPageX, eventPageY) {

	if (window.TOKEN_OBJECTS[playerId] !== undefined) {
		window.TOKEN_OBJECTS[playerId].highlight();
		return;
	}

	let pc = window.pcs.find(pc => pc.sheet == playerId);
	let playerData = window.PLAYER_STATS[playerId];
	if (pc === undefined) {
		console.warn(`failed to find pc for id ${playerId}`);
		return;
	}

	let options = {
		id: playerId,
		name: pc.name,
		hidden: hidden,
		tokenSize: 1,
		hp: playerData ? playerData.hp : '',
		ac: playerData ? playerData.ac : '',
		max_hp: playerData ? playerData.max_hp : '',
		square: window.TOKEN_SETTINGS["square"],
		disableborder: window.TOKEN_SETTINGS['disableborder'],
		legacyaspectratio: window.TOKEN_SETTINGS['legacyaspectratio'],
		disablestat: window.TOKEN_SETTINGS['disablestat'],
		color: "#" + get_player_token_border_color(pc.sheet)
	};

	if (specificImage !== undefined) {
		options.imgsrc = parse_img(specificImage);
	} else {
		let image = random_image_for_player_token(playerId);
		if (image === undefined) {
			image = pc.image;
		}
		options.imgsrc = parse_img(image);
	}


	if (eventPageX == undefined || eventPageY == undefined) {
		place_token_in_center_of_map(options);
	} else {
		place_token_under_cursor(options, eventPageX, eventPageY);
	}

}

function display_player_token_customization_modal(playerId, placedToken) {

	// close any that are already open. This shouldn't be necessary, but it doesn't hurt just in case
	close_sidebar_modal();

	if (playerId === undefined) {
		console.warn("display_player_token_customization_modal was called without a playerId");
		return;
	}

	let pc = window.pcs.find(pc => pc.sheet == playerId);
	if (pc === undefined) {
		console.warn(`failed to find pc for id ${playerId}`);
		return;
	}

	// build and display the modal
	let sidebarPanel = new SidebarPanel("player-token-customization-modal");
	display_sidebar_modal(sidebarPanel);

	// configure the header
	let explanationText = "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.";
	if (placedToken !== undefined) {
		// the user is updating a token that has already been placed. Add some explanation text to help them figure out how to use this in case it's their first time here.
		explanationText = "Click an image below to update your token or enter a new image URL at the bottom.";
	}
	sidebarPanel.updateHeader(pc.name, "Token Images", explanationText);

	// configure the body
	const determineLabelText = function() {
		if (placedToken != undefined) {
			return "Enter a new image URL";	
		} else if (get_player_image_mappings(playerId).length == 0) {
			return "Replace The Default Image";
		} else {
			return "Add More Custom Images";
		}
	}
	let removeAllButton = $(`<button class="token-image-modal-remove-all-button" data-player-id="${playerId}" title="Reset this player back to the default image.">Remove All Custom Images</button><`);
	removeAllButton.click(function(event) {
		if (window.confirm(`Are you sure you want to remove all custom images for ${pc.name}?\nThis will reset the player images back to the default`)) {
			remove_all_player_image_mappings(playerId);
			display_player_token_customization_modal(playerId, placedToken);
			$(".token-image-modal-footer-title").text(determineLabelText());
		}
	})
	
	let customizations = get_player_token_customizations(playerId);
	if (customizations.images.length > 0) {
		for (let i = 0; i < customizations.images.length; i++) { 
			let imageUrl = parse_img(customizations.images[i]);
			let tokenDiv = build_player_customization_item(playerId, pc.name, imageUrl, i, placedToken);
			sidebarPanel.body.append(tokenDiv);
		}
		removeAllButton.show();
	} else {
		let tokenDiv = build_player_customization_item(playerId, pc.name, pc.image, -1, placedToken);
		sidebarPanel.body.append(tokenDiv);
		removeAllButton.hide();
	}
	// shove the remove all button between the body and the footer
	sidebarPanel.body.after(removeAllButton);

	// configure the footer
	const add_token_customization_image = function(imageUrl) {
		if(imageUrl.startsWith("data:")){
			alert("You cannot use urls starting with data:");
			return;
		}
		if (get_player_image_mappings(playerId).length == 0) {
			// this is the first custom image so remove the default image before appending the new one, and show the remove all button
			sidebarPanel.body.empty();
			removeAllButton.show();
		}
		add_player_image_mapping(playerId, imageUrl);
		let updatedImages = get_player_image_mappings(playerId);
		let imgIndex = updatedImages.indexOf(imageUrl);
		let tokenDiv = build_player_customization_item(playerId, pc.name, imageUrl, imgIndex, placedToken);
		sidebarPanel.body.append(tokenDiv);	
		$(".token-image-modal-footer-title").text(determineLabelText())
	};
	let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), add_token_customization_image);
	imageUrlInput.find(`input[name='addCustomImage']`).attr("data-player-id", playerId);
	imageUrlInput.find(`.token-image-modal-add-button`).attr("data-player-id", playerId);
	sidebarPanel.inputWrapper.append(imageUrlInput);

	// handle placedToken modal
	if (placedToken) {
		sidebarPanel.footer.find(`.token-image-modal-add-button`).remove();
		// allow them to use the new url for the placed token without saving the url for all future player tokens
		let onlyForThisTokenButton = $(`<button class="sidebar-panel-footer-button" data-player-id="${playerId}" title="This url will be used for this token only, it will not be saved for future use.">Set for this token only</button>`);
		onlyForThisTokenButton.click(function(event) {
			let imageUrl = sidebarPanel.inputWrapper.find(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				placedToken.options.imgsrc = parse_img(imageUrl);
				close_sidebar_modal();
				placedToken.place_sync_persist();
			}
		});
		let addForAllButton = $(`<button class="sidebar-panel-footer-button" data-player-id="${playerId}" title="New tokens will use this new image instead of the default image. If you have more than one custom image, one will be chosen at random when you place this player token.">Add for all future tokens</button>`);
		addForAllButton.click(function(event) {
			let imageUrl = sidebarPanel.inputWrapper.find(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				add_token_customization_image(imageUrl);
			}
		});

		// add these after the footer after the inputWrapper
		sidebarPanel.inputWrapper.append(onlyForThisTokenButton);
		sidebarPanel.inputWrapper.append(addForAllButton);
		sidebarPanel.inputWrapper.append($(`<div class="sidebar-panel-header-explanation" style="padding:4px;">You can access this modal from the Player tab by right-clicking the player image and selecting "Customize".</div>`));		
	}

}

function build_player_customization_item(playerId, playerName, imageUrl, customImgIndex, placedToken) {
	let tokenDiv = build_custom_token_item(playerName, imageUrl, undefined, customImgIndex, placedToken);
	tokenDiv.attr("data-player-id", playerId);
	tokenDiv.addClass("player-image-item");
	return tokenDiv;
}
