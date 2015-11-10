module.exports = function(app){
    var deps = require('./controllers/deps');
    app.get('/deps/:filename', deps.getFanInFanOut);
}
