/**
 * 
 * @author ChatGPT
 * @author Gemini
 */

import * as cannon from "cannon-es"
import { DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry } from "three"
import { SlopeChangingGlobe } from "./SlopeChangingGlobe"
import { onBallFirstCollide__playSound } from "./sound_generate"

export interface CollisionEvent
{
    body: cannon.Body,
    contact: cannon.ContactEquation
    target: cannon.Body
}

export class CollisionWorld
{
    slope_globe__ref: SlopeChangingGlobe

    world: cannon.World
    ground_shape: cannon.Heightfield
    ground_body: cannon.Body
    ground_material: cannon.Material

    ball_material: cannon.Material

    /** must sync with visual curvature */
    curvature: number = 0

    falling_balls: {
        mesh: Mesh,
        body: cannon.Body,
        radius: number,
    }[] = []

    max_balls: number = 4
    respawn_threshold_z: number = -5
    spawn_interval_ms: number = 1000
    last_spawn_time: number = 0

    debug_mesh: Mesh // Mesh to visualize the physics heightfield
    debug_geometry: PlaneGeometry // Reuse PlaneGeometry structure

    constructor(slope_globe__ref: SlopeChangingGlobe)
    {
        this.slope_globe__ref = slope_globe__ref

        this.world = new cannon.World({
            gravity: new cannon.Vec3(0, 0, -9.82)
        })

        const geom = this.slope_globe__ref.geometry

        const w = geom.parameters.widthSegments + 1
        const h = geom.parameters.heightSegments + 1

        // temporary flat height data
        const heights: number[][] = []
        const pos = geom.attributes.position
        let index = 0
        for (let y = 0; y < h; y++)
        {
            const row: number[] = []
            for (let x = 0; x < w; x++)
            {
                const z = pos.getZ(index)
                row.push(z)
                index++
            }
            heights.push(row)
        }

        this.ground_shape = new cannon.Heightfield(heights, {
            elementSize: 2 / geom.parameters.widthSegments
        })

        this.ground_material = new cannon.Material("ground_material")
        this.ground_body = new cannon.Body({
            mass: 0,
            shape: this.ground_shape,
            material: this.ground_material
        })

        this.ground_body.position.set(-1, -1, 0)
        this.world.addBody(this.ground_body)

        this.ball_material = new cannon.Material("ball_material")
        const ground_ball_contact = new cannon.ContactMaterial(
            this.ground_material,
            this.ball_material,
            {
                friction: 0.8,      // High friction for rolling/slowing
                restitution: 0.2,   // Medium bounce (0.0 for dead, 1.0 for perfect)
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3,
            }
        )
        this.world.addContactMaterial(ground_ball_contact)

        // For debug.
        this.debug_geometry = new PlaneGeometry(
            2, 2,
            geom.parameters.widthSegments,
            geom.parameters.heightSegments
        )
        const debug_material = new MeshBasicMaterial({
            color: 0xff00ff, // Bright color to easily spot it (magenta)
            wireframe: true,
            transparent: true,
            opacity: 0.8,
            side: DoubleSide
        })
        this.debug_mesh = new Mesh(this.debug_geometry, debug_material)
        // Position the mesh to match the ground_body's initial offset (-1, -1, 0)
        this.debug_mesh.position.set(0, 0, 0)
        // Comment this off to debug.
        // this.slope_globe__ref.scene.add(this.debug_mesh)
    }

    last_call_timestamp__update: number = 0
    update(new_curvature: number)
    {
        const now = performance.now()
        const delta_ms = Math.min(50, now - this.last_call_timestamp__update)
        this.last_call_timestamp__update = now
        this.updateCurvature(new_curvature)
        this.world.step(1 / 300, delta_ms / 1000, 20)
        this.checkBalls(now)
    }

    /**
     * called from SlopeChangingGlobe.update()
     */
    updateCurvature(new_curvature: number)
    {
        this.curvature = new_curvature

        // deform heightfield to follow shader curvature
        let shape_data__ref = this.ground_shape.data
        const debug_positions = this.debug_geometry.attributes.position
        const size = shape_data__ref.length

        function rotate90Degrees(matrix: number[][]): number[][]
        {
            const rows = matrix.length;
            const cols = matrix[0].length;
            // 新しい行列を作成（元の列数が行数に、元の行数が列数になる）
            const rotatedMatrix: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));

            for (let i = 0; i < rows; i++)
            {
                for (let j = 0; j < cols; j++)
                {
                    // 時計回り90度回転の変換式: (i, j) -> (j, rows - 1 - i)
                    rotatedMatrix[j][rows - 1 - i] = matrix[i][j];
                }
            }
            return rotatedMatrix;
        }

        for (let y = 0; y < size; y++)
        {
            for (let x = 0; x < size; x++)
            {
                const nx = (x / (size - 1)) * 2 - 1
                const ny = (y / (size - 1)) * 2 - 1

                const sphere_z = Math.sqrt(Math.max(0.0, 1.0 - nx * nx - ny * ny))
                const saddle_z = nx * nx - ny * ny
                // float z = mix(sphereZ, saddleZ, k);
                // x * (1.0 - a) + y * a
                const z = sphere_z * (1.0 - this.curvature) + saddle_z * this.curvature
                shape_data__ref[y][x] = z

                // Debug.
                const vertex_index = (y * size) + x
                debug_positions.setZ(vertex_index, z)
            }
        }

        this.ground_shape.data = rotate90Degrees(shape_data__ref)

        debug_positions.needsUpdate = true

        this.ground_shape.update()
        this.ground_shape.updateMinValue()
        this.ground_shape.updateMaxValue()

        this.ground_body.aabbNeedsUpdate = true
    }

    private checkBalls(now: number)
    {
        if (this.falling_balls.length < this.max_balls
            && now - this.last_spawn_time > this.spawn_interval_ms)
        {
            this.spawnBall()
            this.last_spawn_time = now
        }

        for (let i = this.falling_balls.length - 1; i >= 0; i--)
        {
            const ball = this.falling_balls[i]

            // 落下チェック
            if (ball.body.position.z < this.respawn_threshold_z)
            {
                this.removeBall(i)
                continue
            }

            // Cannon → Three 座標同期
            ball.mesh.position.copy(ball.body.position as any)
            ball.mesh.quaternion.copy(ball.body.quaternion as any)
        }
    }

    private spawnBall()
    {
        const radius = 0.05

        // Three.js Mesh
        const mesh = new Mesh(
            new SphereGeometry(radius, 16, 16),
            new MeshStandardMaterial({ color: 0x333333 })
        )
        mesh.position.set(0, 0, 2)
        this.slope_globe__ref.scene.add(mesh)

        // Cannon Body
        const body = new cannon.Body({
            mass: 1,
            shape: new cannon.Sphere(radius),
            position: new cannon.Vec3(
                (Math.random() * 2 - 1) * 0.9, // Spawn within X range -0.9 to 0.9
                (Math.random() * 2 - 1) * 0.9, // Spawn within Y range -0.9 to 0.9
                2
            ),
            material: this.ball_material
        })

        // Collision
        // Notice: All collision handler function need to call at next JS loop,
        //  otherwise the event will be empty.
        let is_collided = false
        const collisionHandler = function (event: CollisionEvent)
        {

            if (!is_collided)
            {
                setTimeout(() => onBallFirstCollide__playSound(event))
                is_collided = true
            }
        }
        body.addEventListener("collide", (event: CollisionEvent) => setTimeout(collisionHandler.bind(this, event)))
        this.world.addBody(body)

        this.falling_balls.push({ mesh, body, radius })
    }

    private removeBall(idx: number)
    {
        const ball = this.falling_balls[idx]

        this.world.removeBody(ball.body)
        this.slope_globe__ref.scene.remove(ball.mesh)

        this.falling_balls.splice(idx, 1)
    }
}
