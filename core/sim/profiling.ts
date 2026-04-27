interface ProfilingFrame {
  name: string;
  fullName: string;
  start: number;
}

interface ProfilingStat {
  total: number;
  calls: number;
  min: number;
  max: number;
  last: number;
  displayName: string;
}

class ProfilingSystem {
  enabled: boolean;
  stack: ProfilingFrame[];
  stats: Map<string, ProfilingStat>;

  constructor() {
    this.enabled = typeof globalThis.PROFILING !== 'undefined' && globalThis.PROFILING;
    this.stack = [];
    this.stats = new Map();
  }

  enter(name: string): void {
    if (!this.enabled) return;
    const parentName = this.stack.length > 0 ? this.stack[this.stack.length - 1]!.fullName : null;
    const fullName = parentName ? `${parentName} > ${name}` : name;
    this.stack.push({ name, fullName, start: performance.now() });
  }

  exit(): void {
    if (!this.enabled) return;
    if (this.stack.length === 0) {
      throw new Error(
        'Profiling error: __PROFILE_EXIT called without matching __PROFILE_ENTER',
      );
    }
    const frame = this.stack.pop()!;
    const duration = performance.now() - frame.start;

    let stat = this.stats.get(frame.fullName);
    if (!stat) {
      stat = {
        total: 0,
        calls: 0,
        min: Infinity,
        max: 0,
        last: 0,
        displayName: frame.name,
      };
      this.stats.set(frame.fullName, stat);
    }
    stat.total += duration;
    stat.calls++;
    stat.min = Math.min(stat.min, duration);
    stat.max = Math.max(stat.max, duration);
    stat.last = duration;
  }

  getStats(): Array<{ fullName: string } & ProfilingStat> {
    if (this.stack.length > 0) {
      const remaining = this.stack.map((s) => s.fullName).join(', ');
      throw new Error(
        `Profiling error: ${this.stack.length} unclosed profiling region(s) remain: ${remaining}`,
      );
    }
    const result: Array<{ fullName: string } & ProfilingStat> = [];
    for (const [fullName, stat] of this.stats) {
      result.push({ fullName, ...stat });
    }
    return result.sort((a, b) => b.total - a.total);
  }

  reset(): void {
    this.stats.clear();
    this.stack = [];
  }
}

export const __profiling = new ProfilingSystem();

declare global {
  const PROFILING: boolean;
}