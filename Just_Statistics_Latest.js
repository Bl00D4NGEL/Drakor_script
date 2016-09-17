// ==UserScript==
// @name         Just statistics v1.71
// @version      1.71
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// ==/UserScript==

/*
Variable declaration
PS: Global vars are ugly
*/
var version = "v1.71";
console.log("You're currently using version " + version);
//Variable declaration; getting the data out of local storage
var thenLength =  0;//This is to prevent the interval to loop over the drop more than once
var displayNerdStuff = RetrieveVariable("displayNerdStuff", false, false);
var totalStatistics = RetrieveVariable("totalStatistics", false, displayNerdStuff);
var popAlert = RetrieveVariable("popAlert", false, displayNerdStuff);
var runLog = RetrieveVariable("runLog", "true", displayNerdStuff);
var totalExp = Number(RetrieveVariable("totalExp", 0, displayNerdStuff));
var maxMulti = Number(RetrieveVariable("maxMulti", 0, displayNerdStuff));
var collected = Number(RetrieveVariable("collected", 0, displayNerdStuff));
var totalAttempts = Number(RetrieveVariable("totalAttempts", 0, displayNerdStuff));
var totalGold = Number(RetrieveVariable("totalGold", 0, displayNerdStuff));
var materialOutput = RetrieveVariable("materialOutput","",displayNerdStuff);
var multiOutput = RetrieveVariable("multiOutput","",displayNerdStuff);
var miscOutput = RetrieveVariable("miscOutput","",displayNerdStuff);
var expOutput = RetrieveVariable("expOutput","",displayNerdStuff);
var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary", "Nothing"];

// Array declaration; getting the data out of local storage
var raritiesCollected = [];
var amountMaterials = [];	//Array for how much of the item that dropped/ has been created was dropped/made exactly
var gainedMaterials = [];	//Same as "amountMaterials" just for the name storage (I might change this to a dictionary at some point)
var multiCollections = [];
for(var rarity =0; rarity<rarities.length; rarity++){
    raritiesCollected[rarity] = Number(RetrieveVariable(("rarity" +rarity), 0, displayNerdStuff));
}
for(var multiCollection = 0; multiCollection < maxMulti; multiCollection++){
    multiCollections[multiCollection] = Number(RetrieveVariable(("multiCollection" + multiCollection), 0, displayNerdStuff));
}
for(var item = 0; item < collected; item++){
    amountMaterials[item] = Number(RetrieveVariable(("amountMaterials" + item), 0, displayNerdStuff));
    gainedMaterials[item] = RetrieveVariable(("gainedMaterials" + item), "", displayNerdStuff);
}

// Object declaration; getting the data out of local storage
var materialDic = {};
var multiDic = {};
for(var materialDiCEntry = 0; materialDiCEntry < collected; materialDiCEntry++){
    var materialDicName = ("materialDic_"+ GetStorageVariable(("gainedMaterials"+materialDiCEntry))); //String built to reduce length of following line
    var materialName = GetStorageVariable(("gainedMaterials"+materialDiCEntry)); //String built to reduce length of following line
    materialDic[materialName] = RetrieveVariable(materialDicName, "", displayNerdStuff);
}
for(var multiDiCEntry = 0; multiDiCEntry < maxMulti; multiDiCEntry++){
    multiDic[multiDiCEntry] = RetrieveVariable(("multiDic_" + multiDiCEntry), "", displayNerdStuff);
}
$(document).ready(function(){
    var hrefShowLog = $(document.createElement("a")).attr({id: "hrefShowLog", innerHTML: "Show Log", href: "#logDiv", className: "gs_topment_item"}).appendTo("#gs_topmenu");
//    $(".fancybox").fancybox();
    SetupLog();
});

function GetDate(){
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var newdate = year + "/" + month + "/" + day;
    return newdate;
}
function SortMultisInSelect(){
    document.getElementById("selectLogMulti").options.length = 1;
    for(var j=0;j<multiCollections.length;j++){
        if(multiCollections[j] !== undefined && multiCollections[j] > 0 ){
            AddOption(j, document.getElementById("selectLogMulti"));
        }
    }
}
function ChangeTitle(){
    var foodBuffInfo = "[NBA] ";
    if(document.getElementsByClassName("drIcon cardNone slot_default").length === 0){
        foodBuffInfo = "[BA] ";
    }
    else
    {
        foodBuffInfo = "[NBA] ";
    }
    if(document.getElementsByClassName("nodeRemaining").length > 0){
        var nodePercentText = document.getElementsByClassName("nodeRemaining")[0].innerText.slice(0, document.getElementsByClassName("nodeRemaining")[0].innerText.indexOf("%")+1);
        var skillResultsText = document.getElementById("skillResults").innerText;
        if(skillResultsText.indexOf("depleted") !== -1){
            document.getElementsByTagName("title")[0].innerText = foodBuffInfo +"Node depleted";
            console.log("Node depleted");
            if(RetrieveVariable("popAlert", false, displayNerdStuff) === "true"){
                alert("Node depleted");
            }
            MainLoop();
        }
        else {
            console.log(document.getElementsByClassName("nodeRemaining")[0].innerText);
            document.getElementsByTagName("title")[0].innerText = foodBuffInfo + nodePercentText + " left";
        }
    }
    else if(document.getElementsByClassName("titleHeader").length > 0){ //If you're not working on a node but on a pattern
        if(document.getElementsByClassName("titleHeader")[0].innerText.indexOf("x0..") !== -1){
            document.getElementsByTagName("title")[0].innerText = foodBuffInfo + "Creation complete";
            if(RetrieveVariable("popAlert", false, displayNerdStuff) === "true"){
                alert("Creation complete");
            }
        }
        else{
            document.getElementsByTagName("title")[0].innerText = foodBuffInfo + document.getElementsByClassName("titleHeader")[0].innerText.slice(document.getElementsByClassName("titleHeader")[0].innerText.indexOf("]")+ 1);
        }
    }
    else{
        console.log("Not creating or collecting something right now");
        document.getElementsByTagName("title")[0].innerText = 'Drakor "Innovative & Unique Browser Based RPG." (PBBG, MPOG, MMORPG) [BETA]';
    }
}
function GetAttemptsToNextLevel(avgExp){
    var maxLevel = document.getElementById("setMaxLevel").value;
    var currentLevel = Number(document.getElementsByClassName("skillLevel")[0].innerText.slice(6));
    if(!isNaN(avgExp) && document.getElementById("expDiv") !== null){
        var output = "";
        if(currentLevel < maxLevel){
            var expText = document.getElementsByClassName("expBar")[0].innerText;
            var currExp = Number((expText.slice(5, expText.indexOf("/")-1)).replace(",",""));
            var expToLevel = Number((expText.slice(expText.indexOf("/")+2,expText.indexOf("(")-1)).replace(",",""));
            var expLeft = expToLevel-currExp;
            var attemptsToLevel = Math.floor(expLeft/avgExp);
            var timeToLevelInMs = attemptsToLevel * 60000;
            console.log();
            output = "<p>Exp left to level: <b>" + expLeft + "</b></br>Average attempts to level: <b>" + attemptsToLevel + "</b></br>Estimated time to level-up: <b>" + ConvertIntoSmallerTimeFormat(timeToLevelInMs) + "</b></p>";
        }
        else{
            output = "<span style='color:#F00'><b>You're currently not able to level-up since you're max-level.</b></span>";
        }
        document.getElementById("expDiv").innerHTML = output;
        SetStorageVariable("expOutput",output,displayNerdStuff);
    }
}

/*
This is to build up the text of the "Rarities div" in the log thingie
*/
function DisplayRarities(){
    var rarityLog = document.getElementById("rarityDiv");
    rarityLog.innerHTML = "<b>Rarities collected: </b>";
    if(totalAttempts > 0){
        var colorArray = ["#999", "#48c730", "#2f84c7", "#bd33de", "#f14c02", "#0aa"]; //Colors of each rarity ordered by common -> legendary -> nothing
        for(var rarity = 0; rarity<rarities.length;rarity++){
            rarityLog.innerHTML += "<p style='color:" + colorArray[rarity] + "'>" + rarities[rarity] + ": " + raritiesCollected[rarity] + "/" + totalAttempts + " " + (100*(raritiesCollected[rarity]/totalAttempts)).toFixed(1) +  "%</p>";
        }
    }
    else{
        rarityLog.innerHTML = "No rarity-data found";
    }
}
/*
timeInMs gets calculated down to hours, minutes and seconds and gets output as a string
example ConvertIntoSmallerTimeFormat(3600000) [1 hour in milliseconds]
output: 1 Hour(s) 0 Minute(s) 0 Second(s)
*/
function ConvertIntoSmallerTimeFormat(timeInMs){
    output = "";
    milliseconds = timeInMs % 1000;
    timeInMs -= milliseconds;
    timeInMs = timeInMs / 1000;
    if(timeInMs > 0){
        seconds = timeInMs % 60;
        output = " and " + seconds + " Second(s)" + output;
        timeInMs -= seconds;
        timeInMs = timeInMs / 60;
        if(timeInMs > 0){
            minutes = timeInMs % 60;
            output = minutes + " Minute(s) " + output;
            timeInMs -= minutes;
            timeInMs = timeInMs / 60;
            if(timeInMs > 0){
                hours = timeInMs % 24;
                output = hours + " Hour(s) " + output;
                timeInMs -= hours;
                timeInMs = timeInMs / 24;
                if(timeInMs > 0){
                    output = timeInMs + " Days " + output;
                }
            }
        }
    }
    return output;
}

/*
varName = variable name to look for in localstorage
createValueIfNotExist = variable value to save in the loca storage
boolShow = Show the loading/ saving in the console.
*/
function RetrieveVariable(varName, createValueIfNotExist, boolShow){
    if(Boolean(GetStorageVariable(varName))){
        varName = GetStorageVariable(varName, boolShow);
    }
    else{
        varName = SetStorageVariable(varName, createValueIfNotExist, boolShow);
    }
    return varName;
}

/*
takes the variable name to look for as an argument, return the value of the variable, if there is one
boolShow: If the function is called and boolShow is true, the console will log the localstorage-loading, if not(false, omitted), it won't
*/
function GetStorageVariable(varName, boolShow){
    var output =  localStorage.getItem(varName);
    if(boolShow=== "true"){
        console.log("local storage -> " + varName + " - Result: " + output);
    }
    return output;
}

/*
Takes the variable name to save as and the value to save with the variable as arguments and writes them to the loca storage
boolShow: If the function is called and boolShow is true, the console will log the localstorage-writing, if not(false, omitted), it won't
*/
function SetStorageVariable(varName, varValue, boolShow){
    localStorage.setItem(varName, varValue);
    if(boolShow === "true"){
        console.log(varName  + " -> local storage - Value: " + varValue);
    }
    return varValue;
}

/*
This function updates the log over the rarity-bar whenever the select has changed it's object
The printed log gets built up in the interval each time something is collected
*/
function UpdateHistory(){
    var materialValue = materialDic[document.getElementById("selectLogMaterial").value];
    var multiValue = multiDic[document.getElementById("selectLogMulti").value];
    if(materialValue !== undefined){
        document.getElementById("materialDivSelect").innerHTML = materialValue;
    }
    else{
        document.getElementById("materialDivSelect").innerHTML = "";
    }
    if(multiValue !== undefined){
        document.getElementById("multiDivSelect").innerHTML = multiValue;
    }
    else{
        document.getElementById("multiDivSelect").innerHTML = "";
    }
}
function SetStatusOfScript(button){
    if(RetrieveVariable("runLog", false, displayNerdStuff) === "false"){
        button.innerHTML = "Script running";
        runLog = SetStorageVariable("runLog", "true", true);
    }
    else{
        button.innerHTML = "Script paused";
        runLog = SetStorageVariable("runLog", "false", true);
    }

}
/*
Simple and self-explaining function:
Adds an option to the select, option = thing to add to the select, select = select to add to, gets called if the collected material/multi hasn't been added yet
*/
function AddOption(option, select){
    var newOption = document.createElement("option");
    newOption.text= option;
    newOption.value = option;
    select.add(newOption);
}

/*
This sets up the collection log("rarity-bar", checkBox to keep totalStatistics or, the reset button and anything else)
*/
function SetupLog(){
    var hrefShowLog = document.getElementById("hrefShowLog");
    var checkBoxTotalStatistics = document.createElement("input");
    var checkBoxNerdStuff = document.createElement("input");
    var checkBoxAlert = document.createElement("input");
    checkBoxTotalStatistics.type = "checkbox";
    checkBoxTotalStatistics.id = "checkBoxTotalStatistics";
    checkBoxNerdStuff.type = "checkbox";
    checkBoxNerdStuff.id = "checkBoxNerdStuff";
    checkBoxAlert.type = "checkbox";
    checkBoxAlert.id = "checkBoxAlert";
    var checkBoxTotalStatisticsText = document.createElement("small");
    var checkBoxNerdStuffText = document.createElement("small");
    var checkBoxAlertText = document.createElement("small");
    checkBoxTotalStatisticsText.innerHTML = "Track total statistics? </br>";
    checkBoxNerdStuffText.innerHTML = "Display the nerdy things in the console? </br>";
    checkBoxAlertText.innerHTML = "Put you to the Drakor page when your node runs out/attempts are completed?</br>";
    var emptyLine = document.createElement("small");
    emptyLine.innerHTML = "</br>";
    var buttonPauseScript = document.createElement("button");
    var buttonPauseScriptText = document.createTextNode("Pause script?");
    buttonPauseScript.appendChild(buttonPauseScriptText);
    buttonPauseScript.id = "buttonPauseScript";
    var buttonResetStatistics = document.createElement("button");
    var buttonResetStatisticsText = document.createTextNode("Reset Statistics");
    buttonResetStatistics.appendChild(buttonResetStatisticsText);
    buttonResetStatistics.id = "buttonResetStatistics";
    var buttonShowLocal = document.createElement("button");
    var buttonShowLocalText = document.createTextNode("Show localStorage values in the console");
    buttonShowLocal.appendChild(buttonShowLocalText);
    buttonShowLocal.id = "buttonShowLocal";
    var buttonShowVars = document.createElement("button");
    var buttonShowVarsText = document.createTextNode("Show variable values in the console");
    buttonShowVars.appendChild(buttonShowVarsText);
    buttonShowVars.id = "buttonShowVars";
    var selectLogMaterial = document.createElement("select");
    var selectLogMulti = document.createElement("select");
    selectLogMaterial.style.fontSize = "14px";
    selectLogMulti.style.fontSize = "14px";
    selectLogMaterial.style.padding = "4px";
    selectLogMulti.style.padding = "4px";
    selectLogMaterial.id = "selectLogMaterial";
    selectLogMulti.id = "selectLogMulti";
    var logDiv = document.createElement("div");
    logDiv.style.fontSize = "14px";
    logDiv.style.backgroundColor = "lightgrey";
    logDiv.style.display = "none";
    logDiv.id = "logDiv";
    logDiv.title = "Drop Log";
    logDiv.innerHTML ='<ul><li><a href="#materialDiv">Drops/ Creations</a></li>'+
        '<li><a href ="#multiDiv">Multis</a></li>' +
        '<li><a href ="#miscDiv">Miscellaneous</a></li>' +
        '<li><a href ="#rarityDiv">Rarites</a></li>'+
        '<li><a href ="#optionDiv">Options</a></li>'+
        '<li><a href ="#helpDiv">Help(WIP)</a></li></ul>';
    var materialDiv = document.createElement("div");
    var materialDivText = document.createElement("label");
    var materialDivSelect = document.createElement("label");
    materialDivSelect.id = "materialDivSelect";
    materialDivSelect.style.textAlign = "left";
    materialDivSelect.style.display= "inherit";
    materialDivText.id = "materialDivText";
    materialDivText.style.textAlign = "left";
    materialDivText.style.display= "inherit";
    materialDiv.id = "materialDiv";
    var multiDiv = document.createElement("div");
    var multiDivText = document.createElement("label");
    var multiDivSelect = document.createElement("label");
    multiDivSelect.id = "multiDivSelect";
    multiDivSelect.style.textAlign = "left";
    multiDivSelect.style.display= "inherit";
    multiDivText.id = "multiDivText";
    multiDivText.style.textAlign = "left";
    multiDivText.style.display= "inherit";
    multiDiv.id = "multiDiv";
    var miscDiv = document.createElement("div");
    miscDiv.id = "miscDiv";
    miscDiv.style.textAlign = "left";
    miscDiv.style.display= "inherit";
    var miscDivText = document.createElement("label");
    miscDivText.id = "miscDivText";
    miscDivText.style.display= "inherit";
    miscDivText.style.textAlign = "left";
    var rarityDiv = document.createElement("label");
    rarityDiv.style.textAlign = "center";
    rarityDiv.id = "rarityDiv";
    rarityDiv.style.fontSize = "14px";
    var optionDiv = document.createElement("div");
    optionDiv.id = "optionDiv";
    var maxLevelLabel = document.createElement("label");
    maxLevelLabel.innerHTML = "Set Max Level";
    var maxLevel = document.createElement("input");
    maxLevel.type = "number";
    maxLevel.id = "setMaxLevel";
    maxLevel.min = 1;
    maxLevel.value = 50;
    maxLevel.style.textAlign = "center";
    maxLevel.style.width = "35px";
    var helpDiv = document.createElement("div");
    helpDiv.id = "helpDiv";
    helpDiv.innerHTML ="<h5>What does that [NBA] and [BA] mean in front of my title?</h5>" +
        "<p>Basic explanation of the tags are: </br>" +
        "[NBA] = No Buff Active - [BA] = Buff Active </br>" +
        "This means that it will basically display if you currently got a food buff active or not.</p></br>" +
        "<h5>Can I contribute in any way?</h5>" +
        "<p>Sure! If you got any suggestion feel free to message Bl00D4NGEL with it. </br>" +
        "Can I help with this help file? </br>" +
        "Sure thing. Just message Bl00D4NGEL once again with any idea of what could be added to this.</p>";
    logDiv.appendChild(helpDiv);
    logDiv.appendChild(rarityDiv);
    logDiv.appendChild(optionDiv);
    logDiv.appendChild(materialDiv);
    logDiv.appendChild(multiDiv);
    logDiv.appendChild(miscDiv);
    var expDiv = document.createElement("div");
    expDiv.fontSize = "14px";
    expDiv.style.display= "inherit";
    expDiv.style.textAlign = "left";
    expDiv.id = "expDiv";
    var fragment = document.createDocumentFragment();
    var fragmentContent = [checkBoxTotalStatistics,checkBoxTotalStatisticsText,
                           checkBoxNerdStuff,checkBoxNerdStuffText,
                           checkBoxAlert, checkBoxAlertText,
                           selectLogMulti, selectLogMaterial,
                           buttonResetStatistics, buttonShowLocal,buttonShowVars,
                           logDiv];
    for(var k=0;k<fragmentContent.length;k++){
        fragment.appendChild(fragmentContent[k]);
    }
    document.getElementById("gs_topmenu").appendChild(fragment);
    multiDiv.appendChild(multiDivText);
    multiDiv.appendChild(selectLogMulti);
    multiDiv.appendChild(multiDivSelect);
    materialDiv.appendChild(materialDivText);
    materialDiv.appendChild(selectLogMaterial);
    materialDiv.appendChild(materialDivSelect);
    miscDiv.appendChild(miscDivText);
    miscDiv.appendChild(expDiv);
    optionDiv.appendChild(checkBoxTotalStatistics);
    optionDiv.appendChild(checkBoxTotalStatisticsText);
    optionDiv.appendChild(checkBoxNerdStuff);
    optionDiv.appendChild(checkBoxNerdStuffText);
    optionDiv.appendChild(checkBoxAlert);
    optionDiv.appendChild(checkBoxAlertText);
    optionDiv.appendChild(maxLevelLabel);
    optionDiv.appendChild(maxLevel);
    optionDiv.appendChild(emptyLine);
    optionDiv.appendChild(buttonResetStatistics);
    optionDiv.appendChild(emptyLine);
    optionDiv.appendChild(buttonPauseScript);
    optionDiv.appendChild(emptyLine);
    optionDiv.appendChild(buttonShowLocal);
    optionDiv.appendChild(emptyLine);
    optionDiv.appendChild(buttonShowVars);
    $("#logDiv").tabs();
    $("#logDiv").dialog({
        autoOpen: false,
        show: {
            effect: "blind",
            duration: 500
        },
        width: 700,
        height: 400
    });
    hrefShowLog.addEventListener("click", function(){
        $("#logDiv").dialog("open");
    });
    checkBoxTotalStatistics.addEventListener("click", function(){
        WriteCheckboxStatus(checkBoxTotalStatistics, "totalStatistics");
    }, checkBoxTotalStatistics);
    checkBoxNerdStuff.addEventListener("click", function(){
        WriteCheckboxStatus(checkBoxNerdStuff, "displayNerdStuff");
    }, checkBoxNerdStuff);
    checkBoxAlert.addEventListener("click", function(){
        WriteCheckboxStatus(checkBoxAlert, "popAlert");
    }, checkBoxAlert);
    buttonResetStatistics.addEventListener("click", function(){
        ResetStatistics();
    });
    buttonShowLocal.addEventListener("click", function(){
        for(var i=0;i<localStorage.length;i++){
            var key = localStorage.key(i);
            var value = localStorage[key];
            console.log(key + " => " + value);
        }
    });
    buttonShowVars.addEventListener("click", function(){
        console.log("gainedMaterials: " + gainedMaterials + "\namountMaterials: " + amountMaterials + "\nmultiCollections: " + multiCollections + "\nMaterialDictionary:\n");
        for(var i=0; i<collected;i++){
            console.log("Key: " + gainedMaterials[i] + " => Value: " + materialDic[gainedMaterials[i]] + "\n");
        }
        console.log("multiDictionary:\n");
        for(var j=0; j<multiCollection;j++){
            console.log("Key: " + multiCollections[i] + " => Value: " + multiDic[multiCollections[i]]);
        }
    });
    selectLogMaterial.addEventListener("change",function(){
        UpdateHistory();
    });
    selectLogMulti.addEventListener("change",function(){
        UpdateHistory();
    });
    buttonPauseScript.addEventListener("click", function(){
        SetStatusOfScript(buttonPauseScript);
    });
    if(RetrieveVariable("totalStatistics", false, displayNerdStuff) === "true"){
        checkBoxTotalStatistics.checked = true;
    }
    else{
        checkBoxTotalStatistics.checked = false;
        ResetStatistics();
    }
    if(RetrieveVariable("displayNerdStuff", false, displayNerdStuff) === "true"){
        checkBoxNerdStuff.checked = true;
    }
    else{
        checkBoxNerdStuff.checked = false;
    }
    if(RetrieveVariable("popAlert", false, displayNerdStuff) === "true"){
        checkBoxAlert.checked = true;
    }
    else{
        checkBoxAlert.checked = false;
    }
    selectLogMaterial.innerHTML = "";
    selectLogMulti.innerHTML = "";
    AddOption("Select a material",  document.getElementById("selectLogMaterial"));
    AddOption("Select a multi",  document.getElementById("selectLogMulti"));
    /*
    This will only trigger if totalStatistics is true.
    The selects won't keep their data because the log gets rebuilt for each node...
    Therefore I needed to "hard-code" this on
    */
    for(var i=0; i<gainedMaterials.length;i++){
        AddOption(gainedMaterials[i], document.getElementById("selectLogMaterial"));
    }
    materialDivText.innerHTML = RetrieveVariable("materialOutput", "", displayNerdStuff); //print output to the html of that div
    multiDivText.innerHTML =  RetrieveVariable("multiOutput", "", displayNerdStuff); //print output to the html of that div
    miscDivText.innerHTML =  RetrieveVariable("miscOutput", "", displayNerdStuff); //print output to the html of that div
    expDiv.innerHTML =  RetrieveVariable("expOutput", "", displayNerdStuff); //print output to the html of that div
    SortMultisInSelect();
    MainLoop();
    DisplayRarities();
}

/*
If someone clicks on a checkBox this gets executed
Takes two argument, the checkbox that got clicked and the associated variable that should be written into localstorage
*/
function WriteCheckboxStatus(checkBox, variableToChange){
    SetStorageVariable(variableToChange, checkBox.checked, "true");
}

/*
Pretty self-explaining. It basically resets the variables to their base state.
This only gets triggered by the reset-button (id=buttonResetStatistics) and every time the log gets built if the "totalStatistics" variable is set to false
*/
function ResetStatistics(){
    localStorage.clear(); //Clear the local storage and set all the vars to their base value after
    displayNerdStuff = SetStorageVariable("displayNerdStuff", document.getElementById("checkBoxNerdStuff").checked, displayNerdStuff);
    totalExp = Number(SetStorageVariable("totalExp", 0, displayNerdStuff));
    runLog = SetStorageVariable("runLog", true, displayNerdStuff);
    thenLength = Number(SetStorageVariable("thenLength", 0, displayNerdStuff));			//This is to prevent the interval to loop over the drop more than once
    totalAttempts = Number(SetStorageVariable("totalAttempts", 0, displayNerdStuff));
    maxMulti = Number(SetStorageVariable("maxMulti", 0, displayNerdStuff));
    collected = Number(SetStorageVariable("collected", 0, displayNerdStuff));
    totalGold = Number(SetStorageVariable("totalGold", 0, displayNerdStuff));
    for(var rarity = 0; rarity<rarities.length; rarity++){
        raritiesCollected[rarity] = Number(SetStorageVariable(("rarity" +rarity), 0, displayNerdStuff));
    }
    multiCollections = [];
    amountMaterials = [];
    gainedMaterials = [];
    materialDic = {};
    multiDic = {};
    rarities = ["Common", "Superior", "Rare", "Epic", "Legendary", "Nothing"];
    totalStatistics = SetStorageVariable("totalStatistics", document.getElementById("checkBoxTotalStatistics").checked, displayNerdStuff);
    popAlert = SetStorageVariable("popAlert", document.getElementById("checkBoxAlert").checked, displayNerdStuff);
    document.getElementById("selectLogMulti").options.length = 1;
    document.getElementById("selectLogMaterial").options.length = 1;
    document.getElementById("materialDivSelect").innerHTML = "";
    document.getElementById("multiDivSelect").innerHTML = "";
    document.getElementById("materialDivText").innerHTML = "";
    document.getElementById("multiDivText").innerHTML = "";
    document.getElementById("miscDivText").innerHTML = "";
    document.getElementById("expDiv").innerHTML = "";
    DisplayRarities();
    console.log("Everything has been re-set");
}

/*
Simple function to parse in a string and then return the same string just with blank spaces, plus signs and brackets removed.
*/
function createAmountString(stringtoBeConverted){
    stringtoBeConverted = stringtoBeConverted.replace(" ","");
    stringtoBeConverted = stringtoBeConverted.replace("+","");
    stringtoBeConverted = stringtoBeConverted.replace("(","");
    return stringtoBeConverted;
}
/*
Parameters:
materialName: Name of the material that got dropped (White Pine) If nothing drops parse "Nothing"
materialAmount: Amount of the material dropped (3) If nothing drops, parse a 0
materialRarity: What rarity the dropped item has -> "Common", "Superior" and so on If nothing got dropped, parse "" and the function will auto-sort that out
expAmount: Amount of exp that dropped
dropLog: Should be like this: You found [White Pine] x3(+2 Mastery)
timeOfDrop: When the drop happened (This is mainly for the log)
numberOfAttempt: If you've collected resource twice on this node, the counter is 2, if collected three time it's 3 and so on
droppedGold: Integer of the gold that dropped, if none has dropped parse anything that is NaN or parse 0
example call:
AddData("White Pine", 2, "Common", 20, [White Pine] x2(+1 Mastery), 11:34:46, 1, 55);
*/
function AddData(materialName, materialAmount, materialRarity, expAmount, droplog, timeOfDrop, numberOfAttempt, droppedGold){
    if(isNaN(materialAmount) || isNaN(expAmount) || isNaN(droppedGold)){
        materialAmount = -1;
        expAmount = 0;
        droppedGold = 0;
    }
    if(materialName.indexOf(":") !== -1){
        materialName = "Invalid Drop/Creation";
    }
    var myDate = GetDate();
    var displayNerdStuff = GetStorageVariable("displayNerdStuff",false);
    var filterMaterial = materialName;
    var totalAttempts = SetStorageVariable("totalAttempts", (totalAttempts+1), displayNerdStuff);
    var totalGold = Number(SetStorageVariable("totalGold", Number(totalGold+droppedGold), displayNerdStuff));
    totalExp += Number(expAmount);
    totalExp = SetStorageVariable("totalExp", totalExp, displayNerdStuff);
    var avgExp = Math.round(totalExp / totalAttempts);
    var avgGold = Math.round(totalGold / totalAttempts);
    materialOutput = "<p>You have collected...</p>";
    numberOfAttempt = Number(numberOfAttempt);
    if(materialAmount === 0 || materialName === "Nothing" || materialRarity === "Nothing"){
        materialAmount = 0;
        materialName = "Nothing";
        materialRarity = "Nothing";
    }
    if(gainedMaterials.indexOf(materialName) == -1){ //If the collected material is not in the gainedMaterials array, the indexOf returns -1, thus it adds this variable to the array and everything else
        gainedMaterials.push(materialName);
        amountMaterials.push(0);
        AddOption(materialName,  document.getElementById("selectLogMaterial"));
        materialDic[materialName] = "<p>" + myDate + " " + timeOfDrop + " - " + droplog + "</p>";
        SetStorageVariable(("materialDic_" + materialName), materialDic[materialName], displayNerdStuff);
    }
    else{
        materialDic[materialName] += "<p>" + myDate + " " + timeOfDrop + " - " + droplog + "</p>";
        SetStorageVariable(("materialDic_" + materialName), materialDic[materialName], displayNerdStuff);
    }

    if(collected < gainedMaterials.length){
        collected = Number(SetStorageVariable("collected", gainedMaterials.length, displayNerdStuff));
    }
    if(materialAmount === 0){ //If nothing dropped, execute this
        if( $("#selectLogMulti option[value='0']").length === 0){ // "nothing" as an option for multi if it is not present already
            AddOption(materialAmount, document.getElementById("selectLogMulti"));
            multiCollections[materialAmount] = 1;
            amountMaterials[gainedMaterials.indexOf("Nothing")] = SetStorageVariable(("amountMaterials" + gainedMaterials.indexOf("Nothing")), 0, displayNerdStuff);
            SetStorageVariable(("multiCollection" + materialAmount), multiCollections[materialAmount], displayNerdStuff);
            multiDic[materialAmount] = "<p>" + myDate + " " + timeOfDrop +  " - You didn't find anything.</p>";
            SetStorageVariable(("multiDic_" + materialAmount), multiDic[materialAmount], displayNerdStuff);
            SortMultisInSelect();
        }
        else{
            multiCollections[materialAmount]++;
            amountMaterials[gainedMaterials.indexOf("Nothing")] += 1;
            SetStorageVariable(("amountMaterials" + gainedMaterials.indexOf("Nothing")), amountMaterials[gainedMaterials.indexOf("Nothing")], displayNerdStuff);
            SetStorageVariable(("multiCollection" + materialAmount), multiCollections[materialAmount], displayNerdStuff);
            multiDic[materialAmount] += "<p>" + myDate + " " + timeOfDrop +  " - You didn't find anything.</p>";
            SetStorageVariable(("multiDic_" + materialAmount), multiDic[materialAmount], displayNerdStuff);
        }
    }
    else if(multiCollections[materialAmount] === undefined || multiCollections[materialAmount] === 0){
        // console.log("multiCollections before: " + multiCollections[materialAmount]);
        multiCollections[materialAmount] = 1;
        SetStorageVariable(("multiCollection" + materialAmount), multiCollections[materialAmount], displayNerdStuff);
        AddOption(materialAmount, document.getElementById("selectLogMulti"));
        multiDic[materialAmount] = "<p>" + myDate + " " + timeOfDrop +  " - " + droplog + "</p>";
        SetStorageVariable(("multiDic_" + materialAmount), multiDic[materialAmount], displayNerdStuff);
        SortMultisInSelect();
    }
    else{
        multiCollections[materialAmount]++;
        SetStorageVariable(("multiCollection" + materialAmount), multiCollections[materialAmount], displayNerdStuff);
        multiDic[materialAmount] += "<p>" + myDate + " " + timeOfDrop +  " - " + droplog + "</p>";
        SetStorageVariable(("multiDic_" + materialAmount), multiDic[materialAmount], displayNerdStuff);
    }
    if(droplog.indexOf("anything") !== -1){
        amountMaterials[gainedMaterials.indexOf("Nothing")] = multiCollections[0];
        SetStorageVariable(("amountMaterials" + gainedMaterials.indexOf("Nothing")), amountMaterials[gainedMaterials.indexOf("Nothing")], displayNerdStuff);
        SetStorageVariable(("gainedMaterials" + gainedMaterials.indexOf("Nothing")), "Nothing", displayNerdStuff);
    }
    for(var i=0; i<gainedMaterials.length; i++){ //This for-loop is to get the amount that was gathered/created and afterwards puts it into the output string.
        if(droplog.indexOf(gainedMaterials[i]) != -1){
            amountMaterials[i] += Number(materialAmount);
            SetStorageVariable(("amountMaterials" + i), amountMaterials[i], displayNerdStuff);
            SetStorageVariable(("gainedMaterials" + i), gainedMaterials[i], displayNerdStuff);
        }
        materialOutput += "<p>"+ gainedMaterials[i] + " x" + amountMaterials[i] + "</p>"; //General output of resource collected
    }
    if(maxMulti < multiCollections.length){ //Only if the maxMulti is lower than the actual multiColletions array -> write to local storage
        maxMulti = Number(SetStorageVariable("maxMulti", multiCollections.length, displayNerdStuff));
    }
    var avgMaterials = 0; //Reset this to 0 to avoid wrong output (Would get way too high if not re-set)
    multiOutput = "";
    //This adds up the total multi-collections or -creations that you have achieved and finally add it to the output
    for(var j=0;j<multiCollections.length;j++){
        if(multiCollections[j] !== 0 && multiCollections[j] !== undefined){
            multiOutput += "<p>You found/created a material x"+ j + " " + multiCollections[j] + " time(s). (" + (multiCollections[j]/totalAttempts*100).toFixed(1) + "%)</p>";
            avgMaterials += (j) * multiCollections[j];
        }
    }
    avgMaterials = (avgMaterials / totalAttempts).toFixed(2);
    miscOutput = "<p>You have gained " + totalExp + " total experience(" + avgExp + " average experience)</p><p>You have collected " +
        totalGold + " total gold(" + avgGold  + " average gold)</p><p>Average materials collected/created: " + avgMaterials +
        "</p><p>Total collection attempts/creations on this node/pattern: " + numberOfAttempt + "</p><p>Total collection attempts/creations in general: " + totalAttempts + "</p>";
    for(var  k=0;k<rarities.length;k++){ //for-loop iterates how many materials of each rarity have been collected.
        if(materialRarity === rarities[k]){
            raritiesCollected[k]++;
            SetStorageVariable(("rarity" + k), raritiesCollected[k], displayNerdStuff);
        }
    }
    SetStorageVariable("avgExp", avgExp, displayNerdStuff);
    SetStorageVariable("materialOutput", materialOutput, displayNerdStuff);
    SetStorageVariable("multiOutput", multiOutput, displayNerdStuff);
    SetStorageVariable("miscOutput", miscOutput, displayNerdStuff);
    document.getElementById("materialDivText").innerHTML = materialOutput; //print output to the html of that div
    document.getElementById("multiDivText").innerHTML = multiOutput; //print output to the html of that div
    document.getElementById("miscDivText").innerHTML = miscOutput; //print output to the html of that div
    UpdateHistory();
    DisplayRarities();
    //output is now "done"
}
//This whole section is only necessary as long as this isn't in the official game
function MainLoop(){
    var looped = false;
    var mainInterval = setInterval(function(){
        if(document.getElementsByClassName("roundResult areaName").length > 0){
            var results = document.getElementsByClassName("roundResult areaName");
            if(RetrieveVariable("runLog", true, false) === "true"){
                //This if-clause is to prevent looping over the same thing too often in case the timer-variable thing goes wrong or there is lag or anything else that would cause multi-logging
                if(results.length > thenLength){
                    var resultsHTML = document.getElementsByClassName("roundResult areaName")[0].innerHTML;
                    var resultsText = document.getElementsByClassName("roundResult areaName")[0].innerText;
                    if(resultsText.indexOf("Your combines are complete.") === 0){
                        resultsHTML = document.getElementsByClassName("roundResult areaName")[1].innerHTML;
                        resultsText = document.getElementsByClassName("roundResult areaName")[1].innerText;
                        if(RetrieveVariable("popAlert", false, displayNerdStuff) === "true"){
                            alert("Combines complete!");
                        }
                    }
                    if(resultsText.indexOf("skill is now level") !== -1){ //If you get a level-up, write into the console and then skip the rest of the cycle, else do the normal thing
                        console.log("Level up, yay!");
                    }
                    else{
                        var goldDropped = 0; //This is to prevent bad things when calling AddData
                        var amount, expDropped, droppedGold, lastCollectedMaterial, droppedRarity;
                        /*
                        This two if clauses are necessary because Goz made two different exp-display ways.
                        Because of this the code checks for both types of classes and if either of them has a length greater than 1,
                        it'll start slicing the result array for the exp dropped(and total experience) and the dropped amount
                        */
                        if(document.getElementsByClassName("hourMin xsmall").length >0){
                            amount = resultsHTML.slice(resultsHTML.lastIndexOf("]")+10, resultsHTML.lastIndexOf('hourMin')-14);
                            expDropped = document.getElementsByClassName("hourMin xsmall")[0].innerText;
                            expDropped = Number(expDropped.slice(1,expDropped.indexOf("total")-1));
                        }
                        else if(document.getElementsByClassName("statValue").length >0){
                            amount = resultsHTML.slice(resultsHTML.lastIndexOf("]")+10, resultsHTML.lastIndexOf('statValue')-14);
                            expDropped = document.getElementsByClassName("statValue")[0].innerHTML;
                            expDropped =  Number(expDropped.substring(0, expDropped.indexOf("E")-1));
                        }
                        else{
                            console.log("ERROR: Exp-display changed, please contact creator of this script or similar responsibles");
                            amount =0;
                            expDropped=0;
                        }
                        if(resultsHTML.indexOf("perkValue playTitle") !== -1){
                            amount = resultsHTML.slice(resultsHTML.lastIndexOf("]")+10, resultsHTML.indexOf("perkValue playTitle")-13);
                            droppedGold = Number(resultsHTML.slice(resultsHTML.indexOf("perkValue playTitle") + 23, resultsHTML.indexOf("gold")-1));
                        }
                        else{
                            droppedGold = 0;
                        }
                        var rawAmount = amount;
                        var droplog = "";
                        if(resultsText.indexOf("found") !== -1 || resultsText.indexOf("created") !== -1 || resultsText.indexOf("caught") !== -1){ //If the result string contains "found" it automatically recognizeses this as a drop, otherwise it's a "nothing-drop"
                            lastCollectedMaterial = resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]"));
                            droplog = lastCollectedMaterial + " x" + rawAmount;
                        }
                        else if(resultsText.indexOf("anything") !== -1){
                            amount = 0;
                            droplog = "You didn't find anything";
                            lastCollectedMaterial = "Nothing";
                            droppedRarity = "Nothing";
                        }
                        if(amount.length > 3){ //This should only execute when mastery, Create Rate/Drop Rate or whatever procs on the drop.
                            amount = resultsText.slice(resultsText.lastIndexOf("]")+3,resultsText.lastIndexOf("]")+6);
                            amount = createAmountString(amount);
                        }
                        var timeStamp = resultsText.slice(1, resultsText.indexOf("]"));
                        for(var  k=0;k<rarities.length;k++){ //for-loop iterates how many materials of each rarity have been collected.
                            if(resultsHTML.indexOf(rarities[k]) !== -1){
                                droppedRarity = rarities[k];
                            }
                        }
                        if(resultsHTML.indexOf("cLinkLvl") !== -1){ //Item that is clickable/linkable
                            amount = resultsHTML.split("x1").length -1;
                            if(document.getElementsByClassName("hourMin xsmall").length >0){
                                rawAmount = resultsHTML.slice(resultsHTML.lastIndexOf("x1"), document.getElementsByClassName("hourMin xsmall")[0].innerText.length * (-1)-1);
                            }
                            else if(document.getElementsByClassName("statValue").length >0){
                                rawAmount = resultsHTML.slice(resultsHTML.lastIndexOf("x1"), document.getElementsByClassName("statValue")[0].innerText.length * (-1)-1);
                            }
                            else{
                                console.log("ERROR: Exp-display changed, please contact creator of this script or similar responsibles");
                            }
                            // Item created: resultsHTML.split('cLinkType">')[1].slice(0, resultsHTML.split('cLinkType">')[1].indexOf("</span>"))
                            // Level of item created: resultsHTML.split('cLinkLvl">')[1][log.split('cLinkLvl">')[1].indexOf("</span>")-1]
                            lastCollectedMaterial = resultsHTML.split('cLinkType">')[1].slice(0, resultsHTML.split('cLinkType">')[1].indexOf("</span>")) + " Level:" + resultsHTML.split('cLinkLvl">')[1][log.split('cLinkLvl">')[1].indexOf("</span>")-1];
                        }
                        UpdateHistory();
                        AddData(lastCollectedMaterial, amount, droppedRarity, expDropped,  droplog, timeStamp, document.getElementsByClassName("roundResult areaName").length, droppedGold);
                        ChangeTitle();
                    }
                }
                GetAttemptsToNextLevel(localStorage.getItem("avgExp"));
            }
            thenLength = results.length;
        }
        else{
            if(!looped){
                if(RetrieveVariable("totalStatistics", true, displayNerdStuff) === "false"){
                    ResetStatistics();
                }
                ChangeTitle();
                looped = true;
            }
        }
    },5000);
}

/*
Patch notes 1.42
10th.June.2016
-	Started doing patch notes, yay!
- 	Commented variables, moved them to the ResetStatistics function
- 	Cleaned up the UpdateStatisticDivs function from junk lines
-	Renamed and rearranged variables in "SetupLog" function
- 	Created fall-back else in the amount,expDropped and totalExp if-clause to report an error to the console
11th.June.2016
-   Added a dictionary variable "materialDic" that helps build up the displayed log of a specific material
-   Added a history log for specific materials/multis
-   Removed alert from ResetStatistics as it was kind of annoying
-   Removed the Limit function since it was a pointless (and unallowed) feature anyway
-   Reworded some labels on the checkbox and console outputs
-   Renamed script to "Just statistics v1.42" instead of the original name "Collection history"
Ninja patch:
-   Added everything to it's own div inside the original div (class ="skillresultsheader")
-	Fixed a bug where the select(s) would not reset their data properly
12th.June.2016
-   Fixed a bug where the multi would display "ou" if you didn't find anything
-   Also fixed the display of this so it does not display the time twice
-   Fixed a bug where if you would execute the jquery command to get this script while you have already collected/created materials it would not execute the script correctly
-   Fixed a bug where the multi-select would not reset/rebuild properly

Patch notes 1.5
14th.June.2016
-   Re-did the setup of the log requirements so that it now checks for an existing id(logDiv) and not for the text of the last element
    This will make further implementation easier
-   Started to save the "totalStatistics" variable in the local storage. This is just the beginning of session-continued data collection (Still in it's early steps)
-   Created a help button and added functionality to it (It appends text to the end of the div)
-   Optimized the main Interval to set a "perfect" interval time via function.
-   Created a function(GetRightTiming) to calculate the "perfect" interval time based on the passed between 25% and 50%
-   Moved the node-information into the main-loop as this should have a good interval now
15th.June.2016
-   Optimized the GetRightTiming function a little more and tried to fix a few more bugs connected to it
-   Added a 5 second interval that loops over, only really executes code if the graphical log isn't built yet
-   Fixed a "typo" in the ouput variable of the Mainloop, "You have collected" => "You have collected/ created"
17th.June.2016
-   Re-did the whole GetRightTiming function that it now waits until the attempt will end in 2 seconds and then do it's thing
-   Now checking if the refresh vs real time is synced in the MainLoop
-   Added a food buff status-tag to the title header. (NBA = No Buff Active; BA = Buff Active) - Also made this available in v1.42 as this was easy to implement
18th.June.2016
-   Finalized the data-over-session storage of statistics. This is still experimental so no guarantee that it will work 100%
-   You can now see how long you have been working on a node
-   Added the display of how many total attempts and how many node attempts you've done
-   Added a few lines to the help-file

Patch notes 1.51
18th.June.2016
-   Added a checkbox to the top to display the rarities below
-   Changed the conditions for the rarity-meter to be displayed and added it to the new checkbox
-   Changed SetTotalStatstics => WriteCheckboxStatus, this will wrrite the value of the checkbox into the local storage
-   Adjusted the text of how long you've been working on a node as it was only "covering" collection and not crafting
-   Adjusted the total-attempt display as it was only "covering" collection but not crafting

Patch notes 1.52
19th.June.2016
-   Fixed a bug where the last attempt of a crafting skill would cause a some weird stuff e.g. nothingrarity +1 and so on
-   Adjusted the ResetStatistics function to be up to latest standards
-   Added a checkbox for the "nerdy" stuff (Basically a log of what gets written/ loaded into/out of local storage)
-   Removed the rarity-meter (RIP somewhere around early June - 19th.June.2016)
-   Added a small % to the "You'Ve collected something x amount of times" thing
Patch notes 1.6
20th.June.2016-23th.June.2016
-   Created a new function to create the output which takes arguments like exp and so on
-   Moved most of the mainLoop into the new created function, the mainloop function now mainly concats data to use it in the AddData function
-   Fixed a bug where a double exp occuring would cause the log to mess up and display weird multis

*/
