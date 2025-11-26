/**
 * Revised by Gemini.
 */;

import { clearCanvas } from "@/utils/canvas";
import { calculateSimplicity, LissajousCurve } from "./lissajous_curve";
import { gcd, lcm } from "@/utils/math";

/**
 * Draw the `t` parameter of the lissajous until this number.
 * 
 * One cycle is `2 * pi`.
 */
const max_cycle_of_drawing = 60 * Math.PI

const scale_of_coord = 120

const line_width = 2

/**
 * Smaller = smoother but slower. 0.01 is usually good.
 */
const resolution = 0.01

const colour_from_simplicity = [
    "#00552e",// 0
    "#5f984d",// 1
    "#c3d825",// 2
    "#f7c114",// 3
    "#dd7a56",// 4
    "#eb6101",// 5
] as const

export function drawLissajousCurveOnCanvas(lissajous_canvas: HTMLCanvasElement, lissajous_curve: LissajousCurve)
{
    if (lissajous_canvas == null || lissajous_curve == null) { return }
    const c = lissajous_canvas.getContext("2d")!
    clearCanvas(c)

    const param_store = lissajous_curve.useLissajousCurveParamStore.getState()
    const phi = param_store.phi
    const a = param_store.a
    const b = param_store.b
    const true_period = 2 * Math.PI / gcd(a, b)
    const cycle_of_drawing = Math.min(true_period, max_cycle_of_drawing)
    const delta = resolution / Math.max(a, b, 1)
    const screen_center_x_offset = c.canvas.clientWidth / 2
    const screen_center_y_offset = c.canvas.clientHeight / 2
    const simplicity = calculateSimplicity(a, b)

    c.strokeStyle = colour_from_simplicity[simplicity] ?? "#e45ea2"
    c.lineWidth = line_width
    c.beginPath()

    // For the first move.
    let x = scale_of_coord * Math.sin(phi) + screen_center_x_offset
    let y = screen_center_y_offset
    c.moveTo(x, y)
    for (let t = delta; t < cycle_of_drawing; t += delta)
    {
        x = scale_of_coord * Math.sin(a * t + phi) + screen_center_x_offset
        y = scale_of_coord * Math.sin(b * t) + screen_center_y_offset
        c.lineTo(x, y)
    }

    // By Gemini:
    // Optional: Ensure the loop closes perfectly by drawing the exact final point
    if (cycle_of_drawing == true_period)
    {
        x = scale_of_coord * Math.sin(a * true_period + phi) + screen_center_x_offset
        y = scale_of_coord * Math.sin(b * true_period) + screen_center_y_offset
        c.lineTo(x, y)
    }

    c.moveTo(x, y)
    c.stroke()
}