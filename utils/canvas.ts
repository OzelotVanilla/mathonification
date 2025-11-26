export function clearCanvas(canvas_context: CanvasRenderingContext2D)
{
    canvas_context.clearRect(0, 0, canvas_context.canvas.width, canvas_context.canvas.height)
}