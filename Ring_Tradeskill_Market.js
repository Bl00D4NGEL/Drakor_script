// ==UserScript==
// @name         Ring : Tradeskill for market
// @version      1.0
// @description  Sort rings by their tradeskill in the market
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// ==/UserScript==

var tradeskillNames = ["Fishing", "Mining", "Gathering", "Logging", "Research", "Disenchanting", "Enchanting",
                       "Smithing", "Jewelcrafting", "Construction", "Alchemy", "Inscription", "Crafting", "Cooking"];
var tradeskills = ["Fis", //Fishing
                   "Min", //Mining
                   "Gat", //Gathering
                   "Log", //Logging
                   "Anc", //Ancient Research
                   "Dis", //Disenchanting
                   "Enc", //Enchanting
                   "Smi", //Smithing
                   "Jew", //Jewelcrafting
                   "Con", //Construction
                   "Alc", //Alchemy
                   "Ins", //Inscription
                   "Cra", //Crafting
                   "Coo"];//Cooking
var tradeskillAmounts = [];
$(document).ready(function () {
    function AddRingTradeskillToSelect() {
        var selectedOption = document.getElementById("itemSel").options[document.getElementById("itemSel").selectedIndex].text;
        if (selectedOption.indexOf("Item : Ring") !== -1) {
            var cLinkTypeTimer = setInterval(function () {
                if (document.getElementsByClassName("cLinkType").length > 0) {
                    //Scan through all the rings if there are items with class "cLinkType" which each ring has
                    for (var i = 0; i < document.getElementsByClassName("cLinkType").length; i++) {
                        var ringText = document.getElementsByClassName("cLinkType")[i].innerText;
                        var tradeText = ringText.slice(ringText.indexOf("of") + 3).slice(0, 3);
                        var index = tradeskills.indexOf(tradeText);
                        if (tradeskillAmounts[index] === undefined) {
                            tradeskillAmounts[index] = 1;
                        }
                        else {
                            tradeskillAmounts[index]++;
                        }
                    }
                    //Add the Ring : Tradeskill option to the select
                    for (var j = 0; j < tradeskills.length; j++) {
                        if (tradeskillAmounts[j] > 0) {
                            AddOption(("Ring : " + tradeskillNames[j] + " (" + tradeskillAmounts[j] + ")"), "10", document.getElementById("itemSel"), "");
                        }
                    }
                    clearInterval(cLinkTypeTimer);
                }
            }, 500);
        }
    }
    function AddOption(option, value, select, className) {
        var newOption = document.createElement("option");
        newOption.text = option;
        newOption.value = value;
        if (className !== "") {
            newOption.className = className;
        }
        select.add(newOption, 1);
    }
    function DisplayRingsSortedOut() {
        var selectedTrade = document.getElementById("itemSel").options[document.getElementById("itemSel").selectedIndex].text;
        var myTimer = setInterval(function () {
            if (selectedTrade.indexOf("Ring") === 0 && document.getElementsByClassName("cLinkType").length > 0) {
                var trade = selectedTrade.slice(selectedTrade.indexOf(":") + 2, selectedTrade.indexOf(":") + 5);
                console.log(trade);
                for (var i = 0; i < document.getElementsByClassName("cLinkType").length; i++) {
                    var ringText = document.getElementsByClassName("cLinkType")[i].innerText;
                    var tradeText = ringText.slice(ringText.indexOf("of") + 3).slice(0, 3);
                    if (tradeText !== trade) {
                        document.getElementsByClassName("cLinkType")[i].parentNode.parentNode.parentNode.style.display = "none";
                    }
                }
                clearInterval(myTimer);
            }
        }, 500);
    }
    var myTimer = setInterval(function () {
        if (document.getElementsByClassName("searchBtn bv_button bv_small_font").length > 0) {
            document.getElementsByClassName("searchBtn bv_button bv_small_font")[0].addEventListener("click", function () {
                DisplayRingsSortedOut();
                AddRingTradeskillToSelect();
            });
            document.getElementById("itemSel").addEventListener("click", function () {
            });
            clearInterval(myTimer);
        }
    }, 500);

});