import React, { useEffect, useRef, useState } from "react"
import belling_the_cat__text from "@/public/aesop_text/belling_the_cat.txt"
import { SyntaxPlayer } from "@/app/sketches/singing_text/music_player"
import { useMusicContext_Context } from "../../page"

import "./SingingTextOverlay.scss"

const singing_text_overlay__textarea__id = "singing_text_overlay__textarea"

/**
 * Overlay content of the singing text, after clicking singing text facility.
 */
export default function SingingTextOverlay()
{
    const music_context__ref = useMusicContext_Context()

    const [text_to_sing, setTextToSing] = useState("")
    const sign_area__ref = useRef<HTMLDivElement>(null)
    const textarea__ref = useRef<HTMLTextAreaElement>(null)
    const syntax_player = useRef<SyntaxPlayer>(new SyntaxPlayer(music_context__ref.current))
    const is_playing = useRef(false)

    /** Any change in text area will cause stop of music. */
    const onTextAreaChange = () =>
    {
        if (is_playing.current) // If is playing.
        {
            syntax_player.current.stopPlaying("release_all")
            is_playing.current = false
        }
    }
    /** Submit the text edited in `<textarea />`, and let the singing facility to work. */
    const submitText = () =>
    {
        setTextToSing(textarea__ref.current?.value ?? "")
        is_playing.current = true
    }
    /** Test if there a blank-area click. If so, trigger `submitText`. */
    const onSignAreaClick = (event: React.MouseEvent<HTMLDivElement>) =>
    {
        // If inside sign area, abort.
        if (sign_area__ref.current?.contains(event.target as Node) ?? false)
        {
            return
        }
        else
        {
            submitText()
        }
    }

    // Init.
    useEffect(() =>
    {
        // Use this to trigger playing.
        setTextToSing(belling_the_cat__text)
    }, [])

    // On `text_to_sing` changed.
    useEffect(() =>
    {
        syntax_player.current.stopPlaying("release_all")
        syntax_player.current.playMusic(singing_text_overlay__textarea__id)
    }, [text_to_sing])

    return (<div id="singing_text_overlay" className="CenteredOverlayContent">
        <div id="singing_text_overlay__sign_area" ref={sign_area__ref} onClick={onSignAreaClick}>
            <div id="singing_text_overlay__face_of_sign">
                <textarea id={singing_text_overlay__textarea__id} ref={textarea__ref}
                    onChange={onTextAreaChange}
                    defaultValue={belling_the_cat__text} />
            </div>
            <div id="singing_text_overlay__stick_of_sign">|</div>
        </div>
    </div>)
}