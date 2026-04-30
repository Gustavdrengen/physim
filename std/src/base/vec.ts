

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
   * Checks if two vectors are equal.
   *
   * @param other The vector to compare.
   * @returns Whether the vectors have the same x and y components.
   */
  equals(other: Vec2): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Creates a new Vec2 with the same x and y components.
   *
   * @returns A new Vec2 with the same x and y components.
   */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
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
   * import { Vec2 } from "physim/base";
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

  /**
   * Calculates the angle of the vector in radians.
   *
   * @returns The angle of the vector in radians.
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Rotates the vector by a given angle in radians.
   *
   * @param angle The angle to rotate by in radians.
   * @returns The rotated vector.
   */
  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /**
   * Creates a random vector with a given magnitude.
   * @param magnitude The magnitude of the vector.
   * @returns The random vector.
   */
  static random(magnitude: number): Vec2 {
    const angle = Math.random() * 2 * Math.PI;
    return new Vec2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }
}
