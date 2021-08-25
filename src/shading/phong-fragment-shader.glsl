precision mediump float;

uniform float shininess;
uniform float kA;
uniform float kD;
uniform float kS;
uniform int numberOfLightSourcesF;

const int maxLight = 8;

varying vec3 v_color;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_lightPositions[maxLight];
varying vec3 v_cameraPosition;


void main(void) {
  vec3 vectorToCamera = normalize(v_cameraPosition-v_position.xyz);
  vec3 lightVectors[maxLight];
  float lightSourceEnergy = 0.8;

  for(int i = 0; i < maxLight; i++) {
    if (i >= numberOfLightSourcesF){
      break;
    }
    lightVectors[i] = normalize(v_lightPositions[i]-v_position.xyz);
  }

  //ambient
  vec3 ambient =v_color* lightSourceEnergy * kA;

  //diffuse
  vec3 diffuse = vec3(0,0,0);
  for(int i = 0; i < maxLight; i++) {
    if (i >= numberOfLightSourcesF){
      break;
    }
      float max_diffuse = max(0.0, dot(v_normal, lightVectors[i]));
      diffuse += (v_color* kD* (lightSourceEnergy * max_diffuse));
  }

  //specular
  vec3 specular = vec3(0,0,0);
  for(int i = 0; i < maxLight; i++) {
    if (i >= numberOfLightSourcesF){
      break;
    }
    float df = max(dot(v_normal, lightVectors[i]), 0.0);
    vec3 reflectionVector = normalize((2.0 * df * v_normal) - lightVectors[i]);
    float max_specular = pow(max(0.0, dot(vectorToCamera, reflectionVector)), shininess);
    specular += (v_color* (max_specular*lightSourceEnergy));
  }
  specular = specular * kS;
  //Whole phong
  vec3 phong = ambient + diffuse + specular;

  gl_FragColor.x = phong.x;
  gl_FragColor.y = phong.y;
  gl_FragColor.z = phong.z;
  gl_FragColor.w = 1.0;

}
