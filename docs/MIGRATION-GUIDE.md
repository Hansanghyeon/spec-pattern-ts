# spec-pattern-ts v2.0 마이그레이션 가이드

## 주요 변경사항

### 1. 모든 스펙은 키를 가져야 합니다

v2에서는 스펙 정의 시 반드시 키를 지정해야 합니다. 이를 통해 서로 다른 타입의 스펙들을 자연스럽게 조합할 수 있습니다.

**v1.x:**
```typescript
const loginSpec = new Spec<User>(user => user.isLoggedIn)
const approvedSpec = new Spec<Publisher>(pub => pub.isApproved)

// ❌ 타입 에러! 서로 다른 타입은 조합 불가
const combined = loginSpec.and(approvedSpec)
```

**v2.0:**
```typescript
const loginSpec = Spec('user', (user: User) => user.isLoggedIn)
const approvedSpec = Spec('publisher', (pub: Publisher) => pub.isApproved)

// ✅ 자연스러운 조합!
const combined = loginSpec.and(approvedSpec)
```

### 2. 인터페이스 변경

**v1.x:**
```typescript
interface ISpecification<T> {
  isSatisfiedBy(candidate: T): boolean
  and(other: ISpecification<T>): ISpecification<T>
  // ...
}
```

**v2.0:**
```typescript
interface ISpecification<K extends string, T> {
  readonly key: K
  isSatisfiedBy(candidate: { [P in K]: T }): boolean
  and<K2, T2>(other: ISpecification<K2, T2>): ICompositeSpecification<...>
  // ...
}
```

## 마이그레이션 단계

### Step 1: 기존 스펙에 키 추가

**Before:**
```typescript
// specs/user.spec.ts
export const isLoggedIn = new Spec<User>(
  user => user.status === 'logged_in'
)

export const isAdmin = new Spec<User>(
  user => user.role === 'admin'
)
```

**After:**
```typescript
// specs/user.spec.ts
export const isLoggedIn = Spec('user', 
  (user: User) => user.status === 'logged_in'
)

export const isAdmin = Spec('user',
  (user: User) => user.role === 'admin'
)
```

### Step 2: 스펙 사용 코드 수정

**Before:**
```typescript
// 단일 타입만 검증 가능
if (isLoggedIn.isSatisfiedBy(user)) {
  // ...
}

// 같은 타입끼리만 조합 가능
const adminUser = isLoggedIn.and(isAdmin)
```

**After:**
```typescript
// 객체로 전달
if (isLoggedIn.isSatisfiedBy({ user })) {
  // ...
}

// 같은 키는 자동으로 AND 처리
const adminUser = isLoggedIn.and(isAdmin)
// 결과: user가 로그인되고 AND 관리자여야 함
```

### Step 3: 다중 타입 조합

이제 서로 다른 타입의 스펙들을 자유롭게 조합할 수 있습니다:

```typescript
// 다른 도메인의 스펙들
const userLoggedIn = Spec('user', (u: User) => u.isLoggedIn)
const publisherApproved = Spec('publisher', (p: Publisher) => p.isApproved)
const hasPermission = Spec('permission', (p: Permission) => p.canWrite)

// 자연스러운 조합
const canPublish = userLoggedIn
  .and(publisherApproved)
  .and(hasPermission)

// 사용
const context = {
  user: currentUser,
  publisher: currentPublisher,
  permission: currentPermission
}

if (canPublish.isSatisfiedBy(context)) {
  // 퍼블리싱 가능!
}
```

## 유용한 패턴

### 1. define() 헬퍼 사용

로직을 먼저 정의하고 나중에 키를 할당:

```typescript
const loginCheck = define<User>(u => u.isLoggedIn)
const adminCheck = define<User>(u => u.role === 'admin')

// 나중에 키 할당
const userLoggedIn = loginCheck.as('user')
const userIsAdmin = adminCheck.as('user')
```

### 2. 도메인별 스펙 팩토리

```typescript
// specs/factory.ts
export const UserSpecs = {
  loggedIn: Spec('user', (u: User) => u.isLoggedIn),
  admin: Spec('user', (u: User) => u.role === 'admin'),
  active: Spec('user', (u: User) => u.isActive)
}

export const PublisherSpecs = {
  approved: Spec('publisher', (p: Publisher) => p.status === 'approved'),
  premium: Spec('publisher', (p: Publisher) => p.tier === 'premium')
}

// 사용
import { UserSpecs, PublisherSpecs } from './specs/factory'

const premiumPublisher = UserSpecs.loggedIn
  .and(PublisherSpecs.approved)
  .and(PublisherSpecs.premium)
```

### 3. 기존 코드 점진적 마이그레이션

큰 프로젝트의 경우 점진적으로 마이그레이션할 수 있습니다:

```typescript
// 임시 래퍼 함수
function migrateSpec<T>(
  key: string,
  oldSpec: OldISpecification<T>
): ISpecification<string, T> {
  return Spec(key, (value: T) => oldSpec.isSatisfiedBy(value))
}

// 기존 스펙을 래핑
const newLoginSpec = migrateSpec('user', oldLoginSpec)
```

## 주의사항

### 키 중복 처리

v2에서는 같은 키를 가진 스펙들이 자동으로 AND 조건으로 결합됩니다:

```typescript
const spec1 = Spec('data', (d: Data) => d.value > 10)
const spec2 = Spec('data', (d: Data) => d.value < 20)

// 자동으로 AND: 10 < value < 20
const combined = spec1.and(spec2)
```

### 타입 안전성

TypeScript가 모든 필요한 키를 추적합니다:

```typescript
const complex = Spec('a', (a: A) => true)
  .and(Spec('b', (b: B) => true))
  .and(Spec('c', (c: C) => true))

// TypeScript가 요구하는 타입: { a: A, b: B, c: C }
complex.isSatisfiedBy({ a, b, c }) // ✅
complex.isSatisfiedBy({ a, b })    // ❌ 컴파일 에러
```

## 성능 고려사항

v2는 키 기반 검증으로 더 효율적입니다:

- 불필요한 타입 변환 없음
- 키별로 독립적인 검증
- 조건이 실패하면 즉시 중단

## 요약

1. 모든 스펙에 키 추가
2. `isSatisfiedBy`에 객체 형태로 전달
3. 서로 다른 타입의 스펙들을 자유롭게 조합
4. 타입 안전성은 TypeScript가 보장

v2로의 마이그레이션은 초기 작업이 필요하지만, 더 강력하고 유연한 스펙 시스템을 제공합니다.