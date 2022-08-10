const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const Account = () => {
  return {
    async getAccount(accountNo) {
      var table = process.env.ACCOUNTS_TABLE_NAME || "bo.accounts";

      const docClient = new AWS.DynamoDB.DocumentClient();

      let params = {
        TableName: table,
        IndexName: `${table}.idx_accountNo`,
        KeyConditionExpression: "accountNo = :accountNoVal",
        ExpressionAttributeValues: {
          ":accountNoVal": accountNo,
        },
        // ProjectionExpression: 'accountID,userID,accountNo,IbID',
      };

      try {
        const data = await docClient.query(params).promise();
        console.log(data, "<<< Success");
        return data.Items[0];
      } catch (error) {
        console.error(error, "<<< Failed");
      }
    },
  };
};
module.exports = Account;
