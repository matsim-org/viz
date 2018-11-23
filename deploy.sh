#!/bin/bash
# VSP deploy script for travis CI
eval $(ssh-agent -s)
# see bug with line endings at https://gitlab.com/gitlab-examples/ssh-private-key/issues/1
# this works and needs a base64 -w0 encoded key with cmd "cat id_rsa | base64 -w0"
# and the content of var VSP_SSH_KEY_BASE64 to be in double-quotes (in Travis)
#ssh-add <(echo "$VSP_SSH_KEY_BASE64"| base64 --decode)
# another approach: convert line endings on the fly
echo "$VSP_SSH_KEY" | dos2unix | ssh-add -
# remove old webfiles
ssh vizdeploy@viz.vsp.tu-berlin.de 'rm -r /var/www/viz-dev/*'
# upload fresh built files
scp -r dist/* vizdeploy@viz.vsp.tu-berlin.de:/var/www/viz-dev/
