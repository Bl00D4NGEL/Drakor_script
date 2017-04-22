// ==UserScript==
// @name         Patterns for Guildbank
// @version      1.0
// @description  Check for Pattern materials in guildbank.
// @author       Dominik "Bl00D4NGEL" Peters
// @match        https://www.drakor.com/guild
// @match        https://www.drakor.com/guild/bank
// ==/UserScript==

var BASE = 'https://www.drakor.com';
var debug = 0;

var emptyOption = $(document.createElement("option")).val("").html("-- Please select --");

$(document).ready(function(){
	//console.log(GetAllPatternSkills());
	$(".guildMenu").html($(".guildMenu").html() + "<br>");
	AddPatternOutput();
});

function AddPatternMenu(){
	$("#patternDiv").remove();
	$("#pattern-output").remove();
	$("#outDiv").remove(); //Remove the previous div
	var outDiv = $(document.createElement("div")).attr({id: "outDiv"}).appendTo(".guildMenu");
	var tradeSelect = $(document.createElement("select")).attr({id: "addTrade"}).on("change", function(){
		if($(this).val() === ""){
			$("#patternSelect").remove();
		}
		else{
			var patternSelect = $(document.createElement("select")).attr({id:"addPattern"}).insertBefore(addStorage);
			emptyOption.clone().appendTo(patternSelect);
			FillPatterns(patternSelect, $(this).val());
		}
	}).appendTo(outDiv);
	emptyOption.clone().appendTo(tradeSelect);
	GetAllPatternSkills(tradeSelect); //Sets the tradeskills for the select (object) that is the first parameter
	var addStorage = $(document.createElement("button")).html("Add to Pattern Storage").on("click", function(){
		AddPatternToStorage();
	}).appendTo(outDiv);
	var table = $(document.createElement("table")).appendTo(outDiv);
	for(var trade in patterns){
		var tr = $(document.createElement("tr")).appendTo(table);
		var td = $(document.createElement("td")).html(trade[0].toUpperCase() +  trade.slice(1)).appendTo(tr);
		var td2 = $(document.createElement("td")).appendTo(tr);
		$(document.createElement("div")).on("click", function(){
			var patternStorage = JSON.parse(localStorage.getItem("patternStorage"));
			var trade = $($(this).parents().children().get(1)).html().toLowerCase();
			patternStorage[trade] = undefined;
			$("#outDiv").html("<h1>Successfully removed all patterns of tradeskill " + $($(this).parents().children().get(1)).html() + " from Patternstorage.<h1>");
			localStorage.setItem("patternStorage", JSON.stringify(patternStorage));
				AddPatternOutput();
		}).html("[REMOVE ALL]").appendTo(td2);
		for(var pattern in patterns[trade]){
			var tr = $(document.createElement("tr")).appendTo(table);
			var td = $(document.createElement("td")).css("padding-left", "25px").html(pattern).appendTo(tr);
			var td2 = $(document.createElement("td")).appendTo(tr);
			$(document.createElement("div")).attr({id: "remove-" + patterns[trade][pattern]}).on("click", function(){
				RemovePatternFromStorage($(this).attr("id").slice(7));
			}).html("[REMOVE]").appendTo(td2);
		}
	}
	$(table).find("td").css({"border": "1px solid grey"});
	$("button").css("color", "black");
}

function AddPatternOutput(){
	var patternDiv = $(document.createElement("div")).attr({id: "patternDiv"}).appendTo(".guildMenu");
	$(document.createElement("div")).attr({'id': 'pattern-output'}).insertAfter(patternDiv); //output
	var patternSelect = $(document.createElement("select")).hide();
	var tradesSelect = $(document.createElement("select")).on("change", function(){
		if($(this).val() === ""){patternSelect.css("display", "none");}
		else{
			patternSelect.show();
			patternSelect.children().remove();
			emptyOption.clone().appendTo(patternSelect);
			for(var pattern in patterns[$(this).val()]){
				$(document.createElement("option")).val(patterns[$(this).val()][pattern]).html(pattern).appendTo(patternSelect);
			}
		}
	}).appendTo(patternDiv);
	patternSelect.appendTo(patternDiv);
	emptyOption.clone().appendTo(tradesSelect);
	var showButton = $(document.createElement("button")).html("Display Pattern!").on("click", function(){
		if(patternSelect.val() === "" || patternSelect.val() === null ){return;}
		else{
			$("#pattern-output").html("<h1>Loading pattern...</h1>");
			var materials = {};
			var id=patternSelect.val();
			GetMaterials(id, materials);
			var myTimer = setInterval(function(){
				if($.active === 0){ //$.active returns the amount of currently active ajax requests
					var out = GetAmountsOfGuildBank(materials,1);
					$("#pattern-output").html("<pre>" + out + "</pre>");
					clearInterval(myTimer);
				}
			}, 50, materials);
		}
	}).appendTo(patternDiv);
	for(var trades in patterns){
		var text = trades;
		text = trades[0].toUpperCase() + trades.slice(1);
		$(document.createElement("option")).val(trades).html(text).appendTo(tradesSelect);
	}

	var manageButton = $(document.createElement("button")).html("Manage Pattern!").on("click", function(){
		$(this).hide();
		AddPatternMenu();
	}).insertAfter($("#pattern-output"));
	$("button").css("color", "black");
}

function GetMaterials(id, materials){
	$.ajax(BASE + "/show/patternbasic/" + id).success(function(data){
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
				$.ajax(BASE + "/show/material/" + mate_id).success(function(data){
					var patt_id = data.match(/patternbasic-(\d+)" class="patternWrapper patternShow greenTitle/i);
					if(patt_id){
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

function GetAmountsOfGuildBank(materials, depth){
	var out = "";
	for(var material in materials){
		var html = $("#mat-" + materials[material].ID).html();
		if(html !== undefined){
			var amount = html.match(/x(\d+)/);
			if(amount){ //Something IS in the guild bank.
				var color = 'red';
				var text = 'NOT OK';
				if(amount[1] >= materials[material].Amount){color='green';text = 'OK';}
				out += Array(depth).join("\t") + "<b><span style='color: " + color + "'>" + material +
					" " + amount[1] + " / " + materials[material].Amount + " (" + text + ")</b></span><br>";
			}
			else{
				out += Array(depth).join("\t") + "<b><span style='color: red'>" + material +
					" 0" + " / " + materials[material].Amount + " (NOT OK)</b></span><br>";
			}
		}
		else{
			out += Array(depth).join("\t") + "<b><span style='color: red'>" + material +
				" 0" + " / " + materials[material].Amount + " (NOT OK)</b></span><br>";
		}
		if(materials[material].SubItems !== undefined){ //If it has subitems, get to display them
			out += GetAmountsOfGuildBank(materials[material].SubItems, depth+1);
		}
	}
	return out;
}

function GetAllPatternSkills(select){
	$.ajax(BASE + "/manual/patterns?show=noheader#patterns").success(function(data){
		var trades = data.match(/manual\/patterns\/(.*?)\?/g);
		for (var tradeskill in trades) {
			var trade = trades[tradeskill].match(/patterns\/(.*?)\?/)[1];
			var text;
			text = trade[0].toUpperCase() + trade.slice(1);
			$(document.createElement("option")).val(trade).html(text).appendTo(select);
		}
	});
}

function FillPatterns(select, skill){
	$.ajax(BASE + "/manual/patterns/" + skill + "?show=noheader").success(function(data){
		var patterns = data.match(/(<div class="patternWrapper">\s*<div id="patternbasic.*?<\/div><\/div>)/gi);
		for(var i=0;i<patterns.length;i++){
			var name = patterns[i].match(/patternShow">(.*?)</)[1];
			var id = patterns[i].match(/patternbasic-(\d+)/)[1];
			$(document.createElement("option")).val(id).html(name).appendTo(select);
		}
	});
}

function AddPatternToStorage(){
	var patternStorage = JSON.parse(localStorage.getItem("patternStorage"));
	var trade = $("#addTrade").val();
	var patternId = $("#addPattern").val();
	var patternName = $("#addPattern option:selected").html();
	if(patternStorage[trade]  === undefined){
		patternStorage[trade]= {};
	}
	patternStorage[trade][patternName] = patternId;
	localStorage.setItem("patternStorage", JSON.stringify(patternStorage));
	$("#outDiv").html("<h1>Successfully added " + patternName + " (" + trade + ") to Patternstorage.<h1>");
	AddPatternOutput();
}
function RemovePatternFromStorage(id){
	var patternStorage = JSON.parse(localStorage.getItem("patternStorage"));
	for(var trade in patterns){
		for(var pattern in patterns[trade]){
			if(patterns[trade][pattern] == id){
				patternStorage[trade][pattern] = undefined;
				localStorage.setItem("patternStorage", JSON.stringify(patternStorage));
				$("#outDiv").html("<h1>Successfully removed " + pattern + " (" + trade + ") from Patternstorage.<h1>");
				AddPatternOutput();
				return;
			}
		}
	}

}
