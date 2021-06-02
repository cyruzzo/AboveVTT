
function scan_monster(target, stats) {
	target.find(".mon-stat-block__description-block-content p").each(function(idx, element) {

		$(element).find("span[data-rolltype='to hit']").each(function() {
			newblock = $("<div/>");
			newblock.css("display", "inline-block");



			modifier = $(this).text();

			newblock.append("<button data-exp='1d20' data-mod='" + modifier + "' class='above-roll20'>" + modifier + "</button><button class='above-roll20' data-exp='2d20kh1' data-mod='" + modifier + "'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='" + modifier + "'>D</button> to hit");

			$(this).replaceWith(newblock);
			newblock = $("<div/>");
			newblock.css("display", "inline-block");


		});
		
		$(element).find("span[data-rolltype='damage']").each(function(){
			newblock = $("<div/>");
			newblock.css("display", "inline-block");
			dice_notation=$(this).attr('data-dicenotation');
			dice_damagetype=$(this).attr('data-rolldamagetype')
			newblock.append(`<button data-rolldamagetype='${dice_damagetype}' data-exp='${dice_notation}' data-mod='' class='above-roll20'>${dice_notation}</button><button data-rolldamagetype='${dice_damagetype}' data-exp='${dice_notation}' class='above-roll20' data-mod='CRIT'>CRIT</button>`);
			$(this).replaceWith(newblock);

		})


		// those two covers "text parsing" for things that do not support the new DDB roll notations
		description = $(element).html();
		description = description.replace(/([\+-][0-9]+) to hit/, "<button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button> to hit");


		description = description.replaceAll(/\(([0-9]+d[0-9]+( [\+-] [0-9]+)?)\)/g, "(<button data-exp='$1' data-mod='' class='above-roll20'>$1</button><button data-exp='$1' class='above-roll20' data-mod='CRIT'>CRIT</button>)");
		$(element).html(description);
		
	});

	statnew = target.find(".ability-block").html().replaceAll(/\(([\+\-]?[0-9]+)\)/g, "<br><button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button>");
	target.find(".ability-block").html(statnew);

	tidbits = target.find(".mon-stat-block__tidbits").html();
	newtidbits = tidbits.replaceAll(/([\+\-] ?[0-9][0-9]?)/g, "<button data-exp='1d20' data-mod='$1' class='above-roll20'>$1</button><button class='above-roll20' data-exp='2d20kh1' data-mod='$1'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='$1'>D</button>");
	target.find(".mon-stat-block__tidbits").html(newtidbits);


	console.log('set handler');
	target.on("click", ".above-roll20", function(e) {
		dice = $(this).attr('data-exp');
		mod = $(this).attr('data-mod');

		if (mod && mod == "CRIT") {
			mod = dice.replace(/^([0-9]+d[0-9]+).*$/, "$1");
		}

		if (mod && mod.charAt(0) != "+")
			mod = "+" + mod;
		else
			mod = mod;

		expression = dice + mod;
		console.log(expression);
		roll = new rpgDiceRoller.DiceRoll(expression);

		let output_beauty = roll.output.replace(/=(.*)/, "= <b>$1</b>")
		

		if($(this).attr('data-rolldamagetype')){
			output_beauty+= " <b>"+$(this).attr('data-rolldamagetype')+"</b>";
		}

		// KIND OF UGLY COPY PASTE FROM MB handleChat... BUT STILL IT WORKS...

		var newentry = $("<li></li>");
		newentry.attr('class', 'GameLogEntry_GameLogEntry__2EMUj GameLogEntry_Other__1rv5g Flex_Flex__3cwBI Flex_Flex__alignItems-flex-end__bJZS_ Flex_Flex__justifyContent-flex-start__378sw');
		newentry.append($("<p role='img' class='Avatar_Avatar__131Mw Flex_Flex__3cwBI'><img class='Avatar_AvatarPortrait__3cq6B' src='" + stats.data.avatarUrl + "'></p>"));
		var container = $("<div class='GameLogEntry_MessageContainer__RhcYB Flex_Flex__3cwBI Flex_Flex__alignItems-flex-start__HK9_w Flex_Flex__flexDirection-column__sAcwk'></div>");
		container.append($("<div class='GameLogEntry_Line__3fzjk Flex_Flex__3cwBI Flex_Flex__justifyContent-space-between__1FcfJ'><span>" + stats.data.name + "</span></div>"));

		var entry = $("<div class='GameLogEntry_Message__1J8lC GameLogEntry_Collapsed__1_krc GameLogEntry_Other__1rv5g Flex_Flex__3cwBI'/>");
		var dblock=$("<div class='d-block' />").append($("<div/>").append(output_beauty))
		entry.append(dblock);
		var send_button = $("<div class='text-center'><button>Send to Players</button></div>");

		dblock.append(send_button);
		send_button.click(function() {
			data = {
				player: stats.data.name,
				img: stats.data.avatarUrl,
				text: output_beauty
			};
			$(this).remove();
			window.MB.sendMessage('custom/myVTT/chat', data);
		});


		container.append(entry);


		var d = new Date();
		var datetime = d.toISOString();
		container.append($("<time datetime='" + datetime + "' class='GameLogEntry_TimeAgo__zZTLH TimeAgo_TimeAgo__2M8fr'></time"));

		newentry.append(container);
		$(".GameLog_GameLogEntries__3oNPD").prepend(newentry);
		notify_gamelog();




	});
}


