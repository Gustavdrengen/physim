import { Simulation, Sound, Color, Vec2, Draw } from "physim/base";
import { SFX, Instruments } from "physim/sounds";
import { prompt, select } from "physim/input";
import { addCaption } from "physim/graphics";

// --- Setup ---
const WIDTH = 1920;
const HEIGHT = 1080;
Draw.setCanvasSize(WIDTH, HEIGHT);

const sim = new Simulation();
sim.camera.zoom = 1;

// --- UI ---
addCaption(sim.display, {
  text: "Sound Tester\nSelect categories and parameters using the prompts.",
  pos: new Vec2(WIDTH / 2, HEIGHT / 2),
  color: Color.fromString("white"),
  backgroundColor: new Color(0, 0, 0, 0.5),
  padding: new Vec2(40, 20),
  borderRadius: 12,
});

// --- Logic ---
async function inputLoop() {
  while (true) {
    const category = select("What would you like to test?", [
      "Procedural SFX",
      "Soundfont Instruments",
      "Exit"
    ]);

    if (!category || category === "Exit") {
      sim.finish();
      break;
    }

    if (category === "Procedural SFX") {
      const type = select("Select an SFX type:", [
        "Collision",
        "Explosion",
        "Stress",
        "Phase Change",
        "Oscillation",
        "Resonance",
        "Friction",
        "Electric Discharge",
        "Vortex"
      ]);

      if (!type) continue;

      let synth;
      
      switch (type) {
        case "Collision": {
          const intensity = parseFloat(prompt("Intensity (0.0 to 1.0):", "0.5") || "0.5");
          const hardness = parseFloat(prompt("Hardness (0.0 to 1.0):", "0.8") || "0.8");
          synth = SFX.collision(intensity, hardness);
          break;
        }
        case "Explosion": {
          const intensity = parseFloat(prompt("Intensity (0.0 to 1.0):", "0.7") || "0.7");
          synth = SFX.explosion(intensity);
          break;
        }
        case "Stress": {
          const tension = parseFloat(prompt("Tension (0.0 to 1.0):", "0.4") || "0.4");
          synth = SFX.stress(tension);
          break;
        }
        case "Phase Change": {
          const rate = parseFloat(prompt("Rate (0.0 to 1.0):", "0.6") || "0.6");
          synth = SFX.phaseChange(rate);
          break;
        }
        case "Oscillation": {
          const freq = parseFloat(prompt("Frequency (Hz):", "440") || "440");
          const amp = parseFloat(prompt("Amplitude (0.0 to 1.0):", "0.5") || "0.5");
          synth = SFX.oscillation(freq, amp);
          break;
        }
        case "Resonance": {
          const fundamental = parseFloat(prompt("Fundamental Freq (Hz):", "261.63") || "261.63");
          const dampening = parseFloat(prompt("Dampening (0.0 to 1.0):", "0.2") || "0.2");
          synth = SFX.resonance(fundamental, dampening);
          break;
        }
        case "Friction": {
          const velocity = parseFloat(prompt("Velocity (0.0 to 1.0):", "0.5") || "0.5");
          const roughness = parseFloat(prompt("Roughness (0.0 to 1.0):", "0.3") || "0.3");
          synth = SFX.friction(velocity, roughness);
          break;
        }
        case "Electric Discharge": {
          const intensity = parseFloat(prompt("Intensity (0.0 to 1.0):", "0.8") || "0.8");
          synth = SFX.electricDischarge(intensity);
          break;
        }
        case "Vortex": {
          const strength = parseFloat(prompt("Strength (0.0 to 1.0):", "0.7") || "0.7");
          const radius = parseFloat(prompt("Radius (0.0 to 1.0):", "0.5") || "0.5");
          synth = SFX.vortex(strength, radius);
          break;
        }
      }

      if (synth) {
        const sound = await Sound.fromSynth(synth);
        sound.play();
      }

    } else if (category === "Soundfont Instruments") {
      const instrument = select("Select an instrument:", ["Piano"]);
      if (!instrument) continue;

      const note = prompt("Enter a note (e.g., C4, Eb5, G2):", "C4") || "C4";
      
      let fundfont;
      if (instrument === "Piano") fundfont = Instruments.PIANO;
      
      if (fundfont) {
        const sound = await Sound.fromNote(note, fundfont);
        sound.play();
      }
    }
  }
}

// Start input handler
inputLoop();

// Start simulation loop (background)
await sim.run();
