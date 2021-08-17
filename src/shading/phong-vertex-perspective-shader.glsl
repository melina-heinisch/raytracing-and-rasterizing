precision mediump float;

attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;

// Pass color as attribute and forward it
// to the fragment shader


uniform mat4 M; // From Object CS to World CS
uniform mat4 V; // From World CS to View (Camera) CS
uniform mat4 P; // From View CS to Normalized Device CS
uniform mat4 N; // normal matrix
uniform vec3 lightSources[4];
uniform vec3 cameraPosition;


varying vec3 v_color;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_lightPositions[4];
varying vec3 v_cameraPosition;

// Pass the vertex position in view space
// to the fragment shader


void main() {
  gl_Position = P * V * M * vec4(a_position, 1.0);
  v_position = V* M * vec4(a_position,1.0);

  for(int i = 0; i < 4; i++) {
    v_lightPositions[i] = ( V * vec4(lightSources[i],1.0)).xyz;
  }

  v_cameraPosition = cameraPosition;
  // Pass the color and transformed vertex position through

  v_color = a_color;
  v_normal = normalize((V * N * vec4(a_normal, 0)).xyz);
}
