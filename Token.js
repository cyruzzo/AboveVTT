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

const availableToAoe = [
	"hidden",
	"locked",  // not sure why you'd want this, but it doesn't hurt to support it
	"restrictPlayerMove",
	"revealname"
];

function random_token_color() {
	const randomColorIndex = getRandomInt(0, TOKEN_COLORS.length);
	return "#" + TOKEN_COLORS[randomColorIndex];
}

class Token {

	// Defines how many token-sizes a token is allowed to be moved outside of the scene.
	SCENE_MOVE_GRID_PADDING_MULTIPLIER = 1;
	MIN_TOKEN_SIZE = 25;
	MAX_TOKEN_SIZE = 1000;

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

		this.prepareWalkableArea();
	}

	defaultAoeOptions() {
		if (this.isAoe()) {
			// look at build_aoe_token_options and set defaults here
			token_setting_options().forEach(option => {
				if (!availableToAoe.includes(option.name)) {
					delete this.options[option.name];
				}
			});
			delete this.options.aura1;
			delete this.options.aura2;
			this.options.auraVisible = false;
			this.options.square = true;
			this.options.disablestat = true
			this.options.hidestat = true
			this.options.disableborder = true
			this.options.disableaura = true
		}
	}

	stopAnimation(){
		const tok = $(`#tokens div[data-id="${this.options.id}"]`);
		if (tok.length === 0) {
			this.update_opacity(undefined);
			return;
		}

		tok.stop(true, true);
		this.doing_highlight = false;
		this.update_opacity(tok, false);
	}

	isLineAoe() {
		// 1 being a single square which is usually 5ft
		return this.options.size === "" && this.options.gridWidth === 1 && this.options.gridHeight > 0
	}

	isAoe() {
		return this.options.imgsrc?.startsWith("class")
	}

	isPlayer() {
		// player tokens have ids with a structure like "/profile/username/characters/someId" or "characters/someId"
		// monster tokens have a uuid for their id
		return is_player_id(this.options.id);
	}
	isCurrentPlayer() {
		return this.isPlayer() && this.options.id.endsWith(`characters/${window.PLAYER_ID}`)
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

	// number of grid spaces. eg: 0.5 for tiny, 1 for small/medium, 2 for large, etc
	numberOfGridSpacesWide() {
		try {
			let output = 1;
			const w = parseFloat(this.options.gridWidth);
			if (!isNaN(w)) {
				output = w;
			} else {
				const calculatedFromSize = (parseFloat(this.options.size) / parseFloat(window.CURRENT_SCENE_DATA.hpps));
				if (!isNaN(calculatedFromSize)) {
					output = calculatedFromSize;
				}
			}
			output = Math.round(output * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
			if (output < 0.5) {
				return 0.5;
			}
			return output;
		} catch (error) {
			console.warn("Failed to parse gridHeight for token", this, error);
			return 1;
		}
	}
	// number of grid spaces. eg: 0.5 for tiny, 1 for small/medium, 2 for large, etc
	numberOfGridSpacesTall() {
		try {
			let output = 1;
			const h = parseFloat(this.options.gridHeight);
			if (!isNaN(h)) {
				output = h;
			} else {
				const calculatedFromSize = (parseFloat(this.options.size) / parseFloat(window.CURRENT_SCENE_DATA.vpps));
				if (!isNaN(calculatedFromSize)) {
					output = calculatedFromSize;
				}
			}
			output = Math.round(output * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
			if (output < 0.5) {
				return 0.5;
			}
			return output;
		} catch (error) {
			console.warn("Failed to parse gridHeight for token", this, error);
			return 1;
		}
	}

	// number of pixels
	sizeWidth() {
		let w = parseInt(this.options.gridWidth);
		if (isNaN(w)) return this.options.size;
		return parseInt(window.CURRENT_SCENE_DATA.hpps) * w;
	}
	// number of pixels
	sizeHeight() {
		let h = parseInt(this.options.gridHeight);
		if (isNaN(h)) return this.options.size;
		return parseInt(window.CURRENT_SCENE_DATA.vpps) * h;
	}

	hasCondition(conditionName) {
		return this.options.conditions.includes(conditionName) || this.options.custom_conditions.some(e => e.name === conditionName);
	}
	addCondition(conditionName, text='') {
	    if (this.hasCondition(conditionName)) {
	        // already did
	        return;
	    }
	    if (STANDARD_CONDITIONS.includes(conditionName)) {
	        if (this.isPlayer()) {
	            window.MB.inject_chat({
	                player: window.PLAYER_NAME,
	                img: window.PLAYER_IMG,
	                text: `<span class="flex-wrap-center-chat-message">${window.PLAYER_NAME} would like you to set <span style="font-weight: 700; display: contents;">${conditionName}</span>.<br/><br/><button class="set-conditions-button">Toggle ${conditionName} ON</button></div>`,
	                whisper: this.options.name
	            });
	        } else {
	            this.options.conditions.push(conditionName);
	        }
	    } else {
	    	let condition = {
	    		'name': conditionName,
	    		'text': text
	    	}
	        this.options.custom_conditions.push(condition);
	    }
	}
	
	removeCondition(conditionName) {
		if (STANDARD_CONDITIONS.includes(conditionName)) {
			if (this.isPlayer()) {
	            window.MB.inject_chat({
	                player: window.PLAYER_NAME,
	                img: window.PLAYER_IMG,
	                text: `<span class="flex-wrap-center-chat-message">${window.PLAYER_NAME} would like you to remove <span style="font-weight: 700; display: contents;">${conditionName}</span>.<br/><br/><button class="remove-conditions-button">Toggle ${conditionName} OFF</button></div>`,
	                whisper: this.options.name
	            });
	        } else {
			array_remove_index_by_value(this.options.conditions, conditionName);
			}
		} else {
			array_remove_index_by_value(this.options.custom_conditions, conditionName);
		}
	}
	isInCombatTracker() {
		return ct_list_tokens().includes(this.options.id);
	}

	size(newSize) {
		this.MAX_TOKEN_SIZE = Math.max(window.CURRENT_SCENE_DATA.width, window.CURRENT_SCENE_DATA.height);

		// Clamp token size to min/max token size
		newSize = clamp(newSize, this.MIN_TOKEN_SIZE, this.MAX_TOKEN_SIZE);

		this.update_from_page();

		if(this.isLineAoe()) {
			// token is not proportional such as a line aoe token
			this.options.gridHeight = Math.round(newSize / parseFloat(window.CURRENT_SCENE_DATA.hpps));
		}
		else {
			this.options.size = newSize;
			this.options.gridSquares = newSize / parseFloat(window.CURRENT_SCENE_DATA.hpps);
		}

		this.place_sync_persist();

		this.prepareWalkableArea();
	}

	imageSize(imageScale) {
		this.update_from_page();
		this.options.imageSize = imageScale;
		this.place_sync_persist()
	}

	hide() {
		this.update_from_page();
		this.options.hidden = true;
		if(this.options.ct_show !== undefined){//this is required as if it's undefined it's not in the combat tracker and changing it will add it to the combat tracker on next scene swap unintendedly.
			this.options.ct_show = false;
		}
		if(this.options.monster) {
			$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'block');
			$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'none');
		}
		this.place_sync_persist()
		this.update_and_sync()
		ct_persist();
	}
	show() {
		this.update_from_page();
		delete this.options.hidden;
		if(this.options.ct_show !== undefined){//this is required as if it's undefined it's not in the combat tracker and changing it will add it to the combat tracker on next scene swap unintendedly.		
			this.options.ct_show = true;
		}
		if(this.options.monster) {
			$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'block');
			$("#"+this.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'none');
		}
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
		delete window.all_token_objects[id];
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
		update_pc_token_rows();
	}
	rotate(newRotation) {
		if ((!window.DM && this.options.restrictPlayerMove && this.options.name != window.PLAYER_NAME) || this.options.locked) return; // don't allow rotating if the token is locked
		if (window.DM && this.options.locked) return; // don't allow rotating if the token is locked
		this.update_from_page();
		this.options.rotation = newRotation;
		// this is copied from the place() function. Rather than calling place() every time the draggable.drag function executes, 
		// this just rotates locally to help with performance.
		// draggable.stop will call place_sync_persist to finalize the rotation. 
		// If we ever want this to send to all players in real time, simply comment out the rest of this function and call place_sync_persist() instead.
		let scale = this.get_token_scale();
		if(this.options.imageSize === undefined) {
			this.imageSize(1) 
		}
		let imageScale = this.options.imageSize;

		var selector = "div[data-id='" + this.options.id + "']";
		var tokenElement = $("#tokens").find(selector);
		tokenElement.css("--token-rotation", newRotation + "deg");
		tokenElement.find(".token-image").css("transform", `scale(${imageScale}) rotate(${newRotation}deg)`);

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

	/**
	 * Move token to new position.
	 * @param {String|Number} top position from the top
	 * @param {String|Number} left position from the left
	 * @returns void
	 */
	move(top, left) {
		if ((!window.DM && this.options.restrictPlayerMove && this.options.name != window.PLAYER_NAME) || this.options.locked) return; // don't allow moving if the token is locked
		if (window.DM && this.options.locked) return; // don't allow moving if the token is locked

		// Save handle params
		top = parseFloat(top);
		left = parseFloat(left);

		// Stop movement if new position is outside of the scene
		if (
			top  < this.walkableArea.top - this.options.size    || 
			top  > this.walkableArea.bottom + this.options.size ||
			left < this.walkableArea.left - this.options.size || 
			left > this.walkableArea.right + this.options.size 
		) { return; }

		this.options.top = top + 'px';
		this.options.left = left + 'px';
		this.place(100);
		this.update_and_sync();
	}

	snap_to_closest_square() {
		if ((!window.DM && this.options.restrictPlayerMove && this.options.name != window.PLAYER_NAME) || this.options.locked) return; // don't allow moving if the token is locked
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
		n.css('top', parseInt(this.options.top)); // anything to do with sizeHeight() here?
		n.css('left', parseInt(this.options.left) + (this.sizeWidth() / 2) - 130);
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
	 * updates the color of the health aura if enabled
	 * @param token jquery selected div with the class "token"
	 */
	update_health_aura(token){
		console.group("update_health_aura")
		// set token data to the player if this token is a player token, otherwise just use this tokens data
		let tokenData = this.munge_token_data()
		if($(`.token[data-id='${this.options.id}']>.hpvisualbar`).length<1){
			let hpvisualbar = $(`<div class='hpvisualbar'></div>`);
			$(`.token[data-id='${this.options.id}']`).append(hpvisualbar);
		}


		if(this.options.healthauratype == undefined){
			if(this.options.disableaura){
				this.options.healthauratype = "none"
			}
			if(this.options.enablepercenthpbar){
				this.options.healthauratype = "bar"
			}
		}
		else{
			if(this.options.healthauratype == "none"){
				this.options.disableaura = true;
				this.options.enablepercenthpbar = false;
			} else if(this.options.healthauratype == "bar"){
				this.options.disableaura = true;
				this.options.enablepercenthpbar = true;
			} else if(this.options.healthauratype == "aura"){
				this.options.disableaura = false;
				this.options.enablepercenthpbar = false;
			}
		}


		if (tokenData.max_hp > 0) {
			if(window.PLAYER_STATS[this.options.id] || !tokenData.temp_hp) {	
				var tokenHpAuraColor = token_health_aura(
					Math.round((tokenData.hp / tokenData.max_hp) * 100)
				);	
				token.css('--hp-percentage', Math.round((tokenData.hp / tokenData.max_hp) * 100) + "%");
			}
			else{
				var tokenHpAuraColor = token_health_aura(
					Math.round(((tokenData.hp - tokenData.temp_hp) / tokenData.max_hp) * 100)
				);	
				token.css('--hp-percentage', Math.round(((tokenData.hp - tokenData.temp_hp) / tokenData.max_hp) * 100) + "%");
			}
		}



		let tokenWidth = this.sizeWidth();
		let tokenHeight = this.sizeHeight();
			
		if(tokenData.disableaura || !tokenData.hp || !tokenData.max_hp) {
			token.css('--token-hp-aura-color', 'transparent');
			token.css('--token-temp-hp', "transparent");
		} 
		else {
			if(this.options.tokenStyleSelect === "circle" || this.options.tokenStyleSelect === "square"){
				tokenWidth = tokenWidth - 6;
				tokenHeight = tokenHeight - 6;
			}
			token.css('--token-hp-aura-color', tokenHpAuraColor);
			if(tokenData.temp_hp) {
				token.css('--token-temp-hp', "#4444ffbd");
			}
			else {
				token.css('--token-temp-hp', "transparent");
			}
		}
		if(tokenData.disableborder) {
			token.css('--token-border-color', 'transparent');
			$("token:before").css('--token-border-color', 'transparent');
		} 
		else {
			if(this.options.tokenStyleSelect === "circle" || this.options.tokenStyleSelect === "square"){
				tokenWidth = tokenWidth - 1;
				tokenHeight = tokenHeight - 1;
			}
			token.css('--token-border-color', this.options.color);
			$("token:before").css('--token-border-color', this.options.color);
			$("#combat_area tr[data-target='" + this.options.id + "'] img[class*='Avatar']").css("border-color", this.options.color);
		}
		if(!tokenData.enablepercenthpbar){
			token.css('--token-hpbar-display', 'none');
		}
		else {
			token.css('--token-hpbar-aura-color', tokenHpAuraColor);
			if(tokenData.temp_hp) {
				token.css('--token-temp-hpbar', "#4444ffbd");
			}
			else {
				token.css('--token-temp-hpbar', "transparent");
			}
			token.css('--token-hpbar-display', 'block');
		}
		token.attr("data-border-color", this.options.color);
		if(!this.options.legacyaspectratio) {
			if($(`div.token[data-id='${this.options.id}'] .token-image`)[0] !== undefined){
				let imageWidth = $(`div.token[data-id='${this.options.id}'] .token-image`)[0].naturalWidth;
				let imageHeight = $(`div.token[data-id='${this.options.id}'] .token-image`)[0].naturalHeight;
				if(imageWidth != 0 && imageHeight != 0){

					if( imageWidth == imageHeight ){
						token.children('.token-image').css("min-width", tokenWidth + 'px');
						token.children('.token-image').css("min-height", tokenHeight + 'px');
					}
					else if(imageWidth > imageHeight) {
						token.children('.token-image').css("min-width", tokenWidth + 'px');
						token.children('img').css("min-height", '');
					}
					else {
						token.children('.token-image').css("min-height", tokenHeight + 'px');
						token.children('.token-image').css("min-width", '');
					}
									
				}
			}
		}
		else {
			token.children('.token-image').css("min-width", "");
			token.children('.token-image').css("min-height", "");
		}
		
		token.children('.token-image').css({		
		    'max-width': tokenWidth + 'px',
			'max-height': tokenHeight + 'px',
		});

		if(window.DM && typeof this.options.hp != "undefined" && this.options.hp < $(`.token[data-id='${this.options.id}'] input.hp`).val() && this.hasCondition("Concentration(Reminder)")){
			// CONCENTRATION REMINDER
			var msgdata = {
				player: this.options.name,
				img: this.options.imgsrc,
				text: "<b>Check for concentration!!</b>",
			};
			window.MB.inject_chat(msgdata);
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
		
		let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
		if(playerTokenId != undefined && self.options.auraislight){
			if(window.TOKEN_OBJECTS[playerTokenId].options.auraislight){
					check_token_visibility()
			}
			else{
				check_single_token_visibility(self.options.id);
			}	
		}
		else{
			check_single_token_visibility(self.options.id);
		}
		/* UPDATE COMBAT TRACKER */
		this.update_combat_tracker()
	}
	update_combat_tracker(){
		/* UPDATE COMBAT TRACKER */
		$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").val(this.options.hp);
		$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .max_hp").val(this.options.max_hp);


		if((!window.DM && this.options.hidestat == true && this.options.name != window.PLAYER_NAME) || this.options.disablestat == true || (!(this.options.id.startsWith("/profile")) && !window.DM && !this.options.player_owned)) {
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").css('visibility', 'hidden');
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .max_hp").css('visibility', 'hidden');
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']>td:nth-of-type(4)>div").css('visibility', 'hidden');
		}	
		else {
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").css('visibility', 'visible');
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .max_hp").css('visibility', 'visible');
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']>td:nth-of-type(4)>div").css('visibility', 'visible');
		}
		if($("#combat_tracker_inside tr[data-target='" + this.options.id + "'] input.hp").val() === '0'){
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").toggleClass("ct_dead", true);
		}
		else{
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").toggleClass("ct_dead", false);
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
		ct_update_popout();
	}

	build_hp() {
		var self = this;
		var bar_height = this.sizeHeight() * 0.2;


		bar_height = Math.ceil(bar_height);
		var hpbar = $("<div class='hpbar'/>");
		hpbar.css("position", 'absolute');
		hpbar.css('height', bar_height);
		hpbar.css('top', Math.floor(this.sizeHeight() - bar_height));

		hpbar.toggleClass('medium-or-smaller', false);
		hpbar.toggleClass('tiny-or-smaller', false);
		
		let tokenWidth = this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps;
		if(tokenWidth >= 10)
			hpbar.toggleClass('greater-than-10-wide', true);
		if(tokenWidth < 2 && tokenWidth >= 1)
			hpbar.toggleClass('medium', true);
		if(tokenWidth < 1)
			hpbar.toggleClass('smaller-than-medium', true);
		

		var fs = Math.floor(bar_height / 1.2) + "px";

		hpbar.css("--font-size",fs);

		var input_width = Math.floor(this.sizeWidth() * 0.3);

		var hp_input = $("<input class='hp'>").css('width', input_width)
		hp_input.val(this.options.hp);

		var maxhp_input = $("<input class='max_hp'>").css('width', input_width);
		maxhp_input.val(this.options.max_hp);

		if (this.options.disableaura){
			console.log("building hp bar", this.options)
			this.options.temp_hp && this.options.temp_hp > 0 ?
				hpbar.css('background', '#77a2ff')
				: hpbar.css('background', '');
		}

		var divider = $("<div>/</>");


		hpbar.append(hp_input);
		hpbar.append(divider);
		hpbar.append(maxhp_input);
		if (!this.isPlayer()) {
			hp_input.change(function(e) {
				hp_input.val(hp_input.val().trim());
				self.update_and_sync(e);
				let tokenID = $(this).parent().parent().attr("data-id");
				if(window.all_token_objects[tokenID] != undefined){
					window.all_token_objects[tokenID].options.hp = hp_input.val();
				}			
				if(window.TOKEN_OBJECTS[tokenID] != undefined){		
					window.TOKEN_OBJECTS[tokenID].options.hp = hp_input.val();	
					window.TOKEN_OBJECTS[tokenID].update_and_sync()
				}
				setTimeout(ct_persist(), 500);
			});
			hp_input.click(function(e) {
				$(e.target).select();
			});
			maxhp_input.change(function(e) {
				maxhp_input.val(maxhp_input.val().trim());
				self.update_and_sync(e);
				if(window.all_token_objects[tokenID] != undefined){
					window.all_token_objects[tokenID].options.max_hp = maxhp_input.val();
				}
				if(window.TOKEN_OBJECTS[tokenID] != undefined){		
					window.TOKEN_OBJECTS[tokenID].options.max_hp = maxhp_input.val();	
					window.TOKEN_OBJECTS[tokenID].update_and_sync()
				}
				setTimeout(ct_persist(), 500);
			});
			maxhp_input.click(function(e) {
				$(e.target).select();
			});
		}
		else {
			hp_input.keydown(function(e) { if (e.keyCode == '13') self.update_from_page(); e.preventDefault(); }); // DISABLE WITHOUT MAKING IT LOOK UGLY
			maxhp_input.keydown(function(e) { if (e.keyCode == '13') self.update_from_page(); e.preventDefault(); });
		}

		if(this.options.hidehpbar) {
			hpbar.toggleClass("hponhover", true);
		}
		else {
			hpbar.toggleClass("hponhover", false)
		}

		return hpbar;
	}

	build_ac() {
		var bar_height = Math.max(16, Math.floor(this.sizeHeight() * 0.2)); // no less than 16px
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
		var bar_height = Math.max(16, Math.floor(this.sizeHeight() * 0.2)); // no less than 16px
		var elev = $("<div class='elev'/>");
		let bar_width = Math.floor(this.sizeWidth() * 0.2);
		elev.css("position", "absolute");
		elev.css('right', bar_width * 4.35 + "px");
		elev.css('width', bar_height + "px");
		elev.css('height', bar_height + "px");
		elev.css('bottom', '3px');
		elev.css('color', 'white');
		if (parseFloat(this.options.elev) > 0) {
			elev.append(
			$(`
			<svg width="${bar_height + 5}px" height="${bar_height + 5}px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path fill="#fff" stroke="#000" stroke-width="0.5" d="M18,17 L18,18 C18,21 16,22 13,22 L11,22 C8,22 6,21 6,18 L6,17 C3.23857625,17 1,14.7614237 1,12 C1,9.23857625 3.23857625,7 6,7 L12,7 M6,7 L6,6 C6,3 8,2 11,2 L13,2 C16,2 18,3 18,6 L18,7 C20.7614237,7 23,9.23857625 23,12 C23,14.7614237 20.7614237,17 18,17 L12,17"/>
			<svg fill="#FFF" width="29px" height="19.5px" viewBox="-60 -205 750 750" xmlns="http://www.w3.org/2000/svg"><path stroke-width="1500" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"></path> </svg>
			<text style="position:absolute;top:4px;left:8px;font-size:12px;color:#000;transform:translate(${this.options.elev > 9 ? 5.5 + 'px': 8.5 + 'px'},16px);">${this.options.elev}</text>
			</svg>
			`));
		} else if (parseFloat(this.options.elev) < 0) {
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
		else if(this.options.player_owned || this.options.name == window.PLAYER_NAME){ // if it's player_owned.. always showthem
			showthem=true;
		}
		else if(this.isPlayer() && (!this.options.hidestat)){
			showthem=true;
		}


		if(showthem){
			if (!this.options.max_hp && !this.options.hp) { // even if we are supposed to show them, only show them if they have something to show.
				token.find(".hpbar").css("visibility", "hidden");
			} else {
				token.find(".hpbar").css("visibility", "visible");
			}
			if (!this.options.ac) { // even if we are supposed to show it, only show them if they have something to show.
				token.find(".ac").hide();
			} else {
				token.find(".ac").show();
			}
			if (!this.options.elev) { // even if we are supposed to show it, only show them if they have something to show.
				token.find(".elev").hide();
			} else {
				token.find(".ac").show();
			}
		}
		else{
			token.find(".hpbar").css("visibility", "hidden");
			token.find(".ac").hide();
			token.find(".elev").hide();
		}
	}

	update_opacity(html = undefined, animated = false) {
		let tok;
		if (html) {
			tok = html;
		} else {
			tok = $(`#tokens div[data-id="${this.options.id}"]`);
		}

		if (!tok) {
			console.log("update_opacity failed to find an html element", this);
			return;
		}

		if (this.options.hidden || is_token_under_fog(this.options.id)) {
			if (window.DM) {
				if (animated) {
					tok.animate({ opacity: 0.5 }, { duration: 500, queue: false });
				} else {
					tok.css("opacity", 0.5); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
				}
			} else {
				tok.hide();
			}
		} else {
			if (animated) {
				tok.animate({ opacity: 1 }, { duration: 500, queue: false });
			} else {
				tok.css("opacity", 1); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
			}
			tok.show();
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
		let bar_width = Math.floor(this.sizeWidth() * 0.2);
		const cond = $("<div class='conditions' style='padding:0;margin:0'/>");
		const moreCond = $(`<div class='conditions' style='left:${bar_width}px;'/>`);
		cond.css('left', "0");

		const symbolSize = Math.min(bar_width >= 22 ? bar_width : (this.sizeWidth() / 4), 45);

		moreCond.css('left', this.sizeWidth() - symbolSize);
		[cond, moreCond].forEach(cond_bar => {
			cond_bar.width(symbolSize);
			cond_bar.height(this.sizeWidth() - bar_width); // height or width???
		})
		if (this.options.inspiration){
			if (!this.hasCondition("Inspiration")){
				this.addCondition("Inspiration")
			}
		} else{
			array_remove_index_by_value(this.options.custom_conditions, "Inspiration");
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

			for (i = 0; i < this.options.custom_conditions.length; i++) {
				//convert from old colored conditions
				if(this.options.custom_conditions[i].name == undefined){
					this.options.custom_conditions.push({
						'name': DOMPurify.sanitize( this.options.custom_conditions[i],{ALLOWED_TAGS: []}),
						'text': ''
					});
					this.options.custom_conditions.splice(i, 1)
					i -= 1;
					continue;
				}
				//Security logic to prevent HTML/JS from being injected into condition names.
				const conditionName = DOMPurify.sanitize( this.options.custom_conditions[i].name,{ALLOWED_TAGS: []});
				const conditionText = DOMPurify.sanitize( this.options.custom_conditions[i].text,{ALLOWED_TAGS: []});
				const conditionSymbolName = DOMPurify.sanitize( conditionName.replaceAll(' ','_').toLowerCase(),{ALLOWED_TAGS: []});
				const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
				let symbolImage;
				if (conditionName.startsWith('#')) {
					symbolImage = $(`<div class='condition-img custom-condition text' style='background: ${conditionName}'><svg  viewBox="0 0 ${symbolSize} ${symbolSize}">
									  <text class='custom-condition-text' x="50%" y="50%">${conditionText.charAt(0)}</text>
									</svg></div>`);
				} else {
					symbolImage = $("<img class='condition-img custom-condition' src='" + window.EXTENSION_PATH + "assets/conditons/" + conditionSymbolName + ".png'/>");
				}

				symbolImage.attr('title', (conditionText != '') ? conditionText : (conditionName.startsWith("#") ? '' : conditionName));
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

		// we don't allow certain options to be set for AOE tokens
		this.defaultAoeOptions();

		if (animationDuration == undefined || parseFloat(animationDuration) == NaN) {
			animationDuration = 1000;
		}
		console.log("cerco id" + this.options.id);
		var selector = "div[data-id='" + this.options.id + "']";
		var old = $("#tokens").find(selector);
		var self = this;
		/* UPDATE COMBAT TRACKER */
		this.update_combat_tracker()

		let imageScale = this.options.imageSize;
		let rotation = 0;
		if (this.options.rotation != undefined) {
			rotation = this.options.rotation;
		}

		if (old.length > 0) {
			console.trace();
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
				




			old.find(".token-image").css("transition", "max-height 0.2s linear, max-width 0.2s linear, transform 0.2s linear")
			old.find(".token-image").css("transform", "scale(" + imageScale + ") rotate("+rotation+"deg)");
			old.css("--token-rotation", rotation+"deg");
			old.css("--token-scale", imageScale);
			setTimeout(function() {old.find(".token-image").css("transition", "")}, 200);		
			
			var selector = "tr[data-target='"+this.options.id+"']";
			var entry = $("#combat_area").find(selector);
			if((!(this.options.name) || !(this.options.revealname)) && !window.DM) {
				old.toggleClass('hasTooltip', false);
				entry.toggleClass('hasTooltip', false);
			}	
			else if (this.options.name) {
				if ((window.DM || this.isPlayer() || this.options.revealname)) {
					old.attr("data-name", this.options.name);
					old.toggleClass('hasTooltip', true);
					entry.attr("data-name", this.options.name);
					entry.toggleClass('hasTooltip', true);
				}
			}


			if (old.attr('width') !== this.sizeWidth() || old.attr('height') !== this.sizeHeight()) {
				// NEED RESIZING
				old.find("img").css("--token-border-width", (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps)+"px");
				old.find("img").css({
					"max-height": this.sizeWidth(),
					"max-width": this.sizeHeight()
				});


				old.animate({
					width: this.sizeWidth(),
					height: this.sizeHeight()
				}, { duration: 1000, queue: false });
				var zindexdiff=(typeof this.options.zindexdiff == 'number') ? this.options.zindexdiff : Math.round(17/(this.sizeWidth()/window.CURRENT_SCENE_DATA.hpps));
				this.options.zindexdiff = Math.max(zindexdiff, -5000);
				old.css("z-index", "calc(5000 + var(--z-index-diff))");
				old.css("--z-index-diff", zindexdiff);

				var bar_height = Math.floor(this.sizeHeight() * 0.2);

				if (bar_height > 60)
					bar_height = 60;

				var fs = Math.floor(bar_height / 1.3) + "px";
				old.css("font-size",fs);
			}

			this.update_opacity(old);

			this.build_conditions(old);

			if (this.selected) {
				old.addClass("tokenselected");
				toggle_player_selectable(this, old)
			}
			else {
				old.css("border", "");
				old.removeClass("tokenselected");
			}
			const oldImage = old.find(".token-image,[data-img]")
			// token uses an image for it's image
			if (!this.options.imgsrc.startsWith("class")){
				if(oldImage.attr("src")!=this.options.imgsrc){
					oldImage.attr("src",this.options.imgsrc);
				}

				if(this.options.disableborder){
					oldImage.css("border-width","0");
				}
				else{
					oldImage.css("border-width","");
				}

				setTokenAuras(old, this.options);

				setTokenBase(old, this.options);

				if(!(this.options.square) && !oldImage.hasClass('token-round')){
					oldImage.addClass("token-round");
				}

				if(old.find("img").hasClass('token-round') && (this.options.square) ){
					oldImage.removeClass("token-round");
				}
				if(this.options.legacyaspectratio == false) {
					// if the option is false, the token was either placed after the option was introduced, or the user actively chose to use the new option
					oldImage.addClass("preserve-aspect-ratio");
				} else {
					// if the option is undefined, this token was placed before the option existed and should therefore use the legacy behavior
					// if the option is true, the user actively enabled the option
					oldImage.removeClass("preserve-aspect-ratio");
				}


			} else{
				// token is an aoe div that uses styles instead of an image
				// do something with it maybe?
				// re-calc the border width incase the token has changed size
				oldImage.css(`transform:scale("${imageScale}") rotate("${rotation}deg");`)

			}

			oldImage.css("max-height", this.sizeHeight());
			oldImage.css("max-width", this.sizeWidth());

			setTokenAuras(old, this.options);
			if(this.options.lockRestrictDrop == undefined){
				if(this.options.restrictPlayerMove){
					this.options.lockRestrictDrop = "restrict"
				}
				if(this.options.locked){
					this.options.lockRestrictDrop = "lock"
				}
			}
			else{
				if(this.options.lockRestrictDrop == "restrict"){
					this.options.restrictPlayerMove = true;
					this.options.locked = false;
				}
				else if(this.options.lockRestrictDrop == "lock"){
					this.options.locked = true;
				}
				else if(this.options.lockRestrictDrop == "none"){
					this.options.locked = false;
					this.options.restrictPlayerMove = false;
				}
			}
			if((!window.DM && this.options.restrictPlayerMove && this.options.name != window.PLAYER_NAME) || this.options.locked){
				old.draggable("disable");
				old.removeClass("ui-state-disabled"); // removing this manually.. otherwise it stops right click menu
			}
			else if((window.DM && this.options.restrictPlayerMove && this.options.name != window.PLAYER_NAME) || !this.options.locked){
				old.draggable("enable");
			}	
			else if(!window.DM && ((!this.options.restrictPlayerMove  && this.options.name != window.PLAYER_NAME)) || !this.options.locked){
				old.draggable("enable");
			}

			this.update_health_aura(old);

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
			// console.group("new token")
			var tok = $("<div/>");
			
			var bar_height = Math.floor(this.sizeHeight() * 0.2);

			if (bar_height > 60)
				bar_height = 60;

			var fs = Math.floor(bar_height / 1.3) + "px";
			tok.css("font-size",fs);
			
			if(this.options.gridSquares != undefined){
				this.options.size = window.CURRENT_SCENE_DATA.hpps * this.options.gridSquares;
			}
			else{
				this.options.gridSquares = this.options.size / window.CURRENT_SCENE_DATA.hpps
			}
			
			let tokenImage
			// new aoe tokens use arrays as imsrc
			if (!this.isAoe()){
				let imgClass = 'token-image';
				if(this.options.legacyaspectratio == false) {
					imgClass = 'token-image preserve-aspect-ratio';
				}
				tokenImage = $("<img style='transform:scale(" + imageScale + ") rotate(" + rotation + "deg)' class='"+imgClass+"'/>");
				tok.css("--token-scale", imageScale)
				if(!(this.options.square)){
					tokenImage.addClass("token-round");
				}

				tokenImage.attr("src", this.options.imgsrc);

				if(this.options.disableborder)
					tokenImage.css("border-width","0");
				tokenImage.css("--token-border-width", (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps)+"px");
				tokenImage.css("max-height", this.options.size);
				tokenImage.css("max-width", this.options.size);
				tokenImage.attr("src", this.options.imgsrc);
				tok.toggleClass("isAoe", false);

			} else {
				tokenImage = build_aoe_token_image(this, imageScale, rotation)
				tok.toggleClass("isAoe", true);
			}
			tok.css("--token-rotation", rotation + "deg");
			tok.append(tokenImage);


			tokenImage.css("max-height", this.sizeHeight());
			tokenImage.css("max-width", this.sizeWidth());

			tok.attr("data-id", this.options.id);



			var zindexdiff=(typeof this.options.zindexdiff == 'number') ? this.options.zindexdiff : Math.round(17/(this.sizeWidth()/window.CURRENT_SCENE_DATA.hpps)); 
			this.options.zindexdiff = Math.max(zindexdiff, -5000);
			console.log("Diff: "+zindexdiff);
			
			tok.css("z-index", "calc(5000 + var(--z-index-diff))");
			tok.width(this.sizeWidth());
			tok.height(this.sizeHeight());
			tok.addClass('token');
			tok.append(tokenImage);


			tok.attr("data-id", this.options.id);

			tok.addClass("VTTToken");

			this.update_health_aura(tok);


				
			tok.css("position", "absolute");
			tok.css("--z-index-diff", zindexdiff);
			tok.css("top", this.options.top);
			tok.css("left", this.options.left);
			tok.css("opacity", "0.0");
			tok.css("display", "flex");
			tok.css("justify-content", "center");
			tok.css("align-items", "center");

			if (typeof this.options.monster !== "undefined")
				tok.attr('data-monster', this.options.monster);

			if ((this.options.name) && (window.DM || this.isPlayer() || this.options.revealname)) {
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
			if(window.all_token_objects == undefined){
				window.all_token_objects = {};
			}
			if(window.all_token_objects[this.options.id] == undefined){
				window.all_token_objects[this.options.id] = {};
			}
			if(window.all_token_objects[this.options.id].ct_show !== undefined){
				this.options.ct_show = window.all_token_objects[this.options.id].ct_show 
			}
			if (this.options !== undefined){
				window.all_token_objects[this.options.id] = new Token(this.options);
			}
			else if (typeof window.all_token_objects[this.options.id].options.init !== undefined && window.all_token_objects[this.options.id].options.ct_show !== undefined){		
				this.options.init = window.all_token_objects[this.options.id].options.init;
			}
			// CONDITIONS
			this.build_conditions().forEach(cond_bar => {
				tok.append(cond_bar);
			});


			$("#tokens").append(tok);
			this.update_opacity(tok, true);

			setTokenAuras(tok, this.options);

			setTokenBase(tok, this.options);

			let click = {
				x: 0,
				y: 0
			};
			let currentTokenPosition = {
				x: 0,
				y: 0
			};

			tok.draggable({
				handle: "img, [data-img]",
				stop:
					function (event) {
						//remove cover for smooth drag
						$('.iframeResizeCover').remove();

						tok.removeAttr("data-dragging")
						tok.removeAttr("data-drag-x")
						tok.removeAttr("data-drag-y")
			
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
							const el = token.parent().parent().find("#aura_" + token.attr("data-id").replaceAll("/", ""));
							if (el.length > 0) {
								const auraSize = parseInt(el.css("width"));

								el.css("top", `${selectedNewtop/window.CURRENT_SCENE_DATA.scale_factor  - ((auraSize - self.sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor ) / 2)}px`);
								el.css("left", `${selectedNewleft/window.CURRENT_SCENE_DATA.scale_factor  - ((auraSize  - self.sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor ) / 2)}px`);
							}

							for (let tok of $(".token.tokenselected")){
								let id = $(tok).attr("data-id");
								var curr = window.TOKEN_OBJECTS[id];
								$("[data-id='"+id+"']").removeClass("pause_click");
								console.log($("[data-id='"+id+"']"));

								if (id != self.options.id) {

									const oldtop = parseInt($(tok).css("top"));
									const oldleft = parseInt($(tok).css("left"));

									const newtop = Math.round((oldtop - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
									const newleft = Math.round((oldleft - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;

									$(tok).css("top", newtop + "px");
									$(tok).css("left", newleft + "px");

									const selEl = $(tok).parent().parent().find("#aura_" + id.replaceAll("/", ""));
									if (selEl.length > 0) {
										const auraSize = parseInt(selEl.css("width")/window.CURRENT_SCENE_DATA.scale_factor);

										selEl.css("top", `${newtop/window.CURRENT_SCENE_DATA.scale_factor - ((auraSize - window.TOKEN_OBJECTS[id].sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor) / 2)}px`);
										selEl.css("left", `${newleft/window.CURRENT_SCENE_DATA.scale_factor - ((auraSize - window.TOKEN_OBJECTS[id].sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor) / 2)}px`);
									}
								}
								
							}
						}					
				
						// finish measuring
						// drop the temp overlay back down so selection works correctly
						$("#temp_overlay").css("z-index", "25")
						if (get_avtt_setting_value("allowTokenMeasurement")){
							WaypointManager.fadeoutMeasuring()
						}	
						self.update_and_sync(event, false);
						if (self.selected ) {
							for (let tok of $(".token.tokenselected")){
								let id = $(tok).attr("data-id");
								if (id == self.options.id)
									continue;
								var curr = window.TOKEN_OBJECTS[id];
								var ev = { target: $("#tokens [data-id='" + id + "']").get(0) };
								$("[data-id='"+id+"']").removeClass("pause_click");

								curr.update_and_sync(ev);
							}												
						}
						window.DRAGGING = false;
						draw_selected_token_bounding_box();
						window.toggleSnap=false;
					},

				start: function (event) {
					event.stopImmediatePropagation();
					if (get_avtt_setting_value("allowTokenMeasurement")) {
						$("#temp_overlay").css("z-index", "50");
					}
					window.DRAWFUNCTION = "select"
					window.DRAGGING = true;
					click.x = event.pageX;
					click.y = event.pageY;
					if(self.selected == false && $(".token.tokenselected").length>0){
						for (let tok of $(".token.tokenselected")){
							let id = $(tok).attr("data-id");
							window.TOKEN_OBJECTS[id].selected = false;
							$("#tokens [data-id='" + id + "']").toggleClass("tokenselected", false)
						}
					}

					self.selected = true;
					$("#tokens [data-id='" + self.options.id + "']").toggleClass("tokenselected", true);
					if(tok.is(":animated")){
						self.stopAnimation();
					}
					
					// for dragging behind iframes so tokens don't "jump" when you move past it
					$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
					$("#sheet").append($('<div class="iframeResizeCover"></div>'));

					console.log("Click x: " + click.x + " y: " + click.y);

					self.orig_top = self.options.top;
					self.orig_left = self.options.left;


					if (self.selected && $(".token.tokenselected").length>1) {
						for (let tok of $(".token.tokenselected")){
							let id = $(tok).attr("data-id");
							$(tok).addClass("pause_click");
							if($(tok).is(":animated")){
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
					

					const el = $("#aura_" + self.options.id.replaceAll("/", ""));
					if (el.length > 0) {
						el.attr("data-left", el.css("left").replace("px", ""));
						el.attr("data-top", el.css("top").replace("px", ""));
					}

					if (get_avtt_setting_value("allowTokenMeasurement")) {
							// Setup waypoint manager
							// reset measuring when a new token is picked up
							if(window.previous_measured_token != self.options.id){
								window.previous_measured_token = self.options.id
								WaypointManager.cancelFadeout()
								WaypointManager.clearWaypoints()
							}
							const tokenMidX = parseInt(self.orig_left) + Math.round(self.options.size / 2);
							const tokenMidY = parseInt(self.orig_top) + Math.round(self.options.size / 2);

							if(WaypointManager.numWaypoints > 0){
								WaypointManager.checkNewWaypoint(tokenMidX/window.CURRENT_SCENE_DATA.scale_factor, tokenMidY/window.CURRENT_SCENE_DATA.scale_factor)
								WaypointManager.cancelFadeout()
							}
							window.BEGIN_MOUSEX = tokenMidX;
							window.BEGIN_MOUSEY = tokenMidY;
							if (!self.options.disableborder){
								WaypointManager.drawStyle.color = window.color ? window.color : $(tok).css("--token-border-color");
							}else{
								WaypointManager.resetDefaultDrawStyle();
							}
							const canvas = document.getElementById("temp_overlay");
							const context = canvas.getContext("2d");
							// incase we click while on select, remove any line dashes
							context.setLineDash([])
							context.fillStyle = '#f50';
							
							WaypointManager.setCanvas(canvas);
					}

					remove_selected_token_bounding_box();
				},

				/**
				 * Dragging a token.
				 * @param {Event} event mouse event
				 * @param {Object} ui UI-object
				 */
				drag: function(event, ui) {
					event.stopImmediatePropagation();
					var zoom = window.ZOOM;

					var original = ui.originalPosition;
					let tokenX = Math.round((event.pageX - click.x + original.left) / zoom);
					let tokenY = Math.round((event.pageY - click.y + original.top) / zoom);


					if (should_snap_to_grid()) {
						tokenX += (window.CURRENT_SCENE_DATA.hpps / 2);
						tokenY += (window.CURRENT_SCENE_DATA.vpps / 2);
					}
					
					// this was copied the place function in this file. We should make this a single function to be used in other places
					let tokenPosition = snap_point_to_grid(tokenX, tokenY);

					// Constrain token within scene
					tokenPosition.x = clamp(tokenPosition.x, self.walkableArea.left, self.walkableArea.right);
					tokenPosition.y = clamp(tokenPosition.y, self.walkableArea.top, self.walkableArea.bottom);

					ui.position = {
						left: tokenPosition.x,
						top: tokenPosition.y
					};

					if (get_avtt_setting_value("allowTokenMeasurement")) {
						const tokenMidX = tokenPosition.x + Math.round(self.options.size / 2);
						const tokenMidY = tokenPosition.y + Math.round(self.options.size / 2);

						clear_temp_canvas();
						WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX/window.CURRENT_SCENE_DATA.scale_factor, window.BEGIN_MOUSEY/window.CURRENT_SCENE_DATA.scale_factor, tokenMidX/window.CURRENT_SCENE_DATA.scale_factor, tokenMidY/window.CURRENT_SCENE_DATA.scale_factor);
						WaypointManager.draw(false, Math.round(tokenPosition.x + (self.options.size / 2))/window.CURRENT_SCENE_DATA.scale_factor, Math.round(tokenPosition.y + self.options.size + 10)/window.CURRENT_SCENE_DATA.scale_factor);
						if (!self.options.hidden) {
							send_ruler_to_peers();
						}
					}

					//console.log("Changing to " +ui.position.left+ " "+ui.position.top);
					// HACK TEST 
					/*$(event.target).css("left",ui.position.left);
					$(event.target).css("top",ui.position.top);*/
					// END OF HACK TEST

					const el = ui.helper.parent().parent().find("#aura_" + ui.helper.attr("data-id").replaceAll("/", ""));
					if (el.length > 0) {
						let currLeft = parseFloat(el.attr("data-left"));
						let currTop = parseFloat(el.attr("data-top"));
						let offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
						let offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));
						el.css('left', (currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor)) + "px");
						el.css('top', (currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor))  + "px");
					}




					if (self.selected && $(".token.tokenselected").length>1) {
						// if dragging on a selected token, we should move also the other selected tokens
						// try to move other tokens by the same amount
						var offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
						var offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));

						for (let tok of $(".token.tokenselected")){
							let id = $(tok).attr("data-id");
							if ((id != self.options.id) && (!window.TOKEN_OBJECTS[id].options.locked || (window.DM && window.TOKEN_OBJECTS[id].options.restrictPlayerMove))) {
								//console.log("sposto!");
								var curr = window.TOKEN_OBJECTS[id];
								$(tok).css('left', (parseInt(curr.orig_left) + offsetLeft) + "px");
								$(tok).css('top', (parseInt(curr.orig_top) + offsetTop) + "px");
								//curr.options.top=(parseInt(curr.orig_top)+offsetTop)+"px";
								//curr.place();

								const selEl = $(tok).parent().parent().find("#aura_" + id.replaceAll("/", ""));
								if (selEl.length > 0) {
									let currLeft = parseFloat(selEl.attr("data-left"));
									let currTop = parseFloat(selEl.attr("data-top"));
									let offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
									let offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));
									selEl.css('left', (currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))  + "px");
									selEl.css('top', (currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)) + "px");
								}
							}
						}													
					}

				}
			});
			
			if(this.options.lockRestrictDrop == undefined){
				if(this.options.restrictPlayerMove){
					this.options.lockRestrictDrop = "restrict"
				}
				if(this.options.locked){
					this.options.lockRestrictDrop = "lock"
				}
			}
			else{
				if(this.options.lockRestrictDrop == "restrict"){
					this.options.restrictPlayerMove = true;
					this.options.locked = false;
				}
				else if(this.options.lockRestrictDrop == "lock"){
					this.options.locked = true;
				}
				else if(this.options.lockRestrictDrop == "none"){
					this.options.locked = false;
					this.options.restrictPlayerMove = false;
				}
			}

			if(this.options.locked){
				tok.draggable("disable");
				tok.removeClass("ui-state-disabled");
			}
			if (!window.DM && this.options.restrictPlayerMove && !this.isCurrentPlayer()) {
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
		//check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		console.groupEnd()
	}

	// key: String, numberRemaining: Number; example: track_ability("1stlevel", 2) // means they have 2 1st level spell slots remaining
	track_ability(key, numberRemaining) {
		if (this.options.abilityTracker === undefined) {
			this.options.abilityTracker = {};
		}
		const asNumber = parseInt(numberRemaining);
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

	/**
	 * Defines how far tokens are allowed to move outside of the scene
	 */
	prepareWalkableArea() {
		// sizeOnGrid needs to be at least one grid size to work for smaller tokens
		const sizeOnGrid = {
			y: Math.max(this.options.size, window.CURRENT_SCENE_DATA.hpps),
			x: Math.max(this.options.size, window.CURRENT_SCENE_DATA.vpps)
		};

		// Shorten variable to improve readability
		const multi = this.SCENE_MOVE_GRID_PADDING_MULTIPLIER; 

		this.walkableArea = {
			top:  0 - (sizeOnGrid.y * multi),
			left: 0 - (sizeOnGrid.x * multi),
			right:  window.CURRENT_SCENE_DATA.width * window.CURRENT_SCENE_DATA.scale_factor  + (sizeOnGrid.x * (multi -1)), // We need to remove 1 token size because tokens are anchored in the top left
			bottom: window.CURRENT_SCENE_DATA.height * window.CURRENT_SCENE_DATA.scale_factor + (sizeOnGrid.y * (multi -1)), // ... same as above
		};	
	}
	
}

/**
 * disables player selection of a token when token is locked & restricted
 * @param tokenInstance token instance ofc
 * @param token jquery selected div with the class token
 */
function toggle_player_selectable(tokenInstance, token){
	const tokenImage = token?.find("img, [data-img]")
	if (tokenInstance.options.locked && !window.DM){
		tokenImage?.css("cursor","default");
		tokenImage?.css("pointer-events","none");
	}
	else{
		tokenImage?.css("cursor","move");
		tokenImage?.css("pointer-events","auto");
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
		color: random_token_color(),
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
		auraVisible: false,
		auraOwned: false
	};
}

function center_of_view() {
	let centerX = (window.innerWidth/2) + window.scrollX 
	if($("#hide_rightpanel").hasClass("point-right")){
		centerX = centerX - 170;
	}
	let centerY = (window.innerHeight/2) + window.scrollY
	return { x: centerX, y: centerY };
}

function should_snap_to_grid() {
	return (window.CURRENT_SCENE_DATA.snap == "1" && !(window.toggleSnap))
		|| ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);
}

function snap_point_to_grid(mapX, mapY, forceSnap = false) {
	if (forceSnap || should_snap_to_grid()) {
		// adjust to the nearest square coordinate
		const startX = window.CURRENT_SCENE_DATA.offsetx;
		const startY = window.CURRENT_SCENE_DATA.offsety;

		const gridWidth = window.CURRENT_SCENE_DATA.hpps;
		const gridHeight = window.CURRENT_SCENE_DATA.vpps;
		const currentGridX = Math.floor((mapX - startX) / gridWidth);
		const currentGridY = Math.floor((mapY - startY) / gridHeight);
		return {
			x: (currentGridX * gridWidth) + startX,
			y: (currentGridY * gridHeight) + startY
		}
	} else {
		return { x: mapX, y: mapY };
	}
}

function convert_point_from_view_to_map(pageX, pageY, forceNoSnap = false) {
	// adjust for map offset and zoom
	const startX = window.CURRENT_SCENE_DATA.offsetx;
	const startY = window.CURRENT_SCENE_DATA.offsety;
	let mapX = ((pageX - 200) * (1.0 / window.ZOOM)) - startX;
	let mapY = ((pageY - 200) * (1.0 / window.ZOOM)) - startY;
	if (forceNoSnap === true) {
		return { x: mapX, y: mapY };
	}
	let snapped = snap_point_to_grid(mapX, mapY, forceNoSnap);
	return {
		x: snapped.x + startX,
		y: snapped.y + startY
	};
}

function convert_point_from_map_to_view(mapX, mapY) {
	let pageX = mapX / (1 / window.ZOOM) + 200;
	let pageY = mapY / (1 / window.ZOOM) + 200;
	return { x: pageX, y: pageY };
}

function place_token_in_center_of_view(tokenObject) {
	let center = center_of_view();
	place_token_at_view_point(tokenObject, center.x, center.y);
}

function place_token_at_view_point(tokenObject, pageX, pageY) {
	let mapPosition = convert_point_from_view_to_map(pageX, pageY);
	place_token_at_map_point(tokenObject, mapPosition.x, mapPosition.y);
}

function place_token_at_map_point(tokenObject, x, y) {

	console.log(`attempting to place token at ${x}, ${y}; options: ${JSON.stringify(tokenObject)}`);

	if (tokenObject.id == undefined) {
		tokenObject.id = uuid();
	}
	// if this is a player token, check if the token is already on the map
	if(tokenObject.id in window.TOKEN_OBJECTS && window.TOKEN_OBJECTS[tokenObject.id].isPlayer()){
		window.TOKEN_OBJECTS[tokenObject.id].highlight();
		return;
	}

	let options = {
		...default_options(),
		...window.TOKEN_SETTINGS,
		...tokenObject
	};
	// aoe tokens have classes instead of images
	if (typeof options.imgsrc === "string" && !options.imgsrc.startsWith("class")) {
		options.imgsrc = parse_img(options.imgsrc);
	}

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
		} else if (options.tokenSize != undefined && parseFloat(options.tokenSize) != NaN) {
			// tokenSize was specified, convert it to size. tokenSize is the number of squares this token fills
			options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * parseFloat(options.tokenSize);
		} else {
			// default to small/medium size
			options.size = Math.round(window.CURRENT_SCENE_DATA.hpps) * 1;
		}
	}
	if(window.all_token_objects !== undefined){
		if(window.all_token_objects[options.id] !== undefined){
			if(window.all_token_objects[options.id].options.ct_show !== undefined){
				options = window.all_token_objects[options.id].options;
			  	$(`#combat_area tr[data-target='${options.id}'] .findSVG`).remove();
		       	let findSVG=$('<svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg>');	
		        $(`#combat_area tr[data-target='${options.id}'] .findTokenCombatButton`).append(findSVG);
			}
		}
	}
	options.left = `${x - options.size/2}px`;
	options.top = `${y - options.size/2}px`;
	// set reasonable defaults for any global settings that aren't already set
	const setReasonableDefault = function(optionName, reasonableDefault) {
		if (options[optionName] === undefined) {
			options[optionName] = window.TOKEN_SETTINGS[optionName];
			if (options[optionName] === undefined) {
				options[optionName] = reasonableDefault;
			}
		}
	}
	token_setting_options().forEach(option => setReasonableDefault(option.name, option.defaultValue));
	// unless otherwise specified, tokens should not be hidden when they are placed
	setReasonableDefault("hidden", false);

	// place the token
	window.ScenesHandler.create_update_token(options);
	if (options.id in window.PLAYER_STATS) {
		window.MB.handlePlayerData(window.PLAYER_STATS[options.id]);
		send_player_data_to_all_peers(window.PLAYER_STATS[options.id]);
	}
	window.MB.sendMessage('custom/myVTT/token', options);

	
	fetch_and_cache_scene_monster_items();
	update_pc_token_rows();
}

function array_remove_index_by_value(arr, item) {
	const index = arr.findIndex(e => e.name === item);
	if (index > -1) {
	  arr.splice(index, 1)
	}
	else{
		for (var i = arr.length; i--;) {
			if (arr[i] === item) { arr.splice(i, 1); }
		}
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


function determine_hidden_classname(tokenIds) {
	let allHiddenStates = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].options.hidden === true)
		.filter(t => t !== undefined);
	let uniqueHiddenStates = [...new Set(allHiddenStates)];

	if (uniqueHiddenStates.length === 0 || (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === false)) {
		// none of these tokens are hidden
		return "none-active";
	} else if (uniqueHiddenStates.length === 1 && uniqueHiddenStates[0] === true) {
		// everything we were given is hidden. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things are hidden
		return "some-active active-condition";
	}
}

function token_menu() {

		$("#tokens").on("contextmenu", ".VTTToken", function(event) {
			console.log("context_menu_flyout contextmenu event", event);
			event.preventDefault();
			event.stopPropagation();
			if($(event.currentTarget).children('.token-image').css('pointer-events') == 'none' && !window.DM)
				return;
			if ($(event.currentTarget).hasClass("tokenselected") && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
				token_context_menu_expanded(window.CURRENTLY_SELECTED_TOKENS, event);
			} else {
				token_context_menu_expanded([$(event.currentTarget).attr("data-id")], event);
			}
		});
		return;
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
		return result ? `rgb(${pHex(result[1])} ${pHex(result[2])} ${pHex(result[3])} / 60%)` : null;
	}
	return hexToRGB(percentToHEX(hpPercentage));
}

function setTokenAuras (token, options) {
	if (!options.aura1) return;

	const innerAuraSize = options.aura1.feet.length > 0 ? (options.aura1.feet / 5) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	const outerAuraSize = options.aura2.feet.length > 0 ? (options.aura2.feet / 5) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	if ((innerAuraSize > 0 || outerAuraSize > 0) && options.auraVisible) {
		// use sizeWidth and sizeHeight???
		const totalAura = innerAuraSize + outerAuraSize;
		const auraRadius = innerAuraSize ? (innerAuraSize + (options.size/window.CURRENT_SCENE_DATA.scale_factor / 2)) : 0;
		const auraBg = `radial-gradient(${options.aura1.color} ${auraRadius}px, ${options.aura2.color} ${auraRadius}px);`;
		const totalSize = parseInt(options.size)/window.CURRENT_SCENE_DATA.scale_factor+ (2 * totalAura);
		const absPosOffset = (options.size/window.CURRENT_SCENE_DATA.scale_factor - totalSize) / 2;
		const auraStyles = `width:${totalSize }px;
							height:${totalSize }px;
							left:${absPosOffset}px;
							top:${absPosOffset}px;
							background-image:${auraBg};
							left:${parseFloat(options.left.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor - ((totalSize - options.size/window.CURRENT_SCENE_DATA.scale_factor) / 2)}px;
							top:${parseFloat(options.top.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor - ((totalSize - options.size/window.CURRENT_SCENE_DATA.scale_factor) / 2)}px;
							`;
		const tokenId = token.attr("data-id").replaceAll("/", "");
		if (token.parent().parent().find("#aura_" + tokenId).length > 0) {
			token.parent().parent().find("#aura_" + tokenId).attr("style", auraStyles);	
		} else {
			const auraElement = $(`<div class='aura-element' id="aura_${tokenId}" data-id='${token.attr("data-id")}' style='${auraStyles}' />`);
			auraElement.contextmenu(function(){return false;});
			$("#scene_map_container").prepend(auraElement);
		}
		if(window.DM){
			options.hidden ? token.parent().parent().find("#aura_" + tokenId).css("opacity", 0.5)
			: token.parent().parent().find("#aura_" + tokenId).css("opacity", 1)
		}
		else{
			options.hidden && !options.auraislight ? token.parent().parent().find("#aura_" + tokenId).hide()
						: token.parent().parent().find("#aura_" + tokenId).show()
		}
		if(options.auraislight){		
			token.parent().parent().find("#aura_" + tokenId).toggleClass("islight", true);
		}
		else{
			token.parent().parent().find("#aura_" + tokenId).toggleClass("islight", false);
		}

		
	} else {
		const tokenId = token.attr("data-id").replaceAll("/", "");
		token.parent().parent().find("#aura_" + tokenId).remove();
	}
	if(!window.DM){
		let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
		if(playerTokenId != undefined){
			if(window.TOKEN_OBJECTS[playerTokenId].options.auraowned){
				let auras = $("[id^='aura_']");
				for(let i = 0; i < auras.length; i++){
					if(!auras[i].id.endsWith(window.PLAYER_ID) && !window.TOKEN_OBJECTS[$(auras[i]).attr("data-id")].options.player_owned){
						$(auras[i]).css("visibility", "hidden");
					}
				}
			}
			else{
				let auras = $("[id^='aura_']");
				for(let i = 0; i < auras.length; i++){
						$(auras[i]).css("visibility", "visible");	
				}
			}
		}
	}
}


function setTokenBase(token, options) {
	$(`.token[data-id='${options.id}']>.base`).remove();
	let base = $(`<div class='base'></div>`);
	if(options.size < 150){
		$(base).toggleClass("large-or-smaller-base", true);
	}
	else{
		$(base).toggleClass("large-or-smaller-base", false);
	}

	if (options.tokenStyleSelect === "virtualMiniCircle") {
		base.toggleClass('square', false);
		base.toggleClass('circle', true);
	}
	if (options.tokenStyleSelect === "virtualMiniSquare"){
		base.toggleClass('square', true);
		base.toggleClass('circle', false);
	}
	if (options.tokenStyleSelect !== "noConstraint") {
		token.children("img").toggleClass("freeform", false);
		token.toggleClass("freeform", false);
	}

	if (options.tokenStyleSelect === "circle") {
		//Circle
		options.square = false;
		options.legacyaspectratio = true;
		token.children("img").css("border-radius", "50%")
		token.children("img").removeClass("preserve-aspect-ratio");
		token.toggleClass("square", false);
	}
	else if(options.tokenStyleSelect === "square"){
		//Square
		options.square = true;
		options.legacyaspectratio = true;
		token.children("img").css("border-radius", "0");
		token.children("img").removeClass("preserve-aspect-ratio");
		token.toggleClass("square", true);
	}
	else if(options.tokenStyleSelect === "noConstraint" || options.tokenStyleSelect === "definitelyNotAToken") {
		//Freeform
		options.square = true;
		options.legacyaspectratio = false;
		if(options.tokenStyleSelect === "definitelyNotAToken"){
			options.restrictPlayerMove = true;
			options.disablestat = true;
			options.disableborder = true;
			options.disableaura = true;
			options.enablepercenthpbar = false;
		}

		token.children("img").css("border-radius", "0");
		token.children("img").addClass("preserve-aspect-ratio");
		token.children("img").toggleClass("freeform", true);
		token.toggleClass("freeform", true);
	}
	else if(options.tokenStyleSelect === "virtualMiniCircle"){
		$(`.token[data-id='${options.id}']`).prepend(base);
		//Virtual Mini Circle
		options.square = true;
		options.legacyaspectratio = false;
		token.children("img").css("border-radius", "0");
		token.children("img").addClass("preserve-aspect-ratio");
	}
	else if(options.tokenStyleSelect === "virtualMiniSquare"){
		$(`.token[data-id='${options.id}']`).prepend(base);
		//Virtual Mini Square
		options.square = true;
		options.legacyaspectratio = false;
		token.children("img").css("border-radius", "0");
		token.children("img").addClass("preserve-aspect-ratio");
	}

	if(options.tokenStyleSelect === "virtualMiniCircle" || options.tokenStyleSelect === "virtualMiniSquare"){
		if(options.disableborder == true){
			token.children(".base").toggleClass("noborder", true);
		}
		else{
			token.children(".base").toggleClass("noborder", false);
		}

		if(options.disableaura == true){
			token.children(".base").toggleClass("nohpaura", true);
		}
		else{
			token.children(".base").toggleClass("nohpaura", false);
		}
		token.toggleClass("hasbase", true);
	}
	else{
		token.toggleClass("hasbase", false);
	}


	token.children(".base").toggleClass("border-color-base", false);
	token.children(".base").toggleClass("grass-base", false);
	token.children(".base").toggleClass("rock-base", false);
	token.children(".base").toggleClass("tile-base", false);
	token.children(".base").toggleClass("sand-base", false);
	token.children(".base").toggleClass("water-base", false);


	if(options.tokenBaseStyleSelect === "border-color"){
		token.children(".base").toggleClass("border-color-base", true);
	}
	else if(options.tokenBaseStyleSelect === "grass"){
		token.children(".base").toggleClass("grass-base", true);
	}
	else if(options.tokenBaseStyleSelect === "tile"){
		token.children(".base").toggleClass("tile-base", true);
	}
	else if(options.tokenBaseStyleSelect === "sand"){
		token.children(".base").toggleClass("sand-base", true);
	}
	else if(options.tokenBaseStyleSelect === "rock"){
		token.children(".base").toggleClass("rock-base", true);
	}
	else if(options.tokenBaseStyleSelect === "water"){
		token.children(".base").toggleClass("water-base", true);
	}

}

function get_custom_monster_images(monsterId) {
	return find_token_customization(ItemType.Monster, monsterId)?.tokenOptions?.alternativeImages || [];
}

function add_custom_monster_image_mapping(monsterId, imgsrc) {
	let customization = find_or_create_token_customization(ItemType.Monster, monsterId, RootFolder.Monsters.id, RootFolder.Monsters.id);
	customization.addAlternativeImage(imgsrc);
	persist_token_customization(customization);
}

function remove_custom_monster_image(monsterId, imgsrc) {
	let customization = find_or_create_token_customization(ItemType.Monster, monsterId, RootFolder.Monsters.id, RootFolder.Monsters.id);
	customization.removeAlternativeImage(imgsrc);
	persist_token_customization(customization);
}

function remove_all_custom_monster_images(monsterId) {
	let customization = find_or_create_token_customization(ItemType.Monster, monsterId, RootFolder.Monsters.id, RootFolder.Monsters.id);
	customization.removeAllAlternativeImages();
	persist_token_customization(customization);
}

// deprecated, but still required for migrations
function load_custom_monster_image_mapping() {
	window.CUSTOM_TOKEN_IMAGE_MAP = {};
	let customMappingData = localStorage.getItem('CustomDefaultTokenMapping');
	if(customMappingData != null) {
		window.CUSTOM_TOKEN_IMAGE_MAP = $.parseJSON(customMappingData);
	}
}

// deprecated, but still required for migrations
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
}

const radToDeg = 180 / Math.PI;

/// Returns result in degrees
function rotation_towards_cursor(token, mousex, mousey, largerSnapAngle) {
	const tokenCenterX = parseFloat(token.options.left) + (token.sizeWidth() / 2);
	const tokenCenterY = parseFloat(token.options.top) + (token.sizeHeight() / 2);
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

// if it was not executed in the last second, execute it immediately
// if it's already scheduled to be executed, return
// otherwise, schedule it to execute in 300ms
function draw_selected_token_bounding_box(){
	if(window.NEXT_DRAWBOX  && (window.NEXT_DRAWBOX -Date.now() > 0)){
		return;
	}
	else if(!window.NEXT_DRAWBOX  || (window.NEXT_DRAWBOX -Date.now() <  -1000)){
		window.NEXT_DRAWBOX=Date.now();
		do_draw_selected_token_bounding_box();
		return;
	}
	else {
		window.NEXT_DRAWBOX=Date.now()+300;
		setTimeout(do_draw_selected_token_bounding_box,300);
		return;
	}
}


/// draws a rectangle around every selected token, and adds a rotation grabber
function do_draw_selected_token_bounding_box() {
	console.log("do_draw_selected_token_bounding_box");
	remove_selected_token_bounding_box()
	// hold a separate list of selected ids so we don't have to iterate all tokens during bulk token operations like rotation
	window.CURRENTLY_SELECTED_TOKENS = [];
	for (id in window.TOKEN_OBJECTS) {
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
		let tokenImageClientPosition = $(`div.token[data-id='${id}']>.token-image`)[0].getBoundingClientRect();
		let tokenImagePosition = $(`div.token[data-id='${id}']>.token-image`).position();
		let tokenImageWidth = (tokenImageClientPosition.width) / (window.ZOOM);
		let tokenImageHeight = (tokenImageClientPosition.height) / (window.ZOOM);
		let tokenTop = ($(`div.token[data-id='${id}']`).position().top + tokenImagePosition.top) / (window.ZOOM);
		let tokenBottom = tokenTop + tokenImageHeight;
		let tokenLeft = ($(`div.token[data-id='${id}']`).position().left  + tokenImagePosition.left) / (window.ZOOM);
		let tokenRight = tokenLeft + tokenImageWidth;
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
	top = (top - borderOffset);
	left = (left - borderOffset);
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
	holder.css('z-index', 100000);
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
	grabber.css('z-index', 100000); // make sure the grabber is above all the tokens
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
		let token = window.all_token_objects[id];
		if (token == undefined || token.isPlayer()) continue; // only allow copy/paste for monster tokens, and protect against pasting deleted tokens
		let options = $.extend(true, {}, token.options);
		let newId = uuid();
		options.id = newId;
		// TODO: figure out the location under the cursor and paste there instead of doing center of view
		options.init = undefined;
		options.ct_show = undefined;
		options.selected = true;
		let center = center_of_view() 
		let mapView = convert_point_from_view_to_map(center.x, center.y, false);
		options.top = `${mapView.y - Math.round(token.sizeHeight() / 2)}px`;
		options.left = `${mapView.x - Math.round(token.sizeWidth() / 2) + token.sizeWidth()  * i + 5 - (token.sizeWidth() * ((window.TOKEN_PASTE_BUFFER.length/2)-1))}px`;
		window.ScenesHandler.create_update_token(options);
		// deselect the old and select the new so the user can easily move the new tokens around after pasting them
		if(typeof window.TOKEN_OBJECTS[id] !== "undefined"){
			window.TOKEN_OBJECTS[id].selected = false;
			window.TOKEN_OBJECTS[id].place_sync_persist();
		}
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
				tokensToDelete.push(token);
			}
		}
	}

	if (tokensToDelete.length == 0) return;
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
	tokensToDelete.forEach(t => window.TOKEN_OBJECTS_RECENTLY_DELETED[t.options.id] = Object.assign({}, t.options));
	console.log("delete_selected_tokens", window.TOKEN_OBJECTS_RECENTLY_DELETED);

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
	console.log("undo_delete_tokens", window.TOKEN_OBJECTS_RECENTLY_DELETED);
	if (!window.DM) return;
	for (id in window.TOKEN_OBJECTS_RECENTLY_DELETED) {
		let options = window.TOKEN_OBJECTS_RECENTLY_DELETED[id];
		window.ScenesHandler.create_update_token(options);
	}
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
}
