import { Library } from "./library.js";
import { Track, trackLibrary } from "./track.js";
import { Channel } from "./mixer.js";

/**
 * A StagedTrack is a reference to a Track with playtime information such as
 * volume, loop, autoplay
 */
class StagedTrack {
    /**
     * The uid of the track as it exists in the track library
     * @private
     * @type {string}
     */
    _trackID;

    /**
     * Track volume
     * @type {number}
     */
    volume = 1;

    /**
     * Loop the track when it is complete
     * @type {boolean}
     */
    loop  = false;

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
        this._trackID = trackID;
    }
    /**
     * Return the associated track
     * @returns {Track}
     */
    getTrack() {
        return trackLibrary.read(this._trackID);
    }

    /**
     * Convert this into a channel
     * @returns {Channel}
     */
    toChannel() {
        const track = this.getTrack();
        const channel = new Channel(track.name, track.src);
        channel.loop = this.loop;
        channel.paused = !this.autoplay;
        channel.volume = this.volume;
        return channel;
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
     * @private
     * @type {Object.<string, StagedTrack>}
     */
    _stagedTracks = {};

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }

    // CRUD

    /**
     * Add a staged track to the Stage
     * @param {StagedTrack} stagedTrack
     */
    add(stagedTrack) {
        this._stagedTracks[uuid()] = stagedTrack;
    }

    /**
     * Return a specific staged track from the stage
     * @param {string} id
     * @returns {stagedTrack}
     */
    read(id) {
        return this._stagedTracks[id];
    }

    /**
     * Update an existing staged track in the stage
     * @param {string} id
     * @param {StagedTrack} stagedTrack
     */
    update(id, stagedTrack) {
        if (!(this._stagedTracks[id])) {
            throw `Id ${id} does not exist in stage`;
        }
        this._stagedTracks[id] = stagedTrack;
    }

    /**
     * Remove a staged track from the stage
     * @param {string} id
     */
    delete(id) {
        delete this.stagedTracks[id];
    }

    /**
     * Create a new stage from an object
     * @param {*} obj
     * @returns {Stage}
     */
    static assign(obj) {
        // rehydrate staged tracks
        const stagedTracks = {};
        Object.entries(obj._stagedTracks ?? {}).forEach(([k, v]) =>
            stagedTracks[k] = StagedTrack.assign(v)
        );
        delete obj.stagedTracks;

        // deserialize the rest of the stage
        const stage = new Stage();
        stage._stagedTracks = stagedTracks;
        return Object.assign(stage, obj);
    }
}

/**
 * The stage library singleton
 * @extends {Library<Stage>}
 */
class StageLibrary extends Library {
    constructor() {
        super(new Stage());
    }
}

const stageLibrary = new StageLibrary();

export { StagedTrack, stageLibrary };
