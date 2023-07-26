export interface ISpecification<T = unknown> {
  isSatisfiedBy(candidate: T): boolean
  and(other: ISpecification<T>): ISpecification<T>
  andNot(other: ISpecification<T>): ISpecification<T>
  or(other: ISpecification<T>): ISpecification<T>
  orNot(other: ISpecification<T>): ISpecification<T>
  not(): ISpecification<T>
}

export abstract class CompositeSpecification<T = unknown>
  implements ISpecification<T>
{
  abstract isSatisfiedBy(candidate: T): boolean

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, other)
  }

  andNot(other: ISpecification<T>): ISpecification<T> {
    return new AndNotSpecification(this, other)
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, other)
  }

  orNot(other: ISpecification<T>): ISpecification<T> {
    return new OrNotSpecification(this, other)
  }

  not(): ISpecification<T> {
    return new NotSpecification(this)
  }
}

export class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private leftCondition: ISpecification<T>,
    private rightCondition: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.leftCondition.isSatisfiedBy(candidate) &&
      this.rightCondition.isSatisfiedBy(candidate)
    )
  }
}

export class AndNotSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private leftCondition: ISpecification<T>,
    private rightCondition: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.leftCondition.isSatisfiedBy(candidate) &&
      this.rightCondition.isSatisfiedBy(candidate) !== true
    )
  }
}

export class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private leftCondition: ISpecification<T>,
    private rightCondition: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.leftCondition.isSatisfiedBy(candidate) ||
      this.rightCondition.isSatisfiedBy(candidate)
    )
  }
}

export class OrNotSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private leftCondition: ISpecification<T>,
    private rightCondition: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.leftCondition.isSatisfiedBy(candidate) ||
      this.rightCondition.isSatisfiedBy(candidate) !== true
    )
  }
}

export class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private wrapped: ISpecification<T>) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.wrapped.isSatisfiedBy(candidate)
  }
}

export class Spec<T = unknown> extends CompositeSpecification<T> {
  #expression: (candidate: T) => boolean

  constructor(expression: (candidate: T) => boolean) {
    super()
    this.#expression = expression
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.#expression(candidate)
  }
}
