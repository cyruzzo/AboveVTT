import { trackLibrary } from './track.js';
import { Track } from './track.js';
import { Channel, mixer } from './mixer.js';
import { log } from './helpers.js';

const AVTT_AUDIO_ALLOWED_EXTENSIONS = new Set([
    'aac', 'aif', 'aifc', 'aiff', 'au', 'flac', 'm4a', 'mid', 'mp3', 'm4p', 'm4b',
    'm4r', 'ogg', 'opus', 'ra', 'ram', 'spx', 'wav', 'wm'
]);

function avttAudioSafeDecode(value) {
    if (typeof avttScenesSafeDecode === 'function') {
        return avttScenesSafeDecode(value);
    }
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
}

function avttAudioNormalizeRelativePath(path) {
    if (typeof path !== 'string') {
        return '';
    }
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized) {
        return '';
    }
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function avttAudioRelativePathFromLink(link) {
    const prefix = `above-bucket-not-a-url/${window.PATREON_ID}/`;
    if (typeof link === 'string' && link.startsWith(prefix)) {
        return link.slice(prefix.length);
    }
    return '';
}

async function avttAudioFetchFolderListing(relativePath) {
    const targetPath = typeof relativePath === "string" ? relativePath : "";
    return await avttGetFolderListingCached(targetPath);
}

async function avttAudioCollectAssets(folderRelativePath) {
    const normalizedBase = avttAudioNormalizeRelativePath(folderRelativePath);
    if (!normalizedBase) {
        return [];
    }
    const stack = [normalizedBase];
    const visited = new Set();
    const files = [];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current || visited.has(current)) {
            continue;
        }
        visited.add(current);
        let entries;
        try {
            entries = await avttAudioFetchFolderListing(current);
        } catch (error) {
            console.warn('Failed to load AVTT audio folder listing', current, error);
            continue;
        }
        if (!Array.isArray(entries)) {
            continue;
        }
        for (const entry of entries) {
            const keyValue = typeof entry === 'string' ? entry : entry?.Key || entry?.key || '';
            if (!keyValue) {
                continue;
            }
            let relativeKey = keyValue;
            if (typeof avttExtractRelativeKey === 'function') {
                relativeKey = avttExtractRelativeKey(keyValue);
            } else {
                const prefix = `${window.PATREON_ID}/`;
                relativeKey = keyValue.startsWith(prefix) ? keyValue.slice(prefix.length) : keyValue;
            }
            if (!relativeKey || !relativeKey.startsWith(normalizedBase)) {
                continue;
            }
            if (relativeKey.endsWith('/')) {
                if (!visited.has(relativeKey)) {
                    stack.push(relativeKey);
                }
                continue;
            }
            const extension = typeof getFileExtension === 'function'
                ? getFileExtension(relativeKey)
                : (relativeKey.split('.').pop() || '').toLowerCase();
            if (!AVTT_AUDIO_ALLOWED_EXTENSIONS.has(String(extension).toLowerCase())) {
                continue;
            }
            files.push(relativeKey);
        }
    }
    return files;
}

function avttAudioDeriveName(value) {
    const decoded = avttAudioSafeDecode(value || '');
    return decoded.replace(/\.[^.]+$/, '') || decoded;
}

async function importAvttAudioSelections(links) {
    if (!Array.isArray(links) || links.length === 0) {
        return;
    }
    
    build_import_loading_indicator("Importing Audio...");

    const folderSet = new Set();
    const audioPlans = [];

    const directFiles = [];
    const folderEntries = [];
    for (const link of links) {
        if (!link) {
            continue;
        }
        if (link.isFolder) {
            folderEntries.push(link);
        } else {
            directFiles.push(link);
        }
    }

    for (const link of directFiles) {
        const relativePathRaw = typeof link.path === 'string' ? link.path : link.name;
        const normalizedRelative = (relativePathRaw || '').replace(/\\/g, '/');
        const parts = normalizedRelative.split('/').filter(Boolean);
        const fileName = parts.pop() || link.name || 'Track';
        const extension = typeof getFileExtension === 'function'
            ? getFileExtension(fileName)
            : (fileName.split('.').pop() || '');
        if (!AVTT_AUDIO_ALLOWED_EXTENSIONS.has(String(extension).toLowerCase())) {
            continue;
        }
        const tags = parts.map(avttAudioSafeDecode);
        audioPlans.push({
            name: avttAudioDeriveName(fileName),
            link: link.link,
            tags: Array.from(new Set(tags)),
        });
    }

    for (const folderLink of folderEntries) {
        const folderPathRaw = folderLink.path || avttAudioRelativePathFromLink(folderLink.link);
        const normalizedRelative = avttAudioNormalizeRelativePath(folderPathRaw);
        if (!normalizedRelative) {
            continue;
        }
        const rootSegments = normalizedRelative.replace(/\/$/, '').split('/').filter(Boolean);
        if (!rootSegments.length) {
            continue;
        }
        const rootFullPath = sanitize_folder_path(`${rootSegments.join('/')}`);
        folderSet.add(rootFullPath);

        let assets;
        try {
            assets = await avttAudioCollectAssets(normalizedRelative);
        } catch (error) {
            console.warn('Failed to enumerate AVTT audio folder', folderLink, error);
            assets = [];
        }

        for (const relativePath of assets) {
            const extension = typeof getFileExtension === 'function'
                ? getFileExtension(relativePath)
                : (relativePath.split('.').pop() || '');
            if (!AVTT_AUDIO_ALLOWED_EXTENSIONS.has(String(extension).toLowerCase())) {
                continue;
            }
            const segments = relativePath.split('/').filter(Boolean);
            const fileName = avttAudioDeriveName(segments.pop() || '');
            const folderSegments = segments;
            const tags = Array.from(new Set(folderSegments.map(avttAudioSafeDecode)));
            const linkUrl = `above-bucket-not-a-url/${window.PATREON_ID}/${relativePath}`;
            audioPlans.push({
                name: fileName,
                link: linkUrl,
                tags,
            });
        }
    }
    const library = await window.TRACK_LIBRARY.map();
    for (const plan of audioPlans) {

        try {
            const track = await new Track(plan.name, plan.link);
            track.tags = plan.tags;
            library.set(uuid(), track)
    
        } catch (error) {
            console.warn('Failed to add track to library', plan, error);
        }
    }
    
    window.TRACK_LIBRARY._write(library);

    $('body>.import-loading-indicator').remove();
}

/**
 *
 * @returns {HTMLDivElement}
 */

const debounceSearch = mydebounce((searchFilter) => {      
        window.TRACK_LIBRARY.filterTrackLibrary(searchFilter)
}, 500);


function masterVolumeSlider() {
    const div = document.createElement("div");
    div.textContent = "Master Volume";
    div.className = "audio-row";
    div.id = "master-volume"
    div.append(window.MIXER.masterVolumeSlider());

    return div; 
}

function init_mixer() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Mixer";
    $(header).css('display', 'inline');
    // mixer channels
    const mixerChannels = document.createElement("ul");
    mixerChannels.id = 'mixer-channels';

    if(window.MIXER.state().playlists == undefined ){
        window.MIXER.addPlaylist("Default", true);
    }          
    let playlists = window.MIXER.playlists();
    let playlistInput = $(`<select id='mixerPlaylists'></select>`);
    let playlistType = $(``)


    /** @param {Object.<string, Channel>} */
    const drawChannelList = (channels) => {
        playlistInput.find('option').remove();
        playlists = window.MIXER.playlists();
       
        Object.entries(playlists).forEach(([id, state]) => {
            if(id == 'selected')
                return;
            let option = $(`<option value='${id}'>${state.name}</option>`);
            if(window.MIXER.selectedPlaylist() == id)
                option.attr('selected', 'selected');
            else
                option.removeAttr('selected');
            playlistInput.append(option);
        });
        mixerChannels.innerHTML = "";
        let youtube_section= $("<li class='audio-row map-audio-row'></li>");;    
        let channelNameDiv = $(`<div class='channelNameOverflow'><div class='channelName'>Animated Map Audio</div>`)
        let youtube_volume = $(`<input type="range" min="0" max="100" value="${window.MIXER.state()?.animatedMap?.volume != undefined ? window.MIXER.state().animatedMap.volume : window.YTPLAYER ? window.YTPLAYER.volume : 25}" step="1" class="volume-control" id="youtube_volume">`);
        $(youtube_section).append(channelNameDiv, youtube_volume);
        $(mixerChannels).append(youtube_section);
        youtube_volume.on("change", function() {
            const newVolume = $("#youtube_volume").val();
            const masterVolume = $("#master-volume input").val();
            if (window.YTPLAYER) {
                window.YTPLAYER.volume = newVolume;
                window.YTPLAYER.setVolume(window.YTPLAYER.volume*masterVolume);
            }   
            if($('video#scene_map').length > 0)
                $('video#scene_map')[0].volume = newVolume/100 * masterVolume;  

            if(window.YTPLAYER || $('video#scene_map').length>0){
                let data={
                    volume: newVolume
                };
                window.MB.sendMessage("custom/myVTT/changeyoutube",data);
            }   
            window.MIXER.updateAnimatedMapVolume(newVolume);
        });

        /** @type {Object.<string, Channel>} */
        const objectKeys = Object.keys(channels)
        let channelArray = playlists[window.MIXER.selectedPlaylist()].orderedChannels?.length ? playlists[window.MIXER.selectedPlaylist()].orderedChannels : objectKeys;
        const leftOverKeys = objectKeys.filter(key => { if(!channelArray.includes(key)) return key });
        channelArray = channelArray.concat(leftOverKeys);
        channelArray.forEach((id) => {
            const channel = channels[id]
            
            if(!channel?.src){
                return;
            }
            if(channel?.token){
                if(window.TOKEN_OBJECTS[channel.token] == undefined){
                    window.MIXER.deleteChannel(id);
                    return;
                }
            }
            const item = document.createElement("li");
            item.className = "audio-row";
            let channelNameDiv = $(`<div class='channelNameOverflow'><div class='channelName'>${channel.name}</div></div>`)
            item.setAttribute("data-id", id);



            //item.append(window.MIXER.channelVolumeSlider(id), window.MIXER.channelProgressBar(id));
            let remove = $('<button class="channel-remove-button"">X</button>');
            if(channel.token == undefined){
                remove.off().on("click", function(){
                    window.MIXER.deleteChannel(id);
                });
            }
            else{
                remove=$('<button class="channel-remove-button" title="Find Token" style="display:inline-block;"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg></button>');
                //find.tooltip({show: { duration: 1000 }})
                remove.off().on("click", function(){   
                    if(channel.token in window.TOKEN_OBJECTS){
                        window.TOKEN_OBJECTS[channel.token].highlight();        
                    }
                })
                $(item).toggleClass('tokenTrack', true);
            }
           
            // repeat button
            let loop = $('<button class="channel-loop-button""></button>');
            let loop_svg = $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M7 22 3 18 7 14 8.4 15.45 6.85 17H17V13H19V19H6.85L8.4 20.55ZM5 11V5H17.15L15.6 3.45L17 2L21 6L17 10L15.6 8.55L17.15 7H7V11Z"/></svg>`);
            loop.append(loop_svg);

            // play/pause button
            let channel_play_pause = $('<button class="channel-play-pause-button"></button>');
            let play_svg = $('<svg class="play-svg" xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M8 19V5L19 12ZM10 12ZM10 15.35 15.25 12 10 8.65Z"/></svg>');
            let pause_svg = $('<svg class="pause-svg" xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M14 19V5H18V19ZM6 19V5H10V19Z"/></svg>');
            let validIcon = $(`<span style='display:none;' title="Loading Track" class="material-icons url-validator loading audio">autorenew</span>`)

            channel_play_pause.append(play_svg);

            //Activate Swap button when channel.paused

            channel_play_pause.append(pause_svg);
            channel_play_pause.append(validIcon);
            if(channel.paused) {
                play_svg.css('display', 'block');
                pause_svg.css('display', 'none');
                channel_play_pause.toggleClass('playing pressed', false);
            }
            else{
                play_svg.css('display', 'none');
                pause_svg.css('display', 'none');
                validIcon.css('display', 'block');
                channel_play_pause.toggleClass('audio-error', false);
            }

                
            channel_play_pause.append(play_svg);
            channel_play_pause.append(pause_svg);

            channel_play_pause.on('click', function(){

                
                const channel = window.MIXER.state().channels[id]
                if(channel.paused) {
                    if($('.sequential-button').hasClass('pressed') && !$(this).closest(`.audio-row`).hasClass('tokenTrack')){
                        $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing`).click();
                    }
                    play_svg.css('display', 'none');
                    pause_svg.css('display', 'none');
                    validIcon.css('display', 'block');

                    channel.paused = false;
                    window.MIXER.updateChannel(id, channel);
                    if(window.MIXER.paused){
                        window.MIXER.togglePaused();
                        const playPause = $('.mixer-play-pause-button');
                        const mixer_playlist_svg = $('.mixer-play-pause-button svg:first-of-type');
                        const pause_svg = $('.mixer-play-pause-button svg:nth-of-type(2)');
                        pause_svg.css('display', 'block');
                        mixer_playlist_svg.css('display', 'none');
                        playPause.toggleClass('playing', true);
                        playPause.toggleClass('pressed', true);
                        $('style#mixer-paused').remove();
                    }
                }
                else {
                    pause_svg.css('display', 'none');
                    play_svg.css('display', 'block');
                    channel_play_pause.toggleClass('playing', false);
                    channel_play_pause.toggleClass('pressed', false);
                    channel.paused = true;
                    window.MIXER.updateChannel(id, channel);
                }
            });``

            if(channel.loop) {
                loop.toggleClass('pressed', true);
            }
            else {
                loop.toggleClass('pressed', false);
            }
            loop.on('click', function(){
                const channel = window.MIXER.state().channels[id]
                if(channel.loop) {
                    loop.toggleClass('pressed', false);
                    channel.loop = false;
                    window.MIXER.updateChannel(id, channel);
                }
                else {
                    loop.toggleClass('pressed', true);
                    channel.loop = true;
                    window.MIXER.updateChannel(id, channel);
                }
            });

            let playPauseMixer = $('.mixer-play-pause-button');
            let mixer_playlist_svg = $('.mixer-play-pause-button svg:first-of-type');
            let mixer_pause_svg = $('.mixer-play-pause-button svg:nth-of-type(2)');
            if(window.MIXER.paused) {
                mixer_playlist_svg.css('display', 'block');
                mixer_pause_svg.css('display', 'none');
                playPauseMixer.toggleClass('playing', false);
                playPauseMixer.toggleClass('pressed', false);
                $('head').append(`<style id="mixer-paused" />#sounds-panel button.pressed.playing{background: #ffd03b45 !important;}</style>`);
            }
            else {
                mixer_pause_svg.css('display', 'block');
                mixer_playlist_svg.css('display', 'none');
                playPauseMixer.toggleClass('playing', true);
                playPauseMixer.toggleClass('pressed', true);
                $('style#mixer-paused').remove();
            }    

            function waitForPlayer(id, callback = () => {}) {
                if (typeof window.MIXER._players[id] !== "undefined") {
                    callback();
                }
                else {
                    setTimeout(function () { waitForPlayer(id, callback)}, 250);
                }
            }

            waitForPlayer(id, () => {
                $(item).append(channelNameDiv, window.MIXER.channelVolumeSlider(id), channel_play_pause, loop, remove, window.MIXER.channelProgressBar(id));
                mixerChannels.append(item);
                if (channel.paused) {
                    play_svg.css('display', 'block');
                    pause_svg.css('display', 'none');
                    channel_play_pause.toggleClass('playing pressed', false);
                }
                else {
                    play_svg.css('display', 'none');
                    pause_svg.css('display', 'none');
                    validIcon.css('display', 'block');
                    channel_play_pause.toggleClass('audio-error', false);
                }
            })
        });

        $(mixerChannels).sortable({
            cancel:'.map-audio-row, .tokenTrack, input, .channel-progress-bar-progress, .channel-progress-bar-total',
            distance: 10,
            axis: 'y',
            items: '.audio-row:not(.map-audio-row):not(.tokenTrack)',
            stop: (event, ui) => {
                const state = window.MIXER.state()
                try {
                    const orderedIds = $('.sidebar-panel-header li.audio-row:not(.map-audio-row):not(.tokenTrack)').map((i, item) => {
                        return $(item).attr('data-id')
                    })
                    state.orderedChannels = [...orderedIds];
                    window.MIXER._write(state);
                }
                catch (error) {
                    console.warn(`Could not get playlist order: ${error.message}`)
                }

               
            }
        })
    }



    playlistInput.off().on('change', function(e){
        window.MIXER.setPlaylist(e.target.value); 
    });


    drawChannelList(window.MIXER.readPlaylist(window.MIXER.selectedPlaylist()).channels);
    window.MIXER.onChannelListChange((e) =>  drawChannelList(window.MIXER.readPlaylist(window.MIXER.selectedPlaylist()).channels));

    // clear button

    let addPlaylistButton = $('<button id="add-playlist">Add Playlist</button>');
   
    const playlistFields = $("<div id='playlistFields'></div>")
    const playlistName = $(`<input class='trackName trackInput' placeholder='Playlist Name'/>`)
    const okButton = $('<button class="add-track-ok-button">OK</button>');  
    const cancelButton = $('<button class="add-track-cancel-button">X</button>');  
    let copyPlaylist = false;
    addPlaylistButton.off().on("click", function(){
        copyPlaylist = false;
        playlistFields.css("height", "25px");
    });
    cancelButton.off().on("click", function(){
        playlistFields.css("height", "0px");
    });
    okButton.off().on("click", function(){
        playlistFields.css("height", "0px");
        if(playlistName.val() != ''){
            if(!copyPlaylist)
                window.MIXER.addPlaylist(playlistName.val());
            else
                window.MIXER.addPlaylist(playlistName.val(), true);
        }
        playlistName.val('');
    });
    playlistFields.append(playlistName, okButton, cancelButton);

    let copyPlaylistButton = $('<button id="add-playlist">Copy</button>');
    copyPlaylistButton.off().on('click', function(e){
        copyPlaylist = true;
        playlistFields.css("height", "25px");
        playlistName.val(`${window.MIXER.readPlaylist(window.MIXER.selectedPlaylist()).name} (copy)`);
        playlistName.select();
    });

    let removePlaylistButton = $('<button id="remove-playlist">Remove</button>');

    removePlaylistButton.off().on('click', function(e){
        window.MIXER.deletePlaylist(window.MIXER.selectedPlaylist());
    });

    let clear = $('<button class="mixer-clear-button"></button>');
    let clear_svg = $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M3 16V14H10V16ZM3 12V10H14V12ZM3 8V6H14V8ZM14.4 22 13 20.6 15.6 18 13 15.4 14.4 14 17 16.6 19.6 14 21 15.4 18.4 18 21 20.6 19.6 22 17 19.4Z"/></svg>`);
    clear.append(clear_svg);
    clear.on('click', function(){window.MIXER.clear()});

    let sequentialPlay = $(`<button class="sequential-button ${window.MIXER.mixerMode == 'playlist' ? 'pressed' : window.MIXER.mixerMode == 'shuffle' ? 'pressed shuffle' : ''}"></button>`);
    let sequential_svg = $(`<span class="material-symbols-outlined">${window.MIXER.mixerMode == 'shuffle' ? 'shuffle' : 'format_list_numbered_rtl'}</span>`)
    sequentialPlay.append(sequential_svg);
    sequentialPlay.off().on("click", function() {
        const icon = sequentialPlay.find(".material-symbols-outlined"); // Find the icon span
    
        // Cycle through: Off → Continuous → Shuffle → Off
        if (!sequentialPlay.hasClass("pressed")) {
            sequentialPlay.addClass("pressed");
            sequentialPlay.attr("title", "Continuous Play");
            let currentlyPlaying = $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing:not(:first)`)
            if(currentlyPlaying.length>0){
                currentlyPlaying.click();
            }
            window.MIXER.mixerMode = 'playlist';
            // icon.text("repeat"); // Continuous Play icon
        } else if (!sequentialPlay.hasClass("shuffle")) {
            sequentialPlay.addClass("shuffle");
            sequentialPlay.attr("title", "Shuffle Play");
            icon.text("shuffle"); // Shuffle Play icon
            window.MIXER.mixerMode = 'shuffle';
        } else {
            sequentialPlay.removeClass("shuffle pressed");
            sequentialPlay.attr("title", "Soundboard/Playlist Mode");
            icon.text("format_list_numbered_rtl"); // Default icon
            window.MIXER.mixerMode = 'soundboard';
        }
    
        console.log("Playback Mode:", sequentialPlay.attr("title"));
    });

    let crossFade = $(`<button class="cross-fade-button ${window.MIXER.state().fade == true ? 'pressed' : ''}"></button>`);
    let crossFadeSvg = $(`<span class="material-symbols-outlined">edit_audio</span>`)
    crossFade.append(crossFadeSvg);
    crossFade.off().on("click", function () {
        const isPressed = $(this).hasClass('pressed')
        crossFade.toggleClass('pressed', !isPressed);
        window.MIXER.fade = !isPressed;
    });


    // play/pause button
    let playPause = $('<button class="mixer-play-pause-button" style="font-size:10px;"></button>');
    let mixer_playlist_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M2.5 8V6H14.5V8ZM2.5 12V10H14.5V12ZM2.5 16V14H10.5V16ZM15.5 21V13L21.5 17Z"/></svg>');
    let pause_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M14 19V5H18V19ZM6 19V5H10V19Z"/></svg>');
    if(window.MIXER.paused) {
        mixer_playlist_svg.css('display', 'block');
        pause_svg.css('display', 'none');
        playPause.toggleClass('playing', false);
        playPause.toggleClass('pressed', false);
        $('head').append(`<style id="mixer-paused" />#sounds-panel button.pressed.playing{background: #ffd03b45 !important;}</style>`);
    }
    else {
        pause_svg.css('display', 'block');
        mixer_playlist_svg.css('display', 'none');
        playPause.toggleClass('playing', true);
        playPause.toggleClass('pressed', true);
        $('style#mixer-paused').remove();
    }
        
    playPause.append(mixer_playlist_svg);
    playPause.append(pause_svg);

    playPause.on('click', function(){
        window.MIXER.togglePaused();
        if(sequentialPlay.hasClass('pressed') && $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing`).length>1){
            $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing`).click();
        }
        if(window.MIXER.paused) {
            mixer_playlist_svg.css('display', 'block');
            pause_svg.css('display', 'none');
            playPause.toggleClass('playing', false);
            playPause.toggleClass('pressed', false);
             $('head').append(`<style id="mixer-paused" />#sounds-panel button.pressed.playing{background: #ffd03b45 !important;}</style>`);
           
        }
        else {
            pause_svg.css('display', 'block');
            mixer_playlist_svg.css('display', 'none');
            playPause.toggleClass('playing', true);
            playPause.toggleClass('pressed', true);
             $('style#mixer-paused').remove();
        }
    });
    $("#sounds-panel").off('mouseover.channelName').on('mouseover.channelName', '.channelName, .track-name', function(e){
        const target = $(e.currentTarget)
        
        const text = $(e.currentTarget).text();
        const text_calc = $('body>div.track-name:first');
        text_calc.html(`${text}.....`);
        const nameWidth = text_calc.width();
        const overflowVal = target.is('.track-name') ? 230 : 100;

        target.css({
            "--name-width-overflow": (overflowVal - nameWidth < 0) ? overflowVal - 10 - nameWidth+'px' : 0,
            "--overflow-speed": (overflowVal - nameWidth < 0) ? parseInt(nameWidth)*10+'ms' : 800+'ms'
        });   
    })
    $("#sounds-panel .sidebar-panel-header").append(header, playlistInput, addPlaylistButton, copyPlaylistButton, removePlaylistButton, playlistFields, masterVolumeSlider(), mixerChannels);
    $('#master-volume').append(clear, sequentialPlay, crossFade, playPause);
}


function shuffleArray(array) {
    const seed = new Date().getTime(); // Get the current timestamp at shuffle time

    function seededRandom(seed) {
        return Math.sin(seed) * 10000 % 1; // Simple deterministic function
    }

    return array
        .map(track => ({ track, sort: seededRandom(seed + Math.random()) })) // Use dynamic seed
        .sort((a, b) => a.sort - b.sort) // Sort based on seeded value
        .map(obj => obj.track); // Return only tracks
}

// Function to add filtered tracks to the Mixer
function addTracks(filteredTracks, shuffle = false) {
    if (filteredTracks.length === 0) {
        alert("No tracks found in the current filter.");
        return;
    }

    if (shuffle) {
        filteredTracks = shuffleArray(filteredTracks); // Random shuffle
    }

    // Show confirmation if adding more than 50 tracks
    if (filteredTracks.length > 200) {
        confirm(`You're about to add ${filteredTracks.length} tracks to the mixer. This message would be too large to send to players. Add fewer tracks.`)
        return;
    }
    let channelData = [];
    filteredTracks.forEach(track => {
        const channel = new Channel(track.name, track.src);
        channel.paused = true; // Add but don't auto-play
        channelData.push(channel);
    });
    window.MIXER.addMultiChannels(channelData);

    console.log(`Added ${filteredTracks.length} ${shuffle ? "shuffled " : ""}tracks to the Mixer.`);
}


function init_trackLibrary() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Track Library";

    const searchTrackLibary = $(`<input type='search' placeholder='Search' style='margin-bottom: 5px; width: 97%;'></input>`)
    searchTrackLibary.off().on('change keyup blur search', (e) => {      
        debounceSearch(e.target.value);
    });

    //import dropbox
    const dropboxOptions = dropBoxOptions(function(links){
        for(let i = 0; i<links.length; i++){
            trackLibrary.addTrack(links[i].name, links[i].link);  
        }
    }, true, ['audio'], true);
    const dropBoxbutton = createCustomDropboxChooser(' ', dropboxOptions);
    let audioArray = ['.aac', '.aif', '.aifc', '.aiff', '.au', '.flac', '.m4a', '.mid', '.mp3', '.m4p', '.m4b', '.m4r', '.ogg', '.opus', '.ra', '.ram', '.spx', '.wav', '.wm']
    const oneDriveButton = createCustomOnedriveChooser(' ', function(links){
        for(let i = 0; i<links.length; i++){
            trackLibrary.addTrack(links[i].name, links[i].link);  
        }   
    }, 'multiple', audioArray);
   
    const avttButton = createCustomAvttChooser(' ', function (links) {
        importAvttAudioSelections(links)  
    }, [avttFilePickerTypes.AUDIO, avttFilePickerTypes.FOLDER]);
    // import csv button
    const importCSV = document.createElement('button');
    importCSV.textContent = "Import CSV";
    importCSV.onclick = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".csv";
        fileInput.onchange = (e) => {
            const reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = () => trackLibrary.importCSV(reader.result);
            reader.onerror = () => { throw reader.error };
        };
        fileInput.click();
    };
    importCSV.style.position = 'absolute';
    importCSV.style.top = '15px';
    importCSV.style.right = '90px';

    const exportCSV = document.createElement('button');
    exportCSV.textContent = "Export CSV";
    exportCSV.onclick = () => {
        if (typeof window.export_audio_csv === 'function') {
            window.export_audio_csv();
            return;
        }
        if (!window?.TRACK_LIBRARY || typeof window.TRACK_LIBRARY.exportCSV !== 'function') {
            alert('Audio CSV export is not available.');
            return;
        }
        const csvContent = window.TRACK_LIBRARY.exportCSV();
        const currentDate = new Date();
        const datetime = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)}-${currentDate.getDate()}`;
        const campaignName = window?.CAMPAIGN_INFO?.name ? window.CAMPAIGN_INFO.name : 'Campaign';
        download(csvContent, `${campaignName}-${datetime}-audio.csv`, "text/csv;charset=utf-8;");
    }
    exportCSV.style.position = 'absolute';
    exportCSV.style.top = '15px';
    exportCSV.style.right = '2px';

    const addTrack = $(`<button id='addTrack'>Add Track</button>`)
    const importTrackFields = $("<div id='importTrackFields'></div>")
    const trackName = $(`<input class='trackName trackInput' placeholder='Track Name'/>`)
    const trackSrc = $(`<input class='trackSrc trackInput' placeholder='https://.../example.mp3'/>`)
    const okButton = $('<button class="add-track-ok-button">OK</button>');  
    const cancelButton = $('<button class="add-track-cancel-button">X</button>');  

    // Mixer/ Track List QOL updates
    const addTracksToMixer = $(`<button id='addTrack'>Add Visible to Mixer</button>`);
    const addShuffledToMixer = $('<button id="addShuffledToMixer">Add Shuffled to Mixer</button>');

    // Click handlers
    addTracksToMixer.on("click", function() {
        const filteredTracks = [...document.querySelectorAll("#track-list .audio-row:not(.hidden-track)")]
            .map(track => ({
                name: track.getAttribute("data-name"),
                src: track.getAttribute("data-src"),
            }));
        addTracks(filteredTracks);
    });

    addShuffledToMixer.on("click", function() {
        const filteredTracks = [...document.querySelectorAll("#track-list .audio-row:not(.hidden-track)")]
            .map(track => ({
                name: track.getAttribute("data-name"),
                src: track.getAttribute("data-src"),
            }));
        addTracks(filteredTracks, true); // Enable shuffle
    });
    

    addTrack.off().on("click", function(){
        importTrackFields.css("height", "25px");
    });
    cancelButton.off().on("click", function(){
        importTrackFields.css("height", "0px");
        trackName.val([]);
        trackSrc.val([]);
    });
    okButton.off().on("click", function(){
        importTrackFields.css("height", "0px");
        trackLibrary.addTrack(trackName.val(), trackSrc.val());
        trackName.val([]);
        trackSrc.val([]);
    });
    importTrackFields.append(trackName, trackSrc, okButton, cancelButton);
    if($('body>div.track-name:first').length == 0){
        $('body').append(`<div class='track-name'/>`)
    }
    // track list
    const trackList = document.createElement("ul");
    trackList.id = 'track-list';


    $(trackList).off('click.play').on('click.play', '.track-play-pause-button', function(e){
        const currentTrack = $(e.currentTarget).closest('li')
        const track = {name: currentTrack.attr('data-name'), src:currentTrack.attr('data-src')};
        if($('.sequential-button').hasClass('pressed') && !$(this).closest(`.audio-row`).hasClass('tokenTrack')){
            $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing`).click();
        }
        const channel = new Channel(track.name, track.src);
        channel.paused = false;
        channel.loop = false;
        window.MIXER.addChannel(channel);
        if(window.MIXER.paused){
            window.MIXER.togglePaused();
            const playPause = $('.mixer-play-pause-button');
            const mixer_playlist_svg = $('.mixer-play-pause-button svg:first-of-type');
            const pause_svg = $('.mixer-play-pause-button svg:nth-of-type(2)');
            pause_svg.css('display', 'block');
            mixer_playlist_svg.css('display', 'none');
            playPause.toggleClass('playing', true);
            playPause.toggleClass('pressed', true);
            $('style#mixer-paused').remove();
        }
            
    });
    $(trackList).off('click.addTrack').on('click.addTrack', '.track-add-to-mixer', function(e){
        const currentTrack = $(e.currentTarget).closest('li')
        const track = {name: currentTrack.attr('data-name'), src:currentTrack.attr('data-src')};
        const channel = new Channel(track.name, track.src);
        channel.paused = true;
        channel.loop = false;
        window.MIXER.addChannel(channel);
    });
    $(trackList).off('click.addToken').on('click.addToken', '.track-add-token-mixer', function(e){
        const currentTrack = $(e.currentTarget).closest('li')
        const track = {name: currentTrack.attr('data-name'), src:currentTrack.attr('data-src')};
        const channel = new Channel(track.name, track.src);
        channel.paused = false;
        channel.loop = true;     
        channel.range = 30;
        channel.attenuate = true;
        channel.wallsBlocked = true;
        channel.tokenVolume = {};
        let options = {
            ...default_options(),
            ...window.TOKEN_SETTINGS,
            tokenStyleSelect: 'noConstraint',
            hidden: true,
            imgsrc: `${window.EXTENSION_PATH}assets/icons/speaker.svg`,
            audioChannel: channel,
            name: channel.name
        }

        options.audioChannel.token = options.id;
        place_token_in_center_of_view(options);
    });



    trackLibrary.onchange((e) => {
        trackList.innerHTML = "";
        /** @type {typeof trackLibrary}  */
        const newTrackList = $('<div></div>')
        const tl = e.target
        const sortedTL = new Map([...tl.map().entries()].sort((a, b) => a[1].name.toUpperCase().localeCompare(b[1].name.toUpperCase())))
                            
        sortedTL.forEach((track, id) => {
            const item = document.createElement("li");
            item.className = "audio-row";
            item.setAttribute("data-id", id);
            item.setAttribute("data-src", track.src);
            item.setAttribute("data-name", track.name);
            $(item).append($(`<div class='trackNameOverflow'><div class='track-name'>${track.name}</div></div>`))
     

            // play button
            const track_play_button = $('<button class="track-play-pause-button"></button>');          
            const play_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M8 19V5L19 12ZM10 12ZM10 15.35 15.25 12 10 8.65Z"/></svg>');               
            track_play_button.append(play_svg);

            const track_add_button = $('<button class="track-add-to-mixer"></button>');          
            const add_svg = $('<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class=""><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>');               
            track_add_button.append(add_svg);


            const track_add_token = $('<button class="track-add-token-mixer"></button>');          
            const add_token_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M12 11c1.33 0 4 .67 4 2v.16c-.97 1.12-2.4 1.84-4 1.84s-3.03-.72-4-1.84V13c0-1.33 2.67-2 4-2zm0-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 .2C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/></svg>');               
            track_add_token.append(add_token_svg);
            

            $(item).append(track_play_button, track_add_button, track_add_token); 
            $(newTrackList).append(item);
        });
        trackList.innerHTML = newTrackList[0].innerHTML;
        window.TRACK_LIBRARY.filterTrackLibrary($(`#sounds-panel input[placeholder='Search']`).val())
    });

    $.contextMenu({
        selector: ".audio-row",
        build: function(element, e) {

            let menuItems = {};

            const rowHtml = $(element);
            const trackID = rowHtml.attr('data-id');
            const trackSrc = rowHtml.attr('data-src');
            const trackName = rowHtml.text();

            if (trackID === undefined) {
                console.warn("register_token_row_context_menu failed to find row item", element, e)
                menuItems["unexpected-error"] = {
                    name: "An unexpected error occurred",
                    disabled: true
                };
                return { items: menuItems };
            }
            menuItems["edit"] = {
                name: "Edit",
                callback: function() {
                    const importTrackFields = $("<div id='editTrackFields'></div>")
                    const trackNameInput = $(`<input class='trackName trackInput' placeholder='Track Name'/>`)
                    const trackSrcInput = $(`<input class='trackSrc trackInput' placeholder='https://.../example.mp3'/>`)
                    const okButton = $('<button class="add-track-ok-button">OK</button>');  
                    const cancelButton = $('<button class="add-track-cancel-button">X</button>');  
                    const trackTags = window.TRACK_LIBRARY.find(trackName, trackSrc)[1].tags;
                    trackNameInput.val(trackName);
                    trackSrcInput.val(trackSrc);
                    
                    cancelButton.off().on("click", function(){
                      trackLibrary.deleteTrack(trackID);
                      trackLibrary.addTrack(trackName, trackSrc, trackTags);
                      importTrackFields.remove();
                    });
                    okButton.off().on("click", function(){
                        trackLibrary.deleteTrack(trackID);
                        trackLibrary.addTrack(trackNameInput.val(), trackSrcInput.val(), trackTags);
                        importTrackFields.remove();
                    });
                    importTrackFields.append(trackNameInput, trackSrcInput, okButton, cancelButton);
                    rowHtml.after(importTrackFields);
                    rowHtml.remove();
                }
            };
            menuItems["tags"] = {
                name: "Tags",
                callback: function() {
                    const setTrackTagsFields = $("<div id='editTagsFields'></div>")
                    const trackTagsInput = $(`<textarea class='trackTags trackInput' placeholder='Combat, CoS, Vampire'/>`)
                    const okButton = $('<button class="add-track-ok-button">OK</button>');  
                    const cancelButton = $('<button class="add-track-cancel-button">X</button>');  
                    const currentTrack = window.TRACK_LIBRARY.find(trackName, trackSrc);

                    trackTagsInput.val(currentTrack[1].tags.join(', '));

                    
                    cancelButton.off().on("click", function(){
                      setTrackTagsFields.remove();
                    });
                    okButton.off().on("click", function(){
                        const tags = trackTagsInput.val().split(', ');
                        currentTrack[1].tags = tags;
                        window.TRACK_LIBRARY.update(trackID, currentTrack[1]) 
                        setTrackTagsFields.remove();
                    });
                    setTrackTagsFields.append(trackTagsInput, okButton, cancelButton);
                    rowHtml.after(setTrackTagsFields);
                }
            };
            menuItems["border"] = "---";

            // not a built in folder or token, add an option to delete
            menuItems["delete"] = {
                name: "Delete",
                callback: function() {
                    trackLibrary.deleteTrack(trackID);
                    rowHtml.remove();
                }
            };
     

            return { items: menuItems };
        }
    });
    trackLibrary.dispatchEvent(new Event('onchange'));
    if (window.testAvttFilePicker === true) {
        $("#sounds-panel .sidebar-panel-body").append(header, searchTrackLibary, "<br>", addTracksToMixer, addShuffledToMixer, "<br>", addTrack, dropBoxbutton, avttButton, importCSV, exportCSV, importTrackFields, trackList);
    }
    else {
        $("#sounds-panel .sidebar-panel-body").append(header, searchTrackLibary, "<br>", addTracksToMixer, addShuffledToMixer, "<br>", addTrack, dropBoxbutton, oneDriveButton, importCSV, exportCSV, importTrackFields, trackList);
    }
    
}

function init() {
    log(`initializing audio ui for ${window.DM ? 'DM' : 'player'}`);
    if (window.DM) {                
        init_trackLibrary();
        init_mixer();
    } else {
        $("#sounds-panel .sidebar-panel-header").append(masterVolumeSlider());
    }
}

export default init;
