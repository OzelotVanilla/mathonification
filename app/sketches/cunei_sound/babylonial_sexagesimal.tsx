import { convertDecToSexaDigits } from "@/utils/math"
import "./babylonial_sexagesimal.scss"
import { sexagesimal_ones_digit_char_array, sexagesimal_tens_digit_char_array, sexagesimal_zero_placeholder } from "./number_constant"

export function BabylonianSexagesimalNumber(params: BabylonianSexagesimal_Params)
{
    let digits: number[] = "number" in params
        ? convertDecToSexaDigits(params.number)
        : params.digits

    return (<div className="BabylonianSexagesimalNumber">
        {digits.map((d, index) => (<BabylonianSexagesimalDigit digit={d} key={index} />))}
    </div>)
}

type BabylonianSexagesimal_Params = {
    /**
     * Any number.
     */
    number: number
} | {
    /**
     * Converted digits in sexagesminal, from most significant to least.
     */
    digits: number[]
}

export function BabylonianSexagesimalDigit({ digit }: BabylonianSexagesimalDigit_Params)
{
    if (digit < 0 || digit > 59)
    {
        throw RangeError(
            `BabylonianSexagesimalDigit only accept digit from 0 to 59 (inclusive), `
            + `receiving ${digit}.`
        )
    }

    const tens = Math.floor(digit / 10)
    const ones = digit % 10

    const is_only_half_side = digit < 10 || Number.isInteger(digit / 10)

    return (<div className="BabylonianSexagesimalDigit">
        {digit == 0
            ? (<span className="zero">{sexagesimal_zero_placeholder}</span>)
            : is_only_half_side
                ? (<span className="single">{
                    digit < 10
                        ? sexagesimal_ones_digit_char_array[ones]
                        : sexagesimal_tens_digit_char_array[tens]
                }</span>)
                : (<>
                    <span className="tens">{sexagesimal_tens_digit_char_array[tens]}</span>
                    <span className="ones">{sexagesimal_ones_digit_char_array[ones]}</span>
                </>)}
    </div>)
}

type BabylonianSexagesimalDigit_Params = {
    /**
     * Must be 0 to 59 (inclusive).
     * Since it is sexagesimal (60-based).
     */
    digit: number
}