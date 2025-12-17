/**
 * Interpolates between two hex colors.
 * 
 * @param hex_start - The starting hex color (e.g., "#FF0000")
 * @param hex_end - The ending hex color (e.g., "#0000FF")
 * @param t_factor - Interpolation factor between 0 and 1
 * 
 * @author Gemini
 */
export function mixColour(hex_start: string, hex_end: string, t_factor: number): string
{
    // Helper to convert hex to RGB
    const hex_to_rgb = (hex: string): number[] =>
    {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    // Helper to convert RGB component to hex
    const component_to_hex = (c: number): string =>
    {
        const hex_val = Math.round(c).toString(16);
        return hex_val.length === 1 ? "0" + hex_val : hex_val;
    };

    const rgb_start = hex_to_rgb(hex_start);
    const rgb_end = hex_to_rgb(hex_end);

    const r_result = rgb_start[0] + t_factor * (rgb_end[0] - rgb_start[0]);
    const g_result = rgb_start[1] + t_factor * (rgb_end[1] - rgb_start[1]);
    const b_result = rgb_start[2] + t_factor * (rgb_end[2] - rgb_start[2]);

    return `#${component_to_hex(r_result)}${component_to_hex(g_result)}${component_to_hex(b_result)}`;
}