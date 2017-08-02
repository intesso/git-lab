var qs = require('qs')
var assert = require('assert')


var str;
str = qs.parse('a.b=c', { allowDots: true, arrayFormat: 'repeat' });
assert.deepEqual(str, { a: { b: 'c' } });

str = qs.parse('a.b=c&a.b=d', { allowDots: true, arrayFormat: 'repeat' });
assert.deepEqual(str, { a: { b: ['c', 'd'] } });

str = qs.parse('a[b]=c', { allowDots: true, arrayFormat: 'repeat' });
assert.deepEqual(str, { a: { b: 'c' } });

str = qs.parse('a[b]=c', { allowDots: true, arrayFormat: 'repeat' });
assert.deepEqual(str, { a: { b: 'c' } });



var obj;
obj = qs.stringify({ a: { b: { c: 'd', e: 'f' } } }, { allowDots: true, arrayFormat: 'repeat' });
assert.deepEqual(obj, 'a.b.c=d&a.b.e=f');
// 'a.b.c=d&a.b.e=f'
