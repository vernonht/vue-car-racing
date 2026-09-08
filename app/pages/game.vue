<template>
    <div class="box">
        <div class="flex">
            <pre id="speed">speed {{currentSpeed}}</pre>
            <div class="ml-auto">
                <button class="border hover:bg-gray-200 rounded w-10 mr-2" type="button" name="button" @click="currentSpeed++">+</button>
                <button class="border hover:bg-gray-200 rounded w-10" type="button" name="button" @click="currentSpeed--">-</button>
            </div>
        </div>
        <div class="hidden">
            <audio controls autoplay loop id="audio">
                <!-- <source src="../assets/bgm.mp3" type="audio/mpeg"> -->
                Your browser does not support the audio element.
            </audio>
        </div>
        <canvas id="canvas" :width="data.canvas.width" :height="data.canvas.height" tabindex="0"></canvas>
        <pre id="score">0</pre>
        <div class="flex flex-col px-10" id="instruction">
            <div>Press "Enter" key to start the game.</div>
            <div>Controls:</div>
            <div>"Left" Arrow key</div>
            <div>"Right" Arrow key</div>
        </div>
        <pre id="lose">You lose! Try again?</pre>
        <div class="flex justify-between my-4">
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="left">
                <
            </div>
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="start">
                Start
            </div>
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="right">
                >
            </div>
        </div>
        <div class="flex flex-col justify-end">
            <span class="text-right">Inspired by Takane Ichinose</span>
            <span class="text-right">
                <a href="https://codepen.io/takaneichinose/pen/MjNpXb">https://codepen.io/takaneichinose/pen/MjNpXb</a>
            </span>
        </div>
    </div>
</template>

<script>
import socargame03 from '@/assets/socargame-03.png'
import socargame04 from '@/assets/socargame-04.png'
import socargame05 from '@/assets/socargame-05.png'
import socargame06 from '@/assets/socargame-06.png'
import socargame07 from '@/assets/socargame-07.png'

// Only the URLs are safe at module scope (plain strings). The `Image` objects
// must NOT be created here: `new Image()` exists only in the browser, but page
// modules may be evaluated by Node during `nuxt generate` prerendering, which
// would throw "Image is not defined" in CI. Sprites are created lazily in
// mounted() instead. (Also: Vue 3 `data()` cannot call component methods.)
const spriteUrls = {
    car1: socargame06,
    car2: socargame03,
    car3: socargame04,
    car4: socargame05,
    car5: socargame07
}

function loadSprites () {
    const sprites = {}
    for (const key in spriteUrls) {
        const img = new Image()
        img.src = spriteUrls[key]
        sprites[key] = img
    }
    return sprites
}

export default {
    data() {
        return {
            data: {
                fps: 180,
                speed: 10,
                canvas: {
                    width: 420,
                    height: 480
                },
                car1: {
                    width: 80,
                    height: 120,
                    turn: 25,
                    image: null, // set in mounted() -> loadSprites()
                    position: {
                        x: 130,
                        y: 340
                    }
                },
                car2: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: null
                },
                car3: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: null
                },
                car4: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: null
                },
                car5: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: null
                },
                line: {
                    width: 10,
                    height: 80,
                    distance: 120,
                    pos0: 15,
                    pos1: 115,
                    pos2: 215,
                    pos3: 315,
                    color: "#efefef"
                },
                moves: [30, 130, 230, 330],
                score: 1,
                grace: 10
            },
            currentSpeed: 10,
            game: false,
            muted: false,
            die: false,
            car1Move: 0,
            car1Turn: 0,
            score: 0,
            lines: [],
            car1: [],
            car2: [],
            canvas: '',
            context: '',
            instruction: '',
            scoreText: '',
            lose: ''
        }
    },
    watch: {
        muted: function (val) {
            const audio = document.getElementById('audio')
            if (audio) {
                audio.muted = val
                if (val) {
                    audio.pause(); audio.currentTime = 0;
                }
                else audio.play();
            }
        },
    },
    mounted() {
        this.muted = true;
        this.canvas =  document.querySelector("#canvas");
        this.context =  this.canvas.getContext("2d");
        this.instruction =  document.querySelector("#instruction");
        this.scoreText =  document.querySelector("#score");
        this.lose =  document.querySelector("#lose");

        // Instantiate sprites here (browser-only) before starting the render loop.
        const sprites = loadSprites();
        this.data.car1.image = sprites.car1;
        this.data.car2.image = sprites.car2;
        this.data.car3.image = sprites.car3;
        this.data.car4.image = sprites.car4;
        this.data.car5.image = sprites.car5;

        window.addEventListener("keydown", this.onKeydown);
        this.render()
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.onKeydown);
        if (this._raf) {
            cancelAnimationFrame(this._raf);
        }
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    },
    methods: {
        onKeydown(evt) {
          evt.preventDefault();

          if (!this.game) {
            if (evt.keyCode === 13) { //enter
              this.start()
            }
          }

          if (this.car1Move <= 0 && this.car1Turn <= 0) {
            if (evt.keyCode === 37) { //left
              this.left()
            }
            else if (evt.keyCode === 39) { //right
              this.right()
            }
          }
        },
        left() {
            if (this.car1[0] === this.data.moves[1]) {
              this.car1Move = this.data.moves[0];
              this.car1Turn = 1;
            }
            else if (this.car1[0] === this.data.moves[2]) {
              this.car1Move = this.data.moves[1];
              this.car1Turn = 1;
            }
            else if (this.car1[0] === this.data.moves[3]) {
              this.car1Move = this.data.moves[2];
              this.car1Turn = 1;
            }
        },
        right() {
            if (this.car1[0] === this.data.moves[0]) {
              this.car1Move = this.data.moves[1];
              this.car1Turn = 2;
            }
            else if (this.car1[0] === this.data.moves[1]) {
              this.car1Move = this.data.moves[2];
              this.car1Turn = 2;
            }
            else if (this.car1[0] === this.data.moves[2]) {
              this.car1Move = this.data.moves[3];
              this.car1Turn = 2;
            }
        },
        start() {
            this.muted = false
            this.game = true;
            this.instruction.style.display = "none";
            this.lose.style.display = "none";

            this.initialize();
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height);
        },
        initLines() {
            var y = this.data.canvas.height - this.data.line.height;

            while (y >= 0) {
                this.lines.push([
                    [this.data.line.pos0, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos1, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos2, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos3, y, this.data.line.width, this.data.line.height]
                ]);

                y -= this.data.line.distance;
            }
        },
        initCar1() {
            this.car1 = [this.data.car1.position.x, this.data.car1.position.y, this.data.car1.width, this.data.car1.height];
        },
        initCar2() {
            for (var i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                var random = this.data.moves[Math.floor(Math.random() * 4)];

                let min = Math.ceil(2);
                let max = Math.floor(5);
                let rand = Math.floor(Math.random() * (max - min + 1)) + min;
                if (this.car2.length > 0) {
                    if (random === this.car2[this.car2.length - 1][1]) {
                        i--;
                    }
                    else {
                        this.car2.push([random, this.data.car2.height * -1, this.data[`car${rand}`].image]);
                    }
                }
                else {
                    this.car2.push([random, this.data.car2.height * -1, this.data[`car${rand}`].image]);
                }
            }
        },
        drawLines() {
            var remove = false;

            this.context.fillStyle = this.data.line.color;

            for (var i = 0; i < this.lines.length; i++) {
                this.context.fillRect(this.lines[i][0][0], this.lines[i][0][1], this.lines[i][0][2], this.lines[i][0][3]);
                this.context.fillRect(this.lines[i][1][0], this.lines[i][1][1], this.lines[i][1][2], this.lines[i][1][3]);
                this.context.fillRect(this.lines[i][2][0], this.lines[i][2][1], this.lines[i][2][2], this.lines[i][2][3]);
                this.context.fillRect(this.lines[i][3][0], this.lines[i][3][1], this.lines[i][3][2], this.lines[i][3][3]);

                if (this.lines[i][0][1] > this.data.canvas.height) {
                    remove = i;
                }
                else {
                    this.lines[i][0][1] += this.currentSpeed;
                    this.lines[i][1][1] += this.currentSpeed;
                    this.lines[i][2][1] += this.currentSpeed;
                    this.lines[i][3][1] += this.currentSpeed;
                }
            }

            if (this.lines[this.lines.length - 1][0][1] > this.data.line.distance - this.data.line.height) {
                this.lines.push([
                    [this.data.line.pos0, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos1, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos2, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos3, (this.data.line.height * -1), this.data.line.width, this.data.line.height]
                ]);
            }

            if (remove) {
                this.lines.splice(remove, 1);
            }
        },
        drawCar1() {
            if (this.car1Move > 0 && this.car1Turn > 0) {
                if (this.car1Turn === 1) {
                    if (this.car1[0] > this.car1Move) {
                        this.car1[0] -= this.data.car1.turn;
                    }
                    else {
                        this.car1[0] = this.car1Move;
                        this.car1Move = 0;
                        this.car1Turn = 0;
                    }
                }
                else if (this.car1Turn === 2) {
                    if (this.car1[0] < this.car1Move) {
                        this.car1[0] += this.data.car1.turn;
                    }
                    else {
                        this.car1[0] = this.car1Move;
                        this.car1Move = 0;
                        this.car1Turn = 0;
                    }
                }
            }
            this.context.drawImage(this.data.car1.image, this.car1[0], this.car1[1], this.car1[2], this.car1[3]);
        },
        drawCar2() {
            var remove = false;
            let min = Math.ceil(2);
            let max = Math.floor(5);
            let rand = Math.floor(Math.random() * (max - min + 1)) + min;
            for (var i = 0; i < this.car2.length; i++) {
                if (this.car2[i][1] > this.data.canvas.height) {
                    remove = i;
                }
                else {
                    this.car2[i][1] += this.currentSpeed;
                }
                this.context.drawImage(this.car2[i][2], this.car2[i][0], this.car2[i][1], this.data.car2.width, this.data.car2.height);
            }

            if (this.car2[this.car2.length - 1][1] > this.data.car2.distance) {
                this.initCar2();
            }

            if (remove) {
                this.car2.splice(remove, 1);
            }
        },
        collision() {
            for (var i = 0; i < this.car2.length; i++) {
                if (
                    this.car1[0] + this.data.grace <= this.car2[i][0] + this.data.car2.width
                    && this.car1[0] + this.data.car1.width - this.data.grace >= this.car2[i][0]
                    && this.car1[1] + this.data.grace <= this.car2[i][1] + this.data.car2.height
                    && this.car1[1] + this.data.car2.height - this.data.grace >= this.car2[i][1]
                ) {
                    this.die = true;
                    this.game = false;
                    this.instruction.style.display = "block";
                    this.lose.style.display = "block";
                    this.muted = true
                }
            }
        },
        incrementScore() {
            this.score += this.data.score;

            this.scoreText.innerHTML = this.score;
        },
        render() {
            this._timeout = setTimeout(()=> {
                this._raf = requestAnimationFrame(this.render);
                // if(this.score) {
                //  this.currentSpeed = 10 + (this.score/100)
                // }
                if (!this.die && this.game) {
                    this.clearCanvas();
                    this.drawLines();
                    this.drawCar1();
                    this.drawCar2();
                    this.collision();
                    this.incrementScore();
                }
            }, 1000 / this.data.fps);
        },
        initialize() {
            this.die = false;
            this.score = 0;
            this.car1Move = 0;
            this.car1Turn = 0;
            this.lines = [];
            this.car1 = [];
            this.car2 = [];

            this.initLines();
            this.initCar1();
            this.initCar2();
            this.clearCanvas();
        },
    }
}
</script>
<style scoped>

.box {
    width: 420px;
position: absolute;
top: calc(50% - 240px);
left: calc(50% - 170px);
}

#canvas {
background: url('../assets/socargame-01.png');
margin: 0 auto;
outline: none;
}

#score {
font-size: 20px;
font-weight: bold;
color: white;
display: block;
position: absolute;
top: 30px;
left: 10px;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

#instruction {
width: 100%;
font-size: 14px;
font-weight: bold;
color: white;
display: block;
position: absolute;
top: 200px;
left: 0;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

#lose {
width: 100%;
font-size: 14px;
font-weight: bold;
color: white;
display: none;
position: absolute;
top: 150px;
left: 30px;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}
</style>
