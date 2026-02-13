
function update_pclist() {

	console.log("update_pclist pcs", window.pcs);

	if (window.DM) {
		// only the players build out the playersPanel. The DM uses tokensPanel
		update_pc_token_rows(); // this updates the tokensPanel rows for the DM
		return;
	}

	playersPanel.body.empty();

	const pcObjects = [...window.pcs, generic_pc_object(true)]; // add a pc object for the DM
	pcObjects.forEach(pc => {
		const color = color_from_pc_object(pc);
		const hpValue = hp_from_pc_object(pc);
		const maxHp = max_hp_from_pc_object(pc);
		const boxShadow = hp_aura_box_shadow_from_pc_object(pc);
		const newPlayerTemplate = `
			<div class="player-card" data-player-id="${pc.sheet}">
				<div class="player-card-header">
					<div class="player-name">${pc.name}</div>
					<div class="player-actions">
						${pc.name != dm_id ? `<button class="find-btn" style="font-size:10px;"><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none" /><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z" /></svg></button>` : ''}
						<button class="whisper-btn" data-to="${pc.name}">WHISPER</button>
					</div>
				</div>
				<div class="player-card-content">
					<div class="player-token">
						<img width="70" height="70" src="${pc.image}" style="border: 3px solid ${color}" />
					</div>
				</div>
			</div>
		`;
		let newplayer=$(newPlayerTemplate);
		playersPanel.body.append(newplayer);
		playersPanel.body.find(`.player-card`).each(function() {
			const card = $(this);
			if (card.attr("data-player-id").includes(my_player_id())) {
				card.find(".whisper-btn").remove();
				if (card.find(".change-theme-button").length === 0) {
					const changeThemeButton = $(`<button class="change-theme-button">Change Theme</button>`);
					card.find(".player-actions").append(changeThemeButton);
					changeThemeButton.click(function (e) {
						$(".ddbc-character-avatar__portrait").click(); // open the character details sidebar
						setTimeout(function(){
							$(".ct-character-manage-pane__decorate-button, [class*='styles_decorateButton']").click(); // open the "change sheet appearance" sidebar
							setTimeout(function () {
								$(".ct-decorate-pane__grid > .ct-decorate-pane__grid-item:nth-child(3)").click(); // expand the "theme" section
							}, 25)
						}, 25)
					});
				}
			}
		});
		const peerConnected = is_peer_connected(getPlayerIDFromSheet(pc.sheet));
		if (peerConnected) {
			if (pc.sheet.includes(my_player_id())) {
				update_player_online_indicator(my_player_id(), peerConnected, color);
			} else {
				update_player_online_indicator(getPlayerIDFromSheet(pc.sheet), peerConnected, color);
			}
		}
	});

	$(".whisper-btn").on("click",function(){
		$("#switch_gamelog").click();
		$("#chat-text").val("/whisper ["+$(this).attr('data-to')+ "] ");
		$("#chat-text").focus();
	});

	$(".find-btn").on("click",function(){
		const id = $(this).closest('[data-player-id]').attr('data-player-id');
		const token = $(`#tokens [data-id='${id}']`);
		if (token.length == 0 || token.css('visibility') == 'hidden' || token.css('display') == 'none') 
			return;	
		window.TOKEN_OBJECTS[id].highlight()
	});
}

// deprecated, but still necessary for migrations
function read_player_token_customizations() {
	let customMappingData = localStorage.getItem('PlayerTokenCustomization');
	if (customMappingData !== undefined && customMappingData != null) {
		return $.parseJSON(customMappingData);
	} else {
		return {};
	}
}

// deprecated, but still necessary for migrations
function write_player_token_customizations(customMappingData) {
	if (customMappingData !== undefined && customMappingData != null) {
		localStorage.setItem("PlayerTokenCustomization", JSON.stringify(customMappingData));
	}
}

function add_player_image_mapping(playerId, imageUrl) {
	if (typeof playerId !== "string" || playerId.length === 0 || typeof imageUrl !== "string" || imageUrl.length === 0) {
		return;
	}

	let customization = find_token_customization(ItemType.PC, playerId);
	if (!customization) {
		return;
	}
	customization.addAlternativeImage(imageUrl);
	persist_token_customization(customization);
}

function remove_player_image_mapping(playerId, imageUrl) {
	let customization = find_token_customization(ItemType.PC, playerId);
	if (!customization) {
		return;
	}
	customization.removeAlternativeImage(imageUrl);
	persist_token_customization(customization);
}

function remove_all_player_image_mappings(playerId) {
	let customization = find_token_customization(ItemType.PC, playerId);
	if (!customization) {
		return;
	}
	customization.removeAllAlternativeImages();
	persist_token_customization(customization);
}

function get_player_image_mappings(playerId) {
	try {
		return find_or_create_token_customization(ItemType.PC, playerId, RootFolder.Players.id, RootFolder.Players.id, RootFolder.Players.id).tokenOptions.alternativeImages || [];
	} catch (error) {
		console.error("get_player_image_mappings failed to find_or_create_token_customization", playerId, error)
		return [];
	}
}

function random_image_for_player_token(playerId) {
	let images = get_player_image_mappings(playerId);
	let randomIndex = getRandomInt(0, images.length);
	return images[randomIndex];
}

function get_token_color_by_index(index) {
	if (index >= 0 && index < TOKEN_COLORS.length) {
		return "#" + TOKEN_COLORS[index];
	}
	return "#" + TOKEN_COLORS[Math.floor(Math.random() * TOKEN_COLORS.length)];
}

function find_and_set_player_color() {
	const playerId = my_player_id();

	if (playerId === dm_id || is_spectator_page()) {
		// DM just uses the default DDB theme
		const dmPc = generic_pc_object(true);
		change_player_color(dmPc.decorations.characterTheme.themeColor);
		return;
	}

	const pc = window.pcs.find(pc => pc.sheet.includes(playerId));
	if (pc && pc.decorations?.characterTheme?.themeColor) {
		// we were able to fetch the theme from DDB so use it
		change_player_color(pc.decorations.characterTheme.themeColor);
		return;
	}

	const index = window.pcs.findIndex(pc => pc.sheet.includes(playerId));
	const colorByIndex = get_token_color_by_index(index);
	change_player_color(colorByIndex);
}

function change_player_color(color) {
	const playerId = my_player_id();
	window.color = color;
	WaypointManager.drawStyle.color = color;
	// window.PeerManager.send(PeerEvent.preferencesChange());
	const peerConnected = is_peer_connected(playerId);
	update_player_online_indicator(playerId, peerConnected, color);
}
