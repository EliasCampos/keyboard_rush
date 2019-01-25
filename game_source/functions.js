function elt(tagName, properties, ...children) {
    let dom = document.createElement(tagName);
    Object.assign(dom, properties);
    for (let child of children) {
        if (typeof child === 'string') {
            dom.appendChild(document.createTextNode(child));
        } else dom.appendChild(child);
    }
    return dom;
}

function renderAudios(linksObj, type = 'wav', looped = false) {
    let musicTracks = {},
    musicContainer = elt('div', {className:"audio"});
    for (let name in linksObj) {
        musicTracks[name] = elt('audio', null, 
            elt('source', {
                type:`audio/${type}`, 
                src:linksObj[name]
            }));
        if (looped) musicTracks[name].setAttribute('loop', true);
        musicContainer.appendChild(musicTracks[name]);
    }
    document.body.appendChild(musicContainer);
    return musicTracks;
}

function prettyTime(msecs, intervals) {
    let str = "", num;
    intervals.forEach(interv => {
        num = Math.floor(msecs / interv);
        str += num < 10 ? ":0"+num : ":"+num;
        msecs = msecs % interv;
    });
    return str.substr(1);
}
function delay(time) {
    return new Promise(reslv => setTimeout(reslv, time));
}