
import { trackLibrary } from './track.js'
import { mixer } from './mixer.js'
import { handle_mixer_event } from './mb.js';
import init from './init.js';


function init_audio_mixer(){
	window.TRACK_LIBRARY = trackLibrary;
	window.MIXER = mixer();
	window.handle_mixer_event = handle_mixer_event;
	window.draw_audio_sidepanel = init;

}

export { init_audio_mixer }

