// import { Metadata } from '@aurelia/metadata';
import { all, DI, IContainer, Registration } from '@aurelia/kernel';
import { assert } from '@aurelia/testing';

describe.only('1-kernel/di.getAll.spec.ts', function () {
  let container: IContainer;

  // eslint-disable-next-line mocha/no-hooks
  beforeEach(function () {
    container = DI.createContainer();
  });

  describe('good', function () {
    // eslint-disable
    for (const searchAncestors of [true, false])
    for (const regInChild of [true, false])
    for (const regInParent of [true, false]) {
      // eslint-enable
      it(`@all(_, ${searchAncestors}) + [child ${regInChild}] + [parent ${regInParent}]`, function () {
        class Foo {
          public constructor(@all('test', searchAncestors) public readonly test: string[]) {}
        }
        const child = container.createChild();
        if (regInParent) {
          container.register(Registration.instance('test', 'test1'));
        }
        if (regInChild) {
          child.register(Registration.instance('test', 'test0'));
        }
        const expectation: string[] = regInChild ? ['test0'] : [];
        if (regInParent && (searchAncestors || !regInChild)) {
          expectation.push('test1');
        }
        assert.deepStrictEqual(child.get(Foo).test, expectation);
      });
    }
  });

  describe('realistic usage', function () {
    interface IAttrPattern {
      id: number;
    }

    const IAttrPattern = DI.createInterface<IAttrPattern>('IAttrPattern');
    // eslint-disable
    for (const searchAncestors of [true, false])
    for (const regInChild of [true, false])
    for (const regInParent of [true, false]) {
      // eslint-enable
      it.only(`@all(IAttrPattern, ${searchAncestors}) + [child ${regInChild}] + [parent ${regInParent}]`, function () {
        class Foo {
          public constructor(@all(IAttrPattern, searchAncestors) public readonly attrPatterns: IAttrPattern[]) {}
          public patterns(): number[] {
            return this.attrPatterns.map(ap => ap.id);
          }
        }
        const child = container.createChild();
        if (regInParent) {
          Array
            .from({ length: 5 }, (_, idx) => class implements IAttrPattern {
              public static register(c: IContainer): void {
                Registration.singleton(IAttrPattern, this).register(c);
              }
              public id: number = idx;
            })
            .forEach(klass => container.register(klass));
        }
        if (regInChild) {
          Array
            .from({ length: 5 }, (_, idx) => class implements IAttrPattern {
              public static register(c: IContainer): void {
                Registration.singleton(IAttrPattern, this).register(c);
              }
              public id: number = idx + 5;
            })
            .forEach(klass => child.register(klass));
        }
        const parentExpectation = [];
        const childExpectation = regInChild ? [5, 6, 7, 8, 9] : [];
        if (regInParent) {
          if (searchAncestors || !regInChild) {
            childExpectation.push(0, 1, 2, 3, 4);
          }
          parentExpectation.push(0, 1, 2, 3, 4);
        }

        if (regInChild) {
          debugger;
        }
        assert.deepStrictEqual(child.get(Foo).patterns(), childExpectation);
        assert.deepStrictEqual(container.get(Foo).patterns(), regInChild ? parentExpectation : childExpectation);
      });
    }
  });
});
