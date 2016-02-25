#!/bin/bash

rm -rf understand_in/*
rm -rf understand_in/*

year="$1"
month="$2"
day="$3"


analyzeModule() {
  # module name
  MOD="$1"
  DB_NAME=currentBuild'-'$MOD.udb

  # changeset date
  changeset_date="$2"

  # get loc, mccabe and export dependencies
  und create -db $DB_NAME -languages c++ Web add -exclude ".*,*test*" $REVISION'/'$MOD
  und settings -FileTypes .jsm=Javascript -db $DB_NAME
  echo $REVISION'/'$MOD
  und analyze -db $DB_NAME
  python3 generateProjectMetrics.py $DB_NAME > metrics_out/loc_mccabe_metrics.csv
  python3 generateProjectMetricsFunctionLevel.py $DB_NAME > metrics_out/function_level_metrics.csv
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
  if [ -z "$MOD" ]; then
    MOD="all"
  fi

  python3 addToFullMetrics.py $MOD $changeset_date
}


cleanup() {
  rm -rf understand_in/*
  rm -rf understand_in/*
  rm currentBuild-*.udb
}


process() {
  changeset_date="$1"

  #get path (eg. understand_in/mozilla-central-a1ccea59e254)
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

  # analyze modules
  while IFS='' read -r line || [[ -n "$line" ]]; do
    echo $line
    analyzeModule $line $changeset_date
  done < 'data/modules.txt'

  # analyze codebase (no param = entire codebase)
  analyzeModule "" $changeset_date

  # since this runs as a crontab...
  chmod -R 0755 misc
  chmod -R 0755 scipy_in
}


# if day is specified, get changeset for that day, otherwise, for entire month
if [ -z "$day" ]; then
  # loop through all days for this month
  for d in {1..31}
    do
      # prefix number with 0 if < 10
      if [ "$d" -lt "10" ]; then
        day="0"$d
      fi

      echo 'Getting changeset for '$year'-'$month'-'$day
      cleanup
      python3 getSource.py "$1" "$2" $day
      process "$1"-"$2"-"$3"
    done
  else
    cleanup
    python3 getSource.py "$1" "$2" "$3"
    process "$1"-"$2"-"$3"
fi