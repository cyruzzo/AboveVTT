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
			if (msg.eventType == "custom/myVTT/chat") {
				self.handleChat(msg.data);
			}
			if (msg.eventType == "custom/myVTT/CT" && (!window.DM)) {
				self.handleCT(msg.data);
			}
			if (msg.eventType == "custom/myVTT/highlight") {
				if (msg.data.id in window.TOKEN_OBJECTS) {
					window.TOKEN_OBJECTS[msg.data.id].highlight();
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
					var lock_display = $("<div id='lock_display'><h1>LOCKED BY DM</h1><p>The DM is working on your character sheet</p></div>");
					lock_display.css("font-size", "80px");
					lock_display.css('color', "red");
					lock_display.css('position', 'absolute');
					lock_display.css('top', '0px');
					lock_display.css('left', '0px');
					lock_display.width($("#sheet").width());
					lock_display.height($("#sheet").height());
					lock_display.css('padding-top', '50px');
					$("#sheet iframe").css('opacity', '0.8');
					$("#sheet").append(lock_display);
					$("#sheet iframe").attr('disabled', 'disabled');
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



			if (msg.eventType == "custom/myVTT/playerdata") {
				self.handlePlayerData(msg.data);
			}
			if (msg.eventType == "dice/roll/fulfilled") {
				notify_gamelog();
				if (!window.DM)
					return;
				// CHECK FOR INIT ROLLS
				if (msg.data.action == "Initiative") {
					console.log(msg.data);
					var total = msg.data.rolls[0].result.total;
					let entityid = msg.data.context.entityId;
					console.log("cerco " + entityid);

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

	constructor() {
		var self = this;

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

				window.MB.sendMessage('custom/myVTT/chat', msgdata);
				window.MB.handleChat(msgdata);
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

	handleChat(data,local=false) {
		if(data.dmonly && !(window.DM) && !local) // /dmroll only for DM of or the user who initiated it
			return;
		notify_gamelog();
		var newentry = $("<li></li>");
		newentry.attr('class', 'GameLogEntry_GameLogEntry__3EVrE GameLogEntry_Other__2PSbv Flex_Flex__3gB7U Flex_Flex__alignItems-flex-end__YiKos Flex_Flex__justifyContent-flex-start__1lEY5');
		newentry.append($("<p role='img class='Avatar_Avatar__2KZS- Flex_Flex__3gB7U'><img class='Avatar_AvatarPortrait__2dP8u' src='" + data.img + "'></p>"));
		var container = $("<div class='GameLogEntry_MessageContainer__UYzc0 Flex_Flex__3gB7U Flex_Flex__alignItems-flex-start__3ZqUk Flex_Flex__flexDirection-column__1v3au'></div>");
		container.append($("<div class='GameLogEntry_Line__1JeGA GameLogEntry_Sender__2LjcO'><span>" + data.player + "</span></div>"));
		var entry = $("<div class='GameLogEntry_Message__1GoY3 GameLogEntry_Collapsed__1fgGY GameLogEntry_Other__2PSbv Flex_Flex__3gB7U'>" + data.text + "</div>");
		container.append(entry);


		var d = new Date();
		var datetime = d.toISOString();
		container.append($("<time datetime='" + datetime + "' class='GameLogEntry_TimeAgo__1T3dC TimeAgo_TimeAgo__XzWqO'></time"));

		newentry.append(container);

		$(".GameLog_GameLogEntries__33O_1").prepend(newentry);
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
		}
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

