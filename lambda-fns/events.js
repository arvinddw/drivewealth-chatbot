const AWS = require("aws-sdk");
const moment = require("moment");
const { v4: uuid } = require("uuid");

AWS.config.update({ region: "us-east-1" });

const getUser = async (userID) => {
  var table = process.env.USER_TABLE_NAME;

  const docClient = new AWS.DynamoDB.DocumentClient();

  let params = {
    TableName: table,
    KeyConditionExpression: "userID = :userIDVal",
    ExpressionAttributeValues: {
      ":userIDVal": userID,
    },
  };

  try {
    const data = await docClient.query(params).promise();
    console.log(data, "<<< Success");
    return data.Items[0];
  } catch (error) {
    console.error(error, "<<< Failed");
  }
};

const publishMessage = async (messageBody) => {
  var sns = new AWS.SNS();
  var params = {
    Message: messageBody,
    // MessageDeduplicationId: JSON.parse(event.body).id,
    // MessageGroupId: "group1",
    TopicArn: process.env.REWARDS_TOPIC_ARN,
  };

  // Save reward

  const msgResp = await sns.publish(params).promise();
  console.log("SNS response", msgResp);
  console.log("Published to SNS", params);
};

const createReward = async (reward) => {
  const table = process.env.REWARDS_TABLE_NAME;
  const docClient = new AWS.DynamoDB.DocumentClient();

  const PARTNER_ACCOUNT_NUMBER = "100000";

  const params = {
    TableName: table,
    Item: {
      id: `${PARTNER_ACCOUNT_NUMBER}-${uuid()}`,
      ...reward,
      createdAt: moment().unix(),
    },
  };

  let doc = await docClient.put(params).promise();
  console.log(doc, "<<<< Created Reward");
};

exports.handler = async (event, context) => {
  // Read user
  const user = await getUser("21c4ee2e-d74f-4924-9a31-9de5a442f5e7");
  console.log(user, "<<< User");

  await createReward({...JSON.parse(event.body), userID: user.userID, status: 'CREATED'});

  // await publishMessage(event.body)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "All good",
      user,
    }),
    isBase64Encoded: false,
  };
};
