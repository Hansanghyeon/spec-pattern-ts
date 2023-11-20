[Specification pattern - Wikipedia](https://en.wikipedia.org/wiki/Specification_pattern#TypeScript) 

- ts 에제가있지만 항상 타입이 unkown인 문제가있다.
- 제네릭타입으로 받아올수있도록 타입을 추가하였다.
- Spec 클래스를 추가하였다.

```ts
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
