import { Vec2 } from "./vec.ts";

export class Entity {
  pos: Vec2;

  constructor(pos: Vec2) {
    this.pos = pos;
  }

  addComp<T>(component: Component<T>, value: T): void {
    component.set(this, value);
  }

  getComp<T>(component: Component<T>): T | undefined {
    return component.get(this);
  }

  removeComp<T>(component: Component<T>): void {
    component.delete(this);
  }
}

export class Component<T> extends Map<Entity, T> {
}
