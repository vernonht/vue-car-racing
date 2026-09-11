// Device / viewport helpers. Importing is side-effect free; the functions assume
// a browser (call them from onMounted / event handlers, never during SSR).
import { LANE } from './lanes.js'

// Coarse pointer or any touch points → treat as a touch device (phone/tablet).
export function isTouchDevice () {
    return window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

// Largest lane count whose road (lanes*100 + 20 wide) still fits a viewport of
// `width`px (minus 32px of breathing room). Clamped to LANE.min..LANE.max.
// e.g. 360px phone → 3 lanes, 768px tablet → 7, desktop → the full 8.
export function maxLanesForScreen (width) {
    const byScreen = Math.floor((width - 32) / LANE.pitch)
    return Math.min(LANE.max, Math.max(LANE.min, byScreen))
}
