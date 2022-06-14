const AWS = require("aws-sdk");
const moment = require("moment");
const axios = require("axios");
const numeral = require("numeral");
const _ = require("lodash");

AWS.config.update({ region: "us-east-1" });

const getSessionToken = async (userID) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const { Item } = await docClient
    .get({
      TableName: "bo.users",
      Key: {
        userID,
      },
    })
    .promise();
  // console.log(Item)
  return Item.authToken;
};

exports.handler = async (event, context) => {
  console.log(moment().format(), "<<< Processor Invoked");
  const TableName = process.env.REWARDS_TABLE_NAME;
  const docClient = new AWS.DynamoDB.DocumentClient();

  const ADMIN_USER_ID = "21c4ee2e-d74f-4924-9a31-9de5a442f5e7";
  const DW_CLIENT_APP_KEY = "7020ce32-0e1c-32cc-786c-253c94b11436";
  const DW_AUTH_TOKEN = await getSessionToken(ADMIN_USER_ID);

  const { Items } = await docClient
    .scan({
      TableName,
      FilterExpression: `#status = :statusVal`,
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":statusVal": "CREATED",
      },
    })
    .promise();

  const grouped = _.values(Items).reduce((acc, reward) => {
    if (!acc[reward.symbol]) {
      acc[reward.symbol] = { amount: 0, rewards: [] };
    }
    let newAmount = numeral(acc[reward.symbol].amount)
      .add(reward.amount)
      .value();
    acc[reward.symbol].amount = newAmount;
    acc[reward.symbol].rewards.push(reward);
    return acc;
  }, {});

  console.log(grouped, "Grouped orders");

  // https://BO-API-BoRestApiEL-1BIO2JWBQ5WEM-589570486.us-east-1.elb.amazonaws.com
  for (symbol of Object.keys(grouped)) {
    const { data } = await axios.post(
      "https://bo-api.drivewealth.tech/back-office/orders",
      {
        accountNo: "DWBG000083", //  John Alphonse Acct No
        orderType: "MARKET",
        symbol,
        side: "BUY",
        quantity: grouped[symbol].amount,
      },
      {
        headers: {
          "dw-client-app-key": DW_CLIENT_APP_KEY,
          "dw-auth-token": DW_AUTH_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('Order placed', data.orderID)
    const updateResults = await Promise.all(
      grouped[symbol].rewards.map((r) => {
        // console.log(r, '<<< Reward')
        console.log("Updating orders", r.id, data.orderID);
        return docClient
          .update({
            TableName: "DwchatbotStack-Rewards6B646C61-1YKLLEQS9AJZ",
            Key: {
              id: r.id,
              userID: ADMIN_USER_ID,
            },
            UpdateExpression: `set #status = :statusVal, #orderID = :orderIDVal, #orderNo = :orderNoVal`,
            ExpressionAttributeValues: {
              ":statusVal": "ORDER_PLACED",
              ":orderIDVal": data.orderID,
              ":orderNoVal": data.orderNo,
            },
            ExpressionAttributeNames: {
              "#status": "status",
              "#orderID": "orderID",
              "#orderNo": "orderNo",
            },
          })
          .promise();
      })
    );

    console.log(updateResults, "<<< updateResults");
  }
};
