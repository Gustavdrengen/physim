import { test, expect } from "../test.ts";
import { ParticleSystem } from "physim/particles";
import { Vec2, Color, Entity } from "physim/base";
import { Display } from "physim/base";
import { Body, createCircle } from "physim/bodies";

await test("ParticleSystem - constructor", () => {
  const ps = new ParticleSystem(new Display());
  expect((ps as any).activeParticles.length).toBe(0);
  expect(ps.trailComponent).toBeTruthy();
});

await test("ParticleSystem - emit", () => {
  const ps = new ParticleSystem(new Display());
  ps.emit({
    numParticles: 10,
    position: Vec2.zero(),
    particleLifetime: { min: 0.167, max: 0.333 },
    initialVelocity: { min: 60, max: 120 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  const particles = (ps as any).activeParticles;
  expect(particles.length).toBe(10);
  const p = particles[0];
  expect(p.lifetime >= 0.167 && p.lifetime <= 0.333).toBe(true);
  expect(p.velocity.length()).toBeGreaterThan(0);
});

await test("ParticleSystem - update physics", () => {
  const ps = new ParticleSystem(new Display());
  const dt = 1 / 60;
  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    acceleration: new Vec2(60, 0),
    particleLifetime: { min: 1.67, max: 1.67 },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  const particle = (ps as any).activeParticles[0];
  const initialPos = particle.position.clone();

  (ps as any).update();

  expect(particle.age).toBeCloseTo(dt);
  expect(particle.position.x).toBeCloseTo(initialPos.x + 1 * dt);
  expect(particle.velocity.x).toBeCloseTo(1);

  (ps as any).update();
  expect(particle.position.x).toBeCloseTo(initialPos.x + 3 * dt);
});

await test("ParticleSystem - particle lifetime", () => {
  const ps = new ParticleSystem(new Display());
  const lifetime = 2 / 60;
  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    particleLifetime: { min: lifetime, max: lifetime },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: new Color(255, 255, 255), end: new Color(0, 0, 0) },
  });

  expect((ps as any).activeParticles.length).toBe(1);
  (ps as any).update();
  (ps as any).update();
  expect((ps as any).activeParticles.length).toBe(0);
  expect((ps as any).particlePool.length).toBe(1);
});

await test("ParticleSystem - color interpolation", () => {
  const ps = new ParticleSystem(new Display());
  const startColor = new Color(255, 0, 0, 1);
  const endColor = new Color(0, 0, 255, 0);
  const lifetime = 10 / 60;

  ps.emit({
    numParticles: 1,
    position: Vec2.zero(),
    particleLifetime: { min: lifetime, max: lifetime },
    initialVelocity: { min: 0, max: 0 },
    body: Body.fromShape(createCircle(5)),
    color: { start: startColor, end: endColor },
  });

  const particle = (ps as any).activeParticles[0];

  expect(particle.color).toEqual(startColor);

  for (let i = 0; i < 5; i++) {
    (ps as any).update();
  }
  const expectedMidColor = new Color(127.5, 0, 127.5, 0.5);
  expect(particle.color.r).toBeCloseTo(expectedMidColor.r);
  expect(particle.color.g).toBeCloseTo(expectedMidColor.g);
  expect(particle.color.b).toBeCloseTo(expectedMidColor.b);
  expect(particle.color.a).toBeCloseTo(expectedMidColor.a);

  for (let i = 0; i < 5; i++) {
    (ps as any).update();
  }
  expect(particle.color).toEqual(endColor);
});
