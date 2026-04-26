/**
 * This module provides simple input utilities.
 *
 * @example
 * ```ts
 * import { prompt, select, initGUI, setupGUIInput } from 'physim/input';
 *
 * const name = prompt('Enter your name:');
 * const color = select('Choose a color:', ['red', 'green', 'blue']);
 * ```
 *
 * @module
 */

export * from '../helper/input.ts';
export * from '../helper/gui.ts';