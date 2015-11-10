import numpy as np
from scipy import sparse
import statistics

def metrics(data_file):
  output_str = ''
  dsms = []

  # the first thing we do is load the csv file (file #,from,to)
  # into a DSM; we do this by converting the triples to a sparse matrix
  # dsm is the first-order DSM of dependencies
  dsm_initial = loadDsm(data_file)

  # calculate the visibility matrices for all path lengths
  dsms = raiseAllPowers(dsm_initial, -1)

  # data file name
  output_str = output_str + data_file + ','

  # the final visibility matrix
  dsm_visibility = dsms[len(dsms) - 1]

  # number of files
  output_str = output_str + str(len(dsm_initial)) + ','

  # now, get the fan-in and fan-out data and calculate the density and propagation cost
  [fi,fo] = getFiFo(dsm_initial)
  [vfi,vfo] = getFiFo(dsm_visibility)

  # get median values of vfi/vfo to put file counts into four buckets
  arr_vfo = np.array(vfo).flatten()
  arr_vfi = np.array(vfi).flatten()
  arr_fo = np.array(fo).flatten()
  arr_fi = np.array(fi).flatten()

  density = (np.count_nonzero(dsm_initial) / len(dsm_initial) / len(dsm_initial)) * 100
  output_str = output_str + str(density / 100) + ','

  propagation_cost = sum(arr_vfo) / (len(dsm_initial) * len(dsm_initial)) * 100
  output_str = output_str + str(propagation_cost / 100) + ','

  vfo_median = statistics.median(arr_vfo)
  vfi_median = statistics.median(list(filter(lambda x: x != 0, arr_vfi)))

  vfo_mean = statistics.mean(np.array(arr_vfo).flatten())
  vfi_mean = statistics.mean(list(filter(lambda x: x != 0, arr_vfi)))

  vfi_mode = statistics.mode(arr_vfi)
  vfo_mode = statistics.mode(arr_vfo)

  fo_median = statistics.median(arr_fo)
  fi_median = statistics.median(arr_fi)

  control_size = 0 		# high vfo, low vfi
  core_size = 0 		# high vfo, high vfi
  peripheral_size = 0 	# low vfo, low vfi
  shared_size = 0 		# low vfo, high vfi

  for i, val in enumerate(vfi):
    # base the cutoff points on the visibility matrix rather than first-order matrix
    # otherwise, we'd use fi, fo, fi_median and fo_median
    if vfi[i] >= vfi_median and vfo[i] >= vfo_median:
      core_size += 1
    elif vfi[i] < vfi_median and vfo[i] < vfo_median:
      peripheral_size += 1
    elif vfi[i] <= vfi_median and vfo[i] > vfo_median:
      control_size += 1
    elif vfi[i] > vfi_median and vfo[i] <= vfo_median:
      shared_size += 1

  print('vfo mean: ', vfo_mean)
  print('vfi mean: ', vfi_mean)
  print('vfo median: ', vfo_median)
  print('vfi median: ', vfi_median)
  print('vfi mode: ', vfi_mode)
  print('fo median: ', fo_median)
  print('fi median: ', fi_median)
  print('core: ', core_size)
  print('peripheral: ', peripheral_size)
  print('shared: ', shared_size)
  print('control: ', control_size)
  print('vfi mode: ', vfi_mode)
  print('vfo mode ', vfo_mode)

  output_str = output_str + str(core_size) + ','
  output_str = output_str + str(peripheral_size) + ','
  output_str = output_str + str(shared_size) + ','
  output_str = output_str + str(control_size) + ','
  output_str = output_str + str(vfo_median) + ','
  output_str = output_str + str(vfi_median) + ','
  output_str = output_str + str(fo_median) + ','
  output_str = output_str + str(fi_median)

  return output_str


def raiseAllPowers(initial_matrix, max_paths):
  initial_matrix = sparse.csr_matrix(initial_matrix)
  initial_matrix.data.fill(1)

  done = 0
  current_path_length = 0
  matrices = []

  if max_paths == -1:
    max_paths = 1000

  matrices.append(initial_matrix)

  while done == 0 and current_path_length < max_paths:
    print('Calculating DSM for path length = ', current_path_length + 1)

    # square the current matrix
    matrix_squared = matrices[current_path_length] * matrices[current_path_length]

    # sum the matrix with the previous one
    matrix_squared = matrix_squared + matrices[current_path_length]

    # sponify the matrix, so that we converge
    matrix_squared.data.fill(1)

    # nnz elements    
    print(len(matrix_squared.nonzero()[0]), len(matrices[current_path_length].nonzero()[0]))

    # when we've achieved the transitive closure of our matrix, we're done
    if len(matrix_squared.nonzero()[0]) == len(matrices[current_path_length].nonzero()[0]):
      done = 1
      continue
    else:
      matrices.append(matrix_squared)
      current_path_length += 1

  return matrices


def getFiFo(dsmProp):
  FI = dsmProp.sum(axis=0) # sum over columns
  FO = dsmProp.sum(axis=1) # sum over rows
  FI = FI.transpose()

  return [FI, FO]


# credit https://gist.github.com/kevinavery/9613505
def loadDsm(filename):
  DATA = np.loadtxt(filename, delimiter=',')
  dims = DATA.shape[1] - 1
  shape = [np.max(DATA[:,i]) for i in range(dims)]
  M = np.zeros(shape=shape)
  for row in DATA:
    index = tuple(row[:-1] - 1)
    M.itemset(index, row[-1])

  return M