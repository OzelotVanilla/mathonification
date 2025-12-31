import { just_intonation_ratio_array } from "./constants"


/**
 * Assume signature is `4 / 4` currently.
 */
export class MusicContext
{
    /**
     * 0 means C, until 11, 11 means B.
     */
    current_major: number = 0

    get current_major_midi() { return this.base_note + this.current_major }

    /**
     * Pivot of the calculation. In midi number. Default to C4.
     * 
     * Used together with `current_major` to get the midi number of starting number of that major.
     */
    base_note: number = 60

    setMajorUp(value: number)
    {
        this.current_major = (this.current_major + value) % 12
    }

    setMajorDown(value: number)
    {
        // In case of negative number.
        this.current_major = ((this.current_major - value) % 12 + 12) % 12
    }

    bpm: number = 120

    // TODO: not implemented
    n_beat_in_one_measure: number = 4

    music_scale: MusicScale = MusicScale.major

    getScale(): number[]
    {
        switch (this.music_scale)
        {
            case MusicScale.major:
                return [0, 2, 4, 5, 7, 9, 11]
            case MusicScale.major_five:
                return [0, 2, 4, 7, 9]
            case MusicScale.okinawa:
                return [0, 2, 5, 7, 11]
            case MusicScale.natural_minor:
                return [0, 2, 3, 5, 7, 8, 10]
            case MusicScale.harmonic_minor:
                return [0, 2, 3, 5, 7, 8, 11]
            case MusicScale.melodic_minor:
                return [0, 2, 3, 5, 7, 9, 11]
        }
    }
}

export enum MusicScale
{
    major = "major",
    major_five = "major_five",
    okinawa = "okinawa",
    natural_minor = "natural_minor",
    harmonic_minor = "harmonic_minor",
    melodic_minor = "melodic_minor"
}

export function convertMIDINumberToFrequency(midi_num: number)
{
    return 440 * Math.pow(2, (midi_num - 69) / 12)
}

/**
 * 
 * @param n_th_bigger(range: 0..) How many white keys is above the base C key.
 * @param c_freq The frequency to be used for base C key.
 */
export function getJustIntonationFrequencyFromC(n_th_bigger: number, c_freq: number = 440)
{
    return n_th_bigger > 7
        ? c_freq * Math.floor(n_th_bigger / 7) * 2 * just_intonation_ratio_array[n_th_bigger % 7]
        : c_freq * just_intonation_ratio_array[n_th_bigger]
}

/**
 * @returns Duration in seconds.
 */
export function convertBeatToDuration(n_beat: number, bpm: number)
{
    return (60 / bpm) * n_beat
}