import fs from 'fs-extra';
import generateRoutes from './generate-routes.js';

export default async (service) => {
  await fs.outputFile(`src/.temp/routes.js`, await generateRoutes(service));
};
