
function is_encounters_page() {
    return window.location.pathname.includes("/encounters/");
}
function is_characters_page() {
    return window.location.pathname.includes("/characters/");
}
function is_campaign_page() {
    return window.location.pathname.includes("/campaigns/");
}

function encounter_builder_dice_supported() {
    // this function should be deleted once PR #399, and PR #408 have been merged.
    // For now, we'll just always return false to make everything act as if it isn't here
    return false;
}

function get_campaign_id() {
    // this function is redundant and should be deleted once PR #400 has been merged
    return find_game_id();
}

class EncounterHandler {

    encounters = {};
    campaign = {};

    constructor(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }

        if (is_encounters_page()) {
            // we really only care about the encounter that we're currently on the page of
            this.avttId = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1);
            this.fetch_avtt_encounter(this.avttId, function (fetchSucceeded) {
                callback(fetchSucceeded);
            });
            this.fetch_all_encounters(); // we'll eventually want these around so queue these requests as well
            this.fetch_campaign_info(); // we'll eventually want these around so queue these requests as well
        } else {
            // fetch all encounters, grab our AboveVTT encounter, delete any duplicates, and then move on.
            // We only care if the final fetch_or_create_avtt_encounter fails
            this.fetch_all_encounters(function () {
                console.log(`about to delete all except ${window.EncounterHandler.avttId}`);
                window.EncounterHandler.delete_all_avtt_encounters(function () {
                    window.EncounterHandler.fetch_or_create_avtt_encounter(callback);
                });
            });
        }
    }

    /// We build an encounter named `AboveVTT`. We should always have one, and this tells us if we have it locally
    has_avtt_encounter() {
        return (this.avttId !== undefined && this.avttId.length > 0);
    }

    // fetches a specific encounter by the given id
    fetch_avtt_encounter(id, callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        if (id === undefined || typeof(id) !== "string" || id.length === 0) {
            callback(false);
            return;
        }
        if (id in this.encounters) {
            // we have it locally, just return it
            callback(this.encounters[id]);
        } else {
            window.ajaxQueue.addDDBRequest({
                url: `https://encounter-service.dndbeyond.com/v1/encounters/${id}`,
                success: function (responseData) {
                    let encounter = responseData.data;
                    console.log(`fetch_avtt_encounter successfully fetched encounter with id ${id}`);
                    window.EncounterHandler.encounters[encounter.id] = encounter;
                    callback(encounter);
                },
                error: function (errorMessage) {
                    console.warn(`fetch_avtt_encounter failed; ${errorMessage}`);
                    callback(false, errorMessage?.responseJSON?.type);
                }
            });
        }
    }

    /// We build an encounter named `AboveVTT` this will fetch it if it exists, and create it if it doesn't
    fetch_or_create_avtt_encounter(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        if (this.avttId !== undefined && this.avttId.length > 0 && this.avttId in this.encounters) {
            // we have it locally, just return it
            console.log(`returning ${this.encounters[this.avttId]}`);
            callback(this.encounters[this.avttId]);
        } else {
            // we don't have it locally, so fetch all encounters and see if we have it locally then
            this.fetch_all_encounters(function () {
                console.log(`returning ${window.EncounterHandler.encounters[window.EncounterHandler.avttId]}`);
                let avttEncounter = window.EncounterHandler.encounters[window.EncounterHandler.avttId];
                if (avttEncounter !== undefined) {
                    // we found it!
                    console.log(`returning ${this.encounters[this.avttId]}`);
                    callback(avttEncounter);
                } else {
                    // there isn't an encounter for this campaign with the name AboveVTT so let's create one
                    window.EncounterHandler.create_avtt_encounter(callback);
                }
            });
        }
    }

    /// We build an encounter named `AboveVTT` this will fetch it if it exists, and create it if it doesn't
    fetch_encounter(encounterId, callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        window.ajaxQueue.addDDBRequest({
            url: `https://encounter-service.dndbeyond.com/v1/encounters/${encounterId}`,
            success: function (responseData) {
                let encounter = responseData.data;
                console.log(`fetch_encounter succeeded`);
                window.EncounterHandler.encounters[encounter.id] = encounter;
                callback(encounter);
            },
            error: function (errorMessage) {
                console.warn(`fetch_all_encounters failed; ${errorMessage}`);
                callback(false, errorMessage?.responseJSON?.type);
            }
        });
    }

    /// this fetches all encounters associated with the current campaign
    fetch_all_encounters(callback, pageNumber = 0) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        console.log(`fetch_all_encounters starting with pageNumber: ${pageNumber}`);
        window.ajaxQueue.addDDBRequest({
            url: `https://encounter-service.dndbeyond.com/v1/encounters?page=${pageNumber}`,
            success: function (responseData) {
                let encountersList = responseData.data;
                console.log(`fetch_all_encounters successfully fetched ${encountersList.length} encounters; pageNumber: ${pageNumber}`);
                for (let i = 0; i < encountersList.length; i++) {
                    let encounter = encountersList[i];
                    window.EncounterHandler.encounters[encounter.id] = encounter;
                }
                if (responseData.pagination.currentPage < responseData.pagination.pages) {
                    // there are more pages of encounters to fetch so let's keep going
                    window.EncounterHandler.fetch_all_encounters(callback, pageNumber + 1);
                } else {
                    // there are no more pages of encounter to fetch so call our callback
                    console.log(`fetch_all_encounters successfully fetched all encounters; pageNumber: ${[pageNumber]}`);
                    callback(true);
                    if (is_encounters_page()) {
                        did_change_mytokens_items(); // there's probably a better way to do this ¯\_(ツ)_/¯
                    }
                }
            },
            error: function (errorMessage) {
                console.warn(`fetch_all_encounters failed; ${errorMessage}`);
                callback(false, errorMessage?.responseJSON?.type);
            }
        });
    }

    // we only want a single encounter of AboveVTT so delete any that we've created in the past
    delete_all_avtt_encounters(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }

        console.log(JSON.stringify(window.EncounterHandler.encounters));

        for (let encounterId in window.EncounterHandler.encounters) {
            let encounter = window.EncounterHandler.encounters[encounterId];
            if (encounter.name === "AboveVTT" && encounter.id !== window.EncounterHandler.avttId) {
                console.log(`attempting to delete AboveVTT encounter! id: ${encounterId}`);
                window.ajaxQueue.addDDBRequest({
                    type: "DELETE",
                    url: `https://encounter-service.dndbeyond.com/v1/encounters/${encounterId}`,
                    success: function (responseData) {
                        console.warn(`delete_all_avtt_encounters deleted encounter ${JSON.stringify(encounter)}`);
                    },
                    error: function (errorMessage) {
                        console.warn(`delete_all_avtt_encounters failed; ${errorMessage}`);
                    }
                });
            } else {
                console.log(`not delete encounter id: ${encounterId}, name: ${encounter.name}`);
            }
        }

        window.ajaxQueue.addRequest({
            complete: function() {
                console.log("delete_all_avtt_encounters all done!")
                callback();
            }
        });

    }

    /// This is gathers info about the current campaign. It is used to to create our `AboveVTT` backing encounter
    fetch_campaign_info(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        console.log(`fetch_campaign_info starting`);
        window.ajaxQueue.addDDBRequest({
            url: `https://www.dndbeyond.com/api/campaign/stt/active-campaigns/${find_game_id()}`,
            success: function (responseData) {
                console.log(`fetch_campaign_info succeeded`);
                window.EncounterHandler.campaign = responseData.data;
                callback();
            },
            error: function (errorMessage) {
                console.warn(`fetch_campaign_info failed ${errorMessage}`);
                callback(false, errorMessage?.responseJSON?.type);
            }
        });
    }

    /// This will create our `AboveVTT` backing encounter
    create_avtt_encounter(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        console.log(`create_avtt_encounter starting`);

        window.ajaxQueue.addDDBRequest({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            url: `https://encounter-service.dndbeyond.com/v1/encounters`,
            data: JSON.stringify({
                "name": "AboveVTT",
                "flavorText": "This encounter is maintained by AboveVTT",
                "description": "If you delete this encounter, a new one will be created the next time you DM a game. If you edit this encounter, your changes will be overwritten by AboveVTT."
            }),
            success: function (responseData) {
                console.log(`create_avtt_encounter successfully created encounter`);
                let avttEncounter = responseData.data;
                console.log(JSON.stringify(avttEncounter));
                window.EncounterHandler.avttId = avttEncounter.id;
                window.EncounterHandler.encounters[avttEncounter.id] = avttEncounter;
                callback(avttEncounter);
            },
            error: function (errorMessage) {
                console.warn(`create_avtt_encounter failed ${errorMessage}`);
                callback(false, errorMessage?.responseJSON?.type);
            }
        });
    }

    /// This fetches all the characters associated with the campaign. It isn't currently used, but could potentially replace part of DDBCharacterData.js
    fetch_campaign_characters(callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        console.log(`fetch_campaign_characters starting`);
        window.ajaxQueue.addDDBRequest({
            url: `https://www.dndbeyond.com/api/campaign/stt/active-short-characters/${find_game_id()}`,
            success: function (responseData) {
                console.log(`fetch_campaign_characters succeeded`);
                window.EncounterHandler.campaignShortCharacters = responseData.data;
                callback();
            },
            error: function (errorMessage) {
                console.warn(`fetch_campaign_characters failed ${errorMessage}`);
                callback(false, errorMessage?.responseJSON?.type);
            }
        });
    }

    fetch_encounter_monsters(encounterId, callback) {
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        let encounter = this.encounters[encounterId];
        if (encounter?.monsters === undefined || encounter.monsters === null || encounter.monsters.length === 0) {
            // nothing to fetch
            callback([]);
            return;
        }
        console.log("fetch_encounter_monsters starting");
        let uniqueMonsterIds = [...new Set(encounter.monsters.map(m => m.id))];
        let queryParam = uniqueMonsterIds.map(id => `ids=${id}`).join("&");
        window.ajaxQueue.addDDBRequest({
            url: `https://monster-service.dndbeyond.com/v1/Monster?${queryParam}`,
            success: function (responseData) {
                console.log(`fetch_encounter_monsters succeeded`);
                callback(responseData.data);
                // callback(encounter.monsters.map(encounterMonster => responseData.data.find(responseMonster => responseMonster.id === encounterMonster.id )));
            },
            error: function (errorMessage) {
                console.warn("fetch_encounter_monsters failed", errorMessage);
                callback(false, errorMessage?.responseJSON?.type);
            }
        })
    }

}
