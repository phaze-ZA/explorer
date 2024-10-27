export class ObjectPool<T> {
  private readonly _objects: Array<T> = [];
  constructor() {}

  get(): T {
    const item = this._objects.shift();

    if (!item) {
      throw new Error('Pool Limit Reached.');
    }

    return item;
  }

  add(item: T): void {
    this._objects.push(item);
  }
}
