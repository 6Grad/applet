var utils = module.exports = {};

/*
 * Merge keys from b into a.
 * Max Depth is 1.
 *
 * @return a
 */
utils.merge = function (a, b, _depth) {
  var depth = _depth || 0;

  //maxdepth 1
  if (depth > 1) return a;

  for (var key in b) {
    if (typeof a[key] === 'object') {
      a[key] = utils.merge(a[key], b[key], (depth + 1) );
    } else {
      a[key] = b[key];
    }
  }

  return a;
};


/*
 * Return intersection between a and b.
 * Take values from b.
 */
utils.intersect = function (a, b) {

  var c = {};

  for (var key in b) {
    if (typeof a[key] !== 'undefined') {
      c[key] = b[key];
    }
  }

  return c;

};
