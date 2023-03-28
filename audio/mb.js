import { log } from "./helpers.js";

/**
 * Registers an on change mixer event handler that sends mixer state over the message broker
 */
function init() {
    if (window.DM) {
        log('binding mixer to message bus');
        window.MIXER.onChange((e) => {
            const state = e.target.remoteState();
            log('pushing mixer state to players', state);
            window.MB.sendMessage('custom/myVTT/mixer', state);
        });
    }
}

/**
 * What the message broker calls when it receives a new mixer event
 * @param {any} data
 */
function handle_mixer_event(data) {
    if (!window.DM) {
        log("remote mixer update received", data);
        window.MIXER.remoteUpdate(data);
    }
}

export { handle_mixer_event, init };
