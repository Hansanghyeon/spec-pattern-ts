/**
 * spec-pattern-ts v2.0.0
 * 모든 스펙은 키를 가져야 합니다.
 */

/**
 * 스펙 인터페이스 - v2에서는 키가 필수
 * @template K - 스펙의 키
 * @template T - 검증할 타입
 */
export interface ISpecification<K extends string, T> {
  readonly key: K
  isSatisfiedBy(candidate: { [P in K]: T }): boolean
  and<K2 extends string, T2>(
    other: ISpecification<K2, T2>
  ): ICompositeSpecification<{ [P in K]: T } & { [P in K2]: T2 }>
  or<K2 extends string, T2>(
    other: ISpecification<K2, T2>
  ): ICompositeSpecification<{ [P in K]: T } | { [P in K2]: T2 }>
  not(): ISpecification<K, T>
}

/**
 * 복합 스펙 인터페이스
 */
export interface ICompositeSpecification<TContext extends Record<string, any>> {
  isSatisfiedBy(candidate: TContext): boolean
  and<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext & { [P in K]: T }>
  or<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext | { [P in K]: T }>
  not(): ICompositeSpecification<TContext>
}

/**
 * 기본 스펙 구현
 */
export class Specification<K extends string, T> implements ISpecification<K, T> {
  constructor(
    readonly key: K,
    private predicate: (value: T) => boolean
  ) {}

  isSatisfiedBy(candidate: { [P in K]: T }): boolean {
    return this.key in candidate && this.predicate(candidate[this.key])
  }

  and<K2 extends string, T2>(
    other: ISpecification<K2, T2>
  ): ICompositeSpecification<{ [P in K]: T } & { [P in K2]: T2 }> {
    return new CompositeSpecification([this as any, other as any])
  }

  or<K2 extends string, T2>(
    other: ISpecification<K2, T2>
  ): ICompositeSpecification<{ [P in K]: T } | { [P in K2]: T2 }> {
    return new OrSpecification([this as any, other as any])
  }

  not(): ISpecification<K, T> {
    return new Specification(this.key, (value) => !this.predicate(value))
  }
}

/**
 * AND 복합 스펙
 */
class CompositeSpecification<TContext extends Record<string, any>> 
  implements ICompositeSpecification<TContext> {
  
  constructor(
    private specs: Array<ISpecification<any, any>>
  ) {}

  isSatisfiedBy(candidate: TContext): boolean {
    // 키 중복 체크 및 스마트 처리
    const keyMap = new Map<string, Array<ISpecification<any, any>>>()
    
    for (const spec of this.specs) {
      if (!keyMap.has(spec.key)) {
        keyMap.set(spec.key, [])
      }
      keyMap.get(spec.key)!.push(spec)
    }

    // 각 키별로 검증
    for (const [key, specs] of keyMap) {
      if (!(key in candidate)) return false
      
      // 같은 키의 모든 스펙이 AND 조건으로 만족되어야 함
      const allSatisfied = specs.every(spec => 
        spec.isSatisfiedBy({ [key]: candidate[key] } as any)
      )
      if (!allSatisfied) return false
    }

    return true
  }

  and<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext & { [P in K]: T }> {
    return new CompositeSpecification([...this.specs, spec as any])
  }

  or<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext | { [P in K]: T }> {
    return new OrSpecification([this, spec as any])
  }

  not(): ICompositeSpecification<TContext> {
    return new NotCompositeSpecification(this)
  }
}

/**
 * OR 복합 스펙
 */
class OrSpecification<TContext extends Record<string, any>> 
  implements ICompositeSpecification<TContext> {
  
  constructor(
    private specs: Array<ISpecification<any, any> | ICompositeSpecification<any>>
  ) {}

  isSatisfiedBy(candidate: TContext): boolean {
    return this.specs.some(spec => spec.isSatisfiedBy(candidate))
  }

  and<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext & { [P in K]: T }> {
    // OR 다음에 AND는 새로운 CompositeSpec으로
    return new CompositeSpecification([this as any, spec as any])
  }

  or<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext | { [P in K]: T }> {
    return new OrSpecification([...this.specs, spec as any])
  }

  not(): ICompositeSpecification<TContext> {
    return new NotCompositeSpecification(this)
  }
}

/**
 * NOT 복합 스펙
 */
class NotCompositeSpecification<TContext extends Record<string, any>> 
  implements ICompositeSpecification<TContext> {
  
  constructor(
    private spec: ICompositeSpecification<TContext>
  ) {}

  isSatisfiedBy(candidate: TContext): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }

  and<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext & { [P in K]: T }> {
    return new CompositeSpecification([this as any, spec as any])
  }

  or<K extends string, T>(
    spec: ISpecification<K, T>
  ): ICompositeSpecification<TContext | { [P in K]: T }> {
    return new OrSpecification([this as any, spec as any])
  }

  not(): ICompositeSpecification<TContext> {
    return this.spec // NOT의 NOT은 원본
  }
}

/**
 * 스펙 생성 함수
 */
export function Spec<K extends string, T>(
  key: K,
  predicate: (value: T) => boolean
): ISpecification<K, T> {
  return new Specification(key, predicate)
}

/**
 * 스펙 정의 빌더
 */
export class SpecBuilder<T> {
  constructor(private predicate: (value: T) => boolean) {}

  as<K extends string>(key: K): ISpecification<K, T> {
    return new Specification(key, this.predicate)
  }
}

/**
 * 스펙 정의를 시작하는 헬퍼
 */
export function define<T>(predicate: (value: T) => boolean): SpecBuilder<T> {
  return new SpecBuilder(predicate)
}