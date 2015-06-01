'use strict';

module.exports = function equal(a, b) {
  if (a === b) return true;
  if (typeof a != typeof b) return false;
  var typeA = Object.prototype.toString.call(a).slice(8, -1);
  if (typeA != Object.prototype.toString.call(b).slice(8, -1)) return false;
  switch (typeA) {
    case 'Object':
        if (Object.keys(a).length != Object.keys(b).length) return false;
        for (var key in a) if (!b.hasOwnProperty(key)) return false;
        for (var key in a) if (!equal(a[key], b[key])) return false;
        return true;
    case 'Array':
        if (a.length != b.length) return false;
        for (var i=0; i<a.length; i++)
          if (!equal(a[i], b[i])) return false;
        return true;
    case 'Date': return a.getTime() == b.getTime();
    case 'RegExp': return a.toString() == b.toString();
    default: return false;
  }
}
