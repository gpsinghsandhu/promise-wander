'use strict';

let chai = require('chai'),
    sinon = require('sinon'),
    assert = chai.assert,
    MyPromise = require('./promise.js'),
    chaiAsPromised = require('chai-as-promised'),
    adapter = require('./testAdapter.js'),
    nativeAdapter = require('./nativeAdapter.js');

chai.use(chaiAsPromised);
sinon.assert.expose(chai.assert, { prefix: '' });

let utils = {
    getPendingPromise: function() {
        return new Promise(_ => null);
    },
    getRejectedPromise: function(reason) {
        return Promise.reject(reason);
    },
    getFulfilledPromise: function(val) {
        return Promise.resolve(val);
    },
    delayed: function(time = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    },
    deferred: function() {
        let resolve, reject;
        let promise = new MyPromise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        return { resolve, reject, promise };
    }
};

describe('Promise constructor', function() {

    it('should return something like promise (i.e object with then method)', function() {
        let promise = new MyPromise(function(reject, resolve) {});

        assert.isObject(promise, 'promise is object');
        assert.isFunction(promise.then, 'promise has a then method');
    });

    it('should return a promise that resolves', function() {
        let promise = new MyPromise(function(resolve, reject) { setTimeout(() => resolve('val'), 10); });

        return assert.isFulfilled(promise, 'promise should fulfill');
    });

    it('should return a promise that rejects', function() {
        let promise = new MyPromise(function(resolve, reject) { setTimeout(() => reject('val'), 10); });

        return assert.isRejected(promise, 'val', 'promise should reject');
    });

    describe('fn is passed to constructor', function() {
        it('should return rejected promise if passed fn throws', function() {
            let err = new Error('error'),
                promise = new MyPromise((resolve, reject) => {throw err;});

            return assert.isRejected(promise, 'error', 'promise should reject');
        });

        it('should ignore thrown error if resolved called first', function() {
            let promise = new MyPromise((resolve, reject) => { resolve('some'); throw new Error('error'); });

            return assert.becomes(promise, 'some', 'thrown error not ignored');
        });

        it('should ignore thrown error if reject called first', function() {
            let promise = new MyPromise((resolve, reject) => { reject('some'); throw new Error('error'); });

            return assert.isRejected(promise, 'some', 'thrown error not ignored');
        });
    });
});

describe('Promise then fn', function() {
    it('should accept a onFulfilled function and onRejected function', function() {
        let promise = utils.getPendingPromise(),
            onFulfilled = x => x,
            onRejected = e => { throw e; };

        promise.then(onFulfilled, onRejected);
        promise.then(onFulfilled);
        promise.then(null, onRejected);
        promise.then(null, null);
        promise.then(null);
        promise.then();
    });

    it('should return a promise', function() {
        let promise = utils.deferred().promise,
            newPromise = promise.then(sinon.spy(), sinon.spy());

        assert.isFunction(newPromise.then);
    });

    it('should return a new Promise', function() {
        let promise = utils.deferred().promise,
            newPromise = promise.then(sinon.spy(), sinon.spy());

        assert.notStrictEqual(newPromise, promise);
    });

    describe('onFulfilled fn should be called when Promise is resolved', function() {
        it('for ultimately fulfilled promise', function() {
            let resolve;
            let promise = new MyPromise((_resolve, _reject) => {
                resolve = _resolve;
            });
            let onFulfilled = sinon.spy();

            promise.then(onFulfilled);

            assert(onFulfilled.notCalled);
            resolve('success');

            utils.delayed(() => { assert(onFulfilled.calledWith('success')); });
        });

        it('for already fulfilled promise', function() {
            let promise = MyPromise.resolve('success');
            let onFulfilled = sinon.spy();

            promise.then(onFulfilled);
            utils.delayed(() => { assert(onFulfilled.calledWith('success')); });
        });
    });

    describe('onRejected fn should be called when Promise is rejected', function() {
        it('for ultimately rejected promise', function() {
            let reject;
            let promise = new MyPromise((_resolve, _reject) => {
                reject = _reject;
            });
            let onRejected = sinon.spy();

            promise.then(onRejected);

            assert(onRejected.notCalled);
            reject('error');

            utils.delayed(() => { assert(onRejected.calledWith('error')); });
        });

        it('for already rejected promise', function() {
            let promise = MyPromise.reject('error');
            let onRejected = sinon.spy();

            promise.then(null, onRejected);
            return utils.delayed()
                .then(() => { assert(onRejected.calledWith('error'), 'onRejected not called with error'); });
        });
    });

    describe('then can be called mulitple times on promise', function() {
        it('all onFulfilled fns should be called for fulfilled promise', function () {
            let deferred = utils.deferred(),
                promise = deferred.promise,
                onFulfilled1 = sinon.spy(),
                onFulfilled2 = sinon.spy(),
                onFulfilled3 = sinon.spy();

            promise.then(onFulfilled1);
            promise.then(onFulfilled2);

            assert.notCalled(onFulfilled1);
            assert(onFulfilled2.notCalled);
            assert(onFulfilled3.notCalled);

            deferred.resolve('success');
            return utils.delayed()
                .then(() => {
                    assert(onFulfilled1.calledWith('success'));
                    assert(onFulfilled2.calledWith('success'));
                    assert(onFulfilled3.notCalled);
                })
                .then(() => {
                    promise.then(onFulfilled3);
                    return utils.delayed();
                })
                .then(() => {
                    assert(onFulfilled3.calledWith('success'));
                });
        });
    });
});

describe('Promise utils', function() {
    describe('all', function() {
        it('should resolve when all promises resolve', function() {
            let deferreds = [];

            for(let i=0; i<10; i++) {
                deferreds.push(utils.deferred());
            }

            let promises = deferreds.map(function(deferred) {
                return deferred.promise;
            });

            let finalPromise = MyPromise.all(promises),
                onFulfilled = sinon.spy(),
                onRejected = sinon.spy();

            finalPromise.then(onFulfilled, onRejected);

            for(let i=0; i<9; i++) {
                deferreds[i].resolve('success');
            }

            return utils.delayed()
                .then((x) => {
                    assert.notCalled(onFulfilled);
                    assert.notCalled(onRejected);
                    return x;
                })
                .then(() => {
                    deferreds[9].resolve('success');
                    return deferreds[9].promise;
                })
                .then(() => {
                    assert.calledOnce(onFulfilled);
                    assert.notCalled(onRejected);
                });
        });

        it('should reject when one promise rejects', function() {
            let deferreds = [];

            for(let i=0; i<10; i++) {
                deferreds.push(utils.deferred());
            }

            let promises = deferreds.map(function(deferred) {
                return deferred.promise;
            });

            let finalPromise = MyPromise.all(promises),
                onFulfilled = sinon.spy(),
                onRejected = sinon.spy();

            finalPromise.then(onFulfilled, onRejected);


            return utils.delayed()
                .then((x) => {
                    assert.notCalled(onFulfilled);
                    assert.notCalled(onRejected);
                    return x;
                })
                .then(() => {
                    deferreds[4].reject('error');
                    return utils.delayed();
                })
                .then(() => {
                    assert.notCalled(onFulfilled);
                    assert.calledOnce(onRejected);
                });
        });

        it('should return fulfilled promise when empty array is passed', function() {
            let promise = MyPromise.all([]);

            return assert.becomes(promise, []);
        });

        it('should return rejected promise if non-array is passed', function() {
            assert.isRejected(MyPromise.all());
            assert.isRejected(MyPromise.all(''));
            assert.isRejected(MyPromise.all(1));
            assert.isRejected(MyPromise.all(null));
        });
    });
});

describe('Promises/A+ compliance Tests', function() {
    require("promises-aplus-tests").mocha(adapter);
});

// describe('Promises/A+ compliance Tests native', function() {
//     require("promises-aplus-tests").mocha(nativeAdapter);
// });