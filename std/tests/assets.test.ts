import { test, expect } from "../test.ts";
import { fetchAsset } from "../src/public/assets.ts";
import { resolveAssetPath } from "../src/base/assets.ts";

await test("fetchAsset", () => {
  const url = "https://example.com/asset.png";
  const asset = fetchAsset(url);
  expect(asset._isFetchAsset).toBe(true);
  expect(asset.url).toBe(url);
});

await test("resolveAssetPath - string", async () => {
  const path = "local/path/to/asset.png";
  const resolved = await resolveAssetPath(path);
  expect(resolved).toBe(path);
});

await test("resolveAssetPath - FetchAsset", async () => {
  const url = "https://example.com/sound.mp3";
  const asset = fetchAsset(url);

  // Mock sim.addFetchAsset
  let addedName = "";
  let addedUrl = "";
  (globalThis as any).sim.addFetchAsset = async (name: string, url: string) => {
    addedName = name;
    addedUrl = url;
    return Promise.resolve();
  };

  const resolved = await resolveAssetPath(asset);
  expect(addedUrl).toBe(url);
  expect(resolved).toBe(addedName);
  expect(resolved.startsWith("fetchasset_")).toBe(true);
});
