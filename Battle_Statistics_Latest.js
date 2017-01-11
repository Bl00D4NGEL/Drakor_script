// ==UserScript==
// @name         Battle-statistics v1.512
// @version      1.512
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

var debug = 0;
$(document).ready(function () {
	var version = "v1.512";
	SetupLiveLog(); //Live-log-div setup under chat
	LiveLog("You're currently using Battle Statistics version " + version);
	CheckInventory(); //To load the durability data into the livelog
	if (!localStorage.getItem("battleLog")) {
		LiveLog("Log not found, creating a new one");
		log = Create_Log_Object();
	}
	else {
		log = JSON.parse(localStorage.getItem("battleLog"));
		console.log(log);
		LiveLog("Battle Statistics Log succesfully loaded");
	}
	AddEnterShortcut($(".menuFighting"));
	$(".menuFighting").on("click", function(){
		CheckInventory();
	});
	if(debug > 0){
		LiveLog("D: Current Loot (Drakor) is " + $("#load-openloot").html().match(/(\d+)/)[1] + " and log.CurrentLoot is " + log.CurrentLoot);
	}
	if(log.CurrentLoot > 0 && $("#load-openloot").html().match(/(\d+)/)[1] !== "0"){
		LiveLog("Set 'Actual Loot' to " + log.CurrentLoot);
		var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
		$("#load-openloot").html(lootbagText + "(" + log.CurrentLoot + ")");
	}
	else if ($("#load-openloot").html().match(/(\d+)/)[1] === "0"){
		log.CurrentLoot = 0;
		localStorage.setItem("battleLog", JSON.stringify(log));
		LiveLog("Setting 'Actual Loot' to 0 because the loot bag got opened without notice");
	}
	$( document ).ajaxComplete(function( event, xhr, settings ) {
		if (settings.url === "/arena") {
			SetupLog();
			CheckInventory();
			AddEnterShortcut($(".createBattle"));
		}
		else if(settings.url === "/adventure" || settings.url.match(/travel/)){
			AddEnterShortcut($(".menuFighting"));
			$(".menuFighting").on("click", function(){
				CheckInventory();
			});
		}
		else if(settings.url.match(/\/battle-round\/attack.*/)){
			try{
				var difficulty = $(".battleDiff").html().match(/:\s(\w+).*/)[1];
				log = JSON.parse(localStorage.getItem("battleLog"));

				if(xhr.responseText.match(/victory/)){
					// difficulty = xhr.responseText.match(/<h4>(\w+).*?<\/h4>/i)[1];
					console.log(difficulty);
					log.Won++;
					log[difficulty].Won++;
					var loot = xhr.responseText.match(/modLoot\((\d)\)/);
					if(loot){ //Got loot
						var realLoot = xhr.responseText.match(/with\s(\d+)\sitem/i);
						LiveLog("Victory (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ") - Looted " + realLoot[1] + " item" + (Number(realLoot[1]) > 1 ? 's': '') + "!");
						log.TotalLoot += Number(realLoot[1]);
						log.CurrentLoot += Number(realLoot[1]);
						log[difficulty].Loot += Number(realLoot[1]);
						var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
						var itemsInLootbag = lootbagText.match(/(\d+)/);
						if(itemsInLootbag[1] === "1"){
							//LiveLog("Loot bag has been opened");
							log.CurrentLoot = Number(realLoot[1]);
						}
						$("#load-openloot").html(lootbagText + "(" + log.CurrentLoot + ")");
					}
					else{
						LiveLog("Victory (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ") - Looted 0 items!");
						log.WonWithoutLoot++;
						log[difficulty].WonWithoutLoot++;
					}
					var exp = xhr.responseText.match(/([0-9,]+)\s?\w*\s?exp/i);
					log.Experience += Number(exp[1].replace(",", ""));
					log[difficulty].Experience += Number(exp[1].replace(",", ""));
					var gold = xhr.responseText.match(/>([0-9,]+)\sgold/i);
					if(gold){
						log.Gold += Number(gold[1].replace(",",""));
						log[difficulty].Gold += Number(gold[1].replace(",",""));
					}
					if($(".menuFighting").length){
						AddEnterShortcut($(".menuFighting"));
						$(".menuFighting").on("click", function(){
							CheckInventory();
						});
					}
					else{
						AddEnterShortcut($("#load-arena"));
					}
				}
				else if(xhr.responseText.match(/defeated/) && !xhr.responseText.match(/victory/)){
					LiveLog("Defeat (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ")");
					log.Lost++;
					log[difficulty].Lost++;

					if(xhr.responseText.match(/modloot/i)){
						log.ConsolationLoot++;
						log[difficulty].ConsolationLoot++;
						log.CurrentLoot++;
						var bagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
						var itemsInBag = bagText.match(/(\d+)/);
						if(itemsInBag[1] === "1"){
							//LiveLog("Loot bag has been opened");
							log.CurrentLoot = 1;
						}
						$("#load-openloot").html(bagText + "(" + log.CurrentLoot + ")");

					}

					AddEnterToSpecificClass("navButton", "Back to Adventure");
					AddEnterToSpecificClass("navButton", "Back to Arena");
				}
				localStorage.setItem("battleLog", JSON.stringify(log));
			}
			catch(e){
				LiveLog("Oh that's not good..<br/>" + e.message);
			}
		}
		else if(settings.url.match(/\/battle-create\/.*/)){
			AddEnterToSpecificClass("navButton", "Start Battle!");
		}
		else if(settings.url === "/sell/sellall"){
			if(xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)){
				log = JSON.parse(localStorage.getItem("battleLog"));
				var goldEarned = xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)[1].replace(",","");
				var itemsSold = $(".drIcon").length;
				LiveLog("Sell all: Sold " + itemsSold + " items for " + goldEarned + " gold.");
				log.LootGold += Number(goldEarned);
				log.ItemsSold += Number(itemsSold);
				localStorage.setItem("battleLog", JSON.stringify(log));
			}
		}
		else if(settings.url === "/openloot/open/all"){
			log = JSON.parse(localStorage.getItem("battleLog"));
			log.CurrentLoot = 0;
			var lootItems = 0;
			var lootbags = xhr.responseText.match(/<h3>(.*?)<script>/g);
			for(var i=0;i<lootbags.length;i++){
				var lootbag = lootbags[i];
				var diff = lootbag.match(/\((\w+)\)/)[1];
				var rarities = lootbag.match(/cardquality\">(\w+)</gi);
				for(var j=0;j<rarities.length;j++){
					lootItems++;
					var rarity = rarities[j].match(/>(\w+)</)[1];
					log[diff][rarity]++;
				}
			}
			LiveLog("Opened " + lootbags.length + " Loot bags with " + lootItems + " looted items");
			localStorage.setItem("battleLog", JSON.stringify(log));
		}
		else if(settings.url.match(/inventory/)){
			$(".drIcon").on("dblclick", function(e){
				if(e.currentTarget.id){
					var plainId = e.currentTarget.id.slice(4);
					var cardId = "div#card" + plainId;
					setTimeout(function(){
						var cardValue = $(cardId).text().match(/([0-9,]+)\sgold/i)[1].replace(",","");
						var log = JSON.parse(localStorage.getItem("battleLog"));
						log.LootGold += Number(cardValue);
						log.ItemsSold++;
						localStorage.setItem("battleLog", JSON.stringify(log));
						LiveLog("Sold an item for  " + cardValue + " gold.");
					}, 500);
					$.ajax("/sell/" + plainId).done(function(data){$("#drakorWorld").html(data);});
				}
			});
		}
		else if(settings.url.match(/\/world\/disenchanting/i)){DisenchantSetup();} //Setup of the selects
		else if(settings.url.match(/\/world\/action_disenchanting/i)){LiveLog("You disenchanted an item");SelectItemToDisenchant();} //Auto de on enter press
		else if(settings.url.match(/(chat|sell|show|openloot|battle)/i)){}
		else{
			if(debug > 0){
				console.log("settings\n");
				console.log(settings);
				console.log("event\n");
				console.log(event);
				console.log("xhr\n");
				console.log(xhr);
			}
		}

	});
});

function SetupLiveLog(){
	var fragment = document.createDocumentFragment();
	var div = $(document.createElement("div"));
	var baseDiv = $(div).attr({title: "Battle Log" })
	.css({ "font-size": "14px", "background-color": "lightgrey", "display": "none", 'text-align': 'left' }).appendTo(fragment);
	baseDiv.dialog({
		autoOpen: false,
		show: {
			effect: "blind",
			duration: 500
		},
		width: 500,
		height: 400
	});
	var duraDiv = $(document.createElement("div")).clone()
	.attr({id: 'durabilityDisplay'})
	.css({'background-color': 'orange', 'text-align':'center','width':'50%', 'display': 'table-cell'}).appendTo(baseDiv);
	var logDiv = $(div).clone().attr({'id': 'LiveLog'}).css('text-align', 'left').appendTo(baseDiv);
	$(fragment).appendTo("#gs_topmenu");
	var showLog = $(document.createElement("a")).attr({ id: "liveLogButton", class: "gs_topmenu_item" })
	.text("Battle Log")
	.on("click", function () {
		$(baseDiv).dialog("open");
	})
	.appendTo("#gs_topmenu");
}

function LiveLog(logText){
	var logDiv = $("#LiveLog");
	var date = new Date();
	date.setTime(date.getTime() + (-3 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	$(logDiv).html((hours < 10 ? '0' : '') + hours + ":" + (minutes < 10 ? '0' : '')  + minutes + ":" + (seconds < 10 ? '0' : '') + seconds + " " + logText + "<br/>" + $(logDiv).html());
}
function addCommas(x){
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function AddEnterShortcut(object){
	$(document).off("keydown");
	$(document).on("keydown", function(e){

		if(e.keyCode === 13){
			if(!$("#chatMsg").is(":focus")){ //Only click it if you are not in the window
				if($("#npcTimer").text().match(/[1-9]0?%/) || $("#skill-timer").text().match(/[1-9]0?%/)){
					e.preventDefault();
					return;
				}
				object.click();
			}
		}
	});
}

function AddEnterToSpecificClass(className, textToLookFor){
	var classes = $("." + className);
	for(var i=0;i<classes.length;i++){
		// console.log("Index: " + i + "\nMessage: " + classes[i].innerText);
		if(classes[i].innerText === textToLookFor){
			AddEnterShortcut(classes[i]);
		}
	}
}

function CheckInventory(){
	$.ajax("/inventory").success(function(data){
		var spellArea = data.match(/dcontainer\s*charbattledeck\s*\">.*?(<div id=\"icon.*?)<div\sid=\"char_inventory\"/i)[1];
		if(spellArea.match(/nodurability/i)){
			alert("One or more spells do not have enough durability");
		}
		var inventorySpaces = Number(data.match(/<div\sid=\"char_inventory".*?><div.*?b>([0-9,]+).*?<\/b>/)[1].replace(",",""));
		var log = JSON.parse(localStorage.getItem("battleLog"));
		if(debug > 0){
			console.log("Inventory-spaces: " + inventorySpaces + "\nlog.CurrentLoot: " + log.CurrentLoot);
		}
		//Because sometimes the loot counter doesn't update let's do it here again
		if($("#load-openloot").html().match(/(\d+)/)[1] === "0" && log.CurrentLoot > 0){
			LiveLog("The Lootbag has been opened without being noticed");
			log.CurrentLoot = 0;
			localStorage.setItem("battleLog", JSON.stringify(log));
		}
		if(inventorySpaces === "0"){
			alert("Not enough inventory space");
		}
		var duras = spellArea.match(/remaining durability\: (\d+)/gi);
		var output = '| ';
		for(var i = 0;i<duras.length;i++){
			var dura = duras[i].match(/(\d+)/)[1];
			if(dura < 10){dura = "<span style='color: red'><b>0" + dura + "</b></span>";}
			output += dura + " | ";
		}
		output += '<br/>Inventory spaces left: ' + inventorySpaces;
		console.log("Updated durability div to " + output);
		$("#durabilityDisplay").html(output);
	});
}

function Create_Log_Object(){
	var log = {};
	log.Won = 0;
	log.Lost = 0;
	log.Gold = 0;
	log.TotalLoot = 0;
	log.CurrentLoot = 0;
	log.ConsolationLoot = 0;
	log.LootGold = 0;
	log.ItemsSold = 0;
	log.WonWithoutLoot = 0;
	log.Experience = 0;
	log.Spell = {};
	log.Augment = {};
	log.Enchant = {};
	var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
	for(var j=0;i<rarities.length;j++){
		log.Spell[rarities[j]] = 0;
		log.Augment[rarities[j]] = 0;
		log.Enchant[rarities[j]] = 0;
	}
	var diffArray = ["Elite", "Hard", "Medium", "Easy"];
	var keyArray = ["Gold", "Experience", "Won", "Lost", "Loot", "ConsolationLoot", "WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
	for(var i=0; i<diffArray.length;i++){
		log[diffArray[i]] = {};
		for(var j=0;j<keyArray.length;j++){
			log[diffArray[i]][keyArray[j]] = 0;
		}
	}
	localStorage.setItem("battleLog", JSON.stringify(log));
	return log;
}

function SetupLog(){
	var log = JSON.parse(localStorage.getItem("battleLog"));
	var totalFights = log.Lost + log.Won;
	console.log("Total Fights: " + totalFights);
	var averageGold = Math.floor(log.Gold / totalFights);
	var averageExperience = Math.floor(log.Experience / totalFights);
	var averageItems = (log.TotalLoot / totalFights).toFixed(2);
	//Ajax call to inventory to get current/needed exp
	var currentExp, neededExp;
	$.ajax("/inventory").done(function(data){
		currentExp = Number(data.match(/statexp\".*?>([0-9,]+)/i)[1].replace(",",""));
		neededExp = Number(data.match(/statexp\".*?\/small>([0-9.,k]+)/i)[1].replace("k","00").replace(/\D/,""));
		console.log("Current Exp: " + currentExp + "\nNeeded Exp: " + neededExp);
	});
	var fightsToLevel = Math.floor((neededExp - currentExp) / averageExperience);
	var divHTML = "You fought a total of " + totalFights + " total battles.<br/>You gained " + log.TotalLoot + " items (" +
		averageItems + " on average) and sold " + log.ItemsSold + " items which brought you a total of " +
		log.LootGold + " gold.<br/>You did not receive loot for a won battle " + log.WonWithoutLoot +
		" times.<br/>You made a total of " + log.Experience + " Experience (" + averageExperience +
		" on average) and made a total of " + log.Gold + " gold ( " + averageGold +
		" on average)<br/>You won " + Number(log.Won) + " times (" + (log.Won/totalFights * 100).toFixed(2) +
		"%) and lost " + Number(log.Lost) + " times (" + (log.Lost/totalFights * 100).toFixed(2) + "%).<br/>";
	divHTML =  addCommas(divHTML);
	var displayDiv = $(".arenaContainer").get(2);
	displayDiv.innerHTML = divHTML;
	var resetButton = $(document.createElement("button")).text("Reset Statistics").attr({class: "bv_button bv_small_font"}).css({width: "auto", height: "auto"}).on("click", function(){
		Create_Log_Object();
		SetupLog();
	}).appendTo(displayDiv);
	var detailHTML = "<h3>Select a difficulty to get more details</h3><select id='diffSelect'>";
	var detailDiv = $(".arenaContainer").get(3);
	detailDiv.innerHTML = detailHTML;
	var diffArray = ["Easy", "Medium", "Hard", "Elite"];
	var keyArray = ["Gold", "Experience", "Won", "Lost", "Loot", "ConsolationLoot", "WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
	for(var i=0;i<diffArray.length;i++){
		var temp = "";
		var option = $(document.createElement("option")).attr({value: diffArray[i]}).text(diffArray[i]).appendTo($("#diffSelect"));
		temp += "<table id='" + diffArray[i] + "_table' class = 'detail_table' style='display: none;width: 100%;'>";
		for(var j=0;j<keyArray.length;j++){
			temp += "<tr><td>" + keyArray[j] + "</td><td>" + log[diffArray[i]][keyArray[j]] + "</td></tr>";
		}
		temp += "</table>";
		detailDiv.innerHTML += temp;
	}
	$("#diffSelect").on("change", function(){
		$(".detail_table").css("display", "none");
		$("#" + $(this).val() + "_table").css("display", "block");
		localStorage.setItem("BS_select", $(this).val());
	});
	$("#diffSelect").val(localStorage.getItem("BS_select"));
}

function DisenchantSetup(){
	var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
	var selects = ["Augment", "Enchant", "Spell"];
	var log = JSON.parse(localStorage.getItem("battleLog"));
	var table = $(document.createElement("table")).attr({id: 'disenchantingTable'});
	for(var i=0;i<selects.length;i++){
		if(log[selects[i]] === undefined){log[selects[i]] = {};} // For older version compatibility
		var row = $(document.createElement("tr")).attr({'class': 'disenchantingSelect'}).appendTo(table);
		var info = $(document.createElement("td")).html("Disenchant " + selects[i]  + " up to x rarity");
		$(info).appendTo(row);
		var td = $(document.createElement("td"));

		for(var j=0;j<rarities.length;j++){
			if(log[selects[i]][rarities[j]] === undefined){log[selects[i]][rarities[j]] = 'false';} // for older version compatibility
			var checkbox = $(document.createElement("input")).attr({'id': selects[i] + "-" + rarities[j], 'type': 'checkbox'}).on("change", function(){
				var log = JSON.parse(localStorage.getItem("battleLog"));
				var temp = $(this).attr('id').split("-");
				var type = temp[0];
				var rarity = temp[1];
				if($(this).prop('checked')){
					if(debug > 0){
						LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 1");
					}
					log[type][rarity] = "true";
				}
				else{
					if(debug > 0){
						LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 0");
					}
					log[type][rarity] = "";
				}
				localStorage.setItem("battleLog", JSON.stringify(log));
			}).prop("checked", log[selects[i]][rarities[j]]).appendTo(td);
			var span = $(document.createElement("span")).html(rarities[j].match(/(^\w)/)[1]).appendTo(td);
		}
		$(td).appendTo(row);
	}
	var hideRow = $(document.createElement("td")).attr({'colspan': '2'}).css('text-align', 'center').html("Hide Drop-Downs").on("click", function(){
		if($(this).html().match(/hide/i)){
			$(".disenchantingSelect").css("display", "none");
			$(this).html("Show Drop-Downs");
		}
		else{
			$(".disenchantingSelect").css("display", "table-row");
			$(this).html("Hide Drop-Downs");
		}
	}).appendTo(table);
	localStorage.setItem("battleLog", JSON.stringify(log));
	$(table).insertAfter("#slots-remaining");
	$("td").css("vertical-align", "middle");
}

function SelectItemToDisenchant(){
	var rarities =  ["Common", "Superior", "Rare", "Epic", "Legendary"];
	var possibleItems = $(".roundResult.areaName").find(".cLink");
	var itemToDE = undefined; // Set variable to undefined to reset the item this var contains
	for(var i=0;i<possibleItems.length;i++){
		var item = possibleItems[i];
		var type = item.innerText.match(/(battle|enchant|augment)/i)[1];
		if(type === "Battle"){type="Spell";} //Remapping
		var rarity = item.className.match(/card(\w+)/i)[1];
		if($("#" + type + "-" + rarity).prop('checked')){ //New change
			console.log("Item can be DE'd..");
			console.log($(item));
			itemToDE = item;
			i=possibleItems.length;
		}
	}

	AddEnterShortcut($(itemToDE).parents().children().get(0));
	var span = $(document.createElement("span")).insertAfter($("#disenchantingTable"));
	if(itemToDE === undefined){
		$(span).html("<br/>There is no item to be disenchanted");
	}
	else{
		$(span).html("<br>This is will be disenchanted: ");
		$(itemToDE).clone().appendTo(span);
	}
}