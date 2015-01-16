var http = require('http');
var url = require('url');
var r = require('request');
var net = require('net');


var proxyServer = http.createServer(function (request, response) {
    //console.log("host is", request);
    var reqUrl = url.parse(request.url);
    //console.log("request to", request.url);


    var options = {
        method: request.method,
        uri: reqUrl.href,
        headers: request.headers
    };
    //console.log("options", options);

    var requestcallback = function (error, proxy_response, body) {
        if (error) {
            console.log("error occured while making request", error, request.url);
            response.write("error occurred" + error);
            response.end();
            return;
        }
        //console.log("proxy_response", proxy_response);
        //response.writeHead(proxy_response.statusCode, proxy_response.headers);
        proxy_response.on('end', function () {
            console.log("proxy_response end");
            response.end();
        });
        proxy_response.on('close', function () {
            console.log("proxy_response close");
            response.end();
        });
        proxy_response.on('finish', function () {
            console.log("proxy_response finish");
            response.end();
        });
        proxy_response.pipe(response);
    };


    var proxy_request = r(options, requestcallback);
    request.on('end', function () {
        proxy_request.end();
    });
    request.pipe(proxy_request).pipe(response);

});

proxyServer.listen(1337);

proxyServer.on('connect', function (req, cltSocket, head) {
    // connect to an origin server
    var addr = req.url.split(':');

    //console.log("connect request received", addr, req.url);

    var srvSocket = net.connect(addr[1] || 443, addr[0], function () {
        //console.log("successfully connected to", req.url);
        cltSocket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8');
        srvSocket.write(head);
        srvSocket.pipe(cltSocket);
        cltSocket.pipe(srvSocket);
    });

    srvSocket.on("error", function (err) {
        console.log("error occurred while connecting", err, req.url);
        cltSocket.end();
    });
});