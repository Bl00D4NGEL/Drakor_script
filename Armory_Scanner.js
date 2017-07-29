// ==UserScript==
// @name         Armory Scanner
// @version      1.0
// @description  Scan Armory for stats and print them out in the console
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/armory/profile/*
// @match        https://*.drakor.com/armory/profile/*
// ==/UserScript==

var cards = ["feet", "primary", "legs", "secondary", "hands", "head", "arms", "chest"];
var statNameArray = ["Hit Points", "Defense", "Heal", "Combat", "Magic", "Regen"];

var index = 0;
var augOutput = "Augment:\n";
var encOutput = "Enchant:\n";
var myTimer = setInterval(function () {
    var element = document.getElementsByClassName("equip_" + cards[index])[0];
    var id = element.id.slice(4);
    element.click();
    setTimeout(function () {
        var cardHTML = document.getElementById("card" + id).innerHTML;
        if (cardHTML.indexOf('" class="cardAugmented') !== -1) {
            var augment = cardHTML.slice(cardHTML.indexOf("aug"), cardHTML.indexOf('" class="cardAugmented'));
            document.getElementById(augment).click();
            var augmentId = augment.slice(4);
            setTimeout(function () {
                augOutput += DoStuff(augmentId);
            }, 350);
        }
        if (cardHTML.indexOf('" class="cardEnchanted') !== -1) {
            var enchant = cardHTML.slice(cardHTML.indexOf("enc"), cardHTML.indexOf('" class="cardEnchanted'));
            document.getElementById(enchant).click();
            var enchantId = enchant.slice(4);
            setTimeout(function () {
                encOutput += DoStuff(enchantId);
            }, 350);
        }
    }, 300);
    index++;
    if (index >= cards.length) {
        setTimeout(function () { console.log(augOutput + "\n" + encOutput); }, 1000);
        clearInterval(myTimer);
    }
}, 500, index);

function DoStuff(augmentId) {
    var statArray = [0, 0, 0, 0, 0, 0];
    var multi = [1, 2.5, 5, 7.5, 7.5, 12.5];
    // HP, Def, Heal, Combat, Magic, Regen
    var augmentText = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardDetail")[0].innerText;
    var augmentRarity = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardQuality")[0].innerText;
    var augmentDrop = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cDetailType")[0].innerText;
    var augmentType = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardImage")[0].getElementsByClassName("cardType")[0].innerText;
    var augmentSellValue = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardValue")[0].innerText;
    if (augmentType.indexOf(":") !== -1) {
        augmentType = augmentType.slice(augmentType.indexOf(":") + 1) + ";";
    }
    else {
        augmentType = "";
    }
    if (augmentDrop.indexOf("World") !== -1) {
        augmentDrop = "Yes;World";
    }
    else if (augmentDrop.indexOf("Arena") !== -1) {
        augmentDrop = "Yes;Arena";
    }
    else {
        augmentDrop = "No;-";
    }
    var augmentLevel = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardLevel")[0].innerText;
    augmentLevel = augmentLevel.slice(augmentLevel.indexOf(":") + 2);
    var reg = /\s*(\d*,*\d+)\s/;
    var valueData = augmentSellValue.match(reg);
    var value = valueData[1].replace(",", "");
    var augmentStats = augmentText.split("+");
    var augmentValue = 0;
    for (var k = 0; k < augmentStats.length - 1; k++) {
        var stat = augmentStats[k + 1].slice(augmentStats[k + 1].indexOf(" ") + 1, -2);
        var statValue = augmentStats[k + 1].slice(0, augmentStats[k + 1].indexOf(" "));
        var statIndex = statNameArray.indexOf(stat);
        statArray[statIndex] = statValue;
        augmentValue += statArray[statIndex] * multi[statIndex];
    }
    while (augmentValue % 2.5 !== 0) {
        augmentValue += 0.5;
    }
    var noteName = "";
    if (document.getElementById("armoryProfile") !== null) {
        noteName = document.getElementById("armoryProfile").getElementsByTagName("h2")[0].innerText;
        var pattern = /<(.*)>/;
        var matchData = noteName.match(pattern);
        noteName = matchData[1];
    }
    var myOutput = augmentLevel + ";" + augmentRarity + ";" + statArray.join(";") + ";" + augmentType + augmentDrop + ";" + noteName + ";" + augmentValue + ";" + value + "\n";
    return myOutput;
}
