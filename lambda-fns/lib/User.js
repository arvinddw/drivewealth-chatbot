const AWS = require("aws-sdk");
const moment = require('moment')

AWS.config.update({ region: "us-east-1" });

function getYearCode(year) {
  var yearCode = "X";
  switch (year) {
    case 2013:
      yearCode = "A";
      break;
    case 2014:
      yearCode = "B";
      break;
    case 2015:
      yearCode = "C";
      break;
    case 2016:
      yearCode = "D";
      break;
    case 2017:
      yearCode = "E";
      break;
    case 2018:
      yearCode = "F";
      break;
    case 2019:
      yearCode = "G";
      break;
    case 2020:
      yearCode = "H";
      break;
    case 2021:
      yearCode = "I";
      break;
    case 2022:
      yearCode = "J";
      break;
    case 2023:
      yearCode = "K";
      break;
    case 2024:
      yearCode = "L";
      break;
    default:
      yearCode = "X";
      break;
  }

  return yearCode;
}

function getMonthCode(month) {
  var monthCode = "X";
  switch (month) {
    case 1:
      monthCode = "A";
      break;
    case 2:
      monthCode = "B";
      break;
    case 3:
      monthCode = "C";
      break;
    case 4:
      monthCode = "D";
      break;
    case 5:
      monthCode = "E";
      break;
    case 6:
      monthCode = "F";
      break;
    case 7:
      monthCode = "G";
      break;
    case 8:
      monthCode = "H";
      break;
    case 9:
      monthCode = "I";
      break;
    case 10:
      monthCode = "J";
      break;
    case 11:
      monthCode = "K";
      break;
    case 12:
      monthCode = "L";
      break;
    default:
      monthCode = "X";
      break;
  }

  return monthCode;
}

const User = () => {
  return {
    async getUser(userID) {
      var table = process.env.USER_TABLE_NAME || "bo.users";

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
        // console.log(data, "<<< Success");
        return data.Items[0];
      } catch (error) {
        console.error(error, "<<< Failed");
      }
    },
    async getSession(key) {
      const tablePrefix = process.env.AUDIT_USER_SESSIONS_ || "audit.userSessions_";
      
      const [userID, date, millesconds] = key.split('.')
      const loginWhen = `${date}.${millesconds}`

      const loginWhenObj = moment(date)
      const docClient = new AWS.DynamoDB.DocumentClient();

      const table = `${tablePrefix}${getYearCode(loginWhenObj.year())}${getMonthCode(loginWhenObj.month() + 1)}`

      let params = {
        TableName: table,
        KeyConditionExpression: "userID = :userIDVal and loginWhen = :loginWhen",
        ExpressionAttributeValues: {
          ":userIDVal": userID,
          ":loginWhen": loginWhen,
        },
      };
      const data = await docClient.query(params).promise();

      if (!data.Items.length) {
        return null;
      }
      const session = data.Items[0];
      const hasSessionExpired = moment(session.loginWhen).add(12, 'hours').isBefore(Date.now());
      
      if (hasSessionExpired) {
        return null;
      }

      // console.log(data, "<<< Success");
      return data.Items[0];
    },
  };
};

module.exports = User;
