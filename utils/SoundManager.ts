"use client"

import { getContext as getToneContext, Sampler, loaded as onToneLoaded, start as startTone, Reverb } from "tone";
import { Compressor, ToneAudioNode, Vibrato, Limiter, Meter } from "tone";
import { isClientEnvironment } from "./env";
import { midi_note_to_name } from "./constants";
import { Time } from "tone/build/esm/core/type/Units";
import { SoundEffectChainManager } from "./SoundEffectChainManager";

type AvailableSamplerName = "piano" | "xylophone" | "flute"

type EffectName = "vibrato" | string

type AvailableInstrumentName = `${AvailableSamplerName}` | `${AvailableSamplerName}__${EffectName}`

type AvailableInstrument = Sampler

type Param_playNote = {
    instrument_name?: AvailableInstrumentName
    duration?: Time
    /** Which user-defined effect chain to use. `undefined` means do not use effect. */
    effect_chain_name?: string | undefined
}

const default_playNote_param = {
    instrument_name: "piano",
    duration: 1,
    effect_chain_name: undefined
} satisfies Param_playNote

/**
 * Will be updated when the existed assets is replaced by something else.
 */
const asset_version = "v12292025"

/**
 * The `init` method should be called by a user gesture.
 * 
 * Connect graph:
 * 
 * ```txt
 * instrument -> sound effect -> final compressor -> final limiter.
 * ```
 */
export class SoundManager
{
    private static tonejs_instruments: Map<AvailableInstrumentName, AvailableInstrument> = new Map();

    /**
     * Chain of sound effect.
     * 
     * The sampler is connected first to this, and then the destination.
     */
    private static sound_effect_chain_manager: SoundEffectChainManager = new SoundEffectChainManager()

    private static final_compressor: Compressor

    private static final_limiter: Limiter

    /**
     * Could be used to check whether clipping.
     */
    private static meter: Meter

    /**
     * A promise to indicate sampling file preload status.
     * 
     * Will NOT be set to `null` even when dispose.
     */
    private static preload_promise: Promise<any> | null = null

    /**
     * A promise to indicate init status.
     * 
     * Will be set to `null` when dispose.
     */
    private static init_promise: Promise<void> | null = null

    public static get preload_finished() { return this.preload_promise }

    public static get init_finished() { return this.init_promise }

    /**
     * All sound node should connect to this.
     */
    private static master_input: ToneAudioNode

    /**
     * For effect.
     */
    static get effect_output() { return this.master_input }

    private static readonly piano__sample_urls = Object.fromEntries(new Map(
        [...new Array(81)] // From `C1` to `G7` (this sample only has this range)
            .map((_, index) => midi_note_to_name[index + 24]!)
            .map(s => [s, `${s.replace("#", "s")}.mp3?v=${asset_version}`])
    ))

    private static readonly xylophone__sample_urls = Object.fromEntries(new Map(
        [...new Array(88)] // From `A0` to `C8` (this sample only has this range)
            .map((_, index) => midi_note_to_name[index + 21]!)
            .map(s => [s, `${s.replace("#", "s")}.mp3?v=${asset_version}`])
    ))

    private static readonly flute__sample_urls = Object.fromEntries(new Map(
        [...new Array(88)] // From `A0` to `C8` (this sample only has this range)
            .map((_, index) => midi_note_to_name[index + 21]!)
            .map(s => [s, `${s.replace("#", "s")}.mp3?v=${asset_version}`])
    ))

    static get available_instrument() { return [...this.tonejs_instruments.keys()] }

    static {
        if (isClientEnvironment())
        {
            // Pre-load the resource, let the fetch happens later.
            window.setTimeout(() => this.preloadSamplingFile(), 1000)
        }
    }

    public static async resume()
    {
        await startTone()
        return await this.init()
    }

    /**
     * Dispose the previously inited components, and re-init it.
     */
    public static stop()
    {
        this.dispose()
        this.init()
    }

    /**
     * Dispose the init-ed instrument or effect. 
     */
    public static dispose()
    {
        this.init_promise = null
        this.tonejs_instruments.values().forEach(v => v.dispose())
        this.tonejs_instruments.clear()
        this.sound_effect_chain_manager.dispose()
    }

    public static playNote(midi_note_number: number, param?: Param_playNote): void;
    public static playNote(note_name: string, param?: Param_playNote): void;
    public static playNote(midi_note_numbers: number[], param?: Param_playNote): void;
    public static playNote(note_names: string[], param?: Param_playNote): void;
    public static playNote(
        note: string | number | string[] | number[],
        param: Param_playNote = default_playNote_param
    ): void
    {
        let { instrument_name = "piano", duration = 1, effect_chain_name } = param
        let keys_to_play = this.convertInputNotesToKeyNames(note)

        let instrument: AvailableInstrument | undefined
        if (effect_chain_name != undefined) // Switch to effect
        {
            // TODO: Need a more readable logic.
            const instrument_with_effect__name: AvailableInstrumentName = `${instrument_name}__${effect_chain_name}`
            if (!this.sound_effect_chain_manager.has(instrument_with_effect__name))
            {
                return
            }

            instrument = this.tonejs_instruments.get(instrument_with_effect__name)!
        }
        else // Do not use effect.
        {
            // And this might make already sounding note become no-effect.
            instrument = this.tonejs_instruments.get(instrument_name)
        }

        instrument?.triggerAttackRelease(keys_to_play, duration, getToneContext().currentTime)
    }

    public static convertInputNotesToKeyNames(value: string | number | string[] | number[]): string[]
    {
        let keys_to_play: string[]
        if (value instanceof Array)
        {
            if (value.length == 0) { return []; }

            switch (typeof value[0])
            {
                case "string": keys_to_play = value as string[]; break
                case "number": keys_to_play = (value as number[]).map((num) => this.convertNoteNumToKeyName(num)); break
            }
        }
        else
        {
            switch (typeof value)
            {
                case "string": keys_to_play = [value]; break
                case "number": keys_to_play = [this.convertNoteNumToKeyName(value)]; break
            }
        }

        return keys_to_play
    }

    static convertNoteNumToKeyName(midi_note_num: number)
    {
        if (!Number.isInteger(midi_note_num)) { throw TypeError(`Note number ${midi_note_num} is not an integer!`) }
        if (midi_note_num < 21 || midi_note_num > 108) { throw RangeError(`Note number ${midi_note_num} out of range.`) }

        return midi_note_to_name[midi_note_num]!
    }

    public static async preloadSamplingFile(abort_signal?: AbortSignal)
    {
        if (this.preload_promise != null) { return this.preload_promise }

        function getFetchPromises(instrument_name: AvailableSamplerName, urls_object: { [key_name: string]: string })
        {
            caches.open
            return Object.values(urls_object).map(
                url => requestIdleCallback(() => fetch(
                    `instrument_sample/${instrument_name}/${url}`,
                    { cache: "force-cache", signal: abort_signal }
                ).then(
                    response =>
                    {
                        if (!response.ok)
                        {
                            SoundManager.preload_promise = null
                            throw Error(`URL "${response.url}" not fetched.`)
                        }
                        else
                        {
                            return response.arrayBuffer()
                        }
                    }
                )
                ))
        }

        this.preload_promise = Promise.all([
            getFetchPromises("piano", this.piano__sample_urls),
            getFetchPromises("xylophone", this.xylophone__sample_urls),
            getFetchPromises("flute", this.flute__sample_urls),
        ].flat()).catch(
            err => { SoundManager.preload_promise = null; throw err }
        )

        await this.preload_promise

        return this.preload_promise
    }

    /**
     * Init the sound manager.
     * Should be called after user gesture.
     * 
     * This method returns the `init_promise` as init status,
     *  and avoid init multiple times.
     */
    public static async init()
    {
        if (this.init_promise != null) { return this.init_promise }

        this.init_promise = (async (resolve) =>
        {
            // Final clipping-avoiding solution.
            this.final_compressor = new Compressor({
                threshold: -18,
                ratio: 3,
                attack: 0.01,
                release: 0.3
            })
            this.final_limiter = new Limiter(-1)
            this.meter = new Meter()
            // Should be defined here, since `sound_effect_chain_manager` need to refer to it.
            this.master_input = this.final_compressor

            // Add pre-defined effect chain.
            this.sound_effect_chain_manager.add("none", [], this.effect_output)

            // Load pre-defined sampler.
            this.loadPianoSampler()
            this.loadXylophoneSampler()
            this.loadFluteSampler()

            // Connect graph creation.
            this.final_compressor.connect(this.final_limiter)
            this.final_limiter.toDestination()
            this.final_limiter.connect(this.meter)

            await onToneLoaded()
        })().catch(
            err => { this.init_promise = null; throw err }
        )

        return this.init_promise
    }

    private static loadPianoSampler()
    {
        this.addPianoSampler("piano", /* skip_when_exist: */ true)

        {
            let piano_vibrato = this.addPianoSampler("piano__vibrato")
            this.sound_effect_chain_manager.add("piano__vibrato", [
                new Vibrato(5, 0.2)
            ], this.effect_output)
            let effect_chain = this.sound_effect_chain_manager.get("piano__vibrato")!
            if (effect_chain.length > 0) { piano_vibrato.connect(effect_chain[0]) }
        }

        {
            let piano_reverb = this.addPianoSampler("piano__reverb")
            this.sound_effect_chain_manager.add("piano__reverb", [
                new Reverb(0.5)
            ], this.effect_output)
            let effect_chain = this.sound_effect_chain_manager.get("piano__reverb")!
            if (effect_chain.length > 0) { piano_reverb.connect(effect_chain[0]) }
        }
    }

    private static addPianoSampler(name: AvailableInstrumentName, skip_when_exist: boolean = false)
    {
        if (this.tonejs_instruments.has(name) && !skip_when_exist)
        {
            throw Error(
                `Piano ${name} already exists. ` +
                "Either change the chain name, or delete existing one. " +
                "Effect chain not added."
            )
        }

        const instrument = new Sampler({
            urls: this.piano__sample_urls,
            baseUrl: "/instrument_sample/piano/",
            release: 1,
            volume: -12
        }).connect(this.master_input)

        this.tonejs_instruments.set(name, instrument)

        return instrument
    }

    private static loadXylophoneSampler()
    {
        const instrument = new Sampler({
            urls: this.xylophone__sample_urls,
            baseUrl: "/instrument_sample/xylophone/",
            release: 1,
            volume: -12
        }).connect(this.master_input)

        this.tonejs_instruments.set("xylophone", instrument)
    }

    private static loadFluteSampler()
    {
        const instrument = new Sampler({
            urls: this.flute__sample_urls,
            baseUrl: "/instrument_sample/flute/",
            release: 1,
            volume: -12
        }).connect(this.master_input)

        this.tonejs_instruments.set("flute", instrument)
    }

    private static removeInstrument(name: AvailableInstrumentName)
    {
        if (!this.tonejs_instruments.has(name)) { throw Error(`${name} not exists.`) }

        const instrument = this.tonejs_instruments.get(name)!
        instrument.disconnect()
        instrument.dispose()
        this.tonejs_instruments.delete(name)
    }
}