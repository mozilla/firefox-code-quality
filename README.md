# Firefox Code Quality
Architectural measures of complexity for revisions in mozilla-central.

The repository includes the now fully-automated workflow for running the code-quality analyses on revisions in mozilla-central.  More documentation to follow.

### Quick-start guide

To run the complete set of analyses on the latest revision in mozilla-central and update the interface, run the following script:

```
scripts/analyzeMozillaCentral.sh 
```

![Code Quality](https://dl.dropboxusercontent.com/u/20109708/code-quality.png "Code Quality")

### Modifying things
* ``data/modules.txt``: contains the set of directories that constitute modules (the current ones may not be accurate)
* ``data/filter.txt``: contains the set of files and directories that we omit from the analysis
* ``getSource.py``: contains the path to the codebase that we'll be analyzing

### How the script works
The script (``analyzeMozillaCentral.sh``) takes approximately 30 minutes to complete and runs twice a day. It performs the following tasks:

1. Pulls the latest revision from mozilla-central (``getSource.py``)
2. Performs static analysis on the codebase to get LOC, cyclomatic complexity and dependency data (``generateProjectMetrics.py`` and ``generateProjectMetricsFunctionLevel.py``)
3. Generates a hash table from the dependency data (``extractFilesAndDeps.py``)
4. Gets dependencies, propagation cost and highly-interconnected files data (`generateDepMetrics.py`)
5. Writes the entire set of data to be graphed to ``metrics_out/full_metrics-all.csv`` (``addToFullMetrics.py``)

The script then goes through the above steps for each of the modules in ``data/modules.txt``. Once the script terminates, the respective directories under ``scripts`` will be populated, allowing you to both view the data in the dashboard at ``index.html`` and make use of the dependencies endpoint.

### Analyzing older revisions

You can generate metrics for older revisions by running ``analyzeMozillaCentralHistorical.sh 2016-01-01`` where the first parameter is the date you're interested in. At present, the script pulls one of potentially several revisions for that date, runs the analysis on it, and writes the metrics out to files as you would expect.

### Dependencies endpoint

To get the set of files that depend on some arbitrary file in the latest revision (fan-in) or the files that that file depends on (fan-out), you can call the following endpoint--the URL is temporary and will change once [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1224318) is resolved:

``http://almossawi.com:3003/deps/filename=xpcom:glue:nsINIParser.cpp``

The response is a JSON object like this:

```javascript
{
  "file": "xpcom/glue/nsINIParser.cpp",
  "fanIn": [
    "toolkit/system/androidproxy/nsAndroidSystemProxySettings.cpp",
    "toolkit/xre/EventTracer.cpp",
    "toolkit/xre/nsAppRunner.h",
    "toolkit/xre/nsXREDirProvider.h",
    "webapprt/prefs.js",
    "widget/BasicEvents.h",
    "xpcom/ds/nsINIParserImpl.h",
    "xulrunner/app/xulrunner.js",
    "xulrunner/tools/redit/redit.cpp"
  ],
  "fanOut": [
    "accessible/atk/AccessibleWrap.h",
    "xpcom/base/nsErrorService.cpp",
    "xpcom/glue/nsCategoryCache.cpp",
    "xpcom/glue/nsDeque.cpp",
    "xpcom/glue/nsISupportsImpl.cpp"
  ]
}
```

If a filename cannot be found, the resulting JSON object will look like this:

```javascript
{
  error: 'File name missing or does not exist in the codebase, usage: https://metrics.mozilla.com/code-quality/dep/?filename=xpcom/glue/nsINIParser.cpp'
}
```

### Function-level metrics endpoint

To get function-level metrics for a given file, you can call the following endpoint--the URL is temporary and will change once [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1224318) is resolved:

``http://almossawi.com:3003/functions/filename=accessible:jsat:EventManager.jsm``

The response is a JSON object like this:

```javascript
{
  "file": "accessible/jsat/EventManager.jsm",
  "functions": [
    {
      "name": "handleAccEvent",
      "loc": "84",
      "loc_code": "76",
      "mccabe": "15"
    },
    {
      "name": "handleEvent",
      "loc": "35",
      "loc_code": "33",
      "mccabe": "9"
    },
    {
      "name": "start",
      "loc": "22",
      "loc_code": "18",
      "mccabe": "3"
    },
    {
      "name": "stop",
      "loc": "17",
      "loc_code": "16",
      "mccabe": "3"
    },
    {
      "name": "EventManager",
      "loc": "12",
      "loc_code": "12",
      "mccabe": "1"
    }
  ]
}
```

If a filename cannot be found, the resulting JSON object will look like this:

```javascript
{
  error: 'File name missing or does not exist in the codebase, usage: http://almossawi.com:3003/functions/filename=accessible:jsat:EventManager.jsm'
}
```

It's currently not possible to get call-graphs and dependencies for functions, seeing as the units that Understand [generates dependencies for are classes and files](https://scitools.com/documents/manuals/python/understand.html#Ent-depends).

### Requirements

* [Scitools' Understand](http://scitools.com)
* [Python 3](https://www.python.org/) 
* [NumPy](http://www.numpy.org) and [SciPy](http://www.scipy.org/)
* [Node.js](https://nodejs.org/en/) for the dependencies endpoint
 

### Demo
[https://metrics.mozilla.com/code-quality](https://metrics.mozilla.com/code-quality)

### Blog post
[https://blog.mozilla.org/metrics/2015/12/01/measuring-code-quality](https://blog.mozilla.org/metrics/2015/12/01/measuring-code-quality)
