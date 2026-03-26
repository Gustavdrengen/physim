import { test, expect } from "../../test.ts";
import { Sound } from "physim/base";

await test("Sound.fromSrc and Sound.play", async () => {
  let addedProps: any = null;
  (globalThis as any).sim.addSound = async (props: any) => {
    addedProps = props;
    return 123; // Sound ID
  };

  let playedId: number = -1;
  (globalThis as any).sim.playSound = (id: number) => {
    playedId = id;
  };

  const sound = await Sound.fromSrc("test.mp3");
  expect(addedProps.src).toBe("test.mp3");
  expect(sound.id).toBe(123);

  sound.play();
  expect(playedId).toBe(123);
});
