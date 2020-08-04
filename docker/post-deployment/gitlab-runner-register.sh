#!/bin/bash
# Get the registration token from:
# http://localhost:8000/root/${project}/-/settings/ci_cd

registration_token="$1"
dns=$(ec2-metadata -p | awk '{print $2}')

docker exec -it gitlab-runner1 \
  gitlab-runner register \
    --non-interactive \
    --registration-token "${registration_token}" \
    --locked=false \
    --description docker-stable \
    --url http://"${dns}":8000/ \
    --executor docker \
    --docker-image docker:latest \
    --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
    --docker-privileged
