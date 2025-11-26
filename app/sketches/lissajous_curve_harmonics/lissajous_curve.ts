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
            a: 4,
            b: 4,
            phi_changing_speed: Math.PI / 40,
            phi: 0.0,
            setA: (new_a: number) => set(() => ({ a: new_a })),
            setB: (new_b: number) => set(() => ({ b: new_b })),
            setPhiChangingSpeed: (new_phi_changing_speed: number) => set(() => ({ phi_changing_speed: new_phi_changing_speed })),
            setPhi: (new_phi: number) => set(() => ({ phi: normaliseRadian(new_phi) + Math.PI }))
        }))
    }

    last_call_timestamp__updateCurveParam: number = 0
    /**
     * Update the curve's parameter according to time elapsed since last call.
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

    /**
     * `x` and `y` should be `clientX` and `clientY`.
     * 
     * @returns Calculated new `a` and `b`.
     */
    updateMouseLocation(x: number, y: number)
    {
        const param_store = this.useLissajousCurveParamStore.getState()

        // Mapping the mouse [0, width] to [20 ** -1, 20 ** 1].
        // const a_b_ratio = Math.pow(20, mapLinearToLinear(x, 0, this.viewport_x_max, -1, 1))
        // param_store.setABRatio(a_b_ratio)

        // const phi_changing_speed = Math.PI * mapLinearToLinear(y, 0, this.viewport_y_max, 0.5, 2)
        // param_store.setPhiChangingSpeed(phi_changing_speed)

        // Mapping the mouse `x` from [0, width] to [1, 20].
        const old_a = param_store.a
        const new_a = Math.floor(mapLinearToLinear(x, 0, this.viewport_x_max, 1, 20))

        // Mapping the mouse `y` from [0, height] to [1, 20].
        const old_b = param_store.b
        const new_b = Math.floor(mapLinearToLinear(y, 0, this.viewport_y_max, 1, 20))

        if (old_a != new_a || old_b != new_b)
        {
            param_store.setA(new_a)
            param_store.setB(new_b)
            this.need_redraw = true
        }

        return [new_a, new_b]
    }
}

/**
 * Use the `a` and `b` param to calculate the simplicity of the curve.
 * 
 * Lower the result, simpler the graph.
 */
export function calculateSimplicity(a: number, b: number)
{
    const common_divisor = gcd(a, b)

    return Math.min(
        5,
        Math.round(Math.log2((a + b) / common_divisor))
    )
}