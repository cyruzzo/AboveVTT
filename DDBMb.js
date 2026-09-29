var DDB_WS_OBJ = null;
var DDB_WS_FORCE_RECONNECT_LOCK = false; // Best effort (not atomic) - ensure function is called only once at a time
var DDB_WS_RETRIES = 0;
var DDB_MAX_RETRIES = 10;
var DDB_RETRY_TIMEOUT;


function showDDBDisconnectWarning(){
    let container = $("#above-vtt-error-message");
    container.remove();
    container = $(`
        <div id="above-vtt-error-message" class="small-error">
        <h2>You have Disconnected from DDBs websocket</h2>
        <div id="error-message-details"><p>You have disconnected from the DDB websocket ${DDB_WS_RETRIES} times.</p><p>This could be caused by a VPN, anti-tracker, adblocker, firewall, school/work network settings, or other extention/program. It may also happen if the tab was in the background too long</p><p>If disconnecting due to an unstable connection you can enable auto reconnect in settings. Note: Auto reconnect won't always connect before rolls come in a you may still miss sending/receiving rolls</p></div>
        <div class="error-message-buttons">
            <button id="reconnect-button">Reconnect</button>
        </div>
        </div>
    `)
    
    $(document.body).append(container);

    $("#reconnect-button").on("click", function(){
        forceDdbWsReconnect();
        container.remove();
    });
}
let ensureTimeout;
let ensureDDBEventsPromise;
const DDB_EVENTS_TIMEOUT = 60000;
//This ensures our events get attached if the message broker loads before this does for some reason

function ensureDDBMessageEvents() {
    if (ensureDDBEventsPromise) {
        return ensureDDBEventsPromise;
    }

    window.ensuringDDBEvents = true;
    ensureDDBEventsPromise = new Promise((resolve) => {
        const startTime = Date.now();
        const finish = (result) => {
            clearTimeout(ensureTimeout);
            resolve(result);
        };

        const ensureMessageEvents = () => {
            const key = Symbol.for('@dndbeyond/message-broker-lib');
            DDB_WS_OBJ = window[key];

            if (DDB_WS_OBJ?.status == 'open') {
                if (window.ddbMbEventsAttached === true) {
                    finish({ status: 'ready' });
                    return;
                }

                const remainingTime = DDB_EVENTS_TIMEOUT - (Date.now() - startTime);
                if (remainingTime <= 0) {
                    finish({ status: 'timeout' });
                    return;
                }

                ensureTimeout = setTimeout(() => {
                    finish(window.ddbMbEventsAttached === true
                        ? { status: 'ready' }
                        : { status: 'reconnecting', messageBroker: DDB_WS_OBJ });
                }, Math.min(5000, remainingTime));
                return;
            }

            const remainingTime = DDB_EVENTS_TIMEOUT - (Date.now() - startTime);
            if (remainingTime <= 0) {
                finish({ status: 'timeout' });
                return;
            }

            ensureTimeout = setTimeout(ensureMessageEvents, Math.min(1000, remainingTime));
        };

        ensureMessageEvents();
    }).then((result) => {
        window.ensuringDDBEvents = false;

        if (result.status == 'ready') {
            console.log("DDB Message broker connected with all events", window.ddbMbEventsAttached);
        } else if (result.status == 'reconnecting') {
            console.warn("DDB Message broker missing event listeners. Connected Events:", window.ddbMbEventsAttached);
            window.ddbMbEventsAttached = false;
            result.messageBroker.reset();
            result.messageBroker.connect();
        } else {
            console.warn(`Timed out waiting ${DDB_EVENTS_TIMEOUT / 1000} seconds for the DDB message broker`);
        }

        return result;
    }).finally(() => {
        ensureDDBEventsPromise = undefined;
    });

    window.ddbMbReady = ensureDDBEventsPromise;
    return ensureDDBEventsPromise;
}

/**
 * Attempts to force DDBs WebSocket to re-connect.
 * @returns Bool false - wasn't able to force / no need
 * @returns Bool true - was able to attempt force reconnec
 */
function forceDdbWsReconnect() {
    try {
        if (DDB_WS_FORCE_RECONNECT_LOCK) {
            console.log("forceDdbWsReconnect is already locked!");
            return false;
        }

        if (window.navigator && !window.navigator.onLine) {
            console.log("No internet connection, cannot re-connect to DDBs WebSocket.");
            return false;
        }

        DDB_WS_FORCE_RECONNECT_LOCK = true;

        const key = Symbol.for('@dndbeyond/message-broker-lib');
        if (key) {
            DDB_WS_OBJ = window[key];
        }

        console.assert(window.ensuringDDBEvents || window.ddbMbEventsAttached === true, 'Not all DDB message broker events are attached.\n• MB Status:', DDB_WS_OBJ.status);
        
        if ((DDB_WS_OBJ && DDB_WS_OBJ.status == 'disconnected')) {
            window.ddbMbEventsAttached = false;
            DDB_WS_OBJ.reset();
            DDB_WS_OBJ.connect();
            DDB_WS_FORCE_RECONNECT_LOCK = false;
            return true;
        }
        DDB_WS_FORCE_RECONNECT_LOCK = false;
        return false;
    } catch(e) {
        console.log("forceDdbWsReconnect error: " + e);
        DDB_WS_FORCE_RECONNECT_LOCK = false;
    }
}


(function() {
    function noisy_log(...message) {
        if (window.enableNoisyLogs != undefined) {
            console.debug(...message);
        }
    }
    //Load this as soon as possible for new dice, gets the workers for the dice 
    const OriginalWorker = window.Worker;
    window.Worker = function(scriptURL, options) {
        const worker = new OriginalWorker(scriptURL, options);
        if(window.ActiveWorkers == undefined) window.ActiveWorkers = {};
        
        const originalPostMessage = worker.postMessage;
        worker.postMessage = async function(message, transfer) {
            let name;
            try{
                name = JSON.parse(options.name).name;
                noisy_log(name, 'worker Messages', message);
            }
            catch(e){
                noisy_log('worker Messages', message);
            }
            if(message && typeof message === 'object'){
                if (message.type == 'resize') {
                    await originalPostMessage.call(worker, message, transfer);
                    // Need to do this due to a DDB bug that causes an infinite loop that hurts lower end pcs performance
                    // We reset the props after resizing the window since on resize DDB resets frameloop to 'always' 
                    // Without resizing the window it stays 'demand' but we force resize events
                    // This bug exists on base DDB without AboveVTT but being in AVTT makes it worse on performance
                    setTimeout(()=>{worker.postMessage({"type": "props", "payload": { "dpr": 1, "frameloop": `${name.includes('physics') ? 'never' : 'demand'  }` }})}, 60);
                    return;
                }
                else if(message.type == 'dice/roll/deferred' && (DDB_WS_FORCE_RECONNECT_LOCK || parseInt(message.payload?.dateTime) + 10000 < Date.now())){
                    return; // ignore old messages if they happen to come in and ignore while trying to reconnect to DDB websocket as DDB resends all dice message on reconnect
                }
            }
            
            return originalPostMessage.call(worker, message, transfer);
        };
        window.ActiveWorkers[scriptURL] = worker;
        return worker;
    };
    window.ddbMbEventsAttached ||= false;
    //for listening to the game log websocket and intercepting messages for the DDB onmessage function
    const originalAddEventListener = WebSocket.prototype.addEventListener;
    const ddbSocketStates = new WeakMap();

    WebSocket.prototype.addEventListener = function (type, listener, options) {
        window.ddbMbEventsAttached ||= false;
        const url = this.url || '';
        const isGameLog = url && url.toLowerCase().includes('game-log-api-live');
        if(isGameLog){
            if(type == 'open' && !ddbSocketStates.has(this)){
                window.ddbMbEventsAttached = true;

                const previousSocket = window.currentDdbWs;
                if (previousSocket && previousSocket !== this) {
                    ddbSocketStates.get(previousSocket)?.cleanup();
                }

                window.currentDdbWs = this;
                const socket = this;
                
                let disconnected = false;
                let pingInterval;
                let pongTimeout;

                const cleanup = function() {
                    socket.removeEventListener("close", closeHandler);
                    socket.removeEventListener("error", errorHandler);
                    socket.removeEventListener("message", messageHandler);
                    clearInterval(pingInterval);
                    clearTimeout(pongTimeout);
                    ddbSocketStates.delete(socket);

                    if (window.currentDdbWs === socket) {
                        window.currentDdbWs = undefined;
                        window.pingDdbMB = undefined;
                    }
                };

                const closeHandler = function() {    
                    if (disconnected) return;
                    disconnected = true; 

                    cleanup();

                    DDB_WS_FORCE_RECONNECT_LOCK = false;
                    if(DDB_RETRY_TIMEOUT != undefined){
                        clearTimeout(DDB_RETRY_TIMEOUT);
                    }	

                    console.log('Attempting reconnect to DDB Websocket');
  
                    DDB_WS_RETRIES++;
                    if(DDB_WS_RETRIES >= DDB_MAX_RETRIES && !get_avtt_setting_value('autoReconnect')){
                        showDDBDisconnectWarning();
                    }	
                    else{
                        DDB_RETRY_TIMEOUT = setTimeout(function() {
                                forceDdbWsReconnect();
                            }, Math.min(10000, 2**DDB_WS_RETRIES*250+Math.random()*100)
                        );
                    }
                };

                const errorHandler = (event) => {
                    console.warn("DDB WebSocket error", event);
                };

                const messageHandler = function(event) {
                    if (event.data === "pong") {
                        clearTimeout(pongTimeout);
                        pongTimeout = undefined;
                        return;
                    }
                    if (event.data) {
                        try {   
                            if (window.diceRoller && typeof window.diceRoller.ddbonmessage === 'function') {
                                window.diceRoller.ddbonmessage(event);
                            }
                        } catch (err) {
                            console.error('Error in WS interceptor:', err);
                        }
                    }
                };
                
                
                socket.addEventListener('close', closeHandler);
                socket.addEventListener('error', errorHandler);
                socket.addEventListener('message', messageHandler);
               
                clearInterval(window.pingDdbMB);
                pingInterval = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ data: "ping" }));
                        clearTimeout(pongTimeout);
                        pongTimeout = setTimeout(() => {
                            if (socket.readyState === WebSocket.OPEN) {
                                socket.close();
                            }
                        }, document.visibilityState === "hidden" ? 60000 : 5000);
                    } 
                }, 240000);
                window.pingDdbMB = pingInterval;
                
                ddbSocketStates.set(socket, { cleanup });
                console.log('DDB websocket connected')
                ensureDDBMessageEvents();
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };



    function interceptRollEvent(e) {
        if(e.button == 2) return;
        const target = $(e.target);
        // allow hit dice and death saves roll to go through ddb for auto heals - maybe setup our own message by put to https://character-service.dndbeyond.com/character/v5/life/hp/damage-taken later
        if (target.closest('.ct-reset-pane__hitdie-manager-dice').length>0 || target.closest('[class*="styles_heading__"]').find('>h2').text().trim().match(/^death saves$/gi))
            return;
        const rollButton = target.closest(`.integrated-dice__container:not('.above-combo-roll'):not('.above-aoe'):not(.avtt-roll-formula-button)`);
        if (!rollButton.length) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        rollDiceButton(e, rollButton[0]);
    }

    window.addEventListener('pointerdown', interceptRollEvent, true);
    
    //for suggesting the browser use dedicated gpu over integrated gpu
    window.__gpuKeepAlive = (function() {
        const glCanvas = document.createElement('canvas');
        return glCanvas.getContext('webgl', { powerPreference: 'high-performance' }) || glCanvas.getContext('experimental-webgl', { powerPreference: 'high-performance' });
    })();

    // this prevents peformance issues due to facebook scripts taking several hundred ms to execute every click event cloging up main thread
    window.fbq = function () {
     window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
    };
    window.fbq.queue = window.fbq.queue || [];
    window.fbq.loaded = true;
    window.fbq.push = window.fbq;

    Object.defineProperty(window, 'fbq', {
        configurable: false,
        writable: false,
        value: window.fbq
    });


    ensureDDBMessageEvents();
})()
