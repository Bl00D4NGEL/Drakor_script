// ==UserScript==
// @name         Add all the scripts at once
// @version      1.1
// @description  Add all the scripts of Blood and be able to select it in a nice little windows in Drakor
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// @match        http://*.drakor.com/guild*
// @match        https://*.drakor.com/guild*
// @match        http://*.drakor.com/masteries*
// @match        https://*.drakor.com/masteries*
// ==/UserScript==
var scripts = 8; // CURRENT amount of scripts Bl00D4NGEL currently has. Do not modify.
var scriptList;
$(document).ready(function(){
    //If there's an entry for "script_settings" check if the amount of scripts is the same as the "right" amount
    if(!localStorage.getItem("script_settings") || Object.keys(JSON.parse(localStorage.getItem("script_settings"))).length !== scripts){
        console.log("Scripts settings not set yet or incorrect.. loading default config");
        scriptList = {
            "Battle_Statistics": ["Battle Statistics", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Battle_Statistics.js", false],
            "Ring_Tradeskill_Market": ["Ring: Tradeskill for market", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Ring_Tradeskill_Market.js", false],
            "Ring_Tradeskill_Guild": ["Ring: Tradeskill for guild", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Ring_Tradeskill_Guild.js", false],
            "Pretty_Guild_Bank": ["Beautify the guild bank", "https://rawgit.com/Bl00D4NGEL/Drakor_script/master/Pretty_Guildbank.js", false],
            "Pretty_World_Bank": ["Beautify the world bank", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Pretty_Worldbank.js", false],
            "Max_Button": ["Add a MAX button to pattern skills", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Max_Button.js", false],
            "Mastery_Scanner": ["Mastery Scanner", "https://cdn.rawgit.com/Bl00D4NGEL/Drakor_script/master/Mastery_Scanner.js", false],
            "Estate_Guild_Bank": ["Add Estate Checkers to Guild Bank", "https://rawgit.com/Bl00D4NGEL/Drakor_script/master/Estate_checking_in_guild_bank.js", false]
        };
        localStorage.setItem("script_settings",JSON.stringify(scriptList));
    }
    else{
        console.log("Script config found.. loading it up now");
        scriptList = JSON.parse(localStorage.getItem("script_settings"));
    }
    if($(".gs_topmenu")){
        //jQuery dialog to select scripts
        var fragment = document.createDocumentFragment();
        var scriptDialog = $(document.createElement("div")).attr({id: "scriptDialog"}).css("text-align", "left").appendTo(fragment);
        var infoText = $(document.createElement("span")).html("<br/><p>For more information about what each script does please visit the forum =)<br/>" +
                                                              "If you encounter any bug with any script make sure to message me in Drakor. (Bl00D4NGEL)" +
                                                              "<br/>Hope you're enjoying my work!</p>").appendTo(scriptDialog);
        var hrefShowScripts = $(document.createElement("a")).html("Blood's Scripts").attr({id: "hrefShowScripts", class: "gs_topmenu_item"}).appendTo(fragment);
        $(fragment).insertAfter($(".gs_topmenu_item").get($(".gs_topmenu_item").length -1));
        for (var k in scriptList){
            if (typeof scriptList[k] !== 'function') {
                var checkbox = $(document.createElement("input")).attr({type: "checkbox", id: k, class: "amazingCheckbox"}).insertBefore(infoText);
                var span = $(document.createElement("span")).html(scriptList[k][0] + "<br/>").insertBefore(infoText);
                if(scriptList[k][2]){
                    checkbox.checked = true;
                }
            }
        }
        $("#scriptDialog").dialog({
            autoOpen: false,
            title: "Blood's Script Collection",
            show: {
                effect: "blind",
                duration: 500
            },
            width: 500,
            height: 400
        });
        $(hrefShowScripts).on("click", function(){
            $("#scriptDialog").dialog("open");
        });
        $(".amazingCheckbox").on("click", function(e){
            var checkboxId = e.currentTarget.id;
            if(e.currentTarget.checked){ //Checkboxstatus
                console.log("Activating script " + scriptList[checkboxId][1]);
                scriptList[checkboxId][2] = true;
                AddScript(checkboxId);
            }
            else{
                console.log("Deactivating script " + scriptList[checkboxId][1]);
                scriptList[checkboxId][2] = false;
            }
            localStorage.setItem("script_settings", JSON.stringify(scriptList));
        });
    }
    for (var i in scriptList){
        if (typeof scriptList[i] !== 'function') {
            if(scriptList[i][2]){
                $("#" + i).prop('checked', true);
                AddScript(i);
            }
        }
    }
});

function AddScript(checkboxId){
    var scriptLink = scriptList[checkboxId][1];
    console.log("Adding..\"" + scriptList[checkboxId][0] + "\"");
    console.log("Link: \"" + scriptLink + "\"");
    $('head').append("<script src='" + scriptLink + "'><\/script>");
    scriptList[checkboxId][2] = true;
    localStorage.setItem("script_settings", JSON.stringify(scriptList));
}
