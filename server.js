const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: './config.env',
});

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to the database');
  });

const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('App running');
});

process.on('unhandledRejection', (error) => {
  console.error(error);
  server.close(() => {
    process.exit(1);
  });
});
process.on('uncaughtException', (error) => {
  console.error(error);
  server.close(() => {
    process.exit(1);
  });
});
