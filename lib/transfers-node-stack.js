const { Stack, Duration, CfnOutput } = require("aws-cdk-lib");
const sns = require("aws-cdk-lib/aws-sns");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
const { ApiKeySourceType } = require("aws-cdk-lib/aws-apigateway");
const {
  Table,
  BillingMode,
  AttributeType,
} = require("aws-cdk-lib/aws-dynamodb");
const { RuleTargetInput, Rule, Schedule } = require("aws-cdk-lib/aws-events");
const { LambdaFunction } = require("aws-cdk-lib/aws-events-targets");
const { Bucket } = require("aws-cdk-lib/aws-s3");

class TransfersStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "TransferApiGatewayAccessLogs");
    const userTable = Table.fromTableName(this, "UserTable", "bo.users");
    const batchTable = Table.fromTableName(
      this,
      "BatchTable",
      "bo.batchTransactions"
    );

    const transfersTable = new Table(this, "Transfers", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "userID", type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
    });

    function setupAPI(userTableName) {
      const apiLambda = new lambda.Function(this, "APILambda", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "transfers.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        memorySize: 2048,
        environment: {
          USER_TABLE_NAME: userTableName,
          TRANSFERS_TABLE_NAME: transfersTable.tableName,
          BATCH_TABLE_NAME: batchTable.tableName,
        },
        timeout: Duration.seconds(20),
      });

      const apiGateway = new apigateway.RestApi(this, "lambda-gateway", {
        restApiName: "BO Lambda",
        description:
          "This is a version of the Back Office APIs backed by lambdas",
        deployOptions: {
          accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
          accessLogFormat: apigateway.AccessLogFormat.custom(
            '{"requestTime":"$context.requestTime","requestId":"$context.requestId","httpMethod":"$context.httpMethod","path":"$context.path","resourcePath":"$context.resourcePath","status":$context.status,"responseLatency":$context.responseLatency}'
          ),
        },
        apiKeySourceType: ApiKeySourceType.AUTHORIZER,
      });

      const apiIntegration = new apigateway.LambdaIntegration(apiLambda, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });

      const transfers = apiGateway.root.addResource("transfers");
      transfers.addMethod("POST", apiIntegration, {
        // authorizer: auth,
      });

      return {
        apiLambda,
        gatewayUrl: apiGateway.url,
      };
    }

    const { apiLambda, gatewayUrl } = setupAPI.apply(this, [
      userTable.tableName,
    ]);

    // Permissions
    userTable.grantReadData(apiLambda);
    transfersTable.grantReadWriteData(apiLambda);
    batchTable.grantReadWriteData(apiLambda);


    // const batchesBucket = Bucket.fromBucketName(this, 'BatchBucket', 'com.drivewealth.backoffice.batchtranservice.s3bucket')
    const batchesBucket = Bucket.fromBucketName(this, 'BatchBucket', 'dev.drivewealth.batch')
    
    batchesBucket.grantReadWrite(apiLambda);

    new CfnOutput(this, "Gateway Url", {
      value: gatewayUrl,
    });
  }
}

module.exports = { TransfersStack };
