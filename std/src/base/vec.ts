

/**
 * A 2D vector.
 */
export class Vec2 {
  /**
   * The x component of the vector.
   */
  x: number;
  /**
   * The y component of the vector.
   */
  y: number;

  /**
   * Creates a new Vec2.
   *
   * @param x The x component.
   * @param y The y component.
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Adds two vectors.
   *
   * @param other The vector to add.
   * @returns The sum of the two vectors.
   */
  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtracts two vectors.
   *
   * @param other The vector to subtract.
   * @returns The difference of the two vectors.
   */
  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  /**
   * Scales a vector by a scalar.
   *
   * @param scalar The scalar to scale by.
   * @returns The scaled vector.
   */
  scale(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  /**
   * Calculates the dot product of two vectors.
   *
   * @param other The other vector.
   * @returns The dot product.
   */
  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Calculates the length of the vector.
   *
   * @returns The length of the vector.
   */
  length(): number {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Normalizes the vector.
   *
   * @returns The normalized vector.
   */
  normalize(): Vec2 {
    const len = this.length();
    return len === 0 ? new Vec2(0, 0) : new Vec2(this.x / len, this.y / len);
  }

  /**
   * Creates a new Vec2 with all components set to zero.
   *
   * @returns A new Vec2 with all components set to zero.
   */
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  /**
   * Calculates the average of an array of vectors.
   *
   * @param vectors The array of vectors to average.
   * @returns The average vector, or a zero vector if the array is empty.
   *
   * @example
   * ```ts
   * import { Vec2 } from "physim/vec";
   * import { log } from "physim/logging";
   *
   * const vectors = [new Vec2(1, 2), new Vec2(3, 4), new Vec2(5, 6)];
   * const avg = Vec2.average(vectors);
   * log(avg); // Vec2 { x: 3, y: 4 }
   * ```
   */
  static average(vectors: Vec2[]): Vec2 {
    if (vectors.length === 0) {
      return Vec2.zero();
    }

    let sum = Vec2.zero();
    for (const vec of vectors) {
      sum = sum.add(vec);
    }

    return sum.scale(1 / vectors.length);
  }
}
