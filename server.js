var express = require('express');
var fs = require('fs');
var path = require('path');
var Velocity = require('velocityjs');
var serveIndex = require('serve-index');
var app = express();
var config = require('./config/default.json');
app.set('port', process.env.PORT || config.port || 3000);


var getExtname = function(filepath){
	return path.extname(filepath);
};

var getBasename = function(vmPath){
	var extname = getExtname(vmPath);
	return path.basename(vmPath, extname);
}

var parseVm = function(req, res, next){
	var isVm = config.vm.indexOf(getExtname(req.path)) >= 0;
	var basename = getBasename(req.path);
	if(!isVm){
		return next();
	};
	
	var template = fs.readFileSync(config.webapps + req.path,'utf-8');
	var parseArr = template.match(/#parse\("(.+?)"\)/g);
	for(var index in parseArr){
		var vm = parseArr[index].match(/(?!#parse\(")[^")]+(?="\))/)[0];
		var replacement = fs.readFileSync(config.webapps +"/"+ vm,'utf-8');
		template = template.replace("#parse(\""+vm+"\")", replacement);
	}
	
	var context = JSON.parse(fs.readFileSync(config.webapps + path.dirname(req.path) +"/"+ basename +".json",'utf-8'));
	var html = Velocity.render(template, context);
	
	res.set('Content-Type', 'text/html; charset=utf-8');
	res.send(html);
};


var start = function(callback){
	
	app.use(parseVm);
	app.use(serveIndex(config.webapps, {icons: true, hidden:true}));
	app.use(express.static(config.webapps, {index: false, maxAge: 0}));
	app.listen(app.get('port'), callback);	
};

module.exports = {
	start:start
}
