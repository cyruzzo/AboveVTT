

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
	if (typeof monsterIds === undefined || monsterIds.length === 0) {
		callback([]);
		return;
	}
	if(!open5e){
		let uniqueMonsterIds = [...new Set(monsterIds)];
		const monsterData = await DDBApi.fetchMonsters(uniqueMonsterIds);
		let promises = [];

		for(let i in monsterData){
	       promises.push(new Promise(async (resolve, reject) => {
   		       let moreInfo = await DDBApi.fetchMoreInfo(`${monsterData[i].url}`);
   			   let initiative = $(moreInfo)?.find('.mon-stat-block-2024__attribute:first-of-type .mon-stat-block-2024__attribute-data')?.text();
   			   let treasure = $(moreInfo)?.find('.treasure-link').closest('.tags');
   			   let treasureLinks = treasure.find('a');
   			   treasureLinks.addClass('tooltip-hover');
   			   treasureLinks.attr('data-moreinfo', function(){
   			   	return this.href;
   			   })
   			   treasure = treasure.html();
   			   let gear = $(moreInfo)?.find('.mon-stat-block-2024__tidbit-label:contains("Gear")').siblings('.mon-stat-block-2024__tidbit-data').html();
   		       if(initiative.length>0){
   		           initArray = initiative.trim().split(' ');
   		           const initMod = initArray[0];
   		           const initScore = initArray[1];
   		           monsterData[i].initiativeMod = initMod;
   		           monsterData[i].initiativeScore = initScore;
   		           monsterData[i].treasure = treasure;
   		           monsterData[i].gear = gear;
   		       }
   		       resolve();
	       }))
	       
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


/// builds and returns the loading indicator that covers the iframe
function build_combat_tracker_loading_indicator(subtext = "One moment while we fetch this monster stat block") {
	let loadingIndicator = $(`
		<div class="sidebar-panel-loading-indicator">
			<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;margin-top:100px;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
			<div class="loading-status-indicator__subtext">${subtext}</div>
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
	return loadingIndicator.clone();
}
