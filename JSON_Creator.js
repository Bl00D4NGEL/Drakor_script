// ==UserScript==
// @name         JSON-Creator
// @match        http://www.drakor.com/manual
// ==/UserScript==

var BASE = 'http://www.drakor.com';
var debug = 1;

function GetAllDrops(){
	var object = {};
	$.ajax(BASE + "/manual/drop-tables?show=noheader").success(function(data){
		var tradeskills = data.match(/manual\/drop-tables\/(.*?)\?/g);
		for(var i=0;i<tradeskills.length;i++){
			//Make Ajax call to each tradeskill page
			var trade = tradeskills[i].match(/manual\/drop-tables\/(.*?)\?/)[1];
			$.ajax(BASE + "/manual/drop-tables/" + trade + "?show=noheader").success(function(data){
				var levelStart = 0;
				var levelEnd = 0;
				var name = '';
				var rarity = '';
				var nodeName = 'Any';
				var tradeskill = $(this)[0].url.match(/drop-tables\/(.*?)\?/)[1];
				if(debug > 0)
					console.log("TRADESKILL: " + tradeskill  + "\n\nDATA:\n" + data);
				var trs = data.match(/<tr\s?>(.*?)<\/\s?tr\s?>/g);
				for(var j=0;j<trs.length;j++){
					console.log("TR: " + trs [j]);
					var id;
					var tds = trs[j].match(/<td.*?>(.*?)<\/td>/g);
					if(tds){
						if(debug > 0)
							console.log("TDS.length: " + tds.length);
						for(var k=0;k<tds.length;k++){ // ID, Rarity and Name
							if(k === 0){
								var m_id = tds[k].match(/viewman\-(\d+)/);
								if(m_id){
									id = m_id[1];
									var m_name = tds[k].match(/\[(.*?)\]/);
									if(m_name){
										name = m_name[1];
									}
									var m_rarity = tds[k].match(/class="(.*?)\s/);
									if(m_rarity){
										rarity = m_rarity[1];
									}
								}
							}

							if(k === 1){ //Levelrange
								var start = tds[k].match(/>(\d+)/);
								if(start){
									levelStart = start[1];
								}

								var end = tds[k].match(/(\d+)</);
								if(end){
									levelEnd = end[1];
								}
							}

							if(k === 2){ //Node
								var m_node = tds[k].match(/>(.*?)</);
								if(m_node){
									if(m_node[1] !== 'Any Node of Relevant Level'){
										nodeName = m_node[1];
									}
								}
							}
						}

						if(id){ //If we matched an id, made an object with it
							if(debug > 0)
								console.log("Creating object with id: '" + id + "'");
							object[id] = {};
							object[id].tradeskill = tradeskill;
							object[id].levelStart = levelStart;
							object[id].levelEnd = levelEnd;
							object[id].name = name;
							object[id].rarity = rarity;
							object[id].nodeName = nodeName;
							//Save the object to localstorage for easier access later
							localStorage.setItem("drop-table", JSON.stringify(object));
						}

					}
				}
			});
		}
	});
}

function GetAllPatterns(){
	var object = {};
	$.ajax(BASE + "/manual/patterns?show=noheader").success(function(data){
		//console.log(data);
		var trades = data.match(/manual\/patterns\/(.*?)\?/g);
		for(var tradeskill in trades){
			var trade = trades[tradeskill].match(/patterns\/(.*?)\?/)[1];
			if(debug > 0)
				console.log("Making AJAX TO: http://www.drakor.com/manual/patterns/" + trade + "?show=noheader");
			$.ajax(BASE + "/manual/patterns/" + trade + "?show=noheader").success(function(data){
				//console.log(data);
				//Get all the patterns of the result-site
				var m_patterns = data.match(/(<div class="patternWrapper">\s*<div id="patternbasic.*?<\/div><\/div>)/gi);
				for(var i=0;i<m_patterns.length;i++){
					var trade = $(this)[0].url.match(/patterns\/(.*?)\?/)[1];
					//Get the name of the pattern
					var name = m_patterns[i].match(/patternShow">(.*?)</)[1];
					//Get the gold cost of the pattern (without comma)
					var cost = m_patterns[i].match(/patternPrice">(.*?)<\/div>/)[1].replace("g","");
					cost = cost.replace(/\,/g, "");
					var id = m_patterns[i].match(/patternbasic-(\d+)/)[1];
					//console.log("ID:" + id + "\nNAME: " + name + "\nPRICE: " + cost);
					if(object[id] === undefined){
						object[id] = {}; //Create a new object for each new pattern IF it does not
						//already exist.
						object[id].name = name;
						if(!cost.match(/^\d+$/)){
							console.log("COST ARE NOT ONLY NUMBERS " + cost);
							cost = 0; // This should only trigger for Quest Reward
						}
						object[id].cost = Number(cost);
						object[id].tradeskill = trade;
						//Now make an ajax call /show/patternbasic/id
						$.ajax(BASE + "/show/patternbasic/" + id).success(function(data){
							id = $(this)[0].url.match(/patternbasic\/(\d+)/)[1];
							var expMatch = data.match(/<div class="patternExp">(.*?)<\/div>/);
							if(expMatch){
								var expText = expMatch[1];
								//Match exp, level, combinetime and exempt data from the matched pattern
								var match = expText.match(/<b>(\d+) \((\d+) EXP\) - (\d+) \((\d+) EXP\)<\/b>.*?(\d+) seconds per combine/i);
								var expStart = Number(match[2]);
								var expEnd = Number(match[4]);
								var levelStart = Number(match[1]);
								var levelEnd = Number(match[3]);
								var combineTime = Number(match[5]);
								var exempt = expText.match(/exempt/i);
								if(exempt){exempt = 1;}
								else{exempt = 0;}
								object[id].levelStart = Number(levelStart);
								object[id].levelEnd = Number(levelEnd);
								object[id].expStart = Number(expStart);
								object[id].expEnd = Number(expEnd);
								object[id].combineTime = Number(combineTime);
								object[id].exempt = Number(exempt);
							}
							else{//If the pattern didn't match,set everything to 0
								object[id].levelStart = Number(0);
								object[id].levelEnd = Number(0);
								object[id].expStart = Number(0);
								object[id].expEnd = Number(0);
								object[id].combineTime = Number(0);
								object[id].exempt = Number(0);
							}
							var descriptionMatch = data.match(/<div class="patternDesc">(.*?)<\/div>/);
							if(descriptionMatch){ //Get the Description of the pattern
								var desc = descriptionMatch[1].replace(/<.*?>/g, "");
								object[id].description = desc;
							}
							else{
								object[id].description = "";
							}
							object[id].materials = {};
							var reqMaterialsMatch = data.match(/<b>Required Materials\:<\/b>\s*(.*?)<\/div>\s*(?:<\/div>|<\/?br\/?>)/);
							if(reqMaterialsMatch){ //Get the required materials for the pattern
								var mats = reqMaterialsMatch[1];
								var reqs = mats.match(/(div.*?<\/div>\s*x\d+)/g);
								for(var j = 0; j < reqs.length; j++){
									var amount = reqs[j].match(/<\/div>\s*x(\d+)/)[1];
									var material = reqs[j].match(/\[(.*?)\]/)[1];
									object[id].materials[material] = Number(amount);
								}
							}
							else{}

							object[id].result = {};
							var resultMaterialMatch = data.match(/<b>Pattern Creates\:<\/b>\s*(.*?)<\/div><\/div>/);
							if(resultMaterialMatch){ //Get the End products of the pattern
								var results = resultMaterialMatch[1];
								var match = results.match(/(<div.*?>.*?x\d+)/g);
								for(var j = 0; j < match.length; j++){
									var rarity = match[j].match(/class="viewMat (.*?)">/i)[1];
									var amount = match[j].match(/x(\d+)/)[1];
									var name = match[j].match(/\[(.*?)\]/)[1];
									object[id].result[name] = {};
									object[id].result[name].amount = Number(amount);
									object[id].result[name].rarity = rarity;

								}
							}
							else{//Creates "nothing"
								object[id].result[object[id].name] = {};
								//Try to get the rarity from the name
								var rarity = "";
								var rarityRegex = /(common\+|superior\+|rare\+|epic\+|legendary\+|common|superior|rare|epic|legendary)/i;
								var matchAttempt_1 = object[id].name.match(rarityRegex);
								if(matchAttempt_1){
									rarity = matchAttempt_1[1];
									if(debug > 0)
										console.log("I have found the rarity! #1 | " + object[id].name + " | " + rarity);
								}
								else{
									var matchAttempt_2 = object[id].description.match(rarityRegex);
									if(matchAttempt_2){
										rarity = matchAttempt_2[1];
										if(debug > 0)
											console.log("I have found the rarity! #2 | " + object[id].description + " | " + rarity);
									}
									else{
										console.log("I've given up on trying to get the rarity for '" + object[id].name + "'");
										rarity = "Undefined";
									}
								}
								//String formatting to first letter is always capital and rest lower case
								rarity = rarity.toLowerCase();
								rarity = (rarity[0].toUpperCase() + rarity.substring(1));
								//Since this will probably create food, weapon etc the base-amount *will* be 1
								object[id].result[object[id].name].amount = Number(1);
								object[id].result[object[id].name].rarity = rarity;
							}
							//Save the object to localstorage for easier access later
							localStorage.setItem("patternObject", JSON.stringify(object));
						});
					}
					else{
						console.log("ID: " + id + " is already bound to an object..\nName: " + name + "\nObject:");
						conosle.log(object[id]);
					}
				}
			});
		}
	});
}
