import React, { useEffect, useRef, useState } from "react"
import belling_the_cat__text from "@/public/aesop_text/belling_the_cat.txt"
import { SyntaxPlayer } from "@/app/sketches/singing_text/music_player"
import { convertToTokens } from "@/app/sketches/singing_text/tokeniser"
import { ConjunctionType } from "@/app/sketches/singing_text/constants"
import { highlightContent } from "@/app/sketches/singing_text/highlighter"
import { useMusicContext_Context } from "../../page"

import "./SingingTextOverlay.scss"
import "@/app/sketches/singing_text/highlight.scss"

const singing_text_overlay__textarea__id = "singing_text_overlay__textarea"

/**
 * Overlay content of the singing text, after clicking singing text facility.
 */
export default function SingingTextOverlay()
{
    const music_context__ref = useMusicContext_Context()

    const [submitted_text, setSubmittedText] = useState(belling_the_cat__text)
    const [__should_restart_music__bool, __setShouldRestartMusicBool] = useState(false)
    const shouldRestartMusic = () => __setShouldRestartMusicBool(v => !v)
    const [is_dirty, setIsDirty] = useState(false)
    const [is_textarea_focused, setWhetherTextareaFocused] = useState(false)
    const sign_area__ref = useRef<HTMLDivElement>(null)
    const textarea__ref = useRef<HTMLTextAreaElement>(null)
    const syntax_player = useRef<SyntaxPlayer>(new SyntaxPlayer(music_context__ref.current))
    const is_playing = useRef(false)

    /** Any change in text area will cause stop of music. */
    const onTextAreaChange = () =>
    {
        setIsDirty(true)
        CSS.highlights.clear()

        if (is_playing.current) // If is playing.
        {
            syntax_player.current.stopPlaying("release_all")
            is_playing.current = false
        }
    }
    /** Submit the text edited in `<textarea />`, and let the singing facility to work. */
    const submitText = () =>
    {
        // Even if the text does not change after edit, the once stopped music should be restarted.
        setSubmittedText(textarea__ref.current?.value ?? "")
        shouldRestartMusic()
        setIsDirty(false)
    }
    /** Test if there a blank-area click. If so, trigger `submitText`. */
    const onSignAreaClick = (event: React.MouseEvent<HTMLDivElement>) =>
    {
        // If inside sign area, abort.
        if (textarea__ref.current?.contains(event.target as Node) ?? false)
        {
            return
        }
        else if (is_dirty) // Only submit if there is an edit action.
        {
            submitText()
        }
    }

    // On `submitted_text` changed. The play of music is triggered by this.
    useEffect(() =>
    {
        syntax_player.current.stopPlaying("release_all")
        highlightContent()
        syntax_player.current.playMusic()
        is_playing.current = true
    }, [submitted_text, __should_restart_music__bool])

    return (<div id="singing_text_overlay" className="CenteredOverlayContent">
        <div id="singing_text_overlay__sign_area" ref={sign_area__ref} onClick={onSignAreaClick}>
            <div id="singing_text_overlay__face_of_sign">
                <textarea id={singing_text_overlay__textarea__id} ref={textarea__ref}
                    onChange={onTextAreaChange}
                    onFocus={() => setWhetherTextareaFocused(true)}
                    onBlur={() => setWhetherTextareaFocused(false)}
                    className={is_dirty || is_textarea_focused ? "" : "Masked"}
                    defaultValue={belling_the_cat__text} />
                {!is_dirty &&
                    (<div id="singing_text__text_container"
                        aria-hidden={true}
                        className={is_textarea_focused ? "Masked" : ""}>
                        {renderTokenisedContent(submitted_text)}
                    </div>)}
            </div>
            <div id="singing_text_overlay__stick_of_sign">|</div>
        </div>
    </div>)
}

function renderTokenisedContent(text: string)
{
    return convertToTokens(text).map((token, index) =>
    {
        if (token.type == ConjunctionType.not_a_conjuction)
        {
            return (<span key={index}>{token.text}</span>)
        }
        return (<span key={index} data-type={token.type}>{token.text}</span>)
    })
}