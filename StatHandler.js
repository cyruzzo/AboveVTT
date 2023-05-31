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
				fetch_and_cache_monsters([open5eSlug], function (open5e = false) {          
	                callback(cached_open5e_items[open5eSlug].monsterData);         
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

	rollInit(monsterid, callback, open5eSlug = undefined) {
		if(monsterid =='open5e')
		{
			this.getStat(monsterid, function(data) {
				var modifier = Math.floor((data.stats[1].value - 10) / 2.0);
				var expression = "1d20+" + modifier;
				var roll = new rpgDiceRoller.DiceRoll(expression);
				console.log(expression + "->" + roll.total);
				callback(roll.total);
			}, open5eSlug);
		}
		else{
			this.getStat(monsterid, function(stat) {
				var modifier = Math.floor((stat.data.stats[1].value - 10) / 2.0);
				var expression = "1d20+" + modifier;
				var roll = new rpgDiceRoller.DiceRoll(expression);
				console.log(expression + "->" + roll.total);
				callback(roll.total);
			}, open5eSlug);
		}
		
	}

}