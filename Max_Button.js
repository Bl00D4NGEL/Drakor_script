// ==UserScript==
// @name         Max-Button-Script
// @version      1.0
// @description  Enables a "MAX" button on any pattern-related skill
// @author       Bl00D4NGEL
// @match        http://www.drakor.com/
// ==/UserScript==

setInterval(function () {
    if (document.getElementsByClassName("patternBody").length !== 0) {
        var btn = document.createElement("BUTTON");
        var btnText = document.createTextNode("MAX");
        btn.appendChild(btnText);
        btn.style.backgroundColor = "#0041C2";
        btn.addEventListener("click", function () {
            var patternClass = document.getElementsByClassName("thinInputsm");
            patternClass[patternClass.length - 1].value = patternClass[patternClass.length - 1].length;
        });
        for (var i = 0; i < document.getElementsByClassName("patternBody").length; i++) {
            if (document.getElementsByClassName("patternBody")[i].lastChild.innerHTML !== "MAX") {
                document.getElementsByClassName("patternBody")[i].appendChild(btn);
            }
        }
    }
}, 1000);