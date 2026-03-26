#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

# --- Configuration ---
SRC_ROOTS = [Path("src/public"), Path("src/base")]
TESTS_DIR = Path("tests")
IGNORE_TEST_FILES = {"tests/exampleTest.test.ts"}
IGNORE_SRC_TEST_CHECK = {"src/public/base.ts"}

# --- Colors ---
RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[0;33m"
NC = "\033[0m"

def print_error(msg):
    print(f"{RED}Error: {msg}{NC}")

def print_success(msg):
    print(f"{GREEN}{msg}{NC}")

def get_exports(file_path: Path):
    """
    Extracts exported entities from a TypeScript file.
    Handles:
    - export function/class/const/let/var/interface/type/enum
    - export { a, b as c }
    - Resolves re-exports: export * from "..." and export { ... } from "..."
    """
    exports = set()
    if not file_path.exists():
        return exports

    content = file_path.read_text()

    # 1. Simple direct exports: export keyword followed by type and name
    # e.g., export class MyClass, export function myFunc, export const myConst
    # We want to catch the name.
    direct_pattern = re.compile(r'^export\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([a-zA-Z0-9_]+)', re.MULTILINE)
    for match in direct_pattern.finditer(content):
        exports.add(match.group(1))

    # 2. Named exports: export { name1, name2 as alias }
    named_pattern = re.compile(r'^export\s*\{([^}]+)\}(?!\s*from)', re.MULTILINE)
    for match in named_pattern.finditer(content):
        items = match.group(1).split(',')
        for item in items:
            item = item.strip()
            if not item: continue
            # Handle "name as alias"
            name = item.split(' as ')[-1].strip()
            exports.add(name)

    # 3. Re-exports: export * from "..." and export { ... } from "..."
    # This is crucial for the public API files.
    reexport_pattern = re.compile(r'^export\s+(?:\*|\{([^}]+)\})\s+from\s+["\']([^"\']+)["\']', re.MULTILINE)
    for match in reexport_pattern.finditer(content):
        named_items_str = match.group(1)
        module_path_str = match.group(2)

        # Resolve the module path relative to the current file
        # Standard library paths are likely relative: "../base/display.ts"
        # We need to handle both with and without extension.
        resolved_path = (file_path.parent / module_path_str).resolve()
        if not resolved_path.suffix:
            # Try .ts then /index.ts if needed, but project seems to use explicit .ts usually
            if resolved_path.with_suffix(".ts").exists():
                resolved_path = resolved_path.with_suffix(".ts")
            elif (resolved_path / "index.ts").exists():
                resolved_path = resolved_path / "index.ts"
        
        if resolved_path.exists():
            if named_items_str:
                # export { a, b as c } from "..."
                items = named_items_str.split(',')
                for item in items:
                    item = item.strip()
                    if not item: continue
                    name = item.split(' as ')[-1].strip()
                    exports.add(name)
            else:
                # export * from "..."
                exports.update(get_exports(resolved_path))
        else:
            # If it's a package import (no leading dot), we skip for now as per library rules
            pass

    return exports

def check_coverage():
    print("Checking test coverage...")
    errors_found = False

    # --- 1. File Structure Check ---
    print("Checking file structure...")
    
    src_files = []
    for root in SRC_ROOTS:
        src_files.extend(list(root.glob("**/*.ts")))

    for src_file in src_files:
        src_file_str = str(src_file).replace("\\", "/")
        if src_file_str in IGNORE_SRC_TEST_CHECK:
            continue

        # Find which root it belongs to
        root = None
        for r in SRC_ROOTS:
            try:
                src_file.relative_to(r)
                root = r
                break
            except ValueError:
                continue
        
        if not root:
            continue

        relative_path = src_file.relative_to(root)
        name_no_ext = relative_path.with_suffix("")
        
        direct_test = TESTS_DIR / f"{name_no_ext}.test.ts"
        test_dir = TESTS_DIR / name_no_ext
        
        has_tests = False
        if direct_test.exists():
            has_tests = True
        elif test_dir.is_dir() and any(test_dir.glob("*.test.ts")):
            has_tests = True
            
        if not has_tests:
            print_error(f"Missing test file(s) for {src_file}. Expected {direct_test} or test files in {test_dir}/.")
            errors_found = True

    # --- 2. Extra Test Files Check ---
    for test_file in TESTS_DIR.glob("**/*.test.ts"):
        test_file_str = str(test_file).replace("\\", "/")
        if test_file_str in IGNORE_TEST_FILES:
            continue
            
        rel_test = test_file.relative_to(TESTS_DIR)
        
        found_src = False
        for root in SRC_ROOTS:
            # Case A: tests/folder/file.test.ts -> src/public/folder/file.ts
            potential_src_direct = root / rel_test.parent / f"{rel_test.name.replace('.test.ts', '.ts')}"
            # Case B: tests/folder/something.test.ts -> src/public/folder.ts (where folder is a file split into tests)
            potential_src_parent = root / f"{rel_test.parent}.ts"
            
            if potential_src_direct.exists() or potential_src_parent.exists():
                found_src = True
                break
        
        if not found_src:
             print_error(f"Extra test file found: {test_file}. No corresponding source file found.")
             errors_found = True

    if errors_found:
        print(f"{RED}File structure check failed!{NC}")
        sys.exit(1)
    
    print_success("Test file structure is correct.")

    # --- 3. Export Coverage Check ---
    print("Checking export coverage...")
    for src_file in src_files:
        # Find which root it belongs to
        root = None
        for r in SRC_ROOTS:
            try:
                src_file.relative_to(r)
                root = r
                break
            except ValueError:
                continue
        
        if not root:
            continue

        relative_path = src_file.relative_to(root)
        name_no_ext = relative_path.with_suffix("")
        
        # Collect all relevant test files
        relevant_tests = []
        direct_test = TESTS_DIR / f"{name_no_ext}.test.ts"
        if direct_test.exists():
            relevant_tests.append(direct_test)
        
        test_dir = TESTS_DIR / name_no_ext
        if test_dir.is_dir():
            relevant_tests.extend(list(test_dir.glob("*.test.ts")))
            
        if not relevant_tests:
            continue # Should have been caught by structure check
            
        exports = get_exports(src_file)
        if not exports:
            continue
            
        # Optimization: read all test contents once per source file
        test_contents = "\n".join(t.read_text() for t in relevant_tests)
        
        for export_name in sorted(exports):
            # Check if the export name appears as a word in any test file
            # Using word boundaries to avoid false positives (e.g. 'Body' in 'BodyPart')
            pattern = re.compile(rf'\b{re.escape(export_name)}\b')
            if not pattern.search(test_contents):
                relevant_test_strs = ", ".join(str(t) for t in relevant_tests)
                print_error(f"Export '{export_name}' in {src_file} is not mentioned in any of its corresponding test files ({relevant_test_strs}).")
                errors_found = True

    if errors_found:
        print(f"{RED}Not all exports are covered by tests! Get to work!{NC}")
        sys.exit(1)

    print_success("All exports are covered.")
    print_success("Coverage is 100%. Excellent!")

if __name__ == "__main__":
    # Ensure we are in the 'std' directory or adjust paths if needed
    # For simplicity, assuming the user runs this from 'std/' as per instructions
    check_coverage()
