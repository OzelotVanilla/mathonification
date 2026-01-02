export function getHTMLElementCenterPositionRatioOnXAxis(element: HTMLElement)
{
    const rect = element.getBoundingClientRect()
    return (rect.x + rect.width / 2) / window.innerWidth
}