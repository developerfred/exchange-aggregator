const path = require('path');
const fs = require('fs');
const solc = require('solc');

const package = path.dirname(require.resolve('kyber-network-smart-contracts/package.json'));
const source = path.join(package, 'contracts');
const destination = path.resolve(__dirname, '..', 'src', 'abi');

if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination);
}

const version = 'v0.4.18+commit.9cf6e910';
const contracts = [
  'KyberNetworkProxy.sol',
];

(async () => {
  const compiler = await new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (error, snapshot) => {
      if (error) {
        reject(error);
      }
      else {
        resolve(snapshot);
      }
    });
  });

  const input = JSON.stringify({
    language: 'Solidity',
    sources: contracts.reduce((carry, current) => ({
      ...carry,
      [current]: {
        content: fs.readFileSync(path.join(source, current), 'utf8'),
      },
    }), {}),
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi'],
        },
      },
    },
  });

  const output = JSON.parse(await compiler.compile(input, (file) => ({
    contents: fs.readFileSync(path.join(source, file), 'utf8'),
  })));

  const data = contracts.reduce((carry, current) => {
    const [prefix] = current.split('.', 1);
    const name = `${prefix}.abi.json`;

    return {
      ...carry,
      [name]: output.contracts[current][prefix].abi,
    };
  }, {});

  Object.keys(data).forEach((file) => {
    const contents = JSON.stringify(data[file], undefined, 2);
    fs.writeFileSync(path.join(destination, file), contents, {
      encoding: 'utf8',
    });

    console.log(`Wrote ${file}.`);
  });
})();

