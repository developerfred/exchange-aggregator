const path = require('path');
const fs = require('fs');
const solc = require('solc');
const axios = require('axios');

const repository = 'KyberNetwork/smart-contracts';
const commit = '76fadb44f679bcd3ff0449a3be8beab11357d0f9';
const source = `https://raw.githubusercontent.com/${repository}/${commit}/contracts`;
const version = 'v0.4.18+commit.9cf6e910';

const compile = [
  "KyberNetworkProxy.sol",
  "KyberNetwork.sol",
  "KyberReserve.sol",
  "ConversionRates.sol",
  "LiquidityConversionRates.sol",
  "ExpectedRate.sol",
  "FeeBurner.sol",
  "SanityRates.sol",
  "WhiteList.sol",
  "permissionless/OrderbookReserve.sol",
  "permissionless/PermissionlessOrderbookReserveLister.sol",
];

const destination = path.resolve(__dirname, '..', 'src', 'contracts');
if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination, { recursive: true });
}

const open = async (file) => {
  console.warn(`Downloading ${file}.`);
  const url = `${source}/${file}`;
  return (await axios.get(url)).data;
};

const preload = async (files) => {
  const contracts = new Map();
  const fetch = async (name) => {
    if (!contracts.has(name)) {
      contracts.set(name, open(name));

      const result = await contracts.get(name);
      const regex = new RegExp('^import\\s+\\"(.+)\\";?$', 'gm');
      const imports = [];

      let matches;
      while ((matches = regex.exec(result)) !== null) {
        const match = path.normalize(matches[1]);
        if (!contracts.has(match)) {
          imports.push(match);
        }
      }

      const cwd = path.dirname(name);
      await Promise.all(imports.map(item => fetch(path.normalize(path.join(cwd, item)))));
    }

    return await contracts.get(name);
  };

  await Promise.all(files.map(contract => fetch(path.normalize(contract))));

  const keys = Array.from(contracts.keys());
  const values = await Promise.all(keys.map(key => contracts.get(key)));
  return keys.reduce((carry, key, index) => ({ ...carry, [key]: values[index] }), {});
}

(async () => {
  const contracts = await preload(compile);
  const keys = Object.keys(contracts);
  const sources = keys.reduce(
    (carry, current) => ({
      ...carry,
      [current]: {
        content: contracts[current],
      },
    }),
    {},
  );

  const compiler = await new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (error, snapshot) => {
      if (error) {
        reject(error);
      } else {
        resolve(snapshot);
      }
    });
  });

  const input = JSON.stringify({
    language: 'Solidity',
    sources,
    settings: {
      evmVersion: 'homestead',
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  });

  const compiled = await compiler.compile(input);
  const output = JSON.parse(compiled);
  const data = keys.reduce((carry, current) => {
    const [prefix] = current.split('.', 1);

    return {
      ...carry,
      [`${prefix}.sol`]: contracts[current],
      [`${prefix}.bin`]: Object.values(output.contracts[current])[0].evm.bytecode.object,
      [`${prefix}.abi.json`]: JSON.stringify(Object.values(output.contracts[current])[0].abi, undefined, 2),
    };
  }, {});

  Object.keys(data).forEach(file => {
    const filename = path.basename(file);
    const [contract] = file.split('.', 1);
    if (!compile.includes(`${contract}.sol`)) {
      return;
    }

    const target = path.join(destination, filename);
    fs.writeFileSync(target, data[file], {
      encoding: 'utf8',
    });

    console.log(`Wrote ${path.normalize(file)}.`);
  });
})();
