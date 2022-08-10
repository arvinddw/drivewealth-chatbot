const AMQClient = require("./amq");

exports.handler = async (event, context) => {
  const { basketID } = event;
  const amqClient = AMQClient();
  await amqClient.connect();
  console.log('Processor connected to ActiveMQ');
  
  const messages = await amqClient.readAllMessagesInBasketQueue(basketID);
  console.log(messages, '<<< messages read from basket');
  
  await amqClient.disconnect();
  console.log('Processor disconnected from ActiveMQ');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Processed ${messages.length} messages`,
    }),
    isBase64Encoded: false,
  };
};
