// ==UserScript==
// @name         Just statistics v2
// @version      2.0
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

/**
 * @todo
 * - Fetch materials to map ids to rarity + name
 *  => Cache matierla list via localStorage
 * - Re-implement the dialog with similar/equal information
 * - Only load the location map if it's not cached
 *  => Cache should happen via localStorage
 * - Add option to purge material / location cache in UI
 */

/**
 * @typedef {{
 *  item: Number|null,
 *  amount: Number|null,
 *  mastery: Number|null,
 *  buff: Number|null,
 *  gold: Number|null,
 *  xp: Number,
 *  xpDoubled: Boolean,
 *  location: Number|null,
 *  droppedOn: Number
 * }} Drop
 */

/**
 * @typedef {{
 * skill: String,
 * minLevel: Number,
 * maxLevel: Number,
 * name: String,
 * isDungeon: Boolean
 * }} CollectionLocation
 */

const AVAILABLE_SKILLS = [
    "Mining",
    "Gathering",
    "Fishing",
    "Logging",
    "Disenchanting",
    "Ancient Research",
    "Treasure Hunting"
]

/**
 * @param {String} skill 
 * @returns {Promise<Object.<string, CollectionLocation>>}
 */
async function fetchCollectionNodes(skill) {
    if (['Treasure Hunting', 'Disenchanting'].includes(skill)) {
        // We can't really determine collection nodes for treasure hunting
        return []
    }

    let normalizedSkill = skill.toLowerCase()
    if (skill === 'Ancient Research') {
        normalizedSkill = 'researching'
    }

    const response = await fetch(`https://drakor.com/manual/collection/${normalizedSkill}?show=noheader`)

    const el = document.createElement('html')
    el.innerHTML = await response.text()

    const tables = el.getElementsByTagName('table')

    if (tables.length !== 1) {
        return []
    }

    const rows = tables[0].getElementsByTagName('tr')

    const nodes = {}
    for (let row of rows) {
        if (row.childNodes.length !== 2) {
            continue;
        }

        if (row.childNodes[0].tagName !== 'TD') {
            continue;
        }

        const levelRange = row.childNodes[1].innerText.match(/(\d+) - (\d+)/)
        if (!levelRange) {
            continue;
        }

        const name = row.childNodes[0].innerText.replace(' [D]', '')
        const isDungeon = row.childNodes[0].innerText.includes('[D]')

        nodes[name] = {
            skill,
            name,
            isDungeon,
            minLevel: parseInt(levelRange[1]),
            maxLevel: parseInt(levelRange[2])
        }
    }

    return nodes
}

/**
 * @returns {Promise<Array<{id: Number, name: String}>>}
 */
async function fetchLocationsFromMap() {
    const response = await fetch('https://drakor.com/world-map')
    const el = document.createElement('html')
    el.innerHTML = await response.text()

    const images = Array.from(el.getElementsByClassName('minidot'))

    return images
        .filter((image) => !!image.attributes.getNamedItem('title')?.value)
        .map((image) => {
            const id = parseInt(image.id.replace('adot', ''))
            const name = image.attributes.getNamedItem('title').value
                .replace('Area: ', '')
                .replace('\\', '')
                .replace(/\(\d+ Online Here\)/, '')
            return { id, name }
        })
}

/**
 * @returns {Promise<Object.<Number, CollectionLocation>>}
 */
async function buildLocationMap() {
    const [mapLocations, ...collectionNodeLocations] = await Promise.all([fetchLocationsFromMap(), ...AVAILABLE_SKILLS.map((skill) => fetchCollectionNodes(skill))])

    // Take each dictionary of locations and reduce them into one giant dictionary
    const collectionLocations = collectionNodeLocations.reduce((acc, curr) => ({
        ...acc,
        ...curr
    }), {})


    const locations = {}
    for (let location of mapLocations) {
        if (collectionLocations[location.name]) {
            locations[location.id] = collectionLocations[location.name]
        }
    }

    return locations
}

/**
 * Drop material map
 * - Fetch drops from https://drakor.com/manual/drop-tables/disenchanting?show=noheader
 */

const materialMap = {
    123: { // item id as key
        rarity: 1, // 0-4 / Common - Legendary
        name: 'Raw Cod',
        isEventItem: true,
        isQuestItem: true,
        specificNode: null // or set to location name
    }
}


/**
 * Takes in the XHR response from a world action and returns an object that contains information about the drop
 * 
 * @param {String} response 
 * @return {Drop}
 */
function parseResponse(response) {
    /** @type {Drop} */
    const drop = {
        item: null,
        amount: null,
        mastery: null,
        buff: null,
        gold: null,
        xp: 0,
        location: null,
    }

    const responseElement = document.createElement('html')
    responseElement.innerHTML = response

    const droppedMaterials = responseElement.getElementsByClassName('viewMat')
    if (droppedMaterials.length === 1) {
        drop.item = parseInt(droppedMaterials[0].id.substring("viewmat-".length))
    }

    /**
     * A full text example of every possible "drop modifier" is this:
     * You xxx [yyy] xN(+N DR)(+N Mastery)(+N gold) N EXP(+N Double Exp)
     */
    const dropText = responseElement.getElementsByClassName('roundResult')[0]?.innerText.replace(/\s+/g, " ")

    const amount = dropText.match(/You .*? \[.*?\]\s*x(\d+)/)
    if (amount) {
        drop.amount = parseInt(amount[1])
    }

    const gold = dropText.match(/\(\+(\d+) gold\)/)
    if (gold) {
        drop.gold = parseInt(gold[1].replace(',', '').replace('.', ''))
    }

    const masteryBonus = dropText.match(/\(\+(\d+) Mastery\)/)
    if (masteryBonus) {
        drop.mastery = parseInt(masteryBonus[1])
    }

    const buffBonus = dropText.match(/\(\+(\d+) (C|D)R\)/)
    if (buffBonus) {
        drop.buff = parseInt(buffBonus[1])
    }

    const experience = dropText.match(/(\d+) EXP/)
    if (experience) {
        drop.xp = parseInt(experience[1])
    }
    drop.xpDoubled = new RegExp("Double Exp").test(dropText)

    const location = response.match(/startTimer\(\d+, '#skill-timer', 'action_.*?-(\d+)-([0-9a-f]+)/)
    if (location) {
        // location[2] contains some sort of checksum. We could use this to determine the checksum/hash pattern the game uses for nodes
        drop.location = parseInt(location[1])
    }

    return drop
}

const drops = []

const simpleDrop = `
<div class="roundResult areaName">
<span class="hourMin xsmall">11:49:55</span>
<span class="no-mobile">You </span>
caught <span id="viewmat-899" class="Common viewMat">[Cod]</span>
x1 <span class="statValue" style="width:auto;">75 EXP</span>
</div>
<script>
$('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
$('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
$('#freeze-node').html('Freeze this Node!');
startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
$('#nodeExp').css('background-size', '34% 40px');
$('#nodeExp').text('Guild Node EXP: 1,952 / 5,600 (34%)');
$('#exp-fishing').css('background-size', '79.023288888889% 40px');
$('#exp-fishing').text('EXP: 444,506 / 562,500 (79%)');
$('#node-remaining').css('background-size', '31.3% 40px');
$('#node-remaining').text('31% of Node Remaining (Est. 1h 23m)');
</script>
`

const dropWithDr = `
<div class="roundResult areaName">
    <span class="hourMin xsmall">12:13:43</span>
    <span class="no-mobile">You </span>
    caught <span id="viewmat-900" class="Common viewMat">[Haddock]</span>
    x2<span class="buffValue">(+1 DR)</span>
    <span class="statValue" style="width:auto;">75 EXP</span>
</div>
<script>
    $('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
    $('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
    $('#freeze-node').html('Freeze this Node!');
    startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
    $('#nodeExp').css('background-size', '35% 40px');
    $('#nodeExp').text('Guild Node EXP: 1,974 / 5,600 (35%)');
    $('#exp-fishing').css('background-size', '79.456533333333% 40px');
    $('#exp-fishing').text('EXP: 446,943 / 562,500 (79%)');
    $('#node-remaining').css('background-size', '24.0% 40px');
    $('#node-remaining').text('24% of Node Remaining (Est. 1h 4m)');
</script>
`

const dropWithDoubleXp = `
<div class="roundResult areaName">
    <span class="hourMin xsmall">12:16:10</span>
    <span class="no-mobile">You </span>
    caught <span id="viewmat-900" class="Common viewMat">[Haddock]</span>
    x1 <span class="statValue" style="width:auto;">150 EXP</span>
    <span class="buffValue">(+75 Double Exp)</span>
</div>
<script>
    $('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
    $('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
    $('#freeze-node').html('Freeze this Node!');
    startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
    $('#nodeExp').css('background-size', '35% 40px');
    $('#nodeExp').text('Guild Node EXP: 1,976 / 5,600 (35%)');
    $('#exp-fishing').css('background-size', '79.536533333333% 40px');
    $('#exp-fishing').text('EXP: 447,393 / 562,500 (79%)');
    $('#node-remaining').css('background-size', '23.3% 40px');
    $('#node-remaining').text('23% of Node Remaining (Est. 1h 2m)');
</script>
`

const dropWithDrAndDoubleXp = `
<div class="roundResult areaName">
    <span class="hourMin xsmall">12:15:17</span>
    <span class="no-mobile">You </span>
    caught <span id="viewmat-898" class="Superior viewMat">[Terrorfish]</span>
    x2<span class="buffValue">(+1 DR)</span>
    <span class="statValue" style="width:auto;">300 EXP</span>
    <span class="buffValue">(+150 Double Exp)</span>
</div>
<script>
    $('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
    $('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
    $('#freeze-node').html('Freeze this Node!');
    startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
    $('#nodeExp').css('background-size', '35% 40px');
    $('#nodeExp').text('Guild Node EXP: 1,975 / 5,600 (35%)');
    $('#exp-fishing').css('background-size', '79.509866666667% 40px');
    $('#exp-fishing').text('EXP: 447,243 / 562,500 (79%)');
    $('#node-remaining').css('background-size', '23.7% 40px');
    $('#node-remaining').text('23% of Node Remaining (Est. 1h 3m)');
</script>
`

const dropWithGold = `
<div class="roundResult areaName">
    <span class="hourMin xsmall">12:24:47</span>
    <span class="no-mobile">You </span>
    caught <span id="viewmat-900" class="Common viewMat">[Haddock]</span>
    x1<span class="perkValue playTitle">(+2 gold)</span>
    <span class="statValue" style="width:auto;">75 EXP</span>
</div>
<script>
    $('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
    $('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
    $('#freeze-node').html('Freeze this Node!');
    startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
    $('#nodeExp').css('background-size', '35% 40px');
    $('#nodeExp').text('Guild Node EXP: 1,984 / 5,600 (35%)');
    $('#exp-fishing').css('background-size', '79.656533333333% 40px');
    $('#exp-fishing').text('EXP: 448,068 / 562,500 (79%)');
    $('#node-remaining').css('background-size', '20.7% 40px');
    $('#node-remaining').text('20% of Node Remaining (Est. 55m 39s)');
</script>
`

const dropWithMasteryAndGold = `
<div class="roundResult areaName">
    <span class="hourMin xsmall">12:29:01</span>
    <span class="no-mobile">You </span>
    caught <span id="viewmat-899" class="Common viewMat">[Cod]</span>
    x2<span class="masteryValue">(+1 Mastery)</span>
    <span class="perkValue playTitle">(+73 gold)</span>
    <span class="statValue" style="width:auto;">150 EXP</span>
    <span class="buffValue">(+75 Double Exp)</span>
</div>
<script>
    $('#buffBox').html('<div  class="drIcon cardNone slot_default" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">No Buff</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/d-50.png" border=0></div></div>');
</script>
<script>
    $('#mountBox').html('<div id="pets39_155" class="drIcon cardRare equip_mount" ><div class="iconOverlay"><br>Hide<br>Item</div><div class="iconTitle">Mount</div><div class="itemLocked"></div><div class="iconImage noglow"><span class="centerer"></span><img class="centerImage" src="/images/pets/smount-cheetah.png" border=0></div></div>');
    $('#freeze-node').html('Freeze this Node!');
    startTimer(53000, '#skill-timer', 'action_fishing-237-0797c5824c6474cb921a504e3efff88f7bcfdae6933da46a6618a8f4b3d57e6e');
    $('#nodeExp').css('background-size', '35% 40px');
    $('#nodeExp').text('Guild Node EXP: 1,988 / 5,600 (35%)');
    $('#exp-fishing').css('background-size', '79.7232% 40px');
    $('#exp-fishing').text('EXP: 448,443 / 562,500 (79%)');
    $('#node-remaining').css('background-size', '19.3% 40px');
    $('#node-remaining').text('19% of Node Remaining (Est. 52m 7s)');
</script>
`

drops.push(parseResponse(simpleDrop))
drops.push(parseResponse(dropWithDr))
drops.push(parseResponse(dropWithDrAndDoubleXp))
drops.push(parseResponse(dropWithDoubleXp))
drops.push(parseResponse(dropWithGold))
drops.push(parseResponse(dropWithMasteryAndGold))

console.log(drops)