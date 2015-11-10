# Firefox Code Quality
Architectural measures of complexity for revisions in mozilla-central.

The repository includes the now fully-automated workflow for running the code-quality analyses on revisions in mozilla-central.  More documentation to follow.

### Quick-start guide

To run the complete set of analyses on the latest revision in mozilla-central and update the interface, run the following script:

```
scripts/analyzeMozillaCentral.sh 
```

### Modifying things
* ``data/modules.txt``: contains the set of directories that constitute modules (the current ones may not be accurate)
* ``data/filter.txt``: contains the set of files and directories that we omit from the analysis
* ``getLatestSource.py``: contains the path to the codebase that we'll be analyzing

### How the script works
The script (``analyzeMozillaCentral.sh``) takes approximately 30 minutes to complete and runs twice a day. It performs the following tasks:

1. Pulls the latest revision from mozilla-central (``getLatestSource.py``)
2. Performs static analysis on the codebase to get LOC, cyclomatic complexity and dependency data (``projectMetrics.py``)
3. Generates a hash table from the dependency data (``extractFilesAndDeps.py``)
4. Gets dependencies, propagation cost and highly-interconnected files data (`generateDepMetrics.py`)
5. Writes the entire set of data to be graphed to ``metrics_out/full_metrics-all.csv`` (``addToFullMetrics.py``)

The script then goes through the above steps for each of the modules in ``data/modules.txt``. Once the script terminates, the respective directories under ``scripts`` will be populated, allowing you to both view the data in the dashboard at ``index.html`` and make use of the dependencies endpoint.

### Dependencies endpoint

To get the set of files that depend on some arbitrary file in the latest revision (fan-in) or the files that that file depends on (fan-out), you can call the following endpoint--the URL is temporary and will change once [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1219410) is resolved:

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


### Requirements

* [Scitools' Understand](http://scitools.com)
* [Python 3](https://www.python.org/)
* [NumPy](http://www.numpy.org) and [SciPy](http://www.scipy.org/)
 

### Demo
[https://metrics.mozilla.com/code-quality](https://metrics.mozilla.com/code-quality)
