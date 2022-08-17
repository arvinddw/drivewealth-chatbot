const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");
const AMQClient = require("./amq");

const Ajv = require("ajv");
const TransferSchema = require("./schema/transfers.json");
const InstrumentCache = require("./lib/InstrumentCache");
const User = require("./lib/User");
const Account = require("./lib/Account");
const Basket = require("./lib/Basket");
const { DEFAULT_API_RESPONSE } = require("./lib/util");

AWS.config.update({ region: "us-east-1" });

const ajv = new Ajv({ strict: false, allErrors: true });

const validate = ajv
  .addSchema(TransferSchema)
  .getSchema("#/components/schemas/TransferRequest");

const amqClient = AMQClient();
const instrumentCache = InstrumentCache();
const { getUser } = User();
const { getAccount } = Account();
const { getBasket } = Basket(); 

const amqPromise = amqClient.connect();

const transferShare = async ({ fromAccount, toAccount, share, comment }) => {
  const { symbol, quantity, execStrategy = "FIFO" } = share;
  // Validate Instrument
  // console.log('>>>>>', symbol)
  const instrument = await instrumentCache.getInstrument(symbol);
  if (!instrument || !instrument.instrumentID) {
    return {
      ...DEFAULT_API_RESPONSE,
      statusCode: 400,
      body: JSON.stringify({ message: "The given symbol was not found" }),
      isBase64Encoded: false,
    };
  }

  // If there is a share Transfer 
  // console.log(instrument)
  // console.log(fromAccount)

  const amqMessage = {
    mt: 9818, // JOSHUA_SHARE_TRANSFER_LOT
    accountID: fromAccount.accountID,
    fromAccountID: fromAccount.accountID,
    toAccountID: toAccount.accountID,
    symbol,
    quantity,
    execStrategy,
    ibID: fromAccount.ibID,
    id: uuid(),
    instrumentID: instrument.instrumentID,
    exchangeID: instrument.exchangeID,
    cusip: instrument.cusip,
    // transferID,
    comment,
  };

  console.log(amqMessage, "<<< MESSAGE");
  await amqPromise;
  await amqClient.sendMessageToQueue(JSON.stringify(amqMessage), {
    accountID: fromAccount.accountID,
    accountNo: fromAccount.accountNo,
  });
  console.log("<<< MESSAGE SENT");
};

const batchAndTransferShare = async ({ fromAccount, toAccount, share, comment, basketID }) => {
  const { symbol, quantity, execStrategy = "FIFO" } = share;
  const instrument = await instrumentCache.getInstrument(symbol);
  if (!instrument || !instrument.instrumentID) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "The given symbol was not found" }),
      isBase64Encoded: false,
    };
  }
  
  const amqMessage = {
    mt: 9819, // JOSHUA_BATCH_SHARE_TRANSFER
    userID: fromAccount.userID,
    accountID: fromAccount.accountID,
    fromAccountID: fromAccount.accountID,
    fromAccountNo: fromAccount.accountNo,
    toAccountID: toAccount.accountID,
    toAccountNo: toAccount.accountNo,
    symbol,
    quantity,
    execStrategy,
    ibID: fromAccount.ibID,
    id: uuid(),
    instrumentID: instrument.instrumentID,
    exchangeID: instrument.exchangeID,
    cusip: instrument.cusip,
    // transferID,
    comment,
  };

  console.log(amqMessage, "<<< Basket MESSAGE");
  await amqPromise;
  await amqClient.sendMessageToBasketQueue(JSON.stringify(amqMessage), basketID);
  console.log("<<< MESSAGE SENT");
};

exports.handler = async (event, context) => {
  const { userID, principalId } = event.requestContext.authorizer;
  const req = JSON.parse(event.body);

  const validationResult = await validate(req);
  
  if (!validationResult) {
    return {
      statusCode: 400,
      body: JSON.stringify(validate.errors),
      isBase64Encoded: false,
    };
  }

  const { accountFrom, accountTo, shares, comment, shareTransferPlan } = req;

  var isBatched = false;
  if (shareTransferPlan && shareTransferPlan.basketID) {
    // Validate basket
    const basket = await getBasket(shareTransferPlan.basketID);

    if (!basket) {
      return {
        ...DEFAULT_API_RESPONSE,
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid basketID',
        }),
      };
    }
    if (basket.clientAppId !== principalId) {
      return {
        ...DEFAULT_API_RESPONSE,
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid clientID',
        }),
      };
    }
    isBatched = true;
  }
  // Read users
  const fromAccount = await getAccount(accountFrom);
  const toAccount = await getAccount(accountTo);

  if (!fromAccount) {
    return {
      ...DEFAULT_API_RESPONSE,
      statusCode: 400,
      body: JSON.stringify({
        message: 'The fromAccount is invalid or does not exist',
      }),
    };
  }

  if (!toAccount) {
    return {
      ...DEFAULT_API_RESPONSE,
      statusCode: 400,
      body: JSON.stringify({
        message: 'The toAccount is invalid or does not exist',
      }),
    };
  }

  const fromUser = await getUser(fromAccount.userID);

  for (share of shares) {
    if (isBatched) {
      await batchAndTransferShare({
        fromAccount: { ...fromAccount, ibID: fromUser.parentIbID },
        toAccount,
        share,
        comment,
        basketID: shareTransferPlan.basketID,
      });
    } else {
      await transferShare({
        fromAccount: { ...fromAccount, ibID: fromUser.parentIbID },
        toAccount,
        share,
        comment,
      });
    }
  }
  return {
    ...DEFAULT_API_RESPONSE,
    body: JSON.stringify({
      message: isBatched ? "Shares added to basket for transfer" : "Shares transfered",
    }),
  }
};
