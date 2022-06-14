const { handler } = require("./batchorderprocessor");

const getRecord = (symbol, amount) => ({
  body: JSON.stringify({
    Message: JSON.stringify({
      symbol,
      type: "SHARE",
      amount,
      accountNo: "A1",
    }),
  }),
});

test("Bulk order test", async () => {
  let bulkOrder = await handler({
    Records: [
      getRecord("AAPL", 1000),
      getRecord("AAPL", 100),
      getRecord("NIKE", 100),
    ],
  });
  expect(bulkOrder).toEqual({
    orders: [
      { accountNo: "A1", type: "SHARE", symbol: "AAPL", amount: 1000 },
      { accountNo: "A1", type: "SHARE", symbol: "AAPL", amount: 100 },
      { accountNo: "A1", type: "SHARE", symbol: "NIKE", amount: 100 },
    ],
    orderMapBySymbol: {
      AAPL: { symbol: "AAPL", amount: 1100 },
      NIKE: { symbol: "NIKE", amount: 100 },
    },
  });
});
