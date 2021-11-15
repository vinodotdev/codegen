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
  registerLanguageHelpers,
  readInterface,
} from '../../common';
import path from 'path';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.ProviderComponents;

export const command = `${TYPE} <interface> [options]`;

export const desc = 'Generate boilerplate for native provider components';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('interface', {
      demandOption: true,
      type: 'string',
      description: "The path to the component's WIDL schema",
    })
    .options(outputOpts({}))
    .example(`${LANG} ${TYPE} my_component`, 'Prints generated component code to STDOUT');
};

interface Arguments extends CommonOutputOptions {
  interface: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  registerHelpers();

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const iface = readInterface(args.interface);
  for (const component in iface.components) {
    const generated = template({ name: component, signature: iface.components[component] });
    const fileName = component.replace(/-/g, '_');
    commitOutput(generated, path.join(args.output || '.', `${fileName}.rs`), { force: false, silent: true });
  }
}
