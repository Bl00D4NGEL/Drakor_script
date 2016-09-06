// ==UserScript==
// @name         Pretty guild bank
// @version      1.0
// @description  Sort the guild bank a little prettier
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/guild*
// ==/UserScript==
function Main() {
    var items = document.getElementsByClassName("world_bank");
    var gblength = document.getElementsByClassName("guildContent")[0].childNodes[3].childNodes.length;
    var guildBankContent = document.getElementsByClassName("guildContent")[0].childNodes[3];
    if (document.getElementById("displayResults") !== null) {
        gblength = document.getElementById("displayResults").childNodes[1].childNodes.length;
        guildBankContent = document.getElementById("displayResults").childNodes[1];
    }
    var fragment = document.createElement("fragment");
    var headingRing = document.createElement("span");
    headingRing.innerHTML = "<h2>Rings</h2>";
    var headingTool = document.createElement("span");
    headingTool.innerHTML = "<h2>Tools</h2>";
    var headingEnchant = document.createElement("span");
    headingEnchant.innerHTML = "<h2>Enchants</h2>";
    var headingAugment = document.createElement("span");
    headingAugment.innerHTML = "<h2>Augments</h2>";
    var headingDura = document.createElement("span");
    headingDura.innerHTML = "<h2>Durabity Scrolls</h2>";
    var headingFood = document.createElement("span");
    headingFood.innerHTML = "<h2>Food</h2>";
    var headingItem = document.createElement("span");
    headingItem.innerHTML = "<h2>Items</h2>";
    var headingTeleport = document.createElement("span");
    headingTeleport.innerHTML = "<h2>Teleports</h2>";
    var headingBattle = document.createElement("span");
    headingBattle.innerHTML = "<h2>Spells</h2>";
    console.log("gblength: " + gblength);
    for (var i = gblength - 1; i > -1; i--) {
        var imageText = document.getElementsByClassName("world_bank")[i].childNodes[3].childNodes[1].src;
        console.log("imageText: " + imageText + "\t i: " + i);
        var regRing = /\/ring/gi;
        var regTool = /tool/gi;
        var regEnchant = /enchant/gi;
        var regAugment = /\/images\/enhancements\/aug\d+\.png/;
        var regTeleport = /teleport/gi;
        var regDura = /dura/gi;
        var regFood = /food/gi;
        var regItem = /\/items/gi;
        var regBattle = /battle\/.*/gi;
        var match = imageText.match(regRing);
        if (imageText.match(regRing) !== null) {
            headingRing.appendChild(items[i]);
        }
        else if (imageText.match(regTool) !== null) {
            headingTool.appendChild(items[i]);
        }
        else if (imageText.match(regItem) !== null) {
            headingItem.appendChild(items[i]);
        }
        else if (imageText.match(regEnchant) !== null) {
            headingEnchant.appendChild(items[i]);
        }
        else if (imageText.match(regAugment) !== null) {
            headingAugment.appendChild(items[i]);
        }
        else if (imageText.match(regTeleport) !== null) {
            headingTeleport.appendChild(items[i]);
        }
        else if (imageText.match(regDura) !== null) {
            headingDura.appendChild(items[i]);
        }
        else if (imageText.match(regFood) !== null) {
            headingFood.appendChild(items[i]);
        }
        else {
            headingBattle.appendChild(items[i]);
        }
    }
    // headingRing = Sort_By_Tradeskill(headingRing, "<h2>Rings</h2>");
    // headingTool = Sort_By_Tradeskill(headingTool, "<h2>Tools</h2>");
    // headingFood = Sort_By_Food_Type(headingFood);
    fragment.appendChild(headingRing);
    fragment.appendChild(headingTool);
    fragment.appendChild(headingEnchant);
    fragment.appendChild(headingAugment);
    fragment.appendChild(headingItem);
    fragment.appendChild(headingDura);
    fragment.appendChild(headingFood);
    fragment.appendChild(headingTeleport);
    fragment.appendChild(headingBattle);
    guildBankContent.appendChild(fragment);
}
function Sort_By_Tradeskill(spanObjects, title) {
    var tradeskillsDict = {};
    var tradeskills = ["Fis", //Fishing
                       "Min", //Mining
                       "Gat", //Gathering
                       "Log", //Logging
                       "Res", //Ancient Research
                       "Dis", //Disenchanting
                       "Enc", //Enchanting
                       "Smi", //Smithing
                       "Jew", //Jewelcrafting
                       "Con", //Construction
                       "Alc", //Alchemy
                       "Ins", //Inscription
                       "Cra", //Crafting
                       "Tre", //Treasure Hunting
                       "Coo"];//Cooking
    var newSpan = document.createElement("span");
    newSpan.innerHTML = title; //Because we return a new "span" element the old title is gone
    for (var i = 0; i < tradeskills.length; i++) {
        tradeskillsDict[tradeskills[i]] = [];
        //First cut out all the elements and put them in the corresponding array
        for (var j = spanObjects.childNodes.length - 1; j > 0; j--) {
            if (spanObjects.childNodes[j].childNodes[1].innerText.indexOf(tradeskills[i]) !== -1) {
                tradeskillsDict[tradeskills[i]].push(spanObjects.removeChild(spanObjects.childNodes[j]));
            }
        }
        //After that iterate over array entries and put them back into the span
        for (var k = 0; k < tradeskillsDict[tradeskills[i]].length; k++) {
            newSpan.appendChild(tradeskillsDict[tradeskills[i]].pop());
        }
    }
    return newSpan;
}
function Sort_By_Food_Type(spanObjects) {
    var foodDict = {};
    var foodTypes = [
        "Drop",
        "Create",
        "Invis",
        "Gold",
        "Travel",
        "Treasure",
    ];
    var newSpan = document.createElement("span");
    newSpan.innerHTML = "<h2>Food</h2>"; //Because we return a new "span" element the old title is gone
    for (var i = 0; i < foodTypes.length; i++) {
        foodDict[foodTypes[i]] = [];
        //First cut out all the elements and put them in the corresponding array
        for (var j = spanObjects.childNodes.length - 1; j > 0; j--) {
            if (spanObjects.childNodes[j].childNodes[1].innerText.indexOf(foodTypes[i]) !== -1) {
                foodDict[foodTypes[i]].push(spanObjects.removeChild(spanObjects.childNodes[j]));
            }
        }
        //After that iterate over array entries and put them back into the span
        for (var k = 0; k < foodDict[foodTypes[i]].length; k++) {
            newSpan.appendChild(foodDict[foodTypes[i]].pop());
        }
    }
    return newSpan;
}
function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}
function WithdrawXAmount(removeItemElement) {

}
$(document).ready(function () {
    Main();
    $("body").on("dblclick", ".tradeMat , .world_bank", function (event) {
        console.log(event);
        var id;
        if (event.currentTarget.id) {
            id = event.currentTarget.id;
        }
        var postfix = "-1";
        var prefix = "item-";
        if (id.indexOf("mat") !== -1) {
            postfix = "-2";
            prefix = "mat-";
            if (event.ctrlKey) {
                var curAmount = event.currentTarget.childNodes[1].nodeValue.replace(/[^\d]/g, "");
                var amountInput = document.createElement("input");
                amountInput.type = "Number";
                amountInput.value = curAmount;
                amountInput.style.width = "125px";
                amountInput.style.fontSize = "12px";
                amountInput.id = "input" + id;
                amountInput.max = curAmount;
                event.currentTarget.removeChild(event.currentTarget.childNodes[1]);
                event.currentTarget.insertBefore(amountInput, event.currentTarget.childNodes[0]);
                $(event.currentTarget).on("keydown", function (event) {
                    if (event.keyCode === 13) {
                        console.log(event.currentTarget.childNodes[0].value);
                        params = {
                            removeType: "",
                            removeItem: id + postfix,
                            itemQty: event.currentTarget.childNodes[0].value
                        };
                        post("/guild/bank/withdrawal", params);
                    }
                });
                return;
            }
        }
        id = id.slice(4);
        var params = {
            removeType: "",
            removeItem: prefix + id + postfix,
            itemQty: ""
        };
        post("/guild/bank/withdrawal", params);
    });
});