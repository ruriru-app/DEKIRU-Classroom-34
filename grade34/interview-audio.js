(function(root){
 'use strict';
 function create({onUnavailable=()=>{},onSpeaking=()=>{}}={}){
  let options={enabled:true,wordByWord:false,rate:.55},generation=0,pause=null;
  function stop(){generation++;clearTimeout(pause);pause=null;root.speechSynthesis?.cancel();onSpeaking(false);}
  function speak(text,parts){
   stop();if(!options.enabled||!text)return;
   if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){onUnavailable();return;}
   const id=generation,items=options.wordByWord?(parts?.length?parts:text.split(/\s+/)):[text];
   function play(i){if(id!==generation)return;if(i>=items.length){onSpeaking(false);return;}
    const u=new root.SpeechSynthesisUtterance(items[i]);u.lang='en-US';u.rate=options.rate;
    const voices=root.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='en-US'&&v.localService&&!/natural|online/i.test(v.name))||voices.find(v=>v.lang==='en-US'&&v.localService)||voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang?.startsWith('en')&&v.localService)||voices.find(v=>v.lang?.startsWith('en'))||null;
    u.onend=()=>{if(id!==generation)return;if(i+1<items.length)pause=setTimeout(()=>play(i+1),360);else onSpeaking(false);};
    u.onerror=()=>{if(id===generation)stop();};onSpeaking(true);root.speechSynthesis.speak(u);
   }play(0);
  }
  function setOptions(next){stop();if(typeof next.enabled==='boolean')options.enabled=next.enabled;if(typeof next.wordByWord==='boolean')options.wordByWord=next.wordByWord;if([.55,.85,1.2].includes(next.rate))options.rate=next.rate;}
  return {speak,stop,setOptions,getOptions:()=>({...options})};
 }
 root.InterviewAudio={create};
})(window);
