function clearFrame(){
	$(".streamer-canvas").each(function() {
		let canvas=$(this).get(0);
		let ctx=canvas.getContext('2d');
		ctx.clearRect(0,0,canvas.width,canvas.height);	
	});
}
const debounceHandleInjected = mydebounce(() => {	
	const self = window.MB

	let pend_length = self.chat_pending_messages.length;
	for(let i=0;i<pend_length;i++){	
		let current=self.chat_pending_messages.shift();
		
		let injection_id=current.data?.rolls[0]?.rollType;
		let injection_data=current.data?.injected_data;

		let found=false;
		$(self.diceMessageSelector).each(function(){
			if($(this).text()==injection_id){
				found=true;
				let li = $(this).closest("li");
				let oldheight=li.height();
				let newlihtml=self.convertChat(injection_data, current.data.player_name==window.PLAYER_NAME ).html();

				if(newlihtml=="") {
					li.css("display","none"); // THIS IS TO HIDE DMONLY STUFF
				} 
				
			 	li.html(newlihtml);
				if(window.JOURNAL){
					window.JOURNAL.translateHtmlAndBlocks(li);
					add_journal_roll_buttons(li);
					window.JOURNAL.add_journal_tooltip_targets(li);
					add_stat_block_hover(li)
					add_aoe_statblock_click(li);
				}
				let rollType = current.data.injected_data?.rollType?.toLowerCase();
				let rollAction = current.data.injected_data?.rollTitle?.toLowerCase();
				if(rollType != undefined && rollAction != 'initiative' && rollType != "tohit" && rollType != "attack" && rollType != "to hit" && rollType != "save" && rollType != "skill" && rollType != "check" && window.DM){
					let damageButtonContainer = $(`<div class='damageButtonsContainer'></div>`);
					let damageSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="ddbc-svg ddbc-combat-attack__icon-img--weapon-melee ddbc-attack-type-icon ddbc-attack-type-icon--1-1"><path class="prefix__st0" d="M237.9 515.1s-.1-.1 0 0c2-2.7 4.3-5.8 5.3-8.4 0 0-3.8 2.4-7.8 6.1.5.6 1.8 1.7 2.5 2.3zM231.4 517.8c-.2-.2-1.5-1.6-1.5-1.6l-1.6 1 2.4 2.6-3.7 4.6 1 1 3.7-4.3 1.1.9c.4-.5.8-.9 1.2-1.4l.2-.2c-1-.8-1.9-1.7-2.8-2.6zM0 0s6.1 5.8 12.2 11.5l1.4-2.2 1.8 1.3-2.9 2.5 3.7 4.6-1 1-3.7-4.3-2.8 2.5-1.3-1 2-1.6C9.4 14.2 2.2 5.6 0 0z"></path></svg>`
					let healSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="ddbc-svg ddbc-attunement-svg ddbc-healing-icon__icon"><path d="M9.2,2.9c3.4-6.9,13.8,0,6.9,6.9c-6.9,6.9-6.9,10.4-6.9,10.4s0-3.5-6.9-10.4C-4.6,2.9,5.8-4,9.2,2.9"></path></svg>`
					let damageButton = $(`<button class='applyDamageButton flat'>${damageSVG}</button>`);
					let halfDamage = $(`<button class='applyDamageButton resist'>1/2 ${damageSVG}</button>`);
					let doubleDamage = $(`<button class='applyDamageButton vulnerable'>2x${damageSVG}</button>`);
					let healDamage = $(`<button class='applyDamageButton heal'>${healSVG}</button>`);


					damageButtonContainer.off('click.damage').on('click.damage', 'button', function(e){
						const clicked = $(e.currentTarget);

						let damage = current.data.injected_data.result;
						if(clicked.hasClass('resist')){
							damage = Math.max(1, Math.floor(damage/2));
						}
						else if(clicked.hasClass('vulnerable')){
							damage = damage*2;
						}
						else if(clicked.hasClass('heal')){
							damage = -1*damage;
						}
						
						if(is_gamelog_popout()){
							tabCommunicationChannel.postMessage({
								msgType: 'gamelogDamageButtons',
								damage: damage
							});
							return;
						}
						if($(`.tokenselected:not([data-id*='profile'])`).length == 0){
							showTempMessage('No non-player tokens selected');
						}
						
						for(let i=0; i<window.CURRENTLY_SELECTED_TOKENS.length; i++){

							let id = window.CURRENTLY_SELECTED_TOKENS[i];
							let token = window.TOKEN_OBJECTS[id];
							if(token.isPlayer() || token.isAoe())
								continue;
							let newHp = Math.max(0, parseInt(token.hp) - parseInt(damage));

							if(window.all_token_objects[id] != undefined){
								window.all_token_objects[id].hp = newHp;
							}			
							if(token != undefined){		
								token.hp = newHp;
								token.place_sync_persist()
							}		
							addFloatingCombatText(id, damage, damage<0);
						}
					})
					if(rollType == 'damage'){
						damageButtonContainer.append(damageButton, halfDamage, doubleDamage);
					}
					else if(rollType == 'heal'){
						damageButtonContainer.append(healDamage);
					}
					else{
						damageButtonContainer.append(damageButton, halfDamage, doubleDamage, healDamage);
					}
					
					li.find(`[class*='MessageContainer-Flex']`).append(damageButtonContainer);
				}					
				const toSelf = ((current.data.injected_data.whisper == window.PLAYER_NAME || current.data.injected_data.whisper == window.myUser) && current.data.player_name == window.PLAYER_NAME)
				let output = $(`${current.data.injected_data.whisper == '' ? '' : `<div class='above-vtt-roll-whisper'>To: ${toSelf ? `Self` : current.data.injected_data.whisper}</div>`}<div class='above-vtt-container-roll-output'>${li.find('.abovevtt-roll-container').attr('title')}</div>`);
				li.find('.abovevtt-roll-container [class*="Result"]').append(output);
				const aboveSrc = li.find(`[src*='above-bucket'], [href*='above-bucket']`);				
				
				let img = li.find(".magnify");
				for (let i = 0; i < img.length; i++) {
					if ($(img[i]).is('img')) {
						$(img[i]).magnificPopup({ type: 'image', closeOnContentClick: true });
						img[i].onload = () => {
							if (img[i].naturalWidth > 0) {
								$(img[i]).css({
									'display': 'block',
									'width': '100%'
								});
								li.find('.chat-link').css('display', 'none');
							}
							$(img[i]).attr('href', img[i].src);
							newheight = li.find('>[class*="MessageContainer-Flex"]').height();
							li.height(newheight);
						}
						$(img[i]).off('error').on("error", function (e) {
							let el = $(e.target)
							let cur = el.attr("data-current-avatar-url");
							if (cur != undefined) {
								let nextUrl;
								if (cur === "largeAvatarUrl") {
									nextUrl = el.attr("data-large-avatar-url");
									try {
										let parts = nextUrl.split("/");
										parts[parts.length - 2] = "1000";
										parts[parts.length - 3] = "1000";
										nextUrl = parts.join("/");
										el.attr("data-current-avatar-url", "hacky");
									} catch (error) {
										console.warn("imageHtml failed to hack the largeAvatarUrl", el, e);
										nextUrl = el.attr("data-avatar-url");
										el.attr("data-current-avatar-url", "avatarUrl");
									}
								} else if (cur === "hacky") {
									nextUrl = el.attr("data-avatar-url");
									el.attr("data-current-avatar-url", "avatarUrl");
								} else if (cur === "avatarUrl") {
									nextUrl = el.attr("data-basic-avatar-url");
									el.attr("data-current-avatar-url", "basicAvatarUrl");
								} else {
									console.warn("imageHtml failed to load image", el, e);
									return;
								}
								console.log("imageHtml failed to load image. Trying nextUrl", nextUrl, el, e);
								el.attr("src", nextUrl);
								el.attr("href", nextUrl);
							}
						});
					}
					else if ($(img[i]).is('video')) {
						const src = img[i].src;
						$(img[i]).magnificPopup({
							type: 'iframe',
							closeOnContentClick: true,
							callbacks: {
								elementParse: function (item) {
									item.src = `${window.EXTENSION_PATH}iframe.html?src=${encodeURIComponent(item.src)}`;
								}
							}
						});
						img[i].addEventListener('loadeddata', function () {
							if (img[i].videoWidth > 0) {
								$(img[i]).css({
									'display': 'block',
									'width': '100%'
								});
								li.find('.chat-link').css('display', 'none');
							}
							newheight = li.find('>[class*="MessageContainer-Flex"]').height();
							li.height(newheight);
						}, false);
					}
				}
				let newheight = li.find('>[class*="MessageContainer-Flex"]').height();
				li.height(newheight);


				// CHECK FOR SELF ROLLS ADD SEND TO EVERYONE BUTTON
				if ((injection_data.dmonly && window.DM) || toSelf) {

					if (li.find(".gamelog-to-everyone-button").length === 0) {
						const sendToEveryone = $(`<button class="gamelog-to-everyone-button">Send To Everyone</button>`);
						sendToEveryone.click(function (clickEvent) {
							li.css("display", "none");
							delete injection_data.dmonly;
							injection_data.whisper = '';
							self.inject_chat(injection_data); // RESEND THE MESSAGE REMOVING THE "injection only"
						});
						li.find("time").before(sendToEveryone);
					}
				}
				


			}
		});
		if(!found && $('.ct-game-log-pane, [class*="styles_gameLogPane"]').length>0){
			console.warn(`couldn't find a message matching ${JSON.stringify(current)}`);
			// It's possible that we could lose messages due to this not being here, but
			// if we push the message here, we can end up in an infinite loop.
			// We may need to revisit this and do better with error handling if we end up missing too many messages.
			// self.chat_pending_messages.push(current);
		}
	}
}, 500)
const debounceSendNote = mydebounce(function(id, note){
	window.MB.sendMessage('custom/myVTT/note',  {note: note, id: id, from:window.PLAYER_ID})
}, 2000);

const delayedClear = mydebounce(() => clearFrame());

function setupMBIntervals(){
	window.reconnectDelay = 250;
	if(window.pingInterval!=undefined)
		clearInterval(window.pingInterval);
	window.pingInterval = setInterval(function() {
		window.MB.sendPing();
		window.MB.sendAbovePing();
	}, 480000);
}



function addFloatingCombatText(id, damageValue, heal = false){
	if(get_avtt_setting_value('disableCombatText'))
		return;
	let token = $(`#tokens .token[data-id="${id}"]`);
	let combatText = $(`<div style='--font-size: ${parseInt(token.width())}' class='floating-combat-text ${heal ? 'heal' : 'dmg'}'>${heal ? '+' : '-'}${Math.abs(damageValue)}</div>`);
	
	token.append(combatText);

	setTimeout(function(){
		combatText.remove();
	}, 2000)
}
const debounceSyncMeUp = mydebounce(()=>{
	window.MB.sendMessage("custom/myVTT/syncmeup");
}, 2000)
class MessageBroker {

	loadAboveWS(callback=null){
		if(is_gamelog_popout())
			return;
		let self=this;

		if (callback)
			this.callbackAboveQueue.push(callback);
		
		if (this.loadingAboveWS || this.abovews?.readyState == 1) {
			return;
		}
		this.loadingAboveWS=true;
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

		
		this.abovews.onerror = function(errorEvent) {
			self.loadingAboveWS = false;
			try {
				console.error("MB.onerror", errorEvent);
			} catch (err) { // this is probably overkill, but just in case
				console.error("MB.onerror failed to log event", err);
			}
			self.abovews.close();
		};

		this.abovews.onmessage=this.onmessage;

		this.abovews.onopen = function() {
			self.loadingAboveWS = false;
			let recovered = false;
			if (self.callbackAboveQueue.length > 1) {
				recovered = true;
			}
			let cb;
			console.log('Empting callback queue list');
			while (cb = self.callbackAboveQueue.shift()) {
				cb();
			};
			if (recovered && (!window.DM)) {
				console.log('asking the DM for recovery!');
				debounceSyncMeUp();
	 		}
			setupMBIntervals();
		};

		this.abovews.onclose = function() {
			if(is_gamelog_popout())
				return;
			if(self.reconnectTimeout != undefined){
				clearTimeout(self.reconnectTimeout);
			}	
			console.log('Attempting reconnect to Above Websocket');
			if(window.reconnectAttemptAbovews == undefined){
				window.reconnectAttemptAbovews = 0;
			}
			window.reconnectAttemptAbovews++;
			if(window.onCloseNumberPerPopup == undefined){
				window.onCloseNumberPerPopup = 0;
			}
			window.onCloseNumberPerPopup++;
			if(window.onCloseNumberPerPopup > 5 && !get_avtt_setting_value('autoReconnect')){
				self.showDisconnectWarning();
			}	
			else{
				self.reconnectTimeout = setTimeout(function() {
					self.loadAboveWS();	
				}, Math.min(10000,2**window.onCloseNumberPerPopup*window.reconnectDelay));
			}
		};
	}

	loadWS(token, callback = null) {

		if (callback)
			this.callbackQueue.push(callback);

		console.log("LOADING WS: There Are " + this.callbackQueue.length + " elements in the queue");
		if (this.loadingWS || this.ws?.readyState == 1) {
			console.log("ALREADY LOADING A WS");
			return;
		}
		this.loadingWS = true;

		let self = this;
		let url = this.url;
		let userid = this.userid;
		let gameid = this.gameid;

		console.log("STARTING MB WITH TOKEN");

		this.ws = new WebSocket(url + "?gameId=" + gameid + "&userId=" + userid + "&stt=" + token);

		this.ws.onmessage=this.onmessage;


		this.ws.onerror = function() {
			self.loadingWS = false;
			self.ws.close();
		};

		this.ws.onopen = function() {
			self.loadingWS = false;
			let cb;
			console.log('Empting callback queue list');
			while (cb = self.callbackQueue.shift()) {
				cb();
			};
		};
		this.ws.onclose = function() {
			if(is_gamelog_popout())
				return;
			if(self.ddbReconnectTimeout != undefined){
				clearTimeout(self.ddbReconnectTimeout);
			}	
			console.log('Attempting reconnect to DDB Websocket');
			if(window.reconnectAttemptDDBWs == undefined){
				window.reconnectAttemptDDBWs = 0;
			}
			window.reconnectAttemptDDBWs++;
			self.ddbReconnectTimeout = setTimeout(function() {
				get_cobalt_token(function(token) {
					self.loadWS(token, null);
				});
			}, Math.min(10000,2**window.reconnectAttemptDDBWs*window.reconnectDelay));
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
		if(data != undefined)
			self.chat_pending_messages.push(data);

		if (trackHistory) {
			window.MB.track_message_history(data);
		}


		if(window.DM && data.data.injected_data?.rollTitle == 'Initiative'){
			let total = parseFloat(data.data.injected_data?.result);
			let entityid = data.data.injected_data?.entityId ? data.data.injected_data?.entityId : data.data.injected_data?.playerId;


			let monsterTokenExists = window.TOKEN_OBJECTS[entityid] != undefined;
			let playerExists = window.pcs.filter(d=> d.characterId == entityid).length>0;
			

			if(monsterTokenExists || playerExists){
				if(data.data.injected_data?.entityId){
					let monsterid = window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.monster
					if(monsterid =='open5e')
					{
						window.StatHandler.getStat(monsterid, function(data) {
							total = parseFloat(total + data.stats[1].value/100).toFixed(2);
						}, window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.itemId);
					}
					else if(monsterid =='customStat'){
						let decimalAdd = (window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.customInit != undefined || (window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.customStat != undefined && window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.customStat[1]?.mod != undefined)) ? ((window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.customStat[1]?.mod*2)+10)/100 : 0
						total = parseFloat(total + decimalAdd).toFixed(2);
					}
					else{
						window.StatHandler.getStat(monsterid, function(stat) {
								total = parseFloat(total + stat.data.stats[1].value/100).toFixed(2);
						}, window.TOKEN_OBJECTS[data.data.injected_data?.entityId]?.options?.itemId);
					}
				}
				else{
					let dexScore = window.pcs.filter(d=> d.characterId == entityid)[0].abilities[1].score;		
					if(dexScore){
						total = parseFloat(total + dexScore/100).toFixed(2);
					}
				}


				let combatSettingData = getCombatTrackersettings();
				if(combatSettingData['tie_breaker'] !='1'){
					total = parseInt(total);
				}
				$("#tokens .VTTToken").each(
					function(){
						let converted = $(this).attr('data-id').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
						if(converted==entityid){
							ct_add_token(window.TOKEN_OBJECTS[$(this).attr('data-id')]);
							window.all_token_objects[$(this).attr('data-id')].options.init = total;
							window.TOKEN_OBJECTS[$(this).attr('data-id')].options.init = total;
							window.TOKEN_OBJECTS[$(this).attr('data-id')].update_and_sync();
						}
					}
				);

				$("#combat_area tr").each(function() {
					let converted = $(this).attr('data-target').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
					if (converted == entityid) {
						$(this).find(".init").val(total);
						window.all_token_objects[$(this).attr('data-target')].options.init = total;
						window.TOKEN_OBJECTS[$(this).attr('data-target')].options.init = total;
						window.TOKEN_OBJECTS[$(this).attr('data-target')].update_and_sync();
					}
				});
				debounceCombatReorder(true);
			}

			
		}

		// start the task
		debounceHandleInjected();

	}

	constructor() {
		let self = this;
		
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
		this.diceMessageSelector = "[class*='DiceMessage_RollType']";
		if (is_encounters_page() || is_characters_page() || is_campaign_page()) {
			this.diceMessageSelector = "[class*='-RollType']";
		} 

		this.origRequestAnimFrame = null;
		this.lastAlertTS = 0;
		this.latestVersionSeen = window.AVTT_VERSION;

		this.onmessage = async function(event,tries=0) {
			if (event.data == "pong")
				return;
			if (event.data == "ping")
				return;

			let msg = {};
			try {
				msg = JSON.parse(event.data);
			} catch (parsingError) {
				console.error("MB.onmessage failed to handle", event, parsingError);
				return;
			}
			if (window.location.search.includes("popoutgamelog=true") && msg.eventType != "dice/roll/pending" && msg.eventType != "dice/roll/fulfilled")
				return;
			console.log(msg.eventType);
			
			if(msg.sender){ // THIS MESSAGE CONTAINS DATA FOR TELEMEMTRY (from AboveWS)
				if(msg.sender==self.mysenderid){
					self.stats.reflected++;
					console.warn("WARNING. WE RECEIVED BACK OUR OWN MESSAGE - IGNORING");
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

			// WE NEED TO IGNORE CERTAIN MESSAGE IF THEY'RE NOT FROM THE CURRENT SCENE
			if (msg.sceneId && window.CURRENT_SCENE_DATA && msg.sceneId !== window.CURRENT_SCENE_DATA.id && [
				"custom/myVTT/delete_token",
				"custom/myVTT/createtoken",
				"custom/myVTT/reveal",
				"custom/myVTT/fogdata",
				"custom/myVTT/drawing",
				"custom/myVTT/drawdata",
				"custom/myVTT/highlight",
				"custom/myVTT/pointer",
				"custom/myVTT/place-extras-token"
			].includes(msg.eventType)) {
				console.log("skipping msg from a different scene");
				return;
			}

			if (msg.eventType == "custom/myVTT/token" && (msg.sceneId == window.CURRENT_SCENE_DATA.id || msg.data.id in window.TOKEN_OBJECTS)) {
				self.handleToken(msg);
			}
			if(msg.eventType=="custom/myVTT/delete_token"){
				let tokenid=msg.data.id;
				if(tokenid in window.TOKEN_OBJECTS){
					window.TOKEN_OBJECTS[tokenid].options.deleteableByPlayers = true;
					window.TOKEN_OBJECTS[tokenid].delete(false);
				}
			}
			if(msg.eventType == "custom/myVTT/createtoken"){
				if(window.DM){
					let left = parseInt(msg.data.left);
					let top = parseInt(msg.data.top);
					if (!isNaN(top) && !isNaN(left)) {
						place_token_at_map_point(msg.data, left, top);
					} else {
						place_token_in_center_of_view(msg.data);
					}
				}
			}
			if(msg.eventType == "custom/myVTT/deleteExplore"){
				if(!window.DM){
					deleteExploredScene(msg.data.sceneId)
				}
			}
			if(msg.eventType == "custom/myVTT/place-extras-token"){
				if(window.DM){
					let left = parseInt(msg.data.centerView.x);
					let top = parseInt(msg.data.centerView.y);
					let monsterId = msg.data.monsterData.baseId;
					fetch_and_cache_monsters([monsterId], function(){
						create_and_place_token(window.cached_monster_items[monsterId], undefined, undefined, left, top, undefined, undefined, true, msg.data.extraOptions)
					});
				}
			}
			if (msg.eventType == "custom/myVTT/open-url-embed"){
				const url = msg.data;
				display_url_embeded(url);
			}
			if (msg.eventType === "custom/myVTT/fetchscene") {

				if(msg.data.sceneid.players){
					if(msg.data.sceneid[window.PLAYER_ID] !== undefined)
						msg.data.sceneid = msg.data.sceneid[window.PLAYER_ID];
					else
						msg.data.sceneid = msg.data.sceneid.players
				}

				if (msg.data?.sceneid) {
					if(window.LOADING){
						if(window.handleSceneQueue == undefined){
							window.handleSceneQueue = [];
						}
						window.handleSceneQueue.push(msg);
					}
					else{
						AboveApi.getScene(msg.data.sceneid).then((response) => {
							self.handleScene(response);
						}).catch((error) => {
							console.error("Failed to download scene", error);
						});
					}
					
				}
				delete window.startupSceneId; // we only want to prevent a double load of the initial scene, so we want to delete this no matter what.
			}

			if(msg.eventType == "custom/myVTT/update_dm_player_scenes"){
				if(window.DM){
					window.splitPlayerScenes = msg.data.splitPlayerScenes;
					did_update_scenes();
				}
				
			}
			if (msg.eventType == "custom/myVTT/scene") {
				self.handleScene(msg);
			}
			if (msg.eventType == "custom/myVTT/syncmeup") {
				self.handleSyncMeUp(msg);
			}
			if (msg.eventType == "custom/myVTT/audioPlayingSyncMe") {
				self.handleAudioPlayingSync(msg);
			}
			if(msg.eventType == ('custom/myVTT/character-update')){
				update_pc_with_data(msg.data.characterId, msg.data.pcData);
			}
			if(msg.eventType == ('character-sheet/character-update/fulfilled')) {
				console.log('update_pc character-sheet/character-update/fulfilled', msg);
				update_pc_with_api_call(msg.data?.characterId);
			}

			if (msg.eventType == "custom/myVTT/reveal") {
				window.REVEALED.push(msg.data);
				redraw_fog();
				check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
			}

			if(msg.eventType== "custom/myVTT/fogdata"){ // WE RESEND ALL THE FOG EVERYTIME NOW
				window.REVEALED=msg.data;
				redraw_fog();
				check_token_visibility();
			}

			if (msg.eventType == "custom/myVTT/drawing") {
				window.DRAWINGS.push(msg.data);
				redraw_light_walls();		
				redraw_drawings();
				redraw_elev();
				redraw_text();
				redraw_drawn_light();
				redraw_light();

			}

			if(msg.eventType=="custom/myVTT/drawdata"){
				window.DRAWINGS=msg.data;
				redraw_light_walls();
				redraw_elev();
				redraw_drawings();
				redraw_text();
				redraw_drawn_light();
				redraw_light();
			}
			if(msg.eventType=="custom/myVTT/forceRedrawLight"){
				redraw_light(true);
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
				set_pointer(msg.data,(!msg.data.dm || (msg.data.dm && !msg.data.center_on_ping)));
			}

			if (msg.eventType == "custom/myVTT/lock") {
				if (window.DM)
					return;
				if (getPlayerIDFromSheet(msg.data.player_sheet) == window.PLAYER_ID) {
					//alert('locked');
					let lock_display = $("<div id='lock_display'>The DM is looking at your character sheet</p></div>");
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
					window.JOURNAL.persist(true);
				}
			}
			
			if(msg.eventType=="custom/myVTT/note"){
				if(!window.DM || (msg.data.from && msg.data.from != window.PLAYER_ID)){
					if(msg.data.delete == true){
						delete window.JOURNAL.notes[msg.data.id]
						window.JOURNAL.build_journal();
						if(msg.data.id in window.TOKEN_OBJECTS){
							window.TOKEN_OBJECTS[msg.data.id].place();			
						}
						return;
					}
					window.JOURNAL.notes[msg.data.id]=msg.data.note;
					
					window.JOURNAL.build_journal();
					
					if(msg.data.id in window.TOKEN_OBJECTS){
						window.TOKEN_OBJECTS[msg.data.id].place();			
					}			
					const openNote = $(`.note[data-id='${msg.data.id}']`);
					// If the 'Open' button is clicked OR the note is already opened by a player and it is saved 
					// by the DM, the note gets refreshed.
					if (msg.data.popup == true || (msg.data.popup == undefined && openNote.length != 0)){
						window.JOURNAL.display_note(msg.data.id);
					} else if (msg.data.popup == false) {
						openNote.remove();
					}
					

					if(window.JOURNAL.notes[msg.data.id].abilityTracker && openNote.length>0){
						for(let i in window.JOURNAL.notes[msg.data.id].abilityTracker){
							openNote.find(`input[data-tracker-key='${i}']`).val(window.JOURNAL.notes[msg.data.id].abilityTracker[i])
						}
					}

					if(window.JOURNAL.notes[msg.data.id].pins && openNote.length>0){
						for(let i in window.JOURNAL.notes[msg.data.id].pins){
							$(`div.note[data-id='${msg.data.id}'] .note-pin[data-id='${i}']`).css({
								'top': `${parseFloat(window.JOURNAL.notes[msg.data.id].pins[i].y) - 43}px`,
								'left': window.JOURNAL.notes[msg.data.id].pins[i].x
							})	
						}
					}

					window.JOURNAL.persist(true);

				}
			}
			if(msg.eventType=="custom/myVTT/notesSync"){
				if(!window.DM){
					for(let i in msg.data.notes){
						let noteId = msg.data.notes[i].id;
						window.JOURNAL.notes[noteId] = msg.data.notes[i];
						delete window.JOURNAL.notes[noteId].id;
						if(window.TOKEN_OBJECTS[noteId] != undefined){
							const placedToken = $(`#tokens div[data-id='${noteId}']`);
							window.TOKEN_OBJECTS[noteId].build_conditions(placedToken);	
						}	
					}			
					window.JOURNAL.build_journal();			
					window.JOURNAL.persist(true);	
				}
			}
			if(msg.eventType=="custom/myVTT/DMAvatar"){
				dmAvatarUrl = msg.data.avatar;
				$(`.player-card[data-player-id=''] .player-token img`).attr('src', dmAvatarUrl);
			}
		
			if(msg.eventType=="custom/myVTT/pausePlayer"){
				if(!window.DM){
					$("#VTT").toggleClass('paused', msg.data.paused);
				}
				if(msg.data.paused){
					if($(".paused-indicator").length == 0){
						let pausedIndicator = $(`
							<div class="paused-indicator">
								<div class="paused-status-indicator__subtext">Game Paused. Waiting for DM</div>
								<svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
							</div>
						`);			
						$("body").append(pausedIndicator);
					}
					if(!window.DM){
						deselect_all_tokens();
					}
				}
				else{
					$(".paused-indicator").remove();
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
					if($("[name='streamDiceRolls'].rc-switch-checked").length > 0) {
						window.MB.sendMessage("custom/myVTT/enabledicestreamingfeature")
					}
					window.JOURNAL.sync();
					window.MB.sendMessage("custom/myVTT/DMAvatar", {
						avatar: dmAvatarUrl
					})
				}

				if (msg.data && msg.data.player_id && msg.data.pc) {
					// a player just joined and gave us their pc data, so let's update our window.pcs with what they gave us
					update_pc_with_data(msg.data.player_id, msg.data.pc);
				}
				if (is_characters_page()) {
					// a player just joined so send them our pc data
					window.MB.sendMessage("custom/myVTT/pcsync", {
						player_id: window.PLAYER_ID,
						pc: read_pc_object_from_character_sheet(window.PLAYER_ID)
					});
				}
			}
			if(msg.eventType==="custom/myVTT/pcsync"){
				// a player just sent us their pc data, so let's update our window.pcs with what they gave us
				if (msg.data && msg.data.player_id && msg.data.pc) {
					update_pc_with_data(msg.data.player_id, msg.data.pc);
				}
			}
			if(msg.eventType == "custom/myVTT/endplayerturn" && window.DM){
				let tokenId = $("#combat_area tr[data-current=1]").attr('data-target');
				if(tokenId.endsWith(`characters/${msg.data.from}`) || window.all_token_objects[tokenId].options.player_owned)
					$("#combat_next_button").click();				

			}
			if(msg.eventType=="custom/myVTT/mixer"){
				handle_mixer_event(msg.data);
			}
			if(msg.eventType=="custom/myVTT/soundpad"){
				build_soundpad(msg.data.soundpad, msg.data.playing);
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
				if(window.YTPLAYER?.setVolume){
						window.YTPLAYER.setVolume(msg.data.volume*$("#master-volume input").val());
				}
				if($('video#scene_map').length > 0){
					$('video#scene_map')[0].volume = msg.data.volume/100*$("#master-volume input").val();
					$('video#scene_map').attr('data-volume', msg.data.volume/100)
				}

			}

			if (msg.eventType == "dice/roll/pending"){
				// check for injected_data!
				if(msg.data.injected_data){
					notify_gamelog();
					self.handle_injected_data(msg);
				}
			}
			

			if(msg.eventType == "custom/myVTT/whatsyourdicerolldefault"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!diceplayer_id)  || (msg.data.to!= diceplayer_id) )
					return;
				let sendToText = gamelog_send_to_text()	
				if(sendToText == "Everyone") {
					window.MB.sendMessage("custom/myVTT/revealmydicestream",{
						streamid: diceplayer_id
					});		
				}
				else if(sendToText == "Dungeon Master"){
					window.MB.sendMessage("custom/myVTT/showonlytodmdicestream",{
						streamid: diceplayer_id
					});
				}
				else{
					window.MB.sendMessage("custom/myVTT/hidemydicestream",{
						streamid: diceplayer_id
					});
				}
			}

			if(msg.eventType == "custom/myVTT/turnoffsingledicestream"){
				let dicePeer = window.diceCurrentPeers.filter(d=> d.peer==msg.data.from)[0]
				if(dicePeer === undefined || (msg.data.to != "everyone" && msg.data.to != diceplayer_id)){
				 return;
				}	
				$("[id^='streamer-"+msg.data.from+"']").remove();
				dicePeer.close();
				if(msg.data.to != "everyone"){
					window.MB.inject_chat({
              player: window.PLAYER_NAME,
              img: window.PLAYER_IMG,
              text: `<span class="flex-wrap-center-chat-message">One of your dice stream connections has failed/disconnected. Try reconnecting to the dice stream if this was not intentional.<br/><br/></div>`,
              whisper: window.PLAYER_NAME
          });
				}
			}

			if(msg.eventType == "custom/myVTT/disabledicestream"){
				enable_dice_streaming_feature(false);
			}

			if(msg.eventType == "custom/myVTT/showonlytodmdicestream"){
				if(!window.DM){		
					hideDiceVideo(msg.data.streamid);
				}		
				else{
					revealDiceVideo(msg.data.streamid);
				}
			}
			if(msg.eventType == "custom/myVTT/hidemydicestream"){
					hideDiceVideo(msg.data.streamid);
			}
			if(msg.eventType == "custom/myVTT/revealmydicestream"){
					revealDiceVideo(msg.data.streamid);
			}
			if(msg.eventType == "custom/myVTT/enabledicestreamingfeature"){
					enable_dice_streaming_feature(true);				
			}
					


			if(msg.eventType == "custom/myVTT/wannaseemydicecollection"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID))
					return;
				const configuration = {
    				iceServers:  [{urls: "stun:stun.l.google.com:19302"}]
  				};
				let peer= new RTCPeerConnection(configuration);

				if(window.MYMEDIASTREAM){
					let stream = window.MYMEDIASTREAM;
					stream.getTracks().forEach(track => peer.addTrack(track, stream));
				}

				peer.addEventListener('track', (event) => {
					console.log("aggiungo video!!!!");
				     addVideo(event.streams[0],msg.data.from);
				});
				window.makingOffer = [];
				window.makingOffer[msg.data.from] = false;
				peer.onconnectionstatechange=() => {
					if(peer.connectionState=="connected"){
						window.MB.inject_chat({
                player: window.PLAYER_NAME,
                img: window.PLAYER_IMG,
                text: `<span class="flex-wrap-center-chat-message"><p>A dice stream peer has ${peer.connectionState}. <br/><br/></div>`,
                whisper: window.PLAYER_NAME,
	          });
					}

					if(peer.connectionState=="closed" || peer.connectionState=="failed" || peer.connectionState == "disconnected"){
						peer.restartIce();
						window.MB.inject_chat({
                player: window.PLAYER_NAME,
                img: window.PLAYER_IMG,
                text: `<span class="flex-wrap-center-chat-message"><p>A dice stream connection has ${peer.connectionState}.</p><p> An automatic reconnect is being attempted. </p><p>If you are still unable to see one or more of your groups dice you may have to manually disable then reenable your dice stream in the chat above.</p><br/><br/></div>`,
                whisper: window.PLAYER_NAME,
	          });	          
					}
				};
				peer.onnegotiationneeded = () => {
					try {
						window.makingOffer[msg.data.from] = true;
						peer.createOffer({offerToReceiveVideo: 1}).then( (desc) => {
							console.log("fatto setLocalDescription");
							peer.setLocalDescription(desc);
							self.sendMessage("custom/myVTT/okletmeseeyourdice",{
								to: msg.data.from,
								from: window.MYSTREAMID,
								offer: desc,
								dm: window.DM
							})
						});
					} catch(err) {
						console.error(err);
					} finally {
						setTimeout(function(){
							window.makingOffer[msg.data.from] = false;
						}, 500)		    
					}	
				};
			 		
				peer.onicecandidate = e => {
					window.MB.sendMessage("custom/myVTT/iceforyourgintonic",{
						to: msg.data.from,
						from: window.MYSTREAMID,
						ice: e.candidate
					})
				};				
				window.STREAMPEERS[msg.data.from]=peer;				
			}


			if(msg.eventType == "custom/myVTT/okletmeseeyourdice"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID)  || (msg.data.to!= window.MYSTREAMID) )
					return;
				const configuration = {
    				iceServers:  [{urls: "stun:stun.l.google.com:19302"}]
  				};
				let peer= new RTCPeerConnection(configuration);

				if(window.MYMEDIASTREAM){
					let stream=  window.MYMEDIASTREAM;
					stream.getTracks().forEach(track => peer.addTrack(track, stream));
				}

				peer.addEventListener('track', (event) => {
					console.log("aggiungo video!!!!");
				  addVideo(event.streams[0],msg.data.from);
				});
				window.makingOffer = [];
				window.makingOffer[msg.data.from] = false;
				peer.onnegotiationneeded = () => {
					try {
						window.makingOffer[msg.data.from] = true;
						peer.createOffer({offerToReceiveVideo: 1}).then( (desc) => {
							console.log("fatto setLocalDescription");
							peer.setLocalDescription(desc);
							self.sendMessage("custom/myVTT/okletmeseeyourdice",{
								to: msg.data.from,
								from: window.MYSTREAMID,
								offer: desc,
								dm: window.DM
							})
						});
					} catch(err) {
						console.error(err);
					} finally {
						setTimeout(function(){
							window.makingOffer[msg.data.from] = false;
						}, 500)		    
					}	
				};
				peer.onconnectionstatechange=() => {
					if(peer.connectionState=="connected"){
						window.MB.inject_chat({
                player: window.PLAYER_NAME,
                img: window.PLAYER_IMG,
                text: `<span class="flex-wrap-center-chat-message"><p>A dice stream peer has ${peer.connectionState}. <br/><br/></div>`,
                whisper: window.PLAYER_NAME,
	          });
					}
					if((peer.connectionState=="closed") || (peer.connectionState=="failed" || peer.connectionState == "disconnected")){
						peer.restartIce();
						window.MB.inject_chat({
                player: window.PLAYER_NAME,
                img: window.PLAYER_IMG,
                text: `<span class="flex-wrap-center-chat-message"><p>A dice stream connection has ${peer.connectionState}.</p><p> An automatic reconnect is being attempted. </p><p>If you are still unable to see one or more of your groups dice you may have to manually disable then reenable your dice stream in the chat above.</p><br/><br/></div>`,
                whisper: window.PLAYER_NAME,
	          });
					}
				};
		
				peer.onicecandidate = e => {
					window.MB.sendMessage("custom/myVTT/iceforyourgintonic",{
						to: msg.data.from,
						from: window.MYSTREAMID,
						ice: e.candidate
					})
				};				
				window.STREAMPEERS[msg.data.from]=peer;	
				let ignoreOffer = false;
				if(msg.data.offer){
					const offerCollision = (msg.data.offer.type == "offer") && (window.makingOffer[msg.data.from] || window.STREAMPEERS[msg.data.from].signalingState != "stable")
				  let myStreamParse = parseInt(window.MYSTREAMID) || 0;
				  let fromStreamParse = parseInt(msg.data.from) || 0;
				  ignoreOffer = (((myStreamParse > fromStreamParse) && !msg.data.dm) || window.DM) && offerCollision
				  if (ignoreOffer) {
				    return;
				  }
				}		
				peer = window.STREAMPEERS[msg.data.from];
				peer.setRemoteDescription(msg.data.offer);
				console.log("fatto setRemoteDescription");
				window.STREAMPEERS[msg.data.from] = peer;	
	
		
				peer.createAnswer().then( (desc) => {
				peer.setLocalDescription(desc);
				console.log("fatto setLocalDescription");
					
				window.MB.sendMessage("custom/myVTT/okseethem",{
						from: window.MYSTREAMID,
						to: msg.data.from,
						answer: desc
					});
			});
				
				window.STREAMPEERS[msg.data.from] = peer;					
			}

			if(msg.eventType == "custom/myVTT/okseethem"){
				if( !window.JOINTHEDICESTREAM)
					return;
				if( (!window.MYSTREAMID)  || (msg.data.to!= window.MYSTREAMID) )
					return;

				let peer=window.STREAMPEERS[msg.data.from];
				peer.setRemoteDescription(msg.data.answer);
				console.log("fatto setRemoteDescription");
			}
			
			if (msg.eventType == "dice/roll/fulfilled") {
				notify_gamelog();
				const gamelogItem = $(`ol[class*='-GameLogEntries'] li`).first(); 
				if (msg.avttExpression !== undefined && msg.avttExpressionResult !== undefined) {	
					gamelogItem.attr("data-avtt-expression", msg.avttExpression);
					gamelogItem.attr("data-avtt-expression-result", msg.avttExpressionResult);
					replace_gamelog_message_expressions(gamelogItem);
				}


				if(msg.data.rolls != undefined){
					let critSuccess = {};
					let critFail = {};


					for(let i=0; i<msg.data.rolls.length; i++){
						let roll = msg.data.rolls[i];
						critSuccess[i] = false;
						critFail[i] = false;

						for (let j=0; j<roll.diceNotation.set.length; j++){
							for(let k=0; k<roll.diceNotation.set[j].dice.length; k++){
								let reduceCrit = 0;
								if(parseInt(roll.diceNotation.set[j].dice[k].dieType.replace('d', '')) == 20){
                  					reduceCrit = 20 - msg.data.critRange;
								}
								else if(msg.data.rolls[0].rollType == 'attack' || msg.data.rolls[0].rollType == 'to hit' || msg.data.rolls[0].rollType == 'tohit' ){
									continue;
								}
								if(roll.diceNotation.set[j].dice[k].dieValue >= parseInt(roll.diceNotation.set[j].dice[k].dieType.replace('d', ''))-reduceCrit && roll.result.values.includes(roll.diceNotation.set[j].dice[k].dieValue)){
									if(roll.rollKind == 'advantage'){
										if(k>0 && roll.diceNotation.set[j].dice[k-1].dieValue <= roll.diceNotation.set[j].dice[k].dieValue){
											critSuccess[i] = true;
										}
										else if(k==0 && roll.diceNotation.set[j].dice[k+1].dieValue <= roll.diceNotation.set[j].dice[k].dieValue){
											critSuccess[i] = true;
										}
									}
									else if(roll.rollKind == 'disadvantage' && roll.diceNotation.set[j].dice[1].dieValue == roll.diceNotation.set[j].dice[0].dieValue){
										critSuccess[i] = true;
									}
									else if(roll.rollKind != 'disadvantage'){
										critSuccess[i] = true;
									}		
								}
								else if(roll.diceNotation.set[j].dice[k].dieValue == 1 && roll.result.values.includes(roll.diceNotation.set[j].dice[k].dieValue)){
									if(roll.rollKind == 'disadvantage'){
										if(k>0 && roll.diceNotation.set[j].dice[k-1].dieValue >= roll.diceNotation.set[j].dice[k].dieValue){
											critFail[i] = true;
										}
										else if(k==0 && roll.diceNotation.set[j].dice[k+1].dieValue >= roll.diceNotation.set[j].dice[k].dieValue){
											critFail[i] = true;
										}
									}
									else if(roll.rollKind == 'advantage' && roll.diceNotation.set[j].dice[1].dieValue == roll.diceNotation.set[j].dice[0].dieValue){
										critFail[i] = true;
									}
									else if(roll.rollKind != 'advantage'){
										critFail[i] = true;
									}		
								}
							}
						}
					}


					setTimeout(function(){
						let target;
						let listItems = $(`ol>li[class*='GameLogEntry']`);
						for(let i = 0; i<listItems.length; i++){
							if($(listItems[i]).find('[class*="Pending"]').length > 0)
								continue;
							if(target != undefined)
								break;
							for(let j = 0; j < msg.data.rolls.length; j++){
								if(target != undefined)
										break;
								let totals = $(listItems[i]).find(`[class*='TotalContainer-Flex']>div[class*='Total-']`);
								if(totals.length == msg.data.rolls.length){
									for(let k = 0; k<totals.length; k++){
											if(parseInt($(totals[k]).find('span').text()) != msg.data.rolls[k].result.total)
												break;
											target = $(listItems[i]);
									}
									
								}
							}		
						}
						if(target != undefined){
							let allRollsTotal = 0;
							for(let i = 0; i<msg.data.rolls.length; i++){
								let row = i
								if(!target.attr('class').includes('-Collapsed-ref')){
									row = row*2+1
								}else{
									row++;
								}
								target.find(`[class*='DiceResultContainer']:nth-of-type(${row})`).toggleClass(`${critSuccess[i] && critFail[i] ? 'crit-mixed' : critSuccess[i] ? 'crit-success' : critFail[i] ? 'crit-fail' : ''}`, true)
								if(msg.avttSpellSave !== undefined){
							
									let totalContainer = target.find(`[class*='DiceResultContainer']:nth-of-type(${row}) [class*='TotalContainer-Flex']`);
							    if (totalContainer.length > 0) {
							        let spellSave = msg.avttSpellSave;
							        if (spellSave !== undefined && spellSave.length > 0) {
							            totalContainer.append(`${spellSave != undefined ? `<div class='custom-spell-save-text'><span class='data-spellSave' data-avtt-spellSave='${spellSave}'>${spellSave}</span></div>` : ''}`);
							        }
							    }
								}
								if(msg.avttDamageType !== undefined){
							
									let damageContainer = target.find(`[class*='DiceResultContainer']:nth-of-type(${row}) [class*='Line-Title']>[class*='-RollType']`);
							    if (damageContainer.length > 0) {
							        let damageType = msg.avttDamageType;
							        if (damageType !== undefined && damageType.length > 0) {
							            damageContainer.text(`${damageType} ${damageContainer.text()}`)
							        }
							    }
								}
								allRollsTotal += msg.data.rolls[i].result.total;
							}

							if(window.DM){
								let rollType = msg.data.rolls[0].rollType.toLowerCase();
								let rollAction = msg.data.action.toLowerCase();
								if(rollType != undefined && rollAction != 'initiative' && rollType != "tohit" && rollType != "attack" && rollType != "to hit" && rollType != "save" && rollType != "skill" && rollType != "check" && window.DM){
									let damageButtonContainer = $(`<div class='damageButtonsContainer'></div>`);
									let damageSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="ddbc-svg ddbc-combat-attack__icon-img--weapon-melee ddbc-attack-type-icon ddbc-attack-type-icon--1-1"><path class="prefix__st0" d="M237.9 515.1s-.1-.1 0 0c2-2.7 4.3-5.8 5.3-8.4 0 0-3.8 2.4-7.8 6.1.5.6 1.8 1.7 2.5 2.3zM231.4 517.8c-.2-.2-1.5-1.6-1.5-1.6l-1.6 1 2.4 2.6-3.7 4.6 1 1 3.7-4.3 1.1.9c.4-.5.8-.9 1.2-1.4l.2-.2c-1-.8-1.9-1.7-2.8-2.6zM0 0s6.1 5.8 12.2 11.5l1.4-2.2 1.8 1.3-2.9 2.5 3.7 4.6-1 1-3.7-4.3-2.8 2.5-1.3-1 2-1.6C9.4 14.2 2.2 5.6 0 0z"></path></svg>`
									let healSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="ddbc-svg ddbc-attunement-svg ddbc-healing-icon__icon"><path d="M9.2,2.9c3.4-6.9,13.8,0,6.9,6.9c-6.9,6.9-6.9,10.4-6.9,10.4s0-3.5-6.9-10.4C-4.6,2.9,5.8-4,9.2,2.9"></path></svg>`
									let damageButton = $(`<button class='applyDamageButton flat'>${damageSVG}</button>`);
									let halfDamage = $(`<button class='applyDamageButton resist'>1/2 ${damageSVG}</button>`);
									let doubleDamage = $(`<button class='applyDamageButton vulnerable'>2x${damageSVG}</button>`);
									let healDamage = $(`<button class='applyDamageButton heal'>${healSVG}</button>`);


									damageButtonContainer.off('click.damage').on('click.damage', 'button', function(e){
										const clicked = $(e.currentTarget);

										let damage = allRollsTotal;
										if(clicked.hasClass('resist')){
											damage = Math.max(1, Math.floor(damage/2));
										}
										else if(clicked.hasClass('vulnerable')){
											damage = damage*2;
										}
										else if(clicked.hasClass('heal')){
											damage = -1*damage;
										}

										if(is_gamelog_popout()){
											tabCommunicationChannel.postMessage({
						           msgType: 'gamelogDamageButtons',
						           damage: damage
						          });
						          return;
										}
										if($(`.tokenselected:not([data-id*='profile'])`).length == 0){
											showTempMessage('No non-player tokens selected');
										}
										for(let i=0; i<window.CURRENTLY_SELECTED_TOKENS.length; i++){

											let id = window.CURRENTLY_SELECTED_TOKENS[i];
											let token = window.TOKEN_OBJECTS[id];
											if(token.isPlayer() || token.isAoe())
												continue;
											let newHp = Math.max(0, parseInt(token.hp) - parseInt(damage));

											if(window.all_token_objects[id] != undefined){
												window.all_token_objects[id].hp = newHp;
											}			
											if(token != undefined){		
												token.hp = newHp;
												token.place_sync_persist()
												addFloatingCombatText(id, damage, damage<0);
											}		
										}

									})
									if(rollType == 'damage'){
										damageButtonContainer.append(damageButton, halfDamage, doubleDamage);
									}
									else if(rollType == 'heal'){
										damageButtonContainer.append(healDamage);
									}
									else{
										damageButtonContainer.append(damageButton, halfDamage, doubleDamage, healDamage);
									}
								
									target.find(`[class*='MessageContainer-Flex']`).append(damageButtonContainer);
									
									
								}
								// CHECK FOR SELF ROLLS ADD SEND TO EVERYONE BUTTON
								if (msg.messageScope === "userId" && target.find(".gamelog-to-everyone-button").length === 0) {
									const sendToEveryone = $(`<button class="gamelog-to-everyone-button">Send To Everyone</button>`);
									sendToEveryone.click(function (clickEvent) {
										let resendMessage = msg;
										resendMessage.id = uuid();
										resendMessage.data.rollId = uuid();
										resendMessage.messageScope = "gameId";
										resendMessage.messageTarget = find_game_id();
										resendMessage.dateTime = Date.now();
										window.diceRoller.ddbDispatch(resendMessage);
									});
									target.find("time").before(sendToEveryone);
								}
							}

						}
						
					}, 100)
				}
				
				
				if (!window.DM)
					return;
				
				// CHECK FOR INIT ROLLS (auto add to combat tracker)
				if (msg.data.action.toLowerCase() == "initiative") {
					console.log(msg.data);
					let total = parseFloat(msg.data.rolls[0].result.total);
					let entityid = msg.data.context.entityId;
					
					let monsterTokenExists = window.TOKEN_OBJECTS[entityid] != undefined;
					let playerExists = window.pcs.filter(d=> d.characterId == entityid).length>0;
					if(monsterTokenExists || playerExists){
						if(msg.data.context?.entityType == 'monster'){
							let monsterid = window.TOKEN_OBJECTS[entityid]?.options?.monster
							if(monsterid =='open5e')
							{
								window.StatHandler.getStat(monsterid, function(data) {
									total = parseFloat(total + data.stats[1].value/100).toFixed(2);
								}, window.TOKEN_OBJECTS[entityid]?.options?.itemId);
							}
							else if(monsterid =='customStat'){
								let decimalAdd = (window.TOKEN_OBJECTS[entityid]?.options?.customInit != undefined || (window.TOKEN_OBJECTS[entityid]?.options?.customStat != undefined && window.TOKEN_OBJECTS[entityid]?.options?.customStat[1]?.mod != undefined)) ? ((window.TOKEN_OBJECTS[entityid]?.options?.customStat[1]?.mod*2)+10)/100 : 0
								total = parseFloat(total + decimalAdd).toFixed(2);
							}
							else{
								window.StatHandler.getStat(monsterid, function(stat) {
										total = parseFloat(total + stat.data.stats[1].value/100).toFixed(2);
								}, window.TOKEN_OBJECTS[entityid]?.options?.itemId);
							}
						}
						else{
							let dexScore = window.pcs.filter(d=> d.characterId == entityid)[0].abilities[1].score;		
							if(dexScore){
								total = parseFloat(total + dexScore/100).toFixed(2);
							}
						}
						
						let combatSettingData = getCombatTrackersettings();
						if(combatSettingData['tie_breaker'] !='1'){
							total = parseInt(total);
						}

						
						$("#tokens .VTTToken").each(
							function(){
								let converted = $(this).attr('data-id').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
								if(converted==entityid){
									ct_add_token(window.TOKEN_OBJECTS[$(this).attr('data-id')]);
									window.all_token_objects[$(this).attr('data-id')].options.init = total;
									window.TOKEN_OBJECTS[$(this).attr('data-id')].options.init = total;
									window.TOKEN_OBJECTS[$(this).attr('data-id')].update_and_sync();
								}
							}
						);

						$("#combat_area tr").each(function() {
							let converted = $(this).attr('data-target').replace(/^.*\/([0-9]*)$/, "$1"); // profiles/ciccio/1234 -> 1234
							if (converted == entityid) {
								$(this).find(".init").val(total);
								window.all_token_objects[$(this).attr('data-target')].options.init = total;
								window.TOKEN_OBJECTS[$(this).attr('data-target')].options.init = total;
								window.TOKEN_OBJECTS[$(this).attr('data-target')].update_and_sync();
							}
						});
						debounceCombatReorder(true);
					}
					
				}
				
			}
			
			if (msg.eventType === "custom/myVTT/peerReady") {
				window.PeerManager.receivedPeerReady(msg);
			}
			if (msg.eventType === "custom/myVTT/peerConnect") {
				window.PeerManager.receivedPeerConnect(msg);
			}
			if (msg.eventType === "custom/myVTT/videoPeerConnect") {
				if(msg.data.id != window.myVideoPeerID){
					let call = window.videoPeer.call(msg.data.id, window.myLocalVideostream)
					call.on('stream', (stream) => {
						window.videoConnectedPeers.push(msg.data.id);
						setRemoteStream(stream, call.peer);   
						call.on('close', () => {
							$(`.video-meet-area video#${call.peer}`).remove();
							})   
					})
					window.currentPeers = window.currentPeers.filter(d=> d.peer != call.peer)
					window.currentPeers.push(call);
				}
			}
			if (msg.eventType === "custom/myVTT/videoPeerDisconnect") {
					$(`.video-meet-area video#${msg.data.id}`).remove();
			}

			if (msg.eventType === "custom/myVTT/diceVideoPeerConnect") {
				if(msg.data.id != diceplayer_id){
					let call = window.diceVideoPeer.call(msg.data.id, window.MYMEDIASTREAM)
					call.on('stream', (stream) => {
						window.diceVideoConnectedPeers.push(msg.data.id);
						setDiceRemoteStream(stream, call.peer);   
						call.on('close', () => {
							$(`video.remote-dice-video#${call.peer}, #streamer-canvas-${call.peer}`).remove();
						})   
					})
					window.diceCurrentPeers = window.diceCurrentPeers.filter(d=> d.peer != call.peer)
					window.diceCurrentPeers.push(call);
				}
			}


		};
		if(is_campaign_page()){
			get_cobalt_token(function (token) {
				self.loadWS(token);
			});

			self.loadAboveWS();
			return;
		}

		get_cobalt_token(function (token) {
			self.loadWS(token, report_connection);
		});

		self.loadAboveWS(notify_player_join);

	}

	async handleScene (msg, forceRefresh=false) {
		console.debug("handlescene", msg);
		try{
			if(msg.data.scale_factor == undefined || msg.data.scale_factor == ''){
				msg.data.scale_factor = 1;
			}
			let isCurrentScene = window.CURRENT_SCENE_DATA?.id != undefined && msg.data.id == window.CURRENT_SCENE_DATA.id
			let dmMapEqual = msg.data.dm_map == window.CURRENT_SCENE_DATA.dm_map && msg.data.dm_map_usable == '1' || msg.data.player_map == window.CURRENT_SCENE_DATA.player_map && msg.data.dm_map_usable == '0'
			let dmMapToggleEqual = msg.data.dm_map_usable == window.CURRENT_SCENE_DATA.dm_map_usable
			let playerMapEqual = msg.data.player_map == window.CURRENT_SCENE_DATA.player_map
			let scaleFactorEqual = (msg.data.scale_factor == window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion || 
																		((msg.data.scale_factor == undefined || msg.data.scale_factor=='') && window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion == 1))
			let hppsEqual = window.CURRENT_SCENE_DATA.hpps==parseFloat(msg.data.hpps*msg.data.scale_factor)
			let vppsEqual = window.CURRENT_SCENE_DATA.vpps==parseFloat(msg.data.vpps*msg.data.scale_factor)
			let isVideoEqual = window.CURRENT_SCENE_DATA.player_map_is_video == msg.data.player_map_is_video && window.CURRENT_SCENE_DATA.dm_map_is_video == msg.data.dm_map_is_video

			let isSameScaleAndMaps = isCurrentScene && scaleFactorEqual && hppsEqual && vppsEqual && isVideoEqual && ((window.DM && dmMapEqual && dmMapToggleEqual) || (!window.DM && playerMapEqual))
			
			const isSameTokenLight = window.CURRENT_SCENE_DATA.disableSceneVision == msg.data.disableSceneVision;																		
			

			if(isSameScaleAndMaps && !forceRefresh){
				let scaleFactor = window.CURRENT_SCENE_DATA.scale_factor;
				let conversion = window.CURRENT_SCENE_DATA.conversion;

				window.CURRENT_SCENE_DATA = {
					...msg.data,
					conversion: conversion,
					scale_factor: scaleFactor
				};
				check_darkness_value();
				window.CURRENT_SCENE_DATA.daylight = window.CURRENT_SCENE_DATA.daylight ? window.CURRENT_SCENE_DATA.daylight : `rgba(255, 255, 255, 1)`
		 		$('#VTT').css('--daylight-color', window.CURRENT_SCENE_DATA.daylight);

		 		if(!window.CURRENT_SCENE_DATA.scale_factor)
					window.CURRENT_SCENE_DATA.scale_factor = 1;
				window.CURRENT_SCENE_DATA.vpps=parseFloat(msg.data.vpps*msg.data.scale_factor);
				window.CURRENT_SCENE_DATA.hpps=parseFloat(msg.data.hpps*msg.data.scale_factor);
				window.CURRENT_SCENE_DATA.offsetx=parseFloat(msg.data.offsetx*msg.data.scale_factor);
				window.CURRENT_SCENE_DATA.offsety=parseFloat(msg.data.offsety*msg.data.scale_factor);

				// Store current scene width and height
				let mapHeight = await $("#scene_map").height();
				let mapWidth = await $("#scene_map").width();
		

				
				// Scale map according to scaleFactor
				$("#VTT").css("--scene-scale", scaleFactor)
				window.CURRENT_SCENE_DATA.width = mapWidth;
				window.CURRENT_SCENE_DATA.height = mapHeight;
				

				if(window.CURRENT_SCENE_DATA.gridType == 2 || window.CURRENT_SCENE_DATA.gridType == 3){
					const a = 2 * Math.PI / 6;
					const hexWidth = window.CURRENT_SCENE_DATA.hpps * Math.sin(a) * 2 * window.CURRENT_SCENE_DATA.scale_factor;
					const hexHeight = window.CURRENT_SCENE_DATA.hpps * (1 + Math.cos(a)) * window.CURRENT_SCENE_DATA.scale_factor;
					window.hexGridSize = {
						width: hexWidth,
						height: hexHeight
					}
				}
				if(!isSameTokenLight){
					for(let i in window.TOKEN_OBJECTS){
						const token = $(`#tokens div[data-id='${i}']`);
						setTokenLight(token, window.TOKEN_OBJECTS[i].options);
					}
				}
				await reset_canvas(false);
				if(!window.DM || window.SelectedTokenVision)
					check_token_visibility();
			}
			else{
				window.DRAWINGS = [];
				window.wallUndo = [];
				$('#exploredCanvas').remove();
				window.sceneRequestTime = Date.now();
		    	let lastSceneRequestTime = window.sceneRequestTime;   
				window.TOKEN_OBJECTS = {};
				window.ON_SCREEN_TOKENS = {};
				window.videoTokenOld = {};
				let data = msg.data;
				let self=this;

					if(data.dm_map_usable=="1"){ // IN THE CLOUD WE DON'T RECEIVE WIDTH AND HEIGT. ALWAYS LOAD THE DM_MAP FIRST, AS TO GET THE PROPER WIDTH
						data.map=data.dm_map;
						if(data.dm_map_is_video=="1" || data.dm_map?.includes('youtube.com') || data.dm_map?.includes("youtu.be"))
							data.is_video=true;
					}
					else{
						data.map=data.player_map;
						if(data.player_map_is_video=="1")
							data.is_video=true;
					}

				for(const i in msg.data.tokens){
					if(i == msg.data.tokens[i].id)
						continue;
					msg.data.tokens[msg.data.tokens[i].id] = msg.data.tokens[i];
					delete msg.data.tokens[i];
				}
				msg.data.tokens = Object.fromEntries(Object.entries(msg.data.tokens).filter(([_, v]) => v != null));
				window.CURRENT_SCENE_DATA = msg.data;
				check_darkness_value();
				window.CURRENT_SCENE_DATA.daylight = window.CURRENT_SCENE_DATA.daylight ? window.CURRENT_SCENE_DATA.daylight : `rgba(255, 255, 255, 1)`
		 		$('#VTT').css('--daylight-color', window.CURRENT_SCENE_DATA.daylight);
				if(window.DM){
					window.ScenesHandler.scene=window.CURRENT_SCENE_DATA;
				}

				if(!window.CURRENT_SCENE_DATA.scale_factor)
					window.CURRENT_SCENE_DATA.scale_factor = 1;
				window.CURRENT_SCENE_DATA.vpps=parseFloat(window.CURRENT_SCENE_DATA.vpps*window.CURRENT_SCENE_DATA.scale_factor);
				window.CURRENT_SCENE_DATA.hpps=parseFloat(window.CURRENT_SCENE_DATA.hpps*window.CURRENT_SCENE_DATA.scale_factor);
				window.CURRENT_SCENE_DATA.offsetx=parseFloat(window.CURRENT_SCENE_DATA.offsetx*window.CURRENT_SCENE_DATA.scale_factor);
				window.CURRENT_SCENE_DATA.offsety=parseFloat(window.CURRENT_SCENE_DATA.offsety*window.CURRENT_SCENE_DATA.scale_factor);
				$('#vision_menu #draw_line_width').val(window.CURRENT_SCENE_DATA.hpps);
				$('#fog_menu #draw_line_width').val(window.CURRENT_SCENE_DATA.hpps);
				console.log("SETTO BACKGROUND A " + msg.data);
				$("#tokens").children().remove();
				$(".aura-element[id^='aura_'").remove();
				$(".aura-element-container-clip").remove();
				$("[data-darkness]").remove();
				$("[data-notatoken]").remove();

				let old_src = $("#scene_map").attr('src');
				$('.import-loading-indicator').remove();
				if(data.UVTTFile == 1){
					build_import_loading_indicator("Loading UVTT Map");
					try{
						if(window.DM && data.dm_map && data.dm_map_usable){
							data.map = await get_map_from_uvtt_file(data.map)
						}
						else{
							data.map = await get_map_from_uvtt_file(data.player_map);
						}			
					}
					catch{
						console.log('non-UVTT file found for map')
						if(window.DM && data.dm_map && data.dm_map_usable){
							data.map = data.dm_map;
						}
						else{
							data.map = data.player_map;
						}
					}
				}
				else{
					await build_import_loading_indicator(`Loading ${window.DM ? data.title : 'Scene'}`);		
				}
				$('.import-loading-indicator .percentageLoaded').css('width', `0%`);
				if(msg.data.id == window.CURRENT_SCENE_DATA.id){ // incase another map was loaded before we get uvtt data back


					if (data.fog_of_war == 1) {
						window.FOG_OF_WAR = true;
						window.REVEALED = data.reveals;
					}
					else {
						window.FOG_OF_WAR = false;
						window.REVEALED = [];
					}
					if (typeof data.drawings !== "undefined") {
						window.DRAWINGS = data.drawings;

					}
					else {
						window.DRAWINGS = [];
					}
					window.LOADING = true;
					if(!window.DM && (data.player_map_is_video == '1' || data.player_map?.includes('youtube.com') || data.player_map?.includes("youtu.be") || data.is_video == '1')){
						data.map = data.player_map;
						data.is_video = data.player_map_is_video;
					}

					load_scenemap(data.map, data.is_video, data.width, data.height, data.UVTTFile, async function() {
						
						console.group("load_scenemap callback")
						if(!window.CURRENT_SCENE_DATA.scale_factor)
							window.CURRENT_SCENE_DATA.scale_factor = 1;
						let scaleFactor = window.CURRENT_SCENE_DATA.scale_factor;
						// Store current scene width and height
						let mapHeight = await $("#scene_map").height();
						let mapWidth = await $("#scene_map").width();

	
						window.CURRENT_SCENE_DATA.conversion = 1;

						if(data.scale_check && !data.UVTTFile && !data.is_video && (mapHeight > 2500 || mapWidth > 2500)){
							let conversion = 2;
							if(mapWidth >= mapHeight){
								conversion = 1980 / mapWidth;
							}
							else{
								conversion = 1980 / mapHeight;
							}
							mapHeight = mapHeight*conversion;
							mapWidth = mapWidth*conversion;
							$("#scene_map").css({
								'height': mapHeight,
								'width': mapWidth
							});
							scaleFactor = scaleFactor / conversion		
							window.CURRENT_SCENE_DATA.scale_factor = scaleFactor;
							window.CURRENT_SCENE_DATA.conversion = conversion;
						}
						else if(!data.scale_check){ //older than 0.98
							window.CURRENT_SCENE_DATA = {
								...window.CURRENT_SCENE_DATA,
								hpps: window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.scale_factor,
								vpps: window.CURRENT_SCENE_DATA.vpps / window.CURRENT_SCENE_DATA.scale_factor,
								offsetx: window.CURRENT_SCENE_DATA.offsetx / window.CURRENT_SCENE_DATA.scale_factor,
								offsety: window.CURRENT_SCENE_DATA.offsety / window.CURRENT_SCENE_DATA.scale_factor
							}
						}
						$('.import-loading-indicator .percentageLoaded').css('width', `10%`);	
						window.CURRENT_SCENE_DATA.width = mapWidth;
						window.CURRENT_SCENE_DATA.height = mapHeight;
						

						if(window.CURRENT_SCENE_DATA.gridType == 2 || window.CURRENT_SCENE_DATA.gridType == 3){
							const a = 2 * Math.PI / 6;
							const hexWidth = window.CURRENT_SCENE_DATA.hpps * Math.sin(a) * 2 * window.CURRENT_SCENE_DATA.scale_factor;
							const hexHeight = window.CURRENT_SCENE_DATA.hpps * (1 + Math.cos(a)) * window.CURRENT_SCENE_DATA.scale_factor;
							window.hexGridSize = {
								width: hexWidth,
								height: hexHeight
							}
						}

						// Scale map according to scaleFactor
						$("#VTT").css("--scene-scale", scaleFactor)
						$('#loadingStyles').remove(); // incase 2nd load
						if(!window.DM){
							$('body').append($(`<style id='loadingStyles'>
								.token,
								.door-button,
								.aura-element-container-clip{
									display: none !important;
								}
								.token[data-id*='${window.PLAYER_ID}']{
									display: flex !important;
								}
								
								.aura-element-container-clip[id*='${window.PLAYER_ID}']{
									display:unset !important;
								}
							</style>`))
						}


						if(!window.DM && data.dm_map_usable=="1" && data.UVTTFile != 1 && !data.is_video){
	
							$("#scene_map").stop();
							$("#scene_map").css("opacity","0");
							console.log("switching back to player map");
							$("#scene_map").off("load");
							$("#scene_map").on("load", () => {
								$("#scene_map").css('opacity', 1)
								$("#darkness_layer").show();
							});
							
						
							$("#scene_map").attr('src', await getGoogleDriveAPILink(data.player_map));
							$('.import-loading-indicator .percentageLoaded').css('width', `20%`);		
						}
						await reset_canvas();
		        		await set_default_vttwrapper_size();
						remove_loading_overlay();
						console.log("LOADING TOKENS!");
						

						let tokensLength = Object.keys(data.tokens).length;
						let count = 0;
						const tokenLoop = async function(data, count, tokensLength){
							for (let id in data.tokens) {
								if(forceRefresh){
									delete window.all_token_objects[id];
								}
								await self.handleToken({
									data: data.tokens[id],
									loading: true,
									persist: false			
								})
								count += 1;
								await async_sleep(0.01);
								$('.import-loading-indicator .percentageLoaded').css('width', `${20 + count/tokensLength*75}%`)
							}
							return true;
						}
			
						await tokenLoop(data, count, tokensLength);

						if(window.TELEPORTER_PASTE_BUFFER != undefined){
							try{
								const teleporterTokenId = window.TELEPORTER_PASTE_BUFFER.targetToken
								const targetPortal = window.TOKEN_OBJECTS[teleporterTokenId];
								const top = (parseInt(targetPortal.options.top) + 25) * (window.CURRENT_SCENE_DATA.scale_factor / targetPortal.options.scaleCreated);
								const left = (parseInt(targetPortal.options.left) + 25) * (window.CURRENT_SCENE_DATA.scale_factor / targetPortal.options.scaleCreated);
								const isTeleporter = true;
								await paste_selected_tokens(left, top, isTeleporter);
								window.TOKEN_OBJECTS[teleporterTokenId].highlight();
							}
							catch{
								window.TELEPORTER_PASTE_BUFFER = undefined;
							}
							
						}


						let mixerState = window.MIXER.state();
						for(let i in mixerState.channels){
							if(mixerState.channels[i].token != undefined){
								window.MIXER.deleteChannel(i);
							}
						}
						let audioTokens = $('.audio-token');
				        if(audioTokens.length > 0){
				            for(let i = 0; i < audioTokens.length; i++){
				                setTokenAudio($(audioTokens[i]), window.TOKEN_OBJECTS[$(audioTokens[i]).attr('data-id')]);
				            }
				        }
						
						ct_load({
							loading: true,
							current: $("#combat_area [data-current]").attr('data-target')
						});


						$('.import-loading-indicator .percentageLoaded').css('width', '95%');	
						if (window.EncounterHandler !== undefined) {
							fetch_and_cache_scene_monster_items();
						}

						if (window.reorderState === ItemType.Scene) {
							enable_draggable_change_folder(ItemType.Scene);
						}
						update_pc_token_rows();
						$('.import-loading-indicator').remove();
						delete window.LOADING;
						



						do_check_token_visibility();
						
						$('#loadingStyles').remove();

						console.groupEnd()

						
						window.MB.loadNextScene();	
						
						
					});
				}
			}
		}
		catch (e) {
			window.MB.loadNextScene();
			remove_loading_overlay();
			showError(e);
		}
		
		// console.groupEnd()
	}
	loadNextScene(){
		if (window.handleSceneQueue == undefined || window.handleSceneQueue?.length == 0)
			return;
		const msg = window.handleSceneQueue.pop(); // get most recent item and load it
		window.handleSceneQueue = [];
		AboveApi.getScene(msg.data.sceneid).then((response) => {
			window.MB.handleScene(response);
		}).catch((error) => {
			if (window.handleSceneQueue?.length > 0) {
				setTimeout(loadNextScene, 100);
			}
			console.error("Failed to download scene", error);
		});
	}
  	handleCT(data){
		ct_load(data);
	}

	encode_message_text(text) {
		if (is_supported_version('0.66')) {
			// This is used when the "Send to Gamelog" button sends HTML over the websocket.
			// If there are special characters, then the _dndbeyond_message_broker_client fails to parse the JSON
			// To work around this, we base64 encode the html here, and then decode it in MessageBroker.convertChat
			return "base64" + b64EncodeUnicode(text);
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
			text = b64DecodeUnicode(text.replace("base64", ""));
		}
		return text;
	}
	
	convertChat(data,local=false) {

		data.text = this.decode_message_text(data.text);

		//Security logic to prevent content being sent which can execute JavaScript.
		data.player = DOMPurify.sanitize( data.player,{ALLOWED_TAGS: []});
		data.img = DOMPurify.sanitize( data.img,{ALLOWED_TAGS: []});
		data.text = DOMPurify.sanitize( data.text,{ALLOWED_TAGS: ['video','img','div','p', 'b', 'button', 'span', 'style', 'path', 'rect', 'svg', 'a', 'hr', 'ul', 'li', 'ol', 'h3', 'h2', 'h4', 'h1', 'table', 'tr', 'td', 'th', 'br', 'input', 'strong', 'em'], ADD_ATTR: ['target']}); //This array needs to include all HTML elements the extension sends via chat.

		if(data.dmonly && !(window.DM) && !local) // /dmroll only for DM of or the user who initiated it
			return $("<div/>");
				
		if(data.whisper && (data.whisper!=window.PLAYER_NAME && !(Array.isArray(data.whisper) && data.whisper.includes(`${window.myUser}`))) && (!local))
			return $("<div/>");
		//notify_gamelog();

		let d = new Date();
		let datetime = d.toISOString();
		let timestamp = d.toLocaleTimeString();
		let datestamp = d.toLocaleDateString();

		// scramble message if PC doesn't speak this language
		if(data.language != undefined) {
				const knownLanguages = get_my_known_languages()
				const messageLanguage = window.ddbConfigJson.languages.find(d => d.id == data.language)?.name;
				if (!window.DM && !knownLanguages.includes(messageLanguage)) {
					const container = $("<div>").html(data.text);
					const elements = container.find("*").add(container);
					const textNodes = elements.contents().not(elements);
					textNodes.each(function () {
						let newText = this.nodeValue.replaceAll(/[\w\d]/gi, (n) => String.fromCharCode(97 + Math.floor(Math.random() * 26)));
						$(document.createTextNode(newText)).insertBefore(this);
						$(this).remove();
					});
					data.text = container.html();
				}
				else if(messageLanguage != 'Common'){
					data.text = $(data.text).prepend(`${messageLanguage}: `)[0].outerHTML;
				}
		}


		if (is_encounters_page() || is_characters_page() || is_campaign_page()) {
			return $(`
				<li class="tss-8-Other-ref tss-17y30t1-GameLogEntry-Other-Flex">
					<p role="img" class="tss-wyeh8h-Avatar-Flex">
						<img class="tss-1e4a2a1-AvatarPortrait" src="${data.img}" alt="">
					</p>
					<div class="tss-1e6zv06-MessageContainer-Flex">
						<div class="tss-dr2its-Line-Flex">
							<span class="tss-1tj70tb-Sender" title="${data.player}">${data.player}</span>
						</div>
						<div class="tss-8-Collapsed-ref tss-8-Other-ref tss-11w0h4e-Message-Collapsed-Other-Flex">${data.text}</div>
						<time datetime="${datetime}" title="${datestamp} ${timestamp}" class="tss-1yxh2yy-TimeAgo-TimeAgo">${timestamp}</time>
					</div>
				</li>
			`);
		} /*else if (is_characters_page()) {
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
						<time datetime="${datetime}" title="${datestamp} ${timestamp}" class="VL1LOQfDhMHRvAGyWG2vGg== _1-XSkDcxqHW18wFo5qzQzA==">${timestamp}</time>
					</div>
				</li>
			`);
		}*/

		let newentry = $("<div/>");
		newentry.attr('class', 'GameLogEntry_GameLogEntry__2EMUj GameLogEntry_Other__1rv5g Flex_Flex__3cwBI Flex_Flex__alignItems-flex-end__bJZS_ Flex_Flex__justifyContent-flex-start__378sw');
		newentry.append($("<p role='img' class='Avatar_Avatar__131Mw Flex_Flex__3cwBI'><img class='Avatar_AvatarPortrait__3cq6B' src='" + data.img + "'></p>"));
		let container = $("<div class='GameLogEntry_MessageContainer__RhcYB Flex_Flex__3cwBI Flex_Flex__alignItems-flex-start__HK9_w Flex_Flex__flexDirection-column__sAcwk'></div>");
		container.append($("<div class='GameLogEntry_Line__3fzjk Flex_Flex__3cwBI Flex_Flex__justifyContent-space-between__1FcfJ'><span>" + data.player + "</span></div>"));
		let entry = $("<div class='GameLogEntry_Message__1J8lC GameLogEntry_Collapsed__1_krc GameLogEntry_Other__1rv5g Flex_Flex__3cwBI'>" + data.text + "</div>");
		container.append(entry);

		


		
		container.append($("<time datetime='" + datetime + "' class='GameLogEntry_TimeAgo__zZTLH TimeAgo_TimeAgo__2M8fr'></time"));

		newentry.append(container);
		
		if ($(".GameLog_GameLog__2z_HZ").scrollTop() < 0) {
			$(".GameLog_GameLog__2z_HZ").addClass("highlight-gamelog");
		}

		return newentry;
		
	}


	handleToken(msg) {
		let data = msg.data;

		if(data.id == undefined)
			return;

		const animationDuration = data.speedAnim == true ? 0 : undefined;
		delete msg.data.speedAnim;

		const centerView = data.highlightCenter == true;
		delete msg.data.highlightCenter;

		if (msg.sceneId != window.CURRENT_SCENE_DATA.id || msg.loading) {
			let gridSquares = parseFloat(data.gridSquares);
			if (!isNaN(gridSquares)) {
				data.size = window.CURRENT_SCENE_DATA.hpps * gridSquares;
			} else {
				data.size = window.CURRENT_SCENE_DATA.hpps;
			}
			if (data.id in window.all_token_objects) {
				for (let property in window.all_token_objects[data.id].options) {		
					if(property == "left" || property == "top" || property == "hidden" || property == "scaleCreated")
						continue;
					if(msg.loading){
						data[property] = window.all_token_objects[data.id].options[property];
					}
					else if(property in data){
					 window.all_token_objects[data.id].options[property] = data[property]; 
					}
				}


				if (!data.hidden)
					delete window.all_token_objects[data.id].options.hidden;
			}
		}
			
		if (data.id in window.TOKEN_OBJECTS) {


			for (let property in data) {
				if(msg.sceneId != window.CURRENT_SCENE_DATA.id && (property == "left" || property == "top" || property == "hidden" || property == "scaleCreated"))
					continue;	
				if(window.all_token_objects[data.id] == undefined){
					window.all_token_objects[data.id] = window.TOKEN_OBJECTS[data.id]	
				}	
				window.TOKEN_OBJECTS[data.id].options[property] = data[property];
				window.all_token_objects[data.id].options[property] = data[property];
			}
			if(data.ct_show == undefined){
				delete window.TOKEN_OBJECTS[data.id].options.ct_show;
				delete window.all_token_objects[data.id].options.ct_show;
			}
			if(data.current == undefined){
				delete window.TOKEN_OBJECTS[data.id].options.current;
				delete window.all_token_objects[data.id].options.current;
			}
			if (!data.hidden && msg.sceneId == window.CURRENT_SCENE_DATA.id){
				delete window.TOKEN_OBJECTS[data.id].options.hidden;
				delete window.all_token_objects[data.id].options.hidden;
			}
			if(data.groupId == undefined){
				delete window.TOKEN_OBJECTS[data.id].options.groupId;
				delete window.all_token_objects[data.id].options.groupId;
			}
			let selector = "div[data-id='" + data.id + "']";
			let token = $("#tokens").find(selector);
			
			if(animationDuration == 0)
				token.css('visibility', 'hidden');
			
			window.TOKEN_OBJECTS[data.id].place(animationDuration);
			if(animationDuration == 0){
				setTimeout(function(){
					token.css('visibility', '');
				},100)
			}
			if(centerView){	
				let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
				if(window.TOKEN_OBJECTS[data.id].isCurrentPlayer() || 
					window.TOKEN_OBJECTS[data.id].options.share_vision == true || 
					window.TOKEN_OBJECTS[data.id].options.share_vision == window.myUser || 
					(window.TOKEN_OBJECTS[data.id].options.share_vision && is_spectator_page()) ||
					window.TOKEN_OBJECTS[data.id].options.player_owned ||
					(playerTokenId == undefined && window.TOKEN_OBJECTS[data.id].options.itemType == 'pc')){
						window.TOKEN_OBJECTS[data.id].highlight();
				}	
			}

		}	
		else if(data.left){

			let t = new Token(data);
			if(isNaN(parseFloat(t.options.left)) || isNaN(parseInt(t.options.top))){ // prevent errors with NaN positioned tokens - delete them as catch all. 
				t.options.deleteableByPlayers = true;
				t.delete();
				return;
			}
			window.TOKEN_OBJECTS[data.id] = t;
			if(window.all_token_objects[data.id] == undefined){
				window.all_token_objects[data.id] = t;
			}
			t.sync = mydebounce(function(options) { // VA IN FUNZIONE SOLO SE IL TOKEN NON ESISTE GIA					
				window.MB.sendMessage('custom/myVTT/token', options);
			}, 300);
			if(t.isPlayer()){
				if (!window.PC_TOKENS_NEEDING_UPDATES.includes(data.id)) {
					window.PC_TOKENS_NEEDING_UPDATES.push(data.id);
				}	
				debounce_pc_token_update();
			}
			t.place();


			let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
			let playerTokenAuraIsLight = (playerTokenId == undefined) ? true : window.TOKEN_OBJECTS[playerTokenId].options.auraislight;
			check_single_token_visibility(data.id);
	
		}
	}

	

	handleSyncMeUp(msg) {
		if (DM) {
			ct_persist(); // force refresh of combat tracker for late users
			if (window.CURRENT_SOUNDPAD) {
				let audioPlaying;
				for(let i = 0; i<$("audio").length; i++){
			    if($("audio")[i].paused == false){
			    		audioPlaying = true;
			        break;
			    }
				}
				let data = {
					soundpad: window.CURRENT_SOUNDPAD,
					playing: audioPlaying
				}
				window.MB.sendMessage("custom/myVTT/soundpad", data); // refresh soundpad
			}
			else if(window.MIXER){
	        const state = window.MIXER.remoteState();
          console.log('pushing mixer state to players', state);
          window.MB.sendMessage('custom/myVTT/mixer', state);
          if (window.YTPLAYER) {
          		window.YTPLAYER.volume = $("#youtube_volume").val();
              window.YTPLAYER.setVolume(window.YTPLAYER.volume*$("#master-volume input").val());
              data={
                  volume: window.YTPLAYER.volume
              };
              window.MB.sendMessage("custom/myVTT/changeyoutube",data);
          }
			}
			window.MB.sendMessage("custom/myVTT/DMAvatar", {
				avatar: dmAvatarUrl
			})
			window.MB.sendMessage("custom/myVTT/pausePlayer",{
				paused: $('#pause_players').hasClass('paused')
			});
		}
	}

	handleAudioPlayingSync(msg){
		if(window.DM){
			for(let i = 0; i<$("audio").length; i++){
		    if($("audio")[i].paused == false){
		    	let data={
						channel: i,
						time: $("audio")[i].currentTime,
						volume: $("audio")[i].volume,
					}
					window.MB.sendMessage("custom/myVTT/playchannel",data);
		    }
			}
		}
	}

	async inject_chat(injected_data) {
		let msgid = this.chat_id + this.chat_counter++;
		let data = {
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
		let eventType = "dice/roll/pending";
		let message = {
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
			entityType: injected_data.entityType ? injected_data.entityType : "user", // MOLTO INTERESSANTE. PENSO VENGA USATO PER CAPIRE CHE IMMAGINE METTERCI.
		};
		if (message.data.injected_data?.img?.startsWith('above-bucket-not-a-url')) {
			message.data.injected_data.img = await getAvttStorageUrl(message.data.injected_data.img);
		}
		if (this.ws.readyState == this.ws.OPEN) {
			this.ws.send(JSON.stringify(message));
		}

		this.handle_injected_data(message);

	}


	sendMessage(eventType, data,skipSceneId=false) {
		let self = this;

		//this.sendDDBMB(eventType,data); 

		if(eventType.startsWith("custom")){
			this.sendAboveMB(eventType,data,skipSceneId);
		}
		else{
			this.sendDDBMB(eventType,data);
		}
	}

	sendAboveMB(eventType,data,skipSceneId=false){
		let self=this;
		let message = {
			action: "sendmessage",
			campaignId:window.CAMPAIGN_SECRET,
			eventType: eventType,
			sender: this.mysenderid,
			data: data,
		}

		message.cloud=1;

		if(!["custom/myVTT/switch_scene","custom/myVTT/update_scene"].includes(eventType))
			message.sequence=this.above_sequence++;

		if(window.CURRENT_SCENE_DATA && !skipSceneId)
			message.sceneId=window.CURRENT_SCENE_DATA.id;
		if(window.PLAYER_SCENE_ID)
			message.playersSceneId = window.PLAYER_SCENE_ID;

		const jsmessage=JSON.stringify(message);
		if(jsmessage.length > (128000)){
			console.warn('message too large', message)

			let alertText = '';

			if(message.eventType?.toLowerCase()?.includes('draw')){
				alertText = `Drawings include - drawings, walls, elevation, light drawings and text.\n\n${window.DRAWINGS.filter(d=> d[1]=='wall').length > 200 ? `Try reducing the number of walls used around curves where possible - using X's on pillars etc. Longer straight walls will also perform better.\n\n` : ''}Number of drawings by type:\nDrawings: ${window.DRAWINGS.filter(d=> d[1]!='wall' && d[1]!='light' && d[0]!='text'&& d[1]!='elev' ).length}\nWalls: ${window.DRAWINGS.filter(d=> d[1]=='wall').length}\nElevation Drawings: ${window.DRAWINGS.filter(d=> d[1]=='elev').length}\nLight Drawings: ${window.DRAWINGS.filter(d=> d[1]=='light').length}\nText: ${window.DRAWINGS.filter(d=> d[0]=='text').length}\n\nCheck console warnings for more message data.`
			}
			else if(message.eventType?.toLowerCase()?.includes('note')){
				alertText = `\n\n${Object.keys(message.data.notes).length == 1 ? `Sent 1 note with title: ${message.data.notes.find(d=>d.title)?.title} \n\nThis note may be over 128000 characters including html - check this using the source button in notes (looks like <>).\n\nCheck console warnings for more message data.` : `Sent ${Object.keys(message.data.notes).length} notes.`}\n\nCheck console warnings for more message data.`			
			}
			else if(message.eventType?.toLowerCase()?.includes('token')){
				alertText = `You may have too many tokens on the map to send.\n\nNumber of Tokens: ${Object.keys(window.TOKEN_OBJECTS).length}\n\nCheck console warnings for more message data.`
			}
			else if(message.eventType?.toLowerCase()?.includes('ct')){
				alertText = `You may have too many tokens in the combat tracker.\n\nNumber of Tokens in CT: ${message.data.length-1}\n\nCheck console warnings for more message data.`
			}
			else{
				alertText = 'Check console warnings for more message data.'
			}
			
			alert(`You reached the maximum message size for "${message.eventType.split('/')[message.eventType.split('/').length-1]}".\n\n${alertText}`);
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
		let self=this;
		let message = {
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
		let self = this;
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
		if(is_gamelog_popout())
			return;
		let self = this;
		if(this.abovews.readyState == this.abovews.OPEN){
			this.abovews.send(JSON.stringify({action:"keepalive",eventType:"custom/myVTT/keepalive"}));
		}
		else{
			self.loadAboveWS(null);
		}
	}

	showDisconnectWarning(){
	  let container = $("#above-vtt-error-message");
	  container.remove();
	  container = $(`
	      <div id="above-vtt-error-message" class="small-error">
	        <h2>You have Disconnected</h2>
	        <div id="error-message-details"><p>You have disconnected from the AboveVTT websocket ${window.reconnectAttemptAbovews} times.</p><p>This could be caused by a VPN, anti-tracker, adblocker, firewall, school/work network settings, or other extention/program. It may also happen if the tab was in the background too long</p><p>If disconnecting due to an unstable connection you can enable auto reconnect in settings. Note: Auto reconnect may cause tokens to reset or desync.</p></div>
	        <div class="error-message-buttons">
	  		  	<button id="reconnect-button">Reconnect</button>
	          <button id="close-error-button">Exit</button>
	        </div>
	      </div>
	    `)
	  
    $(document.body).append(container);

	  $("#close-error-button").on("click", function(){
	  	window.close();
	  });
	  $("#reconnect-button").on("click", function(){
	  	window.onCloseNumberPerPopup = 0;
	  	window.MB.loadAboveWS(function(){ 
	  		AboveApi.getScene(window.CURRENT_SCENE_DATA.id).then((response) => {
	  			window.MB.handleScene(response, true);
	  			setTimeout(
	  				function(){
	  					let msgdata = {
	  							player: window.PLAYER_NAME,
	  							img: window.PLAYER_IMG,
	  							text: `${window.PLAYER_NAME} has reconnected.`
	  					};

	  					window.MB.inject_chat(msgdata);
	  				}, 4000)
	  			removeError();
	  		}).catch((error) => {
	  			console.error("Failed to download scene", error);
	  		});
  		}, true);	
	  });
	}

	reconnectDisconnectedAboveWs(){
		if(is_gamelog_popout())
			return;
		if (this.abovews.readyState != this.abovews.OPEN && !this.loadingAboveWS && $('#above-vtt-error-message').length == 0){
			if(window.reconnectAttemptAbovews == undefined){
				window.reconnectAttemptAbovews = 0;
			}	
			if(get_avtt_setting_value('autoReconnect')){
				this.loadAboveWS();	
			}
			else{
				this.showDisconnectWarning();
			}

		}
	}
}
