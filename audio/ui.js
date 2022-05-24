import { trackLibrary } from './track.js';
import { mixer, mixerEvents, Channel } from './mixer.js';
import { StagedTrack } from './stage.js';

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

/**
 * Creates a generic volume slider element
 * @returns {HTMLInputElement}
 */
function volumeSlider() {
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = .01;
    volumeSlider.className = "volume-control";

    return volumeSlider
}

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

        const slider = volumeSlider();
        slider.value = channel.volume;

        item.appendChild(slider);
        mixerChannels.append(item);
    });
});


function init_mixer() {
    const header = document.createElement("h3");
    header.textContent = "Mixer";

    const masterVolumeDiv = document.createElement("div");
    masterVolumeDiv.textContent = "Master Volume";
    masterVolumeDiv.className = "audio-row";
    const masterVolumeSlider = volumeSlider();
    masterVolumeDiv.append(masterVolumeSlider);

    mixer.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));

    const playPause = document.createElement("button");
    playPause.onclick = () => mixer.togglePaused();
    mixer.onPlayPause((e) => {
       playPause.textContent = e.target.paused ? "Play" : "Pause";
    });
    mixer.dispatchEvent(new Event(mixerEvents.ON_PLAY_PAUSE));

    $("#sounds-panel .sidebar-panel-header").append(header, masterVolumeDiv, mixerChannels, playPause);
}

function init_trackLibrary() {
    const header = document.createElement("h3");
    header.textContent = "Track Library";

    const importCSV = document.createElement('button');
    importCSV.textContent = "Import CSV";
    importCSV.onclick = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".csv";
        fileInput.onchange = (e) => {
            const reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = () => {
                trackLibrary.importCSV(reader.result);
            };
            reader.onerror = () => {
                throw reader.error
            };
        };
        fileInput.click();
    };

    trackLibrary.dispatchEvent(new Event('onchange'));
    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
}

function init() {
    init_trackLibrary();
    init_mixer();
}

export { init };
