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
} from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.WapcComponent;

export const command = `${TYPE} <name> [options]`;

export const desc = 'Generate boilerplate component code';
export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('name', {
      demandOption: true,
      type: 'string',
      description: 'The name the WIDL file that generated the component (without .widl)',
    })
    .options(outputOpts({}))
    .example(`${LANG} ${TYPE} my_component`, 'Prints generated component code to STDOUT');
};

interface Arguments extends CommonOutputOptions {
  name: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);

  registerHelpers();

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const generated = template({ name: args.name });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
