const { v4: uuid } = require("uuid");

const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const table = process.env.BASKETS_TABLE || "bo.transferBaskets";

const Basket = () => {
  return {
    async createBasket({ userID, clientAppId, timeout, name, description }) {
      try {
        const id = uuid();
        
        const docClient = new AWS.DynamoDB.DocumentClient();

        let params = {
          TableName: table,
          Item: {
            id,
            userID,
            clientAppId,
            timeout,
            name,
            description,
          },
        };

        await docClient.put(params).promise();
        return { basketID: id };
      } catch (error) {
        console.error(error, "<<< Failed to create basket");
        return null;
      }
    },
    async getBasket(basketID) {
      try {
        const docClient = new AWS.DynamoDB.DocumentClient();

        let params = {
          TableName: table,
          KeyConditionExpression: "id = :basketIDVal",
          ExpressionAttributeValues: {
            ":basketIDVal": basketID,
          },
        };

        // console.log(params);
        const data = await docClient.query(params).promise();
        if (data.Items.length) {
          return data.Items[0];
        }
        return null
      } catch (error) {
        console.error(error, "<<< Failed to get basket", basketID);
        return null;
      }
    },
    async listUserBaskets(userID) {
      try {
        const docClient = new AWS.DynamoDB.DocumentClient();

        let params = {
          TableName: table,
          IndexName: `${table}.userID.index`,
          // IndexName: `userID-index`,
          KeyConditionExpression: "userID = :userIDVal",
          // FilterExpression: "createdAt > :createdWithinVal",
          // ProjectionExpression: "equity, #timestamp, timeframe",
          // ExpressionAttributeNames: {
          //   "#timestamp": "timestamp",
          // },
          ExpressionAttributeValues: {
            ":userIDVal": userID,
          },
        };

        console.log(params);
        const data = await docClient.query(params).promise();
        return data.Items
      } catch (error) {
        console.error(error, "<<< Failed to get baskets for ", userID);
        return null;
      }
    },
    async deleteBasket(basketID) {
      try {
        const docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
          TableName: table,
          Key: { id: basketID },
        };
        console.log('Deleting basket', params);
        await docClient.delete(params).promise();
      } catch (error) {
        console.error(error, "<<< Failed to delete the basket", basketID);
        return null;
      }
    },
  };
};
module.exports = Basket;
