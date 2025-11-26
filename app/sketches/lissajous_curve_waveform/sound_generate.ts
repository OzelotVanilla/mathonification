import { DroneSoundPlayer } from "@/scripts/audio/DroneSoundPlayer";
import { lcm } from "@/utils/math";
import { LissajousAction, LissajousCurve, LissajousState } from "../lissajous_curve_harmonics/lissajous_curve";

const length_of_waveform_array = 50

/**
 * Has only one drone to play.
 * 
 * Manage the update of lissajous curve.
 */
export class LissajousSoundPlayer extends DroneSoundPlayer
{
    osc__ref: OscillatorNode

    gain__ref: GainNode

    lissajous_curve: LissajousCurve

    wave_form_dict: Map<`${number},${number}`, PeriodicWave>

    unsubscribeLissajousUpdate: () => any

    constructor(lissajous_curve: LissajousCurve)
    {
        super()

        const [_, { oscillator, gain }] = this.addDroneOscillator()
        this.osc__ref = oscillator
        this.osc__ref.frequency.value = 110
        this.gain__ref = gain

        this.lissajous_curve = lissajous_curve
        this.unsubscribeLissajousUpdate = lissajous_curve.useLissajousCurveParamStore.subscribe(
            this.updateParam.bind(this)
        )

        this.wave_form_dict = new Map()
    }

    updateParam(state: LissajousState & LissajousAction, prev_state: LissajousState & LissajousAction)
    {
        // Change wave form.
        const a = state.a
        const b = state.b
        const phi = state.phi

        // Change waveform if `a` or `b` changes.
        if (a != prev_state.a || b != prev_state.b)
        {
            const a_b = `${a},${b}` as const
            if (!this.wave_form_dict.has(a_b))
            {
                this.wave_form_dict.set(a_b, this.createPeriodicWaveFrom(a, b))
            }

            this.osc__ref.setPeriodicWave(this.wave_form_dict.get(a_b)!)
        }

        if (phi != prev_state.phi)
        {
            // this.osc__ref.frequency.value = mapLinearToExp(phi, 0, 2 * Math.PI, 440, 880)
        }
    }

    createPeriodicWaveFrom(a: number, b: number)
    {
        const least_common_muler = lcm(a, b)
        const len = least_common_muler + 1
        let array_a = new Float32Array(len).fill(0)
        let array_b = new Float32Array(len).fill(0)

        for (let i = 0; i < least_common_muler; i++)
        {
            const phase = Math.PI / 10 * i
            array_a[i] = (Math.sin(a * phase) + 1) / 2
            array_b[i] = (Math.sin(b * phase) + 1) / 2
        }

        console.log(array_a, array_b)

        return this.audio_context.createPeriodicWave(array_a, array_b, { disableNormalization: false })
    }

    /**
     * Start the drone.
     */
    start()
    {
        if (this.audio_context.state == "running")
        {
            const param_store = this.lissajous_curve.useLissajousCurveParamStore.getState()
            this.updateParam(param_store, { ...param_store, a: -Infinity, b: -Infinity, phi: -Infinity })
            this.osc__ref.start(this.audio_context.currentTime)
        }
    }

    stop()
    {
        if (this.audio_context.state == "running")
        {
            super.stop()
            this.unsubscribeLissajousUpdate()
        }
    }
}