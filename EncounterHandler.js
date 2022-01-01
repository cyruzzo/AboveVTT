
function is_encounters_page() {
	return window.location.href.includes("/encounters/");
}

class EncounterHandler {

	constructor(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		let path = window.location.href;
		let pathWithoutQuery = path.split("?")[0];
		let lastComponent = pathWithoutQuery.substring(pathWithoutQuery.lastIndexOf('/') + 1);
		if (is_encounters_page()) {
			const urlParams = new URLSearchParams(window.location.search);
			this.campaignId = urlParams.get('cid');
			this.avttId = lastComponent;
			this.encounters = {};
		} else {
			this.campaignId = lastComponent;
			this.avttId = "";
			this.encounters = {};
		}
		this.combat_iframe;
		this.combat_stat_block_monster;
		this.encounterBuilderDiceSupported = false;
		this.fetch_feature_flags(function() {
			window.EncounterHandler.fetch_all_encounters(function () {
				if (window.EncounterHandler.avttId === undefined || window.EncounterHandler.avttId.length == 0) {
					// we don't have an encounter named AboveVTT so create one
					window.EncounterHandler.create_avtt_encounter(function() {
						callback();
					});
				} else {
					callback();
				}
			});
		});
	}

	get combat_document() {
		return this.combat_iframe[0].contentDocument;
	}

	get combat_body() {
		return $(this.combat_document.body);
	}

	get is_loading() {
		return $(".iframe-encounter-combat-tracker-is-loading").length > 0;
	}

	reload_combat_iframe() {
		console.log("reload_combat_iframe starting");
		// if there is a monster stat block open, store it so we know to reopen it once reloading has finished
		window.EncounterHandler.is_reloading = window.EncounterHandler.combat_stat_block_monster;
		window.EncounterHandler.combat_stat_block_monster = undefined;
		// mark our current iframe as "replaced" so we know which one to remove once the new one finishes loading
		$(".iframe-encounter-combat-tracker").addClass("iframe-encounter-combat-tracker-replaced");
		// reinitialize our iframe. Once it's done loading, we'll clean all this up in combat_iframe_did_load below
		init_enounter_combat_tracker_iframe();
	}

	combat_iframe_did_load() {
		if (window.EncounterHandler.is_loading) {
			// set the iframe that just finished loading to our local variable
			window.EncounterHandler.combat_iframe = $(".iframe-encounter-combat-tracker-is-loading");
		}
		if (window.EncounterHandler.combat_iframe === undefined) {
			// we don't have a local variable. Try to set it to whatever matching iframe we can find
			window.EncounterHandler.combat_iframe = $(".iframe-encounter-combat-tracker");
		}
		// we are no longer loading, so remove our loading marker
		window.EncounterHandler.combat_iframe.removeClass("iframe-encounter-combat-tracker-is-loading");
		// remove any outdated iframes now that we've finished loading a replacement
		$(".iframe-encounter-combat-tracker-replaced").remove();
		if (window.EncounterHandler.is_reloading !== undefined) {
			// There was a monster stat block open when we started reloading the iframe. Make sure we open it in the new iframe
			open_monster_stat_block(window.EncounterHandler.is_reloading);
			window.EncounterHandler.is_reloading = undefined;
		}
		console.log("combat_iframe_did_load finished");
	}

	has_avtt_encounter() {
		return (this.avttId !== undefined && this.avttId.length > 0);
	}

	fetch_or_create_avtt_encounter(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		if (this.avttId !== undefined && this.avttId.length > 0 && this.avttId in this.encounters) {
			// we have it locally, just return it
			callback(this.encounters[this.avttId]);
		} else {
			// we don't have it locally, so fetch all encounters and see if we have it locally then
			this.fetch_all_encounters(function () {
				let avttEncounter = window.EncounterHandler.encounters[window.EncounterHandler.avttId];
				if (avttEncounter !== undefined) {
					// we found it!
					callback(avttEncounter);
				} else {
					// there isn't an encounter for this campaign with the name AboveVTT so let's create one
					window.EncounterHandler.create_avtt_encounter(callback);
				}
			});
		}
	}

	fetch_all_encounters(callback, pageNumber = 0) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		console.log(`fetch_all_encounters starting with pageNumber: ${pageNumber}`);
		get_cobalt_token(function (token) {
			$.ajax({
				url: `https://encounter-service.dndbeyond.com/v1/encounters?page=${pageNumber}`,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				xhrFields: {
					withCredentials: true
				},
				success: function (responseData) {
					let encountersList = responseData.data;
					console.log(`fetch_all_encounters successfully fetched ${encountersList.length} encounters; pageNumber: ${pageNumber}`);
					for (let i = 0; i < encountersList.length; i++) {
						let encounter = encountersList[i];
						if (encounter.campaign !== undefined && encounter.campaign != null && encounter.campaign.id == window.EncounterHandler.campaignId) {
							// only collect encounters for this campaign
							window.EncounterHandler.encounters[encounter.id] = encounter;
							if (encounter.name == "AboveVTT") {
								// we found our AboveVTT encounter. Store the id locally so we can easily find it later
								window.EncounterHandler.avttId = encounter.id;
							}
						}
					}
					if (responseData.pagination.currentPage < responseData.pagination.pages) {
						// there are more pages of encounters to fetch so let's keep going
						window.EncounterHandler.fetch_all_encounters(callback, pageNumber + 1);
					} else {
						// there are no more pages of encounter to fetch so call our callback
						console.log(`fetch_all_encounters successfully fetched all encounters; pageNumber: ${[pageNumber]}`);
						callback();
					}
				},
				failure: function (errorMessage) {
					console.warn(`fetch_all_encounters failed; ${errorMessage}`);
					callback();
				}
			});
		});
	}

	fetch_campaign_info(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		console.log(`fetch_campaign_info starting`);
		get_cobalt_token(function (token) {
			$.ajax({
				url: `https://www.dndbeyond.com/api/campaign/stt/active-campaigns/${window.EncounterHandler.campaignId}`,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				xhrFields: {
					withCredentials: true
				},
				success: function (responseData) {
					console.log(`fetch_campaign_info succeeded`);
					window.EncounterHandler.campaign = responseData.data;
					callback();
				},
				failure: function (errorMessage) {
					console.warn(`fetch_campaign_info failed ${errorMessage}`);
					callback();
				}
			});
		});
	}

	create_avtt_encounter(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		console.log(`create_avtt_encounter starting`);
		window.EncounterHandler.fetch_campaign_info(function() {
			
			let campaignInfo = window.EncounterHandler.campaign;
			if (campaignInfo === undefined) {
				// this is the bare minimum that we need to send
				campaignInfo = {
					"id": window.EncounterHandler.campaignId
				};
			}
			if (campaignInfo.id != window.EncounterHandler.campaignId) {
				// not sure this is even a concern, but we need to make sure we create the encounter for this campaign only
				campaignInfo.id = window.EncounterHandler.campaignId;
			}

			get_cobalt_token(function (token) {
				$.ajax({
					type: "POST",
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					url: `https://encounter-service.dndbeyond.com/v1/encounters`,
					data: JSON.stringify({
						"campaign": campaignInfo,
						"name": "AboveVTT",
						"flavorText": `This encounter is maintained by AboveVTT for the "${campaignInfo.name}" campaign`,
						"description": `If you delete this encounter, a new one will be created the next time you DM a game in the "${campaignInfo.name}" campaign. If you edit this encounter, your changes will be overwritten by AboveVTT. This encounter contains one monster for each monster token in the current scene excluding duplicate monster types.`
					}),
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + token);
					},
					xhrFields: {
						withCredentials: true
					},
					success: function (responseData) {
						console.log(`create_avtt_encounter successfully created encounter`);
						let avttEncounter = responseData.data;
						console.log(JSON.stringify(avttEncounter));
						window.EncounterHandler.avttId = avttEncounter.id;
						window.EncounterHandler.encounters[avttEncounter.id] = avttEncounter;
						callback(avttEncounter);
					},
					failure: function (errorMessage) {
						console.warn(`create_avtt_encounter failed ${errorMessage}`);
						callback();
					}
				});
			});
		});
	}

	fetch_campaign_characters(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		console.log(`fetch_campaign_characters starting`);
		get_cobalt_token(function (token) {
			$.ajax({
				url: `https://www.dndbeyond.com/api/campaign/stt/active-short-characters/${window.EncounterHandler.campaignId}`,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				xhrFields: {
					withCredentials: true
				},
				success: function (responseData) {
					console.log(`fetch_campaign_characters succeeded`);
					window.EncounterHandler.campaignShortCharacters = responseData.data;
					callback();
				},
				failure: function (errorMessage) {
					console.warn(`fetch_campaign_characters failed ${errorMessage}`);
					callback();
				}
			});
		});
	}

	update_avtt_encounter_with_players_and_monsters(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		let encounter = window.EncounterHandler.encounters[window.EncounterHandler.avttId];
		if (encounter === undefined) {
			console.warn("update_avtt_encounter_with_players_and_monsters failed because there isn't an encounter to update");
			return;
		}
		console.log("update_avtt_encounter_with_players_and_monsters starting");

		let monsterTokens = [];
		let playerTokens = [];

		for (let tokenId in window.TOKEN_OBJECTS) {
			let token = window.TOKEN_OBJECTS[tokenId];
			if (token.isPlayer()) {
				playerTokens.push(token);
			}
			if (token.isMonster() && !monsterTokens.map(t => t.options.monster).includes(token.options.monster)) {
				monsterTokens.push(token)
			}
		}

		// console.log(`playerTokens: ${JSON.stringify(playerTokens)}`);
		// console.log(`monsterTokens: ${JSON.stringify(monsterTokens)}`);
		let encounterMonsters = encounter === undefined ? [] : encounter.monsters;
		if (encounterMonsters === undefined || encounterMonsters == null) {
			encounterMonsters = []
		}
		let mappedMonsterIds = JSON.stringify(monsterTokens.map(t => parseInt(t.options.monster)).sort());
		let mappedEncounterIds = JSON.stringify(encounterMonsters.map(m => parseInt(m.id)).sort());

		if (mappedMonsterIds == mappedEncounterIds) {
			// nothing has changed. No need to update the encounter
			console.log("update_avtt_encounter_with_players_and_monsters stopped early because nothing has changed");
			return;
		}

		let sceneTitle = "";
		if (window.CURRENT_SCENE_DATA !== undefined && window.CURRENT_SCENE_DATA.title !== undefined) {
			sceneTitle = window.CURRENT_SCENE_DATA.title;
		}

		let groupId = uuid();
		let group = {
			"id": groupId,
			"order": 1,
			"name": `all monsters on the scene "${sceneTitle}"`
		}
		let monsters = [];
		for (let i = 0; i < monsterTokens.length; i++) {
			let token = monsterTokens[i];
			monsters.push({
				"groupId": groupId,
				"id": parseInt(token.options.monster),
				"uniqueId": token.options.id,
				"name": token.options.name,
				"order": i+1,
				"quantity": 1,
				"notes": null,
				"index": null,
				"currentHitPoints": token.options.hp,
				"temporaryHitPoints": 0,
				"maximumHitPoints": token.options.max_hp,
				"initiative": 0
			});
		}

		encounter.groups = [group];
		encounter.monsters = monsters;

		// TODO: add players to the encounter so we can read encounter difficulty
		encounter.players = [];

		if (window.EncounterHandler.currentRequest !== undefined) {
			window.EncounterHandler.currentRequest.abort();
			window.EncounterHandler.currentRequest = undefined;
		}

		get_cobalt_token(function (token) {
			window.EncounterHandler.currentRequest = $.ajax({
				type: "PUT",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				url: `https://encounter-service.dndbeyond.com/v1/encounters/${window.EncounterHandler.avttId}`,
				data: JSON.stringify(encounter),
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				xhrFields: {
					withCredentials: true
				},
				success: function (responseData) {
					console.log("update_avtt_encounter_with_players_and_monsters succeeded");
					let avttEncounter = responseData.data;
					// console.log(JSON.stringify(avttEncounter));
					window.EncounterHandler.avttId = avttEncounter.id;
					window.EncounterHandler.encounters[avttEncounter.id] = avttEncounter;
					callback(avttEncounter);
					window.EncounterHandler.currentRequest = undefined;
					window.EncounterHandler.reload_combat_iframe();
				},
				failure: function (errorMessage) {
					console.warn(`update_avtt_encounter_with_players_and_monsters failed ${errorMessage}`);
					callback();
					window.EncounterHandler.currentRequest = undefined;
				}
			});
		});
	}

	fetch_feature_flags(callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		console.log(`fetch_feature_flags starting`);
		// if we ever want to fetch more, check the browser console to see what's available
		let flagsToFetch = {
			"flags":[
				"encounter-builder-dice-tray"
			]
		};
		get_cobalt_token(function (token) {
			$.ajax({
				type: "POST",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				url: `https://www.dndbeyond.com/api/feature-flags/bulkget`,
				data: JSON.stringify(flagsToFetch),
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				xhrFields: {
					withCredentials: true
				},
				success: function (responseData) {
					console.log(`fetch_feature_flags succeeded`);
					window.EncounterHandler.encounterBuilderDiceSupported = responseData["encounter-builder-dice-tray"];
					callback();
				},
				failure: function (errorMessage) {
					console.warn(`fetch_feature_flags failed ${errorMessage}`);
					callback();
				}
			});
		});
	}
}

function open_monster_stat_block(monsterId) {

	if (monsterId === undefined) {
		hide_enounter_combat_tracker_iframe();
		return;
	}

	// find the monster matching monsterId
	let encounter = window.EncounterHandler.encounters[window.EncounterHandler.avttId];
	let encounterMonsters = encounter === undefined ? [] : encounter.monsters;
	if (encounterMonsters === undefined || encounterMonsters == null) {
		encounterMonsters = []
	}
	let monster = encounterMonsters.find(m => m.id == monsterId);

	if (monster === undefined) {
		if (!window.EncounterHandler.is_loading) {
			// the monster isn't in the encounter, and we're not loading so make sure everything is up to date, and try again.
			window.EncounterHandler.combat_stat_block_monster = monsterId;
			window.EncounterHandler.update_avtt_encounter_with_players_and_monsters();
		} else {
			// the monster isn't in the encounter, but we're actively loading. set the id so that we try again once we finish loading
			window.EncounterHandler.is_reloading = monsterId;
		}
		// we don't have a stat block to show so put up a loading indicator to let the user know we're actively fetching the stat block
		display_combat_tracker_loading_indicator();
		return;
	}
	
	// we have our monster, now let's find which element on the page to click to show the stat block
	var combatants = window.EncounterHandler.combat_body.find(`.combatant-card--monster .combatant-summary__name`);
	let found = false;
	for(let i = 0; i < combatants.length; i++) {
		if (found) {
			continue;
		}
		let combatantName = $(combatants[i]);
		if (combatantName.text() == monster.name) {
			// we found the element that matches our monster. Clicking it shows the stat block.
			combatantName.click();
			found = true;
		}
	}

	if (!found) {
		if (!window.EncounterHandler.is_loading) {
			// we couldn't find our monster on the page, and we're not loading so make sure everything is up to date, and try again.
			window.EncounterHandler.combat_stat_block_monster = monsterId;
			window.EncounterHandler.update_avtt_encounter_with_players_and_monsters();
		} else {
			// we couldn't find our monster on the page, but we're actively loading. set the id so that we try again once we finish loading
			window.EncounterHandler.is_reloading = monsterId;
		}
		// we don't have a stat block to show so put up a loading indicator to let the user know we're actively fetching the stat block
		display_combat_tracker_loading_indicator();
		return;
	}

	if (window.EncounterHandler.combat_stat_block_monster == monsterId) {
		// the stat block is already open so toggle it closed
		hide_enounter_combat_tracker_iframe();
	} else {
		// we just opened the stat block. Hold the monsterId locally so we know which one is currently open.
		window.EncounterHandler.combat_stat_block_monster = monsterId;
		if (window.EncounterHandler.encounterBuilderDiceSupported != true) {
			// this user is not a subscriber, so let's parse the monster sheet and add buttons for rolling from the stat block
			window.StatHandler.getStat(monsterId, function(stats) {
				scan_monster(window.EncounterHandler.combat_body.find(".combat-tracker-page__content-section--monster-stat-block .mon-stat-block"), stats);
			});
		}
	}
	window.EncounterHandler.combat_body.find(".sidebar-panel-loading-indicator").remove(); // just in case there was already one shown we don't want to add a second one
	reposition_enounter_combat_tracker_iframe();
}

function display_combat_tracker_loading_indicator() {
	let loadingIndicator = $(`
		<div class="sidebar-panel-loading-indicator">
			<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;margin-top:100px;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
			<div class="loading-status-indicator__subtext">One moment while we fetch this monster stat block</div>
		</div>
	`);
	loadingIndicator.css({
		"display": "block",
		"position": "absolute",
		"height": "100%",
		"width": "100%",
		"top": "0px",
		"left": "0px",
		"z-index": 100000,
		"background": "rgb(235, 241, 245)"
	});

	$(".iframe-encounter-combat-tracker").each(function() {
		$(this.contentDocument.body).find(".sidebar-panel-loading-indicator").remove(); // just in case there was already one shown we don't want to add a second one
		$(this.contentDocument.body).append(loadingIndicator.clone());
	});
	reposition_enounter_combat_tracker_iframe(true);
}

function get_campaign_id() {
	let path = window.location.href;
	if (is_encounters_page()) {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get('cid');
	} else {
		let pathWithoutQuery = path.split("?")[0];
		return pathWithoutQuery.substring(pathWithoutQuery.lastIndexOf('/') + 1);
	}
}

function hide_enounter_combat_tracker_iframe() {
	window.EncounterHandler.combat_stat_block_monster = undefined;
	setTimeout(function(){
		// make sure this happens on a different thread
		window.EncounterHandler.combat_iframe.hide();
	}, 0);
}

function reposition_enounter_combat_tracker_iframe(isDisplayingLoadingIndicator = false) {

	if (window.EncounterHandler.combat_stat_block_monster === undefined && !isDisplayingLoadingIndicator) {
		// if there isn't a combat_stat_block_monster, then we have nothing to show unless we are intentionally showing a loading indicator
		return;
	}

	let maxHeight = $("#jitsi_container").length == 0 ? "89%" : "78%"; // if the video is on, don't cover it
	let left = $("#combat_tracker_inside").is(":visible") ? $("#combat_tracker_inside").width() + 10 : 10; // place it just to the right of the combat tracker

	window.EncounterHandler.combat_body.find(".combat-tracker-page__content-section--monster-stat-block .mon-stat-block").css({
		"column-count": "1"
	});
	
	window.EncounterHandler.combat_iframe.css({
		"z-index": 10000,
		"visibility": "visible",
		"display": "block",
		"top": "72px",
		"left": `${left}px`,
		"position": "fixed",
		"width": "400px",
		"overflow-y": "scroll",
		"max-height": maxHeight,
		"height": maxHeight
	});
	window.EncounterHandler.combat_body.find(".combat-tracker-page__content-section--monster-stat-block").css({
		"z-index": 10000,
		"visibility": "visible",
		"display": "block",
		"top": "0px",
		"left": "0px",
		"position": "absolute",
		"width": "100%",
		"overflow-y": "scroll",
		"height": "100%",
	});
	window.EncounterHandler.combat_body.find(".combat-tracker-page__content-section--monster-stat-block").show();
	let iframeHeight = Math.min(
		window.EncounterHandler.combat_body.find(".combat-tracker-page__content-section--monster-stat-block .encounter-details-content-section__content").height() + 20,
		window.EncounterHandler.combat_iframe.height()
	);
	window.EncounterHandler.combat_iframe.css("height", iframeHeight > 20 ? `${iframeHeight}px` : maxHeight);
	window.EncounterHandler.combat_iframe.show();
}

function init_enounter_combat_tracker_iframe() {

	if (!window.EncounterHandler.has_avtt_encounter()) {
		console.warn("init_enounter_combat_tracker_iframe was called without an encounter");
		return;
	}

	if (window.EncounterHandler.combat_iframe !== undefined) {
		// we are reinitializing. mark the current iframe as "replaced" so we know to remove it once the new one has finished loading
		$(".iframe-encounter-combat-tracker").addClass("iframe-encounter-combat-tracker-replaced");
	}

	let iframe = $("<iframe class='iframe-encounter-combat-tracker iframe-encounter-combat-tracker-is-loading'></iframe>");
	iframe.css({
		"width": "100%",
		"top": "0px",
		"left": "0px",
		"position": "fixed",
		"border": "none",
		"z-index": -10
	});
	iframe.height(window.innerHeight - 50);
	$(window).resize(function() {
		iframe.height(window.innerHeight - 50);
	});

	iframe.on("load", function(event) {

		if (!this.src) {
			// it was just created. no need to do anything until it actually loads something
			return;
		}

		$(event.target).contents().find("body").on("DOMNodeRemoved", function(addedEvent) {
			let removedElement = $(addedEvent.target);

			if (removedElement.hasClass("sidebar__pane-content")) {
				// DDB constantly removes the "send to (default)" options so we need to click .gamelog-button to make sure they inject it again. 
				// This doesn't show on screen anywhere, we just need the options in the DOM so we can synchronize the "send to (default)" selection
				setTimeout(function() {
					$(event.target).contents().find(".gamelog-button").click();
				}, 500);
			}

			if (removedElement.hasClass("ddbeb-tooltip")) {
				// a tooltip has been removed from the monster stat block iframe. We injected it into the root popup container so let's remove it now
				$("#ddbeb-popup-container").find(".mon-stat-block-injected").remove();
			}
		});

		$(event.target).contents().find("body").on("DOMNodeInserted", function(addedEvent) {

			let combatTracker = $(event.target).contents().find("#encounter-builder-root div.combat-tracker-page");
			let addedElement = $(addedEvent.target);

			if (addedElement.hasClass("ddbeb-tooltip")) {
				// a monster stat block tooltip was shown. Let's clone it and add that clone to the root popup module outside of the stat block window. we do this because the stat block iframe is too small to contain the tooltip
				let clonedElement = addedElement.clone(); // we need a clone or DDB will break when there are more things than it expected to deal with
				clonedElement.addClass("mon-stat-block-injected");
				let left = $("#combat_tracker_inside").is(":visible") ? $("#combat_tracker_inside").width() + 415 : 415; // the iframe is 400 wide plus 10px spacing before it, add another 5 after it
				clonedElement.css({
					"left": `${left}px`,
					"top": "72px"
				});
				$("#ddbeb-popup-container").first().append(clonedElement);
				return;
			}

			if (combatTracker.length > 0) {
				
				// the notification bubbles look weird at this scale. let's fix that
				if (addedElement.hasClass("noty_layout")) {
					setTimeout(function() {
						addedElement.find(".dice_notification_control i").css("padding", "0px");
					}, 0);
				}

				// hide all the UI we don't want to see
				$(event.target).contents().find(".header-wrapper").hide();
				$(event.target).contents().find("header").hide();
				$(event.target).contents().find("footer").hide();
				$(event.target).contents().find(".dice-toolbar").hide();
				$(event.target).contents().find(".sidebar__controls").hide();
				$(event.target).contents().find(".release-indicator").hide();
				$(event.target).contents().find(".combat-tracker__header").hide();
				$(event.target).contents().find(".combatants--players").hide();
				$(event.target).contents().find(".combatants__header").hide();
				$(event.target).contents().find(".turn-controls").hide();
				$(event.target).contents().find(".ddb-page-header").hide();
				$(event.target).contents().find(".sidebar").hide();
				$(event.target).contents().find(".noty_layout").hide();

				// change the visibility of these instead of calling hide because we will want some of their children to be visible
				$(event.target).contents().find(".combat-tracker-page__content").css("visibility", "hidden");
				$(event.target).contents().find(".combat-tracker-page__combat-tracker").css("visibility", "hidden");
				
				// make the popup container visible. This is where tooltips will be injected
				$(event.target).contents().find(".ddbeb-popup-container").css({"visibility": "visible", "display": "block"});
			}

			if (addedElement.hasClass("combat-tracker-page__content-section--monster-stat-block")) {
				// a monster stat block was shown, make sure it shows up on screen
				reposition_enounter_combat_tracker_iframe();
				addedElement.find(".combat-tracker-page__content-section-close-button").css("position", "fixed");
				addedElement.find(".combat-tracker-page__content-section-close-button").click(function() {
					hide_enounter_combat_tracker_iframe();
				});
			}

			if (addedElement.hasClass("encounter-details-content-section")) {
				// this seems to be the last thing loaded so do the final things on a new thread
				setTimeout(function() {

					// make sure the "send to (default)" options are on the screen. They don't get injected until .gamelog-button is clicked
					$(event.target).contents().find(".gamelog-button").click();

					// Add some hover text to let users know they can right click tooltips to send them to the gamelog
					$(event.target).contents().find(".tooltip-hover").hover(function() {
						$(this).attr("title", "right-click to send to gamelog")
					});

					// if the user right-clicks a tooltip, send it to the gamelog
					$(event.target).contents().off("contextmenu").on("contextmenu", ".tooltip-hover", function(clickEvent) {
						clickEvent.preventDefault();
						clickEvent.stopPropagation();
						if ($("#ddbeb-popup-container").first().length > 0) {
							let toPost = $("#ddbeb-popup-container").children().first().clone();
							toPost.find(".waterdeep-tooltip").attr("style", "display:block!important");
							toPost.find(".tooltip").attr("style", "display:block!important");
							toPost.css({
								"top": "0px",
								"left": "0px",
								"position": "relative"
							});
							toPost.find(".tooltip").css({
								"max-height": "1000px",
								"min-width": "0",
								"max-width": "100%",
								"width": "100%"
							});
							toPost.find(".tooltip-header").css({
								"min-height": "70px",
								"height": "auto"
							});
							toPost.find(".tooltip-body").css({
								"max-height": "1000px"
							});
							window.MB.inject_chat({
								player: window.PLAYER_NAME,
								img: window.PLAYER_IMG,
								text: toPost.html()
							});
						}
					});

					// finally, let the EncounterHandler know that this has been loaded
					window.EncounterHandler.combat_iframe_did_load();
				}, 0);
			}
		});
	});

	$("body").append(iframe);
	iframe.attr("src", `/combat-tracker/${window.EncounterHandler.avttId}`);
}
