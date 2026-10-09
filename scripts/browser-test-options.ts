import type { LaunchOptions } from '@playwright/test';

/** Applied only by the local gate; route.fulfill mocks still work before DNS. */
export function chromiumTestOptions(): LaunchOptions {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  return {
    ...(executablePath ? { executablePath } : process.platform === 'win32' ? { channel: 'chrome' } : process.platform === 'linux' ? { executablePath: '/usr/bin/chromium' } : {}),
    args: [
      ...(process.platform === 'linux' || executablePath ? ['--no-sandbox'] : []),
      ...(process.env.DETOURS_LOCAL_VERIFY === '1' ? ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'] : []),
    ],
  };
}
