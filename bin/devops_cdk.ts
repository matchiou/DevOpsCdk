#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {DevOpsCdkStack} from '../lib/devops_cdk-stack';

const app = new cdk.App();
new DevOpsCdkStack(app, 'DevOpsCdkStack');
