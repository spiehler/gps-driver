#! /usr/bin/env node

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// use first command line parameter for serial interface
// linux: /dev/ttyUSB3
// windows: COM8
var myArgs = process.argv.slice(2);
const file = myArgs[0];
if (file == undefined) {
  console.log('Usage: gps-demo [serial Port]');
  process.exit(1);
} else {
  console.log('Using serial interface:', file);
}

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort(file, {
  baudRate: 38400
});

port.pipe(parser);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/dashboard.html');
});

var GPS = require('gps');
var gps = new GPS;
gps.state.bearing = 0;
var prev = {lat: null, lon: null};

http.listen(3000, function() {

  console.log('listening on *:3000');

  gps.on('data', function() {
    if (prev.lat !== null && prev.lon !== null) {
      gps.state.bearing = GPS.Heading(prev.lat, prev.lon, gps.state.lat, gps.state.lon);
    }
    io.emit('state', gps.state);
    prev.lat = gps.state.lat;
    prev.lon = gps.state.lon;
    ;
  });

  parser.on('data', function(data) {
    gps.update(data);
  });
});
