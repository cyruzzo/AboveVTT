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

    /**
     * Adds a single item to the library
     * @param {T} obj
     * @returns {string} id
     */
    create(obj) {
        const id = uuid();
        this._write(this.map().set(id, obj));
        return id;
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
        const library = this.map();
        if (!(library.has(id))) {
            throw `Id ${id} does not exist in library`
        }
        this._write(library.map().set(id, obj));
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

    /**
     * Register an onChange event
     * @param {EventListenerOrEventListenerObject} callback
     */
    onchange(callback) {
        this.addEventListener("onchange", callback);
    }
}

import { Track } from './track.js';
export const trackLibrary = new Library(new Track());

import { Stage } from './stage.js';
export const stageLibrary = new Library(new Stage());