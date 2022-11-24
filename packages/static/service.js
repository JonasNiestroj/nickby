import path from 'path';
import { __dirname } from './utils/file.js';
import glob from 'globby';
import generateRoutes from './routes/index.js';

function pathToRoute(file) {
  const route = file
    .toLowerCase()
    .replace(/\.vue$/, '')
    .replace(/\/?index$/, '/')
    .replace(/^pages\//, '')
    .replace(/(^\/|\/$)/g, '');

  return `/${route}`;
}

export default class Service {
  constructor() {
    this.pages = [];
  }

  async init() {
    const paths = ['pages/**/*.vue'];

    const pages = await glob(paths, { cwd: 'src' });

    await Promise.all(
      pages.map(async (file) => {
        const componentPath = path.join('src', file);

        const page = {
          path: `${pathToRoute(file)}`,
          component: `../${componentPath}`,
        };
        this.pages.push(page);
      })
    );

    generateRoutes(this);
  }

  resolve(p) {
    return path.resolve('', p);
  }
}
