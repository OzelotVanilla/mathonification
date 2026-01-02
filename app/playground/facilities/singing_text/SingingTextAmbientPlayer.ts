import { InstrumentVoice, SoundManager } from "@/utils/SoundManager";
import { AmbientPlayer } from "../AmbientPlayer";
import { midi_note_to_name } from "@/utils/constants";
import { type MusicContext } from "@/utils/music";


/**
 * @inheritdoc
 */
export class SingingTextAmbientPlayer extends AmbientPlayer
{
    public static readonly keys_offset: [piano_key: number, flute_key: number][] = [
        [0, 7], [2, 9], [-3, 4]
    ]

    // Will be init-ed in `this.initVoice`.
    private piano_voice: InstrumentVoice | null = null
    private flute_voice: InstrumentVoice | null = null

    set master_panning(value: number)
    {
        if (this.piano_voice == null || this.flute_voice == null) { return }
        this.piano_voice.raw_pan.value = value
        this.flute_voice.raw_pan.value = value
    }

    set master_gain_value(value: number)
    {
        if (this.piano_voice == null || this.flute_voice == null) { return }
        this.piano_voice.raw_gain.value = value
        this.flute_voice.raw_gain.value = value
    }

    constructor(music_context__ref: MusicContext)
    {
        super(music_context__ref)

        AmbientPlayer.active_ambient_player__refs.add(this)
    }

    protected postInit(): void
    {
        this.initVoice()
    }

    private initVoice()
    {
        if (this.piano_voice == null)
        {
            this.piano_voice = SoundManager.createInstrumentVoice({
                instrument_name: "piano",
                effect_chain_name: "piano__reverb"
            })
        }
        if (this.flute_voice == null)
        {
            this.flute_voice = SoundManager.createInstrumentVoice({
                instrument_name: "flute"
            })
        }
    }

    update(measure: number, beat: number): void
    {
        const offset_array_len = SingingTextAmbientPlayer.keys_offset.length
        const one_beat_duration__in_s = 60 / this.music_context__ref.bpm

        if (beat == 0)
        {
            const note_num = SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][0]
                + this.music_context__ref.base_note
            // console.log(`${measure}:${beat}:piano: ${midi_note_to_name[note_num]}`)
            this.piano_voice?.triggerAttackRelease(
                note_num,
                3.5 * one_beat_duration__in_s
            )
        }
        else if (beat == 2)
        {
            const note_num = SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][1]
                + this.music_context__ref.base_note
            // console.log(`${measure}:${beat}:flute: ${midi_note_to_name[note_num]}`)
            this.flute_voice?.triggerAttackRelease(
                SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][1] + this.music_context__ref.base_note,
                3 * one_beat_duration__in_s
            )
        }
    }

    linearRampGainTo(value: number, in_n_milliseconds: number): void
    {
        this.piano_voice?.raw_gain.linearRampTo(value, in_n_milliseconds / 1000)
        this.flute_voice?.raw_gain.linearRampTo(value, in_n_milliseconds / 1000)
    }

    dispose(): void
    {
        this.piano_voice?.dispose()
        this.piano_voice = null
        this.flute_voice?.dispose()
        this.flute_voice = null

        AmbientPlayer.active_ambient_player__refs.delete(this)
    }
}