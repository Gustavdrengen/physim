import { Entity } from "../../../base/entity";

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
}
