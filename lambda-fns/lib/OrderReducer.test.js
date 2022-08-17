const OrderReducer = require("./OrderReducer");

// console.log(OrderReducer.Reviver)

test("Should reducer messages to orders", async () => {
    const msgs = [{
        symbol: 'AAPL',
        quantity: 10,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    },{
        symbol: 'AAPL',
        quantity: 13,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    },{
        symbol: 'NIKE',
        quantity: 10,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    }]

    const orders = OrderReducer(msgs).getOrders()
    expect(orders.find(o => o.symbol === 'AAPL').quantity).toBe(23)
    // expect(orders.NIKE.quantity._value).toBe(10)
});

test("Should handle decimals", async () => {
    const msgs = [{
        symbol: 'AAPL',
        quantity: 0.00001,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    },{
        symbol: 'AAPL',
        quantity: 0.00021,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    },{
        symbol: 'NIKE',
        quantity: 10,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
    }]

    const orders = OrderReducer(msgs).getOrders()
    expect(orders.find(o => o.symbol === 'AAPL').quantity).toBe(0.00022)
});
