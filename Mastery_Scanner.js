// ==UserScript==
// @name         Mastery-Scanner
// @version      1.3
// @description  Click on all items in the mastery page and finally print out the result in the console
// @author       Dominik "Bl00D4NGEL" Peters
// @match        https://*.drakor.com/masteries
// ==/UserScript==

var BASE = 'https://www.drakor.com';

$(document).ready(function () {
    var h2 = $(document.createElement("h2")).attr("id", "analyse-mastery").html(" (Analyse)").on("click", function () {
        $(this).html("Analysing..");
        Analyse();
    }).appendTo("h2");
});

function addCommas(x) {
    return x.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function Analyse() {
    var globObj = {};
    $(".tradeMat").each(function (index, obj) {
        obj = $(obj);
        var html = obj.html();
        var id = obj.attr("id");
        if (id === undefined) { return; }
        id = id.match(/mat-(\d+)/)[1];
        try {
            $.ajax(BASE + "/show/material/" + id).success(function (data) {
                var id = $(this)[0].url.match(/material\/(\d+)/)[1];
                console.log("MADE AJAX TO: " + $(this)[0].url);
                var trade = data.match(/Drops from ([\w\s]+) Node/i);
                if (trade) { trade = trade[1]; }
                else { trade = "Disenchanting"; }
                if (globObj[trade] === undefined) { globObj[trade] = {}; }
                var name = data.match(/\[(.*?)\]/)[1];
                var mastery = data.match(/<div class="masteryBar".*?> ([\d,]+ \/ [\d,]+ \([\d,\.]+%\))</);
                if (mastery) { mastery = mastery[1]; }
                if (globObj[trade][mastery] === undefined) { globObj[trade][mastery] = name; }
                else { globObj[trade][mastery] += "|" + name; }
            });
        }
        catch (ex) {
            console.log("RIP... " + ex.message);
        }
    });

    var myTimer = setInterval(function () {
        if ($.active === 0) {
            console.log(globObj);
            var table = $(document.createElement("table")).css({ "float": "right", "text-align": "center", "width": "100%" }).prependTo($("body"));
            for (var trade in globObj) {
                var tr = $(document.createElement("tr")).appendTo(table);
                var td = $(document.createElement("th")).css("text-align", "center").attr("colspan", "2").html("Tradeskill: " + trade).appendTo(tr);
                //td.clone().html(trade).appendTo(tr);
                var total = 0;
                for (var mastery in globObj[trade]) {
                    var items = globObj[trade][mastery].split("|");
                    for (var i = 0; i < items.length; i++) {
                        var tr_2 = $(document.createElement("tr")).css("width", "50%").appendTo(table);
                        var td_2 = $(document.createElement("td")).html(items[i]).appendTo(tr_2);
                        td_2.clone().html(mastery).appendTo(tr_2);
                        total += parseInt(mastery.match(/^([\d,]+)/)[1].replace(",", ""));
                    }
                }
                var tr = $(document.createElement("tr")).appendTo(table);
                var td = $(document.createElement("td")).html("Total").appendTo(tr);
                td.clone().html(addCommas(total)).appendTo(tr);
                $(table).find("td").css("border", "1px solid white");
            }
            $("#analyse-mastery").html(" (Analyze)");
            clearInterval(myTimer);
        }
        else { console.log("Waiting.."); }
    }, 100);
}
