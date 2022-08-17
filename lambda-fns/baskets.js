const AWS = require("aws-sdk");
// const axios = require("axios");
const { v4: uuid } = require("uuid");

const Ajv = require("ajv");
const TransferSchema = require("./schema/baskets.json");
const Basket = require("./lib/Basket");
const { DEFAULT_API_RESPONSE } = require("./lib/util");

AWS.config.update({ region: "us-east-1" });
const ajv = new Ajv({ strict: false, allErrors: true });
const schema = ajv.addSchema(TransferSchema);

const { createBasket, getBasket, deleteBasket, listUserBaskets } = Basket();
const cwevents = new AWS.CloudWatchEvents();

const createOrUpdateScheduler = async ({ basketID, timeout }) => {
  const uniqueBasketName = `BK-${basketID}`;
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

const deleteScheduler = async ({ basketID }) => {
  const uniqueBasketName = `BK-${basketID}`;
  const ruleName = `RL-${uniqueBasketName}`;

  console.log('Deleting rule', ruleName)
  await cwevents.deleteRule({
    Name: ruleName
  }).promise();  
};

const handleGetBaskets = async (event) => {
  const { userID, principalId } = event.requestContext.authorizer;
  if (event.pathParameters) {
    const { basketID } = event.pathParameters;
    const basket = await getBasket(basketID);
    return {
      ...DEFAULT_API_RESPONSE,
      body: JSON.stringify(basket),
    }
  } else {
    const baskets = await listUserBaskets(userID);
    return {
      ...DEFAULT_API_RESPONSE,
      body: JSON.stringify(baskets),
    }  
  }  
};

const handleDeleteBasket = async (event) => {
  const { userID, principalId } = event.requestContext.authorizer;

  if (!event.pathParameters) {
    return {
      ...DEFAULT_API_RESPONSE,
      statusCode: 404,
    }
  }
  
  if (event.pathParameters) {
    const { basketID } = event.pathParameters;
    const basket = await getBasket(basketID);
    if (basket.userID !== userID) {
      return {
        ...DEFAULT_API_RESPONSE,
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid basketID'
        }),
      }  
    }
    const result = await deleteBasket(basketID)

    console.log(result, '<<< result')
    if(result === null) {
      return {
        ...DEFAULT_API_RESPONSE,
        statusCode: 500,
        body: JSON.stringify({
          message: 'Internal Error'
        }),
      }  
    }
    // Delete the scheduler
    console.log('Deleting scheduler')
    await deleteScheduler({basketID});
    return {
      ...DEFAULT_API_RESPONSE,
      body: JSON.stringify({
        message: 'Basket Deleted'
      }),
    }
  }
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
      ...DEFAULT_API_RESPONSE,
      statusCode: 400,
      body: JSON.stringify(validateBasketCreate.errors),
    }
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
    ...DEFAULT_API_RESPONSE,
    body: JSON.stringify({
      basket: {
        basketID,
      },
      message: "Basket created/updated",
    }),
  }
};

exports.handler = async (event, context) => {
  switch (event.httpMethod) {
    case "GET": {
      return await handleGetBaskets(event);
    }
    case "POST": {
      return await handlePostBaskets(event);
    }
    case "DELETE": {
      return await handleDeleteBasket(event);
    }
    default: {
      return await handleGetBaskets(event);
    }
  }
};
