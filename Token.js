
const STANDARD_CONDITIONS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious", "Exhaustion"];

const CUSTOM_CONDITIONS = ["Concentrated", "Bloodied", "Custom1", "Custom2"]

const CUSTOM_CONDITIONS_ICONS = {
	'Concentrated': "<div style='display:inline' title='Concentrated'>C</div>",
	'Bloodied': "<div style='display:inline' title='Bloodied'>B</div>",
	'Custom1': "<div style='display:inline' title='Custom 1'>1</div>",
	'Custom2': "<div style='display:inline' title='Custom 2'>2</div>",
}

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


const TOKEN_COLORS = [
	"FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
	"800000", "008000", "000080", "808000", "800080", "008080", "808080",
	"C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0",
	"400000", "004000", "000040", "404000", "400040", "004040", "404040",
	"200000", "002000", "000020", "202000", "200020", "002020", "202020",
	"600000", "006000", "000060", "606000", "600060", "006060", "606060",
	"A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0",
	"E00000", "00E000", "0000E0", "E0E000", "E000E0", "00E0E0", "E0E0E0",
];


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


	highlight() {
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
			$("html,body").animate({
				scrollTop: pageY + 200,
				scrollLeft: pageX + 200
			}, 500);



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




		if ((!(this.options.monster > 0)) || window.DM) {
			if (old.find(".hp").val().startsWith("+") || old.find(".hp").val().startsWith("-")) {
				old.find(".hp").val(parseInt(this.options.hp) + parseInt(old.find(".hp").val()));
			}
			if (old.find(".max_hp").val().startsWith("+") || old.find(".max_hp").val().startsWith("-")) {
				old.find(".max_hp").val(parseInt(this.options.max_hp) + parseInt(old.find(".max_hp").val()));
			}
			$("input").blur();

			this.options.hp = old.find(".hp").val();
			this.options.max_hp = old.find(".max_hp").val();

			// HEALTH AURA
			if (this.options.max_hp > 0) {
				if (this.options.max_hp > 0 && parseInt(this.options.hp) === 0) {
					const deadCross = old.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `--size: ${parseInt(this.options.size) / 10}px;`)
					} else {
						old.prepend(`<div class="dead" style="--size: ${parseInt(this.options.size) / 10}px;"></div>`);
					}
				} else {
					old.find('.dead').remove();
				}

				old.css('box-shadow',
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
		hpbar.css('left', '0px');
		hpbar.css('top', this.options.size - bar_height);
		//hpbar.css('background','red');
		hpbar.css('background', '#ff7777');
		hpbar.width("max-width: 100%");

		var fs = Math.floor(bar_height / 1.3) + "px";

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
		var bar_height = Math.max(6, Math.floor(this.options.size * 0.2)); // no less than 8px
		var fs = Math.floor(bar_height / 1.4) + "px";
		var ac = $("<div class='ac'/>");
		ac.css("position", "absolute");
		ac.css('left', this.options.size - Math.floor(this.options.size * 0.3));
		ac.css('width', bar_height);
		ac.css('height', bar_height);

		if (bar_height > 10) {
			ac.css('border-radius', '50%');
			ac.css('border', '1px solid black');
		}
		ac.css('background', 'lightyellow');
		ac.css('bottom', '0px');
		ac.text(this.options.ac);
		ac.css("height", bar_height);
		ac.css('font-weight', 'bold');
		ac.css("font-size", fs);
		ac.css("text-align", "center");
		return ac;
	}


	build_conditions() {

		var bar_width = Math.floor(this.options.size * 0.2);
		var cond = $("<div class='conditions' style='padding:0;margin:0'/>");
		cond.css("position", "absolute");
		cond.css("top", "0px");
		cond.css('height', this.options.size * 0.8);
		cond.css('left', this.options.size - bar_width)


		cond.width(bar_width);

		if (bar_width > 25)
			bar_width = 25;

		if ((this.options.conditions.length + this.options.custom_conditions.length) == 0) {
			cond.hide();
			return cond;
		}

		var maxheight = Math.round((this.options.size * 0.8) / (this.options.conditions.length + this.options.custom_conditions.length));

		for (var i = 0; i < this.options.conditions.length; i++) {
			var name = this.options.conditions[i];

			/*if(maxheight>13)
				maxheight=13;*/


			if (name.startsWith("Exhaustion")) {
				var newimg = $("<img style='padding:0;margin:0;' src='/content/1-0-1449-0/skins/waterdeep/images/icons/conditions/exhaustion.svg'/>");
				newimg.attr('title', [name, ...CONDITIONS.Exhaustion].join(`\n`));
				newimg.css('width', bar_width);
				newimg.css('padding', '0px');
				newimg.css('margin', '0px');
				newimg.css("max-height", maxheight + "px");
				newimg.css('background', "#" + TOKEN_COLORS[STANDARD_CONDITIONS.indexOf('Exhaustion')]);
				newimg.css('border-radius', '50%');
				newimg.css('display', 'inline-block');
				newimg.css('float', 'left');
				cond.append(newimg);
			}
			else {
				var fname = name.toLowerCase() + ".svg";
				var newimg = $("<img style='padding:0;margin:0;' src='/content/1-0-1449-0/skins/waterdeep/images/icons/conditions/" + fname + "'/>");
				newimg.attr('title', [name, ...CONDITIONS[name]].join('\n'));
				newimg.css('width', bar_width);
				newimg.css('padding', '0px');
				newimg.css('margin', '0px');
				newimg.css("max-height", maxheight + "px");
				newimg.css('background', "#" + TOKEN_COLORS[STANDARD_CONDITIONS.indexOf(name)]);
				newimg.css('border-radius', '50%');
				newimg.css('display', 'inline-block');
				newimg.css('float', 'left');
				cond.append(newimg);
			}
		}

		for (var i = 0; i < this.options.custom_conditions.length; i++) {
			var name = this.options.custom_conditions[i];
			var newimg = $(CUSTOM_CONDITIONS_ICONS[name]);
			newimg.attr('title', name);
			newimg.css('width', bar_width);
			newimg.css('padding', '0px');
			newimg.css('margin', '0px');
			newimg.css("max-height", maxheight + "px");
			newimg.css('background', "#" + TOKEN_COLORS[CUSTOM_CONDITIONS.indexOf(name) + STANDARD_CONDITIONS.length]);
			newimg.css('border-radius', '50%');
			newimg.css('display', 'inline-block');
			newimg.css('float', 'left');

			cond.append(newimg);
		}


		if (cond.children().length == 0) {
			cond.hide();
			return cond;
		}
		return cond;
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

			// HEALTH AURA / DEAD CROSS
			if (this.options.max_hp > 0) {
				const pData = window.PLAYER_STATS[this.options.id] || this.options;
				if (pData.max_hp > 0 && parseInt(pData.hp) === 0) {
					const deadCross = old.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `--size: ${parseInt(pData.size) / 10}px;`)
					} else {
						old.prepend(`<div class="dead" style="--size: ${parseInt(pData.size) / 10}px;"></div>`);
					}
				} else {
					old.find('.dead').remove();
				}

				old.css('box-shadow',
					`${token_health_aura(
						Math.round((pData.hp / pData.max_hp) * 100)
					)} 0px 0px 7px 7px`
				);
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

			old.find(".conditions").replaceWith(this.build_conditions());

			if (this.selected) {
				old.css("border", "2px solid white");
				old.addClass("tokenselected");
			}
			else {
				old.css("border", "");
				old.removeClass("tokenselected");
			}
			
			if(old.find("img").attr("src")!=this.options.imgsrc && !this.options.hidden){
				old.find("img").attr("src",this.options.imgsrc);
			}




			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
		else {
			var tok = $("<div/>");
			var hpbar = $("<input class='hpbar'>");
			var tokimg = $("<img class='Avatar_AvatarPortrait__2dP8u'/>"); // class to make them round


			var zindexdiff=Math.round(20/ (this.options.size/window.CURRENT_SCENE_DATA.hpps));
			console.log("Diff: "+zindexdiff);
			
			tok.css("z-index", 30+zindexdiff);
			tok.width(this.options.size);
			tok.addClass('token');

			tok.append(tokimg);

			if ((!(this.options.monster > 0)) || window.DM) {

				tok.append(this.build_hp());
				tok.append(this.build_ac());
			}

			// HEALTH AURA / DEAD CROSS
			console.log("AURAO - ", this.options);
			if (this.options.max_hp > 0) {
				const pData = window.PLAYER_STATS[this.options.id] || this.options;
				if (pData.max_hp > 0 && parseInt(pData.hp) === 0) {
					const deadCross = tok.find('.dead');
					if (deadCross.length > 0) {
						deadCross.attr("style", `--size: ${parseInt(pData.size) / 10}px;`)
					} else {
						tok.prepend(`<div class="dead" style="--size: ${parseInt(pData.size) / 10}px;"></div>`);
					}
				} else {
					tok.find('.dead').remove();
				}

				tok.css('box-shadow',
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
			tok.css("position", "absolute");
			tok.css("top", this.options.top);
			tok.css("left", this.options.left);
			tok.css("opacity", "0.0");

			if (typeof this.options.monster !== "undefined")
				tok.attr('data-monster', this.options.monster);

			if ((typeof this.options.name !== "undefined") && window.DM)
				tokimg.attr("title", this.options.name);


			var newopacity = 1.0;
			if (this.options.hidden) {
				if (window.DM)
					newopacity = 0.5; // DM SEE HIDDEN TOKENS AS OPACITY 0.5
				else
					tok.hide();
			}

			// CONDITIONS

			tok.append(this.build_conditions());




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
					function(e) {

						// CHECK IF SNAPPING IS ENABLED
						if (window.CURRENT_SCENE_DATA.snap == "1") {

							// calculate offset in real coordinates
							var startX = window.CURRENT_SCENE_DATA.offsetx;// * window.CURRENT_SCENE_DATA.scaleX;
							var startY = window.CURRENT_SCENE_DATA.offsety;// * window.CURRENT_SCENE_DATA.scaleY;


							var oldtop = parseInt($(e.target).css("top"));
							var oldleft = parseInt($(e.target).css("left"));



							var newtop = Math.round((oldtop - startY) / window.CURRENT_SCENE_DATA.vpps) * window.CURRENT_SCENE_DATA.vpps + startY;
							var newleft = Math.round((oldleft - startX) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.hpps + startX;

							console.log("oldtop " + oldtop + "newtop " + newtop);
							console.log("oldleft " + oldleft + "newleft " + newleft);
							$(e.target).css("top", newtop + "px");
							$(e.target).css("left", newleft + "px");

						}


						window.DRAGGING = false;
						self.update_and_sync(e);
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
				/*drag: function(evt,ui)
					{
						 var factor = (1 / window.ZOOM -1);
			
						 ui.position.top += Math.round((ui.position.top - ui.originalPosition.top) * factor);
						 ui.position.left += Math.round((ui.position.left- ui.originalPosition.left) * factor);    
					}
				*/
				start: function(event) {
					window.DRAGGING = true;
					click.x = event.clientX;
					click.y = event.clientY;
					self.orig_top = self.options.top;
					self.orig_left = self.options.left;
					if (self.selected) {
						for (id in window.TOKEN_OBJECTS) {
							if ((id != self.options.id) && window.TOKEN_OBJECTS[id].selected) {
								var curr = window.TOKEN_OBJECTS[id];
								curr.orig_top = curr.options.top;
								curr.orig_left = curr.options.left;
							}
						}
					}
					console.log("started");
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


					if (self.selected) { // if dragging on a selected token, we should move also the other selected tokens
						// try to move other tokens by the same amount
						//var offsetLeft=parseInt($(event.target).css("left"))-parseInt(orig_options.left);
						//var offsetTop=parseInt($(event.target).css("top"))-parseInt(orig_options.top);
						var offsetLeft = Math.round(ui.position.left - parseInt(self.orig_left));
						var offsetTop = Math.round(ui.position.top - parseInt(self.orig_top));

						//console.log("OFFSETLEFT "+offsetLeft+ " OFFSETTOP " + offsetTop);

						for (id in window.TOKEN_OBJECTS) {
							if ((id != self.options.id) && window.TOKEN_OBJECTS[id].selected) {
								//console.log("sposto!");
								var curr = window.TOKEN_OBJECTS[id];
								var tok = $("#tokens div[data-id='" + id + "']");
								tok.css('left', (parseInt(curr.orig_left) + offsetLeft) + "px");
								tok.css('top', (parseInt(curr.orig_top) + offsetTop) + "px");
								//curr.options.top=(parseInt(curr.orig_top)+offsetTop)+"px";
								//curr.place();
							}
						}

					}


				}

			});


			// 
			tok.dblclick(function(e) {
				self.highlight();
				var data = {
					id: self.options.id
				};
				window.MB.sendMessage('custom/myVTT/highlight', data);
			})


			check_token_visibility(); // CHECK FOG OF WAR VISIBILITY OF TOKEN
		}
	}

}


function token_button(e, tokenIndex = null, tokenTotal = null) {
	console.log($(e.target).outerHTML());
	let imgsrc = $(e.target).attr("data-img");
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
		color: '#ff0000',
		conditions: [],
		hp: "",
		max_hp: "",
		ac: "",
		name: ""
	};

	if ($(e.target).attr('data-size')) {
		options.size = $(e.target).attr('data-size');
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

	if (typeof $(e.target).attr('data-stat') !== "undefined") {
		options.monster = $(e.target).attr('data-stat');
	}

	if ($(e.target).attr('data-name') && (options.monster > 0)) { // ADD number to the end of named monsters
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
		else {
			options.name = $(e.target).attr('data-name');
		}
	}

	if (typeof $(e.target).attr('data-color') !== "undefined") {
		options.color = $(e.target).attr('data-color');
	}

	if (tokenIndex !== null && tokenTotal !== null) {
		options.left = (centerX + (((options.size || 68.33) * 5) / 2) * Math.cos(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
		options.top = (centerY + (((options.size || 68.33) * 5) / 2) * Math.sin(2 * Math.PI * tokenIndex / tokenTotal)) + 'px';
	}


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
	if (key == "hide") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].hide();
	}
	if (key == "show") {
		id = $(this).attr('data-id');
		window.TOKEN_OBJECTS[id].show();
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
}

function token_inputs(opt) {
	// this is the trigger element
	//alert('chiamato');
	// export states to data store


	id = $(this).attr("data-id");
	if (!(id in window.TOKEN_OBJECTS))
		return;

	data = $.contextMenu.getInputValues(opt, $(this).data());


	is_monster = window.TOKEN_OBJECTS[id].options.monster > 0;



	tok = window.TOKEN_OBJECTS[id];
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

	if (is_monster) {
		if (data.hp.startsWith("+") || data.hp.startsWith("-"))
			data.hp = parseInt(tok.options.hp) + parseInt(data.hp);

		tok.options.hp = data.hp;

		if (data.max_hp.startsWith("+") || data.max_hp.startsWith("-"))
			data.max_hp = parseInt(tok.options.max_hp) + parseInt(data.max_hp);

		tok.options.max_hp = data.max_hp;
	}


	tok.options.imgsrc=data.imgsrc;

	tok.place();
	tok.sync();
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

		});
		window.ScenesHandler.persist();
		window.ScenesHandler.sync();
	}


}

function token_menu() {
	if (window.DM) {

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
					id = $(element).attr('data-id');
					is_monster = window.TOKEN_OBJECTS[id].options.monster > 0;

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
					cond_items.sep1 = "-----";
					for (var i = 0; i < CUSTOM_CONDITIONS.length; i++) {
						command = "custom_" + CUSTOM_CONDITIONS[i];
						cond_items[command] = { name: CUSTOM_CONDITIONS[i], type: "checkbox" }
						if (window.TOKEN_OBJECTS[id].options.custom_conditions.includes(CUSTOM_CONDITIONS[i])) {
							cond_items[command].selected = true;
						}
					}


					ret = {
						callback: menu_callback,
						events: {
							hide: token_inputs
						},
						items: {
							view: { name: 'Open Character Sheet' },
							sep0: "--------",
							token_combat: { name: 'Add to Combat Tracker' },
							token_size: {
								name: "Set Token Size",
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
							sep1: "-------",
							hp: {
								type: 'text',
								name: 'Current HP',
								value: window.TOKEN_OBJECTS[id].options.hp,
								disabled: !is_monster,
								events: {
									click: function(e) {
										$(e.target).select();
									}
								}
							},
							max_hp: {
								type: 'text',
								name: 'Max Hp',
								value: window.TOKEN_OBJECTS[id].options.max_hp,
								disabled: !is_monster,
								events: {
									click: function(e) {
										$(e.target).select();
									}
								}
							},
							sep2: '---------',
							imgsrc:{
								type: 'text',
								name: 'IMG Url',
								value: window.TOKEN_OBJECTS[id].options.imgsrc,
								events: {
									click: function(e) {
										$(e.target).select();
									}
								}
							},
							sep3: '----------',
							hide: { name: 'Hide From Players' },
							show: { name: 'Show To Players' },
							delete: { name: 'Delete Token' }
						}
					};
					return ret;
				}
			}
		});
	}
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
