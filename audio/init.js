import init_ui from './ui.js';
import { init as init_mb } from './mb.js';
import { log } from './helpers.js';

/**
 * Syncs the mixer players on first mouse down event, you must wait for
 * the user to interact with the DOM before attempting to play audio
 */
function start_mixer() {
    const handler = () => {
        log("user interaction detected, starting mixer");
        window.MIXER.syncPlayers();
        window.removeEventListener('mousedown', handler);
    }
    log('registering mixer start handler');
    window.addEventListener('mousedown', handler);
}

/**
 * Initializes audio
 */
function init() {
    start_mixer();
    init_mb();
    init_ui();
}

export default init
