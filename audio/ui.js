import { mixer } from './mixer.js';
import { trackLibrary } from './library.js';
import { Track } from './track.js';

const trackList = document.createElement("ul");
trackLibrary.onchange((e) => {
    trackList.innerHTML = "";
    e.target.map().forEach((track, id) => {
        const item = document.createElement("li");
        item.textContent = track.name;
        item.setAttribute("data-id", id);
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
    volumeSlider.classList.add('volume-control')

    return volumeSlider
}

function init_trackLibrary() {
    const header = document.createElement("h3");
    header.textContent = "Track Library";

    const importCSV = document.createElement("input");
    importCSV.type = "file";
    importCSV.accept = ".csv";
    importCSV.onchange = (e) => {
        const reader = new FileReader();
        reader.readAsText(e.target.files[0]);
        reader.onload = () => {
            const importList = $.csv.toObjects(reader.result);
            console.table(importList);
            importList.forEach(t => {
                const track = new Track();
                track.name = t.name;
                track.src = t.src;
                track.tags = t.tags.split("|");
                trackLibrary.create(track);
            });
        };

        reader.onerror = () => {
            console.log(reader.error)
        };

        e.target.value = '';
    };

    trackLibrary.dispatchEvent(new Event('onchange'));
    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
}


export function init_audio_ui() {
    init_trackLibrary();
}