"use client"

import { RefObject, useEffect, useRef, useState } from "react"

import "./page.scss"
import { LissajousCurve } from "../lissajous_curve_harmonics/lissajous_curve"
import { drawLissajousCurveOnCanvas } from "../lissajous_curve_harmonics/draw_lissajous_curve"
import { LissajousSoundPlayer } from "./sound_generate"

export default function LissajousPage()
{
    const [is_started, setWhetherStarted] = useState(false)
    const lissajous_curve = useRef<LissajousCurve>(new LissajousCurve())
    const lissajous_player = useRef<LissajousSoundPlayer>(null)
    const canvas_ref = useRef<HTMLCanvasElement>(null)

    const handleMouseMove = (event: MouseEvent) =>
    {
        const x = event.clientX
        const y = event.clientY

        lissajous_curve.current.updateMouseLocation(x, y)
    }
    const start = (event: React.MouseEvent<HTMLDivElement>) =>
    {
        setWhetherStarted(true)
        lissajous_player.current = new LissajousSoundPlayer(lissajous_curve.current)
        lissajous_player.current.resume().then(() =>
        {
            lissajous_player.current!.start()
        })
        lissajous_curve.current.updateMouseLocation(event.clientX, event.clientY)
    }

    useEffect(() =>
    {
        window.addEventListener("mousemove", handleMouseMove)

        return () =>
        {
            lissajous_player.current?.stop()
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [])

    return (<div id="lissajous_curve">{
        is_started
            ? (<>
                <CurveDisplay lissajous_curve={lissajous_curve} canvas_ref={canvas_ref} />
                <ValueDisplay lissajous_curve={lissajous_curve} />
            </>)
            : (<div className="PageCover" onClick={start}>
                <div className="Text">Lissajous Curve & Waveform</div>
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
        const canvas__css_width = canvas_ref.current.clientWidth
        const canvas__css_height = canvas_ref.current.clientHeight
        canvas_ref.current.width = canvas__css_width * dpr
        canvas_ref.current.height = canvas__css_height * dpr
        const c = canvas_ref.current.getContext("2d")!
        c.transform(1, 0, 0, 1, 0, 0)
        c.scale(dpr, dpr)
        c.imageSmoothingEnabled = false

        lissajous_curve.current.viewport_x_max = window.innerWidth
        lissajous_curve.current.viewport_y_max = window.innerHeight
        lissajous_curve.current.dpr = dpr
        lissajous_curve.current.need_redraw = true
    }

    useEffect(() =>
    {
        if (canvas_ref == null || canvas_ref.current == null) { return }
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

function ValueDisplay({ lissajous_curve }: ValueControl__Params)
{

    return (<div id="value_control">

    </div>)
}

type ValueControl__Params = {
    lissajous_curve: RefObject<LissajousCurve>
}