
const AWS = require("aws-sdk");
const moment = require("moment");
// const axios = require("axios");
const { v4: uuid } = require("uuid");
const AMQClient = require('./amq')

const Ajv = require("ajv");
const TransferSchema = require("./schema/transfers.json");

AWS.config.update({ region: "us-east-1" });

const getTimestampForId = () =>
  moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

const getRequestKey = () => `share_transfer-${getTimestampForId()}`;
const getResponseKey = () => `share_transfer-${getTimestampForId()}-response`;

const BATCH_TRAN_SVC_BUCKET = "dev.drivewealth.batch";

// share_transfer-2022-06-29T18:41:19.556Z-request
// com.drivewealth.backoffice.batchtranservice.s3bucket

const s3 = new AWS.S3();

const ajv = new Ajv({ strict: false, allErrors: true });
AWS.config.update({ region: "us-east-1" });

const validate = ajv
  .addSchema(TransferSchema)
  .getSchema("#/components/schemas/TransferRequest");

const connectOptions = {
  host: "10.175.1.60",
  port: 61616,
  connectHeaders: {
    host: "",
    login: "admin",
    passcode: "12Mon3yz",
    "heart-beat": "5000,5000",
  },
};

const amqClient = AMQClient()

const getUser = async (userID) => {
  var table = process.env.USER_TABLE_NAME || 'bo.users';

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

// Mimics Batch New
exports.handler = async (event, context) => {

  await amqClient.connect(connectOptions)

  // Read user
    const user = await getUser("21c4ee2e-d74f-4924-9a31-9de5a442f5e7");
    console.log(user, "<<< User");
  
  // const validationResult = await validate(JSON.parse(event.body));

  // if (!validationResult) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify(validate.errors),
  //     isBase64Encoded: false,
  //   };
  // }

  const docClient = new AWS.DynamoDB.DocumentClient();

  const requestKey = getRequestKey();
  console.log("Request key >", requestKey);
  const requestObject = await s3
    .putObject({
      Bucket: BATCH_TRAN_SVC_BUCKET,
      Key: requestKey,
      Body: event.body,
      ContentType: "application/json",
    })
    .promise();

  console.log('Created request object', requestObject);

  const responseKey = getResponseKey();
  console.log("Request key >", requestKey);
  // const responseObject = await s3
  //   .putObject({
  //     Bucket: BATCH_TRAN_SVC_BUCKET,
  //     Key: responseKey,
  //     Body: event.body,
  //     ContentType: "application/json",
  //   })
  //   .promise();

  const requestS3Link = await s3.getSignedUrl("getObject", {
    Bucket: BATCH_TRAN_SVC_BUCKET,
    // ContentType: "application/json",
    Key: requestKey,
  });

  console.log('Created requestS3Link', requestS3Link)

  // const responseKey = getResponseKey()
  // console.log('Response key >', responseKey)
  const responseS3Link = await s3.getSignedUrl("putObject", {
    Bucket: BATCH_TRAN_SVC_BUCKET,
    ContentType: "application/json",
    Key: responseKey,
  });

  console.log('Created responseS3Link', responseS3Link)

  // console.log('uploading', event.body)
  // try {
  //   const resp = await axios.post(requestS3Link, event.body, {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   console.log(resp, 'Axios post response');

  // } catch (e) {
  //   console.log(e.response)
  // }

  const batchID = uuid();
  console.log('>> Batch ID', batchID)

  const doc = await docClient
    .put({
      TableName: process.env.BATCH_TABLE_NAME || "bo.batchTransactions",
      Item: {
        batchID,
        userID: "21c4ee2e-d74f-4924-9a31-9de5a442f5e7",
        parentIbID: "80f9b672-120d-4b73-9cc9-42fb3262c4b9",
        nItemsInBatch: 0,
        nItemsProcessed: 0,
        batchStatus: "NOT_STARTED",
        ipAddress: "181.205.129.170, 130.176.191.6",
        batchType: "SHARE_TRANSFER",
        requestS3Link,
        responseS3Link,
        createdWhen: getTimestampForId(),
      },
    })
    .promise();

  console.log('Doc created', doc);
  //   console.log(validationResult, validate.errors)
  //   for (const err of validationResult.errors) {
  //     switch (err.keyword) {
  //       case "maximum":
  //         console.log(err.limit)
  //         break
  //       case "pattern":
  //         console.log(err.pattern)
  //         break
  //       // ...
  //     }
  //   }

  //   await createReward({...JSON.parse(event.body), userID: user.userID, status: 'CREATED'});
  
  const sendHeaders = {
    'destination': 'dw.bo.request',
    'content-type': 'application/json'
  };

  const sentResp = await amqClient.sendMessage(sendHeaders, {
    mt: '4540',
    batchID,
    cognitoUser: null,
    sessionKey: user.sessionKey,
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "All good",
      requestObject,
      sentResp,
    }),
    isBase64Encoded: false,
  };
};





  // console.log(fromUser, "<<< User");


  // const queue = await amqClient.connect(user)
  
  


  
  // const docClient = new AWS.DynamoDB.DocumentClient();

  // const requestKey = getRequestKey();
  // console.log("Request key >", requestKey);
  // const requestObject = await s3
  //   .putObject({
  //     Bucket: BATCH_TRAN_SVC_BUCKET,
  //     Key: requestKey,
  //     Body: event.body,
  //     ContentType: "application/json",
  //   })
  //   .promise();

  // console.log('Created request object', requestObject);

  // const responseKey = getResponseKey();
  // console.log("Request key >", requestKey);
  // // const responseObject = await s3
  // //   .putObject({
  // //     Bucket: BATCH_TRAN_SVC_BUCKET,
  // //     Key: responseKey,
  // //     Body: event.body,
  // //     ContentType: "application/json",
  // //   })
  // //   .promise();

  // const requestS3Link = await s3.getSignedUrl("getObject", {
  //   Bucket: BATCH_TRAN_SVC_BUCKET,
  //   // ContentType: "application/json",
  //   Key: requestKey,
  // });

  // console.log('Created requestS3Link', requestS3Link)

  // // const responseKey = getResponseKey()
  // // console.log('Response key >', responseKey)
  // const responseS3Link = await s3.getSignedUrl("putObject", {
  //   Bucket: BATCH_TRAN_SVC_BUCKET,
  //   ContentType: "application/json",
  //   Key: responseKey,
  // });

  // console.log('Created responseS3Link', responseS3Link)

  // // console.log('uploading', event.body)
  // // try {
  // //   const resp = await axios.post(requestS3Link, event.body, {
  // //     headers: {
  // //       "Content-Type": "application/json",
  // //     },
  // //   });
  // //   console.log(resp, 'Axios post response');

  // // } catch (e) {
  // //   console.log(e.response)
  // // }

  // const batchID = uuid();
  // console.log('>> Batch ID', batchID)

  // const doc = await docClient
  //   .put({
  //     TableName: process.env.BATCH_TABLE_NAME || "bo.batchTransactions",
  //     Item: {
  //       batchID,
  //       userID: "21c4ee2e-d74f-4924-9a31-9de5a442f5e7",
  //       parentIbID: "80f9b672-120d-4b73-9cc9-42fb3262c4b9",
  //       nItemsInBatch: 0,
  //       nItemsProcessed: 0,
  //       batchStatus: "NOT_STARTED",
  //       ipAddress: "181.205.129.170, 130.176.191.6",
  //       batchType: "SHARE_TRANSFER",
  //       requestS3Link,
  //       responseS3Link,
  //       createdWhen: getTimestampForId(),
  //     },
  //   })
  //   .promise();

  // console.log('Doc created', doc);
  // //   console.log(validationResult, validate.errors)
  // //   for (const err of validationResult.errors) {
  // //     switch (err.keyword) {
  // //       case "maximum":
  // //         console.log(err.limit)
  // //         break
  // //       case "pattern":
  // //         console.log(err.pattern)
  // //         break
  // //       // ...
  // //     }
  // //   }

  // //   await createReward({...JSON.parse(event.body), userID: user.userID, status: 'CREATED'});
  
  // const sendHeaders = {
  //   'destination': 'dw.bo.request',
  //   'content-type': 'application/json'
  // };

  // const sentResp = await amqClient.sendMessage(sendHeaders, {
  //   mt: '4540',
  //   batchID,
  //   cognitoUser: null,
  //   sessionKey: user.sessionKey,
  // })

  // return {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: "All good",
  //     requestObject,
  //     sentResp,
  //   }),
  //   isBase64Encoded: false,
  // };