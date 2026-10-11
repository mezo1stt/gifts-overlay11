var h = null, fy = null;
var API_BASE = (function(){
  try {
    if (typeof window !== "undefined" && window.location && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
      return window.location.origin;
    }
  } catch (e) {}
  return "http://127.0.0.1:2137";
})();
var CLOUD_OVERLAY_BASE = (typeof window !== "undefined" && window.location && window.location.hostname && window.location.hostname.includes("onrender.com")) ? window.location.origin : "https://gifts-overlay11.onrender.com";
var OVERLAY_BOARD_ID = (function(){
  try {
    var p = new URLSearchParams(window.location.search);
    var raw = p.get("cid") || p.get("uid") || p.get("id") || "default";
    return (raw === "default" || !raw) ? "mz_6e60223656d3863d21bb918dc1dc" : raw;
  } catch (e) {
    return "mz_6e60223656d3863d21bb918dc1dc";
  }
})();
var __lsBroadcastChannel = (function(){
  try {
    if (typeof BroadcastChannel !== "undefined") {
      return new BroadcastChannel("mezo_luckyspin_sync");
    }
  } catch (e) {}
  return null;
})();
var __lsSeenCtrlIds = new Set();
var __lsFastSyncTs = 0;
var __lsLastCoinSoundTs = 0;
var __lsAudioCtx = null;
function __getLsAudioCtx() {
  try {
    if (!__lsAudioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) __lsAudioCtx = new AC();
    }
    if (__lsAudioCtx && __lsAudioCtx.state === "suspended") {
      __lsAudioCtx.resume().catch(function(){});
    }
    return __lsAudioCtx;
  } catch (e) {
    return null;
  }
}
if (typeof window !== "undefined") {
  ["click", "touchstart", "keydown", "pointerdown"].forEach(function(ev) {
    window.addEventListener(ev, function() { __getLsAudioCtx(); }, { passive: true });
  });
}
function __playSynthFallback(type, vol) {
  try {
    var ctx = __getLsAudioCtx();
    if (!ctx) return;
    var g = Math.max(0.05, Math.min(1, Number(vol) || 0.5));
    var now = ctx.currentTime;
    if (type === "elimination") {
      [0, 0.22].forEach(function(offset, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(idx === 0 ? 340 : 240, now + offset);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 180 : 95, now + offset + 0.25);
        gain.gain.setValueAtTime(0.35 * g, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.29);
      });
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach(function(freq, idx) {
        var st = now + idx * 0.13;
        var dur = idx === 3 ? 0.55 : 0.15;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.4 * g, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + dur + 0.02);
      });
    } else if (type === "coin") {
      [987.77, 1318.51].forEach(function(freq, idx) {
        var st = now + idx * 0.07;
        var dur = idx === 0 ? 0.08 : 0.25;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.3 * g, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + dur + 0.01);
      });
    }
  } catch (e) {}
}
function _extends(){
  var fw=h;
  return _extends=Object["assign"]?Object["assign"]["bind"]():function(i){
    var fx=fw;
    for(var j=0x1;
    j<arguments["length"];
    j++){
      var k=arguments[j];
      for(var l in k)({
        
      }["hasOwnProperty"]["call"](k,l)&&(i[l]=k[l]));
      
    }return i;
    
  },_extends["apply"](null,arguments);
  
}var {
  useState,useEffect,useRef,useMemo,useCallback
}=React,plainText=i=>String((typeof window!=="undefined"&&window["normalizeFancyText"]?window["normalizeFancyText"](i):i)??""),DEFAULT_LIBRARY=[{
  'id':"def_spin",'name':"Wheel Spinning",'url':"/sounds/spin.mp3",'type':"spin",'active':!![],'min':0x0,'isCustom':![]
},{
  'id':"def_win",'name':"Winner Tada",'url':"/sounds/Tada.mp3",'type':"win",'active':!![],'min':0x0,'isCustom':![]
},{
  'id':"def_coin",'name':"Join Sound (join.mp3)",'url':"/sounds/join.mp3",'type':"coin",'active':!![],'min':0x0,'isCustom':![]
},{
  'id':"def_win_music",'name':"Victory Music",'url':"/sounds/win.mp3",'type':"win",'active':!![],'min':0x0,'isCustom':![]
},{
  'id':"def_elim",'name':"Elimination Sound (fart.mp3)",'url':"/sounds/fart.mp3",'type':"elimination",'active':!![],'min':0x0,'isCustom':![]
}],MULTI_ELIM_FLOOR=typeof window!=="undefined"&&window["LuckySpinMultiElim"]?window["LuckySpinMultiElim"]["MIN_SURVIVORS"]:0xa,CogIcon=()=>React["createElement"]("svg",{
  'className':"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 20 20"
},React["createElement"]("path",{
  'fillRule':"evenodd",'d':"M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z",'clipRule':"evenodd"
})),TrashIcon=()=>React["createElement"]("svg",{
  'className':"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
})),PlayIcon=()=>React["createElement"]("svg",{
  'className':"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M8 5v14l11-7z"
})),CheckIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 20 20"
},React["createElement"]("path",{
  'fillRule':"evenodd",'d':"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",'clipRule':"evenodd"
})),FolderIcon=()=>React["createElement"]("svg",{
  'className':"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
})),Coins=({
  className:i,style:j
})=>React["createElement"]("svg",{
  'className':i,'style':j,'viewBox':"0 0 48 48",'xmlns':"http://www.w3.org/2000/svg"
},React["createElement"]("path",{
  'd':"M48 24a24 24 0 1 1-48 0 24 24 0 0 1 48 0Z",'fill':"#FFB84D"
}),React["createElement"]("path",{
  'd':"M47 24a23 23 0 1 1-46 0 23 23 0 0 1 46 0Z",'fill':"#FFDE55"
}),React["createElement"]("path",{
  'd':"M42 24a18 18 0 1 1-36 0 18 18 0 0 1 36 0Z",'fill':"#F7A80F"
}),React["createElement"]("path",{
  'd':"M41.94 25.5a18 18 0 1 0-35.88 0 18 18 0 0 1 35.88 0Z",'fill':"#F09207"
}),React["createElement"]("path",{
  'd':"M34.34 18.18a5.78 5.78 0 0 1-5.82-5.74h-3.87v15.63c0 1.94-1.6 3.5-3.56 3.5a3.53 3.53 0 0 1-3.55-3.5 3.53 3.53 0 0 1 4.52-3.38v-3.9a7.38 7.38 0 0 0-8.4 7.28 7.38 7.38 0 0 0 7.43 7.34c4.1 0 7.43-3.29 7.43-7.34v-7.98a9.73 9.73 0 0 0 5.82 1.92v-3.83Z",'fill':"#fff"
})),PaletteIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.22-.27-.49-.6-.49-.99 0-.57.47-1.04 1.04-1.04H14c3.08 0 5.6-2.52 5.6-5.6 0-3.87-3.13-7-7-7zm-4.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
})),PieChartIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"
})),CloseIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 20 20"
},React["createElement"]("path",{
  'fillRule':"evenodd",'d':"M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",'clipRule':"evenodd"
})),UsersIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
})),LightningIcon=()=>React["createElement"]("svg",{
  'className':"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M7 2v11h3v9l7-12h-4l4-8z"
})),LayersIcon=()=>React["createElement"]("svg",{
  'className':"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"
})),TrashIconOutline=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
})),VolumeIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
})),MuteIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
})),LinkIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
})),CopyIcon=()=>React["createElement"]("svg",{
  'className':"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
})),Play=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M8 5v14l11-7z"
})),Pause=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M6 19h4V5H6v14zm8-14v14h4V5h-4z"
})),CheckCircle=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 20 20"
},React["createElement"]("path",{
  'fillRule':"evenodd",'d':"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",'clipRule':"evenodd"
})),EyeIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
})),EyeOffIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-3 h-3",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
})),Crown=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
})),SpeedIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"
})),ScaleIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z"
})),RefreshIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
})),SkipIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"
})),MenuIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-6 h-6",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
})),ChevronUpIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-6 h-6",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
})),LockIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
})),ZapIcon=({
  className:i
})=>React["createElement"]("svg",{
  'xmlns':"http://www.w3.org/2000/svg",'className':i||"w-4 h-4",'viewBox':"0 0 24 24",'fill':"currentColor"
},React["createElement"]("path",{
  'd':"M11.5 2L5 13H11L10 22L19 11H13L14.5 2Z"
})),HeartIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
})),GuideIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-6 h-6",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
}),React["createElement"]("path",{
  'd':"M0 0h24v24H0z",'fill':"none"
})),MusicIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-6 h-6",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
})),TimerIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-5 h-5",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
})),GiftIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-6 h-6",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C13.96 2.54 13.05 2 12 2c-1.66 0-3 1.34-3 3 0 .35.07.69.18 1H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"
})),Diamond=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4 shadow-sm",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 2L2 12l10 10 10-10L12 2z"
})),LayoutGridIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"
})),DiscIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i||"w-4 h-4",'fill':"currentColor",'viewBox':"0 0 24 24"
},React["createElement"]("path",{
  'd':"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
})),COLORS=["#ef4444","#f97316","#f59e0b","#84cc16","#10b981","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#d946ef","#f43f5e"],StarIcon=({
  className:i
})=>React["createElement"]("svg",{
  'className':i,'fill':"currentColor",'viewBox':"0 0 20 20"
},React["createElement"]("path",{
  'd':"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
})),getInitials=i=>{
  var fz=fy;
  if(!i)return'?';
  return i["split"]('\x20')["map"](j=>j[0x0])["join"]('')["substring"](0x0,0x2)["toUpperCase"]();
  
},SafeAvatar=({
  src:i,name:j,className:k,style:l,...m
})=>{
  var fA=fy,[n,o]=React["useState"]("loading"),q=React["useRef"](null);
  React["useEffect"](()=>{
    var fB=fA;
    if(!i){
      o("error");
      return;
      
    }o("loading");
    if(q["current"])clearTimeout(q["current"]);
    return q["current"]=setTimeout(()=>{
      var fC=fB;
      o(t=>t==="loading"?"error":t);
      
    },0xbb8),()=>{
      var fD=fB;
      if(q["current"])clearTimeout(q["current"]);
      
    };
    
  },[i]);
  var r=()=>{
    var fE=fA;
    if(q["current"])clearTimeout(q["current"]);
    o("success");
    
  },s=()=>{
    var fF=fA;
    if(q["current"])clearTimeout(q["current"]);
    o("error");
    
  };
  if(n==="error"||!i)return React["createElement"]("div",{
    'className':k+" flex items-center justify-center bg-gray-800 text-white font-black uppercase text-[10px] overflow-hidden text-center px-1 break-words select-none leading-tight",'style':l
  },React["createElement"]("span",{
    'className':"truncate max-w-full font-black text-center"
  },plainText(j)));
  return React["createElement"]("img",_extends({
    'src':i,'className':k+'\x20'+(n==="loading"?"opacity-0":"opacity-100"),'style':l,'onLoad':r,'onError':s
  },m));
  
},getCoordinatesForPercent=i=>{
  var fG=fy,j=Math["cos"](0x2*Math['PI']*i),k=Math["sin"](0x2*Math['PI']*i);
  return[j,k];
  
},WheelSVG=React["memo"](({
  slices:i,isProportional:j,lastUpdatedPlayer:k,hideLabels:l,theme:m,wheelBgColor:n,wheelBorderColor:o,multiElimRevealed:elimList
})=>{
  var renderSlices=i;
  if(i["length"]>0x168){
    var merged=[];
    for(var idx=0x0;idx<i["length"];idx++){
      var cur=i[idx];
      var curKey=cur["userId"]||cur["name"];
      if(merged["length"]>0x0&&(merged[merged["length"]-0x1]["userId"]||merged[merged["length"]-0x1]["name"])===curKey){
        var prev=merged[merged["length"]-0x1];
        prev["endAngle"]=cur["endAngle"];
        prev["degrees"]+=cur["degrees"];
      }else{
        merged["push"]({...cur});
      }
    }
    if(merged["length"]>0x168){
      var step=merged["length"]/0x168;
      var sampled=[];
      for(var sIdx=0x0;sIdx<0x168;sIdx++){
        sampled["push"](merged[Math["floor"](sIdx*step)]);
      }
      renderSlices=sampled;
    }else{
      renderSlices=merged;
    }
  }
  var fH=fy;
  if(i["length"]===0x0){
    var demoColors=["#2563eb","#db2777","#059669","#d97706","#7c3aed","#0891b2","#dc2626","#ca8a04"];
    return React["createElement"]("svg",{
      'viewBox':"-1 -1 2 2",'style':{'transform':"rotate(-90deg)"},'className':"w-full h-full overflow-visible"
    },demoColors["map"]((col,idx)=>{
      var stA=idx*0x2d,enA=(idx+0x1)*0x2d,s=getCoordinatesForPercent(stA/0x168),t=getCoordinatesForPercent(enA/0x168);
      var pathD="M 0 0 L "+s[0x0]+" "+s[0x1]+" A 1 1 0 0 1 "+t[0x0]+" "+t[0x1]+" L 0 0";
      return React["createElement"]("path",{
        'key':"empty_"+idx,'d':pathD,'fill':m==="custom"?n:col,'fillOpacity':"0.88",'stroke':o||"#0f172a",'strokeWidth':"0.03"
      });
    }));
  }
  return React["createElement"]("svg",{
    'viewBox':"-1 -1 2 2",'style':{
      'transform':"rotate(-90deg)"
    },'className':"w-full h-full overflow-visible"
  },React["createElement"]("defs",null,React["createElement"]("clipPath",{
    'id':"wheel-avatar-clip"
  },React["createElement"]("circle",{
    'cx':'0','cy':'0','r':"0.15"
  }))),(renderSlices||i)["map"]((q,r)=>{
    var fI=fH,s=getCoordinatesForPercent(q["startAngle"]/0x168),t=getCoordinatesForPercent(q["endAngle"]/0x168),u=q["degrees"]>0xb4?0x1:0x0,v=q["degrees"]===0x168?"M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0":"M 0 0 L "+s[0x0]+'\x20'+s[0x1]+" A 1 1 0 "+u+" 1 "+t[0x0]+'\x20'+t[0x1]+" L 0 0",w=q["startAngle"]+q["degrees"]/0x2,x=0x2*Math['PI']*(w/0x168),y=Math["cos"](x)*0.65,z=Math["sin"](x)*0.65,A=w+0x5a+0xb4,B=q["name"]===k;
    var isElimSlice = Array["isArray"](elimList) && elimList["some"](e => e && (e['id'] === q['id'] || (e["userId"] && e["userId"] === q["userId"]) || (e["name"] && e["name"] === q["name"])));
    return React["createElement"]('g',{
      'key':q['id']||r,
      'style':isElimSlice?{'filter':"grayscale(100%) contrast(70%) brightness(0.65)",'opacity':0.65}:{}
    },React["createElement"]("path",{
      'd':v,'fill':q["color"],'stroke':o||"#1f2937",'strokeWidth':"0.03",'className':B?"wheel-highlight-anim":''
    }),!l&&q["degrees"]>0x3&&React["createElement"]('g',{
      'transform':"translate("+y+',\x20'+z+") rotate("+A+')'
    },q["degrees"]>=0xc&&React["createElement"](React["Fragment"],null,React["createElement"]("circle",{
      'cx':'0','cy':'0','r':"0.155",'fill':q["pic"]?"white":q["color"]
    }),q["pic"]?React["createElement"]("image",{
      'href':q["pic"],'xlinkHref':q["pic"],'x':"-0.15",'y':"-0.15",'width':"0.3",'height':"0.3",'clipPath':"url(#wheel-avatar-clip)",'preserveAspectRatio':"xMidYMid slice"
    }):React["createElement"]("text",{
      'x':'0','y':'0','fill':"white",'fontSize':"0.10",'fontWeight':"900",'textAnchor':"middle",'dominantBaseline':"central",'dy':".05em",'style':{
        'fontFamily':"Montserrat, sans-serif",'pointerEvents':"none"
      }
    },getInitials(q["name"])),React["createElement"]("circle",{
      'cx':'0','cy':'0','r':"0.15",'fill':"none",'stroke':"rgba(0,0,0,0.1)",'strokeWidth':"0.01"
    })),React["createElement"]("text",{
      'y':q["degrees"]>=0xc?"0.22":'0','fill':"white",'fontSize':q["degrees"]>=0xc?"0.08":"0.09",'fontWeight':"900",'textAnchor':"middle",'style':{
        'textShadow':"1px 1px 1px rgba(0,0,0,0.8)",'fontFamily':"Montserrat, sans-serif"
      }
    },q["name"]["substring"](0x0,0xa)),j&&q["degrees"]>0x6&&React["createElement"]("text",{
      'y':q["degrees"]>=0xc?"0.30":"0.12",'fill':"#fbbf24",'fontSize':q["degrees"]>=0xc?"0.06":"0.07",'fontWeight':"bold",'textAnchor':"middle",'style':{
        'textShadow':"1px 1px 1px rgba(0,0,0,0.8)",'fontFamily':"Montserrat, sans-serif"
      }
    },q["coins"])));
    
  }));
  
}),SquareGrid=React["memo"](({
  players:i,highlightIndex:j,isEliminationMode:k,showWinner:l,winner:m,wheelScale:n,wheelTheme:o,instantClaimEnabled:q,instantClaimAmount:r,multiElimRevealed:elimList
})=>{
  if(!i||i["length"]===0x0){
    return React["createElement"]("div",{
      'className':"relative w-full h-full overflow-hidden p-2 grid grid-cols-4 gap-2"
    },Array["from"]({'length':0x8})["map"]((_,idx)=>React["createElement"]("div",{
      'key':"sq_empty_"+idx,
      'className':"rounded-xl border-2 border-purple-500/40 bg-gray-950/85 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center shadow-lg select-none"
    },React["createElement"]("span",{
      'className':"text-xs font-black text-purple-400 mb-0.5"
    },"#"+(idx+0x1)),React["createElement"]("span",{
      'className':"text-[10px] font-bold text-gray-400 uppercase tracking-wider"
    },"+ WAITING"))));
  }

  var total=i["length"];
  var cols=0x2;
  if(total<=0x2)cols=Math["max"](0x1,total);
  else if(total<=0x4)cols=0x2;
  else if(total<=0x6)cols=0x3;
  else if(total<=0x9)cols=0x3;
  else if(total<=0x10)cols=0x4;
  else if(total<=0x19)cols=0x5;
  else if(total<=0x24)cols=0x6;
  else if(total<=0x31)cols=0x7;
  else if(total<=0x40)cols=0x8;
  else if(total<0x64)cols=0xa;
  else if(total<0x96)cols=0xc;
  else cols=0xf;

  var VIBRANT_PALETTE=[
    "#6366f1","#f97316","#3b82f6","#ef4444","#84cc16","#0ea5e9",
    "#38bdf8","#ea580c","#06b6d4","#f43f5e","#d946ef","#4f46e5",
    "#f59e0b","#a855f7","#10b981","#14b8a6","#8b5cf6","#e11d48",
    "#d97706","#65a30d","#0284c7"
  ];

  var renderCards=i;

  var nameInPicSize=total<=0x4?"1.4rem":total<=0x9?"1.15rem":total<=0x10?"0.95rem":total<=0x19?"0.8rem":total<=0x31?"0.68rem":total<0x64?"0.55rem":total<0x96?"0.45rem":"0.35rem";
  var footerNameSize=total<=0x4?"1.0rem":total<=0x9?"0.85rem":total<=0x10?"0.72rem":total<=0x19?"0.62rem":total<=0x31?"0.52rem":total<0x64?"0.45rem":"0.34rem";
  var footerCoinSize=total<=0x4?"0.85rem":total<=0x9?"0.75rem":total<=0x10?"0.62rem":total<=0x19?"0.52rem":total<=0x31?"0.45rem":total<0x64?"0.38rem":"0.30rem";
  var footerIconSize=total<=0x9?"w-3.5 h-3.5 text-yellow-400":total<0x64?"w-2.5 h-2.5 text-yellow-400":"w-1.5 h-1.5 text-yellow-400";
  var footerPadding=total<=0x9?"py-1 px-1":total<0x64?"py-0.5 px-1":"py-0.5 px-0.5";
  var cardRound=total<=0x9?"rounded-xl":total<0x64?"rounded-lg":"rounded";
  var topRound=total<=0x9?"rounded-t-xl":total<0x64?"rounded-t-lg":"rounded-t";
  var botRound=total<=0x9?"rounded-b-xl":total<0x64?"rounded-b-lg":"rounded-b";

  return React["createElement"]("div",{
    'className':"relative w-full h-full overflow-hidden select-none"
  },React["createElement"]("div",{
    'className':"grid gap-1.5 w-full h-full p-2 overflow-hidden select-none",'style':{
      'gridTemplateColumns':"repeat("+cols+", minmax(0px, 1fr))",
      'gridAutoRows':"minmax(0px, 1fr)",
      'alignContent':"start",
      'justifyContent':"stretch",
      'placeContent':"start stretch"
    }
  },renderCards["map"]((w,actualIdx)=>{
    var isHighlighted=(j!=null&&j>=0x0&&actualIdx===j);
    var isWinner=Boolean(l&&m&&(w['id']===m['id']||(!m['id']&&(w["userId"]||w["name"])===(m["userId"]||m["name"]))));
    var isElim=Boolean(Array["isArray"](elimList)&&elimList["some"](e=>e&&(e['id']===w['id'])));

    var cardColor=VIBRANT_PALETTE[actualIdx%VIBRANT_PALETTE["length"]];

    var ringClass="";
    if(isHighlighted){
      var colRing=k?"ring-red-500 shadow-[0_0_20px_rgb(239,68,68)]":"ring-yellow-400 shadow-[0_0_20px_rgb(250,204,21)]";
      ringClass="ring-4 scale-105 z-20 "+colRing;
    }
    if(isWinner){
      ringClass="ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,1)] z-30 scale-110 animate-pulse";
    }

    return React["createElement"]("div",{
      'key':w['id']||("sq_"+actualIdx),
      'id':"sq_card_"+actualIdx,
      'className':"relative w-full h-full "+cardRound+" transition-all duration-75 flex flex-col items-stretch justify-between overflow-hidden shadow-md border border-white/20 "+ringClass,
      'style':{
        'backgroundColor':cardColor,
        ...(isElim?{'filter':"grayscale(100%) opacity(0.35)"}:{})
      },
      'title':plainText(w["name"])
    },React["createElement"]("div",{
      'className':"relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden "+topRound,
      'style':{'backgroundColor':cardColor}
    },w["pic"]?React["createElement"](React["Fragment"],null,
      React["createElement"](SafeAvatar,{
        'src':w["pic"],
        'name':w["name"],
        'className':"w-full h-full object-cover",
        'style':{'backgroundColor':cardColor}
      }),
      React["createElement"]("div",{
        'className':"absolute inset-0 bg-black/25 flex items-center justify-center p-1"
      },React["createElement"]("span",{
        'className':"text-white font-black text-center truncate uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]",
        'style':{'fontSize':nameInPicSize}
      },plainText(w["name"])))
    ):React["createElement"]("div",{
      'className':"w-full h-full flex items-center justify-center text-white font-black p-1 text-center select-none break-words leading-tight uppercase",
      'style':{
        'fontSize':nameInPicSize,
        'textShadow':"0 2px 4px rgba(0,0,0,0.7)"
      }
    },plainText(w["name"]))),React["createElement"]("div",{
      'className':"w-full flex flex-col items-center justify-center leading-none bg-black/85 z-10 select-none "+footerPadding+' '+botRound
    },React["createElement"]("span",{
      'className':"text-white font-black uppercase truncate w-full text-center block tracking-tight",
      'style':{
        'fontSize':footerNameSize,
        'textShadow':"0 1px 2px black"
      },
      'title':plainText(w["name"])
    },plainText(w["name"])),React["createElement"]("span",{
      'className':"text-yellow-400 font-bold flex items-center justify-center gap-0.5 mt-0.5",
      'style':{'fontSize':footerCoinSize}
    },React["createElement"](Coins,{
      'className':footerIconSize
    }),String.fromCharCode(0x20),Number(w["coins"]||0x1)["toLocaleString"]())));
  })))
}),HUD_THEMES=[{
  'id':"simple",'label':"SIMPLE",'hint':"Cases sobres : libellé en haut, chiffre dessous, sans animation"
},{
  'id':"laagency",'label':"MEZO",'hint':"Thème mezo bleu, icône + chiffre + texte"
},{
  'id':"pills",'label':"GLASS PILLS",'hint':"Reflet qui passe, rebond"
},{
  'id':"royal",'label':"ROYAL GOLD",'hint':"Plaques dorées, étincelles, chiffres qui roulent"
},{
  'id':"arcade",'label':"ARCADE",'hint':"Blocs pixel, balayage, chiffres qui tombent"
},{
  'id':"jelly",'label':"JELLY",'hint':"Bonbons qui flottent, effet gelée"
},{
  'id':"ember",'label':"INFERNO",'hint':"Braises qui montent, chiffres qui flambent"
}],HUD_THEME_IDS=HUD_THEMES["map"](i=>i['id']),HudChip=({
  tone:i,delay:j,icon:k,value:l,suffix:m,label:n,pulse:o
})=>React["createElement"]("div",{
  'className':"lsh-chip lsh-"+i,'style':{
    '--d':j+'s'
  }
},React["createElement"]("span",{
  'className':"lsh-glint",'aria-hidden':"true"
},React["createElement"]('i',null)),React["createElement"]("span",{
  'className':"lsh-fx",'aria-hidden':"true"
},React["createElement"]('i',null),React["createElement"]('i',null),React["createElement"]('i',null)),React["createElement"]("span",{
  'key':i==="coins"?'i'+l:'i','className':"lsh-ic "+(i==="coins"?"lsh-flip":'')
},k),React["createElement"]("span",{
  'className':"lsh-txt"
},React["createElement"]("span",{
  'className':"lsh-num "+(o?"is-pulse":'')
},React["createElement"]('b',{
  'key':l,'className':"lsh-bump"
},Number(l||0x0)["toLocaleString"]()),m!=null&&React["createElement"]("small",null,'/',Number(m)["toLocaleString"]())),React["createElement"]("span",{
  'className':"lsh-lab"
},n))),HudGift=({
  gift:i,minBid:j,showMin:k
})=>React["createElement"]("div",{
  'className':"lsh-chip lsh-coins lsh-minbid",'style':{
    '--c':"#fbbf24",'--l':"#fde68a",'--dd':"#92400e",'--g':"rgba(245,158,11,.35)",'--d':"0s"
  }
},React["createElement"]("span",{
  'className':"lsh-ic"
},React["createElement"](Coins,{
  'className':"w-full h-full"
})),React["createElement"]("span",{
  'className':"lsh-txt"
},React["createElement"]("span",{
  'className':"lsh-num"
},React["createElement"](Coins,{
  'className':"lsh-mini"
}),Number(j||0x1)["toLocaleString"]()),React["createElement"]("span",{
  'className':"lsh-lab"
},"MIN BID"))),SessionHud=React["memo"](({
  theme:i,alive:j,total:k,entries:l,coins:m,vouch:n,showVouch:o,vouchPulse:q,gift:r,giftSide:s,minBid:t,showMin:u
})=>React["createElement"]("div",{
  'className':"lsh t-"+(HUD_THEME_IDS["includes"](i)?i:"pills")
},s==="left"&&React["createElement"](HudGift,{
  'gift':r,'minBid':t,'showMin':u
}),React["createElement"](HudChip,{
  'tone':"players",'delay':0x0,'icon':React["createElement"](UsersIcon,{
    'className':"w-4 h-4"
  }),'value':j,'suffix':k>j?k:null,'label':"PLAYERS"
}),React["createElement"](HudChip,{
  'tone':"entries",'delay':0.08,'icon':React["createElement"](LayersIcon,null),'value':l,'label':"ENTRIES"
}),React["createElement"](HudChip,{
  'tone':"coins",'delay':0.16,'icon':React["createElement"](Coins,{
    'className':"w-full h-full"
  }),'value':m,'label':"COINS"
}),o&&React["createElement"](HudChip,{
  'tone':"vouch",'delay':0.24,'icon':React["createElement"](StarIcon,{
    'className':"w-4 h-4"
  }),'value':n,'label':"VOUCH",'pulse':q
}),s==="right"&&React["createElement"](HudGift,{
  'gift':r,'minBid':t,'showMin':u
}))),DuelSide=({
  p:i,side:j
})=>React["createElement"]("div",{
  'className':"ldu-side ldu-"+j
},React["createElement"]("div",{
  'className':"ldu-av"
},React["createElement"](SafeAvatar,{
  'src':i&&i["pic"],'name':i?i["name"]:'?','referrerPolicy':"no-referrer",'className':"w-full h-full object-cover rounded-full",'style':{
    'backgroundColor':i&&i["color"]||"#1f2937"
  }
})),React["createElement"]("span",{
  'className':"ldu-name"
},i?plainText(i["name"])["slice"](0x0,0xb):'')),DuelBanner=React["memo"](({
  a:i,b:j
})=>React["createElement"]("div",{
  'className':"ldu"
},React["createElement"]("div",{
  'className':"ldu-wave",'aria-hidden':"true"
}),React["createElement"](DuelSide,{
  'p':i,'side':'l'
}),React["createElement"]("div",{
  'className':"ldu-plate"
},React["createElement"]("span",{
  'className':"ldu-shine",'aria-hidden':"true"
}),React["createElement"]("span",{
  'className':"ldu-sw ldu-sw-l",'aria-hidden':"true"
},'⚔️'),React["createElement"]("div",{
  'className':"ldu-words"
},React["createElement"]("span",{
  'className':"ldu-1v1",'data-t':"1V1"
},"1V1"),React["createElement"]("span",{
  'className':"ldu-duel"
},"DUEL")),React["createElement"]("span",{
  'className':"ldu-sw ldu-sw-r",'aria-hidden':"true"
},'⚔️'),React["createElement"]("span",{
  'className':"ldu-spark",'aria-hidden':"true"
})),React["createElement"](DuelSide,{
  'p':j,'side':'r'
})));
function pickGiftFromLauncher(i,j,k){
  var fM=fy;
  if(window["parent"]===window){
    k();
    return;
    
  }var l="gp_"+Date["now"]()+'_'+Math["random"]()["toString"](0x24)["slice"](0x2,0x8),m=![],n=o=>{
    var fN=fM,q=o["data"];
    if(!q||q["reqId"]!==l||o["source"]!==window["parent"])return;
    if(q["type"]==="HC_GIFT_PICKER_READY"){
      m=!![];
      return;
      
    }if(q["type"]==="HC_GIFT_PICKED"){
      window["removeEventListener"]("message",n);
      if(q["gift"])j(q["gift"]);
      
    }
  };
  window["addEventListener"]("message",n);
  try{
    window["parent"]["postMessage"]({
      'type':"HC_PICK_GIFT",'reqId':l,'title':i
    },'*');
    
  }catch(o){
    
  }setTimeout(()=>{
    var fO=fM;
    !m&&(window["removeEventListener"]("message",n),k());
    
  },0x190);
  
}function hcSoundEvent(i,j){
  var fP=fy;
  try{
    if(window["parent"]===window||new URLSearchParams(window["location"]["search"])["get"]("stream")==="true")return;
    window["parent"]["postMessage"]({
      'type':"HC_SOUND_EVENT",'game':"luckyspin",'event':i,'data':j||{
        
      }
    },'*');
    
  }catch(k){
    
  }
}var LuckySpinGame=()=>{
  var fQ=fy,i=new URLSearchParams(window["location"]["search"]),j=i["get"]("nocache")==="true",k=Boolean(window["__IS_LUCKYSPIN_OVERLAY__"]||i["get"]("stream")==="true"||i["get"]("mode")==="overlay"||(window["location"]&&window["location"]["pathname"]&&window["location"]["pathname"]["toLowerCase"]()["includes"]("overlay"))),l=(ez,eA,eB=null)=>{
    var fR=fQ;
    try{
      if(j)return eA;
      var eC=localStorage["getItem"](ez);
      if(eC===null)return eA;
      if(eB==="json")try{
        return JSON["parse"](eC)||eA;
        
      }catch(eE){
        return eA;
        
      }if(eC==="true")return!![];
      if(eC==="false")return![];
      if(typeof eA==="number"){
        var eD=parseFloat(eC);
        return isNaN(eD)?eA:eD;
        
      }return eC;
      
    }catch(eF){
      return eA;
      
    }
  },[m,n]=useState([]),[o,q]=useState(![]),[r,s]=useState(![]),[t,u]=useState(![]),[v,w]=useState(![]),[x,y]=useState(null),[z,A]=useState([]),[B,C]=useState(null),[D,E]=useState([]),[F,G]=useState(null),[H,I]=useState(''),[J,K]=useState(''),[L,M]=useState(()=>l("ls_timer_enabled",!![])),[N,O]=useState(()=>l("ls_auto_spin",!![])),[P,Q]=useState(()=>l("ls_minutes",0x1)),[R,S]=useState(()=>l("ls_seconds",0x0)),[T,U]=useState(()=>l("ls_elimination_seconds",0x14)),[V,W]=useState(0x3c),[X,Y]=useState(0x0),[Z,a0]=useState(()=>l("ls_minBid",0x1)),[a1,a2]=useState(()=>l("ls_show_minbid",!![])),[a3,a4]=useState(0x0),[a5,a6]=useState({
    
  }),[a7,a8]=useState({
    
  }),[a9,aa]=useState(0x0),[ab,ac]=useState([]),[ad,ae]=useState(()=>l("ls_wheel_bg_color","#1f2937")),[af,ag]=useState(()=>l("ls_wheel_border_color","#1f2937")),[ah,ai]=useState(()=>l("ls_proportional",![])),[aj,ak]=useState(()=>l("ls_is_muted",![])),[al,am]=useState(()=>l("ls_elimination",!![])),[an,ao]=useState(()=>l("ls_show_elimination_alert",!![])),[ap,aq]=useState(()=>l("ls_multi_elim",![])),[ar,as]=useState(()=>l("ls_multi_elim_count",0x2)),[at,au]=useState(()=>String(l("ls_multi_elim_count",0x2))),[av,aw]=useState([]),[ax,ay]=useState(![]),[az,aA]=useState([]),[aB,aC]=useState(null),[aD,aE]=useState({
    'spins':0x0,'totalPlayers':0x0,'totalEntries':0x0
  }),[aF,aG]=useState(null),[aH,aI]=useState(()=>l("ls_show_winner_stats",!![])),[aJ,aK]=useState(()=>l("ls_show_session_indicators",!![])),[aL,aM]=useState(()=>l("ls_hud_theme","pills",!![])),[aN,aO]=useState(()=>l("ls_vouch_count",0x0)),[aP,aQ]=useState(()=>l("ls_show_vouch",!![])),[aR,aS]=useState(()=>{
    var fS=fQ,ez=!j&&localStorage["getItem"]("ls_vouch_keywords"),eA=ez?JSON["parse"](ez):["vouch","legit"];
    if(!eA["includes"]("vouch"))eA["push"]("vouch");
    return eA;
    
  }),[aT,aU]=useState(![]),[aV,aW]=useState(()=>aR["join"](',\x20')),[aX,aY]=useState(()=>l("ls_multiple_mode",!![])),[aZ,b0]=useState(()=>l("ls_lock_after_spin",![])),[b1,b2]=useState(()=>l("ls_instant_claim_enabled",![])),[b3,b4]=useState(()=>l("ls_instant_claim_amount",0x3e8)),[b5,b6]=useState(()=>l("ls_inverse_mode",![])),[b7,b8]=useState(![]),[b9,ba]=useState(![]),[bb,bc]=useState('en'),[bd,be]=useState("player"),[bf,bg]=useState(()=>l("ls_is_square_mode",![])),[bh,bi]=useState(-0x1),bj=useRef(-0x1);
  useEffect(()=>{
    var fT=fQ;
    bj["current"]=bh;
    
  },[bh]);
  var [bk,bl]=useState(null),[bm,bn]=useState(()=>l("ls_join_follow",![])),[bo,bp]=useState(()=>l("ls_join_like",![])),[bq,br]=useState(()=>l("ls_join_coins",!![])),[bs,bt]=useState(()=>l("ls_join_gift_id",![])),[bu,bv]=useState(()=>l("ls_min_likes",0x32)),[bw,bx]=useState(()=>l("ls_max_entries_player",0x0)),[by,bz]=useState(()=>l("ls_max_total_players",0x0)),[bA,bB]=useState(()=>l("ls_min_participants",0x0)),[bC,bD]=useState(()=>l("ls_min_participants_unique",!![])),[bE,bF]=useState(()=>{
    var fU=fQ,ez=l("ls_wheel_history",[],"json");
    return Array["isArray"](ez)?ez:[];
    
  }),[bG,bH]=useState(![]),[bI,bJ]=useState(![]),[bK,bL]=useState(0x0),[ttUsername,setTtUsername]=useState(()=>l("ls_tiktok_username",'')),[ttStatus,setTtStatus]=useState("disconnected"),[ttConnectedUser,setTtConnectedUser]=useState(''),[ttError,setTtError]=useState(null),[liveGifts,setLiveGifts]=useState([]),[overlayCopied,setOverlayCopied]=useState(null),streakTrackerRef=useRef(new Map()),bM=i["get"]("scale"),[bN,bO]=useState(()=>{
    var fV=fQ;
    if(bM)return parseFloat(bM);
    return l("ls_wheel_scale",1.15);
    
  }),[bP,bQ]=useState(()=>l("ls_spin_duration",0x4)),[bR,bS]=useState(()=>l("ls_show_controls",!![])),[bT,bU]=useState(![]),[bV,bW]=useState(![]),[bX,bY]=useState(![]),[bZ,c0]=useState(()=>l("ls_show_duel_indicator",!![])),[c1,c2]=useState(''),[c3,c4]=useState(()=>l("ls_gift_url",'',!![])),[c5,c6]=useState(c3),[c7,c8]=useState(()=>l("ls_gift_size",0x64)),[c9,ca]=useState(()=>l("ls_gift_pos","top-left",!![])),[cb,cc]=useState(''),[cd,ce]=useState(()=>{
    var fW=fQ,ez=l("ls_favorite_gifts",[],"json");
    if(Array["isArray"](ez))return ez["filter"](eA=>eA&&typeof eA==="object"&&eA["url"]);
    return[];
    
  }),cf=useMemo(()=>{
    var fX=fQ;
    if(!c3)return null;
    try{
      var ez=new URL(c3),eA=new URLSearchParams(ez["search"]),eB=eA["get"]("url");
      return eB&&eB["startsWith"]("../images/")&&(eB="../../"+eB["substring"](0x3)),{
        'url':eB,'name':eA["get"]("name"),'cost':eA["get"]("cost")
      };
      
    }catch(eC){
      return null;
      
    }
  },[c3]),cg=[{
    'id':"def_rose",'minBid':0x1,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2Feba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp&name=Rose&cost=1",'pinned':!![],'position':"top-left"
  },{
    'id':"def_finger_heart",'name':"Finger Heart (5)",'minBid':0x5,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2Fa4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp&name=Finger%20Heart&cost=5",'pinned':!![],'position':"top-left"
  },{
    'id':"def_doughnut",'name':"Doughnut (30)",'minBid':0x1e,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2F4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp&name=Doughnut&cost=30",'pinned':!![],'position':"top-left"
  },{
    'id':"def_controller",'name':"Controller (100)",'minBid':0x64,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2F20ec0eb50d82c2c445cb8391fd9fe6e2~tplv-obj.webp&name=Game%20Controller&cost=100",'pinned':!![],'position':"top-left"
  },{
    'id':"def_corgi",'name':"Corgi (299)",'minBid':0x12b,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2F148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp&name=Corgi&cost=299",'pinned':!![],'position':"top-left"
  },{
    'id':"def_moneygun",'name':"Money Gun (500)",'minBid':0x1f4,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2Fe0589e95a2b41970f0f30f6202f5fce6~tplv-obj.webp&name=Money%20Gun&cost=500",'pinned':!![],'position':"top-left"
  },{
    'id':"def_galaxy",'name':"Galaxy (1000)",'minBid':0x3e8,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2Fresource%2F79a02148079526539f7599150da9fd28.png~tplv-obj.webp&name=Galaxy&cost=1000",'pinned':!![],'position':"top-left"
  },{
    'id':"def_whale",'name':"Whale Diving (2150)",'minBid':0x866,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2F46fa70966d8e931497f5289060f9a794~tplv-obj.webp&name=Whale%20Diving&cost=2150",'pinned':!![],'position':"top-left"
  },{
    'id':"def_keyboard",'name':"Gaming Keyboard (4000)",'minBid':0xfa0,'url':"http://localhost:2137/widgets/index.html?type=gift&url=https%3A%2F%2Fp16-webcast.tiktokcdn.com%2Fimg%2Fmaliva%2Fwebcast-va%2Fresource%2F085c46d6d7519b5f2de40216126456ef.png~tplv-obj.webp&name=Gaming%20Keyboard&cost=4000",'pinned':!![],'position':"top-left"
  }],[ch,ci]=useState(()=>{
    var fY=fQ,ez=l("ls_presets",[],"json");
    if(!ez||ez["length"]===0x0)return cg;
    var eA=ez["filter"](eB=>!eB['id']["startsWith"]("def_"));
    return[...cg,...eA];
    
  }),cj=ez=>{
    var fZ=fQ,eA="http://localhost:2137/widgets/index.html?type=gift&url="+encodeURIComponent(ez['i'])+"&name="+encodeURIComponent(ez['n'])+"&cost="+ez['c'],eB={
      'id':"custom_"+Date["now"](),'name':ez['n']+'\x20('+ez['c']+')','minBid':ez['c'],'url':eA,'pinned':!![],'position':"top-left"
    };
    ci(eC=>[...eC,eB]),bY(![]),c2('');
    
  },ck=ez=>{
    var g0=fQ;
    ci(eA=>eA["filter"](eB=>eB['id']!==ez));
    
  },cl=()=>{
    var ez=!bf;
    bg(ez),ez?bO(0x1):bO(1.15);
    
  },cm=ez=>{
    var g1=fQ;
    if(!ez)return;
    if(ez["minBid"])a0(ez["minBid"]);
    ez["url"]&&(c4(ez["url"]),c6(ez["url"]));
    if(ez["position"])ca(ez["position"]);
    
  },cn=()=>{
    var g2=fQ,ez=c5["trim"](),eA='';
    try{
      if(ez["includes"]("name=")){
        var eB=new URL(ez),eC=eB["searchParams"]["get"]("name"),eD=eB["searchParams"]["get"]("cost");
        if(eC)eA=eC+(eD?'\x20('+eD+')':'');
        
      }
    }catch(eG){
      
    }var eE=cb["trim"]()||eA||"Preset "+(ch["length"]+0x1),eF={
      'id':"custom_"+Date["now"](),'name':eE,'minBid':Z,'url':ez,'pinned':!![],'position':c9
    };
    ci(eH=>[...eH,eF]),c4(ez),cc('');
    
  },co=(ez,eA)=>{
    var g3=fQ;
    ez["stopPropagation"]();
    if(eA["startsWith"]("def_"))return;
    ci(eB=>eB["filter"](eC=>eC['id']!==eA));
    
  },cp=()=>{
    var g4=fQ,ez=cg["filter"](eA=>!ch["some"](eB=>eB['id']===eA['id']));
    ez["length"]>0x0&&ci(eA=>[...eA,...ez]);
    
  },cq=ez=>{
    var g5=fQ;
    if(!ez||cd["some"](eD=>eD["url"]===ez))return;
    try{
      var eA=new URL(ez),eB=new URLSearchParams(eA["search"]),eC={
        'url':ez,'name':eB["get"]("name")||"Unknown",'cost':eB["get"]("cost")||'?','img':eB["get"]("url")||"https://placehold.co/100x100?text=?"
      };
      ce(eD=>[eC,...eD]);
      
    }catch(eD){
      
    }
  },cr=(ez,eA)=>{
    var g6=fQ;
    ez["stopPropagation"](),ce(eB=>eB["filter"](eC=>eC["url"]!==eA));
    
  },[cs,ct]=useState(null),[cu,cv]=useState([]),[cw,cx]=useState(![]),[cy,cz]=useState(''),[cA,cB]=useState(''),[cC,cD]=useState(''),[cE,cF]=useState("spin"),[cG,cH]=useState(0x0),[cI,cJ]=useState(()=>l("ls_allow_overlap",![])),[cK,cL]=useState(0.5),cM=useRef(null),cN=useRef(null),cO=useRef(null),cP=useRef([]),cQ=useRef({
    
  }),cR=useRef({
    
  }),cS=useRef(0x0),cT=useRef([]),cU=useRef(m);
  useEffect(()=>{
    var g7=fQ;
    cU["current"]=m;
    
  },[m]);
  var cV=useRef(ab);
  useEffect(()=>{
    var g8=fQ;
    cV["current"]=ab;
    
  },[ab]);
  var cW=useRef(bP);
  useEffect(()=>{
    var g9=fQ;
    cW["current"]=bP;
    
  },[bP]);
  var cX=useRef(bq);
  useEffect(()=>{
    var ga=fQ;
    cX["current"]=bq;
    
  },[bq]);
  var cY=useRef(bs);
  useEffect(()=>{
    var gb=fQ;
    cY["current"]=bs;
    
  },[bs]);
  var cZ=useRef(bm);
  useEffect(()=>{
    var gc=fQ;
    cZ["current"]=bm;
    
  },[bm]);
  var d0=useRef(bo);
  useEffect(()=>{
    var gd=fQ;
    d0["current"]=bo;
    
  },[bo]);
  var d1=useRef(bu);
  useEffect(()=>{
    var ge=fQ;
    d1["current"]=bu;
    
  },[bu]);
  var d2=useRef(Z);
  useEffect(()=>{
    var gf=fQ;
    d2["current"]=Z;
    
  },[Z]);
  var d3=useRef(o);
  useEffect(()=>{
    var gg=fQ;
    d3["current"]=o;
    
  },[o]);
  var d4=useRef(r);
  useEffect(()=>{
    var gh=fQ;
    d4["current"]=r;
    
  },[r]);
  var d5=useRef(v);
  useEffect(()=>{
    var gi=fQ;
    d5["current"]=v;
    
  },[v]);
  var d6=useRef(t);
  useEffect(()=>{
    var gj=fQ;
    d6["current"]=t;
    
  },[t]);
  var d7=useRef(![]),d8=useRef(x);
  useEffect(()=>{
    var gk=fQ;
    d8["current"]=x;
    
  },[x]);
  var d9=useRef(V);
  useEffect(()=>{
    var gl=fQ;
    d9["current"]=V;
    
  },[V]);
  var da=useRef(ah);
  useEffect(()=>{
    var gm=fQ;
    da["current"]=ah;
    
  },[ah]);
  var db=useRef(b5);
  useEffect(()=>{
    var gn=fQ;
    db["current"]=b5;
    
  },[b5]);
  var dc=useRef(ap);
  useEffect(()=>{
    var go=fQ;
    dc["current"]=ap;
    
  },[ap]);
  var dd=useRef(ar);
  useEffect(()=>{
    var gp=fQ;
    dd["current"]=ar;
    
  },[ar]);
  var de=useRef([]),df=useRef([]),dg=useRef((window["LuckySpinSessionStats"]||{
    
  })["emptyLedger"]?window["LuckySpinSessionStats"]["emptyLedger"]():{
    'players':{
      
    },'spins':0x0
  }),dh=useRef({
    
  }),di=useRef({
    
  }),dj=useRef(aR);
  useEffect(()=>{
    var gq=fQ;
    dj["current"]=aR;
    
  },[aR]);
  var dk=useRef(null),dl=()=>{
    var gr=fQ,ez=window["LuckySpinSessionStats"];
    if(!ez)return;
    var eA=dg["current"];
    aE({
      'spins':eA["spins"],'totalPlayers':ez["totalPlayers"](eA),'totalEntries':ez["totalEntries"](eA)
    });
    
  },dm=ez=>{
    var gs=fQ;
    if(ez&&!ez["isElimination"]&&!ez["isInstantClaim"])hcSoundEvent("winner",{
      'name':ez["name"]||''
    });
    var eA=window["LuckySpinSessionStats"];
    aG(eA&&ez?eA["statsFor"](dg["current"],ez):null);
    if(!ez||ez["isElimination"]||k)return;
    var eB=ez["userId"]||ez["name"];
    if(!eB)return;
    var eC={
      ...dh["current"]
    };
    eC[eB]=(eC[eB]||0x0)+0x1,dh["current"]=eC,di["current"][eB]=ez["name"];
    
  },dn=()=>{
    var gt=fQ;
    df["current"]["forEach"](ez=>{
      try{
        ez();
        
      }catch(eA){
        
      }
    }),df["current"]=[];
    
  };
  useEffect(()=>dn,[]);
  var dp=useRef(null),dq=useMemo(()=>{
    return COLORS;
    
  },[]);
  useEffect(()=>{
    n(ez=>{
      var gv=h,eA=![],eB=ez["map"](eC=>{
        var gw=gv;
        if(!dq["includes"](eC["color"]))return eA=!![],{
          ...eC,'color':dq[Math["floor"](Math["random"]()*dq["length"])]
        };
        return eC;
        
      });
      return eA?eB:ez;
      
    });
    
  },[dq]),useEffect(()=>{
    var gx=fQ,ez=j?null:localStorage["getItem"]("ls_sound_config"),eA=[];
    if(ez){
      var eB=JSON["parse"](ez);
      var anyActive=Array["isArray"](eB)&&eB["some"](x=>x&&x["active"]);
      eA=(Array["isArray"](eB)?eB:[])["map"](item=>{
        var defItem=DEFAULT_LIBRARY["find"](d=>d['id']===item['id']);
        if(defItem){
          return {...item,'name':defItem["name"],'url':defItem["url"],'active':(defItem['id']==="def_coin"||defItem['id']==="def_elim")?!![]:(anyActive?Boolean(item["active"]):!![])};
        }
        return item;
      });
      DEFAULT_LIBRARY["forEach"](eC=>{
        var gy=gx,eD=eA["find"](eE=>eE['id']===eC['id']);
        !eD&&eA["push"]({
          ...eC,'active':!![]
        });
      });
    }else eA=DEFAULT_LIBRARY["map"](eC=>({
      ...eC,'active':!![]
    }));
    cv(eA);
    
  },[]),useEffect(()=>{
    var gA=fQ,ez=eC=>{
      var gz=h;
      if(eC["status"]==="connected")bJ(!![]);
      else{
        if(eC["status"]==="disconnected"||eC["status"]==="error")bJ(![]);
        
      }
    },eA=null;
    window["api"]&&window["api"]["onTikTokStatus"]&&(eA=window["api"]["onTikTokStatus"](ez));
    if(!k){
      var handleSseMessage=ev=>{
        try{
          var msg=JSON["parse"](ev["data"]);
          if(!msg||!msg["type"])return;
          if(msg["type"]==="TIKTOK_STATUS"&&msg["data"]){
            var st=msg["data"]["status"]||"disconnected";
            if(st==="connected"||st==="offline"||msg["data"]["username"]){
              setTtStatus(st);
              if(msg["data"]["username"]){
                setTtConnectedUser(msg["data"]["username"]);
                setTtUsername(prev=>prev||msg["data"]["username"]);
              }
              setTtError(msg["data"]["error"]||null);
              bJ(st==="connected");
            }
          }
          if(["SPIN_DATA","LIKE_DATA","EVENT_DATA","CHAT_DATA","TIKTOK_VIEWERS","TIKTOK_STATUS"]["includes"](msg["type"])){
            window["postMessage"](msg,'*');
          }
        }catch(err){}
      };
      var hostEs=null;
      try{
        hostEs=new EventSource(API_BASE+"/events?t="+Date["now"]());
        hostEs["onmessage"]=handleSseMessage;
      }catch(err){}
      var origCleanup=eA;
      eA=()=>{
        if(typeof origCleanup==="function")origCleanup();
        if(hostEs)hostEs["close"]();
      };
    }
    var eB=eC=>{
      var gB=gA;
      eC["data"]&&eC["data"]["type"]==="TIKTOK_STATUS"&&ez(eC["data"]["data"]);
      
    };
    return window["addEventListener"]("message",eB),()=>{
      var gC=gA;
      if(typeof eA==="function")eA();
      window["removeEventListener"]("message",eB);
      
    };
    
  },[]),useEffect(()=>{
    var gD=fQ;
    cu["length"]>0x0&&!j&&localStorage["setItem"]("ls_sound_config",JSON["stringify"](cu));
    
  },[cu,j]);
  var [dr,ds]=useState(()=>l("ls_show_logo",!![])),[dt,du]=useState(()=>l("ls_wheel_theme","classic",!![]));
  useEffect(()=>{
    var gE=fQ;
    if(!j)localStorage["setItem"]("ls_timer_enabled",L);
    
  },[L,j]),useEffect(()=>{
    var gF=fQ;
    if(!j)localStorage["setItem"]("ls_auto_spin",N);
    
  },[N,j]),useEffect(()=>{
    var gG=fQ;
    if(!j)localStorage["setItem"]("ls_minutes",P);
    
  },[P,j]),useEffect(()=>{
    var gH=fQ;
    if(!j)localStorage["setItem"]("ls_seconds",R);
    
  },[R,j]),useEffect(()=>{
    var gI=fQ;
    if(!j)localStorage["setItem"]("ls_elimination_seconds",T);
    
  },[T,j]),useEffect(()=>{
    var gJ=fQ;
    if(!j)localStorage["setItem"]("ls_minBid",Z);
    
  },[Z,j]),useEffect(()=>{
    var gK=fQ;
    if(!j)localStorage["setItem"]("ls_show_minbid",a1);
    
  },[a1,j]),useEffect(()=>{
    var gL=fQ;
    if(!j)localStorage["setItem"]("ls_proportional",ah);
    
  },[ah,j]),useEffect(()=>{
    var gM=fQ;
    if(!j)localStorage["setItem"]("ls_is_muted",aj);
    
  },[aj,j]),useEffect(()=>{
    var gN=fQ;
    if(!j)localStorage["setItem"]("ls_elimination",al);
    
  },[al,j]),useEffect(()=>{
    var gO=fQ;
    if(!j)localStorage["setItem"]("ls_show_elimination_alert",an);
    
  },[an,j]),useEffect(()=>{
    var gP=fQ;
    if(!j)localStorage["setItem"]("ls_multi_elim",ap);
    
  },[ap,j]),useEffect(()=>{
    var gQ=fQ;
    if(!j)localStorage["setItem"]("ls_multi_elim_count",ar);
    
  },[ar,j]),useEffect(()=>{
    var gR=fQ;
    if(!j)localStorage["setItem"]("ls_show_winner_stats",aH);
    
  },[aH,j]),useEffect(()=>{
    var gS=fQ;
    if(!j)localStorage["setItem"]("ls_show_session_indicators",aJ);
    
  },[aJ,j]),useEffect(()=>{
    var gT=fQ;
    if(!j)localStorage["setItem"]("ls_hud_theme",aL);
    
  },[aL,j]),useEffect(()=>{
    var gU=fQ;
    if(!j)localStorage["setItem"]("ls_vouch_count",aN);
    
  },[aN,j]),useEffect(()=>{
    var gV=fQ;
    if(!j)localStorage["setItem"]("ls_show_vouch",aP);
    
  },[aP,j]),useEffect(()=>{
    var gW=fQ;
    if(!j)localStorage["setItem"]("ls_vouch_keywords",JSON["stringify"](aR));
    
  },[aR,j]),useEffect(()=>{
    var gX=fQ;
    try{
      localStorage["removeItem"]("ls_vouch_credits");
      
    }catch(ez){
      
    }
  },[]),useEffect(()=>{
    if(aN<=0x0)return;
    aU(!![]);
    var ez=setTimeout(()=>aU(![]),0x5dc);
    return()=>clearTimeout(ez);
    
  },[aN]),useEffect(()=>{
    var gY=fQ;
    if(!j)localStorage["setItem"]("ls_multiple_mode",aX);
    
  },[aX,j]),useEffect(()=>{
    var gZ=fQ;
    if(!j)localStorage["setItem"]("ls_lock_after_spin",aZ);
    
  },[aZ,j]),useEffect(()=>{
    var h0=fQ;
    if(!j)localStorage["setItem"]("ls_instant_claim_enabled",b1);
    
  },[b1,j]),useEffect(()=>{
    var h1=fQ;
    if(!j)localStorage["setItem"]("ls_instant_claim_amount",b3);
    
  },[b3,j]),useEffect(()=>{
    var h2=fQ;
    if(!j)localStorage["setItem"]("ls_allow_overlap",cI);
    
  },[cI,j]),useEffect(()=>{
    var h3=fQ;
    if(!j)localStorage["setItem"]("ls_wheel_scale",bN);
    
  },[bN,j]),useEffect(()=>{
    var h4=fQ;
    if(!j)localStorage["setItem"]("ls_spin_duration",bP);
    
  },[bP,j]),useEffect(()=>{
    var h5=fQ;
    if(!j)localStorage["setItem"]("ls_show_controls",bR);
    
  },[bR,j]),useEffect(()=>{
    var h6=fQ;
    if(!j)localStorage["setItem"]("ls_join_follow",bm);
    
  },[bm,j]),useEffect(()=>{
    var h7=fQ;
    if(!j)localStorage["setItem"]("ls_join_like",bo);
    
  },[bo,j]),useEffect(()=>{
    var h8=fQ;
    if(!j)localStorage["setItem"]("ls_join_coins",bq);
    
  },[bq,j]),useEffect(()=>{
    var h9=fQ;
    if(!j)localStorage["setItem"]("ls_join_gift_id",bs);
    
  },[bs,j]),useEffect(()=>{
    var ha=fQ;
    if(!j)localStorage["setItem"]("ls_min_likes",bu);
    
  },[bu,j]),useEffect(()=>{
    var hb=fQ;
    if(!j)localStorage["setItem"]("ls_show_logo",dr);
    
  },[dr,j]),useEffect(()=>{
    var hc=fQ;
    if(!j)localStorage["setItem"]("ls_wheel_theme",dt);
    
  },[dt,j]),useEffect(()=>{
    var hd=fQ;
    if(!j)localStorage["setItem"]("ls_inverse_mode",b5);
    
  },[b5,j]),useEffect(()=>{
    var he=fQ;
    if(!j)localStorage["setItem"]("ls_gift_url",c3);
    
  },[c3,j]),useEffect(()=>{
    var hf=fQ;
    if(!j)localStorage["setItem"]("ls_gift_size",c7);
    
  },[c7,j]),useEffect(()=>{
    var hg=fQ;
    if(!j)localStorage["setItem"]("ls_gift_pos",c9);
    
  },[c9,j]),useEffect(()=>{
    var hh=fQ;
    if(!j)localStorage["setItem"]("ls_presets",JSON["stringify"](ch));
    
  },[ch,j]),useEffect(()=>{
    var hi=fQ;
    if(!j)localStorage["setItem"]("ls_favorite_gifts",JSON["stringify"](cd));
    
  },[cd,j]),useEffect(()=>{
    var hj=fQ;
    if(!j)localStorage["setItem"]("ls_wheel_bg_color",ad);
    
  },[ad,j]),useEffect(()=>{
    var hk=fQ;
    if(!j)localStorage["setItem"]("ls_wheel_border_color",af);
    
  },[af,j]),useEffect(()=>{
    var hl=fQ;
    if(!j)localStorage["setItem"]("ls_max_entries_player",bw);
    
  },[bw,j]),useEffect(()=>{
    var hm=fQ;
    if(!j)localStorage["setItem"]("ls_max_total_players",by);
    
  },[by,j]),useEffect(()=>{
    var hn=fQ;
    if(!j)localStorage["setItem"]("ls_min_participants",bA);
    
  },[bA,j]),useEffect(()=>{
    var ho=fQ;
    if(!j)localStorage["setItem"]("ls_min_participants_unique",bC);
    
  },[bC,j]),useEffect(()=>{
    var hp=fQ;
    if(!j)localStorage["setItem"]("ls_is_square_mode",bf);
    
  },[bf,j]),useEffect(()=>{
    var hq=fQ;
    if(!j)localStorage["setItem"]("ls_show_duel_indicator",bZ);
    
  },[bZ,j]),useEffect(()=>{
    var hr=fQ,ez=new URLSearchParams(window["location"]["search"]),eA=ez["get"]("userName"),eB=ez["get"]("coins"),eC=ez["get"]("pictureProfil");
    eA&&eB&&(console["log"]("LuckySpin: Adding initial player from URL - "+eA+'\x20('+eB+')'),dM(eA,eA,parseInt(eB),eC));
    
  },[]);
  var dv=useCallback((ez="Manual")=>{
    var hs=fQ,eA=cU["current"]||[];
    if(eA["length"]===0x0)return;
    var eB={
      'id':Date["now"](),'time':new Date()["toLocaleTimeString"](),'date':new Date()["toLocaleDateString"](),'reason':ez,'playerCount':eA["length"],'players':eA["length"]>0x12c?eA["slice"](0x0,0x12c):[...eA],'coinAccumulator':eA["length"]>0x12c?{
        
      }:{
        ...cR["current"]
      },'likeAccumulator':eA["length"]>0x12c?{
        
      }:{
        ...cQ["current"]
      },'sessionCoins':cS["current"],'totalLikes':a3,'sessionTime':X,'isSlim':eA["length"]>0x12c
    };
    bF(eC=>{
      var ht=hs,eD=[eB,...eC]["slice"](0x0,0xa);
      if(!j)localStorage["setItem"]("ls_wheel_history",JSON["stringify"](eD));
      return eD;
      
    }),console["log"]("LuckySpin: Snapshot saved ["+ez+']');
    
  },[a3,X,j]),dw=ez=>{
    var hu=fQ;
    bl({
      'title':"Restore Wheel?",'message':"Restore this wheel from "+ez["time"]+'\x20('+ez["playerCount"]+" players)? This will overwrite current game state.",'onConfirm':()=>{
        var hv=hu;
        n(ez["players"]),cR["current"]={
          ...ez["coinAccumulator"]
        },a8({
          ...ez["coinAccumulator"]
        }),cQ["current"]={
          ...ez["likeAccumulator"]
        },a6({
          ...ez["likeAccumulator"]
        }),cS["current"]=ez["sessionCoins"],aa(ez["sessionCoins"]),a4(ez["totalLikes"]),Y(ez["sessionTime"]),bH(![]),dB("coin",0x64),bl(null);
        
      }
    });
    
  };
  useEffect(()=>{
    !k&&!o&&!r&&!t&&!v&&!b7&&W(P*0x3c+R);
    
  },[P,R,o,r,t,v,b7,k]);
  var dx=(ez,eA)=>{
    var hw=fQ;
    if(k)return;
    try{
      if(window["parent"]&&window["parent"]!==window){
        window["parent"]["postMessage"]({
          'type':"BROADCAST_EVENT",'payload':{
            'type':ez,'data':eA
          }
        },'*');
      }
    }catch(err){}
    try{
      if(__lsBroadcastChannel){
        __lsBroadcastChannel["postMessage"]({'type':ez,'data':eA});
      }
    }catch(err){}
    var bodyStr=JSON["stringify"]({'boardId':OVERLAY_BOARD_ID,'type':ez,'data':eA});
    fetch(API_BASE+"/api/broadcast",{
      'method':"POST",
      'headers':{'Content-Type':"application/json"},
      'body':bodyStr
    })["catch"](()=>{});
  },dy=useRef(null),dz=useRef(0x0),dA=useRef(Date["now"]());
  useEffect(()=>{
    var hx=fQ;
    dy["current"]={
      'minBid':Z,'minutes':P,'seconds':R,'eliminationSeconds':T,'wheelBgColor':ad,'wheelBorderColor':af,'isProportional':ah,'isEliminationMode':al,'showEliminationAlert':an,'multiElimEnabled':ap,'multiElimCount':ar,'isMultipleMode':aX,'lockAfterSpin':aZ,'instantClaimEnabled':b1,'instantClaimAmount':b3,'wheelScale':bN,'spinDuration':bP,'showMinBidBox':a1,'timerEnabled':L,'autoSpin':N,'joinOnCoins':bq,'joinOnGiftId':bs,'joinOnFollow':bm,'joinOnLike':bo,'minLikes':bu,'showLogo':dr,'wheelTheme':dt,'isInverseMode':b5,'players':m,'timeLeft':V,'isRunning':o,'isPaused':r,'isSpinning':t,'winner':x,'showWinner':v,'hasSpun':b7,'totalLikes':a3,'likeAccumulator':cQ["current"],'coinAccumulator':cR["current"],'sessionCoins':cS["current"],'sessionTime':X,'lastUpdatedPlayer':F,'soundConfig':cu,'globalVolume':cK,'isMuted':aj,'allowOverlap':cI,'giftWidgetUrl':c3,'giftSize':c7,'giftPosition':c9,'presets':ch,'donationQueue':ab,'maxEntriesPerPlayer':bw,'maxTotalPlayers':by,'minParticipants':bA,'minParticipantsUnique':bC,'isSquareMode':bf,'winnerComments':z,'lastWinnerMessage':B,'sessionStats':aD,'winnerStats':aF,'vouchCount':aN,'showVouchBox':aP,'vouchKeywords':aR,'showWinnerStats':aH,'showSessionIndicators':aJ,'hudTheme':aL,'extraElim':av,'isMultiElimAnimating':ax,'multiElimRevealed':az
    };
    
  },[Z,P,R,T,ad,af,ah,al,an,ap,ar,aX,aZ,b1,b3,bN,bP,a1,L,N,bq,bs,bm,bo,bu,m,V,o,r,t,x,v,b7,dr,dt,b5,a3,cu,cK,aj,cI,X,F,c3,c7,c9,ch,ab,a9,bf,z,B,aD,aF,aN,aP,aR,aH,aJ,aL,av,ax,az]),useEffect(()=>{
    var hz=fQ;
    if(k)return;
    var ez=()=>{
      var hy=h;
      if(!dy["current"])return;
      var eB=dy["current"];
      dx("LUCKYSPIN_GAME_SETTINGS",{
        'minBid':eB["minBid"],'minutes':eB["minutes"],'seconds':eB["seconds"],'eliminationSeconds':eB["eliminationSeconds"],'wheelBgColor':eB["wheelBgColor"],'wheelBorderColor':eB["wheelBorderColor"],'isProportional':eB["isProportional"],'isEliminationMode':eB["isEliminationMode"],'showEliminationAlert':eB["showEliminationAlert"],'multiElimEnabled':eB["multiElimEnabled"],'multiElimCount':eB["multiElimCount"],'isMultipleMode':eB["isMultipleMode"],'joinOnCoins':eB["joinOnCoins"],'joinOnGiftId':eB["joinOnGiftId"],'joinOnFollow':eB["joinOnFollow"],'joinOnLike':eB["joinOnLike"],'minLikes':eB["minLikes"],'lockAfterSpin':eB["lockAfterSpin"],'instantClaimEnabled':eB["instantClaimEnabled"],'instantClaimAmount':eB["instantClaimAmount"],'wheelScale':eB["wheelScale"],'spinDuration':eB["spinDuration"],'showMinBidBox':eB["showMinBidBox"],'timerEnabled':eB["timerEnabled"],'autoSpin':eB["autoSpin"],'showLogo':eB["showLogo"],'wheelTheme':eB["wheelTheme"],'isInverseMode':eB["isInverseMode"],'giftWidgetUrl':eB["giftWidgetUrl"],'giftSize':eB["giftSize"],'giftPosition':eB["giftPosition"],'maxEntriesPerPlayer':eB["maxEntriesPerPlayer"],'maxTotalPlayers':eB["maxTotalPlayers"],'minParticipants':eB["minParticipants"],'minParticipantsUnique':eB["minParticipantsUnique"],'isSquareMode':eB["isSquareMode"],'vouchKeywords':eB["vouchKeywords"],'showVouchBox':eB["showVouchBox"],'showWinnerStats':eB["showWinnerStats"],'showSessionIndicators':eB["showSessionIndicators"],'hudTheme':eB["hudTheme"]
      }),dx("LUCKYSPIN_FULL_STATE",{
        'players':eB["players"],'timeLeft':eB["timeLeft"],'isRunning':eB["isRunning"],'isPaused':eB["isPaused"],'isSpinning':eB["isSpinning"],'winner':eB["winner"],'showWinner':eB["showWinner"],'hasSpun':eB["hasSpun"],'totalLikes':eB["totalLikes"],'likeAccumulator':eB["likeAccumulator"],'coinAccumulator':eB["coinAccumulator"],'sessionCoins':eB["sessionCoins"],'lastUpdatedPlayer':eB["lastUpdatedPlayer"],'donationQueue':eB["donationQueue"],'sessionTime':eB["sessionTime"],'isProportional':eB["isProportional"],'isInverseMode':eB["isInverseMode"],'isEliminationMode':eB["isEliminationMode"],'showEliminationAlert':eB["showEliminationAlert"],'multiElimEnabled':eB["multiElimEnabled"],'multiElimCount':eB["multiElimCount"],'isMultipleMode':eB["isMultipleMode"],'timerEnabled':eB["timerEnabled"],'minParticipants':eB["minParticipants"],'minParticipantsUnique':eB["minParticipantsUnique"],'winnerComments':eB["winnerComments"],'lastWinnerMessage':eB["lastWinnerMessage"],'sessionStats':eB["sessionStats"],'winnerStats':eB["winnerStats"],'vouchCount':eB["vouchCount"],'showVouchBox':eB["showVouchBox"],'showWinnerStats':eB["showWinnerStats"],'showSessionIndicators':eB["showSessionIndicators"],'extraElim':eB["extraElim"],'isMultiElimAnimating':eB["isMultiElimAnimating"],'multiElimRevealed':eB["multiElimRevealed"],'timestamp':Date["now"]()
      });
      
    };
    dX["current"]=ez;
    var eA=setInterval(ez,0x3e8);
    return ez(),()=>{
      var hA=hz;
      clearInterval(eA),dX["current"]=null;
      
    };
    
  },[k,m["length"]]),useEffect(()=>{
    if(k)return;
    var ez=setInterval(()=>{
      var hB=h;
      if(!dy["current"])return;
      var eA=dy["current"];
      dx("LUCKYSPIN_FAST_SYNC",{
        'timeLeft':eA["timeLeft"],'isRunning':eA["isRunning"],'isPaused':eA["isPaused"],'isSpinning':eA["isSpinning"],'sessionTime':eA["sessionTime"],'timestamp':Date["now"]()
      });
      
    },0x1f4);
    return()=>clearInterval(ez);
    
  },[k]),useEffect(()=>{
    var hC=fQ;
    if(k||!dX["current"])return;
    dX["current"]();
    
  },[ah,b5,al,an,aX,aZ,b1,b3,bN,bP,a1,L,N,bq,bs,bm,bo,bu,dt,dr,ad,af,bw,by,bA,bC,bf,Z,P,R,T,x,v,z,B,k,aN,aP,aH,aJ,aL]),useEffect(()=>{
    var hE=fQ,ez=eA=>{
      var hD=h;
      if(eA["data"]?.["type"]==="SET_VOLUME"){
        cL(eA["data"]["volume"]);
        if(eA["data"]["volume"]===0x0)ak(!![]);
        else ak(![]);
        
      }eA["data"]?.["type"]==="SET_AUDIO_DEVICE"&&localStorage["setItem"]("hc_audio_device",eA["data"]["deviceId"]);
      
    };
    return window["addEventListener"]("message",ez),()=>window["removeEventListener"]("message",ez);
    
  },[]),useEffect(()=>{
    var hF=fQ;
    cP["current"]["forEach"](ez=>{
      var hG=hF;
      if(ez)ez["volume"]=0.6*cK;
      
    });
    if(cN["current"])cN["current"]["volume"]=0.4*cK;
    
  },[cK]);
  var dB=(ez,eA=0x0)=>{
    var hH=fQ;
    var eB=dy["current"];
    if(!eB)return;
    if(eB["isMuted"]||eB["globalVolume"]===0x0)return;
    if(ez==="coin"){
      var nowCoinTs=Date["now"]();
      if(nowCoinTs-__lsLastCoinSoundTs<0x78)return;
      __lsLastCoinSoundTs=nowCoinTs;
    }else if(!eB["allowOverlap"]&&ez!=="spin"){
      if(cN["current"])cN["current"]["pause"]();
      cP["current"]["forEach"](eH=>{
        var hI=hH;
        if(eH)eH["pause"]();
      }),cP["current"]=[];
    }var eC=eB["soundConfig"]["filter"](eH=>eH["active"]&&eH["type"]===ez&&eA>=(eH["min"]||0x0));
    if(eC["length"]===0x0)return;
    var eD=Math["max"](...eC["map"](eH=>eH["min"]||0x0));
    eC=eC["filter"](eH=>(eH["min"]||0x0)===eD);
    var eE=eC[Math["floor"](Math["random"]()*eC["length"])];
    if(ez==="spin"){
      if(cN["current"])cN["current"]["pause"]();
      cN["current"]=new Audio(eE["url"]),cN["current"]["volume"]=0.4*eB["globalVolume"],cN["current"]["loop"]=!![];
      var eF=localStorage["getItem"]("hc_audio_device")||"default";
      cN["current"]["setSinkId"]&&eF!=="default"&&cN["current"]["setSinkId"](eF)["catch"](eH=>console["log"]("sink id error:",eH)),cN["current"]["play"]()["catch"](eH=>console["log"]("Spin audio error:",eH));
      
    }else{
      var eG=new Audio(eE["url"]);
      eG["volume"]=0.6*eB["globalVolume"];
      var eF=localStorage["getItem"]("hc_audio_device")||"default";
      eG["setSinkId"]&&eF!=="default"&&eG["setSinkId"](eF)["catch"](eH=>console["log"]("sink id error:",eH)),cP["current"]["push"](eG),eG["onended"]=()=>{
        var hJ=hH;
        cP["current"]=cP["current"]["filter"](eH=>eH!==eG);
        
      },eG["play"]()["catch"](eH=>{console["log"]("Audio play failed:",eH);__playSynthFallback(ez,eB["globalVolume"]);});
      
    }
  },dC=()=>{
    var hK=fQ;
    cN["current"]&&(cN["current"]["pause"](),cN["current"]["currentTime"]=0x0);
    
  },dD=()=>{
    var hL=fQ;
    cN["current"]&&(cN["current"]["pause"](),cN["current"]["currentTime"]=0x0),cP["current"]["forEach"](ez=>{
      var hM=hL;
      ez&&(ez["pause"](),ez["currentTime"]=0x0);
      
    }),cP["current"]=[];
    
  },dE=ez=>{
    var hN=fQ;
    cv(eA=>eA["map"](eB=>eB['id']===ez?{
      ...eB,'active':!eB["active"]
    }:eB));
    
  },dF=(ez,eA)=>{
    var hO=fQ;
    ez["preventDefault"](),ez["stopPropagation"](),cv(eB=>eB["filter"](eC=>eC['id']!==eA));
    
  },dG=ez=>{
    var eA=ez["target"]["files"]&&ez["target"]["files"][0x0];
    if(eA){
      var sName=eA["name"]["replace"](/\.[^/.]+$/,'');
      cz(sName),cD(eA["name"]);
      if(eA["path"])cB(eA["path"]);
      var eC=new FileReader();
      eC["onload"]=eD=>{
        var dataUrl=eD["target"]["result"];
        cB(dataUrl);
        try{
          fetch(API_BASE+"/api/upload-sound",{'method':"POST",'headers':{'Content-Type':"application/json"},'body':JSON["stringify"]({'name':sName,'data':dataUrl})})["then"](r=>r["json"]())["then"](res=>{if(res&&res["url"])cB(res["url"]);})["catch"](()=>{});
        }catch(err){}
      };
      eC["readAsDataURL"](eA);
    }
  },dH=()=>{
    var hR=fQ;
    if(!cy||!cA)return;
    var ez={
      'id':"custom_"+Date["now"](),'name':cy,'url':cA,'type':cE,'min':parseInt(cG)||0x0,'active':!![],'isCustom':!![]
    };
    cv(eA=>[...eA,ez]),cz(''),cB(''),cD(''),cH(0x0);
    
  },dI=ez=>{
    var hS=fQ;
    cO["current"]&&(cO["current"]["pause"](),cO["current"]["currentTime"]=0x0);
    var eA=new Audio(ez);
    eA["volume"]=cK;
    var eB=localStorage["getItem"]("hc_audio_device")||"default";
    eA["setSinkId"]&&eB!=="default"&&eA["setSinkId"](eB)["catch"](eC=>console["log"]("sink id error:",eC)),cO["current"]=eA,eA["play"]()["catch"](eC=>{
      var hT=hS;
      console["error"]("Audio playback error:",eC),ct({
        'message':"Could not play sound. Check format.",'type':"error"
      });
      
    });
    
  },dJ=()=>{
    var hU=fQ;
    cO["current"]&&(cO["current"]["pause"](),cO["current"]["currentTime"]=0x0),cx(![]);
    
  },dK=useRef(new Set());
  useEffect(()=>{
    var hW=fQ,ez=eA=>{
      var hV=h;
      if(eA["data"]?.["type"]==="AUTO_OPTIMIZE_CLEANUP"){
        if(typeof bF==="function")bF(f4=>f4&&f4["length"]>0x64?f4["slice"](-0x64):f4);
        console["log"]("🛠️ LuckySpin: Safe Background Cleanup (Winners history pruned)");
        return;
        
      }if(eA["data"]?.["type"]==="SPIN_DATA"){
        if(!o&&!r&&!v)return;
        var eB=eA["data"]["data"];
        if(eB["eventId"]){
          if(dK["current"]["has"](eB["eventId"]))return;
          dK["current"]["add"](eB["eventId"]),setTimeout(()=>dK["current"]["delete"](eB["eventId"]),0x1388);
        }
        var {
          coins:eC,userName:eD,pictureProfil:eE,userId:eF,usernameId:eG,repeatCount:repCount,totalRepeatCount:totRepCount,unitDiamonds:uDia,isStreakEnd:isEnd,giftId:gId
        }=eB,eH=eF||eG||eD;
        var feedId=eB["eventId"]||(Date["now"]()+'_'+Math["random"]());
        var coinsNum=Number(eC||0x0);
        var repeatNum=Number(totRepCount||repCount||0x1);
        var unitDiaNum=Number(uDia||0x1);
        var totalCoinsExpected=Math["max"](coinsNum,repeatNum*unitDiaNum);
        setLiveGifts(prev=>[{
          'id':feedId,
          'userName':eD||eH,
          'pictureProfil':eE,
          'coins':coinsNum,
          'totalCoins':totalCoinsExpected,
          'registeredCoins':coinsNum,
          'giftName':eB["giftName"]||"Gift",
          'giftPictureUrl':eB["giftPictureUrl"]||'',
          'repeatCount':repeatNum,
          'time':new Date()["toLocaleTimeString"]()
        },...prev]["slice"](0x0,0xf));

        var stKey=String(eH)+"_"+String(gId||0x0);
        var tracker=streakTrackerRef["current"]["get"](stKey);
        if(!tracker||(Date["now"]()-tracker["ts"]>0x3a98)){
          tracker={'recorded':0x0,'ts':Date["now"]()};
          streakTrackerRef["current"]["set"](stKey,tracker);
        }

        // Fast batch addition
        if(coinsNum>0x0&&cX["current"]){
          var amtToAdd=cY["current"]?(eB["giftId"]&&String(eB["giftId"])==="7934"?d2["current"]:coinsNum):coinsNum;
          if(dp["current"])dp["current"](eH,eD,amtToAdd,eE,![],![],![]);
          tracker["recorded"]+=coinsNum;
          tracker["ts"]=Date["now"]();
        }

        // Streak completion verification & reconciliation
        if(isEnd&&repeatNum>0x0&&unitDiaNum>0x0){
          var expectedStreakCoins=repeatNum*unitDiaNum;
          var diffCoins=expectedStreakCoins-tracker["recorded"];
          if(diffCoins>0x0&&cX["current"]){
            if(dp["current"])dp["current"](eH,eD,diffCoins,eE,![],![],![]);
            tracker["recorded"]=expectedStreakCoins;
          }else if(diffCoins<0x0){
            var excess=Math["abs"](diffCoins);
            cR["current"][eH]=Math["max"](0x0,(cR["current"][eH]||0x0)-excess);
            n(prev=>prev["map"](p=>(p["userId"]===eH||p["name"]===eD)?{...p,'coins':Math["max"](0x1,p["coins"]-excess)}:p));
            tracker["recorded"]=expectedStreakCoins;
          }
          streakTrackerRef["current"]["delete"](stKey);
        }
      }if(eA["data"]?.["type"]==="LIKE_DATA"){
        if(o||r||v){
          var {
            likes:eI,roomLikes:eJ,userName:eD,userId:eF,pictureProfil:eE
          }=eA["data"]["data"],eK=typeof eJ==="number"?eJ:eI;
          if(eK>0x0)a4(f4=>f4+eK);
          if(d0["current"]){
            var eH=eF||eD,eL=cQ["current"][eH]||0x0,eM=eL+eI;
            cQ["current"][eH]=eM,a6(f4=>({
              ...f4,[eH]:eM
            }));
            var eN=Math["max"](0x1,d1["current"]),eO=Math["floor"](eL/eN),eP=Math["floor"](eM/eN),eQ=eP-eO;
            if(eQ>0x0){
              var eR=eQ*d2["current"];
              dp["current"](eH,eD,eR,eE,![],!![]);
              
            }
          }
        }
      }if(eA["data"]?.["type"]==="EVENT_DATA"){
        if((o||r||v)&&(cZ["current"]||bm)){
          var {
            type:eS,nickname:eT,uniqueId:eH,userId:eF,profilePictureUrl:eU
          }=eA["data"]["data"];
          if(eS==="follow"){
            var eV=eF||eH||eT;
            enqueueSpinEntry(eV,eT||eH,d2["current"]||Z,eU);
          }
        }
      }if(eA["data"]?.["type"]==="CHAT_DATA"){
        var {
          comment:eW,userId:eF,nickname:eT,profilePictureUrl:eU
        }=eA["data"]["data"];
        fetch(API_BASE+"/luckyspin-chat?userId="+eF+"&userName="+encodeURIComponent(eT)+"&comment="+encodeURIComponent(eW)+"&noecho=1")["catch"](()=>{
          
        });
        eW&&E(f4=>[...f4["slice"](-0x5),{
          'id':Date["now"](),'text':eW,'name':eT,'pic':eU
        }]);
        if(eW&&!k){
          var eX=String(eW)["toLowerCase"](),eY=dj["current"]||["vouch","legit"];
          if(eY["some"](f4=>eX["includes"](String(f4)["toLowerCase"]()))){
            var eZ=dh["current"],f0=Object["keys"](eZ)["find"](f4=>eZ[f4]>0x0&&(f4===eF||di["current"][f4]===eT));
            if(f0){
              var f1={
                ...eZ
              };
              f1[f0]-=0x1;
              if(f1[f0]<=0x0)delete f1[f0];
              dh["current"]=f1,aO(f4=>f4+0x1);
              
            }
          }
        }if(d5["current"]&&d8["current"]){
          var f2=d8["current"],f3=f2["userId"]&&f2["userId"]===eF||f2["name"]&&f2["name"]===eT;
          f3&&(A(f4=>[...f4["slice"](-0x4),eW]),C({
            'text':eW,'name':eT,'pic':eU,'ts':Date["now"]()
          }));
          
        }
      }eA["data"]?.["type"]==="TIKTOK_VIEWERS"&&bL(eA["data"]["data"]["count"]||0x0);
      
    };
    return window["addEventListener"]("message",ez),()=>window["removeEventListener"]("message",ez);
    
  },[o,r,t,v,x,Z,cu,al,aX,cI,dq,aZ,b7,bm,bq,bs]),useEffect(()=>{
    var hY=fQ;
    if(k){
      var hY=fQ,hZ=fQ,hX=h,i0=null,i1=null;
      var handleOverlayEvent=eC=>{
        if(!eC||!eC["type"])return;
        dA["current"]=Date["now"]();
        if(eC["type"]==="GLOBAL_VOLUME"){
          if(eC["data"]&&eC["data"]["volume"]!==undefined)window["postMessage"]({
            'type':"SET_VOLUME",'volume':eC["data"]["volume"]
          },'*');
          return;
          
        }dA["current"]=Date["now"]();
        if(eC["type"]==="LUCKYSPIN_GAME_SETTINGS"){
          var eD=eC["data"];
          if(eD["minBid"]!==undefined)a0(eD["minBid"]);
          if(eD["timeLeft"]!==undefined){
            var eE=d9["current"],eF=Math["abs"](eD["timeLeft"]-eE);
            (eF>0x2||!d3["current"]||d4["current"])&&W(eD["timeLeft"]);
            
          }if(eD["minutes"]!==undefined)Q(eD["minutes"]);
          if(eD["seconds"]!==undefined)S(eD["seconds"]);
          if(eD["eliminationSeconds"]!==undefined)U(eD["eliminationSeconds"]);
          if(eD["wheelBgColor"]!==undefined)ae(eD["wheelBgColor"]);
          if(eD["wheelBorderColor"]!==undefined)ag(eD["wheelBorderColor"]);
          if(eD["isProportional"]!==undefined)ai(eD["isProportional"]);
          if(eD["isEliminationMode"]!==undefined)am(eD["isEliminationMode"]);
          if(eD["showEliminationAlert"]!==undefined)ao(eD["showEliminationAlert"]);
          if(eD["multiElimEnabled"]!==undefined)aq(eD["multiElimEnabled"]);
          if(eD["multiElimCount"]!==undefined)as(eD["multiElimCount"]);
          if(eD["vouchKeywords"]!==undefined)aS(eD["vouchKeywords"]);
          if(eD["showVouchBox"]!==undefined)aQ(eD["showVouchBox"]);
          if(eD["showWinnerStats"]!==undefined)aI(eD["showWinnerStats"]);
          if(eD["showSessionIndicators"]!==undefined)aK(eD["showSessionIndicators"]);
          if(eD["extraElim"]!==undefined)aw(eD["extraElim"]||[]);
          if(eD["isMultiElimAnimating"]!==undefined)ay(eD["isMultiElimAnimating"]);
          if(eD["multiElimRevealed"]!==undefined)aA(eD["multiElimRevealed"]||[]);
          if(eD["hudTheme"]!==undefined)aM(eD["hudTheme"]);
          if(eD["isMultipleMode"]!==undefined)aY(eD["isMultipleMode"]);
          if(eD["lockAfterSpin"]!==undefined)b0(eD["lockAfterSpin"]);
          if(eD["instantClaimEnabled"]!==undefined)b2(eD["instantClaimEnabled"]);
          if(eD["instantClaimAmount"]!==undefined)b4(eD["instantClaimAmount"]);
          if(eD["wheelScale"]!==undefined)bO(eD["wheelScale"]);
          if(eD["spinDuration"]!==undefined)bQ(eD["spinDuration"]);
          if(eD["showMinBidBox"]!==undefined)a2(eD["showMinBidBox"]);
          if(eD["timerEnabled"]!==undefined)M(eD["timerEnabled"]);
          if(eD["minParticipants"]!==undefined)bB(eD["minParticipants"]);
          if(eD["minParticipantsUnique"]!==undefined)bD(eD["minParticipantsUnique"]);
          if(eD["autoSpin"]!==undefined)O(eD["autoSpin"]);
          if(eD["joinOnCoins"]!==undefined)br(eD["joinOnCoins"]);
          if(eD["joinOnGiftId"]!==undefined)bt(eD["joinOnGiftId"]);
          if(eD["joinOnFollow"]!==undefined)bn(eD["joinOnFollow"]);
          if(eD["joinOnLike"]!==undefined)bp(eD["joinOnLike"]);
          if(eD["minLikes"]!==undefined)bv(eD["minLikes"]);
          if(eD["wheelTheme"]!==undefined)du(eD["wheelTheme"]);
          if(eD["showLogo"]!==undefined)ds(eD["showLogo"]);
          if(eD["isInverseMode"]!==undefined)b6(eD["isInverseMode"]);
          if(eD["giftWidgetUrl"]!==undefined)c4(eD["giftWidgetUrl"]);
          if(eD["giftSize"]!==undefined)c8(eD["giftSize"]);
          if(eD["giftPosition"]!==undefined)ca(eD["giftPosition"]);
          if(eD["maxEntriesPerPlayer"]!==undefined)bx(eD["maxEntriesPerPlayer"]);
          if(eD["maxTotalPlayers"]!==undefined)bz(eD["maxTotalPlayers"]);
          if(eD["isSquareMode"]!==undefined)bg(eD["isSquareMode"]);
          
        }eC["type"]==="TIKTOK_VIEWERS"&&bL(eC["data"]["count"]||0x0);
        if(eC["type"]==="WIDGET_STATE"){
          if(eC["data"]["donators"]){
            
          }return;
          
        }if(eC["type"]==="RELOAD_PAGE"){
          window["location"]["reload"]();
          return;
          
        }if(eC["type"]==="LUCKYSPIN_FULL_STATE"){
          var eD=eC["data"];
          if(eD["timestamp"]&&eD["timestamp"]<=dz["current"])return;
          if(eD["timestamp"])dz["current"]=eD["timestamp"];
          eD["players"]!==undefined&&n(eJ=>{
            var i0=null;
            if(eJ["length"]===eD["players"]["length"]){
              if(eJ["length"]===0x0)return eJ;
              if(eJ[eJ["length"]-0x1]['id']===eD["players"][eD["players"]["length"]-0x1]['id']){
                var eK=0x0,eL=0x0;
                for(var eM=0x0;
                eM<eJ["length"];
                eM++){
                  eK+=Number(eJ[eM]["coins"])||0x0,eL+=Number(eD["players"][eM]["coins"])||0x0;
                  
                }if(eK===eL)return eJ;
                
              }
            }return eD["players"];
            
          });
          if(typeof eD["timeLeft"]==="number"){
            var eE=d9["current"],eF=Math["abs"](eD["timeLeft"]-eE);
            (k||eF>0x1||!d3["current"]||d4["current"])&&W(eD["timeLeft"]);
            
          }if(eD["sessionTime"]!==undefined)Y(eD["sessionTime"]);
          if(eD["isRunning"]!==undefined)q(eD["isRunning"]);
          if(eD["isPaused"]!==undefined)s(eD["isPaused"]);
          if(eD["isSpinning"]!==undefined&&(!d6["current"]||eD["isSpinning"]))u(eD["isSpinning"]);
          if(!d6["current"]&&eD["winner"]!==undefined)y(eD["winner"]);
          if(!d6["current"]&&eD["showWinner"]!==undefined)w(eD["showWinner"]);
          if(eD["hasSpun"]!==undefined)b8(eD["hasSpun"]);
          if(eD["totalLikes"]!==undefined)a4(eD["totalLikes"]);
          if(eD["likeAccumulator"])a6(eD["likeAccumulator"]);
          if(eD["coinAccumulator"])a8(eD["coinAccumulator"]);
          if(eD["sessionCoins"]!==undefined)aa(eD["sessionCoins"]);
          if(eD["lastUpdatedPlayer"]!==undefined)G(eD["lastUpdatedPlayer"]);
          if(eD["donationQueue"]!==undefined)ac(eD["donationQueue"]);
          if(eD["isProportional"]!==undefined)ai(eD["isProportional"]);
          if(eD["isInverseMode"]!==undefined)b6(eD["isInverseMode"]);
          if(eD["isEliminationMode"]!==undefined)am(eD["isEliminationMode"]);
          if(eD["showEliminationAlert"]!==undefined)ao(eD["showEliminationAlert"]);
          if(eD["multiElimEnabled"]!==undefined)aq(eD["multiElimEnabled"]);
          if(eD["multiElimCount"]!==undefined)as(eD["multiElimCount"]);
          if(eD["isMultipleMode"]!==undefined)aY(eD["isMultipleMode"]);
          if(eD["timerEnabled"]!==undefined)M(eD["timerEnabled"]);
          if(eD["minParticipants"]!==undefined)bB(eD["minParticipants"]);
          if(eD["minParticipantsUnique"]!==undefined)bD(eD["minParticipantsUnique"]);
          if(eD["winnerComments"]!==undefined)A(eD["winnerComments"]);
          if(eD["lastWinnerMessage"]!==undefined)C(eD["lastWinnerMessage"]);
          if(eD["sessionStats"]!==undefined)aE(eD["sessionStats"]);
          if(eD["winnerStats"]!==undefined)aG(eD["winnerStats"]);
          if(eD["vouchCount"]!==undefined)aO(eD["vouchCount"]);
          if(eD["showVouchBox"]!==undefined)aQ(eD["showVouchBox"]);
          if(eD["showWinnerStats"]!==undefined)aI(eD["showWinnerStats"]);
          if(eD["showSessionIndicators"]!==undefined)aK(eD["showSessionIndicators"]);
          
        }if(eC["type"]==="LUCKYSPIN_FAST_SYNC"){
          var eD=eC["data"];
          if(eD["timestamp"]&&eD["timestamp"]<=__lsFastSyncTs)return;
          if(eD["timestamp"])__lsFastSyncTs=eD["timestamp"];
          if(typeof eD["timeLeft"]==="number"){
            var eE=d9["current"],eF=Math["abs"](eD["timeLeft"]-eE);
            if(k||eF>0.5)W(eD["timeLeft"]);
            
          }if(eD["isRunning"]!==undefined)q(eD["isRunning"]);
          if(eD["isPaused"]!==undefined)s(eD["isPaused"]);
          if(eD["isSpinning"]!==undefined&&(!d6["current"]||eD["isSpinning"]))u(eD["isSpinning"]);
          if(eD["sessionTime"]!==undefined)Y(eD["sessionTime"]);
          
        }if(eC["type"]==="LUCKYSPIN_GAME_CONTROL"&&eC["data"]){
          var ctrlKey=eC["data"]["ctrlId"]||(eC["data"]["action"]+'_'+(eC["data"]["ts"]||eC["data"]["targetRotation"]||''));
          if(ctrlKey&&__lsSeenCtrlIds["has"](ctrlKey))return;
          if(ctrlKey){
            __lsSeenCtrlIds["add"](ctrlKey);
            if(__lsSeenCtrlIds["size"]>0xc8){
              var firstKey=__lsSeenCtrlIds["values"]()["next"]()["value"];
              __lsSeenCtrlIds["delete"](firstKey);
            }
          }
          var {
            action:eG,time:eH,targetRotation:eI
          }=eC["data"];
          if(eG==="spin"&&Array["isArray"](eC["data"]["slices"])&&eC["data"]["slices"]["length"]>0x0){
            cU["current"]=eC["data"]["slices"];
            n(eC["data"]["slices"]);
          }
          eG==="start"&&(eH&&(Q(eH["minutes"]),S(eH["seconds"])),dT()),eG==="pause"&&s(!![]),eG==="resume"&&s(![]),eG==="reset"&&dV(),eG==="close_winner"&&dW(),eG==="spin"&&(dk["current"]&&dk["current"](eI,eC["data"]["isElim"],eC["data"]["winnerId"],eC["data"]["winnerUserId"],eC["data"]["winnerName"],eC["data"]["winnerObj"],eC["data"]["slices"],eC["data"]["extraElim"])),eG==="queue_processed"&&(ct(eC["data"]["count"]+" PLAYER"+(eC["data"]["count"]>0x1?'S':'')+" JOINED FROM QUEUE!"),setTimeout(()=>ct(null),0xbb8));
        }
      };
      var localEs=null,cloudEs=null;
      try{
        var primaryUrl=API_BASE+"/api/luckyspin/"+OVERLAY_BOARD_ID+"/events?t="+Date["now"]();
        localEs=new EventSource(primaryUrl);
        localEs["onmessage"]=ev=>{
          try{ handleOverlayEvent(JSON["parse"](ev["data"])); }catch(e){}
        };
        localEs["onerror"]=()=>{
          if(!cloudEs){
            try{
              cloudEs=new EventSource(API_BASE+"/events?t="+Date["now"]());
              cloudEs["onmessage"]=ev=>{
                try{ handleOverlayEvent(JSON["parse"](ev["data"])); }catch(e){}
              };
            }catch(e){}
          }
        };
      }catch(e){}
      var onBcMsg=ev=>{
        try{ if(ev&&ev["data"])handleOverlayEvent(ev["data"]); }catch(e){}
      };
      try{
        if(__lsBroadcastChannel)__lsBroadcastChannel["addEventListener"]("message",onBcMsg);
      }catch(e){}
      var socketClient=null;
      try{
        if(typeof io!=="undefined"){
          socketClient=io();
          socketClient["on"]("luckyspin_update",msg=>{
            try{
              if(msg&&msg["type"]&&(!msg["board_id"]||msg["board_id"]===OVERLAY_BOARD_ID)){
                handleOverlayEvent(msg);
              }
            }catch(e){}
          });
          socketClient["on"]("connect",()=>{
            pollState();
          });
        }
      }catch(e){}
      var pollState=async()=>{
        try{
          var r=await fetch(API_BASE+"/api/luckyspin/"+OVERLAY_BOARD_ID+"/state?t="+Date["now"]());
          var d=await r["json"]();
          if(!d||!d["fullState"]){
            r=await fetch(API_BASE+"/api/state?t="+Date["now"]());
            d=await r["json"]();
          }
          if(d&&d["success"]){
            dA["current"]=Date["now"]();
            if(d["settings"])handleOverlayEvent({'type':"LUCKYSPIN_GAME_SETTINGS",'data':d["settings"]});
            if(d["fullState"])handleOverlayEvent({'type':"LUCKYSPIN_FULL_STATE",'data':d["fullState"]});
            if(d["fastSync"])handleOverlayEvent({'type':"LUCKYSPIN_FAST_SYNC",'data':d["fastSync"]});
            if(Array["isArray"](d["controlLog"])){
              var nowTs=Date["now"]();
              d["controlLog"]["forEach"](c=>{
                if(c&&c["data"]&&(!c["ts"]||nowTs-c["ts"]<0x2710)){
                  handleOverlayEvent({'type':"LUCKYSPIN_GAME_CONTROL",'data':c["data"]});
                }
              });
            }
          }
        }catch(e){}
      };
      pollState();
      var pollTimer=setInterval(pollState,350);
      return ()=>{
        clearInterval(pollTimer);
        if(localEs)localEs["close"]();
        if(cloudEs)cloudEs["close"]();
        if(socketClient)try{socketClient["disconnect"]();}catch(e){}
        try{ if(__lsBroadcastChannel)__lsBroadcastChannel["removeEventListener"]("message",onBcMsg); }catch(e){}
      };
      
    }
  },[k]);
  var dL=(ez,eA={
    
  })=>{
    var i2=fQ;
    var ctrlId=Date["now"]()+'_'+Math["random"]()["toString"](0x24)["slice"](0x2,0x8);
    dx("LUCKYSPIN_GAME_CONTROL",{
      'action':ez,'ctrlId':ctrlId,'ts':Date["now"](),...eA
    });
    
  },dM=(ez,eA,eB,eC,eD=![],eE=![],eF=![])=>{
    var i3=fQ,eG=parseInt(eB||0x0);
    if(isNaN(eG)||eG<0x1)return;
    var eH=(cf&&cf["cost"]&&!isNaN(Number(cf["cost"]))&&Number(cf["cost"])>0)?Number(cf["cost"]):Number(d2["current"]||Z||0x1);
    if(aZ&&(b7||t||o)){
      console["log"]("LuckySpin: Entry BLOCKED for "+eA+" because entries are locked after spin (Lock Entries).");
      return;
    }
    if(!eD&&!eF&&eG<eH)return;var eI=cU["current"]||[];
    if(by>0x0){
      var eJ=new Set(eI["map"](eX=>eX["userId"]||eX["name"]))["size"],eK=eI["some"](eX=>eX["userId"]&&eX["userId"]===ez||eX["name"]&&eX["name"]===eA);
      if(!eK&&eJ>=by){
        console["log"]("LuckySpin: Entry BLOCKED for "+eA+" - Max players limit ("+by+") reached.");
        return;
        
      }
    }if(bw>0x0){
      var eL=eI["filter"](eX=>eX["userId"]&&eX["userId"]===ez||eX["name"]&&eX["name"]===eA)["length"];
      if(eL>=bw){
        console["log"]("LuckySpin: Entry BLOCKED for "+eA+" - Personal slot limit ("+bw+") reached.");
        return;
        
      }
    }if(al&&!eD){
      var eM=cU["current"]||[],eN=new Set(eM["map"](eX=>eX["userId"]||eX["name"]));
      if(eN["size"]===0x2&&eM["length"]===0x2&&(t||v||d5["current"]||o&&!r&&V<=0x0)){
        console["log"]("LuckySpin: Blocked entry during ULTIMATE 1v1 final duel.");
        return;
        
      }
    }if(b1&&eG>=b3&&!eD){
      dv("Instant Claim: "+eA);
      var eO=cR["current"][ez]||0x0,eP=eO+eG;
      cR["current"][ez]=eP,a8(eX=>({
        ...eX,[ez]:eP
      })),cS["current"]+=eG,aa(cS["current"]);
      window["LuckySpinSessionStats"]&&(window["LuckySpinSessionStats"]["recordEntry"](dg["current"],ez,eA,eG,0x1),dl());
      d5["current"]=!![];
      var eQ=eC&&eC["trim"]()!==''?eC:null,eR={
        'id':Date["now"]()+Math["random"](),'userId':ez,'name':eA,'coins':eG,'pic':eQ,'color':dq[m["length"]%dq["length"]]||"#1f2937",'isElimination':![],'isInstantClaim':!![]
      };
      dD(),dn(),ay(![]),aC(null),aA([]),aw([]),de["current"]=[];
      if(cM["current"]){
        var eS=window["getComputedStyle"](cM["current"]),eT=eS["transform"];
        cM["current"]["style"]["transition"]="none",cM["current"]["style"]["transform"]=eT;
        
      }dB("win"),hcSoundEvent("instant_claim",{
        'name':eA,'coins':eG
      }),dm(eR),y(eR),w(!![]),q(![]),d7["current"]=![],u(![]),b8(!![]),W(0x0),ac([]),n(eX=>[...eX["filter"](eY=>eY["userId"]!==ez),{
        'id':"sniper-"+ez+'-'+Date["now"](),'userId':ez,'name':eA,'coins':eG,'pic':eQ,'color':dq[eX["length"]%dq["length"]],'sortKey':Math["random"]()
      }]);
      return;
      
    }if(!eD&&(t||v||d5["current"]||o&&!r&&V<=0x0)){
      ac(eX=>[...eX,{
        'uniqueId':ez,'userName':eA,'coins':eG,'pictureProfil':eC
      }]);
      return;
      
    }var eO=cR["current"][ez]||0x0,eP=eO+eG;
    cR["current"][ez]=eP,a8(eX=>({
      ...eX,[ez]:eP
    })),cS["current"]+=eG,aa(cS["current"]);
    if(window["LuckySpinSessionStats"]){
      var eU=window["LuckySpinSessionStats"],eV;
      if(aX)eV=Math["max"](0x0,Math["floor"](eP/eH)-Math["floor"](eO/eH));
      else{
        var eW=dg["current"]["players"][eU["keyOf"](ez,eA)];
        eV=eW&&eW["entries"]>0x0?0x0:0x1;
        
      }eU["recordEntry"](dg["current"],ez,eA,eG,eV),dl();
      
    }if(d5["current"]&&!eD)return;
    dB("coin",eG);
    if(!eF)hcSoundEvent("gift",{
      'name':eA,'coins':eG
    });
    G(eA),setTimeout(()=>G(null),0x3e8),n(eX=>{
      var i4=i3,eY=eC&&eC["trim"]()!==''?eC:null;
      if(aX){
        var eZ=Math["floor"](eO/eH),f0=Math["floor"](eP/eH),f1=f0-eZ;
        if(f1<0x1&&eF)f1=0x1;
        if(f1<0x1)return eX;
        var f3=[];
        var maxSlots=Math["min"](f1,0x186a0);
        for(var f4=0x0;f4<maxSlots;f4++){
          f3["push"]({
            'id':"ticket-"+ez+'-'+Date["now"]()+'-'+f4+'-'+Math["random"]()["toString"](0x24)["substr"](0x2,0x9),
            'userId':ez,'name':eA,'coins':eH,'pic':eY,'color':dq[(eX["length"]+f4)%dq["length"]],'sortKey':Math["random"](),'joinedViaLike':eE
          });
        }
        return[...eX,...f3];
        
      }else{
        var f5=eX["findIndex"](f7=>f7["userId"]===ez);
        if(f5>=0x0){
          var f6=[...eX];
          f6[f5]["coins"]=eP,f6[f5]["name"]=eA;
          if(eY)f6[f5]["pic"]=eY;
          if(eE)f6[f5]["joinedViaLike"]=!![];
          return f6;
          
        }else return[...eX,{
          'id':"player-"+ez+'-'+Date["now"](),'userId':ez,'name':eA,'coins':eP,'pic':eY,'color':dq[eX["length"]%dq["length"]],'sortKey':Math["random"](),'joinedViaLike':eE
        }];
        
      }
    });
    
      setTimeout(()=>{if(!k&&dX["current"])dX["current"]();},0x14);
  },enqueueSpinEntry=(ez,eA,eB,eC,eD=![],eE=![],eF=![],feedId=null)=>{
    var totalCoins=parseInt(eB||0x0);
    if(isNaN(totalCoins)||totalCoins<0x1)return;
    if(dp["current"]){
      dp["current"](ez,eA,totalCoins,eC,eD,eE,eF);
      if(feedId){
        setLiveGifts(prev=>prev["map"](g=>g['id']===feedId?{...g,'registeredCoins':totalCoins,'coins':totalCoins}:g));
      }
    }
  },adjustTimerBySeconds=deltaSec=>{
    var baseSec=(o||r)?Number(d9["current"]??V??0x0):(Number(P||0x0)*0x3c+Number(R||0x0));
    var nextSec=Math["max"](0x0,baseSec+deltaSec);
    var nextMin=Math["floor"](nextSec/0x3c);
    var nextRemSec=nextSec%0x3c;
    Q(nextMin),S(nextRemSec),W(nextSec);
    d9["current"]=nextSec;
    dx("LUCKYSPIN_FAST_SYNC",{
      'timeLeft':nextSec,'isRunning':o,'isPaused':r,'isSpinning':t,'sessionTime':X,'timestamp':Date["now"]()
    });
    setTimeout(()=>{if(!k&&dX["current"])dX["current"]();},0x14);
  },dN=()=>{
    var i5=fQ;
    if(aZ&&(b7||t||o)){
      console.log("LuckySpin: Manual entry blocked - entries locked after first spin.");
      return;
    }
    if(!H["trim"]()||t)return;
    var ez=H["trim"]();
    var activeCost=(function(){
      if(cf&&cf["cost"]&&!isNaN(Number(cf["cost"]))&&Number(cf["cost"])>0)return Number(cf["cost"]);
      var mb=Number(d2["current"]||Z||1);
      return (isNaN(mb)||mb<1)?1:mb;
    })();
    var rawCoins=parseInt(J);
    var enteredCoins=(!isNaN(rawCoins)&&rawCoins>0)?rawCoins:activeCost;
    var slotsToAdd=Math["max"](1,Math["floor"](enteredCoins/activeCost));

    var newTickets=[];
    var maxSlots=Math["min"](slotsToAdd,0x186a0);
    for(var f4=0;f4<maxSlots;f4++){
      newTickets["push"]({
        'id':"ticket-"+ez+'-'+Date["now"]()+'-'+f4+'-'+Math["random"]()["toString"](0x24)["substr"](0x2,0x9),
        'userId':ez,
        'name':ez,
        'coins':activeCost,
        'pic':null,
        'color':dq[((cU["current"]||[])["length"]+f4)%dq["length"]],
        'sortKey':Math["random"](),
        'joinedViaLike':![]
      });
    }
    n(eX=>[...eX,...newTickets]);

    var prevCoins=cR["current"][ez]||0;
    var nextCoins=prevCoins+enteredCoins;
    cR["current"][ez]=nextCoins;
    a8(eX=>({...eX,[ez]:nextCoins}));
    cS["current"]+=enteredCoins;
    aa(cS["current"]);

    dB("coin",enteredCoins);
    dx("LUCKYSPIN_SPIN_DATA",{
      'coins':enteredCoins,
      'userName':ez,
      'userId':ez,
      'pictureProfil':null
    });
    setTimeout(()=>{if(!k&&dX["current"])dX["current"]();},0x14);
    I('');
    K('');
  },handleTikTokConnect=async()=>{
    if(ttStatus==="connected"||ttStatus==="connecting"){
      try{ await fetch(API_BASE+"/api/disconnect",{'method':"POST"}); }catch(e){}
      setTtStatus("disconnected"),setTtError(null),bJ(![]);
      return;
    }
    var cleanUser=String(ttUsername||'')["trim"]()["replace"](/^@+/,'');
    if(!cleanUser){
      setTtStatus("error"),setTtError("أدخل يوزر تيك توك أولاً");
      return;
    }
    if(!j)localStorage["setItem"]("ls_tiktok_username",cleanUser);
    setTtStatus("connecting"),setTtConnectedUser(cleanUser),setTtError(null);
    try{
      var resp=await fetch(API_BASE+"/api/connect",{
        'method':"POST",
        'headers':{'Content-Type':"application/json"},
        'body':JSON["stringify"]({'username':cleanUser})
      });
      var resData=await resp["json"]();
      if(resData&&resData["ok"]&&resData["status"]==="connected"){
        setTtStatus("connected"),setTtConnectedUser(resData["username"]||cleanUser),setTtError(null),bJ(!![]);
        ct("🟢 متصل بلايف @"+cleanUser),setTimeout(()=>ct(null),0xbb8);
        return;
      }else{
        var st=resData&&resData["status"]==="offline"?"offline":"error";
        var errMsg=resData&&resData["error"]||(st==="offline"?"الحساب غير فاتح لايف حالياً":"تعذر الاتصال");
        setTtStatus(st),setTtError(errMsg),bJ(![]);
        ct(st==="offline"?"🔴 الحساب @"+cleanUser+" قافل لايف حالياً":"⚠️ "+errMsg),setTimeout(()=>ct(null),0xdac);
        return;
      }
    }catch(err){
      setTtStatus("error"),setTtError("شغل السيرفر (start-mezo.bat) أولاً"),bJ(![]);
      ct("⚠️ شغل السيرفر أولاً"),setTimeout(()=>ct(null),0xdac);
    }
  },getOverlayUrl=(mode="cloud")=>{
    try{
      if(mode==="local"){
        return "http://localhost:2137/overlay.html?uid=default";
      }
      if(mode==="cloud"||mode==="short"){
        return "https://gifts-overlay11.onrender.com/luckyspin-overlay.html?uid=default";
      }
      if(mode==="full"){
        return "https://gifts-overlay11.onrender.com/games/luckyspin/index.html?stream=true&scale=1.15&cid=mz_6e60223656d3863d21bb918dc1dc";
      }
      return "http://localhost:2137/overlay.html?uid=default";
    }catch(e){}
    return "http://localhost:2137/overlay.html?uid=default";
  },copyOverlayUrl=(mode="cloud")=>{
    var url=getOverlayUrl(mode);
    if(navigator["clipboard"]&&navigator["clipboard"]["writeText"]){
      navigator["clipboard"]["writeText"](url)["catch"](()=>{});
    }else{
      var ta=document["createElement"]("textarea");
      ta["value"]=url,document["body"]["appendChild"](ta),ta["select"](),document["execCommand"]("copy"),document["body"]["removeChild"](ta);
    }
    setOverlayCopied(mode);
    ct(mode==="local"?"✓ تم نسخ الرابط المحلي!":mode==="full"?"✓ تم نسخ الرابط الكامل!":"✓ تم نسخ رابط الأوفرلاي السحابي!");
    setTimeout(()=>{
      setOverlayCopied(null);
      ct(null);
    },0x9c4);
  },dO=ez=>{
    var i6=fQ;
    if(t)return;
    var eA=m["find"](eD=>eD['id']===ez);
    if(!eA)return;
    dB("elimination");
    var eB=eA["userId"],eC=eA["name"];
    n(eD=>{
      var i7=i6,eE=eD["filter"](eG=>eG['id']!==ez),eF=eE["some"](eG=>eB&&eG["userId"]===eB||eC&&eG["name"]===eC);
      return!eF&&eB&&(cR["current"][eB]=0x0,a8(eG=>({
        ...eG,[eB]:0x0
      })),cQ["current"][eB]=0x0,a6(eG=>({
        ...eG,[eB]:0x0
      }))),eE;
      
    });
    
  },dP=useMemo(()=>m["reduce"]((ez,eA)=>ez+eA["coins"],0x0),[m]),dQ=a9,dR=useMemo(()=>{
    var i8=fQ;
    if(m["length"]===0x0)return[];
    var ez=0x0,eA=[...m]["sort"]((eC,eD)=>(eC["sortKey"]||0x0)-(eD["sortKey"]||0x0)),eB=0x0;
    var totalWeight=m["reduce"]((acc,x)=>acc+(Number(x["tickets"])||0x1),0x0)||0x1;
    return ah&&b5&&(eB=m["reduce"]((eC,eD)=>eC+0x1/Math["max"](0x1,eD["coins"]),0x0)),eA["map"]((eC,eD)=>{
      var i9=i8,eE;
      ah?b5?eE=0x1/Math["max"](0x1,eC["coins"])/eB:eE=eC["coins"]/dP:eE=(Number(eC["tickets"])||0x1)/totalWeight;
      var eF=eE*0x168,eG=eC["color"];
      if(dt==="gold_luxury"){
        var eH=["#FFD700","#FFC800","#FFB900","#DAA520","#B8860B","#CFB53B"];
        eG=eH[eD%eH["length"]];
        
      }var eI={
        ...eC,'color':eG,'startAngle':ez,'endAngle':ez+eF,'degrees':eF,'percent':(eE*0x64)["toFixed"](0x1)
      };
      return ez+=eF,eI;
      
    });
    
  },[m,dP,ah,b5,dt]);
  useEffect(()=>{
    var ia=fQ;
    cT["current"]=dR;
    
  },[dR]);
  var dS=useMemo(()=>{
    var ib=fQ;
    return[...dR]["sort"]((ez,eA)=>eA["coins"]-ez["coins"]);
    
  },[dR]);
  useEffect(()=>{
    var ez=null;
    return(o||t||v)&&(ez=setInterval(()=>{
      Y(eA=>eA+0x1);
      
    },0x3e8)),()=>clearInterval(ez);
    
  },[o,t,v]),useEffect(()=>{
    var ic=fQ,ez=null;
    if(!k&&o&&!r&&(L||al)){
      var eA=bC?new Set(m["map"](eB=>eB["userId"]||eB["name"]))["size"]:m["length"];
      if(!b7&&eA<bA)return()=>{
        if(ez)clearInterval(ez);
        
      };
      ez=setInterval(()=>{
        W(eB=>{
          if(eB<=0x1){
            
            if(!k)setTimeout(()=>dk["current"]&&dk["current"](),0x0);
            return 0x0;
          }
          return eB-0x1;
        });
      },0x3e8);
      
    }return()=>{
      if(ez)clearInterval(ez);
      
    };
    
  },[o,r,L,al,k,m,bA,bC,b7]),useEffect(()=>{
    var id=fQ,ez=bC?new Set(m["map"](eA=>eA["userId"]||eA["name"]))["size"]:m["length"];
    /* Security trigger handled by interval */
    
  },[V,o,t,v,b7,L,al,k,m,bA,bC]);
  var dT=()=>{
    var ie=fQ;
    if(!o&&!r){
      var ez=P*0x3c+R;
      W(ez>0x0?ez:0x3c),y(null),w(![]),d5["current"]=![],A([]),C(null),d7["current"]=![],u(![]),dC(),b8(![]),Y(0x0),a4(0x0),cR["current"]={
        
      },cQ["current"]={
        
      },cS["current"]=0x0,aa(0x0),cM["current"]&&(cM["current"]["style"]["transition"]="none",cM["current"]["style"]["transform"]="rotate(0deg)");
      
    }q(!![]),s(![]),dL("start",{
      'time':{
        'minutes':P,'seconds':R
      }
    });
    
  },dU=()=>{
    var ig=fQ;
    s(!r),dL(!r?"pause":"resume");
    
  },dV=()=>{
    var ih=fQ;
    m["length"]>0x0&&dv("Hard Reset Backup");
    if(o&&!r)s(!![]),dL("pause");
    else{
      q(![]),s(![]),d7["current"]=![],u(![]),w(![]),d5["current"]=![],dn(),ay(![]),aC(null),aA([]),aw([]),de["current"]=[];
      window["LuckySpinSessionStats"]&&(dg["current"]=window["LuckySpinSessionStats"]["emptyLedger"](),dl());
      dh["current"]={
        
      },di["current"]={
        
      },aG(null),n([]),y(null),A([]),C(null),b8(![]),cQ["current"]={
        
      },cR["current"]={
        
      },cS["current"]=0x0,aa(0x0),a4(0x0),Y(0x0);
      var ez=P*0x3c+R;
      W(ez>0x0?ez:0x3c),dC(),dL("reset");
      
    }
  },dW=()=>{
    var ii=fQ,ez=al,eA=d8["current"]||x,eB=de["current"]&&de["current"]["length"]>0x0?de["current"]:av||[];
    de["current"]=[],dn(),ay(![]),aC(null),aw([]),aA([]);
    if(!k)dL("close_winner");
    if(!eA){
      w(![]),d5["current"]=![],y(null);
      return;
      
    }console["log"]("LuckySpin: Processing winner/elimination for "+eA["name"]+" (ID: "+eA['id']+')'),dv("Result: "+eA["name"]),w(![]),d5["current"]=![],y(null);
    if(eA["userId"]&&cR["current"]){
      cR["current"][eA["userId"]]=Math["max"](0x0,(cR["current"][eA["userId"]]||0x0)-(eA["coins"]||0x1));
      a8(eS=>({...eS,[eA["userId"]]:cR["current"][eA["userId"]]}));
    }
    var eC=cU["current"]||[],eD=eA["userId"],eE=eA["name"],eF;
    if(!ez||eA["isInstantClaim"])console["log"]("LuckySpin: Mode reset/instant - Clearing all players."),eF=[],cR["current"]={
      
    },a8({
      
    }),cQ["current"]={
      
    },a6({
      
    }),a4(0x0),Y(0x0),b8(![]),dL("reset");
    else{
      eF=eC["filter"](eS=>eS['id']!==eA['id']);
      if(eF["length"]===eC["length"]&&eC["length"]>0x0){
        console["warn"]("LuckySpin: Removal failed for ID "+eA['id']+". Falling back to removing first matching entry.");
        var eG=![];
        eF=eC["filter"](eS=>{
          var ik=ii;
          if(!eG&&(eD&&eS["userId"]===eD||eE&&eS["name"]===eE))return eG=!![],![];
          return!![];
          
        });
        
      }var eH=eF["some"](eS=>eD&&eS["userId"]===eD||eE&&eS["name"]===eE);
      !eH&&eD&&(cR["current"][eD]=0x0,a8(eS=>({
        ...eS,[eD]:0x0
      })),cQ["current"][eD]=0x0,a6(eS=>({
        ...eS,[eD]:0x0
      })));
      if(eB["length"]>0x0){
        var eI=new Set(eB["map"](eS=>eS['id']));
        eF=eF["filter"](eS=>!eI["has"](eS['id']));
        var eJ=new Set(eF["map"](eS=>eS["userId"]||eS["name"])),eK=eB["map"](eS=>eS["userId"])["filter"](eS=>eS&&!eJ["has"](eS));
        eK["length"]>0x0&&(eK["forEach"](eS=>{
          var il=ii;
          cR["current"][eS]=0x0,cQ["current"][eS]=0x0;
          
        }),a8(eS=>{
          var im=ii,eT={
            ...eS
          };
          return eK["forEach"](eU=>{
            eT[eU]=0x0;
            
          }),eT;
          
        }),a6(eS=>{
          var io=ii,eT={
            ...eS
          };
          return eK["forEach"](eU=>{
            eT[eU]=0x0;
            
          }),eT;
          
        }));
        
      }
    }cU["current"]=eF,n(eF);
    var eL=new Set(eF["map"](eS=>eS["userId"]||eS["name"]))["size"];
    if(ez&&eL===0x1&&eF["length"]>0x0){
      var eM=eF[0x0];
      dm(eM),y({
        ...eM,'isElimination':![]
      }),w(!![]),d5["current"]=!![],q(![]),dB("win");
      
    }else{
      var eO=Boolean(N);
      if(eO&&eF["length"]>0x0){
        var nextSec=(typeof T==="number"&&!isNaN(T)&&T>=0)?T:0x14;
        W(nextSec);
        d9["current"]=nextSec;
        if(!k){
          dx("LUCKYSPIN_GAME_CONTROL",{'action':"set_timer",'seconds':nextSec});
          dx("LUCKYSPIN_FULL_STATE",{
            'players':eF,'winner':null,'showWinner':![],'isRunning':!![],'isPaused':![],'isSpinning':![],'timeLeft':nextSec,'timestamp':Date["now"]()
          });
        }
        setTimeout(()=>{
          q(!![]);
        },0x32);
      }else{
        q(![]);
        s(![]);
        u(![]);
        var eR=P*0x3c+R;
        var finalSec=eR>0x0?eR:0x3c;
        W(finalSec);
        d9["current"]=finalSec;
        if(!k){
          dx("LUCKYSPIN_GAME_CONTROL",{'action':"pause"});
          dx("LUCKYSPIN_FULL_STATE",{
            'players':eF,'winner':null,'showWinner':![],'isRunning':![],'isPaused':![],'isSpinning':![],'timeLeft':finalSec,'timestamp':Date["now"]()
          });
        }
      }
    }ac(eS=>{
      var ip=ii;
      return eS["length"]>0x0&&setTimeout(()=>{
        var iq=ip,eT=0x0;
        eS["forEach"](eU=>{
          var ir=iq;
          dp["current"](eU["uniqueId"],eU["userName"],eU["coins"],eU["pictureProfil"],!![]),eT++;
          
        });
        if(eT>0x0){
          ct(eT+" PLAYER"+(eT>0x1?'S':'')+" JOINED!"),setTimeout(()=>ct(null),0xbb8),dB("coin");
          if(!k)dL("queue_processed",{
            'count':eT
          });
          
        }
      },0x15e),[];
      
    });
    
  },dX=useRef(null),[dY,dZ]=useState([]);
  useEffect(()=>{
    !t&&dZ(dR);
    
  },[dR,t]);
  var e0=(ez=null,eA=null,eB=null,eC=null,eD=null,eE=null,eF=null,eG=null)=>{
    var is=fQ;
    if(ez&&typeof ez==="object")ez=null;
    ez!==null&&(ez=parseFloat(ez));
    if(ez!==null&&isNaN(ez))ez=null;
    if(ez===null&&(d6["current"]||d7["current"]))return;
    if(ez===null)d7["current"]=!![];
    if((cU["current"]||[])["length"]===0x0&&(!eF||eF["length"]===0x0)){
      console["log"]("No players on wheel. Spin aborted."),d7["current"]=![];
      return;
      
    }d5["current"]&&(console["log"]("LuckySpin: Auto-closing previous winner to start next spin."),dW());
    q(!![]),s(![]),b8(!![]),W(0x0);
    var eH=[...cU["current"]||[]],eI=[];
    if(eH["length"]>0x0){
      var eJ=[...eH]["sort"]((fe,ff)=>(fe["sortKey"]||0x0)-(ff["sortKey"]||0x0)),eK=eJ["reduce"]((fe,ff)=>fe+ff["coins"],0x0),eL=da["current"],eM=db["current"],eN=eL&&eM?eJ["reduce"]((fe,ff)=>fe+0x1/Math["max"](0x1,ff["coins"]),0x0):0x0,eO=0x0;
      var totalWeight=eJ["reduce"]((acc,x)=>acc+(Number(x["tickets"])||0x1),0x0)||0x1;
      eI=eJ["map"](fe=>{
        var it=is,ff;
        eL?ff=eM?0x1/Math["max"](0x1,fe["coins"])/eN:fe["coins"]/Math["max"](0x1,eK):ff=(Number(fe["tickets"])||0x1)/totalWeight;
        var fg=ff*0x168,fh={
          ...fe,'startAngle':eO,'endAngle':eO+fg,'degrees':fg
        };
        return eO+=fg,fh;
        
      });
      
    }if(ez!==null){
      if(eF&&eF["length"]>0x0)eI=eF;
      else eI["length"]===0x0&&(eI=cT["current"]["length"]>0x0?cT["current"]:dR||[]);
      
    }dZ(eI);
    if(k&&eI["length"]===0x0&&(cU["current"]||[])["length"]===0x0){
      console["log"]("LuckySpin (Stream): Waiting for players sync before spinning..."),setTimeout(()=>{
        e0(ez,eA,eB,eC,eD,eE,eF,eG);
        
      },0x12c);
      return;
      
    }!k&&dv("Spin Started");
    var eP=cW["current"]||bP||0x4;
    if(eI["length"]===0x0){
      console["log"]("LuckySpin: Spin aborted - No players on wheel."),d7["current"]=![];
      if(!k&&(L||al)){
        var eQ=P*0x3c+R;
        W(eQ>0x0?eQ:0x3c),q(!![]);
        
      }else q(![]);
      return;
      
    }!k&&window["LuckySpinSessionStats"]&&(window["LuckySpinSessionStats"]["recordSpin"](dg["current"]),dl());
    u(!![]),dZ(eI),dB("spin");
    var eR,eS,eT=[];
    if(ez!==null){
      eR=ez;
      var eU=0xa*0x168,eV=0x168-(eR-eU),eW=(eV%0x168+0x168)%0x168,eX;
      if(eE)eX=eE;
      else{
        if(eB||eC||eD){
          eX=eI["find"](fe=>eB&&fe['id']===eB);
          if(!eX)eX=eI["find"](fe=>eC&&fe["userId"]===eC);
          if(!eX)eX=eI["find"](fe=>eD&&fe["name"]===eD);
          !eX&&(eX=eI["find"](fe=>eW>=fe["startAngle"]&&eW<fe["endAngle"])||eI[0x0]);
          
        }else eX=eI["find"](fe=>eW>=fe["startAngle"]&&eW<fe["endAngle"])||eI[0x0];
        
      }eS={
        ...eX,'isElimination':eA!==null?eA:![]
      },eT=Array["isArray"](eG)?eG:[];
      
    }else{
      var eY=Math["random"]()*0x168,eX=eI["find"](fe=>eY>=fe["startAngle"]&&eY<fe["endAngle"])||eI[0x0],eZ=new Set(eI["map"](fe=>fe["userId"]||fe["name"]))["size"],f0=al&&eZ>0x1;
      eS={
        ...eX,'isElimination':f0
      };
      if(f0&&window["LuckySpinMultiElim"]){
        var f1=window["LuckySpinMultiElim"],f2=f1["resolveCount"](eI["length"],dc["current"],dd["current"]);
        eT=f1["pickExtras"](eI,eS,f2);
        
      }var eU=0xa*0x168;
      eR=eU+(0x168-eY);
      if(dX["current"])dX["current"]();
      dL("spin",{
        'targetRotation':eR,'isElim':f0,'winnerId':eS['id'],'winnerUserId':eS["userId"],'winnerName':eS["name"],'winnerObj':eS,'slices':eI,'extraElim':eT
      });
      
    }var f3=fe=>{
      var iu=is;
      if(!d6["current"])return;
      dD();
      var ff=new Set(eI["map"](fm=>fm["userId"]||fm["name"]))["size"];
      dB(al&&ff>0x1?"elimination":"win");
      var fg=()=>{
        var iv=iu;
        ay(![]),aC(null),de["current"]=eT,aw(eT),aA(eT),dm(eS),y(eS),w(!![]),d7["current"]=![],u(![]),q(![]);
        if(fe)bi(-0x1);
        
      },fh=window["LuckySpinMultiElim"];
      if(!eT["length"]||!fh){
        fg();
        return;
        
      }q(![]);
      var fi=fh["animationPlan"](eT["length"]),fj=eI["filter"](fm=>(fm["userId"]||fm["name"])!==(eS["userId"]||eS["name"]));
      dn(),ay(!![]),aA([eS]);
      var fk=setInterval(()=>{
        var iw=iu;
        if(fj["length"]===0x0)return;
        var fm=fj[Math["floor"](Math["random"]()*fj["length"])];
        aC(fm['id']);
        if(fe){
          var fn=eI["findIndex"](fo=>fo['id']===fm['id']);
          if(fn>=0x0)bi(fn);
          
        }
      },fi["rollMs"]);
      df["current"]["push"](()=>clearInterval(fk)),eT["forEach"]((fm,fn)=>{
        var iy=iu,fo=setTimeout(()=>{
          var ix=h;
          aA(fq=>[...fq,fm]),aC(fm['id']);
          if(fe){
            var fp=eI["findIndex"](fq=>fq['id']===fm['id']);
            if(fp>=0x0)bi(fp);
          }
        },fi["step"]*(fn+0x1));
        df["current"]["push"](()=>clearTimeout(fo));
      });
      var fl=setTimeout(()=>{
        dn(),fg();
        
      },fi["total"]+0x96);
      df["current"]["push"](()=>clearTimeout(fl));
      
    };
    if(bf){
      var f4=eI["length"],f5=eP*0x3e8,f6=Date["now"](),f7=eI["findIndex"](fe=>fe['id']===eS['id']),f8=f4*0x5+f7,f9=Array["from"]({
        'length':f8
      },(fe,ff)=>{
        var iz=is;
        if(ff===f8-0x1)return f7;
        return Math["floor"](Math["random"]()*f4);
        
      }),fa=()=>{
        var iA=is,fe=Date["now"]()-f6;
        if(fe>=f5){
          bi(f7),fb();
          return;
          
        }var ff=fe/f5,fg=0x1-Math["pow"](0x1-ff,0x3),fh=Math["floor"](fg*f8);
        bi(f9[fh]??f7),requestAnimationFrame(fa);
        
      };
      requestAnimationFrame(fa);
      var fb=()=>{
        setTimeout(()=>f3(!![]),0x1f4);
        
      };
      
    }else{
      var fc=cM["current"]?parseFloat(cM["current"]["style"]["transform"]["replace"]("rotate(",'')["replace"]("deg)",''))||0x0:0x0,fd=fc%0x168;
      cM["current"]&&(cM["current"]["style"]["transition"]="none",cM["current"]["style"]["transform"]="rotate("+fd+"deg) translateZ(0)",cM["current"]["offsetHeight"]),setTimeout(()=>{
        var iB=is;
        cM["current"]&&(cM["current"]["style"]["transition"]="transform "+eP+"s cubic-bezier(0.15, 0, 0.15, 1)",cM["current"]["style"]["transform"]="rotate("+eR+"deg) translateZ(0)");
        
      },0x32),setTimeout(()=>f3(![]),eP*0x3e8+0x1f4);
      
    }
  };
  useEffect(()=>{
    var iC=fQ;
    dk["current"]=e0;
    
  }),useEffect(()=>{
    var iD=fQ;
    dp["current"]=dM;
    
  });
  var e1=ez=>{
    var iE=fQ,eA=Math["floor"](ez/0xe10),eB=Math["floor"](ez%0xe10/0x3c),eC=ez%0x3c;
    if(eA>0x0)return eA+':'+eB["toString"]()["padStart"](0x2,'0')+':'+eC["toString"]()["padStart"](0x2,'0');
    return eB+':'+eC["toString"]()["padStart"](0x2,'0');
    
  },[e2,e3]=useState(()=>typeof window!=="undefined"&&window["innerHeight"]>0x12c?window["innerHeight"]:0x300),[e4,e5]=useState(()=>typeof window!=="undefined"?window["innerWidth"]:0x320);
  useEffect(()=>{
    var iF=fQ;
    if(typeof window==="undefined")return;
    var ez=()=>{
      var iG=iF;
      e3(window["innerHeight"]>0x12c?window["innerHeight"]:0x300),e5(window["innerWidth"]>0x12c?window["innerWidth"]:0x320);
      
    };
    return window["addEventListener"]("resize",ez),()=>window["removeEventListener"]("resize",ez);
    
  },[]);
  var e6=useRef(null),e7=useRef(null),e8=k&&bf&&aJ&&(a1||c3)?c9==="top-right"?"right":c9==="top-left"||!c9?"left":null:null,[e9,ea]=useState(0x0),[eb,ec]=useState({
    'w':0x0,'h':0x0
  });
  useEffect(()=>{
    var iH=fQ,ez=e6["current"],eA=e7["current"];
    if(typeof ResizeObserver==="undefined")return;
    var eB=()=>{
      var iI=iH;
      ea(ez?ez["offsetHeight"]:0x0),ec(eA?{
        'w':eA["offsetWidth"],'h':eA["offsetHeight"]
      }:{
        'w':0x0,'h':0x0
      });
      
    };
    eB();
    var eC=new ResizeObserver(eB);
    if(ez)eC["observe"](ez);
    if(eA)eC["observe"](eA);
    return()=>eC["disconnect"]();
    
  },[k,L,al,an,aZ,b7,v,o,bA,aJ,aL]);
  var ed=0.9,ee=0x54,ef=bf?0x0:0x1a,eg=useMemo(()=>{
    var iJ=fQ;
    if(!k)return bN;
    var ez=(e9>0x0?e9:0x78)+eb['h'],eA=(e2-ez*ed-0xc)/(0x1a4+ee+ef);
    return Math["max"](0.5,Math["min"](bN,eA));
    
  },[k,bN,e2,e9,eb,ef]),eh=useMemo(()=>{
    var iK=fQ;
    if(!k)return{
      'shift':0x0,'stack':0x1,'hud':0x1
    };
    var ez=eg,eA=(e9>0x0?e9:0x0)+(eb['h']?0x4:0x0),eB=eb['h'],eC=(e2-0x1a4*ez)/0x2,eD=(eA+eB)*ed+0x6+ef*ez,eE=ee*ez,eF=Math["max"](0x0,Math["min"](eD-eC,eC-eE)),eG=eC+eF-0x6-ef*ez,eH=eb['w']>0x0?(0x1a4*ez-0x4)/eb['w']:Infinity,eI=eA+eB>0x0?eG/(eA+eB):0x1,eJ=eI;
    return eI>eH&&(eJ=eH,eI=eA>0x0?(eG-eJ*eB)/eA:0x1),eI=Math["max"](0.5,Math["min"](0x1,eI)),eJ=Math["max"](0.3,Math["min"](0x1,eJ,eH)),{
      'shift':eF,'stack':eI,'hud':eJ
    };
    
  },[k,eg,e2,e9,eb,ef]),ei=useRef(null),ej=useRef(null),ek=useRef(null),[el,em]=useState({
    'h':0x0,'board':0x0,'labels':0x0
  });
  useEffect(()=>{
    var iL=fQ;
    if(k||typeof ResizeObserver==="undefined")return;
    var ez=()=>{
      var iM=iL,eB=ei["current"],eC=ej["current"],eD=ek["current"],eE={
        'h':eB?eB["clientHeight"]:0x0,'board':eC?eC["offsetHeight"]:0x0,'labels':eD?eD["offsetHeight"]:0x0
      };
      em(eF=>eF['h']===eE['h']&&eF["board"]===eE["board"]&&eF["labels"]===eE["labels"]?eF:eE);
      
    };
    ez();
    var eA=new ResizeObserver(ez);
    return[ei["current"],ej["current"],ek["current"]]["forEach"](eB=>{
      var iN=iL;
      if(eB)eA["observe"](eB);
      
    }),()=>eA["disconnect"]();
    
  },[k,L,al,an,aZ,b7,v,o,aJ,aL]);
  var en=useMemo(()=>{
    var iO=fQ;
    if(k||!el['h']||!el["board"])return{
      'scale':bN,'shift':0x0
    };
    var ez=el["labels"]+(al&&an||aZ?0x8:0x38)+ef,eA=el["board"]+ez,eB=Math["max"](0.45,Math["min"](bN,(el['h']-0x18)/eA));
    return{
      'scale':eB,'shift':ez*eB/0x2
    };
    
  },[k,el,bN,al,an,aZ,ef]),eo=eh["shift"],ep=eh["stack"],eq=eh["hud"]/(eh["stack"]||0x1),er=new Set(m["map"](ez=>ez["userId"]||ez["name"]))["size"],es=useMemo(()=>{
    var iP=fQ;
    if(er!==0x2)return[];
    var ez=new Map();
    for(var eA of m){
      var eB=eA["userId"]||eA["name"];
      if(!ez["has"](eB))ez["set"](eB,eA);
      
    }return[...ez["values"]()];
    
  },[m,er]),et=useMemo(()=>m["reduce"]((ez,eA)=>ez+(Number(eA["coins"])||0x0),0x0),[m]),eu=useMemo(()=>{
    var iQ=fQ,ez=new Set();
    return av["filter"](eA=>{
      var iR=iQ,eB=eA["userId"]||eA["name"];
      if(!eB||ez["has"](eB))return![];
      return ez["add"](eB),!![];
      
    });
    
  },[av]),ev=v&&x&&typeof x["isElimination"]!=="undefined"?!x["isElimination"]:al?er<=0x1:!![],ew=ev?"WINNER":"ELIMINATED",ex=dt==="gold_luxury"?ev?"text-yellow-400 border-yellow-400 shadow-yellow-400/50":"text-red-500 border-red-500 shadow-red-500/50":ev?"text-yellow-500 border-yellow-500 shadow-yellow-500/50":"text-red-500 border-red-500 shadow-red-500/50",ey=dt==="gold_luxury"?["#FFD700","#FFC800","#FFB900","#DAA520","#FFF","#FDE68A"]:["#ef4444","#eab308","#3b82f6","#22c55e","#a855f7"];
  return useEffect(()=>{
    if(!v)return;
    if(ev){
      var winTimer=setTimeout(()=>{
        if(!k){
          w(![]);
          d5["current"]=![];
          y(null);
          cU["current"]=[];
          n([]);
          cR["current"]={};
          a8({});
          cQ["current"]={};
          a6({});
          q(![]);
          s(![]);
          u(![]);
          b8(![]);
          d7["current"]=![];
          var initSec=(P||0x0)*0x3c+(R||0x0);
          var finalSec=initSec>0x0?initSec:0x3c;
          W(finalSec);
          d9["current"]=finalSec;
          dL("reset");
          dx("LUCKYSPIN_GAME_CONTROL",{'action':"reset"});
          dx("LUCKYSPIN_FULL_STATE",{
            'players':[],'winner':null,'showWinner':![],'isRunning':![],'isPaused':![],'isSpinning':![],'timeLeft':finalSec,'timestamp':Date["now"]()
          });
        }else{
          w(![]);
          d5["current"]=![];
          y(null);
          cU["current"]=[];
          n([]);
          var initSec=(P||0x0)*0x3c+(R||0x0);
          W(initSec>0x0?initSec:0x3c);
        }
      },15000);
      return()=>clearTimeout(winTimer);
    }else{
      if(k)return;
      var elimTimer=setTimeout(()=>{
        var iS=h,eA=document["getElementById"]("btn-close-winner");
        if(eA)eA["click"]();
      },0x708);
      return()=>clearTimeout(elimTimer);
    }
  },[v,ev,k,P,R]),React["createElement"]("div",{
    'className':"h-screen overflow-hidden flex flex-col font-sans relative",'style':{
      'background':k?"transparent":"linear-gradient(135deg, #1e0b36 0%, #2e1065 50%, #3b0764 100%)"
    }
  },React["createElement"]("style",null,"\n                "+(k?"body, html, #root, #root > div { background: transparent !important; background-color: transparent !important; } .lsh-glint, .lsh-fx, .lsh-giftglint { display: none !important; animation: none !important; } .lsh-giftpic { animation: none !important; } .lsh-coins .lsh-ic { animation: none !important; } .lsh-ic { animation: none !important; } .lsh-chip { animation: none !important; } .lsh-bump { animation: none !important; }":"body, html, #root { background: #1e0b36; } .lsh-glint, .lsh-fx, .lsh-giftglint { display: none !important; animation: none !important; } .lsh-giftpic { animation: none !important; } .lsh-coins .lsh-ic { animation: none !important; } .lsh-ic { animation: none !important; } .lsh-chip { animation: none !important; } .lsh-bump { animation: none !important; }")+"\n                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');\n                body { font-family: 'Montserrat', sans-serif; overflow: hidden; -webkit-font-smoothing: antialiased; }\n                .super-outline { text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; }\n                @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }\n                .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }\n                @keyframes chatSlideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }\n                .chat-msg-enter { animation: chatSlideIn 0.3s ease-out forwards; }\n                .triangle-down { width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid white; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.5)); }\n                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');\n                @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }\n                .animate-pulse-btn { animation: pulse-btn 2s infinite; }\n                .highlight-anim { animation: highlightRow 0.5s ease-out; border: 1px solid #22c55e !important; }\n                .wheel-highlight-anim { animation: wheelFlash 0.5s ease-out; }\n                ::-webkit-scrollbar { width: 5px; } \n                ::-webkit-scrollbar-track { background: #1f2937; } \n                ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 5px; }\n\n                @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }\n                .animate-logo-float { animation: logoFloat 3s ease-in-out infinite; }\n                \n                @keyframes revealCenter { from { opacity: 0; transform: scale(0.8) translate(-50%, -50%); } to { opacity: 1; transform: scale(1) translate(-50%, -50%); } }\n                .animate-reveal { animation: revealCenter 0.3s ease-out forwards; }\n                .animate-spin-slow { animation: spin 20s linear infinite; }\n                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n                \n                @keyframes crownFloat { 0%, 100% { transform: translateY(0) rotate(-5deg); filter: drop-shadow(0 0 5px rgba(255,215,0,0.5)); } 50% { transform: translateY(-5px) rotate(5deg); filter: drop-shadow(0 0 15px rgba(255,215,0,0.8)); } }\n                .animate-crown-float { animation: crownFloat 2s ease-in-out infinite; }\n\n                @keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }\n                .confetti { position: absolute; width: 10px; height: 10px; top: -10px; animation: confettiFall 3s linear infinite; }\n\n                @keyframes bounce-slow {\n                    0%, 100% { transform: translateY(-8%); }\n                    50% { transform: translateY(0%); }\n                }\n                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }\n\n                /* ── Barre de stats (SessionHud) — base commune à tous les thèmes ── */\n                .lsh { display: flex; gap: 5px; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; }\n                .lsh-chip { position: relative; display: flex; align-items: center; gap: 5px; padding: 3px 10px 3px 3px; border-radius: 999px; white-space: nowrap;\n                    background: linear-gradient(180deg, rgba(30,41,59,.96), rgba(2,6,23,.96)); border: 2px solid var(--c);\n                    box-shadow: 0 6px 16px rgba(0,0,0,.5), 0 0 18px var(--g), inset 0 1px 0 rgba(255,255,255,.14);\n                    animation: lshIn .55s cubic-bezier(.2,1.5,.4,1) both; animation-delay: var(--d); }\n                .lsh-players { --c: #60a5fa; --l: #bfdbfe; --dd: #1e3a8a; --g: rgba(59,130,246,.35); }\n                .lsh-entries { --c: #34d399; --l: #a7f3d0; --dd: #065f46; --g: rgba(16,185,129,.3); }\n                .lsh-coins   { --c: #fbbf24; --l: #fde68a; --dd: #92400e; --g: rgba(245,158,11,.4); }\n                .lsh-vouch   { --c: #a78bfa; --l: #ddd6fe; --dd: #4c1d95; --g: rgba(139,92,246,.4); }\n                .lsh-gift    { --c: #f472b6; --l: #fbcfe8; --dd: #831843; --g: rgba(236,72,153,.4); padding-left: 4px; }\n                .lsh-glint, .lsh-fx { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }\n                .lsh-glint i { position: absolute; top: -20%; bottom: -20%; left: 0; width: 30%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);\n                    transform: translateX(-120%) skewX(-20deg); animation: lshGlint 4.8s ease-in-out infinite; animation-delay: calc(var(--d) * 3); }\n                .lsh-fx i { display: none; }\n                .lsh-ic { position: relative; width: 28px; height: 28px; flex: none; border-radius: 50%; display: grid; place-items: center; color: #fff;\n                    background: radial-gradient(circle at 35% 30%, var(--l), var(--c) 55%, var(--dd)); box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 0 10px var(--g); }\n                /* La pièce TikTok est déjà une pièce : pas de pastille derrière, elle tourne au temps fort (5 s). */\n                .lsh-coins .lsh-ic { background: none; box-shadow: none; padding: 1px; animation: lshCoinBeat 5s ease-in-out infinite; }\n                .lsh-coins .lsh-ic.lsh-flip { animation: lshFlip .8s cubic-bezier(.3,1.3,.5,1); }\n                .lsh-txt { position: relative; display: flex; flex-direction: column; line-height: 1; }\n                .lsh-num { font-weight: 900; font-size: 24px; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.7), 0 0 10px var(--g); }\n                .lsh-num b { display: inline-block; font-weight: 900; transform-origin: 50% 70%; }\n                .lsh-num small { font-size: 13px; font-weight: 900; color: rgba(255,255,255,.5); margin-left: 2px; }\n                .lsh-lab { font-weight: 900; font-size: 9px; letter-spacing: .06em; color: var(--l); margin-top: 3px; opacity: .9; }\n                .lsh-bump { animation: lshBump .6s cubic-bezier(.2,1.6,.4,1); }\n                .lsh-num.is-pulse { display: inline-block; animation: lshPop .6s cubic-bezier(.2,1.6,.4,1); }\n                .lsh-mini { width: 17px; height: 17px; display: inline-block; vertical-align: -2px; margin-right: 3px; }\n                /* Cadeau : deux petits sauts, puis un reflet limité à la case du cadeau. */\n                .lsh-giftpic { position: relative; width: 32px; height: 32px; flex: none; display: grid; place-items: center; animation: lshGiftHop 3.6s ease-in-out infinite; transform-origin: 50% 100%; }\n                .lsh-giftpic img { width: 32px; height: 32px; object-fit: contain; filter: drop-shadow(0 3px 4px rgba(0,0,0,.5)); }\n                .lsh-giftglint { position: absolute; inset: 0; overflow: hidden; border-radius: 10px; pointer-events: none; }\n                .lsh-giftglint i { position: absolute; top: -10%; bottom: -10%; width: 45%; left: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);\n                    transform: translateX(-130%) skewX(-18deg); animation: lshGiftGlint 3.6s ease-in-out infinite; }\n                @keyframes lshIn { from { opacity: 0; transform: translateY(10px) scale(.7); } to { opacity: 1; transform: none; } }\n                @keyframes lshBump { 0% { transform: scale(1); } 35% { transform: scale(1.4) translateY(-2px); } 100% { transform: scale(1); } }\n                @keyframes lshFlip { 0% { transform: rotateY(0); } 100% { transform: rotateY(360deg); } }\n                @keyframes lshCoinBeat { 0%, 62% { transform: rotateY(0); } 82%, 100% { transform: rotateY(360deg); } }\n                @keyframes lshPop { 0%,100% { transform: scale(1); } 40% { transform: scale(1.15); } }\n                @keyframes lshGlint { 0%, 55% { transform: translateX(-120%) skewX(-20deg); } 80%, 100% { transform: translateX(420%) skewX(-20deg); } }\n                @keyframes lshGiftHop { 0%, 40% { transform: none; } 45% { transform: scale(1.06, .92); } 50% { transform: translateY(-5px); } 55% { transform: scale(1.05, .94); }\n                    60% { transform: translateY(-3px); } 65%, 100% { transform: none; } }\n                @keyframes lshGiftGlint { 0%, 66% { transform: translateX(-130%) skewX(-18deg); } 88%, 100% { transform: translateX(260%) skewX(-18deg); } }\n\n                /* ── Thème SIMPLE : cases « libellé au-dessus, chiffre dessous », aucune animation ── */\n                .t-simple .lsh-chip { flex-direction: column; justify-content: center; gap: 1px; padding: 4px 12px; min-width: 64px;\n                    border-radius: 8px; border: 1px solid rgba(255,255,255,.18); background: rgba(10,10,14,.92); box-shadow: 0 3px 8px rgba(0,0,0,.45); animation: none; }\n                .t-simple .lsh-glint, .t-simple .lsh-fx, .t-simple .lsh-giftglint { display: none; }\n                .t-simple .lsh-chip:not(.lsh-gift) > .lsh-ic { display: none; }\n                .t-simple .lsh-txt { flex-direction: column-reverse; align-items: center; }\n                .t-simple .lsh-lab { margin: 0 0 2px; font-size: 9px; letter-spacing: .08em; color: rgba(255,255,255,.6); opacity: 1; }\n                .t-simple .lsh-num { font-size: 20px; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.8); }\n                .t-simple .lsh-bump, .t-simple .lsh-num.is-pulse, .t-simple .lsh-giftpic { animation: none; }\n                .t-simple .lsh-gift { flex-direction: row; gap: 6px; padding: 3px 10px 3px 6px; }\n                .t-simple .lsh-coins .lsh-num { color: #fde68a; }\n\n                /* ── Thème LA AGENCY : mise en page d'origine (icône + chiffre + texte), couleurs LA Agency ── */\n                .t-laagency .lsh-chip { --c: #3b82f6; --l: #93c5fd; --dd: #1d4ed8; --g: rgba(59,130,246,.35); border-radius: 12px;\n                    background: linear-gradient(180deg, #13213f, #0f172a); box-shadow: 0 6px 16px rgba(0,0,0,.5), 0 0 0 1px #1d4ed8, inset 0 1px 0 rgba(147,197,253,.25); }\n                .t-laagency .lsh-coins .lsh-num { color: #fde68a; }\n                .t-laagency .lsh-lab { color: #93c5fd; }\n\n                /* ── Thème ROYAL GOLD : plaques dorées, étincelles sur les icônes, chiffres qui roulent ── */\n                .t-royal .lsh-chip { border-radius: 10px; border-color: #fbbf24;\n                    background: linear-gradient(180deg, #4a3408 0%, #1c1204 55%, #0c0802 100%);\n                    box-shadow: 0 6px 16px rgba(0,0,0,.55), 0 0 16px rgba(251,191,36,.35), inset 0 1px 0 rgba(253,230,138,.5), inset 0 -2px 0 rgba(0,0,0,.4); }\n                .t-royal .lsh-ic { border-radius: 8px; box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 0 0 2px #fde68a; }\n                .t-royal .lsh-coins .lsh-ic { box-shadow: none; }\n                .t-royal .lsh-num { color: #fde68a; text-shadow: 0 2px 0 #78350f, 0 0 12px rgba(251,191,36,.45); }\n                .t-royal .lsh-lab { color: #fbbf24; }\n                .t-royal .lsh-bump { animation: lshRoll .55s cubic-bezier(.2,1.4,.4,1); }\n                .t-royal .lsh-glint i { width: 45%; background: linear-gradient(90deg, transparent, rgba(253,230,138,.45), transparent); animation-duration: 3.6s; }\n                .t-royal .lsh-fx { overflow: visible; }\n                .t-royal .lsh-fx i { display: block; position: absolute; top: -5px; left: 26px; width: 10px; height: 10px; background: #fff;\n                    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);\n                    opacity: 0; animation: lshTwinkle 2.8s ease-in-out infinite; animation-delay: calc(var(--d) * 5); }\n                .t-royal .lsh-fx i:nth-child(2) { top: auto; bottom: -4px; left: auto; right: 10px; width: 7px; height: 7px; animation-delay: calc(var(--d) * 5 + 1.1s); }\n                .t-royal .lsh-fx i:nth-child(3) { display: none; }\n                @keyframes lshRoll { 0% { transform: translateY(70%); opacity: 0; } 60% { transform: translateY(-8%); opacity: 1; } 100% { transform: none; } }\n                @keyframes lshTwinkle { 0%, 70%, 100% { opacity: 0; transform: scale(.2) rotate(0); } 80% { opacity: 1; transform: scale(1.2) rotate(45deg); } 90% { opacity: .6; transform: scale(.8) rotate(90deg); } }\n\n                /* ── Thème ARCADE : blocs pixel, ombre dure, balayage, chiffres qui tombent ── */\n                .t-arcade .lsh-chip { border-radius: 4px; border-width: 3px; background: #0b0b1a;\n                    box-shadow: 4px 4px 0 var(--dd), 0 0 0 1px rgba(0,0,0,.6); animation: lshIn .4s steps(4) both, lshStep 1.2s steps(2) infinite; animation-delay: var(--d), calc(var(--d) * 4); }\n                .t-arcade .lsh-ic { border-radius: 3px; background: var(--c); box-shadow: inset -3px -3px 0 var(--dd), inset 3px 3px 0 var(--l); }\n                .t-arcade .lsh-coins .lsh-ic { background: none; box-shadow: none; }\n                .t-arcade .lsh-num { color: var(--l); text-shadow: 2px 2px 0 var(--dd), 0 0 8px var(--g); letter-spacing: .02em; }\n                .t-arcade .lsh-lab { color: #fff; letter-spacing: .1em; }\n                .t-arcade .lsh-bump { animation: lshDrop .5s cubic-bezier(.3,1.6,.5,1); }\n                .t-arcade .lsh-glint i { display: none; }\n                .t-arcade .lsh-fx i:first-child { display: block; position: absolute; left: 0; right: 0; top: 0; height: 30%;\n                    background: linear-gradient(180deg, transparent, rgba(255,255,255,.18), transparent); transform: translateY(-100%); animation: lshScan 2.4s linear infinite; animation-delay: calc(var(--d) * 4); }\n                @keyframes lshStep { 0% { transform: translateY(0); } 100% { transform: translateY(-2px); } }\n                @keyframes lshDrop { 0% { transform: translateY(-120%); opacity: 0; } 55% { transform: translateY(8%); opacity: 1; } 75% { transform: translateY(-6%); } 100% { transform: none; } }\n                @keyframes lshScan { 0% { transform: translateY(-100%); } 100% { transform: translateY(340%); } }\n\n                /* ── Thème JELLY : bonbons brillants qui flottent, effet gelée ── */\n                .t-jelly .lsh-chip { border: 2px solid rgba(255,255,255,.75);\n                    background: linear-gradient(180deg, var(--l) -30%, var(--c) 55%, var(--dd) 130%);\n                    box-shadow: 0 6px 14px rgba(0,0,0,.4), inset 0 -4px 0 rgba(0,0,0,.18), 0 0 14px var(--g);\n                    animation: lshIn .55s cubic-bezier(.2,1.5,.4,1) both, lshFloat 3s ease-in-out infinite; animation-delay: var(--d), calc(var(--d) * 6); }\n                .t-jelly .lsh-glint { overflow: hidden; }\n                .t-jelly .lsh-glint i { top: 3px; bottom: auto; left: 12%; width: 76%; height: 36%; border-radius: 999px; background: rgba(255,255,255,.35);\n                    transform: none; animation: none; }\n                .t-jelly .lsh-ic { background: rgba(255,255,255,.28); box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }\n                .t-jelly .lsh-coins .lsh-ic { background: none; box-shadow: none; }\n                .t-jelly .lsh-num { color: #fff; text-shadow: 0 2px 0 var(--dd), 1px 0 0 var(--dd), -1px 0 0 var(--dd); }\n                .t-jelly .lsh-lab { color: #fff; }\n                .t-jelly .lsh-bump { animation: lshJelly .7s cubic-bezier(.3,1.6,.5,1); }\n                @keyframes lshFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }\n                @keyframes lshJelly { 0% { transform: scale(1); } 25% { transform: scale(1.35, .7); } 50% { transform: scale(.85, 1.2); } 75% { transform: scale(1.08, .94); } 100% { transform: scale(1); } }\n\n                /* ── Thème INFERNO : braises qui montent, chiffres qui flambent ── */\n                .t-ember .lsh-chip { border-radius: 8px 8px 16px 16px; border-color: #f97316;\n                    background: linear-gradient(180deg, #3b0d05 0%, #1a0603 60%, #0a0201 100%);\n                    box-shadow: 0 6px 16px rgba(0,0,0,.55), 0 4px 18px rgba(249,115,22,.45), inset 0 -3px 0 rgba(234,88,12,.5); }\n                .t-ember .lsh-ic { background: radial-gradient(circle at 50% 70%, #fde047, #f97316 50%, #7c2d12); }\n                .t-ember .lsh-coins .lsh-ic { background: none; }\n                .t-ember .lsh-num { color: #fed7aa; text-shadow: 0 2px 0 #7c2d12, 0 0 12px rgba(249,115,22,.7); }\n                .t-ember .lsh-lab { color: #fb923c; }\n                .t-ember .lsh-bump { animation: lshFlare .6s ease-out; }\n                .t-ember .lsh-glint i { background: linear-gradient(90deg, transparent, rgba(253,186,116,.35), transparent); }\n                .t-ember .lsh-fx { overflow: visible; }\n                .t-ember .lsh-fx i { display: block; position: absolute; bottom: 4px; left: 30%; width: 4px; height: 4px; border-radius: 50%; background: #fdba74;\n                    box-shadow: 0 0 6px #f97316; opacity: 0; animation: lshEmber 2.6s ease-out infinite; animation-delay: calc(var(--d) * 6); }\n                .t-ember .lsh-fx i:nth-child(2) { left: 55%; width: 3px; height: 3px; animation-delay: calc(var(--d) * 6 + .9s); }\n                .t-ember .lsh-fx i:nth-child(3) { left: 78%; animation-delay: calc(var(--d) * 6 + 1.7s); }\n                @keyframes lshEmber { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(6px, -34px) scale(.4); } }\n                @keyframes lshFlare { 0% { transform: scale(1); opacity: 1; } 20% { transform: scale(1.4) translateY(-3px); opacity: .6; } 40% { opacity: 1; } 60% { opacity: .75; } 100% { transform: scale(1); opacity: 1; } }\n\n                /* ── Bannière 1V1 DUEL ── */\n                .ldu { position: relative; display: flex; align-items: center; gap: 10px; font-family: 'Montserrat', sans-serif; animation: lduIn .7s cubic-bezier(.2,1.5,.35,1) both; }\n                .ldu-wave { position: absolute; left: 50%; top: 50%; width: 200px; height: 200px; margin: -100px 0 0 -100px; border-radius: 50%;\n                    border: 3px solid rgba(251,191,36,.7); opacity: 0; animation: lduWave 2.4s ease-out infinite; pointer-events: none; }\n                .ldu-side { display: flex; flex-direction: column; align-items: center; gap: 3px; }\n                .ldu-l { animation: lduChargeL 2.4s cubic-bezier(.5,0,.3,1) infinite; }\n                .ldu-r { animation: lduChargeR 2.4s cubic-bezier(.5,0,.3,1) infinite; }\n                .ldu-av { width: 50px; height: 50px; border-radius: 50%; padding: 3px; overflow: hidden; }\n                .ldu-l .ldu-av { background: linear-gradient(160deg, #93c5fd, #2563eb 55%, #1e3a8a); box-shadow: 0 0 18px rgba(59,130,246,.7), 0 4px 10px rgba(0,0,0,.5); }\n                .ldu-r .ldu-av { background: linear-gradient(160deg, #fca5a5, #dc2626 55%, #7f1d1d); box-shadow: 0 0 18px rgba(239,68,68,.7), 0 4px 10px rgba(0,0,0,.5); }\n                .ldu-name { font-size: 9px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: .06em; max-width: 70px; overflow: hidden; text-overflow: ellipsis;\n                    background: rgba(2,6,23,.85); padding: 2px 6px; border-radius: 6px; }\n                .ldu-l .ldu-name { border: 1px solid rgba(96,165,250,.7); }\n                .ldu-r .ldu-name { border: 1px solid rgba(248,113,113,.7); }\n                .ldu-plate { position: relative; display: flex; align-items: center; gap: 8px; padding: 7px 18px; overflow: hidden;\n                    clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%);\n                    background: linear-gradient(180deg, #fde68a 0%, #f59e0b 12%, #7c2d12 14%, #1c1917 60%, #0c0a09 86%, #b45309 88%, #fbbf24 100%);\n                    animation: lduShake 2.4s linear infinite; }\n                .ldu-words { display: flex; flex-direction: column; align-items: center; line-height: .9; }\n                .ldu-1v1 { position: relative; font-size: 30px; font-weight: 900; font-style: italic; letter-spacing: -.02em;\n                    background: linear-gradient(180deg, #fff 0%, #fde68a 35%, #f59e0b 60%, #b45309 100%); -webkit-background-clip: text; background-clip: text; color: transparent;\n                    filter: drop-shadow(0 2px 0 #451a03); }\n                .ldu-duel { font-size: 11px; font-weight: 900; letter-spacing: .55em; margin-right: -.55em; color: #fff; text-shadow: 0 1px 0 #000; }\n                .ldu-sw { font-size: 20px; display: inline-block; }\n                .ldu-sw-l { animation: lduSwL 2.4s cubic-bezier(.5,0,.3,1) infinite; }\n                .ldu-sw-r { animation: lduSwR 2.4s cubic-bezier(.5,0,.3,1) infinite; }\n                .ldu-shine { position: absolute; top: 0; bottom: 0; left: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);\n                    transform: translateX(-150%) skewX(-20deg); animation: lduShine 2.4s ease-in-out infinite; }\n                .ldu-spark { position: absolute; left: 50%; top: 50%; width: 90px; height: 90px; margin: -45px 0 0 -45px; border-radius: 50%; pointer-events: none;\n                    background: radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(253,224,71,.7) 25%, rgba(249,115,22,0) 60%); opacity: 0; animation: lduSpark 2.4s ease-out infinite; }\n                @keyframes lduIn { 0% { opacity: 0; transform: scale(2.2) rotate(-6deg); } 60% { opacity: 1; transform: scale(.92) rotate(1deg); } 100% { transform: none; } }\n                @keyframes lduChargeL { 0%, 55% { transform: translateX(0); } 68% { transform: translateX(10px) rotate(8deg); } 76% { transform: translateX(-4px) rotate(-4deg); } 90%, 100% { transform: translateX(0); } }\n                @keyframes lduChargeR { 0%, 55% { transform: translateX(0); } 68% { transform: translateX(-10px) rotate(-8deg); } 76% { transform: translateX(4px) rotate(4deg); } 90%, 100% { transform: translateX(0); } }\n                @keyframes lduSwL { 0%, 55% { transform: rotate(0); } 68% { transform: rotate(35deg) scale(1.25); } 90%, 100% { transform: rotate(0); } }\n                @keyframes lduSwR { 0%, 55% { transform: scaleX(-1) rotate(0); } 68% { transform: scaleX(-1) rotate(35deg) scale(1.25); } 90%, 100% { transform: scaleX(-1) rotate(0); } }\n                @keyframes lduShake { 0%, 67% { transform: none; } 70% { transform: translate(2px, -1px); } 73% { transform: translate(-2px, 1px); } 76%, 100% { transform: none; } }\n                @keyframes lduSpark { 0%, 64% { opacity: 0; transform: scale(.2); } 69% { opacity: 1; transform: scale(1); } 85%, 100% { opacity: 0; transform: scale(1.5); } }\n                @keyframes lduWave { 0%, 66% { opacity: 0; transform: scale(.3); } 70% { opacity: .9; } 100% { opacity: 0; transform: scale(1.4); } }\n                @keyframes lduShine { 0%, 66% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(350%) skewX(-20deg); } }\n            "),cw&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur"
  },React["createElement"]("div",{
    'className':"bg-gray-900 border-2 border-gray-600 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden"
  },React["createElement"]("div",{
    'className':"bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center"
  },React["createElement"]('h2',{
    'className':"text-white font-bold text-lg flex items-center gap-2"
  },React["createElement"](CogIcon,null)," SOUND MANAGER"),React["createElement"]("button",{
    'onClick':dJ,'className':"text-gray-400 hover:text-white"
  },React["createElement"](CloseIcon,null))),React["createElement"]("div",{
    'className':"bg-gray-800/50 p-2 border-b border-gray-700 flex items-center justify-between px-4"
  },React["createElement"]("span",{
    'className':"text-xs text-gray-300 font-bold uppercase"
  },"ALLOW OVERLAPPING SOUNDS"),React["createElement"]("div",{
    'onClick':()=>cJ(!cI),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(cI?"bg-green-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(cI?"left-6":"left-1")
  }))),React["createElement"]("div",{
    'className':"flex-1 overflow-y-auto p-4 space-y-2 modal-scroll"
  },cu["map"](ez=>React["createElement"]("div",{
    'key':ez['id'],'className':"flex items-center gap-3 p-3 rounded-lg border transition-all "+(ez["active"]?"bg-gray-800 border-gray-600":"bg-gray-900 border-gray-800 opacity-60")
  },React["createElement"]("button",{
    'onClick':()=>dE(ez['id']),'className':"w-8 h-8 rounded flex items-center justify-center border transition-colors "+(ez["active"]?"bg-green-600 border-green-500 text-white":"bg-transparent border-gray-500 hover:border-gray-400")
  },ez["active"]&&React["createElement"](CheckIcon,null)),React["createElement"]("div",{
    'className':"flex-1"
  },React["createElement"]("div",{
    'className':"text-white font-bold text-sm"
  },ez["name"]),React["createElement"]("div",{
    'className':"text-xs text-gray-400 flex gap-2 items-center mt-1"
  },React["createElement"]("span",{
    'className':"uppercase px-1.5 py-0.5 rounded font-bold text-[10px] "+(ez["type"]==="win"?"bg-yellow-900 text-yellow-200":ez["type"]==="elimination"?"bg-red-900 text-red-200":"bg-blue-900 text-blue-200")
  },ez["type"]),ez["min"]>0x0&&React["createElement"]("span",{
    'className':"text-yellow-500 font-mono"
  },"Min: ",ez["min"]),ez["isCustom"]&&React["createElement"]("span",{
    'className':"text-purple-400 border border-purple-500/30 px-1 rounded"
  },"Custom"))),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("button",{
    'onClick':()=>dI(ez["url"]),'className':"p-2 bg-gray-700 hover:bg-gray-600 rounded text-white",'title':"Preview"
  },React["createElement"](PlayIcon,null)),ez["isCustom"]&&React["createElement"]("button",{
    'onClick':eA=>dF(eA,ez['id']),'className':"p-2 bg-red-900/50 hover:bg-red-600 rounded text-red-200 hover:text-white",'title':"Delete (Direct)"
  },React["createElement"](TrashIcon,null)))))),React["createElement"]("div",{
    'className':"bg-gray-800 p-4 border-t border-gray-700"
  },React["createElement"]('h3',{
    'className':"text-xs text-gray-400 font-bold uppercase mb-2"
  },"Import New Sound (MP3/WAV)"),React["createElement"]("div",{
    'className':"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2"
  },React["createElement"]("input",{
    'type':"text",'placeholder':"Name",'value':cy,'onChange':ez=>cz(ez["target"]["value"]),'className':"bg-gray-900 border border-gray-600 rounded px-2 py-2 text-xs text-white"
  }),React["createElement"]("div",{
    'className':"flex items-center gap-1 bg-gray-900 border border-gray-600 rounded px-2 py-1"
  },React["createElement"]("button",{
    'onClick':()=>document["getElementById"]("sound-upload")["click"](),'className':"text-xs text-blue-400 font-bold hover:text-white flex items-center gap-1 text-left truncate w-full"
  },React["createElement"](FolderIcon,null)," BROWSE..."),React["createElement"]("input",{
    'id':"sound-upload",'type':"file",'accept':"audio/*",'className':"hidden",'onChange':dG
  })),cC&&React["createElement"]("div",{
    'className':"col-span-full text-[10px] text-green-400 px-1"
  },"Selected: ",cC),React["createElement"]("select",{
    'value':cE,'onChange':ez=>cF(ez["target"]["value"]),'className':"bg-gray-900 border border-gray-600 rounded px-2 py-2 text-xs text-white"
  },React["createElement"]("option",{
    'value':"spin"
  },"Wheel Spin"),React["createElement"]("option",{
    'value':"win"
  },"Victory"),React["createElement"]("option",{
    'value':"coin"
  },"Coin Add"),React["createElement"]("option",{
    'value':"elimination"
  },"Elimination")),React["createElement"]("input",{
    'type':"number",'placeholder':"Min Amount",'value':cG,'onChange':ez=>cH(ez["target"]["value"]),'className':"bg-gray-900 border border-gray-600 rounded px-2 py-2 text-xs text-white"
  })),React["createElement"]("button",{
    'onClick':dH,'className':"w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-sm transition-colors shadow-lg"
  },"ADD TO LIBRARY")))),bT&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[999] bg-transparent flex justify-end",'onClick':ez=>{
      var iT=fQ;
      if(ez["target"]===ez["currentTarget"])bU(![]);
      
    }
  },React["createElement"]("style",null,"\n                        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }\n                        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }\n                    "),React["createElement"]("div",{
    'className':"bg-gray-900 border-l border-gray-700 w-full max-w-sm h-full p-6 shadow-2xl relative flex flex-col animate-slideInRight"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-4 pb-3 border-b border-gray-700"
  },React["createElement"]('h2',{
    'className':"text-white font-black text-xl flex items-center gap-2"
  },React["createElement"](CogIcon,{
    'className':"w-5 h-5 text-blue-500"
  })," SETTINGS"),React["createElement"]("button",{
    'onClick':()=>bU(![]),'className':"absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2 flex items-center justify-center rounded-lg hover:bg-gray-800"
  },React["createElement"](CloseIcon,{
    'className':"w-5 h-5"
  }))),React["createElement"]("div",{
    'className':"flex-1 space-y-3 overflow-y-auto modal-scroll pr-2 pb-10"
  },React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"ELIMINATION MODE"),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("button",{
    'onClick':()=>ao(!an),'className':"p-1 rounded border transition-colors "+(an?"bg-blue-600 border-blue-500 text-white":"bg-gray-700 border-gray-600 text-gray-400"),'title':"Toggle Indicator Visibility"
  },an?React["createElement"](EyeIcon,null):React["createElement"](EyeOffIcon,null)),React["createElement"]("div",{
    'onClick':()=>am(!al),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(al?"bg-red-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(al?"left-6":"left-1")
  })))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"The winner is removed from the wheel after each spin (Survivor Mode)."),al&&React["createElement"]("div",{
    'className':"mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 shadow-[0_0_14px_rgba(239,68,68,0.15)]"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white flex items-center gap-2"
  },"MULTI ELIMINATION",React["createElement"]("span",{
    'className':"px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black tracking-widest shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"
  },"NEW")),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("input",{
    'type':"number",'min':'2','value':at,'onChange':ez=>{
      var iU=fQ;
      au(ez["target"]["value"]);
      var eA=parseInt(ez["target"]["value"]);
      if(!isNaN(eA)&&eA>=0x2)as(eA);
      
    },'onBlur':()=>{
      var iV=fQ,ez=parseInt(at),eA=isNaN(ez)?0x2:Math["max"](0x2,ez);
      as(eA),au(String(eA));
      
    },'disabled':![],'className':"w-14 bg-gray-900/80 border rounded-md px-1 py-1 text-center font-bold "+(ap?"border-red-500/50 text-red-400":"border-gray-600 text-gray-300"),'title':"Players eliminated per spin (X)"
  }),React["createElement"]("div",{
    'onClick':()=>aq(!ap),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(ap?"bg-red-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(ap?"left-6":"left-1")
  })))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Removes up to ",React["createElement"]("span",{
    'className':"text-red-400 font-bold"
  },ar)," slices per spin, drawn at random. Slices, not people — someone with several entries can lose one and stay in. The wheel always keeps at least ",React["createElement"]("span",{
    'className':"text-white font-bold"
  },MULTI_ELIM_FLOOR)," slices, below that it falls back to one per spin."),React["createElement"]('p',{
    'className':"text-[10px] font-bold mt-1 "+(m["length"]>MULTI_ELIM_FLOOR?"text-green-400":"text-orange-400")
  },m["length"]>MULTI_ELIM_FLOOR?"Active now: "+Math["min"](ar,m["length"]-MULTI_ELIM_FLOOR)+" removed on the next spin ("+m["length"]+" slices on the wheel).":"Inactive: "+m["length"]+" slice"+(m["length"]===0x1?'':'s')+" on the wheel — needs more than "+MULTI_ELIM_FLOOR+" to remove several at once."))),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"WINNER STATS"),React["createElement"]("div",{
    'onClick':()=>aI(!aH),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(aH?"bg-yellow-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(aH?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400 mb-3"
  },"Shows coins spent, spins, players beaten and board entries on the winner popup."),React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1 pt-2 border-t border-gray-700"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"SESSION INDICATORS"),React["createElement"]("div",{
    'onClick':()=>aK(!aJ),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(aJ?"bg-blue-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(aJ?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Players, entries, coins and vouch counter, right above the wheel / square on stream."),aJ&&React["createElement"]("div",{
    'className':"mt-3"
  },React["createElement"]("span",{
    'className':"text-[10px] font-black text-gray-400 tracking-widest"
  },"STATS STYLE"),React["createElement"]("div",{
    'className':"grid grid-cols-2 gap-1.5 mt-1.5"
  },HUD_THEMES["map"](ez=>React["createElement"]("button",{
    'key':ez['id'],'onClick':()=>aM(ez['id']),'title':ez["hint"],'className':"text-left px-2 py-1.5 rounded-md border text-[10px] font-black tracking-wider transition-colors "+(aL===ez['id']?"bg-blue-600/30 border-blue-400 text-white":"bg-gray-900 border-gray-700 text-gray-400 hover:text-white")
  },ez["label"])))),aJ&&React["createElement"]("div",{
    'className':"mt-3 pt-3 border-t border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-2"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"VOUCH COUNTER"),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("span",{
    'className':"w-12 text-center text-violet-400 font-black tabular-nums",'title':"Vouches this session (counted from chat, not editable)"
  },aN),React["createElement"]("div",{
    'onClick':()=>aQ(!aP),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(aP?"bg-violet-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(aP?"left-6":"left-1")
  })))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400 mt-1"
  },"A win grants one credit; the winner spends it by posting ",React["createElement"]('b',null,"vouch")," in chat."))),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"MULTI ENTRIES"),React["createElement"]("div",{
    'onClick':()=>aY(!aX),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(aX?"bg-indigo-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(aX?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Players get 1 entry for every Min Bid amount (e.g. 500 coins = 5 entries if min is 100).")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white uppercase"
  },"PROPORTIONAL MODE"),React["createElement"]("div",{
    'onClick':()=>ai(!ah),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(ah?"bg-blue-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(ah?"left-6":"left-1")
  }))),React["createElement"]("div",{
    'className':"flex items-center justify-between mt-2 pt-2 border-t border-white/5"
  },React["createElement"]("span",{
    'className':"text-[10px] font-black uppercase "+(ah?"text-gray-300":"text-gray-600")
  },"INVERSE LOGIC"),React["createElement"]("div",{
    'onClick':()=>ah&&b6(!b5),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(!ah?"opacity-30 cursor-not-allowed bg-gray-700":b5?"bg-rose-500":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(b5?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400 mt-2"
  },ah?b5?"INVERSE: Higher donation = Lower chance (Extreme Mode).":"NORMAL: Higher donation = Higher chance.":"FIXED: Everyone has the same chance.")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"JOIN ON COINS"),React["createElement"]("div",{
    'onClick':()=>br(!bq),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(bq?"bg-yellow-500":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(bq?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Enable or disable joining via coin donations."),bq&&React["createElement"]("div",{
    'className':"flex items-center justify-between mt-2 pt-2 border-t border-white/5"
  },React["createElement"]("span",{
    'className':"text-[10px] font-bold text-gray-300 uppercase"
  },"ONLY HEART ME GIFT"),React["createElement"]("div",{
    'onClick':()=>bt(!bs),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(bs?"bg-orange-500":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(bs?"left-6":"left-1")
  }))),bq&&bs&&React["createElement"]('p',{
    'className':"text-[10px] text-orange-400 mt-1"
  },"Only the Heart Me gift allows entry (1 entry).")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"JOIN ON FOLLOW"),React["createElement"]("div",{
    'onClick':()=>bn(!bm),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(bm?"bg-green-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(bm?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"New followers automatically join the wheel (1 Entry).")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"JOIN ON LIKE"),React["createElement"]("div",{
    'onClick':()=>bp(!bo),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(bo?"bg-pink-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(bo?"left-6":"left-1")
  }))),React["createElement"]("div",{
    'className':"mt-2 flex items-center gap-2"
  },React["createElement"]("span",{
    'className':"text-[10px] font-bold uppercase "+(bo?"text-gray-400":"text-gray-600")
  },"LIKES PER ENTRY:"),React["createElement"]("input",{
    'type':"number",'value':bu,'onChange':ez=>bv(Math["max"](0x1,parseInt(ez["target"]["value"])||0x1)),'disabled':!bo,'className':"w-20 bg-gray-900 border rounded px-2 py-1 text-xs text-white "+(bo?"border-gray-600":"border-gray-800 text-gray-500")
  })),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400 mt-1"
  },"Users get 1 entry for every ",bu," likes sent.")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"MUTE SOUNDS"),React["createElement"]("div",{
    'onClick':()=>ak(!aj),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(aj?"bg-purple-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(aj?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Disable all game sounds.")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex flex-col gap-2"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white uppercase"
  },"WHEEL COLORS"),React["createElement"]("div",{
    'className':"flex items-center justify-between"
  },React["createElement"]("span",{
    'className':"text-xs text-gray-300"
  },"Inner Line Border"),React["createElement"]("input",{
    'type':"color",'value':af,'onChange':ez=>{
      var iW=fQ;
      ag(ez["target"]["value"]),du("custom");
      
    },'className':"w-8 h-8 rounded cursor-pointer bg-transparent border-none"
  })),React["createElement"]("div",{
    'className':"flex items-center justify-between"
  },React["createElement"]("span",{
    'className':"text-xs text-gray-300"
  },"Wheel Background"),React["createElement"]("input",{
    'type':"color",'value':ad,'onChange':ez=>{
      var iX=fQ;
      ae(ez["target"]["value"]),du("custom");
      
    },'className':"w-8 h-8 rounded cursor-pointer bg-transparent border-none"
  })),React["createElement"]('p',{
    'className':"text-[9px] text-gray-500 italic mt-0.5 mb-2",'style':{
      'lineHeight':"1.2"
    }
  },"Requires selecting \"CUSTOM\" theme for full background effect. Inner lines apply to all themes."),React["createElement"]("button",{
    'onClick':()=>{
      var iY=fQ;
      ae("#1f2937"),ag("#1f2937"),du("classic");
      
    },'className':"w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase rounded border border-gray-600 transition-colors"
  },"Reset to Default Colors"))),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white"
  },"SHOW CENTRAL LOGO"),React["createElement"]("div",{
    'onClick':()=>ds(!dr),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(dr?"bg-blue-600":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(dr?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Display the mezo logo in the center of the wheel.")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-sm font-bold text-white uppercase"
  },"1V1 DUEL INDICATOR"),React["createElement"]("div",{
    'onClick':()=>c0(!bZ),'className':"w-10 h-5 rounded-full cursor-pointer relative transition-colors "+(bZ?"bg-orange-500":"bg-gray-600")
  },React["createElement"]("div",{
    'className':"absolute top-1 w-3 h-3 bg-white rounded-full transition-all "+(bZ?"left-6":"left-1")
  }))),React["createElement"]('p',{
    'className':"text-[10px] text-gray-400"
  },"Show a \"1V1 DUEL\" animated banner when only 2 players remain.")),React["createElement"]("div",{
    'className':"bg-gray-800 p-3 rounded-lg border border-gray-700"
  },React["createElement"]('h3',{
    'className':"text-xs text-blue-400 font-black uppercase mb-3 tracking-widest flex items-center gap-2"
  },React["createElement"](LockIcon,{
    'className':"w-3 h-3"
  })," Limitation Settings"),React["createElement"]("div",{
    'className':"space-y-3"
  },React["createElement"]("div",null,React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-[10px] font-bold text-gray-300 uppercase"
  },"Max Slots Per Player"),React["createElement"]("span",{
    'className':"text-[10px] font-mono text-blue-400"
  },bw===0x0?"Infinity":bw)),React["createElement"]("input",{
    'type':"number",'min':'0','value':bw,'onChange':ez=>bx(Math["max"](0x0,parseInt(ez["target"]["value"])||0x0)),'className':"w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none",'placeholder':"0 = No Limit"
  }),React["createElement"]('p',{
    'className':"text-[8px] text-gray-500 mt-1 italic"
  },"Limits how many times one person can be on the wheel.")),React["createElement"]("div",{
    'className':"pt-2 border-t border-gray-700/50"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-[10px] font-bold text-gray-300 uppercase"
  },"Max Total Players"),React["createElement"]("span",{
    'className':"text-[10px] font-mono text-emerald-400"
  },by===0x0?"Infinity":by)),React["createElement"]("input",{
    'type':"number",'min':'0','value':by,'onChange':ez=>bz(Math["max"](0x0,parseInt(ez["target"]["value"])||0x0)),'className':"w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-emerald-500 outline-none",'placeholder':"0 = No Limit"
  }),React["createElement"]('p',{
    'className':"text-[8px] text-gray-500 mt-1 italic"
  },"Limits the total number of unique people allowed to join."))))))),!k&&React["createElement"]("div",{
    'className':"w-full bg-black/90 border-b border-white/10 z-[100] flex-shrink-0 relative flex flex-col"
  },React["createElement"]("div",{
    'className':"w-full flex items-center justify-center p-1 cursor-pointer hover:bg-white/5 group",'onClick':()=>bS(!bR),'title':bR?"Collapse Menu":"Expand Menu"
  },bR?React["createElement"](ChevronUpIcon,{
    'className':"w-4 h-4 text-gray-500 group-hover:text-white"
  }):React["createElement"](MenuIcon,{
    'className':"w-4 h-4 text-gray-500 group-hover:text-white"
  })),!bR&&React["createElement"]("div",{
    'className':"w-full flex justify-center pb-1"
  },React["createElement"]("div",{
    'className':"flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5"
  },React["createElement"]("button",{
    'onClick':dT,'disabled':o&&!r,'className':"p-1.5 rounded-md transition-colors "+(r?"bg-amber-600 text-white":"bg-blue-600 text-white")+" disabled:opacity-50 disabled:cursor-not-allowed",'title':r?"Resume":"Start"
  },React["createElement"](Play,{
    'className':"w-4 h-4"
  })),React["createElement"]("button",{
    'onClick':dU,'disabled':!o,'className':"p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",'title':"Pause"
  },React["createElement"](Pause,{
    'className':"w-4 h-4"
  })),React["createElement"]("button",{
    'onClick':dV,'className':"p-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md transition-colors",'title':"Reset"
  },React["createElement"](TrashIconOutline,{
    'className':"w-4 h-4"
  })))),bR&&React["createElement"]("div",{
    'className':"w-full flex flex-wrap items-center justify-center xl:justify-between gap-4 px-4 pb-4"
  },React["createElement"]("div",{
    'className':"flex flex-wrap items-center justify-center gap-2 lg:gap-4"
  },React["createElement"]("div",{
    'className':"flex items-center gap-2 bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-indigo-950/90 px-3 py-1.5 rounded-xl border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
  },React["createElement"]("span",{
    'className':"text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-black text-lg tracking-wider uppercase pr-2 border-r border-white/15 select-none"
  },"mezo"),React["createElement"]("input",{
    'type':"text",
    'id':"tiktok-username-input",
    'placeholder':"TikTok @username...",
    'value':ttUsername,
    'onChange':ez=>setTtUsername(ez["target"]["value"]),
    'onKeyDown':ez=>{if(ez["key"]==="Enter")handleTikTokConnect();},
    'disabled':ttStatus==="connected"||ttStatus==="connecting",
    'className':"bg-gray-950/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-400 w-36 disabled:opacity-60"
  }),React["createElement"]("button",{
    'id':"tiktok-connect-btn",
    'onClick':handleTikTokConnect,
    'className':"px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer "+(ttStatus==="connected"?"bg-red-600 hover:bg-red-500 text-white shadow-red-600/30":ttStatus==="connecting"?"bg-amber-500 text-black animate-pulse":"bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30")
  },ttStatus==="connected"?"Disconnect":ttStatus==="connecting"?"Connecting...":"Connect"),React["createElement"]("div",{
    'className':"flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border "+(ttStatus==="connected"?"bg-emerald-950/80 border-emerald-500/60 text-emerald-300":ttStatus==="connecting"?"bg-amber-950/80 border-amber-500/60 text-amber-300":ttStatus==="offline"?"bg-orange-950/80 border-orange-500/60 text-orange-300":"bg-red-950/70 border-red-500/40 text-red-300"),
    'title':ttError||(ttStatus==="connected"?"Connected to @"+ttConnectedUser:"Not connected to TikTok Live")
  },React["createElement"]("span",{
    'className':"w-2 h-2 rounded-full "+(ttStatus==="connected"?"bg-emerald-400 animate-ping":ttStatus==="connecting"?"bg-amber-400 animate-ping":ttStatus==="offline"?"bg-orange-400":"bg-red-500")
  }),React["createElement"]("span",null,ttStatus==="connected"?"متصل (@"+ttConnectedUser+(bK>0x0?" · 👁 "+bK:'')+')':ttStatus==="connecting"?"جاري الفحص...":ttStatus==="offline"?"قافل لايف (@"+(ttConnectedUser||ttUsername)+")":ttError?"غير متصل ("+ttError["slice"](0x0,0x1a)+")":"غير متصل"))),React["createElement"]("div",{
    'className':"flex items-center gap-2 lg:gap-4 bg-black/60 px-3 py-2 lg:px-4 lg:py-2 rounded-lg border-2 border-white/20 shadow-xl"
  },React["createElement"]("div",{
    'className':"flex items-center gap-2",'title':"Alive Players"
  },React["createElement"](UsersIcon,{
    'className':"text-blue-400 w-5 h-5"
  }),React["createElement"]("span",{
    'className':"text-white text-xl font-black"
  },m["length"])),React["createElement"]("div",{
    'className':"w-0.5 h-6 bg-white/20"
  }),React["createElement"]("div",{
    'className':"flex items-center gap-2",'title':"Session Coins"
  },React["createElement"](Coins,{
    'className':"text-yellow-400 w-5 h-5"
  }),React["createElement"]("span",{
    'className':"text-yellow-400 text-xl font-black"
  },dQ["toLocaleString"]())),React["createElement"]("div",{
    'className':"w-0.5 h-6 bg-white/20"
  }),React["createElement"]("div",{
    'className':"flex items-center gap-2",'title':"Session Time"
  },React["createElement"](TimerIcon,{
    'className':"text-emerald-400 w-5 h-5"
  }),React["createElement"]("span",{
    'className':"text-emerald-400 text-xl font-black"
  },e1(X))),React["createElement"]("div",{
    'className':"w-0.5 h-6 bg-white/20"
  }),React["createElement"]("div",{
    'className':"flex items-center gap-2",'title':"Total Session Likes"
  },React["createElement"](HeartIcon,{
    'className':"text-pink-500 w-5 h-5"
  }),React["createElement"]("span",{
    'className':"text-pink-500 text-xl font-black"
  },a3["toLocaleString"]()))),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("div",{
    'className':"flex flex-col items-center bg-gray-800 rounded px-2 py-1 border border-gray-600 h-full justify-center"
  },React["createElement"]("span",{
    'className':"text-[8px] text-gray-400 font-bold uppercase mb-1"
  },"TIMER"),React["createElement"]("button",{
    'onClick':()=>M(!L),'className':"w-8 h-4 rounded-full flex items-center transition-colors duration-300 "+(L?"bg-green-500 justify-end":"bg-gray-600 justify-start")
  },React["createElement"]("div",{
    'className':"w-3 h-3 bg-white rounded-full mx-0.5 shadow-sm"
  }))),L&&React["createElement"](React["Fragment"],null,React["createElement"]("div",{
    'className':"flex flex-col items-center gap-1"
  },React["createElement"]("div",{
    'className':"flex items-center gap-1"
  },React["createElement"]("button",{
    'type':"button",'id':"btn-timer-minus-10",'onClick':()=>adjustTimerBySeconds(-0xa),'className':"px-1.5 py-0.5 bg-red-900/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/50 rounded text-[9px] font-black transition-all cursor-pointer shadow-sm whitespace-nowrap",'title':"-10 sec"
  },"-10 sec"),React["createElement"]("button",{
    'type':"button",'id':"btn-timer-plus-10",'onClick':()=>adjustTimerBySeconds(0xa),'className':"px-1.5 py-0.5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/50 rounded text-[9px] font-black transition-all cursor-pointer shadow-sm whitespace-nowrap",'title':"+10 sec"
  },"+10 sec"),React["createElement"]("button",{
    'type':"button",'id':"btn-timer-minus-30",'onClick':()=>adjustTimerBySeconds(-0x1e),'className':"px-1.5 py-0.5 bg-red-900/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/50 rounded text-[9px] font-black transition-all cursor-pointer shadow-sm whitespace-nowrap",'title':"-30 sec"
  },"-30"),React["createElement"]("button",{
    'type':"button",'id':"btn-timer-plus-30",'onClick':()=>adjustTimerBySeconds(0x1e),'className':"px-1.5 py-0.5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/50 rounded text-[9px] font-black transition-all cursor-pointer shadow-sm whitespace-nowrap",'title':"+30 sec"
  },"+30")),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("div",{
    'className':"flex flex-col"
  },React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase"
  },"Min"),React["createElement"]("input",{
    'type':"number",'value':P,'onChange':ez=>Q(Math["max"](0x0,parseInt(ez["target"]["value"])||0x0)),'className':"w-12 bg-gray-900/80 border border-gray-700 rounded-md px-1 py-1 text-center text-white font-bold"
  })),React["createElement"]("div",{
    'className':"flex flex-col"
  },React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase"
  },"Sec"),React["createElement"]("input",{
    'type':"number",'value':R,'onChange':ez=>S(Math["max"](0x0,Math["min"](0x3b,parseInt(ez["target"]["value"])||0x0))),'className':"w-12 bg-gray-900/80 border border-gray-700 rounded-md px-1 py-1 text-center text-white font-bold"
  })))),al&&React["createElement"]("div",{
    'className':"flex flex-col border-l border-gray-600 pl-2 ml-1"
  },React["createElement"]("span",{
    'className':"text-[10px] text-red-400 font-bold uppercase"
  },"Next"),React["createElement"]("input",{
    'type':"number",'value':T,'onChange':ez=>{
      var iZ=fQ,eA=parseInt(ez["target"]["value"]);
      U(isNaN(eA)?0x14:Math["max"](0x0,eA));
      
    },'className':"w-12 bg-gray-900/80 border border-red-500/50 rounded-md px-1 py-1 text-center text-red-400 font-bold",'title':"Timer for subsequent rounds"
  })),React["createElement"]("button",{
    'onClick':()=>O(!N),'className':"flex flex-col justify-center items-center px-3 rounded border mt-auto h-[30px] text-[10px] font-black uppercase transition-all duration-300 "+(N?"bg-yellow-600 border-yellow-500 text-white shadow-[0_0_10px_rgba(202,138,4,0.5)]":"bg-gray-800 border-gray-600 text-gray-500 hover:text-gray-300 hover:bg-gray-700"),'title':"Auto Spin"
  },"AUTO SPIN"),React["createElement"]("div",{
    'className':"flex flex-col border-l border-gray-600 pl-2 ml-1"
  },React["createElement"]("span",{
    'className':"text-[10px] text-blue-400 font-bold uppercase"
  },"Min Pers."),React["createElement"]("div",{
    'className':"flex items-center gap-1"
  },React["createElement"]("input",{
    'type':"number",'value':bA,'onChange':ez=>bB(Math["max"](0x0,parseInt(ez["target"]["value"])||0x0)),'className':"w-12 bg-gray-900/80 border border-blue-500/50 rounded-md px-1 py-1 text-center text-blue-400 font-bold",'title':"Minimum number of participants to start the first timer"
  }),React["createElement"]("button",{
    'onClick':()=>bD(!bC),'className':"flex items-center justify-center px-2 h-6 rounded border transition-all text-[10px] font-black "+(bC?"bg-blue-600 border-blue-400 text-white":"bg-gray-800 border-gray-600 text-gray-500"),'title':bC?"Counting unique participants":"Counting all entries"
  },"UNIQUE")))))),React["createElement"]("div",{
    'className':"flex flex-col items-center gap-2 mx-auto mt-2 lg:mt-0 flex-1 min-w-[300px]"
  },React["createElement"]("div",{
    'className':"flex flex-wrap items-center justify-center gap-2"
  },React["createElement"]("button",{
    'onClick':dT,'disabled':o&&!r,'className':"flex items-center gap-2 px-5 py-1.5 text-sm font-black rounded-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 "+(r?"bg-amber-500 hover:bg-amber-400":"bg-blue-600 hover:bg-blue-500")+" text-white shadow-blue-500/20"
  },React["createElement"](Play,{
    'className':"w-4 h-4"
  }),'\x20',r?"RESUME":"START"),React["createElement"]("button",{
    'onClick':dU,'disabled':!o,'className':"flex items-center gap-2 px-5 py-1.5 text-sm font-black rounded-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 "+(r?"bg-gray-600 hover:bg-gray-500":"bg-gray-600 hover:bg-gray-500")+" text-white shadow-black/20 text-xs"
  },r?React["createElement"](Play,{
    'className':"w-4 h-4"
  }):React["createElement"](Pause,{
    'className':"w-4 h-4"
  })," PAUSE"),React["createElement"]("button",{
    'onClick':dD,'className':"flex items-center justify-center px-3 py-1.5 text-white bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 shadow-xl transition-all active:scale-95",'title':"Skip Sound"
  },React["createElement"](SkipIcon,{
    'className':"w-4 h-4"
  })),React["createElement"]("button",{
    'onClick':dV,'className':"flex items-center gap-2 px-5 py-1.5 text-sm font-black bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg transform transition-all hover:scale-105 shadow-red-500/20",'title':"Hard Reset"
  },React["createElement"](TrashIconOutline,{
    'className':"w-4 h-4"
  })," RESET")),ch&&ch["length"]>0x0&&React["createElement"]("div",{
    'className':"flex flex-wrap items-center justify-center gap-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/5"
  },React["createElement"]("button",{
    'onClick':()=>{
      c4(''),ds(![]);
      
    },'className':"flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all border group relative overflow-hidden h-[42px]\n                                            "+(!c3&&!dr?"bg-red-500/20 border-red-500 text-red-500":"bg-black/50 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10")
  },React["createElement"](CloseIcon,{
    'className':"w-3.5 h-3.5"
  }),React["createElement"]("span",{
    'className':"text-[10px] font-black uppercase"
  },"None")),React["createElement"]("div",{
    'className':"w-px h-6 bg-white/10"
  }),ch["filter"](ez=>ez["pinned"])["sort"]((ez,eA)=>ez["minBid"]-eA["minBid"])["map"](ez=>{
    var j0=fQ,eA=c3["includes"](ez["url"]?.["split"]("url=")[0x1]?.["split"]('&')[0x0]||"---"),eB=!ez['id']["startsWith"]("def_");
    return React["createElement"]("div",{
      'key':ez['id'],'className':"relative group"
    },React["createElement"]("button",{
      'onClick':()=>{
        cm(ez),ds(!![]);
        
      },'className':"flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border relative overflow-hidden h-[42px] min-w-[80px]\n                                                            "+(eA?"bg-blue-600/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]":"bg-black/50 border-white/10 hover:border-white/30 hover:bg-white/10"),'title':"Apply: "+ez["name"]
    },ez["url"]&&React["createElement"](SafeAvatar,{
      'src':((()=>{
        var j1=j0;
        try{
          var eC=new URL(ez["url"]),eD=new URLSearchParams(eC["search"]);
          return eD["get"]("url")||ez["url"];
          
        }catch(eE){
          return ez["url"];
          
        }
      })()),'name':ez["name"],'className':"w-6 h-6 object-contain group-hover:scale-110 transition-transform"
    }),React["createElement"]("div",{
      'className':"flex items-center gap-0.5 text-[11px] font-black text-yellow-500"
    },React["createElement"](Coins,{
      'className':"w-3 h-3"
    }),'\x20',ez["minBid"])),eB&&React["createElement"]("button",{
      'onClick':eC=>{
        var j2=j0;
        eC["stopPropagation"](),ck(ez['id']);
        
      },'className':"absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100 z-10 border border-white/20",'title':"Remove preset"
    },React["createElement"](CloseIcon,{
      'className':"w-2.5 h-2.5"
    })));
    
  }),React["createElement"]("button",{
    'onClick':()=>pickGiftFromLauncher("Add gift preset",ez=>cj({
      'n':ez["name"],'c':ez["coins"],'i':ez["image"]||''
    }),()=>bY(!![])),'className':"flex items-center justify-center w-10 h-[42px] bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 hover:border-blue-500 text-blue-400 rounded-xl transition-all group",'title':"Add Gift Preset"
  },React["createElement"]("div",{
    'className':"relative"
  },React["createElement"](GiftIcon,{
    'className':"w-5 h-5 group-hover:scale-110 transition-transform"
  }),React["createElement"]("div",{
    'className':"absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full"
  },'+'))))),React["createElement"]("div",{
    'className':"flex flex-wrap items-center justify-center xl:justify-end gap-2 lg:gap-4 w-full xl:w-auto"
  },React["createElement"]("div",{
    'className':"flex flex-wrap justify-center gap-2 lg:gap-4 items-center"
  },React["createElement"]("div",{
    'className':"h-8 w-px bg-gray-700 mx-1"
  }),React["createElement"]("div",{
    'className':"flex flex-col min-w-[80px]"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-[10px] text-blue-400 font-black uppercase flex items-center gap-1"
  },React["createElement"](SpeedIcon,{
    'className':"w-3 h-3"
  })," SPEED"),React["createElement"]("span",{
    'className':"text-[8px] font-mono text-gray-400"
  },Math["round"]((0xb-bP)/0x9*0x64),'%')),React["createElement"]("input",{
    'type':"range",'min':'1','max':'10','step':'1','value':0xb-bP,'onChange':ez=>bQ(0xb-parseInt(ez["target"]["value"])),'className':"w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
  }),React["createElement"]("div",{
    'className':"flex justify-between text-[6px] text-gray-500 font-extrabold px-0.5 mt-0.5 leading-none"
  },React["createElement"]("span",null,"SLOW"),React["createElement"]("span",null,"FAST"))),React["createElement"]("div",{
    'className':"flex flex-col min-w-[80px]"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1"
  },React["createElement"]("span",{
    'className':"text-[10px] text-purple-400 font-black uppercase flex items-center gap-1"
  },React["createElement"](ScaleIcon,{
    'className':"w-3 h-3"
  })," WIDGET SIZE"),React["createElement"]("span",{
    'className':"text-[8px] font-mono text-gray-400"
  },Math["round"](bN*0x64),'%')),React["createElement"]("input",{
    'type':"range",'min':"0.3",'max':'2','step':"0.05",'value':bN,'onChange':ez=>bO(parseFloat(ez["target"]["value"])),'className':"w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
  })),React["createElement"]("div",{
    'className':"h-8 w-px bg-gray-700 mx-1"
  }),React["createElement"]("div",{
    'className':"flex flex-col"
  },React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap"
  },"Theme"),React["createElement"]("select",{
    'value':dt,'onChange':ez=>du(ez["target"]["value"]),'className':"bg-gray-900 border border-gray-600 focus:border-blue-500 text-white text-[11px] font-bold px-2 py-1.5 rounded-md w-28 outline-none cursor-pointer transition-colors shadow-inner"
  },React["createElement"]("option",{
    'value':"classic"
  },"CLASSIC (BLUE)"),React["createElement"]("option",{
    'value':'og'
  },"OG (EMERALD)"),React["createElement"]("option",{
    'value':"neon_vibes"
  },"NEON VIBES"),React["createElement"]("option",{
    'value':"rainbow"
  },"RAINBOW"),React["createElement"]("option",{
    'value':"laagency_dark"
  },"MEZO DARK"),React["createElement"]("option",{
    'value':"cyberpunk"
  },"CYBERPUNK"),React["createElement"]("option",{
    'value':"galaxy"
  },"GALAXY"),React["createElement"]("option",{
    'value':"lava"
  },"LAVA"),React["createElement"]("option",{
    'value':"toxic_glow"
  },"TOXIC GLOW"),React["createElement"]("option",{
    'value':"dark_luxury"
  },"DARK LUXURY"),React["createElement"]("option",{
    'value':"gold_luxury"
  },"GOLD LUXURY"),React["createElement"]("option",{
    'value':"modern_glass"
  },"MODERN (GLASS)"),React["createElement"]("option",{
    'value':"candy"
  },"CANDY"),React["createElement"]("option",{
    'value':"custom"
  },"★ CUSTOM COLORS"))),React["createElement"]("div",{
    'className':"flex flex-col"
  },React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap"
  },"Stats Style"),React["createElement"]("select",{
    'value':aJ?aL:"off",'onChange':ez=>{
      var j3=fQ;
      ez["target"]["value"]==="off"?aK(![]):(aK(!![]),aM(ez["target"]["value"]));
      
    },'title':"Stats bar above the wheel / square",'className':"bg-gray-900 border border-gray-600 focus:border-blue-500 text-white text-[11px] font-bold px-2 py-1.5 rounded-md w-28 outline-none cursor-pointer transition-colors shadow-inner"
  },React["createElement"]("option",{
    'value':"off"
  },"OFF"),HUD_THEMES["map"](ez=>React["createElement"]("option",{
    'key':ez['id'],'value':ez['id']
  },ez["label"])))),React["createElement"]("div",{
    'className':"flex flex-col"
  },React["createElement"]("span",{
    'className':"text-[10px] text-yellow-400 font-bold uppercase"
  },"Min Bid"),React["createElement"]("div",{
    'className':"relative flex items-center gap-1"
  },React["createElement"]("div",{
    'className':"relative"
  },React["createElement"]("input",{
    'type':"number",'value':Z,'onChange':ez=>a0(Math["max"](0x1,parseInt(ez["target"]["value"])||0x1)),'className':"w-20 bg-gray-900/80 border border-yellow-600/50 rounded-md pl-6 pr-2 py-1 text-white font-bold focus:border-yellow-400 outline-none"
  }),React["createElement"]("div",{
    'className':"absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
  },React["createElement"](Coins,{
    'className':"w-3 h-3 text-yellow-400"
  }))),React["createElement"]("button",{
    'onClick':()=>a2(!a1),'className':"p-1.5 rounded border transition-colors "+(a1?"bg-blue-600 border-blue-500 text-white":"bg-gray-700 border-gray-600 text-gray-400"),'title':"Toggle Min Bid Display"
  },a1?React["createElement"](EyeIcon,null):React["createElement"](EyeOffIcon,null)))),React["createElement"]("div",{
    'className':"flex flex-col ml-3"
  },React["createElement"]("span",{
    'className':"text-[10px] text-red-500 font-bold uppercase"
  },"Instant Claim"),React["createElement"]("div",{
    'className':"relative flex items-center gap-1"
  },React["createElement"]("div",{
    'className':"relative"
  },React["createElement"]("input",{
    'type':"number",'value':b3,'onChange':ez=>b4(Math["max"](0x1,parseInt(ez["target"]["value"])||0x1)),'className':"w-24 bg-gray-900/80 border rounded-md pl-6 pr-2 py-1 text-white font-bold outline-none "+(b1?"border-red-500 focus:border-red-400":"border-gray-600/50 text-gray-500"),'disabled':!b1
  }),React["createElement"]("div",{
    'className':"absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
  },React["createElement"](ZapIcon,{
    'className':"w-3 h-3 "+(b1?"text-red-500":"text-gray-500")
  }))),React["createElement"]("button",{
    'onClick':()=>b2(!b1),'className':"w-8 h-[30px] rounded border font-black text-xs transition-colors flex items-center justify-center "+(b1?"bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30":"bg-gray-700 border-gray-600 text-gray-400"),'title':"Activate Instant Claim Win"
  },b1?'ON':"OFF"))),React["createElement"]("div",{
    'className':"flex flex-col ml-3 pl-3 border-l border-gray-700"
  },React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap text-center"
  },"Lock Entries"),React["createElement"]("button",{
    'onClick':()=>b0(!aZ),'className':"relative w-14 h-6 rounded-full transition-colors duration-300 focus:outline-none flex items-center shadow-inner "+(aZ?"bg-orange-500 cursor-pointer":"bg-gray-700 cursor-pointer"),'title':"Lock Entries"
  },React["createElement"]("span",{
    'className':"absolute text-[8px] font-black uppercase text-white transition-opacity "+(aZ?"opacity-100 left-2":"opacity-0")
  },'ON'),React["createElement"]("div",{
    'className':"w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md "+(aZ?"transform translate-x-[36px]":"transform translate-x-[4px]")
  }),React["createElement"]("span",{
    'className':"absolute text-[8px] font-black uppercase text-gray-300 transition-opacity "+(aZ?"opacity-0":"opacity-100 right-2")
  },"OFF"))),React["createElement"]("div",{
    'className':"flex flex-col ml-3 pl-3 border-l border-gray-700 relative"
  },React["createElement"]("div",{
    'className':"absolute -top-3 -right-1 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black border border-white animate-bounce shadow-lg z-10"
  },"NEW"),React["createElement"]("span",{
    'className':"text-[10px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap text-center"
  },"Square Mode"),React["createElement"]("button",{
    'onClick':cl,'className':"relative w-14 h-6 rounded-full transition-colors duration-300 focus:outline-none flex items-center shadow-inner "+(bf?"bg-indigo-600 cursor-pointer":"bg-gray-700 cursor-pointer"),'title':"Toggle Square Mode"
  },React["createElement"]("span",{
    'className':"absolute text-[8px] font-black uppercase text-white transition-opacity "+(bf?"opacity-100 left-2":"opacity-0")
  },'ON'),React["createElement"]("div",{
    'className':"w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md "+(bf?"transform translate-x-[36px]":"transform translate-x-[4px]")
  }),React["createElement"]("span",{
    'className':"absolute text-[8px] font-black uppercase text-gray-300 transition-opacity "+(bf?"opacity-0":"opacity-100 right-2")
  },"OFF"))),React["createElement"]("div",{
    'className':"flex flex-col ml-3 pl-3 border-l border-gray-700"
  },React["createElement"]("span",{
    'className':"text-[10px] font-bold uppercase mb-1 whitespace-nowrap text-center "+(al?"text-red-400":"text-gray-600"),'title':al?"Players eliminated per spin":"Enable Elimination Mode in Settings first"
  },"Multi Elim"),React["createElement"]("div",{
    'className':"flex items-center gap-1"
  },React["createElement"]("input",{
    'type':"number",'min':'2','value':at,'onChange':ez=>{
      var j4=fQ;
      au(ez["target"]["value"]);
      var eA=parseInt(ez["target"]["value"]);
      if(!isNaN(eA)&&eA>=0x2)as(eA);
      
    },'onBlur':()=>{
      var j5=fQ,ez=parseInt(at),eA=isNaN(ez)?0x2:Math["max"](0x2,ez);
      as(eA),au(String(eA));
      
    },'disabled':![],'className':"w-12 bg-gray-900/80 border rounded-md px-1 py-1 text-center text-xs font-bold outline-none "+(al&&ap?"border-red-500/50 text-red-400 focus:border-red-400":"border-gray-600 text-gray-300"),'title':"Players eliminated per spin (X)"
  }),React["createElement"]("button",{
    'onClick':()=>{
      if(!al){
        am(!![]),aq(!![]);
      }else{
        aq(!ap);
      }
    },'className':"w-8 h-[26px] rounded border font-black text-[10px] transition-colors flex items-center justify-center cursor-pointer "+(al&&ap?"bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30":"bg-gray-700 border-gray-600 text-gray-400 hover:text-white"),'title':"Toggle Multi Elimination"
  },al&&ap?'ON':"OFF")))),React["createElement"]("div",{
    'className':"flex flex-row items-center gap-2 ml-2"
  },React["createElement"]("button",{
    'onClick':()=>cx(!![]),'className':"bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg border border-gray-500 transition-all shadow-lg mt-2",'title':"Audio"
  },React["createElement"](MusicIcon,null)),React["createElement"]("button",{
    'onClick':()=>bW(!![]),'className':"p-2 rounded-lg border transition-all mt-2 "+(c3?"bg-pink-600 border-pink-500 text-white":"bg-gray-700 border-gray-500 text-white"),'title':"Widgets"
  },React["createElement"](GiftIcon,null)),React["createElement"]("button",{
    'onClick':()=>bU(!![]),'className':"bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg border border-gray-500 transition-all shadow-lg mt-2",'title':"Settings"
  },React["createElement"](CogIcon,null))))),bV&&React["createElement"]("div",{
    'className':"fixed top-20 right-4 z-[999] w-full max-w-sm"
  },React["createElement"]("div",{
    'className':"bg-gray-900/95 backdrop-blur-md border-2 border-pink-500/50 rounded-xl p-5 shadow-2xl relative animate-slideInRight"
  },React["createElement"]('h2',{
    'className':"text-white font-bold text-base mb-4 flex items-center gap-2"
  },React["createElement"](GiftIcon,{
    'className':"w-5 h-5"
  })," WIDGET SETTINGS"),React["createElement"]("button",{
    'onClick':()=>bW(![]),'className':"absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
  },React["createElement"](CloseIcon,{
    'className':"w-5 h-5"
  })),React["createElement"]("div",{
    'className':"space-y-4 max-h-[75vh] overflow-y-auto modal-scroll pr-2"
  },React["createElement"]("div",{
    'className':"border-b border-gray-700 pb-4"
  },React["createElement"]('h3',{
    'className':"text-blue-400 font-bold text-[10px] uppercase mb-2 tracking-widest"
  },"Presets"),React["createElement"]("div",{
    'className':"grid grid-cols-4 gap-1.5 mb-3"
  },ch["map"](ez=>React["createElement"]("div",{
    'key':ez['id'],'className':"bg-gray-800/80 border border-gray-700 rounded-lg p-1 flex flex-col items-center gap-1 relative group w-full transition-all hover:bg-gray-800 hover:border-blue-500/50"
  },React["createElement"]("div",{
    'className':"w-9 h-9 rounded bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-700 shrink-0"
  },ez["url"]&&React["createElement"](SafeAvatar,{
    'src':((()=>{
      var j6=fQ;
      try{
        var eA=new URLSearchParams(new URL(ez["url"])["search"]);
        return eA["get"]("url")||ez["url"];
        
      }catch(eB){
        return ez["url"];
        
      }
    })()),'name':ez["name"],'className':"w-full h-full object-contain"
  })),React["createElement"]("span",{
    'className':"text-[8px] font-bold text-gray-400 truncate w-full text-center group-hover:text-white transition-colors"
  },ez["name"]?.["split"]('\x20(')[0x0]),React["createElement"]("button",{
    'onClick':()=>cm(ez),'className':"w-full bg-blue-600 hover:bg-blue-500 text-[8px] font-black py-0.5 rounded text-white uppercase transition-colors"
  },"LOAD"),!ez['id']["startsWith"]("def_")&&React["createElement"]("div",{
    'onClick':eA=>co(eA,ez['id']),'className':"absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
  },React["createElement"](TrashIcon,{
    'className':"w-2.5 h-2.5"
  }))))),React["createElement"]("div",{
    'className':"flex flex-col gap-2"
  },React["createElement"]("input",{
    'type':"text",'value':cb,'onChange':ez=>cc(ez["target"]["value"]),'placeholder':"New Preset Name...",'className':"bg-gray-950 border border-gray-700 rounded p-2 text-white text-[10px] outline-none focus:border-blue-500"
  }),React["createElement"]("button",{
    'onClick':cn,'className':"w-full bg-green-700 hover:bg-green-600 text-white text-[10px] font-bold py-2 rounded uppercase transition-colors"
  },"+ SAVE CURRENT STATE"))),React["createElement"]("div",{
    'className':"border-b border-gray-700 pb-4"
  },React["createElement"]('h3',{
    'className':"text-yellow-400 font-bold text-[10px] uppercase mb-2 tracking-widest"
  },"Custom Widget URL"),React["createElement"]("div",{
    'className':"flex gap-2"
  },React["createElement"]("input",{
    'type':"text",'value':c5,'onChange':ez=>c6(ez["target"]["value"]),'placeholder':"Paste URL...",'className':"flex-1 bg-gray-950 border border-gray-700 rounded p-2 text-white text-[10px] outline-none focus:border-yellow-500"
  }),React["createElement"]("button",{
    'onClick':()=>c4(c5["trim"]()),'className':"bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-bold px-3 rounded uppercase transition-colors"
  },"Apply"),React["createElement"]("button",{
    'onClick':()=>cq(c5),'className':"bg-gray-800 text-yellow-500 px-2 rounded hover:bg-yellow-900/30 transition-colors"
  },'★')),cd["length"]>0x0&&React["createElement"]("div",{
    'className':"mt-2 flex gap-2 overflow-x-auto pb-2 modal-scroll"
  },cd["map"]((ez,eA)=>React["createElement"]("div",{
    'key':eA,'onClick':()=>{
      var j7=fQ;
      c6(ez["url"]),c4(ez["url"]);
      
    },'className':"relative flex-shrink-0 w-10 h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:border-yellow-500 group overflow-hidden"
  },React["createElement"](SafeAvatar,{
    'src':ez["img"],'name':ez["name"],'className':"w-full h-full object-contain p-1"
  }),React["createElement"]("div",{
    'onClick':eB=>cr(eB,ez["url"]),'className':"absolute top-0 right-0 bg-red-600 text-white w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
  },'×'))))),React["createElement"]("div",{
    'className':"space-y-3"
  },React["createElement"]("div",null,React["createElement"]('p',{
    'className':"text-gray-400 text-[10px] uppercase font-bold mb-1"
  },"Widget Size: ",c7,'%'),React["createElement"]("input",{
    'type':"range",'min':'50','max':"250",'value':c7,'onChange':ez=>c8(parseInt(ez["target"]["value"])),'className':"w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
  })),React["createElement"]("div",null,React["createElement"]('p',{
    'className':"text-gray-400 text-[10px] uppercase font-bold mb-1"
  },"Position"),React["createElement"]("div",{
    'className':"grid grid-cols-3 gap-1"
  },["top-left","top-right",null,"bottom-left","bottom-center","bottom-right"]["map"]((ez,eA)=>ez?React["createElement"]("button",{
    'key':ez,'onClick':()=>ca(ez),'className':"py-1 rounded border text-[8px] font-bold uppercase "+(c9===ez?"bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30":"bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300")
  },ez["replace"]('-','\x20')):React["createElement"]("div",{
    'key':eA
  }))))),React["createElement"]("button",{
    'onClick':()=>{
      c4(''),c6('');
      
    },'className':"w-full bg-red-900/50 hover:bg-red-700 text-red-100 font-bold py-2 rounded text-[10px] transition-colors border border-red-800/50 uppercase"
  },"Remove Widget"))))),bG&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[1000] flex items-center justify-center p-4"
  },React["createElement"]("div",{
    'className':"absolute inset-0 bg-black/80 backdrop-blur-md",'onClick':()=>bH(![])
  }),React["createElement"]("div",{
    'className':"relative bg-gray-900 border-2 border-blue-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-scaleIn"
  },React["createElement"]("div",{
    'className':"p-4 border-b border-white/10 flex items-center justify-between bg-blue-900/20"
  },React["createElement"]('h2',{
    'className':"text-white font-black text-xl flex items-center gap-3"
  },React["createElement"](TimerIcon,{
    'className':"text-blue-400"
  })," WHEEL HISTORY"),React["createElement"]("button",{
    'onClick':()=>bH(![]),'className':"text-gray-400 hover:text-white p-2"
  },React["createElement"](CloseIcon,{
    'className':"w-6 h-6"
  }))),React["createElement"]("div",{
    'className':"p-4 max-h-[60vh] overflow-y-auto modal-scroll space-y-3"
  },bE["length"]===0x0?React["createElement"]("div",{
    'className':"text-center py-10 text-gray-500 font-bold italic"
  },"No history recorded yet. Snapshots are taken on Spin, Reset or Winner declaration."):bE["map"](ez=>React["createElement"]("div",{
    'key':ez['id'],'className':"bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:bg-white/10 transition-colors"
  },React["createElement"]("div",{
    'className':"flex-1"
  },React["createElement"]("div",{
    'className':"flex items-center gap-2 mb-1"
  },React["createElement"]("span",{
    'className':"text-blue-400 font-black text-xs uppercase"
  },ez["reason"]),React["createElement"]("span",{
    'className':"text-gray-500 text-[10px]"
  },ez["date"]," - ",ez["time"])),React["createElement"]("div",{
    'className':"flex items-center gap-4"
  },React["createElement"]("div",{
    'className':"flex items-center gap-1.5"
  },React["createElement"](UsersIcon,{
    'className':"w-3.5 h-3.5 text-gray-400"
  }),React["createElement"]("span",{
    'className':"text-white font-bold text-sm"
  },ez["playerCount"]," Players")),React["createElement"]("div",{
    'className':"flex items-center gap-1.5"
  },React["createElement"](Coins,{
    'className':"w-3.5 h-3.5 text-yellow-500"
  }),React["createElement"]("span",{
    'className':"text-yellow-500 font-bold text-sm"
  },ez["sessionCoins"]["toLocaleString"]())))),React["createElement"]("button",{
    'onClick':()=>dw(ez),'className':"px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg uppercase shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
  },"RESTORE")))),React["createElement"]("div",{
    'className':"p-4 bg-gray-950/50 border-t border-white/5 text-[10px] text-gray-500 text-center italic"
  },"History is stored locally in your browser. Restoring a snap will overwrite your current wheel state."))),React["createElement"]("div",{
    'className':"flex-1 flex flex-col items-center justify-center relative p-2 overflow-hidden"
  },!k&&React["createElement"]("div",{
    'className':"absolute bottom-3 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-2 bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(0,0,0,0.7)]"
  },React["createElement"]("button",{
    'id':"overlay-cloud-btn",
    'onClick':()=>copyOverlayUrl("cloud"),
    'className':"flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer "+(overlayCopied==="cloud"?"bg-emerald-600 text-white":"bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25"),
    'title':getOverlayUrl("cloud")
  },React["createElement"](LinkIcon,null),React["createElement"]("span",null,overlayCopied==="cloud"?"✓ تم النسخ!":"رابط الأوفرلاي (سحابي)")),React["createElement"]("button",{
    'id':"overlay-full-btn",
    'onClick':()=>copyOverlayUrl("full"),
    'className':"hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer "+(overlayCopied==="full"?"bg-emerald-600 text-white":"bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"),
    'title':getOverlayUrl("full")
  },React["createElement"]("span",null,overlayCopied==="full"?"✓ تم النسخ!":"الرابط الكامل")),React["createElement"]("button",{
    'id':"overlay-local-btn",
    'onClick':()=>copyOverlayUrl("local"),
    'className':"flex items-center gap-1.5 px-2 py-1 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer "+(overlayCopied==="local"?"bg-emerald-600 text-white":"bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-500/30"),
    'title':getOverlayUrl("local")
  },React["createElement"]("span",null,overlayCopied==="local"?"✓ تم النسخ!":"محلي (Local)")),React["createElement"]("span",{
    'className':"hidden lg:inline-block text-[10px] font-mono text-cyan-300 bg-black/60 px-2 py-1 rounded border border-white/10 select-all max-w-[280px] truncate"
  },getOverlayUrl("cloud")),React["createElement"]("a",{
    'href':getOverlayUrl("cloud"),
    'target':"_blank",
    'rel':"noopener noreferrer",
    'className':"px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-bold rounded border border-gray-600 transition-colors",
    'title':"Open Overlay in new tab"
  },"فتح ↗")),!k&&React["createElement"]("div",{
    'className':"absolute bottom-2 right-3 text-white/50 text-xs font-black tracking-widest uppercase select-none pointer-events-none z-30"
  },"POWERED BY mezo"),k&&D["length"]>0x0&&React["createElement"]("div",{
    'className':"absolute bottom-4 left-4 z-[80] w-72 flex flex-col gap-1.5 pointer-events-none"
  },D["map"](ez=>React["createElement"]("div",{
    'key':ez['id'],'className':"chat-msg-enter flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"
  },ez["pic"]&&React["createElement"]("img",{
    'src':ez["pic"],'alt':'','className':"w-6 h-6 rounded-full flex-shrink-0 object-cover",'onError':eA=>eA["target"]["style"]["display"]="none"
  }),React["createElement"]("div",{
    'className':"flex-1 min-w-0 overflow-hidden"
  },React["createElement"]("span",{
    'className':"text-yellow-400 font-bold text-xs mr-1"
  },plainText(ez["name"])),React["createElement"]("span",{
    'className':"text-white text-xs break-all"
  },plainText(ez["text"])))))),!k&&React["createElement"]("div",{
    'className':"absolute top-10 left-4 z-[90] w-72 max-h-[calc(100vh-150px)] flex flex-col gap-2 pointer-events-none"
  },React["createElement"]("div",{
    'className':"bg-black/80 rounded-2xl p-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col gap-2 overflow-hidden max-h-full"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between border-b border-white/10 pb-2 mb-1"
  },React["createElement"]("span",{
    'className':"text-white font-black uppercase text-sm flex items-center gap-2"
  },React["createElement"](UsersIcon,null)," Participants"),React["createElement"]("div",{
    'className':"flex items-center gap-2"
  },React["createElement"]("button",{
    'onClick':()=>bH(!![]),'className':"p-1 px-2 bg-gray-800 hover:bg-gray-700 text-blue-400 text-[9px] font-black rounded border border-white/10 uppercase transition-colors flex items-center gap-1"
  },React["createElement"](TimerIcon,{
    'className':"w-3 h-3"
  })," History"),aZ&&React["createElement"]("span",{
    'className':"text-orange-500 animate-pulse",'title':"Entries Locked"
  },React["createElement"](LockIcon,{
    'className':"w-3 h-3"
  })),React["createElement"]("span",{
    'className':"text-yellow-400 font-mono text-xs font-bold"
  },m["length"]))),!t&&!v&&m["length"]>0x0&&React["createElement"]("div",{
    'className':"flex flex-col gap-1 mb-2 animate-scaleIn"
  },React["createElement"]("button",{
    'onClick':e0,'className':"w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg border border-white/20 transition-transform transform hover:scale-105 active:scale-95"
  },bf?"Launch The Game!":"Launch The Wheel!"),React["createElement"]("button",{
    'onClick':()=>{
      q(!![]),s(![]);
      
    },'className':"w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-white/10 transition-colors"
  },"Start Timer")),React["createElement"]("div",{
    'className':"flex flex-col gap-2 overflow-y-auto pr-1 mt-1 modal-scroll",'style':{
      'maxHeight':"55vh"
    }
  },!t&&(()=>{
    var isLockedAfterSpin=Boolean(aZ&&(b7||t||o));
    return React["createElement"]("div",{
      'className':"flex gap-2 p-2 rounded-lg border border-dashed mb-2 "+(isLockedAfterSpin?"border-red-500/60 bg-red-950/20":aZ?"border-orange-500/50 bg-white/5":"border-white/20 bg-white/5")
    },React["createElement"]("input",{
      'type':"text",'disabled':isLockedAfterSpin,'placeholder':isLockedAfterSpin?"🔒 Locked after spin":"Name",'value':H,'onChange':ez=>I(ez["target"]["value"]),'className':"w-full bg-transparent border-b border-gray-500 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-500 "+(isLockedAfterSpin?"cursor-not-allowed opacity-60":'')
    }),React["createElement"]("input",{
      'type':"number",'disabled':isLockedAfterSpin,'placeholder':'$','value':J,'onChange':ez=>K(ez["target"]["value"]),'className':"w-16 bg-transparent border-b border-gray-500 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-gray-500 "+(isLockedAfterSpin?"cursor-not-allowed opacity-60":'')
    }),React["createElement"]("button",{
      'onClick':dN,'disabled':isLockedAfterSpin,'className':isLockedAfterSpin?"bg-gray-700 text-gray-500 cursor-not-allowed w-8 h-6 rounded flex items-center justify-center font-bold text-lg leading-none":"bg-green-600 hover:bg-green-500 text-white w-8 h-6 rounded flex items-center justify-center font-bold text-lg leading-none transition-colors"
    },'+'));
  })(),liveGifts["length"]>0x0&&React["createElement"]("div",{
    'className':"bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 mb-2 transition-all"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-1.5"
  },React["createElement"]("span",{
    'className':"text-emerald-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5"
  },React["createElement"](GiftIcon,{'className':"w-3.5 h-3.5"})," الهدايا النازلة (Live Gifts)"),React["createElement"]("button",{
    'onClick':()=>setLiveGifts([]),
    'className':"text-[9px] text-gray-400 hover:text-white font-bold uppercase"
  },"Clear")),React["createElement"]("div",{
    'className':"space-y-1 max-h-28 overflow-y-auto modal-scroll pr-1"
  },liveGifts["slice"](0x0,0x6)["map"](g=>React["createElement"]("div",{
    'key':g['id'],
    'className':"flex items-center gap-2 bg-black/50 px-2 py-1 rounded-lg border border-white/5 text-[10px]"
  },g["giftPictureUrl"]?React["createElement"]("img",{
    'src':g["giftPictureUrl"],'alt':'','className':"w-5 h-5 object-contain flex-shrink-0"
  }):React["createElement"](GiftIcon,{'className':"w-4 h-4 text-pink-400 flex-shrink-0"}),React["createElement"]("div",{
    'className':"flex-1 min-w-0 truncate"
  },React["createElement"]("span",{'className':"font-black text-white"},g["userName"]),React["createElement"]("span",{'className':"text-gray-400 ml-1"},g["giftName"]+(g["repeatCount"]>0x1?" x"+g["repeatCount"]:''))),React["createElement"]("div",{
    'className':"flex items-center gap-0.5 text-yellow-400 font-black flex-shrink-0"
  },React["createElement"](Coins,{'className':"w-2.5 h-2.5"}),g["coins"]+(g["totalCoins"]&&g["coins"]<g["totalCoins"]?"/"+g["totalCoins"]:'')))))),ab["length"]>0x0&&React["createElement"]("div",{
    'className':"bg-blue-900/40 border border-blue-500/50 rounded-xl p-3 mb-2 animate-pulse transition-all"
  },React["createElement"]("div",{
    'className':"flex items-center justify-between mb-2"
  },React["createElement"]("span",{
    'className':"text-blue-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 animate-pulse"
  },React["createElement"](ZapIcon,{
    'className':"w-3 h-3"
  })," In Queue"),React["createElement"]("span",{
    'className':"bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded-full font-black shadow-lg"
  },ab["length"])),React["createElement"]("div",{
    'className':"space-y-1.5"
  },ab["slice"](0x0,0x5)["map"]((ez,eA)=>React["createElement"]("div",{
    'key':eA,'className':"flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5 animate-scaleIn"
  },React["createElement"]("div",{
    'className':"w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center border border-white/20 overflow-hidden"
  },React["createElement"](SafeAvatar,{
    'src':ez["pictureProfil"],'name':ez["userName"],'className':"w-full h-full object-cover"
  })),React["createElement"]("span",{
    'className':"text-[10px] text-white font-black truncate flex-1 uppercase tracking-tight"
  },ez["userName"]),React["createElement"]("div",{
    'className':"flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold"
  },React["createElement"](Coins,{
    'className':"w-2.5 h-2.5"
  }),'\x20',ez["coins"]))),ab["length"]>0x5&&React["createElement"]("div",{
    'className':"text-center text-[9px] text-blue-400 font-bold uppercase py-1"
  },'+',ab["length"]-0x5," More waiting..."))),((()=>{
    var j8=fQ,ez={
      
    };
    return m["forEach"](eA=>{
      var j9=j8,eB=eA["userId"]||eA["name"];
      !ez[eB]&&(ez[eB]={
        ...eA,'ticketCount':0x0,'totalCoins':0x0,'joinedViaLike':![]
      });
      ez[eB]["ticketCount"]++,ez[eB]["totalCoins"]+=eA["coins"];
      if(eA["joinedViaLike"])ez[eB]["joinedViaLike"]=!![];
      
    }),Object["values"](ez)["sort"]((eA,eB)=>eB["totalCoins"]-eA["totalCoins"])["map"](eA=>React["createElement"]("div",{
      'key':eA["userId"]||eA["name"],'className':"group flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 transition-all animate-scaleIn "+(F===eA["name"]?"highlight-anim ring-1 ring-green-500":'')
    },React["createElement"]("div",{
      'className':"relative w-10 h-10 flex-shrink-0"
    },React["createElement"](SafeAvatar,{
      'src':eA["pic"],'name':eA["name"],'className':"absolute inset-0 w-full h-full rounded-full object-cover",'style':{
        'backgroundColor':eA["color"]
      }
    }),eA["ticketCount"]>0x1&&React["createElement"]("div",{
      'className':"absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/30 shadow-lg"
    },eA["ticketCount"])),React["createElement"]("div",{
      'className':"flex-1 min-w-0"
    },React["createElement"]("div",{
      'className':"text-white font-black text-sm truncate uppercase tracking-wide flex items-center gap-2"
    },eA["name"],eA["joinedViaLike"]&&React["createElement"](HeartIcon,{
      'className':"w-3 h-3 text-pink-400 flex-shrink-0"
    }),eA["ticketCount"]>0x1&&React["createElement"]("span",{
      'className':"text-[10px] text-blue-400 normal-case font-bold"
    },'(',eA["ticketCount"]," slots)")),React["createElement"]("div",{
      'className':"flex items-center gap-1 text-yellow-400 text-xs font-bold"
    },React["createElement"](Coins,{
      'className':"w-3 h-3 text-yellow-400"
    }),eA["totalCoins"]["toLocaleString"]())),!t&&React["createElement"]("button",{
      'onClick':()=>{
        var targetUser = eA["userId"] || eA["name"];
        if(cR["current"]) delete cR["current"][targetUser];
        if(cQ["current"]) delete cQ["current"][targetUser];
        a8(prev => { var cp = {...prev}; delete cp[targetUser]; return cp; });
        a6(prev => { var cp = {...prev}; delete cp[targetUser]; return cp; });
        cU["current"] = (cU["current"] || []).filter(p => (p["userId"] || p["name"]) !== targetUser);
        n(prev => prev.filter(p => (p["userId"] || p["name"]) !== targetUser));
        if(dX["current"]) dX["current"]();
      },'className':"text-red-500 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded cursor-pointer",'title':"حذف المشترك بالكامل (All slots)"
    },React["createElement"](TrashIconOutline,null))));
    
  })())))),React["createElement"]("div",{
    'ref':ei,'className':"relative flex-1 w-full flex "+(k?"flex-col":'')+" items-center justify-center max-h-full "+(k?"pt-4 pb-4":"min-h-0 overflow-hidden")
  },k&&React["createElement"]("div",{
    'className':"absolute left-1/2 flex flex-col items-center gap-1 pointer-events-none z-50 origin-bottom",'style':{
      'bottom':"calc(50% + "+(0x1a4*eg/0x2-eo)+"px + "+(0x6+ef*eg)+"px)",'transform':"translateX(-50%) scale("+ep+')'
    }
  },React["createElement"]("div",{
    'ref':e6,'className':"flex flex-col items-center gap-1"
  },(L||al&&b7||!b7&&bA>0x0&&o)&&!v&&React["createElement"]("div",{
    'className':"flex flex-col items-center"
  },React["createElement"]("div",{
    'className':"font-black super-outline tracking-tighter filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] "+(al&&b7?"text-red-500":"text-white")+" flex items-center leading-none text-6xl mb-1"
  },e1(V)),!b7&&o&&!r&&(bC?new Set(m["map"](ez=>ez["userId"]||ez["name"]))["size"]<bA:m["length"]<bA)&&React["createElement"]("div",{
    'className':"text-blue-400 bg-blue-900/80 font-black text-[10px] tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400 animate-pulse whitespace-nowrap mt-2"
  },"WAITING FOR ",bA-(bC?new Set(m["map"](ez=>ez["userId"]||ez["name"]))["size"]:m["length"]),'\x20',bC?"UNIQUE ":'',"PLAYERS")),aZ&&!v&&React["createElement"]("div",{
    'className':"text-white bg-orange-600/95 font-black text-xs tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] border border-white animate-pulse whitespace-nowrap"
  },"ENTRIES LOCKED"),al&&an&&!v&&React["createElement"]("div",{
    'className':"text-black bg-yellow-400 font-black text-lg tracking-[0.3em] px-6 py-1.5 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)] border-2 border-white whitespace-nowrap"
  },"ELIMINATION MODE")),aJ&&React["createElement"]("div",{
    'className':"mt-1",'style':{
      'visibility':v?"hidden":"visible",'width':eb['w']>0x0?eb['w']*eq:"auto",'height':eb['h']>0x0?eb['h']*eq:"auto"
    }
  },React["createElement"]("div",{
    'ref':e7,'style':{
      'width':"max-content",'transform':"scale("+eq+')','transformOrigin':"top left"
    }
  },React["createElement"](SessionHud,{
    'theme':aL,'alive':er,'total':Math["max"](aD["totalPlayers"]||0x0,er),'entries':m["length"],'coins':et,'vouch':aN,'showVouch':aP,'vouchPulse':aT,'gift':cf,'giftSide':e8,'minBid':Z,'showMin':a1
  })))),React["createElement"]("div",{
    'className':"relative flex items-center justify-center transition-transform duration-500 ease-in-out",'style':{
      'transform':k?"translateY("+eo+"px) scale("+eg+')':"translateY("+en["shift"]+"px) scale("+en["scale"]+')','transformOrigin':"center center"
    }
  },React["createElement"]("div",{
    'ref':k?undefined:ej,'className':"relative flex items-center justify-center "+(k?"w-[420px] h-[420px]":"w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[360px] lg:h-[360px] xl:w-[400px] xl:h-[400px] 2xl:w-[440px] 2xl:h-[440px]")
  },!k&&React["createElement"]("div",{
    'ref':ek,'className':"absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50 pointer-events-none transition-all origin-bottom "+(al&&an||aZ?"bottom-full mb-2":"bottom-full mb-14")
  },(L||al&&b7||!b7&&bA>0x0&&o)&&!v&&React["createElement"]("div",{
    'className':"flex flex-col items-center"
  },React["createElement"]("div",{
    'className':"font-black super-outline tracking-tighter filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] "+(al&&b7?"text-red-500":"text-white")+" flex items-center leading-none text-5xl lg:text-6xl 2xl:text-7xl mb-1"
  },e1(V)),!b7&&o&&!r&&(bC?new Set(m["map"](ez=>ez["userId"]||ez["name"]))["size"]<bA:m["length"]<bA)&&React["createElement"]("div",{
    'className':"text-blue-400 bg-blue-900/80 font-black text-[10px] tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400 animate-pulse whitespace-nowrap mt-2"
  },"WAITING FOR ",bA-(bC?new Set(m["map"](ez=>ez["userId"]||ez["name"]))["size"]:m["length"]),'\x20',bC?"UNIQUE ":'',"PLAYERS")),aZ&&!v&&React["createElement"]("div",{
    'className':"text-white bg-orange-600/95 font-black text-xs tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] border border-white animate-pulse whitespace-nowrap mb-2 scale-75 lg:scale-95 origin-top"
  },"ENTRIES LOCKED"),al&&an&&!v?React["createElement"]("div",{
    'className':"flex flex-col items-center gap-1 mb-6 scale-75 lg:scale-95 origin-top"
  },al&&an&&React["createElement"]("div",{
    'className':"text-black bg-yellow-400 font-black text-lg tracking-[0.3em] px-6 lg:px-10 py-1.5 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)] border-2 border-white whitespace-nowrap"
  },"ELIMINATION MODE")):null,aJ&&!v&&React["createElement"]("div",{
    'className':"mb-2 scale-75 lg:scale-90 origin-bottom"
  },React["createElement"](SessionHud,{
    'theme':aL,'alive':er,'total':Math["max"](aD["totalPlayers"]||0x0,er),'entries':m["length"],'coins':et,'vouch':aN,'showVouch':aP,'vouchPulse':aT,'gift':cf,'giftSide':null,'minBid':Z,'showMin':a1
  }))),bZ&&er===0x2&&!v&&React["createElement"]("div",{
    'className':"absolute left-1/2 -translate-x-1/2 top-full flex flex-col items-center z-[60] pointer-events-none origin-top "+(k?"mt-3":"mt-4")
  },React["createElement"](DuelBanner,{
    'a':es[0x0],'b':es[0x1]
  })),cs&&React["createElement"]("div",{
    'className':"absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg animate-scaleIn border-2 border-white/50 whitespace-nowrap pointer-events-none"
  },cs),!bf&&React["createElement"]("div",{
    'className':"absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-[60] filter drop-shadow-xl"
  },React["createElement"]("div",{
    'className':"triangle-down",'style':dt==="gold_luxury"?{
      'borderTopColor':"#FFD700"
    }:{
      
    }
  })),(bf&&!e8&&(a1||cf)||b1)&&((()=>{
    var jb=fQ,ez="-top-5 left-1/2 -translate-x-1/2",eA="origin-bottom";
    if(bf)switch(c9){
      case "top-left":ez="-top-10 -left-6",eA="origin-bottom-left";
      break;
      case "top-right":ez="-top-10 -right-6",eA="origin-bottom-right";
      break;
      case "bottom-left":ez="-bottom-10 -left-6",eA="origin-top-left";
      break;
      case "bottom-right":ez="-bottom-10 -right-6",eA="origin-top-right";
      break;
      case "bottom-center":ez="-bottom-12 left-1/2 -translate-x-1/2",eA="origin-top";
      break;
      default:ez="-top-10 -left-6",eA="origin-bottom-left";
      
    }else ez=k?"flex items-center justify-center gap-2 lg:gap-3 -top-3 scale-[0.70]":"flex items-center justify-center gap-2 lg:gap-3 -top-5 scale-100";
    if(!bf)return null;
    return React["createElement"]("div",{
      'className':"absolute z-[100] transition-all flex flex-col items-center gap-1 "+ez+'\x20'+(bf?"scale-125":'')+'\x20'+eA
    },bf?React["createElement"](React["Fragment"],null,cf&&React["createElement"]("div",{
      'className':"relative animate-bounce-slow"
    },React["createElement"](SafeAvatar,{
      'src':cf["url"],'name':cf["name"],'className':"object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]",'style':{
        'width':0x30*(c7/0x64)+'px','height':0x30*(c7/0x64)+'px'
      }
    })),a1&&React["createElement"]("div",{
      'className':"bg-yellow-400 border border-white rounded-full px-3 py-0.5 flex items-center gap-1.5 shadow-lg -mt-1 transition-transform",'style':{
        'transform':"scale("+c7/0x64+')','transformOrigin':"top"
      }
    },React["createElement"](Coins,{
      'className':"w-3 h-3 text-black"
    }),React["createElement"]("span",{
      'className':"text-black font-black text-xs"
    },Z))):null);
    
  })()),React["createElement"]("div",{
    'className':"w-full h-full relative "+(bf?"overflow-visible":"overflow-hidden")+" box-border "+(bf?dt==="laagency_dark"?"bg-[#0f172a]/80 rounded-2xl border-[6px] border-[#3b82f6] shadow-[0_0_40px_rgba(59,130,246,0.4)] ring-4 ring-[#1d4ed8]":dt==="neon_vibes"?"bg-gray-950/80 rounded-2xl border-[6px] border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)] ring-4 ring-fuchsia-500":dt==="gold_luxury"?"bg-black/80 rounded-2xl border-[6px] border-yellow-700 shadow-[0_0_40px_rgba(234,179,8,0.4)] ring-4 ring-yellow-200":dt==="cyberpunk"?"bg-gray-950/80 rounded-2xl border-[6px] border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.3)] ring-4 ring-cyan-400":dt==='og'?"bg-[#0d0d12]/80 rounded-2xl border-[6px] border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-300":dt==="lava"?"bg-black/80 rounded-2xl border-[6px] border-red-600 shadow-[0_0_40px_rgba(239,68,68,0.4)] ring-4 ring-orange-500":"bg-gray-900/40 rounded-2xl border-2 border-white/10 shadow-2xl":dt==="rainbow"?"shadow-[0_0_40px_rgba(255,105,180,0.3)] border-[12px] border-pink-500 bg-gray-900 ring-8 ring-purple-500 rounded-full":dt==="laagency_dark"?"shadow-[0_0_50px_rgba(30,64,175,0.6)] border-[14px] border-[#3b82f6] bg-[#0f172a] ring-[6px] ring-[#1d4ed8] ring-offset-2 ring-offset-[#0f172a] rounded-full":dt==="neon_vibes"?"shadow-[0_0_40px_rgba(139,92,246,0.4)] border-[12px] border-purple-500 bg-gray-900 ring-4 ring-fuchsia-500 rounded-full":dt==='og'?"shadow-[0_0_30px_rgba(16,185,129,0.2)] border-[12px] border-[#0d0d12] bg-[#0d0d12] ring-4 ring-emerald-500 rounded-full":dt==="cyberpunk"?"shadow-[0_0_40px_rgba(250,204,21,0.3)] border-[12px] border-yellow-400 bg-gray-900 ring-4 ring-cyan-400 rounded-full":dt==="galaxy"?"shadow-[0_0_40px_rgba(147,51,234,0.3)] border-[12px] border-purple-700 bg-black ring-4 ring-blue-600 rounded-full":dt==="lava"?"shadow-[0_0_40px_rgba(239,68,68,0.3)] border-[12px] border-orange-600 bg-black ring-4 ring-red-600 rounded-full":dt==="candy"?"shadow-[0_0_30px_rgba(244,114,182,0.3)] border-[12px] border-pink-400 bg-white ring-4 ring-blue-300 rounded-full":dt==="toxic_glow"?"shadow-[0_0_40px_rgba(132,204,22,0.3)] border-[12px] border-lime-500 bg-black ring-4 ring-green-600 rounded-full":dt==="dark_luxury"?"shadow-[0_0_30px_rgba(255,215,0,0.2)] border-[12px] border-gray-900 bg-black ring-4 ring-yellow-600 rounded-full":dt==="gold_luxury"?"shadow-[0_0_50px_rgba(255,215,0,0.4)] border-[14px] border-yellow-700 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 ring-4 ring-yellow-200 rounded-full":dt==="modern_glass"?"shadow-[0_0_20px_rgba(255,255,255,0.1)] border-[12px] border-white/20 bg-black/40 ring-4 ring-white/10 backdrop-blur-xl rounded-full":dt==="custom"?"shadow-2xl border-[12px] ring-4 ring-white/10 rounded-full":"shadow-[0_0_30px_rgba(59,130,246,0.2)] border-[12px] border-gray-800 bg-gray-900 ring-4 ring-white/10 rounded-full"),'style':!bf&&dt==="custom"?{
      'backgroundColor':ad,'borderColor':af
    }:{
      
    }
  },bf&&b1&&!v&&React["createElement"](React["Fragment"],null,React["createElement"]("div",{
    'className':"absolute -top-4 left-1/2 -translate-x-1/2 z-[110] pointer-events-none animate-scaleIn"
  },React["createElement"]("div",{
    'className':"bg-red-600 border-2 border-white rounded-lg px-3 py-1 flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.6)]"
  },React["createElement"](ZapIcon,{
    'className':"w-5 h-5 text-white animate-pulse"
  }),React["createElement"]("span",{
    'className':"text-white font-black text-lg italic tracking-tighter drop-shadow-md"
  },b3["toLocaleString"]())))),React["createElement"]("div",{
    'ref':cM,'className':"w-full h-full relative"
  },bf&&React["createElement"]("div",{
    'className':"absolute inset-0 flex pointer-events-none z-0"
  },dt==="laagency_dark"&&React["createElement"]("div",{
    'className':"w-full h-full flex items-end justify-center pb-8 opacity-60"
  },React["createElement"]("div",{
    'className':"flex items-center gap-3 bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm border border-cyan-500/20"
  },React["createElement"]("span",{
    'className':"text-cyan-400 font-black text-2xl tracking-wider uppercase"
  },"mezo"))),React["createElement"]("div",{
    'className':"absolute inset-0 flex items-center justify-center opacity-10"
  },dt==="gold_luxury"&&React["createElement"]("div",{
    'className':"text-yellow-500/20 font-black text-6xl uppercase rotate-12 tracking-widest"
  },"LUXURY"),dt==="cyberpunk"&&React["createElement"]("div",{
    'className':"text-cyan-400/20 font-black text-6xl uppercase -rotate-12 tracking-widest"
  },"CYBER"))),bf?React["createElement"](SquareGrid,{
    'players':dY,'highlightIndex':bh,'isEliminationMode':al,'showWinner':v,'winner':x,'wheelScale':bN,'wheelTheme':dt,'instantClaimEnabled':b1,'instantClaimAmount':b3,'multiElimRevealed':az
  }):React["createElement"](WheelSVG,{
    'slices':dY,'isProportional':ah,'lastUpdatedPlayer':F,'theme':dt,'wheelBgColor':ad,'wheelBorderColor':af,'multiElimRevealed':az
  })),!bf&&React["createElement"]("div",{
    'className':"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "+("w-[32%] h-[32%] bg-gradient-to-br from-gray-800/95 to-gray-950/95 border-[6px] border-cyan-500/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.35)]")+" rounded-full flex flex-col items-center justify-center z-30 overflow-visible transition-all duration-300 "+(dt==="gold_luxury"?"border-yellow-500 shadow-[0_0_30px_rgba(255,215,0,0.4)]":'')
  },(!cf||dt==="laagency_dark")&&React["createElement"]("div",{
    'className':"absolute inset-0 flex flex-col items-center justify-center transition-transform "+(k?"scale-[1.0]":"scale-[0.9]")+" w-full h-full z-10 opacity-100 animate-logo-float"
  },React["createElement"]("div",{
    'className':"flex flex-col items-center select-none filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
  },React["createElement"]("span",{
    'className':"text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-black text-2xl lg:text-3xl leading-none tracking-wider uppercase"
  },"mezo"),React["createElement"]("span",{
    'className':"text-white/80 font-black text-[9px] lg:text-[10px] leading-none tracking-[0.25em] mt-1 uppercase"
  },"ARENA"))),cf&&cf["url"]&&dt!=="laagency_dark"&&React["createElement"]("div",{
    'className':"flex flex-col items-center justify-center w-full h-full relative p-2 z-20"
  },React["createElement"]("div",{
    'className':"relative group animate-logo-float flex items-center justify-center w-full h-full"
  },React["createElement"]("div",{
    'className':"absolute inset-0 bg-yellow-400/5 blur-xl rounded-full"
  }),React["createElement"](SafeAvatar,{
    'src':cf["url"],'name':cf["name"],'className':"object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] z-10 transition-transform duration-300",'style':{
      'width':(k?0x55:0x52*(c7/0x64))+'%','height':(k?0x55:0x52*(c7/0x64))+'%'
    }
  }),cf["cost"]&&React["createElement"]("div",{
    'className':"absolute bottom-[10%] left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full border border-yellow-500/30 whitespace-nowrap shadow-xl z-20 flex items-center gap-1 scale-[0.8]"
  },React["createElement"](Coins,{
    'className':"w-3 h-3"
  }),'\x20',cf["cost"]))),React["createElement"]("div",{
    'className':"absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[120%] flex flex-col items-center gap-1 z-50"
  },(a1||b1)&&React["createElement"]("div",{
    'className':"flex items-center bg-black/80 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 whitespace-nowrap overflow-hidden "+(k?"scale-110":"scale-95")
  },a1&&React["createElement"]("div",{
    'className':"flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
  },React["createElement"](Coins,{
    'className':"w-3.5 h-3.5 text-amber-400"
  }),React["createElement"]("span",{
    'className':(dt==='og'?"text-[9px]":"text-[11px]")+" text-amber-400 font-black uppercase tracking-tight"
  },Z)),a1&&b1&&React["createElement"]("div",{
    'className':"w-[1px] h-4 bg-white/20"
  }),b1&&React["createElement"]("div",{
    'className':"flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
  },React["createElement"](ZapIcon,{
    'className':"w-3.5 h-3.5 animate-pulse text-rose-400"
  }),React["createElement"]("span",{
    'className':(dt==='og'?"text-[9px]":"text-[11px]")+" text-rose-400 font-black uppercase tracking-tight"
  },b3))))),ax&&React["createElement"]("div",{
    'className':"absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
  },React["createElement"]("div",{
    'className':"absolute inset-0 bg-black/20 pointer-events-none"
  }),React["createElement"]("div",{
    'className':"relative z-10 flex flex-col items-center justify-center text-center rounded-2xl border-4 border-red-500 bg-gray-950/95 shadow-[0_0_50px_rgba(239,68,68,0.6)] select-none",
    'style':{'width':"290px",'height':"195px",'minWidth':"290px",'minHeight':"195px",'maxWidth':"290px",'maxHeight':"195px",'boxSizing':"border-box",'padding':"10px"}
  },React["createElement"]("span",{
    'className':"text-[11px] font-black text-red-400 uppercase tracking-[0.35em] leading-none mb-1 animate-pulse"
  },"ELIMINATING"),React["createElement"]("div",{
    'className':"text-5xl font-black text-red-500 super-outline leading-none my-1 h-12 flex items-center justify-center"
  },az["length"]),React["createElement"]("div",{
    'className':"grid grid-cols-5 gap-1.5 w-[240px] h-[78px]"
  },Array["from"]({'length':0xa})["map"]((_,eIdx)=>{
    var slotItem=az["slice"](-0xa)[eIdx];
    return React["createElement"]("div",{
      'key':"elim_slot_"+eIdx,
      'className':"w-9 h-9 rounded-lg border-2 overflow-hidden flex items-center justify-center text-center "+(slotItem?"border-red-500 bg-gray-800 shadow-[0_0_12px_rgba(239,68,68,0.7)]":"border-red-950/60 bg-black/40")
    },slotItem?(slotItem["pic"]?React["createElement"](SafeAvatar,{
      'src':slotItem["pic"],'name':slotItem["name"],'className':"w-full h-full object-cover grayscale"
    }):React["createElement"]("div",{
      'className':"w-full h-full bg-red-950/80 flex items-center justify-center font-black text-[9px] text-red-200 p-0.5 text-center break-words leading-tight select-none"
    },plainText(slotItem["name"]))):null);
  })))),v&&x&&React["createElement"]("div",{
    'className':"absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
  },React["createElement"]("div",{
    'className':"absolute inset-0 pointer-events-none z-0"
  },[...Array(0x14)]["map"]((ez,eA)=>React["createElement"]("div",{
    'key':eA,'className':"confetti",'style':{
      'left':Math["random"]()*0x64+'%','animationDelay':Math["random"]()*0x2+'s','backgroundColor':ey[Math["floor"](Math["random"]()*ey["length"])]
    }
  }))),React["createElement"]("div",{
    'className':"relative z-50 w-[94%] max-w-[420px] max-h-[88vh] border-4 flex flex-col items-center justify-center text-center p-4 rounded-3xl shadow-[0_0_70px_rgba(0,0,0,0.95)] overflow-hidden "+(ev?"border-yellow-400 bg-gray-950/98 shadow-[0_0_60px_rgba(250,204,21,0.5)]":"border-red-500 bg-gray-950/98 shadow-[0_0_60px_rgba(239,68,68,0.6)]")+" backdrop-blur-2xl",'style':{
      'fontFamily':"'Montserrat', sans-serif",'scrollbarWidth':"none"
    }
  },React["createElement"]("div",{
    'className':"absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/60 via-gray-950/90 to-black/98 opacity-95 pointer-events-none"
  }),React["createElement"]("div",{
    'className':"relative z-50 flex flex-col items-center w-full px-2 py-1 my-auto max-h-full overflow-hidden select-none"
  },React["createElement"]('h3',{
    'className':"font-black tracking-[0.25em] uppercase mb-2 drop-shadow-md text-2xl "+(ev?"text-yellow-400":"text-red-500 animate-pulse")
  },ev?"👑 WINNER 👑":"💀 ELIMINATED 💀"),ev?React["createElement"](React["Fragment"],null,React["createElement"]("div",{
    'className':"relative w-28 h-28 rounded-2xl border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] overflow-hidden bg-gray-900 mx-auto my-2 flex items-center justify-center"
  },x["pic"]?React["createElement"]("img",{
    'src':x["pic"],'alt':'','className':"w-full h-full object-cover"
  }):React["createElement"]("div",{
    'className':"w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-600 to-yellow-400 font-black text-xl text-white px-2 text-center break-words leading-tight"
  },plainText(x["name"])),x["isInstantClaim"]&&React["createElement"]("div",{
    'className':"absolute inset-0 flex items-center justify-center bg-red-600/30"
  },React["createElement"](ZapIcon,{
    'className':"w-12 h-12 text-yellow-300 animate-pulse filter drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"
  }))),React["createElement"]("div",{
    'className':"max-w-full px-2"
  },React["createElement"]('h2',{
    'className':"text-2xl font-black text-white super-outline leading-tight drop-shadow-xl mt-1 break-words w-full"
  },plainText(x["name"])))) : (av["length"]===0x0 ? React["createElement"](React["Fragment"],null,React["createElement"]("div",{
    'className':"w-28 h-32 rounded-2xl border-4 border-red-500 bg-gray-900 shadow-[0_0_25px_rgba(239,68,68,0.5)] overflow-hidden flex flex-col items-center justify-between my-2"
  },React["createElement"]("div",{
    'className':"relative w-full flex-1 flex items-center justify-center overflow-hidden bg-gray-800"
  },x["pic"]?React["createElement"]("img",{
    'src':x["pic"],'alt':'','className':"w-full h-full object-cover grayscale"
  }):React["createElement"]("div",{
    'className':"w-full h-full bg-gradient-to-br from-red-950/90 to-gray-900 flex items-center justify-center p-1"
  },React["createElement"]("div",{
    'className':"w-12 h-12 rounded-full bg-red-600/30 border-2 border-red-500/60 flex items-center justify-center text-lg font-black text-red-200 shadow-inner uppercase"
  },getInitials(x["name"])))),React["createElement"]("div",{
    'className':"w-full bg-black/90 py-1 px-1 text-center"
  },React["createElement"]("span",{
    'className':"text-xs font-black text-white uppercase truncate block"
  },plainText(x["name"])))),React["createElement"]("div",{
    'className':"max-w-full px-2"
  },React["createElement"]('h2',{
    'className':"text-xl font-black text-red-400 super-outline leading-tight drop-shadow-xl break-words w-full"
  },plainText(x["name"])))) : React["createElement"]("div",{
    'className':"flex flex-wrap justify-center items-center gap-2 max-w-[380px] max-h-[240px] overflow-hidden my-2 select-none"
  },Array["from"](new Map([x,...av]["map"](p=>[p["userId"]||p["name"],p]))["values"]())["slice"](0x0,0x8)["map"]((ez,eA)=>React["createElement"]("div",{
    'key':"elim_card_"+eA,
    'className':"w-[82px] h-[96px] rounded-xl border-2 border-red-500 bg-gray-900 shadow-[0_0_12px_rgba(239,68,68,0.5)] overflow-hidden flex flex-col items-center justify-between"
  },React["createElement"]("div",{
    'className':"relative w-full flex-1 flex items-center justify-center overflow-hidden bg-gray-800"
  },ez["pic"]?React["createElement"]("img",{
    'src':ez["pic"],'alt':'','className':"w-full h-full object-cover grayscale"
  }):React["createElement"]("div",{
    'className':"w-full h-full bg-gradient-to-br from-red-950/90 to-gray-900 flex items-center justify-center p-1"
  },React["createElement"]("div",{
    'className':"w-9 h-9 rounded-full bg-red-600/30 border border-red-500/60 flex items-center justify-center text-xs font-black text-red-200 shadow-inner uppercase"
  },getInitials(ez["name"])))),React["createElement"]("div",{
    'className':"w-full bg-black/90 py-0.5 px-1 text-center"
  },React["createElement"]("span",{
    'className':"text-[10px] font-black text-white uppercase truncate block"
  },plainText(ez["name"]))))))),aH&&aF&&React["createElement"]("div",{
    'className':"flex flex-col items-center gap-1 mt-1.5 w-full"
  },React["createElement"]("div",{
    'className':"flex items-center gap-1.5 px-3 py-1 rounded-full border bg-black/50 "+(ev?"border-yellow-500/50":"border-red-500/50")
  },React["createElement"]("span",{
    'className':"text-[10px] font-black text-gray-300 uppercase tracking-wide"
  },"total coins spent:"),React["createElement"]("span",{
    'className':"text-[11px] font-black "+(ev?"text-yellow-400":"text-red-400")
  },Number(aF["coins"]??aF["coinsSpent"]??0x0)["toLocaleString"]()),React["createElement"](Coins,{
    'className':"w-3 h-3 text-amber-400"
  })),React["createElement"]("div",{
    'className':"flex items-center justify-center gap-2 text-[10px] font-bold text-gray-300 flex-wrap px-2"
  },React["createElement"]("span",{
    'className':"flex items-center gap-1"
  },React["createElement"](RefreshIcon,{
    'className':"w-3 h-3 text-gray-400"
  }),Number(aF["spins"]??aF["spinsCount"]??0x1)," spin",Number(aF["spins"]??aF["spinsCount"]??0x1)>0x1?'s':''),React["createElement"]("span",{
    'className':"text-gray-600"
  },'·'),React["createElement"]("span",{
    'className':"flex items-center gap-1"
  },React["createElement"](UsersIcon,{
    'className':"w-3 h-3 text-gray-400"
  }),"beat ",Number(aF["beat"]??aF["playersBeaten"]??0x0)["toLocaleString"]()," player",Number(aF["beat"]??aF["playersBeaten"]??0x0)>0x1?'s':'')),React["createElement"]("div",{
    'className':"flex items-center gap-1 text-[10px] font-bold text-gray-400"
  },React["createElement"](LayersIcon,null),Number(aF["entries"]??aF["winnerEntries"]??0x1)["toLocaleString"]()," board entr",Number(aF["entries"]??aF["winnerEntries"]??0x1)===0x1?'y':"ies"),Number(aF["totalPlayers"]??0x0)>0x0&&React["createElement"]("div",{
    'className':"w-full max-w-[300px] mt-2"
  },React["createElement"]("div",{
    'className':"text-[8px] font-black text-white/35 uppercase tracking-[0.3em] text-center mb-1"
  },"session"),React["createElement"]("div",{
    'className':"grid grid-cols-3 gap-1.5"
  },React["createElement"]("div",{
    'className':"bg-black/50 rounded-xl border border-white/10 py-1.5 px-1 text-center"
  },React["createElement"]("div",{
    'className':"text-white text-sm font-black leading-none"
  },Number(aF["totalPlayers"]??0x0)["toLocaleString"]()),React["createElement"]("div",{
    'className':"text-[7px] font-bold text-white/45 uppercase tracking-wider mt-1"
  },"players")),React["createElement"]("div",{
    'className':"bg-black/50 rounded-xl border border-white/10 py-1.5 px-1 text-center"
  },React["createElement"]("div",{
    'className':"text-white text-sm font-black leading-none"
  },Number(aF["totalEntries"]??0x0)["toLocaleString"]()),React["createElement"]("div",{
    'className':"text-[7px] font-bold text-white/45 uppercase tracking-wider mt-1"
  },"entries")),React["createElement"]("div",{
    'className':"bg-black/50 rounded-xl border border-amber-500/25 py-1.5 px-1 text-center"
  },React["createElement"]("div",{
    'className':"text-amber-400 text-sm font-black leading-none"
  },Number(aF["totalCoins"]||0x0)["toLocaleString"]()),React["createElement"]("div",{
    'className':"text-[7px] font-bold text-amber-500/50 uppercase tracking-wider mt-1"
  },"coins"))))),ev&&B&&React["createElement"]("div",{
    'key':B['ts'],'className':"w-full max-w-[300px] mt-4 animate-fadeIn relative group"
  },React["createElement"]("div",{
    'className':"text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] text-center mb-1 drop-shadow-lg flex items-center justify-center gap-2"
  },React["createElement"]("div",{
    'className':"h-px w-6 bg-gradient-to-r from-transparent to-amber-500/50"
  }),React["createElement"](Crown,{
    'className':"w-3.5 h-3.5"
  }),React["createElement"]("span",{
    'style':{
      'fontFamily':"'Montserrat', sans-serif"
    }
  },"MESSAGE"),React["createElement"]("div",{
    'className':"h-px w-6 bg-gradient-to-l from-transparent to-amber-500/50"
  })),React["createElement"]("div",{
    'className':"bg-black/80 backdrop-blur-3xl p-4 rounded-2xl border border-amber-500/40 shadow-[0_10px_50px_rgba(0,0,0,0.9)] relative overflow-hidden group-hover:border-amber-500/60 transition-all duration-500"
  },React["createElement"]("div",{
    'className':"absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"
  }),React["createElement"]('p',{
    'className':"text-white text-[16px] font-bold leading-normal text-center",'style':{
      'textShadow':"0 1px 3px rgba(0,0,0,0.5)",'WebkitTextStroke':"0px",'letterSpacing':"0.05em",'fontFamily':"'Montserrat', sans-serif"
    }
  },'\x22',plainText(B["text"]),'\x22'))),bo&&React["createElement"]("div",{
    'className':"flex flex-wrap justify-center gap-2 mt-2"
  },React["createElement"]("div",{
    'className':"flex items-center gap-2 px-3 py-1 rounded-full border "+(ev?"bg-pink-500/20 border-pink-500/50":"bg-red-500/20 border-red-500/50")
  },React["createElement"](HeartIcon,{
    'className':"w-3 h-3 "+(ev?"text-pink-400":"text-red-400")
  }),React["createElement"]("span",{
    'className':"text-sm font-black "+(ev?"text-pink-100":"text-red-100")
  },(k?a5[x["userId"]]||0x0:cQ["current"][x["userId"]]||0x0)["toLocaleString"]()))),!k&&React["createElement"]("button",{
    'id':"btn-close-winner",'onClick':dW,'className':"mt-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg transition-transform transform hover:scale-110 hover:rotate-90 border-2 border-red-400",'title':"Close"
  },React["createElement"](CloseIcon,{
    'className':"w-4 h-4"
  }))))))))),b9&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
  },React["createElement"]("div",{
    'className':"bg-gray-900 border-2 border-green-500 rounded-xl w-full max-w-2xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] relative animate-scaleIn flex flex-col max-h-[90vh]"
  },React["createElement"]("button",{
    'onClick':()=>ba(![]),'className':"absolute top-4 right-4 text-gray-400 hover:text-white"
  },React["createElement"](CloseIcon,null)),React["createElement"]("div",{
    'className':"flex flex-col items-center text-center overflow-y-auto modal-scroll"
  },React["createElement"]("div",{
    'className':"w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4 border-2 border-green-500 text-green-400"
  },React["createElement"](GuideIcon,{
    'className':"w-8 h-8"
  })),React["createElement"]('h2',{
    'className':"text-2xl font-black text-white uppercase mb-2 tracking-wider"
  },"GAME GUIDE"),React["createElement"]("div",{
    'className':"flex gap-2 mb-4 bg-gray-800 p-1 rounded-lg"
  },React["createElement"]("button",{
    'onClick':()=>be("player"),'className':"px-4 py-1 rounded-md font-bold text-xs transition-all "+(bd==="player"?"bg-green-600 text-white":"text-gray-400 hover:text-white")
  },"PLAYERS"),React["createElement"]("button",{
    'onClick':()=>be("host"),'className':"px-4 py-1 rounded-md font-bold text-xs transition-all "+(bd==="host"?"bg-green-600 text-white":"text-gray-400 hover:text-white")
  },"HOST (YOU)")),React["createElement"]("div",{
    'className':"bg-gray-800/50 p-6 rounded-xl border border-gray-700 w-full text-left"
  },bd==="player"?React["createElement"]('ul',{
    'className':"space-y-3 text-gray-300 text-sm font-bold"
  },React["createElement"]('li',{
    'className':"flex gap-3"
  },React["createElement"]("span",{
    'className':"text-green-400"
  },'1.')," Send gifts to join the wheel."),React["createElement"]('li',{
    'className':"flex gap-3"
  },React["createElement"]("span",{
    'className':"text-green-400"
  },'2.')," Bigger gifts = Bigger slice on the wheel!"),React["createElement"]('li',{
    'className':"flex gap-3"
  },React["createElement"]("span",{
    'className':"text-green-400"
  },'3.')," Wait for the host to spin."),React["createElement"]('li',{
    'className':"flex gap-3"
  },React["createElement"]("span",{
    'className':"text-green-400"
  },'4.')," If the arrow lands on you, you win!")):React["createElement"]("div",{
    'className':"space-y-3 text-gray-300 text-xs font-bold"
  },React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"MIN BID:")," Minimum coins required to join."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"TIMER:")," Auto-spins the wheel when time runs out."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"ELIMINATION:")," The winner is removed from the wheel (Survivor mode)."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"MULTI ENTRIES:")," 1 Entry per Min Bid amount (e.g. 100 coins = 1 entry, 500 coins = 5 entries)."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"LOCK:")," Prevents new entries after the first spin."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"PROPORTIONAL:")," Slice size depends on donation amount."),React["createElement"]('p',null,React["createElement"]("span",{
    'className':"text-blue-400"
  },"GREEN SCREEN:")," Makes background transparent for OBS."))),React["createElement"]("button",{
    'onClick':()=>ba(![]),'className':"mt-6 px-8 py-2 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg uppercase tracking-widest transition-colors"
  },"GOT IT!")))),bk&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
  },React["createElement"]("div",{
    'className':"bg-gray-900 border-2 border-green-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-green-500/20 animate-in zoom-in-95 duration-200"
  },React["createElement"]('h3',{
    'className':"text-xl font-black text-white uppercase tracking-tighter mb-2"
  },bk["title"]),React["createElement"]('p',{
    'className':"text-gray-400 text-sm font-bold mb-6 leading-relaxed"
  },bk["message"]),React["createElement"]("div",{
    'className':"flex gap-3"
  },React["createElement"]("button",{
    'onClick':()=>bl(null),'className':"flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-black rounded-xl uppercase text-xs transition-colors"
  },"Cancel"),React["createElement"]("button",{
    'onClick':bk["onConfirm"],'className':"flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl uppercase text-xs shadow-lg shadow-green-600/30 transition-all active:scale-95"
  },"Confirm")))),bX&&React["createElement"]("div",{
    'className':"fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
  },React["createElement"]("div",{
    'className':"bg-gray-900 border-2 border-blue-500 rounded-2xl w-full max-w-2xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.3)] relative animate-scaleIn flex flex-col max-h-[85vh]"
  },React["createElement"]("button",{
    'onClick':()=>bY(![]),'className':"absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 rounded-full p-1"
  },React["createElement"](CloseIcon,null)),React["createElement"]("div",{
    'className':"flex items-center gap-3 mb-6"
  },React["createElement"]("div",{
    'className':"w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border-2 border-blue-500 text-blue-400"
  },React["createElement"](GiftIcon,{
    'className':"w-6 h-6"
  })),React["createElement"]("div",null,React["createElement"]('h2',{
    'className':"text-xl font-black text-white uppercase tracking-wider leading-none"
  },"Add Gift Preset"),React["createElement"]('p',{
    'className':"text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1"
  },"Select a gift to pin as a quick preset"))),React["createElement"]("div",{
    'className':"relative mb-6"
  },React["createElement"]("input",{
    'type':"text",'placeholder':"Search gifts (e.g. Rose, Galaxy...)",'value':c1,'onChange':ez=>c2(ez["target"]["value"]),'className':"w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold",'autoFocus':!![]
  })),React["createElement"]("div",{
    'className':"grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 overflow-y-auto pr-2 modal-scroll flex-1"
  },(window["TIKTOK_GIFTS_DB"]||[])["filter"](ez=>ez['n']["toLowerCase"]()["includes"](c1["toLowerCase"]()))["map"]((ez,eA)=>React["createElement"]("button",{
    'key':eA,'onClick':()=>cj(ez),'className':"bg-gray-800/50 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500 p-2 rounded-xl flex flex-col items-center gap-2 transition-all group"
  },React["createElement"]("div",{
    'className':"relative"
  },React["createElement"](SafeAvatar,{
    'src':ez['i'],'name':ez['n'],'className':"w-10 h-10 object-contain group-hover:scale-110 transition-transform"
  }),React["createElement"]("div",{
    'className':"absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-sm shadow-sm"
  },ez['c'])),React["createElement"]("span",{
    'className':"text-[9px] font-bold text-gray-400 group-hover:text-white truncate w-full text-center"
  },ez['n']))))))));
  
};
ReactDOM["render"](React["createElement"](LuckySpinGame,null),document["getElementById"]("root"));
