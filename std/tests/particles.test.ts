import { test, expect, finish } from "../test.ts";
import { ParticleSystem } from "physim/particles";
import { Vec2 } from "physim/vec";
import { Color } from "physim/draw";
import { Body, createCircle } from "physim/bodies";
import { Entity } from "physim/ecs";

test("ParticleSystem - constructor", () => {
  const ps = new ParticleSystem();
  expect((ps as any).activeParticles.length).toBe(0);
  expect(ps.trailComponent).toBeTruthy();
});

test("ParticleSystem - emit", () => {
  const ps = new ParticleSystem();
  ps.emit({
    numParticles: 10,
    position: Vec2.zero(),
    particleLifetime: { min: 10, max: 20 },
    initialVelocity: { min: 1, max: 2 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  const particles = (ps as any).activeParticles;
  expect(particles.length).toBe(10);
  const p = particles[0];
  expect(p.lifetime >= 10 && p.lifetime <= 20).toBe(true);
  expect(p.velocity.length()).toBeGreaterThan(0);
});

test("ParticleSystem - update physics", () => {
  const ps = new ParticleSystem();
  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    acceleration: new Vec2(1, 0),
    particleLifetime: { min: 100, max: 100 },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  const particle = (ps as any).activeParticles[0];
  const initialPos = particle.position.clone();

  ps.update();

  expect(particle.age).toBe(1);
  expect(particle.position.x).toBeCloseTo(initialPos.x + 1); // vel is 1 after first frame
  expect(particle.velocity.x).toBeCloseTo(1);

  ps.update();
  expect(particle.position.x).toBeCloseTo(initialPos.x + 3);
});

test("ParticleSystem - particle lifetime", () => {
  const ps = new ParticleSystem();
  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    particleLifetime: { min: 2, max: 2 },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  expect((ps as any).activeParticles.length).toBe(1);
  ps.update(); // age 1
  ps.update(); // age 2, should be removed
  expect((ps as any).activeParticles.length).toBe(0);
  expect((ps as any).particlePool.length).toBe(1);
});

test("ParticleSystem - color interpolation", () => {
  const ps = new ParticleSystem();
  const startColor = new Color(255, 0, 0, 1); // Red
  const endColor = new Color(0, 0, 255, 0); // Blue (transparent)
  const lifetime = 10;

  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    particleLifetime: { min: lifetime, max: lifetime },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: startColor, end: endColor },
  });

  const particle = (ps as any).activeParticles[0];

  // After 0 frames (initial state)
  expect(particle.color).toEqual(startColor);

  // After half lifetime
  for (let i = 0; i < lifetime / 2; i++) {
    ps.update();
  }
  const expectedMidColor = new Color(127.5, 0, 127.5, 0.5);
  expect(particle.color.r).toBeCloseTo(expectedMidColor.r);
  expect(particle.color.g).toBeCloseTo(expectedMidColor.g);
  expect(particle.color.b).toBeCloseTo(expectedMidColor.b);
  expect(particle.color.a).toBeCloseTo(expectedMidColor.a);

  // After full lifetime
  for (let i = 0; i < lifetime / 2; i++) {
    ps.update();
  }
  expect(particle.color).toEqual(endColor);
});

finish();
