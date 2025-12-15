import { SoundManager } from "@/utils/SoundManager"
import { clamp, mapLinearToLinear } from "@/utils/math"
import { CollisionEvent } from "./CollisionWorld"

export function onBallFirstCollide__playSound(event: CollisionEvent)
{
    const v = event.body.velocity
    const sum = v.x + v.y + v.z
    SoundManager.playNote(
        Math.floor(mapLinearToLinear(clamp(-4, sum, 4), -4, 4, 21, 90)),
        { effect_chain_name: "vibrato" }
    )
}