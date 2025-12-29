"use client"

import { Gain, InputNode, loaded as onToneLoaded, OutputNode, ToneAudioNode } from "tone";
import { SoundManager } from "./SoundManager";

export class SoundEffectChainManager
{
    /**
     * Stores effect chain.
     * 
     * All `ToneAudioNode` in the chain is connected.
     */
    private effect_chain_dict: Map<string, ToneAudioNode[]> = new Map([
    ])

    constructor()
    {

    }

    /**
     * 
     * @param effect_array Should not connect.
     */
    add(chain_name: string, effect_array: ToneAudioNode[], output_node: ToneAudioNode)
    {
        if (this.effect_chain_dict.has(chain_name))
        {
            throw Error(
                `Chain name ${chain_name} already exists. ` +
                "Either change the chain name, or delete existing one. " +
                "Effect chain not added."
            )
        }

        if (effect_array.length >= 2)
        {
            for (let i = 1; i < effect_array.length; i++)
            {
                effect_array[i - 1].connect(effect_array[i])
            }
        }

        if (effect_array.length >= 1)
        {
            effect_array.at(-1)?.connect(output_node)
        }

        this.effect_chain_dict.set(chain_name, effect_array)
    }

    get(chain_name: string)
    {
        return this.effect_chain_dict.get(chain_name)
    }

    has(chain_name: string)
    {
        return this.effect_chain_dict.has(chain_name)
    }

    dispose()
    {
        for (const effect_chain of this.effect_chain_dict.values())
        {
            for (const effect of effect_chain)
            {
                effect.disconnect()
            }
        }

        this.effect_chain_dict.clear()
    }
}