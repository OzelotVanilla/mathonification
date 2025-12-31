import { AvailableFacility } from "./Facility";

export type MusicTimeBroadcastEvent = {
    beat: number
    measure: number
}

declare global
{
    interface DocumentEventMap
    {
        "facility_click": CustomEvent<AvailableFacility>
        "facility_exit": CustomEvent<AvailableFacility | undefined>
        "music_time_broadcast": CustomEvent<MusicTimeBroadcastEvent>
    }
}