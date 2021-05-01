function init_monster_panel() {
	panel = $("<div id='monster-panel' class='sidepanel-content'></div>");


	iframe = $("<iframe id='iframe-monster-panel'></iframe>");


	iframe.on("load", function(event) {
		$(event.target).contents().find("body").css("zoom", "0.8");
		console.log('sistemo panello mostro');

		$(event.target).contents().find(".encounter-builder__header").hide();
		$(event.target).contents().find(".release-indicator").hide();
		$(event.target).contents().find("#site-main").css("padding", "0");
		$(event.target).contents().find("header").hide();
		$(event.target).contents().find(".main-filter-container").hide();
		$(event.target).contents().find("#mega-menu-target").remove();
		$(event.target).contents().find(".site-bar").remove();
		$(event.target).contents().find(".page-header").remove();
		$(event.target).contents().find(".homebrew-comments").remove();
		$(event.target).contents().find("#footer").hide();
		$(event.target).contents().find(".encounter-builder__sidebar").remove();


		var list = $(event.target).contents().find(".monster-listing__body");
		// Add helper tooltip (first time only)
		if (!localStorage.getItem("MonsterPanelTooltipDismissed")) {
			var markup = `
				<div
					id="monster-tooltip"
					style="
						background: #fff;
						border-radius: 3px;
						border: 15px solid #59b4f3;
						font-size: 16px;
						font-weight: bold;
						margin-bottom: 4px;
						padding: 10px;
						text-align: left;
					"
				>
					Did you know?
					Right-click "+" to add monster as hidden
					<span
						class="close"
						style="
							cursor: pointer;
							float: right;
							font-size: 24px;
							font-weight: bold;
							line-height: 24px;
							padding: 0 5px;
						"
					>
						×
					</span>
				</div>
			`;

			// Add tooltip above the monster list
			$(list).before(markup);
			var tooltip = $(event.target).contents().find("#monster-tooltip");
			console.log("the tooltip", tooltip);

			// Remove tooltip and don't show again
			if (tooltip) {
				tooltip.on("click", ".close", function() {
					localStorage.setItem("MonsterPanelTooltipDismissed", true);
					$(tooltip).remove();
				});
			}

			// To test this:
			// localStorage.removeItem("MonsterPanelTooltipDismissed")
		}



		list.on("contextmenu", "button.monster-row__add-button", function(e) {
			e.preventDefault();
		});

		list.on("mousedown", "button.monster-row__add-button", function(e) {


			e.stopPropagation();
			e.target = this; // hack per passarlo a token_button
			let button = $(this);
			console.log(button.outerHTML());

			img = button.parent().parent().find("img");

			if (img.length > 0) {
				url = img.attr('src');
			}
			else {
				url = "";
			}

			mname = button.parent().parent().find(".monster-row__name").html();
			button.attr("data-name", mname);
			var monsterid = $(this).parent().parent().parent().attr('id').replace("monster-row-", "");

			button.attr('data-img', url);
			button.attr('data-stat', monsterid);

			if (e.button == 2) {
				button.attr('data-hidden', 1)
			}
			else
				button.removeAttr('data-hidden');


			window.StatHandler.getStat(monsterid, function(stat) {
				if (stat.data.sizeId == 5)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 2);
				if (stat.data.sizeId == 6)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 3);
				if (stat.data.sizeId == 7)
					button.attr("data-size", Math.round(window.CURRENT_SCENE_DATA.hpps) * 4);
				button.attr('data-hp', stat.data.averageHitPoints);
				button.attr('data-maxhp', stat.data.averageHitPoints);
				button.attr('data-ac', stat.data.armorClass);
				token_button(e);
			})




		});

		list.on("click", ".monster-row", function() { // BAD HACKZZZZZZZZZZZZZ
			var monsterid = $(this).attr("id").replace("monster-row-", "");
			window.StatHandler.getStat(monsterid, function(stat) {
				setTimeout(function() {
					scan_monster($("#iframe-monster-panel").contents().find(".ddbeb-modal"), stat);
					$("#iframe-monster-panel").contents().find(".add-monster-modal__footer").remove();
				}, 1000);

			});



		});
	});
	panel.append(iframe);
	$(".sidebar__pane-content").append(panel);
	iframe.css("width", "100%");

	$("#iframe-monster-panel").height(window.innerHeight - 50);

	$(window).resize(function() {
		$("#iframe-monster-panel").height(window.innerHeight - 50);
	});
	iframe.attr("src", "/encounter-builder");
}

