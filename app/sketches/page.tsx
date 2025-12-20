"use client"

import { Card } from "antd"
import { sketch_to_show__array } from "./const_sketch_to_show"

import "./page.scss"
import Link from "next/link"
import { useEffect, useState } from "react"


export default function SketchPage()
{
    const [is_loading, setWhetherStillLoading] = useState(true)

    useEffect(() =>
    {
        setWhetherStillLoading(false)
    }, [])

    return (<div id="sketch">
        <div className="Background"><div className="Text">Sketches</div></div>
        <SketchGallery is_loading={is_loading} />
    </div>)
}

function SketchGallery({ is_loading }: SketchGallery__Params)
{
    return (<div id="sketch_gallery">
        {
            sketch_to_show__array.map((metadata) =>
            {
                const cover_image = (<img className="ImageCover"
                    src={metadata.thumbnail_file_path ?? `/images/sketches/${metadata.path_name}/thumbnail.png`} />)

                return (<div className="SketchCard" key={metadata.path_name}><Link href={`/sketches/${metadata.path_name}`}>
                    <Card hoverable={true} cover={cover_image} loading={is_loading}>
                        <Card.Meta title={metadata.name ?? ""} />
                    </Card>
                </Link></div>)
            })
        }
    </div>)
}

type SketchGallery__Params = {
    is_loading: boolean
}