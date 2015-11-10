import os
import sys
import time
import datetime

#get revision name
dirs = os.listdir('understand_in')
revision = ''
for file in dirs:
   if file[0] != '.':
     revision = file.split('-')[2]

#add timestamp and revision name to metrics_out/full_metrics.csv
ts = time.time()
analysis_datetime = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%dT%H:%M:%SZ')

#add all metrics from metrics_out/loc_mccabe_metrics.csv to metrics_out/full_metrics.csv
loc_mccabe_lines = [line.rstrip('\n') for line in open('metrics_out/loc_mccabe_metrics.csv')]

#add all metrics from metrics_out/dependency_metrics.csv to metrics_out/full_metrics.csv
dependency_lines = [line.rstrip('\n') for line in open('metrics_out/dependency_metrics.csv')]
matlab_metrics = dependency_lines[1].split(",")

#append to full_metrics.csv
module = 'all'
if len(sys.argv) > 1:
  module = sys.argv[1] 
  
with open('metrics_out/full_metrics-' + module + '.csv', 'a') as metrics_out:
    metrics_out.write('\n' + analysis_datetime + ',' + revision + ',' 
        + matlab_metrics[1] + ',' 
        + matlab_metrics[2] + ',' 
        + matlab_metrics[3] + ',' 
        + matlab_metrics[4] + ',' 
        + matlab_metrics[5] + ',' 
        + matlab_metrics[6] + ',' 
        + matlab_metrics[7] + ',' 
        + matlab_metrics[8] + ',' 
        + matlab_metrics[9] + ',' 
        + matlab_metrics[10] + ',' 
        + matlab_metrics[11] + ',' 
        + loc_mccabe_lines[1])