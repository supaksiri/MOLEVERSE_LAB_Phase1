/** IONVERSE Phase 1 chemistry core. No DOM dependencies.
 * Educational qualitative model, NOT a calibrated conductivity meter.
 * Ka/Kb are approximate reference values near 25 C; concentrations treated ideally.
 */
export const KW = 1e-14;
export const ACETIC_KA = 1.8e-5;
export const AMMONIA_KB = 1.8e-5;
export const CHEMICALS = Object.freeze([
  {id:'hcl', formula:'HCl', name:'กรดไฮโดรคลอริก', type:'strong', nature:'acid', family:'strong-acid', ions:[['H3O+',1],['Cl-',1]]},
  {id:'acetic', formula:'CH₃COOH', name:'กรดแอซีติก', type:'weak', nature:'acid', family:'weak-acid', ions:[['H3O+',1],['CH3COO-',1]]},
  {id:'nacl', formula:'NaCl', name:'โซเดียมคลอไรด์', type:'strong', nature:'neutral', family:'neutral-salt', ions:[['Na+',1],['Cl-',1]]},
  {id:'kno3', formula:'KNO₃', name:'โพแทสเซียมไนเตรต', type:'strong', nature:'neutral', family:'neutral-salt', ions:[['K+',1],['NO3-',1]]},
  {id:'naoh', formula:'NaOH', name:'โซเดียมไฮดรอกไซด์', type:'strong', nature:'base', family:'strong-base', ions:[['Na+',1],['OH-',1]]},
  {id:'koh', formula:'KOH', name:'โพแทสเซียมไฮดรอกไซด์', type:'strong', nature:'base', family:'strong-base', ions:[['K+',1],['OH-',1]]},
  {id:'nh3', formula:'NH₃(aq)', name:'แอมโมเนียในน้ำ', type:'weak', nature:'base', family:'weak-base', ions:[['NH4+',1],['OH-',1]]},
  {id:'acetate', formula:'CH₃COONa', name:'โซเดียมแอซีเตต', type:'strong', nature:'base', family:'acetate-salt', ions:[['Na+',1],['CH3COO-',1]]},
  {id:'nh4cl', formula:'NH₄Cl', name:'แอมโมเนียมคลอไรด์', type:'strong', nature:'acid', family:'ammonium-salt', ions:[['NH4+',1],['Cl-',1]]},
  {id:'ethanol', formula:'C₂H₅OH', name:'เอทานอล', type:'none', nature:'neutral', family:'none', ions:[]},
  {id:'urea', formula:'(NH₂)₂CO', name:'ยูเรีย', type:'none', nature:'neutral', family:'none', ions:[]},
  {id:'sucrose', formula:'C₁₂H₂₂O₁₁', name:'ซูโครส', type:'none', nature:'neutral', family:'none', ions:[]},
]);
export const WATER = Object.freeze({id:'water',formula:'H₂O',name:'น้ำกลั่น (ตัวควบคุม)',type:'control',nature:'neutral',family:'water',ions:[]});
export const ALL_CHEMICALS = Object.freeze([...CHEMICALS, WATER]);
// Relative ionic mobilities for qualitative *comparison only*, not laboratory calibration.
const MOBILITY = {'H3O+':3.50,'OH-':1.98,'Na+':0.50,'K+':0.74,'Cl-':0.76,'NO3-':0.71,'CH3COO-':0.41,'NH4+':0.73};
const squareIon = (K,c) => (-K + Math.sqrt(K*K+4*K*c))/2;
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
export function getChemical(id){ const s=ALL_CHEMICALS.find(x=>x.id===id);if(!s)throw new Error('Unknown chemical: '+id);return s; }
export function computeSolution(id, concentration=0.1){
 const s=getChemical(id);
 if (!(concentration>0 && concentration<=1) || !Number.isFinite(concentration)) throw new RangeError('Concentration must be >0 and <=1 mol/L');
 const c=concentration; let h=1e-7,oh=1e-7, fraction=0, ionMoles=0;
 const ionCounts={};
 if(s.family==='strong-acid'){h=c;oh=KW/h;fraction=1;}
 else if(s.family==='strong-base'){oh=c;h=KW/oh;fraction=1;}
 else if(s.family==='weak-acid'){h=squareIon(ACETIC_KA,c);oh=KW/h;fraction=h/c;}
 else if(s.family==='weak-base'){oh=squareIon(AMMONIA_KB,c);h=KW/oh;fraction=oh/c;}
 else if(s.family==='acetate-salt'){const kb=KW/ACETIC_KA;oh=squareIon(kb,c);h=KW/oh;fraction=1;}
 else if(s.family==='ammonium-salt'){const ka=KW/AMMONIA_KB;h=squareIon(ka,c);oh=KW/h;fraction=1;}
 else if(s.family==='neutral-salt')fraction=1;
 const pH=clamp(-Math.log10(h),0,14);
 if(s.type==='strong') for(const [ion,stoich] of s.ions)ionCounts[ion]=c*stoich;
 if(s.family==='weak-acid'){ionCounts['H3O+']=h;ionCounts['CH3COO-']=h;}
 if(s.family==='weak-base'){ionCounts['NH4+']=oh;ionCounts['OH-']=oh;}
 // Very small hydrolysis products omitted from main salt ion visualization, but influence pH.
 ionMoles=Object.values(ionCounts).reduce((a,b)=>a+b,0);
 const mobilityScore=Object.entries(ionCounts).reduce((sum,[ion,n])=>sum+n*(MOBILITY[ion]||0),0);
 // Scaled reference: 0.1 M NaCl has ~52 relative units; not µS/cm or a physical measurement.
 const relativeIndex=clamp(100*mobilityScore/(0.1*(MOBILITY['Na+']+MOBILITY['Cl-'])*2),0,100);
 const litmusRed = pH>8.3?'blue':'red';
 const litmusBlue = pH<4.5?'red':'blue';
 // A categorical interpretation calibrated for teaching, distinct from chemical strength classification.
 const brightness = relativeIndex<0.8?'off':relativeIndex<16?'dim':relativeIndex<42?'medium':'bright';
 return {chemical:s,concentration:c,pH, fraction,ionCounts,ionMoles,relativeIndex,brightness,litmus:{red:litmusRed,blue:litmusBlue},
   limitation:'แบบจำลองเชิงการศึกษา ใช้ค่าความเคลื่อนที่สัมพัทธ์และสมดุลอุดมคติ ไม่ใช่ค่าการนำไฟฟ้าที่สอบเทียบแล้ว โดยเฉพาะที่ความเข้มข้นสูง'};
}
export const CLASSIFICATION_LABELS={strong:'อิเล็กโทรไลต์แก่',weak:'อิเล็กโทรไลต์อ่อน',none:'นอนอิเล็กโทรไลต์',control:'น้ำกลั่น (ตัวควบคุม)'};
export function classifyLitmus({red,blue}){return red==='blue'?'base':blue==='red'?'acid':'neutral';}
