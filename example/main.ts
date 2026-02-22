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
import { NoteSeries } from "physim/audio";
import { fetchAsset } from "physim/assets";
import { Simulation } from "physim/simulation";

const simulation = new Simulation();
simulation.camera.zoom = 2;
const bodyComponent = initBodyComponent();
const bodyDisplayComponent = initBodyDisplayComponent(
  simulation.display,
  bodyComponent,
);
initGravityForce(simulation.physics, 6);
const { addCollisionCallback, staticComponent } = await initCollisionForce(
  simulation.physics,
  bodyComponent,
  {
    restitution: 0.1,
  },
);
const particleSystem = new ParticleSystem();

const notes = new NoteSeries(
  [
    "E5",
    "D#5",
    "E5",
    "D#5",
    "E5",
    "B4",
    "D5",
    "C5",
    "A4",
    "C5",
    "E5",
    "A4",
    "B4",
    "E5",
    "G#4",
    "B4",
    "C5",
    "E5",
    "E5",
    "D#5",
    "E5",
    "D#5",
    "E5",
    "B4",
    "D5",
    "C5",
    "A4",
    "C5",
    "E5",
    "A4",
  ],
  fetchAsset(
    "https://musical-artifacts.com/artifacts/4819/School_Piano_2024.sf2",
  ),
);

await notes.init();

addCollisionCallback((event) => {
  particleSystem.emit(
    createFireEffect({
      position: event.position,
    }),
  );
  simulation.camera.shake(20, 10);
});

const blueBallBody = Body.fromShape(createCircle(20));
const blueBall = Entity.create(new Vec2(100, 50), [
  [bodyComponent, blueBallBody],
  [simulation.physics.velocity, new Vec2(-2000, -1000)],
  [bodyDisplayComponent, { color: Color.fromString("blue"), fill: true }],
]);

const ring = new Entity(new Vec2(50, 50));
const rect1 = new Entity(new Vec2(10, 50));
const rect2 = new Entity(new Vec2(100, 100));
const rect3 = new Entity(new Vec2(130, 200));

rect1.addComp(simulation.physics.mass, 10);
rect1.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect1.addComp(bodyDisplayComponent, { color: new Color(250, 50, 100) });
rect1.addComp(simulation.physics.acceleration, new Vec2(500, 1000));
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
rect2.addComp(simulation.physics.acceleration, new Vec2(-1000, 2000));

rect3.addComp(simulation.physics.mass, 10);
rect3.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect3.addComp(bodyDisplayComponent, { color: new Color(20, 50, 250) });
rect3.addComp(simulation.physics.acceleration, new Vec2(2000, -1000));

const ringBody = Body.fromShape(
  createRing(200, 300, [
    { startAngle: 1, size: 0.5 },
    { startAngle: 4, size: 0.2 },
  ]),
  3,
);

ring.addComp(simulation.physics.mass, 100);
ring.addComp(bodyComponent, ringBody);
ring.addComp(bodyDisplayComponent, { color: new Color(250, 250, 30) });
ring.addComp(staticComponent, true);

//simulation.camera.follow([rect1, rect2, rect3]);

log("Starting simulation...", 67);

simulation.run(() => {
  particleSystem.update();
  particleSystem.draw(simulation.camera);
  Draw.text(new Vec2(500, 200), "SIX SEVEN");
  ringBody.rotation += 0.01;

  if (simulation.frame % 15 === 0) {
    notes.playNext();
  }

  if (simulation.frame == 60 * 5) {
    //sim.finish();
  }
});
