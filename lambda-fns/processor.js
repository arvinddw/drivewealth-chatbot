const AMQClient = require("./amq");
const OrderReducer = require("./lib/OrderReducer");

// Sample order message

// const m = {
//   mt: "4532",
//   sessionKey: "2c77fc88-07d4-4aaf-868a-65c1a3853247.2015-10-01T18:01:02.710Z",
//   userID: "2c77fc88-07d4-4aaf-868a-65c1a3853247",
//   accountNo: "DPKC000001",
//   ordType: "1",
//   symbol: "IBM",
//   quantity: "2",
//   side: "Buy",
//   limitPx: "0",
//   stopPx: "0",
//   comment: "",
//   memo: "mikes first test",
//   correlationID: "1443722892066",
//   replyTo: "queue://mys.use1b-hab01.usersession",
// };

// Sampe basket message

// {
//   mt: 9819,
//   accountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1654534016805',
//   fromAccountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1654534016805',
//   toAccountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1656083791699',
//   symbol: 'AAPL',
//   quantity: 3,
//   execStrategy: 'FIFO',
//   ibID: '80f9b672-120d-4b73-9cc9-42fb3262c4b9',
//   id: 'f6623da9-acc7-452d-8469-c4284ddefa70',
//   instrumentID: 'a67422af-9e63-43df-8504-7361eb0bd99e',
//   exchangeID: 'NSQ',
//   cusip: '037833100',
//   comment: 'This is a comment - 1660259146'
// }

exports.handler = async (event, context) => {
  const { basketID } = event;
  const amqClient = AMQClient();
  await amqClient.connect();
  console.log("Processor connected to ActiveMQ");

  const messages = await amqClient.readAllMessagesInBasketQueue(basketID);
  console.log(messages, "<<< messages read from basket");
  const orders = OrderReducer(messages).getOrders();

  for (order of orders) {
    console.log(`Order request to AMQ: ${order}`);
    // await amqClient.sendMessageToQueue(JSON.stringify(order), {
    //   accountID: order.userID,
    //   accountNo: order.fromAccountNo
    // })
    await amqClient.sendMessageToNamedQueue(
      JSON.stringify(order),
      "dw.bo.request"
    );
  }

  await amqClient.disconnect();
  console.log("Processor disconnected from ActiveMQ");

  // Always wait for 5 seconds before killing lambda.
  await new Promise((res, rej) => setTimeout(res, 5000));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Processed ${messages.length} messages`,
    }),
    isBase64Encoded: false,
  };
};

// const amqClient = AMQClient();
// amqClient
//   .connect()
//   // .then(() => {
//   //   amqClient.subscribe(`/queue/dw.bo.request`, function(body, headers) {
//   //     console.log('This is the body of a message on the subscribed queue:', body);
//   //   });
//   // })
//   .then(() => {
//     return amqClient.sendMessageToNamedQueue(
//       JSON.stringify({
//         mt: "4532",
//         sessionKey: `d7078149-4643-476c-b355-4a2ccb6bce4c.2022-08-16T20:05:01.998Z`,
//         userID: "d7078149-4643-476c-b355-4a2ccb6bce4c",
//         accountNo: "DWBG000083",
//         ordType: "1",
//         symbol: "STIP",
//         quantity: 2,
//         side: "B",
//         limitPx: "0",
//         stopPx: "0",
//         comment: "Test order babe",
//         correlationID: Date.now(),
//         replyTo: 'queue://mys.use1b-hab01.usersession'
        
//       }),
//       "dw.bo.request",
//       {
//         'amq-msg-type': 'text',
//       }
//     );
//   })
//   .then(() => console.log('Sent'))
//   .catch(console.error);
