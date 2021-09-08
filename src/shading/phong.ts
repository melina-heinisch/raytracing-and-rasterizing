import Vector from '../math_library/vector';
import Intersection from '../math_library/intersection';

/**
 * Calculate the colour of an object at the intersection point according to the Phong Lighting model.
 * @param color The colour of the intersected object
 * @param intersection The intersection information
 * @param lightPositions The light positions
 * @param shininess The shininess parameter of the Phong model
 * @param ambient The ambient parameter of the Phong model
 * @param diffuse The diffuse parameter of the Phong model
 * @param specular The specular parameter of the Phong model
 * @param cameraPosition The position of the camera
 * @return The resulting colour
 */
export default function phong(color: Vector, intersection: Intersection, lightPositions: Array<Vector>, shininess: number, ambient: number, diffuse: number, specular: number, cameraPosition: Vector): Vector {

    const lightColor = new Vector(0.8, 0.8, 0.8, 0);
    const kA = ambient; // Ambient reflectivity coefficient
    const kD = diffuse; // Diffuse reflectivity coefficient
    const kS = specular; // Specular reflectivity coefficient

    const intersectionPoint = intersection.point;
    const surfaceNormal = intersection.normal;

    let lightSourceEnergy = 0.8;

    // Vectors from Intersection to viewer (in this case camera)
    const vectorToCamera = cameraPosition.sub(intersectionPoint).normalize();

    // Vectors from intersection to each light
    let lightVectors: Vector[] = []
    lightPositions.forEach(light => {
        lightVectors.push(light.sub(intersectionPoint).normalize());
    })

    // --------------------- Ambient Lighting Calculation --------------------------
    // General light energy that hits the object (e.g. daylight)
    let ambientLight = lightSourceEnergy * kA;

    // --------------------- Diffuse Lighting Calculation --------------------------
    // Light splits and is reflected in various directions
    let diffuseLight = new Vector(0, 0, 0, 0);
    lightVectors.forEach(light => {
        // Cannot be less than 0 that way
        let brackets = Math.max(0, surfaceNormal.dot(light));

        diffuseLight = diffuseLight.add(lightColor.mul(lightSourceEnergy * brackets));
    });

    diffuseLight = diffuseLight.mul(kD);

    // --------------------- Specular Lighting Calculation --------------------------
    // Reflection of a glossy surface
    let specularLight = new Vector(0, 0, 0, 0);
    lightVectors.forEach(light => {
        let reflectionVector = surfaceNormal.mul(surfaceNormal.dot(light)).mul(2).sub(light).normalize();

        let brackets = Math.pow(Math.max(0, reflectionVector.dot(vectorToCamera)), shininess);

        specularLight = specularLight.add(lightColor.mul(lightSourceEnergy * brackets));

    });

    specularLight = specularLight.mul(kS);

    return color.mul(ambientLight).add(diffuseLight).add(specularLight);
}