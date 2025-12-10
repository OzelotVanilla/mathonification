/**
 * @author ChatGPT
 */

varying float vHeight;

void main() {
    // 高さを 0〜1 に正規化
    float h = (vHeight + 1.0) * 0.5;
    vec3 color = vec3(h);

    gl_FragColor = vec4(color, 1.0);
}