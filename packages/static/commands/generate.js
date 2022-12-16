import Service from '../service.js';
import { createServer, build } from 'vite';
import async from 'async';
import fs from 'fs-extra';
import { render } from '../render/render.js';

export default async function (api) {
  const service = new Service();

  await service.init();

  service.info('Building assets...');

  await build({
    base: '/',
    configFile: false,
    ssr: true,
    root: service.resolve(''),
    build: {
      ssr: true,
      outDir: 'node_modules/.nickby/dist/server',
      rollupOptions: {
        input: 'node_modules/.nickby/entry-server.js',
      },
    },
    resolve: {
      alias: {
        '@nickby/init': service.resolve('init.js'),
      },
    },
    plugins: service.vitePlugins(),
    appType: 'custom',
  });

  await build({
    base: '/',
    configFile: false,
    ssr: true,
    root: service.resolve(''),
    build: {
      rollupOptions: {
        input: 'node_modules/.nickby/index.html',
        output: {
          dir: 'node_modules/.nickby/dist/static',
        },
      },
      ssrManifest: true,
      outDir: 'node_modules/.nickby/dist/static',
    },
    resolve: {
      alias: {
        '@nickby/init': service.resolve('init.js'),
      },
    },
    plugins: service.vitePlugins(),
    appType: 'custom',
  });

  service.info('Generating routes...');

  const server = await createServer({
    base: '/',
    configFile: false,
    ssr: true,
    logLevel: 'info',
    entry: 'node_modules/.nickby/dist/static/index.html',
    root: service.resolve(''),
    debug: true,
    server: {
      middlewareMode: true,
      watch: {
        ignored: ['dist/**'],
      },
    },
    build: {
      rollupOptions: {
        input: 'node_modules/.nickby/dist/static/index.html',
      },
    },
    optimizeDeps: {
      entries: ['node_modules/.nickby/dist/static/index.html'],
    },
    resolve: {
      alias: {
        '@nickby/init': service.resolve('init.js'),
        promisify: 'promisify',
      },
    },
    plugins: service.vitePlugins(),
    appType: 'custom',
  });

  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }

  fs.mkdirSync('dist');
  fs.mkdirSync('dist/static');

  const manifest = JSON.parse(
    fs.readFileSync(
      service.resolve('node_modules/.nickby/dist/static/ssr-manifest.json')
    )
  );

  const htmlTemplate = fs.readFileSync(
    service.resolve(
      'node_modules/.nickby/dist/static/node_modules/.nickby/index.html'
    ),
    'utf-8'
  );

  // pre-render each route...
  await async.forEachLimit(service.pages, 10, async (route) => {
    const html = await render(
      server,
      route.path,
      service,
      manifest,
      htmlTemplate
    );

    const filePath = `dist/static${
      route.path === '/' ? '/index' : route.path
    }.html`;
    try {
      fs.outputFileSync(filePath, html);
      service.debug(`Generated route ${route.path}`);
    } catch (e) {
      console.log(e);
    }
  });

  fs.renameSync(
    service.resolve('node_modules/.nickby/dist/static/assets'),
    service.resolve('dist/static/assets')
  );

  // done, delete ssr manifest
  fs.unlinkSync(
    service.resolve('node_modules/.nickby/dist/static/ssr-manifest.json')
  );

  server.close();
}
