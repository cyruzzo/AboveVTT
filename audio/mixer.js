import { gameID, playerID } from "./helpers.js";

/**
 * An Channel is like a stateful StagedTrack. The key difference
 * between the two is the StagedTrack holds a reference to the track in the
 * track library so that when you change track information the StagedTracks
 * do not need to be updated. An Channel contains all the information
 * needed to play a channel. Making it the object we want to send over the wire.
 */
class Channel {
    /**
     * The track name
     * @type {string}
     */
    name;

    /**
     * The track source
     * @type {string}
     */
    src;

    /**
     * The current channel volume
     * @type {number}
     */

    volume = .5;


    /**
     * Loop this track
     * @type {boolean}
     */
    loop = false;

    /**
     * Is this channel paused
     * @type {boolean}
     */
    paused = false;

    /**
     * @param {string} name
     * @param {string} src
     */
    constructor(name, src) {
        this.name = name;
        this.src = src;
    }

    /**
     * @static
     * @param {any} obj
     * @return {Channel}
     */
    static assign(obj) {
        return Object.assign(new Channel(), obj)
    }
}

/**
 * MixerState is the stateful representation of the mixer. Audio players are not
 * stateful and can not be transmitted over a wire so this object holds all the
 * current state of the mixer so that it can be easily be saved to local storage
 * and sent over the message bus to sync other mixers.
 */
class MixerState {
    /**
     * The current master volume
     * @type {number}
     */
    volume = .5

    /**
     * If we are currently paused
     * @type {boolean}
     */
    paused = false;

    /**
     * A dictionary of channels currently in the mixer
     * @type {Object.<string, Channel>}
     */
    channels = {};

    /**
     * @static
     * @param {*} obj
     * @returns {MixerState}
     */
    static assign(obj) {
        // rehydrate channels
        const channels = {}
        Object.entries(obj.channels ?? {}).forEach(([id, channel]) =>
            channels[id] = Channel.assign(channel)
        );
        delete obj.channels;

        // deserialize the rest
        const state = new MixerState;
        state.channels = channels
        return Object.assign(state, obj)
    }
}

/**
 * Events enum
 */
const mixerEvents = Object.freeze(
    {
        ON_CHANNEL_LIST_CHANGE: 'onChannelListChange',
        ON_PLAY_PAUSE: 'onPlayPause',
        ON_CHANGE: 'onChange',
    }
);

/**
 * Creates a generic volume slider
 * @return {HTMLInputElement}
 */
function volumeSlider() {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.step = .01;
    slider.className = "volume-control";
    return slider;
}

/**
 * The Mixers is responsible for mixing together and controlling the play/pause
 * state of the various Channels and controlling the master volume. Mixer state
 * is persisted to local storage, so browser refreshes are not disruptive.
 */
class Mixer extends EventTarget {
    /**
     * A map of the current Audio players
     * @private
     * @type {Object.<string, HTMLAudioElement}
     */
    _players = {};

    /**
     * The the local storage key used for persisting MixerState to local storage
     * @private
     * @type {string}
     */
    _localStorageKey;

    constructor() {
        super();
        this._localStorageKey = `audio.mixer.${window.gameId}.${playerID()}`;
        this.syncPlayers(false);
    }

    /**
     * Syncs the mixer state from local storage into native Audio object
     * @param {boolean} play start playing unpaused channels
     */
    syncPlayers(play = true, skipTime=false) {
        const state = this.state();
 
        Object.entries(state.channels).forEach(([id, channel]) => {
            if(!channel?.src){
                delete this._players[id];
                return;
            }
            let player = this._players[id]

            // create new player if needed
            if (!(player)) {
                let url = channel.src;
                if (url.startsWith("https://drive.google.com")) {
                    if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") < 0) {
                        const parsed = 'https://drive.google.com/uc?id=' + url.split('/')[5];
                        const fileid = parsed.split('=')[1];
                        url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;     
                    } 
                    else if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") > -1) {
                        const fileid = url.split('=')[1];
                        url = `https://www.googleapis.com/drive/v3/files/${fileid}?alt=media&key=AIzaSyBcA_C2gXjTueKJY2iPbQbDvkZWrTzvs5I`;   
                    }
                    const parsed = parse_img(url);
                    url = parsed;
                }
                else if(url.includes('dropbox.com')){       
                    const splitUrl = url.split('dropbox.com');
                    const parsed = `https://dl.dropboxusercontent.com${splitUrl[splitUrl.length-1]}`
                    console.log("parse dropbox audio is converting", url, "to", parsed);
                    url = parsed;
                }
                else if(url.startsWith("https://onedrive.live.com/embed?")){
                   url = url.replace('embed?', 'download?')
                }
                else if(url.includes("https://1drv.ms/"))
                {
                  if(url.split('/')[4].length == 1){
                    url = url;
                  }
                  else{
                    url = "https://api.onedrive.com/v1.0/shares/u!" + btoa(url) + "/root/content";
                  }
                }
                player = new Audio(url);
                player.preload = "none";
                this._players[id] = player;
            }

            if(player.paused)
                player.load();
            if (state.paused || channel.paused) {
                player.pause();
            } else if (play) {        
     
                if(channel.token){
                    if(window.TokenAudioLevels == undefined){
                        window.TokenAudioLevels = {}
                    }
                    if(window.TokenAudioLevels[id] == undefined){
                        window.TokenAudioLevels[id] = 0;
                    }
                }
                player.volume = (window.TokenAudioLevels != undefined) ? window.TokenAudioLevels[id] != undefined ? state.volume * channel.volume * window.TokenAudioLevels[id] : state.volume * channel.volume : state.volume * channel.volume;
                player.loop = channel.loop;
                if(channel.currentTime != undefined && !skipTime){
                    player.currentTime = channel.currentTime;
                }
                   
                const currentState = window.MIXER.state();    
                if(this._players[id] && !(currentState.paused || currentState.channels[id].paused))
                    this.playaudio(id);          
            }
        });

        // delete players that no longer have a channel associated with them
        Object.entries(this._players).forEach(([id, player]) => {
            if (!(id in state.channels)) {
                player.pause();
                delete this._players[id];
            }
        });
    }

    async playaudio(id) {
      
      try {
        await this._players[id].play();
        $(`#mixer-channels .audio-row[data-id='${id}'] .channel-play-pause-button`).toggleClass('playing pressed', true)
        $(`#mixer-channels .audio-row[data-id='${id}'] svg.play-svg`).css('display', 'none');
        $(`#mixer-channels .audio-row[data-id='${id}'] svg.pause-svg`).css('display', 'block');
        $(`#mixer-channels .audio-row[data-id='${id}'] .url-validator`).css('display', 'none');
        $(`#mixer-channels .audio-row[data-id='${id}'] .channel-play-pause-button`).toggleClass('audio-error', false);
      } catch (err) {

        $(`#mixer-channels .audio-row[data-id='${id}'] .channel-play-pause-button`).toggleClass('playing pressed', false);
        $(`#mixer-channels .audio-row[data-id='${id}'] svg.play-svg`).css('display', 'block');
        $(`#mixer-channels .audio-row[data-id='${id}'] svg.pause-svg`).css('display', 'none');
        $(`#mixer-channels .audio-row[data-id='${id}'] .url-validator`).css('display', 'none');
        if(err.name == 'AbortError')
            return;
        $(`#mixer-channels .audio-row[data-id='${id}'] .channel-play-pause-button`).toggleClass('audio-error', true);
      }
    }

    /**
     * Save mixer state to local storage and sync
     * @private
     * @param {MixerState} state
     */
    _write(state, setPlaylist = false, noSync = false) {
        if(!setPlaylist && window.DM){
            let selectedPlaylistID = this.selectedPlaylist();
            if(selectedPlaylistID != undefined){
                if(state.playlists[selectedPlaylistID] == undefined){
                    state.playlists[selectedPlaylistID] = {};
                }
                state.playlists[selectedPlaylistID].channels = state.channels;
                state.playlists[selectedPlaylistID].volume = state.volume;
                state.playlists[selectedPlaylistID].paused = state.paused;
            }
        }
        localStorage.setItem(this._localStorageKey, JSON.stringify(state));
        let audioTokens = $('.audio-token');
        if(audioTokens.length > 0){
            for(let i = 0; i < audioTokens.length; i++){
                setTokenAudio($(audioTokens[i]), window.TOKEN_OBJECTS[$(audioTokens[i]).attr('data-id')]);
            }
        }
        
        if(!noSync){
            this.syncPlayers();  
            this.dispatchEvent(new Event(mixerEvents.ON_CHANGE));
        }

    }

    /**
     * Returns the mixer state from local storage
     * @returns {MixerState}
     */
    state() {
        let mixerState = MixerState.assign(JSON.parse(localStorage.getItem(this._localStorageKey) ?? "{}"));

        if(window.DM){
            for(let id in mixerState.channels){
                if(this._players[id]?.currentTime != 0)
                    mixerState.channels[id].currentTime = this._players[id]?.currentTime;
            } 
        }    
        return mixerState;
    }

    // volume

    /**
     * Set the master volume
     * @type {number}
     */
    set volume(v) {
        const state = this.state();
        state.volume = v;
        const noSync = true;
        this._write(state, undefined, noSync);
    }

    /**
     * Gets teh current master volume
     * @type {number}
     */
    get volume() {
        return this.state().volume;
    }

    // play / pause

    /**
     * Get the play / pause state of the mixer
     * @returns {boolean}
     */
    get paused() {
        return this.state().paused;
    }

    /**
     * Plays the mixer. Only channels that are set to playing will play.
     */
    play() {
        const state = this.state();
        state.paused = false;
        this._write(state);
        this.dispatchEvent(new Event(mixerEvents.ON_PLAY_PAUSE));
    }

    /**
     * Pauses the mixer
     */
    pause() {
        const state = this.state();
        state.paused = true;
        this._write(state);
        this.dispatchEvent(new Event(mixerEvents.ON_PLAY_PAUSE));
    }

    /**
     * Toggle the paused state of the mixer
     */
    togglePaused() {
        this.paused ? this.play() : this.pause();
    }
    // playlists
      /**
     * Returns the current channels in the mixer
     * @returns {Object.<string, Playlist>}
     */
    playlists() {
        return this.state().playlists;
    }
    selectedPlaylist() {
        return (this.state().selected) ? this.state().selected : undefined;
    }
    /**
     * Add a channel in the mixer
     * @param {Playlist} channel
     */
    addPlaylist(Name, useState) {
        const state = this.state();
        let playlistId = uuid();
        if(state.playlists == undefined)
            state.playlists={};
        if(!useState){
            state.playlists[playlistId] = {
                channels: {},
                volume: 0.5,
                paused: true
            };
        }
        else{
            state.playlists[playlistId] = {
                channels: state.channels,
                volume: state.volume,
                paused: state.paused
            };
        }
       
        state.playlists[playlistId].name = Name;
        state.selected = playlistId;
        this.setPlaylist(playlistId, state)
    }

    setPlaylist(id, state=this.state()){
        state.selected = id;
        state.channels = state.playlists[id].channels;
        state.volume = state.playlists[id].volume;
        state.paused = state.playlists[id].paused;
        this._write(state, true);
        this.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));
    }

    /**
     * Return a specific channel from the mixer
     * @param {string} id
     * @returns {playlist}
     */
    readPlaylist(id) {
        const state = this.state();
        if (!(state.playlists[id])) {
            throw `playlists ${id} does not exist in mixer`;
        }
        return state.playlists[id];
    }

    /**
     * Delete a channel from the mixer
     * @param {string} id
     */
    deletePlaylist(id) {
        const state = this.state();
        if($('#mixerPlaylists [selected="selected"]').prev().length>0){
            delete state.playlists[id];
            this.setPlaylist($('#mixerPlaylists [selected="selected"]').prev().val(), state)
        }
    }


    // channels

    /**
     * Returns the current channels in the mixer
     * @returns {Object.<string, Channel>}
     */
    channels() {
        return this.state().channels;
    }

    // CRUD

    /**
     * Add a channel in the mixer
     * @param {Channel} channel
     */
    addChannel(channel, audioId=false) {
        const state = this.state();
        if(audioId){      
            state.channels[audioId] = channel;
            window.TOKEN_OBJECTS[channel.token].options.audioChannel.audioId = audioId;
        }
        else{
            state.channels[uuid()] = channel;
        }

        this._write(state);  
        this.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));
    }
    /**
     * Add multiple channels to the mixer
     * @param {Channel} channel
     */
    addMultiChannels(channelData = []) {
        const state = this.state();
        for(let i in channelData){
            state.channels[uuid()] = channelData[i];
        }

        this._write(state);
        this.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));
    }

    /**
     * Return a specific channel from the mixer
     * @param {string} id
     * @returns {Channel}
     */
    readChannel(id) {
        const state = this.state();
        if (!(state.channels[id])) {
            throw `Channel ${id} does not exist in mixer`;
        }
        return state.channels[id];
    }

    /**
     * Update an already existing channel in the mixer
     * @param {string} id
     * @param {Channel} channel
     */
    updateChannel(id, channel) {
        const state = this.state();
        if (!(state.channels[id])) {
            throw `Channel ${id} does not exist in mixer`;
        }
        state.channels[id] = channel;
        if(channel.token != undefined){
            window.TOKEN_OBJECTS[channel.token].options.audioChannel.volume = channel.volume;
            window.TOKEN_OBJECTS[channel.token].sync();
        }
        this._write(state);
    }

    /**
     * Delete a channel from the mixer
     * @param {string} id
     */
    deleteChannel(id) {
        const state = this.state();
        delete state.channels[id];
        this._write(state);
        this.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));
    }

    updateAnimatedMapVolume(volume) {
        const state = this.state();
        if (!(state.animatedMap)) {
            state.animatedMap = {}
        }
        state.animatedMap.volume=volume;
        this._write(state);
    }


    // extras
    clear() {
        const state = this.state();
        state.paused = true;
        state.channels = {};
        this._write(state);
        this.dispatchEvent(new Event(mixerEvents.ON_PLAY_PAUSE));
        this.dispatchEvent(new Event(mixerEvents.ON_CHANNEL_LIST_CHANGE));
    }


    // UI components

    /**
     * Creates a the master volume slider element
     * @returns {HTMLInputElement}
     */
    masterVolumeSlider() {
        const slider = volumeSlider();
        slider.value = this.volume;
        slider.oninput = this._masterSliderOnInput;
        slider.onchange = this._masterSliderOnChange;

        return slider
    }

    /**
     * On input master slider callback
     * @private
     * @param {InputEvent} e
     */
    _masterSliderOnInput = (e) => {
        Object.entries(this.channels()).forEach(([id, channel]) =>{
            this._players[id].volume  = (window.TokenAudioLevels != undefined) ? window.TokenAudioLevels[id] != undefined ? e.target.value * channel.volume * window.TokenAudioLevels[id] : e.target.value * channel.volume : e.target.value * channel.volume;             
        });
        if(window.YTPLAYER != undefined)
            window.YTPLAYER.setVolume(window.YTPLAYER.volume*$("#master-volume input").val());
    }

    /**
     * On change master slider callback
     * @private
     * @param {InputEvent} e
     */
    _masterSliderOnChange = (e) => {
        this.volume = e.target.value;
        if(window.YTPLAYER != undefined)
            window.YTPLAYER.setVolume(window.YTPLAYER.volume*$("#master-volume input").val());
        if($('video#scene_map').length > 0){
            if(window.DM)
                $('video#scene_map')[0].volume = $("#youtube_volume").val()/100 * $("#master-volume input").val();
            else{
                $('video#scene_map')[0].volume = $('video#scene_map').attr('data-volume') * $("#master-volume input").val();
            }
        }
    }

    /**
     * Creates a channel volume slider element
     * @param {number} id
     * @returns {HTMLInputElement}
     */
    channelVolumeSlider(id) {
        const slider = volumeSlider();
        slider.setAttribute('data-id', id);

        const channel = this.readChannel(id);
        slider.value = channel.volume;
        slider.oninput = this._channelSliderOnInput;
        slider.onchange = this._channelSliderOnChange;

        return slider
    }

    /**
     * On input channel slider callback
     * @private
     * @param {InputEvent} e
     */
    _channelSliderOnInput = (e) => {
        this._players[e.target.getAttribute('data-id')].volume = this.volume * e.target.value;
    }

    /**
     * On change channel slider callback
     * @private
     * @param {InputEvent} e
     */
    _channelSliderOnChange = (e) => {
        const id = e.target.getAttribute('data-id');
        const channel = this.readChannel(id);
        channel.volume = e.target.value;
        this.updateChannel(id, channel);
    }

    /**
     * Creates a channel progress bar element
     * @param {string} id
     * @returns {HTMLDivElement}
     */
    channelProgressBar(id) {
        const progress = document.createElement("div");
        progress.className = "channel-progress-bar-progress";
        progress.setAttribute('data-id', id)

        const total = document.createElement("div");
        total.setAttribute('data-id', id);
        total.className = "channel-progress-bar-total";
        total.append(progress);

        const player = this._players[id];
        if (!player) {
            throw `failed to player for channel ${id}`
        }
        player.ontimeupdate = (e) => {
            progress.style.width = e.target.currentTime / e.target.duration * 100 + "%";

            if (e.target.currentTime == e.target.duration && e.target.loop == false && $(`.audio-row[data-id='${id}'] .channel-play-pause-button.playing`).length > 0) {
                const id = progress.getAttribute('data-id');
                e.target.currentTime = 0;
                $(progress).css('width', '');
                let channel = window.MIXER.readChannel(id);
                channel.currentTime = 0;
                window.MIXER.updateChannel(id, channel);
                $(`.audio-row[data-id='${id}'] .channel-play-pause-button.playing`).click();

                if ($(`.sequential-button`).hasClass('pressed')) {
                    let nextTrack;
                    let currentTrack = $(`.audio-row[data-id="${id}"]:not(.tokenTrack)`);
            
                    if ($(`.sequential-button`).hasClass('shuffle')) {
                        // Shuffle Mode: Pick a random track with time-seeded randomness
                        const seed = new Date().getTime(); // Get current timestamp
                        function seededRandom(seed) {
                            return Math.abs(Math.sin(seed) * 10000) % 1; // Generates a stable random value
                        }
                        let tracks = $(`#mixer-channels .audio-row[data-id]:not(.tokenTrack)`).toArray();
                        let randomIndex;
                        do {
                            randomIndex = Math.floor(seededRandom(seed + Math.random()) * tracks.length);
                        } while ($(tracks[randomIndex]).attr("data-id") === id); // Prevent immediate repeat
            
                        nextTrack = $(tracks[randomIndex]);
                    } else {
                        // Default: Play next track in sequence
                        nextTrack = $(currentTrack).nextAll('.audio-row[data-id]:not(.tokenTrack):first');
                        if (nextTrack.length == 0) {
                            nextTrack = $(`#mixer-channels .audio-row[data-id]:not(.tokenTrack)`).first();
                        }
                    }
                    
                    const nextTrackId= nextTrack.attr('data-id');
                    channel = window.MIXER.readChannel(nextTrackId);    
                    this._players[id].currentTime = 0;
                    channel.currentTime = 0;
                    window.MIXER.updateChannel(nextTrackId, channel);
                
                    nextTrack.find('.channel-play-pause-button').click();
                }
            }
        }

        $(total).off().on('click', function(e){
            let progressRect = this.getBoundingClientRect();
            let percentClick = (e.clientX - progressRect.left) / $(this).width();
            const channel = window.MIXER.readChannel(id);
            if(!isNaN(player.duration)){

                player.currentTime = player.duration * percentClick;
                channel.currentTime = player.currentTime;
                progress.style.width = player.currentTime / player.duration * 100 + "%";
                window.MIXER.updateChannel(id, channel);
            }
       
        });
        return total
    }


    // remote

    /**
     * Update the mixer from a remote source
     * @param {any} remoteObj
     */
    remoteUpdate(remoteObj) {
        const state = MixerState.assign(remoteObj);
        // never take master volume from remote sources
        state.volume = this.volume;
        this._write(state);
    }

    /**
     * Returns mixer state intended for a remote source
     * @returns {MixerState}
     */
    remoteState() {
        const state = this.state();
        // never send master volume to remote sources
        state.volume = undefined;
        return state;
    }


    // handlers

    /**
     * Register a call back for onChannelListChange events
     * @param {EventListenerOrEventListenerObject} callback
     */
    onChannelListChange(callback) {
        this.addEventListener(mixerEvents.ON_CHANNEL_LIST_CHANGE, callback);
    }

    /**
     * Register a call back for onPlayPause events
     * @param {EventListenerOrEventListenerObject} callback
     */
    onPlayPause(callback) {
        this.addEventListener(mixerEvents.ON_PLAY_PAUSE, callback);
    }

    /**
     * Register a call back for onChange events
     * @param {EventListenerOrEventListenerObject} callback
     */
    onChange(callback) {
        this.addEventListener(mixerEvents.ON_CHANGE, callback);
    }
}

function mixer(){
    if(window.MIXER){
        return window.MIXER
    }
    else{
        const mixer = new Mixer();
        return mixer; 
    }

}


export { Channel, mixer, MixerState };
