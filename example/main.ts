import { Vec2 } from "physim/vec";
import { initBodyDisplayComponent } from "physim/graphics";
import { Color } from "physim/draw";
import {
  Body,
  createCircle,
  createRectangle,
  createRing,
  initBodyComponent,
} from "physim/bodies";
import { initGravityForce } from "physim/forces/gravity";
import { initCollisionForce } from "physim/forces/collision";
import { log } from "physim/logging";
import { Entity } from "physim/ecs";
import { ParticleSystem } from "physim/particles";
import * as Draw from "physim/draw";
import { createFireEffect } from "physim/effects/particles";
import { Sound } from "physim/audio";
import { Simulation } from "physim/simulation";
import { Instruments, SFX } from "physim/sounds";

const simulation = new Simulation();
//simulation.physics.constantPull = new Vec2(0, 10);
simulation.camera.zoom = 2;
const bodyComponent = initBodyComponent();
const bodyDisplayComponent = initBodyDisplayComponent(
  simulation.display,
  bodyComponent,
);
const { addCollisionCallback, staticComponent } = await initCollisionForce(
  simulation.physics,
  bodyComponent,
  {
    restitution: 1.0,
  },
);
const particleSystem = new ParticleSystem();

const collisionSound = await Sound.fromSynth(SFX.stress(0.5));

addCollisionCallback((event) => {
  particleSystem.emit(
    createFireEffect({
      position: event.position,
    }),
  );
  simulation.camera.shake(20, 10);
  collisionSound.play();
});

const blueBallBody = Body.fromShape(createCircle(20));
const blueBall = Entity.create(new Vec2(100, 50), [
  [bodyComponent, blueBallBody],
  [simulation.physics.velocity, new Vec2(-200, -100)],
  [bodyDisplayComponent, { color: Color.fromString("blue"), fill: true }],
]);

const ring = new Entity(new Vec2(50, 50));
const rect1 = new Entity(new Vec2(10, 50));
const rect2 = new Entity(new Vec2(100, 100));
const rect3 = new Entity(new Vec2(130, 200));

rect1.addComp(simulation.physics.mass, 10);
rect1.addComp(bodyComponent, Body.fromShape(createCircle(20)));
rect1.addComp(bodyDisplayComponent, { color: new Color(250, 50, 100) });
rect1.addComp(simulation.physics.acceleration, new Vec2(500, 100));
rect1.addComp(particleSystem.trailComponent, {
  interval: 60 * 0.5,
  body: Body.fromShape(createCircle(5)),
  particleLifetime: 60 * 5,
  color: {
    start: new Color(255, 255, 255),
    end: new Color(255, 255, 255, 0),
  },
});

rect2.addComp(simulation.physics.mass, 10);
rect2.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect2.addComp(bodyDisplayComponent, { color: new Color(20, 250, 100) });
rect2.addComp(simulation.physics.acceleration, new Vec2(-400, 200));

rect3.addComp(simulation.physics.mass, 10);
rect3.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect3.addComp(bodyDisplayComponent, { color: new Color(20, 50, 250) });
rect3.addComp(simulation.physics.acceleration, new Vec2(200, -400));

const ringBody = Body.fromShape(
  createRing(200, 300, [
    { startAngle: 1, size: 0.5 },
    { startAngle: 4, size: 0.2 },
  ]),
  3,
);

//ring.addComp(simulation.physics.mass, 100);
ring.addComp(bodyComponent, ringBody);
ring.addComp(bodyDisplayComponent, { color: new Color(250, 250, 30) });
ring.addComp(staticComponent, true);

//simulation.camera.follow([rect1, rect2, rect3]);

log("Starting simulation...", 67);

await simulation.run(() => {
  particleSystem.update();
  particleSystem.draw(simulation.camera);
  Draw.text(new Vec2(500, 200), "SIX SEVEN");
  ringBody.rotation += 0.01;

  if (simulation.frame == 60 * 5) {
    //sim.finish();
  }
});
