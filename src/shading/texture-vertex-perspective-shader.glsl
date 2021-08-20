attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform vec3 lightSources[4];
uniform vec3 cameraPosition;

varying vec4 v_position;
varying vec3 v_lightPositions[4];
varying vec3 v_cameraPosition;
varying vec2 v_texCoord;

void main() {
  //https://learnopengl.com/Advanced-Lighting/Normal-Mapping
  gl_Position = P * V * M * vec4(a_position, 1.0);
  v_position = V* M * vec4(a_position,1.0);
  v_texCoord = a_texCoord;

  v_cameraPosition = cameraPosition;

  for(int i = 0; i < 4; i++) {
    v_lightPositions[i] = ( V * vec4(lightSources[i],1.0)).xyz;
  }
}
