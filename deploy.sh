#!/bin/bash
# VSP deploy script for travis CI
DOMAIN=$1
echo "domain is: $DOMAIN"
# check whether ssh-agent is present
eval $(ssh-agent -s)
# see bug with line endings at https://gitlab.com/gitlab-examples/ssh-private-key/issues/1
# this works but needs a base64 encoded key with cmd "cat id_rsa | base64 -w0"
# paste the output of cmd into var VSP_SSH_KEY_BASE64 in double-quotes (var in Travis)
ssh-add <(echo "$VSP_SSH_KEY_BASE64"| base64 --decode)
# another approach: convert line endings on the fly
# both not working
#echo "$VSP_SSH_KEY" | dos2unix | ssh-add -
#echo "${VSP_SSH_KEY}" | tr -d '\r' | ssh-add - > /dev/null
# remove old webfiles
ssh vizdeploy@viz.vsp.tu-berlin.de "rm -r /var/www/$DOMAIN/*"
# upload fresh built files
scp -r dist/* vizdeploy@viz.vsp.tu-berlin.de:/var/www/$DOMAIN/
