precision mediump float;

uniform sampler2D sampler;
varying vec2 v_texCoord;

void main(void) {
  gl_FragColor = texture2D(sampler, vec2(v_texCoord.s, v_texCoord.t));
  gl_FragColor.a = 1.0;
  // Read fragment color from texture
}
