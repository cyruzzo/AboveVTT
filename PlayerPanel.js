
function update_pclist() {

	gather_pcs();
	update_pc_token_rows(); // this updates the tokensPanel rows for the DM

	if (window.DM) {
		// only the players build out the tokensPanel. The DM uses TokensPanel
		return;
	}

	playersPanel.body.empty();

	window.pcs.forEach(function(item, index) {

		pc = item;
		let pcSheet = pc.sheet === undefined ? '' : pc.sheet;
		color = "#" + get_player_token_border_color(pcSheet);

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
	});

	$(".whisper-btn").on("click",function(){
		$("#switch_gamelog").click();
		$("#chat-text").val("/whisper ["+$(this).attr('data-to')+ "] ");
		$("#chat-text").focus();
	});
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
