
function create_jitsi_button() {
	b = $("<button>CONNECT VIDEO</button>");
	b.css("position", "fixed");
	b.css("bottom", 0);
	b.css("left", 0);
	b.css("z-index", 9999);
	$("body").append(b);

	b.click(function() {
		$(this).remove();
		init_jitsi();
	});
}


function init_jitsi() {

	jitsi_box = $("<div id='meet'><button id='jitsi_switch'>SW</button><button id='jitsi_close'>X</button><div id='jitsi_container' style='width:100%;height:100%;'></div></div>");
	jitsi_box.css("z-index", "100");
	$("#site").append(jitsi_box);
	$("#jitsi_switch").css("position", "absolute").css("top", 0).css("left", 0);
	$("#jitsi_switch").click(jitsi_switch);
	$("#jitsi_close").css("position", "absolute").css("top", 0).css("left", ($("#jitsi_switch").width() + 50) + "px");

	$("#jitsi_close").click(
		function() {
			$("#meet").remove();
			create_jitsi_button();
		}
	);


	gameid = $("#message-broker-lib").attr("data-gameId");
	const domain = 'meet.jit.si';
	const options = {
		roomName: 'aboveVTT-' + gameid,
		width: '100%',
		height: '100%',
		parentNode: document.querySelector('#jitsi_container'),

		userInfo: {
			displayName: "user" + getRandomInt(1000, 1999),
		},
		configOverwrite: {
			prejoinPageEnabled: false,
			startWithAudioMuted: true,
		},
		interfaceConfigOverwrite: {
			TOOLBAR_BUTTONS: ["microphone", "camera", "settings"],
			VERTICAL_FILMSTRIP: false,
			filmStripOnly: true,
			DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
			DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
			TOOLBAR_TIMEOUT: 500,
			INITIAL_TOOLBAR_TIMEOUT: 500,
			SHOW_CHROME_EXTENSION_BANNER: false

		},
	};
	api = new JitsiMeetExternalAPI(domain, options);
	window.jitsiAPI = api;
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");
	window.tile_desired = false;
	api.addEventListener("tileViewChanged", jitsi_tile_listener);
	setTimeout(jitsi_bottom, 10000)
}


function jitsi_tile_listener(event) {
	console.log("jitsi_tile_listener status" + event.enabled);
	window.jitsiAPI.removeEventListener("tileViewChanged", jitsi_tile_listener);
	if (event.enabled != window.tile_desired)
		window.jitsiAPI.executeCommand(`toggleTileView`);
	setTimeout(function() { window.jitsiAPI.addEventListener("tileViewChanged", jitsi_tile_listener); }, 1000); // BUGGY AND HACKY
}

function jitsi_modal() {
	$("#meet").css("position", "fixed").css("top", "100px").css("height", "80%").css("left", "250px").css("width", "900px");
	window.tile_desired = true;
	window.jitsiAPI.executeCommand(`toggleTileView`);
}

function jitsi_bottom() {
	console.log("jitsi to bottom");
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");
	window.tile_desired = false;
	//window.jitsiAPI.setLargeVideoParticipant(0);
	window.jitsiAPI.executeCommand(`toggleTileView`);
}

function jitsi_switch() {
	if (window.tile_desired == 0)
		jitsi_modal();
	else
		jitsi_bottom();
}

