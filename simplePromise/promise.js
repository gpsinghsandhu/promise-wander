'use strict';

const STATES = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected'
    };

function isObject(p) {
    return p !== null && (typeof p === 'object');
}

function isThenable(p) {
    if(typeof p === 'object' || typeof p === 'function') {
        if(typeof then === 'function') {
            return true;
        }
    }
    return false;
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

    try {
        fn(resolve, reject);
    } catch(e) {
        reject(e);
    }
    return this;

    function resolve(val) {
        if(!resolved) {
            resolved = true;
            singleResolve(val);
        }
    }

    function singleResolve(val) {
        let innerResolved = false,
            thenFn;

        if(val === self) {
            singleReject(new TypeError('then returns same promise'));
        } else if(isObject(val) || typeof val === 'function') {
            try {
                thenFn = val.then;
            } catch(e) {
                singleReject(e);
                return;
            }

            if(typeof thenFn === 'function') {
                try {
                    thenFn.call(
                        val,
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
                } catch(e) {
                    if(!innerResolved) {
                        singleReject(e);
                    }
                }
            } else {
                runThensWithFulfillment(val, self);
            }
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

Promise.prototype.then = function(onFulfilled, onRejected) {
    if(typeof onFulfilled !== 'function') {
        onFulfilled = (v) => v;
    }
    if(typeof onRejected !== 'function') {
        onRejected = (e) => { throw e; };
    }
    return _then(onFulfilled, onRejected, this);
};

Promise.resolve = function(val) {
    return new Promise((resolve, reject) => resolve(val));
};

Promise.reject = function(rejection) {
    return new Promise((resolve, reject) => reject(rejection));
};

Promise.all = function(promiseArr) {
    // better error than native promises
    if(!Array.isArray(promiseArr)) {
        return Promise.reject('non-array passed to Promise.all');
    }

    // Native promise behaviour
    if(promiseArr.length === 0) {
        return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
        let total = promiseArr.length,
            count = 0,
            results = [];

        promiseArr.forEach((item, index) => {
            Promise.resolve(item)
                .then(
                    (v) => {
                        count++;
                        results[index] = v;

                        if(count >= total) {
                            resolve(results);
                        }
                    },
                    (e) => reject(e)
                );
        });
    });
};

Promise.race = function(promiseArr) {
    // better error than native promises
    if(!Array.isArray(promiseArr)) {
        return Promise.reject('non-array passed to Promise.race');
    }

    // Non-native behaviour, native promise return pending promise that never resolves
    if(promiseArr.length === 0) {
        return Promise.reject('empty-array passed to Promise.race');
    }

    return new Promise((resolve, reject) => {
        promiseArr.forEach((item) => {
            Promise.resolve(item)
                .then(
                    (v) => resolve(v),
                    (e) => reject(e)
                );
        });
    });
};

function runThensWithRejection(err, self) {
    self._val = err;
    self._state = STATES.REJECTED;
    self._thenArray.forEach((item) => {
        runThenWithRejection(item, err, self);
    });
}

function runThenWithRejection(thenObj, err, promise) {
    delayed(() => {
        try {
            let res = thenObj.onRejected(err);
            if(res === promise) {
                throw new TypeError('then returns same promise');
            }
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
        runThenWithFulfillment(item, val, self);
    });
}

function runThenWithFulfillment(thenObj, val, promise) {
    delayed(() => {
        try {
            let res = thenObj.onFulfilled(val);
            if(res === promise) {
                throw new TypeError('then returns same promise');
            }
            thenObj.resolve(res);
        } catch(e) {
            thenObj.reject(e);
        }
    });
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
            try {
                let res = onFulfilled(promise._val);
                if(res === promise) {
                    throw new TypeError('then returns same promise');
                }
                resolve(res);
            } catch(e) {
                reject(e);
            }
        });
    });
}

function rejectedThen(onRejected, promise) {
    return new Promise((resolve, reject) => {
        delayed(() => {
            try {
                let res = onRejected(promise._val);
                if(res === promise) {
                    throw new TypeError('then returns same promise');
                }
                resolve(res);
            } catch(e) {
                reject(e);
            }
        });
    });
}

module.exports = Promise;