import { trackLibrary } from './track.js';

const trackList = document.createElement("ul");
trackLibrary.onchange((e) => {
    trackList.innerHTML = "";
    trackList.id = 'track-list';
    e.target.map().forEach((track, id) => {
        const item = document.createElement("li");
        item.textContent = track.name;
        item.setAttribute("data-id", id);
        const play = document.createElement('button');
        play.textContent = 'Play';
        play.onclick = () => {
            console.log('play track')
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
    volumeSlider.classList.add('volume-control')

    return volumeSlider
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
}

export { init };
