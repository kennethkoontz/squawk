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

ko.bindingHandlers.star = {
    init: function(element, valueAccessor) {
        $(element).hover(
            function() { $(this).addClass("hover") },
            function() { $(this).removeClass("hover") }                
        ).click(function() {
            var observable = valueAccessor();
            var id = $(element).attr('id');
            if (ko.utils.unwrapObservable(valueAccessor()) === true) {
                $.getJSON("/star/message/"+id, function(data) {
                    console.log(data);
                });    
                observable(false);
            } else {
                $.getJSON("/star/message/"+id, function(data) {
                    console.log(data);
                });    
                observable(true);
            }
        });
    },
    update: function(element, valueAccessor) {
        if (ko.utils.unwrapObservable(valueAccessor()) === true) {
            $(element).removeClass("not-starred");
            $(element).addClass("starred");
        } else {
            $(element).removeClass("starred");
            $(element).addClass("not-starred");
        }
    }    
};

$(document).ready(function () {
    (function setYesterdayLink() {
        var todaysDate = new moment($('.todays-date').html());
        var backDate = todaysDate.subtract('days', 1);
        var backDateArray = [parseInt(backDate.month()) + 1,
                             backDate.date(),
                             backDate.year()];
        var backDateLink = '/room/archive/' + backDateArray.join('/');
        $('.yesterday').attr('href', backDateLink);
    })();

    function Squawk(data) {
        this.starred = ko.observable(data.starred);
        this.email = ko.observable(data.user);
        this.message = ko.observable(data.body); 
        this.timestamp = squawk.convertTime(data.createdDate);
        this.messageId = data._id;
    }

    function User(data) {
        this.name = ko.observable(data.name);
    }

    function squawkModel() {
        var self = this;
        self.starred = ko.observable();
        self.users = ko.observableArray([]);
        self.squawks = ko.observableArray([]);
        self.messageToAdd = ko.observable("");

        self.updateUser = function(data) {
            self.users.removeAll()
            var mappedMessages = $.map(data, function(item) { return new User(item) });
            self.users(mappedMessages);
        }

        self.convertTime = function(data) {
            // Convert the time from UTC to local.
            var d = new Date(data);
            var h = d.getHours();
            var meridian = (h>=12)?'pm':'am';
            h = ((h%12 === 0)?12:0) + (h >= 12?h%12:h)
            var m = d.getMinutes(); 
            m = (m < 10)?'0'+m:m
            return h + ':' + m + ' ' + meridian;
        }

        self.parseForLinks = function (data) {
            // Parse the text for links.
            var re = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
	        var matchedArray  = data.match(re);
            if (matchedArray) {
                $.each(matchedArray, function (i, v) {
                    var link = "<a href='" + v + "' target='_blank'>" + v + "</a>";
                    d = data.replace(v, link);      
                });
                return d;
            } else {
                return data;
            }
        }

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
            console.log(data);
	        data.body = squawk.parseForLinks(data.body);
            self.squawks.unshift(new Squawk(data));
        };

        $.getJSON("/messages", function(allData) {
            allData.reverse();
            var mappedMessages = $.map(allData, function(item) {
                item.body = squawk.parseForLinks(item.body);
                return new Squawk(item)
            });
            self.squawks(mappedMessages);
        });    

    }
    var squawk = new squawkModel();
    
    ko.applyBindings(squawk);

    socket.on('connect', function () {
        socket.emit('set name', $('#email').val());

        socket.on('message', function(data) {
            squawk.updateSquawk(JSON.parse(data));
        });
        
        socket.on('update-userlist', function(data) {
            squawk.updateUser(data);
        });
    });
});
