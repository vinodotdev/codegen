# Vino codegen

This is the core code generator for [Vino](https://vino.dev) components and providers.

## Installation

```shell
$ npm install -g @vinodotdev/codegen
```

## Usage

Run `vino-codegen` to get a list of languages available to generate. Use `--help` on any of the languages to dive further:

```shell
$ vino-codegen rust --help
vino-codegen rust

Generate Rust code from a WIDL schema

Commands:
  vino-codegen rust undefined <schema> [options]
  vino-codegen rust provider-component-module <schema_dir> [options]
  vino-codegen rust provider-component <schema> [options]
  vino-codegen rust provider-integration <schema_dir> [options]
  vino-codegen rust wapc-component <schema> [options]
  vino-codegen rust wapc-component-module <schema_dir> [options]
  vino-codegen rust wapc-integration <schema_dir> [options]
  vino-codegen rust wapc-lib <schema_dir> [options]

Options:
      --version  Show version number
  -h, --help     Show help
```

### Testing and debugging

Run tests via

```
$ npm run tests
```

Tests for the generated code are accounted for in downstream consumers but this repository should have some baseline tests. THis would be a great first issue for anyone interested.
