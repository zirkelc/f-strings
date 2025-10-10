# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript utility library called "f-strings" that provides conditional template literal functionality with automatic dedentation for cleaner string formatting. The main features include conditional blocks, lazy evaluation, and automatic indentation removal.

## Core Commands

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run linting and auto-fix
pnpm lint

# Run tests for specific file or pattern
pnpm test src/f-strings.test.ts
```

## Architecture

The project exports a template literal utility with conditional logic:

- **Main entry**: `src/index.ts` - exports everything from f-strings module
- **Core implementation**: `src/f-strings.ts` - Contains the `f` tagged template function and control symbols (`If`, `Else`, `EndIf`)
- **Tests**: `src/f-strings.test.ts` - Comprehensive test suite using Vitest

### Key Components

1. **Tagged Template Function (`f`)**: Processes template literals with conditional blocks using a single-pass algorithm and applies automatic dedentation
2. **Control Symbols**: `If(condition)`, `Else()`, and `EndIf()` provide flow control within template literals
3. **Lazy Evaluation**: Functions in template expressions are only called if their surrounding condition evaluates to true
4. **Automatic Dedentation**: Removes minimum common indentation from all lines and trims leading/trailing whitespace (matching behavior of the popular `dedent` npm package)

## Build System

- **tsdown**: Handles TypeScript compilation and bundling, configured to output ESM format
- **Biome**: Used for linting and formatting with single quotes, semicolons, and trailing commas
- **Vitest**: Test runner with inline snapshot support
