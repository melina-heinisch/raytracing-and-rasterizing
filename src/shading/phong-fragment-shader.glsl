precision mediump float;

// Receive color and position values


const float shininess = 16.0;
const float kA = 0.3;
const float kD = 0.6;
const float kS = 0.7;

varying vec3 v_color;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_light;

void main(void) {
  vec3 cameraVector = vec3(0.0,0.0,0.0);
  vec3 vectorToCamera = normalize(cameraVector-v_position.xyz);
  vec3 light = normalize(v_light-v_position.xyz);


  //ambient
  float ambient = kA;

  //diffuse
  float max_diffuse = max(0.0,dot(v_normal,light));
  vec3 diffuse = v_color*max_diffuse*kD;

  //specular
  vec3 reflectionVector = normalize((2.0 * dot(v_normal,light) * v_normal) - light);
  float max_specular = pow(max(0.0,dot(reflectionVector,vectorToCamera)),shininess);
  vec3 specular = v_color * max_specular * kS;

  //Whole phong
  vec3 phong = v_color*ambient+diffuse+specular;

  gl_FragColor.x = phong.x;
  gl_FragColor.y = phong.y;
  gl_FragColor.z = phong.z;
  gl_FragColor.w = 1.0;

}
