/**
 *
 *  {
 *    type: message | set_name | state_online,
 *    payload: {
 *    
 *    }
 *
 *    {
 *      type: txt | voice | file
 *      content: 
 *    }
 *    {
 *      originName: 
 *      name:
 *    }
 *
 *    {
 *    
 *    }
 *    
 *  }
 *
 *
 *
 * 
 */

function Chatroom(options) {
    var yunbaCfg = options.yunba || {};
    var roomName = options.roomName || 'chat_room';
    var onMessage = options.onMessage || function(){};
    var yunba = new Yunba(yunbaCfg);
    this.name = options.name || ('user_' + Number(Math.random().toString().substr(-8)).toString(16));
    this.onMessage = onMessage;
    this.roomName = roomName;
    this.yunba = yunba;
    this.connected = new Promise((function(resolve, reject) {
        yunba.init((function (success) {
            if (success) {
                yunba.set_message_cb(this.receiveMessage.bind(this));
                yunba.connect(function (success, msg) {
                    if (success) {
                        yunba.subscribe({topic: roomName}, function(success, msg) {
                            if (success) {
                                resolve(null);
                            } else {
                                reject(msg);
                            }
                        });
                    } else {
                        reject(msg);
                    }
                });
            }
        }).bind(this));
    }).bind(this));
    this.join();
}
Chatroom.prototype = {
    constructor: Chatroom,
    _ready: function(cb) {
        this.connected.then(cb.bind(this));
    },
    _send: function(payload, cb) {
        cb = cb || function() {};
        this._ready(function() {
            this.yunba.publish({
                topic: this.roomName,
                msg: JSON.stringify(payload)
            }, function(success, msg) {
                if (success) {
                    cb(null);
                } else {
                    cb(msg);
                }
            });
        });
    },
    sendMessage: function(data, cb) {
        this._send({
            type: 'message',
            payload: {
                user: this.name,
                data: data,
                time: Date.now()
            }
        }, cb);
    },
    setName: function(usename) {
        this._send({
            type: 'set_name',
            payload: {
                originName: this.name,
                name: name
            }
        }, function(err) {
            if (!err) {
                this.name = username;
                return cb(null);
            }
            cb(err);
        });
    },
    sendState: function() {
        this._send({
            type: 'state_online',
            payload: {
                name: this.name
            }
        });
    },
    join: function(cb) {
        this._send({
            type: 'set_name',
            payload: {
                originName: '',
                name: this.name
            }
        }, cb);
    },
    leave: function(cb) {
        this._send({
            type: 'set_name',
            payload: {
                originName: this.name,
                name: ''
            }
        }, cb);
    },
    destroy: function(cb) {
        this.yunba.subscribe({topic: this.roomName}, function(success, msg) {
            if (success) {
                return cb(null);
            }
            cb(msg);
        });
    },
    receiveMessage: function(data) {
        this.onMessage(JSON.parse(data.msg));
    }
}