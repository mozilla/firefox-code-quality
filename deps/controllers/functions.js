exports.getFunctionMetrics = function(req, res) {
    var request = require('request');
    var filename = req.params.filename.replace(/:/g, '/').split('=')[1];

    function err() {
        res.set('Content-Type', 'application/json');
        res.send({error: 'File name missing or does not exist in the codebase, usage: http://almossawi.com:3003/functions/filename=accessible:jsat:EventManager.jsm'});
    }

    if (!filename) {
        err();
    }

    var headers = {
        'Content-Type': 'text/plain'
    }

    var options = {
        method: 'GET',
        headers: headers,
    }

    options.url = 'https://metrics.mozilla.com/code-quality/scripts/metrics_out/function_level_metrics.csv';
    request(options, function (error, response, data) {
        var fileMetrics = {};

        data.split('\n').forEach(function(line) {
            if (line !== '') {
                var d = line.split(',');
                if(!fileMetrics[d[0]]) {
                    fileMetrics[d[0]] = [];
                }

                fileMetrics[d[0]].push({name: d[1], loc: d[2], loc_code: d[3], mccabe: d[4]});
            }
        });

        //lookup file number for this file name
        if(!fileMetrics[filename]) {
            err();
        } else {
            fileMetrics[filename].sort(function(a, b) {
                return b.loc - a.loc;
            });

            var json = {file: filename, functions: fileMetrics[filename]};

            res.set('Content-Type', 'application/json');
            res.send(json);
        }
    });
}