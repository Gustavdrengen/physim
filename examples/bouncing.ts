import { Vec2, Color, Entity, Simulation, Draw } from "physim/base";
import { initBodyDisplayComponent, addCaption } from "physim/graphics";
import {
  Body,
  createCircle,
  createRectangle,
  initBodyComponent,
} from "physim/bodies";
import { initCollisionForce } from "physim/forces/collision";
import { log } from "physim/logging";

const WIDTH = 800;
const HEIGHT = 600;

Draw.setCanvasSize(WIDTH, HEIGHT);

const sim = new Simulation();
sim.camera.zoom = 1;
sim.camera.position = new Vec2(WIDTH / 2, HEIGHT / 2);
sim.physics.constantPull = new Vec2(0, 10);

const bodyComp = initBodyComponent(sim.physics);
const displayComp = initBodyDisplayComponent(sim.display, bodyComp);

const { staticComponent } = await initCollisionForce(sim.physics, bodyComp, {
  restitution: 1.0,
});

const ball = Entity.create(new Vec2(WIDTH / 2, 100), [
  [bodyComp, Body.fromShape(createCircle(20))],
  [sim.physics.velocity, new Vec2(0, 0)],
  [displayComp, { color: Color.fromString("red"), fill: true }],
]);

Entity.create(new Vec2(WIDTH / 2, HEIGHT - 50), [
  [bodyComp, Body.fromShape(createRectangle(300, 20))],
  [displayComp, { color: Color.fromString("gray"), fill: true }],
  [staticComponent, true],
]);

addCaption(sim.display, {
  text: () => {
    const vel = sim.physics.velocity.get(ball);
    if (!vel) return "Velocity: 0";
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    return `Velocity: ${speed.toFixed(1)} (${vel.x.toFixed(1)}, ${vel.y.toFixed(1)})`;
  },
  pos: new Vec2(20, 20),
  color: Color.fromString("white"),
  backgroundColor: new Color(0, 0, 0, 0.5),
  padding: new Vec2(10, 5),
  borderRadius: 4,
});

await sim.run(() => {
  const vel = sim.physics.velocity.get(ball);
  if (vel) {
    log(`Velocity: ${vel.x.toFixed(1)}, ${vel.y.toFixed(1)}`);
  }
});
