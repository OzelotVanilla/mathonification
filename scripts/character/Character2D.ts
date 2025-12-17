import { Vec2 } from "@/utils/math"

export class Character2D
{
    position: Vec2 = Vec2.zero

    /**
     * How many px per second.
     */
    speed_factor = 20

    /**
     * Make the movement with inertia.
     */
    acceleration_factor = 4

    /**
     * Moving vector of current character.
     */
    velocity: Vec2 = Vec2.zero

    /**
     * The intension of moving.
     * 
     * Should be normalised.
     */
    intention: Vec2 = Vec2.zero

    /**
     * Update the character status by providing a delta since last call.
     * 
     * @param delta in milliseconds.
     * 
     * @author ChatGPT
     */
    updatePhysics(delta: number)
    {
        // target velocity (do not mutate intension)
        const target_velocity =
            this.intention.clone().scale(this.speed_factor)

        // smooth acceleration
        const t = Math.min(1, this.acceleration_factor * delta / 1000)

        this.velocity.lerp(target_velocity, t)

        // integrate position
        this.position.add(
            this.velocity.clone().scale(delta / 1000)
        )
    }

}