import { checkLocalBuild } from './build-identity.mjs';
const info = await checkLocalBuild();
console.log(`Build verified: ${info.id}, ${info.files.length} assets, entry ${info.entry}`);
