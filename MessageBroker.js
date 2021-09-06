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


		this.ws.onerror = function() {
			self.loadingWS = false;
		};

		this.ws.onopen = function() {
			self.loadingWS = false;
			var recovered = false;
			if (self.callbackQueue.length > 1) {
				recovered = true;
			}
			var cb;
			console.log('Empting callback queue list');
			while (cb = self.callbackQueue.shift()) {
				cb();
			};
			if (recovered && (!window.DM)) {
				console.log('asking the DM for recovery!');
				self.sendMessage("custom/myVTT/syncmeup");
			}

		};

		this.ws.onmessage = function(event) { // SCHIFO.. DOVREI FAR REGISTRARE GLI HANDLER ALLA CREAZIONE DELLA MB
			if (event.data == "pong")
				return;

			var msg = $.parseJSON(event.data);
			console.log(msg.eventType);
			
			if (msg.eventType == "custom/myVTT/token") {
				self.handleToken(msg);
			}
			if (msg.eventType == "custom/myVTT/scene") {
				self.handleScene(msg);
			}
			if (msg.eventType == "custom/myVTT/syncmeup") {
				self.handleSyncMeUp(msg);
			}
			if (msg.eventType == "custom/myVTT/reveal") {
				window.REVEALED.push(msg.data);
				redraw_canvas();
				check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
			}
			if (msg.eventType == "custom/myVTT/drawing") {
				window.DRAWINGS.push(msg.data);
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
				if (msg.data.player_sheet == window.PLAYER_SHEET) {
					//alert('locked');
					var lock_display = $("<div id='lock_display'>The DM is looking at your character sheet</p></div>");
					lock_display.css("font-size", "18px");
					lock_display.css("text-align","center");
					lock_display.css('font-weight', "bold");
					lock_display.css('background', "rgba(255,255,0,0.7)");
					lock_display.css('position', 'absolute');
					lock_display.css('top', '0px');
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
			if (msg.eventType == "custom/myVTT/unlock") {
				if (window.DM)
					return;
				if (msg.data.player_sheet == window.PLAYER_SHEET) {
					//alert('unlocked');
					$("#lock_display").remove();
					$("#sheet iframe").removeAttr('disabled');
					$("#sheet iframe").css('opacity', '1');
					$("#sheet iframe").attr('src', function(i, val) { return val; }); // RELOAD IFRAME
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
	}

	handle_injected_data(data){
		let self=this;
		self.chat_pending_messages.push(data);
		// start the task
		
		if(self.chat_decipher_task==null){
			self.chat_decipher_task=setInterval(function(){
				console.log("deciphering");
				let pend_length = self.chat_pending_messages.length;
				for(var i=0;i<pend_length;i++){
					var current=self.chat_pending_messages.shift();
					
					var injection_id=current.data.rolls[0].rollType;
					var injection_data=current.data.injected_data;
					console.log(injection_id);
					console.log(injection_data);
					
					var found=false;
					$(".DiceMessage_RollType__wlBsW").each(function(){
						if($(this).text()==injection_id){
							console.log("TROVATOOOOOOOOOOOOOOOOO");
							found=true;
							let li =$(this).closest("li");
							let oldheight=li.height();
							var newlihtml=self.convertChat(injection_data, current.data.player_name==window.PLAYER_NAME ).html();
							if(newlihtml=="")
								li.css("display","none"); // THIS IS TO HIDE DMONLY STUFF
								
							li.animate({ opacity: 0 }, 250, function() {
								li.html(newlihtml);
								let neweight = li.height();
								li.height(oldheight);
								li.animate({ opacity: 1, height: neweight }, 250, () => { li.height("") });
								li.find(".magnify").magnificPopup({type: 'image', closeOnContentClick: true });

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
						self.chat_pending_messages.push(current);
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
		
		this.chat_id=uuid();
		this.chat_counter=0;
		this.chat_pending_messages=[];
		this.chat_decipher_task=null;

		this.callbackQueue = [];

		this.userid = $("#message-broker-client").attr("data-userId");
		this.gameid = $("#message-broker-client").attr("data-gameId");
		this.url = $("#message-broker-client").attr("data-connectUrl");


		get_cobalt_token(function(token) {
			self.loadWS(token);
		});


		setInterval(function() {
			self.sendPing();
		}, 30000);
	}

    handleCT(data){
		$("#combat_area").empty();
		ct_load(data);
	}

	handlePlayerData(data) {
		if (!window.DM)
			return;

		window.PLAYER_STATS[data.id] = data;

		if (data.id in window.TOKEN_OBJECTS) {
			var cur = window.TOKEN_OBJECTS[data.id];

			console.log("old " + cur.options.hp + " new " + data.hp);
			console.log(data.conditions);
			if (typeof cur.options.hp != "undefined" && cur.options.hp > data.hp && cur.options.custom_conditions.includes("Concentration(Reminder)")) {
				var msgdata = {
					player: cur.options.name,
					img: cur.options.imgsrc,
					text: "<b>Check for concentration!!</b>",
				};

				window.MB.inject_chat(msgdata);
			}
			cur.options.hp = data.hp;


			cur.options.max_hp = data.max_hp;
			cur.options.ac = data.ac;
			cur.options.conditions = data.conditions;

			cur.place();
			window.MB.sendMessage('custom/myVTT/token', cur.options);
		}

		// update combat tracker:

		update_pclist();
	}
	
	convertChat(data,local=false) {
		//Security logic to prevent content being sent which can execute JavaScript.
		data.player = DOMPurify.sanitize( data.player,{ALLOWED_TAGS: []});
		data.img = DOMPurify.sanitize( data.img,{ALLOWED_TAGS: []});
		data.text = DOMPurify.sanitize( data.text,{ALLOWED_TAGS: ['img','div','p', 'b', 'button', 'span', 'style', 'path', 'svg']}); //This array needs to include all HTML elements the extension sends via chat.

		if(data.dmonly && !(window.DM) && !local) // /dmroll only for DM of or the user who initiated it
			return $("<div/>");
				
		if(data.whisper && (data.whisper!=window.PLAYER_NAME) && (!local))
			return $("<div/>");
		//notify_gamelog();
		
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

		return newentry;
		//$(".GameLog_GameLogEntries__3oNPD").prepend(newentry);
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
		if (window.DM) {
			alert('WARNING!!!!!!!!!!!!! ANOTHER USER JOINED AS DM!!!! ONLY ONE USER SHOULD JOIN AS DM. EXITING NOW!!!');
			location.reload();
		}

		if ((!window.DM) && (typeof window.PLAYERDATA !== "undefined")) { // PLAYERS RESEND STATS AFTER SCENE CHANGE.. JUST TO BE SURE
			window.MB.sendMessage('custom/myVTT/playerdata', window.PLAYERDATA);
		}


		window.TOKEN_OBJECTS = {};
		var data = msg.data;

		window.CURRENT_SCENE_DATA = msg.data;

		console.log("SETTO BACKGROUND A " + msg.data);
		$("#tokens").children().remove();

		var old_src = $("#scene_map").attr('src');
		$("#scene_map").attr('src', data.map);
		$("#scene_map").width(data.width);
		$("#scene_map").height(data.height);

		load_scenemap(data.map, data.width, data.height, function() {
			$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 1400);
			$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 1400);
			$("#black_layer").width($("#scene_map").width() * window.ZOOM + 1400);
			$("#black_layer").height($("#scene_map").height() * window.ZOOM + 1400)
			/*if(old_src!=$("#scene_map").attr('src')){
			window.ZOOM=(60.0/window.CURRENT_SCENE_DATA.hpps);		
			$("#VTT").css("transform", "scale("+window.ZOOM+")");
			$("#VTTWRAPPER").width($("#scene_map").width()*window.ZOOM+400);
			$("#VTTWRAPPER").height($("#scene_map").height()*window.ZOOM+400);
			$("#black_layer").width($("#scene_map").width()*window.ZOOM+400);
			$("#black_layer").height($("#scene_map").height()*window.ZOOM+400)
		}*/
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

}

