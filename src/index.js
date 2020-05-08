const settings = require('./settings');
const everloop = require('./everloop')(settings.matrix.leds);
const processor = require('./processor')(settings.processor);

const os = require('os');
const request = require("request");

const Sonus = require('sonus');
const speech = require('@google-cloud/speech')({
  projectId: settings.google.projectId,
  keyFilename: settings.google.keyfile
});

const hotwords = [{ file: settings.sonus.model, hotword: settings.sonus.hotword }];
const sonus = Sonus.init({ hotwords, recordProgram: 'arecord'}, speech);

Sonus.start(sonus);
everloop.flash(0,255,0,3,250);
console.log('listening for "' + hotwords[0].hotword + '"...');

sonus.on('hotword', (index, keyword) => {
    everloop.spin(75, 0, 130);
    console.log("!" + keyword);
});

sonus.on('partial-result', (result) => {
    console.log("Partial", result);
    checkAbortCode(result);
});

sonus.on('error', error => {
    console.log('error', error);
    everloop.flash(50, 0, 0, 3, 1000);
});

sonus.on('final-result', result => {
  everloop.oscillate(75, 0, 130);
  console.log("Final: ", result);

  request(
    processor.instruction(result),
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
          console.log(body);
          everloop.flash(0, 0, 50, 2, 400);
          //chime('chime' in body ? body.chime : 'okay');
      }
      else {
          everloop.flash(50, 0, 0, 3, 700);
          //chime('error');
          console.log(body);
          console.log("error: " + error)
          console.log("response.statusCode: " + response.statusCode)
          console.log("response.statusText: " + response.statusText)
      }
  });

  if (result.includes("stop")) {
    Sonus.stop(sonus);
  }
});

function chime(type){
    request(processor.chime(type));
}

function checkAbortCode(s){
    settings.abortCodes.forEach(function(a){
        if(s.endsWith(a)){
            console.log('abort');
            everloop.flash(0, 0, 50, 2, 400);
            Sonus.pause(sonus);
        }
    });
}
