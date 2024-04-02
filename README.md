[![](https://img.shields.io/npm/v/spec-pattern-ts/latest)](https://www.npmjs.com/package/spec-pattern-ts/v/latest) [![Static Badge](https://img.shields.io/badge/Specification%20pattern%20-%20Wikipedia?style=flat&logo=wikipedia&color=%234F4F4F&link=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FSpecification_pattern%23TypeScript)](https://en.wikipedia.org/wiki/Specification_pattern#TypeScript)

## using

```sh
npm install spec-pattern-ts
```

```ts
import { Spec, type ISpecification } from 'spec-pattern-ts'

const product = new Product()

// 새롭게 추가된 상품인지 확인하는 스펙
const isNewSpec: ISpecification<Product> = new Spec(
  (candidate) => candidate.isNew === true
)
// 상품의 갯수가 0개이상인지 확인하는 스펙
const isQtyChangedSpec: ISpecification<Product> = new Spec(
  (candidate) => candidate.qty > 0
)
// 새롭게 추가된 상품이 아니고 기존 상품이면서 갯수가 변경되고 1개 이상일때
const isOriginalAndQtyChangedSpec: ISpecification<Product> =
  isNewSpec
    .not()
    .and(isQtyChangedSpec)

if (isNewSpec.isSatisfiedBy(product)) {
  return 'A'
}
if (isOriginalAndQtyChangedSpec.isSatisfiedBy(product)) {
  return 'B'
}
```

## Feature

- ts 에제가있지만 항상 타입이 unkown인 문제
- 제네릭타입으로 받아올수있도록 타입을 추가
- Spec 클래스를 추가