'use strict';

const STATES = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected'
    };

function isThenable(p) {
    return p && (typeof p.then === 'function');
}

function delayed(fn) {
    setTimeout(() => { fn(); }, 0);
}

function Promise(fn) {
    let resolved = false,
        self = this;

    this._state = STATES.PENDING;
    this._thenArray = [];
    this._val = undefined;

    fn(resolve, reject);
    return this;

    function resolve(val) {
        if(!resolved) {
            resolved = true;
            singleResolve(val);
        }
    }

    function singleResolve(val) {
        let innerResolved = false;

        if(isThenable(val)) {
            val.then(
                (v) => {
                    if(!innerResolved) {
                        innerResolved = true;
                        singleResolve(v);
                    }
                },
                (e) => {
                    if(!innerResolved) {
                        innerResolved = true;
                        singleReject(e);
                    }
                }
            );
        } else {
            runThensWithFulfillment(val, self);
        }
    }

    function reject(err) {
        if(!resolved) {
            resolved = true;
            singleReject(err);
        }
    }

    function singleReject(err) {
        runThensWithRejection(err, self);
    }
}

function runThensWithRejection(err, self) {
    self._val = err;
    self._state = STATES.REJECTED;
    self._thenArray.forEach((item) => {
        runThenWithRejection(item, err);
    });
}

function runThenWithRejection(thenObj, err) {
    delayed(() => {
        try {
            let res = thenObj.onRejected(err);
            thenObj.resolve(res);
        } catch(e) {
            thenObj.reject(e);
        }
    });
}

function runThensWithFulfillment(val, self) {
    self._val = val;
    self._state = STATES.FULFILLED;
    self._thenArray.forEach((item) => {
        runThenWithFulfillment(item, val);
    });
}

function runThenWithFulfillment(thenObj, val) {
    delayed(() => {
        try {
            let res = thenObj.onFulfilled(val);
            thenObj.resolve(res);
        } catch(e) {
            thenObj.reject(e);
        }
    });
}

Promise.prototype.then = function(onFulfilled, onRejected) {
    if(typeof onFulfilled !== 'function') {
        onFulfilled = (v) => v;
    }
    if(typeof onRejected !== 'function') {
        onRejected = (e) => { throw e; };
    }
    return _then(onFulfilled, onRejected, this);
}

function _then(onFulfilled, onRejected, promise) {
    let state = promise._state;

    if(state === STATES.PENDING) {
        return pendingThen(onFulfilled, onRejected, promise);
    } else if(state === STATES.FULFILLED) {
        return fulfilledThen(onFulfilled, promise);
    } else {
        return rejectedThen(onRejected, promise);
    }
}

function pendingThen(onFulfilled, onRejected, promise) {
    return new Promise((resolve, reject) => {
        promise._thenArray.push({
            onFulfilled,
            onRejected,
            resolve,
            reject
        });
    });
}

function fulfilledThen(onFulfilled, promise) {
    return new Promise((resolve, reject) => {
        delayed(() => { 
            let res = onFulfilled(promise._val);
            resolve(res);
        });
    });
}

function rejectedThen(onRejected, promise) {
    return new Promise((resolve, reject) => {
        delayed(() => {
            try {
                let res = onRejected(promise._val);
                resolve(res);
            } catch(e) {
                reject(e);
            }
        });
    })
}

module.exports = Promise;