/**
 * 
 */


var demo_soundpad = {
	'Music': [
		{
			name: 'Heroic Demise',
			src: 'https://opengameart.org/sites/default/files/Heroic%20Demise%20%28New%29_0.mp3',
			loop: true,
		}],
	'Backgrounds': [
		{
			name: 'Rain',
			src: 'https://opengameart.org/sites/default/files/audio_preview/1_7.mp3.ogg',
			loop: true,
		}
	],
	'Fx': [
		{
			name: 'Knife Slice',
			src: 'https://opengameart.org/sites/default/files/knifesharpener1.flac',
			pulse: true,
		},
		{
			name: 'Projectile',
			src: 'https://opengameart.org/sites/default/files/audio_preview/la.mp3.ogg',
			pulse: true,
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
	var channel=($(e.target).attr('data-channel'));
	var data={
		channel: channel,
		volume: e.target.volume,
	}
	window.MB.sendMessage("custom/myVTT/changechannel",data);
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

function audio_changevolume(channel,volume){
	element=$("audio[data-channel="+channel+"]").get(0);
	element.volume=volume;
}



function build_soundpad(soundpad) {
	target=$("#soundpad");
	console.log("loading soundpad");
	target.empty();
	id_count = 0;
	btn_addsection=$("<button class='soundpad_addsection'>Add Section</button>");
	
	target.append(btn_addsection);
	
	for (section in soundpad) {
		s=$("<div class='soundpad-section'/>");
		s.append("<div class='soundpad-section-title'>"+section+"</div>");
		btn_addsound=$("<button class='soundpad_addsound'>Add Sound</button>");
		s.append(btn_addsound);
		
		for (var i = 0; i < soundpad[section].length; i++) {
			line=$("<div class='soundpad-line'/>")
			line.append("<div class='soundpad-line-title'>"+soundpad[section][i].name+"</div>");
			audio = $("<audio/>");
			audio.attr('data-channel',id_count);
			audio.attr("controls","");
			audio.attr("controlsList","nodownload");
			audio.attr("preload","true");
			source = $("<source/>");
			source.attr("src", soundpad[section][i].src);
			audio.append(source);
			line.append(audio);
			
			btn_edit=$("<button class='soundpad_editsound'>E</button>");
			line.append(btn_edit);
			btn_del=$("<button class='soundpad_editsound'>X</button>");
			line.append(btn_del);
			s.append(line);
			id_count++;
		}
		target.append(s);
	}
	if(window.DM){
		$("audio").on('play',audio_onplay);
		$("audio").on('seeked',audio_onplay);
		$("audio").on('pause',audio_onpause);
		$("audio").on('volumechange',audio_onvolumechange);
	 }
}


function init_audio(){	
	window.SOUNDPADS={DEMO:demo_soundpad};
	
	sounds_panel = $("<div id='sounds-panel' class='sidepanel-content'/>");
	$(".sidebar__pane-content").append(sounds_panel);
	sounds_panel.append("<div class='panel-warning'>THIS IS AN EXPERIMENTAL FEATURE</div>");
	
	
	youtube_section=$("<div class='youtube_section'/>");;
	
	youtube_section.append("Youtube: ");
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
		//soundpad_selector.append("<option value='DEMO'>DEMO</option>");
		for(k in window.SOUNDPADS){
			soundpad_selector.append($("<option/>").attr('value',k).html(k));
		}
		selector_section.append("Load Soundpad:");
		selector_section.append(soundpad_selector);
		sounds_panel.append(selector_section);
		
		selector_section.on("change",function(){
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
}

