const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" }); 

const InstrumentCache = () => {
    return {
        async getInstrument (symbol) {
            var table = process.env.INSTUMENT_TABLE || 'ref.instruments';          
            const docClient = new AWS.DynamoDB.DocumentClient();
          
            let params = {
              TableName: table,
              IndexName: `${table}.symbol-index`,
              KeyConditionExpression: "symbol = :symbolVal",
              ExpressionAttributeValues: {
                ":symbolVal": symbol,
              },
            };
          
            try {
              const data = await docClient.query(params).promise();
              if (data.Items.length < 1) {
                console.log(`Symbol not found "${symbol}"`);
                return null
              }
              return data.Items[0];
            } catch (error) {
              console.error(error, "<<< Failed getting Instrument with symbol", symbol);
              return null;
            }
          }
    }
}
module.exports = InstrumentCache;
