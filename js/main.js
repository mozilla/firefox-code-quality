(function() {
    'use strict'

    var global = {
        trunk: {
            width: 360,
            height: 220,
            left: 0,
            right: 60,
            xax_count: 4
        }
    };

    var mouseover = function() {
        return function(d, i) {
            global.activeRevision = d.revision;
            d3.select('.revision-data')
                .html('Revision <a target="_blank" href="https://hg.mozilla.org/mozilla-central/rev/' + d.revision + '">' + d.revision + '</a> analyzed on ' + d.date);
        };
    }

    var markers = [];

    d3.text('scripts/data/modules.txt', function(data) {
        data.split('\n').forEach(function(module) {
            d3.select('.switch')
                .append('li')
                    .append('a')
                        .attr('href', '#')
                        .attr('id', 'goto-' + module)
                        .attr('class', 'pill')
                        .html(module);
        });

        //set the active pill and section on first load
        var module = (document.location.hash) ? document.location.hash.slice(1) : 'all';
        d3.select('#goto-' + module).classed('active', true);
        drawCharts(module);

        //event listeners
        $('ul.switch li a.pill').on('click', function(event) {
            event.preventDefault();
            $('ul.switch li a.pill').removeClass('active');
            $(this).addClass('active');

            var module = $(this).attr('id').slice(5);
            document.location.hash = module;

            drawCharts(module);

            return false;
        });
    });

    function drawCharts(module) {
        if(module == undefined) { module = 'all'; }

        d3.csv('scripts/metrics_out/full_metrics-' + module + '.csv', function(data) {
            data = data.filter(function(d) {
                return d.date !== '';
            });

            data = MG.convert.date(data, 'date', '%Y-%m-%dT%H:%M:%SZ');
            data.map(function(d) {
                 d.mccabe = d.SumCyclomatic / d.CountLineCode * 1000;
                 d.core = d.core_size / d.files;
                 d.dependencies_per_10k = d.first_order_density * d.files;
            });

            var loc_min = d3.min(data, function(d) { return +d.CountLineCode; });
            loc_min -=  loc_min * 0.01;
            var loc_max = d3.max(data, function(d) { return +d.CountLineCode; });
            loc_max += loc_max * 0.01;

            MG.data_graphic({
                min_y: loc_min,
                max_y: loc_max,
                title: "Lines of code",
                description: "LOC measures the number executable lines of code in each revision, ignoring comments and blank lines. LOC and defect density have an inverse relationship due to architecture not changing at the same rate as LOC and architectural elements such as interfaces having a higher propensity for defects than individual components. <b>Lower is better.</b>",
                data: data,
                markers: markers,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                target: '#loc',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'CountLineCode',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            var mccabe_min = d3.min(data, function(d) { return +d.mccabe; });
            mccabe_min -=  mccabe_min * 0.01;
            var mccabe_max = d3.max(data, function(d) { return +d.mccabe; });
            mccabe_max +=  mccabe_max * 0.01;

            MG.data_graphic({
                min_y: mccabe_min,
                max_y: mccabe_max,
                markers: markers,
                title: "Cyclomatic complexity",
                description: "Cyclomatic complexity measures the number of linearly independent paths within a software system, or within a function or class. Here, the measure is the total number of independent paths divided by the total number of lines of code, per 1,000 LOC. So a cyclomatic complexity value of 200, means that there are around 200 independent paths in every 1,000 lines of code.<br /><a href='https://en.wikipedia.org/wiki/Cyclomatic_complexity' target='_blank'>Read more</a>. <b>Lower is better.</b>",
                data: data,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                target: '#mccabe',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'mccabe',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Dependencies",
                description: "First-order density measures the number of direct dependencies between files. Here, we show dependencies as the number of files that a randomly chosen file can directly impact. Per the static analysis tool's <a href='http://scitools.com/documents/manuals/pdf/understand.pdf' target='_blank'>manual</a>, 'an item depends on another if it includes, calls, sets, uses, casts, or refers to that item.' <b>Lower is better.</b>",
                data: data,
                markers: markers,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                target: '#dependencies',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'dependencies_per_10k',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Propagation",
                description: "Propagation measures direct as well as indirect dependencies between files in a codebase. In practical terms, it gives a sense of the actual reach of a change to a randomly chosen file. We calculate the propagation for each file through a process of matrix multiplication&mdash;see <a href='http://almossawi.com/firefox/prose' target='_blank'>this</a> and <a href='http://www.hbs.edu/faculty/Publication%20Files/05-016.pdf' target='_blank'>this</a>. <br /><b>Lower is better.</b>",
                data: data,
                markers: markers,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                format: 'perc',
                target: '#prop-cost',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'prop_cost',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Highly interconnected files",
                description: "Highly interconnected files are files that are interconnected via a chain of cyclic dependencies. These are files that have a fan-out that's higher than the median fan-out in the revision and a fan-in that's higher than the median fan-in in the revision. Highly interconnected files are naturally correlated with propagation, but provide alternative ways of looking at complexity. For more, see <a href='http://almossawi.com/firefox/prose/' target='_blank'>this</a>. <b>Lower is better.</b>",
                data: data,
                markers: markers,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                format: 'perc',
                target: '#core',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'core',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            var files_min = d3.min(data, function(d) { return +d.files; });
            files_min -=  files_min * 0.01;
            var files_max = d3.max(data, function(d) { return +d.files; });
            files_max +=  files_max * 0.01;

            MG.data_graphic({
                min_y: Math.floor(files_min),
                max_y: Math.ceil(files_max),
                title: "Files",
                description: "The number of files in the revision that match our <a href='scripts/data/filter.txt' target='_blank'>set of filters</a>, minus tests and forked code, which currently includes <i>ipc/chromium</i>. <b>Lower is better.</b>",
                data: data,
                markers: markers,
                width: global.trunk.width,
                height: global.trunk.height,
                xax_count: global.trunk.xax_count,
                right: global.trunk.right,
                target: '#files',
                full_width: true,
                x_accessor: 'date',
                y_accessor: 'files',
                linked: true,
                interpolate: 'basic',
                mouseover: mouseover()
            });

            //keep track of mouseouts
            var mouseouts = d3.selectAll('.mg-rollover-rect rect').on('mouseout');

            //did we click to lock?
            d3.selectAll('.mg-rollover-rect rect')
                .on('click', function(d) {
                    window.open('https://hg.mozilla.org/mozilla-central/rev/' + global.activeRevision, '_blank');
                });
        });
    }
}());