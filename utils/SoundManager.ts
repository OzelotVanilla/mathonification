import { getContext as getToneContext, Sampler } from "tone";
import { isClientEnvironment } from "./env";
import { midi_note_to_name } from "./constants";
import { Time } from "tone/build/esm/core/type/Units";

type AvailableInstrument = "piano"

type Param_playNote = {
    instrument?: AvailableInstrument
    duration?: Time
}

const default_playNote_param = { instrument: "piano", duration: 1 } satisfies Param_playNote

export class SoundManager
{
    private static tonejs_instruments: Map<AvailableInstrument, Sampler> = new Map();

    static get available_instrument() { return [...this.tonejs_instruments.keys()] }

    static {
        if (isClientEnvironment())
        {
            this.init()
        }
    }

    public static stop()
    {
        this.tonejs_instruments.values().forEach(v => v.dispose())
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
        let { instrument = "piano", duration = 1 } = param
        let keys_to_play = this.convertInputNotesToKeyNames(note)

        this.tonejs_instruments.get(instrument)?.triggerAttackRelease(keys_to_play, duration, getToneContext().currentTime)
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
        this.loadPianoSampler()
    }

    private static loadPianoSampler()
    {
        this.tonejs_instruments.set("piano",
            new Sampler({
                urls: Object.fromEntries(new Map(
                    [...new Array(81)] // From `C1` to `G7` (this sample only has this range)
                        .map((_, index) => midi_note_to_name[index + 24]!)
                        .map(s => [s, `${s.replace("#", "s")}.mp3`])
                )),
                baseUrl: "/instrument_sample/piano/",
                release: 1
            }).toDestination()
        )
    }
}