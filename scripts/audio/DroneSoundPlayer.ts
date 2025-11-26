import { MultiOscPlayer } from "./MultiOscPlayer";

/**
 * Manages multiple drone sound.
 * 
 * Only construct this class in a client context.
 */
export class DroneSoundPlayer extends MultiOscPlayer
{
    addAndPlayDroneOscillator(
        freq: number, attack_time: number = 0.5,
        oscillator_option: OscillatorOptions = {}, gain_option: GainOptions = {}
    )
    {
        const [id, entry] = this.addDroneOscillator(oscillator_option, gain_option)
        const { oscillator, gain } = entry
        oscillator.frequency.value = freq
        oscillator.start(this.audio_context.currentTime)
        gain.gain.value = 0
        gain.gain.exponentialRampToValueAtTime(1, this.audio_context.currentTime + attack_time)

        return [id, entry] as const
    }

    addDroneOscillator(oscillator_option: OscillatorOptions = {}, gain_option: GainOptions = {})
    {
        const [id, entry] = this.createAndAddEntry(oscillator_option, gain_option)

        return [id, entry] as const
    }

    removeDroneOscillator(id: string)
    {
        super.removeEntry(id)
    }

    /**
     * Stop all drones.
     */
    stop()
    {
        super.stop()
    }
}