"use client"

import "./Facility.scss"

import React, { useEffect, useRef, useState } from "react"

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
    children = (<></>)
}: Facility__Params)
{
    const [animation_phase, setAnimationPhase] = useState<AnimationPhase>("loading")
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
        if (!is_loading)
        {
            setAnimationPhase("finishing")

            const animation_start__timestamp = performance.now()
            const tickAnimation = () =>
            {
                const now = performance.now()
                const progress = (now - animation_start__timestamp) / finishing__anime_duration

                if (progress > 1)
                {
                    setAnimationPhase("ready")
                }
                else
                {
                    if (loading_phase__div.current == null || ready_phase__div.current == null) { return }

                    loading_phase__div.current.style.setProperty("--progress", `${progress}`)
                    ready_phase__div.current.style.setProperty("--progress", `${progress}`)

                    requestAnimationFrame(tickAnimation)
                }
            }

            tickAnimation()
        }
    }, [is_loading])

    return <div className="Facility" onClick={onFacilityClick}>
        {/* When it is loading, only show loading animation. */}
        {animation_phase == "loading"
            && <div className="onLoading">LOADING</div>}

        {/* When it is finishing, the finishing animation shows together with the ready sketch. */}
        {animation_phase == "loading"
            && <div className="onFinishing" ref={loading_phase__div}>FINISHING</div>}
        {(animation_phase == "loading" || animation_phase == "ready")
            && <div className="onReady" ref={ready_phase__div}>{children}</div>}
    </div>
}

export type Facility__Params = {
    /**
     * The picture to show when the sketch is loading.
     */
    loading_status_picture__url?: string

    is_loading: boolean

    /** Name of the wrapped facility. */
    name: AvailableFacility

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