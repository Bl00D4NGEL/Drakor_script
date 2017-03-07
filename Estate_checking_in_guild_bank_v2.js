// Userscript

var BASE = 'http://www.drakor.com';
var debug = 1;


var estates = {
	"Shack": 763,
	"House": 764,
	"Hall": 765,
	"Estate": 766,
	"Keep": 767,
	"Fort": 768,
	"Palace": 769,
	"Fortress": 770
};


	var materials = {};
function GetMaterials(id){
	$.ajax(BASE + "/show/patternbasic/" + id).success(function(data){
		var ajax_id = $(this)[0].url.match(/\/(\w+)$/)[1];
		if(debug > 0){
			console.log("AJAX TO ID: " + ajax_id);
		}
		var reqMaterialsMatch = data.match(/<b>Required Materials\:<\/b>\s*(.*?)<\/div>\s*(?:<\/div>|<\/?br\/?>)/);
		if (reqMaterialsMatch) { //Get the required materials for the pattern
			console.log("FOUND REQUIRED MATERIALS!");
			console.log(reqMaterialsMatch);
			var mats = reqMaterialsMatch[1];
			var reqs = mats.match(/(div.*?<\/div>\s*x\d+)/g);
			for (var j = 0; j < reqs.length; j++) {
				var amount = reqs[j].match(/<\/div>\s*x(\d+)/)[1];
				var material = reqs[j].match(/\[(.*?)\]/)[1];
				console.log("Required #" + j + ": " + material + " x" + amount);
				var mate_id = reqs[j].match(/div id="mate-(\d+)/)[1];
				//Make Ajax to that pattern and check if it has a pattern
				//If it has a pattern -> Craftable
				$.ajax(BASE + "/show/material/" + mate_id).success(function(data){
					var patt_id = data.match(/patternbasic-(\d+)" class="patternWrapper patternShow greenTitle/i);
					if(patt_id){
						var material = data.match(/<div.*?\[([\s\w]+)\]/)[1];
						if(debug > 0){
							console.log("PATTERN-ID: " + patt_id  + " | MATERIAL: " + material);
						}
//						materials[material].Other = GetMaterials(patt_id[1]);
					}
				});
				materials[material] = {};
				materials[material].Amount = Number(amount);
			}
			return materials;
	    	}
		else{
			return {};
		}
	});
}

