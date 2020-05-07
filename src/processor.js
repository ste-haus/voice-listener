const os = require('os');

module.exports = function(settings) 
    var module = {};
    
    module.instruction = function (transcript) {
        return {
            'url': settings.uri.instruction,
            'method': 'POST',
            'json': {
                'source': os.hostname(),
                'transcript': result
            }
        };
    };

    module.chime = function (type) {
        return {
            'url': settings.uri.chime,
            'method': 'POST',
            'json': {
                'source': os.hostname(),
                'chime': type
            }
        };
    };

    return module;
};
