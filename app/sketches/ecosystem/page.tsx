"use client"

import { getContext as getToneContext, Sampler, loaded as onToneLoaded, Compressor, ToneAudioNode, Vibrato } from "tone";
import { adjustCanvasToDPR } from "@/utils/canvas"
import { drawEcosystem } from "./draw_ecosystem"
import { MusicalEcosystem } from "./MusicalEcosystem"
import { SoundManager } from "@/utils/SoundManager"
import { RefObject, useEffect, useRef, useState } from "react"

import "./page.scss"


export default function EcosystemPage()
{
    const [is_started, setWhetherStarted] = useState(false)
    const [title, setTitle] = useState("")
    const musical_ecosystem_ref = useRef<MusicalEcosystem>(null)

    const start = () =>
    {
        setWhetherStarted(true)
        musical_ecosystem_ref.current = new MusicalEcosystem()
        musical_ecosystem_ref.current.resume()
    }

    useEffect(() =>
    {
        onToneLoaded().then(() =>
        {
            setTitle("Ecosystem")
        })
    })

    return (<div id="ecosystem">
        {
            is_started
                ? (<EcosystemDisplay musical_ecosystem_ref={musical_ecosystem_ref} />)
                : (<div className="PageCover" onClick={title.length == 0 ? () => { } : start}>
                    <div className="Text">{title.length == 0 ? "loading ..." : title}</div>
                </div>)
        }
    </div>)
}

function EcosystemDisplay({ musical_ecosystem_ref }: { musical_ecosystem_ref: RefObject<MusicalEcosystem | null> })
{
    if (musical_ecosystem_ref.current == null) { return }

    const canvas_ref = useRef<HTMLCanvasElement>(null)

    const draw__cancel_id = useRef(-1)
    const updateEcosystem__cancel_id = useRef(-1)

    const draw = () =>
    {
        if (canvas_ref.current == null || musical_ecosystem_ref.current == null) { return }
        drawEcosystem(canvas_ref.current, musical_ecosystem_ref.current.ecosystem)
        draw__cancel_id.current = requestAnimationFrame(draw)
    }
    const updateEcosystem = () =>
    {
        if (musical_ecosystem_ref.current == null) { return }
        musical_ecosystem_ref.current.update()
        updateEcosystem__cancel_id.current = requestAnimationFrame(updateEcosystem)
    }
    const onScreenClick = (event: React.MouseEvent<HTMLDivElement>) =>
    {
        musical_ecosystem_ref.current!.receiveScreenClick(event.clientX, event.clientY)
    }
    const onResize = () =>
    {
        if (canvas_ref == null || canvas_ref.current == null) { return }

        adjustCanvasToDPR(canvas_ref.current)
        musical_ecosystem_ref.current!.resize()
    }

    useEffect(() =>
    {
        onResize()
        draw()
        updateEcosystem()

        window.addEventListener("resize", onResize)

        return () =>
        {
            cancelAnimationFrame(draw__cancel_id.current)
            cancelAnimationFrame(updateEcosystem__cancel_id.current)
        }
    }, [])

    return (<div id="ecosystem_display" onClick={onScreenClick}>
        <canvas id="ecosystem_canvas" ref={canvas_ref} />
    </div>)
}