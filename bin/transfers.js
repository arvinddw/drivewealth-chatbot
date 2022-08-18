#!/usr/bin/env node

const cdk = require("aws-cdk-lib");
const AWS = require("aws-sdk");
const PropertyParser = require("properties-parser");

const { TransfersStack } = require("../lib/transfer-stack");

AWS.config.update({ region: "us-east-1" });

const app = new cdk.App();
const ec2 = new AWS.EC2();

const getEnvVariables = async () => {
  // Getting the ip-address of AMQ
  const { Tags } = await ec2
    .describeTags({
      Filters: [
        {
          Name: "tag:application",
          Values: ["ActiveMQ"],
        },
      ],
    })
    .promise();
  const instance = await ec2
    .describeInstances({
      DryRun: false,
      InstanceIds: [Tags[0].ResourceId],
    })
    .promise();
  const AMQ_IP_ADDRESS = instance.Reservations[0].Instances[0].PrivateIpAddress;
  return { AMQ_IP_ADDRESS };
};

const setupStack = async () => {
  // Get App config
  // const s3 = new AWS.S3();
  // const configProps = await s3
  //   .getObject({
  //     Bucket: process.env.S3_BUCKET || "dev.drivewealth.applications" || "arvind.dev",
  //     Key: process.env.S3_KEY || "drivewealth-api-bo/com.backoffice.rest.app.properties" || "bo-api/com.backoffice.rest.app.properties",
  //   })
  //   .promise();

  // const config = PropertyParser.parse(configProps.Body.toString("utf-8"));
  

  const { AMQ_IP_ADDRESS } = await getEnvVariables();

  const appEnv = { AMQ_IP_ADDRESS }

  new TransfersStack(app, "NodeAPIStack", {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */

    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    env: { account: "080513178138", region: "us-east-1" },
    appEnv,
    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  });
};

setupStack();
