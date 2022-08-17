const Basket = require("./Basket");

test("Should create a basket", async () => {
    const { createBasket } = Basket()

    const inst = await createBasket({
        userID: 'user1',
        name: 'Foobasket',
        timeout: 10,
        description: 'Thsi si a test'
    })

    console.log(inst)
    // expect(inst.symbol).toBe('AAPL');
});

test("Should get a basket", async () => {
    const { getBasket } = Basket()

    const inst = await getBasket('3431e793-dba2-4885-a6de-1de0df952e5c')
    console.log(inst);
    // expect(inst.symbol).toBe('AAPL');
});

test.only("Should delete a basket", async () => {
    const { deleteBasket } = Basket()

    const inst = await deleteBasket('5e60c5eb-9444-4f55-81b0-9dfd3e9ffe4b')
    console.log(inst, '<< test out');
    // expect(inst.symbol).toBe('AAPL');
});
