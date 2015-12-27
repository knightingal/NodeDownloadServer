var express = require('express');
var router = express.Router();
var http = require("http");
var fs = require("fs");
var url = require('url');
var path = require('path');
var EventEmitter = require('events');

function DEventEmitter() {
    EventEmitter.call(this);
}

require('util').inherits(DEventEmitter, EventEmitter)
var dEmitter = new DEventEmitter();

dEmitter.on("next", function(dirName) {
    var currentImg = ImgSrcArray.getCurrentImg();
    if (currentImg != undefined) {
        startDownload(currentImg, dirName);
    }
});
// var reqs = {};
// var bufferArray = {};

var RootDirString = 'D:\\Python27\\testdir\\testsubdir\\linux1000\\';

function ReqHeadersTemp() {
    // this["Referer"] = pageHref;
    this["User-Agent"]= "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.63 Safari/537.31";
    this["Connection"]= "keep-alive";
    this["Accept"]= "*/*";
    this["Accept-Encoding"]= "gzip,deflate,sdch";
    this["Accept-Language"]= "zh-CN,zh;q=0.8";
    this["Accept-Charset"]= "GBK,utf-8;q=0.7,*;q=0.3";
}

var gImgCount = 0;
var gSuccCount = 0;

function getHttpReqCallback(imgSrc, dirName) {
    var fileName = path.basename(imgSrc);
    return function (res) {
      // console.log('STATUS: ' + res.statusCode);
      // console.log('HEADERS: ' + JSON.stringify(res.headers));
        var contentLength = parseInt(res.headers['content-length']);
        var fileBuff = [];
        res.on('data', (function(fileName) {
            return function (chunk) {
                var buffer = new Buffer(chunk);
                fileBuff.push(buffer);
            };
        })(fileName));
        res.on('end', (function(fileName, contentLength) {
            return function() {
                var totalBuff = Buffer.concat(fileBuff);
                console.log("bufferLenght = " + totalBuff.length + ", this contentLength = " + contentLength);
                if (totalBuff.length < contentLength) {
                    console.log(imgSrc + " download error, try again");                    
                    startDownload(imgSrc, dirName);
                    return;
                }
                fs.appendFile(dirName + "/" + fileName, totalBuff, function(err){});
                gSuccCount += 1;
                console.log("(" + gSuccCount + "/" + gImgCount + ")" + fileName + " download succ!");
                
                if (gSuccCount == gImgCount) {
                    console.log("all task succ!");
                    gImgCount = gSuccCount = 0;
                    //router.initCb();
                }
                dEmitter.emit("next", dirName);
            };
        })(fileName, contentLength));
    };
}

function startDownload(imgSrc, dirName) {
    var urlObj = url.parse(imgSrc);
    // var fileName = path.basename(imgSrc);
    var options = {
        host: urlObj.host,
        path: urlObj.path,
        headers: new ReqHeadersTemp()
    };

    var req = http.request(options, getHttpReqCallback(imgSrc, dirName));
    req.setTimeout(60 * 1000, function() {
        console.log(imgSrc + 'timeout');
        req.abort();
    });
    req.on('error', function(e) {
        startDownload(imgSrc, dirName);
    });

    req.end();
}

function downloadNavyFor20(imgSrcArray, dirName) {
    for (var i = 0; i < imgSrcArray.length; i++) {
        var imgSrc = imgSrcArray[i].imrSrc;
        startDownload(imgSrc, dirName);
    }
}

function downloadFor20(imgSrcArray, dirName) {
    for (var i = 0; i < imgSrcArray.length; i++) {
        //   var imgSrc = imgSrcArray[i].imrSrc;
        var imgSrc = imgSrcArray[i];
        startDownload(imgSrc, dirName)
    }
}

var ImgSrcArray = {
    "imgSrcArray": [],
    "currentIndex": 0,
    "getCurrentImg": function() {
        return this.imgSrcArray[this.currentIndex++];
    },
    "get20Img": function() {
        this.currentIndex = 10;
        return this.imgSrcArray.slice(0, 10);
    },
};

//TODO: so many anonymous function, and callback hell!!!
router.post('/', function(req, res) {
    console.log(req.body);
    
    gImgCount += req.body.imgSrcArray.length;
    var nowTime = new Date(Date.now());
    var nowString = "" + nowTime.getFullYear() + 
        ((nowTime.getMonth() + 1) < 10 ? "0" + (nowTime.getMonth() + 1) : (nowTime.getMonth() + 1)) + 
        (nowTime.getDate() < 10 ? "0" + nowTime.getDate() : nowTime.getDate()) + 
        (nowTime.getHours() < 10 ? "0" + nowTime.getHours() : nowTime.getHours())+ 
        (nowTime.getMinutes() < 10 ? "0" + nowTime.getMinutes() : nowTime.getMinutes()) + 
        (nowTime.getSeconds() < 10 ? "0" + nowTime.getSeconds() : nowTime.getSeconds());
    var title = nowString + req.body.title;
    
    
    var dirName = RootDirString + title;
    res.send(title);
    gSuccCount = 0;
    fs.mkdir(dirName, function() {
        console.log(req.body.imgSrcArray);
        console.log(req.body.href);
        var imgSrcArray = req.body.imgSrcArray;
        ImgSrcArray.imgSrcArray = imgSrcArray;
        ImgSrcArray.currentIndex = 0;
        downloadFor20(ImgSrcArray.get20Img(), dirName);
        
        // var pageHref = req.body[j].href;
        // for (var i = 0; i < imgSrcArray.length; i++) {
        //     var imgSrc = imgSrcArray[i];
        //     startDownload(imgSrc, dirName);
        // }
    });
});

module.exports = router;
