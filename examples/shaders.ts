import { Simulation, Vec2, Draw } from "physim/base";
import {
  createBlurEffect,
  createChromaticAberrationEffect,
  createColorGradingEffect,
  createGlowEffect,
  createPixelationEffect,
  createVignetteEffect,
  invertEffect,
} from "physim/effects/shaders";
import { initGUI } from "physim/input";

const sim = new Simulation();
sim.display.backgroundColor = "#1a1a2e";

const gui = initGUI("Shader Controls", "top-left");

gui.addToggle({
  label: "Invert",
  value: false,
  onChange: (v) => {
    if (v) {
      sim.display.addShader(invertEffect);
    } else {
      sim.display.removeShader(invertEffect);
    }
  },
});

gui.addSeparator();

const glow = createGlowEffect(1.5, 0.7, 4.0);
sim.display.addShader(glow.shader);
gui.addSlider({
  label: "Glow Intensity",
  min: 0,
  max: 3,
  value: 1.5,
  onChange: (v) => glow.setIntensity(v),
});
gui.addSlider({
  label: "Glow Threshold",
  min: 0,
  max: 1,
  value: 0.7,
  onChange: (v) => glow.setThreshold(v),
});
gui.addSlider({
  label: "Glow Blur",
  min: 1,
  max: 8,
  value: 4.0,
  onChange: (v) => glow.setBlurSize(v),
});

const blur = createBlurEffect(1.0);
sim.display.addShader(blur.shader);
gui.addSlider({
  label: "Blur Amount",
  min: 0,
  max: 5,
  value: 1.0,
  onChange: (v) => blur.setAmount(v),
});

const chromatic = createChromaticAberrationEffect(0.5);
sim.display.addShader(chromatic.shader);
gui.addSlider({
  label: "Chromatic",
  min: 0,
  max: 3,
  value: 0.5,
  onChange: (v) => chromatic.setAmount(v),
});

const colorGrading = createColorGradingEffect(1.0, 1.0, 1.0);
sim.display.addShader(colorGrading.shader);
gui.addSlider({
  label: "Brightness",
  min: 0.5,
  max: 1.5,
  value: 1.0,
  onChange: (v) => colorGrading.setBrightness(v),
});
gui.addSlider({
  label: "Contrast",
  min: 0.5,
  max: 2.0,
  value: 1.0,
  onChange: (v) => colorGrading.setContrast(v),
});
gui.addSlider({
  label: "Saturation",
  min: 0,
  max: 2.0,
  value: 1.0,
  onChange: (v) => colorGrading.setSaturation(v),
});

const pixelation = createPixelationEffect(0.1);
sim.display.addShader(pixelation.shader);
gui.addSlider({
  label: 'Pixel Size',
  min: 0.01,
  max: 0.5,
  value: 0.1,
  onChange: (v) => pixelation.setPixelSize(v),
});

const vignette = createVignetteEffect(0.5, 0.3);
sim.display.addShader(vignette.shader);
gui.addSlider({
  label: "Vignette Radius",
  min: 0,
  max: 1,
  value: 0.5,
  onChange: (v) => vignette.setRadius(v),
});
gui.addSlider({
  label: "Vignette Softness",
  min: 0,
  max: 0.5,
  value: 0.3,
  onChange: (v) => vignette.setSoftness(v),
});

sim.display.addStatic(() => {
  const time = Date.now() * 0.001;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.5;
    const radius = 300 + Math.sin(time * 2 + i) * 50;
    const cx = 960 + Math.cos(angle) * radius;
    const cy = 540 + Math.sin(angle) * radius;
    const size = 30 + Math.sin(time * 3 + i * 0.5) * 15;
    const hue = (i * 45 + time * 50) % 360;
    Draw.circle(new Vec2(cx, cy), size, `hsl(${hue}, 70%, 60%)`);
  }

  for (let i = 0; i < 12; i++) {
    const x = 200 + i * 130;
    const y = 150 + Math.sin(time + i * 0.8) * 30;
    const w = 80 + Math.sin(time * 1.5 + i) * 20;
    const h = 80 + Math.cos(time * 1.2 + i) * 20;
    const hue = (i * 30 + time * 30) % 360;
    Draw.rect(new Vec2(x, y), w, h, `hsl(${hue}, 60%, 50%)`, 8);
  }

  Draw.line(
    new Vec2(100, 900),
    new Vec2(1820, 100),
    `hsl(${(time * 60) % 360}, 80%, 50%)`,
    3,
  );
  Draw.line(
    new Vec2(1820, 900),
    new Vec2(100, 100),
    `hsl(${(time * 60 + 180) % 360}, 80%, 50%)`,
    3,
  );

  Draw.text(
    new Vec2(960, 980),
    "Shader Playground - Use the sliders!",
    "24px monospace",
    "white",
  );
});

await sim.run();
