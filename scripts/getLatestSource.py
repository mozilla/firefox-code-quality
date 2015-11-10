import os
import tarfile
import urllib.request

fileName = 'tip.tar.gz'
url = 'https://hg.mozilla.org/mozilla-central/archive/' + fileName
outFilePath = 'understand_in'

# get new source
urllib.request.urlretrieve(url, outFilePath + '/' + fileName)

tar = tarfile.open(outFilePath + '/' + fileName, 'r:gz')
tar.extractall(outFilePath)
tar.close()
os.remove(outFilePath + '/' + fileName)