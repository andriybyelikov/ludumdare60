import { AUDIO_ARRANGEMENTS } from "../../data/audio/audio_arrangements";
import { CREATURE_DB, CREATURE_ENUM } from "../../data/content/creature_db";
import { DATA_ARRANGEMENTS } from "../../data/video/arrangements";
import { UI_CONSTANTS } from "../../data/video/ui_constants";
import { AudioManager } from "../audioManager";
import { onChangedPlaying } from "../main";
import { VideoManager } from "../videoManager";

// state 0: choosing option
// state 1: chose command

function init(ctx, self)
{
    const adversaryCreatureDice = Math.floor(Math.random() * 4);
    const advocateCreatureDice = Math.floor(Math.random() * 4);

    self.adversaryCreature = CREATURE_DB[adversaryCreatureDice];
    self.advocateCreature = CREATURE_DB[advocateCreatureDice];

    self.adversaryLife = self.adversaryCreature.maxLife;
    self.advocateLife = self.advocateCreature.maxLife;

    const adversarySprite = VideoManager.generateCreatureSprite(self.adversaryCreature.patternStartIndex);
    const advocateSprite = VideoManager.generateCreatureSprite(self.advocateCreature.patternStartIndex);

    VideoManager.clearScreen(ctx.backgroundBuffer);


    VideoManager.copy2D(ctx.backgroundBuffer, [1, 0], adversarySprite);
    VideoManager.copyText(ctx.backgroundBuffer, [20 - 1 - 12, 0 + 1], self.adversaryCreature.name);


    VideoManager.copy2D(ctx.backgroundBuffer, [1 + 12, 6], advocateSprite);
    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 1], self.advocateCreature.name);


    


    AudioManager.pushSong(ctx, AUDIO_ARRANGEMENTS.BGM_BATTLE, true);
}

function update(ctx, timestamp, self)
{
    if (self.state === 0)
    {
        if (ctx.inputState.up[1] - ctx.inputState.up[0] === 1)
        {
            if (0 < self.optionCursor)
            {
                self.optionCursor--;
            }
        }
        else
        if (ctx.inputState.down[1] - ctx.inputState.down[0] === 1)
        {
            if (self.optionCursor < 4 - 1)
            {
                self.optionCursor++;
            }
        }
        else
        if (ctx.inputState.a[1] - ctx.inputState.a[0] === 1)
        {
            if (self.optionCursor === 0)
            {
                if (self.advocateFuture.length === 0)
                {
                    self.state = 1;
                }
                else
                {
                    self.state = 2;
                }
            }
            else
            if (self.optionCursor === 1 && self.advocateFuture.length === 0)
            {
                for (let i = 0; i < 10; i++)
                {
                    const futureDice = Math.floor(Math.random() * 10);
                    self.advocateFuture.push(futureDice);
                }

                for (let i = 0; i < 10; i++)
                {
                    const futureDice = Math.floor(Math.random() * 10);
                    self.adversaryFuture.push(futureDice);
                }

                self.state = 0;
            }
        }
    }
    else if (self.state === 1)
    {
        if (ctx.inputState.a[1] - ctx.inputState.a[0] === 1)
        {
            self.state = 0;
        }
    }
    else
    if (self.state === 2)
    {
        if (ctx.inputState.left[1] - ctx.inputState.left[0] === 1)
        {
            if (0 < self.futureCursor)
            {
                self.futureCursor--;
            }
        }
        else
        if (ctx.inputState.right[1] - ctx.inputState.right[0] === 1)
        {
            if (self.futureCursor < self.advocateFuture.length - 1)
            {
                self.futureCursor++;
            }
        }
        else
        if (ctx.inputState.a[1] - ctx.inputState.a[0] === 1)
        {
            const advocateDamageDealt = self.advocateFuture[self.futureCursor];
            self.advocateFuture = [
                ...self.advocateFuture.slice(0, self.futureCursor),
                ...self.advocateFuture.slice(self.futureCursor + 1),
            ];
            self.adversaryLife = Math.max(0, self.adversaryLife - advocateDamageDealt);

            let adversaryCursor = 0;

            if (self.adversaryCreature.posessesToM)
            {
                adversaryCursor = Math.floor(Math.random() * self.adversaryFuture.length);
            }

            const adversaryDamageDealt = self.adversaryFuture[adversaryCursor];
            self.adversaryFuture = [
                ...self.adversaryFuture.slice(0, self.futureCursor),
                ...self.adversaryFuture.slice(self.futureCursor + 1),
            ];
            self.advocateLife = Math.max(0, self.advocateLife - adversaryDamageDealt);

            if (self.advocateLife === 0 || self.adversaryLife === 0)
            {
                self.state = 3;
            }
            else
            {
                self.futureCursor = 0;
                self.state = 0;
            }
        }
    }
    else
    if (self.state === 3)
    {
        onChangedPlaying(ctx, false);
        AudioManager.popSong(ctx);
    }
}

function renderOptions(ctx, self)
{
    VideoManager.copy2D(ctx.backgroundBuffer, UI_CONSTANTS.TEXT_BOX_ANCHOR, DATA_ARRANGEMENTS.TEXT_BOX);
    VideoManager.copyText(ctx.backgroundBuffer, [2, 18 - 5 + 0], 'ATTACK');
    VideoManager.copyText(ctx.backgroundBuffer, [2, 18 - 5 + 1], 'DIVINATION');
    VideoManager.copyText(ctx.backgroundBuffer, [2, 18 - 5 + 2], 'X CHARM');
    VideoManager.copyText(ctx.backgroundBuffer, [2, 18 - 5 + 3], 'X TURN AWAY');
}

function render(ctx, self)
{
    VideoManager.copyText(ctx.backgroundBuffer, [7, 2], `        `);
    VideoManager.copyText(ctx.backgroundBuffer, [7, 2], `Life ${self.adversaryLife}`);

    VideoManager.copyText(ctx.backgroundBuffer, [7, 4], "           ");
    VideoManager.copy2D(ctx.backgroundBuffer, [7, 4], DATA_ARRANGEMENTS.EYE);
    VideoManager.copyText(ctx.backgroundBuffer, [8, 4], self.adversaryFuture.join(''));

    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 2], `       `);
    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 2], `Life ${self.advocateLife}`);

    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 4], "           ");
    VideoManager.copy2D(ctx.backgroundBuffer, [0, 6 + 5], DATA_ARRANGEMENTS.EYE);
    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 5], "           ");
    VideoManager.copyText(ctx.backgroundBuffer, [1, 6 + 5], self.advocateFuture.join(''));

    if (self.state === 0)
    {
        renderOptions(ctx, self);
        VideoManager.copy2D(ctx.backgroundBuffer, [1, 18 - 5 + self.optionCursor], DATA_ARRANGEMENTS.ARROW_DOWN);
    }
    else
    if (self.state === 1)
    {
        VideoManager.copy2D(ctx.backgroundBuffer, UI_CONSTANTS.TEXT_BOX_ANCHOR, DATA_ARRANGEMENTS.TEXT_BOX);
        VideoManager.copyText(ctx.backgroundBuffer, [1, 18 - 6 + 2], "No future!");
    }
    else
    if (self.state === 2)
    {
        VideoManager.copyText(ctx.backgroundBuffer, [1, 18 - 6 - 2], "          ");
        VideoManager.copy2D(ctx.backgroundBuffer, [1 + self.futureCursor, 18 - 6 - 2], DATA_ARRANGEMENTS.ARROW_DOWN);
    }
    
}

export const ScreenBattle = {
    init: init,
    update: update,
    render: render,

    adversaryCreature: null,
    advocateCreature: null,
    adversaryLife: 0,
    advocateLife: 0,

    adversaryFuture: [],
    advocateFuture: [],

    state: 0,
    optionCursor: 0,
    futureCursor: 0,
};
