type FetchAsset = {
  _isFetchAsset: true;
  url: string;
};

/**
 * Represents an asset.
 * It can be a local path (string) or a remote asset to be fetched.
 * Use {@link fetchAsset} to create a fetchable asset.
 */
export type Asset = string | FetchAsset;

/**
 * Creates a fetchable asset from a URL.
 * This tells the engine to download the asset from the given URL.
 * @param url The URL of the asset to fetch.
 * @returns A FetchAsset object.
 */
export function fetchAsset(url: string): FetchAsset {
  return {
    _isFetchAsset: true,
    url,
  };
}

const fetchAssets = new Map<string, string>();
const fetchingPromises = new Map<string, Promise<void>>();
let id = 0;

/**
 * Resolves an asset to a path that can be used by the engine.
 * If the asset is a URL, it will be fetched and cached.
 * @param asset The asset to resolve.
 * @returns A promise that resolves to the local path of the asset.
 * @internal
 */
export async function resolveAssetPath(asset: Asset): Promise<string> {
  if (typeof asset === "string") {
    return asset;
  } else if (asset._isFetchAsset) {
    console.log(`try get ${asset.url}`);
    if (!fetchAssets.has(asset.url)) {
      const name = "fetchasset_" + id++;
      fetchAssets.set(asset.url, name);
      fetchingPromises.set(asset.url, sim.addFetchAsset(name, asset.url));
    }
    await fetchingPromises.get(asset.url);
    return fetchAssets.get(asset.url)!;
  }
  throw new Error("Invalid asset type");
}
