
class EncounterHandler {

	constructor() {
		let path = window.location.href;
		let pathWithoutQuery = path.split("?")[0];
		let lastComponent = pathWithoutQuery.substring(pathWithoutQuery.lastIndexOf('/') + 1);
		this.campaignId = lastComponent;
		this.avttId = "";
		this.encounters = {};
		this.fetch_all_encounters(function () {
			if (window.EncounterHandler.avttId === undefined || window.EncounterHandler.avttId.length == 0) {
				// we don't have an encounter named AboveVTT so create one
				window.EncounterHandler.create_avtt_encounter();
			}
		});
	}

	has_avtt_encounter() {
		return (this.avttId !== undefined && this.avttId.length > 0);
	}

	fetch_or_create_avtt_encounter(callback) {
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

	fetch_all_encounters(callback, pageNumber = 1) {
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
							window.EncounterHandler.encounters[encounter.id] = encounter;
							if (encounter.name == "AboveVTT") {
								window.EncounterHandler.avttId = encounter.id;
							}
						}
					}
					if (responseData.pagination.currentPage < responseData.pagination.pages) {
						window.EncounterHandler.fetch_all_encounters(callback, pageNumber + 1);
					} else if (typeof callback === 'function') {
						console.log(`fetch_all_encounters successfully fetched all encounters; pageNumber: ${[pageNumber]}`);
						callback();
					}
				},
				failure: function (errorMessage) {
					console.warn(`fetch_all_encounters failed; ${errorMessage}`);
					if (typeof callback === 'function') {
						callback();
					}
				}
			});
		});
	}

	fetch_campaign_info() {
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
					if (typeof callback === 'function') {
						callback();
					}
				},
				failure: function (errorMessage) {
					console.warn(`fetch_campaign_info failed ${errorMessage}`);
					if (typeof callback === 'function') {
						callback();
					}
				}
			});
		});
	}

	create_avtt_encounter(callback) {
		console.log(`create_avtt_encounter starting`);
		get_cobalt_token(function (token) {
			$.ajax({
				type: "POST",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				url: `https://encounter-service.dndbeyond.com/v1/encounters`,
				data: JSON.stringify({
					"campaign": {
						"id": window.EncounterHandler.campaignId
					},
					"name": "AboveVTT"
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
					window.EncounterHandler.encounters[avttEncounter.id] = avttEncounter;
					if (typeof callback === 'function') {
						callback(avttEncounter);
					}
				},
				failure: function (errorMessage) {
					console.warn(`create_avtt_encounter failed ${errorMessage}`);
					if (typeof callback === 'function') {
						callback();
					}
				}
			});
		});
	}

}
