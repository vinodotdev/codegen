import yargs from 'yargs';
import { render } from 'widl-template';
import {
  CODEGEN_TYPE,
  DEFAULT_CODEGEN_TYPE,
  debug,
  getTemplate,
  commitOutput,
  LANGUAGE,
  readFile,
  registerPartial,
  registerTypePartials,
} from '../common';

export const command = `${LANGUAGE.Rust} <schema> [options]`;

export const desc = 'Generate Rust code from a WIDL schema';
export const builder = (yargs: yargs.Argv): yargs.Argv => {
  debug('building rust arg parser');
  return yargs
    .positional('schema', {
      demandOption: true,
      type: 'string',
      description: 'Path to WIDL schema file',
    })
    .options({
      t: {
        alias: 'type',
        demandOption: true,
        default: DEFAULT_CODEGEN_TYPE,
        describe: 'The type of code to generate',
        choices: Object.values(CODEGEN_TYPE),
        type: 'string',
      },
      s: {
        alias: 'silent',
        describe: 'Silently ignore write errors',
        type: 'boolean',
      },
      f: {
        alias: 'force',
        describe: 'Overwrite destination output even if it exists',
        type: 'boolean',
        implies: 'o',
      },
      o: {
        alias: 'output',
        describe: 'The output destination (defaults to STDOUT)',
        default: undefined,
        type: 'string',
      },
    })
    .example(`rust schema.widl -t ${DEFAULT_CODEGEN_TYPE}`, 'Prints generated code to STDOUT');
};

interface Arguments {
  schema: string;
  type: CODEGEN_TYPE;
  force: boolean;
  silent: boolean;
  output?: string;
}

export function handler(args: Arguments): void {
  debug('running rust handler');
  const widlPath = args.schema;
  const widlSrc = readFile(widlPath);
  registerPartial(LANGUAGE.Rust, 'expandType');
  registerTypePartials(LANGUAGE.Rust, args.type);

  const generated = render(widlSrc, getTemplate(LANGUAGE.Rust, args.type));

  try {
    commitOutput(generated, args.output, { force: args.force, silent: args.silent });
    console.error('Done');
  } catch (e) {
    console.error(`Error committing output: `);
    console.error(e);
  }
}
