
function create_jitsi_button() {

	b = $("<div id='jitsi_switch' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Connect video call'><div class='ddbc-tab-options__header-heading'><span>VIDEO</span><span class='material-icons button-icon' style='margin: -3px 0px -3px 3px'>video_call</span></div></div>");
	b.css("position", "fixed");
	b.css("bottom", "3px");
	b.css("left", "3px");
	b.css("gap", "6px");
	b.css("display", "inline-flex");
	b.css("z-index", 9999);
	$("body").append(b);

	b.click(function () {
		$(this).remove();
		init_jitsi_box();
		reposition_player_sheet();
	});
}

function init_jitsi(tileLayout) {
	/* Removed from manifest since the servers we used were no longer public access. Will implement it again if we find a proper public server or find another option.
   	This is required in the manifest for our layout if we do find a working server.

   	{
      "matches":    ["https://[jisti-server-here]/aboveVTT-*?bottom_layout=true*"],
      "css":        ["jitsifix.css"],
      "all_frames": true
   	}*/
	const domain = '';//jitsi server domain here - removed as the servers we were using are no longer public unless members (both main sites and other public server we tried);
	const options = {
		roomName: 'aboveVTT-' + find_game_id(),
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
			disableDeepLinking: true,
		},
		interfaceConfigOverwrite: {
			DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
			DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
			INITIAL_TOOLBAR_TIMEOUT: 500,
			SHOW_CHROME_EXTENSION_BANNER: false,
			TOOLBAR_TIMEOUT: 500,
			bottom_layout: !tileLayout 
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
	pop.window.gameId = find_game_id();

	load = document.createElement('script');
	load.src = window.EXTENSION_PATH+ 'jitsi_external_api.js'; // NOW WE LOAD ID FROM THE EXTENSION, NOT FROM http://

	load.onload = function () {
		script = document.createElement('script');
		script.innerHTML = [
			init_jitsi.toString(),
			init_layout.toString(),
			"var find_game_id=()=> '" + find_game_id() +"'", // redefine find_game_id in the jitsi popout window context
			"init_jitsi(true)",
		].join(';\n');
		pop.document.head.appendChild(script);
	};
	pop.document.head.appendChild(load);
}

function init_jitsi_box() {
	/*jitsi_box = $(`
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
	);*/

	jitsi_box = $(`  
		<div class="peervideo-entry-modal" id="peervideo-entry-modal">
		    <div class="video-meet-area">

		        <!-- Local Video Element-->
		        <video id="local-video"></video>
		        <div class="meet-controls-bar">
		            <button onclick="startScreenShare()">Screen Share</button>
		            <button id="jitsi_close" class="hasTooltip button-icon" data-name="Disconnect">
						<span class="material-icons button-icon">
							cancel
						</span>
					</button>
					<select id="videoSource" style='width:100px'></select>
					<select id="audioSource" style='width:100px'></select>
		    	</div>
		    </div>
    	</div>
    `)




	
	jitsi_box.css("z-index", "100");

	/*// JITSI WORKAROUND
	var observer = new MutationObserver(function( mutations ){
		console.log("Got Mutations");
		console.log(mutations);
		mutations.forEach(function( mutation ) {
		var newNodes = mutation.addedNodes; // DOM NodeList
		if( newNodes !== null ) { // If there are new nodes added
			var $nodes = $( newNodes ); // jQuery set
			$nodes.each(function() {
				console.log("FOUND ADDED NODE");
				var $node = $( this );
				if( $node.is( "iframe" ) ) {
					console.log("patching and reloading iframe");
					$node.attr("referrerpolicy","no-referrer");
					$node.get(0).src+="";
				}
			});
		}
		});    
	});
	
	var config = { 
		attributes: true, 
		childList: true, 
		characterData: true 
	};

	observer.observe(jitsi_box.find("#jitsi_container").get(0), config);

	// END OF JITSI WORKAROUND
*/
	$("#site").append(jitsi_box);
	

	
	$("#jitsi_switch").css("position", "absolute").css("top", 0).css("left", 0);
	$("#jitsi_switch").click(jitsi_switch);


	joinRoom();
	
	
	
	$("#jitsi_close").css("float", 'right')

	$("#jitsi_close").click(
		function () {		
			if(window.myLocalVideostream != undefined){
				window.myLocalVideostream.getTracks().forEach(function(track) {
					track.stop();
					window.myLocalVideostream.removeTrack(track);
				});
			}
			
				
			window.MB.sendMessage("custom/myVTT/videoPeerDisconnect", {id: window.videoPeer.id})
			window.videoPeer.destroy();
			$("#peervideo-entry-modal").remove();
			create_jitsi_button();
		}
	);

}

function jitsi_modal() {
	$("#meet").css("position", "fixed").css("top", "100px").css("height", "80%").css("left", "50px").css("width", "75%");
	window.tile_desired = true;
	let currentSrc = $("#jitsi_container iframe")[0].src;
	let url = new URL(currentSrc);
	url.searchParams.set('bottom_layout', false);
	$("#jitsi_container iframe")[0].src = url.href;
	window.jitsiAPI.executeCommand(`setTileView`, true);
	$("span", $("#jitsi_switch")).text("fullscreen_exit");
	$("#jitsi_switch").attr("data-name", "Exit fullscreen (v)");
}

function jitsi_bottom() {
	$("#meet").css("position", "fixed").css("top", "").css("height", "120px").css("left", "50px").css("width", "75%").css("bottom", "10px");
	window.tile_desired = false;
	let currentSrc = $("#jitsi_container iframe")[0].src;
	let url = new URL(currentSrc);
	url.searchParams.set('bottom_layout', true);
	$("#jitsi_container iframe")[0].src = url.href;
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

