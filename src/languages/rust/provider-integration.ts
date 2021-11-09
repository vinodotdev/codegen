import yargs from 'yargs';
import { handlebars, registerHelpers } from 'widl-template';
import {
  CODEGEN_TYPE,
  getTemplate,
  commitOutput,
  LANGUAGE,
  registerTypePartials,
  widlOpts,
  CommonWidlOptions,
  CommonOutputOptions,
  outputOpts,
  registerLanguageHelpers,
} from '../../common';

import { processDir } from '../../process-widl-dir';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.ProviderIntegration;

export const command = `${TYPE} <schema_dir> [options]`;
export const desc = 'Generate the Vino integration code for all component schemas';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('schema_dir', {
      demandOption: true,
      type: 'string',
      description: 'Path to WIDL schema directory',
    })
    .options(outputOpts(widlOpts({})))
    .example(`rust ${TYPE} schemas/`, 'Prints generated code to STDOUT');
};

interface Arguments extends CommonWidlOptions, CommonOutputOptions {
  schema_dir: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  const options = {
    root: args.root,
  };
  registerHelpers(options);
  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const iface = processDir('', args.schema_dir);
  const generated = template({ interface: iface });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
