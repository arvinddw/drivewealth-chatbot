const InstrumentCache = require("./InstrumentCache");

test("Should get AAPL", async () => {
    const { getInstrument } = InstrumentCache()
    const inst = await getInstrument('AAPL')
    expect(inst.symbol).toBe('AAPL');
});

test("Should not get FOOBAR", async () => {
    const { getInstrument } = InstrumentCache()
    const inst = await getInstrument('FOOBAR')
    expect(inst).toBe(null);
});