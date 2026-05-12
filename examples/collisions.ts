import { Vec2, Color, Entity, Simulation, Sound, Draw } from "physim/base";
import { initBodyDisplayComponent, addCaption } from "physim/graphics";
import {
  Body,
  createCircle,
  createHollowPolygon,
  createRectangle,
  createRing,
  getRegularPolygonVertices,
  initBodyComponent,
} from "physim/bodies";
import { initCollisionForce, impactFactor } from "physim/forces/collision";
import { ParticleSystem } from "physim/particles";
import { createSparkEffect } from "physim/effects/particles";
import { SFX } from "physim/sounds";

// --- Configuration ---
const WIDTH = 1920;
const HEIGHT = 1080;
const ZOOM = 1;
const RESTITUTION = 0.8;
const CONSTANT_PULL = 10;
const TRAIL_COLOR_START = new Color(255, 255, 255);
const TRAIL_COLOR_END = new Color(255, 255, 255, 0);

// Shrink configuration: shrink to 5% of original size over 30 seconds
const SHRINK_DURATION = 30;
const SHRINK_MIN_FACTOR = 0.05;

// Store original sizes so we can lerp from original to target
const RING_INNER_RADIUS = 280;
const RING_OUTER_RADIUS = 300;
const HEXAGON_RADIUS = 600;
const HEXAGON_WIDTH = 40;

// Initialize canvas size
Draw.setCanvasSize(WIDTH, HEIGHT);

// --- Simulation Setup ---
const sim = new Simulation();
sim.physics.constantPull = new Vec2(0, CONSTANT_PULL);
sim.camera.zoom = ZOOM;

// --- Component Initialization ---
const bodyComp = initBodyComponent(sim.physics);
const displayComp = initBodyDisplayComponent(sim.display, bodyComp);
const { addCollisionCallback, staticComponent } = await initCollisionForce(
  sim.physics,
  bodyComp,
  { restitution: RESTITUTION },
);

const particles = new ParticleSystem(sim.display);
const collisionSound = await Sound.fromSynth(SFX.collision(0.5, 0.8));

// --- Event Handlers ---
addCollisionCallback((event) => {
  // Scale effects based on collision intensity
  const f = impactFactor(event.impactSpeed);

  // Visual feedback scaled to impact strength
  particles.emit(
    createSparkEffect({
      position: event.position,
      intensity: f,
    }),
  );
  sim.camera.shake(f * 40, f * 20);

  // Audio feedback
  collisionSound.play();
});

// --- Entity Creation ---

// 1. Static Ring Barrier
const ringShape = createRing(RING_INNER_RADIUS, RING_OUTER_RADIUS, [
  { startAngle: 1, size: 0.3 },
  { startAngle: 4, size: 0.1 },
]);
const ringBody = Body.fromShape(ringShape);
ringBody.angularVelocity = 0.6; // radians per second

Entity.create(new Vec2(50, 50), [
  [bodyComp, ringBody],
  [displayComp, { color: new Color(250, 250, 30) }],
  [staticComponent, true],
]);

// 1.5. Static Hexagon Barrier
const hexagonVertices = getRegularPolygonVertices(6, HEXAGON_RADIUS);
// Store a copy of the original vertices for smooth lerping during shrinking
const originalHexVertices = hexagonVertices.map((v) => v.clone());
const hexagonShape = createHollowPolygon(hexagonVertices, HEXAGON_WIDTH);
const hexagonBody = Body.fromShape(hexagonShape);

Entity.create(new Vec2(50, 50), [
  [bodyComp, hexagonBody],
  [displayComp, { color: new Color(100, 100, 255) }],
  [staticComponent, true],
]);

// 2. Active Blue Ball
Entity.create(new Vec2(100, 50), [
  [bodyComp, Body.fromShape(createCircle(20))],
  [sim.physics.velocity, new Vec2(-400, -400)],
  [displayComp, { color: Color.fromString("blue"), fill: true }],
]);

// 3. Rectangles
const rectData = [
  {
    pos: [10, 50],
    vel: [500, 100],
    color: [250, 50, 100],
    shape: createCircle(20),
    trail: true,
  },
  {
    pos: [100, 100],
    vel: [-400, 200],
    color: [20, 250, 100],
    shape: createRectangle(20, 20),
  },
  {
    pos: [130, 200],
    vel: [200, -400],
    color: [20, 50, 250],
    shape: createRectangle(20, 20),
  },
];

for (const data of rectData) {
  const entity = Entity.create(new Vec2(data.pos[0], data.pos[1]), [
    [sim.physics.mass, 10],
    [bodyComp, Body.fromShape(data.shape)],
    [
      displayComp,
      { color: new Color(data.color[0], data.color[1], data.color[2]) },
    ],
    [sim.physics.velocity, new Vec2(data.vel[0], data.vel[1])],
  ]);

  if (data.trail) {
    entity.addComp(particles.trailComponent, {
      interval: 30,
      body: Body.fromShape(createCircle(5)),
      particleLifetime: 300,
      color: { start: TRAIL_COLOR_START, end: TRAIL_COLOR_END },
    });
  }
}

// --- UI / HUD ---
addCaption(sim.display, {
  text: () => `Collisions Demo\nTime: ${sim.time.toFixed(1)}s`,
  pos: new Vec2(WIDTH / 2, 50),
  color: Color.fromString("white"),
  backgroundColor: new Color(0, 0, 0, 0.75),
  padding: new Vec2(20, 10),
  borderRadius: 8,
  outlineColor: new Color(255, 215, 0),
  outlineWidth: 2,
});

// --- Main Loop ---
await sim.run(() => {
  // Compute shrink factor (eased for a smooth feel, but we'll use linear here)
  const t = Math.min(sim.time / SHRINK_DURATION, 1);
  const shrinkFactor = 1 - (1 - SHRINK_MIN_FACTOR) * t;

  // Shrink ring
  const ringShapeData = ringBody.parts[0].shape;
  if (ringShapeData.type === "ring") {
    ringShapeData.innerRadius = RING_INNER_RADIUS * shrinkFactor;
    ringShapeData.outerRadius = RING_OUTER_RADIUS * shrinkFactor;
  }

  // Shrink hexagon
  const hexagonShapeData = hexagonBody.parts[0].shape;
  if (hexagonShapeData.type === "hollow_polygon") {
    // Scale each vertex from its original position
    for (let i = 0; i < hexagonShapeData.vertices.length; i++) {
      const orig = originalHexVertices[i];
      hexagonShapeData.vertices[i].x = orig.x * shrinkFactor;
      hexagonShapeData.vertices[i].y = orig.y * shrinkFactor;
    }
    hexagonShapeData.width = HEXAGON_WIDTH * shrinkFactor;
  }

});
