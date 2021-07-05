import yargs from 'yargs';
import { render } from 'widl-template';
import {
  CODEGEN_TYPE,
  getTemplate,
  commitOutput,
  LANGUAGE,
  readFile,
  registerPartial,
  registerTypePartials,
  widlOpts,
  CommonWidlOptions,
  CommonOutputOptions,
  outputOpts,
} from '../../common';
import path from 'path';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.ProviderIntegration;

export const command = `${TYPE} <schema> [options]`;

export const desc = 'Generate component integration boilerplace for providers';
export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('schema', {
      demandOption: true,
      type: 'string',
      description: 'Path to WIDL schema file',
    })
    .options(outputOpts(widlOpts({})))
    .example(`rust ${TYPE} schema.widl`, 'Prints generated code to STDOUT');
};

interface Arguments extends CommonWidlOptions, CommonOutputOptions {
  schema: string;
}

export function handler(args: Arguments): void {
  const widlPath = args.schema;
  const widlSrc = readFile(widlPath);
  registerPartial(LANG, 'expand-type');
  registerTypePartials(LANG, TYPE);
  const options = {
    root: args.root || path.dirname(widlPath),
  };

  const generated = render(widlSrc, getTemplate(LANG, TYPE), options);

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
