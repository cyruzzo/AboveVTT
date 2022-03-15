const STANDARD_CONDITIONS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious", "Exhaustion"];

const CUSTOM_CONDITIONS = ["Concentration(Reminder)", "Inspiration", "Flying", "Flamed", "Rage", "Blessed", "Baned",
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
		return this.options.id.includes("/");
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

	size(newsize) {
		this.update_from_page();
		this.options.size = newsize;
		this.place();
		this.sync();
		if (this.persist != null)
			this.persist();
	}

	hide() {
		this.update_from_page();
		this.options.hidden = true;
		this.place();
		this.sync();
		if (this.persist != null)
			this.persist();
	}
	show() {
		this.update_from_page();
		delete this.options.hidden;
		this.place();
		this.sync();
		if (this.persist != null)
			this.persist();
	}
	delete(persist=true,sync=true) {
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
		let scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
		if ( !(this.options.max_hp) > 0 || (this.options.disableaura))
			scale=1;
		
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

	update_from_page() {
		console.log("update from page di " + this.options.id);
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

		if ( ( (!(this.options.monster > 0)) || window.DM || (!window.DM && this.options.hidestat)) && !this.options.disablestat && old.find(".hp").length > 0) {
			if (old.find(".hp").val().startsWith("+") || old.find(".hp").val().startsWith("-")) {
				old.find(".hp").val(Math.max(0, parseInt(this.options.hp) + parseInt(old.find(".hp").val())));
			}
			if (old.find(".max_hp").val().startsWith("+") || old.find(".max_hp").val().startsWith("-")) {
				old.find(".max_hp").val(Math.max(0, parseInt(this.options.max_hp) + parseInt(old.find(".max_hp").val())));
			}
			$("input").blur();

			this.options.hp = old.find(".hp").val();
			this.options.max_hp = old.find(".max_hp").val();

			let scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
			
			if (!(this.options.max_hp) > 0 || (this.options.disableaura))
				scale = 1;
			
			// HEALTH AURA
			if (this.options.max_hp > 0 && !this.options.disableaura) {
				if (this.options.max_hp > 0 && parseInt(this.options.hp) === 0) {
					const deadCross = old.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `--size: ${parseInt(this.options.size) / 10}px;`)
					} else {
						console.log(this.options);
						old.prepend(`<div class="dead" style="transform:scale(${scale});--size: ${parseInt(this.options.size) / 10}px;"></div>`);
					}
				} else {
					old.find('.dead').remove();
				}

				old.find(".token-image").css('box-shadow',
					`${token_health_aura(
						Math.round((this.options.hp / this.options.max_hp) * 100)
					)} 0px 0px 7px 7px`
				);
			}
		}

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
		if (window.DM) {
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").text(this.options.hp);
		}
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



		var divider = $("<div style='display:inline-block;float:left'>/</>");
		divider.css('font-size', fs);


		hpbar.append(hp_input);
		hpbar.append(divider);
		hpbar.append(maxhp_input);
		if (this.options.monster > 0) {
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

		return (hpbar);
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

	build_conditions(parent) {
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
	}


	place(animationDuration) {
		if(!window.CURRENT_SCENE_DATA){
			// No scene loaded!
			return;
		}
		if (animationDuration == undefined || parseFloat(animationDuration) == NaN) {
			animationDuration = 1000;
		}
		console.log("cerco id" + this.options.id);
		var selector = "div[data-id='" + this.options.id + "']";
		var old = $("#tokens").find(selector);
		var self = this;

		/* UPDATE COMBAT TRACKER */
		if (window.DM) {
			$("#combat_tracker_inside tr[data-target='" + this.options.id + "'] .hp").text(this.options.hp);
		}


		if (old.length > 0) {
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


			if ((!(this.options.monster > 0)) || window.DM) {
				old.find(".hpbar").replaceWith(this.build_hp());
				old.find(".ac").replaceWith(this.build_ac());
				old.find(".elev").replaceWith(this.build_elev());
			}
			if(this.options.disablestat || (!window.DM && this.options.hidestat)){
				old.find(".hpbar").hide();
				old.find(".ac").hide();
			}
			else{
				old.find(".hpbar").show();
				old.find(".ac").show();
			}

			let scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
			if (!(this.options.max_hp) > 0 || (this.options.disableaura))
				scale = 1;
			var rotation = 0;
			if (this.options.rotation != undefined) {
				rotation = this.options.rotation;
			}
			old.find("img").css("transform", "scale(" + scale + ") rotate("+rotation+"deg)");

			// HEALTH AURA / DEAD CROSS
			if (this.options.max_hp > 0) {
				const pData=this.options;
				if (pData.max_hp > 0 && parseInt(pData.hp) === 0) {
					const deadCross = old.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `transform:scale(${scale});--size: ${parseInt(pData.size) / 10}px;`)
					} else {
						old.prepend(`<div class="dead" style="transform:scale(${scale});--size: ${parseInt(pData.size) / 10}px;"></div>`);
					}
				} else {
					old.find('.dead').remove();
				}

				old.find(".token-image").css('box-shadow',
					`${token_health_aura(
						Math.round((pData.hp / pData.max_hp) * 100)
					)} 0px 0px 7px 7px`
				);
			}
						
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
			}
			else {
				old.css("border", "");
				old.removeClass("tokenselected");
			}
			
			if(old.find("img").attr("src")!=this.options.imgsrc && !this.options.hidden){
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

			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
		else { // adding a new token
			var tok = $("<div/>");
			var hpbar = $("<input class='hpbar'>");
			let scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
			if (!(this.options.max_hp) > 0 || (this.options.disableaura))
				scale = 1;
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

			if ((!(this.options.monster > 0)) || window.DM) {
				if(!this.options.disablestat || (!window.DM && this.options.hidestat)){
					tok.append(this.build_hp());
					tok.append(this.build_ac());
					tok.append(this.build_elev());
				}
			}
			
			if(this.options.disablestat || (!window.DM && this.options.hidestat)){
				tok.find(".hpbar").hide();
				tok.find(".ac").hide();
				tok.find(".elev").hide();
			}
			else{
				tok.find(".hpbar").show();
				tok.find(".ac").show();
				tok.find(".elev").show();
			}

			// HEALTH AURA / DEAD CROSS
			console.log("AURAO - ", this.options);
			if (this.options.max_hp > 0 && !(this.options.disableaura)) {
				const pData = window.PLAYER_STATS[this.options.id] || this.options;
				if (pData.max_hp > 0 && parseInt(pData.hp) === 0) {
					const deadCross = tok.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `--size: ${parseInt(pData.size) / 10}px;`)
					} else {
						tok.prepend(`<div class="dead" style="transform:scale(${scale});--size: ${parseInt(pData.size) / 10}px;"></div>`);
					}
				} else {
					tok.find('.dead').remove();
				}

				tok.find(".token-image").css('box-shadow',
					`${token_health_aura(
						Math.round((pData.hp / pData.max_hp) * 100)
					)} 0px 0px 7px 7px`
				);
			}

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
			// 
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

			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
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
	if (key == "token_medium") {
		id = $(this).attr('data-id'); window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps));
	}
	if (key == "token_tiny") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 0.5);
	}
	if (key == "token_large") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 2);
	}
	if (key == "token_huge") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 3);
	}
	if (key == "token_gargantuan") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 4);
	}
	if (key == "token_colossal") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps) * 5);
	}
	if (key == "token_hidden") {
		id = $(this).attr('data-id');
		if (window.TOKEN_OBJECTS[id].hidden) {
			window.TOKEN_OBJECTS[id].hide();
		}
		else {
			window.TOKEN_OBJECTS[id].show();
		}	
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
	

	if (key == "token_combat") {
		id = $(this).attr('data-id');
		ct_add_token(window.TOKEN_OBJECTS[id]);
	}
	if (key.startsWith("cond_")) {
		condition = key.substr(5);
		id = $(this).attr('data-id');
		if (window.TOKEN_OBJECTS[id].options.conditions.includes(condition)) {
			array_remove_index_by_value(window.TOKEN_OBJECTS[id], condition);
		}
		else {
			window.TOKEN_OBJECTS[id].options.conditions.push(condition);
		}
		window.TOKEN_OBJECTS[id].place();
		window.ScenesHandler.persist();
		// should persist ?	
	}
	if (['candle', 'torch', 'lamp', 'lantern'].indexOf(key) >= 0) {
	
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].options.aura1.color = "rgba(255, 129, 0, 0.3)";
		window.TOKEN_OBJECTS[id].options.aura2.color = "rgba(255, 255, 0, 0.1)";

		if (key === "candle") {
			window.TOKEN_OBJECTS[id].options.aura1.feet = "5";
			window.TOKEN_OBJECTS[id].options.aura2.feet = "5";
			
		}
		if (key === "torch") {
			window.TOKEN_OBJECTS[id].options.aura1.feet = "20";
			window.TOKEN_OBJECTS[id].options.aura2.feet = "20";
			
		}
		if (key === "lamp") {
			window.TOKEN_OBJECTS[id].options.aura1.feet = "15";
			window.TOKEN_OBJECTS[id].options.aura2.feet = "30";
			
		}
		if (key === "lantern") {
			window.TOKEN_OBJECTS[id].options.aura1.feet = "30";
			window.TOKEN_OBJECTS[id].options.aura2.feet = "30";
			
		}
	
		window.TOKEN_OBJECTS[id].place();
		window.TOKEN_OBJECTS[id].sync();
		if(window.DM)
			window.TOKEN_OBJECTS[id].persist();
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

	tok = window.TOKEN_OBJECTS[id];
	if(is_monster)
		tok.options.conditions = [];
	tok.options.custom_conditions = [];

	for (k in data) {
		if (k.startsWith("cond_") && data[k]) { // if checkbox is true...
			tok.options.conditions.push(k.substr(5));
		}
		if (k.startsWith("custom_") && data[k]) { // if checkbox is true...
			tok.options.custom_conditions.push(k.substr(7));
		}
	}

	if(data.token_custom_size && (!isNaN(data.token_custom_size))){
		tok.options.size=Math.round(window.CURRENT_SCENE_DATA.hpps * (data.token_custom_size/5));
	}


	if (data.aura1 && data.aura1.length > 0) {
		tok.options.aura1.feet = data.aura1;
	} else { tok.options.aura1.feet = 0 }
	if (data.aura2 && data.aura2.length > 0) {
		tok.options.aura2.feet = data.aura2;
	} else { tok.options.aura2.feet = 0 }
	if (data.aura1Color && data.aura1Color.length > 0) {
		tok.options.aura1.color = data.aura1Color;
	}
	if (data.aura2Color && data.aura2Color.length > 0) {
		tok.options.aura2.color = data.aura2Color;
	}
	tok.options.auraVisible = data.auraVisible;
	
	if (data.imgsrc != undefined) {
		tok.options.imgsrc = parse_img(data.imgsrc);
	}


	if (window.DM) {
		if (is_monster) {
			if (data.hp.startsWith("+") || data.hp.startsWith("-"))
				data.hp = parseInt(tok.options.hp) + parseInt(data.hp);

			tok.options.hp = data.hp;

			if (data.max_hp.startsWith("+") || data.max_hp.startsWith("-"))
				data.max_hp = parseInt(tok.options.max_hp) + parseInt(data.max_hp);

			tok.options.max_hp = data.max_hp;

			if (!isNaN(data.ac)) {
				tok.options.ac = data.ac;
			}
			if (!isNaN(data.elev)) {
				tok.options.elev = data.elev;
			}
		}

		
		tok.options.name = data.name;
		tok.options.elev = data.elev;

		if (opt.imgsrcSelection != undefined && opt.imgsrcSelection.length > 0) {
			tok.options.imgsrc = parse_img(opt.imgsrcSelection);
		} else if (data.imgsrc != undefined) {
			tok.options.imgsrc = parse_img(data.imgsrc);
		}

		if (data.token_square) {
			tok.options.square = true;
		}
		else {
			tok.options.square = false;
		}

		if (data.token_disablestat) {
			tok.options.disablestat = 1;
		}
		else {
			tok.options.disablestat = false;
		}

		if (data.token_hidestat) {
			tok.options.hidestat = 1;
		}
		else {
			tok.options.hidestat = false;
		}

		if (data.token_locked) {
			tok.options.locked = 1;
		}
		else {
			tok.options.locked = false;
		}

		if (data.token_restrictPlayerMove) {
			tok.options.restrictPlayerMove = 1;
		}
		else {
			tok.options.restrictPlayerMove = false;
		}

		if (data.token_disableborder) {
			tok.options.disableborder = true;
		}
		else {
			tok.options.disableborder = false;
		}

		if (data.token_disableaura) {
			tok.options.disableaura = true;
		}
		else {
			tok.options.disableaura = false;
		}
		if (data.token_hidden) {
			tok.options.hidden = true;
		}
		else {
			tok.options.hidden = false;
		}
		if (data.token_revealname) {
			tok.options.revealname = true;
		}
		else {
			tok.options.revealname = false;
		}
		if (data.token_legacyaspectratio) {
			tok.options.legacyaspectratio = true;
		}
		else {
			tok.options.legacyaspectratio = false;
		}
	}
	
	tok.place();
	tok.sync();
	if(window.DM)
		tok.persist();
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
						token_combat: { name: 'Add to Combat Tracker' },
						hide: { name: 'Hide From Players' },
						show: { name: 'Show To Players' },
						delete: { name: 'Delete Token' },
						token_locked: {
							type: 'checkbox',
							name: 'Lock Tokens in Position',
							events: {
								click: function(e) {
									if (e.target == undefined || e.target.checked == undefined) return;
									$("#tokens .tokenselected").each(function() {
										id = $(this).attr('data-id');
										window.TOKEN_OBJECTS[id].options.locked = e.target.checked;
										window.TOKEN_OBJECTS[id].place_sync_persist();
									});							
								}
							}
						},
						token_restrictPlayerMove: {
							type: 'checkbox',
							name: 'Restrict Player Movement',
							events: {
								click: function(e) {
									if (e.target == undefined || e.target.checked == undefined) return;
									$("#tokens .tokenselected").each(function() {
										id = $(this).attr('data-id');
										window.TOKEN_OBJECTS[id].options.restrictPlayerMove = e.target.checked;
										window.TOKEN_OBJECTS[id].place_sync_persist();
									});							
								}
							}
						}
					}
				};
				return ret;
			}
			else { // STANDARD SINGLE TOKEN MENU
				cond_items = {};
				custom_cond_items = {};
				custom_reminders = {}
				id = $(element).attr('data-id');
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

				for (var i = 0; i < STANDARD_CONDITIONS.length; i++) {
					command = "cond_" + STANDARD_CONDITIONS[i];
					cond_items[command] = { name: STANDARD_CONDITIONS[i], type: "checkbox" }
					//cond_items[command].events={change:condition_change};
					if (!is_monster) {
						cond_items[command].disabled = true;
					}
					if (window.TOKEN_OBJECTS[id].options.conditions.includes(STANDARD_CONDITIONS[i])) {
						cond_items[command].selected = true;
					}
				}
				// cond_items.sep1 = "-----";
				for (var i = 0; i < CUSTOM_CONDITIONS.length; i++) {
					command = "custom_" + CUSTOM_CONDITIONS[i];
					if (CUSTOM_CONDITIONS[i].startsWith("#")) {
						custom_cond_items[command] = {
							name: `<div class="color-reminder" style="background:${CUSTOM_CONDITIONS[i]}">&nbsp;</div>`,
							isHtmlName: true,
							type: "checkbox"
						};
					} else {
						custom_cond_items[command] = { name: CUSTOM_CONDITIONS[i], type: "checkbox" };
					}
					if (window.TOKEN_OBJECTS[id].options.custom_conditions.includes(CUSTOM_CONDITIONS[i])) {
						custom_cond_items[command].selected = true;
					}
				}
				
				ret = {
					callback: menu_callback,
					events: {
						hide: token_inputs
					},
					items: {
						view: { name: 'Character Sheet' },
						token_combat: { name: 'Add to Combat Tracker' },
						token_hidden: {
							type: 'checkbox',
							name: 'Hide',
							selected: window.TOKEN_OBJECTS[id].options.hidden,
						},
						sep0: "--------",
						token_size: {
							name: "Size",
							items: {
								token_tiny: { name: 'Tiny' },
								token_medium: { name: 'Small or Medium' },
								token_large: { name: 'Large' },
								token_huge: { name: 'Huge' },
								token_gargantuan: { name: 'Gargantuan' },
								token_colossal: { name: 'Colossal' },
								token_custom_size: {name: 'Custom Size (enter edge feet)', type:'text'}
							}
						},

						token_cond: {
							name: "Conditions",
							items: cond_items,
						},
						token_custom_cond: {
							name: "Markers",
							items: custom_cond_items,
						},
						tokenAuras: {
							name: "Auras",
							items: {
								auraVisible: {
									type: 'checkbox',
									name: 'Token Auras',
									className: 'on-off-title',
									selected: window.TOKEN_OBJECTS[id].options.auraVisible
								},
								sep2Auras: '---------',
								aura1Label: {
									type: "title",
									name: "Inner Aura"
								},
								aura1: {
									type: 'text',
									name: 'Ft.',
									value: window.TOKEN_OBJECTS[id].options.aura1.feet,
									className: "aura-feet",
									events: {
										click: function(e) {
											$(e.target).select();
										}
									}
								},
								aura1Color: {
									type: 'colorPicker',
									name: 'Color',
									prop: 'aura1Color',
									value: window.TOKEN_OBJECTS[id].options.aura1.color,
									events: {
										click: function(e) {
											$(e.target).select();
										}
									}
								},
								sepAuras: '---------',
								aura21Label: {
									type: "title",
									name: "Outer Aura"
								},
								aura2: {
									type: 'text',
									name: 'Ft.',
									value: window.TOKEN_OBJECTS[id].options.aura2.feet,
									className: "aura-feet",
									events: {
										click: function(e) {
											$(e.target).select();
										}
									}
								},
								aura2Color: {
									type: 'colorPicker',
									name: 'Color',
									value: window.TOKEN_OBJECTS[id].options.aura2.color,
									prop: 'aura2Color',
									events: {
										click: function(e) {
											$(e.target).select();
										}
									}
								},
								sep3Auras: '---------',
								presets: {
									type: "title",
									name: "Presets"
								},
								candle: {
									name: "Candle (5/5)",
									className: "aura-preset"
								},
								torch: {
									name: "Torch / Light (20/20)",
									className: "aura-preset"
								},
								lamp: {
									name: "Lamp (15/30)",
									className: "aura-preset"
								},
								lantern: {
									name: "Lantern (30/30)",
									className: "aura-preset"
								}
							}
						},
						options: {
							name: "Options",
							items: {
								token_square: {
									type: 'checkbox',
									name: 'Square Token',
									selected: window.TOKEN_OBJECTS[id].options.square
								},
								token_locked: {
									type: 'checkbox',
									name: 'Lock Tokens in Position',
									selected: window.TOKEN_OBJECTS[id].options.locked
								},
								token_restrictPlayerMove: {
									type: 'checkbox',
									name: 'Restrict Player Movement',
									selected: window.TOKEN_OBJECTS[id].options.restrictPlayerMove
								},
								token_disablestat: {
									type: 'checkbox',
									name: 'Disable HP/AC',
									selected: window.TOKEN_OBJECTS[id].options.disablestat
								},
								token_hidestat: {
									type: 'checkbox',
									name: 'Hide HP/AC from players',
									selected: window.TOKEN_OBJECTS[id].options.hidestat,
								},
								token_disableborder: {
									type: 'checkbox',
									name: 'Disable Border',
									selected: window.TOKEN_OBJECTS[id].options.disableborder
								},
								token_disableaura: {
									type: 'checkbox',
									name: 'Disable Aura',
									selected: window.TOKEN_OBJECTS[id].options.disableaura
								},
								token_revealname: {
									type: 'checkbox',
									name: 'Show name to players',
									selected: window.TOKEN_OBJECTS[id].options.revealname,
								},
								token_legacyaspectratio: {
									type: 'checkbox',
									name: 'Stretch non-square token images',
									selected: window.TOKEN_OBJECTS[id].options.legacyaspectratio == true || window.TOKEN_OBJECTS[id].options.legacyaspectratio == undefined
								}
							}
						},
						note_menu:{
							name: "Notes",
							items:{
								note_view: {name: 'View Note', disable: !has_note},
								note_edit: {name: 'Create/Edit Note'},
								note_delete: {name: 'Delete Note'},
							}
						},
						sep1: "-------",
						name: {
							type: 'text',
							name: 'Name',
							value: window.TOKEN_OBJECTS[id].options.name,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						hp: {
							type: 'text',
							name: 'Current HP',
							className: 'hp-context-input',
							value: window.TOKEN_OBJECTS[id].options.hp,
							disabled: !is_monster,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							},
						},
						max_hp: {
							type: 'text',
							name: 'Max Hp',
							className: 'hp-context-input',
							value: window.TOKEN_OBJECTS[id].options.max_hp,
							disabled: !is_monster,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						ac: {
							type: 'text',
							name: 'AC',
							className: 'ac-context-input',
							value: window.TOKEN_OBJECTS[id].options.ac,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						elev: {
							type: 'text',
							name: 'Elevation',
							className: 'ac-context-input',
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
							className: "imgsrcSelect"
						},
						sep4: '----------',
						helptext: {
							name: 'Player HP/conditions must be set in character sheet',
							className: 'context-menu-helptext',
							disabled: true
						},
						delete: { name: 'Delete' }
					}
				};

				if (!is_monster && !is_player) {
					delete ret.items.view;
				}

				if (is_monster) {
					delete ret.items.options.items.token_hidestat;
					delete ret.items.helptext;
				}
				else {
					delete ret.items.sep1;
					delete ret.items.hp;
					delete ret.items.max_hp;
					delete ret.items.token_cond;
					delete ret.items.options.items.token_revealname;
					delete ret.items.ac;
				}
				
				if(!has_note){
					delete ret.items.note_menu.items.note_view;
					delete ret.items.note_menu.items.note_delete;
				}
				
				if(!window.DM){
					delete ret.items.sep0;
					delete ret.items.view;
					delete ret.items.token_combat;
					delete ret.items.token_hidden;
					//delete ret.items.token_size;
					delete ret.items.options;
					delete ret.items.sep1;
					delete ret.items.hp;
					delete ret.items.max_hp;
					delete ret.items.delete;
					delete ret.items.note_menu;
					delete ret.items.name;
					delete ret.items.sep2;
					delete ret.items.ac;
					delete ret.items.elev;
					if (!id.endsWith(window.PLAYER_ID)) {
						delete ret.items.sep3;
						delete ret.items.imgsrcSelect;
					}
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
	if (!window.DM) return;
	window.TOKEN_OBJECTS_RECENTLY_DELETED = {};
	// move all the tokens into a separate list so the DM can "undo" the deletion
	let tokensToDelete = [];
	for (id in window.TOKEN_OBJECTS) {
		let token = window.TOKEN_OBJECTS[id];
		if (token.selected) {
			window.TOKEN_OBJECTS_RECENTLY_DELETED[id] = Object.assign({}, token.options);
			tokensToDelete.push(token);
		}
	}

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
