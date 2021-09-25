
function create_jitsi_button() {
	b = $("<button id='jitsi_switch' class='hasTooltip button-icon hideable' data-name='Connect video call'><span>VIDEO</span><span class='material-icons button-icon'>video_call</span></button>");
	b.css("position", "fixed");
	b.css("bottom", "3px");
	b.css("left", "3px");
	b.css("gap", "6px");
	b.css("display", "inline-flex");
	b.css("z-index", 9999);
	$("body").append(b);

	b.click(function() {
		$(this).remove();
		init_jitsi();
	});
}


function init_jitsi() {

	jitsi_box = $("<div id='meet'><button id='jitsi_switch' class='hasTooltip button-icon' data-name='Fullscreen (v)'><span class='material-icons button-icon'>fullscreen</span></button><button id='jitsi_close' class='hasTooltip button-icon' data-name='Disconnect'><span class='material-icons button-icon'>cancel</span></button><div id='jitsi_container' style='width:100%;height:100%;'></div></div>");
	jitsi_box.css("z-index", "100");
	$("#site").append(jitsi_box);
	$("#jitsi_switch").css("position", "absolute").css("top", 0).css("left", 0);
	$("#jitsi_switch").click(jitsi_switch);
	$("#jitsi_close").css("position", "absolute").css("top", 0).css("left", "32px");

	$("#jitsi_close").click(
		function() {
			$("#meet").remove();
			create_jitsi_button();
		}
	);


	gameid = $("#message-broker-client").attr("data-gameId");
	const domain = 'meet.jit.si';
	const options = {
		roomName: 'aboveVTT-' + gameid,
		width: '100%',
		height: '100%',
		parentNode: document.querySelector('#jitsi_container'),

		userInfo: {
			displayName: window.PLAYER_NAME,
		},
		configOverwrite: {
			prejoinPageEnabled: false,
			startWithAudioMuted: true,
			toolbarButtons: [
				"camera",
				"desktop",
				"microphone",
				"select-background",
				"settings",
				"shareaudio",
				"tileview",
				"videoquality"
			],
		},
		interfaceConfigOverwrite: {
			DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
			DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
			INITIAL_TOOLBAR_TIMEOUT: 500,
			SHOW_CHROME_EXTENSION_BANNER: false,
			TOOLBAR_TIMEOUT: 500,
			VERTICAL_FILMSTRIP: false
		},
	};
	api = new JitsiMeetExternalAPI(domain, options);
	window.jitsiAPI = api;
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");

	/* You can not execute any commands right after you instantiate the jitsi client
	and there is really no way to wait for the client to be ready. A workaround is to
	create a one time use handler just for startup, to render the pane and set the tile
	layout, attached to the subjectChange event, which by chance is almost the last thing
	the client does before being considered ready. After which, commands can be executed.
	*/
	api.addEventListener('subjectChange', jitsi_startup)
}

function jitsi_startup() {
	window.jitsiAPI.removeListener('subjectChange', jitsi_startup);
	jitsi_bottom()
}

function jitsi_modal() {
	$("#meet").css("position", "fixed").css("top", "100px").css("height", "80%").css("left", "50px").css("width", "75%");
	window.tile_desired = true;
	window.jitsiAPI.executeCommand(`setTileView`, true);
	$("span", $("#jitsi_switch")).text("fullscreen_exit");
	$("#jitsi_switch").attr("data-name","Exit fullscreen (v)");
}

function jitsi_bottom() {
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");
	window.tile_desired = false;
	window.jitsiAPI.executeCommand(`setTileView`, false);
	$("span", $("#jitsi_switch")).text("fullscreen");
	$("#jitsi_switch").attr("data-name","Fullscreen (v)");
}

function jitsi_switch() {
	if (window.tile_desired == 0)
		jitsi_modal();
	else
		jitsi_bottom();
}

function add_hide_self_button()
{
	let hideSelfButton = $(`<div id='vtt_jitsi_buttons'><button id='jitsi_hide_self_view' class='hasTooltip button-icon jitsi-internal-button' data-name='Hide Self View'><img id='hide_self_view_img' src="${window.EXTENSION_PATH + "assets/hide_self_view.png"}" class='jitsi-internal-image ' /></button></div>`);
	$("#layout_wrapper").append(hideSelfButton);
	$("#vtt_jitsi_buttons").css("position", "absolute").css("top", "0px").css("left", "64px")
	$("#jitsi_hide_self_view").click(
	function() {
		let selfView = $("#localVideo_container");
		let selfViewWrapper = $("#localVideoWrapper");
		if(selfView.is(":visible"))
		{
			selfView.hide();
			let hiddenPanel = $("<div id='hide_self_view_panel' class='jitsi-self-view-panel'>Self View Hidden</div>");
			selfViewWrapper.append(hiddenPanel);
			$("img", this).attr("src", window.EXTENSION_PATH + "assets/show_self_view.png");
			$("#jitsi_hide_self_view").attr("data-name","Show Self View");
			
		}
		else
		{
			selfView.show();
			$("#hide_self_view_panel").remove();
			$("img", this).attr("src", window.EXTENSION_PATH + "assets/hide_self_view.png");
			$("#jitsi_hide_self_view").attr("data-name","Hide Self View");
		}
	});	
}


