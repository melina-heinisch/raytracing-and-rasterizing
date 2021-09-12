import Vector from './vector';
import Matrix from "./matrix";

/**
 * Class representing a ray
 */
export default class Ray {
  /**
   * Creates a new ray with origin and direction
   * @param origin The origin of the Ray
   * @param direction The direction of the Ray
   */
  constructor(public origin: Vector, public direction: Vector) { }

  /**
   * Creates a ray from the camera through the image plane.
   * @param x The pixel's x-position in the canvas
   * @param y The pixel's y-position in the canvas
   * @param camera The Camera
   * @return The resulting Ray
   */
  static makeRay(x: number, y: number, camera: { origin: Vector, width: number, height: number, alpha: number, toWorld: Matrix }): Ray {
    let newX = x-((camera.width-1)/2);
    let newY = ((camera.height - 1)/2)-y;
    let newZ = -((camera.width/2)/Math.tan(camera.alpha/2));

    let origin = camera.origin;
    let direction = new Vector(newX,newY,newZ,0);
    direction = camera.toWorld.mulVec(direction);
    direction = direction.normalize();

    return new Ray(origin,direction);
  }
}