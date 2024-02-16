const PRE = "AboveVTT"
const SUF = "MEET"
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let local_stream;
let screenStream;
window.videoPeer = null;
window.currentPeers = [];
let screenSharing = false;


function setLocalStream(stream) {

    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream, peerId) {

    let video = $(`.remote-video#${peerId}`);
    video.remove()

    video = $(`<video controls class='remote-video' id='${peerId}'></video>`)
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

        window.currentPeers.push(call);
    })
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
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
   
    });


    $('select#videoSource').off('change.videoSource').on('change.videoSource', function(){
         getMediaDevice();
    })
    $('select#audioSource').off('change.videoSource').on('change.videoSource', function(){
         getMediaDevice();     
    })


    
}
function getMediaDevice(){
    let audioDeviceNotAvailable = $('#audioSource').val() == '';
    let videoDeviceNotAvailable = $('#videoSource').val() == '';

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

           
        window.MB.sendMessage("custom/myVTT/videoPeerConnect", {id: window.myVideoPeerID});              
        
    }, (err) => {
        console.log(err)
    })
}
function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }
        if (window.videoPeer) {
            for(let i in window.currentPeers){
                let sender = window.currentPeers[i].peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                })
                sender.replaceTrack(videoTrack)
                screenSharing = true
            }
            setLocalStream(stream)
           
        }
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (window.videoPeer) {
        for(let i in window.currentPeers){
            let sender = window.currentPeers[i].peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
        }
        setLocalStream(stream)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
}