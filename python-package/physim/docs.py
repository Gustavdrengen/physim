"""
Python wrapper for physim documentation commands.
"""

from ._internal import _run_physim_command


def generate_markdown_docs() -> None:
    """
    Generate markdown documentation for the standard library.

    Raises:
        RuntimeError: If the docs command fails.
    """
    exit_code, stdout, stderr = _run_physim_command(["docs", "--markdown"])
    if exit_code != 0:
        raise RuntimeError(
            f"Failed to generate markdown docs.\nStdout: {stdout}\nStderr: {stderr}"
        )


def get_docs_path() -> str:
    """
    Get the path to the markdown documentation.

    Returns:
        The path to the markdown documentation.

    Raises:
        RuntimeError: If the docs command fails.
    """
    exit_code, stdout, stderr = _run_physim_command(["docs", "--print-md-path"])
    if exit_code == 0:
        return stdout.strip()
    else:
        raise RuntimeError(
            f"Failed to get docs path.\nStdout: {stdout}\nStderr: {stderr}"
        )