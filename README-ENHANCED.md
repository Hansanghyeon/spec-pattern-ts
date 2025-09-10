# spec-pattern-ts

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/spec-pattern-ts.svg)](https://www.npmjs.com/package/spec-pattern-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json)

**완벽한 조합이 가능한 TypeScript Specification Pattern 구현**

[API 문서](docs/API.md) | [프로젝트 구조](docs/PROJECT-STRUCTURE.md) | [마이그레이션 가이드](docs/MIGRATION-GUIDE.md) | [예제](example/)

</div>

## 목차

- [특징](#특징)
- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [핵심 개념](#핵심-개념)
- [API 레퍼런스](#api-레퍼런스)
- [실전 예제](#실전-예제)
- [마이그레이션](#마이그레이션)
- [성능](#성능)
- [기여하기](#기여하기)

## 특징

✨ **v3의 핵심 개선사항**

- 🔗 **완벽한 조합성**: 모든 스펙을 무제한으로 조합 가능
- 🛡️ **타입 안전성**: TypeScript의 강력한 타입 시스템 활용
- 🚀 **제로 의존성**: 외부 라이브러리 없이 독립적으로 동작
- 📦 **작은 번들 크기**: 최적화된 코드로 빠른 로딩
- 🎯 **직관적인 API**: 비즈니스 로직을 자연스럽게 표현
- 🔧 **유연한 모듈 시스템**: CommonJS, ES Modules, UMD 지원

## 설치

```bash
# npm
npm install spec-pattern-ts

# yarn
yarn add spec-pattern-ts

# pnpm
pnpm add spec-pattern-ts

# bun
bun add spec-pattern-ts
```

## 빠른 시작

### 기본 사용법

```typescript
import { Spec } from 'spec-pattern-ts'

// 타입 정의
interface User {
  age: number
  role: string
  status: string
}

// 스펙 정의
const isAdult = Spec('user', (u: User) => u.age >= 18)
const isMember = Spec('user', (u: User) => u.role !== 'guest')
const isActive = Spec('user', (u: User) => u.status === 'active')

// 조합
const canAccess = isAdult.and(isMember).and(isActive)

// 사용
const user = { age: 25, role: 'member', status: 'active' }

if (canAccess.is({ user })) {
  // 접근 허용
}
```

### 복잡한 비즈니스 로직

```typescript
import { Spec, CompositeSpec, allOf, anyOf, not } from 'spec-pattern-ts'

// 권한 시스템
const isAdmin = Spec('user', u => u.role === 'admin')
const isOwner = CompositeSpec<{ user: User; resource: Resource }>(
  ctx => ctx.resource.ownerId === ctx.user.id
)

// 접근 권한 - 관리자이거나 소유자
const canEdit = isAdmin.or(isOwner)

// 구매 조건 - 로그인하고 성인이며 결제수단이 있어야 함
const canPurchase = allOf(
  Spec('user', u => u.isLoggedIn),
  Spec('user', u => u.age >= 18),
  Spec('payment', p => p.method !== null)
)

// 할인 조건 - VIP이거나 첫 구매이거나 특별 쿠폰 보유
const eligibleForDiscount = anyOf(
  Spec('user', u => u.tier === 'vip'),
  Spec('order', o => o.isFirstPurchase),
  Spec('coupon', c => c.type === 'special')
)
```

## 핵심 개념

### 1. 단일 책임 스펙

각 스펙은 하나의 비즈니스 규칙만 담당합니다:

```typescript
const isAdult = Spec('age', (age: number) => age >= 18)
const hasEmail = Spec('email', (email: string) => email.includes('@'))
const isVerified = Spec('verified', (verified: boolean) => verified)
```

### 2. 스펙 조합

복잡한 규칙은 간단한 스펙들의 조합으로 표현합니다:

```typescript
// AND 조합
const validUser = isAdult.and(hasEmail).and(isVerified)

// OR 조합
const canComment = isMember.or(isGuest.and(hasEmail))

// NOT 조합
const notBanned = not(isBanned)

// 복잡한 중첩
const complexRule = isAdmin.or(
  isMember.and(isVerified).and(notBanned)
)
```

### 3. 타입 안전성

TypeScript가 필요한 모든 속성을 추적합니다:

```typescript
const userSpec = Spec('user', (u: User) => u.active)
const productSpec = Spec('product', (p: Product) => p.available)

const combined = userSpec.and(productSpec)
// 타입: ISpecification<{ user: User } & { product: Product }>

// ✅ 올바른 사용
combined.is({ user: myUser, product: myProduct })

// ❌ 컴파일 에러 - product 누락
combined.is({ user: myUser })
```

## API 레퍼런스

### 주요 인터페이스

#### ISpecification<TContext>

```typescript
interface ISpecification<TContext> {
  isSatisfiedBy(candidate: TContext): boolean
  is(candidate: TContext): boolean  // isSatisfiedBy의 별칭
  and<TOther>(other: ISpecification<TOther>): ISpecification<TContext & TOther>
  or<TOther>(other: ISpecification<TOther>): ISpecification<TContext | TOther>
  not(): ISpecification<TContext>
}
```

### 팩토리 함수

#### Spec

단일 속성을 검증하는 스펙을 생성합니다:

```typescript
const isExpensive = Spec('price', (price: number) => price > 100)
const isAvailable = Spec('stock', (stock: number) => stock > 0)
```

#### CompositeSpec

여러 속성을 동시에 검증하는 스펙을 생성합니다:

```typescript
interface OrderContext {
  user: User
  cart: Cart
  payment: Payment
}

const canCheckout = CompositeSpec<OrderContext>(ctx => {
  return ctx.user.verified && 
         ctx.cart.total > 0 && 
         ctx.payment.authorized
})
```

### 유틸리티 함수

- `allOf(...specs)` - 모든 스펙이 만족되어야 함
- `anyOf(...specs)` - 하나 이상의 스펙이 만족되어야 함
- `not(spec)` - 스펙이 만족되지 않아야 함
- `define(predicate).as(key)` - 빌더 패턴으로 스펙 생성

[전체 API 문서 보기](docs/API.md)

## 실전 예제

### 전자상거래 시스템

```typescript
// 제품 구매 가능 여부
const isInStock = Spec('product', (p: Product) => p.stock > 0)
const isPublished = Spec('product', (p: Product) => p.status === 'published')
const isPriceValid = Spec('product', (p: Product) => p.price > 0)

const canBePurchased = allOf(isInStock, isPublished, isPriceValid)

// 할인 적용 조건
const isVIP = Spec('customer', (c: Customer) => c.tier === 'vip')
const isLargeOrder = Spec('order', (o: Order) => o.total > 1000)
const hasPromoCode = Spec('promo', (p: PromoCode) => p.valid)

const discountEligible = anyOf(isVIP, isLargeOrder, hasPromoCode)
```

### 권한 관리 시스템

```typescript
// 역할 기반 접근 제어
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

### 콘텐츠 발행 시스템

```typescript
// 콘텐츠 발행 조건
const isAuthor = Spec('user', (u: User) => u.role === 'author')
const isEditor = Spec('user', (u: User) => u.role === 'editor')
const isDraft = Spec('content', (c: Content) => c.status === 'draft')
const isReviewed = Spec('content', (c: Content) => c.reviewedAt !== null)

// 작성자는 초안만, 편집자는 검토된 콘텐츠만 발행 가능
const canPublish = isAuthor.and(isDraft)
  .or(isEditor.and(isReviewed))
```

더 많은 예제는 [example 디렉토리](example/)를 참고하세요.

## 마이그레이션

### v2에서 v3로

v3는 v2와 완전히 호환됩니다:

```typescript
// 기존 v2 코드가 그대로 동작
import { Spec } from 'spec-pattern-ts'

// v2의 한계 - 복합 스펙 재조합 불가
const complexSpec = spec1.and(spec2) // OK
const moreComplex = complexSpec.and(spec3) // v2에서는 에러!

// v3에서는 모든 조합이 가능
const unlimited = spec1.and(spec2).or(spec3).and(spec4.not())
```

[전체 마이그레이션 가이드](docs/MIGRATION-GUIDE.md)

## 성능

- ⚡ **단축 평가**: AND/OR 연산에서 불필요한 검증 스킵
- 🎯 **최소 객체 생성**: 조합 시 오버헤드 최소화
- 🔍 **컴파일 타임 타입 체크**: 런타임 오버헤드 없음
- 💾 **메모리 효율적**: 작은 메모리 풋프린트

## 기여하기

기여를 환영합니다! 다음과 같은 방법으로 기여할 수 있습니다:

1. 버그 리포트 및 기능 제안 ([Issues](https://github.com/hansanghyeon/spec-pattern-ts/issues))
2. 코드 기여 (Pull Request)
3. 문서 개선
4. 예제 추가

## 라이센스

[MIT License](LICENSE)

---

<div align="center">

**[⬆ 맨 위로](#spec-pattern-ts)**

</div>