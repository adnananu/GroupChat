/*jslint node: true, indent: 2 */
'use strict';
var express = require('express');
var users = new require('./users')();
var chats = new require('./chathistory')();
var CircularJSON = require('circular-json')

var util = require('util');
var app = express();
app.set('name', "Leadin Chat Demo");
app.set('port', 8888);

var server = require('http').createServer(app);
app.use(require('morgan')('dev'));
//for images and css files
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/css'));
//set cors headers
app.use(function(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');




var wssServer = require('ws').Server({server: server, perMessageDeflate: false});
wssServer.on('connection', function(ws) {
    util.log("Connection from " + util.inspect(ws.upgradeReq.connection.remoteAddress));
    
    ws.send(JSON.stringify({from: "_server", welcome: "Hello from chat service. Set the"+
                    " nickname before getting into chat."}));
    ws.on('message', function(msg) {
        
        if(msg[0] === '/') {
            chatProtocol.handleCommand(ws, msg);
            updateUsersName();
            util.log("length of array after adding: "+users.getUserArray().length);
        } else {
                chatProtocol.broadcast(ws.user.nick, msg);
        }               
    });

    ws.on('close', function(code, message) {
	if(ws.user)
	{
        var usersArray = users.getUserArray();
        usersArray.splice(usersArray.indexOf(ws.user.nick),1);
        updateUsersName();
        var user = ws.user;
		user.online = false;
        util.log(user.nick + " dropped out.");
		chatProtocol.broadcast("_server", user.nick + " dropped out.");
	}

});

    function updateUsersName(){//sending user to UI       
    var usersArray = users.getUserArray();
    usersArray = {"array":usersArray};
    chatProtocol.broadcast("", CircularJSON.stringify(usersArray));
}



});


wssServer.on('error', function(err) {
    util.log("Websocket server error: " + util.inspect(err));
});

var chatProtocol = new require('./protocol')(wssServer, users, chats);

//REST routes
app.use(require('./routes')(users, chats).router);

app.get('/', function(req, res) {
    res.render('index.html');
});



util.log('Server started.');
server.listen(app.get('port'), function () {
  util.log('%s listening at %s', app.get('name'), app.get('port'));
});

