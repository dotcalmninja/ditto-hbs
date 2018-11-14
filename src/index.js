/*
 * Ditto Handlebars Middleware
 */
const
  async = require('async'),
  dittoHbsOpt = require('./opt'),
  fs = require('fs'),
  glob = require('glob'),
  hbs = require('handlebars'),
  path = require('path'),
  util = require('util');

module.exports = dittoHbs;

function dittoHbs(opt) {
  opt = new dittoHbsOpt(opt);

  /**
   * Discover files for given file pattern
   * @param {String} pattern glob pattern
   * @param {Function.<Error, Array.<string>>} callback
   */
  function discover(pattern, callback) {
    glob(pattern, function (err, filepaths) {
      if (err) callback(err);
      callback(null, filepaths);
    });
  };

  /**
   * Discover files in partials directory
   * @param {Function.<Error, Array.<string>>} callback
   */
  function discoverPartials(callback) {
    discover(path.join(opt.partials, '/*.hbs'), callback)
  };

  /**
   * Discover files in templates directory
   * @param {Function.<Error, Array.<string>>} callback
   */
  function discoverTemplates(callback) {
    discover(path.join(opt.templates, '/*.hbs'), callback);
  };

  /**
   * Read hbs partial files
   * @param {Array.<String>} filepaths 
   * @param {Function.<Error>} callback
   */
  function registerPartials(filepaths, callback) {
    async.map(filepaths, registerPartial, function (err) {
      if (err) callback(err);
      callback(null);
    });
  };

  /**
   * Read file into buffer and register as hbs partials
   * @param {String} filepath 
   * @param {Function.<Error>} callback
   */
  function registerPartial(filepath, callback) {
    fs.readFile(filepath, 'utf8', function (err, data) {
      if (err) callback(err);
      hbs.registerPartial(path.parse(filepath).name, data);
      callback(null);
    });
  };

  /**
   * Read hbs template files
   * @param {Array.<String>} filepaths 
   * @param {Function.<Error>} callback
   */
  function registerTemplates(filepaths, callback) {
    async.map(filepaths, registerTemplate, function (err, templates) {
      if (err) callback(err);
      callback(null, templates);
    });
  };

  /**
   * Read file into buffer and register as hbs template
   * @param {String} filepath 
   * @param {Function.<Error, Object>} callback
   */
  function registerTemplate(filepath, callback) {
    fs.readFile(filepath, 'utf8', function (err, data) {
      if (err) callback(err);
      callback(null, {
        name: path.parse(filepath).name,
        template: hbs.compile(data)
      });
    });
  };

  /**
   * @param {Array.<Object.<dittoFile>>} files 
   * @param {Object.<ditto>} ditto 
   * @param {Array.<Object>} templates
   * @param {Function.<Error>} callback
   */
  function renderHtml(files, ditto, templates, callback) {
    files.forEach(function (file) {
      //update the file extension  we're writing rendering html now
      file.setExt('.html');

      //build up array of potential templates
      let potentialTemplateNames = [file.path.name, file.path.dir.replace('/', '-'), opt.defaultTemplate];

      //resolve template
      potentialTemplateNames.some(function (potentialTemplateName) {
        var tmpl = templates.find(function (template) { return template.name == potentialTemplateName });

        if (tmpl) {
          //render
          file.content.metadata = ditto._metadata;
          file.content = tmpl.template(file.content);
          return true;
        }
      });
    });

    callback(null, files);
  };

  return function (files, ditto, done) {
    async.waterfall([
      discoverPartials,
      registerPartials,
      discoverTemplates,
      registerTemplates,
      renderHtml.bind(this, files, ditto)
    ], function (err, files) {
      done(err, files);
    });
  };
};

