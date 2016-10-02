// ==UserScript==
// @name         Mastery-Scanner
// @version      1.2
// @description  Click on all items in the mastery page and finally print out the result in the console
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/masteries
// ==/UserScript==
$(document).ready(function(){
    $(".tradeMat").click();
    var mats = $(".tradeMat");
    var masteries = {};
    setTimeout(function(){
        for(var i=0;i<mats.length;i++){
            if(!mats[i].className.match(/small/)){
                var tradeskill = mats[i].className.match(/\s(\w+)/i)[1];
                if(!masteries[tradeskill]){
                    masteries[tradeskill] = {};
                }
                var id = $(mats[i]).attr('id').replace("-","");
                var masteryText = $("#" + id).text();
                var item = masteryText.match(/\[(.*?)\]/)[1];
                var masteryAmount = masteryText.match(/([0-9,]+\s*\/\s*[0-9,]+.*?\(\d+%\))/)[1];
                masteries[tradeskill][item] = masteryAmount;
            }
        }
        for(var trade in masteries){
            var table = "<table style='float: right;width: 33%'>";
            table += "<tr style='background-color: grey'><td>Tradeskill</td><td>" + trade + "</td></tr>";
            for(var mastery in masteries[trade]){
                table += "<tr><td>" +  mastery + "</td><td>" + masteries[trade][mastery] + "</td></tr>";
            }
            table += "</table>";
            $("body").html(table + $("body").html());
        }
    }, 7500);
});
