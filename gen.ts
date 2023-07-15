import fs from 'fs';
import path from 'path';

const artifactContent = fs.readFileSync(
  path.resolve('artifacts', 'contracts', 'AzukiDemo.sol', 'AzukiDemo.json'),
  'utf-8'
);

const abi = JSON.parse(artifactContent).abi;

const stringifyAbi = JSON.stringify(abi);

fs.writeFileSync(
  path.join('..', 'client', 'src', 'app', 'mint', 'AzukiDemoAbi.ts'),
  `const AzukiDemoAbi = ${stringifyAbi} as const; export default AzukiDemoAbi;`
);
