'use strict';

// fn - promise producing function, actually we are wrapping it in Promise.resolve so return value doesn't matter
// trials - number of trials
function promiseRetry(fn, trials) {
    return new Promise((resolve, reject) => {
        let count = 0;

        Promise.resolve(fn())
            .then(onFulfilled, onRejected);

        function onFulfilled(val) {
            resolve(val);
            return val;
        }

        function onRejected(err) {
            if(count < trials) {
                count++;
                return Promise.resolve(fn())
                    .then(onFulfilled, onRejected);
            } else {
                reject(err);
                // Should this error be swallowed - makes sense since the original promise's handlers will be notified
                // of errors nonetheless and we are passing the error onto our returned promise.
                // throw err;
            }
        }
    });
}

module.exports = promiseRetry;