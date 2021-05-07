
function scan_monster(target, stats) {
	target.find(".mon-stat-block__description-block-content p").each(function(idx, element) {

		$(element).find("span[data-rolltype='to hit']").each(function() {
			newblock = $("<div/>");
			newblock.css("display", "inline-block");



			modifier = $(this).text();

			newblock.append("<button data-exp='1d20' data-mod='" + modifier + "' class='above-roll20'>" + modifier + "</button><button class='above-roll20' data-exp='2d20kh1' data-mod='" + modifier + "'>A</button><button class='above-roll20' data-exp='2d20kl1' data-mod='" + modifier + "'>D</button> to hit");

			$(this).replaceWith(newblock);

		});


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

		// KIND OF UGLY COPY PASTE FROM MB handleChat... BUT STILL IT WORKS...

		var newentry = $("<li></li>");
		newentry.attr('class', 'GameLogEntry_GameLogEntry__3EVrE GameLogEntry_Other__2PSbv Flex_Flex__3gB7U Flex_Flex__alignItems-flex-end__YiKos Flex_Flex__justifyContent-flex-start__1lEY5');
		newentry.append($("<p role='img class='Avatar_Avatar__2KZS- Flex_Flex__3gB7U'><img class='Avatar_AvatarPortrait__2dP8u' src='" + stats.data.avatarUrl + "'></p>"));
		var container = $("<div class='GameLogEntry_MessageContainer__UYzc0 Flex_Flex__3gB7U Flex_Flex__alignItems-flex-start__3ZqUk Flex_Flex__flexDirection-column__1v3au'></div>");
		container.append($("<div class='GameLogEntry_Line__1JeGA GameLogEntry_Sender__2LjcO'><span>" + stats.data.name + "</span></div>"));

		var entry = $("<div class='GameLogEntry_Message__1GoY3 GameLogEntry_Collapsed__1fgGY GameLogEntry_Other__2PSbv Flex_Flex__3gB7U'/>");
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
		container.append($("<time datetime='" + datetime + "' class='GameLogEntry_TimeAgo__1T3dC TimeAgo_TimeAgo__XzWqO'></time"));

		newentry.append(container);
		$(".GameLog_GameLogEntries__33O_1").prepend(newentry);
		notify_gamelog();




	});
}


