(() => {
  'use strict';
  const books = {
    nh5: {title:'NEW HORIZON Elementary 5', grade:'5年生', color:'pink', units:['Hello, friends!','Happy birthday!','Can you play dodgeball?','Who is this?','Let’s go to the zoo.','At a restaurant.','Welcome to Japan!','Who is your hero?']},
    nh6: {title:'NEW HORIZON Elementary 6', grade:'6年生', color:'blue', units:['This is me!','My Daily Schedule','My Weekend','Let’s see the world.','Where is it from?','Save the animals.','My Best Memory','My Future, My Dream']}
  };
  const app = document.getElementById('app');
  function heading(title, subtitle, back) {
    return `<section class="page-heading"><button class="back-button" data-route="${back}" aria-label="戻る"><img src="../grade34/assets/ui/originals/戻る.svg" alt=""></button><div><p class="eyebrow">${subtitle}</p><h1>${title}</h1></div></section>`;
  }
  function render() {
    const [page,key,number] = location.hash.replace(/^#\/?/,'').split('/');
    const book=books[key];
    if(page==='phonics' && key==='nh5') {location.replace('../grade34/phonics.html?from=nh5');return;}
    document.title='DEKIRU Classroom for Grade 5 & 6';
    if(page==='book' && book) {
      document.title=book.title+' | DEKIRU Classroom';
      app.innerHTML=heading(book.title,book.grade,'#/')+`<section class="unit-grid">${book.units.map((title,i)=>`<button class="unit-tile ${book.color}" data-route="#/unit/${key}/${i+1}"><span>Unit ${i+1}</span><strong>${title}</strong></button>`).join('')}<button class="unit-tile activities" data-route="#/phonics/${key}"><span>${key==='nh5'?'一文字一音':'準備中'}</span><strong>Phonics</strong></button></section>`;
    } else if(book && (page==='phonics' || (page==='unit' && /^[1-8]$/.test(number)))) {
      const title=page==='phonics'?'Phonics':`Unit ${number} — ${book.units[Number(number)-1]}`;
      document.title=title+' | '+book.title;
      app.innerHTML=heading(title,book.title,'#/book/'+key)+`<section class="hero"><h2>準備中</h2><p>${page==='phonics'?'カードの収録・表示方法は、これから追加します。':'このUnitの教材は、これから追加します。'}</p></section>`;
    } else {
      app.innerHTML=`<section class="hero"><p class="eyebrow">授業をもっと楽しく、準備はもっと手軽に</p><h1>DEKIRU Classroom<br><span>for Grade 5 &amp; 6</span></h1><p>教科書を選んでください。</p></section><section class="top-grid" aria-label="教科書">${Object.entries(books).map(([key,book])=>`<button class="entry-tile ${book.color}" data-route="#/book/${key}"><span class="entry-kicker">${book.grade}</span><strong>${book.title}</strong><span>Unit一覧へ</span></button>`).join('')}</section>`;
    }
    window.scrollTo(0,0);
  }
  app.addEventListener('click',event=>{
    const target=event.target.closest('[data-route]');
    if(target) location.hash=target.dataset.route;
  });
  window.addEventListener('hashchange',render);
  render();
})();
