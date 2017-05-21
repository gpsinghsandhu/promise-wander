'use strict';

var MyPromise = Promise;

function resolved(value) {
    return MyPromise.resolve(value);
}

function rejected(reason) {
    return MyPromise.reject(reason);
}

function deferred() {
    var promise, resolve, reject;

    promise = new Promise((_resolve, _reject) => {
        resolve = _resolve,
        reject = _reject;
    });

    return {
        promise,
        resolve,
        reject
    };
}

module.exports = {
    resolved,
    rejected,
    deferred
};