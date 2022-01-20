import yargs, { boolean, options } from 'yargs';
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
import { debug } from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.Component;

export const command = `${TYPE} <interface> [component_name] [options]`;

export const desc = 'Generate boilerplate for components';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('interface', {
      demandOption: true,
      type: 'string',
      description: "The path to the component's WIDL schema",
    })
    .positional('component_name', {
      demandOption: false,
      type: 'string',
      description: 'The component to generate',
    })
    .options(
      outputOpts({
        all: { type: 'boolean', alias: 'a' },
        type: { type: 'string', alias: 't', demandOption: true, choices: ['wasm', 'wellknown', 'native'] },
      }),
    )
    .example(`${LANG} ${TYPE} interface.json my_component`, 'Prints generated component code to STDOUT');
};

interface Arguments extends CommonOutputOptions {
  interface: string;
  component_name: string;
  type: string;
  all: boolean;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  registerHelpers();

  const template = getTemplate(LANG, TYPE);
  const iface = readInterface(args.interface);
  const component_name = args.component_name;
  if (args.all) {
    if (component_name) {
      debug('Warning: component name (%s) and --all specified. --all takes precedence.');
    }
    for (const component in iface.components) {
      const generated = template({
        name: component,
        interface: iface,
        signature: iface.components[component],
        type: args.type,
      });
      const fileName = component.replace(/-/g, '_');
      commitOutput(generated, path.join(args.output || '.', `${fileName}.rs`), {
        force: args.force,
        silent: args.silent,
      });
    }
  } else if (component_name) {
    const component = iface.components[component_name];
    if (!component) {
      throw new Error(`Component name ${component_name} not found in interface`);
    }
    const generated = template({ name: component_name, interface: iface, signature: component, type: args.type });
    commitOutput(generated, args.output, {
      force: args.force,
      silent: args.silent,
    });
  } else {
    throw new Error('Either component name or --all must be specified');
  }
}
