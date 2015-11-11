import understand
import sys

def projectMetrics(db):
    metrics = db.metric(db.metrics())

    print("SumCyclomatic,CountLine,CountLineCode")
    print(metrics['SumCyclomatic'], ",", metrics['CountLine'], ",", metrics['CountLineCode'])

if __name__ == '__main__':
    args = sys.argv
    db = understand.open(args[1])
    projectMetrics(db)