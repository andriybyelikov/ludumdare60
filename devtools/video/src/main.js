import shaderSourceScreenFillingTriangle from "../../../shaders/screen_filling_triangle.glsl?raw";
import shaderSourceGameBoyRasterizer from "../../../shaders/game_boy_rasterizer.glsl?raw";
import { loadProgram, loadShader } from "../../../lib/gl_utils.js";
import { vec2 } from "../../../lib/vec2.js";
import { TILE_SIZE_PIXELS } from "../../../lib/constants.js";

function getEditModeTileRowLength(editMode)
{
    if (editMode === 0)
    {
        return 1;
    }

    if (editMode === 1)
    {
        return 6;
    }
}

function getEditModeArrangementLength(editMode)
{
    if (editMode === 0)
    {
        return 1 * 1;
    }

    if (editMode === 1)
    {
        return 6 * 6;
    }
}

function getEditModeSizePixels(editMode)
{
    if (editMode === 0)
    {
        return [8, 8];
    }

    if (editMode === 1)
    {
        return [48, 48];
    }
}

function refreshCanvas(ctx)
{
    const gl = ctx.gl;
    const program = ctx.program;
    const patternData = ctx.currentProject.pattern_data;

    gl.uniform1i(gl.getUniformLocation(program, 'uBackgroundDataLength'), patternData.length / 4);

    const arrangement = Array(getEditModeArrangementLength(ctx.editMode)).fill(0);
    for (let i = 0; i < arrangement.length; i++)
    {
        arrangement[i] = ctx.currentPattern + i;
    }

    gl.uniform1iv(gl.getUniformLocation(program, 'uBackgroundData'), new Int32Array(arrangement));

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32I, patternData.length, 1, 0, gl.RED_INTEGER, gl.INT, new Int32Array(patternData));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function setPixelData(ctx, p, value)
{
    const t = vec2.ratio(p, TILE_SIZE_PIXELS).map((x) => Math.floor(x));
    console.log(p);
    const gl = ctx.gl;
    const patternData = ctx.currentProject.pattern_data;

    const patternDataIndex = ctx.currentPattern + t[1] * getEditModeTileRowLength(ctx.editMode) + t[0]; //

    p[0] = p[0] % 8;
    p[1] = p[1] % 8;

    const tileRow = p[1];
    const patternDataBlock32RowIndex = p[1] % 2;
    const patternDataBlock32RowPixelIndex = p[0] % 8;
    const patternDataBlock32Index = Math.floor(tileRow / 2);
    const patternDataBlock32 = patternData[patternDataIndex * 4 + patternDataBlock32Index];

    // const patternDataBlock32Row = (0x0000_0000 >> (2 * 8 * patternDataBlock32RowIndex)) & 0xFFFF;
    // const patternDataBlock32RowPixel = (patternDataBlock32Row >> (2 * patternDataBlock32RowPixelIndex)) & 0x03;

    const temp0 = 0x03 << (2 * patternDataBlock32RowPixelIndex);
    const temp1 = temp0 << (2 * 8 * patternDataBlock32RowIndex);
    const temp2 = ~temp1;
    const temp3 = patternDataBlock32 & temp2;

    const temp4 = value << (2 * patternDataBlock32RowPixelIndex);
    const temp5 = temp4 << (2 * 8 * patternDataBlock32RowIndex);
    const temp6 = temp3 | temp5;

    patternData[patternDataIndex * 4 + patternDataBlock32Index] = temp6;

    refreshCanvas(ctx);
}

function draw(ctx, e)
{
    const clientPos = [e.clientX, e.clientY];
    const rect = e.target.getBoundingClientRect();
    const rectPos = [rect.x, rect.y];
    const rectSize = [rect.width, rect.height];
    const ndc = vec2.ratio(vec2.difference(clientPos, rectPos), rectSize);

    const sizePixels = getEditModeSizePixels(ctx.editMode);

    const trueCoordinates = vec2.floor(vec2.hadamard(ndc, sizePixels));

    const value = parseInt(document.querySelector('input[type="radio"][name="shade"]:checked').dataset.value);
    setPixelData(ctx, trueCoordinates, value);
}

function onProjectLoaded(ctx)
{
    console.log(ctx);
    document.querySelector('#pattern-count').value = ctx.currentProject.pattern_data.length / 4;
    document.querySelector('#current-pattern').max = document.querySelector('#pattern-count').value - 1;

    ctx.currentPattern = 0;
    document.querySelector('#current-pattern').value = ctx.currentPattern;

    refreshCanvas(ctx);
}

function updateEditMode(ctx)
{
    const gl = ctx.gl;
    const canvas = ctx.canvas;
    const program = ctx.program;

    if (ctx.editMode === 0) // 8x8
    {
        canvas.width = 8;
        canvas.height = 8;
        canvas.style.transform = 'scale(16)';
        gl.uniform1i(gl.getUniformLocation(program, 'uCanvasHeight'), 8);
        gl.uniform1i(gl.getUniformLocation(program, 'uCanvasTilesPerRow'), 1);
        gl.viewport(0, 0, 8, 8);
    }

    if (ctx.editMode === 1) // 48x48
    {
        canvas.width = 48;
        canvas.height = 48;
        canvas.style.transform = 'scale(16)';
        gl.uniform1i(gl.getUniformLocation(program, 'uCanvasHeight'), 48);
        gl.uniform1i(gl.getUniformLocation(program, 'uCanvasTilesPerRow'), 6);
        gl.viewport(0, 0, 48, 48);
    }

    refreshCanvas(ctx);
}

export function main()
{
    const VERSION = "0.1.0";

    const defaultProject = {
        version: VERSION,
        project_version: 0,
        pattern_data: [
            0,
            0,
            0,
            0,
        ],
    };

    const ctx = {
        canvas: null,
        gl: null,
        program: null,
        currentProject: null,
        //
        currentPattern: 0,
        editMode: 0,
    };

    ctx.currentProject = defaultProject;

    const canvas = document.createElement('canvas');
    ctx.canvas = canvas;



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

    const patternDataTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, patternDataTexture);
    const patternData = ctx.currentProject.pattern_data;
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uPatternDataTexture'), 0);

    updateEditMode(ctx);

    document.querySelector('#test').appendChild(canvas);

    onProjectLoaded(ctx);

    canvas.addEventListener('mousedown', (e) => draw(ctx, e));
    canvas.addEventListener('mousemove', (e) => {
        if (e.buttons & 1 === 1)
        {
            draw(ctx, e);
        }
    });

    document.querySelector('#action-open-file').addEventListener('click', () => {
        const inputFileElement = document.querySelector('#input-file');
        inputFileElement.click();
    });

    document.querySelector('#input-file').addEventListener('change', async (e) => {
        const file = e.target.files.item(0);
        const newProject = JSON.parse(await file.text());
        ctx.currentProject = newProject;
        onProjectLoaded(ctx);
    });

    document.querySelector('#action-save-file').addEventListener('click', () => {
        ctx.currentProject.project_version++;
        const objectURL = URL.createObjectURL(new Blob([JSON.stringify(ctx.currentProject)], {type: 'application/json'}));
        const anchor = document.querySelector('#output-file');
        anchor.download = 'untitled_v1.json';
        anchor.href = objectURL;
        anchor.click();
    });

    document.querySelector('#pattern-count').addEventListener('change', (e) => {
        const newVal = e.target.value;
        console.log(`changed pattern count from ${'unknown'} to ${e.target.value}`);
        ctx.currentProject.pattern_data = [...ctx.currentProject.pattern_data, ...[0, 0, 0, 0]];
        onProjectLoaded(ctx);

        ctx.currentPattern = newVal - 1;
        document.querySelector('#current-pattern').value = ctx.currentPattern;
        refreshCanvas(ctx);
    });

    document.querySelector('#current-pattern').addEventListener('change', (e) => {
        ctx.currentPattern = parseInt(e.target.value);
        refreshCanvas(ctx);
    });

    document.querySelectorAll('input[type="radio"][name="edit-mode"]').forEach((x) => x.addEventListener('click', (e) => {
        const newEditMode = parseInt(e.target.dataset.value);
        ctx.editMode = newEditMode;
        updateEditMode(ctx);
    }));
}
