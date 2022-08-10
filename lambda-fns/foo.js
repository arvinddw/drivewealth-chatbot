const AMQClient = require("./amq");

const connectOptions = {
    'host': 'localhost',
    'port': 61613,
    'connectHeaders':{
      'host': '/',
      'login': 'admin',
      'passcode': 'admin',
      'heart-beat': '5000,5000'
    }
  };

const send =  async () => {
    const { connect, sendMessage, disconnect } = await AMQClient(connectOptions)
    
    await connect()
    await sendMessage("Foo bar")
    await disconnect()
   
}
send()
