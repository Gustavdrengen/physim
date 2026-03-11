import { fetchAsset } from "../../base/assets.ts";

/**
 * A collection of common instruments (soundfonts) for use in simulations.
 * All assets are in the public domain.
 */
export namespace Instruments {
  /** A standard acoustic piano sound. */
  export const PIANO = fetchAsset(
    "https://musical-artifacts.com/artifacts/372/campbellspianobeta2.sf2",
  );
  /** An electric guitar sound. */
  //export const GUITAR = fetchAsset("https://physim.org/assets/sounds/instruments/guitar.sf2");
  /** A basic drum kit. */
  //export const DRUMS = fetchAsset("https://physim.org/assets/sounds/instruments/drums.sf2");
  /** A synthesizer sound. */
  //export const SYNTH = fetchAsset("https://physim.org/assets/sounds/instruments/synth.sf2");
  /** A violin sound. */
  //export const VIOLIN = fetchAsset("https://physim.org/assets/sounds/instruments/violin.sf2");
  /** A trumpet sound. */
  //export const TRUMPET = fetchAsset("https://physim.org/assets/sounds/instruments/trumpet.sf2");
  /** A flute sound. */
  //export const FLUTE = fetchAsset("https://physim.org/assets/sounds/instruments/flute.sf2");
}
