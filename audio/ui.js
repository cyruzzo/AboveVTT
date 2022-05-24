import { trackLibrary } from './track.js';
import { mixer, mixerEvents, Channel } from './mixer.js';
import { StagedTrack } from './stage.js';

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
    mixer.onChannelListChange((e) => {
        mixerChannels.innerHTML = "";
        /** @type {Object.<string, Channel>} */
        const mcs = e.target.channels();
        Object.entries(mcs).forEach(([id, channel]) => {
            const item = document.createElement("li");
            item.className = "audio-row";
            item.textContent = channel.name;
            item.setAttribute("data-id", id);

            item.appendChild(mixer.channelVolumeSlider(id));

            mixerChannels.append(item);
        });
    });
    mixer.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));

    // clear button
    const clear = document.createElement("button");
    clear.textContent = 'Clear';
    clear.onclick = () => mixer.clear();

    // play/pause button
    const playPause = document.createElement("button");
    playPause.onclick = () => mixer.togglePaused();
    mixer.onPlayPause((e) => playPause.textContent = e.target.paused ? "Play" : "Pause");
    mixer.dispatchEvent(new Event(mixerEvents.ON_PLAY_PAUSE));
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
            reader.onerror = () => {throw reader.error};
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
                const adhocStagedTrack = new StagedTrack(id);
                adhocStagedTrack.autoplay = true;
                adhocStagedTrack.loop = true;
                mixer.addChannel(adhocStagedTrack.toChannel());
            };
            item.appendChild(play);
            trackList.append(item);
        });
    });
    trackLibrary.dispatchEvent(new Event('onchange'));

    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
}

function init() {
    if(window.DM){
        init_trackLibrary();
        init_mixer();
    } else {
        $("#sounds-panel .sidebar-panel-header").append(masterVolumeSlider());
    }
}

export { init };
