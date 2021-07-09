import yargs from 'yargs';
import {
  commitOutput,
  LANGUAGE,
  registerTypePartials,
  JSON_TYPE,
  readFile,
  codegen,
  outputOpts,
  widlOpts,
  CommonOutputOptions,
  CommonWidlOptions,
} from '../../common';
import path from 'path';
import fs from 'fs';
import { parse } from '@wapc/widl';
import {
  AbstractNode,
  Annotation,
  Definition,
  Document,
  FieldDefinition,
  ImportDefinition,
  InterfaceDefinition,
  Kind,
  ListType,
  MapType,
  Named,
  NamespaceDefinition,
  StringValue,
  TypeDefinition,
} from '@wapc/widl/ast';

import { registerHelpers } from 'widl-template';

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

function isType(def: Definition): def is TypeDefinition {
  return def.isKind(Kind.TypeDefinition);
}

interface Component {
  name: string;
  inputs: Port[];
  outputs: Port[];
}

interface Port {
  name: string;
  type_string: string;
}

interface HasName extends AbstractNode {
  name: { value: string };
}

function findByName<T extends HasName>(defs: T[], name: string): T | undefined {
  return defs.find(def => def.name.value === name);
}

function distillType(types: TypeDefinition[], node: TypeDefinition | MapType | ListType | Named): any {
  if (node.isKind(Kind.Named)) {
    const name = (<Named>node).name.value;
    const reference = findByName(types, name);
    if (!reference) return codegen(node as Named);
    switch (reference.kind) {
      case Kind.TypeDefinition:
        return Object.fromEntries(
          (<TypeDefinition>reference).fields.map(field => [
            field.name.value,
            distillType(types, field.type as Named | MapType | ListType),
          ]),
        );
      default:
        return codegen(reference);
    }
  } else {
    return codegen(node);
  }
}

function interpret(doc: Document): Component {
  const types = doc.definitions.filter(isType);
  const input_def = findByName(types, 'Inputs');
  const output_def = findByName(types, 'Outputs');
  const namespace = doc.definitions.find(def => def.isKind(Kind.NamespaceDefinition));
  if (!namespace) throw new Error('Component schemas must define a namespace to use as the component name');
  if (!input_def) throw new Error('Component schemas must include a type definition named "Inputs"');
  if (!output_def) throw new Error('Component schemas must include a type definition named "Outputs"');

  return {
    name: (namespace as NamespaceDefinition).name.value,
    inputs: input_def.fields.map(field => ({
      name: field.name.value,
      type_string: distillType(types, field.type as Named),
    })),
    outputs: output_def.fields.map(field => ({
      name: field.name.value,
      type_string: distillType(types, field.type as Named),
    })),
  };
}

export function handler(args: Arguments): void {
  registerTypePartials(LANG, TYPE);
  const options = {
    root: args.root,
  };
  registerHelpers(options);

  const files = fs.readdirSync(args.schema_dir).filter(path => path.endsWith('.widl'));

  const components = files.map(file => {
    const widlSrc = readFile(path.join(args.schema_dir, file));
    const tree = parse(widlSrc);
    const component = interpret(tree);
    return component;
  });
  const providerSignature = {
    name: args.name,
    components,
  };

  const generated = JSON.stringify(providerSignature, null, 2);

  commitOutput(generated, args.output, { force: args.force, silent: args.silent });
}
