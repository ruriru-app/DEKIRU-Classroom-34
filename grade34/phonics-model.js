globalThis.PhonicsModel = (() => {
  const words=['apple','bear','cow','dog','egg','fish','goat','hat','ink','jet','king','lion','monkey','nest','octopus','pig','queen','rabbit','sun','tiger','umbrella','violin','witch','fox','yard','zebra'];
  const groups=[{id:'vowels',name:'母音'},{id:'unvoiced',name:'子音（無声音）'},{id:'voiced',name:'子音（有声音）'}];
  const cards=words.map((word,i)=>{const letter=String.fromCharCode(65+i);return {letter,word,group:'AEIOU'.includes(letter)?'vowels':'CFHKPQSTX'.includes(letter)?'unvoiced':'voiced',image:`assets/phonics/phonics-${letter}-${word}.png`};});
  function create(){
    const selected=new Set(cards.map(c=>c.letter));let order=[...cards],index=0;
    const items=()=>order.filter(c=>selected.has(c.letter));
    return {items,selected,
      select(letter,on){if(!cards.some(c=>c.letter===letter))return;on?selected.add(letter):selected.delete(letter);index=0;},
      selectGroup(group,on){cards.filter(c=>c.group===group).forEach(c=>on?selected.add(c.letter):selected.delete(c.letter));index=0;},
      current(){return items()[index]||null;},
      position(){return index;},
      move(delta){const n=items().length;index=n?(index+delta%n+n)%n:0;},
      open(letter){const i=items().findIndex(c=>c.letter===letter);if(i>=0)index=i;},
      ordered(){order=[...cards];index=0;},
      shuffle(random=Math.random){order=[...cards];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}index=0;}
    };
  }
  return {cards,groups,create};
})();
