import fs from 'fs';
import path from 'path';
import { __dirname } from '../utils/file.js';

const resolveComponentFromUrl = (url) => {
  let componentUrl = url;
  if (url === '/') {
    componentUrl = 'index';
  }
  const splittedUrl = componentUrl.split('/');
  const lastPart = splittedUrl[splittedUrl.length - 1];

  return lastPart[0].toUpperCase() + lastPart.slice(1);
};

export const render = async (server, url, service, manifest) => {
  const appPath = path.join(__dirname, '../app');

  let template = fs.readFileSync(path.join(appPath, 'index.html'), 'utf-8');
  template = await server.transformIndexHtml(url, template);
  let render = (
    await server.ssrLoadModule(path.join(appPath, 'entry-server.js'))
  ).render;

  const component = resolveComponentFromUrl(url);

  const pages = service.resolve('src/pages');

  let data = {};

  if (fs.existsSync(path.join(pages, `${component}.server.js`))) {
    data = await (
      await server.ssrLoadModule(path.join(pages, `${component}.server.js`))
    ).default();
  }

  const [appHtml, preloadLinks] = await render(url, manifest, data);

  const html = template
    .replace(`<!--preload-links-->`, preloadLinks)
    .replace(`<!--app-html-->`, appHtml)
    .replace(
      '<!--hydration-->',
      `<script type="text/javascript">window.__NICKBY_DATA__=${JSON.stringify(
        data
      )}</script>`
    );

  return html;
};
