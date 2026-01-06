/**
 * Before the page refreshes perform the innards
 * @param {Event} event
 */
window.onbeforeunload = function(event)
{
	if (is_abovevtt_page()) {
		tabCommunicationChannel.postMessage({
      		msgType: 'removeObserver'
    	})
		console.log("refreshing page, storing zoom first");
		add_zoom_to_storage();
		window.PeerManager.send(PeerEvent.goodbye());

	}
};



/** Parses the given URL for GoogleDrive or Dropbox semantics and returns an updated URL.
 * @param {String} url to parse
 * @return {String} a sanitized and possibly modified url to help with loading maps */
function parse_img(url) {
		let retval = url;
		if (typeof retval !== "string") {
			console.log("parse_img is converting", url, "to an empty string");
			retval = "";
		} else if (retval.trim().startsWith("data:")) {
			console.warn("parse_img is removing a data url because those are not allowed"); 
			retval = "";
		} else if (retval.includes("https://drive.google.com") && !retval.match(/id=([a-zA-Z0-9_-]+)/g)) {
			const parsed = 'https://drive.google.com/thumbnail?id=' + retval.split('/')[5] +'&sz=w3000';
			retval = parsed;
			return retval;		
		} 
		else if (retval.startsWith("https://drive.google.com") || (retval.includes("https://drive.usercontent.google.com")) && retval.match(/id=([a-zA-Z0-9_-]+)/g)) {
			const parsed = 'https://drive.google.com/thumbnail?id=' + retval.matchAll(/id=([a-zA-Z0-9_-]+)/g).next().value[1] +'&sz=w3000';
			retval = parsed;
			return retval;		
		} 
		else if(retval.startsWith("https://www.googleapis.com/drive/v3/files/")){ // fix due to 1.5/1.6 beta 
			const fileid = retval.split('files/')[1].split('?')[0];
			const parsed = 'https://drive.google.com/thumbnail?id=' + fileid +'&sz=w3000';
			retval = parsed;
			return retval;
		}
		else if(retval.includes("dropbox.com")){
			const splitUrl = url.split('dropbox.com');
			const parsed = `https://dl.dropboxusercontent.com${splitUrl[splitUrl.length-1]}`
			retval = parsed;
		}
		else if(retval.includes("https://1drv.ms/"))
		{
			if(retval.split('/')[4].length == 1){
				retval = retval;
			}
			else{
				retval = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
			}
		}
		if(retval.includes("discordapp.com")){
			retval = update_old_discord_link(retval)
		}
		return retval;	
}

function update_old_discord_link(link){
  if(link == 'https://cdn.discordapp.com/attachments/1083353621778923581/1110550133134852206/lightbulb.png'){
    link = 'https://www.googleapis.com/drive/v3/files/1_QnkvmGct2dzeu-pBO9ofT-828pWvCcn?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I'
  }
  else if(link == "https://cdn.discordapp.com/attachments/1083353621778923581/1083353624891105290/star.png"){
   link = 'https://drive.google.com/uc?id=1F868fVhQnzFALTcnEIXUDeAl3UKZccKA';
  }
  else if(link == "https://cdn.discordapp.com/attachments/1083353621778923581/1083353624652038215/skull.png"){
    link = "https://drive.google.com/uc?id=1of0nmVMh8rnt9pz6iri9gtq-mCQmgCWA"
  }
  else if(link == "https://cdn.discordapp.com/attachments/1083353621778923581/1083353625113399376/mappin.png"){
    link = "https://drive.google.com/uc?id=1excaNtaLfn_Hj5EHuH-h8iimpzC36i0M"
  }
  else if(link == "https://cdn.discordapp.com/attachments/1083353621778923581/1148091041589756005/flame1.gif"){
    link = "https://drive.google.com/uc?id=1eWHXQsHloLuocYOuHnvvd0zymZQMH7sm"
  }
  return link;
}



/**
 * Generates a random integer number between min and max.
 * @param {Number} min lower boundary (including)
 * @param {Number} max upper boundary (excluding)
 * @returns Number
 */
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Constrains a given number between a minimum and maximum value.
 * @param {Number} Number a given value
 * @param {Number} min lower boundary (including)
 * @param {Number} max upper boundary (including)
 * @returns Number
 */
function clamp (number, min, max) {
	return Math.min(Math.max(number, min), max)
}

/**
 * Extracts a YouTube VideoID from a given URL.
 * Returns false if no ID vas found.
 * @param {String} url Youtube video URL
 * @returns String | false
 */
function youtube_parser(url) {
	let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	let match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
}

/**
 * Check is a given URL is valid
 * @param {string} value any URL
 * @returns boolean
 */
function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

const MAX_ZOOM = 5
const MIN_ZOOM = 0.001


const debounce_scroll_event = mydebounce(function(){
		setTimeout(function(){
			$(window).off('scroll.projectorMode').on("scroll.projectorMode", projector_scroll_event);
		}, 200)	
}, 200)

const debounce_font_change = mydebounce(function(){
	$('#VTTWRAPPER').css({"--font-size-zoom": Math.max(12 * Math.max((3 - window.ZOOM), 0), 8.5) + "px"})
}, 25);
/**
 * Changes the zoom level.
 * @param {Number} newZoom new zoom value
 * @param {Number} x zoom center horizontal
 * @param {Number} y zoom center vertical
 */
function change_zoom(newZoom, x, y, reset = false) {
	console.group("change_zoom")
	console.log("zoom", newZoom, x , y)
	let zoomCenterX = x || $(window).width() / 2
	let zoomCenterY = y || $(window).height() / 2
	// window.VTTMargin is the size of the black area to the left and top of the map
	let centerX = Math.round((($(window).scrollLeft() + zoomCenterX) - window.VTTMargin) * (1.0 / window.ZOOM));
	let centerY = Math.round((($(window).scrollTop() + zoomCenterY) - window.VTTMargin) * (1.0 / window.ZOOM));
	window.ZOOM = newZoom;
	let pageX = Math.round(centerX * window.ZOOM - zoomCenterX) + window.VTTMargin;
	let pageY = Math.round(centerY * window.ZOOM - zoomCenterY) + window.VTTMargin;

	if($('#projector_zoom_lock.enabled > [class*="is-active"]').length>0 && window.DM)
		$(window).off('scroll.projectorMode')
	


	if(reset != true){
		$(window).scrollLeft(pageX);
		$(window).scrollTop(pageY);	
	}

	$('#VTTWRAPPER').css({
		"--window-zoom": window.ZOOM,
	})
	debounce_font_change();	
	set_default_vttwrapper_size();
	if(reset == true){
		//this was changed from scrollIntoView to calculate the center and scrollTo as if loaded in an iframe it would scroll the parent window in firefox
		const sceneMap = $("#scene_map")[0];

		const rect = sceneMap.getBoundingClientRect();
		const sceneMapCenterX = Math.round(rect.left + rect.width / 2 + window.scrollX);
		const sceneMapCenterY = Math.round(rect.top + rect.height / 2 + window.scrollY);
		let scrollX = Math.max(0, sceneMapCenterX - Math.round(window.innerWidth / 2));
		const scrollY = Math.max(0, sceneMapCenterY - Math.round(window.innerHeight / 2));
		if ($('#hide_rightpanel').hasClass('point-right') && $('.ct-sidebar.ct-sidebar--hidden').length == 0)
			scrollX += 170 // 170 half of game log		
		window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' });			
	}


	$(".peerCursorPosition").css("transform", "scale(" + 1/window.ZOOM + ")");
	if($('#projector_zoom_lock.enabled > [class*="is-active"]').length>0 && window.DM)
		debounce_scroll_event()
	
	
	console.groupEnd()
}

/**
* Adds the current zoom level and scrollLeft, scrollTop offsets to local storage along with the title of the scene.
*/
function add_zoom_to_storage() {
	console.group("add_zoom_to_storage");
	console.log("storing zoom");

	if(window.ZOOM !== get_reset_zoom()) {
		const zooms = JSON.parse(localStorage.getItem('zoom')) || [];
		const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title);
		const centerView = center_of_view(); 
		const sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
		if (zoomIndex !== -1) {
			zooms[zoomIndex].zoom = window.ZOOM;
			zooms[zoomIndex].leftOffset = window.scrollX + window.innerWidth/2 - sidebarSize/2;
			zooms[zoomIndex].topOffset = window.scrollY + window.innerHeight/2;
		}
		else{
			// zoom doesn't exist
			zooms.push({
				"title": window.CURRENT_SCENE_DATA.title,
				"zoom":window.ZOOM,
				"leftOffset": window.scrollX + window.innerWidth/2 - sidebarSize/2,
				"topOffset": window.scrollY + window.innerHeight/2
			});
		}
		localStorage.setItem('zoom', JSON.stringify(zooms));
	} else {console.log("zoom has not changed, skipping storage")}

	console.groupEnd("add_zoom_to_storage")
}

/**
* Sets default values for VTTWRAPPER and black_layer based off zoom.
*/
function set_default_vttwrapper_size() {
	$("#VTTWRAPPER").width($("#scene_map").width() * window.CURRENT_SCENE_DATA.scale_factor * window.ZOOM + 1400);
	$("#VTTWRAPPER").height($("#scene_map").height() * window.CURRENT_SCENE_DATA.scale_factor * window.ZOOM + 1400);
	$("#black_layer").width(($("#scene_map").width()) * window.CURRENT_SCENE_DATA.scale_factor * window.ZOOM + 2000 + window.VTTMargin );
	$("#black_layer").height(($("#scene_map").height()) * window.CURRENT_SCENE_DATA.scale_factor * window.ZOOM + 2000 + window.VTTMargin );
}

/**
 * Removes the zoom for the current scene from local storage, applied when user click "fit zoom" button.
 */
function remove_zoom_from_storage() {
	const zooms = JSON.parse(localStorage.getItem('zoom')) || [];
	const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title);
	if (zoomIndex !== -1) {
		console.log("removing zoom from storage", zooms[zoomIndex]);
		zooms.splice(zoomIndex, 1);
	}
	localStorage.setItem('zoom', JSON.stringify(zooms));
}

/**
* Retrieves the zoom and scroll position from local storage using the scene title, will call reset_zoom if not found.
*/
function apply_zoom_from_storage() {
	console.group("apply_zoom_from_storage");
	const sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
	let initial_x = isNaN(parseInt(window.CURRENT_SCENE_DATA.initial_x)) ? undefined : window.CURRENT_SCENE_DATA.initial_x - window.innerWidth/2 + sidebarSize/2;
	let initial_y =  isNaN(parseInt(window.CURRENT_SCENE_DATA.initial_y)) ? undefined : window.CURRENT_SCENE_DATA.initial_y - window.innerHeight/2;
	let initial_zoom =  isNaN(parseInt(window.CURRENT_SCENE_DATA.initial_zoom)) ? undefined : window.CURRENT_SCENE_DATA.initial_zoom;

	if(initial_zoom != undefined){
		change_zoom(initial_zoom)
		if(initial_x != undefined && initial_y != undefined)
			window.scrollTo(initial_x, initial_y)
	}
	else{
		const zoomState = localStorage.getItem("zoom");
		if (zoomState != null) {
			const zooms = JSON.parse(zoomState);
			const zoomIndex = zooms.findIndex(zoom => zoom.title === window.CURRENT_SCENE_DATA.title);
			if(zoomIndex !== -1) {
				console.log("restoring zoom level", zooms[zoomIndex]);
				change_zoom(zooms[zoomIndex].zoom)

				if(initial_x != undefined && initial_y != undefined)
					window.scrollTo(initial_x, initial_y)
				else
					window.scrollTo(zooms[zoomIndex].leftOffset - window.innerWidth/2 + sidebarSize/2, zooms[zoomIndex].topOffset - window.innerHeight/2)
			}
			else{
				// Zooms in storage but not for this scene
				console.log("scene does not have a zoom stored")
				reset_zoom()
				if(initial_x != undefined && initial_y != undefined)
					window.scrollTo(initial_x, initial_y)
			}
		}
		else{
			// no zooms in storage
			console.log("no zooms in storage")
			reset_zoom()
			if(initial_x != undefined && initial_y != undefined)
				window.scrollTo(initial_x, initial_y)
		}
	}


	
	console.groupEnd()
}

var zoomBusy = false;
var zoomQ = [];
var lastZoom;	  
//each zoom event [amt, typ, off, x, y] typ = 0(relative) 1(absolute) 2(offset)
//keep a queue - which can mostly be squashed except for some offset events
function throttledZoom(amount, typeFlag, zx, zy)  {
	if(typeFlag === 2) {
		if(zoomQ.length == 0) {
			zoomQ = [[1.0,0,amount,zx,zy]];				
		} else {
			last = zoomQ[zoomQ.length-1];
			if(last[1] === 0) {
				last[2] = amount;
			} else { //last[1] == 1
				last[0] += amount;
			}
		}
	} else if(zoomQ.length == 0 || typeFlag === 1) {
		zoomQ = [[amount,typeFlag, 0, zx, zy]];
	} else { //relative
		last = zoomQ[zoomQ.length-1];
		if(last[2] === 0) { //no offset
			last[0] = last[0] * amount;
		} else { //complex case where we need sequence
			zoomQ.push([amount,typeFlag, 0, zx, zy]);
		}
	}
	if(!zoomBusy) {
		zoomBusy = true;
		function applyOrDone() {
			if(zoomQ.length) { //add all the queue events together based on current zoom
				let z = window.ZOOM;
				let zoomX, zoomY;
				let doit = false;
				if(zoomQ.length) {
					while(zoomQ.length) {
						e = zoomQ.pop(0);
						z = ((e[1] === 0) ? z * e[0] : e[0]) + e[2];
						zoomX = e[3];
						zoomY = e[4];
					}
					z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
					if(z != window.ZOOM) doit = true;
					zoomQ = [];
				}
				if(doit && lastZoom && Date.now() - lastZoom < 2) {
					//throttle by time
					setTimeout(() => {
						change_zoom(z, zoomX, zoomY);
						lastZoom = Date.now();
						requestAnimationFrame(applyOrDone)
					}, 1);
				} else {
					if(doit) {
						change_zoom(z, zoomX, zoomY);
						lastZoom = Date.now();
					}
					requestAnimationFrame(applyOrDone);
				} 
			} else {
				zoomBusy = false;
			}
		}
		requestAnimationFrame(applyOrDone);
	}
}

/**
* Gets the zoom values that will fit the map to the viewport
* @return {Number}
*/
function get_reset_zoom() {
	const sidebar_open = ($('#hide_rightpanel').hasClass('point-right') && $('.ct-sidebar.ct-sidebar--hidden').length == 0) ? 340 : 0;
	const wH = $(window).height();
	const mH = $("#scene_map").height()*window.CURRENT_SCENE_DATA.scale_factor;
	const wW = $(window).width()-sidebar_open;
	const mW = $("#scene_map").width()*window.CURRENT_SCENE_DATA.scale_factor;

	console.log(wH, mH, wW, mW);
	return Math.min((wH / mH), (wW / mW));
}

/**
* Entrypoint for user clicking the fit map button.
* Will remove local storage state as by default this function is called when no state is found.
*/
function reset_zoom() {
	console.group("reset_zoom");
	console.log("zooming on centre of map");
	// change_zoom is great for mouse zooming, but tricky when just hitting the centre of the map
	// so don't give it any x/y and just use the scrollIntoView center instead
	change_zoom(get_reset_zoom(), undefined, undefined, true);


	// Don't store any zoom for this scene as we default to map fit on load
	remove_zoom_from_storage();
	console.groupEnd();
}

/**
 * Extracts the character ID from a given URL.
 * Returns -1 if no ID is found.
 * @param {String} sheet_url a DDB character URL
 * @returns string | -1
 */
function getPlayerIDFromSheet(sheet_url) {
	let playerID = -1;
	if(sheet_url) {
		let urlSplit = sheet_url.split("/");
		if(urlSplit.length > 0) {
			playerID = urlSplit[urlSplit.length - 1].split('?')[0];
		}
	}
	return playerID;
}

window.YTTIMEOUT = null;

/**
 * Shows an error message when a map_load_error event occurs.
 * @param {Event} e event object
 */
function map_load_error_cb(e) {
	console.log(e);
	let src = e.currentTarget.getAttribute("src");
	$('#loadingStyles').remove();
	console.error("map_load_error_cb src", src, e);
	if (typeof src === "string") {
		let specificMessage = `Please make sure the image is accessible to anyone on the internet.`;
		if (src.includes("drive.google") || window.CURRENT_SCENE_DATA.map.includes("drive.google")) {
			showGoogleDriveWarning();
		}
		else if (confirm(`Map could not be loaded!\n${specificMessage}\nYou may also need to disable ad blockers.\nWould you like to try loading the image in a separate tab to verify that it's accessible? If you are currently logged in to google, you will need to log out or open the image in a different browser or an incognito window to truly test it.`)) {
			if (window.DM || confirm(`SPOILER ALERT!!!\nIf you click OK, you might see the entire map without fog of war. However, the map isn't loading at all so you will probably see a broken link. Are you sure you want to test this image?`)) {
				window.open(window.CURRENT_SCENE_DATA.map, '_blank');
			}
		}
	}
	window.LOADING = false
	remove_loading_overlay();
	$('.import-loading-indicator').remove();
	delete window.LOADING;
	window.MB.loadNextScene();
	console.groupEnd();
}

/**
 * The first time we load, an overlay is shown to mask all the window modifications we do.
 * This removes it. See `Load.js` for the injection of the overlay.
 */
function remove_loading_overlay() {
	console.debug("remove_loading_overlay")
	$("#loading_overlay").animate({ "opacity": 0 }, 1000, function() {
		$("#loading_overlay").hide();
	});
}

/**
 * Creates a new map for DM & Players.
 * Both DM and players use this when you're in the cloud.
 * @param {String} url the URL to the map
 * @param {Boolean} is_video flag for animated maps
 * @param {Number} width of the map
 * @param {Number} height of the map
 * @param {Function} callback trigged after map is loaded
 */
async function load_scenemap(url, is_video = false, width = null, height = null, UVTTFile = false, callback = null) {
	clearInterval(window.YTINTERVAL);
	$("#scene_map_container").toggleClass('map-loading', true);

	$("[id='scene_map']").remove();

	if (window.YTTIMEOUT != null) {
		clearTimeout(window.YTTIMEOUT);
		window.YTTIMEOUT = null;
	}
	$("#youtube_controls_button").css('visibility', 'hidden');
	console.log("is video? " + is_video);
	if (url.includes("youtube.com") || url.includes("youtu.be")) {
		$("#youtube_controls_button").css('visibility', '');
		$("#scene_map_container").toggleClass('video', true);
		if (width == null) {
			width = 1920;
			height = 1080;
		}

		let newmap = $('<div style="width:' + width + 'px;height:' + height + 'px;position:absolute;top:0;left:0;z-index:10" id="scene_map" />');
		$("#map_items").append(newmap);
		videoid = youtube_parser(url);
		window.YTPLAYER = new YT.Player('scene_map', {
			width: width,
			height: height,
			videoId: videoid,
			playerVars: { 'autoplay': 0, 'controls': 1, 'rel': 0 },
			host: 'https://www.youtube-nocookie.com',
			events: {
				'onStateChange': function(event) {  
					if (event.data == 0) window.YTPLAYER.seekTo(0); 
				},
				'onReady': function(e) { 
					let ytvolume=window.MIXER?.state()?.animatedMap?.volume != undefined ? window.MIXER?.state()?.animatedMap?.volume : $("#youtube_volume").val();
					if(ytvolume)
						e.target.setVolume(ytvolume); 
					else
						e.target.setVolume(25);
					e.target.playVideo();

	        const loopTime = window.YTPLAYER.playerInfo.duration - 0.15;

	        window.YTINTERVAL = setInterval(function (){
	          const current_time = window.YTPLAYER.getCurrentTime();
	          if (current_time > loopTime) {
	            	window.YTPLAYER.seekTo(0);
								window.YTPLAYER.playVideo();
	          }
	        }, 10);
				}			
			}
		});



		callback();
		$("#scene_map_container").toggleClass('map-loading', false);
	}
	else if (is_video === "0" || !is_video) {
		$("#scene_map_container").toggleClass('video', false);

		let newmap;

		

		if(UVTTFile && width != null){		
			newmap = $(`<img id='scene_map' src='${url}' style='position:absolute;top:0;left:0;z-index:10'>`);		
			newmap.width(width);
			newmap.height(height);		
		}
		else if(url.startsWith('above-bucket-not-a-url')){
			url = await getAvttStorageUrl(url, true);
			newmap = $(`<img id='scene_map' src='${url}' style='position:absolute;top:0;left:0;z-index:10'>`);

		}
		else{
			url = await getGoogleDriveAPILink(url)
			newmap = $(`<img id='scene_map' src='${url}' style='position:absolute;top:0;left:0;z-index:10'>`);
		}


		newmap.on("error", map_load_error_cb);

		newmap.on("load", () => {
			$("#scene_map_container").toggleClass('map-loading', false);
		});
		if (callback != null) {
			newmap.on("load", callback);
		}
		$("#map_items").append(newmap);


	}
	else {
		console.log("LOAD MAP " + width + " " + height);
		$("#scene_map_container").toggleClass('video', true);
		let newmapSize = 'width: 100vw; height: 100vh;';
		if (width != null) {
			newmapSize = 'width: ' + width + 'px; height: ' + height + 'px;';
		}
		let videoVolume = window.MIXER?.state()?.animatedMap?.volume != undefined ? window.MIXER?.state()?.animatedMap?.volume : $("#youtube_volume").val() != undefined ? $("#youtube_volume").val() : 0.25;
		
		
		videoVolume = videoVolume * $("#master-volume input").val();
		
		if(url.includes('google')){
			if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") < 0 && url.indexOf("thumbnail?id=") < 0 ) {
				const parsed = 'https://drive.google.com/uc?id=' + url.split('/')[5];
				const fileid = parsed.split('=')[1];
				url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;     
			} 
			else if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") > -1) {
				const fileid = url.split('=')[1];
				url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;   
			}
			else if (url.startsWith("https://drive.google.com") && url.indexOf("thumbnail?id=") > -1) {
				const fileid = url.split('=')[1].split('&')[0];
				url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;   
			}
		}
		else if(url.includes('onedrive')){
	    	url = url.replace('embed?', 'download?');
		}
		else if(url.includes("https://1drv.ms/"))
		{
		  url = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
		}
		else if (url.startsWith('above-bucket-not-a-url')) {
			url = await getAvttStorageUrl(url, true)
		}
		let newmap = $(`<video style="${newmapSize} position: absolute; top: 0; left: 0;z-index:10" playsinline autoplay loop data-volume='0.25' onplay="this.volume=${videoVolume/100}" id="scene_map" src="${url}" />`);
		newmap.off("loadeddata").one("loadeddata", callback);
		newmap.off("error").on("error", map_load_error_cb);

		if (width == null) {
			newmap.off("loadedmetadata").on("loadedmetadata", function (e) {
				console.log("video width:", this.videoWidth);
				console.log("video height:", this.videoHeight);
				$('#scene_map').width(this.videoWidth);
				$('#scene_map').height(this.videoHeight);
				$("#scene_map_container").toggleClass('map-loading', false);
			});
		}
		else{
			$("#scene_map_container").toggleClass('map-loading', false);
		}
		$("#map_items").append(newmap);

	}

	$('#scene_map ~ #scene_map').remove()
	
}

/**
 * Displays a marker at the given point in the given color.
 * Scrolls to marker if dontscroll flag is not set
 * @param {Object} data see Main.js: init_ui -> tempOverlay.dblclick function for details
 * @param {Boolean} dontscroll prevent scrolling
 */
function set_pointer(data, dontscroll = false) {

	let marker = $("<div></div>");
	marker.css({
		"position": "absolute",
		"top": data.y - 50,
		"left": data.x - 50,
		"width": "100px",
		"height": "100px",
		"z-index": "30",
		"border-radius": "50%",
		"opacity": "1.0",
		"border-width": "18px",
		"border-style": "double",
		"border-color": data.color,
		"transform": `scale(${(1 / window.ZOOM)})`,
		"--ping-scale":`${(1 / window.ZOOM)}`,
		"animation": 'pingAnimate linear 3s infinite',
		"filter": "drop-shadow(1px 1px 0px #000)"
	});
	$("#tokens").append(marker);


	setTimeout(function(){marker.fadeOut(1000)}, 2000);
	setTimeout(function(){marker.remove()}, 3000);


	// Calculate pageX and pageY and scroll there!

	if(!dontscroll){
		let pageX = Math.round(data.x * window.ZOOM - ($(window).width() / 2));
		let pageY = Math.round(data.y * window.ZOOM - ($(window).height() / 2));
		let sidebarSize = ($('#hide_rightpanel.point-right').length>0 ? 340 : 0);
		$("html,body").animate({
			scrollTop: pageY + window.VTTMargin,
			scrollLeft: pageX + window.VTTMargin + sidebarSize/2,
		}, 500);
	}
}



/**
 * Add .notification and .highlight-gamelog classes to #switch_gamelog.
 * @param {string} color - a valid css color
 */
function flash_tokens_tab(color) {
	const tokensTab = window.DM ? $("#switch_tokens") : $("#switch_characters");
	// unlike the gamelog, we don't want this to stay highlighted. Just flash it, and be done
	tokensTab.css("--player-border-color", color);
	tokensTab.addClass("notification");
	setTimeout(function() {
		tokensTab.removeClass("notification");
	}, 800);
}

function select_next_tab() {
	const currentlySelected = $(".sidebar__controls .selected-tab");
	if (currentlySelected.attr("id") === "switch_settings") {
		return; // already as far right as we can go
	}
	const nextTab = currentlySelected.next();
	if (nextTab.length === 1) {
		change_sidbar_tab(nextTab);
	}
}
function select_prev_tab() {
	const currentlySelected = $(".sidebar__controls .selected-tab");
	if (currentlySelected.attr("id") === "switch_gamelog") {
		return; // already as far left as we can go
	}
	const previousTab = currentlySelected.prev();
	if (previousTab.length === 1) {
		change_sidbar_tab(previousTab);
	}
}

/**
 * Triggers sidebar tab change based on given event.
 * @param {event} e click event
 */
function switch_control(e) {
	change_sidbar_tab($(e.currentTarget));
}

/**
 * Removes 'active' classes from active sidebar tab
 */
function deselect_all_sidebar_tabs() {
	$(".selected-tab .sidebar-tab-image").removeClass("ct-primary-box__tab--extras ddbc-tab-list__nav-item ddbc-tab-list__nav-item--is-active");
	$(".selected-tab").removeClass("selected-tab");
}

/**
 * Changes the active tab in the sidebar.
 * @param {DOMObject} clickedTab selected DOM object.
 * @param {Boolean} isCharacterSheetInfo switch back to gamelog if false
 */
function change_sidbar_tab(clickedTab, isCharacterSheetInfo = false) {

	deselect_all_sidebar_tabs();
	clickedTab.addClass("selected-tab").removeClass("notification");
	clickedTab.find(".sidebar-tab-image").addClass("ct-primary-box__tab--extras ddbc-tab-list__nav-item ddbc-tab-list__nav-item--is-active");

	close_sidebar_modal();
	$(clickedTab.attr("data-target")).addClass('selected-tab');

	disable_draggable_change_folder();

	// switch back to gamelog if they change tabs
	if (!isCharacterSheetInfo) {
		// This only happens when `is_character_page() == true` and the user clicked the gamelog tab.
		// This is an important distinction, because we switch to the gamelog tab when the user clicks info on their character sheet that causes details to be displayed instead of the gamelog.
		// Since the user clicked the tab, we need to show the gamelog instead of any detail info that was previously shown.
    let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button, button[class*='-gamelog-button']")
    if(gameLogButton.length == 0){
      gameLogButton = $(`[d='M243.9 7.7c-12.4-7-27.6-6.9-39.9 .3L19.8 115.6C7.5 122.8 0 135.9 0 150.1V366.6c0 14.5 7.8 27.8 20.5 34.9l184 103c12.1 6.8 26.9 6.8 39.1 0l184-103c12.6-7.1 20.5-20.4 20.5-34.9V146.8c0-14.4-7.7-27.7-20.3-34.8L243.9 7.7zM71.8 140.8L224.2 51.7l152 86.2L223.8 228.2l-152-87.4zM48 182.4l152 87.4V447.1L48 361.9V182.4zM248 447.1V269.7l152-90.1V361.9L248 447.1z']`).closest('[role="button"]'); // this is a fall back to look for the gamelog svg icon and look for it's button.
    }
    gameLogButton.click()
	}
}

/**
 * Posts a message to the chat when a player connected to the server.
 */
function report_connection() {
	let msgdata = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: PLAYER_NAME + " has connected to the server!",
	};
	window.MB.inject_chat(msgdata);
}

function use_iframes_for_monsters() { // this is just in case we find a bug and need to give users an easy way to fall back to iframes
	close_sidebar_modal();
	$("#resizeDragMon").remove();
	window.fetchMonsterStatBlocks = true;
	localStorage.setItem("use_iframes_for_monsters", "true");
}
function stop_using_iframes_for_monsters() { // this is just in case we find a bug and need to give users an easy way to fall back to iframes
	close_sidebar_modal();
	$("#resizeDragMon").remove();
	window.fetchMonsterStatBlocks = false;
	localStorage.setItem("use_iframes_for_monsters", "false");
}
function should_use_iframes_for_monsters() {
	if (window.fetchMonsterStatBlocks === undefined) {
		window.fetchMonsterStatBlocks = localStorage.getItem("use_iframes_for_monsters") === "true";
	}
	return window.fetchMonsterStatBlocks;
}

async function popout_all_selected_token_stat(){
	const selectedTokens = window.CURRENTLY_SELECTED_TOKENS;
	if(!selectedTokens || selectedTokens.length < 1)
		return;
	for(let id of selectedTokens){
		let container;
		const token = window.TOKEN_OBJECTS[id];
		if(token.isPlayer()){
			continue;
		}
		if (token.options.statBlock) {
			let customStatBlock = window.JOURNAL.notes[token.options.statBlock].text;
			let pcURL = $(customStatBlock).find('.custom-pc-sheet.custom-stat').text();
			if (pcURL) {
				continue;
			} 
			container = await load_monster_stat(undefined, token.options.id, customStatBlock);
		}
		else if(token.options.monster){
			container = await load_monster_stat(token.options.monster, token.options.id);
		}
		const windowName = `${token.options.name}_${token.options.id}`.replaceAll(/(\r\n|\n|\r)/gi, "").trim();
		popoutWindow(windowName, container.find(".avtt-stat-block-container"));
		$(window.childWindows[windowName].document).find(".avtt-roll-button").on("contextmenu", function (contextmenuEvent) {
			$(window.childWindows[windowName].document).find("body").append($("div[role='presentation']").clone(true, true));
			let popoutContext = $(window.childWindows[windowName].document).find(".dcm-container");
			let maxLeft = window.childWindows[windowName].innerWidth - popoutContext.width();
			let maxTop = window.childWindows[windowName].innerHeight - popoutContext.height();
			if (parseInt(popoutContext.css("left")) > maxLeft) {
				popoutContext.css("left", maxLeft)
			}
			if (parseInt(popoutContext.css("top")) > maxTop) {
				popoutContext.css("top", maxTop)
			}
			$(window.childWindows[windowName].document).find("div[role='presentation']").on("click", function (clickEvent) {
				$(window.childWindows[windowName].document).find("div[role='presentation']").remove();
			});
			$(".dcm-backdrop").remove();
		});
		close_player_monster_stat_block();
	}
}
function open_selected_token_stat() {
	const selectedTokens = window.CURRENTLY_SELECTED_TOKENS;
	if (!selectedTokens || selectedTokens.length < 1)
		return;

	const token = window.TOKEN_OBJECTS[selectedTokens[0]];
	if (token.isPlayer()) {
		open_player_sheet(token.options.sheet, undefined, token.options.name);
	}
	else if (token.options.statBlock) {
		let customStatBlock = window.JOURNAL.notes[token.options.statBlock].text;
		let pcURL = $(customStatBlock).find('.custom-pc-sheet.custom-stat').text();
		if (pcURL) {
			open_player_sheet(pcURL, undefined, token.options.name);
		}
		else{
			load_monster_stat(undefined, token.options.id, customStatBlock);
		}
	}
	else if (token.options.monster) {
		load_monster_stat(token.options.monster, token.options.id);
	}
}

/**
 * Loads and displays a monster stats block
 * @param {Number} monsterId given monster ID
 * @param {UUID} tokenId selected token ID
 */
function load_monster_stat(monsterId, tokenId, customStatBlock=undefined) {
	if(customStatBlock){
		let container = build_draggable_monster_window(tokenId);
		display_stat_block_in_container(customStatBlock, container, tokenId, customStatBlock);
		$(".sidebar-panel-loading-indicator").remove();
		container.attr('data-name', window.all_token_objects[tokenId].options.name);
		return container;
	}
	if(window.all_token_objects[tokenId].options.monster == 'open5e'){
		let container = build_draggable_monster_window(tokenId);
		build_and_display_stat_block_with_id(window.all_token_objects[tokenId].options.stat, container, tokenId, function () {
			$(".sidebar-panel-loading-indicator").remove();
			container.attr('data-name', window.all_token_objects[tokenId].options.name);
		}, true);

		return container;
	}
	if (should_use_iframes_for_monsters()) {
		load_monster_stat_iframe(monsterId, tokenId);
		return container;
	}
	let container = build_draggable_monster_window(tokenId);
	build_and_display_stat_block_with_id(monsterId, container, tokenId, function () {
		$(".sidebar-panel-loading-indicator").remove();
		container.attr('data-name', window.all_token_objects[tokenId].options.name);
	});
	return container;
}

function load_monster_stat_iframe(monsterId, tokenId) {

	console.group("load_monster_stat")
	// monster block exists
	if($("#monster_block").length > 0){
		// same monster, update trackers and return early
		if ($("#monster_block").attr("data-monid") == monsterId){
			const token = window.TOKEN_OBJECTS[tokenId];
			// rebuild any ability trackers specific to this token
			rebuild_ability_trackers($("#monster_block").contents(), tokenId)

			$("#resizeDragMon").removeClass("hideMon");
			console.groupEnd()
			return
		}
		// clean up old monster block before removing
		$("#monster_block").attr("id","old_monster_block")
		$("#old_monster_block").hide()
		$(".sidebar-panel-loading-indicator").show()
		$("#old_monster_block").off("load")
		$("#old_monster_block").attr("src", null)
		$('#old_monster_block').remove();
		$("#resizeDragMon").removeClass("hideMon");
	}

	// create a monster block wrapper element
	if (! $("#resizeDragMon").length) {
		const monStatBlockContainer = $(`<div id='resizeDragMon' style="display:none; left:300px"></div>`);
		$("body").append(monStatBlockContainer)
		monStatBlockContainer.append(build_combat_tracker_loading_indicator())
		const loadingIndicator = monStatBlockContainer.find(".sidebar-panel-loading-indicator")
		loadingIndicator.css("top", "25px")
		loadingIndicator.css("height", "calc(100% - 25px)")
		monStatBlockContainer.show("slow")
		monStatBlockContainer.resize(function(e) {
			e.stopPropagation();
		});
	}

	const iframe = $(`<iframe id=monster_block data-monid=${monsterId}>`);
	iframe.css("display", "none");

	$("#resizeDragMon").append(iframe);

	window.StatHandler.getStat(monsterId, function(stats) {
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
			const img = $(event.target).contents().find(".detail-content").find(".image");
			const statblock = $(event.target).contents().find(".mon-stat-block");
			if (img.length == 1) {
				img.insertAfter(statblock);
				const sendToGamelog = $("<button>Send IMG To Gamelog</button>");
				img.css("text-align", "center");
				img.append(sendToGamelog);

				const imgsrc = img.find("a").attr('href');
				sendToGamelog.click(function() {
					const msgdata = {
						player: window.PLAYER_NAME,
						img: window.PLAYER_IMG,
						text: "<img width='100%' class='magnify' href='" + imgsrc + "' src='" + imgsrc + "'>",
					};

					window.MB.inject_chat(msgdata);
				});
			}


			scan_monster($(event.target).contents(), stats, tokenId);
			$(event.target).contents().find("a").attr("target", "_blank");
			$(".sidebar-panel-loading-indicator").hide()
			$("#monster_block").fadeIn("slow")
			console.groupEnd()
		});

		iframe.attr('src', stats.data.url)
	})

	$(iframe).on("load", function(event){
		const tooltipCSS = $(`<style>.hovering-tooltip{ display: block !important; left: 5px !important; right: 5px !important; pointer-events: none !important; min-width: calc(100% - 10px);} </style>`);
		$("head", $("#monster_block").contents()).append(tooltipCSS);

		$("body", $("#monster_block").contents()).css('width', 'calc(100% + 670px)');
		$("#site", $("#monster_block").contents()).css('padding-right', '670px');

		$(".tooltip-hover", $("#monster_block").contents()).on("mouseover mousemove", function(){
			$("#db-tooltip-container .body .tooltip, #db-tooltip-container", $("#monster_block").contents()).toggleClass("hovering-tooltip", true);
		});
		$(".tooltip-hover", $("#monster_block").contents()).on("mouseout", function(){
			$("#db-tooltip-container .body .tooltip, #db-tooltip-container", $("#monster_block").contents()).toggleClass("hovering-tooltip", false);
		});

		// if the user right-clicks a tooltip, send it to the gamelog
		$(event.target).contents().off("contextmenu").on("contextmenu", ".tooltip-hover", function(clickEvent) {
			clickEvent.preventDefault();
			clickEvent.stopPropagation();

			const toPost = $("#db-tooltip-container", $("#monster_block").contents()).clone();
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
	if($("#resizeDragMon .popout-button").length==0){
		const monster_popout_button=$('<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>')
		$("#resizeDragMon").append(monster_popout_button);
		monster_popout_button.click(function() {
			let name = $("#resizeDragMon .avtt-stat-block-container .mon-stat-block__name-link").text();
			popoutWindow(name, $("#resizeDragMon .avtt-stat-block-container"));
			name = name.replace(/(\r\n|\n|\r)/gm, "").trim();
			$(window.childWindows[name].document).find(".avtt-roll-button").on("contextmenu", function (contextmenuEvent) {
				$(window.childWindows[name].document).find("body").append($("div[role='presentation']").clone(true, true));
				let popoutContext = $(window.childWindows[name].document).find(".dcm-container");
				let maxLeft = window.childWindows[name].innerWidth - popoutContext.width();
				let maxTop =  window.childWindows[name].innerHeight - popoutContext.height();
				if(parseInt(popoutContext.css("left")) > maxLeft){
					popoutContext.css("left", maxLeft)
				}
				if(parseInt(popoutContext.css("top")) > maxTop){
					popoutContext.css("top", maxTop)
				}
				$(window.childWindows[name].document).find("div[role='presentation']").on("click", function (clickEvent) {
           			 $(window.childWindows[name].document).find("div[role='presentation']").remove();
        		});
				$(".dcm-backdrop").remove();
			});
			monster_close_title_button.click();
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
			$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
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
			$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function () {
			$('.iframeResizeCover').remove();
		}
	});
	minimize_player_monster_window_double_click($("#resizeDragMon"));
}

function build_draggable_monster_window(tokenId) {

	$("#resizeDragMon").append(build_combat_tracker_loading_indicator())
	let container = $("<div id='resizeDragMon'/>");

	if($("#site #resizeDragMon").length>0){
		$("#resizeDragMon iframe").remove();
		$("#resizeDragMon").removeClass("hideMon");
		container = $("#resizeDragMon");
	}
	container.resize(function(e) {
		e.stopPropagation();
	});
	const token = window.TOKEN_OBJECTS[tokenId];
	if(!$("#site #resizeDragMon").length>0){
		$("#site").prepend(container);
	}

	/*Set draggable and resizeable on monster sheets for players. Allow dragging and resizing through iFrames by covering them to avoid mouse interaction*/
	if($("#monster_close_title_button").length==0) {
		const monster_close_title_button = $('<div id="monster_close_title_button"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>');
		$("#resizeDragMon").append(monster_close_title_button);
		monster_close_title_button.click(function() {
			close_player_monster_stat_block();
		});
	}
	let popoutButton = $("#resizeDragMon .popout-button");
	if (popoutButton.length==0){
		popoutButton =$('<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>')
		$("#resizeDragMon").append(popoutButton);
	}
	popoutButton.off('click.popout').on('click.popout', function() {
		let name = $("#resizeDragMon .avtt-stat-block-container .mon-stat-block__name-link").text();
		const windowName = `${token?.options?.name ? token.options.name : name}_${tokenId ? tokenId : ''}`.replaceAll(/(\r\n|\n|\r)/gi, "").trim();
		popoutWindow(windowName, $("#resizeDragMon .avtt-stat-block-container"));
		$(window.childWindows[windowName].document).find(".avtt-roll-button").on("contextmenu", function (contextmenuEvent) {
			$(window.childWindows[windowName].document).find("body").append($("div[role='presentation']").clone(true, true));
			let popoutContext = $(window.childWindows[windowName].document).find(".dcm-container");
			let maxLeft = window.childWindows[windowName].innerWidth - popoutContext.width();
			let maxTop = window.childWindows[windowName].innerHeight - popoutContext.height();
			if(parseInt(popoutContext.css("left")) > maxLeft){
				popoutContext.css("left", maxLeft)
			}
			if(parseInt(popoutContext.css("top")) > maxTop){
				popoutContext.css("top", maxTop)
			}
			$(window.childWindows[windowName].document).find("div[role='presentation']").on("click", function (clickEvent) {
				$(window.childWindows[windowName].document).find("div[role='presentation']").remove();
			});
			$(".dcm-backdrop").remove();
		});
		monster_close_title_button.click();
	});
	$("#resizeDragMon").addClass("moveableWindow");
	if(!$("#resizeDragMon").hasClass("minimized")) {
		$("#resizeDragMon").addClass("restored");
	}
	else{
		$("#resizeDragMon").dblclick();
	}
	$("#resizeDragMon").resizable({
		addClasses: false,
		handles: "all",
		containment: "#windowContainment",
		start: function() {
			$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function() {
			$('.iframeResizeCover').remove();
		},
		minWidth: 200,
		minHeight: 200
	});

	$("#resizeDragMon").mousedown(function() {
		frame_z_index_when_click($(this));
	});
	$("#resizeDragMon").draggable({
		addClasses: false,
		scroll: false,
		containment: "#windowContainment",
		start: function() {
			$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function() {
			$('.iframeResizeCover').remove();
		}
	});
	minimize_player_monster_window_double_click($("#resizeDragMon"));

	return container;
}


/**
 * Hides any open monster stat block windows.
 */
function close_player_monster_stat_block() {
	$("#resizeDragMon.minimized").dblclick();
	console.debug("close_player_monster_stat_block is closing the stat block");
	$("#resizeDragMon").addClass("hideMon");
}

/**
 * Register event to minimize/restore the monster stat block window when double clicking the DOMObject.
 * @param {DOMObject} titleBar the window's title bar
 */
function minimize_player_monster_window_double_click(titleBar) {
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
			// titleBar.prepend('<div class="monster_title">Monster: '+$("#resizeDragMon iframe").contents().find(".mon-stat-block__name-link").text()+"</div>");
			titleBar.prepend('<div class="monster_title">Monster: '+titleBar.attr('data-name')+"</div>");

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

/**
 * Creates sidebar menu.
 * @returns void
 */
async function init_controls() {
	if($("#switch_gamelog").length > 0){
			if($('#settings-panel').length == 0){
				init_sidebar_tabs();
			}
		return;
	}


	if (is_characters_page()) {
		$(".ct-sidebar").css("top", "-2px");
	} else {
		$(".sidebar").css("top", "2px");
	}
	$(".sidebar").css("height", "calc(100vh - 24px)");

	$(".ct-sidebar__inner button[aria-label='Unlocked']").click(); // Click on the padlock icon  // This is safe to call multiple times
	let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button, button[class*='-gamelog-button']")
 	if(gameLogButton.length == 0){
   	gameLogButton = $(`[d='M243.9 7.7c-12.4-7-27.6-6.9-39.9 .3L19.8 115.6C7.5 122.8 0 135.9 0 150.1V366.6c0 14.5 7.8 27.8 20.5 34.9l184 103c12.1 6.8 26.9 6.8 39.1 0l184-103c12.6-7.1 20.5-20.4 20.5-34.9V146.8c0-14.4-7.7-27.7-20.3-34.8L243.9 7.7zM71.8 140.8L224.2 51.7l152 86.2L223.8 228.2l-152-87.4zM48 182.4l152 87.4V447.1L48 361.9V182.4zM248 447.1V269.7l152-90.1V361.9L248 447.1z']`).closest('[role="button"]'); // this is a fall back to look for the gamelog svg icon and look for it's button.
 	}
 	gameLogButton.click();

	init_sidebar_tabs();
	let sidebarControlsParent = is_characters_page() ? $(".ct-sidebar__inner>[class*='styles_controls']") : $(".sidebar__controls");
	sidebarControlsParent.find(".avtt-sidebar-controls").remove();
	sidebarControlsParent.children().css({ "visibility": "hidden", "width": "0px", "height": "0px", "position": "absolute" });
	sidebarControlsParent.css({ "display": "block", "visibility": "visible", "height": "28px", "position": "relative", "top": "0px", "left": "0px" });

	let sidebarControls = $("<div class='avtt-sidebar-controls' style='width:100%;height:100%;display:flex;'></div>");
	sidebarControlsParent.append(sidebarControls);

	let hider = $("<div id='hide_rightpanel' class='ddbc-tab-options--layout-pill point-right hasTooltip button-icon hideable' data-name='Show/hide sidebar (q)' data-visible=1><div class='ddbc-tab-options__header-heading'><span class='material-icons button-icon'>chevron_right</span></div></div>");
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
	b6ImageDiv.css({
		"mask": `url(${b6Image}) no-repeat center / contain`,
		"-webkit-mask": `url(${b6Image}) no-repeat center / contain`
	});
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

	b7 = $("<div id='switch_settings' class='tab-btn hasTooltip button-icon trailing-edge blue-tab' data-name='Settings' data-target='#settings-panel'></div>");

	let b7ImageDiv = $('<div></div>');
	let b7ImageDivWrapper = $('<div class="sidebar-tab-image" style="width:100%;height:100%;"></div>');
	let b7Image = `${window.EXTENSION_PATH}assets/icons/cog.svg`;
	b7ImageDiv.css({ "mask": `url(${b7Image}) no-repeat center / contain`, "-webkit-mask": `url(${b7Image}) no-repeat center / contain` });
	b7ImageDivWrapper.append(b7ImageDiv);
	b7.append(b7ImageDivWrapper);
	b7.click(switch_control);
	sidebarControls.append(b7);

	$(".tab-btn").on("click", function(e) {
		$(".tab-btn").removeClass('selected-tab');
		$(e.currentTarget).toggleClass('selected-tab');
	});

	if (!DM) {
		sidebarControls.addClass("player");
	}
	addGamelogPopoutButton()
	$('ol[class*="GameLogEntries"]').off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function(event){
		event.preventDefault();
		render_source_chapter_in_iframe(event.target.href);
	});
}

const MAX_ZOOM_STEP = 20
/**
 * Register event for mousewheel zoom.
 */
function init_mouse_zoom() {
	window.addEventListener('wheel', function (e) {
		if (e.ctrlKey) {
			e.preventDefault();
			e.stopPropagation();
			if (e.deltaY > MAX_ZOOM_STEP) {
				throttledZoom(0.9,0,e.clientX,e.clientY);
			}
			else if (e.deltaY < -MAX_ZOOM_STEP) { //-ve, zoom out
				throttledZoom(1.1,0,e.clientX,e.clientY);
			}
			else {
				throttledZoom(- 0.01 * e.deltaY,2,e.clientX,e.clientY)
			}
		}
	}, { passive: false } );
	
	let dist1=0;
	let start_scale=window.ZOOM;
	let zsx=0, zsy=0;
	let touchMode = 0;
	let touchTimeout;
	function getDist(ts) {
  		const dx = ts[0].clientX - ts[1].clientX;
		const dy = ts[0].clientY - ts[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}
	function start_pinch(ev) {
		if (ev.targetTouches.length == 2) {
			ev.preventDefault()
			ev.stopPropagation();
			const ts = ev.targetTouches;
			dist1 = getDist(ts);
			start_scale = window.ZOOM;
			zsx = (ts[0].clientX + ts[1].clientX)/2;
			zsy = (ts[0].clientY + ts[1].clientY)/2;
			touchMode = 2;
		}
	}
	let suppressed = null;
	function move_pinch(ev) {
		if(ev && touchMode == 2) {
			ev.preventDefault()
			ev.stopPropagation();
			if (ev.targetTouches.length == 2) {
				const dist2 = getDist(ev.targetTouches)
              			const factor = dist2 / dist1;
				const newScale = start_scale * factor;
				throttledZoom(newScale, 1, zsx, zsy);
			}
	        }
        }

		document.addEventListener('touchstart', start_pinch, { passive: false });
		document.addEventListener('touchmove', move_pinch, { passive: false });
		document.addEventListener("touchend", function (e) {
			if (touchTimeout) clearTimeout(touchTimeout);
			if (e.touches.length === 0) {
				touchTimeout = setTimeout(() => {
					touchMode = 0;
				}, 100);
			}
		});
		document.addEventListener("touchcancel", function (e) {
			//still needs to be tested - not sure how to trigger
			if ((e.touches == undefined || e.touches.length === 0) && touchMode === 2) {
				console.log("Touch interrupted. Resetting.");
				touchMode = 0;
				throttledZoom(start_scale, 1); //todo: x,y?
			}
		});

		//disable browser gestures (not sure: is there a more subtle way in CSS?)
		function prevent(e) { e.preventDefault(); }
		document.addEventListener("gesturestart", prevent);
		document.addEventListener("gesturechange", prevent);
		document.addEventListener("gestureend", prevent);


}


/**
 * Start sending google analytics heartbeat events.
 */

/**
 * Creates and displays splash screen
 * Also starts Google Analytics heartbeat.
 */
function init_splash() {

	if (!get_avtt_setting_value("alwaysShowSplash") && localStorage.getItem("AboveVttLastUsedVersion") === window.AVTT_VERSION) {
		// the user only wants to see the splash screen when there's a new version, and this is not a new version
		console.log("not showing splash screen", localStorage.getItem("AboveVttLastUsedVersion"), window.AVTT_VERSION)
		return;
	}
	localStorage.setItem("AboveVttLastUsedVersion", window.AVTT_VERSION);

	let cont = $("<div id='splash'></div>");
	cont.append(`<h1 style='margin-top:0px; padding-bottom:2px;margin-bottom:2px; text-align:center'><img width='250px' src='${window.EXTENSION_PATH}assets/logo.png'><div style='margin-left:20px; display:inline;vertical-align:bottom;'>${window.AVTT_VERSION}${AVTT_ENVIRONMENT.versionSuffix}</div></h1>`);
	cont.append("<div style='font-style: italic;padding-left:80px;font-size:20px;margin-bottom:2px;margin-top:2px; margin-left:50px;'>Fine.. We'll do it ourselves..</div>");

	let s = $("<div/>");
	//s.append("<div style='display:inline-block;width:300px'>this stuff here<br>and here<br>and here</div>");
	s.append("");
	s.append(`
	<div style='display:inline-block; vertical-align:top;width:100%;'>
	<div style='padding-top:10px;padding-bottom:10px;'>
		This is a <b>FREE</b> opensource project, kept alive by developers contributing their time, Patrons chipping in with their cash, and users keeping alive the community. If you need help or want to report a bug reach out the <a style='text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'> the AboveVTT community on discord</a>
	</div>
	<div class='splashLinks'>
		<div class="splashLinkRow">
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://youtu.be/2GZ8q-hB7pg'>Youtube Tutorial</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://discord.gg/cMkYKqGzRh'>Discord Server</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://github.com/cyruzzo/AboveVTT'>GitHub</a></div>
			<div><a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a></div>
		</div>

	</div>
	<div style='padding-top:10px;'>Project Owner/Founder: <b>Daniele <i>cyruzzo</i> Martini</b></div>
	</div>
	`);

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
	cont.append("<div style='padding-top:10px'>Contributors: <b>SnailDice (Nadav),Stumpy, Palad1N, KuzKuz, Coryphon, Johnno, Hypergig, JoshBrodieNZ, Kudolpf, Koals, Mikedave, Jupi Taru, Limping Ninja, Turtle_stew, Etus12, Cyelis1224, Ellasar, DotterTrotter, Mosrael, Bain, Faardvark, Azmoria, Natemoonlife, Pensan, H2, CollinHerber, Josh-Archer, TachyonicSpace, TheRyanMC, j3f (jeffsenn), MonstraG, Wyrmwood, Drenam1</b></div>");

	cont.append("<br>AboveVTT is an hobby opensource project. It's completely free (like in Free Speech). The resources needed to pay for the infrastructure are kindly donated by the supporters through <a style='font-weight:bold;text-decoration: underline;' target='_blank' href='https://www.patreon.com/AboveVTT'>Patreon</a> , what's left is used to buy wine for cyruzzo");

	let patreons = $("<div id='patreons'/>");


	let shortener =  (p) => p.length>17 ? p.replaceAll(" ","").replaceAll("-","") : p;

	let patrons_list=$("<ul/>");

	$.ajax({
		url:'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/patrons.json',
		success:function(data){
			JSON.parse(data).patrons.forEach( (el)=>{
				const li=$("<li/>").text( shortener(el.full_name));
				li.addClass(el.class);
				patrons_list.append(li);
			});
		}
	});

	patreons.append(patrons_list);
	cont.append(patreons);
	cont.click(function() {
		$("#splash").remove();

	});

	let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal" ><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`);
	cont.append(closeButton);

	$(window.document.body).append(cont);
}



var DDB_WS_OBJ = null;
var DDB_WS_FORCE_RECONNECT_LOCK = false; // Best effort (not atomic) - ensure function is called only once at a time
/**
 * Attempts to force DDBs WebSocket to re-connect.
 * @returns Bool false - wasn't able to force / no need
 * @returns Bool true - was able to attempt force reconnec
 */
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

		if ((DDB_WS_OBJ && DDB_WS_OBJ.status == 'disconnected') || (window.MB.ws.readyState != window.MB.ws.OPEN)) {
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

/**
 * Register event to minimize/restore a player window when double clicking the DOMObject.
 * @param {DOMObject} titleBar the window's title bar
 */
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
			titleBar.prepend('<div class="player_title">Player: '+$("#sheet").attr("data-name")+"</div>");
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

/**
 * Move frames behind each other in the order they were clicked
 * @param {DOMObject} moveableFrame
 */
function frame_z_index_when_click(moveableFrame){

	if(moveableFrame.css('z-index') != 90000) {
		moveableFrame.css('z-index', 90000);
		$(".moveableWindow, [role='dialog']").not(moveableFrame).each(function() {
			$(this).css('z-index',($(this).css('z-index')-1));
		});
	}
}

/**
 * Deprecated?
 * NOTE: No reference found within the project
 */
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
				button.attr("data-shape", "set-me");
				button.attr("data-style", "set-me");
				button.attr("data-size", "set-me");
				set_full_path(button, SidebarListItem.Aoe(shape, style, size).fullPath());
				enable_draggable_token_creation(button);
				return button;
			})
			console.log(`${extras.length} companions discovered`);
		}
	});
	companion_observer.observe(mutation_target,mutation_config);
	console.groupEnd()
}


/**
 * Prepare character sheet window.
 * @returns void
 */
function  init_sheet() {
	if (is_characters_page()) {

		// in case we're re-initializing, remove these before adding them again
		$("#sheet_button").remove();
		$("#sheet_resize_button").remove();

		// when playing on the characters page, we need to do a little bit of UI manipulation so we do that here
		let  sheet_button = $("<div id='sheet_button' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Show/hide character sheet (SPACE)'><div class='ddbc-tab-options__header-heading'>SHEET</div></div>");
		sheet_button.css({ "position": "absolute", "top": "2px", "left": "-80px", "z-index": "999" });
		sheet_button.find(".ddbc-tab-options__header-heading").css({ "padding": "6px" });
		$(".avtt-sidebar-controls").append(sheet_button);
		sheet_button.click(function(e) {
			toggle_player_sheet();
		});
		let  sheet_resize_button = $("<div id='sheet_resize_button' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Resize character sheet'><div class='ddbc-tab-options__header-heading'>Toggle Sheet Size</div></div>");
		sheet_resize_button.css({ "position": "absolute", "top": "2px", "left": "-369px", "z-index": "999" });
		sheet_resize_button.find(".ddbc-tab-options__header-heading").css({ "padding": "6px" });
		$(".avtt-sidebar-controls").append(sheet_resize_button);
		// $(".ct-character-sheet__inner").append(sheet_resize_button);
		sheet_resize_button.click(function(e) {
			toggle_player_sheet_size();
		});

		if (window.innerWidth < 1200 || !is_player_sheet_open()) {
			sheet_resize_button.hide();
		}		
	}
	if($("#sheet").length == 0){
		let container = $("<div id='sheet'></div>");
		let iframe = $("<iframe src=''></iframe>")
		container.append(iframe);
	
		let  buttonleft = 0;
		let  buttonprev = 0;
	
		const player_close_title_button=$('<div id="player_close_title_button"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>');
		container.append(player_close_title_button);
		player_close_title_button.click(function() {
			close_player_sheet();
		});
	
		let  reload_button = $('<div id="reload_player_frame_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>)');
	
	
		reload_button.click(function() {
			let iframe = $("#sheet").find("iframe");
			let currentSrc = iframe.attr('src');
			iframe.attr('src', currentSrc);
		});
		container.append(reload_button);
	
		$("#site").append(container);
	
	
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
				$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
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
				$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();
			}
		});
		minimize_player_window_double_click($("#sheet"));
	
	}
}




/**
 * Opens the character sheet window.
 * @param {String} sheet_url URL to DDB charater
 * @param {Boolean} closeIfOpen - currenlty not in use
 * @returns
 */
function open_player_sheet(sheet_url, closeIfOpen = true, playerName = '') {
	if($("#sheet.minimized").length > 0) {
		$("#sheet.minimized").dblclick();
	}
	console.log("open_player_sheet"+sheet_url);

	
	close_player_sheet(); // always close before opening

	let container = $("#sheet");
	let iframe = container.find("iframe");


	iframe.css('height', container.height() - 25);
	container.addClass("open");


	iframe.attr('data-sheet_url',sheet_url);
	iframe.attr('src', sheet_url);
	const playerId = sheet_url.split('/').pop();

	container.attr('data-name', playerName);
	// lock this sheet
	window.MB.sendMessage("custom/myVTT/lock", { player_sheet: sheet_url });
	iframe.off("load").on("load", function(event) {
		console.log("fixing up the character sheet");

		let scripts = [
		    // External Dependencies
		    { src: "jquery-3.6.0.min.js" },
		    { src: "jquery.contextMenu.js" },
		    // AboveVTT Files
		    { src: "CoreFunctions.js" }, // Make sure CoreFunctions executes first
		    { src: "DDBApi.js" },
		    { src: "MonsterDice.js" },
		    { src: "DiceRoller.js" },
		    { src: "DiceContextMenu/DiceContextMenu.js" },
		    { src: "MessageBroker.js" },
		    { src: "rpg-dice-roller.bundle.min.js" },
		    // AboveVTT files that execute when loaded
		    { src: "CharactersPage.js" } // Make sure CharactersPage executes last
		]

		// Too many of our scripts depend on each other.
		// This ensures that they are loaded sequentially to avoid any race conditions.
		let injectScript = function () {
		    if (scripts.length === 0) {
		        return;
		    }
		    let nextScript = scripts.shift();
		    let s = $(event.target)[0].contentDocument.createElement('script');
		    s.src = `${window.EXTENSION_PATH}${nextScript.src}`;
		    if (nextScript.type !== undefined) {
		        s.setAttribute('type', nextScript.type);
		    }
		    console.log(`attempting to append ${nextScript.src}`);
		    s.onload = function() {
		        console.log(`finished injecting ${nextScript.src}`);
		        injectScript();
		    };
		    ($(event.target)[0].contentDocument.head || $(event.target)[0].contentDocument.documentElement).appendChild(s);
		}
		injectScript();
		
		
		$(event.target).contents().find("head").append($(`<link type="text/css" rel="Stylesheet" href="${window.EXTENSION_PATH}DiceContextMenu/DiceContextMenu.css" />`));
		$(event.target).contents().find("head").append($(`<link type="text/css" rel="Stylesheet" href="${window.EXTENSION_PATH}jquery.contextMenu.css" />`));
		$(event.target).contents().find("head").append(`
			<style>
			button.avtt-roll-button,
			.ct-sidebar__inner .integrated-dice__container,
			.ct-sidebar__inner .avtt-roll-button{
			      /* lifted from DDB encounter stat blocks  */
			      color: var(--theme-contrast, #b43c35);
			      background: transparent !important;
			      border: 1px solid var(--theme-color, #b43c35);
			      border-radius: 4px;
			      background-color: #fff;
			      white-space: nowrap;
			      font-family: Roboto Condensed,Open Sans,Helvetica,sans-serif;
			      letter-spacing: 1px;
			      padding: 1px 4px 0;	       
			}
			.ct-sidebar__inner .integrated-dice__container, .ct-sidebar__inner .avtt-roll-button{
			    font-size:12px;
			    line-height:10px;
			    padding:2px 2px 1px 2px;
			}
      .ct-sidebar__inner .stat-block .avtt-roll-button{
          font-size:15px;
          line-height:15px;
          font-weight: unset;
      }
      .ct-sidebar__inner [class*='ddbc-creature-block'] .avtt-roll-button{
          /* lifted from DDB encounter stat blocks  */
          color: #b43c35 !important;
          background: #fff !important;
          border: 1px solid #b43c35 !important;
          line-height:unset !important;
          font-size:unset !important;
          padding: 1px 4px 0 !important;  
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
			html body#site.body-rpgcharacter-sheet{
				background-position: center 93px !important;
			}
			#site #site-main{
				padding-top: 0px !important;
			}
			.ct-character-sheet-mobile__header{
				top: 0px !important; 
			}
			#mega-menu-target,
			.site-bar,
			.page-header,
			.homebrew-comments,
			.mega-menu__fallback{
				display:none !important;
			}

			@media (min-width: 1200px){
				html body#site.body-rpgcharacter-sheet{
					background-position: center 116px !important
				}
			}
			</style>
		`);
		console.log("removing headers");
		$(event.target).contents().find("body").append(`<div id='extensionpath' data-path='${window.EXTENSION_PATH}'></div>`)

		if (window.JOINTHEDICESTREAM) {
			joinDiceRoom();
		}


		// WIP to allow players to add in tokens from their extra tab
		// observe_character_sheet_companion($(event.target).contents());



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
	return container;
}

/**
 * Closes and unloads the character sheet window.
 */
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
	if (window.character_sheet_observer) {
		window.character_sheet_observer.disconnect();
		delete window.character_sheet_observer;
	}
	if(!window.DM && !is_spectator_page()){
		observe_character_sheet_changes($('#site-main, .ct-sidebar__portal'));
	}
}
/**
 * Waits for a global variable to be set.
 * Then triggers the callback function.
 * @param {String} name a global variable name
 * @param {Function} callback
 */
function whenAvailable(name, callback) {
	let interval = 1000; // ms
	setTimeout(function () {
		if (window[name]) {
			callback(window[name]);
		} else {
			whenAvailable(name, callback);
		}
	}, interval);
}

/**
 * Notifie about player joining the game.
 */
function notify_player_join() {
	if(window.DM)
		return;
	const playerdata = {
		abovevtt_version: window.AVTT_VERSION,
		player_id: window.PLAYER_ID,
		pc: read_pc_object_from_character_sheet(window.PLAYER_ID)
	};

	console.log("Sending playerjoin msg, abovevtt version: " + playerdata.abovevtt_version + ", sheet ID:" + window.PLAYER_ID);
	whenAvailable('JOURNAL', function(){window.MB.sendMessage("custom/myVTT/playerjoin", playerdata)});
}

/**
 * Check if all players have the same AboveVTT version.
 * @returns Number - latest version seen
 */
function check_versions_match() {
	let  latestVersionSeen = 0.0;
	let  oldestVersionSeen = 1000.0;

	$.each(window.CONNECTED_PLAYERS, function(key, value) {
		latestVersionSeen = Math.max(latestVersionSeen, value);
		oldestVersionSeen = Math.min(oldestVersionSeen, value);
	});

	if (latestVersionSeen != oldestVersionSeen) {
		let  alertMsg = 'Not all players connected to your session have the same AboveVTT version (highest seen v' + latestVersionSeen + ', lowest seen v' + oldestVersionSeen + ').\nFor best experience, it is recommended all connected players and the DM run the latest AboveVTT version.\n\n';
		for (const [key, value] of Object.entries(window.CONNECTED_PLAYERS)) {
			alertMsg += (key == 0 ? "The DM" : "Player DDB character ID " + key) + " is running AboveVTT v" + value + "\n";
		}

		// alert(alertMsg); // we can re-enable this later if we want to, but it's been off for dozens of versions, so we probably don't need it.
		console.warn(alertMsg);
	}

	return latestVersionSeen;
}


/**
 * Check if all connected users are on a version that is greater than or equal to `versionString`
 * @returns {Boolean}
 */
function is_supported_version(versionString) {
	return window.AVTT_VERSION >= versionString;
}

/**
 * Initializes the sidebar on the character page.
 *
 * DDB loads the page in an async modular fashion.
 * We use this to determine if we need to call other initialization functions during this process.
 * As they are injecting things, we need to adjust the UI in the sidebar.
 * This will loop until everything is loaded and adjusted to our liking.
 * @returns void
 */
function init_character_page_sidebar() {

	if ($(".ct-sidebar__portal").length == 0) {
		// not ready yet, try again in a second
		setTimeout(function() {
			init_character_page_sidebar();
		}, 1000);
		return;
	}
	let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button, button[class*='-gamelog-button']")
	if(gameLogButton.length == 0){
	  gameLogButton = $(`[d='M243.9 7.7c-12.4-7-27.6-6.9-39.9 .3L19.8 115.6C7.5 122.8 0 135.9 0 150.1V366.6c0 14.5 7.8 27.8 20.5 34.9l184 103c12.1 6.8 26.9 6.8 39.1 0l184-103c12.6-7.1 20.5-20.4 20.5-34.9V146.8c0-14.4-7.7-27.7-20.3-34.8L243.9 7.7zM71.8 140.8L224.2 51.7l152 86.2L223.8 228.2l-152-87.4zM48 182.4l152 87.4V447.1L48 361.9V182.4zM248 447.1V269.7l152-90.1V361.9L248 447.1z']`).closest('[role="button"]'); // this is a fall back to look for the gamelog svg icon and look for it's button.
	}
	// Open the gamelog, and lock it open

	if(window.showPanel == undefined || window.showPanel == true)
		gameLogButton.click()
	$(".ct-sidebar__control--unlock").click();

	$("#site-main").css({"display": "block", "visibility": "hidden"});
	$(".dice-rolling-panel").css({"visibility": "visible"});
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


	$(".ct-sidebar__inner [class*='styles_content']").css({"border": "none", "padding-bottom": "0px"});
	$(".ct-sidebar__portal").css({
		"right": "0px",
		"position": "fixed",
		"bottom": "0px",
		"top": "0px",
		"z-index": 5
	});
	$(".ct-sidebar").css({ "right": "0px", "top": "0px", "bottom": "0px" });
	$(".ct-sidebar__portal .ct-sidebar .ct-sidebar__inner .ct-sidebar__controls .avtt-sidebar-controls").css("display", "flex")

	$(".ct-sidebar__inner").off("click.setCondition").on("click.setCondition", ".set-conditions-button", function(clickEvent) {
		let conditionName = $(clickEvent.target).parent().find("span").text();
		$('body').append(`<style id='condition-click'>.ct-condition-manage-pane{visibility:hidden !important;}</style>`);
		$('.ct-combat__statuses-group--conditions .ct-combat__summary-label:contains("Conditions"), .ct-combat-tablet__cta-button:contains("Conditions"), .ct-combat-mobile__cta-button:contains("Conditions")').click();
		setTimeout(function(){
			$('.ct-condition-manage-pane').css('visibility', 'hidden');
			$(`.ct-sidebar__inner .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>[class*='styles_toggle'][aria-pressed="false"]`).click();
		}, 30)
		setTimeout(function(){
			$(`#switch_gamelog`).click();
			$("#condition-click").remove();
		}, 40)
	});	
	$(".ct-sidebar__inner").off("click.removeCondition").on("click.removeCondition", ".remove-conditions-button", function(clickEvent) {
		let conditionName = $(clickEvent.target).parent().find("span").text();
		$('body').append(`<style id='condition-click'>.ct-condition-manage-pane{visibility:hidden !important;}</style>`);

		$('.ct-combat__statuses-group--conditions .ct-combat__summary-label:contains("Conditions"), .ct-combat-tablet__cta-button:contains("Conditions"), .ct-combat-mobile__cta-button:contains("Conditions")').click();
		setTimeout(function(){
			$('.ct-condition-manage-pane').css('visibility', 'hidden');
			$(`.ct-sidebar__inner .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>[class*='styles_toggle'][aria-pressed="true"]`).click();
		}, 30)
		setTimeout(function(){
			$(`#switch_gamelog`).click();
			$("#condition-click").remove();
		}, 40)

	});
	$(".ct-character-header-info__content").on("click", function(){
		setTimeout(function(){
			$(".ct-pane-menu__item:contains('Manage Character & Levels')").replaceWith($(".ct-pane-menu__item:contains('Manage Character & Levels')").clone());
			$(".ct-pane-menu__item:contains('Manage Character & Levels')").off().on("click", function(){
				$("a.ct-character-header-desktop__builder-link")[0].click();
			});
		}, 1000)
	});

	init_controls();
	init_sheet();
	inject_chat_buttons();
	init_zoom_buttons();
	monitor_character_sidebar_changes();
}

/**
 * Monitor gamelog.
 *
 * when we play on the character sheet, we need to monitor for gamelog changes because DDB swaps it out frequently.
 * Any time they do that, we need to react to those changes.
 */
function monitor_character_sidebar_changes() {
	let gameLogButton = $("div.ct-character-header__group--game-log.ct-character-header__group--game-log-last, [data-original-title='Game Log'] button, button[class*='-gamelog-button']")
	 if(gameLogButton.length == 0){
	   gameLogButton = $(`[d='M243.9 7.7c-12.4-7-27.6-6.9-39.9 .3L19.8 115.6C7.5 122.8 0 135.9 0 150.1V366.6c0 14.5 7.8 27.8 20.5 34.9l184 103c12.1 6.8 26.9 6.8 39.1 0l184-103c12.6-7.1 20.5-20.4 20.5-34.9V146.8c0-14.4-7.7-27.7-20.3-34.8L243.9 7.7zM71.8 140.8L224.2 51.7l152 86.2L223.8 228.2l-152-87.4zM48 182.4l152 87.4V447.1L48 361.9V182.4zM248 447.1V269.7l152-90.1V361.9L248 447.1z']`).closest('[role="button"]'); // this is a fall back to look for the gamelog svg icon and look for it's button.
	 }
	gameLogButton.click(function(event) {
		if (event.originalEvent !== undefined) {
			// the user actually clicked the button. Make sure we switch tabs
			$("#switch_gamelog").click();
		}
	});
}





/**
 * Initializes the user interface.
 */
function init_ui() {
	console.log("init_ui");

	// On iOS make sure browser zoom is zero-d out
	if (isIOS()) { //might also be useful on other mobile. not sure.
		const meta = document.createElement('meta');
		meta.name = "viewport";
		meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
		document.getElementsByTagName('head')[0].appendChild(meta);
	}
	
	window.VTTMargin = 1000;

	// ATTIVA GAMELOG
	$(".glc-game-log").addClass("sidepanel-content");
	$(".sidebar").css("z-index", 9999);
	if (is_characters_page()) {
		reposition_player_sheet();
	}
	$(".sidebar__controls").width(340);
	// $(".ct-sidebar__control").width(340);
	$("body").css("overflow", "scroll");

	inject_chat_buttons();

	$("#site").append(`
		<script type="text/javascript" src="/content/1-0-2027-0/js/libs/lightbox2/dist/js/lightbox.min.js"></script>
        <link rel="stylesheet" href="/content/1-0-2027-0/js/libs/lightbox2/dist/css/lightbox.min.css">
	`);

	const background = $("<img id='scene_map'>");
	background.css("top", "0");
	background.css("left", "0");
	background.css("position", "absolute");
	background.css("z-index", "10");
	
	const drawOverlayUnderFogDarkness = $("<canvas id='draw_overlay_under_fog_darkness'></canvas>");
	drawOverlayUnderFogDarkness.css("position", "absolute");
	drawOverlayUnderFogDarkness.css("top", "0");
	drawOverlayUnderFogDarkness.css("left", "0");
	drawOverlayUnderFogDarkness.css("z-index", "11");

	const mapItems = $("<div id='map_items'></div>");
	mapItems.css("top", "0");
	mapItems.css("left", "0");
	mapItems.css("position", "absolute");
	mapItems.css("z-index", "11");

	const tokenMapItems = $("<div id='token_map_items'></div>")
	tokenMapItems.css("top", "0");
	tokenMapItems.css("left", "0");
	tokenMapItems.css("position", "absolute");
	tokenMapItems.css("z-index", "12");

	const mapContainer = $("<div id='scene_map_container' />");
	mapContainer.css("top", "0");
	mapContainer.css("left", "0");
	mapContainer.css("position", "absolute");

	lightContainer = $("<div id='light_container'/>");
	lightContainer.css("top", "0");
	lightContainer.css("left", "0");
	lightContainer.css("bottom", "0");
	lightContainer.css("right", "0");
	lightContainer.css("position", "absolute");

	const drawOverlay = $("<canvas id='draw_overlay'></canvas>");
	drawOverlay.css("position", "absolute");
	drawOverlay.css("top", "0");
	drawOverlay.css("left", "0");
	drawOverlay.css("z-index", "22");

	const lightOverlay = $("<canvas id='light_overlay'></canvas>");
	lightOverlay.css("position", "absolute");
	lightOverlay.css("top", "0");
	lightOverlay.css("left", "0");
	lightOverlay.css("z-index", "9");
	lightOverlay.css("mix-blend-mode", "lighten");

	const outer_light_container = $("<div id='outer_light_container'></canvas>");
	outer_light_container.css("position", "absolute");
	outer_light_container.css("top", "0");
	outer_light_container.css("left", "0");
	outer_light_container.css("z-index", "9");
	outer_light_container.css("width", "100%");
	outer_light_container.css("height", "100%");


	const textDiv = $("<div id='text_div'></div>");
	textDiv.css("position", "absolute");
	textDiv.css("top", "0");
	textDiv.css("left", "0");
	textDiv.css("z-index", "20");

	const grid = $("<canvas id='grid_overlay'></canvas>");
	grid.css("position", "absolute");
	grid.css("top", "0");
	grid.css("left", "0");
	grid.css("z-index", "19");

	const walls = $("<canvas id='walls_layer'></canvas>");
	walls.css("position", "absolute");
	walls.css("top", "0");
	walls.css("left", "0");
	walls.css("z-index", "19");

	const elev = $("<canvas id='elev_overlay'></canvas>");
	elev.css("position", "absolute");
	elev.css("top", "0");
	elev.css("left", "0");
	elev.css("z-index", "19");

	const weather = $("<canvas id='weather_overlay'></canvas>");
	weather.css("position", "absolute");
	weather.css("top", "0");
	weather.css("left", "0");
	weather.css("z-index", "55");

	const weatherLight = $("<canvas id='weather_light'></canvas>");
	weatherLight.css("position", "absolute");
	weatherLight.css("top", "0");
	weatherLight.css("left", "0");
	weatherLight.css("z-index", "25");

	const fog = $("<canvas id='fog_overlay'></canvas>");
	fog.css("top", "0");
	fog.css("left", "0");
	fog.css("position", "absolute");
	fog.css("z-index", "21");


	const rayCasting = $("<canvas id='raycastingCanvas'></canvas>");
	rayCasting.css({"top": "0", "left": "0", "position": "absolute", "z-index": "22"});

	// this overlay sits above other canvases, but below tempOverlay
	// when peers stream their rulers, this canvas is where we draw them
	const peerOverlay = $("<canvas id='peer_overlay'></canvas>");
	peerOverlay.css("position", "absolute");
	peerOverlay.css("top", "0");
	peerOverlay.css("left", "0");
	peerOverlay.css("z-index", "15"); // below fog

	// this overlay sits above all other canvases
	// we draw to this and then bake the image into the corresponding
	// canvas, based on the drawing function
	const tempOverlay = $("<canvas id='temp_overlay'></canvas>");
	tempOverlay.css("position", "absolute");
	tempOverlay.css("top", "0");
	tempOverlay.css("left", "0");
	tempOverlay.css("z-index", "25");

	const darknessLayer = $("<div id='darkness_layer'></div>");
	darknessLayer.css("position", "absolute");
	darknessLayer.css("top", "0");
	darknessLayer.css("left", "0");

	tempOverlay.dblclick(function(e) {
		if(window.DRAWFUNCTION != 'select')
			return;
		e.preventDefault();

		let  mousex = Math.round((e.pageX - window.VTTMargin) * (1.0 / window.ZOOM));
		let  mousey = Math.round((e.pageY - window.VTTMargin) * (1.0 / window.ZOOM));

		console.log("mousex " + mousex + " mousey " + mousey);

		data = {
			x: mousex,
			y: mousey,
			from: window.PLAYER_NAME,
			dm: window.DM,
			color: color_for_player_id(my_player_id()),
			center_on_ping: $('#ping_center .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')
		}

		set_pointer(data,true);

		window.MB.sendMessage("custom/myVTT/pointer", data)
	});

	// AVOID ANNOYING TEXT SELECTIONS


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

	
	const VTT = $(`<div id='VTT' style='position:absolute; top:0px;left:0px;  '/>`);

	//VTT.css("margin-left","200px");
	//VTT.css("margin-top","200px");
	//VTT.css("padding-right","400px");
	//VTT.css("padding-bottom","400px");

	let tokens = $("<div id='tokens'></div>");
	tokens.css("position", "absolute");
	tokens.css("top", 0);
	tokens.css("left", 0);

	VTT.append(tokens);

	VTT.append(mapContainer);
	VTT.append(peerOverlay);
	VTT.append(drawOverlayUnderFogDarkness);
	VTT.append(fog);
	VTT.append(grid);
	VTT.append(drawOverlay);
	VTT.append(textDiv);
	VTT.append(tempOverlay);
	VTT.append(walls);
	VTT.append(elev);
	VTT.append(weather);
	mapItems.append(tokenMapItems);
	mapContainer.append(outer_light_container);
	mapContainer.append(mapItems);
	mapContainer.append(darknessLayer);
	outer_light_container.append(rayCasting);
	outer_light_container.append(lightContainer);
	lightContainer.append(lightOverlay, weatherLight);


	mapItems.append(background);
	mapItems.append(drawOverlayUnderFogDarkness);



	wrapper = $("<div id='VTTWRAPPER'/>");
	wrapper.css("margin-left", `${window.VTTMargin}px`);
	wrapper.css("margin-top", `${window.VTTMargin}px`);
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
	black_layer.width(window.width+window.VTTMargin);
	black_layer.height(window.height+window.VTTMargin);
	black_layer.css("position", "absolute");
	black_layer.css("top", "0px");
	black_layer.css("left", "0px");
	black_layer.css("background", "black");
	black_layer.css("opacity", "0");
	$("body").append(black_layer);
	black_layer.animate({ opacity: "1" }, 1000);
	black_layer.css("z-index", "1");

	black_layer.off('contextmenu').on('contextmenu', function(e){
		e.preventDefault();
	})

	init_controls();
	init_sheet();
	init_my_dice_details();
	
	window.WaypointManager = new WaypointManagerClass();

	find_and_set_player_color();
	configure_peer_manager_from_settings();
	

	$(".sidebar__pane-content").css("background", "rgba(255,255,255,1)");


	init_buttons();
	init_zoom_buttons();
	init_combat_tracker();

	token_menu();
	

	// EXPERRIMENTAL DRAG TO MOVE
	let  curDown = false,
		curYPos = 0,
		curXPos = 0;

	// Function separated so it can be dis/enabled
	function mousemove(m) {
		if (curDown) {
			let scrollOptions = {
				left: window.scrollX + curXPos - m.pageX,
				top: window.scrollY + curYPos - m.pageY,
				behavior: "instant"
			}
			requestAnimationFrame(function(){
				window.scrollTo(scrollOptions)
			});
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
			curDown = true;
			$("#VTT, #black_layer").css("cursor", "grabbing");
			//cover iframes so you can drag through windows
			const openDraggables = $("#resizeDragMon");
			if (openDraggables.find('iframe').length>0) {
				// iframes yoink the right-click drag when you're moving the map. The non-iframe stat blocks don't need to worry about this
				openDraggables.append($('<div class="iframeResizeCover"></div>'));
			}
			$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			//return false;
		}
		let modal = m.target.closest(".sidebar-modal");
		if(modal){
			window.MODALDOWN = true;
		}
		else{
			window.MODALDOWN = false;
		}
	}

	// Function separated so it can be dis/enabled
	function mouseup(event) {
		
		curDown = false;
		$("#VTT, #black_layer").css("cursor", "");

		if (event.target.tagName.toLowerCase() !== 'a') {
			$("#splash").remove(); // don't remove the splash screen if clicking an anchor tag otherwise the browser won't follow the link
		}
		if (sidebar_modal_is_open() && event.which === 1 && !window.MODALDOWN) {
			// check if the click was within the modal or within an element that we specifically don't want to close the modal
			let modal = event.target.closest(".sidebar-modal");
			let preventSidebarModalClose = event.target.closest(".prevent-sidebar-modal-close");
			if (!modal && !preventSidebarModalClose) {
				close_sidebar_modal();
			}
		}
		//remove iframe cover that prevents mouse interaction
		$('.iframeResizeCover').remove();
		let sidebarMonsterStatBlock = $("#monster-details-page-iframe");
		if (sidebarMonsterStatBlock.length > 0 && !event.target.closest("#monster-details-page-iframe")) {
			sidebarMonsterStatBlock.remove();
		}
		let sidebarMonsterFilter = $("#monster-filter-iframe");
		if (sidebarMonsterFilter.length > 0 && !event.target.closest("#monster-filter-iframe")) {
			close_monster_filter_iframe();
		}
		if (event.which === 1 && $(".sidebar-flyout").length > 0) {
			// check if the click was within the flyout
			let flyout = event.target.closest(".sidebar-flyout");
			let preventSidebarModalClose = event.target.closest(".prevent-sidebar-modal-close");
			if (!flyout && !preventSidebarModalClose) {
				remove_sidebar_flyout();
			}
		}
	}

	// Helper function to disable window mouse handlers, required when we
	// do token dragging operations with measure paths
	window.disable_window_mouse_handlers = function () {

		$(window.document).off("mousemove.mouseHandler", mousemove);
		$(window.document).off("mousedown.mouseHandler", mousedown);
		$(window.document).off("mouseup.mouseHandler", mouseup);
	}

	// Helper function to enable mouse handlers, required when we
	// do token dragging operations with measure paths
	window.enable_window_mouse_handlers = function () {

		$(window.document).on("mousemove.mouseHandler", mousemove);
		$(window.document).on("mousedown.mouseHandler", mousedown);
		$(window.document).on("mouseup.mouseHandler", mouseup);
	}

	window.enable_window_mouse_handlers();

	$("#temp_overlay").bind("contextmenu", function (e) {
		return false;
	});

	init_mouse_zoom()

	init_help_menu();
  	hide_or_unhide_scrollbar()
  

}

const DRAW_COLORS = ["#D32F2F", "#FB8C00", "#FFEB3B", "#9CCC65", "#039BE5",
					"#F48FB1", "#FFCC80", "#FFF59D", "#A5D6A7", "#81D4FA",
					"#3949AB", "#8E24AA", "#212121", "#757575", "#E0E0E0",
					"#7986CB", "#CE93D8", "#616161", "#BDBDBD", "#FFFFFF", "cPick"];

/**
 * Create and add tool buttons.
 * @returns void
 */
function init_buttons() {
	if ($("#fog_menu").length > 0) {
		return; // only need to do this once
	}
	let buttons = $(`<div class="ddbc-tab-options--layout-pill"></div>`);
	$("body").append(buttons);

	buttons.append($("<button style='display:inline; width:75px;' id='select-button' class='drawbutton hideable ddbc-tab-options__header-heading' data-shape='rect' data-function='select'><u>S</u>ELECT</button>"));

	init_ruler_menu(buttons);
	
	if (window.DM) {
		init_fog_menu(buttons)
		init_walls_menu(buttons)
		init_elev_menu(buttons)
		init_vision_menu(buttons)
	}
	init_draw_menu(buttons)

	if (window.DM) {
		init_text_button(buttons)
	}

	setup_aoe_button(buttons);
	handle_drawing_button_click();

	buttons.append("<button style='display:inline;width:75px' id='help_button' class='hideable ddbc-tab-options__header-heading'>HELP</button>");

	buttons.css("position", "fixed");
	buttons.css("top", '5px');
	buttons.css("left", '5px');
	buttons.css("z-index", '125000');

	// HIDE default SEND TO functiontality in the campaign page:

	$(".GameLogHeader_Container__36cXS").hide();


	

	init_keypress_handler();
}

/**
 * Create and add zoom controls.
 * @returns void
 */
function init_zoom_buttons() {

	if ($("#zoom_buttons").length > 0) {
		return;
	}
	let defaultValues = get_avtt_setting_value('quickToggleDefaults') || {};

	// ZOOM BUTTON
	let zoom_section = $("<div id='zoom_buttons' />");
	const youtube_controls_button = $(`<div id='youtube_controls_button' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Quick toggle youtube controls'></div>`);
	youtube_controls_button.click(function (event) {
		console.log("youtube_controls_button", event);
		const iconWrapper = $(event.currentTarget).find(".ddbc-tab-options__header-heading");
		if (iconWrapper.hasClass('ddbc-tab-options__header-heading--is-active')) {
			iconWrapper.removeClass('ddbc-tab-options__header-heading--is-active');
			$(`#scene_map_container`).css('z-index', '');
			$(`#fog_overlay`).css('z-index', '21');
		} else {
			iconWrapper.addClass('ddbc-tab-options__header-heading--is-active');
			$(`#fog_overlay`).css('z-index', '101');
			$(`#scene_map_container`).css('z-index', '100');
		}
	});	
	youtube_controls_button.append(`<div class="ddbc-tab-options__header-heading"><span style="font-size: 20px;" class="material-symbols-outlined">video_settings</span></div>`);
	
	zoom_section.append(youtube_controls_button);
	if(window.DM) {
		
		const dm_screen_button = $(`<div id='dm_screen_button' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Show/Hide DM Screen'> 
			<div class="ddbc-tab-options__header-heading">
					<span class="material-symbols-outlined" style="font-size: 20px;">
						scrollable_header
					</span>
			</div></div>
			`);
		dm_screen_button.click(function (event) {
			console.log("dm_screen_button", event);
			const dmScreen = $(`#dmScreenDragContainer`);
			if (dmScreen.length > 0){
				dmScreen.show();
			}
			else{
				const dmScreenContainer = find_or_create_generic_draggable_window("dmScreenDragContainer", "DM Screen", false, true, '#dmScreenContainer', '90%', '90%', '5%', '5%', false, '', true)
				buildDMScreen(dmScreenContainer);
			}
		});
		zoom_section.append(dm_screen_button);

		const projector_toggle = $(`<div id='projector_toggle' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Quick toggle projector mode'></div>`);


		projector_toggle.click(function (event) {
			console.log("projector_toggle", event);
			const iconWrapper = $(event.currentTarget).find(".ddbc-tab-options__header-heading");
			if (iconWrapper.hasClass('ddbc-tab-options__header-heading--is-active')) {
				iconWrapper.removeClass('ddbc-tab-options__header-heading--is-active');
				window.ProjectorEnabled = false;
			} else {
				iconWrapper.addClass('ddbc-tab-options__header-heading--is-active');
				window.ProjectorEnabled = false;
			}
		});
		projector_toggle.append(`<div class="ddbc-tab-options__header-heading"><span style="font-size: 20px;" class="material-symbols-outlined">cast</span></div>`);
		if(defaultValues.projectorMode != undefined){
			projector_toggle.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.projectorMode) 
			window.ProjectorEnabled = defaultValues.projectorMode;
		}
				
		const projector_zoom_lock = $(`<div id='projector_zoom_lock' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Quick toggle projector zoom lock'></div>`);
		projector_zoom_lock.click(function (event) {
			console.log("projector_toggle", event);
			const iconWrapper = $(event.currentTarget).find(".ddbc-tab-options__header-heading");
			if (iconWrapper.hasClass('ddbc-tab-options__header-heading--is-active')) {
				iconWrapper.removeClass('ddbc-tab-options__header-heading--is-active');
			} else {
				iconWrapper.addClass('ddbc-tab-options__header-heading--is-active');
			}
		});
		projector_zoom_lock.append(`<div class="ddbc-tab-options__header-heading" style='display: flex;align-content: center;align-items: center;justify-content: space-evenly;'>
			<span class="material-symbols-outlined" style='font-size: 14px;padding: 3px;'>
				lock
			</span>
			<span style="font-size: 38px;position: absolute;" class="material-symbols-outlined">
				expand_content
			</span>
		</div>`);
		if(defaultValues.projectorLock != undefined){
			projector_zoom_lock.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.projectorLock) 
		}

		zoom_section.append(projector_zoom_lock, projector_toggle);
		if (get_avtt_setting_value("projector")) {
			projector_toggle.toggleClass('enabled', true);
			projector_zoom_lock.toggleClass('enabled', true);
		}

		const cursor_ruler_toggle = $(`<div id='cursor_ruler_toggle' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Send Cursor/Ruler To Players'></div>`);
		cursor_ruler_toggle.click(function (event) {
			console.log("cursor_ruler_toggle", event);
			const iconWrapper = $(event.currentTarget).find(".ddbc-tab-options__header-heading");
			if (iconWrapper.hasClass('ddbc-tab-options__header-heading--is-active')) {
				iconWrapper.removeClass('ddbc-tab-options__header-heading--is-active');
				window.PeerManager.allowCursorAndRulerStreaming = false;
			} else {
				iconWrapper.addClass('ddbc-tab-options__header-heading--is-active');
				window.PeerManager.allowCursorAndRulerStreaming = true;
			}
		});
		cursor_ruler_toggle.append(`<div class="ddbc-tab-options__header-heading ddbc-tab-options__header-heading--is-active"><span style="font-size: 20px;" class="material-symbols-outlined">left_click</span></div>`);
		zoom_section.append(cursor_ruler_toggle);
		if (!get_avtt_setting_value("peerStreaming")) {
			cursor_ruler_toggle.css("display", "none");
		}
		if(defaultValues.rulerToPlayers != undefined){
			cursor_ruler_toggle.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.rulerToPlayers); 
			window.PeerManager.allowCursorAndRulerStreaming = defaultValues.rulerToPlayers;
		}

		const ping_center = $(`<div id='ping_center' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Center Player View on Pings'> 
		<div class="ddbc-tab-options__header-heading ddbc-tab-options__header-heading--is-active">
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 19.877 19.877" style="enable-background:new 0 0 19.877 19.877; width:20px; height:20px;" xml:space="preserve">
		<g>
			<g>
				<path d="M9.938,3.403c-3.604,0-6.537,2.933-6.537,6.537s2.933,6.537,6.537,6.537s6.538-2.933,6.538-6.537    C16.476,6.336,13.542,3.403,9.938,3.403z M9.938,14.892c-2.73,0-4.952-2.222-4.952-4.952s2.222-4.952,4.952-4.952    c2.731,0,4.953,2.222,4.953,4.952S12.669,14.892,9.938,14.892z"/>
				<path d="M9.938,0.001C4.458,0.001,0,4.459,0,9.938s4.458,9.938,9.938,9.938    c5.481,0,9.939-4.458,9.939-9.938C19.877,4.459,15.419,0.001,9.938,0.001z M9.938,18.292c-4.606,0-8.353-3.746-8.353-8.353    c0-4.606,3.747-8.353,8.353-8.353s8.353,3.747,8.353,8.353C18.291,14.545,14.544,18.292,9.938,18.292z"/>
			</g>
		</g>
		</svg>
		</svg></div></div>
		`);
		ping_center.click(function(){
			if ($('#ping_center .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) {
				$('#ping_center .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
			} else {
				$('#ping_center .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', true)
			}
		});
		if(defaultValues.centerPing != undefined){
			ping_center.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.centerPing); 
		}

		let select_locked = $(`<div id='select_locked' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Toggle Locked Tokens Selectable'> 
		<div class="ddbc-tab-options__header-heading ddbc-tab-options__header-heading--is-active">
				<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px" x="0px" y="0px"
		 viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve">
			<style type="text/css">
				#select_locked .st0{fill:none;}
				#select_locked .st1{fill-rule:evenodd;clip-rule:evenodd;fill:#7f7f7f;}
			</style>
			<path d="M7,20.6c-0.5,0-0.9-0.2-1.2-0.5s-0.5-0.7-0.5-1.2v-8.3c0-0.5,0.2-0.8,0.5-1.2C6.1,9.1,6.5,8.9,7,8.9h0.8V7.3
				c0-1.2,0.4-2.1,1.2-2.9s1.8-1.2,3-1.2c1.2,0,2.2,0.4,3,1.2s1.2,1.8,1.2,2.9v1.7h0.8c0.5,0,0.9,0.2,1.2,0.5c0.3,0.3,0.5,0.7,0.5,1.2
				v8.3c0,0.5-0.2,0.8-0.5,1.2c-0.3,0.3-0.7,0.5-1.2,0.5H7z M7,18.9h10.1v-8.3H7V18.9z M12.1,16.4c0.5,0,0.9-0.2,1.2-0.5
				c0.3-0.3,0.5-0.7,0.5-1.2c0-0.5-0.2-0.8-0.5-1.2s-0.7-0.5-1.2-0.5c-0.5,0-0.9,0.2-1.2,0.5c-0.3,0.3-0.5,0.7-0.5,1.2
				c0,0.5,0.2,0.8,0.5,1.2C11.2,16.2,11.6,16.4,12.1,16.4z M9.5,8.9h5.1V7.3c0-0.7-0.2-1.3-0.7-1.8c-0.5-0.5-1.1-0.7-1.8-0.7
				c-0.7,0-1.3,0.2-1.8,0.7S9.5,6.6,9.5,7.3V8.9z M7,18.9v-8.3V18.9z"/>
			<g>
				<g>
					<g>
						<g>
							<g>
								<g>
									<rect x="-6" y="9" class="st0" width="15" height="6"/>
								</g>
								<rect x="1" y="9.4" class="st1" width="1.5" height="1.1"/>
								<rect x="1" y="11.4" class="st1" width="1.5" height="1.1"/>
								<rect x="1" y="13.4" class="st1" width="1.5" height="1.1"/>
							</g>
						</g>
						<g>
							<g>
								<g>
									<rect x="9" y="-6" class="st0" width="6" height="15"/>
								</g>
								<rect x="13.4" y="1" class="st1" width="1.1" height="1.5"/>
								<rect x="11.4" y="1" class="st1" width="1.1" height="1.5"/>
								<rect x="9.5" y="1" class="st1" width="1.1" height="1.5"/>
							</g>
						</g>
						<g>
							<g>
								<g>
									<rect x="15" y="9" class="st0" width="15" height="6"/>
								</g>
								<rect x="21.5" y="13.4" class="st1" width="1.5" height="1.1"/>
								<rect x="21.5" y="11.4" class="st1" width="1.5" height="1.1"/>
								<rect x="21.5" y="9.5" class="st1" width="1.5" height="1.1"/>
							</g>
						</g>
						<g>
							<g>
								<g>
									<rect x="9" y="15" class="st0" width="6" height="15"/>
								</g>
								<rect x="9.4" y="21.5" class="st1" width="1.1" height="1.5"/>
								<rect x="11.4" y="21.5" class="st1" width="1.1" height="1.5"/>
								<rect x="13.4" y="21.5" class="st1" width="1.1" height="1.5"/>
							</g>
						</g>
						<g>
							<rect x="0.9" y="5.5" class="st1" width="1.5" height="2.5"/>
							<polygon class="st1" points="0.9,1 0.9,3.5 2.4,3.5 2.4,2.5 3.4,2.5 3.4,1 				"/>
							<rect x="5.4" y="1" class="st1" width="2.5" height="1.5"/>
						</g>
						<g>
							<rect x="16" y="0.9" class="st1" width="2.5" height="1.5"/>
							<polygon class="st1" points="23,0.9 20.5,0.9 20.5,2.4 21.5,2.4 21.5,3.4 23,3.4 				"/>
							<rect x="21.5" y="5.4" class="st1" width="1.5" height="2.5"/>
						</g>
						<g>
							<rect x="21.6" y="16" class="st1" width="1.5" height="2.5"/>
							<polygon class="st1" points="23.1,23 23.1,20.5 21.6,20.5 21.6,21.5 20.6,21.5 20.6,23 				"/>
							<rect x="16.1" y="21.5" class="st1" width="2.5" height="1.5"/>
						</g>
						<g>
							<rect x="5.5" y="21.6" class="st1" width="2.5" height="1.5"/>
							<polygon class="st1" points="1,23.1 3.5,23.1 3.5,21.6 2.5,21.6 2.5,20.6 1,20.6 				"/>
							<rect x="1" y="16.1" class="st1" width="1.5" height="2.5"/>
						</g>
					</g>
				</g>
			</g>
			</svg>
		</div></div>
		`);
	
		select_locked.click(async function(){
			if ($('#select_locked .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) {
				$('#select_locked .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
				$('body').toggleClass('preventSelectDefinitelyNot', true);
				$('#tokens .lockedToken').draggable("disable");
				$('#tokens .lockedToken').removeClass("ui-state-disabled");	
			} else {
				$('#select_locked .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', true)
				$('body').toggleClass('preventSelectDefinitelyNot', false);
				$('#tokens .lockedToken').draggable("enable");
			}
		});
		if(defaultValues.selectLocked != undefined){
			select_locked.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.selectLocked); 
			$('body').toggleClass('preventSelectDefinitelyNot', !defaultValues.selectLocked);
			$('#tokens .lockedToken').draggable(!defaultValues.selectLocked ? "disable" : "enable");
			$('#tokens .lockedToken').toggleClass("ui-state-disabled", defaultValues.selectLocked);	
		}


		let pause_players = $(`<div id='pause_players' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Pause players'> 
		<div class="ddbc-tab-options__header-heading">
				<svg id='player-pause-svg' xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path d="M11.583 15.833V4.167H15v11.666Zm-6.583 0V4.167h3.417v11.666Z"/></svg>
				<svg id='player-play-svg' xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path d="M7 15.5v-11l8.5 5.5Zm1.521-5.521ZM8.5 12.75 12.75 10 8.5 7.25Z"/></svg>
		</div></div>
		`);

		pause_players.click(function(){
			pause_players.toggleClass('paused');
			window.MB.sendMessage("custom/myVTT/pausePlayer",{
				paused: pause_players.hasClass('paused')
			});
			if(pause_players.hasClass('paused')){
				let pausedIndicator = $(`
				<div class="dm-paused-indicator">
					<div class="paused-status-indicator__subtext">Game Paused for Players.</div>
					<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
				</div>
			`);
				$("body").append(pausedIndicator);
			}
			else{
				$(".dm-paused-indicator").remove();
			}
		});
		let avttS3FileShare = $(`<div id='aboveFileHostButton' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='AVTT File Hosting'> 
		<div class="ddbc-tab-options__header-heading">
				<span class="material-icons button-icon">folder</span>
		</div></div>
		`);
		avttS3FileShare.click(launchFilePicker);

		zoom_section.append(avttS3FileShare, select_locked, ping_center, pause_players);

	}


	let grid_snap_drawings = $(`<div id='grid_snap_drawings' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Grid Snap Most Tools'> 
	<div class="ddbc-tab-options__header-heading">
			<span style="font-size: 20px;" class="material-symbols-outlined">
				rebase_edit
			</span>
	</div></div>
	`);
	$('#grid_snap_drawings .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
	window.toggleDrawingSnap = false;
	grid_snap_drawings.click(async function(){
		if ($('#grid_snap_drawings .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) {
			$('#grid_snap_drawings .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
			window.toggleDrawingSnap = false;
		} else {
			$('#grid_snap_drawings .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', true)
			window.toggleDrawingSnap = true;
		}
	});
	if(defaultValues.snapTooltoGrid != undefined){
		grid_snap_drawings.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.snapTooltoGrid); 
		window.toggleDrawingSnap = defaultValues.snapTooltoGrid;
	}
	zoom_section.append(grid_snap_drawings)


	let selected_token_vision = $(`<div id='selected_token_vision' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='Selected Token Vision'> 
	<div class="ddbc-tab-options__header-heading">
			<svg version="1.1" id="selectedEyeSVG" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px" x="0px" y="0px"
				 viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
			<style type="text/css">
				#selected_token_vision .st0{fill:none;stroke:#000000;stroke-width:20;stroke-linecap:square;stroke-miterlimit:10;}
				#selected_token_vision .st1{fill:none;stroke:#000000;stroke-width:20;stroke-linecap:square;stroke-miterlimit:10;stroke-dasharray:70,70;}
			</style>
			<g>
				<path d="M681.9,382.8l-59.7-58.3C563,266.7,484.1,235,399.9,235s-163,31.8-222.2,89.5L118,382.8c-13.3,14.5-5.1,30,0,34.5
					l59.7,58.3c59.1,57.7,138,89.5,222.2,89.5s163-31.8,222.2-89.5l59.7-58.3C686.6,412.8,695.7,397.9,681.9,382.8L681.9,382.8z
					 M399.9,482.4c-45.5,0-82.4-37-82.4-82.4s37-82.4,82.4-82.4s82.4,37,82.4,82.4S445.4,482.4,399.9,482.4z M169.4,400l42.1-41.1
					c31.9-31.2,70.6-53.4,113-65.4c-33.3,23.7-55,62.6-55,106.4s21.7,82.8,55,106.4c-42.4-12-81.1-34.2-113-65.3L169.4,400L169.4,400z
					 M588.5,441.1c-31.9,31-70.6,53.2-113,65.3c33.3-23.7,55-62.6,55-106.4c0-43.9-21.7-82.8-55-106.4c42.4,12,81.1,34.2,113,65.4
					l42,41.1L588.5,441.1L588.5,441.1z"/>
			</g>
			<g>
				<g>
					<polyline class="st0" points="750,715 750,750 715,750 		"/>
					<line class="st1" x1="645" y1="750" x2="120" y2="750"/>
					<polyline class="st0" points="85,750 50,750 50,715 		"/>
					<line class="st1" x1="50" y1="645" x2="50" y2="120"/>
					<polyline class="st0" points="50,85 50,50 85,50 		"/>
					<line class="st1" x1="155" y1="50" x2="680" y2="50"/>
					<polyline class="st0" points="715,50 750,50 750,85 		"/>
					<line class="st1" x1="750" y1="155" x2="750" y2="680"/>
				</g>
			</g>
			</svg>
	</div></div>
	`);



	selected_token_vision.click(function(){
		if ($('#selected_token_vision .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) {
			$('#selected_token_vision .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
			window.SelectedTokenVision = false;
		} else {
			$('#selected_token_vision .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', true)
			window.SelectedTokenVision = true;
		}
		redraw_light();	
    if(window.DM && !window.SelectedTokenVision)
      do_check_token_visibility();
	});
	if(defaultValues.selectedTokenVision != undefined){
		selected_token_vision.find('.ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', defaultValues.selectedTokenVision); 
		window.SelectedTokenVision = defaultValues.selectedTokenVision;
	}
	zoom_section.append(selected_token_vision);


	let zoom_center = $("<div id='zoom_fit' class='ddbc-tab-options--layout-pill hasTooltip button-icon hideable' data-name='fit screen (0)'><div class='ddbc-tab-options__header-heading'><span class='material-icons button-icon'>fit_screen</span></div></div>");
	zoom_center.click(reset_zoom);
	zoom_section.append(zoom_center);

	let zoom_minus = $("<div id='zoom_minus' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon hideable' data-name='zoom out (-)'><span class='material-icons button-icon'>zoom_out</span></div></div>");

	zoom_minus.click(function() { throttledZoom(0.90, 0)});
	zoom_section.append(zoom_minus);

	let zoom_plus = $("<div id='zoom_plus' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon hideable' data-name='zoom in (+)'><span class='material-icons button-icon'>zoom_in</span></div></div>");
	zoom_plus.click(function() { throttledZoom(1.10, 0)});
	zoom_section.append(zoom_plus);

	let hide_interface = $(`<div id='hide_interface_button' class='ddbc-tab-options--layout-pill'><div class='ddbc-tab-options__header-heading hasTooltip button-icon' data-name='Unhide interface (shift+h)'><span class='material-icons md-16 button-icon'>visibility</span></div></div>`);
	hide_interface.css({
		display: "none",
		position: "absolute",
		opacity: 0.1,
		right: '0px',
		top: "-30px"
	});
	zoom_section.append(hide_interface);

	$(".avtt-sidebar-controls").append(zoom_section);
	if (window.DM || is_spectator_page()) {
		zoom_section.css("right","371px");
	} else {
		zoom_section.css("right","420px");
	}
}

/**
 * Show loading screen.
 *
 * The first time the screen loads, we cover it with an overlay to mask all the UI changes we do.
 * This builds and injects a nice loading indicator to inform the user that everything is fine.
 * See `Load.js` for the injection of the overlay.
 */
function init_loading_overlay_beholder() {

	if ($("#loading-overlay-beholder").length > 0) return;

	let loadingText = "One Moment While We Set The Scene...";
	if (is_characters_page()) {
		loadingText = "We'll Set The Scene When The DM Is Ready.";
	}
	let loadingIndicator = $(`
		<div id="loading-overlay-beholder">
			<div class="sidebar-panel-loading-indicator" style="padding:0px;border-radius:40px;">
				<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;margin-top:100px;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
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
}

/**
 * Initializes the help menu.
 */
function init_help_menu() {
	$('body').append(`
		<div id="help-container">
			<div id="help-menu-outside"></div>
			<div id="help-menu">
				<div class="help-tabs">
					<ul>
						<li class="active"><a href="#tab1"> Keyboard shortcuts</a></li>
						<li><a href="#tab19" class='popout' data-href="https://github.com/cyruzzo/AboveVTT/wiki" data-name='AboveVTT Wiki'>Wiki <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"></path></svg></a></li>
						<li><a href="#tab2">FAQ</a></li>
						<li><a href="#tab3">Scene Creation</a></li>
						<li><a href="#tab4">Player UI</a></li>
						<li><a href="#tab5">Fog, Light and Vision</a></li>
						<li><a href="#tab6">Sound</a></li>
						<li><a href="#tab7">Settings</a></li>
						<li><a href="#tab8">Tokens and Combat</a></li>
						<li><a href="#tab9">Map Manipulation</a></li>
						<li><a href="#tab10">Quick Start</a></li>
						<li><a href="#tab11">In-person tools</a></li>
						<li><a href="#tab12">Performance Suggestions</a></li>
						<!-- some unused numbers here for more tabs -->
						<li><a href="#tab20">Video Tutorial Playlist</a></li>
						<li><a href="#tab21">Get Help</a></li>		
						<li><a href="#tab22">Compatible Tools</a></li>
					</ul>
				</div>

				<section class="tabs-content">
					<div id="tab1">
						<h3>Keyboard Shortcuts</h3>
						<dl>
							<dt>SPACE</dt>
							<dd>Show/hide character sheet (players only)</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+SPACE</dt>
							<dd>Center Player Token (players only)</dd>
						</dl>
						<dl>
							<dt>${getCtrlKeyName()}+SPACE</dt>
							<dd>Center Current Turn Token</dd>
						</dl>
						<dl>
							<dt>Q</dt>
							<dd>Show/hide sidebar</dd>
						</dl>
						<dl>
							<dt>ESC</dt>
							<dd>Cancel button selections</dd>
						</dl>
						<dl>
							<dt>S</dt>
							<dd>Select tool</dd>
						</dl>
						<dl>
							<dt>R</dt>
							<dd>Ruler</dd>
						</dl>
						<dl>
							<dt>F</dt>
							<dd>Fog menu</dd>
						</dl>
						<dl>
							<dt>W</dt>
							<dd>Wall tool</dd>
						</dl>
						<dl>
							<dt>D</dt>
							<dd>Draw tool</dd>
						</dl>
						<dl>
							<dt>T</dt>
							<dd>Text tool</dd>
						</dl>
						<dl>
							<dt>A</dt>
							<dd>Area of effect menu</dd>
						</dl>
						<dl>
							<dt>C</dt>
							<dd>Combat tracker</dd>
						</dl>
						<dl>
							<dt>N</dt>
							<dd>Next creature in combat</dd>
						</dl>
						<dl>
							<dt>P</dt>
							<dd>Prev creature in combat</dd>
						</dl>
						<dl>
							<dt>- / ${getCtrlKeyName()}+Mouse Wheel Down</dt>
							<dd>Zoom out</dd>
						</dl>
						<dl>
							<dt>= / + / ${getCtrlKeyName()}+Mouse Wheel Up</dt>
							<dd>Zoom in</dd>
						</dl>
						<dl>
							<dt>1-9</dt>
							<dd>Add Custom Numkey Dice to Dice Pool</dd>
						</dl>
							<dt>${getModKeyName()}+1-9</dt>
							<dd>Remove Custom Numkey Dice from Dice Pool</dd>
						</dl>
						<dl>
							<dt>- (with Dice Pool or Mod adjuster visibile)</dt>
							<dd>Subtract from Roll Mod</dd>
						</dl>
						<dl>
							<dt>= / + (with Dice Pool or Mod adjuster visibile)</dt>
							<dd>Add to Roll Mod</dd>
						</dl>
						<dl>
							<dt>Enter</dt>
							<dd>Roll added dice pool</dd>
						</dl>
						<dl>
							<dt>${getModKeyName()} (held)</dt>
							<dd>Temporarily toggle grid snapping</dd>
						</dl>
						<dl>
							<dt>${getAltKeyName()} (held)</dt>
							<dd>Temporarily activate ruler</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+H</dt>
							<dd>Hide buttons from screen (spectator mode)</dd>
						</dl>
						<dl>
							<dt>${getModKeyName()}+C</dt>
							<dd>Copy Selected Token/Walls</dd>
						</dl>
						<dl>
							<dt>${getModKeyName()}+V</dt>
							<dd>Paste Selected Tokens/Walls</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+L</dt>
							<dd>Enable/Disable locked token interation (DM only)</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+V</dt>
							<dd>Temporary check token vision.</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+W</dt>
							<dd>Toggle always show walls. Will also show 'hidden icon' doors/windows.</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+E</dt>
							<dd>Toggle always show elevation. Will always show elevation areas.</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+S</dt>
							<dd>Toggle snap drawings to grid. This includes drawings from most menus - fog, draw, light, walls etc.</dd>
						</dl>
						<dl>
							<dt>Hold ${getModKeyName()} while using most tools</dt>
							<dd>Temporary toggle snap tools to grid on/off (opposite of the toggle set). This includes drawings from most menus - fog, draw, light, walls etc.</dd>
						</dl>
						<dl>
							<dt>B</dt>
							<dd>Open selected token statblock</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+B</dt>
							<dd>Popout selected token(s) statblocks. (Only works for statblocks that allow popout)</dd>
						</dl>
						<dl>
							<dt>H</dt>
							<dd>Hide/unhide selected tokens.</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+Click Token</dt>
							<dd>Select multiple tokens</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+Drag Token</dt>
							<dd>If token is grouped or multiple tokens selected just move the one token</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+Click Door/Window</dt>
							<dd>Quick toggle door/window locked</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+Click Portal</dt>
							<dd>Force recenter camera and instant teleport token for those receiving the message. (Always does this for those clicking the portal)</dd>
						</dl>
						<dl>
							<dt>${getModKeyName()}+A while edit wall points tool is selected</dt>
							<dd>Select all wall points</dd>
						</dl>
						<dl>
							<dt>Hold ${getShiftKeyName()} while selecting wall points with edit point tool</dt>
							<dd>Adds any selected points to already selected group of points.</dd>
						</dl>
						<dl>
							<dt>Hold ${getShiftKeyName()} while editting wall points</dt>
							<dd>Instead of moving all selected points, it will rescale all lines that have a point selected.</dd>
						</dl>
						<dl>
							<dt>${getModKeyName()}+click scenes/tokens while reordering (DM only)</dt>
							<dd>While reordering the scenes listing or token listing this will to add/remove scenes to multi-selection</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}+click scenes/tokens while reordering (DM only)</dt>
							<dd>While reordering the scenes listing this will add scenes between clicked scene and other selected scenes in the same folder to multi-selection</dd>
						</dl>
						<dl>
							<dt>UP/DOWN arrows</dt>
							<dd>Will cycle through fog & draw options if menu open</dd>
						</dl>
						<dl>
							<dt>${getShiftKeyName()}/${getModKeyName()} Click on Icon Rolls and Most Character/Extras/Monsters d20 Rolls</dt>
							<dd>Will roll with ADV/DIS respectively</dd>
						</dl>
						<dl>
							<dt>${getAltKeyName()} + ${getShiftKeyName()}/${getModKeyName()} Click on Icon Rolls and Most Character/Extras/Monsters d20 Rolls</dt>
							<dd>Will roll with Super ADV/DIS respectively</dd>
						</dl>
		
					</div>

					<div id="tab2" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true">
						<iframe src=''></iframe>
					</div>
					<div id="tab3" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.g7app6ltg7nq"></div>
					<div id="tab4" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.514yompiqqkv"></div>
					<div id="tab5" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.5s8va6pc895f"></div>
					<div id="tab6" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.j0fwkrx8203i"></div>
					<div id="tab7" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#kix.bqz5eec7dr2a"></div>
					<div id="tab8" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.vcs37mnw8lej"></div>
					<div id="tab9" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.l17lakiwxlm6"></div>
					<div id="tab10" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.it30rzhxilz3"></div>
					<div id="tab11" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.6jh5zmtqvn3f"></div>
					<div id="tab12" class='googledoc bookmark' data-src="https://docs.google.com/document/d/e/2PACX-1vRSJ6Izvldq5c9z_d-9-Maa8ng1SUK2mGSQWkPjtJip0cy9dxAwAug58AmT9zRtJmiUx5Vhkp7hATSt/pub?embedded=true#h.mob2z6z5azn2"></div>

					<div id="tab20">
						<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/videoseries?list=PLW0tvNe3gIM00xQCReTWi8CPrXBJyDQmG&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
					</div>
					<div id="tab21">
						AboveVTT is an open source project. The developers build it in their free time, and rely on users to report and troubleshoot bugs. If you're experiencing a bug, here are a few options: 
						<ul id="help-error-container">
							<li><a href="https://github.com/cyruzzo/AboveVTT/issues?q=is%3Aissue+label%3Abug" target="_blank" style="text-decoration:underline;color:-webkit-link;">Check Github</a> (Use the search/filter bar at the top of the screen)</li>
							<li><a href="https://discord.gg/cMkYKqGzRh" target="_blank" style="text-decoration:underline;color:-webkit-link;">Join the Discord</a> The Discord community is very active. Search for your issue, and if you don't find anything, ask in the #support room.</li>
							<li><a href="https://www.reddit.com/r/AboveVTT/" target="_blank" style="text-decoration:underline;color:-webkit-link;">Check the subreddit</a> The Subreddit is less active, but there's a lot of good info there.</li>
						</ul>
						<button id="help-error-container-copy-logs-button">Copy logs to clipboard</button><span class="material-symbols-outlined" style="color:red;font-size: 40px;top: 16px;position: relative;">line_start_arrow_notch</span>Use this button to share logs with developers!
					</div>
					<div id="tab22">
						<div class='help-compatible-tool'>
							<a href='https://dddice.com' target="_blank">
								<img class='compatible-tool-icon dddice-icon' src='https://abovevtt-assets.s3.eu-central-1.amazonaws.com/compatible-tools/logo-light-fs8.png'/>
								<span class='compatible-tool-title'>dddice</span>
							</a>
							<span class='compatible-tool-desc'>A multiplayer dice roller that allows you to roll, create, and collect 3D dice with your party or community.</span>
						</div>
						<div class='help-compatible-tool'>
							<a href='https://www.dungeonalchemist.com/' target="_blank">
								<img class='compatible-tool-icon da-icon' src='https://abovevtt-assets.s3.eu-central-1.amazonaws.com/compatible-tools/DungeonAlchemist-Logo-Softshadow-0907.png'/>
								<span class='compatible-tool-title'>Dungeon Alchemist</span>
							</a>
							<span class='compatible-tool-desc'>An AI-powered map-making application that enables you to make high-quality content fast! Export maps as a UVTT file to import maps, light and walls into AboveVTT.</span>
						</div>
					</div>

				</section>
			</div>
		</div>
	`);

	$('#help-container').fadeOut(0);


	$('.help-tabs a').on('click', function() {

		if($(this).hasClass('popout')){
			window.open($(this).attr('data-href'), $(this).attr('data-name'), 'width=800,height=600');
			return;
		}
		$('.help-tabs li').removeClass('active');
		$(this).parent().addClass('active');
		let currentTab = $(this).attr('href');
		$('.tabs-content>div').hide();
		if($(currentTab).hasClass('bookmark')){
			$('.tabs-content>div#tab2').show();
			let src = $(currentTab).attr('data-src');
			$('.tabs-content>div#tab2').find('iframe').remove();
			$('.tabs-content>div#tab2').append(`<iframe src='${window.EXTENSION_PATH}iframe.html?src=${encodeURIComponent(src)}'
						allowfullscreen
						webkitallowfullscreen
						mozallowfullscreen></iframe>`)
		}

		$(currentTab).show();
		return false;
	});

	$('#help-menu-outside').on('click', function() {
		$('#help-container').fadeOut(200);
		delete window.logSnapshot;
	});

	$("#help_button").click(function(e) {
		// if a user is opening the help menu to grab logs, we want to capture logs as close to the event as possible.
		window.logSnapshot = process_monitored_logs();
		$('#help-container').fadeIn(200);
	});

	$("#help-error-container-copy-logs-button").on('click', function() {
		copy_to_clipboard(window.logSnapshot);
	});
}

/**
 * Load dice configuration from DDB.
 */
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
	diceRoll.name = displayName == true ? 'THE DM' : displayName;
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
		let choppedExpression = expression;
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

/**
 * Gathers browser information from User Agent.
 * @returns Object
 */
function get_browser() {
	let ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
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
		safari: M[0] == "Safari"
	};
}

/**
 * When playing on the characters page, this will show/hide the character sheet.
 * When not on the character page, `open_player_sheet` and `close_player_sheet` are used.
 */
function toggle_player_sheet() {
	if (is_player_sheet_open()) {
		hide_player_sheet();
	} else {
		show_player_sheet();
	}
}

/**
 * When playing on the characters page, this will tell you if the character sheet is open.
 * When not on the character page, `open_player_sheet` and `close_player_sheet` are used.
 */
function is_player_sheet_open() {
	return $(".ct-character-sheet__inner").css("z-index") > 0;
}

/**
 * When playing on the characters page, this will show the character sheet.
 * When not on the character page, `open_player_sheet` is used.
 */
function show_player_sheet() {
	$("#character-tools-target").css({
		"display": "",
	});
	$(".ct-character-sheet__inner, [class*='styles_mobileNav']>div>button[class*='styles_navToggle']").css({
		"display": "",
		"z-index": 21000
	});
	$("[class*='styles_mobileNav']").toggleClass('visibleMobileNav', true);
	$(".site-bar").css({
		"display": "",
		"z-index": 21000
	});
	if (window.innerWidth > 1540) { // DDB resize point + sidebar width
		// the reactive nature of the character sheet starts messing with our thin layout so don't allow the thin layout on smaller screens. Let DDB do their condensed/tablet/mobile view instead
		$("#sheet_resize_button").show();
	} else {
		$("#sheet_resize_button").hide();
	}
	$('#sheet_button').find(".ddbc-tab-options__header-heading").addClass("ddbc-tab-options__header-heading--is-active");
	if (window.innerWidth < 1024) {
		window.reopenPanel = is_sidebar_visible();
		hide_sidebar();
	}
}

/**
 * When playing on the characters page, this will hide the character sheet.
 * When not on the characters page, `close_player_sheet` is used.
 */
function hide_player_sheet() {
	$("#character-tools-target").css({
		"display": "none",
	});
	$(".ct-character-sheet__inner, [class*='styles_mobileNav']>div>button[class*='styles_navToggle']").css({
		"display": "none",
		"z-index": -1
	});
	$("[class*='styles_mobileNav']").toggleClass('visibleMobileNav', false);
	if ($(".site-bar #lock_display").length == 0) {
		// don't hide it if the DM is watching
		$(".site-bar").css({
			"display": "none",
			"z-index": -1
		});
	}
	$("#sheet_resize_button").hide();
	$('#sheet_button').find(".ddbc-tab-options__header-heading").removeClass("ddbc-tab-options__header-heading--is-active");
	
	if (window.innerWidth < 1024 && window.reopenPanel == true){
		delete window.reopenPanel;
		show_sidebar();
	}
}
function minimize_player_sheet(){
	$('#sheet').dblclick()
}

/**
 * When playing on the characters page, this will toggle the width of the character sheet.
 * When not on the characters page, `init_sheet` injects a button to handle the iframe resizing.
 */
function toggle_player_sheet_size() {
	if (is_player_sheet_full_width()) {
		player_sheet_layout = "thin";
	} else {
		player_sheet_layout = "full";
	}
	reposition_player_sheet();
}

/**
 * If the window size changes, or if they open peerVideo, or anything like that, we want to update the character sheet css without toggling the size.
 * This is explicitly the opposite behavior as toggle_player_sheet_size().
 */
function reposition_player_sheet() {

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

var player_sheet_layout = "full"; // or thin
/**
 * When playing on the characters page, this will tell you if the character sheet is full width or thin.
 * When not on the characters page, `init_sheet` injects a button to handle the iframe resizing.
 */
function is_player_sheet_full_width() {
	return player_sheet_layout == "full";
}

/**
 * When playing on the characters page, this will resize the character sheet to full width.
 * When not on the characters page, `init_sheet` injects a button to handle the iframe resizing.
 */
function resize_player_sheet_full_width() {
	reset_character_sheet_css();
	player_sheet_layout = "full";
	adjust_site_bar();
}

/**
 * When playing on the characters page, this will resize the character sheet to a thinner version.
 * It rearranges a lot of the HTML to handle the thinner width.
 * When not on the characters page, `init_sheet` injects a button to handle the iframe resizing.
 */
function resize_player_sheet_thin() {
	reset_character_sheet_css();
	if (window.innerWidth < 1024) {
		console.log("resize_player_sheet_thin calling is setting full, and calling reposition_player_sheet");
		player_sheet_layout = "full";
		reposition_player_sheet();
		return;
	}

	let sheetWidth = "620px";
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
		sheetWidth = "550px";
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

	$(".ct-character-header-desktop__group--short-rest").css({ "position": "absolute", "left": "auto", "top": restTop, "right": "130px" });
	$(".ct-character-header-desktop__group--long-rest").css({ "position": "absolute", "left": "auto", "top": restTop, "right": "20px" });
	$(".ct-character-header-desktop__group--short-rest .ct-character-header-desktop__button").css({ "padding": "2px 10px", "margin": "0px" });
	$(".ct-character-header-desktop__group--long-rest .ct-character-header-desktop__button").css({ "padding": "2px 10px", "margin": "0px" });
	$(".ct-character-header-desktop__group-tidbits").css({ "width": "60%" });


	$("[class*='styles_campaignSummary']").closest('[class*="styles_container"]').css({ "position": "relative", "top": "15px", "left": "auto", "right": "-10px", "margin-right": "0px" });
	let height = `${$.position?.scrollbarWidth() ? 512 - $.position.scrollbarWidth() : 512}px`
	let searchableHeight = `${$.position?.scrollbarWidth() ? 563 - $.position.scrollbarWidth() : 563}px`
  let containerHeight = `${$.position?.scrollbarWidth() ? 563 - $.position.scrollbarWidth() : 563}px`
  $('.ct-primary-box').css({
    '--content-height': height,
    '--container-height': containerHeight,
    '--searchable-height': searchableHeight,
    "height": "610px",
  });


	player_sheet_layout = "thin";

	adjust_site_bar();

}

/**
 * When playing on the characters page, this will clear any adjustments made by either resize functions,
 * leaving the HTML at a clean slate so we can cleanly adjust to either full width or thin.
 */
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

	$("[class*='styles_campaignSummary']").closest('[class*="styles_container"]').removeAttr( 'style' );
	$(".ct-primary-box").removeAttr( 'style' );
	$(".ddbc-tab-options__content").removeAttr( 'style' );

	$(".ct-character-sheet__inner").css({"visibility": "visible", "overflow-x": "hidden"});

	$(".ddbc-character-tidbits__menu-callout").css({"visibility": "hidden", "width": "0px", "height": "0px"});
	let maxHeight = window.innerHeight - 26;
	if($.position?.scrollbarWidth()){
		maxHeight -= $.position.scrollbarWidth();
	}

	if ($("#peerVideo_container").length > 0) {
		maxHeight -= $("#peerVideo_container").height();
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

/**
 * Check if sidebar is visible.
 * @returns Boolean
 */
function is_sidebar_visible() {
	return $("#hide_rightpanel").attr('data-visible') == 1;
}

/**
 * This will show/hide the sidebar regardless of which page we are playing on.
 */
function toggle_sidebar_visibility() {
	if (is_sidebar_visible() || (!window.DM && !is_spectator_page() && window.innerWidth < 1024 && $(`[class*='styles_mobileNav']>div`).length==0)) {
			hide_sidebar();
		} else {
			show_sidebar();
		}
}

/**
 * This will show the sidebar regardless of which page we are playing on.
 * It will also adjust the position of the character sheet .
 */
function show_sidebar(dispatchResize = true) {

	let toggleButton = $("#hide_rightpanel");
	toggleButton.addClass("point-right").removeClass("point-left");
	toggleButton.attr('data-visible', 1);
	window.showPanel = true;
	if (is_characters_page() && window.innerWidth < 1024) {
		if($(`[class*='styles_mobileNav']>div`).length > 0)
			$(`[class*='styles_mobileNav']>button`).click();
	} else {
		let sidebar = is_characters_page() ? $(".ct-sidebar__portal") : $(".sidebar--right");
		sidebar.css("transform", "translateX(0px)");
		$('#combat_carousel_container.tracker-list').toggleClass('sidebarClosed', false)
	}

	if (is_characters_page()) {
		reposition_player_sheet();
	} else {
		$("#sheet").removeClass("sidebar_hidden");
	}
	$('canvas.dice-rolling-panel__container, .roll-mod-container').css('--sidebar-width', '340px');
	$('canvas.streamer-canvas').css('--sidebar-width', '340px');
	if(dispatchResize)
		window.dispatchEvent(new Event('resize'));
	addGamelogPopoutButton()
}

window.childWindows = {};

function addGamelogPopoutButton(){
	$(`.glc-game-log>[class*='Container-Flex']>[class*='Title'] .popout-button`).remove();
	const gamelog_popout=$('<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>');
	let windowTarget = `https://dndbeyond.com/campaigns/${window.find_game_id()}?id=${window.PLAYER_ID}&player_name=${window.PLAYER_NAME}&popoutgamelog=true`

	gamelog_popout.off().on("click",function(){
		popoutWindow("Gamelog", $("<div/>"), 400, 800, windowTarget);
		// this seems to never go away for me so I just disabled it for now
		// let beholderIndicator = build_combat_tracker_loading_indicator("One moment while we load the gamelog");
		// setTimeout(function() {
		// 	$(childWindows["Gamelog"].document).find("body").append(beholderIndicator);
		// }, 1000)
		childWindows["Gamelog"].addEventListener('load', popoutGamelogCleanup)
		childWindows["Gamelog"].pcs = window.pcs;
		childWindows["Gamelog"].TOKEN_OBJECTS = window.TOKEN_OBJECTS;
		childWindows["Gamelog"].ddbConfigJson = window.ddbConfigJson
		childWindows["Gamelog"].gameId = window.gameId;

	});
	
	const gamelogTitle = $(`.glc-game-log>[class*='Container-Flex']>[class*='Title']`);
	if(gamelogTitle.children('[class*="-Flex"]').length>0){
		gamelogTitle.children('[class*="-Flex"]').before(gamelog_popout);
	}
	else{
		gamelogTitle.append(gamelog_popout);
	}
	
}
// This will popout the selector and it's children. Use a unique name for windows you want to open seperately. If you want to override an open window use the same name.
function popoutWindow(name, cloneSelector, width=400, height=800, windowTarget=``){
	name = name.replace(/(\r\n|\n|\r)/gm, "").trim();
	const params = `scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no,
width=${width},height=${height},left=100,top=100`;
	childWindows[name] = window.open(windowTarget, name, params);
	childWindows[name].onbeforeunload = function(){
		closePopout(name);
	}
	function checkTitle() {
		if(childWindows[name].document && childWindows[name].document?.title != name){    
	    childWindows[name].document.title = name; 
	    setTimeout(checkTitle, 1000); 
	  }
	}	

	checkTitle();

	$(childWindows[name].document).find('body, head').empty();
	$(childWindows[name].document).find('body').append(cloneSelector.clone(true,true));
	$(childWindows[name].document).find('head').append($('link, style').clone());
	$(childWindows[name].document).find('a[href^="/"]').each(function() {
        this.href = `https://dndbeyond.com${this.getAttribute("href")}`;
	});
	return childWindows[name];
}
function popoutGamelogCleanup(){
	$(childWindows["Gamelog"].document).find("#popoutGamelogCleanup").remove();
	$(childWindows["Gamelog"].document).find('head').append($('link, style').clone());
	$(childWindows["Gamelog"].document).find('head').append(`<style id='popoutGamelogCleanup'>
		body{
			overflow: hidden !important;
		}
		.sidebar__inner,
		.sidebar,
		.sidebar__pane-content,
		.glc-game-log{
		    width: 100% !important;
		    max-width: 100% !important;
		}
		.mfp-wrap {
	   		width: 100%;
	   		z-index: 100000;
		}
		.ddb-campaigns-detail-gamelog {
			visibility: hidden;
		}
		img.magnify{
			pointer-events:none;
		}
		.encounter-builder .sidebar {
		    top: 0 !important;
		    height: 100% !important;
		}
		.body-rpgcampaign:not(.encounter-builder) select#chat-language {
	    bottom:0px;
	    right: 20px;
		}
	</style>`);
	$(childWindows["Gamelog"].document).find(".gamelog-button, button[class*='gamelog-button']").click();
	$(childWindows["Gamelog"].document).find(".sidebar__control-group--lock button").click();
	removeFromPopoutWindow("Gamelog", ".dice-roller");
	removeFromPopoutWindow("Gamelog", ".sidebar-panel-content:not('.glc-game-log')");
	removeFromPopoutWindow("Gamelog", ".chat-text-wrapper");
	removeFromPopoutWindow("Gamelog", ".avtt-sidebar-controls");
	removeFromPopoutWindow("Gamelog", ".sidebar__control");
	$(childWindows["Gamelog"].document).find("body>div>.sidebar").parent().toggleClass("gamelogcontainer", true);
	let gamelogMessageBroker = $(childWindows["Gamelog"].document).find(".ddb-campaigns-detail-gamelog").clone(true, true)
	removeFromPopoutWindow("Gamelog", "body>*:not(.gamelogcontainer):not(.sidebar-panel-loading-indicator)");
	removeFromPopoutWindow("Gamelog", ".chat-text-wrapper");
	removeFromPopoutWindow("Gamelog", "iframe");
	$(childWindows["Gamelog"].document).find("body").append(gamelogMessageBroker);
	$(childWindows["Gamelog"].document).find(".glc-game-log").append($(".chat-text-wrapper").clone(true, true));
	$(childWindows["Gamelog"].document).find(".glc-game-log").append($("#chat-language").clone(true, true));

	$(childWindows["Gamelog"].document).find("#chat-language").off('change.value').on('change.value', function(){
		$("#chat-language").val($(this).val());
	})
	setTimeout(function(){removeFromPopoutWindow("Gamelog", "body>.sidebar-panel-loading-indicator")}, 200);
}
function updatePopoutWindow(name, cloneSelector){
	name = name.replace(/(\r\n|\n|\r)/gm, "").trim();
	if(!childWindows[name])
		return;
	$(childWindows[name].document).find('body').empty();
	$(childWindows[name].document).find('body').append(cloneSelector.clone(true,true));
	$(childWindows[name].document).find('a[href^="/"]').each(function() {
        this.href = `https://dndbeyond.com${this.getAttribute("href")}`;
	});
	return childWindows[name];
}
function removeFromPopoutWindow(name, selector){
	name = name.replace(/(\r\n|\n|\r)/gm, "").trim();
	if(!childWindows[name])
		return;
	$(childWindows[name].document).find(selector).remove();
	return childWindows[name];
}
function closePopout(name){
	if(childWindows[name]){
		childWindows[name].close();
		delete childWindows[name];
	}
}
/**
 * This will hide the sidebar regardless of which page we are playing on.
 * It will also adjust the position of the character sheet .
 */
function hide_sidebar(triggerResize = true) {
	let toggleButton = $("#hide_rightpanel");
	toggleButton.addClass("point-left").removeClass("point-right");
	toggleButton.attr('data-visible', 0);
	window.showPanel = false;
	if (is_characters_page() && window.innerWidth < 1024) {
		if($(`[class*='styles_mobileNav']>div`).length == 0)
			$(`[class*='styles_mobileNav']>button`).click();
		
	} else {
		let sidebar = is_characters_page() ? $(".ct-sidebar__portal") : $(".sidebar--right");
		sidebar.css("transform", "translateX(340px)");
		$('#combat_carousel_container.tracker-list').toggleClass('sidebarClosed', true)
	}

	if (is_characters_page()) {
		reposition_player_sheet();
	} else {
		$("#sheet").addClass("sidebar_hidden");
	}
	$('canvas.dice-rolling-panel__container, .roll-mod-container').css('--sidebar-width', '0px');
	$('canvas.streamer-canvas').css('--sidebar-width', '0px');
	if(triggerResize)
		window.dispatchEvent(new Event('resize'));
}

/**
 * Adjusts the sidebar size.
 * @returns void
 */
function adjust_site_bar() {
	if (!is_characters_page()) {
		return;
	}

	let fullWidth = "100%";
	if (!is_player_sheet_full_width()) {
		let sheetWidth =  window.innerWidth < 1200 ? 550 : 620;
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

