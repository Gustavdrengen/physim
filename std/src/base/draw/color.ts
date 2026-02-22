const NAMED_COLORS: { [key: string]: [number, number, number] } = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50],
};

/**
 * A color class that can be used to represent colors in RGB, HSL, HSV and hex formats.
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
  static fromRGB(r: number, g: number, b: number, a: number = 1) {
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
  static fromHex(hex: string) {
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
  static fromHSL(h: number, s: number, l: number, a: number = 1) {
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
  static fromHSV(h: number, s: number, v: number, a: number = 1) {
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
   * Converts the col or to a CSS string.
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
  withAlpha(a: number) {
    return new Color(this.r, this.g, this.b, a);
  }

  // --- internal utils --------------------------------------------------
  private static _clampInt(v: number) {
    return Math.round(Math.min(255, Math.max(0, v)));
  }
  private static _clamp01(v: number) {
    return Math.min(1, Math.max(0, v));
  }
}
