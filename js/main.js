(function() {
    'use strict'

    var global = {
        trunk: {
            width: 360,
            height: 220,
            left: 0,
            right: 60,
            xax_count: 3
        },
        timescale: 'monthly',
        daily_time_window: 2
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

        //event listener for module switch
        $('ul.switch li a.pill').on('click', function(event) {
            event.preventDefault();
            $('ul.switch li a.pill').removeClass('active');
            $(this).addClass('active');

            var module = $(this).attr('id').slice(5);
            document.location.hash = module;

            drawCharts(module);

            return false;
        });

        //event listener for timescale switch
        $('ul.timescale li a.pill').on('click', function(event) {
            event.preventDefault();
            $('ul.timescale li a.pill').removeClass('active');
            $(this).addClass('active');

            global.timescale = $(this).attr('id');
            drawCharts();

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

            //are we filtering for monthly view? (show only first day)
            if(global.timescale == 'monthly') {
                var data_ht = {};

                data = data.map(function(d) {
                    var month = d.date.getMonth();
                    var year = d.date.getFullYear();
                    data_ht[year + '-' + month] = d;
                });
                
                data = d3.values(data_ht);
            //are we filtering for daily view? (show only last six months)
            } else if(global.timescale == 'daily') {
                var latest = d3.max(data, function(d) {
                    return d.date;
                });

                //x months ago
                var month = (latest.getMonth() - global.daily_time_window) % 12
                var day = latest.getDate();
                var year = (latest.getMonth() < 0) 
                    ? latest.getFullYear() - 1
                    : latest.getFullYear();

                var x_months_ago = new Date();
                x_months_ago.setFullYear(year)
                x_months_ago.setMonth(month)
                x_months_ago.setDate(day)

                data = data.filter(function(d) {
                    return d.date > x_months_ago;
                });
            }

            var loc_min = d3.min(data, function(d) { return +d.CountLineCode; });
            loc_min -=  loc_min * 0.01;
            var loc_max = d3.max(data, function(d) { return +d.CountLineCode; });
            loc_max += loc_max * 0.01;

            MG.data_graphic({
                min_y: loc_min,
                max_y: loc_max,
                title: "Lines of code",
                description: "The number of executable lines of code in each revision, ignoring comments and blank lines. <b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
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
                description: "The number of linearly independent paths within a revision per 1,000 lines of code. These are paths that occur as a result of, say, branching. A cyclomatic complexity value of 200 therefore means that there are around 200 independent paths in every 1,000 lines of code. <a href='https://en.wikipedia.org/wiki/Cyclomatic_complexity' target='_blank'>Read more</a>. <b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Dependencies",
                description: "The number of files that the average file can directly impact. Per the static analysis tool's manual, 'an item depends on another if it includes, calls, sets, uses, casts, or refers to that item.' <b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Propagation",
                description: "The proportion of files in a revision that are connected, either directly or indirectly. In practical terms, propagation gives a sense of the total reach of a change to a file. We calculate propagation through a process of matrix multiplication&mdash;see <a href='http://almossawi.com/firefox/prose' target='_blank'>this</a> and <a href='http://www.hbs.edu/faculty/Publication%20Files/05-016.pdf' target='_blank'>this</a>. <br /><b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
                interpolate: 'basic',
                mouseover: mouseover()
            });

            MG.data_graphic({
                title: "Highly interconnected files",
                description: "Files that are interconnected via a chain of cyclic dependencies. These are pairs of files in a revision that have a lot of dependencies between each other. Highly interconnected files are naturally correlated with propagation, but provide alternative ways of looking at complexity, which is useful. For more, see <a href='http://almossawi.com/firefox/prose/' target='_blank'>this</a>. <b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
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
                description: "The number of files in a revision, not counting <a href='scripts/data/filter.txt' target='_blank'>filtered files</a> and tests. <b>Lower is better.</b>",
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
                linked_format: "%Y-%m-%d-%H-%M",
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