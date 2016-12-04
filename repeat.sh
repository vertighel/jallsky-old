#!/bin/bash

        #!/bin/bash
        for i in `seq 1 150`;
        do
                echo "jallsky numero $i"

		./jallsky.7.js /dev/ttyUSB0 10    
		wait
		sleep 10		
        done    
        

