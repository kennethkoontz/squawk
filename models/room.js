var socket = io.connect(location.hostname)
  , squawkModel = {}

ko.bindingHandlers.addOnEnter = {
    init: function (element, valueAccessor, allBindingsAccessor, squawkModel) {
        var allBindings = allBindingsAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                allBindings.addOnEnter.call(squawkModel);
                return false;
            }
            return true;
        });
    }
};

socket.on('message', function(data) {
    console.log(data);
    squawkModel.squawks.push(JSON.parse(data));
});

$(document).ready(function () {
    var squawk = function(username, message) {
        this.username = username;
        this.message = message;
    }

    squawkModel = {
        squawks: ko.observableArray([]),
        messageToAdd: ko.observable(""),

        addSquawk: function () {
            // TODO: Have to figure out a way to grab the username.
            var username = 'kenneth';
            var message = this.messageToAdd();
            if (message) {
                var data = {
                    'username': username,
                    'message': message
                };
                socket.send(JSON.stringify(data));
            }
            this.messageToAdd("");
        },
    };
    ko.applyBindings(squawkModel);
});
