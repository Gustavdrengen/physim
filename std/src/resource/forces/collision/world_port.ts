import { Entity } from '../../../base/entity.ts';
import { Body } from '../../../feature/bodies/body.ts';
import { Vec2 } from '../../../base/vec.ts';
import { DefaultCollisionProperties, SyncedState } from './types.ts';

export interface WorldPort {
  init(): Promise<void>;

  addEntity(entity: Entity, body: Body, defaultProps: DefaultCollisionProperties): void;
  removeEntity(entity: Entity): void;
  hasEntity(entity: Entity): boolean;
  getEntities(): Entity[];

  step(): void;
  getCollisionEvents(): import('./types.ts').CollisionEvent[];

  syncRigidBodyToEntity(entity: Entity): void;
  syncEntityToRigidBody(entity: Entity): void;
}