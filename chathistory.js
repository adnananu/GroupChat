exports = module.exports = function() {
    var _chats = [];
    
    return {
        add: function(from, message) {
            _chats.push({timestamp: Date.now(), from: from, msg: message});
        },
        getAll: function() {
            return _chats;
        }
    }
};