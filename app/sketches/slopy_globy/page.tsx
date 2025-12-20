"use client"

import "./page.scss"

import { useEffect, useRef, useState } from "react"
import { WebGLRenderer } from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { SlopeChangingGlobe } from "./SlopeChangingGlobe"
import { CollisionWorld } from "./CollisionWorld"


export default function SlopeGlobePage()
{
    const [is_started, setWhetherStarted] = useState(false)

    const start = () =>
    {
        setWhetherStarted(true)
    }

    return (<div id="slope_globe">
        {
            is_started
                ? (<GlobeDisplay />)
                : (<div className="PageCover" onClick={start}>
                    <div className="Text">slopy globy</div>
                </div>)
        }
    </div>)
}

function GlobeDisplay()
{
    const canvas_ref = useRef<HTMLCanvasElement>(null)
    const renderer = useRef<WebGLRenderer>(null)
    const orbit_control = useRef<OrbitControls>(null)

    const slope_globe = useRef(new SlopeChangingGlobe())
    const collision_world = useRef(new CollisionWorld(slope_globe.current!))

    const draw__cancel_id = useRef(-1)
    const updateGlobe__cancel_id = useRef(-1)

    const draw = () =>
    {
        renderer.current?.render(slope_globe.current.scene, slope_globe.current.camera)
        draw__cancel_id.current = requestAnimationFrame(draw)
    }
    const updatePhysics = () =>
    {
        slope_globe.current.update()
        collision_world.current.update(slope_globe.current.curvature)
        updateGlobe__cancel_id.current = requestAnimationFrame(updatePhysics)
    }

    useEffect(() =>
    {
        renderer.current = new WebGLRenderer({ canvas: canvas_ref.current! })
        renderer.current.setSize(canvas_ref.current!.clientWidth, canvas_ref.current!.clientHeight)
        renderer.current.setPixelRatio(window.devicePixelRatio)
        orbit_control.current = new OrbitControls(slope_globe.current.camera, renderer.current.domElement)
        draw()
        updatePhysics()

        const onResize = () =>
        {
            const width = canvas_ref.current!.clientWidth
            const height = canvas_ref.current!.clientHeight

            slope_globe.current.camera.aspect = width / height
            slope_globe.current.camera.updateProjectionMatrix()

            renderer.current!.setSize(width, height)
        }
        window.addEventListener("resize", onResize)

        return () =>
        {
            cancelAnimationFrame(draw__cancel_id.current)
            cancelAnimationFrame(updateGlobe__cancel_id.current)
        }
    }, [])

    return (<div id="globe_display">
        <canvas id="globe_display_canvas" ref={canvas_ref} />
    </div>)
}