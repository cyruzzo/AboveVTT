
function init_combat_tracker(){
	window.ROUND_NUMBER =1;
	
	ct=$("<div id='combat_tracker'/>");
	ct.css("height","20px"); // IMPORTANT
	
	toggle=$("<div id='combat_button' class='hideable ddbc-tab-options__header-heading' style='display:inline-block'><u>C</u>OMBAT</div>");
	toggle.click(function(){
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
		reposition_enounter_combat_tracker_iframe();
		reposition_player_sheet(); // not sure if this needs to be here, but maybe for smaller screens?
	});
	let pill = $(`<div class="ddbc-tab-options--layout-pill" />`);
	pill.append(toggle);
	ct.append(pill);
	ct_inside=$("<div id='combat_tracker_inside'/>");
	ct_inside.hide();
	ct.append(ct_inside);
	const ct_title_bar=$("<div id='combat_tracker_title_bar'>Combat Tracker</div>")
	const ct_title_bar_exit=$('<div id="combat_tracker_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
	ct_area=$("<table id='combat_area'/>");
	const ct_list_wrapper = $(`<div class="tracker-list"></div>`);
	ct_title_bar_exit.click(function(){toggle.click();});
	ct_title_bar.append(ct_title_bar_exit);
	ct_inside.append(ct_title_bar);
	ct_list_wrapper.append(ct_area);
	ct_inside.append(ct_list_wrapper);
	
	rn = $(`<div id='round_number_label'><strong>ROUND:</strong><input class="roundNum" style="font-size: 11px; width: 42px; appearance: none;" type='number' id='round_number' value=${window.ROUND_NUMBER}></div>`)
	reset_rounds=$("<button style='font-size: 10px;'>RESET</button>");
	
	reset_rounds.click(function (){
		window.ROUND_NUMBER = 1;
		document.getElementById('round_number').value = window.ROUND_NUMBER;
		$("#combat_area tr").first().attr('data-current','1');
		next.removeAttr('data-current');
		next.css('background','');
		ct_persist();
	});

	rn.find("#round_number").change(function (data) {
		if( !isNaN(data.currentTarget.value)){
			window.ROUND_NUMBER = Math.round(data.currentTarget.value);
			ct_persist();
		}
		document.getElementById('round_number').value = window.ROUND_NUMBER;
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
	
	reroll=$("<button>REROLL</button>");
	reroll.click(function(){
		$("#combat_area tr[data-target]").each(function(){
			$(this).removeAttr('data-current');
		});

		$("#combat_area tr[data-monster]").each(function(idx){
			let element=$(this);

			window.StatHandler.rollInit($(this).attr('data-monster'),function(value){
				element.find(".init").val(value);
				ct_reorder(false);
			});
			setTimeout(ct_persist,5000); // quick hack to save and resync only one time
		});

		$("#combat_area tr").first().attr('data-current','1');
	});
	
	clear=$("<button>CLEAR</button>");
	clear.click(function(){
		$("#combat_area").empty();
		window.ROUND_NUMBER = 1;
		document.getElementById('round_number').value = window.ROUND_NUMBER;
		ct_persist();
	});
	
	next=$("<button id='combat_next_button'><u>N</u>EXT</button>");
	next.click(function(){
		if($("#combat_area tr").length==0)
			return;

		current=$("#combat_area tr[data-current=1]");
		if(current.length==0){
			console.log('nessuno selezionato');
			$("#combat_area tr").first().attr('data-current','1');
		}
		else{
			current.removeAttr('data-current');
			current.css('background','');
			next=current.next();
			if(next.length==0){
				window.ROUND_NUMBER++;
				document.getElementById('round_number').value = window.ROUND_NUMBER;
				next=$("#combat_area tr").first()
			}
			next.attr('data-current','1');
			if($(".iframe-encounter-combat-tracker").css("z-index")>9999) {
				$("[data-current][data-monster] button.openSheetCombatButton").click();
			}
		}
		ct_persist();
		//var target=$("#combat_area tr[data-current=1]").attr('data-target');
	});
	
	roll=$('<button class="rollInitiativeCombatButton"><svg class="rollSVG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 339.09 383.21"><path d="M192.91,3q79.74,45.59,159.52,91.1c4.9,2.79,7.05,6,7,11.86q-.29,87.76,0,175.52c0,5.14-1.79,8.28-6.19,10.85q-78.35,45.75-156.53,91.78c-4.75,2.8-8.81,2.8-13.57,0q-77.7-45.75-155.59-91.18c-5.17-3-7.2-6.52-7.18-12.56q.31-87.39,0-174.78c0-5.5,2.06-8.64,6.7-11.28q80-45.53,159.84-91.3ZM115.66,136h3.67c12.1,0,24.19-.05,36.29,0,5.24,0,8.38,3.15,8.34,8s-3.56,8-9.73,8c-11.85.08-23.69,0-35.54,0-4.14,0-4.21.16-2.11,3.8q35.54,61.53,71.09,123.06c.59,1,.82,2.7,2.32,2.62s1.66-1.7,2.25-2.74q35.47-61.35,70.9-122.74c2.3-4,2.31-4-2.5-4-11.72,0-23.45.06-35.17,0-6.18-.05-9.6-3.08-9.59-8.1,0-5.18,3.27-7.9,9.58-7.91,11.47,0,22.94,0,34.42,0,1.27,0,2.71.54,3.93-.63a11.49,11.49,0,0,0-.69-1.36q-35.49-53-71-106c-2.15-3.22-3.2-1.77-4.7.46q-35.06,52.36-70.19,104.71C116.82,133.87,116.44,134.63,115.66,136Zm89,153.29c1.51,0,2.25.06,3,0,12.51-1.17,25-2.39,37.53-3.54,14.75-1.35,29.5-2.61,44.25-4,15.11-1.39,30.22-2.89,45.34-4.25,4.39-.39,4.47-.32,2.46-4.21q-10.79-20.94-21.61-41.87-17.31-33.56-34.64-67.11c-.49-1-.69-2.45-1.9-2.57s-1.48,1.46-2.14,2.31a9.38,9.38,0,0,0-.56,1q-27.49,47.6-55,95.2C215.87,269.75,210.42,279.24,204.62,289.31Zm-29.49.12c-1-1.84-1.57-3.05-2.24-4.22Q154,252.49,135.13,219.79,119.05,191.94,103,164.1c-.53-.91-.8-2.38-2.13-2.32-1.1.05-1.29,1.39-1.73,2.24Q70.69,219,42.3,274c-1.35,2.6-.88,3.39,2.09,3.56,6.71.38,13.4,1.06,20.09,1.68q23,2.11,46.08,4.27c12.26,1.15,24.53,2.34,36.79,3.47C156.37,287.81,165.4,288.57,175.13,289.43ZM44.49,102.78c1.34.83,2.16,1.37,3,1.86C63,113.46,78.55,122.19,94,131.17c3.21,1.88,4.7,1.46,6.75-1.63Q131,83.87,161.64,38.39c.66-1,1.64-1.84,1.8-3.6Zm172.2-67.85-.38.49c.31.53.58,1.08.93,1.59q30.94,46.15,61.84,92.33c2.12,3.18,3.67,3.68,7,1.72,15.4-9,31-17.7,46.45-26.54.8-.45,1.95-.58,2.22-2.08ZM36,250l.72.09C37.84,248,39,246,40.05,243.86Q64.23,197,88.47,150.12c1.35-2.6.68-3.58-1.6-4.86C71.21,136.48,55.62,127.56,40,118.7c-4-2.25-4-2.22-4,2.29V250Zm307.45.82a12.72,12.72,0,0,0,.35-1.55q0-64.51.06-129c0-3.33-1.17-3.17-3.5-1.85Q316.51,132,292.56,145.51c-2.11,1.18-2.42,2.21-1.29,4.38q18.11,34.83,36,69.76C332.56,229.83,337.84,240,343.46,250.84ZM64.23,295.22l-.14.56,47.09,27.59q33.88,19.86,67.78,39.7c1.11.64,3.21,3.18,3.21-.87,0-17.71,0-35.42,0-53.13,0-2.21-1-3.17-3.09-3.36q-17.29-1.51-34.59-3.07-18.22-1.63-36.45-3.29Q86.15,297.33,64.23,295.22Zm252.49,0c-11.13,1-21.24,2-31.37,2.92-12.15,1.1-24.31,2.1-36.46,3.21-15.62,1.41-31.23,3-46.86,4.26-3.38.27-4.46,1.44-4.43,4.8.14,16.84.06,33.68.07,50.52,0,4.1,0,4.1,3.73,1.93L286,313.28C296,307.43,305.91,301.56,316.72,295.2Z" transform="translate(-20.37 -3.01)"/><path d="M197.64,143.89a7.9,7.9,0,0,1-7.72,8,7.81,7.81,0,0,1-7.73-7.93,7.73,7.73,0,1,1,15.45,0Z" transform="translate(-20.37 -3.01)"/></svg></button>');
	roll.click(function(){
		$("#combat_area tr[data-monster]").each(function(idx){
			let element=$(this);
			if(element.find(".init").val()!=0) // DON'T ROLL AGAIN'
				return;
					
			window.StatHandler.rollInit($(this).attr('data-monster'),function(value){
				element.find(".init").val(value);
				ct_reorder(false);
			});
			setTimeout(ct_persist,5000); // quick hack to save and resync only one time
		});
		
	});
	
	
	if(window.DM){
		buttons.append(roll);
		buttons.append(clear);
		buttons.append(reroll);
		buttons.append(next);
		buttons.css('font-size','10px');
		
		ct_inside.append(buttons);
	}
	
	if(window.DM) {
		ct.addClass('tracker-dm');
	} else {
		ct.addClass('tracker-player');
	}

	$("#site").append(ct);
	/*draggable and resizeable combat tracker - set which frame should be on top and remove others. Cover iframes to prevent mouse interference*/
	$("#combat_tracker").addClass("moveableWindow");
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
	
	$("#combat_tracker").mousedown(function() {
		frame_z_index_when_click($(this));
	});
}

function frame_z_index_when_click(moveableFrame){
	//move frames behind each other in the order they were clicked
	if(moveableFrame.css('z-index') != 50000) {
		moveableFrame.css('z-index', 50000);
		$(".moveableWindow, [role='dialog']").not(moveableFrame).each(function() {
			$(this).css('z-index',($(this).css('z-index')-1));
		});
	}
}

function ct_reorder(persist=true) {
	var items = $("#combat_area").children().sort(
		function(a, b) {
			var vA = parseInt($(".init", a).val());
			var vB = parseInt($(".init", b).val());
			return (vA > vB) ? -1 : (vA < vB) ? 1 : 0;
		});

	$("#combat_area").append(items);
	if(persist)
		ct_persist();
}


function ct_add_token(token,persist=true,disablerolling=false){
	// TODO: check if the token is already in the tracker..
	
	
	token.options.combat = true;
	//token.sync();
	if (token.persist != null) token.persist();
	
	selector="#combat_area tr[data-target='"+token.options.id+"']";
	if($(selector).length>0)
		return;


	entry=$("<tr/>");
	entry.css("height","30px");
	entry.attr("data-target",token.options.id);	
	entry.addClass("CTToken");
	
	if ((token.options.name) && (window.DM || !token.options.monster || token.options.revealname)) {
		entry.attr("data-name", token.options.name);
		entry.addClass("hasTooltip");
	}

	if(token.options.monster > 0)
		entry.attr('data-monster',token.options.monster);
	
	img=$("<img width=35 height=35 class='Avatar_AvatarPortrait__2dP8u'>");
	img.attr('src',token.options.imgsrc);
	img.css('border','3px solid '+token.options.color);
	
	entry.append($("<td/>").append(img));
	let init=$("<input class='init' maxlength=2 style='font-size:12px;'>");
	init.css('width','20px');
	init.css('-webkit-appearance','none');
	if(window.DM){
		init.val(0);
		init.change(ct_reorder);
	}
	else{
		init.attr("disabled","disabled");
	}
	entry.append($("<td/>").append(init));
	
	// auto roll initiative for monsters
	
	if(window.DM && (token.options.monster > 0) && (!disablerolling)){
		window.StatHandler.rollInit(token.options.monster,function(value){
				init.val(value);
				setTimeout(ct_reorder,1000);
			});
	}
	
	
	
	hp=$("<div class='hp'/>");
	hp.text(token.options.hp);
	
	hp.css('font-size','11px');
	//hp.css('width','20px');
	if(window.DM || !(token.options.monster > 0) )
		entry.append($("<td/>").append(hp));
	else
		entry.append($("<td/>"))
	max_hp=$("<div/>");
	max_hp.text("/"+token.options.max_hp);
	max_hp.css('font-size','11px');
	//max_hp.css('width','20px');
	if(window.DM || !(token.options.monster > 0) )
		entry.append($("<td/>").append(max_hp));
	else
		entry.append($("<td/>"));
	
	
	var buttons=$("<td/>");
	
	
	find=$('<button class="findTokenCombatButton" style="font-size:10px;"><svg class="findSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg></button>');
	find.click(function(){
		var target=$(this).parent().parent().attr('data-target');
		if(target in window.TOKEN_OBJECTS){
			window.TOKEN_OBJECTS[target].highlight();
		}
	});
	
	
	buttons.append(find);
	
	del=$('<button class="removeTokenCombatButton" style="font-size:10px;"><svg class="delSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg></button>');
	del.click(
		function(){
			if($(this).parent().parent().attr("data-current")=="1"){
				$("#combat_next_button").click();
			}
			$(this).parent().parent().remove();
			ct_persist();
		}
	);
	if(window.DM)
		buttons.append(del);
	
	if(token.isMonster()){
		stat=$('<button class="openSheetCombatButton" style="font-size:10px;"><svg class="statSVG" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g></svg></button>');
		
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
			buttons.append(stat);
		
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
	$("#combat_area td").css("vertical-align","middle");
	
	if(persist){
		ct_persist();
	}
}

function ct_persist(){
	var data= [];
	$('#combat_area tr').each( function () {
	  data.push( {
		'data-target': $(this).attr("data-target"),
		'init': $(this).find(".init").val(),
		'current': ($(this).attr("data-current")=="1")
	   });
	});
	data.push({'data-target': 'round',
				'round_number':window.ROUND_NUMBER});
	
	var itemkey="CombatTracker"+find_game_id();
	
	localStorage.setItem(itemkey,JSON.stringify(data));
	window.MB.sendMessage("custom/myVTT/CT",data);
}

function ct_load(data=null){
	
	if(data==null){
		var itemkey="CombatTracker"+find_game_id();
		data=$.parseJSON(localStorage.getItem(itemkey));
	}
	
	if(data){	
		for(i=0;i<data.length;i++){
			if (data[i]['data-target'] === 'round'){
				window.ROUND_NUMBER = data[i]['round_number'];
				document.getElementById('round_number').value = window.ROUND_NUMBER;
			}
			else{
				let token;
				if(data[i]['data-target'] in window.TOKEN_OBJECTS){
					token=window.TOKEN_OBJECTS[data[i]['data-target']];
				}
				else{
					token={
						options:{
							name: 'Not in the current map',
							id: data[i]['data-target'],
							imgsrc: 'https://media-waterdeep.cursecdn.com/attachments/thumbnails/0/14/240/160/avatar_2.png',
							hp:"0",
							max_hp:"0",
						}
					}
				}

				ct_add_token(token,false,true);
				$("#combat_area tr[data-target='"+data[i]['data-target']+"']").find(".init").val(data[i]['init']);
				if(data[i]['current']){
					$("#combat_area tr[data-target='"+data[i]['data-target']+"']").attr("data-current","1");
				}
			}
		}
	}
	if(window.DM)
		ct_persist();
}

function ct_remove_token(token,persist=true) {

	if (persist == true) {
		token.options.combat = false;
		token.sync();
		if (token.persist != null) token.persist();
	}

	let id = token.options.id;
	if ($("#combat_area tr[data-target='" + id + "']").length > 0) {
		if ($("#combat_area tr[data-target='" + id + "']").attr('data-current') == "1") {
			$("#combat_next_button").click();
		}
		$("#combat_area tr[data-target='" + id + "']").remove(); // delete token from the combat tracker if it's there
	}
	if (persist) {
		ct_persist();
	}
}
