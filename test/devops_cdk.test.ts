import cdk = require('@aws-cdk/core');
import {DevOpsCdkStack} from "../lib/devops_cdk-stack";
import {expect as expectCDK, haveResource} from '@aws-cdk/assert';

const TESTING_STACK_NAME = 'unit-test-stack';
const securityGroupResourceType = 'AWS::EC2::SecurityGroup';

test('security group inbound rules', () => {
    const app = new cdk.App();
    let devopsStack = new DevOpsCdkStack(app, TESTING_STACK_NAME);

    expectCDK(devopsStack).to(haveResource(
        securityGroupResourceType, {
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:22",
                    "FromPort": 22,
                    "IpProtocol": "tcp",
                    "ToPort": 22
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:8000",
                    "FromPort": 8000,
                    "IpProtocol": "tcp",
                    "ToPort": 8000
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:8433",
                    "FromPort": 8433,
                    "IpProtocol": "tcp",
                    "ToPort": 8433
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:60000",
                    "FromPort": 60000,
                    "IpProtocol": "tcp",
                    "ToPort": 60000
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:8080",
                    "FromPort": 8080,
                    "IpProtocol": "tcp",
                    "ToPort": 8080
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:50000",
                    "FromPort": 50000,
                    "IpProtocol": "tcp",
                    "ToPort": 50000
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "from 0.0.0.0/0:50002",
                    "FromPort": 50002,
                    "IpProtocol": "tcp",
                    "ToPort": 50002
                }
            ],
        }
    ));

    expectCDK(devopsStack).to(haveResource(
        securityGroupResourceType, {
            "SecurityGroupEgress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow all outbound traffic by default",
                    "IpProtocol": "-1"
                }
            ],
        }
    ));
});

test('security group outbound rules', () => {
    const app = new cdk.App();
    let devopsStack = new DevOpsCdkStack(app, TESTING_STACK_NAME);

    expectCDK(devopsStack).to(haveResource(
        securityGroupResourceType, {
            "SecurityGroupEgress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow all outbound traffic by default",
                    "IpProtocol": "-1"
                }
            ],
        }
    ));
});