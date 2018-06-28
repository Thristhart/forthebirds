// from https://gist.github.com/mattdw/60efe28d5e787655f618e2a70a4e8bfe
import * as THREE from "three";


const params = `
varying vec2 vUv;
uniform vec2 offset;
uniform vec2 repeat;
uniform sampler2D texture;
uniform vec3 color;
`

const vertexShader = `
${params}

void main() {
  vUv = uv * repeat + offset;
  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position,1.0);
}`;

const fragmentShader = `
${params}

void main(void) {
  gl_FragColor = texture2D(texture, vUv) * vec4(color, 1);
}
`;


export default function unlitSpriteShaderMaterial(texture, color) {
  let mat = new THREE.ShaderMaterial({
    uniforms: {
      texture: {type: "t", value: texture},
      offset: {type: "v2", value: new THREE.Vector2()},
      repeat: {type: "v2", value: new THREE.Vector2()},
      color: {type: "c", value: new THREE.Color(color)},
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  
  mat.offset = mat.uniforms.offset.value;
  mat.repeat = mat.uniforms.repeat.value;
  mat.color = mat.uniforms.color.value;
  mat.transparent = true;
  
  return mat;
}