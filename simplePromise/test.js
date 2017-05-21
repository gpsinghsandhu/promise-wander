'use strict';

var chai = require('chai'),
    assert = chai.assert,
    MyPromise = require('./promise.js'),
    chaiAsPromised = require('chai-as-promised'),
    adapter = require('./testAdapter.js'),
    nativeAdapter = require('./nativeAdapter.js');

chai.use(chaiAsPromised);

describe('Promise constructor', function() {

    it('should return something like promise (i.e with then function)', function() {
        var promise = new MyPromise(function(reject, resolve) {});

        assert.isObject(promise, 'promise is object');
        assert.isFunction(promise.then, 'promise has a then method');
    });

    it('should return a promise that resolves', function() {
        var promise = new MyPromise(function(resolve, reject) { setTimeout(() => resolve('val'), 10); });

        return assert.isFulfilled(promise, 'promise should fulfill');
    });

    it('should return a promise that rejects', function() {
        var promise = new MyPromise(function(resolve, reject) { setTimeout(() => reject('val'), 10); });

        return assert.isRejected(promise, 'val', 'promise should reject');
    });

    it('should return rejected promise if passed fn throws', function() {
        var err = new Error('error'),
            promise = new MyPromise((resolve, reject) => {throw err;});

        return assert.isRejected(promise, 'error', 'promise should reject');
    });
});

describe('Promises/A+ compliance Tests', function() {
    require("promises-aplus-tests").mocha(adapter);
});

// describe('Promises/A+ compliance Tests native', function() {
//     require("promises-aplus-tests").mocha(nativeAdapter);
// });