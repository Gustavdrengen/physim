import subprocess


def _run_physim_command(args: list[str], cwd: str | None = None) -> tuple[int, str, str]:
    cmd = ["physim"] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
        return (result.returncode, result.stdout, result.stderr)
    except FileNotFoundError:
        return (
            -1,
            "",
            "physim command not found. Is it installed and in PATH?",
        )
    except Exception as e:
        return (-1, "", f"Unexpected error running physim: {e}")
