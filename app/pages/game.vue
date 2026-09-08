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

<script setup>
import { reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import socargame03 from '@/assets/socargame-03.png'
import socargame04 from '@/assets/socargame-04.png'
import socargame05 from '@/assets/socargame-05.png'
import socargame06 from '@/assets/socargame-06.png'
import socargame07 from '@/assets/socargame-07.png'

// Only the URLs are safe at module scope (plain strings). The `Image` objects
// must NOT be created here: `new Image()` exists only in the browser, but page
// modules may be evaluated by Node during `nuxt generate` prerendering, which
// would throw "Image is not defined" in CI. Sprites are created lazily in
// onMounted() instead.
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

// --- mutable game state --------------------------------------------------
const currentSpeed = ref(10)
const game = ref(false)
const muted = ref(false)
const die = ref(false)
const car1Move = ref(0)
const car1Turn = ref(0)
const score = ref(0)
const lines = ref([])
const car1 = ref([])
const car2 = ref([])

// Static game configuration / metrics (canvas size, sprites, lanes...)
const data = reactive({
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
        image: null, // set in onMounted() -> loadSprites()
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
})

// DOM handles (assigned in onMounted; not reactive by design)
let canvas = null
let context = null
let instruction = null
let scoreText = null
let lose = null
let rafId = null
let timeoutId = null

watch(muted, (val) => {
    const audio = document.getElementById('audio')
    if (audio) {
        audio.muted = val
        if (val) {
            audio.pause(); audio.currentTime = 0;
        }
        else audio.play();
    }
})

onMounted(() => {
    muted.value = true;
    canvas = document.querySelector("#canvas");
    context = canvas.getContext("2d");
    instruction = document.querySelector("#instruction");
    scoreText = document.querySelector("#score");
    lose = document.querySelector("#lose");

    // Instantiate sprites here (browser-only) before starting the render loop.
    const sprites = loadSprites();
    data.car1.image = sprites.car1;
    data.car2.image = sprites.car2;
    data.car3.image = sprites.car3;
    data.car4.image = sprites.car4;
    data.car5.image = sprites.car5;

    window.addEventListener("keydown", onKeydown);
    render()
})

onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeydown);
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
})

function onKeydown(evt) {
    evt.preventDefault();

    if (!game.value) {
        if (evt.keyCode === 13) { //enter
            start()
        }
    }

    if (car1Move.value <= 0 && car1Turn.value <= 0) {
        if (evt.keyCode === 37) { //left
            left()
        }
        else if (evt.keyCode === 39) { //right
            right()
        }
    }
}

function left() {
    if (car1.value[0] === data.moves[1]) {
        car1Move.value = data.moves[0];
        car1Turn.value = 1;
    }
    else if (car1.value[0] === data.moves[2]) {
        car1Move.value = data.moves[1];
        car1Turn.value = 1;
    }
    else if (car1.value[0] === data.moves[3]) {
        car1Move.value = data.moves[2];
        car1Turn.value = 1;
    }
}

function right() {
    if (car1.value[0] === data.moves[0]) {
        car1Move.value = data.moves[1];
        car1Turn.value = 2;
    }
    else if (car1.value[0] === data.moves[1]) {
        car1Move.value = data.moves[2];
        car1Turn.value = 2;
    }
    else if (car1.value[0] === data.moves[2]) {
        car1Move.value = data.moves[3];
        car1Turn.value = 2;
    }
}

function start() {
    muted.value = false
    game.value = true;
    instruction.style.display = "none";
    lose.style.display = "none";

    initialize();
}

function clearCanvas() {
    context.clearRect(0, 0, data.canvas.width, data.canvas.height);
}

function initLines() {
    var y = data.canvas.height - data.line.height;

    while (y >= 0) {
        lines.value.push([
            [data.line.pos0, y, data.line.width, data.line.height],
            [data.line.pos1, y, data.line.width, data.line.height],
            [data.line.pos2, y, data.line.width, data.line.height],
            [data.line.pos3, y, data.line.width, data.line.height]
        ]);

        y -= data.line.distance;
    }
}

function initCar1() {
    car1.value = [data.car1.position.x, data.car1.position.y, data.car1.width, data.car1.height];
}

function initCar2() {
    for (var i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
        var random = data.moves[Math.floor(Math.random() * 4)];

        let min = Math.ceil(2);
        let max = Math.floor(5);
        let rand = Math.floor(Math.random() * (max - min + 1)) + min;
        if (car2.value.length > 0) {
            if (random === car2.value[car2.value.length - 1][1]) {
                i--;
            }
            else {
                car2.value.push([random, data.car2.height * -1, data[`car${rand}`].image]);
            }
        }
        else {
            car2.value.push([random, data.car2.height * -1, data[`car${rand}`].image]);
        }
    }
}

function drawLines() {
    var remove = false;

    context.fillStyle = data.line.color;

    for (var i = 0; i < lines.value.length; i++) {
        context.fillRect(lines.value[i][0][0], lines.value[i][0][1], lines.value[i][0][2], lines.value[i][0][3]);
        context.fillRect(lines.value[i][1][0], lines.value[i][1][1], lines.value[i][1][2], lines.value[i][1][3]);
        context.fillRect(lines.value[i][2][0], lines.value[i][2][1], lines.value[i][2][2], lines.value[i][2][3]);
        context.fillRect(lines.value[i][3][0], lines.value[i][3][1], lines.value[i][3][2], lines.value[i][3][3]);

        if (lines.value[i][0][1] > data.canvas.height) {
            remove = i;
        }
        else {
            lines.value[i][0][1] += currentSpeed.value;
            lines.value[i][1][1] += currentSpeed.value;
            lines.value[i][2][1] += currentSpeed.value;
            lines.value[i][3][1] += currentSpeed.value;
        }
    }

    if (lines.value[lines.value.length - 1][0][1] > data.line.distance - data.line.height) {
        lines.value.push([
            [data.line.pos0, (data.line.height * -1), data.line.width, data.line.height],
            [data.line.pos1, (data.line.height * -1), data.line.width, data.line.height],
            [data.line.pos2, (data.line.height * -1), data.line.width, data.line.height],
            [data.line.pos3, (data.line.height * -1), data.line.width, data.line.height]
        ]);
    }

    if (remove) {
        lines.value.splice(remove, 1);
    }
}

function drawCar1() {
    if (car1Move.value > 0 && car1Turn.value > 0) {
        if (car1Turn.value === 1) {
            if (car1.value[0] > car1Move.value) {
                car1.value[0] -= data.car1.turn;
            }
            else {
                car1.value[0] = car1Move.value;
                car1Move.value = 0;
                car1Turn.value = 0;
            }
        }
        else if (car1Turn.value === 2) {
            if (car1.value[0] < car1Move.value) {
                car1.value[0] += data.car1.turn;
            }
            else {
                car1.value[0] = car1Move.value;
                car1Move.value = 0;
                car1Turn.value = 0;
            }
        }
    }
    context.drawImage(data.car1.image, car1.value[0], car1.value[1], car1.value[2], car1.value[3]);
}

function drawCar2() {
    var remove = false;
    let min = Math.ceil(2);
    let max = Math.floor(5);
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    for (var i = 0; i < car2.value.length; i++) {
        if (car2.value[i][1] > data.canvas.height) {
            remove = i;
        }
        else {
            car2.value[i][1] += currentSpeed.value;
        }
        context.drawImage(car2.value[i][2], car2.value[i][0], car2.value[i][1], data.car2.width, data.car2.height);
    }

    if (car2.value[car2.value.length - 1][1] > data.car2.distance) {
        initCar2();
    }

    if (remove) {
        car2.value.splice(remove, 1);
    }
}

function collision() {
    for (var i = 0; i < car2.value.length; i++) {
        if (
            car1.value[0] + data.grace <= car2.value[i][0] + data.car2.width
            && car1.value[0] + data.car1.width - data.grace >= car2.value[i][0]
            && car1.value[1] + data.grace <= car2.value[i][1] + data.car2.height
            && car1.value[1] + data.car2.height - data.grace >= car2.value[i][1]
        ) {
            die.value = true;
            game.value = false;
            instruction.style.display = "block";
            lose.style.display = "block";
            muted.value = true
        }
    }
}

function incrementScore() {
    score.value += data.score;

    scoreText.innerHTML = score.value;
}

function render() {
    timeoutId = setTimeout(()=> {
        rafId = requestAnimationFrame(render);
        // if(score.value) {
        //  currentSpeed.value = 10 + (score.value/100)
        // }
        if (!die.value && game.value) {
            clearCanvas();
            drawLines();
            drawCar1();
            drawCar2();
            collision();
            incrementScore();
        }
    }, 1000 / data.fps);
}

function initialize() {
    die.value = false;
    score.value = 0;
    car1Move.value = 0;
    car1Turn.value = 0;
    lines.value = [];
    car1.value = [];
    car2.value = [];

    initLines();
    initCar1();
    initCar2();
    clearCanvas();
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
