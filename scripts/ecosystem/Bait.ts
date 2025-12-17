import { PositionOffsetFromCenter } from "./Ecosystem"

export class Bait
{
    position: PositionOffsetFromCenter

    /**
     * How many mass-level could be got from this bait.
     */
    mass_level: number

    /**
     * Get the calculated radius, in px.
     * 
     * Useful in drawing.
     */
    get radius(): number
    {
        return this.mass_level * 3
    }

    constructor(position: PositionOffsetFromCenter, mass_level: number)
    {
        this.position = position
        this.mass_level = mass_level
    }
}