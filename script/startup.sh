#!/bin/bash

# Update system and install git
yum update -y
yum install git -y

# docker and docker compose install
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user
chkconfig docker on
curl -L https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# create directories for scripts and docker files
mkdir -p /docker-deploy/bin
mkdir -p /docker-deploy/bin/gitlab-runner
mkdir -p /docker-deploy/bin/jenkins/scripts

# copying scripts and docker files
mv --verbose /tmp/docker-compose.yml /docker-deploy/bin/docker-compose.yml
mv --verbose /tmp/Dockerfile.jenkins /docker-deploy/bin/jenkins/Dockerfile.jenkins
mv --verbose /tmp/jenkins_plugins.txt /docker-deploy/bin/jenkins/plugins.txt
mv --verbose /tmp/jenkins_security.groovy /docker-deploy/bin/jenkins/scripts/security.groovy
mv --verbose /tmp/git_runner_register.sh /docker-deploy/bin/gitlab-runner/register.sh
mv --verbose /tmp/gitlab-runner-template-config.txt /docker-deploy/bin/gitlab-runner/template-config.toml

# set permission for entire directory
chmod -R 755 /docker-deploy/bin

# setup environment variable and docker secrets that are used in docker-compose file
dns=$(ec2-metadata -p | awk '{print $2}')
export dns

jenkins_user="$1"
export jenkins_user

jenkins_pass="$2"
export jenkins_pass

# run docker compose file
docker-compose -f /docker-deploy/bin/docker-compose.yml -p devops --verbose up -d --build