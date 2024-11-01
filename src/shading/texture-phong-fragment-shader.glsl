precision mediump float;

uniform float shininess;
uniform float kA;
uniform float kD;
uniform float kS;
uniform sampler2D colorSampler;
uniform sampler2D normalSampler;
uniform int numberOfLightSourcesF;

const int maxLight = 8;

varying vec4 v_position;
varying vec3 v_lightPositions[maxLight];
varying vec3 v_cameraPosition;
varying vec2 v_texCoord;
varying mat3 v_tbn;



void main(void) {
    //Based on OpenGl reference https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    vec4 color = texture2D(colorSampler, v_texCoord);
    vec3 normal = texture2D(normalSampler, v_texCoord).rgb;
    normal = normal * 2.0 - 1.0;
    normal = vec3(normal.x, normal.y, normal.z);
    normal = normalize(v_tbn * normal);
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
    vec3 ambient =color.xyz * lightSourceEnergy * kA;

    //diffuse
    vec3 diffuse = vec3(0,0,0);
    for(int i = 0; i < maxLight; i++) {
        if (i >= numberOfLightSourcesF){
            break;
        }
        float max_diffuse = max(0.0, dot(normal, lightVectors[i]));
        diffuse += (color.xyz * kD * (lightSourceEnergy * max_diffuse));
    }

    //specular
    vec3 specular = vec3(0,0,0);
    for(int i = 0; i < maxLight; i++) {
        if (i >= numberOfLightSourcesF){
            break;
        }
        float df = max(dot(normal, lightVectors[i]), 0.0);
        vec3 reflectionVector = normalize((2.0 * df * normal) - lightVectors[i]);
        float max_specular = pow(max(0.0, dot(vectorToCamera, reflectionVector)), shininess);
        specular += (color.xyz * (max_specular*lightSourceEnergy));
    }
    specular = specular * kS;
    //Whole phong
    vec3 phong = ambient + diffuse + specular;

    gl_FragColor.r = phong.x;
    gl_FragColor.g = phong.y;
    gl_FragColor.b = phong.z;
    gl_FragColor.a = 1.0;
}
