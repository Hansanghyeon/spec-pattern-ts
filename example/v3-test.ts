import { Spec, CompositeSpec, define, allOf, anyOf, not } from '../src/specification-v3'
import { expect, test, describe } from 'bun:test'

// 타입 정의
interface User {
  name: string
  age: number
  role: 'admin' | 'user' | 'guest'
}

interface Product {
  name: string
  price: number
  inStock: boolean
}

interface Cart {
  items: number
  total: number
}

describe('spec-pattern-ts v3 - 통합 인터페이스', () => {
  test('기본 단일 스펙', () => {
    const 성인 = Spec('user', (u: User) => u.age >= 18)
    
    expect(성인.isSatisfiedBy({ user: { name: 'John', age: 20, role: 'user' } })).toBe(true)
    expect(성인.isSatisfiedBy({ user: { name: 'Jane', age: 15, role: 'user' } })).toBe(false)
  })

  test('복잡한 중첩 조합 - v2에서 불가능했던 것', () => {
    const 관리자 = Spec('user', (u: User) => u.role === 'admin')
    const 재고있음 = Spec('product', (p: Product) => p.inStock)
    const 저렴함 = Spec('product', (p: Product) => p.price < 100)
    const 장바구니있음 = Spec('cart', (c: Cart) => c.items > 0)

    // 복잡한 중첩: 관리자 OR (재고있고 저렴함 AND 장바구니있음)
    const 구매가능 = 관리자.or(재고있음.and(저렴함).and(장바구니있음))

    // 관리자는 항상 구매 가능
    expect(구매가능.isSatisfiedBy({
      user: { name: 'Admin', age: 30, role: 'admin' }
    })).toBe(true)

    // 일반 사용자는 조건 충족시 구매 가능
    expect(구매가능.isSatisfiedBy({
      product: { name: 'Book', price: 50, inStock: true },
      cart: { items: 2, total: 100 }
    })).toBe(true)

    // 조건 미충족
    expect(구매가능.isSatisfiedBy({
      product: { name: 'Laptop', price: 1000, inStock: true }, // 비쌈
      cart: { items: 1, total: 1000 }
    })).toBe(false)
  })

  test('같은 키 자동 AND 처리', () => {
    const 성인 = Spec('user', (u: User) => u.age >= 18)
    const 관리자 = Spec('user', (u: User) => u.role === 'admin')
    
    // 같은 키('user')를 가진 스펙들은 AND로 결합
    const 성인관리자 = 성인.and(관리자)

    expect(성인관리자.isSatisfiedBy({
      user: { name: 'Adult Admin', age: 30, role: 'admin' }
    })).toBe(true)

    expect(성인관리자.isSatisfiedBy({
      user: { name: 'Young Admin', age: 16, role: 'admin' } // 미성년
    })).toBe(false)

    expect(성인관리자.isSatisfiedBy({
      user: { name: 'Adult User', age: 25, role: 'user' } // 관리자 아님
    })).toBe(false)
  })

  test('CompositeSpec으로 복잡한 비즈니스 로직', () => {
    interface OrderContext {
      user: User
      product: Product
      cart: Cart
    }

    const 주문가능 = CompositeSpec<OrderContext>(ctx => {
      // 복잡한 비즈니스 로직
      const userCanOrder = ctx.user.age >= 18 || ctx.user.role === 'admin'
      const productAvailable = ctx.product.inStock && ctx.product.price <= ctx.cart.total
      const validCart = ctx.cart.items > 0 && ctx.cart.total > 0
      
      return userCanOrder && productAvailable && validCart
    })

    const 무료배송 = CompositeSpec<OrderContext>(ctx => ctx.cart.total >= 50)

    // CompositeSpec과 단일 스펙 조합
    const 프리미엄주문 = 주문가능.and(무료배송).and(
      Spec('user', (u: User) => u.role !== 'guest')
    )

    const validOrder: OrderContext = {
      user: { name: 'John', age: 25, role: 'user' },
      product: { name: 'Book', price: 30, inStock: true },
      cart: { items: 2, total: 60 }
    }

    expect(프리미엄주문.isSatisfiedBy(validOrder)).toBe(true)
  })

  test('NOT 연산자', () => {
    const 게스트아님 = Spec('user', (u: User) => u.role === 'guest').not()
    
    expect(게스트아님.isSatisfiedBy({
      user: { name: 'User', age: 20, role: 'user' }
    })).toBe(true)

    expect(게스트아님.isSatisfiedBy({
      user: { name: 'Guest', age: 20, role: 'guest' }
    })).toBe(false)
  })

  test('편의 함수들', () => {
    const 성인 = Spec('user', (u: User) => u.age >= 18)
    const 회원 = Spec('user', (u: User) => u.role !== 'guest')
    const 재고있음 = Spec('product', (p: Product) => p.inStock)
    const 저렴함 = Spec('product', (p: Product) => p.price < 100)

    // allOf - 모든 조건 만족
    const 구매조건 = allOf(성인, 회원, 재고있음, 저렴함)

    const data = {
      user: { name: 'John', age: 25, role: 'user' as const },
      product: { name: 'Book', price: 50, inStock: true }
    }

    expect(구매조건.isSatisfiedBy(data)).toBe(true)

    // anyOf - 하나 이상 만족
    const 특별할인 = anyOf(
      Spec('user', (u: User) => u.role === 'admin'),
      Spec('cart', (c: Cart) => c.total > 1000),
      Spec('user', (u: User) => u.age >= 65) // 시니어 할인
    )

    expect(특별할인.isSatisfiedBy({
      user: { name: 'Senior', age: 70, role: 'user' }
    })).toBe(true)
  })

  test('define 헬퍼로 재사용 가능한 스펙', () => {
    // 재사용 가능한 조건들
    const 프리미엄사용자 = define<User>(u => 
      u.role === 'admin' || u.age >= 65
    )

    const 할인가능상품 = define<Product>(p => 
      p.inStock && p.price > 50
    )

    // 다양한 컨텍스트에서 사용
    const 프리미엄할인 = 프리미엄사용자.as('customer')
      .and(할인가능상품.as('item'))

    const VIP할인 = 프리미엄사용자.as('member')
      .and(Spec('purchase', (p: { amount: number }) => p.amount > 100))

    expect(프리미엄할인.isSatisfiedBy({
      customer: { name: 'Admin', age: 30, role: 'admin' },
      item: { name: 'Laptop', price: 1000, inStock: true }
    })).toBe(true)
  })

  test('타입 안전성과 추론', () => {
    const a = Spec('a', (x: { value: number }) => x.value > 0)
    const b = Spec('b', (x: { name: string }) => x.name.length > 0)
    const c = Spec('c', (x: { active: boolean }) => x.active)

    // TypeScript가 정확한 타입 추론
    const 복합 = a.and(b).and(c)
    
    // 필요한 타입: { a: { value: number }, b: { name: string }, c: { active: boolean } }
    const validData = {
      a: { value: 10 },
      b: { name: 'Test' },
      c: { active: true }
    }

    expect(복합.isSatisfiedBy(validData)).toBe(true)

    // 타입 에러 예시 (주석 해제시 컴파일 에러)
    // 복합.isSatisfiedBy({
    //   a: { value: 10 },
    //   b: { name: 'Test' }
    //   // c 누락!
    // })
  })
})