export const sketch_to_show__array: SketchMetaData[] = [
    {
        name: "Syntax Conjuctions Highlight",
        path_name: "syntax_conjunctions_highlight",
        description: "Your text will sing."
    },
    {
        name: "Double Pendulum",
        path_name: "double_pendulum",
        description: "Can you predict a double pendulum ?"
    },
    {
        name: "Sexagesimal",
        path_name: "sexagesimal",
        description: "Take 60 steps to go over this octave."
    },
    {
        name: "LissaTone",
        path_name: "lissajous_curve_harmonics",
        description: "Just in-tone-nation."
    }
] as const

type SketchMetaData = {
    /**
     * The name to show as title.
     */
    name: string
    /**
     * The folder name under `sketches/`.
     */
    path_name: string
    /**
     * Short description for the sketch.
     */
    description: string
    /**
     * Path of the thumbnail image file.
     */
    thumbnail_file_path?: string
}