var socket = io.connect(location.hostname);

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


$(document).ready(function () {
    function Squawk(data) {
        this.email = ko.observable(data.user);
        this.message = ko.observable(data.body); 
    }

    function squawkModel() {
        var self = this;
        self.squawks = ko.observableArray([]);
        self.messageToAdd = ko.observable("");

        self.addSquawk = function () {
            var email = $('#email').val();
            var message = self.messageToAdd();
            if (message) {
                var data = {
                    'email': email,
                    'message': message
                };
                socket.send(JSON.stringify(data));
            }
            self.messageToAdd("");
        };

        self.updateSquawk = function(data) {
            self.squawks.push({email: data.email, message: data.message});
            self.messageToAdd("");
        };

        $.getJSON("/messages", function(allData) {
            var mappedMessages = $.map(allData, function(item) { return new Squawk(item) });
            self.squawks(mappedMessages);
        });    
    }
    var squawk = new squawkModel();

    socket.on('message', function(data) {
        squawk.updateSquawk(JSON.parse(data));
    });
    
    ko.applyBindings(squawk);
});
