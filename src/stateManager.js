function pushState(ctx, screen)
{
    screen.init(ctx, screen);
    ctx.screenStack.push(screen);
}

function popState(ctx)
{
    ctx.screenStack.pop();
}

export const StateManager = {
    pushState: pushState,
    popState: popState,
};
