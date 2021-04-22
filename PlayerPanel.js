function init_pclist() {
	pcs_list = $("<div id='pcs_list' class='sidepanel-content'/>");
	$(".sidebar__pane-content").append(pcs_list);
	pcs_list.hide();
	update_pclist();

}


function update_pclist() {

	pcs_list = $("#pcs_list");
	pcs_list.empty();

	window.pcs = [];
	$(".ddb-campaigns-character-card").each(function(idx) {
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
	const addPartyButtonContainer = $("<div class='add-party-container'></div>");
	const addPartyButton = $("<button id='add-party'>ADD PARTY</button>");
	addPartyButton.on('click', () => {
		window.pcs.forEach(function (p, i) {
			token_button({ target: $(`[data-name='${p.name}']`) }, i, window.pcs.length);
		});
	});
	addPartyButtonContainer.append(addPartyButton);
	pcs_list.append(addPartyButtonContainer);

	var NEXT_COLOR = 0;
	window.pcs.forEach(function(item, index) {

		color = "#" + TOKEN_COLORS[NEXT_COLOR++];

		pc = item;

		let playerData;
		if (pc.sheet in window.PLAYER_STATS) {
			playerData = window.PLAYER_STATS[pc.sheet];
		}

		newPlayerTemplate = `
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
					</div>
				</div>
				<div class="player-card-content">
					<div class="player-token">
						<img width="70" height="70" src="${pc.image}" style="border: 2px solid ${color}" />
					</div>
					${
						playerData ? `
							<div class="player-info">
								<div class="player-attributes">
									<div class="player-attribute">
										<b>HP:</b> ${playerData.hp}
									</div>
									<div class="player-attribute">
										<b>AC:</b> ${playerData.ac}
									</div>
									<div class="player-attribute">
										<b>PP:</b> ${playerData.pp}
									</div>
								</div>
								<div class="player-conditions">
									<div class="player-card-title"><b>Conditions:</b></div>
									<div>
										${
											playerData.conditions.map(c => c).join(', ')
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
		pcs_list.append($(newPlayerTemplate));
	});

	$(".add-token-btn").on("click", function () {
		token_button({target: this});
	});

	$(".open-sheet-btn").on("click", function () {
		open_player_sheet($(this).attr('data-target'));
	});

}
