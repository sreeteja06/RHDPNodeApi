require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const userRoute = require('./routes/user');
const locationRoute = require('./routes/locations');
const statisticsRoute = require('./routes/statistics');
const locationAccessRoute = require('./routes/locationAccess');
const tempUserRoute = require('./routes/tempUser');
const reportRoute = require('./routes/report');

// require('./helpers/anomalyData');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// app.use(helmet.xssFilter());
app.use(helmet()); // enable in production
app.disable('x-powered-by');
app.use(morgan(':method :url :status :response-time ms - :remote-addr'));
app.use('/user', userRoute);
app.use('/', locationRoute);
app.use('/', locationAccessRoute);
app.use('/', tempUserRoute);
app.use('/', reportRoute);
app.use('/statistics', statisticsRoute);
app.set('view engine', 'ejs');
const port = process.env.PORT || 1337;

app.get('/', (req, res) => {
  res.send(`available routes haha<br/>
	/newJunctionPoint - auth required<br/>
	/getLocations - auth required<br/>
	/giveLocationAccess - auth required - only the admin<br/>
	/user/login - auth required<br/>
	/user/signUp - to create a new user<br/>
  /user/me/logout - auth required<br/>
  /statistics/getDensity - auth required <br/>
	`);
});
// /removeJunctionPoint - auth required - only the admin<br/ >
//   /removeJunctionPointAccess - auth required - only the admin<br/ >
//   /user/me / updateName - auth required < br />
//     /user/me / updateNumber - auth required < br />
//       /user/me / changePassword - auth required < br />

app.listen(port, () => {
  console.log(`Started up at port http://localhost:${port}/`);
});
