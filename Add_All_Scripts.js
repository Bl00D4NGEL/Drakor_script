// ==UserScript==
// @name         All The Scripts
// @version      1.0
// @description  Enable/Disable all the scripts from the repository
// @author       Dominik "BL00D4NGEL" Peters
// @match        *.drakor.com/*
// ==/UserScript==

/*
TODO:
Add a checker for each script so it will only execute if it's on the right page.
*/

var scripts;

var EXCLUDE = [/Add/i, /Auto/i, "JSON Creator", "Max Button", /Pretty/i, /Ring/i,];

var INFORM_CHANGE = true;

//Load script config
try{
    scripts = JSON.parse(localStorage.getItem("scriptStorage"));
}
catch(ex){
    console.log("Oh no....", ex);
}
if(scripts === null){
    scripts = {}; // Fallback if localStorage is empty or the parsing fails
}

// Now, let's see if there's any new scripts in the repo OR if there is no config, create it anew
// Yay for gitapi
$.ajax("https://api.github.com/repos/Bl00D4NGEL/Drakor_script/contents").success(function(data){
    var copy = scripts;
    scripts = {};
    for(var i=0;i<data.length;i++){
        var d = data[i];
        if(d.name.match(/\.js$/)){
            var name = d.name.match(/^(.*?)\.js$/)[1];
            name = name.replace(/_/gi, " ");
            scripts[name] = {};
            scripts[name].Active = (copy[name] && copy[name].Active === true ? true : false);
            scripts[name].Git = d.git_url;
        }
    }
    // We now loaded all the (new) scripts into the config

    // Use the Exclude filter on the loaded scripts..
    for(var i=0;i<EXCLUDE.length;i++){
        var e = EXCLUDE[i];
        if(typeof e != "object"){
            // When it's no RegEx we can simply look for the word as a key
            if(e in scripts){
                console.log("[Key in Object] Deleting '" + e + "' because we want to exclude it!");
                delete scripts[e];
            }
        }
        else{
            // If it is a RegEx we need to get the keys and match each key....
            var keys = Object.keys(scripts);
            for(var k=0;k<keys.length;k++){
                if(keys[k].match(e)){
                    console.log("[RegEx] Deleting '" + keys[k] + "' because the RegEx '" + e + "' matches it and we want to exclude it!");
                    delete scripts[keys[k]];
                }
            }
        }
    }

    // Let's create some user interface so they can check/ uncheck which scripts they want to use
    // Since this config option will only accessed in the normal game, we don't need to generalize the append-point
    var mainDiv = $(document.createElement("div"));
    var mainTable = $(document.createElement("table")).appendTo(mainDiv);
    var tr = $(document.createElement("tr")).appendTo(mainTable);
    var td = $(document.createElement("td")).html("Scriptname").appendTo(tr);
    td.clone().html("Enable/Disable").appendTo(tr);

    var counter = 0; //Id-Counter
    // Add the scripts + checkboxes
    for(var script in scripts){
        var tr = $(document.createElement("tr")).appendTo(mainTable);
        var td = $(document.createElement("td")).html(script).appendTo(tr);
        var td_2 = td.clone().html("").appendTo(tr);
        var check = $(document.createElement("input")).attr({"type": "checkbox", "id": "check-" + counter}).appendTo(td_2);
        if(scripts[script].Active === true){ // Set checkbox checked if the script is activated
            check.prop("checked", "checked");
        }
        check.on("click", function(){
            scripts[$($(this).parent().parent().children()[0]).html()].Active = $(this).prop("checked");
            localStorage.setItem("scriptStorage", JSON.stringify(scripts));
            //alert("Please refresh the page in order to load/unload the script(s)!");
        });
        // If the user marked this before, also load it NOW!
        if(scripts[script].Active === true){
            console.log("Loading '" + script + "' from url '" + scripts[script].Git + "'");
            // Load via ajax, response is JSON
            $.ajax(scripts[script].Git).success(function(data){
                // function atob --> Base64 -> Normal
                // function btoa --> Normal -> Base64
                var scriptCode = atob(data.content);
                var m = scriptCode.match(/\/\/ @match\s+(.*?)\n/g);
                if(m){
                    for(var i=0;i<m.length;i++){
                        var t = m[i].match(/\/\/ @match\s+(.*?)\n/)[1];
                        t = escapeRegExp(t);
                        t = t.replace(/\\\*/g, ".*?").replace("\\.drakor", "drakor");
                        var regex = new RegExp(t, "gi");
                        if(document.location.href.match(regex)){
                            $("<script>" + scriptCode + "</script>").appendTo($("head"));
                        }
                    }
                }
            });
        }
        counter++;
    }
    if(document.location.href.match(/drakor.com\/$/)){
        mainDiv.appendTo($("body")); //gstopmenu??
    }
    else{
        console.log("This is not the main window, I will not add the menu now...!");
        mainDiv = undefined;
    }
});

function escapeRegExp(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
