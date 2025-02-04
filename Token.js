const STANDARD_CONDITIONS = ["Blinded", "Charmed", "Deafened", "Exhaustion", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];

const CUSTOM_CONDITIONS = ["Concentration(Reminder)", 'Reaction Used',"Flying", "Burning", "Rage", "Blessed", "Baned",
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


const TOKEN_COLORS = ["1A6AFF", "FF7433", "FFD433", "884DFF", "5F0404", "EC8AFF", "00E5FF",
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
	"locked", 
	"restrictPlayerMove",
	"revealname",
	"revealInFog",
	"lockRestrictDrop",
	"underDarkness"
];



const throttleLight = throttle(() => {requestAnimationFrame(redraw_light)}, 1000/8);
const throttleTokenCheck = throttle(() => {requestAnimationFrame(do_check_token_visibility)}, 1000/4);
const debounceStoreExplored = mydebounce((exploredCanvas) => {		
	let dataURI = exploredCanvas.toDataURL('image/jpg')

	let storeImage = gameIndexedDb.transaction([`exploredData`], "readwrite")
	let objectStore = storeImage.objectStore(`exploredData`)
	let deleteRequest = objectStore.delete(`explore${window.gameId}${window.CURRENT_SCENE_DATA.id}`);
	deleteRequest.onsuccess = (event) => {
	  const objectStoreRequest = objectStore.add({exploredId: `explore${window.gameId}${window.CURRENT_SCENE_DATA.id}`, 'exploredData': dataURI});
	};
	deleteRequest.onerror = (event) => {
	  const objectStoreRequest = objectStore.add({exploredId: `explore${window.gameId}${window.CURRENT_SCENE_DATA.id}`, 'exploredData': dataURI});
	};
}, 5000)
let debounceLightChecks = mydebounce(() => {		
		if(window.DRAGGING)
			return;
		if(window.walls?.length < 5){
			redraw_light_walls();	
		}
		//let promise = [new Promise (_ => setTimeout(redraw_light(), 1000))];
		requestAnimationFrame(redraw_light);
		debounceAudioChecks();
		
}, 20);

let debounceAudioChecks = mydebounce(() => {
	checkAudioVolume();
}, 20)

let longDebounceLightChecks = mydebounce(() => {		
		if(window.DRAGGING)
			return;
		if(window.walls?.length < 5){
			redraw_light_walls();	
		}
		//let promise = [new Promise (_ => setTimeout(redraw_light(), 1000))];
		requestAnimationFrame(redraw_light);
		debounceAudioChecks();
}, 300);


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

	/** @return {number} the total of this token's HP and temp HP */
	get hp() {
		return this.baseHp + this.tempHp;
	}
	set hp(newValue) {
		this.baseHp = newValue;
	}

	/** @return {number} the percentage of this token's base HP divided by it's max hp */
	get hpPercentage() {
		// If we choose to include tempHp in this calculation, we need to make sure functions like token_health_aura can handle percentages that are greater than 100%
		return Math.round((this.baseHp / this.maxHp) * 100)
	}

	/** @return {number} the value of this token's HP without adding temp HP */
	get baseHp() {
		if (!isNaN(this.options.hitPointInfo?.current)) {
			return parseInt(this.options.hitPointInfo.current);
		} else if (!isNaN((this.options.hp))) {
			return parseInt(this.options.hp);
		}
		return 0;
	}
	set baseHp(newValue) {
		let currentHP = this.options.hitPointInfo ? this.options.hitPointInfo.current : this.options.hp
		if (this.options.hitPointInfo) {
			this.options.hitPointInfo.current = newValue;
		} else {
			this.options.hitPointInfo = {
				maximum: this.maxHp,
				current: newValue,
				temp: this.tempHp
			};
		}
		if(window.DM && currentHP > newValue && this.hasCondition("Concentration(Reminder)")){
			// CONCENTRATION REMINDER
			let msgdata = {
				player: this.options.name,
				img: parse_img(this.options.imgsrc),
				text: `<b>Check for concentration! If damage was from a single source DC ${Math.floor((this.options.hp - newValue)/2) > 10 ? Math.floor((this.options.hp - newValue)/2) : 10}</b>`,
			};
			window.MB.inject_chat(msgdata);
		}
		this.options.hp = newValue; // backwards compatibility
	}
	check_concentration(newValue){
		
	}

	/** @return {number} the value of this token's temp HP */
	get tempHp() {
		if (!isNaN(this.options.hitPointInfo?.temp)) {
			return parseInt(this.options.hitPointInfo.temp);
		} else if (!isNaN(this.options.temp_hp)) {
			return parseInt(this.options.temp_hp);
		}
		return 0;
	}
	set tempHp(newValue) {
		if (this.options.hitPointInfo) {
			this.options.hitPointInfo.temp = newValue;
		} else {
			this.options.hitPointInfo = {
				maximum: this.maxHp,
				current: this.baseHp,
				temp: newValue
			};
		}
		this.options.temp_hp = newValue; // backwards compatibility
	}

	/** @return {number} the percentage of this token's temp HP divided by it's max hp */
	get tempHpPercentage() {
		return Math.round((this.tempHp / this.maxHp) * 100);
	}

	/** @return {number} the value of this token's max HP */
	get maxHp() {
		if (!isNaN(this.options.hitPointInfo?.maximum)) {
			return parseInt(this.options.hitPointInfo.maximum);
		} else if (!isNaN((this.options.max_hp))) {
			return parseInt(this.options.max_hp);
		}
		return 0;
	}
	set maxHp(newValue) {
		if (this.options.hitPointInfo) {
			this.options.hitPointInfo.maximum = newValue;
		} else {
			this.options.hitPointInfo = {
				maximum: newValue,
				current: this.baseHp,
				temp: this.tempHp
			};
		}
		this.options.max_hp = newValue; // backwards compatibility
	}

	/** @return {number} the value of this token's AC */
	get ac() {
		if (!isNaN(this.options.armorClass)) {
			return parseInt(this.options.armorClass);
		} else if (!isNaN(this.options.ac)) {
			return parseInt(this.options.ac);
		}
		return 0;
	}
	set ac(newValue) {
		this.options.armorClass = newValue;
		this.options.ac = newValue; // backwards compatibility
	}

	/** @return {string[]} the names of the conditions currently active on the token */
	get conditions() {
		return this.options.conditions.map(c => {
			if (typeof c === "string") {
				return c;
			} else if (c.constructor === Object) {
				if (c.level) {
					return c.level > 0 ? `${c.name} (Level ${c.level})` : undefined; // only return levels greater than 0. This is probably only Exhaustion
				}
				return c.name;
			}
		}).filter(c => c); // remove undefined and empty strings
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
		$('.token[data-clone-id^="dragging-"]').remove();
		debounceLightChecks();
	}

	isLineAoe() {
		// 1 being a single square which is usually 5ft
		return (this.options.size === "" || this.options.size === 0) && this.options.gridWidth === 1 && this.options.gridHeight > 0
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
				let tokenMultiplierAdjustment = (!window.CURRENT_SCENE_DATA.scaleAdjustment) ? 1 : (window.CURRENT_SCENE_DATA.scaleAdjustment.x > window.CURRENT_SCENE_DATA.scaleAdjustment.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : window.CURRENT_SCENE_DATA.scaleAdjustment.y;
		
				const calculatedFromSize = (parseFloat(this.options.size) / (parseFloat(window.CURRENT_SCENE_DATA.hpps) * tokenMultiplierAdjustment));
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
				let tokenMultiplierAdjustment = (!window.CURRENT_SCENE_DATA.scaleAdjustment) ? 1 : (window.CURRENT_SCENE_DATA.scaleAdjustment.x > window.CURRENT_SCENE_DATA.scaleAdjustment.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : window.CURRENT_SCENE_DATA.scaleAdjustment.y;
		
				const calculatedFromSize = (parseFloat(this.options.size) / (parseFloat(window.CURRENT_SCENE_DATA.vpps)*tokenMultiplierAdjustment));
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
		return this.conditions.includes(conditionName) || this.options.custom_conditions.some(e => e.name === conditionName);
	}
	conditionDuration(conditionName) {
		let c = this.options.conditions.find(c => c.name == conditionName) || this.options.custom_conditions.find(c => c.name == conditionName);
		return c?.duration;
	}
	addCondition(conditionName, text='') {
	    if (this.hasCondition(conditionName)) {
	        // already did
	        return;
	    }
	    if (STANDARD_CONDITIONS.includes(conditionName)) {
	        if (this.isPlayer()) {	        
				if(this.isCurrentPlayer()){
					$('.ct-combat__statuses-group--conditions .ct-combat__summary-label:contains("Conditions"), .ct-combat-tablet__cta-button:contains("Conditions"), .ct-combat-mobile__cta-button:contains("Conditions")').click();
					$('.ct-condition-manage-pane').css('visibility', 'hidden');
					$(`.ct-sidebar__inner .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>[class*='styles_toggle'][aria-pressed="false"]`).click();
					this.options.conditions.push({ name: conditionName });

					setTimeout(function(){
						$(`#switch_gamelog`).click();
					}, 10)

				}
				else{
				   window.MB.inject_chat({
		                player: window.PLAYER_NAME,
		                img: window.PLAYER_IMG,
		                text: `<span class="flex-wrap-center-chat-message">${window.PLAYER_NAME} would like you to set<span style="margin-left: 3px; display: inline-block; font-weight: 700;">${conditionName}</span>.<br/><br/><button class="set-conditions-button">Toggle ${conditionName} ON</button></div>`,
		                whisper: this.options.name
		            });	
				}        
	        } else {
	            this.options.conditions.push({ name: conditionName });
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
				if(this.isCurrentPlayer()){
					$('.ct-combat__statuses-group--conditions .ct-combat__summary-label:contains("Conditions"), .ct-combat-tablet__cta-button:contains("Conditions"), .ct-combat-mobile__cta-button:contains("Conditions")').click();
					$('.ct-condition-manage-pane').css('visibility', 'hidden');
					$(`.ct-sidebar__inner .ct-condition-manage-pane__condition-name:contains('${conditionName}') ~ .ct-condition-manage-pane__condition-toggle>[class*='styles_toggle'][aria-pressed="true"]`).click();
					this.options.conditions = this.options.conditions.filter(c => {
						if (typeof c === "string") {
							return c !== conditionName;
						} else {
							return c?.name !== conditionName;
						}
					});
					setTimeout(function(){
						$(`#switch_gamelog`).click();
					}, 10)		
				}
				else{

					window.MB.inject_chat({
						player: window.PLAYER_NAME,
						img: window.PLAYER_IMG,
						text: `<span class="flex-wrap-center-chat-message">${window.PLAYER_NAME} would like you to remove <span style="margin-left: 3px; display: inline-block; font-weight: 700;">${conditionName}</span>.<br/><br/><button class="remove-conditions-button">Toggle ${conditionName} OFF</button></div>`,
						whisper: this.options.name
					});
				}
			} else {
				this.options.conditions = this.options.conditions.filter(c => {
					if (typeof c === "string") {
						return c !== conditionName;
					} else {
						return c?.name !== conditionName;
					}
				});
			}
		} else {
			array_remove_index_by_value(this.options.custom_conditions, conditionName);
		}
	}
	isInCombatTracker() {
		return ct_list_tokens().includes(this.options.id);
	}

	size(newSize) {
		this.MAX_TOKEN_SIZE = Math.max(window.CURRENT_SCENE_DATA.width*window.CURRENT_SCENE_DATA.scale_factor, window.CURRENT_SCENE_DATA.height*window.CURRENT_SCENE_DATA.scale_factor);

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
		debounceCombatPersist();
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
		debounceCombatPersist();
	}
	delete(persist=true) {
		if (!window.DM && this.options.deleteableByPlayers != true) {
			// only allow the DM to delete tokens unless the token specifies deleteableByPlayers == true which is used by AoE tokens and maybe others
			return;
		}
		ct_remove_token(this, false);
		let id = this.options.id;
		let selector = "#tokens div[data-id='" + id + "']";
		$(selector).remove();
	

		delete window.CURRENT_SCENE_DATA.tokens[id];
		delete window.TOKEN_OBJECTS[id];
		if(!is_player_id(this.options.id)){
			delete window.all_token_objects[id];
			if (id in window.JOURNAL.notes) {
				delete window.JOURNAL.notes[id];
				window.JOURNAL.persist();
			}
		}


		
		$("#aura_" + id.replaceAll("/", "")).remove();
		$(`.aura-element-container-clip[id='${id}']`).remove()
		$(`[data-darkness='darkness_${id}']`).remove();
		$(`[data-notatoken='notatoken_${id}']`).remove()
		if (persist == true) {	
			window.MB.sendMessage("custom/myVTT/delete_token",{id:id});
		}
		if(this.options?.audioChannel?.audioId != undefined){
			window.MIXER.deleteChannel(this.options.audioChannel.audioId)
		}
		if(this.options.combatGroupToken){
			for(let i in window.TOKEN_OBJECTS){
				if(i == this.options.combatGroupToken)
					continue;

				
				if(window.TOKEN_OBJECTS[i].options.combatGroup == this.options.combatGroupToken){
					delete window.TOKEN_OBJECTS[i].options.combatGroup;
					delete window.TOKEN_OBJECTS[i].options.ct_show;
					if(window.all_token_objects[i] != undefined){
						delete window.all_token_objects[i].options.combatGroup;
						delete window.all_token_objects[i].options.ct_show;
					}
					ct_remove_token(window.TOKEN_OBJECTS[i]);
					window.TOKEN_OBJECTS[i].update_and_sync();
				}
			}
		}
		if(this.options.combatGroup && !this.options.combatGroupToken){
			let count = 0;
			for(let i in window.TOKEN_OBJECTS){
				if(window.TOKEN_OBJECTS[i].options.combatGroup == this.options.combatGroup){
					count++;
				}
			}
			if(count == 1){
				window.TOKEN_OBJECTS[this.options.combatGroup].delete();
			}
		}
		debounceLightChecks();
		update_pc_token_rows();
	}
	rotate(newRotation) {
		if (!window.DM && (this.options.restrictPlayerMove || this.options.locked) && !this.isCurrentPlayer()) return; // don't allow rotating if the token is locked
		if (window.DM && this.options.locked && !$('#select_locked .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) return; // don't allow rotating if the token is locked
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
		let imageScale = (this.options.imageSize != undefined) ? this.options.imageSize : 1;

		let selector = "div[data-id='" + this.options.id + "']";
		let tokenElement = $("#tokens").find(selector).add(`[data-notatoken='notatoken_${this.options.id}']`);
		tokenElement.css("--token-rotation", newRotation + "deg");
		tokenElement.css("--token-scale", imageScale);
		tokenElement.find(".token-image").css("transform", `scale(var(--token-scale)) rotate(var(--token-rotation))`);
		$(`.aura-element-container-clip[id='${this.options.id}'] .aura-element, .aura-element[data-id='${this.options.id}']`).css('--rotation', newRotation + "deg");
	}
	moveUp() {	
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();	
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) - addvpps/2-5}px`;
		this.move(newTop, parseFloat(this.options.left)+5)	
	}
	moveDown() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) + addvpps+5}px`;
		this.move(newTop, parseFloat(this.options.left)+5)	
	}
	moveLeft() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) - addhpps/2-5}px`;
		this.move(parseFloat(this.options.top)+5, newLeft)	
	}
	moveRight() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) + addhpps+5}px`;
		this.move(parseFloat(this.options.top)+5, newLeft)	
	}
	moveUpRight() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) + addhpps+5}px`;
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) - addvpps/2-5}px`;
		this.move(newTop, newLeft)		
	}
	moveDownRight() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) + addhpps+5}px`;
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) + addvpps+5}px`;
		this.move(newTop, newLeft)		
	}
	moveUpLeft() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) - addhpps/2-5}px`;
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) - addvpps/2-5}px`;
		this.move(newTop, newLeft)	
	}
	moveDownLeft() {
		let tinyToken = (Math.round(parseFloat(this.options.gridSquares)*2)/2 < 1) || this.isAoe();		
		let addhpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.width * window.CURRENT_SCENE_DATA.scaleAdjustment.x : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		let newLeft = `${parseFloat(this.options.left) - addhpps/2-5}px`;
		let addvpps = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? window.hexGridSize.height * window.CURRENT_SCENE_DATA.scaleAdjustment.y : (!tinyToken || window.CURRENTLY_SELECTED_TOKENS.length > 1) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
		let newTop = `${parseFloat(this.options.top) + addvpps+5}px`;
		this.move(newTop, newLeft)	
	}

	/**
	 * Move token to new position.
	 * @param {String|Number} top position from the top
	 * @param {String|Number} left position from the left
	 * @returns void
	 */
	move(top, left) {
		if (!window.DM && (this.options.restrictPlayerMove || this.options.locked) && !this.isCurrentPlayer()) return; // don't allow rotating if the token is locked
		if (window.DM && this.options.locked && !$('#select_locked .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) return; // don't allow rotating if the token is locked
		
		// Save handle params
		top = parseFloat(top);
		left = parseFloat(left);
		
		this.prepareWalkableArea()
		
		let tinyToken = (Math.round(this.options.gridSquares*2)/2 < 1) || this.isAoe();
		let tokenPosition = snap_point_to_grid(left, top, true, tinyToken)

		// Stop movement if new position is outside of the scene
		if (
			top  < this.walkableArea.top - this.options.size    || 
			top  > this.walkableArea.bottom + this.options.size ||
			left < this.walkableArea.left - this.options.size || 
			left > this.walkableArea.right + this.options.size 
		) { return; }
		let halfWidth = parseFloat(this.options.size)/2;
		let inLos = this.isAoe() ? true : detectInLos(tokenPosition.x + halfWidth, tokenPosition.y + halfWidth) ;


		if(window.CURRENT_SCENE_DATA.disableSceneVision == 1 || !this.options.auraislight || inLos){

			this.options.top = tokenPosition.y + 'px';
			this.options.left = tokenPosition.x + 'px';
			const selector = "div[data-id='" + this.options.id + "']";
			const old = $("#tokens").find(selector);

			if (old.css("left") != this.options.left || old.css("top") != this.options.top)
				remove_selected_token_bounding_box();

			old.animate({left: this.options.left,top: this.options.top,}, { duration: 0, queue: true, 
				complete: async function() {
					$('.token[data-clone-id^="dragging-"]').remove();
				}
			});
			if(!this.options.id.includes('exampleToken') && !this.options.combatGroupToken){
				setTokenAuras(old, this.options);
				setTokenLight(old, this.options);
				setTokenBase(old, this.options);
			}
			setTokenBase($(`[data-notatoken='notatoken_${this.options.id}']`), this.options);
			let tokenBorderWidth = (this.options.underDarkness == true) ? (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2 / window.CURRENT_SCENE_DATA.scale_factor)+"px" : (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2)+"px";	
			if(this.options.darkness){
				let copyImage = $(`[data-darkness='darkness_${this.options.id}']`);
				copyImage.css({
					left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
					top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
					'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
					'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
					width: `var(--token-width)`,
					height: `var(--token-height)`,
					'max-width': `var(--token-width)`,
					'max-height': `var(--token-height)`,
					'--z-index-diff': old.css('--z-index-diff'),
					'--token-scale': old.css('--token-scale'),
    				'--token-rotation': old.css('--token-rotation')
				})
			}
			if(this.options.tokenStyleSelect == 'definitelyNotAToken' || this.options.underDarkness == true){
				old.toggleClass('underDarkness', true);
				if($(`[data-notatoken='notatoken_${this.options.id}']`).length == 0){
					let tokenClone = old.clone();
					tokenClone.css({
						left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
						top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
						'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
						'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
						width: `var(--token-width)`,
						height: `var(--token-height)`,
						'max-width': `var(--token-width)`,
						'max-height': `var(--token-height)`,
						'--z-index-diff': old.css('--z-index-diff'),
						'opacity': this.options.hidden ? '0.5' : '1',
						'--hp-percentage': `${this.hpPercentage}%`,
						"--token-border-width": tokenBorderWidth,
						'border-width': old.find('.token-image').css('border-width'),
	    				"--offsetX": old.css('--offsetX'),
	    				"--offsetY": old.css('--offsetY'),
						"--image-opacity": old.css('--image-opacity'),
						"--view-box": old.css('--view-box'),
						"--image-zoom": old.css('--image-zoom')
					})
			        tokenClone.attr('data-notatoken', `notatoken_${this.options.id}`);
			        tokenClone.children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove();    
			        tokenClone.toggleClass('lockedToken', this.options.locked==true)
					tokenClone.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
					tokenClone.attr('data-name', old.attr('data-name'));
					tokenClone.toggleClass('hasTooltip', $(old).hasClass('hasTooltip'));
			        $('#token_map_items').append(tokenClone);
				}
				else{
					let copyToken = $(`[data-notatoken='notatoken_${this.options.id}']`);
					copyToken.css({
						left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
						top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
						'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
						'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
						width: `var(--token-width)`,
						height: `var(--token-height)`,
						'max-width': `var(--token-width)`,
						'max-height': `var(--token-height)`,
						'--z-index-diff': old.css('--z-index-diff'),
						'--token-scale': old.css('--token-scale'),
	    				'--token-rotation': old.css('--token-rotation'),
						'opacity': this.options.hidden ? '0.5' : '1',
						'--hp-percentage': `${this.hpPercentage}%`,
						"--token-border-width": tokenBorderWidth,
						'border-width': old.find('.token-image').css('border-width'),
	    				"--offsetX": old.css('--offsetX'),
	    				"--offsetY": old.css('--offsetY'),
						"--image-opacity": old.css('--image-opacity'),
						"--view-box": old.css('--view-box'),
						"--image-zoom": old.css('--image-zoom')
					})
					copyToken.children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove()
					copyToken.toggleClass('lockedToken', this.options.locked==true)
					copyToken.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
					copyToken.attr('data-name', old.attr('data-name'));
					copyToken.toggleClass('hasTooltip', $(old).hasClass('hasTooltip'));
				}

				let copyImage = $(`[data-notatoken='notatoken_${this.options.id}']`).find('.token-image')
				let oldImage = old.find('.token-image');

				if(copyImage.attr('src') != parse_img(this.options.imgsrc)){
					copyImage.attr("src", parse_img(this.options.imgsrc));
				}
			}

			if(window.EXPERIMENTAL_SETTINGS.dragLight == true)
				throttleLight();
			else
				longDebounceLightChecks();
		
			this.sync();
		}
	}

	snap_to_closest_square() {
		if ((!window.DM && this.options.restrictPlayerMove && !this.isCurrentPlayer()) || this.options.locked) return; // don't allow moving if the token is locked
		if (window.DM && this.options.locked) return; // don't allow moving if the token is locked
		// shamelessly copied from the draggable code later in this file
		// this should be a XOR... (A AND !B) OR (!A AND B)
		let shallwesnap = (window.CURRENT_SCENE_DATA.snap == "1"  && !(window.toggleSnap)) || ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);		
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
	}

	highlight(dontscroll=false) {
		let self = this;
		if (self.doing_highlight)
			return;

		self.doing_highlight = true;
		let selector = "div[data-id='" + this.options.id + "']";
		let old = $(`#tokens ${selector}, #token_map_items ${selector}`);


		let old_op = old.css('opacity');
		if (old.is(":visible") || window.DM) {
			let pageX = Math.round(parseInt(this.options.left) * window.ZOOM - ($(window).width() / 2));
			let pageY = Math.round(parseInt(this.options.top) * window.ZOOM - ($(window).height() / 2));
			console.log(this.options.left + " " + this.options.top + "->" + pageX + " " + pageY);
			
			if(!dontscroll){
				if($("#hide_rightpanel").hasClass("point-right")) {
   					pageX += 190; // 190 = half gamelog + scrollbar
   				}
				$("html,body").animate({
					scrollTop: pageY + window.VTTMargin,
					scrollLeft: pageX + window.VTTMargin
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
		let n = $("<div/>");
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
		if(this.maxHp > 0) {
			// add a cross if it doesn't exist

			if(token.find(".dead").length === 0) 
				token.prepend(`<div class="dead" hidden></div>`);
			// update cross scale
			const deadCross = token.find('.dead')
			if(token.hasClass('underDarkness')){
				deadCross.hide();
				const underdarknessToken = $(`[data-notatoken][data-id='${token.attr('data-id')}']`);
				const underdarknessDeadCross = underdarknessToken.find('.dead')
				underdarknessDeadCross.attr("style", `transform:scale(${this.get_token_scale()});--size: ${parseInt(this.options.size) / window.CURRENT_SCENE_DATA.scale_factor / 10}px;`)
				// check token death
				if (this.hp > 0) {
					underdarknessDeadCross.hide()
				} else {
					underdarknessDeadCross.show()
				}
			}
			else{
				deadCross.attr("style", `transform:scale(${this.get_token_scale()});--size: ${parseInt(this.options.size) / 10}px;`)
				// check token death
				if (this.hp > 0) {
					deadCross.hide()
				} else {
					deadCross.show()
				}
			}
		
		}
	}

	/**
	 * updates the color of the health aura if enabled
	 * @param token jquery selected div with the class "token"
	 */
	update_health_aura(token){
		console.group("update_health_aura")
		// set token data to the player if this token is a player token, otherwise just use this tokens data
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
			} else if(this.options.healthauratype && this.options.healthauratype.startsWith("aura-bloodied-")){
				this.options.disableaura = false;
				this.options.enablepercenthpbar = false;
			}
		}

		if (this.maxHp > 0) {
			token.css('--hp-percentage', `${this.hpPercentage}%`);
			token.css('--temp-hp-percentage', `${this.tempHpPercentage}%`);
			token.css('--total-percentage', `${this.tempHpPercentage + this.hpPercentage}%`)
		}

		const tokenHpAuraColor = token_health_aura(this.hpPercentage, this.options.healthauratype);
		let tokenWidth =  this.sizeWidth();
		let tokenHeight = this.sizeHeight();
		



		if(this.options.disableaura || !this.hp || !this.maxHp) {
			token.css('--token-hp-aura-color', 'transparent');
			token.css('--token-temp-hp', "transparent");
		} 
		else {
			if(this.options.tokenStyleSelect === "circle" || this.options.tokenStyleSelect === "square"){
				tokenWidth = tokenWidth - window.CURRENT_SCENE_DATA.hpps/10;
				tokenHeight = tokenHeight - window.CURRENT_SCENE_DATA.vpps/10;
			}
			token.css('--token-hp-aura-color', tokenHpAuraColor);
			if(this.tempHp) {
				token.css('--token-temp-hp', "#4444ff");
			}
			else {
				token.css('--token-temp-hp', "transparent");
			}
		}
		if(this.options.disableborder) {
			token.css('--token-border-color', 'transparent');
		} 
		else {
			if(this.options.tokenStyleSelect === "circle" || this.options.tokenStyleSelect === "square"){
				tokenWidth = tokenWidth - Math.min(1, window.CURRENT_SCENE_DATA.hpps/40);
				tokenHeight = tokenHeight - Math.min(1, window.CURRENT_SCENE_DATA.vpps/40);
			}
			token.css('--token-border-color', this.options.color);
			$("#combat_area tr[data-target='" + this.options.id + "'] img[class*='Avatar']").css("border-color", this.options.color);
		}
		if(!this.options.enablepercenthpbar){
			token.css('--token-hpbar-display', 'none');
		}
		else {
			if(this.options.tokenStyleSelect === "circle" || this.options.tokenStyleSelect === "square"){
				tokenWidth = tokenWidth - window.CURRENT_SCENE_DATA.hpps/10;
				tokenHeight = tokenHeight - window.CURRENT_SCENE_DATA.vpps/10;
			}
			token.css('--token-hpbar-aura-color', tokenHpAuraColor);
			if(this.tempHp) {
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
						token.children('.token-image').css("--min-width", tokenWidth + 'px');
						token.children('.token-image').css("--min-height", tokenHeight + 'px');
					}
					else if(imageWidth > imageHeight) {
						token.children('.token-image').css("--min-width", tokenWidth + 'px');
						token.children('.token-image').css("min-height", '');
					}
					else {
						token.children('.token-image').css("--min-height", tokenHeight + 'px');
						token.children('.token-image').css("--min-width", '');
					}
									
				}
			}
		}
		else {
			token.children('.token-image').css("--min-width", "");
			token.children('.token-image').css("--min-height", "");
		}
		
		token.children('.token-image').css({		
		    '--max-width': tokenWidth + 'px',
			'--max-height': tokenHeight + 'px',
		});

		let underdarknessToken = $(`[data-notatoken][data-id='${this.options.id}']`)
		underdarknessToken.css({
			'--token-hpbar-display': token.css('--token-hpbar-display'),
			'--token-temp-hpbar': token.css('--token-temp-hpbar'),
			'--token-hpbar-aura-color': token.css('--token-hpbar-aura-color'), 
			'--token-border-color': token.css('--token-border-color'), 
			'--token-hp-aura-color': token.css('--token-hp-aura-color'),
			'--hp-percentage': token.css('--hp-percentage'),
			'--temp-hp-percentage': token.css('--temp-hp-percentage'),
			'--token-temp-hp': token.css('--token-temp-hp'),
		})
		underdarknessToken.children('.token-image').css({
			'--min-width': token.children('.token-image').css("--min-width"),
			'--min-height': token.children('.token-image').css("--min-width"),
			'--max-width': tokenWidth + 'px',
			'--max-height': tokenHeight + 'px',
		})



		
		console.groupEnd()
	}

	update_condition_timers(){
		console.group("update_condition_timers")

		function setDurationBadgeText(token, condition){
			if(condition.duration == undefined)
				return;
			const conditionName = (typeof condition === "string" ? condition : condition?.name) || "";
			const isExhaustion = conditionName.startsWith("Exhaustion");
			const conditionSymbolName = isExhaustion ? 'exhaustion' : conditionName.toLowerCase();
			const durationBadge = $(`.token[data-id='${token.options.id}']  .duration-badge[class*='${conditionSymbolName}']`);
			durationBadge.toggleClass('expired', condition.duration<1)
			durationBadge.find('span').text(condition.duration);
		}

		for(let i in this.options.conditions){
			const condition = this.options.conditions[i]
			setDurationBadgeText(this, condition);
		}	
		for(let i in this.options.custom_conditions){
			const condition = this.options.custom_conditions[i];
			setDurationBadgeText(this, condition);
		}
		console.groupEnd()
	}


	update_age(){
		const age = $(`.token[data-id='${this.options.id}'] div.age`);
		if(this.options.maxAge == undefined || this.options.maxAge === false){
			age.remove();
			return;
		}
		age.find('svg circle').attr('fill', parseInt(this.options.age) > 0   ? '#FFFFFF' : "#ff0000");
		age.find('text').text(this.options.age);
	}

	/**
	 * returns different scales of the token based on options such as aura disabled
	 * @returns scale of token
	 */
	get_token_scale(){
		if (this.maxHp <= 0 || (this.options.disableaura && !this.options.enablepercenthpbar)) {
			return 1;
		}
		return (((this.options.size - 15) * 100) / this.options.size) / 100;
	}

	update_from_page() {
		console.group("update_from_page")
		let selector = "div[data-id='" + this.options.id + "']";
		let old = $("#tokens").find(selector);

		if(old.is(':animated')){	
			this.stopAnimation(); // stop the animation and jump to the end.	
		}

		this.options.left = old.css("left");
		this.options.top = old.css("top");
		this.options.scaleCreated = window.CURRENT_SCENE_DATA.scale_factor;

		
		// one of either
		// is a monster?
		// is the DM
		// not the DM and player controlled
		// AND stats aren't disabled and has hp bar
		if ( ( (!(this.options.monster > 0)) || window.DM || (!window.DM && this.options.player_owned)) && old.has(".hp").length > 0) {
			if (old.find(".hp").val().trim().startsWith("+") || old.find(".hp").val().trim().startsWith("-")) {
				old.find(".hp").val(Math.max(0, this.hp + parseInt(old.find(".hp").val())));
			}
			if (old.find(".max_hp").val().trim().startsWith("+") || old.find(".max_hp").val().trim().startsWith("-")) {
				old.find(".max_hp").val(Math.max(0, this.maxHp + parseInt(old.find(".max_hp").val())));
			}
			this.hp = parseInt(old.find(".hp").val()) - this.tempHp;
			this.maxHp = parseInt(old.find(".max_hp").val());
			
			this.update_dead_cross(old)
			this.update_health_aura(old)
		}

		this.update_condition_timers();
		this.update_age();

		toggle_player_selectable(this, old)
		console.groupEnd()
	}


	update_and_sync(e) {
		self = this;
		self.update_from_page();
		if (self.sync != null)
			self.sync(e);

		/* UPDATE COMBAT TRACKER */
		this.update_combat_tracker()
		/* UPDATE QUICK ROLL MENU */
		this.update_quick_roll()
	}
	update_combat_tracker(){
		/* UPDATE COMBAT TRACKER */
		$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").val(this.hp);
		$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .max_hp").val(this.maxHp);


		if((!window.DM && this.options.hidestat == true && !this.isCurrentPlayer()) || (!this.isPlayer() && !window.DM && !this.options.player_owned)) {
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
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('.Avatar_AvatarPortrait__2dP8u').css('opacity','1.0');
		}
		else {
			console.log("Setting combat tracker opacity to 0.5")
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('.Avatar_AvatarPortrait__2dP8u').css('opacity','0.5');
		}
		//this.options.ct_show = $("#combat_tracker_inside tr[data-target='" + this.options.id + "']").find('input').checked;
		ct_update_popout();
	}
	update_quick_roll(){
		/* UPDATE QUICK ROLL */

		if ($("#qrm_dialog")){
			$("#quick_roll_area tr[data-target='" + this.options.id + "'] td #qrm_hp").val(this.hp);
			$("#quick_roll_area tr[data-target='" + this.options.id + "'] td #qrm_maxhp").val(this.maxHp);
			
			if($("#quick_roll_area tr[data-target='" + this.options.id + "'] .qrm_hp").val() === '0'){
				$("#quick_roll_area tr[data-target='" + this.options.id + "']").toggleClass("ct_dead", true);
			}
			else{
				$("#quick_roll_area tr[data-target='" + this.options.id + "']").toggleClass("ct_dead", false);
			}
		}	
		qrm_update_popout();
	}

	build_hp() {
		let self = this;
		let bar_height = this.sizeHeight() * 0.2;


		bar_height = Math.ceil(bar_height);
		let hpbar = $("<div class='hpbar'/>");
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
		

		let fs = Math.floor(bar_height / 1.2) + "px";

		hpbar.css("--font-size",fs);

		let input_width = Math.floor(this.sizeWidth() * 0.3);

		let hp_input = $("<input class='hp'>").css('width', input_width)
		hp_input.val(this.hp);

		let maxhp_input = $("<input class='max_hp'>").css('width', input_width);
		maxhp_input.val(this.maxHp);

		if (this.options.disableaura){
			console.log("building hp bar", this.options)
			this.tempHp && this.tempHp > 0 ?
				hpbar.css('background', '#77a2ff')
				: hpbar.css('background', '');
		}

		let divider = $("<div>/</>");


		hpbar.append(hp_input);
		hpbar.append(divider);
		hpbar.append(maxhp_input);
		if (!this.isPlayer()) {
			hp_input.change(function(e) {
				$(this).val($(this).val().trim());
				self.update_and_sync(e);
				let tokenID = $(this).parent().parent().attr("data-id");
				if(window.all_token_objects[tokenID] != undefined){
					window.all_token_objects[tokenID].hp = $(this).val();
				}			
				if(window.TOKEN_OBJECTS[tokenID] != undefined){		
					window.TOKEN_OBJECTS[tokenID].hp = $(this).val();
					window.TOKEN_OBJECTS[tokenID].update_and_sync()
				}
			});
			hp_input.on('click', function(e) {
				$(e.target).select();
			});
			maxhp_input.change(function(e) {
				$(this).val($(this).val().trim());
				self.update_and_sync(e);
				if(window.all_token_objects[tokenID] != undefined){
					window.all_token_objects[tokenID].maxHp = $(this).val();
				}
				if(window.TOKEN_OBJECTS[tokenID] != undefined){		
					window.TOKEN_OBJECTS[tokenID].maxHp = $(this).val();
					window.TOKEN_OBJECTS[tokenID].update_and_sync()
				}
			});
			maxhp_input.on('click', function(e) {
				$(e.target).select();
			});
		}
		else {
			hpbar.off('click.message').on('click.message', 'input' ,function(){
				showTempMessage('Player HP must be adjusted on the character sheet.')
			})
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
		let bar_height = this.sizeHeight() * 0.2;
		bar_height = Math.ceil(bar_height);
		let acValue = (this.options.armorClass != undefined) ? this.options.armorClass : this.options.ac
		let ac = $("<div class='ac'/>");
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
					<text style="font-size:34px;color:#000;" transform="translate(${acValue> 9 ? 9 : 20},40)">${acValue}</text>
				</g>
			</svg>

			`)
		);
		return ac;
	}

	build_elev() {
		let bar_height = Math.max(16, Math.floor(this.sizeHeight() * 0.2)); // no less than 16px
		let elev = $("<div class='elev'/>");
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
			<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"width="${bar_height + 11}px" height="${bar_height + 11}px" viewBox="0 0 12 12" version="1.1" id="svg9" sodipodi:docname="Cloud_(fixed_width).svg" inkscape:version="0.92.5 (2060ec1f9f, 2020-04-08)">
			  <defs id="defs13"/>
			  <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1920" inkscape:window-height="1009" id="namedview11" showgrid="false" inkscape:zoom="41.7193" inkscape:cx="3.7543605" inkscape:cy="7.3293954" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="1" inkscape:current-layer="svg9"/>
			  <path style="opacity:1;fill:#fffd;fill-opacity:1;stroke:#020000;stroke-width:0.60000002;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1;paint-order:stroke fill markers" d="M 6.9014354,2.6799347 C 6.0612858,2.6944777 5.3005052,3.1744944 4.9326856,3.9221221 l -0.0044,0.00879 C 4.8347246,3.9105641 4.7397197,3.8973421 4.6441114,3.8913601 3.6580232,3.8369761 2.7983013,4.5487128 2.6782913,5.5188014 l -0.02637,0.010254 c -0.815669,-0.082231 -1.547762,0.4967997 -1.646485,1.3022461 -0.09854,0.8060438 0.473532,1.541652 1.286133,1.6538085 0.101483,0.013222 0.255109,0.013942 0.255109,0.013942 L 8.984441,8.49975 V 8.49682 C 9.9364542,8.478592 10.726709,7.763601 10.830143,6.8269035 10.941123,5.8069376 10.202664,4.8882705 9.173405,4.7658721 H 9.165985 C 9.12106,3.9596309 8.6352575,3.2418777 7.898991,2.8938019 7.5876151,2.7472589 7.2461776,2.6740579 6.9014324,2.6799347 Z" id="path905-36" inkscape:connector-curvature="0" sodipodi:nodetypes="cccccccccccccccc"/>
			<text x='6px' y='8px' style="font-weight: bold;font-size: 5px;stroke: #000;stroke-width: 8%;paint-order: stroke;stroke-linejoin: round;fill: #fff;text-anchor: middle;">${this.options.elev}</text>
			
			</svg>
						`));
		} else if (parseFloat(this.options.elev) < 0) {
			elev.append(
			$(`
			<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"width="${bar_height + 11}px" height="${bar_height + 11}px" viewBox="0 0 12 12" version="1.1" id="svg9" sodipodi:docname="Cloud_(fixed_width).svg" inkscape:version="0.92.5 (2060ec1f9f, 2020-04-08)">
			  <defs id="defs13"/>
			  <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1920" inkscape:window-height="1009" id="namedview11" showgrid="false" inkscape:zoom="41.7193" inkscape:cx="3.7543605" inkscape:cy="7.3293954" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="1" inkscape:current-layer="svg9"/>
			  <path style="opacity:1;fill:#fffd;fill-opacity:1;stroke:#020000;stroke-width:0.60000002;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1;paint-order:stroke fill markers" d="M 6.9014354,2.6799347 C 6.0612858,2.6944777 5.3005052,3.1744944 4.9326856,3.9221221 l -0.0044,0.00879 C 4.8347246,3.9105641 4.7397197,3.8973421 4.6441114,3.8913601 3.6580232,3.8369761 2.7983013,4.5487128 2.6782913,5.5188014 l -0.02637,0.010254 c -0.815669,-0.082231 -1.547762,0.4967997 -1.646485,1.3022461 -0.09854,0.8060438 0.473532,1.541652 1.286133,1.6538085 0.101483,0.013222 0.255109,0.013942 0.255109,0.013942 L 8.984441,8.49975 V 8.49682 C 9.9364542,8.478592 10.726709,7.763601 10.830143,6.8269035 10.941123,5.8069376 10.202664,4.8882705 9.173405,4.7658721 H 9.165985 C 9.12106,3.9596309 8.6352575,3.2418777 7.898991,2.8938019 7.5876151,2.7472589 7.2461776,2.6740579 6.9014324,2.6799347 Z" id="path905-36" inkscape:connector-curvature="0" sodipodi:nodetypes="cccccccccccccccc"/>
			<text x='6px' y='8px' style="font-weight: bold;font-size: 5px;stroke: #000;stroke-width: 8%;paint-order: stroke;stroke-linejoin: round;fill: #fff;text-anchor: middle;">${this.options.elev}</text>
			
			</svg>
			`)
		);}
		return elev;
	}

	build_age() {
		if(this.options.maxAge === false || this.options.maxAge == undefined )
			return '';
		let bar_height = Math.max(16, Math.floor(this.sizeHeight() * 0.2)); // no less than 16px
		let age = $("<div class='age'/>");
		let bar_width = Math.floor(this.sizeWidth() * 0.2);
		age.css("position", "absolute");
		age.css('right', bar_width * 4.35 + "px");
		age.css('width', bar_height + "px");
		age.css('height', bar_height + "px");
		age.css('bottom', '22px');
		age.css('color', 'white');
		
		if(this.options.age == undefined){
			this.options.age = this.options.maxAge != 'custom' ? this.options.maxAge : '0';
		}
		let fillColor = (parseInt(this.options.age) > 0) ? "#ffffff" : "#ff0000";
		age.append(
			$(`
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>i</title> <g id="Complete"> <g id="stopwatch"> <g> <circle id="Circle-2" data-name="Circle" cx="12" cy="14.5" r="7.9" fill="${fillColor}" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></circle> <polyline points="12 5.5 12 1.5 9 1.5 15 1.5" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polyline> </g> </g> </g> </g>
		<text x='12px' y='19px' style="font-weight: bold;font-size: 10px;stroke: #000;stroke-width: 8%;paint-order: stroke;stroke-linejoin: round;fill: #fff;text-anchor: middle;">${this.options.age}</text>
		
		</svg>
			`));
		
		return age;
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
		else if(this.options.player_owned || this.isCurrentPlayer()){ // if it's player_owned.. always showthem
			showthem=true;
		}
		else if(this.isPlayer() && (!this.options.hidestat)){
			showthem=true;
		}


		if(showthem){
			if (!this.maxHp && !this.hp && !this.options.hitPointInfo?.current && !this.options.hitPointInfo?.maximum) { // even if we are supposed to show them, only show them if they have something to show.
				token.find(".hpbar").css("visibility", "hidden");
			} else {
				token.find(".hpbar").css("visibility", "visible");
				if(this.tempHp >= 0){
					token.find(".hpbar").css("--base-hp", this.baseHp);
					token.find(".hpbar").css("--temp-hp", this.tempHp);
				}
			}
			if (!this.options.ac && !this.options.armorClass) { // even if we are supposed to show it, only show them if they have something to show.
				token.find(".ac").hide();
			} else {
				token.find(".ac").show();
			}
			if (!this.options.elev) { // even if we are supposed to show it, only show them if they have something to show.
				token.find(".elev").hide();
			} else {
				token.find(".elev").show();
			}
			if (!this.options.age) { // even if we are supposed to show it, only show them if they have something to show.
				token.find(".age").hide();
			} else {
				token.find(".age").show();
			}
		}
		else{
			token.find(".hpbar").css("visibility", "hidden");
			token.find(".ac").hide();
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
		let fogContext = $('#fog_overlay')[0].getContext('2d');

		if (this.options.hidden || is_token_under_fog(this.options.id, fogContext)) {
			if (window.DM) {
				if (animated) {
					tok.animate({ opacity: 0.5 }, { duration: 500, queue: false });

				} else {
					tok.css("opacity", 0.5); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
				}
				$(`#token_map_items [data-id='${this.options.id}']`).css("opacity", 0.5); 
			} else {
				tok.hide();
			}
		} else {
			if (animated) {
				tok.animate({ opacity: 1 }, { duration: 500, queue: false });
			} else {
				tok.css("opacity", 1); // DM SEE HIDDEN TOKENS AS OPACITY 0.5
			}
			$(`#token_map_items [data-id='${this.options.id}']`).css("opacity", 1); 
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
		if(!token.has(".age").length > 0){
			token.append(this.build_age());
		}
		else{
			token.find(".age").replaceWith(this.build_age());	
		}
		if(window.DM){
			$(`#combat_area tr[data-target='${this.options.id}'] .ac svg text`).text(this.ac);
			ct_update_popout();
		}

		console.groupEnd()
	}


	build_conditions(parent, singleRow = false) {
		function badge_condition(condition, conditionContainer, conditionSymbolName) {
			if(!isNaN(parseInt(condition.duration))) {
				let expired = (parseInt(condition.duration) <= 0) ? "expired" : "";
				let durationBadge = $(`<div class='duration-badge ${expired} ${conditionSymbolName}'><span>${condition.duration}</span></div>`);
				conditionContainer.append(durationBadge);
			}
		}

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
		if (this.isPlayer() && (this.options.inspiration || find_pc_by_player_id(this.options.id)?.inspiration, false)){
			if (!this.hasCondition("Inspiration")){
				this.addCondition("Inspiration")
			}
		} else{
			this.removeCondition("Inspiration");
		}

		if(this.isPlayer() && find_pc_by_player_id(this.options.id, false)?.inspiration){
			this.options.conditions = find_pc_by_player_id(this.options.id, false).conditions
		}
		
		const conditions = this.conditions;
		const conditionsTotal = conditions.length + this.options.custom_conditions.length + (this.options.id in window.JOURNAL.notes && (window.DM || window.JOURNAL.notes[this.options.id].player));

		if (conditionsTotal > 0) {
			let conditionCount = 0;
			

			for (let i = 0; i < this.options.conditions.length; i++) {
				const condition = this.options.conditions[i];
				const conditionName = (typeof condition === "string" ? condition : condition?.name) || "";
				const isExhaustion = conditionName.startsWith("Exhaustion");
				const conditionSymbolName = isExhaustion ? 'exhaustion' : conditionName.toLowerCase();
				const conditionContainer = $("<div class='dnd-condition condition-container' />");
				const symbolImage = $("<img class='condition-img' src='/content/1-0-1449-0/skins/waterdeep/images/icons/conditions/" + conditionSymbolName + ".svg'/>");
				const conditionDescription = isExhaustion ? CONDITIONS.Exhaustion : CONDITIONS[conditionName];

				if(conditionDescription == undefined){ // in case someone selected a condition from a translated character sheet remove it from the conditions array.
					this.options.conditions.splice(i, 1);
					i = i != this.options.conditions.length-1 ? i-1: i;	
					continue;
				}

				conditionContainer.css('width', symbolSize + "px");
				conditionContainer.css("height", symbolSize + "px");
				conditionContainer.css("position", "relative");
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				badge_condition(condition, conditionContainer, conditionSymbolName);
				if (conditionCount >= 3 && !singleRow) {
					moreCond.append(conditionContainer);
				} else {
					cond.append(conditionContainer);
				}
				let noteHover = `<div>
						<div class="tooltip-header">
				       	 	<div class="tooltip-header-icon">
				            
					        	</div>
					        <div class="tooltip-header-text">
					            ${conditionName}
					        </div>
					        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
					           Condition
					        </div>
			    		</div>
				   		<div class="tooltip-body note-text">
					        <div class="tooltip-body-description">
					            <div class="tooltip-body-description-text note-text">
					                ${conditionDescription.replaceAll(/\[(\/)?condition\]/gi, '')}
					            </div>
					        </div>
					    </div>
					</div>`


							
				let flyoutLocation = convert_point_from_map_to_view(parseInt(this.options.left), parseInt(this.options.top))
		
				let hoverConditionTimer;
				conditionContainer.on({
					'mouseover': function(e){
						hoverConditionTimer = setTimeout(function () {
			            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
					            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
					            flyout.addClass('note-flyout');
					            const tooltipHtml = $(noteHover);

					            flyout.append(tooltipHtml);
					            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
					            sendToGamelogButton.css({ "float": "right" });
					            sendToGamelogButton.on("click", function(ce) {
					                ce.stopPropagation();
					                ce.preventDefault();
									
					                send_html_to_gamelog(noteHover);
					            });
					            let flyoutLeft = e.clientX+20
					            if(flyoutLeft + 400 > window.innerWidth){
					            	flyoutLeft = window.innerWidth - 420
					            }
					            flyout.css({
					            	left: flyoutLeft,
					            	width: '400px'
					            })

					            const buttonFooter = $("<div></div>");
					            buttonFooter.css({
					                height: "40px",
					                width: "100%",
					                position: "relative",
					                background: "#fff"
					            });

					            flyout.append(buttonFooter);
					            buttonFooter.append(sendToGamelogButton);

								

					            flyout.hover(function (hoverEvent) {
					                if (hoverEvent.type === "mouseenter") {
					                    clearTimeout(removeToolTipTimer);
					                    removeToolTipTimer = undefined;
					                } else {
					                    remove_tooltip(500);
					                }
					            });

					            flyout.css("background-color", "#fff");
					        });
			        	}, 500);		
					
					},
					'mouseout': function(e){
						clearTimeout(hoverConditionTimer)
						remove_tooltip(500);
					}
			
			    });
				conditionCount++;
			}

			for (let i = 0; i < this.options.custom_conditions.length; i++) {
				//convert from old colored conditions
				if(this.options.custom_conditions[i].name == undefined){
					if(this.options.custom_conditions[i].includes('Inspiration')){
						this.options.custom_conditions.splice(i, 1)
						i -= 1;
						continue;
					}
					this.options.custom_conditions.push({
						'name': DOMPurify.sanitize( this.options.custom_conditions[i],{ALLOWED_TAGS: []}),
						'text': ''
					});
					this.options.custom_conditions.splice(i, 1)
					i -= 1;
					continue;
				}
				if(this.options.custom_conditions[i].name == 'Flamed'){
					this.options.custom_conditions[i].name = 'Burning'
				}
				//Security logic to prevent HTML/JS from being injected into condition names.
				const conditionName = DOMPurify.sanitize( this.options.custom_conditions[i].name,{ALLOWED_TAGS: []});
				const conditionText = DOMPurify.sanitize( this.options.custom_conditions[i].text,{ALLOWED_TAGS: []});
				const conditionSymbolName = DOMPurify.sanitize( conditionName.replaceAll(' ','_').toLowerCase(),{ALLOWED_TAGS: []});
				const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
				const conditionDescription = CONDITIONS[conditionName];
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
				conditionContainer.css("position", "relative");
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				badge_condition(this.options.custom_conditions[i], conditionContainer, conditionSymbolName);
				if (conditionCount >= 3 && !singleRow) {
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
				if(conditionDescription != undefined){
					let noteHover = `<div>
									<div class="tooltip-header">
							       	 	<div class="tooltip-header-icon">
							            
								        	</div>
								        <div class="tooltip-header-text">
								            ${conditionName}
								        </div>
								        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
								           Condition
								        </div>
						    		</div>
							   		<div class="tooltip-body note-text">
								        <div class="tooltip-body-description">
								            <div class="tooltip-body-description-text note-text">
								                ${conditionDescription.replaceAll(/\[(\/)?condition\]/gi, '')}
								            </div>
								        </div>
								    </div>
								</div>`
				
				
											
					let flyoutLocation = convert_point_from_map_to_view(parseInt(this.options.left), parseInt(this.options.top))
			
					let hoverConditionTimer;
					conditionContainer.on({
						'mouseover': function(e){
							hoverConditionTimer = setTimeout(function () {
				            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
						            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
						            flyout.addClass('note-flyout');
						            const tooltipHtml = $(noteHover);
	
						            flyout.append(tooltipHtml);
						            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
						            sendToGamelogButton.css({ "float": "right" });
						            sendToGamelogButton.on("click", function(ce) {
						                ce.stopPropagation();
						                ce.preventDefault();
										
						                send_html_to_gamelog(noteHover);
						            });
						            let flyoutLeft = e.clientX+20
						            if(flyoutLeft + 400 > window.innerWidth){
						            	flyoutLeft = window.innerWidth - 420
						            }
						            flyout.css({
						            	left: flyoutLeft,
						            	width: '400px'
						            })
	
						            const buttonFooter = $("<div></div>");
						            buttonFooter.css({
						                height: "40px",
						                width: "100%",
						                position: "relative",
						                background: "#fff"
						            });
	
						            flyout.append(buttonFooter);
						            buttonFooter.append(sendToGamelogButton);
	
									
	
						            flyout.hover(function (hoverEvent) {
						                if (hoverEvent.type === "mouseenter") {
						                    clearTimeout(removeToolTipTimer);
						                    removeToolTipTimer = undefined;
						                } else {
						                    remove_tooltip(500);
						                }
						            });
	
						            flyout.css("background-color", "#fff");
						        });
				        	}, 500);		
						
						},
						'mouseout': function(e){
							clearTimeout(hoverConditionTimer)
							remove_tooltip(500);
						}
				
				    });
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

				let noteHover = `<div>
									<div class="tooltip-header">
							       	 	<div class="tooltip-header-icon">
							            
								        	</div>
								        <div class="tooltip-header-text">
								            ${window.JOURNAL.notes[this.options.id].title}
								        </div>
								        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
								           Note
								        </div>
						    		</div>
							   		<div class="tooltip-body note-text">
								        <div class="tooltip-body-description">
								            <div class="tooltip-body-description-text note-text">
								                ${window.JOURNAL.notes[this.options.id].text}
								            </div>
								        </div>
								    </div>
								</div>`


							
				let flyoutLocation = convert_point_from_map_to_view(parseInt(this.options.left), parseInt(this.options.top))
				const noteId = this.options.id;
				let hoverNoteTimer;
				conditionContainer.on({
					'mouseover': function(e){
						hoverNoteTimer = setTimeout(function () {
			            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
					            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
					            flyout.addClass('note-flyout');
					            const tooltipHtml = $(noteHover);
								window.JOURNAL.translateHtmlAndBlocks(tooltipHtml);	
								add_journal_roll_buttons(tooltipHtml);
								window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
								add_stat_block_hover(tooltipHtml);

								$(tooltipHtml).find('.add-input').each(function(){
								    let numberFound = $(this).attr('data-number');
								    const spellName = $(this).attr('data-spell');
								    const remainingText = $(this).hasClass('each') ? '' : `${spellName} slots remaining`
								    const track_ability = function(key, updatedValue){	    	
										if (window.JOURNAL.notes[noteId].abilityTracker === undefined) {
											window.JOURNAL.notes[noteId].abilityTracker = {};
										}
										const asNumber = parseInt(updatedValue); 
										window.JOURNAL.notes[noteId].abilityTracker[key] = asNumber;
										window.JOURNAL.persist();
										debounceSendNote(noteId, window.JOURNAL.notes[noteId])
							    	}
								    if (window.JOURNAL.notes[noteId].abilityTracker?.[spellName]>= 0){
							    		numberFound = window.JOURNAL.notes[noteId].abilityTracker[spellName]
							    	} 
							    	else{
								    	track_ability(spellName, numberFound)
								    }

								    let input = createCountTracker(window.JOURNAL.notes[noteId], spellName, numberFound, remainingText, "", track_ability);
								    $(this).find('p').remove();
								    $(this).after(input)
							    })
					            flyout.append(tooltipHtml);
					            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
					            sendToGamelogButton.css({ "float": "right" });
					            sendToGamelogButton.on("click", function(ce) {
					                ce.stopPropagation();
					                ce.preventDefault();
									
					                send_html_to_gamelog(noteHover);
					            });
					            let flyoutLeft = e.clientX+20
					            if(flyoutLeft + 400 > window.innerWidth){
					            	flyoutLeft = window.innerWidth - 420
					            }
					            flyout.css({
					            	left: flyoutLeft,
					            	width: '400px'
					            })

					            const buttonFooter = $("<div></div>");
					            buttonFooter.css({
					                height: "40px",
					                width: "100%",
					                position: "relative",
					                background: "#fff"
					            });
					            window.JOURNAL.block_send_to_buttons(flyout);
					            flyout.append(buttonFooter);
					            buttonFooter.append(sendToGamelogButton);
					            flyout.find("a").attr("target","_blank");
					      		flyout.off('click').on('click', '.int_source_link', function(event){
									event.preventDefault();
									render_source_chapter_in_iframe(event.target.href);
								});
								

					            flyout.hover(function (hoverEvent) {
					                if (hoverEvent.type === "mouseenter") {
					                    clearTimeout(removeToolTipTimer);
					                    removeToolTipTimer = undefined;
					                } else {
					                    remove_tooltip(500);
					                }
					            });

					            flyout.css("background-color", "#fff");
					        });
			        	}, 500);		
					
					},
					'mouseout': function(e){
						clearTimeout(hoverNoteTimer)
						remove_tooltip(500);
					}
			
			    });
			
			    
							


				conditionContainer.css('width', symbolSize + "px");
				conditionContainer.css("height", symbolSize + "px");
				conditionContainer.css("position", "relative");				
				symbolImage.height(symbolSize + "px");
				symbolImage.width(symbolSize + "px");
				conditionContainer.append(symbolImage);
				if (conditionCount >= 3 && !singleRow) {
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
		try{
			if(!this.options.id.includes('exampleToken') && (isNaN(parseFloat(this.options.left)) || isNaN(parseInt(this.options.top)))){// prevent errors with NaN positioned tokens - delete them as catch all. 
				this.options.deleteableByPlayers = true;
				this.delete();
				return;
			}
			if(this.options.combatGroupToken){
				this.options.left = '0px';
				this.options.top = '0px';
			}
			if (animationDuration == undefined || parseFloat(animationDuration) == NaN) {
				animationDuration = 1000;
			}
			console.log("cerco id" + this.options.id);
			let selector = "div[data-id='" + this.options.id + "']";
			let old = $("#tokens").find(selector);
			let self = this;

			/* UPDATE COMBAT TRACKER */
			this.update_combat_tracker()
			const underdarknessDivisor = this.options.underDarkness && !this.options.exampleToken ? parseInt(window.CURRENT_SCENE_DATA.scale_factor) : 1;
			const imageScale = (this.options.imageSize != undefined) ? this.options.imageSize : 1;
			const imageOffsetX = this.options.offset?.x;
			const imageOffsetY = this.options.offset?.y;
			const imageOpacity = (this.options.imageOpacity != undefined) ? this.options.imageOpacity : 1;
			const imageZoom = this.options.imageZoom != undefined ? parseFloat(this.options.imageZoom): undefined;
			const newInset = imageZoom != undefined ? 49.5 * imageZoom/100 : undefined;
			let rotation = 0;
			
			if (this.options.rotation != undefined) {
				rotation = this.options.rotation;
			}
			if(this.options.groupId != undefined){
				old.attr('data-group-id', this.options.groupId)
			}
			else{
				old.removeAttr('data-group-id')
			}		

			if (old.length > 0) {

				console.trace();
				console.group("old token")
				console.log("trovato!!");
				if(this.options.type == 'door'){
					this.options.size = 50;
					setTokenLight(old, this.options);
					redraw_light();
					door_note_icon(this.options.id);
					return;
				}
				if(window.CURRENT_SCENE_DATA.disableSceneVision == 1 && !window.DM)
					check_single_token_visibility(this.options.id);

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
					}, { duration: animationDuration, queue: true, complete: async function() {
							$('.token[data-clone-id^="dragging-"]').remove();
						}
					});
					




				old.find(".token-image").css("transition", "max-height 0.2s linear, max-width 0.2s linear, transform 0.2s linear")
				old.find(".token-image").css("transform", "scale(var(--token-scale)) rotate(var(--token-rotation))");
				old.css({
					"--token-scale": imageScale,
					"--token-rotation": `${rotation}deg`,
					"--offsetX": imageOffsetX != undefined ? `${parseFloat(imageOffsetX) * this.options.gridSquares}px` : '0px',
					"--offsetY": imageOffsetY != undefined ? `${parseFloat(imageOffsetY) * this.options.gridSquares}px` : '0px',
					"--image-opacity": `${imageOpacity}`,
					"--view-box": `inset(${newInset}% ${newInset}% ${newInset}% ${newInset}%)`, // will be used for object-view-box when supported in firefox
					"--image-zoom": imageZoom == undefined ? ``: `${imageZoom+100}%` //adjust from viewbox to background-size property due to firefox not supporting it

				});
				$(`.isAoe[data-id='${this.options.id}']:not(.token)`).css({
					'--token-rotation': `${rotation}deg`,
					'--token-scale': imageScale
				})


				setTimeout(function() {old.find(".token-image").css("transition", "")}, 200);		
				
				let selector = "tr[data-target='"+this.options.id+"']";
				let entry = $("#combat_area").find(selector);
				if((!(this.options.name) || (!(this.options.revealname)) && !this.isPlayer() && !window.DM)) {
					old.toggleClass('hasTooltip', false);
					entry.toggleClass('hasTooltip', false);
					entry.removeAttr("data-name");
				}	
				else if (this.options.name) {
					if ((window.DM || this.isPlayer() || this.options.revealname)) {
						old.attr("data-name", this.options.name);
						old.toggleClass('hasTooltip', true);
						entry.attr("data-name", this.options.name);
						entry.toggleClass('hasTooltip', true);
					}
				}

				let tokenBorderWidth = (this.options.underDarkness == true) ? (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2 / window.CURRENT_SCENE_DATA.scale_factor)+"px" : (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2)+"px";
				old.find(".token-image").css("--token-border-width", tokenBorderWidth);

				if (old.attr('width') !== this.sizeWidth() || old.attr('height') !== this.sizeHeight()) {
					// NEED RESIZING			
					old.find(".token-image").css({
						"max-width": this.sizeWidth(),
						"max-height": this.sizeHeight()
					});

					if($('#loadingStyles').length == 0)
					{
						old.animate({
							width: this.sizeWidth(),
							height: this.sizeHeight()
						}, { duration: 1000, queue: false });
					}
					
					$(`.isAoe[data-id='${this.options.id}']:not(.token)`).css({
						"max-width": this.sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor,
						"max-height": this.sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor
					})
					$(`.isAoe[data-id='${this.options.id}']:not(.token) .token-image`).css({
						"max-width": this.sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor,
						"max-height": this.sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor
					})

					$(`.isAoe[data-id='${this.options.id}']:not(.token)`).animate({
						width: this.sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor,
						height: this.sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor
					}, { duration: 1000, queue: false });

					let zindexdiff=(typeof this.options.zindexdiff == 'number') ? this.options.zindexdiff : Math.round(17/(this.sizeWidth()/window.CURRENT_SCENE_DATA.hpps));
					this.options.zindexdiff = Math.max(zindexdiff, -5000);
					let zConstant = this.options.underDarkness || this.options.tokenStyleSelect == 'definitelyNotAToken' ? 5000 : 10000;
					old.css("z-index", `calc(${zConstant} + var(--z-index-diff))`);
					old.css("--z-index-diff", zindexdiff);

					let bar_height = Math.floor(this.sizeHeight() * 0.2);

					if (bar_height > 60)
						bar_height = 60;

					let fs = Math.floor(bar_height / 1.3) + "px";
					old.css("font-size",fs);
				}


				this.update_opacity(old);
				this.build_conditions(old);
				if(window.DM) {
					const combatRow = $(`#combat_area tr[data-target='${this.options.id}']`);
					if(combatRow.length){
						this.build_conditions($(`#combat_area tr[data-target='${this.options.id}']`), true);
					}
				}

				

				

				if (this.selected) {
					old.addClass("tokenselected");
					toggle_player_selectable(this, old)
				}
				else {
					old.css("border", "");
					old.removeClass("tokenselected");
				}
				let oldImage =  old.find(".token-image,[data-img]")
				// token uses an image for it's image
				if (!this.options.imgsrc.startsWith("class")){

					if(oldImage.attr("src")!=parse_img(this.options.imgsrc) || window.videoTokenOld[this.options.id] != this.options.videoToken){
						let oldFileExtension = oldImage.attr("src").split('.')[oldImage.attr("src").length-1]
						let newFileExtention = parse_img(this.options.imgsrc.split('.')[this.options.imgsrc.split('.').length-1]);
						let imgClass = oldImage.attr('class');
						let video = false;
						if(oldFileExtension !== newFileExtention || window.videoTokenOld[this.options.id] != this.options.videoToken){
							oldImage.remove();
							$(`[data-notatoken='notatoken_${this.options.id}']`).remove();
							let tokenImage;
							if(this.options.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => this.options.imgsrc.includes(d))){
								tokenImage = $("<video disableRemotePlayback autoplay loop muted style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))' class='"+imgClass+"'/>");			
								video = true;
							} 
							else{
								tokenImage = $("<div data-div-image='true' style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))' class='"+imgClass+" div-token-image'/>");
							}
							oldImage = tokenImage;
							old.append(tokenImage);
						}
						window.videoTokenOld[this.options.id] = this.options.videoToken;
						
						updateTokenSrc(this.options.imgsrc, oldImage, video)
						$(`#combat_area tr[data-target='${this.options.id}'] img[class*='Avatar']`).attr("src", parse_img(this.options.imgsrc));
						oldImage.off('dblclick.highlightToken').on('dblclick.highlightToken', function(e) {
							self.highlight(true); // dont scroll
							let data = {
								id: self.options.id
							};
							window.MB.sendMessage('custom/myVTT/highlight', data);
						})

						oldImage.off('click.selectToken').on('click.selectToken', function() {
							let parentToken = $(this).parent(".VTTToken");
							if (parentToken.hasClass("pause_click")) {
								return;
							}
							let tokID = parentToken.attr('data-id');
							let groupID = parentToken.attr('data-group-id');
							let thisSelected = !(parentToken.hasClass('tokenselected'));
							let count = 0;
							if (shiftHeld == false) {
								deselect_all_tokens(true);
							}
							if (thisSelected == true) {
								parentToken.addClass('tokenselected');
								toggle_player_selectable(window.TOKEN_OBJECTS[tokID], parentToken)
							} else {
								parentToken.removeClass('tokenselected');
							}				

							window.TOKEN_OBJECTS[tokID].selected = thisSelected;

							for (let id in window.TOKEN_OBJECTS) {
								if (id.selected == true) {
									count++;
								}			
							}

							window.MULTIPLE_TOKEN_SELECTED = (count > 1);
					
							if(window.DM){
						   		$("[id^='light_']").css('visibility', "visible");
						   	}
							draw_selected_token_bounding_box(); // update rotation bounding box
						});
					}

					if(this.options.disableborder){
						oldImage.css("border-width","0");
					}
					else{
						oldImage.css("border-width","");
					}
					if(!this.options.id.includes('exampleToken') && !this.options.combatGroupToken){
						setTokenAuras(old, this.options);
						setTokenLight(old, this.options);
						setTokenBase(old, this.options);
					}
					setTokenBase($(`[data-notatoken='notatoken_${this.options.id}']`), this.options);
					if(this.options.audioChannel){
						setAudioAura(old, this.options)
					}
					
					if(!(this.options.square) && !oldImage.hasClass('token-round')){
						oldImage.addClass("token-round");
					}

					if(old.find(".token-image").hasClass('token-round') && (this.options.square) ){
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
				}
				else{
					// token is an aoe div that uses styles instead of an image
					// do something with it maybe?
					// re-calc the border width incase the token has changed size
					oldImage.css(`transform:scale(var(--token-scale)) rotate(--token-rotation));`)

				}

				oldImage.css("max-height", this.sizeHeight());
				oldImage.css("max-width", this.sizeWidth());



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
					else if(this.options.lockRestrictDrop == "lock" || this.options.lockRestrictDrop == "declutter"){
						this.options.locked = true;
					}
					else if(this.options.lockRestrictDrop == "none"){
						this.options.locked = false;
						this.options.restrictPlayerMove = false;
					}
				}
				if(this.options.light1 == undefined){
					this.options.light1 ={
						feet: 0,
						color: 'rgba(255, 255, 255, 1)'
					}
				}
				if(this.options.light2 == undefined){
					this.options.light2 = {
						feet: 0,
						color: 'rgba(142, 142, 142, 1)'
					}
				}
				if(this.options.vision == undefined){
					this.options.vision = {
						feet: 60,
						color: 'rgba(142, 142, 142, 1)'
					}
				}
				if((!window.DM && this.options.restrictPlayerMove && !this.isCurrentPlayer()) || this.options.locked){
					if(!window.DM || (window.DM && !$('#select_locked>div.ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active'))){
						old.draggable("disable");
						old.removeClass("ui-state-disabled"); // removing this manually.. otherwise it stops right click menu
					}
				}
				else if((window.DM && this.options.restrictPlayerMove && !this.isCurrentPlayer()) || !this.options.locked || (window.DM && !$('#select_locked>div.ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active'))){
					old.draggable("enable");
				}	
				else if(!window.DM && ((!this.options.restrictPlayerMove  && !this.isCurrentPlayer())) || !this.options.locked){
					old.draggable("enable");
				}
				if(!this.options.id.includes('exampleToken')){
					old.toggleClass('lockedToken', this.options.locked==true)
					old.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
				}
				this.update_health_aura(old);

				// store custom token info if available
				if (typeof this.options.tokendatapath !== "undefined" && this.options.tokendatapath != "") {
					old.attr("data-tokendatapath", this.options.tokendatapath);
				}
				if (typeof this.options.tokendataname !== "undefined") {
					old.attr("data-tokendataname", this.options.tokendataname);
				}
				if(this.options.darkness){
					let copyImage = $(`[data-darkness='darkness_${this.options.id}']`);
					copyImage.css({
						'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
						'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
						width: `var(--token-width)`,
						height: `var(--token-height)`,
						'max-width': `var(--token-width)`,
						'max-height': `var(--token-height)`,
						'--z-index-diff': old.css('--z-index-diff'),
						'--token-scale': old.css('--token-scale'),
	    				'--token-rotation': old.css('--token-rotation')
					})
					copyImage.animate({
							left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
							top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
						}, 
						{ 
							duration: animationDuration, queue: true
						}
					);
				}
				if(this.options.tokenStyleSelect == 'definitelyNotAToken' || this.options.underDarkness == true){
						old.toggleClass('underDarkness', true);
						if($(`[data-notatoken='notatoken_${this.options.id}']`).length == 0){
							let tokenClone = old.clone();
							tokenClone.css({
								left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
								top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
								'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
								'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
								width: `var(--token-width)`,
								height: `var(--token-height)`,
								'max-width': `var(--token-width)`,
								'max-height': `var(--token-height)`,
								'--z-index-diff': old.css('--z-index-diff'),
								'opacity': this.options.hidden ? '0.5' : '1',
								'--hp-percentage': `${this.hpPercentage}%`,
								'--temp-hp-percentage': `${this.tempHpPercentage}%`,
								"--token-border-width": tokenBorderWidth,
								'border-width': old.find('.token-image').css('border-width'),
			    				"--offsetX": old.css('--offsetX'),
			    				"--offsetY": old.css('--offsetY'),
								"--image-opacity": old.css('--image-opacity'),
								"--view-box": old.css('--view-box'),
								"--image-zoom": old.css('--image-zoom')
							})
					        tokenClone.attr('data-notatoken', `notatoken_${this.options.id}`);
					        tokenClone.children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove();    
					        tokenClone.toggleClass('lockedToken', this.options.locked==true)
							tokenClone.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
							tokenClone.attr('data-name', old.attr('data-name'));
							tokenClone.toggleClass('hasTooltip', $(old).hasClass('hasTooltip'));
					        $('#token_map_items').append(tokenClone);
						}
						else{
							let copyToken = $(`[data-notatoken='notatoken_${this.options.id}']`);
							copyToken.css({
								'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
								'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
								width: `var(--token-width)`,
								height: `var(--token-height)`,
								'max-width': `var(--token-width)`,
								'max-height': `var(--token-height)`,
								'--z-index-diff': old.css('--z-index-diff'),
								'--token-scale': old.css('--token-scale'),
			    				'--token-rotation': old.css('--token-rotation'),
								'opacity': this.options.hidden ? '0.5' : '1',
								'--hp-percentage': `${this.hpPercentage}%`,
								'--temp-hp-percentage': `${this.tempHpPercentage}%`,
								"--token-border-width": tokenBorderWidth,
								'border-width': old.find('.token-image').css('border-width'),
			    				"--offsetX": old.css('--offsetX'),
			    				"--offsetY": old.css('--offsetY'),
								"--image-opacity": old.css('--image-opacity'),
								"--view-box": old.css('--view-box'),
								"--image-zoom": old.css('--image-zoom')
							})
							copyToken.children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove()
							copyToken.toggleClass('lockedToken', this.options.locked==true)
							copyToken.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
							copyToken.attr('data-name', old.attr('data-name'));
							copyToken.toggleClass('hasTooltip', $(old).hasClass('hasTooltip'));
							copyToken.animate({
									left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
									top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
								}, 
								{ 
									duration: animationDuration, queue: true
								}
							);
						}

						let copyImage = $(`[data-notatoken='notatoken_${this.options.id}']`).find('.token-image')
						let oldImage = old.find('.token-image');

						if(copyImage.attr('src') != parse_img(this.options.imgsrc)){
							copyImage.attr("src", parse_img(this.options.imgsrc));
						}

				}  	
				else{
		    		$(`[data-notatoken='notatoken_${this.options.id}']`).remove();
		    		old.toggleClass('underDarkness', false);
		    	}
				
				console.groupEnd()
			}
			else { // adding a new token
				// console.group("new token")

				let tok = $("<div/>");
				
				let bar_height = Math.floor(this.sizeHeight() * 0.2);
				// we don't allow certain options to be set for AOE tokens
				
				if (bar_height > 60)
					bar_height = 60;

				let fs = Math.floor(bar_height / 1.3) + "px";
				tok.css("font-size",fs);
				let tokenMultiplierAdjustment = (window.CURRENT_SCENE_DATA?.scaleAdjustment?.x > window.CURRENT_SCENE_DATA?.scaleAdjustment?.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : (window.CURRENT_SCENE_DATA?.scaleAdjustment?.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.y : 1;
				
				if(this.options.type == 'door'){
					this.options.size = 50;
					setTokenLight(tok, this.options);
					redraw_light();
					door_note_icon(this.options.id);
					return;
				}
				if(this.options.gridSquares != undefined){
					this.options.size = window.CURRENT_SCENE_DATA.hpps * this.options.gridSquares * tokenMultiplierAdjustment;
				}
				else{
					this.options.gridSquares = this.options.size / window.CURRENT_SCENE_DATA.hpps * tokenMultiplierAdjustment
				}
				if(this.options.groupId != undefined)
					tok.attr('data-group-id', this.options.groupId)
				if(this.options.light1?.feet == undefined){
					this.options.light1 ={
						feet: 0,
						color: (window.TOKEN_SETTINGS?.light1?.color) ? window.TOKEN_SETTINGS.light1.color : 'rgba(255, 255, 255, 1)'
					}
				}
				if(this.options.light2?.feet == undefined){
					this.options.light2 = {
						feet: 0,
						color: (window.TOKEN_SETTINGS?.light2?.color) ? window.TOKEN_SETTINGS.light2.color : 'rgba(142, 142, 142, 1)'
					}
				}
				if(this.options.vision?.feet == undefined){
					if(this.isPlayer()){
			            let pcData = find_pc_by_player_id(this.options.id, false);
			            let darkvision = 0;
			            if(pcData && pcData.senses.length > 0) {
				                for(let i=0; i < pcData.senses.length; i++){
				                    const ftPosition = pcData.senses[i].distance.indexOf('ft.');
				                    const range = parseInt(pcData.senses[i].distance.slice(0, ftPosition));
				                    if(range > darkvision)
				                        darkvision = range;
				                }
				        }
			            this.options.vision = {
			                feet: darkvision.toString(),
			                color: (window.TOKEN_SETTINGS?.vision?.color) ? window.TOKEN_SETTINGS.vision.color : 'rgba(142, 142, 142, 1)'
			            }
			        }
			        else if(this.isMonster()){
			            let darkvision = 0;
			            if(window.monsterListItems){
			            	let monsterSidebarListItem = this.options.monster == "open5e" ? window.open5eListItems.filter((d) => this.options.itemId == d.id)[0] : window.monsterListItems.filter((d) => this.options.monster == d.id)[0] ;	
			            	if(!monsterSidebarListItem){
								for(let i in encounter_monster_items){
								    if(encounter_monster_items[i].some((d) => this.options.monster == d.id)){
								        monsterSidebarListItem = encounter_monster_items[i].filter((d) => this.options.monster == d.id)[0]
								        break;
								    }
								}
							}
			                   
							if(monsterSidebarListItem){
					            if(monsterSidebarListItem.monsterData.senses.length > 0){
					                for(let i=0; i < monsterSidebarListItem.monsterData.senses.length; i++){
					                    const ftPosition = monsterSidebarListItem.monsterData.senses[i].notes.indexOf('ft.')
					                    const range = parseInt(monsterSidebarListItem.monsterData.senses[i].notes.slice(0, ftPosition));
					                    if(range > darkvision)
					                        darkvision = range;
					                }
					            }
				       		}
			       		} 
			            this.options.vision = {
			                feet: darkvision.toString(),
			                color: (window.TOKEN_SETTINGS?.vision?.color) ? window.TOKEN_SETTINGS.vision.color : 'rgba(142, 142, 142, 1)'
			            }
			        }
					else{
						this.options.vision = {
							feet: 60,
							color: (window.TOKEN_SETTINGS?.vision?.color) ? window.TOKEN_SETTINGS.vision.color : 'rgba(142, 142, 142, 1)'
						}
					
					}
				}

				if(this.options.reveal_light != undefined){
					if(this.options.reveal_light == 'always' || this.options.reveal_light == true){
						this.options.share_vision = true;
					}
					else{
						this.options.share_vision = false;
					}
					delete this.options.reveal_light;
				}

				let tokenImage
				// new aoe tokens use arrays as imsrc
				let tokenBorderWidth = (this.options.underDarkness == true) ? (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2 / window.CURRENT_SCENE_DATA.scale_factor)+"px" : (this.sizeWidth() / window.CURRENT_SCENE_DATA.hpps * 2)+"px";
						
				if (!this.isAoe()){
					let imgClass = 'token-image';
					if(this.options.legacyaspectratio == false) {
						imgClass = 'token-image preserve-aspect-ratio';
					}
					const underdarknessDivisor = this.options.underDarkness && !this.options.exampleToken ? parseInt(window.CURRENT_SCENE_DATA.scale_factor) : 1;
					const rotation = (this.options.rotation != undefined) ? this.options.imageSize : 0;
					const imageScale = (this.options.imageSize != undefined) ? this.options.imageSize : 1;
					const imageOffsetX = this.options.offset?.x;
					const imageOffsetY = this.options.offset?.y;
					const imageOpacity = (this.options.imageOpacity != undefined) ? this.options.imageOpacity : 1;
					const imageZoom = this.options.imageZoom != undefined ? parseFloat(this.options.imageZoom) : undefined;
					const newInset = imageZoom != undefined ? 49.5 * imageZoom/100 : undefined;
					this.options.imgsrc = update_old_discord_link(this.options.imgsrc) // this might be able to be removed in the future - it's to update maps with tokens already on them
					let video = false;
					if(this.options.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => this.options.imgsrc.includes(d))){
						tokenImage = $("<video disableRemotePlayback autoplay loop muted style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))' class='"+imgClass+"'/>");
						video = true;
					} 
					else{
						tokenImage = $("<div style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))' class='"+imgClass+" div-token-image'/>");
					}
					
					tok.css({
						"--token-scale": imageScale,
						"--token-rotation": `${rotation}deg`,
						"--offsetX": imageOffsetX != undefined ? `${parseFloat(imageOffsetX) * this.options.gridSquares}px` : '0px',
						"--offsetY": imageOffsetY != undefined ? `${parseFloat(imageOffsetY) * this.options.gridSquares}px` : '0px',
						"--image-opacity": `${imageOpacity}`,
						"--view-box": `inset(${newInset}% ${newInset}% ${newInset}% ${newInset}%)`,
						"--image-zoom": imageZoom == undefined ? ``: `${imageZoom+100}%` //adjust from viewbox to background-size property due to firefox not supporting it
					});
					if(!(this.options.square)){
						tokenImage.addClass("token-round");
					}
					
					
					updateTokenSrc(this.options.imgsrc, tokenImage, video);

					if(this.options.disableborder)
						tok.css("border-width","0");
					else{
						tok.css("--token-border-width",tokenBorderWidth);
					}
					
					tokenImage.css("max-height", this.options.size);
					tokenImage.css("max-width", this.options.size);
			
					tok.toggleClass("isAoe", false);
					tok.toggleClass('lineAoe', false);

				} else {
					tokenImage = build_aoe_token_image(this, imageScale, rotation)

					tok.css({
						"--token-scale": imageScale,
						"--token-rotation": `${rotation}deg`,
					});
					tok.toggleClass("isAoe", true);
					if(this.isLineAoe()){
						tok.toggleClass('lineAoe', true)
					}
				}
				tok.css("--token-rotation", rotation + "deg");



				if(this.options.audioChannel){
					tok.toggleClass('audio-token', true);
					tok.append(`<div class='audio-radius'>`);
					setAudioAura(tok, this.options)
				}
				tokenImage.css({
					"max-height": this.sizeHeight(),
					"max-width": this.sizeWidth()
				});
				if(window.videoTokenOld == undefined){
					window.videoTokenOld = {};
				}
				if(this.options.videoToken == true){
					window.videoTokenOld[this.options.id] = this.options.videoToken;
				}
				


				tok.attr("data-id", this.options.id);

		
				let sameSizeorLargerTokens = Object.fromEntries(
								   Object.entries(window.TOKEN_OBJECTS).filter(
								   		([key, val])=> Math.ceil(window.TOKEN_OBJECTS[key].options.size) >= Math.ceil(this.options.size) && key != this.options.id
								   	)
								);

				let topZIndex = 0;
				if(JSON.stringify(sameSizeorLargerTokens) != '{}'){	
					const tokenObjects = Object.values(sameSizeorLargerTokens);

					tokenObjects.map((token) => {
					  const valueFromObject = token.options.zindexdiff;
					  if(typeof valueFromObject == 'number')
					 	 topZIndex = Math.max(topZIndex, valueFromObject);
					});
				}
			
				
				let zindexdiff=(typeof this.options.zindexdiff == 'number') ? this.options.zindexdiff : topZIndex != 0 ? topZIndex : Math.round(17/(this.sizeWidth()/window.CURRENT_SCENE_DATA.hpps)); 
				this.options.zindexdiff = Math.max(zindexdiff, -5000);
				console.log("Diff: "+zindexdiff);
				
				
				tok.width(this.sizeWidth());
				tok.height(this.sizeHeight());
				tok.addClass('token');
				
			   	tok.append(tokenImage);		    


				tok.attr("data-id", this.options.id);

				tok.addClass("VTTToken");

				this.update_health_aura(tok);
				let currentSceneScale = parseFloat(window.CURRENT_SCENE_DATA.scale_factor) ? parseFloat(window.CURRENT_SCENE_DATA.scale_factor) : 1
				if(this.options.scaleCreated != undefined && this.options.scaleCreated != currentSceneScale){
					let difference = this.sizeWidth()/this.options.scaleCreated*currentSceneScale/2 - this.sizeWidth()/2;
					this.options.top = `${parseFloat(this.options.top)/this.options.scaleCreated*currentSceneScale+difference}px`
					this.options.left =  `${parseFloat(this.options.left)/this.options.scaleCreated*currentSceneScale+difference}px`
				}
				this.options.scaleCreated = window.CURRENT_SCENE_DATA.scale_factor;	
				tok.css("position", "absolute");
				tok.css("--z-index-diff", zindexdiff);
				tok.css("top", this.options.top);
				tok.css("left", this.options.left);
				tok.css("opacity", "0.0");
				tok.css("display", "flex");
				tok.css("justify-content", "center");
				tok.css("align-items", "center");
				if(this.options.combatGroupToken){
					tok.toggleClass('groupToken', true)
				}

				const zConstant = this.options.underDarkness || this.options.tokenStyleSelect == 'definitelyNotAToken'  ? 5000 : 10000;
				tok.css("z-index", `calc(${zConstant} + var(--z-index-diff))`);


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
		
				if(this.options.darkness){
					let tokenClone = tok.clone();
					tokenClone.css({
						left: parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor,
						top: parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor,
						width: `calc(${this.sizeWidth()}px / var(--scene-scale))`,
						height: `calc(${this.sizeHeight()}px / var(--scene-scale))`
					})
			        tokenClone.attr('data-darkness', `darkness_${this.options.id}`);
			        tokenClone.find('.conditions').remove();
			        tokenClone.removeClass(['token', 'VTTToken']);
			        if($(`[data-darkness='darkness_${this.options.id}]'`).length == 0)
			        	$('#light_container').append(tokenClone);
			    }

			    if(!this.options.id.includes('exampleToken')){
					this.update_opacity(tok, true);
			    }

				
				if(!this.options.id.includes('exampleToken') && !this.options.combatGroupToken){
					setTokenAuras(tok, this.options);
					setTokenLight(tok, this.options);
				}


				setTokenBase(tok, this.options);
				let click = {
					x: 0,
					y: 0
				};
				let currentTokenPosition = {
					x: 0,
					y: 0
				};
			 	if(window.moveOffscreenCanvasMask == undefined){
			 		window.moveOffscreenCanvasMask = document.createElement('canvas');
			 	}
				let canvas = window.moveOffscreenCanvasMask;
				let ctx = canvas.getContext("2d", { willReadFrequently: true });

				tok.draggable({
					stop:
						function (event) {
							//remove cover for smooth drag
							$('.iframeResizeCover').remove();

							tok.removeAttr("data-dragging")
							tok.removeAttr("data-drag-x")
							tok.removeAttr("data-drag-y")
							$(`[data-notatoken][data-id='${self.options.id}']`).toggleClass(['ui-draggable-dragging', 'pause_click'], false);
					
							// finish measuring
							// drop the temp overlay back down so selection works correctly
							$("#temp_overlay").css("z-index", "25")
							if (get_avtt_setting_value("allowTokenMeasurement")){
								WaypointManager.fadeoutMeasuring(window.PLAYER_ID)
							}	
							debounceLightChecks();

							self.update_and_sync(event, false);
							if (self.selected ) {
								for (let tok of window.dragSelectedTokens){
									let id = $(tok).attr("data-id");
									if (id == self.options.id)
										continue;
									let curr = window.TOKEN_OBJECTS[id];
									let ev = { target: $("#tokens [data-id='" + id + "']").get(0) };
									curr.update_and_sync(ev);
								}												
							}
							window.DRAGGING = false;
							draw_selected_token_bounding_box();
							window.toggleSnap=false;

							pauseCursorEventListener = false;
							setTimeout(() => {
								if(!window.DRAGGING){
									window.dragSelectedTokens.removeClass("pause_click")
									delete window.playerTokenAuraIsLight;
									delete window.dragSelectedTokens;
									delete window.orig_zoom;
								}
							}, 200)
							debounceAudioChecks();
						},
					start: function (event) {
						
						pauseCursorEventListener = true; // we're going to send events from drag, so we don't need the eventListener sending events, too
						if (get_avtt_setting_value("allowTokenMeasurement")) {
							$("#temp_overlay").css("z-index", "50");
						}
						window.DRAWFUNCTION = "select"
						window.DRAGGING = true;
						window.oldTokenPosition = {};
						
						self.prepareWalkableArea()
						window.orig_zoom = window.ZOOM;

						$(`[data-notatoken][data-id='${self.options.id}']`).toggleClass(['ui-draggable-dragging', 'pause_click'], true);

						if(self.selected == false && $("#tokens .token.tokenselected").length>0){
							for (let tok of $("#tokens .token.tokenselected")){
								let id = $(tok).attr("data-id");
								window.TOKEN_OBJECTS[id].selected = false;
								$("#tokens [data-id='" + id + "']").toggleClass("tokenselected", false)
							}
						}
						let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");

						self.selected = true;
						window.CURRENTLY_SELECTED_TOKENS.push(self.options.id);
						$("#tokens [data-id='" + self.options.id + "']").toggleClass(["tokenselected", 'pause_click'], true);
						if(tok.is(":animated")){
							self.stopAnimation();
						}


						let selectedTokens = $('.tokenselected');
				
						
						// for dragging behind iframes so tokens don't "jump" when you move past it
						$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
						$("#sheet").append($('<div class="iframeResizeCover"></div>'));

						console.log("Click x: " + click.x + " y: " + click.y);

						self.orig_top = self.options.top;
						self.orig_left = self.options.left;

						$(`.token[data-group-id='${self.options.groupId}']:not([style*=' display: none;'])`).toggleClass('tokenselected', true); // set grouped tokens as selected
						

						window.playerTokenAuraIsLight = (window.CURRENT_SCENE_DATA.disableSceneVision == '1') ? false : (playerTokenId == undefined) ? true : window.TOKEN_OBJECTS[playerTokenId].options.auraislight; // used in drag to know if we should check for wall/LoS collision.
						window.dragSelectedTokens = $(`#tokens .token.tokenselected, #tokens .token[data-group-id='${self.options.groupId}'][style*=' display: none;']`); //set variable for selected tokens that we'll be looking at in drag, deleted in stop.
						
						if (self.selected && window.dragSelectedTokens.length>1) {
							for (let tok of window.dragSelectedTokens){
								let id = $(tok).attr("data-id");
								window.TOKEN_OBJECTS[id].selected = true;
								$(tok).addClass("pause_click");
								if($(tok).is(":animated")){
									window.TOKEN_OBJECTS[id].stopAnimation();
								}
								if (id != self.options.id) {
									let curr = window.TOKEN_OBJECTS[id];
									curr.orig_top = curr.options.top;
									curr.orig_left = curr.options.left;
	 								
	 								curr.prepareWalkableArea();
									
									let el = $("#aura_" + id.replaceAll("/", ""));
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
									el = $("#light_" + id.replaceAll("/", ""));
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
									el = $("#vision_" + id.replaceAll("/", ""));
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
									el = $("[data-darkness='darkness_" + id + "']");
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
									el = $("[data-notatoken='notatoken_" + id + "']");
									if (el.length > 0) {
										el.attr("data-left", el.css("left").replace("px", ""));
										el.attr("data-top", el.css("top").replace("px", ""));
									}
								}

							}												
						}

						let el = $("#aura_" + self.options.id.replaceAll("/", ""));
						if (el.length > 0) {
							el.attr("data-left", el.css("left").replace("px", ""));
							el.attr("data-top", el.css("top").replace("px", ""));
						}
						el = $("#light_" + self.options.id.replaceAll("/", ""));
						if (el.length > 0) {
							el.attr("data-left", el.css("left").replace("px", ""));
							el.attr("data-top", el.css("top").replace("px", ""));
						}
						el = $("#vision_" + self.options.id.replaceAll("/", ""));
						if (el.length > 0) {
							el.attr("data-left", el.css("left").replace("px", ""));
							el.attr("data-top", el.css("top").replace("px", ""));
						}
						el = $("[data-darkness='darkness_" + self.options.id.replaceAll("/", "") + "']");
						if (el.length > 0) {
							el.attr("data-left", el.css("left").replace("px", ""));
							el.attr("data-top", el.css("top").replace("px", ""));
						}
						el = $("[data-notatoken='notatoken_" + self.options.id + "']");
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

						
						let zoom = parseFloat(window.ZOOM);

						let original = ui.originalPosition;
						let tokenX = (ui.position.left - ((zoom-parseFloat(window.orig_zoom)) * parseFloat(self.sizeWidth())/2)) / parseFloat(window.ZOOM);
						let tokenY = (ui.position.top - ((zoom-parseFloat(window.orig_zoom)) * parseFloat(self.sizeHeight())/2)) / parseFloat(window.ZOOM);
						let tinyToken = (Math.round(parseFloat(window.TOKEN_OBJECTS[this.dataset.id].options.gridSquares)*2)/2 < 1) || window.TOKEN_OBJECTS[this.dataset.id].isAoe();

						if (should_snap_to_grid()) {
							tokenX +=  !(tinyToken) ? (parseFloat(window.CURRENT_SCENE_DATA.hpps) / 2) : (parseFloat(window.CURRENT_SCENE_DATA.hpps) / 4);
							tokenY +=  !(tinyToken) ? (parseFloat(window.CURRENT_SCENE_DATA.vpps) / 2) : (parseFloat(window.CURRENT_SCENE_DATA.vpps) / 4) ;
						}
						
						let tokenPosition = snap_point_to_grid(tokenX, tokenY, undefined, tinyToken);

						if(self.walkableArea.bottom != null && self.walkableArea.right != null){ // need to figure out what's causing these to be null but this is a workaround for the error for now
							// Constrain token within scene
							tokenPosition.x = clamp(tokenPosition.x, self.walkableArea.left, self.walkableArea.right);
							tokenPosition.y = clamp(tokenPosition.y, self.walkableArea.top, self.walkableArea.bottom);
						}

						
						ui.position = {
							left: Math.round(tokenPosition.x),
							top: Math.round(tokenPosition.y)
						};
						

						
						

						if(!window.DM && window.playerTokenAuraIsLight){
							const left = (tokenPosition.x + (parseFloat(self.sizeWidth()) / 2)) / parseFloat(window.CURRENT_SCENE_DATA.scale_factor);
							const top = (tokenPosition.y + (parseFloat(self.sizeHeight()) / 2)) / parseFloat(window.CURRENT_SCENE_DATA.scale_factor);
							if(typeof left != 'number' || isNaN(left) || typeof top != 'number' || isNaN(top)){
								showErrorMessage(
								  Error(`One of these values is not a number: Size: ${self.sizeWidth()}, Scene Scale: ${window.CURRENT_SCENE_DATA.scale_factor}, x: ${tokenPosition.x}, y: ${tokenPosition.y}, zoom: ${zoom}, Hpps: ${window.CURRENT_SCENE_DATA.hpps}, Vpps: ${window.CURRENT_SCENE_DATA.vpps}, Containment area: ${JSON.stringify(self.walkableArea)}, OffsetX: ${window.CURRENT_SCENE_DATA.offsetx}, OffsetY: ${window.CURRENT_SCENE_DATA.offsety}`),
								  `To fix this, have the DM delete your token and add it again. Refreshing the page will sometimes fix this as well.`
								)
							}
							
							const pixeldata = ctx.getImageData(left-2, top-2, 4, 4).data;
							let canMove = true;
							if(!self.isAoe()){
								for(let i=0; i<pixeldata.length; i+=4){
									if(pixeldata[i]<253 || pixeldata[i+1]<253 || pixeldata[i+2]<253){
										canMove = false;
										break;
									}
								}
							}
							
							if (canMove)
							{	
								window.oldTokenPosition[self.options.id] = ui.position;				
							}
							else{
								ui.position = (window.oldTokenPosition[self.options.id] != undefined) ? window.oldTokenPosition[self.options.id] : {left: ui.originalPosition.left/zoom, top: ui.originalPosition.top/zoom};
							}	
						}
						
						self.options.left = `${ui.position.left}px`;
						self.options.top = `${ui.position.top}px`;
						const allowTokenMeasurement = get_avtt_setting_value("allowTokenMeasurement")
						
						if (allowTokenMeasurement) {
							requestAnimationFrame(function(){
								const tokenMidX = tokenPosition.x + Math.round(self.sizeWidth() / 2);
								const tokenMidY = tokenPosition.y + Math.round(self.sizeHeight() / 2);

								clear_temp_canvas();
								WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX/window.CURRENT_SCENE_DATA.scale_factor, window.BEGIN_MOUSEY/window.CURRENT_SCENE_DATA.scale_factor, tokenMidX/window.CURRENT_SCENE_DATA.scale_factor, tokenMidY/window.CURRENT_SCENE_DATA.scale_factor);
								WaypointManager.draw(Math.round(tokenPosition.x + (self.sizeWidth() / 2))/window.CURRENT_SCENE_DATA.scale_factor, Math.round(tokenPosition.y + self.sizeHeight() + 10)/window.CURRENT_SCENE_DATA.scale_factor);
								
							})
						}
						if (!self.options.hidden) {
							sendTokenPositionToPeers(tokenPosition.x, tokenPosition.y, self.options.id, allowTokenMeasurement);
						}


						//console.log("Changing to " +ui.position.left+ " "+ui.position.top);
						// HACK TEST 
						/*$(event.target).css("left",ui.position.left);
						$(event.target).css("top",ui.position.top);*/
						// END OF HACK TEST
						requestAnimationFrame(() => {
							let offsetLeft = ui.position.left - parseFloat(self.orig_left);
							let offsetTop = ui.position.top - parseFloat(self.orig_top);
							let el = ui.helper.parent().parent().find("#aura_" + ui.helper.attr("data-id").replaceAll("/", ""));
							if (el.length > 0) {
								let currLeft = parseFloat(el.attr("data-left"));
								let currTop = parseFloat(el.attr("data-top"));
								el.css('left', Math.round((currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))) + "px");
								el.css('top', Math.round((currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)))  + "px");
							}
							el = ui.helper.parent().parent().find("#light_" + ui.helper.attr("data-id").replaceAll("/", ""));
							if (el.length > 0) {
								let currLeft = parseFloat(el.attr("data-left"));
								let currTop = parseFloat(el.attr("data-top"));
								el.css('left', Math.round((currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))) + "px");
								el.css('top', Math.round((currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)))  + "px");
							}
							el = ui.helper.parent().parent().find("#vision_" + ui.helper.attr("data-id").replaceAll("/", ""));
							if (el.length > 0) {
								let currLeft = parseFloat(el.attr("data-left"));
								let currTop = parseFloat(el.attr("data-top"));
								el.css('left', Math.round((currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))) + "px");
								el.css('top', Math.round((currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)))  + "px");
							}
							el = ui.helper.parent().parent().find(`[data-darkness='darkness_${ui.helper.attr("data-id").replaceAll("/", "")}']`);
							if (el.length > 0) {
								let currLeft = parseFloat(el.attr("data-left"));
								let currTop = parseFloat(el.attr("data-top"));
								el.css('left', Math.round((currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))) + "px");
								el.css('top', Math.round((currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)))  + "px");
							}
							el = ui.helper.parent().parent().find(`[data-notatoken='notatoken_${ui.helper.attr("data-id")}']`);
							if (el.length > 0) {
								let currLeft = parseFloat(el.attr("data-left"));
								let currTop = parseFloat(el.attr("data-top"));
								el.css('left', Math.round((currLeft + (offsetLeft/window.CURRENT_SCENE_DATA.scale_factor))) + "px");
								el.css('top', Math.round((currTop + (offsetTop/window.CURRENT_SCENE_DATA.scale_factor)))  + "px");
							}


							if (self.selected && window.dragSelectedTokens.length>1) {
								// if dragging on a selected token, we should move also the other selected tokens
								// try to move other tokens by the same amount
								let offsetLeft = tokenPosition.x - parseInt(self.orig_left);
								let offsetTop = tokenPosition.y - parseInt(self.orig_top);

								for (let tok of window.dragSelectedTokens){
									let id = $(tok).attr("data-id");
									if ((id != self.options.id) && (!window.TOKEN_OBJECTS[id].options.locked || (window.DM && window.TOKEN_OBJECTS[id].options.restrictPlayerMove ||  $('#select_locked .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')))) {


										//console.log("sposto!");
										let curr = window.TOKEN_OBJECTS[id];
										tokenX = offsetLeft + parseInt(curr.orig_left);
										tokenY = offsetTop + parseInt(curr.orig_top);
										if(should_snap_to_grid()){
											let tinyToken = (Math.round(parseFloat(curr.options.gridSquares)*2)/2 < 1) || curr.isAoe();
											let tokenPosition = snap_point_to_grid(tokenX, tokenY, undefined, tinyToken);
							
											tokenY =  Math.round(tokenPosition.y);
											tokenX = Math.round(tokenPosition.x);
										}

										$(tok).css('left', tokenX + "px");
										$(tok).css('top', tokenY + "px");
										curr.options.left =  tokenX + "px";
										curr.options.top = tokenY+"px";
										if(!window.DM && window.playerTokenAuraIsLight){
											const left = (tokenX + (parseFloat(curr.sizeWidth()) / 2)) / parseFloat(window.CURRENT_SCENE_DATA.scale_factor);
											const top = (tokenY + (parseFloat(curr.sizeWidth()) / 2)) / parseFloat(window.CURRENT_SCENE_DATA.scale_factor);
											if(typeof left != 'number' || isNaN(left) || typeof top != 'number' || isNaN(top)){
												showErrorMessage(
												  Error(`One of these values is not a number: Size: ${curr.sizeWidth()}, Scene Scale: ${window.CURRENT_SCENE_DATA.scale_factor}, x: ${tokenPosition.x}, y: ${tokenPosition.y}`),
												  `To fix this, have the DM delete your token and add it again. Refreshing the page will sometimes fix this as well.`
												)
											}									


											const pixeldata = ctx.getImageData(left-2, top-2, 4, 4).data;
											let canMove = true;
											for(let i=0; i<pixeldata.length; i+=4){
												if(pixeldata[i]<253 || pixeldata[i+1]<253 || pixeldata[i+2]<253){
													canMove = false;
													break;
												}
											}
											if (canMove)
											{	
												window.oldTokenPosition[curr.options.id] = {
													left: tokenX,
													top: tokenY
												};				
											}
											else{
												window.oldTokenPosition[curr.options.id] = (window.oldTokenPosition[curr.options.id] != undefined) ? window.oldTokenPosition[curr.options.id] : {left: parseInt(curr.orig_left), top: parseInt(curr.orig_top)};
											
												$(tok).css('left', window.oldTokenPosition[curr.options.id].left + "px");
												$(tok).css('top', window.oldTokenPosition[curr.options.id].top + "px");
											}
										}
										
							
															
										//curr.options.top=(parseInt(curr.orig_top)+offsetTop)+"px";
										//curr.place();
										const tokLeft = parseFloat($(tok).css('left'));
										const tokTop = parseFloat($(tok).css('top'));
										const tokMidLeft = tokLeft + parseFloat(curr.sizeWidth())/2
										const tokMidTop = tokTop + parseFloat(curr.sizeHeight())/2
										let selEl = $(tok).parent().parent().find("#aura_" + id.replaceAll("/", ""));
										if (selEl.length > 0) {
											const selElWidth = parseFloat(selEl.css('width'))/2;
											const selElHeight = parseFloat(selEl.css('height'))/2;
											const auraLeft = Math.round(tokMidLeft/window.CURRENT_SCENE_DATA.scale_factor - selElWidth);
											const auraTop = Math.round(tokMidTop/window.CURRENT_SCENE_DATA.scale_factor - selElHeight);
											selEl.css('left', auraLeft  + "px");
											selEl.css('top', auraTop + "px");
										}
										selEl = $(tok).parent().parent().find("#light_" + id.replaceAll("/", ""));
										if (selEl.length > 0) {
											const selElWidth = parseFloat(selEl.css('width'))/2;
											const selElHeight = parseFloat(selEl.css('height'))/2;
											const auraLeft = Math.round(tokMidLeft/window.CURRENT_SCENE_DATA.scale_factor - selElWidth);
											const auraTop = Math.round(tokMidTop/window.CURRENT_SCENE_DATA.scale_factor - selElHeight);
											selEl.css('left', auraLeft  + "px");
											selEl.css('top', auraTop + "px");
										}
										selEl = $(tok).parent().parent().find("#vision_" + id.replaceAll("/", ""));
										if (selEl.length > 0) {
											const selElWidth = parseFloat(selEl.css('width'))/2;
											const selElHeight = parseFloat(selEl.css('height'))/2;
											const auraLeft = Math.round(tokMidLeft/window.CURRENT_SCENE_DATA.scale_factor - selElWidth);
											const auraTop = Math.round(tokMidTop/window.CURRENT_SCENE_DATA.scale_factor - selElHeight);
											selEl.css('left', auraLeft  + "px");
											selEl.css('top', auraTop + "px");
										}
										selEl = $(tok).parent().parent().find(`[data-darkness='darkness_${id}']`);
										if (selEl.length > 0) {
											const selElWidth = parseFloat(selEl.css('width'))/2;
											const selElHeight = parseFloat(selEl.css('height'))/2;
											const auraLeft = Math.round(tokMidLeft/window.CURRENT_SCENE_DATA.scale_factor - selElWidth);
											const auraTop = Math.round(tokMidTop/window.CURRENT_SCENE_DATA.scale_factor - selElHeight);
											selEl.css('left', auraLeft  + "px");
											selEl.css('top', auraTop + "px");
										}
										selEl = $(tok).parent().parent().find(`[data-notatoken='notatoken_${id}']`);
										if (selEl.length > 0) {
											selEl.css('left', Math.round(parseInt(tokLeft/window.CURRENT_SCENE_DATA.scale_factor))  + "px");
											selEl.css('top', Math.round(parseInt(tokTop/window.CURRENT_SCENE_DATA.scale_factor)) + "px");
										}
									}
								}													
							}
							if(window.EXPERIMENTAL_SETTINGS.dragLight == true)
								throttleLight();
						});
					}
				});
				let classToClick = null;
				if(this.isLineAoe()){
					tok.draggable( "option", "handle", "[data-img]" );
					classToClick = "[data-img]"
				}
				
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
					else if(this.options.lockRestrictDrop == "lock" || this.options.lockRestrictDrop == "declutter"){
						this.options.locked = true;
					}
					else if(this.options.lockRestrictDrop == "none"){
						this.options.locked = false;
						this.options.restrictPlayerMove = false;
					}
				}
				if(!this.options.id.includes('exampleToken')){
					tok.toggleClass('lockedToken', this.options.locked==true)
					tok.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
				}	
				if(this.options.locked ){
					if(window.DM && !$('#select_locked>div.ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')){		
						tok.draggable("disable");
						tok.removeClass("ui-state-disabled");
					}
				}
				if (!window.DM && this.options.restrictPlayerMove && !this.isCurrentPlayer()) {
					tok.draggable("disable");
					tok.removeClass("ui-state-disabled");
				}

				tok.on('dblclick.highlightToken', classToClick, function(e) {
					self.highlight(true); // dont scroll
					let data = {
						id: self.options.id
					};
					window.MB.sendMessage('custom/myVTT/highlight', data);
				})

				tok.on('click.selectToken', classToClick, function() {
					let parentToken = $(this).closest('.token[data-id]');
					if (parentToken.hasClass("pause_click")) {
						return;
					}

					let tokID = parentToken.attr('data-id');
					let groupID = parentToken.attr('data-group-id');
					let thisSelected = !(parentToken.hasClass('tokenselected'));
					let count = 0;
					if (shiftHeld == false) {
						deselect_all_tokens(true);
					}
					if (thisSelected == true) {
						parentToken.addClass('tokenselected');
						toggle_player_selectable(window.TOKEN_OBJECTS[tokID], parentToken)
					} else {
						parentToken.removeClass('tokenselected');
					}				

					window.TOKEN_OBJECTS[tokID].selected = thisSelected;

					for (let id in window.TOKEN_OBJECTS) {
						if (id.selected == true) {
							count++;
						}			
					}

					window.MULTIPLE_TOKEN_SELECTED = (count > 1);
			
					if(window.DM){
				   		$("[id^='light_']").css('visibility', "visible");
				   	}
					draw_selected_token_bounding_box(); // update rotation bounding box
				});
				
				if(this.options.tokenStyleSelect == 'definitelyNotAToken' || this.options.underDarkness){
					tok.toggleClass('underDarkness', true);
					if($(`[data-notatoken='notatoken_${this.options.id}']`).length == 0){
						let tokenClone = tok.clone();
						tokenClone.css({
							left: parseInt(parseFloat(this.options.left) / window.CURRENT_SCENE_DATA.scale_factor),
							top: parseInt(parseFloat(this.options.top) / window.CURRENT_SCENE_DATA.scale_factor),
							'--token-width': `calc(${this.sizeWidth()}px / var(--scene-scale))`,
							'--token-height': `calc(${this.sizeHeight()}px / var(--scene-scale))`,
							width: `var(--token-width)`,
							height: `var(--token-height)`,
							'max-width': `var(--token-width)`,
							'max-height': `var(--token-height)`,
							'--z-index-diff': tok.css('--z-index-diff'),
							'opacity': this.options.hidden ? '0.5' : '1',
							'--hp-percentage': `${this.hpPercentage}%`,
							"--token-border-width": tokenBorderWidth,
							'border-width': tok.find('.token-image').css('border-width'),
		    				"--offsetX": tok.css('--offsetX'),
		    				"--offsetY": tok.css('--offsetY'),
							"--image-opacity": tok.css('--image-opacity'),
							"--view-box": tok.css('--view-box'),
							"--image-zoom": tok.css('--image-zoom')
						})
				        tokenClone.attr('data-notatoken', `notatoken_${this.options.id}`);
				        tokenClone.children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove();    
				        tokenClone.toggleClass('lockedToken', this.options.locked==true)
						tokenClone.toggleClass('declutterToken', this.options.lockRestrictDrop == "declutter")
						tokenClone.attr('data-name', tok.attr('data-name'));
						tokenClone.toggleClass('hasTooltip', $(tok).hasClass('hasTooltip'));
				        $('#token_map_items').append(tokenClone);
					}	
			    }
			    if(window.DM)
					setTokenAudio(tok, this)

				console.groupEnd()
			}
			// HEALTH AURA / DEAD CROSS
			selector = "div[data-id='" + this.options.id + "']";
			let token = $("#tokens").find(selector).add(`[data-notatoken='notatoken_${this.options.id}']`);

			Promise.all([
				new Promise(() => this.build_stats(token)),
				new Promise(() => this.toggle_stats(token)),
				new Promise(() => this.update_health_aura(token)),
				new Promise(() => this.update_dead_cross(token)),
				new Promise(() => toggle_player_selectable(this, token)),
				new Promise(() => {
					if(window.EXPERIMENTAL_SETTINGS.dragLight == true)
						throttleLight();
					else
						debounceLightChecks()
				}),
				new Promise(debounceAudioChecks)
			]).catch((error) => {
		        showError(error, `Failed to start AboveVTT on ${window.location.href}`);
		    });  
			$(`[data-notatoken='notatoken_${this.options.id}']`).children('div:not(.base):not(.token-image):not(.hpvisualbar):not(.dead)').remove();

			console.groupEnd()

			return true;
		}
		catch (e) {
			showError(e);
		}
		if(!window.CURRENT_SCENE_DATA){
			// No scene loaded!
			return;
		}
	


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
		const greaterSize = this.sizeWidth() > this.sizeHeight() ? this.sizeWidth() : this.sizeHeight()
		const scale = this.options.imageSize ? parseFloat(this.options.imageSize) : 1;
		let sizeOnGrid = {
			y: Math.max(greaterSize, window.CURRENT_SCENE_DATA.vpps),
			x: Math.max(greaterSize, window.CURRENT_SCENE_DATA.hpps)
		};

		// Shorten letiable to improve readability
		const multi = this.SCENE_MOVE_GRID_PADDING_MULTIPLIER + (this.SCENE_MOVE_GRID_PADDING_MULTIPLIER*(scale-1)/2); 
		const lineMulti = this.isLineAoe() ? 1 : 0;
		if(this.isLineAoe()){
			sizeOnGrid.x = (sizeOnGrid.x * 0.5);
		}

		this.walkableArea = {
			top:  0 - (sizeOnGrid.y * multi),
			left: 0 - (sizeOnGrid.x * multi),
			right:  parseInt(window.CURRENT_SCENE_DATA.width) * parseFloat(window.CURRENT_SCENE_DATA.scale_factor) + (sizeOnGrid.x * (multi+lineMulti-1)),  // We need to remove 1 token size because tokens are anchored in the top left
			bottom: parseInt(window.CURRENT_SCENE_DATA.height) * parseFloat(window.CURRENT_SCENE_DATA.scale_factor) + (sizeOnGrid.y * (multi-1)), // ... same as above
		};	
		if(this.isLineAoe()){
			this.walkableArea.left -= window.CURRENT_SCENE_DATA.hpps/2;
			this.walkableArea.right -= window.CURRENT_SCENE_DATA.hpps/2;
		}

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
		token.css("pointer-events", "none");
	}
	else{
		tokenImage?.css("cursor","move");
		tokenImage?.css("pointer-events","auto");
		token.css("pointer-events", "");
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
		let mousex = (event.pageX - window.VTTMargin) * (1.0 / window.ZOOM);
		let mousey = (event.pageY - window.VTTMargin) * (1.0 / window.ZOOM);
		WaypointManager.checkNewWaypoint(mousex, mousey);
	}
}

function default_options() {
	return {
		id: uuid(),
		color: random_token_color(),
		conditions: [],
		custom_conditions: [],
		hitPointInfo: {
			maximum: 0,
			current: 0,
			temp: 0
		},
		armorClass: 0,
		name: "",
		aura1: {
			feet: "0",
			color: "rgba(255, 129, 0, 0.3)"
		},
		aura2: {
			feet: "0",
			color: "rgba(255, 255, 0, 0.1)"
		},
		auraislight: true, // this is actually light/vision is enabled now.
		light1: {
			feet: "0",
			color: "rgba(255, 255, 255, 1)" 
		},
		light2: {
			feet: "0",
			color: "rgba(142, 142, 142, 1)"
		},		
		offset: {
			x:0,
			y:0
		}
	};
}

function center_of_view() {
	let centerX = (window.innerWidth/2) + window.scrollX 
	if($("#hide_rightpanel").hasClass("point-right")) {
    centerX = centerX - 190; // 190 = half gamelog + scrollbar
  }
	let centerY = (window.innerHeight/2) + window.scrollY - 20 // 20 = scrollbar
	return { x: centerX, y: centerY };
}

function should_snap_to_grid() {
	return (window.CURRENT_SCENE_DATA.snap == "1" && !(window.toggleSnap))
		|| ((window.CURRENT_SCENE_DATA.snap != "1") && window.toggleSnap);
}

function snap_point_to_grid(mapX, mapY, forceSnap = false, tinyToken = false) {
	if (forceSnap || should_snap_to_grid()) {
		// adjust to the nearest square coordinate
		let startX = parseFloat(window.CURRENT_SCENE_DATA.offsetx);
		let startY = parseFloat(window.CURRENT_SCENE_DATA.offsety); 


		const gridWidth = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? parseFloat(window.hexGridSize.width) * parseFloat(window.CURRENT_SCENE_DATA.scaleAdjustment.x) : (!tinyToken) ? parseFloat(window.CURRENT_SCENE_DATA.hpps) : parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
		const gridHeight = (window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1) ? parseFloat(window.hexGridSize.height) * parseFloat(window.CURRENT_SCENE_DATA.scaleAdjustment.y) : (!tinyToken) ? parseFloat(window.CURRENT_SCENE_DATA.vpps) : parseFloat(window.CURRENT_SCENE_DATA.vpps/2);
		
		let currentGridX = Math.floor((mapX - startX) / gridWidth);
		let currentGridY = Math.floor((mapY - startY) / gridHeight);
		if(window.CURRENT_SCENE_DATA.gridType == 3 && currentGridX % 2 == 1){ //replace with current scene when setting exists
			currentGridY += 0.5;
		}
		else if(window.CURRENT_SCENE_DATA.gridType == 2 && currentGridY % 2 == 1){//replace with current scene when setting exists
			currentGridX += 0.5;
		} 

		if(window.CURRENT_SCENE_DATA.gridType == 3){
			startX = startX + window.hexGridSize.width/2 * window.CURRENT_SCENE_DATA.scaleAdjustment.x;
		}else if(window.CURRENT_SCENE_DATA.gridType == 2){
			startY = startY + window.hexGridSize.height/2 * window.CURRENT_SCENE_DATA.scaleAdjustment.y;
		}
		return {
			x: Math.ceil((currentGridX * gridWidth) + startX),
			y: Math.ceil((currentGridY * gridHeight) + startY)
		}
	} else {
		return { x: mapX, y: mapY };
	}
}

function convert_point_from_view_to_map(pageX, pageY, forceNoSnap = false, ignoreOffset = false) {
	// adjust for map offset and zoom
	const startX = ignoreOffset == false ? window.CURRENT_SCENE_DATA.offsetx : 0;
	const startY = ignoreOffset == false ? window.CURRENT_SCENE_DATA.offsety : 0;
	let mapX = ((pageX - window.VTTMargin) * (1.0 / window.ZOOM)) - startX;
	let mapY = ((pageY - window.VTTMargin) * (1.0 / window.ZOOM)) - startY;
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
	let pageX = mapX / (1 / window.ZOOM) + window.VTTMargin;
	let pageY = mapY / (1 / window.ZOOM) + window.VTTMargin;
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

	const pc = find_pc_by_player_id(tokenObject.id, false) || {};

	let options = {
		...default_options(),
		...window.TOKEN_SETTINGS,
		...pc,
		...tokenObject,
		id: tokenObject.id // pc.id uses the DDB characterId, but we want to use the pc.sheet for player ids. So just use whatever we were given with tokenObject.id
	};
	if(window.all_token_objects[options.id] !== undefined && options.alternativeImages){
		if(!(window.all_token_objects[options.id].options.imgsrc in options.alternativeImages)){
			window.all_token_objects[options.id].options.imgsrc = options.imgsrc;
		}
		let alternativeImages = options.alternativeImages;
		options = {
			...options,
			...window.all_token_objects[options.id].options,
			alternativeImages: alternativeImages
		};
	}
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


	
	options.left = `${x - options.size/2}px`;
	options.top = `${y - options.size/2}px`;
	options.scaleCreated = parseFloat(window.CURRENT_SCENE_DATA.scale_factor) ? parseFloat(window.CURRENT_SCENE_DATA.scale_factor) : 1;
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

	if (is_player_id(options.id)) {
		update_pc_token_rows();
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
		for (let i = arr.length; i--;) {
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

function determine_grouped_classname(tokenIds) {
	let allGroupedStatus = tokenIds
		.map(id => window.TOKEN_OBJECTS[id].options.groupId !== undefined)
		.filter(t => t !== undefined);
	let uniqueGroupedStates = [...new Set(allGroupedStatus)];

	if (uniqueGroupedStates.length === 0 || (uniqueGroupedStates.length === 1 && uniqueGroupedStates[0] === false)) {
		// none of these tokens are hidden
		return "none-active";
	} else if (uniqueGroupedStates.length === 1 && uniqueGroupedStates[0] === true) {
		// everything we were given is hidden. If we were given a single thing, return single, else return all
		// return tokenIds.length === 1 ? "single-active active-condition" : "all-active active-condition";
		return "single-active active-condition";
	} else {
		// some, but not all of the things are hidden
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
		let initialX;
		let initialY;
		$("#tokens").on("touchstart", ".VTTToken, .door-button", function(event) {
			initialX = event.touches[0].clientX;
			initialY = event.touches[0].clientY;
		    LongPressTimer = setTimeout(function() {
			    console.log("context_menu_flyout contextmenu event", event);
				
				if ($(event.currentTarget).hasClass("tokenselected") && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
					token_context_menu_expanded(window.CURRENTLY_SELECTED_TOKENS, event);
				} else {
					token_context_menu_expanded([$(event.currentTarget).attr("data-id")], event);
				}
		    }, 600)
		  })
		  .on('touchend', function(e) {
		    clearTimeout(LongPressTimer)
		  })
		  .on('touchmove', function(e) {
		  	let currentY = e.touches[0].clientY;
		  	let currentX = e.touches[0].clientX;
		  	if(Math.abs(initialX-currentX) > 15 || Math.abs(initialY-currentY) > 15 ){
		  		clearTimeout(LongPressTimer)
		  	}
		    
		  });
		$("#tokens").on("contextmenu", ".VTTToken, .door-button", function(event) {
			console.log("context_menu_flyout contextmenu event", event);
			event.preventDefault();
			event.stopPropagation();
		
			if ($(event.currentTarget).hasClass("tokenselected") && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
				token_context_menu_expanded(window.CURRENTLY_SELECTED_TOKENS, event);
			} else {
				token_context_menu_expanded([$(event.currentTarget).attr("data-id")], event);
			}
		});
		return;
}

function deselect_all_tokens(ignoreVisionUpdate = false) {
	window.MULTIPLE_TOKEN_SELECTED = false;
	for (let id in window.TOKEN_OBJECTS) {
		let curr = window.TOKEN_OBJECTS[id];
		if (curr.selected) {
			curr.selected = false;
			$(`.token[data-id='${id}']`).toggleClass('tokenselected', false);
		}
	}
	remove_selected_token_bounding_box();
	window.CURRENTLY_SELECTED_TOKENS = [];
	if(ignoreVisionUpdate == false){
		let darknessFilter = (window.CURRENT_SCENE_DATA.darkness_filter != undefined) ? window.CURRENT_SCENE_DATA.darkness_filter : 0;
		let darknessPercent = window.DM ? Math.max(40, 100 - parseInt(darknessFilter)) : 100 - parseInt(darknessFilter); 	

	 	if(window.DM && darknessPercent < 40){
	 		darknessPercent = 40;
	 		$('#raycastingCanvas').css('opacity', '0');
	 	}
	 	else if(window.DM){
	 		$('#raycastingCanvas').css('opacity', '');
	 	}
		$('#VTT').css('--darkness-filter', darknessPercent + "%");
	   	if(window.DM){
	   		$("#light_container [id^='light_']").css('visibility', "visible");
	   		$(`.token`).show();
			$(`.door-button`).css('visibility', '');
			$(`.aura-element`).show();
	   	}
	   	if($('#selected_token_vision .ddbc-tab-options__header-heading--is-active').length==0){
	   		window.SelectedTokenVision = false;
	   	}
  	}
}

function token_health_aura(hpPercentage, auraType) {
	const percentToCSSColor = function(p) {
		if(p > 100) return "rgb(0 0 255 / 60%)";
		if(p > 99) p = 99;
		const r = p < 50 ? 255 : Math.floor(255 * ((50 - p % 50) / 50));
		const g = p < 50 ? Math.floor(255 * (p / 50)) : 255;
		return `rgb(${r} ${g} 0 / 100%)`;
	};
	return (auraType && auraType.startsWith('aura-bloodied-')) ? ((hpPercentage > parseInt(auraType.split('-')[2])) ? "rgb(0 0 0 / 0%)" : "rgb(255 0 0 / 100%)") : percentToCSSColor(hpPercentage);
}

function setTokenAudio(tokenOnMap, token){
	if(token.options.audioChannel){
		let audioId = token.options.audioChannel?.audioId != undefined ? token.options.audioChannel.audioId : uuid();

		if(window.MIXER.state().channels[audioId] == undefined ){
			if(window.TokenAudioLevels == undefined){
				window.TokenAudioLevels = {}
			}
			window.TokenAudioLevels[audioId] = 0;
			window.MIXER.addChannel(token.options.audioChannel, audioId);
		}
		
	}
}

function checkAudioVolume(){
	let audioTokens = $('.audio-token');
	let tokensToCheck = [];
	if(window.TokenAudioLevels == undefined){
		window.TokenAudioLevels ={}
	}
	

	if(window.DM || window.SelectedTokenVision == true){
		let selectedTokens = $('.tokenselected');
		for(let i=0; i<selectedTokens.length; i++){
			tokensToCheck.push($(selectedTokens[i]).attr('data-id'))
		}
	}else{
		let playerTokenId = $(`#tokens .token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
		for(let tokenId in window.TOKEN_OBJECTS){
			if(tokenId.includes(window.PLAYER_ID) || window.TOKEN_OBJECTS[tokenId].options.player_owned == true || window.TOKEN_OBJECTS[tokenId].options.share_vision == true || window.TOKEN_OBJECTS[tokenId].options.share_vision == window.myUser || (playerTokenId == undefined && window.TOKEN_OBJECTS[tokenId].options.itemType == 'pc'))
		  		tokensToCheck.push(tokenId)
		}
	}

	for(let i=0; i< audioTokens.length; i++){
		let calcVolume = 0;
		let currAudioToken = window.TOKEN_OBJECTS[$(audioTokens[i]).attr('data-id')];
		let attenuate = currAudioToken.options.audioChannel.attenuate;
		let wallsBlocked = currAudioToken.options.audioChannel.wallsBlocked;
		let range = currAudioToken.options.audioChannel.range/parseFloat(window.CURRENT_SCENE_DATA.fpsq) * parseFloat(window.CURRENT_SCENE_DATA.hpps);


		let currAudioPosition ={
			x: parseInt(currAudioToken.options.left.replace('px', '')) + currAudioToken.sizeWidth()/2,
			y: parseInt(currAudioToken.options.top.replace('px', '')) + currAudioToken.sizeHeight()/2
		}
		for(let checkedTokenId in tokensToCheck){
			let checkedToken = window.TOKEN_OBJECTS[tokensToCheck[checkedTokenId]];	

			

			let tokenMovePolygon = window.lineOfSightPolygons[tokensToCheck[checkedTokenId]]?.move
			let audioCanvas = document.createElement('canvas');
			let audioCanvasCtx = audioCanvas.getContext('2d');
			audioCanvas.width = $("#raycastingCanvas").width();
			audioCanvas.height =  $("#raycastingCanvas").height();
			
			
			if(tokenMovePolygon != undefined){
				drawPolygon(audioCanvasCtx, tokenMovePolygon, 'rgba(255, 255, 255, 1)', true); 	
			}

			let checkedTokenPosition ={
				x: parseInt(checkedToken.options.left.replace('px', '')) + checkedToken.sizeWidth()/2,
				y: parseInt(checkedToken.options.top.replace('px', '')) + checkedToken.sizeHeight()/2
			}


		  	let dx = checkedTokenPosition.x - currAudioPosition.x,
		      	dy = checkedTokenPosition.y - currAudioPosition.y;
		    let distanceApart = Math.sqrt(dx * dx + dy * dy) 
		 	let inRange =  distanceApart <= range;

		 	
		 	
		 	let tempCalcVolume = (attenuate && inRange) ? ((range-distanceApart)/range) : (inRange) ? 1 : 0
		 	 

			let setAudio = (inRange && !wallsBlocked) || (inRange && wallsBlocked && tokenMovePolygon != undefined && is_token_in_raycasting_context($(audioTokens[i]).attr('data-id'), audioCanvasCtx))
			if(setAudio){
			//set volume to calculated volume
				calcVolume = (tempCalcVolume > calcVolume) ? tempCalcVolume : calcVolume
			}			
		}

		let audioId = currAudioToken.options.audioChannel.audioId;
		window.TokenAudioLevels[audioId] = calcVolume
		
		if(tokensToCheck.length == 0){
			window.TokenAudioLevels[audioId] = 0;
			//set volume to 0
		}
		let audioInMixer = window.MIXER.state().channels[audioId];
		window.MIXER._players[audioId].volume  = (window.TokenAudioLevels != undefined) ? window.TokenAudioLevels[audioId] != undefined ? window.MIXER.volume * audioInMixer.volume * window.TokenAudioLevels[audioId] : window.MIXER.volume * audioInMixer.volume : window.MIXER.volume * audioInMixer.volume;             
		
	}
	
}

function setAudioAura (token, options){
		
		const auraRadius = parseFloat(options.audioChannel.range) / parseInt(window.CURRENT_SCENE_DATA.fpsq) * window.CURRENT_SCENE_DATA.hpps;
		const auraBg = `radial-gradient(transparent ${auraRadius+(parseInt(options.size)/2)-4}px, #fff ${auraRadius+(parseInt(options.size)/2)-4}px ${auraRadius+(parseInt(options.size)/2)}px);`;
		const totalSize = parseInt(options.size) + (2 * auraRadius);
		const absPosOffset = (options.size - totalSize) / 2;
		const auraStyles = `width:${totalSize}px;
							height:${totalSize}px;
							left:${absPosOffset}px;
							top:${absPosOffset}px;
							background-image:${auraBg};
							filter: drop-shadow(2px 4px 0px black)
							`;

		token.find('.audio-radius').attr('style', auraStyles)

}


function setTokenAuras (token, options) {
	if (!options.aura1 || options.id.includes('exampleToken')) return;

	const innerAuraSize = options.aura1.feet.length > 0 ? (options.aura1.feet / parseInt(window.CURRENT_SCENE_DATA.fpsq)) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	const outerAuraSize = options.aura2.feet.length > 0 ? (options.aura2.feet / parseInt(window.CURRENT_SCENE_DATA.fpsq)) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	if ((innerAuraSize > 0 || outerAuraSize > 0) && options.auraVisible) {
		// use sizeWidth and sizeHeight???
		
		const auraRadius = innerAuraSize ? (innerAuraSize + (options.size/window.CURRENT_SCENE_DATA.scale_factor / 2)) : 0;
		const totalAura = auraRadius + outerAuraSize;
		const auraBg = `radial-gradient(${options.aura1.color} ${auraRadius}px, ${options.aura2.color} ${auraRadius}px ${totalAura}px);`;
		const totalSize = (2 * totalAura);
		const absPosOffset = (options.size/window.CURRENT_SCENE_DATA.scale_factor - totalSize) / 2;
		const tokenId = options.id.replaceAll("/", "").replaceAll('.', '');
		const showAura = (token.parent().parent().find("#aura_" + tokenId).length > 0) ? token.parent().parent().find("#aura_" + tokenId).css('display') : '';
		
		const color1Values = options.aura1.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(0, 3).join();
		const color2Values = options.aura2.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(0, 3).join();
		const opacity1Value = options.aura1.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(3, 1);
		const opacity2Value = options.aura2.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(3, 1);
		


		const auraStyles = `width:${totalSize}px;
							height:${totalSize}px;
							left:${absPosOffset}px;
							top:${absPosOffset}px;
							background-image:${auraBg};
							left:${parseFloat(options.left.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor + absPosOffset}px;
							top:${parseFloat(options.top.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor + absPosOffset}px;
							display:${showAura};
							--color1: ${color1Values};
							--color2: ${color2Values};	
							--opacity1: ${opacity1Value};
							--opacity2: ${opacity2Value};
							--gradient: ${auraBg};
							--animation-width: ${totalSize < 150 ? `${totalSize * 3}px, ${totalSize * 3}px` : `cover`};
							--radius1: ${auraRadius}px;
							--radius2: ${totalAura}px;
							--rotation: ${options.rotation}deg;
							`;
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
			(options.hidden || (options.hideaura && !token.attr("data-id").includes(window.PLAYER_ID)) || showAura == 'none') ? token.parent().parent().find("#aura_" + tokenId).hide()
						: token.parent().parent().find("#aura_" + tokenId).show()
		}
		if(options.animation?.aura && options.animation?.aura != 'none'){
			if(options.animation.customAuraMask != undefined){
				if(options.animation.customAuraRotate == true){
					token.parent().parent().find("#aura_" + tokenId).attr('data-animation', 'aurafx-rotate')
				}
				else{
					token.parent().parent().find("#aura_" + tokenId).attr('data-animation', '')
				}
				token.parent().parent().find("#aura_" + tokenId).attr('data-custom-animation', 'true')
				token.parent().parent().find("#aura_" + tokenId).css('--custom-mask-image', `url('${parse_img(options.animation.customAuraMask)}')`)
			}
			else{
				token.parent().parent().find("#aura_" + tokenId).attr('data-animation', options.animation.aura)
			}				
		}
		else{
			token.parent().parent().find("#aura_" + tokenId).removeAttr('data-animation')
		}

		
	} else {
		const tokenId = token.attr("data-id").replaceAll("/", "");
		token.parent().parent().find("#aura_" + tokenId).remove();
	}
}

function setTokenLight (token, options) {
	if (!options.light1 || window.CURRENT_SCENE_DATA.disableSceneVision == true || options.id.includes('exampleToken')) return;
	const innerlightSize = options.light1.feet != undefined? (options.light1.feet / parseInt(window.CURRENT_SCENE_DATA.fpsq)) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	const outerlightSize = options.light2.feet != undefined ? (options.light2.feet / parseInt(window.CURRENT_SCENE_DATA.fpsq)) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	const visionSize = options.vision.feet != undefined ? (options.vision.feet / parseInt(window.CURRENT_SCENE_DATA.fpsq)) * window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor  : 0;
	const tokenId = options.id.replaceAll("/", "").replaceAll('.', '');
	if (options.auraislight) {

		const isDoor = options.type == 'door';

		const optionsSize = isDoor ? 0 : parseFloat(options.size)/window.CURRENT_SCENE_DATA.scale_factor
		let optionsLeft = isDoor ? (parseFloat(options.left.replace('px', ''))+25)/window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion : parseFloat(options.left.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor
		let optionsTop  = isDoor ? (parseFloat(options.top.replace('px', ''))+25)/window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion : parseFloat(options.top.replace('px', ''))/window.CURRENT_SCENE_DATA.scale_factor
		
	
		if(isDoor){
			const doorButton = $(`.door-button[data-id='${options.id}']`);
			if(doorButton.length>0){
				const x1 = doorButton.attr('data-x1');
				const x2 = doorButton.attr('data-x2');
				const y1 = doorButton.attr('data-y1');
				const y2 = doorButton.attr('data-y2');
				const doors = window.DRAWINGS.filter(d => (d[1] == "wall" && d[3] == x1 && d[4] == y1 && d[5] == x2 && d[6] == y2))  
	            const doorScale = doors[0][8];
	            optionsLeft = optionsLeft/(doorScale/window.CURRENT_SCENE_DATA.scale_factor);
				optionsTop = optionsTop/(doorScale/window.CURRENT_SCENE_DATA.scale_factor);
			}	
			else{
				console.warn('Door light attempted to be placed before door button')
				return;
			}
		}

		// use sizeWidth and sizeHeight???
		
		const lightRadius = innerlightSize ? (innerlightSize + (optionsSize / 2)) : 0;
		const totallight = lightRadius + outerlightSize;
		const lightBg = `radial-gradient(${options.light1.daylight ? 'var(--daylight-color)' : options.light1.color} ${lightRadius}px, ${options.light2.daylight ? 'var(--daylight-color)' : options.light2.color} ${lightRadius}px ${totallight}px);`;
		const totalSize = (totallight == 0) ? 0 : (2 * totallight);
		const absPosOffset = (optionsSize - totalSize) / 2;
		
		const color1Values = options?.light1?.color ? options.light1.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(0, 3).join() : '255, 255, 255';
		const color2Values = options?.light2?.color ? options.light2.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(0, 3).join() : '142, 142, 142';
		const daylightValues = window.CURRENT_SCENE_DATA?.daylight ? window.CURRENT_SCENE_DATA.daylight.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(0, 3).join() : '255, 255, 255';
		const opacity1Value = options?.light1?.color ? options.light1.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(3, 1) : 1;
		const opacity2Value = options?.light2?.color ? options.light2.color.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(3, 1) : 1;
		const daylightOpacityValue = window.CURRENT_SCENE_DATA?.daylight ? window.CURRENT_SCENE_DATA.daylight.replace(/[a-zA-Z\(\)\s]/g, '').split(',').splice(3, 1) : 1;

		let clippath = window.lineOfSightPolygons ? `path("${window.lineOfSightPolygons[options.id]?.clippath}")` : undefined;
		const lightStyles = `width:${totalSize }px;
							height:${totalSize }px;
							background-image:${lightBg};
							left:${optionsLeft + absPosOffset}px;
							top:${optionsTop+ absPosOffset}px;
							--color1: ${options.light1.daylight ? daylightValues : color1Values};
							--color2: ${options.light2.daylight ? daylightValues : color2Values};
							--opacity1: ${options.light1.daylight ? daylightOpacityValue : opacity1Value};
							--opacity2: ${options.light2.daylight ? daylightOpacityValue : opacity2Value};
							--gradient: ${lightBg};
							--animation-width: ${totalSize < 150 ? `${totalSize * 3}px, ${totalSize * 3}px` : `cover`};
							--radius1: ${lightRadius}px;
							--radius2: ${totallight}px;
							--rotation: ${options.rotation}deg;
							`;



		const visionRadius = visionSize ? (visionSize + (optionsSize / 2)) : 0;
		const visionBg = `radial-gradient(${options.vision.color ? options.vision.color : `rgba(142, 142, 142, 1)`} ${visionRadius}px, #00000000 ${visionRadius}px)`;
		const totalVisionSize = optionsSize + (2 * visionSize);
		const visionAbsPosOffset = (optionsSize - totalVisionSize) / 2;
		const visionStyles = `width:${totalVisionSize }px;
							height:${totalVisionSize }px;
							left:${visionAbsPosOffset}px;
							top:${visionAbsPosOffset}px;
							background-image:${visionBg};
							left:${optionsLeft + visionAbsPosOffset}px;
							top:${optionsTop + visionAbsPosOffset}px;
							--vision-radius: ${visionRadius}px;
							--vision-color: ${options.vision.color};
							--rotation: ${options.rotation}deg;
							`;
		

		

		token.parent().parent().find(".aura-element-container-clip[id='" + options.id+"']").remove();


		const lightElement = options.sight =='devilsight' || options.sight =='truesight' ?  $(`<div class='aura-element-container-clip light' style='clip-path: ${clippath};' id='${options.id}'><div class='aura-element' id="light_${tokenId}" data-id='${options.id}' style='${lightStyles}'></div></div><div class='aura-element-container-clip vision' style='clip-path: ${clippath};' id='${options.id}'><div class='aura-element darkvision' id="vision_${tokenId}" data-id='${options.id}' style='${visionStyles}'></div></div>`) : $(`<div class='aura-element-container-clip light' style='clip-path: ${clippath};' id='${options.id}'><div class='aura-element' id="light_${tokenId}" data-id='${options.id}' style='${lightStyles}'></div><div class='aura-element darkvision' id="vision_${tokenId}" data-id='${options.id}' style='${visionStyles}'></div></div>`) 

		lightElement.contextmenu(function(){return false;});
		if(visionRadius != 0 || totallight != 0 || options.player_owned || options.share_vision == true || options.share_vision == window.myUser || is_player_id(options.id)){
			$("#light_container").prepend(lightElement);
			if(clippath == undefined){
				debounceLightChecks();
			}
		}
		

		if(options.animation?.light && options.animation?.light != 'none'){

			if(options.animation.customLightMask != undefined){
				if(options.animation.customLightRotate == true){
					token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").attr('data-animation', 'aurafx-rotate')
				}
				else{
					token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").attr('data-animation', '')
				}
				if(options.animation.customLightDarkvision != undefined){
					token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").toggleClass('darkvision-animation', options.animation.customLightDarkvision)
				}
				token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").attr('data-custom-animation', 'true')
				token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").css('--custom-mask-image', `url('${parse_img(options.animation.customLightMask)}')`)
			}
			else{
				token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").attr('data-animation', options.animation.light)
			}
			
		}
		else{
			token.parent().parent().find(".aura-element-container-clip[id='" + options.id +"']").removeAttr('data-animation')
		}
		if(window.DM){
			(options.hidden && options.reveal_light == 'never') ? token.parent().parent().find("#vision_" + tokenId).css("opacity", 0.5)
			: token.parent().parent().find("#vision_" + tokenId).css("opacity", 1)
		}
		else{
			options.hidden ? token.parent().parent().find("#vision_" + tokenId).hide()
						: token.parent().parent().find("#vision_" + tokenId).show()
		}
		if(totalSize > 0){
			token.parent().parent().find("#light_" + tokenId).show()		
		}
		else{
			token.parent().parent().find("#light_" + tokenId).hide()
		}
		token.parent().parent().find("#light_" + tokenId).toggleClass("islight", true);
	} else {
		token.parent().parent().find(`.aura-element-container-clip[id='${options.id}']`).remove();
	}
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
	if(!window.DM){		
		let vision = $("[id*='vision_']");
		for(let i = 0; i < vision.length; i++){
			if(!vision[i].id.endsWith(window.PLAYER_ID) && window.TOKEN_OBJECTS[$(vision[i]).attr("data-id")].options.share_vision != true && window.TOKEN_OBJECTS[$(vision[i]).attr("data-id")].options.share_vision != window.myUser){
				$(vision[i]).css("visibility", "hidden");
			}		
			if(playerTokenId == undefined && window.TOKEN_OBJECTS[$(vision[i]).attr("data-id")].options.itemType == 'pc'){
				$(vision[i]).css("visibility", "visible");
			}	
		}
	}

	if(options.type == 'door' && $(`.door-button[data-id='${options.id}']`).hasClass('closed') && $(`.door-button[data-id='${options.id}'] .door`).length > 0){
		$(".aura-element-container-clip[id='" + options.id +"']").css("display", "none")
	}
	else if(options.type == 'door'){
		$(".aura-element-container-clip[id='" + options.id +"']").css("display", "")
	}
	if((options.sight=='devilsight' || options.sight=='truesight') && (options.share_vision == true || options.share_vision == window.myUser || options.id.includes(window.PLAYER_ID) || window.DM || (is_player_id(options.id) && playerTokenId == undefined))){
		token.parent().parent().find(`.aura-element-container-clip[id='${options.id}']`).toggleClass('devilsight', true);	
		token.parent().parent().find(`.aura-element-container-clip[id='${options.id}']`).toggleClass('truesight', options.sight=='truesight');
	}
	else{
		token.parent().parent().find(`.aura-element-container-clip[id='${options.id}']`).toggleClass(['devilsight', 'truesight'], false);
	}

}

function setTokenBase(token, options) {
	if(options.imgsrc?.startsWith("class"))
		return;
	$(`.token[data-id='${options.id}']>.base`).remove();
	let base = $(`<div class='base'></div>`);
	if(options.size < 150){
		base.toggleClass("large-or-smaller-base", true);
	}
	else{
		base.toggleClass("large-or-smaller-base", false);
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
		token.children(".token-image").toggleClass("freeform", false);
		token.toggleClass("freeform", false);
	}

	if (options.tokenStyleSelect === "circle") {
		//Circle
		options.square = false;
		options.legacyaspectratio = true;
		token.children(".token-image").css("border-radius", "50%")
		token.children(".token-image").removeClass("preserve-aspect-ratio");
		token.toggleClass("square", false);
	}
	else if(options.tokenStyleSelect === "square"){
		//Square
		options.square = true;
		options.legacyaspectratio = true;
		token.children(".token-image").css("border-radius", "0");
		token.children(".token-image").removeClass("preserve-aspect-ratio");
		token.toggleClass("square", true);
	}
	else if(options.tokenStyleSelect === "noConstraint" || options.tokenStyleSelect === "definitelyNotAToken" || options.tokenStyleSelect === "labelToken" ) {
		//Freeform
		options.square = true;
		options.legacyaspectratio = false;
		if(options.tokenStyleSelect === "definitelyNotAToken" || options.tokenStyleSelect === "labelToken"){
			options.restrictPlayerMove = true;
			options.disablestat = true;
			options.disableborder = true;
			options.disableaura = true;
			options.enablepercenthpbar = false;
			if(options.tokenStyleSelect === "definitelyNotAToken"){
				token.toggleClass('definitelyNotAToken', true);
				options.underDarkness = true;
			}
			else{
				token.toggleClass('labelToken', true);
			}
		}

		token.children(".token-image").css("border-radius", "0");
		token.children(".token-image").addClass("preserve-aspect-ratio");
		token.children(".token-image").toggleClass("freeform", true);
		token.toggleClass("freeform", true);
	}
	else if(options.tokenStyleSelect === "virtualMiniCircle"){
		$(`.token[data-id='${options.id}']`).prepend(base);
		//Virtual Mini Circle
		options.square = true;
		options.legacyaspectratio = false;
		token.children(".token-image").css("border-radius", "0");
		token.children(".token-image").addClass("preserve-aspect-ratio");
	}
	else if(options.tokenStyleSelect === "virtualMiniSquare"){
		$(`.token[data-id='${options.id}']`).prepend(base);
		//Virtual Mini Square
		options.square = true;
		options.legacyaspectratio = false;
		token.children(".token-image").css("border-radius", "0");
		token.children(".token-image").addClass("preserve-aspect-ratio");
	}

	
	token.toggleClass('labelToken', (options.tokenStyleSelect == 'labelToken' || options.alwaysshowname == true ));


	if(options.tokenStyleSelect != 'definitelyNotAToken'){
		token.toggleClass('definitelyNotAToken', false);
	}

	if(options.tokenStyleSelect === "virtualMiniCircle" || options.tokenStyleSelect === "virtualMiniSquare"){
		if(options.disableborder == true){
			base.toggleClass("noborder", true);
		}
		else{
			base.toggleClass("noborder", false);
		}

		if(options.disableaura == true){
			base.toggleClass("nohpaura", true);
		}
		else{
			base.toggleClass("nohpaura", false);
		}
		token.toggleClass("hasbase", true);
	}
	else{
		token.toggleClass("hasbase", false);
	}


	base.toggleClass("border-color-base", false);
	base.toggleClass("grass-base", false);
	base.toggleClass("rock-base", false);
	base.toggleClass("tile-base", false);
	base.toggleClass("sand-base", false);
	base.toggleClass("water-base", false);


	if(options.tokenBaseStyleSelect === "border-color"){
		base.toggleClass("border-color-base", true);
	}
	else if(options.tokenBaseStyleSelect === "grass"){
		base.toggleClass("grass-base", true);
	}
	else if(options.tokenBaseStyleSelect === "tile"){
		base.toggleClass("tile-base", true);
	}
	else if(options.tokenBaseStyleSelect === "sand"){
		base.toggleClass("sand-base", true);
	}
	else if(options.tokenBaseStyleSelect === "rock"){
		base.toggleClass("rock-base", true);
	}
	else if(options.tokenBaseStyleSelect === "water"){
		base.toggleClass("water-base", true);
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
	let $temp = $("<textarea>");
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

function rotation_towards_cursor_from_point(tokenCenterX, tokenCenterY, mousex, mousey, largerSnapAngle) {
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


const debounceDrawSelectedToken = mydebounce(() => {
		do_draw_selected_token_bounding_box();
	}, 100);

function draw_selected_token_bounding_box(){
	debounceDrawSelectedToken();
}


/// draws a rectangle around every selected token, and adds a rotation grabber
async function do_draw_selected_token_bounding_box() {
	remove_selected_token_bounding_box()
	// hold a separate list of selected ids so we don't have to iterate all tokens during bulk token operations like rotation
	window.CURRENTLY_SELECTED_TOKENS = [];
	let promises = [];
	let selected = Object.fromEntries(
					   Object.entries(window.TOKEN_OBJECTS).filter(
					      ([key, val])=> window.TOKEN_OBJECTS[key].selected == true
					   )
					);
	let groupIDs = [];
	for (let id in selected) {
		let selector = "div[data-id='" + id + "']";
		
		promises.push(new Promise((resolve) => {
			toggle_player_selectable(window.TOKEN_OBJECTS[id], $("#tokens").find(selector)); 
			resolve();
		}));	
		window.CURRENTLY_SELECTED_TOKENS.push(id);	
		$("#tokens").find(selector).toggleClass('tokenselected', true);	
		if(window.TOKEN_OBJECTS[id].options.groupId && !groupIDs.includes(window.TOKEN_OBJECTS[id].options.groupId)){
			groupIDs.push(window.TOKEN_OBJECTS[id].options.groupId)
		}
	}

	for(let index in groupIDs){
		let tokens = $(`.token[data-group-id='${groupIDs[index]}']`)
		tokens.each(function(){
			if(window.CURRENTLY_SELECTED_TOKENS.includes($(this).attr('data-id')))
				return;
			$(this).toggleClass('tokenselected', true);	
			window.TOKEN_OBJECTS[$(this).attr('data-id')].selected = true;	
			window.CURRENTLY_SELECTED_TOKENS.push($(this).attr('data-id'));
		})
	}

	Promise.allSettled(promises)
		.then(() => {
			if (window.CURRENTLY_SELECTED_TOKENS == undefined || window.CURRENTLY_SELECTED_TOKENS.length == 0) {
				return;
			}
			// find the farthest edges of our tokens
			let top = undefined;
			let bottom = undefined;
			let right = undefined;
			let left = undefined;
			for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
				
				let id = window.CURRENTLY_SELECTED_TOKENS[i];
				let token = window.TOKEN_OBJECTS[id];
				if(!window.DM && $(`div.token[data-id='${id}']`).css('display') == 'none')
					continue;
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
			let boundingBox = $("<div id='selectedTokensBorder' />");
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
			let connector = $("<div id='selectedTokensBorderRotationGrabberConnector' />");
			connector.css("position", "absolute");
			connector.css('top', `${top - grabberDistance}px`);
			connector.css('left', `${centerHorizontal}px`);
			connector.css('width', `0px`);
			connector.css('height', `${grabberDistance}px`);
			connector.css('z-index', zIndex);
			connector.css('border', '1px solid white');
			$("#tokens").append(connector);

			// draw eye grabber holder
			let holder = $("<div id='rotationGrabberHolder' />");
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
			let grabber = $('<div id="rotationGrabber"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata><g><path d="M500,685c-103.7,0-187.8-84-187.8-187.9c0-103.7,84.1-187.8,187.8-187.8c103.8,0,187.9,84.1,187.9,187.8C687.9,601,603.8,685,500,685z M990,500c0,0-245.9-265.5-490-265.5C255.9,234.5,10,500,10,500s245.9,265.4,490,265.4c130.4,0,261.2-75.7,354.9-146.2 M500,405.1c-50.8,0-92,41.3-92,92.1c0,50.7,41.3,92.1,92,92.1c50.8,0,92.1-41.3,92.1-92.1C592.1,446.4,550.8,405.1,500,405.1z"/></g></svg></div>')
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

			// draw the grabber with an eye symbol in it
			let grabber2 = $('<div id="groupRotationGrabber"><svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 96 960 960" width="100%" style="display:block;"><path d="M479.956 651Q449 651 427 628.956q-22-22.045-22-53Q405 545 427.044 523q22.045-22 53-22Q511 501 533 523.044q22 22.045 22 53Q555 607 532.956 629q-22.045 22-53 22ZM480 936q-150 0-255-105.5T120 575h60q0 125 87.5 213T480 876q125.357 0 212.679-87.321Q780 701.357 780 576t-87.321-212.679Q605.357 276 480 276q-69 0-129 30.5T246 389h104v60H142V241h60v106q53-62 125.216-96.5T480 216q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840 576q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480 936Z"/></svg></div>')
			grabber2.css("position", "absolute");
			grabber2.css('top', `${grabberTop}px`);
			grabber2.css('left', `${right}px`);
			grabber2.css('width', `${grabberSize - 4}px`);
			grabber2.css('height', `${grabberSize - 4}px`);
			grabber2.css('z-index', 100000); // make sure the grabber is above all the tokens
			grabber2.css('background', '#ced9e0')
			grabber2.css('border-radius', `${Math.ceil(grabberSize / 2)}px`); // make it round
			grabber2.css('padding', '2px');
			grabber2.css('cursor', 'move');
			if(window.CURRENTLY_SELECTED_TOKENS.length > 1 || (window.CURRENTLY_SELECTED_TOKENS.length == 1 && window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[0]].isAoe()))
				$("#tokens").append(grabber2);

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
					$("#groupRotationGrabber").remove();
			
				},
				drag: function(event, ui) {
					// adjust based on zoom level
					let zoom = window.ZOOM;
					let original = ui.originalPosition;
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

			let centerPointRotateOrigin = {
				x: 0,
				y: 0
			};
			
			let angle;
			grabber2.draggable({
				start: function (event) { 
					// adjust based on zoom level
					click.x = event.clientX;
					click.y = event.clientY;
					self.orig_top = grabberTop;
					self.orig_left = grabberLeft;

					let furthest_coord = {}


					$('.tokenselected').wrap('<div class="grouprotate"></div>');

					
					
					for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
						let id = window.CURRENTLY_SELECTED_TOKENS[i];
						let token = window.TOKEN_OBJECTS[id];
						$(`#scene_map_container .token[data-id='${id}']`).remove();
						
					
						let sceneToken = $(`div.token[data-id='${id}']`)


						let tokenImageClientPosition = $(`div.token[data-id='${id}']>.token-image`)[0].getBoundingClientRect();
						let tokenImagePosition = $(`div.token[data-id='${id}']>.token-image`).position();
						let tokenImageWidth = (tokenImageClientPosition.width) / (window.ZOOM);
						let tokenImageHeight = (tokenImageClientPosition.height) / (window.ZOOM);
						let tokenTop = (sceneToken.position().top + tokenImagePosition.top) / (window.ZOOM);
						let tokenBottom = tokenTop + tokenImageHeight;
						let tokenLeft = (sceneToken.position().left  + tokenImagePosition.left) / (window.ZOOM);
						let tokenRight = tokenLeft + tokenImageWidth;
						
						furthest_coord.top  = (furthest_coord.top  == undefined) ? tokenTop : Math.min(furthest_coord.top, tokenTop)
						furthest_coord.left  = (furthest_coord.left  == undefined) ? tokenLeft : Math.min(furthest_coord.left, tokenLeft)

						furthest_coord.right  = (furthest_coord.right  == undefined) ? tokenRight : Math.max(furthest_coord.right, tokenRight)
						furthest_coord.bottom  = (furthest_coord.bottom  == undefined) ? tokenBottom : Math.max(furthest_coord.bottom , tokenBottom)
					}

					if(window.CURRENTLY_SELECTED_TOKENS.length == 1 && window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[0]].isAoe()){
						let id = window.CURRENTLY_SELECTED_TOKENS[0];
						let rayAngle = 90;
						let ray = new Ray({x: (furthest_coord.left + furthest_coord.right)/2, y: (furthest_coord.top + furthest_coord.bottom)/2}, degreeToRadian(parseFloat($(`div.token[data-id='${id}']`).css('--token-rotation')) % 360 - rayAngle));	
						let dir = ray.dir;
						let tokenWidth = window.TOKEN_OBJECTS[id].sizeWidth();
						let tokenHeight = window.TOKEN_OBJECTS[id].sizeHeight();
						let widthAdded = tokenHeight;
						
						centerPointRotateOrigin.x = (furthest_coord.left + furthest_coord.right)/2 + (widthAdded*dir.x/2);
						centerPointRotateOrigin.y = (furthest_coord.top + furthest_coord.bottom)/2 + (widthAdded*dir.y/2);
					}
					else{
						centerPointRotateOrigin.x = (furthest_coord.left + furthest_coord.right)/2;
						centerPointRotateOrigin.y = (furthest_coord.top + furthest_coord.bottom)/2;	
					}
						
						

					


				
					$('.grouprotate').css('transform-origin', `${centerPointRotateOrigin.x}px ${centerPointRotateOrigin.y}px` )

					// the drag has started so remove the bounding boxes, but not the grabber
					$("#selectedTokensBorder").remove();
					$("#selectedTokensBorderRotationGrabberConnector").remove();
					$("#rotationGrabberHolder").remove();	
					$("#rotationGrabber").remove();	
				},
				drag: function(event, ui) {
					// adjust based on zoom level
					let zoom = window.ZOOM;
					let original = ui.originalPosition;
					ui.position = {
						left: Math.round((event.clientX - click.x + original.left) / zoom),
						top: Math.round((event.clientY - click.y + original.top) / zoom)
					};

					angle = rotation_towards_cursor_from_point(centerPointRotateOrigin.x, centerPointRotateOrigin.y, ui.position.left, ui.position.top, event.shiftKey)
					if(window.CURRENTLY_SELECTED_TOKENS.length == 1 && window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[0]].isAoe()){
						let id = window.CURRENTLY_SELECTED_TOKENS[0];
						angle = angle-parseFloat($(`.token[data-id='${id}']`).css('--token-rotation')); // account for group rotation grabber being at corner
					}
					$(`.grouprotate`).css({
						'rotate': `${angle}deg`		
					});

				},
				stop: function (event) { 
					// rotate for all players
									
					for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
						let id = window.CURRENTLY_SELECTED_TOKENS[i];
						let token = window.TOKEN_OBJECTS[id];

						let sceneToken = $(`#tokens .token[data-id='${id}']`)

						window.TOKEN_OBJECTS[id].options.rotation = angle + parseFloat(sceneToken.css('--token-rotation'))
						
						
						if(window.CURRENTLY_SELECTED_TOKENS.length > 1){
							sceneToken.css({
								'rotate': `-${angle%360}deg`
							});
							currentplace = sceneToken.offset();
						}
						else{
							sceneToken.css({
								'rotate': `-${(angle+parseFloat(sceneToken.css('--token-rotation')))%360}deg`
							});
							currentplace = sceneToken.find('.token-image').offset();
						}
						
						newCoords = convert_point_from_view_to_map(currentplace.left, currentplace.top, true, true)
						window.TOKEN_OBJECTS[id].options.left = `${newCoords.x}px`;
						window.TOKEN_OBJECTS[id].options.top = `${newCoords.y}px`;
						
					
					}

					$(`.grouprotate`).remove();
					for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
						let id = window.CURRENTLY_SELECTED_TOKENS[i];
						let token = window.TOKEN_OBJECTS[id];
						token.selected = true;
						token.place_sync_persist();
					
						draw_selected_token_bounding_box();
					}			
				},
			});
		}
	)
	
	debounceLightChecks();
}

/// removes everything that draw_selected_token_bounding_box added
function remove_selected_token_bounding_box() {
	$("#selectedTokensBorder").remove();
	$("#selectedTokensBorderRotationGrabberConnector").remove();
	$("#rotationGrabberHolder").remove();
	$("#rotationGrabber").remove();
	$("#groupRotationGrabber").remove();

}

function copy_selected_tokens() {
	if (!window.DM) return;
	window.TOKEN_PASTE_BUFFER = [];
	let redrawBoundingBox = false;
	let bounds = {
		top: Infinity,
		left: Infinity,
		bottom: -Infinity,
		right: -Infinity,
		hpps: window.CURRENT_SCENE_DATA.hpps,
		vpps: window.CURRENT_SCENE_DATA.vpps
	};
	for (let id in window.TOKEN_OBJECTS) {
		let token = window.TOKEN_OBJECTS[id];

		if (token.selected) { 
			bounds = {
				...bounds,
				top: parseInt(token.options.top) < bounds.top ? parseInt(token.options.top) : bounds.top,
				left: parseInt(token.options.left) < bounds.left ? parseInt(token.options.left) : bounds.left,
				bottom: parseInt(token.options.top) > bounds.bottom ? parseInt(token.options.top) : bounds.bottom,
				right: parseInt(token.options.left) > bounds.right ? parseInt(token.options.left) : bounds.right
			}
			window.TOKEN_PASTE_BUFFER.push({id: id, left: token.options.left, top: token.options.top});
		}
	}


	window.TOKEN_PASTE_BOUNDS = bounds;
	if (redrawBoundingBox) {
		draw_selected_token_bounding_box();
	}
}

function paste_selected_tokens(x, y) {
	if (!window.DM) return;
	if (window.TOKEN_PASTE_BUFFER == undefined) {
		window.TOKEN_PASTE_BUFFER = [];
	}
	deselect_all_tokens();
	for (let i = 0; i < window.TOKEN_PASTE_BUFFER.length; i++) {
		let id = window.TOKEN_PASTE_BUFFER[i]?.id;
		let token = window.all_token_objects[id];
		if(token == undefined || (token.isPlayer() && window.TOKEN_OBJECTS[id])) continue;
		let options = $.extend(true, {}, token.options);
		let newId = token.isPlayer() ? id : uuid();
		options.id = newId;
		if(options.audioChannel != undefined){
			options.audioChannel.token = newId;
			options.audioChannel.audioId = uuid();
		}
		// TODO: figure out the location under the cursor and paste there instead of doing center of view
		options.init = token.isPlayer() ? options.init : undefined;
		options.ct_show = token.isPlayer() ? options.ct_show : undefined;
		options.combatGroup = token.isPlayer() ? options.combatGroup : undefined;
		options.selected = true;
		let center = center_of_view(); 
		let mapView = convert_point_from_view_to_map(x, y, false);

		let bounds = window.TOKEN_PASTE_BOUNDS;
		let left = (parseInt(window.TOKEN_PASTE_BUFFER[i]?.left) - (bounds.right + bounds.left)/2)/bounds.hpps;
		let top = (parseInt(window.TOKEN_PASTE_BUFFER[i]?.top) - (bounds.bottom + bounds.top)/2)/bounds.vpps;


		options.top = `${mapView.y + top*window.CURRENT_SCENE_DATA.vpps}px`;
		options.left = `${mapView.x + left*window.CURRENT_SCENE_DATA.hpps}px`;
		window.ScenesHandler.create_update_token(options);
		// deselect the old and select the new so the user can easily move the new tokens around after pasting them
		if(typeof window.TOKEN_OBJECTS[id] !== "undefined"){
			window.TOKEN_OBJECTS[id].selected = false;
			window.TOKEN_OBJECTS[id].place_sync_persist();
		}

		if (id in window.JOURNAL.notes) {
			window.JOURNAL.notes[newId] = structuredClone(window.JOURNAL.notes[id]);
			let copiedNote = window.JOURNAL.notes[newId];
			copiedNote.title = window.TOKEN_OBJECTS[id].options.name;
			window.JOURNAL.persist();
			window.MB.sendMessage('custom/myVTT/note',{
				id: newId,
				note:copiedNote
			});
		}

		window.TOKEN_OBJECTS[newId].selected = true;
		window.TOKEN_OBJECTS[newId].place_sync_persist();
		if(token.isPlayer() && options.ct_show != undefined){
			let findSVG = $('<svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg>')
			let playerCTRow = $(`#combat_area tr[data-target='${token.options.id}']`);
			let findButton = playerCTRow.find('.findTokenCombatButton')
			findButton.empty().append(findSVG);
		}
	}

	draw_selected_token_bounding_box();
}

function delete_selected_tokens() {
	// move all the tokens into a separate list so the DM can "undo" the deletion
	let tokensToDelete = [];
	for (let id in window.TOKEN_OBJECTS) {
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

	for (let i = 0; i < tokensToDelete.length; i++) {
		tokensToDelete[i].delete(true);
	}
	draw_selected_token_bounding_box(); // redraw the selection box
}

function undo_delete_tokens() {
	console.log("undo_delete_tokens", window.TOKEN_OBJECTS_RECENTLY_DELETED);
	if (!window.DM) return;
	for (let id in window.TOKEN_OBJECTS_RECENTLY_DELETED) {
		let options = window.TOKEN_OBJECTS_RECENTLY_DELETED[id];
		window.ScenesHandler.create_update_token(options);
	}
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
}

