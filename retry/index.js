'use strict';

let promiseRetry = require('./promiseRetry.js');

function delayedRejectedPromise(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject('rejected'), time);
    });
}

function delayedResolvedPromise(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve('fulfilled'), time);
    });
}

var getSamplePromises = (() => {
    let count = 0;

    return () => {
        if(count < 3) {
            count++;
            return delayedRejectedPromise(1000);
        } else {
            return delayedResolvedPromise(1000);
        }
    }
})();

function main() {

    // this should fail
    promiseRetry(getSamplePromises, 2)
        .then((x) => console.log(x), (e) => console.log(e))
        // this should be success
        .then(() => promiseRetry(getSamplePromises, 4))
        .then((x) => console.log(x), (e) => console.log(e));
}

main();