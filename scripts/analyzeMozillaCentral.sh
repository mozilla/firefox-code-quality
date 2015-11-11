#!/bin/bash

# get latest source, we can pass in dont_pull to use existing codebase 
# instead of pulling latest
if [ "$1" != "dont_pull" ]
then
  rm -rf understand_in/*
  rm -rf understand_in/*
  python3 getLatestSource.py

  rm currentBuild-*.udb
fi

#g et path (eg. understand_in/mozilla-central-a1ccea59e254)
REVISION=()
for FILE in understand_in/*; do
  [[ -d $FILE ]] && REVISION+=("$FILE")
done

# remove filtered files and directories (per third-party code list)
while IFS='' read -r line || [[ -n "$line" ]]; do
  echo './'$REVISION'/'$line
  # und remove $REVISION'/'$line -db currentBuild.udb
  # removing files is faster and more reliable than und remove
  rm -rf './'$REVISION'/'$line
done < 'data/filter.txt'

analyzeModule() {
  MOD=$1
  DB_NAME=currentBuild'-'$MOD.udb

  # get loc, mccabe and export dependencies
  und create -db $DB_NAME -languages c++ Web add -exclude ".*,*test*" $REVISION'/'$MOD
  und settings -FileTypes .jsm=Javascript -db $DB_NAME
  echo $REVISION'/'$MOD
  und analyze -db $DB_NAME
  python3 projectMetrics.py $DB_NAME > metrics_out/loc_mccabe_metrics.csv
  und export -dependencies file csv process_in/dependencies.csv -db $DB_NAME

  # process dependencies
  python3 extractFilesAndDeps.py process_in/dependencies.csv

  # cleanup
  rm -rf misc/dependencies.csv.files
  rm -rf scipy_in/dependencies.csv.deps
  mv process_in/dependencies.csv.files misc
  mv process_in/dependencies.csv.deps scipy_in

  # get architectural metrics
  # matlab -nodesktop -r main_metrics_generator
  python3 generateDepMetrics.py

  # add date and revision number to full_metrics.csv and then data from the 
  # other two metrics_out files
  python3 addToFullMetrics.py $MOD
}

# analyze modules
while IFS='' read -r line || [[ -n "$line" ]]; do
  echo $line
  analyzeModule $line
done < 'data/modules.txt'

# analyze codebase (no param = entire codebase)
analyzeModule

# since this runs as a crontab...
chmod -R 0755 misc
chmod -R 0755 scipy_in