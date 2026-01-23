import { Display, Camera } from "physim/display"
import { Physics } from "physim/physics"
import { Vec2 } from "physim/vec"
import { initBodyDisplayComponent } from "physim/graphics"
import { Color } from "physim/draw"
import { Body, initBodyComponent, createRectangle, createRing, createCircle } from "physim/bodies"
import { initGravityForce } from "physim/forces/gravity"
import { initCollisionForce } from "physim/forces/collision"
import { log } from "physim/logging"
import { Entity } from "physim/ecs"
import { ParticleSystem, ParticleEmissionOptions } from "physim/particles"
import * as Draw from "physim/draw"
import { createFireEffect } from "physim/effects/particles"

const camera = new Camera();
camera.zoom = 2;
const physics = new Physics();
const display = new Display();
const bodyComponent = initBodyComponent();
const bodyDisplayComponent = initBodyDisplayComponent(display, bodyComponent);
initGravityForce(physics, 6)
const collisionForce = await initCollisionForce(physics, bodyComponent, {
  restitution: 0.1
})
const particleSystem = new ParticleSystem()

collisionForce.addCollisionCallback((event) => {
  particleSystem.emit(createFireEffect({
    position: event.position
  }))
})

const ring = new Entity(new Vec2(50, 50))
const rect1 = new Entity(new Vec2(10, 50));
const rect2 = new Entity(new Vec2(100, 100));
const rect3 = new Entity(new Vec2(130, 200));

rect1.addComp(physics.mass, 10);
rect1.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect1.addComp(bodyDisplayComponent, { color: new Color(250, 50, 100) });
rect1.addComp(physics.acceleration, new Vec2(10, 10))

rect2.addComp(physics.mass, 10);
rect2.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect2.addComp(bodyDisplayComponent, { color: new Color(20, 250, 100) });
rect2.addComp(physics.acceleration, new Vec2(-10, 20))

rect3.addComp(physics.mass, 10);
rect3.addComp(bodyComponent, Body.fromShape(createRectangle(20, 20)));
rect3.addComp(bodyDisplayComponent, { color: new Color(20, 50, 250) });
rect3.addComp(physics.acceleration, new Vec2(20, -10))

ring.addComp(physics.mass, 100);
ring.addComp(bodyComponent, Body.fromShape(createRing(200, 300)));
ring.addComp(bodyDisplayComponent, { color: new Color(250, 250, 30) });


camera.follow([rect1, rect2, rect3])

log("Starting simulation...");

sim.onUpdate = () => {
  physics.update();
  display.draw(camera);
  particleSystem.update()
  particleSystem.draw(camera);
  Draw.text(new Vec2(500, 200), "My Cool simulation")

  if (sim.frame == 60 * 5) {
    sim.finish();
  }
};
