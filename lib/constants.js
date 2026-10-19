import { vec2 } from "./vec2.js";

export const TILE_SIZE_PIXELS = [8, 8];
export const SCREEN_SIZE_TILES = [20, 18];
export const SCREEN_SIZE_PIXELS = vec2.hadamard(SCREEN_SIZE_TILES, TILE_SIZE_PIXELS);
