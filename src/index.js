/*
 * Ditto Handlebars Middleware
 */
const 
	events = require('events'),
	fs = require('fs'),
	hbs = require('handlebars'),
	path = require('path'),
	util = require('util');

module.exports = DittoHbs;

function DittoHbs(opt) {
	events.EventEmitter.call(this);

	opt = opt || {};

	return function(files, Ditto, done){
		this.run(files, Ditto, done);
	};
};

/* Inherit Event Emitter prototype */
util.inherits(DittoHbs, events.EventEmitter);

/* Run */
DittoHbs.prototype.run = function(files, Ditto, done){
	console.log("das");
};

/* Register Partials */
DittoHbs.prototype.registerPartials = function(opt){
	var 
		self = this,
		partialsDir = path.resolve(opt.partials),
		promises = [];		
		
	if(opt.partials)
	{
		var partialsDir = path.resolve(opt.partials);		
		
		fs.readdir(partialsDir, function(err, filepaths){				
			if(err) throw err;

			filepaths.map(function(filepath){					
				if (path.extname(filepath) === '.hbs')
				{
					promises.push(self.registerPartial(filepath));
				}					
			});
		});
	}

	Promise.all(promises)
    .then(function(){
      self.emit("registeredPartials");
    })
    .catch(function(reason){
      throw new Error(reason);
    });
};

DittoHbs.prototype.registerPartial = function(filepath){
	return new Promise(function(resolve, reject){
		fs.readFile(filepath, function(err, data){							
			if(err) {
				console.error(err);
				reject(err);
			}
			else {
				hbs.registerPartial(path.parse(filepath).name, data);
				resolve();
			}			
		});		
	});
};
