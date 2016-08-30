var server = require('./server.js');
var express = require('express');
var app = express();
var config = require('./config/default.json');
app.set('port', process.env.PORT || config.port || 3000);

server.start(function(error){
	if(error){
		console.error(error);
	};
	console.log( 'Express started on http://localhost:' + 
	app.get('port') + '; press Ctrl-C to terminate.' );
});
