'use strict';

var equal = require('../lib/compile/equal')
  , should = require('chai').should();


describe('equal', function() {
  it('should compare scalars', function() {
    equal(1, 1) .should.equal(true);
    equal(1, 2) .should.equal(false);
    equal(1, []) .should.equal(false);
    equal(0, null) .should.equal(false);

    equal('a', 'a') .should.equal(true);
    equal('a', 'b') .should.equal(false);
    equal('', null) .should.equal(false);

    equal(null, null) .should.equal(true);
    equal(true, true) .should.equal(true);
    equal(true, false) .should.equal(false);
    equal(true, 1) .should.equal(false);
    equal(false, 0) .should.equal(false);
  });


  it('should compare objects', function() {
    equal({ a: [ { b: 'c' } ] }, { a: [ { b: 'c' } ] }) .should.equal(true);
    equal({ a: [ { b: 'c' } ] }, { a: [ { b: 'd' } ] }) .should.equal(false);
    equal({ a: [ { b: 'c' } ] }, { a: [ { c: 'c' } ] }) .should.equal(false);
    equal({}, []) .should.equal(false);
    equal({}, {}) .should.equal(true);
  });

  it('should compare arrays', function() {
    equal([1, 2, 3], [1, 2, 3]) .should.equal(true);
    equal([1, 2, 3], [1, 2, 4]) .should.equal(false);
    equal([1, 2, 3], [1, 2]) .should.equal(false);
    equal([{a: 'a'}, {b: 'b'}], [{a: 'a'}, {b: 'b'}]) .should.equal(true);
    equal([{a: 'a'}, {b: 'b'}], [{a: 'a'}, {b: 'c'}]) .should.equal(false);
    equal({'0': 0, '1': 1, length: 2}, [0, 1]) .should.equal(false);
  });
});
