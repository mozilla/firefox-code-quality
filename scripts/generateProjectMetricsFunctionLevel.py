import understand
import sys
import re

def projectMetrics(db):
  print("file,function,loc,loc_code,mccabe",sep="")

  for func in db.ents("function"):
    metric = func.metric(("CountLine","CountLineCode","Cyclomatic"))
    if metric["CountLine"] is not None:
      bits = re.split('mozilla-central-[^/]*/', func.uniquename())
      file = bits[len(bits) - 1]
      print(file, ",", func.longname(), ",", metric["CountLine"], ",", metric["CountLineCode"], ",", metric["Cyclomatic"], sep="")


if __name__ == '__main__':
  args = sys.argv
  db = understand.open(args[1])
  projectMetrics(db)