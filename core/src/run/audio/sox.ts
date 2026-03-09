import { fail, Result, SystemFailureTag } from "../../err.ts";

/**
 * Synthesizes audio using the SoX CLI tool.
 */
export async function synthSox(
    args: string[],
    outputFile: string,
): Promise<Result<undefined>> {
    try {
        // We use '-n' for null input since we are synthesizing.
        const command = new Deno.Command("sox", {
            args: ["-n", outputFile, ...args],
        });
        const { code, stderr } = await command.output();

        if (code !== 0) {
            const error = new TextDecoder().decode(stderr);
            return fail(
                SystemFailureTag.SoxSynthesisFailure,
                `sox exited with code ${code}: ${error}`,
            );
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return fail(
                SystemFailureTag.SoxSynthesisFailure,
                "sox is not installed. Please install it for synthesis.",
            );
        }
        const message = err instanceof Error ? err.message : String(err);
        return fail(
            SystemFailureTag.SoxSynthesisFailure,
            `Failed to run sox: ${message}`,
        );
    }

    return undefined as unknown as Result<undefined>;
}
