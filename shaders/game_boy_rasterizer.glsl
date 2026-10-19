#version 300 es

precision highp float;
precision highp int;
precision highp isampler2D;

out vec4 outColor;

uniform isampler2D uPatternDataTexture;
uniform int uBackgroundData[360];
uniform int uBackgroundDataLength;
uniform int uCanvasHeight;
uniform int uCanvasTilesPerRow;

void main()
{
    int outColorIndex = 0;

    ivec2 p = ivec2(gl_FragCoord.xy);
    p.y = uCanvasHeight - 1 - p.y;
    ivec2 t = p / 8;

    

    int backgroundDataIndex = (t.y * uCanvasTilesPerRow + t.x) % uBackgroundDataLength;
    int patternDataIndex = uBackgroundData[backgroundDataIndex];
    int tileRow = p.y % 8;
    int patternDataBlock32RowIndex = p.y % 2;
    int patternDataBlock32RowPixelIndex = p.x % 8;
    int patternDataBlock32Index = tileRow / 2;
    int patternDataBlock32 = texelFetch(uPatternDataTexture, ivec2(patternDataIndex * 4 + patternDataBlock32Index, 0), 0).r;
    int patternDataBlock32Row = (patternDataBlock32 >> (2 * 8 * patternDataBlock32RowIndex)) & 0xFFFF;
    int patternDataBlock32RowPixel = (patternDataBlock32Row >> (2 * patternDataBlock32RowPixelIndex)) & 0x03;

    outColorIndex = patternDataBlock32RowPixel;


    const vec4 masterPalette[4] = vec4[4]
    (
        vec4(vec3(float(0x30 * 4 + 0x10) / float(0xFF)), 1.0),
        vec4(vec3(float(0x30 * 3 + 0x10) / float(0xFF)), 1.0),
        vec4(vec3(float(0x30 * 2 + 0x10) / float(0xFF)), 1.0),
        vec4(vec3(float(0x30 * 1 + 0x10) / float(0xFF)), 1.0)
    );

    outColor = masterPalette[outColorIndex];
}
