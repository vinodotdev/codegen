import yargs from 'yargs';
import { handlebars, registerHelpers } from 'widl-template';
import {
  CODEGEN_TYPE,
  getTemplate,
  commitOutput,
  LANGUAGE,
  registerTypePartials,
  CommonOutputOptions,
  outputOpts,
  CommonWidlOptions,
  normalizeFilename,
  registerCommonPartials,
} from '../../common';
import fs from 'fs';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.ProviderComponentModule;

export const command = `${TYPE} <schema_dir> [options]`;
export const desc = 'Generate root native provider components module';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('schema_dir', {
      demandOption: true,
      type: 'string',
      description: 'The directory that holds your component schemas',
    })
    .options(outputOpts({}))
    .example(`${LANG} ${TYPE} schemas/`, 'Prints boilerplate components.rs to STDOUT');
};

interface Arguments extends CommonWidlOptions, CommonOutputOptions {
  schema_dir: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);

  const options = {
    root: args.root,
  };
  registerHelpers(options);

  const files = fs.readdirSync(args.schema_dir).filter(path => path.endsWith('.widl'));

  const schemas = files.map(normalizeFilename);

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const generated = template({ schemas });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
