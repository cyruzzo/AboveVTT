function init_pclist() {
	pcs_list = $("<div id='pcs_list' class='sidepanel-content'/>");
	$(".sidebar__pane-content").append(pcs_list);
	pcs_list.hide();
	update_pclist();

}


function update_pclist() {

	// get scroll position
	var scroll_y = $(".sidebar__pane-content").scrollTop();
	
	pcs_list = $("#pcs_list");
	pcs_list.empty();

	window.pcs = [];
	$(".ddb-campaigns-detail-body-listing-active").find(".ddb-campaigns-character-card").each(function(idx) {
		tmp = $(this).find(".ddb-campaigns-character-card-header-upper-character-info-primary");
		name = tmp.html();
		tmp = $(this).find(".user-selected-avatar");
		if (tmp.length > 0)
			image = tmp.css("background-image").slice(5, -2); // url("x") TO -> x
		else
			image = "/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";
		sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr("href");

		pc = {
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
			sheet: false,
			data: {}
		});
	}
	
	const addPartyButtonContainer = $("<div class='add-party-container'></div>");
	const addPartyButton = $("<button id='add-party'>ADD PARTY</button>");
	addPartyButton.on('click', () => {
		window.pcs.forEach(function (player, i) {
			token_button({ target: $(`[data-set-token-id='${player.sheet}']`) }, i, window.pcs.length);
		});
	});
	
	addPartyButtonContainer.append(addPartyButton);
	
	if(window.DM)
		pcs_list.append(addPartyButtonContainer);

	var NEXT_COLOR = 0;
	window.pcs.forEach(function(item, index) {

		color = "#" + TOKEN_COLORS[NEXT_COLOR++];

		pc = item;

		let playerData;
		if (pc.sheet in window.PLAYER_STATS) {
			playerData = window.PLAYER_STATS[pc.sheet];
		}

		const newPlayerTemplate = `
			<div class="player-card">
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
								Please load the character sheet.
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
		pcs_list.append(newplayer);
	});

	$(".add-token-btn").on("click", function () {
		token_button({target: this});
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
