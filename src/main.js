import shaderSourceScreenFillingTriangle from "../shaders/screen_filling_triangle.glsl?raw";
import shaderSourceGameBoyRasterizer from "../shaders/game_boy_rasterizer.glsl?raw";
import dataVideoRaw from "../data/video/patterns.json?raw";

import { SCREEN_SIZE_PIXELS, SCREEN_SIZE_TILES } from "../lib/constants.js";
import { vec2 } from "../lib/vec2.js";
import { loadProgram, loadShader } from "../lib/gl_utils.js";
import { DATA_ARRANGEMENTS } from "../data/video/arrangements.js";
import { createPeriodicWaveSquareWithDutyCycleRatio, getSystemaTeleionMeizonDiatonosStringLengths } from "../lib/music.js";
import { UI_CONSTANTS } from "../data/video/ui_constants.js";
import { VideoManager } from "./videoManager.js";
import { CREATURE_DB, CREATURE_ENUM } from "../data/content/creature_db.js";
import { ScreenTitle } from "./screens/screenTitle.js";
import { StateManager } from "./stateManager.js";
import { AudioManager } from "./audioManager.js";

function onResize(ctx)
{
    const windowInnerSizePixels = [window.innerWidth, window.innerHeight];
    const scale = Math.floor(Math.min(...vec2.ratio(windowInnerSizePixels, SCREEN_SIZE_PIXELS)));
    ctx.canvas.style.transform = `scale(${scale})`;
}


function getNoteStringAtTime(song, instrumentId, t)
{
    return song.data[t * 4 + instrumentId];
}

const BASE_FREQUENCY = 220;

export function onChangedPlaying(ctx, newValue)
{
    ctx.playing = newValue;

    if (ctx.playing)
    {
        if (!ctx.oscillator1Started)
        {
            ctx.oscillator1Started = true;
            ctx.oscillator1.start();
        }

        if (!ctx.oscillator2Started)
        {
            ctx.oscillator2Started = true;
            ctx.oscillator2.start();
        }

        if (!ctx.oscillator3Started)
        {
            ctx.oscillator3Started = true;
            ctx.oscillator3.start();
        }
    }
    else
    {
        const sameTime = ctx.audioCtx.currentTime;
        ctx.oscillator1.frequency.setValueAtTime(0, sameTime);
        ctx.oscillator2.frequency.setValueAtTime(0, sameTime);
        ctx.oscillator3.frequency.setValueAtTime(0, sameTime);
    }
}

function processAudio(ctx, timestamp)
{
    if (ctx.songStack.length === 0)
    {
        return;
    }

    const song = ctx.songStack[ctx.songStack.length - 1];
    const songNoteCount = song.data.length / 4;
    const period = ctx.periodStack[ctx.periodStack.length - 1];
    const timestampLastNote = ctx.timestampLastNoteStack[ctx.timestampLastNoteStack.length - 1];
    const loop = ctx.songLoopStack[ctx.songLoopStack.length - 1];
    let noteCursor = ctx.noteCursorStack[ctx.noteCursorStack.length - 1];

    if (ctx.playing && period < (timestamp - timestampLastNote) * 1e-3)
    {
        noteCursor++;
        if (noteCursor === songNoteCount)
        {
            if (loop)
            {
                noteCursor = 0;
            }
            else
            {
                ctx.playing = false;
                ctx.finishedPlaying = true;
                AudioManager.popSong(ctx);
                return;
            }
        }

        ctx.noteCursorStack[ctx.noteCursorStack.length - 1] = noteCursor;

        const t = noteCursor;

        const sameTime = ctx.audioCtx.currentTime;
        {
            const stringName = getNoteStringAtTime(song, 0, t);
            const stringLength = ctx.stringLengths[stringName];
            const f = BASE_FREQUENCY / stringLength;
            ctx.oscillator1.frequency.setValueAtTime(f, sameTime);
        }
        {
            const stringName = getNoteStringAtTime(song, 1, t);
            const stringLength = ctx.stringLengths[stringName];
            const f = BASE_FREQUENCY / stringLength;
            ctx.oscillator2.frequency.setValueAtTime(f, sameTime);
        }
        {
            const stringName = getNoteStringAtTime(song, 2, t);
            const stringLength = ctx.stringLengths[stringName];
            const f = BASE_FREQUENCY / stringLength;
            ctx.oscillator3.frequency.setValueAtTime(f, sameTime);
        }

        ctx.timestampLastNoteStack[ctx.timestampLastNoteStack.length - 1] = timestamp;
    }
}

function onRequestAnimationFrame(timestamp, ctx)
{
    /* audio system */

    processAudio(ctx, timestamp);

    /* audio system (end) */


    /* video system */

    const canvas = ctx.canvas;
    const gl = ctx.gl;

    ctx.screenStack[ctx.screenStack.length - 1].update(ctx, timestamp, ctx.screenStack[ctx.screenStack.length - 1]);

    for (const screen of ctx.screenStack)
    {
        screen.render(ctx, screen);
    }

    gl.uniform1iv(gl.getUniformLocation(ctx.program, 'uBackgroundData'), ctx.backgroundBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* video system (end) */


    /* input system */

    ctx.inputState.a[0] = ctx.inputState.a[1];
    ctx.inputState.b[0] = ctx.inputState.b[1];
    ctx.inputState.start[0] = ctx.inputState.start[1];
    ctx.inputState.select[0] = ctx.inputState.select[1];
    ctx.inputState.up[0] = ctx.inputState.up[1];
    ctx.inputState.down[0] = ctx.inputState.down[1];
    ctx.inputState.left[0] = ctx.inputState.left[1];
    ctx.inputState.right[0] = ctx.inputState.right[1];

    /* input system (end) */

    requestAnimationFrame((timestamp) => onRequestAnimationFrame(timestamp, ctx));
}


export function main()
{
    const ctx = {
        /* video engine stuff */
        canvas: null,
        gl: null,
        program: null,
        backgroundBuffer: null,

        /* audio engine stuff */
        audioCtx: null,
        stringLengths: null,
        
        playing: false,
        wasPlaying: false,
        loop: false,
        timestampLastNote: 0,
        noteCursor: -1,
        bpm: 0,
        period: 0,

        oscillator1: null,
        oscillator1Started: false,

        oscillator2: null,
        oscillator2Started: false,

        oscillator3: null,
        oscillator3Started: false,

        /* input engine stuff */
        inputState: {
            a: [0, 0],
            b: [0, 0],
            start: [0, 0],
            select: [0, 0],
            up: [0, 0],
            down: [0, 0],
            right: [0, 0],
            left: [0, 0],
        },

        /* content */
        screenStack: [],

        songStack: [],
        songLoopStack: [],
        periodStack: [],
        noteCursorStack: [],
        timestampLastNoteStack: [],

        finishedPlaying: false,
    };

    /* init video engine */

    const canvas = document.createElement('canvas');
    ctx.canvas = canvas;
    ctx.canvas.width = SCREEN_SIZE_PIXELS[0];
    ctx.canvas.height = SCREEN_SIZE_PIXELS[1];

    // getting a 2d context beforehand causes getting the webgl2 context to fail afterwards, useful for simulating failure
    // ctx.canvas.getContext('2d');

    const gl = canvas.getContext('webgl2');
    ctx.gl = gl;

    if (gl === null)
    {
        document.body.append('Error: Failed to get WebGL2 context');
        return;
    }

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, shaderSourceScreenFillingTriangle);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, shaderSourceGameBoyRasterizer);
    const program = loadProgram(gl, vertexShader, fragmentShader);
    ctx.program = program;

    if (program === null)
    {
        document.body.append('Error: Failed to link program');
        return;
    }

    const dataVideo = JSON.parse(dataVideoRaw);
    const patternData = new Int32Array(dataVideo.pattern_data);

    const patternDataTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, patternDataTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32I, dataVideo.pattern_data.length, 1, 0, gl.RED_INTEGER, gl.INT, patternData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uPatternDataTexture'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'uCanvasHeight'), SCREEN_SIZE_PIXELS[1]);
    gl.uniform1i(gl.getUniformLocation(program, 'uCanvasTilesPerRow'), SCREEN_SIZE_TILES[0]);

    gl.viewport(0, 0, SCREEN_SIZE_PIXELS[0], SCREEN_SIZE_PIXELS[1]);

    gl.uniform1i(gl.getUniformLocation(program, 'uBackgroundDataLength'), 360);

    document.body.prepend(canvas);

    window.addEventListener('resize', () => onResize(ctx));
    onResize(ctx);

    const backgroundBuffer = new Int32Array(Array(360).fill(0));
    ctx.backgroundBuffer = backgroundBuffer;

    /* init video engine (end) */


    /* init audio engine */

    const audioCtx = new AudioContext();
    ctx.audioCtx = audioCtx;

    const oscillator1 = audioCtx.createOscillator();
    const oscillator2 = audioCtx.createOscillator();
    const oscillator3 = audioCtx.createOscillator();

    ctx.oscillator1 = oscillator1;
    ctx.oscillator2 = oscillator2;
    ctx.oscillator3 = oscillator3;

    oscillator1.setPeriodicWave(createPeriodicWaveSquareWithDutyCycleRatio(audioCtx, 0.125));
    oscillator2.setPeriodicWave(createPeriodicWaveSquareWithDutyCycleRatio(audioCtx, 0.25));
    oscillator3.setPeriodicWave(createPeriodicWaveSquareWithDutyCycleRatio(audioCtx, 0.50));

    oscillator1.connect(new GainNode(audioCtx, {gain: 0.25})).connect(new StereoPannerNode(audioCtx, {pan: -0.5})).connect(audioCtx.destination);
    oscillator2.connect(new GainNode(audioCtx, {gain: 0.25})).connect(new StereoPannerNode(audioCtx, {pan: +0.0})).connect(audioCtx.destination);
    oscillator3.connect(new GainNode(audioCtx, {gain: 0.25})).connect(new StereoPannerNode(audioCtx, {pan: +0.5})).connect(audioCtx.destination);

    oscillator1.frequency.setValueAtTime(0, audioCtx.currentTime);
    oscillator2.frequency.setValueAtTime(0, audioCtx.currentTime);
    oscillator3.frequency.setValueAtTime(0, audioCtx.currentTime);

    ctx.stringLengths = getSystemaTeleionMeizonDiatonosStringLengths();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden)
        {
            ctx.wasPlaying = ctx.playing;
            onChangedPlaying(ctx, false);
        }
        else
        {
            onChangedPlaying(ctx, ctx.wasPlaying);
        }
    });

    /* init audio engine (end) */

    StateManager.pushState(ctx, ScreenTitle);

    

    // 

    

    window.addEventListener('keypress', (e) => {
        if (e.code === 'KeyF')
        {
            if (document.fullscreenElement)
            {
                document.exitFullscreen();
            }
            document.documentElement.requestFullscreen();
            return;
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyZ')
        {
            ctx.inputState.a[1] = 1;
            return;
        }

        if (e.code === 'KeyX')
        {
            ctx.inputState.b[1] = 1;
            return;
        }

        if (e.code === 'Enter')
        {
            ctx.inputState.start[1] = 1;
            return;
        }

        if (e.code === 'Space')
        {
            ctx.inputState.select[1] = 1;
            return;
        }

        if (e.code === 'ArrowUp')
        {
            ctx.inputState.up[1] = 1;
            return;
        }

        if (e.code === 'ArrowDown')
        {
            ctx.inputState.down[1] = 1;
            return;
        }

        if (e.code === 'ArrowLeft')
        {
            ctx.inputState.left[1] = 1;
            return;
        }

        if (e.code === 'ArrowRight')
        {
            ctx.inputState.right[1] = 1;
            return;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyZ')
        {
            ctx.inputState.a[1] = 0;
            return;
        }

        if (e.code === 'KeyX')
        {
            ctx.inputState.b[1] = 0;
            return;
        }

        if (e.code === 'Enter')
        {
            ctx.inputState.start[1] = 0;
            return;
        }

        if (e.code === 'Space')
        {
            ctx.inputState.select[1] = 0;
            return;
        }

        if (e.code === 'ArrowUp')
        {
            ctx.inputState.up[1] = 0;
            return;
        }

        if (e.code === 'ArrowDown')
        {
            ctx.inputState.down[1] = 0;
            return;
        }

        if (e.code === 'ArrowLeft')
        {
            ctx.inputState.left[1] = 0;
            return;
        }

        if (e.code === 'ArrowRight')
        {
            ctx.inputState.right[1] = 0;
            return;
        }
    });

    requestAnimationFrame((timestamp) => onRequestAnimationFrame(timestamp, ctx));
}
