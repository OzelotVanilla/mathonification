export function clearCanvas(canvas_context: CanvasRenderingContext2D)
{
    canvas_context.clearRect(0, 0, canvas_context.canvas.width, canvas_context.canvas.height)
}

/**
 * To adapt to those device with high-DPI.
 */
export function adjustCanvasToDPR(canvas: HTMLCanvasElement, width?: number, height?: number)
{
    const dpr = window.devicePixelRatio || 1;
    const canvas__css_width = width ?? canvas.clientWidth
    const canvas__css_height = height ?? canvas.clientHeight
    canvas.width = canvas__css_width * dpr
    canvas.height = canvas__css_height * dpr
    canvas.style.width = `${canvas__css_width}px`
    canvas.style.height = `${canvas__css_height}px`
    const c = canvas.getContext("2d")!
    c.transform(1, 0, 0, 1, 0, 0)
    c.scale(dpr, dpr)
}