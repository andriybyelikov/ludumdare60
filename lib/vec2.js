export const vec2 = {
    difference: (a, b) => a.map((_, i) => a[i] - b[i]),
    hadamard: (a, b) => a.map((_, i) => a[i] * b[i]),
    ratio: (a, b) => a.map((_, i) => a[i] / b[i]),
    floor: (v) => v.map((x) => Math.floor(x)),
};
