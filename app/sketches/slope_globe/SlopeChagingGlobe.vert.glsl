/**
 * @author ChatGPT
 */

uniform float curvature;

varying float vHeight;

void main() {
    vec3 pos = position;

    float x = pos.x; 
    float y = pos.y;
    float k = curvature;

    float sphereZ = sqrt(max(0.0, 1.0 - x*x - y*y));
    float saddleZ = x*x - y*y;

    float z = mix(sphereZ, saddleZ, k);

    pos.z = z;
    vHeight = z;

    // normal は Fragment で再計算してもいいが、簡易としてここでは unchanged
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}