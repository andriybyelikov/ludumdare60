export function loadShader(gl, type, source)
{
    const shader = gl.createShader(type);

    if (shader === null)
    {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.log(gl.getShaderInfoLog(shader)); // TODO: remove in production
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

export function loadProgram(gl, vertexShader, fragmentShader)
{
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        gl.deleteProgram(program);
        return null;
    }

    return program;
}
