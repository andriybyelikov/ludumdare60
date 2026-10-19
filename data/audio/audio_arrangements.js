import dataAudio from "./patterns.json";

export const AUDIO_ARRANGEMENTS = {
    SFX_ACCEPT: {
        bpm: dataAudio.patterns[1].bpm,
        data: dataAudio.patterns[1].pattern_data,
    },
    BGM_BATTLE: {
        bpm: dataAudio.patterns[0].bpm,
        data: [
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,

            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,

            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,

            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,

            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,

            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,

            ...dataAudio.patterns[2].pattern_data,
            ...dataAudio.patterns[0].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
            ...dataAudio.patterns[3].pattern_data,
        ],
    },
};
