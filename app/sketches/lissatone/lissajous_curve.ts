import { isClientEnvironment } from "@/utils/env"

import { create as createZustand, StoreApi, UseBoundStore } from "zustand"
import { gcd, mapLinearToLinear, normaliseRadian } from "@/utils/math"

export type LissajousState = {
    /**
     * Value of `a`. Should be integer.
     * 
     * Default to `4` (a is 4 and b is 1).
     */
    a: number
    /**
     * Value of `b`. Should be integer.
     * 
     * Default to `4` (a is 4 and b is 1).
     */
    b: number
    /**
     * Current `ϕ` value.
     * 
     * Will be in the range `[0, 2 * pi]`.
     */
    phi: number
    /**
     * The speed of increasing of the `ϕ` in seconds.
     * 
     * By default, it is `pi`, means `ϕ` is increased by 1 pi each second.
     */
    phi_changing_speed: number
}

export type LissajousAction = {
    setA: (v: LissajousState["a"]) => void
    setB: (v: LissajousState["b"]) => void
    setPhiChangingSpeed: (v: LissajousState["phi_changing_speed"]) => void
    setPhi: (v: LissajousState["phi"]) => void
}

export class LissajousCurve
{
    useLissajousCurveParamStore: UseBoundStore<StoreApi<LissajousState & LissajousAction>>

    viewport_x_max: number

    viewport_y_max: number

    dpr: number = 1

    need_redraw: boolean = true

    constructor()
    {
        this.viewport_x_max = isClientEnvironment() ? window.innerWidth : 0
        this.viewport_y_max = isClientEnvironment() ? window.innerHeight : 0

        this.useLissajousCurveParamStore = createZustand<LissajousState & LissajousAction>((set) => ({
            a: 1,
            b: 4,
            phi_changing_speed: Math.PI / 40,
            phi: 0.0,
            setA: (new_a: number) => set(() => ({ a: new_a })),
            setB: (new_b: number) => set(() => ({ b: new_b })),
            setPhiChangingSpeed: (new_phi_changing_speed: number) => set(() => ({ phi_changing_speed: new_phi_changing_speed })),
            setPhi: (new_phi: number) => set(() => ({ phi: normaliseRadian(new_phi) }))
        }))
    }

    last_call_timestamp__updateCurveParam: number = 0
    /**
     * Update the curve's parameter (phi) according to time elapsed since last call.
     * Using `performance.now` for timestamp.
     * 
     * Will clamp to 50 ms if the interval is too big.
     */
    updateCurveParam()
    {
        const now = performance.now()
        const elapsed_in_seconds = Math.min(now - this.last_call_timestamp__updateCurveParam, 50) / 1000
        this.last_call_timestamp__updateCurveParam = now

        const param_store = this.useLissajousCurveParamStore.getState()
        param_store.setPhi(param_store.phi + param_store.phi_changing_speed * elapsed_in_seconds)

        this.need_redraw = true
    }
}