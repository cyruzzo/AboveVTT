/**
 * 
 */

var soundpad = {
	'music': [
		{
			name: 'Heroic Demise',
			src: 'https://opengameart.org/sites/default/files/Heroic%20Demise%20%28New%29_0.mp3',
			loop: true,
		}],
	'backgrounds': [
		{
			name: 'Rain',
			src: 'https://opengameart.org/sites/default/files/audio_preview/1_7.mp3.ogg',
			loop: true,
		}
	],
	'fx': [
		{
			name: 'Knife Slice',
			src: 'https://opengameart.org/sites/default/files/knifesharpener1.flac',
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

function create_soundpad(target,soundpad) {
	target.empty();
	id_count = 0;
	$("#soundpad").remove();
	for (section in soundpad) {
		s=$("<div class='soundpad-section'/>");
		s.append("<div class='soundpad-section-title'>"+section+"</div>");
		for (var i = 0; i < soundpad[section].length; i++) {
			line=$("<div/>")
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
	
	sounds_panel = $("<div id='sounds-panel' class='sidepanel-content'/>");
	$(".sidebar__pane-content").append(sounds_panel);
	
	sounds_panel.append("<div class='panel-warning'>THIS IS AN EXPERIMENTAL FEATURE</div>");
	/*soundpad_element=$("<div id=soundpad'>");
	$("#spells-panel").append(soundpad_element);
	
	create_soundpad($("#spells-panel"),soundpad);*/
	
}

