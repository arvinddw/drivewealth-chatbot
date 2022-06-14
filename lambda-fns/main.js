const Core = require("./core");

const Auth = require("./auth/auth");

exports.queryNames = Object.keys(Core.queries);
exports.mutationNames = Object.keys(Core.mutations);

const coreFunctions = {
  ...Core.queries,
  ...Core.mutations,
};

exports.handler = async (event) => {
  let coreFunction = coreFunctions[event.info.fieldName];
  if (!coreFunction) {
    throw new Error("Unknown function");
  }
  let result = await new Promise((resolve, reject) => {
    Auth()(event.request, null, (error) => {
      if (error) {
        reject(error);
      }
      resolve(coreFunction(event.arguments, event.request));
    });
  });
  return result;
};
