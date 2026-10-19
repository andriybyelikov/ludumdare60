import { SCREEN_SIZE_TILES } from "../lib/constants";

function copy2D(dst, p, src)
{
    for (let i = 0; i < src.length; i++)
    {
        for (let j = 0; j < src[i].length; j++)
        {
            dst[(p[1] + i) * 20 + (p[0] + j)] = src[i][j];
        }
    }
}

function mapCharacterToPattern(character)
{
    if (character.charCodeAt(0) === ' '.charCodeAt(0))
    {
        return 0;
    }

    if ('A'.charCodeAt(0) <= character.charCodeAt(0) && character.charCodeAt(0) <= 'Z'.charCodeAt(0))
    {
        return character.charCodeAt(0) - 'A'.charCodeAt(0) + 7;
    }

    if ('a'.charCodeAt(0) <= character.charCodeAt(0) && character.charCodeAt(0) <= 'z'.charCodeAt(0))
    {
        return character.charCodeAt(0) - 'a'.charCodeAt(0) + 7 + 26;
    }

    if (character.charCodeAt(0) == "'".charCodeAt(0))
    {
        return 60;
    }

    if (character.charCodeAt(0) == ",".charCodeAt(0))
    {
        return 61;
    }

    if (character.charCodeAt(0) == ".".charCodeAt(0))
    {
        return 62;
    }

    if (character.charCodeAt(0) == "!".charCodeAt(0))
    {
        return 63;
    }

    if (character.charCodeAt(0) == "?".charCodeAt(0))
    {
        return 64;
    }

    if ('0'.charCodeAt(0) <= character.charCodeAt(0) && character.charCodeAt(0) <= '9'.charCodeAt(0))
    {
        return character.charCodeAt(0) - '0'.charCodeAt(0) + 65;
    }

    if (character.charCodeAt(0) == "@".charCodeAt(0))
    {
        return 112;
    }

    if (character.charCodeAt(0) == "©".charCodeAt(0))
    {
        return 113;
    }

    return 0;
}

function copyText(dst, p, text)
{
    return copy2D(dst, p, [text.split('').map(mapCharacterToPattern)]);
}

function clearScreen(dst)
{
    for (let i = 0; i < SCREEN_SIZE_TILES[1]; i++)
    {
        for (let j = 0; j < SCREEN_SIZE_TILES[0]; j++)
        {
            dst[i * 20 + j] = 0;
        }
    }
}

function generateCreatureSprite(patternsStartIndex)
{
    let counter = patternsStartIndex;

    const arr = [];
    for (let i = 0; i < 6; i++)
    {
        const arr0 = [];
        for (let j = 0; j < 6; j++)
        {
            arr0.push(counter);
            counter++;
        }
        arr.push(arr0);
    }

    return arr;
}

export const VideoManager = {
    copy2D: copy2D,
    copyText: copyText,
    clearScreen: clearScreen,
    generateCreatureSprite: generateCreatureSprite,
};
