/* Forms used when expressing general preferences. Never mutate dictionary cards.
 * Explicit IDs avoid changing color orange or guessing plurals for new vocabulary.
 * Food used as a substance (milk, cabbage, cake, etc.) retains its dictionary form.
 */
window.SentenceForms=(()=>{
 const preferencePlurals={
  fruit_vegetable_001:'apples',fruit_vegetable_002:'bananas',fruit_vegetable_003:'beans',
  fruit_vegetable_006:'carrots',fruit_vegetable_007:'cherries',fruit_vegetable_009:'cucumbers',
  fruit_vegetable_010:'eggplants',fruit_vegetable_012:'green peppers',fruit_vegetable_013:'kiwi fruits',
  fruit_vegetable_014:'lemons',fruit_vegetable_016:'melons',fruit_vegetable_017:'mushrooms',
  fruit_vegetable_018:'nuts',fruit_vegetable_019:'onions',fruit_vegetable_020:'oranges',
  fruit_vegetable_021:'peaches',fruit_vegetable_022:'pineapples',fruit_vegetable_023:'potatoes',
  fruit_vegetable_025:'strawberries',fruit_vegetable_026:'tomatoes',fruit_vegetable_027:'watermelons',
  dessert_002:'donuts',dessert_003:'parfaits',dessert_008:'cream puffs'
 };
 function preference(card){
  const plural=Object.hasOwn(preferencePlurals,card.id)?preferencePlurals[card.id]:null;
  return {english:plural||card.english,speech:plural||card.speech||card.english};
 }
 return {preference};
})();
