var express = require('express');
var app = express();
var cors = require('cors');
var multer = require('multer'); // v1.0.5
var upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.post('/file', upload.single('file'), function (req, res, next) {
    res.json({
        mimetype: req.file.mimetype,
        path: req.file.path, 
        name: req.file.originalname
    });
});
app.listen(3900, function() {
    console.log('Server is listening to 3900');
});