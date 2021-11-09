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
  normalizeFilename,
  registerLanguageHelpers,
} from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.WapcComponent;

export const command = `${TYPE} <schema> [options]`;

export const desc = 'Generate boilerplate for WaPC components';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('schema', {
      demandOption: true,
      type: 'string',
      description: "The path to the component's WIDL schema",
    })
    .options(outputOpts({}))
    .example(`${LANG} ${TYPE} my_component`, 'Prints generated component code to STDOUT');
};

interface Arguments extends CommonOutputOptions {
  schema: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  registerHelpers();

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const generated = template({ schema: normalizeFilename(args.schema) });
  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
