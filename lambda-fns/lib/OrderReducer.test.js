const OrderReducer = require("./OrderReducer");

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

    const orders = OrderReducer.getOrders(msgs)
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

    const orders = OrderReducer.getOrders(msgs)
    expect(orders.find(o => o.symbol === 'AAPL').quantity).toBe(0.00022)
});

test("Should handle decimals", async () => {
    const msgs = [{
        symbol: 'AAPL',
        quantity: 0.00001,
        userID: 'ma',
        accountID: 'gogog',
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
        toAccountID: 'beta',
    },{
        symbol: 'AAPL',
        userID: 'ma',
        accountID: 'gogog',
        quantity: 0.00021,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
        toAccountID: 'beta',
    },{
        symbol: 'NIKE',
        userID: 'ma',
        accountID: 'gogog',
        quantity: 10,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
        toAccountID: 'beta'
    },{
        symbol: 'NIKE',
        userID: 'ma',
        accountID: 'gogog',
        quantity: 10,
        fromAccountID: 'foo',
        fromAccountNo: 'bar',
        toAccountID: 'gamma'
    }]

    const payouts = OrderReducer.getPayouts(msgs)
    // expect(payouts.find(o => o.fromAccountID === 'foo' && o.symbol === 'AAPL').quantity).toBe(0.00022)
    expect(payouts.find(o => o.toAccountID === 'gamma' && o.symbol === 'NIKE').quantity).toBe(10)
});
