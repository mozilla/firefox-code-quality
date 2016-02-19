import os
import tarfile
import urllib.request
import re
import sys

# returns a changeset string for a given date (one of potentially several)
def getChangeSetString(year, month, day):
  print(year, month, day)
  # get day from month
  dir = 'http://releases.mozilla.org/pub/firefox/nightly/' + year + '/' + month + '/'
  urlpath = urllib.request.urlopen(dir)
  string = urlpath.read().decode('utf-8')
  pattern = re.compile(year + '-' + month + '-' + day + '-.*-mozilla-central/"')
  filelist = pattern.findall(string)
  if len(filelist) > 0:
    filename = filelist[0][:-1]
  else:
    # if no changeset for that date, all bets are off
    print("No changeset exists for that date")
    return

  # get any of the text files
  urlpath = urllib.request.urlopen(dir + filename)
  string = urlpath.read().decode('utf-8')
  pattern = re.compile(filename + '.*\.txt"') #the pattern actually creates duplicates in the list
  filelist = pattern.findall(string)
  filename = filelist[0][:-1]

  # read second line
  urlpath = urllib.request.urlopen(dir + filename)
  string = urlpath.read().decode('utf-8')
  bits = string.split('/')
  changeset = bits[len(bits) - 1].rstrip()

  return changeset


# pulls the tarball for the specified changeset from hg.mozilla.org
def getChangeSet(changeset):
  # pull that changeset
  url = 'https://hg.mozilla.org/mozilla-central/archive/' + changeset + '.tar.gz'
  outFilePath = 'understand_in'
  print(url)

  # get new source
  urllib.request.urlretrieve(url, outFilePath + '/' + changeset)
  tar = tarfile.open(outFilePath + '/' + changeset, 'r:gz')
  tar.extractall(outFilePath)
  tar.close()
  os.remove(outFilePath + '/' + changeset)


if __name__ == '__main__':
  # are we getting the latest changeset or a changeset for a particular day?
  if len(sys.argv) == 1:
    getChangeSet('tip')
  else:
    args = sys.argv
    year = args[1]
    month = args[2]
    day = args[3]

    changeset = getChangeSetString(year, month, day)
    getChangeSet(changeset)