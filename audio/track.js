import { Library } from './library.js'

/**
 * A track is a representation of an audio file on the internet
 */
class Track {
    /**
     * The name of the track
     * @type {string}
     */
    name;

    /**
     * The source url of the track
     * @type {string}
     */
    src;

    /**
     * A list of tags about the track
     * @type {Array.<string>}
     */
    tags = [];

    /**
     * @param {string} name
     * @param {string} src
     */
    constructor(name, src) {
        this.name = name;
        this.src = src;
    }

    /**
     * @param {*} obj
     * @returns {Track}
     */
    static assign(obj) {
        return Object.assign(new Track(), obj);
    }
}

/**
 * The track library singleton
 * @extends {Library<Track>}
 */
class TrackLibrary extends Library {
    constructor() {
        super(new Track());
         if (localStorage.getItem("Soundpads") != null) { // import old sound pad tracks. I'm not deleting this local storage in case we make folders/playlists and can use the data there.
            window.SOUNDPADS = $.parseJSON(localStorage.getItem("Soundpads"));
            const newTracks = [];
            const updateTracks = new Map();

            for(let pad in  window.SOUNDPADS){
                for(let folder in window.SOUNDPADS[pad]){
                    for(let i in window.SOUNDPADS[pad][folder]){
                        let t = window.SOUNDPADS[pad][folder][i];
                        const track = new Track(t.name, t.src);
                        const existingTrack = this.find(track.name, track.src);
                        if ( typeof existingTrack === 'undefined' ) {
                            newTracks.push(track);
                        } else {
                            updateTracks.set(existingTrack[0], track);
                        }
                    }
                }
            }
            console.log('Importing new tracks')
            console.table(newTracks)
            this.create(...newTracks);

            console.log('Importing exiting tracks')
            console.table(Object.fromEntries(updateTracks))
            this.batchUpdate(updateTracks);
        }
    }

    /**
     *
     * @param {string} name
     * @param {string} src
     * @returns {[string, Track]}
     */
    find(name, src) {
        return [...this.map()].find(([_, track]) => track.name === name || track.src === src);
    }
    deleteTrack(id){
        this.delete(id);
    }
    addTrack(name, src){
        const track = new Track(name, src);  
        this.create(track);
    }
    /**
     * Import a csv of tracks into the track library
     * @param {string} csv
     */
    importCSV(csv) {
        const importList = $.csv.toObjects(csv);
        const newTracks = [];
        const updateTacks = new Map();

        importList.forEach(t => {
            const track = new Track(t.name, t.src);
            track.tags = t.tags.split("|");
            const existingTrack = this.find(track.name, track.src);
            if ( typeof existingTrack === 'undefined' ) {
                newTracks.push(track);
            } else {
                updateTacks.set(existingTrack[0], track);
            }
        });

        console.log('Importing new tracks')
        console.table(newTracks)
        this.create(...newTracks);

        console.log('Importing exiting tracks')
        console.table(Object.fromEntries(updateTacks))
        this.batchUpdate(updateTacks);
    }
}

const trackLibrary = new TrackLibrary();


export { Track, trackLibrary };
