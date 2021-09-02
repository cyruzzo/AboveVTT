
function parse_img(url){
	retval=url;
	if(retval.startsWith("https://drive.google.com") && retval.indexOf("uc?id=") < 0)
		retval='https://drive.google.com/uc?id=' + retval.split('/')[5];
	return retval;
}


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

// Constrains a number between a minimum and maximum value
function clamp (number, min, max) {
	return Math.min(Math.max(number, min), max)
}

function youtube_parser(url) {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	var match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

const MAX_ZOOM = 5
const MIN_ZOOM = 0.1
function change_zoom(newZoom, x, y) {
	var zoomCenterX = x || $(window).width() / 2
	var zoomCenterY = y || $(window).height() / 2
	var centerX = Math.round((($(window).scrollLeft() + zoomCenterX) - 200) * (1.0 / window.ZOOM));
	var centerY = Math.round((($(window).scrollTop() + zoomCenterY) - 200) * (1.0 / window.ZOOM));
	window.ZOOM = newZoom;
	var pageX = Math.round(centerX * window.ZOOM - zoomCenterX) + 200;
	var pageY = Math.round(centerY * window.ZOOM - zoomCenterY) + 200;

	$("#VTT").css("transform", "scale(" + window.ZOOM + ")");
	$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 1400);
	$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 1400);
	$("#black_layer").width($("#scene_map").width() * window.ZOOM + 1400);
	$("#black_layer").height($("#scene_map").height() * window.ZOOM + 1400)
	$(window).scrollLeft(pageX);
	$(window).scrollTop(pageY);
}

function decrease_zoom() {
	if (window.ZOOM > MIN_ZOOM) {
		change_zoom(window.ZOOM * 0.9)
	}
}

function reset_zoom () {
	change_zoom(60.0 / window.CURRENT_SCENE_DATA.hpps);
}

function increase_zoom() {
	change_zoom(window.ZOOM * 1.10)
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
		window.YTPLAYER = new YT.Player('scene_map', {
			width: width,
			height: height,
			videoId: videoid,
			playerVars: { 'autoplay': 1, 'controls': 0 },
			events: {
				'onStateChange': function(event) {  if (event.data == 0) window.YTPLAYER.seekTo(0); },
				'onReady': function(e) { window.YTPLAYER.setVolume($("#youtube_volume").val()); }
			}
		});
		

		let smooth = function() {
			if (window.YTPLAYER.playerInfo.playerState != 1){ // something went wrong. tries to reset
				window.YTPLAYER.seekTo(0);
				window.YTPLAYER.playVideo();
				window.YTTIMEOUT = setTimeout(smooth, (window.YTPLAYER.playerInfo.duration - 1.6) * 1000);
				return;
			}
			remaining = window.YTPLAYER.playerInfo.duration - window.YTPLAYER.playerInfo.currentTime;
			if (remaining < 2) { // we should be able to just skip on the last second
				window.YTPLAYER.seekTo(0);
				window.YTTIMEOUT = setTimeout(smooth, (window.YTPLAYER.playerInfo.duration - 1.6) * 1000);
			}
			else {
				window.YTTIMEOUT = setTimeout(smooth, (remaining - 1.6) * 1000);
			}
		};

		window.YTTIMEOUT = setTimeout(smooth, 5000);

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



function set_pointer(data,dontscroll=false) {

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

	if(!dontscroll){
		var pageX = Math.round(data.x * window.ZOOM - ($(window).width() / 2));
		var pageY = Math.round(data.y * window.ZOOM - ($(window).height() / 2));
		$("html,body").animate({
			scrollTop: pageY + 200,
			scrollLeft: pageX + 200,
		}, 500);
	}
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
	$($(e.currentTarget).attr("data-target")).show();


	if ($(e.currentTarget).attr("data-target") == ".glc-game-log") {
		$("#switch_gamelog").css('background', '');
	}

	if ($(e.currentTarget).attr("data-target") == "#monster-panel" && !window.MONSTERPANEL_LOADED) {
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
			left: '220px'
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
	container.css("width", "850px");
	container.css("height", "450px");
	close_button = $("<button>X</button>");
	close_button.css("position", "absolute");
	close_button.css("left", "0");
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

					window.MB.inject_chat(msgdata);
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
		left: '220px'
	}, 500);
}


function init_controls() {
	$(".sidebar").css("top", "10px");
	$(".sidebar").css("height", "calc(100vh - 45px)");

	$("span.sidebar__control-group.sidebar__control-group--lock > button").click(); // CLICKA SU lucchetto
	$(".sidebar__controls").empty();
	hider = $("<button id='hide_rightpanel' class='hasTooltip button-icon hideable' data-name='Show/hide sidebar (q)' data-visible=1></button>").click(function() {
		if ($(this).attr('data-visible') == 1) {
			$(this).attr('data-visible', 0);
			$(".sidebar--right").animate({ "right": "-340px" }, 500);
			$(this).addClass("point-left").removeClass("point-right");
			if (parseInt($("#sheet").css("right")) >= 0) {
				$("#sheet").animate({ right: 343 - 340 }, 500);
			}

		}
		else {
			$(this).attr('data-visible', 1);
			$(".sidebar--right").animate({ "right": "0px" }, 500);
			$(this).addClass("point-right").removeClass("point-left");
			if (parseInt($("#sheet").css("right")) >= 0) {
				$("#sheet").animate({ right: 343 }, 500);
			}
		}

	}).html("<span class='material-icons button-icon'>chevron_right</span>").addClass("point-right");
	$(".sidebar__controls").append(hider);


	b1 = $("<button id='switch_gamelog' class='tab-btn selected-tab hasTooltip button-icon' data-name='Gamelog' data-target='.glc-game-log'></button>").click(switch_control);
	b1.append('<svg class="gamelog-button__icon" width="18" height="18" viewBox="0 0 18 18"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10C15 10.551 14.551 11 14 11H9C8.735 11 8.48 11.105 8.293 11.293L6 13.586V12C6 11.447 5.552 11 5 11H4C3.449 11 3 10.551 3 10V4C3 3.449 3.449 3 4 3H14C14.551 3 15 3.449 15 4V10ZM14 1H4C2.346 1 1 2.346 1 4V10C1 11.654 2.346 13 4 13V16C4 16.404 4.244 16.77 4.617 16.924C4.741 16.975 4.871 17 5 17C5.26 17 5.516 16.898 5.707 16.707L9.414 13H14C15.654 13 17 11.654 17 10V4C17 2.346 15.654 1 14 1ZM12 6H6C5.448 6 5 6.447 5 7C5 7.553 5.448 8 6 8H12C12.552 8 13 7.553 13 7C13 6.447 12.552 6 12 6Z" fill="currentColor"></path></svg>');
	$(".sidebar__controls").append(b1);

	b2 = $("<button id='switch_characters' class='tab-btn hasTooltip button-icon' data-name='Players' data-target='#pcs_list'></button>").click(switch_control);
	b2.append("<img src='"+window.EXTENSION_PATH + "assets/icons/character.svg' height='100%;'>");
	$(".sidebar__controls").append(b2);
	if (DM) {		
		
		b3 = $("<button id='switch_panel' class='tab-btn hasTooltip button-icon' data-name='Monsters' data-target='#monster-panel'></button>").click(switch_control);

		b3.append("<img src='"+window.EXTENSION_PATH + "assets/icons/mimic-chest.svg' height='100%;'>");
		$(".sidebar__controls").append(b3);
		init_tokenmenu();
		b5=$("<button id='switch_tokens' class='tab-btn hasTooltip button-icon' data-name='Tokens' data-target='#tokens-panel'></button>");
		b5.append("<img src='"+window.EXTENSION_PATH + "assets/icons/photo.svg' height='100%;'>");
		b5.click(switch_control);
		$(".sidebar__controls").append(b5);
		
	}
	
	b6 = $("<button id='switch_tokens' class='tab-btn hasTooltip button-icon' data-name='Sounds' data-target='#sounds-panel'></button>");
	b6.append("<img src='" + window.EXTENSION_PATH + "assets/icons/speaker.svg' height='100%;'>");
	b6.click(switch_control);
	$(".sidebar__controls").append(b6);
	
	b4 = $("<button id='switch_spell' class='tab-btn hasTooltip button-icon' data-name='Spells' data-target='#spells-panel'></button>").click(switch_control);
	b4.append("<img src='"+window.EXTENSION_PATH + "assets/icons/magic-wand.svg' height='100%;'>");
	$(".sidebar__controls").append(b4);

	if (DM) {
		b7 = $("<button id='switch_tokens' class='tab-btn hasTooltip button-icon' data-name='Settings' data-target='#settings-panel'></button>");
		b7.append("<img src='" + window.EXTENSION_PATH + "assets/icons/cog.svg' height='100%;'>");
		b7.click(switch_control);
		$(".sidebar__controls").append(b7);
	}

	$(".tab-btn").on("click", function(e) {
		$(".tab-btn").removeClass('selected-tab');
		$(e.currentTarget).toggleClass('selected-tab');
	});

	if (!DM) {
		$(".sidebar__controls").addClass("player");
	}

}

const MAX_ZOOM_STEP = 20
function init_mouse_zoom(){
	window.addEventListener('wheel', function (e) {
		if (e.ctrlKey) {
			e.preventDefault();

			var newScale
			if (e.deltaY > MAX_ZOOM_STEP) {
				newScale = window.ZOOM * 0.9
			}
			else if (e.deltaY < -MAX_ZOOM_STEP) { //-ve, zoom out
				newScale = window.ZOOM * 1.10
			}
			else {
				newScale = window.ZOOM - 0.01 * e.deltaY
			}

			if (newScale > MIN_ZOOM && newScale < MAX_ZOOM) {
				change_zoom(newScale, e.clientX, e.clientY)
			}
		}
	}, { passive: false } )
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

	cont.append("<h1 style='padding-bottom:2px;margin-bottom:2px; text-align:center'><img width='250px' src='" + window.EXTENSION_PATH + "assets/logo.png'><div style='margin-left:20px; display:inline;vertical-align:bottom;'>0.54</div></h1>");
	cont.append("<div style='font-style: italic;padding-left:80px;font-size:20px;margin-bottom:10px;margin-top:2px; margin-left:50px;'>Fine.. I'll do it myself..</div>");
	
	s=$("<div/>");
	//s.append("<div style='display:inline-block;width:300px'>this stuff here<br>and here<br>and here</div>");
	s.append(
		"");
	s.append(`
	<div style='display:inline-block; vertical-align:top;width:300px;'>
	<div style='padding-top:10px;padding-bottom:10px;'>
		This is a <b>FREE</b> passion project <b>still in developement. Some bugs are to be expected</b>If you need help or want to report a bug <a style='text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'> join the Discord Server</a>
	</div>
	<div class='splashLinks'>
		<div class="splashLinkRow">
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://youtu.be/2GZ8q-hB7pg'>Youtube Tutorial</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'>Discord Server</a></div>
		</div>
		<div class="splashLinkRow">
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://trello.com/b/00FhvA1n/bugtracking'>Trello Roadmap</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://github.com/cyruzzo/AboveVTT'>GitHub</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a></div>
		</div>
		
	</div>
	
	</div>
	`
	);
	
	s.append('<iframe width="280" height="157" src="https://www.youtube.com/embed/2GZ8q-hB7pg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
	cont.append(s);
	
	//cont.append("<b>WARNING!</b>This is still a developement version, but a lot of brave adventurers are already playing on this. If you do play a session (or want to talk in general about this project)<a style='text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'> join the Discord Server</a>");
	
	
	/*ul = $("<ul/>");
	ul.append("<li><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://youtu.be/2GZ8q-hB7pg'>Youtube Tutorial</a></li>");
	ul.append("<li><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'>Discord Server</a></li>");
	ul.append("<li><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://trello.com/b/00FhvA1n/bugtracking'>Trello Roadmap</a></li>");
	ul.append("<li><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://github.com/cyruzzo/AboveVTT'>GitHub</a></li>");
	ul.append("<li><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a></li>");
	cont.append(ul);*/
	cont.append("Author, owner and technowizard: <b>Daniele <i>cyruzzo</i> Martini</b><br>Community & Collaborations Manager: <b>SnailDice (Nadav)</b>");
	cont.append("<br>Contributors: <b>Stumpy, Palad1N, KuzKuz, Coryphon, Johnno, Hypergig, JoshBrodieNZ, Kudolpf, Koals, Mikedave</b>");
	cont.append("<h3>Patreon Supporters</h3>");
	cont.append("AboveVTT is not financed by any company. It started as a hobby project and I'm dedicating a lot of my time to it. It's totally opensource and there won't be any paid version. If you like it, and want to see it grow, please consider supporting me on <a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a>");

	patreons = $("<div id='patreons' style='margin-top:9px;'/>");

	l1 = ["Michael Sangregorio","Max Puplett","ZorkFox","Epyk","John Ng","Josh Downing","Zytiga Gaming"];
	l2 = ["Oliver","Iain Russell","RenoGeek","Daniel Levitus","Virginia Lancianese","Phillip Geurtz","Jordan Innerarity","TheDigifire","adam williams","Reginald Coupet","Brendan Shane","Kris Scott","Drago Russo","Ryan Purcell","Lukas Edelmann","Elmer Senson","Chris Johnson","Jordan Cohen","Pucas McDookie","Carl Cedarstaff II","Sarah (ExpQuest)","Tom","Chris Cannon","Scott Moore","Kim Dargeou","Mike Miller"];
	l3 = ["Daniel Wall","Cameron Warner","Amata (she_her)","Julia Hoffmann","Martin Brandt","Alexander Engel","Tommy Girouard-Belhumeur","Cobalt Blue","Kat","Adam Nothnagel","William Geisbert","Daniel Villablanca","Jason Osterbind","nate gonzalez","Fini Plays","Liu XxX","Paul Maloney","damian tier","Danny Pellerin","Randy Zuendel","Brahm","Tim Newton","Chris Sells","Brad Stack","Adam Connor","David Meese","Eduardo Villela","aaron hamilton","Milkmann","CraftyHobo","Cody Vegas Rothwell","Johan Surac","M Mustaqim Mustafa","Aviad Tal","mad4ever","CrazyPitesh","Matt Scullion","Unlucky Archer","Trevor A","Han Dandler","Michael Crane","BelowtheDM","its Bonez","Deku Baba","James Cohen","Cistern","Jon Bond","Robert J Correa","Dan Bosscher","Ofek Shoham","Cheeky Sausage Games","Joseph Bendickson","Blake Thomas","Steve Vlaminck","Victor Waters","Alexander Glass","Jerry Jones","Kevin Young","David Hollenbeck","aDingoAteMyBaby","Miguel  Garcia Jr."];

	l1div = $("<div class='patreons-title'>Masters of the Realms</div>");
	l1ul = $("<ul/>");
	patreons.append(l1div);
	patreons.append(l1ul);
	for (i = 0; i < l1.length; i++)
		l1ul.append($("<li/>").text(l1[i]));

	l2div = $("<div class='patreons-title'>Heroes of the Realms</div>");
	l2ul = $("<ul/>");
	patreons.append(l2div);
	patreons.append(l2ul);
	for (i = 0; i < l2.length; i++)
		l2ul.append($("<li/>").html(l2[i]));

	l3div = $("<div class='patreons-title'>Local Heroes</div>");
	l3ul = $("<ul/>");
	patreons.append(l3div);
	patreons.append(l3ul);
	for (i = 0; i < l3.length; i++)
		l3ul.append($("<li/>").text(l3[i]));

	//patreons.append(l1div).append(l2div).append(l3div)

	cont.append(patreons);
	cont.click(function() {
		$("#splash").remove();

	});

	let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal" ><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`);
	cont.append(closeButton);

	$(window.document.body).append(cont);



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
		container.css('right', 343 - 1530);
		container.css('z-index', 0);
	}
	else {
		container.css("right", 343 + parseInt($(".sidebar").css("right")));
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
		close_button.css("left", "0px");
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

		
		// DICE STREAMING ?!?!
		if(!window.DM){
			let firstTime=false;
			if(!window.MYMEDIASTREAM)
				firstTime=true;
			window.MYMEDIASTREAM=$(event.target).contents().find(".dice-rolling-panel__container").get(0).captureStream(0);
			
			
			if(window.JOINTHEDICESTREAM){
				// we should tear down and reconnect
				for(let i in window.STREAMPEERS){
					console.log("replacing the track")
					window.STREAMPEERS[i].getSenders()[0].replaceTrack(window.MYMEDIASTREAM.getVideoTracks()[0]);
				}
			}
			
			if(firstTime)
				$("#stream_button").click();
				
		}

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
				if (!window.DM && window.PLAYERDATA && window.PLAYERDATA.max_hp > 0)
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

			abilities = [];

			const isScore = (val) => {
				return val.indexOf('+') >= 0 || val.indexOf('-') >= 0;
			}

			$(event.target).contents().find('.ct-quick-info__ability').each(function() {
				let abilityScores;
				if (isScore($(this).find('.ddbc-ability-summary__secondary').text())) {
					abilityScores = {
						abilityName: $(this).find('.ddbc-ability-summary__label').text(),
						abilityAbbr: $(this).find('.ddbc-ability-summary__abbr').text(),
						modifier: `${$(this).find('.ddbc-signed-number__sign').text()}${$(this).find('.ddbc-signed-number__number').text()}`,
						score: $(this).find('.ddbc-ability-summary__primary button').text()
					}
				} else {
					abilityScores = {
						abilityName: $(this).find('.ddbc-ability-summary__label').text(),
						abilityAbbr: $(this).find('.ddbc-ability-summary__abbr').text(),
						modifier: `${$(this).find('.ddbc-signed-number__sign').text()}${$(this).find('.ddbc-signed-number__number').text()}`,
						score: $(this).find('.ddbc-ability-summary__secondary').text()
					};
				}
				abilities.push(abilityScores);
			});


			var playerdata = {
				id: sheet_url,
				hp: current_hp,
				max_hp: max_hp,
				ac: $(event.target).contents().find(".ddbc-armor-class-box__value").html(),
				pp: pp.html(),
				conditions: conditions,
				abilities,
				walking: `${$(event.target).contents().find(".ct-quick-info__box--speed .ddbc-distance-number__number").text()}${$(event.target).contents().find(".ct-quick-info__box--speed .ddbc-distance-number__label").text()}`,
				inspiration: $(event.target).contents().find('.ct-inspiration__status--active').length
			};

			if (!window.DM) {
				window.PLAYERDATA = playerdata;
				window.MB.sendMessage('custom/myVTT/playerdata', window.PLAYERDATA);
			}
			else {
				window.MB.handlePlayerData(playerdata);
			}

			// FIX DDB BUG ON Z-INDEX FOR RIGHT CLICK CONTEXT MENU FOR ROLLING (piggybacking on synchp)
			if($(event.target).contents().find(".ct-sidebar").length > 0)
				$(event.target).contents().find(".ct-sidebar").zIndex(11);
		};

		// DETECT CHANGES ON HEALTH, WAIT 1 SECOND AND LOCK TO AVOID TRIGGERING IT TOO MUCH AND CAUSING ISSUES
		$(event.target).contents().find("#site").on("DOMSubtreeModified", ".ct-quick-info__health,.ct-combat__statuses-group--conditions,"+
			".ct-inspiration__status,.ct-combat__summary-group--ac,.ct-speed-box__box-value", function() {
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
						newobj.find("img.ct-item-detail__full-image-img").css("max-width", "270px");
						newobj.find(".stat-block-finder").css("display", "flex !important");
						newobj.find(".stat-block-finder").css("flex-wrap", "wrap");
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
						window.MB.inject_chat(data);


					});


					$(event.target).contents().find(".ct-sidebar__pane-content").prepend(b);

					observer.observe(mutation_target, mutation_config);
				}
			}
		});

		observer.observe(mutation_target, mutation_config);

		const waitToSync = (timeElapsed = 0) => {
			setTimeout(() => {
				var ac_element = $(event.target).contents().find(".ct-combat .ddbc-armor-class-box");
				if (ac_element.length > 0) {
					synchp();
				} else {
					if (timeElapsed < 15000) {
						waitToSync(timeElapsed + 500);
					}
				}
			}, 500);
		};
		waitToSync();
		//setTimeout(function(){$(event.target).contents().find(".ct-character-header__group--game-log").remove();},10000); // AND OTHER HACK!
	});
	$("#site").append(container);

	if (!window.DM) {
		sheet_button = $("<button id='sheet_button' class='hasTooltip button-icon hideable' data-name='Show/hide character sheet (SPACE)'>SHEET</button>");
		sheet_button.css("position", "absolute");
		sheet_button.css("top", 0);
		sheet_button.css("left", -86);
		sheet_button.css("z-index", 999999);

		$(".sidebar__controls").append(sheet_button);
		$(window.document.body).append(container);

		sheet_button.click(function(e) {
			if (container.css("z-index") > 0) {
				container.animate({
					right: 343 - 1530,
					'z-index': 0
				}, 500);

				container.css('width', '1030');
				
				if(window.STREAMTASK){
					clearInterval(window.STREAMTASK);
					window.STREAMTASK=false;
				}

				return;
			}
			//container.height($(".sidebar__inner").height());
			container.height($(".sidebar__inner").height() - 20);
			
			if(window.JOINTHEDICESTREAM){
				iframe.contents().find(".dice-rolling-panel__container").get(0).height=600;
				iframe.contents().find(".dice-rolling-panel__container").height(600);
				
				if(!window.STREAMTASK){
						window.STREAMTASK=setInterval(() => {
							if(window.MYMEDIASTREAM.requestFrame)
								window.MYMEDIASTREAM.requestFrame(); // Firefox :( 
							else
							window.MYMEDIASTREAM.getVideoTracks()[0].requestFrame(); // Chrome :|
						} ,1000 / 30)
				}
			}
			
			iframe.height(container.height() - 20);

			container.css("z-index", 99999999);
			container.animate({
				//right: $(".sidebar__inner").width()
				right: 343 + parseInt($(".sidebar").css("right"))
			}, 500);

		});
	}


}



function init_ui() {
	window.STARTING = true;
	var gameid = $("#message-broker-client").attr("data-gameId");
	init_splash();
	window.TOKEN_OBJECTS = {};
	window.REVEALED = [];
	window.DRAWINGS = [];
	window.MONSTERPANEL_LOADED = false;
	window.BLOCKCONTROLS = false;
	window.PLAYER_STATS = {};
	window.TOKEN_SETTINGS = $.parseJSON(localStorage.getItem('TokenSettings' + gameid)) || {};
	window.CURRENTLY_SELECTED_TOKENS = [];
	window.TOKEN_PASTE_BUFFER = [];
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};

	window.MB = new MessageBroker();
	window.StatHandler = new StatHandler();
	
	
	
	



	
	

	if (DM) {
		window.ScenesHandler = new ScenesHandler(gameid);
		init_scene_selector();
	}
	// ATTIVA GAMELOG
	$(".gamelog-button").click();
	$(".glc-game-log").addClass("sidepanel-content");
	$(".sidebar").zIndex(9999);
	$("#site").children().hide();
	$(".sidebar__controls").width(340);


	// AGGIUNGI CHAT
	$(".glc-game-log").append($("<div><input id='chat-text' placeholder='Chat, /roll 1d20+4 , /dmroll 1d6 ..'></div>"));
	$(".glc-game-log").append($(`
		<div class="dice-roller">
			<div>
				<img title="d4" alt="d4" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d4.svg"}"/>
			</div>
			<div>
				<img title="d6" alt="d6" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d6.png"}"/>
			</div>
			<div>
				<img title="d8" alt="d8" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d8.svg"}"/>
			</div>
			<div>
				<img title="d10" alt="d10" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d10.svg"}"/>
			</div>
			<div>
				<img title="d100" alt="d100" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d100.png"}"/>
			</div>
			<div>
				<img title="d12" alt="d12" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d12.svg"}"/>
			</div>
			<div>
				<img title="d20" alt="d20" height="40px" src="${window.EXTENSION_PATH + "assets/dice/d20.svg"}"/>
			</div>
		</div>
	`));

	$(".dice-roller > div img").on("click", function(e) {
		const dataCount = $(this).attr("data-count");
		if (dataCount === undefined) {
			$(this).attr("data-count", 1);
			$(this).parent().append(`<span class="dice-badge">1</span>`);
		} else {
			$(this).attr("data-count", parseInt(dataCount) + 1);
			$(this).parent().append(`<span class="dice-badge">${parseInt(dataCount) + 1}</span>`);
		}
		if ($(".dice-roller > div img[data-count]").length > 0) {
			$(".roll-button").addClass("show");
		} else {
			$(".roll-button").removeClass("show");
		}
	});

	$(".dice-roller > div img").on("contextmenu", function(e) {
		e.preventDefault();

		let dataCount = $(this).attr("data-count");
		if (dataCount !== undefined) {
			dataCount = parseInt(dataCount) - 1;
			if (dataCount === 0) {
				$(this).removeAttr("data-count");
				$(this).parent().find("span").remove();
			} else {
				$(this).attr("data-count", dataCount);
				$(this).parent().append(`<span class="dice-badge">${dataCount}</span>`);
			}
		}
		if ($(".dice-roller > div img[data-count]").length > 0) {
			$(".roll-button").addClass("show");
		} else {
			$(".roll-button").removeClass("show");
		}
	});

	const rollButton = $(`<button class="roll-button">Roll</button>`);
	$("body").append(rollButton);
	rollButton.on("click", function (e) {
		const rollExpression = [];
		$(".dice-roller > div img[data-count]").each(function() {
			rollExpression.push($(this).attr("data-count") + $(this).attr("alt"));
		});
		const roll = new rpgDiceRoller.DiceRoll(rollExpression.join("+"));
		const text = roll.output;
		const uuid = new Date().getTime();
		const data = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: text,
			dmonly: window.DM || false,
			id: window.DM ? `li_${uuid}` : undefined
		};
		window.MB.inject_chat(data);
		
		if (window.DM) { // THIS STOPPED WORKING SINCE INJECT_CHAT
			$("#" + uuid).on("click", () => {
				const newData = {...data, dmonly: false, id: undefined, text: text};
				window.MB.inject_chat(newData);
				$(this).remove();
			});
		}
		$(".roll-button").removeClass("show");
		$(".dice-roller > div img[data-count]").removeAttr("data-count");
		$(".dice-roller > div span").remove();
	});
	
	$("#chat-text").on('keypress', function(e) {
		if (e.keyCode == 13) {
			var dmonly=false;
			var whisper=null;
			e.preventDefault();
			text = $("#chat-text").val();
			$("#chat-text").val("");

			if(text.startsWith("/roll")) {
				expression = text.substring(6);
				roll = new rpgDiceRoller.DiceRoll(expression);
				text = roll.output;
			}
			
			if(text.startsWith("/dmroll")) {
				expression = text.substring(8);
				roll = new rpgDiceRoller.DiceRoll(expression);
				text = roll.output;
				dmonly=true;
			}
			
			if(text.startsWith("/whisper")) {
				let matches = text.match(/\[(.*?)\] (.*)/);
				console.log(matches);
				whisper=matches[1]
				text="<b> &#8594;"+whisper+"</b>&nbsp;" +matches[2];
			}
			
			
			if(validateUrl(text)){

				text="<img width=200 src='"+parse_img(text)+"'>";
			}
			
			data = {
				player: window.PLAYER_NAME,
				img: window.PLAYER_IMG,
				text: text,
				dmonly: dmonly,
			};
			
			if(whisper)
				data.whisper=whisper;
				
			window.MB.inject_chat(data);
			
		}

	});

	s = $("<script src='https://meet.jit.si/external_api.js'></script>");
	$("#site").append(s);

	s = $("<script src='https://www.youtube.com/iframe_api'></script>");
	$("#site").append(s);

	background = $("<img id='scene_map'>");
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
			from: window.PLAYER_NAME,
			dm: window.DM
		}

		set_pointer(data,true);

		window.MB.sendMessage("custom/myVTT/pointer", data)
	});

	// AVOID ANNOYING TEXT SELECTIONS
	$("body").disableSelection();

	/*fog.on("",function(){
	//	if(!$("#select-button").hasClass("button-enabled"))
		//	deselect_all_tokens();
	});*/
	fog.on("mousedown", function(e) {
		if (e.button == 0 && shiftHeld == false) {
			deselect_all_tokens();
		}
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
	//if (window.DM)
		init_pclist();

	$(".sidebar__pane-content").css("background", "rgba(255,255,255,1)");


	init_buttons();
	init_stream_button();

	if (!window.DM) {

		open_player_sheet(window.PLAYER_SHEET, true);

		iframe = $("#sheet");

	}

	// ZOOM BUTTON
	zoom_section = $("<div id='zoom_buttons' />");

	zoom_center = $("<button id='zoom_fit' class='hasTooltip button-icon hideable' data-name='fit screen (0)'><span class='material-icons button-icon'>fit_screen</span></button>");
	zoom_center.click(reset_zoom);
	zoom_section.append(zoom_center);

	zoom_minus = $("<button id='zoom_minus' class='hasTooltip button-icon hideable' data-name='zoom out (-)'><span class='material-icons button-icon'>zoom_out</span></button>");
	zoom_minus.click(decrease_zoom)
	zoom_section.append(zoom_minus);

	zoom_plus = $("<button id='zoom_plus' class='hasTooltip button-icon hideable' data-name='zoom in (+)'><span class='material-icons button-icon'>zoom_in</span></button>");
	zoom_plus.click(increase_zoom);
	zoom_section.append(zoom_plus);

	hide_interface = $(`<button id='hide_interface_button' class='hasTooltip button-icon' data-name='Unhide interface (shift+h)'><span class='material-icons md-16 button-icon'>visibility</span></button>`);
	hide_interface.click(unhide_interface);
	hide_interface.css("display", "none");
	hide_interface.css("position", "absolute");
	hide_interface.css("opacity", "50%");
	hide_interface.css("right", "-136px");
	zoom_section.append(hide_interface);



	if(window.DM) {
		zoom_section.css("left","-136px");
	}
	else{
		zoom_section.css("left","-186px");
	}
	$(".sidebar__controls").append(zoom_section);

	init_combat_tracker();

	token_menu();
	build_token_image_map_menu();
	load_custom_image_mapping();


	window.WaypointManager=new WaypointManagerClass();

	init_spells();
	init_audio();
	init_settings();
	
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

	// Function separated so it can be dis/enabled
	function mousemove(m) {
		if (curDown) {
			window.scrollBy(curXPos - m.pageX, curYPos - m.pageY)
		}
	}

	// Function separated so it can be dis/enabled
	function mousedown(m) {
		// CONTROLLA SE FA CASINIIIIIIIIIIIIIIII
		curYPos = m.pageY;
		curXPos = m.pageX;
		if (m.button == 2) { // ONLY THE RIGHT CLICK
			//e.preventDefault();
			curDown = true;
			$("body").css("cursor", "grabbing");
			//return false;
		}
	}

	// Function separated so it can be dis/enabled
	function mouseup(event) {
		curDown = false;
		$("body").css("cursor", "");
		if (event.target.tagName.toLowerCase() !== 'a') {
			$("#splash").remove(); // don't remove the splash screen if clicking an anchor tag otherwise the browser won't follow the link
		}
	}

	// Helper function to disable window mouse handlers, required when we
	// do token dragging operations with measure paths
	window.disable_window_mouse_handlers = function () {

		$(window).off("mousemove", mousemove);
		$(window).off("mousedown", mousedown);
		$(window).off("mouseup", mouseup);
	}

	// Helper function to enable mouse handlers, required when we
	// do token dragging operations with measure paths
	window.enable_window_mouse_handlers = function () {

		$(window).on("mousemove", mousemove);
		$(window).on("mousedown", mousedown);
		$(window).on("mouseup", mouseup);
	}

	// Set basic mouse event handlers
	$(window).mousemove(mousemove);
	$(window).mousedown(mousedown);
	$(window).mouseup(mouseup);

	$("#fog_overlay").bind("contextmenu", function (e) {
		return false;
	});

	init_mouse_zoom()

	init_help_menu();
}

function init_buttons() {

	var clear_button = $("<button style='width:75px;'>ALL</button>");
	clear_button.click(function() {

		r = confirm("This will delete all FOG zones and REVEAL ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [[0, 0, $("#scene_map").width(), $("#scene_map").height()]];
			redraw_canvas();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});

	var hide_all_button = $("<button style='width:75px;'>ALL</button>");
	hide_all_button.click(function() {
		r = confirm("This will delete all FOG zones and HIDE ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [];
			redraw_canvas();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});


	fog_menu = $("<div id='fog_menu' class='top_menu'></div>");
	fog_menu.append("<div style='font-weight: bold;'>Reveal</div>");
	fog_menu.append("<div><button id='fog_square-r' style='width:75px' class='drawbutton menu-option fog-option remembered-selection' data-shape='rect' data-type=0>Square</button></div>");
	fog_menu.append("<div><button id='fog_circle_r' style='width:75px' class='drawbutton menu-option fog-option' data-shape='arc'  data-type=0>Circle</button></div>");
	fog_menu.append("<div><button id='fog_polygon_r' style='width:75px' class='drawbutton menu-option fog-option' data-shape='polygon' data-type=0>Polygon</button></div>");
	fog_menu.append($("<div/>").append(clear_button));
	fog_menu.append("<div style='font-weight: bold;'>Hide</div>");
	fog_menu.append("<div><button id='fog_square_h' style='width:75px' class='drawbutton menu-option fog-option' data-shape='rect' data-type=1>Square</button></div>");
	fog_menu.append("<div><button id='fog_circle_h' style='width:75px' class='drawbutton menu-option fog-option' data-shape='arc' data-type=1>Circle</button></div>");
	fog_menu.append("<div><button id='fog_polygon_h' style='width:75px' class='drawbutton menu-option fog-option' data-shape='polygon' data-type=1>Polygon</button></div>");
	fog_menu.append($("<div/>").append(hide_all_button));
	fog_menu.append("<div><button id='fog_undo' style='width:75px'>UNDO</button></div>")
	fog_menu.css("position", "fixed");
	fog_menu.css("top", "25px");
	fog_menu.css("width", "75px");
	fog_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")
	$("body").append(fog_menu);
	fog_menu.find("#fog_undo").click(function(){
		window.REVEALED.pop();
		redraw_canvas();
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
	});
	

	buttons = $("<div/>")
	$("body").append(buttons);
	
	if (window.DM)
		buttons.append($("<button style='display:inline; width:75px;' id='select-button' class='drawbutton hideable' data-shape='select'><u>S</u>ELECT</button>"));
		
	buttons.append($("<button style='display:inline;width:75px;;' id='measure-button' class='drawbutton hideable' data-shape='measure'><u>R</u>ULER</button>"));
	fog_button = $("<button style='display:inline;width:75px;' id='fog_button' class='drawbutton menu-button hideable'><u>F</u>OG</button>");
	
	if (window.DM)
		buttons.append(fog_button);
	fog_menu.css("left",fog_button.position().left);

	draw_menu = $("<div id='draw_menu' class='top_menu'></div>");
	draw_menu.append("<div><button id='draw_square' style='width:75px' class='drawbutton menu-option draw-option remembered-selection' data-shape='rect' data-type='draw'>Square</button></div>");
	draw_menu.append("<div><button id='draw_circle' style='width:75px' class='drawbutton menu-option draw-option' data-shape='arc' data-type='draw'>Circle</button></div>");
	draw_menu.append("<div><button id='draw_cone' style='width:75px' class='drawbutton menu-option draw-option' data-shape='cone' data-type='draw'>Cone</button></div>");
	draw_menu.append("<div><button id='draw_line' style='width:75px' class='drawbutton menu-option draw-option' data-shape='line' data-type='draw'>Line</button></div>");
	draw_menu.append("<div><button id='draw_polygon' style='width:75px' class='drawbutton menu-option draw-option' data-shape='polygon' data-type='draw'>Polygon</button></div>");
	draw_menu.append("<div><button id='draw_erase' style='width:75px' class='drawbutton menu-option draw-option' data-shape='rect' data-type='eraser'>Erase</button></div>");
	
	draw_menu.append("<div><button id='draw_undo' style='width:75px'>UNDO</button></div>");
	
	draw_menu.append("<div><button id='delete_drawing' style='width:75px'>CLEAR</button></div>");

	draw_menu.find("#delete_drawing").click(function() {
		r = confirm("DELETE ALL DRAWINGS? (cannot be undone!)");
		if (r === true) {
			window.DRAWINGS = [];
			redraw_drawings();
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
	});
	
	draw_menu.find("#draw_undo").click(function() {
		window.DRAWINGS.pop();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
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


	draw_menu.css("position", "fixed");
	draw_menu.css("top", "25px");
	draw_menu.css("width", "75px");
	draw_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(draw_menu);

	draw_button = $("<button style='display:inline;width:75px' id='draw_button' class='drawbutton menu-button hideable'><u>D</u>RAW</button>");

	if (window.DM){
		buttons.append(draw_button);
		draw_menu.css("left",draw_button.position().left);
		
	}

	buttons.append("<button style='display:inline;width:75px' id='help_button' class='hideable'>HELP</button>");

	buttons.css("position", "fixed");
	buttons.css("top", '5px');
	buttons.css("left", '5px');


	draw_menu.find(".drawType").first().click();
	draw_menu.find(".coloroption").first().click();

	setup_draw_buttons();
	// HIDE default SEND TO functiontality in the campaign page:
	
	$(".GameLogHeader_Container__36cXS").hide();
	
	// STREAMING STUFF
	
	window.STREAMPEERS={};
	window.MYSTREAMID=uuid();
	window.JOINTHEDICESTREAM=false;
	
			
		
	init_keypress_handler();
	
}

function init_stream_button() {
	var stream_button = $("<button id='stream_button' class='hasTooltip button-icon hideable' data-name='Stream dice rolls'></button>");
	stream_button.attr("data-name", "SHARE/SEE player's DDB dice rolling visuals (Experimental/stable).\nDisclaimer: currently shows dice in low resolution in the first few rolls, then it gets better.\nOn by default = RED.");
	stream_button.append("<img height='20px' src='"+window.EXTENSION_PATH+ "assets/dice/d6.png'>");
	stream_button.append("<img height='20px' src='"+window.EXTENSION_PATH + "assets/icons/share.svg'>");

	stream_button.click(() => {
		if (!window.JOINTHEDICESTREAM) {
			window.JOINTHEDICESTREAM = true;
			window.MB.sendMessage("custom/myVTT/wannaseemydicecollection", { from: window.MYSTREAMID });
			stream_button.css("background", "red");
		}
		else {
			window.JOINTHEDICESTREAM = false;
			stream_button.css("background", "");
			for (let i in window.STREAMPEERS) {
				window.STREAMPEERS[i].close();
				delete window.STREAMPEERS[i];
			}
			$(".streamer-canvas").remove();
		}
	});
	stream_button.addClass("stream_button");
	stream_button.css("position", "absolute");
	if (window.DM)
		stream_button.css("left", "-197px");
	else
		stream_button.css("left", "-247px");

	stream_button.css("background", "yellow");

	if (!$.browser.mozilla) { // DISABLE FOR FIREFOX
		$(".sidebar__controls").append(stream_button);
		if(window.DM){
			setTimeout( () => {stream_button.click()} , 5000); 
		}
	}
	
	

}


$(function() {
	window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
	var is_dm=false;
	if($(".ddb-campaigns-detail-body-dm-notes-label").length>0){
		is_dm=true;
	}
	
	// SCB: Add a dummy DIV to force the AboutVTT DIV below the standard DDB buttons
	$(".ddb-campaigns-detail-header-secondary-sharing").append($("<div style='clear:both'>"))

	// SCB:Create a 'content DIV' for AboveVTT to add our controls to, so we can control styling better
	var contentDiv = $("<div class='above-vtt-content-div'>").appendTo($(".ddb-campaigns-detail-header-secondary-sharing"));
	
	// SCB: Append our logo
	contentDiv.append($("<img class='above-vtt-logo above-vtt-right-margin-5px' width='120px' src='" + window.EXTENSION_PATH + "assets/logo.png'>"));

	if(is_dm){
		contentDiv.append($("<a class='above-vtt-campaignscreen-blue-button above-vtt-right-margin-5px button joindm btn modal-link ddb-campaigns-detail-body-listing-campaign-link'>JOIN AS DM</a>"));
	}

	$(".ddb-campaigns-character-card-footer-links").each(function() {
		if($(this).find(".ddb-campaigns-character-card-footer-links-item-edit").length==0)
			return;
		
		let sheet = $(this).find(".ddb-campaigns-character-card-footer-links-item-view").attr('href');
		let img = $(this).parent().parent().find('.user-selected-avatar').css('background-image');
		let name = $(this).parent().parent().find(".ddb-campaigns-character-card-header-upper-character-info-primary").html();
		if (img)
			img = img.replace(/url\("(.*)"\)/, "$1");
		else
			img = "https://www.dndbeyond.com/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";

		newlink = $("<a style='color:white;background: #1b9af0;' href='#' class='button ddb-campaigns-character-card-footer-links-item'>JOIN AboveVTT</a>");

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

	delete_button = $("<a class='above-vtt-campaignscreen-black-button button btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above-delete'>Delete AboveVTT Data for this campaign</a>");
	delete_button.click(function() {
		if (confirm("Are you sure?")) {
			gameid = $("#message-broker-client").attr("data-gameId");
			localStorage.removeItem("ScenesHandler" + gameid);
			localStorage.removeItem("current_source" + gameid);
			localStorage.removeItem("current_chapter" + gameid);
			localStorage.removeItem("current_scene" + gameid);
			localStorage.removeItem("CombatTracker"+gameid);
		}
		else {
			console.log('user canceled');
		}
	});
	
	delete_button2 = $("<a class='above-vtt-campaignscreen-black-button button btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above-delete2'>Delete Global AboveVTT Data (soundpads, tokens..)</a>");
	delete_button2.click(function() {
		if (confirm("Are you sure?")) {
			localStorage.removeItem("Soundpads");
			localStorage.removeItem("CustomTokens");
		}
		else {
			console.log('user canceled');
		}
	});


	
	
	var campaign_banner=$("<div id='campaign_banner'></div>")
	campaign_banner.append("<h4><img class='above-vtt-right-margin-5px' alt='' width='100px' src='"+window.EXTENSION_PATH + "assets/logo.png'>Basic Instructions!</h4>");
	campaign_banner.append("<br>If you are the DM, press <b>JOIN AS DM</b> above.<br><br>");
	campaign_banner.append("Players, press <b>JOIN AboveVTT</b> next to your character at the bottom, and then wait for your DM to join.<br><br>");
	campaign_banner.append("Please check that you do not have any other extensions for DndBeyond (like Beyond20) enabled. <b>Disable them</b> or you will not be able to roll dice!<br><br>");
	campaign_banner.append("If you're looking for tutorials, take a look at our <a target='_blank' href='https://www.youtube.com/channel/UCrVm9Al59iHE19IcqaKqqXA'>YouTube Channel!!</a><br>");
	campaign_banner.append("If you need help, or just want to send us your feedback, join the <a target='_blank' href='https://discord.gg/cMkYKqGzRh'>AboveVTT Discord Community</a>.<br>");
	campaign_banner.append("Do you like what you see? Then please support me on <a target='_blank' href='https://www.patreon.com/AboveVTT'>AboveVTT Patreon!</a><br><br>");
	campaign_banner.append("<b>Advanced</b><br>If you are not the DM of this campaign but would like to join as the DM then <a class='joindm'>click here</a>.<br>");
	campaign_banner.append("(Please note that <b>you will not be able to see the other DM's data</b>.)<br>Do <b>NOT</b> press this if there's already another DM connected<br><br>");
	campaign_banner.append("Use this button to delete all locally held data, to 'clear the cache' as it were: <br>");
	campaign_banner.append(delete_button);
	campaign_banner.append(delete_button2);
	campaign_banner.hide();
	
	contentDiv.append($("<a class='above-vtt-campaignscreen-white-button above-vtt-right-margin-5px instructions btn modal-link ddb-campaigns-detail-body-listing-campaign-link'>Instructions</a>"));

	$("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></link>')
	
	$(".instructions").click(function(){
		if(campaign_banner.is(":visible"))
			campaign_banner.hide();
		else
			campaign_banner.show();
	});

	$(".ddb-campaigns-detail-header-secondary-description").first().before(campaign_banner);
	
		$(".joindm").click(function(e) {
			e.preventDefault();
			window.DM = true;
			window.PLAYER_SHEET = false;
			window.PLAYER_NAME = "THE DM";
			window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
			init_ui();
		});
});


function init_help_menu() {
	$('body').append(`
		<div id="help-container">
			<div id="help-menu-outside"></div>
			<div id="help-menu">
				<div class="help-tabs">
					<ul>
						<li class="active"><a href="#tab1"> Keyboard shortcuts</a></li>
						<li><a href="#tab2">FAQ</a></li>
					</ul>
				</div>

				<section class="tabs-content">
					<div id="tab1">
						<h3>Keyboard Shortcuts</h3>
						<dl>
							<dt>SPACE</dt>
							<dd>Show/hide character sheet (players only)</dd>
						<dl>
						<dl>
							<dt>Q</dt>
							<dd>Show/hide sidebar</dd>
						<dl>
						<dl>
							<dt>ESC</dt>
							<dd>Cancel button selections</dd>
						<dl>
						<dl>
							<dt>S</dt>
							<dd>Select tool</dd>
						<dl>
						<dl>
							<dt>R</dt>
							<dd>Ruler</dd>
						<dl>
						<dl>
							<dt>F</dt>
							<dd>Fog menu</dd>
						<dl>
						<dl>
							<dt>D</dt>
							<dd>Draw tool</dd>
						<dl>
						<dl>
							<dt>C</dt>
							<dd>Combat tracker</dd>
						<dl>
						<dl>
							<dt>N</dt>
							<dd>Next creature (if combat tracker is open)</dd>
						<dl>
						<dl>
							<dt>-</dt>
							<dd>Zoom out</dd>
						<dl>
						<dl>
							<dt>=</dt>
							<dd>Zoom in</dd>
						<dl>
						<dl>
							<dt>CTRL (held)</dt>
							<dd>Temporarily toggle grid snapping</dd>
						<dl>
						<dl>
							<dt>ALT (held)</dt>
							<dd>Temporarily activate ruler</dd>
						<dl>
						<dl>
							<dt>SHIFT+H</dt>
							<dd>Hide buttons from screen (spectator mode)</dd>
						<dl>
						<dl>
							<dt>SHIFT+Click</dt>
							<dd>Select multiple tokens</dd>
						<dl>
						<dl>
							<dt>UP/DOWN arrows</dt>
							<dd>Will cycle through fog & draw options if menu open</dd>
						<dl>
					</div>

					<div id="tab2">
						<iframe src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true"></iframe>
					</div>
					
				</section>
			</div>
		</div>
	`);

	$('#help-container').fadeOut(0);

	$(function() {
        $('.help-tabs a').on('click', function() {
        $('.help-tabs li').removeClass('active');
        $(this).parent().addClass('active');
        let currentTab = $(this).attr('href');
        $('.tabs-content div').hide();
        $(currentTab).show();
        return false;
        });
    });

	$('#help-menu-outside').on('click', function() {
		$('#help-container').fadeOut(200);
	});

	$("#help_button").click(function(e) {
		$('#help-container').fadeIn(200);
	});
}
