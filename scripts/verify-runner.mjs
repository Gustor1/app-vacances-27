/** Stop at the first failed required check; skipped checks never count as passed. */
export async function runChecks(steps, execute) {
  const checks = [];
  for (const step of steps) {
    const startedAt = new Date().toISOString();
    let code;
    try { code = await execute(step); } catch { code = 1; }
    checks.push({ name: step.name, startedAt, finishedAt: new Date().toISOString(), exitCode: code, status: code === 0 ? 'passed' : 'failed' });
    if (code !== 0) return { exitCode: code || 1, checks, notRun: steps.slice(checks.length).map(item => item.name) };
  }
  return { exitCode: 0, checks, notRun: [] };
}
