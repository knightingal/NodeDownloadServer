var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var os = require('os');

var routes = require('./routes/index');
var users = require('./routes/users');
var postMsg = require('./routes/postMsg');
var picDirs = require('./routes/picDirs');
var navy = require('./routes/navy');
picDirs.dirStat = [];
var app = express();
var fs = require('fs');
if (os.platform() === "win32") {
    var RootDirString = 'D:\\Python27\\testdir\\';
} else {
    var RootDirString = '/home/knightingal/download/';
}

picDirs.RootDirString = RootDirString;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




var init = function () {
    var dirs = fs.readdirSync(RootDirString);
    picDirs.dirStat = [];
    for (i = 0; i < dirs.length; i++) {
        var dirName = dirs[i];
        var stat = fs.statSync(RootDirString + dirName);
        if (stat.isDirectory()) {
            var picsOri = fs.readdirSync(RootDirString + dirs[i]);
            var patt = new RegExp('\.jpg$');

            var pics = [];
            for (j = 0; j < picsOri.length; j++) {
                if (patt.test(picsOri[j]) === true) {
                    pics.push(picsOri[j]);
                }
            }
            pics.sort(function(a, b) {
                return parseInt(a) - parseInt(b);
            });
            var mtime = stat.mtime;
            picDirs.dirStat.push({
                "name": dirs[i],
                "mtime": mtime,
                "firstPic": pics[0],
                "index": 0
            });
        }
    }
    picDirs.dirStat.sort(function(a, b) {
        //return a.name - b.name;
        for (i = 0; i < 14; i++) {
            if (a.name[i] != b.name[i]) {
                return a.name[i] - b.name[i];
            }
        }
        return -1;
    });
    for (i = 0; i < picDirs.dirStat.length; i++) {
        picDirs.dirStat[i]['index'] = i;
    }
}

postMsg.initCb = init;
// init();


app.use('/', routes);
app.use('/users', users);
app.use('/startDownload', postMsg);
app.use('/navy', navy);
app.use('/picDirs', picDirs);

app.post('/testExist', function(req, res){
    console.log(req.body);
    var dirName = req.body[0];
    if (fs.existsSync(RootDirString + dirName) == true) {
        res.send('False');
    }
    else {
        res.send('True');
    }
});
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

// var debug = require('debug')('first_node_app');
// app.set('port', process.env.PORT || 8081);

// var server = app.listen(app.get('port'), function() {
//   console.log('Express server listening on port ' + JSON.stringify(server.address()));
// });
