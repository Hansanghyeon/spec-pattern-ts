/**
 * spec-pattern-ts v3.0.0
 * 통합된 스펙 인터페이스로 완벽한 조합 가능
 */

/**
 * 통합 스펙 인터페이스
 * 모든 스펙은 컨텍스트 객체를 다룹니다
 * @template TContext - 스펙이 검증하는 컨텍스트 타입
 */
export interface ISpecification<TContext extends Record<string, any>> {
  isSatisfiedBy(candidate: TContext): boolean
  /**
   * isSatisfiedBy의 간편한 alias
   * @alias isSatisfiedBy
   * @param candidate - 검증할 컨텍스트 객체
   * @returns 스펙 만족 여부
   * @example
   * ```typescript
   * const isValid = spec.is(data); // spec.isSatisfiedBy(data)와 동일
   * ```
   */
  is(candidate: TContext): boolean
  and<TOther extends Record<string, any>>(
    other: ISpecification<TOther>
  ): ISpecification<TContext & TOther>
  or<TOther extends Record<string, any>>(
    other: ISpecification<TOther>
  ): ISpecification<TContext | TOther>
  not(): ISpecification<TContext>
}

/**
 * 기본 스펙 구현
 */
abstract class BaseSpecification<TContext extends Record<string, any>> 
  implements ISpecification<TContext> {
  
  abstract isSatisfiedBy(candidate: TContext): boolean

  /**
   * isSatisfiedBy의 간편한 alias
   * @alias isSatisfiedBy
   */
  is(candidate: TContext): boolean {
    return this.isSatisfiedBy(candidate)
  }

  and<TOther extends Record<string, any>>(
    other: ISpecification<TOther>
  ): ISpecification<TContext & TOther> {
    return new AndSpecification(this, other)
  }

  or<TOther extends Record<string, any>>(
    other: ISpecification<TOther>
  ): ISpecification<TContext | TOther> {
    return new OrSpecification(this, other)
  }

  not(): ISpecification<TContext> {
    return new NotSpecification(this)
  }
}

/**
 * 단일 키 스펙 - 하나의 프로퍼티만 검증
 */
class SingleKeySpecification<K extends string, T> 
  extends BaseSpecification<{ [P in K]: T }> {
  
  constructor(
    private key: K,
    private predicate: (value: T) => boolean
  ) {
    super()
  }

  isSatisfiedBy(candidate: { [P in K]: T }): boolean {
    return this.key in candidate && this.predicate(candidate[this.key])
  }
}

/**
 * AND 복합 스펙
 */
class AndSpecification<TLeft extends Record<string, any>, TRight extends Record<string, any>> 
  extends BaseSpecification<TLeft & TRight> {
  
  constructor(
    private left: ISpecification<TLeft>,
    private right: ISpecification<TRight>
  ) {
    super()
  }

  isSatisfiedBy(candidate: TLeft & TRight): boolean {
    // 키 중복 처리: 같은 키가 있으면 둘 다 만족해야 함
    const leftResult = this.left.isSatisfiedBy(candidate as TLeft)
    const rightResult = this.right.isSatisfiedBy(candidate as TRight)
    return leftResult && rightResult
  }
}

/**
 * OR 복합 스펙
 */
class OrSpecification<TLeft extends Record<string, any>, TRight extends Record<string, any>> 
  extends BaseSpecification<TLeft | TRight> {
  
  constructor(
    private left: ISpecification<TLeft>,
    private right: ISpecification<TRight>
  ) {
    super()
  }

  isSatisfiedBy(candidate: TLeft | TRight): boolean {
    try {
      if (this.left.isSatisfiedBy(candidate as TLeft)) return true
    } catch {}
    
    try {
      if (this.right.isSatisfiedBy(candidate as TRight)) return true
    } catch {}
    
    return false
  }
}

/**
 * NOT 스펙
 */
class NotSpecification<TContext extends Record<string, any>> 
  extends BaseSpecification<TContext> {
  
  constructor(
    private spec: ISpecification<TContext>
  ) {
    super()
  }

  isSatisfiedBy(candidate: TContext): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }
}

/**
 * 스펙 생성 함수
 */
export function Spec<T, K extends string>(
  key: K,
  predicate: (value: T) => boolean
): ISpecification<{ [P in K]: T }> {
  return new SingleKeySpecification(key, predicate)
}

/**
 * 여러 조건을 한번에 체크하는 복합 스펙
 */
export function CompositeSpec<TContext extends Record<string, any>>(
  predicate: (context: TContext) => boolean
): ISpecification<TContext> {
  return new PredicateSpecification(predicate)
}

/**
 * 일반 함수 기반 스펙
 */
class PredicateSpecification<TContext extends Record<string, any>> 
  extends BaseSpecification<TContext> {
  
  constructor(
    private predicate: (context: TContext) => boolean
  ) {
    super()
  }

  isSatisfiedBy(candidate: TContext): boolean {
    return this.predicate(candidate)
  }
}

/**
 * 스펙 빌더
 */
export class SpecBuilder<T> {
  constructor(private predicate: (value: T) => boolean) {}

  as<K extends string>(key: K): ISpecification<{ [P in K]: T }> {
    return Spec(key, this.predicate)
  }
}

/**
 * 스펙 정의 헬퍼
 */
export function define<T>(predicate: (value: T) => boolean): SpecBuilder<T> {
  return new SpecBuilder(predicate)
}

/**
 * 편의 함수들
 */

// 모든 스펙이 만족되어야 함
export function allOf<TContext extends Record<string, any>>(
  ...specs: ISpecification<any>[]
): ISpecification<TContext> {
  return specs.reduce((acc, spec) => acc.and(spec)) as ISpecification<TContext>
}

// 하나 이상의 스펙이 만족되어야 함
export function anyOf<TContext extends Record<string, any>>(
  ...specs: ISpecification<any>[]
): ISpecification<TContext> {
  return specs.reduce((acc, spec) => acc.or(spec)) as ISpecification<TContext>
}

// 스펙이 만족되지 않아야 함
export function not<TContext extends Record<string, any>>(
  spec: ISpecification<TContext>
): ISpecification<TContext> {
  return spec.not()
}