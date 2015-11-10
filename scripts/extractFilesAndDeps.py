import os
import sys

filenames = []
dependencies = []
filenamesHash = {}

if len(sys.argv) > 1:
    iFile = sys.argv[1] 
else:
    print("Usage: ", sys.argv[0], " <inputFile>\n")
    sys.exit()

def dedup(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if not (x in seen or seen_add(x))]

fFile = iFile + ".files"
dFile = iFile + ".deps"

print("Input file:         ", iFile)
print("Filenames file:     ", fFile)
print("Dependency file:    ", dFile)

# get filenames from the dependencies file from Understand and 
INFILE = [line.rstrip('\n') for line in open(iFile)]

for line in INFILE:
    if line.find("From File") != -1:
        continue

    line = line.rstrip()
    strings = line.split(',')
    filenames.append(strings[0])
    filenames.append(strings[1])

# sort and dedup the set of files
filenames.sort()
filenames = dedup(filenames)


# put the filenames in a hash table for later use and write them to our .files file
with open(fFile, 'a') as FILES_OUTFILE:
    FILES_OUTFILE.seek(0)
    FILES_OUTFILE.truncate()
    i = 1

    for filename in filenames:
        filenamesHash[filename] = i
        i += 1

        FILES_OUTFILE.write(filename + "\n")

# create a .deps file using the filename hash table
# we'll use this set to generate our propagation matrix in MATLAB
INFILE = [line.rstrip('\n') for line in open(iFile)]
with open(dFile, 'a') as DEPS_OUTFILE:
    DEPS_OUTFILE.seek(0)
    DEPS_OUTFILE.truncate()

    for line in INFILE:
        if line.find("From File") != -1:
            continue

        line = line.rstrip()
        strings = line.split(',')

        fromFile = strings[0]
        toFile = strings[1]
        number = strings[2]

        DEPS_OUTFILE.write(str(filenamesHash[fromFile]) + "," + str(filenamesHash[toFile]) + "," + number + "\n")
