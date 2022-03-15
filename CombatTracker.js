
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
	
	ct_area=$("<table id='combat_area'/>");
	const ct_list_wrapper = $(`<div class="tracker-list"></div>`);
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
		}
		ct_persist();
		//var target=$("#combat_area tr[data-current=1]").attr('data-target');
	});
	
	roll=$("<button>ROLLINIT</button>");
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
	
	
	find=$("<button style='font-size:10px;'>FIND</button>");
	find.click(function(){
		var target=$(this).parent().parent().attr('data-target');
		if(target in window.TOKEN_OBJECTS){
			window.TOKEN_OBJECTS[target].highlight();
		}
	});
	
	
	buttons.append(find);
	
	del=$("<button style='font-size:10px;'>DEL</button>");
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
		stat=$("<button style='font-size:10px;'>STAT</button>");
		
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
		stat=$("<button style='font-size:10px;'>STAT</button>");
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
