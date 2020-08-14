# What
This is a sample CDK package to deploy Gitlab, Jenkins, and SonarQube (using Docker) to an EC2 host (a m5.large instance using Amazon Linux 2).
Cdk code is in TypeScript.  
This is definitely NOT a safe setup for any production environment.

# Why
Automate the effort to deploy docker services onto an ec2 instance and reduce the possibilities of setting incorrect configurations.

# About CDK
[AWS Page](https://docs.aws.amazon.com/cdk/latest/guide/home.html)  
[Github Page](https://github.com/aws/aws-cdk)

## How to install cdk
* Install npm (follow [this](https://changelog.com/posts/install-node-js-with-homebrew-on-os-x) if you are using Mac)
* npm install -g aws-cdk  
* cdk --help (test the command)

## What do you need to deploy
* An AWS account
* AWS CLI (if you want to use specific profile)
* a pem file. You need to create this under EC2 tab in AWS console. See [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#prepare-key-pair)

## How to deploy
run the following commands in order
```
npm run build
cdk deploy --parameters DevOpsCdkStack:permissionFileName={replace_with_your_pem_file_name}
```

If your pem file is my_pem_file.pem, then the command would be

```
rm -rf cdk.out
npm run build
cdk deploy --parameters permissionFileName=my_pem_file  --parameters jenkinsUsername=myusername --parameters jenkinsPassword=mypassword  --parameters ebsSize=50
```

where `jenkinsUsername`, `jenkinsPassword`, and `ebsSize` are optional parameters.

## How to access Gitlab, Jenkins, and SonarQube
The output of `cdk deploy` command will write the DNS name of EC2 instance to the console.

```
Outputs:
DevOpsCdkStack.devOpsInstanceDNS = ec2-54-185-187-106.us-west-2.compute.amazonaws.com
```

It would take sometime (~5 mins after the cdk deploy command finished) for these url to become available.

* Gitlab: `http://ec2-54-185-187-106.us-west-2.compute.amazonaws.com:8000`
* Jenkins: `http://ec2-54-185-187-106.us-west-2.compute.amazonaws.com:8080`
* SonarQube: `http://ec2-54-185-187-106.us-west-2.compute.amazonaws.com:50002`

## How to ssh into the EC2 instance
Assuming you are in the directory where the pem file exists locally, you need to run

```
chmod 400 my_pem_file.pem
ssh -i my_pem_file.pem ec2-user@ec2-54-185-187-106.us-west-2.compute.amazonaws.com
```

You only need to run the `chmod` the first time you download the pem file.
Obviously replace the DNS name with the output of `cdk deploy` command.

## How to debug startup.sh issue
You need to look at the log outputs in `/var/log/cloud-init-output.log`. It's not exactly easy as the log file contains all logs related to EC2 startup.

## How to set up gitlab runner
Assuming the access token for a particular GitLab project is `asdffdsa`, ssh into ec2 host and run
```
./docker-deploy/bin/gitlab-runner/register.sh asdffdsa
```

# Clean Up
If you want to clean up all the resources created by this project, you can simply run
```
cdk destroy
```
Follow the prompt in the console.  

It will remove all the resources automatically. Keep in mind you would also lose all the data in GitLab, Jenkins, and SonarQube.