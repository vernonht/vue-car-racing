<template>
    <div class="box" :style="{ width: data.canvas.width + 'px' }">
        <!-- speed controls -->
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-2.5 py-1.5 shadow-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span class="text-gray-500 text-xs font-semibold uppercase tracking-wider">Speed</span>
                <span class="text-gray-900 text-sm font-bold tabular-nums leading-none">{{ currentSpeed }}</span>
            </div>
            <div class="flex gap-2">
                <button class="ctrl" type="button" :disabled="currentSpeed >= maxSpeed" aria-label="Increase speed" title="Increase speed" @click="setCurrentSpeed(currentSpeed + 1)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <button class="ctrl" type="button" :disabled="currentSpeed <= 1" aria-label="Decrease speed" title="Decrease speed" @click="setCurrentSpeed(currentSpeed - 1)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
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
            <button class="ctrl" type="button" :disabled="game || laneCount >= maxLanes" aria-label="Add lane" :title="`Add lane (max ${maxLanes})`" @click="setLaneCount(laneCount + 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
        </div>

        <!-- difficulty: enemy spawn density -->
        <div class="flex items-center justify-center gap-2 my-2 select-none">
            <span class="text-gray-500 text-xs font-semibold uppercase tracking-wider">Difficulty</span>
            <div class="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <button
                    v-for="d in DIFFICULTIES"
                    :key="d"
                    class="seg capitalize"
                    type="button"
                    :class="{ 'seg--on': difficulty === d }"
                    :disabled="game"
                    @click="setDifficulty(d)"
                >{{ d }}</button>
            </div>
        </div>

        <div class="hidden">
            <audio controls autoplay loop id="audio">
                <!-- <source src="../assets/bgm.mp3" type="audio/mpeg"> -->
                Your browser does not support the audio element.
            </audio>
        </div>

        <!-- PixiJS stage + in-canvas overlays (score / instructions / lose) -->
        <div
            ref="stageEl"
            class="game-stage"
            @touchstart.passive="onTouchStart"
            @touchend="onTouchEnd"
        >
            <pre ref="scoreEl" id="score">0</pre>
            <div ref="instructionEl" class="flex flex-col px-10" id="instruction">
                <div>Press "Enter" key to start the game.</div>
                <div>Controls:</div>
                <div>"Left" Arrow key</div>
                <div>"Right" Arrow key</div>
                <div v-if="isMobile">Swipe left / right on touch screens</div>
            </div>
            <pre ref="loseEl" id="lose">You lose! Try again?</pre>
            <p v-if="webglError" class="render-error">
                WebGL/WebGPU is not available in this browser — try the Canvas version at <NuxtLink to="/game">/game</NuxtLink>.
            </p>
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
import { clampLaneCount, laneCentres, canvasWidth, centreLane, LANE } from '~/utils/lanes'
import { isTouchDevice, maxLanesForScreen } from '~/utils/device'
import socargame01 from '@/assets/socargame-01.png'
import socargame03 from '@/assets/socargame-03.png'
import socargame04 from '@/assets/socargame-04.png'
import socargame05 from '@/assets/socargame-05.png'
import socargame06 from '@/assets/socargame-06.png'
import socargame07 from '@/assets/socargame-07.png'

// PixiJS is imported lazily inside onMounted — never at module scope. Its root
// import runs browser-environment init, which would crash `nuxt generate` in
// CI (same class of failure as the old "Image is not defined").
// Only the asset URLs above are safe at module scope (plain strings).

// The original Canvas game ticked at 180fps; the Pixi ticker runs at display
// rate, so scroll/movement is scaled by delta time to keep the same px/second.
const BASE_FPS = 180

// Enemy spawn density per difficulty. `gap` scales the spawn trigger distance
// (data.car2.distance): higher = batches further apart = fewer cars on screen.
// min/max = how many cars to spawn per batch (distinct lanes, never all lanes).
const SPAWN = {
    easy: { min: 1, max: 1, gap: 1.25 },
    medium: { min: 1, max: 2, gap: 1 }, // matches the original game
    hard: { min: 2, max: 4, gap: 0.7 }
}
const DIFFICULTIES = ['easy', 'medium', 'hard']

// --- state ---------------------------------------------------------------
const stageEl = ref(null)
const scoreEl = ref(null)
const instructionEl = ref(null)
const loseEl = ref(null)

const currentSpeed = ref(10)
const maxSpeed = ref(20)
const game = ref(false)
const muted = ref(false)
const die = ref(false)
const score = ref(0)
const laneCount = ref(4)
const difficulty = ref('medium')
const isMobile = ref(false)
const maxLanes = ref(LANE.max) // effective cap for this screen (see maxLanesForScreen)
const webglError = ref(false)

const data = reactive({
    canvas: {
        width: canvasWidth(4),
        height: 480
    },
    car1: {
        width: 80,
        height: 120,
        turn: 25,
        y: 340
    },
    car2: {
        width: 80,
        height: 120,
        distance: 350
    },
    line: {
        width: 10,
        height: 80,
        distance: 120,
        color: 0xefefef
    },
    moves: [],
    grace: 10
})

// --- Pixi handles (plain values; never reactive) -------------------------
let PIXI = null
let app = null
let bgSprite = null
let dashLayer = null
let enemyLayer = null
let playerSprite = null
let dashTexture = null
let playerTexture = null
let enemyTextures = []
let enemies = []

// player lane tween (mirrors the original car1Move / car1Turn)
let laneTarget = null
let turnDir = 0 // 0 idle, 1 left, 2 right

// --- geometry ------------------------------------------------------------
function applyLaneCount (count) {
    const n = Math.min(maxLanes.value, clampLaneCount(count))
    laneCount.value = n

    data.moves = laneCentres(n)
    data.canvas.width = canvasWidth(n)

    if (app) {
        app.renderer.resize(data.canvas.width, data.canvas.height)
        fitRoad()
        buildDashes()
        clearEnemies()
        playerSprite.x = data.moves[centreLane(n)]
        playerSprite.y = data.car1.y
    }
}

function setLaneCount (count) {
    if (game.value) return // do not resize mid-race
    applyLaneCount(count)
}

function setDifficulty (level) {
    if (game.value) return // pick difficulty between rounds
    difficulty.value = level
}

// --- mobile detection / touch input --------------------------------------
function onResize () {
    maxLanes.value = maxLanesForScreen(window.innerWidth)
    if (!game.value && laneCount.value > maxLanes.value) {
        applyLaneCount(maxLanes.value)
    }
}

// swipe (touch) steering: horizontal swipe = lane change, tap = start/restart
const SWIPE_THRESHOLD = 24
let touchStart = null

function onTouchStart (evt) {
    const t = evt.changedTouches[0]
    touchStart = { x: t.clientX, y: t.clientY }
}

function onTouchEnd (evt) {
    if (!touchStart) return
    const t = evt.changedTouches[0]
    const dx = t.clientX - touchStart.x
    const dy = t.clientY - touchStart.y
    touchStart = null

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) left()
        else right()
    }
    else if (Math.hypot(dx, dy) <= SWIPE_THRESHOLD && !game.value) {
        start()
    }
}

function setCurrentSpeed (speed) {
    currentSpeed.value = Math.max(1, Math.min(maxSpeed.value, speed))
}

// --- scene ---------------------------------------------------------------
function fitRoad () {
    const w = data.canvas.width
    const h = data.canvas.height
    const tex = bgSprite.texture
    const scale = Math.max(w / tex.width, h / tex.height) // cover, like the CSS version
    bgSprite.setSize(tex.width * scale, tex.height * scale)
    bgSprite.x = (w - bgSprite.width) / 2
    bgSprite.y = (h - bgSprite.height) / 2
}

function dashXs () {
    return data.moves.map(x => x - LANE.dashOffset)
}

function buildDashes () {
    if (dashLayer) {
        app.stage.removeChild(dashLayer)
        dashLayer.destroy({ children: true })
    }
    dashLayer = new PIXI.Container()
    const rows = Math.ceil((data.canvas.height + data.line.distance) / data.line.distance)
    for (let r = -1; r < rows; r++) {
        for (const x of dashXs()) {
            const dash = new PIXI.Sprite(dashTexture)
            dash.x = x
            dash.y = r * data.line.distance
            dashLayer.addChild(dash)
        }
    }
    // keep the dash layer directly above the road background
    app.stage.addChildAt(dashLayer, 1)
}

function spawnEnemies () {
    const cfg = SPAWN[difficulty.value]
    const count = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1))
    for (const laneX of pickLanes(count)) {
        const sprite = new PIXI.Sprite(enemyTextures[Math.floor(Math.random() * enemyTextures.length)])
        sprite.setSize(data.car2.width, data.car2.height)
        sprite.x = laneX
        sprite.y = -data.car2.height
        enemyLayer.addChild(sprite)
        enemies.push(sprite)
    }
}

// Pick `count` distinct lanes, never every lane — the player always keeps a gap
// to slip through, even on Hard.
function pickLanes (count) {
    const pool = data.moves.slice()
    const lanes = []
    const n = Math.min(count, pool.length - 1)
    for (let i = 0; i < n; i++) {
        lanes.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    }
    return lanes
}

function clearEnemies () {
    for (const e of enemies) {
        e.destroy()
    }
    enemies = []
}

// --- game flow -----------------------------------------------------------
function initialize () {
    die.value = false
    score.value = 0
    scoreEl.value.innerHTML = '0'
    laneTarget = null
    turnDir = 0
    dashLayer.y = 0
    clearEnemies()
    playerSprite.x = data.moves[centreLane(laneCount.value)]
    playerSprite.y = data.car1.y
    spawnEnemies()
}

function start () {
    muted.value = false
    game.value = true
    instructionEl.value.style.display = 'none'
    loseEl.value.style.display = 'none'
    initialize()
}

function collision () {
    const { grace } = data
    for (const e of enemies) {
        if (
            playerSprite.x + grace <= e.x + data.car2.width
            && playerSprite.x + data.car1.width - grace >= e.x
            && playerSprite.y + grace <= e.y + data.car2.height
            && playerSprite.y + data.car1.height - grace >= e.y
        ) {
            die.value = true
            game.value = false
            instructionEl.value.style.display = 'block'
            loseEl.value.style.display = 'block'
            muted.value = true
            break
        }
    }
}

function tick (ticker) {
    if (!game.value || die.value) return

    const step = currentSpeed.value * BASE_FPS * (ticker.deltaMS / 1000)

    // dashed lane dividers
    dashLayer.y = (dashLayer.y + step) % data.line.distance

    // player lane tween (same 25px step as the Canvas version)
    if (laneTarget !== null && turnDir !== 0) {
        if (turnDir === 1) {
            if (playerSprite.x > laneTarget) playerSprite.x -= data.car1.turn
            else { playerSprite.x = laneTarget; laneTarget = null; turnDir = 0 }
        }
        else {
            if (playerSprite.x < laneTarget) playerSprite.x += data.car1.turn
            else { playerSprite.x = laneTarget; laneTarget = null; turnDir = 0 }
        }
    }

    // traffic
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]
        e.y += step
        if (e.y > data.canvas.height) {
            e.destroy()
            enemies.splice(i, 1)
        }
    }
    if (enemies.length === 0 || enemies[enemies.length - 1].y > data.car2.distance * SPAWN[difficulty.value].gap) {
        spawnEnemies()
    }

    collision()
    score.value += 1
    scoreEl.value.innerHTML = score.value
}

function left () {
    if (turnDir !== 0) return
    const idx = data.moves.indexOf(playerSprite.x)
    if (idx > 0) {
        laneTarget = data.moves[idx - 1]
        turnDir = 1
    }
}

function right () {
    if (turnDir !== 0) return
    const idx = data.moves.indexOf(playerSprite.x)
    if (idx >= 0 && idx < data.moves.length - 1) {
        laneTarget = data.moves[idx + 1]
        turnDir = 2
    }
}

function onKeydown (evt) {
    evt.preventDefault()
    if (!game.value) {
        if (evt.keyCode === 13) { // enter
            start()
        }
    }
    if (turnDir === 0) {
        if (evt.keyCode === 37) left() // left
        else if (evt.keyCode === 39) right() // right
    }
}

// --- Pixi lifecycle ------------------------------------------------------
async function createPixiApp () {
    PIXI = await import('pixi.js')
    const { Application, Assets, Sprite, Container, Graphics } = PIXI

    app = new Application()
    try {
        await app.init({
            width: data.canvas.width,
            height: data.canvas.height,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true,
            background: 0x2b2b2b
        })
    }
    catch (err) {
        app = null
        webglError.value = true
        return
    }

    stageEl.value.appendChild(app.canvas)

    // textures
    const [road, e1, e2, e3, e4, player] = await Promise.all([
        Assets.load(socargame01),
        Assets.load(socargame03),
        Assets.load(socargame04),
        Assets.load(socargame05),
        Assets.load(socargame07),
        Assets.load(socargame06)
    ])
    enemyTextures = [e1, e2, e3, e4]
    playerTexture = player

    // road background (cover)
    bgSprite = new Sprite(road)
    app.stage.addChild(bgSprite)

    // dashed dividers
    const g = new Graphics()
    g.rect(0, 0, data.line.width, data.line.height).fill(data.line.color)
    dashTexture = app.renderer.generateTexture(g)
    g.destroy()
    buildDashes()

    // player car (drawn above the road, below the traffic — like the original)
    playerSprite = new Sprite(playerTexture)
    playerSprite.setSize(data.car1.width, data.car1.height)
    playerSprite.x = data.moves[centreLane(laneCount.value)]
    playerSprite.y = data.car1.y
    app.stage.addChild(playerSprite)

    // traffic
    enemyLayer = new Container()
    app.stage.addChild(enemyLayer)

    fitRoad()
    app.ticker.add(tick)
}

onMounted(async () => {
    muted.value = true
    isMobile.value = isTouchDevice()
    maxLanes.value = maxLanesForScreen(window.innerWidth)
    // phones start on fewer lanes; always clamped to what fits the screen
    applyLaneCount(Math.min(isMobile.value ? 3 : laneCount.value, maxLanes.value))
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', onResize)
    await createPixiApp()
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
    if (app) {
        app.ticker.stop()
        app.destroy(true, { children: true })
        app = null
    }
})

// audio mute (same behaviour as game.vue)
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

// initial geometry: the classic 4-lane layout
applyLaneCount(4)
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

/* PixiJS mounts its <canvas> here; overlays sit on top via absolute positioning */
.game-stage {
    position: relative;
    width: 100%;
    height: 480px;
    margin: 0 auto;
    touch-action: none; /* swipe steering must not scroll the page */
}

.game-stage canvas {
    display: block;
}

#score {
    font-size: 20px;
    font-weight: bold;
    color: white;
    display: block;
    position: absolute;
    top: 4px;
    left: 10px;
    z-index: 1;
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
    z-index: 1;
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
    z-index: 1;
    text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

.render-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    text-align: center;
    font-size: 14px;
    color: #374151;
    background: #e5e7eb;
    z-index: 2;
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

.ctrl {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

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

/* difficulty segmented control */
.seg {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    background: #fff;
    border: 0;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.seg + .seg {
    border-left: 1px solid #e5e7eb;
}

.seg:hover {
    background: #f3f4f6;
}

.seg--on,
.seg--on:hover {
    background: #3b8070;
    color: #fff;
}

.seg:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.seg:focus-visible {
    outline: 2px solid #3b8070;
    outline-offset: -2px;
}
</style>
