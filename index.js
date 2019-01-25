const GAME_CONSTS = {
    fieldWidth: 800, // px
    fieldHeigth: 600, //  TODO: Set adoptable size (if possible!)
    sessionBeginDelay: 3000 // msec
}
const MUSIC_LINKS = {
    menu:"music/menu.mp3",
    game:"music/game.mp3"
}


let myGame = new Game(); 
runGame(myGame);

async function runGame(game) {
    let {fieldWidth, fieldHeigth, sessionBeginDelay} = GAME_CONSTS;
    let music = renderAudios(MUSIC_LINKS, 'mp3', true);
    let newField = new Field(fieldWidth, fieldHeigth);

    try {await music["menu"].play();} 
    catch (error) {console.error(error.message)} // WARNING: Autoplay is not allowed until user will not interact with page
    await game.beginGame(newField);
    await music["menu"].pause();

    while (true) {
        try {
            music["game"].load();
            await music["game"].play();
            await delay(sessionBeginDelay); // It's 
        } catch (err) {console.error(err.message)} 
        let result = await game.runSession();
        await music["game"].pause();
        await game.sessionResults(result);
    }
    //-Note: table is not supposed to be here !!!
    // TODO: make .table property of game, and handle it instead separate variable
} 