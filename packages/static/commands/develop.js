import Service from '../service.js';
import { createServer } from 'vite';
import path from 'path';
import plugin from '../plugin.js';
import vue from '@vitejs/plugin-vue';
import express from 'express';
import fs from 'fs';
import { __dirname } from '../utils/file.js';

export default async function (api) {
  const rootPath = path.join(__dirname, '../app');

  const service = new Service();

  await service.init();

  const server = await createServer({
    base: '/',
    configFile: false,
    ssr: true,
    logLevel: 'info',
    root: rootPath,
    preview: {
      port: 1337,
    },
    server: {
      middlewareMode: true,
    },
    build: {
      rollupOptions: {
        input: path.join(rootPath, 'index.html'),
      },
    },
    plugins: [plugin(service), vue()],
    appType: 'custom',
  });

  server.moduleGraph.createFileOnlyEntry(
    path.join(rootPath, 'entry-server.js')
  );

  const app = express();
  app.use(server.middlewares);

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;

      template = fs.readFileSync(path.join(rootPath, 'index.html'), 'utf-8');
      template = await server.transformIndexHtml(url, template);
      render = (
        await server.ssrLoadModule(path.join(rootPath, 'entry-server.js'))
      ).render;

      const pages = service.resolve('src/pages');

      const serverCode = await server.ssrLoadModule(
        path.join(pages, 'Index.server.js')
      );

      const data = await serverCode.default();

      const [appHtml, preloadLinks] = await render(url, {}, data);

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)
        .replace(
          '<!--hydration-->',
          `<script type="text/javascript">window.__NICKBY_DATA__=${JSON.stringify(
            data
          )}</script>`
        );

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      server && server.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(1337);
}
