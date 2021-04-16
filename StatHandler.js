class StatHandler {

	constructor() {
		this.cache = {};
		//this.token=token;
	}

	getStat(monsterid, callback) {
		let self = this;

		if (monsterid in this.cache) {
			callback(self.cache[monsterid]);
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

	rollInit(monsterid, callback) {
		this.getStat(monsterid, function(stat) {
			var modifier = Math.round((stat.data.stats[1].value - 10) / 2.0);
			var expression = "1d20+" + modifier;
			var roll = new rpgDiceRoller.DiceRoll(expression);
			console.log(expression + "->" + roll.total);
			callback(roll.total);
		});
	}

}