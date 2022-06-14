const { Stack, Duration, CfnOutput } = require("aws-cdk-lib");
const sns = require("aws-cdk-lib/aws-sns");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
const { ApiKeySourceType } = require("aws-cdk-lib/aws-apigateway");
const { ArnPrincipal, ServicePrincipal, Role } = require("aws-cdk-lib/aws-iam");
const { Table, BillingMode, AttributeType } = require("aws-cdk-lib/aws-dynamodb");
const { Queue } = require("aws-cdk-lib/aws-sqs");
const { Subscription } = require("aws-cdk-lib/aws-sns");
const { SqsSubscription } = require("aws-cdk-lib/aws-sns-subscriptions");
const { SqsEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const { RuleTargetInput, Rule, Schedule } = require("aws-cdk-lib/aws-events");
const { LambdaFunction } = require("aws-cdk-lib/aws-events-targets");

class DwchatbotStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "ThrottleApiGatewayAccessLogs");
    const userTable = Table.fromTableName(this, "UserTable", "bo.users");

    const rewardsTable = new Table(this, "Rewards", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey:  { name: "userID", type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED
    });


    function setupAuth() {
      /*
      Aurhorization
    */

      // const authLambda = lambda.Function.fromFunctionName(
      //   this,
      //   "apikey-authorizer",
      //   "Authorizer"
      // );

      const authLambda = new lambda.Function(this, "apikey-authorizer", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "authorizer.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        memorySize: 2048,
        timeout: Duration.seconds(20),
      });
    }

    function setupRewardEvents() {
      const rewardsTopic = new sns.Topic(this, "rewards", {
        // contentBasedDeduplication: true,
        displayName: "All API Events",
        topicName: "rewardsTopic",
      });

      const rewardsQueue = new Queue(this, "RewardsQueue");
      const sub = new SqsSubscription(rewardsQueue);
      rewardsTopic.addSubscription(sub);

      return {
        rewardsTopic,
        rewardsQueue,
      };
    }

    function setupRewardsProcessing(rewardsQueue, rewardsTable) {
      const rewardsProcessorLambda = new lambda.Function(
        this,
        "rewards-processor",
        {
          runtime: lambda.Runtime.NODEJS_16_X,
          handler: "batchorderprocessor.handler",
          code: lambda.Code.fromAsset("lambda-fns"),
          memorySize: 2048,
          timeout: Duration.seconds(20),
          environment: {
            // REWARDS_QUEUE_URL: rewardsQueue.queueUrl,
            REWARDS_TABLE_NAME: rewardsTable.tableName
          },
        }
      );
      
      // Trigger Lambda
      // const eventSource = new SqsEventSource(rewardsQueue, {
        // batchSize: 1000,
        // maxBatchingWindow: Duration.seconds(30),
      // });

      // rewardsProcessorLambda.addEventSource(eventSource);

      // Trigger Processor based on time

      const timeframe = `1MIN`;
      const lambdaEvent = RuleTargetInput.fromObject({ timeframe });

      const target = new LambdaFunction(rewardsProcessorLambda, {
        event: lambdaEvent,
      });

      new Rule(this, `LambdaProcessorRule${timeframe}`, {
        eventPattern: {
          source: [`tech.drivewealth.invest.scheduler.rewards.${timeframe}`],
        },
        targets: [target],
        schedule: Schedule.rate(Duration.minutes(1)),
      });
      
      return {rewardsProcessorLambda}
    }

    function setupAPI(rewardsTopicArn, userTableName) {
      const apiLambda = new lambda.Function(this, "APILambda", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "events.handler",
        code: lambda.Code.fromAsset("lambda-fns"),
        memorySize: 2048,
        environment: {
          REWARDS_TOPIC_ARN: rewardsTopicArn,
          USER_TABLE_NAME: userTableName,
          REWARDS_TABLE_NAME: rewardsTable.tableName
        },
        timeout: Duration.seconds(20),
      });

      const apiGateway = new apigateway.RestApi(this, "throttled-gateway", {
        restApiName: "Throttled API",
        description:
          "This is a version of the Back Office APIs that induces throttling.",
        deployOptions: {
          accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
          accessLogFormat: apigateway.AccessLogFormat.custom(
            '{"requestTime":"$context.requestTime","requestId":"$context.requestId","httpMethod":"$context.httpMethod","path":"$context.path","resourcePath":"$context.resourcePath","status":$context.status,"responseLatency":$context.responseLatency}'
          ),
        },
        apiKeySourceType: ApiKeySourceType.AUTHORIZER,
      });

      // const auth = new apigateway.RequestAuthorizer(this, "bo-authorizer", {
      //   handler: authLambda,
      //   identitySources: [apigateway.IdentitySource.context("appId")],
      //   // identitySources: [],
      //   authorizerName: "apikey-authorizer",
      //   resultsCacheTtl: Duration.seconds(0),
      // });

      const apiIntegration = new apigateway.LambdaIntegration(apiLambda, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });

      const foo = apiGateway.root.addResource("foo");
      foo.addMethod("POST", apiIntegration, {
        // authorizer: auth,
      });

      return {
        apiLambda,
        gatewayUrl: apiGateway.url,
      };
    }

    const { rewardsTopic, rewardsQueue } = setupRewardEvents.apply(this);

    const { rewardsProcessorLambda } = setupRewardsProcessing.apply(this, [rewardsQueue, rewardsTable]);

    const { apiLambda, gatewayUrl } = setupAPI.apply(this, [
      rewardsTopic.topicArn,
      userTable.tableName,
    ]);

    // Permissions

    rewardsTopic.grantPublish(apiLambda);
    
    userTable.grantReadData(apiLambda);
    userTable.grantReadData(rewardsProcessorLambda);

    rewardsTable.grantReadWriteData(apiLambda);
    rewardsTable.grantReadWriteData(rewardsProcessorLambda);
    rewardsQueue.grantConsumeMessages(rewardsProcessorLambda);

    new CfnOutput(this, "Rewards SNS Topic ARN", {
      value: rewardsTopic.topicArn,
    });

    new CfnOutput(this, "Rewards Queue Url", {
      value: rewardsQueue.queueUrl,
    });

    new CfnOutput(this, "Gateway Url", {
      value: gatewayUrl,
    });
  }
}

module.exports = { DwchatbotStack };
