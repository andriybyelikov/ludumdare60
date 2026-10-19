import { AUDIO_ARRANGEMENTS } from "../../data/audio/audio_arrangements.js";
import { DATA_ARRANGEMENTS } from "../../data/video/arrangements.js";
import { AudioManager } from "../audioManager.js";
import { StateManager } from "../stateManager.js";
import { VideoManager } from "../videoManager.js";
import { ScreenBattle } from "./screenBattle.js";

function init(ctx, self)
{
    self.pressStartVisible = false;
    self.pressStartVisibleLastTimestamp = 0;
    self.delayTimestamp = 0;
}

function update(ctx, timestamp, self)
{
    if (ctx.inputState.start[1] - ctx.inputState.start[0] === 1)
    {
        /* make title screen responsible for starting oscillators on user gesture */
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

        AudioManager.pushSong(ctx, AUDIO_ARRANGEMENTS.SFX_ACCEPT, false);
        
        return;
    }

    if (ctx.finishedPlaying)
    {
        ctx.finishedPlaying = false;
        self.delayTimestamp = timestamp;
    }

    if (0 < self.delayTimestamp && 0.125 < (timestamp - self.delayTimestamp) * 1e-3)
    {
        StateManager.popState(ctx);
        StateManager.pushState(ctx, ScreenBattle);
    }

    if (0.32 < (timestamp - self.pressStartVisibleLastTimestamp) * 1e-3)
    {
        self.pressStartVisible = !self.pressStartVisible;
        self.pressStartVisibleLastTimestamp = timestamp;
    }
}

function render(ctx, self)
{
    VideoManager.clearScreen(ctx.backgroundBuffer);

    VideoManager.copyText(ctx.backgroundBuffer, [6, 2], "T o M");
    VideoManager.copy2D(ctx.backgroundBuffer, [8, 2], DATA_ARRANGEMENTS.EYE);

    VideoManager.copyText(ctx.backgroundBuffer, [3, 4], "LUDUM DARE 60");
    VideoManager.copyText(ctx.backgroundBuffer, [6, 6], "EDITION");

    if (self.pressStartVisible)
    {
        VideoManager.copyText(ctx.backgroundBuffer, [4, 10], "PRESS START");
    }
    else
    {
        VideoManager.copyText(ctx.backgroundBuffer, [4, 10], "           ");
    }

    VideoManager.copyText(ctx.backgroundBuffer, [2, 14], "©2026");
    
    VideoManager.copyText(ctx.backgroundBuffer, [2, 16], "@andriybyelikov");
}

export const ScreenTitle = {
    init: init,
    update: update,
    render: render,

    pressStartVisible: false,
    pressStartVisibleLastTimestamp: 0,
    delayTimestamp: 0,
};
