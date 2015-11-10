exports.getFanInFanOut = function(req, res) {
    var request = require('request');
    var filename = req.params.filename.replace(/:/g, '/').split('=')[1];

    function err() {
        res.set('Content-Type', 'application/json');
        res.send({error: 'File name missing or does not exist in the codebase, usage: http://almossawi.com:3003/deps/filename=accessible:jsat:EventManager.jsm'});
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

    options.url = 'https://metrics.mozilla.com/code-quality/scripts/matlab_in/dependencies.csv.deps';
    request(options, function (error, response, data_dependencies) {
        options.url = 'https://metrics.mozilla.com/code-quality/scripts/misc/dependencies.csv.files';
        request(options, function (error, response, data_files) {
                var dependencies = [];
                var fileNames = [];

                data_dependencies.split('\n').forEach(function(line) {
                    if (line !== '') {
                        var d = line.split(',');
                        dependencies.push({from: d[0], to: d[1]});
                    }
                });

                data_files.split('\n').forEach(function(line) {
                    var fileName = '';
                    var startRecordingPath;

                    line.split('/').forEach(function(d, i) {
                        if(d === 'understand_in') {
                            startRecordingPath = i;
                        }

                        if(i > (startRecordingPath + 1)) {
                            fileName += '/' + d;
                        }
                    });

                    fileNames.push(fileName);

                    //fileNames.push(line);
                });

                //lookup file number for this file name
                var fileNumber = fileNames.indexOf('/' + filename);
                
                if(fileNumber === -1) {
                    err();
                } else {
                    fileNumber += 1; //1-indexed

                    var fanIn = dependencies.filter(function(d) {
                        return d.to == fileNumber;
                    });

                    var fanOut = dependencies.filter(function(d) {
                        return d.from == fileNumber;
                    });

                    var json = {file: filename, fanIn: [], fanOut: []};

                    fanIn.forEach(function(d) {
                        json.fanIn.push(fileNames[d.from].substr(1));
                    });

                    fanOut.forEach(function(d) {
                        json.fanOut.push(fileNames[d.to].substr(1));
                    });

                    res.set('Content-Type', 'application/json');
                    res.send(json);
                }
            });
        });
}

