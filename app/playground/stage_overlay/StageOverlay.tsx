"use client"

import { useEffect, useState } from "react"
import { SelectedFacility } from "../page"
import { AvailableFacility } from "../facilities/Facility"


/** In ms. */
export const stage_overlay__fade_duration = 1.5 * 1000

/**
 * This function returns the specified full-screen interactive sketch.
 * 
 * Stage overlay is completely hide only before fade-in, or after fade-out.
 * * When `selected_facility` change to non-null, set class name to `"FadingIn"`.
 * * When change to null, set class name to `"FadingOut"`.
 */
export function StageOverlay({ selected_facility }: StageOverlay_Param)
{
    const [class_name__stage_overlay, setClassNameOfStageOverlay] = useState<"" | "FadingIn" | "FadingOut">("")

    const onCloseButtonClick = () =>
    {
        document.dispatchEvent(new CustomEvent("facility_exit", { bubbles: true }))
    }
    const onKeyboardPress = (event: KeyboardEvent) =>
    {
        if (event.key == "Escape") { document.dispatchEvent(new CustomEvent("facility_exit", { bubbles: true })) }
    }

    // Init.
    useEffect(() =>
    {
        // Add handler for listening to exit signal
        document.addEventListener("keypress", onKeyboardPress)

        return () =>
        {
            document.removeEventListener("keypress", onKeyboardPress)
        }
    }, [])

    // Listen to `selected_facility`.
    useEffect(() =>
    {
        setClassNameOfStageOverlay(selected_facility != null ? "FadingIn" : "FadingOut")
    }, [selected_facility])

    return (<div id="stage_overlay" className={class_name__stage_overlay}>
        <div id="stage_overlay__close_button" onClick={onCloseButtonClick}>X</div>
        <div id="stage_overlay__content">
            {selected_facility == AvailableFacility.singing_text
                && "singing_text"}
        </div>
    </div>)
}

type StageOverlay_Param = {
    /** Null means "no facility selected yet". */
    selected_facility: SelectedFacility
}