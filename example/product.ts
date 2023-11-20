export class Product {
  private _price: number;
  private _name: string;

  constructor(price: number, name: string) {
    this._price = price
    this._name = name;
  }
  get name() {
    return this._name;
  }
  get price() {
    return this._price;
  }
  static get name() {
    return (c: Product) => c._name
  }
  static get info() {
    return (c: Product) => ({ name: c._name, price: c._price });
  }
}

export default Product;