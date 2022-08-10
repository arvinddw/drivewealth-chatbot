const AMQClient = require("./amq");

const connectOptions = {
  host: "localhost",
  port: 61613,
  connectHeaders: {
    host: "/",
    login: "admin",
    passcode: "admin",
    "heart-beat": "5000,5000",
  },
};


test("AMQ Send Message", async () => {
  const { connect, sendMessageToBasketQueue, disconnect } = await AMQClient(connectOptions);  
  await connect();
  await disconnect();
  // await sendMessage({
  //     'destination': '/queue/test',
  //     'ack': 'client-individual'
  // }, 'foo')

  // expect(100).toBe(100);
});

test("AMQ Send Message", async () => {  
  const { connect, sendMessageToBasketQueue, readAllMessagesInBasketQueue, disconnect } = await AMQClient(
    // connectOptions
  );
  await connect();
  
  // for (var i of [1, 2, 3, 4, 5]) {
  //   await sendMessageToBasketQueue(
  //     `{"mt": 19829, "body": ${i}}`,
  //     'basket1'
  //   );
  // }

  const messages = await readAllMessagesInBasketQueue('8ff50bd8-c245-4e49-872f-9b504e0b4eb2');
  // console.log(messages, "<<<");
  await disconnect();
  expect(messages.length).toBe(5)
});
