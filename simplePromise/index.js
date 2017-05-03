'use strict';

const MyPromise = require('./promise.js');

main();

function main() {
    let p = new MyPromise((resolve, reject) => {
        setTimeout(() => { resolve(1); }, 2000);
    });

    let p1 = p.then(
        (v) => { console.log('p', v); return v+1; },
        (e) => { console.log(e); }
    );

    p1.then((v) => { console.log('p1', v); });

    console.log(p1);

    console.log(p);
}