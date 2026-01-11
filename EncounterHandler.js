

class EncounterHandler {

	/** @return {string} the id of the ABoveVTT encounter that we created for this session */
	avttId;

	/** @return {object} a map of DDB encounter objects where the key is the encounter id and the value is the encounter object */
	encounters = {};

	/** @return {object} the AboveVTT encounter object that we created for this session */
	get avttEncounter() {
		return this.encounters[this.avttId];
	}

	constructor(avttId) {
		if (typeof avttId === "string" && avttId.length > 0) {
			this.avttId = avttId;
		} else if (is_encounters_page()) {
			let urlId = window.location.pathname.split("/").pop();
			this.avttId = urlId;
		} else {
			throw new Error(`Failed to create EncounterHandler with avttId: ${avttId} on page ${window.location.href}`);
		}
		this.encounters = {};
	}

	async fetchAllEncounters() {
		const encounterList = await DDBApi.fetchAllEncounters();
		encounterList.forEach(encounter => this.encounters[encounter.id] = encounter);
		return this.encounters;
	}

	/// We build an encounter named `AboveVTT` this will fetch it if it exists, and create it if it doesn't
	fetch_encounter(encounterId, callback) {
		if (typeof callback !== 'function') {
			callback = function(){};
		}
		if (this.encounters[encounterId] !== undefined) {
			callback(this.encounters[encounterId]);
			return;
		}
		DDBApi.fetchEncounter(encounterId)
			.then(encounter => {
				window.EncounterHandler.encounters[encounter.id] = encounter;
				callback(encounter);
			})
			.catch(error => {
				console.warn(`fetch_encounter failed`, error);
				callback(false, error);
			});
	}

	fetch_encounter_monsters(encounterId, callback) {
		if (typeof callback !== 'function') {
			console.warn("fetch_encounter_monsters was called without a callback");
			return;
		}
		let encounter = this.encounters[encounterId];
		if (encounter?.monsters === undefined || encounter.monsters === null || encounter.monsters.length === 0) {
			// nothing to fetch
			callback([]);
			return;
		}
		let monsterIds = encounter.monsters.map(m => m.id);
		if (monsterIds.length > 0) {
			console.log("fetch_encounter_monsters starting");
			fetch_monsters(monsterIds, callback);
		}
	}

}

async function fetch_monsters(monsterIds, callback, open5e=false) {
	if (typeof callback !== 'function') {
		console.warn("fetch_monsters was called without a callback.");
		return;
	}
	if( !Array.isArray(monsterIds) ){
		console.warn("fetch_monsters was called without a valid array of monster IDs.");
		callback([]);
		return;
	}
	monsterIds = monsterIds.filter(id => id !== null);
	if (typeof monsterIds === undefined || monsterIds.length === 0) {
		callback([]);
		return;
	}
	if(!open5e){
		let uniqueMonsterIds = [...new Set(monsterIds)];
		const monsterData = await DDBApi.fetchMonsters(uniqueMonsterIds);
		let promises = [];

		for(let i=0; i<monsterData.length; i++){
		   if(monsterData[i].isReleased || monsterData[i].isHomebrew){
		       promises.push(new Promise(async (resolve, reject) => {

	   		       let moreInfo = await DDBApi.fetchMoreInfo(`${monsterData[i].url}`);
	   			   let treasure = $(moreInfo)?.find('.treasure-link').closest('.tags');
	   			   let treasureLinks = treasure.find('a');
	   			   treasureLinks.addClass('tooltip-hover');
	   			   treasureLinks.attr('data-moreinfo', function(){
	   			   	return this.href;
	   			   })
	   			   treasure = treasure.html();
	   			   let gear = $(moreInfo)?.find('.mon-stat-block-2024__tidbit-label:contains("Gear")').siblings('.mon-stat-block-2024__tidbit-data').html();
	   		       let initMod, initScore;

	   		        monsterData[i].treasure = treasure;
	   		        monsterData[i].gear = gear;
	   		       

	   		       resolve();
		       }))
		   }  
		}

		Promise.all(promises).then(() => {
			callback(monsterData);
		});
	}
	else{
		let uniqueMonsterIds = [...new Set(monsterIds)];
		let queryParam = uniqueMonsterIds.map(id => `${id}`).join("%2C");
		let groupOpen5e = await getGroupOpen5e(queryParam);
		callback(groupOpen5e);	
	}
}



