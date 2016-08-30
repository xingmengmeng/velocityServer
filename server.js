var express = require('express');
var fs = require('fs');
var path = require('path');
var Velocity = require('velocityjs');
var serveIndex = require('serve-index');
var proxy = require('http-proxy-middleware');
var config = require('./config/default.json');

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
	
	var jsonPath = path.join(config.webapps, path.dirname(req.path), basename+".json");
	var context = JSON.parse(fs.readFileSync(jsonPath , 'utf-8'));
	var html = Velocity.render(template, context);
	
	res.set('Content-Type', 'text/html; charset=utf-8');
	res.send(html);
};


var start = function(callback){
	if(!config.webapps){
		return callback(new Error('Error:找不到项目根目录！'));	
	};
	var app = express();
	//app.use('/api', proxy({target: 'http://www.renruihr.com', changeOrigin: true}))
	config.proxy && config.proxy.path && app.use(config.proxy.path, proxy({target: config.proxy.target, changeOrigin: true}));
	app.set('port', process.env.PORT || config.port || 3000);
	app.use(parseVm);
	app.use(serveIndex(config.webapps, {icons: true, hidden:true}));
	app.use(express.static(config.webapps, {index: false, maxAge: 0}));
	app.listen(app.get('port'), callback);	
};

module.exports = {
	start:start
}
