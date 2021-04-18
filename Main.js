function getRandomColorOLD() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //Il max � escluso e il min � incluso
}


function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	var match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
}



window.YTTIMEOUT = null;

function load_scenemap(url, width = null, height = null, callback = null) {
	$("#scene_map").remove();

	if (window.YTTIMEOUT != null) {
		clearTimeout(window.YTTIMEOUT);
		window.YTTIMEOUT = null;
	}


	if (url.includes("youtube.com") || url.includes("youtu.be")) {

		if (width == null) {
			width = 1920;
			height = 1080;
		}

		var newmap = $('<div style="width:' + width + 'px;height:' + height + 'px;position:absolute;top:0;left:0;z-index:10" id="scene_map" />');
		$("#VTT").append(newmap);
		videoid = youtube_parser(url);
		var player = new YT.Player('scene_map', {
			width: width,
			height: height,
			videoId: videoid,
			playerVars: { 'autoplay': 1, 'controls': 0 },
			events: {
				'onStateChange': function(event) { if (event.data == 0) player.seekTo(0); },
				'onReady': function(e) { e.target.mute(); }
			}
		});

		let smooth = function() {
			if (player.playerInfo.playerState != 1) // something went wrong
				return;
			remaining = player.playerInfo.duration - player.playerInfo.currentTime;
			if (remaining < 1) { // we should be able to just skip on the last second
				player.seekTo(0);
				window.YTTIMEOUT = setTimeout(smooth, (player.playerInfo.duration - 0.9) * 1000);
			}
			else {
				window.YTTIMEOUT = setTimeout(smooth, (remaining - 0.9) * 1000);
			}

		};

		window.YTTIMEOUT = setTimeout(smooth, 10000);

		callback();
	}
	else {
		newmap = $("<img id='scene_map' src='scene_map' style='position:absolute;top:0;left:0;z-index:10'>");
		newmap.attr("src", url);
		if (width != null) {
			newmap.width(width);
			newmap.height(height);
		}

		if (callback != null)
			newmap.on("load", callback);
		$("#VTT").append(newmap);
	}

}



function set_pointer(data) {


	let marker = $("<div></div>");
	marker.css({
		"position": "absolute",
		"top": data.y - 5,
		"left": data.x - 5,
		"width": "10px",
		"height": "10px",
		"z-index": "30",
		"border-radius": "50%",
		"opacity": "1.0",
		"border-width": "8px",
		"border-style": "solid",
		"border-color": "blue",
	});
	$("#tokens").append(marker);

	marker.animate({
		opacity: 0,
		width: "120px",
		height: "120px",
		top: data.y - 60,
		left: data.x - 60,
		"border-width": 0,
	}, 5000, function() { marker.remove() });

	// calculate pageX and pageY and scroll there!

	var pageX = Math.round(data.x * window.ZOOM - ($(window).width() / 2));
	var pageY = Math.round(data.y * window.ZOOM - ($(window).height() / 2));
	$("html,body").animate({
		scrollTop: pageY + 200,
		scrollLeft: pageX + 200,
	}, 500);
}

function notify_gamelog() {
	if ($(".glc-game-log").is(":hidden")) {
		$("#switch_gamelog").css("background", "red");
	}
}

function switch_control(e) {
	if (window.BLOCKCONTROLS)
		return;
	$(".sidepanel-content").hide();
	$($(e.target).attr("data-target")).show();


	if ($(e.target).attr("data-target") == ".glc-game-log") {
		$("#switch_gamelog").css('background', '');
	}

	if ($(e.target).attr("data-target") == "#monster-panel" && !window.MONSTERPANEL_LOADED) {
		console.log('in teoria fatto show');
		init_monster_panel();
		window.MONSTERPANEL_LOADED = true;
		window.BLOCKCONTROLS = true;
		setTimeout(function() {
			window.BLOCKCONTROLS = false;

		}, 2000);
	}

}


function load_monster_stat(monsterid) {
	$(".monster_frame").hide();

	iframe_id = "iframe-monster-" + monsterid;
	if ($("#" + iframe_id).length > 0) {
		// RENDI VISIBILE
		oldframe = $("#" + iframe_id);
		oldframe.show();
		oldframe.animate({
			left: '177px'
		}, 500);
		return;
	}

	let container = $("<div class='monster_frame'/>");
	container.attr('id', iframe_id);
	container.css("position", "fixed");
	container.css("left", "-500px"); // 190-1030
	container.css("top", "80px");
	container.css("z-index", "1000");
	container.css("background", "white");
	container.css("width", "900px");
	container.css("height", "450px");
	close_button = $("<button>X</button>");
	close_button.css("position", "absolute");
	close_button.css("right", "0");
	close_button.css("top", "0");
	close_button.css("z-index", "1001");
	close_button.click(function() {
		container.animate({
			left: "-500px"
		}, 500);
		container.hide();
	});
	container.append(close_button);
	//container.css("width","900px");
	let iframe = $("<iframe>");
	iframe.css("position", "absoute");
	iframe.css("left", 0);
	iframe.css("top", 0);
	iframe.css("width", "900px");
	iframe.css("height", "450px"); // UGUALE A COMBAT TRACKER INSIDE
	//iframe.css("transform","scale(0.75)");


	window.StatHandler.getStat(monsterid, function(stats) {

		iframe.on("load", function(event) {
			console.log('carico mostro');
			$(event.target).contents().find("#mega-menu-target").remove();
			$(event.target).contents().find(".site-bar").remove();
			$(event.target).contents().find(".page-header").remove();
			$(event.target).contents().find(".homebrew-comments").remove();
			$(event.target).contents().find("header").hide();
			$(event.target).contents().find("#site-main").css("padding", "0px");

			let img = $(event.target).contents().find(".detail-content").find(".image");
			let statblock = $(event.target).contents().find(".mon-stat-block");
			if (img.length == 1) {
				img.insertAfter(statblock);
				var cast = $("<button>Send IMG To Gamelog</button>");
				img.css("text-align", "center");
				img.append(cast);

				let imgsrc = img.find("a").attr('href');
				cast.click(function() {
					var msgdata = {
						player: window.PLAYER_NAME,
						img: window.PLAYER_IMG,
						text: "<img width='100%' src='" + imgsrc + "'>",
					};

					window.MB.sendMessage('custom/myVTT/chat', msgdata);
					window.MB.handleChat(msgdata);
				});
			}


			scan_monster($(event.target).contents(), stats);
			$(event.target).contents().find("a").attr("target", "_blank");
		});

		iframe.attr('src', stats.data.url.replace("https://www.dndbeyond.com", ""))
	})
	container.append(iframe);
	$("#site").append(container);
	container.animate({
		left: '177px'
	}, 500);
}


function init_controls() {
	$(".sidebar").css("top", "10px");
	$(".sidebar").css("height", "calc(100vh - 10px)");

	$(".sidebar__controls").css("margin", "0px");

	$(".sidebar__controls").css("position", "relative");
	$(".sidebar__controls").css("left", "-30px");

	$("span.sidebar__control-group.sidebar__control-group--lock > button").click(); // CLICKA SU lucchetto
	$(".sidebar__controls").empty();
	hider = $("<button id='hide_rightpanel' data-visible=1></button>").click(function() {
		if ($(this).attr('data-visible') == 1) {
			$(this).attr('data-visible', 0);
			$(".sidebar--right").animate({ "right": "-340px" }, 500);
			$(this).text("<<");
			if (parseInt($("#sheet").css("right")) >= 0) {
				$("#sheet").animate({ right: $(".sidebar__inner").width() - 340 }, 500);
			}

		}
		else {
			$(this).attr('data-visible', 1);
			$(".sidebar--right").animate({ "right": "0px" }, 500);
			$(this).text(">>");
			if (parseInt($("#sheet").css("right")) >= 0) {
				$("#sheet").animate({ right: $(".sidebar__inner").width() }, 500);
			}
		}

	}).text(">>");
	$(".sidebar__controls").append(hider);


	b1 = $("<button id='switch_gamelog' data-target='.glc-game-log'>GAMELOG</button>").click(switch_control);
	$(".sidebar__controls").append(b1);

	if (DM) {
		b2 = $("<button id='switch_characters' data-target='#pcs_list'>PLAYERS</button>").click(switch_control);
		$(".sidebar__controls").append(b2);
		b3 = $("<button id='switch_panel' data-target='#monster-panel'>MONSTERS</button>").click(switch_control);
		$(".sidebar__controls").append(b3);
	}

	b4 = $("<button id='switch_spell' data-target='#spells-panel'>SPELLS</button>").click(switch_control);
	$(".sidebar__controls").append(b4);

}



function ga_heartbeat() {
	ga('AboveVTT.send', 'event', 'keepalive', 'keepalive');
	setTimeout(ga_heartbeat, 5 * 60 * 1000);
}


function init_splash() {
	ga('create', 'UA-189308357-3', 'auto', 'AboveVTT');
	ga('AboveVTT.send', 'pageview');

	setTimeout(ga_heartbeat, 5 * 60 * 1000);

	cont = $("<div id='splash'></div>");
	cont.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");
	cont.css('position', 'fixed');
	cont.css('width', 600);
	cont.css('height', '670px');
	cont.css('top', "10px");
	cont.css('left', ($(window).width() - 640) / 2 + "px");
	cont.css('z-index', 999);
	cont.css('border', '3px solid black');

	cont.append("<h1 style='padding-bottom:2px;margin-bottom:2px;'><img width='350px' src='" + window.EXTENSION_PATH + "assets/logo.png'><div style='margin-left:20px; display:inline;vertical-align:bottom;'>0.0.38</div></h1>");
	cont.append("<div style='font-style: italic;padding-left:50px;font-size:20px;margin-bottom:10px;margin-top:2px; margin-left:50px;'>Fine.. I'll do it myself..</div>");
	cont.append("<p><b>WARNING!</b>This is still a developement version, but some brave adventurers are starting to play on this. If you do play a session (or want to talk in general about this project)<a style='text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'> join the Discord Server</a></p>");
	cont.append("<h4>Useful Links</h4>");
	ul = $("<ul/>");

	ul.append("<li><a style='font-style:bold;text-decoration: underline;' target='_blank' href='https://www.youtube.com/channel/UCrVm9Al59iHE19IcqaKqqXA'>Youtube Channel (demo and in the near future, tutorials)</a></li>");
	ul.append("<li><a style='font-style:bold;text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'>Discord Server</a></li>");
	ul.append("<li><a style='font-style:bold;text-decoration: underline;' target='_blank' href='https://trello.com/b/00FhvA1n/bugtracking'>Trello Roadmap</a></li>");
	ul.append("<li><a style='font-style:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a></li>");
	cont.append(ul);
	cont.append("<br>Author, owner and technowizard: <b>Daniele <i>cyruzzo</i> Martini</b><br>Community & Collaborations Manager: <b>SnailDice (Nadav)</b>");
	cont.append("<h3>Current Patreon Supporters</h3>");
	cont.append("AboveVTT is not financed by any company. It started as a hobby project and I'm dedicating a lot of my time to it. There won't be any paid version. If you like it, and want to see it grow, please consider supporting me on <a style='font-style:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a>");

	patreons = $("<div style='margin-top:10px;'/>");

	l1 = ["GodEater", "John Pilhoefer", "Max Puplett","Kevin Morgan","Jason Deman"];
	l2 = ["Iain Russell<b>the Wizard of Grids</b>", "Lukas Edelmann", "Oliver", "Chad Lenny", "Phillip Geurtz", "Virginia Lancianese", "Daniel Levitus", "RenoGeek", "TheDigifire", "Ryan Purcell", "Jordan Innerarity","adam williams"];
	l3 = ["Daniel Wall", "Jerome Van Vynckt", "Cameron Warner", "Luis Mirandela","Martin Brandt","Emmett Jayhart","Julia Hoffmann","Kristopher McGinnis","Amata (she_her)","Alexander Engel"];

	l1div = $("<div style='width:33%;float:left;'><div style='font-weight:bold;' >Masters of the Realms</div></div>");
	l1ul = $("<ul/>");
	l1div.append(l1ul);
	for (i = 0; i < l1.length; i++)
		l1ul.append($("<li/>").text(l1[i]));

	l2div = $("<div style='width:33%;float:left;'><div style='font-weight:bold;'>Heroes of the Realms</div></div>");
	l2ul = $("<ul/>");
	l2div.append(l2ul);
	for (i = 0; i < l2.length; i++)
		l2ul.append($("<li/>").html(l2[i]));

	l3div = $("<div style='width:33%;float:left;'><div style='font-weight:bold;'>Local Heroes</div></div>");
	l3ul = $("<ul/>");
	l3div.append(l3ul);
	for (i = 0; i < l3.length; i++)
		l3ul.append($("<li/>").text(l3[i]));

	patreons.append(l1div).append(l2div).append(l3div)

	cont.append(patreons);
	cont.click(function() {
		$("#splash").remove();

	});


	$(window.document.body).append(cont);



}


function sortGameLog(e) {
	/*if(Math.abs(Math.abs($(".GameLog_GameLog__3XDNT").scrollTop()) -  $(".GameLog_GameLog__3XDNT").prop("scrollHeight")) < 500 ){
		return;	 // DO NOT SORT WHEN AT THE TOP
	} */

	var prescroll = $(".GameLog_GameLog__3XDNT").scrollTop();
	$(".GameLog_GameLog__3XDNT").scrollTop(0);
	console.log($(".GameLog_GameLog__3XDNT").prop("scrollHeight") + "--- " + Math.abs($(".GameLog_GameLog__3XDNT").scrollTop()));
	$(".GameLog_GameLogEntries__33O_1").off('DOMNodeInserted', sortGameLog);

	var items = $(".GameLog_GameLogEntries__33O_1").children().sort(
		function(a, b) {
			var vA = Date.parse($("time", a).attr('datetime'));
			var vB = Date.parse($("time", b).attr('datetime'));
			return (vA > vB) ? -1 : (vA < vB) ? 1 : 0;
		});
	$(".GameLog_GameLogEntries__33O_1").append(items);

	// SHOW ELEMENT IF GAMELOG IS HIDDEN
	cloned_entry = $($(e.target).clone(true));
	if ($("#hide_rightpanel").attr('data-visible') === "0" && (cloned_entry.find(".DiceMessage_Pending__30N8v").length == 0) && !cloned_entry.is("svg")) {
		cloned_entry.css("border-radius", "10px 10px 10px 10px");
		cloned_entry.css("border", "2px solid black");
		cloned_entry.css("background", "rgba(255,255,255,0.95)");
		console.log(cloned_entry);

		if ($("#temporary_gamelog").length == 0) {
			var t = $("<ul id='temporary_gamelog'/>");
			t.css("position", "fixed");
			t.css("bottom", "0px");
			t.css("right", "0px");
			t.css("width", "340px");
			//t.css("background","rgba(255,255,255,0.95)");
			$("body").append(t);
		}

		$("#temporary_gamelog").append(cloned_entry);


		cloned_entry.delay(10000).animate({ opacity: 0 }, 4000, function() {
			$(this).remove();
			if ($("#temporary_gamelog").children().length == 0)
				$("#temporary_gamelog").remove();
		})
	}

	$(".GameLog_GameLog__3XDNT").scrollTop(prescroll);

	$(".GameLog_GameLogEntries__33O_1").on('DOMNodeInserted', sortGameLog);
}



// UNIFIED TOKEN HANDLING
var MYCOBALT_TOKEN = false;
var MYCOBALT_TOKEN_EXPIRATION = 0;
function get_cobalt_token(callback) {

	if (Date.now() < MYCOBALT_TOKEN_EXPIRATION) {
		console.log("TOKEN IS CACHED");
		callback(MYCOBALT_TOKEN);
		return;
	}
	console.log("GETTING NEW TOKEN");
	$.ajax({
		url: "https://auth-service.dndbeyond.com/v1/cobalt-token",
		type: "post",
		xhrFields: {
			// To allow cross domain cookies
			withCredentials: true
		},
		success: function(data) {
			console.log("GOT NEW TOKEN");
			MYCOBALT_TOKEN = data.token;
			MYCOBALT_TOKEN_EXPIRATION = Date.now() + (data.ttl * 1000) - 10000;
			callback(data.token);
		}
	});
}


function init_spells() {


	var panel = $("<div id='spells-panel' class='sidepanel-content'/>");
	panel.hide();
	var iframe = $("<iframe id='iframe-spells-panel'></iframe>");
	iframe.attr("src", "/spells");

	iframe.height(window.innerHeight - 50);
	iframe.css("width", "100%");
	iframe.on('load', function(e) {
		$(event.target).contents().find("#site-main").css("padding", "0");
		$(event.target).contents().find("header").hide();
		//$(event.target).contents().find(".main-filter-container").hide();
		$(event.target).contents().find("#mega-menu-target").remove();
		$(event.target).contents().find(".site-bar").remove();
		$(event.target).contents().find(".page-header").remove();
		$(event.target).contents().find(".homebrew-comments").remove();
		$(event.target).contents().find("#footer").hide();
		$(event.target).contents().find("body").on("click", "a", function(e) {
			if ($(this).attr('href') != "/spells")
				$(this).attr("target", "_blank");
		});
	});


	panel.append(iframe);
	$(".sidebar__pane-content").append(panel);
	$(window).resize(function() {
		$("#iframe-spells-panel").height(window.innerHeight - 50);
	});

}


function open_player_sheet(sheet_url) {

	let container = $("<div id='sheet'></div>");
	let iframe = $("<iframe src='" + sheet_url + "'></iframe>");
	iframe.css("width", "100%");

	container.append(iframe);
	container.css('position', 'fixed');



	if (!window.DM) {
		container.css('right', $(".sidebar__inner").width() - 1530);
		container.css('z-index', 0);
	}
	else {
		container.css("right", $(".sidebar__inner").width() + parseInt($(".sidebar").css("right")));
		container.css("z-index", 99999999);
		if ($("#sheet").length > 0) { // DESTROY ANY PREVIOUS SHEET AND ULOCKIT
			data = {
				player_sheet: $("#sheet iframe").attr('src')
			};
			window.MB.sendMessage("custom/myVTT/unlock", data);
			$("#sheet").remove();
		}
		// LOCK!
		data = {
			player_sheet: sheet_url
		};
		window.MB.sendMessage("custom/myVTT/lock", data);

		var close_button = $("<button>X</button>");

		close_button.css("position", "absolute");
		close_button.css("top", "0px");
		close_button.css("right", "0px");
		close_button.click(function() {
			data = {
				player_sheet: $("#sheet iframe").attr('src')
			};
			window.MB.sendMessage("custom/myVTT/unlock", data);
			$("#sheet").remove();
		});
		container.append(close_button);


	}


	container.css('width', 1030);
	container.css('top', 40);
	container.height($(".sidebar__inner").height() - 20);
	iframe.height(container.height() - 20);

	iframe.on("load", function(event) {
		$(event.target).contents().find("#mega-menu-target").remove();
		$(event.target).contents().find(".site-bar").remove();
		$(event.target).contents().find(".page-header").remove();
		$(event.target).contents().find(".homebrew-comments").remove();

		// CHARACTER
		let tokenid = sheet_url;
		var synchp = function() {
			console.log('sinco HP');
			var hp_element = $(event.target).contents().find(".ct-health-summary__hp-group--primary > div:nth-child(1) .ct-health-summary__hp-number");

			if (hp_element.length > 0) {
				var current_hp = hp_element.html();
				var max_hp = $(event.target).contents().find(".ct-health-summary__hp-group--primary > div:nth-child(3) .ct-health-summary__hp-number").html();
			}
			else {
				var current_hp = 0;
				if (!window.DM && window.PLAYERDATA.max_hp > 0)
					max_hp = window.PLAYERDATA.max_hp;
				else
					max_hp = 0;

			}


			var pp = $(event.target).contents().find(".ct-senses > .ct-senses__callouts:first-child .ct-senses__callout-value");

			let conditions = [];
			var conds_tag = $(event.target).contents().find(".ct-conditions-summary .ddbc-condition__name");

			conds_tag.each(function(el, idx) {
				conditions.push($(this).text());
			});


			var playerdata = {
				id: sheet_url,
				hp: current_hp,
				max_hp: max_hp,
				ac: $(event.target).contents().find(".ddbc-armor-class-box__value").html(),
				pp: pp.html(),
				conditions: conditions
			};

			if (!window.DM) {
				window.PLAYERDATA = playerdata;
				window.MB.sendMessage('custom/myVTT/playerdata', window.PLAYERDATA);
			}
			else {
				window.MB.handlePlayerData(playerdata);
			}

		};

		// DETECT CHANGES ON HEALTH, WAIT 1 SECOND AND LOCK TO AVOID TRIGGERING IT TOO MUCH AND CAUSING ISSUES
		$(event.target).contents().find("#site").on("DOMSubtreeModified", ".ct-quick-info__health,.ct-combat__statuses-group--conditions", function() {
			if (window.WAITING_FOR_SYNCHP)
				return;
			else {
				window.WAITING_FOR_SYNCHP = true;
				setTimeout(function() {
					window.WAITING_FOR_SYNCHP = false;
					synchp();
				}, 1000);
			}
		});

		var mutation_target = $(event.target).contents().get(0);
		var mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };

		var observer = new MutationObserver(function(mutations) {
			console.log('scattai');
			var sidebar = $(event.target).contents().find(".ct-sidebar__pane-content");
			if (sidebar.length > 0) {
				if ($(event.target).contents().find("#castbutton").length == 0) {
					console.log("creating button");
					observer.disconnect();
					var b = $("<button id='castbutton'>SEND TO GAMELOG</button>");
					b.click(function() {
						var newobj = $(event.target).contents().find(".ct-sidebar__pane-content").clone();
						newobj.hide();
						$(event.target).contents().find(".ct-sidebar__pane-content").parent().append(newobj);
						newobj.find("button,select,input").each(function() { $(this).remove() });
						newobj.find("div,span").each(function() {
							var newcss = {
								display: $(this).css('display'),
								'font-style': $(this).css('font-style'),
								'font-weight': $(this).css('font-weight'),
								'margin': $(this).css('margin'),
								'font-size': $(this).css('font-size'),
								'background-image': $(this).css('background-image'),
							};
							if ($(this).css("background-image") != "none") {
								newcss.width = $(this).width();
								newcss.height = $(this).height();
								newcss.background = $(this).css("background");
								newcss['background-size'] = $(this).css("background-size");
							}

							console.log(newcss);
							$(this).css(newcss);
						});

						html = newobj.html();
						newobj.remove();
						console.log(html);
						data = {
							player: window.PLAYER_NAME,
							img: window.PLAYER_IMG,
							text: html
						};
						window.MB.sendMessage('custom/myVTT/chat', data);
						window.MB.handleChat(data);


					});


					$(event.target).contents().find(".ct-sidebar__pane-content").prepend(b);

					observer.observe(mutation_target, mutation_config);
				}
			}
		});

		observer.observe(mutation_target, mutation_config);


		setTimeout(synchp, 10000); // <- HACK...
		//setTimeout(function(){$(event.target).contents().find(".ct-character-header__group--game-log").remove();},10000); // AND OTHER HACK!
	});
	$("#site").append(container);

	if (!window.DM) {
		sheet_button = $("<button id='sheet_button'>SHEET</button>");
		sheet_button.css("position", "absolute");
		sheet_button.css("top", 0);
		sheet_button.css("right", 343);
		sheet_button.css("z-index", 999999);

		$(".sidebar__controls").append(sheet_button);
		$(window.document.body).append(container);

		sheet_button.click(function(e) {
			if (container.css("z-index") > 0) {
				container.animate({
					right: $(".sidebar__inner").width() - 1530,
					'z-index': 0
				}, 500);

				container.css('width', '1030');

				return;
			}
			//container.height($(".sidebar__inner").height());
			container.height($(".sidebar__inner").height() - 20);
			iframe.height(container.height() - 20);

			container.css("z-index", 99999999);
			container.animate({
				//right: $(".sidebar__inner").width()
				right: $(".sidebar__inner").width() + parseInt($(".sidebar").css("right"))
			}, 500);

		});
	}


}



function init_ui() {
	window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
	window.STARTING = true;
	var gameid = $("#message-broker-lib").attr("data-gameId");
	init_splash();
	window.TOKEN_OBJECTS = {};
	window.REVEALED = [];
	window.DRAWINGS = [];
	window.MONSTERPANEL_LOADED = false;
	window.BLOCKCONTROLS = false;
	window.PLAYER_STATS = {};


	window.MB = new MessageBroker();
	window.StatHandler = new StatHandler();

	if (DM) {
		window.ScenesHandler = new ScenesHandler(gameid);
		init_scene_selector();
	}
	// ATTIVA GAMELOG
	$(".gamelog-button").click();
	$(".glc-game-log").addClass("sidepanel-content");
	$(".sidebar").zIndex(99999);
	$("#site").children().hide();


	$(".GameLog_GameLogEntries__33O_1").on('DOMNodeInserted', sortGameLog);


	// AGGIUNGI CHAT
	$(".glc-game-log").append($("<div><input id='chat-text' style='width:260px; height:30px; margin-bottom:20px;'></div>"));
	$("#chat-text").on('keypress', function(e) {
		if (e.keyCode == 13) {
			e.preventDefault();
			text = $("#chat-text").val();
			$("#chat-text").val("");

			if (text.startsWith("/roll")) {
				expression = text.substring(6);
				roll = new rpgDiceRoller.DiceRoll(expression);
				text = roll.output;
			}
			data = {
				player: window.PLAYER_NAME,
				img: window.PLAYER_IMG,
				text: text
			};
			window.MB.sendMessage('custom/myVTT/chat', data);
			window.MB.handleChat(data);
		}

	});

	s = $("<script src='https://meet.jit.si/external_api.js'></script>");
	$("#site").append(s);

	s = $("<script src='https://www.youtube.com/iframe_api'></script>");
	$("#site").append(s);

	background = $("<img id='scene_map'></img>");
	background.css("top", "0");
	background.css("left", "0");
	background.css("position", "absolute");
	background.css("z-index", "10");


	draw_overlay = $("<canvas id='draw_overlay'></canvas>");
	draw_overlay.css("position", "absolute");
	draw_overlay.css("top", "0");
	draw_overlay.css("left", "0");
	draw_overlay.css("z-index", "18");

	grid = $("<canvas id='grid_overlay'></canvas>");
	grid.css("position", "absolute");
	grid.css("top", "0");
	grid.css("left", "0");

	grid.css("z-index", "19");


	fog = $("<canvas id='fog_overlay'></canvas>");
	fog.css("top", "0");
	fog.css("left", "0");
	fog.css("position", "absolute");
	fog.css("z-index", "20");


	fog.dblclick(function(e) {
		e.preventDefault();

		var mousex = Math.round((e.pageX - 200) * (1.0 / window.ZOOM));
		var mousey = Math.round((e.pageY - 200) * (1.0 / window.ZOOM));

		console.log("mousex " + mousex + " mousey " + mousey);

		data = {
			x: mousex,
			y: mousey,
		}

		set_pointer(data);

		window.MB.sendMessage("custom/myVTT/pointer", data)
	});

	// AVOID ANNOYING TEXT SELECTIONS
	$("body").disableSelection();

	/*fog.on("",function(){
	//	if(!$("#select-button").hasClass("button-enabled"))
		//	deselect_all_tokens();
	});*/
	fog.on("mousedown", function(e) {
		if (e.button == 0)
			deselect_all_tokens();
	});

	window.ZOOM = 1.0;
	VTT = $("<div id='VTT' style='position:absolute; top:0px;left:0px;transform: scale(1.0);'/>");

	//VTT.css("margin-left","200px");
	//VTT.css("margin-top","200px");
	//VTT.css("padding-right","400px");
	//VTT.css("padding-bottom","400px");

	tokens = $("<div id='tokens'></div>");
	tokens.css("position", "absolute");
	tokens.css("top", 0);
	tokens.css("left", 0);

	VTT.append(tokens);
	VTT.append(background);
	VTT.append(fog);
	VTT.append(grid);
	VTT.append(draw_overlay);

	wrapper = $("<div id='VTTWRAPPER'/>");
	wrapper.css("margin-left", "200px");
	wrapper.css("margin-top", "200px");
	wrapper.css("paddning-right", "200px");
	wrapper.css("padding-bottom", "200px");
	wrapper.css("position", "absolute");
	wrapper.css("top", "0px");
	wrapper.css("left", "0px");
	wrapper.width(window.width);
	wrapper.height(window.height);





	wrapper.append(VTT);
	$("body").append(wrapper);

	black_layer = $("<div id='black_layer'/>");
	black_layer.width(window.width);
	black_layer.height(window.height);
	black_layer.css("position", "absolute");
	black_layer.css("top", "0px");
	black_layer.css("left", "0px");
	black_layer.css("background", "black");
	black_layer.css("opacity", "0");
	$("body").append(black_layer);
	black_layer.animate({ opacity: "1" }, 5000);
	black_layer.css("z-index", "-1");


	if (!DM) {
		setTimeout(function() {
			window.MB.sendMessage("custom/myVTT/syncmeup");
		}, 5000);
	}

	init_controls();
	if (window.DM)
		init_pclist();

	$(".sidebar__pane-content").css("background", "rgba(255,255,255,1)");


	init_buttons();
	

	if (!window.DM) {

		open_player_sheet(window.PLAYER_SHEET, true);

		iframe = $("#sheet");

	}

	// ZOOM BUTTON
	zoom_section = $("<div id='zoom_buttons' />");

	zoom_minus = $("<button id='zoom_minus'>-</button>");
	zoom_minus.click(function() {
		if (window.ZOOM > 0.1) {

			var centerX = Math.round((($(window).scrollLeft() + $(window).width() / 2) - 200) * (1.0 / window.ZOOM));
			var centerY = Math.round((($(window).scrollTop() + $(window).height() / 2) - 200) * (1.0 / window.ZOOM));
			window.ZOOM = window.ZOOM * 0.9;
			var pageX = Math.round(centerX * window.ZOOM - ($(window).width() / 2)) + 200;
			var pageY = Math.round(centerY * window.ZOOM - ($(window).height() / 2)) + 200;

			$("#VTT").css("transform", "scale(" + window.ZOOM + ")");
			$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 400);
			$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 400);
			$("#black_layer").width($("#scene_map").width() * window.ZOOM + 400);
			$("#black_layer").height($("#scene_map").height() * window.ZOOM + 400)

			$(window).scrollLeft(pageX);
			$(window).scrollTop(pageY);

		}
	})
	zoom_section.append(zoom_minus);

	zoom_center = $("<button>=</button>");
	zoom_center.click(function() {
		var centerX = Math.round((($(window).scrollLeft() + $(window).width() / 2) - 200) * (1.0 / window.ZOOM));
		var centerY = Math.round((($(window).scrollTop() + $(window).height() / 2) - 200) * (1.0 / window.ZOOM));
		window.ZOOM = (60.0 / window.CURRENT_SCENE_DATA.hpps);
		var pageX = Math.round(centerX * window.ZOOM - ($(window).width() / 2)) + 200;
		var pageY = Math.round(centerY * window.ZOOM - ($(window).height() / 2)) + 200;
		$("#VTT").css("transform", "scale(" + window.ZOOM + ")");
		$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 400);
		$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 400);
		$("#black_layer").width($("#scene_map").width() * window.ZOOM + 400);
		$("#black_layer").height($("#scene_map").height() * window.ZOOM + 400);
		$(window).scrollLeft(pageX);
		$(window).scrollTop(pageY);
	});
	zoom_section.append(zoom_center);

	zoom_plus = $("<button id='zoom_plus'>+</button>");
	zoom_plus.click(function() {

		var centerX = Math.round((($(window).scrollLeft() + $(window).width() / 2) - 200) * (1.0 / window.ZOOM));
		var centerY = Math.round((($(window).scrollTop() + $(window).height() / 2) - 200) * (1.0 / window.ZOOM));
		window.ZOOM = window.ZOOM * 1.10;
		var pageX = Math.round(centerX * window.ZOOM - ($(window).width() / 2)) + 200;
		var pageY = Math.round(centerY * window.ZOOM - ($(window).height() / 2)) + 200;

		$("#VTT").css("transform", "scale(" + window.ZOOM + ")");
		$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 400);
		$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 400);
		$("#black_layer").width($("#scene_map").width() * window.ZOOM + 400);
		$("#black_layer").height($("#scene_map").height() * window.ZOOM + 400)
		$(window).scrollLeft(pageX);
		$(window).scrollTop(pageY);

	});

	zoom_section.append(zoom_plus);

	if(window.DM){
		zoom_section.css("left","-100px");
	}
	else{
		zoom_section.css("left","-180px");
	}
	$(".sidebar__controls").append(zoom_section);

	init_combat_tracker();
	if (window.DM) {
		token_menu();
	}
	
	
	

	init_spells();

	setTimeout(function() {
		window.ScenesHandler.switch_scene(window.ScenesHandler.current_scene_id, ct_load); // LOAD THE SCENE AND PASS CT_LOAD AS CALLBACK
	}, 5000);

	setTimeout(function() {
		window.STARTING = false;
	}, 6000);



	create_jitsi_button();

	// EXPERRIMENTAL DRAG TO MOVE
	var curDown = false,
		curYPos = 0,
		curXPos = 0;

	$(window).mousemove(function(m) {
		if (curDown) {
			window.scrollBy(curXPos - m.pageX, curYPos - m.pageY)
		}
	});

	$(window).mousedown(function(m) {
		// CONTROLLA SE FA CASINIIIIIIIIIIIIIIII
		curYPos = m.pageY;
		curXPos = m.pageX;
		if (m.button == 2) { // ONLY THE RIGHT CLICK
			//e.preventDefault();
			curDown = true;
			$("body").css("cursor", "grabbing");
			//return false;
		}


	});

	$(window).mouseup(function() {
		curDown = false;
		$("body").css("cursor", "");
	});




	$("#fog_overlay").bind("contextmenu", function(e) {
		return false;
	});

	// EXPERIMENTAL MOUSEWHEEL TO ZOOM

	/*$("#fog_overlay").on("mousewheel", function(event){
	//	console.log("wheeeeeling");
		event.preventDefault();
    	const delta = Math.sign(event.originalEvent.deltaY);
		oldzoom=parseFloat($("#VTT").css("zoom"));
		//console.log(event);
		if(delta<0){
			
			$("#zoom_plus").click();
		}
		else if(delta>0){
			if(oldzoom > 0.1){
				imagex = Math.round(event.pageX * (1.0/$("#VTT").css("zoom")));
				imagey = Math.round(event.pageY * (1.0/$("#VTT").css("zoom")));
				console.log("Before ex,ey"+event.pageX+" "+event.pageY +"->"+imagex+" "+imagey);
				$("#VTT").css("zoom",oldzoom-0.02);
				var pageX = Math.round(imagex * $("#VTT").css("zoom"));  
				var pageY = Math.round(imagey * $("#VTT").css("zoom"));
				console.log("After -> " +pageX+" "+pageY);
				
				window.scrollTo(pageX-event.mouseX,pageY-event.mouseY);
			}
		}
		return false;
	})*/;

}


function init_buttons() {

	var clear_button = $("<button style='width:75px;'>ALL</button>");
	clear_button.click(function() {

		r = confirm("This will delete all FOG zones and REVEAL ALL THE MAP to the player. Are you sure?");
		if (r == true) {
			window.REVEALED = [[0, 0, $("#scene_map").width(), $("#scene_map").height()]];
			redraw_canvas();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});

	var hide_all_button = $("<button style='width:75px;'>ALL</button>");
	hide_all_button.click(function() {
		r = confirm("This will delete all FOG zones and HIDE ALL THE MAP to the player. Are you sure?");
		if (r == true) {
			window.REVEALED = [];
			redraw_canvas();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});


	fog_menu = $("<div class='top_menu'></div>");
	fog_menu.append("<div style='font-weight: bold;'>Reveal</div>");
	fog_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='rect' data-type=0>Square</button></div>");
	fog_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='arc'  data-type=0>Circle</button></div>");
	fog_menu.append($("<div/>").append(clear_button));
	fog_menu.append("<div style='font-weight: bold;'>Hide</div>");
	fog_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='rect' data-type=1>Square</button></div>");
	fog_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='arc' data-type=1>Circle</button></div>");
	fog_menu.append($("<div/>").append(hide_all_button));
	fog_menu.hide();
	fog_menu.css("position", "fixed");
	fog_menu.css("top", "25px");
	fog_menu.css("width", "75px");
	fog_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")
	$("body").append(fog_menu);
	

	buttons = $("<div/>")
	$("body").append(buttons);
	
	if (window.DM)
		buttons.append($("<button style='display:inline; width:75px;' id='select-button' class='drawbutton' data-shape='select'>SELECT</button>"));
		
	buttons.append($("<button style='display:inline;width:75px;;' id='measure-button' class='drawbutton' data-shape='measure'>MEASURE</button>"));
	fog_button = $("<button style='display:inline;width:75px;' id='fog_button'>FOG</button>");
	
	if (window.DM)
		buttons.append(fog_button);
	fog_menu.css("left",fog_button.position().left);

	draw_menu = $("<div class='top_menu'></div>");
	draw_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='rect' data-type='draw'>Square</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='arc' data-type='draw'>Circle</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='cone' data-type='draw'>Cone</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='line' data-type='draw'>Line</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawbutton' data-shape='rect' data-type='eraser'>Erase</button></div>");
	draw_menu.append("<div><button id='delete_drawing'style='width:75px'>ERASE ALL</button></div>");

	draw_menu.find("#delete_drawing").click(function() {
		r = confirm("DELETE ALL DRAWINGS?");
		if (r === true) {
			window.DRAWINGS = [];
			redraw_drawings();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});

	colors = $("<div/>");

	for (i = 0; i < 20; i++) {
		c = $("<div class='coloroption'/>");
		c.width(15);
		c.height(15);
		c.css("background", "#" + TOKEN_COLORS[i]);
		c.css("float", "left");
		colors.append(c);

		c.click(function(e) {
			$(".coloroption").css('border', '').removeClass('colorselected');
			$(this).css('border', '2px solid black');
			$(this).addClass('colorselected');
		});
	}

	draw_menu.append(colors);
	draw_menu.append("<div style='font-weight:bold'>Type</div>");
	draw_menu.append("<div><button style='width:75px' class='drawType' data-value='transparent'>TRANSP</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawType' data-value='border'>BORDER</button></div>");
	draw_menu.append("<div><button style='width:75px' class='drawType' data-value='filled'>FILLED</button></div>");

	draw_menu.find(".drawType").click(function(e) {
		$(".drawType").removeClass('drawTypeSelected');
		$(".drawType").css('background', '');
		$(this).addClass('drawTypeSelected');
		$(this).css('background', 'green');
	});


	draw_menu.hide();
	draw_menu.css("position", "fixed");
	draw_menu.css("top", "25px");
	draw_menu.css("width", "75px");
	draw_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(draw_menu);

	draw_button = $("<button style='display:inline;width:75px' id='draw_button'>DRAW</button>");

	if (window.DM){
		buttons.append(draw_button);
		draw_menu.css("left",draw_button.position().left);
		
	}

	buttons.css("position", "fixed");
	buttons.css("top", '5px');
	buttons.css("left", '5px');

	fog_button.click(function(e) {
		$(this).toggleClass('button-selected');
		if ($(this).hasClass('button-selected')) {
			fog_menu.show();
			draw_menu.hide();
			$("#draw_button").removeClass('button-selected');
		}
		else {
			fog_menu.hide();
		}
	});

	draw_button.click(function(e) {
		$(this).toggleClass('button-selected');
		if ($(this).hasClass('button-selected')) {
			fog_menu.hide();
			$("#fog_button").removeClass('button-selected');
			draw_menu.show();
		}
		else {
			draw_menu.hide();
		}
	});

	

	draw_menu.find(".drawType").first().click();
	draw_menu.find(".coloroption").first().click();

	setup_draw_buttons();
}


$(function() {
	$(".ddb-campaigns-detail-header-secondary-sharing").append($("<a style='color:white;background: #1b9af0;' class='btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='joindm'>AboveVTT JOIN AS DM</a>"));

	$("#joindm").click(function(e) {
		e.preventDefault();
		window.DM = true;
		window.PLAYER_SHEET = false;
		window.PLAYER_NAME = "THE DM";
		window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
		init_ui();
	});

	//$(".ddb-campaigns-detail-header-secondary-sharing").append($("<button onclick='DM=false;init_ui();return false;'>VTT AS PLAYER</button>"));


	$(".ddb-campaigns-character-card-footer-links").each(function() {
		let sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr('href');
		let img = $(this).parent().parent().find('.user-selected-avatar').css('background-image');
		let name = $(this).parent().parent().find(".ddb-campaigns-character-card-header-upper-character-info-primary").html();
		if (img)
			img = img.replace(/url\("(.*)"\)/, "$1");
		else
			img = "https://www.dndbeyond.com/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";

		newlink = $("<a style='color:white;background: #1b9af0;' href='#' class='ddb-campaigns-character-card-footer-links-item'>JOIN AboveVTT</a>");

		newlink.click(function(e) {
			e.preventDefault();
			window.PLAYER_IMG = img;
			window.PLAYER_SHEET = sheet;
			window.PLAYER_NAME = name;
			window.DM = false;
			init_ui();
		});

		$(this).prepend(newlink);

		console.log('Sheet: ' + sheet + "img " + img);
	});

	delete_button = $("<a class='btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above-delete'>Delete ALL AboveVTT Data</a>");
	$(".ddb-campaigns-detail-header-secondary-sharing").append(delete_button);
	delete_button.click(function() {
		if (confirm("Are you sure?")) {
			gameid = $("#message-broker-lib").attr("data-gameId");
			localStorage.removeItem("ScenesHandler" + gameid);
			localStorage.removeItem("current_source" + gameid);
			localStorage.removeItem("current_chapter" + gameid);
			localStorage.removeItem("current_scene" + gameid);

		}
		else {
			console.log('user canceled');
		}
	});

});

