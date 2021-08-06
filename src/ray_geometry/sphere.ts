import Vector from '../math_library/vector';
import Intersection from '../math_library/intersection';
import Ray from '../math_library/ray';

/**
 * A class representing a sphere
 */
export default class Sphere {
  /**
   * Creates a new Sphere with center and radius
   * @param center The center of the Sphere
   * @param radius The radius of the Sphere
   * @param color The colour of the Sphere
   */
  constructor(
    public center: Vector,
    public radius: number,
    public color: Vector
  ) { }

  /**
   * Calculates the intersection of the sphere with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {

    let origin = ray.origin.sub(this.center);
    let direction = ray.direction.normalize();

    let c = Math.pow(origin.dot(direction),2) - origin.dot(origin) + Math.pow(this.radius,2);

    if(c < 0) {
      return null;
    }else if (c === 0){
      let t = origin.mul(-1).dot(direction);

      let intersection = ray.origin.add(direction.mul(t));

      let normal = intersection.sub(this.center);
      normal.normalize();

      return new Intersection(t,intersection,normal)
    } else if (c > 0){
      let t1 = origin.mul(-1).dot(direction) + Math.sqrt(c);
      let t2 = origin.mul(-1).dot(direction) - Math.sqrt(c);

      if(t1 < t2){
        let intersection = ray.origin.add(direction.mul(t1));
        let normal = intersection.sub(this.center);
        normal.normalize();


        return new Intersection(t1,intersection,normal)
      } else {
        let intersection = ray.origin.add(direction.mul(t2));
        let normal = intersection.sub(this.center);
        normal.normalize();

        return new Intersection(t2,intersection,normal)
      }
    }
  }
}