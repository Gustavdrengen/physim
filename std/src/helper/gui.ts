export interface SliderConfig {
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

export interface ToggleConfig {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface GUIPanelOptions {
  title?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class GUIPanel {
  readonly container: HTMLElement;
  private position: string;

  constructor(options: GUIPanelOptions = {}) {
    this.position = options.position || 'top-left';

    this.container = sim.document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      ${this.position === 'top-left' || this.position === 'bottom-left' ? 'left' : 'right'}: 20px;
      ${this.position === 'top-left' || this.position === 'top-right' ? 'top' : 'bottom'}: 20px;
      background: rgba(20, 20, 30, 0.95);
      border: 1px solid rgba(100, 100, 120, 0.3);
      border-radius: 12px;
      padding: 16px;
      min-width: 240px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #e0e0e0;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    if (options.title) {
      const title = sim.document.createElement('h3');
      title.textContent = options.title;
      title.style.cssText = 'margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #fff;';
      this.container.appendChild(title);
    }

    if (sim.document.body) {
      sim.document.body.appendChild(this.container);
    } else {
      sim.document.addEventListener('DOMContentLoaded', () => {
        sim.document.body.appendChild(this.container);
      });
    }
  }

  addSlider(config: SliderConfig): HTMLInputElement {
    const wrapper = sim.document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 14px;';

    const label = sim.document.createElement('label');
    label.style.cssText = 'display: block; margin-bottom: 6px; font-size: 13px; color: #b0b0b0;';
    label.textContent = `${config.label}: ${config.value.toFixed(2)}`;

    const slider = sim.document.createElement('input');
    slider.type = 'range';
    slider.min = String(config.min);
    slider.max = String(config.max);
    slider.step = String(config.step ?? 0.01);
    slider.value = String(config.value);
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: rgba(60, 60, 80, 0.8);
      border-radius: 3px;
      outline: none;
    `;

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      label.textContent = `${config.label}: ${value.toFixed(2)}`;
      config.onChange(value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(slider);
    this.container.appendChild(wrapper);
    return slider;
  }

  addToggle(config: ToggleConfig): HTMLButtonElement {
    const wrapper = sim.document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 14px; display: flex; align-items: center; gap: 10px;';

    const btn = sim.document.createElement('button');
    btn.textContent = config.label;
    btn.style.cssText = `
      padding: 8px 14px;
      background: ${config.value ? 'rgba(80, 180, 80, 0.8)' : 'rgba(80, 80, 80, 0.8)'};
      border: 1px solid ${config.value ? 'rgba(100, 200, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'};
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    `;

    btn.addEventListener('click', () => {
      config.value = !config.value;
      btn.style.background = config.value ? 'rgba(80, 180, 80, 0.8)' : 'rgba(80, 80, 80, 0.8)';
      btn.style.borderColor = config.value ? 'rgba(100, 200, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)';
      config.onChange(config.value);
    });

    wrapper.appendChild(btn);
    this.container.appendChild(wrapper);
    return btn;
  }

  addButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = sim.document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px 14px;
      margin-bottom: 10px;
      background: rgba(70, 130, 180, 0.8);
      border: 1px solid rgba(100, 160, 200, 0.4);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(80, 150, 200, 0.9)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(70, 130, 180, 0.8)';
    });

    btn.addEventListener('click', onClick);
    this.container.appendChild(btn);
    return btn;
  }

  addSeparator(): void {
    const sep = sim.document.createElement('hr');
    sep.style.cssText = 'border: none; border-top: 1px solid rgba(100,100,120,0.3); margin: 12px 0;';
    this.container.appendChild(sep);
  }

  remove(): void {
    this.container.remove();
  }
}

let panel: GUIPanel | null = null;

export function initGUI(title?: string, position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): GUIPanel {
  panel = new GUIPanel({ title, position });
  return panel;
}

export function getGUI(): GUIPanel | null {
  return panel;
}

export function setupGUIInput(): void {
  // HTML GUI doesn't need mouse tracking like canvas version
}