(async function() {
    const extensionRuntime = typeof chrome !== 'undefined' ? chrome.runtime : browser?.runtime;
    const script = document.createElement('script');
    script.src = extensionRuntime.getURL('DDBMb.js');
    script.onload = () => script.remove();
    script.onerror = (e) => console.error('Failed to load loadStart.js', e);
    (document.head || document.documentElement).appendChild(script);
})();



