/** DDBApi.js - DndBeyond Api endpoints */

const DEFAULT_AVTT_ENCOUNTER_DATA = {
  "name": "AboveVTT",
  "flavorText": "This encounter is maintained by AboveVTT",
  "description": "If you delete this encounter, a new one will be created the next time you DM a game. If you edit this encounter, your changes may be lost. AboveVTT automatically deletes encounters that it had previously created."
};

class DDBApi {

  static #activeRequestCount = 0;
  static #maxConcurrentRequests = 5;
  static #requestQueue = [];

  static #scheduleRequest(request) {
    return new Promise((resolve, reject) => {
      DDBApi.#requestQueue.push(async () => {
        DDBApi.#activeRequestCount++;
        try {
          resolve(await request());
        }
        catch (error) {
          reject(error);
        }
        finally {
          DDBApi.#activeRequestCount--;
          const nextRequest = DDBApi.#requestQueue.shift();
          if (nextRequest) {
            nextRequest();
          }
        }
      });

      if (DDBApi.#activeRequestCount < DDBApi.#maxConcurrentRequests) {
        const nextRequest = DDBApi.#requestQueue.shift();
        if (nextRequest) {
          nextRequest();
        }
      }else{ 
        noisy_log(3, `DDBApi: Request queued. Active requests: ${DDBApi.#activeRequestCount}, Queue length: ${DDBApi.#requestQueue.length}`);
      }
    });
  }

  // retries the same url up to maxRetries times with exponential backoff, so callers don't need to duplicate retry logic per-request
  static async #retryFetch(fn, url, maxRetries = 3, baseDelay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
          console.warn(`DDBApi request failed (attempt ${attempt}/${maxRetries}) for url: ${url}, retrying in ${delay}ms`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.warn(`DDBApi request failed after ${maxRetries} attempts for url: ${url}. This is likely temporary — please refresh the page. If the issue persists, D&D Beyond may be experiencing outages.`, error);
        }
      }
    }
  }

  static async #refreshToken() {
    if (Date.now() < MYCOBALT_TOKEN_EXPIRATION) {
      return MYCOBALT_TOKEN;
    }
    const url = `https://auth-service.dndbeyond.com/v1/cobalt-token`;
    const config = { method: 'POST', credentials: 'include' };
    noisy_log("DDBApi is refreshing auth token");
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
      const error = new Error(`DDB 410 Error`);
      showError(error, `<b>Try clearing <div style="backdrop-filter: brightness(0.8);padding: 0px 3px;display: inline-block;border-radius: 5px;">${navigator.userAgent.indexOf("Firefox") != -1 ? `temporary cached files and pages` : `cached images and files`}</div> and restarting the browser.</b>`, `<br/><b>As long as you do <span style='color: #900;'>not</span> clear <div style="backdrop-filter: brightness(0.8);padding: 0px 3px;display: inline-block;border-radius: 5px;">cookies and other site data</div> this should not remove any AboveVTT data.`);
      throw noLogError(error);
    }
    else{
      // We have an error so let's try to parse it
      console.debug("DDBApi.lookForErrors", response);
      const responseJson = await response.json()
        .catch(parsingError => console.error("DDBApi.lookForErrors Failed to parse json", response, parsingError));
      const type = responseJson?.type || `Unknown Error ${response.status}`;
      const messages = responseJson?.errors?.message?.join("; ") || "";
      const error = new Error(`DDB API Error: ${type} ${messages}`);
      throw error;
    }

  }


  static async fetchJsonWithToken(url, extraConfig = {}) {
    return await DDBApi.#retryFetch(async () => {
      const token = await DDBApi.#refreshToken();
      const config = {...extraConfig,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
      const request = await fetch(url, config).then(DDBApi.lookForErrors)
      return await request.json();
    }, url);
  }
  static async #fetchLimitedJsonWithToken(url, extraConfig = {}) {
    return await DDBApi.#scheduleRequest(async () => {
      return await DDBApi.#retryFetch(async () => {
        const token = await DDBApi.#refreshToken();
        const config = {...extraConfig,
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
        const request = await fetch(url, config).then(DDBApi.lookForErrors);
        return request.json();
      }, url);
    });
  }
  static async fetchItemsJsonWithToken(itemsArray = [], page = 0, pageSize = 1000) {
    if(window.ITEMS_CACHE)
      return window.ITEMS_CACHE;

    const fetchPage = async (pageNumber) => {
      const url = `https://character-service.dndbeyond.com/character/v5.1/game-data/items?campaignId=${find_game_id()}&sharingSetting=2&page=${pageNumber}&pageSize=${pageSize}`;
      const response = await DDBApi.fetchJsonWithToken(url);
      if (!response) {
        console.warn(`DDBApi.fetchItemsJsonWithToken received no response for url: ${url}`);
        return { data: [] };
      }
      return response;
    };

    const firstPageResponse = await fetchPage(page);
    const totalItems = firstPageResponse?.pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));
    const remainingPageNumbers = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 1);
    const remainingPages = await Promise.all(remainingPageNumbers.map(fetchPage));

    const mergedItems = [firstPageResponse, ...remainingPages]
      .flatMap(response => response?.data || []);
    window.ITEMS_CACHE = [...(itemsArray || []), ...mergedItems];
    return window.ITEMS_CACHE;
  }
  static async fetchSpellsJsonWithToken(){
    if(window.SPELLS_CACHE)
        return window.SPELLS_CACHE;
    const classes = await DDBApi.#fetchLimitedJsonWithToken(`https://character-service.dndbeyond.com/character/v5/game-data/classes?campaignId=${window.gameId}&sharingSetting=2`);
    const classSpellData = await Promise.all((classes.data || []).map(async (charClass) => {
        const id = charClass.id;
        const [classSpells, classAlwaysKnownSpells] = await Promise.all([
            DDBApi.#fetchLimitedJsonWithToken(`https://character-service.dndbeyond.com/character/v5/game-data/spells?campaignId=${window.gameId}&classId=${id}&classLevel=20&sharingSetting=2`),
            DDBApi.#fetchLimitedJsonWithToken(`https://character-service.dndbeyond.com/character/v5/game-data/always-known-spells?campaignId=${window.gameId}&classId=${id}&classLevel=20&sharingSetting=2`)
        ]);
        return [...(classSpells.data || []), ...(classAlwaysKnownSpells.data || [])];
    }));
    const spells = classSpellData.flat();
    window.SPELLS_CACHE = [...new Map(spells.map(item => [item.definition.id, item])).values()];
    return window.SPELLS_CACHE;
}

  static debounceGetPartyInventory = mydebounce(async() => {
    const partyInventory = await DDBApi.fetchJsonWithToken(`https://character-service.dndbeyond.com/character/v5/party/inventory/${find_game_id()}`);
    window.PARTY_INVENTORY_DATA = partyInventory.data;
    if(window.JOURNAL)
      window.JOURNAL.update_party_available_currency();
    return window.PARTY_INVENTORY_DATA;
  }, 500);
  static async addItemsToPartyInventory(items) {
    DDBApi.postJsonWithToken("https://character-service.dndbeyond.com/character/v5/inventory/item", items);
  }
  static async addCurrenciesToPartyInventory(currencies) {
    DDBApi.putJsonWithToken("https://character-service.dndbeyond.com/character/v5/inventory/currency/transaction", currencies);
  }
  static async addCustomItemToPartyInventory(item){
    DDBApi.postJsonWithToken("https://character-service.dndbeyond.com/character/v5.1/custom/item", item);
  }
  static async fetchHtmlWithToken(url, extraConfig = {}) {
    try{
      const token = await DDBApi.#refreshToken();
      const config = {...extraConfig,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
      const request = await fetch(url, config)
      return await request.text();
    }   
    catch{
      console.warn(`Failed to Fetch: ${url}`);
    }
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
  static async putJsonWithToken(url, body) {
    const config = {
      method: 'PUT',
      body: JSON.stringify(body)
    }
    return await DDBApi.fetchJsonWithTokenOmitCred(url, config);
  }
  static async deleteWithToken(url) {
    const token = await DDBApi.#refreshToken();
    const config = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
    // Explicitly not calling `lookForErrors` here because we don't actually care if this succeeds.
    // We're just trying to clean up anything that we can
    return await fetch(url, config);
  }

  static async fetchMoreInfo(url){
    url = url.replace(/https:\/\/dndbeyond.com/gi, "https:\/\/www.dndbeyond.com")
    const response = await DDBApi.fetchHtmlWithToken(url);
    return response;
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
    noisy_log(`DDBApi.fetchAllEncounters starting`);

    const url = `https://encounter-service.dndbeyond.com/v1/encounters?skip=0&take=99999`;
    const response = await DDBApi.fetchJsonWithToken(`${url}`)
    
    return response.data;
  }


  static async fetchCampaignInfo(campaignId) {
    if(!campaignId)
      return;
    noisy_log("DDBApi.fetchCampaignInfo");
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
    noisy_log("DDBApi.fetchMonsters starting with ids", uniqueMonsterIds);
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
    return await DDBApi.fetchJsonWithToken(url);
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

    const maxRetries = 3;
    const baseDelay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        window.playerUsers = await DDBApi.fetchCampaignCharacters(campaignId);
        characterIds = window.playerUsers.map(c => c.id);
        break;
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
          break;
        }
        catch (fallbackError) {
          if (attempt < maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 8000);
            console.warn(`fetchCampaignCharacterIds: both endpoints failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, fallbackError);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.warn("fetchCampaignCharacterIds: failed to fetch campaign characters after all retries", fallbackError);
            showError(fallbackError, "Failed to load campaign characters. Please refresh the page.");
            return characterIds;
          }
        }
      }
    }
    let playerUser = window.playerUsers.filter(d=> d.id == window.PLAYER_ID)[0]?.userId;
    window.myUser = playerUser ? playerUser : window.CAMPAIGN_INFO.dmId;
    return characterIds;
  }

}
