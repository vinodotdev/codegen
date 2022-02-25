import yargs from 'yargs';
import { registerHelpers } from 'widl-template';
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
import { BATCH_COMPONENT_NAME } from '../../batch_component';

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

  function writeComponent(component: string, fileName?: string, batch = false) {
    const generated = template({
      name: component,
      interface: iface,
      type: args.type,
      batch,
    });

    commitOutput(generated, fileName, {
      force: args.force,
      silent: args.silent,
    });
  }

  if (!(args.all || component_name)) {
    throw new Error('Either component name or --all must be specified');
  }

  if (args.all) {
    if (component_name) {
      console.warn('Warning: component name (%s) and --all specified. --all takes precedence.');
    }
    for (const component in iface.components) {
      const fileName = component.replace(/[::]+/g, '/').replace(/[-]+/g, '_');
      writeComponent(component, path.join(args.output || '.', `${fileName}.rs`));
    }
    const fileName = path.join(args.output || '.', `${BATCH_COMPONENT_NAME}.rs`);
    writeComponent(BATCH_COMPONENT_NAME, fileName, true);
  } else if (component_name) {
    if (component_name == BATCH_COMPONENT_NAME) {
      writeComponent(BATCH_COMPONENT_NAME, args.output, true);
    } else {
      const component = iface.components[component_name];
      if (!component) {
        throw new Error(`Component name ${component_name} not found in interface`);
      }
      writeComponent(component_name, args.output);
    }
  }
}
