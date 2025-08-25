changeSrc();

function changeSrc(){
    const targetFrame = document.getElementById('targetFrame');
    const queryString = window.location.search;
    const querys = new URLSearchParams(queryString);
    const src = querys.get('src');
    targetFrame.src = src;
}
