(function() {
    function noisy_log(...message) {
        if (window.enableNoisyLogs != undefined) {
            console.debug(...message);
        }
    }
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
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = function (url, protocols) {
        const ws = new NativeWebSocket(url, protocols);

        if (url.includes('game-log-api-live.dndbeyond.com')) {          
            ws.addEventListener('message', (event) => {
                try {
                    window.MB.onmessage(event);
                } catch (e) {
                    console.log('Raw message:', event.data);
                }
            });
        }
        return ws;
    };
    Object.assign(window.WebSocket, NativeWebSocket);
})()