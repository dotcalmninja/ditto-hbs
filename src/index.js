/*
 * Ditto Handlebars Writer
 */
const 
	fs = require('fs'),
	hbs = require('handlebars'),
	path = require('path');

module.exports = DittoHbs;

function DittoHbs(opt) {
	opt = opt || {};

	var _registerPartials = [];

	if(opt.partials)
	{
		var partialsDir = path.resolve(opt.partials);		
		
		fs.readdir(partialsDir, function(err, filenames){				
			if(err) throw err;

			filenames.map(function(filename){					
				if (path.extname(filename) === '.hbs')
				{
					_registerPartials.push(registerPartial(path.resolve(partialsDir, filename)));
				}					
			});
		});
	}

  return function(files, Ditto) {  	
		Promise
			.all(_registerPartials)
			.then(function(){
				
			})
			.catch(function(err){
				console.error(err);
			});
  };
};

function registerPartial(filename){
	return new Promise(function(resolve, reject){
		fs.readFile(filename, function(err, data){							
			if(err) {
				console.error(err);
				reject(err);
			}
			else {
				hbs.registerPartial(path.parse(filename).name, data);
				resolve({});
			}			
		});		
	});
};

function compileTemplate(filename){
	return new Promise(function(resolve, reject){
		fs.readFile(filename, function(err, data){							
			if(err) {
				console.error(err);
				reject(err);
			}
			else {
				hbs.registerPartial(path.parse(filename).name, data);
				resolve({});
			}			
		});		
	});
};

function writeFile(filename){
	return new Promise(function(resolve, reject){

	});
};
