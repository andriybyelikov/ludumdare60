function pushSong(ctx, song, loop)
{
    ctx.periodStack.push(60 / song.bpm);
    ctx.songStack.push(song);
    ctx.songLoopStack.push(loop);
    ctx.noteCursorStack.push(0);
    ctx.timestampLastNoteStack.push(0);
    ctx.playing = true;
}

function popSong(ctx)
{
    ctx.playing = false;
    ctx.periodStack.pop();
    ctx.songStack.pop();
    ctx.songLoopStack.pop();
    ctx.noteCursorStack.pop();
    ctx.timestampLastNoteStack.pop();
}

export const AudioManager = {
    pushSong: pushSong,
    popSong: popSong,
};
