
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
						$(".ct-character-manage-pane__decorate-button").click(); // open the "change sheet appearance" sidebar
						$(".ct-decorate-pane__grid > .ct-decorate-pane__grid-item:nth-child(3)").click(); // expand the "theme" section
					});
				}
			}
		});
		const peerConnected = is_peer_connected(pc.id);
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

	if (playerId === dm_id) {
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

	const index = window.pcs.findIndex(pc => pc.sheet.includes(idOrSheet));
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
