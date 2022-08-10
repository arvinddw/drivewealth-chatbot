const User = require("./User");

test("Should get an account by accountNo", async () => {
    const { getSession } = User()
    const session = await getSession('21c4ee2e-d74f-4924-9a31-9de5a442f5e7.2022-08-08T14:59:34.955Z')
    expect(session.userID).toBe('21c4ee2e-d74f-4924-9a31-9de5a442f5e7');
});
