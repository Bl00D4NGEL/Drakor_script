// ==UserScript==
// @name         Battle-statistics v2
// @version      2.0
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        https://*.drakor.com*
// ==/UserScript==

const CONSOLIDATION_LOOT_AMOUNT = 1;
const TIMER_REGEX = /[1-9]0?%/;

const battleHelper = {
    _getAttribute: (battle, attribute) => battleHelper._filterAttribute(battle, attribute).length === 0 ? 0 : battleHelper._filterAttribute(battle, attribute)[0][attribute],
    _filterAttribute: (battle, attribute) => battle.filter(round => round[attribute] !== undefined),
    _getAverage: (val1, battles) => (val1 / (battles.length === 0 ? 1 : battles.length)).toFixed(2),
    _getTotal: (battles, callbackFn) => battles.reduce((total, battle) => total + callbackFn(battle), 0),

    objectToArray: (battles) => Object.keys(battles).map(battleId => battles[battleId]),

    wasVictorious: (battle) => battleHelper._getAttribute(battle, 'victory') === true,
    getExperience: (battle) => battleHelper._getAttribute(battle, 'experience'),
    getGold: (battle) => battleHelper._getAttribute(battle, 'gold'),
    getLoot: (battle) => battleHelper._getAttribute(battle, 'loot'),

    getTotalExperience: (battles) => battleHelper._getTotal(battles, battleHelper.getExperience),
    getAverageExperience: (battles) => battleHelper._getAverage(battleHelper.getTotalExperience(battles), battles),

    getTotalGold: (battles) => battleHelper._getTotal(battles, battleHelper.getGold),
    getAverageGold: (battles) => battleHelper._getAverage(battleHelper.getTotalGold(battles), battles),

    getTotalLootItems: (battles) => battleHelper._getTotal(battles, battleHelper.getLoot),
    getAverageLootItems: (battles) => battleHelper._getAverage(battleHelper.getTotalLootItems(battles), battles),
    getUnopenedLootBags: (lootBags) => lootBags.filter(lootBag => lootBag.opened === false),

    getTotalWonBattles: (battles) => battleHelper._getTotal(battles, (battle) => battleHelper.wasVictorious(battle) ? 1 : 0),
    getTotalWonBattlesWithoutLoot: (battles) => battleHelper._getTotal(battles, (battle) => battleHelper.wasVictorious(battle) && battleHelper.getLoot(battle) === 0 ? 1 : 0),
    getTotalWonBattlesWithLoot: (battles) => battleHelper.getTotalWonBattles(battles) - battleHelper.getTotalWonBattlesWithoutLoot(battles)
};

const battleStatisticsStorage = {
    storageKey: 'BattleStatisticsStorage',
    _store: {},
    get: () => {
        return battleStatisticsStorage._store;
    },
    _init: () => {
        battleStatisticsStorage._store = battleStatisticsStorage._loadFromLocalStorage();

        battleStatisticsStorage._store.battles = battleStatisticsStorage._store.battles || {};
        battleStatisticsStorage._store.lootBags = battleStatisticsStorage._store.lootBags || [];
        battleStatisticsStorage._store.sellData = battleStatisticsStorage._store.sellData || {
            itemsSold: 0,
            goldGained: 0
        };
    },
    _loadFromLocalStorage: () => {
        if (localStorage.getItem(battleStatisticsStorage.storageKey) !== null) {
            return JSON.parse(localStorage.getItem(battleStatisticsStorage.storageKey));
        }
        return {};
    },
    _saveToLocalStorage: () => {
        localStorage.setItem(battleStatisticsStorage.storageKey, JSON.stringify(battleStatisticsStorage._store));
    },
    _reset: () => {
        battleStatisticsStorage._store = {};
        battleStatisticsStorage._init();
        alert('Storage has been reset!');
    }
};

initBattleStatistics();

function initBattleStatistics() {
    battleStatisticsStorage._init();
    fixLootDisplay();

    $(document).ajaxComplete(mapAjax);
    window.battleStatisticsStorage = battleStatisticsStorage;
    window.addEventListener("unload", battleStatisticsStorage._saveToLocalStorage);
}

function fixLootDisplay() {
    const store = battleStatisticsStorage.get();
    if (battleHelper.getTotalWonBattlesWithLoot(battleHelper.objectToArray(store.battles)) === store.lootBags.length) {
        return;
    }
    modifyLootBag(getTotalLootBagItems(store.battles) - store.lootBags.reduce((total, lootBag) => total += lootBag.items.length, 0) - parseInt(document.querySelector('#load-openloot span').innerText));
}

function getTotalLootBagItems(battles) {
    return battleHelper.getTotalLootItems(battleHelper.objectToArray(battles));
}

function mapAjax(event, xhr, settings) {
    const url = settings.url;
    if (url === '/arena') {
        handleArena();
    } else if (url.match(/inventory/)) {
        handleInventory();
    } else if (url.match(/\/battle-round\/attack/)) {
        handleBattleRound(url, xhr.responseText);
    } else if (url === "/sell/sellall") {
        handleSellAll(xhr.responseText);
    } else if (url.match(/openloot\/open\/all/i)) {
        handleOpenLootAll(xhr.responseText);
    } else if (url.match(/openloot\/open\/\d+/)) {
        handleOpenLoot(xhr.responseText);
    } else if (url.match(/\/world\/action_disenchanting/i)) {
        handleDisenchantingAction(xhr.responseText);
    }
}

function handleArena() {
    document.querySelectorAll('.arenaContainer')[2].innerHTML = generateArenaOutput().replace(/\n/g, '<br>');
    document.getElementById('reset-battle-statistics').addEventListener('click', battleStatisticsStorage._reset);
}

function generateArenaOutput() {
    const store = battleStatisticsStorage.get();
    const battles = battleHelper.objectToArray(store.battles);
    return `You fought a total of ${battles.length} battle(s).
You looted ${battleHelper.getTotalLootItems(battles)} total items (${battleHelper.getAverageLootItems(battles)} on average).
You sold ${store.sellData.itemsSold} items for ${store.sellData.goldGained} gold.
You gained no loot in ${battleHelper.getTotalWonBattlesWithoutLoot(battles)} (${percent(battleHelper.getTotalWonBattlesWithoutLoot(battles), battleHelper.getTotalWonBattles(battles))}%) victorious battle(s).
You gained a total of ${battleHelper.getTotalExperience(battles)} experience (${battleHelper.getAverageExperience(battles)} on average) and earned a total of ${battleHelper.getTotalGold(battles)} gold (${battleHelper.getAverageGold(battles)} on average).
You won ${battleHelper.getTotalWonBattles(battles)} / ${battles.length} (${percent(battleHelper.getTotalWonBattles(battles), battles.length)}%) battle(s).
<div id="reset-battle-statistics" class="bv_button bv_small_font">Reset Statistics</div>`;
}

function percent(val1, val2) {
    return (val1 / (val2 === 0 ? 1 : val2) * 100).toFixed(2)
}

function handleInventory() {
    const drIcons = $('.drIcon');
    drIcons.on('click', handleInventoryClick);
    drIcons.on('dblclick', handleInventoryDoubleClick);
}

function handleInventoryClick(e) {
    const myTimer = setInterval(() => {
        if (isCardLoaded(e.currentTarget) && getSellButtonForCard(e.currentTarget) !== null) {
            $(getSellButtonForCard(e.currentTarget)).on('click', () => trackSelling(e.currentTarget));
            clearInterval(myTimer);
        }
    }, 100);
}

function getSellButtonForCard(element) {
    return document.getElementById('sell-' + getCardId(element));
}

function handleInventoryDoubleClick(e) {
    if (e.currentTarget.id !== '') {
        if (isElementDurabilityRepairer(e.currentTarget) && !doesElementHaveZeroDurability(e.currentTarget)) {
            clickRepairButton(e.currentTarget);
        } else {
            trackSelling(e.currentTarget, true);
        }
    }
}

function getCardId(element) {
    return element.id.slice(4)
}

function isElementDurabilityRepairer(element) {
    return element.querySelector(".iconTitle").innerText.match(/(Durability|Rune)/i) !== null
}

function doesElementHaveZeroDurability(element) {
    return element.title.match(/: 0$/) !== null
}

function clickRepairButton(repairerElement) {
    const myTimer = setInterval(function () {
        if (isCardLoaded(repairerElement) && document.getElementById('load-use-' + getCardId(repairerElement)) !== null) {
            document.getElementById('load-use-' + getCardId(repairerElement)).click();
            clearInterval(myTimer);
        }
    }, 10);
}

function isCardLoaded(element) {
    return element.innerHTML.match(/loading/) === null;
}

function trackSelling(element, clickButton = false) {
    const store = battleStatisticsStorage.get();
    const myTimer = setInterval(function () {
        if (isCardLoaded(element) && document.getElementById('sell-' + getCardId(element)) !== null) {
            store.sellData.itemsSold++;
            const cardElement = document.getElementById('card' + getCardId(element));
            const sellValue = isElementDurabilityRepairer(element) ? getDurabilityScrollValue(cardElement) : getItemValue(cardElement);
            store.sellData.goldGained = sellValue;
            log('Sold an item for ' + sellValue + ' gold');
            if (clickButton) {
                $(getSellButtonForCard(element)).off('click'); // Remove listener to prevent double-logging
                getSellButtonForCard(element).click();
            }
            clearInterval(myTimer);
        }
    }, 100);
}

function getDurabilityScrollValue(element) {
    const value = getNumberFromTextWithRegex(element.innerHTML, /([0-9,]+)\s?\/\s?[0-9,]+\sGold/);
    if (value === 0) {
        // Full durability scroll cannot match regex
        return getItemValue(element);
    }
    return value;
}

function getItemValue(element) {
    return getNumberFromTextWithRegex(element.innerHTML, /([0-9,]+)\sGold/);
}

function handleDisenchantingAction(responseText) {
    const item = getNextItemToDisenchant(responseText);
    if (item === null) {
        log('Cannot find items to disenchant');
    } else {
        const nextItemDisplay = document.createElement('div');
        const span = document.createElement('span');
        span.appendChild(document.createTextNode('Hit the d key to start disenchanting '));
        nextItemDisplay.appendChild(span);
        nextItemDisplay.appendChild(item.querySelector('.cLink').cloneNode(true));
        const ignoreEventCheckbox = document.getElementById('ignore_event');
        ignoreEventCheckbox.parentNode.insertBefore(nextItemDisplay, ignoreEventCheckbox);

        addShortcut(item.childNodes[0], 'KeyD');
    }
}

function getNextItemToDisenchant(responseText) {
    const itemRegex = /<div id="load-world-disenchanting-\d+.*?<\/div>/g;
    if (responseText.match(itemRegex) !== null) {
        const id = getNumberFromTextWithRegex(responseText.match(itemRegex)[0], /disenchanting-(\d+)/);
        if (id > 0) {
            return document.getElementById('name' + id).parentNode;
        }
    }
    return null;
}

function handleBattleRound(url, responseText) {
    const battleData = getBattleData(responseText);
    battleData.id = getBattleIdFromUrl(url);
    if (isBattleRoundPassAll(url)) {
        battleData.passAll = true;
    } else {
        battleData.spellId = getSpellIdFromUrl(url);
        battleData.round = getAmountOfRoundsInBattle(responseText);
    }
    battleData.difficulty = getDifficulty();
    saveBattleData(battleData);
}

function getBattleData(responseText) {
    const battleData = {};
    if (isBattleDone(responseText)) {
        battleData.totalRounds = getAmountOfRoundsInBattle(responseText);
        if (wasBattleVictorious(responseText)) {
            battleData.victory = true;
            battleData.experience = getGainedExperience(responseText);
            battleData.gold = getDroppedGold(responseText);
            // TODO: Add gold gained from mystery gold?
            // <div class="npcReward">0 gold has dropped.<span class="perkValue playTitle">(+12 gold)</span></div>

            battleData.loot = wasLootDropped(responseText) ? getAmountOfItemsInLootBag(responseText) : 0;
            if (battleData.loot > 1) {
                modifyLootBag(battleData.loot - 1);
            }
        } else {
            battleData.defeat = true;
            battleData.loot = wasLootDropped(responseText) ? CONSOLIDATION_LOOT_AMOUNT : 0;
        }
    }
    return battleData;
}

function isBattleDone(responseText) {
    return wasBattleDefeat(responseText) || wasBattleVictorious(responseText);
}

function getBattleIdFromUrl(url) {
    return getNumberFromTextWithRegex(url, /\/battle-round\/attack.*?\/(\d+)\//);
}

function getSpellIdFromUrl(url) {
    return getNumberFromTextWithRegex(url, /\/battle-round\/attack.*?\/\d+\/(\d+)/);
}

function isBattleRoundPassAll(url) {
    return url.match(/\/battle-round\/attack-pass\/\d+\/all/) !== null;
}

function getDifficulty() {
    return getValueFromTextWithRegex(document.getElementById("drakorWorld").querySelector(".battleDiff").innerHTML, /:\s(\w+).*?/);
}

function getGainedExperience(responseText) {
    return getNumberFromTextWithRegex(responseText, /received ([0-9,]+) EXP/);
}

function getDroppedGold(responseText) {
    return getNumberFromTextWithRegex(responseText, /([0-9,]+) gold has dropped/);
}

function wasLootDropped(responseText) {
    return responseText.match(/modLoot\(\d+\)/) !== null;
}

function getAmountOfItemsInLootBag(responseText) {
    return getNumberFromTextWithRegex(responseText, /with\s(\d+)\sItem/);
}

function getAmountOfRoundsInBattle(responseText) {
    return getMatchLengthFromTextWithRegex(responseText, /Attack Round/g);
}

function getNumberFromTextWithRegex(text, regex) {
    if (text.match(regex) !== null) {
        return parseInt(text.match(regex)[1].replace(/,/g, ''));
    }
    return 0;
}

function getValueFromTextWithRegex(text, regex) {
    if (text.match(regex) !== null) {
        return text.match(regex)[1];
    }
    return '';
}

function getMatchLengthFromTextWithRegex(text, regex) {
    if (text.match(regex) !== null) {
        return text.match(regex).length;
    }
    return 0;
}

function wasBattleVictorious(responseText) {
    return responseText.match(/Victory!!/) !== null;
}

function wasBattleDefeat(responseText) {
    return responseText.match(/Defeat!!/) !== null;
}

function modifyLootBag(modifier) {
    if (!isNaN(modifier)) {
        const openLootSpan = document.querySelector('#load-openloot span');
        openLootSpan.innerText = parseInt(openLootSpan.innerText) + modifier;
    }
}

function saveBattleData(battleData) {
    const store = battleStatisticsStorage.get();
    if (!Object.keys(store.battles).includes(battleData.id.toString())) {
        store.battles[battleData.id] = [];
    }
    store.battles[battleData.id].push(battleData);
}

function handleSellAll(responseText) {
    const store = battleStatisticsStorage.get();
    store.sellData.goldGained += getGoldGainedFromSellAll(responseText);
    store.sellData.itemsSold += getAmountOfSoldItems(responseText);
    log('Sold ' + getAmountOfSoldItems(responseText) + ' item(s) for ' + getGoldGainedFromSellAll(responseText) + ' gold');
}

function getAmountOfSoldItems(responseText) {
    return getMatchLengthFromTextWithRegex(responseText, /drIcon/g);
}

function getGoldGainedFromSellAll(responseText) {
    return getNumberFromTextWithRegex(responseText, /<span class="areaName">([0-9,]+) g<\/span>/);
}

function handleOpenLootAll(responseText) {
    const lootBags = getLootBags(responseText);
    const store = battleStatisticsStorage.get();
    store.lootBags = store.lootBags.concat(lootBags);
    store.lootBags.forEach(lootBag => lootBag.opened = true);
    resetLootBag();
    log('Opened ' + lootBags.length + ' loot bag(s) with ' + lootBags.reduce((total, lootBag) => total + lootBag.items.length, 0) + ' item(s)');
}

function getLootBags(responseText) {
    const lootBagRegex = /<h3>.*?<script>/g;
    if (responseText.match(lootBagRegex) !== null) {
        return responseText.match(lootBagRegex).map(getLootBagData);
    }
    return [];
}

function getLootBagData(lootBagText) {
    return {
        type: getLootBagType(lootBagText),
        items: getLootBagItems(lootBagText),
        opened: false,
    };
}

function getLootBagType(lootBagText) {
    return getValueFromTextWithRegex(lootBagText, /<h3>Opening \[\s*(.*?)\s*]<\/h3>/);
}

function getLootBagItems(lootBagText) {
    return lootBagText.match(/<div class="cardContainer.*?<\/b>\s*<\/div>\s*<\/div>/g).map(getLootBagItemData);
}

function getLootBagItemData(lootItemText) {
    return {
        rarity: getItemRarity(lootItemText),
        type: getItemType(lootItemText)
    };
}

function getItemRarity(lootItemText) {
    return getValueFromTextWithRegex(lootItemText, /class="cardQuality">(.*?)<\/div>/);
}

function getItemType(lootItemText) {
    return getValueFromTextWithRegex(lootItemText, /class="cardType">(.*?)<\/span>/);
}

function resetLootBag() {
    document.querySelector('#load-openloot span').innerText = 0;
}

function handleOpenLoot(responseText) {
    const lootBag = getLootBagData(responseText);
    lootBag.opened = true;
    battleStatisticsStorage.get().lootBags.push(lootBag);
}

function addShortcut(element, keyCode, keyName) {
    const handleKeydown = (e) => {
        if ((keyCode !== undefined && e.code === keyCode) || (keyName !== undefined && e.key === keyName)) {
            if (!isInputFocused()) {
                if (isNpcTimerRunning() || isSkillTimerRunning()) {
                    e.preventDefault();
                    return;
                }
                window.removeEventListener('keydown', handleKeydown, true);
                element.click();
            }
        }
    };
    window.addEventListener('keydown', handleKeydown, true);
}

function isInputFocused() {
    return $("input").is(":focus");
}

function isNpcTimerRunning() {
    const npcTimer = document.getElementById('npcTimer');
    if (npcTimer !== null) {
        return npcTimer.innerText.match(TIMER_REGEX) !== null;
    }
    return false;
}

function isSkillTimerRunning() {
    const skillTimer = document.getElementById('skill-timer');
    if (skillTimer !== null) {
        return skillTimer.innerText.match(TIMER_REGEX) !== null;
    }
    return false;
}

function log(text) {
    console.log("[log] " + text);
}
