import { DoublePendulum } from "@/scripts/pendulum/DoublePendulum";
import { chord_to_offset_dict } from "@/utils/constants";
import { convertMIDINumberToFrequency, MusicContext } from "@/utils/music";
import { mapLinearToExp, normaliseRadian } from "@/utils/math";
import { isClientEnvironment } from "@/utils/env";

/**
 * Has some random-alike orbiting balls,
 *  which may cross or hovering around the pendulum itself.
 */
export class MusicalDoublePendulum extends DoublePendulum
{
    audio_context: AudioContext

    music_context: MusicContext

    ball_1_osc: OscillatorNode

    master_gain: GainNode

    // orbiting_balls: Ball[] = []

    mapXCoordLinToExp: (x: number) => number

    constructor(
        r1: number = 125,
        r2: number = 125,
        m1: number = 10,
        m2: number = 10,
        g: number = 9.8
    )
    {
        super(r1, r2, m1, m2, g)

        const pendulum_max_length = this.getMaxLength()
        this.mapXCoordLinToExp = (x: number) => mapLinearToExp(
            x, -pendulum_max_length / 2, pendulum_max_length / 2,
            220, 880,
            2
        )

        this.music_context = new MusicContext()
        this.music_context.base_note = 40

        this.audio_context = new AudioContext()

        this.master_gain = this.audio_context.createGain()
        this.master_gain.gain.value = 0.8

        this.ball_1_osc = this.audio_context.createOscillator()
        this.ball_1_osc.type = "sine"
        this.ball_1_osc.frequency.value = 880

        // // Sound related.
        this.updatePosition()
        // this.music_context = new MusicContext()

    }

    next(delta: number): void
    {
        super.next(delta)
        this.updateSound(delta)
    }

    resumeAudioContext()
    {
        this.audio_context.resume()

        this.ball_1_osc.connect(this.master_gain).connect(this.audio_context.destination)

        this.ball_1_osc.start()
        this.master_gain.gain.linearRampToValueAtTime(0.8, this.audio_context.currentTime + 0.8)
    }

    updateSound(delta: number)
    {
        const { x_1, y_1, x_2, y_2 } = this.getPosition()
        this.ball_1_osc.frequency.exponentialRampToValueAtTime(
            convertMIDINumberToFrequency(Math.round((x_1 + this.r1 + this.r2) % 80 / 2) + this.music_context.base_note) + y_1 / 100,
            delta / 1000
        )
    }

    static generatePendulumInUpperArea()
    {
        let pendulum = new MusicalDoublePendulum()
        let a1 = normaliseRadian(Math.random() * Math.PI + Math.PI / 2)
        pendulum.a1 = a1

        return pendulum
    }
}