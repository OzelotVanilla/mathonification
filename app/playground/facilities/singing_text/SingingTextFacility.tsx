"use client"

import { RefObject, useEffect, useRef, useState } from "react";
import { AvailableFacility, Facility } from "../Facility";
import { SingingTextAmbientPlayer } from "./SingingTextAmbientPlayer";
import { MusicContext } from "@/utils/music";
import { MusicTimeBroadcastEvent } from "../facility_event.extend.interface";
import { SoundManager } from "@/utils/SoundManager";

export function SingingTextFacility({ music_context__ref }: SingingTextFacility_Param)
{
    const [is_loading, setWhetherLoading] = useState(true)
    const ambient_player__ref = useRef<SingingTextAmbientPlayer>(null)

    /** As non-focused object, play ambient BGM. */
    const onReceivingMusicTimeBroadcast = (event: CustomEvent<MusicTimeBroadcastEvent>) =>
    {
        const { measure, beat } = event.detail
        ambient_player__ref.current?.update(measure, beat)
    }

    // This function is only responsible for init the facility (thumbnail),
    //  the full-screen interaction should be init-ed in `stage_overlay`.
    useEffect(() =>
    {
        if (music_context__ref == null) { return }

        // IIFE.
        (async () =>
        {
            await SoundManager.resume_finished
            ambient_player__ref.current = new SingingTextAmbientPlayer(music_context__ref.current)

            document.addEventListener("music_time_broadcast", onReceivingMusicTimeBroadcast)

            setWhetherLoading(false)
        })()

        return () =>
        {
            document.removeEventListener("music_time_broadcast", onReceivingMusicTimeBroadcast)
            ambient_player__ref.current?.dispose()
        }
    }, [])

    return (<Facility name={AvailableFacility.singing_text} style={{ top: "30%", left: "60%" }}
        is_loading={is_loading} ambient_player__ref={ambient_player__ref}>
        <span >SINGING TEXT FACILITY</span>
    </Facility>)
}


type SingingTextFacility_Param = {
    music_context__ref: RefObject<MusicContext>
}