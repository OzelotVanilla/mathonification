import { DroneSoundPlayer } from "@/scripts/audio/DroneSoundPlayer";
import { Animal } from "@/scripts/ecosystem/Animal";
import { Bait } from "@/scripts/ecosystem/Bait";
import { Ecosystem } from "@/scripts/ecosystem/Ecosystem";
import { clamp, generateRandomNumberOfRange, mapLinearToExp, mapLinearToLinear, Vec2 } from "@/utils/math";
import { MusicContext, MusicScale } from "@/utils/music";
import { SoundManager } from "@/utils/SoundManager";

export class MusicalEcosystem extends DroneSoundPlayer
{
    ecosystem: Ecosystem = new Ecosystem()

    music_context: MusicContext = new MusicContext()

    // osc_1__ref: OscillatorNode

    // gain_1__ref: GainNode

    // osc_2__ref: OscillatorNode

    // gain_2__ref: GainNode

    observing_animal_1: Animal | null = null

    observing_animal_2: Animal | null = null

    constructor()
    {
        super()
        // const [, { oscillator: oscillator_1, gain: gain_1 }] = this.addAndPlayDroneOscillator(440)
        // this.osc_1__ref = oscillator_1
        // this.osc_1__ref.frequency.value = 440
        // this.gain_1__ref = gain_1
        // this.gain_1__ref.gain.value = 0.8

        // const [, { oscillator: oscillator_2, gain: gain_2 }] = this.addAndPlayDroneOscillator(440)
        // this.osc_2__ref = oscillator_2
        // this.osc_2__ref.frequency.value = 440
        // this.gain_2__ref = gain_2
        // this.gain_2__ref.gain.value = 0.8

        this.music_context.bpm = 120
        this.music_context.music_scale = MusicScale.major
        const scale_offset = this.music_context.getScale()

        this.ecosystem.onEatingHappen = (something: Animal | Bait) =>
        {
            SoundManager.playNote(
                this.music_context.base_note + scale_offset[Math.floor(something.mass_level) % scale_offset.length]
            )
        }

    }

    /**
     * The last time this class choose the animal to be observed.
     */
    last_time__update__choose_observing__timestamp = -Infinity

    /**
     * Let the ecosystem update, and the music will also change.
     */
    update()
    {
        this.ecosystem.update()

        const now = performance.now()
        if (now - this.last_time__update__choose_observing__timestamp > 60 / this.music_context.bpm * 2 * 1000)
        {
            this.observing_animal_1 = this.ecosystem.pickRandomAnimal()
            do
            {
                this.observing_animal_2 = this.ecosystem.pickRandomAnimal()
            } while (this.observing_animal_1 == this.observing_animal_2)

            const screen_center = this.ecosystem.getCenterCoord()
            const { x: screen_center__x, y: screen_center__y } = screen_center

            // const freq_1 = mapLinearToExp(
            //     this.observing_animal_1.velocity.getAngle(),
            //     0, 2 * Math.PI,
            //     220, 440,
            //     2 // exp base
            // ) + mapLinearToLinear(
            //     this.observing_animal_1.position.getDistanceTo(Vec2.zero),
            //     0, Math.min(screen_center__x, screen_center__y) * 1.5,
            //     22, 102
            // )
            // const freq_2 = mapLinearToExp(
            //     this.observing_animal_2.velocity.getAngle(),
            //     0, 2 * Math.PI,
            //     220, 440,
            //     2 // exp base
            // ) + mapLinearToLinear(
            //     this.observing_animal_2.position.getDistanceTo(Vec2.zero),
            //     0, Math.min(screen_center__x, screen_center__y) * 1.5,
            //     22, 102
            // )

            // this.osc_1__ref.frequency.linearRampToValueAtTime(freq_1, this.audio_context.currentTime + 0.1)
            // this.osc_2__ref.frequency.linearRampToValueAtTime(freq_2, this.audio_context.currentTime + 0.1)
            // this.osc_1__ref.frequency.value = freq_1
            // const midi_num_1 = Math.floor(mapLinearToLinear(
            //     clamp(0, this.observing_animal_1.position.getDistanceTo(Vec2.zero), Math.min(screen_center__x, screen_center__y)),
            //     0, Math.min(screen_center__x, screen_center__y) * 1.5,
            //     22, 102
            // ))
            // SoundManager.playNote(midi_num_1)

            this.last_time__update__choose_observing__timestamp = now
        }

    }

    /**
     * Get current window size and set it to ecosystem's size.
     */
    resize()
    {
        this.ecosystem.viewport__x = window.innerWidth
        this.ecosystem.viewport__y = window.innerHeight
    }

    receiveScreenClick(client_x: number, client_y: number)
    {
        const screen_center__x = this.ecosystem.viewport__x / 2
        const screen_center__y = this.ecosystem.viewport__y / 2

        // Add bait to that position.
        this.ecosystem.addBait(
            new Bait(
                new Vec2(client_x - screen_center__x, client_y - screen_center__y),
                generateRandomNumberOfRange(1, 4)
            )
        )
    }
}