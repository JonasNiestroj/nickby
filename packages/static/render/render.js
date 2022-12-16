import fs from 'fs';
import path from 'path';
import * as devalue from 'devalue';

export const render = async (server, url, service, manifest, htmlTemplate) => {
  let template = htmlTemplate;
  template = await server.transformIndexHtml(url, template);
  let render = (
    await server.ssrLoadModule(
      path.join(service.resolve('node_modules/.nickby'), 'entry-server.js')
    )
  ).render;

  let data = {};

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
      ).default({ url: url, payload: matchingRoute.payload });
    }
  } else {
    console.log('no matching route', url);
  }

  const [appHtml, preloadLinks, ctx] = await render(url, manifest, data);

  const hydration = [`window.__NICKBY_DATA__=${devalue.uneval(data)};`];

  Object.keys(ctx).forEach((key) => {
    if (key.startsWith('__NICKBY_DATA_')) {
      hydration.push(`window['${key}']=${devalue.uneval(ctx[key])};`);
    }
  });

  let html = template
    .replace(`<!--preload-links-->`, preloadLinks)
    .replace(`<!--app-html-->`, appHtml)
    .replace(
      '<!--hydration-->',
      `<script type="text/javascript">${hydration.join('')}</script>`
    );

  return html;
};
