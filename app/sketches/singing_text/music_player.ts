import { InstrumentVoice, SoundManager } from "@/utils/SoundManager"
import { ConjunctionType } from "./constants"
import { getTransport as getToneTransport } from "tone"
import * as Tone from "tone"
import { MusicContext, MusicScale } from "@/utils/music"

const major_chord = [0, 4, 7]
const minor_chord = [0, 3, 7]

/** C -> E. Trying. */
const offset_to_mediant = 2
/** C -> F. Adventure. */
const offset_to_subdominant = 3
/** C -> G. Temporarily resolved. */
const offset_to_dominant = 4
/** C -> B. Suspense. */
const offset_to_subsemitone = 6

const midi_c4_note = 60


export type StopPlayingMethod = "should_restart_sound_manager" | "release_all"

export class SyntaxPlayer
{
    should_continue_play = true
    tick__setTimeout_ids: number[] = []
    music_context: MusicContext
    instrument__piano!: InstrumentVoice
    instrument__flute!: InstrumentVoice

    constructor(music_context?: MusicContext)
    {
        this.music_context = music_context ?? new MusicContext()
        SoundManager.init_finished?.then(() =>
        {
            this.instrument__piano = SoundManager.createInstrumentVoice({
                instrument_name: "piano"
            })
            this.instrument__flute = SoundManager.createInstrumentVoice({
                instrument_name: "flute"
            })
        })
    }

    playMusic(
        text_container__id: string = "singing_text__text_container"
    )
    {
        const text_container = document.getElementById(text_container__id)
        if (text_container == null) { return }

        getToneTransport().bpm.value = this.music_context.bpm

        this.should_continue_play = true
        const tree_walker = document.createTreeWalker(text_container, NodeFilter.SHOW_ELEMENT)
        this.tick(this.music_context, tree_walker)
    }

    /**
     * @param method The way how music is stopped (by default, `"release_all"`):
     * * `should_restart_sound_manager`: Whether the sounding piano should be mute immediately
     *    by `dispose` and re-`init` the `SoundManager`.
     *   This will immediately stop the sound.
     * * `release_all`: All playing sound is released.
     */
    stopPlaying(method: StopPlayingMethod = "release_all")
    {
        this.should_continue_play = false
        for (const id of this.tick__setTimeout_ids) { clearTimeout(id) }

        switch (method)
        {
            case "should_restart_sound_manager": {
                SoundManager.stop()
            } break

            case "release_all": {
                SoundManager.releaseAllNote()
            } break

            default: {
                throw TypeError(`Unsupported StopPlayingMethod "${method}".`)
            }
        }
    }

    /** Put n more events into the `setTimeout`. */
    tick(music_context: MusicContext, tree_walker: TreeWalker)
    {
        let next_node
        do
        {
            next_node = tree_walker.nextNode()
            if (next_node == null) { return }
        }
        while (next_node.nodeType != Node.ELEMENT_NODE || (next_node as HTMLElement).tagName != "SPAN");

        const span_element = next_node as HTMLSpanElement

        const span_text = span_element.textContent ?? span_element.innerText ?? ""

        // If not a conjunction, cut into words.
        if (span_element.dataset["type"] == null || span_element.dataset["type"] == undefined)
        {
            let time_offset = 0
            for (const match of span_text.matchAll(/\b\w+\b/g))
            {
                const word = match[0]
                const index = match.index!;
                if (word.length == 0) { continue }
                if (!this.should_continue_play) { break }

                const notes_to_play = getNoteOfOrdinary(music_context, word)
                /** Including interval until next note */
                const notes_length = getNoteLength(word)
                const notes_length_in_milliseconds = notes_length.toMilliseconds()
                const notes_duration_in_milliseconds = notes_length_in_milliseconds * Math.random() * 0.75

                this.tick__setTimeout_ids.push(window.setTimeout(() =>
                {
                    this.instrument__piano.triggerAttackRelease(notes_to_play, notes_duration_in_milliseconds)

                    let range = new Range()
                    range.setStart(span_element.firstChild!, index)
                    range.setEnd(span_element.firstChild!, index + word.length)
                    CSS.highlights.set("playing", new Highlight(range))
                }, time_offset + notes_length_in_milliseconds))

                time_offset += notes_length_in_milliseconds
            }

            this.tick__setTimeout_ids.push(window.setTimeout(() => this.tick(music_context, tree_walker), time_offset))
        }
        else
        {
            const phrase = span_text
            const notes_to_play = getNoteOfConjunction(music_context, span_element)
            const notes_length = getNoteLength(phrase)
            const notes_length_in_milliseconds = notes_length.toMilliseconds()
            const notes_duration_in_milliseconds = notes_length_in_milliseconds * Math.random() * 0.5

            setTimeout(() =>
            {
                this.instrument__piano.triggerAttackRelease(notes_to_play, notes_duration_in_milliseconds)

                let range = new Range()
                range.setStartBefore(span_element)
                range.setEndAfter(span_element)
                CSS.highlights.set("playing", new Highlight(range))
            }, notes_length_in_milliseconds)

            this.tick__setTimeout_ids.push(window.setTimeout(() => this.tick(music_context, tree_walker), notes_length_in_milliseconds))
        }
    }
}

function getNoteLength(from_word: string)
{
    return Tone.Time(`${from_word.length}n`)
}

/**
 * Get a note for non-conjunction words.
 */
function getNoteOfOrdinary(music_context: MusicContext, word: string)
{
    const scale = music_context.getScale()

    return word.split(/[vkxqjz]/g)
        .map(s => (
            scale[[...s].reduce((previous, current) => previous + current.charCodeAt(0), 0) % (scale.length - 1)]
            + music_context.current_major + midi_c4_note
        ))
        .slice(0, 3)
}

/**
 * Get a chord from conjuction.
 */
function getNoteOfConjunction(music_context: MusicContext, span_element: HTMLSpanElement): number[]
{
    // TODO: Bad algorithm.
    const element_type_in_string = span_element.dataset["type"] ?? "not_a_conjuction"
    const element_type = ConjunctionType[element_type_in_string as keyof typeof ConjunctionType]
    switch (element_type)
    {
        case ConjunctionType.not_a_conjuction: {
            return [music_context.current_major + midi_c4_note]
        }

        case ConjunctionType.additive: {
            music_context.setMajorUp(7)

            return major_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.adversative: {
            music_context.setMajorUp(4)
            music_context.music_scale = MusicScale.melodic_minor

            return minor_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.causal: {
            music_context.setMajorDown(8)

            return major_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.temporal: {
            music_context.setMajorDown(3)
            music_context.music_scale = MusicScale.natural_minor

            return major_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.conditional: {
            music_context.setMajorDown(1)

            return major_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.concessive: {
            music_context.setMajorUp(2)
            music_context.music_scale = MusicScale.harmonic_minor

            return minor_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.comparative: {
            music_context.setMajorUp(2)

            return major_chord.map(n => n + midi_c4_note + music_context.current_major)
        }

        case ConjunctionType.summative: {
            music_context.current_major = 0
            return major_chord.map(v => music_context.current_major + midi_c4_note + v)
        }
    }
}