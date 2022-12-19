import path from 'path';
import { globby } from 'globby';
import generateRoutes from './routes/index.js';
import fs from 'fs';
import { loadConfig } from 'c12';
import consola from 'consola';
import plugin from './plugin.js';
import vue from '@vitejs/plugin-vue';

const logger = consola.create();

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
    this.config = {};
  }

  async init() {
    logger.info('Initializing nickby...');
    await this.loadConfig();

    if (!this.config.debug) {
      logger.level = 3;
    } else {
      logger.level = 4;
    }

    logger.info('Loading routes...');
    const paths = ['pages/**/*.vue'];

    const pages = await globby(paths, { cwd: 'src' });

    await Promise.all(
      pages.map(async (file) => {
        const componentPath = path.join('src', file);

        const page = {
          path: `${pathToRoute(file)}`,
          component: `../${componentPath}`,
        };
        this.pages.push(page);

        logger.debug(`Loaded route ${pathToRoute(file)}`);
      })
    );

    await this.loadRoutesFromConfig();

    generateRoutes(this);
  }

  async loadConfig() {
    const configPath = 'nickby.config.js';
    if (!fs.existsSync(configPath)) {
      return;
    }

    logger.info('Loading nickby.config.js...');

    const config = await loadConfig({
      configFile: 'nickby.config',
      cwd: path.resolve(''),
    });

    this.config = config.config;
  }

  async loadRoutesFromConfig() {
    if (!this.config.routes) {
      return;
    }

    let routes = await Promise.resolve(this.config.routes());

    this.pages.push(
      ...routes.map((route) => {
        logger.debug(`Loaded route ${route.path}`);
        return {
          path: route.path,
          component: `../${route.component}`,
          payload: route.payload,
        };
      })
    );
  }

  resolve(p) {
    return path.resolve('', p);
  }

  info(text) {
    logger.info(text);
  }

  debug(text) {
    logger.debug(text);
  }

  vitePlugins() {
    let plugins = [vue(), plugin(this)];
    if (this.config.vitePlugins) {
      plugins = [...plugins, ...this.config.vitePlugins];
    }
    return plugins;
  }
}
