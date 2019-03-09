function elt(tagName, properties, ...children) {
  /*
  Returns a new dom element by tag name, with given properties.
  It contains children, and child also could be a string.
  */
  let dom = document.createElement(tagName);
  Object.assign(dom, properties);
  for (let child of children) {
    if (typeof child === 'string') {
      dom.appendChild(document.createTextNode(child));
    } else dom.appendChild(child);
  }
  return dom;
}

function renderAudios(linksObj, type = 'wav', looped = false, volume = 0.5) {
  /*
  Return object with values, contains html audio elements
  and keys, call purposes of given audio elements
  */
  let musicTracks = {},
  musicContainer = elt('div', {className:"audio"});
  for (let name in linksObj) {
    musicTracks[name] = elt('audio', null,
      elt('source', {
        type:`audio/${type}`,
        src:linksObj[name]
      }));
    musicTracks[name].volume = volume;
    if (looped) musicTracks[name].setAttribute('loop', true);
    musicContainer.appendChild(musicTracks[name]);
  }
  document.body.appendChild(musicContainer);
  return musicTracks;
}

function prettyTime(msecs, intervals) {
  /*
  Return time string in format 'xx:xx:xx'
  */
  let str = "", num;
  intervals.forEach(interv => {
    num = Math.floor(msecs / interv);
    str += num < 10 ? ":0"+num : ":"+num;
    msecs = msecs % interv;
  });
  return str.substr(1);
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
