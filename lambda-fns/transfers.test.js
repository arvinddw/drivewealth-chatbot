
const { handler } = require("./transfers");

jest.mock('uuid', () => {
  const base = '9134e286-6f71-427a-bf00-';
  let current = 100000000000;

  return {
    v4: () => 'd98eb5a5-7cb8-4043-8ece-e1b4a5a9f570'
  }
});

test("Transfer create validation", async () => {
  let result = await handler({
    body: JSON.stringify({
      accountFrom: "DWBG000083",
      accountTo: "DWWS000099",
      shares: [
        {
          symbol: "AAPL",
          quantity: 10,
          averagePrice: 0,
          accountingMethodology: "FIFO",
        },
      ],
      shareTransferPlan: {
        basketID: "foobasket",
      },
      comment: "Foo",
    }),
  });
  console.log(result);
  // expect(result.statusCode).toBe(400);
});

test("Transfer create s3 method", async () => {
  
  let result = await handler({
    body: JSON.stringify({
      type: "SHARE_TRANSFER",
      data: [
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100,
          quantity: 1.11111,
          transferPrice: 100.3456,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100,
          quantity: 1,
          transferPrice: 100.3456,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100,
          quantity: 1,
          transferPrice: 100.3456,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100,
          quantity: 1,
          transferPrice: 100.3456,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100.1,
          quantity: 1,
          transferPrice: 100.1,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100.12,
          quantity: 1,
          transferPrice: 100.12,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100.123,
          quantity: 1,
          transferPrice: 100.123,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100.1234,
          quantity: 1,
          transferPrice: 100.1234,
          executionStrategy: "LIFO",
          dnb: true,
        },
        {
          accountFrom: "DWRS000063",
          accountTo: "DWHX000080",
          symbol: "AAPL",
          averagePrice: 100.1254,
          quantity: 1,
          transferPrice: 100.4351,
          executionStrategy: "LIFO",
          dnb: true,
        },
      ],
    }),
  });
  
  expect(result.statusCode).toBe(200);
});

test.only("Transfer with basket", async () => {
  let result = await handler({
    body: JSON.stringify({
      accountFrom: "DWBG000083",
      accountTo: "DWWS000099",
      shares: [
        {
          symbol: "AAPL",
          quantity: 10,
          averagePrice: 0,
        },
      ],
      shareTransferPlan: {
        basketID: "chimebasket",
      },
      comment: "Foo",
    }),
  });
  console.log(result);
  // expect(result.statusCode).toBe(400);
}, 10000);
