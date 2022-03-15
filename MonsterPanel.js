let monster_panel_init_started = false;

function init_monster_panel() {
	if (!window.DM) {
		return;
	}
	if (monster_panel_init_started) {
		return;
	}
	monster_panel_init_started = true;
	// cover the panel while we fetch, and alter it
	window.EncounterHandler.fetch_or_create_avtt_encounter(function(encounter) {
		init_monster_panel_with_encounter();
	});
}

function init_monster_panel_with_encounter() {

	if ($("#iframe-monster-panel").length > 0) {
		// we already did this
		return;
	}	
	let iframe = $("<iframe id='iframe-monster-panel'></iframe>");
	monstersPanel.body.append(iframe);
	// cover the panel while we fetch, and alter it
	monstersPanel.display_sidebar_loading_indicator("Making a Wisdom (Perception) check to find monsters...");
	iframe.css({ "width": "100%", "border": "none" });
	$("#iframe-monster-panel").height(window.innerHeight - 50);

	$(window).resize(function() {
		$("#iframe-monster-panel").height(window.innerHeight - 50);
	});

	iframe.on("load", function(event) {

		if (!this.src) {
			// it was just created. no need to do anything until it actually loads something
			return;
		}

		if (this.src.endsWith("/encounter-builder")) {
			setTimeout(function() {
				$(event.target).contents().find(".add-monster-modal__footer").hide();
				$(event.target).contents().find("div.encounter-builder").removeClass("sidebar-open");	
				$(event.target).contents().find(".ddb-page-header").hide();
				$(event.target).contents().find(".beholder-dm-screen").css({"overflow": "overlay", "margin-top": "100px"});
				$(event.target).contents().find("body").css("zoom", "0.8");
				$(event.target).contents().find(".encounter-builder__header").hide();
				$(event.target).contents().find(".release-indicator").hide();
				$(event.target).contents().find(".header-wrapper").hide();
				$(event.target).contents().find("footer").hide();
				$(event.target).contents().find(".encounter-builder-sidebar__open-button").hide();
				$(event.target).contents().find(".dice-die-button .dice-icon-die--d100").css("width", "101%");
				$(event.target).contents().find(".dice_result__info .dice-icon-die--d100").css({ "width": "50%", "min-width": "50%" });
				$(event.target).contents().find(".dice-toolbar").hide()
				$(event.target).contents().find(".encounter-builder__tabs ul.ddb-tabs__tabs").hide()

				monster_panel_did_load();
			}, 2000);
		}

		$(event.target).contents().find("body").on("DOMNodeInserted", function(addedEvent) {

			// once the encounter builder is loaded, we can start stripping away all the elements we don't want our users to see
			let encounterBuilder = $(event.target).contents().find("#encounter-builder-root div.encounter-builder");
			let addedElement = $(addedEvent.target);

			// console.log(addedEvent.target.outerHTML);

			if (encounterBuilder.length > 0) {
				if (addedElement.hasClass("noty_layout")) {
					setTimeout(function() {
						addedElement.find(".dice_notification_control i").css("padding", "0px");
					}, 0);
				}
				if (addedElement.hasClass("monster-row")) {
					setTimeout(function() {
						// after the initial load, these elements are either replaced, or messed with in a way that we need to find the new one
						let elementId = addedElement[0].id;
						let replacedRow = $(event.target).contents().find(`#${elementId}`);
						update_monster_row(replacedRow);
					}, 0);
				} else if (addedElement.closest(".monster-row").length == 0) { // completely ignore anything that's added to a monster-row. Those happen a lot
					$(addedElement).find(".add-monster-modal__footer").hide();
					$(event.target).contents().find("div.encounter-builder").removeClass("sidebar-open");	
					$(event.target).contents().find(".ddb-page-header").hide();
					$(event.target).contents().find(".beholder-dm-screen").css({"overflow": "overlay", "margin-top": "100px"});
					$(event.target).contents().find("body").css("zoom", "0.8");
					$(event.target).contents().find(".encounter-builder__header").hide();
					$(event.target).contents().find(".release-indicator").hide();
					$(event.target).contents().find(".header-wrapper").hide();
					$(event.target).contents().find("footer").hide();
					$(event.target).contents().find(".encounter-builder-sidebar__open-button").hide();
					$(event.target).contents().find(".dice-die-button .dice-icon-die--d100").css("width", "101%");
					$(event.target).contents().find(".dice_result__info .dice-icon-die--d100").css({ "width": "50%", "min-width": "50%" });
					$(event.target).contents().find(".dice-toolbar").hide();
					$(event.target).contents().find(".encounter-builder__tabs ul.ddb-tabs__tabs").hide()
				}
			}
		});
	});


	if (window.EXPERIMENTAL_SETTINGS["useDdbDice"] == true && window.EXPERIMENTAL_SETTINGS["disableDdbDiceMonsterPanel"] != true) {
		if (window.EncounterHandler.has_avtt_encounter() && window.EncounterHandler.encounterBuilderDiceSupported) {
			iframe.attr("src", `/combat-tracker/${window.EncounterHandler.avttId}`);
		} else {
			iframe.attr("src", `/encounter-builder`);
		}
	} else {
		iframe.attr("src", `/encounter-builder`);
	}

	console.log("starting monster_panel_init_loop");
	monster_panel_init_loop();
}

// keep trying until the damn thing loads
let numberOfTimesFindingMonsterRows = 0;
function monster_panel_init_loop() {
	let iframe = $("#iframe-monster-panel");
	if (iframe.length == 0) {
		// nothing to do
		console.log("monster_panel_init_loop nothing to do");
		return;
	}
	let iframeBody = $(iframe[0].contentDocument.body);

	let monsterRows = iframeBody.find(".encounter-builder__monster-listing .monster-listing__main .monster-listing__monsters .monster-row");
	if (monsterRows.length > 0) {
		numberOfTimesFindingMonsterRows += 1;
	} else {
		numberOfTimesFindingMonsterRows = 0;
	}
	console.log(`monster_panel_init_loop numberOfTimesFindingMonsterRows: ${numberOfTimesFindingMonsterRows}`);
	if (numberOfTimesFindingMonsterRows > 2) {
		console.log("monster_panel_init_loop we have monster rows!");
		monster_panel_did_load();
		console.log("monster_panel_init_loop all done!!!");
		// we can end our loop now
		return;
	} else {
		console.log("monster_panel_init_loop looking for the edit link");
		// try to open the thing with the edit link
		let editLink = iframeBody.find(`a[href='/encounters/${window.EncounterHandler.avttId}/edit']`);
		if (editLink.length > 0) {
			// DDB has injected the link. Let's click it and keep trying until that screen finishes loading
			editLink[0].click();
			console.log("monster_panel_init_loop clicked the edit link");
		} else {
			// need to click the button to have DDB inject the edit link.
			let expandButton = iframeBody.find(".ddb-page-header__controls .encounter-details__actions > button");
			if (expandButton.length > 0) {
				expandButton.click();
				console.log("monster_panel_init_loop clicked the button to get the edit link injected");
			} else {
				console.log("monster_panel_init_loop the button to get the edit link is not on the screen");
			}
		}
		console.log("monster_panel_init_loop retrying in 1 second");
	
		// the edit screen hasn't fully loaded yet. Try again in 1 second
		setTimeout(function() {
			monster_panel_init_loop()
		}, 1000);
	}
}

function monster_panel_did_load() {
	setTimeout(function() {
		let iframe = $("#iframe-monster-panel");
		if (iframe.length == 0) {
			// nothing to do
			console.log("monster_panel_did_load nothing to do");
			return;
		}
		let iframeBody = $(iframe[0].contentDocument.body);
		let monsterRows = iframeBody.find(".encounter-builder__monster-listing .monster-listing__main .monster-listing__monsters .monster-row");
		monstersPanel.remove_sidebar_loading_indicator();
		for (let i = 0; i < monsterRows.length; i++) {
			let row = $(monsterRows[i]);
			update_monster_row(row);
		}

		iframeBody.find(".add-monster-modal__footer").hide();
		iframeBody.find("div.encounter-builder").removeClass("sidebar-open");	
		iframeBody.find(".ddb-page-header").hide();
		iframeBody.find(".beholder-dm-screen").css({"overflow": "overlay", "margin-top": "100px"});
		iframeBody.find("body").css("zoom", "0.8");
		iframeBody.find(".encounter-builder__header").hide();
		iframeBody.find(".release-indicator").hide();
		iframeBody.find(".header-wrapper").hide();
		iframeBody.find("footer").hide();
		iframeBody.find(".encounter-builder-sidebar__open-button").hide();
		iframeBody.find(".dice-die-button .dice-icon-die--d100").css("width", "101%");
		iframeBody.find(".dice_result__info .dice-icon-die--d100").css({ "width": "50%", "min-width": "50%" });
		iframeBody.find(".dice-toolbar").hide();


	}, 2000);
}

// any time the monsters tab updates via init or search, it injects each element one at a time. 
// This updates them to look/feel how we want them to.
function update_monster_row(monsterRow) {
	if (monsterRow.length == 0 || monsterRow.find(".monster-row__config-handle").length > 0) {
		// all ready set this up once, no need to do it again. This shouldn't happen, but just in case they give us a cached element
		return;
	}

	let elementId = monsterRow[0].id;
	let monsterId = elementId.replace("monster-row-", "");
	let monsterName = monsterRow.find(".monster-row__name").text();
	let avatar = monsterRow.find(".monster-row__cell--avatar");
	avatar.attr('data-monster', monsterId);
	avatar.attr('data-name', monsterName);
	make_element_draggable_token(avatar, true);
	avatar.click(function(event) {
		event.stopPropagation();
		event.preventDefault();
	});

	if (window.EXPERIMENTAL_SETTINGS["useDdbDice"] != true || window.EXPERIMENTAL_SETTINGS["disableDdbDiceMonsterPanel"] == true || !window.EncounterHandler.has_avtt_encounter() || !window.EncounterHandler.encounterBuilderDiceSupported) {
		// if we don't have a backing encounter or if the DM isn't a DDB subscriber, we need to inject roll buttons
		// replace all the DDB roll buttons with AVTT roll buttons
		monsterRow.click(function(event) {
			window.StatHandler.getStat(monsterId, function(stat) {
				setTimeout(function() {
					scan_monster($("#iframe-monster-panel").contents().find(".ddbeb-modal"), stat);
				}, 1000);
			});
		});
	}



	// swap the encounter drag element for configuration element of our own
	let dragHandle = monsterRow.find('.monster-row__cell--drag-handle');
	let configHandle = $(`
		<div class="monster-row__config-handle">
			<img src="${window.EXTENSION_PATH}assets/icons/cog.svg" style="width:100%;height:100%;" />
		</div>
	`);
	configHandle.css({
		"flex-basis": "46px",
		"flex-grow": "0",
		"align-self": "stretch",
		"border-left": "1px solid #d8e1e8",
		"margin": "-8px -8px -8px 8px",
		"padding": "8px",
		"background-color": "#f2f6f8",
		"cursor": "pointer",
		"border-top-right-radius": "3px",
		"border-bottom-right-radius": "3px"
	});
	configHandle.click(function(event) {
		event.preventDefault();
		event.stopPropagation();
		let monsterRow = event.target.closest(".monster-row");
		let monsterId = monsterRow.id.replace("monster-row-", "");
		let monsterName = $(monsterRow).find(".monster-row__name").text();
		let defaultImg = parse_img($(monsterRow).find(".monster-row__cell--avatar img").attr("src"));
		display_monster_customization_modal(undefined, monsterId, monsterName, defaultImg);
	});
	dragHandle.after(configHandle);
	dragHandle.remove();

	// replace the default behavior for the add button to add tokens to our scene instead of the encounter
	let addButton = monsterRow.find(".monster-row__cell--add-button");
	addButton.on("mousedown", function(event) {
		event.preventDefault();
		event.stopPropagation();
		let token = $(event.target).clone();
		let isRightClick = event.button == 2;
		let hidden = isRightClick || window.TOKEN_SETTINGS["hidden"];
		let monsterRow = event.target.closest(".monster-row");
		let imgSrc = parse_img($(monsterRow).find(".monster-row__cell--avatar img").attr("src"));
		let randomImage = get_random_custom_monster_image(monsterId);
		if (randomImage !== undefined && randomImage.length > 0) {
			imgSrc = parse_img(randomImage);
		}		
		place_monster_at_point(token, monsterId, monsterName, imgSrc, undefined, hidden);
	});
	monsterRow.on("contextmenu", ".monster-row__cell--add-button", function(event) {
		event.preventDefault();
		event.stopPropagation();
		
	});
}

function register_custom_monster_image_context_menu() {
	$.contextMenu({
		selector: ".custom-token-image-item",
		items: {
			place: {
				name: "Place Token",
				callback: function(itemKey, opt, originalEvent) {
					let selectedItem = $(opt.$trigger[0]);
					place_custom_token_at_point(selectedItem, false);
				}
			},
			placeHidden: {
				name: "Place Hidden Token",
				callback: function(itemKey, opt, originalEvent) {
					let selectedItem = $(opt.$trigger[0]);
					place_custom_token_at_point(selectedItem, true);
				}
			},
			copy: {
				name: "Copy Url",
				callback: function(itemKey, opt, e) {
					let selectedItem = $(opt.$trigger[0]);
					let imgSrc = selectedItem.find("img").attr("src");
					copy_to_clipboard(imgSrc);
				}
			},
			border: "---",
			remove: { 
				name: "Remove",
				callback: function(itemKey, opt, originalEvent) {
					let selectedItem = $(opt.$trigger[0]);
					let imgIndex = parseInt(selectedItem.attr("data-custom-img-index"));
					if (imgIndex < 0) {
						alert("This token is only set on the current token. Click a different image to change the token image.");
						return;
					}
					if (window.confirm("Are you sure you want to remove this custom image?")) {
						let monsterId = selectedItem.attr("data-monster");
						let playerId = selectedItem.attr("data-player-id");
						let name = selectedItem.attr("data-name");
						if (monsterId != undefined) {
							// removing from the monsters pane
							remove_custom_monster_image(monsterId, imgIndex);
							selectedItem.remove();
							if (get_custom_monster_images(monsterId).length == 0) {
								// the user removed the last custom image. redraw the modal so the default image shows up
								display_monster_customization_modal();
							}
						} else if (playerId !== undefined) {
							// removing from the players pane
							remove_player_image_mapping(playerId, imgIndex);
							selectedItem.remove();
							display_player_token_customization_modal(playerId);
						} else if (name != undefined) {
							// removing from the tokens pane
							let tokenDataPath = selectedItem.attr("data-tokendatapath");
							let tokenDataName = selectedItem.attr("data-tokendataname"); // name can be changed. tokendataname is the key used to store the token data
							if (tokenDataName == undefined) {
								tokenDataName = name; // tokens placed before this feature went live won't have this data so try to find it using the name. Hopefully the user didn't rename the token.
							}
							remove_image_from_token_data(tokenDataPath, tokenDataName, imgIndex);
							selectedItem.remove();
							display_custom_token_form(tokenDataPath, tokenDataName);
							if (imgIndex == 0) {
								// the user removed the first image. redraw the underlying menu so that the row has the most recent image drawn
								fill_tokenmenu(window.CURRENT_TOKEN_PATH);
							}
						} else {
							console.warn("Failed to remove token. couldn't find a data-monster or data-name on the element");
						}
					}
				}
			}
		}
	});
}

function display_monster_customization_modal(placedToken, monsterId, monsterName, defaultImg) {

	// close any that are already open. This shouldn't be necessary, but it doesn't hurt just in case
	close_sidebar_modal();
	
	if (monsterId == undefined || monsterName == undefined || defaultImg == undefined) {
		console.warn(`Failed to display monster customization modal; monsterId = ${monsterId}, monsterName = ${monsterName}, defaultImg = ${defaultImg}`)
		return
	}

	let sidebarPanel = new SidebarPanel("monster-token-customization-modal");
	display_sidebar_modal(sidebarPanel);

	let customImages = get_custom_monster_images(monsterId);

	// build the modal header
	let explanationText = "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.";
	if (placedToken !== undefined) {
		// the user is updating a token that has already been placed. Add some explanation text to help them figure out how to use this in case it's their first time here.
		explanationText = "Click an image below to update your token or enter a new image URL at the bottom.";
	}
	sidebarPanel.updateHeader(monsterName, "Token Images", explanationText)

	const determineLabelText = function() {
		if (placedToken != undefined) {
			return "Enter a new image URL";	
		} else if (get_custom_monster_images(monsterId).length == 0) {
			return "Replace The Default Image";
		} else {
			return "Add More Custom Images";
		}
	}

	// configure the footer first so we can grab the input label. We'll be updating that based on interactions in the body
	const add_token_customization_image = function(imageUrl) {
		if(imageUrl.startsWith("data:")){
			alert("You cannot use urls starting with data:");
			return;
		}
		if (get_custom_monster_images(monsterId).length == 0) {
			// this is the first custom image so remove the default image before appending the new one, and show the remove all button
			modalBody.empty();
			removeAllButton.show();
		}
		add_custom_monster_image_mapping(monsterId, imageUrl);
		let updatedImages = get_custom_monster_images(monsterId);
		let imgIndex = updatedImages.indexOf(imageUrl);
		let tokenDiv = build_monster_customization_item(monsterId, monsterName, imageUrl, imgIndex, placedToken);
		modalBody.append(tokenDiv);	
		footerLabel.text(determineLabelText())
	};
	let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), add_token_customization_image);
	imageUrlInput.find(`input[name='addCustomImage']`).attr("data-monster-id", monsterId);
	imageUrlInput.find(`.token-image-modal-add-button`).attr("data-monster-id", monsterId);
	sidebarPanel.inputWrapper.append(imageUrlInput);
	let footerLabel = imageUrlInput.find("div.token-image-modal-footer-title");

	// configure the modal body
	let modalBody = sidebarPanel.body;

	// add a "remove all" button between the body and the footer
	let removeAllButton = $(`<button class="token-image-modal-remove-all-button" data-monster-id="${monsterId}" title="Reset this monster back to the default image.">Remove All Custom Images</button><`);
	modalBody.after(removeAllButton);
	removeAllButton.click(function(event) {
		let monsterId = $(event.target).attr("data-monster-id");
		if (window.confirm(`Are you sure you want to remove all custom images for ${monsterName}?\nThis will reset the monster images back to the default`)) {
			remove_all_custom_monster_images(monsterId);
			display_monster_customization_modal(placedToken);
			footerLabel.text(determineLabelText());
		}
	})

	// add a token image for every custom image
	if (customImages != undefined && customImages.length > 0) {
		for (let i = 0; i < customImages.length; i++) { 
			let imageUrl = parse_img(customImages[i]);
			let tokenDiv = build_monster_customization_item(monsterId, monsterName, imageUrl, i, placedToken);
			modalBody.append(tokenDiv);
		}
		removeAllButton.show();
	} else {
		let tokenDiv = build_monster_customization_item(monsterId, monsterName, defaultImg, -1, placedToken);
		modalBody.append(tokenDiv);
		removeAllButton.hide();
	}

	if (placedToken) {
		let inputWrapper = sidebarPanel.inputWrapper;
		sidebarPanel.footer.find(`.token-image-modal-add-button`).remove();
		// allow them to use the new url for the placed token without saving the url for all future monsters
		let onlyForThisTokenButton = $(`<button class="sidebar-panel-footer-button" data-monster-id="${monsterId}" title="This url will be used for this token only. New tokens will continue to use the images shown above.">Set for this token only</button>`);
		onlyForThisTokenButton.click(function(event) {
			let imageUrl = $(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				placedToken.options.imgsrc = parse_img(imageUrl);
				close_sidebar_modal();
				placedToken.place_sync_persist();
			}
		});
		inputWrapper.append(onlyForThisTokenButton);	
		let addForAllButton = $(`<button class="sidebar-panel-footer-button" data-monster-id="${monsterId}" title="New tokens will use this new image instead of the default image. If you have more than one custom image, one will be chosen at random when you place a new token.">Add for all future tokens</button>`);
		addForAllButton.click(function(event) {
			let imageUrl = $(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				add_token_customization_image(imageUrl);
			}
		});
		inputWrapper.append(addForAllButton);
		inputWrapper.append($(`<div class="sidebar-panel-header-explanation" style="padding:4px;">You can access this modal from the Monsters tab by clicking the button on the right side of the monster row.</div>`));
	}
}


function build_monster_customization_item(monsterId, monsterName, imageUrl, customImgIndex, placedToken) {
	let tokenDiv = build_custom_token_item(monsterName, imageUrl, undefined, customImgIndex, placedToken);
	tokenDiv.attr("data-monster", monsterId);
	tokenDiv.addClass("monster-image-item");
	return tokenDiv;
}

function build_custom_token_item(name, imageUrl, tokenSize, customImgIndex, placedToken) {
	if (tokenSize === undefined) {
		tokenSize = 1;
	}	

	let tokenDiv = $(`
		<div class="custom-token-image-item" data-name="${name}" data-custom-img-index="${customImgIndex}" data-token-size="${tokenSize}">
			<div class="token-image-sizing-dummy"></div>
			<img alt="token-img" class="token-image token-round" src="${imageUrl}" />
		</div>
	`);
	if (placedToken !== undefined) {
		// the user is changing their token image, allow them to simply click an image
		// we don't want to allow drag and drop from this modal
		tokenDiv.click(function() {
			placedToken.options.imgsrc = parse_img(imageUrl);
			close_sidebar_modal();
			placedToken.place_sync_persist();
		});
	}
	return make_element_draggable_token(tokenDiv);
}

function make_element_draggable_token(element, randomImage = false) {
	// most of the time this is used from token customization modals which the user is dragging a specific image.
	// the monsters tab also uses this, and needs a randomImage to be used at the time of drag.
	// if you want a random image to be draw at the time of drag, pass true. 
	// If you're using this for more than just monsters, you will need to update the helper function.
	element.draggable({
		helper: "clone",
		appendTo: "#VTTWRAPPER",
		zIndex: 100000,
		cancel: '.monster-row__config-handle,.monster-row__cell--add-button',
		cursorAt: {top: 0, left: 0},
		helper: function(event) {
			let clonedImage = $(event.currentTarget).find("img").clone();
			if (randomImage) {
				let monsterId = $(event.currentTarget).attr("data-monster");
				let randomImage = get_random_custom_monster_image(monsterId);
				if (randomImage !== undefined && randomImage.length > 0) {
					clonedImage.attr("src", parse_img(randomImage));
				}
			}
			return clonedImage[0];
		},
		start: function (event, ui) {
			let tokenSize = $(event.currentTarget).attr("data-token-size");
			let monsterId = $(event.target).attr("data-monster");

			const updateHelperSize = function() {
				if (tokenSize == undefined) {
					tokenSize = 1;
				}
				let width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
				let helperWidth = width / (1.0 / window.ZOOM);
				$(ui.helper).css('width', `${helperWidth}px`);
				$(this).draggable('instance').offset.click = {
					left: Math.floor(ui.helper.width() / 2),
					top: Math.floor(ui.helper.height() / 2)
				};	
			};

			if (monsterId != undefined) {
				// we have a monster, fetch the tokenSize from DDB, and then update the element that is being dragged around
				// this can't be done ahead of time because the rows are built synchronously, and this call is asynchronous
				window.StatHandler.getStat(monsterId, function(stat) {
					if (stat.data.sizeId == 5) {
						tokenSize = 2;
					} else if (stat.data.sizeId == 6) {
						tokenSize = 3;
					} else if (stat.data.sizeId == 7) {
						tokenSize = 4;
					}
					updateHelperSize();
				});
			} else {
				updateHelperSize();
			}
		},
		drag: function (event, ui) {
			if (event.shiftKey) {
				$(ui.helper).css("opacity", 0.5);
			} else {
				$(ui.helper).css("opacity", 1);
			}
		},
		stop: function (event, ui) { 
			// place a token where this was dropped
			let token = $(event.target).clone();
			let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
			let helperImage = ui.helper[0].src;
			if (randomImage && helperImage !== undefined && helperImage.length > 0) {
				token.attr("data-img", helperImage)
			}
			place_custom_token_at_point(token, hidden, event.pageX, event.pageY);
		}
	});

	return element;
}

function place_custom_token_at_point(htmlElement, hidden, eventPageX, eventPageY) {

	let monsterId = htmlElement.attr("data-monster");
	let playerId = htmlElement.attr("data-player-id");
	let name = htmlElement.attr("data-name");
	let tokenSize = htmlElement.attr("data-token-size");
	let imgSrc = htmlElement.attr("data-img");
	if (imgSrc === undefined || imgSrc.length == 0) {
		imgSrc = htmlElement.find("img").attr("src");
	}
	if (monsterId !== undefined) {
		// placing from the monster pane
		place_monster_at_point(htmlElement, monsterId, name, imgSrc, tokenSize, hidden, eventPageX, eventPageY);
	} else if (playerId !== undefined) {
		// placing from the players pane
		place_player_token(playerId, hidden, imgSrc, eventPageX, eventPageY);
	} else if (name !== undefined) {
		// placing from the tokens pane
		let tokenDataPath = htmlElement.attr("data-tokendatapath");
		let tokenDataName = htmlElement.attr("data-tokendataname"); // name can be changed. tokendataname is the key used to store the token data
		if (tokenDataName === undefined) {
			tokenDataName = name; // tokens placed before this feature went live won't have this data so try to find it using the name. Hopefully the user didn't rename the token.
		}
		place_token_from_modal(tokenDataPath, tokenDataName, hidden, imgSrc, eventPageX, eventPageY);
	} else {
		console.warn("Failed to place token. couldn't find a data-monster or data-name on the element");
	}
}

function place_monster_at_point(htmlElement, monsterId, name, imgSrc, tokenSize, hidden, eventPageX, eventPageY) {
	let options = Object.assign({}, $(htmlElement).data());
	delete options.size; // we're going to replace whatever might be there with tokenSize
	// remove other html garbage
 	delete options.draggable;
	delete options.contextMenu;
	options = Object.assign(options, {
		name: name,
		imgsrc: imgSrc,
		tokenSize: tokenSize,
		hidden: hidden,
		monster: monsterId
	});

	if (monsterId !== undefined) {
		var count = 1;
		for (var tokenId in window.TOKEN_OBJECTS) {
			if (window.TOKEN_OBJECTS[tokenId].options.monster == monsterId) {
				count++;
			}
		}
		if (count > 1) {
			let color = TOKEN_COLORS[(count - 1) % 54];
			console.log(`updating monster name with count: ${count}, and setting color: ${color}`);
			options.name = `${name} ${count}`;
			options.color = `#${color}`;
		}
	
		options.stat = monsterId
		window.StatHandler.getStat(monsterId, function(stat) {
			options.sizeId = stat.data.sizeId;
			options.hp = stat.data.averageHitPoints;
			options.max_hp = stat.data.averageHitPoints;
			options.ac = stat.data.armorClass;
			if (eventPageX == undefined || eventPageY == undefined) {
				place_token_in_center_of_map(options);
			} else {
				place_token_under_cursor(options, eventPageX, eventPageY);
			}
		});
	} else {
		if (eventPageX == undefined || eventPageY == undefined) {
			place_token_in_center_of_map(options);
		} else {
			place_token_under_cursor(options, eventPageX, eventPageY);
		}
	}
}
