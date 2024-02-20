const PRE = "AboveVTT"
const SUF = "MEET"
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let screenStream;
window.videoPeer = null;
window.currentPeers = [];
let screenSharing = false;


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
                $(`video#${call.peer}`).remove();
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
            alert('It appears your permissions for camera/microphone are set to disabled on dndbeyond please enable these and refresh. Alternatively you are missing a video and/or audio input device.')
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

    let videoConditions = videoDeviceNotAvailable ? false : {
        deviceId: {
                exact: $('select#videoSource').val()
        },   
        width: {
            exact: 854
        },
        height: {
            exact: 480
        },
        frameRate: 25,
        aspectRatio: {
            exact: 854 / 480,
        }
    }
    let audioConditions = audioDeviceNotAvailable ? false : {
        deviceId: {
            exact: $('select#audioSource').val()
        }    
    }
     getUserMedia(
        { 
            video: videoConditions, 
            audio: audioConditions,
        }, (stream) => {
        window.myLocalVideostream = stream;

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
                    $(`video#${call.peer}`).remove();
                })   
              })
            }
        }   
        
    }, (err) => {
        console.log(err)
    })
}
function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    screenSharing = true;

    let audioDeviceNotAvailable = $('select#audioSource').val() == '' || $('select#audioSource').val() == null;
    let audioConditions = audioDeviceNotAvailable ? false : {
        deviceId: $('select#audioSource').val() 
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
                $(`video#${call.peer}`).remove();
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