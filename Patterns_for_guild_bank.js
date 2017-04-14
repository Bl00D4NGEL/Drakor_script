// ==UserScript==
// @name         Patterns for Guildbank
// @version      1.0
// @description  Check for Pattern materials in guildbank.
// @author       Dominik "Bl00D4NGEL" Peters
// @match        https://www.drakor.com/guild
// ==/UserScript==

var BASE = 'https://www.drakor.com';
var debug = 0;

var patterns = {
    "construction": {
        "Shack": 763,
        "House": 764,
        "Hall": 765,
        "Estate": 766,
        "Keep": 767,
        "Fort": 768,
        "Palace": 769,
        "Fortress": 888,
        "Medium Birch Container": 108,
        "Small Cedar Container": 198,
        "Medium Cedar Container": 200,
        "Hemlock Container": 532
    }
};

$(document).ready(function () {
    //console.log(GetAllPatternSkills());
    $(".guildMenu").html($(".guildMenu").html() + "<br>");
    var emptyOption = $(document.createElement("option")).val("").html("-- Please select --");
    var patternSelect = $(document.createElement("select")).css("display", "none");
    var tradesSelect = $(document.createElement("select")).on("change", function () {
        if ($(this).val() === "") { patternSelect.css("display", "none"); }
        else {
            patternSelect.css("display", "block");
            patternSelect.children().remove();
            emptyOption.clone().appendTo(patternSelect);
            for (var pattern in patterns[$(this).val()]) {
                console.log("PATTERN: " + pattern);
                $(document.createElement("option")).val(patterns[$(this).val()][pattern]).html(pattern).appendTo(patternSelect);
            }
        }
    }).appendTo(".guildMenu");
    patternSelect.appendTo(".guildMenu");
    emptyOption.clone().appendTo(tradesSelect);
    var showButton = $(document.createElement("button")).html("Display Pattern!").on("click", function () {
        if (patternSelect.val() === "" || patternSelect.val() === null) { return; }
        else {
            $("#pattern-output").html("<h1>Loading pattern...</h1>");
            var materials = {};
            var id = patternSelect.val();
            GetMaterials(id, materials);
            var myTimer = setInterval(function () {
                if ($.active === 0) { //$.active returns the amount of currently active ajax requests
                    var out = GetAmountsOfGuildBank(materials, 1);
                    $("#pattern-output").html("<pre>" + out + "</pre>");
                    clearInterval(myTimer);
                }
            }, 50, materials);
        }
    }).appendTo(".guildMenu");
    for (var trades in patterns) {
        var text = trades;
        text = trades[0].toUpperCase() + trades.slice(1);
        $(document.createElement("option")).val(trades).html(text).appendTo(tradesSelect);
    }
    $(document.createElement("div")).attr({ 'id': 'pattern-output' }).insertAfter($(".guildMenu"));
});

function GetMaterials(id, materials) {
    $.ajax(BASE + "/show/patternbasic/" + id).success(function (data) {
        var ajax_id = $(this)[0].url.match(/\/(\w+)$/)[1];
        var reqMaterialsMatch = data.match(/<b>Required Materials\:<\/b>\s*(.*?)<\/div>\s*(?:<\/div>|<\/?br\/?>)/);
        if (reqMaterialsMatch) { //Get the required materials for the pattern
            var mats = reqMaterialsMatch[1];
            var reqs = mats.match(/(div.*?<\/div>\s*x\d+)/g);
            for (var j = 0; j < reqs.length; j++) {
                var amount = reqs[j].match(/<\/div>\s*x(\d+)/)[1];
                var material = reqs[j].match(/\[(.*?)\]/)[1];
                var mate_id = reqs[j].match(/div id="mate-(\d+)/)[1];
                //Make an ajax to the material and check if it has a pattern
                $.ajax(BASE + "/show/material/" + mate_id).success(function (data) {
                    var patt_id = data.match(/patternbasic-(\d+)" class="patternWrapper patternShow greenTitle/i);
                    if (patt_id) {
                        //If it has a pattern, get the materials for it (recursively)
                        var material = data.match(/<div.*?\[([\s\w]+)\]/)[1];
                        materials[material].SubItems = {};
                        GetMaterials(patt_id[1], materials[material].SubItems);
                    }
                });
                materials[material] = {};
                materials[material].Amount = Number(amount);
                materials[material].ID = mate_id;
            }
        }
    });
}

function GetAmountsOfGuildBank(materials, depth) {
    var out = "";
    for (var material in materials) {
        var html = $("#mat-" + materials[material].ID).html();
        if (html !== undefined) {
            var amount = html.match(/x(\d+)/);
            if (amount) { //Something IS in the guild bank.
                var color = 'red';
                if (amount[1] >= materials[material].Amount) { color = 'green'; }
                out += Array(depth).join("\t") + "<b><span style='color: " + color + "'>" + material +
					" " + amount[1] + " / " + materials[material].Amount + "</b></span><br>";
            }
            else {
                out += Array(depth).join("\t") + "<b><span style='color: red'>" + material +
					" 0" + " / " + materials[material].Amount + "</b></span><br>";
            }
        }
        else {
            out += Array(depth).join("\t") + "<b><span style='color: red'>" + material +
				" 0" + " / " + materials[material].Amount + "</b></span><br>";
        }
        if (materials[material].SubItems !== undefined) { //If it has subitems, get to display them
            out += GetAmountsOfGuildBank(materials[material].SubItems, depth + 1);
        }
    }
    return out;
}

function GetAllPatternSkills() {
    var array = [];
    $.ajax(BASE + "/manual/patterns?show=noheader#patterns").success(function (data) {
        var trades = data.match(/manual\/patterns\/(.*?)\?/g);
        for (var tradeskill in trades) {
            var trade = trades[tradeskill].match(/patterns\/(.*?)\?/)[1];
            array.push(trade);
        }
    });
    return array;
}