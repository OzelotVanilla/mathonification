import { Character2D } from "@/scripts/character/Character2D"
import { Ecosystem, PositionOffsetFromCenter } from "./Ecosystem"
import { generateRandomNumberOfRange, Vec2 } from "@/utils/math"
import { Bait } from "./Bait"

// metabolism & movement
const base_metabolism = 0.000015
const move_cost = 0.00004
const rest_recovery = 0.00006

// eating
const energy_from_food_factor = 0.8
const hunger_recover_threshold = 0.75
const hunger_recover_amount = 0.25


/**
 * Rules of animal behavior & survival.
 *
 * Original design by me.
 * Revised and extended with ecological stabilization (idea of `this.energy`) by ChatGPT.
 *
 * ---
 * Core concepts:
 *
 * - mass_level:
 *   Represents body size and strength.
 *   Affects radius, speed, energy consumption, and dominance.
 *
 * - hunger:
 *   Long-term life indicator.
 *   Decreases slowly over time due to basal metabolism (`base_metabolism * this.mass_level` each millisecond).
 *   When it reaches 0, the animal dies.
 *
 * - energy:
 *   Short-term movement resource.
 *   Consumed by movement, recovered by eating or resting.
 *   Low energy limits chasing behavior.
 *
 * ---
 * Growth & eating:
 *
 * - Eating provides instant energy recovery proportional to
 *   food_mass_level / self_mass_level.
 *
 * - Hunger is only recovered when energy is already sufficient,
 *   preventing infinite survival by eating tiny food.
 *
 * ---
 * Movement cost:
 *
 * - Moving consumes energy based on:
 *   velocity × mass_level.
 *
 * - Resting recovers energy slowly.
 *
 * ---
 * Decision making:
 *
 * - Animals prioritize:
 *   1. Escaping nearby larger threats.
 *   2. Chasing nearby edible targets if energy allows.
 *   3. Resting when exhausted and no nearby opportunity exists.
 *
 * This separation of hunger (long-term survival)
 * and energy (short-term action)
 * stabilizes population dynamics and prevents early extinction.
 */

export class Animal extends Character2D
{
    ecosystem_ref: Ecosystem

    /**
     * How *fat* this animal is.
     */
    mass_level: number = generateRandomNumberOfRange(4, 8)

    /**
     * Get the calculated radius, in px.
     * 
     * Useful in drawing and checking whether eat can be performed.
     */
    get radius(): number
    {
        return this.mass_level * 3
    }

    /**
     * Where is the animal, calculated from the center of the screen.
     */
    override position: PositionOffsetFromCenter

    /**
     * When it reaches 0, the animal dies.
     */
    hunger: number = 1

    /**
     * Energy is used for movement.
     * When energy is low, animal tends to stop.
     */
    energy: number = 1

    /**
     * If the animal is eaten by another animal.
     */
    is_eaten: boolean = false

    get is_alive(): boolean
    {
        return this.hunger > 0 && !this.is_eaten
    }

    constructor(position: Vec2, ecosystem_ref: Ecosystem)
    {
        super()
        this.position = position
        this.ecosystem_ref = ecosystem_ref
    }

    /**
     * Update according to the time elapsed since last call.
     */
    update(animals_ref: Animal[], bait_ref: Bait[], delta: number)
    {
        // Decide the moving direction.
        this.decideNextIntention(animals_ref, bait_ref)

        // Calculate latest speed factor (heavier -> slower).
        this.speed_factor = Math.max(5, 50 - this.mass_level * 1.5)

        // Update hunger and movement energy cost.
        if (this.velocity.length > 0.01)
        {
            this.energy -= delta
                * this.velocity.length
                * this.mass_level
                * move_cost
        }
        else
        {
            // resting recovers energy
            this.energy += delta * rest_recovery
        }

        this.energy = Math.max(0, Math.min(1, this.energy))

        // hunger decreases slowly (basal metabolism)
        this.hunger -= delta * base_metabolism * this.mass_level

        // Update moving.
        super.updatePhysics(delta)
    }

    eat(another_animal: Animal): void
    eat(bait: Bait): void
    /**
     * Eat an smaller animal or a bait, and grow up.
     */
    eat(something: Animal | Bait): void
    {
        if (something instanceof Animal)
        {
            something.is_eaten = true
        }

        // energy gained from food
        const energy_gain =
            something.mass_level / (this.mass_level + something.mass_level)

        // recover hunger additively
        this.hunger = Math.min(
            1,
            this.hunger + energy_gain * 0.8
        )

        // grow
        this.mass_level += energy_gain * 0.8
    }


    /**
     * Decide next movement intention based on hunger, danger and food.
     *
     * Original idea by me.
     * Revised and structured by ChatGPT.
     * 
     * @author ChatGPT
     */
    decideNextIntention(animals: Animal[], baits: Bait[])
    {
        const hunger_pressure = 1 - this.hunger   // 0 → calm, 1 → starving

        let nearest_food_pos: Vec2 | null = null
        let nearest_food_dist = Infinity

        let nearest_danger_pos: Vec2 | null = null
        let nearest_danger_dist = Infinity

        // scan animals
        for (const a of animals)
        {
            if (a === this) continue

            const d = this.position.getDistanceTo(a.position)

            // Found a smaller animal.
            if (a.mass_level < this.mass_level)
            {
                if (d < nearest_food_dist)
                {
                    nearest_food_dist = d
                    nearest_food_pos = a.position
                }
            }
            else
            {
                if (d < nearest_danger_dist)
                {
                    nearest_danger_dist = d
                    nearest_danger_pos = a.position
                }
            }
        }

        // scan baits
        for (const b of baits)
        {
            const d = this.position.getDistanceTo(b.position)
            if (d < nearest_food_dist)
            {
                nearest_food_dist = d
                nearest_food_pos = b.position
            }
        }

        // ---- decision ----

        // 1. immediate danger → escape
        if (
            nearest_danger_pos &&
            nearest_danger_dist < this.radius * (1.8 + hunger_pressure)
        )
        {
            this.intention =
                this.position.clone()
                    .subtract(nearest_danger_pos)
                    .normalize()
            return
        }

        // 2. starving → go for food even if far.
        if (nearest_food_pos != null)
        {
            // We need to know how long it takes for this animal to reach that food.
            const current_speed_factor = this.speed_factor                 // per ms.
            const current_hungry_speed = base_metabolism * this.mass_level // per ms.
            const n_ms_to_reach_food = nearest_danger_dist / current_speed_factor
            const n_ms_until_death = this.hunger / current_hungry_speed
            if (
                hunger_pressure > 0.6
                || n_ms_to_reach_food - n_ms_until_death <= 1000 // After 1 seconds, it will die.
            )
            {
                this.intention =
                    nearest_food_pos.clone()
                        .subtract(this.position)
                        .normalize()
                return
            }
        }

        // 3. food is nearby and safe → eat
        if (
            nearest_food_pos &&
            nearest_food_dist < this.radius * 6
        )
        {
            this.intention =
                nearest_food_pos.clone()
                    .subtract(this.position)
                    .normalize()
            return
        }

        // 4. calm & safe → stay (minimal movement)
        this.intention
            .lerp(Vec2.zero, 0.9)
    }
}