import { readFileSync } from 'fs';
import path from 'path';

const plugin = () => {
  return {
    name: 'plugin',
    load(id) {
      if (id === '@nickby/routes.js') {
        return readFileSync('src/.temp/routes.js').toString();
      }
    },
    resolveId(id) {
      if (id === '@nickby/routes.js') {
        return id;
      }
    },
  };
};

export default plugin;
