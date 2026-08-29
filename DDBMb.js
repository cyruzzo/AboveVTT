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
            if (message && typeof message === 'object' && message.type == 'resize') {
                await originalPostMessage.call(worker, message, transfer);
                // Need to do this due to a DDB bug that causes an infinite loop that hurts lower end pcs performance
                // We reset the props after resizing the window since on resize DDB resets frameloop to 'always' 
                // Without resizing the window it stays 'demand' but we force resize events
                // This bug exists on base DDB without AboveVTT but being in AVTT makes it worse on performance
                setTimeout(()=>{worker.postMessage({"type": "props", "payload": { "dpr": 1, "frameloop": `${name.includes('physics') ? 'never' : 'demand'  }` }})}, 60);
                return;
            }
            return originalPostMessage.call(worker, message, transfer);
        };
        window.ActiveWorkers[scriptURL] = worker;
        return worker;
    };

    //for listening to the game log websocket and intercepting messages for the DDB onmessage function
    const originalAddEventListener = WebSocket.prototype.addEventListener;
    WebSocket.prototype.addEventListener = function (type, listener, options) {
        const isGameLog = this.url && this.url.toLowerCase().includes('game-log-api-live');
        if (type === 'message' && isGameLog) {
            const interceptor = (event) => {
                if (event.data && event.data !== 'pong') {
                    try {
                        if (window.diceRoller && typeof window.diceRoller.ddbonmessage === 'function') {
                            window.diceRoller.ddbonmessage(event);
                        }
                    } catch (err) {
                        console.error('Error in WS interceptor:', err);
                    }
                }
            };

            originalAddEventListener.call(this, 'message', interceptor, options);
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
})()
