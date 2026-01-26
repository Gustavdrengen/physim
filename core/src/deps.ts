import { Confirm, prompt, Select } from "@cliffy/prompt";
import * as print from "./print.ts";

const decoder = new TextDecoder();

async function run(cmd: string, args: string[] = [], cwd?: string) {
  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, code, stdout, stderr } = await command.output();
  return {
    success,
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
}

export interface Dependency {
  name: string;
  checkCommand: string;
  checkArgs?: string[];
  installCommand: string;
  installArgs?: string[];
  installMethod: "npm" | "deno" | "manual";
  manualInstallInstructions?: string;
}

export const dependencies: Dependency[] = [
  {
    name: "tsc",
    checkCommand: "tsc",
    checkArgs: ["--version"],
    installCommand: "npm",
    installArgs: ["install", "-g", "typescript"],
    installMethod: "npm",
  },
  {
    name: "deno",
    checkCommand: "deno",
    checkArgs: ["--version"],
    installCommand: "manual", // Deno installation is usually system-specific
    installMethod: "manual",
    manualInstallInstructions: "Please install Deno manually from https://deno.land/#installation",
  },
  {
    name: "typedoc",
    checkCommand: "typedoc",
    checkArgs: ["--version"],
    installCommand: "npm",
    installArgs: ["install", "-g", "typedoc"],
    installMethod: "npm",
  },
  {
    name: "typedoc-plugin-markdown",
    checkCommand: "npm", // Check if it's installed globally via npm list
    checkArgs: ["list", "-g", "typedoc-plugin-markdown"],
    installCommand: "npm",
    installArgs: ["install", "-g", "typedoc-plugin-markdown"],
    installMethod: "npm",
  },
  {
    name: "ffmpeg",
    checkCommand: "ffmpeg",
    checkArgs: ["-version"],
    installCommand: "manual", // ffmpeg installation is usually system-specific
    installMethod: "manual",
    manualInstallInstructions:
      "Please install FFmpeg manually. On Debian/Ubuntu: `sudo apt install ffmpeg`. On macOS: `brew install ffmpeg`.",
  },
];

export async function checkDependency(dep: Dependency): Promise<boolean> {
  if (dep.name === "typedoc-plugin-markdown") {
    // Special check for npm global packages
    const result = await run(dep.checkCommand, dep.checkArgs);
    return result.stdout.includes("typedoc-plugin-markdown");
  }
  try {
    const result = await run(dep.checkCommand, dep.checkArgs);
    return result.success;
  } catch (_) {
    return false;
  }
}

export async function installDependency(dep: Dependency): Promise<boolean> {
  if (dep.installMethod === "manual") {
    print.raw(`Manual installation required for ${dep.name}:`);
    print.raw(dep.manualInstallInstructions!);
    return false;
  }

  const result = await prompt([
    {
      name: "confirm",
      message: `"${dep.name}" is not installed. Install it via "${dep.installCommand} ${
        dep.installArgs?.join(
          " ",
        )
      }"?`,
      type: Confirm,
      default: true,
    },
  ]);

  if (!result.confirm) return false;

  print.raw(`Installing ${dep.name}...`);
  const install = await run(dep.installCommand, dep.installArgs);
  if (install.success) {
    print.raw(`${dep.name} installed successfully.`);
  } else {
    print.raw(`Failed to install ${dep.name}:`);
    print.raw(install.stderr || install.stdout);
  }
  return install.success;
}

export async function checkAllDependencies(): Promise<boolean> {
  let allInstalled = true;
  for (const dep of dependencies) {
    const installed = await checkDependency(dep);
    if (!installed) {
      console.error(`Dependency "${dep.name}" is not installed.`);
      allInstalled = false;
    }
  }
  return allInstalled;
}

export async function manageDependenciesTUI(): Promise<void> {
  print.raw("\n--- Dependency Manager ---");
  for (const dep of dependencies) {
    const installed = await checkDependency(dep);
    const status = installed ? "✅ Installed" : "❌ Not Installed";
    print.raw(`- ${dep.name}: ${status}`);
  }

  const result = await prompt([
    {
      name: "action",
      message: "Choose an action:",
      type: Select,
      options: [
        { name: "Install missing dependencies", value: "install_missing" },
        { name: "Show manual installation instructions", value: "show_manual" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);

  switch (result.action) {
    case "install_missing":
      for (const dep of dependencies) {
        const installed = await checkDependency(dep);
        if (!installed) {
          await installDependency(dep);
        }
      }
      break;
    case "show_manual":
      print.raw("\n--- Manual Installation Instructions ---");
      for (const dep of dependencies) {
        if (dep.installMethod === "manual") {
          print.raw(`- ${dep.name}: ${dep.manualInstallInstructions}`);
        }
      }
      break;
    case "exit":
      break;
  }
  print.raw("--- Dependency Manager Exited ---");
}
