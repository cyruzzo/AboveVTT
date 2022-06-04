import { trackLibrary } from './track.js';
import { mixer, Channel } from './mixer.js';
import { log } from './helpers.js';

/**
 *
 * @returns {HTMLDivElement}
 */
function masterVolumeSlider() {
    const div = document.createElement("div");
    div.textContent = "Master Volume";
    div.className = "audio-row";
    div.append(mixer.masterVolumeSlider());

    return div;
}

function init_mixer() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Mixer";

    // mixer channels
    const mixerChannels = document.createElement("ul");
    mixerChannels.id = 'mixer-channels';

    /** @param {Object.<string, Channel>} */
    const drawChannelList = (channels) => {
        mixerChannels.innerHTML = "";
        /** @type {Object.<string, Channel>} */
        Object.entries(channels).forEach(([id, channel]) => {
            const item = document.createElement("li");
            item.className = "audio-row";
            item.textContent = channel.name;
            item.setAttribute("data-id", id);
            item.append(mixer.channelVolumeSlider(id), mixer.channelProgressBar(id));
            mixerChannels.append(item);
        });
    }
    drawChannelList(mixer.channels())
    mixer.onChannelListChange((e) => drawChannelList(e.target.channels()));

    // clear button
    const clear = document.createElement("button");
    clear.textContent = 'Clear';
    clear.onclick = () => mixer.clear();

    // play/pause button
    const playPause = document.createElement("button");
    playPause.onclick = () => mixer.togglePaused();

    /** @param {bool} */
    const drawPlayPause = (paused) => playPause.textContent = paused ? "Play" : "Pause";
    drawPlayPause(mixer.paused);
    mixer.onPlayPause((e) => drawPlayPause(e.target.paused));

    $("#sounds-panel .sidebar-panel-header").append(header, masterVolumeSlider(), mixerChannels, clear, playPause);
}

function init_trackLibrary() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Track Library";

    // import csv button
    const importCSV = document.createElement('button');
    importCSV.textContent = "Import CSV";
    importCSV.onclick = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".csv";
        fileInput.onchange = (e) => {
            const reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = () => trackLibrary.importCSV(reader.result);
            reader.onerror = () => { throw reader.error };
        };
        fileInput.click();
    };

    // track list
    const trackList = document.createElement("ul");
    trackList.id = 'track-list';
    trackLibrary.onchange((e) => {
        trackList.innerHTML = "";
        /** @type {typeof trackLibrary}  */
        const tl = e.target;
        tl.map().forEach((track, id) => {
            const item = document.createElement("li");
            item.textContent = track.name;
            item.className = "audio-row";
            item.setAttribute("data-id", id);
            const play = document.createElement('button');
            play.textContent = 'Play';
            play.onclick = () => {
                const channel = new Channel(track.name, track.src);
                channel.paused = false;
                channel.loop = true;
                mixer.addChannel(channel);
            };
            item.appendChild(play);
            trackList.append(item);
        });
    });
    trackLibrary.dispatchEvent(new Event('onchange'));

    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
}

function init() {
    log(`initializing audio ui for ${window.DM ? 'DM' : 'player'}`);
    if (window.DM) {
        init_trackLibrary();
        init_mixer();
    } else {
        $("#sounds-panel .sidebar-panel-header").append(masterVolumeSlider());
    }
}

export default init;
