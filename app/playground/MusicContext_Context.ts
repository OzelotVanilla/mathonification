import { type MusicContext } from "@/utils/music"
import { createContext, useContext, type RefObject } from "react"

export const MusicContext_Context = createContext<RefObject<MusicContext> | null>(null)
export const useMusicContext_Context = () =>
{
    const music_context__ref = useContext(MusicContext_Context)
    if (music_context__ref == null) { throw new Error("MusicContext provider missing") }
    return music_context__ref
}