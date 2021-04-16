function init_pclist() {
	pcs_list = $("<div id='pcs_list' class='sidepanel-content'/>");
	$(".sidebar__pane-content").append(pcs_list);
	pcs_list.hide();
	update_pclist();

}


function update_pclist() {

	pcs_list = $("#pcs_list");
	pcs_list.empty();

	window.pcs = [];
	$(".ddb-campaigns-character-card").each(function(idx) {
		tmp = $(this).find(".ddb-campaigns-character-card-header-upper-character-info-primary");
		name = tmp.html();
		tmp = $(this).find(".user-selected-avatar");
		if (tmp.length > 0)
			image = tmp.css("background-image").slice(5, -2); // url("x") TO -> x
		else
			image = "/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";
		sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr("href");

		pc = {
			name: name,
			image: image,
			sheet: sheet,
			data: {}
		};
		console.log("trovato sheet " + sheet);
		window.pcs.push(pc);


	});




	var NEXT_COLOR = 0;
	window.pcs.forEach(function(item, index) {

		color = "#" + TOKEN_COLORS[NEXT_COLOR++];

		pc = item;
		row = $("<div/>");
		row.css("padding", "20px");

		player_name = $("<div/>");
		player_name.text(pc.name).css("background", color).css("font-weight", "bold");
		player_name.attr('data-nextcolor', NEXT_COLOR);
		row.append(player_name);

		row_inside = $("<div/>");
		row_inside.css('border', '1px solid black');
		row_inside.css("width", "100%");
		row_inside.css("float", "left");
		row.append(row_inside);

		row_inside.append($("<div style='float:left;'><img width=60 height=60 src='" + pc.image + "'></div>"));

		stats = $("<div/>");
		stats.css("float", "left");

		stats.append("<div><div><b>HP:</b></div><div class='hp'>-</div></div>");
		stats.append("<div><div><b>AC:</b></div><div class='ac'>-</div></div>");
		stats.append("<div><div><b>Passive Perception:</b></div><div class='pp'>-</div></div>");

		row_inside.append(stats);

		conditions = $("<div style='float:left;'/>");
		conditions.append("<div><b>Conditions</b></div>");
		conditions.append("<div class='conditions'></div>");

		row_inside.append(conditions);

		if (pc.sheet in window.PLAYER_STATS) {
			data = window.PLAYER_STATS[pc.sheet];

			stats.find(".hp").text(data.hp + "/" + data.max_hp);
			stats.find(".ac").text(data.ac);
			stats.find(".pp").text(data.pp);

			for (var i = 0; i < data.conditions.length; i++)
				conditions.find(".conditions").append($("<div/>").text(data.conditions[i]));
		}



		buttons = $("<div/>");

		btn_token = $("<button data-set-token-id='" + pc.sheet + "' data-img='" + pc.image + "'>ADD TOKEN</button>");
		btn_token.attr("data-name", pc.name);
		btn_token.click(token_button);

		if (pc.sheet in window.PLAYER_STATS) {
			data = window.PLAYER_STATS[pc.sheet];
			btn_token.attr('data-hp', data['hp']);
			btn_token.attr('data-ac', data['ac']);
			btn_token.attr('data-maxhp', data['max_hp']); // maxhp , max-hp, max_hp .. WHY AM I DOING THIS TO MYSELF?!?!?!?!?!

		}
		btn_token.attr('data-color', color);
		buttons.append(btn_token);

		view_button = $("<button data-target='" + pc.sheet + "'>VIEW SHEET</button>");

		view_button.click(function(e) {
			open_player_sheet($(e.target).attr('data-target'));
		});

		buttons.append(view_button);

		row.append(buttons);

		pcs_list.append(row);
	});

}
