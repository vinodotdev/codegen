import yargs from 'yargs';
import {
  commitOutput,
  LANGUAGE,
  registerTypePartials,
  JSON_TYPE,
  outputOpts,
  widlOpts,
  CommonOutputOptions,
  CommonWidlOptions,
} from '../../common';

import { registerHelpers } from 'widl-template';

import { processDir } from '../../process-widl-dir';

const LANG = LANGUAGE.JSON;
const TYPE = JSON_TYPE.Interface;

export const command = `${TYPE} <name> <schema_dir> [options]`;

export const desc = 'Generate JSON representation of a WIDL file';
export const builder = (yargs: yargs.Argv): yargs.Argv => {
  return yargs
    .positional('name', {
      demandOption: true,
      type: 'string',
      description: 'Path to directory containing WIDL schema files',
    })
    .positional('schema_dir', {
      demandOption: true,
      type: 'string',
      description: 'Path to directory containing WIDL schema files',
    })
    .options(outputOpts(widlOpts({})))
    .example(`${TYPE} schemas/`, 'Prints JSON-ified schema to STDOUT');
};

export interface Arguments extends CommonOutputOptions, CommonWidlOptions {
  name: string;
  schema_dir: string;
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  const options = {
    root: args.root,
  };
  registerHelpers(options);

  const providerSignature = processDir(args.name, args.schema_dir);

  const generated = JSON.stringify(providerSignature, null, 2);

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
