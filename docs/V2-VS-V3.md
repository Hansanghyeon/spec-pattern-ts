# spec-pattern-ts: v2 vs v3 비교

## 핵심 문제와 해결

### v2의 한계

v2에서는 두 개의 분리된 인터페이스를 사용했습니다:

```typescript
// 단일 키 스펙
interface ISpecification<K extends string, T> {
  readonly key: K
  and<K2, T2>(other: ISpecification<K2, T2>): ICompositeSpecification<...>
}

// 복합 스펙
interface ICompositeSpecification<TContext> {
  and<K, T>(spec: ISpecification<K, T>): ICompositeSpecification<...>
}
```

**문제점**: 복합 스펙을 다시 단일 스펙과 조합할 수 없음

```typescript
// v2에서 불가능했던 코드
const a = Spec('a', predicate)
const b = Spec('b', predicate)
const c = Spec('c', predicate)

// ❌ 타입 에러!
const 복잡한조합 = a.and(b.or(c))  // b.or(c)는 ICompositeSpecification
```

### v3의 해결책

v3는 모든 스펙이 동일한 인터페이스를 구현합니다:

```typescript
// 통합 인터페이스
interface ISpecification<TContext extends Record<string, any>> {
  isSatisfiedBy(candidate: TContext): boolean
  and<TOther>(other: ISpecification<TOther>): ISpecification<TContext & TOther>
  or<TOther>(other: ISpecification<TOther>): ISpecification<TContext | TOther>
  not(): ISpecification<TContext>
}
```

**장점**: 무제한 중첩과 조합 가능

```typescript
// v3에서 가능한 모든 조합
const 복잡한조합 = a.and(b.or(c))  // ✅ 완벽하게 작동!
const 더복잡한조합 = a.or(b.and(c.not())).and(d)  // ✅ 이것도 가능!
```

## 코드 비교

### 기본 사용법

**v2:**
```typescript
const loggedIn = Spec('user', u => u.isLoggedIn)
const approved = Spec('publisher', p => p.isApproved)

// 단순 조합은 가능
const simple = loggedIn.and(approved)

// 복잡한 조합은 제한적
const complex = loggedIn.and(/* 여기에 or 결과를 넣을 수 없음 */)
```

**v3:**
```typescript
const loggedIn = Spec('user', u => u.isLoggedIn)
const approved = Spec('publisher', p => p.isApproved)
const premium = Spec('publisher', p => p.isPremium)

// 모든 조합이 자유롭게 가능
const complex = loggedIn.and(approved.or(premium))
const moreComplex = loggedIn.and(approved.or(premium)).and(admin.not())
```

### 실제 사용 예제

**v2에서 구현이 어려웠던 케이스:**
```typescript
// 관리자이거나 (로그인하고 승인된 프리미엄 퍼블리셔)
// v2에서는 이런 중첩된 로직을 표현하기 어려웠음
```

**v3에서의 우아한 해결:**
```typescript
const 특별권한 = 관리자.or(
  로그인됨.and(승인됨).and(프리미엄)
)

// 관리자
특별권한.isSatisfiedBy({ permission: { role: 'admin' } })  // true

// 프리미엄 퍼블리셔
특별권한.isSatisfiedBy({
  user: { isLoggedIn: true },
  publisher: { isApproved: true, isPremium: true }
})  // true
```

## 새로운 기능

### 1. CompositeSpec

복잡한 비즈니스 로직을 하나의 스펙으로:

```typescript
const 주문가능 = CompositeSpec<OrderContext>(ctx => {
  const userValid = ctx.user.age >= 18 && ctx.user.verified
  const cartValid = ctx.cart.items > 0 && ctx.cart.total > 0
  const paymentValid = ctx.payment.method !== null
  
  return userValid && cartValid && paymentValid
})

// 다른 스펙과 자유롭게 조합
const 프리미엄주문 = 주문가능.and(무료배송).and(회원전용)
```

### 2. 편의 함수

```typescript
// 모든 조건을 만족해야 함
const 엄격한검증 = allOf(로그인됨, 승인됨, 프리미엄, 활성상태)

// 하나 이상 만족하면 됨
const 유연한검증 = anyOf(관리자, VIP회원, 특별초대)

// 조건 부정
const 제한된접근 = not(게스트)
```

## 타입 안전성

v3는 v2와 동일한 수준의 타입 안전성을 제공합니다:

```typescript
const 복합검증 = Spec('a', (a: A) => true)
  .and(Spec('b', (b: B) => true))
  .and(Spec('c', (c: C) => true))

// TypeScript가 정확히 추론: { a: A, b: B, c: C }
복합검증.isSatisfiedBy({ a, b, c })  // ✅
복합검증.isSatisfiedBy({ a, b })     // ❌ 컴파일 에러
```

## 마이그레이션

v2에서 v3로의 마이그레이션은 매우 간단합니다:

1. import 경로만 변경
2. 기존 코드는 그대로 작동
3. 이제 더 복잡한 조합도 가능

```typescript
// v2
import { Spec } from 'spec-pattern-ts'

// v3
import { Spec } from 'spec-pattern-ts/v3'
```

## 결론

v3는 v2의 모든 기능을 포함하면서 다음을 추가로 제공합니다:

- ✅ **무제한 중첩**: 어떤 복잡한 조합도 가능
- ✅ **일관된 API**: 하나의 인터페이스로 통합
- ✅ **더 나은 표현력**: 복잡한 비즈니스 로직을 명확하게 표현
- ✅ **하위 호환성**: v2 코드가 그대로 작동

v3는 spec-pattern의 완성형입니다.