import { Entity } from "../../../base/entity";
import { Vec2 } from "../../../base/vec";

/**
 * Represents a collision event between two entities.
 */
export interface CollisionEvent {
  /**
   * The first entity involved in the collision.
   */
  entityA: Entity;
  /**
   * The second entity involved in the collision.
   */
  entityB: Entity;
  /**
   * The position of the collision.
   */
  position: Vec2;
}
