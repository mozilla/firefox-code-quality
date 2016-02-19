import understand
import sys

def projectMetrics(db):
  # get just the metrics we need rather than all metrics
  # this started to occasionally hang on scitools build 651
  # metrics = db.metric(db.metrics())

  countLine = 0
  countLineCode = 0
  sumCyclomatic = 0

  for func in db.ents("file"):
    metric = func.metric(("CountLine","CountLineCode","SumCyclomatic"))
    if metric["CountLine"] is not None:
      countLine += metric["CountLine"]
    if metric["CountLineCode"] is not None:
      countLineCode += metric["CountLineCode"]
    if metric["SumCyclomatic"] is not None:
      sumCyclomatic += metric["SumCyclomatic"]

  print("SumCyclomatic,CountLine,CountLineCode")
  print(sumCyclomatic,",",countLine,",",countLineCode)


if __name__ == '__main__':
  args = sys.argv
  db = understand.open(args[1])
  projectMetrics(db)