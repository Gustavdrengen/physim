import { test, expect, finish } from "../../test.ts";
import { createFireEffect } from "physim/effects/particles";
import { Vec2 } from "physim/vec";

test("createFireEffect", () => {
    const pos = new Vec2(123, 456);
    const updraft = -0.05;
    const effect = createFireEffect({ position: pos, updraft: updraft });

    expect(effect.position).toEqual(pos);
    expect(effect.acceleration).toBeTruthy();
    if (effect.acceleration) {
        expect(effect.acceleration.y).toBeCloseTo(updraft);
    }
});

finish();
