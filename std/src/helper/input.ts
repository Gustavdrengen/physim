/**
 * Wraps the global prompt function to provide a simple input mechanism.
 * 
 * @param message The message to display to the user.
 * @param defaultValue The default value of the prompt.
 * @returns The string entered by the user, or null if they cancelled.
 */
export function prompt(message: string, defaultValue?: string): string | null {
  return window.prompt(message, defaultValue);
}

/**
 * Allows the user to select an item from an array of options.
 * This is implemented using a simple text-based prompt.
 * 
 * @param message The message to display.
 * @param options An array of options to choose from.
 * @returns The selected option, or null if cancelled or invalid.
 */
export function select<T>(message: string, options: T[]): T | null {
  const optionsText = options
    .map((option, index) => `${index + 1}. ${String(option)}`)
    .join("\n");
    
  const fullMessage = `${message}\n\n${optionsText}\n\nEnter the number of your choice:`;
  const result = prompt(fullMessage);
  
  if (result === null) return null;
  
  const choice = parseInt(result.trim(), 10);
  if (isNaN(choice) || choice < 1 || choice > options.length) {
    return null;
  }
  
  return options[choice - 1];
}
