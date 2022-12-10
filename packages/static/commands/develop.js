import Service from '../service.js';
import { createServer } from 'vite';
import path from 'path';
import plugin from '../plugin.js';
import vue from '@vitejs/plugin-vue';
import express from 'express';
import { render } from '../render/render.js';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

export default async function (api) {
  const currentPath = path.dirname(fileURLToPath(import.meta.url));

  const rootPath = path.join(currentPath, '../app');

  const service = new Service();

  await service.init();

  fs.copySync(rootPath, service.resolve('node_modules/.nickby'));

  service.info('Starting dev server...');

  const server = await createServer({
    base: '/',
    configFile: false,
    ssr: true,
    logLevel: 'info',
    entry: 'node_modules/.nickby/index.html',
    root: service.resolve(''),
    debug: true,
    preview: {
      port: 1337,
    },
    server: {
      middlewareMode: true,
    },
    build: {
      rollupOptions: {
        input: 'node_modules/.nickby/index.html',
      },
    },
    optimizeDeps: {
      entries: ['node_modules/.nickby/index.html'],
    },
    resolve: {
      alias: {
        '@nickby/init': service.resolve('init.js'),
      },
    },
    plugins: service.vitePlugins(),
    appType: 'custom',
  });

  server.moduleGraph.createFileOnlyEntry(
    path.join(rootPath, 'entry-server.js')
  );

  const htmlTemplate = fs.readFileSync(
    path.join(rootPath, 'index.html'),
    'utf-8'
  );

  const app = express();

  app.use(server.middlewares);

  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;

      const html = await render(server, url, service, {}, htmlTemplate);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      server && server.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(8080);

  service.info('Listening on port 8080');
}
