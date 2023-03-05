/** DDBApi.js - DndBeyond Api endpoints */

const DEFAULT_AVTT_ENCOUNTER_DATA = {
  "name": "AboveVTT",
  "flavorText": "This encounter is maintained by AboveVTT",
  "description": "If you delete this encounter, a new one will be created the next time you DM a game. If you edit this encounter, your changes may be lost. AboveVTT automatically deletes encounters that it had previously created."
};

class DDBApi {

  static async #refreshToken() {
    if (Date.now() < MYCOBALT_TOKEN_EXPIRATION) {
      return MYCOBALT_TOKEN;
    }
    const url = `https://auth-service.dndbeyond.com/v1/cobalt-token`;
    const config = { method: 'POST', credentials: 'include' };
    console.log("DDBApi is refreshing auth token");
    const request = await fetch(url, config);
    const response = await request.json();
    MYCOBALT_TOKEN = response.token;
    MYCOBALT_TOKEN_EXPIRATION = Date.now() + (response.ttl * 1000) - 10000;
    return response.token;
  }

  static async fetchJsonWithToken(url, extraConfig = {}) {
    const token = await DDBApi.#refreshToken();
    const config = {...extraConfig,
      credentials: 'omit',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    const request = await fetch(url, config);
    return await request.json();
  }

  static async fetchJsonWithCredentials(url, extraConfig = {}) {
    console.debug("DDBApi.fetchJsonWithCredentials url", url)
    const request = await fetch(url, {...extraConfig, credentials: 'include' });
    console.debug("DDBApi.fetchJsonWithCredentials request", request);
    const response = await request.json();
    console.debug("DDBApi.fetchJsonWithCredentials response", response);
    return response;
  }

  static async postJsonWithToken(url, body) {
    const config = {
      method: 'POST',
      body: JSON.stringify(body)
    }
    return await DDBApi.fetchJsonWithToken(url, config);
  }

  static async deleteWithToken(url) {
    const token = await DDBApi.#refreshToken();
    const config = {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    return await fetch(url, config);
  }



  static async fetchCharacter(id) {
    if (typeof id !== "string" || id.length <= 1) {
      throw new Error(`Invalid id: ${id}`);
    }

    const url = `https://character-service.dndbeyond.com/character/v5/character/${id}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    console.log("DDBApi.fetchCharacter response", response);
    return response.data;
  }

  static async fetchEncounter(id) {
    if (typeof id !== "string" || id.length <= 1) {
      throw new Error(`Invalid id: ${id}`);
    }

    const url = `https://encounter-service.dndbeyond.com/v1/encounters/${id}`;
    const response = await DDBApi.fetchJsonWithCredentials(url);
    console.log("DDBApi.fetchEncounter response", response);
    return response.data;
  }

  static async fetchAllEncounters() {
    console.log(`DDBApi.fetchAllEncounters starting`);

    const url = `https://encounter-service.dndbeyond.com/v1/encounters`;

    // make the first request to get pagination info
    console.log(`DDBApi.fetchAllEncounters attempting to fetch page 1`);
    const firstPage = await DDBApi.fetchJsonWithToken(`${url}?page=1`);
    let encounters = firstPage.data;
    const numberOfPages = firstPage.pagination.pages;
    if (isNaN(numberOfPages)) {
      throw new Error(`Unexpected Pagination Data: ${JSON.stringify(firstPage.pagination)}`);
    } else {
      console.log(`DDBApi.fetchAllEncounters attempting to fetch pages 2 through ${numberOfPages}`);
    }
    for (let i = 2; i <= numberOfPages; i++) {
      const response = await DDBApi.fetchJsonWithToken(`${url}?page=${i}`)
      console.log(`DDBApi.fetchAllEncounters page ${i} response: `, response);
      encounters = encounters.concat(response.data);
      console.log(`DDBApi.fetchAllEncounters successfully fetched page ${i}`);
    }
    return encounters;
  }

  static async deleteAboveVttEncounters(encounters) {
    console.log("DDBApi.deleteAboveVttEncounters all encounters:", encounters);
    // make sure we don't delete the encounter that we're actively on
    const avttId = is_encounters_page() ? window.location.pathname.split("/").pop() : undefined;
    const avttEncounters = encounters.filter(e => e.id !== avttId && e.name === DEFAULT_AVTT_ENCOUNTER_DATA.name);
    console.log(`DDBApi.deleteAboveVttEncounters avttId: ${avttId}, avttEncounters:`, avttEncounters);
    for (const encounter of avttEncounters) {
      console.log("DDBApi.deleteAboveVttEncounters attempting to delete encounter with id:", encounter.id);
      const response = await DDBApi.deleteWithToken(`https://encounter-service.dndbeyond.com/v1/encounters/${encounter.id}`);
      console.log("DDBApi.deleteAboveVttEncounters delete encounter response:", response.status);
    }
  }

  static async createAboveVttEncounter(campaignId = find_game_id()) {
    console.log("DDBApi.createAboveVttEncounter", campaignId);

    const campaignInfo = await DDBApi.fetchCampaignInfo(campaignId);
    console.log("DDBApi.createAboveVttEncounter campaignInfo", campaignInfo);
    if (!campaignInfo.id) {
      throw new Error(`Invalid campaignInfo ${JSON.stringify(campaignInfo)}`);
    }

    const url = "https://encounter-service.dndbeyond.com/v1/encounters";
    const encounterData = {...DEFAULT_AVTT_ENCOUNTER_DATA, campaign: campaignInfo};
    console.log("DDBApi.createAboveVttEncounter attempting to create encounter with data", encounterData);
    const response = await DDBApi.postJsonWithToken(url, encounterData);
    console.log("DDBApi.createAboveVttEncounter response", response);
    return response.data;
  }

  static async fetchCampaignInfo(campaignId) {
    console.log("DDBApi.fetchCampaignInfo");
    const url = `https://www.dndbeyond.com/api/campaign/stt/active-campaigns/${campaignId}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    return response.data;
  }

  static async fetchMonsters(monsterIds) {
    if (!Array.isArray(monsterIds)) {
      return [];
    }
    let uniqueMonsterIds = [...new Set(monsterIds)];
    let queryParam = uniqueMonsterIds.map(id => `ids=${id}`).join("&");
    console.log("DDBApi.fetchMonsters starting with ids", uniqueMonsterIds);
    const url = `https://monster-service.dndbeyond.com/v1/Monster?${queryParam}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    return response.data;
  }

  static async fetchCampaignCharacters(campaignId) {
    const url = `https://www.dndbeyond.com/api/campaign/stt/active-short-characters/${campaignId}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    return response.data;
  }

  static async fetchCampaignCharacterDetails(campaignId) {
    const characters = await DDBApi.fetchCampaignCharacters(campaignId);
    const characterIds = characters.map(c => c.id);
    return await DDBApi.fetchCharacterDetails(characterIds);
  }

  static async fetchCharacterDetails(characterIds) {
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return [];
    }
    const url = `https://character-service-scds.dndbeyond.com/v1/characters`;
    const config = {
      method: 'POST',
      body: JSON.stringify({ "characterIds": characterIds })
    }
    const response = await DDBApi.fetchJsonWithToken(url, config);
    return response.foundCharacters;
  }

  static async fetchConfigJson() {
    const url = "https://www.dndbeyond.com/api/config/json";
    return await DDBApi.fetchJsonWithToken(url);
  }

}
