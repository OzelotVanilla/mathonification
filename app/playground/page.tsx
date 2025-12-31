"use client"

import "./page.scss"

import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from "react"
import { SoundManager } from "@/utils/SoundManager"
import { MusicContext } from "@/utils/music"
import { AvailableFacility } from "./facilities/Facility"
import { SingingTextFacility } from "./facilities/singing_text/SingingTextFacility"
import { MusicTimeBroadcastEvent } from "./facilities/facility_event.extend.interface"
import { StageOverlay, stage_overlay__fade_duration } from "./stage_overlay/StageOverlay"


export type SelectedFacility = AvailableFacility | null

export type PlaygroundEnteringStatus = "loading" | "waiting" | "entering" | "entered"

const playground_gate__entering_anime__duration = 1.5 * 1000

/**
 * Number of music-time broadcast ticks that occur within a single measure.
 */
const tickMusicTimeBroadcast__frequency = 8

/**
 * This page contains two or more fields containing sketches.
 * 
 * The background is filled with hand-drawn flower and grass with random generated position.
 * 
 * When any facility is clicked, it send a `facility_click` event,
 *  and the `StageOverlay` should render it.
 */
export default function PlaygroundPage()
{
    const [entering_status, setEnteringStatus] = useState<PlaygroundEnteringStatus>("loading")

    // Init. Load `SoundManager`, render the gate according to loading state.
    useEffect(() =>
    {
        // IIFE.
        (async () =>
        {
            await SoundManager.init_finished
            setEnteringStatus("waiting")
        })()
    }, [])

    return (<div id="playground_page">
        {entering_status != "entered"
            && <PlaygroundGate entering_status={entering_status} setEnteringStatus={setEnteringStatus} />}

        {(entering_status == "entering" || entering_status == "entered")
            && <Playground entering_status={entering_status} />}
    </div>)
}

function PlaygroundGate({ entering_status, setEnteringStatus }: PlaygroundGate_Param)
{
    const [is_loading_resource, setWhetherLoadingResource] = useState(true)

    const onGateClick = () =>
    {
        setEnteringStatus("entering")
        SoundManager.resume()

        // After playing the fade-out animation, let the gate disappear, set status to entered.
        window.setTimeout(() => setEnteringStatus("entered"), playground_gate__entering_anime__duration)
    }

    // Init.
    useEffect(() =>
    {
        // Preload IIFE.
        (async () =>
        {
            // Does not let user click the gate until it is loaded.
            await SoundManager.preload_finished
            setWhetherLoadingResource(false)
        })()
    }, [])

    const class_name = is_loading_resource
        ? "IsLoading"
        : (entering_status == "entering" ? "PlayEnteringAnime" : "LoadFinished")
    const onClick = is_loading_resource ? undefined : onGateClick
    return (<div id="playground_gate" className={class_name} onClick={onClick}>
        {is_loading_resource
            && "LOADING"}

        {!is_loading_resource
            && "GATE"}
    </div>)
}

type PlaygroundGate_Param = {
    entering_status: PlaygroundEnteringStatus
    setEnteringStatus: Dispatch<SetStateAction<PlaygroundEnteringStatus>>
}

function Playground({ entering_status }: Playground_Param)
{
    const [selected_facility, setSelectedFacility] = useState<SelectedFacility>(null)
    const [should_show__stage_overlay, setWhetherShouldShowStageOverlay] = useState(false)
    const music_context__ref = useRef(new MusicContext())
    const tickMusicTimeBroadcast__cancelID = useRef(0)
    const start_time__timestamp = useRef(0)
    const last_broadcasted_beat__ref = useRef(-1)

    const onReceiveFacilityClick = (event: CustomEvent<AvailableFacility>) =>
    {
        // If some facility already being selected, do nothing.
        if (selected_facility != null) { return }

        setSelectedFacility(event.detail)
        setWhetherShouldShowStageOverlay(true)
    }
    const onReceiveFacilityExit = () =>
    {
        setSelectedFacility(null)
        // Should wait for fade-out animation of stage overlay.
        window.setTimeout(() => setWhetherShouldShowStageOverlay(false), stage_overlay__fade_duration)
    }
    const tickMusicTimeBroadcast = () =>
    {
        const beat_duration__in_ms = 60 / music_context__ref.current.bpm * 1000
        const measure_duration__in_ms = beat_duration__in_ms * music_context__ref.current.n_beat_in_one_measure
        const tick_interval__in_ms = measure_duration__in_ms / tickMusicTimeBroadcast__frequency
        const now = performance.now()
        const time_elapsed__in_ms = now - start_time__timestamp.current
        const beat_elapsed_count = Math.round(time_elapsed__in_ms / beat_duration__in_ms)
        const n_beat_in_one_measure = music_context__ref.current.n_beat_in_one_measure

        if (beat_elapsed_count > last_broadcasted_beat__ref.current)
        {
            // Skip missed beats; only emit the current beat to avoid burst playback after pauses.
            last_broadcasted_beat__ref.current = beat_elapsed_count
            const measure_count = Math.floor(last_broadcasted_beat__ref.current / n_beat_in_one_measure)
            const beat_in_measure = last_broadcasted_beat__ref.current % n_beat_in_one_measure

            document.dispatchEvent(new CustomEvent<MusicTimeBroadcastEvent>("music_time_broadcast", {
                detail: { measure: measure_count, beat: beat_in_measure }
            }))
        }

        const ticks_elapsed__count = Math.floor(time_elapsed__in_ms / tick_interval__in_ms)
        const next_target_time__in_ms = start_time__timestamp.current
            + (ticks_elapsed__count + 1) * tick_interval__in_ms
        const delay_until_next = Math.max(0, next_target_time__in_ms - performance.now())
        return (tickMusicTimeBroadcast__cancelID.current = window.setTimeout(tickMusicTimeBroadcast, delay_until_next))
    }


    // Init.
    useEffect(() =>
    {
        document.addEventListener("facility_click", onReceiveFacilityClick)
        document.addEventListener("facility_exit", onReceiveFacilityExit)

        // Music context.
        music_context__ref.current.bpm = 100
        music_context__ref.current.base_note = 60
        music_context__ref.current.n_beat_in_one_measure = 4
        last_broadcasted_beat__ref.current = -1

        return () =>
        {
            document.removeEventListener("facility_click", onReceiveFacilityClick)
            document.removeEventListener("facility_exit", onReceiveFacilityExit)
        }
    }, [])

    // Music time broadcast.
    useEffect(() =>
    {
        if (entering_status == "entered")
        {
            start_time__timestamp.current = performance.now()
            tickMusicTimeBroadcast__cancelID.current = window.setTimeout(tickMusicTimeBroadcast)
        }

        return () =>
        {
            window.clearTimeout(tickMusicTimeBroadcast__cancelID.current)
        }
    }, [entering_status])

    return (<div id="playground">
        {/* By default, playground should show fields (containing facilities). */}
        <PlaygroundField__A music_context__ref={music_context__ref} />
        <PlaygroundField__B music_context__ref={music_context__ref} />

        {should_show__stage_overlay && <StageOverlay selected_facility={selected_facility} />}
    </div>)
}

type Playground_Param = {
    entering_status: PlaygroundEnteringStatus
}

/**
 * Contains a few sketches wrapped in the form of `Facility`.
 * 
 * Field A contains:
 * * Singing text, as a sign (board with a rod).
 * * Cunei sound, as a clock.
 */
function PlaygroundField__A({ music_context__ref }: PlaygroundField__A_Param)
{
    return (<div className="PlaygroudField">
        PLAYGROUND FIELD A
        <SingingTextFacility music_context__ref={music_context__ref} />
    </div>)
}

type PlaygroundField__A_Param = PlaygroudField_Param

/**
 * Contains a few sketches wrapped in the form of `Facility`.
 * 
 * Field B contains:
 * * 
 */
function PlaygroundField__B({ music_context__ref }: PlaygroundField__B_Param)
{
    return (<div className="PlaygroudField">
        PLAYGROUND FIELD B
    </div>)
}

type PlaygroundField__B_Param = PlaygroudField_Param

type PlaygroudField_Param = {
    music_context__ref: RefObject<MusicContext>
}