setTimeout(function(){
    const queryString = window.location.search;
    const querys = new URLSearchParams(queryString);
    const src = querys.get('src');
    document.getElementById('targetFrame').src = src;
}, 500)