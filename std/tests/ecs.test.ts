import { test, expect, finish } from "../test.ts";
import { Entity, Component } from "../src/public/ecs.ts";
import { Vec2 } from "../src/public/vec.ts";

test("Entity constructor", () => {
  const pos = new Vec2(10, 20);
  const entity = new Entity(pos);
  expect(entity.pos.x).toBe(10);
  expect(entity.pos.y).toBe(20);
});

test("Entity.addComp and Entity.getComp", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(healthComponent)).toBe(100);
});

test("Entity.getComp returns undefined for non-existent component", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();
  const manaComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(manaComponent)).toBeUndefined();
});

test("Entity.removeComp", () => {
  const pos = new Vec2(0, 0);
  const entity = new Entity(pos);
  const healthComponent = new Component<number>();

  entity.addComp(healthComponent, 100);
  expect(entity.getComp(healthComponent)).toBe(100);

  entity.removeComp(healthComponent);
  expect(entity.getComp(healthComponent)).toBeUndefined();
});

test("Multiple components on a single entity", () => {
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

test("Single component on multiple entities", () => {
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

test("Component.set, Component.get, Component.delete directly", () => {
  const entity = new Entity(new Vec2(0, 0));
  const testComponent = new Component<string>();

  testComponent.set(entity, "testValue");
  expect(testComponent.get(entity)).toBe("testValue");

  testComponent.delete(entity);
  expect(testComponent.get(entity)).toBeUndefined();
});

finish();
