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

for(var estate in estates){
	$.ajax(BASE + "/show/patternbasic/" + estates[estate]).success(function(data){
		
	});
}

