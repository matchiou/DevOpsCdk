import ec2 = require('@aws-cdk/aws-ec2');
import cdk = require('@aws-cdk/core');
import {SubnetType} from "@aws-cdk/aws-ec2/lib/vpc";
import {Asset} from "@aws-cdk/aws-s3-assets";
import {CfnOutput, CfnParameter} from "@aws-cdk/core";

export class DevOpsCdkStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc
    public readonly devOpsInstance: ec2.Instance

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const permissionFileName = new CfnParameter(this, "permissionFileName", {
            type: "String",
            description: "The name of the permission file to use (without .pem extension) for the ec2 instance."
        });

        const jenkinsUsername = new CfnParameter(this, "jenkinsUsername", {
            type: "String",
            description: "The default username for jenkins",
            default: "admin"
        });

        const jenkinsPassword = new CfnParameter(this, "jenkinsPassword", {
            type: "String",
            description: "The default password for jenkins",
            default: "admin"
        });

        const ebsSize = new CfnParameter(this, "ebsSize", {
            type: "Number",
            description: "The EBS volume size in GB",
            default: 30
        });

        this.vpc = new ec2.Vpc(this, 'VPC'); // by default, it allows all outbound traffic

        let ebsVolume = ec2.BlockDeviceVolume.ebs(ebsSize.valueAsNumber, {
            deleteOnTermination: true,
            encrypted: true
        });

        this.devOpsInstance = new ec2.Instance(this, 'devOpsInstance', {
            keyName: permissionFileName.valueAsString,
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            machineImage: new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2}),
            blockDevices: [{
                deviceName: '/dev/xvda',
                volume: ebsVolume,
            }],
            vpcSubnets: {
                // not through nat gateway and allow direct ssh connection
                subnetType: SubnetType.PUBLIC
            }
        });

        /**
         * Start of gitlab specific network configuration
         */
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(22)); // ssh access
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(8000)); // http port for gitlab
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(8433)); // https port for gitlab
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(60000)); // gitlab external register port
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(8080)); // jenkins
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(50000)); // jenkins
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(50002)); // SonarQube

        const startupScriptAsset = new Asset(this, 'startupScriptAsset', {path: 'script/startup.sh'});
        const dockerComposeAsset = new Asset(this, 'dockerComposeAsset', {path: 'docker/docker-compose.yml'});
        const dockerJenkinsAsset = new Asset(this, 'dockerJenkinsAsset', {path: 'docker/jenkins/Dockerfile.jenkins'});
        const jenkinsPluginsListAsset = new Asset(this, 'jenkinsPluginsListAsset', {path: 'docker/jenkins/plugins.txt'});
        const jenkinsSecurityAsset = new Asset(this, 'jenkinsSecurityAsset', {path: 'docker/jenkins/scripts/security.groovy'});
        const gitlabRunnerPostSetupAsset = new Asset(this, 'gitlabRunnerPostSetupAsset', {path: 'docker/gitlab-runner/register.sh'});

        const startupScriptLocalPath = this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: startupScriptAsset.bucket,
            bucketKey: startupScriptAsset.s3ObjectKey,
        });

        this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: dockerComposeAsset.bucket,
            bucketKey: dockerComposeAsset.s3ObjectKey,
            localFile: '/tmp/docker-compose.yml'
        });

        this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: dockerJenkinsAsset.bucket,
            bucketKey: dockerJenkinsAsset.s3ObjectKey,
            localFile: '/tmp/Dockerfile.jenkins'
        });

        this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: gitlabRunnerPostSetupAsset.bucket,
            bucketKey: gitlabRunnerPostSetupAsset.s3ObjectKey,
            localFile: '/tmp/git_runner_register.sh'
        });

        this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: jenkinsPluginsListAsset.bucket,
            bucketKey: jenkinsPluginsListAsset.s3ObjectKey,
            localFile: '/tmp/jenkins_plugins.txt'
        });

        this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: jenkinsSecurityAsset.bucket,
            bucketKey: jenkinsSecurityAsset.s3ObjectKey,
            localFile: '/tmp/jenkins_security.groovy'
        });

        this.devOpsInstance.userData.addExecuteFileCommand({
            filePath: startupScriptLocalPath,
            arguments: `${jenkinsUsername.valueAsString} ${jenkinsPassword.valueAsString}`
        });

        startupScriptAsset.grantRead(this.devOpsInstance.role);
        dockerComposeAsset.grantRead(this.devOpsInstance.role);
        dockerJenkinsAsset.grantRead(this.devOpsInstance.role);
        gitlabRunnerPostSetupAsset.grantRead(this.devOpsInstance.role);
        jenkinsPluginsListAsset.grantRead(this.devOpsInstance.role);
        jenkinsSecurityAsset.grantRead(this.devOpsInstance.role);

        new CfnOutput(this, 'devOpsInstanceDNS', {
            value: this.devOpsInstance.instancePublicDnsName,
            description: "public DNS name for the ec2 instance created.",
            exportName: 'devOpsInstanceDNS'
        });
    }
}
