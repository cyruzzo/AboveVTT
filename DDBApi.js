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
    const request = await fetch(url, config).then(DDBApi.lookForErrors);
    const response = await request.json();
    MYCOBALT_TOKEN = response.token;
    MYCOBALT_TOKEN_EXPIRATION = Date.now() + ((response.ttl - 30) * 1000);
    return response.token;
  }

  static async lookForErrors(response) {
    if (response.status < 400) {
      return response;
    }
    if(response.status == 410){
      showError(new Error(`DDB 410 Error`), `<b>Try clearing <div style="backdrop-filter: brightness(0.8);padding: 0px 3px;display: inline-block;border-radius: 5px;">${navigator.userAgent.indexOf("Firefox") != -1 ? `temporary cached files and pages` : `cached images and files`}</div> and restarting the browser.</b>`, `<br/><b>As long as you do <span style='color: #900;'>not</span> clear <div style="backdrop-filter: brightness(0.8);padding: 0px 3px;display: inline-block;border-radius: 5px;">cookies and other site data</div> this should not remove any AboveVTT data.`);
    }
    else{
      // We have an error so let's try to parse it
      console.debug("DDBApi.lookForErrors", response);
      const responseJson = await response.json()
        .catch(parsingError => console.error("DDBApi.lookForErrors Failed to parse json", response, parsingError));
      const type = responseJson?.type || `Unknown Error ${response.status}`;
      const messages = responseJson?.errors?.message?.join("; ") || "";
      console.error(`DDB API Error: ${type} ${messages}`);
      if(type == 'EncounterLimitException'){
        alert("Encounter limit reached. AboveVTT needs 1 encounter slot free to join as DM. If you are on a free DDB account you are limited to 8 encounter slots. Please try deleting an encounter.")
      }
      showError(new Error(`DDB API Error: ${type} ${messages}`));
    }

  }

  static async fetchJsonWithToken(url, extraConfig = {}) {
    const token = await DDBApi.#refreshToken();
    const config = {...extraConfig,
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
    const request = await fetch(url, config).then(DDBApi.lookForErrors)
    return await request.json();
  }

    static async fetchJsonWithTokenOmitCred(url, extraConfig = {}) {
    const token = await DDBApi.#refreshToken();
    const config = {...extraConfig,
      credentials: 'omit',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    const request = await fetch(url, config).then(DDBApi.lookForErrors)
    return await request.json();
  }

  static async postJsonWithToken(url, body) {
    const config = {
      method: 'POST',
      body: JSON.stringify(body)
    }
    return await DDBApi.fetchJsonWithTokenOmitCred(url, config);
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
    // Explicitly not calling `lookForErrors` here because we don't actually care if this succeeds.
    // We're just trying to clean up anything that we can
    return await fetch(url, config);
  }



  static async fetchCharacter(id) {
    if (typeof id !== "string" || id.length <= 1) {
      throw new Error(`Invalid id: ${id}`);
    }

    const url = `https://character-service.dndbeyond.com/character/v5/character/${id}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    console.debug("DDBApi.fetchCharacter response", response);
    return response.data;
  }

  static async fetchEncounter(id) {
    if (typeof id !== "string" || id.length <= 1) {
      throw new Error(`Invalid id: ${id}`);
    }

    const url = `https://encounter-service.dndbeyond.com/v1/encounters/${id}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    console.debug("DDBApi.fetchEncounter response", response);
    return response.data;
  }

  static async fetchAllEncounters() {
    console.log(`DDBApi.fetchAllEncounters starting`);

    const url = `https://encounter-service.dndbeyond.com/v1/encounters?skip=0&take=99999`;
    const response = await DDBApi.fetchJsonWithToken(`${url}`)
    
    return response.data;
  }

  static async deleteAboveVttEncounters(encounters) {
    console.log("DDBApi.deleteAboveVttEncounters starting");
    // make sure we don't delete the encounter that we're actively on
    const avttId = is_encounters_page() ? window.location.pathname.split("/").pop() : undefined;
    const avttEncounters = encounters.filter(e => e.id !== avttId && e.name === DEFAULT_AVTT_ENCOUNTER_DATA.name);
    console.debug(`DDBApi.deleteAboveVttEncounters avttId: ${avttId}, avttEncounters:`, avttEncounters);
    const failedEncounters = JSON.parse(localStorage.getItem('avttFailedDelete'));
    let newFailed = (failedEncounters != null && failedEncounters != undefined && Array.isArray(failedEncounters)) ? failedEncounters : [];
    for (const encounter of avttEncounters) {
      if(newFailed.includes(encounter.id))
        continue;
      console.log("DDBApi.deleteAboveVttEncounters attempting to delete encounter with id:", encounter.id);
      const response = await DDBApi.deleteWithToken(`https://encounter-service.dndbeyond.com/v1/encounters/${encounter.id}`);
      console.log("DDBApi.deleteAboveVttEncounters delete encounter response:", response.status);
      if(response.status == 401){
        newFailed.push(encounter.id)
        try{
          localStorage.setItem('avttFailedDelete', JSON.stringify(newFailed));
        }
        catch(e){
          console.warn('localStorage avttFailedDelete Failed', e)
        }
      }    
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
    console.debug("DDBApi.createAboveVttEncounter attempting to create encounter with data", encounterData);
    const response = await DDBApi.postJsonWithToken(url, encounterData);
    console.debug("DDBApi.createAboveVttEncounter response", response);
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
    // This is what the campaign page calls to fetch characters
    if(window.playerUsers != undefined)
      return window.playerUsers
    const url = `https://www.dndbeyond.com/api/campaign/stt/active-short-characters/${campaignId}`;
    const response = await DDBApi.fetchJsonWithToken(url);
    return response.data;
  }

  static async fetchCampaignCharacterDetails(campaignId) {
    const characterIds = await DDBApi.fetchCampaignCharacterIds(campaignId);
    return await DDBApi.fetchCharacterDetails(characterIds);
  }



  static async fetchCharacterDetails(characterIds) {
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      console.warn("DDBApi.fetchCharacterDetails expected an array of ids, but received: ", characterIds);
      return [];
    }
    const ids = characterIds.map(ci => parseInt(ci)); // do not use strings
    const url = `https://character-service-scds.dndbeyond.com/v2/characters`;
    const config = {
      method: 'POST',
      body: JSON.stringify({ "characterIds": ids })
    }
    const response = await DDBApi.fetchJsonWithToken(url, config);
    return response.foundCharacters;
  }

  static async fetchConfigJson() {
    if(window.ddbConfigJson != undefined)
      return window.ddbConfigJson
    const url = "https://www.dndbeyond.com/api/config/json";
    return await $.get(url);
  }

  static async fetchActiveCharacters(campaignId) {
    // This is what the encounter page called at one point, but seems to use fetchCampaignCharacters now
    const url = `https://www.dndbeyond.com/api/campaign/active-characters/${campaignId}`
    const response = await DDBApi.fetchJsonWithToken(url);
    return response.data;
  }

  static async fetchCampaignCharacterIds(campaignId) {
    let characterIds = [];
    if(window.playerUsers){
      characterIds = window.playerUsers.map(c => c.id);
      return characterIds;
    }


    try {
      window.playerUsers = await DDBApi.fetchCampaignCharacters(campaignId);
      characterIds = window.playerUsers.map(c => c.id);
    } 
    catch (error) {
      try {
        // This is what the campaign page calls
        window.playerUsers = await DDBApi.fetchActiveCharacters(campaignId);
        window.playerUsers.forEach(c => {
          if (!characterIds.includes(c.id)) {
            characterIds.push(c.id);
          }
        });
      } 
      catch (error) {
        console.warn("fetchCampaignCharacterIds caught an error trying to collect ids from fetchActiveCharacters", error);
      } 
    }
    let playerUser = window.playerUsers.filter(d=> d.id == window.PLAYER_ID)[0]?.userId;
    window.myUser = playerUser ? playerUser : 'THE_DM'; 
    return characterIds;
  }

}
