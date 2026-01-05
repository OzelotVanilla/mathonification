"use client"

import "./page.scss"

import { Dispatch, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from "react"
import { SoundManager } from "@/utils/SoundManager"
import { MusicContext } from "@/utils/music"
import { AvailableFacility } from "./facilities/Facility"
import { SingingTextFacility } from "./facilities/singing_text/SingingTextFacility"
import { FacilityMountEventDetail, FacilityUnmountEventDetail, MusicTimeBroadcastEvent } from "./facilities/facility_event.extend.interface"
import { StageOverlay, stage_overlay__fade_duration } from "./stage_overlay/StageOverlay"
import { AmbientPlayer } from "./facilities/AmbientPlayer"
import { getHTMLElementCenterPositionRatioOnXAxis } from "@/utils/layout"
import { clamp } from "@/utils/math"
import { MusicContext_Context } from "./MusicContext_Context"


export type SelectedFacility = AvailableFacility | null

export type PlaygroundEnteringStatus = "loading" | "waiting" | "entering" | "entered"

/** In milliseconds. */
const playground_gate__entering_anime__duration = 1.5 * 1000
/** In milliseconds. */
const zoom_to_facility__anime__duration = 1.5 * 1000

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

    const onGateClick = async () =>
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
    const playground__div = useRef<HTMLDivElement>(null)
    const playground_fields__div = useRef<HTMLDivElement>(null)
    const playground_transform__ref = useRef({ translate_x: 0, translate_y: 0, scale: 1 })
    const facility_registry__ref = useRef(new Map<AvailableFacility, HTMLElement>())
    /** Notice: A facility might NOT register an `AmbientPlayer`. */
    const facility_player_registry__ref = useRef(new Map<AvailableFacility, AmbientPlayer>())
    const show_stage_overlay__timeout_id = useRef(0)
    /** Timestamp when `tickMusicTimeBroadcast` started. */
    const start_time__timestamp = useRef(0)
    /** Timestamp of `tickMusicTimeBroadcast`'s last call. */
    const tickMusicTimeBroadcast__timestamp = useRef(0)
    const last_broadcasted_beat__ref = useRef(-1)

    const onReceiveFacilityClick = (event: CustomEvent<AvailableFacility>) =>
    {
        // If some facility already being selected, do nothing.
        if (selected_facility != null) { return }

        setSelectedFacility(event.detail)
        window.clearTimeout(show_stage_overlay__timeout_id.current)
        show_stage_overlay__timeout_id.current = window.setTimeout(
            () => setWhetherShouldShowStageOverlay(true),
            zoom_to_facility__anime__duration
        )
        AmbientPlayer.fadeOutGain(zoom_to_facility__anime__duration)
    }
    const onReceiveFacilityExit = () =>
    {
        window.clearTimeout(show_stage_overlay__timeout_id.current)
        setSelectedFacility(null)
        // Should wait for fade-out animation of stage overlay.
        window.setTimeout(() => setWhetherShouldShowStageOverlay(false), stage_overlay__fade_duration)
        AmbientPlayer.fadeInGain(stage_overlay__fade_duration)
    }
    const onReceiveFacilityMount = (event: CustomEvent<FacilityMountEventDetail>) =>
    {
        facility_registry__ref.current.set(event.detail.name, event.detail.element)
        if (event.detail.player != null && event.detail.player != undefined)
        {
            facility_player_registry__ref.current.set(event.detail.name, event.detail.player)
            updatePanning(event.detail.name)
        }
    }
    const onReceiveFacilityUnmount = (event: CustomEvent<FacilityUnmountEventDetail>) =>
    {
        facility_registry__ref.current.delete(event.detail.name)
        if (facility_player_registry__ref.current.has(event.detail.name))
        {
            facility_player_registry__ref.current.delete(event.detail.name)
        }
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

        tickMusicTimeBroadcast__timestamp.current = now

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
    /**
     * Recalculate and apply panning to all active facilities, according to screen position.
     */
    const updatePanning = (facility_name?: AvailableFacility) =>
    {
        const name_of_update_waiting_facilities = facility_name == undefined
            ? facility_player_registry__ref.current.keys()
            : [facility_name]

        for (const name of name_of_update_waiting_facilities)
        {
            const element = facility_registry__ref.current.get(name)!
            const player = facility_player_registry__ref.current.get(name)!
            const x_axis_ratio = getHTMLElementCenterPositionRatioOnXAxis(element)
            player.master_panning = clamp(-1, x_axis_ratio * 2 - 1, 1) // Map `[0, 1]` to `[-1, 1]`.
        }
    }

    // Init.
    useEffect(() =>
    {
        document.addEventListener("facility_click", onReceiveFacilityClick)
        document.addEventListener("facility_exit", onReceiveFacilityExit)
        document.addEventListener("facility_mount", onReceiveFacilityMount as EventListener)
        document.addEventListener("facility_unmount", onReceiveFacilityUnmount as EventListener)

        // Music context.
        music_context__ref.current.bpm = 100
        music_context__ref.current.base_note = 60
        music_context__ref.current.n_beat_in_one_measure = 4
        last_broadcasted_beat__ref.current = -1

        return () =>
        {
            document.removeEventListener("facility_click", onReceiveFacilityClick)
            document.removeEventListener("facility_exit", onReceiveFacilityExit)
            document.removeEventListener("facility_mount", onReceiveFacilityMount as EventListener)
            document.removeEventListener("facility_unmount", onReceiveFacilityUnmount as EventListener)
            window.clearTimeout(show_stage_overlay__timeout_id.current)
        }
    }, [])

    // Music time broadcast init.
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

    // Music time broadcast control.
    useEffect(() =>
    {
        // Resume.
        if (selected_facility == null)
        {
            // Calculate the delta to restore the count of measure and beat.
            const now = performance.now()
            const elapsed = tickMusicTimeBroadcast__timestamp.current - start_time__timestamp.current
            start_time__timestamp.current = now - elapsed
            // Then start as soon as possible.
            tickMusicTimeBroadcast__cancelID.current = window.setTimeout(tickMusicTimeBroadcast)
        }
        // Or pause.
        else
        {
            window.clearTimeout(tickMusicTimeBroadcast__cancelID.current)
        }
    }, [selected_facility])

    // Move and zoom "into" the facility.
    // This changes the size & position of `playground_fields`.
    useEffect(() =>
    {
        // Note: facilities calculates the panning using position.
        const playground_fields = playground_fields__div.current
        if (playground_fields == null) { return }

        const easing = (t: number) => 1 - Math.pow(1 - t, 3) // ease-out cubic
        const default_transform = { translate_x: 0, translate_y: 0, scale: 1 }

        const computeTargetTransform = () =>
        {
            if (selected_facility == null) { return default_transform }

            const facility_element = facility_registry__ref.current.get(selected_facility)
                ?? playground_fields.querySelector<HTMLElement>(`.Facility[data-facility-name="${selected_facility}"]`)
            if (facility_element == null) { return default_transform }

            const facility_rect = facility_element.getBoundingClientRect()
            const target_scale = 1.4
            const facility_center__x = facility_rect.x + facility_rect.width / 2
            const facility_center__y = facility_rect.y + facility_rect.height / 2

            return {
                translate_x: window.innerWidth / 2 - (facility_center__x * target_scale),
                translate_y: window.innerHeight / 2 - (facility_center__y * target_scale),
                scale: target_scale
            }
        }

        let animation_frame_id = 0
        let animation_start__timestamp = performance.now()
        let start_transform = playground_transform__ref.current
        let target_transform = computeTargetTransform()

        const tick = () =>
        {
            const now = performance.now()
            const progress = Math.min(1, (now - animation_start__timestamp) / zoom_to_facility__anime__duration)
            const eased_progress = easing(progress)

            const translate_x = start_transform.translate_x
                + (target_transform.translate_x - start_transform.translate_x) * eased_progress
            const translate_y = start_transform.translate_y
                + (target_transform.translate_y - start_transform.translate_y) * eased_progress
            const scale = start_transform.scale
                + (target_transform.scale - start_transform.scale) * eased_progress

            playground_fields.style.transformOrigin = "0 0"
            playground_fields.style.transform = `translate(${translate_x}px, ${translate_y}px) scale(${scale})`

            // Update panning also.
            updatePanning()

            playground_transform__ref.current = { translate_x, translate_y, scale }
            if (progress < 1) { animation_frame_id = requestAnimationFrame(tick) }
            else { animation_frame_id = 0 }
        }

        const restartAnimation = () =>
        {
            start_transform = playground_transform__ref.current
            target_transform = computeTargetTransform()
            animation_start__timestamp = performance.now()
            if (animation_frame_id == 0) { tick() }
        }

        const onResize = () => restartAnimation()

        tick()
        window.addEventListener("resize", onResize)
        return () =>
        {
            if (animation_frame_id != 0) { cancelAnimationFrame(animation_frame_id) }
            window.removeEventListener("resize", onResize)
        }
    }, [selected_facility])

    return (<MusicContext_Context value={music_context__ref}><div id="playground" ref={playground__div}>
        <div id="playground_field_viewport"><div id="playground_fields" ref={playground_fields__div}>
            {/* By default, playground should show fields (containing facilities). */}
            <PlaygroundField__A music_context__ref={music_context__ref} />
            <PlaygroundField__B music_context__ref={music_context__ref} />
        </div></div>

        {should_show__stage_overlay && <StageOverlay selected_facility={selected_facility} />}
    </div></MusicContext_Context>)
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
    return (<div id="playground_a" className="PlaygroudField">
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
    return (<div id="playground_b" className="PlaygroudField">
        PLAYGROUND FIELD B
    </div>)
}

type PlaygroundField__B_Param = PlaygroudField_Param

type PlaygroudField_Param = {
    music_context__ref: RefObject<MusicContext>
}