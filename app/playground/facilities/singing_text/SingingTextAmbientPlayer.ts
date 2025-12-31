import { SoundManager } from "@/utils/SoundManager";
import { AmbientPlayer } from "../AmbientPlayer";
import { midi_note_to_name } from "@/utils/constants";


/**
 * @inheritdoc
 */
export class SingingTextAmbientPlayer extends AmbientPlayer
{
    public static readonly keys_offset: [piano_key: number, flute_key: number][] = [
        [0, 7], [2, 9], [-3, 4]
    ]

    update(measure: number, beat: number): void
    {
        const offset_array_len = SingingTextAmbientPlayer.keys_offset.length
        const one_beat_duration__in_s = 60 / this.music_context__ref.bpm

        if (beat == 0)
        {
            const note_num = SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][0]
                + this.music_context__ref.base_note
            // console.log(`${measure}:${beat}:piano: ${midi_note_to_name[note_num]}`)
            SoundManager.playNote(
                note_num,
                { instrument_name: "piano", effect_chain_name: "reverb", duration: 3.5 * one_beat_duration__in_s }
            )
        }
        else if (beat == 2)
        {
            const note_num = SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][1]
                + this.music_context__ref.base_note
            // console.log(`${measure}:${beat}:flute: ${midi_note_to_name[note_num]}`)
            SoundManager.playNote(
                SingingTextAmbientPlayer.keys_offset[measure % offset_array_len][1] + this.music_context__ref.base_note,
                { instrument_name: "flute", duration: 3 * one_beat_duration__in_s }
            )
        }
    }
}