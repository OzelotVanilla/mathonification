export const sexagesimal_ones_digit_char_array = [
    null,  // 0: Null for placeholder.
    "𒐕", // 1: 1.
    "𒐖", // 2: 2.
    "𒐗", // 3: 3.
    "𒐼", // 4: 4.
    "𒐊", // 5: 5.
    "𒐋", // 6: 6.
    "𒑂", // 7: 7.
    "𒑄", // 8: 8.
    "𒑆", // 9: 9.
] as const

export const sexagesimal_tens_digit_char_array = [
    null,  // 0: Null for placeholder.
    "𒌋", // 1: 10.
    "𒎙", // 2: 20.
    "𒌍", // 3: 30.
    "𒑩", // 4: 40.
    "𒑪", // 5: 50.
] as const

/**
 * Notice: This is not the actual notation of zero in babylonian system.
 * It is used to enhance the readability only.
 */
export const sexagesimal_zero_placeholder = "𒄭"