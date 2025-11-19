import { coin, convertDecToSexaDigits } from "@/utils/math"
import { convertMIDINumberToFrequency, MusicContext } from "@/utils/music"

export class MicrotonalityPlayer
{
    audio_context: AudioContext

    music_context: MusicContext

    is_inited = false

    constructor()
    {
        this.audio_context = new AudioContext()

        this.music_context = new MusicContext()
        // Set to A3.
        this.music_context.base_note = 57
    }

    gains: GainNode[] = []
    oscs: OscillatorNode[] = []

    resume()
    {
        this.audio_context.resume()
        this.is_inited = true
    }

    createOscAndGain(count: number)
    {
        this.gains = []
        this.oscs = []
        for (let i = 0; i < count; i++)
        {
            let osc = this.audio_context.createOscillator()
            let gain = this.audio_context.createGain()
            osc.connect(gain).connect(this.audio_context.destination)
            gain.gain.value = 1 / count

            this.oscs.push(osc)
            this.gains.push(gain)
        }
    }

    /**
     * Play the 60-based microtonality.
     * 
     * @param duration In seconds.
     */
    play(numbers: number, duration: number = 0.5)
    {
        let sexa_array = convertDecToSexaDigits(numbers)
        this.createOscAndGain(sexa_array.length)

        const current_time = this.audio_context.currentTime
        // const should_be_arpeggio = coin()
        const should_be_arpeggio = true

        sexa_array.forEach((digit, index) =>
        {
            this.oscs[index].frequency.setValueAtTime(this.convertDigitIntoFreq(digit), current_time)
            this.oscs[index].start(should_be_arpeggio ? current_time + 0.2 * index : current_time)
            this.oscs[index].stop(should_be_arpeggio ? current_time + duration + 0.2 * index : current_time + duration)
            this.gains[index].gain.linearRampToValueAtTime(0, current_time + duration + 0.2 * index - 0.01)
        })
    }

    convertDigitIntoFreq(digit: number)
    {
        return convertMIDINumberToFrequency(this.music_context.base_note) * Math.pow(2, digit / 60)
    }
}