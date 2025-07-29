/**
 * v2와 v3의 차이점을 보여주는 예제
 */

// 타입 정의 (공통)
interface User {
  id: string
  role: 'admin' | 'user' | 'guest'
  isActive: boolean
}

interface Product {
  id: string
  price: number
  inStock: boolean
}

interface Permission {
  canRead: boolean
  canWrite: boolean
}

// ========== v2 방식 ==========
// v2에서는 복합 스펙을 다시 조합할 수 없음

import { Spec as SpecV2 } from '../src/specification-v2'

const v2Example = () => {
  const 관리자_v2 = SpecV2('user', (u: User) => u.role === 'admin')
  const 활성유저_v2 = SpecV2('user', (u: User) => u.isActive)
  const 재고있음_v2 = SpecV2('product', (p: Product) => p.inStock)
  const 저렴함_v2 = SpecV2('product', (p: Product) => p.price < 100)

  // 단순 조합은 가능
  const 관리자_활성_v2 = 관리자_v2.and(활성유저_v2)
  const 저렴한재고_v2 = 재고있음_v2.and(저렴함_v2)

  // ❌ v2의 한계: 복합 스펙끼리는 조합 불가
  // const 문제있는조합 = 관리자_활성_v2.and(저렴한재고_v2) // 타입 에러!
  
  // ❌ 중첩된 OR/AND도 제한적
  // const 복잡한조합 = 관리자_v2.and(재고있음_v2.or(저렴함_v2)) // 타입 에러!
  
  console.log('[v2] 복잡한 조합이 제한적입니다')
}

// ========== v3 방식 ==========
// v3에서는 모든 조합이 자유롭게 가능

import { Spec as SpecV3, CompositeSpec, allOf, anyOf } from '../src/specification-v3'

const v3Example = () => {
  const 관리자 = SpecV3('user', (u: User) => u.role === 'admin')
  const 활성유저 = SpecV3('user', (u: User) => u.isActive)
  const 재고있음 = SpecV3('product', (p: Product) => p.inStock)
  const 저렴함 = SpecV3('product', (p: Product) => p.price < 100)
  const 쓰기권한 = SpecV3('permission', (p: Permission) => p.canWrite)

  // ✅ v3: 모든 조합이 가능
  const 관리자_활성 = 관리자.and(활성유저)
  const 저렴한재고 = 재고있음.and(저렴함)
  
  // ✅ 복합 스펙끼리도 자유롭게 조합
  const 완전한조합 = 관리자_활성.and(저렴한재고).and(쓰기권한)
  
  // ✅ 중첩된 OR/AND도 자유롭게
  const 복잡한조합 = 관리자.or(활성유저.and(쓰기권한)).and(재고있음.or(저렴함))
  
  // ✅ 더 복잡한 비즈니스 로직
  const 구매가능 = anyOf(
    관리자, // 관리자는 항상 가능
    allOf(활성유저, 쓰기권한, anyOf(재고있음, 저렴함)) // 일반 유저 조건
  )

  // CompositeSpec으로 복잡한 로직 표현
  interface PurchaseContext {
    user: User
    product: Product
    permission: Permission
  }

  const 고급구매로직 = CompositeSpec<PurchaseContext>(ctx => {
    const isVIP = ctx.user.role === 'admin' || ctx.permission.canWrite
    const affordableProduct = ctx.product.price < 1000 || ctx.product.inStock
    return isVIP && affordableProduct && ctx.user.isActive
  })

  // CompositeSpec과 일반 스펙 조합도 가능
  const 최종검증 = 고급구매로직.and(관리자.or(쓰기권한))

  console.log('[v3] 모든 조합이 자유롭습니다!')

  // 실제 사용 예
  const testData = {
    user: { id: '1', role: 'admin' as const, isActive: true },
    product: { id: 'p1', price: 50, inStock: true },
    permission: { canRead: true, canWrite: true }
  }

  console.log('구매가능:', 구매가능.isSatisfiedBy(testData))
  console.log('최종검증:', 최종검증.isSatisfiedBy(testData))
}

// 실행
console.log('=== v2 vs v3 비교 ===\n')
v2Example()
console.log()
v3Example()