/**
 * Double-Pendulum's algorithm code generated originally by ChatGPT.
 * Modified by repo's author.
 * 
 * Corrected implementation based on standard Lagrangian formulation.
 * 
 * Reference: https://www.myphysicslab.com/pendulum/double-pendulum-en.html
 * 
 * @author ChatGPT
 */;

import { normaliseRadian } from "@/utils/math";
import { SimplePendulum } from "./SimplePendulum.interface";

export class DoublePendulum implements SimplePendulum
{
    /**
     * @param {number} r1 Length of the first rod (distance from pivot to first mass).
     * Unit: meters (or arbitrary length unit).
     */
    r1: number;

    /**
     * @param {number} r2 Length of the second rod (distance from first mass to second mass).
     */
    r2: number;

    /**
     * @param {number} m1 Mass of the first bob attached to the end of the first rod.
     * Unit: kilograms (or arbitrary mass unit).
     */
    m1: number;

    /**
     * @param {number} m2 Mass of the second bob attached to the end of the second rod.
     */
    m2: number;

    /**
     * @param {number} g Gravitational acceleration constant.
     * Usually 9.81 (m/s²) on Earth.
     */
    g: number;

    /**
     * @param {number} a1 Angle of the first rod, in radians.
     * Measured from the vertical (0 = straight down).
     */
    a1: number;

    /**
     * @param {number} a2 Angle of the second rod, in radians.
     * Measured from the vertical (0 = straight down).
     */
    a2: number;

    /**
     * @param {number} a1_v Angular velocity of the first rod (d(a1)/dt).
     * Unit: radians per second.
     */
    a1_v: number;

    /**
     * @param {number} a2_v Angular velocity of the second rod (d(a2)/dt).
     * Unit: radians per second.
     */
    a2_v: number;

    /**
     * 
     * @param r1 Length of the first rod.
     * @param r2 Length of the second rod.
     * @param m1 Mass of the first bob attached to the end of the first rod.
     * @param m2 Mass of the second bob attached to the end of the second rod.
     * @param g  Gravitational acceleration constant.
     */
    constructor(
        r1: number = 125,
        r2: number = 125,
        m1: number = 10,
        m2: number = 10,
        g: number = 9.8
    )
    {
        this.r1 = r1;
        this.r2 = r2;
        this.m1 = m1;
        this.m2 = m2;
        this.g = g;

        this.a1 = 2 * Math.PI * Math.random() - Math.PI;
        this.a2 = 2 * Math.PI * Math.random() - Math.PI;
        this.a1_v = 0;
        this.a2_v = 0;

        this.updatePosition()
    }

    /**
     * Advance the simulation by a time delta (in milliseconds)
     */
    next(delta: number)
    {
        const { r1, r2, m1, m2, g, } = this;
        let { a1, a2, a1_v, a2_v } = this;
        /** Converted to scaled (2.5x) seconds for physical calculation. */
        delta /= 200

        // --- From Shiffman’s code ---
        const num1 = -g * (2 * m1 + m2) * Math.sin(a1);
        const num2 = -m2 * g * Math.sin(a1 - 2 * a2);
        const num3 = -2 * Math.sin(a1 - a2) * m2;
        const num4 = a2_v * a2_v * r2 + a1_v * a1_v * r1 * Math.cos(a1 - a2);
        const den = r1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
        const a1_a = (num1 + num2 + num3 * num4) / den;

        const num5 = 2 * Math.sin(a1 - a2);
        const num6 = a1_v * a1_v * r1 * (m1 + m2);
        const num7 = g * (m1 + m2) * Math.cos(a1);
        const num8 = a2_v * a2_v * r2 * m2 * Math.cos(a1 - a2);
        const den2 = r2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
        const a2_a = (num5 * (num6 + num7 + num8)) / den2;

        // --- Symplectic Euler integration (energy-preserving) ---
        a1_v += a1_a * delta;
        a2_v += a2_a * delta;

        a1 = normaliseRadian(a1 + a1_v * delta);
        a2 = normaliseRadian(a2 + a2_v * delta);

        // --- Assign updated values back ---
        this.a1 = a1;
        this.a2 = a2;
        this.a1_v = a1_v;
        this.a2_v = a2_v;

        this.updatePosition()
    }

    /**
     * X coordinate for end of first limb.
     */
    x_1: number = 0

    /**
     * Y coordinate for end of first limb.
     */
    y_1: number = 0

    /**
     * X coordinate for end of second limb.
     */
    x_2: number = 0

    /**
     * Y coordinate for end of second limb.
     */
    y_2: number = 0

    /**
     * Update the position of end-of-limb.
     */
    updatePosition()
    {
        this.x_1 = this.r1 * Math.sin(this.a1);
        this.y_1 = this.r1 * Math.cos(this.a1);
        this.x_2 = this.x_1 + this.r2 * Math.sin(this.a2);
        this.y_2 = this.y_1 + this.r2 * Math.cos(this.a2);
    }

    /**
     * Get the position of end-of-limb.
     */
    getPosition()
    {
        return { x_1: this.x_1, x_2: this.x_2, y_1: this.y_1, y_2: this.y_2 }
    }

    getMaxLength(): number
    {
        return this.r1 + this.r2
    }
}


/**
 * x_1, y_1 : number
 *     Cartesian coordinates of the first rod’s endpoint.
 * 
 * x_2, y_2 : number
 *     Cartesian coordinates of the second rod’s endpoint.
 */
export type PendulumPosition = {
    x_1: number,
    y_1: number,
    x_2: number,
    y_2: number
}

/**
 * Get a random double pendulum.
 * 
 * High possibility that it is a chaos pendulum.
 */
export function getEvenMassDoublePendulum({ is_same_length = true }: getEvenMassDoublePendulum_Args = {})
{
    const length_1 = 100;
    const length_2 = is_same_length ? length_1 : 100;

    const init_angle_1 = -Math.PI + Math.random() * Math.PI * 2;
    const init_angle_2 = -Math.PI + Math.random() * Math.PI * 2;

    return new DoublePendulum();
}

type getEvenMassDoublePendulum_Args = {
    is_same_length?: boolean
}
