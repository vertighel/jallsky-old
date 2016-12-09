#!/bin/bash

# for i in `seq 1 10`;
# do
#     echo "*********************** jallsky number $i **********************"
#     ./jallsky.7.js /dev/ttyUSB0 1
#     wait
#     # echo "*********************** convert number $i of 450 **********************"
#     # convert -delay 5 -negate -threshold 0 -negate `ls /mnt/png/*.png | tail -n 25` /mnt/output.mp4
#     sleep 1		
#     echo "*********************** ended number $i **********************"
# done    
# convert -delay 5 -negate -threshold 0 -negate `ls ./mnt/png/*.png | tail -n 10` ./mnt/output.mp4

# for i in `seq 1 10`;
# do
#     echo "*********************** jallsky number $i **********************"
#     ./jallsky.7.js /dev/ttyUSB0 3    
#     wait
#     # echo "*********************** convert number $i of 450 **********************"
#     # convert -delay 5 -negate -threshold 0 -negate `ls /mnt/png/*.png | tail -n 25` /mnt/output.mp4
#     sleep 1		
#     echo "*********************** ended number $i  **********************"
# done    
# convert -delay 5 -negate -threshold 0 -negate `ls ./mnt/png/*.png | tail -n 20` ./mnt/output.mp4
# ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm
# for i in `seq 1 10`;
# do
#     echo "*********************** jallsky number $i **********************"
#     ./jallsky.7.js /dev/ttyUSB0 5    
#     wait
#     # echo "*********************** convert number $i of 450 **********************"
#     # convert -delay 5 -negate -threshold 0 -negate `ls /mnt/png/*.png | tail -n 25` /mnt/output.mp4
#     sleep 1		
#     echo "*********************** ended number $i  **********************"
# done    
# convert -delay 5 -type Grayscale `ls ./mnt/png/*.png | tail -n 25` ./mnt/output.mp4
# ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm


for i in `seq 1 300`;
do
    echo "*********************** jallsky number $i **********************"
    ./jallsky.7.js /dev/ttyUSB0 25    
    wait
    # echo "*********************** convert number $i of 450 **********************"
    # convert -delay 5 -negate -threshold 0 -negate `ls /mnt/png/*.png | tail -n 25` /mnt/output.mp4
    sleep 1		
    echo "*********************** ended number $i  **********************"
    convert -delay 5 -type Grayscale `ls ./mnt/png/*.png | tail -n 60` ./mnt/output.mp4
    ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm
done    


