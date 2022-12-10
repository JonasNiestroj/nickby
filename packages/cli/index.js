import { Command } from 'commander';
import develop from './commands/develop.js';
import generate from './commands/generate.js';

export default () => {
  const program = new Command();

  program
    .name('nickby')
    .description('CLI for the nickby static site generator')
    .version('0.0.1');

  program
    .command('develop')
    .description('Starts the dev server')
    .action(() => {
      develop();
    });

  program
    .command('generate')
    .description('Generates all static sites')
    .action(() => {
      generate();
    });

  program.parse(process.argv);

  // If no subcommand as called
  if (process.argv === 2) {
    program.help();
  }
};
