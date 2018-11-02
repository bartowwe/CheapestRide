const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const {uberToken, lyftToken} = require('../uber.js');

// I don't think I'm going to need a database for my personal site
//const connection = require('../Database/mongodb/index');

// I also don't know if I'm going to need a router yet
//const router = require('./router');

const Lyft = require('lyft-node');
const Uber = require('node-uber');

const uber = new Uber({
  client_id: uberToken.id,
  client_secret: uberToken.secret,
  server_token: uberToken.token,
  redirect_uri: 'http://localhost:3000',
  name: 'CheapestRide',
  language: 'en_US' // optional, defaults to en_US
});

const lyft = new Lyft(lyftToken.id, lyftToken.secret);

console.log(lyft);

const server = express();
const port = 3005;

server.use(bodyparser.json());
server.use(bodyparser.urlencoded({ extended: true}));
server.use(express.static(path.join(__dirname, '../client/dist')));

server.post("/search", function (req, res) {
    // get start/end locations

    const startLatitude = (req.body.startLatitude);
    const startLongitude = (req.body.startLongitude);
    const endLatitude = (req.body.endLatitude);
    const endLongitude = (req.body.endLongitude);
    
    const results = {};
    const searches = [];
  
    const uberSearch = uber.estimates.getPriceForRouteAsync(startLatitude, startLongitude, endLatitude, endLongitude);
  
    const regularLyft = {
      start: {
        latitude: startLatitude,
        longitude: startLongitude
      },
      end: {
        latitude: endLatitude,
        longitude: endLongitude
      },
      rideType: 'lyft'
    };
  
    const lyft_line = {
      start: {
        latitude: startLatitude,
        longitude: startLongitude
      },
      end: {
        latitude: endLatitude,
        longitude: endLongitude
      },
      rideType: 'lyft_line'
    };
  
    const lyft_plus = {
      start: {
        latitude: startLatitude,
        longitude: startLongitude
      },
      end: {
        latitude: endLatitude,
        longitude: endLongitude
      },
      rideType: 'lyft_plus'
    };
  
    const lyftSearch = lyft.getRideEstimates(regularLyft);
    const lyft_lineSearch = lyft.getRideEstimates(lyft_line);
    const lyft_plusSearch = lyft.getRideEstimates(lyft_plus);
  
    searches.push(uberSearch);
    searches.push(lyftSearch);
    searches.push(lyft_lineSearch);
    searches.push(lyft_plusSearch);
  
    Promise.all(searches).then(function (data) {
  
      results.uber = data[0]["prices"];
      results.lyft = data[1]["cost_estimates"];
      results.lyft_line = data[2]["cost_estimates"];
      results.lyft_plus = data[3]["cost_estimates"];
      console.log('hello here')
      res.send({
        results: results
      });
      res.end();
  
    })
    .catch(function () {
      console.log('failed promise?');
    });
  
  });


server.listen(port, () => console.log('server is connected'));