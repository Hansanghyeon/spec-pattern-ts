# spec-pattern-ts Documentation Index

## 📚 Documentation Overview

Welcome to the spec-pattern-ts documentation. This index provides quick access to all documentation resources.

## 🚀 Getting Started

- **[README](../README.md)** - Project overview and quick start guide
- **[Enhanced README](../README-ENHANCED.md)** - Comprehensive guide with navigation
- **[Installation & Setup](#)** - Detailed installation instructions

## 📖 Core Documentation

### API Reference
- **[Complete API Documentation](API.md)** - Detailed API reference for all functions and interfaces
  - [ISpecification Interface](API.md#ispecificationtcontext)
  - [Factory Functions](API.md#factory-functions)
  - [Utility Functions](API.md#utility-functions)
  - [Advanced Patterns](API.md#advanced-patterns)

### Architecture & Structure
- **[Project Structure](PROJECT-STRUCTURE.md)** - Directory layout and file organization
  - Source code organization
  - Build configuration
  - Development workflow

### Migration Guides
- **[Migration Guide](MIGRATION-GUIDE.md)** - Upgrading between versions
- **[V1 vs V2 Comparison](V1-VS-V2.md)** - Differences between v1 and v2
- **[V2 vs V3 Comparison](V2-VS-V3.md)** - Differences between v2 and v3

## 💡 Examples & Tutorials

### Basic Examples
- **[V3 Demo](../example/v3-demo.ts)** - Comprehensive v3 feature demonstrations
- **[V3 Test Cases](../example/v3-test.ts)** - Test scenarios and validation

### Real-World Examples
- **[Product Specifications](../example/product.spec.ts)** - E-commerce product rules
- **[Product Model](../example/product.ts)** - Supporting data models

### Legacy Examples
- **[V2 Examples](../example/v2-example.ts)** - Previous version examples
- **[V2 Quick Demo](../example/v2-quick-demo.ts)** - Quick v2 demonstration
- **[V2-V3 Comparison](../example/v2-v3-comparison.ts)** - Side-by-side comparison

## 🎯 Use Case Guides

### Common Patterns

#### Authentication & Authorization
```typescript
const isAuthenticated = Spec('user', u => u.isLoggedIn)
const hasPermission = (perm: string) => 
  Spec('user', u => u.permissions.includes(perm))

const canAccessAdmin = allOf(
  isAuthenticated,
  hasPermission('admin:read')
)
```

#### Business Rules
```typescript
const businessHours = Spec('time', t => t.hour >= 9 && t.hour < 17)
const weekday = Spec('time', t => t.day >= 1 && t.day <= 5)
const isOpen = businessHours.and(weekday)
```

#### Validation Rules
```typescript
const validEmail = Spec('email', e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
const strongPassword = Spec('password', p => p.length >= 8 && /[A-Z]/.test(p))
const validCredentials = validEmail.and(strongPassword)
```

## 🛠️ Advanced Topics

### Performance Optimization
- Short-circuit evaluation strategies
- Caching specification results
- Minimizing object allocations

### Type Safety
- Leveraging TypeScript's type system
- Generic constraints and inference
- Compile-time validation

### Testing Strategies
- Unit testing specifications
- Integration testing with business logic
- Property-based testing approaches

## 📋 Quick Reference

### Cheat Sheet

```typescript
// Basic specs
const spec = Spec('key', value => condition)

// Composition
const and = spec1.and(spec2)
const or = spec1.or(spec2)
const not = spec.not()

// Utilities
const all = allOf(spec1, spec2, spec3)
const any = anyOf(spec1, spec2, spec3)

// Composite specs
const complex = CompositeSpec(ctx => multiPropertyValidation)

// Builder pattern
const built = define(predicate).as('key')

// Alias methods
spec.is(data)           // Same as isSatisfiedBy
spec.isSatisfiedBy(data) // Traditional method
```

### Common Imports

```typescript
import { 
  Spec,           // Single property specification
  CompositeSpec,  // Multi-property specification
  allOf,          // All must be satisfied
  anyOf,          // At least one must be satisfied
  not,            // Negation
  define          // Builder pattern
} from 'spec-pattern-ts'
```

## 🔗 External Resources

- **[GitHub Repository](https://github.com/hansanghyeon/spec-pattern-ts)**
- **[NPM Package](https://www.npmjs.com/package/spec-pattern-ts)**
- **[Issue Tracker](https://github.com/hansanghyeon/spec-pattern-ts/issues)**

## 📝 Contributing

- [Contributing Guidelines](https://github.com/hansanghyeon/spec-pattern-ts/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/hansanghyeon/spec-pattern-ts/blob/main/CODE_OF_CONDUCT.md)

---

<div align="center">

**Need help?** Open an [issue](https://github.com/hansanghyeon/spec-pattern-ts/issues) or check existing discussions.

</div>