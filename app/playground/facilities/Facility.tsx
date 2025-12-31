"use client"

import "./Facility.scss"

import { type AmbientPlayer } from "./AmbientPlayer"
import React, { ComponentPropsWithoutRef, RefObject, useEffect, useRef, useState } from "react"
import { mapLinearToLinear } from "@/utils/math"

/**
 * The duration for the finishing animation.
 */
const finishing__anime_duration: number = 1000

/**
 * * `loading`: The sketch is still loading.
 * * `finishing`: The sketch just finished loading, play the unveiling animation.
 * * `ready`: The sketch is ready to be played.
 */
type AnimationPhase = "loading" | "finishing" | "ready"

/**
 * Wrap the sketches into a facility of the playground.
 * 
 * This function only controls the display.
 * When the sketch is loaded, there will be an animation from
 *  loading state to the facility itself.
 * 
 * When being clicked, the camera should zoom-in,
 *  and show the entire full-screen sketch for interaction.
 */
export function Facility({
    loading_status_picture__url = "",
    is_loading,
    name,
    ambient_player__ref,
    children = (<></>),
    ...rest_props
}: Facility__Params)
{
    const [animation_phase, setAnimationPhase] = useState<AnimationPhase>("loading")
    const facility__div = useRef<HTMLDivElement>(null)
    const loading_phase__div = useRef<HTMLDivElement>(null)
    const ready_phase__div = useRef<HTMLDivElement>(null)

    const onFacilityClick = () =>
    {
        // Do not react to click if still loading.
        if (is_loading) { return }

        const event = new CustomEvent("facility_click", {
            bubbles: true,
            detail: name
        })
        document.dispatchEvent(event)
    }

    useEffect(() =>
    {
        if (!is_loading) { setAnimationPhase("finishing") }
    }, [is_loading])

    // Register this facility's DOM node for camera usage.
    useEffect(() =>
    {
        if (facility__div.current == null) { return }

        document.dispatchEvent(new CustomEvent("facility_mount", {
            bubbles: true,
            detail: { name, element: facility__div.current }
        }))

        return () =>
        {
            document.dispatchEvent(new CustomEvent("facility_unmount", {
                bubbles: true,
                detail: { name }
            }))
        }
    }, [name])

    // Performance when the loading is finished.
    useEffect(() =>
    {
        if (animation_phase == "finishing")
        {
            const animation_start__timestamp = performance.now()
            /** For both animation and gain value. */
            const tick = () =>
            {
                const now = performance.now()
                const progress = (now - animation_start__timestamp) / finishing__anime_duration

                if (progress > 1) // Finished.
                {
                    setAnimationPhase("ready")
                }
                else // Changing.
                {
                    if (loading_phase__div.current == null || ready_phase__div.current == null) { return }

                    loading_phase__div.current.style.setProperty("--progress", `${progress}`)
                    ready_phase__div.current.style.setProperty("--progress", `${progress}`)

                    if (ambient_player__ref != undefined && ambient_player__ref.current != null)
                    {
                        ambient_player__ref.current.master_gain_value = progress
                    }

                    requestAnimationFrame(tick)
                }
            }

            tick()
        }
    }, [animation_phase])

    return <div className="Facility" data-facility-name={name} onClick={onFacilityClick} ref={facility__div} {...rest_props}>
        {/* When it is loading, only show loading animation. */}
        {animation_phase == "loading"
            && <div className="onLoading">LOADING</div>}

        {/* When it is finishing, the finishing animation shows together with the ready sketch. */}
        {animation_phase == "finishing"
            && <div className="onFinishing" ref={loading_phase__div}>FINISHING</div>}
        {(animation_phase == "finishing" || animation_phase == "ready")
            && <div className="onReady" ref={ready_phase__div}>{children}</div>}
    </div>
}

export type Facility__Params = ComponentPropsWithoutRef<"div"> & {
    /**
     * The picture to show when the sketch is loading.
     */
    loading_status_picture__url?: string

    is_loading: boolean

    /** Name of the wrapped facility. */
    name: AvailableFacility

    ambient_player__ref?: RefObject<AmbientPlayer | null>

    children?: React.ReactNode
}

export enum AvailableFacility
{
    singing_text = "singing_text",
    dancing_pendulum = "dancing_pendulum",
    lissatone = "lissatone",
    cunei_sound = "cunei_sound",
    slopy_globy = "slopy_globy",
    musicreatures = "musicreatures"
}