import { MusicContext } from "@/utils/music"


/**
 * When the singing text facility is not focus,
 *  this player will play ambient music according to time.
 */
export abstract class AmbientPlayer
{
    // /**
    //  * The time when the class is inited.
    //  * 
    //  * Should be the time retrieved from `performance.now`.
    //  */
    // start_time__timestamp: number

    /**
     * Should be inited after class creation.
     */
    music_context__ref: MusicContext

    /**
     * Control the desired panning.
     */
    abstract set master_panning(value: number)

    /**
     * Control the desired gain value.
     */
    abstract set master_gain_value(value: number)

    /**
     * Receive latest timing information.
     */
    abstract update(measure: number, beat: number): void

    /**
     * Ramp master gain value of the player.
     */
    abstract linearRampGainTo(value: number, in_n_milliseconds: number): void

    static active_ambient_player__refs: Set<AmbientPlayer> = new Set()

    /**
     * Let all active ambient player fade-out (turn gain to 0) in n milliseconds.
     */
    static fadeOutGain(in_n_milliseconds: number)
    {
        for (const player of this.active_ambient_player__refs)
        {
            player.linearRampGainTo(0, in_n_milliseconds)
        }
    }

    /**
     * Let all active ambient player fade-in (turn gain to 1) in n milliseconds.
     */
    static fadeInGain(in_n_milliseconds: number)
    {
        for (const player of this.active_ambient_player__refs)
        {
            player.linearRampGainTo(1, in_n_milliseconds)
        }
    }

    constructor(music_context__ref: MusicContext)
    {
        this.music_context__ref = music_context__ref
    }

    dispose(): void { }
}