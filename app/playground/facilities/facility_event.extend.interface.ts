import { AvailableFacility } from "./Facility";

export type MusicTimeBroadcastEvent = {
    beat: number
    measure: number
}

export type FacilityMountEventDetail = {
    name: AvailableFacility
    element: HTMLElement
}

export type FacilityUnmountEventDetail = {
    name: AvailableFacility
}

declare global
{
    interface DocumentEventMap
    {
        "facility_click": CustomEvent<AvailableFacility>
        "facility_exit": CustomEvent<AvailableFacility | undefined>
        "facility_mount": CustomEvent<FacilityMountEventDetail>
        "facility_unmount": CustomEvent<FacilityUnmountEventDetail>
        "music_time_broadcast": CustomEvent<MusicTimeBroadcastEvent>
    }
}