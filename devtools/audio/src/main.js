import { createPeriodicWaveSquareWithDutyCycleRatio, getSystemaTeleionMeizonDiatonosStringLengths } from "../../../lib/music.js";

/* constants */

const BASE_FREQUENCY = 220;
const INSTRUMENT_COUNT = 4;

function getDefaultPattern()
{
    return {
        name: 'Untitled',
        bpm: 90,
        pattern_data: Array(INSTRUMENT_COUNT * 4).fill('hesyche'),
    };
}

/* components */

function createComponentStringName(name, isHestote)
{
    return `
        <div class="string-name ${isHestote ? 'hestote' : ''}">
            ${name}
        </div>
    `;
}

function createComponentNote(name, isHestote, instrumentId, t)
{
    return `
        <div class="note ${isHestote ? 'hestote' : ''}">
            <input type="radio" name="instrument-${instrumentId}-note-${t}" data-value="${name}">
        </div>
    `;
}

function dumpNotesOntoRoll(ctx)
{
    document.querySelectorAll('.string-roll').forEach((stringRollElement) => {
        const instrumentId = parseInt(stringRollElement.dataset.instrumentId);

        for (let i = 0; i < ctx.noteCount[0]; i++)
        {
            const stringName = ctx.currentProject.patterns[ctx.currentPattern].pattern_data[i * INSTRUMENT_COUNT + instrumentId];
            stringRollElement.querySelector(
                `input[type="radio"][name="instrument-${instrumentId}-note-${i}"][data-value="${stringName}"]`
            ).checked = true;
        }
    });
}

function updateStringRollComponent(ctx, stringRollElement, instrumentId)
{
    const difference = ctx.noteCount[1] - ctx.noteCount[0];

    if (0 < difference)
    {
        for (let i = ctx.noteCount[0]; i < ctx.noteCount[1]; i++)
        {
            for (const name of ctx.sortedStringNames)
            {
                const isHestote = !name.endsWith('diatonos');
                stringRollElement.insertAdjacentHTML('beforeend', createComponentNote(name, isHestote, instrumentId, i));
                stringRollElement.lastElementChild.addEventListener('click', () => setNoteInModel(ctx, instrumentId, i, name));
            }
        }
    }
    else if (difference < 0)
    {
        for (let i = 0; i < -difference; i++)
        {
            for (const name of ctx.sortedStringNames)
            {
                stringRollElement.removeChild(stringRollElement.lastElementChild);
            }
        }
    }
}

function initStringRollComponent(ctx, stringRollElement)
{
    for (const name of ctx.sortedStringNames)
    {
        const isHestote = !name.endsWith('diatonos');
        stringRollElement.insertAdjacentHTML('beforeend', createComponentStringName(name, isHestote));
    }
}

/* ui events */

function setNoteInModel(ctx, instrumentId, t, stringName)
{
    ctx.currentProject.patterns[ctx.currentPattern].pattern_data[t * INSTRUMENT_COUNT + instrumentId] = stringName;
}

function onChangeBPM(ctx, newValue)
{
    ctx.bpm = newValue;
    ctx.period = 60 / ctx.bpm;
    document.querySelector('#bpm').value = ctx.bpm;
    ctx.currentProject.patterns[ctx.currentPattern].bpm = newValue;
}

function updateStringRolls(ctx)
{
    document.querySelectorAll('.string-roll').forEach(x => {
        updateStringRollComponent(ctx, x, parseInt(x.dataset.instrumentId));
    });

    ctx.noteCount[0] = ctx.noteCount[1];
    dumpNotesOntoRoll(ctx);
}

function onChangeNoteCount(ctx, newValue)
{
    ctx.noteCount[1] = newValue;
    const difference = ctx.noteCount[1] - ctx.noteCount[0];

    const oldPatternData = ctx.currentProject.patterns[ctx.currentPattern].pattern_data;

    if (0 < difference)
    {
        const newPatternData = [...oldPatternData, ...Array(INSTRUMENT_COUNT * difference).fill('hesyche')];
        ctx.currentProject.patterns[ctx.currentPattern].pattern_data = newPatternData;
    }
    else if (difference < 0)
    {
        const newPatternData = oldPatternData.slice(0, difference * INSTRUMENT_COUNT);
        ctx.currentProject.patterns[ctx.currentPattern].pattern_data = newPatternData;
    }

    updateStringRolls(ctx);
}

function onChangedPlaying(ctx, newValue)
{
    console.log(newValue);
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

function onStopped(ctx)
{
    onChangedPlaying(ctx, false);
    document.querySelector('#playing').checked = false;
    ctx.noteCursor = -1;
}

function onChangedLoop(ctx, newValue)
{
    ctx.loop = newValue;
}

function refreshPatternList(ctx)
{
    const selectElement = document.querySelector('#select-pattern');

    while (selectElement.lastElementChild !== null)
    {
        selectElement.removeChild(selectElement.lastElementChild);
    }

    for (let i = 0; i < ctx.currentProject.patterns.length; i++)
    {
        const pattern = ctx.currentProject.patterns[i];
        const option = document.createElement('option');
        option.value = i;
        option.text = pattern.name;
        selectElement.add(option, null);
    }

    selectElement.selectedIndex = ctx.currentPattern;
}

function onPatternRenamed(ctx)
{
    const newName = document.querySelector('#pattern-name').value;
    ctx.currentProject.patterns[ctx.currentPattern].name = newName;
    refreshPatternList(ctx);
}

function onPatternAdded(ctx)
{
    ctx.currentProject.patterns.push(getDefaultPattern());
    refreshPatternList(ctx);
}

function onPatternSelected(ctx, selectedIndex)
{
    onStopped(ctx);
    ctx.currentPattern = selectedIndex;
    initPattern(ctx);
}

function initPattern(ctx)
{
    const newPattern = ctx.currentProject.patterns[ctx.currentPattern];

    document.querySelector('#pattern-name').value = newPattern.name;
    onChangeBPM(ctx, newPattern.bpm);

    const noteCount = ctx.noteCount[1] = ctx.currentProject.patterns[ctx.currentPattern].pattern_data.length / INSTRUMENT_COUNT;
    document.querySelector('#note-count').value = noteCount;

    updateStringRolls(ctx);
}

function onProjectLoaded(ctx)
{
    document.querySelector('#pattern-name').value = ctx.currentProject.patterns[ctx.currentPattern].name;
    refreshPatternList(ctx);
    initPattern(ctx);
}

/* playback */

function getNoteStringAtTime(instrumentId, t)
{
    return document.querySelector(`input[type="radio"][name="instrument-${instrumentId}-note-${t}"]:checked`).dataset.value;
}

function onRequestAnimationFrame(timestamp, ctx)
{
    if (ctx.playing && ctx.period < (timestamp - ctx.timestampLastNote) * 1e-3)
    {
        ctx.noteCursor++;
        if (ctx.noteCursor == ctx.noteCount[0])
        {
            if (ctx.loop)
            {
                ctx.noteCursor = 0;
            }
            else
            {
                onStopped(ctx);
            }
        }

        if (ctx.playing)
        {
            const t = ctx.noteCursor;

            const sameTime = ctx.audioCtx.currentTime;
            {
                const stringName = getNoteStringAtTime(0, t);
                const stringLength = ctx.stringLengths[stringName];
                const f = BASE_FREQUENCY / stringLength;
                ctx.oscillator1.frequency.setValueAtTime(f, sameTime);
            }
            {
                const stringName = getNoteStringAtTime(1, t);
                const stringLength = ctx.stringLengths[stringName];
                const f = BASE_FREQUENCY / stringLength;
                ctx.oscillator2.frequency.setValueAtTime(f, sameTime);
            }
            {
                const stringName = getNoteStringAtTime(2, t);
                const stringLength = ctx.stringLengths[stringName];
                const f = BASE_FREQUENCY / stringLength;
                ctx.oscillator3.frequency.setValueAtTime(f, sameTime);
            }

            ctx.timestampLastNote = timestamp;
        }
    }

    requestAnimationFrame((timestamp) => onRequestAnimationFrame(timestamp, ctx));
}

export function main()
{
    const VERSION = "0.1.0";

    const defaultProject = {
        version: VERSION,
        project_version: 0,
        patterns: [
            getDefaultPattern(),
        ],
    };

    const ctx = {
        audioCtx: null,
        stringLengths: null,
        sortedStringNames: null,
        //
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

        currentProject: defaultProject,
        currentPattern: 0,

        noteCount: [0, 0],
    };

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
    ctx.sortedStringNames = Object.entries(ctx.stringLengths)
        .toSorted((a, b) => a[1] - b[1])
        .map(x => x[0]);

    document.querySelectorAll('.string-roll').forEach(x => initStringRollComponent(ctx, x));

    onProjectLoaded(ctx);

    document.querySelector('#select-pattern').addEventListener('change', (e) => onPatternSelected(ctx, e.target.selectedIndex));
    document.querySelector('#add-pattern').addEventListener('click', () => onPatternAdded(ctx));
    document.querySelector('#rename-pattern').addEventListener('click', () => onPatternRenamed(ctx));

    document.querySelector('#playing').addEventListener('change', (e) => onChangedPlaying(ctx, e.target.checked));
    document.querySelector('#stop').addEventListener('click', () => onStopped(ctx));
    document.querySelector('#loop').addEventListener('change', (e) => onChangedLoop(ctx, e.target.checked))

    document.querySelector('#bpm').addEventListener('change', (e) => onChangeBPM(ctx, parseInt(e.target.value)));
    document.querySelector('#note-count').addEventListener('change', (e) => onChangeNoteCount(ctx, parseInt(e.target.value)));

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

    requestAnimationFrame((timestamp) => onRequestAnimationFrame(timestamp, ctx));
}
