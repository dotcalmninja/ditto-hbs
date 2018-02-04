const
  hbs = require('handlebars'),
  path = require('path');

module.exports = DittoHbsOpt;

function DittoHbsOpt(opt) {
  opt = opt || {};
  
  this.defaultTemplate = opt.defaultTemplate || 'index';
  this.partials = opt.partials || './templates/partials';
  this.templates = opt.templates || './templates';

  if (opt && typeof opt.helpers === 'function') {
    opt.helpers(hbs);
  }
};