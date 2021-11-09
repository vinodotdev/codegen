import yargs from 'yargs';
import { registerHelpers } from 'widl-template';
import {
  CODEGEN_TYPE,
  getTemplate,
  commitOutput,
  LANGUAGE,
  registerTypePartials,
  CommonWidlOptions,
  CommonOutputOptions,
  outputOpts,
  registerLanguageHelpers,
<<<<<<< HEAD:src/languages/rust/integration.ts
  readInterface,
} from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.Integration;
=======
} from '../../common';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.WellKnownImplementer;
>>>>>>> 24ef858 (rust: combined components module with generated module, started normalizing around interface.json signature vs processing schemas in templates, added rust test project):src/languages/rust/wellknown-implementer.ts

export const command = `${TYPE} <interface> [options]`;
export const desc = 'Generate the Vino integration code for the passed interface and type.';

export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('interface', {
      demandOption: true,
      type: 'string',
      description: 'Path to interface JSON',
    })
    .options(
      outputOpts({
        type: { type: 'string', alias: 't', demandOption: true, choices: ['wasm', 'wellknown', 'native'] },
      }),
    )
    .example(`rust ${TYPE} interface.json --type wasm`, 'Prints generated code to STDOUT');
};

interface Arguments extends CommonWidlOptions, CommonOutputOptions {
  interface: string;
  type: 'wasm' | 'wellknown' | 'native';
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  registerLanguageHelpers(LANG);

  const options = {
    root: args.root,
  };
  registerHelpers(options);

  const template = getTemplate(LANG, TYPE);
  const iface = readInterface(args.interface);

  const generated = template({ interface: iface, type: args.type });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
