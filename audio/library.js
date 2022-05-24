import { Track } from './track.js';
import { Stage } from './stage.js';

/**
 * Library creates a generic local storage backed library for arbitrary
 * objects. The object must have an assign function describes how deserialize
 * into it self.
 * @template T
 */
class Library extends EventTarget {
    /**
     * This holds on to the local storage key
     * @private
     * @type {string}
     */
    _localStorageKey;

    /**
    * And example of the object you want a library for
    * @private
    * @type {T}
    */
    _egObj;

    /**
     * @param {T} egObj - An example of the object you wish to have a library of
     */
    constructor(egObj) {
        super();
        this._localStorageKey = 'audio.library.' + egObj.constructor.name.toLowerCase();
        this._egObj = egObj;
    }

    /**
     * Writes the library to storage
     * @private
     * @param {Map<string, T>} library
     */
    _write(library) {
        localStorage.setItem(this._localStorageKey, JSON.stringify([...library]));
        this.dispatchEvent(new Event("onchange"));
    }

    /**
     * Returns the library state from local storage
     * @return {Map<string, T>}
     */
    map() {
        const r = new Map();
        new Map(JSON.parse(localStorage.getItem(this._localStorageKey,) ?? "[]")).forEach((t, id) =>
            r.set(id, this._egObj.constructor.assign(t))
        );
        return r;
    }

    // CRUD functions

    /**
     * Adds a items to the library
     * @param  {...T} objs
     */
    create(...objs) {
        const library = this.map();
        objs.forEach(o => {
            library.set(uuid(), o);
        });
        this._write(library);
    }

    /**
     * Read a single item from the library
     * @param {string} id
     * @returns {T}
     */
    read(id) {
        return this.map().get(id);
    }

    /**
     * Updates the current id with obj
     * @param {string} id
     * @param {T} obj
     */
    update(id, obj) {
        this.batchUpdate(new Map().set(id, obj))
    }

    /**
     * Delete a single item from the library
     * @param {string} id
     * @returns {bool} if it was deleted
     */
    delete(id) {
        const library = this.map();
        const r = library.delete(id);
        this._write(library);
        return r;
    }

    // extras

    /**
     * Updates many objects in the library
     * @param {Map<string, T>} objMap
     */
    batchUpdate(objMap) {
        const library = this.map();

        // confirm all objects are already in the library
        [...objMap.keys()].forEach(id => {
            if (!(library.has(id))) {
                throw `Id ${id} does not exist in library`
            }
        });

        // merge the maps together and write
        this._write(new Map([...library, ...objMap]));
    }

    // handlers

    /**
     * Register an onChange event
     * @param {EventListenerOrEventListenerObject} callback
     */
    onchange(callback) {
        this.addEventListener("onchange", callback);
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

/**
 * The stage library singleton
 * @extends {Library<Stage>}
 */
class StageLibrary extends Library {
    constructor() {
        super(new Stage);
    }
}

const track = new TrackLibrary();
const stage = new StageLibrary();

export default {
    track,
    stage
}
