precision mediump float;

attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N; // normal matrix

varying vec3 v_color;
varying vec4 v_position;
varying vec3 v_normal;

void main() {
  gl_Position = P* V * M * vec4(a_position, 1.0);
  v_position = V* M * vec4(a_position,1.0);

  // Pass the color and transformed vertex position through

  v_color = a_color;
  v_normal = normalize((V * N * vec4(a_normal, 0)).xyz);
}
