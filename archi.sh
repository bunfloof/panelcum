#!/bin/bash

current_time=$(date +"%m-%d-%y-%H-%M-%S")

seconds=$(date +"%S")

output_file="p-${seconds}-panel-${current_time}.tar.gz"

tar --exclude='.*' -czvf "${output_file}" *

echo "Archive created: ${output_file}"
