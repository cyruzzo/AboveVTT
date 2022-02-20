
function create_jitsi_button() {
	window.gameId = $("#message-broker-client").attr("data-gameId");

	b = $("<button id='jitsi_switch' class='hasTooltip button-icon hideable' data-name='Connect video call'><span>VIDEO</span><span class='material-icons button-icon'>video_call</span></button>");
	b.css("position", "fixed");
	b.css("bottom", "3px");
	b.css("left", "3px");
	b.css("gap", "6px");
	b.css("display", "inline-flex");
	b.css("z-index", 9999);
	b.css("font-size", 15);
	$("body").append(b);

	b.click(function () {
		$(this).remove();
		init_jitsi_box();
	});
}

function init_jitsi(tileLayout) {
	const domain = 'meet.jit.si';
	const options = {
		roomName: 'aboveVTT-' + window.gameId,
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
	window.jitsiAPI = new JitsiMeetExternalAPI(domain, options);
	init_layout(tileLayout);
}

function init_layout(tileLayout) {
	function once() {
		window.jitsiAPI.removeListener('videoConferenceJoined', once);
		window.jitsiAPI.executeCommand(`setTileView`, tileLayout);
	}
	window.jitsiAPI.addEventListener('videoConferenceJoined', once);
}

function init_jitsi_popout() {
	window.jitsiAPI.dispose()
	$("#meet").remove();
	pop = window.open("", "", "height=1000,width=1000,menubar=no,status=no,toolbar=no");
	pop.onbeforeunload = init_jitsi_box;
	pop.document.body.style.margin = '0px';
	pop.document.body.style.padding = '0px';
	pop.document.body.id = 'jitsi_container';
	pop.document.title = 'Above VTT';
	pop.window.gameId = window.gameId;

	load = document.createElement('script');
	load.src = window.EXTENSION_PATH+ 'jitsi_external_api.js'; // NOW WE LOAD ID FROM THE EXTENSION, NOT FROM http://

	load.onload = function () {
		script = document.createElement('script');
		script.innerHTML = [
			init_jitsi.toString(),
			init_layout.toString(),
			"init_jitsi(true)",
		].join(';\n');
		pop.document.head.appendChild(script);
	};
	pop.document.head.appendChild(load);
}

function init_jitsi_box() {
	jitsi_box = $(`
		<div id="meet">
		<button id="jitsi_switch" class="hasTooltip button-icon" data-name="Fullscreen (v)">
			<span class="material-icons button-icon">
				fullscreen
			</span>
		</button>
		<button id="jitsi_close" class="hasTooltip button-icon" data-name="Disconnect">
			<span class="material-icons button-icon">
				cancel
			</span>
		</button>
		<button id="jitsi_pop" class="hasTooltip button-icon" data-name="Pop out">
			<span class="material-icons button-icon">
				north_east
			</span>
		</button>
		<div id="jitsi_container" style="width: 100%; height: 100%;"></div>
		</div>`
	);

	jitsi_box.css("z-index", "100");
	$("#site").append(jitsi_box);
	$("#jitsi_switch").css("position", "absolute").css("top", 0).css("left", 0);
	$("#jitsi_switch").click(jitsi_switch);
	$("#jitsi_close").css("position", "absolute").css("top", 0).css("left", "64px");

	$("#jitsi_close").click(
		function () {
			$("#meet").remove();
			create_jitsi_button();
		}
	);

	$("#jitsi_pop").css("position", "absolute").css("top", 0).css("left", "32px");
	$("#jitsi_pop").click(init_jitsi_popout);

	init_jitsi(false);
	jitsi_bottom();
}

function jitsi_modal() {
	$("#meet").css("position", "fixed").css("top", "100px").css("height", "80%").css("left", "50px").css("width", "75%");
	window.tile_desired = true;
	window.jitsiAPI.executeCommand(`setTileView`, true);
	$("span", $("#jitsi_switch")).text("fullscreen_exit");
	$("#jitsi_switch").attr("data-name", "Exit fullscreen (v)");
}

function jitsi_bottom() {
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");
	window.tile_desired = false;
	window.jitsiAPI.executeCommand(`setTileView`, false);
	$("span", $("#jitsi_switch")).text("fullscreen");
	$("#jitsi_switch").attr("data-name", "Fullscreen (v)");
}

function jitsi_switch() {
	if (window.tile_desired == 0)
		jitsi_modal();
	else
		jitsi_bottom();
}

