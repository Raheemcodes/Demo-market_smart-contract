import fs from 'fs';
import path from 'path';

const name = process.argv.slice(2)[0];

const artifactContent = fs.readFileSync(
  path.resolve('artifacts', 'contracts', `${name}.sol`, `${name}.json`),
  'utf-8'
);

const abi = JSON.parse(artifactContent).abi;

const stringifyAbi = JSON.stringify(abi);

fs.writeFileSync(
  path.join('..', 'client', 'src', 'app', 'mint', `${name}Abi.ts`),
  `const ${name}Abi = ${stringifyAbi} as const; export default ${name}Abi;`
);
fs.writeFileSync(
  path.join('..', 'server', 'src', 'helper', `${name}Abi.helper.ts`),
  `const ${name}Abi = ${stringifyAbi} as const; export default ${name}Abi;`
);
