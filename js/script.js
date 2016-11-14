/*
Moods
=====
- [X] Hungry
- [X] Thirsty
- [ ] Happy
- [ ] Sad
- [ ] Tired
 */
"use strict";

var moods = [
    "hungry",
    "thirsty"
];

var imgEl = document.getElementById("mood-img");
var mood = 0;

function onTick() {
    if (mood < moods.length) {
        mood++;
    } else {
        mood = 0;
    }

    imgEl.src = "img/states/" + moods[mood] + "/" + moods[mood] + ".png";
}

document.getElementById("chng-mood-btn").onclick = onTick;
