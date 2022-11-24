export default async (service) => {
  const pages = service.pages;

  const routes = pages.map((page) => {
    return {
      path: page.path,
      component: page.component,
      name: page.path.replace('/', ' '),
    };
  });

  let routesObjects = routes.map(
    (route) => `{
        path: "${route.path}",
        name: "${route.name}",
        component: () => import("${route.component}")
    }`
  );

  let routesSource = `
        export const routes = [${routesObjects.join(',')}]
        export default router => {
            routes.forEach(route => router.addRoute(route))
        }
    `;

  return routesSource;
};
