import { NAMED_COLORS } from "./colorNames.ts";

/**
 * A color class that can be used to represent colors in RGB, HSL, HSV and hex formats.
 *
 * @example
 * ```ts
 * import { Color } from "physim/base";
 *
 * const red = Color.fromRGB(255, 0, 0);
 * const green = Color.fromHex("#00ff00");
 * const blue = Color.fromHSL(240, 100, 50);
 * const transparent = Color.fromString("transparent");
 * ```
 */
export class Color {
  /**
   * The red component of the color, from 0 to 255.
   */
  r: number;
  /**
   * The green component of the color, from 0 to 255.
   */
  g: number;
  /**
   * The blue component of the color, from 0 to 255.
   */
  b: number;
  /**
   * The alpha component of the color, from 0 to 1.
   */
  a: number;

  /**
   * Creates a new Color.
   *
   * @param r The red component of the color, from 0 to 255.
   * @param g The green component of the color, from 0 to 255.
   * @param b The blue component of the color, from 0 to 255.
   * @param a The alpha component of the color, from 0 to 1.
   */
  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = Color._clampInt(r);
    this.g = Color._clampInt(g);
    this.b = Color._clampInt(b);
    this.a = Color._clamp01(a);
  }

  // --- Factories ---------------------------------------------------------
  /**
   * Creates a new Color from RGB values.
   *
   * @param r The red component of the color, from 0 to 255.
   * @param g The green component of the color, from 0 to 255.
   * @param b The blue component of the color, from 0 to 255.
   * @param a The alpha component of the color, from 0 to 1.
   * @returns A new Color.
   */
  static fromRGB(r: number, g: number, b: number, a: number = 1): Color {
    return new Color(r, g, b, a);
  }

  /**
   * Creates a new Color from a hex string.
   * Accepts hex strings:
   * #RGB, #RRGGBB, #RGBA, #RRGGBBAA (with or without leading '#')
   *
   * @param hex The hex string.
   * @returns A new Color.
   */
  static fromHex(hex: string): Color {
    let s = hex.trim();
    if (s.startsWith("#")) s = s.slice(1);

    if (![3, 4, 6, 8].includes(s.length)) {
      throw new Error("Invalid hex length. Expected 3,4,6 or 8 hex digits.");
    }

    // Expand 3/4-digit forms to 6/8
    if (s.length === 3 || s.length === 4) {
      s = s
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }

    // Now 6 or 8 chars
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;

    return new Color(r, g, b, a);
  }

  /**
   * Creates a new Color from HSL values.
   *
   * @param h The hue of the color, in degrees [0..360).
   * @param s The saturation of the color, as a fraction 0..1 or percent 0..100.
   * @param l The lightness of the color, as a fraction 0..1 or percent 0..100.
   * @param a The alpha component of the color, from 0 to 1.
   * @returns A new Color.
   */
  static fromHSL(h: number, s: number, l: number, a: number = 1): Color {
    // normalize
    const H = (((h % 360) + 360) % 360) / 360; // 0..1
    const S = s > 1 ? s / 100 : s; // allow 0..100 or 0..1
    const L = l > 1 ? l / 100 : l;

    if (S === 0) {
      const v = Math.round(L * 255);
      return new Color(v, v, v, a);
    }

    const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
    const p = 2 * L - q;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const r = Math.round(hue2rgb(p, q, H + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, H) * 255);
    const b = Math.round(hue2rgb(p, q, H - 1 / 3) * 255);

    return new Color(r, g, b, a);
  }

  /**
   * Creates a new Color from HSV values.
   *
   * @param h The hue of the color, in degrees [0..360).
   * @param s The saturation of the color, as a fraction 0..1 or percent 0..100.
   * @param v The value of the color, as a fraction 0..1 or percent 0..100.
   * @param a The alpha component of the color, from 0 to 1.
   * @returns A new Color.
   */
  static fromHSV(h: number, s: number, v: number, a: number = 1): Color {
    const H = ((h % 360) + 360) % 360;
    const S = s > 1 ? s / 100 : s;
    const V = v > 1 ? v / 100 : v;

    if (S === 0) {
      const val = Math.round(V * 255);
      return new Color(val, val, val, a);
    }

    const hh = H / 60;
    const i = Math.floor(hh);
    const f = hh - i;
    const p = V * (1 - S);
    const q = V * (1 - S * f);
    const t = V * (1 - S * (1 - f));

    let r = 0,
      g = 0,
      b = 0;
    switch (i % 6) {
      case 0:
        r = V;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = V;
        b = p;
        break;
      case 2:
        r = p;
        g = V;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = V;
        break;
      case 4:
        r = t;
        g = p;
        b = V;
        break;
      case 5:
        r = V;
        g = p;
        b = q;
        break;
    }

    return new Color(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      a,
    );
  }

  static fromString(s: string): Color {
    const str = s.trim();
    const lower = str.toLowerCase();

    if (
      lower === "currentcolor" ||
      lower === "inherit" ||
      lower === "initial" ||
      lower === "unset"
    ) {
      throw new Error(`Dynamic color keywords not supported: "${s}"`);
    }

    // Try hex
    if (str.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(str)) {
      try {
        return Color.fromHex(str);
      } catch (e) {
        // Fall through if it's not a valid hex
      }
    }

    // Try rgb/rgba
    let match = str.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/,
    );
    if (match) {
      return new Color(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] !== undefined ? Number(match[4]) : 1,
      );
    }

    // Try hsl/hsla
    match = str.match(
      /^hsla?\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/,
    );
    if (match) {
      return Color.fromHSL(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] !== undefined ? Number(match[4]) : 1,
      );
    }

    // Try named colors
    const namedColor = NAMED_COLORS[lower];
    if (namedColor) {
      return new Color(namedColor[0], namedColor[1], namedColor[2]);
    }

    if (lower === "transparent") {
      return new Color(0, 0, 0, 0);
    }

    throw new Error(`Failed to parse color string: "${s}"`);
  }

  // --- Helpers ----------------------------------------------------------
  /**
   * Converts the color to a CSS string.
   *
   * @returns A CSS string representation of the color.
   */
  toCSS(): string {
    if (this.a >= 1) {
      return `rgb(${this.r}, ${this.g}, ${this.b})`;
    } else {
      // keep alpha as float
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
  }

  /**
   * Converts the color to a hex string.
   *
   * @param includeAlpha Whether to include the alpha component in the hex string.
   * @returns A hex string representation of the color.
   */
  toHex(includeAlpha = false): string {
    const comp = (v: number) => v.toString(16).padStart(2, "0");
    if (includeAlpha) {
      const alpha = Math.round(this.a * 255);
      return `#${comp(this.r)}${comp(this.g)}${comp(this.b)}${comp(alpha)}`;
    }
    return `#${comp(this.r)}${comp(this.g)}${comp(this.b)}`;
  }

  /**
   * Creates a new color with the same RGB values but a different alpha value.
   *
   * @param a The new alpha value.
   * @returns A new color with the new alpha value.
   */
  withAlpha(a: number): Color {
    return new Color(this.r, this.g, this.b, a);
  }

  // --- internal utils --------------------------------------------------
  private static _clampInt(v: number): number {
    return Math.round(Math.min(255, Math.max(0, v)));
  }
  private static _clamp01(v: number): number {
    return Math.min(1, Math.max(0, v));
  }
}
