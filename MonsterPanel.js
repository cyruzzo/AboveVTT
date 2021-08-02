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
		$(event.target).contents().find("footer").remove();
		$(event.target).contents().find(".encounter-builder__sidebar").remove();
		$(event.target).contents().find(".dice-rolling-panel").remove();

		var list = $(event.target).contents().find(".monster-listing__body");

		// prevent right click menu on the monster image so we can use our own custom menu
		list.on("contextmenu", ".monster-row__cell--avatar", function(e) {
			e.preventDefault();
		});

		// present our own custom monster image menu
		list.on("mousedown", ".monster-row__cell--avatar", function(e) {

			e.stopPropagation();
			e.target = this; // hack per passarlo a token_button

			let monsterImage = $(this);
			let monsterid = monsterImage.parent().parent().attr('id').replace("monster-row-", "");
			let ogImgSrc = monsterImage.find('img').attr('src');

			if ($.find("#custom-img-src-anchor").length == 0) {
				// contextMenu doesn't seem to be able to use elements inside the monster panel iframe so
				// inject an element outside of the monster panel iframe
				// then display a contextMenu from that point.
				$('<span id="custom-img-src-anchor" style="position:absolute;" />').insertBefore(panel);
			}
			$("#custom-img-src-anchor").css("top", e.pageY + "px");
			$("#custom-img-src-anchor").data("monster-id", monsterid);
			$("#custom-img-src-anchor").data("monster-og-img-src", ogImgSrc);

			// open our context menu
			$("#custom-img-src-anchor").contextMenu();
		});

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

