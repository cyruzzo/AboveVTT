import Library from './library.js'

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
}

const library = new TrackLibrary();

export default {
    library
}
