#!/bin/bash

        #!/bin/bash
        for i in `seq 45 450`;
        do
                echo "*********************** jallsky number $i of 450 **********************"
		./jallsky.7.js /dev/ttyUSB0 10    
		wait
                # echo "*********************** convert number $i of 450 **********************"
		# convert -delay 5 -negate -threshold 0 -negate `ls /mnt/png/*.png | tail -n 25` /mnt/output.mp4
		sleep 1		
        done    
        

