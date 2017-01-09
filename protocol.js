var _ = require('lodash');
var util = require('util');
var uuid = require('node-uuid');

exports = module.exports = function(wss, users, chathistory) {
    var _users = users;
    var _history = chathistory;
    var _wss = wss;
    
    function setUserNick(user, nick) {
        if(_users[user])
        user.nick = nick;
    }
    
    return {
        handleCommand: function(ws, msg) {
            var commandAndParmas = msg.split(' ', 2);
            if(commandAndParmas.length >= 2 && commandAndParmas[0].toLowerCase() === '/nick') {
                var nick = commandAndParmas[1].trim();
                //check if nick is in use
                var user = _users.getUser(nick);
                if(user && user.online) { //currently online, won't accept
                    ws.send(JSON.stringify({from: "_server", error: "Nick in use"}));
                    return false;
                }                
                if(nick[0] === '_') { //reserver nicks starting with '_' to server use
                    ws.send(JSON.stringify({from: "_server", error: "Nick cannot start with the underscore"}));
                    return false;
                }
                //set or create user
                var retMsg;               
                if(ws.user) { 
                    var oldNick = ws.user.nick;
                    _users.changeNick(oldNick, nick);
                    retMsg =  oldNick + " is now known as " + ws.user.nick;
                } else {

                    if(!user)
                        ws.user = _users.createUser(nick);                        
                    else 
                        ws.user = user;
                    
                    ws.user.online = true;
                    retMsg = "New user: " + ws.user.nick + " joined.";
                }
				
                this.broadcast("_server", retMsg)              
            } 
			else{
					//assign auto nick name using library. not using it right now
					var user_name = uuid.v1();
					var user_name = user_name.split("-")[0];
	     			var user = _users.getUser(user_name);
					if(!user) {
							ws.user = _users.createUser(user_name);
						ws.user.online = true;
						}
				console.log("New user: " + ws.user.nick + " joined.");
				this.broadcast(ws.user.nick, msg) 
				}
        }

		,
        broadcast: function(from, msg) {
            var response = "";
            if(from !== ""){
            _history.add(from, msg);
            var chat = {from: from, message: msg};
            response = JSON.stringify(chat);
            }
            else{
                response = msg;
            }
            _.each(_wss.clients, function(client) {
                if(client.user /*&& client.user.nick !== from*/) {
                    client.send(response);
                }    
            });
        }
    }

    
};
