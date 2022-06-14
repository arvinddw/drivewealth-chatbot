exports.handler = async function(event, context, callback) {
    console.log('Method ARN: ' + event.methodArn);
    if (!event.headers) return callback("No headers found in this request");
    if(event.path ==="/back-office/webhooks/payments/mt_pmts_03d0be0d-a881-423e-811f-e190c942047f"){
      const signature = Object.keys(event.headers).find(key => key === "X-Signature");
      if (!signature || !event.multiValueHeaders["X-Signature"]) {
        
        throw new Error("X-Signature is missing");
      }
      
      callback(null,{
      principalId: event.headers['X-Signature'],
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{ // allow all HTTP methods on all resources
          Action: 'execute-api:Invoke',
          Effect: 'Allow', 
          Resource: `arn:aws:execute-api:us-east-1:*:${event.requestContext.apiId}/*`
        }]
      },
      usageIdentifierKey: event.headers['X-Signature'] // the value of header x-signature is used as the API key value
    });
    }
    const appKeyHeader = Object.keys(event.headers).find(key => key.toLowerCase() === "dw-client-app-key");
    if (!appKeyHeader || !event.headers[appKeyHeader]) {
      callback(new Error("dw-client-app-key is missing"));
    }
    callback(null, {
      principalId: event.headers[appKeyHeader],
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{ // allow all HTTP methods on all resources
          Action: 'execute-api:Invoke',
          Effect: 'Allow', 
          Resource: `arn:aws:execute-api:us-east-1:*:${event.requestContext.apiId}/*`
        }]
      },
      usageIdentifierKey: event.headers[appKeyHeader] // the value of header dw-client-app-key is used as the API key value
    });
  }