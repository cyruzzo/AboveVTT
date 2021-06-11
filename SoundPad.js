/**
 * 
 */


var demo_soundpad = {
	"Music": [
		{
			"name": "Heroic Demise",
			"src": "https://opengameart.org/sites/default/files/Heroic%20Demise%20%28New%29_0.mp3",
		},
		{
			"name": "Its our Battle",
			"url": "",
			"src": "https://opengameart.org/sites/default/files/It%27s%20our%20battle.ogg"
		},
		{
			"name": "Lost in the meadows",
			"url": "",
			"src": "https://opengameart.org/sites/default/files/lost%20in%20the%20meadows_0.flac"
		},
		{
			"name": "Mystical Town",
			"url": "",
			"src": "https://opengameart.org/sites/default/files/symphony%20-%20mystical%20town%2001_1.ogg"
		}
	],
	"Backgrounds": [
		{
			"name": "Rain",
			"src": "https://opengameart.org/sites/default/files/audio_preview/1_7.mp3.ogg",
			"loop": true
		}
	],
	"Fx": [
		{
			"name": "Knife Slice",
			"src": "https://opengameart.org/sites/default/files/knifesharpener1.flac",
		},
		{
			"name": "Projectile",
			"src": "https://opengameart.org/sites/default/files/audio_preview/la.mp3.ogg",
		},
		{
			"name": "Swing",
			"url": "",
			"src": "https://drive.google.com/uc?id=19wYW7PGs4B383D2E-zPmR2zoQYjC74LL"
		},
		{
			"name": "Sword",
			"url": "",
			"src": "https://drive.google.com/uc?id=175IZxBm2hsZMA9tobphEYO7Id2mLZzzl"
		},
		{
			"name": "Slime",
			"url": "",
			"src": "https://drive.google.com/uc?id=1opi5czN0Jh8NN2jZejygIx_dPdxBdFYa"
		},
		{
			"name": "Door",
			"url": "",
			"src": "https://drive.google.com/uc?id=1tbWhDFU-Nn0zdPkJZu66dCOF2u9I5PGU"
		},
		{
			"name": "Creak",
			"url": "",
			"src": "https://drive.google.com/uc?id=1htEzWVBlpinRvRvba7zMqpUdoLsJ2a3Y"
		}
	],
	"Monsters": [
		{
			"name": "Gutteral Beast",
			"url": "",
			"src": "https://drive.google.com/uc?id=1CLW4mr3REB6EV-RTy58_64i6Z43Sa8Ef"
		},
		{
			"name": "Ogre",
			"url": "",
			"src": "https://drive.google.com/uc?id=1VwbLG6IvilU6D4bPRdAnQZXfxWiWAq84"
		}
	]
};

function audio_onplay(e){
	var channel=($(e.target).attr('data-channel'));
	var audio_object=e.target;
	
	var data={
		channel: channel,
		time: e.target.currentTime,
		volume: e.target.volume,
	}
	window.MB.sendMessage("custom/myVTT/playchannel",data);
}

function audio_onpause(e){
	var channel=($(e.target).attr('data-channel'));
	var data={
		channel: channel,
	}
	window.MB.sendMessage("custom/myVTT/pausechannel",data);
}

function audio_onvolumechange(e){
	
}

function audio_playchannel(channel,time,volume){
	element=$("audio[data-channel="+channel+"]").get(0);
	element.currentTime=time;
	element.volume=volume;
	if(element){
		element.play();
	}
}

function audio_pausechannel(channel){
	element=$("audio[data-channel="+channel+"]").get(0);
	if(element){
		element.pause();
	}
}

function audio_changesettings(channel,volume,loop){
	element=$("audio[data-channel="+channel+"]").get(0);
	element.volume=volume;
	element.loop=loop;
}



function build_soundpad(soundpad) {
	window.CURRENT_SOUNDPAD=soundpad;
	target=$("#soundpad");
	console.log("loading soundpad");
	target.empty();
	var id_count = 0;
	btn_addsection=$("<button class='soundpad_addsection'>Add Section</button>");
	
	target.append(btn_addsection);
	
	btn_addsection.click(function(){
		newname=prompt("Add a name for the new Soundpad Section");
		if(newname){
			soundpad[newname]=[];
			build_soundpad(soundpad);
		}
	});
	
	for (let section in soundpad) {
		s=$("<div class='soundpad-section'/>");
		section_title=$("<div class='soundpad-section-title'>"+section+"</div>");
		s.append(section_title);
		btn_addsound=$("<button class='soundpad_addsound'>Add Sound</button>");
		
		btn_addsound.click(function(){
			soundpad[section].push({
				name:'new',
				url:'',
			});
			build_soundpad(soundpad);
		});
		
		section_title.append(btn_addsound);
		
		for (let i = 0; i < soundpad[section].length; i++) {
			line=$("<div class='soundpad-line'/>")
			line.attr("data-section",section);
			line.attr("data-position",i);
			
			
			let title=$("<div class='soundpad-line-title'/>");
			title.html(soundpad[section][i].name);
			
			line.append(title);
			let edit_title=$("<input>");
			edit_title.val(soundpad[section][i].name);
			edit_title.hide();		
			line.append(edit_title);
			//line.append("<input class='soundpad-line-title'>"++"</div>");
			
			let audio = $("<audio/>");
			audio.attr('data-channel',id_count);
			audio.attr("controls","");
			audio.attr("controlsList","nodownload");
			audio.attr("preload","true");
			source = $("<source/>");
			source.attr("src", soundpad[section][i].src);
			audio.append(source);
			line.append(audio);
			if(soundpad[section][i].volume){
				audio.get(0).volume=soundpad[section][i].volume;
			}
			else{
				audio.get(0).volume=0.5;
			}
			
			if (window.DM) {
				audio.on('play', audio_onplay);
				audio.on('seeked', audio_onplay);
				audio.on('pause', audio_onpause);
				audio.on('volumechange', function(e) {
					var channel = ($(e.target).attr('data-channel'));
					var data = {
						channel: channel,
						volume: e.target.volume,
						loop: e.target.loop,
					}
					window.MB.sendMessage("custom/myVTT/changechannel", data);
					// persist volume
					soundpad[section][i].volume=e.target.volume;
					persist_soundpad();
				});
			}
			
			
			let loop_btn=$("<button class='loop-button'/>");
			let loop_img=$("<img class='loop-img'>");
			loop_img.attr("src",window.EXTENSION_PATH+"assets/loop.png");
			loop_btn.append(loop_img);
			if(soundpad[section][i].loop){
				audio.get(0).loop=true;
				loop_btn.addClass('loop-pressed');				
			}
			
			loop_btn.click(function() {
				var looping = !soundpad[section][i].loop;
				audio.get(0).loop = looping;
				soundpad[section][i].loop = looping;
				if (looping)
					$(this).addClass('loop-pressed');
				else
					$(this).removeClass('loop-pressed');
				persist_soundpad();

				var data = {
					channel: audio.attr('data-channel'),
					volume: audio.get(0).volume,
					loop: audio.get(0).loop,
				}
				window.MB.sendMessage("custom/myVTT/changechannel", data);


			}
			);
			line.append(loop_btn);
			
			
			
			let url=$("<input type='text'>");
			url.val(soundpad[section][i].src);
			url.attr("placeholder","http://www.audio.com/mp3");
			url.hide();
			line.append(url);
			
			let btn_save=$("<button class='soundpad_save'>OK</button>");
			btn_save.hide();
			line.append(btn_save);
			
			let btn_cancel=$("<button class='soundpad_cancel'>CANCEL</button>");
			btn_cancel.hide();
			line.append(btn_cancel);
			
			let btn_edit=$("<button class='soundpad_editsound'>E</button>");
			
			
			line.append(btn_edit);
			let btn_del=$("<button class='soundpad_delsound'>X</button>");
			line.append(btn_del);
						
			btn_edit.click(function(){
				audio.hide();
				title.hide();
				edit_title.show();
				btn_edit.hide();
				btn_del.hide();
				btn_save.show();
				btn_cancel.show();
				url.show();
			});
			
			btn_cancel.click(function(){
				audio.show();
				title.show();
				edit_title.hide();
				btn_edit.show();
				btn_del.show();
				btn_save.hide();
				btn_cancel.hide();
				url.hide();
			});
			
			btn_save.click(function(){
				soundpad[section][i].name=edit_title.val();
				var newurl=url.val();
				if(newurl.startsWith("https://drive.google.com") && newurl.indexOf("uc?id=") < 0)
					newurl='https://drive.google.com/uc?id=' + newurl.split('/')[5];
				url.val(newurl);
				soundpad[section][i].src=newurl;
				build_soundpad(soundpad);
								
				data={
					soundpad: soundpad
				}
				window.MB.sendMessage("custom/myVTT/soundpad",data);
			});
			
			btn_del.click(function(){
				soundpad[section].splice(i,1);
				build_soundpad(soundpad);
				data={
					soundpad: soundpad
				}
				window.MB.sendMessage("custom/myVTT/soundpad",data);
			});
			
			
			s.append(line);
			id_count++;
		}
		target.append(s);
	}
	
	soundpad_check_editable(); // hide / show buttons
	if(window.DM)
		persist_soundpad();
}


function soundpad_check_editable(){
	if($("#soundpad_enable_edit").is(":checked")){
		$(".soundpad_editsound").show();
		$(".soundpad_delsound").show();
		$(".soundpad_addsound").show();
		$(".soundpad_addsection").show();
	}
	else{
		$(".soundpad_editsound").hide();
		$(".soundpad_delsound").hide();
		$(".soundpad_addsound").hide();
		$(".soundpad_addsection").hide();
	}
}


function persist_soundpad(){
	localStorage.setItem("Soundpads",JSON.stringify(window.SOUNDPADS));
}

function init_audio(){
	window.CURRENT_SOUNDPAD={};
	
	if (localStorage.getItem("Soundpads") != null) {
		window.SOUNDPADS = $.parseJSON(localStorage.getItem("Soundpads"));
	}
	else {
		window.SOUNDPADS = {};
	}
	
	if(!("DEMO" in window.SOUNDPADS)){
		 window.SOUNDPADS['DEMO']=demo_soundpad;
	}
	
	sounds_panel = $("<div id='sounds-panel' class='sidepanel-content'/>");
	sounds_panel.hide();
	$(".sidebar__pane-content").append(sounds_panel);
	sounds_panel.append("<div class='panel-warning'>EXPERIMENTAL FEATURE (still ugly but should work)</div>");
	
	
	youtube_section=$("<div class='youtube_section'/>");;
	
	youtube_section.append("Animated Map Volume): ");
	youtube_volume = $('<input type="range" min="0." max="100" value="50" step="1" class="slider" id="youtube_volume">');
	youtube_section.append(youtube_volume);
	
	
	sounds_panel.append(youtube_section);

	youtube_volume.on("change", function() {
		if (window.YTPLAYER) {
			window.YTPLAYER.setVolume($("#youtube_volume").val());
			data={
				volume: $("#youtube_volume").val()
			};
			window.MB.sendMessage("custom/myVTT/changeyoutube",data);
		}
	});
	
	if(!window.DM)
		youtube_section.hide();
	
	if(window.DM){
		selector_section=$("<div/>");
		soundpad_selector=$("<select id='soundpad_selector'/>");
		soundpad_selector.append("<option value=''>-</option>");
		for(k in window.SOUNDPADS){
			soundpad_selector.append($("<option/>").attr('value',k).html(k));
		}
		selector_section.append("Load Soundpad:");
		selector_section.append(soundpad_selector);
		selector_section.append("Enable Edit:");
		soundpad_enable_edit=$("<input type='checkbox' id='soundpad_enable_edit'>");
		
		soundpad_enable_edit.change(soundpad_check_editable);
		selector_section.append(soundpad_enable_edit);
		
		btn_addsoundpad=$("<button class='soundpad_add'>NEW</button>");
		selector_section.append(btn_addsoundpad);
		sounds_panel.append(selector_section);
		
		btn_addsoundpad.click(function(){
			var newname=prompt("New Soundpad Name");
			if(newname){
				window.SOUNDPADS[newname]={};
				soundpad_selector.append($("<option/>").attr('value',newname).html(newname));
				soundpad_selector.val(newname);
				$("#soundpad_enable_edit").prop('checked', true);
				build_soundpad(window.SOUNDPADS[newname]);
			}
		});
		
		
		btn_delsoundpad=$("<button class='soundpad_del'>DEL</button>");
		btn_delsoundpad.click(function(){
			c=confirm("Are you sure that you want to delete the current soundpad?");
			if(c){
				delete window.SOUNDPADS[soundpad_selector.val()];
				$("#soundpad").empty();
				soundpad_selector.empty();
				soundpad_selector.append("<option value=''>-</option>");
				for (k in window.SOUNDPADS) {
					soundpad_selector.append($("<option/>").attr('value', k).html(k));
				}
				persist_soundpad();
			}
		});
		selector_section.append(btn_delsoundpad);
		
		soundpad_selector.on("change",function(){
			$("#soundpad").empty();
			soundpad_id=$("#soundpad_selector").val();
			if(soundpad_id!=""){
				build_soundpad(window.SOUNDPADS[soundpad_id]);
				
				data={
					soundpad: window.SOUNDPADS[soundpad_id]
				}
				window.MB.sendMessage("custom/myVTT/soundpad",data);
			}
		});
	}
	
	soundpad_element=$("<div id='soundpad'>");
	sounds_panel.append(soundpad_element);
	if(!window.DM){
		soundpad_element.hide();
		sounds_panel.append("Music is entirely controlled by the DM. As a player you'll find a master volume control here... but sorry.. it's not ready :('");
		
	}
	
}

