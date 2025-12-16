export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = Color._clampInt(r);
    this.g = Color._clampInt(g);
    this.b = Color._clampInt(b);
    this.a = Color._clamp01(a);
  }

  // --- Factories ---------------------------------------------------------
  static fromRGB(r: number, g: number, b: number, a: number = 1) {
    return new Color(r, g, b, a);
  }

  /**
   * Accepts hex strings:
   * #RGB, #RRGGBB, #RGBA, #RRGGBBAA (with or without leading '#')
   */
  static fromHex(hex: string) {
    let s = hex.trim();
    if (s.startsWith("#")) s = s.slice(1);

    if (![3, 4, 6, 8].includes(s.length)) {
      throw new Error("Invalid hex length. Expected 3,4,6 or 8 hex digits.");
    }

    // Expand 3/4-digit forms to 6/8
    if (s.length === 3 || s.length === 4) {
      s = s.split("").map((ch) => ch + ch).join("");
    }

    // Now 6 or 8 chars
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;

    return new Color(r, g, b, a);
  }

  /**
   * h in degrees [0..360), s and l either as fraction 0..1 or percent 0..100
   */
  static fromHSL(h: number, s: number, l: number, a: number = 1) {
    // normalize
    const H = ((h % 360) + 360) % 360 / 360; // 0..1
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
   * HSV (Hue, Saturation, Value)
   * h degrees 0..360, s and v either 0..1 or 0..100
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

    let r = 0, g = 0, b = 0;
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

    return new Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a);
  }

  /**
   * Parse some common CSS-like strings:
   * - #RGB, #RRGGBB, #RGBA, #RRGGBBAA
   * - rgb(r,g,b) / rgba(r,g,b,a) (supports percent for r,g,b)
   * - hsl(h,s%,l%) / hsla(h,s%,l%,a)
   *
   * Returns a Color or throws on unsupported format.
   */
  static fromString(s: string): Color {
    const raw = s.trim();

    // hex
    if (raw.startsWith("#")) return Color.fromHex(raw);

    // rgb / rgba
    const rgbMatch = raw.match(/^rgba?\((.+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(",").map((p) => p.trim());
      if (parts.length === 3 || parts.length === 4) {
        const conv = (v: string) => {
          if (v.endsWith("%")) return Math.round(parseFloat(v) / 100 * 255);
          return Math.round(parseFloat(v));
        };
        const rr = conv(parts[0]);
        const gg = conv(parts[1]);
        const bb = conv(parts[2]);
        const aa = parts.length === 4 ? parseFloat(parts[3]) : 1;
        return new Color(rr, gg, bb, aa);
      }
    }

    // hsl / hsla
    const hslMatch = raw.match(/^hsla?\((.+)\)$/i);
    if (hslMatch) {
      const parts = hslMatch[1].split(",").map((p) => p.trim());
      if (parts.length === 3 || parts.length === 4) {
        const h = parseFloat(parts[0]);
        const s = parts[1].endsWith("%") ? parseFloat(parts[1]) : parseFloat(parts[1]);
        const l = parts[2].endsWith("%") ? parseFloat(parts[2]) : parseFloat(parts[2]);
        const a = parts.length === 4 ? parseFloat(parts[3]) : 1;
        return Color.fromHSL(h, s, l, a);
      }
    }

    throw new Error("Unsupported color string: " + s);
  }

  // --- Helpers ----------------------------------------------------------
  toCSS(): string {
    if (this.a >= 1) {
      return `rgb(${this.r}, ${this.g}, ${this.b})`;
    } else {
      // keep alpha as float
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
  }

  toHex(includeAlpha = false): string {
    const comp = (v: number) => v.toString(16).padStart(2, "0");
    if (includeAlpha) {
      const alpha = Math.round(this.a * 255);
      return `#${comp(this.r)}${comp(this.g)}${comp(this.b)}${comp(alpha)}`;
    }
    return `#${comp(this.r)}${comp(this.g)}${comp(this.b)}`;
  }

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
