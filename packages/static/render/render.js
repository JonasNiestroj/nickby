import fs from 'fs';
import path from 'path';
import * as devalue from 'devalue';

const resolveComponentFromUrl = (url) => {
  let componentUrl = url;
  if (url === '/') {
    componentUrl = 'index';
  }
  const splittedUrl = componentUrl.split('/');
  const lastPart = splittedUrl[splittedUrl.length - 1];

  return lastPart[0].toUpperCase() + lastPart.slice(1);
};

export const render = async (server, url, service, manifest, htmlTemplate) => {
  let template = htmlTemplate;
  template = await server.transformIndexHtml(url, template);
  let render = (
    await server.ssrLoadModule(
      path.join(service.resolve('node_modules/.nickby'), 'entry-server.js')
    )
  ).render;

  const component = resolveComponentFromUrl(url);

  const pages = service.resolve('src/pages');

  let data = {};

  if (fs.existsSync(path.join(pages, `${component}.server.js`))) {
    data = await (
      await server.ssrLoadModule(path.join(pages, `${component}.server.js`))
    ).default({ url: url });
  } else {
    const routes = service.pages;
    const matchingRoute = routes.find((route) => route.path === url);

    if (matchingRoute) {
      if (
        fs.existsSync(
          matchingRoute.component.substring(3).replace('.vue', '.server.js')
        )
      ) {
        data = await (
          await server.ssrLoadModule(
            matchingRoute.component.substring(3).replace('.vue', '.server.js')
          )
        ).default({ url: url });
      }
    }
  }

  const [appHtml, preloadLinks] = await render(url, manifest, data);

  let html = template
    .replace(`<!--preload-links-->`, preloadLinks)
    .replace(`<!--app-html-->`, appHtml)
    .replace(
      '<!--hydration-->',
      `<script type="text/javascript">window.__NICKBY_DATA__=${devalue.uneval(
        data
      )}</script>`
    );

  return html;
};
