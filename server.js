var express = require('express');
var fs = require('fs');
var path = require('path');
var Velocity = require('velocityjs');
var app = express();
var config = require('./config/default.json');
var vmFile = require('./config/vm.json');
app.set('port', process.env.PORT || config.port || 3000);


var getExtname = function(filepath){
	return path.extname(filepath);
};

var getBasename = function(vmPath){
	var extname = getExtname(vmPath);
	return path.basename(vmPath, extname);
}

var parseVm = function(req, res, next){
	var isVm = vmFile.vmType.vm.indexOf(getExtname(req.path)) >= 0;
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

var parseCss = function(req, res, next){
	var isCss = vmFile.vmType.Css.indexOf(getExtname(req.path)) >= 0;
	if(!isCss){
		return next();
	};
	
	var template = fs.readFileSync(config.webapps + req.path,'utf-8');
	res.set('Content-Type', 'text/css; charset=utf-8');
	res.send(template);
};

var parseJs = function(req, res, next){
	var isJs = vmFile.vmType.js.indexOf(getExtname(req.path)) >= 0;
	if(!isJs){
		return next();
	};
	
	var template = fs.readFileSync(config.webapps + req.path,'utf-8');
	res.set('Content-Type', 'text/javascript; charset=utf-8');
	res.send(template);
};

var parseImg = function(req, res, next){
	var extname = getExtname(req.path);
	var isImg = vmFile.vmType.img.indexOf(extname) >= 0;
	if(!isImg){
		return next();
	};
	
	var contentType;
	if(extname == ".gif"){
		contentType = "image/gif";
	} else if(extname == ".png"){
		contentType = "image/png";
	} else if(extname == ".jpg" || extname == ".jpeg"){
		contentType = "image/jpeg";
	}
	
	res.set('Content-Type', contentType);
	res.sendFile(config.webapps + req.path);
};

var parse = function(req, res, next){
	var isKey = false;
	for(var key in vmFile.vmType){
		var extname = getExtname(req.path);
		isKey = vmFile.vmType[key].indexOf(extname) >= 0;
		if(isKey){
			var html;
			var contentType = vmFile.contentType[extname.substring(1)];
			if(key == "vm"){
				var basename = getBasename(req.path);
				var template = fs.readFileSync(config.webapps + req.path,'utf-8');
				var parseArr = template.match(/#parse\("(.+?)"\)/g);
				for(var index in parseArr){
					var vm = parseArr[index].match(/(?!#parse\(")[^")]+(?="\))/)[0];
					var replacement = fs.readFileSync(config.webapps +"/"+ vm,'utf-8');
					template = template.replace("#parse(\""+vm+"\")", replacement);
				}
				var context = JSON.parse(fs.readFileSync(config.webapps + path.dirname(req.path) +"/"+ basename +".json",'utf-8'));
				html = Velocity.render(template, context);
			}else if(key == "img"){
				res.set('Content-Type', contentType);
				res.sendFile(config.webapps + req.path);
				return;
			}else{
				html = fs.readFileSync(config.webapps + req.path,'utf-8');
			}
			res.set('Content-Type', contentType);
			res.send(html);
			return;
		}
	};
	
	if(!isKey){
		return next();
	};
};

var start = function(callback){
	app.use(parseVm);
	app.use(parseCss);
	app.use(parseJs);
	app.use(parseImg);
	
	/*
	app.use(parse);
	*/
	app.listen(app.get('port'), callback);	
};

module.exports = {
	start:start
}
