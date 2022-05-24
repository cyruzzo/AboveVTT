import { init } from './ui.js';
import { stageLibrary } from './stage.js'
import { trackLibrary } from './track.js'
import { mixer } from './mixer.js'

window.init_audio_ui = init;
window.STAGE_LIBRARY = stageLibrary;
window.TRACK_LIBRARY = trackLibrary;
window.MIXER = mixer;

if (window.DM) {
    mixer.onChange((e) => {
        window.MB.sendMessage('custom/myVTT/mixer', e.target.remoteState());
    });
}
