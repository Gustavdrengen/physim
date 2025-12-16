import { extname, join } from "@std/path";
import { fail, failed, InputFailureTag, Result } from "./err.ts";

export async function idk(src: string, dest: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Failed to download ${src}: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    await Deno.writeFile(dest, uint8);
  } else {
    await Deno.copyFile(src, dest);
  }
}

export class AssetManager {
  simDir: string;
  tempDir: string;
  redirects: Map<string, string> = new Map();
  id: number = 0;

  constructor(simDir: string, tempDir: string) {
    this.simDir = simDir;
    this.tempDir = tempDir;
  }

  async addFetchAsset(path: string, fetchAddr: string): Promise<Result<undefined>> {
    const res = await fetch(fetchAddr);

    if (!res.ok || !res.body) {
      return fail(InputFailureTag.AssetFetchFailure, "Failed to download file.");
    }

    const data = new Uint8Array(await res.arrayBuffer());
    const savePath = join(this.tempDir, `asset_${this.id}${extname(fetchAddr)}`);
    console.log(savePath);
    await Deno.writeFile(savePath, data);
    this.redirects.set(path, savePath);
  }

  resolveAssetPath(assetPath: string): Result<string> {
    const redirectRes = this.redirects.get(assetPath);
    if (redirectRes !== undefined) {
      return redirectRes;
    } else {
      const path = join(this.simDir, assetPath);
      try {
        if (!Deno.statSync(path).isFile) {
          return fail(InputFailureTag.AssetFailure, `${path} is not a file.`);
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return fail(InputFailureTag.AssetFailure, `${path} does not exist.`);
        } else {
          throw error;
        }
      }

      return path;
    }
  }

  copyAsset(assetPath: string, to: string): Result<undefined> {
    const pathRes = this.resolveAssetPath(assetPath);
    if (failed(pathRes)) {
      return pathRes as Result<undefined>;
    }

    Deno.copyFile(pathRes as string, to);
  }
}
