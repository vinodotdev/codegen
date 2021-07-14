import yargs from 'yargs';
import { handlebars, parseWidl, registerHelpers } from 'widl-template';
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
  normalizeFilename,
} from '../../common';
import path from 'path';
import fs from 'fs';

const LANG = LANGUAGE.Rust;
const TYPE = CODEGEN_TYPE.Interface;

export const command = `${TYPE} <schema_dir> [options]`;
export const desc = 'Generate source code for well-known interfaces';

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
  registerPartial(LANG, 'expand-type');

  const options = {
    root: args.root,
  };
  registerHelpers(options);

  const files = fs.readdirSync(args.schema_dir).filter(path => path.endsWith('.widl'));

  const schemas = files.map(file => {
    const widlSrc = readFile(path.join(args.schema_dir, file));
    const tree = parseWidl(widlSrc);
    return { file: normalizeFilename(file), document: tree };
  });

  const template = handlebars.compile(getTemplate(LANG, TYPE));
  const generated = template({ schemas });

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
