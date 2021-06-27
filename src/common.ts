import fs from 'fs';
import path from 'path';
import findroot from 'find-root';
import DEBUG from 'debug';
import { handlebars } from 'widl-template';
import { ast } from '@wapc/widl';
export const debug = DEBUG('vino-codegen');

export enum LANGUAGE {
  Rust = 'rust',
}

export enum CODEGEN_TYPE {
  SdkIntegration = 'sdk-integration',
  GuestBoilerplate = 'guest-boilerplate',
  ProviderComponent = 'provider-component',
  ProviderIntegration = 'provider-integration',
}

export const DEFAULT_CODEGEN_TYPE = CODEGEN_TYPE.SdkIntegration;

export function readFile(path: string): string {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (e) {
    throw new Error(`Could not read file at ${path}: ${e.message}`);
  }
}

export function getTemplate(language: LANGUAGE, type: CODEGEN_TYPE): string {
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

export function registerTypePartials(language: LANGUAGE, type: CODEGEN_TYPE): void {
  const relativeDir = path.join(language, 'partials', type);
  const dir = path.join(findroot(__dirname), 'templates', relativeDir);
  for (const node of Object.values(ast.Kind)) {
    const filename = `${node}.hbs`;
    const partialPath = path.join(dir, filename);
    const exists = fs.existsSync(partialPath);
    if (exists) {
      debug(
        `AST handler ${language}.${type} %o at %o`,
        language,
        type,
        exists ? 'FOUND' : 'NOT FOUND',
        path.join(relativeDir, filename),
      );
      const partialSource = readFile(partialPath);
      handlebars.registerPartial(node, partialSource);
    }
  }
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
          else throw new Error(`Refusing to overwrite ${path} without --force`);
        }
      }
    }
    debug(`Attempting to write to ${path}`);
    fs.writeFileSync(path, src);
  } else {
    console.log(src);
  }
}
