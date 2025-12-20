// Generated from ChatGPT.
export enum ConjunctionType
{
    not_a_conjuction = "not_a_conjuction",
    additive = "additive",
    adversative = "adversative",
    causal = "causal",
    temporal = "temporal",
    conditional = "conditional",
    concessive = "concessive",
    comparative = "comparative",
    summative = "summative"
}

export const split_char_of_sentence = [
    ".", "?", "!", ";", ":", ",", "—", "-", "(", ")", "[", "]", "{", "}", "\"", "'", "”", "“", "’", "‘", "…"
];

export const sentence_split_regex = /(?<=[\.\?\!\;\:\,\—\\\-\(\)\[\]\{\}"“”'‘’…\n]+)/g;

export const aesop_text__paths = [
    "/public/aesop_text/the_frogs_and_the_fox.txt",
    "/public/aesop_text/belling_the_cat.txt",
]

const longerComesFirst = (a: string, b: string) => b.length - a.length

export const conjunction_dict = {
    // 順接・添加・並列
    additive: [
        "and",
        "also",
        "too",
        "as well",
        "further",
        "furthermore",
        "moreover",
        "besides",
        "in addition",
        "what is more",
        "on top of that",
        "plus",
        "another",
        "additionally",
        "not only",
        "nor",
        "either",
        "neither",
        "as well as",
        "together with",
        "coupled with"
    ].sort(longerComesFirst),

    // 逆接・対比
    adversative: [
        "but",
        "however",
        "yet",
        "still",
        "nevertheless",
        "nonetheless",
        "though",
        "although",
        "even though",
        "whereas",
        "while",
        "on the other hand",
        "on the contrary",
        "instead",
        "in contrast",
        "by contrast",
        "conversely",
        "rather",
        "even so",
        "regardless",
        "despite this",
        "despite that",
        "notwithstanding",
        "be that as it may",
        "all the same"
    ].sort(longerComesFirst),

    // 因果・結果
    causal: [
        "because",
        "since",
        "as",
        "for",
        "for this reason",
        "owing to",
        "due to",
        "thanks to",
        "because of",
        "therefore",
        "thus",
        "hence",
        "so",
        "accordingly",
        "consequently",
        "as a result",
        "as a consequence",
        "for this purpose",
        "that is why",
        "resulting in",
        "leading to"
    ].sort(longerComesFirst),

    // 時系列・順序・展開
    temporal: [
        "then",
        "afterwards",
        "next",
        "before",
        "after",
        "meanwhile",
        "later",
        "earlier",
        "eventually",
        "finally",
        "at last",
        "in the meantime",
        "simultaneously",
        "subsequently",
        "immediately",
        "soon",
        "first",
        "firstly",
        "second",
        "secondly",
        "third",
        "thirdly",
        "previously",
        "by the time",
        "from then on"
    ].sort(longerComesFirst),

    // 仮定・条件
    conditional: [
        "if",
        "unless",
        "provided that",
        "providing that",
        "on condition that",
        "in case",
        "in the event that",
        "as long as",
        "so long as",
        "assuming that",
        "supposing that",
        "otherwise",
        "if not",
        "should",
        "were",
        "had",
        "given that"
    ].sort(longerComesFirst),

    // 譲歩・逆接的認可
    concessive: [
        "although",
        "even though",
        "though",
        "while",
        "whereas",
        "despite",
        "in spite of",
        "regardless of",
        "no matter how",
        "no matter what",
        "however much",
        "albeit",
        "notwithstanding",
        "be that as it may",
        "even if",
        "still",
        "yet",
        "nevertheless",
        "at least"
    ].sort(longerComesFirst),

    // 比較・例示・説明
    comparative: [
        "like",
        "as if",
        "as though",
        "similarly",
        "likewise",
        "in the same way",
        "in a similar way",
        "as well as",
        "compared to",
        "in comparison with",
        "in contrast to",
        "unlike",
        "just as",
        "equally",
        "by comparison",
        "analogously",
        "for example",
        "for instance",
        "such as",
        "namely",
        "that is",
        "in particular",
        "especially",
        "notably",
        "to illustrate"
    ].sort(longerComesFirst),

    // 総括・結論・要約
    summative: [
        "in conclusion",
        "to conclude",
        "in summary",
        "to sum up",
        "in short",
        "in brief",
        "in sum",
        "to summarize",
        "all in all",
        "overall",
        "on the whole",
        "thus",
        "therefore",
        "accordingly",
        "finally",
        "as a result",
        "in the end",
        "to put it simply",
        "in essence",
        "in other words",
        "that is to say",
        "ultimately",
        "consequently"
    ].sort(longerComesFirst)
};
