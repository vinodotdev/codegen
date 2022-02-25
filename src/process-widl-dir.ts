import { readFile } from './common';
import path from 'path';
import fs from 'fs';
import { parse } from '@wapc/widl';
import {
  AbstractNode,
  Annotation,
  Definition,
  Document,
  Kind,
  ListType,
  MapType,
  Named,
  NamespaceDefinition,
  Optional,
  Type,
  TypeDefinition,
} from '@wapc/widl/ast';

import { ComponentSignature, isWidlType, ProviderSignature, StructSignature, TypeMap, TypeSignature } from './types';

export function processDir(name: string, dir: string): ProviderSignature {
  const { components, types } = processWidlDir(dir);

  const providerSignature: ProviderSignature = {
    name,
    types: Object.fromEntries(types.map(t => [t.name, t])),
    components: Object.fromEntries(components.map(c => [c.name, c])),
  };
  return providerSignature;
}

function processWidlDir(
  dir: string,
  prefixes: string[] = [],
): { types: StructSignature[]; components: ComponentSignature[] } {
  const rv = { types: [] as StructSignature[], components: [] as ComponentSignature[] };
  const entries = fs.readdirSync(dir);

  const widlFiles = entries.filter(file => file.endsWith('.widl'));
  const directories = entries.filter(file => fs.statSync(path.join(dir, file)).isDirectory());

  for (const subdir of directories) {
    const result = processWidlDir(path.join(dir, subdir), prefixes.concat([subdir]));
    rv.types.push(...result.types);
    result.components.forEach(comp => (comp.name = prefixes.concat([comp.name]).join('::')));
    rv.components.push(...result.components);
  }

  const components: ComponentSignature[] = [];
  const types: StructSignature[] = [];

  const resolver = (location: string) => {
    const pathParts = location.split('/');
    const importPath = path.join(dir, ...pathParts);
    const src = readFile(importPath);
    return src;
  };

  for (const file of widlFiles) {
    const widlSrc = readFile(path.join(dir, file));
    const tree = parse(widlSrc, resolver);
    const [component, additionalTypes] = interpret(tree);
    types.push(...additionalTypes);
    components.push(component);
  }
  rv.components.push(...components);
  rv.types.push(...types);

  return rv;
}

function getAnnotation(name: string, annotations: Annotation[]): Annotation | undefined {
  const result = annotations.filter(a => a.name.value == name)[0];
  return result;
}

function reduceType(type: Type, annotations: Annotation[] = []): TypeSignature {
  switch (type.getKind()) {
    case Kind.Named: {
      const t = type as Named;
      const name = t.name;
      if (isWidlType(name.value)) {
        return { type: name.value };
      } else {
        const link = getAnnotation('provider', annotations);
        if (name.value === 'link') {
          if (link) {
            const provider = link.arguments[0];
            return {
              type: 'link',
              provider: provider.value.getValue(),
            };
          } else {
            return {
              type: 'link',
            };
          }
        } else if (name.value === 'struct') {
          // TODO: convert this to core WIDL type once widl can represent it (see also: https://github.com/wapc/cli/issues/8)
          return { type: 'struct' };
        } else {
          return { type: 'ref', ref: `#/types/${name.value}` };
        }
      }
    }
    case Kind.MapType: {
      const t = type as MapType;
      return {
        type: 'map',
        key: reduceType(t.keyType, annotations),
        value: reduceType(t.valueType, annotations),
      };
    }
    case Kind.ListType: {
      const t = type as ListType;
      return {
        type: 'list',
        element: reduceType(t.type, annotations),
      };
    }
    case Kind.Optional: {
      const t = type as Optional;
      return {
        type: 'optional',
        option: reduceType(t.type, annotations),
      };
    }
  }
  throw new Error(`Unhandled type: ${type.getKind()}`);
}

function interpret(doc: Document): [ComponentSignature, StructSignature[]] {
  const types = doc.definitions.filter(isType);
  const input_def = findByName(types, 'Inputs');
  const output_def = findByName(types, 'Outputs');
  const namespace = doc.definitions.find(def => def.isKind(Kind.NamespaceDefinition));
  if (!namespace) throw new Error('Component schemas must define a namespace to use as the component name');
  if (!input_def) throw new Error('Component schemas must include a type definition named "Inputs"');
  if (!output_def) throw new Error('Component schemas must include a type definition named "Outputs"');

  const inputs: TypeMap = Object.fromEntries(
    input_def.fields.map(field => {
      return [field.name.value, reduceType(field.type, field.annotations)];
    }),
  );

  const outputs = Object.fromEntries(
    output_def.fields.map(field => {
      return [field.name.value, reduceType(field.type, field.annotations)];
    }),
  );

  const component: ComponentSignature = {
    name: (namespace as NamespaceDefinition).name.value,
    inputs,
    outputs,
  };

  const typeSignatures = types
    .filter(t => t.name.value !== 'Inputs' && t.name.value !== 'Outputs')
    .map(t => reduceTypeDefinition(t));
  return [component, typeSignatures];
}

function isType(def: Definition): def is TypeDefinition {
  return def.isKind(Kind.TypeDefinition);
}

interface HasName extends AbstractNode {
  name: { value: string };
}

function findByName<T extends HasName>(defs: T[], name: string): T | undefined {
  return defs.find(def => def.name.value === name);
}

function reduceTypeDefinition(def: TypeDefinition): StructSignature {
  const fields: Record<string, TypeSignature> = {};
  for (const field of def.fields) {
    fields[field.name.value] = reduceType(field.type, field.annotations);
  }

  return {
    name: def.name.value,
    fields,
  };
}
