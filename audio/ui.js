import { trackLibrary } from './track.js';
import { Channel } from './mixer.js';
import { log } from './helpers.js';

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
        let youtube_section= $("<li class='audio-row'></li>");;    
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
        Object.entries(channels).forEach(([id, channel]) => {
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
                    if($('.sequential-button').hasClass('pressed')){
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
            });

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


            $(item).append(channelNameDiv, window.MIXER.channelVolumeSlider(id), channel_play_pause, loop, remove, window.MIXER.channelProgressBar(id));

            mixerChannels.append(item);
        });
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
    addPlaylistButton.off().on("click", function(){
        playlistFields.css("height", "25px");
    });
    cancelButton.off().on("click", function(){
        playlistFields.css("height", "0px");
    });
    okButton.off().on("click", function(){
        playlistFields.css("height", "0px");
        if(playlistName.val() != ''){
            window.MIXER.addPlaylist(playlistName.val());
        }
        playlistName.val('');
    });
    playlistFields.append(playlistName, okButton, cancelButton);
    let removePlaylistButton = $('<button id="remove-playlist">Remove Playlist</button>');

    removePlaylistButton.off().on('click', function(e){
        window.MIXER.deletePlaylist(window.MIXER.selectedPlaylist());
    });

    let clear = $('<button class="mixer-clear-button"></button>');
    let clear_svg = $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M3 16V14H10V16ZM3 12V10H14V12ZM3 8V6H14V8ZM14.4 22 13 20.6 15.6 18 13 15.4 14.4 14 17 16.6 19.6 14 21 15.4 18.4 18 21 20.6 19.6 22 17 19.4Z"/></svg>`);
    clear.append(clear_svg);
    clear.on('click', function(){window.MIXER.clear()});

    let sequentialPlay = $('<button class="sequential-button"></button>');
    let sequential_svg = $(`<span class="material-symbols-outlined">format_list_numbered_rtl</span>`)
    sequentialPlay.append(sequential_svg);
    sequentialPlay.on('click', function(){
        if(sequentialPlay.hasClass('pressed')){
            sequentialPlay.toggleClass('pressed', false)
        }
        else{

            sequentialPlay.toggleClass('pressed', true)
            let currentlyPlaying = $(`.audio-row[data-id]:not(.tokenTrack) .channel-play-pause-button.playing:not(:first)`)
            if(currentlyPlaying.length>0){
                currentlyPlaying.click();
            }
        }     
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
    $("#sounds-panel .sidebar-panel-header").append(header, playlistInput, addPlaylistButton, removePlaylistButton, playlistFields, masterVolumeSlider(), mixerChannels);
    $('#master-volume').append(clear, sequentialPlay, playPause);
}

function init_trackLibrary() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Track Library";

    const searchTrackLibary = $(`<input type='search' placeholder='Search' style='margin-bottom: 5px; width: 100%;'></input>`)
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

    const addTrack = $(`<button id='addTrack'>Add Track</button>`)
    const importTrackFields = $("<div id='importTrackFields'></div>")
    const trackName = $(`<input class='trackName trackInput' placeholder='Track Name'/>`)
    const trackSrc = $(`<input class='trackSrc trackInput' placeholder='https://.../example.mp3'/>`)
    const okButton = $('<button class="add-track-ok-button">OK</button>');  
    const cancelButton = $('<button class="add-track-cancel-button">X</button>');  
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
        if($('.sequential-button').hasClass('pressed')){
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

    $("#sounds-panel .sidebar-panel-body").append(header, searchTrackLibary, dropBoxbutton, importCSV, addTrack, importTrackFields, trackList);
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
