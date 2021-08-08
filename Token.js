
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
				old.find(".hp").val(parseInt(this.options.hp) + parseInt(old.find(".hp").val()));
			}
			if (old.find(".max_hp").val().startsWith("+") || old.find(".max_hp").val().startsWith("-")) {
				old.find(".max_hp").val(parseInt(this.options.max_hp) + parseInt(old.find(".max_hp").val()));
			}
			$("input").blur();

			this.options.hp = old.find(".hp").val();
			this.options.max_hp = old.find(".max_hp").val();

			const scale = (((this.options.size - 15) * 100) / this.options.size) / 100;

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
				self.update_and_sync(e);
			});
			hp_input.click(function(e) {
				$(e.target).select();
			});
			maxhp_input.change(function(e) {
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

	build_conditions(parent) {

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

		const conditionsTotal = this.options.conditions.length + this.options.custom_conditions.length;

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
						text: `<div>${[conditionName, ...conditionDescription].map(line => `<p>${line}</p>`).join(``)}</div>`
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
				const conditionName = this.options.custom_conditions[i];
				const conditionSymbolName = conditionName.replaceAll(' ','_').toLowerCase();
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
		}

		if (parent) {
			parent.find(".conditions").remove();
			parent.append(cond);
			parent.append(moreCond);
		} else {
			return [cond, moreCond];
		}
	}


	place() {
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
				old.animate(
					{
						left: this.options.left,
						top: this.options.top,
					}, { duration: 1500, queue: false });


			// CONCENTRATION REMINDER


			if ((!(this.options.monster > 0)) || window.DM) {
				old.find(".hpbar").replaceWith(this.build_hp());
				old.find(".ac").replaceWith(this.build_ac());
			}
			if(this.options.disablestat || (!window.DM && this.options.hidestat)){
				old.find(".hpbar").hide();
				old.find(".ac").hide();
			}
			else{
				old.find(".hpbar").show();
				old.find(".ac").show();
			}

			const scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
			old.find("img").css("transform", "scale(" + scale + ")");

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
					width: this.options.size
				}, { duration: 1000, queue: false });
				
				var zindexdiff=Math.round(20/ (this.options.size/window.CURRENT_SCENE_DATA.hpps));
				old.css("z-index", 30+zindexdiff);

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
			
			if(this.options.locked){
				old.draggable("disable");
				old.removeClass("ui-state-disabled"); // removing this manually.. otherwise it stops right click menu
				old.css("z-index", old.css("z-index")-2);
			}
			else if(!this.options.locked){
				old.draggable("enable");
			}

			if(this.options.disableaura){
				old.find("img").css("box-shadow","");
			}

			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
		else {
			var tok = $("<div/>");
			var hpbar = $("<input class='hpbar'>");
			const scale = (((this.options.size - 15) * 100) / this.options.size) / 100;
			var bar_height = Math.floor(this.options.size * 0.2);

			if (bar_height > 60)
				bar_height = 60;

			var fs = Math.floor(bar_height / 1.3) + "px";
			tok.css("font-size",fs);

			var tokimg = $("<img style='transform:scale(" + scale + ")' class='token-image'/>");
			if(!(this.options.square)){
				tokimg.addClass("token-round");
			}


			var zindexdiff=Math.round(20/ (this.options.size/window.CURRENT_SCENE_DATA.hpps));
			console.log("Diff: "+zindexdiff);
			
			tok.css("z-index", 30+zindexdiff);
			tok.width(this.options.size);
			tok.addClass('token');

			tok.append(tokimg);

			if ((!(this.options.monster > 0)) || window.DM) {
				if(!this.options.disablestat || (!window.DM && this.options.hidestat)){
					tok.append(this.build_hp());
					tok.append(this.build_ac());
				}
			}
			
			if(this.options.disablestat || (!window.DM && this.options.hidestat)){
				tok.find(".hpbar").hide();
				tok.find(".ac").hide();
			}
			else{
				tok.find(".hpbar").show();
				tok.find(".ac").show();
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
			}, { duration: 1000, queue: false });


			let click = {
				x: 0,
				y: 0
			};
			tok.draggable({
				stop:
					function (event) {

						// CHECK IF SNAPPING IS ENABLED
						if (window.CURRENT_SCENE_DATA.snap == "1") {

							// calculate offset in real coordinates
							const startX = window.CURRENT_SCENE_DATA.offsetx;
							const startY = window.CURRENT_SCENE_DATA.offsety;

							const selectedOldTop = parseInt($(event.target).css("top"));
							const selectedOldleft = parseInt($(event.target).css("left"));

							const selectedNewtop = Math.round((selectedOldTop - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
							const selectedNewleft = Math.round((selectedOldleft - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;

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
					},

				start: function (event) {
					window.DRAGGING = true;
					click.x = event.clientX;
					click.y = event.clientY;

					console.log("Click x: " + click.x + " y: " + click.y);

					self.orig_top = self.options.top;
					self.orig_left = self.options.left;
					if (self.selected) {
						for (id in window.TOKEN_OBJECTS) {
							if (window.TOKEN_OBJECTS[id].selected) {
								$("[data-id='"+id+"']").addClass("pause_click");
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

						for (id in window.TOKEN_OBJECTS) {
							if ((id != self.options.id) && window.TOKEN_OBJECTS[id].selected && !window.TOKEN_OBJECTS[id].options.locked) {
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
			});

			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
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

function token_button(e, tokenIndex = null, tokenTotal = null) {
	console.log($(e.target).outerHTML());
	let imgsrc = parse_img($(e.target).attr("data-img"));
	let id;
	let centerX = $(window).scrollLeft() + Math.round(+$(window).width() / 2) - 200;
	let centerY = $(window).scrollTop() + Math.round($(window).height() / 2) - 200;

	centerX = Math.round(centerX * (1.0 / window.ZOOM));
	centerY = Math.round(centerY * (1.0 / window.ZOOM));


	id = $(e.target).attr('data-set-token-id');
	if (typeof (id) === "undefined") {
		id = uuid();
	}

	options = {
		id: id,
		imgsrc: imgsrc,
		left: centerX + "px",
		top: centerY + "px",
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
		auraVisible: true
	};

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


	if ($(e.target).attr('data-hidden')) {
		options.hidden = true;
	}

	if ($(e.target).attr('data-revealname')) {
		options.revealname = true;
	}

	if (typeof $(e.target).attr('data-stat') !== "undefined") {
		options.monster = $(e.target).attr('data-stat');
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

		// if there are custom images defined, use those instead of the default DDB image
		let customImgs = get_custom_monster_images($(e.target).attr('data-stat'));
		if (customImgs != undefined && customImgs.length > 0) {
			let randomIndex = getRandomInt(0, customImgs.length);
			options.imgsrc = customImgs[randomIndex];
		}
	}

	if (typeof $(e.target).attr('data-color') !== "undefined") {
		options.color = $(e.target).attr('data-color');
	}

	if (tokenIndex !== null && tokenTotal !== null) {
		options.left = (centerX + (((options.size || 68.33) * 5) / 2) * Math.cos(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
		options.top = (centerY + (((options.size || 68.33) * 5) / 2) * Math.sin(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
	}

	options = Object.assign({}, options, window.TOKEN_SETTINGS);
	window.ScenesHandler.create_update_token(options);

	if (id in window.PLAYER_STATS) {
		window.MB.handlePlayerData(window.PLAYER_STATS[id]);
	}

	window.MB.sendMessage('custom/myVTT/token', options);

}

function array_remove_index_by_value(arr, item) {
	for (var i = arr.length; i--;) {
		if (arr[i] === item) { arr.splice(i, 1); }
	}
}

function menu_callback(key, options, event) {
	if (key == "view") {
		if (typeof $(this).attr('data-monster') !== "undefined") {
			load_monster_stat($(this).attr('data-monster'));
		}
		else {
			//load_frame($(this).attr('data-id'));
			open_player_sheet($(this).attr('data-id'));
		}
	}
	if (key == "delete") {
		id = $(this).attr('data-id');
		$(this).remove();
		delete window.ScenesHandler.scene.tokens[id];
		delete window.TOKEN_OBJECTS[id];
		$("#aura_" + id.replaceAll("/", "")).remove();
		$("#combat_area tr[data-target='"+id+"']").remove(); // delete token from the combat tracker if it's there
		ct_persist();
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
	}
	if (key == "token_medium") {
		id = $(this).attr('data-id'); window.TOKEN_OBJECTS[id].size(Math.round(window.CURRENT_SCENE_DATA.hpps));
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
	
}

function token_inputs(opt) {
	// this is the trigger element
	//alert('chiamato');
	// export states to data store

	if (opt.$selected && opt.$selected.hasClass("aura-preset")) {
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
	
	tok.options.imgsrc = parse_img(data.imgsrc);

	if (window.DM) {
		if (is_monster) {
			if (data.hp.startsWith("+") || data.hp.startsWith("-"))
				data.hp = parseInt(tok.options.hp) + parseInt(data.hp);

			tok.options.hp = data.hp;

			if (data.max_hp.startsWith("+") || data.max_hp.startsWith("-"))
				data.max_hp = parseInt(tok.options.max_hp) + parseInt(data.max_hp);

			tok.options.max_hp = data.max_hp;
		}

		
		tok.options.name = data.name;

		if (opt.imgsrcSelection != undefined && opt.imgsrcSelection.length > 0) {
			tok.options.imgsrc = parse_img(opt.imgsrcSelection);
		} else {
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
			
			$("#combat_area tr[data-target='"+id+"']").remove(); // delete token from the combat tracker if it's there
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
				ret = {
					callback: multiple_callback,
					items: {
						token_combat: { name: 'Add to Combat Tracker' },
						hide: { name: 'Hide From Players' },
						show: { name: 'Show To Players' },
						delete: { name: 'Delete Token' }
					}
				};
				return ret;
			}
			else { // STANDARD SINGLE TOKEN MENU
				cond_items = {};
				custom_cond_items = {};
				custom_reminders = {}
				id = $(element).attr('data-id');
				is_monster = window.TOKEN_OBJECTS[id].options.monster > 0;

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
				
				// build a submenu in case there are multiple custom images defined
				let customImages = get_custom_monster_images(window.TOKEN_OBJECTS[id].options.monster);
				var customImageSelectorOptions = {
					imgsrc: {
						type: 'text',
						name: 'Custom Image',
						value: window.TOKEN_OBJECTS[id].options.imgsrc,
						events: {
							click: function(e) {
								$(e.target).select();
							}
						}
					}
				};
				for (let i = 0; i < customImages.length; i++) { 
					let iconUrl = customImages[i];
					customImageSelectorOptions['imgsrcSelect'+i] = { 
						name: '<img class="custom-token-image-menu-item-img" src="' + iconUrl + '" />', 
						isHtmlName: true,
						callback: function(key, opt){
							opt.imgsrcSelection = iconUrl;
						}
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
								token_medium: { name: 'Small or Medium' },
								token_large: { name: 'Large' },
								token_huge: { name: 'Huge' },
								token_gargantuan: { name: 'Gargantuan' },
								token_colossal: { name: 'Colossal' }
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
									name: 'Lock Token in Position',
									selected: window.TOKEN_OBJECTS[id].options.locked
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
								}
							}
						},
						sep1: "-------",
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
						sep2: '---------',
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
						sep3: '----------',
						imgsrc: {
							type: 'text',
							name: 'Custom Image',
							value: window.TOKEN_OBJECTS[id].options.imgsrc,
							events: {
								click: function(e) {
									$(e.target).select();
								}
							}
						},
						imgsrcSelect: {
							name: "Change Image",
							items: customImageSelectorOptions
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
				}
				
				if (customImages.length <= 1) {
					// only show the image select if there are multiple images to choose from
					delete ret.items.imgsrcSelect;
				} else {
					// remove imgsrc from the main menu. It is now in the imgsrcSelect submenu
					delete ret.items.imgsrc;
				}
				
				if(!window.DM){
					delete ret.items.view;
					delete ret.items.token_combat;
					delete ret.items.token_hidden;
					//delete ret.items.token_size;
					delete ret.items.options;
					delete ret.items.sep1;
					delete ret.items.hp;
					delete ret.items.max_hp;
					delete ret.items.delete;
					delete ret.items.name;
					//delete ret.items.imgsrc;
					delete ret.items.imgsrcSelect;
				}

				return ret;
			}
		}
	});
}

function deselect_all_tokens() {
	if (!window.DM)
		return;
	window.MULTIPLE_TOKEN_SELECTED = false;
	for (id in window.TOKEN_OBJECTS) {
		var curr = window.TOKEN_OBJECTS[id];
		if (curr.selected) {
			curr.selected = false;
			curr.place();
		}
	}
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


function build_token_image_map_menu() {
	// setup context menu for custom token image mapping
	$.contextMenu({
		selector: '#custom-img-src-anchor',
		events: {
			hide: custom_image_menu_callback
		},
		build: function($trigger, e) {
			// $trigger is the "#custom-img-src-anchor" element that we injected in MonsterPanel.js
			// grab the monsterId from that element, and any custom images that may have already been defined
			let monsterId = $trigger.data('monster-id');
			let customImages = get_custom_monster_images(monsterId);
			var imageItems = { };
			if (customImages != undefined && customImages.length > 0) {
				// the user has custom token images defined. Add them all as separate menu items each with their own "Remove" and "Copy Url" subitems
				for (let i = 0; i < customImages.length; i++) { 
					let iconUrl = customImages[i];
					imageItems['imgsrc'+i] = { 
						name: '<img class="custom-token-image-menu-item-img" src="' + iconUrl + '" />', 
						isHtmlName: true,
						value: iconUrl, 
						items: {
							remove: {
								name: "Remove",
								callback: function(key, opt){
									remove_custom_token_image(monsterId, i);
									opt.didRemove = true;
								}
							},
							copy: {
								name: "Copy Url",
								callback: function(key, opt){
									copy_to_clipboard(iconUrl);
								}
							}
						}
					};
				}

				// add a way to add more images. If there are more than 1 image defined, they will be chosen at random when placing them on the scene
				imageItems["addNew"] = {
					name: "Add Another Default Image",
					type: "text"
				};

				// also add an easy way to reset to the default DDB image
				imageItems["reset"] = { 
					name: "Reset to Default",
					callback: function(key, opt){
						opt.didReset = true;
						// clear all custom images from the mapping for this monster
						remove_all_custom_token_images(monsterId);
					}
				};

			} else {

				// There are no custom images defined. Add a way to replace the default DDB image
				imageItems["addNew"] = {
					name: "Replace The Default Image",
					type: "text"
				};

			}

			return {
				className: 'custom-token-image-menu',
				items: imageItems
			};
		}
	});
}

function get_custom_monster_images(monsterId) {
	if (monsterId == undefined) {
		return [];
	}
	if (window.CUSTOM_TOKEN_IMAGE_MAP == undefined) {
		load_custom_image_mapping();
	}
	var customImages = window.CUSTOM_TOKEN_IMAGE_MAP[monsterId];
	if (customImages == undefined) {
		customImages = [];
	}
	return customImages;
}

function add_custom_image_mapping(monsterId, imgsrc) {
	if (monsterId == undefined) {
		return;
	}
	var customImages = get_custom_monster_images(monsterId);
	customImages.push(imgsrc);
	window.CUSTOM_TOKEN_IMAGE_MAP[monsterId] = customImages;
	save_custom_image_mapping();
}

function remove_custom_token_image(monsterId, index) {
	var customImages = get_custom_monster_images(monsterId);;
	if (customImages.length > index) {
		window.CUSTOM_TOKEN_IMAGE_MAP[monsterId].splice(index, 1);
	}
	save_custom_image_mapping();
}

function remove_all_custom_token_images(monsterId) {
	delete window.CUSTOM_TOKEN_IMAGE_MAP[monsterId];
	save_custom_image_mapping();
}

function load_custom_image_mapping() {
	window.CUSTOM_TOKEN_IMAGE_MAP = {};
	let customMappingData = localStorage.getItem('CustomDefaultTokenMapping');
	if(customMappingData != null){
		window.CUSTOM_TOKEN_IMAGE_MAP = $.parseJSON(customMappingData);
	}
}

function save_custom_image_mapping() {
	let customMappingData = JSON.stringify(window.CUSTOM_TOKEN_IMAGE_MAP);
	localStorage.setItem("CustomDefaultTokenMapping", customMappingData);
	// The JSON structure for CUSTOM_TOKEN_IMAGE_MAP looks like this { "17100": [ "some.url.com/img1.png", "some.url.com/img2.png" ] }	
}

function custom_image_menu_callback(opt) {
	if (opt.didReset) {
		// all custom images hav been removed. Nothing else to do.
		return;
	}
	if (opt.didRemove) {
		// a single image was removed. reopen the menu after it has had time to fully close
		setTimeout(function(){ 
			$('#custom-img-src-anchor').contextMenu();
		}, 200);	
		return;
	}
	
	var data = $.contextMenu.getInputValues(opt, $(this).data());
	if (data.addNew != undefined && data.addNew.length > 0) {
		// a new image was added. save it
		add_custom_image_mapping(data.monsterId, data.addNew);
		setTimeout(function(){ 
			$('#custom-img-src-anchor').contextMenu();
		 }, 200);
	}
}

function copy_to_clipboard(text) {
	var $temp = $("<input>");
	$("body").append($temp);
	$temp.val(text).select();
	document.execCommand("copy");
	$temp.remove();
};
