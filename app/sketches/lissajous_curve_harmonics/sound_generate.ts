import { DroneSoundPlayer } from "@/scripts/audio/DroneSoundPlayer";
import { LissajousAction, LissajousCurve, LissajousState } from "./lissajous_curve";
import { convertBeatToDuration, convertMIDINumberToFrequency, getJustIntonationFrequencyFromC, MusicContext } from "@/utils/music";
import { generateRandomNumberOfRange, generateRandomNumberSkewedMin, getWeightedChoice } from "@/utils/math";


/**
 * Has 2 drones to play.
 * 
 * Manage the update of lissajous curve.
 */
export class LissajousSoundPlayer extends DroneSoundPlayer
{
    osc_1__ref: OscillatorNode

    gain_1__ref: GainNode

    osc_2__ref: OscillatorNode

    gain_2__ref: GainNode

    lissajous_curve: LissajousCurve

    music_context: MusicContext

    unsubscribeLissajousUpdate: () => any

    constructor(lissajous_curve: LissajousCurve)
    {
        super()

        const [, { oscillator: oscillator_1, gain: gain_1 }] = this.addDroneOscillator()
        this.osc_1__ref = oscillator_1
        this.gain_1__ref = gain_1

        const [, { oscillator: oscillator_2, gain: gain_2 }] = this.addDroneOscillator()
        this.osc_2__ref = oscillator_2
        this.gain_2__ref = gain_2

        this.lissajous_curve = lissajous_curve
        this.unsubscribeLissajousUpdate = lissajous_curve.useLissajousCurveParamStore.subscribe(
            this.updateParam.bind(this)
        )

        this.music_context = new MusicContext()
        this.music_context.bpm = 120
        this.music_context.base_note = 69 // A4
    }

    updateParam(state: LissajousState & LissajousAction)
    {
        // Change wave form.
        const a = state.a
        const b = state.b
        const a_freq = getJustIntonationFrequencyFromC(a, convertMIDINumberToFrequency(this.music_context.base_note))
        const b_freq = getJustIntonationFrequencyFromC(b, convertMIDINumberToFrequency(this.music_context.base_note))

        this.osc_1__ref.frequency.exponentialRampToValueAtTime(a_freq, this.audio_context.currentTime + 0.01)
        this.osc_2__ref.frequency.exponentialRampToValueAtTime(b_freq, this.audio_context.currentTime + 0.01)
    }

    /**
     * Start the drone.
     */
    start()
    {
        if (this.audio_context.state == "running")
        {
            this.process()
            this.osc_1__ref.start(this.audio_context.currentTime)
            this.osc_2__ref.start(this.audio_context.currentTime)
        }
    }

    stop()
    {
        if (this.audio_context.state == "running")
        {
            super.stop()
            window.clearTimeout(this.process__setTimeout_id)
            this.unsubscribeLissajousUpdate()
        }
    }

    process__setTimeout_id: number = -1
    readonly pattern_and_weight_map = new Map([
        ["one_quater", 10], ["two_quater", 5], ["full_note", 2],
        // ["triplet", 1]
    ] as const)
    readonly pattern_array = [...this.pattern_and_weight_map.keys()]
    readonly weight_array = [...this.pattern_and_weight_map.values()]
    /**
     * Start music process.
     * 
     * @param
     */
    process(should_schedule_next: boolean = true)
    {
        const param_store = this.lissajous_curve.useLissajousCurveParamStore.getState()
        let new_a = Math.round(generateRandomNumberSkewedMin(1, 10, 2))
        let new_b = Math.round(generateRandomNumberSkewedMin(1, 10, 2))
        if (Math.abs(new_a - new_b) == 1) // Avoid colliding.
        {
            const new_offset = Math.round(generateRandomNumberOfRange(2, 4))
            new_a < new_b
                ? new_a += new_offset
                : new_b += new_offset
        }
        param_store.setA(new_a)
        param_store.setB(new_b)
        this.updateParam(param_store)

        if (!should_schedule_next)
        {
            return
        }

        // Schedule next:
        switch (getWeightedChoice(this.pattern_array, this.weight_array))
        {
            case "one_quater": {
                this.process__setTimeout_id = window.setTimeout(
                    this.process.bind(this), convertBeatToDuration(1, this.music_context.bpm) * 1000
                )
            } break

            case "two_quater": {
                this.process__setTimeout_id = window.setTimeout(
                    this.process.bind(this), convertBeatToDuration(2, this.music_context.bpm) * 1000
                )
            } break

            case "full_note": {
                this.process__setTimeout_id = window.setTimeout(
                    this.process.bind(this), convertBeatToDuration(4, this.music_context.bpm) * 1000
                )
            } break

            // case "triplet": {
            //     this.process__setTimeout_id = window.setTimeout(
            //         () => this.process(/* should_schedule_next: */ false), convertBeatToDuration(1 / 3, this.music_context.bpm) * 1000
            //     )
            //     this.process__setTimeout_id = window.setTimeout(
            //         () => this.process(/* should_schedule_next: */ false), convertBeatToDuration(1 / 3, this.music_context.bpm) * 1000
            //     )
            //     this.process__setTimeout_id = window.setTimeout(
            //         () => this.process(/* should_schedule_next:  */ true), convertBeatToDuration(1 / 3, this.music_context.bpm) * 1000
            //     )
            // } break
        }
    }
}