/**
 * Class that contains multiple osc and corresponding gain,
 *  connected to a master gain, and then the destination.
 * 
 * Only construct this class in a client context.
 */
export abstract class MultiOscPlayer
{
    audio_context: AudioContext

    osc_gain_dict: Map<string, MultiOscEntry>

    master_gain: GainNode

    constructor()
    {
        this.audio_context = new AudioContext()
        this.osc_gain_dict = new Map()
        this.master_gain = this.audio_context.createGain()
        this.master_gain.connect(this.audio_context.destination)
    }

    public resume()
    {
        this.audio_context.resume()
    }

    public suspend()
    {
        this.audio_context.suspend()
    }

    public stop()
    {
        this.osc_gain_dict.keys().forEach(k => this.removeEntry(k))
    }

    /**
     * Create the oscillator and gain (standard entry), and add them to dict.
     * 
     * Return the ID and entry.
     */
    protected createAndAddEntry(oscillator_option: OscillatorOptions = {}, gain_option: GainOptions = {}): [string, MultiOscEntry]
    {
        let oscillator = new OscillatorNode(this.audio_context, oscillator_option)
        let gain = new GainNode(this.audio_context, gain_option)
        let entry = { oscillator, gain }
        let uuid = crypto.randomUUID()

        oscillator.connect(gain).connect(this.master_gain)
        oscillator.addEventListener("ended", () => this.removeEntry(uuid))

        this.addEntry(uuid, entry)

        return [uuid, entry] as const
    }

    protected addEntry(id: string, entry: MultiOscEntry)
    {
        this.osc_gain_dict.set(id, entry)
        this.master_gain.gain.value = 1 / this.osc_gain_dict.size
    }

    protected removeEntry(id: string)
    {
        const entry = this.osc_gain_dict.get(id)!
        Object.values(entry).forEach(n => n.disconnect())
        this.osc_gain_dict.delete(id)
        this.master_gain.gain.value = 1 / this.osc_gain_dict.size
    }
}

export type MultiOscEntry = {
    oscillator: OscillatorNode
    gain: GainNode
}