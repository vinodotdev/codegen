import fs from 'fs';
import path from 'path';
import findroot from 'find-root';
import DEBUG from 'debug';
import { handlebars } from 'widl-template';
import { ast } from '@wapc/widl';
import { AbstractNode, Kind, ListType, MapType, Named, Optional } from '@wapc/widl/ast';
import yargs from 'yargs';
export const debug = DEBUG('vino-codegen');

export enum LANGUAGE {
  Rust = 'rust',
  WIDL = 'widl',
  JSON = 'json',
}

export enum CODEGEN_TYPE {
  ProviderComponent = 'provider-component',
  ProviderComponentModule = 'provider-component-module',
  ProviderIntegration = 'provider-integration',
  WellKnownIntegration = 'wellknown-integration',
  WellKnownComponentModule = 'wellknown-component-module',
  Interface = 'interface',
  WapcComponent = 'wapc-component',
  WapcComponentModule = 'wapc-component-module',
  WapcIntegration = 'wapc-integration',
  WapcLib = 'wapc-lib',
}

export enum WIDL_TYPE {
  Interface = 'interface',
  Schema = 'schema',
}

export enum JSON_TYPE {
  Interface = 'interface',
}

export const LANGUAGE_OFFERS = {
  [LANGUAGE.Rust]: CODEGEN_TYPE,
  [LANGUAGE.WIDL]: WIDL_TYPE,
  [LANGUAGE.JSON]: JSON_TYPE,
};

export const DEFAULT_CODEGEN_TYPE = CODEGEN_TYPE.WapcIntegration;

export function readFile(path: string): string {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (e) {
    throw new Error(`Could not read file at ${path}: ${e.message}`);
  }
}

export interface NormalizedFilename {
  raw: string;
  basename: string;
  withoutExtension: string;
  unhyphenated: string;
  extension: string;
}

export function normalizeFilename(filename: string): NormalizedFilename {
  const basename = path.basename(filename);
  const extension = path.extname(filename);
  const withoutExtension = basename.replace(extension, '');

  return {
    raw: filename,
    extension,
    basename,
    withoutExtension,
    unhyphenated: withoutExtension.replace('-', '_'),
  };
}

export function getTemplate(language: LANGUAGE, type: CODEGEN_TYPE | WIDL_TYPE | JSON_TYPE): string {
  const templatePath = path.join(findroot(__dirname), 'templates', language, `${type}.hbs`);
  debug('Reading template %o->%o located at %o', language, type, templatePath);
  return readFile(templatePath);
}

export function registerPartial(language: LANGUAGE, partial: string): void {
  const partialPath = path.join(findroot(__dirname), 'templates', language, 'partials', `${partial}.hbs`);
  debug('registering partial template %o->%o located at %o', language, partial, partialPath);
  const partialSource = readFile(partialPath);
  handlebars.registerPartial(partial, partialSource);
}

export function registerTypePartials(language: LANGUAGE, type: CODEGEN_TYPE | WIDL_TYPE | JSON_TYPE): void {
  const relativeDir = path.join(language, 'partials', type);
  const dir = path.join(findroot(__dirname), 'templates', relativeDir);
  debug(`Looking for partials in ${dir}`);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = file.replace(path.extname(`${file}.hbs`), '');
    const partialPath = path.join(dir, file);
    debug(`Loading partial ${partialPath}`);
    const exists = fs.existsSync(partialPath);
    if (exists) {
      debug(`Registering partial for ${language}.${type}`);
      const partialSource = readFile(partialPath);
      handlebars.registerPartial(name, partialSource);
    }
  }
}

// This should be a separate module but won't until it does a complete codegen
export function codegen(node: AbstractNode): string {
  switch (node.kind) {
    case Kind.Named:
      return (<Named>node).name.value;
    case Kind.Optional:
      return `${codegen((<Optional>node).type as unknown as AbstractNode)}?`;
    case Kind.MapType:
      return `{${codegen((<MapType>node).keyType as unknown as AbstractNode)}:${codegen(
        (<MapType>node).valueType as unknown as AbstractNode,
      )}`;
    case Kind.ListType:
      return `[${codegen((<ListType>node).type as unknown as AbstractNode)}]`;
    default:
      // console.log(node);
      throw new Error(`Unhandled node ${node.kind}`);
  }
}

export interface CommonOutputOptions {
  force: boolean;
  silent: boolean;
  output?: string;
}

export interface CommonWidlOptions {
  root: string;
}

export function outputOpts(obj: { [key: string]: yargs.Options }): typeof obj {
  if (typeof obj != 'object' || obj === null) throw new Error(`Invalid argument: ${obj}`);
  const commonOptions = {
    s: {
      alias: 'silent',
      describe: 'Silently ignore write errors',
      type: 'boolean',
    },
    f: {
      alias: 'force',
      describe: 'Overwrite destination output even if it exists',
      type: 'boolean',
      implies: 'o',
    },
    o: {
      alias: 'output',
      describe: 'The output destination (defaults to STDOUT)',
      default: undefined,
      type: 'string',
    },
  };
  return Object.assign({}, obj, commonOptions);
}

export function widlOpts(obj: { [key: string]: yargs.Options }): typeof obj {
  if (typeof obj != 'object' || obj === null) throw new Error(`Invalid argument: ${obj}`);
  const commonOptions = {
    r: {
      alias: 'root',
      describe: 'The root directory to use when resolving import definitions',
      type: 'string',
    },
  };
  return Object.assign({}, obj, commonOptions);
}

interface CommitOptions {
  force?: boolean;
  silent?: boolean;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function commitOutput(src: string, path?: string, options: CommitOptions = {}): void {
  if (path) {
    if (fs.existsSync(path)) {
      if (options.force) {
        debug(`${path} exists, overwriting anyway because of --force`);
      } else {
        const contents = fs.readFileSync(path, 'utf-8');
        if (contents.startsWith('/* stub */')) {
          debug(`${path} exists but is a stub file, overwriting`);
        } else {
          debug(`Refusing to overwrite ${path}`);
          if (options.silent) return;
          else {
            console.error(`${path} exists, to overwrite pass --force to the codegen or delete the file`);
            return;
          }
        }
      }
    }
    debug(`Attempting to write to ${path}`);
    fs.writeFileSync(path, src);
  } else {
    console.log(src);
  }
}
