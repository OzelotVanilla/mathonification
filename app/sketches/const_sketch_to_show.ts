export const sketch_to_show__array: SketchMetaData[] = [
    {
        name: "singing text",
        path_name: "singing_text",
        // description: "Your text will sing."
    },
    {
        name: "dancing pendulum",
        path_name: "dancing_pendulum",
        // description: "Can you predict a double pendulum?"
    },
    {
        name: "cunei sound",
        path_name: "cunei_sound",
        // description: "Take 60 steps to go over this octave."
    },
    {
        name: "lissatone",
        path_name: "lissatone",
        // description: "Just in-tone-nation."
    },
    {
        name: "slopy globy",
        path_name: "slopy_globy",
        // description: "Sphere or Saddle."
    },
    // {
    //     name: "musicreatures",
    //     path_name: "ecosystem"
    // }
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
    //  * Short description for the sketch.
    //  */
    // description: string
    /**
     * Path of the thumbnail image file.
     */
    thumbnail_file_path?: string
}