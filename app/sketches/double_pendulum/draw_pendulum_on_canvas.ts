import { clearCanvas } from "@/utils/canvas"
import { MusicalDoublePendulum } from "./MusicalDoublePendulum"

export function drawMusicDoublePendulumOnCanvas(pendulum: MusicalDoublePendulum, canvas_context: CanvasRenderingContext2D)
{
    clearCanvas(canvas_context)
    const line_width = 2
    const arc_radius = 4

    const middle_point_x = canvas_context.canvas.width / 2
    const middle_point_y = canvas_context.canvas.height / 2
    const c = canvas_context

    let { x_1, y_1, x_2, y_2 } = pendulum.getPosition()
    x_1 += middle_point_x
    y_1 += middle_point_y
    x_2 += middle_point_x
    y_2 += middle_point_y

    // Draw limbs.
    c.strokeStyle = "black"
    c.lineWidth = line_width
    c.moveTo(middle_point_x, middle_point_y)
    c.lineTo(x_1, y_1)
    c.stroke()
    c.moveTo(x_1, y_1)
    c.lineTo(x_2, y_2)
    c.stroke()

    // Draw knot on limb start&end.
    c.fillStyle = "black"
    c.beginPath()
    c.arc(middle_point_x, middle_point_y, arc_radius, 0, 2 * Math.PI)
    c.fill()

    c.beginPath()
    c.arc(x_1, y_1, arc_radius, 0, 2 * Math.PI)
    c.fill()

    c.beginPath()
    c.arc(x_2, y_2, arc_radius, 0, 2 * Math.PI)
    c.fill()

    // // Random-alike moving ball.
    // for (const { x, y } of pendulum.getOrbitingBallsPosition())
    // {
    //     c.beginPath()
    //     c.arc(x + middle_point_x, y + middle_point_y, arc_radius, 0, 2 * Math.PI)
    //     c.fill()
    // }
}