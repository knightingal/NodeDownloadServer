#!/usr/bin/env node
var debug = require('debug')('first_node_app');
var app = require('./app');

app.set('port', process.env.PORT || 8081);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + JSON.stringify(server.address()));
});
