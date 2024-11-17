class StatHandler {

	constructor() {
		this.cache = {};
		//this.token=token;
	}

	getStat(monsterid, callback, open5eSlug = undefined) {
		let self = this;

		if (monsterid in this.cache) {
			callback(self.cache[monsterid]);
		}
		else if(monsterid == 'open5e'){
			if(open5eSlug in cached_open5e_items){
				callback(cached_open5e_items[open5eSlug].monsterData)
			}
			else{
		        fetch_monsters([open5eSlug], function (response) {
		            if (response !== false) {
		                update_open5e_item_cache(response.map(m => SidebarListItem.open5eMonster(m)));
		            }
					callback(cached_open5e_items[open5eSlug].monsterData)
		        }, true);
			}
		}
		else {
			get_cobalt_token(function(token) {
				$.ajax({
					url: 'https://monster-service.dndbeyond.com/v1/Monster/' + monsterid,
					beforeSend: function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + token);
					},
					xhrFields: {
						withCredentials: true
					},
					success: function(data) {
						self.cache[monsterid] = data;
						callback(data);
					}
				});
			});
		}
	}

	rollInit(monsterid, callback, open5eSlug = undefined, tokenId = undefined, adv=false, dis=false) {
		let dice = adv ? '2d20kh1+' : dis ? '2d20kl1+' : '1d20+'
		if(window.all_token_objects[tokenId]?.options?.combatGroupToken){
			let modArray = [];
			let statArray = [];
			let promises = [];
			for(let i in window.all_token_objects){
				if(i == tokenId)
					continue;
				if(window.all_token_objects[i].options.combatGroup == tokenId){
					if(window.all_token_objects[i].options.monster =='open5e'){
						promises.push(new Promise((resolve, reject) => {
							this.getStat(window.all_token_objects[i].options.monster, function(data) {
								modArray.push(Math.floor((data.stats[1].value - 10) / 2.0));
								statArray.push(data.stats[1].value);	
								resolve();
							}, window.all_token_objects[i].options.itemId);
						}));
					}
					else if(window.all_token_objects[i].options.monster =='customStat'){
						let modifier = (window.all_token_objects[i]?.options?.customInit != undefined) ? parseInt(window.all_token_objects[i].options.customInit) : (window.all_token_objects[i]?.options?.customStat != undefined && window.all_token_objects[i]?.options?.customStat[1]?.mod != undefined) ? parseInt(window.all_token_objects[i].options.customStat[1].mod) : 0;
						modArray.push(modifier);
						statArray.push((window.all_token_objects[i]?.options?.customInit != undefined || (window.all_token_objects[i]?.options?.customStat != undefined && window.all_token_objects[i]?.options?.customStat[1]?.mod != undefined)) ? ((modifier*2)+10) : 0);
					}
					else {
						promises.push(new Promise((resolve, reject) => {
							this.getStat(window.all_token_objects[i].options.monster, function(stat) {
								modArray.push(Math.floor((stat.data.stats[1].value - 10) / 2.0));
								statArray.push(stat.data.stats[1].value);	
								resolve();
							}, window.all_token_objects[i].options.itemId);
						}));
					}
				}
			}

			Promise.all(promises).then(() =>{
				const sumMod = modArray.reduce((a, b) => a + b, 0);
				const modifier = (sumMod / modArray.length) || 0;

				const sumStat = statArray.reduce((a, b) => a + b, 0);
				const stat = (sumStat / statArray.length) || 0;

				let expression = dice + modifier;
				let roll = new rpgDiceRoller.DiceRoll(expression);
				console.log(expression + "->" + roll.total);
				let total = parseFloat(Math.floor(roll.total) + stat/100).toFixed(2);
				let combatSettingData = getCombatTrackersettings();
				if(combatSettingData['tie_breaker'] !='1'){
					total = parseInt(total);
				}
				callback(total);
			});
			
			
		}
		else if(monsterid =='open5e')
		{
			this.getStat(monsterid, function(data) {
				let modifier = Math.floor((data.stats[1].value - 10) / 2.0);
				let expression = dice + modifier;
				let roll = new rpgDiceRoller.DiceRoll(expression);
				console.log(expression + "->" + roll.total);
				let total = parseFloat(roll.total + data.stats[1].value/100).toFixed(2);
				let combatSettingData = getCombatTrackersettings();
				if(combatSettingData['tie_breaker'] !='1'){
					total = parseInt(total);
				}
				callback(total);
			}, open5eSlug);
		}
		else if(monsterid =='customStat'){
			let modifier = (window.TOKEN_OBJECTS[tokenId]?.options?.customInit != undefined) ? parseInt(window.TOKEN_OBJECTS[tokenId].options.customInit) : (window.TOKEN_OBJECTS[tokenId]?.options?.customStat != undefined && window.TOKEN_OBJECTS[tokenId]?.options?.customStat[1]?.mod != undefined) ? parseInt(window.TOKEN_OBJECTS[tokenId].options.customStat[1].mod) : 0;
			let expression = (!isNaN(modifier)) ? dice + modifier : '0';
			let roll = new rpgDiceRoller.DiceRoll(expression);
			let decimalAdd = (window.TOKEN_OBJECTS[tokenId]?.options?.customInit != undefined || (window.TOKEN_OBJECTS[tokenId]?.options?.customStat != undefined && window.TOKEN_OBJECTS[tokenId]?.options?.customStat[1]?.mod != undefined)) ? ((modifier*2)+10)/100 : 0
			console.log(expression + "->" + roll.total);
			let total = parseFloat(roll.total + decimalAdd).toFixed(2);
			let combatSettingData = getCombatTrackersettings();
			if(combatSettingData['tie_breaker'] !='1'){
				total = parseInt(total);
			}
			callback(total);
		}
		else{
			this.getStat(monsterid, function(stat) {
				let modifier = Math.floor((stat.data.stats[1].value - 10) / 2.0);
				let expression = dice + modifier;
				let roll = new rpgDiceRoller.DiceRoll(expression);
				console.log(expression + "->" + roll.total);
				let total = parseFloat(roll.total + stat.data.stats[1].value/100).toFixed(2);
				let combatSettingData = getCombatTrackersettings();
				if(combatSettingData['tie_breaker'] !='1'){
					total = parseInt(total);
				}
				callback(total);
			}, open5eSlug);
		}

		
	}

}