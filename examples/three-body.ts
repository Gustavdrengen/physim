import { Vec2, Color, Entity, Simulation, Draw } from "physim/base";
import { initBodyDisplayComponent, addCaption } from "physim/graphics";
import { Body, createCircle, initBodyComponent } from "physim/bodies";
import { initGravityForce } from "physim/forces/gravity";
import { ParticleSystem } from "physim/particles";
import { createSparkEffect } from "physim/effects/particles";

// --- Configuration ---
const WIDTH = 1920;
const HEIGHT = 1080;
const G = 1000; // Gravitational constant (tuned for visual appeal)
const TRAIL_INTERVAL = 2; // Frames between trail particles
const TRAIL_LIFETIME = 180; // Frames trail particles persist

// Initialize canvas size
Draw.setCanvasSize(WIDTH, HEIGHT);

// --- Simulation Setup ---
const sim = new Simulation();
sim.camera.zoom = 1;

// --- Component Initialization ---
const bodyComp = initBodyComponent(sim.physics);
const displayComp = initBodyDisplayComponent(sim.display, bodyComp);
initGravityForce(sim.physics, G);

const particles = new ParticleSystem(sim.display);

// --- Entity Creation ---

// Three bodies with different masses and initial conditions
// Figure-8 orbit configuration (approximate)
const bodies = [
  {
    pos: new Vec2(WIDTH / 2 + 400, HEIGHT / 2),
    vel: new Vec2(150, 200),
    mass: 50,
    radius: 25,
    color: new Color(255, 100, 100),
  },
  {
    pos: new Vec2(WIDTH / 2 - 400, HEIGHT / 2),
    vel: new Vec2(150, -200),
    mass: 50,
    radius: 25,
    color: new Color(100, 255, 100),
  },
  {
    pos: new Vec2(WIDTH / 2, HEIGHT / 2),
    vel: new Vec2(-300, 0),
    mass: 50,
    radius: 25,
    color: new Color(100, 100, 255),
  },
];

const entities: Entity[] = [];

for (const body of bodies) {
  const entity = Entity.create(body.pos, [
    [sim.physics.mass, body.mass],
    [bodyComp, Body.fromShape(createCircle(body.radius))],
    [
      displayComp,
      {
        color: body.color,
        fill: true,
      },
    ],
    [sim.physics.velocity, body.vel],
  ]);

  entities.push(entity);

  // Add trail effect
  entity.addComp(particles.trailComponent, {
    interval: TRAIL_INTERVAL,
    body: Body.fromShape(createCircle(4)),
    particleLifetime: TRAIL_LIFETIME,
    color: {
      start: body.color.withAlpha(200),
      end: body.color.withAlpha(0),
    },
  });
}

sim.camera.follow(entities);

// --- UI / HUD ---
addCaption(sim.display, {
  text: () =>
    `Three-Body Problem\nTime: ${sim.time.toFixed(1)}s\nBodies: ${bodies.length}`,
  pos: new Vec2(WIDTH / 2, 50),
  color: Color.fromString("white"),
  backgroundColor: new Color(0, 0, 0, 0.75),
  padding: new Vec2(20, 10),
  borderRadius: 8,
  outlineColor: new Color(255, 215, 0),
  outlineWidth: 2,
});

// --- Main Loop ---
await sim.run();
