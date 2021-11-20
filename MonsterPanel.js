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
			currentlyCustomizingMonster = {
				monsterId: monsterRow.id.replace("monster-row-", ""),
				monsterName: $(monsterRow).find(".monster-row__name").text(),
				defaultImg: parse_img($(monsterRow).find(".monster-row__cell--avatar img").attr("src"))
			};
			display_token_customization_modal();
		};
		// clicking the menu looking button opens our token customization modal
		list.on("click", ".monster-row__cell--drag-handle", function(event) {
			open_token_customization_modal_from_monster_row(event);
		});
		// right clicking the monster image used to open a contextMenu. our token customization modal to preserve that functionality
		list.on("mouseup", ".monster-row__cell--avatar", function(event) {
			open_token_customization_modal_from_monster_row(event);
		});
		register_token_image_context_menu();

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

var currentlyCustomizingMonster = {};
function register_token_image_context_menu() {
	$.contextMenu({
		selector: ".custom-token-image-item",
		items: {
			place: {
				name: "Place Token",
				callback: function(itemKey, opt, originalEvent) {
					let selectedItem = $(opt.$trigger[0]);
					let monsterId = selectedItem.data("monster");
					let monsterName = selectedItem.data("name");
					let imgSrc = selectedItem.find("img").attr("src");
					originalEvent.target = selectedItem;
					place_custom_monster_img(originalEvent, monsterId, monsterName, imgSrc, false)
				}
			},
			placeHidden: {
				name: "Place Hidden Token",
				callback: function(itemKey, opt, originalEvent) {
					let selectedItem = $(opt.$trigger[0]);
					let monsterId = selectedItem.data("monster");
					let monsterName = selectedItem.data("name");
					let imgSrc = selectedItem.find("img").attr("src");
					originalEvent.target = selectedItem;
					place_custom_monster_img(originalEvent, monsterId, monsterName, imgSrc, true)
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
					let monsterId = selectedItem.data("monster");
					let imgIndex = parseInt(selectedItem.data("custom-img-index"));
					if (window.confirm("Are you sure you want to remove this custom image?")) {
						remove_custom_token_image(monsterId, imgIndex);
						selectedItem.remove();
						if (get_custom_monster_images(monsterId).length == 0) {
							// the user removed the last custom image. redraw the modal so the default image shows up
							display_token_customization_modal();
						}
					}
				}
			}
		}
	});
}

function token_customization_modal_is_open() {
	return $(".token-image-modal").length > 0;
}

function close_token_customization_modal() {
	$(".token-image-modal").remove();
}

function display_token_customization_modal(placedToken) {

	// close any that are already open. This shouldn't be necessary, but it doesn't hurt just in case
	close_token_customization_modal();
	
	let monsterId = currentlyCustomizingMonster.monsterId;
	let monsterName = currentlyCustomizingMonster.monsterName;
	let defaultImg = currentlyCustomizingMonster.defaultImg;
	if (monsterId == undefined || monsterName == undefined || defaultImg == undefined) {
		console.warn(`Failed to display monster customization modal; monsterId = ${monsterId}, monsterName = ${monsterName}, defaultImg = ${defaultImg}`)
		return
	}

	let customImages = get_custom_monster_images(monsterId);

	// build the modal header
	let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal"><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`); 
	closeButton.click(close_token_customization_modal);
	let modalHeader = $(`
		<div class="token-image-modal-header">
			<div class="token-image-modal-header-title">${monsterName}</div>
			<div class="token-image-modal-header-subtitle">Token Images</div>
		</div>
	`);

	if (placedToken != undefined) {
		// the user is updating a token that has already been placed. Add some explanation text to help them figure out how to use this in case it's their first time here.
		modalHeader.append($(`<div class="token-image-modal-explanation">Click an image below to update your token or enter a new image URL at the bottom.</div>`))
	} else {
		modalHeader.append($(`<div class="token-image-modal-explanation">When placing tokens, one of these images will be chosen at random. Right-click an image for more options.</div>`))
	}

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
		let monsterId = $(event.target).data("monster-id");
		if (window.confirm(`Are you sure you want to remove all custom images for ${monsterName}?\nThis will reset the monster images back to the default`)) {
			remove_all_custom_token_images(monsterId);
			display_token_customization_modal(placedToken);
			footerLabel.text(determineLabelText());
		}
	})

	if (customImages != undefined && customImages.length > 0) {
		for (let i = 0; i < customImages.length; i++) { 
			let imageUrl = parse_img(customImages[i]);
			let tokenDiv = build_token_customization_item(monsterId, monsterName, imageUrl, i, placedToken);
			modalBody.append(tokenDiv);
		}
		removeAllButton.show();
	} else {
		let tokenDiv = build_token_customization_item(monsterId, monsterName, defaultImg, -1, placedToken);
		modalBody.append(tokenDiv);
		removeAllButton.hide();
	}

	// build the modal footer
	let inputWrapper = $(`<div style="width:90%;"></div>`);
	let footerLabelText = determineLabelText();
	let footerLabel = $(`<div class="token-image-modal-footer-title" style="width:100%; padding-left:0px">${footerLabelText}</div>`)
	inputWrapper.append(footerLabel);
	let urlInput = $(`<input title="${footerLabelText}" placeholder="https://..." name="addCustomImage" type="text" style="width:100%" data-monster-id="${monsterId}" />`);
	const add_token_customization_image = function(imageUrl) {
		if (get_custom_monster_images(monsterId).length == 0) {
			// this is the first custom image so remove the default image before appending the new one, and show the remove all button
			modalBody.empty();
			removeAllButton.show();
		}
		add_custom_image_mapping(monsterId, imageUrl);
		let updatedImages = get_custom_monster_images(monsterId);
		let imgIndex = updatedImages.indexOf(imageUrl);
		let tokenDiv = build_token_customization_item(monsterId, monsterName, imageUrl, imgIndex, placedToken);
		modalBody.append(tokenDiv);	
		footerLabel.text(determineLabelText())
	}
	urlInput.on('keyup', function(event) {
		let imageUrl = event.target.value;
		if (event.key == "Enter" && imageUrl != undefined && imageUrl.length > 0) {
			add_token_customization_image(imageUrl);
		}
	});
	inputWrapper.append(urlInput);
	let modalFooter = $(`<div class="token-image-modal-footer"></div>`);
	modalFooter.append(inputWrapper);

	// put it all together
	let sidebarContent = $(".sidebar__pane-content");
	let width = parseInt(sidebarContent.width());
	let top = parseInt(sidebarContent.position().top) + 10;
	let height = parseInt(sidebarContent.height());
	let modalContent = $(`<div class="token-image-modal-content" style="height:${height-20}px;"></div>`); // remove 20px to account for the padding on .token-image-modal
	modalContent.append(closeButton);
	modalContent.append(modalHeader);
	modalContent.append(modalBody);
	modalContent.append(removeAllButton);
	modalContent.append(modalFooter);

	if (placedToken) {
		// allow them to only use the new url for 
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
	} else {
		let addButton = $(`<button class="token-image-modal-add-button" data-monster-id="${monsterId}">Add</button>`);
		addButton.click(function(event) {
			let imageUrl = $(`input[name='addCustomImage']`)[0].value;
			if (imageUrl != undefined && imageUrl.length > 0) {
				add_token_customization_image(imageUrl);
			}
		});
		modalFooter.append(addButton);	
	}

	let modal = $(`<div class="token-image-modal" style="width:${width}px;top:${top}px;right:0px;left:auto;height:${height}px;position:fixed;"></div>`);
	let overlay = $(`<div class="token-image-modal-overlay"></div>`)
	modal.append(overlay);
	modal.append(modalContent);

	// display it
	$("#VTTWRAPPER").append(modal);
}

function build_token_customization_item(monsterId, monsterName, imageUrl, customImgIndex, placedToken) {
	let tokenDiv = $(`<div class="custom-token-image-item" data-monster="${monsterId}" data-name="${monsterName}" data-custom-img-index="${customImgIndex}"><img alt="token-img" style="transform: scale(0.75); display: inline-block; overflow: hidden; width:100%; height:100%" class="token-image token-round" src="${imageUrl}" /></div>`);
	if (placedToken != undefined) {
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
		start: function (event, ui) { 
			console.log("custom-token-image-item drag start");
			// center under the cursor

			window.StatHandler.getStat(monsterId, function(stat) {
				let tokenSize = 1.0
				if (stat.data.sizeId == 5) {
					tokenSize = 2.0;
				} else if (stat.data.sizeId == 6) {
					tokenSize = 3.0;
				} else if (stat.data.sizeId == 7) {
					tokenSize = 4.0;
				}
					
				let helperWidth = $(event.target).width() / (1.0 / window.ZOOM);
				$(ui.helper).css('width', `${helperWidth * tokenSize}px`);
			});
		},
		drag: function(event, ui) {
			$(event).draggable("option", "cursorAt", {
				left: Math.floor(ui.helper.width() / 2),
				top: Math.floor(ui.helper.height() / 2)
			}); 
		},
		stop: function (event) { 
			// place a token where this was dropped
			let token = $(event.target).clone();
			let monsterId = token.data("monster");
			let monsterName = token.data("name");
			let imgSrc = token.find("img").attr("src");
			let hidden = event.shiftKey;
			event.target = token;

			let mouseX = (event.pageX - 200) * (1.0 / window.ZOOM);
			let mouseY = (event.pageY - 200) * (1.0 / window.ZOOM);

			let fogOverlay = $("#fog_overlay"); // not sure if there's a better way to find this...
			if (mouseX <= 0 || mouseY <= 0 || mouseX >= fogOverlay.width() || mouseY >= fogOverlay.height()) {
				console.log("not dropping token outside of the scene");
				return;
			}

			let shallwesnap = (window.CURRENT_SCENE_DATA.snap == "1"  && !(window.toggleSnap)) || ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);
			if (shallwesnap) {
				// calculate offset in real coordinates
				const startX = window.CURRENT_SCENE_DATA.offsetx;
				const startY = window.CURRENT_SCENE_DATA.offsety;

				const selectedNewtop = Math.round((mouseY - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
				const selectedNewleft = Math.round((mouseX - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;
				place_custom_monster_img(event, monsterId, monsterName, imgSrc, hidden, selectedNewleft, selectedNewtop);

			} else {
				place_custom_monster_img(event, monsterId, monsterName, imgSrc, hidden, mouseX, mouseY);
			}

		}
	});

	return tokenDiv;
}

function place_custom_monster_img(e, monsterId, monsterName, imgSrc, hidden, x, y) {
	let button = e.target;
	button.attr('data-stat', monsterId);
	button.attr("data-name", monsterName);
	button.attr('data-img', imgSrc);
	button.attr('data-custom-img', imgSrc);
	button.attr('data-left', x);
	button.attr('data-top', y);

	if (hidden) {
		button.attr('data-hidden', 1)
	} else {
		button.removeAttr('data-hidden');
	}

	window.StatHandler.getStat(monsterId, function(stat) {
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

}
