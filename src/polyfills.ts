/**
 * Polyfills for ECMAScript features not yet implemented in older or current WebKit / Safari (iOS):
 * - Map.prototype.getOrInsertComputed
 * - Map.prototype.getOrInsert
 * - WeakMap.prototype.getOrInsertComputed
 * - WeakMap.prototype.getOrInsert
 * - Promise.withResolvers
 */

declare global {
  interface Map<K, V> {
    getOrInsertComputed?(key: K, callbackfn: (key: K) => V): V;
    getOrInsert?(key: K, defaultValue: V): V;
  }
  interface WeakMap<K extends object, V> {
    getOrInsertComputed?(key: K, callbackfn: (key: K) => V): V;
    getOrInsert?(key: K, defaultValue: V): V;
  }
}

if (typeof Map !== 'undefined') {
  if (!Map.prototype.getOrInsertComputed) {
    Map.prototype.getOrInsertComputed = function (key: any, callbackfn: (key: any) => any) {
      if (this.has(key)) {
        return this.get(key);
      }
      const value = callbackfn(key);
      this.set(key, value);
      return value;
    };
  }

  if (!Map.prototype.getOrInsert) {
    Map.prototype.getOrInsert = function (key: any, defaultValue: any) {
      if (this.has(key)) {
        return this.get(key);
      }
      this.set(key, defaultValue);
      return defaultValue;
    };
  }
}

if (typeof WeakMap !== 'undefined') {
  if (!WeakMap.prototype.getOrInsertComputed) {
    WeakMap.prototype.getOrInsertComputed = function (key: any, callbackfn: (key: any) => any) {
      if (this.has(key)) {
        return this.get(key);
      }
      const value = callbackfn(key);
      this.set(key, value);
      return value;
    };
  }

  if (!WeakMap.prototype.getOrInsert) {
    WeakMap.prototype.getOrInsert = function (key: any, defaultValue: any) {
      if (this.has(key)) {
        return this.get(key);
      }
      this.set(key, defaultValue);
      return defaultValue;
    };
  }
}

if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};
