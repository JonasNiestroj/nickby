import develop from './commands/develop.js';
import generate from './commands/generate.js';
import fetch from 'node-fetch';

export default (args) => {
  if (!global.fetch) {
    global.fetch = fetch;
  }

  if (args[2] === 'develop') {
    develop(null);
  } else if (args[2] === 'generate') {
    generate(null);
  }
};
