# spec-pattern-ts

## METADATA
- NAME: spec-pattern-ts
- VERSION: 3.2.4
- TYPE: TypeScript Library
- LICENSE: MIT
- REPOSITORY: https://github.com/hansanghyeon/spec-pattern-ts
- LANGUAGE: TypeScript
- DEPENDENCIES: 0 (zero dependencies)
- BUNDLE_SIZE: ~5KB minified
- COMPATIBILITY: TypeScript 5.0+, Node.js 14+
- MODULE_SYSTEMS: CommonJS, ES Modules, UMD

## DESCRIPTION
A TypeScript implementation of the Specification Pattern that enables perfect composability for business rule validation. The library allows unlimited composition of specifications while maintaining complete type safety.

## KEY_FEATURES
- PERFECT_COMPOSABILITY: All specifications can be combined without limitations
- TYPE_SAFETY: Full TypeScript type inference and checking
- ZERO_DEPENDENCIES: No external runtime dependencies
- SMALL_FOOTPRINT: Minimal bundle size for production use
- INTUITIVE_API: Natural expression of business logic
- FLEXIBLE_MODULES: Support for multiple module systems

## CORE_CONCEPTS

### SPECIFICATION_PATTERN
The Specification Pattern encapsulates business rules in reusable, composable units. Each specification represents a single business rule that can be combined with others using logical operators (AND, OR, NOT).

### SINGLE_RESPONSIBILITY
Each specification handles one business rule only. Complex rules are built by composing simple specifications.

### TYPE_INFERENCE
TypeScript automatically tracks all required context properties through the composition chain, ensuring compile-time safety.

## API_REFERENCE

### MAIN_INTERFACE
```typescript
interface ISpecification<TContext> {
  isSatisfiedBy(candidate: TContext): boolean
  is(candidate: TContext): boolean  // alias for isSatisfiedBy
  and<TOther>(other: ISpecification<TOther>): ISpecification<TContext & TOther>
  or<TOther>(other: ISpecification<TOther>): ISpecification<TContext | TOther>
  not(): ISpecification<TContext>
}
```

### FACTORY_FUNCTIONS

#### Spec
- PURPOSE: Create single-property specification
- SIGNATURE: `Spec<K, V>(key: K, predicate: (value: V) => boolean): ISpecification<Record<K, V>>`
- USAGE: Validates a single property in the context

#### CompositeSpec
- PURPOSE: Create multi-property specification
- SIGNATURE: `CompositeSpec<TContext>(predicate: (context: TContext) => boolean): ISpecification<TContext>`
- USAGE: Validates multiple properties simultaneously

### UTILITY_FUNCTIONS

#### allOf
- PURPOSE: Combine specifications with AND logic
- SIGNATURE: `allOf<T>(...specs: ISpecification<T>[]): ISpecification<T>`
- BEHAVIOR: All specifications must be satisfied

#### anyOf
- PURPOSE: Combine specifications with OR logic
- SIGNATURE: `anyOf<T>(...specs: ISpecification<T>[]): ISpecification<T>`
- BEHAVIOR: At least one specification must be satisfied

#### not
- PURPOSE: Negate a specification
- SIGNATURE: `not<T>(spec: ISpecification<T>): ISpecification<T>`
- BEHAVIOR: Specification must not be satisfied

#### define
- PURPOSE: Builder pattern for specification creation
- SIGNATURE: `define<V>(predicate: (value: V) => boolean): { as<K>(key: K): ISpecification<Record<K, V>> }`
- USAGE: Fluent interface for specification definition

## USAGE_EXAMPLES

### BASIC_USAGE
```typescript
// Define types
interface User {
  age: number
  role: string
  status: string
}

// Create specifications
const isAdult = Spec('user', (u: User) => u.age >= 18)
const isMember = Spec('user', (u: User) => u.role !== 'guest')
const isActive = Spec('user', (u: User) => u.status === 'active')

// Compose specifications
const canAccess = isAdult.and(isMember).and(isActive)

// Use specification
const user = { age: 25, role: 'member', status: 'active' }
if (canAccess.is({ user })) {
  // Access granted
}
```

### COMPLEX_COMPOSITION
```typescript
// Multiple contexts
const isAdmin = Spec('user', u => u.role === 'admin')
const isOwner = CompositeSpec<{ user: User; resource: Resource }>(
  ctx => ctx.resource.ownerId === ctx.user.id
)

// Nested composition
const canEdit = isAdmin.or(
  isOwner.and(
    Spec('resource', r => !r.locked)
  )
)

// Using utility functions
const canPurchase = allOf(
  Spec('user', u => u.isLoggedIn),
  Spec('user', u => u.age >= 18),
  Spec('payment', p => p.method !== null)
)

const eligibleForDiscount = anyOf(
  Spec('user', u => u.tier === 'vip'),
  Spec('order', o => o.isFirstPurchase),
  Spec('coupon', c => c.type === 'special')
)
```

## COMMON_PATTERNS

### ACCESS_CONTROL
```typescript
const hasRole = (role: string) => 
  Spec('user', (u: User) => u.roles.includes(role))

const canViewReports = anyOf(
  hasRole('admin'),
  hasRole('manager'),
  hasRole('analyst')
)

const canEditUsers = hasRole('admin')
  .and(Spec('user', u => u.permissions.includes('user:write')))
  .and(not(Spec('user', u => u.suspended)))
```

### VALIDATION_RULES
```typescript
const isValidEmail = Spec('email', (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
const isStrongPassword = Spec('password', (p: string) => p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p))
const isValidAge = Spec('age', (a: number) => a >= 0 && a <= 120)

const isValidRegistration = allOf(isValidEmail, isStrongPassword, isValidAge)
```

### BUSINESS_RULES
```typescript
// E-commerce
const canCheckout = allOf(
  Spec('cart', c => c.items.length > 0),
  Spec('cart', c => c.total > 0),
  Spec('user', u => u.verified),
  Spec('payment', p => p.authorized)
)

// Content publishing
const canPublish = Spec('user', u => u.role === 'author')
  .and(Spec('content', c => c.status === 'draft'))
  .or(
    Spec('user', u => u.role === 'editor')
    .and(Spec('content', c => c.reviewed))
  )
```

## MIGRATION_GUIDE

### FROM_V2_TO_V3
- V3 is fully backward compatible with V2
- Main improvement: Unlimited composition depth
- No API changes required
- Import path remains the same

### FROM_V1_TO_V3
- Replace class-based specifications with factory functions
- Update method calls from `new Spec()` to `Spec()`
- Migrate custom specification classes to CompositeSpec

## PERFORMANCE_CHARACTERISTICS
- SHORT_CIRCUIT_EVALUATION: AND/OR operations stop at first deterministic result
- MINIMAL_OBJECT_CREATION: Optimized composition with minimal overhead
- COMPILE_TIME_TYPE_CHECKING: No runtime type checking overhead
- MEMORY_EFFICIENT: Small memory footprint, no caching or state

## ERROR_HANDLING
- TYPE_ERRORS: Caught at compile time via TypeScript
- RUNTIME_ERRORS: Predicate exceptions propagate to caller
- NULL_SAFETY: Predicates should handle null/undefined values

## TESTING_STRATEGY
```typescript
// Unit test individual specifications
describe('isAdult', () => {
  it('should return true for age >= 18', () => {
    expect(isAdult.is({ user: { age: 18 } })).toBe(true)
  })
})

// Integration test compositions
describe('canAccess', () => {
  it('should require all conditions', () => {
    const validUser = { age: 25, role: 'member', status: 'active' }
    expect(canAccess.is({ user: validUser })).toBe(true)
    
    const invalidUser = { age: 17, role: 'member', status: 'active' }
    expect(canAccess.is({ user: invalidUser })).toBe(false)
  })
})
```

## BEST_PRACTICES
1. SINGLE_RESPONSIBILITY: One rule per specification
2. MEANINGFUL_NAMES: Use descriptive names for specifications
3. COMPOSITION_OVER_INHERITANCE: Build complex rules through composition
4. TYPE_SAFETY: Leverage TypeScript's type system fully
5. IMMUTABILITY: Specifications should be pure functions
6. TESTABILITY: Test specifications in isolation and composition

## LIMITATIONS
- No async/await support in predicates
- No built-in memoization
- No serialization/deserialization support
- No runtime type validation

## CONTRIBUTING
- ISSUES: Report bugs and request features via GitHub Issues
- PULL_REQUESTS: Submit PRs with tests and documentation
- CODING_STANDARDS: Follow existing TypeScript conventions
- TESTING: Maintain 100% test coverage

## RELATED_PATTERNS
- Strategy Pattern
- Chain of Responsibility
- Composite Pattern
- Interpreter Pattern

## ALTERNATIVES
- joi (schema validation)
- yup (object schema validation)
- class-validator (decorator-based validation)
- zod (TypeScript-first schema validation)

## CHANGELOG

### V3.2.4 (Current)
- GitHub Packages publishing support
- Bun compatibility improvements

### V3.0.0
- Unlimited composition depth
- Improved type inference
- Performance optimizations

### V2.0.0
- Factory function approach
- Enhanced type safety
- Utility functions (allOf, anyOf, not)

### V1.0.0
- Initial release
- Class-based implementation
- Basic AND/OR/NOT operations

## SUPPORT
- DOCUMENTATION: https://github.com/hansanghyeon/spec-pattern-ts
- ISSUES: https://github.com/hansanghyeon/spec-pattern-ts/issues
- NPM: https://www.npmjs.com/package/spec-pattern-ts
- GITHUB_PACKAGES: https://github.com/hansanghyeon/spec-pattern-ts/packages

## KEYWORDS
specification-pattern, business-rules, validation, typescript, composable, type-safe, domain-driven-design, ddd, rules-engine, predicate, composition

## END_OF_DOCUMENT