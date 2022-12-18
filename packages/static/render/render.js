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

  if (ctx.head) {
    if (ctx.head.title) {
      template = template.replace('<!--app-title-->', ctx.head.title);
    }
    if (ctx.head.html) {
      let tags = [];
      Object.keys(ctx.head.html).forEach((attr) => {
        tags.push(`${attr}="${ctx.head.html[attr]}"`);
      });
      if (!tags) {
        tags.push('lang="en"');
      }
      template = template.replace('<html>', `<html ${tags.join(' ')}>`);
    }
    if (ctx.head.meta) {
      const metaTags = [];
      ctx.head.meta.forEach((metaTag) => {
        const metaAttributes = [];
        Object.keys(metaTag).forEach((metaAttribute) => {
          metaAttributes.push(`${metaAttribute}="${metaTag[metaAttribute]}"`);
        });
        metaTags.push(`<meta ${metaAttributes.join(' ')}>`);
      });
      template = template.replace('<!--app-meta-->', metaTags.join('\n'));
    }
    if (ctx.head.link) {
      const links = [];
      ctx.head.link.forEach((link) => {
        const linkAttributes = [];
        Object.keys(link).forEach((linkAttribute) => {
          linkAttributes.push(`${linkAttribute}="${link[linkAttribute]}"`);
        });
        links.push(`<link ${linkAttributes.join(' ')}>`);
      });
      template = template.replace('<!--app-links-->', links.join('\n'));
    }
  }

  let html = template
    .replace('<html>', '<html lang="en">')
    .replace('<!--app-links-->', '')
    .replace(`<!--preload-links-->`, preloadLinks)
    .replace(`<!--app-html-->`, appHtml)
    .replace(
      '<!--hydration-->',
      `<script type="text/javascript">${hydration.join('')}</script>`
    )
    .replace('<!--app-title-->', 'Nickby app')
    .replace('<!--app-meta-->', '');

  return html;
};
