export class MusicContext
{
    /** 0 means C, until 11, 11 means B. */
    current_major: number = 0

    setMajorUp(value: number)
    {
        this.current_major = (this.current_major + value) % 12
    }

    setMajorDown(value: number)
    {
        // In case of negative number.
        this.current_major = ((this.current_major - value) % 12 + 12) % 12
    }

    bpm: number = 120

    music_scale: MusicScale = MusicScale.major

    getScale(): number[]
    {
        switch (this.music_scale)
        {
            case MusicScale.major:
                return [0, 2, 4, 5, 7, 9, 11]
            case MusicScale.major_five:
                return [0, 2, 4, 7, 9]
            case MusicScale.okinawa:
                return [0, 2, 5, 7, 11]
            case MusicScale.natural_minor:
                return [0, 2, 3, 5, 7, 8, 10]
            case MusicScale.harmonic_minor:
                return [0, 2, 3, 5, 7, 8, 11]
            case MusicScale.melodic_minor:
                return [0, 2, 3, 5, 7, 9, 11]
        }
    }
}

export enum MusicScale
{
    major = "major",
    major_five = "major_five",
    okinawa = "okinawa",
    natural_minor = "natural_minor",
    harmonic_minor = "harmonic_minor",
    melodic_minor = "melodic_minor"
}