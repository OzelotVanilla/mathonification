import { generateRandomNumberOfRange, Vec2 } from "@/utils/math";
import { Animal } from "./Animal"
import { Bait } from "./Bait";

export class Ecosystem
{
    /**
     * Contains all the animals.
     * 
     * Type is `Set` because this allows quick deletion of eaten animals.
     */
    private animals: Set<Animal> = new Set()

    /**
     * Type is `Set` because this allows quick deletion of eaten bait.
     */
    private baits: Set<Bait> = new Set()

    get things_to_draw() { return [...this.animals, ...this.baits] }

    viewport__x: number

    viewport__y: number

    onEatingHappen: (something: Animal | Bait) => any = () => { }

    constructor()
    {
        this.viewport__x = window.innerWidth
        this.viewport__y = window.innerHeight

        // Init.
        let count = 0
        while (count < 4)
        {
            this.addAnimal()
            this.addBait()
            count++
        }
    }

    /**
     * Add created animal.
     * 
     * If called with no param, a random small animal will be added.
     */
    addAnimal(animal?: Animal)
    {
        // If 
        if (animal != undefined) { this.animals.add(animal) }

        // Create random new animal.
        else
        {
            this.animals.add(new Animal(
                new Vec2(
                    generateRandomNumberOfRange(-this.viewport__x / 2 * 0.5, this.viewport__x / 2 * 0.5),
                    generateRandomNumberOfRange(-this.viewport__y / 2 * 0.5, this.viewport__y / 2 * 0.5)
                ),
                this
            ))
        }
    }

    /**
    * Add created bait.
    * 
    * If called with no param, a random bait will be added.
    */
    addBait(bait?: Bait)
    {
        // If 
        if (bait != undefined) { this.baits.add(bait) }

        // Create random new animal.
        else
        {
            this.baits.add(new Bait(
                new Vec2(
                    generateRandomNumberOfRange(-this.viewport__x / 2 * 0.8, this.viewport__x / 2 * 0.8),
                    generateRandomNumberOfRange(-this.viewport__y / 2 * 0.8, this.viewport__y / 2 * 0.8)
                ),
                generateRandomNumberOfRange(0, 7)
            ))
        }
    }

    removeAnimal(animal: Animal)
    {
        this.animals.delete(animal)
    }

    /**
     * Return a random animal's ref.
     */
    pickRandomAnimal()
    {
        const arr = [...this.animals]
        const index = Math.floor(generateRandomNumberOfRange(0, arr.length))
        return arr[index]
    }

    last_call_timestamp__update = 0

    /**
     * Update according to the time elapsed since last call.
     * 
     * Fixed by ChatGPT.
     * 
     * @author ChatGPT
     */
    update()
    {
        const now = performance.now()
        const delta = Math.min(50, now - this.last_call_timestamp__update)
        this.last_call_timestamp__update = now

        const animals = [...this.animals]
        const baits = [...this.baits]

        let total_mass_of_animal = 0

        // 1. 動物の意思決定・移動
        for (const animal of animals)
        {
            animal.update(animals, baits, delta)
            total_mass_of_animal += animal.mass_level
        }

        // 2. animal × bait
        for (const animal of animals)
        {
            for (const bait of baits)
            {
                if (animal.position.getDistanceTo(bait.position) < animal.radius)
                {
                    animal.eat(bait)
                    this.onEatingHappen(bait)
                    this.baits.delete(bait)
                }
            }
        }

        // 3. animal × animal
        for (let i = 0; i < animals.length; i++)
        {
            for (let j = i + 1; j < animals.length; j++)
            {
                const a = animals[i]
                const b = animals[j]

                let bigger: Animal | null = null
                let smaller: Animal | null = null

                if (a.mass_level > b.mass_level) { bigger = a; smaller = b }
                else if (a.mass_level < b.mass_level) { bigger = b; smaller = a }
                else { continue }

                if (bigger.position.getDistanceTo(smaller.position) < bigger.radius)
                {
                    bigger.eat(smaller)
                    this.onEatingHappen(smaller)
                }
            }
        }

        // 4. 死亡処理
        for (const animal of animals)
        {
            if (!animal.is_alive)
            {
                // First delete.
                this.animals.delete(animal)

                // Generate some bait near it, according to its mass level.
                let mass_remained = Math.floor(animal.mass_level * 0.8)
                while (mass_remained > 0)
                {
                    let bait_mass: number
                    this.addBait(
                        new Bait(
                            new Vec2(
                                generateRandomNumberOfRange(animal.position.x - animal.radius * 1.5, animal.position.x + animal.radius * 1.5),
                                generateRandomNumberOfRange(animal.position.y - animal.radius * 1.5, animal.position.y + animal.radius * 1.5)
                            ),
                            bait_mass = Math.floor(Math.max(1, generateRandomNumberOfRange(0, Math.min(7, mass_remained))))
                        )
                    )
                    mass_remained -= bait_mass
                }
            }
        }

        // 5. Add animal or bait.
        if (this.animals.size <= 3)
        {
            this.addAnimal()
        }

        // If there is less than `total_mass_of_animal / animal_size * 6` bait.
        //    `* 6` means, on that basis, give 15x food.
        const expected_bait_size = total_mass_of_animal / this.animals.size * 6
        while (this.baits.size < expected_bait_size)
        {
            this.addBait()
        }
    }

    getCenterCoord()
    {
        return new Vec2(this.viewport__x / 2, this.viewport__y / 2)
    }
}

/**
 * The position, calculated by the offset from the center of screen.
 */
export type PositionOffsetFromCenter = Vec2