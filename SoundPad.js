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
	channel($(e.target).attr('data-channel'));
	
}


function create_soundpad(target,soundpad) {
	target.empty();
	id_count = 0;
	$("#soundpad").remove();
	for (section in soundpad) {
		s=$("<div class='soundpad-section'/>");
		s.append("<div ='soundpad-section-title'>"+section+"</div>");
		for (var i = 0; i < soundpad[section].length; i++) {
			id_count++;
			audio = $("<audio/>");
			audio.attr('data-channel',id_count);
			audio.attr("controls","");
			audio.attr("controlsList","nodownload");
			source = $("<source/>");
			source.attr("src", soundpad[section][i].src);
			audio.append(source);
			s.append(audio);
		}
		target.append(s);
	}
	if(window.DM)
		$("audio").on('play',audio_onplay);
}



function test_audio(){
	create_soundpad($("#spells-panel"),soundpad);
}

