const dotenv = require('dotenv');
const app = require('./app');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
}).then( con => {
  console.log('DB is connected.');
}).catch((err) => {
  console.log(err);
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`); 

});
