var abovevtt_version = '0.74';

/**
 * before the page refreshes perform the innards
 * @param {*} event 
 */
window.onbeforeunload = function(event)
{
	console.log("refreshing page, storing zoom first")
	add_zoom_to_storage()
};

function parse_img(url){
	if (typeof url !== "string") {
		return "";
	}
	retval = url;
	if (retval.startsWith("https://drive.google.com") && retval.indexOf("uc?id=") < 0) {
		retval = 'https://drive.google.com/uc?id=' + retval.split('/')[5];
	} else if (retval.includes("dropbox.com") && retval.includes("?dl=")) {
		retval = retval.split("?dl=")[0] + "?raw=1";
	}
	return retval;
}

function whenAvailable(name, callback) {
    var interval = 10; // ms
    window.setTimeout(function() {
        if (window[name]) {
            callback(window[name]);
        } else {
            whenAvailable(name, callback);
        }
    }, interval);
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
	console.group("change_zoom")
	console.log("zoom", newZoom, x , y)
	var zoomCenterX = x || $(window).width() / 2
	var zoomCenterY = y || $(window).height() / 2
	// 200 is the size of the black area to the left and top of the map
	var centerX = Math.round((($(window).scrollLeft() + zoomCenterX) - 200) * (1.0 / window.ZOOM));
	var centerY = Math.round((($(window).scrollTop() + zoomCenterY) - 200) * (1.0 / window.ZOOM));
	window.ZOOM = newZoom;
	var pageX = Math.round(centerX * window.ZOOM - zoomCenterX) + 200;
	var pageY = Math.round(centerY * window.ZOOM - zoomCenterY) + 200;

	//Set scaling token names CSS variable this variable can be used with anything in #tokens
	$("#tokens").get(0).style.setProperty("--font-size-zoom", Math.max(12 * Math.max((3 - window.ZOOM), 0), 8.5) + "px");

	$("#VTT").css("transform", "scale(" + window.ZOOM + ")");
	set_default_vttwrapper_size()
	$(window).scrollLeft(pageX);
	$(window).scrollTop(pageY);
	$("body").css("--window-zoom", window.ZOOM)
	console.groupEnd()
}
/** 
* Adds the current zoom level and scrollLeft, scrollTop offsets to local storage along with the title of the scene
* @param {float} z - current zoom level
*/
function add_zoom_to_storage(){
	console.group("add_zoom_to_storage")
	console.log("storing zoom")
	
	if(window.ZOOM !== get_reset_zoom()){
		const zooms = JSON.parse(localStorage.getItem('zoom')) || [];
		const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title)
		if (zoomIndex !== -1){
			zooms[zoomIndex].zoom = window.ZOOM
			zooms[zoomIndex].leftOffset = Math.round($(window).scrollLeft())
			zooms[zoomIndex].topOffset = Math.round($(window).scrollTop())
		}
		else{
			// zoom doesn't exist
			zooms.push({
				"title": window.CURRENT_SCENE_DATA.title,
				"zoom":window.ZOOM,
				"leftOffset": Math.round($(window).scrollLeft()),
				"topOffset": Math.round($(window).scrollTop())
			}); 
		}
		localStorage.setItem('zoom', JSON.stringify(zooms));
	} else {console.log("zoom has not changed, skipping storage")}
	
	console.groupEnd("add_zoom_to_storage")
}
/** 
* sets default values for VTTWRAPPER and black_layer based off zoom
*/
function set_default_vttwrapper_size(){
	$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 1400);
	$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 1400);
	$("#black_layer").width($("#scene_map").width() * window.ZOOM + 2000);
	$("#black_layer").height($("#scene_map").height() * window.ZOOM + 2000);
}

/**
 * Removes the zoom for the current scene from local storage, applied when user click "fit zoom" button
 */
function remove_zoom_from_storage(){
	const zooms = JSON.parse(localStorage.getItem('zoom')) || [];
	const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title)
	if (zoomIndex !== -1){
		console.log("removing zoom from storage", zooms[zoomIndex])
		zooms.splice(zoomIndex, 1)
	}
	localStorage.setItem('zoom', JSON.stringify(zooms));
}

/** 
* Retrieves the zoom and scroll position from local storage using the scene title, will call reset_zoom if not found
*/
function apply_zoom_from_storage(){
	console.group("apply_zoom_from_storage")
	const zoomState = localStorage.getItem("zoom")
	if (zoomState){
		const zooms = JSON.parse(zoomState)
		const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title)
		if(zoomIndex !== -1){
			console.log("restoring zoom level", zooms[zoomIndex])
			change_zoom(
				zooms[zoomIndex].zoom,
				undefined,
				undefined,
				false)
			// this bit doesn't work
			$(window).scrollLeft(zooms[zoomIndex].leftOffset);
			$(window).scrollTop(zooms[zoomIndex].topOffset);
			
		}
		else{
			// zooms in storage but not for this scene
			console.log("scene does not have a zoom stored")
			reset_zoom()
		}
	}
	else{
		// no zooms in storage
		console.log("no zooms in storage")
		reset_zoom()
	}
	console.groupEnd()
}

function decrease_zoom() {
	if (window.ZOOM > MIN_ZOOM) {
		change_zoom(window.ZOOM * 0.9)
	}
}
/** 
* gets the zoom value that will fit the map to the viewport
* @return {float} 
*/
function get_reset_zoom () {
	const wH = $(window).height();
	const mH = $("#scene_map").height()
	const wW = $(window).width();
	const mW = $("#scene_map").width()

	console.log(wH, mH, wW, mW)
	return Math.min((wH / mH),(wW / mW))
}

/** 
* entrypoint for user clicking the fit map button. will remove local storage state as by default this func is called when no state is found
*/
function reset_zoom () {
	console.group("reset_zoom")
	console.log("zooming on centre of map")	
	// change_zoom is great for mousezooming, but tricky when just hitting the centre of the map
	// so don't give it any x/y and just use the scrollintoview center instead
	change_zoom(get_reset_zoom(), undefined, undefined)
	$("#scene_map")[0].scrollIntoView({
		behavior: 'auto',
		block: 'center',
		inline: 'center'
	});
	// don't store any zoom for this scene as we default to map fit on load
	remove_zoom_from_storage()
	console.groupEnd()
}

function increase_zoom() {
	change_zoom(window.ZOOM * 1.10)
}

function getPlayerIDFromSheet(sheet_url)
{
	let playerID = -1;
	if(sheet_url)
	{
		let urlSplit = sheet_url.split("/");
		if(urlSplit.length > 0)
		{
			playerID = urlSplit[urlSplit.length - 1];
		}
	}
	return playerID;
}

window.YTTIMEOUT = null;

function map_load_error_cb(e) {
	console.log(e);
	let src = e.currentTarget.getAttribute("src");
	console.error("map_load_error_cb src", src, e);
	if (typeof src === "string") {
		let specificMessage = `Please make sure the image is accessible to anyone on the internet.`;
		if (src.includes("drive.google")) {
			specificMessage = `It looks like you're using a Google Drive image. Please make sure the "Get link" modal says "Anyone on the internet with this link can view".`;
		}
		if (confirm(`Map could not be loaded!\n${specificMessage}\nYou may also need to disable ad blockers.\nWould you like to try loading the image in a separate tab to verify that it's accessible? If you are currently logged in to google, you will need to log out or open the image in a different browser or an incognito window to truly test it.`)) {
			if (window.DM || confirm(`SPOILER ALERT!!!\nIf you click OK, you might see the entire map without fog of war. However, the map isn't loading at all so you will probably see a broken link. Are you sure you want to test this image?`)) {
				window.open(src, '_blank');
			}
		}
	}
}

/// the first time we load, an overlay is shown to mask all the window modifications we do. This removes it. See `Load.js` for the injection of the overlay.
function remove_loading_overlay() {
	$("#loading_overlay").animate({ "opacity": 0 }, 1000, function() {
		$("#loading_overlay").hide();
	});
}
// both DM and players use this when you're in the cloud
function load_scenemap(url, is_video = false, width = null, height = null, callback = null) {

	remove_loading_overlay();

	$("#scene_map").remove();

	if (window.YTTIMEOUT != null) {
		clearTimeout(window.YTTIMEOUT);
		window.YTTIMEOUT = null;
	}

	console.log("is video? " + is_video);
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
	else if (is_video === "0" || !is_video) {
		let newmap = $("<img id='scene_map' src='scene_map' style='position:absolute;top:0;left:0;z-index:10'>");
		newmap.attr("src", url);
		
		newmap.on("error", map_load_error_cb);
		if (width != null) {
			newmap.width(width);
			newmap.height(height);
		}

		newmap.css("opacity","0");
		newmap.on("load", () => newmap.animate({opacity:1},2000));
		if (callback != null) {	
			newmap.on("load", callback);
		}
		$("#VTT").append(newmap);
		$("#scene_map_container").css("width", $("#scene_map").width())
		$("#scene_map_container").css("height", $("#scene_map").height())

	}
	else {
		console.log("LOAD MAP " + width + " " + height);
		let newmapSize = 'width: 100vw; height: 100vh;';
		if (width != null) {
			newmapSize = 'width: ' + width + 'px; height: ' + height + 'px;';
		}

		var newmap = $('<video style="' + newmapSize + ' position: absolute; top: 0; left: 0;z-index:10" playsinline autoplay muted loop id="scene_map" src="' + url + '" />');
		newmap.on("loadeddata", callback);
		newmap.on("error", map_load_error_cb);

		if (width == null) {
			newmap.on("loadedmetadata", function (e) {
				console.log("video width:", this.videoWidth);
				console.log("video height:", this.videoHeight);
				$('#scene_map').width(this.videoWidth);
				$('#scene_map').height(this.videoHeight);
			});
		}
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
		"border-style": "double",
		"border-color": data.color,
	});
	$("#tokens").append(marker);

	marker.animate({
		opacity: 0,
		width: "120px",
		height: "120px",
		top: data.y - 60,
		left: data.x - 60,
	}, 1375, function() { marker.remove() });

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
	if (!$("#switch_gamelog").hasClass("selected-tab")) {
		if ($("#switch_gamelog").hasClass("notification")) {
			$("#switch_gamelog").removeClass("notification");
			setTimeout(function() {
				$("#switch_gamelog").addClass("notification");
			}, 400);
		} else {
			$("#switch_gamelog").addClass("notification");
		}
	}

	if ($(".GameLog_GameLog__2z_HZ").scrollTop() < 0) {
		$(".GameLog_GameLog__2z_HZ").addClass("highlight-gamelog");
	}
}

function switch_control(e) {
	change_sidbar_tab($(e.currentTarget))
}

function deselect_all_sidebar_tabs() {
	$(".selected-tab .sidebar-tab-image").removeClass("ct-primary-box__tab--extras ddbc-tab-list__nav-item ddbc-tab-list__nav-item--is-active");
	$(".selected-tab").removeClass("selected-tab")
}

function change_sidbar_tab(clickedTab, isCharacterSheetInfo = false) {

	deselect_all_sidebar_tabs();
	clickedTab.addClass("selected-tab").removeClass("notification");
	clickedTab.find(".sidebar-tab-image").addClass("ct-primary-box__tab--extras ddbc-tab-list__nav-item ddbc-tab-list__nav-item--is-active");

	close_sidebar_modal();
	$(clickedTab.attr("data-target")).addClass('selected-tab');

	// switch back to gamelog if they change tabs
	if (!isCharacterSheetInfo) {
		// This only happens when `is_character_page() == true` and the user clicked the gamelog tab. 
		// This is an important distinction, because we switch to the gamelog tab when the user clicks info on their character sheet that causes details to be displayed instead of the gamelog. 
		// Since the user clicked the tab, we need to show the gamelog instead of any detail info that was previously shown.
		$(".ct-character-header__group--game-log").click();
	}

}

function report_connection(){
	var msgdata = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: PLAYER_NAME + " has connected to the server!",	
	};
	window.MB.inject_chat(msgdata);
}

function load_monster_stat(monsterid, token_id) {
	
	console.group("load_monster_stat")
	const draggable_resizable_div = $(`<div id='resizeDragMon' style="display:none; left:204px"></div>`);
	// const loadingSpinner = create_monster_loading_spinner()
	monFrame = $("#resizeDragMon iframe")
	// check if the monster pane is not open
	if (! $("#resizeDragMon").length) {
		$("body").append(draggable_resizable_div)
		draggable_resizable_div.append(build_combat_tracker_loading_indicator())
		draggable_resizable_div.show("slow")
	}

	let container = $("<div id='resizeDragMon'/>");

	if($("#site #resizeDragMon").length>0){
		$("#resizeDragMon iframe").remove();
		$("#resizeDragMon").removeClass("hideMon");
		container = $("#resizeDragMon");
	}
	container.resize(function(e) {
        	e.stopPropagation();
   	});
	let iframe = $("<iframe>");

	iframe.css("display", "none");
	
	window.StatHandler.getStat(monsterid, function(stats) {
		iframe.on("load", function(event) {
			console.log('carico mostro');
			$(event.target).contents().find("body[class*='marketplace']").replaceWith($("<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>"));
			$(event.target).contents().find("#mega-menu-target").remove();
			$(event.target).contents().find(".site-bar").remove();
			$(event.target).contents().find(".page-header").remove();
			$(event.target).contents().find(".homebrew-comments").remove();
			$(event.target).contents().find("header").hide();
			$(event.target).contents().find("#site-main").css("padding", "0px");
			$(event.target).contents().find("#footer").remove();
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
						text: "<img width='100%' class='magnify' href='" + imgsrc + "' src='" + imgsrc + "'>",
					};

					window.MB.inject_chat(msgdata);
				});
			}


			scan_monster($(event.target).contents(), stats, token_id);
			$(event.target).contents().find("a").attr("target", "_blank");
			$(".sidebar-panel-loading-indicator").hide()
			iframe.fadeIn("slow")
			console.groupEnd()
		});

		iframe.attr('src', stats.data.url)
	})
	container.append(iframe);
	if(!$("#site #resizeDragMon").length>0){
		$("#site").prepend(container);
	}

	$(iframe).on("load", function(event){
		let tooltipCSS = $(`<style>.hovering-tooltip{ display: block !important; left: 5px !important; right: 5px !important; pointer-events: none !important; min-width: calc(100% - 10px);} </style>`);
		$("head", $("#resizeDragMon iframe").contents()).append(tooltipCSS);

		$("body", $("#resizeDragMon iframe").contents()).css('width', 'calc(100% + 670px)');
		$("#site", $("#resizeDragMon iframe").contents()).css('padding-right', '670px');

		$(".tooltip-hover", $("#resizeDragMon iframe").contents()).on("mouseover mousemove", function(){
			$("#db-tooltip-container .body .tooltip, #db-tooltip-container", $("#resizeDragMon iframe").contents()).toggleClass("hovering-tooltip", true);	
		});
		$(".tooltip-hover", $("#resizeDragMon iframe").contents()).on("mouseout", function(){
			$("#db-tooltip-container .body .tooltip, #db-tooltip-container", $("#resizeDragMon iframe").contents()).toggleClass("hovering-tooltip", false);
		});

		// if the user right-clicks a tooltip, send it to the gamelog
		$(event.target).contents().off("contextmenu").on("contextmenu", ".tooltip-hover", function(clickEvent) {
			clickEvent.preventDefault();
			clickEvent.stopPropagation();
			
			let toPost = $("#db-tooltip-container", $("#resizeDragMon iframe").contents()).clone();
			toPost.find(".waterdeep-tooltip").attr("style", "display:block!important");
			toPost.find(".tooltip").attr("style", "display:block!important");
			toPost.css({
				"top": "0px",
				"left": "0px",
				"position": "relative"
			});
			toPost.find(".tooltip").css({
				"max-height": "1000px",
				"min-width": "0",
				"max-width": "100%",
				"width": "100%"
			});
			toPost.find(".tooltip-header").css({
				"min-height": "70px",
				"height": "auto"
			});
			toPost.find(".tooltip-body").css({
				"max-height": "1000px"
			});
			window.MB.inject_chat({
				player: window.PLAYER_NAME,
				img: window.PLAYER_IMG,
				text: toPost.html()
			});
		});
	});
	
	/*Set draggable and resizeable on monster sheets for players. Allow dragging and resizing through iFrames by covering them to avoid mouse interaction*/
	if($("#monster_close_title_button").length==0){
		const monster_close_title_button=$('<div id="monster_close_title_button"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
		$("#resizeDragMon").append(monster_close_title_button);
		monster_close_title_button.click(function() {
			close_player_monster_stat_block()
		});
	}
	$("#resizeDragMon").addClass("moveableWindow");
	if(!$("#resizeDragMon").hasClass("minimized")){
		$("#resizeDragMon").addClass("restored");
	}
	else{
		$("#resizeDragMon").dblclick();
	}
	$("#resizeDragMon").resizable({
		addClasses: false,
		handles: "all",
		containment: "#windowContainment",
		start: function () {
			$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function () {
			$('.iframeResizeCover').remove();
		},
		minWidth: 200,
		minHeight: 200
	});

	$("#resizeDragMon").mousedown(function(){
		frame_z_index_when_click($(this));
	});
	$("#resizeDragMon").draggable({
		addClasses: false,
		scroll: false,
		containment: "#windowContainment",
		start: function () {
			$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function () {
			$('.iframeResizeCover').remove();
		}
	});
	minimize_player_monster_window_double_click($("#resizeDragMon"));
}

function close_player_monster_stat_block() {
	$("#resizeDragMon.minimized").dblclick();
	console.debug("close_player_monster_stat_block is closing the stat block")
	$("#resizeDragMon").addClass("hideMon");
}

function minimize_player_monster_window_double_click(titleBar){
	titleBar.off('dblclick').on('dblclick', function() {
		if (titleBar.hasClass("restored")) {
			titleBar.data("prev-height", titleBar.height());
			titleBar.data("prev-width", titleBar.width() - 3);
			titleBar.data("prev-top", titleBar.css("top"));
			titleBar.data("prev-left", titleBar.css("left"));
			titleBar.css("top", titleBar.data("prev-minimized-top"));
			titleBar.css("left", titleBar.data("prev-minimized-left"));	
			titleBar.height(23);
			titleBar.width(200);
			titleBar.addClass("minimized");
			titleBar.removeClass("restored");
			titleBar.prepend('<div class="monster_title">Monster: '+$("#resizeDragMon iframe").contents().find(".mon-stat-block__name-link").text()+"</div>");
			
		} else if(titleBar.hasClass("minimized")) {
			titleBar.data("prev-minimized-top", titleBar.css("top"));
			titleBar.data("prev-minimized-left", titleBar.css("left"));
			titleBar.height(titleBar.data("prev-height"));
			titleBar.width(titleBar.data("prev-width"));
			titleBar.css("top", titleBar.data("prev-top"));
			titleBar.css("left", titleBar.data("prev-left"));
			titleBar.addClass("restored");
			titleBar.removeClass("minimized");
			$(".monster_title").remove();
			
		}
	});
}

function init_controls() {
	
	if ($("#switch_gamelog").length > 0) {
		// no need to do this more than once. DDB rips things out when you resize the window which is why this could be called multiple times
		return;
	}
	
	init_sidebar_tabs();

	if (is_characters_page()) {
		$(".ct-sidebar").css("top", "-2px");
	} else {
		$(".sidebar").css("top", "2px");
	}
	$(".sidebar").css("height", "calc(100vh - 24px)");

	$(".sidebar__control--lock").closest("span.sidebar__control-group.sidebar__control-group--lock > button").click(); // CLICKA SU lucchetto.  // This is safe to call multiple times

	let sidebarControlsParent = is_characters_page() ? $(".ct-sidebar__controls") : $(".sidebar__controls");
	sidebarControlsParent.find(".avtt-sidebar-controls").remove();
	sidebarControlsParent.children().css({ "visibility": "hidden", "width": "0px", "height": "0px", "position": "absolute" });
	sidebarControlsParent.css({ "display": "block", "visibility": "visible", "height": "28px", "position": "relative", "top": "0px", "left": "0px" });
	
	let sidebarControls = $("<div class='avtt-sidebar-controls' style='width:100%;height:100%;display:flex;'></div>");
	sidebarControlsParent.append(sidebarControls);

	hider = $("<div id='hide_rightpanel' class='ddbc-tab-options--layout-pill point-right hasTooltip button-icon hideable' data-name='Show/hide sidebar (q)' data-visible=1><div class='ddbc-tab-options__header-heading'><span class='material-icons button-icon'>chevron_right</span></div></div>");
	hider.click(toggle_sidebar_visibility);
	sidebarControls.append(hider);
	if (is_encounters_page() || is_campaign_page()) {
		hider.css("top", "-3px");
	}

	b1 = $("<div id='switch_gamelog' class='tab-btn selected-tab hasTooltip button-icon leading-edge' data-name='Gamelog' data-target='.glc-game-log'></div>").click(switch_control);
	b1.append('<div class="sidebar-tab-image ct-primary-box__tab--extras ddbc-tab-list__nav-item ddbc-tab-list__nav-item--is-active" style="width:100%;height:100%;"><svg class="gamelog-button__icon" width="18" height="18" viewBox="0 0 18 18"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10C15 10.551 14.551 11 14 11H9C8.735 11 8.48 11.105 8.293 11.293L6 13.586V12C6 11.447 5.552 11 5 11H4C3.449 11 3 10.551 3 10V4C3 3.449 3.449 3 4 3H14C14.551 3 15 3.449 15 4V10ZM14 1H4C2.346 1 1 2.346 1 4V10C1 11.654 2.346 13 4 13V16C4 16.404 4.244 16.77 4.617 16.924C4.741 16.975 4.871 17 5 17C5.26 17 5.516 16.898 5.707 16.707L9.414 13H14C15.654 13 17 11.654 17 10V4C17 2.346 15.654 1 14 1ZM12 6H6C5.448 6 5 6.447 5 7C5 7.553 5.448 8 6 8H12C12.552 8 13 7.553 13 7C13 6.447 12.552 6 12 6Z" fill="currentColor"></path></svg></div>');
	sidebarControls.append(b1);

	if (DM) {
		let b2 = $("<div id='switch_tokens' class='tab-btn hasTooltip button-icon blue-tab' data-name='Tokens' data-target='#tokens-panel'></div>").click(switch_control);
		let b2ImageDiv = $('<div></div>');
		let b2ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
		let b2Image = `${window.EXTENSION_PATH}assets/icons/character.svg`;
		b2ImageDiv.css({ "mask": `url(${b2Image}) no-repeat center / contain`, "-webkit-mask": `url(${b2Image}) no-repeat center / contain` });
		b2ImageDivWrapper.append(b2ImageDiv);
		b2.append(b2ImageDivWrapper);
		sidebarControls.append(b2);

		if (window.CLOUD) {
			let b3 = $("<div id='switch_scenes' class='tab-btn hasTooltip button-icon blue-tab' data-name='Scenes' data-target='#scenes-panel'></div>").click(switch_control);
			let b3ImageDiv = $('<div></div>');
			let b3ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
			let b3Image = `${window.EXTENSION_PATH}assets/icons/photo.svg`;
			b3ImageDiv.css({
				"mask": `url(${b3Image}) no-repeat center / contain`,
				"-webkit-mask": `url(${b3Image}) no-repeat center / contain`
			});
			b3ImageDivWrapper.append(b3ImageDiv);
			b3.append(b3ImageDivWrapper);
			sidebarControls.append(b3);
		}
	} else {
		let b2 = $("<div id='switch_characters' class='tab-btn hasTooltip button-icon blue-tab' data-name='Players' data-target='#players-panel'></div>").click(switch_control);
		let b2ImageDiv = $('<div></div>');
		let b2ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
		let b2Image = `${window.EXTENSION_PATH}assets/icons/character.svg`;
		b2ImageDiv.css({ "mask": `url(${b2Image}) no-repeat center / contain`, "-webkit-mask": `url(${b2Image}) no-repeat center / contain` });
		b2ImageDivWrapper.append(b2ImageDiv);
		b2.append(b2ImageDivWrapper);
		sidebarControls.append(b2);
	}

	b6 = $("<div id='switch_sounds' class='tab-btn hasTooltip button-icon blue-tab' data-name='Sounds' data-target='#sounds-panel'></div>");
	let b6ImageDiv = $('<div></div>');
	let b6ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
	let b6Image = `${window.EXTENSION_PATH}assets/icons/speaker.svg`;
	b6ImageDiv.css({ "mask": `url(${b6Image}) no-repeat center / contain`, "-webkit-mask": `url(${b6Image}) no-repeat center / contain` });
	b6ImageDivWrapper.append(b6ImageDiv);
	b6.append(b6ImageDivWrapper);
	b6.click(switch_control);
	sidebarControls.append(b6);

	b4 = $("<div id='switch_journal' class='tab-btn hasTooltip button-icon blue-tab' data-name='Journal' data-target='#journal-panel'></div>");
	let b4ImageDiv = $('<div></div>');
	let b4ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
	let b4Image = `${window.EXTENSION_PATH}assets/conditons/note.svg`;
	b4ImageDiv.css({ "mask": `url(${b4Image}) no-repeat center / contain`, "-webkit-mask": `url(${b4Image}) no-repeat center / contain` });
	b4ImageDivWrapper.append(b4ImageDiv);
	b4.append(b4ImageDivWrapper);
	b4.click(switch_control);
	sidebarControls.append(b4);

	/*b4 = $("<button id='switch_spell' class='tab-btn hasTooltip button-icon' data-name='Spells' data-target='#spells-panel'></button>").click(switch_control);
	b4.append("<img src='"+window.EXTENSION_PATH + "assets/icons/magic-wand.svg' height='100%;'>");
	sidebarControls.append(b4);*/

	if (window.DM) {
		b7 = $("<div id='switch_settings' class='tab-btn hasTooltip button-icon trailing-edge blue-tab' data-name='Settings' data-target='#settings-panel'></div>");

		let b7ImageDiv = $('<div></div>');
		let b7ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
		let b7Image = `${window.EXTENSION_PATH}assets/icons/cog.svg`;
		b7ImageDiv.css({ "mask": `url(${b7Image}) no-repeat center / contain`, "-webkit-mask": `url(${b7Image}) no-repeat center / contain` });
		b7ImageDivWrapper.append(b7ImageDiv);
		b7.append(b7ImageDivWrapper);
		b7.click(switch_control);
		sidebarControls.append(b7);
	} else {
		b4.addClass("trailing-edge");
	}

	$(".tab-btn").on("click", function(e) {
		$(".tab-btn").removeClass('selected-tab');
		$(e.currentTarget).toggleClass('selected-tab');
	});

	if (!DM) {
		sidebarControls.addClass("player");
	}

	
	if (window.EXPERIMENTAL_SETTINGS["DEBUGddbDiceMonsterPanel"] === true) {
		change_sidbar_tab($("#switch_monsters"));
		$("#loading_overlay").css({ "opacity": "0.25" })
		$(".sidebar-panel-loading-indicator").css({ "opacity": "0.25" })
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

	cont.append("<h1 style='padding-bottom:2px;margin-bottom:2px; text-align:center'><img width='250px' src='" + window.EXTENSION_PATH + "assets/logo.png'><div style='margin-left:20px; display:inline;vertical-align:bottom;'>0.77</div></h1>");
	cont.append("<div style='font-style: italic;padding-left:80px;font-size:20px;margin-bottom:10px;margin-top:2px; margin-left:50px;'>Fine.. We'll do it ourselves..</div>");

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
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://github.com/cyruzzo/AboveVTT'>GitHub</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a></div>
		</div>

	</div>
	<div style='padding-top:10px;'>Project Owner/Founder: <b>Daniele <i>cyruzzo</i> Martini</b></div>
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
	cont.append("");
	cont.append("Contributors: <b>SnailDice (Nadav),Stumpy, Palad1N, KuzKuz, Coryphon, Johnno, Hypergig, JoshBrodieNZ, Kudolpf, Koals, Mikedave, Jupi Taru, Limping Ninja, Turtle_stew, Etus12, Cyelis1224, Ellasar, DotterTrotter, Mosrael, Bain, Faardvark, Azmoria, Natemoonlife</b>");

	cont.append("<br>AboveVTT is an hobby opensource project. It's completely free (like in Free Speech). The resources needed to pay for the infrastructure are kindly donated by the supporters through <a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a> , what's left is used to buy wine for cyruzzo");

	patreons = $("<div id='patreons'/>");

	l1 = ["Max Puplett","Jordan Cohen","Michael Saint Gregory","ZorkFox","Josh Downing","John Curran","Nathan Wilhelm","The Dread Pirate Mittens","Dennis Andree","Eric Invictus","VerintheCrow","Matthew Bennett","Tobias Ates","Nomad CLL","Pete Posey","D Martinez","Matthew Tallungan","Mike Miller"];
	l2 = ["Iain Russell","Lukas Edelmann","Oliver","Jordan Innerarity","Phillip Geurtz","Virginia Lancianese","Daniel Levitus","TheDigifire","Ryan Purcell","Kris Scott","Brendan Shane","Pucas McDookie","Elmer Senson","Adam Connor","Kim Dargeou","Scott Moore","Starving Actor","Kurt Piersol","Joaquin Atwood-Ward","Tittus","Rooster","Michael Palm","Robert Henry","Cynthia Complese","Wilko Rauert","Blaine Landowski","Cameron Patterson","Kyle Kroeker","Rodrigo Carril","E Lee Broyles","Ronen Gregory","Ben S","Steven Sheeley","Avilar","Bain .","ZetsumeiGaming","Cyril Sneer","Mark Otten","Vince Hamilton","Rollin Newcomb"];
	l3 = ["Daniel Wall","Cameron Warner","Martin Brandt","Amata (she_her)","Alexander Engel","Fini Plays","nategonz","Jason Osterbind","Adam Nothnagel","Miguel  Garcia Jr.","Kat","Cobalt Blue","Cody Vegas Rothwell","damian tier","CraftyHobo","CrazyPitesh","aaron hamilton","Eduardo Villela","Paul Maloney","David Meese","Chris Cannon","Johan Surac","Chris Sells","Sarah (ExpQuest)","Randy Zuendel","Invictus92","Robert J Correa","Cistern","its Bonez","BelowtheDM","Unlucky Archer","Michael Crane","Alexander Glass","Steve Vlaminck","Blake Thomas","Cheeky Sausage Games","Jerry Jones","Kevin Young","aDingoAteMyBaby","Rennie","Chris Meece","Victor Martinez","Michael Gisby","Arish Rustomji","Kat Wells","DH Ford","Michael Augusteijn","Jake Tiffany","LegalMegumin","Nicholas Phillips","Patrick Wolfer","Mage","Robert Sanderson","Michael Huffman","Rennan Whittington","Åsmund Gravem","Joseph Pecor","Bjscuba135","Erik Wilson","Luke Young","Scott Ganz","Brian Gabin","Rojo","Mischa","AnyxKrypt","KeithRichard-Thompson","Torben Schwank","Unix Wizard","Andrew Thomas","Yavor Vlaskov","Ciara McCumiskey","Daniel Long","Chealse Williams","Simon Brumby","Thomas Edwards","David Meier","Thomas Thurner","Scott Anderson","Casanova1986","Paul V Roundy IV","Jay Holt","Don Whitaker","Craig Liliefisher","BereanHeart Gaming","Gabriel Alves","Sylvain Gaudreau","Ben","Aaron Wilker","Roger Villeneuve","Alan Pollard","Oliver Kent","David Bonderoff","Sparty92","Raffi Minassian","Jon","Vlad Batory","glenn boardman","Urchin Prince","Nickolas Olmanson","Duncan Clyborne","Daisy Gonzalez","Rick Anderson","Steven Van Eckeren","Stellar5","Jack Posey","ThaFreaK","Stephen Morrey","Shawn Morriss","Tomi Skibinski","Eric VanSingel","Joey Lalor","Stumpt","Gabby Alexander","John Ramsburg","David Feig","xinara7","Kallas Thenos","Troy Knoell","Rob Parr","Jeff Jackson","Nunya Bidness","Christopher Davis","Marshall Súileabáin","Vandalo","Sky Gewant","Simon Perkins","Reid Bollinger","Konrad Scheffel","Thomas Thomas","Joseph Hensley","Chris Avis","Christian Weckwert","Titus France","Fabrizio Tronci","Michael Whittington","Simon Haldon","Thiago Neves","Garry Pettigrew","Brandin Steiner","Simone Anedda","Julian Bailey","Troy Hillier","Quinton Cooper","Angelus Drake","Richart Nopé","SalsaBeard","Eric Weberg","Xiax","BridgeWatch","Taking a cigarette","Santiago Mosqueda","Arpad","Gareth Welch","Daniel Cass","Luis Teixeira","shadowd","Jeffrey Voetsch","Jay Gattis","Assi","Trent McNeeley","Christopher","Ray Wise","Claudia Hall","Will Haning","Tom Jones","Ian Panth","Alfred","Jason","Chris Hagmann","Taylor Hodgson","BKBW","Tim Cortis","Timothy Yuen","Cody Pederson","Keovar","Benjamin Moncier","Bart Robbins","Kerry Kilgour","John Doty","Guillaume Carrier-Turcotte","Christian Fernandez","Rob S"];


	let shortener =  (p)=>p.length>17? p.replaceAll(" ","").replaceAll("-",""):p;
	l1=l1.map(shortener);
	l2=l2.map(shortener);
	l3=l3.map(shortener);

	l1div = $("<div class='patreons-title'>Masters</div>");
	l1ul = $("<ul/>");
	patreons.append(l1div);
	patreons.append(l1ul);
	for (i = 0; i < l1.length; i++)
		l1ul.append($("<li/>").text(l1[i]));

	l2div = $("<div class='patreons-title'>Heroes</div>");
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
		l3ul.append($("<li/>").text(l3[i].replaceAll(" ","")));

	//patreons.append(l1div).append(l2div).append(l3div)

	cont.append(patreons);
	cont.click(function() {
		$("#splash").remove();

	});

	let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal" ><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`);
	cont.append(closeButton);

	$(window.document.body).append(cont);

	setTimeout(function() {
		init_loading_overlay_beholder();
	}, 0)
	window.addEventListener("scroll", function(event) {
	   event.stopImmediatePropagation();
	}, true);
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

/* Attempts to force DDBs WebSocket to re-connect.
* Return false - wasn't able to force / no need
* Return true - was able to attempt force reconnect */
var DDB_WS_OBJ = null;
var DDB_WS_FORCE_RECONNECT_LOCK = false; // Best effort (not atomic) - ensure function is called only once at a time
function forceDdbWsReconnect() {
	try {
		if (DDB_WS_FORCE_RECONNECT_LOCK) {
			console.log("forceDdbWsReconnect is already locked!");
			return false;
		}

		if (window.navigator && !window.navigator.onLine) {
			console.log("No internet connection, cannot re-connect to DDBs WebSocket.");
			return false;
		}

		DDB_WS_FORCE_RECONNECT_LOCK = true;

		const key = Symbol.for('@dndbeyond/message-broker-lib');
		if (key) {
			DDB_WS_OBJ = window[key];
		}

		if (DDB_WS_OBJ && DDB_WS_OBJ.status == 'disconnected') {
			console.log("Detected that DDBs WebSocket is disconnected - attempting to force reconnect.");
			DDB_WS_OBJ.reset();
			DDB_WS_OBJ.connect();
			get_cobalt_token(function(token) {
				window.MB.loadWS(token, null);

				// Wait 8 seconds before checking again if the websocket is connected
				setTimeout(function() {
					if (DDB_WS_OBJ.status == 'open') {
						console.log("Managed to reconnect DDBs WebSocket successfully!");
					}
					DDB_WS_FORCE_RECONNECT_LOCK = false;
				}, 8000);
			});

			return true;
		}

		DDB_WS_FORCE_RECONNECT_LOCK = false;

		return false;
	} catch(e) {
		console.log("forceDdbWsReconnect error: " + e);
		DDB_WS_FORCE_RECONNECT_LOCK = false;
	}
}


function init_spells() {
	return; // this isn't used anywhere so stop building it


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
		
function minimize_player_window_double_click(titleBar) {
	titleBar.off('dblclick').on('dblclick', function() {
		if(titleBar.hasClass("restored")) {
			titleBar.data("prev-height", titleBar.height());
			titleBar.data("prev-width", titleBar.width() - 3);
			titleBar.data("prev-top", titleBar.css("top"));
			titleBar.data("prev-left", titleBar.css("left"));
			titleBar.css("top", titleBar.data("prev-minimized-top"));
			titleBar.css("left", titleBar.data("prev-minimized-left"));	
			titleBar.height(23);
			titleBar.width(200);
			titleBar.addClass("minimized");
			titleBar.removeClass("restored");
			titleBar.prepend('<div class="player_title">Player: '+$("#sheet iframe").contents().find(".ddbc-character-name").text()+"</div>");
		} else if(titleBar.hasClass("minimized")) {
			titleBar.data("prev-minimized-top", titleBar.css("top"));
			titleBar.data("prev-minimized-left", titleBar.css("left"));
			titleBar.height(titleBar.data("prev-height"));
			titleBar.width(titleBar.data("prev-width"));
			titleBar.css("top", titleBar.data("prev-top"));
			titleBar.css("left", titleBar.data("prev-left"));
			titleBar.addClass("restored");
			titleBar.removeClass("minimized");
			$(".player_title").remove();
		}
	});
}

function frame_z_index_when_click(moveableFrame){
	//move frames behind each other in the order they were clicked
	if(moveableFrame.css('z-index') != 50000) {
		moveableFrame.css('z-index', 50000);
		$(".moveableWindow, [role='dialog']").not(moveableFrame).each(function() {
			$(this).css('z-index',($(this).css('z-index')-1));
		});
	}
}


function observe_character_sheet_companion(documentToObserve){
	console.group("observe_character_sheet_companion")
	let mutation_target = documentToObserve.get(0);
	let mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };

	function handle_observe_character_sheet_companion(e) {
		e.stopPropagation();
		console.log(e)
		let tokenName = $(this).parent().find('.ddbc-extra-name').find("span").text()
		console.log("pretending to add a companion ", tokenName)
	}

	let companion_observer = new MutationObserver(function() {
		let extras = documentToObserve.find(".ct-extra-row__preview:not('.above-vtt-visited')");
		if (extras.length > 0){
			extras.wrap(function() {
				$(this).addClass("above-vtt-visited");
				let button = $("<button class='above-aoe integrated-dice__container' aria-label=Add "+$(this.closest(".ddbc-extra-name"))+" to encounter></button>");
				button.css("border-width","1px");
				button.css("min-height","34px");
				button.click((e) => handle_observe_character_sheet_companion(e))
				return button;
			})
			console.log(`${extras.length} companions discovered`);
		}
	});
	companion_observer.observe(mutation_target,mutation_config);
	console.groupEnd()
}



function init_sheet(){	
	if (is_characters_page()) {
		
		// in case we're re-initializing, remove these before adding them again
		$("#sheet_button").remove();
		$("#sheet_resize_button").remove();

		// when playing on the characters page, we need to do a little bit of UI manipulation so we do that here
		var sheet_button = $("<div id='sheet_button' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Show/hide character sheet (SPACE)'><div class='ddbc-tab-options__header-heading'>SHEET</div></div>");
		sheet_button.css({ "position": "absolute", "top": "-3px", "left": "-80px", "z-index": "999" });
		sheet_button.find(".ddbc-tab-options__header-heading").css({ "padding": "6px" });
		$(".avtt-sidebar-controls").append(sheet_button);
		sheet_button.click(function(e) {
			toggle_player_sheet();
		});
		var sheet_resize_button = $("<div id='sheet_resize_button' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Resize character sheet'><div class='ddbc-tab-options__header-heading'>Toggle Sheet Size</div></div>");
		sheet_resize_button.css({ "position": "absolute", "top": "-3px", "left": "-285px", "z-index": "999" });
		sheet_resize_button.find(".ddbc-tab-options__header-heading").css({ "padding": "6px" });
		$(".avtt-sidebar-controls").append(sheet_resize_button);
		// $(".ct-character-sheet__inner").append(sheet_resize_button);
		sheet_resize_button.click(function(e) {
			toggle_player_sheet_size();
		});

		if (window.innerWidth < 1200 || !is_player_sheet_open()) {
			sheet_resize_button.hide();
		}

		// we're playing on the character page so return early to prevent an iframe from also loading the character sheet
		return;
	}

	let container = $("<div id='sheet'></div>");
	let iframe = $("<iframe src=''></iframe>")
	container.append(iframe);

	var buttonleft = 0;
	var buttonprev = 0;

	const player_close_title_button=$('<div id="player_close_title_button"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>');
	container.append(player_close_title_button);
	player_close_title_button.click(function() {
		close_player_sheet();
	});

	var reload_button = $('<div id="reload_player_frame_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>)');


	reload_button.click(function() {
		let iframe = $("#sheet").find("iframe");
		let currentSrc = iframe.attr('src');
		iframe.attr('src', currentSrc);
	});
	container.append(reload_button);
	
	$("#site").append(container);

	if(window.DM){
		/*Set draggable and resizeable on player sheets. Allow dragging and resizing through iFrames by covering them to avoid mouse interaction*/
		$("#sheet").addClass("moveableWindow");
		if(!$("#sheet").hasClass("minimized")){
			$("#sheet").addClass("restored"); 
		}
		$("#sheet").resizable({
			addClasses: false,
			handles: "all",
			containment: "#windowContainment",
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();
			},
			minWidth: 200,
			minHeight: 200
		});

		$("#sheet").mousedown(function(){
			frame_z_index_when_click($(this));
		});
		$("#sheet").draggable({
			addClasses: false,
			scroll: false,
			containment: "#windowContainment",
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();
			}
		});
		minimize_player_window_double_click($("#sheet"));
	}
	if (!window.DM) {

		sheet_button = $("<div id='sheet_button' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Show/hide character sheet (SPACE)'><div class='ddbc-tab-options__header-heading'>SHEET</div></div>");
		sheet_button.css({ "position": "absolute", "top": "-3px", "left": "-80px", "z-index": "999" });
		sheet_button.find(".ddbc-tab-options__header-heading").css({ "padding": "6px" });

		$(".avtt-sidebar-controls").append(sheet_button);

		sheet_button.click(function(e) {
			open_player_sheet(window.PLAYER_SHEET);
		});
	}
}

function init_player_sheet(pc_sheet, loadWait = 0)
{

	if (is_characters_page()) {
		// characters page manipulates the html on the page instead of loading an iframe
		return;
	}
	if (pc_sheet === undefined || pc_sheet.length == 0) {
		// This happens for the DM representation.
		return;
	}

	let container = $("#sheet");
	let iframe = container.find("iframe");
	iframe.attr('src', '');
	iframe.attr('data-sheet_url', pc_sheet);
	iframe.attr('data-init_load', 0);

	if((!window.DM) ||(window.KEEP_PLAYER_SHEET_LOADED))
	{
		var loadSheet = function (sheetFrame, sheet_url) {
			sheetFrame.attr('src', sheet_url);
		};
		setTimeout(loadSheet, loadWait,iframe,pc_sheet);
	}
}

/// documentToObserve is `$(document)` on the characters page, and `$(event.target).contents()` every where else
function observe_character_sheet_aoe(documentToObserve) {

	let mutation_target = documentToObserve.get(0);
	let mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };
	let container = $("#sheet");
	if (is_characters_page()) {
		container = $(".ct-character-sheet__inner");
	}

	let aoe_observer = new MutationObserver(function() {
		let icons = documentToObserve.find(".ddbc-note-components__component--aoe-icon:not('.above-vtt-visited')");
		if (icons.length > 0){
			icons.wrap(function(){
				$(this).addClass("above-vtt-visited");
				let button = $("<button class='above-aoe integrated-dice__container'></button>");
				button.css("border-width","1px");
				button.click(function(e){
					e.stopPropagation();

					// figure out color
					color = 'default';
					dmg_icon = $(this).closest('.ct-spells-spell').find('.ddbc-damage-type-icon')
					if (dmg_icon.length == 1){
						color = dmg_icon.attr('class').split(' ').filter(d => d.startsWith('ddbc-damage-type-icon--'))[0].split('--')[1];
					}

					// grab shape (this should always exist)
					shape = $(this).find('svg').first().attr('class').split(' ').filter(c => c.startsWith('ddbc-aoe-type-icon--'))[0].split('--')[1];

					// grab feet (this should always exist)
					feet = $(this).prev().children().first().children().first().text();

					// hide the sheet, and drop the token. Don't reopen the sheet because they probably  want to position the token right away
					hide_player_sheet();
					close_player_sheet();
					drop_aoe_token(color, shape, feet);
				});
				return button;
			});
			console.log(`${icons.length} aoe spells discovered`);
		}
	});

	aoe_observer.observe(mutation_target,mutation_config);
}

function init_player_sheets()
{
	return;
	// preload character sheets
	// wait a few seconds before actually loading the iframes, and wait a second between each load to avoid 429 errors
	var sheetLoadWait = 4000;
	window.pcs.forEach(function(pc, index) {
		init_player_sheet(pc.sheet, sheetLoadWait);
		sheetLoadWait += 1500;
	});
}


function open_player_sheet(sheet_url, closeIfOpen = true) {
	if($("#sheet.minimized").length>0) {
		$("#sheet.minimized").dblclick();
	}
	console.log("open_player_sheet"+sheet_url);
	if (is_characters_page()) {
		return;
	}
	close_player_sheet(); // always close before opening

	let container = $("#sheet");
	let iframe = container.find("iframe");
	
	
	iframe.css('height', container.height() - 25);
	container.addClass("open");


	iframe.attr('data-sheet_url',sheet_url);
	iframe.attr('src', sheet_url);

	// lock this sheet
	window.MB.sendMessage("custom/myVTT/lock", { player_sheet: sheet_url });
	iframe.off("load").on("load", function(event) {
		console.log("fixing up the character sheet");
		$(event.target).contents().find("head").append(`
			<style>
			button.avtt-roll-button {
				/* lifted from DDB encounter stat blocks  */
				color: #b43c35;
				border: 1px solid #b43c35;
				border-radius: 4px;
				background-color: #fff;
				white-space: nowrap;
				font-size: 14px;
				font-weight: 600;
				font-family: Roboto Condensed,Open Sans,Helvetica,sans-serif;
				line-height: 18px;
				letter-spacing: 1px;
				padding: 1px 4px 0;
			}			
			.MuiPaper-root {
				padding: 0px 16px;
				width: 100px;
			}
			.MuiListItemText-root {
				flex: 1 1 auto;
				min-width: 0;
				margin-top: 4px;
				margin-bottom: 4px;
			}
			.MuiButtonBase-root {
				width: 100%;
			}
			</style>
		`);
		console.log("removing headers");
		$(event.target).contents().find("#mega-menu-target").remove();
		$(event.target).contents().find(".site-bar").remove();
		$(event.target).contents().find(".page-header").remove();
		$(event.target).contents().find(".homebrew-comments").remove();

		$(event.target).contents().on("DOMNodeInserted", function(addedEvent) {
			let addedElement = $(addedEvent.target);
			if (addedElement.hasClass("ct-sidebar__pane")) {
				let statBlock = addedElement.find(".ct-creature-pane");
				if (statBlock.length > 0) {
					scan_player_creature_pane(statBlock);
				}
			}
		});
		$(event.target).contents().on("DOMSubtreeModified", ".ct-sidebar__pane", function(modifiedEvent) {
			let statBlock = $(modifiedEvent.target).find(".ct-creature-pane");
			if (statBlock.length > 0) {
				scan_player_creature_pane(statBlock);
			}
		});

		// DICE STREAMING ?!?!
		if(!window.DM){
			let firstTime=false;
			if(!window.MYMEDIASTREAM)
				firstTime = true;
			let diceRollPanel = $(event.target).contents().find(".dice-rolling-panel__container");
			if (diceRollPanel.length > 0) {
				window.MYMEDIASTREAM = diceRollPanel.get(0).captureStream(0);


				if (window.JOINTHEDICESTREAM) {
					// we should tear down and reconnect
					for (let i in window.STREAMPEERS) {
						console.log("replacing the track")
						window.STREAMPEERS[i].getSenders()[0].replaceTrack(window.MYMEDIASTREAM.getVideoTracks()[0]);
					}
				}

			}

		}

		// CHARACTER
		let tokenid = $(event.target).attr('src');
		var synchp = function() {
			var hp_element = $(event.target).contents().find(".ct-health-summary__hp-group--primary > div:nth-child(1) .ct-health-summary__hp-number,ct-status-summary-mobile__hp-current");

			if (hp_element.length > 0) {
				var current_hp = hp_element.html();
				var max_hp = $(event.target).contents().find(".ct-health-summary__hp-group--primary > div:nth-child(3) .ct-health-summary__hp-number,ct-status-summary-mobile__hp-max").html();
			}
			else {
				var current_hp = 0;
				if (!window.DM && window.PLAYERDATA && window.PLAYERDATA.max_hp > 0)
					max_hp = window.PLAYERDATA.max_hp;
				else
					max_hp = 0;
			}

			var temp_hp = 0;
			var temp_hp_element = $(event.target).contents().find(".ct-health-summary__hp-item--temp > .ct-health-summary__hp-item-content > .ct-health-summary__hp-number ");
			if (temp_hp_element.length > 0) {
				temp_hp = temp_hp_element.html();
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

			$(event.target).contents().find('.ct-quick-info__ability,.ct-main-mobile__ability').each(function() {
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
				id: tokenid,
				hp: current_hp,
				max_hp: max_hp,
				temp_hp: temp_hp,
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


		// DISABLED SINCE WE NOW READ JSON DATA FOR THE CHARACTER.
		/*
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
		*/
		var mutation_target = $(event.target).contents().get(0);
		var mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };

		observe_character_sheet_aoe($(event.target).contents());
		// WIP to allow players to add in tokens from their extra tab
		// observe_character_sheet_companion($(event.target).contents());
		
		var observer = new MutationObserver(function(mutations) {
			console.log('scattai');
			var sidebar = $(event.target).contents().find(".ct-sidebar__pane-content");
			if (sidebar.length > 0 && $(event.target).contents().find("#castbutton").length == 0) {
				inject_sidebar_send_to_gamelog_button($(event.target).contents().find(".ct-sidebar__pane-content > div"));
			}
		});

		observer.observe(mutation_target, mutation_config);

		/*const waitToSync = (timeElapsed = 0) => {
			setTimeout(() => {
				var ac_element = $(event.target).contents().find(".ct-combat .ddbc-armor-class-box,ct-combat-mobile__extra--ac");
				if (ac_element.length > 0) {
					synchp();
					$(event.target).attr('data-init_load', 1);
				} else {
					if (timeElapsed < 15000) {
						waitToSync(timeElapsed + 500);
					}
				}
			}, 500);
		};
		waitToSync();*/

		setTimeout(function() {
			$("#sheet").find("iframe").each(function() { 
				// we've removed some header stuff, so move the background image up to remove the dead space
				$(this.contentDocument.body).css("background-position-y", "90px");
			})
		}, 1000);
	});
	
	$("#sheet").find("button").css('display', 'inherit');
	// reload if there have been changes
	if(iframe.attr('data-changed') == 'true')
	{
		iframe.attr('data-changed','false');
		iframe.attr('src', function(i, val) { return val; });
	}
}

function close_player_sheet()
{
	let container = $("#sheet");
	container.removeClass("open");
	let iframe = container.find("iframe");
	let sheet_url = iframe.attr('data-sheet_url');
	iframe.attr('data-sheet_url', '');
	iframe.attr('src', '');
	iframe.off("load");
	if(window.DM) {
		window.MB.sendMessage("custom/myVTT/unlock", { player_sheet: sheet_url });
	} else {
		if(window.STREAMTASK){
			clearInterval(window.STREAMTASK);
			window.STREAMTASK=false;
		}
		window.MB.sendMessage("custom/myVTT/player_sheet_closed", { player_sheet: window.PLAYER_SHEET });
	}
}

function notify_player_join() {
	var playerdata = {
		abovevtt_version: abovevtt_version,
		player_id: window.PLAYER_ID
	};

	console.log("Sending playerjoin msg, abovevtt version: " + playerdata.abovevtt_version + ", sheet ID:" + window.PLAYER_ID);
	window.MB.sendMessage("custom/myVTT/playerjoin", playerdata);
}

function check_versions_match() {
	var latestVersionSeen = 0.0;
	var oldestVersionSeen = 1000.0;
	
	$.each(window.CONNECTED_PLAYERS, function(key, value) {
		latestVersionSeen = Math.max(latestVersionSeen, value);
		oldestVersionSeen = Math.min(oldestVersionSeen, value);
	});

	if (latestVersionSeen != oldestVersionSeen) {
		var alertMsg = 'Not all players connected to your session have the same AboveVTT version (highest seen v' + latestVersionSeen + ', lowest seen v' + oldestVersionSeen + ').\nFor best experience, it is recommended all connected players and the DM run the latest AboveVTT version.\n\n';		
		for (const [key, value] of Object.entries(window.CONNECTED_PLAYERS)) {
			alertMsg += (key == 0 ? "The DM" : "Player DDB character ID " + key) + " is running AboveVTT v" + value + "\n";
		}

		alert(alertMsg);
	}

	return latestVersionSeen;
}

/** @returns {String} The id of the `game` which is usually the same as the campaign id */
function find_game_id() {
	if (window.gameId === undefined) {
		if (is_encounters_page()) {
			const urlParams = new URLSearchParams(window.location.search);
			window.gameId = urlParams.get('cid');
		} else {
			window.gameId = $("#message-broker-client").attr("data-gameId");
		}
	}
	return window.gameId;
};

/** returns true if all connected users are on a version that is greater than or equal to `versionString` */
function is_supported_version(versionString) {
	return abovevtt_version >= versionString;
}




function init_above(){
	console.log("init_above");

	// WORKAROUND FOR ANNOYING DDB BUG WITH COOKIES AND UPVOTING STUFF
	document.cookie="Ratings=;path=/;domain=.dndbeyond.com;expires=Thu, 01 Jan 1970 00:00:00 GMT"; 
	// END OF IT
	//window.STARTING = true;
	let gameId = find_game_id();

	let http_api_gw="https://services.abovevtt.net";
	let searchParams = new URLSearchParams(window.location.search);
	if(searchParams.has("dev")){
		http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
	}

	//THIS SHOULD HAVE ALREADY BEEN SET
	// window.CAMPAIGN_SECRET=$(".ddb-campaigns-invite-primary").text().split("/").pop();
	//let gameid = $("#message-broker-client").attr("data-gameId");
	
	let hasData=false;
	if (localStorage.getItem('ScenesHandler' + gameId) != null){
		hasData=true;
	}
	if (localStorage.getItem('Migrated' + gameId) != null){
		hasData=false;
	}

	

	$.ajax({
		url:http_api_gw+"/services?action=getCampaignData&campaign="+window.CAMPAIGN_SECRET,
		success:function(campaignData){
			console.log(campaignData);
			if(campaignData.Item && campaignData.Item.data && campaignData.Item.data.cloud){
				window.CLOUD=true;
				init_things();
			}
			else{ // CHECK IF THIS IS A NEW CAMPAIGN
				if (hasData || (window.FORCED_DM)) {
					console.log("**********UNMIGRATED CAMPAIGN*************");
					window.CLOUD=false;
					init_things();
				}
				else{ // THIS IS A VIRGIN CAMPAIGN. LET'S SET IT UP FOR THE CLOUD!!! :D :D :D :D 
					if(window.DM){
						$.ajax({
							url:http_api_gw+"/services?action=setCampaignData&campaign="+window.CAMPAIGN_SECRET,
							type:'PUT',
							contentType:'application/json',
							data:JSON.stringify({
								cloud:1
							}),
							success: function(){
								console.log("******* WELCOME TO THE CLOUD*************")
								window.CLOUD=true;
								init_things();
							}
						});
					}
					else{ // PLAYER SHOULD NOT FORCE CLOUD MIGRATION
						window.CLOUD=false;
						init_things();
					}

				}


			}
			
		}
	}
	)

}

function init_things() {
	console.log("init things");
	window.STARTING = true;
	let searchParams = new URLSearchParams(window.location.search)
	var gameid = $("#message-broker-client").attr("data-gameId");
	window.TOKEN_OBJECTS = {};
	window.REVEALED = [];
	window.DRAWINGS = [];
	window.PLAYER_STATS = {};
	window.CONNECTED_PLAYERS = {};
	window.TOKEN_SETTINGS = $.parseJSON(localStorage.getItem('TokenSettings' + gameId)) || {};
	window.EXPERIMENTAL_SETTINGS = $.parseJSON(localStorage.getItem('ExperimentalSettings' + gameId)) || {};
	window.CURRENTLY_SELECTED_TOKENS = [];
	window.TOKEN_PASTE_BUFFER = [];
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};

	if (window.CAMPAIGN_SECRET === undefined) {
		window.CAMPAIGN_SECRET=$(".ddb-campaigns-invite-primary").text().split("/").pop();
	}

	window.MB = new MessageBroker();
	window.StatHandler = new StatHandler();

	if (window.DM) {
		window.CONNECTED_PLAYERS['0'] = abovevtt_version; // ID==0 is DM
		window.ScenesHandler = new ScenesHandler(gameId);
		window.EncounterHandler = new EncounterHandler(function(didSucceed) {
			if (didSucceed === false) {
				alert("An unexpected error occurred! Please check the developer console for errors, and report this via the AboveVTT Discord.");
			}
			init_ui();
			if (is_encounters_page()) {
			
				// This brings in the styles that are loaded on the character sheet to support the "send to gamelog" feature.
				$("body").append(`<link rel="stylesheet" type="text/css" href="https://media.dndbeyond.com/character-tools/styles.bba89e51f2a645f81abb.min.css" >`);

				$("#site-main").css({"display": "block", "visibility": "hidden"});
				$(".dice-rolling-panel").css({"visibility": "visible"});
				$("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
				$("div.dice-toolbar").css({"bottom": "35px"});
				$("#ddbeb-popup-container").css({"display": "block", "visibility": "visible"});
			}
			
			init_scene_selector();
			init_splash();
			
		});
	} else if (is_characters_page()) {
		
		hide_player_sheet();
		init_character_page_sidebar();

		$(window).off("resize").on("resize", function() {
			// when the user resizes the window, bring everything out into view. They can alwasy re-hide it if they want to
			setTimeout(function() {
				init_character_page_sidebar();
				hide_sidebar();
			}, 500);
		});

	} else {
		init_ui();
		init_splash();
	}

	$("#site").append("<div id='windowContainment'></div>");
}

/// this is used when initializing on the character page. DDB loads the page in an async modular fashion. We use this to determine if we need to call other initialization functions during this process
var needs_ui = true;
/// DDB loads the page in an async modular fashion. As they are injecting things, we need to adjust the UI in the sidebar. This will loop until everything is loaded and adjusted to our liking.
function init_character_page_sidebar() {
	if ($(".ct-sidebar__portal").length == 0) {
		// not ready yet, try again in a second
		setTimeout(function() {
			init_character_page_sidebar();
		}, 1000);
		return;
	}

	// open the gamelog, and lock it open
	$(".ct-character-header__group--game-log").click();
	$(".ct-sidebar__control--unlock").click();

	// after that click, give it a second to inject and render the sidebar
	setTimeout(function() {

		$("#site-main").css({"display": "block", "visibility": "hidden"});
		$(".dice-rolling-panel").css({"visibility": "visible"});
		$("div.dice-toolbar").css({"bottom": "35px"});
		$("#mega-menu-target").hide();		
		$(".ct-character-header-desktop").css({
			"background": "rgba(0,0,0,.85)"
		});

		$("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
		$(".ct-sidebar__control--unlock").click();
		$("div.sidebar").parent().css({"display": "block", "visibility": "visible"});
		$(".ct-sidebar__pane-top").hide();
		$(".ct-sidebar__pane-bottom").hide();
		$(".ct-sidebar__pane-gap").hide();
		$(".ct-sidebar__pane-content").css({"border": "none", "padding-bottom": "0px"});
		$(".ct-sidebar__portal").css({
			"right": "0px",
			"position": "fixed",
			"bottom": "0px",
			"top": "0px",
			"z-index": 5
		});
		$(".ct-sidebar").css({ "right": "0px", "top": "0px", "bottom": "0px" });		
		$(".ct-sidebar__portal .ct-sidebar .ct-sidebar__inner .ct-sidebar__controls .avtt-sidebar-controls").css("display", "flex")

		$(".ct-sidebar__pane").on("click", ".set-conditions-button", function(clickEvent) {
			let conditionName = $(clickEvent.target).parent().find("span").text();
		  	$('.ct-combat__statuses-group--conditions .ct-combat__summary-label, .ct-combat-tablet__cta-button, .ct-combat-mobile__cta-button').click(); 	  	
		  	$(`.ct-sidebar__pane .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>.ddbc-toggle-field--is-disabled`).click();
		  	$(`#switch_gamelog`).click();
		});
		$(".ct-sidebar__pane").on("click", ".remove-conditions-button", function(clickEvent) {
			let conditionName = $(clickEvent.target).parent().find("span").text();
		  	$('.ct-combat__statuses-group--conditions .ct-combat__summary-label, .ct-combat-tablet__cta-button, .ct-combat-mobile__cta-button').click(); 	
		  	$(`.ct-sidebar__pane .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>.ddbc-toggle-field--is-enabled`).click();
		  	$(`#switch_gamelog`).click();

		});
		if (needs_ui) {
			needs_ui = false;
			window.PLAYER_NAME = $(".ddbc-character-name").text();
			try {
				// this should be just fine, but catch any parsing errors just in case
				window.PLAYER_IMG = get_higher_res_url($(".ddbc-character-avatar__portrait").css("background-image").slice(4, -1).replace(/"/g, ""));
			} catch {}
			init_ui();
			reposition_player_sheet();
			monitor_character_sidebar_changes();
			hide_player_sheet();
			init_splash();
			$("#loading_overlay").css("z-index", 0); // allow them to see their character sheets, etc even if the DM isn't online yet
			observe_character_sheet_aoe($(document));
			// WIP to allow players to add in tokens from their extra tab
			// observe_character_sheet_companion($(document));
			
		} else {
			init_controls();
			init_sheet();	
			inject_chat_buttons();
			init_zoom_buttons();
		}
	}, 1000);
}

/// when we play on the character sheet, we need to monitor for gamelog changes because DDB swaps it out frequently. Any time they do that, we need to react to those changes
function monitor_character_sidebar_changes() {

	$(".ct-character-header__group--game-log").click(function(event) {
		if (event.originalEvent !== undefined) {
			// the user actually clicked the button. Make sure we switch tabs
			$("#switch_gamelog").click();
		}
	});

	$(".ct-sidebar__portal").on("DOMNodeRemoved", function(event) {
		// console.log(`sidebar removed: ${event.target.classList}`);
		if ($(event.target).hasClass("ct-game-log-pane")) {
			// the gamelog was removed to show character sheet details. Switch to it
			setTimeout(function() {
				change_sidbar_tab($("#switch_gamelog"), true);
				// deselect the gamelog tab since we're not technically showing the gamelog
				deselect_all_sidebar_tabs();
				$("#switch_gamelog svg").attr("class", "gamelog-button__icon");
			}, 0);
		}
	});
	$(".ct-sidebar__portal").on("DOMNodeInserted", function(event) {
		// console.log(`sidebar inserted: ${event.target.classList}`);
		let addedElement = $(event.target);
		if (addedElement.hasClass("ct-game-log-pane")) {
			inject_chat_buttons();
			window.MB.reprocess_chat_message_history();
		}
		if (addedElement.hasClass("ct-creature-pane")) {
			scan_player_creature_pane(addedElement);
		}

		if (addedElement.closest(".ct-game-log-pane").length == 0 && addedElement.find(".ct-sidebar__header").length > 0 && addedElement.find(".ddbc-html-content").length > 0 && addedElement.find("#castbutton").length == 0) {
			// we explicitly don't want this to happen in `.ct-game-log-pane` because otherwise it will happen to the injected gamelog messages that we're trying to send here
			inject_sidebar_send_to_gamelog_button(addedElement);
		}
	});

	$(".ct-sidebar__portal").on("DOMSubtreeModified", function(event) {
		// console.log(`sidebar modified: ${event.target.classList}`);
		let modifiedElement = $(event.target);
		if (modifiedElement.hasClass("ct-sidebar__pane-content")) {
			// The user clicked on something that shows details. Open the sidebar and show it
			show_sidebar();
		}
	});
	$(".ddbc-tab-list__content").on("DOMSubtreeModified", function(event) {
		if (!is_player_sheet_full_width()) {
			$(".ct-primary-box").css({ "height": "610px" });
			$(".ddbc-tab-options__content").css({ "height": "510px" });
			// these need a little more space due to the filter search bar
			$(".ct-extras").css({ "height": "540px" });
			$(".ct-equipment").css({ "height": "540px" });
			$(".ct-spells").css({ "height": "540px" });
		}
	});

}

// when the user clicks on an item in a character sheet, the details are shown in a sidebar. This will inject a "send to gamelog" button and properly send the pertinent sidebar content to the gamelog.
function inject_sidebar_send_to_gamelog_button(sidebarPaneContent) {
	// we explicitly don't want this to happen in `.ct-game-log-pane` because otherwise it will happen to the injected gamelog messages that we're trying to send here
	let button = $("<button id='castbutton'>SEND TO GAMELOG</button>");
	button.css({
		"margin": "10px 0px",
		"border": "1px solid #bfccd6",
		"border-radius": "4px",
		"background-color": "transparent",
		"color": "#394b59"
	});
	sidebarPaneContent.prepend(button);
	button.click(function() {
		// make sure the button grabs dynamically. Don't hold HTML in the button click block because clicking on items back to back will fuck that up

		let sidebar = sidebarPaneContent.closest(".ct-sidebar__portal");
		let toInject = $(`<div></div>`);
		toInject.attr("class", sidebarPaneContent.attr("class")); // set the class on our new element
		// required
		toInject.append(sidebar.find(".ct-sidebar__header").clone());

		// these are optional, but if they're here, grab them
		toInject.append(sidebarPaneContent.find(".ddbc-property-list").clone());
		toInject.append(sidebarPaneContent.find(".ct-spell-detail__level-school").clone());
		toInject.append(sidebarPaneContent.find(".ct-speed-manage-pane__speeds").clone());
		toInject.append(sidebarPaneContent.find(".ct-armor-manage-pane__items").clone());
		
		if (sidebarPaneContent.find(".ct-creature-pane__block").length > 0) {
			// extras tab creatures need a little extra love
			toInject.append(sidebarPaneContent.find(".ct-creature-pane__block").clone());
			toInject.append(sidebarPaneContent.find(".ct-creature-pane__full-image").clone());
			toInject.find(".ct-sidebar__header").css({
				"margin-left": "20px",
				"margin-right": "20px"
			});
		} else {
			// required... unless it's an extras tab creature
			toInject.append(sidebar.find(".ddbc-html-content").clone());
		}

		// now clean up any edit elements
		toInject.find(".ct-container-pane__pencil").remove();

		let html = window.MB.encode_message_text(toInject[0].outerHTML);
		data = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: html
		};
		window.MB.inject_chat(data);
		notify_gamelog();
	});
}

/// We add dice buttons and an input for chatting in the gamelog. This does that injection on initial load as well as any time the character sheet re-adds the gamelog to the sidebar. see `monitor_character_sidebar_changes` for more details on sidebar changes
function inject_chat_buttons() {
	if ($(".glc-game-log").find("#chat-text").length > 0) {
		// make sure we only ever inject these once. This gets called a lot on the character sheet which is intentional, but just in case we accidentally call it too many times, let's log it, and return
		return;
	}
	// AGGIUNGI CHAT
	// the text has to be up against the left for it to style correctly
	$(".glc-game-log").append($(`<div class='chat-text-wrapper sidebar-hovertext' data-hover="Dice Rolling Format: /cmd diceNotation action  &#xa;\
'/r 1d20'&#xa;\
'/roll 1d4 punch:damage'&#xa;\
'/hit 2d20kh1+2 longsword ADV'&#xa;\
'/dmg 1d8-2 longsword'&#xa;\
'/save 2d20kl1 DEX DISADV'&#xa;\
'/skill 1d20+1d4 Theives' Tools + Guidance'&#xa;\
Advantage: 2d20kh1 (keep highest)&#xa;\
Disadvantage: 2d20kl1 (keep lowest)&#xa;&#xa;\
'/w [playername] a whisper to playername'"><input id='chat-text' autocomplete="off" placeholder='Chat, /r 1d20+4..'></div>`));

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
		if ($(".dice-toolbar__dropdown").length > 0) {
			// DDB dice are on the screen so let's use those. Ours will synchronize when these change.
			if (!$(".dice-toolbar__dropdown").hasClass("dice-toolbar__dropdown-selected")) {
				// make sure it's open
				$(".dice-toolbar__dropdown-die").click();
			}
			// select the DDB dice matching the one that the user just clicked
			let dieSize = $(this).attr("alt");
			$(`.dice-die-button[data-dice='${dieSize}']`).click();
		} else {
			// there aren't any DDB dice on the screen so use our own 
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
		}
	});

	$(".dice-toolbar__dropdown").on("DOMSubtreeModified", function() {
		// Any time the DDB dice buttons change state, we want to synchronize our dice buttons to match theirs.
		$(".dice-die-button").each(function() {
			let dieSize = $(this).attr("data-dice");
			let ourDiceElement = $(`.dice-roller > div img[alt='${dieSize}']`);
			let diceCountElement = $(this).find(".dice-die-button__count");
			ourDiceElement.parent().find("span").remove();
			if (diceCountElement.length == 0) {
				ourDiceElement.removeAttr("data-count");
			} else {
				let diceCount = parseInt(diceCountElement.text());
				ourDiceElement.attr("data-count", diceCount);
				ourDiceElement.parent().append(`<span class="dice-badge">${diceCount}</span>`);
			}
		})

		// make sure our roll button is shown/hidden after all animations have completed
		setTimeout(function() {
			if ($(".dice-toolbar").hasClass("rollable")) {
				$(".roll-button").addClass("show");
			} else {
				$(".roll-button").removeClass("show");
			}
		}, 0);
	});

	$(".dice-roller > div img").on("contextmenu", function(e) {
		e.preventDefault();

		if ($(".dice-toolbar__dropdown").length > 0) {
			// There are DDB dice on the screen so update those buttons. Ours will synchronize when these change.
			// the only way I could get this to work was with pure javascript. Everything that I tried with jQuery did nothing
			let dieSize = $(this).attr("alt");
			var element = $(`.dice-die-button[data-dice='${dieSize}']`)[0];
			var e = element.ownerDocument.createEvent('MouseEvents');
			e.initMouseEvent('contextmenu', true, true,
					element.ownerDocument.defaultView, 1, 0, 0, 0, 0, false,
					false, false, false, 2, null);
			element.dispatchEvent(e);
		} else {
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
		}
	});

	if ($(".roll-button").length == 0) {
		const rollButton = $(`<button class="roll-button">Roll</button>`);
		$("body").append(rollButton);
		rollButton.on("click", function (e) {
	
			if ($(".dice-toolbar").hasClass("rollable")) {
				let theirRollButton = $(".dice-toolbar__target").children().first();
				if (theirRollButton.length > 0) {
					// we found a DDB dice roll button. Click it and move on
					theirRollButton.click();
					return;
				}
			}
	
			const rollExpression = [];
			$(".dice-roller > div img[data-count]").each(function() {
				rollExpression.push($(this).attr("data-count") + $(this).attr("alt"));
			});
	
			let sendToDM = window.DM || false;
			let sentAsDDB = send_rpg_dice_to_ddb(rollExpression.join("+"), sendToDM);
			if (!sentAsDDB) {
				const roll = new rpgDiceRoller.DiceRoll(rollExpression.join("+"));
				const text = roll.output;
				const uuid = new Date().getTime();
				const data = {
					player: window.PLAYER_NAME,
					img: window.PLAYER_IMG,
					text: text,
					dmonly: sendToDM,
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
			}
	
			$(".roll-button").removeClass("show");
			$(".dice-roller > div img[data-count]").removeAttr("data-count");
			$(".dice-roller > div span").remove();
		});
	}

	if (window.chatObserver === undefined) {
		window.chatObserver = new ChatObserver();
	}
	window.chatObserver.observe($("#chat-text"));

	$(".GameLog_GameLog__2z_HZ").scroll(function() {
		if ($(this).scrollTop() >= 0) {
			$(this).removeClass("highlight-gamelog");
		}
	});

	// open, resize, then close the `Send To: (Default)` drop down. It won't resize unless it's open
	$("div.MuiPaper-root.MuiMenu-paper").click();
	setTimeout(function() {
		$("div.MuiPaper-root.MuiMenu-paper").css({
			"min-width": "200px"
		})
		$("div.MuiPaper-root.MuiMenu-paper").click();
	}, 0);
}

function init_ui() {
	console.log("init_ui");
	window.ALLOWTOKENMEASURING=true;
	// ATTIVA GAMELOG
	$(".sidebar__control").click(); // 15/03/2022 .. DDB broke the gamelog button. 
	$(".sidebar__control--lock").closest("span.sidebar__control-group.sidebar__control-group--lock > button").click(); // lock it open immediately. This is safe to call multiple times
	$(".glc-game-log").addClass("sidepanel-content");
	$(".sidebar").css("z-index", 9999);
	if (is_characters_page()) {
		reposition_player_sheet();
	}
	$(".sidebar__controls").width(340);
	// $(".ct-sidebar__control").width(340);
	$("body").css("overflow", "scroll");

	inject_chat_buttons();

	//s = $("<script src='https://meet.jit.si/external_api.js'></script>");
	//$("#site").append(s);

	s = $("<script src='https://www.youtube.com/iframe_api'></script>");
	$("#site").append(s);

	const background = $("<img id='scene_map'>");
	background.css("top", "0");
	background.css("left", "0");
	background.css("position", "absolute");
	background.css("z-index", "10");

	const mapContainer = $("<div id='scene_map_container' />");
	mapContainer.css("top", "0");
	mapContainer.css("left", "0");
	mapContainer.css("position", "absolute");
	mapContainer.css("z-index", "10");


	const drawOverlay = $("<canvas id='draw_overlay'></canvas>");
	drawOverlay.css("position", "absolute");
	drawOverlay.css("top", "0");
	drawOverlay.css("left", "0");
	drawOverlay.css("z-index", "18");

	const textOverlay = $("<canvas id='text_overlay'></canvas>");
	textOverlay.css("position", "absolute");
	textOverlay.css("top", "0");
	textOverlay.css("left", "0");
	textOverlay.css("z-index", "18");

	const grid = $("<canvas id='grid_overlay'></canvas>");
	grid.css("position", "absolute");
	grid.css("top", "0");
	grid.css("left", "0");
	grid.css("z-index", "19");


	const fog = $("<canvas id='fog_overlay'></canvas>");
	fog.css("top", "0");
	fog.css("left", "0");
	fog.css("position", "absolute");
	fog.css("z-index", "20");

	// this overlay sits above all other canvases
	// we draw to this and then bake the image into the corresponding
	// canvas, based on the drawing function
	const tempOverlay = $("<canvas id='temp_overlay'></canvas>");
	tempOverlay.css("position", "absolute");
	tempOverlay.css("top", "0");
	tempOverlay.css("left", "0");
	tempOverlay.css("z-index", "25");


	tempOverlay.dblclick(function(e) {
		e.preventDefault();

		var mousex = Math.round((e.pageX - 200) * (1.0 / window.ZOOM));
		var mousey = Math.round((e.pageY - 200) * (1.0 / window.ZOOM));

		console.log("mousex " + mousex + " mousey " + mousey);

		let borderColor = $(`.token[data-name="`+window.PLAYER_NAME+`"]`).attr(`data-border-color`)
		let pingColor = (typeof borderColor === 'undefined') ? "#000e #fffe #000e #fffe" : borderColor;

		data = {
			x: mousex,
			y: mousey,
			from: window.PLAYER_NAME,
			dm: window.DM,
			color: pingColor
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
	VTT.append(mapContainer);
	VTT.append(fog);
	VTT.append(grid);
	VTT.append(drawOverlay);
	VTT.append(textOverlay);
	VTT.append(tempOverlay);

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
	black_layer.css("z-index", "1");

	if(DM && window.CLOUD){
		setTimeout(function(){
			window.MB.sendMessage("custom/myVTT/dmjoin"); // join and ask for the scene list
		},4000);
	}

	init_controls();
	init_sheet();
	init_my_dice_details()
	if(window.DM)
	{
		init_player_sheets();
	}
	else
	{
		setTimeout(function() {
			window.MB.sendMessage("custom/myVTT/syncmeup");
			notify_player_join();
			init_player_sheet(window.PLAYER_SHEET);
			report_connection();
			//open_player_sheet(window.PLAYER_SHEET, false);
		}, 5000);
	}

	$(".sidebar__pane-content").css("background", "rgba(255,255,255,1)");


	init_buttons();
	init_zoom_buttons();
	init_combat_tracker();

	token_menu();
	load_custom_monster_image_mapping();


	window.WaypointManager=new WaypointManagerClass();

	if (window.DM) {
		setTimeout(function() {
			if(!window.CLOUD){
				window.ScenesHandler.switch_scene(window.ScenesHandler.current_scene_id, ct_load); // LOAD THE SCENE AND PASS CT_LOAD AS CALLBACK
			}
			// also sync the journal
			window.JOURNAL.sync();
		}, 5000);
	}
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
			if($(m.target).closest($(".context-menu-root")).length>0 ) // AVOID RIGHT CLICK TRAP
				return;
			//e.preventDefault();
			curDown = true;
			$("body").css("cursor", "grabbing");
			//cover iframes so you can drag through windows
			$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			//return false;
		}
	}

	// Function separated so it can be dis/enabled
	function mouseup(event) {
		curDown = false;
		$("body").css("cursor", "");
		//remove iframe cover that prevents mouse interaction
		$('.iframeResizeCover').remove();
		if (event.target.tagName.toLowerCase() !== 'a') {
			$("#splash").remove(); // don't remove the splash screen if clicking an anchor tag otherwise the browser won't follow the link
		}
		if (sidebar_modal_is_open() && event.which === 1) {
			// check if the click was within the modal or within an element that we specifically don't want to close the modal
			let modal = event.target.closest(".sidebar-modal");
			let preventSidebarModalClose = event.target.closest(".prevent-sidebar-modal-close");
			if (!modal && !preventSidebarModalClose) {
				close_sidebar_modal();
			}
		}
		let sidebarMonsterStatBlock = $("#monster-details-page-iframe");
		if (sidebarMonsterStatBlock.length > 0 && !event.target.closest("#monster-details-page-iframe")) {
			sidebarMonsterStatBlock.remove();
		}
		let sidebarMonsterFilter = $("#monster-filter-iframe");
		if (sidebarMonsterFilter.length > 0 && !event.target.closest("#monster-filter-iframe")) {
			close_monster_filter_iframe();
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

	$("#temp_overlay").bind("contextmenu", function (e) {
		return false;
	});

	init_mouse_zoom()

	init_help_menu();

	$("ol.tss-jmihpx-GameLogEntries").on("DOMNodeInserted", function(addedEvent) {
		let injectedElement = $(addedEvent.target);
		if (injectedElement.hasClass("tss-1wcf5kt-Line-Notation") || injectedElement.hasClass("tss-16k6xf2-Line-Breakdown")) {
			let gamelogItem = injectedElement.closest("li");
			replace_gamelog_message_expressions(gamelogItem);
		}
	});

	if (window.DM) {
		// LOAD DDB CHARACTER TOOLS FROM THE PAGE ITSELF. Avoid loading external scripts as requested by firefox review
		let old=$("[src*=mega-menu]:nth-of-type(2)");
		let s=old.attr("src");
		let el=$("<"+old.prop('nodeName')+">");
		el.attr("src",s.replace(/mega.*bundle/,'character-tools/vendors~characterTools.bundle.dec3c041829e401e5940.min'));
		$("#site").append(el);
		setTimeout(function(){
			console.log(2);
			retriveRules();
			loadModules(initalModules);
		},10000);
		setTimeout(get_pclist_player_data,25000);
	}

}

const DRAW_COLORS = ["#D32F2F", "#FB8C00", "#FFEB3B", "#9CCC65", "#039BE5", 
					"#F48FB1", "#FFCC80", "#FFF59D", "#A5D6A7", "#81D4FA", 
					"#3949AB", "#8E24AA", "#212121", "#757575", "#E0E0E0", 
					"#7986CB", "#CE93D8", "#616161", "#BDBDBD", "#FFFFFF", "cPick"];

function init_buttons() {
	if ($("#fog_menu").length > 0) {
		return; // only need to do this once
	}
	buttons = $(`<div class="ddbc-tab-options--layout-pill"></div>`);
	$("body").append(buttons);

	buttons.append($("<button style='display:inline; width:75px;' id='select-button' class='drawbutton hideable ddbc-tab-options__header-heading' data-shape='rect' data-function='select'><u>S</u>ELECT</button>"));
	
	buttons.append($("<button style='display:inline;width:75px;' id='measure-button' class='drawbutton hideable ddbc-tab-options__header-heading' data-shape='line' data-function='measure'><u>R</u>ULER</button>"));
	
	if (window.DM) {
		init_fog_menu(buttons)
		init_draw_menu(buttons)
		init_text_button(buttons)

	}

	setup_aoe_button();
	handle_drawing_button_click();

	buttons.append("<button style='display:inline;width:75px' id='help_button' class='hideable ddbc-tab-options__header-heading'>HELP</button>");

	buttons.css("position", "fixed");
	buttons.css("top", '5px');
	buttons.css("left", '5px');
	buttons.css("z-index", '57000');

	// HIDE default SEND TO functiontality in the campaign page:

	$(".GameLogHeader_Container__36cXS").hide();

	// STREAMING STUFF

	window.STREAMPEERS={};
	window.MYSTREAMID=uuid();
	window.JOINTHEDICESTREAM=false;

	init_keypress_handler();

}

function init_zoom_buttons() {
	
	if ($("#zoom_buttons").length > 0) {
		return;
	}

	// ZOOM BUTTON
	zoom_section = $("<div id='zoom_buttons' />");

	zoom_center = $("<div id='zoom_fit' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='fit screen (0)'><div class='ddbc-tab-options__header-heading'><span class='material-icons button-icon'>fit_screen</span></div></div>");
	zoom_center.click(reset_zoom);
	zoom_section.append(zoom_center);

	zoom_minus = $("<div id='zoom_minus' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon hideable' data-name='zoom out (-)'><span class='material-icons button-icon'>zoom_out</span></div></div>");
	
	zoom_minus.click(decrease_zoom)
	zoom_section.append(zoom_minus);

	zoom_plus = $("<div id='zoom_plus' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon hideable' data-name='zoom in (+)'><span class='material-icons button-icon'>zoom_in</span></div></div>");
	zoom_plus.click(increase_zoom);
	zoom_section.append(zoom_plus);

	hide_interface = $(`<div id='hide_interface_button' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon' data-name='Unhide interface (shift+h)'><span class='material-icons md-16 button-icon'>visibility</span></div></div>`);
	hide_interface.click(unhide_interface);
	hide_interface.css("display", "none");
	hide_interface.css("position", "absolute");
	hide_interface.css("opacity", "50%");
	hide_interface.css("right", "-136px");
	zoom_section.append(hide_interface);

	$(".avtt-sidebar-controls").append(zoom_section);
	if (window.DM) {
		zoom_section.css("left","-122px");
	} else {
		zoom_section.css("left","-170px");
	}
}

/// The first time the screen loads, we cover it with an overlay to mask all the UI changes we do. This builds and injects a nice loading indicator to inform the user that everything is fine. See `Load.js` for the injection of the overlay.
function init_loading_overlay_beholder() {
	let loadingText = "One Moment While We Set The Scene...";
	if (is_characters_page()) {
		loadingText = "We'll Set The Scene When The DM Is Ready.";
	}
	let loadingIndicator = $(`
		<div>
			<div class="sidebar-panel-loading-indicator" style="padding:0px;border-radius:40px;">
				<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;margin-top:100px;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
				<div class="loading-status-indicator__subtext">${loadingText}</div>
			</div>
		</div>
	`);
	loadingIndicator.css({
		"position": "fixed",
		"width": "400px",
		"height": "400px",
		"margin": "auto",
		"top": "0px",
		"bottom": "0px",
		"left": "0px",
		"right": "0px"
	});
	$("#loading_overlay").append(loadingIndicator);
	// For safety reasons.. if something don't work.. it's better to just remove this overlay to make it easier to fix stuff
	setTimeout(remove_loading_overlay,15000);

}

/// the first time the window loads, start doing all the things
$(function() {

	// we injected an overlay in `Load.js` this makes it look nice by setting a background image, etc.
	let loadingBg = $(`<div></div>`);
	loadingBg.css({
		"background-position": "center",
		"background-size": "cover",
		"filter": "blur(4px)",
		"width": "100%",
		"height": "100%",
		"background-color": "#26282a",
		"opacity": "0.5",
	});
	$("#loading_overlay").append(loadingBg);
	if (is_encounters_page()) {
		// DMG cover art
		loadingBg.css({
			"background-image": "url(https://media-waterdeep.cursecdn.com/attachments/0/267/dmg1k.jpg)"
		});
	} else if (is_characters_page()) {
		// PHB cover art
		loadingBg.css({
			"background-image": "url(https://media-waterdeep.cursecdn.com/attachments/0/264/phb1k.jpg)"
		});
	}

	window.EXTENSION_PATH = $("#extensionpath").attr('data-path');
	var is_dm=false;
	if($(".ddb-campaigns-detail-body-dm-notes-private").length>0){
		is_dm=true;
	} else if (is_encounters_page()) {
		is_dm=true;
	}

	// SCB: Add a dummy DIV to force the AboutVTT DIV below the standard DDB buttons
	$(".ddb-campaigns-detail-header-secondary-sharing").append($("<div style='clear:both'>"))

	// SCB:Create a 'content DIV' for AboveVTT to add our controls to, so we can control styling better
	var contentDiv = $("<div class='above-vtt-content-div'>").appendTo($(".ddb-campaigns-detail-header-secondary-sharing"));

	var warningDiv = $("<div class='above-vtt-warning-div' style='padding-top: 20px;'>").appendTo($(".ddb-campaigns-invite-container"));
	var warningtitleDiv = $("<div class='above-vtt-warning-secondary-div'>").appendTo($(".above-vtt-warning-div"));

	// SCB: Append our logo
	contentDiv.append($("<img class='above-vtt-logo above-vtt-right-margin-5px' width='120px' src='" + window.EXTENSION_PATH + "assets/logo.png'>"));

	if(is_dm){
		contentDiv.append($("<a class='above-vtt-campaignscreen-blue-button above-vtt-right-margin-5px button joindm btn modal-link ddb-campaigns-detail-body-listing-campaign-link' style='position:relative'>JOIN AS DM</a>"));
		warningDiv.append($("<a class='ddb-campaigns-warning-div' style='color: #333; padding-left: 15%'>If you press 'RESET INVITE LINK' you will lose your cloud data!</a>"));
		warningtitleDiv.append($("<a class='above-vtt-warning-secondary-div' style='color: #c53131; font-weight: 900; font-size: 16px; font-family: roboto; background-color: #fff; border: 2px solid #c53131; border-radius: 4px; padding: 10px 145px 30px 145px;'>WARNING FOR ABOVEVTT!!!</a>"));
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
			gather_pcs();
			let cs=$(".ddb-campaigns-invite-primary").text().split("/").pop();
			window.open(`https://www.dndbeyond.com${sheet}?cs=${cs}&cid=${get_campaign_id()}&abovevtt=true`, '_blank');
		});

		$(this).prepend(newlink);

		console.log('Sheet: ' + sheet + "img " + img);
	});

	delete_button = $("<a class='above-vtt-campaignscreen-black-button button btn modal-link ddb-campaigns-detail-body-listing-campaign-link' id='above-delete'>Delete AboveVTT Data for this campaign</a>");
	delete_button.click(function() {
		if (confirm("Are you sure?")) {
			let gameId = find_game_id();
			localStorage.removeItem("ScenesHandler" + gameId);
			localStorage.removeItem("current_source" + gameId);
			localStorage.removeItem("current_chapter" + gameId);
			localStorage.removeItem("current_scene" + gameId);
			localStorage.removeItem("CombatTracker"+gameId);
			localStorage.removeItem("Journal"+gameId);
			localStorage.removeItem("JournalChapters"+gameId);
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
	campaign_banner.append("<b>Deprecation</b> Due to technical changes. You no longer can join as DM if you're not the real DM of the campaign. If you need help recovering your local data for this campaign contact us on discord<br><br>");
	campaign_banner.append("Use this button to delete all locally held data, to 'clear the cache' as it were: <br>");
	campaign_banner.append(delete_button);
	campaign_banner.append(delete_button2);
	campaign_banner.hide();

	delete_button.css({ "width": "400px" });
	delete_button2.css({ "width": "400px", "margin-top": "6px", "margin-bottom": "10px" });

	contentDiv.append($("<a class='above-vtt-campaignscreen-white-button above-vtt-right-margin-5px instructions btn modal-link ddb-campaigns-detail-body-listing-campaign-link'>Instructions</a>"));

	window.EXPERIMENTAL_SETTINGS = $.parseJSON(localStorage.getItem('ExperimentalSettings' + find_game_id())) || {};
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
		$(".joindm").addClass("button-loading");
		gather_pcs();
		window.EncounterHandler = new EncounterHandler(function(didSucceed, errorType) {
			if (didSucceed === false) {
				if (errorType === "EncounterLimitException") {
					alert("Failed to create a backing Encounter! AboveVTT requires 1 available Encounter, but it looks like you already have more than your subscription level allows. Try deleting some encounters (or renaming one of them to \"AboveVTT\") and try again");
				} else {
					alert("An unexpected error occurred! Please check the developer console for errors, and report this via the AboveVTT Discord.");
				}
				$(".joindm").removeClass("button-loading");
				return;
			}
			if (window.EncounterHandler.avttId !== undefined && window.EncounterHandler.avttId.length > 0) {
				let cs=$(".ddb-campaigns-invite-primary").text().split("/").pop();
				window.open(`https://www.dndbeyond.com/encounters/${window.EncounterHandler.avttId}?cs=${cs}&cid=${get_campaign_id()}&abovevtt=true`, '_blank');
			} else {
				// DDB doesn't support dice on their encounters page for non-subscribers so load the non-DDB dice version
				window.DM = true;
				window.PLAYER_SHEET = false;
				window.PLAYER_NAME = "THE DM";
				window.PLAYER_ID = false;
				window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
				init_above();
			}

			let oldText = $(".joindm").text();
			$(".joindm").removeClass("button-loading");
			$(".joindm").text("Check for blocked pop ups!");
			setTimeout(function () {
				$(".joindm").text(oldText);
			}, 2000);
		});
	});
	
	
	if (window.location.search.includes("abovevtt=true")) {
		gather_pcs();
		if (is_encounters_page()) {
			const urlParams = new URLSearchParams(window.location.search);
			window.gameId = urlParams.get('cid');
			window.CAMPAIGN_SECRET = urlParams.get('cs');
			window.DM = true;
			window.PLAYER_SHEET = false;
			window.PLAYER_NAME = "THE DM";
			window.PLAYER_ID = false;
			window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
			init_above();
		} else if (is_characters_page()) {
			let path = window.location.href;
			let pathWithoutQuery = path.split("?")[0];
			let lastComponent = pathWithoutQuery.substring(pathWithoutQuery.lastIndexOf('/') + 1);
			const urlParams = new URLSearchParams(window.location.search);
			window.gameId = urlParams.get('cid');
			window.CAMPAIGN_SECRET = urlParams.get('cs');
			window.DM = false;
			window.PLAYER_SHEET = window.location.pathname;
			window.PLAYER_ID = lastComponent;
			// these will be updated after the initial load
			window.PLAYER_NAME = "";
			window.PLAYER_IMG = "https://www.dndbeyond.com/content/1-0-1436-0/skins/waterdeep/images/characters/default-avatar.png";
			init_above();
		} else {
			window.DM = true;
			window.PLAYER_SHEET = false;
			window.PLAYER_NAME = "THE DM";
			window.PLAYER_ID = false;
			window.PLAYER_IMG = 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png';
			init_above();
		}
	}

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
							<dt>A</dt>
							<dd>Area of effect menu</dd>
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

function init_my_dice_details(){
	get_cobalt_token(function (token) {
		window.ajaxQueue.addRequest({
			type: 'GET',
			url: "https://dice-service.dndbeyond.com/diceuserconfig/v1/get",
			contentType: "application/json; charset=utf-8",
			dataType: 'json', // added data type
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + token);
			},
			xhrFields: {
				withCredentials: true
			},
			success: function(res) {
				window.mydice = res
			}
    	});
	});
}
/**
 * Attempts to convert the output of an rpgDiceRoller DiceRoll to the DDB format.
 * If the conversion is successful, it will be sent over the websocket, and this will return true.
 * If the conversion fails for any reason, nothing will be sent, and this will return false,
 * @param {String} expression the dice rolling expression; ex: 1d20+4
 * @param {Boolean} toSelf    whether this is sent to self or everyone
 * @returns {Boolean}         true if we were able to convert and send; else false
 */
// send_rpg_dice_to_ddb(expression, displayName, imgUrl, modifier, damageType, dmOnly)
function send_rpg_dice_to_ddb(expression, displayName, imgUrl, rollType="roll", damageType, actionType="custom", sendTo="everyone") {

	let diceRoll = new DiceRoll(expression);
	diceRoll.action = actionType;
	diceRoll.rollType = rollType;
	diceRoll.name = displayName;
	diceRoll.avatarUrl = imgUrl;
	// diceRoll.entityId = monster.id;
	// diceRoll.entityType = monsterData.id;

	if (window.diceRoller.roll(diceRoll)) {
		console.log("send_rpg_dice_to_ddb rolled via diceRoller");
		return true;
	}

	console.group("send_rpg_dice_to_ddb")
	console.log("with values", expression, displayName, imgUrl, rollType, damageType, actionType, sendTo)


	try {
		expression = expression.replace(/\s+/g, ''); // remove all whitespace

		const supportedDieTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

		let roll = new rpgDiceRoller.DiceRoll(expression);

		// rpgDiceRoller doesn't give us the notation of each roll so we're going to do our best to find and match them as we go
		var choppedExpression = expression;
		let notationList = [];
		for (let i = 0; i < roll.rolls.length; i++) {
			let currentRoll = roll.rolls[i];
			if (typeof currentRoll === "string") {
				let idx = choppedExpression.indexOf(currentRoll);
				let previousNotation = choppedExpression.slice(0, idx);
				notationList.push(previousNotation);
				notationList.push(currentRoll);
				choppedExpression = choppedExpression.slice(idx + currentRoll.length);
			}
		}
		console.log("chopped expression", choppedExpression)
		notationList.push(choppedExpression); // our last notation will still be here so add it to the list

		if (roll.rolls.length != notationList.length) {
			console.warn(`Failed to convert expression to DDB roll; expression ${expression}`);
			console.groupEnd()
			return false;
		}

		let convertedDice = [];       // a list of objects in the format that DDB expects
		let allValues = [];           // all the rolled values
		let convertedExpression = []; // a list of strings that we'll concat for a string representation of the final math being done
		let constantsTotal = 0;       // all the constants added together
		for (let i = 0; i < roll.rolls.length; i++) {
			let currentRoll = roll.rolls[i];
			if (typeof currentRoll === "object") {
				let currentNotation = notationList[i];
				let currentDieType = supportedDieTypes.find(dt => currentNotation.includes(dt)); // we do it this way instead of splitting the string so we can easily clean up things like d20kh1, etc. It's less clever, but it avoids any parsing errors
				if (!supportedDieTypes.includes(currentDieType)) {
					console.warn(`found an unsupported dieType ${currentNotation}`);
					console.groupEnd()
					return false;
				}
				if (currentNotation.includes("kh") || currentNotation.includes("kl")) {
					let cleanerString = currentRoll.toString()
						.replace("[", "(")    // swap square brackets with parenthesis
						.replace("]", ")")    // swap square brackets with parenthesis
						.replace("d", "")     // remove all drop notations
						.replace(/\s+/g, ''); // remove all whitespace
					convertedExpression.push(cleanerString);
				} else {
					convertedExpression.push(currentRoll.value);
				}
				let dice = currentRoll.rolls.map(d => {
					allValues.push(d.value);
					console.groupEnd()
					return { dieType: currentDieType, dieValue: d.value };
				});

				convertedDice.push({
					"dice": dice,
					"count": dice.length,
					"dieType": currentDieType,
					"operation": 0
				})
			} else if (typeof currentRoll === "string") {
				convertedExpression.push(currentRoll);
			} else if (typeof currentRoll === "number") {
				convertedExpression.push(currentRoll);
				if (i > 0) {
					if (convertedExpression[i-1] == "-") {
						constantsTotal -= currentRoll;
					} else if (convertedExpression[i-1] == "+") {
						constantsTotal += currentRoll;
					} else {
						console.warn(`found an unexpected symbol ${convertedExpression[i-1]}`);
						console.groupEnd()
						return false;
					}
				} else {
					constantsTotal += currentRoll;
				}
			}
		}
		let ddbJson = {
			id: uuid(),
			dateTime: `${Date.now()}`,
			gameId: window.MB.gameid,
			userId: window.MB.userid,
			source: "web",
			persist: true,
			messageScope: sendTo === "everyone" ?  "gameId" : "userId",
			messageTarget: sendTo === "everyone" ?  window.MB.gameid : window.MB.userid,
			entityId: window.MB.userid,
			entityType: "user",
			eventType: "dice/roll/fulfilled",
			data: {
				action: actionType,
				setId: window.mydice.data.setId,
				context: {
					entityId: window.MB.userid,
					entityType: "user",
					messageScope: sendTo === "everyone" ?  "gameId" : "userId",
					messageTarget: sendTo === "everyone" ?  window.MB.gameid : window.MB.userid,
					name: displayName,
					avatarUrl: imgUrl
				},
				rollId: uuid(),
				rolls: [
					{
						diceNotation: {
							set: convertedDice,
							constant: constantsTotal
						},
						diceNotationStr: expression,
						rollType: rollType,
						rollKind: expression.includes("kh") ? "advantage" : expression.includes("kl") ? "disadvantage" : "",
						result: {
							constant: constantsTotal,
							values: allValues,
							total: roll.total,
							text: convertedExpression.join("")
						}
					}
				]
			}
		};
		if (window.MB.ws.readyState == window.MB.ws.OPEN) {
			window.MB.ws.send(JSON.stringify(ddbJson));
			console.groupEnd()
			return true;
		} else { // TRY TO RECOVER
			get_cobalt_token(function(token) {
				window.MB.loadWS(token, function() {
					// TODO, CONSIDER ADDING A SYNCMEUP / SCENE PAIR HERE
					window.MB.ws.send(JSON.stringify(ddbJson));
				});
			});
			console.groupEnd()
			return true; // we can't guarantee that this actually worked, unfortunately
		}
	} catch (error) {
		console.warn(`failed to send expression as DDB roll; expression = ${expression}`, error);
		console.groupEnd()
		return false;
	}
}
	
// returns { name: 'Chrome', version: '96' }
function get_browser() {
	var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
	if(/trident/i.test(M[1])){
			tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
			return {name:'IE',version:(tem[1]||'')};
			}   
	if(M[1]==='Chrome'){
			tem=ua.match(/\bOPR|Edge\/(\d+)/)
			if(tem!=null)   {return {name:'Opera', version:tem[1]};}
			}   
	M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
	return {
		name: M[0],
		version: M[1],
		mozilla: M[0] == "Firefox",
		chrome: M[0] == "Chrome",
		msie: M[0] == "Internet Explorer",
		opera: M[0] == "Opera",
	};
}

/// When playing on the characters page, this will show/hide the character sheet. When not on the character page, `open_player_sheet` and `close_player_sheet` are used.
function toggle_player_sheet() {
	if (is_player_sheet_open()) {
		hide_player_sheet();
	} else {
		show_player_sheet()
	}
}

/// When playing on the characters page, this will tell you if the character sheet is open. When not on the character page, `open_player_sheet` and `close_player_sheet` are used.
function is_player_sheet_open() {
	return $(".ct-character-sheet__inner").css("z-index") > 0;
}

/// When playing on the characters page, this will show the character sheet. When not on the character page, `open_player_sheet` is used.
function show_player_sheet() {
	$("#character-tools-target").css({
		"visibility": "visible",
	});
	$(".ct-character-sheet__inner").css({
		"visibility": "visible",
		"z-index": 3
	});
	$(".site-bar").css({
		"visibility": "visible",
		"z-index": 3
	});
	if (window.innerWidth > 1540) { // DDB resize point + sidebar width 
		// the reactive nature of the character sheet starts messing with our thin layout so don't allow the thin layout on smaller screens. Let DDB do their condensed/tablet/mobile view instead
		$("#sheet_resize_button").show();
	} else {
		$("#sheet_resize_button").hide();
	}
	$('#sheet_button').find(".ddbc-tab-options__header-heading").addClass("ddbc-tab-options__header-heading--is-active");
	if (window.innerWidth < 1024) {
		hide_sidebar();
	}
}

/// When playing on the characters page, this will hide the character sheet. When not on the characters page, `close_player_sheet` is used.
function hide_player_sheet() {
	$("#character-tools-target").css({
		"visibility": "hidden",
	});
	$(".ct-character-sheet__inner").css({
		"visibility": "hidden",
		"z-index": -1
	});
	if ($(".site-bar #lock_display").length == 0) {
		// don't hide it if the DM is watching
		$(".site-bar").css({
			"visibility": "hidden",
			"z-index": -1
		});
	}
	$("#sheet_resize_button").hide();
	$('#sheet_button').find(".ddbc-tab-options__header-heading").removeClass("ddbc-tab-options__header-heading--is-active");
}

/// When playing on the characters page, this will toggle the width of the character sheet. When not on the characters page, `init_sheet` injects a button to handle the iframe resizing
function toggle_player_sheet_size() {
	if (is_player_sheet_full_width()) {
		player_sheet_layout = "thin";
	} else {
		player_sheet_layout = "full";
	}
	reposition_player_sheet();
}

function reposition_player_sheet() {
	// if the window size changes, or if they open jitsi, or anything like that, we want to update the character sheet css without toggling the size
	// this is explicitly the opposite behavior as toggle_player_sheet_size()

	let sidebarWidth = is_sidebar_visible() ? 340 : 0;
	let playableSpace = window.innerWidth - sidebarWidth;
	let forceLayout = "none";

	// 1200 is a DDB cutoff, they resize everything when the window crosses this threshold
	// 1024 is a DDB cutoff, they re-layout everything like it's a tablet
	// 768 is a DDB cutoff, they re-layout everything like it's a phone

	if (playableSpace >= 1200) {
		$(".ct-character-sheet__inner").css({ "width": `1200px`, "left": "auto", "right": `${sidebarWidth}px` });
	} else if (window.innerWidth >= 1024 && playableSpace < 1200) {
		forceLayout = "thin";
		$(".ct-character-sheet__inner").css({ "left": "auto", "right": `${sidebarWidth}px` });
	} else {
		forceLayout = "full";
		$(".ct-character-sheet__inner").css({ "width": `100%`, "left": "0px", "right": `0px` });
		$(".ct-character-sheet-mobile__header").css({ "width": `100%`, "left": "0px", "right": `0px` });
		$(".ct-character-sheet-mobile").css({ "background": "white" });
	}
	
	if (forceLayout == "full") {
		resize_player_sheet_full_width();
	} else if (forceLayout == "thin") {
		resize_player_sheet_thin();
	} else if (is_player_sheet_full_width()) {
		resize_player_sheet_full_width();
	} else {
		resize_player_sheet_thin();
	}
}

let player_sheet_layout = "full"; // or thin
/// When playing on the characters page, this will tell you if the character sheet is full width or thin. When not on the characters page, `init_sheet` injects a button to handle the iframe resizing
function is_player_sheet_full_width() {
	return player_sheet_layout == "full";
}

/// When playing on the characters page, this will resize the character sheet to full width. When not on the characters page, `init_sheet` injects a button to handle the iframe resizing
function resize_player_sheet_full_width() {
	reset_character_sheet_css();
	player_sheet_layout = "full";
	adjust_site_bar();
}

/// When playing on the characters page, this will resize the character sheet to a thinner version. It rearranges a lot of the HTML to handle the thinner width. When not on the characters page, `init_sheet` injects a button to handle the iframe resizing
function resize_player_sheet_thin() {
	reset_character_sheet_css();
	if (window.innerWidth < 1024) {
		console.log("resize_player_sheet_thin calling is setting full, and calling reposition_player_sheet");
		player_sheet_layout = "full";
		reposition_player_sheet();
		return;
	}

	let sheetWidth = "570px";
	let subsectionWidth = "50%";
	let inspirationLeft = "-184px";
	let proficiencyLeft = "-480px";
	let speedLeft = "-468px";
	let healthLeft = "-510px";
	let abilitiesLeft = "0px";
	let quickInfoTop = "105px";
	let subsectionsTop = "200px";
	let subsectionLeft = "auto";
	let skillsRight = "0px";
	let restTop = "20px";
	if (window.innerWidth < 1200) {
		sheetWidth = "520px";
		subsectionWidth = "45%";
		inspirationLeft = "-124px";
		proficiencyLeft = "-380px";
		speedLeft = "-354px";
		healthLeft = "-400px";
		abilitiesLeft = "15px";
		quickInfoTop = "82px";
		subsectionsTop = "172px";
		subsectionLeft = "2%";
		skillsRight = "2%";
		restTop = "8px";
	}

	$(".ct-character-sheet__inner").css({ "width": sheetWidth, "overflow-y": "auto", "overflow-x": "hidden" });
	$(".ct-subsections").css({ "display": "flex", "flex-direction": "column", "width": sheetWidth, "top": subsectionsTop });
	$(".ct-subsection").css({ "display": "flex", "top": "auto", "left": subsectionLeft, "width": subsectionWidth, "margin-bottom": "14px", "position": "relative" });
	$(".ct-subsection--skills").css({ "position": "absolute", "right": skillsRight, "left": "auto" });
	$(".ct-subsection--combat").css({ "position": "absolute", "top": "-100px", "width": "100%", "left": "0px", "right": "0px" });
	$(".ct-subsection--primary-box").css({ "width": "100%", "left": "0px", "right": "0px" });

	$(".ct-quick-info__abilities").css({ "position": "relative", "top": "0px", "left": abilitiesLeft });
	$(".ct-quick-info__inspiration").css({ "position": "relative", "top": "8px", "left": inspirationLeft });
	$(".ct-quick-info__box--proficiency").css({ "position": "relative", "top": quickInfoTop, "left": proficiencyLeft });
	$(".ct-quick-info__box--speed").css({ "position": "relative", "top": quickInfoTop, "left": speedLeft });
	$(".ct-quick-info__health").css({ "position": "relative", "top": quickInfoTop, "left": healthLeft });

	$(".ct-character-header-desktop__group--share").css({"visibility": "hidden", "width": "0px", "height": "0px"});
	$(".ct-character-header-desktop__group--builder").css({"visibility": "hidden", "width": "0px", "height": "0px"});
	
	$(".ct-character-header-desktop__group--short-rest").css({ "position": "absolute", "left": "auto", "top": restTop, "right": "110px" });
	$(".ct-character-header-desktop__group--long-rest").css({ "position": "absolute", "left": "auto", "top": restTop, "right": "0px" });
	$(".ct-character-header-desktop__group--short-rest .ct-character-header-desktop__button").css({ "padding": "2px 10px", "margin": "0px" });
	$(".ct-character-header-desktop__group--long-rest .ct-character-header-desktop__button").css({ "padding": "2px 10px", "margin": "0px" });
	$(".ct-character-header-desktop__group-tidbits").css({ "width": "60%" });
	
	$(".ct-character-header-desktop__group--campaign").css({ "position": "relative", "top": "15px", "left": "auto", "right": "-10px", "margin-right": "0px" });

	$(".ct-primary-box").css({ "height": "610px" });
	$(".ddbc-tab-options__content").css({ "height": "510px" });
	// these need a little more space due to the filter search bar
	$(".ct-extras").css({ "height": "540px" });
	$(".ct-equipment").css({ "height": "540px" });
	$(".ct-spells").css({ "height": "540px" });

	player_sheet_layout = "thin";
	
	adjust_site_bar();

}

/// When playing on the characters page, this will clear any adjustments made by either resize functions, leaving the HTML at a clean slate so we can cleanly adjust to either full width or thin
function reset_character_sheet_css() {
	$(".ct-sidebar__mask--visible").css({"visibility": "hidden", "width": "0px", "height": "0px"});
	$(".ct-subsections").removeAttr( 'style' );
	$(".ct-subsection").removeAttr( 'style' );
	$(".ct-subsection--skills").removeAttr( 'style' );
	$(".ct-subsection--combat").removeAttr( 'style' );
	$(".ct-subsection--primary-box").removeAttr( 'style' );

	$(".ct-quick-info__box--proficiency").removeAttr( 'style' );
	$(".ct-quick-info__box--speed").removeAttr( 'style' );
	$(".ct-quick-info__inspiration").removeAttr( 'style' );
	$(".ct-quick-info__health").removeAttr( 'style' );

	$(".ct-character-header-desktop__group--short-rest").removeAttr( 'style' );
	$(".ct-character-header-desktop__group--long-rest").removeAttr( 'style' );
	$(".ct-character-header-desktop__group--short-rest .ct-character-header-desktop__button").removeAttr( 'style' );
	$(".ct-character-header-desktop__group--long-rest .ct-character-header-desktop__button").removeAttr( 'style' );
	$(".ct-character-header-desktop__group-tidbits").removeAttr( 'style' );
	
	$(".ct-character-header-desktop__group--campaign").removeAttr( 'style' );
	$(".ct-primary-box").removeAttr( 'style' );
	$(".ddbc-tab-options__content").removeAttr( 'style' );

	$(".ct-character-sheet__inner").css({"visibility": "visible", "overflow-x": "hidden"});
	
	$(".ddbc-character-tidbits__menu-callout").css({"visibility": "hidden", "width": "0px", "height": "0px"});

	let maxHeight = window.innerHeight - 26;
	if ($("#jitsi_container").length > 0) {
		maxHeight -= $("#jitsi_container").height();
	}
	$(".ct-character-sheet__inner").css({
		"position": "fixed",
		"top": "30px",
		"background-image": $("body").css("background-image"),
		"background-position": "initial",
		"max-height": maxHeight,
		"overflow-y": "auto"
	});
	$(".ct-character-sheet-desktop").css({
		"height": maxHeight,
	});
	let scrollBarWidth = $.position.scrollbarWidth();
	console.debug("scrollBarWidth", scrollBarWidth);
	$(".ct-sidebar").css({ "height": `calc(100vh - ${scrollBarWidth - 2}px)` });
	$(".ct-character-header-tablet").css({ "background": "rgba(0, 0, 0, 0.85)" });
}

function is_sidebar_visible() {
	return $("#hide_rightpanel").attr('data-visible') == 1;
}

/// this will show/hide the sidebar regardless of which page we are playing on
function toggle_sidebar_visibility() {
		if (is_sidebar_visible()) {
			hide_sidebar();
		} else {
			show_sidebar();
		}
}

/// this will show the sidebar regardless of which page we are playing on. It will also adjust the position of the character sheet 
function show_sidebar() {

	let toggleButton = $("#hide_rightpanel");
	toggleButton.addClass("point-right").removeClass("point-left");
	toggleButton.attr('data-visible', 1);

	if (is_characters_page() && window.innerWidth < 1024 && $(".ct-quick-nav__edge-toggle").length > 0) {
		$(".ct-quick-nav__edge-toggle--not-visible").click();
	} else {
		let sidebar = is_characters_page() ? $(".ct-sidebar--right") : $(".sidebar--right");
		sidebar.css("transform", "translateX(0px)");
	}

	if (is_characters_page()) {
		reposition_player_sheet();
	} else {
		$("#sheet").removeClass("sidebar_hidden");
	}
}

/// this will hide the sidebar regardless of which page we are playing on. It will also adjust the position of the character sheet 
function hide_sidebar() {
	let toggleButton = $("#hide_rightpanel");
	toggleButton.addClass("point-left").removeClass("point-right");
	toggleButton.attr('data-visible', 0);

	if (is_characters_page() && window.innerWidth < 1024 && $(".ct-quick-nav__edge-toggle").length > 0) {
		$(".ct-quick-nav__edge-toggle--visible").click();
	} else {
		let sidebar = is_characters_page() ? $(".ct-sidebar--right") : $(".sidebar--right");
		sidebar.css("transform", "translateX(340px)");
	}
	
	if (is_characters_page()) {
		reposition_player_sheet();
	} else {
		$("#sheet").addClass("sidebar_hidden");
	}
}

function adjust_site_bar() {
	if (!is_characters_page()) {
		return;
	}

	let fullWidth = "100%";
	if (!is_player_sheet_full_width()) {
		let sheetWidth = window.innerWidth < 1200 ? 520 : 570;
		let sidebarWidth = is_sidebar_visible() ? 340 : 0;
		fullWidth = `${sheetWidth + sidebarWidth}px`;
	}

	$(".site-bar").children().hide();
	let lockDisplay = $(".site-bar #lock_display"); // is the DM looking at this sheet?
	if (lockDisplay.length > 0) {
		$(".site-bar #lock_display").show();
		fullWidth = "100%"; // when the DM is viewing, cover the entire thing
	}

	console.log(`adjust_site_bar setting width to ${fullWidth}`);
	$(".site-bar").css({
		"position": "fixed",
		"height": "30px",
		"left": "auto",
		"right": "0px",
		"width": fullWidth
	});
	
	if (is_player_sheet_open() || lockDisplay.length > 0) {
		$(".site-bar").css({ 
			"visibility": "visible",
			"z-index": 1
		});
	} else {
		$(".site-bar").css({ 
			"visibility": "hidden",
			"z-index": -1
		});
	}
}
