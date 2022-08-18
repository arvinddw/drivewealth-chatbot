const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");
const url = require('url')

// AWS.config.update({ region: "us-east-1" });

const AMQ_URL = 'failover:(10.175.1.227:)'
console.log(url.parse(AMQ_URL.replace('failover:(', '')).hostname)
console.log(url.parse(AMQ_URL.replace('failover:(', '')).port)

// const createInstance = async () => {
//   const ec2 = new AWS.EC2();

// //   var params = {
// //     DryRun: false,
// //     InstanceIds: ["foo-instance"],
// //   };

// //   var instanceParams = {
// //     ImageId: 'ami-090fa75af13c156b4', 
// //     InstanceType: 't2.micro',
// //     // KeyName: 'KEY_PAIR_NAME',
// //     MinCount: 1,
// //     MaxCount: 1
// //  };

//   var params = {
//     DryRun: false,
//     InstanceIds: ["i-0ce11a2ce4ae5a9c4"],
//     // Tag
//   };
//     return await ec2
//       .describeTags({
//         Filters: [{
//           Name: 'tag:application',
//           Values: ['ActiveMQ'],
//         }],
//       })
//       .describeInstances(params)
//       .promise();
  
//   // return await ec2.runInstances(instanceParams).promise();

  
// };

// // createInstance().then((a) => console.log(a.Reservations[0].Instances[0].PrivateIpAddress)).catch(console.error);
// // createInstance().then((a) => console.log(a.Reservations[0].Instances[0].PrivateIpAddress)).catch(console.error);

// createInstance().then((a) => console.log(JSON.stringify(a, null, 2))).catch(console.error);
