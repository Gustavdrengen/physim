import esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";
import { typeCheck } from "./tsc.ts";
import { fail, failed, InputFailureTag, Result } from "../err.ts";
const scriptDir = dirname(fromFileUrl(import.meta.url));

const aliasPlugin = {
  name: "physim-alias",
  setup(build: any) {
    build.onResolve({ filter: /^physim(\/.*)?$/ }, (args: any) => {
      const subpath = args.path.replace(/^physim\//, "");
      const target = join(
        scriptDir,
        "..",
        "..",
        "..",
        "std",
        "src",
        "public",
        `${subpath}.ts`,
      );

      return { path: target };
    });
  },
};

function createProfilingPlugin(profiling: boolean) {
  return {
    name: "profiling-transform",
    setup(build: any) {
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: any) => {
        let contents = await Deno.readTextFile(args.path);
        contents = transformProfilingComments(contents, profiling);
        return { contents, loader: args.path.endsWith(".ts") ? "ts" : "js" };
      });
    },
  };
}

export async function buildSimulation(
  entrypoint: string,
  outfile: string,
  profiling: boolean,
): Promise<Result<undefined>> {
  const check = await typeCheck(entrypoint);
  if (failed(check)) {
    return check;
  }

  await esbuild.build({
    entryPoints: [entrypoint],
    bundle: true,
    outfile,
    platform: "browser",
    format: "esm",
    sourcemap: true,
    treeShaking: true,
    minify: false,
    plugins: [aliasPlugin, createProfilingPlugin(profiling)],
  });
}

function transformProfilingComments(code: string, enabled: boolean): string {
  let result = code;
  
  if (enabled) {
    result = transformProfileFunctions(result, true);
    
    result = result.replace(
      /\/\/\s*@profile-start\s+"([^"]+)"[ \t]*\r?\n/g,
      'sim.__PROFILE_ENTER("$1");\n'
    );
    
    result = result.replace(
      /\/\/\s*@profile-end[ \t]*\r?\n/g,
      'sim.__PROFILE_EXIT();\n'
    );
  } else {
    result = transformProfileFunctions(result, false);
    result = result.replace(/\/\/\s*@profile\s+"[^"]+"\s*\r?\n/g, '');
    result = result.replace(/\/\/\s*@profile-start\s+"[^"]+"\s*\r?\n/g, '');
    result = result.replace(/\/\/\s*@profile-end\s*\r?\n/g, '');
  }
  
  return result;
}

function transformProfileFunctions(code: string, enabled: boolean): string {
  const profileCommentRegex = /\/\/\s*@profile\s+"([^"]+)"\s*\r?\n/g;
  
  let match;
  const matches: Array<{ comment: string; label: string; index: number; funcStart: number; bracePos: number }> = [];
  
  while ((match = profileCommentRegex.exec(code)) !== null) {
    const commentStart = match.index;
    const commentEnd = commentStart + match[0].length;
    
    const afterComment = code.slice(commentEnd);
    const funcDeclMatch = afterComment.match(/^(\s*)(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)/m);
    
    if (funcDeclMatch && funcDeclMatch.index !== undefined && match[1]) {
      const sigEnd = commentEnd + funcDeclMatch.index + funcDeclMatch[0].length;
      const afterSig = code.slice(sigEnd);
      
      let bracePos = sigEnd;
      let inReturnType = false;
      
      for (let i = 0; i < afterSig.length && bracePos < code.length; i++) {
        const char = afterSig[i];
        bracePos++;
        
        if (char === ':') {
          inReturnType = true;
        } else if (char === '{') {
          if (inReturnType) {
            let depth = 1;
            i++;
            bracePos++;
            while (i < afterSig.length && depth > 0) {
              if (afterSig[i] === '{') depth++;
              else if (afterSig[i] === '}') depth--;
              i++;
              bracePos++;
            }
            inReturnType = false;
          } else {
            break;
          }
        } else if (char === '\n' && !inReturnType) {
          break;
        }
      }
      
      if (bracePos < code.length && code[bracePos] === '{') {
        matches.push({
          comment: match[0],
          label: match[1],
          index: commentStart,
          funcStart: commentEnd,
          bracePos,
        });
      }
    }
  }
  
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]!;
    const openBrace = m.bracePos;
    
    let braceCount = 1;
    let closeBrace = openBrace + 1;
    
    while (braceCount > 0 && closeBrace < code.length) {
      const char = code[closeBrace];
      const isEscaped = closeBrace > 0 && code[closeBrace - 1] === '\\';
      
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        closeBrace++;
        while (closeBrace < code.length && code[closeBrace] !== quote) {
          if (code[closeBrace] === '\\' && closeBrace + 1 < code.length) {
            closeBrace++;
          }
          closeBrace++;
        }
      } else if (char === '{' && !isEscaped) {
        braceCount++;
      } else if (char === '}' && !isEscaped) {
        braceCount--;
      }
      
      if (braceCount > 0) {
        closeBrace++;
      }
    }
    
    if (enabled) {
      const beforeBrace = code.slice(0, openBrace + 1);
      const afterBrace = code.slice(openBrace + 1, closeBrace);
      const rest = code.slice(closeBrace);
      
      code = beforeBrace + '\n  sim.__PROFILE_ENTER("' + m.label + '");' + afterBrace + '\n  sim.__PROFILE_EXIT();' + rest;
    } else {
      const beforeComment = code.slice(0, m.index);
      const afterFunc = code.slice(closeBrace + 1);
      code = beforeComment + afterFunc;
    }
  }
  
  return code;
}
