const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');

const connectDB = require('./src/config/db');
const { processDueRecurringTransactions } = require('./src/services/recurring-transactions.service');
const PORT = process.env.PORT;

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
      throw new Error('JWT_SECRET must be set to a secret of at least 32 bytes');
    }

    await connectDB();

    const runRecurringTransactions = async () => {
      try {
        await processDueRecurringTransactions();
      } catch (error) {
        console.error('Failed to process recurring transactions', error);
      }
    };

    await runRecurringTransactions();
    setInterval(runRecurringTransactions, 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server Running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error('failed to start server', error.message);
    process.exit(1);
  }
};

startServer();
