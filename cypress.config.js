const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    setupNodeEvents(on, config) {
      let client;

      async function getDb() {
        if (!client) {
          client = await MongoClient.connect("mongodb+srv://anten:Test2001@p4sbu.wmmfr.mongodb.net/?retryWrites=true&w=majority&appName=P4SBU");
        }
        return client.db("p4sbu-db");
      }

      on('task', {
        'db:seedMongo': async ({ users }) => {
          const db = await getDb();
          const usersCollection = db.collection('users');
          const results = [];

          for (const user of users) {
            const existingUser = await usersCollection.findOne({ username: user.username });
            if (!existingUser) {
              await usersCollection.insertOne(user);
              results.push({ ...user, added: true });
            } else {
              results.push({ ...user, added: false });
            }
          }
          return results;
        },
        'db:cleanupMongo': async ({ usernames }) => {
          const db = await getDb();
          const usersCollection = db.collection('users');
          const deleteResult = await usersCollection.deleteMany({ username: { $in: usernames } });
          return usernames;
        },
      });
    },
  },
});
