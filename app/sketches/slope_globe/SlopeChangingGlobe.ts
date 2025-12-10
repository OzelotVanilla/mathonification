import { Color, DoubleSide, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial } from "three";
import vertex_shader from "./SlopeChagingGlobe.vert.glsl"
import fragment_shader from "./SlopeChagingGlobe.frag.glsl"

export class SlopeChangingGlobe
{
    scene: Scene

    camera: PerspectiveCamera

    geometry: PlaneGeometry

    material: ShaderMaterial

    mesh: Mesh

    /**
     * Will be changing.
     */
    curvature: number = 0

    /**
     * Duration (in seconds) of changing curvature from 0 to 1 to -1 and back to 0.
     */
    curvature_changing_cycle_duration_in_seconds: number = 8

    /**
     * The changing range of the curvature.
     * If this constant is `r`, it will make curvature change from `-r..=r`.
     */
    curvature_range: number = 0.3

    /**
     * Set the center of the curvature changing range.
     * If this constant is `o`, and `curvature_range` is `r`, it will make curvature `(-r+o)..=(r+o)`.
     */
    curvature_offset: number = +0.5

    constructor()
    {
        this.scene = new Scene()
        this.scene.background = new Color().setHex(0xffffff)
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight)
        this.camera.position.set(0, -4, 2)

        this.geometry = new PlaneGeometry(
            2, 2, // width and height
            128, 128 // resolution
        )
        this.material = new ShaderMaterial({
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader,
            uniforms: {
                curvature: { value: 0 }
            },
            side: DoubleSide
        })
        this.mesh = new Mesh(this.geometry, this.material)

        this.scene.add(this.mesh)
    }

    update()
    {
        this.updateTimeParam()
    }

    last_call_timestamp__updateTimeParam: number = 0
    updateTimeParam()
    {
        /** in milliseconds */
        const duration = this.curvature_changing_cycle_duration_in_seconds * 1000
        const now = performance.now()
        const delta = Math.min(50, now - this.last_call_timestamp__updateTimeParam)
        const phase = ((this.last_call_timestamp__updateTimeParam + delta) / duration) % 1
        this.last_call_timestamp__updateTimeParam = now

        this.curvature = Math.sin(phase * 2 * Math.PI) * this.curvature_range + this.curvature_offset
        this.material.uniforms.curvature.value = this.curvature
    }
}

