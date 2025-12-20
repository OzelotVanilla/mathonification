import { conjunction_dict, ConjunctionType, sentence_split_regex } from "./constants"

export function convertToTokens(user_input_text: string): Token[]
{
    let result: Token[] = []

    // TODO: Bad algorithm
    tokenise_process: for (const sentence of user_input_text.split(sentence_split_regex))
    {
        for (const [category, phrases] of Object.entries(conjunction_dict))
        {
            for (const phrase of phrases)
            {
                const search_result = sentence.toLocaleLowerCase().indexOf(phrase)
                // Must see if the previous or next character is alphabet or not
                if (
                    search_result == 0
                    || (search_result > 0
                        && isNotAlphabet(sentence.at(search_result - 1))
                        && isNotAlphabet(sentence.at(search_result + phrase.length)))
                )
                {
                    // Found.
                    result.push({ text: sentence.slice(0, search_result), type: ConjunctionType.not_a_conjuction })
                    result.push({ text: phrase, type: ConjunctionType[category as keyof typeof ConjunctionType] })
                    result.push({ text: sentence.slice(search_result + phrase.length), type: ConjunctionType.not_a_conjuction })
                    continue tokenise_process
                }
            }
        }

        // Not found, add all as a sentence.
        result.push({ text: sentence, type: ConjunctionType.not_a_conjuction })
    }

    return result
}

function isNotAlphabet(char: string | undefined)
{
    return char == undefined || !(("a" <= char && char <= "z") || ("A" <= char && char <= "Z"))
}

export type Token = {
    /** A single word, or a long phrase */
    text: string,
    type: ConjunctionType
}