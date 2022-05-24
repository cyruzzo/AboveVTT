import Library from "./library.js";

/**
 * A StagedTrack is a reference to a Track with playtime information such as
 * volume, repeat, autoplay
 */
class StagedTrack {
    /**
     * The uid of the track as it exists in the track library
     * @type {string}
     */
    trackID;

    /**
     * Track volume
     * @type {number}
     */
    volume = 1;

    /**
     * Repeat the track when it is complete
     * @type {boolean}
     */
    repeat = false;

    /**
     * Play the track as soon as the mixer loads it
     * @type {boolean}
     */
    autoplay = false;

    /**
     * A reference to the track in the track library is needed to stage a track
     * @param {string} trackID
     */
    constructor(trackID) {
        this.trackID = trackID;
    }

    /**
     * @param {*} obj
     * @returns {StagedTrack}
     */
    static assign(obj) {
        return Object.assign(new StagedTrack(), obj)
    }
}

/**
 * a Stage is a grouping of tracks that defines an audio scene. Here is where
 * you set the tracks, their volumes, loop control, and autoplay so that you
 * can save them and load them into a mixer.
 */
class Stage {
    /**
     * The name of the stage
     * @type {string}
     */
    name;

    /**
     * A dictionary of staged tracks
     * @type {Object.<string, StagedTrack>}
     */
    stagedTracks = {};

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * Add a StagedTrack to the Stage
     * @param {StagedTrack} stagedTrack
     */
    add(stagedTrack) {
        const id = uuid();
        this.stagedTracks[id] = stagedTrack;
    }

    /**
     * Remove a StagedTrack from the stage
     * @param {string} id
     */
    remove(id) {
        delete this.stagedTracks[id];
    }

    /**
     * @param {*} obj
     * @returns {Stage}
     */
    static assign(obj) {
        // rehydrate staged tracks
        const stagedTracks = {};
        Object.entries(obj.stagedTracks ?? {}).forEach(([k, v]) =>
            stagedTracks[k] = StagedTrack.assign(v)
        );
        delete obj.stagedTracks;

        // deserialize the rest of the stage
        const stage = new Stage();
        stage.stagedTracks = stagedTracks;
        return Object.assign(stage, obj);
    }
}

/**
 * The stage library singleton
 * @extends {Library<Stage>}
 */
class StageLibrary extends Library {
    constructor() {
        super(new Stage);
    }
}

const library = new StageLibrary();

export default {
    library
}
