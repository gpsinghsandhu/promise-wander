'use strict';

let chai = require('chai'),
    assert = chai.assert,
    MyPromise = require('./promise.js'),
    chaiAsPromised = require('chai-as-promised'),
    adapter = require('./testAdapter.js'),
    nativeAdapter = require('./nativeAdapter.js');

chai.use(chaiAsPromised);

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

describe('Promises/A+ compliance Tests', function() {
    require("promises-aplus-tests").mocha(adapter);
});

// describe('Promises/A+ compliance Tests native', function() {
//     require("promises-aplus-tests").mocha(nativeAdapter);
// });