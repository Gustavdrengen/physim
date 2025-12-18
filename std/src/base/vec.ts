/**
 * @module
 *
 * A 2D vector class.
 *
 * @example
 * ```ts
 * import { Vec2 } from "./vec.ts";
 *
 * const a = new Vec2(1, 2);
 * const b = new Vec2(3, 4);
 *
 * console.log(a.add(b)); // Vec2 { x: 4, y: 6 }
 * ```
 */

/**
 * A 2D vector.
 */
export class Vec2 {
  /**
   * The x component of the vector.
   */
  readonly x: number;
  /**
   * The y component of the vector.
   */
  readonly y: number;

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
}
