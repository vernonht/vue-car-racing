<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const currentTrack = ref('')

const props = defineProps({
    playing: { type: Boolean, default: false },
    muted: { type: Boolean, default: false }
})

// Tracks live in public/soundtracks/ (served verbatim) — Vite can't enumerate a
// public/ folder, so list them here. Add new tracks to this array.
const TRACKS = [
    'OSAKA',
    'Been Waiting'
]

const audioEl = ref(null)
let lastIndex = -1

function pickTrack () {
    if (TRACKS.length === 0) return ''
    let i = Math.floor(Math.random() * TRACKS.length)
    // avoid replaying the same track twice in a row (when there's a choice)
    if (TRACKS.length > 1 && i === lastIndex) i = (i + 1) % TRACKS.length
    lastIndex = i
    currentTrack.value = TRACKS[i]
    return `/soundtracks/${TRACKS[i]}.mp3`
}

function stop () {
    const el = audioEl.value
    if (!el) return
    el.pause()
    el.currentTime = 0
}

function play () {
    const el = audioEl.value
    if (!el || props.muted) return
    el.src = pickTrack() // a fresh random track per play
    el.play().catch(() => { /* autoplay blocked, or track missing */ })
}

watch(() => props.playing, (on) => {
    if (on) play()
    else stop() // game over / not playing → stop
})

watch(() => props.muted, (m) => {
    const el = audioEl.value
    if (!el) return
    if (m) el.pause()
    else if (props.playing) el.play().catch(() => {})
})

onBeforeUnmount(() => {
    const el = audioEl.value
    if (!el) return
    el.pause()
    el.removeAttribute('src')
    el.load()
})
</script>

<template>
    <audio ref="audioEl" loop preload="auto" hidden></audio>
    <section v-if="currentTrack && !audioEl.paused">
        <span class="text-right text-xs text-gray-400">Music track: {{ currentTrack }} by tubebackr & Tetuano</span>
        <span class="text-right text-xs text-gray-400">Source: https://freetouse.com/music</span>
    </section>
</template>
