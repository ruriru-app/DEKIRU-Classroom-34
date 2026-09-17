/* Unit-specific content. Add definitions here; keep the common player independent. */
window.SentenceUnits={
 'lt1-4':{
  activities:[{"id":"like","title":"好きな色を伝える","example":"I like red."},{"id":"dont","title":"好きではない色を伝える","example":"I don't like red."},{"id":"like_dont","title":"好きな色と好きではない色を伝える","example":"I like red. / I don't like black."},{"id":"question","title":"質問し、Yes / No で答える","example":"Do you like red?"},{"id":"like_question","title":"自分の好みを伝えてから質問する","example":"I like red. / Do you like red?"},{"id":"dont_question","title":"好きではない色を伝えてから質問する","example":"I don't like black. / Do you like black?"}],
  subjects:['person_001','person_002'],
  verbCategories:['actions_5'],
  objectCategories:['colors','sports','desserts','drinks','fruits_vegetables'],
  defaults(activity){return {subject:'person_001',questionSubject:'person_002',responseSubject:'person_001',verb:'action5_002',object:activity==='dont_question'?'color_009':'color_002',negativeObject:activity==='dont'?'color_002':'color_009'};},
  target(activity){return ['dont','dont_question'].includes(activity)?'negativeObject':'object';},
  render({cards,selected,activity,token,row}){
  const selectableToken=(selectionKey,role,fallbackId,fallbackWord)=>{
    const source=cards.get(selected[selectionKey])||cards.get(fallbackId);
    const form=source&&role==='object'?window.SentenceForms.preference(source):source;
    return token(form?.english||fallbackWord,role,source?.id||fallbackId,'',form?.speech||form?.english||fallbackWord,selectionKey);
  };
  const subjectToken=selectableToken('subject','subject','person_001','I');
  const questionSubjectToken=selectableToken('questionSubject','subject','person_002','you');
  const responseSubjectToken=selectableToken('responseSubject','subject','person_001','I');
  const verbToken=selectableToken('verb','verb','action5_002','like');
  const objectToken=selectableToken('object','object','color_002','red');
  const negativeObjectToken=selectableToken('negativeObject','object','color_009','black');
  const likeRow=(leadingCardSpacer=false)=>row([subjectToken,verbToken,objectToken],'.','talk-statement-row',leadingCardSpacer);
  const dontRow=(spacerPositions=[])=>row([subjectToken,token("don't",'negative','','×',"don't"),verbToken,negativeObjectToken],'.','talk-statement-row',spacerPositions);
  const questionBlock=(questionObject,leadRow='',questionSpacerPositions=[])=>{
    const question=row([token('Do','neutral','','?','Do'),questionSubjectToken,verbToken,questionObject],'?','talk-question-row',questionSpacerPositions);
    const yes=row([token('Yes,','neutral','','〇','Yes'),responseSubjectToken,token('do','verb','','〇','do')],'.','talk-response-row');
    const no=row([token('No,','neutral','','×','No'),responseSubjectToken,token("don't",'negative','','×',"don't")],'.','talk-response-row');
    return '<div class="talk-question-layout"><div class="talk-question-prompts">'+leadRow+question+'</div><div class="talk-responses">'+yes+no+'</div></div>';
  };
  if(activity==='dont')return dontRow();
  else if(activity==='like_dont')return '<div class="talk-sequence-layout">'+likeRow([1])+dontRow()+'</div>';
  else if(activity==='question')return questionBlock(objectToken);
  else if(activity==='like_question')return questionBlock(objectToken,likeRow(true));
  else if(activity==='dont_question')return questionBlock(negativeObjectToken,dontRow([0]),[2]);
  else return likeRow();

  }
 }
};
