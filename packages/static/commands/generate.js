import Service from '../service.js';
import { createServer, build } from 'vite';
import path from 'path';
import plugin from '../plugin.js';
import vue from '@vitejs/plugin-vue';
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
    plugins: [plugin(service), vue()],
    appType: 'custom',
  });

  const serverBuild = await build({
    base: '/',
    configFile: false,
    ssr: true,
    logLevel: 'info',
    root: rootPath,
    build: {
      ssr: true,
      outDir: 'dist/server',
      rollupOptions: {
        input: '/entry-server.js',
      },
    },
    plugins: [plugin(service), vue()],
    appType: 'custom',
  });
  const buildResponse = await build({
    base: '/',
    configFile: false,
    ssr: true,
    logLevel: 'info',
    root: rootPath,
    build: {
      ssrManifest: true,
      outDir: 'dist/static',
    },
    plugins: [plugin(service), vue()],
    appType: 'custom',
  });
  fs.rmSync('dist', { recursive: true });
  fs.mkdirSync('dist');
  fs.mkdirSync('dist/static');

  const toAbsolute = (p) => path.resolve(__dirname, p);

  const manifest = JSON.parse(
    fs.readFileSync(toAbsolute('../app/dist/static/ssr-manifest.json'), 'utf-8')
  );
  const template = fs.readFileSync(
    toAbsolute('../app/dist/static/index.html'),
    'utf-8'
  );
  const { render } = await import('../app/dist/server/entry-server.js');

  // determine routes to pre-render from src/pages
  const routesToPrerender = fs
    .readdirSync('src/pages')
    .filter((file) => file.endsWith('.vue'))
    .map((file) => {
      const name = file.replace(/\.vue$/, '').toLowerCase();
      return { url: name === 'index' ? `/` : `/${name}`, file };
    });

  // pre-render each route...
  for (const route of routesToPrerender) {
    const serverCode = route.file.replace('.vue', '.server.js');
    const pages = service.resolve('src/pages');

    let data = {};
    if (fs.existsSync(path.join(pages, serverCode))) {
      data = await (
        await server.ssrLoadModule(path.join(pages, serverCode))
      ).default();
    }

    const [appHtml, preloadLinks] = await render(route.url, manifest, data);

    const html = template
      .replace(`<!--preload-links-->`, preloadLinks)
      .replace(`<!--app-html-->`, appHtml)
      .replace(
        '<!--hydration-->',
        `<script type="text/javascript">window.__NICKBY_DATA__=${JSON.stringify(
          data
        )}</script>`
      );

    const filePath = `dist/static${
      route.url === '/' ? '/index' : route.url
    }.html`;
    try {
      fs.writeFileSync(filePath, html);
      console.log('pre-rendered:', filePath);
    } catch {}
  }

  fs.renameSync(
    toAbsolute('../app/dist/static/assets'),
    service.resolve('dist/static/assets')
  );

  // done, delete ssr manifest
  fs.unlinkSync(toAbsolute('../app/dist/static/ssr-manifest.json'));

  server.close();
}
