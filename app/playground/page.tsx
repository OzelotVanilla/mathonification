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

export const frequency_of_music_time_broadcast__per_measure = 8

const playground_gate__entering_anime__duration = 1.5 * 1000

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
        const length_of_one_measure__in_ms = 60 / music_context__ref.current.bpm * 1000
        const ms_until_next_broadcast = length_of_one_measure__in_ms / frequency_of_music_time_broadcast__per_measure
        const time_elapsed__in_ms = performance.now() - start_time__timestamp.current
        const measure_count = Math.floor(time_elapsed__in_ms / length_of_one_measure__in_ms)
        const beat_count = Math.floor(
            time_elapsed__in_ms / length_of_one_measure__in_ms * frequency_of_music_time_broadcast__per_measure
        ) / frequency_of_music_time_broadcast__per_measure % music_context__ref.current.n_beat_in_one_measure

        document.dispatchEvent(new CustomEvent<MusicTimeBroadcastEvent>("music_time_broadcast", {
            detail: { measure: measure_count, beat: beat_count }
        }))

        return (tickMusicTimeBroadcast__cancelID.current = window.setTimeout(tickMusicTimeBroadcast, ms_until_next_broadcast))
    }


    // Init.
    useEffect(() =>
    {
        document.addEventListener("facility_click", onReceiveFacilityClick)
        document.addEventListener("facility_exit", onReceiveFacilityExit)

        // Music context.
        music_context__ref.current.bpm = 100
        music_context__ref.current.base_note = 60

        // Music time broadcast.
        tickMusicTimeBroadcast__cancelID.current = window.setTimeout(tickMusicTimeBroadcast)

        return () =>
        {
            document.removeEventListener("facility_click", onReceiveFacilityClick)
            document.removeEventListener("facility_exit", onReceiveFacilityExit)
            window.clearTimeout(tickMusicTimeBroadcast__cancelID.current)
        }
    }, [])

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