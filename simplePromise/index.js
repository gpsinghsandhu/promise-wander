'use strict';

const MyPromise = require('./promise.js');

main();

function main() {
    let p = generatePromise('p', 500);

    let p1 = p.then(
        (v) => { console.log('p', v); return v+1; },
        (e) => { console.log(e); }
    );

    p1.then((v) => { console.log('p1', v); });

    MyPromise.all([1, 2])
        .then(console.log);

    console.log(MyPromise.all());

    var p3 = generatePromise('p3', 1000),
        p4 = generatePromise('p4', 2000);

    Promise.all([p3, p4])
        .then(prettyLog);

    Promise.race([p3, p4])
        .then(prettyLog);

    Promise.all([])
        .then(prettyLog);
}

function generatePromise(val, timeout) {
    return new MyPromise((resolve, reject) => {
        setTimeout(() => { resolve(val); }, timeout);
    });
}

function prettyLog(x) {
    if(typeof x === 'object') {
        console.log(JSON.stringify(x, null, 2));
    } else {
        console.log(x);
    }
    return x;
}