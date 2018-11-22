#!/bin/bash
# VSP deploy script for travis CI
# remove old webfiles
ssh -i matsim-org/viz/VSP_SSH_KEY vizdeploy@viz.vsp.tu-berlin.de 'sudo rm -r /var/www/viz-dev/*'
# upload fresh built files
scp -i matsim-org/viz/VSP_SSH_KEY ./dist vizdeploy@viz.vsp.tu-berlin.de:/var/www/viz-dev
