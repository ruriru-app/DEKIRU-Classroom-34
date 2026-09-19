(function(root){
 'use strict';
 const base=new URL('.',document.currentScript.src);
 function safeReturn(value){
  const fallback=new URL('index.html#/',base);
  try{const u=new URL(value,base),allowed=[new URL('index.html',base).pathname,new URL('interview.html',base).pathname,new URL('../grade56/index.html',base).pathname];
   return u.origin===base.origin&&allowed.includes(u.pathname)&&!u.username&&!u.password?u:fallback;
  }catch{return fallback;}
 }
 function url(returnTo,classId=''){const u=new URL('class-settings.html',base);u.searchParams.set('returnTo',safeReturn(returnTo).href);if(classId)u.searchParams.set('classId',classId);return u.href;}
 root.ClassSettingsLinks={url,safeReturn};
 document.querySelector('#settings-button')?.addEventListener('click',()=>location.href=url(location.href));
})(window);
