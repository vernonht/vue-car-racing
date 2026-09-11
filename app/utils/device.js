// Device / viewport helpers. Client-only usage — every entry point guards for
// a missing `window` so importing these is safe during SSR/prerender.
import { LANE } from './lanes.js'

// Coarse pointer or any touch points → treat as a touch device (phone/tablet).
export function isTouchDevice () {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

// Largest lane count whose road (lanes*100 + 20 wide) still fits a viewport of
// `width`px, minus a `gutter` of breathing room. Clamped to LANE.min..LANE.max.
// e.g. 360px phone → 3 lanes, 768px tablet → 7, desktop → the full 8.
export function maxLanesForScreen (width, gutter = 32) {
    const byScreen = Math.floor((width - gutter) / LANE.pitch)
    return Math.min(LANE.max, Math.max(LANE.min, byScreen))
}
