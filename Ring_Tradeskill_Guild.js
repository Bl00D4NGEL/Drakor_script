// ==UserScript==
// @name         Add Ring : Tradeskill
// @version      1.0
// @description  Add a new select for rings ordered by trades
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/guild*
// ==/UserScript==

$(document).ready(function () {
    if (document.getElementById("removeType") !== null) {
        var trades = [];
        var tradesAmount = [];
        var tradesDiv = [];
        //Search the gb for different ring types and puts them into arrays to work with them later on
        for (var i = 0; i < document.getElementsByClassName("centerImage").length; i++) {
            if (document.getElementsByClassName("centerImage")[i].src.indexOf("/ring") !== -1) {
                var div = document.getElementsByClassName("centerImage")[i].parentNode.parentNode;
                var itemText = div.innerHTML;
                var tradeskill = itemText.slice(itemText.indexOf("iconTitle") + 11, itemText.indexOf("iconLevel") - 18);
                if (trades.indexOf(tradeskill) === -1) {
                    trades.push(tradeskill);
                    tradesAmount.push(1);
                }
                else {
                    tradesAmount[trades.indexOf(tradeskill)]++;
                }
                tradesDiv.push(div);
            }
        }
        //Add the Ring : Tradeskill option to the select in the gb
        for (var j = 0; j < trades.length; j++) {
            AddOption(("Ring : " + trades[j] + " (" + tradesAmount[j] + ")"), "10", document.getElementById("removeType"), "");
        }


        document.getElementById("removeType").addEventListener("click", function () {
            AddRingsToSelect();
        });
    }
    /*
Determines the currently selected option and checks if it's Ring : Tradeskill, if so, proceed, otherwise do nothing
*/
    function AddRingsToSelect() {
        var selectedTrade = document.getElementById("removeType").options[document.getElementById("removeType").selectedIndex].text;
        var trade = selectedTrade.slice(selectedTrade.indexOf(":") + 2, selectedTrade.indexOf("(") - 1);
        var myTimer = setInterval(function () {
            if (selectedTrade.indexOf("Ring") !== -1 && selectedTrade.indexOf("Item : Ring") === -1) {
                document.getElementById("removeItem").options.length = 1;
                for (var k = 0; k < tradesDiv.length; k++) {
                    if (tradesDiv[k].innerHTML.indexOf(trade) !== -1) {
                        var divHTML = tradesDiv[k].innerHTML;
                        var divID = tradesDiv[k].id;
                        divID = divID.slice(4);
                        var parseValue = "item-" + divID + "-1";
                        var ringLevel = divHTML.slice(divHTML.indexOf("iconLevel") + 11, divHTML.indexOf("iconImage") - 18);
                        var ringClass = tradesDiv[k].className;
                        var ringRarity = ringClass.slice(11, ringClass.indexOf("slot_default"));
                        AddOption(("Level: " + ringLevel + " | " + ringRarity), parseValue, document.getElementById("removeItem"), ringRarity);
                    }
                }
                clearInterval(myTimer);
            }
        }, 100);

    }

    /*
Adds option with specific parameters that get parsed while calling
*/
    function AddOption(option, value, select, className) {
        var newOption = document.createElement("option");
        newOption.text = option;
        newOption.value = value;
        if (className !== "") {
            newOption.className = className;
        }
        select.add(newOption, 1);
    }
});