const { Stack, Duration, CfnOutput } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
const { ApiKeySourceType } = require("aws-cdk-lib/aws-apigateway");
const {
  Table,
  BillingMode,
  AttributeType,
  ProjectionType,
} = require("aws-cdk-lib/aws-dynamodb");
const { RuleTargetInput, Rule, Schedule } = require("aws-cdk-lib/aws-events");
const { LambdaFunction } = require("aws-cdk-lib/aws-events-targets");
const { Bucket } = require("aws-cdk-lib/aws-s3");
const { Vpc } = require("aws-cdk-lib/aws-ec2");
const { LayerVersion } = require("aws-cdk-lib/aws-lambda");
const { ServicePrincipal } = require("aws-cdk-lib/aws-iam");

// console.log(process.env.CDK_DEFAULT_ACCOUNT)
class TransfersStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "TransferApiGatewayAccessLogs");
    const usersTable = Table.fromTableName(this, "UsersTable", "bo.users");
    
    // Weird situation where we do not know the table name :(
    const sessionsTable = Table.fromTableName(this, 'SessionsTable', 'audit.userSessions_JH');

    const accountsTable = Table.fromTableAttributes(this, "AccountsTable", {
      tableName: "bo.accounts",
      globalIndexes: ["bo.accounts.idx_accountNo"],
    });

    const instrumentsTable = Table.fromTableAttributes(
      this,
      "InstrumentsTable",
      {
        tableName: "ref.instruments",
        globalIndexes: ["ref.instruments.symbol-index"],
      }
    );

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

    const basketsTable = new Table(this, "Baskets", {
      tableName: 'bo.transferBaskets',
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
    });

    basketsTable.addGlobalSecondaryIndex({
      indexName: "bo.transferBaskets.userID.index",
      partitionKey: { name: "userID", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const vpc = Vpc.fromLookup(this, "Dev_VPC", {
      vpcId: "vpc-8b1159f0",
      // vpcName: 'Dev_VPC'
    });

    /*
      Authorization
    */
    function setupAuth() {
      
      const authLambda = new lambda.Function(this, "Authenticator", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "authorizer.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        memorySize: 2048,
        timeout: Duration.seconds(20),
      });

      const requestAuthorizer = new apigateway.RequestAuthorizer(this, "bo-authorizer", {
        handler: authLambda,
        identitySources: [apigateway.IdentitySource.header("dw-auth-token")],
        authorizerName: "APIAuthorizer",
      });

      return {authLambda, requestAuthorizer};
    }

    function setupTransfersAPI(authorizer) {
      const layer = LayerVersion.fromLayerVersionArn(
        this,
        "LayerVersion",
        `arn:aws:lambda:us-east-1:956882708938:layer:sumologic-extension-amd64:5`
      );

      const apiLambda = new lambda.Function(this, "APILambda", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "transfers.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        vpc,
        memorySize: 2048,
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
          ACCOUNTS_TABLE_NAME: accountsTable.tableName,
          TRANSFERS_TABLE_NAME: transfersTable.tableName,
          BATCH_TABLE_NAME: batchTable.tableName,
          SUMO_HTTP_ENDPOINT:
            "https://endpoint1.collection.sumologic.com/receiver/v1/http/ZaVnC4dhaV1bG9cEQB2Js6hn1u3ba2PilLD-6sbYqiG04x1fgWOaqw2xGexR6XLGitHTgLOpvcUjahSC3fCU4uq8JTywjctETaSwef7iC2fwqmLPifa8Gw==",
        },
        timeout: Duration.seconds(20),
        layers: [layer],
      });

      const orderProcessorLambda = new lambda.Function(this, "OrderProcessorLambda", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "processor.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        vpc,
        functionName: 'OrderProcessor',
        memorySize: 2048,
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
          ACCOUNTS_TABLE_NAME: accountsTable.tableName,
          TRANSFERS_TABLE_NAME: transfersTable.tableName,
          BATCH_TABLE_NAME: batchTable.tableName,
          SUMO_HTTP_ENDPOINT:
            "https://endpoint1.collection.sumologic.com/receiver/v1/http/ZaVnC4dhaV1bG9cEQB2Js6hn1u3ba2PilLD-6sbYqiG04x1fgWOaqw2xGexR6XLGitHTgLOpvcUjahSC3fCU4uq8JTywjctETaSwef7iC2fwqmLPifa8Gw==",
        },
        timeout: Duration.seconds(60),
        layers: [layer],
      });

      const apiBasketsLambda = new lambda.Function(this, "APIBasketsLambda", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "baskets.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        vpc,
        memorySize: 2048,
        environment: {
          ORDER_PROCESSOR_FUNCTION: orderProcessorLambda.functionName,
          USERS_TABLE_NAME: usersTable.tableName,
          ACCOUNTS_TABLE_NAME: accountsTable.tableName,
          TRANSFERS_TABLE_NAME: transfersTable.tableName,
          BATCH_TABLE_NAME: batchTable.tableName,
          BASKETS_TABLE_NAME: basketsTable.tableName,
          SUMO_HTTP_ENDPOINT:
            "https://endpoint1.collection.sumologic.com/receiver/v1/http/ZaVnC4dhaV1bG9cEQB2Js6hn1u3ba2PilLD-6sbYqiG04x1fgWOaqw2xGexR6XLGitHTgLOpvcUjahSC3fCU4uq8JTywjctETaSwef7iC2fwqmLPifa8Gw==",
        },
        timeout: Duration.seconds(20),
        layers: [layer],
      });

      // Baskets lambda can create queues
      const createQueuePolicy = new iam.PolicyStatement({
        actions: ['sqs:*'],
        resources: ['arn:aws:sqs:us-east-1:*:*'],
        effect: 'Allow',
      });

      const createEventsPolicy = new iam.PolicyStatement({
        actions: ['events:*'],
        resources: ['arn:aws:events:us-east-1:*:*'],
        effect: 'Allow',
      });

      apiBasketsLambda.addToRolePolicy(createQueuePolicy);
      apiBasketsLambda.addToRolePolicy(createEventsPolicy);
      
      orderProcessorLambda.grantInvoke(new ServicePrincipal('events.amazonaws.com'))

      const apiGateway = new apigateway.RestApi(this, "lambda-gateway", {
        restApiName: "BO Lambda",
        description:
          "This is a version of the Back Office APIs backed by lambdas",
        defaultCorsPreflightOptions: {
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'dw-auth-token',
            'dw-client-app-key',
            'X-Api-Key',
          ],
          allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          allowCredentials: true,
          allowOrigins: ['http://localhost:3000', 'https://drivewealth.stoplight.io'],
        },    
        deployOptions: {
          accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
          accessLogFormat: apigateway.AccessLogFormat.custom(
            '{"requestTime":"$context.requestTime","requestId":"$context.requestId","httpMethod":"$context.httpMethod","path":"$context.path","resourcePath":"$context.resourcePath","status":$context.status,"responseLatency":$context.responseLatency}'
          ),
        },
        apiKeySourceType: ApiKeySourceType.AUTHORIZER,
      });

      // Transfers
      const apiIntegration = new apigateway.LambdaIntegration(apiLambda, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });

      const transfers = apiGateway.root.addResource("transfers");

      transfers.addMethod("POST", apiIntegration, {
        authorizer,
      });

      // Baskets
      const apiBasketsIntegration = new apigateway.LambdaIntegration(apiBasketsLambda, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });

      const baskets = apiGateway.root.addResource("baskets");
      const basket = baskets.addResource("{basketID}");

      baskets.addMethod("POST", apiBasketsIntegration, {
        authorizer,
      });

      baskets.addMethod("GET", apiBasketsIntegration, {
        authorizer,
      });

      basket.addMethod("GET", apiBasketsIntegration, {
        authorizer,
      })

      basket.addMethod("DELETE", apiBasketsIntegration, {
        authorizer,
      })

      return {
        apiLambda,
        apiBasketsLambda,
        gatewayUrl: apiGateway.url,
      };
    }

    const {authLambda, requestAuthorizer} = setupAuth.apply(this);
    const { apiLambda, apiBasketsLambda, gatewayUrl } = setupTransfersAPI.apply(this, [requestAuthorizer]);

    // Permissions
    // Reads
    usersTable.grantReadData(apiLambda);
    accountsTable.grantReadData(apiLambda);
    instrumentsTable.grantReadData(apiLambda);
    basketsTable.grantReadData(apiLambda);

    usersTable.grantReadData(authLambda);
    sessionsTable.grantReadData(authLambda);    

    // Reads + Writes
    transfersTable.grantReadWriteData(apiLambda);
    batchTable.grantReadWriteData(apiLambda);
    basketsTable.grantReadWriteData(apiBasketsLambda);
    
    // const batchesBucket = Bucket.fromBucketName(this, 'BatchBucket', 'com.drivewealth.backoffice.batchtranservice.s3bucket')
    const batchesBucket = Bucket.fromBucketName(
      this,
      "BatchBucket",
      "dev.drivewealth.batch"
    );

    batchesBucket.grantReadWrite(apiLambda);

    new CfnOutput(this, "Gateway Url", {
      value: gatewayUrl,
    });
  }
}

module.exports = { TransfersStack };
