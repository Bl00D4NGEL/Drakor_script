// ==UserScript==
// @name         Estate of guild bank
// @version      1.1
// @description  Scan guild bank materials to check if any kind of estate can be built
// @author       Bl00D4NGEL
// @match        http://www.drakor.com/guild
// ==/UserScript==

var btnShack = document.createElement("BUTTON");
btnShack.className = "gs_topmenu_item";
var btnShackText = document.createTextNode("Shack?");
var btnHouse = document.createElement("BUTTON");
btnHouse.className = "gs_topmenu_item";
var btnHouseText = document.createTextNode("House?");
var btnHall = document.createElement("BUTTON");
btnHall.className = "gs_topmenu_item";
var btnHallText = document.createTextNode("Hall?");
var btnEstate = document.createElement("BUTTON");
btnEstate.className = "gs_topmenu_item";
var btnEstateText = document.createTextNode("Estate?");
var btnKeep = document.createElement("BUTTON");
btnKeep.className = "gs_topmenu_item";
var btnKeepText = document.createTextNode("Keep?");
var btnFort = document.createElement("BUTTON");
btnFort.className = "gs_topmenu_item";
var btnFortText = document.createTextNode("Fort?");
var btnPalace = document.createElement("BUTTON");
btnPalace.className = "gs_topmenu_item";
var btnPalaceText = document.createTextNode("Palace?");


var buttonArray = [btnShack, btnHouse, btnHall, btnEstate, btnKeep, btnFort, btnPalace];
var buttonTextArray = [btnShackText, btnHouseText, btnHallText, btnEstateText, btnKeepText, btnFortText, btnPalaceText];
document.getElementsByClassName("guildMenu")[0].innerHTML += "</br>";
var fragment = document.createElement("fragment");
for(var z=0;z<buttonArray.length;z++){
    console.log("Adding something the x" + z + "th time");
    buttonArray[z].appendChild(buttonTextArray[z]);
    fragment.appendChild(buttonArray[z]);
}
document.getElementsByClassName("guildMenu")[0].appendChild(fragment);

btnShack.addEventListener("click", function(){
    console.clear();
    CalculateShack();
    alert("Still old version, needs yet to be updated");
});

btnHouse.addEventListener("click", function(){
    console.clear();
    CalculateHouse();
    alert("Still old version, needs yet to be updated");
});

btnHall.addEventListener("click", function(){
    console.clear();
    CalculateHall();
});

btnEstate.addEventListener("click", function(){
    console.clear();
    CalculateEstate();
});

btnKeep.addEventListener("click", function(){
    console.clear();
    CalculateKeep();
});

btnFort.addEventListener("click", function(){
    console.clear();
    alert("Work in Progress");
});

btnPalace.addEventListener("click", function(){
    console.clear();
    alert("Work in Progress");
});

/*
Function to check for given string ("stringToSearchFor") in another string ("stringToBeSearchedIn")
If the string is found, change the innerText of the button that is parsed with the function to yes/no.
*/
function LookForStringInAnotherString(stringToSearchFor, stringToBeSearchedIn, button){
    if(stringToBeSearchedIn.indexOf(stringToSearchFor) !== -1){
        button.innerText = "No!";
    }
    else{
        button.innerText = "Yes!";
    }
}

/*
This accepts an array of ids, then loops through them and if the id is present in the guild bank, add the amount of it to the array
If the id is not found, add "0" to the array
Finally return the materials for further use (The returned value is an array)
*/
function GetAmountsOfItems(idsOfMaterials){
    materialsCounted = [];
    for(var i=0;i < idsOfMaterials.length;i++){
        if(document.getElementById(idsOfMaterials[i]) !== null){
            materialsCounted.push(document.getElementById(idsOfMaterials[i]).innerText.substr(document.getElementById(idsOfMaterials[i]).innerText.indexOf("x")+1));
        }
        else{
            materialsCounted.push("0");
        }
    }
    return materialsCounted;
}

/*
Function to check of the item has sufficient supply to build the estate-type, if it has, say it has a sufficient supply
If not, print out that it doesn't and display both, what's in the bank and what's needed into the output string
*/
function GetSupplystatusOfItems(nameOfItems, amountOfItems, materialsNeeded){
    output = "";
    for(var k=0;k<materialsNeeded.length;k++){
        if(amountOfItems[k] >= materialsNeeded[k]){
            output += nameOfItems[k] + " has a sufficient supply.\n";
        }
        else{
            output += "\n" + (nameOfItems[k] + " does not have a sufficient supply\nIn bank: " + amountOfItems[k] + "\nThe pattern needs: " + materialsNeeded[k]+ "\nStill need: "+(materialsNeeded[k] - amountOfItems[k]) +  "\n\n").toUpperCase();
        }
    }
    return output;
}

/*
Takes the name of start- and endproduct (For prettier output), the amount of the start material and a multiplier
Example: CalculatePossibleEndMaterial("Start", "End", 100, 2)
=> 100 Start could turn into 200(100*2) End
*/
function CalculatePossibleEndMaterial(nameOfStartMaterial, nameOfEndMaterial, amountOfStartMaterial, multiplier){
    var output = "";
    for(var i=0; i<multiplier.length; i++){
        output += amountOfStartMaterial[i] + " " + nameOfStartMaterial[i] + " could turn into " + amountOfStartMaterial[i] * multiplier[i] + " " + nameOfEndMaterial[i] + "\n";
    }
    return output;
}

/*
amountItemOne and -Two are basically the amount of the item, and the following two arguments act as divider later on in the function
It is recommended to call "GetAmountsOfItems" for the amounts with the ID in an array within the function (Complex talks)
*/
function GetPossibleAmountOfTwoItems(amountItemOne, amountItemTwo, amountOneNecessary,amountTwoNecessary){
    var one = Math.floor(amountItemOne / amountOneNecessary);
    var two = Math.floor(amountItemTwo/ amountTwoNecessary);
    if(one>two){
        return two;
    }
    else{
        return one;
    }
}

/*
Below this there are only the calculation of each estate-type
It needs the ids of the materials relative to their named counterpart, which is sorted alphabetically
"realMaterialsNeeded" is again, relative to the nameArray
If there are additional things that can possibly be turned into other materials like a bar into nails, it needs to be added under the base calculation.
the output gets created by the function "GetSupplyStatus" and finally gets printed out to console.
Last but not least, if the output string does not contain the string "NOT" the button clicked will display "yes", if there are materials missing, thus the output will have a
"NOT" in it, the button will be labeled "no"
*/

function CalculateKeep(){
    /*
Aspen Lumber(299)
Hemlock Lumber(344)
Hemlock Shingles(459)
Iridium Nail(458)
Lava Rock(19)
Limestone(17)
Marble(18)

Bigtooth Aspen(109) -> 1x Aspen Lumber
Hemlock(102) -> 1x Hemlock Lumber
Hemlock(102) -> 5x Hemlock Shingles
Iridium Bar() -> 15x Iridium Nail
Iridiom Ore(28) + 2x Quartz(20) -> 1x Iridium Bar
*/

    //Base calculation start
    var realAmount = GetAmountsOfItems(["mat-299", "mat-344", "mat-459", "mat-458", "mat-19", "mat-17", "mat-18"]);
    var realNameMatToLookFor = ["Aspen Lumber", "Hemlock Lumber", "Hemlock Shingles", "Iridium Nail", "Lava Rock", "Limestone", "Marble"];
    var realMaterialsNeeded = [2000,10000,7000,15000,4000,3000,6000];  //This is what the pattern needs to be crafted
    //Base calculation end

    //Additional calulation start
    var additionalAmount = GetAmountsOfItems(["mat-109", "mat-102", "mat-102", "mat-389"]);
    var additionalNameToLookFor = ["Bigtooth Aspen", "Hemlock", "Hemlock", "Iridium Bar", "Iridium Ore and Quartz"];
    var materialProduced = ["Aspen Lumber", "Hemlock Lumber", "Hemlock Shingles", "Iridium Nail", "Iridium Bar"];
    var multiplier = [1,2,5,15,1];
    var iridiumBar = GetPossibleAmountOfTwoItems(GetAmountsOfItems(["mat-28"]),GetAmountsOfItems(["mat-20"]), 1, 2); //Iridium Ore and Quartz
    additionalAmount.splice(additionalAmount.length, 0, iridiumBar);
    //Additional calculation end

    //Finally Concat of two long functions into the final output string
    var output = GetSupplystatusOfItems(realNameMatToLookFor, realAmount, realMaterialsNeeded) + "\n" +  CalculatePossibleEndMaterial(additionalNameToLookFor, materialProduced, additionalAmount, multiplier);
    //Log the output into the console
    console.log(output);
    //Change buttontext to Yes or No
    LookForStringInAnotherString("NOT",output, btnKeep);
}
function CalculateEstate(){
    /*
    Aspen Lumber(299)
    Black Ash(107)
    Chromium Nail(300)
    Iron Nail(138)
    Limestone(17)
    Pine Lumber(247)
    Pine Shingles(304)
    Silver Maple(426)
    Wild Cherry(386)

    Bigtooth Aspen (109) -> 1x Aspen Lumber
    Chromium Bar(268) -> 15x Chromium Nails
    Chromium Ore(198) + 2x Marble(18) -> 1x Chromium Bar
    Iron Bar(114) -> 15x Iron Nails
    Iron Ore(24) + Shale Rock(15) -> 1x Iron Bar
    White Pine(101) -> 1x Pine Lumber
    White Pine(101) -> 5x Pine Shingles
    */

    //Base calculation start
    var realAmount = GetAmountsOfItems(["mat-299", "mat-107", "mat-300","mat-138", "mat-17", "mat-247", "mat-304", "mat-436", "mat-386"]);
    var realNameMatToLookFor = ["Aspen Lumber", "Black Ash", "Chromium Nail", "Iron Nail", "Limestone", "Pine Lumber", "Pine Shingles", "Silver Maple","Wild Cherry"];
    var realMaterialsNeeded = [4000,100,6000,4000,2500,3000,5000,400,200];  //This is what the pattern needs to be crafted
    //Base calculation end

    //Additional calulation start
    var additionalAmount = GetAmountsOfItems(["mat-109", "mat-268", "mat-114", "mat-101", "mat-101"]);
    var additionalNameToLookFor = ["Bigtooth Aspen", "Chromium Bar", "Iron Bar", "White Pine", "White Pine", "Chromium Ore and Marble", "Iron Ore and Shale Rock"];
    var materialProduced = ["Aspen Lumber", "Chromium Nail", "Iron Nail", "Pine Lumber", "Pine Shingles", "Chromium Bar", "Iron Bar"];
    var multiplier = [1,15,15,1,5,1,1];
    var chromiumBar = GetPossibleAmountOfTwoItems(GetAmountsOfItems(["mat-198"]),GetAmountsOfItems(["mat-18"]), 1, 2); //Chromium Ore and Marble
    var ironBar = GetPossibleAmountOfTwoItems(GetAmountsOfItems(["mat-24"]),GetAmountsOfItems(["mat-15"]), 1, 1); //Iron Ore and Shale Rock
    additionalAmount.splice(additionalAmount.length, 0, chromiumBar, ironBar);
    //Additional calculation end

    //Finally Concat of two long functions into the final output string
    var output = GetSupplystatusOfItems(realNameMatToLookFor, realAmount, realMaterialsNeeded) + "\n" +  CalculatePossibleEndMaterial(additionalNameToLookFor, materialProduced, additionalAmount, multiplier);
    //Log the output into the console
    console.log(output);
    //Change buttontext to Yes or No
    LookForStringInAnotherString("NOT",output, btnEstate);
}

function CalculateHall(){
    /*
    Black Ash(107)
    Cedar Lumber(206)
    Chestnut(537
    Iron Nail(138)
    Pine Lumber(247)
    Pine Shingles(304)
    Shale Rock(15)
    Silver Maple(436)
    Tin Nail(199)

    Iron Bar(114) -> 15x Iron Nails
    Iron Ore(24) + Shale Rock(15) -> 1x Iron Bar
    Red Cedar(100) -> 2x Cedar Lumber
    Tin Bar(113) -> 15x Tin Nails
    Tin Ore(23) + Sandstone(14) -> 1x Tin Bar
    White Pine(101) -> 1x Pine Lumber
    White Pine(101) -> 5x Pine Shingles
    */

    //Base calculation start
    var realAmount = GetAmountsOfItems(["mat-107", "mat-206", "mat-537", "mat-138", "mat-247", "mat-304", "mat-15", "mat-436", "mat-199"]);
    var realNameMatToLookFor = ["Black Ash", "Cedar Lumber", "Chestnut" , "Iron Nail", "Pine Lumber", "Pine Shingles", "Shale Rock" , "Silver Maple", "Tin Nail"];
    var realMaterialsNeeded = [50,2000,50,8000,5000,1500,500,250,1000];  //This is what the pattern needs to be crafted
    //Base calculation end

    //Additional calulation start
    var additionalAmount = GetAmountsOfItems(["mat-114", "mat-100", "mat-113", "mat-101", "mat-101"]);
    var additionalNameToLookFor = ["Iron Bar", "Red Cedar", "Tin Bar", "White Pine", "White Pine", "Iron Ore and Shale Rock", "Tin Ore and Sandstone"];
    var materialProduced = ["Iron Nail", "Cedar Lumber", "Tin Nail", "Pine Lumber", "Pine Shingles", "Iron Bar", "Tin Bar"];
    var multiplier = [15,2,15,1,5,1,1];
    var tinBar = GetPossibleAmountOfTwoItems(GetAmountsOfItems(["mat-23"]),GetAmountsOfItems(["mat-14"]), 1, 1); //Tin Ore and Sandstone
    var ironBar = GetPossibleAmountOfTwoItems(GetAmountsOfItems(["mat-24"]),GetAmountsOfItems(["mat-15"]), 1, 1); //Iron Ore and Shale Rock
    additionalAmount.splice(additionalAmount.length, 0, ironBar, tinBar);
    //Additional calculation end

    //Finally Concat of two long functions into the final output string
    var output = GetSupplystatusOfItems(realNameMatToLookFor, realAmount, realMaterialsNeeded) + "\n" + CalculatePossibleEndMaterial(additionalNameToLookFor, materialProduced, additionalAmount, multiplier);
    //Log the output into the console
    console.log(output);
    //Change buttontext to Yes or No
    LookForStringInAnotherString("NOT",output, btnHall);
}

function CalculateHouse(){
    var idMatToLookFor = ["mat-107", "mat-206", "mat-241", "mat-411", "mat-100", "mat-14", "mat-113", "mat-199", "mat-23", "mat-386"];
    var nameMatToLookFor = ["Black Ash", "Cedar Lumber", "Cedar Shingles", "Clay", "Red Cedar", "Sandstone", "Tin Bar", "Tin Nail", "Tin Ore", "Wild Cherry"];
    var realMaterialsNeeded = [25,2500,750,60,0,500,0,3500,0,75];
    var output = GetSupplystatusOfItems(nameMatToLookFor, GetAmountsOfItems(idMatToLookFor),realMaterialsNeeded);
    console.log(output);
    LookForStringInAnotherString("NOT",output, btnHouse);
}

function CalculateShack(){
    var idMatToLookFor = ["mat-141", "mat-163", "mat-108", "mat-173", "mat-12", "mat-170", "mat-2", "mat-99", "mat-1"];
    var nameMatToLookFor = ["Birch Lumber", "Birch Shingles", "Black Spruce", "Black Spruce Lumber", "Copper Bar", "Copper Nail", "Copper Ore", "Light Birch", "Stone"];
    var realMaterialsNeeded = [1000,500,0,400,0,1500,0,0,120];
    var output = GetSupplystatusOfItems(nameMatToLookFor, GetAmountsOfItems(idMatToLookFor),realMaterialsNeeded);
    console.log(output);
    LookForStringInAnotherString("NOT",output, btnShack);
}
