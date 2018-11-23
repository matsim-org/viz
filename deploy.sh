#!/bin/bash
# VSP deploy script for travis CI
eval $(ssh-agent -s)
# see bug with line endings at https://gitlab.com/gitlab-examples/ssh-private-key/issues/1
# this needs a base64 -w0 encoded key
ssh-add <(echo "$VSP_SSH_KEY"| base64 --decode)
# remove old webfiles
ssh vizdeploy@viz.vsp.tu-berlin.de 'rm -r /var/www/viz-dev/*'
# upload fresh built files
scp -r dist/* vizdeploy@viz.vsp.tu-berlin.de:/var/www/viz-dev/
