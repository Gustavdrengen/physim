export function resolveAssetString(str: string): string {
  if (str.startsWith("https://") || str.startsWith("http://")) {
    return str;
  } else {
    return "/getAsset/" + str;
  }
}
