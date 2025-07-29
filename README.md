# spec-pattern-ts v2.0

타입 안전한 키 기반 Specification Pattern 구현체

## 주요 특징

- 🔑 **키 기반 스펙**: 모든 스펙은 정의 시점부터 키를 가집니다
- 🔗 **자연스러운 타입 조합**: 서로 다른 타입의 스펙들을 자유롭게 연결
- 🎯 **완벽한 타입 안전성**: TypeScript가 모든 타입을 추론하고 검증
- 🧩 **스마트한 키 처리**: 같은 키는 자동으로 AND 조건으로 결합

## 설치

```bash
npm install spec-pattern-ts@2
# 또는
yarn add spec-pattern-ts@2
# 또는
bun add spec-pattern-ts@2
```

## 빠른 시작

### 1. 스펙 정의

```typescript
import { Spec } from 'spec-pattern-ts'

// 각 스펙은 키와 검증 로직을 가집니다
const loggedIn = Spec('user', (u: User) => u.status === 'logged_in')
const approved = Spec('publisher', (p: Publisher) => p.status === 'approved')
const canWrite = Spec('permission', (p: Permission) => p.actions.includes('write'))
```

### 2. 스펙 조합

```typescript
// 서로 다른 타입의 스펙들을 자연스럽게 조합
const canPublish = loggedIn
  .and(approved)
  .and(canWrite)

// TypeScript가 자동으로 타입 추론
// canPublish의 타입: { user: User, publisher: Publisher, permission: Permission }
```

### 3. 스펙 사용

```typescript
const context = {
  user: currentUser,
  publisher: currentPublisher,
  permission: currentPermission
}

if (canPublish.isSatisfiedBy(context)) {
  // 퍼블리싱 가능!
}
```

## 핵심 개념

### 키 기반 설계

v2의 핵심은 모든 스펙이 키를 가진다는 것입니다:

```typescript
// ❌ v1 방식 - 더 이상 지원하지 않음
const oldSpec = new Spec<User>(u => u.isActive)

// ✅ v2 방식 - 키를 명시
const newSpec = Spec('user', (u: User) => u.isActive)
```

### 자동 키 처리

같은 키를 가진 스펙들은 자동으로 AND 조건으로 결합됩니다:

```typescript
const premium = Spec('publisher', p => p.tier === 'premium')
const highRevenue = Spec('publisher', p => p.revenue > 10000)

// 'publisher'가 premium이면서 AND 고수익
const premiumHighRevenue = premium.and(highRevenue)
```

## API 레퍼런스

### Spec()

기본 스펙 생성 함수:

```typescript
const mySpec = Spec('key', (value: Type) => boolean)
```

### define()

로직을 먼저 정의하고 나중에 키를 할당:

```typescript
const isActive = define<User>(u => u.isActive)
const activeUser = isActive.as('user')
```

### 조합 메서드

- `.and()`: AND 조건으로 결합
- `.or()`: OR 조건으로 결합  
- `.not()`: 조건 부정

## 실전 예제

### 권한 관리 시스템

```typescript
// 스펙 정의
const specs = {
  user: {
    loggedIn: Spec('user', (u: User) => u.status === 'logged_in'),
    admin: Spec('user', (u: User) => u.role === 'admin'),
  },
  publisher: {
    approved: Spec('publisher', (p: Publisher) => p.status === 'approved'),
    premium: Spec('publisher', (p: Publisher) => p.tier === 'premium'),
  },
  permission: {
    write: Spec('permission', (p: Permission) => p.actions.includes('write')),
    publish: Spec('permission', (p: Permission) => p.actions.includes('publish')),
  }
}

// 권한 체크 로직
const canEditContent = specs.user.loggedIn
  .and(specs.publisher.approved)
  .and(specs.permission.write)

const canPublishContent = specs.user.loggedIn
  .and(specs.publisher.premium)
  .and(specs.permission.publish)

// 관리자는 모든 권한
const adminAccess = specs.user.admin

// 최종 권한 체크
const hasAccess = adminAccess.or(canPublishContent)
```

### 복잡한 비즈니스 로직

```typescript
// 주문 가능 조건:
// 1. 로그인한 사용자
// 2. 이메일 인증 완료
// 3. 활성 상태
// 4. (VIP 고객 OR 신용카드 등록)

const canPlaceOrder = Spec('user', u => u.isLoggedIn)
  .and(Spec('user', u => u.emailVerified))
  .and(Spec('user', u => u.status === 'active'))
  .and(
    Spec('customer', c => c.tier === 'vip')
      .or(Spec('payment', p => p.hasCard))
  )
```

## 마이그레이션

v1.x에서 v2.0으로 마이그레이션하려면 [마이그레이션 가이드](./MIGRATION-GUIDE.md)를 참조하세요.

## 타입 안전성

TypeScript가 모든 필요한 키를 추적합니다:

```typescript
const complex = Spec('a', (a: A) => true)
  .and(Spec('b', (b: B) => true))
  .and(Spec('c', (c: C) => true))

// 필요한 타입: { a: A, b: B, c: C }
complex.isSatisfiedBy({ a, b, c }) // ✅ OK
complex.isSatisfiedBy({ a, b })    // ❌ 컴파일 에러: 'c' 누락
complex.isSatisfiedBy({ a, b, c, d }) // ✅ OK (추가 속성은 허용)
```

## 성능

v2는 키 기반 검증으로 더 효율적입니다:

- 키별 독립적 검증
- 조건 실패 시 즉시 중단
- 불필요한 타입 변환 없음

## 라이선스

MIT