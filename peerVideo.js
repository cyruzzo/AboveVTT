const PRE = "AboveVTT"
const SUF = "MEET"
var room_id;
var screenStream;
window.videoPeer = null;
window.currentPeers = [];
var screenSharing = false;

function init_peerVideo_box() {


    peerVideo_box = $(`  
        <div class="peervideo-entry-modal" id="peervideo-entry-modal">
            <div class="video-meet-area">

                <!-- Local Video Element-->
                <video controls id="local-video"></video>
                <div class="meet-controls-bar">
                    <button id="startScreenShare" onclick="startScreenShare()">Screen Share</button>
                    <button id="peerVideo_close" class="hasTooltip button-icon" data-name="Disconnect">
                        <span class="material-icons button-icon">
                            cancel
                        </span>
                    </button>
                    <button id="peerVideo_mute_mic" class="hasTooltip button-icon" data-name="muteMic">
                        <span class="material-symbols-outlined button-icon">
                        </span>
                    </button>
                    <button id="peerVideo_echo_cancel" class="hasTooltip button-icon" data-name="echoCancellation">Echo Cancellation</button>
                    <button id="peerVideo_noise_sup" class="hasTooltip button-icon" data-name="noiseSuppression">Noise Suppression</button>
                    <select id="videoSource" style='width:100px'></select>
                    <select id="audioSource" style='width:100px'></select>
                </div>
            </div>
        </div>
    `)




    
    peerVideo_box.css("z-index", "100");

    $("#site").append(peerVideo_box);
    

    
    $("#peerVideo_switch").css("position", "absolute").css("top", 0).css("left", 0);



    joinRoom();
   

    $("#peerVideo_mute_mic").off('click.mute').on('click.mute', function(){
        $(this).toggleClass('muted');
        window.myLocalVideostream.getAudioTracks()[0].enabled = !$(this).hasClass('muted');
    });
    $("#peerVideo_echo_cancel").off('click.echo').on('click.echo', function(){
        $(this).toggleClass('enabled');
        getMediaDevice();  
    });
    $("#peerVideo_noise_sup").off('click.noise').on('click.noise', function(){
        $(this).toggleClass('enabled');
        getMediaDevice();  
    });

    $("#peerVideo_close, #peerVideo_mute_mic").css("float", 'right')

    $("#peerVideo_close").off('click.videoClose').on('click.videoClose', 
        function () {       
            if(window.myLocalVideostream != undefined){
                window.myLocalVideostream.getTracks().forEach(function(track) {
                    track.stop();
                    window.myLocalVideostream.removeTrack(track);
                });
            }
            
                
            window.MB.sendMessage("custom/myVTT/videoPeerDisconnect", {id: window.videoPeer.id})
            window.videoPeer.destroy();
            $("#peervideo-entry-modal").remove();
            create_peerVideo_button();
        }
    );

}

function create_peerVideo_button() {

    b = $("<div id='peerVideo_switch' class='hasTooltip button-icon hideable ddbc-tab-options--layout-pill' data-name='Connect video call'><div class='ddbc-tab-options__header-heading'><span>VIDEO</span><span class='material-icons button-icon' style='margin: -3px 0px -3px 3px'>video_call</span></div></div>");
    b.css("position", "fixed");
    b.css("bottom", "3px");
    b.css("left", "3px");
    b.css("gap", "6px");
    b.css("display", "inline-flex");
    b.css("z-index", 9999);
    $("body").append(b);

    b.click(function () {
        $(this).remove();
        init_peerVideo_box();
        reposition_player_sheet();
    });
}
function setLocalStream(stream) {

    let video = document.getElementById("local-video");
    let tokenImage;
    if(window.DM){
        tokenImage = `url(${dmAvatarUrl})`
    }
    else{
        let token = $(`#tokens .token[data-id*='/characters/${window.PLAYER_ID}'] img.token-image`);

        if(token.length>0){
            tokenImage = `url(${token.attr('src')})`;
        }
        else{
           let pc = window.pcs.filter(d=> d.sheet.endsWith(PLAYER_ID))
           tokenImage = `url(${pc[0].image})`;;
        }        
    }

    $(video).css('--token-image', tokenImage);
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream, peerId) {

    let video = $(`.remote-video#${peerId}`);
    video.remove()
    let tokenImage;
    if(peerId == room_id){
        tokenImage = `url(${dmAvatarUrl})`
    }
    else{
        let tokenId = peerId.replace(/[a-zA-Z]+/g, '');
        let token = $(`#tokens .token[data-id*='/characters/${tokenId}'] img.token-image`);

        if(token.length>0){
            tokenImage = `url(${token.attr('src')})`;
        }
        else{
           let pc = window.pcs.filter(d=> d.sheet.endsWith(tokenId))
           tokenImage = `url(${pc[0].image})`;;
        }        
    }

    video = $(`<video controls class='remote-video' id='${peerId}'></video>`)
    $(video).css('--token-image', tokenImage);
    $(`.video-meet-area`).append(video)
    
    video[0].srcObject = stream;
    video[0].play();
}


function joinRoom(room = window.gameId) {
    console.log("Joining Room")
    room_id = PRE + room + SUF;
    player_id = PRE + window.PLAYER_ID + SUF;
  
    if(window.DM)
        player_id = room_id;
    if(window.videoPeer != null){
        window.videoPeer.disconnect();
        window.videoPeer.destroy();
    }
    window.videoPeer = new Peer(player_id);
    if(window.videoConnectedPeers == undefined){
        window.videoConnectedPeers = [player_id];
    }
    window.videoPeer.on('open', (id) => {
        console.log("Connected with Id: " + id)
        window.myVideoPeerID = id;   
        getMediaDevice();
    })
    window.videoPeer.on('call', (call) => {
        call.answer(window.myLocalVideostream);
        call.on('stream', (stream) => {
            window.videoConnectedPeers.push(room_id);
            setRemoteStream(stream, call.peer)
            call.on('close', () => {
                $(`.video-meet-area video#${call.peer}`).remove();
            })
        })
        window.currentPeers = window.currentPeers.filter(d=> d.peer != call.peer)
        window.currentPeers.push(call);
    })
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        let option = $(`<option value='disable'>Disable Camera</option>`);

        $('select#videoSource').append(option);
        for(let i = 0; i < devices.length; i ++){
            let device = devices[i];
            if (device.kind === 'videoinput') {
                let option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || 'camera ' + (i + 1);
                document.querySelector('select#videoSource').appendChild(option);
            }
            if (device.kind === 'audioinput') {
                let option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || 'microphone ' + (i + 1);
                document.querySelector('select#audioSource').appendChild(option);
            }
        };
        
        if($('#audioSource').val() == '' || $('#videoSource option:nth-of-type(2)').val() == '' || $('#audioSource').val() == null || $('#videoSource option:nth-of-type(2)').val() == null){
            alert('It appears your camera and/or microphone permissions are disabled for dndbeyond. Please enable these in your browser settings and refresh. Alternatively you are missing a video and/or audio input device.')
        }
    });


    $('select#videoSource').off('change.videoSource').on('change.videoSource', function(){
        getMediaDevice();
    })
    $('select#audioSource').off('change.videoSource').on('change.videoSource', function(){
        getMediaDevice();     
    })


    
}
function getMediaDevice(){
    let audioDeviceNotAvailable = $('select#audioSource').val() == '' || $('select#audioSource').val() == null;
    let videoDeviceNotAvailable = $('select#videoSource').val() == '' || $('select#videoSource').val() == null || $('select#videoSource').val() == 'disable';
    let micVolume = $("#peerVideo_mute_mic").hasClass('muted') ? 0.0 : 1.0;
    let echoCancel = $("#peerVideo_echo_cancel").hasClass('enabled') ? true : false
    let noiseSuppression = $("#peerVideo_noise_sup").hasClass('enabled') ? true : false

    let videoConditions = videoDeviceNotAvailable ? false : {
        deviceId: {
            exact: $('select#videoSource').val()
        },   
        width: {
            ideal: 854
        },
        height: {
            ideal: 480
        },
        frameRate: 25,
        aspectRatio: {
            ideal: 854 / 480,
        }
    }
    let audioConditions = audioDeviceNotAvailable ? false : {
        deviceId: {
            exact: $('select#audioSource').val()
        },
        volume: micVolume,
        sampleSize: 16,
        channelCount: 2,
        echoCancellation: echoCancel,
        noiseSuppression: noiseSuppression  
    }
    navigator.mediaDevices.getUserMedia(
        { 
            video: videoConditions, 
            audio: audioConditions,
        }).then( (stream) => {
        window.myLocalVideostream = stream;
        window.myLocalVideostream.getAudioTracks()[0].enabled = !$("#peerVideo_mute_mic").hasClass('muted');
        setLocalStream(window.myLocalVideostream)
        if(window.currentPeers.length == 0){
            window.MB.sendMessage("custom/myVTT/videoPeerConnect", {id: window.myVideoPeerID});  
        }
        else{
            for(let i in window.currentPeers){
              let call = window.videoPeer.call(window.currentPeers[i].peer, window.myLocalVideostream)
              call.on('stream', (stream) => {
                setRemoteStream(stream, call.peer);   
                call.on('close', () => {
                    $(`.video-meet-area video#${call.peer}`).remove();
                })   
              })
            }
        }   
        
    }).catch((err) => {
        console.log(err)
    })
}
function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    screenSharing = true;

    let audioDeviceNotAvailable = $('select#audioSource').val() == '' || $('select#audioSource').val() == null;
    let micVolume = $("#peerVideo_mute_mic").hasClass('muted') ? 0.0 : 1.0
    let audioConditions = audioDeviceNotAvailable ? false : {
        deviceId: $('select#audioSource').val(),
        volume: micVolume,
        sampleSize: 16,
        channelCount: 2,
        echoCancellation: false,
        noiseSuppression: false  
    }
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true}).then((stream) => {
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }

        screenStream.addTrack(window.myLocalVideostream.getAudioTracks()[0])
        for(let i in window.currentPeers){
          let call = window.videoPeer.call(window.currentPeers[i].peer, screenStream)
          call.on('stream', (stream) => {
            setRemoteStream(stream, call.peer);   
            call.on('close', () => {
                $(`.video-meet-area video#${call.peer}`).remove();
            })   
          })
        }
        setLocalStream(screenStream)
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    
    getMediaDevice();
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });

}