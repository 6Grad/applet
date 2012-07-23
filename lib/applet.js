
var utils = require('./utils')
  , mongo = require('mongoskin')
  , Applet = {}
  , db
  , templates = {}; //templates cache

//helper
function template (name) {
  return templates[name] || require(Applet.tplDir + name + '/cms.js');
}

module.exports = function (options) {

  if(!options.db) throw new Error('options.db required');
  if(!options.def) throw new Error('default applet required. (options.def)');
  if(!options.templates) throw new Error('where to find templates. (options.templates)');

  Applet.def = options.def;
  Applet.tplDir = options.templates;

  db = mongo.db(options.db);
  db.bind('applets');
  db.applets.ensureIndex({id: 1},{unique: true});

  return Applet;

};

Applet.install = function (applet, cb) {

  if (!applet.id) return cb(new Error('applet.id required'));

  applet = utils.merge(Applet.def, applet);
  applet.cms = template(applet.options.template);
  applet.createdAt = new Date();

  db.applets.insert(applet, {safe: true}, function (err, applets) {
    if (err) return cb(err);
    if (!applets.length) return cb(new Error('could not install applet ' + applet.id));
    cb(null, applets[0]);
  }); //{safe: true} ensures the unique id index
};

/*
 * Update applet.options.
 * Only those keys that are present in both options & defaultOptions.
 * New values are taken from options
*/
Applet.options = function (id, options, cb) {
  var update = { $set : {} };
  var c =  utils.intersect(Applet.def.options, options);
  for (var key in c ) {
    update.$set['options.' + key] = c[key];
    if (key === 'template') {
      update.$set.cms = template(c[key]);
    }
  }

  db.applets.update({id: id}, update, cb);

};

Applet.cms = function (id, data, cb) {

  var update = { $set : {}};
  update.$set['cms.' + data.page + '.' + data.id + '.data'] = data.data;

  db.applets.update({id: id}, update, cb);
};

Applet.preLoad = function (req, res, next) {};

/*
 * Middleware
 * Load req.applet.id and attach it to req.applet
 * Make sure to set req.applet.id before correctly.
 */
Applet.load = function (req, res, next) {

  var id = req.applet.id;

  if (!id) return next(new Error('req.applet.id is not set'));

  db.applets.findOne({id: id}, function (err, applet) {
    if (err) {
      next(err);
    } else if (applet) {
      //all good
      req.applet = utils.merge(applet, req.applet);
      next();
    } else {
      //install applet implicitly.
      Applet.install(req.applet, function (err, applet) {
        if (err) return next(err);
        applet.installed = true;
        req.applet = applet;
        next();
      });
    }
  });
};
