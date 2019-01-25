/* Global variables: */
const TIME_INTERVALS = [
    //24*60*60*1000, I swear no one will play this whole day...
    60*60*1000,
    60*1000,
    1000
];
/* Classes: */
class Char {
    constructor(text, coordX = 0, coordY = 0, width = 30, height = 50) {
        this.text = text;

        this.width = width;
        this.height = height;

        this.coordX = coordX;
        this.coordY = coordY;

        this.status = "active";
    }
    createDOMNode() {
        let el = elt('span', {className:"char"}, this.text);
        el.style.width = this.width + "px";
        el.style.height = this.height + "px";
        this._dom = el;
    }
    get domNode() {
        return this._dom;
    }
    setDOMStyle(name, value) {
        this._dom.style[name] = value;
    }
    setRandomXCoord(limit) {
        let range = Math.round(limit / this.width);
        this.coordX = this.width * Math.floor(range * Math.random());
        this._dom.style.left = this.coordX + "px";
    }

    newFrame(speed) {
        switch (this.status) {
            case "active":
                this.coordY += speed / 60;
                this._dom.style.top = Math.round(this.coordY) + "px";
                break;
            case "typed":
                this.height -= Char.dyingSpeed / 60;
                this._dom.style.height = Math.round(this.height) + "px";
            case "fallen":
                this.height -= 2 * Char.dyingSpeed / 60;
        }
        return this.height > 2;
    }
    fellDown(field) {
        return this.status != "fallen" 
            && (this.coordY + this.height) > field.height;
    }

    static getRandom() {
        let range = Char.set.length;
        let randomIndx = Math.floor(range * Math.random());
        let randomChar = Char.set[randomIndx];
        return new Char(randomChar);
    }
}
Char.set = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
Char.dyingSpeed = 50 // px/sec;

class Field {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    createDOMNode() {
        let field = elt('div', {className: "main-field"});
        field.style.width = this.width + "px";
        field.style.height = this.height + "px";
        this._domNode = field;
    }
    get domNode() {
        return this._domNode;
    }
    addNode(domEl) {
        this._domNode.appendChild(domEl);
    }
    removeNode(domEl) {
        try {
            this._domNode.removeChild(domEl);
        } catch (error) {
            console.log("Failer to remove domNode in Field:", error.message);
            console.log("Stack trace:", error.stack);
        }
    }
    clearNodes() {
        let child;
        while (child = this._domNode.firstChild) {
            this._domNode.removeChild(child);
        } 
    }

    setInitScreen(mainField) {
        let explainText = `Try to type all keys what you will see
        on the screen until they will fall down to the game field.`;

        let manual = elt('div', {className:"game-explain"},
            elt('p', null, explainText),
            elt('button', 
                {onclick:function(){manual.style.display = 'none'}}, 
                "back to main"));
        manual.style.display = 'none';
        
        let playButton = elt('button', null, "Play");
        let screen = elt('div', {className:"init-screen"},
            manual,
            elt('h2', null, "Keyboard Rush"),
            elt('button', 
                {onclick:function(){manual.style.display = 'block'}}, 
                "manual"),
                playButton);
        
        mainField.appendChild(screen);
        return playButton;
    }
    setDifficultyNode(min, max, step = 10, mainField = this._domNode) {
        let range =  elt('input', {type:"range", name:"difficulty"});
        eval(['min', 'max', 'step'] //-Note: It's better to change this part on some more readeble (but it's my first time of using 'eval' :)
            .reduce((str, attr) => str + `range.setAttribute('${attr}', ${attr});`, ""));
        let node = elt('div', {className:"set-difficulty"},
            elt('label', null, "Change difficulty:"),
            range);
        mainField.appendChild(node);
        return range;
    }
    setTable() {
        let table = elt('table', {className:"game-table"},
            elt('tr', null, 
                elt('td', null, "Time:"),
                elt('td', {className: "game-time"})),
            elt('tr', null, 
                elt('td', null, "Score:"),
                elt('td', {className:"game-score"})),
            elt('tr', null, 
                elt('td', null, "Lifes:"),
                elt('td', {className:"lifes-left"})));
        
        this._domNode.appendChild(table);
        return table;
    }
    setResults(results) {
        let {time, score} = results;
        let button = elt('button', {className:"repeat-button"}, "play again");
        let dom = elt('div', {className:"game-results"},
            elt('h2', null, "Game Over"),
            elt('h3', null, "Your result:"),
            elt('p', null, "Total score:", 
                elt('span', null, ""+score)),
            elt('p', null, "Time:", 
                elt('span', null, ""+time)),
            button);
        this._domNode.appendChild(dom);
        return button;
    }
}
Field.charsPart = 0.8; // Part of gameareas' width occupied for chars flow

class Game {
    constructor(minSpeed = Game.minSpeed/*px/sec*/, lifes = 3) {
        this.minSpeed = minSpeed;
        this.step = (Game.stepRelativeSpeed * 100) / this.minSpeed;

        this.time = 0;
        this.score = 0;
        this.lifes = lifes;
        
        this.speed = minSpeed;
        this.gameStep = 0;
        this.nextCharTime = 0;
        this.presentChars = [];

        this.sounds = renderAudios(Game.SOUND_LINKS);
    }
    updateTable(table) {
        table.querySelector(".game-time")
            .textContent = prettyTime(this.time, TIME_INTERVALS);
    }
    initGameTable() {
        this.table = this.field.setTable();
        this.updateTable(this.table);
        this.table.querySelector(".game-score").textContent = ""+0;
        for (let i = 0; i < this.lifes; i++) {
            this.table.lastChild.lastChild // putting lifes nodes
            .appendChild(elt('div'));
        }

    }
    beginGame(field) {
        return new Promise(resolve => {
            this.field = field;
            field.createDOMNode();
            document.body.appendChild(field.domNode);
            let initButton = field.setInitScreen(field.domNode);
            let difficultyRange = field.setDifficultyNode(
                this.minSpeed, 
                this.minSpeed + Game.speedRange, 
                Game.speedInpStep,
                field.domNode.firstChild);
            const difficultyChange = event => {
                this.speed = +event.target.value;
                this.step = (Game.stepRelativeSpeed * 100) / this.speed;
            }
            const handleButton = () => {
                difficultyRange.removeEventListener('change', difficultyChange);
                initButton.removeEventListener('click', handleButton);
                this.field.clearNodes();
                this.initGameTable();
                resolve();
            }
            difficultyRange.addEventListener('change', difficultyChange);
            initButton.addEventListener('click', handleButton);
        })
    }

    nextStep(initSpeed, initStep) {
        this.gameStep++;
        this.nextCharTime += this.step * 1000;

        let newChar = Char.getRandom();
        this.presentChars.push(newChar);

        newChar.createDOMNode();
        newChar.setRandomXCoord(this.field.width * Field.charsPart);
        this.field.addNode(newChar.domNode);
        
        this.speed += initSpeed * Game.relativeAcceleration;
        let stepDecrement = initStep * Game.relativeStepShorting;
        if (this.step > (initStep * Game.charSpawningPeriodLimit) + stepDecrement) { 
            this.step -= stepDecrement;
        }
    }
    charHandler(char) {
        let needFrame = char.newFrame(this.speed);
        if (char.fellDown(this.field)) {
            char.status = "fallen";
            char.setDOMStyle("color", "rgb(220, 150, 30");
            char.setDOMStyle("backgroundColor", "rgb(200, 0, 0)");
            this.sounds["fall"].play().catch(() => null);
        }
        else if (!needFrame) {
            if (char.status === "fallen") {
                this.lifes--;
                let lifesNode = this.table.querySelector(".lifes-left");
                lifesNode.removeChild(lifesNode.lastChild);
            }
            else {
                this.score++;
                let scoreNode = this.table.querySelector(".game-score");
                scoreNode.textContent = ""+this.score;
            }

            this.field.removeNode(char.domNode); 
            this.presentChars
                .splice(this.presentChars.indexOf(char), 1);
        }
    }
    trackKeys(event) {
        this.presentChars.forEach(char => {
            if (char.status == "active"
                && char.text == event.key) {
                char.status = "typed";
                char.setDOMStyle("color", "rgb(220, 240, 210)");
                char.setDOMStyle("backgroundColor", "rgb(0, 230, 0)");
                this.sounds["typed"].play().catch(() => null);
            }
        });
    }

    reset(initialParameters) {
        this.time = 0;
        this.score = 0;

        this.gameStep = 0;
        this.nextCharTime = 0;
        this.presentChars = [];

        for (let param in initialParameters) {
            this[param] = initialParameters[param];
        };
    }
    gameOver (initialParameters) {
        this.field.clearNodes();
        let result = {
            time: prettyTime(this.time, TIME_INTERVALS),
            score: this.score
        }
        this.reset(initialParameters);  
        this.sounds["losings"].play().catch(() => null);
        return result;
    }

    runSession() {
        return new Promise((resolve, reject) => {  
            // Initial parameters:
            let initParams = {
                speed: this.speed,
                step: this.step,
                lifes: this.lifes
            };
            
            let trackKeys = this.trackKeys.bind(this);

            /* Main Loop */
            const mainLoop = tFrame => {
                this.time = tFrame - initTime;
                this.updateTable(this.table);
                if (this.time > this.nextCharTime) {
                    this.nextStep(initParams.speed, initParams.step);
                }
                
                this.presentChars.forEach(this.charHandler.bind(this)); // charHandler has no 'this' context inside function, it should be set

                if (this.lifes > 0) requestAnimationFrame(mainLoop);
                else {
                    removeEventListener('keydown', trackKeys);
                    resolve(this.gameOver(initParams));
                }
            }
            addEventListener('keydown', trackKeys);
            
            let initTime = performance.now();
            try {
                mainLoop(initTime);
            } catch (error) {
                reject(error);
            }
        });
    }

    sessionResults(results) {
        return new Promise((resolve, reject) => {
            let repeatButton;
            try {
                repeatButton = this.field.setResults(results);
            } catch (error) {
                reject(error);
            }
            let difficultyRange = this.field.setDifficultyNode( // ? Maybe it's possible to keep it in some method
                this.minSpeed, 
                this.minSpeed + Game.speedRange, 
                Game.speedInpStep,
                this.field.domNode.firstChild);
            difficultyRange.value = this.speed;
            const difficultyChange = event => {
                this.speed = +event.target.value;
                this.step = (Game.stepRelativeSpeed * 100) / this.speed;
            }
            let repeatGame = () => {
                difficultyRange.removeEventListener('change', difficultyChange);
                repeatButton.removeEventListener('click', repeatGame);
                this.field.clearNodes();
                this.initGameTable();
                resolve();
            }
            difficultyRange.addEventListener('change', difficultyChange);
            repeatButton.addEventListener('click', repeatGame);
        });
    }
}
/* Init preference */
Game.minSpeed = 50;
Game.speedRange = 150;
Game.speedInpStep = 10;
/* Session preference */
Game.stepRelativeSpeed = 2;
Game.relativeAcceleration = 0.005;  //- Note: Hmm... As I have observed, it's better to keep speed encrease
Game.relativeStepShorting = 0.005; //- proportional as spawning step desrease
Game.charSpawningPeriodLimit = 0.5; //sec
//- Note: spawn frequency limit should be proportional to game speed!
/* Game Sounds */
Game.SOUND_LINKS = {
    typed: "sounds/typed.wav",
    fall: "sounds/fall.wav",
    losings: "sounds/losings.wav"
}