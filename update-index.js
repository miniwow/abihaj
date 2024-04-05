import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts'

// run with: deno run --allow-net --allow-write update-index.js

const spreadSheets = {
  19: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-Qb8tqIyiSCoRK7u3UkC50GOUax53ZoHyM8ZgJITXwhmMKrWzJdr_V7a6aUh0rEGCfI4vnESLqicb/pubhtml',
  29: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8TGOVLdVFmTbkmhKJ7lKoNmBRKX-N2J0w0eFYxH1FgWhnU5iERxggnhdUD4HVxlM7ZgDmpXTp899Z/pubhtml',
  39: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSEcTaqNdsolg4cic8AHihB3xTSw3KEyoesCZTsoux9bQlJIw4DR5vpyGXruNx2aWPbzjwlFTfI6kSc/pubhtml',
}

const categories = {
  1: 'Weapons, OHs, shields, wands',
  2: 'Trinkets, necks, rings',
  3: 'Mail',
  4: 'Leather',
  5: 'Cloth',
}

const getSpreadSheetData = async ([level, link]) => {
  const res = await fetch(link)
  console.log('bracket', Number(level), 'loaded')
  const t = await res.text()
  const dom = new DOMParser().parseFromString(t, 'text/html')
  const result = {}
  for (const [i, table] of dom.querySelectorAll('table tbody').entries()) {
    if (!i) continue
    const [head, ...rows] = table.querySelectorAll('tr')
    const labels = [...[...head.querySelectorAll('td')].map(td => td.textContent).filter(Boolean).entries()].slice(0, -1)
    rowLoop: for (const r of rows) {
      const data = r.querySelectorAll('td')
      const row = {}
      let empty = true
      for (const [x, label] of labels) {
        const value = data[x].textContent
        empty && (empty = !value)
        if (label === 'WotLK') {
          row.itemId = Number(value.split('=')[1])
          if (!row.itemId) break rowLoop
          row.itemId === 295 && (row.itemId = 2954)
          const c = result[row.itemId] || (result[row.itemId] = row)
          c.cat = categories[i]
          continue
        }
        row[label] = value.trim()
      }
    }
  }
  return { items: result, level }
}

const items = {}
const loadingBrackets = Object.entries(spreadSheets).map(getSpreadSheetData)
for (const bracket of await Promise.all(loadingBrackets)) {
  for (let [id, item] of Object.entries(bracket.items)) {
    item.bracket = bracket.level
    items[id] || (items[id] = item)
  }
}

console.log('building the index.html')
const tbodyHTML = []
for (const item of Object.values(items)) {
  tbodyHTML.push([
    `<tr id="row-${item.itemId}" data-faction="${item.Faction}" data-bracket="${item.bracket}" data-cat="${item.cat}">`,
      `<td><a href="https://www.wowhead.com/wotlk/item=${item.itemId}" data-wh-icon-size="medium"></a></td>`,
      `<td class="cata"><a href="https://www.wowhead.com/cata/item=${item.itemId}">${item.Name}</a></td>`,
      `<td class="bracket lvl${item.bracket}">${item.bracket}</td>`,
      `<td class="faction f${item.Faction.replace('/', '-')}">${[
        item.Faction === 'A' && '<img src="https://wow.zamimg.com/images/icons/alliance.png" />',
        item.Faction === 'H' && '<img src="https://wow.zamimg.com/images/icons/horde.png" />',
      ].filter(Boolean).join('')}</td>`,
      `<td class="cat" data-value="">${item.cat}</td>`,
    '</tr>'
  ].join(''))
}

const indexHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=0.75">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚔</text></svg>">
  <title>wotlk to cata</title>
  <style type="text/css">
/* Classless.css v1.0

Table of Contents:
 1. Theme Settings
 2. Reset
 3. Base Style
 4. Extras  (remove unwanted)
 5. Classes  (remove unwanted)
*/

/* 1. Theme Settings ––––––––––––––––––––-–––––––––––––– */


:root {
  --rem: 12pt;
  --width: 60rem;
  --navpos: absolute;  /* fixed | absolute */
  --font-p: 1em/1.7  'Open Sans', 'DejaVu Sans', FreeSans, Helvetica, sans-serif;
  --font-h: .9em/1.5 'Open Sans', 'DejaVu Sans', FreeSans, Helvetica, sans-serif;
  --font-c: .9em/1.4 'DejaVu Sans Mono', monospace;
  --border: 1px solid var(--cmed);
  --ornament: "‹‹‹ ›››";
  /* foreground   | background color */
  --cfg:   #cecbc4; --cbg:    #252220;
  --cdark: #999;    --clight: #333;
  --cmed:  #566;
  --clink: #1ad;
  --cemph: #0b9;    --cemphbg: #0b91;
  color-scheme: dark;
}

/* 2. Reset –––––––––––––––––––––––––––––––––––––––––––– */

/* reset block elements  */
* { box-sizing: border-box; border-spacing: 0; margin: 0; padding: 0;}
header, footer, figure, table, video, details, blockquote,
ul, ol, dl, fieldset, pre, pre > code, caption {
  display: block;
  margin: 0.5rem 0rem 1rem;
  width: 100%;
  overflow: auto hidden;
  text-align: left;
}
video, summary, input, select { outline: none; }

/* reset clickable things  (FF Bug: select:hover prevents usage) */
a, button, select, summary { color: var(--clink); cursor: pointer; }

/* 3. Base Style ––––––––––––––––––––––––––––––––––––––– */
html { font-size: var(--rem); background: var(--cbg); }
body {
  position: relative;
  font: var(--font-p);
  color: var(--cfg);
  padding: 3.0rem 0.6rem 0;
  width: 100%;
  overflow-y: scroll;
}
h2 { margin-top: 1.5em }
body, p, h1, h2, ul, li { text-align: center }
table {
  overflow: hidden;
  width: 100%;
  table-layout: fixed;
  max-width: 60em;
  margin: 0 auto 4em;
}

tr, .cata { width: 100% }
.bracket, .faction { text-align: center }
.cat { text-align: right }
td, th {
  word-break: keep-all;
  white-space: nowrap;
  padding: 0 0.5em 0 0;
}
th { text-align: center }
tbody tr:nth-child(even) { background-color: #181716 }

.filters {
  display: flex;
  justify-content: space-evenly;
  align-items: space-evenly;
  background-color: #181716;
  max-width: 60em;
  margin: 0 auto;
  padding: 2em;
}

.filters > div {
  display: flex;
  flex-direction: column;
  text-align: left;
  user-select: none;
}

.filters b { color: var(--clink) }

  </style>
</head>
<body>
  <h1>Grandfathered Items WotLK -> Cata</h1>
  <p>
    List made by abihaj, find the source data here:
    <ul>
      <li><a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vT-Qb8tqIyiSCoRK7u3UkC50GOUax53ZoHyM8ZgJITXwhmMKrWzJdr_V7a6aUh0rEGCfI4vnESLqicb/pubhtml">19s grandfathered list</a></li>
      <li><a href="https://www.google.com/url?q=https://docs.google.com/spreadsheets/d/e/2PACX-1vT8TGOVLdVFmTbkmhKJ7lKoNmBRKX-N2J0w0eFYxH1FgWhnU5iERxggnhdUD4HVxlM7ZgDmpXTp899Z/pubhtml&sa=D&source=editors&ust=1712062764717246&usg=AOvVaw2bQD_N0NARZ7Ay19B65Ry-">29s grandfathered list</a></li>
      <li><a href="https://www.google.com/url?q=https://docs.google.com/spreadsheets/d/e/2PACX-1vSEcTaqNdsolg4cic8AHihB3xTSw3KEyoesCZTsoux9bQlJIw4DR5vpyGXruNx2aWPbzjwlFTfI6kSc/pubhtml&sa=D&source=editors&ust=1712062764717150&usg=AOvVaw02vDDx72VmGgBOF8Cw6gJo">39s grandfathered list</a></li>
    </ul>
    Follow him on twitch: <a href="">https://www.twitch.tv/abihaj</a>
  </p>

  <h2>Item list</h2>
  <div class="filters">
    <div>
      <b>Bracket</b>
      <label><input type="checkbox" name="bracket.19"> 19</label>
      <label><input type="checkbox" name="bracket.29"> 29</label>
      <label><input type="checkbox" name="bracket.39"> 39</label>
    </div>
    <div>
      <b>Armor</b>
      <label><input type="checkbox" name="cat.Cloth"> Cloth</label>
      <label><input type="checkbox" name="cat.Leather"> Leather</label>
      <label><input type="checkbox" name="cat.Mail"> Mail</label>
    </div>
    <div>
      <b>Category</b>
      <label><input type="checkbox" name="cat.Weapons, OHs, shields, wands"> Weapons, OHs, shields, wands</label>
      <label><input type="checkbox" name="cat.Trinkets, necks, rings"> Trinkets, necks, rings</label>
    </div>
    <div>
      <b>Faction</b>
      <label><input type="checkbox" name="faction.A/H"> <img src="https://wow.zamimg.com/images/icons/alliance.png"> / <img src="https://wow.zamimg.com/images/icons/horde.png"></label>
      <label><input type="checkbox" name="faction.A"> <img src="https://wow.zamimg.com/images/icons/alliance.png"></label>
      <label><input type="checkbox" name="faction.H"> <img src="https://wow.zamimg.com/images/icons/horde.png"></label>
    </div>
  </div>
  <table>
  <table><tbody>${tbodyHTML.join('\n')}</tbody></table>
<script>
globalThis.whTooltips = {
  colorLinks: true,
  renameLinks: false,
  // iconizeLinks: false,
  // iconSize: 'small',
}</script>
<script async src="https://wow.zamimg.com/js/tooltips.js"></script>
<script type="module">
const tbody = document.getElementsByTagName('tbody')[0]
const items = [...document.querySelectorAll('tbody tr')]
const initialParams = new URLSearchParams(location.search)
const filters = new Set()
const applyFilters = () => {
  const filtersArr = [...filters]
  const filterEntries = Map.groupBy(filtersArr.map(f => f.split('.')), entry => entry[0])
  history.pushState({}, null, \`?\${filtersArr.map(encodeURIComponent).join('&')}\`)
  for (const item of items) {
    let show = true
    for (const [key, values] of filterEntries) {
      show = values.some(v => item.dataset[key] === v[1])
      if (!show) break
    }
    if (item.show === show) continue
    item.show = show
  }
  while (tbody.firstChild) tbody.firstChild.remove()
  tbody.append(...items.filter(i => i.show))
  typeof $WowheadPower !== 'undefined' && $WowheadPower.refreshLinks()
}

for (const input of document.getElementsByTagName('input')) {
  input.oninput = e => {
    filters.has(input.name) ? filters.delete(input.name) : filters.add(input.name)
    applyFilters()
  }
  if (!initialParams.has(input.name)) continue
  input.checked = true
  filters.add(input.name)
}
applyFilters()
</script>
</body>
</html>
`

await Deno.writeTextFile('index.html', indexHTML)
console.log('done')
