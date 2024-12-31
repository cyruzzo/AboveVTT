
const debounceCombatReorder = combatmydebounce((resetCurrent = false) => {
	ct_reorder(window.DM)
	if(resetCurrent){
		$("#combat_area tr[data-target]").each(function(){
			$(this).removeAttr('data-current');
		});
		$("#combat_area tr").first().attr('data-current','1');
	}
}, 250); //250ms so this still feels reactive
const debounceCombatPersist = combatmydebounce(() => {ct_persist()}, 500); //500 ms since doesn't have visible effect on the screen the change takes place.

function combatmydebounce(func, timeout = 800){ // we need to figure out where to put the original debounce somewhere we can access it earlier.
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}


function adjust_age(token, amt) {
	if(token.options.maxAge === false) return false;
	token.options.age = (parseInt(token.options.age) || 0) + amt;
	return true;
}

function adjust_condition_duration(token, amt) {
	function anycond(v, changed) {
		for(let i in v) {
			if(!isNaN(parseInt(v[i].duration))) {
				v[i].duration += amt;
				changed = true;
			}
		}
		return changed;
	}
	return anycond(token.options.conditions, anycond(token.options.custom_conditions, false));
}

function adjust_reaction_condition(token){
	token.options.custom_conditions = token.options.custom_conditions.filter(d=> d.name !='Reaction Used');
	$(`#tokens .token[data-id='${token.options.id}'] .conditions [id='Reaction Used']`).remove();
}

function init_combat_tracker(){
	window.ROUND_NUMBER =1;
	
	let ct=$("<div id='combat_tracker'/>");
	ct.css("height","20px"); // IMPORTANT
	
	let toggle=$("<button id='combat_button' class='hideable ddbc-tab-options__header-heading' style='display:inline-block'><u>C</u>OMBAT</button>");
	toggle.click(function(){
		if($("#combat_tracker_inside #combat_tracker_title_bar.minimized").length>0) {
			$("#combat_tracker_title_bar").dblclick();
		}
		if($("#combat_tracker_inside").is(":visible")){
			$("#combat_tracker_inside").attr('style', 'display: none;');
			$("#combat_tracker").css("height","20px"); // IMPORTANT
			toggle.removeClass("ddbc-tab-options__header-heading--is-active");
		}
		else{
			$("#combat_tracker_inside").attr('style', 'display: block;');
			$("#combat_tracker").css("height","450px"); // IMPORTANT
			toggle.addClass("ddbc-tab-options__header-heading--is-active");
		}
		reposition_player_sheet(); // not sure if this needs to be here, but maybe for smaller screens?
	});
	let pill = $(`<div class="ddbc-tab-options--layout-pill" />`);
	pill.append(toggle);
	ct.append(pill);
	let ct_inside=$("<div id='combat_tracker_inside'/>");
	ct_inside.hide();
	$('#site').append(ct_inside);
	const ct_title_bar=$("<div id='combat_tracker_title_bar' class='restored'></div>")
	const ct_title_bar_settings = $(`<div id='combat_tracker_title_bar_settings'><span class="material-symbols-outlined">settings</span></div>`)
	const ct_title_bar_popout=$('<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>');
	const ct_title_bar_exit=$('<div id="combat_tracker_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
	let ct_area=$("<table id='combat_area'/>");
	const ct_list_wrapper = $(`<div class="tracker-list"></div>`);
	ct_list_wrapper.mouseover(function(){
		$(this).css('--scrollY', $(this).scrollTop());
	});
	ct_title_bar_exit.click(function(){toggle.click();});
	ct_title_bar.append(ct_title_bar_popout);
	ct_title_bar_popout.click(function() {
		let name = "Combat Tracker";
		popoutWindow(name, $("#combat_tracker_inside"), $("#combat_tracker_inside").width(),  $("#combat_tracker_inside").height()-25);//subtract titlebar height
		removeFromPopoutWindow("Combat Tracker", "#combat_tracker_title_bar");
		$(childWindows['Combat Tracker'].document).find("#combat_tracker_inside").css({
			'display': 'block',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'width': '100%',
			'height': '100%'
		});
		if(!window.DM){
			$(childWindows['Combat Tracker'].document).find("body").toggleClass('body-rpgcharacter-sheet', true);
		}
		
		$(childWindows['Combat Tracker'].document).find("body").attr("id", "site");
		$(childWindows['Combat Tracker'].document).find("body").css('overflow', 'hidden');
		ct_title_bar_exit.click();
		if(window.DM) {
			$(childWindows['Combat Tracker'].document).find("#combat_tracker_inside #combat_footer").css('bottom', '-5px');
			$(childWindows['Combat Tracker'].document).find('input.hp').change(function(e) {
				let id = $(this).parent().parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.hp`).val($(this).val());
				$(`tr[data-target='${id}'] input.hp`).trigger("change");
				ct_update_popout();
			});	
			$(childWindows['Combat Tracker'].document).find('input.max_hp').change(function(e) {
				let id = $(this).parent().parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.max_hp`).val($(this).val());
				$(`tr[data-target='${id}'] input.max_hp`).trigger("change");
				ct_update_popout();
			});	
			$(childWindows['Combat Tracker'].document).find('input.init').change(function(){
				let id = $(this).parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.init`).val($(this).val());
				$(`tr[data-target='${id}'] input.init`).trigger("change");
				ct_update_popout();
			});
		}
	});
	ct_title_bar_settings.click(function(){openCombatTrackerSettings()});
	ct_title_bar.append(ct_title_bar_settings);
	ct_title_bar.append(ct_title_bar_exit);
	ct_inside.append(ct_title_bar);
	ct_list_wrapper.append(ct_area);
	ct_inside.append(ct_list_wrapper);

	$(ct_title_bar).dblclick(function(){
		if($(ct_title_bar).hasClass("restored")){
			$(ct_title_bar).data("prev-height", $("#combat_tracker_inside").height());
			$(ct_title_bar).data("prev-width", $("#combat_tracker_inside").width());
			$(ct_title_bar).data("prev-top", $("#combat_tracker_inside").css("top"));
			$(ct_title_bar).data("prev-left", $("#combat_tracker_inside").css("left"));
			$("#combat_tracker_inside").css("top", $(ct_title_bar).data("prev-minimized-top"));
			$("#combat_tracker_inside").css("left", $(ct_title_bar).data("prev-minimized-left"));
			$("#combat_tracker_inside").height(25);
			$("#combat_tracker_inside").width(200);
			$("#combat_tracker_inside").css("visibility", "hidden");
			$(ct_title_bar).css("visibility", "visible");
			$(ct_title_bar).addClass("minimized");
			$(ct_title_bar).removeClass("restored");
			$(ct_title_bar).prepend("<div id='ct_text_title'>Combat Tracker</div>")
		}
		else if($(ct_title_bar).hasClass("minimized")){
			$(ct_title_bar).data("prev-minimized-top", $("#combat_tracker_inside").css("top"));
			$(ct_title_bar).data("prev-minimized-left", $("#combat_tracker_inside").css("left"));
			$("#combat_tracker_inside").height($(ct_title_bar).data("prev-height"));
			$("#combat_tracker_inside").width($(ct_title_bar).data("prev-width"));
			$("#combat_tracker_inside").css("top", $(ct_title_bar).data("prev-top"));
			$("#combat_tracker_inside").css("left", $(ct_title_bar).data("prev-left"));
			$(ct_title_bar).addClass("restored");
			$(ct_title_bar).removeClass("minimized");
			$("#combat_tracker_inside").css("visibility", "visible");
			$("#ct_text_title").remove();
		}
	});
	
	let rn = $(`<div id='round_number_label'><strong>ROUND:</strong><input class="roundNum" style="font-size: 11px; width: 42px; appearance: none;" type='number' id='round_number' value=${window.ROUND_NUMBER}></div>`)
	let reset_rounds=$("<button style='font-size: 10px;'>RESET</button>");
	
	reset_rounds.click(function (){
		$(e.target).select();
		window.ROUND_NUMBER = 1;
		document.getElementById('round_number').value = window.ROUND_NUMBER;
		let tokenID = $("#combat_area tr[data-current]").attr('data-target');
		$("#combat_area tr[data-current]").removeAttr('data-current');
		$("#combat_area tr[data-current]").css('background','');
		$("#combat_area tr").first().attr('data-current','1');	
		if(window.TOKEN_OBJECTS[tokenID] != undefined){
				if(window.TOKEN_OBJECTS[tokenID]?.options?.round != undefined){
					delete window.TOKEN_OBJECTS[tokenID].options.round;			
				}
				if(window.TOKEN_OBJECTS[tokenID]?.options?.current != undefined){
					delete window.TOKEN_OBJECTS[tokenID].options.current;
				}
				window.TOKEN_OBJECTS[tokenID].update_and_sync();
		}
		if(window.all_token_objects[tokenID]?.options?.round != undefined){
			delete window.all_token_objects[tokenID].options.round;			
		}
		if(window.all_token_objects[tokenID]?.options?.current != undefined){
			delete window.all_token_objects[tokenID].options.current;
		}
		debounceCombatPersist();
		ct_update_popout();
	});

	rn.find("#round_number").change(function (data) {
		if(!isNaN(data.currentTarget.value)){
			window.ROUND_NUMBER = Math.round(data.currentTarget.value);
			debounceCombatPersist();
		}
		ct_update_popout();
		document.getElementById('round_number').value = window.ROUND_NUMBER;
		let tokenID = $("#combat_area tr[data-current]").attr('data-target');
		if(window.TOKEN_OBJECTS[tokenID] != undefined){
			window.TOKEN_OBJECTS[tokenID].options.round = window.ROUND_NUMBER;
			window.TOKEN_OBJECTS[tokenID].update_and_sync();
		}
	});
	
	ct_inside.append(rn);
	if(window.DM)
	{
		rn.append(reset_rounds);
	}
	else
	{
		rn.find("#round_number").prop("readonly", true);
	}
	
	buttons=$("<div id='combat_footer'/>");
	
	let reroll=$("<button class='roll-init-button'>REROLL</button>");
	reroll.click(function(){
		$("#combat_area tr[data-monster]:not([skipturn])").each(function(idx){
			let element=$(this);

			window.StatHandler.rollInit($(this).attr('data-monster'),function(value){
				element.find(".init").val(value);
					element.find(".init").trigger('change');
				if(element.attr("data-target") in window.TOKEN_OBJECTS){
					window.TOKEN_OBJECTS[element.attr("data-target")].options.init = value;
				}
				if(element.attr("data-target") in window.all_token_objects){
					window.all_token_objects[element.attr("data-target")].options.init = value;
				}
			}, $(this).attr('data-stat'), $(this).attr('data-target'));
		});
		
		debounceCombatReorder(true);

		ct_update_popout();
	});
	
	let clear=$("<button>CLEAR</button>");
	clear.click(function(){
		for(let id in window.all_token_objects)
		{	
			if(window.all_token_objects[id].options.ct_show == undefined)
				continue;
			ct_remove_token(window.all_token_objects[id], false);
			
			if(window.TOKEN_OBJECTS[id] != undefined){
				if(window.TOKEN_OBJECTS[id].options.combatGroupToken){
					window.TOKEN_OBJECTS[id].delete();
					continue;
				}
				window.TOKEN_OBJECTS[id].options.ct_show = undefined;
				if(window.TOKEN_OBJECTS[id].options.round != undefined){
					delete window.TOKEN_OBJECTS[id].options.round;	
				}
				if(window.TOKEN_OBJECTS[id].options.current != undefined){
					delete window.TOKEN_OBJECTS[id].options.current;	
				}
				window.TOKEN_OBJECTS[id].update_and_sync();
			}
			window.all_token_objects[id].options.ct_show = undefined;

		}
		window.ROUND_NUMBER = 1;
		document.getElementById('round_number').value = window.ROUND_NUMBER;
		debounceCombatPersist();
	});
	
	next=$("<button id='combat_next_button'>NEXT</button>");
	next.click(function(){
		if($("#combat_area tr").length==0)
			return;

		current=$("#combat_area tr[data-current=1]");
		let currentTarget = current.attr('data-target');
		if(current.length==0){
			console.log('nessuno selezionato');
			$($("#combat_area tr:not([skipTurn])")[0]).attr('data-current','1');
			currentTarget = $("#combat_area tr[data-current=1]").attr('data-target');

			if(window.TOKEN_OBJECTS[currentTarget] != undefined){
				window.TOKEN_OBJECTS[currentTarget].options.current = true;
				window.TOKEN_OBJECTS[currentTarget].update_and_sync();
				let combatSettingData = getCombatTrackersettings();
				let group = false;
				if(window.TOKEN_OBJECTS[currentTarget].options.combatGroupToken){
					group = Object.values(window.TOKEN_OBJECTS).find(d=> d.options.combatGroup == window.TOKEN_OBJECTS[currentTarget].options.combatGroup && !d.options.combatGroupToken);
				}
				if(combatSettingData['scroll_to_next'] == '1'){
					if(group){
						window.TOKEN_OBJECTS[group.options.id].highlight();
					}
					else{
						window.TOKEN_OBJECTS[currentTarget].highlight();
					}				
				}	
				if(combatSettingData['select_next'] == '1'){
					if(group){
						$(`#tokens .token[data-id='${group.options.id}']`).click();
					}
					else{
						$(`#tokens .token[data-id='${currentTarget}']`).click();
					}	
				}
			}

		}
		else{
			current.removeAttr('data-current');
			current.css('background','');
			next=$(current.nextAll('tr:not([skipTurn])')[0]);
			if(next.length==0){
				const autoInit = getCombatTrackersettings().auto_init;
				if(autoInit == '1'){
					$('.roll-init-button').click();
				}
				window.ROUND_NUMBER++;
				document.getElementById('round_number').value = window.ROUND_NUMBER;
				next=$("#combat_area tr:not([skipTurn])").first()
			}
			next.attr('data-current','1');
			if($("#resizeDragMon:not(.hideMon)").length>0 && $("[data-current] button.openSheetCombatButton").css('visibility') == 'visible' && !$('[data-current]').attr('data-target').startsWith('/profile')) {
				$("[data-current] button.openSheetCombatButton").click();
			}
			let newTarget=$("#combat_area tr[data-current=1]").attr('data-target');
			if(window.TOKEN_OBJECTS[currentTarget] != undefined){
				adjust_age(window.TOKEN_OBJECTS[currentTarget], -1)
				adjust_condition_duration(window.TOKEN_OBJECTS[currentTarget], -1)

				delete window.TOKEN_OBJECTS[currentTarget].options.current;
				delete window.TOKEN_OBJECTS[currentTarget].options.round;
				window.TOKEN_OBJECTS[currentTarget].update_and_sync();
			}
			if(window.TOKEN_OBJECTS[newTarget] != undefined){
				window.TOKEN_OBJECTS[newTarget].options.current = true;
				window.TOKEN_OBJECTS[newTarget].options.round = window.ROUND_NUMBER;
				adjust_reaction_condition(window.TOKEN_OBJECTS[newTarget]);
				window.TOKEN_OBJECTS[newTarget].update_and_sync();
				let combatSettingData = getCombatTrackersettings();
				let group = false;
				if(window.TOKEN_OBJECTS[newTarget].options.combatGroupToken){
					group = Object.values(window.TOKEN_OBJECTS).find(d=> d.options.combatGroup == window.TOKEN_OBJECTS[newTarget].options.combatGroup && !d.options.combatGroupToken);
				}
				if(combatSettingData['scroll_to_next'] == '1'){
					if(group){
						window.TOKEN_OBJECTS[group.options.id].highlight();
					}
					else{
						window.TOKEN_OBJECTS[newTarget].highlight();
					}				
				}	
				if(combatSettingData['select_next'] == '1'){
					if(group){
						$(`#tokens .token[data-id='${group.options.id}']`).click();
					}
					else{
						$(`#tokens .token[data-id='${newTarget}']`).click();
					}	
				}
			}

		}

		debounceCombatPersist();
		ct_update_popout();
		if(window.childWindows['Combat Tracker'] != undefined)
			$(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });
		$("#site tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });	
	});
	
	let prev=$("<button id='combat_prev_button'>PREV</button>");
	prev.click(function(){
		if($("#combat_area tr").length==0 || (document.getElementById('round_number').value <= 1 && $("#combat_area tr").first().attr('data-current') == 1))
			return;

		current=$("#combat_area tr[data-current=1]");
		let currentTarget = current.attr('data-target');

		if(current.length!=0){
			current.removeAttr('data-current');
			current.css('background','');
			let prev=$(current.prevAll('tr:not([skipTurn])')[0]);
			if(prev.length==0){
				window.ROUND_NUMBER--;
				document.getElementById('round_number').value = window.ROUND_NUMBER;
				prev=$("#combat_area tr:not([skipTurn])").last()
			}
			prev.attr('data-current','1');
			if($("#resizeDragMon:not(.hideMon)").length>0) {
				$("[data-current][data-monster] button.openSheetCombatButton").click();
			}
			let newTarget=$("#combat_area tr[data-current=1]").attr('data-target');
			if(window.TOKEN_OBJECTS[currentTarget] != undefined){
				delete window.TOKEN_OBJECTS[currentTarget].options.current;
				delete window.TOKEN_OBJECTS[currentTarget].options.round;
				window.TOKEN_OBJECTS[currentTarget].update_and_sync();
			}
			if(window.TOKEN_OBJECTS[newTarget] != undefined){
				adjust_age(window.TOKEN_OBJECTS[newTarget], 1)
				adjust_condition_duration(window.TOKEN_OBJECTS[newTarget], 1)
				window.TOKEN_OBJECTS[newTarget].options.current = true;
				window.TOKEN_OBJECTS[newTarget].options.round = window.ROUND_NUMBER;
				window.TOKEN_OBJECTS[newTarget].update_and_sync();
				let combatSettingData = getCombatTrackersettings();
				let group = false;
				if(window.TOKEN_OBJECTS[newTarget].options.combatGroupToken){
					group = Object.values(window.TOKEN_OBJECTS).find(d=> d.options.combatGroup == window.TOKEN_OBJECTS[newTarget].options.combatGroup && !d.options.combatGroupToken);
				}
				if(combatSettingData['scroll_to_next'] == '1'){
					if(group){
						window.TOKEN_OBJECTS[group.options.id].highlight();
					}
					else{
						window.TOKEN_OBJECTS[newTarget].highlight();
					}				
				}	
				if(combatSettingData['select_next'] == '1'){
					if(group){
						$(`#tokens .token[data-id='${group.options.id}']`).click();
					}
					else{
						$(`#tokens .token[data-id='${newTarget}']`).click();
					}	
				}
			}
		}
		
		debounceCombatPersist();
		ct_update_popout();
		if(window.childWindows['Combat Tracker'] != undefined)
			$(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });
		$("#site tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });	
	});

	let endplayerturn=$('<button id="endplayerturn">End Turn</button>');
	endplayerturn.click(function(){
		let data = {
			from: window.PLAYER_ID,
		}
		window.MB.sendMessage('custom/myVTT/endplayerturn', data);
		$("#endplayerturn").toggleClass('enabled', false);
		$("#endplayerturn").prop('disabled', true);
	});
	let rollplayerinit=$('<button id="rollplayerinit" class="roll-init-button">Roll Initiative</button>');
	rollplayerinit.click(function(){
		$(`.ct-combat__summary-group--initiative button.integrated-dice__container`).click();
	});
	
	
	if(window.DM){
		buttons.append(prev);
		buttons.append(clear);
		buttons.append(reroll);
		buttons.append(next);
		buttons.css('font-size','10px');	
	}
	else{
		buttons.append(rollplayerinit, endplayerturn);
	}
	ct_inside.append(buttons);
	
	if(window.DM) {
		ct.addClass('tracker-dm');
	} else {
		ct.addClass('tracker-player');
	}

	$("#site").append(ct);
	/*draggable and resizeable combat tracker - set which frame should be on top and remove others. Cover iframes to prevent mouse interference*/
	$("#combat_tracker_inside").addClass("moveableWindow");
	$("#combat_tracker_inside").draggable({
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
	$("#combat_tracker_inside").resizable({
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
	
	$("#combat_tracker_inside").mousedown(function() {
		frame_z_index_when_click($(this));
	});
}
function getCombatTrackersettings(){
	let combatSettingData = {};
	if(localStorage.getItem(`abovevtt-combat-tracker-settings-${window.DM}`) == null){
		combatSettingData = {
			tie_breaker: 0,
			scroll_to_next: 0,
			select_next: 0,
			auto_init: 0,
			remove_init: 0
		}
	}else{
		combatSettingData = $.parseJSON(localStorage.getItem(`abovevtt-combat-tracker-settings-${window.DM}`));
	}
	return combatSettingData;
}
function openCombatTrackerSettings(){
	let combatSettingData = getCombatTrackersettings();		

	function form_row(name, title, inputOverride=null, imageValidation=false) {
		const row = $(`<div style='width:100%;' id='${name}_row'/>`);
		const rowLabel = $("<div>" + title + "</div>");
		rowLabel.css("font-weight", "bold");
		const rowInputWrapper = $("<div/>");
		let rowInput
		if(!inputOverride){
			if (imageValidation){
				rowInput = $(`<input type="text" onClick="this.select();" name=${name} style='width:100%' autocomplete="off" value="${combatSettingData[name] || "" }" />`);
			}else{
				rowInput = $(`<input type="text" name=${name} style='width:100%' autocomplete="off" value="${combatSettingData[name] || ""}" />`);
			}
			 
		}
		else{
			rowInput = inputOverride
		}
		
		rowInputWrapper.append(rowInput);
		row.append(rowLabel);
		row.append(rowInputWrapper);
		return row
	};

	function form_toggle(name, hoverText, defaultOn, callback){
		const toggle = $(
			`<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
			class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
		if (!hoverText) toggle.removeClass("sidebar-hovertext")
		toggle.on("click", callback)
		if (combatSettingData[name] === '1' || defaultOn){
			toggle.addClass("rc-switch-checked")
		}
		return toggle
	}


	$("#edit_dialog").remove();


	$("#scene_selector").attr('disabled', 'disabled');
	dialog = $(`<div id='edit_dialog'></div>`);
	dialog.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");


	ctSettings = $('<div id="combat-tracker-settings"/>');
	dialog.append(ctSettings);


	adjust_create_import_edit_container(dialog, undefined, undefined, 2000, 360);

	let container = ctSettings;

	container.empty();

	const form = $("<form id='edit_scene_form'/>");
	form.on('submit', function(e) { e.preventDefault(); });



	let tieBreakerToggle = form_toggle('tie_breaker', 'Adds the dex score as a decimal to tie break initiative', combatSettingData['tie_breaker'] == '1', function(e){
		handle_basic_form_toggle_click(e)
	});
	let tieBreakerRow = form_row(`tie_breaker`, `Add Tie Breaker to Initiative Rolls`, tieBreakerToggle)

	if(window.DM){
		form.append(tieBreakerRow);
	}

	let scrollToNextToggle = form_toggle('scroll_to_next', 'Scroll to Token on Next/Prev', combatSettingData['scroll_to_next'] == '1', function(e){
		handle_basic_form_toggle_click(e)
	});
	let scrollToNextRow = form_row(`scroll_to_next`, `Auto Center Token on Next/Prev`, scrollToNextToggle)
	form.append(scrollToNextRow);

	let autoSelectNextToggle = form_toggle('select_next', 'Select Token on Next/Prev', combatSettingData['select_next'] == '1', function(e){
		handle_basic_form_toggle_click(e)
	});
	let autoSelectNextRow = form_row(`select_next`, `Select Token on Next/Prev`, autoSelectNextToggle)
	form.append(autoSelectNextRow);

	let autoRollInitAtTopToggle = form_toggle('auto_init', `${window.DM ? 'Auto Roll Monster Init at Top of Round' : 'Auto Roll Initiative at Top of Round'}`, combatSettingData['auto_init'] == '1', function(e){
		handle_basic_form_toggle_click(e)
	});
	let autoRollInitAtTopRow = form_row(`auto_init`, `${window.DM ? 'Auto Roll Monster Init at Top of Round' : 'Auto Roll Initiative at Top of Round'}`, autoRollInitAtTopToggle)
	form.append(autoRollInitAtTopRow);

	let removeInitToggle = form_toggle('remove_init', `When enabled instead of using a tokens saved initiative when removed and added back to combat it will be rerolled.`, combatSettingData['remove_init'] == '1', function(e){
		handle_basic_form_toggle_click(e)
	});
	let removeInitRow = form_row(`remove_init`, `Ignore token's saved init on add to combat`, removeInitToggle)
	if(window.DM)
		form.append(removeInitRow);

	const cancel = $("<button type='button' id='cancel_importer'>Cancel</button>");
	cancel.click(function() {
		$("#sources-import-main-container").remove();
		$(".ddb-classes-page-stylesheet").remove();
		$("#scene_selector").removeAttr("disabled");
		
	})
	const submitButton = $("<button type='button'>Save</button>");
	submitButton.click(async function() {
		let settings = {};
		const formData = await get_edit_form_data();
		for (key in formData) {
			settings[key] = formData[key];
		}


				
		localStorage.setItem(`abovevtt-combat-tracker-settings-${window.DM}`, JSON.stringify(settings))



		$("#sources-import-main-container").remove();
		$("#scene_selector").removeAttr("disabled");
		$("#scene_selector_toggle").click();

	});

	form.append(submitButton);
	form.append(cancel);
	//		f.append(export_grid);
	container.css('opacity', '0.0');
	container.append(form);
	
	container.animate({
		opacity: '1.0'
	}, 1000);
}
function ct_reorder(persist=true) {

	let items = $("#combat_area").children().sort(
		function(a, b) {
			let vA = (isNaN(parseFloat($(".init", a).val()))) ? -1 : parseFloat($(".init", a).val());
			let vB =  (isNaN(parseFloat($(".init", b).val()))) ? -1 : parseFloat($(".init", b).val());
			return (vA > vB) ? -1 : (vA < vB) ? 1 : 0;
		});

	$("#combat_area").append(items);

	let groupLines = $("#combat_area>tr[skipTurn]");
	for(let i = 0; i<groupLines.length; i++){
		let targetToken = window.all_token_objects[$(groupLines[i]).attr('data-target')];
		if(window.all_token_objects[$(groupLines[i]).attr('data-target')])
			$(groupLines[i]).insertAfter($(`#combat_area>tr[data-target='${targetToken.options.combatGroup}']`));
	}

	$("#combat_area>tr[skipTurn]").css('display', '');		
	ct_update_popout();
	if(persist)
		debounceCombatPersist();
}


function ct_add_token(token,persist=true,disablerolling=false, adv=false, dis=false){
	if(token.options.name == "Not in the current map")
		return;
	if (token.isAoe()) {
		return; // don't add aoe to combat tracker
	}

	selector="#combat_area tr[data-target='"+token.options.id+"']";
	if($(selector).length>0)
		return;

	entry=$("<tr/>");
	entry.css("height","30px");
	entry.attr("data-target",token.options.id);	
	entry.attr("ishidden", token.options.hidden);
	if(token.options.combatGroup && !token.options.combatGroupToken){
		entry.attr("skipTurn", token.options.combatGroup);
		entry.css('display', 'none');
	}
	entry.addClass("CTToken");
	
	if (typeof(token.options.ct_show) == 'undefined'){
		if(token.options.hidden) {
			token.options.ct_show = false;
	
			window.all_token_objects[token.options.id].options.ct_show = false;
			window.all_token_objects[token.options.id].update_and_sync();
			
		}
		else {		
			if(typeof window.all_token_objects[token.options.id].options.ct_show != 'undefined') {
				token.options.ct_show = window.all_token_objects[token.options.id].options.ct_show;
			}
			else{
				token.options.ct_show = true;
				window.all_token_objects[token.options.id].options.ct_show = true;
				window.all_token_objects[token.options.id].update_and_sync();
			}
		}	
	}


	if ((token.options.name) && (window.DM || token.isPlayer() || token.options.revealname)) {
		entry.attr("data-name", token.options.name);
		entry.addClass("hasTooltip");
	}

	if(token.options.monster > 0 || token.options.monster == 'open5e' || token.options.monster == 'customStat' )
		entry.attr('data-monster',token.options.monster);
	
	if(token.options.stat)
		entry.attr('data-stat', token.options.stat)

	if(token.options.combatGroupToken)
		entry.attr('data-group', token.options.combatGroupToken)

	let video = false;

	if(['.mp4', '.webm','.m4v'].some(d => token.options.imgsrc.includes(d))){
		img = $("<video disableRemotePlayback muted width=35 height=35 class='Avatar_AvatarPortrait__2dP8u'>");
		video = true;
	} 
	else{
		img = $("<img width=35 height=35 class='Avatar_AvatarPortrait__2dP8u'>");
	}

	updateImgSrc(token.options.imgsrc, img, video);
	img.css('border','3px solid '+token.options.color);
	if (token.options.hidden == true){
		img.css('opacity','0.5');
	}
	let acValue = token.ac;
	let ac =	$(`
			<div class='ac'><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="ac_shield" x="0px" y="0px" viewBox="6.991001129150391 0 45.999996185302734 59.981998443603516" xml:space="preserve" height="18px" width="18px">
				<g xmlns="http://www.w3.org/2000/svg" transform="translate(6 0)">
					<path d="M51.991,7.982c-14.628,0-21.169-7.566-21.232-7.64c-0.38-0.456-1.156-0.456-1.536,0c-0.064,0.076-6.537,7.64-21.232,7.64   c-0.552,0-1,0.448-1,1v19.085c0,10.433,4.69,20.348,12.546,26.521c3.167,2.489,6.588,4.29,10.169,5.352   c0.093,0.028,0.189,0.042,0.285,0.042s0.191-0.014,0.285-0.042c3.581-1.063,7.002-2.863,10.169-5.352   c7.856-6.174,12.546-16.088,12.546-26.521V8.982C52.991,8.43,52.544,7.982,51.991,7.982z "></path>
					<path d="M50.991,28.067   c0,9.824-4.404,19.151-11.782,24.949c-2.883,2.266-5.983,3.92-9.218,4.921c-3.235-1-6.335-2.655-9.218-4.921   C13.395,47.219,8.991,37.891,8.991,28.067V9.971c12.242-0.272,18.865-5.497,21-7.545c2.135,2.049,8.758,7.273,21,7.545V28.067z" style="fill:white;"></path>
					<text style="font-size:34px;color:#000;" transform="translate(${acValue> 9 ? 9 : 20},40)">${acValue}</text>
				</g>
			</svg></div>
	`);
	let imageRow = $("<td/>");
	imageRow.append(img)
	if(window.DM && !token.options.combatGroupToken){
		imageRow.append(ac)
	}
	entry.append(imageRow);
	let init=$("<input class='init' maxlength=5'>");
	init.css('-webkit-appearance','none');
	if(token.options.combatGroup && !token.options.combatGroupToken){
		if( window.all_token_objects[token.options.combatGroup]){
			token.options.init = window.all_token_objects[token.options.combatGroup].options.init;
			init.val(window.all_token_objects[token.options.combatGroup].options.init);
		}
		init.attr('disabled', 'disabled');
	}
	else{
		if(window.DM && typeof(token.options.init) == 'undefined'){


			if (typeof window.all_token_objects[token.options.id].options.init != 'undefined'){
		 		token.options.init = window.all_token_objects[token.options.id].options.init;
		 		window.TOKEN_OBJECTS[token.options.id].options.init = init.val();
				init.val(token.options.init);
			}	
			else{
				init.val(0);
			}
		}
		else if(window.DM){
			init.val(token.options.init);
		}
		else{
			init.val(token.options.init);
			init.attr("disabled","disabled");
		}
		init.click(function(e) {
			$(e.target).select();
		});
		if(window.DM){
			init.change(function(){	

					window.all_token_objects[token.options.id].options.init = init.val()
					window.all_token_objects[token.options.id].sync = mydebounce(function(e) {				
						window.MB.sendMessage('custom/myVTT/token', window.all_token_objects[token.options.id].options);
					}, 300);
				
					token.options.init = init.val();
					if(!!window.TOKEN_OBJECTS[token.options.id]){
						window.TOKEN_OBJECTS[token.options.id].options.init = init.val();
						window.TOKEN_OBJECTS[token.options.id].update_and_sync();
					}
					if(token.options.combatGroupToken){
						let noTurnTokens = $(`#combat_area>tr[skipturn='${token.options.combatGroupToken}']`);
						noTurnTokens.find('.init').val(init.val());
					}
					ct_reorder(window.DM);
				}
			);
		}


		
		// auto roll initiative for monsters
		if(window.DM && (token.options.monster > 0 || token.options.monster == 'open5e' || token.options.monster == 'customStat') && (!disablerolling) && token.options.init == undefined){
			window.StatHandler.rollInit(token.options.monster,function(value){
				init.val(value);
				token.options.init = value;
				init.trigger('change');
				if(window.TOKEN_OBJECTS[token.options.id] != undefined){			
					window.TOKEN_OBJECTS[token.options.id].update_and_sync()
				}
				debounceCombatReorder();
			}, token.options.itemId, token.options.id, adv, dis);
		}
	}

	entry.append($("<td/>").append(init));
		
	hp=$("<div class='hp'/>");
	let hp_input = $("<input class='hp'>");
	if(token.isPlayer()){
		hp_input.prop("disabled", true);
	}
	hp_input.val(token.hp);
	hp.append(hp_input);
	if(hp_input.val() === '0'){
		entry.toggleClass("ct_dead", true);
	}
	else{
		entry.toggleClass("ct_dead", false);
	}
	hp.css('font-size','11px');
	//hp.css('width','20px');	
		
	let divider = $("<div style='display:inline-block;float:left'>/</>");
		
	let max_hp=$("<div class='max_hp'/>");
	let maxhp_input = $("<input class='max_hp'>");
	if(token.isPlayer()){
		maxhp_input.prop("disabled", true);
	}
	maxhp_input.val(token.maxHp);
	max_hp.append(maxhp_input);
	max_hp.css('font-size','11px');
	//max_hp.css('width','20px');

	if((token.options.hidestat == true && !window.DM && !token.isCurrentPlayer()) || (!(token.options.id.startsWith("/profile")) && !window.DM && !token.options.player_owned)) {
		divider.css('visibility', 'hidden');
		hp.css('visibility', 'hidden');
		max_hp.css('visibility', 'hidden');
	}
	 if(!token.options.combatGroupToken){
	 		entry.append($("<td/>").append(hp));
			entry.append($("<td/>").append(divider));
			entry.append($("<td/>").append(max_hp));
	 }
	 else{
	 	entry.append($(`<td/>`))
	 	entry.append($(`<td/>`))
	 	entry.append($(`<td/>`))
	 }


	// bind update functions to hp inputs, same as Token.js
	// token update logic for hp pulls hp from token hpbar, so update hp bar manually
	if (!token.isPlayer()) {
		hp_input.change(function(e) {
			let selector = "div[data-id='" + token.options.id + "']";
			let old = $("#tokens").find(selector);
		
			if ($(this).val().trim().startsWith("+") || $(this).val().trim().startsWith("-")) {
				$(this).val(Math.max(0, parseInt(token.hp) + parseInt($(this).val())));
			}

			old.find(".hp").val($(this).val().trim());	

			if(window.all_token_objects[token.options.id] != undefined){
				window.all_token_objects[token.options.id].hp = $(this).val();
			}			
			if(window.TOKEN_OBJECTS[token.options.id] != undefined){		
				window.TOKEN_OBJECTS[token.options.id].hp = $(this).val();
				window.TOKEN_OBJECTS[token.options.id].update_and_sync();
			}			
		});
		hp_input.click(function(e) {
			$(e.target).select();
		});
		maxhp_input.change(function(e) {
			let selector = "div[data-id='" + token.options.id + "']";
			let old = $("#tokens").find(selector);

			if ($(this).val().trim().startsWith("+") || $(this).val().trim().startsWith("-")) {
				$(this).val(Math.max(0, token.maxHp + parseInt($(this).val())));
			}

			old.find(".max_hp").val($(this).val().trim());
			if(window.all_token_objects[token.options.id] != undefined){
				window.all_token_objects[token.options.id].maxHp = $(this).val();
			}
			if(window.TOKEN_OBJECTS[token.options.id] != undefined){		
				window.TOKEN_OBJECTS[token.options.id].maxHp = $(this).val();
				window.TOKEN_OBJECTS[token.options.id].update_and_sync();
			}			
		});
		maxhp_input.click(function(e) {
			$(e.target).select();
		});
	}
	else {
		hp.off('click.message').on('click.message', function(){
			showTempMessage('Player HP must be adjusted on the character sheet.')
		})
		hp_input.keydown(function(e) { if (e.keyCode == '13') token.update_from_page(); e.preventDefault(); }); // DISABLE WITHOUT MAKING IT LOOK UGLY
		maxhp_input.keydown(function(e) { if (e.keyCode == '13') token.update_from_page(); e.preventDefault(); });
	}
	
	let buttons=$("<td/>");
	
	if(!token.options.combatGroupToken){


		if(token.options.id in window.TOKEN_OBJECTS || !window.DM){
			find=$('<button class="findTokenCombatButton" style="font-size:10px;"><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg></button>');
		}
		else {
			find=$('<button class="findTokenCombatButton" style="font-size:10px;"><svg class="findSVG addCTSVG" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class=""><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg></button>');
		}
		find.click(function(){
			let target=$(this).parent().parent().attr('data-target');
			if(target in window.TOKEN_OBJECTS){
				window.TOKEN_OBJECTS[target].highlight();	     
			}
			else if(target in window.all_token_objects){
				place_token_in_center_of_view(window.all_token_objects[target].options);
			  	$(`#combat_area tr[data-target='${target}'] .findSVG`).remove();
	           	let findSVG=$('<svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg>');	
	            $(`#combat_area tr[data-target='${target}'] .findTokenCombatButton`).append(findSVG);
	            ct_update_popout();
			}
		});

		

		buttons.append(find);
	}
	else{

			find=$('<button class="findTokenCombatButton expandgroup collapsed" style="font-size:10px;"><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z"/></svg></button>');
			find.click(function(){
				if($(this).hasClass('collapsed')){
					$(this).toggleClass('collapsed', false);
					$(`[skipturn="${token.options.combatGroupToken}"]`).toggleClass('showGroupTokens', true);
				}
				else{
					$(this).toggleClass('collapsed', true);
					$(`[skipturn="${token.options.combatGroupToken}"]`).toggleClass('showGroupTokens', false);
				}				
			});
			buttons.append(find);
	}



	del=$('<button class="removeTokenCombatButton" style="font-size:10px;"><svg class="delSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg></button>');
	del.click(
		function(){
			if(!token.options.combatGroupToken){
				if(window.TOKEN_OBJECTS[token.options.id] != undefined){
					window.TOKEN_OBJECTS[token.options.id].options.ct_show = undefined;	
					if(window.TOKEN_OBJECTS[token.options.id].options.round != undefined){
						delete window.TOKEN_OBJECTS[token.options.id].options.round;	
					}
					if(window.TOKEN_OBJECTS[token.options.id].options.current != undefined){
						delete window.TOKEN_OBJECTS[token.options.id].options.current;	
					}
					window.TOKEN_OBJECTS[token.options.id].update_and_sync();
				}
				if(window.all_token_objects[token.options.id] != undefined){
					window.all_token_objects[token.options.id].options.ct_show = undefined;
				}
			}
			ct_remove_token(token);
			if(token.options.combatGroupToken){
				token.delete();
			}
			
		}
	);

	if(window.DM && !(token.options.combatGroup && !token.options.combatGroupToken)){
		buttons.append(del);
	}
	
	if(!token.isPlayer()){
		stat=$('<button class="openSheetCombatButton" style="font-size:10px;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		
		stat.click(function(){			
			if(token.options.statBlock){
				let customStatBlock = window.JOURNAL.notes[token.options.statBlock].text;
				let pcURL = $(customStatBlock).find('.custom-pc-sheet.custom-stat').text();
				if(pcURL){
					open_player_sheet(pcURL);
				}else{
					load_monster_stat(undefined, token.options.id, customStatBlock)
				}

				return;
			}
			load_monster_stat(token.options.monster, token.options.id);
		});
		if(window.DM){
			buttons.append(stat);
			if(!token.isMonster() && !token.options.statBlock){
				stat.css("visibility", "hidden");
			}


			ct_show_checkbox = $(`<input id="`+token.options.id+`hideCombatTrackerInput"type='checkbox' class="combatHideFromPlayerInput" style="font-size:10px;" class='hideInPlayerCombatCheck' target_id='`+token.options.id+`' checked='`+token.options.ct_show+`'/>`);


			eye_button = $('<button class="hideFromPlayerCombatButton" style="font-size:10px;"></button>');

			open_eye = $('<svg xmlns="http://www.w3.org/2000/svg" class="openEye" height="24" width="24" viewBox="0 0 24 24"><path xmlns="http://www.w3.org/2000/svg" d="M12 16Q13.875 16 15.188 14.688Q16.5 13.375 16.5 11.5Q16.5 9.625 15.188 8.312Q13.875 7 12 7Q10.125 7 8.812 8.312Q7.5 9.625 7.5 11.5Q7.5 13.375 8.812 14.688Q10.125 16 12 16ZM12 14.2Q10.875 14.2 10.088 13.412Q9.3 12.625 9.3 11.5Q9.3 10.375 10.088 9.587Q10.875 8.8 12 8.8Q13.125 8.8 13.913 9.587Q14.7 10.375 14.7 11.5Q14.7 12.625 13.913 13.412Q13.125 14.2 12 14.2ZM12 19Q8.35 19 5.35 16.962Q2.35 14.925 1 11.5Q2.35 8.075 5.35 6.037Q8.35 4 12 4Q15.65 4 18.65 6.037Q21.65 8.075 23 11.5Q21.65 14.925 18.65 16.962Q15.65 19 12 19ZM12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5Q12 11.5 12 11.5ZM12 17Q14.825 17 17.188 15.512Q19.55 14.025 20.8 11.5Q19.55 8.975 17.188 7.487Q14.825 6 12 6Q9.175 6 6.812 7.487Q4.45 8.975 3.2 11.5Q4.45 14.025 6.812 15.512Q9.175 17 12 17Z"/></svg>');
			closed_eye = $('<svg class="closedEye" xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24"><path xmlns="http://www.w3.org/2000/svg" d="M16.1 13.3 14.65 11.85Q14.875 10.675 13.975 9.65Q13.075 8.625 11.65 8.85L10.2 7.4Q10.625 7.2 11.062 7.1Q11.5 7 12 7Q13.875 7 15.188 8.312Q16.5 9.625 16.5 11.5Q16.5 12 16.4 12.438Q16.3 12.875 16.1 13.3ZM19.3 16.45 17.85 15.05Q18.8 14.325 19.538 13.462Q20.275 12.6 20.8 11.5Q19.55 8.975 17.212 7.487Q14.875 6 12 6Q11.275 6 10.575 6.1Q9.875 6.2 9.2 6.4L7.65 4.85Q8.675 4.425 9.75 4.212Q10.825 4 12 4Q15.775 4 18.725 6.087Q21.675 8.175 23 11.5Q22.425 12.975 21.488 14.238Q20.55 15.5 19.3 16.45ZM19.8 22.6 15.6 18.45Q14.725 18.725 13.838 18.863Q12.95 19 12 19Q8.225 19 5.275 16.913Q2.325 14.825 1 11.5Q1.525 10.175 2.325 9.037Q3.125 7.9 4.15 7L1.4 4.2L2.8 2.8L21.2 21.2ZM5.55 8.4Q4.825 9.05 4.225 9.825Q3.625 10.6 3.2 11.5Q4.45 14.025 6.787 15.512Q9.125 17 12 17Q12.5 17 12.975 16.938Q13.45 16.875 13.95 16.8L13.05 15.85Q12.775 15.925 12.525 15.962Q12.275 16 12 16Q10.125 16 8.812 14.688Q7.5 13.375 7.5 11.5Q7.5 11.225 7.537 10.975Q7.575 10.725 7.65 10.45ZM13.525 10.725Q13.525 10.725 13.525 10.725Q13.525 10.725 13.525 10.725Q13.525 10.725 13.525 10.725Q13.525 10.725 13.525 10.725Q13.525 10.725 13.525 10.725Q13.525 10.725 13.525 10.725ZM9.75 12.6Q9.75 12.6 9.75 12.6Q9.75 12.6 9.75 12.6Q9.75 12.6 9.75 12.6Q9.75 12.6 9.75 12.6Q9.75 12.6 9.75 12.6Q9.75 12.6 9.75 12.6Z"/></svg>');
			eye_button.click(function(){
				$("#"+token.options.id+"hideCombatTrackerInput").click();
			});
			if(token.options.ct_show==true) {
				open_eye.css('display', 'block');
				closed_eye.css('display', 'none');
			}
			else {
				closed_eye.css('display', 'block');
				open_eye.css('display', 'none');
				$(ct_show_checkbox).prop('checked', false);
			}
			$(ct_show_checkbox).change(function() {
				if($(this).is(':checked')) {
					token.options.ct_show = true;
					$("#"+token.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'block');
					$("#"+token.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'none');
				}
				else{
					token.options.ct_show = false;
					$("#"+token.options.id+"hideCombatTrackerInput ~ button svg.closedEye").css('display', 'block');
					$("#"+token.options.id+"hideCombatTrackerInput ~ button svg.openEye").css('display', 'none');
				}

				if(token.options.id in window.TOKEN_OBJECTS) {
					window.TOKEN_OBJECTS[token.options.id].update_and_sync();
				}	
				ct_update_popout();
				debounceCombatPersist();
			});

			
			eye_button.append(open_eye);
			eye_button.append(closed_eye);
			buttons.prepend(eye_button);
			buttons.prepend(ct_show_checkbox);
		}
	}	
	else if (token.isPlayer()) {
		stat=$('<button class="openSheetCombatButton" style="font-size:10px;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		stat.click(function(){
			open_player_sheet(token.options.id);
		});
		if(window.DM)
			buttons.append(stat);
	}
	
		entry.append(buttons);
	
	$("#combat_area").append(entry);

  	ct_update_popout();

	if(window.DM && persist == true){
		debounceCombatReorder();
	}
	
}

function ct_list_tokens() {
	let tokenIds = [];
	$('#combat_area tr').each(function () {
		tokenIds.push($(this).attr("data-target"));
	})
	return tokenIds;
}

/** @return {string|undefined} the id of the token that is currently active in the combat tracker; undefined if no active turn */
function ct_current_turn() {
	return $('#combat_area tr[data-current=1]').attr("data-target");
}

function ct_persist(){
	let data= [];
	$('#combat_area tr').each( function () {			
	  	data.push( {
			'data-target': $(this).attr("data-target"),
			'current': ($(this).attr("data-current")=="1"),
			'options': window.all_token_objects[$(this).attr("data-target")].options
		});		  
	});

	data.push({'data-target': 'round',
				'round_number':window.ROUND_NUMBER});
        
	window.MB.sendMessage("custom/myVTT/CT",data);
}

function ct_update_popout(){
	if(childWindows['Combat Tracker']){
		$(childWindows['Combat Tracker'].document).find("body").empty("");
		updatePopoutWindow("Combat Tracker", $("#combat_tracker_inside"));
		removeFromPopoutWindow("Combat Tracker", "#combat_tracker_title_bar");
		$(childWindows['Combat Tracker'].document).find("#combat_tracker_inside").css({
			'display': 'block',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'width': '100%',
			'height': '100%'
		});
		$(childWindows['Combat Tracker'].document).find("body").css('overflow', 'hidden');
		if(window.DM) {
			$(childWindows['Combat Tracker'].document).find("#combat_tracker_inside #combat_footer").css('bottom', '-5px');
			$(childWindows['Combat Tracker'].document).find('input.hp').change(function(e) {
				let id = $(this).parent().parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.hp`).val($(this).val());
				$(`tr[data-target='${id}'] input.hp`).trigger("change");
				ct_update_popout();
			});	
			$(childWindows['Combat Tracker'].document).find('input.max_hp').change(function(e) {
				let id = $(this).parent().parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.max_hp`).val($(this).val());
				$(`tr[data-target='${id}'] input.max_hp`).trigger("change");
				ct_update_popout();
			});	
			$(childWindows['Combat Tracker'].document).find('input.init').change(function(){
				let id = $(this).parent().parent().attr("data-target");
				$(`tr[data-target='${id}'] input.init`).val($(this).val());
				$(`tr[data-target='${id}'] input.init`).trigger("change");
				ct_update_popout();
			});
		}
		
		if($(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]").length>0){
			$(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });
		}
		
	}
}

function ct_load(data=null){
	// any time the combat tracker changes, we need to make sure we adjust our cursor streaming for anyone that only wants streaming during "combatTurn"
	// make sure we do this before the `data` object gets changed below
	$("#combat_area").empty();
	update_peer_communication_with_combat_tracker_data(data);

	if(!data.loading){	
		$("#combat_area tr[data-current]").removeAttr("data-current");
		for(let i=0;i<data.length;i++){
			if (data[i]['data-target'] === 'round'){
				if(window.ROUND_NUMBER != data[i]['round_number']){
					window.ROUND_NUMBER = data[i]['round_number'];
					document.getElementById('round_number').value = window.ROUND_NUMBER;
					const autoInit = getCombatTrackersettings().auto_init;
					const tokenInCombat = $(`#combat_area tr[data-target='${window.pcs.find(d => d.sheet.includes(window.PLAYER_SHEET)).sheet}']`).length > 0;
					if(autoInit == '1' && !window.DM && tokenInCombat == true){
						$('.roll-init-button').click();
					}
				}
			} 
			else if(data[i]['data-target'] !== undefined){
				if (window.all_token_objects[data[i]['data-target']] == undefined) {
					window.all_token_objects[data[i]['data-target']] = new Token(data[i]['options']);
					window.all_token_objects[data[i]['data-target']].sync = mydebounce(function(e) {				
						window.MB.sendMessage('custom/myVTT/token', this.options);
					}, 300);
				}
				window.all_token_objects[data[i]['data-target']].options = data[i]['options'];
				if(window.all_token_objects[data[i]['data-target']].options.ct_show == true || (window.DM && window.all_token_objects[data[i]['data-target']].options.ct_show !== undefined))
				{

					ct_add_token(window.all_token_objects[data[i]['data-target']],false,true);
					if([data[i]['data-target']] in window.TOKEN_OBJECTS){
						window.TOKEN_OBJECTS[data[i]['data-target']].hp = window.all_token_objects[data[i]['data-target']].baseHp;
						window.TOKEN_OBJECTS[data[i]['data-target']].maxHp = window.all_token_objects[data[i]['data-target']].maxHp;
						window.TOKEN_OBJECTS[data[i]['data-target']].tempHp = window.all_token_objects[data[i]['data-target']].tempHp;
					}
				}

				
				if(data[i]['current']){
					$("#combat_area tr[data-target='"+data[i]['data-target']+"']").attr("data-current","1");
					if(window.TOKEN_OBJECTS[data[i]['data-target']] != undefined){
						let combatSettingData = getCombatTrackersettings();
						let group = false;
						if(window.TOKEN_OBJECTS[data[i]['data-target']].options.combatGroupToken){
							group = Object.values(window.TOKEN_OBJECTS).find(d=> d.options.combatGroup == window.TOKEN_OBJECTS[data[i]['data-target']].options.combatGroup && !d.options.combatGroupToken);
						}
						if(combatSettingData['scroll_to_next'] == '1'){
							if(group){
								window.TOKEN_OBJECTS[group.options.id].highlight();
							}
							else{
								window.TOKEN_OBJECTS[data[i]['data-target']].highlight();
							}				
						}	
						if(combatSettingData['select_next'] == '1'){
							if(group){
								$(`#tokens .token[data-id='${group.options.id}']`).click();
							}
							else{
								$(`#tokens .token[data-id='${data[i]['data-target']}']`).click();
							}	
						}
					}
					if(window.all_token_objects[data[i]['data-target']].isCurrentPlayer() || window.all_token_objects[data[i]['data-target']].options.player_owned){
						$("#endplayerturn").toggleClass('enabled', true);
						$("#endplayerturn").prop('disabled', false);
					}
					else{
						$("#endplayerturn").toggleClass('enabled', false);
						$("#endplayerturn").prop('disabled', true);
					}
				}
			}
		}
		if(window.childWindows['Combat Tracker'] != undefined){
			if($(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]").length>0){
				$(window.childWindows['Combat Tracker'].document).find("tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });
			}
		}
		if($("#site tr[data-current=1]").length>0)
			$("#site tr[data-current=1]")[0].scrollIntoView({ behavior: 'instant', block: 'center', start: 'inline' });	
	}
	else{
		for(let tokenID in window.all_token_objects){
			if( window.all_token_objects[tokenID].options.ct_show == true || (window.DM && window.all_token_objects[tokenID].options.ct_show !== undefined)) 
			{		
				ct_add_token(window.all_token_objects[tokenID],false,true);
			}		
		}
		if(data.current){
			for (tokenID in window.TOKEN_OBJECTS){
				if(window.TOKEN_OBJECTS[tokenID].options.current != undefined && tokenID != data.current){
					delete window.TOKEN_OBJECTS[tokenID].options.current;
					window.TOKEN_OBJECTS[tokenID].update_and_sync();
				}
			}
			$("#combat_area tr[data-target='"+data.current+"']").attr("data-current","1");
			if(window.TOKEN_OBJECTS[data.current] != undefined){
				window.TOKEN_OBJECTS[data.current].options.current = true;
				window.TOKEN_OBJECTS[data.current].update_and_sync();
			}
			if(window.all_token_objects[data.current] != undefined){
				if(window.all_token_objects[data.current].isCurrentPlayer() || window.all_token_objects[data.current].options.player_owned){
					$("#endplayerturn").toggleClass('enabled', true);
					$("#endplayerturn").prop('disabled', false);
				}
				else{
					$("#endplayerturn").toggleClass('enabled', false);
					$("#endplayerturn").prop('disabled', true);
				}
			}

		}
		else{
			for (tokenID in window.TOKEN_OBJECTS){
				if(window.TOKEN_OBJECTS[tokenID].options.current == true){
					$("#combat_area tr[data-target='"+tokenID+"']").attr("data-current","1");
					if(window.TOKEN_OBJECTS[tokenID].options.round > 1){
						window.ROUND_NUMBER = window.TOKEN_OBJECTS[tokenID].options.round;
						document.getElementById('round_number').value = window.ROUND_NUMBER;
					}
				}		
			}
		}
	}

//load in local data on first load after 0.80
	let itemkey="CombatTracker"+find_game_id();
	data=$.parseJSON(localStorage.getItem(itemkey));
	if(data !== undefined && data !== null){
		if(!(data[0]['already-loaded'])){
			for(let i in data){
				if (data[i]['data-target'] === 'round'){
					window.ROUND_NUMBER = data[i]['round_number'];
					document.getElementById('round_number').value = window.ROUND_NUMBER;
				}
			    if(window.TOKEN_OBJECTS[data[i]['data-target']] != undefined){
			        window.TOKEN_OBJECTS[data[i]['data-target']].options.init = data[i]['init']
			        window.TOKEN_OBJECTS[data[i]['data-target']].update_and_sync();
			        if(window.TOKEN_OBJECTS[data[i]['data-target']].ct_show == undefined){
			        	window.TOKEN_OBJECTS[data[i]['data-target']].ct_show = data[i]['data-ct-show'];
			        }
			        window.TOKEN_OBJECTS[data[i]['data-target']].ct_show = data[i]['data-ct-show'];   
			        $("#combat_area tr[data-target='"+data[i]['data-target']+"']").find(".init").val(data[i]['init']);
			   		}   
			}
			data.unshift({'already-loaded': true})
			localStorage.setItem(itemkey,JSON.stringify(data));
		}
	}

	

	debounceCombatReorder()


}



function ct_remove_token(token,persist=true) {

	let id = token.options.id;
	if ($("#combat_area tr[data-target='" + id + "']").length > 0) {
		if ($("#combat_area tr[data-target='" + id + "']").attr('data-current') == "1") {
			$("#combat_next_button").click();
		}
		$("#combat_area tr[data-target='" + id + "']").remove(); // delete token from the combat tracker if it's there
	}
	ct_update_popout()
	if (persist) {
		debounceCombatPersist();
	}
}
