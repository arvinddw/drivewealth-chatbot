const { Construct } = require('aws-cdk-lib');
const core = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const s3 = require("@aws-cdk/aws-s3");

class DWChatbotService extends Construct {
  constructor(scope, id) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "DWChatbotStore");

    const handler = new lambda.Function(this, "DWChatbotHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "invest.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    bucket.grantReadWrite(handler);

    const api = new apigateway.RestApi(this, "invest-api", {
      restApiName: "Invest Service",
      description: "This service serves invest."
    });

    const getInvestIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("GET", getInvestIntegration); // GET /
  }
}

module.exports = { DWChatbotService }