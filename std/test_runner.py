#!/usr/bin/env python3
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from physim import PhysimResult, run_script

# ANSI color codes
RESET = "\033[0m"
GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
GRAY = "\033[90m"

# Emojis
WAITING = "⏳"
PASS = "✅"
FAIL = "❌"
ERROR = "💥"


@dataclass
class TestMessage:
    type: str
    name: str
    error: Optional[str] = None


@dataclass
class TestResult:
    filepath: str
    tests: List[TestMessage]
    physim_result: PhysimResult
    system_error: Optional[str] = None


def discover_tests(directory: str = "tests") -> List[str]:
    test_dir = Path(directory)
    if not test_dir.exists():
        return []

    return sorted([str(f) for f in test_dir.glob("*.test.ts")])


def parse_test_messages(stdout: str) -> List[TestMessage]:
    messages = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if isinstance(data, dict) and "type" in data:
                messages.append(
                    TestMessage(
                        type=data["type"],
                        name=data.get("name", "unknown"),
                        error=data.get("error"),
                    )
                )
        except json.JSONDecodeError:
            pass
    return messages


def run_test_file(filepath: str) -> TestResult:
    result = run_script(filepath, raw=True)

    if result.is_system_failure:
        return TestResult(
            filepath=filepath,
            tests=[],
            physim_result=result,
            system_error=result.stderr or "System failure",
        )

    tests = parse_test_messages(result.stdout)

    return TestResult(
        filepath=filepath,
        tests=tests,
        physim_result=result,
        system_error=None if result.success else result.stderr,
    )


class TestDisplay:
    def __init__(self, test_files: List[str]):
        self.test_files = test_files
        self.results: dict[str, TestResult] = {}
        self.file_line_map: dict[str, int] = {}

    def print_initial(self):
        print(f"\n{YELLOW}Running {len(self.test_files)} test files...{RESET}\n")
        for i, filepath in enumerate(self.test_files):
            print(f"{WAITING} {filepath}")
            self.file_line_map[filepath] = i

    def update_test(self, filepath: str, result: TestResult):
        self.results[filepath] = result
        start_line = self.file_line_map[filepath]

        # Move cursor to file line (add 3 for the header lines)
        print(f"\033[{len(self.test_files) - start_line}A\033[0G", end="")

        # Determine file status
        if result.system_error:
            file_status = ERROR
            color = RED
        else:
            passed = all(t.type == "test_pass" for t in result.tests)
            file_status = PASS if passed and result.tests else FAIL
            color = GREEN if file_status == PASS else RED

        # Clear and print file status
        print(f"\033[2K{file_status} {color}{filepath}{RESET}")

        # Print each test
        for test in result.tests:
            status = PASS if test.type == "test_pass" else FAIL
            print(f"  {status} {test.name}")

        # Move cursor back down
        remaining = len(self.test_files) - start_line - 1
        if remaining > 0:
            print(f"\033[{remaining}B\033[0G", end="", flush=True)

    def finish(self):
        # Ensure we're at the bottom
        print()

        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        system_errors = 0

        for result in self.results.values():
            if result.system_error:
                system_errors += 1
            else:
                for test in result.tests:
                    total_tests += 1
                    if test.type == "test_pass":
                        passed_tests += 1
                    else:
                        failed_tests += 1

        print(f"\n{GRAY}{'─' * 60}{RESET}")
        print(
            f"{GREEN}{passed_tests} passed{RESET}, {RED}{failed_tests} failed{RESET}, {total_tests} total"
        )
        if system_errors > 0:
            print(f"{RED}{system_errors} system errors{RESET}")

        for filepath, result in self.results.items():
            if result.system_error:
                print(f"\n{RED}System Error in {filepath}:{RESET}")
                print(f"{GRAY}{result.system_error}{RESET}")
            else:
                failed = [t for t in result.tests if t.type == "test_fail"]
                if failed:
                    print(f"\n{RED}Failed tests in {filepath}:{RESET}")
                    for test in failed:
                        print(f"  {FAIL} {test.name}")
                        if test.error:
                            print(f"    {GRAY}{test.error}{RESET}")

        return failed_tests + system_errors


def main():
    test_files = discover_tests()

    if not test_files:
        print(f"{YELLOW}No test files found in tests/ directory{RESET}")
        sys.exit(0)

    display = TestDisplay(test_files)
    display.print_initial()

    with ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(run_test_file, filepath): filepath
            for filepath in test_files
        }

        for future in as_completed(futures):
            filepath = futures[future]
            try:
                result = future.result()
                display.update_test(filepath, result)
            except Exception as e:
                error_result = TestResult(
                    filepath=filepath,
                    tests=[],
                    physim_result=PhysimResult(exit_code=-1, stdout="", stderr=""),
                    system_error=f"Unexpected error: {e}",
                )
                display.update_test(filepath, error_result)

    failures = display.finish()
    sys.exit(0 if failures == 0 else 1)


if __name__ == "__main__":
    main()
