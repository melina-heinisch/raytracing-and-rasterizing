attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_tangent;
attribute vec3 a_bitangent;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N;
uniform vec3 lightSources[4];
uniform vec3 cameraPosition;

varying vec4 v_position;
varying vec3 v_lightPositions[4];
varying vec3 v_cameraPosition;
varying vec2 v_texCoord;
varying mat3 v_tbn;

void main() {
  //https://learnopengl.com/Advanced-Lighting/Normal-Mapping
  gl_Position = P * V * M * vec4(a_position, 1.0);
  v_position = V* M * vec4(a_position,1.0);
  v_texCoord = a_texCoord;
  v_cameraPosition = cameraPosition;

  for(int i = 0; i < 4; i++) {
    v_lightPositions[i] = ( V * vec4(lightSources[i],1.0)).xyz;
  }


  vec3 T = normalize(vec3(N * V * M * vec4(a_tangent, 0.0)));
  vec3 B = normalize(vec3(N * V * M * vec4(a_bitangent, 0.0)));
  vec3 N2 = normalize(vec3(N * V * M * vec4(0.0,0.0,1.0, 0.0)));
  mat3 TBN = mat3(T, B, N2);

  v_tbn = TBN;
}
