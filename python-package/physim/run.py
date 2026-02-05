"""
Python wrapper for running physim scripts.
"""
from dataclasses import dataclass
from ._internal import _run_physim_command


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


def run_script(
    filepath: str, raw: bool = False, video_output_path: str | None = None
) -> PhysimResult:
    """
    Run a physim script and capture its output.

    Args:
        filepath: Path to the TypeScript file to run
        raw: Whether to use --raw flag for machine-parsable output
        video_output_path: Optional path to save a video of the simulation.

    Returns:
        PhysimResult containing exit code and output
    """
    args = ["run"]
    if raw:
        args.append("--raw")
    if video_output_path:
        args.extend(["--record", video_output_path])
    args.append(filepath)
    exit_code, stdout, stderr = _run_physim_command(args)
    return PhysimResult(exit_code=exit_code, stdout=stdout, stderr=stderr)
