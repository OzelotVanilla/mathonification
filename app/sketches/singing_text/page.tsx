"use client"

import "./page.scss"
import "./highlight.scss"
import belling_the_cat__text from "@/public/aesop_text/belling_the_cat.txt"

import { Button, Card, Form, Typography } from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { convertToTokens } from "./tokeniser";
import { ConjunctionType } from "./constants";
import { highlightContent } from "./highlighter";
import { SyntaxPlayer } from "./music_player";
import { SoundManager } from "@/utils/SoundManager";

export default function SyntaxConjuctionsHighlight()
{
    const [user_text, setUserText] = useState<string>("")
    const [is_started, setWhetherStarted] = useState(false)

    const start = () =>
    {
        SoundManager.resume()
        setWhetherStarted(true)
    }

    useEffect(() =>
    {
        SoundManager.preloadSamplingFile()
    }, [])

    return (<div id="syntax_conjunctions_highlight">{
        is_started
            ? (<>
                <PageTitle />
                <div id="left_and_right_flex">
                    <LeftFormArea setUserText={setUserText} />
                    <RightResultArea user_text={user_text} />
                </div>
            </>)
            : (
                <div className="PageCover" onClick={start}>
                    <div className="Text">Singing Text</div>
                </div>
            )
    }</div>)
}

function PageTitle()
{
    const { Title } = Typography

    return (<Title id="page_title">
        Singing Text
    </Title>)
}

function LeftFormArea({ setUserText }: LeftFormArea__Params)
{
    const [is_button_disabled, setWhetherButtonDisabled] = useState(true)

    const [form] = Form.useForm()
    const form_init_value = {
        user_text: belling_the_cat__text
    }

    function onFormSubmit(values: FormReturnData)
    {
        if ((values.user_text ?? "").length > 0)
        {
            setUserText(values.user_text)
        }
    }

    useEffect(() =>
    {
        (async () =>
        {
            await SoundManager.resume_finished
            setWhetherButtonDisabled(false)
        })()
    }, [])

    return (<Form id="left_form_area" variant="filled" form={form} initialValues={form_init_value} onFinish={onFormSubmit}>
        <Form.Item name="user_text" noStyle={true}>
            <TextArea id="text_input_area" placeholder="Input your text here (English only)." />
        </Form.Item>
        <Form.Item noStyle={true}>
            <Button disabled={is_button_disabled} type="primary" htmlType="submit">Generate Music</Button>
        </Form.Item>
    </Form>)
}

type LeftFormArea__Params = {
    setUserText: Dispatch<SetStateAction<string>>
}

type FormReturnData = {
    user_text: string
}

function RightResultArea({ user_text }: RightResultArea__Params)
{
    const text_container_ref = useRef<HTMLDivElement>(null)
    const syntax_player = useRef<SyntaxPlayer>(new SyntaxPlayer())

    let content_to_show: React.ReactNode = user_text.length > 0
        ? (<p>{convertUserTextToContent(user_text, text_container_ref)}</p>)
        : (<p className="placeholder">Please input text at left, then press the button to generate.</p>)

    useEffect(function ()
    {
        if (user_text.length > 0)
        {
            highlightContent()
            syntax_player.current?.playMusic()
        }

        // Clean-up.
        return () =>
        {
            syntax_player.current?.stopPlaying()
        }
    }, [user_text])

    return (<div id="right_result_area"><Card className="result_card"><div id="singing_text__text_container" ref={text_container_ref}>
        {content_to_show}
    </div></Card></div>)
}

type RightResultArea__Params = {
    user_text: string
}

function convertUserTextToContent(user_input_text: string, text_container_ref: React.RefObject<HTMLDivElement | null>)
{
    if (text_container_ref.current == null) { return (<></>) }

    return convertToTokens(user_input_text).map(
        function (token, index)
        {
            if (token.type == ConjunctionType.not_a_conjuction) { return (<span key={index}>{token.text}</span>) }
            else
            {
                return (<span key={index} data-type={token.type}>{token.text}</span>)
            }
        }
    )
}