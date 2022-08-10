const User = require("./lib/User");

const { getSession } = User();

const appKeyHeader = 'dw-client-app-key'
const authTokenHeader = 'dw-auth-token'

exports.handler = async function (event, context, callback) {
  console.log("Method ARN: " + event.methodArn);

  if (!event.headers) {
    console.log(`[BadRequest] No headers in request`);
    return callback('Unauthorized')
  }

  if (!event.headers[appKeyHeader]) {
    console.log(`[BadRequest] ${appKeyHeader} is missing`);
    return callback('Unauthorized');
  }

  // Authorization
  const authToken = event.headers[authTokenHeader];
  if (!authToken) {
    console.log(`[BadRequest] ${authTokenHeader} is missing`)
    return callback('Unauthorized');
  }
    
  
  try {
    const session = await getSession(authToken);
    console.log('Session', session);
    
    if (!session) {
      console.log("[BadRequest] The authtoken provided is expired or invalid");
      return callback('Unauthorized')
    }

    return callback(null, {
      principalId: event.headers[appKeyHeader],
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            // allow all HTTP methods on all resources
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: `arn:aws:execute-api:us-east-1:*:${event.requestContext.apiId}/*`,
          },
        ],
      },
      context: {
        ...session,
      },
      usageIdentifierKey: event.headers[appKeyHeader], // the value of header dw-client-app-key is used as the API key value,
    });
  } catch (e) {
    console.log(e)
    return callback("Error: Internal error");
  }
};
