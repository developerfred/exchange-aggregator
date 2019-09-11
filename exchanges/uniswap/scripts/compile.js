const path = require('path');
const fs = require('fs');
const solc = require('solc');
const glob = require('glob');

const package = path.dirname(require.resolve('melon-smart-contracts/package.json'));
const source = path.join(package, 'src', 'contracts');
const destination = path.resolve(__dirname, '..', 'src', 'abi');

if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination);
}

const version = 'v0.4.25+commit.59dbf8f1';
const contracts = [
  'exchanges/UniswapAdapter.sol',
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

  const candidates = glob.sync('**/*.sol', {
    cwd: source,
  }).reduce((carry, current) => ({
    ...carry,
    [path.basename(current).toLowerCase()]: current,
  }), {});

  const compiled = await compiler.compile(input, (file) => ({
    contents: fs.readFileSync(path.join(source, candidates[file.toLowerCase()]), 'utf8'),
  }));

  const output = JSON.parse(compiled);
  const data = contracts.reduce((carry, current) => {
    const [prefix] = path.basename(current).split('.', 1);
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

