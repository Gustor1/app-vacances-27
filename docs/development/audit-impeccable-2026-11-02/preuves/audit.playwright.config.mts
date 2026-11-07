import base from '../../../../playwright.config';
import path from 'node:path';
import {tmpdir} from 'node:os';
export default {
  ...base,
  testDir: path.resolve('tests/e2e'),
  outputDir: path.join(tmpdir(),'detours-audit-e2e-final-20261102'),
  reporter: [['list'], ['json', {outputFile: path.resolve('docs/development/audit-impeccable-2026-11-02/preuves/e2e-final.json')}]],
  use: {...base.use, baseURL:'http://127.0.0.1:52983'},
  webServer: {...base.webServer, command:'npm run dev -- --host 127.0.0.1 --port 52983 --strictPort', url:'http://127.0.0.1:52983', reuseExistingServer:false},
};
