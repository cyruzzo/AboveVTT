function init_monster_panel() {
	panel = $("<div id='monster-panel' class='sidepanel-content'></div>");


	iframe = $("<iframe id='iframe-monster-panel'></iframe>");


	iframe.on("load", function(event) {
		$(event.target).contents().find("body").css("zoom", "0.8");
		console.log('sistemo panello mostro');

		$(event.target).contents().find(".encounter-builder__header").hide();
		$(event.target).contents().find(".release-indicator").hide();
		$(event.target).contents().find("#site-main").css("padding", "0");
		$(event.target).contents().find("header").hide();
		$(event.target).contents().find(".main-filter-container").hide();
		$(event.target).contents().find("#mega-menu-target").remove();
		$(event.target).contents().find(".site-bar").remove();
		$(event.target).contents().find(".page-header").remove();
		$(event.target).contents().find(".homebrew-comments").remove();
		$(event.target).contents().find("footer").remove();
		$(event.target).contents().find(".encounter-builder__sidebar").remove();
		$(event.target).contents().find(".dice-rolling-panel").remove();

		var list = $(event.target).contents().find(".monster-listing__body");
		
		// limit the width of monster entries
		list.css("max-width", "400px");
	
		// prevent right click menu on the monster image so we can use our own custom menu
		list.on("contextmenu", ".monster-row__cell--avatar", function(e) {
			e.preventDefault();
		});
		// find the monster row, grab the monster details, then open the token customization modal
		const open_token_customization_modal_from_monster_row = function(event) {
			event.preventDefault();
			event.stopPropagation();
			let monsterRow = event.target.closest(".monster-row");
			let monsterId = monsterRow.id.replace("monster-row-", "");
			let monsterName = $(monsterRow).find(".monster-row__name").text();
			let defaultImg = parse_img($(monsterRow).find(".monster-row__cell--avatar img").attr("src"));
			display_monster_customization_modal(undefined, monsterId, monsterName, defaultImg);
		};
		// clicking the menu looking button opens our token customization modal
		list.on("click", ".monster-row__cell--drag-handle", function(event) {
			open_token_customization_modal_from_monster_row(event);
		});
		// right clicking the monster image used to open a contextMenu. our token customization modal to preserve that functionality
		list.on("mouseup", ".monster-row__cell--avatar", function(event) {
			open_token_customization_modal_from_monster_row(event);
		});
		register_custom_monster_image_context_menu();

		list.on("contextmenu", "button.monster-row__add-button", function(e) {
			e.preventDefault();
		});

		list.on("mousedown", "button.monster-row__add-button", function(e) {


			e.stopPropagation();
			e.target = this; // hack per passarlo a token_button
			let button = $(this);
			console.log(button.outerHTML());

			img = button.parent().parent().find("img");

			if (img.length > 0) {
				url = img.attr('src');
			}
			else {
				url = "";
			}

			mname = button.parent().parent().find(".monster-row__name").html();
			button.attr("data-name", mname);
			var monsterid = $(this).parent().parent().parent().attr('id').replace("monster-row-", "");

			button.attr('data-img', url);
			button.attr('data-stat', monsterid);

			if (e.button == 2) {
				button.attr('data-hidden', 1)
			}
			else
				button.removeAttr('data-hidden');


			window.StatHandler.getStat(monsterid, function(stat) {
				if (stat.data.sizeId == 5)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 2);
				if (stat.data.sizeId == 6)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 3);
				if (stat.data.sizeId == 7)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 4);
				button.attr('data-hp', stat.data.averageHitPoints);
				button.attr('data-maxhp', stat.data.averageHitPoints);
				button.attr('data-ac', stat.data.armorClass);
				token_button(e);
			});




		});

		list.on("click", ".monster-row", function() { // BAD HACKZZZZZZZZZZZZZ
			var monsterid = $(this).attr("id").replace("monster-row-", "");
			window.StatHandler.getStat(monsterid, function(stat) {
				setTimeout(function() {
					scan_monster($("#iframe-monster-panel").contents().find(".ddbeb-modal"), stat);
					$("#iframe-monster-panel").contents().find(".add-monster-modal__footer").remove();
				}, 1000);

			});



		});
	});
	panel.append(iframe);
	$(".sidebar__pane-content").append(panel);
	iframe.css("width", "100%");

	$("#iframe-monster-panel").height(window.innerHeight - 50);

	$(window).resize(function() {
		$("#iframe-monster-panel").height(window.innerHeight - 50);
	});
	iframe.attr("src", "/encounter-builder");
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
					if (window.confirm("Are you sure you want to remove this custom image?")) {
						let selectedItem = $(opt.$trigger[0]);
						let imgIndex = parseInt(selectedItem.attr("data-custom-img-index"));
						let monsterId = selectedItem.attr("data-monster");
						let name = selectedItem.attr("data-name");
						if (monsterId != undefined) {
							// removing from the monsters pane
							remove_custom_monster_image(monsterId, imgIndex);
							selectedItem.remove();
							if (get_custom_monster_images(monsterId).length == 0) {
								// the user removed the last custom image. redraw the modal so the default image shows up
								display_monster_customization_modal();
							}
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

function token_customization_modal_is_open() {
	return $("#VTTWRAPPER .token-image-modal").length > 0;
}

function close_token_customization_modal() {
	$("#VTTWRAPPER .token-image-modal").remove();
}


function display_monster_customization_modal(placedToken, monsterId, monsterName, defaultImg) {

	// close any that are already open. This shouldn't be necessary, but it doesn't hurt just in case
	close_token_customization_modal();
	
	if (monsterId == undefined || monsterName == undefined || defaultImg == undefined) {
		console.warn(`Failed to display monster customization modal; monsterId = ${monsterId}, monsterName = ${monsterName}, defaultImg = ${defaultImg}`)
		return
	}

	let customImages = get_custom_monster_images(monsterId);

	// build the modal header
	let explanationText = "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.";
	if (placedToken != undefined) {
		// the user is updating a token that has already been placed. Add some explanation text to help them figure out how to use this in case it's their first time here.
		explanationText = "Click an image below to update your token or enter a new image URL at the bottom.";
	}
	let modalHeader = build_token_modal_header(monsterName, explanationText);

	const determineLabelText = function() {
		if (placedToken != undefined) {
			return "Enter a new image URL";	
		} else if (get_custom_monster_images(monsterId).length == 0) {
			return "Replace The Default Image";
		} else {
			return "Add More Custom Images";
		}
	}

	// build the modal body
	let modalBody = $(`<div class="token-image-modal-body"></div>`);
	let removeAllButton = $(`<button class="token-image-modal-remove-all-button" data-monster-id="${monsterId}" title="Reset this monster back to the default image.">Remove All Custom Images</button><`);
	removeAllButton.click(function(event) {
		let monsterId = $(event.target).attr("data-monster-id");
		if (window.confirm(`Are you sure you want to remove all custom images for ${monsterName}?\nThis will reset the monster images back to the default`)) {
			remove_all_custom_monster_images(monsterId);
			display_monster_customization_modal(placedToken);
			footerLabel.text(determineLabelText());
		}
	})

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

	// build the modal footer
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
	let modalFooter = build_token_modal_footer(determineLabelText(), add_token_customization_image);
	modalFooter.find(`input[name='addCustomImage']`).attr("data-monster-id", monsterId);
	modalFooter.find(`.token-image-modal-add-button`).attr("data-monster-id", monsterId);



	// put it all together
	let modal = build_modal_container();
	let modalContent = modal.find(".token-image-modal-content");
	modalContent.append(modalHeader);
	modalContent.append(modalBody);
	modalContent.append(removeAllButton);
	modalContent.append(modalFooter);

	if (placedToken) {
		modalFooter.find(`.token-image-modal-add-button`).remove();
		// allow them to use the new url for the placed token without saving the url for all future monsters
		let onlyForThisTokenButton = $(`<button class="token-image-modal-add-button" style="margin:4px;" data-monster-id="${monsterId}" title="This url will be used for this token only. New tokens will continue to use the images shown above.">Set for this token only</button>`);
		onlyForThisTokenButton.click(function(event) {
			let imageUrl = $(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				placedToken.options.imgsrc = parse_img(imageUrl);
				close_token_customization_modal();
				placedToken.place_sync_persist();
			}
		});
		modalContent.append(onlyForThisTokenButton);	
		let addForAllButton = $(`<button class="token-image-modal-add-button" style="margin:4px;" data-monster-id="${monsterId}" title="New tokens will use this new image instead of the default image. If you have more than one custom image, one will be chosen at random when you place a new token.">Add for all future tokens</button>`);
		addForAllButton.click(function(event) {
			let imageUrl = $(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				add_token_customization_image(imageUrl);
			}
		});
		modalContent.append(addForAllButton);
		modalContent.append($(`<div class="token-image-modal-explanation" style="padding:4px;">You can access this modal from the Monsters tab by clicking the button on the right side of the monster row.</div>`));
	}

	// display it
	$("#VTTWRAPPER").append(modal);
}

function build_modal_container() {
	let sidebarContent = $(".sidebar__pane-content");
	let width = parseInt(sidebarContent.width());
	let top = parseInt(sidebarContent.position().top) + 10;
	let height = parseInt(sidebarContent.height());
	let modalContent = $(`<div class="token-image-modal-content" style="height:${height-20}px;"></div>`); // remove 20px to account for the padding on .token-image-modal
	let modal = $(`<div class="token-image-modal" style="width:${width}px;top:${top}px;right:0px;left:auto;height:${height}px;position:fixed;"></div>`);
	let overlay = $(`<div class="token-image-modal-overlay"></div>`)
	modal.append(overlay);
	modal.append(modalContent);
	return modal;
}

function build_token_modal_header(headerTitle, explanationText) {
	let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal"><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`); 
	closeButton.click(close_token_customization_modal);
	let modalHeader = $(`
		<div class="token-image-modal-header">
			<div class="token-image-modal-header-title">${headerTitle}</div>
			<div class="token-image-modal-header-subtitle">Token Images</div>
			<div class="token-image-modal-explanation">${explanationText}</div>
		</div>
	`);
	modalHeader.prepend(closeButton);
	return modalHeader;
}

// imageUrlEntered is a function that takes a string in the form of a url
function build_token_modal_footer(footerLabelText, imageUrlEntered) {
	if (typeof imageUrlEntered !== 'function') {
		imageUrlEntered = function(newImageUrl) {
			console.warn(`Failed to provide a valid function to handle ${newImageUrl}`);
		};
	}
	
	let footerLabel = $(`<div class="token-image-modal-footer-title">${footerLabelText}</div>`)
	// inputWrapper.append(footerLabel);
	let urlInput = $(`<input title="${footerLabelText}" placeholder="https://..." name="addCustomImage" type="text" />`);
	urlInput.on('keyup', function(event) {
		let imageUrl = event.target.value;
		if (event.key == "Enter" && imageUrl != undefined && imageUrl.length > 0) {
			if(imageUrl.startsWith("data:")){
				alert("You cannot use urls starting with data:");
				return;
			}	
			imageUrlEntered(imageUrl);
		}
	});

	let addButton = $(`<button class="token-image-modal-add-button">Add</button>`);
	addButton.click(function(event) {
		let imageUrl = $(`.token-image-modal-footer-input-wrapper input[name="addCustomImage"]`)[0].value;
		if (imageUrl != undefined && imageUrl.length > 0) {
			if(imageUrl.startsWith("data:")){
				alert("You cannot use urls starting with data:");
				return;
			}	
			imageUrlEntered(imageUrl);
		}
	});

	// input wrapper is where all inputs should go. token menus add more inputs for example
	let inputWrapper = $(`<div class="token-image-modal-footer-input-wrapper"></div>`);
	

	let labelAndUrlWrapper = $(`<div class="token-image-modal-url-label-wrapper"></div>`); // this is to keep the label and input stacked vertically
	let addButtonAndLabelUrlWrapper = $(`<div class="token-image-modal-url-label-add-wrapper"></div>`); // this is to keep the add button on the right side of the label and input
		
	inputWrapper.append(addButtonAndLabelUrlWrapper);       // outer most wrapper
	addButtonAndLabelUrlWrapper.append(labelAndUrlWrapper); // label/input on the left
	addButtonAndLabelUrlWrapper.append(addButton);          // add button on the right
	labelAndUrlWrapper.append(footerLabel);                 // label above input
	labelAndUrlWrapper.append(urlInput);                    // input below label

	let modalFooter = $(`<div class="token-image-modal-footer"></div>`);
	modalFooter.append(inputWrapper);
	return modalFooter;
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
			close_token_customization_modal();
			placedToken.place_sync_persist();
		});
	}


	tokenDiv.draggable({
		helper: "clone",
		appendTo: "#VTTWRAPPER",
		zIndex: 100000,
		helper: function(event) {
			return $(event.currentTarget).find("img").clone();
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
		stop: function (event) { 
			// place a token where this was dropped
			let token = $(event.target).clone();
			let hidden = event.shiftKey;
			place_custom_token_at_point(token, hidden, event.pageX, event.pageY);
		}
	});

	return tokenDiv;
}



function place_custom_token_at_point(htmlElement, hidden, eventPageX, eventPageY) {

	let monsterId = htmlElement.attr("data-monster");
	let name = htmlElement.attr("data-name");
	let tokenSize = htmlElement.attr("data-token-size");
	let imgSrc = htmlElement.find("img").attr("src");
	if (monsterId !== undefined) {
		// placing from the monster pane
		place_monster_at_point(htmlElement, monsterId, name, imgSrc, tokenSize, hidden, eventPageX, eventPageY);
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
		hidden: hidden
	});

	if (monsterId != undefined) {
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
