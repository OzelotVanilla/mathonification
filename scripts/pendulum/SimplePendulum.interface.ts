/**
 * Interface of any pendulum that can calculate the physical status
 *  by providing a `delta` of time since last calculation.
 */
export interface SimplePendulum
{
    /**
     * @param delta Time elapsed since last calculation, in milliseconds.
     */
    next(delta: number): any;

    /**
     * Get the max length from the origin of the pendulum.
     * Usually it should be sum of each limb it has.
     * 
     * Useful for creating an enclosing container (e.g., canvas).
     */
    getMaxLength(): number;
}