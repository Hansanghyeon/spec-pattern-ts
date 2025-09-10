# Project Structure

## Overview

spec-pattern-ts is organized as a TypeScript library with comprehensive examples and documentation.

```
spec-pattern-ts/
├── src/                    # Source code
├── lib/                    # Compiled output (generated)
├── example/                # Usage examples
├── docs/                   # Documentation
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Main documentation
```

## Directory Details

### `/src` - Source Code

Core implementation files:

- **`index.ts`** - Main entry point, exports v3 specification
- **`specification-v3.ts`** - Current version implementation
  - `ISpecification<TContext>` interface
  - Base classes and implementations
  - Factory functions and utilities
- **`specification-v2.ts`** - Previous version (maintained for compatibility)
- **`specification-v1.ts`** - Original version (maintained for compatibility)

### `/lib` - Build Output

Generated during build process:

- **`index.js`** - UMD bundle for browser usage
- **`index.cjs`** - CommonJS bundle for Node.js
- **`index.mjs`** - ES modules bundle
- **`index.d.ts`** - TypeScript type definitions

### `/example` - Examples

Demonstration code:

- **`v3-demo.ts`** - Comprehensive v3 feature demonstrations
- **`v3-test.ts`** - Test cases and validation examples
- **`product.spec.ts`** - Real-world product specification example
- **`product.ts`** - Product model used in examples
- **`v2-v3-comparison.ts`** - Migration guide with comparisons
- **`v2-example.ts`** - Legacy v2 examples
- **`v2-quick-demo.ts`** - Quick v2 demonstration

### `/docs` - Documentation

Additional documentation:

- **`API.md`** - Complete API reference
- **`PROJECT-STRUCTURE.md`** - This file
- **`MIGRATION-GUIDE.md`** - Guide for migrating between versions
- **`V1-VS-V2.md`** - Comparison between v1 and v2
- **`V2-VS-V3.md`** - Comparison between v2 and v3

## Build Configuration

### Package.json Scripts

```json
{
  "build": "nanobundle build src/index.ts && bun run build:umd",
  "build:umd": "npx esbuild src/index.ts --bundle --format=iife --global-name=SpecPattern --outfile=lib/index.js --sourcemap --external:tslib",
  "prepublishOnly": "bun run build"
}
```

### TypeScript Configuration

The project uses TypeScript 5.0+ with the following key settings:

- Target: Modern JavaScript
- Module: ES modules with CommonJS interop
- Strict type checking enabled
- Declaration files generated

### Export Configuration

The package supports multiple module formats:

```json
{
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "require": "./lib/index.cjs",
      "import": "./lib/index.mjs",
      "default": "./lib/index.js"
    }
  }
}
```

## Development Workflow

1. **Source Code**: Edit files in `/src`
2. **Build**: Run `bun run build` to compile
3. **Test**: Use examples in `/example` to verify functionality
4. **Documentation**: Update `/docs` as needed
5. **Publish**: `npm publish` (runs build automatically)

## Key Files

### Entry Points

- **Main**: `lib/index.cjs` (CommonJS)
- **Module**: `lib/index.mjs` (ES Modules)
- **Browser**: `lib/index.js` (UMD)
- **Types**: `lib/index.d.ts` (TypeScript)

### Configuration

- **package.json**: NPM package configuration
- **tsconfig.json**: TypeScript compiler options
- **.gitignore**: Git ignore patterns
- **LICENSE**: MIT license

## Version History

- **v3.x**: Current version with full composability
- **v2.x**: Previous version with limited composition
- **v1.x**: Original implementation

## Dependencies

### Runtime
- No runtime dependencies (zero-dependency library)

### Development
- **typescript**: ^5.0.0 (peer dependency)
- **bun-types**: ^1.2.19
- **esbuild**: ^0.24.2
- **nanobundle**: ^1.6.0

## Publishing

The package is published to:
- **NPM**: https://www.npmjs.com/package/spec-pattern-ts
- **GitHub Packages**: @hansanghyeon/spec-pattern-ts

Files included in the published package:
- `/lib` - All compiled outputs
- `/docs/MIGRATION-GUIDE.md` - Migration documentation