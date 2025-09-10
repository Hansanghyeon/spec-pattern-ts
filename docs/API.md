# spec-pattern-ts API Documentation

## Overview

spec-pattern-ts v3.0 provides a complete TypeScript implementation of the Specification Pattern with full composability and type safety.

## Core Interfaces

### ISpecification<TContext>

The main interface for all specifications. Requires a context object with specific properties.

```typescript
interface ISpecification<TContext extends Record<string, any>> {
  isSatisfiedBy(candidate: TContext): boolean
  is(candidate: TContext): boolean
  and<TOther>(other: ISpecification<TOther>): ISpecification<TContext & TOther>
  or<TOther>(other: ISpecification<TOther>): ISpecification<TContext | TOther>
  not(): ISpecification<TContext>
}
```

#### Methods

##### `isSatisfiedBy(candidate: TContext): boolean`
Checks if the candidate satisfies the specification.

- **Parameters**: `candidate` - The context object to validate
- **Returns**: `true` if specification is satisfied, `false` otherwise

##### `is(candidate: TContext): boolean`
Alias for `isSatisfiedBy()` providing a more concise syntax.

- **Parameters**: `candidate` - The context object to validate
- **Returns**: `true` if specification is satisfied, `false` otherwise
- **Example**:
  ```typescript
  const isValid = spec.is(data); // Same as spec.isSatisfiedBy(data)
  ```

##### `and<TOther>(other: ISpecification<TOther>): ISpecification<TContext & TOther>`
Creates a composite specification that requires both specifications to be satisfied.

- **Parameters**: `other` - Another specification to combine with AND logic
- **Returns**: A new specification requiring both conditions
- **Type Safety**: Result type is the intersection of both context types

##### `or<TOther>(other: ISpecification<TOther>): ISpecification<TContext | TOther>`
Creates a composite specification where at least one specification must be satisfied.

- **Parameters**: `other` - Another specification to combine with OR logic
- **Returns**: A new specification requiring at least one condition
- **Type Safety**: Result type is the union of both context types

##### `not(): ISpecification<TContext>`
Creates a specification that inverts the current specification's result.

- **Returns**: A new specification with inverted logic

## Factory Functions

### Spec<T, K>

Creates a single-key specification that validates one property.

```typescript
function Spec<T, K extends string>(
  key: K,
  predicate: (value: T) => boolean
): ISpecification<{ [P in K]: T }>
```

#### Parameters
- `key`: The property name to validate
- `predicate`: Function that validates the property value

#### Example
```typescript
const isAdult = Spec('user', (u: User) => u.age >= 18)
const isActive = Spec('account', (a: Account) => a.status === 'active')
```

### CompositeSpec<TContext>

Creates a specification that can validate multiple properties at once.

```typescript
function CompositeSpec<TContext extends Record<string, any>>(
  predicate: (context: TContext) => boolean
): ISpecification<TContext>
```

#### Parameters
- `predicate`: Function that validates the entire context object

#### Example
```typescript
interface OrderContext {
  user: User
  cart: Cart
  payment: Payment
}

const canCheckout = CompositeSpec<OrderContext>(ctx => {
  return ctx.user.verified && 
         ctx.cart.items.length > 0 && 
         ctx.payment.authorized
})
```

### define<T>

Creates a specification builder for fluent API usage.

```typescript
function define<T>(predicate: (value: T) => boolean): SpecBuilder<T>
```

#### Example
```typescript
const isPositive = define<number>(n => n > 0).as('value')
const isPremium = define<User>(u => u.tier === 'premium').as('user')
```

## Utility Functions

### allOf<TContext>

Creates a specification where all provided specifications must be satisfied.

```typescript
function allOf<TContext extends Record<string, any>>(
  ...specs: ISpecification<any>[]
): ISpecification<TContext>
```

#### Example
```typescript
const strictValidation = allOf(
  isLoggedIn,
  isEmailVerified,
  isActive,
  hasPaymentMethod
)
```

### anyOf<TContext>

Creates a specification where at least one specification must be satisfied.

```typescript
function anyOf<TContext extends Record<string, any>>(
  ...specs: ISpecification<any>[]
): ISpecification<TContext>
```

#### Example
```typescript
const eligibleForDiscount = anyOf(
  isVIPMember,
  isFirstPurchase,
  hasSpecialCoupon,
  isBirthdayMonth
)
```

### not<TContext>

Creates a specification that inverts the given specification.

```typescript
function not<TContext extends Record<string, any>>(
  spec: ISpecification<TContext>
): ISpecification<TContext>
```

#### Example
```typescript
const accessAllowed = allOf(
  not(isBanned),
  not(isExpired),
  not(isInactive)
)
```

## Classes

### SpecBuilder<T>

Builder class for creating specifications with fluent API.

```typescript
class SpecBuilder<T> {
  constructor(predicate: (value: T) => boolean)
  as<K extends string>(key: K): ISpecification<{ [P in K]: T }>
}
```

#### Methods

##### `as<K>(key: K): ISpecification<{ [P in K]: T }>`
Assigns the predicate to a specific property key.

- **Parameters**: `key` - The property name to validate
- **Returns**: A specification for the given key

## Type Safety

The library ensures complete type safety through TypeScript's type system:

```typescript
const userSpec = Spec('user', (u: User) => u.active)
const productSpec = Spec('product', (p: Product) => p.available)
const paymentSpec = Spec('payment', (p: Payment) => p.valid)

const combined = userSpec.and(productSpec).and(paymentSpec)
// Type: ISpecification<{ user: User } & { product: Product } & { payment: Payment }>

// ✅ Correct usage
combined.isSatisfiedBy({ user, product, payment })

// ❌ Compile error - missing required properties
combined.isSatisfiedBy({ user, product })
```

## Advanced Patterns

### Nested Compositions

```typescript
const complexPermission = isAdmin.or(
  isLoggedIn.and(isApproved.or(isPremium)).and(isActive)
)
```

### Dynamic Specification Building

```typescript
function buildAccessSpec(requirements: AccessRequirements) {
  const specs: ISpecification<any>[] = []
  
  if (requirements.requireLogin) {
    specs.push(isLoggedIn)
  }
  
  if (requirements.requireVerification) {
    specs.push(isEmailVerified)
  }
  
  if (requirements.minimumAge) {
    specs.push(Spec('user', u => u.age >= requirements.minimumAge))
  }
  
  return specs.length > 0 ? allOf(...specs) : alwaysTrue
}
```

### Reusable Specification Libraries

```typescript
// auth-specs.ts
export const AuthSpecs = {
  isLoggedIn: Spec('user', (u: User) => u.isLoggedIn),
  isEmailVerified: Spec('user', (u: User) => u.emailVerified),
  isAdmin: Spec('user', (u: User) => u.role === 'admin'),
  hasValidSession: Spec('session', (s: Session) => s.expiresAt > Date.now())
}

// product-specs.ts
export const ProductSpecs = {
  isAvailable: Spec('product', (p: Product) => p.stock > 0),
  isPublished: Spec('product', (p: Product) => p.status === 'published'),
  isPriceValid: Spec('product', (p: Product) => p.price > 0)
}

// Usage
import { AuthSpecs, ProductSpecs } from './specs'

const canPurchase = allOf(
  AuthSpecs.isLoggedIn,
  ProductSpecs.isAvailable,
  ProductSpecs.isPriceValid
)
```

## Performance Considerations

- Specifications use short-circuit evaluation for AND/OR operations
- Minimal object creation during composition
- Type checking happens only at compile time
- Consider caching specification results for expensive predicates

## Best Practices

1. **Name specifications clearly**: Use descriptive names that express the business rule
2. **Keep predicates simple**: Complex logic should be broken into multiple specifications
3. **Compose specifications**: Build complex rules from simple, reusable specifications
4. **Type your contexts**: Always provide proper TypeScript types for better IDE support
5. **Use utility functions**: Prefer `allOf`, `anyOf`, and `not` for common patterns
6. **Cache expensive checks**: Store results of database queries or API calls