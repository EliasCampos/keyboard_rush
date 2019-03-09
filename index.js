const GAME_CONSTS = {

  // size in pixels (px)
  fieldWidth: 800,
  fieldHeigth: 600,
  // time in miliseconds (msec)
  sessionBeginDelay: 2500
}
const MUSIC_LINKS = {
  menu:"music/menu.wav",
  game:"music/game.wav"
}

document.addEventListener('DOMContentLoaded', run);

async function run() {
  let game = new Game();
  let {fieldWidth, fieldHeigth, sessionBeginDelay} = GAME_CONSTS;
  let music = renderAudios(MUSIC_LINKS, 'wav', true);
  let newField = new Field(fieldWidth, fieldHeigth);

  try {await music["menu"].play();}
  /* Some browsers does not allow play media
  until user will not interact with page */
  catch (error) {console.error(error.message)}

  await game.beginGame(newField);
  await music["menu"].pause();

  while (true) {
    try {
      music["game"].load();
      await music["game"].play();
      await delay(sessionBeginDelay);
    } catch (err) {console.error(err.message)}
    let result = await game.runSession();
    await music["game"].pause();
    await game.sessionResults(result);
  }
}
