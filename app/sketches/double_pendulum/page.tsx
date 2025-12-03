"use client"

import "./page.scss"

import { useEffect, useRef, useState } from "react"
import { SimplePendulum } from "@/scripts/pendulum/SimplePendulum.interface"
import { DoublePendulum, getEvenMassDoublePendulum } from "@/scripts/pendulum/DoublePendulum"
import { drawMusicDoublePendulumOnCanvas } from "./draw_pendulum_on_canvas"
import { MusicalDoublePendulum } from "./MusicalDoublePendulum"

/**
 * 120 Hz.
 */
const refresh_rate = 1 / 120

export default function DoublePendulumPage()
{
    const [pendulums, setPendulums] = useState<MusicalDoublePendulum[]>([])
    const canvas_ref = useRef<HTMLCanvasElement>(null)

    function start()
    {
        let pendulum = MusicalDoublePendulum.generatePendulumInUpperArea()
        pendulum.resumeAudioContext()

        const canvas = canvas_ref.current
        if (canvas == null) { return }

        const canvas_context = canvas.getContext("2d")
        if (canvas_context == null) { return }

        const length_of_canvas = pendulum.getMaxLength() * 2
        canvas.height = length_of_canvas + 20 // Add 20 px to avoid clipping of moving ball.
        canvas.width = length_of_canvas + 20

        // Physics.

        let last_timestamp: number | null = null
        const updatePendulumPhysics = function ()
        {
            const now = Date.now()
            if (last_timestamp == null) { last_timestamp = now }

            // Clamp to under 50ms.
            const delta = Math.min(50, now - last_timestamp)
            last_timestamp = now

            pendulum.next(delta)
            setTimeout(updatePendulumPhysics, refresh_rate * 1000)
        }

        // Drawing.

        type DrawFunctionType = (pendulum: SimplePendulum, canvas_context: CanvasRenderingContext2D) => any
        let drawFunction: DrawFunctionType

        if (pendulum instanceof MusicalDoublePendulum)
        {
            drawFunction = drawMusicDoublePendulumOnCanvas as DrawFunctionType
        }
        else
        {
            drawFunction = () => { }
        }

        const drawToCanvas = function ()
        {
            drawFunction(pendulum, canvas_context)
            requestAnimationFrame(drawToCanvas)
        }

        // Add event listener to keep UI update alive.
        document.addEventListener("visibilitychange", function ()
        {
            last_timestamp = Date.now()
            requestAnimationFrame(drawToCanvas)
        })

        // Start physics and graphics update.
        setTimeout(updatePendulumPhysics)
        requestAnimationFrame(drawToCanvas)

        setPendulums([pendulum])
    }

    useEffect(() =>
    {
        // Clean-up.
        return () =>
        {
            for (const p of pendulums) { p.stop() }
        }
    }, [pendulums])

    return (
        <div id="pendulums_container" onClick={start}>
            {pendulums.length <= 0 ? (<p id="pendulums_container_empty__hint_text">Double Pendulum</p>) : (<></>)}
            <canvas id="canvas" hidden={pendulums.length <= 0} ref={canvas_ref} />
        </div>
    )
}