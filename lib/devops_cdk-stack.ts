import ec2 = require('@aws-cdk/aws-ec2');
import cdk = require('@aws-cdk/core');
import {AmazonLinuxGeneration, Instance, Vpc} from "@aws-cdk/aws-ec2";
import {SubnetType} from "@aws-cdk/aws-ec2/lib/vpc";
import {Asset} from "@aws-cdk/aws-s3-assets";
import {CfnOutput, CfnParameter} from "@aws-cdk/core";

export class DevOpsCdkStack extends cdk.Stack {
    public readonly vpc: Vpc
    public readonly devOpsInstance: Instance
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const permissionFileName = new CfnParameter(this, "permissionFileName", {
            type: "String",
            description: "The name of the permission file to use (without .pem extension) for the ec2 instance."
        });

        this.vpc = new ec2.Vpc(this, 'VPC'); // by default, it allows all outbound traffic

        this.devOpsInstance = new Instance(this, 'devOpsInstance', {
            keyName: permissionFileName.valueAsString,
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            machineImage: new ec2.AmazonLinuxImage({generation: AmazonLinuxGeneration.AMAZON_LINUX_2}),
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
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(8080)); // jenkins
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(50000)); // jenkins
        this.devOpsInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(50002)); // SonarQube

        const startupScriptAsset = new Asset(this, 'startupScriptAsset', {path: 'script/startup.sh'});
        const dockerComposeAsset = new Asset(this, 'dockerComposeAsset', {path: 'docker/docker-compose.yml'});
        const dockerJenkinsAsset = new Asset(this, 'dockerJenkinsAsset', {path: 'docker/Dockerfile.jenkins'});
        const gitlabRunnerPostSetupAsset = new Asset(this, 'gitlabRunnerPostSetupAsset', {path: 'docker/post-deployment/gitlab-runner-register.sh'});

        const startupScriptLocalPath = this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: startupScriptAsset.bucket,
            bucketKey: startupScriptAsset.s3ObjectKey,
        });

        const dockerComposeLocalPath = this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: dockerComposeAsset.bucket,
            bucketKey: dockerComposeAsset.s3ObjectKey,
            localFile: '/tmp/docker-compose.yml'
        });

        const dockerJenkinsLocalPath = this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: dockerJenkinsAsset.bucket,
            bucketKey: dockerJenkinsAsset.s3ObjectKey,
            localFile: '/tmp/Dockerfile.jenkins'
        });

        const gitlabRunnerPostSetupLocalPath = this.devOpsInstance.userData.addS3DownloadCommand({
            bucket: gitlabRunnerPostSetupAsset.bucket,
            bucketKey: gitlabRunnerPostSetupAsset.s3ObjectKey,
            localFile: '/tmp/gitlab-runner-register.sh'
        });

        this.devOpsInstance.userData.addExecuteFileCommand({
            filePath: startupScriptLocalPath,
            arguments: '--verbose -y'
        });

        startupScriptAsset.grantRead(this.devOpsInstance.role);
        dockerComposeAsset.grantRead(this.devOpsInstance.role);
        dockerJenkinsAsset.grantRead(this.devOpsInstance.role);
        gitlabRunnerPostSetupAsset.grantRead(this.devOpsInstance.role);
        
        new CfnOutput(this, 'devOpsInstanceDNS', {
            value: this.devOpsInstance.instancePublicDnsName,
            description: "public DNS name for the ec2 instance created.",
            exportName: 'devOpsInstanceDNS'
        });
    }
}
