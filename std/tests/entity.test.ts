import { test, expect } from "../test.ts";
import { Entity, Component, Vec2 } from "physim/base";

await test("Entity constructor", () => {
  const pos = new Vec2(10, 20);
  const entity = new Entity(pos);
  expect(entity.pos.x).toBe(10);
  expect(entity.pos.y).toBe(20);
});

await test("Entity.addComp and Entity.getComp", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(healthComponent)).toBe(100);
});

await test("Entity.getComp returns undefined for non-existent component", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();
  const manaComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(manaComponent)).toBeUndefined();
});

await test("Entity.removeComp", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(healthComponent)).toBe(100);

  entity.removeComp(healthComponent);
  expect(entity.getComp(healthComponent)).toBeUndefined();
});

await test("Multiple components on a single entity", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();
  const manaComponent = new Component<number>();
  const nameComponent = new Component<string>();

  entity.addComp(healthComponent, 100);
  entity.addComp(manaComponent, 50);
  entity.addComp(nameComponent, "Player1");

  expect(entity.getComp(healthComponent)).toBe(100);
  expect(entity.getComp(manaComponent)).toBe(50);
  expect(entity.getComp(nameComponent)).toBe("Player1");
});

await test("Single component on multiple entities", () => {
  const entity1 = new Entity(new Vec2(0, 0));
  const entity2 = new Entity(new Vec2(1, 1));
  const positionComponent = new Component<Vec2>();

  entity1.addComp(positionComponent, new Vec2(10, 10));
  entity2.addComp(positionComponent, new Vec2(20, 20));

  expect(entity1.getComp(positionComponent)?.x).toBe(10);
  expect(entity1.getComp(positionComponent)?.y).toBe(10);
  expect(entity2.getComp(positionComponent)?.x).toBe(20);
  expect(entity2.getComp(positionComponent)?.y).toBe(20);
});

await test("Component.set, Component.get, Component.delete directly", () => {
  const entity = new Entity(new Vec2(0, 0));
  const testComponent = new Component<string>();

  testComponent.set(entity, "testValue");
  expect(testComponent.get(entity)).toBe("testValue");

  testComponent.delete(entity);
  expect(testComponent.get(entity)).toBeUndefined();
});

await test("Entity.destroy removes entity from all components", () => {
  const entity = new Entity(new Vec2(0, 0));
  const c1 = new Component<number>();
  const c2 = new Component<string>();
  const c3 = new Component<boolean>();

  entity.addComp(c1, 10);
  entity.addComp(c2, "hello");
  entity.addComp(c3, true);

  expect(entity.getComp(c1)).toBe(10);
  expect(entity.getComp(c2)).toBe("hello");
  expect(entity.getComp(c3)).toBe(true);

  entity.destroy();

  expect(entity.getComp(c1)).toBeUndefined();
  expect(entity.getComp(c2)).toBeUndefined();
  expect(entity.getComp(c3)).toBeUndefined();
});
