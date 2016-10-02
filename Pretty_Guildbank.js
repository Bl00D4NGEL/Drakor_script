// ==UserScript==
// @name         Pretty guild bank
// @version      1.1
// @description  Sort the guild bank a little prettier
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/guild*
// @match        https://*.drakor.com/guild*
// ==/UserScript==
function Main(){
    var items = $(".drIcon");
    var headingSize = "h2";
    var headings = {
        "Rings": /\/ring/i,
        "Tools": /tool/i,
        "Food": /food/i,
        "Teleports": /teleport/i,
        "Spells": /battle\/[^tp]/i,
        "Equipment": /\/items\/[^ringtol]/i,
        "Enchants": /enhancements\/enchant/i,
        "Augments":  /\/images\/enhancements\/aug\d+\.png/,
        "Durability Scrolls/ Runes": /(dura|rune)/i
    };
    for(var heading in headings){
        var span = $(document.createElement(headingSize)).attr({id:"heading-" + heading.replace(" ", "_")}).html(heading + "<br/>").css("text-align", "center").insertBefore($(".tradeInventory"));
        for(var i=0;i<items.length;i++){
            if($(items[i]).find(".centerImage").attr('src').match(headings[heading])){
                $(items[i]).appendTo(span);
            }
        }
    }
}

$(document).ready(function(){
    Main();
    $("body").on("dblclick", ".tradeMat , .world_bank", function(event){
        console.log(event);
        var id;
        if(event.currentTarget.id){
            id = event.currentTarget.id;
        }
        else{
            alert("Double Click withdrawing is not supported in this browser");
            return;
        }
        var data = "item-$-1";
        if(id.indexOf("mat") !== -1){ //Tradeskill item
            console.log($(event.currentTarget).text());
            data = "mat-$-2";
            if(event.ctrlKey){
                var curAmount = $(event.currentTarget).text().match(/(\d+)/i)[1];
                var amountInput = $(document.createElement("input")).attr({type: "Number", value: curAmount, max: curAmount, id: "input"+ id})
                .css({width: "125px", "font-size": "12px"}).insertBefore($(event.currentTarget).find("span"));
                $(event.currentTarget).on("keydown",function(event){
                    if(event.keyCode === 13){
                        var form = $(document.createElement("form")).attr({action: "/guild/bank/withdrawal"}).appendTo($("body"));
                        $(document.createElement("input")).attr({name: "removeItem", value: data.replace("$", id.slice(4))}).appendTo(form);
                        $(document.createElement("input")).attr({name: "itemQty", value: $("#input" + id).val()}).appendTo(form);
                        $(form).submit();
                    }
                });
                return;
            }
        }
        id = id.slice(4);
        var form = $(document.createElement("form")).attr({action: "/guild/bank/withdrawal", method: "POST"}).appendTo($("body"));
        $(document.createElement("input")).attr({name: "removeItem", value: data.replace("$", id)}).appendTo(form);
        $(form).submit();
    });
});
