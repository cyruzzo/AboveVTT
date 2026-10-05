//This is needed to resolve redirects that DDB has going through dndbeyond.com instead of www.dndbeyond.com for importing scenes. 
//Otherwise it gets blocked due to cross origin redirects. 
// This currently only affects 1 or 2 books and may by a mistaken redirect link on DDBs end
const avttRuntime = (typeof browser != 'undefined' ? browser : chrome).runtime;

avttRuntime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== 'avtt-resolve-url') return;
    let url;
    try {
        url = new URL(msg.url);
    } catch {
        sendResponse({ error: 'invalid url' });
        return;
    }
    if (url.protocol !== 'https:' || !/(^|\.)dndbeyond\.com$/.test(url.hostname)) {
        sendResponse({ error: 'host not allowed' });
        return;
    }
    fetch(url.href, { credentials: 'include' })
        .then(response => sendResponse({ url: response.url }))
        .catch(error => sendResponse({ error: error.message }));
    return true;
});
