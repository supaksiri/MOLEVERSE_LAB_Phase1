import {computeSolution} from './chemistry.js';
export function newLab(){return {id:'hcl',concentration:0.1,litmus:{red:null,blue:null},circuitConnected:false,electrodesSubmerged:false,powerOn:false,electrodesClean:true,observations:{},history:[],warning:''};}
export function reducer(state, action){
 const s={...state,litmus:{...state.litmus},observations:{...state.observations},history:[...state.history],warning:''};
 switch(action.type){
 case 'SELECT': {s.id=action.id;s.litmus={red:null,blue:null};s.electrodesSubmerged=false;s.powerOn=false; if(!s.electrodesClean)s.warning='ขั้วยังไม่ได้ล้าง ผลการทดลองใหม่อาจปนเปื้อน โปรดล้างขั้วก่อน';break;}
 case 'CONCENTRATION': {s.concentration=Number(action.value);s.litmus={red:null,blue:null};s.electrodesSubmerged=false;s.powerOn=false;break;}
 case 'LITMUS': {if(!['red','blue'].includes(action.color))throw new Error('Invalid litmus color');s.litmus[action.color]=computeSolution(s.id,s.concentration).litmus[action.color];break;}
 case 'CONNECT':s.circuitConnected=!s.circuitConnected;if(!s.circuitConnected)s.powerOn=false;break;
 case 'SUBMERGE':s.electrodesSubmerged=!s.electrodesSubmerged;break;
 case 'POWER': if(!s.circuitConnected){s.warning='ต้องต่อวงจรให้สมบูรณ์ก่อน';break;}s.powerOn=!s.powerOn;break;
 case 'RINSE':s.electrodesClean=true;s.electrodesSubmerged=false;s.powerOn=false;break;
 case 'RECORD': {
   if(!['strong','weak','none','control'].includes(action.classification)){s.warning='กรุณาเลือกประเภทสารก่อนบันทึกผล';break;}
   if(s.litmus.red===null||s.litmus.blue===null||!s.circuitConnected||!s.electrodesSubmerged||!s.powerOn||!s.electrodesClean){s.warning='ทดสอบลิตมัสทั้งสองสี เปิดวงจร จุ่มขั้ว และล้างขั้วก่อนบันทึก';break;}
   const r=computeSolution(s.id,s.concentration);const key=s.id+'@'+s.concentration;
   const value={id:s.id,concentration:s.concentration,red:s.litmus.red,blue:s.litmus.blue,relativeIndex:r.relativeIndex,brightness:r.brightness,classification:action.classification||null,at:new Date().toISOString()};
   s.observations[key]=value;s.history.push(value);s.electrodesClean=false;break;
 }
 case 'RESET':return newLab();
 default:throw new Error('Unknown action '+action.type);
 }
 return s;
}
export function instrument(state){ const isReady=state.circuitConnected && state.electrodesSubmerged && state.powerOn && state.electrodesClean;const solution=computeSolution(state.id,state.concentration);return {isReady,level:isReady?solution.relativeIndex:0,brightness:isReady?solution.brightness:'off',message:!state.circuitConnected?'ยังไม่ต่อวงจร':!state.electrodesSubmerged?'ยังไม่จุ่มขั้ว':!state.powerOn?'สวิตช์ปิด':!state.electrodesClean?'ขั้วยังไม่สะอาด':'กำลังวัดค่า (เชิงสัมพัทธ์)'};}
