const mongoose = require("mongoose");
const { config, validateCoreEnv } = require("./env");

let connectionPromise = null;

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  validateCoreEnv();

  connectionPromise = mongoose
    .connect(config.dbUrl, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: Number(process.env.MONGOOSE_MAX_POOL_SIZE || 10),
    })
    .then(() => {
      console.log("Connected to MongoDB");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

module.exports = {
  connectDatabase,
};
