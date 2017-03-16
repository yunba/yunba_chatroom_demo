var yunbaCfg = {
    // 替换为您的 appkey
    appkey: '52fcc04c4dc903d66d6f8f92',
    // not required
    // server: 'http://sock.yunba.io',
    // port: '3000'
};
var uploadServer = 'http://127.0.0.1:3900';
var uploadPath = '/file';

Vue.component('message', {
    props: ['message'],
    template: '#message-template',
    computed: {
        postTime: function() {
            return moment(this.message.time).format('HH:mm:ss');
        },
        postContent: function() {
            return filterXSS(emojione.shortnameToImage(this.message.data.content));
        }
    },
    filters: {
        addUploadServer: function(content) {
            return uploadServer + '/' + content;
        }
    }
});

Vue.component('user', {
  props: ['user','me'],
  template: '#user-template'
});

var chatroom;
var app = new Vue({
    el: '#app',
    template:'#app-template',
    data: {
        messages: [
            // {user: 'Willang', data:{ type: 'txt', content: 'Hello!'}, time: Date.now()},
            // {user: 'demo', data: {type: 'file', content: '$PATH'}, time: Date.now()},
        ],
        me: 'user_' + Number(Math.random().toString().substr(-8)).toString(16),
        users: [],
        // 0 normal
        // 1 recording
        isRecording: false,
        connected: false,
    },
    methods: {
        record: function() {
            if (!this.isRecording) {
                this.isRecording = true;
                this.recorder.start(function(err) {
                    if (err) {

                    } else {
                    }
                });
            } else {
                this.isRecording = false;
                this.recorder.stop(function(err, blob) {
                    if (err) {

                    }
                    var fileField = 'file';
                    blob.lastModifiedDate = new Date();
                    blob.name = 'chat-voice';
                    var formData = new FormData();
                    formData.append(fileField, blob);
                    this._upload(formData)
                        .then((function(res){
                            var path = res.body.path;
                            var name = res.body.name;
                            chatroom.sendMessage({
                                type: 'voice',
                                content: {
                                    name: name,
                                    path: path
                                }
                            });
                        }).bind(this));
                }.bind(this));
            }
        },
        upload: function(event) {
            event.preventDefault();
            var el = event.target;
            var formData = new FormData();
            formData.append(el.name, el.files[0]);
            this._upload(formData)
                .then((function(res){
                    var path = res.body.path;
                    var name = res.body.name;
                    chatroom.sendMessage({
                        type: 'file',
                        content: {
                            name: name,
                            path: path
                        }
                    });
                }).bind(this));
        },
        _upload: function(formData) {
            return this.$http.post(uploadServer + uploadPath, formData)
                .catch(function(e) {
                    this.messages.push({
                        user: 'system',
                        data: {
                            type: 'txt',
                            content: '文件上传失败, 请检查文件上传服务配置或服务是否正常工作'
                        },
                        time: Date.now()
                    });
                    throw e;
                }.bind(this));
        },
        sendMessage: function(event) {
            var el = this.$el.querySelector('#input-text-message');
            var value = el.value;
            if (value) {
                chatroom.sendMessage({
                    type: 'txt',
                    content: el.value
                });
                el.value='';
            }
        }
    },
    mounted: function() {
        this.recorder = new MsgRecorder();
        this.messages.push({
            user: 'system',
            data: {
                type: 'txt',
                content: '正在连接到聊天室...'
            },
            time: Date.now()
        });

        chatroom = new Chatroom({
            roomName: 'yunba_chatroom_demo',
            yunba: yunbaCfg,
            onMessage: onMessage,
            name: this.me
        });

        chatroom.connected
            .then(function() {
                this.messages.push({
                    user: 'system',
                    data: {
                        type: 'txt',
                        content: '连接成功'
                    },
                    time: Date.now()
                });
                this.connected = true;
            }.bind(this))
            .catch(function(err) {
                this.messages.push({
                    user: 'system',
                    data: {
                        type: 'txt',
                        content: '连接失败'
                    },
                    time: Date.now()
                });
            }.bind(this));


        // 清理
        window.onbeforeunload = function(e) {
          try {
            chatroom.leave();
            chatroom.destroy();
          }catch(e){}
          var now = +new Date();
          while((+new Date()) - now < 200){};
        };
    }
});


function onMessage(msg) {
    var type = msg.type;
    var payload = msg.payload;
    if (type == 'set_name') {
        if (!payload.originName && payload.name) {
            if (payload.name != chatroom.name) {
                // 别人加入
                app.users.push(payload.name);
                app.messages.push({
                    user: 'system',
                    data: {
                        type: 'txt',
                        content: payload.name + ' 加入了聊天室'
                    }
                });
                chatroom.sendState();
            } else {
                // 自己
                app.users.push(payload.name);
            }
        } else if (payload.originName && !payload.name){
            var index = app.users.indexOf(payload.originName);
            if (index > -1) {
                app.users.splice(index, 1);
                app.messages.push({
                    user: 'system',
                    data: {
                        type: 'txt',
                        content: payload.originName + ' 离开了聊天室'
                    }
                });
            }
        }
    } else if (type == 'message') {
        app.messages.push(payload);
    } else if (type == 'state_online') {
        var name = payload.name;
        var users = app.users;
        if (users.indexOf(name) == -1) {
            users.push(name);
        }
    }
}


