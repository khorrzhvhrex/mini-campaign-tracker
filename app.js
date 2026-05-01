let importTargetArmy = null;
let editingMissionId = null;
let pendingWinner=null;
let unitSide=null;
let missionToDeleteId = null;
let renameTarget = null; // "campaign", "A", or "B"
let editingUnitId = null;

let state={
 battleCount:0,
 battleHistory:[],
armies:{
  A:{name:"<Enter Army Name>",score:0,units:[],color:"#ff0000", sigil:"", mfgTicks: [false, false, false]},
  B:{name:"<Enter Army Name>",score:0,units:[],color:"#0000ff", sigil:"", mfgTicks: [false, false, false]}
},
 missions:[],
  campaignName: "<Enter Campaign Name>",
  scoreTracker: {rounds: ["R1","R2","R3","R4","R5"], objectives: {A: [], B: []}},
};

const CONFIG = {singleMFGPerUnit: true, mfgPerArmyMin: 1, mfgPerArmyMax: 1}; 
// 🔁 For grand campaign:
// mfgPerArmyMin: 1,
// mfgPerArmyMax: 2

document.addEventListener("change", function(e){
  if(e.target.closest("#mfgList") && e.target.type === "checkbox"){
    const checkboxes = document.querySelectorAll("#mfgList input[type='checkbox']");
    checkboxes.forEach(cb=>{
      if(cb !== e.target) cb.checked = false;
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {

  document.addEventListener("click", function(e){
    const dropdown = document.querySelector("#topLeftMenu .dropdown");

    if(!dropdown) return;

    if(!dropdown.contains(e.target)){
      dropdown.classList.remove("open");
    }
  });

});
	
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", function(e){

      if(e.target === modal){

        if(modal.classList.contains("no-close")) return;

        modal.style.display = "none";
      }

    });

  });

});

function openClearModal(){
  document.getElementById("clearDataModal").style.display = "flex";
}

function closeClearModal(){
  document.getElementById("clearDataModal").style.display = "none";
}

function openGuideModal(){
  document.getElementById("guideModal").style.display="flex";
}

function closeGuideModal(){
  document.getElementById("guideModal").style.display="none";
}

function autoGrow(el){
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function clearBattleLog(){
  if(!confirm("Clear all battle log entries?")) return;

  state.missions = [];
  state.battleHistory = [];
  state.battleCount = 0;
  state.armies.A.score = 0;
  state.armies.B.score = 0;

  updateUI();
}

function clearUnits(side){
  if(!confirm(`Clear all units for Army ${side}?`)) return;

  state.armies[side].units = [];
  updateUI();
}

function clearAllUnits(){
  if(!confirm("Clear ALL units for both armies?")) return;

  state.armies.A.units = [];
  state.armies.B.units = [];

  updateUI();
}

function clearAllData(){
  if(!confirm("This will reset EVERYTHING. Continue?")) return;

  localStorage.removeItem("hotv_campaign");

  state = {
    battleCount: 0,
    battleHistory: [],
    missions: [],
    campaignName: "<Campaign Name>",
    armies: {
      A: { name: "<Army Name>", score: 0, units: [], color: "#ff0000", sigil: "", mfgTicks: [false,false,false] },
      B: { name: "<Army Name>", score: 0, units: [], color: "#0000ff", sigil: "", mfgTicks: [false,false,false] }
    },
	scoreTracker: {
  rounds: ["R1","R2","R3","R4","R5"],
  objectives: {
    A: [],
    B: []
  }
}
  };

  updateUI();
  closeClearModal();
}

function toggleDropdown(){
  const dropdown = document.querySelector("#topLeftMenu .dropdown");
  dropdown.classList.toggle("open");
}
	
function openPOI(type){
  const modal = document.getElementById("poiModal");
  const title = document.getElementById("poiTitle");
  const content = document.getElementById("poiContent");

  if(type === "survived"){
    title.innerText = "Survivors – Persistent Effects";
    content.innerHTML = `
      <p>Units will be rewarded for survivial. At the conclusion of the campaign, apply the reward based on the unit's survival count.</p>
	  <br></br>
      <p>1 Survival: +1 Experience</p>
      <p>2 Survivals: +3 Experience (VEHICLE +2)</p>
      <p>3 Survivals: Gain Rank: Blooded (+6 Experience; VEHICLE +3, no Rank gain)</p>
    `;
  }

  if(type === "mfg"){
    title.innerText = "Marked for Greatness – Rewards";
    content.innerHTML = `
      <p>Units should be Marked for Greatness only with significant narrative justification. 
	  This justification should be agreed upon by both parties.</p>
	  <br></br>
	  <p>In the event of a lackluster performance from all units in either army, 
	  a random unit may be generated from all surviving units by assigning a number and rolling an appropriate DX.</p>
	  <br></br>
	  <p>A unit should be Marked for Greatness no more than once.</p>
	  <br></br>
	  <p>At the conclusion of the campaign, each unit that has been Marked for Greatness gains the HEART OF THE WAR keyword, which is retained unless they are removed from the Order of Battle.</p> 
	  <p>Units with the HEART OF THE WAR keyword may re-roll any failed Out of Action test.</p>
    `;
  }

  modal.style.display = "flex";
}

function closePOIModal(){
  document.getElementById("poiModal").style.display = "none";
}
	
function renameCampaign(){
  renameTarget = "campaign";

  document.getElementById("renameTitle").innerText = "Rename Campaign";
  document.getElementById("renameInput").value = state.campaignName;

  // ❌ HIDE SIGIL UI
  document.getElementById("sigilSection").style.display = "none";

  document.getElementById("renameModal").style.display = "flex";
}

function setArmyColor(side, color){
  state.armies[side].color = color;
  updateUI();
}

function darkenColor(hex, factor = 0.85){
  let r = parseInt(hex.substr(1,2),16);
  let g = parseInt(hex.substr(3,2),16);
  let b = parseInt(hex.substr(5,2),16);

  r = Math.floor(r * (1 - factor));
  g = Math.floor(g * (1 - factor));
  b = Math.floor(b * (1 - factor));

  return `rgb(${r},${g},${b})`;
}

function editMission(id){
  const mission = state.missions.find(m => m.id === id);
  if(!mission) return;

  editingMissionId = id;
  pendingWinner = mission.winner;

  document.getElementById("modal").style.display = "flex";

  document.getElementById("missionName").value = mission.name;
  document.getElementById("missionScore").value = mission.score;
  document.getElementById("missionNarrative").value = mission.narrative;

buildCheckboxes();
	const checkboxes = document.querySelectorAll("#checkboxes input");

checkboxes.forEach(input => {
  let [side, id] = input.value.split("-");
  id = Number(id);

  if(input.dataset.type === "survived" && mission.survivors?.[side]?.includes(id)){
    input.checked = true;
  }

  if(input.dataset.type === "mfg" && mission.mfg?.[side]?.includes(id)){
    input.checked = true;
  }
});
	
}

function deleteMission(id){
  missionToDeleteId = id;
  document.getElementById("deleteModal").style.display = "flex";
}
function confirmDelete(){
  if(!missionToDeleteId) return;

  const mission = state.missions.find(m => m.id === missionToDeleteId);
  if(!mission) return;

  // remove mission
  state.missions = state.missions.filter(m => m.id !== missionToDeleteId);

  // remove matching battle history entry
  const index = state.battleHistory.findIndex(b => b.missionId === missionToDeleteId);
  if(index !== -1){
    state.battleHistory.splice(index, 1);
    state.battleCount--;
  }

  recalcScores();

  missionToDeleteId = null;
  closeDeleteModal();
  updateUI();
}

function closeDeleteModal(){
  missionToDeleteId = null;
  document.getElementById("deleteModal").style.display = "none";
}

function recalcScores(){
  state.armies.A.score = 0;
  state.armies.B.score = 0;

  state.battleHistory.forEach(b=>{
    if(b.winner==="A"){
      state.armies.A.score += 2;
      state.armies.B.score += 1;
    } else {
      state.armies.B.score += 2;
      state.armies.A.score += 1;
    }
  });
}

function buildCheckboxes(){
  const container = document.getElementById("checkboxes");

  let html = "";

  ["A","B"].forEach(side=>{
    html += `<h4>${state.armies[side].name}</h4>`;

    html += `
      <div class="unit-grid">
        <div class="header">Unit</div>
        <div class="header">Survived</div>
        <div class="header">MFG</div>
    `;

    state.armies[side].units.forEach(u=>{

	  const stats = getUnitStats(u.id, side);

	  // count MFG from OTHER missions only
	  let otherMFG = 0;

	  state.missions.forEach(m=>{
	    if(editingMissionId && m.id === editingMissionId) return;

	    if(m.mfg?.[side]?.includes(u.id)){
	      otherMFG++;
	    }
	  });

	  const hasMFG = CONFIG.singleMFGPerUnit && otherMFG > 0;
		
      html += `
        <div class="unit-name" style="${hasMFG ? "opacity:0.4;" : ""}">
  		  ${u.name || "Unnamed Unit"}
		</div>

        <div>
          <input type="checkbox" data-type="survived" value="${side}-${u.id}">
        </div>

	   <div>
   	 	 <input type="checkbox" data-type="mfg" value="${side}-${u.id}" ${hasMFG ? "disabled" : ""}>
	   </div>
		`;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

function getFutureDate(){
  const now = new Date();
  const y = now.getFullYear() + 37000;
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function openUnitModal(side){
  unitSide = side;
  editingUnitId = null;

  document.getElementById("unitModal").style.display = "flex";

  unitName.value = "";
  unitType.value = "";
  unitPL.value = "";

  document.querySelector("#unitModal h3").innerText = "Add Unit";

  // ✅ Hide remove button
  document.getElementById("deleteUnitBtn").style.display = "none";
}

function saveUnit(){
  if(editingUnitId){
    // 🔁 update existing unit
    const unit = state.armies[unitSide].units.find(u => u.id === editingUnitId);
    if(!unit) return;

    unit.name = unitName.value;
    unit.type = unitType.value;
    unit.pl = unitPL.value;

  } else {
    // ➕ new unit
    state.armies[unitSide].units.push({
	  id: Date.now(),
	  name: unitName.value,
	  type: unitType.value,
	  pl: unitPL.value,

	  notes: {
	    ranged:"",
	    melee:"",
	    psychic:"",
	    warlord:"",
	    relic:"",
	    abilities:"",
	    lore:""
	  },
		
	  datasheet: [
		  {
		    model:"",
		    m:"",
		    ws:"",
		    bs:"",
		    s:"",
		    t:"",
		    w:"",
		    a:"",
		    ld:"",
		    sv:"",
		    inv:""
		  }
		]
	});
  }

  editingUnitId = null;

  document.getElementById("unitModal").style.display = "none";
  updateUI();
}

let datasheetSide=null;
let datasheetUnitId=null;

function openDatasheet(side,id){

 datasheetSide=side;
 datasheetUnitId=id;

 let unit=
 state.armies[side].units.find(
   u=>u.id===id
 );

 if(!unit.datasheet || !unit.datasheet.length){
   unit.datasheet=[{
     model:"",
     m:"",
     ws:"",
     bs:"",
     s:"",
     t:"",
     w:"",
     a:"",
     ld:"",
     sv:"",
     inv:""
   }];
 }

 datasheetTitle.innerText=
 `${unit.name} Datasheet`;

 renderDatasheetRows();

 datasheetModal.style.display="flex";
}

function renderDatasheetRows(){

 let unit=
 state.armies[datasheetSide]
 .units.find(u=>u.id===datasheetUnitId);

 let html=`
<table style="width:100%; table-layout:fixed;">
<tr>
<th style="width:180px;">Model</th>
<th style="width:50px;">M</th>
<th style="width:50px;">WS</th>
<th style="width:50px;">BS</th>
<th style="width:50px;">S</th>
<th style="width:50px;">T</th>
<th style="width:50px;">W</th>
<th style="width:50px;">A</th>
<th style="width:50px;">Ld</th>
<th style="width:50px;">Sv</th>
<th style="width:50px;">Inv</th>
</tr>
`;

 unit.datasheet.forEach(r=>{

 html+=`
<tr>
<td style="width:auto;"><input style="width:100%;" value="${r.model||""}"></td>
<td><input value="${r.m||""}"></td>
<td><input value="${r.ws||""}"></td>
<td><input value="${r.bs||""}"></td>
<td><input value="${r.s||""}"></td>
<td><input value="${r.t||""}"></td>
<td><input value="${r.w||""}"></td>
<td><input value="${r.a||""}"></td>
<td><input value="${r.ld||""}"></td>
<td><input value="${r.sv||""}"></td>
<td><input value="${r.inv||""}"></td>
</tr>
`;

 });

 html+=`</table>`;

 datasheetTable.innerHTML=html;
}

function addModelRow(){

  let unit =
   state.armies[datasheetSide]
   .units.find(u=>u.id===datasheetUnitId);

  // Capture current table values first
  let rows = [
    ...document.querySelectorAll(
      "#datasheetTable tr"
    )
  ].slice(1);

  let saved=[];

  rows.forEach(r=>{

    let inputs=[
      ...r.querySelectorAll("input")
    ].map(i=>i.value.trim());

    saved.push({
      model:inputs[0],
      m:inputs[1],
      ws:inputs[2],
      bs:inputs[3],
      s:inputs[4],
      t:inputs[5],
      w:inputs[6],
      a:inputs[7],
      ld:inputs[8],
      sv:inputs[9],
      inv:inputs[10]
    });

  });

  // Preserve current edits
  unit.datasheet = saved;

  // Add new blank row
  unit.datasheet.push({
    model:"",
    m:"",
    ws:"",
    bs:"",
    s:"",
    t:"",
    w:"",
    a:"",
    ld:"",
    sv:"",
    inv:""
  });

  renderDatasheetRows();
}

function saveDatasheet(){

 let rows=
 [...document.querySelectorAll(
 "#datasheetTable tr"
 )].slice(1);

 let saved=[];

 rows.forEach(r=>{

   let inputs=[
     ...r.querySelectorAll("input")
   ].map(i=>i.value.trim());

   let row={
     model:inputs[0],
     m:inputs[1],
     ws:inputs[2],
     bs:inputs[3],
     s:inputs[4],
     t:inputs[5],
     w:inputs[6],
     a:inputs[7],
     ld:inputs[8],
     sv:inputs[9],
     inv:inputs[10]
   };

   let hasData=
     Object.values(row)
     .some(v=>v!== "");

   if(saved.length===0 || hasData){
     saved.push(row);
   }

 });

 let unit=
 state.armies[datasheetSide]
 .units.find(u=>u.id===datasheetUnitId);

 unit.datasheet=saved;

 closeDatasheetModal();

 updateUI();
}

function closeDatasheetModal(){
 datasheetModal.style.display="none";
}

function editUnit(side, id){
  const unit = state.armies[side].units.find(u => u.id === id);
  if(!unit) return;

  unitSide = side;
  editingUnitId = id;

  document.getElementById("unitModal").style.display = "flex";

  unitName.value = unit.name;
  unitType.value = unit.type;
  unitPL.value = unit.pl;

  document.querySelector("#unitModal h3").innerText = "Edit Unit";

  // ✅ Show remove button
  document.getElementById("deleteUnitBtn").style.display = "inline-block";
}

let notesSide = null;
let notesUnitId = null;

function openNotes(side,id){

  notesSide = side;
  notesUnitId = id;

  const unit =
    state.armies[side].units.find(u=>u.id===id);

  if(!unit.notes){
    unit.notes={
      ranged:"",
      melee:"",
      psychic:"",
      warlord:"",
      relic:"",
      abilities:"",
      lore:""
    };
  }

  notesTitle.innerText =
    `${unit.name} Notes`;

  notesRanged.value = unit.notes.ranged || ""; autoGrow(notesRanged);
  notesMelee.value = unit.notes.melee || ""; autoGrow(notesMelee);
  notesPsychic.value = unit.notes.psychic || ""; autoGrow(notesPsychic);
  notesWarlord.value = unit.notes.warlord || "";
  notesRelic.value = unit.notes.relic || "";
  notesAbilities.value = unit.notes.abilities || ""; autoGrow(notesAbilities);
  notesLore.value = unit.notes.lore || ""; autoGrow(notesLore);

  notesModal.style.display="flex";
}

function saveNotes(){

  const unit =
    state.armies[notesSide]
      .units.find(u=>u.id===notesUnitId);

  if(!unit) return;

  unit.notes={
    ranged:notesRanged.value,
    melee:notesMelee.value,
    psychic:notesPsychic.value,
    warlord:notesWarlord.value,
    relic:notesRelic.value,
    abilities:notesAbilities.value,
    lore:notesLore.value
  };

  closeNotesModal();

  updateUI();
}

function closeNotesModal(){
  notesModal.style.display="none";
}

function deleteUnit(){
  if(!editingUnitId) return;

  document.getElementById("deleteUnitModal").style.display = "flex";
}

function confirmUnitDelete(){
  if(!editingUnitId) return;

  state.armies[unitSide].units =
    state.armies[unitSide].units.filter(u => u.id !== editingUnitId);

  editingUnitId = null;

  closeUnitDeleteModal();
  document.getElementById("unitModal").style.display = "none";
  updateUI();
}

function closeUnitDeleteModal(){
  document.getElementById("deleteUnitModal").style.display = "none";
}

function closeUnitModal(){
  editingUnitId = null;
  document.getElementById("unitModal").style.display = "none";
}

function renderUnits(){
 ["A","B"].forEach(side=>{
  let tbody=document.querySelector("#units"+side+" tbody");
  tbody.innerHTML="";
  state.armies[side].units.forEach(u=>{
   const stats = getUnitStats(u.id, side);
   tbody.innerHTML+=`
   <tr>
    <td>
	  <span onclick="openNotes('${side}',${u.id})"
	        style="cursor:pointer; text-decoration:underline;">
	    ${u.name}${hasUnitNotes(u) ? ' <span style="opacity:.65;font-size:12px;">📜</span>' : ''}
	  </span>
	</td>
	
    <td>
	<span onclick="openDatasheet('${side}',${u.id})"
	style="cursor:pointer;text-decoration:underline;">
	${u.type}${u.datasheet?.some(r=>r.model) ? " ⚔" : ""}
	</span>
	</td>
	
    <td>${u.pl}</td>
    <td>${stats.survived}</td>
    <td>${stats.mfg}</td>
    <td><button onclick="editUnit('${side}',${u.id})">Edit</button></td>
   </tr>`;
  });
 });
}

function hasUnitNotes(unit){
  if(!unit.notes) return false;

  return Object.values(unit.notes).some(v =>
    v && v.trim() !== ""
  );
}

function removeUnit(side,id){
 let army=state.armies[side];
 army.units=army.units.filter(u=>u.id!==id);
 updateUI();
}

let activeMFGSide = null;
let activeMFGTick = null;

function addObjective(){
  ["A","B"].forEach(side=>{
  state.scoreTracker.objectives[side].push({
    name: "",
    points: "",
    scoredAt: "",
    scores: {}
  });
});

  updateUI();
}

function addBattleRound(){
  const rounds = state.scoreTracker.rounds;
  const next = "R" + (rounds.length + 1);
  rounds.push(next);

  updateUI();
}

function removeObjective(index, side){
  state.scoreTracker.objectives[side].splice(index, 1);

  if(state.scoreTracker.objectives[side].length === 0){
    state.scoreTracker.objectives[side].push({
      name: "",
      points: "",
      scoredAt: "",
      scores: {}
    });
  }

  updateUI();
}

function removeBattleRound(round){

  const rounds = state.scoreTracker.rounds;
  if(rounds.length <= 1) return;

  state.scoreTracker.rounds = rounds.filter(r => r !== round);

  ["A","B"].forEach(side=>{
    state.scoreTracker.objectives[side].forEach(obj=>{
      if(obj.scores){
        delete obj.scores[side]?.[round];
      }
    });
  });

  updateUI();
}

function renderScoreTracker(){

  // ✅ SAFETY: ensure structure always exists
  if(!state.scoreTracker){
    state.scoreTracker = {
      rounds: ["R1","R2","R3","R4","R5"],
      objectives: { A: [], B: [] }
    };
  }

  // ✅ MIGRATION: fix old saved data
  if(Array.isArray(state.scoreTracker.objectives)){
    state.scoreTracker.objectives = {
      A: [],
      B: []
    };
  }
  const { rounds } = state.scoreTracker;

  // ✅ ensure at least one row exists
  ["A","B"].forEach(side=>{
  if(state.scoreTracker.objectives[side].length === 0){
    state.scoreTracker.objectives[side].push({
      name: "",
      points: "",
      scoredAt: "",
      scores: {}
    });
  }
});

  // ✅ SAFETY: ensure DOM exists before rendering
  const elA = document.getElementById("scoreTrackerA");
  const elB = document.getElementById("scoreTrackerB");

  if(!elA || !elB) return;

  function buildTable(side){
    let html = `
      <table style="table-layout:fixed; width:100%;">
        <thead>
		  <tr>
		    <th style="width:40%;">Mission Objective</th>
		    <th style="width:60px;">Points</th>
		    <th style="width:120px;">Scored At</th>
		    ${rounds.map(r => `
		      <th style="width:60px;">
		        ${r}
		        <span onclick="removeBattleRound('${r}')" 
		              style="cursor:pointer; margin-left:4px; font-size:10px;">✕</span>
		      </th>
		    `).join("")}
		  </tr>
		</thead>
        <tbody>
    `;

    const objectives = state.scoreTracker.objectives[side];

	objectives.forEach((obj, i)=>{
      html += `
        <tr>
		  <td>
		    <div style="display:flex; align-items:center; gap:4px;">
		      <input style="flex:1;" value="${obj.name}" 
		             onchange="updateObjective(${i}, 'name', this.value, '${side}')">
		      <button onclick="removeObjective(${i}, '${side}')" style="font-size:10px; height:22px; padding:0 6px;">✕</button>
		    </div>
		  </td>

		  <td>
		    <input style="width:100%; text-align:center;" 
		           value="${obj.points}" 
		           onchange="updateObjective(${i}, 'points', this.value, '${side}')">
		  </td>

		  <td>
		    <input style="width:100%;" 
		           value="${obj.scoredAt}" 
		           onchange="updateObjective(${i}, 'scoredAt', this.value, '${side}')">
		  </td>

		  ${rounds.map(r => `
		    <td>
		      <input style="width:100%; text-align:center;" 
		             value="${obj.scores[side]?.[r] || ""}" 
		             onchange="updateScore(${i}, '${side}', '${r}', this.value)">
		    </td>
		  `).join("")}
		</tr>
      `;
    });

    html += `</tbody></table>`;
    return html;
  }

  document.getElementById("scoreTrackerA").innerHTML = buildTable("A");
  document.getElementById("scoreTrackerB").innerHTML = buildTable("B");
}

function updateObjective(index, field, value, side){
  state.scoreTracker.objectives[side][index][field] = value;
  saveToLocal();
}

function updateScore(index, side, round, value){
  if(!state.scoreTracker.objectives[side][index].scores[side]){
    state.scoreTracker.objectives[side][index].scores[side] = {};
  }

  state.scoreTracker.objectives[side][index].scores[side][round] = value;
  saveToLocal();
}

function openMFGTargets(side, tickIndex){

  activeMFGSide = side;
  activeMFGTick = tickIndex;

  const list = document.getElementById("mfgList");

	let html = `
	  <div style="font-weight:bold; margin-bottom:8px; text-align:left;">
  	  ${state.armies[side].name}
  	</div>

  	<table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;">Unit</th>
          <th style="width:80px;">Select</th>
        </tr>
      </thead>
      <tbody>
  `;

  state.armies[side].units.forEach(u=>{
    const stats = getUnitStats(u.id, side);

    if(stats.mfg === 0){
      html += `
        <tr>
          <td style="text-align:left;">${u.name}</td>
          <td style="text-align:center;">
            <input type="checkbox" data-id="${u.id}">
          </td>
        </tr>
      `;
    }
  });

  html += `</tbody></table>`;

  if(state.armies[side].units.filter(u => getUnitStats(u.id, side).mfg === 0).length === 0){    html = `<div style="opacity:0.6;">No eligible units</div>`;
  }

  list.innerHTML = html;
  document.getElementById("mfgModal").style.display = "flex";
}
	
function closeMFGModal(){
  document.getElementById("mfgModal").style.display = "none";
}

function applyMFG(){
  const selected = document.querySelector("#mfgList input:checked");

  if(!selected){
    alert("Select a unit to Mark for Greatness");
    return;
  }

  const unitId = Number(selected.dataset.id);
  const side = activeMFGSide;
	if(activeMFGTick === null || activeMFGTick === undefined){
  alert("MFG tick error - try again");
  return;
}
	
	activeMFGTick = null;
	activeMFGSide = null;

  const unit = state.armies[side].units.find(u => u.id === unitId);
  if(!unit) return;

  const entry = {
    id: Date.now(),
    date: getFutureDate(),
    name: "Marked for Greatness",
    score: "",
    narrative: `${unit.name} Marked for Greatness using Heart of the Void points`,
    winner: null,
    survivors: { A: [], B: [] },
    mfg: { A: [], B: [] }
  };

  entry.mfg[side].push(unitId);

  state.missions.push(entry);

  closeMFGModal();

  // force immediate refresh BEFORE anything else
  updateUI();
}
	
function updateUI(){
 nameA.innerText=state.armies.A.name;
 nameB.innerText=state.armies.B.name;
 
 document.getElementById("campaignTitle").innerText = state.campaignName;

 exportA.innerText=`Export ${state.armies.A.name} Units`;
 exportB.innerText=`Export ${state.armies.B.name} Units`;

barA.style.width = (state.armies.A.score/6*100) + "%";
barB.style.width = (state.armies.B.score/6*100) + "%";

const colorA = state.armies.A.color || "#ff0000";
const colorB = state.armies.B.color || "#0000ff";

const sigilAEl = document.getElementById("sigilA");
const sigilBEl = document.getElementById("sigilB");

sigilAEl.style.backgroundImage = state.armies.A.sigil
  ? `url(${state.armies.A.sigil})`
  : "none";

sigilBEl.style.backgroundImage = state.armies.B.sigil
  ? `url(${state.armies.B.sigil})`
  : "none";

const progressA = state.armies.A.score / 6;
const progressB = state.armies.B.score / 6;

// glow intensity scales with progress
const glowA = 4 + progressA * 12;
const glowB = 4 + progressB * 12;

barA.style.boxShadow = `inset 0 0 6px ${colorA}55, 0 0 ${glowA}px ${colorA}88`;
barB.style.boxShadow = `inset 0 0 6px ${colorB}55, 0 0 ${glowB}px ${colorB}88`;

document.getElementById("colorA").value = state.armies.A.color || "#ff0000";
document.getElementById("colorB").value = state.armies.B.color || "#0000ff";
document.getElementById("missionScore").placeholder =
  `Score ${state.armies.A.name}-${state.armies.B.name}`;

barA.style.background = state.armies.A.color || "#ff0000";
barB.style.background = state.armies.B.color || "#0000ff";

const armyAEl = document.getElementById("armyA");
const armyBEl = document.getElementById("armyB");

armyAEl.style.background = darkenColor(colorA, 0.9);
armyBEl.style.background = darkenColor(colorB, 0.9);

// ✅ LARGE BAR PROGRESSION (center expansion)
const leftFill = document.getElementById("leftFill");
const rightFill = document.getElementById("rightFill");

let progress = state.battleCount / 3;
let halfWidth = progress * 50;

// left side grows left from center
leftFill.style.width = halfWidth + "%";
leftFill.style.left = (50 - halfWidth) + "%";

// right side grows right from center
rightFill.style.width = halfWidth + "%";
rightFill.style.left = "50%";

// ✅ bronze fill
leftFill.style.background = "linear-gradient(215deg,#8a6a3a,#4f3a1f)";
rightFill.style.background = "linear-gradient(145deg,#8a6a3a,#4f3a1f)";

// ✅ glow (NOW progress exists)
let glowStrength = Math.min(progress, 1);

let glow1 = 10 + glowStrength * 40;
let glow2 = 20 + glowStrength * 80;

let heat = Math.floor(120 + progress * 80); // 120 → 200

let shadow = `
  0 0 ${glow1}px rgba(255,${heat},80,0.4),
  0 0 ${glow2}px rgba(255,${heat-40},40,0.3)
`;

leftFill.style.boxShadow = shadow;
rightFill.style.boxShadow = shadow;

const pulseSpeed = 3 - (progress * 1.5); // faster as campaign progresses

leftFill.style.animation = `bronzePulse ${pulseSpeed}s ease-in-out infinite`;
rightFill.style.animation = `bronzePulse ${pulseSpeed}s ease-in-out infinite`;

renderUnits();
renderLog();
renderScoreTracker();

// ✅ Recalculate MFG tick usage from missions
["A","B"].forEach(side=>{
  state.armies[side].mfgTicks = [false,false,false];

  state.missions.forEach(m=>{
    if(m.name === "Marked for Greatness"){
      if(m.mfg?.[side]?.length){
        // mark next available tick as used
        const index = state.armies[side].mfgTicks.findIndex(v => v === false);
        if(index !== -1){
          state.armies[side].mfgTicks[index] = true;
        }
      }
    }
  });
});
	
saveToLocal();
 
function updateTicks(side, score, thresholds){

  thresholds.forEach((t, i)=>{

    const achieved = score >= t.val;

    // ✅ ensure mfgTicks exists
    if(!state.armies[side].mfgTicks){
      state.armies[side].mfgTicks = [false,false,false];
    }

    // reset if score dropped
    if(!achieved){
      state.armies[side].mfgTicks[i] = false;
    }

    // set icon
    t.el.innerText = achieved ? "★" : "☠";

    // size
    t.el.style.fontSize = achieved ? "22px" : "18px";

    if(achieved){
      const used = state.armies[side].mfgTicks[i];

      if(!used){
        t.el.style.filter = "drop-shadow(0 0 10px gold) drop-shadow(0 0 20px orange)";
		t.el.style.animation = "starPulse 1.2s infinite";
        t.el.style.opacity = "1";
        t.el.style.cursor = "pointer";

        t.el.onclick = function(){
          openMFGTargets(side, i);
        };

      } else {
        t.el.style.filter = "none";
		t.el.style.animation = "none";
        t.el.style.opacity = "0.3";
        t.el.style.cursor = "default";
        t.el.onclick = null;
      }

    } else {
      t.el.style.filter = "none";
	  t.el.style.animation = "none";
      t.el.style.opacity = "0.3";
      t.el.style.cursor = "default";
      t.el.onclick = null;
    }

  });
}

// call for both armies
updateTicks("A", state.armies.A.score, [
  { val: 3, el: document.getElementById("tickA3") },
  { val: 5, el: document.getElementById("tickA5") },
  { val: 6, el: document.getElementById("tickA6") }
]);

updateTicks("B", state.armies.B.score, [
  { val: 3, el: document.getElementById("tickB3") },
  { val: 5, el: document.getElementById("tickB5") },
  { val: 6, el: document.getElementById("tickB6") }
]);
}

function renameArmy(side){
  renameTarget = side;

  document.getElementById("renameTitle").innerText = "Rename Army";
  document.getElementById("renameInput").value = state.armies[side].name;

  // ✅ SHOW SIGIL UI
  document.getElementById("sigilSection").style.display = "block";

  document.getElementById("renameModal").style.display = "flex";
}

function confirmRename(){
  const input = document.getElementById("renameInput").value.trim();
  if(!input) return;

  if(renameTarget === "campaign"){
    state.campaignName = input;
  } else if(renameTarget === "A" || renameTarget === "B"){
    state.armies[renameTarget].name = input;
  }

  renameTarget = null;
  closeRenameModal();
  updateUI();
}

function closeRenameModal(){
  renameTarget = null;
  document.getElementById("renameModal").style.display = "none";
}

function handleSigilUpload(event){
  const file = event.target.files[0];
  if(!file || !renameTarget || renameTarget === "campaign") return;

  const reader = new FileReader();

  reader.onload = function(e){
    state.armies[renameTarget].sigil = e.target.result;

    // 👇 show filename
    document.getElementById("sigilName").innerText = file.name;

    updateUI();
  };

  reader.readAsDataURL(file);

  // keep this for re-upload ability
  event.target.value = "";
}

function clearSigil(){
  if(!renameTarget || renameTarget === "campaign") return;

  state.armies[renameTarget].sigil = "";
  updateUI();
}

function openModal(winner){
  pendingWinner = winner; // ✅ store winner immediately
  editingMissionId = null;

  modal.style.display="flex";

  missionName.value="";
  missionScore.value="";
  missionNarrative.value="";

  buildCheckboxes();
}

function getUnitStats(unitId, side){
  let survived = 0;
  let mfg = 0;

  state.missions.forEach(m => {
    if(m.survivors?.[side]?.includes(unitId)) survived++;
    if(m.mfg?.[side]?.includes(unitId)) mfg++;
  });

  return { survived, mfg };
}

function saveMission(){
  const checkboxesEl = document.getElementById("checkboxes");
  const missionNameEl = document.getElementById("missionName");
  const missionScoreEl = document.getElementById("missionScore");
  const missionNarrativeEl = document.getElementById("missionNarrative");

let inputs = [...checkboxesEl.querySelectorAll("input:checked")];

let survivors = { A: [], B: [] };
let mfg = { A: [], B: [] };

// ✅ Populate survivors and MFG
inputs.forEach(i=>{
  let [side,id] = i.value.split("-");
  id = Number(id);

  if(i.dataset.type === "survived") survivors[side].push(id);
  if(i.dataset.type === "mfg") mfg[side].push(id);
});

// ❗ Enforce only 1 MFG per mission (NOW valid)
const min = CONFIG.mfgPerArmyMin;
const max = CONFIG.mfgPerArmyMax;

// ❗ Enforce per-army limits
if(mfg.A.length < min || mfg.B.length < min){
  alert(`Each army must Mark at least ${min} unit for Greatness`);
  return;
}

if(mfg.A.length > max || mfg.B.length > max){
  alert(`Each army may only Mark up to ${max} unit(s) for Greatness`);
  return;
}
	
const nameVal = missionNameEl.value.trim();
const scoreVal = missionScoreEl.value.trim();
const narrativeVal = missionNarrativeEl.value.trim();

// detect if any field is missing
const incomplete = !nameVal || !scoreVal || !narrativeVal;

// build narrative with optional reminder
const narrativeText = narrativeVal || "Mission Debrief: UNAVAILABLE";
const finalNarrative = incomplete
  ? narrativeText + " — Click Edit to Submit Mission Report"
  : narrativeText;

const mission = {
	
    id: editingMissionId || Date.now(),
    date: getFutureDate(),
    name: nameVal || "MISSION: Unreported",
	score: scoreVal || "Terms of Victory: UNREPORTED",
    narrative: finalNarrative,
    winner: pendingWinner,
    survivors,
    mfg
  };

  if(editingMissionId){
    // 🔁 Replace existing mission
    const index = state.missions.findIndex(m => m.id === editingMissionId);
    state.missions[index] = mission;
  } else {
    // ➕ Add new mission
    state.missions.push(mission);

    if(pendingWinner){
      state.battleHistory.push({winner: pendingWinner, missionId: mission.id});
      state.battleCount++;
    }
  }

  // ✅ Recalculate scores (drives bars)
  recalcScores();

  // ✅ Reset state
  editingMissionId = null;
  pendingWinner = null;

  // ✅ Close modal
  document.getElementById("modal").style.display = "none";

  // ✅ Refresh UI
  updateUI();
}

function closeMissionModal(){
  editingMissionId = null;
  pendingWinner = null;

  document.getElementById("missionName").value = "";
  document.getElementById("missionScore").value = "";
  document.getElementById("missionNarrative").value = "";

  document.getElementById("modal").style.display = "none";
}

function renderLog(){
  const logEl = document.getElementById("log");

  if(state.missions.length === 0){
    logEl.innerHTML = `
      <div style="text-align:center;opacity:0.6;font-style:italic;padding:10px;">
        TRANSMISSION INCOMING...
      </div>
    `;
    return;
  }

  logEl.innerHTML = [...state.missions].reverse().map(m=>{
    const winnerName = m.winner ? state.armies[m.winner].name : "Unknown";

    return `
	<div style="border-bottom:1px solid #444; padding:5px;">
	  <strong>${m.date}</strong> — ${m.name} (${m.score})
      <br><strong>Victor:</strong> ${winnerName}
      <br><em>${m.narrative || ""}</em>
      <div style="margin-top:6px; display:flex; gap:6px;">
  		<button onclick="editMission(${m.id})">Edit</button>
 		<button onclick="deleteMission(${m.id})">Delete</button>
	  </div>
    </div>`;
  }).join("");
}

function toggleLog(){
  const logEl = document.getElementById("log");
  const arrow = document.getElementById("logArrow");

  logEl.classList.toggle("open");

  if(logEl.classList.contains("open")){
    arrow.textContent = "▾";
  } else {
    arrow.textContent = "▸";
  }
}

function exportArmy(side){
  let blob = new Blob([JSON.stringify(state.armies[side].units)], {type:"application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);

  const timestamp = getTimestamp();
  const safeName = state.armies[side].name.replace(/\s+/g, '_').toLowerCase();

  a.download = `${timestamp}_${safeName}_units.json`;

  a.click();
}

function exportJSON(){
  let blob = new Blob([JSON.stringify(state)], {type:"application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);

  const timestamp = getTimestamp();
  a.download = `${timestamp}_heartofthevoid_campaign.json`;

  a.click();
}

function getTimestamp(){
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');

  const hours = String(d.getHours()).padStart(2,'0');
  const mins = String(d.getMinutes()).padStart(2,'0');
  const secs = String(d.getSeconds()).padStart(2,'0');

  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

function handleImport(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = () => {
    try {
      let data = JSON.parse(reader.result);

      // ✅ FULL CAMPAIGN IMPORT
      if(data.armies && data.missions){
        state = data;

	  // ✅ ensure scoreTracker exists on imported files
	  if(!state.scoreTracker){
	 	state.scoreTracker = { rounds: ["R1"], objectives: [] };
	  }

        ["A","B"].forEach(side=>{
          state.armies[side].units.forEach(u=>{
            u.survived = u.survived || 0;
            u.mfg = u.mfg || 0;
          });
        });

        importTargetArmy = null;
        updateUI();
        return;
      }

      // ✅ UNIT LIST IMPORT
      if(Array.isArray(data)){
        if(!importTargetArmy){
          alert("Use 'Import Units' button for unit files");
          return;
        }

        // Prevent ID collisions
        data.forEach(u=>{
          u.id = Date.now() + Math.random();
          u.survived = u.survived || 0;
          u.mfg = u.mfg || 0;
        });

        state.armies[importTargetArmy].units.push(...data);

        importTargetArmy = null;
        updateUI();
        return;
      }

      alert("Invalid JSON format");

    } catch(err){
      alert("Failed to load JSON");
    }
  };

  reader.readAsText(file);
}

function importUnits(side){
  importTargetArmy = side;
  fileInput.click();
}

function saveToLocal(){
  localStorage.setItem("hotv_campaign", JSON.stringify(state));
}

function loadFromLocal(){
  const data = localStorage.getItem("hotv_campaign");
  if(!data) return;

  try{
    state = JSON.parse(data);

    // ✅ ensure mfgTicks always exists
    ["A","B"].forEach(side=>{
      if(!state.armies[side].mfgTicks){
        state.armies[side].mfgTicks = [false,false,false];
      }
    });

    updateUI();
  } catch(e){
    console.warn("Failed to load local save");
  }
}

function clearLocal(){
  localStorage.removeItem("hotv_campaign");
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocal();
  updateUI();
});

