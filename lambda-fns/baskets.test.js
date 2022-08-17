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
});

test.only("should delete basket", async () => {
  const result = await Basket.handler(
    {
      // body: JSON.stringify({ name: "ChimeOrderBasket", timeout: 5 }),
      httpMethod: 'DELETE',
      requestContext: {
        authorizer: {
            userID: '21c4ee2e-d74f-4924-9a31-9de5a442f5e7', 
            principalId: 'foo'
        }
      },
      pathParameters: {
        basketID: '0e616589-61aa-45f1-92a7-48ff7cc1fca9'
      }
    },
    {}
  );
  console.log(result);
});
