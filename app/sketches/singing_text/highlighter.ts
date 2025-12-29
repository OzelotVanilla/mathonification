import { ConjunctionType } from "./constants"

export function highlightContent()
{
    CSS.highlights.clear()

    const text_container = document.getElementById("singing_text__text_container")
    if (text_container == null) { return }

    const tree_walker = document.createTreeWalker(text_container, NodeFilter.SHOW_ELEMENT)
    let next_node = tree_walker.nextNode()
    let highlights_registry = Object.fromEntries(Object.keys(ConjunctionType).map(category => [category, [] as Range[]]))

    while (next_node != null)
    {
        if (next_node.nodeType == Node.ELEMENT_NODE && (next_node as HTMLElement).tagName == "SPAN")
        {
            const element = next_node as HTMLSpanElement
            const element_type_in_string = element.dataset["type"]
            const element_type = ConjunctionType[element_type_in_string as keyof typeof ConjunctionType]
            if (element_type != undefined && element_type != ConjunctionType.not_a_conjuction)
            {
                let range = new Range()
                range.setStartBefore(element)
                range.setEndAfter(element)
                highlights_registry[element_type_in_string!].push(range)
            }
        }

        next_node = tree_walker.nextNode()
    }

    for (const category of Object.keys(highlights_registry))
    {
        CSS.highlights.set(category, new Highlight(...highlights_registry[category].flat()))
    }
}