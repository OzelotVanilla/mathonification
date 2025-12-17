"use client"

import { getContext as getToneContext, Sampler, loaded as onToneLoaded, Compressor, ToneAudioNode, Vibrato } from "tone";
import { isClientEnvironment } from "./env";
import { midi_note_to_name } from "./constants";
import { Time } from "tone/build/esm/core/type/Units";
import { SoundEffectChainManager } from "./SoundEffectChainManager";

type AvailableSamplerName = "piano"

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

    static get output(): ToneAudioNode { return this.final_compressor }

    private static piano__sample_urls = Object.fromEntries(new Map(
        [...new Array(81)] // From `C1` to `G7` (this sample only has this range)
            .map((_, index) => midi_note_to_name[index + 24]!)
            .map(s => [s, `${s.replace("#", "s")}.mp3`])
    ))

    static get available_instrument() { return [...this.tonejs_instruments.keys()] }

    static {
        if (isClientEnvironment())
        {
            onToneLoaded().then(() => this.init())
        }
    }

    public static stop()
    {
        this.tonejs_instruments.values().forEach(v => v.dispose())
        this.tonejs_instruments.clear()
        this.sound_effect_chain_manager.dispose()
        this.init()
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
            if (!this.sound_effect_chain_manager.has(effect_chain_name))
            {
                return
            }

            const instrument_with_effect__name: AvailableInstrumentName = `${instrument_name}__${effect_chain_name}`
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

    private static init()
    {
        this.final_compressor = new Compressor({
            threshold: -18,
            ratio: 3,
            attack: 0.01,
            release: 0.3
        }).toDestination()

        // Add pre-defined effect chain.
        this.sound_effect_chain_manager.add("none", [])
        this.sound_effect_chain_manager.add("vibrato", [
            new Vibrato(5, 0.2)
        ])

        this.loadPianoSampler()
    }

    private static loadPianoSampler()
    {
        this.addPianoSampler("piano", /* skip_when_exist: */ true)

        let piano_vibrato = this.addPianoSampler("piano__vibrato")
        let effect_chain = this.sound_effect_chain_manager.get("vibrato")!
        if (effect_chain.length > 0) { piano_vibrato.connect(effect_chain[0]) }
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
            release: 1
        }).connect(this.output)

        this.tonejs_instruments.set(name, instrument)

        return instrument
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