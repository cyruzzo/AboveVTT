changeSrc();

function changeSrc(){
    const targetFrame = document.getElementById('targetFrame');
    const queryString = window.location.search;
    const querys = new URLSearchParams(queryString);
    const src = querys.get('src');
    const allowedDomains = ['abovevtt.com', 'www.abovevtt.com'];
    let url;
    try {
        url = new URL(src, window.location.origin);
    } catch (e) {
        return;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return;
    }
    if (!allowedDomains.includes(url.hostname)) {
        return;
    }
    targetFrame.src = url.toString();
}
