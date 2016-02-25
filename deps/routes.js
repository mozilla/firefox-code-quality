module.exports = function(app) {
    var deps = require('./controllers/deps');
    app.get('/deps/:filename', deps.getFanInFanOut);

    var functions = require('./controllers/functions');
    app.get('/functions/:filename', functions.getFunctionMetrics);
}
