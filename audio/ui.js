import { trackLibrary } from './track.js';
import { mixer, Channel } from './mixer.js';
import { log } from './helpers.js';

/**
 *
 * @returns {HTMLDivElement}
 */
function masterVolumeSlider() {
    const div = document.createElement("div");
    div.textContent = "Master Volume";
    div.className = "audio-row";
    div.append(mixer.masterVolumeSlider());

    return div;
}

function init_mixer() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Mixer";

    // mixer channels
    const mixerChannels = document.createElement("ul");
    mixerChannels.id = 'mixer-channels';

    /** @param {Object.<string, Channel>} */
    const drawChannelList = (channels) => {
        mixerChannels.innerHTML = "";
        /** @type {Object.<string, Channel>} */
        Object.entries(channels).forEach(([id, channel]) => {
            const item = document.createElement("li");
            item.className = "audio-row";
            item.textContent = channel.name;
            item.setAttribute("data-id", id);

            //item.append(mixer.channelVolumeSlider(id), mixer.channelProgressBar(id));

            // repeat button
            let loop = $('<button class="channel-loop-button" style="font-size:10px;"></button>');
            let loop_svg = $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M7 22 3 18 7 14 8.4 15.45 6.85 17H17V13H19V19H6.85L8.4 20.55ZM5 11V5H17.15L15.6 3.45L17 2L21 6L17 10L15.6 8.55L17.15 7H7V11Z"/></svg>`);
            loop.append(loop_svg);
            loop.on('click', /*set repeat*/);

            // play/pause button
            let channel_play_pause = $('<button class="channel-play-pause-button" style="font-size:10px;"></button>');
            let play_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M8 19V5L19 12ZM10 12ZM10 15.35 15.25 12 10 8.65Z"/></svg>');
            let pause_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M14 19V5H18V19ZM6 19V5H10V19Z"/></svg>');
            
            channel_play_pause.append(play_svg);

            /*Activate Swap button when channel.paused

            channel_play_pause.append(pause_svg );
            if(channel.paused) {
                play_svg.css('display', 'block');
                pause_svg.css('display', 'none');
                channel_play_pause.toggleClass('playing', false);
            }
            else {
                pause_svg.css('display', 'block');
                play_svg.css('display', 'none');
                channel_play_pause.toggleClass('playing', true);
            }
                
            channel_play_pause.append(play_svg);
            channel_play_pause.append(pause_svg);

            channel_play_pause.on('click', function(){
                if(channel.paused) {
                    mixer_playlist_svg.css('display', 'block');
                    pause_svg.css('display', 'none');
                    playPause.toggleClass('playing', false);
                }
                else {
                    pause_svg.css('display', 'block');
                    mixer_playlist_svg.css('display', 'none');
                    playPause.toggleClass('playing', true);
                }
            });*/
            $(item).append(mixer.channelVolumeSlider(id), channel_play_pause, loop, mixer.channelProgressBar(id));

            mixerChannels.append(item);
        });
    }
    drawChannelList(mixer.channels())
    mixer.onChannelListChange((e) => drawChannelList(e.target.channels()));

    // clear button

  /*  const clear = document.createElement("button");
    clear.textContent = 'Clear';
    clear.onclick = () => mixer.clear();

    // play/pause button
    const playPause = document.createElement("button");
    playPause.onclick = () => mixer.togglePaused();

    /** @param {bool} */
    const drawPlayPause = (paused) => playPause.textContent = paused ? "Play" : "Pause";
    drawPlayPause(mixer.paused);
    mixer.onPlayPause((e) => drawPlayPause(e.target.paused));*/


    let clear = $('<button class="mixer-clear-button"></button>');
    let clear_svg = $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M3 16V14H10V16ZM3 12V10H14V12ZM3 8V6H14V8ZM14.4 22 13 20.6 15.6 18 13 15.4 14.4 14 17 16.6 19.6 14 21 15.4 18.4 18 21 20.6 19.6 22 17 19.4Z"/></svg>`);
    clear.append(clear_svg);
    clear.on('click', function(){mixer.clear()});

    // play/pause button
    let playPause = $('<button class="mixer-play-pause-button" style="font-size:10px;"></button>');
    let mixer_playlist_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M2.5 8V6H14.5V8ZM2.5 12V10H14.5V12ZM2.5 16V14H10.5V16ZM15.5 21V13L21.5 17Z"/></svg>');
    let pause_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M14 19V5H18V19ZM6 19V5H10V19Z"/></svg>');
    if(mixer.paused) {
        mixer_playlist_svg.css('display', 'block');
        pause_svg.css('display', 'none');
        playPause.toggleClass('playing', false);
    }
    else {
        pause_svg.css('display', 'block');
        mixer_playlist_svg.css('display', 'none');
        playPause.toggleClass('playing', true);
    }
        
    playPause.append(mixer_playlist_svg);
    playPause.append(pause_svg);

    playPause.on('click', function(){
        mixer.togglePaused();
        if(mixer.paused) {
            mixer_playlist_svg.css('display', 'block');
            pause_svg.css('display', 'none');
            playPause.toggleClass('playing', false);
        }
        else {
            pause_svg.css('display', 'block');
            mixer_playlist_svg.css('display', 'none');
            playPause.toggleClass('playing', true);
        }
    });
        
    $("#sounds-panel .sidebar-panel-header").append(header, masterVolumeSlider(), mixerChannels, clear, playPause);
}

function init_trackLibrary() {
    // header
    const header = document.createElement("h3");
    header.textContent = "Track Library";

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

    // track list
    const trackList = document.createElement("ul");
    trackList.id = 'track-list';
    trackLibrary.onchange((e) => {
        trackList.innerHTML = "";
        /** @type {typeof trackLibrary}  */
        const tl = e.target;
        tl.map().forEach((track, id) => {
            const item = document.createElement("li");
            item.textContent = track.name;
            item.className = "audio-row";
            item.setAttribute("data-id", id);

   /*         const play = document.createElement('button');
            play.textContent = 'Play';
            play.onclick = () => {
                const channel = new Channel(track.name, track.src);
                channel.paused = false;
                channel.loop = true;
                mixer.addChannel(channel);
            };
            item.appendChild(play);
            trackList.append(item);
        });
    });
*/

            // play button
            let track_play_button = $('<button class="track-play-pause-button"></button>');          
            let play_svg = $('<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M8 19V5L19 12ZM10 12ZM10 15.35 15.25 12 10 8.65Z"/></svg>');               
            track_play_button.append(play_svg);


            track_play_button.on('click', function(){
                const adhocStagedTrack = new StagedTrack(id);
                adhocStagedTrack.autoplay = true;
                adhocStagedTrack.loop = true;
                mixer.addChannel(adhocStagedTrack.toChannel());
            });

            $(item).append(track_play_button); 
            trackList.append(item);
        });
    });


    trackLibrary.dispatchEvent(new Event('onchange'));

    $("#sounds-panel .sidebar-panel-body").append(header, importCSV, trackList);
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
