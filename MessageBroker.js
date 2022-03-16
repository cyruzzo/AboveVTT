// this shouln't be here...

function mydebounce(func, timeout = 800){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function clearFrame(){
	$(".streamer-canvas").each(function() {
		let canvas=$(this).get(0);
		let ctx=canvas.getContext('2d');
		ctx.clearRect(0,0,canvas.width,canvas.height);	
	});
}

const delayedClear = mydebounce(() => clearFrame());

function addVideo(stream,streamerid) {
	let video = document.createElement("video");
	video.setAttribute("class", "dicestream");
	video.width = 1024;
	video.height = 600;
	video.autoplay = true;
	$(video).hide();
	video.srcObject = stream;
	document.body.appendChild(video);
	video.play();
	
	
	var dicecanvas=$("<canvas width=1024 height=600 class='streamer-canvas' />");
	dicecanvas.attr("id","streamer-canvas-"+streamerid);
	dicecanvas.css("width","1024");
	dicecanvas.css("height","600");
	//dicecanvas.css("opacity",0.5);
	dicecanvas.css("position","fixed");
	dicecanvas.css("bottom","5px");
	dicecanvas.css("right","340px");
	dicecanvas.css("z-index",9000);
	dicecanvas.css("touch-action","none");
	dicecanvas.css("pointer-events","none");
	$("#site").append(dicecanvas);
	
	
	
	let canvas=dicecanvas.get(0);
	let ctx=canvas.getContext('2d');
	let updateCanvas=function(){
		delayedClear();
		
		let tmpcanvas = document.createElement("canvas");
		tmpcanvas.width = 1024;
		tmpcanvas.height = 600;
		let tmpctx = tmpcanvas.getContext("2d");
		tmpctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, 1024, 600);
		const frame = tmpctx.getImageData(0, 0, 1024, 600);

		for (let i = 0; i < frame.data.length; i += 4) {
			const red = frame.data[i + 0];
			const green = frame.data[i + 1];
			const blue = frame.data[i + 2];
			/*if ((red < 24) && (green < 24) && (blue < 24))
				frame.data[i + 3] = 128;*/
			if ((red < 14) && (green < 14) && (blue < 14))
				frame.data[i + 3] = 0;
			
		}
		ctx.putImageData(frame,0,0);
		video.requestVideoFrameCallback(updateCanvas);
	};
	
	video.requestVideoFrameCallback(updateCanvas);
}

class MessageBroker {

	loadAboveWS(callback=null){
		var self=this;
		if (callback)
			this.callbackAboveQueue.push(callback);
		
		// current dev wss://b2u1l4fzc7.execute-api.eu-west-1.amazonaws.com/v1
		// current prod wss://blackjackandhookers.abovevtt.net/v1
		let searchParams = new URLSearchParams(window.location.search)
		if(searchParams.has("dev")){
			let url="wss://b2u1l4fzc7.execute-api.eu-west-1.amazonaws.com/v1?campaign="+window.CAMPAIGN_SECRET;
			if(window.DM)
				url=url+="&DM=1";
			this.abovews = new WebSocket(url);	
		}
		else{
			let url="wss://blackjackandhookers.abovevtt.net/v1?campaign="+window.CAMPAIGN_SECRET;
			if(window.DM)
				url=url+="&DM=1";
			this.abovews = new WebSocket(url);
			
		}
		this.abovews.onopen=function(){

		}
		
		if (this.loadingAboveWS) {
			return;
		}

		this.loadingAboveWS=true;
		
		this.abovews.onerror = function() {
			self.loadingAboveWS = false;
		};

		this.abovews.onmessage=this.onmessage;

		this.abovews.onopen = function() {
			self.loadingAboveWS = false;
			var recovered = false;
			if (self.callbackAboveQueue.length > 1) {
				recovered = true;
			}
			var cb;
			console.log('Empting callback queue list');
			while (cb = self.callbackAboveQueue.shift()) {
				cb();
			};
			if (recovered && (!window.DM)) {
				console.log('asking the DM for recovery!');
				self.sendMessage("custom/myVTT/syncmeup");
			}
		};
	}

	loadWS(token, callback = null) {

		if (callback)
			this.callbackQueue.push(callback);

		console.log("LOADING WS: There Are " + this.callbackQueue.length + " elements in the queue");
		if (this.loadingWS) {
			console.log("ALREADY LOADING A WS");
			return;
		}
		this.loadingWS = true;

		var self = this;
		var url = this.url;
		var userid = this.userid;
		var gameid = this.gameid;

		console.log("STARTING MB WITH TOKEN=" + token);

		this.ws = new WebSocket(url + "?gameId=" + gameid + "&userId=" + userid + "&stt=" + token);

		this.ws.onmessage=this.onmessage;


		this.ws.onerror = function() {
			self.loadingWS = false;
		};

		this.ws.onopen = function() {
			self.loadingWS = false;
			var cb;
			console.log('Empting callback queue list');
			while (cb = self.callbackQueue.shift()) {
				cb();
			};
		};

		
	}

	/// this will find all pending messages and reprocess them if needed. This is necessary on the characters page because DDB removes/injects the gamelog frequently. Any time they inject it, this gets called
	reprocess_chat_message_history() {
		for (let i = 0; i < window.MB.chat_message_history.length; i++) {
			window.MB.chat_pending_messages.push(window.MB.chat_message_history[i]);
		}
		window.MB.handle_injected_data(window.MB.chat_pending_messages[0], false);
	}

	// we keep a list of the 100 most recent messages so we can re-inject them when DDB re-injects the gamelog on the characters page.
	track_message_history(data) {
		let existingMessage = window.MB.chat_message_history.find(message => message.id == data.id);
		if (existingMessage) {
			// already have this one
			return;
		}
		window.MB.chat_message_history.unshift(data);
		if (window.MB.chat_message_history > 100) {
			window.MB.chat_message_history.pop();
		}
	}

	handle_injected_data(data, trackHistory = true){
		let self=this;
		self.chat_pending_messages.push(data);
		let animationDuration = trackHistory ? 250 : 0; // don't animate if we're reprocessing messages
		if (trackHistory) {
			window.MB.track_message_history(data);
		}
		// start the task
		
		if(self.chat_decipher_task==null){
			self.chat_decipher_task=setInterval(function(){
				console.log("deciphering");
				let pend_length = self.chat_pending_messages.length;
				for(var i=0;i<pend_length;i++){
					var current=self.chat_pending_messages.shift();
					
					var injection_id=current.data.rolls[0].rollType;
					var injection_data=current.data.injected_data;
					console.log(`injection_id = ${injection_id}`);
					console.log(`injection_data = ${injection_data}`);
					
					var found=false;
					$(document.getElementsByClassName(self.diceMessageSelector)).each(function(){
						if($(this).text()==injection_id){
							found=true;
							let li = $(this).closest("li");
							console.log("TROVATOOOOOOOOOOOOOOOOO");
							let oldheight=li.height();
							var newlihtml=self.convertChat(injection_data, current.data.player_name==window.PLAYER_NAME ).html();
							if(newlihtml=="") {
								li.css("display","none"); // THIS IS TO HIDE DMONLY STUFF
							} else if (injection_data.dmonly && window.DM) { 
							}
								
							li.animate({ opacity: 0 }, animationDuration, function() {
							 	li.html(newlihtml);
								let neweight = li.height();
								li.height(oldheight);
								li.animate({ opacity: 1, height: neweight }, animationDuration, () => { li.height("") });
								let img = li.find(".magnify");
								img.magnificPopup({type: 'image', closeOnContentClick: true });

								if (img[0]) {
									img[0].onload = () => {
										if (img[0].naturalWidth > 0) {
											li.find('.chat-link')[0].style.display = 'none';
											img[0].style.display = 'block';
										}
									}
								}

								if (injection_data.dmonly && window.DM) { // ADD THE "Send To Player Buttons"
									let btn = $("<button>Show to Players</button>")
									li.append(btn);
									btn.click(() => {
										li.css("display", "none");
										delete injection_data.dmonly;
										self.inject_chat(injection_data); // RESEND THE MESSAGE REMOVING THE "injection only"
									});
								}
							});

						}
					});
					if(!found){
						console.warn(`couldn't find a message matching ${JSON.stringify(current)}`);
						// It's possible that we could lose messages due to this not being here, but
						// if we push the message here, we can end up in an infinite loop.
						// We may need to revisit this and do better with error handling if we end up missing too many messages.
						// self.chat_pending_messages.push(current);
					}
				}
				if(self.chat_pending_messages.length==0){
					console.log("stop deciphering");
					clearInterval(self.chat_decipher_task);
					self.chat_decipher_task=null;
				}
			},500);
		}
	}

	constructor() {
		var self = this;
		
		this.mysenderid=uuid();
		this.stats={
			reflected:0,
			peers : {}
		};
		this.above_sequence=0;

		this.chat_id=uuid();
		this.chat_counter=0;
		this.chat_pending_messages=[];
		this.chat_message_history=[];
		this.chat_decipher_task=null;

		this.callbackQueue = [];
		this.callbackAboveQueue = [];

		this.userid = $("#message-broker-client").attr("data-userId");
		this.gameid = find_game_id();
		this.url = $("#message-broker-client").attr("data-connectUrl");
		this.diceMessageSelector = "DiceMessage_RollType__wlBsW";
		if (is_encounters_page()) {
			this.diceMessageSelector = "tss-r93asv-RollType";
		} else if (is_characters_page()) {
			this.diceMessageSelector = "e5tW4dyfiZqZEWgkVugvEQ==";
		}

		this.lastAlertTS = 0;
		this.latestVersionSeen = abovevtt_version;

		this.onmessage = function(event,tries=0) {
			if (event.data == "pong")
				return;
			if (event.data == "ping")
				return;

			var msg = $.parseJSON(event.data);
			console.log(msg.eventType);
			
			if(msg.sender){ // THIS MESSAGE CONTAINS DATA FOR TELEMEMTRY (from AboveWS)
				if(msg.sender==self.mysenderid){
					self.stats.reflected++;
					console.error("WARNING. WE RECEIVED BACK OUR OWN MESSAGE");
					return;
				}

				if(self.stats.peers[msg.sender]){
					let shouldbethis=self.stats.peers[msg.sender].sequence+1;
					if(msg.sequence==shouldbethis){
						self.stats.peers[msg.sender].sequence=msg.sequence;
						if(tries>0){
							console.log("FIXED");
							self.stats.peers[msg.sender].future_fixed++;
						}
					}
					if(msg.sequence > shouldbethis){
						if(tries==0)
							self.stats.peers[msg.sender].future++;
						
						console.log("MSG in the future. (was expecting "+shouldbethis+" but we got "+msg.sequence+ " retries :" + tries);
						if(tries<20){
							setTimeout(self.onmessage,300,event,tries+1);
							console.log("trying to fix");
							return;
						}
						else{
							console.error("lost a message");
							self.stats.peers[msg.sender].sequence=msg.sequence;
						}
					}
					if(msg.sequence < shouldbethis){
							if((msg.sequence - self.stats.peers[msg.sender].first_sequence) > 10){
								self.stats.peers[msg.sender].past++;
								console.error("Sequence message is in the past. We should try to recover");
							}
							else{
								console.log("message in the past, but the che connection is new.. so.. I guess it's ok");
							}
							
					}
				}
				else{
					self.stats.peers[msg.sender]={
							future:0,
							future_fixed:0,
							past:0,
							sequence: msg.sequence,
							first_sequence: msg.sequence,
					}
				}
			}

			if(window.CLOUD && msg.sceneId){ // WE NEED TO IGNORE CERTAIN MESSAGE IF THEY'RE NOT FROM THE CURRENT SCENE
				if(msg.sceneId!=window.CURRENT_SCENE_DATA.id){
					if(["custom/myVTT/token",
					    "custom/myVTT/delete_token",
						"custom/myVTT/createtoken",
						"custom/myVTT/reveal",
						"custom/myVTT/fogdata",
						"custom/myVTT/drawing",
						"custom/myVTT/drawdata",
						"custom/myVTT/highlight",
						"custom/myVTT/pointer",
					   ].includes(msg.eventType)){
						   console.log("skipping msg from a different scene");
					   	return;
					   }
				}
			}

			if (msg.eventType == "custom/myVTT/token") {
				self.handleToken(msg);
			}
			if(msg.eventType=="custom/myVTT/delete_token"){
				let tokenid=msg.data.id;
				if(tokenid in window.TOKEN_OBJECTS)
					window.TOKEN_OBJECTS[tokenid].delete(false,false);
			}
			if(msg.eventType == "custom/myVTT/createtoken"){
				if(window.DM){
					let fake=$("<div/>");
					fake.attr(msg.data);
					token_button({target:fake.get(0)});
					fake.remove();
				}
			}

			if(msg.eventType == "custom/myVTT/scenelist"){
				remove_loading_overlay();
				if(window.DM){
					console.log("got scene list");

					msg.data.sort((a,b) => {
						if(a.order < b.order)
							return -1;
						if(a.order > b.order)
							return 1;
						return 0
					});
					window.ScenesHandler.scenes=msg.data;
					window.PLAYER_SCENE_ID=msg.playersSceneId;
					refresh_scenes();
				}
			}

			if (msg.eventType == "custom/myVTT/scene") {
				self.handleScene(msg);
			}
			if (msg.eventType == "custom/myVTT/syncmeup") {
				self.handleSyncMeUp(msg);
			}
			if(msg.eventType == "character-sheet/character-update/fulfilled"){
				if(window.DM)
					self.handleCharacterUpdate(msg);
			}

			if (msg.eventType == "custom/myVTT/reveal") {
				window.REVEALED.push(msg.data);
				redraw_canvas();
				check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
			}

			if(msg.eventType== "custom/myVTT/fogdata"){ // WE RESEND ALL THE FOG EVERYTIME NOW
				window.REVEALED=msg.data;
				redraw_canvas();
				check_token_visibility();
			}

			if (msg.eventType == "custom/myVTT/drawing") {
				window.DRAWINGS.push(msg.data);
				redraw_drawings();
			}

			if(msg.eventType=="custom/myVTT/drawdata"){
				window.DRAWINGS=msg.data;
				redraw_drawings();
			}
			if (msg.eventType == "custom/myVTT/chat") { // DEPRECATED!!!!!!!!!
				if(!window.NOTIFIEDOLDVERSION){
					alert('One of the player is using AboveTT 0.0.51 or less. Please update everyone to 0.0.52 or higher');
					window.NOTIFIEDOLDVERSION=true;
				}
			}
			if (msg.eventType == "custom/myVTT/CT" && (!window.DM)) {
				self.handleCT(msg.data);
			}
			if (msg.eventType == "custom/myVTT/highlight") {
				if (msg.data.id in window.TOKEN_OBJECTS) {
					window.TOKEN_OBJECTS[msg.data.id].highlight(true);
				}
			}
			if (msg.eventType == "custom/myVTT/pointer") {
				set_pointer(msg.data,!msg.data.dm);
			}

			if (msg.eventType == "custom/myVTT/lock") {
				if (window.DM)
					return;
				if (getPlayerIDFromSheet(msg.data.player_sheet) == window.PLAYER_ID) {
					//alert('locked');
					var lock_display = $("<div id='lock_display'>The DM is looking at your character sheet</p></div>");
					lock_display.css("font-size", "18px");
					lock_display.css("text-align","center");
					lock_display.css('font-weight', "bold");
					lock_display.css('background', "rgba(255,255,0,0.7)");
					lock_display.css('position', 'absolute');

					if (is_characters_page()) {
						lock_display.css({
							"top": "0px",
							"left": "0px",
							"width": "100%",
							"height": "100%"
						});
						$(".site-bar").append(lock_display);
						adjust_site_bar();
					} else {
						lock_display.css('top', '27px');
						lock_display.css('left', '0px');
						lock_display.width($("#sheet").width());
						//lock_display.height($("#sheet").height());
						lock_display.height(25);
						//lock_display.css('padding-top', '50px');
						//$("#sheet iframe").css('opacity', '0.8');
						$("#sheet").append(lock_display);
						//$("#sheet iframe").attr('disabled', 'disabled');
					}

				}
			}
			if (msg.eventType == "custom/myVTT/unlock") {
				if (window.DM)
				{
					return;
				}
				else if (getPlayerIDFromSheet(msg.data.player_sheet) == window.PLAYER_ID) {
					//alert('unlocked');
					$("#lock_display").remove();
					adjust_site_bar();
					$("#sheet iframe").removeAttr('disabled');
					$("#sheet iframe").css('opacity', '1');
					$("#sheet iframe").attr('src', function(i, val) { return val; }); // RELOAD IFRAME
				}
			}

			if (msg.eventType == "custom/myVTT/player_sheet_closed") {
				if (window.DM)
				{
					//$("[id='PlayerSheet"+getPlayerIDFromSheet(msg.data.player_sheet)+"']").attr('src', function(i, val) { return val; });
					$("[id='PlayerSheet"+getPlayerIDFromSheet(msg.data.player_sheet)+"']").attr('data-changed', 'true');
					return;
				}
			}
			
			
			if(msg.eventType=="custom/myVTT/JournalChapters"){
				if(!window.DM){
					window.JOURNAL.chapters=msg.data.chapters;
					window.JOURNAL.build_journal();
				}
			}
			
			if(msg.eventType=="custom/myVTT/note"){
				if(!window.DM){
					window.JOURNAL.notes[msg.data.id]=msg.data.note;
					
					window.JOURNAL.build_journal();
					
					if(msg.data.id in window.TOKEN_OBJECTS){
						window.TOKEN_OBJECTS[msg.data.id].place();
					}
					
					if(msg.data.popup)
						window.JOURNAL.display_note(msg.data.id);
					
				}
			}
			
			if(msg.eventType=="custom/myVTT/playerjoin"){
				if (window.DM) {										
					if (msg.data == null || typeof msg.data.abovevtt_version === "undefined") {
						// Player with version <= 0.64 - avoiding popping too many alert messages
						if (self.lastAlertTS == 0 || (Date.now() - self.lastAlertTS) >= 4 * 1000) {
							console.log("A player just joined with an old version <= 0.64");
							alert("Please note, a player just joined with an old version <= 0.64.\nFor best experience and compatibility, we recommend all players and DM to run the latest AboveVTT version.");
							self.lastAlertTS = Date.now();
						}
					} else {
						if (window.CONNECTED_PLAYERS[msg.data.player_id] === "undefined" ||
						window.CONNECTED_PLAYERS[msg.data.player_id] != msg.data.abovevtt_version) {
							window.CONNECTED_PLAYERS[msg.data.player_id] = msg.data.abovevtt_version;
							
							if (msg.data.abovevtt_version != self.latestVersionSeen) {
								self.latestVersionSeen = check_versions_match();
							}
						}
					}

					window.JOURNAL.sync();
				}	
			}
			if(msg.eventType=="custom/myVTT/soundpad"){
				build_soundpad(msg.data.soundpad);
			}

			if(msg.eventType=="custom/myVTT/playchannel"){
				audio_playchannel(msg.data.channel,msg.data.time,msg.data.volume);
			}
			if(msg.eventType=="custom/myVTT/pausechannel"){
				audio_pausechannel(msg.data.channel);
			}
			if(msg.eventType=="custom/myVTT/changechannel"){
				audio_changesettings(msg.data.channel,msg.data.volume,msg.data.loop);
			}
			if(msg.eventType=="custom/myVTT/changeyoutube"){
				if(window.YTPLAYER){
					$("#youtube_volume").val(msg.data.volume);
					if(window.YTPLAYER)
						window.YTPLAYER.setVolume(msg.data.volume);
				}
			}

			if (msg.eventType == "custom/myVTT/playerdata") {
				self.handlePlayerData(msg.data);
			}
			if (msg.eventType == "dice/roll/pending"){
				// check for injected_data!
				if(msg.data.injected_data){
					notify_gamelog();
					self.handle_injected_data(msg);
				}
			}
			
			if(msg.eventType== "custom/myVTT/iceforyourgintonic"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID)  || (msg.data.to!= window.MYSTREAMID) )
					return;
					
				setTimeout( () => {
				var peer=window.STREAMPEERS[msg.data.from];
				peer.addIceCandidate(msg.data.ice);
				 },500); // ritardalo un po'
			}
			if(msg.eventType == "custom/myVTT/wannaseemydicecollection"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID))
					return;
				const configuration = {
    				iceServers: [{urls: "turn:turn.abovevtt.net:3478",username:"abovevtt",credential:"pleasedontfuckitupthisisanopenproject"}]
  				};
				var peer=new RTCPeerConnection(configuration);
				peer.addEventListener('track', async (event) => {
					console.log("aggiungo video!!!!");
				     addVideo(event.streams[0],msg.data.from);
				});
				peer.onicecandidate = e => {
					window.MB.sendMessage("custom/myVTT/iceforyourgintonic",{
						to: msg.data.from,
						from: window.MYSTREAMID,
						ice: e.candidate
					})
				};

				
				window.STREAMPEERS[msg.data.from]=peer;
				peer.onconnectionstatechange=() => {
					if((peer.connectionState=="closed") || (peer.connectionState=="failed")){
						console.log("DELETING PEER "+msg.data.from);
						delete window.STREAMPEERS[msg.data.from];
						$("#streamer-canvas-"+msg.data.from).remove();
					}
				};
				if(window.MYMEDIASTREAM){
					var stream=window.MYMEDIASTREAM;
					stream.getTracks().forEach(track => peer.addTrack(track, stream));
				}
				peer.createOffer({offerToReceiveVideo: 1}).then( (desc) => {
					console.log("fatto setLocalDescription");
					peer.setLocalDescription(desc);
					self.sendMessage("custom/myVTT/okletmeseeyourdice",{
						to: msg.data.from,
						from: window.MYSTREAMID,
						offer: desc
					})
				});
			}
			if(msg.eventType == "custom/myVTT/okletmeseeyourdice"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID)  || (msg.data.to!= window.MYSTREAMID) )
					return;
				const configuration = {
    				iceServers: [{urls: "turn:turn.abovevtt.net:3478",username:"abovevtt",credential:"pleasedontfuckitupthisisanopenproject"}]
  				};
				var peer=new RTCPeerConnection(configuration);
				peer.addEventListener('track', async (event) => {
					addVideo(event.streams[0],msg.data.from);
				});
				peer.onicecandidate = e => {
					window.MB.sendMessage("custom/myVTT/iceforyourgintonic",{
						to: msg.data.from,
						from: window.MYSTREAMID,
						ice: e.candidate
					})
				};
				
				window.STREAMPEERS[msg.data.from]=peer;
				peer.onconnectionstatechange=() => {
					if((peer.connectionState=="closed") || (peer.connectionState=="failed")){
						console.log("DELETING PEER "+msg.data.from);
						delete window.STREAMPEERS[msg.data.from];
						$("#streamer-canvas-"+msg.data.from).remove();
					}
				};
				if(window.MYMEDIASTREAM){
					var stream=window.MYMEDIASTREAM;
					stream.getTracks().forEach(track => peer.addTrack(track, stream));
				}
				peer.setRemoteDescription(msg.data.offer);
				console.log("fatto setRemoteDescription");
				peer.createAnswer().then( (desc) => {
					peer.setLocalDescription(desc);
					console.log("fatto setLocalDescription");
					
					window.MB.sendMessage("custom/myVTT/okseethem",{
						from: window.MYSTREAMID,
						to: msg.data.from,
						answer: desc
					});
				})
			}
			if(msg.eventType == "custom/myVTT/okseethem"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID)  || (msg.data.to!= window.MYSTREAMID) )
					return;
				var peer=window.STREAMPEERS[msg.data.from];
				peer.setRemoteDescription(msg.data.answer);
				console.log("fatto setRemoteDescription");
			}
			
			if (msg.eventType == "dice/roll/fulfilled") {
				notify_gamelog();
								if (!window.DM)
					return;
				
					
				// CHECK FOR INIT ROLLS (auto add to combat tracker)
				if (msg.data.action == "Initiative") {
					console.log(msg.data);
					var total = msg.data.rolls[0].result.total;
					let entityid = msg.data.context.entityId;
					console.log("cerco " + entityid);
					
					$("#tokens .VTTToken").each(
						function(){
							var converted = $(this).attr('data-id').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
							if(converted==entityid){
								ct_add_token(window.TOKEN_OBJECTS[$(this).attr('data-id')]);
							}
						}
					);
					

					$("#combat_area tr").each(function() {
						var converted = $(this).attr('data-target').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
						console.log(converted);
						if (converted == entityid) {
							$(this).find(".init").val(total);
							ct_reorder();
						}
					});
					ct_persist();
				}
			}
		};

		get_cobalt_token(function(token) {
			self.loadWS(token);
		});

		self.loadAboveWS();

		setInterval(function() {
			self.sendPing();
			self.sendAbovePing();
		}, 180000);

		// Ensure we have an initial delay (15 seconds) before attempting re-connects to let everything load (every 4 seconds)
		setTimeout(setInterval(function() {
			   	forceDdbWsReconnect();
		}, 4000), 15000);
	}

    	handleCT(data){
		$("#combat_area").empty();
		ct_load(data);
	}

	handlePlayerData(data) {
		if (!window.DM)
			return;

		window.PLAYER_STATS[data.id] = data;
		this.sendTokenUpdateFromPlayerData(data);

		// update combat tracker:

		update_pclist();
	}

	sendTokenUpdateFromPlayerData(data) {
		if (data.id in window.TOKEN_OBJECTS) {
			var cur = window.TOKEN_OBJECTS[data.id];

			// test for any change
			if ((cur.options.hp != (data.hp + (data.temp_hp ? data.temp_hp : 0))) ||
				(cur.options.max_hp != data.max_hp) ||
				(cur.options.ac != data.ac) ||
				(!areArraysEqualSets(cur.options.conditions, data.conditions)))
			{
				console.log(cur.options);
				console.log(data);
				console.log("4 expresision list following");
				console.log((cur.options.hp != (data.hp + (data.temp_hp ? data.temp_hp : 0))));
				console.log((cur.options.max_hp != data.max_hp));
				console.log((cur.options.ac != data.ac));
				console.log((!areArraysEqualSets(cur.options.conditions, data.conditions)));
				if (typeof cur.options.hp != "undefined" && cur.options.hp > data.hp && cur.options.custom_conditions.includes("Concentration(Reminder)")) {
					var msgdata = {
						player: cur.options.name,
						img: cur.options.imgsrc,
						text: "<b>Check for concentration!!</b>",
					};

					window.MB.inject_chat(msgdata);
				}
				cur.options.hp = +data.hp + (data.temp_hp ? +data.temp_hp : 0);


				cur.options.max_hp = data.max_hp;
				cur.options.ac = data.ac;
				cur.options.conditions = data.conditions;

				cur.place();
				window.MB.sendMessage('custom/myVTT/token', cur.options);
			}
		}
	}

	encode_message_text(text) {
		if (is_supported_version('0.66')) {
			// This is used when the "Send to Gamelog" button sends HTML over the websocket.
			// If there are special characters, then the _dndbeyond_message_broker_client fails to parse the JSON
			// To work around this, we base64 encode the html here, and then decode it in MessageBroker.convertChat
			return "base64" + window.btoa(unescape(encodeURIComponent(text)));
		} else {
			console.warn("There's at least one connection below version 0.66; not encoding message text to prevent that user from seeing base64 encoded text in the gamelog");
			return text;
		}
	}
	
	decode_message_text(text) {
		// no need to check version because the `startsWith("base64")` will return `false` if there are any connections below 0.65. See `encode_message_text` for more details.
		if (text !== undefined && text.startsWith("base64")) {
			// This is used when the "Send to Gamelog" button sends HTML over the websocket.
			// If there are special characters, then the _dndbeyond_message_broker_client fails to parse the JSON
			// To work around this, we base64 encode the html in encode_message_text, and then decode it here after the message has been received
			text = decodeURIComponent(escape(window.atob(text.replace("base64", ""))));
		}
		return text;
	}
	
	convertChat(data,local=false) {

		data.text = this.decode_message_text(data.text);

		//Security logic to prevent content being sent which can execute JavaScript.
		data.player = DOMPurify.sanitize( data.player,{ALLOWED_TAGS: []});
		data.img = DOMPurify.sanitize( data.img,{ALLOWED_TAGS: []});
		data.text = DOMPurify.sanitize( data.text,{ALLOWED_TAGS: ['img','div','p', 'b', 'button', 'span', 'style', 'path', 'svg', 'a'], ADD_ATTR: ['target']}); //This array needs to include all HTML elements the extension sends via chat.

		if(data.dmonly && !(window.DM) && !local) // /dmroll only for DM of or the user who initiated it
			return $("<div/>");
				
		if(data.whisper && (data.whisper!=window.PLAYER_NAME) && (!local))
			return $("<div/>");
		//notify_gamelog();
		
		if (is_encounters_page()) {
			return $(`
				<li class="tss-8-Other-ref tss-17y30t1-GameLogEntry-Other-Flex">
					<p role="img" class="tss-wyeh8h-Avatar-Flex">
						<img class="tss-1e4a2a1-AvatarPortrait" src="${data.img}" alt="">
					</p>
					<div class="tss-1e6zv06-MessageContainer-Flex">
						<div class="tss-dr2its-Line-Flex">
							<span class="tss-1tj70tb-Sender">${data.player}</span>
						</div>
						<div class="tss-8-Collapsed-ref tss-8-Other-ref tss-11w0h4e-Message-Collapsed-Other-Flex">${data.text}</div>
						<time datetime="2022-03-15T17:34:18-05:00" title="3/15/2022 5:34 PM" class="tss-1yxh2yy-TimeAgo-TimeAgo">14 mins ago</time>
					</div>
				</li>
			`);
		} else if (is_characters_page()) {
			return $(`
				<li class="cwBGi-s80YSXZFf9zFTAGg== wtVS4Bjey6LwdMo1GyKvpQ== QXDbdjnpeXLRB22KlOxDsA== _42x6X+dUmW-21eOxSO1c7Q== _9ORHCNDFVTb1uWMCEaGDYg==">
					<p role="img" class="TILdlgSwOYvXr2yBdjxU7A== QXDbdjnpeXLRB22KlOxDsA==">
						<img class="U5icMJo74qXY3K0pjow8zA==" src="${data.img}" alt="">
					</p>
					<div class="pw06vls7GmA2pPxoGyDytQ== QXDbdjnpeXLRB22KlOxDsA== VwlMdrxdj-7VFbj4bhgJCg== bDu7knPli3v29ahk5PQFIQ==">
						<div class="zmFwkmlgaKJ3kVU14zW8Lg== QXDbdjnpeXLRB22KlOxDsA== CoBE7nCohYcFyEBBP3K93A==">
							<span class="_22SVeI3ayk2KgS4V+GqCCA==">${data.player}</span>
						</div>
						<div class="oDA6c7IdLEVJ7uSe5103CQ== iQqUeZkD8989e4pBhSqIrQ== wtVS4Bjey6LwdMo1GyKvpQ== QXDbdjnpeXLRB22KlOxDsA==">${data.text}</div>
						<time datetime="2022-01-06T07:46:19-06:00" title="1/6/2022 7:46 AM" class="VL1LOQfDhMHRvAGyWG2vGg== _1-XSkDcxqHW18wFo5qzQzA==">24 mins ago</time>
					</div>
				</li>
			`);
		}

		var newentry = $("<div/>");
		newentry.attr('class', 'GameLogEntry_GameLogEntry__2EMUj GameLogEntry_Other__1rv5g Flex_Flex__3cwBI Flex_Flex__alignItems-flex-end__bJZS_ Flex_Flex__justifyContent-flex-start__378sw');
		newentry.append($("<p role='img' class='Avatar_Avatar__131Mw Flex_Flex__3cwBI'><img class='Avatar_AvatarPortrait__3cq6B' src='" + data.img + "'></p>"));
		var container = $("<div class='GameLogEntry_MessageContainer__RhcYB Flex_Flex__3cwBI Flex_Flex__alignItems-flex-start__HK9_w Flex_Flex__flexDirection-column__sAcwk'></div>");
		container.append($("<div class='GameLogEntry_Line__3fzjk Flex_Flex__3cwBI Flex_Flex__justifyContent-space-between__1FcfJ'><span>" + data.player + "</span></div>"));
		var entry = $("<div class='GameLogEntry_Message__1J8lC GameLogEntry_Collapsed__1_krc GameLogEntry_Other__1rv5g Flex_Flex__3cwBI'>" + data.text + "</div>");
		container.append(entry);


		var d = new Date();
		var datetime = d.toISOString();
		container.append($("<time datetime='" + datetime + "' class='GameLogEntry_TimeAgo__zZTLH TimeAgo_TimeAgo__2M8fr'></time"));

		newentry.append(container);
		
		if ($(".GameLog_GameLog__2z_HZ").scrollTop() < 0) {
			$(".GameLog_GameLog__2z_HZ").addClass("highlight-gamelog");
		}

		return newentry;
		
	}


	handleToken(msg) {
		var data = msg.data;
		//let t=new Token($.parseJSON(msg.data));


		if (data.id in window.TOKEN_OBJECTS) {
			for (var property in data) {
				window.TOKEN_OBJECTS[data.id].options[property] = data[property];
			}
			if (!data.hidden)
				delete window.TOKEN_OBJECTS[data.id].options.hidden;

			window.TOKEN_OBJECTS[data.id].place();
			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN

		}
		else {
			// SOLO PLAYER. PUNTO UNICO DI CREAZIONE DEI TOKEN

			if (window.DM) {
				console.log("ATTENZIONEEEEEEEEEEEEEEEEEEE ATTENZIONEEEEEEEEEEEEEEEEEEE");
			}

			let t = new Token(data);
			window.TOKEN_OBJECTS[data.id] = t;
			t.sync = function(e) { // VA IN FUNZIONE SOLO SE IL TOKEN NON ESISTE GIA					
				window.MB.sendMessage('custom/myVTT/token', t.options);
			};
			t.place();
			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}

		if (window.DM) {
			console.log("**** persistoooooooooo token");
			window.ScenesHandler.persist();
		}
	}

	handleScene(msg) {
		if (window.DM && ! (window.CLOUD) ) {
			alert('WARNING!!!!!!!!!!!!! ANOTHER USER JOINED AS DM!!!! ONLY ONE USER SHOULD JOIN AS DM. EXITING NOW!!!');
			location.reload();
		}

		// DISABLED THANKS TO POLLING
		/*if ((!window.DM) && (typeof window.PLAYERDATA !== "undefined")) {
			window.MB.sendMessage('custom/myVTT/playerdata', window.PLAYERDATA);
		}*/

		window.TOKEN_OBJECTS = {};
		let data = msg.data;

		if(window.CLOUD){
			if(data.dm_map_usable=="1"){ // IN THE CLOUD WE DON'T RECEIVE WIDTH AND HEIGT. ALWAYS LOAD THE DM_MAP FIRST, AS TO GET THE PROPER WIDTH
				data.map=data.dm_map;
				if(data.dm_map_is_video=="1")
					data.is_video=true;
			}
			else{
				data.map=data.player_map;
				if(data.player_map_is_video=="1")
					data.is_video=true;
			}
		}

		window.CURRENT_SCENE_DATA = msg.data;
		if(window.CLOUD && window.DM){
			window.ScenesHandler.scene=window.CURRENT_SCENE_DATA;
		}
		window.CURRENT_SCENE_DATA.vpps=parseFloat(window.CURRENT_SCENE_DATA.vpps);
		window.CURRENT_SCENE_DATA.hpps=parseFloat(window.CURRENT_SCENE_DATA.hpps);
		window.CURRENT_SCENE_DATA.offsetx=parseFloat(window.CURRENT_SCENE_DATA.offsetx);
		window.CURRENT_SCENE_DATA.offsety=parseFloat(window.CURRENT_SCENE_DATA.offsety);
		
		console.log("SETTO BACKGROUND A " + msg.data);
		$("#tokens").children().remove();

		var old_src = $("#scene_map").attr('src');
		$("#scene_map").attr('src', data.map);

		load_scenemap(data.map, data.is_video, data.width, data.height, function() {
			var owidth = $("#scene_map").width();
			var oheight = $("#scene_map").height();

			if (window.CURRENT_SCENE_DATA.scale_factor) {
				$("#scene_map").width(owidth * window.CURRENT_SCENE_DATA.scale_factor);
				$("#scene_map").height(oheight * window.CURRENT_SCENE_DATA.scale_factor);
			}
			reset_canvas();
			redraw_canvas();
			redraw_drawings();
			$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 1400);
			$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 1400);
			$("#black_layer").width($("#scene_map").width() * window.ZOOM + 1400);
			$("#black_layer").height($("#scene_map").height() * window.ZOOM + 1400);
			if(!window.DM)
				check_token_visibility();

			// WE USED THE DM MAP TO GET RIGH WIDTH/HEIGHT. NOW WE REVERT TO THE PLAYER MAP
			if(window.CLOUD && !window.DM && data.dm_map_usable=="1"){
				$("#scene_map").stop();
				$("#scene_map").css("opacity","0");
				console.log("switching back to player map");
				$("#scene_map").off("load");
				$("#scene_map").on("load", () => $("#scene_map").animate({opacity:1},2000));
				$("#scene_map").attr("src",data.player_map);
				
			}

			if (window.EncounterHandler !== undefined) {
				console.log("Updating avtt encounter");
				window.EncounterHandler.update_avtt_encounter_with_players_and_monsters();
			}

		});


		if (data.fog_of_war == 1) {
			window.FOG_OF_WAR = true;
			window.REVEALED = data.reveals;
			reset_canvas();
			redraw_canvas();
			//$("#fog_overlay").show();
		}
		else {
			window.FOG_OF_WAR = false;
			window.REVEALED = [];
			reset_canvas();
			//$("#fog_overlay").hide();
		}
		if (typeof data.drawings !== "undefined") {
			window.DRAWINGS = data.drawings;
		}
		else {
			window.DRAWINGS = [];
		}
		redraw_drawings();


		
		for (var i = 0; i < data.tokens.length; i++) { // QUICK HACK
			this.handleToken({
				data: data.tokens[i]
			});
			if(!window.DM)
				check_token_visibility();
		}

		if(window.CLOUD && window.DM){
			refresh_scenes();
			$("#combat_area").empty();
			ct_load();
		}
	}

	handleSyncMeUp(msg) {
		if (DM) {
			window.ScenesHandler.sync();
			ct_persist(); // force refresh of combat tracker for late users
			if (window.CURRENT_SOUNDPAD) {
				var data = {
					soundpad: window.CURRENT_SOUNDPAD
				}
				window.MB.sendMessage("custom/myVTT/soundpad", data); // refresh soundpad
			}
		}
	}

	handleCharacterUpdate(msg){
		let characterId=msg.data.characterId;

		window.pcs.forEach(function(pc){
			if(!pc.sheet.endsWith(characterId)) // we only poll for the characterId that sent this message
				return;

			getPlayerData(pc.sheet, function (playerData) {
				window.PLAYER_STATS[playerData.id] = playerData;
				window.MB.sendTokenUpdateFromPlayerData(playerData);
				update_pclist();
        	});
		});
		
	}
	
	inject_chat(injected_data) {
		var msgid = this.chat_id + this.chat_counter++;

		var data = {
			player_name: window.PLAYER_NAME,
			injected_data: injected_data,
			"action": "ABOVETT",
			"rolls": [
				{
					"diceNotation": {
						"set": [
						],
						"constant": 0
					},
					"diceNotationStr": "1d4",
					"rollType": msgid,
					"rollKind": "",
				}
			],
			"context": {
				"entityId": this.userid,
				"entityType": "user",
				"messageScope": "gameId",
				"messageTarget": this.gameid
			},
			"setId": "01201",
			"rollId": uuid(),
		};
		var eventType = "dice/roll/pending";
		var message = {
			id: uuid(),
			source: "web",
			gameId: this.gameid,
			userId: this.userid,
			persist: false, // INTERESSANTE PER RILEGGERLI, per ora non facciamogli casini
			messageScope: "gameId",
			messageTarget: this.gameid,
			eventType: eventType,
			data: data,
			entityId: this.userid, //proviamo a non metterla
			entityType: "user", // MOLTO INTERESSANTE. PENSO VENGA USATO PER CAPIRE CHE IMMAGINE METTERCI.
		};

		if (this.ws.readyState == this.ws.OPEN) {
			this.ws.send(JSON.stringify(message));
		}

		this.handle_injected_data(message);

	}


	sendMessage(eventType, data) {
		var self = this;

		//this.sendDDBMB(eventType,data); 

		if(eventType.startsWith("custom")){
			this.sendAboveMB(eventType,data);
		}
		else{
			this.sendDDBMB(eventType,data);
		}
	}

	sendAboveMB(eventType,data){
		var self=this;
		var message = {
			action: "sendmessage",
			campaignId:window.CAMPAIGN_SECRET,
			eventType: eventType,
			sender: this.mysenderid,
			data: data,
		}

		if(window.CLOUD)
			message.cloud=1;

		if(!["custom/myVTT/switch_scene"].includes(eventType))
			message.sequence=this.above_sequence++;

		if(window.CURRENT_SCENE_DATA)
			message.sceneId=window.CURRENT_SCENE_DATA.id;
		
		const jsmessage=JSON.stringify(message);
		if(jsmessage.length > (128000)){
			alert("YOU REACHED THE MAXIMUM MESSAGE SIZE. PROBABLY SOMETHING IS WRONG WITH YOUR SCENE. You may have some tokens with embedded images that takes up too much space. Please delete them and refresh the scene");
			return;
		}


		if (this.abovews.readyState == this.ws.OPEN) {
			this.abovews.send(JSON.stringify(message));
		}
		else {
			self.loadAboveWS(function() {
				self.abovews.send(JSON.stringify(message));
			});
		}
	}

	sendDDBMB(eventType,data){
		var self=this;
		var message = {
			id: uuid(),
			//datetime: Date.now(),
			source: "web",
			gameId: this.gameid,
			userId: this.userid,
			persist: false, // INTERESSANTE PER RILEGGERLI, per ora non facciamogli casini
			messageScope: "gameId",
			messageTarget: this.gameid,
			eventType: eventType,
			data: data,
			// entityId :"43263440", proviamo a non metterla
			// entityType:"character", // MOLTO INTERESSANTE. PENSO VENGA USATO PER CAPIRE CHE IMMAGINE METTERCI.
		};

		if (this.ws.readyState == this.ws.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
		else { // TRY TO RECOVER
			get_cobalt_token(function(token) {
				self.loadWS(token, function() {
					// TODO, CONSIDER ADDING A SYNCMEUP / SCENE PAIR HERE
					self.ws.send(JSON.stringify(message));
				});
			});
		}
	}

	sendPing() {
		self = this;
		if (this.ws.readyState == this.ws.OPEN) {
			this.ws.send("{\"data\": \"ping\"}");
		}
		else {
			get_cobalt_token(function(token) {
				self.loadWS(token, null);
			});
		}
	}

	sendAbovePing(){
		self = this;
		if(this.abovews.readyState == this.abovews.OPEN){
			this.abovews.send(JSON.stringify({action:"keepalive",eventType:"custom/myVTT/keepalive"}));
		}
		else{
			self.loadAboveWS(null);
		}
	}

}

function monitor_messages() {
	$(".GameLog_GameLogEntries__3oNPD").on("DOMNodeInserted", function(addedEvent) {
		// currentTarget is the <ol> that contains every message
		// target is the <li> that represents the current message
		let currentMessage = $(addedEvent.target);
		if (currentMessage.find(".DiceMessage_Target__18rOt").text().includes("Self")) {
			let timeWrapper = $(`<div style="width:100%;"></div>`); // move time into a wrapper object so we can flex it horizontally with our new button
			currentMessage.find(".GameLogEntry_MessageContainer__RhcYB").append(timeWrapper);
			let sendToEveryone = $(`<button class="gamelog-to-everyone-button">Send To Everyone</button>`);
			timeWrapper.append(sendToEveryone)
			var time = currentMessage.find(".GameLogEntry_MessageContainer__RhcYB > time");
			if (time.length > 0) {
				timeWrapper.append(time);
				time.css("float", "right")
			}
			let toEveryoneHtml = currentMessage.find(".DiceMessage_Container__1rmut")[0].outerHTML;
			sendToEveryone.click(function(clickEvent) {
				// we want to send the expanded version so we have the click handler here and stopPropogation so that the on("click") below doesn't also fire. 
				// The other handler will send the current html which could be the collapsed version. Since the collapse mechanism won't work in this situation, let's always send the expanded version
				clickEvent.stopPropagation();
				data = {
					player: window.PLAYER_NAME,
					img: window.PLAYER_IMG,
					text: toEveryoneHtml,
					dmonly: false,
				};
				window.MB.inject_chat(data);	
			});
		}
	});
	$(".GameLog_GameLogEntries__3oNPD").on("click", ".gamelog-to-everyone-button", function(clickEvent) {
		let toEveryoneHtml = $(clickEvent.currentTarget).closest(".GameLogEntry_MessageContainer__RhcYB").find(".GameLogEntry_Message__1J8lC").html();
		data = {
			player: window.PLAYER_NAME,
			img: window.PLAYER_IMG,
			text: toEveryoneHtml,
			dmonly: false,
		};
		window.MB.inject_chat(data);
	});
}
