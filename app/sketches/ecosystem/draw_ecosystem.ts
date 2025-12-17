import { clearCanvas } from "@/utils/canvas";
import { Animal } from "@/scripts/ecosystem/Animal";
import { Bait } from "@/scripts/ecosystem/Bait";
import { Ecosystem } from "@/scripts/ecosystem/Ecosystem";
import { mixColour } from "@/utils/colour";

export function drawEcosystem(ecosystem_canvas: HTMLCanvasElement, ecosystem: Ecosystem)
{
    if (ecosystem_canvas == null || ecosystem == null) { return }
    const c = ecosystem_canvas.getContext("2d")!
    clearCanvas(c)

    const middle_point_x = c.canvas.clientWidth / 2
    const middle_point_y = c.canvas.clientHeight / 2
    c.strokeStyle = "black"
    c.fillStyle = "black"

    for (const something of ecosystem.things_to_draw)
    {
        if (something instanceof Animal)
        {
            const x = middle_point_x + something.position.x
            const y = middle_point_y + something.position.y
            c.fillStyle = mixColour("#c51c2f", "#48922f", something.hunger)
            c.beginPath()
            c.arc(x, y, something.radius, 0, 2 * Math.PI)
            c.fill()
        }
        else if (something instanceof Bait)
        {
            const x = middle_point_x + something.position.x
            const y = middle_point_y + something.position.y
            c.fillStyle = "#decafe"
            c.beginPath()
            c.arc(x, y, something.radius, 0, 2 * Math.PI)
            c.fill()
        }
    }
}