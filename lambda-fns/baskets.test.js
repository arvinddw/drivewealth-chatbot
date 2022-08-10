const Basket = require("./baskets");

test("should list baskets for userID", async () => {
  const result = await Basket.handler(
    {
      body: JSON.stringify({ name: "ChimeOrderBasket", timeout: 5 }),
      httpMethod: 'GET',
      requestContext: {
        authorizer: {
            userID: '21c4ee2e-d74f-4924-9a31-9de5a442f5e7', 
            principalId: 'foo'
        }
      }
    },
    {}
  );
  console.log(result);

  // await sendMessage({
  //     'destination': '/queue/test',
  //     'ack': 'client-individual'j
  // }, 'foo')

  // expect(100).toBe(100);
});
