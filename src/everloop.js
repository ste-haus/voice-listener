module.exports = function() {
    var module = {};
    var everloop = {};

    var creator_ip = process.env.CREATOR_IP || '127.0.0.1'
    var creator_everloop_base_port = 20013 + 8 // port for Everloop driver.

    var zmq = require('zmq')

    // Import MATRIX Proto messages
    var matrix_io = require('matrix-protos').matrix_io

    // To trigger an error message you can send an invalid configuration to the driver.
    // For instance, set a number of leds != 35.
    var errorSocket = zmq.socket('sub')
    errorSocket.connect('tcp://' + creator_ip + ':' + (creator_everloop_base_port + 2))
    errorSocket.subscribe('')
    errorSocket.on('message', (error_message) => {
      console.log('Message received: Pressure error: ' + error_message.toString('utf8'))
    });

    var configSocket = zmq.socket('push')
    configSocket.connect('tcp://' + creator_ip + ':' + creator_everloop_base_port /* config */)

    var max_intensity = 50
    var intensity_value = max_intensity

    module.setEverloop = function (leds) {
        var image = matrix_io.malos.v1.io.EverloopImage.create();

        for (var j = 0; j < leds.length; j++) {
          var led_conf = matrix_io.malos.v1.io.LedValue.create(leds[j]);
          image.led.push(led_conf);
        }

        var config = matrix_io.malos.v1.driver.DriverConfig.create({
          image: image
        })

        configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());
    };

    module.pulse = function (r, g, b){
        var multiplier = 1;

        module.stop();

        everloop["pulse"] = setInterval(() => {
            var leds = [];

            for(var i = 0; i < 35; i++){
                leds.push({
                    red: Math.floor(r * multiplier),
                    green: Math.floor(g * multiplier),
                    blue: Math.floor(b * multiplier),
                    white: Math.floor(0 * multiplier)
                });
            }

            module.setEverloop(leds);

            multiplier = (multiplier <= 0 ? 1 : multiplier - 0.01);
        }, 10);
    };

    module.oscillate = function(r, g, b){
        var multiplier = 1;
        var oscillate = 1;

        module.stop();

        everloop["oscillate"] = setInterval(() => {
            var leds = [];

            for(var i = 0; i < 35; i++){
                leds.push({
                    red: Math.floor(r * multiplier),
                    green: Math.floor(g * multiplier),
                    blue: Math.floor(b * multiplier),
                    white: Math.floor(0 * multiplier)
                });
            }

            module.setEverloop(leds);

            if(multiplier <= 0.01 && oscillate == -1){
                oscillate = 1;
            }
            else if(multiplier >= 1 && oscillate == 1){
                oscillate = -1;
            }

            multiplier += (oscillate * 0.01);
        }, 10);
    };

    module.spin = function (r, g, b){
        console.log('spin');
        var position = 0;
        var tail = 24;

        module.stop();

        everloop["spin"] = setInterval(() => {
            var leds = [];

            for(var i = 0; i < 35; i++){
                if((i <= position) && (i > (position - tail) % 35)){
                    var intensity = (100 - ((100 / tail) * (position - i))) / 100;
                    leds.push({
                        red: Math.floor(r * intensity),
                        green: Math.floor(g * intensity),
                        blue: Math.floor(b * intensity),
                        white: Math.floor(0 * intensity)
                    });
                }
                else if((position - i) < 0 && (i > (35 - tail + position))){
                    var intensity = (100 - ((100 / tail) * (35 - i + position))) / 100;
                    leds.push({
                        red: Math.floor(r * intensity),
                        green: Math.floor(g * intensity),
                        blue: Math.floor(b * intensity),
                        white: Math.floor(0 * intensity)
                    });
                }
                else{
                    leds.push({
                        red: 0,
                        green: 0,
                        blue: 0,
                        white: 0
                    });
                }
            }

            module.setEverloop(leds);

            position = ++position % 35;
        }, 20);
    };

    module.stop = function (){
        for(var key in everloop){
            clearInterval(everloop[key]);
            delete everloop[key];
        }

        module.clear();
    };

    module.clear = function (){
        var leds = [];

        for(var i = 0; i < 35; i++){
            leds.push({
                red: 0,
                green: 0,
                blue: 0,
                white: 0
            });
        }

        module.setEverloop(leds);
    };

    module.flash = function (r, g, b, count, duration){
        console.log("flash");
        module.stop();

        everloop["flash"] = true;
        setInterval(() => {
            if(everloop["flash"]){
                if(count == 0){
                    r = 0;
                    g = 0;
                    b = 0;
                }

                var leds = [];

                for(var i = 0; i < 35; i++){
                    leds.push({
                        red: r,
                        green: g,
                        blue: b,
                        white: 0
                    });
                }

                module.setEverloop(leds);

                count--;

                setTimeout(module.clear, duration * 0.7);
            }
        }, duration);
    };

    //module.oscillate(50, 0, 50);
    module.stop();
    //module.flash(50, 0, 0, 3);

    return module;
}
