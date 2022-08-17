module.exports = {
  DEFAULT_API_RESPONSE: {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "https://drivewealth.stoplight.io",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify({}),
    isBase64Encoded: false,
  },
};
