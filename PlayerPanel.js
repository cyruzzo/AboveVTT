
function update_pclist() {

	gather_pcs();
	update_pc_token_rows(); // this updates the tokensPanel rows for the DM

	if (window.DM) {
		// only the players build out the tokensPanel. The DM uses TokensPanel
		return;
	}

	playersPanel.body.empty();

	window.pcs.forEach(function(item, index) {

		const pc = item;
		let pcSheet = pc.sheet === undefined ? '' : pc.sheet;
		const color = pc.color ? pc.color : get_token_color_by_index(index);

		let playerData;
		if (pc.sheet in window.PLAYER_STATS) {
			playerData = window.PLAYER_STATS[pcSheet];
		}

		const newPlayerTemplate = `
			<div class="player-card" data-player-id="${pcSheet}">
				<div class="player-card-header">
					<div class="player-name">${pc.name}</div>
					<div class="player-actions">
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
						` : ``
					}
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
		if (pc.p2pConnected) {
			if (pc.sheet.includes(my_player_id())) {
				update_player_online_indicator(my_player_id(), pc.p2pConnected, pc.color ? pc.color : window.color);
			} else {
				update_player_online_indicator(getPlayerIDFromSheet(pc.sheet), pc.p2pConnected, pc.color ? pc.color : color);
			}
		}
	});

	$(".whisper-btn").on("click",function(){
		$("#switch_gamelog").click();
		$("#chat-text").val("/whisper ["+$(this).attr('data-to')+ "] ");
		$("#chat-text").focus();
	});
}

function gather_pcs() {
	let campaignId = get_campaign_id();
	if (is_encounters_page() || is_characters_page()) {
		if (window.pcs) return; // we should only need to fetch this once
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
			sheet: sheet === undefined ? "" : sheet,
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
	return "#" + TOKEN_COLORS[0];
}

function find_and_set_player_color() {
	const playerId = my_player_id();

	// 1. See if we've stored it locally
	const locallyStored = localStorage.getItem(`PlayerColor-${playerId.replace(' ', '')}`); // "THE DM" has a space in it which won't work here
	if (locallyStored != null) {
		console.debug("find_and_set_player_color found a color in localStorage", locallyStored);
		change_player_color(locallyStored);
		return;
	}

	// 2. check if they have a customized character theme
	const themeColor = $(".dice-toolbar").css("--dice-color");
	if (themeColor && (window.DM || !themeColor.includes('#C53131'))) {
		// #C53131 is the "DDB Red" theme color which DDB sets as default. Only allow allow that theme color for the DM. Also, sometimes DDB injects it as ' #C53131' which is why we're using `includes`
		console.debug("find_and_set_player_color found a theme color", themeColor);
		change_player_color(themeColor.trim());
		return;
	}

	// 3. use a random TOKEN_COLORS, but don't save that to disk
	let index = find_pc_by_player_id(playerId);
	const colorByIndex = get_token_color_by_index(index);
	if (index >= 0) {
		const pc = window.pcs[index];
		if (pc.color) {
			console.debug("find_and_set_player_color is using pc.color", pc.color);
			change_player_color(pc.color);
		}
		console.debug("find_and_set_player_color found a TOKEN_COLOR using index", index, colorByIndex);
		change_player_color(colorByIndex);
	} else {
		console.debug("find_and_set_player_color is using the first TOKEN_COLOR", colorByIndex);
		change_player_color(colorByIndex);
	}
}

function change_player_color(color) {
	const playerId = my_player_id();
	window.color = color;
	const pc = find_pc_by_player_id(playerId);
	if (pc) {
		pc.color = color
	}
	WaypointManager.drawStyle.color = color;
	window.PeerManager.send(PeerEvent.preferencesChange());
	update_player_online_indicator(playerId, pc.p2pConnected, color);
}

function store_player_color(color) {
	const playerId = my_player_id().replace(' ', ''); // "THE DM" has a space in it which won't work here
	if (color) {
		localStorage.setItem(`PlayerColor-${playerId}`, color);
	} else {
		localStorage.removeItem(`PlayerColor-${playerId}`, color);
	}
}
