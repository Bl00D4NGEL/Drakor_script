// ==UserScript==
// @name         Estates for Guildbank v2
// @version      1.0
// @description  Check for Estate materials in guildbank.
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://www.drakor.com/guild
// @match        https://www.drakor.com/guild
// ==/UserScript==

var BASE = 'http://www.drakor.com';
var debug = 0;


var estates = {
    "Shack": 763,
    "House": 764,
    "Hall": 765,
    "Estate": 766,
    "Keep": 767,
    "Fort": 768,
    "Palace": 769,
    "Fortress": 888
};

var fired_ajax = 0;
$(document).ready(function () {
    $(".guildMenu").html($(".guildMenu").html() + "<br>");

    for (var estate in estates) {
        var button = $(document.createElement("button")).attr({ 'id': 'estate-' + estates[estate], 'class': 'gs_topmenu_item' }).html(estate).on("click", function (e) {
            if (e.currentTarget.id) {
                $("#estate-output").html("<h1>LOADING " + $(this).html().toUpperCase() + "...</h1>");
                var materials = {};
                var id = e.currentTarget.id.match(/(\d+)/)[1];
                GetMaterials(id, materials);
                var fired = false;
                var myTimer = setInterval(function () {
                    if (!fired && fired_ajax > 0) { fired = true; }
                    if (fired && fired_ajax === 0) {
                        Recursive_1(materials);
                        clearInterval(myTimer);
                    }
                }, 10, materials);
            }
        }).appendTo($(".guildMenu"));
    }
    $(document.createElement("div")).attr({ 'id': 'estate-output' }).insertAfter($(".guildMenu"));
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
                //Make Ajax to that pattern and check if it has a pattern
                //If it has a pattern -> Craftable
                fired_ajax++;
                $.ajax(BASE + "/show/material/" + mate_id).success(function (data) {
                    var patt_id = data.match(/patternbasic-(\d+)" class="patternWrapper patternShow greenTitle/i);
                    if (patt_id) {
                        var material = data.match(/<div.*?\[([\s\w]+)\]/)[1];
                        materials[material].PatternID = Number(patt_id[1]);
                        //console.log(materials);
                    }
                    fired_ajax--;
                });
                materials[material] = {};
                materials[material].Amount = Number(amount);
                materials[material].ID = mate_id;
            }
        }
    });
}

function GetAmountsOfGuildBank(materials) {
    var out = "<pre>";
    for (var material in materials) {
        var html = $("#mat-" + materials[material].ID).html();
        if (html !== undefined) {
            var amount = html.match(/x(\d+)/);
            if (amount) { //Something IS in the guild bank.
                var color = 'red';
                if (amount[1] >= materials[material].Amount) { color = 'green'; }
                out += "<b><span style='color: " + color + "'>" + material + " " + amount[1] + " / " + materials[material].Amount + "</b></span><br>";
            }
            else {
                out += "<b><span style='color: red'>" + material + " 0" + " / " + materials[material].Amount + "</b></span><br>";
            }
        }
        else {
            out += "<b><span style='color: red'>" + material + " 0" + " / " + materials[material].Amount + "</b></span><br>";
        }
        if (materials[material].PatternID !== undefined) {
            for (var material_2 in materials[material].Pattern) {
                var html = $("#mat-" + materials[material].Pattern[material_2].ID).html();
                if (html !== undefined) {
                    var amount = html.match(/x(\d+)/);
                    if (amount) { //Something IS in the guild bank.
                        var color = 'red';
                        if (amount[1] >= materials[material].Pattern[material_2].Amount) { color = 'green'; }
                        out += "\t<b><span style='color: " + color + "'>" + material_2 + " " + amount[1] + " / " + materials[material].Pattern[material_2].Amount + "</b></span><br>";
                    }
                    else {
                        out += "\t<b><span style='color: red'>" + material_2 + " 0" + " / " + materials[material].Pattern[material_2].Amount + "</b></span><br>";
                    }
                }
                else {
                    out += "\t<b><span style='color: red'>" + material_2 + " 0" + " / " + materials[material].Pattern[material_2].Amount + "</b></span><br>";
                }
                if (materials[material].Pattern[material_2].PatternID !== undefined) {
                    for (var material_3 in materials[material].Pattern[material_2].Pattern) {
                        var html = $("#mat-" + materials[material].Pattern[material_2].Pattern[material_3].ID).html();
                        if (html !== undefined) {
                            var amount = html.match(/x(\d+)/);
                            if (amount) { //Something IS in the guild bank.
                                var color = 'red';
                                if (amount[1] >= materials[material].Pattern[material_2].Pattern[material_3].Amount) { color = 'green'; }
                                out += "\t\t<b><span style='color: " + color + "'>" + material_3 + " " + amount[1] + " / " + materials[material].Pattern[material_2].Pattern[material_3].Amount + "</b></span><br>";
                            }
                            else {
                                out += "\t\t<b><span style='color: red'>" + material_3 + " 0" + " / " + materials[material].Pattern[material_2].Pattern[material_3].Amount + "</b></span><br>";
                            }
                        }
                        else {
                            out += "\t\t<b><span style='color: red'>" + material_3 + " 0" + " / " + materials[material].Pattern[material_2].Pattern[material_3].Amount + "</b></span><br>";
                        }
                    }
                }
            }
        }
    }
    out += "</pre>";
    $("#estate-output").html(out);
}


function Recursive_1(materials) {
    for (var material in materials) {
        if (materials[material].PatternID !== undefined) {
            materials[material].Pattern = {};
            GetMaterials(materials[material].PatternID, materials[material].Pattern);
        }
    }
    var fired = false;
    var myTimer = setInterval(function () {
        if (!fired && fired_ajax > 0) { fired = true; }
        if (fired && fired_ajax === 0) {
            Recursive_2(materials);
            clearInterval(myTimer);
        }
    }, 10, materials);
}

function Recursive_2(materials) {
    for (var material_2 in materials) {
        var mat2 = materials[material_2].Pattern;
        for (var material_2_sub in mat2) {
            if (mat2[material_2_sub].PatternID !== undefined) {
                mat2[material_2_sub].Pattern = {};
                GetMaterials(mat2[material_2_sub].PatternID, mat2[material_2_sub].Pattern);
            }
        }
    }
    var fired = false;
    var myTimer = setInterval(function () {
        if (!fired && fired_ajax > 0) { fired = true; }
        if (fired && fired_ajax === 0) {
            GetAmountsOfGuildBank(materials);
            clearInterval(myTimer);
        }
    }, 10, materials);
}