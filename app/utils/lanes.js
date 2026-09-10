// Lane geometry shared by the Canvas-2D game (game.vue) and the PixiJS
// rebuild (game-next.vue).
//
// Lane pitch is fixed at 100px: lane i's centre sits at x = 30 + i*100, the
// dashed dividers run 15px to the left of each centre, and the canvas width
// tracks the lane count so the road always spans the canvas (4 lanes = 420px,
// 3 lanes = 320px, 8 lanes = 820px).
export const LANE = {
    pitch: 100,
    firstX: 30,
    dashOffset: 15,
    min: 3,
    max: 8
}

export function clampLaneCount (count) {
    return Math.min(LANE.max, Math.max(LANE.min, count))
}

export function laneCentres (count) {
    return Array.from({ length: count }, (_, i) => LANE.firstX + LANE.pitch * i)
}

export function canvasWidth (count) {
    return LANE.pitch * count + 20
}

export function centreLane (count) {
    return Math.floor((count - 1) / 2)
}
