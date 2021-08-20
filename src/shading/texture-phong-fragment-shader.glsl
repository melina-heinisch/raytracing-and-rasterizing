precision mediump float;

uniform float shininess;
uniform float kA;
uniform float kD;
uniform float kS;
uniform sampler2D colorSampler;
uniform sampler2D normalSampler;

varying vec4 v_position;
varying vec3 v_lightPositions[4];
varying vec3 v_cameraPosition;
varying vec2 v_texCoord;



void main(void) {
    vec4 color = texture2D(colorSampler, v_texCoord);
    vec4 normal = texture2D(normalSampler, v_texCoord);
    normal = vec4((2.0*normal.x)-1.0,(2.0*normal.y)-1.0,(2.0*normal.z)-1.0,(2.0*normal.w)-1.0);
    vec3 vectorToCamera = normalize(v_cameraPosition-v_position.xyz);
    vec3 lightVectors[4];
    float lightSourceEnergy = 0.8;

    for(int i = 0; i < 4; i++) {
        lightVectors[i] = normalize(v_lightPositions[i]-v_position.xyz);
    }

    //ambient
    vec3 ambient =color.xyz * lightSourceEnergy * kA;

    //diffuse
    vec3 diffuse = vec3(0,0,0);
    for(int i = 0; i < 4; i++) {
        float max_diffuse = max(0.0, dot(normal.xyz, lightVectors[i]));
        diffuse += (color.xyz * kD * (lightSourceEnergy * max_diffuse));
    }

    //specular
    vec3 specular = vec3(0,0,0);
    for(int i = 0; i < 4; i++) {
        float df = max(dot(normal.xyz, lightVectors[i]), 0.0);
        vec3 reflectionVector = normalize((2.0 * df * normal.xyz) - lightVectors[i]);
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
