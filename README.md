# spec-pattern-ts v3.0

완벽한 조합이 가능한 TypeScript Specification Pattern 구현

## v3의 핵심 개선사항

v2의 한계였던 "복합 스펙을 다시 조합할 수 없는 문제"를 완전히 해결했습니다.

```typescript
// v3에서는 모든 조합이 자유롭습니다
const 복잡한권한 = 관리자.or(
  로그인됨.and(승인됨.or(프리미엄)).and(활성상태)
)
```

## 설치

```bash
npm install spec-pattern-ts@3
# 또는
yarn add spec-pattern-ts@3
```

## 빠른 시작

### 1. 기본 사용법

```typescript
import { Spec } from 'spec-pattern-ts'

// 스펙 정의
const 성인 = Spec('user', (u: User) => u.age >= 18)
const 회원 = Spec('user', (u: User) => u.role !== 'guest')
const 활성상태 = Spec('user', (u: User) => u.status === 'active')

// 자유로운 조합
const 유효한사용자 = 성인.and(회원).and(활성상태)

// 사용
if (유효한사용자.isSatisfiedBy({ user: currentUser })) {
  // 접근 허용
}

// .is() alias를 사용한 더 간편한 문법
if (유효한사용자.is({ user: currentUser })) {
  // .is()는 .isSatisfiedBy()의 alias입니다
}
```

### 2. 복잡한 조합

```typescript
const 관리자 = Spec('user', u => u.role === 'admin')
const 승인됨 = Spec('publisher', p => p.status === 'approved')
const 프리미엄 = Spec('publisher', p => p.tier === 'premium')
const 고수익 = Spec('publisher', p => p.revenue > 10000)

// v3의 강점: 무제한 중첩 가능
const 특별권한 = 관리자.or(
  승인됨.and(프리미엄.or(고수익))
)

// 더 복잡한 조합도 가능
const 게시권한 = 특별권한
  .and(활성상태)
  .and(이메일인증됨.or(관리자))
```

### 3. CompositeSpec으로 복잡한 로직 표현

```typescript
interface OrderContext {
  user: User
  cart: Cart
  payment: Payment
}

const 주문가능 = CompositeSpec<OrderContext>(ctx => {
  const validUser = ctx.user.verified && !ctx.user.blocked
  const validCart = ctx.cart.items.length > 0 && ctx.cart.total > 0
  const validPayment = ctx.payment.method !== null && ctx.payment.authorized
  
  return validUser && validCart && validPayment
})

// CompositeSpec도 다른 스펙과 자유롭게 조합
const 프리미엄주문 = 주문가능
  .and(Spec('user', u => u.tier === 'premium'))
  .and(Spec('shipping', s => s.express))
```

## 편의 함수

### allOf - 모든 조건 만족

```typescript
const 엄격한검증 = allOf(
  로그인됨,
  이메일인증됨,
  활성상태,
  신용카드등록됨
)
```

### anyOf - 하나 이상 만족

```typescript
const 할인대상 = anyOf(
  VIP회원,
  첫구매,
  특별쿠폰보유,
  생일할인
)
```

### not - 조건 부정

```typescript
const 접근제한 = allOf(
  not(차단된사용자),
  not(만료된계정),
  not(비활성상태)
)
```

## 실전 예제

### 전자상거래 주문 시스템

```typescript
// 기본 스펙들
const 로그인됨 = Spec('user', (u: User) => u.isLoggedIn)
const 성인인증 = Spec('user', (u: User) => u.ageVerified && u.age >= 19)
const 재고있음 = Spec('product', (p: Product) => p.stock > 0)
const 배송가능 = Spec('address', (a: Address) => a.deliverable)
const 결제수단등록 = Spec('payment', (p: Payment) => p.method !== null)

// 주류 구매 조건
const 주류구매가능 = allOf(
  로그인됨,
  성인인증,
  재고있음,
  배송가능.and(Spec('address', a => !a.isSchool)), // 학교 배송 불가
  결제수단등록
)

// VIP 혜택
const VIP혜택 = anyOf(
  Spec('user', u => u.tier === 'vip'),
  Spec('purchase', p => p.totalLastYear > 1000000),
  Spec('user', u => u.membershipYears > 5)
)

// 최종 주문 가능 여부
const 주문가능 = 주류구매가능.and(
  VIP혜택.or(Spec('cart', c => c.total > 50000))
)
```

### 권한 관리 시스템

```typescript
// 역할 기반 권한
const 관리자 = Spec('role', r => r.name === 'admin')
const 편집자 = Spec('role', r => r.name === 'editor')
const 작성자 = Spec('role', r => r.name === 'writer')

// 리소스 권한
const 소유자 = CompositeSpec<{ user: User; resource: Resource }>(
  ctx => ctx.resource.ownerId === ctx.user.id
)

const 공개리소스 = Spec('resource', r => r.visibility === 'public')

// 복합 권한 체크
const 읽기권한 = anyOf(관리자, 소유자, 공개리소스)

const 쓰기권한 = anyOf(
  관리자,
  소유자.and(not(Spec('resource', r => r.locked))),
  편집자.and(Spec('resource', r => r.type === 'article'))
)

const 삭제권한 = 관리자.or(
  소유자.and(
    Spec('resource', r => r.createdAt < Date.now() - 24 * 60 * 60 * 1000)
  )
)
```

## 타입 안전성

TypeScript가 모든 필요한 컨텍스트를 추적합니다:

```typescript
const 복합검증 = Spec('user', (u: User) => u.active)
  .and(Spec('product', (p: Product) => p.available))
  .and(Spec('payment', (p: Payment) => p.valid))

// 필요한 타입이 자동으로 추론됨
// { user: User } & { product: Product } & { payment: Payment }

복합검증.isSatisfiedBy({ user, product, payment }) // ✅
복합검증.isSatisfiedBy({ user, product })         // ❌ 컴파일 에러
```

## v2에서 마이그레이션

v3는 v2와 완전히 호환됩니다. import 경로만 변경하면 됩니다:

```typescript
// v2
import { Spec } from 'spec-pattern-ts'

// v3
import { Spec } from 'spec-pattern-ts/v3'
```

## 성능

v3는 효율적인 조합 전략을 사용합니다:
- 조건 실패 시 즉시 평가 중단
- 불필요한 객체 생성 최소화
- 타입 체크는 컴파일 타임에만 수행

## 라이선스

MIT