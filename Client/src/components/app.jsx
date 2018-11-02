import React from 'react';
import axios from 'axios';
import uberToken from '../../../uber.js';
import {places} from 'google-maps-react';

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            uber : [],
            lyft : [],
            cheapest : {
                type: '',
                avg: 0,
            },
            startLat : "",
            startLong : "",
            destLat : "",
            destLong : "",
        };
        this.comparePrices = this.comparePrices.bind(this);
        this.saveResults = this.saveResults.bind(this);
        this.showResults = this.showResults.bind(this);
        this.initializeMap = this.initializeMap.bind(this);
        this.checkPrice = this.checkPrice.bind(this);
        this.cheapest = this.cheapest.bind(this);
        this.showCheapest = this.showCheapest.bind(this);
    }

    componentDidMount() {
        this.initializeMap();
    }

    initializeMap() {
        function autocompleteStartLocation() {
          var dest = document.getElementById('destField');
          var autocomplete = new google.maps.places.Autocomplete(dest);
        }
      
        function autocompleteDestination() {
          var initial = document.getElementById('initField');
          var autocomplete = new google.maps.places.Autocomplete(initial);
        }
      
        google.maps.event.addDomListener(window, 'load', autocompleteStartLocation);
        google.maps.event.addDomListener(window, 'load', autocompleteDestination);
    }



    checkPrice() {
        $('.spinner').css('display', 'inline-block');

        // Get geocoder instance
        var geocoder = new google.maps.Geocoder();
        let comparePrices = this.comparePrices.bind(this);
        // Geocode the address
        geocoder.geocode({
          'address': destField.value
        }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            //define results
            let destLat = results[0].geometry.location.lat();
            let destLong = results[0].geometry.location.lng();
            //recurse with init
            geocoder.geocode({
                'address': initField.value
              }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
                    //define results
                    let startLat = results[0].geometry.location.lat();
                    let startLong = results[0].geometry.location.lng();
                    comparePrices(startLat, startLong, destLat, destLong);
                    // show an error if it's not
                } else {
                  alert("Error with destination field! Please try again and make sure the address is valid!");
                  console.log(status);
                  console.log(results);
                }
              });    
            // show an error if it's not
          } else {
            alert("Error with destination field! Please try again and make sure the address is valid!");
            console.log(status);
            console.log(results);
          }
        });

    }


    comparePrices(startLat, startLong, destLat, destLong) {
        console.log('hello')
        axios.post('/search', {
            startLatitude: startLat,
            startLongitude: startLong,
            endLatitude: destLat,
            endLongitude: destLong
        })
            .then(res => {
                let lprice = [];
                let uprice = [];

                for (let i = 1; i < 4; i++){
                    var range = { type : res.data.results[Object.keys(res.data.results)[i]][0].display_name, min : res.data.results[Object.keys(res.data.results)[i]][0].estimated_cost_cents_min/100, max : res.data.results[Object.keys(res.data.results)[i]][0].estimated_cost_cents_max/100};
                    lprice.push(range);
                }
                for (let i = 0; i < 4; i++){
                    var range = { type: res.data.results.uber[i].display_name, range : res.data.results['uber'][i].estimate}
                    uprice.push(range);
                }
                this.saveResults(uprice, lprice);
                //then 
                this.cheapest(uprice[2], lprice[1]);
            })
            .catch(err => {console.error(err)});
    }

    saveResults(uberr, lyftr) {
        this.setState({uber: uberr, lyft: lyftr});
        console.log('hello, here are the res: ', this.state.uber, this.state.lyft)
    }

    cheapest(pool, line) {
        let uprices = pool.range.substring(1).split('-');
        let avgu = (parseInt(uprices[0]) +  parseInt(uprices[1]))/2;
        let avgl = (line.max + line.min)/2;
       
        avgu < avgl ? this.setState({cheapest: {type: 'Uber', avg: avgu}}): this.setState({cheapest: {type: 'Lyft', avg: avgl}});
    }

    showCheapest() {
        if (this.state.cheapest.type !== ''){
            return (
                <h1>{this.state.cheapest.type} is cheaper at an average of ${this.state.cheapest.avg} for a shared ride!</h1>
            )
        }
        else {
            return (
                <h1>Uber or Lyft?</h1>
            )
        }
    }

    showResults(){
        $('.spinner').css('display', 'none');

        return (
            <div className="columns">
                 <div className="column text-center">
                    <img src="./img/uber.jpg"/>
                    {this.state.uber.map((ride, i) => {
                        return (
                            <div key={i} className="res">
                                {ride.type}: {ride.range}
                            </div>
                        )
                    })}
                </div>
                <div className="column text-center">
                    <img src="./img/lyft.png"/>
                    {this.state.lyft.map((ride, i) => {
                        return (
                            <div key={i} className="res">
                                {ride.type}: ${ride.min}-{ride.max}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    

    render () {
        return (
            <div>
                <div className="searchpage">
                    <label htmlFor="initField">Initial Location</label>
                    <input className="searchBar" id="initField" type="text"/>
                    <label htmlFor="destField">Destination</label>
                    <input className="searchBar" id="destField" type="text"/>
                    <button className="btn btn-default" id="search" onClick={this.checkPrice}>Check Price!</button>
                    <span className="spinner">
                        <span className="double-bounce1"></span>
                        <span className="double-bounce2"></span>
                    </span>
                </div>
                <br></br>
                <div className="results">
                    <div>
                        {this.showCheapest()}
                    </div>
                    <div>
                        {this.showResults()}
                    </div>
                </div>       
            </div>
        )
    }   
}

export default App;