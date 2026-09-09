<template>
    <div class="box" :style="{ width: data.canvas.width + 'px' }">
        <!-- speed controls -->
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-2.5 py-1.5 shadow-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span class="text-gray-500 text-xs font-semibold uppercase tracking-wider">Speed</span>
                <span id="speed" class="text-gray-900 text-sm font-bold tabular-nums leading-none">{{ currentSpeed }}</span>
            </div>
            <div class="flex gap-2">
                <button class="ctrl" type="button" aria-label="Increase speed" title="Increase speed" @click="setCurrentSpeed(currentSpeed + 1)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
                <button class="ctrl" type="button" aria-label="Decrease speed" title="Decrease speed" @click="setCurrentSpeed(currentSpeed - 1)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <path d="M5 12h14" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- lane controls: 3-8 lanes, canvas width follows -->
        <div class="flex items-center justify-center gap-2 my-2 select-none">
            <button class="ctrl" type="button" :disabled="game || laneCount <= 3" aria-label="Remove lane" title="Remove lane (min 3)" @click="setLaneCount(laneCount - 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
            </button>
            <div class="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-1.5 shadow-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 5v14M12 5v14M18 5v14" /></svg>
                <span class="text-gray-500 text-xs font-semibold uppercase tracking-wider">Lanes</span>
                <span class="text-gray-900 text-sm font-bold tabular-nums leading-none">{{ laneCount }}</span>
            </div>
            <button class="ctrl" type="button" :disabled="game || laneCount >= 8" aria-label="Add lane" title="Add lane (max 8)" @click="setLaneCount(laneCount + 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
        </div>

        <div class="hidden">
            <audio controls autoplay loop id="audio">
                <!-- <source src="../assets/bgm.mp3" type="audio/mpeg"> -->
                Your browser does not support the audio element.
            </audio>
        </div>

        <!-- game canvas + in-canvas overlays (score / instructions / lose) -->
        <div class="game-stage">
            <canvas id="canvas" :width="data.canvas.width" :height="data.canvas.height" tabindex="0"></canvas>
            <pre id="score">0</pre>
            <div class="flex flex-col px-10" id="instruction">
                <div>Press "Enter" key to start the game.</div>
                <div>Controls:</div>
                <div>"Left" Arrow key</div>
                <div>"Right" Arrow key</div>
            </div>
            <pre id="lose">You lose! Try again?</pre>
        </div>

        <!-- touch controls -->
        <div class="flex justify-between items-center my-4 select-none">
            <button class="gpad" type="button" aria-label="Move left" title="Move left" @click="left">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button class="gpad gpad--start" type="button" @click="start">
                {{ game ? 'Restart' : (die ? 'Play again' : 'Start') }}
            </button>
            <button class="gpad" type="button" aria-label="Move right" title="Move right" @click="right">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                </svg>
            </button>
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
const maxSpeed = ref(20)
const game = ref(false)
const muted = ref(false)
const die = ref(false)
const car1Move = ref(0)
const car1Turn = ref(0)
const score = ref(0)
const lines = ref([])
const car1 = ref([])
const car2 = ref([])
const laneCount = ref(4) // number of lanes (3-8); canvas width follows

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
        dashes: [], // x of dashed lane dividers; regenerated in applyLaneCount()
        color: "#efefef"
    },
    moves: [], // lane centre x positions; regenerated in applyLaneCount()
    score: 1,
    grace: 10
})

// --- dynamic lanes ------------------------------------------------------
// Lane pitch is fixed at 100px: lane i's centre sits at x = 30 + i*100 and the
// dashed dividers run at x = 15 + i*100. The canvas width tracks the lane
// count so the road always spans the full canvas: width = lanes*100 + 20
// (4 lanes = 420px, 3 lanes = 320px, 8 lanes = 820px).
const LANE = {
    pitch: 100,
    firstX: 30,
    dashX: 15,
    min: 3,
    max: 8
}

function applyLaneCount (count) {
    const n = Math.min(LANE.max, Math.max(LANE.min, count))
    laneCount.value = n

    const moves = []
    const dashes = []
    for (let i = 0; i < n; i++) {
        moves.push(LANE.firstX + LANE.pitch * i)
        dashes.push(LANE.dashX + LANE.pitch * i)
    }

    data.moves = moves
    data.line.dashes = dashes
    data.canvas.width = LANE.pitch * n + 20

    // keep the player car parked on a lane that always exists (2nd from the left)
    data.car1.position.x = moves[1]
}

function setLaneCount (count) {
    if (game.value) return // do not resize mid-race
    applyLaneCount(count)
    // clear stale scenery so the next start() rebuilds it at the new width
    lines.value = []
    car2.value = []
}

// initial geometry: the classic 4-lane layout
applyLaneCount(4)

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

function setCurrentSpeed (speed) {
    currentSpeed.value = Math.max(1, Math.min(maxSpeed.value, speed))
}

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
    const idx = data.moves.indexOf(car1.value[0])
    if (idx > 0) {
        car1Move.value = data.moves[idx - 1]
        car1Turn.value = 1
    }
}

function right() {
    const idx = data.moves.indexOf(car1.value[0])
    if (idx >= 0 && idx < data.moves.length - 1) {
        car1Move.value = data.moves[idx + 1]
        car1Turn.value = 2
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
        lines.value.push(
            data.line.dashes.map(x => [x, y, data.line.width, data.line.height])
        );
        y -= data.line.distance;
    }
}

function initCar1() {
    car1.value = [data.car1.position.x, data.car1.position.y, data.car1.width, data.car1.height];
}

function initCar2() {
    for (var i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
        var random = data.moves[Math.floor(Math.random() * data.moves.length)];

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
        var row = lines.value[i];
        for (var j = 0; j < row.length; j++) {
            context.fillRect(row[j][0], row[j][1], row[j][2], row[j][3]);
        }

        if (row[0][1] > data.canvas.height) {
            remove = i;
        }
        else {
            for (var k = 0; k < row.length; k++) {
                row[k][1] += currentSpeed.value;
            }
        }
    }

    if (lines.value.length > 0 &&
        lines.value[lines.value.length - 1][0][1] > data.line.distance - data.line.height) {
        lines.value.push(
            lines.value[lines.value.length - 1].map(dash => [dash[0], data.line.height * -1, dash[2], dash[3]])
        );
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
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 420px; /* fallback — real width is bound to data.canvas.width */
    position: absolute;
    top: calc(50% - 240px);
    left: 50%;
    transform: translateX(-50%);
}

#canvas {
background: url('../assets/socargame-01.png');
margin: 0 auto;
outline: none;
background-size: cover;
}

#score {
font-size: 20px;
font-weight: bold;
color: white;
display: block;
position: absolute;
top: 4px;
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
font-size: 18px;
font-weight: bold;
color: white;
display: none;
position: absolute;
top: 150px;
left: 40px;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

/* ---------- layout: wraps canvas + in-canvas overlays ---------- */
.game-stage {
    position: relative;
    width: 100%; /* follows .box, which tracks data.canvas.width */
    height: 480px;
    margin: 0 auto;
}

/* ---------- control buttons ---------- */
.ctrl,
.gpad {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #374151;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background-color 0.15s ease, border-color 0.15s ease,
        color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

/* speed + / - (secondary) */
.ctrl {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* gamepad round buttons (left / right) */
.gpad {
    width: 64px;
    height: 64px;
    border-radius: 9999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ctrl:hover,
.gpad:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.ctrl:active,
.gpad:active {
    transform: scale(0.92);
}

.ctrl:focus-visible,
.gpad:focus-visible {
    outline: 2px solid #3b8070;
    outline-offset: 2px;
}

/* primary action pill: Start / Restart / Play again */
.gpad--start {
    width: auto;
    min-width: 132px;
    height: 64px;
    padding: 0 26px;
    border-radius: 9999px;
    background: #3b8070;
    border-color: #3b8070;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.gpad--start:hover {
    background: #34695c;
    border-color: #34695c;
}

.gpad--start:active {
    transform: scale(0.95);
    background: #2d5c51;
}

.ctrl:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.ctrl:disabled:hover {
    background: #fff;
    border-color: #d1d5db;
}
</style>
