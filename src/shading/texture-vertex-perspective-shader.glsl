attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_tangent;
attribute vec3 a_bitangent;
attribute vec3 a_tbnNormal;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N;
uniform vec3 lightSources[8];
uniform vec3 cameraPosition;
uniform int numberOfLightSourcesV;

varying vec4 v_position;
varying vec3 v_lightPositions[8];
varying vec3 v_cameraPosition;
varying vec2 v_texCoord;
varying mat3 v_tbn;

void main() {
  gl_Position = P * V * M * vec4(a_position, 1.0);
  v_position = V* M * vec4(a_position,1.0);
  v_texCoord = a_texCoord;
  v_cameraPosition = cameraPosition;

  for(int i = 0; i < 8; i++) {
    if (i >= numberOfLightSourcesV){
      break;
    }
    v_lightPositions[i] = ( V * vec4(lightSources[i],1.0)).xyz;
  }

  //Based on OpenGl reference https://learnopengl.com/Advanced-Lighting/Normal-Mapping
  vec3 T = normalize(vec3(V * M * vec4(a_tangent, 0.0)));
  vec3 B = normalize(vec3(V * M * vec4(a_bitangent, 0.0)));
  vec3 N2 = normalize(vec3(V * M * vec4(a_tbnNormal, 0.0)));
  mat3 TBN = mat3(T, B, N2);

  v_tbn = TBN;
}
