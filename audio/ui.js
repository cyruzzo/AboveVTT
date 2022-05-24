import Track from './track.js';

const trackList = document.createElement("ul");
Track.library.onchange((e) => {
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
            Track.library.importCSV(reader.result);
        };

        reader.onerror = () => {
            console.log(reader.error)
        };

        e.target.value = '';
    };

    Track.library.dispatchEvent(new Event('onchange'));
    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
}


export default function init_ui() {
    init_trackLibrary();
}
