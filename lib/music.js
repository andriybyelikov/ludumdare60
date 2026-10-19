export function getSystemaTeleionMeizonDiatonosStringLengths()
{
    const dict = {};

    dict['hesyche'] = Number.POSITIVE_INFINITY;

    let diapason = undefined;
    let diatessaron = undefined;
    let tonos = undefined;

    diapason = dict['proslambanomenos'] = 1 / 1;

    diapason = diatessaron = tonos = dict['mese'] = diapason * 1 / 2;

        tonos = dict[ 'lichanos meson diatonos'] = tonos * 9 / 8;
        tonos = dict['parhypate meson diatonos'] = tonos * 9 / 8;

    diatessaron = tonos = dict['hypathe meson'] = diatessaron * 4 / 3;

        tonos = dict[ 'lichanos hypaton diatonos'] = tonos * 9 / 8;
        tonos = dict['parhypate hypaton diatonos'] = tonos * 9 / 8;

    diatessaron = tonos = dict['hypathe hypaton'] = diatessaron * 4 / 3;


    diapason = diatessaron = tonos = dict['nete hyperboleon'] = diapason * 1 / 2;

        tonos = dict['paranete hyperboleon diatonos'] = tonos * 9 / 8;
        tonos = dict[   'trite hyperboleon diatonos'] = tonos * 9 / 8;

    diatessaron = tonos = dict['nete diezeugmenon'] = diatessaron * 4 / 3;

        tonos = dict['paranete diezeugmenon diatonos'] = tonos * 9 / 8;
        tonos = dict[   'trite diezeugmenon diatonos'] = tonos * 9 / 8;

    diatessaron = dict['paramese'] = diatessaron * 4 / 3;

    return dict;
}


export function createPeriodicWaveSquareWithDutyCycleRatio(audioCtx, d)
{
    const n = 128;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    real[0] = 0;
    imag[0] = 0;
    for (let i = 1; i < n; i++)
    {
        real[i] = 2 / (i * Math.PI) * (1 - Math.cos(2 * Math.PI * i * d));
        imag[i] = 2 / (i * Math.PI) * (0 + Math.sin(2 * Math.PI * i * d));
    }
    return audioCtx.createPeriodicWave(real, imag);
}
