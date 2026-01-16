#!/usr/bin/env python3
"""
Test runner for physim TypeScript tests.
"""
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
    """Parsed message from a test."""

    type: str
    name: str
    error: Optional[str] = None


@dataclass
class TestResult:
    """Result of running a single test file."""

    filepath: str
    tests: List[TestMessage]
    physim_result: PhysimResult
    system_error: Optional[str] = None


def discover_tests(directory: str = "tests") -> List[str]:
    """
    Discover all test.ts files in the given directory (non-recursive).

    Args:
        directory: Directory to search for tests

    Returns:
        List of test file paths
    """
    test_dir = Path(directory)
    if not test_dir.exists():
        return []

    return sorted([str(f) for f in test_dir.glob("*.test.ts")])


def parse_test_messages(stdout: str) -> List[TestMessage]:
    """
    Parse JSON test messages from stdout.

    Args:
        stdout: Raw stdout from physim

    Returns:
        List of parsed test messages
    """
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
            # Not a JSON line, skip it
            pass
    return messages


def run_test_file(filepath: str) -> TestResult:
    """
    Run a single test file.

    Args:
        filepath: Path to the test file

    Returns:
        TestResult with all test outcomes
    """
    result = run_script(filepath, raw=True)

    # Check for system failures
    if result.is_system_failure:
        return TestResult(
            filepath=filepath,
            tests=[],
            physim_result=result,
            system_error=result.stderr or "System failure",
        )

    # Parse test messages
    tests = parse_test_messages(result.stdout)

    return TestResult(
        filepath=filepath,
        tests=tests,
        physim_result=result,
        system_error=None if result.success else result.stderr,
    )


class TestDisplay:
    """Manages the terminal display of test results, showing each test under its file."""

    def __init__(self, test_files: List[str]):
        self.test_files = test_files
        self.results: dict[str, TestResult] = {}
        self.current_line = 0
        self.file_line_map: dict[str, int] = (
            {}
        )  # maps file to starting line in terminal

    def print_initial(self):
        """Print initial test list with waiting status and prepare line mapping."""
        print(f"\n{YELLOW}Running {len(self.test_files)} test files...{RESET}\n")
        line_counter = 0
        for filepath in self.test_files:
            print(f"{WAITING} {filepath}")
            self.file_line_map[filepath] = line_counter
            line_counter += 1
        # Move cursor back up
        print(f"\033[{line_counter}A", end="", flush=True)

    def update_test(self, filepath: str, result: TestResult):
        """Update display: show the file and all its tests on separate lines."""
        self.results[filepath] = result
        start_line = self.file_line_map[filepath]

        # Move cursor to file line
        print(f"\033[{start_line + 1}G", end="")

        # Determine file status
        if result.system_error:
            file_status = ERROR
            color = RED
        else:
            passed = all(t.type == "test_pass" for t in result.tests)
            file_status = PASS if passed and result.tests else FAIL
            color = GREEN if file_status == PASS else RED

        # Clear file line and print file status
        print(f"\033[2K{file_status} {color}{filepath}{RESET}", flush=True)

        # Print each individual test under the file
        for i, test in enumerate(result.tests, 1):
            # Move cursor to the correct line
            print(f"\033[{start_line + i + 1}G", end="")
            status = PASS if test.type == "test_pass" else FAIL
            print(f"\033[2K  {status} {test.name}{RESET}", flush=True)

        # Move cursor back below last printed test
        total_lines = len(result.tests)
        print(f"\033[{total_lines}B", end="", flush=True)

    def finish(self):
        """Move cursor to bottom and print summary and failures."""
        print(f"\033[{len(self.test_files)}B")

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

        # Print summary
        print(f"\n{GRAY}{'─' * 60}{RESET}")
        print(
            f"{GREEN}{passed_tests} passed{RESET}, {RED}{failed_tests} failed{RESET}, {total_tests} total"
        )
        if system_errors > 0:
            print(f"{RED}{system_errors} system errors{RESET}")

        # Detailed failures
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
    """Main entry point for the test runner."""
    # Discover tests
    test_files = discover_tests()

    if not test_files:
        print(f"{YELLOW}No test files found in tests/ directory{RESET}")
        sys.exit(0)

    # Initialize display
    display = TestDisplay(test_files)
    display.print_initial()

    # Run tests in parallel
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
                # Handle unexpected errors
                error_result = TestResult(
                    filepath=filepath,
                    tests=[],
                    physim_result=PhysimResult(exit_code=-1, stdout="", stderr=""),
                    system_error=f"Unexpected error: {e}",
                )
                display.update_test(filepath, error_result)

    # Print summary and exit
    failures = display.finish()
    sys.exit(0 if failures == 0 else 1)


if __name__ == "__main__":
    main()
