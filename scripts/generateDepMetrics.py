import os
import codequality

dir = 'matlab_in'
the_data = ''
file_list = []

# create the deps file 
with open('metrics_out/dependency_metrics.csv', 'w') as fid:
  # process all data files in our incoming directory
  for file in os.listdir(dir):
    if file.endswith(".deps"):
        file_list.append(file)

  fid.write('data_file,files,first_order_density,prop_cost,core_size,periphery_size,shared_size,control_size,vfo_median,vfi_median,fo_median,fi_median\n')

  # get all metrics from those files
  for i, current_data_file in enumerate(file_list):
    print(i + 1, ' Processing ', current_data_file)

    the_data = codequality.metrics('matlab_in/' + current_data_file)

    fid.write(the_data + '\n')
    print(i + 1, ' Processed ', current_data_file)

print('\nAll done!\n')