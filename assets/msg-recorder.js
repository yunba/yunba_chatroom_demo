function MsgRecorder() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    this.recorder = null;
}
MsgRecorder.prototype = {
    constructor: MsgRecorder,
    _getRecorder: function(cb) {
        if (this.recorder) {
            cb(null, this.recorder);
        } else {
            navigator.getUserMedia({audio: true}, (function(stream){
                var context = new window.AudioContext();
                var source = context.createMediaStreamSource(stream);
                this.recorder = new Recorder(source);
                cb(null, this.recorder);
            }).bind(this), function(error) {
                console.log('get permission failed');
                cb(error);
            });
        }
    },
    start: function(cb) {
        this._getRecorder(function(err, recorder) {
            if (!err) {
                console.log('start recording');
                recorder.record();
                cb && cb(null);
            } else {
                cb && cb(err);
            }
        });
    },
    stop: function(cb) {
        this._getRecorder(function(err, recorder) {
            if (!err) {
                console.log('stop recording');
                recorder.exportWAV(function(blob) {
                    recorder.stop();
                    recorder.clear();
                    cb && cb(null, blob);
                });
            } else {
                cb && cb(err);
            }
        });
    }
}