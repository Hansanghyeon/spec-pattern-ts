# spec-pattern-ts: v1 vs v2 비교

## 핵심 차이점

### v1.x - 타입 제한적 접근
```typescript
// 같은 타입끼리만 조합 가능
const loginSpec: ISpecification<User>
const adminSpec: ISpecification<User>
const combined = loginSpec.and(adminSpec) // ✅ OK

// 다른 타입은 조합 불가
const userSpec: ISpecification<User>
const publisherSpec: ISpecification<Publisher>
const combined = userSpec.and(publisherSpec) // ❌ 타입 에러!
```

### v2.0 - 키 기반 자유로운 조합
```typescript
// 스펙 정의부터 키 지정
const loginSpec = Spec('user', (u: User) => u.isLoggedIn)
const publisherSpec = Spec('publisher', (p: Publisher) => p.isApproved)

// 서로 다른 타입도 자연스럽게 조합!
const combined = loginSpec.and(publisherSpec) // ✅ OK!
```

## 코드 비교

### 스펙 정의

**v1.x:**
```typescript
import { Spec } from 'spec-pattern-ts'

const isActive = new Spec<User>(user => user.isActive)
const isPremium = new Spec<User>(user => user.tier === 'premium')
```

**v2.0:**
```typescript
import { Spec } from 'spec-pattern-ts'

const isActive = Spec('user', user => user.isActive)
const isPremium = Spec('user', user => user.tier === 'premium')
```

### 스펙 사용

**v1.x:**
```typescript
// 단일 객체 직접 전달
if (isActive.isSatisfiedBy(user)) {
  // ...
}
```

**v2.0:**
```typescript
// 키를 포함한 객체로 전달
if (isActive.isSatisfiedBy({ user })) {
  // ...
}
```

### 복잡한 권한 체크

**v1.x - 번거로운 방식:**
```typescript
// 각 타입별로 따로 체크
const userValid = isLoggedIn.and(isActive).isSatisfiedBy(user)
const publisherValid = isApproved.isSatisfiedBy(publisher)
const permissionValid = canWrite.isSatisfiedBy(permission)

if (userValid && publisherValid && permissionValid) {
  // 권한 있음
}
```

**v2.0 - 우아한 방식:**
```typescript
// 한 번에 체크
const hasAccess = Spec('user', u => u.isLoggedIn)
  .and(Spec('user', u => u.isActive))
  .and(Spec('publisher', p => p.isApproved))
  .and(Spec('permission', p => p.canWrite))

if (hasAccess.isSatisfiedBy({ user, publisher, permission })) {
  // 권한 있음
}
```

## 실제 사용 사례 비교

### 전자상거래 주문 검증

**v1.x:**
```typescript
// 복잡하고 분리된 검증
const userCanOrder = isLoggedIn.and(emailVerified).and(notBlocked)
const cartIsValid = hasItems.and(inStock).and(validQuantity)
const paymentIsValid = hasPaymentMethod.and(sufficientFunds)

// 각각 따로 검증
if (userCanOrder.isSatisfiedBy(user) &&
    cartIsValid.isSatisfiedBy(cart) &&
    paymentIsValid.isSatisfiedBy(payment)) {
  processOrder()
}
```

**v2.0:**
```typescript
// 통합된 명확한 검증
const canProcessOrder = Spec('user', u => u.isLoggedIn && u.emailVerified)
  .and(Spec('cart', c => c.items.length > 0 && c.allInStock))
  .and(Spec('payment', p => p.method !== null && p.balance >= p.required))

if (canProcessOrder.isSatisfiedBy({ user, cart, payment })) {
  processOrder()
}
```

## 마이그레이션 예제

**기존 v1.x 코드:**
```typescript
export class UserSpecs {
  static isActive = new Spec<User>(u => u.status === 'active')
  static isPremium = new Spec<User>(u => u.tier === 'premium')
  static canPublish = new Spec<User>(u => u.permissions.includes('publish'))
}

// 사용
const premiumPublisher = UserSpecs.isPremium.and(UserSpecs.canPublish)
```

**v2.0으로 마이그레이션:**
```typescript
export const UserSpecs = {
  isActive: Spec('user', u => u.status === 'active'),
  isPremium: Spec('user', u => u.tier === 'premium'),
  canPublish: Spec('user', u => u.permissions.includes('publish'))
}

// 동일한 사용법, 더 강력한 기능
const premiumPublisher = UserSpecs.isPremium.and(UserSpecs.canPublish)

// 이제 다른 타입과도 조합 가능!
const premiumPublisherWithValidLicense = premiumPublisher
  .and(Spec('license', l => l.isValid && !l.isExpired))
```

## 장단점 비교

### v1.x
**장점:**
- 단순한 API
- 학습 곡선이 낮음

**단점:**
- 같은 타입끼리만 조합 가능
- 복잡한 비즈니스 로직 구현 어려움
- 타입별로 분리된 검증 로직

### v2.0
**장점:**
- 서로 다른 타입 자유롭게 조합
- 더 표현력 있는 API
- 복잡한 비즈니스 로직을 명확하게 표현
- 완벽한 타입 안전성
- 키 중복 시 스마트한 처리

**단점:**
- 스펙 정의 시 키 필수
- 사용 시 객체로 감싸야 함

## 결론

v2.0은 약간의 API 변경을 통해 훨씬 더 강력하고 유연한 스펙 시스템을 제공합니다. 특히 실제 비즈니스 로직에서 여러 도메인 객체를 함께 검증해야 하는 경우, v2.0의 장점이 명확하게 드러납니다.