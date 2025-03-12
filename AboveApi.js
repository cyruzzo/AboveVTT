/** AboveApi - functions that call the abovevtt api endpoints */

class AboveApiConfig {

  constructor(baseUrl) {
    this.#baseUrl = baseUrl
  }

  /** @return {string} */
  get baseUrl() { return this.#baseUrl; }
  #baseUrl;

  static get dev() {
    return new AboveApiConfig("https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com");
  }
  static get prod() {
    return new AboveApiConfig("https://services.abovevtt.net");
  }
}

class AboveApi {

  static #buildUrl(action, extraParams) {
    const url = `${this.config.baseUrl}/services?action=${action}&campaign=${window.CAMPAIGN_SECRET}`;
    const extraParamString = $.param(extraParams);
    if (extraParamString) {
      return `${url}&${extraParamString}`;
    }
    return url;
  }

  static get config() {
    if (new URLSearchParams(window.location.search).has("dev")) {
      return AboveApiConfig.dev;
    } else if (typeof AVTT_ENVIRONMENT?.baseUrl === "string" && AVTT_ENVIRONMENT.baseUrl.length > 1) {
      return new AboveApiConfig(AVTT_ENVIRONMENT.baseUrl);
    } else {
      return AboveApiConfig.prod;
    }
  };

  static async fetchJson(action, extraParams) {
    const url = this.#buildUrl(action, extraParams);
    const request = await fetch(url);
    const response = await request.json();
    this.checkForErrors(response);
    return response;
  }

  static checkForErrors(response) {
    if (typeof response.message === "string" && response.message.toLowerCase().includes("error")) {
      throw new Error(response.message);
    }
  }

  static async getSceneList() {
    if (!window.DM) return;
    const response = await this.fetchJson("getSceneList");
    if (response.Items && Array.isArray(response.Items)) {
      console.log("AboveApi.getSceneList", response.Items);
      return response.Items.map(item => item.data);
    } else {
      console.log("AboveApi.getSceneList returned an empty list");
      return [];
    }
  }

  static async getCurrentScene() {
    const response = await this.fetchJson("getCurrentScene");
    console.log("AboveApi.getCurrentScene", response);
    if(!window.DM && response.playerscene.players){
      if(response.playerscene[window.PLAYER_ID])
        response.playerscene = response.playerscene[window.PLAYER_ID];
      else
        response.playerscene = response.playerscene.players;
    }
    window.splitPlayerScenes = response.playerscene
    return response;
  }

  // Until we store more than {cloud:1} this isn't necessary
  static async getCampaignData() {
    const response = await this.fetchJson("getCampaignData");
    console.log("AboveApi.getCampaignData", response);
    if(response.Item && response.Item.data) {
      return response.Item.data
    }
    return {};
  }

  // Until we store more than {cloud:1} this isn't necessary
  static async setCampaignData() {
    const config = {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({cloud:1})
    }
    const url = this.#buildUrl("setCampaignData")
    const request = await fetch(url, config);
    const response = await request.json();
    console.log("AboveApi.setCampaignData", response);
    return response;
  }

  static async getScene(sceneId) {
    const response = await this.fetchJson("getScene", {scene: sceneId});
    console.log(`AboveApi.getScene(${sceneId})`, response);
    return response;
  }

  static async exportScenes() {
    const response = await this.fetchJson("export_scenes");
    console.log(`AboveApi.exportScenes`, response);
    return response;
  }

  static async migrateScenes(gameId, scenes) {
    console.debug(`AboveApi.migrateScenes gameId: ${gameId}`, scenes);
    if (!Array.isArray(scenes)) {
      throw new Error(`AboveApi.migrateScenes received the wrong data type: ${typeof scenes}`);
    }
    if (scenes.length === 0) {
      throw new Error(`AboveApi.migrateScenes received an empty list of scenes`);
    }
    for(let i = 0; i<scenes.length; i++){
      if(Array.isArray(scenes[i].tokens)){
        let tokensObject = {}
        for(let token in scenes[i].tokens){

          let tokenId = scenes[i].tokens[token].id;
          tokensObject[tokenId] = scenes[i].tokens[token];   
        } 
        scenes[i].tokens = tokensObject;
      }
    }
    // never upload data urls
    const sanitizedScenes = await normalize_scene_urls(scenes);
    console.log(`AboveApi.migrateScenes about to upload`, sanitizedScenes);
    if(JSON.stringify(sanitizedScenes).length > 4000000 && sanitizedScenes.length>1) {
      let newScenes1 = sanitizedScenes.slice(0, parseInt(sanitizedScenes.length/2))
      let newScenes2 = sanitizedScenes.slice(parseInt(sanitizedScenes.length/2), sanitizedScenes.length)
      await AboveApi.migrateScenes(window.gameId, newScenes1);
      await AboveApi.migrateScenes(window.gameId, newScenes2);
    }
    else{
      const url = this.#buildUrl("migrate");
      const config = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedScenes)
      }

      const request = await fetch(url, config);
      console.log("AboveApi.migrateScenes request", request);
      const response = await request.text();
      console.log("AboveApi.migrateScenes response", response);
      localStorage.setItem(`Migrated${gameId}`, "1");
    }
    
    return sanitizedScenes;
  }

}
