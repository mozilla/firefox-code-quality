var express = require('express');
var http = require('http');

var app = express();
require('./routes')(app);

app.listen(3003);
console.log("Server running on port 3003");
