import yargs from 'yargs';
import { handlebars, registerHelpers } from 'widl-template';
import {
  CODEGEN_TYPE,
  getTemplate,
  commitOutput,
  LANGUAGE,
  readFile,
  registerTypePartials,
  widlOpts,
  CommonWidlOptions,
  CommonOutputOptions,
  outputOpts,
  registerLanguageHelpers,
} from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.WellKnownImplementer;

export const command = `${TYPE} <interface> [options]`;
export const desc = 'Generate the Vino integration code for well-known interface schemas';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('interface', {
      demandOption: true,
      type: 'string',
      description: 'Path to well-known interface schema (JSON)',
    })
    .options(outputOpts(widlOpts({})))
    .example(`rust ${TYPE} interface.json`, 'Prints generated code to STDOUT');
};

interface Arguments extends CommonWidlOptions, CommonOutputOptions {
  interface: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  const options = {
    root: args.root,
  };
  registerHelpers(options);
  const interfaceJson = readFile(args.interface);
  const iface = JSON.parse(interfaceJson);

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const generated = template({ interface: iface });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
