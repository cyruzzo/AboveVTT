const STANDARD_CONDITIONS = ["Blinded", "Charmed", "Deafened", "Exhaustion", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];

const CUSTOM_CONDITIONS = ["Concentration(Reminder)", "Flying", "Flamed", "Rage", "Blessed", "Baned",
							"Bloodied", "Advantage", "Disadvantage", "Bardic Inspiration", "Hasted",
							"#1A6AFF", "#FF7433", "#FF4D4D", "#FFD433", "#884DFF", "#86FF66"];

/*const TOKEN_COLORS=  [
	"D1BBD7","882E72","5289C7","4EB265","CAEOAB","F6C141","E8601C","777777","AE76A3","1965BO","7BAFDE","90C987","F7F056","F1932D","DC050C",
	"FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF", 
		"800000", "008000", "000080", "808000", "800080", "008080", "808080", 
		"C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0", 
		"400000", "004000", "000040", "404000", "400040", "004040", "404040", 
		"200000", "002000", "000020", "202000", "200020", "002020", "202020", 
		"600000", "006000", "000060", "606000", "600060", "006060", "606060", 
		"A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0", 
		"E00000", "00E000", "0000E0", "E0E000", "E000E0", "00E0E0", "E0E0E0", "000000"];*/

// const TOKEN_COLORS = ["8DB6C7","","D1C6BF","CA9F92","","E3D9BO","B1C27A","B2E289","51COBF","59ADDO","","9FA3E3","099304","DB8DB2","F1C3DO"];


const TOKEN_COLORS = ["1A6AFF", "FF7433", "1E50DC", "FFD433", "884DFF", "5F0404", "EC8AFF", "00E5FF",
					"000000", "F032E6", "911EB4", //END OF NEW COLORS
					"800000", "008000", "000080", "808000", "800080", "008080", "808080", "C00000", "00C000", "0000C0",
					"C0C000", "C000C0", "00C0C0", "C0C0C0", "400000", "004000", "000040",
					"404000", "400040", "004040", "404040", "200000", "002000", "000020",
					"202000", "200020", "002020", "202020", "600000", "006000", "000060",
					"606000", "600060", "006060", "606060", "A00000", "00A000", "0000A0",
					"A0A000", "A000A0", "00A0A0", "A0A0A0", "E00000", "00E000", "0000E0",
					"E0E000", "E000E0", "00E0E0", "E0E0E0"];


class Token {

	constructor(options) {
		this.selected = false;
		this.options = options;
		this.sync = null;
		this.persist = null;
		if(window.CLOUD)
			this.persist= ()=>{};
		
		this.doing_highlight = false;
		if (typeof this.options.size == "undefined") {
			this.options.size = window.CURRENT_SCENE_DATA.hpps; // one grid square
		}
		if (typeof options.custom_conditions == "undefined") {
			this.options.custom_conditions = [];
		}
		if (typeof options.conditions == "undefined") {
			this.options.conditions = [];
		}
	}


	stopAnimation(){
		var selector = "div[data-id='" + this.options.id + "']";
		var tok = $("#tokens").find(selector);

		if(tok.is(":visible")){
			tok.stop(true,true);
			this.doing_highlight=false;

		}
	}

	isPlayer() {
		// player tokens have ids with a structure like "/profile/username/characters/someId"
		// monster tokens have a uuid for their id
		return is_player_id(this.options.id);
	}

	isMonster() {
		if (this.options.monster === undefined) {
			return false;
		} else if (typeof this.options.monster === "string") {
			return this.options.monster.length > 0;
		} else if (typeof this.options.monster === "number") {
			return this.options.monster > 0;
		} else {
			return false;
		}
	}

	gridSize() {
		let size = parseFloat(this.options.size);
		if (isNaN(size)) {
			return 1; // default to small
		}
		let gridSize = parseFloat(window.CURRENT_SCENE_DATA.hpps); // one grid square
		return Math.round(size / gridSize);
	}

	hasCondition(conditionName) {
		return this.options.conditions.includes(conditionName) || this.options.custom_conditions.includes(conditionName);
	}
	addCondition(conditionName) {
		if (this.hasCondition(conditionName)) {
			// already did
			return;
		}
		if (STANDARD_CONDITIONS.includes(conditionName)) {
			this.options.conditions.push(conditionName);
		} else {
			this.options.custom_conditions.push(conditionName);
		}
	}
	removeCondition(conditionName) {
		if (STANDARD_CONDITIONS.includes(conditionName)) {
			array_remove_index_by_value(this.options.conditions, conditionName);
		} else {
			array_remove_index_by_value(this.options.custom_conditions, conditionName);
		}
	}

	size(newsize) {
		this.update_from_page();
		this.options.size = newsize;
		this.place_sync_persist()
	}

	hide() {
		this.update_from_page();
		this.options.hidden = true;
		this.options.ct_show = false;
		$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'block');
		$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'none');
		this.place_sync_persist()
		this.update_and_sync()
		ct_persist();
	}
	show() {
		this.update_from_page();
		delete this.options.hidden;
		this.options.ct_show = true;
		$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'block');
		$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'none');
		this.place_sync_persist()
		this.update_and_sync()
		ct_persist();
	}
	delete(persist=true,sync=true) {
		if (!window.DM && this.options.deleteableByPlayers != true) {
			// only allow the DM to delete tokens unless the token specifies deleteableByPlayers == true which is used by AoE tokens and maybe others
			return;
		}
		ct_remove_token(this, false);
		let id = this.options.id;
		let selector = "div[data-id='" + id + "']";
		$(selector).remove();
		delete window.CURRENT_SCENE_DATA.tokens[id];
		delete window.TOKEN_OBJECTS[id];
		$("#aura_" + id.replaceAll("/", "")).remove();
		if (persist == true) {
			if(window.CLOUD && sync){
				window.MB.sendMessage("custom/myVTT/delete_token",{id:id});
			}
			else if(!window.CLOUD && window.DM){
				window.ScenesHandler.persist();
				window.ScenesHandler.sync();
			}
			draw_selected_token_bounding_box(); // redraw the selection box
		}
	}
	rotate(newRotation) {
		if ((!window.DM && this.options.restrictPlayerMove) || this.options.locked) return; // don't allow rotating if the token is locked
		if (window.DM && this.options.locked) return; // don't allow rotating if the token is locked
		this.update_from_page();
		this.options.rotation = newRotation;
		// this is copied from the place() function. Rather than calling place() every time the draggable.drag function executes, 
		// this just rotates locally to help with performance.
		// draggable.stop will call place_sync_persist to finalize the rotation. 
		// If we ever want this to send to all players in real time, simply comment out the rest of this function and call place_sync_persist() instead.
		let scale = this.get_token_scale()
		
		var selector = "div[data-id='" + this.options.id + "']";
		var tokenElement = $("#tokens").find(selector);
		
		tokenElement.find("img").css("transform", "scale(" + scale + ") rotate(" + newRotation + "deg)");
		
	}
	moveUp() {
		let newTop = `${parseFloat(this.options.top) - parseFloat(window.CURRENT_SCENE_DATA.vpps)}px`;
		this.move(newTop, this.options.left)
	}
	moveDown() {
		let newTop = `${parseFloat(this.options.top) + parseFloat(window.CURRENT_SCENE_DATA.vpps)}px`;
		this.move(newTop, this.options.left)
	}
	moveLeft() {
		let newLeft = `${parseFloat(this.options.left) - parseFloat(window.CURRENT_SCENE_DATA.hpps)}px`;
		this.move(this.options.top, newLeft)
	}
	moveRight() {
		let newLeft = `${parseFloat(this.options.left) + parseFloat(window.CURRENT_SCENE_DATA.hpps)}px`;
		this.move(this.options.top, newLeft)
	}
	move(top, left) {
		if ((!window.DM && this.options.restrictPlayerMove) || this.options.locked) return; // don't allow moving if the token is locked
		if (window.DM && this.options.locked) return; // don't allow moving if the token is locked
		this.update_from_page();
		this.options.top = top;
		this.options.left = left;
		this.place(100);
		this.sync();
		if (this.persist != null) {
			this.persist();
		}
	}
	snap_to_closest_square() {
		if ((!window.DM && this.options.restrictPlayerMove) || this.options.locked) return; // don't allow moving if the token is locked
		if (window.DM && this.options.locked) return; // don't allow moving if the token is locked
		// shamelessly copied from the draggable code later in this file
		// this should be a XOR... (A AND !B) OR (!A AND B)
		let shallwesnap=  (window.CURRENT_SCENE_DATA.snap == "1"  && !(window.toggleSnap)) || ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);		
		if (shallwesnap) {
			// calculate offset in real coordinates
			const startX = window.CURRENT_SCENE_DATA.offsetx;
			const startY = window.CURRENT_SCENE_DATA.offsety;

			const selectedOldTop = parseInt(this.options.top);
			const selectedOldleft = parseInt(this.options.left);
			
			const selectedNewtop =  Math.round(Math.round( (selectedOldTop - startY) / window.CURRENT_SCENE_DATA.vpps)) * window.CURRENT_SCENE_DATA.vpps + startY;
			const selectedNewleft = Math.round(Math.round( (selectedOldleft - startX) / window.CURRENT_SCENE_DATA.hpps)) * window.CURRENT_SCENE_DATA.hpps + startX;

			console.log("Snapping from "+selectedOldleft+ " "+selectedOldTop + " -> "+selectedNewleft + " "+selectedNewtop);
			console.log("params startX " + startX + " startY "+ startY + " vpps "+window.CURRENT_SCENE_DATA.vpps + " hpps "+window.CURRENT_SCENE_DATA.hpps);

			this.update_from_page();
			this.options.top = `${selectedNewtop}px`;
			this.options.left = `${selectedNewleft}px`;
			this.place_sync_persist();
		}		
	}
	place_sync_persist() {
		this.place();
		this.sync();
		if (this.persist != null)
			this.persist();
	}

	highlight(dontscroll=false) {
		let self = this;
		if (self.doing_highlight)
			return;

		self.doing_highlight = true;
		var selector = "div[data-id='" + this.options.id + "']";
		var old = $("#tokens").find(selector);


		var old_op = old.css('opacity');
		if (old.is(":visible")) {
			var pageX = Math.round(parseInt(this.options.left) * window.ZOOM - ($(window).width() / 2));
			var pageY = Math.round(parseInt(this.options.top) * window.ZOOM - ($(window).height() / 2));
			console.log(this.options.left + " " + this.options.top + "->" + pageX + " " + pageY);
			
			if(!dontscroll){
			$("html,body").animate({
				scrollTop: pageY + 200,
				scrollLeft: pageX + 200
			}, 500);
			}


			// double blink
			old.animate({ opacity: 0 }, 250).animate({ opacity: old_op }, 250).animate({ opacity: 0 }, 250).animate({ opacity: old_op }, 250, function() {
				self.doing_highlight = false;
			});
		}
		else {
			self.doing_highlight = false;
		}


	}


	notify(text) {
		var n = $("<div/>");
		n.html(text);
		n.css('position', 'absolute');
		n.css('top', parseInt(this.options.top));
		n.css('left', parseInt(this.options.left) + (this.options.size / 2) - 130);
		n.css("z-index", "60");
		n.css("opacity", 0.9)

		$("#tokens").append(n);



		n.animate({
			opacity: 0.3,
			top: parseInt(this.options.top) - 100,
		}, 6000, function() {
			n.remove();
		})

	}

	/**
	 * adds a hidden dead cross to tokens
	 * makes dead cross visible if token has 0 hp
	 * @param token jquery selected div with the class "token"
	 */
	update_dead_cross(token){
		console.group("update_dead_cross")
		let tokenData = this.munge_token_data()
		if(tokenData.max_hp > 0){
			// add a cross if it doesn't exist
			if(token.find(".dead").length === 0) 
				token.prepend(`<div class="dead" hidden></div>`);
			// update cross scale
			const deadCross = token.find('.dead')
			deadCross.attr("style", `transform:scale(${this.get_token_scale()});--size: ${parseInt(tokenData.size) / 10}px;`)
			// check token death
			if (tokenData.max_hp > 0 && parseInt(tokenData.hp) === 0) {
				deadCross.show()
			} else {
				deadCross.hide()
			}
		}
		console.groupEnd()
	}

	/**
	 * Some details come from the token, some from DDB especially for players. So munge the objects together
	 * @return object containing this tokens data and possibly the players data if it's a player token
	 */
	munge_token_data(){
		if (window.PLAYER_STATS[this.options.id]) {
			return {...this.options, ...window.PLAYER_STATS[this.options.id]}
		}
		return {...this.options}
	}

	/**
	 * updates the colour of the health aura if enabled
	 * @param token jquery selected div with the class "token"
	 */
	update_health_aura(token){
		console.group("update_health_aura")
		// set token data to the player if this token is a player token, otherwise just use this tokens data
		let tokenData = this.munge_token_data()
		if (!tokenData.disableaura && tokenData.max_hp > 0) {

			token.find(".token-image").css('box-shadow',
				`${token_health_aura(
					Math.round((tokenData.hp / tokenData.max_hp) * 100)
				)} 0px 0px 7px 7px`
			);
			// add another aura to show you have temp hp
			console.log("updating hp aura", tokenData)
			if (tokenData.temp_hp && tokenData.temp_hp > 0){
				console.log("Adding extra dropshadow")
				token.find(".token-image").css('box-shadow',
				`${token_health_aura(
					Math.round((tokenData.hp / tokenData.max_hp) * 100)
					)} 0px 0px 6px 6px, #0015ff 0px 0px 8px 8px`
				)
			}
		}
		
		console.groupEnd()
	}

	/**
	 * returns different scales of the token based on options such as aura disabled
	 * @returns scale of token
	 */
	get_token_scale(){
		let tokenData = this.munge_token_data()
		if (!(tokenData.max_hp) > 0 || (tokenData.disableaura))
			return 1
		return (((tokenData.size - 15) * 100) / tokenData.size) / 100;
	}

	update_from_page() {
		console.group("update_from_page")
		var selector = "div[data-id='" + this.options.id + "']";
		var old = $("#tokens").find(selector);

		if(old.is(':animated')){
			this.stopAnimation(); // stop the animation and jump to the end.
		}

		this.options.left = old.css("left");
		this.options.top = old.css("top");
		//this.options.hpstring=old.find(".hpbar").val();
		//this.options.size=old.width();
		if (old.css("opacity") == 0.5)
			this.options.hidden = true;
		else
			delete this.options.hidden;
		
		// one of either
		// is a monster?
		// is the DM
		// not the DM and player controlled
		// AND stats aren't disabled and has hp bar
		if ( ( (!(this.options.monster > 0)) || window.DM || (!window.DM && this.options.player_owned)) && !this.options.disablestat && old.has(".hp").length > 0) {
			if (old.find(".hp").val().trim().startsWith("+") || old.find(".hp").val().trim().startsWith("-")) {
				old.find(".hp").val(Math.max(0, parseInt(this.options.hp) + parseInt(old.find(".hp").val())));
			}
			if (old.find(".max_hp").val().trim().startsWith("+") || old.find(".max_hp").val().trim().startsWith("-")) {
				old.find(".max_hp").val(Math.max(0, parseInt(this.options.max_hp) + parseInt(old.find(".max_hp").val())));
			}
			$("input").blur();
			this.options.hp = old.find(".hp").val();
			this.options.max_hp = old.find(".max_hp").val();
			
			this.update_dead_cross(old)
			this.update_health_aura(old)
		}
		toggle_player_selectable(this, old)
		console.groupEnd()
	}


	update_and_sync(e) {
		self = this;
		self.update_from_page();
		if (self.sync != null)
			self.sync(e);
		if (self.persist != null)
			self.persist(e);
		check_token_visibility();


		/* UPDATE COMBAT TRACKER */
		this.update_combat_tracker()
	}
	update_combat_tracker(){
		/* UPDATE COMBAT TRACKER */
		if (window.DM) {
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").text(this.options.hp);
		}
		if (this.options.hidden == false || typeof this.options.hidden == 'undefined'){
			console.log("Setting combat tracker opacity to 1.0")
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('img').css('opacity','1.0');
		}
		else {
			console.log("Setting combat tracker opacity to 0.5")
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('img').css('opacity','0.5');
		}
		//this.options.ct_show = $("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('input').checked;
	}

	build_hp() {
		var self = this;
		var bar_height = Math.floor(this.options.size * 0.2);

		if (bar_height > 60)
			bar_height = 60;

		var hpbar = $("<div class='hpbar'/>");
		hpbar.css("position", 'absolute');
		hpbar.css('height', bar_height);
		hpbar.css('left', (Math.floor(this.options.size * 0.35) / 2));
		hpbar.css('top', this.options.size - bar_height);
		hpbar.css('background', '#ff7777');
		hpbar.width("max-width: 100%");

		var fs = Math.floor(bar_height / 1.3) + "px";

		$("<div class='token'/>").css("font-size",fs);

		var input_width = Math.floor(this.options.size * 0.3);
		if (input_width > 90)
			input_width = 90;

		var hp_input = $("<input class='hp'>").css("height", bar_height).css('font-weight', 'bold').css('float', 'left').css('background', 'rgba(0,0,0,0)').css('text-align', 'center').css('width', input_width).css("border", '0').css("padding", 0).css('font-size', fs);
		hp_input.val(this.options.hp);

		var maxhp_input = $("<input class='max_hp'>").css("height", bar_height).css('font-weight', 'bold').css('float', 'left').css('background', 'rgba(0,0,0,0)').css('text-align', 'center').css('width', input_width).css("border", '0').css("padding", 0).css('font-size', fs);
		maxhp_input.val(this.options.max_hp);

		if (this.options.disableaura){
			console.log("building hp bar", this.options)
			this.options.temp_hp && this.options.temp_hp > 0 ?
				hpbar.css('background', '#77a2ff')
				: hpbar.css('background', '#ff7777');
		}

		var divider = $("<div style='display:inline-block;float:left'>/</>");
		divider.css('font-size', fs);


		hpbar.append(hp_input);
		hpbar.append(divider);
		hpbar.append(maxhp_input);
		if (!this.isPlayer()) {
			hp_input.change(function(e) {
				hp_input.val(hp_input.val().trim());
				self.update_and_sync(e);
			});
			hp_input.click(function(e) {
				$(e.target).select();
			});
			maxhp_input.change(function(e) {
				maxhp_input.val(maxhp_input.val().trim());
				self.update_and_sync(e);
			});
			maxhp_input.click(function(e) {
				$(e.target).select();
			});
		}
		else {
			hp_input.keydown(function(e) { if (e.keyCode == '13') self.update_from_page(); e.preventDefault(); }); // DISABLE WITHOUT MAKING IT LOOK UGLY
			maxhp_input.keydown(function(e) { if (e.keyCode == '13') self.update_from_page(); e.preventDefault(); });
		}

		return hpbar;
	}

	build_ac() {
		var bar_height = Math.max(16, Math.floor(this.options.size * 0.2)); // no less than 16px
		var ac = $("<div class='ac'/>");
		ac.css("position", "absolute");
		ac.css('right', "-1px");
		ac.css('width', bar_height + "px");
		ac.css('height', bar_height + "px");
		ac.css('bottom', '0px');
		ac.append(
			$(`
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="ac_shield" x="0px" y="0px" viewBox="6.991001129150391 0 45.999996185302734 59.981998443603516" xml:space="preserve" height="${bar_height}px" width="${bar_height}px">
				<g xmlns="http://www.w3.org/2000/svg" transform="translate(6 0)">
					<path d="M51.991,7.982c-14.628,0-21.169-7.566-21.232-7.64c-0.38-0.456-1.156-0.456-1.536,0c-0.064,0.076-6.537,7.64-21.232,7.64   c-0.552,0-1,0.448-1,1v19.085c0,10.433,4.69,20.348,12.546,26.521c3.167,2.489,6.588,4.29,10.169,5.352   c0.093,0.028,0.189,0.042,0.285,0.042s0.191-0.014,0.285-0.042c3.581-1.063,7.002-2.863,10.169-5.352   c7.856-6.174,12.546-16.088,12.546-26.521V8.982C52.991,8.43,52.544,7.982,51.991,7.982z "></path>
					<path d="M50.991,28.067   c0,9.824-4.404,19.151-11.782,24.949c-2.883,2.266-5.983,3.92-9.218,4.921c-3.235-1-6.335-2.655-9.218-4.921   C13.395,47.219,8.991,37.891,8.991,28.067V9.971c12.242-0.272,18.865-5.497,21-7.545c2.135,2.049,8.758,7.273,21,7.545V28.067z" style="fill:white;"></path>
					<text style="font-size:34px;color:#000;" transform="translate(${this.options.ac > 9 ? 9 : 20},40)">${this.options.ac}</text>
				</g>
			</svg>

			`)
		);
		return ac;
	}

	build_elev() {
		var bar_height = Math.max(16, Math.floor(this.options.size * 0.2)); // no less than 16px
		var elev = $("<div class='elev'/>");
		let bar_width = Math.floor(this.options.size * 0.2);
		elev.css("position", "absolute");
		elev.css('right', bar_width * 4.35 + "px");
		elev.css('width', bar_height + "px");
		elev.css('height', bar_height + "px");
		elev.css('bottom', '3px');
		elev.css('color', 'white');
		if (this.options.elev == 0){
			elev.css('display', 'none');
		}else if (this.options.elev == undefined){
			elev.css('display', 'none');
		}else if (this.options.elev > 0){
			elev.append(
			$(`
			<svg width="${bar_height + 5}px" height="${bar_height + 5}px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path fill="#fff" stroke="#000" stroke-width="0.5" d="M18,17 L18,18 C18,21 16,22 13,22 L11,22 C8,22 6,21 6,18 L6,17 C3.23857625,17 1,14.7614237 1,12 C1,9.23857625 3.23857625,7 6,7 L12,7 M6,7 L6,6 C6,3 8,2 11,2 L13,2 C16,2 18,3 18,6 L18,7 C20.7614237,7 23,9.23857625 23,12 C23,14.7614237 20.7614237,17 18,17 L12,17"/>
			<svg fill="#FFF" width="29px" height="19.5px" viewBox="-60 -205 750 750" xmlns="http://www.w3.org/2000/svg"><path stroke-width="1500" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"></path> </svg>
			<text style="position:absolute;top:4px;left:8px;font-size:12px;color:#000;transform:translate(${this.options.elev > 9 ? 5.5 + 'px': 8.5 + 'px'},16px);">${this.options.elev}</text>
			</svg>
			`));
		}else if (this.options.elev < 0){
			elev.append(
			$(`
			<svg width="${bar_height + 5}px" height="${bar_height + 5}px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path fill="#fff" stroke="#000" stroke-width="0.5" d="M18,17 L18,18 C18,21 16,22 13,22 L11,22 C8,22 6,21 6,18 L6,17 C3.23857625,17 1,14.7614237 1,12 C1,9.23857625 3.23857625,7 6,7 L12,7 M6,7 L6,6 C6,3 8,2 11,2 L13,2 C16,2 18,3 18,6 L18,7 C20.7614237,7 23,9.23857625 23,12 C23,14.7614237 20.7614237,17 18,17 L12,17"/>
			<svg fill="#FFF" width="29px" height="19.5px" viewBox="-60 -205 750 750" xmlns="http://www.w3.org/2000/svg"><path stroke-width="1500" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"></path> </svg>
			<text style="position:absolute;top:4px;left:5px;font-size:12px;color:#000;transform:translate(${this.options.elev < -9 ? 1.5 + 'px': 6 + 'px'},16px);">${this.options.elev}</text>
			</svg>
			`)
		);}
		return elev;
	}

	/**
	 * hides or shows stats based on this.options
	 * @param token jquery selected div with the class "token"
	 */
	toggle_stats(token){
		let showthem=false;

		if(this.options.disablestat){ // if disable-stat.. noone should see HP/AC.. this is for non character tokens
			showthem=false;
		}
		else if(window.DM){ // in all the other cases.. the DM should always see HP/AC
			showthem=true;
		}
		else if(this.options.player_owned){ // if it's player_owned.. always showthem
			showthem=true;
		}
		else if(this.isPlayer() && (!this.options.hidestat)){
			showthem=true;
		}

		if(showthem){
			token.find(".hpbar").show();
			token.find(".ac").show();
			token.find(".elev").show();
		}
		else{
			token.find(".hpbar").hide();
			token.find(".ac").hide();
			token.find(".elev").hide();
		}
	}

	/**
	 * Adds stats hp/ac/elev when token doesn't have them, or rebuilds them if it does
	 * @param token jquery selected div with the class "token"
	 */
	build_stats(token){
		console.group("build_stats")
		if (!token.has(".hpbar").length > 0  && !token.has(".ac").length > 0 && !token.has(".elev").length > 0){
			token.append(this.build_hp());
			token.append(this.build_ac());
			token.append(this.build_elev());
		}
		else{
			token.find(".hpbar").replaceWith(this.build_hp());
			token.find(".ac").replaceWith(this.build_ac());
			token.find(".elev").replaceWith(this.build_elev());
		}
		console.groupEnd()
	}


	build_conditions(parent) {
		console.group("build_conditions")
		let self=this;
		let bar_width = Math.floor(this.options.size * 0.2);
		const cond = $("<div class='conditions' style='padding:0;margin:0'/>");
		const moreCond = $(`<div class='conditions' style='left:${bar_width}px;'/>`);
		cond.css('left', "0");

		const symbolSize = Math.min(bar_width >= 22 ? bar_width : (this.options.size / 4), 45);

		moreCond.css('left', this.options.size - symbolSize);
		[cond, moreCond].forEach(cond_bar => {
			cond_bar.width(symbolSize);
			cond_bar.height(this.options.size - bar_width);
		})
		if (this.options.inspiration){
			if (!this.options.custom_conditions.includes("Inspiration")){
				this.options.custom_conditions.push("Inspiration")
			}
		}
		else{
			this.options.custom_conditions.pop("Inspiration")
		}
		
		
		const conditionsTotal = this.options.conditions.length + this.options.custom_conditions.length + (this.options.id in window.JOURNAL.notes && (window.DM || window.JOURNAL.notes[this.options.id].player));

		if (conditionsTotal > 0) {
			let conditionCount = 0;
			
			for (let i = 0; i < this.options.conditions.length; i++) {
				const conditionName = this.options.conditions[i];
				const isExhaustion = conditionName.startsWith("Exhaustion");
				const conditionSymbolName = isExhaustion ? 'exhaustion' : conditionName.toLowerCase();
				const conditionContainer = $("<div class='dnd-condition condition-container' />");
				const symbolImage = $("<img class='condition-img' src='/content/1-0-1449-0/skins/waterdeep/images/icons/conditions/" + conditionSymbolName + ".svg'/>");
				const conditionDescription = isExhaustion ? CONDITIONS.Exhaustion : CONDITIONS[conditionName];
				symbolImage.attr('title', [conditionName, ...conditionDescription].join(`\n`));
				conditionContainer.css('width', symbolSize + "px");
				conditionContainer.css("height", symbolSize + "px");
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				conditionContainer.dblclick(() => {
					const data = {
						player: window.PLAYER_NAME,
						img: window.PLAYER_IMG,
						text: window.MB.encode_message_text(`<div>${[conditionName, ...conditionDescription].map(line => `<p>${line}</p>`).join(``)}</div>`)
					};
					window.MB.inject_chat(data);
				});
				if (conditionCount >= 3) {
					moreCond.append(conditionContainer);
				} else {
					cond.append(conditionContainer);
				}
				conditionCount++;
			}

			for (let i = 0; i < this.options.custom_conditions.length; i++) {
				//Security logic to prevent HTML/JS from being injected into condition names.
				const conditionName = DOMPurify.sanitize( this.options.custom_conditions[i],{ALLOWED_TAGS: []});
				const conditionSymbolName = DOMPurify.sanitize( conditionName.replaceAll(' ','_').toLowerCase(),{ALLOWED_TAGS: []});
				const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
				let symbolImage;
				if (conditionName.startsWith('#')) {
					symbolImage = $(`<img class='condition-img custom-condition' src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style='background: ${conditionName}' />`);
				} else {
					symbolImage = $("<img class='condition-img custom-condition' src='" + window.EXTENSION_PATH + "assets/conditons/" + conditionSymbolName + ".png'/>");
				}
				symbolImage.attr('title', conditionName);
				conditionContainer.css('width', symbolSize + "px");
				conditionContainer.css("height", symbolSize + "px");
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				if (conditionCount >= 3) {
					if (conditionSymbolName === "concentration") {
						moreCond.prepend(conditionContainer);
					} else {
						moreCond.append(conditionContainer);
					}
				} else {
					if (conditionSymbolName === "concentration") {
						cond.prepend(conditionContainer);
					} else {
						cond.append(conditionContainer);
					}
				}
				
				conditionCount++;
			}
			// CHECK IF ADDING NOTE CONDITION
			if (this.options.id in window.JOURNAL.notes && (window.DM || window.JOURNAL.notes[this.options.id].player)) {
				console.log("aggiungerei nota");
				const conditionName = "note"
				const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
				const symbolImage = $("<img class='condition-img note-condition' src='" + window.EXTENSION_PATH + "assets/conditons/note.svg'/>");


				conditionContainer.dblclick(function(){
					window.JOURNAL.display_note(self.options.id);
				})
				symbolImage.attr('title', window.JOURNAL.notes[this.options.id].plain);
				conditionContainer.css('width', symbolSize + "px");
				conditionContainer.css("height", symbolSize + "px");
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				if (conditionCount >= 3) {
					moreCond.append(conditionContainer);
				} else {
					cond.append(conditionContainer);
				}
				conditionCount++;
			}

		}
				
		
		if (parent) {
			parent.find(".conditions").remove();
			parent.append(cond);
			parent.append(moreCond);
		} else {
			return [cond, moreCond];
		}
		console.groupEnd()
	}

	place(animationDuration) {
		
		if(!window.CURRENT_SCENE_DATA){
			// No scene loaded!
			return;
		}
		console.group("place")
		if (animationDuration == undefined || parseFloat(animationDuration) == NaN) {
			animationDuration = 1000;
		}
		console.log("cerco id" + this.options.id);
		var selector = "div[data-id='" + this.options.id + "']";
		var old = $("#tokens").find(selector);
		var self = this;
		/* UPDATE COMBAT TRACKER */
		this.update_combat_tracker()


		if (old.length > 0) {
			console.group("old token")
			console.log("trovato!!");

			if (old.css("left") != this.options.left || old.css("top") != this.options.top)
				
				remove_selected_token_bounding_box();
				if(old.is(':animated')){
					// this token is being moved quickly, speed up the animation
					animationDuration = 100;
				}
				
				old.animate(
					{
						left: this.options.left,
						top: this.options.top,
					}, { duration: animationDuration, queue: true, complete: function() {
						draw_selected_token_bounding_box();
					} });
				


			// CONCENTRATION REMINDER

			let scale = this.get_token_scale()
			var rotation = 0;
			if (this.options.rotation != undefined) {
				rotation = this.options.rotation;
			}
			old.find("img").css("transform", "scale(" + scale + ") rotate("+rotation+"deg)");
			
			if (old.attr('name') != this.options.name) {
				var selector = "tr[data-target='"+this.options.id+"']";
				var entry = $("#combat_area").find(selector);
				if (old.addClass('hasTooltip') && (!(this.options.name) || !(this.options.revealname))) {
					old.removeClass('hasTooltip');
						entry.removeClass("hasTooltip");
				}	
				if (this.options.name) {
					if ((window.DM || !this.options.monster || this.options.revealname)) {
						old.attr("data-name", this.options.name);
						old.addClass("hasTooltip");
							entry.attr("data-name", this.options.name);
							entry.addClass("hasTooltip");
					}
				}
			}


			if (old.attr('width') != this.options.size) {
				// NEED RESIZING
				old.find("img").css("border-width", Math.min(4, Math.round((this.options.size / 60.0) * 4)));
				old.find("img").animate({
					width: this.options.size,
					height: this.options.size
				}, { duration: 1000, queue: false });

				old.animate({
					width: this.options.size,
					height: this.options.size
				}, { duration: 1000, queue: false });
				
				var zindexdiff=Math.round(17/ (this.options.size/window.CURRENT_SCENE_DATA.hpps));
				old.css("z-index", 32+zindexdiff);

				var bar_height = Math.floor(this.options.size * 0.2);

				if (bar_height > 60)
					bar_height = 60;

				var fs = Math.floor(bar_height / 1.3) + "px";
				old.css("font-size",fs);
			}

			if (this.options.hidden) {
				if (window.DM)
					old.css("opacity", 0.5); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
				else
					old.hide();
			}
			else {
				old.css("opacity", 1);
				old.show();
			}

			this.build_conditions(old);

			if (this.selected) {
				old.addClass("tokenselected");
				toggle_player_selectable(this, old)
			}
			else {
				old.css("border", "");
				old.removeClass("tokenselected");
			}
			
			if(old.find("img").attr("src")!=this.options.imgsrc){
				old.find("img").attr("src",this.options.imgsrc);
			}
		
			if(this.options.disableborder){
				old.find("img").css("border-width","0");
			}
			
			setTokenAuras(old, this.options);

			if(!(this.options.square) && !(old.find("img").hasClass('token-round'))){
				old.find("img").addClass("token-round");
			}
			
			if(old.find("img").hasClass('token-round') && (this.options.square) ){
				old.find("img").removeClass("token-round");
			}

			if((!window.DM && this.options.restrictPlayerMove) || this.options.locked){
				old.draggable("disable");
				old.removeClass("ui-state-disabled"); // removing this manually.. otherwise it stops right click menu
				old.css("z-index", old.css("z-index")-2);
			}
			else if((window.DM && this.options.restrictPlayerMove) || !this.options.locked){
				old.draggable("enable");
			}	
			else if(!window.DM && (!this.options.restrictPlayerMove || !this.options.locked)){
				old.draggable("enable");
			}

			if(this.options.disableaura){
				old.find("img").css("box-shadow","");
			}
			
			if(this.options.legacyaspectratio == false) {
				// if the option is false, the token was either placed after the option was introduced, or the user actively chose to use the new option
				old.find("img").addClass("preserve-aspect-ratio");
			} else {
				// if the option is undefined, this token was placed before the option existed and should therefore use the legacy behavior
				// if the option is true, the user actively enabled the option
				old.find("img").removeClass("preserve-aspect-ratio");
			}

			// store custom token info if available
			if (typeof this.options.tokendatapath !== "undefined" && this.options.tokendatapath != "") {
				old.attr("data-tokendatapath", this.options.tokendatapath);
			}
			if (typeof this.options.tokendataname !== "undefined") {
				old.attr("data-tokendataname", this.options.tokendataname);
			}
			console.groupEnd()
		}
		else { // adding a new token
			console.group("new token")
			var tok = $("<div/>");
			var hpbar = $("<input class='hpbar'>");
			let scale = this.get_token_scale()
			
			var bar_height = Math.floor(this.options.size * 0.2);

			if (bar_height > 60)
				bar_height = 60;

			var fs = Math.floor(bar_height / 1.3) + "px";
			tok.css("font-size",fs);

			var rotation = 0;
			if (this.options.rotation != undefined) {
				rotation = this.options.rotation;
			}
			let imgClass = 'token-image';
			if(this.options.legacyaspectratio == false) {
				imgClass = 'token-image preserve-aspect-ratio';
			}
			var tokimg = $("<img style='transform:scale(" + scale + ") rotate(" + rotation + "deg)' class='"+imgClass+"'/>");
			if(!(this.options.square)){
				tokimg.addClass("token-round");
			}


			var zindexdiff=Math.round(17/ (this.options.size/window.CURRENT_SCENE_DATA.hpps));
			console.log("Diff: "+zindexdiff);
			
			tok.css("z-index", 32+zindexdiff);
			tok.width(this.options.size);
			tok.height(this.options.size);
			tok.addClass('token');

			tok.append(tokimg);

			tok.attr("data-id", this.options.id);
			tokimg.attr("src", this.options.imgsrc);
			tokimg.width(this.options.size);
			tokimg.height(this.options.size);
			tok.addClass("VTTToken");
			//tokimg.css("border","4px solid "+this.options.color);

			tokimg.css("border-style", "solid");
			tokimg.css("border-width", Math.min(4, Math.round((this.options.size / 60.0) * 4)));
			tokimg.css("border-color", this.options.color);
			
			if(this.options.disableborder)
				tokimg.css("border-width","0");
				
			tok.css("position", "absolute");
			tok.css("top", this.options.top);
			tok.css("left", this.options.left);
			tok.css("opacity", "0.0");

			if (typeof this.options.monster !== "undefined")
				tok.attr('data-monster', this.options.monster);

			if ((this.options.name) && (window.DM || !this.options.monster || this.options.revealname)) {
				tok.attr("data-name", this.options.name);
				tok.addClass("hasTooltip");
			}

			// store custom token info
			if (typeof this.options.tokendatapath !== "undefined" && this.options.tokendatapath != "") {
				tok.attr("data-tokendatapath", this.options.tokendatapath);
			}
			if (typeof this.options.tokendataname !== "undefined") {
				tok.attr("data-tokendataname", this.options.tokendataname);
			}

			var newopacity = 1.0;
			if (this.options.hidden) {
				if (window.DM)
					newopacity = 0.5; // DM SEE HIDDEN TOKENS AS OPACITY 0.5
				else
					tok.hide();
			}

			// CONDITIONS
			this.build_conditions().forEach(cond_bar => {
				tok.append(cond_bar);
			});

			setTokenAuras(tok, this.options);


			$("#tokens").append(tok);
			tok.animate({
				opacity: newopacity
			}, { duration: 3000, queue: false });


			let click = {
				x: 0,
				y: 0
			};
			tok.draggable({
				stop:
					function (event) {
						//remove cover for smooth drag
						$('.iframeResizeCover').remove();
			
						// this should be a XOR... (A AND !B) OR (!A AND B)
						let shallwesnap=  (window.CURRENT_SCENE_DATA.snap == "1"  && !(window.toggleSnap)) || ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);
						console.log("shallwesnap",shallwesnap);
						console.log("toggleSnap",window.toggleSnap);					
						if (shallwesnap) {

							// calculate offset in real coordinates
							const startX = window.CURRENT_SCENE_DATA.offsetx;
							const startY = window.CURRENT_SCENE_DATA.offsety;

							const selectedOldTop = parseInt($(event.target).css("top"));
							const selectedOldleft = parseInt($(event.target).css("left"));
							

							const selectedNewtop =  Math.round(Math.round( (selectedOldTop - startY) / window.CURRENT_SCENE_DATA.vpps)) * window.CURRENT_SCENE_DATA.vpps + startY;
							const selectedNewleft = Math.round(Math.round( (selectedOldleft - startX) / window.CURRENT_SCENE_DATA.hpps)) * window.CURRENT_SCENE_DATA.hpps + startX;

							console.log("Snapping from "+selectedOldleft+ " "+selectedOldTop + " -> "+selectedNewleft + " "+selectedNewtop);
							console.log("params startX " + startX + " startY "+ startY + " vpps "+window.CURRENT_SCENE_DATA.vpps + " hpps "+window.CURRENT_SCENE_DATA.hpps);

							$(event.target).css("top", selectedNewtop + "px");
							$(event.target).css("left", selectedNewleft + "px");

							///GET
							const token = $(event.target);
							const el = token.parent().find("#aura_" + token.attr("data-id").replaceAll("/", ""));
							if (el.length > 0) {
								const auraSize = parseInt(el.css("width"));

								el.css("top", `${selectedNewtop - ((auraSize - self.options.size) / 2)}px`);
								el.css("left", `${selectedNewleft - ((auraSize - self.options.size) / 2)}px`);
							}

							for (var id in window.TOKEN_OBJECTS) {
								if (window.TOKEN_OBJECTS[id].selected) {
									setTimeout(function(tempID) {
										$("[data-id='"+tempID+"']").removeClass("pause_click");
										console.log($("[data-id='"+id+"']"));
									}, 200, id);
									if (id != self.options.id) {
										const tok = $("#tokens div[data-id='" + id + "']");

										const oldtop = parseInt(tok.css("top"));
										const oldleft = parseInt(tok.css("left"));

										const newtop = Math.round((oldtop - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
										const newleft = Math.round((oldleft - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;

										tok.css("top", newtop + "px");
										tok.css("left", newleft + "px");

										const selEl = tok.parent().find("#aura_" + id.replaceAll("/", ""));
										if (selEl.length > 0) {
											const auraSize = parseInt(selEl.css("width"));

											selEl.css("top", `${newtop - ((auraSize - window.TOKEN_OBJECTS[id].options.size) / 2)}px`);
											selEl.css("left", `${newleft - ((auraSize - window.TOKEN_OBJECTS[id].options.size) / 2)}px`);
										}
									}
								}
							}

						} else {
							// we want to remove the pause_click even when grid snapping is turned off
							for (var id in window.TOKEN_OBJECTS) {
								if (window.TOKEN_OBJECTS[id].selected) {
									setTimeout(function(tempID) {
										$("[data-id='"+tempID+"']").removeClass("pause_click");
										console.log($("[data-id='"+id+"']"));
									}, 200, id);
								}
							}
						}

						window.DRAGGING = false;
						
						self.update_and_sync(event);
						if (self.selected) {
							for (id in window.TOKEN_OBJECTS) {
								if ((id != self.options.id) && window.TOKEN_OBJECTS[id].selected) {
									var curr = window.TOKEN_OBJECTS[id];
									var ev = { target: $("#tokens [data-id='" + id + "']").get(0) };
									curr.update_and_sync(ev);
								}
							}
						}

						draw_selected_token_bounding_box();
						window.toggleSnap=false;
					},

				start: function (event) {
					window.DRAGGING = true;
					click.x = event.clientX;
					click.y = event.clientY;
					if(tok.is(":animated")){
						self.stopAnimation();
					}
					
					// for dragging behind iframes so tokens don't "jump" when you move past it
					$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
					$("#sheet").append($('<div class="iframeResizeCover"></div>'));

					console.log("Click x: " + click.x + " y: " + click.y);

					self.orig_top = self.options.top;
					self.orig_left = self.options.left;
					if (self.selected) {
						for (let id in window.TOKEN_OBJECTS) {
							if (window.TOKEN_OBJECTS[id].selected) {
								$("[data-id='"+id+"']").addClass("pause_click");
								if($("[data-id='"+id+"']").is(":animated")){
									window.TOKEN_OBJECTS[id].stopAnimation();
								}
								if (id != self.options.id) {
									var curr = window.TOKEN_OBJECTS[id];
									curr.orig_top = curr.options.top;
									curr.orig_left = curr.options.left;

									const el = $("#aura_" + id.replaceAll("/", ""));
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
								}
							}
						}
					}

					const el = $("#aura_" + self.options.id.replaceAll("/", ""));
					if (el.length > 0) {
						el.attr("data-left", el.css("left").replace("px", ""));
						el.attr("data-top", el.css("top").replace("px", ""));
					}

					// Setup waypoint manager


					window.BEGIN_MOUSEX = (event.pageX - 200) * (1.0 / window.ZOOM);
					window.BEGIN_MOUSEY = (event.pageY - 200) * (1.0 / window.ZOOM);

					remove_selected_token_bounding_box();
				},

				drag: function(event, ui) {
					var zoom = window.ZOOM;

					var original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click.x + original.left) / zoom),
						top: Math.round((event.clientY - click.y + original.top) / zoom)
					};
					//console.log("Changing to " +ui.position.left+ " "+ui.position.top);
					// HACK TEST 
					/*$(event.target).css("left",ui.position.left);
					$(event.target).css("top",ui.position.top);*/
					// END OF HACK TEST

					const el = ui.helper.parent().find("#aura_" + ui.helper.attr("data-id").replaceAll("/", ""));
					if (el.length > 0) {
						let currLeft = parseFloat(el.attr("data-left"));
						let currTop = parseFloat(el.attr("data-top"));
						let offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
						let offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));
						el.css('left', (currLeft + offsetLeft) + "px");
						el.css('top', (currTop + offsetTop) + "px");
					}


					if (self.selected) { // if dragging on a selected token, we should move also the other selected tokens
						// try to move other tokens by the same amount
						//var offsetLeft=parseInt($(event.target).css("left"))-parseInt(orig_options.left);
						//var offsetTop=parseInt($(event.target).css("top"))-parseInt(orig_options.top);
						var offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
						var offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));

						//console.log("OFFSETLEFT "+offsetLeft+ " OFFSETTOP " + offsetTop);

						for (let id in window.TOKEN_OBJECTS) {
							if ((id != self.options.id) && window.TOKEN_OBJECTS[id].selected && (!window.TOKEN_OBJECTS[id].options.locked || (window.DM && window.TOKEN_OBJECTS[id].options.restrictPlayerMove))) {
								//console.log("sposto!");
								var curr = window.TOKEN_OBJECTS[id];
								var tok = $("#tokens div[data-id='" + id + "']");
								tok.css('left', (parseInt(curr.orig_left) + offsetLeft) + "px");
								tok.css('top', (parseInt(curr.orig_top) + offsetTop) + "px");
								//curr.options.top=(parseInt(curr.orig_top)+offsetTop)+"px";
								//curr.place();

								const selEl = tok.parent().find("#aura_" + id.replaceAll("/", ""));
								if (selEl.length > 0) {
									let currLeft = parseFloat(selEl.attr("data-left"));
									let currTop = parseFloat(selEl.attr("data-top"));
									let offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
									let offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));
									selEl.css('left', (currLeft + offsetLeft) + "px");
									selEl.css('top', (currTop + offsetTop) + "px");
								}
							}
						}

					}

				}
			});

			if(this.options.locked){
				tok.draggable("disable");
				tok.removeClass("ui-state-disabled");
			}
			if(!window.DM && this.options.restrictPlayerMove){
				tok.draggable("disable");
				tok.removeClass("ui-state-disabled");
			}

			tok.find(".token-image").dblclick(function(e) {
				self.highlight(true); // dont scroll
				var data = {
					id: self.options.id
				};
				window.MB.sendMessage('custom/myVTT/highlight', data);
			})

			tok.find(".token-image").click(function() {
				let parentToken = $(this).parent(".VTTToken");
				if (parentToken.hasClass("pause_click")) {
					return;
				}
				let tokID = parentToken.attr('data-id');
				let thisSelected = !(parentToken.hasClass('tokenselected'));
				let count = 0;
				if (shiftHeld == false) {
					deselect_all_tokens();
				}
				if (thisSelected == true) {
					parentToken.addClass('tokenselected');
					toggle_player_selectable(window.TOKEN_OBJECTS[tokID], parentToken)
				} else {
					parentToken.removeClass('tokenselected');
				}				

				window.TOKEN_OBJECTS[tokID].selected = thisSelected;

				for (var id in window.TOKEN_OBJECTS) {
					var curr = window.TOKEN_OBJECTS[id];
					if (curr.selected == true) {
						count++;
					}			
				}

				window.MULTIPLE_TOKEN_SELECTED = (count > 1);
				draw_selected_token_bounding_box(); // update rotation bounding box
			});
			
			console.groupEnd()
		}
		// HEALTH AURA / DEAD CROSS
		selector = "div[data-id='" + this.options.id + "']";
		let token = $("#tokens").find(selector);
		this.build_stats(token)
		this.toggle_stats(token)
		this.update_health_aura(token)
		this.update_dead_cross(token)
		// this.toggle_player_owned(token)
		toggle_player_selectable(this, token)
		check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		console.groupEnd()
	}

	// key: String, numberRemaining: Number; example: track_ability("1stlevel", 2) // means they have 2 1st level spell slots remaining
	track_ability(key, numberRemaining) {
		if (this.options.abilityTracker === undefined) {
			this.options.abilityTracker = {};
		}
		let asNumber = parseInt(numberRemaining);
		if (isNaN(asNumber)) {
			console.warn(`track_ability was given an invalid value to track. key: ${key}, numberRemaining: ${numberRemaining}`);
			return;
		}
		this.options.abilityTracker[key] = asNumber;
		if (this.persist !== undefined && this.persist != null) {
			this.persist();
		}
	}
	// returns the stored value as a number or returns defaultValue
	get_tracked_ability(key, defaultValue) {
		if (this.options.abilityTracker === undefined) {
			return defaultValue;
		}
		let storedValue = parseInt(this.options.abilityTracker[key]);
		if (storedValue === undefined || isNaN(storedValue)) {
			return defaultValue;
		}
		return storedValue;
	}
	
}

/**
 * disables player selection of a token when token is locked & restricted
 * @param tokenInstance token instance ofc
 * @param token jquery selected div with the class token
 */
function toggle_player_selectable(tokenInstance, token){
	if (tokenInstance.options.locked && !window.DM){
		token?.css("cursor","default");
		token?.css("pointer-events","none");
	}
	else{
		token?.css("cursor","move");
		token?.css("pointer-events","auto");
	}
}

// Stop the right click mouse down from cancelling our drag
function dragging_right_click_mousedown(event) {

	event.preventDefault();
	event.stopPropagation();
}

// This is called when we right-click mouseup during a drag operation
function dragging_right_click_mouseup(event) {

	if (window.DRAGGING && event.button == 2) {
		event.preventDefault();
		event.stopPropagation();
		var mousex = (event.pageX - 200) * (1.0 / window.ZOOM);
		var mousey = (event.pageY - 200) * (1.0 / window.ZOOM);
		WaypointManager.checkNewWaypoint(mousex, mousey);
	}
}

// Named function to bind/unbind contextmenu
function return_false() {

	return false;
}

function default_options() {
	return {
		color: '#000000',
		conditions: [],
		hp: "",
		max_hp: "",
		ac: "",
		name: "",
		aura1: {
			feet: "0",
			color: "rgba(255, 129, 0, 0.3)"
		},
		aura2: {
			feet: "0",
			color: "rgba(255, 255, 0, 0.1)"
		},
		auraVisible: true,
		legacyaspectratio: window.TOKEN_SETTINGS['legacyaspectratio']
	};
}

function token_button(e, tokenIndex = null, tokenTotal = null) {
	console.log(e.target.outerHTML);
	let imgsrc = parse_img($(e.target).attr("data-img"));
	if (imgsrc.startsWith("data:")){
		alert("WARNING! Support for token urls that starts with data: will be removed soon (as they can cause problems). Please find an image with url that begins with http:// or https://");
	}
	let id;
	let centerX = $(window).scrollLeft() + Math.round(+$(window).width() / 2) - 200;
	let centerY = $(window).scrollTop() + Math.round($(window).height() / 2) - 200;

	centerX = Math.round(centerX * (1.0 / window.ZOOM));
	centerY = Math.round(centerY * (1.0 / window.ZOOM));

	if( $(e.target).attr("data-top"))
		centerY=$(e.target).attr("data-top");
	if( $(e.target).attr("data-left"))
		centerX=$(e.target).attr("data-left");
	id = $(e.target).attr('data-set-token-id');
	if (typeof (id) === "undefined") {
		id = uuid();
	}

	// if this is a player token, check if the token is already on the map
	if(id in window.TOKEN_OBJECTS){
		if(window.TOKEN_OBJECTS[id].isPlayer())
		{
			window.TOKEN_OBJECTS[id].highlight();
			return;
		}
	}
	
	let options = default_options();
	options.id = id;
	options.imgsrc = imgsrc;
	options.left = `${centerX}px`;
	options.top = `${centerY}px`;
	
	if(typeof $(e.target).attr('data-stat') !== "undefined"){ // APPLY SAVED TOKEN SETTINGS ONLY FOR MONSTERS
		for(let o in window.TOKEN_SETTINGS){
				if(window.TOKEN_SETTINGS[o]){
					options[o]="1";
				}
		}
	}
	
	if ($(e.target).attr('data-size')) {
		options.size = $(e.target).attr('data-size');
	}

	if ($(e.target).attr('data-disablestat')) {
		options.disablestat = $(e.target).attr('data-disablestat');
	}

	if ($(e.target).attr('data-hidestat')) {
		options.hidestat = $(e.target).attr('data-hidestat');
	}
	
	if ($(e.target).attr('data-disableborder')) {
		options.disableborder = $(e.target).attr('data-disableborder');
	}
	
	if ($(e.target).attr('data-square')=="1") {
		options.square = true;
	}

	if ($(e.target).attr('data-hp')) {
		options.hp = $(e.target).attr('data-hp');
	}

	if ($(e.target).attr('data-maxhp')) {
		options.max_hp = $(e.target).attr('data-maxhp');
	}

	if ($(e.target).attr('data-ac')) {
		options.ac = $(e.target).attr('data-ac');
	}

	if ($(e.target).attr('data-elev')) {
		options.elev = $(e.target).attr('data-elev');
	}


	if ($(e.target).attr('data-hidden')) {
		options.hidden = true;
	}

	if ($(e.target).attr('data-revealname')) {
		options.revealname = true;
	}

	if (typeof $(e.target).attr('data-stat') !== "undefined") {
		options.monster = $(e.target).attr('data-stat');
	}

	if (options.monster || options.id.includes("/")) {
		// monsters and players should use the global setting as the default
		options.legacyaspectratio = window.TOKEN_SETTINGS['legacyaspectratio'];
	} else if ($(e.target).attr('data-legacyaspectratio') == true || $(e.target).attr('data-legacyaspectratio') == 'true' || $(e.target).attr('data-legacyaspectratio') == undefined) {
		// this is a custom token. It should use the setting that was defined when it was created
		// if the option is undefined, this token was created before the option existed and should therefore use the legacy behavior
		// if the option is true, the user actively enabled the option.
		// if the option is false, then we want to preserve aspect ratio
		options.legacyaspectratio = true;
	}


	if ($(e.target).attr('data-name')) {
		options.name = $(e.target).attr('data-name');
		if (options.monster > 0) { // ADD number to the end of named monsters
			var count = 1;
			for (var tokenid in window.TOKEN_OBJECTS) {
				if (window.TOKEN_OBJECTS[tokenid].options.monster == options.monster)
					count++;
			}
			if (count > 1) {
				console.log("Count " + count);
				options.name = $(e.target).attr('data-name') + " " + count;
				options.color = "#" + TOKEN_COLORS[(count - 1) % 54];
			}
		}

		let specifiedCustomImg = $(e.target).data('custom-img');
		if (specifiedCustomImg != undefined && specifiedCustomImg.length > 0) {
			// the user has specifically chosen a custom image so use it
			options.imgsrc = specifiedCustomImg;
		} else {
			// if there are custom images defined, use those instead of the default DDB image
			let customImgs = get_custom_monster_images($(e.target).attr('data-stat'));
			if (customImgs != undefined && customImgs.length > 0) {
				let randomIndex = getRandomInt(0, customImgs.length);
				options.imgsrc = customImgs[randomIndex];
			}
		}
	}

	if (typeof $(e.target).attr('data-color') !== "undefined") {
		options.color = $(e.target).attr('data-color');
	}

	if (tokenIndex !== null && tokenTotal !== null) {
		options.left = (centerX + (((options.size || 68.33) * 5) / 2) * Math.cos(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
		options.top = (centerY + (((options.size || 68.33) * 5) / 2) * Math.sin(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
	}

	//options = Object.assign({}, options, window.TOKEN_SETTINGS);
	window.ScenesHandler.create_update_token(options);

	if (id in window.PLAYER_STATS) {
		window.MB.handlePlayerData(window.PLAYER_STATS[id]);
	}

	window.MB.sendMessage('custom/myVTT/token', options);

}

function place_token_in_center_of_map(tokenObject) {
	let centerX = $(window).scrollLeft() + Math.round(+$(window).width() / 2) - 200;
	let centerY = $(window).scrollTop() + Math.round($(window).height() / 2) - 200;
	centerX = Math.round(centerX * (1.0 / window.ZOOM));
	centerY = Math.round(centerY * (1.0 / window.ZOOM));
	place_token_at_point(tokenObject, centerX, centerY);
}

function place_token_under_cursor(tokenObject, eventPageX, eventPageY) {
	// adjust for map offset and zoom
	let mouseX = (eventPageX - 200) * (1.0 / window.ZOOM);
	let mouseY = (eventPageY - 200) * (1.0 / window.ZOOM);
	let fogOverlay = $("#fog_overlay"); // not sure if there's a better way to find this...
	if (mouseX <= 0 || mouseY <= 0 || mouseX >= fogOverlay.width() || mouseY >= fogOverlay.height()) {
		console.log("not dropping token outside of the scene");
		return;
	}
	// this was copied the place function in this file. We should make this a single function to be used in other places
	let shallwesnap = (window.CURRENT_SCENE_DATA.snap == "1"  && !(window.toggleSnap)) || ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);
	if (shallwesnap) {
		// adjust to the nearest square coordinate
		const startX = window.CURRENT_SCENE_DATA.offsetx;
		const startY = window.CURRENT_SCENE_DATA.offsety;
		const selectedNewtop = Math.round((mouseY - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
		const selectedNewleft = Math.round((mouseX - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;
		place_token_at_point(tokenObject, selectedNewleft, selectedNewtop);
	} else {
		// drop it exactly where it is
		place_token_at_point(tokenObject, mouseX, mouseY);
	}
}

function place_token_at_point(tokenObject, x, y) {

	console.log(`attempting to place token at ${x}, ${y}; options: ${JSON.stringify(tokenObject)}`);

	if (tokenObject.id == undefined) {
		tokenObject.id = uuid();
	}
	// if this is a player token, check if the token is already on the map
	if(tokenObject.id in window.TOKEN_OBJECTS && window.TOKEN_OBJECTS[tokenObject.id].isPlayer()){
		window.TOKEN_OBJECTS[tokenObject.id].highlight();
		return;
	}

	// overwrite the defaults with global settings
	let options = Object.assign(default_options(), window.TOKEN_SETTINGS);
	// now overwrite with anything that we were given
	options = Object.assign(options, tokenObject);
	options.imgsrc = parse_img(options.imgsrc);

	options.left = `${x}px`;
	options.top = `${y}px`;
	if (options.size == undefined) {
		if (options.sizeId != undefined) {
			// sizeId was specified, convert it to size. This is used when adding from the monster pane
			if (options.sizeId == 2) {
				options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 0.5;
			} else if (options.sizeId == 5) {
				options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 2;
			} else if (options.sizeId == 6) {
				options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 3;
			} else if (options.sizeId == 7) {
				options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 4;
			} else {
				// default to small/medium size
				options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 1;
			}
		} else if (options.tokenSize != undefined && parseInt(options.tokenSize) != NaN) {
			// tokenSize was specified, convert it to size. tokenSize is the number of squares this token fills
			options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * parseInt(options.tokenSize);
		} else {
			// default to small/medium size
			options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 1;
		}
	}

	// place the token
	window.ScenesHandler.create_update_token(options);
	if (options.id in window.PLAYER_STATS) {
		window.MB.handlePlayerData(window.PLAYER_STATS[options.id]);
	}
	window.MB.sendMessage('custom/myVTT/token', options);

	
	window.EncounterHandler.update_avtt_encounter_with_players_and_monsters();
}

function array_remove_index_by_value(arr, item) {
	for (var i = arr.length; i--;) {
		if (arr[i] === item) { arr.splice(i, 1); }
	}
}

function menu_callback(key, options, event) {
	if (key == "view") {
		if (typeof $(this).attr('data-monster') !== "undefined") {
			if (encounter_builder_dice_supported()) {
				console.log(`attempting to open monster stat block with monsterId ${$(this).attr('data-monster')} and tokenId ${$(this).attr('data-id')}`);
				open_monster_stat_block_with_id($(this).attr('data-monster'), $(this).attr('data-id'));
			} else {
				load_monster_stat($(this).attr('data-monster'), token_id=$(this).attr('data-id'));	
			}
		}
		else {
			//load_frame($(this).attr('data-id'));
			open_player_sheet($(this).attr('data-id'));
		}
	}
	if (key == "delete") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].delete();
	}

	if ( key =="note_edit") {
		if (!(id in window.JOURNAL.notes)) {
			window.JOURNAL.notes[id] = {
				title: window.TOKEN_OBJECTS[id].options.name,
				text: '',
				plain: '',
				player: false
			}
		}
		window.JOURNAL.edit_note(id);
	}
	if( key =="note_view"){
		window.JOURNAL.display_note(id);
	}
	if ( key =="note_delete") {
		if(id in window.JOURNAL.notes){
			delete window.JOURNAL.notes[id];
			window.JOURNAL.persist();
			window.TOKEN_OBJECTS[id].place();
		}
		
	}
	if (key == 'quick_roll_menu') {
		open_roll_menu(event)
		id = $(this).attr('data-id');
		add_to_roll_menu(window.TOKEN_OBJECTS[id])						
	}

	if (key == "token_combat") {
		id = $(this).attr('data-id');
		if (window.TOKEN_OBJECTS[id].options.combat === true) {
			ct_remove_token(window.TOKEN_OBJECTS[id]);
		} else {
			ct_add_token(window.TOKEN_OBJECTS[id]);
		}
	}
	if (key.startsWith("cond_")) {
		condition = key.substr(5);
		id = $(this).attr('data-id');
		if (window.TOKEN_OBJECTS[id].options.conditions.includes(condition)) {
			array_remove_index_by_value(window.TOKEN_OBJECTS[id].options.conditions, condition);
		}
		else {
			window.TOKEN_OBJECTS[id].options.conditions.push(condition);
		}
		window.TOKEN_OBJECTS[id].place();
		window.ScenesHandler.persist();
		// should persist ?	
	}

	if (key === "imgsrcSelect") {
		id = $(this).attr("data-id");
		if (!(id in window.TOKEN_OBJECTS)) {
			return;
		}
		let tok = window.TOKEN_OBJECTS[id];
		let monsterId = $(options.$trigger).attr("data-monster");
		let name = $(options.$trigger).data("name");
		if (tok.isPlayer()) {
			display_player_token_customization_modal(id, tok);
		} else if (monsterId !== undefined) {
			window.StatHandler.getStat(monsterId, function(stat) {
				display_monster_customization_modal(tok, monsterId, name, stat.data.avatarUrl);
			});
		} else {
			display_placed_token_customization_modal(tok);
		}
	}

	if (key == "configure") {
		token_context_menu_expanded([$(this).attr("data-id")]);
	}
	
}

function token_inputs(opt) {
	// this is the trigger element
	//alert('chiamato');
	// export states to data store

	if (opt.$selected && opt.$selected.hasClass("aura-preset")) {
		return;
	}
	if (opt.$selected && opt.$selected.hasClass("imgsrcSelect")) {
		// this is handled in menu_callback
		return;
	}


	id = $(this).attr("data-id");
	if (!(id in window.TOKEN_OBJECTS))
		return;

	data = $.contextMenu.getInputValues(opt, $(this).data());
	is_monster = window.TOKEN_OBJECTS[id].options.monster > 0;

	token = window.TOKEN_OBJECTS[id];

	if (data.imgsrc != undefined) {
		token.options.imgsrc = parse_img(data.imgsrc);
	}


	if (window.DM) {
		if (!is_player_id(id)) {
			if (data.hp?.startsWith("+") || data.hp?.startsWith("-"))
				data.hp = parseInt(token.options.hp) + parseInt(data.hp);

			token.options.hp = data.hp;

			if (data.max_hp.startsWith("+") || data.max_hp.startsWith("-"))
				data.max_hp = parseInt(token.options.max_hp) + parseInt(data.max_hp);

			token.options.max_hp = data.max_hp;

			if (!isNaN(data.ac)) {
				token.options.ac = data.ac;
			}
			if (!isNaN(data.elev)) {
				token.options.elev = data.elev;
			}
		}

		
		token.options.name = data.name;
		token.options.elev = data.elev;

		if (opt.imgsrcSelection != undefined && opt.imgsrcSelection.length > 0) {
			token.options.imgsrc = parse_img(opt.imgsrcSelection);
		} else if (data.imgsrc != undefined) {
			token.options.imgsrc = parse_img(data.imgsrc);
		}
	}
	
	token.place();
	token.sync();
	if(window.DM)
		token.persist();
}

function multiple_callback(key, options, event) {
	if (key == "token_combat") {
		$("#tokens .tokenselected").each(function() {
			id = $(this).attr('data-id');
			ct_add_token(window.TOKEN_OBJECTS[id],false);
			ct_persist();
		});
	}
	if (key == "hide") {
		$("#tokens .tokenselected").each(function() {
			id = $(this).attr('data-id');
			window.TOKEN_OBJECTS[id].hide();
		});
	}
	if (key == "show") {
		$("#tokens .tokenselected").each(function() {
			id = $(this).attr('data-id');
			window.TOKEN_OBJECTS[id].show();
		});
	}
	if (key == "configure") {
		let tokenIds = [];
		$("#tokens .tokenselected").each(function() {
			tokenIds.push($(this).attr('data-id'));
		});
		token_context_menu_expanded(tokenIds);
	}
	if (key == "delete") {
		$("#tokens .tokenselected").each(function() {
			id = $(this).attr('data-id');
			$(this).remove();
			delete window.ScenesHandler.scene.tokens[id];
			delete window.TOKEN_OBJECTS[id];
			$("#aura_" + id.replaceAll("/", "")).remove();
			
			if($("#combat_area tr[data-target='"+id+"']").length>0){
				if( $("#combat_area tr[data-target='"+id+"']").attr('data-current')=="1"){
					$("#combat_next_button").click();
				}
				$("#combat_area tr[data-target='"+id+"']").remove(); // delete token from the combat tracker if it's there
			}
      draw_selected_token_bounding_box(); // clean up the rotation if needed
		});
		ct_persist();
		
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
	}
	if (key == 'group_roll') {
		open_roll_menu(event)
		$("#tokens .tokenselected").each(function() {
			id = $(this).attr('data-id');
			add_to_roll_menu(window.TOKEN_OBJECTS[id])
		});							
	}
}

function is_player_id(id) {
	// player tokens have ids with a structure like "/profile/username/characters/someId"
	// monster tokens have a uuid for their id
	if (id === undefined) {
		return false;
	}
	return id.includes("/");
}

function determine_condition_item_classname(tokenIds, condition) {
	// loop through all the tokens to see if they all have the given condition active, and return the appropriate class name for that condition
	if (tokenIds === undefined || tokenIds.length === 0 || condition === undefined) {
		// we got nothing so return nothing
		return "none-active";
	}
	let conditionsAreActive = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].hasCondition(condition))
		.filter(t => t !== undefined);
	let uniqueActivations = [...new Set(conditionsAreActive)];
	if (uniqueActivations.length === 0 || (uniqueActivations.length === 1 && uniqueActivations[0] === false)) {
		// nothing has this condition active
		return "none-active";
	} else if (uniqueActivations.length === 1 && uniqueActivations[0] === true) {
		// everything we were given has this condition active. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things have this condition active
		return "some-active active-condition";
	}
}

function build_conditions_submenu(tokenIdList) {

	let tokenIds = tokenIdList.filter(id => !is_player_id(id))
	if (tokenIds.length === 0) {
		return {
			noplayers: {
				name: 'Player conditions must be set in the character sheet.',
				className: 'context-menu-helptext',
				disabled: true
			}
		};
	}

	let cond_items = {};
	cond_items.cond_clear = {
		name: "Remove All",
		className: "material-icon",
		icon: "close-red",
		callback: function(itemKey, opt) {
			for (let i = 0; i < tokenIds.length; i++) {
				let tokenId = tokenIds[i];
				let token = window.TOKEN_OBJECTS[tokenId];
				if (!token.isPlayer()) { // unfortunately, we can't set conditions on player tokens
					token.options.conditions = [];
					token.place_sync_persist();
				}
			}
			$(".active-condition.context-menu-icon-condition").removeClass("single-active all-active some-active active-condition");
			return false;
		}
	};
	if (tokenIds.length !== tokenIdList.length) {
		cond_items.noplayers = {
			name: 'You have a player token selected! Player conditions must be set in the character sheet. All selected player tokens have been ignored in this submenu.',
			className: 'context-menu-helptext',
			disabled: true
		};
	}
	cond_items.sep = "---";

	for (let i = 0; i < STANDARD_CONDITIONS.length; i++) {
		let conditionName = STANDARD_CONDITIONS[i];
		let command = `cond_${conditionName}`;

		cond_items[command] = {
			name: conditionName,
			className: `context-menu-icon-condition ${determine_condition_item_classname(tokenIds, conditionName)}`,
			icon: conditionName.toLowerCase(),
			callback: function(itemKey, opt) {
				let condition = itemKey.slice(5);
				console.log(condition, opt);
				let deactivateAll = opt.$selected.hasClass("some-active")
				for (let j = 0; j < tokenIds.length; j++) {
					let tokenId = tokenIds[j];
					let token = window.TOKEN_OBJECTS[tokenId];
					if (!token.isPlayer()) { // unfortunately, we can't set conditions on player tokens
						if (deactivateAll || token.hasCondition(condition)) {
							token.removeCondition(condition)
						} else {
							token.addCondition(condition)
						}
						token.place_sync_persist();
					}
				}
				opt.$selected.removeClass("single-active all-active some-active active-condition");
				opt.$selected.addClass(determine_condition_item_classname(tokenIds, condition));
				return false;
			}
		}
	}

	return cond_items;
}

function build_markers_submenu(tokenIds) {

	let custom_cond_items = {};
	custom_cond_items.cond_clear = {
		name: "Remove All",
		className: "material-icon",
		icon: "close-red",
		callback: function(itemKey, opt) {
			for (let i = 0; i < tokenIds.length; i++) {
				let tokenId = tokenIds[i];
				let token = window.TOKEN_OBJECTS[tokenId];
				token.options.custom_conditions = [];
				token.place_sync_persist();
			}
			$(".active-condition.context-menu-icon-condition").removeClass("single-active all-active some-active active-condition");
			return false;
		}
	};
	custom_cond_items.sep = "---";

	for (let i = 0; i < CUSTOM_CONDITIONS.length; i++) {
		let conditionName = CUSTOM_CONDITIONS[i];
		let command = `custom_${conditionName}`;
		let item = {
			className: `context-menu-icon-condition ${determine_condition_item_classname(tokenIds, conditionName)}`,
			callback: function(itemKey, opt) {
				let condition = itemKey.slice(7);
				console.log(condition, opt, opt.$selected);
				let deactivateAll = opt.$selected.hasClass("some-active")
				for (let j = 0; j < tokenIds.length; j++) {
					let tokenId = tokenIds[j];
					let token = window.TOKEN_OBJECTS[tokenId];
					if (deactivateAll || token.hasCondition(condition)) {
						token.removeCondition(condition)
					} else {
						token.addCondition(condition)
					}
					token.place_sync_persist();
				}
				opt.$selected.removeClass("single-active all-active some-active active-condition");
				opt.$selected.addClass(determine_condition_item_classname(tokenIds, condition));
				return false;
			}
		};
		if (conditionName.startsWith("#")) {
			item.name = `<div class="color-reminder" style="background:${conditionName}">&nbsp;</div>`;
			item.isHtmlName = true;
		} else {
			item.name = conditionName;
			item.icon = conditionName.toLowerCase().replaceAll(" ", "-").replaceAll("(", "-").replaceAll(")", "");
			item.className += " context-menu-markers-icon";
		}
		custom_cond_items[command] = item;
	}

	return custom_cond_items;
}

function determine_hidden_classname(tokenIds) {
	let allHiddenStates = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].options.hidden === true)
		.filter(t => t !== undefined);
	let uniqueHiddenStates = [...new Set(allHiddenStates)];

	let className = "";
	if (uniqueHiddenStates.length === 0 || (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === false)) {
		// none of these tokens are hidden
		className = "none-active";
	} else if (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === true) {
		// everything we were given is hidden. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things are hidden
		return "some-active active-condition";
	}
}

function build_hide_show_item(tokenIds) {
	return {
		name: "Hidden",
		icon: "invisible",
		className: determine_hidden_classname(tokenIds) + " context-menu-icon-condition",
		callback: function(itemKey, opt) {
			console.log(itemKey, opt);
			let hideAll = opt.$selected.hasClass("some-active")
			for (let j = 0; j < tokenIds.length; j++) {
				let tokenId = tokenIds[j];
				let token = window.TOKEN_OBJECTS[tokenId];
				if (hideAll || token.options.hidden !== true) {
					token.hide();
				} else {
					token.show();
				}
			}
			opt.$selected.removeClass("single-active all-active some-active active-condition");
			opt.$selected.addClass(determine_hidden_classname(tokenIds));
			return false;
		}
	};
}

function is_player_id(id) {
	// player tokens have ids with a structure like "/profile/username/characters/someId"
	// monster tokens have a uuid for their id
	if (id === undefined) {
		return false;
	}
	return id.includes("/");
}

function determine_condition_item_classname(tokenIds, condition) {
	// loop through all the tokens to see if they all have the given condition active, and return the appropriate class name for that condition
	if (tokenIds === undefined || tokenIds.length === 0 || condition === undefined) {
		// we got nothing so return nothing
		return "none-active";
	}
	let conditionsAreActive = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].hasCondition(condition))
		.filter(t => t !== undefined);
	let uniqueActivations = [...new Set(conditionsAreActive)];
	if (uniqueActivations.length === 0 || (uniqueActivations.length === 1 && uniqueActivations[0] === false)) {
		// nothing has this condition active
		return "none-active";
	} else if (uniqueActivations.length === 1 && uniqueActivations[0] === true) {
		// everything we were given has this condition active. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things have this condition active
		return "some-active active-condition";
	}
}

function build_conditions_submenu(tokenIdList) {

	let tokenIds = tokenIdList.filter(id => !is_player_id(id))
	if (tokenIds.length === 0) {
		return {
			noplayers: {
				name: 'Player conditions must be set in the character sheet.',
				className: 'context-menu-helptext',
				disabled: true
			}
		};
	}

	let cond_items = {};
	cond_items.cond_clear = {
		name: "Remove All",
		className: "material-icon",
		icon: "close-red",
		callback: function(itemKey, opt) {
			for (let i = 0; i < tokenIds.length; i++) {
				let tokenId = tokenIds[i];
				let token = window.TOKEN_OBJECTS[tokenId];
				if (!token.isPlayer()) { // unfortunately, we can't set conditions on player tokens
					token.options.conditions = [];
					token.place_sync_persist();
				}
			}
			$(".active-condition.context-menu-icon-condition").removeClass("single-active all-active some-active active-condition");
			return false;
		}
	};
	if (tokenIds.length !== tokenIdList.length) {
		cond_items.noplayers = {
			name: 'You have a player token selected! Player conditions must be set in the character sheet. All selected player tokens have been ignored in this submenu.',
			className: 'context-menu-helptext',
			disabled: true
		};
	}
	cond_items.sep = "---";

	for (let i = 0; i < STANDARD_CONDITIONS.length; i++) {
		let conditionName = STANDARD_CONDITIONS[i];
		let command = `cond_${conditionName}`;

		cond_items[command] = {
			name: conditionName,
			className: `context-menu-icon-condition ${determine_condition_item_classname(tokenIds, conditionName)}`,
			icon: conditionName.toLowerCase(),
			callback: function(itemKey, opt) {
				let condition = itemKey.slice(5);
				console.log(condition, opt);
				let deactivateAll = opt.$selected.hasClass("some-active")
				for (let j = 0; j < tokenIds.length; j++) {
					let tokenId = tokenIds[j];
					let token = window.TOKEN_OBJECTS[tokenId];
					if (!token.isPlayer()) { // unfortunately, we can't set conditions on player tokens
						if (deactivateAll || token.hasCondition(condition)) {
							token.removeCondition(condition)
						} else {
							token.addCondition(condition)
						}
						token.place_sync_persist();
					}
				}
				opt.$selected.removeClass("single-active all-active some-active active-condition");
				opt.$selected.addClass(determine_condition_item_classname(tokenIds, condition));
				return false;
			}
		}
	}

	return cond_items;
}

function build_markers_submenu(tokenIds) {

	let custom_cond_items = {};
	custom_cond_items.cond_clear = {
		name: "Remove All",
		className: "material-icon",
		icon: "close-red",
		callback: function(itemKey, opt) {
			for (let i = 0; i < tokenIds.length; i++) {
				let tokenId = tokenIds[i];
				let token = window.TOKEN_OBJECTS[tokenId];
				token.options.custom_conditions = [];
				token.place_sync_persist();
			}
			$(".active-condition.context-menu-icon-condition").removeClass("single-active all-active some-active active-condition");
			return false;
		}
	};
	custom_cond_items.sep = "---";

	for (let i = 0; i < CUSTOM_CONDITIONS.length; i++) {
		let conditionName = CUSTOM_CONDITIONS[i];
		let command = `custom_${conditionName}`;
		let item = {
			className: `context-menu-icon-condition ${determine_condition_item_classname(tokenIds, conditionName)}`,
			callback: function(itemKey, opt) {
				let condition = itemKey.slice(7);
				console.log(condition, opt, opt.$selected);
				let deactivateAll = opt.$selected.hasClass("some-active")
				for (let j = 0; j < tokenIds.length; j++) {
					let tokenId = tokenIds[j];
					let token = window.TOKEN_OBJECTS[tokenId];
					if (deactivateAll || token.hasCondition(condition)) {
						token.removeCondition(condition)
					} else {
						token.addCondition(condition)
					}
					token.place_sync_persist();
				}
				opt.$selected.removeClass("single-active all-active some-active active-condition");
				opt.$selected.addClass(determine_condition_item_classname(tokenIds, condition));
				return false;
			}
		};
		if (conditionName.startsWith("#")) {
			item.name = `<div class="color-reminder" style="background:${conditionName}">&nbsp;</div>`;
			item.isHtmlName = true;
		} else {
			item.name = conditionName;
			item.icon = conditionName.toLowerCase().replaceAll(" ", "-").replaceAll("(", "-").replaceAll(")", "");
			item.className += " context-menu-markers-icon";
		}
		custom_cond_items[command] = item;
	}

	return custom_cond_items;
}

function determine_hidden_classname(tokenIds) {
	let allHiddenStates = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].options.hidden === true)
		.filter(t => t !== undefined);
	let uniqueHiddenStates = [...new Set(allHiddenStates)];

	let className = "";
	if (uniqueHiddenStates.length === 0 || (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === false)) {
		// none of these tokens are hidden
		className = "none-active";
	} else if (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === true) {
		// everything we were given is hidden. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things are hidden
		return "some-active active-condition";
	}
}

function build_hide_show_item(tokenIds) {
	return {
		name: "Hidden",
		icon: "invisible",
		className: determine_hidden_classname(tokenIds) + " context-menu-icon-condition",
		callback: function(itemKey, opt) {
			console.log(itemKey, opt);
			let hideAll = opt.$selected.hasClass("some-active")
			for (let j = 0; j < tokenIds.length; j++) {
				let tokenId = tokenIds[j];
				let token = window.TOKEN_OBJECTS[tokenId];
				if (hideAll || token.options.hidden !== true) {
					token.hide();
				} else {
					token.show();
				}
			}
			opt.$selected.removeClass("single-active all-active some-active active-condition");
			opt.$selected.addClass(determine_hidden_classname(tokenIds));
			return false;
		}
	};
}

function token_menu() {
	$.contextMenu({
		selector: '.VTTToken',

		build: function(element, e) {

			if ($(element).hasClass("tokenselected") && window.MULTIPLE_TOKEN_SELECTED) {
				if (!window.DM) {
					// players can't do anything to multiple tokens, currently
					return {
						items: { 
							helptext: {
								name: 'You cannot apply changes to multiple tokens',
								className: 'context-menu-helptext',
								disabled: true
							}
						}
					}
				}
				ret = {
					callback: multiple_callback,
					items: {
						token_combat: {
							name: 'Add to Combat Tracker',
							icon: 'person-add',
							className: "material-icon"
						},
						group_roll: { name: 'Quick Group Roll' },
						token_hidden: build_hide_show_item(window.CURRENTLY_SELECTED_TOKENS),
						conditions: {
							name: 'Conditions',
							items: build_conditions_submenu(window.CURRENTLY_SELECTED_TOKENS),
							icon: 'add-circle',
							className: "material-icon"
						},
						markers: {
							name: 'Markers',
							items: build_markers_submenu(window.CURRENTLY_SELECTED_TOKENS),
							icon: 'add-circle',
							className: "material-icon"
						},
						configure: {
							name: 'Configure',
							icon: 'edit',
							className: "material-icon"
						},
						sep: "---",
						delete: {
							name: 'Delete',
							icon: 'close-red',
							className: "material-icon"
						}
					}
				};
				return ret;
			}
			else { // STANDARD SINGLE TOKEN MENU
				id = $(element).attr('data-id');
				cond_items = build_conditions_submenu([id]);
				custom_cond_items = build_markers_submenu([id]);
				custom_reminders = {}
				is_monster = window.TOKEN_OBJECTS[id].isMonster();
				is_player = window.TOKEN_OBJECTS[id].isPlayer();
				has_note=id in window.JOURNAL.notes;

				if (!window.TOKEN_OBJECTS[id].options.aura1) {
					window.TOKEN_OBJECTS[id].options = {
						...window.TOKEN_OBJECTS[id].options,
						aura1: {
							feet: "0",
							color: "rgba(255, 129, 0, 0.3)"
						},
						aura2: {
							feet: "0",
							color: "rgba(255, 255, 0, 0.1)"
						},
						auraVisible: true
					}
				}

				ret = {
					callback: menu_callback,
					events: {
						hide: token_inputs
					},
					items: {
						view: {
							name: window.TOKEN_OBJECTS[id].isMonster() ? 'Monster Stat Block' : 'Character Sheet',
							icon: 'view',
							className: "material-icon"
						},
						token_combat: {
							name: window.TOKEN_OBJECTS[id].options.combat === true ? 'Remove from Combat Tracker' : 'Add to Combat Tracker',
							icon: window.TOKEN_OBJECTS[id].options.combat === true ? 'person-remove' : 'person-add',
							className: "material-icon"
						},
						token_hidden: build_hide_show_item([id]),
						sep0: "--------",

						token_cond: {
							name: "Conditions",
							items: cond_items,
							icon: 'add-circle',
							className: "material-icon"
						},
						token_custom_cond: {
							name: "Markers",
							items: custom_cond_items,
							icon: 'add-circle',
							className: "material-icon"
						},
						note_menu:{
							name: "Notes",
							icon: "note",
							className: "material-icon",
							items:{
								note_view: {name: 'View Note', disable: !has_note},
								note_edit: {name: 'Create/Edit Note'},
								note_delete: {name: 'Delete Note'},
							}
						},
						quick_roll_menu: { 
							name: 'Quick Roll Menu' 
						},
						sep1: "-------",
						hp: {
							type: 'text',
							name: 'Current HP',
							className: 'split-column-context-input split-column-context-input-text',
							value: window.TOKEN_OBJECTS[id].options.hp,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							},
						},
						ac: {
							type: 'text',
							name: 'AC',
							className: 'split-column-context-input split-column-context-input-text',
							value: window.TOKEN_OBJECTS[id].options.ac,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						max_hp: {
							type: 'text',
							name: 'Max Hp',
							className: 'split-column-context-input split-column-context-input-text',
							value: window.TOKEN_OBJECTS[id].options.max_hp,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						elev: {
							type: 'text',
							name: 'Elevation',
							className: !is_player ? 'split-column-context-input split-column-context-input-text' : "",
							value: window.TOKEN_OBJECTS[id].options.elev,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						sep3: '----------',
						imgsrcSelect: {
							name: "Change Image",
							className: "imgsrcSelect material-icon",
							icon: "person"
						},
						configure: {
							name: 'Configure',
							icon: 'edit',
							className: "material-icon"
						},
						sep4: '----------',
						helptext: {
							name: 'Player HP/conditions must be set in character sheet',
							className: 'context-menu-helptext',
							disabled: true
						},
						delete: {
							name: 'Delete',
							icon: 'close-red',
							className: "material-icon"
						}
					}
				};

				if (!is_monster && !is_player) {
					delete ret.items.view;
					delete ret.items.helptext;
				}

				if (is_monster) {
					// delete ret.items.options.items.token_hidestat;
					delete ret.items.helptext;
				}
				if (is_player){
					delete ret.items.hp
					delete ret.items.max_hp
					delete ret.items.ac
				}
				
				if(!has_note){
					delete ret.items.note_menu.items.note_view;
					delete ret.items.note_menu.items.note_delete;
				}
				// token isn't owned by a player, only the DM should see "character sheet" option in context menu
				if(!window.DM && (!window.TOKEN_OBJECTS[id].options.player_owned)){
					delete ret.items.view;
				}
				
				if(!window.DM){
					delete ret.items.sep0;
					delete ret.items.token_combat;
					delete ret.items.token_hidden;
					//delete ret.items.token_size;
					delete ret.items.options;
					delete ret.items.sep1;
					delete ret.items.hp;
					delete ret.items.max_hp;
					delete ret.items.note_menu;
					delete ret.items.name;
					delete ret.items.sep2;
					delete ret.items.ac;
					delete ret.items.elev;
					delete ret.items.configure;
					if (!id.endsWith(window.PLAYER_ID)) {
						delete ret.items.sep3;
						delete ret.items.imgsrcSelect;
						delete ret.items.quick_roll_menu
					}
				}

				if (!window.DM && window.TOKEN_OBJECTS[id].options.deleteableByPlayers != true) {
					delete ret.items.delete;
					delete ret.items.sep4;
				}

				return ret;
			}
		}
	});
}

function deselect_all_tokens() {
	window.MULTIPLE_TOKEN_SELECTED = false;
	for (id in window.TOKEN_OBJECTS) {
		var curr = window.TOKEN_OBJECTS[id];
		if (curr.selected) {
			curr.selected = false;
			curr.place();
		}
	}
	remove_selected_token_bounding_box();
}

function token_health_aura(hpPercentage) {
	//PERC TO RGB------------
	const percentToHEX = function (percent) {
		var HEX;
		if (percent > 100) HEX = "#0000FF";
		else {
			if (percent === 100) percent = 99;
			var r, g, b = 0;
			if (percent < 50) {
				g = Math.floor(255 * (percent / 50));
				r = 255;
			}
			else {
				g = 255;
				r = Math.floor(255 * ((50 - percent % 50) / 50));
			}
			HEX = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		}
		return HEX;
	}
	//HEX TO RGB------------
	const hexToRGB = function (hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});

		const pHex = (n) => parseInt(n, 16);

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? `rgb(${pHex(result[1])} ${pHex(result[2])} ${pHex(result[3])} / 80%)` : null;
	}
	return hexToRGB(percentToHEX(hpPercentage));
}

function setTokenAuras (token, options) {
	if (!options.aura1) return;

	const innerAuraSize = options.aura1.feet.length > 0 ? (options.aura1.feet / 5) * window.CURRENT_SCENE_DATA.hpps : 0;
	const outerAuraSize = options.aura2.feet.length > 0 ? (options.aura2.feet / 5) * window.CURRENT_SCENE_DATA.hpps : 0;
	if ((innerAuraSize > 0 || outerAuraSize > 0) && options.auraVisible) {
		const totalAura = innerAuraSize + outerAuraSize;
		const auraRadius = innerAuraSize ? (innerAuraSize + (options.size / 2)) : 0;
		const auraBg = `radial-gradient(${options.aura1.color} ${auraRadius}px, ${options.aura2.color} ${auraRadius}px);`;
		const totalSize = parseInt(options.size) + (2 * totalAura);
		const absPosOffset = (options.size - totalSize) / 2;
		const auraStyles = `width:${totalSize}px;
							height:${totalSize}px;
							left:${absPosOffset}px;
							top:${absPosOffset}px;
							background-image:${auraBg};
							left:${parseFloat(options.left.replace('px', '')) - ((totalSize - options.size) / 2)}px;
							top:${parseFloat(options.top.replace('px', '')) - ((totalSize - options.size) / 2)}px;
							`;
		const tokenId = token.attr("data-id").replaceAll("/", "");
		if (token.parent().find("#aura_" + tokenId).length > 0) {
			token.parent().find("#aura_" + tokenId).attr("style", auraStyles);	
		} else {
			const auraElement = $(`<div class='aura-element' id="aura_${tokenId}" style='${auraStyles}' />`);
			auraElement.contextmenu(function(){return false;});
			$("#tokens").prepend(auraElement);
		}
		if(window.DM){
			options.hidden ? token.parent().find("#aura_" + tokenId).css("opacity", 0.5)
			: token.parent().find("#aura_" + tokenId).css("opacity", 1)
		}
		else{
			options.hidden ? token.parent().find("#aura_" + tokenId).hide()
			: token.parent().find("#aura_" + tokenId).show()
		}

		
	} else {
		const tokenId = token.attr("data-id").replaceAll("/", "");
		token.parent().find("#aura_" + tokenId).remove();
	}
}

function get_custom_monster_images(monsterId) {
	if (monsterId == undefined) {
		return [];
	}
	if (window.CUSTOM_TOKEN_IMAGE_MAP == undefined) {
		load_custom_monster_image_mapping();
	}
	var customImages = window.CUSTOM_TOKEN_IMAGE_MAP[monsterId];
	if (customImages == undefined) {
		customImages = [];
	}
	return customImages;
}

function get_random_custom_monster_image(monsterId) {
	let customImgs = get_custom_monster_images(monsterId);
	let randomIndex = getRandomInt(0, customImgs.length);
	return customImgs[randomIndex];
}

function add_custom_monster_image_mapping(monsterId, imgsrc) {
	if (monsterId == undefined) {
		return;
	}
	var customImages = get_custom_monster_images(monsterId);
	customImages.push(parse_img(imgsrc));
	window.CUSTOM_TOKEN_IMAGE_MAP[monsterId] = customImages;
	save_custom_monster_image_mapping();
}

function remove_custom_monster_image(monsterId, index) {
	var customImages = get_custom_monster_images(monsterId);;
	if (customImages.length > index) {
		window.CUSTOM_TOKEN_IMAGE_MAP[monsterId].splice(index, 1);
	}
	save_custom_monster_image_mapping();
}

function remove_all_custom_monster_images(monsterId) {
	delete window.CUSTOM_TOKEN_IMAGE_MAP[monsterId];
	save_custom_monster_image_mapping();
}

function load_custom_monster_image_mapping() {
	window.CUSTOM_TOKEN_IMAGE_MAP = {};
	let customMappingData = localStorage.getItem('CustomDefaultTokenMapping');
	if(customMappingData != null){
		window.CUSTOM_TOKEN_IMAGE_MAP = $.parseJSON(customMappingData);
	}
}

function save_custom_monster_image_mapping() {
	let customMappingData = JSON.stringify(window.CUSTOM_TOKEN_IMAGE_MAP);
	localStorage.setItem("CustomDefaultTokenMapping", customMappingData);
	// The JSON structure for CUSTOM_TOKEN_IMAGE_MAP looks like this { 17100: [ "some.url.com/img1.png", "some.url.com/img2.png" ] }	
}

function copy_to_clipboard(text) {
	var $temp = $("<input>");
	$("body").append($temp);
	$temp.val(text).select();
	document.execCommand("copy");
	$temp.remove();
};

const radToDeg = 180 / Math.PI;

/// Returns result in degrees
function rotation_towards_cursor(token, mousex, mousey, largerSnapAngle) {
	const halfSize = token.options.size / 2;
	const tokenCenterX = parseFloat(token.options.left) + halfSize;
	const tokenCenterY = parseFloat(token.options.top) + halfSize;
	const target = Math.atan2(mousey - tokenCenterY, mousex - tokenCenterX) + Math.PI * 3 / 2; // down = 0
	const degrees = target * radToDeg;
	const snap = (largerSnapAngle == true) ? 45 : 5; // if we ever allow hex, use 45 for square and 60 for hex
	return Math.round(degrees / snap) * snap
}

/// rotates all selected tokens to the specified newRotation
function rotate_selected_tokens(newRotation, persist = false) {
	if ($("#select-button").hasClass("button-enabled") || !window.DM) { // players don't have a select tool
		for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
			let id = window.CURRENTLY_SELECTED_TOKENS[i];
			let token = window.TOKEN_OBJECTS[id];
			token.rotate(newRotation);
			if (persist) {
				token.place_sync_persist();
			}
		}
		return false;
	}
}

/// draws a rectangle around every selected token, and adds a rotation grabber
function draw_selected_token_bounding_box() {
	remove_selected_token_bounding_box()
	// hold a separate list of selected ids so we don't have to iterate all tokens during bulk token operations like rotation
	window.CURRENTLY_SELECTED_TOKENS = [];
	for (id in window.TOKEN_OBJECTS) {
		console.log(id)
		let selector = "div[data-id='" + id + "']";
		toggle_player_selectable(window.TOKEN_OBJECTS[id], $("#tokens").find(selector))
		if (window.TOKEN_OBJECTS[id].selected) {
			window.CURRENTLY_SELECTED_TOKENS.push(id);
		}
	}

	if (window.CURRENTLY_SELECTED_TOKENS == undefined || window.CURRENTLY_SELECTED_TOKENS.length == 0) {
		return;
	}

	// find the farthest edges of our tokens
	var top = undefined;
	var bottom = undefined;
	var right = undefined;
	var left = undefined;
	for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
		let id = window.CURRENTLY_SELECTED_TOKENS[i];
		let token = window.TOKEN_OBJECTS[id];
		let tokenTop = parseFloat(token.options.top);
		let tokenBottom = tokenTop + parseFloat(token.options.size);
		let tokenLeft = parseFloat(token.options.left);
		let tokenRight = tokenLeft + parseFloat(token.options.size);
		if (top == undefined) {
			top = tokenTop;
		} else {
			top = Math.min(top, tokenTop);
		}
		if (bottom == undefined) {
			bottom = tokenBottom;
		} else {
			bottom = Math.max(bottom, tokenBottom);
		}
		if (left == undefined) {
			left = tokenLeft;
		} else {
			left = Math.min(left, tokenLeft);
		}
		if (right == undefined) {
			right = tokenRight;
		} else {
			right = Math.max(right, tokenRight);
		}
	}

	// add 10px to each side of out bounding box to give the tokens a little space
	let borderOffset = 10;
	top = top - borderOffset;
	left = left - borderOffset;
	right = right + borderOffset;
	bottom = bottom + borderOffset;
	let width = right - left;
	let height = bottom - top;
	let centerHorizontal = left + Math.ceil(width / 2);
	let zIndex = 29; // token z-index is calculated as 30+someDiff. Put this at 29 to ensure it's always below the tokens
	let gridSize = parseFloat(window.CURRENT_SCENE_DATA.hpps); // one grid square
	let grabberDistance = Math.ceil(gridSize / 3) - borderOffset;
	let grabberSize = Math.ceil(gridSize / 3);
	let grabberTop = top - grabberDistance - grabberSize + 2;
	let grabberLeft = centerHorizontal - Math.ceil(grabberSize / 2) + 3;

	// draw the bounding box
	var boundingBox = $("<div id='selectedTokensBorder' />");
	boundingBox.css("position", "absolute");
	boundingBox.css('top', `${top}px`);
	boundingBox.css('left', `${left}px`);
	boundingBox.css('width', `${width}px`);
	boundingBox.css('height', `${height}px`);
	boundingBox.css('z-index', zIndex);
	boundingBox.css('border', '2px solid white');
	boundingBox.css('border-radius', '7px');
	$("#tokens").append(boundingBox);

	// draw eye grabber holder connector
	var connector = $("<div id='selectedTokensBorderRotationGrabberConnector' />");
	connector.css("position", "absolute");
	connector.css('top', `${top - grabberDistance}px`);
	connector.css('left', `${centerHorizontal}px`);
	connector.css('width', `0px`);
	connector.css('height', `${grabberDistance}px`);
	connector.css('z-index', zIndex);
	connector.css('border', '1px solid white');
	$("#tokens").append(connector);

	// draw eye grabber holder
	var holder = $("<div id='rotationGrabberHolder' />");
	holder.css("position", "absolute");
	holder.css('top', `${top - grabberDistance - grabberSize}px`);
	holder.css('left', `${centerHorizontal - Math.ceil(grabberSize / 2) + 1}px`); // not exactly sure why we need the + 1 here
	holder.css('width', `${grabberSize}px`);
	holder.css('height', `${grabberSize}px`);
	holder.css('z-index', zIndex);
	holder.css('border', '2px solid white');
	holder.css('border-radius', `${Math.ceil(grabberSize / 2)}px`); // make it round
	$("#tokens").append(holder);

	// draw the grabber with an eye symbol in it
	var grabber = $('<div id="rotationGrabber"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata><g><path d="M500,685c-103.7,0-187.8-84-187.8-187.9c0-103.7,84.1-187.8,187.8-187.8c103.8,0,187.9,84.1,187.9,187.8C687.9,601,603.8,685,500,685z M990,500c0,0-245.9-265.5-490-265.5C255.9,234.5,10,500,10,500s245.9,265.4,490,265.4c130.4,0,261.2-75.7,354.9-146.2 M500,405.1c-50.8,0-92,41.3-92,92.1c0,50.7,41.3,92.1,92,92.1c50.8,0,92.1-41.3,92.1-92.1C592.1,446.4,550.8,405.1,500,405.1z"/></g></svg></div>')
	grabber.css("position", "absolute");
	grabber.css('top', `${grabberTop}px`);
	grabber.css('left', `${grabberLeft}px`);
	grabber.css('width', `${grabberSize - 4}px`);
	grabber.css('height', `${grabberSize - 4}px`);
	grabber.css('z-index', 100); // make sure the grabber is above all the tokens
	grabber.css('background', '#ced9e0')
	grabber.css('border-radius', `${Math.ceil(grabberSize / 2)}px`); // make it round
	grabber.css('padding', '1px');
	grabber.css('cursor', 'move');
	$("#tokens").append(grabber);

	// handle eye grabber dragging
	let click = {
		x: 0,
		y: 0
	};
	grabber.draggable({
		start: function (event) { 
			// adjust based on zoom level
			click.x = event.clientX;
			click.y = event.clientY;
			self.orig_top = grabberTop;
			self.orig_left = grabberLeft;
			
			// the drag has started so remove the bounding boxes, but not the grabber
			$("#selectedTokensBorder").remove();
			$("#selectedTokensBorderRotationGrabberConnector").remove();
			$("#rotationGrabberHolder").remove();		
		},
		drag: function(event, ui) {
			// adjust based on zoom level
			var zoom = window.ZOOM;
			var original = ui.originalPosition;
			ui.position = {
				left: Math.round((event.clientX - click.x + original.left) / zoom),
				top: Math.round((event.clientY - click.y + original.top) / zoom)
			};

			// rotate all selected tokens to face the grabber, but only for this user while dragging
			for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
				let id = window.CURRENTLY_SELECTED_TOKENS[i];
				let token = window.TOKEN_OBJECTS[id];
				let angle = rotation_towards_cursor(token, ui.position.left, ui.position.top, event.shiftKey);
				token.rotate(angle);
			}
		},
		stop: function (event) { 
			// rotate for all players
			for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
				let id = window.CURRENTLY_SELECTED_TOKENS[i];
				let token = window.TOKEN_OBJECTS[id];
				token.place_sync_persist();
			}
		},
	});
}

/// removes everything that draw_selected_token_bounding_box added
function remove_selected_token_bounding_box() {
	$("#selectedTokensBorder").remove();
	$("#selectedTokensBorderRotationGrabberConnector").remove();
	$("#rotationGrabberHolder").remove();
	$("#rotationGrabber").remove();
}

function copy_selected_tokens() {
	if (!window.DM) return;
	window.TOKEN_PASTE_BUFFER = [];
	let redrawBoundingBox = false;
	for (id in window.TOKEN_OBJECTS) {
		let token = window.TOKEN_OBJECTS[id];
		if (token.selected) { 
			if (token.isPlayer()) {
				// deselect player tokens to avoid confusion about them being selected but not copy/pasted
				window.TOKEN_OBJECTS[id].selected = false;
				window.TOKEN_OBJECTS[id].place_sync_persist();
				redrawBoundingBox = true;
			} else {
				// only allow copy/paste for selected monster tokens
				window.TOKEN_PASTE_BUFFER.push(id);
			}
		}
	}
	if (redrawBoundingBox) {
		draw_selected_token_bounding_box();
	}
}

function paste_selected_tokens() {
	if (!window.DM) return;
	if (window.TOKEN_PASTE_BUFFER == undefined) {
		window.TOKEN_PASTE_BUFFER = [];
	}

	for (let i = 0; i < window.TOKEN_PASTE_BUFFER.length; i++) {
		let id = window.TOKEN_PASTE_BUFFER[i];
		let token = window.TOKEN_OBJECTS[id];
		if (token == undefined || token.isPlayer()) continue; // only allow copy/paste for monster tokens, and protect against pasting deleted tokens
		let options = Object.assign({}, token.options);
		let newId = uuid();
		options.id = newId;
		// TODO: figure out the location under the cursor and paste there instead of doing an offset
		options.top = `${parseFloat(options.top) + Math.round(options.size / 2)}px`;
		options.left = `${parseFloat(options.left) + Math.round(options.size / 2)}px`;
		options.selected = true;
		window.ScenesHandler.create_update_token(options);
		// deselect the old and select the new so the user can easily move the new tokens around after pasting them
		window.TOKEN_OBJECTS[id].selected = false;
		window.TOKEN_OBJECTS[id].place_sync_persist();
		window.TOKEN_OBJECTS[newId].selected = true;
		window.TOKEN_OBJECTS[newId].place_sync_persist();
	}

	// copy the newly selected tokens in case they paste again, we want them pasted in reference to the newly created tokens
	copy_selected_tokens();
	draw_selected_token_bounding_box();
}

function delete_selected_tokens() {
	
	// move all the tokens into a separate list so the DM can "undo" the deletion
	let tokensToDelete = [];
	for (id in window.TOKEN_OBJECTS) {
		let token = window.TOKEN_OBJECTS[id];
		if (token.selected) {
			if (window.DM || token.options.deleteableByPlayers == true) {				
				window.TOKEN_OBJECTS_RECENTLY_DELETED[id] = Object.assign({}, token.options);
				tokensToDelete.push(token);
			}
		}
	}

	if (tokensToDelete.length == 0) return;
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};

	if(window.CLOUD){
		for (let i = 0; i < tokensToDelete.length; i++) {
			tokensToDelete[i].delete(); // don't persist on each token delete, we'll do that next
		}
	}
	else{
		// delete these in a separate loop to prevent altering the array while iterating over it
		for (let i = 0; i < tokensToDelete.length; i++) {
			tokensToDelete[i].delete(false); // don't persist on each token delete, we'll do that next
		}
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
	}
	draw_selected_token_bounding_box(); // redraw the selection box
	ct_persist();
}

function undo_delete_tokens() {
	if (!window.DM) return;
	for (id in window.TOKEN_OBJECTS_RECENTLY_DELETED) {
		let options = window.TOKEN_OBJECTS_RECENTLY_DELETED[id];
		window.ScenesHandler.create_update_token(options);
		if (options.combat) {
			// the deleted token was removed from the combat tracker so add it back in
			ct_add_token(window.TOKEN_OBJECTS[id]);
		}
	}
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
}

function open_roll_menu(e) {
	//opens a roll menu for group rolls 
	console.log("Opening Roll menu")
	$("#group_roll_dialog").remove();

	roll_dialog = $("<div id='group_roll_dialog'></div>");
	console.log(e)
	$("#site").append(roll_dialog);

	roll_dialog.empty();

	roll_menu_header = $("<div id='roll_menu_header' class='roll_menu_header'></div>");
	roll_title_bar_exit = $('<div id="roll_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
	roll_title_bar_exit.click(function(){
		console.log("Closing roll menu")
		roll_dialog.remove()
	});
	roll_menu_header.append(roll_title_bar_exit);

	roll_menu_dc_input = $('<input id="save_dc" class="roll_input" placeholder="Save DC" name="save_dc" title="Enter the value for the DC of the saving throw."></input>')
	roll_menu_dc_input.tooltip();

	save_type_dropdown = $('<select id="save_dropdown" class="save_dropdown" onchange="save_type_change(this)" title="Select the type of saving throw to be made. ">Save Type</select>')
	save_type_dropdown.append($('<option value="2">Dexterity</option>')) 
	save_type_dropdown.append($('<option value="4">Wisdom</option>'))
	save_type_dropdown.append($('<option value="3">Constitution</option>'))
	save_type_dropdown.append($('<option value="1">Strength</option>'))
	save_type_dropdown.append($('<option value="5">Intelligence</option>'))
	save_type_dropdown.append($('<option value="6">Charisma</option>'))
	save_type_dropdown.tooltip()
	damage_input  = $('<input id="damage_failed_save" class="roll_input" placeholder="Damage/Roll" title="Enter the integer value for damage or the roll to be made i.e. 8d6"></input>')
	damage_input.tooltip({})
	half_damage_input = $('<input id="half_damage_save" class="roll_input" placeholder="Success Damage" title="Enter the integer value for half damage, or autopopulate from damage entry as half rounded down.""></input>')
	half_damage_input.tooltip()

	damage_input.change(function(){
		//console.log(this.value)
		_dmg = $('#damage_failed_save').val();
		if (_dmg.includes('d')) {
			var expression = _dmg
			console.log(expression)
			var roll = new rpgDiceRoller.DiceRoll(expression);
			console.log(expression + "->" + roll.total);
			//reassign to the input 
			_dmg = roll.total
			$('#damage_failed_save').val(_dmg);
		}
		else {
			_dmg.replace(/[^\d.-]/g, '')
		}
		$("#half_damage_save").val(Math.floor(_dmg/2));
	});

	roll_menu_footer = $("<div id='roll_menu_footer' class=roll_menu_footer/>");
	roll_menu_footer.append(roll_menu_dc_input)
	roll_menu_footer.append(damage_input)
	roll_menu_footer.append(half_damage_input)
	roll_menu_footer.append(save_type_dropdown)

	let roll_form = $("<table id='group_roll_area'/>");
	roll_menu_body = $("<div id='roll_menu_body' class='roll_menu_body'></div>");

	//roll_menu_body.append($('<span> Use +- for custom bonus, add a "A" or "D" for Adv/Disadv </span>'))
	roll_menu_body.append(roll_form)

	roll_button=$('<button id="roll_saves_button" class="roll_saves_button" title="Roll saves with current settings."><svg class="rollSVG2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 339.09 383.21"><path d="M192.91,3q79.74,45.59,159.52,91.1c4.9,2.79,7.05,6,7,11.86q-.29,87.76,0,175.52c0,5.14-1.79,8.28-6.19,10.85q-78.35,45.75-156.53,91.78c-4.75,2.8-8.81,2.8-13.57,0q-77.7-45.75-155.59-91.18c-5.17-3-7.2-6.52-7.18-12.56q.31-87.39,0-174.78c0-5.5,2.06-8.64,6.7-11.28q80-45.53,159.84-91.3ZM115.66,136h3.67c12.1,0,24.19-.05,36.29,0,5.24,0,8.38,3.15,8.34,8s-3.56,8-9.73,8c-11.85.08-23.69,0-35.54,0-4.14,0-4.21.16-2.11,3.8q35.54,61.53,71.09,123.06c.59,1,.82,2.7,2.32,2.62s1.66-1.7,2.25-2.74q35.47-61.35,70.9-122.74c2.3-4,2.31-4-2.5-4-11.72,0-23.45.06-35.17,0-6.18-.05-9.6-3.08-9.59-8.1,0-5.18,3.27-7.9,9.58-7.91,11.47,0,22.94,0,34.42,0,1.27,0,2.71.54,3.93-.63a11.49,11.49,0,0,0-.69-1.36q-35.49-53-71-106c-2.15-3.22-3.2-1.77-4.7.46q-35.06,52.36-70.19,104.71C116.82,133.87,116.44,134.63,115.66,136Zm89,153.29c1.51,0,2.25.06,3,0,12.51-1.17,25-2.39,37.53-3.54,14.75-1.35,29.5-2.61,44.25-4,15.11-1.39,30.22-2.89,45.34-4.25,4.39-.39,4.47-.32,2.46-4.21q-10.79-20.94-21.61-41.87-17.31-33.56-34.64-67.11c-.49-1-.69-2.45-1.9-2.57s-1.48,1.46-2.14,2.31a9.38,9.38,0,0,0-.56,1q-27.49,47.6-55,95.2C215.87,269.75,210.42,279.24,204.62,289.31Zm-29.49.12c-1-1.84-1.57-3.05-2.24-4.22Q154,252.49,135.13,219.79,119.05,191.94,103,164.1c-.53-.91-.8-2.38-2.13-2.32-1.1.05-1.29,1.39-1.73,2.24Q70.69,219,42.3,274c-1.35,2.6-.88,3.39,2.09,3.56,6.71.38,13.4,1.06,20.09,1.68q23,2.11,46.08,4.27c12.26,1.15,24.53,2.34,36.79,3.47C156.37,287.81,165.4,288.57,175.13,289.43ZM44.49,102.78c1.34.83,2.16,1.37,3,1.86C63,113.46,78.55,122.19,94,131.17c3.21,1.88,4.7,1.46,6.75-1.63Q131,83.87,161.64,38.39c.66-1,1.64-1.84,1.8-3.6Zm172.2-67.85-.38.49c.31.53.58,1.08.93,1.59q30.94,46.15,61.84,92.33c2.12,3.18,3.67,3.68,7,1.72,15.4-9,31-17.7,46.45-26.54.8-.45,1.95-.58,2.22-2.08ZM36,250l.72.09C37.84,248,39,246,40.05,243.86Q64.23,197,88.47,150.12c1.35-2.6.68-3.58-1.6-4.86C71.21,136.48,55.62,127.56,40,118.7c-4-2.25-4-2.22-4,2.29V250Zm307.45.82a12.72,12.72,0,0,0,.35-1.55q0-64.51.06-129c0-3.33-1.17-3.17-3.5-1.85Q316.51,132,292.56,145.51c-2.11,1.18-2.42,2.21-1.29,4.38q18.11,34.83,36,69.76C332.56,229.83,337.84,240,343.46,250.84ZM64.23,295.22l-.14.56,47.09,27.59q33.88,19.86,67.78,39.7c1.11.64,3.21,3.18,3.21-.87,0-17.71,0-35.42,0-53.13,0-2.21-1-3.17-3.09-3.36q-17.29-1.51-34.59-3.07-18.22-1.63-36.45-3.29Q86.15,297.33,64.23,295.22Zm252.49,0c-11.13,1-21.24,2-31.37,2.92-12.15,1.1-24.31,2.1-36.46,3.21-15.62,1.41-31.23,3-46.86,4.26-3.38.27-4.46,1.44-4.43,4.8.14,16.84.06,33.68.07,50.52,0,4.1,0,4.1,3.73,1.93L286,313.28C296,307.43,305.91,301.56,316.72,295.2Z" transform="translate(-20.37 -3.01)"/><path d="M197.64,143.89a7.9,7.9,0,0,1-7.72,8,7.81,7.81,0,0,1-7.73-7.93,7.73,7.73,0,1,1,15.45,0Z" transform="translate(-20.37 -3.01)"/></svg></button>');
	roll_button.tooltip()
	roll_button.click(function() {
		console.log('Rollin')
		$("#group_roll_area").children('tr').each(function (){
			let x = window.TOKEN_OBJECTS[$(this).attr('data-target')]
			let y = $(this).children('input');

			save_drop = $("#roll_menu_footer").children('select')
			
			if(x.options.monster > 0){
				score_bonus = Math.floor((x.options.ability_scores[save_drop.val()] - 10) /2 )
				if (x.options.saving_throws[save_drop.val()]){
					score_bonus += x.options.prof_bonus
				}
			}
			else {
				var ability_names = {0: 'null', 1: 'strength', 2: 'dexterity', 3:'constitution', 4:'wisdom', 5:'intelligence', 6:'charisma'}
				ability_name = ability_names[save_drop.val()]
				score_bonus = x.options[`${ability_name}_save`]
			}
			
			if (score_bonus >= 0){
				score_bonus = "+"+score_bonus;
			}
			console.log(score_bonus)
			dice = '1d20';
			if (y.val().includes('+') == true || y.val().includes('-') == true){
				var modifier = y.val().toLowerCase()
				if (modifier.includes("a") == true) {
					modifier = modifier.replace(/[^\d.-]/g, '');
					dice = '2d20kh1 +';
				}
				else if (modifier.includes("d") == true) {
					modifier = modifier.replace(/[^\d.-]/g, '');
					dice = '2d20kl1 +';
				}
			}
			else {
				var modifier = score_bonus
			}
			
			var expression = dice + modifier;
			console.log(expression)
			var roll = new rpgDiceRoller.DiceRoll(expression);
			console.log(expression + "->" + roll.total);
			//reassign to the input 
			y.val(roll.total);
			//display a Save success or failure.
			save_dc = $("#roll_menu_footer").children('#save_dc').val()
			console.log($("#roll_menu_footer"))
			console.log($("#roll_menu_footer").children('#save_dc'))
			console.log(save_dc)
			pass_fail_label = $(this).children('#save_fail_label')[0]
			$(pass_fail_label).show()

			if (save_dc != ""){
				if (parseInt(roll.total) >= parseInt(save_dc)){
					pass_fail_label.innerHTML = '  Success!'
					$(pass_fail_label).css('background', 'green')
				}
				else {
					pass_fail_label.innerHTML = '  Fail!'
					$(pass_fail_label).css('background', 'red')
				}
			}
			else {//if not defined apply full damage.
				pass_fail_label.innerHTML = '  No DC (Auto-Fail)'
				$(pass_fail_label).css('background', 'yellow')
			}

		});
	});
	
	update_hp = $("<button id=apply_damage title='Apply the damage/healing to the selected tokens.' style='margin: 1px 1px; font-size:14px;'> Apply </button>");
	update_hp.tooltip()
	update_hp.click(function() {
		$("#group_roll_area").children('tr').each(function (){
			update_hp=$(this).children("#hp");
			let rolled_value = $(this).children('input').val();
			//if (!rolled_value.includes('+') && !rolled_value.includes('-')) {}
			let x = window.TOKEN_OBJECTS[$(this).attr('data-target')]
			damage_failed_save = $("#roll_menu_footer").children('#damage_failed_save').val()
			half_damage_save_success = $("#roll_menu_footer").children('#half_damage_save').val()

			damage_failed_save = damage_failed_save.replace(/[^\d.-]/g, '');
			half_damage_save_success = half_damage_save_success.replace(/[^\d.-]/g, '');

			save_dc = $("#roll_menu_footer").children('#save_dc').val()

			if (save_dc != "undefined"){
				if (parseInt(rolled_value) >= parseInt(save_dc)){
					if(x.options.monster > 0){
						x.options.hp -= half_damage_save_success
					}
					damage = half_damage_save_success
				}
				else {
					if(x.options.monster > 0){
						x.options.hp -= damage_failed_save
					}
					damage = damage_failed_save
				}
			}
			//if not defined apply full damage.
			else {
				if(x.options.monster > 0){
					x.options.hp -= damage_failed_save
				}
				damage = damage_failed_save
			}
			if(x.options.monster > 0){
				x.place()
				update_hp.text(x.options.hp);
			}
			else {
				// doing it this way, because Players might also have resistances or abilites and they should manage their own HP. 
				var msgdata = {
					player: window.PLAYER_NAME,
					img: window.PLAYER_IMG,
					text: x.options.name + " takes " + damage +" damage (adjust manually)",	
				};
				window.MB.inject_chat(msgdata);
				x.place()
			}
		});
	});


	roll_menu_footer.append(roll_button);
	roll_menu_footer.append(update_hp);

	roll_dialog.append(roll_menu_header);
	roll_dialog.append(roll_menu_body);
	roll_dialog.append(roll_menu_footer);

	roll_dialog.css('opacity', '0.0');
	roll_dialog.animate({
		opacity: '1.0'
	}, 1000);

	roll_dialog.addClass("moveableWindow");
	roll_dialog.draggable({
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
	roll_dialog.resizable({
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
		minWidth: 215,
		minHeight: 200
	});
	
	roll_dialog.mousedown(function() {
		frame_z_index_when_click($(this));
	});
}

function add_to_roll_menu(token) {
	//Adds a specific target to the roll menu

	//console.log(token);
	roll_menu_entry=$("<tr/>");
	roll_menu_entry.css("height","30px");
	roll_menu_entry.attr("data-target", token.options.id);	

	img=$("<img width=42 height=42 class='Avatar_AvatarPortrait__2dP8u'>");
	img.attr('src',token.options.imgsrc);
	img.css('border','3px solid '+token.options.color);
	img.css('margin', '2px 2px');
	roll_menu_entry.append($("<td/>").append(img));

	//if its a monster it needs to be calulated.
	if(token.options.monster > 0){
		console.log(token.options.ability_scores)
		score_bonus = Math.floor((token.options.ability_scores[2] - 10) /2 )
		if (token.options.saving_throws[2]){
			score_bonus += token.options.prof_bonus
		}
		if (score_bonus >= 0){
			score_bonus = "+"+score_bonus;
		}
	}
	else {//if its a player character they have the save stored.
		score_bonus = token.options.dexterity_save
		if (score_bonus >= 0){
			score_bonus = "+"+score_bonus;
		}
	}

	name_line = $("<div style='width:100px;'>"+token.options.name+"</div>")

	bonus_input = $(`<input id=bonus_input class='roll_bonus_input' title='Use +- for custom bonus, add a "A" or "D" for Adv/Disadv'> </input>`);
	bonus_input.tooltip()
	bonus_input.val(score_bonus);

	hp=$("<div class='hp'></div>");
	hp.text(token.options.hp);
	hp.css('font-size','12px');

	roll_menu_entry.append(name_line);
	roll_menu_entry.append($("<td/>").append(hp));

	max_hp=$("<div/>");
	max_hp.text("/"+token.options.max_hp);
	max_hp.css('font-size','12px');

	roll_menu_entry.append($("<td/>").append(max_hp));

	find=$('<button class="findTokenCombatButton" style="vertical-align: middle;""><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg></button>');
	find.click(function(){
		var target=$(this).parent().parent().attr('data-target');
		if(target in window.TOKEN_OBJECTS){
			window.TOKEN_OBJECTS[target].highlight();
		}
	});
	roll_menu_entry.append(bonus_input)
	roll_menu_entry.append(find);

	remove_from_list=$('<button class="removeTokenCombatButton" style="vertical-align: middle;""><svg class="delSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg></button>');
	//remove_from_list.tooltip()
	remove_from_list.click(
		function() {
			console.log('Removing from list')
			$(this).parent().remove();
		}
	);
	
	roll_menu_entry.append(remove_from_list);

	if(token.isMonster()){
		stat=$('<button class="openSheetCombatButton" style="vertical-align: middle;""><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		
		stat.click(function(){
			if (encounter_builder_dice_supported()) {
				console.log(`attempting to open monster with monsterId ${token.options.monster} and tokenId ${token.options.id}`);
				open_monster_stat_block_with_id(token.options.monster, token.options.id);
			} else {
				iframe_id="#iframe-monster-"+token.options.monster;
				if($(iframe_id).is(":visible")) {
					$(iframe_id).hide();
				} else {
					$(".monster_frame").hide();
					load_monster_stat(token.options.monster, token.options.id);
				}
			}
		});
		if(window.DM)
			roll_menu_entry.append(stat);
		
	}	
	else if (token.isPlayer()) {
		stat=$('<button class="openSheetCombatButton" style="vertical-align: middle;""><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		stat.click(function(){
			open_player_sheet(token.options.id);
		});
		if(window.DM)
			roll_menu_entry.append(stat);
	}

	roll_menu_entry.append("<div id=save_fail_label> </div>")

	//$("#group_roll_dialog").append(roll_menu_entry)
	$("#group_roll_area").append(roll_menu_entry)
	$("#group_roll_area td").css("vertical-align","middle");
}

function save_type_change(dropdown) {
	var ability_names = {0: 'null', 1: 'strength', 2: 'dexterity', 3:'constitution', 4:'wisdom', 5:'intelligence', 6:'charisma'}
	console.log("Save type is: "+ dropdown.value );
	//$('#roll_menu_footer').children('#apply_damage').hide()
	//$('#group_roll_dialog').children('tr').each(function () {
	$('#roll_menu_body').children('tr').each(function () {
		let x = window.TOKEN_OBJECTS[$(this).attr('data-target')]
		if(x.options.monster > 0){
			score_bonus = Math.floor((x.options.ability_scores[dropdown.value] - 10) /2 )
			if (x.options.saving_throws[dropdown.value]){
				score_bonus += x.options.prof_bonus
			}
			if (score_bonus >= 0){
				score_bonus = "+"+score_bonus;
			}
		}
		else {
			ability_name = ability_names[dropdown.value]
			score_bonus = x.options[`${ability_name}_save`]
			if (score_bonus >= 0){
				score_bonus = "+"+score_bonus;
			}
		}
		let label = $(this).children('#save_fail_label')
		$(label).hide()

		//console.log($(this).children('input'))
		$(this).children('input').val(score_bonus);


	});
}