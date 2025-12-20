"use client"

import "./page.scss"

import { RefObject, useEffect, useRef, useState } from "react"
import { LissajousCurve } from "./lissajous_curve"
import { drawLissajousCurveOnCanvas } from "./draw_lissajous_curve"
import { LissajousSoundPlayer } from "./sound_generate"
import { adjustCanvasToDPR } from "@/utils/canvas"

export default function LissajousPage()
{
    const [is_started, setWhetherStarted] = useState(false)
    const lissajous_curve = useRef<LissajousCurve>(new LissajousCurve())
    const lissajous_player = useRef<LissajousSoundPlayer>(null)
    const canvas_ref = useRef<HTMLCanvasElement>(null)

    const start = () =>
    {
        setWhetherStarted(true)
        lissajous_player.current = new LissajousSoundPlayer(lissajous_curve.current)
        lissajous_player.current.resume().then(() =>
        {
                lissajous_player.current!.start()
        })
    }

    useEffect(() =>
    {
        return () =>
        {
            lissajous_player.current?.stop()
        }
    }, [])

    return (<div id="lissajous_curve_harmonics">{
        is_started
            ? (
                <CurveDisplay lissajous_curve={lissajous_curve} canvas_ref={canvas_ref} />
            )
            : (<div className="PageCover" onClick={start}>
                <div className="Text">lissatone</div>
            </div>)
    }
    </div>)
}

/**
 * The area drawing the curve.
 */
function CurveDisplay({ lissajous_curve, canvas_ref }: CurveDisplay__Params)
{
    const onWindowResize = () =>
    {
        if (canvas_ref == null || canvas_ref.current == null) { return }
        const dpr = window.devicePixelRatio || 1;

        adjustCanvasToDPR(canvas_ref.current)

        lissajous_curve.current.viewport_x_max = window.innerWidth
        lissajous_curve.current.viewport_y_max = window.innerHeight
        lissajous_curve.current.dpr = dpr
        lissajous_curve.current.need_redraw = true
    }

    useEffect(() =>
    {
        if (canvas_ref == null || canvas_ref.current == null) { return }
        const c = canvas_ref.current.getContext("2d")!
        c.imageSmoothingEnabled = false
        onWindowResize()

        window.addEventListener("resize", onWindowResize)
        const update = () =>
        {
            lissajous_curve.current.updateCurveParam()
            if (lissajous_curve.current.need_redraw)
            {
                drawLissajousCurveOnCanvas(canvas_ref.current!, lissajous_curve.current)
                requestAnimationFrame(update)
            }
        }

        const update__anime_id = requestAnimationFrame(update)

        // On unmount clean-up.
        return () =>
        {
            window.removeEventListener("resize", onWindowResize)
            cancelAnimationFrame(update__anime_id)
        }
    }, [])

    return (<div id="curve_display">
        <canvas id="curve_display_canvas" ref={canvas_ref} />
    </div>)
}

type CurveDisplay__Params = {
    lissajous_curve: RefObject<LissajousCurve>
    canvas_ref: RefObject<HTMLCanvasElement | null>
}