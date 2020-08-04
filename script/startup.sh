#!/bin/bash
yum update -y
yum install git -y
sysctl -w vm.max_map_count=262144
sysctl -w fs.file-max=65536
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user
chkconfig docker on
curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
mkdir -p /docker-deploy/bin
mkdir -p /docker-deploy/bin/post-deployment
mv --verbose /tmp/docker-compose.yml /docker-deploy/bin
mv --verbose /tmp/Dockerfile.jenkins /docker-deploy/bin
mv --verbose /tmp/gitlab-runner-register.sh /docker-deploy/bin/post-deployment
chmod -R 755 /docker-deploy/bin/*
docker-compose -f /docker-deploy/bin/docker-compose.yml -p devops --verbose up -d