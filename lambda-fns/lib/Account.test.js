const Account = require("./Account");

test("Should get an account by accountNo", async () => {
    const { getAccount } = Account()
    const acc = await getAccount('ZEZA880185')
    expect(acc.accountNo).toBe('ZEZA880185');
});
