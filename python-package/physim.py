"""
Low-level wrapper for running physim scripts.
"""

import subprocess
from dataclasses import dataclass


@dataclass
class PhysimResult:
    """Result from running a physim script."""

    exit_code: int
    stdout: str
    stderr: str

    @property
    def is_system_failure(self) -> bool:
        """Check if this was a system-level failure (exit codes 65, 69, 70)."""
        return self.exit_code in (65, 69, 70)

    @property
    def success(self) -> bool:
        """Check if the script ran successfully."""
        return self.exit_code == 0


def run_script(filepath: str, raw: bool = False) -> PhysimResult:
    """
    Run a physim script and capture its output.

    Args:
        filepath: Path to the TypeScript file to run
        raw: Whether to use --raw flag for machine-parsable output

    Returns:
        PhysimResult containing exit code and output
    """
    cmd = ["physim", "run"]
    if raw:
        cmd.append("--raw")
    cmd.append(filepath)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return PhysimResult(
            exit_code=result.returncode, stdout=result.stdout, stderr=result.stderr
        )
    except FileNotFoundError:
        # physim command not found
        return PhysimResult(
            exit_code=-1,
            stdout="",
            stderr="physim command not found. Is it installed and in PATH?",
        )
    except Exception as e:
        # Other unexpected errors
        return PhysimResult(
            exit_code=-1, stdout="", stderr=f"Unexpected error running physim: {e}"
        )
