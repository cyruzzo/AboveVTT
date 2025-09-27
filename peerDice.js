const DICEPRE = "AboveVTT"
const DICESUF = "DICE"
var diceroom_id;
var dicescreenStream;
var diceplayer_id
window.diceVideoPeer = null;
window.diceCurrentPeers = [];

const diceStreamThrottle = throttle((callback) =>{requestAnimationFrame(callback)}, 1000/16)

function setDiceRemoteStream(stream, peerId) {

    let video = $(`.remote-dice-video#${peerId}`);
    video.remove();

    $(`#streamer-canvas-${peerId}`).remove();

    video = $(`<video class='remote-dice-video' id='${peerId}'></video>`)
    $(`body`).append(video);
    
    video[0].srcObject = stream;
    video[0].play();


    let dicecanvas=$(`<canvas width='${video[0].videoWidth}' height='${video[0].videoHeight}' class='streamer-canvas' />`);
    dicecanvas.attr("id","streamer-canvas-"+peerId);
    //dicecanvas.css("opacity",0.5);
    let sidebarWidth = $("#hide_rightpanel").hasClass("point-left") ? 0 : 340;
 
    dicecanvas.css({
        "position": "fixed",
        "max-width": "calc(100% - var(--sidebar-width, 340px))",
        "top" : "50%",
        "left": "calc(50% - calc(var(--sidebar-width, 340px) / 2))",
        "transform": "translate(-50%,-50%)",
        "z-index": 60000,
        "touch-action": "none",
        "pointer-events": "none",
        "filter": "drop-shadow(-16px 18px 15px black)",
        "clip-path": "inset(2px 2px 2px 2px)"
    });

    $("#site").append(dicecanvas);
    
    
    window.MB.sendMessage("custom/myVTT/whatsyourdicerolldefault", {
        to: peerId,
        from: diceplayer_id
    });
    
    let canvas=dicecanvas.get(0);
    let ctx=canvas.getContext('2d');
    let tmpcanvas = new OffscreenCanvas(0, 0);
    let tmpctx = tmpcanvas.getContext("2d");
    
    video.off('resize.dice').on("resize.dice", function(){
        let videoAspectRatio = video[0].videoWidth / video[0].videoHeight
        sidebarWidth = $("#hide_rightpanel").hasClass("point-left") ? 0 : 340;

        if (video[0].videoWidth > video[0].videoHeight)
        {
            tmpcanvas.width = Math.min(video[0].videoWidth, window.innerWidth - sidebarWidth);
            tmpcanvas.height = Math.min(video[0].videoHeight, (window.innerWidth - sidebarWidth) / videoAspectRatio);       
        }
        else {
            tmpcanvas.width = Math.min(video[0].videoWidth, window.innerHeight / (1 / videoAspectRatio));
            tmpcanvas.height = Math.min(video[0].videoHeight, window.innerHeight);     
        }
        dicecanvas.attr("width", tmpcanvas.width + "px");
        dicecanvas.attr("height", tmpcanvas.height  + "px");
        dicecanvas.css("height",tmpcanvas.height);
        dicecanvas.css("width",tmpcanvas.width );
    });

    let lastTime = 0
    let sameFrameCount = 0;
    let updateCanvas=function(){
        if(tmpcanvas.width<=0){
            diceStreamThrottle(updateCanvas);
            return;
        }
        if (video[0].currentTime == lastTime) 
            sameFrameCount++;
        else 
            sameFrameCount = 0;
        
        if (sameFrameCount > 10) {
            ctx.clearRect(0, 0, tmpcanvas.width, tmpcanvas.height);
        }
        else {
            lastTime = video[0].currentTime;
            tmpctx.drawImage(video[0], 0, 0, tmpcanvas.width, tmpcanvas.height);

            const frame = tmpctx.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);

            for (let i = 0; i < frame.data.length; i += 4) {
                const red = frame.data[i + 0];
                const green = frame.data[i + 1];
                const blue = frame.data[i + 2];
                if ((red < 24) && (green < 24) && (blue < 24))
                    frame.data[i + 3] = 128;
                if ((red < 8) && (green < 8) && (blue < 8))
                    frame.data[i + 3] = 0;
            }
            ctx.putImageData(frame, 0, 0);
        }
        diceStreamThrottle(updateCanvas);
    }

    diceStreamThrottle(updateCanvas);

}
function hideDiceVideo(streamerid) {
    $(`#streamer-canvas-${streamerid}`).toggleClass("hidden", true);
}

function revealDiceVideo(streamerid) {
    $(`#streamer-canvas-${streamerid}`).toggleClass("hidden", false);
}

function joinDiceRoom(room = window.gameId) {
    console.log("Joining Dice Room")
    diceroom_id = DICEPRE + room + DICESUF;
    diceplayer_id = DICEPRE + window.PLAYER_ID + DICESUF;
  
    if(window.DM)
        diceplayer_id = diceroom_id;
    if(window.diceVideoPeer != null){
        window.diceVideoPeer.disconnect();
        window.diceVideoPeer.destroy();
    }
    window.diceVideoPeer = new Peer(diceplayer_id);
    if(window.diceVideoConnectedPeers == undefined){
        window.diceVideoConnectedPeers = [diceplayer_id];
    }
    window.diceVideoPeer.on('open', (id) => {
        console.log("Connected with Id: " + id)
        diceplayer_id = id;   
        getDiceMedia();
    })
    window.diceVideoPeer.on('call', (call) => {
        call.answer(window.MYMEDIASTREAM);
        call.on('stream', (stream) => {
            window.diceVideoConnectedPeers.push(diceroom_id);
            setDiceRemoteStream(stream, call.peer)
            call.on('close', () => {
                $(`video.remote-dice-video#${call.peer}, #streamer-canvas-${call.peer}`).remove();
            })
        })
        window.diceCurrentPeers = window.diceCurrentPeers.filter(d=> d.peer != call.peer)
        window.diceCurrentPeers.push(call);
    })

    window.diceVideoPeer.off('error').on('error', (event) => {
        console.error(`Dice Peer Error event caught: ${event.message}`);
        if(event.message.match(/ID.*is taken/gi)){
            alert("AboveVTT P2P Dice Stream Error: Your Player ID is already connected to the dice stream. You may have another window open logged into the same player or DM view. Please close the other window and try again.");
        }
        $('.stream-dice-button').html("Dice Stream Disabled");
        $('.stream-dice-button').toggleClass("enabled", false);
        window.JOINTHEDICESTREAM = false;
    })    
}
function getDiceMedia(){
    let diceRollPanel = $(".dice-rolling-panel__container");
    window.MYMEDIASTREAM = diceRollPanel[0].captureStream(30)


    if(window.currentPeers.length == 0){
        window.MB.sendMessage("custom/myVTT/diceVideoPeerConnect", {id: diceplayer_id});  
    }
    else{
        for(let i=0; i<window.diceCurrentPeers.length; i++){
          let call = window.diceVideoPeer.call(window.diceCurrentPeers[i].peer, window.MYMEDIASTREAM)
          call.on('stream', (stream) => {
            setDiceRemoteStream(stream, call.peer);   
            call.on('close', () => {
                $(`video.remote-dice-video#${call.peer}, #streamer-canvas-${call.peer}`).remove();
            })   
          })
        }
    }   
        
    
}
