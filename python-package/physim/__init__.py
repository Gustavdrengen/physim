"""
Python wrapper for physim.
"""

from .run import PhysimResult, run_script
from .docs import generate_markdown_docs, get_docs_path
from ._internal import _run_physim_command

__all__ = [
    "PhysimResult",
    "run_script",
    "generate_markdown_docs",
    "get_docs_path",
    "init_project",
]


def init_project(directory: str) -> None:
    """
    Initialize a new physim project in a directory.

    Args:
        directory: The path to the directory.

    Raises:
        RuntimeError: If the physim init command fails.
    """
    exit_code, stdout, stderr = _run_physim_command(["init"], cwd=directory)
    if exit_code != 0:
        raise RuntimeError(
            f"Failed to initialize physim project in {directory}.\nStdout: {stdout}\nStderr: {stderr}"
        )