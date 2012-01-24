$(document).ready(function () {
    var archivedDate = new moment($('.archived-date').html());
    var todaysDate = new moment();

    (function setBackLink() {
        var backDate = archivedDate.subtract('days', 1);
        var backDateArray = [parseInt(backDate.month()) + 1,
                             backDate.date(),
                             backDate.year()];
        var backDateLink = '/room/archive/' + backDateArray.join('/');
        $('#back-date').html(backDate.format("dddd, MMMM D YYYY")).attr('href', backDateLink);
    })();

    if (archivedDate.date() + 2 === todaysDate.date()) {
        $('.ahead-date').remove();
    } else {
        (function setAheadLink() {
            var aheadDate = archivedDate.add('days', 2);
            var aheadDateArray = [parseInt(aheadDate.month()) + 1,
                                 aheadDate.date(),
                                 aheadDate.year()];
            var aheadDateLink = '/room/archive/' + aheadDateArray.join('/');
            $('#ahead-date').html(aheadDate.format("dddd, MMMM D YYYY")).attr('href', aheadDateLink);
        })();
    }

    $('.timestamp').each(function() {
        var time = new moment($(this).html());
        $(this).html(time.format('h:m a'));
    });

});
