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
    var index = ImgSrcArray.currentIndex;
    var currentImg = ImgSrcArray.getCurrentImg();
    if (currentImg != undefined) {
        startDownload(currentImg, dirName, index);
    }
});

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


function getHttpReqCallback(imgSrc, dirName, index) {
    var fileName = index + "-" + path.basename(imgSrc);
    return function (res) {
      // console.log('STATUS: ' + res.statusCode);
      // console.log('HEADERS: ' + JSON.stringify(res.headers));
        var contentLength = parseInt(res.headers['content-length']);
        var fileBuff = [];
        res.on('data', function (chunk) {
            var buffer = new Buffer(chunk);
            fileBuff.push(buffer);
        });
        res.on('end', function() {
            var totalBuff = Buffer.concat(fileBuff);
            console.log("bufferLenght = " + totalBuff.length + ", this contentLength = " + contentLength);
            
            
            if (!isNaN(contentLength) && totalBuff.length < contentLength) {
                console.log(imgSrc + " download error, try again");                    
                startDownload(imgSrc, dirName, index);
                return;
            }
            if (isNaN(contentLength)) {
                console.log(imgSrc + " content length error");
                fs.appendFile(dirName + "/" + fileName + ".log", "error", function(err){if (err) {console.error(err)}});
                
            } else {
                fs.appendFile(dirName + "/" + fileName, totalBuff, function(err){});
            }
            gSuccCount += 1;
            console.log("(" + gSuccCount + "/" + gImgCount + ")" + fileName + " download succ!");
            
            if (gSuccCount == gImgCount) {
                console.log("all task succ!");
                gImgCount = gSuccCount = 0;
            }
            dEmitter.emit("next", dirName);
        });
    };
}

function startDownload(imgSrc, dirName, index) {
    var urlObj = url.parse(imgSrc);
    // var fileName = path.basename(imgSrc);
    var options = {
        host: urlObj.host,
        path: urlObj.path,
        headers: new ReqHeadersTemp()
    };

    var req = http.request(options, getHttpReqCallback(imgSrc, dirName, index));
    req.setTimeout(60 * 1000, function() {
        console.log(imgSrc + 'timeout');
        req.abort();
    });
    req.on('error', function(e) {
        startDownload(imgSrc, dirName, index);
    });

    req.end();
}

function downloadNavyFor20(imgSrcArray, dirName) {
    for (var i = 0; i < imgSrcArray.length; i++) {
        var imgSrc = imgSrcArray[i].imrSrc;
        var index = i;
        startDownload(imgSrc, dirName, index);
    }
}

var ImgSrcArray = {
    "imgSrcArray": [],
    "currentIndex": 0,
    "getCurrentImg": function() {
        var temp = this.imgSrcArray[this.currentIndex++];
        if (temp != undefined) {
            return temp.imrSrc;
        } else {
            return undefined;
        }
    },
    "get20Img": function() {
        this.currentIndex = 10;
        return this.imgSrcArray.slice(0, 10);
    },
};

router.post('/donwLoadNavy', function(req, res) {
  console.log(req.body);
  
  gImgCount += req.body.imgArray.length;
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
  fs.mkdir(dirName, function() {
    console.log(req.body.imgArray);
    ImgSrcArray.imgSrcArray = req.body.imgArray;
    ImgSrcArray.currentIndex = 0;
    downloadNavyFor20(ImgSrcArray.get20Img(), dirName);
  });
});

module.exports = router;