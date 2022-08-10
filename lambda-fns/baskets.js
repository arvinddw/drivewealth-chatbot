const AWS = require("aws-sdk");
// const axios = require("axios");
const { v4: uuid } = require("uuid");

const Ajv = require("ajv");
const TransferSchema = require("./schema/baskets.json");
const Basket = require("./lib/Basket");

AWS.config.update({ region: "us-east-1" });
const ajv = new Ajv({ strict: false, allErrors: true });
const schema = ajv.addSchema(TransferSchema);

const { createBasket, listUserBaskets } = Basket();
// const { getAccount } = Account();

const cwevents = new AWS.CloudWatchEvents();

const createOrUpdateScheduler = async ({ basketID, name, timeout }) => {
  const uniqueBasketName = `BK-${name}-${basketID}`;
  const ruleName = `RL-${uniqueBasketName}`;

  await cwevents
    .putRule({
      Name: ruleName,
      ScheduleExpression: `rate(${timeout} minutes)`,
    })
    .promise();

  await cwevents
    .putTargets({
      Rule: ruleName,
      Targets: [
        {
          Id: `PR${basketID}`,
          Arn: "arn:aws:lambda:us-east-1:080513178138:function:OrderProcessor",
          Input: JSON.stringify({
            timeout,
            basketID,
            uniqueBasketName,
          }),
        },
      ],
    })
    .promise();
  return {
    basketID,
    name: uniqueBasketName,
  };
};

const handleGetBaskets = async (event) => {
  const { userID, principalId } = event.requestContext.authorizer;
  console.log(userID, "<<<<<");
  const baskets = await listUserBaskets(userID);
  console.log(baskets);
  return {
    statusCode: 200,
    body: JSON.stringify(baskets),
    isBase64Encoded: false,
  };
};

const handlePostBaskets = async (event) => {
  const { userID, principalId } = event.requestContext.authorizer;
  const req = JSON.parse(event.body);
  const validateBasketCreate = schema.getSchema(
    "#/components/schemas/BasketCreateRequest"
  );
  const validationResult = validateBasketCreate(req);

  if (!validationResult) {
    return {
      statusCode: 400,
      body: JSON.stringify(validateBasketCreate.errors),
      isBase64Encoded: false,
    };
  }

  console.log("Creating basket record");
  const { basketID } = await createBasket({
    userID,
    clientAppId: principalId,
    ...req,
  });

  console.log("Creating scheduler");
  await createOrUpdateScheduler({
    ...req,
    basketID,
    createdBy: userID,
    clientAppId: principalId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      basket: {
        basketID,
      },
      message: "Basket created/updated",
    }),
    isBase64Encoded: false,
  };
};

exports.handler = async (event, context) => {
  console.log(event, "<<<");
  switch (event.httpMethod) {
    case "GET": {
      return await handleGetBaskets(event);
    }
    case "POST": {
      return await handlePostBaskets(event);
    }
    default: {
      return await handleGetBaskets(event);
    }
  }
};
